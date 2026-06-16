#!/usr/bin/env node
// Realize the claim DAG (rule R15) from the tree-form epic proposal.
//
// The tree artifact (epic-tree-proposal.json, rule R14) gave every claim exactly
// ONE parent epic. R15 dissolves that single-parent tyranny: epic membership is a
// FACET (supportingEpics[]), so a claim may support MULTIPLE epics (many-to-many,
// acyclic). This generator turns that ratified model from words into data:
//   - flatten the tree into a claim-centric edge list
//   - default supportingEpics = [primaryEpic] (the tree home) for every claim
//   - apply the proposed multi-epic edge map for the 9 ambiguous groups + the
//     cross-actor README:68 case, each with an assertion-grounded rationale (R11)
//   - compute per-epic coverage (the inverse of supportingEpics)
//   - assert the DAG invariants (121 claims, 0 orphans, bipartite/acyclic)
//
// Spec: charness-artifacts/spec/2026-06-16-agent-extraction-curation-layering.md.
// The edge map is the reviewable design surface; primaryEpic is preserved so the
// tree-to-DAG move stays auditable and the maintainer can ratify each edge.

import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";

// User-story lean per R15 ("As a ... I want ... so that ..."), authored not
// extracted. Keyed by epicId; titles still come from the tree artifact.
export const EPIC_USER_STORIES = {
	APEX:
		"As a team whose prompts/skills/models keep changing, I want to pin the behavior that matters and prove it survives every change, so that I can ship changes without silently regressing what I promised.",
	"A1-orchestration":
		"As a maintainer, I want the Cautilus Agent to own routing, sequencing, and guardrails, so that I do not hand-orchestrate the eval workflow step by step.",
	"A2-curation-review":
		"As a maintainer, I want the agent to curate raw discovery packets and drive structured review, so that I review a trustworthy claim set instead of high-recall noise.",
	"S1-install":
		"As an adopter, I want Cautilus to install as a shared machine-level binary plus a repo-local agent surface, so that I add evaluation without copying another scaffold into my repo.",
	"S2-readiness":
		"As an adopter, I want doctor/version to report setup, onboarding, and wiring readiness, so that I know exactly what to fix before a first bounded run.",
	"D1-discovery":
		"As a maintainer, I want discovery to turn my adapter-owned docs into bounded proof-plan candidates (not a verdict), so that I start from source-ref-backed claims rather than a blank page.",
	"D2-review-refresh":
		"As a maintainer, I want deterministic claim review/refresh (cluster, apply-review, refresh, status, stale/model-spend gating), so that my claim set stays current and auditable without surprise model spend.",
	"E1-evaluate":
		"As a maintainer, I want evaluate fixture/observation to run checked-in inputs through adapter-owned runners and evaluate the packet, so that I get a durable, comparable verdict surface.",
	"E2-scenarios-experiments":
		"As a maintainer, I want scenario proposal/attention and skill-experiment compare over preserved baseline/variant outputs, so that I can judge whether a candidate actually got better.",
	"I1-bounded-improvement":
		"As a maintainer, I want improvement search/revision bounded by budgets, checkpoints, and blocked-readiness, so that autonomy stays explicit and never runs away.",
	"M1-proven-on-itself":
		"As an evaluator of the product itself, I want Cautilus proven on itself via specs, dogfood evidence, held-out validation, and structured review, so that I can trust the promises before adopting it.",
};

// Proposed multi-epic edges (R15). Each entry: the flagged claim's supportingEpics
// (which MUST include its primaryEpic) plus a rationale grounded in the claim's
// own assertion (the gold-set `summary`, R11). These cover the 9 ambiguous
// claimSemanticGroups flagged in the tree (ambiguousGroupMapping:true) plus the
// cross-actor README:68 "agent curates" case. Everything else stays singleton.
export const EDGE_MAP = {
	// core-flow (home APEX): the shared decision surface spans setup + the agent.
	"claim-readme-md-155": {
		supportingEpics: ["APEX", "S1-install", "A1-orchestration"],
		rationale:
			"CLI + Agent share one adapter and return the same decision surface: APEX core flow, but the shared adapter is setup (S1) and the dual entry point is agent orchestration (A1).",
	},
	"claim-readme-md-159": {
		supportingEpics: ["APEX", "S1-install", "E1-evaluate"],
		rationale:
			"Minimum host-repo shape = adapter + installed agent (S1 setup) + run artifacts eval-cases/observed/summary.json (E1 evaluate); the whole-shape promise is APEX.",
	},
	// structured-review (home A2): first-class artifacts cut across review/eval/audit.
	"claim-readme-md-139": {
		supportingEpics: ["A2-curation-review", "E1-evaluate", "M1-proven-on-itself"],
		rationale:
			"Adapters/reports/review/compare artifacts as first-class boundaries: review files (A2), reports + compare artifacts (E1), and auditable-by-design product boundaries (M1).",
	},
	// adapter override (home S1): the carrier command is the discovery seam.
	"claim-docs-contracts-claim-extraction-template-md-46": {
		supportingEpics: ["S1-install", "D1-discovery"],
		rationale:
			"extraction-input honoring --adapter is an adapter capability (S1) exercised by the discovery extraction seam (D1).",
	},
	// runner-readiness (home S2): proof class is reported on eval runs.
	"claim-docs-guides-cli-md-74": {
		supportingEpics: ["S2-readiness", "E1-evaluate"],
		rationale:
			"Fixture-runtime runs reported with fixture-smoke proof class is runner readiness (S2) about evaluate runs and their proof reporting (E1).",
	},
	// command-surface (home D1): single-action / routing design touches A1.
	"claim-docs-contracts-claim-discovery-workflow-md-15": {
		supportingEpics: ["D1-discovery", "A1-orchestration"],
		rationale:
			"`discover` as the single high-level user action is a discovery claim (D1) and an agent-routing/command-surface simplicity claim (A1).",
	},
	"claim-docs-contracts-claim-discovery-workflow-md-479": {
		supportingEpics: ["D1-discovery", "D2-review-refresh", "A1-orchestration"],
		rationale:
			"Refresh stays a skill behavior over discover with no separate binary: refresh lifecycle (D2) as agent skill behavior (A1) layered on the discover entry point (D1).",
	},
	"claim-docs-contracts-claim-discovery-workflow-md-566": {
		supportingEpics: ["D1-discovery", "A1-orchestration"],
		rationale:
			"Grouping is part of discovery output and follow-ons stay optional: discovery output shape (D1) and command-surface/routing minimalism (A1).",
	},
	// review-variants (home D2): `evaluate review variants` is an evaluate command.
	"claim-docs-guides-cli-md-476": {
		supportingEpics: ["D2-review-refresh", "E1-evaluate"],
		rationale:
			"`evaluate review variants` writing review-summary + per-variant results is review tooling (D2) delivered as an evaluate subcommand (E1).",
	},
	"claim-docs-guides-cli-md-477": {
		supportingEpics: ["D2-review-refresh", "E1-evaluate", "S2-readiness"],
		rationale:
			"Variant passed/blocked/failed verdicts (D2 review, E1 evaluate) where missing-auth executor readiness is classified as blocked unavailable_executor (S2 readiness), not a negative verdict.",
	},
	"claim-docs-guides-cli-md-479": {
		supportingEpics: ["D2-review-refresh", "E1-evaluate"],
		rationale:
			"partialSuccess + lifting passing outputs is review-summary semantics (D2) of an evaluate subcommand (E1).",
	},
	"claim-docs-guides-cli-md-480": {
		supportingEpics: ["D2-review-refresh", "E1-evaluate"],
		rationale:
			"--output-under-test / --output-text-key shaping the review prompt is review tooling (D2) inside the evaluate review path (E1).",
	},
	// review-feedback (cli.md:485/487/489/492): flagged ambiguous, but on assertion
	// inspection they assert review-feedback PACKET structure/semantics only (489/492
	// explicitly say dispositions are NOT eval pass/fail). The "feedback feeds
	// improvement" link is an inferred downstream consumer relationship, not what the
	// claim asserts (R11), so per the fresh-eye edge audit they resolve to SINGLETON
	// D2 rather than edging into I1. The feedback->improve relationship is an
	// epic-level dependency, not per-claim membership. See openQuestions.
	// claims-eval-plan (home D2): the discover -> eval bridge.
	"claim-docs-guides-cli-md-145": {
		supportingEpics: ["D2-review-refresh", "E1-evaluate"],
		rationale:
			"`evaluate claims plan` turning ready claims into a claim_eval_plan packet bridges the claim lifecycle (D2) into evaluation (E1).",
	},
	"claim-docs-guides-cli-md-146": {
		supportingEpics: ["D2-review-refresh", "E1-evaluate"],
		rationale:
			"Skipping claims already evidenceStatus=satisfied is claim-lifecycle gating (D2) on the evaluate planning path (E1).",
	},
	// proof-routing (home E1): the load-bearing R12 claim cuts across discover/eval/meta.
	"claim-readme-md-145": {
		supportingEpics: ["E1-evaluate", "D1-discovery", "M1-proven-on-itself"],
		rationale:
			"Proof routing split by kind (evaluator behavior -> cautilus evaluate, deterministic -> tests/CI) governs evaluation (E1), is what discovery routes per claim (D1), and is the honest proof split that proves-on-itself (M1).",
	},
	// cross-actor README:68 (home D1 by topic): actor is the agent that curates.
	"claim-readme-md-68": {
		supportingEpics: ["D1-discovery", "A2-curation-review"],
		rationale:
			"The agent curating the raw discovery packet is topically discovery (D1) but by ACTOR is agent curation (A2); the canonical cross-actor case R15 cites.",
	},
};

// Flatten the tree into a claim-centric edge list. primaryEpic = the epic the
// claim was listed under in the tree (its R14 home).
export function flattenTreeClaims(tree) {
	const claims = [];
	for (const epic of tree.epics) {
		for (const c of epic.claims) {
			claims.push({
				claimId: c.claimId,
				sourceRef: c.sourceRef,
				group: c.group,
				primaryEpic: epic.epicId,
			});
		}
	}
	return claims;
}

// Apply the edge map to produce supportingEpics[] per claim. Validates that every
// flagged claim exists, every target epic is known, and supportingEpics includes
// the primaryEpic with no duplicates.
export function applyEdges(claims, epicIds, edgeMap = EDGE_MAP) {
	const known = new Set(epicIds);
	const byId = new Map(claims.map((c) => [c.claimId, c]));
	const errors = [];

	for (const flaggedId of Object.keys(edgeMap)) {
		if (!byId.has(flaggedId)) {
			errors.push(`edge map names unknown claim ${flaggedId}`);
		}
	}

	const out = claims.map((c) => {
		const edge = edgeMap[c.claimId];
		if (!edge) {
			return { ...c, supportingEpics: [c.primaryEpic], multiEpic: false };
		}
		const supporting = edge.supportingEpics;
		for (const e of supporting) {
			if (!known.has(e)) errors.push(`${c.claimId} edges to unknown epic ${e}`);
		}
		if (!supporting.includes(c.primaryEpic)) {
			errors.push(`${c.claimId} supportingEpics must include primaryEpic ${c.primaryEpic}`);
		}
		if (new Set(supporting).size !== supporting.length) {
			errors.push(`${c.claimId} has duplicate supportingEpics`);
		}
		return {
			...c,
			supportingEpics: supporting,
			multiEpic: supporting.length > 1,
			edgeRationale: edge.rationale,
		};
	});

	return { claims: out, errors };
}

// Per-epic coverage = inverse of supportingEpics: primary (home) count, supporting
// (edged-in but not home) count, and total support set size. Thin total = gap.
export function epicCoverage(claims, epics) {
	const coverage = {};
	for (const epic of epics) {
		coverage[epic.epicId] = { branch: epic.branch, primary: 0, supporting: 0, total: 0 };
	}
	for (const c of claims) {
		for (const e of c.supportingEpics) {
			if (!coverage[e]) coverage[e] = { branch: null, primary: 0, supporting: 0, total: 0 };
			coverage[e].total += 1;
			if (e === c.primaryEpic) coverage[e].primary += 1;
			else coverage[e].supporting += 1;
		}
	}
	return coverage;
}

// Build the full DAG artifact object from the tree-form input.
export function buildDag(tree, { derivedFrom = null } = {}) {
	const epicIds = tree.epics.map((e) => e.epicId);
	const flat = flattenTreeClaims(tree);
	const { claims, errors } = applyEdges(flat, epicIds);
	const coverage = epicCoverage(claims, tree.epics);

	const orphanCount = claims.filter((c) => c.supportingEpics.length < 1).length;
	const multiEpicClaims = claims.filter((c) => c.multiEpic).map((c) => c.claimId);
	const thinEpics = Object.entries(coverage)
		.filter(([, v]) => v.total <= 2)
		.map(([k, v]) => ({ epicId: k, total: v.total }));

	const epics = tree.epics.map((e) => ({
		epicId: e.epicId,
		branch: e.branch,
		title: e.title,
		userStory: EPIC_USER_STORIES[e.epicId] || null,
		primaryClaimCount: coverage[e.epicId].primary,
		supportClaimCount: coverage[e.epicId].supporting,
		totalSupport: coverage[e.epicId].total,
	}));

	const invariants = {
		totalClaims: claims.length,
		orphanCount,
		multiEpicClaimCount: multiEpicClaims.length,
		everyClaimEdgesToAtLeastOneEpic: orphanCount === 0,
		// claim -> epic is bipartite (claims only edge to epics, never to claims),
		// so the graph is acyclic by construction; assert no self/epic-to-epic edge.
		acyclicByConstruction: true,
		pass: errors.length === 0 && orphanCount === 0 && claims.length === tree.totalClaims,
	};

	const artifact = {
		schemaVersion: "cautilus.epic_dag_proposal.v1-draft",
		supersedes: "cautilus.epic_tree_proposal.v1-draft (tree form; this realizes the R15 DAG)",
		status:
			"DRAFT — R15 DAG realized over the 121-claim user-product track. primaryEpic preserves the R14 tree home; supportingEpics[] adds the proposed multi-epic edges for the 9 ambiguous groups + the cross-actor README:68 case. PENDING maintainer ratification of the proposed cross-epic edges and the authored epic user stories. Slice-3 design input.",
		derivedFrom: derivedFrom || tree.derivedFrom,
		generatedFrom: "charness-artifacts/eval-trust/goldset-v2-agent-extraction/epic-tree-proposal.json",
		generator: "scripts/build-epic-dag.mjs",
		model:
			"R15 claim DAG: each claim carries supportingEpics[] (>=1 epic, many-to-many, acyclic). primaryEpic = R14 tree home, preserved for audit. No orphans. Epic coverage = inverse of supportingEpics; thin support = a recall/coverage gap. Epics lean user-story.",
		branches: tree.branches,
		epics,
		claims,
		multiEpicClaims,
		epicCoverage: coverage,
		thinEpics,
		dagInvariants: invariants,
		errors,
		openQuestions: [
			"Proposed cross-epic edges (16 claims: the flagged ambiguous groups minus review-feedback, + cross-actor README:68) await maintainer ratification; each carries an assertion-grounded edgeRationale.",
			"Edge audit (fresh-eye): review-feedback (cli.md:485/487/489/492) was flagged ambiguous but resolved to SINGLETON D2 — its assertions are review-feedback packet structure/semantics (489/492 explicitly distinguish feedback from eval pass/fail), and the feedback->improve link is an epic-level dependency, not per-claim I1 membership. This is why I1 stays thin (total 4); thin I1 is an honest coverage signal (the improve slice is opt-in/being rewritten per README:20), not a drawing gap.",
			"Asymmetry to resolve at slice-3: cli.md:148 ('review-input, apply-review, evaluate claims plan reject stale claim packets') names `evaluate claims plan` like cli.md:145/146 (which edge D2->E1) but stays a SINGLETON because its group (claims-review) was not flagged ambiguous in the tree. Group-derived flagging is lossy; per-claim facets emitted by the template are the real fix.",
			"Thin epic A2-curation-review (total 2) is a real coverage signal, not a drawing artifact: the source docs state the agent-curation ACTOR only at README:68/:139; most curation/review content is topic-labeled D2 and stays home there. The honest reading is that the product under-documents the agent-curation actor.",
			"Authored epic user stories (R15 user-story lean) await maintainer ratification; titles are carried from the ratified tree.",
			"Slice-3 conclusion stands: the extraction template should emit per-claim facets {audience, recommendedProof, tier/epic, supportingEpics[]} directly, because deriving epics + edges from claimSemanticGroup is lossy (the 16 multi-epic edges here were hand-routed from assertions, and the 4 review-feedback de-edges + the cli.md:148 asymmetry show group-flagging misses real edges).",
		],
	};

	return { artifact, errors, invariants };
}

function parseArgs(argv) {
	const args = { input: null, out: null, check: false, json: false };
	for (let i = 0; i < argv.length; i += 1) {
		const a = argv[i];
		if (a === "--input") args.input = argv[(i += 1)];
		else if (a === "--out") args.out = argv[(i += 1)];
		else if (a === "--check") args.check = true;
		else if (a === "--json") args.json = true;
	}
	return args;
}

function printSummary(artifact) {
	const inv = artifact.dagInvariants;
	process.stdout.write("Built epic DAG from tree proposal\n");
	process.stdout.write(
		`  totalClaims=${inv.totalClaims} orphans=${inv.orphanCount} ` +
			`multiEpic=${inv.multiEpicClaimCount} pass=${inv.pass}\n`,
	);
	for (const e of artifact.epics) {
		process.stdout.write(
			`  ${e.epicId}: primary=${e.primaryClaimCount} +support=${e.supportClaimCount} total=${e.totalSupport}\n`,
		);
	}
	if (artifact.thinEpics.length) {
		process.stdout.write(
			`  thin epics (<=2 total support): ${artifact.thinEpics
				.map((t) => `${t.epicId}(${t.total})`)
				.join(", ")}\n`,
		);
	}
	for (const err of artifact.errors) process.stdout.write(`  ERROR ${err}\n`);
}

function main() {
	const args = parseArgs(process.argv.slice(2));
	const input =
		args.input ||
		"charness-artifacts/eval-trust/goldset-v2-agent-extraction/epic-tree-proposal.json";
	const out =
		args.out ||
		join(dirname(input), "epic-dag-proposal.json");

	const tree = JSON.parse(readFileSync(input, "utf8"));
	const { artifact } = buildDag(tree, { derivedFrom: tree.derivedFrom });

	if (!args.check) {
		writeFileSync(out, `${JSON.stringify(artifact, null, 2)}\n`);
	}

	if (args.json) {
		process.stdout.write(
			`${JSON.stringify({ invariants: artifact.dagInvariants, errors: artifact.errors, out: args.check ? null : out }, null, 2)}\n`,
		);
	} else {
		printSummary(artifact);
		if (!args.check) process.stdout.write(`  wrote ${out}\n`);
	}

	if (!artifact.dagInvariants.pass) {
		process.stderr.write("FAIL: DAG invariants did not pass\n");
		process.exit(1);
	}
}

if (import.meta.url === `file://${process.argv[1]}`) {
	main();
}
