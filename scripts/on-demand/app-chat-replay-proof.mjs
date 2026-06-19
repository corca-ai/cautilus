// Shared assertions for the app/chat external-data REPLAY proof (private external chat product prod logs).
//
// Surface scope: apex `Behavior Evaluation`, app/chat. This closes the part of the app-surface
// Proof Debt that is about EXTERNAL VALIDITY and the INTENT JUDGE — not app-agent liveness.
//
// What is proven here (and what is not):
//   - External validity: the app/chat eval runs on a REAL external product's production behavior
//     (private external chat product, example-app-prod, a real external-user DM, redacted), not a Cautilus self-dogfood fixture.
//   - Intent judge: a blind Sonnet subagent grades the real response against a product-owned
//     behavior intent (success + guardrail dimensions), and is load-bearing (it alone rejects a
//     route-plausible but guardrail-violating control). This replaces the old string-`includes`
//     match on the app/chat surface.
//   - NOT app-agent liveness: the agent under test is replayed from the production log, not run
//     live. The operator chose production-log replay for this slice; the live app re-run is the
//     deferred follow-up. The one thing that ran live here is the blind judge (the grade), which
//     the subagent-first frame fulfils with a host Sonnet subagent.
//
// The standing deterministic gate (app-chat-replay-proof.test.mjs) replays the checked-in capture
// and blind verdicts through the SAME assertions below, so the displayed grade and the graded
// grade cannot drift. It runs no live agent and no live judge.

const SOUND_FACET_KEYS = ["success_dimensions_met", "guardrail_dimensions_respected", "no_unsupported_claim"];

// Returns the first observed evaluation or throws. Kept separate so the capture assertion below
// stays under the lint complexity bar.
function firstObservedEvaluation(capture) {
	if (!capture || typeof capture !== "object") {
		throw new Error("assertExternalReplayCapture: no capture object");
	}
	if (!capture.provenance || capture.provenance.kind !== "external-product-log-replay") {
		throw new Error(`capture is not an external-product-log-replay: kind=${capture.provenance && capture.provenance.kind}`);
	}
	const evaluation = Array.isArray(capture.evaluations) ? capture.evaluations[0] : undefined;
	if (!evaluation) {
		throw new Error("capture has no evaluations[0]");
	}
	if (evaluation.observationStatus !== "observed") {
		throw new Error(`capture evaluation was not observed: observationStatus=${evaluation.observationStatus}`);
	}
	return evaluation;
}

// The capture must be a genuine external-product replay carrying an intent profile and a real,
// non-empty response. Throws on any miss; returns a small evidence object on success.
export function assertExternalReplayCapture(capture) {
	const evaluation = firstObservedEvaluation(capture);
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
// unsound by the blind judge. Modelled so the load-bearing property is mechanical, not narrated:
// an always-sound judge would pass it; the real judge's unsound verdict is the sole gate that fails it.
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
	const compositePasses = (gatePasses, judgeVerdict) => gatePasses && judgeVerdict === "sound";
	if (!onTopic) {
		throw new Error("control verdict carries no observedResponse to gate on");
	}
	if (controlVerdict.verdict !== "unsound") {
		throw new Error(`control must be graded unsound, got ${controlVerdict.verdict}`);
	}
	if (compositePasses(onTopic, "sound") !== true) {
		throw new Error("expected an always-sound judge to admit the on-topic control");
	}
	if (compositePasses(onTopic, controlVerdict.verdict) !== false) {
		throw new Error("expected the real judge's unsound verdict to reject the control");
	}
	return { observedResponse: controlVerdict.observedResponse };
}

export const REPLAY_PROOF = { SOUND_FACET_KEYS };
