import { test } from "node:test";
import assert from "node:assert/strict";

import {
	auditSurface,
	buildManifest,
	computeObserved,
	countSpecChecks,
	parseApexBadges,
	renderAuditMarkdown,
	slugify,
} from "./surface-audit-lib.mjs";

const APEX = [
	"# Cautilus, Proven On Itself",
	"## What Cautilus Does For You",
	"### Readiness — proven",
	"before your first eval...",
	"### Behavior Evaluation — proven on dev surfaces; app-ship in Proof Debt",
	"you see whether the agents...",
	"## Why You Can Trust It",
	"### Reviewable Artifacts — declared",
	"you can reopen...",
	"### A Testable Agent — promised",
	"### Not A Badge — banana",
	"## How To Read This",
].join("\n");

const REGISTRY = [
	{ id: "readiness", title: "Readiness", proofClass: "deterministic", proofSpec: "specs/readiness.spec.md", proofCommand: "npm run lint:specs", liveOptInCommand: null, evidence: [] },
	{ id: "behavior-evaluation", title: "Behavior Evaluation", proofClass: "live-replayed", proofSpec: "specs/evaluation.spec.md", proofCommand: "npm run lint:specs", liveOptInCommand: "npm run proof:behavior-eval:live", evidence: ["fixtures/capture.json"] },
	{ id: "reviewable-artifacts", title: "Reviewable Artifacts", proofClass: "projected-bundle", proofSpec: "specs/reviewable.spec.md", proofCommand: "npm run lint:specs", liveOptInCommand: null, evidence: ["bundle.json"] },
	{ id: "a-testable-agent", title: "A Testable Agent", proofClass: "none", proofSpec: null, proofCommand: null, liveOptInCommand: null, evidence: [] },
];

// Everything present, every leaf carries checks.
function honestWorld() {
	const present = new Set([
		"specs/readiness.spec.md",
		"specs/evaluation.spec.md",
		"specs/reviewable.spec.md",
		"fixtures/capture.json",
		"bundle.json",
	]);
	return {
		fileExists: (path) => present.has(path),
		readCheckCount: () => 2,
	};
}

test("parseApexBadges extracts badges and ignores non-status headings", () => {
	const badges = parseApexBadges(APEX);
	assert.deepEqual(
		badges.map((b) => [b.title, b.claimedStatus]),
		[
			["Readiness", "proven"],
			["Behavior Evaluation", "proven"],
			["Reviewable Artifacts", "declared"],
			["A Testable Agent", "promised"],
		],
	);
});

test("slugify produces stable badge ids", () => {
	assert.equal(slugify("A Testable Agent"), "a-testable-agent");
	assert.equal(slugify("Behavior Evaluation"), "behavior-evaluation");
});

test("countSpecChecks counts only check directives", () => {
	const body = ["intro", "> check:cautilus-json-file", "| a | b |", "> check:cautilus-command", "text", "> not a check"].join("\n");
	assert.equal(countSpecChecks(body), 2);
});

test("countSpecChecks ignores check directives inside code fences", () => {
	const body = ["> check:cautilus-json-file", "```md", "> check:cautilus-json-file", "> check:cautilus-command", "```", "> check:cautilus-command"].join("\n");
	assert.equal(countSpecChecks(body), 2);
});

test("parseApexBadges ignores badge headings inside code fences", () => {
	const body = ["### Real Badge — proven", "```md", "### Fenced Example — proven", "```", "### Another Real — declared"].join("\n");
	assert.deepEqual(
		parseApexBadges(body).map((b) => b.title),
		["Real Badge", "Another Real"],
	);
});

test("computeObserved promotes a healthy deterministic route to proven", () => {
	const observed = computeObserved(REGISTRY[0], honestWorld());
	assert.equal(observed.observedStatus, "proven");
	assert.equal(observed.evidencePresent, true);
});

test("computeObserved downgrades a route with missing evidence to unproven", () => {
	const world = honestWorld();
	const observed = computeObserved(REGISTRY[1], {
		fileExists: (path) => path !== "fixtures/capture.json" && world.fileExists(path),
		readCheckCount: () => 2,
	});
	assert.equal(observed.observedStatus, "unproven");
	assert.deepEqual(observed.missingEvidence, ["fixtures/capture.json"]);
});

test("computeObserved downgrades a route whose leaf carries no checks", () => {
	const observed = computeObserved(REGISTRY[0], { fileExists: () => true, readCheckCount: () => 0 });
	assert.equal(observed.observedStatus, "unproven");
});

test("a none-class route is observed as promised without a proof spec", () => {
	const observed = computeObserved(REGISTRY[3], honestWorld());
	assert.equal(observed.observedStatus, "promised");
});

test("auditSurface reports an honest surface as consistent", () => {
	const result = auditSurface({ apexMarkdown: APEX, registry: REGISTRY, ...honestWorld() });
	assert.equal(result.summary.honest, true);
	assert.equal(result.summary.consistent, 4);
	assert.equal(result.summary.inconsistent, 0);
	assert.deepEqual(result.orphanIssues, []);
});

test("auditSurface fails when a badge over-claims its proof class", () => {
	// Apex bumps Reviewable Artifacts to proven, but its route is projected-bundle (declared at best).
	const overclaimApex = APEX.replace("### Reviewable Artifacts — declared", "### Reviewable Artifacts — proven");
	const result = auditSurface({ apexMarkdown: overclaimApex, registry: REGISTRY, ...honestWorld() });
	const badge = result.badges.find((b) => b.id === "reviewable-artifacts");
	assert.equal(badge.claimedStatus, "proven");
	assert.equal(badge.observed.observedStatus, "declared");
	assert.equal(badge.consistent, false);
	assert.equal(result.summary.honest, false);
	assert.equal(result.summary.inconsistent, 1);
});

test("auditSurface fails when claimed-proven evidence is missing", () => {
	const world = honestWorld();
	const result = auditSurface({
		apexMarkdown: APEX,
		registry: REGISTRY,
		fileExists: (path) => path !== "fixtures/capture.json" && world.fileExists(path),
		readCheckCount: () => 2,
	});
	const badge = result.badges.find((b) => b.id === "behavior-evaluation");
	assert.equal(badge.consistent, false);
	assert.match(badge.inconsistencyReasons.join(" "), /missing evidence/);
});

test("auditSurface flags an apex badge with no registry route", () => {
	const extraApex = `${APEX}\n### Mystery Promise — proven`;
	const result = auditSurface({ apexMarkdown: extraApex, registry: REGISTRY, ...honestWorld() });
	assert.match(result.orphanIssues.join(" "), /Mystery Promise/);
	assert.equal(result.summary.honest, false);
});

test("auditSurface flags a registry route with no apex badge", () => {
	const extraRegistry = [...REGISTRY, { id: "ghost", title: "Ghost Route", proofClass: "deterministic", proofSpec: "specs/ghost.spec.md", evidence: [] }];
	const result = auditSurface({ apexMarkdown: APEX, registry: extraRegistry, ...honestWorld() });
	assert.match(result.orphanIssues.join(" "), /Ghost Route/);
	assert.equal(result.summary.honest, false);
});

test("renderAuditMarkdown emits a navigable index with a binding check block", () => {
	const manifest = buildManifest({
		apexPath: "docs/specs/index.spec.md",
		registryPath: "docs/specs/audit/surface-registry.json",
		apexMarkdown: APEX,
		registry: REGISTRY,
		...honestWorld(),
	});
	const md = renderAuditMarkdown(manifest, { manifestPath: ".cautilus/audit/surface-audit.json" });
	assert.match(md, /# Surface Honesty Audit/);
	assert.match(md, /Do not edit it by hand/);
	assert.match(md, /> check:cautilus-json-file/);
	assert.match(md, /\.cautilus\/audit\/surface-audit\.json \| summary\.honest \| true/);
	// Navigable: links the leaf specs relative to docs/specs/.
	assert.match(md, /\[Readiness\]\(/);
});
