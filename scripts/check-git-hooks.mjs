import { accessSync, constants, existsSync } from "node:fs";
import { join, resolve } from "node:path";
import { spawnSync } from "node:child_process";
import process from "node:process";

const HOOKS_PATH = ".githooks";
const PRE_PUSH_PATH = join(HOOKS_PATH, "pre-push");

function usage(exitCode = 0) {
	const text = [
		"Usage:",
		"  node ./scripts/check-git-hooks.mjs [--repo-root <dir>]",
	].join("\n");
	const out = exitCode === 0 ? process.stdout : process.stderr;
	out.write(`${text}\n`);
	process.exit(exitCode);
}

function parseArgs(argv) {
	let repoRoot = process.cwd();
	for (let index = 0; index < argv.length; index += 1) {
		const arg = argv[index];
		if (arg === "-h" || arg === "--help") {
			usage(0);
		}
		if (arg === "--repo-root") {
			repoRoot = argv[index + 1] || "";
			index += 1;
			continue;
		}
		throw new Error(`Unknown argument: ${arg}`);
	}
	if (!repoRoot) {
		throw new Error("--repo-root is required");
	}
	return { repoRoot: resolve(repoRoot) };
}

function runGit(repoRoot, args) {
	const result = spawnSync("git", ["-C", repoRoot, ...args], {
		encoding: "utf-8",
	});
	return {
		ok: result.status === 0,
		stdout: result.stdout.trim(),
		stderr: result.stderr.trim(),
	};
}

function isExecutable(path) {
	try {
		accessSync(path, constants.X_OK);
		return true;
	} catch {
		return false;
	}
}

export function checkGitHooks(repoRoot) {
	const expectedHooksPath = join(repoRoot, HOOKS_PATH);
	const prePushHook = join(repoRoot, PRE_PUSH_PATH);
	const hooksPath = runGit(repoRoot, ["config", "--get", "core.hooksPath"]);
	const checks = [
		{
			id: "hooks_path_configured",
			ok: hooksPath.ok && hooksPath.stdout === HOOKS_PATH,
			detail: hooksPath.ok
				? `core.hooksPath=${hooksPath.stdout || "<empty>"}`
				: "core.hooksPath is not configured.",
		},
		{
			id: "pre_push_exists",
			ok: existsSync(prePushHook),
			detail: existsSync(prePushHook)
				? `Found ${PRE_PUSH_PATH}.`
				: `Missing checked-in hook: ${PRE_PUSH_PATH}`,
		},
		{
			id: "pre_push_executable",
			ok: existsSync(prePushHook) && isExecutable(prePushHook),
			detail:
				existsSync(prePushHook) && isExecutable(prePushHook)
					? `${PRE_PUSH_PATH} is executable.`
					: `${PRE_PUSH_PATH} is not executable.`,
		},
	];
	const ready = checks.every((check) => check.ok);
	return {
		repoRoot,
		expectedHooksPath,
		configuredHooksPath: hooksPath.stdout || null,
		checks,
		ready,
		status: ready ? "ready" : "invalid_hooks",
		suggestions: ready ? [] : ["npm run hooks:install"],
	};
}

export function main(argv = process.argv.slice(2)) {
	try {
		const { repoRoot } = parseArgs(argv);
		const payload = checkGitHooks(repoRoot);
		process.stdout.write(`${JSON.stringify(payload, null, 2)}\n`);
		if (!payload.ready) {
			process.exit(1);
		}
	} catch (error) {
		process.stderr.write(`${error.message}\n`);
		process.exit(1);
	}
}

const entryHref = process.argv[1] ? new URL(`file://${process.argv[1]}`).href : "";
if (import.meta.url === entryHref) {
	main();
}
