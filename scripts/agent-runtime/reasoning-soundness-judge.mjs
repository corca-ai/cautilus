// Reasoning-soundness judge harness (prototype).
//
// Design: docs/contracts/eval-judge-collaboration.md.
// Intelligence is an independent observer that reads a real routing reasoning and
// emits a STRUCTURED rubric (never free prose). Code is the deterministic comparator
// that checks the judge's rubric against the calibration ground truth.
//
// This module owns the deterministic, reproducible parts only:
//   - the rubric output schema the judge must emit,
//   - the BLIND prompt builder (strips expected labels so the judge cannot peek),
//   - the comparator that turns captured judge verdicts into a pass/fail calibration result.
// The judge invocation itself (a bounded subagent or a one-time codex capture) lives
// outside this module; its captured output is replayed deterministically here.

import { readFileSync, readdirSync } from "node:fs";
import { basename, join } from "node:path";

export const JUDGE_RUBRIC_SCHEMA = {
	type: "object",
	additionalProperties: false,
	required: ["caseId", "verdict", "facets", "confidence", "evidence"],
	properties: {
		caseId: { type: "string" },
		verdict: { type: "string", enum: ["sound", "unsound"] },
		facets: {
			type: "object",
			additionalProperties: false,
			required: ["cites_governing_rule", "rule_application_correct", "no_unsupported_claim"],
			properties: {
				// Did the reasoning identify the rule that actually governs this routing decision?
				cites_governing_rule: { type: "boolean" },
				// Is that rule applied correctly to the route the agent took?
				rule_application_correct: { type: "boolean" },
				// Does the reason avoid claims that contradict the surface or invent context?
				no_unsupported_claim: { type: "boolean" },
			},
		},
		confidence: { type: "number", minimum: 0, maximum: 1 },
		evidence: { type: "string" },
	},
};

// Fields that would leak the answer to a blind judge. Never shown in the prompt.
const LEAKY_CASE_FIELDS = new Set(["expectedVerdict", "rationale", "kind", "boundary"]);

// Multi-claim registry: every reasoning-soundness-calibration*.json in a directory is one
// claim. Its captured judge verdicts live in the sibling file with "calibration" swapped for
// "judge-verdicts". Adding a claim = adding those two files; the gate picks it up automatically.
export function listCalibrationFixtures(dir) {
	return readdirSync(dir)
		.filter((f) => /^reasoning-soundness-calibration.*\.json$/.test(f))
		.sort()
		.map((f) => ({
			file: f,
			calibrationPath: join(dir, f),
			verdictsPath: join(dir, f.replace("calibration", "judge-verdicts")),
		}));
}

export function claimIdFromCalibrationFile(file) {
	return basename(file).replace(/^reasoning-soundness-calibration\.?/, "").replace(/\.json$/, "") || "default";
}

export function loadCalibration(path) {
	const parsed = JSON.parse(readFileSync(path, "utf-8"));
	if (parsed.schemaVersion !== "cautilus.reasoning_soundness_calibration.v1") {
		throw new Error(`unexpected calibration schemaVersion: ${parsed.schemaVersion}`);
	}
	if (!Array.isArray(parsed.cases) || parsed.cases.length === 0) {
		throw new Error("calibration.cases must be a non-empty array");
	}
	return parsed;
}

// Build the blind prompt for one case: governing rules + the observed routing reasoning,
// WITHOUT the expected verdict / rationale / case kind.
export function buildJudgePrompt(governingRules, caseEntry) {
	const visible = {};
	for (const [key, value] of Object.entries(caseEntry)) {
		if (!LEAKY_CASE_FIELDS.has(key)) {
			visible[key] = value;
		}
	}
	const rulesBlock = Object.entries(governingRules)
		.map(([id, text]) => `- ${id}: ${text}`)
		.join("\n");
	return [
		"You are an independent evaluator of an AI agent's ROUTING REASONING.",
		"You are NOT the agent and you do not re-decide the route. You judge ONLY whether the agent's stated reason for its first routing decision is SOUND against the governing rules below.",
		"",
		"Governing rules (the only rules you judge against — do not invent others):",
		rulesBlock,
		"",
		"The agent's observed first-routing decision and its stated reason:",
		JSON.stringify(visible, null, 2),
		"",
		"Definitions:",
		"- sound = the stated reason correctly identifies and applies the governing rule(s) for the route taken.",
		"- unsound = the reason contradicts a governing rule, mis-applies it, or invents context/claims the surface does not support — even if the route itself happens to be correct.",
		"- Deferring a downstream choice that the rules say to make AFTER a step is not by itself unsound.",
		"",
		"Return ONLY a single JSON object matching this shape (no prose, no code fence):",
		JSON.stringify({
			caseId: visible.id,
			verdict: "sound | unsound",
			facets: { cites_governing_rule: "boolean", rule_application_correct: "boolean", no_unsupported_claim: "boolean" },
			confidence: "0.0 to 1.0",
			evidence: "short quote or pointer your verdict rests on",
		}),
	].join("\n");
}

// Deterministic comparator. Pure: given the calibration and the captured judge verdicts,
// decide whether the judge passed its unit test.
export function compareVerdicts(calibration, judgeVerdicts) {
	const byCaseId = new Map();
	for (const v of judgeVerdicts) {
		byCaseId.set(v.caseId, v);
	}
	const byCase = [];
	const mismatches = [];
	const missing = [];
	const verdictsSeen = new Set();
	let matched = 0;
	for (const c of calibration.cases) {
		const judged = byCaseId.get(c.id);
		if (!judged) {
			missing.push(c.id);
			byCase.push({ caseId: c.id, expected: c.expectedVerdict, got: null, matched: false, confidence: null });
			continue;
		}
		verdictsSeen.add(judged.verdict);
		const isMatch = judged.verdict === c.expectedVerdict;
		if (isMatch) {
			matched += 1;
		} else {
			mismatches.push({ caseId: c.id, expected: c.expectedVerdict, got: judged.verdict });
		}
		byCase.push({
			caseId: c.id,
			expected: c.expectedVerdict,
			got: judged.verdict,
			matched: isMatch,
			boundary: Boolean(c.boundary),
			confidence: typeof judged.confidence === "number" ? judged.confidence : null,
		});
	}

	// Rubber-stamp guard: if the set contains at least one known-unsound case and the judge
	// never once emitted "unsound", it is suspected of stamping "sound" on everything.
	const hasKnownUnsound = calibration.cases.some((c) => c.expectedVerdict === "unsound");
	const rubberStampSuspected = hasKnownUnsound && !verdictsSeen.has("unsound");

	const confidences = byCase.map((b) => b.confidence).filter((x) => typeof x === "number");
	const confidenceSpread = confidences.length
		? {
				min: Math.min(...confidences),
				max: Math.max(...confidences),
				avg: confidences.reduce((a, b) => a + b, 0) / confidences.length,
			}
		: null;

	const total = calibration.cases.length;
	const passed = matched === total && missing.length === 0 && !rubberStampSuspected;

	return {
		passed,
		total,
		matched,
		missing,
		mismatches,
		rubberStampSuspected,
		confidenceSpread,
		byCase,
	};
}
