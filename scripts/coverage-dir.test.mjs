import assert from "node:assert/strict";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { spawnSync } from "node:child_process";
import test from "node:test";

function runNode(script, coverageDir) {
	return spawnSync(process.execPath, [script], {
		cwd: process.cwd(),
		encoding: "utf-8",
		env: { ...process.env, COVERAGE_DIR: coverageDir },
	});
}

function coverageEntry({ statements = 30, percent }) {
	return {
		language: "node",
		summary: {
			num_statements: statements,
			covered_statements: Math.round((statements * percent) / 100),
			percent_covered: percent,
		},
	};
}

function writeAggregate(coverageDir, files) {
	writeFileSync(
		join(coverageDir, "coverage.json"),
		`${JSON.stringify({ languages: ["node"], files }, null, 2)}\n`,
	);
}

test("coverage summary scripts honor COVERAGE_DIR", () => {
	const coverageDir = mkdtempSync(join(tmpdir(), "cautilus-coverage-dir-"));
	try {
		writeFileSync(
			join(coverageDir, "go.out"),
			[
				"mode: atomic",
				"github.com/corca-ai/cautilus/internal/app/app.go:1.1,2.1 2 1",
				"",
			].join("\n"),
		);
		writeFileSync(
			join(coverageDir, "lcov.info"),
			[
				"TN:",
				`SF:${join(process.cwd(), "scripts", "profile-specdown.mjs")}`,
				"DA:1,1",
				"DA:2,0",
				"end_of_record",
				"",
			].join("\n"),
		);

		assert.equal(runNode("scripts/summarize-go-coverage.mjs", coverageDir).status, 0);
		assert.equal(runNode("scripts/summarize-node-coverage.mjs", coverageDir).status, 0);
		assert.equal(runNode("scripts/aggregate-coverage.mjs", coverageDir).status, 0);

		const aggregate = JSON.parse(readFileSync(join(coverageDir, "coverage.json"), "utf-8"));
		assert.ok(aggregate.files["internal/app/app.go"]);
		assert.ok(aggregate.files["scripts/profile-specdown.mjs"]);
	} finally {
		rmSync(coverageDir, { recursive: true, force: true });
	}
});

test("coverage floor check reads COVERAGE_DIR", () => {
	const coverageDir = mkdtempSync(join(tmpdir(), "cautilus-coverage-floor-"));
	try {
		const files = {
			"scripts/profile-specdown.mjs": coverageEntry({ percent: 100 }),
		};
		writeAggregate(coverageDir, files);
		const result = runNode("scripts/check-coverage-floor.mjs", coverageDir);
		assert.equal(result.status, 0, result.stderr);
		assert.match(result.stdout, /OK:/);
	} finally {
		rmSync(coverageDir, { recursive: true, force: true });
	}
});

test("coverage floor check warns on unfloored warn-band files", () => {
	const coverageDir = mkdtempSync(join(tmpdir(), "cautilus-coverage-floor-warn-"));
	try {
		writeAggregate(coverageDir, {
			"scripts/profile-specdown.mjs": coverageEntry({ percent: 85 }),
		});
		const result = runNode("scripts/check-coverage-floor.mjs", coverageDir);
		assert.equal(result.status, 0, result.stderr);
		assert.match(result.stderr, /WARN: unfloored files in warn-band/);
		assert.match(result.stdout, /1 in warn-band/);
	} finally {
		rmSync(coverageDir, { recursive: true, force: true });
	}
});

test("coverage floor check fails on unfloored low-coverage files", () => {
	const coverageDir = mkdtempSync(join(tmpdir(), "cautilus-coverage-floor-low-"));
	try {
		writeAggregate(coverageDir, {
			"scripts/profile-specdown.mjs": coverageEntry({ percent: 70 }),
		});
		const result = runNode("scripts/check-coverage-floor.mjs", coverageDir);
		assert.equal(result.status, 1);
		assert.match(result.stderr, /FAIL: unfloored files below fail_below_pct/);
		assert.match(result.stderr, /scripts\/profile-specdown\.mjs/);
	} finally {
		rmSync(coverageDir, { recursive: true, force: true });
	}
});

test("coverage floor check reports floor regressions and promotion candidates", () => {
	const coverageDir = mkdtempSync(join(tmpdir(), "cautilus-coverage-floor-declared-"));
	try {
		writeAggregate(coverageDir, {
			"internal/app/app.go": coverageEntry({ statements: 2559, percent: 55 }),
			"internal/app/remaining_commands.go": coverageEntry({ statements: 101, percent: 68 }),
		});
		const result = runNode("scripts/check-coverage-floor.mjs", coverageDir);
		assert.equal(result.status, 1);
		assert.match(result.stderr, /WARN: floored files cleared drift-lock/);
		assert.match(result.stderr, /FAIL: floored files regressed below declared floor/);
		assert.match(result.stderr, /internal\/app\/app\.go/);
		assert.match(result.stderr, /internal\/app\/remaining_commands\.go/);
	} finally {
		rmSync(coverageDir, { recursive: true, force: true });
	}
});
