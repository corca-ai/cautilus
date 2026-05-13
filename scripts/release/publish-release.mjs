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
			"  node ./scripts/release/publish-release.mjs --version <0.5.1> [--repo-root <dir>] [--remote <name>] [--target-branch <branch>] [--dry-run] [--json]",
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
		"--target-branch": "targetBranch",
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
		targetBranch: "",
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

function currentBranch(repoRoot, { allowDetached = false } = {}) {
	const branch = runGit(repoRoot, ["rev-parse", "--abbrev-ref", "HEAD"]).stdout.trim();
	if (!branch || branch === "HEAD") {
		if (allowDetached) {
			return "HEAD";
		}
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

function remoteRefSha(repoRoot, remote, ref) {
	const result = runGit(repoRoot, ["ls-remote", remote, ref], { allowFailure: true });
	if (result.status !== 0) {
		throw new Error(`failed to query ${remote} for ${ref}: ${(result.stderr || result.stdout || "").trim()}`);
	}
	const line = result.stdout.trim().split(/\r?\n/).find(Boolean);
	return line ? line.split(/\s+/)[0] : null;
}

function remoteTagExists(repoRoot, remote, tagName) {
	return remoteRefSha(repoRoot, remote, `refs/tags/${tagName}`) !== null;
}

function assertCleanWorktree(repoRoot) {
	const status = gitStatus(repoRoot);
	if (status.length > 0) {
		throw new Error(`release publish requires a clean worktree before tagging.\n${status.join("\n")}`);
	}
}

function assertReleaseSurfaceMatches(repoRoot, expectedVersion) {
	const surfaceVersions = readReleaseSurfaceVersions(repoRoot);
	const drift = detectReleaseSurfaceDrift(surfaceVersions, expectedVersion);
	if (drift.length > 0) {
		throw new Error(`release surface drift detected:\n${drift.join("\n")}`);
	}
}

function readText(repoRoot, relativePath) {
	try {
		return readFileSync(resolve(repoRoot, relativePath), "utf-8");
	} catch (error) {
		throw new Error(
			`release narrative audit requires ${relativePath}: ${
				error instanceof Error ? error.message : String(error)
			}`,
		);
	}
}

export class ReleasePublishError extends Error {
	constructor(message, result, options = {}) {
		super(message, options);
		this.name = "ReleasePublishError";
		this.result = result;
	}
}

function releaseRecordDeclarationPattern(tagName) {
	return new RegExp(`^Released Cautilus \`${tagName.replaceAll(".", "\\.")}\`\\.$`, "m");
}

function findSourceTreeReleaseRecordPointers(workflow) {
	const patterns = [
		/charness-artifacts\/release\/latest\.md/g,
		/\brelease\/latest\.md\b/g,
		/\blatest\.md\b[^"\n]*(?:at this tag|release scope|verification notes|release notes)/gi,
		/\bcat\b[^"\n]*charness-artifacts\/release\/latest\.md/g,
	];
	const fragments = [];
	for (const pattern of patterns) {
		for (const match of workflow.matchAll(pattern)) {
			fragments.push(match[0]);
		}
	}
	return [...new Set(fragments)];
}

export function auditReleaseNarrative(repoRoot, expectedVersion) {
	const tagName = `v${normalizeVersion(expectedVersion)}`;
	const releaseRecordPath = "charness-artifacts/release/latest.md";
	const workflowPath = ".github/workflows/release-artifacts.yml";
	const releaseRecord = readText(repoRoot, releaseRecordPath);
	const workflow = readText(repoRoot, workflowPath);
	const disallowedFragments = findSourceTreeReleaseRecordPointers(workflow);
	return {
		tagName,
		releaseRecordPath,
		workflowPath,
		releaseRecordMentionsTarget: releaseRecord.includes(tagName),
		releaseRecordDeclaresTarget: releaseRecordDeclarationPattern(tagName).test(releaseRecord),
		releaseRecordHasScope: releaseRecord.includes("## Release Scope"),
		releaseRecordHasVerification: releaseRecord.includes("## Verification"),
		publicNotesTemplateSelfContained:
			workflow.includes('echo "# Cautilus ${VERSION}"') &&
			workflow.includes('echo "Public release surface for ${VERSION}."') &&
			workflow.includes("source archive checksum") &&
			workflow.includes("binary artifacts") &&
			workflow.includes("binary checksum manifest"),
		disallowedFragments,
	};
}

function assertReleaseNarrativeReady(repoRoot, expectedVersion) {
	const audit = auditReleaseNarrative(repoRoot, expectedVersion);
	const problems = [];
	if (!audit.releaseRecordMentionsTarget) {
		problems.push(`${audit.releaseRecordPath} does not mention ${audit.tagName}`);
	}
	if (!audit.releaseRecordDeclaresTarget) {
		problems.push(`${audit.releaseRecordPath} does not declare Released Cautilus \`${audit.tagName}\``);
	}
	if (!audit.releaseRecordHasScope) {
		problems.push(`${audit.releaseRecordPath} is missing ## Release Scope`);
	}
	if (!audit.releaseRecordHasVerification) {
		problems.push(`${audit.releaseRecordPath} is missing ## Verification`);
	}
	if (!audit.publicNotesTemplateSelfContained) {
		problems.push(`${audit.workflowPath} does not generate self-contained public release notes`);
	}
	for (const fragment of audit.disallowedFragments) {
		problems.push(`${audit.workflowPath} contains unverifiable release-note pointer: ${fragment}`);
	}
	if (problems.length > 0) {
		throw new Error(`release narrative audit failed:\n${problems.join("\n")}`);
	}
	return audit;
}

function assertTagAvailable(repoRoot, remote, tagName) {
	if (localTagSha(repoRoot, tagName)) {
		throw new Error(`tag ${tagName} already exists locally`);
	}
	if (remoteTagExists(repoRoot, remote, tagName)) {
		throw new Error(`tag ${tagName} already exists on ${remote}`);
	}
}

function throwReleasePublishError(error, payload) {
	throw new ReleasePublishError(error instanceof Error ? error.message : String(error), payload, { cause: error });
}

function assertRemoteRef(repoRoot, remote, ref, expectedSha, label) {
	const remoteSha = remoteRefSha(repoRoot, remote, ref);
	if (remoteSha !== expectedSha) {
		throw new Error(`${label} points at ${remoteSha || "<missing>"} instead of ${expectedSha}`);
	}
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

export function publishPreparedRelease({ repoRoot, version, remote = "origin", targetBranch = "", dryRun = false }) {
	const expectedVersion = normalizeVersion(version);
	assertCleanWorktree(repoRoot);
	const branch = currentBranch(repoRoot, { allowDetached: Boolean(targetBranch) });
	const publishBranch = targetBranch || branch;
	const currentHead = headSha(repoRoot);
	assertReleaseSurfaceMatches(repoRoot, expectedVersion);
	const narrativeAudit = assertReleaseNarrativeReady(repoRoot, expectedVersion);
	const tagName = `v${expectedVersion}`;
	assertTagAvailable(repoRoot, remote, tagName);
	const releaseState = {
		localPrepared: "verified",
		auditNarrativeCommitted: "verified",
		branchPushed: dryRun ? "not-started" : "pending",
		tagPushed: dryRun ? "not-started" : "pending",
		workflowPublication: dryRun ? "not-started" : "pending-tag-workflow",
		publicReleaseVerification: dryRun ? "not-started" : "pending-tag-workflow",
	};
	const payload = {
		version: expectedVersion,
		tagName,
		repoRoot,
		remote,
		branch,
		targetBranch: publishBranch,
		branchRefspec: `HEAD:refs/heads/${publishBranch}`,
		headSha: currentHead,
		dryRun,
		releaseState,
		narrativeAudit,
	};
	if (dryRun) {
		return payload;
	}
	pushBranchOrThrow({ repoRoot, remote, publishBranch, currentHead, releaseState, payload });
	pushTagOrThrow({ repoRoot, remote, tagName, currentHead, releaseState, payload });
	return payload;
}

function pushBranchOrThrow({ repoRoot, remote, publishBranch, currentHead, releaseState, payload }) {
	try {
		runGit(repoRoot, ["push", remote, `HEAD:refs/heads/${publishBranch}`]);
		assertRemoteRef(repoRoot, remote, `refs/heads/${publishBranch}`, currentHead, `remote ${remote}/${publishBranch}`);
		releaseState.branchPushed = "verified";
	} catch (error) {
		releaseState.branchPushed = "failed";
		throwReleasePublishError(error, payload);
	}
}

function pushTagOrThrow({ repoRoot, remote, tagName, currentHead, releaseState, payload }) {
	try {
		runGit(repoRoot, ["tag", tagName, currentHead]);
		const createdTagSha = localTagSha(repoRoot, tagName);
		if (createdTagSha !== currentHead) {
			throw new Error(`tag ${tagName} does not point at HEAD ${currentHead}`);
		}
		runGit(repoRoot, ["push", remote, `refs/tags/${tagName}`]);
		assertRemoteRef(repoRoot, remote, `refs/tags/${tagName}`, currentHead, `remote tag ${tagName}`);
		releaseState.tagPushed = "verified";
	} catch (error) {
		releaseState.tagPushed = "failed";
		throwReleasePublishError(error, payload);
	}
}

function renderStateLines(result) {
	return [
		`- branch: ${result.branch}`,
		`- target branch: ${result.targetBranch}`,
		`- branch refspec: ${result.branchRefspec}`,
		`- remote: ${result.remote}`,
		`- head: ${result.headSha}`,
		`- local prepared: ${result.releaseState.localPrepared}`,
		`- audit narrative committed: ${result.releaseState.auditNarrativeCommitted}`,
		`- branch pushed: ${result.releaseState.branchPushed}`,
		`- tag pushed: ${result.releaseState.tagPushed}`,
		`- workflow publication: ${result.releaseState.workflowPublication}`,
		`- public release verification: ${result.releaseState.publicReleaseVerification}`,
	];
}

function renderText(result) {
	return [
		`Prepared release publish for ${result.tagName}${result.dryRun ? " (dry-run)" : ""}.`,
		...renderStateLines(result),
	].join("\n");
}

function renderFailureText(error) {
	return [
		error.message,
		"Release state at failure:",
		...renderStateLines(error.result),
	].join("\n");
}

export function main(argv = process.argv.slice(2)) {
	let options = null;
	try {
		options = parseArgs(argv);
		const result = publishPreparedRelease(options);
		if (options.json) {
			process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
			return;
		}
		process.stdout.write(`${renderText(result)}\n`);
	} catch (error) {
		if (error instanceof ReleasePublishError) {
			if (options?.json) {
				process.stderr.write(`${JSON.stringify({ ok: false, error: error.message, ...error.result }, null, 2)}\n`);
			} else {
				process.stderr.write(`${renderFailureText(error)}\n`);
			}
			process.exit(1);
		}
		process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
		process.exit(1);
	}
}

const entryHref = process.argv[1] ? pathToFileURL(resolve(process.argv[1])).href : "";
if (import.meta.url === entryHref) {
	main();
}
