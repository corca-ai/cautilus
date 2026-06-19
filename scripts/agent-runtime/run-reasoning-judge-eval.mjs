// Adapter-owned reasoning-soundness judge runner for `cautilus evaluate fixture`.
//
// This is the bridge that wires the reasoning-soundness judge into the product CLI. It is
// repo-specific (it lives in scripts/ and is named by a self-dogfood adapter), so the generic
// Go product never depends on it: the product reads a structured `reasoningSoundness` verdict
// from the observed packet and composites it deterministically (see instruction_surface.go).
//
// What this runner does (prove-then-project, no live cost):
//   - reads the evaluation_input.v1 cases file the pipeline prepares,
//   - loads a reasoning-soundness calibration + its captured blind-judge verdicts,
//   - recomputes the COMPOSITE verdict per case via the SOT harness (compareVerdicts: code
//     facets AND the blind judge's semantic verdict),
//   - emits an evaluation_observed.v1 packet whose per-case routingDecision comes from the
//     harvested observedRoute and whose reasoningSoundness carries the composite verdict.
//
// So `cautilus evaluate fixture --adapter-name self-dogfood-routing-regression-eval` runs the
// judge tier end-to-end through the product CLI: the baseline passes, and the regressed cases
// are flagged worse — the code process facet carries the dropped-bootstrap regressions and the
// judge carries the right-route-wrong-reason control.

import { readFileSync, mkdirSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import process from "node:process";

import { loadCalibration, compareVerdicts } from "./reasoning-soundness-judge.mjs";
import { buildReasoningSoundness } from "./reasoning-soundness-attach.mjs";

// This synthetic-replay runner labels its verdicts as harvested-paraphrase provenance. The
// real-surface enricher (enrich-eval-with-reasoning-judge.mjs) passes a different label because it
// grades the dogfood runner's genuine capture; both share buildReasoningSoundness as the SOT shape.
const PROVENANCE = "blind-subagent-harvest-replay";

function fail(message) {
	process.stderr.write(`${message}\n`);
	process.exit(1);
}

// --backend, --output-dir, and --repo-root are accepted (the pipeline substitutes them into the
// adapter command template) but inert here: this runner is a deterministic replay of captured
// verdicts, so it does no runtime selection and writes only the observed packet at --output-file.
const VALUE_OPTIONS = new Set(["--cases-file", "--output-file", "--calibration", "--verdicts", "--suite-id", "--backend", "--output-dir", "--repo-root"]);

function parseArgs(argv) {
	const options = { backend: null, outputDir: null, repoRoot: null, suiteId: null };
	for (let index = 0; index < argv.length; index += 1) {
		const arg = argv[index];
		if (arg === "-h" || arg === "--help") {
			process.stdout.write("Usage: run-reasoning-judge-eval.mjs --cases-file <f> --output-file <f> --calibration <f> --verdicts <f> [--suite-id <id>]\n");
			process.exit(0);
		}
		if (!VALUE_OPTIONS.has(arg)) {
			fail(`Unknown argument: ${arg}`);
		}
		const value = argv[index + 1];
		if (value === undefined) {
			fail(`Missing value for ${arg}`);
		}
		const key = arg.slice(2).replace(/-([a-z])/g, (_, c) => c.toUpperCase());
		options[key] = value;
		index += 1;
	}
	for (const required of ["casesFile", "outputFile", "calibration", "verdicts"]) {
		if (!options[required]) {
			fail(`--${required.replace(/[A-Z]/g, (c) => `-${c.toLowerCase()}`)} is required`);
		}
	}
	return options;
}

function readJson(path) {
	return JSON.parse(readFileSync(resolve(path), "utf-8"));
}

function pinnedReasonSummary(observedRoute, fallback) {
	const reason = observedRoute && typeof observedRoute.reasonSummary === "string" ? observedRoute.reasonSummary : null;
	return reason || fallback;
}

// The pipeline normalizes the adapter's evaluation_input.v1 fixture into a cautilus.evaluation_cases.v1
// packet (keyed by `evaluations` / `evaluationId`) before handing it to this runner. Accept either
// shape so the runner also works when invoked directly on a raw evaluation_input.v1 fixture.
function normalizeCases(casesDoc) {
	if (casesDoc.schemaVersion === "cautilus.evaluation_cases.v1") {
		const list = Array.isArray(casesDoc.evaluations) ? casesDoc.evaluations : [];
		return list.map((entry) => ({ ...entry, caseId: entry.evaluationId }));
	}
	if (casesDoc.schemaVersion === "cautilus.evaluation_input.v1") {
		return Array.isArray(casesDoc.cases) ? casesDoc.cases : [];
	}
	fail(`cases file must be cautilus.evaluation_cases.v1 or cautilus.evaluation_input.v1, got ${casesDoc.schemaVersion}`);
	return [];
}

function buildRoutingDecision(calibrationCase) {
	const observedRoute = calibrationCase.observedRoute || {};
	const routingDecision = {};
	for (const key of ["bootstrapHelper", "workSkill", "selectedSkill", "firstToolCall"]) {
		if (typeof observedRoute[key] === "string" && observedRoute[key].length > 0) {
			routingDecision[key] = observedRoute[key];
		}
	}
	routingDecision.reasonSummary = pinnedReasonSummary(calibrationCase, calibrationCase.reasonSummary || "no reason captured");
	return routingDecision;
}

// Build one observed evaluation by joining a cases-file entry with the harvested observedRoute
// (from the calibration) and the SOT composite verdict (from compareVerdicts).
function buildObservedEvaluation(entry, context) {
	const { calibrationById, compositeById, evidenceById, claimId } = context;
	const caseId = entry.caseId;
	const calibrationCase = calibrationById.get(caseId);
	const composite = compositeById.get(caseId);
	if (!calibrationCase || !composite) {
		fail(`case '${caseId}' from the cases file is not present in the calibration/verdicts`);
	}
	const evaluation = {
		evaluationId: caseId,
		displayName: entry.displayName || caseId,
		prompt: entry.prompt || calibrationCase.promptLabel || `routing-regression case ${caseId}`,
		observationStatus: "observed",
		summary: `Replayed ${claimId} case ${caseId}: composite verdict ${composite.got}.`,
		instructionSurface: {
			surfaceLabel: "checked_in_instruction_surface",
			files: [{ path: "AGENTS.md", kind: "file", sourceKind: "workspace_default" }],
		},
		routingDecision: buildRoutingDecision(calibrationCase),
		reasoningSoundness: buildReasoningSoundness(claimId, composite, evidenceById.get(caseId), PROVENANCE),
	};
	if (entry.expectedEntryFile) {
		evaluation.expectedEntryFile = entry.expectedEntryFile;
	}
	if (Array.isArray(entry.requiredInstructionFiles) && entry.requiredInstructionFiles.length > 0) {
		evaluation.requiredInstructionFiles = entry.requiredInstructionFiles;
	}
	if (entry.expectedRouting && Object.keys(entry.expectedRouting).length > 0) {
		evaluation.expectedRouting = entry.expectedRouting;
	}
	return evaluation;
}

function main() {
	const options = parseArgs(process.argv.slice(2));
	const casesDoc = readJson(options.casesFile);
	const cases = normalizeCases(casesDoc);
	if (cases.length === 0) {
		fail("cases file must declare a non-empty cases array");
	}

	const calibration = loadCalibration(resolve(options.calibration));
	const capturedDoc = readJson(options.verdicts);
	const verdicts = Array.isArray(capturedDoc) ? capturedDoc : capturedDoc.verdicts;
	if (!Array.isArray(verdicts)) {
		fail("verdicts file must be an array or carry a `verdicts` array");
	}
	// SOT composite: code facets AND the blind judge's semantic verdict, per case.
	const comparison = compareVerdicts(calibration, verdicts);
	if (comparison.rubberStampSuspected) {
		fail("refusing to emit: the calibration's captured judge is rubber-stamp suspected (gate would be vacuous)");
	}
	const context = {
		calibrationById: new Map(calibration.cases.map((c) => [c.id, c])),
		compositeById: new Map(comparison.byCase.map((row) => [row.caseId, row])),
		evidenceById: new Map(verdicts.map((v) => [v.caseId, v.evidence])),
		claimId: calibration.claimId,
	};
	const evaluations = cases.map((entry) => buildObservedEvaluation(entry, context));

	const observed = {
		schemaVersion: "cautilus.evaluation_observed.v1",
		suiteId: options.suiteId || casesDoc.suiteId || calibration.claimId,
		suiteDisplayName: casesDoc.suiteDisplayName || calibration.claimId,
		evaluations,
	};

	const outputPath = resolve(options.outputFile);
	mkdirSync(dirname(outputPath), { recursive: true });
	writeFileSync(outputPath, `${JSON.stringify(observed, null, 2)}\n`);
	process.stdout.write(`reasoning-judge-eval: wrote ${evaluations.length} observed evaluation(s) to ${outputPath}\n`);
}

main();
