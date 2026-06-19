// Shared assertions for the app/prompt intent-judge proof.
//
// Scope: this replays checked-in blind judge verdicts over the 2026-06-19 app/prompt
// backend probe. It proves the INTENT JUDGE boundary for the prompt responses and shows
// the current string-fragment matcher can reject a semantically sound response.
//
// It does not prove product-runner readiness. The observed responses still come from
// the fixture/Codex/Claude backend probe, and productProofReady remains false there.

export const APP_PROMPT_INTENT_FACETS = [
	"describes_cautilus_eval_behavior",
	"preserves_behavior_focus",
	"no_unsupported_or_harmful_claim",
];

export const APP_PROMPT_INTENT_CASE_IDS = ["codex-live", "claude-live", "control-generic"];

function assertUniqueCaseSet(entries, field) {
	if (!Array.isArray(entries)) {
		throw new Error(`${field} must be an array`);
	}
	const caseIds = entries.map((entry) => entry && entry.caseId).sort();
	const expected = [...APP_PROMPT_INTENT_CASE_IDS].sort();
	if (caseIds.length !== expected.length || caseIds.some((caseId, index) => caseId !== expected[index])) {
		throw new Error(`${field} caseId set mismatch: expected ${expected.join(",")}, got ${caseIds.join(",")}`);
	}
	if (new Set(caseIds).size !== caseIds.length) {
		throw new Error(`${field} must not contain duplicate caseId entries`);
	}
}

function assertFacetShape(verdict, expectedValue) {
	for (const key of APP_PROMPT_INTENT_FACETS) {
		if (verdict.facets?.[key] !== expectedValue) {
			throw new Error(`verdict ${verdict.caseId} facet ${key} must be ${expectedValue}`);
		}
	}
}

function verdictByCase(entries) {
	return new Map(entries.map((entry) => [entry.caseId, entry]));
}

export function assertIntentJudgePacket(packet) {
	if (!packet || typeof packet !== "object") {
		throw new Error("intent judge packet must be an object");
	}
	if (packet.schemaVersion !== "cautilus.app_prompt_intent_judge.v1") {
		throw new Error(`unexpected intent judge schemaVersion: ${packet.schemaVersion}`);
	}
	if (packet.sourceProbe !== "fixtures/eval/app/prompt/backend-probe/app-prompt-backend-probe-capture.json") {
		throw new Error(`unexpected sourceProbe: ${packet.sourceProbe}`);
	}
	if (!Array.isArray(packet.verdicts) || packet.verdicts.length === 0) {
		throw new Error("intent judge packet must contain verdicts");
	}
	assertUniqueCaseSet(packet.verdicts, "packet.verdicts");
	if (!Array.isArray(packet.judgeRuns) || packet.judgeRuns.length !== 2) {
		throw new Error("intent judge packet must contain exactly two judgeRuns");
	}
	const aggregate = verdictByCase(packet.verdicts);
	for (const [index, run] of packet.judgeRuns.entries()) {
		if (run.toolUses !== 0) {
			throw new Error(`judgeRuns[${index}] must use no tools`);
		}
		assertUniqueCaseSet(run.verdicts, `judgeRuns[${index}].verdicts`);
		for (const verdict of run.verdicts) {
			const aggregateVerdict = aggregate.get(verdict.caseId);
			if (verdict.verdict !== aggregateVerdict.verdict) {
				throw new Error(`judgeRuns[${index}] verdict ${verdict.caseId} disagrees with aggregate`);
			}
			const expectedFacetValue = verdict.caseId === "control-generic" ? false : true;
			assertFacetShape(verdict, expectedFacetValue);
		}
	}
	return packet;
}

export function findVerdict(packet, caseId) {
	assertIntentJudgePacket(packet);
	const verdict = packet.verdicts.find((entry) => entry && entry.caseId === caseId);
	if (!verdict) {
		throw new Error(`missing intent judge verdict ${caseId}`);
	}
	return verdict;
}

export function assertIntentSoundVerdict(verdict) {
	if (!verdict || typeof verdict !== "object") {
		throw new Error("sound verdict must be an object");
	}
	if (verdict.verdict !== "sound") {
		throw new Error(`expected sound verdict, got ${verdict.verdict}`);
	}
	if (verdict.toolUses !== 0) {
		throw new Error(`blind judge must use no tools, got ${verdict.toolUses}`);
	}
	assertFacetShape(verdict, true);
	return verdict;
}

export function assertIntentControlIsLoadBearing(verdict) {
	if (!verdict || typeof verdict !== "object") {
		throw new Error("control verdict must be an object");
	}
	if (verdict.kind !== "judge-control-semantic") {
		throw new Error(`control verdict kind must be judge-control-semantic, got ${verdict.kind}`);
	}
	if (verdict.constructed !== true) {
		throw new Error("control verdict must be marked constructed");
	}
	if (verdict.toolUses !== 0) {
		throw new Error(`blind judge must use no tools, got ${verdict.toolUses}`);
	}
	if (typeof verdict.observedFinalText !== "string" || verdict.observedFinalText.trim() === "") {
		throw new Error("control verdict must carry observedFinalText");
	}
	if (verdict.verdict !== "unsound") {
		throw new Error(`load-bearing gate failed: semantic control must be unsound, got ${verdict.verdict}`);
	}
	assertFacetShape(verdict, false);
	return verdict;
}
