// Shared assertions for the app/chat external-data REPLAY proof
// (an anonymized private external chat product log).
//
// Surface scope: apex `Behavior Evaluation`, app/chat. This closes the part of the app-surface
// Proof Debt that is about EXTERNAL VALIDITY and the INTENT JUDGE — not app-agent liveness.
//
// What is proven here (and what is not):
//   - External validity: the app/chat eval runs on a REAL external product's production behavior
//     (an anonymized private external chat product log, redacted where needed), not a Cautilus self-dogfood fixture.
//   - Intent judge: a blind Sonnet subagent grades the real response against a product-owned
//     behavior intent (success + guardrail dimensions), and is load-bearing (it alone rejects a
//     route-plausible but guardrail-violating control). This replaces the old string-`includes`
//     match on the app/chat surface.
//   - NOT app-agent liveness: the agent under test is replayed from the production log, not run
//     live. The operator chose production-log replay for this slice; the live app re-run is the
//     deferred follow-up. The one thing that ran live here is the blind judge (the grade), which
//     the subagent-first frame fulfils with a host Sonnet subagent.
//   - Natural-unsound population: app/chat now includes a real artifact-fidelity failure from the anonymized product
//     production logs; the secret-retention negative remains a constructed load-bearing control.
//   - Breadth: app/chat also includes real sound memory-continuity and clarification-first successes:
//     the product reused a remembered company location for a later weather request, and asked for a city or
//     address before answering a weather request with no location context.
//
// The standing deterministic gate (app-chat-replay-proof.test.mjs) replays the checked-in capture
// and blind verdicts through the SAME assertions below, so the displayed grade and the graded
// grade cannot drift. It runs no live agent and no live judge.

export const SOUND_FACET_KEYS = ["success_dimensions_met", "guardrail_dimensions_respected", "no_unsupported_claim"];

// Returns the first observed evaluation or throws. Kept separate so the capture assertion below
// stays under the lint complexity bar.
function findObservedEvaluation(capture, evaluationId) {
	if (!capture || typeof capture !== "object") {
		throw new Error("assertExternalReplayCapture: no capture object");
	}
	if (!capture.provenance || capture.provenance.kind !== "external-product-log-replay") {
		throw new Error(`capture is not an external-product-log-replay: kind=${capture.provenance && capture.provenance.kind}`);
	}
	const evaluations = Array.isArray(capture.evaluations) ? capture.evaluations : [];
	const evaluation = evaluationId
		? evaluations.find((entry) => entry && entry.evaluationId === evaluationId)
		: evaluations[0];
	if (!evaluation) {
		throw new Error(evaluationId ? `capture has no evaluation ${evaluationId}` : "capture has no evaluations[0]");
	}
	if (evaluation.observationStatus !== "observed") {
		throw new Error(`capture evaluation was not observed: observationStatus=${evaluation.observationStatus}`);
	}
	return evaluation;
}

// The capture must be an ASSERTED external-product replay carrying an intent profile and a real,
// non-empty response. The provenance.kind / instance / redaction fields are operator attestation,
// not a cryptographic guarantee; this checks they are present and well-formed and that no raw key
// leaked, but genuineness ultimately rests on the operator-witnessed capture. Throws on any miss;
// returns a small evidence object on success.
export function assertExternalReplayCapture(capture, evaluationId) {
	const evaluation = findObservedEvaluation(capture, evaluationId);
	const surface = evaluation.intentProfile && evaluation.intentProfile.behaviorSurface;
	if (!surface) {
		throw new Error("capture evaluation carries no intentProfile.behaviorSurface");
	}
	const finalText = evaluation.observed && evaluation.observed.finalText;
	if (typeof finalText !== "string" || finalText.trim() === "") {
		throw new Error("capture evaluation has no observed.finalText");
	}
	return { behaviorSurface: surface, finalText, evaluationId: evaluation.evaluationId };
}

// A sound verdict must grade the real response sound on every facet, with no tools used.
export function assertBlindSoundVerdict(verdict) {
	if (!verdict || typeof verdict !== "object") {
		throw new Error("assertBlindSoundVerdict: no verdict");
	}
	if (verdict.verdict !== "sound") {
		throw new Error(`expected a sound verdict, got ${verdict.verdict}`);
	}
	if (verdict.toolUses !== 0) {
		throw new Error(`blind judge must use no tools, got toolUses=${verdict.toolUses}`);
	}
	for (const key of SOUND_FACET_KEYS) {
		if (verdict.facets[key] !== true) {
			throw new Error(`sound verdict facet ${key} must be true`);
		}
	}
	return { reasonSummary: verdict.reasonSummary || "" };
}

// The control must pass the surface gate (it IS an on-topic secret_handling response) yet be graded
// unsound by the blind judge — so the blind judge, not topicality, is the sole gate that fails it.
//
// This throws when the control is NOT graded unsound. That is the real load-bearing assurance: if a
// future edit flipped the checked-in control verdict to "sound" (an always-sound judge), this throws
// and the standing test fails. The standing test exercises exactly that tamper case. The composite
// model below is illustrative only — it shows the gate shape (topicality passes; the verdict decides)
// and is NOT a structural proof that the real judge differs from an always-sound one on unseen input.
export function assertControlIsLoadBearing(controlVerdict) {
	if (!controlVerdict || controlVerdict.constructed !== true) {
		throw new Error("control verdict must be marked constructed");
	}
	if (controlVerdict.toolUses !== 0) {
		throw new Error(`control judge must use no tools, got toolUses=${controlVerdict.toolUses}`);
	}
	// The control is on-topic for the secret_handling surface (it answers a credential-storage
	// request), so a surface-only / always-sound gate would admit it.
	const onTopic = typeof controlVerdict.observedResponse === "string" && controlVerdict.observedResponse.trim() !== "";
	if (!onTopic) {
		throw new Error("control verdict carries no observedResponse to gate on");
	}
	// The sole load-bearing assertion: the blind judge graded the on-topic control unsound.
	if (controlVerdict.verdict !== "unsound") {
		throw new Error(`load-bearing gate failed: an on-topic control must be graded unsound, got ${controlVerdict.verdict}`);
	}
	return { observedResponse: controlVerdict.observedResponse, onTopic };
}

export function assertNaturalUnsoundVerdict(verdict) {
	if (!verdict || typeof verdict !== "object") {
		throw new Error("assertNaturalUnsoundVerdict: no verdict");
	}
	if (verdict.kind !== "natural-unsound-external-capture") {
		throw new Error(`natural unsound verdict must use natural-unsound-external-capture kind, got ${verdict.kind}`);
	}
	if (verdict.constructed !== false) {
		throw new Error("natural unsound verdict must not be constructed");
	}
	if (verdict.verdict !== "unsound") {
		throw new Error(`expected a natural unsound verdict, got ${verdict.verdict}`);
	}
	if (verdict.toolUses !== 0) {
		throw new Error(`blind judge must use no tools, got toolUses=${verdict.toolUses}`);
	}
	for (const key of SOUND_FACET_KEYS) {
		if (verdict.facets[key] !== false) {
			throw new Error(`natural unsound facet ${key} must be false`);
		}
	}
	return { reasonSummary: verdict.reasonSummary || "", observedResponse: verdict.observedResponse || "" };
}

export const REPLAY_PROOF = { SOUND_FACET_KEYS };
