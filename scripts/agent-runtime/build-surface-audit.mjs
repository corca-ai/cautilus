#!/usr/bin/env node

// Generate the Surface Honesty Audit manifest and navigable index from the apex
// spec + proof-route registry, and (in --check mode) fail when the generated
// artifacts drifted or any apex badge over-claims relative to its proof route.
//
// Build:  node scripts/agent-runtime/build-surface-audit.mjs [--repo-root <dir>]
// Check:  node scripts/agent-runtime/build-surface-audit.mjs --check
//
// The honesty gate lives in --check: it is wired into `npm run lint` and the
// standing `npm run verify` so a dishonest or stale badge cannot ship green.

import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import process from "node:process";
import { pathToFileURL } from "node:url";

import {
	buildManifest,
	countSpecChecks,
	extractCheckedFilePaths,
	extractSubstantiveFilePaths,
	renderAuditMarkdown,
} from "./surface-audit-lib.mjs";

export const APEX_PATH = "docs/specs/index.spec.md";
export const REGISTRY_PATH = "docs/specs/audit/surface-registry.json";
export const MANIFEST_PATH = ".cautilus/audit/surface-audit.json";
export const AUDIT_PAGE_PATH = "docs/specs/generated/audit.spec.md";

function usage(exitCode = 0) {
	const text = [
		"Usage:",
		"  node scripts/agent-runtime/build-surface-audit.mjs [--repo-root <dir>] [--json]",
		"  node scripts/agent-runtime/build-surface-audit.mjs --check [--repo-root <dir>] [--json]",
		"",
		"Build regenerates the audit manifest and docs/specs/generated/audit.spec.md from the apex",
		"badges and proof-route registry. --check regenerates in memory and fails on drift",
		"or when any apex badge over-claims relative to its proof route.",
	].join("\n");
	(exitCode === 0 ? process.stdout : process.stderr).write(`${text}\n`);
	process.exit(exitCode);
}

export function parseArgs(argv) {
	const args = { repoRoot: process.cwd(), check: false, json: false };
	for (let index = 0; index < argv.length; index += 1) {
		const arg = argv[index];
		if (arg === "-h" || arg === "--help") {
			usage(0);
		} else if (arg === "--repo-root") {
			args.repoRoot = argv[++index] || "";
		} else if (arg === "--check") {
			args.check = true;
		} else if (arg === "--json") {
			args.json = true;
		} else {
			throw new Error(`Unknown argument: ${arg}`);
		}
	}
	if (!args.repoRoot) {
		throw new Error("--repo-root is required");
	}
	args.repoRoot = resolve(args.repoRoot);
	return args;
}

function serializeManifest(manifest) {
	return `${JSON.stringify(manifest, null, 2)}\n`;
}

export function generate(repoRoot) {
	const apexAbs = resolve(repoRoot, APEX_PATH);
	const registryAbs = resolve(repoRoot, REGISTRY_PATH);
	if (!existsSync(apexAbs)) {
		throw new Error(`Missing apex spec: ${APEX_PATH}`);
	}
	if (!existsSync(registryAbs)) {
		throw new Error(`Missing audit registry: ${REGISTRY_PATH}`);
	}
	const apexMarkdown = readFileSync(apexAbs, "utf-8");
	const registryDoc = JSON.parse(readFileSync(registryAbs, "utf-8"));
	const registry = registryDoc.routes || [];

	const fileExists = (path) => existsSync(resolve(repoRoot, path));
	const readCheckCount = (path) => countSpecChecks(readFileSync(resolve(repoRoot, path), "utf-8"));
	const readReferencedFilePaths = (path) =>
		extractCheckedFilePaths(readFileSync(resolve(repoRoot, path), "utf-8"));
	const readSubstantiveFilePaths = (path) =>
		extractSubstantiveFilePaths(readFileSync(resolve(repoRoot, path), "utf-8"));

	const manifest = buildManifest({
		apexPath: APEX_PATH,
		registryPath: REGISTRY_PATH,
		apexMarkdown,
		registry,
		fileExists,
		readCheckCount,
		readReferencedFilePaths,
		readSubstantiveFilePaths,
	});
	const manifestText = serializeManifest(manifest);
	const pageText = `${renderAuditMarkdown(manifest, { manifestPath: MANIFEST_PATH })}\n`;
	return { manifest, manifestText, pageText };
}

function writeFileEnsuringDir(absPath, text) {
	mkdirSync(dirname(absPath), { recursive: true });
	writeFileSync(absPath, text, "utf-8");
}

function readIfExists(absPath) {
	return existsSync(absPath) ? readFileSync(absPath, "utf-8") : null;
}

function runBuild(args) {
	const { manifest, manifestText, pageText } = generate(args.repoRoot);
	writeFileEnsuringDir(resolve(args.repoRoot, MANIFEST_PATH), manifestText);
	writeFileEnsuringDir(resolve(args.repoRoot, AUDIT_PAGE_PATH), pageText);
	if (args.json) {
		process.stdout.write(`${JSON.stringify(manifest, null, 2)}\n`);
	} else {
		process.stdout.write(
			`surface audit built: ${manifest.summary.consistent}/${manifest.summary.total} badges consistent; honest=${manifest.summary.honest}\n`,
		);
	}
	process.exit(0);
}

function collectDrift(repoRoot, manifestText, pageText) {
	const drift = [];
	const onDiskManifest = readIfExists(resolve(repoRoot, MANIFEST_PATH));
	const onDiskPage = readIfExists(resolve(repoRoot, AUDIT_PAGE_PATH));
	if (onDiskManifest !== manifestText) {
		drift.push(MANIFEST_PATH);
	}
	if (onDiskPage !== pageText) {
		drift.push(AUDIT_PAGE_PATH);
	}
	return drift;
}

function buildCheckPayload(manifest, drift) {
	const dishonestReasons = [
		...manifest.orphanIssues,
		...manifest.badges.flatMap((badge) =>
			badge.inconsistencyReasons.map((reason) => `${badge.title}: ${reason}`),
		),
	];
	return {
		status: manifest.summary.honest && drift.length === 0 ? "clean" : "needs_attention",
		honest: manifest.summary.honest,
		drift,
		summary: manifest.summary,
		dishonestReasons,
		suggestion:
			drift.length > 0
				? "Run `npm run audit:surface` and commit the regenerated manifest and docs/specs/generated/audit.spec.md."
				: manifest.summary.honest
					? null
					: "An apex badge over-claims relative to its proof route. Fix the badge level in docs/specs/index.spec.md or repair the proof route.",
	};
}

function renderCheckText(payload) {
	if (payload.status === "clean") {
		return `surface audit check: clean (${payload.summary.consistent}/${payload.summary.total} consistent, honest)\n`;
	}
	const lines = ["surface audit check: needs attention", ""];
	if (payload.drift.length > 0) {
		lines.push("Stale generated artifacts:");
		for (const path of payload.drift) {
			lines.push(`- ${path}`);
		}
		lines.push("");
	}
	if (!payload.honest) {
		lines.push("Dishonest badges:");
		for (const reason of payload.dishonestReasons) {
			lines.push(`- ${reason}`);
		}
		lines.push("");
	}
	lines.push(payload.suggestion);
	return `${lines.join("\n")}\n`;
}

function runCheck(args) {
	const { manifest, manifestText, pageText } = generate(args.repoRoot);
	const drift = collectDrift(args.repoRoot, manifestText, pageText);
	const payload = buildCheckPayload(manifest, drift);
	if (args.json) {
		process.stdout.write(`${JSON.stringify(payload, null, 2)}\n`);
	} else {
		process.stdout.write(renderCheckText(payload));
	}
	process.exit(payload.status === "clean" ? 0 : 1);
}

export function main(argv = process.argv.slice(2)) {
	let args;
	try {
		args = parseArgs(argv);
	} catch (error) {
		process.stderr.write(`${error.message}\n`);
		process.exit(2);
	}
	try {
		if (args.check) {
			runCheck(args);
		} else {
			runBuild(args);
		}
	} catch (error) {
		process.stderr.write(`${error.message}\n`);
		process.exit(1);
	}
}

const entryHref = process.argv[1] ? pathToFileURL(resolve(process.argv[1])).href : "";
if (import.meta.url === entryHref) {
	main();
}
