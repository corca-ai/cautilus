import { test } from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import {
	formatTextReport,
	lintSpecsSubphaseReport,
	parseArgs,
} from "./report-lint-specs-runtime.mjs";

function runtimeSignals() {
	return {
		generatedAt: "2026-07-09T00:00:00.000Z",
		status: "passed",
		profiles: {
			"local-verify": {
				commands: {
					"lint · specs": {
						latest: { timestamp: "2026-07-09T00:00:00.000Z", elapsed_ms: 15800 },
						subphases: {
							check: {
								latest: { timestamp: "2026-07-09T00:00:00.000Z", elapsed_ms: 10 },
								median_recent_elapsed_ms: 10,
								max_recent_elapsed_ms: 11,
								recent_elapsed_ms: [10, 11],
								samples: 2,
							},
							specdown: {
								latest: { timestamp: "2026-07-09T00:00:00.000Z", elapsed_ms: 13530 },
								median_recent_elapsed_ms: 13520,
								max_recent_elapsed_ms: 13530,
								recent_elapsed_ms: [13510, 13530],
								samples: 2,
							},
							trace: {
								latest: { timestamp: "2026-07-09T00:00:00.000Z", elapsed_ms: 2250 },
								median_recent_elapsed_ms: 2260,
								max_recent_elapsed_ms: 2300,
								recent_elapsed_ms: [2300, 2250],
								samples: 2,
							},
						},
					},
				},
			},
		},
	};
}

function failedRuntimeSignalsWithPreservedSubphases() {
	const signals = runtimeSignals();
	signals.generatedAt = "2026-07-09T01:00:00.000Z";
	signals.status = "failed";
	signals.failedPhase = "lint:specs";
	signals.profiles["local-verify"].commands["lint · specs"].latest = {
		timestamp: "2026-07-09T01:00:00.000Z",
		elapsed_ms: 5000,
	};
	return signals;
}

test("parseArgs defaults to the repo runtime signal", () => {
	assert.deepEqual(parseArgs([]), {
		help: false,
		json: false,
		profile: "local-verify",
		signalPath: ".charness/quality/runtime-signals.json",
	});
});

test("parseArgs recognizes report options", () => {
	assert.deepEqual(parseArgs(["--json", "--profile", "ci", "--signal", "out.json"]), {
		help: false,
		json: true,
		profile: "ci",
		signalPath: "out.json",
	});
});

test("parseArgs rejects missing option values", () => {
	assert.throws(() => parseArgs(["--profile"]), /--profile requires an id/);
	assert.throws(() => parseArgs(["--signal"]), /--signal requires a path/);
});

test("lintSpecsSubphaseReport sorts subphases by latest runtime", () => {
	const report = lintSpecsSubphaseReport(runtimeSignals(), {
		profile: "local-verify",
		signalPath: "runtime.json",
	});

	assert.equal(report.schemaVersion, "cautilus.lint_specs_runtime_subphases.v1");
	assert.equal(report.signalStatus, "passed");
	assert.equal(report.generatedAt, "2026-07-09T00:00:00.000Z");
	assert.equal(report.commandLatestElapsedMs, 15800);
	assert.equal(report.commandLatestTimestamp, "2026-07-09T00:00:00.000Z");
	assert.deepEqual(report.warnings, []);
	assert.deepEqual(report.subphases.map((entry) => entry.label), [
		"specdown",
		"trace",
		"check",
	]);
	assert.equal(report.subphases[0].latestElapsedMs, 13530);
	assert.equal(report.subphases[0].medianRecentElapsedMs, 13520);
	assert.equal(report.subphases[0].maxRecentElapsedMs, 13530);
	assert.equal(report.subphases[0].samples, 2);
});

test("lintSpecsSubphaseReport rejects missing subphase samples", () => {
	assert.throws(
		() => lintSpecsSubphaseReport({ profiles: {} }, { profile: "local-verify" }),
		/no lint · specs samples/,
	);
	assert.throws(
		() => lintSpecsSubphaseReport({
			profiles: {
				"local-verify": {
					commands: {
						"lint · specs": {},
					},
				},
			},
		}),
		/no lint · specs subphase samples/,
	);
});

test("lintSpecsSubphaseReport warns when preserved subphase samples are stale", () => {
	const report = lintSpecsSubphaseReport(failedRuntimeSignalsWithPreservedSubphases(), {
		profile: "local-verify",
		signalPath: "runtime.json",
	});

	assert.equal(report.signalStatus, "failed");
	assert.equal(report.failedPhase, "lint:specs");
	assert.equal(report.commandLatestTimestamp, "2026-07-09T01:00:00.000Z");
	assert.deepEqual(report.warnings, [
		"runtime signal status is failed; subphase samples may include preserved earlier timings",
		"subphase samples older than command latest: specdown, trace, check",
		"runtime signal failed phase: lint:specs",
	]);
});

test("formatTextReport renders compact operator output", () => {
	const report = lintSpecsSubphaseReport(runtimeSignals(), {
		profile: "local-verify",
		signalPath: "runtime.json",
	});
	const text = formatTextReport(report);

	assert.match(text, /lint · specs subphases \(profile local-verify, source runtime\.json\)/);
	assert.match(text, /runtime status passed; command latest 15\.80s at 2026-07-09T00:00:00\.000Z/);
	assert.match(text, /- specdown: latest 13\.53s at 2026-07-09T00:00:00\.000Z, median 13\.52s, max 13\.53s, samples 2/);
	assert.match(text, /- check: latest 10ms at 2026-07-09T00:00:00\.000Z, median 10ms, max 11ms, samples 2/);
});

test("formatTextReport renders stale-sample warnings", () => {
	const report = lintSpecsSubphaseReport(failedRuntimeSignalsWithPreservedSubphases(), {
		profile: "local-verify",
		signalPath: "runtime.json",
	});
	const text = formatTextReport(report);

	assert.match(text, /runtime status failed; command latest 5\.00s at 2026-07-09T01:00:00\.000Z/);
	assert.match(text, /warning: runtime signal status is failed/);
	assert.match(text, /warning: subphase samples older than command latest: specdown, trace, check/);
});

test("CLI emits JSON from a runtime signal file", () => {
	const root = mkdtempSync(join(tmpdir(), "cautilus-lint-specs-runtime-"));
	const signalPath = join(root, "runtime.json");
	writeFileSync(signalPath, `${JSON.stringify(runtimeSignals(), null, 2)}\n`);

	const result = spawnSync(
		process.execPath,
		[
			"scripts/report-lint-specs-runtime.mjs",
			"--json",
			"--signal",
			signalPath,
		],
		{ encoding: "utf-8" },
	);

	assert.equal(result.status, 0);
	const report = JSON.parse(result.stdout);
	assert.equal(report.profile, "local-verify");
	assert.deepEqual(report.subphases.map((entry) => entry.label), [
		"specdown",
		"trace",
		"check",
	]);
});
