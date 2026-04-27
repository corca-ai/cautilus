#!/usr/bin/env node
import { execFileSync, spawnSync } from "node:child_process";
import {
	chmodSync,
	copyFileSync,
	existsSync,
	lstatSync,
	mkdirSync,
	readlinkSync,
	rmSync,
	symlinkSync,
} from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import process from "node:process";

const SCRIPT_DIR = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(SCRIPT_DIR, "..");
const BIN_PATH = join(REPO_ROOT, "bin", "cautilus");
const RUNNER_PATH = join(REPO_ROOT, "scripts", "agent-runtime", "run-local-skill-test.mjs");
const EXCLUDED_SOURCE_PATH_PREFIXES = [".agents/skills/", ".cautilus/runs/", ".claude/"];

function fail(message) {
	process.stderr.write(`${message}\n`);
	process.exit(1);
}

function usage(exitCode = 0) {
	const text = [
		"Usage:",
		"  node ./scripts/run-self-dogfood-skill-refresh-flow-eval.mjs --repo-root <dir> --output-dir <dir> --cases-file <file> --output-file <file> [--backend codex_exec|claude_code|fixture] [--fixture-results-file <file>] [--sandbox read-only|workspace-write] [--timeout-ms <ms>] [--codex-model <model>] [--codex-reasoning-effort <level>] [--codex-config <key=value>] [--claude-model <model>] [--claude-permission-mode <mode>] [--claude-allowed-tools <rules>]",
	].join("\n");
	const out = exitCode === 0 ? process.stdout : process.stderr;
	out.write(`${text}\n`);
	process.exit(exitCode);
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

function defaultOptions() {
	return {
		repoRoot: process.cwd(),
		outputDir: null,
		casesFile: null,
		outputFile: null,
		backend: "codex_exec",
		fixtureResultsFile: null,
		sandbox: "workspace-write",
		timeoutMs: 240000,
		codexModel: null,
		codexReasoningEffort: null,
		codexConfigOverrides: [],
		claudeModel: null,
		claudePermissionMode: null,
		claudeAllowedTools: null,
		claimState: "present",
		artifactSubdir: "refresh-flow",
	};
}

const VALUE_OPTIONS = {
	"--repo-root": (options, value) => { options.repoRoot = resolve(value); },
	"--output-dir": (options, value) => { options.outputDir = resolve(value); },
	"--cases-file": (options, value) => { options.casesFile = resolve(value); },
	"--output-file": (options, value) => { options.outputFile = resolve(value); },
	"--backend": (options, value) => { options.backend = value; },
	"--fixture-results-file": (options, value) => { options.fixtureResultsFile = resolve(value); },
	"--sandbox": (options, value) => { options.sandbox = value; },
	"--codex-model": (options, value) => { options.codexModel = value; },
	"--codex-reasoning-effort": (options, value) => { options.codexReasoningEffort = value; },
	"--codex-config": (options, value) => { options.codexConfigOverrides.push(value); },
	"--claude-model": (options, value) => { options.claudeModel = value; },
	"--claude-permission-mode": (options, value) => { options.claudePermissionMode = value; },
	"--claude-allowed-tools": (options, value) => { options.claudeAllowedTools = value; },
	"--claim-state": (options, value) => { options.claimState = value; },
	"--artifact-subdir": (options, value) => { options.artifactSubdir = value; },
};

function applyArgument(options, argv, index) {
	const arg = argv[index];
	if (arg === "-h" || arg === "--help") {
		usage(0);
	}
	if (arg === "--timeout-ms") {
		options.timeoutMs = parsePositiveInteger(readRequiredValue(argv, index + 1, arg), arg);
		return index + 1;
	}
	const applyValue = VALUE_OPTIONS[arg];
	if (!applyValue) {
		fail(`Unknown argument: ${arg}`);
	}
	applyValue(options, readRequiredValue(argv, index + 1, arg));
	return index + 1;
}

function parseArgs(argv) {
	const options = defaultOptions();
	for (let index = 0; index < argv.length; index += 1) {
		index = applyArgument(options, argv, index);
	}
	for (const key of ["outputDir", "casesFile", "outputFile"]) {
		if (!options[key]) {
			fail(`--${key.replace(/[A-Z]/g, (char) => `-${char.toLowerCase()}`)} is required`);
		}
	}
	if (!["codex_exec", "claude_code", "fixture"].includes(options.backend)) {
		fail("--backend must be codex_exec, claude_code, or fixture");
	}
	if (!["read-only", "workspace-write"].includes(options.sandbox)) {
		fail("--sandbox must be read-only or workspace-write");
	}
	if (options.backend === "fixture" && !options.fixtureResultsFile) {
		fail("--fixture-results-file is required when --backend fixture");
	}
	if (!["present", "absent"].includes(options.claimState)) {
		fail("--claim-state must be present or absent");
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

function shouldMirrorPath(relativePath) {
	return !EXCLUDED_SOURCE_PATH_PREFIXES.some((prefix) => relativePath === prefix.slice(0, -1) || relativePath.startsWith(prefix));
}

function listRepoFiles(repoRoot, args) {
	const output = execFileSync("git", ["-C", repoRoot, ...args, "-z"], { encoding: "utf-8" });
	return output.split("\0").filter(Boolean);
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
	const result = spawnSync(BIN_PATH, args, {
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
}

function prepareClaimState(options, candidateRepo) {
	if (options.claimState === "absent") {
		rmSync(join(candidateRepo, ".cautilus", "claims"), { recursive: true, force: true });
	}
}

function buildRunnerArgs(options, candidateRepo) {
	const args = [
		RUNNER_PATH,
		"--repo-root",
		options.repoRoot,
		"--workspace",
		candidateRepo,
		"--cases-file",
		options.casesFile,
		"--output-file",
		options.outputFile,
		"--artifact-dir",
		join(options.outputDir, options.artifactSubdir),
		"--backend",
		options.backend,
		"--sandbox",
		options.sandbox,
		"--timeout-ms",
		String(options.timeoutMs),
	];
	if (options.fixtureResultsFile) {
		args.push("--fixture-results-file", options.fixtureResultsFile);
	}
	if (options.codexModel) {
		args.push("--codex-model", options.codexModel);
	}
	if (options.codexReasoningEffort) {
		args.push("--codex-reasoning-effort", options.codexReasoningEffort);
	}
	for (const override of options.codexConfigOverrides) {
		args.push("--codex-config", override);
	}
	if (options.claudeModel) {
		args.push("--claude-model", options.claudeModel);
	}
	if (options.claudePermissionMode) {
		args.push("--claude-permission-mode", options.claudePermissionMode);
	}
	if (options.claudeAllowedTools) {
		args.push("--claude-allowed-tools", options.claudeAllowedTools);
	}
	return args;
}

function main() {
	const options = parseArgs(process.argv.slice(2));
	mkdirSync(options.outputDir, { recursive: true });
	const candidateRepo = ensureDetachedWorktree(options.repoRoot, join(options.outputDir, "candidate"));
	syncSourceCheckout(options.repoRoot, candidateRepo);
	installCandidateSurface(options.repoRoot, candidateRepo);
	prepareClaimState(options, candidateRepo);
	const result = spawnSync(process.execPath, buildRunnerArgs(options, candidateRepo), {
		cwd: options.repoRoot,
		encoding: "utf-8",
		env: process.env,
		stdio: "inherit",
	});
	if (result.status !== 0) {
		process.exit(result.status ?? 1);
	}
}

main();
