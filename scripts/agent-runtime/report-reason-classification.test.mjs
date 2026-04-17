import assert from "node:assert/strict";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";

import {
	classifyModeSummary,
	summarizeReportReasons,
} from "./report-reason-classification.mjs";

test("report reason classification surfaces provider rate-limit contamination", () => {
	const root = mkdtempSync(join(tmpdir(), "cautilus-report-reason-"));
	try {
		const stderrFile = join(root, "held-out.stderr");
		writeFileSync(stderrFile, "Error: Rate limit reached for gpt-4.1 after repeated retries.\n", "utf-8");
		const modeSummary = {
			mode: "held_out",
			status: "rejected",
			summary: "held_out completed comparison and reported 1 regression.",
		};
		const modeRun = {
			scenarioResults: {
				compareArtifact: {},
			},
		};
		const commandObservations = [
			{
				stage: "held_out",
				stderrFile,
			},
		];
		const classified = classifyModeSummary(modeSummary, modeRun, commandObservations);
		assert.deepEqual(classified.reasonCodes, [
			"behavior_regression",
			"provider_rate_limit_contamination",
		]);
		assert.equal(classified.warnings[0].category, "runtime_provider_contamination");
		assert.match(classified.warnings[0].summary, /provider rate limits/);
		const reportSummary = summarizeReportReasons([{ ...modeSummary, ...classified }]);
		assert.deepEqual(reportSummary.reasonCodes, [
			"behavior_regression",
			"provider_rate_limit_contamination",
		]);
		assert.equal(reportSummary.warnings.length, 1);
	} finally {
		rmSync(root, { recursive: true, force: true });
	}
});
