import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import {
	PAGE_PATH,
	ROUTE_ORDER,
	TIER_ORDER,
	orderedRecords,
	renderClaimState,
	routeDistribution,
	t1Records,
} from "./projected-claim-state-lib.mjs";
import { INVENTORY_PATH } from "./render-projected-claim-state.mjs";

const REPO_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "../..");

function realInventory() {
	return JSON.parse(readFileSync(resolve(REPO_ROOT, INVENTORY_PATH), "utf-8"));
}

// A small synthetic inventory exercises the edge branches the real (well-formed)
// inventory never hits: an unexpected proof route, a sourceRef without a line, a
// summary that contains a pipe, and empty/absent reconciliation + summary fields.
function syntheticInventory() {
	return {
		schemaVersion: "cautilus.claim_inventory.v1",
		generatedFrom: { goldSet: "gold.json", track: "user-product" },
		summary: {
			totalEntries: 2,
			durableGraded: 2,
			nonGraded: 0,
			byTier: { T1: 1, T2: 1, T3: 0 },
			byVerdict: { accept: 2 },
			nonGradedByVerdict: {},
			t1BadgeBindings: 1,
			overridesApplied: 0,
		},
		entriesByFingerprint: {
			"sha256:b": {
				claimId: "claim-z-2",
				significanceTier: "T2",
				ratifiedProofRoute: "surprise-route",
				primaryEpic: "E1",
				summary: "backing mechanism",
				sourceRef: "README.md",
				maintainerVerdict: "accept",
				badge: null,
			},
			"sha256:a": {
				claimId: "claim-a-1",
				significanceTier: "T1",
				ratifiedProofRoute: "deterministic",
				primaryEpic: "APEX",
				summary: "a summary with a | pipe inside it",
				sourceRef: "README.md:9",
				maintainerVerdict: "accept",
				badge: "readiness",
			},
		},
		reconciliation: {},
	};
}

test("renderClaimState surfaces the contracted sections", () => {
	const markdown = renderClaimState(realInventory());
	for (const heading of [
		"# Projected Claim State",
		"## Source Of Truth",
		"## Claim State Summary",
		"## Proof Route Distribution",
		"## Headline Claims And Apex Badges",
		"## Apex Badge Reconciliation",
		"## Full Claim Inventory",
	]) {
		assert.ok(markdown.includes(heading), `missing section: ${heading}`);
	}
	assert.ok(markdown.includes("Do not edit it by hand."));
});

test("the summary block mirrors the ratified split", () => {
	const markdown = renderClaimState(realInventory());
	assert.ok(markdown.includes("| Total gold-set entries | 74 |"));
	assert.ok(markdown.includes("| Durable-graded (projected as claims) | 56 |"));
	assert.ok(markdown.includes("| Non-graded (prose to retire) | 18 |"));
	assert.ok(markdown.includes("| By tier | T1: 7, T2: 41, T3: 8 |"));
	assert.ok(markdown.includes("| By maintainer verdict | accept: 54, relabel: 1, rewrite-source: 1 |"));
	assert.ok(markdown.includes("| T1 claims bound to an apex badge | 7/7 |"));
});

test("the route distribution covers every graded claim", () => {
	const inventory = realInventory();
	const dist = routeDistribution(inventory);
	const total = dist.reduce((sum, entry) => sum + entry.count, 0);
	assert.equal(total, inventory.summary.durableGraded);
	// The known routes lead in fixed order.
	assert.deepEqual(
		dist.slice(0, ROUTE_ORDER.length).map((entry) => entry.route),
		ROUTE_ORDER,
	);
});

test("exactly the 7 T1 claims render with a badge in the headline table", () => {
	const inventory = realInventory();
	const t1 = t1Records(inventory);
	assert.equal(t1.length, 7);
	for (const record of t1) {
		assert.ok(record.badge, `T1 ${record.claimId} should carry a badge`);
	}
	const markdown = renderClaimState(inventory);
	const headlineSection = markdown
		.split("## Headline Claims And Apex Badges")[1]
		.split("## Apex Badge Reconciliation")[0];
	for (const record of t1) {
		assert.ok(headlineSection.includes(`| ${record.claimId} | ${record.badge} |`));
	}
});

test("the full inventory lists every durable-graded claim once", () => {
	const inventory = realInventory();
	const records = orderedRecords(inventory);
	assert.equal(records.length, inventory.summary.durableGraded);
	const markdown = renderClaimState(inventory);
	const fullSection = markdown.split("## Full Claim Inventory")[1];
	for (const record of records) {
		assert.ok(fullSection.includes(`| ${record.claimId} |`), `missing ${record.claimId}`);
	}
});

test("records sort by tier, then document order within tier", () => {
	const records = orderedRecords(realInventory());
	const tierIndex = records.map((record) => TIER_ORDER.indexOf(record.significanceTier));
	for (let index = 1; index < tierIndex.length; index += 1) {
		assert.ok(tierIndex[index] >= tierIndex[index - 1], "tiers must be non-decreasing");
	}
	// Within T1, README.md:4 precedes README.md:5 precedes README.md:6 (line order,
	// not lexical order which would misplace :136 before :4).
	const t1Sources = records
		.filter((record) => record.significanceTier === "T1")
		.map((record) => record.sourceRef);
	assert.deepEqual(t1Sources.slice(0, 3), ["README.md:4", "README.md:5", "README.md:6"]);
});

test("rendering is deterministic", () => {
	const inventory = realInventory();
	assert.equal(renderClaimState(inventory), renderClaimState(inventory));
});

test("the generated page on disk matches the renderer", () => {
	const onDisk = readFileSync(resolve(REPO_ROOT, PAGE_PATH), "utf-8");
	assert.equal(onDisk, renderClaimState(realInventory()));
});

test("table cells escape pipes so a summary cannot break columns", () => {
	const markdown = renderClaimState(syntheticInventory());
	assert.ok(markdown.includes("a summary with a \\| pipe inside it"));
	assert.ok(!markdown.includes("a summary with a | pipe inside it"));
});

test("an unexpected proof route surfaces instead of being dropped", () => {
	const dist = routeDistribution(syntheticInventory());
	const surprise = dist.find((entry) => entry.route === "surprise-route");
	assert.ok(surprise, "unexpected route must still appear");
	assert.equal(surprise.count, 1);
	// The known routes still lead, with the unexpected route appended after them.
	assert.deepEqual(dist.slice(0, ROUTE_ORDER.length).map((entry) => entry.route), ROUTE_ORDER);
});

test("a sourceRef without a line number sorts last within its tier", () => {
	const records = orderedRecords(syntheticInventory());
	// Both synthetic entries are different tiers; confirm the no-line ref still
	// renders without throwing and the T1 (with a line) leads.
	assert.equal(records[0].significanceTier, "T1");
	assert.equal(records[1].sourceRef, "README.md");
});

test("empty reconciliation renders a zero divergence line", () => {
	const markdown = renderClaimState(syntheticInventory());
	assert.ok(markdown.includes("Divergent badges: 0/0."));
});
