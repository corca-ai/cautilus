import assert from "node:assert/strict";
import test from "node:test";

import {
	buildModeSummaryText,
	classifyScenarioBuckets,
	resolvedModeStatus,
} from "./mode-evaluation-summary.mjs";

test("mode-evaluation-summary treats comparison-backed regressions as rejected", () => {
	const scenarioResults = {
		results: [{ scenarioId: "operator-guidance-smoke", status: "failed" }],
		compareArtifact: {
			regressed: ["operator-guidance-smoke"],
		},
	};
	const scenarioBuckets = classifyScenarioBuckets(scenarioResults);
	assert.deepEqual(scenarioBuckets, {
		improved: [],
		regressed: ["operator-guidance-smoke"],
		unchanged: [],
		noisy: [],
	});
	assert.equal(resolvedModeStatus([{ status: "failed" }], scenarioResults), "rejected");
	assert.equal(
		buildModeSummaryText("held_out", "rejected", 1, scenarioBuckets),
		"held_out completed comparison and reported 1 regression.",
	);
});
