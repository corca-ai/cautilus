#!/usr/bin/env node

import { spawnSync } from "node:child_process";
import process from "node:process";
import { resolve } from "node:path";

export const DEFAULT_GENERATED_ARTIFACTS = [
	".cautilus/claims/evidence-state.json",
	".cautilus/claims/status-summary.json",
	"docs/specs/evidence/claim-evidence-state.md",
	".cautilus/audit/surface-audit.json",
	"docs/specs/audit.spec.md",
];

function usage(exitCode = 0) {
	const text = [
		"Usage:",
		"  node ./scripts/check-generated-artifact-drift.mjs [--repo-root <dir>] [--json] [--path <path> ...]",
		"",
		"Fails when checked-in generated artifacts have uncommitted drift.",
	].join("\n");
	const out = exitCode === 0 ? process.stdout : process.stderr;
	out.write(`${text}\n`);
	process.exit(exitCode);
}

export function parseArgs(argv) {
	const args = {
		repoRoot: process.cwd(),
		json: false,
		paths: [],
	};
	for (let index = 0; index < argv.length; index += 1) {
		const arg = argv[index];
		if (arg === "-h" || arg === "--help") {
			usage(0);
		}
		if (arg === "--repo-root") {
			args.repoRoot = argv[++index] || "";
			continue;
		}
		if (arg === "--json") {
			args.json = true;
			continue;
		}
		if (arg === "--path") {
			args.paths.push(argv[++index] || "");
			continue;
		}
		throw new Error(`Unknown argument: ${arg}`);
	}
	if (!args.repoRoot) {
		throw new Error("--repo-root is required");
	}
	const paths = args.paths.filter(Boolean);
	return {
		repoRoot: resolve(args.repoRoot),
		json: args.json,
		paths: paths.length > 0 ? paths : DEFAULT_GENERATED_ARTIFACTS,
	};
}

function runGit(repoRoot, args) {
	const result = spawnSync("git", ["-C", repoRoot, ...args], {
		encoding: "utf-8",
	});
	if (result.status !== 0) {
		throw new Error(result.stderr.trim() || `git ${args.join(" ")} failed`);
	}
	return result.stdout;
}

function parsePorcelainLine(line) {
	return {
		status: line.slice(0, 2),
		path: line.slice(3).trim(),
	};
}

export function checkGeneratedArtifactDrift(repoRoot, paths = DEFAULT_GENERATED_ARTIFACTS) {
	const stdout = runGit(repoRoot, [
		"status",
		"--porcelain=v1",
		"--untracked-files=no",
		"--",
		...paths,
	]);
	const changed = stdout
		.split("\n")
		.map((line) => line.trimEnd())
		.filter(Boolean)
		.map(parsePorcelainLine);
	return {
		repoRoot,
		paths,
		changed,
		ready: changed.length === 0,
		status: changed.length === 0 ? "clean" : "generated_artifact_drift",
		suggestion:
			changed.length === 0
				? null
				: "Commit the generated artifact changes before pushing, or regenerate and commit them with the slice that changed their source.",
	};
}

function renderText(payload) {
	if (payload.ready) {
		return "generated artifact drift check: clean\n";
	}
	const lines = [
		"generated artifact drift check: uncommitted generated artifacts detected",
		"",
		...payload.changed.map((entry) => `- ${entry.status} ${entry.path}`),
		"",
		payload.suggestion,
	];
	return `${lines.join("\n")}\n`;
}

function main(argv = process.argv.slice(2)) {
	try {
		const args = parseArgs(argv);
		const payload = checkGeneratedArtifactDrift(args.repoRoot, args.paths);
		if (args.json) {
			process.stdout.write(`${JSON.stringify(payload, null, 2)}\n`);
		} else {
			process.stdout.write(renderText(payload));
		}
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
