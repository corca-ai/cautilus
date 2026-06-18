import assert from "node:assert/strict";
import test from "node:test";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { spawnSync } from "node:child_process";
import {
	EPIC_REGISTRY,
	claimFromEntry,
	loadClaims,
	validateFacets,
	buildTree,
	buildDag,
} from "./build-epic-dag-from-facets.mjs";

const CLI = join(process.cwd(), "scripts", "build-epic-dag-from-facets.mjs");

function runCli(args) {
	return spawnSync(process.execPath, [CLI, ...args], { cwd: process.cwd(), encoding: "utf-8" });
}

// A gold-set-shaped fixture: one accept claim (singleton), one relabel claim
// (multi-epic, carries an edgeRationale), one not-a-claim (must be dropped).
function fixtureGoldSet(entries) {
	return { schemaVersion: "cautilus.gold_set_proposal.v1", entries };
}

function entry(claimId, verdict, labels) {
	return {
		claimId,
		sourceRef: `${claimId}.ref`,
		maintainerVerdict: verdict,
		agentLabels: labels,
	};
}

const SINGLETON = entry("c-accept", "accept", {
	claimAudience: "user",
	claimSemanticGroup: "install",
	primaryEpic: "S1-install",
	supportingEpics: ["S1-install"],
	multiEpic: false,
});
const MULTI = entry("c-relabel", "relabel", {
	claimAudience: "developer",
	claimSemanticGroup: "structured-review",
	primaryEpic: "A2-curation-review",
	supportingEpics: ["A2-curation-review", "E1-evaluate"],
	edgeRationale: "review files (A2) + reports (E1)",
	multiEpic: true,
});
const NOT_A_CLAIM = entry("c-not", "not-a-claim", {
	claimAudience: "user",
	primaryEpic: "APEX",
	supportingEpics: ["APEX"],
	multiEpic: false,
});

test("claimFromEntry keeps accept/relabel and drops not-a-claim", () => {
	assert.equal(claimFromEntry(SINGLETON).claimId, "c-accept");
	assert.equal(claimFromEntry(MULTI).claimId, "c-relabel");
	assert.equal(claimFromEntry(NOT_A_CLAIM), null);
	assert.equal(claimFromEntry(entry("c-bb", "badly-bounded", { primaryEpic: "APEX", supportingEpics: ["APEX"] })), null);
});

test("claimFromEntry reads the facets verbatim, carrying edgeRationale only when multi", () => {
	const c = claimFromEntry(MULTI);
	assert.deepEqual(c.supportingEpics, ["A2-curation-review", "E1-evaluate"]);
	assert.equal(c.multiEpic, true);
	assert.match(c.edgeRationale, /reports/);
	assert.equal(claimFromEntry(SINGLETON).edgeRationale, undefined);
});

test("loadClaims flattens multiple gold sets and excludes non-claims", () => {
	const claims = loadClaims([fixtureGoldSet([SINGLETON, NOT_A_CLAIM]), fixtureGoldSet([MULTI])]);
	assert.deepEqual(
		claims.map((c) => c.claimId),
		["c-accept", "c-relabel"],
	);
});

test("validateFacets accepts coherent facets", () => {
	assert.deepEqual(validateFacets([claimFromEntry(SINGLETON), claimFromEntry(MULTI)]), []);
});

test("validateFacets flags an edge to an epic outside the registry", () => {
	const bad = claimFromEntry(entry("c-x", "accept", {
		primaryEpic: "S1-install",
		supportingEpics: ["S1-install", "Z9-nope"],
		multiEpic: true,
		edgeRationale: "x",
	}));
	assert.ok(validateFacets([bad]).some((e) => /unknown epic Z9-nope/.test(e)));
});

test("validateFacets flags supportingEpics that omit the primaryEpic", () => {
	const bad = claimFromEntry(entry("c-x", "accept", {
		primaryEpic: "S1-install",
		supportingEpics: ["E1-evaluate"],
		multiEpic: false,
	}));
	assert.ok(validateFacets([bad]).some((e) => /must include primaryEpic S1-install/.test(e)));
});

test("validateFacets flags a multiEpic flag that disagrees with arity", () => {
	const bad = claimFromEntry(entry("c-x", "accept", {
		primaryEpic: "S1-install",
		supportingEpics: ["S1-install", "E1-evaluate"],
		edgeRationale: "x",
		multiEpic: false,
	}));
	assert.ok(validateFacets([bad]).some((e) => /multiEpic=false disagrees/.test(e)));
});

test("validateFacets flags a multi-epic claim with no edgeRationale", () => {
	const bad = claimFromEntry(entry("c-x", "accept", {
		primaryEpic: "S1-install",
		supportingEpics: ["S1-install", "E1-evaluate"],
		multiEpic: true,
	}));
	assert.ok(validateFacets([bad]).some((e) => /carries no edgeRationale/.test(e)));
});

test("validateFacets flags a duplicate claimId across inputs", () => {
	const claims = loadClaims([fixtureGoldSet([SINGLETON]), fixtureGoldSet([SINGLETON])]);
	assert.ok(validateFacets(claims).some((e) => /duplicate claimId c-accept/.test(e)));
});

test("buildTree groups by primaryEpic and records alsoSupports for multi-epic claims", () => {
	const claims = loadClaims([fixtureGoldSet([SINGLETON, MULTI])]);
	const tree = buildTree(claims, EPIC_REGISTRY, { track: "fixture" });
	assert.equal(tree.totalClaims, 2);
	assert.equal(tree.orphanCount, 0);
	const a2 = tree.epics.find((e) => e.epicId === "A2-curation-review");
	assert.equal(a2.claimCount, 1);
	assert.deepEqual(a2.claims[0].alsoSupports, ["E1-evaluate"]);
	const s1 = tree.epics.find((e) => e.epicId === "S1-install");
	assert.equal(s1.claims[0].alsoSupports, undefined);
});

test("buildDag passes invariants and computes the coverage inverse", () => {
	const claims = loadClaims([fixtureGoldSet([SINGLETON, MULTI])]);
	const dag = buildDag(claims, EPIC_REGISTRY, { track: "fixture" });
	assert.equal(dag.dagInvariants.pass, true);
	assert.equal(dag.dagInvariants.totalClaims, 2);
	assert.equal(dag.dagInvariants.orphanCount, 0);
	assert.equal(dag.dagInvariants.multiEpicClaimCount, 1);
	// the MULTI claim edges A2 (home) + E1 (supporting); S1 is the singleton home.
	assert.deepEqual(dag.epicCoverage["A2-curation-review"], { branch: "Agent", primary: 1, supporting: 0, total: 1 });
	assert.deepEqual(dag.epicCoverage["E1-evaluate"], { branch: "Eval", primary: 0, supporting: 1, total: 1 });
	assert.deepEqual(dag.epicCoverage["S1-install"], { branch: "Setup", primary: 1, supporting: 0, total: 1 });
});

// Real-artifact guard: the realized DAG must stay faithful to the ratified gold
// set facets so a future gold-set edit cannot silently drift the epic structure.
test("real reextract-head combined DAG realizes 365 gold claims with coherent facets", () => {
	const base = "charness-artifacts/eval-trust/goldset-v2-reextract-head";
	const user = JSON.parse(readFileSync(`${base}/gold-set-proposal.user-product.json`, "utf8"));
	const dev = JSON.parse(readFileSync(`${base}/gold-set-proposal.developer.json`, "utf8"));
	const claims = loadClaims([user, dev]);
	const dag = buildDag(claims, EPIC_REGISTRY, { track: "combined" });
	const inv = dag.dagInvariants;
	assert.equal(inv.pass, true, `errors: ${JSON.stringify(dag.errors)}`);
	assert.equal(inv.totalClaims, 365);
	assert.equal(inv.orphanCount, 0);
	assert.equal(inv.multiEpicClaimCount, 138);
	// every supportingEpic resolves to a registry epic and includes the home.
	const epicIds = new Set(Object.keys(EPIC_REGISTRY));
	for (const c of dag.claims) {
		assert.ok(c.supportingEpics.includes(c.primaryEpic), `${c.claimId} home not in supportingEpics`);
		for (const e of c.supportingEpics) assert.ok(epicIds.has(e), `${c.claimId} unknown epic ${e}`);
	}
	// combined per-epic primary count == user primary + developer primary (the
	// segmentation is a disjoint partition of the same claim space).
	const userDag = buildDag(loadClaims([user]), EPIC_REGISTRY, {});
	const devDag = buildDag(loadClaims([dev]), EPIC_REGISTRY, {});
	for (const id of epicIds) {
		assert.equal(
			dag.epicCoverage[id].primary,
			userDag.epicCoverage[id].primary + devDag.epicCoverage[id].primary,
			`combined primary mismatch for ${id}`,
		);
	}
});

// CLI surface: exercise main/parseArgs/writeArtifacts/reportResult/printSummary
// end to end as a subprocess so the command path is covered, not only the
// exported builders.
function withFixture(entries, fn) {
	const dir = mkdtempSync(join(tmpdir(), "epic-dag-facets-"));
	try {
		const goldPath = join(dir, "gold.json");
		writeFileSync(goldPath, JSON.stringify({ entries }, null, 2));
		fn(dir, goldPath);
	} finally {
		rmSync(dir, { recursive: true, force: true });
	}
}

const CLI_ACCEPT = {
	claimId: "cli-a",
	sourceRef: "README.md:1",
	maintainerVerdict: "accept",
	agentLabels: { claimAudience: "user", claimSemanticGroup: "install", primaryEpic: "S1-install", supportingEpics: ["S1-install"], multiEpic: false },
};
const CLI_MULTI = {
	claimId: "cli-m",
	sourceRef: "README.md:2",
	maintainerVerdict: "relabel",
	agentLabels: { claimAudience: "user", claimSemanticGroup: "review", primaryEpic: "A2-curation-review", supportingEpics: ["A2-curation-review", "E1-evaluate"], edgeRationale: "review (A2) + reports (E1)", multiEpic: true },
};
const CLI_NOT = { claimId: "cli-n", sourceRef: "README.md:3", maintainerVerdict: "not-a-claim", agentLabels: { primaryEpic: "APEX", supportingEpics: ["APEX"], multiEpic: false } };

test("CLI writes tree + DAG artifacts and reports the thin-epic summary", () => {
	withFixture([CLI_ACCEPT, CLI_MULTI, CLI_NOT], (dir, goldPath) => {
		const outTree = join(dir, "tree.json");
		const outDag = join(dir, "dag.json");
		const res = runCli(["--track", "fixture", "--input", goldPath, "--out-tree", outTree, "--out-dag", outDag]);
		assert.equal(res.status, 0, res.stderr);
		assert.match(res.stdout, /totalClaims=2/);
		assert.match(res.stdout, /thin epics/);
		const dag = JSON.parse(readFileSync(outDag, "utf-8"));
		assert.equal(dag.dagInvariants.totalClaims, 2);
		assert.equal(dag.dagInvariants.pass, true);
		const tree = JSON.parse(readFileSync(outTree, "utf-8"));
		assert.equal(tree.totalClaims, 2);
	});
});

test("CLI --json --check reports invariants without writing", () => {
	withFixture([CLI_ACCEPT, CLI_MULTI], (dir, goldPath) => {
		const outDag = join(dir, "should-not-exist.json");
		const res = runCli(["--track", "fixture", "--input", goldPath, "--out-dag", outDag, "--json", "--check"]);
		assert.equal(res.status, 0, res.stderr);
		const payload = JSON.parse(res.stdout);
		assert.equal(payload.invariants.pass, true);
		assert.equal(payload.outDag, null);
		assert.throws(() => readFileSync(outDag, "utf-8"));
	});
});

test("CLI exits 2 when no --input is given", () => {
	const res = runCli(["--track", "fixture"]);
	assert.equal(res.status, 2);
	assert.match(res.stderr, /at least one --input/);
});

test("CLI exits 1 and prints the facet error when invariants fail", () => {
	const broken = { claimId: "cli-bad", sourceRef: "README.md:9", maintainerVerdict: "accept", agentLabels: { primaryEpic: "S1-install", supportingEpics: ["E1-evaluate"], multiEpic: false } };
	withFixture([broken], (dir, goldPath) => {
		const res = runCli(["--track", "fixture", "--input", goldPath]);
		assert.equal(res.status, 1);
		assert.match(res.stdout, /ERROR .*must include primaryEpic S1-install/);
		assert.match(res.stderr, /DAG invariants did not pass/);
	});
});
