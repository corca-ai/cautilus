#!/usr/bin/env node
// Slice-4 measurement: score the blind v2 re-extraction against the gold-set
// answer key (proof-route + epic + recall), holding source content constant at
// the v1 packet commit (0205b0d, == README@d20e043).
//
// The answer key is HITL working-state, not file-ratified: batches b1+b2 (10
// claims) are maintainer-confirmed (charness-artifacts/hitl/latest.md); batch
// b3 (5 claims, incl cli.md:391) is agent-proposed and was awaiting confirm at
// the 15/24 pause. We report confirmed-only and full (confirmed+proposed).
//
// Inputs (durable, checked in next to this script):
//   v2-reextraction-readme.json / v2-reextraction-cli.json  (blind v2 output)
//   ../gold-set-proposal.user-product.json                  (v1 user-product gold set; verdicts HITL working-state)
//   ../epic-dag-proposal.json                               (epic ground truth)
// The 15-claim answer key: b1+b2 verdicts are maintainer-confirmed in
// charness-artifacts/hitl/latest.md; b3 (incl cli.md:391) is agent-proposed
// (see the `confirmed` flags below). Pinned here for reproducibility.
//
// Run: node score.mjs   (writes scorecard.json, prints a summary)
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const read = (p) => JSON.parse(fs.readFileSync(path.join(here, p), "utf8"));

const rd = read("v2-reextraction-readme.json");
const cl = read("v2-reextraction-cli.json");
const v2 = [...rd.claims, ...cl.claims];
const byRef = Object.fromEntries(v2.map((c) => [c.sourceRef, c]));

const gold = read("../gold-set-proposal.user-product.json");
const dag = read("../epic-dag-proposal.json");
const dagBy = Object.fromEntries(dag.claims.map((c) => [c.sourceRef, c]));

const branchOf = {
  APEX: "APEX",
  "A1-orchestration": "Agent",
  "A2-curation-review": "Agent",
  "S1-install": "Setup",
  "S2-readiness": "Setup",
  "D1-discovery": "Discover",
  "D2-review-refresh": "Discover",
  "E1-evaluate": "Eval",
  "E2-scenarios-experiments": "Eval",
  "I1-bounded-improvement": "Improve",
  "M1-proven-on-itself": "Meta/Cross",
};

// Answer key: the 15 HITL-reviewed user-product claims (README + cli carry 100%
// of the per-claim ground truth). correctProof reflects HITL relabels.
// confirmed=true for the maintainer-confirmed batches b1+b2; false for the
// agent-proposed batch b3 (awaiting confirmation at the pause).
const answerKey = {
  "README.md:13": { correctProof: "deterministic", verdict: "relabel", confirmed: true },
  "README.md:68": { correctProof: "cautilus-eval", verdict: "accept", confirmed: true },
  "README.md:113": { correctProof: "cautilus-eval", verdict: "relabel", confirmed: true },
  "README.md:140": { correctProof: "deterministic", verdict: "accept", confirmed: true },
  "README.md:163": { correctProof: "deterministic", verdict: "accept", confirmed: true },
  "docs/guides/cli.md:27": { correctProof: "deterministic", verdict: "accept", confirmed: true },
  "docs/guides/cli.md:110": { correctProof: "deterministic", verdict: "accept", confirmed: true },
  "docs/guides/cli.md:121": { correctProof: "deterministic", verdict: "accept", confirmed: true },
  "docs/guides/cli.md:128": { correctProof: "deterministic", verdict: "accept", confirmed: true },
  "docs/guides/cli.md:138": { correctProof: "deterministic", verdict: "badly-bounded", confirmed: true },
  "docs/guides/cli.md:148": { correctProof: "deterministic", verdict: "accept", confirmed: false },
  "docs/guides/cli.md:218": { correctProof: "deterministic", verdict: "accept", confirmed: false },
  "docs/guides/cli.md:266": { correctProof: "deterministic", verdict: "accept", confirmed: false },
  "docs/guides/cli.md:276": { correctProof: "deterministic", verdict: "accept", confirmed: false },
  "docs/guides/cli.md:391": { correctProof: "deterministic", verdict: "relabel", confirmed: false },
};

const reviewed = [];
let proofOK = 0;
let epicExact = 0;
let epicBranch = 0;
let proofOKConfirmed = 0;
let v1OKConfirmed = 0;
let confirmedTotal = 0;
for (const [ref, k] of Object.entries(answerKey)) {
  const g = gold.entries.find((e) => e.sourceRef === ref);
  const gd = dagBy[ref] || {};
  const c = byRef[ref];
  const row = {
    ref,
    v1Proof: g ? g.agentLabels.recommendedProof : null,
    correctProof: k.correctProof,
    hitlVerdict: k.verdict,
    goldPrimaryEpic: gd.primaryEpic || null,
    goldSupportingEpics: gd.supportingEpics || [],
    present: Boolean(c),
    v2Proof: c ? c.recommendedProof : null,
    v2PrimaryEpic: c ? c.primaryEpic : null,
    v2SupportingEpics: c ? c.supportingEpics : null,
  };
  row.proofCorrect = row.present && row.v2Proof === k.correctProof;
  row.epicExact = row.present && row.v2PrimaryEpic === row.goldPrimaryEpic;
  row.epicSameBranch =
    row.present && branchOf[row.v2PrimaryEpic] === branchOf[row.goldPrimaryEpic];
  row.confirmed = k.confirmed;
  if (row.proofCorrect) proofOK++;
  if (row.epicExact) epicExact++;
  if (row.epicSameBranch) epicBranch++;
  if (k.confirmed) {
    confirmedTotal++;
    if (row.proofCorrect) proofOKConfirmed++;
    if (row.present && row.v1Proof === k.correctProof) v1OKConfirmed++;
  }
  reviewed.push(row);
}

// Recall: the two genuine false negatives v1 missed (principle + boundary).
const recallTargets = ["README.md:8", "README.md:30"].map((ref) => ({
  ref,
  caught: Boolean(byRef[ref]),
  v2Proof: byRef[ref]?.recommendedProof || null,
  v2PrimaryEpic: byRef[ref]?.primaryEpic || null,
}));

// Grounding precision: every v2 verbatim must match the frozen source line.
const lineMap = (file) => {
  const m = {};
  for (const raw of fs.readFileSync(file, "utf8").split("\n")) {
    const mm = raw.match(/^\s*(\d+)\t([\s\S]*)$/);
    if (mm) m[Number(mm[1])] = mm[2];
  }
  return m;
};
let grounded = 0;
let groundedTotal = 0;
const FROZEN_README =
  process.env.FROZEN_README || path.join(here, "README.frozen.numbered.txt");
const FROZEN_CLI =
  process.env.FROZEN_CLI || path.join(here, "cli.frozen.numbered.txt");
if (fs.existsSync(FROZEN_README) && fs.existsSync(FROZEN_CLI)) {
  const rmap = lineMap(FROZEN_README);
  const cmap = lineMap(FROZEN_CLI);
  for (const c of rd.claims) {
    groundedTotal++;
    if ((rmap[c.line] ?? "").trim() === String(c.verbatim).trim()) grounded++;
  }
  for (const c of cl.claims) {
    groundedTotal++;
    if ((cmap[c.line] ?? "").trim() === String(c.verbatim).trim()) grounded++;
  }
}

const dist = (arr, f) =>
  arr.reduce((d, x) => ((d[f(x)] = (d[f(x)] || 0) + 1), d), {});

const v2user = v2.filter((c) => c.claimAudience === "user");
const goldInScope = gold.entries.filter(
  (e) =>
    e.sourceRef.startsWith("README.md:") ||
    e.sourceRef.startsWith("docs/guides/cli.md:"),
);
const scorecard = {
  anchor: {
    packetGitCommit: gold.packetGitCommit,
    note: "v2 re-extraction held source content constant at the v1 packet commit (== README@d20e043, pre item-3 rewrite); facets are the only varied input.",
    templateVersion: rd.templateVersion,
    templateHash: read("template-v2-block.json").templateHash,
  },
  scope: {
    sources: ["README.md", "docs/guides/cli.md"],
    note: "README+cli carry 100% of the 15-claim per-claim answer key, both recall FNs, and 92/121 of the user-product gold entries.",
  },
  proofRoute: {
    confirmed: { v2Correct: proofOKConfirmed, v1Correct: v1OKConfirmed, total: confirmedTotal },
    full: { v2Correct: proofOK, v1Correct: 12, total: reviewed.length },
    note: "confirmed = HITL b1+b2 (maintainer-confirmed in chat); full = confirmed + proposed b3 (awaiting confirm, includes cli.md:391).",
  },
  epic: {
    primaryExact: epicExact,
    primarySameBranch: epicBranch,
    total: reviewed.length,
  },
  recall: recallTargets,
  grounding: { matched: grounded, total: groundedTotal },
  counts: {
    v2: { readme: rd.claims.length, cli: cl.claims.length, total: v2.length },
    v1Full: { readme: 35, cli: 78 },
    v2UserAudience: { readme: rd.claims.filter((c) => c.claimAudience === "user").length, cli: cl.claims.filter((c) => c.claimAudience === "user").length },
    v1UserProduct: { readme: 32, cli: 60 },
  },
  proofDistribution: {
    v2User: dist(v2user, (c) => c.recommendedProof),
    v1GoldUserAllSources: dist(gold.entries, (e) => e.agentLabels.recommendedProof),
    v1GoldUserInScope: dist(goldInScope, (e) => e.agentLabels.recommendedProof),
    note: "Like-for-like human-auditable comparison uses v2User vs v1GoldUserInScope (both README+cli, user-audience).",
  },
  reviewed,
};

fs.writeFileSync(
  path.join(here, "scorecard.json"),
  JSON.stringify(scorecard, null, 2) + "\n",
);

console.log(`proof-route confirmed (b1+b2): v2 ${proofOKConfirmed}/${confirmedTotal} (v1 ${v1OKConfirmed}/${confirmedTotal})`);
console.log(`proof-route full (incl proposed b3): v2 ${proofOK}/${reviewed.length} (v1 12/${reviewed.length})`);
console.log(`epic primary: exact ${epicExact}/${reviewed.length}, same-branch ${epicBranch}/${reviewed.length}`);
console.log(`recall FN caught: ${recallTargets.filter((r) => r.caught).length}/2`);
console.log(`grounding: ${grounded}/${groundedTotal} verbatim matched`);
console.log(`proof dist v2User (README+cli): ${JSON.stringify(scorecard.proofDistribution.v2User)}`);
console.log(`proof dist v1Gold in-scope (README+cli): ${JSON.stringify(scorecard.proofDistribution.v1GoldUserInScope)}`);
console.log("wrote scorecard.json");
