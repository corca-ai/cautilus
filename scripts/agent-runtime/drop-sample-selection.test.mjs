import assert from "node:assert/strict";
import test from "node:test";

import { selectDroppedUpdateSamples } from "./drop-sample-selection.mjs";

test("selectDroppedUpdateSamples preserves late reason representation within the bound", () => {
	const samples = [
		...Array.from({ length: 21 }, (_, index) => ({
			reviewResultPath: `review-${index}.json`,
			claimId: `claim-missing-${index}`,
			claimFingerprint: "",
			reason: "missing-fingerprint",
		})),
		{
			reviewResultPath: "review-live.json",
			claimId: "claim-live",
			claimFingerprint: "sha256:old",
			reason: "missing-live-fingerprint",
		},
	];

	const selected = selectDroppedUpdateSamples(samples, 20);

	assert.equal(selected.length, 20);
	assert.equal(selected.filter((sample) => sample.reason === "missing-fingerprint").length, 19);
	assert.equal(selected.filter((sample) => sample.reason === "missing-live-fingerprint").length, 1);
	assert.equal(selected.at(-1).claimId, "claim-live");
});

test("selectDroppedUpdateSamples does not invent representation beyond the cap", () => {
	const samples = [
		{ claimId: "claim-a-1", reason: "reason-a" },
		{ claimId: "claim-a-2", reason: "reason-a" },
		{ claimId: "claim-b", reason: "reason-b" },
		{ claimId: "claim-c", reason: "reason-c" },
	];

	const selected = selectDroppedUpdateSamples(samples, 2);

	assert.equal(selected.length, 2);
	assert.deepEqual(
		selected.map((sample) => sample.reason),
		["reason-a", "reason-b"],
	);
});

test("selectDroppedUpdateSamples handles special reason keys as data", () => {
	const samples = [
		{ claimId: "claim-normal-1", reason: "normal" },
		{ claimId: "claim-normal-2", reason: "normal" },
		{ claimId: "claim-proto", reason: "__proto__" },
	];

	const selected = selectDroppedUpdateSamples(samples, 2);

	assert.deepEqual(
		selected.map((sample) => sample.reason),
		["normal", "__proto__"],
	);
});
