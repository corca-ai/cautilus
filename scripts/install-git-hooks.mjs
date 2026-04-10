import { chmodSync, existsSync } from "node:fs";
import { join, resolve } from "node:path";
import { spawnSync } from "node:child_process";
import process from "node:process";

const HOOKS_PATH = ".githooks";
const PRE_PUSH_PATH = join(HOOKS_PATH, "pre-push");

function usage(exitCode = 0) {
	const text = [
		"Usage:",
		"  node ./scripts/install-git-hooks.mjs [--repo-root <dir>]",
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
	if (result.status !== 0) {
		throw new Error(result.stderr.trim() || `git ${args.join(" ")} failed`);
	}
	return result.stdout.trim();
}

export function installGitHooks(repoRoot) {
	const prePushHook = join(repoRoot, PRE_PUSH_PATH);
	if (!existsSync(prePushHook)) {
		throw new Error(`Missing checked-in hook: ${PRE_PUSH_PATH}`);
	}
	runGit(repoRoot, ["rev-parse", "--show-toplevel"]);
	chmodSync(prePushHook, 0o755);
	runGit(repoRoot, ["config", "--local", "core.hooksPath", HOOKS_PATH]);
	return {
		repoRoot,
		hooksPath: HOOKS_PATH,
		prePushHook,
		status: "installed",
	};
}

export function main(argv = process.argv.slice(2)) {
	try {
		const { repoRoot } = parseArgs(argv);
		process.stdout.write(`${JSON.stringify(installGitHooks(repoRoot), null, 2)}\n`);
	} catch (error) {
		process.stderr.write(`${error.message}\n`);
		process.exit(1);
	}
}

const entryHref = process.argv[1] ? new URL(`file://${process.argv[1]}`).href : "";
if (import.meta.url === entryHref) {
	main();
}
