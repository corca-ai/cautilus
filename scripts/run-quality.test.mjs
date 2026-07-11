import assert from "node:assert/strict";
import { chmodSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { spawnSync } from "node:child_process";
import test from "node:test";

const QUALITY_SCRIPT = join(process.cwd(), "scripts", "run-quality.sh");

function withFakeNpm(run) {
	const root = mkdtempSync(join(tmpdir(), "cautilus-quality-runner-"));
	try {
		const logPath = join(root, "npm.log");
		const npmPath = join(root, "npm");
		writeFileSync(
			npmPath,
			[
				"#!/usr/bin/env sh",
				"set -eu",
				'printf "%s\\n" "$*" >> "$CAUTILUS_QUALITY_NPM_LOG"',
				"",
			].join("\n"),
			"utf-8",
		);
		chmodSync(npmPath, 0o755);
		run({ npmPath, logPath });
	} finally {
		rmSync(root, { recursive: true, force: true });
	}
}

function runQuality(args, { npmPath, logPath }) {
	return spawnSync(QUALITY_SCRIPT, args, {
		encoding: "utf-8",
		env: {
			...process.env,
			CAUTILUS_QUALITY_NPM: npmPath,
			CAUTILUS_QUALITY_NPM_LOG: logPath,
		},
	});
}

function readLog(path) {
	return readFileSync(path, "utf-8").trim().split("\n").filter(Boolean);
}

test("run-quality --read-only skips artifact-writing dogfood", () => {
	withFakeNpm(({ npmPath, logPath }) => {
		const result = runQuality(["--read-only"], { npmPath, logPath });
		assert.equal(result.status, 0, result.stderr);
		assert.deepEqual(readLog(logPath), ["run verify"]);
		assert.match(result.stdout, /quality: verify started/);
		assert.match(result.stdout, /quality: self dogfood skipped for --read-only/);
	});
});

test("run-quality default records runtime evidence before self dogfood", () => {
	withFakeNpm(({ npmPath, logPath }) => {
		const result = runQuality([], { npmPath, logPath });
		assert.equal(result.status, 0, result.stderr);
		assert.deepEqual(readLog(logPath), ["run verify:runtime", "run dogfood:self"]);
		assert.match(result.stdout, /quality: verify started/);
		assert.match(result.stdout, /quality: self dogfood started/);
	});
});

test("run-quality rejects unknown arguments", () => {
	const result = spawnSync(QUALITY_SCRIPT, ["--wat"], {
		encoding: "utf-8",
	});
	assert.equal(result.status, 1);
	assert.match(result.stderr, /unknown argument: --wat/);
	assert.match(result.stderr, /Usage:/);
});
