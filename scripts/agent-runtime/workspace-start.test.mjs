import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import {
	existsSync,
	mkdirSync,
	mkdtempSync,
	readFileSync,
	rmSync,
	writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import test from "node:test";
import {
	ACTIVE_RUN_ENV_VAR,
	DEFAULT_RUNS_ROOT,
	DEFAULT_RUN_LABEL,
	RUN_MANIFEST_NAME,
	RUN_MANIFEST_SCHEMA,
	createRun,
	formatRunTimestamp,
	renderShellExport,
	shellSingleQuote,
	slugifyLabel,
	startWorkspaceRun,
} from "./workspace-start.mjs";

const SCRIPT_PATH = join(process.cwd(), "scripts", "agent-runtime", "workspace-start.mjs");
const PRUNE_SCRIPT_PATH = join(
	process.cwd(),
	"scripts",
	"agent-runtime",
	"prune-workspace-artifacts.mjs",
);

function withTempRoot(fn) {
	const base = mkdtempSync(join(tmpdir(), "cautilus-workspace-start-"));
	try {
		const root = join(base, "artifacts");
		mkdirSync(root, { recursive: true });
		fn(root, base);
	} finally {
		rmSync(base, { recursive: true, force: true });
	}
}

function withTempBase(fn) {
	const base = mkdtempSync(join(tmpdir(), "cautilus-workspace-start-base-"));
	try {
		fn(base);
	} finally {
		rmSync(base, { recursive: true, force: true });
	}
}

test("slugifyLabel normalizes label input and falls back to the default", () => {
	assert.equal(slugifyLabel("Mode Held-Out"), "mode-held-out");
	assert.equal(slugifyLabel("  mode/held_out  "), "mode-held-out");
	assert.equal(slugifyLabel("---"), DEFAULT_RUN_LABEL);
	assert.equal(slugifyLabel(""), DEFAULT_RUN_LABEL);
	assert.equal(slugifyLabel(null), DEFAULT_RUN_LABEL);
	assert.equal(slugifyLabel("a".repeat(200)).length, 64);
});

test("formatRunTimestamp produces a compact chronologically sortable stamp", () => {
	const stamp = formatRunTimestamp(new Date("2026-04-11T10:32:15.123Z"));
	assert.equal(stamp, "20260411T103215123Z");
	const earlier = formatRunTimestamp(new Date("2026-04-11T10:32:15.000Z"));
	const later = formatRunTimestamp(new Date("2026-04-11T10:32:16.000Z"));
	assert.ok(earlier < later);
});

test("shellSingleQuote escapes embedded single quotes for POSIX shells", () => {
	assert.equal(shellSingleQuote("/tmp/plain"), "'/tmp/plain'");
	assert.equal(shellSingleQuote("/tmp/with space"), "'/tmp/with space'");
	assert.equal(shellSingleQuote("/tmp/it's"), "'/tmp/it'\\''s'");
});

test("renderShellExport emits a single eval-friendly export line", () => {
	const line = renderShellExport("/tmp/cautilus-runs/20260411T103215123Z-fresh");
	assert.equal(
		line,
		`export ${ACTIVE_RUN_ENV_VAR}='/tmp/cautilus-runs/20260411T103215123Z-fresh'\n`,
	);
});

test("createRun materializes a per-run directory with a recognized manifest", () => {
	withTempRoot((root) => {
		const now = new Date("2026-04-11T10:32:15.123Z");
		const result = createRun({ root, label: "Mode Held-Out", now });
		assert.equal(result.schemaVersion, RUN_MANIFEST_SCHEMA);
		assert.equal(result.label, "mode-held-out");
		assert.equal(result.startedAt, "2026-04-11T10:32:15.123Z");
		assert.equal(result.manifest, RUN_MANIFEST_NAME);
		assert.equal(result.runDir, join(root, "20260411T103215123Z-mode-held-out"));
		assert.equal(existsSync(result.runDir), true);
		const manifest = JSON.parse(readFileSync(join(result.runDir, RUN_MANIFEST_NAME), "utf-8"));
		assert.equal(manifest.schemaVersion, RUN_MANIFEST_SCHEMA);
		assert.equal(manifest.label, "mode-held-out");
		assert.equal(manifest.startedAt, "2026-04-11T10:32:15.123Z");
	});
});

test("createRun defaults the label when none is provided", () => {
	withTempRoot((root) => {
		const result = createRun({ root, label: null, now: new Date("2026-04-11T10:32:15.000Z") });
		assert.equal(result.label, DEFAULT_RUN_LABEL);
		assert.equal(result.runDir, join(root, "20260411T103215000Z-run"));
	});
});

test("createRun fails loudly when the run directory already exists", () => {
	withTempRoot((root) => {
		const now = new Date("2026-04-11T10:32:15.123Z");
		createRun({ root, label: "collide", now });
		assert.throws(
			() => createRun({ root, label: "collide", now }),
			/Run directory already exists/,
		);
	});
});

test("createRun fails when the root does not exist", () => {
	withTempRoot((root) => {
		const missing = join(root, "missing");
		assert.throws(
			() => createRun({ root: missing, label: "run", now: new Date() }),
			/Root does not exist/,
		);
	});
});

test("createRun fails when the root is not a directory", () => {
	withTempRoot((root) => {
		const filePath = join(root, "regular-file.txt");
		writeFileSync(filePath, "not a directory", "utf-8");
		assert.throws(
			() => createRun({ root: filePath, label: "run", now: new Date() }),
			/Root must be a directory/,
		);
	});
});

test("startWorkspaceRun creates the explicit root recursively when missing", () => {
	withTempBase((base) => {
		const root = join(base, "nested", "missing", "root");
		const result = startWorkspaceRun({
			root,
			label: "fresh",
			now: new Date("2026-04-11T10:32:15.000Z"),
		});
		assert.equal(existsSync(root), true);
		assert.equal(existsSync(result.runDir), true);
		assert.equal(result.label, "fresh");
	});
});

test("startWorkspaceRun falls back to the default root relative to cwd", () => {
	withTempBase((base) => {
		const result = startWorkspaceRun({
			cwd: base,
			label: "fallback",
			now: new Date("2026-04-11T10:32:15.000Z"),
		});
		assert.equal(result.root, resolve(base, DEFAULT_RUNS_ROOT));
		assert.equal(result.runDir, resolve(base, DEFAULT_RUNS_ROOT, "20260411T103215000Z-fallback"));
		assert.equal(existsSync(result.runDir), true);
	});
});

test("workspace-start CLI emits a shell export line by default", () => {
	withTempBase((base) => {
		const result = spawnSync(
			"node",
			[SCRIPT_PATH, "--root", join(base, "runs"), "--label", "mode-held-out"],
			{ encoding: "utf-8" },
		);
		assert.equal(result.status, 0, result.stderr);
		const lines = result.stdout.trim().split("\n");
		assert.equal(lines.length, 1);
		const match = lines[0].match(
			new RegExp(`^export ${ACTIVE_RUN_ENV_VAR}='([^']+)'$`),
		);
		assert.ok(match, `expected eval-friendly export, got: ${lines[0]}`);
		const runDir = match[1];
		assert.match(runDir, /\/\d{8}T\d{9}Z-mode-held-out$/);
		assert.equal(existsSync(runDir), true);
		assert.equal(existsSync(join(runDir, RUN_MANIFEST_NAME)), true);
	});
});

test("workspace-start CLI auto-creates the default root when missing", () => {
	withTempBase((base) => {
		const result = spawnSync("node", [SCRIPT_PATH, "--label", "default-root"], {
			cwd: base,
			encoding: "utf-8",
		});
		assert.equal(result.status, 0, result.stderr);
		const match = result.stdout
			.trim()
			.match(new RegExp(`^export ${ACTIVE_RUN_ENV_VAR}='([^']+)'$`));
		assert.ok(match, result.stdout);
		const runDir = match[1];
		assert.equal(runDir.startsWith(resolve(base, DEFAULT_RUNS_ROOT)), true);
		assert.equal(existsSync(runDir), true);
	});
});

test("workspace-start CLI emits JSON when --json is passed", () => {
	withTempBase((base) => {
		const result = spawnSync(
			"node",
			[SCRIPT_PATH, "--root", join(base, "runs"), "--label", "json-mode", "--json"],
			{ encoding: "utf-8" },
		);
		assert.equal(result.status, 0, result.stderr);
		const payload = JSON.parse(result.stdout);
		assert.equal(payload.schemaVersion, RUN_MANIFEST_SCHEMA);
		assert.equal(payload.label, "json-mode");
		assert.equal(payload.manifest, RUN_MANIFEST_NAME);
		assert.equal(existsSync(payload.runDir), true);
		assert.equal(existsSync(join(payload.runDir, RUN_MANIFEST_NAME)), true);
	});
});

test("workspace-start CLI integrates with prune-workspace-artifacts recognition", () => {
	withTempBase((base) => {
		const root = join(base, "runs");
		const start = spawnSync(
			"node",
			[SCRIPT_PATH, "--root", root, "--label", "integration", "--json"],
			{ encoding: "utf-8" },
		);
		assert.equal(start.status, 0, start.stderr);
		const payload = JSON.parse(start.stdout);

		const prune = spawnSync(
			"node",
			[PRUNE_SCRIPT_PATH, "--root", root, "--keep-last", "5"],
			{ encoding: "utf-8" },
		);
		assert.equal(prune.status, 0, prune.stderr);
		const pruneResult = JSON.parse(prune.stdout);
		assert.equal(pruneResult.recognizedCount, 1);
		assert.equal(pruneResult.pruned.length, 0);
		assert.equal(pruneResult.kept.length, 1);
		assert.equal(pruneResult.kept[0].path, payload.runDir);
		assert.ok(pruneResult.kept[0].markers.includes(RUN_MANIFEST_NAME));
	});
});
