import assert from "node:assert/strict";
import { existsSync, mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import test from "node:test";
import {
	ACTIVE_RUN_ENV_VAR,
	DEFAULT_RUNS_ROOT,
	resolveRunDir,
} from "./active-run.mjs";
import { RUN_MANIFEST_NAME } from "./workspace-start.mjs";

function withTempBase(fn) {
	const base = mkdtempSync(join(tmpdir(), "cautilus-active-run-"));
	try {
		fn(base);
	} finally {
		rmSync(base, { recursive: true, force: true });
	}
}

test("explicit outputDir wins and is created if missing", () => {
	withTempBase((base) => {
		const target = join(base, "explicit-out");
		const result = resolveRunDir({
			outputDir: target,
			env: { [ACTIVE_RUN_ENV_VAR]: join(base, "ignored") },
			now: new Date("2026-04-11T10:00:00.000Z"),
		});
		assert.equal(result.source, "explicit");
		assert.equal(result.created, false);
		assert.equal(result.runDir, resolve(target));
		assert.equal(existsSync(result.runDir), true);
	});
});

test("explicit outputDir is resolved against an explicit cwd", () => {
	withTempBase((base) => {
		const result = resolveRunDir({
			outputDir: "relative-out",
			cwd: base,
			env: {},
			now: new Date("2026-04-11T10:00:00.000Z"),
		});
		assert.equal(result.runDir, resolve(base, "relative-out"));
		assert.equal(existsSync(result.runDir), true);
	});
});

test("env var is used when no explicit outputDir is provided", () => {
	withTempBase((base) => {
		const active = join(base, "active-from-env");
		mkdirSync(active, { recursive: true });
		const result = resolveRunDir({
			env: { [ACTIVE_RUN_ENV_VAR]: active },
			now: new Date("2026-04-11T10:00:00.000Z"),
		});
		assert.equal(result.source, "active");
		assert.equal(result.created, false);
		assert.equal(result.runDir, resolve(active));
	});
});

test("env var pointing at a missing directory fails loudly", () => {
	withTempBase((base) => {
		assert.throws(
			() =>
				resolveRunDir({
					env: { [ACTIVE_RUN_ENV_VAR]: join(base, "missing") },
					now: new Date("2026-04-11T10:00:00.000Z"),
				}),
			new RegExp(`${ACTIVE_RUN_ENV_VAR} does not exist`),
		);
	});
});

test("env var pointing at a regular file fails loudly", () => {
	withTempBase((base) => {
		const filePath = join(base, "not-a-dir");
		writeFileSync(filePath, "regular file", "utf-8");
		assert.throws(
			() =>
				resolveRunDir({
					env: { [ACTIVE_RUN_ENV_VAR]: filePath },
					now: new Date("2026-04-11T10:00:00.000Z"),
				}),
			new RegExp(`${ACTIVE_RUN_ENV_VAR} must be a directory`),
		);
	});
});

test("auto-materialize creates a fresh runDir under an explicit root", () => {
	withTempBase((base) => {
		const root = join(base, "custom-root");
		const result = resolveRunDir({
			root,
			label: "Mode Held-Out",
			env: {},
			now: new Date("2026-04-11T10:32:15.123Z"),
		});
		assert.equal(result.source, "auto");
		assert.equal(result.created, true);
		assert.equal(result.label, "mode-held-out");
		assert.equal(result.root, resolve(root));
		assert.equal(result.runDir, resolve(root, "20260411T103215123Z-mode-held-out"));
		assert.equal(existsSync(result.runDir), true);
		assert.equal(existsSync(join(result.runDir, RUN_MANIFEST_NAME)), true);
	});
});

test("auto-materialize creates the explicit root recursively when missing", () => {
	withTempBase((base) => {
		const root = join(base, "nested", "missing", "root");
		const result = resolveRunDir({
			root,
			label: "fresh",
			env: {},
			now: new Date("2026-04-11T10:32:15.000Z"),
		});
		assert.equal(result.source, "auto");
		assert.equal(existsSync(result.root), true);
		assert.equal(existsSync(result.runDir), true);
	});
});

test("auto-materialize falls back to the default root relative to cwd", () => {
	withTempBase((base) => {
		const result = resolveRunDir({
			cwd: base,
			label: "fallback",
			env: {},
			now: new Date("2026-04-11T10:32:15.000Z"),
		});
		assert.equal(result.source, "auto");
		assert.equal(result.root, resolve(base, DEFAULT_RUNS_ROOT));
		assert.equal(result.runDir, resolve(base, DEFAULT_RUNS_ROOT, "20260411T103215000Z-fallback"));
		assert.equal(existsSync(result.runDir), true);
	});
});

test("explicit outputDir overrides an active env var", () => {
	withTempBase((base) => {
		const active = join(base, "active");
		mkdirSync(active, { recursive: true });
		const explicit = join(base, "explicit");
		const result = resolveRunDir({
			outputDir: explicit,
			env: { [ACTIVE_RUN_ENV_VAR]: active },
			now: new Date("2026-04-11T10:32:15.000Z"),
		});
		assert.equal(result.source, "explicit");
		assert.equal(result.runDir, resolve(explicit));
	});
});

test("env var beats auto-materialize fallback", () => {
	withTempBase((base) => {
		const active = join(base, "active");
		mkdirSync(active, { recursive: true });
		const result = resolveRunDir({
			cwd: base,
			env: { [ACTIVE_RUN_ENV_VAR]: active },
			now: new Date("2026-04-11T10:32:15.000Z"),
		});
		assert.equal(result.source, "active");
		assert.equal(result.runDir, resolve(active));
		// auto-materialize default root must NOT have been created
		assert.equal(existsSync(resolve(base, DEFAULT_RUNS_ROOT)), false);
	});
});

test("auto-materialize uses the default label when none is provided", () => {
	withTempBase((base) => {
		const result = resolveRunDir({
			cwd: base,
			env: {},
			now: new Date("2026-04-11T10:32:15.000Z"),
		});
		assert.equal(result.source, "auto");
		assert.equal(result.label, "run");
		assert.match(result.runDir, /\/20260411T103215000Z-run$/);
	});
});
