import assert from "node:assert/strict";
import test from "node:test";

import { renderActionBuckets } from "./claim-status-action-buckets.mjs";

function formatCounts(counts) {
	return Object.entries(counts ?? {}).map(([key, value]) => `${key}: ${value}`).join(", ") || "-";
}

function table(headers, rows) {
	return [
		`| ${headers.join(" | ")} |`,
		`| ${headers.map(() => "---").join(" | ")} |`,
		...rows.map((row) => `| ${row.join(" | ")} |`),
	];
}

test("renderActionBuckets shows bounded cross-cutting signal samples against signal count", () => {
	const lines = [];
	renderActionBuckets(
		lines,
		{
			actionSummary: {
				primaryBuckets: [],
				crossCuttingSignals: [
					{
						id: "heuristic-review-needed",
						count: 6,
						summary: "Review heuristic labels.",
						sampleClaimIds: ["claim-one", "claim-two", "claim-three", "claim-four", "claim-five"],
					},
				],
			},
		},
		new Map(),
		2,
		{ formatCounts, table },
	);

	const rendered = lines.join("\n");
	assert.match(rendered, /Cross-cutting signal: heuristic-review-needed \(6\) - Review heuristic labels.; samples \(5 of 6\): claim-one, claim-two, claim-three, claim-four, claim-five, \.\.\./);
	assert.doesNotMatch(rendered, /claim-six/);
});
