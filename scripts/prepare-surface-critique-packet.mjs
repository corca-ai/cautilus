import { existsSync, readFileSync } from "node:fs";
import { dirname, relative, resolve } from "node:path";
import path from "node:path/posix";
import process from "node:process";
import { pathToFileURL } from "node:url";

import { loadFile } from "./_stdlib_yaml.mjs";
import { RELEASE_VERSIONED_JSON_FILES } from "./release/bump-version.mjs";

export const SURFACE_CRITIQUE_PACKET_SCHEMA = "cautilus.surface_critique_packet.v1";

function usage(exitCode = 0) {
	const out = exitCode === 0 ? process.stdout : process.stderr;
	out.write(
		[
			"Usage:",
			"  node ./scripts/prepare-surface-critique-packet.mjs [--repo-root .] [--surface-id release-packaging] [--check]",
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

export function parseArgs(argv) {
	const options = {
		repoRoot: process.cwd(),
		surfaceId: "release-packaging",
		check: false,
	};
	for (let index = 0; index < argv.length; index += 1) {
		const arg = argv[index];
		if (arg === "-h" || arg === "--help") {
			usage(0);
		}
		if (arg === "--repo-root") {
			options.repoRoot = readRequiredValue(argv, index, arg);
			index += 1;
			continue;
		}
		if (arg === "--surface-id") {
			options.surfaceId = readRequiredValue(argv, index, arg);
			index += 1;
			continue;
		}
		if (arg === "--check") {
			options.check = true;
			continue;
		}
		throw new Error(`Unknown argument: ${arg}`);
	}
	return {
		repoRoot: resolve(options.repoRoot),
		surfaceId: options.surfaceId,
		check: options.check,
	};
}

function readJson(repoRoot, relativePath) {
	return JSON.parse(readFileSync(resolve(repoRoot, relativePath), "utf-8"));
}

function readYaml(repoRoot, relativePath) {
	return loadFile(resolve(repoRoot, relativePath));
}

function surfacePaths(surface) {
	return [
		...(surface.source_paths || []).map((pathPattern) => ({ pathPattern, surfaceRole: "source" })),
		...(surface.derived_paths || []).map((pathPattern) => ({ pathPattern, surfaceRole: "derived" })),
	];
}

function escapeRegex(text) {
	return text.replace(/[|\\{}()[\]^$+?.]/g, "\\$&");
}

function globToRegex(pattern) {
	let source = "";
	const text = String(pattern);
	for (let index = 0; index < text.length; index += 1) {
		if (text[index] === "*" && text[index + 1] === "*") {
			source += ".*";
			index += 1;
			continue;
		}
		if (text[index] === "*") {
			source += "[^/]*";
			continue;
		}
		source += escapeRegex(text[index]);
	}
	return new RegExp(`^${source}$`);
}

function pathMatches(pathname, pattern) {
	return globToRegex(pattern).test(pathname);
}

function matchingSurfaceEntry(pathname, entries) {
	return entries.find((entry) => pathMatches(pathname, entry.pathPattern)) || null;
}

function normalizeRelativeLink(sourcePath, href) {
	const withoutFragment = href.split("#")[0];
	if (!withoutFragment || /^[a-z]+:/i.test(withoutFragment) || withoutFragment.startsWith("/")) {
		return null;
	}
	return path.normalize(path.join(dirname(sourcePath), withoutFragment));
}

function markdownLinks(text, sourcePath) {
	const links = [];
	const pattern = /\[[^\]]+\]\(([^)]+)\)/g;
	let match = pattern.exec(text);
	while (match) {
		const targetPath = normalizeRelativeLink(sourcePath, match[1]);
		if (targetPath) {
			links.push(targetPath);
		}
		match = pattern.exec(text);
	}
	return [...new Set(links)];
}

function releaseControlDocs(repoRoot) {
	const docs = ["docs/maintainers/releasing.md"];
	const discovered = new Set(docs.filter((doc) => existsSync(resolve(repoRoot, doc))));
	for (const doc of [...discovered]) {
		const text = readFileSync(resolve(repoRoot, doc), "utf-8");
		for (const link of markdownLinks(text, doc)) {
			if (link.startsWith("docs/maintainers/release") && link.endsWith(".md")) {
				discovered.add(link);
			}
		}
	}
	return [...discovered].sort();
}

function hasAnyVersionField(value) {
	if (!value || typeof value !== "object") {
		return false;
	}
	if (Object.hasOwn(value, "version")) {
		return true;
	}
	if (Array.isArray(value)) {
		return value.some((entry) => hasAnyVersionField(entry));
	}
	return Object.values(value).some((entry) => hasAnyVersionField(entry));
}

function detectVersionFields(repoRoot, candidatePaths) {
	const versioned = [];
	for (const candidate of candidatePaths) {
		if (candidate === ".agents/surfaces.json") {
			continue;
		}
		if (!candidate.endsWith(".json") || candidate.includes("*")) {
			continue;
		}
		const absolutePath = resolve(repoRoot, candidate);
		if (!existsSync(absolutePath)) {
			continue;
		}
		try {
			if (hasAnyVersionField(JSON.parse(readFileSync(absolutePath, "utf-8")))) {
				versioned.push(candidate);
			}
		} catch {
			// Non-JSON or malformed JSON is handled by the owning validator.
		}
	}
	return versioned.sort();
}

function testText(repoRoot) {
	const testPath = resolve(repoRoot, "scripts", "retro-surface-trigger-contract.test.mjs");
	return existsSync(testPath) ? readFileSync(testPath, "utf-8") : "";
}

function patternCoveredByTest(pattern, text) {
	if (!text) {
		return false;
	}
	if (text.includes(pattern)) {
		return true;
	}
	if (pattern.endsWith("/**")) {
		return text.includes(`${pattern.slice(0, -3)}/`);
	}
	return false;
}

function classifyPath({ pathPattern, surfaceRole, subscribed }) {
	const roles = [`surface:${surfaceRole}`];
	if (RELEASE_VERSIONED_JSON_FILES.includes(pathPattern)) {
		roles.push("release:prepare-rewrite");
	}
	if (pathPattern === ".agents/plugins/marketplace.json") {
		roles.push("release:audit-only");
	}
	if (pathPattern.startsWith("docs/maintainers/release") || pathPattern === "docs/maintainers/releasing.md") {
		roles.push("release:control-doc");
	}
	if (pathPattern === "plugins/cautilus/skills/cautilus-agent/**") {
		roles.push("release:packaged-skill-sync");
	}
	if (subscribed) {
		roles.push("retro:auto-trigger");
	}
	return roles;
}

function addFinding(findings, finding) {
	findings.push(finding);
}

function retroFindings({ surfaceId, subscribed, rawTriggerGlobs }) {
	const findings = [];
	if (!subscribed) {
		addFinding(findings, {
			id: "retro_surface_not_subscribed",
			severity: "high",
			message: `${surfaceId} is not listed in .agents/retro-adapter.yaml auto_session_trigger_surfaces.`,
			path: ".agents/retro-adapter.yaml",
		});
	}
	if (rawTriggerGlobs.length > 0) {
		addFinding(findings, {
			id: "raw_retro_path_globs_configured",
			severity: "medium",
			message: "Retro auto-trigger should subscribe to surface ids instead of duplicating raw path globs.",
			path: ".agents/retro-adapter.yaml",
			values: rawTriggerGlobs,
		});
	}
	return findings;
}

function releaseControlDocFindings({ controlDocs, entries, surfaceId }) {
	return controlDocs
		.filter((docPath) => !matchingSurfaceEntry(docPath, entries))
		.map((docPath) => ({
			id: "release_control_doc_not_in_surface",
			severity: "high",
			message: `${docPath} is a release control document but is not included in ${surfaceId}.`,
			path: docPath,
		}));
}

function releasePrepareFindings({ entries, surfaceId }) {
	return RELEASE_VERSIONED_JSON_FILES
		.filter((rewritePath) => !matchingSurfaceEntry(rewritePath, entries))
		.map((rewritePath) => ({
			id: "release_prepare_rewrite_path_not_in_surface",
			severity: "high",
			message: `${rewritePath} is rewritten by release:prepare but is not included in ${surfaceId}.`,
			path: rewritePath,
		}));
}

function versionFieldFindings(versionFieldPaths) {
	return versionFieldPaths
		.filter((versionPath) => !RELEASE_VERSIONED_JSON_FILES.includes(versionPath))
		.map((versionPath) => ({
			id: "versioned_json_not_rewritten_by_release_prepare",
			severity: "medium",
			message: `${versionPath} contains a version field but is not in the release:prepare rewrite set.`,
			path: versionPath,
		}));
}

function retroContractCaseFindings({ matrix, surfaceId, testSource }) {
	return matrix
		.filter((entry) => !patternCoveredByTest(entry.pathPattern, testSource))
		.map((entry) => ({
			id: "missing_retro_contract_case",
			severity: "medium",
			message: `${entry.pathPattern} is in ${surfaceId} but lacks an explicit representative case in the retro trigger contract test.`,
			path: "scripts/retro-surface-trigger-contract.test.mjs",
			value: entry.pathPattern,
		}));
}

function collectFindings({ controlDocs, entries, matrix, rawTriggerGlobs, subscribed, surfaceId, testSource, versionFieldPaths }) {
	return [
		...retroFindings({ surfaceId, subscribed, rawTriggerGlobs }),
		...releaseControlDocFindings({ controlDocs, entries, surfaceId }),
		...releasePrepareFindings({ entries, surfaceId }),
		...versionFieldFindings(versionFieldPaths),
		...retroContractCaseFindings({ matrix, surfaceId, testSource }),
	];
}

export function buildSurfaceCritiquePacket({ repoRoot = process.cwd(), surfaceId = "release-packaging" } = {}) {
	const resolvedRepoRoot = resolve(repoRoot);
	const surfaceManifest = readJson(resolvedRepoRoot, ".agents/surfaces.json");
	const surface = surfaceManifest.surfaces.find((candidate) => candidate.surface_id === surfaceId);
	if (!surface) {
		throw new Error(`Unknown surface id: ${surfaceId}`);
	}
	const retroAdapter = readYaml(resolvedRepoRoot, ".agents/retro-adapter.yaml");
	const triggerSurfaces = retroAdapter.auto_session_trigger_surfaces || [];
	const rawTriggerGlobs = retroAdapter.auto_session_trigger_path_globs || [];
	const subscribed = triggerSurfaces.includes(surfaceId);
	const entries = surfacePaths(surface);
	const matrix = entries.map((entry) => ({
		pathPattern: entry.pathPattern,
		surfaceRole: entry.surfaceRole,
		roles: classifyPath({ ...entry, subscribed }),
	}));
	const allPatterns = matrix.map((entry) => entry.pathPattern);
	const controlDocs = releaseControlDocs(resolvedRepoRoot);
	const versionFieldPaths = detectVersionFields(
		resolvedRepoRoot,
		allPatterns.filter((entry) => !entry.includes("*")),
	);
	const testSource = testText(resolvedRepoRoot);
	const findings = collectFindings({
		controlDocs,
		entries,
		matrix,
		rawTriggerGlobs,
		subscribed,
		surfaceId,
		testSource,
		versionFieldPaths,
	});
	return {
		schemaVersion: SURFACE_CRITIQUE_PACKET_SCHEMA,
		repoRoot: relative(process.cwd(), resolvedRepoRoot) || ".",
		surfaceId,
		status: findings.some((finding) => finding.severity === "high") ? "blocked" : findings.length > 0 ? "needs_attention" : "ready",
		retroTrigger: {
			subscribed,
			triggerSurfaces,
			rawTriggerGlobs,
		},
		releaseControlDocs: controlDocs,
		releasePrepareRewritePaths: RELEASE_VERSIONED_JSON_FILES,
		roleMatrix: matrix,
		findings,
	};
}

export function main(argv = process.argv.slice(2)) {
	try {
		const options = parseArgs(argv);
		const packet = buildSurfaceCritiquePacket(options);
		process.stdout.write(`${JSON.stringify(packet, null, 2)}\n`);
		if (options.check && packet.findings.length > 0) {
			process.exit(1);
		}
	} catch (error) {
		process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
		process.exit(1);
	}
}

const entryHref = process.argv[1] ? pathToFileURL(resolve(process.argv[1])).href : "";
if (import.meta.url === entryHref) {
	main();
}
