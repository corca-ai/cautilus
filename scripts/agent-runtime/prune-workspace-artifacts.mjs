import { existsSync, readdirSync, rmSync, statSync } from "node:fs";
import { join, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import process from "node:process";

const EXACT_MARKERS = new Set([
	"report.json",
	"report-input.json",
	"review-packet.json",
	"review-prompt-input.json",
	"review.prompt.md",
	"run.json",
	"summary.json",
	"selected-profile.json",
	"selected-scenario-ids.json",
	"baseline-cache.json",
	"baseline",
	"candidate",
]);
const PATTERN_MARKERS = [/\.stdout$/, /\.stderr$/, /\.mode-evaluation\.json$/];

function fail(message) {
	process.stderr.write(`${message}\n`);
	process.exit(1);
}

function usage(exitCode = 0) {
	const text = [
		"Usage:",
		"  node ./scripts/agent-runtime/prune-workspace-artifacts.mjs --root <dir> [--keep-last <n>] [--max-age-days <n>] [--dry-run]",
		"",
		"Notes:",
		"  - The root should contain one subdirectory per Cautilus run.",
		"  - Only direct child directories that look like Cautilus artifact bundles are considered.",
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

function parseNonNegativeInteger(value, option) {
	const parsed = Number(value);
	if (!Number.isInteger(parsed) || parsed < 0) {
		fail(`${option} must be a non-negative integer`);
	}
	return parsed;
}

function parseNonNegativeNumber(value, option) {
	const parsed = Number(value);
	if (!Number.isFinite(parsed) || parsed < 0) {
		fail(`${option} must be a non-negative number`);
	}
	return parsed;
}

function createDefaultOptions() {
	return {
		root: null,
		keepLast: null,
		maxAgeDays: null,
		dryRun: false,
	};
}

function applyArgument(options, argv, index) {
	const arg = argv[index];
	if (arg === "-h" || arg === "--help") {
		usage(0);
	}
	if (arg === "--dry-run") {
		options.dryRun = true;
		return index;
	}
	if (arg === "--root") {
		options.root = readRequiredValue(argv, index + 1, arg);
		return index + 1;
	}
	if (arg === "--keep-last") {
		options.keepLast = parseNonNegativeInteger(readRequiredValue(argv, index + 1, arg), arg);
		return index + 1;
	}
	if (arg === "--max-age-days") {
		options.maxAgeDays = parseNonNegativeNumber(readRequiredValue(argv, index + 1, arg), arg);
		return index + 1;
	}
	fail(`Unknown argument: ${arg}`);
}

function parseArgs(argv) {
	const options = createDefaultOptions();
	for (let index = 0; index < argv.length; index += 1) {
		index = applyArgument(options, argv, index);
	}
	if (!options.root) {
		fail("--root is required");
	}
	if (options.keepLast === null && options.maxAgeDays === null) {
		fail("Provide --keep-last, --max-age-days, or both.");
	}
	return options;
}

function entryMarkers(path) {
	const markers = [];
	for (const entry of readdirSync(path, { withFileTypes: true })) {
		if (EXACT_MARKERS.has(entry.name) || PATTERN_MARKERS.some((pattern) => pattern.test(entry.name))) {
			markers.push(entry.name);
		}
	}
	return markers.sort();
}

function classifyArtifactEntries(root) {
	const recognized = [];
	const skipped = [];
	for (const entry of readdirSync(root, { withFileTypes: true })) {
		const entryPath = join(root, entry.name);
		if (!entry.isDirectory()) {
			skipped.push({ path: entryPath, reason: "not_directory" });
			continue;
		}
		const markers = entryMarkers(entryPath);
		if (markers.length === 0) {
			skipped.push({ path: entryPath, reason: "not_cautilus_artifact_bundle" });
			continue;
		}
		const stats = statSync(entryPath);
		recognized.push({
			path: entryPath,
			name: entry.name,
			mtimeMs: stats.mtimeMs,
			mtime: new Date(stats.mtimeMs).toISOString(),
			markers,
		});
	}
	return { recognized, skipped };
}

function pruneDecision(entry, index, options, nowMs) {
	const protectedByKeepLast = options.keepLast !== null && index < options.keepLast;
	const olderThanMaxAge = options.maxAgeDays === null
		? true
		: nowMs - entry.mtimeMs > options.maxAgeDays * 24 * 60 * 60 * 1000;
	return {
		protectedByKeepLast,
		olderThanMaxAge,
		shouldPrune: !protectedByKeepLast && olderThanMaxAge,
	};
}

export function pruneWorkspaceArtifacts(argv = process.argv.slice(2), now = new Date()) {
	const options = parseArgs(argv);
	const root = resolve(options.root);
	if (!existsSync(root)) {
		fail(`Root does not exist: ${root}`);
	}
	const rootStats = statSync(root);
	if (!rootStats.isDirectory()) {
		fail(`Root must be a directory: ${root}`);
	}
	const { recognized, skipped } = classifyArtifactEntries(root);
	const sorted = [...recognized].sort((left, right) => right.mtimeMs - left.mtimeMs);
	const nowMs = now.getTime();
	const kept = [];
	const pruned = [];
	for (const [index, entry] of sorted.entries()) {
		const decision = pruneDecision(entry, index, options, nowMs);
		const summary = {
			path: entry.path,
			mtime: entry.mtime,
			markers: entry.markers,
			reason: decision.protectedByKeepLast
				? "keep_last"
				: decision.olderThanMaxAge
					? "retention_policy"
					: "within_max_age",
		};
		if (!decision.shouldPrune) {
			kept.push(summary);
			continue;
		}
		if (!options.dryRun) {
			rmSync(entry.path, { recursive: true, force: true });
		}
		pruned.push(summary);
	}
	return {
		root,
		dryRun: options.dryRun,
		keepLast: options.keepLast,
		maxAgeDays: options.maxAgeDays,
		recognizedCount: recognized.length,
		kept,
		pruned,
		skipped,
	};
}

const entryHref = process.argv[1] ? pathToFileURL(resolve(process.argv[1])).href : "";
if (import.meta.url === entryHref) {
	try {
		process.stdout.write(`${JSON.stringify(pruneWorkspaceArtifacts(), null, 2)}\n`);
	} catch (error) {
		if (error instanceof Error) {
			process.stderr.write(`${error.message}\n`);
		} else {
			process.stderr.write(`${String(error)}\n`);
		}
		process.exit(1);
	}
}
