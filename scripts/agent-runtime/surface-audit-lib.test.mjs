import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

import {
	auditSurface,
	buildManifest,
	computeObserved,
	countSpecChecks,
	extractCheckedFilePaths,
	extractSubstantiveFilePaths,
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

// Everything present, every leaf carries checks, and every leaf references all
// of its declared evidence (so the semantic cross-check passes).
function honestWorld() {
	const present = new Set([
		"specs/readiness.spec.md",
		"specs/evaluation.spec.md",
		"specs/reviewable.spec.md",
		"fixtures/capture.json",
		"bundle.json",
	]);
	const allEvidence = REGISTRY.flatMap((entry) => entry.evidence || []);
	return {
		fileExists: (path) => present.has(path),
		readCheckCount: () => 2,
		readReferencedFilePaths: () => allEvidence,
		readSubstantiveFilePaths: () => allEvidence,
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

test("extractCheckedFilePaths returns only cautilus-json-file table paths", () => {
	const body = [
		"intro prose",
		"> check:cautilus-json-file",
		"| path | json_path | equals |",
		"| --- | --- | --- |",
		"| fixtures/a.json | x | 1 |",
		"| fixtures/b.json | y | 2 |",
		"",
		"more prose",
		"> check:cautilus-json-command(command=foo)",
		"| path | equals |",
		"| --- | --- |",
		"| checks[id=x].ok | true |",
		"```md",
		"> check:cautilus-json-file",
		"| path | json_path | equals |",
		"| --- | --- | --- |",
		"| fixtures/fenced.json | z | 3 |",
		"```",
	].join("\n");
	assert.deepEqual([...extractCheckedFilePaths(body)].sort(), ["fixtures/a.json", "fixtures/b.json"]);
});

test("extractCheckedFilePaths honors the path column position and skips empty cells", () => {
	const body = [
		"> check:cautilus-json-file",
		"| json_path | path | equals |",
		"| --- | --- | --- |",
		"| x | fixtures/c.json | 1 |",
		"| y |  | 2 |",
	].join("\n");
	assert.deepEqual([...extractCheckedFilePaths(body)], ["fixtures/c.json"]);
});

test("extractSubstantiveFilePaths counts value-bearing assertions on non-schemaVersion paths", () => {
	const body = [
		"> check:cautilus-json-file",
		"| path | json_path | equals | includes | min_number |",
		"| --- | --- | --- | --- | --- |",
		"| fixtures/eq.json | outcome | passed |  |  |",
		"| fixtures/inc.json | summary |  | packets |  |",
		"| fixtures/min.json | sourceCount |  |  | 1 |",
	].join("\n");
	assert.deepEqual(
		[...extractSubstantiveFilePaths(body)].sort(),
		["fixtures/eq.json", "fixtures/inc.json", "fixtures/min.json"],
	);
});

test("extractSubstantiveFilePaths omits trivial rows: schemaVersion (incl. nested), exists-only, min_number 0, empty cells", () => {
	const body = [
		"> check:cautilus-json-file",
		"| path | json_path | equals | exists | min_number | includes |",
		"| --- | --- | --- | --- | --- | --- |",
		"| fixtures/schema.json | schemaVersion | cautilus.x.v1 |  |  |  |",
		"| fixtures/nested.json | a.b.observed.schemaVersion | cautilus.y.v1 |  |  |  |",
		"| fixtures/exists.json | field |  | yes |  |  |",
		"| fixtures/min0.json | count |  |  | 0 |  |",
		"| fixtures/empty.json | field |  |  |  |  |",
		"| fixtures/emptyinc.json | field |  |  |  |  |",
	].join("\n");
	assert.deepEqual([...extractSubstantiveFilePaths(body)], []);
});

test("extractSubstantiveFilePaths counts a file with a trivial AND a substantive row (substantive wins)", () => {
	const body = [
		"> check:cautilus-json-file",
		"| path | json_path | equals |",
		"| --- | --- | --- |",
		"| fixtures/mixed.json | schemaVersion | cautilus.z.v1 |",
		"| fixtures/mixed.json | recommendation | reject |",
	].join("\n");
	assert.deepEqual([...extractSubstantiveFilePaths(body)], ["fixtures/mixed.json"]);
});

test("extractSubstantiveFilePaths ignores fenced examples and non-file checks", () => {
	const body = [
		"> check:cautilus-json-file",
		"| path | json_path | equals |",
		"| --- | --- | --- |",
		"| fixtures/real.json | outcome | passed |",
		"> check:cautilus-json-command(command=foo)",
		"| path | equals |",
		"| --- | --- |",
		"| checks[id=x].ok | true |",
		"```md",
		"> check:cautilus-json-file",
		"| path | json_path | equals |",
		"| --- | --- | --- |",
		"| fixtures/fenced.json | outcome | passed |",
		"```",
	].join("\n");
	assert.deepEqual([...extractSubstantiveFilePaths(body)], ["fixtures/real.json"]);
});

test("computeObserved downgrades a route whose evidence is referenced but only by a trivial check", () => {
	const observed = computeObserved(REGISTRY[1], {
		fileExists: () => true,
		readCheckCount: () => 2,
		readReferencedFilePaths: () => ["fixtures/capture.json"], // read by some check
		readSubstantiveFilePaths: () => [], // but never substantively
	});
	assert.equal(observed.evidenceReferenced, true);
	assert.equal(observed.evidenceSubstantive, false);
	assert.deepEqual(observed.nonSubstantiveEvidence, ["fixtures/capture.json"]);
	assert.equal(observed.observedStatus, "unproven");
});

test("auditSurface fails when a badge's evidence is referenced only by a trivial check (hollow assertion)", () => {
	const world = honestWorld();
	const result = auditSurface({
		apexMarkdown: APEX,
		registry: REGISTRY,
		fileExists: world.fileExists,
		readCheckCount: world.readCheckCount,
		readReferencedFilePaths: world.readReferencedFilePaths,
		// evaluation.spec.md reads its evidence, but (as if weakened to a schemaVersion-only
		// touch) it asserts nothing substantive on it.
		readSubstantiveFilePaths: (path) =>
			path === "specs/evaluation.spec.md" ? [] : world.readSubstantiveFilePaths(path),
	});
	const badge = result.badges.find((b) => b.id === "behavior-evaluation");
	assert.equal(badge.observed.evidenceReferenced, true);
	assert.equal(badge.observed.evidenceSubstantive, false);
	assert.deepEqual(badge.observed.nonSubstantiveEvidence, ["fixtures/capture.json"]);
	assert.equal(badge.observed.observedStatus, "unproven");
	assert.equal(badge.consistent, false);
	assert.match(badge.inconsistencyReasons.join(" "), /referenced only by a trivial check/);
	assert.equal(result.summary.honest, false);
});

test("every registry-declared evidence file is substantively referenced by its leaf spec (AC3: floor lands green)", () => {
	const repoRoot = resolve(fileURLToPath(new URL("../../", import.meta.url)));
	const registry = JSON.parse(
		readFileSync(resolve(repoRoot, "docs/specs/audit/surface-registry.json"), "utf-8"),
	).routes;
	for (const route of registry) {
		if (!route.proofSpec || (route.evidence || []).length === 0) {
			continue;
		}
		const substantive = extractSubstantiveFilePaths(readFileSync(resolve(repoRoot, route.proofSpec), "utf-8"));
		for (const file of route.evidence) {
			assert.ok(
				substantive.has(file),
				`${route.id}: evidence ${file} is not substantively referenced in ${route.proofSpec}`,
			);
		}
	}
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

test("computeObserved downgrades a route whose evidence the leaf spec never references", () => {
	const observed = computeObserved(REGISTRY[1], {
		fileExists: () => true,
		readCheckCount: () => 2,
		readReferencedFilePaths: () => [], // leaf spec carries checks but references no files
	});
	assert.equal(observed.evidenceReferenced, false);
	assert.deepEqual(observed.unreferencedEvidence, ["fixtures/capture.json"]);
	assert.equal(observed.observedStatus, "unproven");
});

test("computeObserved keeps a route proven when every evidence file is referenced", () => {
	const observed = computeObserved(REGISTRY[1], {
		fileExists: () => true,
		readCheckCount: () => 2,
		readReferencedFilePaths: () => ["fixtures/capture.json", "unrelated.json"],
	});
	assert.equal(observed.evidenceReferenced, true);
	assert.deepEqual(observed.unreferencedEvidence, []);
	assert.equal(observed.observedStatus, "proven");
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

test("auditSurface fails when a badge's evidence is not referenced by its proof spec (redirect/hollow)", () => {
	const world = honestWorld();
	const result = auditSurface({
		apexMarkdown: APEX,
		registry: REGISTRY,
		fileExists: world.fileExists,
		readCheckCount: world.readCheckCount,
		// evaluation.spec.md exists and carries checks, but (as if redirected to an
		// unrelated spec) it references none of behavior-evaluation's evidence.
		readReferencedFilePaths: (path) =>
			path === "specs/evaluation.spec.md" ? [] : world.readReferencedFilePaths(path),
	});
	const badge = result.badges.find((b) => b.id === "behavior-evaluation");
	assert.equal(badge.observed.evidenceReferenced, false);
	assert.deepEqual(badge.observed.unreferencedEvidence, ["fixtures/capture.json"]);
	assert.equal(badge.observed.observedStatus, "unproven");
	assert.equal(badge.consistent, false);
	assert.match(badge.inconsistencyReasons.join(" "), /not referenced/);
	assert.equal(result.summary.honest, false);
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
