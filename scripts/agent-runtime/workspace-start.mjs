import { existsSync, mkdirSync, statSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import process from "node:process";

export const RUN_MANIFEST_NAME = "run.json";
export const RUN_MANIFEST_SCHEMA = "cautilus.workspace_run_manifest.v1";
export const DEFAULT_RUN_LABEL = "run";
export const DEFAULT_RUNS_ROOT = ".cautilus/runs";
export const ACTIVE_RUN_ENV_VAR = "CAUTILUS_RUN_DIR";
const LABEL_MAX_LENGTH = 64;

function fail(message) {
	process.stderr.write(`${message}\n`);
	process.exit(1);
}

function usage(exitCode = 0) {
	const text = [
		"Usage:",
		"  node ./scripts/agent-runtime/workspace-start.mjs [--root <dir>] [--label <name>] [--json]",
		"",
		"Notes:",
		"  - Default root is .cautilus/runs/ under the current working directory.",
		"  - The root is created if it does not already exist.",
		"  - One fresh <timestamp>-<label> directory is created under the root.",
		"  - A run.json manifest is written inside so prune-workspace-artifacts recognizes it.",
		"  - Default stdout is a shell-evalable export line:",
		"      export CAUTILUS_RUN_DIR='/abs/path/to/run-dir'",
		"    Use it directly with eval, e.g. eval \"$(cautilus workspace start --label foo)\".",
		"  - Pass --json to emit a machine-readable JSON payload instead.",
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

function applyArgument(options, argv, index) {
	const arg = argv[index];
	if (arg === "-h" || arg === "--help") {
		usage(0);
	}
	if (arg === "--root") {
		options.root = readRequiredValue(argv, index + 1, arg);
		return index + 1;
	}
	if (arg === "--label") {
		options.label = readRequiredValue(argv, index + 1, arg);
		return index + 1;
	}
	if (arg === "--json") {
		options.json = true;
		return index;
	}
	fail(`Unknown argument: ${arg}`);
}

export function parseArgs(argv) {
	const options = { root: null, label: null, json: false };
	for (let index = 0; index < argv.length; index += 1) {
		index = applyArgument(options, argv, index);
	}
	return options;
}

export function slugifyLabel(label) {
	if (label === null || label === undefined) {
		return DEFAULT_RUN_LABEL;
	}
	const lowered = String(label).toLowerCase();
	const replaced = lowered.replace(/[^a-z0-9-]+/g, "-");
	const collapsed = replaced.replace(/-+/g, "-");
	const trimmed = collapsed.replace(/^-+|-+$/g, "");
	const bounded = trimmed.slice(0, LABEL_MAX_LENGTH);
	return bounded === "" ? DEFAULT_RUN_LABEL : bounded;
}

export function formatRunTimestamp(date) {
	const iso = date.toISOString();
	// "2026-04-11T10:32:15.123Z" -> "20260411T103215123Z"
	return (
		`${iso.slice(0, 4)}${iso.slice(5, 7)}${iso.slice(8, 10)}` +
		`T${iso.slice(11, 13)}${iso.slice(14, 16)}${iso.slice(17, 19)}` +
		`${iso.slice(20, 23)}Z`
	);
}

export function shellSingleQuote(value) {
	return `'${String(value).replace(/'/g, "'\\''")}'`;
}

export function renderShellExport(runDir) {
	return `export ${ACTIVE_RUN_ENV_VAR}=${shellSingleQuote(runDir)}\n`;
}

export function createRun({ root, label, now }) {
	if (!root) {
		throw new Error("root is required");
	}
	if (!(now instanceof Date) || Number.isNaN(now.getTime())) {
		throw new Error("now must be a valid Date");
	}
	const resolvedRoot = resolve(root);
	if (!existsSync(resolvedRoot)) {
		throw new Error(`Root does not exist: ${resolvedRoot}`);
	}
	if (!statSync(resolvedRoot).isDirectory()) {
		throw new Error(`Root must be a directory: ${resolvedRoot}`);
	}
	const slug = slugifyLabel(label);
	const startedAtIso = now.toISOString();
	const stamp = formatRunTimestamp(now);
	const runDirName = `${stamp}-${slug}`;
	const runDir = join(resolvedRoot, runDirName);
	if (existsSync(runDir)) {
		throw new Error(`Run directory already exists: ${runDir}`);
	}
	mkdirSync(runDir, { recursive: false });
	const manifest = {
		schemaVersion: RUN_MANIFEST_SCHEMA,
		label: slug,
		startedAt: startedAtIso,
	};
	writeFileSync(
		join(runDir, RUN_MANIFEST_NAME),
		`${JSON.stringify(manifest, null, 2)}\n`,
		"utf-8",
	);
	return {
		schemaVersion: RUN_MANIFEST_SCHEMA,
		root: resolvedRoot,
		runDir,
		label: slug,
		startedAt: startedAtIso,
		manifest: RUN_MANIFEST_NAME,
	};
}

export function startWorkspaceRun({
	root = null,
	label = null,
	now = new Date(),
	cwd = process.cwd(),
} = {}) {
	const rootPath = resolve(cwd, root ?? DEFAULT_RUNS_ROOT);
	mkdirSync(rootPath, { recursive: true });
	return createRun({ root: rootPath, label, now });
}

export function workspaceStartCli(argv = process.argv.slice(2), now = new Date()) {
	const options = parseArgs(argv);
	try {
		const result = startWorkspaceRun({ root: options.root, label: options.label, now });
		return { result, json: options.json };
	} catch (error) {
		fail(error instanceof Error ? error.message : String(error));
		return undefined;
	}
}

const entryHref = process.argv[1] ? pathToFileURL(resolve(process.argv[1])).href : "";
if (import.meta.url === entryHref) {
	const cli = workspaceStartCli();
	if (cli) {
		const payload = cli.json
			? `${JSON.stringify(cli.result, null, 2)}\n`
			: renderShellExport(cli.result.runDir);
		process.stdout.write(payload);
	}
}
