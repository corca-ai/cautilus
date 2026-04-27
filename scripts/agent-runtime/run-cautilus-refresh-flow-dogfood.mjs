#!/usr/bin/env node
import { execFileSync, spawnSync } from "node:child_process";
import {
	chmodSync,
	copyFileSync,
	existsSync,
	lstatSync,
	mkdirSync,
	readFileSync,
	readlinkSync,
	rmSync,
	symlinkSync,
	writeFileSync,
} from "node:fs";
import { dirname, join, resolve } from "node:path";
import process from "node:process";

import { auditRefreshFlowLogText } from "./audit-cautilus-refresh-flow-log.mjs";
import { writeTextOutput } from "./output-files.mjs";

const EXCLUDED_SOURCE_PATH_PREFIXES = [".agents/skills/", ".cautilus/runs/", ".claude/"];
const DEFAULT_MODEL = "gpt-5.4-mini";
const DEFAULT_REASONING_EFFORT = "low";

function fail(message) {
	process.stderr.write(`${message}\n`);
	process.exit(1);
}

function usage(exitCode = 0) {
	const text = [
		"Usage:",
		"  node scripts/agent-runtime/run-cautilus-refresh-flow-dogfood.mjs --repo-root <dir> --output-dir <dir> [--model <model>] [--reasoning-effort <level>] [--timeout-ms <ms>]",
	].join("\n");
	const out = exitCode === 0 ? process.stdout : process.stderr;
	out.write(`${text}\n`);
	process.exit(exitCode);
}

function defaultOptions() {
	return {
		repoRoot: process.cwd(),
		outputDir: null,
		model: DEFAULT_MODEL,
		reasoningEffort: DEFAULT_REASONING_EFFORT,
		timeoutMs: 240000,
	};
}

function readRequiredValue(argv, index, option) {
	const value = argv[index];
	if (!value) {
		fail(`Missing value for ${option}`);
	}
	return value;
}

function parsePositiveInteger(value, option) {
	const parsed = Number(value);
	if (!Number.isInteger(parsed) || parsed <= 0) {
		fail(`${option} must be a positive integer`);
	}
	return parsed;
}

function parseArgs(argv) {
	const options = defaultOptions();
	for (let index = 0; index < argv.length; index += 1) {
		const arg = argv[index];
		switch (arg) {
			case "-h":
			case "--help":
				usage(0);
				break;
			case "--repo-root":
				options.repoRoot = resolve(readRequiredValue(argv, ++index, arg));
				break;
			case "--output-dir":
				options.outputDir = resolve(readRequiredValue(argv, ++index, arg));
				break;
			case "--model":
				options.model = readRequiredValue(argv, ++index, arg);
				break;
			case "--reasoning-effort":
				options.reasoningEffort = readRequiredValue(argv, ++index, arg);
				break;
			case "--timeout-ms":
				options.timeoutMs = parsePositiveInteger(readRequiredValue(argv, ++index, arg), arg);
				break;
			default:
				fail(`Unknown argument: ${arg}`);
		}
	}
	if (!options.outputDir) {
		fail("--output-dir is required");
	}
	return options;
}

function runGit(repoRoot, args) {
	return execFileSync("git", ["-C", repoRoot, ...args], { encoding: "utf-8" }).trim();
}

function removeExistingWorktree(repoRoot, worktreePath) {
	const porcelain = runGit(repoRoot, ["worktree", "list", "--porcelain"]);
	for (const block of porcelain.split("\n\n").filter(Boolean)) {
		const worktreeLine = block.split("\n").find((line) => line.startsWith("worktree "));
		if (!worktreeLine) {
			continue;
		}
		const listedPath = worktreeLine.slice("worktree ".length).trim();
		if (resolve(listedPath) === resolve(worktreePath)) {
			execFileSync("git", ["-C", repoRoot, "worktree", "remove", "--force", worktreePath], { encoding: "utf-8" });
			return;
		}
	}
}

function ensureDetachedWorktree(repoRoot, worktreePath, ref = "HEAD") {
	removeExistingWorktree(repoRoot, worktreePath);
	if (existsSync(worktreePath)) {
		rmSync(worktreePath, { recursive: true, force: true });
	}
	mkdirSync(dirname(worktreePath), { recursive: true });
	execFileSync("git", ["-C", repoRoot, "worktree", "add", "--detach", worktreePath, ref], { encoding: "utf-8" });
	return worktreePath;
}

function listRepoFiles(repoRoot, args) {
	const output = execFileSync("git", ["-C", repoRoot, ...args, "-z"], { encoding: "utf-8" });
	return output.split("\0").filter(Boolean);
}

function shouldMirrorPath(relativePath) {
	return !EXCLUDED_SOURCE_PATH_PREFIXES.some((prefix) => relativePath === prefix.slice(0, -1) || relativePath.startsWith(prefix));
}

function mirrorSourceEntry(sourcePath, targetPath) {
	rmSync(targetPath, { recursive: true, force: true });
	mkdirSync(dirname(targetPath), { recursive: true });
	const stat = lstatSync(sourcePath);
	if (stat.isSymbolicLink()) {
		symlinkSync(readlinkSync(sourcePath), targetPath);
		return;
	}
	copyFileSync(sourcePath, targetPath);
	chmodSync(targetPath, stat.mode);
}

function syncSourceCheckout(repoRoot, candidateRepo) {
	for (const relativePath of listRepoFiles(repoRoot, ["ls-files", "--cached", "--others", "--exclude-standard"])) {
		if (!shouldMirrorPath(relativePath)) {
			continue;
		}
		const sourcePath = join(repoRoot, relativePath);
		if (existsSync(sourcePath)) {
			mirrorSourceEntry(sourcePath, join(candidateRepo, relativePath));
		}
	}
	for (const relativePath of listRepoFiles(repoRoot, ["ls-files", "--deleted"])) {
		if (shouldMirrorPath(relativePath)) {
			rmSync(join(candidateRepo, relativePath), { recursive: true, force: true });
		}
	}
}

function runCautilus(sourceRepoRoot, args) {
	const result = spawnSync(join(sourceRepoRoot, "bin", "cautilus"), args, {
		cwd: sourceRepoRoot,
		encoding: "utf-8",
		env: process.env,
	});
	if (result.status !== 0) {
		fail(result.stderr || result.stdout || `cautilus ${args.join(" ")} failed`);
	}
	return result;
}

function installCandidateSurface(sourceRepoRoot, candidateRepo) {
	runCautilus(sourceRepoRoot, ["install", "--repo-root", candidateRepo, "--overwrite"]);
	runCautilus(sourceRepoRoot, ["doctor", "--repo-root", candidateRepo, "--scope", "agent-surface"]);
	execFileSync("git", ["-C", candidateRepo, "config", "user.email", "cautilus@example.com"]);
	execFileSync("git", ["-C", candidateRepo, "config", "user.name", "Cautilus Dogfood"]);
}

function runCodexExec(args, { cwd, timeoutMs }) {
	const result = spawnSync("codex", args, {
		cwd,
		encoding: "utf-8",
		env: process.env,
		timeout: timeoutMs,
		maxBuffer: 20 * 1024 * 1024,
	});
	if (result.error) {
		fail(result.error.message);
	}
	return result;
}

function extractThreadId(jsonlText) {
	for (const line of jsonlText.split(/\r?\n/)) {
		if (!line.trim()) {
			continue;
		}
		try {
			const event = JSON.parse(line);
			if (event.type === "thread.started" && typeof event.thread_id === "string") {
				return event.thread_id;
			}
		} catch {
			continue;
		}
	}
	throw new Error("codex exec JSONL did not include thread.started");
}

function codexExecArgs(options, candidateRepo, prompt) {
	return [
		"exec",
		"-C",
		candidateRepo,
		"--sandbox",
		"workspace-write",
		"--json",
		"-m",
		options.model,
		"-c",
		`model_reasoning_effort='${options.reasoningEffort}'`,
		prompt,
	];
}

function renderSkillInvocationPrompt(candidateRepo) {
	const skillPath = join(candidateRepo, ".agents", "skills", "cautilus", "SKILL.md");
	const skillBody = readFileSync(skillPath, "utf-8");
	return [
		"$cautilus",
		"",
		"<skill>",
		"<name>cautilus</name>",
		`<path>${skillPath}</path>`,
		skillBody,
		"</skill>",
	].join("\n");
}

function codexResumeArgs(options, threadId, prompt) {
	return [
		"exec",
		"resume",
		threadId,
		"--json",
		"-m",
		options.model,
		"-c",
		`model_reasoning_effort='${options.reasoningEffort}'`,
		prompt,
	];
}

function main() {
	const options = parseArgs(process.argv.slice(2));
	mkdirSync(options.outputDir, { recursive: true });
	const candidateRepo = ensureDetachedWorktree(options.repoRoot, join(options.outputDir, "candidate"));
	syncSourceCheckout(options.repoRoot, candidateRepo);
	installCandidateSurface(options.repoRoot, candidateRepo);

	const first = runCodexExec(codexExecArgs(options, candidateRepo, renderSkillInvocationPrompt(candidateRepo)), {
		cwd: options.repoRoot,
		timeoutMs: options.timeoutMs,
	});
	writeFileSync(join(options.outputDir, "turn-1.jsonl"), first.stdout, "utf-8");
	writeFileSync(join(options.outputDir, "turn-1.stderr"), first.stderr, "utf-8");
	if (first.status !== 0) {
		fail(first.stderr || first.stdout || "first codex exec turn failed");
	}
	const threadId = extractThreadId(first.stdout);
	writeFileSync(join(options.outputDir, "thread-id.txt"), `${threadId}\n`, "utf-8");

	const second = runCodexExec(codexResumeArgs(options, threadId, "1"), {
		cwd: candidateRepo,
		timeoutMs: options.timeoutMs,
	});
	writeFileSync(join(options.outputDir, "turn-2.jsonl"), second.stdout, "utf-8");
	writeFileSync(join(options.outputDir, "turn-2.stderr"), second.stderr, "utf-8");
	if (second.status !== 0) {
		fail(second.stderr || second.stdout || "second codex exec turn failed");
	}

	const combined = `${first.stdout.trim()}\n${second.stdout.trim()}\n`;
	const combinedPath = join(options.outputDir, "combined.jsonl");
	writeFileSync(combinedPath, combined, "utf-8");
	const audit = auditRefreshFlowLogText(combined);
	writeTextOutput(join(options.outputDir, "audit.json"), `${JSON.stringify(audit, null, 2)}\n`);
	const summary = {
		schemaVersion: "cautilus.refresh_flow_dogfood.v1",
		status: audit.status,
		threadId,
		candidateRepo,
		combinedLog: combinedPath,
		auditPath: join(options.outputDir, "audit.json"),
		commandCount: audit.commandCount,
		findings: audit.findings,
	};
	writeTextOutput(join(options.outputDir, "summary.json"), `${JSON.stringify(summary, null, 2)}\n`);
	process.stdout.write(`${JSON.stringify(summary, null, 2)}\n`);
	process.exitCode = audit.status === "passed" ? 0 : 1;
}

main();
