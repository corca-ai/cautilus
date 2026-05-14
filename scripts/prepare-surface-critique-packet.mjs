import { existsSync, readFileSync, readdirSync } from "node:fs";
import { dirname, join, relative, resolve } from "node:path";
import path from "node:path/posix";
import process from "node:process";
import { pathToFileURL } from "node:url";

import { loadFile } from "./_stdlib_yaml.mjs";
import { RELEASE_VERSIONED_JSON_FILES } from "./release/bump-version.mjs";
import { rewriteUpwardLinks } from "./release/sync-packaged-skill.mjs";

export const SURFACE_CRITIQUE_PACKET_SCHEMA = "cautilus.surface_critique_packet.v1";

export const RELEASE_PACKAGING_RULE_FAMILIES = Object.freeze([
	"retro_registration",
	"release_control_docs",
	"release_prepare_rewrites",
	"versioned_json_audit",
	"retro_contract_cases",
]);

export const CLI_AGENT_PRODUCT_RULE_FAMILIES = Object.freeze([
	"packaged_skill_tree_parity",
	"packaged_skill_content_sync",
]);

const SUPPORTED_FORMATS = new Set(["json", "md"]);

function usage(exitCode = 0) {
	const out = exitCode === 0 ? process.stdout : process.stderr;
	out.write(
		[
			"Usage:",
			"  node ./scripts/prepare-surface-critique-packet.mjs [--repo-root .] [--surface-id release-packaging] [--format json|md] [--check]",
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
		format: "json",
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
		if (arg === "--format") {
			options.format = readRequiredValue(argv, index, arg);
			index += 1;
			continue;
		}
		if (arg === "--check") {
			options.check = true;
			continue;
		}
		throw new Error(`Unknown argument: ${arg}`);
	}
	if (!SUPPORTED_FORMATS.has(options.format)) {
		throw new Error(`Unsupported --format value: ${options.format} (expected: json|md)`);
	}
	return {
		repoRoot: resolve(options.repoRoot),
		surfaceId: options.surfaceId,
		format: options.format,
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

function packetStatus(findings) {
	if (findings.some((finding) => finding.severity === "high")) {
		return "blocked";
	}
	return findings.length > 0 ? "needs_attention" : "ready";
}

function wrapPacket({ surfaceId, resolvedRepoRoot, ruleFamilies, findings, extras = {} }) {
	return {
		schemaVersion: SURFACE_CRITIQUE_PACKET_SCHEMA,
		repoRoot: relative(process.cwd(), resolvedRepoRoot) || ".",
		surfaceId,
		coverage: {
			surface_id: surfaceId,
			rule_families: [...ruleFamilies],
		},
		status: packetStatus(findings),
		...extras,
		findings,
	};
}

function buildReleasePackagingPacket({ resolvedRepoRoot }) {
	const surfaceId = "release-packaging";
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
	return wrapPacket({
		surfaceId,
		resolvedRepoRoot,
		ruleFamilies: RELEASE_PACKAGING_RULE_FAMILIES,
		findings,
		extras: {
			retroTrigger: {
				subscribed,
				triggerSurfaces,
				rawTriggerGlobs,
			},
			releaseControlDocs: controlDocs,
			releasePrepareRewritePaths: RELEASE_VERSIONED_JSON_FILES,
			roleMatrix: matrix,
		},
	});
}

function collectRelativeFiles(rootPath) {
	if (!existsSync(rootPath)) {
		return [];
	}
	const out = [];
	const walk = (dir, prefix) => {
		const entries = readdirSync(dir, { withFileTypes: true }).slice().sort((a, b) => a.name.localeCompare(b.name));
		for (const entry of entries) {
			const next = join(dir, entry.name);
			const rel = prefix ? `${prefix}/${entry.name}` : entry.name;
			if (entry.isDirectory()) {
				walk(next, rel);
			} else if (entry.isFile()) {
				out.push(rel);
			}
		}
	};
	walk(rootPath, "");
	return out;
}

function packagedSkillTreeParityFindings({ sourceFiles, packagedFiles, sourceRel, packagedRel }) {
	const sourceSet = new Set(sourceFiles);
	const packagedSet = new Set(packagedFiles);
	const findings = [];
	for (const rel of sourceFiles) {
		if (!packagedSet.has(rel)) {
			findings.push({
				id: "packaged_skill_tree_parity",
				severity: "high",
				message: `${sourceRel}/${rel} is missing from the packaged skill tree; run \`npm run skills:sync-packaged\`.`,
				path: `${packagedRel}/${rel}`,
			});
		}
	}
	for (const rel of packagedFiles) {
		if (!sourceSet.has(rel)) {
			findings.push({
				id: "packaged_skill_tree_parity",
				severity: "high",
				message: `${packagedRel}/${rel} has no source counterpart; delete it or restore the source file in ${sourceRel}/.`,
				path: `${packagedRel}/${rel}`,
			});
		}
	}
	return findings;
}

function expectedPackagedContent(relPath, sourceContent) {
	return relPath.endsWith(".md") ? rewriteUpwardLinks(sourceContent) : sourceContent;
}

function packagedSkillContentSyncFindings({ sourceDir, packagedDir, commonFiles, packagedRel }) {
	const findings = [];
	for (const rel of commonFiles) {
		const sourceContent = readFileSync(resolve(sourceDir, rel), "utf-8");
		const packagedContent = readFileSync(resolve(packagedDir, rel), "utf-8");
		const expected = expectedPackagedContent(rel, sourceContent);
		if (packagedContent !== expected) {
			findings.push({
				id: "packaged_skill_content_sync",
				severity: "high",
				message: `${packagedRel}/${rel} does not match the source after upward-link rewrites; run \`npm run skills:sync-packaged\`.`,
				path: `${packagedRel}/${rel}`,
			});
		}
	}
	return findings;
}

function buildCliAgentProductPacket({ resolvedRepoRoot }) {
	const surfaceId = "cli-agent-product";
	const surfaceManifest = readJson(resolvedRepoRoot, ".agents/surfaces.json");
	const surface = surfaceManifest.surfaces.find((candidate) => candidate.surface_id === surfaceId);
	if (!surface) {
		throw new Error(`Unknown surface id: ${surfaceId}`);
	}
	const sourceRel = "skills/cautilus-agent";
	const packagedRel = "plugins/cautilus/skills/cautilus-agent";
	const sourceDir = resolve(resolvedRepoRoot, sourceRel);
	const packagedDir = resolve(resolvedRepoRoot, packagedRel);
	const sourceFiles = collectRelativeFiles(sourceDir);
	const packagedFiles = collectRelativeFiles(packagedDir);
	const packagedSet = new Set(packagedFiles);
	const commonFiles = sourceFiles.filter((rel) => packagedSet.has(rel));
	const findings = [
		...packagedSkillTreeParityFindings({ sourceFiles, packagedFiles, sourceRel, packagedRel }),
		...packagedSkillContentSyncFindings({ sourceDir, packagedDir, commonFiles, packagedRel }),
	];
	return wrapPacket({
		surfaceId,
		resolvedRepoRoot,
		ruleFamilies: CLI_AGENT_PRODUCT_RULE_FAMILIES,
		findings,
		extras: {
			packagedSkillTreeRoots: { source: sourceRel, packaged: packagedRel },
			sourceFileCount: sourceFiles.length,
			packagedFileCount: packagedFiles.length,
		},
	});
}

const SURFACE_BUNDLE_BUILDERS = {
	"release-packaging": buildReleasePackagingPacket,
	"cli-agent-product": buildCliAgentProductPacket,
};

export const SUPPORTED_SURFACE_IDS = Object.freeze(Object.keys(SURFACE_BUNDLE_BUILDERS));

export function buildSurfaceCritiquePacket({ repoRoot = process.cwd(), surfaceId = "release-packaging" } = {}) {
	const builder = SURFACE_BUNDLE_BUILDERS[surfaceId];
	if (!builder) {
		throw new Error(
			`No rule bundle declared for surface id: ${surfaceId}. Known: ${SUPPORTED_SURFACE_IDS.join(", ")}`,
		);
	}
	return builder({ resolvedRepoRoot: resolve(repoRoot) });
}

function renderFindingLine(finding) {
	return `- **[${finding.severity}]** \`${finding.id}\` — ${finding.path || "(no path)"}: ${finding.message}`;
}

export function renderPacketMarkdown(packet) {
	const lines = [];
	lines.push(`# Surface Critique Packet — ${packet.surfaceId}`);
	lines.push("");
	lines.push(
		"**Scope:** This packet only checks the deterministic rule families listed below for the named surface. A `ready` status here does **not** imply that other repo surfaces are clean — broader critique still applies.",
	);
	lines.push("");
	lines.push(`- Surface ID: \`${packet.coverage.surface_id}\``);
	lines.push(`- Covered rule families: ${packet.coverage.rule_families.map((id) => `\`${id}\``).join(", ")}`);
	lines.push(`- Status: \`${packet.status}\``);
	lines.push("");
	if (packet.findings.length === 0) {
		lines.push("## Findings");
		lines.push("");
		lines.push("_No findings in covered rule families._");
	} else {
		lines.push(`## Findings (${packet.findings.length})`);
		lines.push("");
		for (const finding of packet.findings) {
			lines.push(renderFindingLine(finding));
		}
	}
	return `${lines.join("\n")}\n`;
}

export function main(argv = process.argv.slice(2)) {
	try {
		const options = parseArgs(argv);
		const packet = buildSurfaceCritiquePacket(options);
		const rendered = options.format === "md" ? renderPacketMarkdown(packet) : `${JSON.stringify(packet, null, 2)}\n`;
		process.stdout.write(rendered);
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
