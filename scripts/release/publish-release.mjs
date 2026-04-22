import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import process from "node:process";
import { pathToFileURL } from "node:url";
import { spawnSync } from "node:child_process";

import { normalizeVersion } from "./bump-version.mjs";

function usage(exitCode = 0) {
	const stream = exitCode === 0 ? process.stdout : process.stderr;
	stream.write(
		[
			"Usage:",
			"  node ./scripts/release/publish-release.mjs --version <0.5.1> [--repo-root <dir>] [--remote <name>] [--dry-run] [--json]",
		].join("\n") + "\n",
	);
	process.exit(exitCode);
}

function readRequiredValue(argv, index, option) {
	const value = argv[index + 1] || "";
	if (!value) {
		throw new Error(`${option} requires a value`);
	}
	return value;
}

function applyArg(options, argv, index) {
	const arg = argv[index];
	if (arg === "-h" || arg === "--help") {
		usage(0);
	}
	const flagMap = {
		"--dry-run": () => {
			options.dryRun = true;
			return index;
		},
		"--json": () => {
			options.json = true;
			return index;
		},
	};
	const valueMap = {
		"--repo-root": "repoRoot",
		"--remote": "remote",
		"--version": "version",
	};
	if (flagMap[arg]) {
		return flagMap[arg]();
	}
	const target = valueMap[arg];
	if (!target) {
		throw new Error(`Unknown argument: ${arg}`);
	}
	const value = readRequiredValue(argv, index, arg);
	options[target] = target === "version" ? normalizeVersion(value) : value;
	return index + 1;
}

function parseArgs(argv = process.argv.slice(2)) {
	const options = {
		repoRoot: process.cwd(),
		remote: "origin",
		version: "",
		dryRun: false,
		json: false,
	};
	for (let index = 0; index < argv.length; index += 1) {
		index = applyArg(options, argv, index);
	}
	if (!options.version) {
		throw new Error("--version is required");
	}
	return {
		...options,
		repoRoot: resolve(options.repoRoot),
	};
}

function runGit(repoRoot, args, { allowFailure = false } = {}) {
	const result = spawnSync("git", ["-C", repoRoot, ...args], { encoding: "utf-8" });
	if (result.status !== 0 && !allowFailure) {
		const detail = (result.stderr || result.stdout || "").trim();
		throw new Error(`git ${args.join(" ")} failed${detail ? `: ${detail}` : ""}`);
	}
	return result;
}

function gitStatus(repoRoot) {
	return runGit(repoRoot, ["status", "--short"]).stdout.split(/\r?\n/).filter(Boolean);
}

function currentBranch(repoRoot) {
	const branch = runGit(repoRoot, ["rev-parse", "--abbrev-ref", "HEAD"]).stdout.trim();
	if (!branch || branch === "HEAD") {
		throw new Error("release publish requires a named branch, not a detached HEAD");
	}
	return branch;
}

function headSha(repoRoot) {
	return runGit(repoRoot, ["rev-parse", "HEAD"]).stdout.trim();
}

function localTagSha(repoRoot, tagName) {
	const result = runGit(repoRoot, ["rev-parse", "--verify", `refs/tags/${tagName}`], { allowFailure: true });
	return result.status === 0 ? result.stdout.trim() : null;
}

function remoteTagExists(repoRoot, remote, tagName) {
	const result = runGit(repoRoot, ["ls-remote", "--tags", remote, `refs/tags/${tagName}`], { allowFailure: true });
	if (result.status !== 0) {
		throw new Error(`failed to query ${remote} for ${tagName}: ${(result.stderr || result.stdout || "").trim()}`);
	}
	return result.stdout.trim().length > 0;
}

function readJson(repoRoot, relativePath) {
	return JSON.parse(readFileSync(resolve(repoRoot, relativePath), "utf-8"));
}

export function readReleaseSurfaceVersions(repoRoot) {
	const packageJson = readJson(repoRoot, "package.json");
	const packageLock = readJson(repoRoot, "package-lock.json");
	const marketplace = readJson(repoRoot, ".claude-plugin/marketplace.json");
	const marketplacePlugin = Array.isArray(marketplace.plugins)
		? marketplace.plugins.find((plugin) => plugin?.name === "cautilus")
		: null;
	return {
		packageJson: normalizeVersion(packageJson.version),
		packageLock: normalizeVersion(packageLock.version),
		packageLockRootPackage: normalizeVersion(packageLock.packages?.[""]?.version),
		claudeMarketplaceMetadata: normalizeVersion(marketplace.metadata?.version),
		claudeMarketplacePlugin: normalizeVersion(marketplacePlugin?.version),
		packagedClaudePlugin: normalizeVersion(readJson(repoRoot, "plugins/cautilus/.claude-plugin/plugin.json").version),
		packagedCodexPlugin: normalizeVersion(readJson(repoRoot, "plugins/cautilus/.codex-plugin/plugin.json").version),
	};
}

export function detectReleaseSurfaceDrift(surfaceVersions, expectedVersion) {
	return Object.entries(surfaceVersions)
		.filter(([, actualVersion]) => actualVersion !== expectedVersion)
		.map(([surface, actualVersion]) => `${surface}=${actualVersion} != expected=${expectedVersion}`);
}

export function publishPreparedRelease({ repoRoot, version, remote = "origin", dryRun = false }) {
	const expectedVersion = normalizeVersion(version);
	const status = gitStatus(repoRoot);
	if (status.length > 0) {
		throw new Error(`release publish requires a clean worktree before tagging.\n${status.join("\n")}`);
	}
	const branch = currentBranch(repoRoot);
	const currentHead = headSha(repoRoot);
	const surfaceVersions = readReleaseSurfaceVersions(repoRoot);
	const drift = detectReleaseSurfaceDrift(surfaceVersions, expectedVersion);
	if (drift.length > 0) {
		throw new Error(`release surface drift detected:\n${drift.join("\n")}`);
	}
	const tagName = `v${expectedVersion}`;
	if (localTagSha(repoRoot, tagName)) {
		throw new Error(`tag ${tagName} already exists locally`);
	}
	if (remoteTagExists(repoRoot, remote, tagName)) {
		throw new Error(`tag ${tagName} already exists on ${remote}`);
	}
	const payload = {
		version: expectedVersion,
		tagName,
		repoRoot,
		remote,
		branch,
		headSha: currentHead,
		dryRun,
	};
	if (dryRun) {
		return payload;
	}
	runGit(repoRoot, ["push", remote, branch]);
	runGit(repoRoot, ["tag", tagName, currentHead]);
	const createdTagSha = localTagSha(repoRoot, tagName);
	if (createdTagSha !== currentHead) {
		throw new Error(`tag ${tagName} does not point at HEAD ${currentHead}`);
	}
	runGit(repoRoot, ["push", remote, `refs/tags/${tagName}`]);
	return payload;
}

function renderText(result) {
	return [
		`Prepared release publish for ${result.tagName}${result.dryRun ? " (dry-run)" : ""}.`,
		`- branch: ${result.branch}`,
		`- remote: ${result.remote}`,
		`- head: ${result.headSha}`,
	].join("\n");
}

export function main(argv = process.argv.slice(2)) {
	try {
		const options = parseArgs(argv);
		const result = publishPreparedRelease(options);
		if (options.json) {
			process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
			return;
		}
		process.stdout.write(`${renderText(result)}\n`);
	} catch (error) {
		process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
		process.exit(1);
	}
}

const entryHref = process.argv[1] ? pathToFileURL(resolve(process.argv[1])).href : "";
if (import.meta.url === entryHref) {
	main();
}
