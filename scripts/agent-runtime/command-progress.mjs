import { spawn } from "node:child_process";
import { writeFileSync } from "node:fs";
import process from "node:process";

const DEFAULT_HEARTBEAT_MS = 5000;

export function formatDuration(durationMs) {
	if (typeof durationMs !== "number" || Number.isNaN(durationMs)) {
		return "unknown";
	}
	if (durationMs < 1000) {
		return `${durationMs}ms`;
	}
	return `${(durationMs / 1000).toFixed(1)}s`;
}

export function summarizeCommandText(text) {
	if (typeof text !== "string") {
		return null;
	}
	const lines = text
		.split(/\r?\n/u)
		.map((line) => line.trim())
		.filter(Boolean);
	if (lines.length === 0) {
		return null;
	}
	const summary = lines.at(-1);
	return summary.length > 240 ? `${summary.slice(0, 237)}...` : summary;
}

export function ownershipHintForRepo(toolRoot, repoRoot) {
	if (toolRoot === repoRoot) {
		return "Repo-local failures are usually product-owned unless a checked-in fixture or local environment contract is broken.";
	}
	return `Repo-local adapter, artifact, or policy failures are usually consumer-owned in ${repoRoot}; treat them as product-owned only when the rendered command or Cautilus helper contract itself is wrong.`;
}

export function parseHeartbeatMs(env = process.env) {
	const raw = env.CAUTILUS_PROGRESS_HEARTBEAT_MS;
	if (!raw) {
		return DEFAULT_HEARTBEAT_MS;
	}
	const parsed = Number.parseInt(raw, 10);
	return Number.isInteger(parsed) && parsed > 0 ? parsed : DEFAULT_HEARTBEAT_MS;
}

export function createProgressLogger({ quiet = false, stream = process.stderr } = {}) {
	return (message) => {
		if (quiet) {
			return;
		}
		stream.write(`${message}\n`);
	};
}

export async function runBashCommandWithProgress({
	repoRoot,
	command,
	stdoutFile,
	stderrFile,
	log,
	startMessage,
	heartbeatMessage,
	completionLabel,
	ownershipHint = null,
	heartbeatMs = parseHeartbeatMs(),
}) {
	const startedAt = new Date();
	const startedAtMs = Date.now();
	log(startMessage);
	const child = spawn("bash", ["-lc", command], {
		cwd: repoRoot,
		env: process.env,
		stdio: ["ignore", "pipe", "pipe"],
	});
	let stdout = "";
	let stderr = "";
	child.stdout.on("data", (chunk) => {
		stdout += chunk.toString();
	});
	child.stderr.on("data", (chunk) => {
		stderr += chunk.toString();
	});
	const heartbeat = heartbeatMs > 0
		? setInterval(() => {
			log(`${heartbeatMessage} after ${formatDuration(Date.now() - startedAtMs)}`);
		}, heartbeatMs)
		: null;
	if (heartbeat && typeof heartbeat.unref === "function") {
		heartbeat.unref();
	}
	return await new Promise((resolve, reject) => {
		child.once("error", (error) => {
			if (heartbeat) {
				clearInterval(heartbeat);
			}
			reject(error);
		});
		child.once("close", (code, signal) => {
			if (heartbeat) {
				clearInterval(heartbeat);
			}
			const completedAt = new Date();
			writeFileSync(stdoutFile, stdout, "utf-8");
			writeFileSync(stderrFile, stderr, "utf-8");
			const result = {
				command,
				startedAt: startedAt.toISOString(),
				completedAt: completedAt.toISOString(),
				durationMs: completedAt.getTime() - startedAtMs,
				...(typeof code === "number" ? { exitCode: code } : {}),
				...(signal ? { signal } : {}),
				status: code === 0 ? "passed" : "failed",
				stdout,
				stderr,
				stdoutFile,
				stderrFile,
			};
			log(`${completionLabel} ${result.status} in ${formatDuration(result.durationMs)}`);
			if (result.status !== "passed") {
				log(`${completionLabel} artifacts: stdout=${stdoutFile} stderr=${stderrFile}`);
				const diagnostic = summarizeCommandText(stderr) || summarizeCommandText(stdout);
				if (diagnostic) {
					log(`${completionLabel} failure signal: ${diagnostic}`);
				}
				if (ownershipHint) {
					log(`${completionLabel} ownership hint: ${ownershipHint}`);
				}
			}
			resolve(result);
		});
	});
}
