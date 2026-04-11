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
import { join } from "node:path";
import test from "node:test";
import {
	DEFAULT_RUN_LABEL,
	RUN_MANIFEST_NAME,
	RUN_MANIFEST_SCHEMA,
	createRun,
	formatRunTimestamp,
	slugifyLabel,
} from "./new-workspace-run.mjs";

const SCRIPT_PATH = join(process.cwd(), "scripts", "agent-runtime", "new-workspace-run.mjs");
const PRUNE_SCRIPT_PATH = join(
	process.cwd(),
	"scripts",
	"agent-runtime",
	"prune-workspace-artifacts.mjs",
);

function withTempRoot(fn) {
	const base = mkdtempSync(join(tmpdir(), "cautilus-new-run-"));
	try {
		const root = join(base, "artifacts");
		mkdirSync(root, { recursive: true });
		fn(root);
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

test("new-workspace-run CLI emits JSON on stdout and creates the run directory", () => {
	withTempRoot((root) => {
		const result = spawnSync(
			"node",
			[SCRIPT_PATH, "--root", root, "--label", "mode-held-out"],
			{ encoding: "utf-8" },
		);
		assert.equal(result.status, 0, result.stderr);
		const payload = JSON.parse(result.stdout);
		assert.equal(payload.root, root);
		assert.equal(payload.label, "mode-held-out");
		assert.equal(payload.manifest, RUN_MANIFEST_NAME);
		assert.match(payload.runDir, /\/\d{8}T\d{9}Z-mode-held-out$/);
		assert.equal(existsSync(payload.runDir), true);
		assert.equal(existsSync(join(payload.runDir, RUN_MANIFEST_NAME)), true);
	});
});

test("new-workspace-run CLI reports a friendly error when the root is missing", () => {
	withTempRoot((root) => {
		const missing = join(root, "missing");
		const result = spawnSync("node", [SCRIPT_PATH, "--root", missing], {
			encoding: "utf-8",
		});
		assert.notEqual(result.status, 0);
		assert.match(result.stderr, /Root does not exist/);
	});
});

test("new-workspace-run integrates with prune-workspace-artifacts recognition", () => {
	withTempRoot((root) => {
		const newRun = spawnSync(
			"node",
			[SCRIPT_PATH, "--root", root, "--label", "integration"],
			{ encoding: "utf-8" },
		);
		assert.equal(newRun.status, 0, newRun.stderr);
		const payload = JSON.parse(newRun.stdout);

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
