import { collectModeRunEntries } from "./optimize-search-mutation.mjs";

function collectFindingMessages(items, field = "message") {
	const source = Array.isArray(items) ? items : [];
	return source
		.map((item) => (field === "" ? item : item?.[field]))
		.filter((value) => typeof value === "string" && value.length > 0);
}

function collectCompareSignals(modeRuns) {
	const signals = [];
	for (const modeRun of modeRuns) {
		signals.push(...collectCompareArtifactSignals(modeRun?.scenarioResults?.compareArtifact));
	}
	return signals;
}

function collectCompareArtifactSignals(compareArtifact) {
	const signals = [];
	if (typeof compareArtifact?.summary === "string" && compareArtifact.summary.length > 0) {
		signals.push(compareArtifact.summary);
	}
	signals.push(...collectFindingMessages(compareArtifact?.regressed, "reason"));
	signals.push(...collectFindingMessages(compareArtifact?.noisy, "reason"));
	signals.push(...collectFindingMessages(compareArtifact?.reasons, ""));
	return signals;
}

function collectReviewSignals(input) {
	const reportFindings = collectFindingMessages(input.optimizeInput?.report?.humanReviewFindings);
	const variants = Array.isArray(input.optimizeInput?.reviewSummary?.variants)
		? input.optimizeInput.reviewSummary.variants
		: [];
	const variantFindings = variants.flatMap((variant) => collectFindingMessages(variant?.output?.findings));
	return [...reportFindings, ...variantFindings];
}

function collectHistorySignals(input) {
	const signals = [];
	for (const [scenarioId, stats] of Object.entries(input.optimizeInput?.scenarioHistory?.scenarioStats || {})) {
		const latest = Array.isArray(stats?.recentTrainResults) ? stats.recentTrainResults[0] : null;
		if (!latest) {
			continue;
		}
		if (latest.status !== "passed" || latest.overallScore !== 100 || latest.passRate !== 1) {
			signals.push(`${scenarioId} remains unstable in recent train history`);
		}
	}
	return signals;
}

export function collectFeedbackSignals(input) {
	const modeRuns = Array.isArray(input.optimizeInput?.report?.modeRuns) ? input.optimizeInput.report.modeRuns : [];
	return [
		...collectCompareSignals(modeRuns),
		...collectCompareArtifactSignals(input.heldOutResults?.compareArtifact),
		...collectReviewSignals(input),
		...collectHistorySignals(input),
	];
}

function inferScenarioScore(result) {
	if (typeof result?.overallScore === "number") {
		return result.overallScore;
	}
	if (typeof result?.passRate === "number") {
		return result.passRate * 100;
	}
	if (typeof result?.status === "string") {
		return result.status === "passed" ? 100 : 0;
	}
	return null;
}

function toHeldOutEntry(result, mode, candidateId) {
	return {
		candidateId,
		scenarioId: result.scenarioId,
		mode,
		score: inferScenarioScore(result),
		status: result.status || null,
		telemetry: result.telemetry || {},
	};
}

function collectHeldOutEntriesFromResults(resultsPacket, candidateId) {
	const results = Array.isArray(resultsPacket?.results) ? resultsPacket.results : [];
	const mode = resultsPacket?.mode || "held_out";
	return results
		.filter((result) => typeof result?.scenarioId === "string" && result.scenarioId.length > 0)
		.map((result) => toHeldOutEntry(result, mode, candidateId));
}

export function collectSeedHeldOutEntries(packet) {
	if (packet?.heldOutResults?.results) {
		return collectHeldOutEntriesFromResults(packet.heldOutResults, "seed");
	}
	const modeRuns = Array.isArray(packet?.optimizeInput?.report?.modeRuns) ? packet.optimizeInput.report.modeRuns : [];
	return modeRuns.flatMap((modeRun) => collectModeRunEntries(modeRun, "seed"));
}
