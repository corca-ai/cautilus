#!/usr/bin/env node
// Realize the claim epic tree (R14) + DAG (R15) directly from the per-claim
// facets the extraction template now emits, instead of hand-routing an EDGE_MAP
// from claimSemanticGroup.
//
// This is the slice-3 conclusion realized: the older sibling generator
// (build-epic-dag.mjs) carried a HARDCODED EDGE_MAP keyed to the
// goldset-v2-agent-extraction claimIds, because that track's tree only gave a
// single parent and the cross-epic edges had to be authored by hand. The
// reextract-head gold set instead carries `agentLabels.{primaryEpic,
// supportingEpics, edgeRationale, multiEpic}` ON EVERY CLAIM, so the DAG is no
// longer derived — it is read. This generator:
//   - loads one or more segmented gold-set proposals
//   - keeps the gold CLAIMS (maintainerVerdict accept|relabel; not-a-claim and
//     badly-bounded are not claims and never enter the DAG)
//   - reads each claim's primaryEpic + supportingEpics[] facets verbatim
//   - validates the facets (known epics, supportingEpics includes primaryEpic,
//     no dups, multiEpic flag matches arity, multi carries an edgeRationale)
//   - projects the R14 single-parent tree (group by primaryEpic) and the R15
//     many-to-many DAG (supportingEpics[]), with per-epic coverage + invariants
//
// The old generator stays untouched (its 121-claim agent-extraction artifact +
// pinned test still serve the slice-3 design baseline). User stories and the
// tested coverage inverse are imported from it so there is one source of truth.

import { readFileSync, writeFileSync } from "node:fs";
import { EPIC_USER_STORIES, epicCoverage } from "./build-epic-dag.mjs";

// Canonical epic registry: epicId -> { branch, title }. Titles are carried
// verbatim from the ratified goldset-v2-agent-extraction tree
// (epic-tree-proposal.json); branches are the R14 six-branch model. User stories
// come from EPIC_USER_STORIES (imported). This registry is the closed set of
// epics a facet may reference; an edge to anything outside it is an error.
export const EPIC_REGISTRY = {
	APEX: {
		branch: "APEX",
		title: "Cautilus keeps agent/workflow behavior honest across prompt/skill/wrapper change",
	},
	"A1-orchestration": {
		branch: "Agent",
		title: "The Cautilus Agent owns workflow routing, sequencing, and guardrails",
	},
	"A2-curation-review": {
		branch: "Agent",
		title: "The Cautilus Agent curates discovery packets and drives structured review",
	},
	"S1-install": {
		branch: "Setup",
		title: "Cautilus installs as a shared machine-level binary plus repo-local agent surface (no scaffold copy)",
	},
	"S2-readiness": {
		branch: "Setup",
		title: "doctor/version report setup, onboarding, agent-surface, and wiring readiness",
	},
	"D1-discovery": {
		branch: "Discover",
		title: "Claim discovery turns adapter-owned docs + linked Markdown into bounded proof-plan candidates (not a verdict)",
	},
	"D2-review-refresh": {
		branch: "Discover",
		title: "Deterministic claim review/refresh: cluster, apply-review, refresh, status, stale-gating, model-spend gating",
	},
	"E1-evaluate": {
		branch: "Eval",
		title: "evaluate fixture/observation runs checked-in inputs through adapter-owned runners and evaluates the packet",
	},
	"E2-scenarios-experiments": {
		branch: "Eval",
		title: "Scenario proposal/attention and skill-experiment compare over preserved baseline/variant outputs",
	},
	"I1-bounded-improvement": {
		branch: "Improve",
		title: "Improvement search/revision is bounded by budgets, checkpoints, and blocked-readiness (bounded autonomy)",
	},
	"M1-proven-on-itself": {
		branch: "Meta/Cross",
		title: "Cautilus is proven on itself: specs, dogfood evidence, held-out validation, structured review",
	},
};

export const BRANCHES = ["APEX", "Agent", "Setup", "Discover", "Eval", "Improve", "Meta/Cross"];

// A gold-set entry is a CLAIM (and so a DAG node) only when the maintainer
// verdict kept it as a claim. not-a-claim and badly-bounded are excluded; the
// extraction template still stamped facets on them, but they are not claims.
export const CLAIM_VERDICTS = new Set(["accept", "relabel"]);

// Pull the DAG-relevant facets off a gold-set entry. Returns null for non-claims.
export function claimFromEntry(entry) {
	if (!CLAIM_VERDICTS.has(entry.maintainerVerdict)) return null;
	const a = entry.agentLabels || {};
	const claim = {
		claimId: entry.claimId,
		sourceRef: entry.sourceRef,
		audience: a.claimAudience || null,
		group: a.claimSemanticGroup || null,
		primaryEpic: a.primaryEpic || null,
		supportingEpics: Array.isArray(a.supportingEpics) ? a.supportingEpics.slice() : [],
		multiEpic: Boolean(a.multiEpic),
	};
	if (a.edgeRationale) claim.edgeRationale = a.edgeRationale;
	return claim;
}

// Load the gold CLAIMS (facet records) from one or more segmented proposals.
export function loadClaims(goldSets) {
	const claims = [];
	for (const g of goldSets) {
		for (const entry of g.entries) {
			const c = claimFromEntry(entry);
			if (c) claims.push(c);
		}
	}
	return claims;
}

// The home-epic half of facet validation: present + inside the registry.
function validatePrimaryEpic(c, known) {
	if (!c.primaryEpic) return [`${c.claimId} has no primaryEpic`];
	if (!known.has(c.primaryEpic)) return [`${c.claimId} primaryEpic is unknown epic ${c.primaryEpic}`];
	return [];
}

// The supportingEpics half: non-empty, includes the home, no dups, all known,
// arity agrees with the multiEpic flag, and multi carries an edgeRationale.
function validateSupportingEpics(c, known) {
	const se = c.supportingEpics;
	if (!se.length) return [`${c.claimId} has empty supportingEpics`];
	const errors = [];
	if (c.primaryEpic && !se.includes(c.primaryEpic)) {
		errors.push(`${c.claimId} supportingEpics must include primaryEpic ${c.primaryEpic}`);
	}
	if (new Set(se).size !== se.length) errors.push(`${c.claimId} has duplicate supportingEpics`);
	for (const e of se) if (!known.has(e)) errors.push(`${c.claimId} edges to unknown epic ${e}`);
	const wantMulti = se.length > 1;
	if (c.multiEpic !== wantMulti) {
		errors.push(`${c.claimId} multiEpic=${c.multiEpic} disagrees with supportingEpics arity ${se.length}`);
	}
	if (wantMulti && !c.edgeRationale) errors.push(`${c.claimId} is multiEpic but carries no edgeRationale`);
	return errors;
}

// Validate the per-claim facets against the closed epic registry. The facets are
// authored upstream (the template); this is the guard that they stayed coherent.
export function validateFacets(claims, registry = EPIC_REGISTRY) {
	const known = new Set(Object.keys(registry));
	const errors = [];
	const seen = new Set();
	for (const c of claims) {
		if (seen.has(c.claimId)) errors.push(`duplicate claimId ${c.claimId} across inputs`);
		seen.add(c.claimId);
		errors.push(...validatePrimaryEpic(c, known), ...validateSupportingEpics(c, known));
	}
	return errors;
}

// R14 single-parent tree: group claims by primaryEpic (the home), shallow
// epic -> claim. `alsoSupports` records the non-home epics each claim edges to,
// so the tree-to-DAG relationship stays auditable from the tree side too.
export function buildTree(claims, registry, meta = {}) {
	const epicIds = Object.keys(registry);
	const byEpic = new Map(epicIds.map((id) => [id, []]));
	let orphanCount = 0;
	for (const c of claims) {
		if (!c.primaryEpic || !byEpic.has(c.primaryEpic)) {
			orphanCount += 1;
			continue;
		}
		const node = { claimId: c.claimId, sourceRef: c.sourceRef, group: c.group };
		const also = c.supportingEpics.filter((e) => e !== c.primaryEpic);
		if (also.length) node.alsoSupports = also;
		byEpic.get(c.primaryEpic).push(node);
	}
	const epics = epicIds.map((id) => ({
		epicId: id,
		branch: registry[id].branch,
		title: registry[id].title,
		claimCount: byEpic.get(id).length,
		claims: byEpic.get(id),
	}));
	return {
		schemaVersion: "cautilus.epic_tree_proposal.v1-draft",
		status: meta.treeStatus || "DRAFT",
		track: meta.track || null,
		derivedFrom: meta.derivedFrom || null,
		generator: "scripts/build-epic-dag-from-facets.mjs",
		model:
			"R14 claim tree: APEX root + 6 branches, single-parent (primaryEpic = the claim's home epic facet), shallow epic->claim, no orphans. alsoSupports records the non-home epics the claim edges to in the R15 DAG.",
		branches: BRANCHES,
		totalClaims: claims.length,
		orphanCount,
		epics,
	};
}

// R15 many-to-many DAG: each claim carries supportingEpics[] (>=1, acyclic by
// construction because claims only edge to epics). Coverage is the inverse.
export function buildDag(claims, registry, meta = {}) {
	const epicIds = Object.keys(registry);
	const errors = validateFacets(claims, registry);
	const epicsForCoverage = epicIds.map((id) => ({ epicId: id, branch: registry[id].branch }));
	const coverage = epicCoverage(claims, epicsForCoverage);

	const orphanCount = claims.filter((c) => c.supportingEpics.length < 1).length;
	const multiEpicClaims = claims.filter((c) => c.multiEpic).map((c) => c.claimId);
	const thinEpics = epicIds
		.map((id) => ({ epicId: id, total: coverage[id].total }))
		.filter((t) => t.total <= 2);

	const epics = epicIds.map((id) => ({
		epicId: id,
		branch: registry[id].branch,
		title: registry[id].title,
		userStory: EPIC_USER_STORIES[id] || null,
		primaryClaimCount: coverage[id].primary,
		supportClaimCount: coverage[id].supporting,
		totalSupport: coverage[id].total,
	}));

	const invariants = {
		totalClaims: claims.length,
		orphanCount,
		multiEpicClaimCount: multiEpicClaims.length,
		everyClaimEdgesToAtLeastOneEpic: orphanCount === 0,
		acyclicByConstruction: true,
		pass: errors.length === 0 && orphanCount === 0,
	};

	return {
		schemaVersion: "cautilus.epic_dag_proposal.v1-draft",
		supersedes: "cautilus.epic_tree_proposal.v1-draft (tree form; this realizes the R15 DAG)",
		status:
			meta.dagStatus ||
			"DRAFT — R15 DAG realized over the ratified gold CLAIMS by reading the template-emitted per-claim epic facets. PENDING maintainer ratification of the epic structure (the HITL ratified verdict + proof-route, not the epic assignments).",
		track: meta.track || null,
		derivedFrom: meta.derivedFrom || null,
		generatedFrom:
			"agentLabels.{primaryEpic, supportingEpics, edgeRationale, multiEpic} on each gold-set entry (template-emitted facets).",
		generator: "scripts/build-epic-dag-from-facets.mjs",
		model:
			"R15 claim DAG read from per-claim facets: each claim carries supportingEpics[] (>=1, many-to-many, acyclic). primaryEpic = R14 tree home, preserved for audit. No orphans. Epic coverage = inverse of supportingEpics; thin support is an honest recall/coverage signal, not a drawing artifact.",
		branches: BRANCHES,
		epics,
		claims: claims.map((c) => ({
			claimId: c.claimId,
			sourceRef: c.sourceRef,
			audience: c.audience,
			group: c.group,
			primaryEpic: c.primaryEpic,
			supportingEpics: c.supportingEpics,
			multiEpic: c.multiEpic,
			...(c.edgeRationale ? { edgeRationale: c.edgeRationale } : {}),
		})),
		multiEpicClaims,
		epicCoverage: coverage,
		thinEpics,
		dagInvariants: invariants,
		errors,
		openQuestions: meta.openQuestions || [],
	};
}

function parseArgs(argv) {
	const args = { inputs: [], outTree: null, outDag: null, track: null, derivedFrom: null, check: false, json: false };
	for (let i = 0; i < argv.length; i += 1) {
		const a = argv[i];
		if (a === "--input") args.inputs.push(argv[(i += 1)]);
		else if (a === "--out-tree") args.outTree = argv[(i += 1)];
		else if (a === "--out-dag") args.outDag = argv[(i += 1)];
		else if (a === "--track") args.track = argv[(i += 1)];
		else if (a === "--derived-from") args.derivedFrom = argv[(i += 1)];
		else if (a === "--check") args.check = true;
		else if (a === "--json") args.json = true;
	}
	return args;
}

const DEFAULT_OPEN_QUESTIONS = [
	"Epic facets are now template-emitted per claim (agentLabels.{primaryEpic, supportingEpics, edgeRationale, multiEpic}); this DAG reads them verbatim instead of hand-routing an EDGE_MAP from claimSemanticGroup. The slice-3 conclusion (the template should emit per-claim facets) is realized — see build-epic-dag.mjs for the prior hand-routed approach it supersedes.",
	"Ratification caveat: the HITL session (hitl-reextract-v2head-20260618) ratified the maintainer VERDICT (claim / not-a-claim) and the proof-route, NOT the epic assignments. primaryEpic / supportingEpics / edgeRationale are agent-assigned at extraction and carried forward; the epic STRUCTURE is pending a maintainer ratification pass.",
	"Thin epics (<=2 total support) are reported as honest coverage signals, not drawing artifacts; a per-track DAG will surface more thin epics than the combined roll-up because audience segmentation removes the other track's support.",
];

function printSummary(dag, label) {
	const inv = dag.dagInvariants;
	process.stdout.write(`Built epic DAG from facets [${label}]\n`);
	process.stdout.write(
		`  totalClaims=${inv.totalClaims} orphans=${inv.orphanCount} multiEpic=${inv.multiEpicClaimCount} pass=${inv.pass}\n`,
	);
	for (const e of dag.epics) {
		process.stdout.write(
			`  ${e.epicId}: primary=${e.primaryClaimCount} +support=${e.supportClaimCount} total=${e.totalSupport}\n`,
		);
	}
	if (dag.thinEpics.length) {
		process.stdout.write(
			`  thin epics (<=2 total): ${dag.thinEpics.map((t) => `${t.epicId}(${t.total})`).join(", ")}\n`,
		);
	}
	for (const err of dag.errors) process.stdout.write(`  ERROR ${err}\n`);
}

function writeArtifacts(args, tree, dag) {
	if (args.check) return;
	if (args.outTree) writeFileSync(args.outTree, `${JSON.stringify(tree, null, 2)}\n`);
	if (args.outDag) writeFileSync(args.outDag, `${JSON.stringify(dag, null, 2)}\n`);
}

function reportResult(args, dag) {
	if (args.json) {
		process.stdout.write(
			`${JSON.stringify(
				{
					track: args.track,
					invariants: dag.dagInvariants,
					thinEpics: dag.thinEpics,
					errors: dag.errors,
					outTree: args.check ? null : args.outTree,
					outDag: args.check ? null : args.outDag,
				},
				null,
				2,
			)}\n`,
		);
		return;
	}
	printSummary(dag, args.track || "unlabeled");
	if (args.check) return;
	if (args.outTree) process.stdout.write(`  wrote ${args.outTree}\n`);
	if (args.outDag) process.stdout.write(`  wrote ${args.outDag}\n`);
}

function main() {
	const args = parseArgs(process.argv.slice(2));
	if (!args.inputs.length) {
		process.stderr.write("FAIL: at least one --input <gold-set.json> is required\n");
		process.exit(2);
	}
	const goldSets = args.inputs.map((p) => JSON.parse(readFileSync(p, "utf8")));
	const claims = loadClaims(goldSets);
	const meta = {
		track: args.track,
		derivedFrom: args.derivedFrom || args.inputs.join(", "),
		openQuestions: DEFAULT_OPEN_QUESTIONS,
	};
	const tree = buildTree(claims, EPIC_REGISTRY, meta);
	const dag = buildDag(claims, EPIC_REGISTRY, meta);
	writeArtifacts(args, tree, dag);
	reportResult(args, dag);
	if (!dag.dagInvariants.pass) {
		process.stderr.write("FAIL: DAG invariants did not pass\n");
		process.exit(1);
	}
}

if (import.meta.url === `file://${process.argv[1]}`) {
	main();
}
