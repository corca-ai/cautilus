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

// Fields that would leak the answer (or bias the judge) and are never shown in the prompt.
const LEAKY_CASE_FIELDS = new Set(["expectedVerdict", "rationale", "kind", "boundary", "tier", "promptLabel", "provenance", "discriminator", "lengthChars"]);

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

// Defaults make a routing-claim judge; a calibration fixture can override brief, facets, and
// the verdict definition to judge a different KIND of claim (e.g. conversation goal achievement).
const DEFAULT_JUDGE_BRIEF =
	"You are an independent evaluator of an AI agent's ROUTING REASONING. You are NOT the agent and you do not re-decide the route. You judge ONLY whether the agent's stated reason for its first routing decision is SOUND against the governing rules below.";
const DEFAULT_JUDGE_FACETS = [
	{ key: "cites_governing_rule", description: "did the reasoning identify the rule that actually governs this routing decision?" },
	{ key: "rule_application_correct", description: "is the rule applied correctly to the route taken?" },
	{ key: "no_unsupported_claim", description: "does the reason avoid claims that contradict the surface or invent context?" },
];
const DEFAULT_VERDICT_DEFINITION = [
	"- sound = the stated reason correctly identifies and applies the governing rule(s) for the route taken.",
	"- unsound = the reason contradicts a governing rule, mis-applies it, or invents context/claims the surface does not support — even if the route itself happens to be correct.",
	"- Deferring a downstream choice that the rules say to make AFTER a step is not by itself unsound.",
];

// Build the blind prompt for one case: governing rules/criteria + the item under evaluation,
// WITHOUT the expected verdict / rationale / case kind. The claim (brief, facets, verdict
// definition) is read from the calibration so one harness judges many KINDS of claim.
export function buildJudgePrompt(calibration, caseEntry) {
	const governingRules = (calibration && calibration.governingRules) || {};
	const brief = (calibration && calibration.judgeBrief) || DEFAULT_JUDGE_BRIEF;
	const facets = (calibration && calibration.judgeFacets) || DEFAULT_JUDGE_FACETS;
	const verdictDefinition = (calibration && calibration.verdictDefinition) || DEFAULT_VERDICT_DEFINITION;

	const visible = {};
	for (const [key, value] of Object.entries(caseEntry)) {
		if (!LEAKY_CASE_FIELDS.has(key)) {
			visible[key] = value;
		}
	}
	const rulesBlock = Object.entries(governingRules)
		.map(([id, text]) => `- ${id}: ${text}`)
		.join("\n");
	const facetDescBlock = facets.map((f) => `- ${f.key}: ${f.description}`).join("\n");
	const facetShape = {};
	for (const f of facets) {
		facetShape[f.key] = "boolean";
	}
	return [
		brief,
		"",
		"Governing rules / criteria (the only basis you judge against — do not invent others):",
		rulesBlock,
		"",
		"What to assess (facets):",
		facetDescBlock,
		"",
		"The item under evaluation:",
		JSON.stringify(visible, null, 2),
		"",
		"Definitions:",
		...verdictDefinition,
		"",
		"Return ONLY a single JSON object matching this shape (no prose, no code fence):",
		JSON.stringify({
			caseId: visible.id,
			verdict: "sound | unsound",
			facets: facetShape,
			confidence: "0.0 to 1.0",
			evidence: "short quote or pointer your verdict rests on",
		}),
	].join("\n");
}

// Deterministic format-facet checkers (the CODE half of the harmony).
// These are the mechanical, reproducible facets a claim can hand to code instead of the judge.
// Each is a pure (caseEntry) -> boolean; a calibration fixture opts in via its `codeFacets` list.
// Routing facet "the agent emitted the find-skills token" would be another such checker; this
// first batch covers the chat conversation-goal format constraints.
const SUMMARY_LINE_RE = /\n\s*요약\s*[:：]/;
export const FORMAT_FACET_CHECKERS = {
	// The response is predominantly Korean (Hangul present and not outweighed by Latin letters,
	// which only appear in parenthetical loan terms like "regression test").
	language_korean(c) {
		const r = c.assistantResponse || "";
		const hangul = (r.match(/[가-힣]/g) || []).length;
		const latin = (r.match(/[A-Za-z]/g) || []).length;
		return hangul > 0 && hangul >= latin;
	},
	// No markdown bullet or numbered list markers begin any line.
	no_bullet_or_numbered_lists(c) {
		const r = c.assistantResponse || "";
		return !r.split(/\n/).some((line) => /^\s*([-*+]\s|\d+[.)]\s)/.test(line));
	},
	// A required summary line starting with "요약:".
	"has_요약_line"(c) {
		return /^\s*요약\s*[:：]/m.test(c.assistantResponse || "");
	},
	// The ANSWER BODY (everything before the 요약 line) is a single paragraph block.
	// Per the maintainer-agreed structure rule, the 요약 line is a separate required element and
	// is exempt from the one-paragraph count — so an answer paragraph followed by a 요약 line is compliant.
	answer_body_is_one_paragraph(c) {
		const r = c.assistantResponse || "";
		const idx = r.search(SUMMARY_LINE_RE);
		const body = (idx >= 0 ? r.slice(0, idx) : r).trim();
		const blocks = body
			.split(/\n\s*\n/)
			.map((s) => s.trim())
			.filter(Boolean);
		return blocks.length === 1;
	},
	// If the user stated a "<n>자 이내" total limit, the full response length must honor it.
	// No stated limit means this is not a constraint for the turn (passes).
	within_stated_char_limit(c) {
		const stated = (c.userTurn || "").match(/(\d+)\s*자\s*이내/);
		if (!stated) return true;
		return (c.assistantResponse || "").length <= Number(stated[1]);
	},
};

// Compute the deterministic format facets a calibration opts into. Pure and reproducible:
// this is CODE's contribution to a composite verdict, never something the judge is asked.
export function computeCodeFacets(calibration, caseEntry) {
	const keys = (calibration && calibration.codeFacets) || [];
	const out = {};
	for (const key of keys) {
		const checker = FORMAT_FACET_CHECKERS[key];
		if (!checker) {
			throw new Error(`unknown code facet '${key}' (no deterministic checker registered)`);
		}
		out[key] = checker(caseEntry, calibration);
	}
	return out;
}

// Resolve one case's composite verdict from the judge's output, routing each half to its tool.
// Direct (routing) claims return the judge's verdict unchanged; decomposed claims AND the
// code-computed format facets with the judge's semantic verdict.
function resolveCaseVerdict(calibration, caseEntry, judged, decomposed) {
	if (!decomposed) {
		return { got: judged.verdict, codeFacets: null };
	}
	const codeFacets = computeCodeFacets(calibration, caseEntry);
	const codeAllPass = Object.values(codeFacets).every(Boolean);
	const judgeSound = judged.verdict === "sound";
	return { got: codeAllPass && judgeSound ? "sound" : "unsound", codeFacets };
}

// Build the per-case result row plus the bookkeeping flags the comparator accumulates.
// A missing judge verdict yields a null-verdict row flagged `missing`.
function buildCaseRow(calibration, caseEntry, judged, decomposed) {
	if (!judged) {
		return {
			missing: true,
			entry: { caseId: caseEntry.id, expected: caseEntry.expectedVerdict, got: null, matched: false, confidence: null },
		};
	}
	const { got, codeFacets } = resolveCaseVerdict(calibration, caseEntry, judged, decomposed);
	const matched = got === caseEntry.expectedVerdict;
	return {
		missing: false,
		got,
		matched,
		entry: {
			caseId: caseEntry.id,
			expected: caseEntry.expectedVerdict,
			got,
			matched,
			boundary: Boolean(caseEntry.boundary),
			confidence: typeof judged.confidence === "number" ? judged.confidence : null,
			...(decomposed ? { codeFacets, judgeVerdict: judged.verdict } : {}),
		},
	};
}

// Deterministic comparator. Pure: given the calibration and the captured judge verdicts,
// decide whether the judge passed its unit test.
//
// Two modes, selected by whether the calibration declares `codeFacets`:
//   - direct (routing claims): the composite verdict IS the judge's verdict.
//   - composite (decomposed claims): code computes the deterministic format facets and the judge
//     supplies only the semantic verdict; the composite verdict ANDs them. This is the
//     code+intelligence harmony — each facet on the tool that is reliable for it.
export function compareVerdicts(calibration, judgeVerdicts) {
	const decomposed = Array.isArray(calibration.codeFacets) && calibration.codeFacets.length > 0;
	const byCaseId = new Map();
	for (const v of judgeVerdicts) {
		byCaseId.set(v.caseId, v);
	}
	const byCase = [];
	const mismatches = [];
	const missing = [];
	const gotVerdictsSeen = new Set();
	let matched = 0;
	for (const c of calibration.cases) {
		const row = buildCaseRow(calibration, c, byCaseId.get(c.id), decomposed);
		byCase.push(row.entry);
		if (row.missing) {
			missing.push(c.id);
			continue;
		}
		gotVerdictsSeen.add(row.got);
		if (row.matched) {
			matched += 1;
		} else {
			mismatches.push({ caseId: c.id, expected: c.expectedVerdict, got: row.got });
		}
	}

	// Rubber-stamp guard: if the set contains at least one known-unsound case and the GATE never
	// once produced an "unsound" composite verdict, it is suspected of stamping "sound" on everything.
	// Watching the composite (not the bare judge verdict) keeps routing behavior identical — there
	// the composite IS the judge verdict — while staying correct under decomposition, where a real
	// negative can come from a code facet (e.g. an over-length response) rather than the judge.
	const hasKnownUnsound = calibration.cases.some((c) => c.expectedVerdict === "unsound");
	const rubberStampSuspected = hasKnownUnsound && !gotVerdictsSeen.has("unsound");

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
