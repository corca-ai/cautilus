import { spawn } from "node:child_process";
import { writeFileSync } from "node:fs";
import process from "node:process";

const DEFAULT_HEARTBEAT_MS = 5000;
const DEFAULT_COMMAND_TIMEOUT_MS = 15 * 60 * 1000;
const COMMAND_TIMEOUT_ENV = "CAUTILUS_SHELL_COMMAND_TIMEOUT_MS";

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

export function resolveCommandTimeoutMs(fallbackMs = DEFAULT_COMMAND_TIMEOUT_MS, env = process.env) {
	const raw = env[COMMAND_TIMEOUT_ENV];
	if (!raw) {
		return fallbackMs;
	}
	const parsed = Number.parseInt(raw, 10);
	return Number.isInteger(parsed) && parsed > 0 ? parsed : fallbackMs;
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
	timeoutMs = DEFAULT_COMMAND_TIMEOUT_MS,
}) {
	const startedAt = new Date();
	const startedAtMs = Date.now();
	log(startMessage);
	const useDetachedProcessGroup = process.platform !== "win32";
	const child = spawn("bash", ["-lc", command], {
		cwd: repoRoot,
		env: process.env,
		stdio: ["ignore", "pipe", "pipe"],
		...(useDetachedProcessGroup ? { detached: true } : {}),
	});
	let stdout = "";
	let stderr = "";
	let timedOut = false;
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
	const terminateChild = (signal) => {
		if (typeof child.pid !== "number") {
			return;
		}
		try {
			if (useDetachedProcessGroup) {
				process.kill(-child.pid, signal);
				return;
			}
			child.kill(signal);
		} catch {
			try {
				child.kill(signal);
			} catch {
				// Best-effort shutdown for an already-exited child.
			}
		}
	};
	return await new Promise((resolve, reject) => {
		const timeout = Number.isInteger(timeoutMs) && timeoutMs > 0
			? setTimeout(() => {
				timedOut = true;
				terminateChild("SIGTERM");
			}, timeoutMs)
			: null;
		let forceKill = null;
		if (timeout && typeof timeout.unref === "function") {
			timeout.unref();
		}
		const clearTimers = () => {
			if (heartbeat) {
				clearInterval(heartbeat);
			}
			if (timeout) {
				clearTimeout(timeout);
			}
			if (forceKill) {
				clearTimeout(forceKill);
				forceKill = null;
			}
		};
		if (timeout) {
			forceKill = setTimeout(() => {
				if (timedOut) {
					terminateChild("SIGKILL");
				}
			}, timeoutMs + 1000);
			if (typeof forceKill.unref === "function") {
				forceKill.unref();
			}
		}
		child.once("error", (error) => {
			clearTimers();
			reject(error);
		});
		child.once("close", (code, signal) => {
			clearTimers();
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
				status: code === 0 && !timedOut ? "passed" : "failed",
				stdout,
				stderr,
				stdoutFile,
				stderrFile,
				...(timedOut ? { timedOut: true, error: `command timed out after ${timeoutMs}ms` } : {}),
			};
			log(`${completionLabel} ${result.status} in ${formatDuration(result.durationMs)}`);
			if (result.status !== "passed") {
				log(`${completionLabel} artifacts: stdout=${stdoutFile} stderr=${stderrFile}`);
				const diagnostic = result.error || summarizeCommandText(stderr) || summarizeCommandText(stdout);
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
