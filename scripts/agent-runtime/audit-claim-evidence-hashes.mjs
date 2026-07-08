#!/usr/bin/env node
import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { basename, isAbsolute, join, relative, resolve } from "node:path";
import process from "node:process";
import { pathToFileURL } from "node:url";

const CLAIM_EVIDENCE_BUNDLE_SCHEMA = "cautilus.claim_evidence_bundle.v1";
const DEFAULT_CLAIMS_DIR = ".cautilus/claims";
const CURRENT_STATE_REFERENCE_FILES = new Set([
	"evidenced-typed-runners.json",
	"status-summary.json",
]);
const INACTIVE_REFERENCE_PREFIXES = ["eval-plan-", "review-input-"];

function usage(exitCode = 0) {
	const text = [
		"Usage:",
		"  node ./scripts/agent-runtime/audit-claim-evidence-hashes.mjs [--repo-root <dir>] [--claims-dir <dir>] [--reference-scope active|full]",
		"",
		"Checks claim evidence bundle file hashes, active evidence refs, and checked-in evidence hashes.",
	].join("\n");
	const out = exitCode === 0 ? process.stdout : process.stderr;
	out.write(`${text}\n`);
	process.exit(exitCode);
}

function fail(message) {
	process.stderr.write(`${message}\n`);
	process.exit(1);
}

function readRequiredValue(argv, index, option) {
	const value = argv[index];
	if (!value) {
		fail(`Missing value for ${option}`);
	}
	return value;
}

function applyValueOption(options, option, value) {
	if (option === "--repo-root") {
		options.repoRoot = value;
		return;
	}
	if (option === "--claims-dir") {
		options.claimsDir = value;
		return;
	}
	if (option === "--reference-scope") {
		if (!["active", "full"].includes(value)) {
			fail(`Invalid value for ${option}: ${value}`);
		}
		options.referenceScope = value;
		return;
	}
	fail(`Unknown argument: ${option}`);
}

function applyFlagOption(options, option) {
	if (option === "--strict-checked-in-evidence") {
		options.strictCheckedInEvidence = true;
		return true;
	}
	if (option === "--active-only") {
		options.referenceScope = "active";
		return true;
	}
	if (option === "--summary") {
		options.summary = true;
		return true;
	}
	return false;
}

export function parseArgs(argv = process.argv.slice(2)) {
	const options = {
		repoRoot: process.cwd(),
		claimsDir: DEFAULT_CLAIMS_DIR,
		strictCheckedInEvidence: false,
		referenceScope: "full",
		summary: false,
	};
	for (let index = 0; index < argv.length; index += 1) {
		const arg = argv[index];
		if (arg === "-h" || arg === "--help") {
			usage(0);
		}
		if (["--repo-root", "--claims-dir", "--reference-scope"].includes(arg)) {
			applyValueOption(options, arg, readRequiredValue(argv, index + 1, arg));
			index += 1;
			continue;
		}
		if (applyFlagOption(options, arg)) {
			continue;
		}
		fail(`Unknown argument: ${arg}`);
	}
	return options;
}

function sha256Buffer(buffer) {
	return `sha256:${createHash("sha256").update(buffer).digest("hex")}`;
}

function sha256File(path) {
	return sha256Buffer(readFileSync(path));
}

function slashPath(path) {
	return path.split("\\").join("/");
}

function repoRelativePath(repoRoot, path) {
	const absolutePath = isAbsolute(path) ? resolve(path) : resolve(repoRoot, path);
	const rel = relative(repoRoot, absolutePath);
	if (rel === "" || rel.startsWith("..") || isAbsolute(rel)) {
		return null;
	}
	return slashPath(rel);
}

function readJsonFile(path) {
	return JSON.parse(readFileSync(path, "utf8"));
}

function isObject(value) {
	return value && typeof value === "object" && !Array.isArray(value);
}

function walkObjects(value, visit) {
	if (Array.isArray(value)) {
		for (const item of value) {
			walkObjects(item, visit);
		}
		return;
	}
	if (!isObject(value)) {
		return;
	}
	visit(value);
	for (const child of Object.values(value)) {
		walkObjects(child, visit);
	}
}

function listClaimJsonFiles(claimsDir) {
	if (!existsSync(claimsDir)) {
		return [];
	}
	return readdirSync(claimsDir)
		.filter((name) => name.endsWith(".json"))
		.sort()
		.map((name) => join(claimsDir, name));
}

function shouldScanReferenceFile(path) {
	return isActiveReferenceFile(path) || isInactiveReferenceFile(path);
}

function shouldScanReferenceFileForMode(path, { activeOnly }) {
	return activeOnly ? isCurrentStateReferenceFile(path) : shouldScanReferenceFile(path);
}

function isCurrentStateReferenceFile(path) {
	return CURRENT_STATE_REFERENCE_FILES.has(basename(path));
}

function isActiveReferenceFile(path) {
	const name = basename(path);
	return name.startsWith("review-result-") || isCurrentStateReferenceFile(path);
}

function isInactiveReferenceFile(path) {
	const name = basename(path);
	return INACTIVE_REFERENCE_PREFIXES.some((prefix) => name.startsWith(prefix));
}

function gitShowFile(repoRoot, commit, filePath) {
	return execFileSync("git", ["-C", repoRoot, "show", `${commit}:${filePath}`], {
		stdio: ["ignore", "pipe", "ignore"],
	});
}

function issueTarget(result, { strict }) {
	return strict ? result.issues : result.warnings;
}

function recordCheckedInEvidenceIssue(result, issue, { strict }) {
	issueTarget(result, { strict }).push(issue);
}

function recordEvidenceRefIssue(result, issue, { referencePath }) {
	const target = isActiveReferenceFile(referencePath) ? result.issues : result.warnings;
	target.push(issue);
}

function collectEvidenceBundles({ repoRoot, claimsDir, result, includePaths = null }) {
	const evidenceBundles = new Map();
	for (const path of listClaimJsonFiles(claimsDir)) {
		if (!basename(path).startsWith("evidence-")) {
			continue;
		}
		const relativePath = repoRelativePath(repoRoot, path);
		if (includePaths && !includePaths.has(relativePath)) {
			continue;
		}
		let packet;
		try {
			packet = readJsonFile(path);
		} catch (error) {
			result.issues.push({
				kind: "invalid-json",
				file: slashPath(relative(repoRoot, path)),
				message: error.message,
			});
			continue;
		}
		if (packet?.schemaVersion !== CLAIM_EVIDENCE_BUNDLE_SCHEMA) {
			continue;
		}
		const contentHash = sha256File(path);
		evidenceBundles.set(relativePath, {
			contentHash,
			path,
			packet,
			relativePath,
		});
	}
	return evidenceBundles;
}

function checkedInEvidenceIssue({ repoRoot, bundle, repoCommit, entry }) {
	let observed;
	try {
		observed = sha256Buffer(gitShowFile(repoRoot, repoCommit, entry.path));
	} catch (error) {
		return {
			kind: "checked-in-evidence-unreadable",
			file: bundle.relativePath,
			repoCommit,
			path: entry.path,
			message: error.message,
		};
	}
	if (observed !== entry.contentHash) {
		return {
			kind: "checked-in-evidence-content-hash-mismatch",
			file: bundle.relativePath,
			repoCommit,
			path: entry.path,
			expected: entry.contentHash,
			observed,
		};
	}
	return null;
}

function checkedInEvidenceEntries(bundle) {
	return (Array.isArray(bundle.packet.checkedInEvidence) ? bundle.packet.checkedInEvidence : [])
		.filter((entry) => isObject(entry) && typeof entry.path === "string" && typeof entry.contentHash === "string");
}

function auditCheckedInEvidence({ repoRoot, evidenceBundles, result, strict }) {
	let checkedInEvidenceBundleCount = 0;
	for (const bundle of evidenceBundles.values()) {
		const repoCommit = typeof bundle.packet.repoCommit === "string" ? bundle.packet.repoCommit.trim() : "";
		if (!repoCommit) {
			continue;
		}
		const entries = checkedInEvidenceEntries(bundle);
		if (entries.length > 0) {
			checkedInEvidenceBundleCount += 1;
		}
		for (const entry of entries) {
			const issue = checkedInEvidenceIssue({ repoRoot, bundle, repoCommit, entry });
			if (issue) {
				recordCheckedInEvidenceIssue(result, issue, { strict });
			}
		}
	}
	return checkedInEvidenceBundleCount;
}

function evidenceRefIssue({ object, repoRoot, claimEvidenceDir, evidenceBundles }) {
	const relativePath = repoRelativePath(repoRoot, object.path);
	if (!relativePath) {
		if (object.path.includes("/evidence-") || basename(object.path).startsWith("evidence-")) {
			return { kind: "evidence-ref-outside-repo", path: object.path };
		}
		return null;
	}
	const bundle = evidenceBundles.get(relativePath);
	if (!bundle) {
		if (relativePath.startsWith(`${claimEvidenceDir}/evidence-`)) {
			return { kind: "evidence-ref-missing-bundle", path: relativePath };
		}
		return null;
	}
	if (object.contentHash === bundle.contentHash) {
		return null;
	}
	return {
		kind: "evidence-ref-content-hash-mismatch",
		path: relativePath,
		expected: object.contentHash,
		observed: bundle.contentHash,
		supportsClaimIds: Array.isArray(object.supportsClaimIds) ? object.supportsClaimIds : [],
	};
}

function evidenceRefPath({ object, repoRoot, claimEvidenceDir }) {
	if (typeof object.path !== "string" || typeof object.contentHash !== "string") {
		return null;
	}
	const relativePath = repoRelativePath(repoRoot, object.path);
	if (!relativePath || !relativePath.startsWith(`${claimEvidenceDir}/evidence-`)) {
		return null;
	}
	return relativePath;
}

function collectEvidenceRefPathsInPacket({ repoRoot, claimEvidenceDir, packet, referencedPaths }) {
	walkObjects(packet, (object) => {
		const relativePath = evidenceRefPath({ object, repoRoot, claimEvidenceDir });
		if (relativePath) {
			referencedPaths.add(relativePath);
		}
	});
}

function auditEvidenceRefsInPacket({ repoRoot, claimEvidenceDir, evidenceBundles, result, path, packet }) {
	walkObjects(packet, (object) => {
		if (typeof object.path !== "string" || typeof object.contentHash !== "string") {
			return;
		}
		const issue = evidenceRefIssue({ object, repoRoot, claimEvidenceDir, evidenceBundles });
		if (issue) {
			recordEvidenceRefIssue(result, {
				...issue,
				file: slashPath(relative(repoRoot, path)),
			}, { referencePath: path });
		}
	});
}

function referenceFilesForMode({ claimsDir, activeOnly }) {
	return listClaimJsonFiles(claimsDir).filter((path) => shouldScanReferenceFileForMode(path, { activeOnly }));
}

function collectReferencedEvidencePaths({ repoRoot, claimsDir, referenceFiles, result }) {
	const claimEvidenceDir = slashPath(relative(repoRoot, claimsDir));
	const referencedPaths = new Set();
	for (const path of referenceFiles) {
		let packet;
		try {
			packet = readJsonFile(path);
		} catch (error) {
			result.issues.push({
				kind: "invalid-json",
				file: slashPath(relative(repoRoot, path)),
				message: error.message,
			});
			continue;
		}
		collectEvidenceRefPathsInPacket({ repoRoot, claimEvidenceDir, packet, referencedPaths });
	}
	return referencedPaths;
}

function auditEvidenceRefs({ repoRoot, claimsDir, evidenceBundles, result, referenceFiles }) {
	const claimEvidenceDir = slashPath(relative(repoRoot, claimsDir));
	for (const path of referenceFiles) {
		let packet;
		try {
			packet = readJsonFile(path);
		} catch (error) {
			result.issues.push({
				kind: "invalid-json",
				file: slashPath(relative(repoRoot, path)),
				message: error.message,
			});
			continue;
		}
		auditEvidenceRefsInPacket({ repoRoot, claimEvidenceDir, evidenceBundles, result, path, packet });
	}
}

function kindCounts(items) {
	const counts = {};
	for (const item of items) {
		counts[item.kind] = (counts[item.kind] || 0) + 1;
	}
	return counts;
}

export function auditClaimEvidenceHashes(options = {}) {
	const repoRoot = resolve(options.repoRoot || process.cwd());
	const claimsDir = resolve(repoRoot, options.claimsDir || DEFAULT_CLAIMS_DIR);
	const referenceScope = options.referenceScope === "active" || options.activeOnly === true ? "active" : "full";
	const activeOnly = referenceScope === "active";
	const referenceFiles = referenceFilesForMode({ claimsDir, activeOnly });
	const fullReferenceFileCount = listClaimJsonFiles(claimsDir).filter(shouldScanReferenceFile).length;
	const result = {
		schemaVersion: "cautilus.claim_evidence_hash_audit.v1",
		claimsDir: slashPath(relative(repoRoot, claimsDir)),
		mode: activeOnly ? "active-only" : "full",
		referenceScope,
		evidenceBundleCount: 0,
		scannedReferenceFileCount: referenceFiles.length,
		skippedReferenceFileCount: fullReferenceFileCount - referenceFiles.length,
		checkedInEvidenceBundleCount: 0,
		issueCount: 0,
		warningCount: 0,
		issues: [],
		warnings: [],
		checkedInEvidencePolicy: options.strictCheckedInEvidence ? "strict" : "warn",
		status: "ok",
	};
	const referencedEvidencePaths = activeOnly
		? collectReferencedEvidencePaths({ repoRoot, claimsDir, referenceFiles, result })
		: null;
	const evidenceBundles = collectEvidenceBundles({
		repoRoot,
		claimsDir,
		result,
		includePaths: referencedEvidencePaths,
	});
	result.evidenceBundleCount = evidenceBundles.size;
	result.checkedInEvidenceBundleCount = auditCheckedInEvidence({
		repoRoot,
		evidenceBundles,
		result,
		strict: options.strictCheckedInEvidence === true,
	});
	auditEvidenceRefs({ repoRoot, claimsDir, evidenceBundles, result, referenceFiles });
	result.issueCount = result.issues.length;
	result.warningCount = result.warnings.length;
	result.status = result.issueCount === 0 ? "ok" : "failed";
	return {
		...result,
		issueKindCounts: kindCounts(result.issues),
		warningKindCounts: kindCounts(result.warnings),
		warnings: result.warnings.slice(0, 20),
		warningTruncated: result.warnings.length > 20,
	};
}

export function main(argv = process.argv.slice(2)) {
	const options = parseArgs(argv);
	const result = auditClaimEvidenceHashes(options);
	const output = options.summary
		? {
			schemaVersion: result.schemaVersion,
			claimsDir: result.claimsDir,
			mode: result.mode,
			referenceScope: result.referenceScope,
			evidenceBundleCount: result.evidenceBundleCount,
			checkedInEvidenceBundleCount: result.checkedInEvidenceBundleCount,
				scannedReferenceFileCount: result.scannedReferenceFileCount,
				skippedReferenceFileCount: result.skippedReferenceFileCount,
				issueCount: result.issueCount,
				warningCount: result.warningCount,
				issueKindCounts: result.issueKindCounts,
				warningKindCounts: result.warningKindCounts,
				checkedInEvidencePolicy: result.checkedInEvidencePolicy,
			warningTruncated: result.warningTruncated,
			status: result.status,
		}
		: result;
	process.stdout.write(`${JSON.stringify(output, null, 2)}\n`);
	process.exit(result.issueCount === 0 ? 0 : 1);
}

const entryHref = process.argv[1] ? pathToFileURL(resolve(process.argv[1])).href : "";
if (import.meta.url === entryHref) {
	main();
}
