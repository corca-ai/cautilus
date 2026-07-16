import assert from "node:assert/strict";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { spawnSync } from "node:child_process";
import test from "node:test";

function runNode(script, coverageDir, extraEnv = {}) {
	return spawnSync(process.execPath, [script], {
		cwd: process.cwd(),
		encoding: "utf-8",
		env: { ...process.env, COVERAGE_DIR: coverageDir, ...extraEnv },
	});
}

// Write a hermetic floor + exemptions fixture so the floor-check assertions
// depend on this test's declared floor, not the live scripts/coverage-floor.json
// (which the sanctioned `coverage:floor:write` is allowed to rewrite).
function floorEnv(coverageDir, floor = {}) {
	const floorPath = join(coverageDir, "coverage-floor.json");
	const exemptionsPath = join(coverageDir, "coverage-floor-exemptions.txt");
	writeFileSync(floorPath, `${JSON.stringify(floor, null, 2)}\n`);
	writeFileSync(exemptionsPath, "# hermetic test fixture: no exemptions\n");
	return { COVERAGE_FLOOR_PATH: floorPath, COVERAGE_FLOOR_EXEMPTIONS_PATH: exemptionsPath };
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
			"scripts/profile-specdown.mjs": coverageEntry({ percent: 100, statements: 100 }),
		};
		writeAggregate(coverageDir, files);
		const result = runNode("scripts/check-coverage-floor.mjs", coverageDir, floorEnv(coverageDir));
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
			"scripts/profile-specdown.mjs": coverageEntry({ percent: 85, statements: 100 }),
		});
		const result = runNode("scripts/check-coverage-floor.mjs", coverageDir, floorEnv(coverageDir));
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
			"scripts/profile-specdown.mjs": coverageEntry({ percent: 70, statements: 100 }),
		});
		const result = runNode("scripts/check-coverage-floor.mjs", coverageDir, floorEnv(coverageDir));
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
		// Synthetic floors (deliberately unlike the live floor values) chosen so
		// app.go clears drift-lock (55 >= 50 + 1) and remaining_commands.go
		// regresses (68 < 75), independent of scripts/coverage-floor.json.
		const result = runNode("scripts/check-coverage-floor.mjs", coverageDir, floorEnv(coverageDir, {
			"internal/app/app.go": 50.0,
			"internal/app/remaining_commands.go": 75.0,
		}));
		assert.equal(result.status, 1);
		assert.match(result.stderr, /WARN: floored files cleared drift-lock/);
		assert.match(result.stderr, /FAIL: floored files regressed below declared floor/);
		assert.match(result.stderr, /internal\/app\/app\.go/);
		assert.match(result.stderr, /internal\/app\/remaining_commands\.go/);
	} finally {
		rmSync(coverageDir, { recursive: true, force: true });
	}
});
