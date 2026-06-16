import assert from "node:assert/strict";
import test from "node:test";
import {
	segmentByAudience,
	trackForAudience,
	trackFileName,
	TRACK_USER_PRODUCT,
	TRACK_DEVELOPER,
	TRACK_HOLDING,
} from "./segment-goldset-by-audience.mjs";

function entry(id, audience) {
	return {
		claimId: id,
		claimFingerprint: `sha256:${id}`,
		sourceRef: "README.md:1",
		summary: `summary for ${id}`,
		agentLabels: { claimAudience: audience },
		maintainerVerdict: "pending",
	};
}

function fixtureProposal(entries) {
	return {
		schemaVersion: "cautilus.gold_set_proposal.v2",
		purpose: "fixture",
		sourcePacket: "fixture/claims-agent.json",
		extractionMode: "agent",
		verdictDefinitions: { accept: "ok" },
		carriedForwardRules: ["R1"],
		entries,
	};
}

test("trackForAudience maps user/developer and falls back to holding", () => {
	assert.equal(trackForAudience("user"), TRACK_USER_PRODUCT);
	assert.equal(trackForAudience("developer"), TRACK_DEVELOPER);
	assert.equal(trackForAudience("unclear"), TRACK_HOLDING);
	assert.equal(trackForAudience(undefined), TRACK_HOLDING);
});

test("partitions entries into the correct tracks", () => {
	const proposal = fixtureProposal([
		entry("a", "user"),
		entry("b", "developer"),
		entry("c", "user"),
		entry("d", "unclear"),
	]);
	const { tracks, report } = segmentByAudience(proposal);
	assert.deepEqual(
		tracks[TRACK_USER_PRODUCT].entries.map((e) => e.claimId),
		["a", "c"],
	);
	assert.deepEqual(
		tracks[TRACK_DEVELOPER].entries.map((e) => e.claimId),
		["b"],
	);
	assert.deepEqual(
		tracks[TRACK_HOLDING].entries.map((e) => e.claimId),
		["d"],
	);
	assert.deepEqual(report.counts, {
		[TRACK_USER_PRODUCT]: 2,
		[TRACK_DEVELOPER]: 1,
		[TRACK_HOLDING]: 1,
	});
});

test("acceptance: segmentation is reversible (no loss, no duplication)", () => {
	const proposal = fixtureProposal([
		entry("a", "user"),
		entry("b", "developer"),
		entry("c", "developer"),
		entry("d", "user"),
	]);
	const { report } = segmentByAudience(proposal);
	assert.equal(report.total, 4);
	assert.equal(report.unionCount, 4);
	assert.equal(report.noLoss, true);
	assert.equal(report.noDuplication, true);
	assert.equal(report.unionEqualsOriginal, true);
	assert.equal(report.pass, true);
});

test("acceptance: user-product track excludes developer-audience claims", () => {
	const proposal = fixtureProposal([
		entry("a", "user"),
		entry("b", "developer"),
	]);
	const { tracks, report } = segmentByAudience(proposal);
	assert.equal(report.userProductExcludesDeveloper, true);
	assert.ok(
		tracks[TRACK_USER_PRODUCT].entries.every(
			(e) => e.agentLabels.claimAudience === "user",
		),
	);
});

test("preserves top-level metadata and records segmentation provenance", () => {
	const proposal = fixtureProposal([entry("a", "user")]);
	const { tracks } = segmentByAudience(proposal, { segmentedFrom: "src.json" });
	const t = tracks[TRACK_USER_PRODUCT];
	assert.equal(t.schemaVersion, "cautilus.gold_set_proposal.v2");
	assert.equal(t.sourcePacket, "fixture/claims-agent.json");
	assert.deepEqual(t.carriedForwardRules, ["R1"]);
	assert.equal(t.track, TRACK_USER_PRODUCT);
	assert.equal(t.segmentedBy, "claimAudience");
	assert.equal(t.segmentedFrom, "src.json");
	assert.equal("entries" in t, true);
});

test("trackFileName derives <stem>.<track>.json", () => {
	assert.equal(
		trackFileName("gold-set-proposal.json", TRACK_USER_PRODUCT),
		"gold-set-proposal.user-product.json",
	);
	assert.equal(
		trackFileName("gold-set-proposal.json", TRACK_DEVELOPER),
		"gold-set-proposal.developer.json",
	);
});

test("determinism: repeated segmentation yields identical track ordering", () => {
	const proposal = fixtureProposal([
		entry("a", "user"),
		entry("b", "developer"),
		entry("c", "user"),
	]);
	const first = segmentByAudience(proposal);
	const second = segmentByAudience(proposal);
	assert.deepEqual(
		first.tracks[TRACK_USER_PRODUCT].entries,
		second.tracks[TRACK_USER_PRODUCT].entries,
	);
	assert.deepEqual(first.report, second.report);
});
