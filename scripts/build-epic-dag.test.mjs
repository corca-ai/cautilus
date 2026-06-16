import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import {
	flattenTreeClaims,
	applyEdges,
	epicCoverage,
	buildDag,
	EDGE_MAP,
} from "./build-epic-dag.mjs";

// Minimal tree fixture: two epics, one singleton claim, one flagged multi-epic claim.
function fixtureTree() {
	return {
		schemaVersion: "cautilus.epic_tree_proposal.v1-draft",
		derivedFrom: "fixture/gold-set.json",
		branches: ["Agent", "Discover"],
		totalClaims: 3,
		epics: [
			{
				epicId: "A1-orchestration",
				branch: "Agent",
				title: "agent owns routing",
				claims: [
					{ claimId: "c-home-a1", sourceRef: "README.md:1", group: "agent-first" },
				],
			},
			{
				epicId: "D1-discovery",
				branch: "Discover",
				title: "discovery emits candidates",
				claims: [
					{ claimId: "c-home-d1", sourceRef: "README.md:2", group: "claim-discovery" },
					{ claimId: "c-flagged", sourceRef: "README.md:3", group: "command-surface" },
				],
			},
		],
	};
}

const FIXTURE_EDGES = {
	"c-flagged": {
		supportingEpics: ["D1-discovery", "A1-orchestration"],
		rationale: "topic discovery (D1) + actor agent routing (A1)",
	},
};

test("flattenTreeClaims records primaryEpic = the tree home", () => {
	const claims = flattenTreeClaims(fixtureTree());
	assert.equal(claims.length, 3);
	assert.equal(claims.find((c) => c.claimId === "c-home-a1").primaryEpic, "A1-orchestration");
	assert.equal(claims.find((c) => c.claimId === "c-flagged").primaryEpic, "D1-discovery");
});

test("unflagged claims get a singleton supportingEpics = [primaryEpic]", () => {
	const tree = fixtureTree();
	const flat = flattenTreeClaims(tree);
	const { claims, errors } = applyEdges(flat, ["A1-orchestration", "D1-discovery"], FIXTURE_EDGES);
	assert.deepEqual(errors, []);
	const home = claims.find((c) => c.claimId === "c-home-d1");
	assert.deepEqual(home.supportingEpics, ["D1-discovery"]);
	assert.equal(home.multiEpic, false);
});

test("flagged claim gets the multi-epic edge with rationale", () => {
	const tree = fixtureTree();
	const flat = flattenTreeClaims(tree);
	const { claims } = applyEdges(flat, ["A1-orchestration", "D1-discovery"], FIXTURE_EDGES);
	const flagged = claims.find((c) => c.claimId === "c-flagged");
	assert.deepEqual(flagged.supportingEpics, ["D1-discovery", "A1-orchestration"]);
	assert.equal(flagged.multiEpic, true);
	assert.match(flagged.edgeRationale, /agent routing/);
});

test("applyEdges flags an edge to an unknown epic", () => {
	const flat = flattenTreeClaims(fixtureTree());
	const bad = { "c-flagged": { supportingEpics: ["D1-discovery", "Z9-nope"], rationale: "x" } };
	const { errors } = applyEdges(flat, ["A1-orchestration", "D1-discovery"], bad);
	assert.ok(errors.some((e) => /unknown epic Z9-nope/.test(e)));
});

test("applyEdges requires supportingEpics to include the primaryEpic", () => {
	const flat = flattenTreeClaims(fixtureTree());
	// c-flagged's home is D1-discovery; omit it -> error.
	const bad = { "c-flagged": { supportingEpics: ["A1-orchestration"], rationale: "x" } };
	const { errors } = applyEdges(flat, ["A1-orchestration", "D1-discovery"], bad);
	assert.ok(errors.some((e) => /must include primaryEpic D1-discovery/.test(e)));
});

test("applyEdges flags an edge map naming an unknown claim", () => {
	const flat = flattenTreeClaims(fixtureTree());
	const bad = { "c-does-not-exist": { supportingEpics: ["D1-discovery"], rationale: "x" } };
	const { errors } = applyEdges(flat, ["A1-orchestration", "D1-discovery"], bad);
	assert.ok(errors.some((e) => /unknown claim c-does-not-exist/.test(e)));
});

test("epicCoverage is the inverse of supportingEpics (primary + supporting)", () => {
	const tree = fixtureTree();
	const flat = flattenTreeClaims(tree);
	const { claims } = applyEdges(flat, ["A1-orchestration", "D1-discovery"], FIXTURE_EDGES);
	const cov = epicCoverage(claims, tree.epics);
	// A1 home: 1 claim; plus the flagged claim edges in as supporting -> total 2.
	assert.deepEqual(cov["A1-orchestration"], { branch: "Agent", primary: 1, supporting: 1, total: 2 });
	// D1 home: 2 claims (one is also the flagged claim's home) -> primary 2, total 2.
	assert.deepEqual(cov["D1-discovery"], { branch: "Discover", primary: 2, supporting: 0, total: 2 });
});

test("buildDag passes invariants on the fixture and preserves no orphans", () => {
	const tree = fixtureTree();
	// Patch EDGE_MAP lookups by injecting via a tree whose ids match the real map?
	// Instead test the real map against the real artifact below; here assert structure.
	const { artifact } = buildDag(tree);
	assert.equal(artifact.dagInvariants.totalClaims, 3);
	assert.equal(artifact.dagInvariants.orphanCount, 0);
	assert.equal(artifact.dagInvariants.everyClaimEdgesToAtLeastOneEpic, true);
	// fixture ids are not in the real EDGE_MAP, so all claims are singletons here.
	assert.equal(artifact.dagInvariants.multiEpicClaimCount, 0);
	assert.equal(artifact.claims.every((c) => c.supportingEpics.length >= 1), true);
});

// Real-artifact guard: the committed tree -> DAG transform must stay valid so the
// edge map can never drift from the 121-claim user-product track unnoticed.
test("real epic-tree-proposal builds a valid DAG (121 claims, 0 orphans, every edge resolves)", () => {
	const treePath =
		"charness-artifacts/eval-trust/goldset-v2-agent-extraction/epic-tree-proposal.json";
	const tree = JSON.parse(readFileSync(treePath, "utf8"));
	const { artifact } = buildDag(tree);
	const inv = artifact.dagInvariants;
	assert.equal(inv.pass, true, `errors: ${JSON.stringify(artifact.errors)}`);
	assert.equal(inv.totalClaims, 121);
	assert.equal(inv.orphanCount, 0);
	// every EDGE_MAP claim must be in the tree and become multiEpic.
	assert.equal(inv.multiEpicClaimCount, Object.keys(EDGE_MAP).length);
	// every claim's supportingEpics references a declared epic.
	const epicIds = new Set(artifact.epics.map((e) => e.epicId));
	for (const c of artifact.claims) {
		for (const e of c.supportingEpics) assert.ok(epicIds.has(e), `unknown epic ${e}`);
		assert.ok(c.supportingEpics.includes(c.primaryEpic));
	}
});
