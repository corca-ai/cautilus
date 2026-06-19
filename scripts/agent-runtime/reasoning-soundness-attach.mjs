// Shared SOT bridge between the reasoning-soundness harness and the product CLI's observed packet.
//
// The product engine (internal/runtime/instruction_surface.go) reads an optional per-evaluation
// `reasoningSoundness` composite verdict and ANDs it into the case status. This module is the single
// source of truth for turning a harness composite row into that structured verdict, so every
// adapter-owned runner attaches the SAME shape — and it never lives in the generic Go engine or the
// generic runtime runner (run-local-eval-test.mjs), keeping the code/intelligence boundary intact.
//
// `provenance` is a PARAMETER, not a hardcoded string: the routing-regression replay labels its
// verdicts `blind-subagent-harvest-replay`, while the real-surface enricher labels them
// `full-runner-capture-replay` because it grades the dogfood runner's genuine AGENTS.md capture.

import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { loadCalibration, compareVerdicts } from "./reasoning-soundness-judge.mjs";

// Build the structured reasoningSoundness verdict from a SOT composite row (a `compareVerdicts`
// byCase entry: { got, judgeVerdict?, codeFacets?, confidence? }). Additive fields are attached only
// when present, matching the engine's optional-field contract.
export function buildReasoningSoundness(claimId, composite, evidence, provenance) {
	if (typeof provenance !== "string" || provenance.length === 0) {
		throw new Error("buildReasoningSoundness requires a non-empty provenance label");
	}
	const reasoningSoundness = { verdict: composite.got, claimId, provenance };
	if (composite.judgeVerdict) {
		reasoningSoundness.judgeVerdict = composite.judgeVerdict;
	}
	if (composite.codeFacets && Object.keys(composite.codeFacets).length > 0) {
		reasoningSoundness.codeFacets = composite.codeFacets;
	}
	if (typeof composite.confidence === "number") {
		reasoningSoundness.confidence = composite.confidence;
	}
	if (typeof evidence === "string" && evidence.length > 0) {
		reasoningSoundness.evidence = evidence;
	}
	return reasoningSoundness;
}

// Load a calibration + its captured blind-judge verdicts and compute the SOT composite per case.
// Fails closed: throws when the captured judge is rubber-stamp suspected, so a vacuous (always-sound)
// gate can never be projected into a packet.
export function loadCompositeContext({ calibrationPath, verdictsPath }) {
	const calibration = loadCalibration(resolve(calibrationPath));
	const capturedDoc = JSON.parse(readFileSync(resolve(verdictsPath), "utf-8"));
	const verdicts = Array.isArray(capturedDoc) ? capturedDoc : capturedDoc.verdicts;
	if (!Array.isArray(verdicts)) {
		throw new Error("verdicts file must be an array or carry a `verdicts` array");
	}
	const comparison = compareVerdicts(calibration, verdicts);
	if (comparison.rubberStampSuspected) {
		throw new Error("refusing: the captured judge is rubber-stamp suspected (gate would be vacuous)");
	}
	return {
		claimId: calibration.claimId,
		comparison,
		compositeById: new Map(comparison.byCase.map((row) => [row.caseId, row])),
		evidenceById: new Map(verdicts.map((v) => [v.caseId, v.evidence])),
	};
}
