import {
	canRunMutation,
	collectTargetSnapshot,
	evaluateMutationCandidates,
	summarizeCandidateTelemetry,
} from "./optimize-search-mutation.mjs";
import { evaluateCandidateCheckpoints, runReviewCheckpoint } from "./optimize-search-checkpoints.mjs";
import { buildCheckpointFeedback } from "./optimize-search-feedback.mjs";
import { candidateCanSeedMutation, prioritizeMutationParents } from "./optimize-search-pruning.mjs";
import { collectFeedbackSignals, collectSeedHeldOutEntries } from "./optimize-search-readiness.mjs";
import { experimentContext, telemetryCompleteness } from "./optimize-search-result-context.mjs";
import { candidateConstraintRejectionReasons } from "./optimize-search-selection.mjs";
import { dirname } from "node:path";

function buildBlockedResult(input, inputFile, reasons, missingEvidence, schemaVersion, now = new Date()) {
	return {
		schemaVersion,
		generatedAt: now.toISOString(),
		status: "blocked",
		inputFile,
		repoRoot: input.repoRoot,
		optimizeInputFile: input.optimizeInputFile,
		searchConfig: input.searchConfig,
		searchConfigSources: input.searchConfigSources || {},
		experimentContext: experimentContext(input),
		telemetryCompleteness: telemetryCompleteness([], []),
		candidateRegistry: [],
		generationSummaries: [],
		heldOutEvaluationMatrix: [],
		pareto: {
			frontierCandidateIds: [],
			perScenarioBestCandidateIds: [],
		},
		checkpointOutcomes: {
			review: [],
			fullGate: [],
		},
		searchTelemetry: {
			candidateCount: 0,
			generationCount: 0,
			mutationInvocationCount: 0,
			heldOutEvaluationCount: 0,
			reviewCheckpointCount: 0,
			stopReason: "blocked",
		},
		proposalBridge: {
			optimizeInputFile: input.optimizeInputFile,
		},
		reasonCodes: reasons,
		missingEvidence,
		suggestedNextSteps: [
			"run held_out evaluation with scenario results enabled",
			"build a report packet with compare artifacts",
			"collect at least one review summary for the target behavior",
		],
	};
}

function buildSeedCandidate(packet) {
	const heldOutEntries = collectSeedHeldOutEntries(packet);
	return { id: "seed", generationIndex: 0, parentCandidateIds: [], origin: "seed", targetFile: packet.targetFile, targetSnapshot: packet.seedCandidate?.targetSnapshot || collectTargetSnapshot(packet.targetFile?.path), mutationRationale: "Use the current target prompt file as the seed candidate.", telemetry: summarizeCandidateTelemetry(heldOutEntries) };
}

function scenarioIdsForPacket(packet, matrix) {
	const explicit = Array.isArray(packet.scenarioSets?.heldOutScenarioSet) ? packet.scenarioSets.heldOutScenarioSet : [];
	return explicit.length > 0 ? explicit : [...new Set(matrix.map((entry) => entry.scenarioId))];
}

function scoreForCandidate(matrix, candidateId, scenarioId) {
	const match = matrix.find((entry) => entry.candidateId === candidateId && entry.scenarioId === scenarioId);
	return typeof match?.score === "number" ? match.score : Number.NEGATIVE_INFINITY;
}

function candidateDominates(matrix, leftId, rightId, scenarioIds) {
	let strictlyBetter = false;
	for (const scenarioId of scenarioIds) {
		const leftScore = scoreForCandidate(matrix, leftId, scenarioId);
		const rightScore = scoreForCandidate(matrix, rightId, scenarioId);
		if (leftScore < rightScore) {
			return false;
		}
		if (leftScore > rightScore) {
			strictlyBetter = true;
		}
	}
	return strictlyBetter;
}

function frontierCandidateIds(matrix, candidateIds, scenarioIds) {
	return candidateIds.filter((candidateId) =>
		!candidateIds.some((otherId) => otherId !== candidateId && candidateDominates(matrix, otherId, candidateId, scenarioIds))
	);
}

function rankCandidateIds(candidateIds, matrix, candidates, scenarioIds) {
	const telemetryById = new Map(candidates.map((candidate) => [candidate.id, candidate.telemetry || {}]));
	return [...candidateIds].sort((left, right) => {
		const scoreDelta = averageHeldOutScore(matrix, right, scenarioIds) - averageHeldOutScore(matrix, left, scenarioIds);
		if (scoreDelta !== 0) {
			return scoreDelta;
		}
		const leftTelemetry = telemetryById.get(left) || {};
		const rightTelemetry = telemetryById.get(right) || {};
		const costDelta = numericTelemetry(leftTelemetry.totalCostUsd) - numericTelemetry(rightTelemetry.totalCostUsd);
		if (costDelta !== 0) {
			return costDelta;
		}
		const durationDelta = numericTelemetry(leftTelemetry.totalDurationMs) - numericTelemetry(rightTelemetry.totalDurationMs);
		if (durationDelta !== 0) {
			return durationDelta;
		}
		return left.localeCompare(right);
	});
}

function perScenarioBestCandidateIds(matrix, scenarioIds, candidateIds) {
	return scenarioIds.map((scenarioId) => {
		let bestScore = Number.NEGATIVE_INFINITY;
		let bestIds = [];
		for (const candidateId of candidateIds) {
			const score = scoreForCandidate(matrix, candidateId, scenarioId);
			if (score > bestScore) {
				bestScore = score;
				bestIds = [candidateId];
				continue;
			}
			if (score === bestScore) {
				bestIds.push(candidateId);
			}
		}
		return { scenarioId, candidateIds: bestIds };
	});
}

function averageHeldOutScore(matrix, candidateId, scenarioIds) { let total = 0; for (const scenarioId of scenarioIds) total += scoreForCandidate(matrix, candidateId, scenarioId); return total / Math.max(1, scenarioIds.length); }
function numericTelemetry(value) { return typeof value === "number" ? value : Number.POSITIVE_INFINITY; }

function candidateRegistry(candidates) {
	return candidates.map((candidate) => ({
		id: candidate.id,
		generationIndex: candidate.generationIndex,
		parentCandidateIds: candidate.parentCandidateIds,
		origin: candidate.origin,
		targetFile: candidate.targetFile,
		targetSnapshot: candidate.targetSnapshot,
		mutationRationale: candidate.mutationRationale,
		telemetry: candidate.telemetry || {},
		...(candidate.expectedImprovements ? { expectedImprovements: candidate.expectedImprovements } : {}),
		...(candidate.preservedStrengths ? { preservedStrengths: candidate.preservedStrengths } : {}),
		...(candidate.riskNotes ? { riskNotes: candidate.riskNotes } : {}),
		...(candidate.checkpointFeedback ? { checkpointFeedback: candidate.checkpointFeedback } : {}),
		...(candidate.artifacts ? { artifacts: candidate.artifacts } : {}),
		...(candidate.evaluationArtifacts ? { evaluationArtifacts: candidate.evaluationArtifacts } : {}),
		...(candidate.evaluationError ? { evaluationError: candidate.evaluationError } : {}),
	}));
}

function createCheckpointLedger() { return { review: [], fullGate: [] }; }
function checkpointKey(outcome) { return `${outcome?.type || "unknown"}:${outcome?.candidateId || "unknown"}`; }

function recordCheckpointOutcome(collection, outcome) {
	if (!outcome || outcome.status === "skipped") {
		return;
	}
	const key = checkpointKey(outcome);
	if (collection.some((item) => checkpointKey(item) === key)) {
		return;
	}
	collection.push(outcome);
}

function shouldReviewFrontierPromotions(packet) { return packet.searchConfig?.reviewCheckpointPolicy === "frontier_promotions"; } function candidatePassedPromotionReview(candidate) { return candidate?.promotionReviewOutcome?.admissible !== false; }

function recordFrontierPromotionReviews(packet, artifactRoot, candidates, scenarioIds, checkpointLedger, env) {
	if (!shouldReviewFrontierPromotions(packet)) {
		return;
	}
	const matrix = candidates.flatMap((candidate) => candidate.heldOutEntries || []);
	const frontierIds = frontierCandidateIds(matrix, candidates.map((candidate) => candidate.id), scenarioIds);
	for (const candidateId of frontierIds) {
		const candidate = candidates.find((item) => item.id === candidateId);
		if (!candidate || candidate.promotionReviewOutcome) {
			continue;
		}
		const outcome = runReviewCheckpoint(packet, artifactRoot, candidate, env);
		outcome.reviewedAtGeneration = candidate.generationIndex;
		candidate.promotionReviewOutcome = outcome;
		if (!outcome.admissible) {
			candidate.checkpointFeedback = buildCheckpointFeedback(packet, outcome);
		}
		recordCheckpointOutcome(checkpointLedger.review, outcome);
	}
}

function countExecutedCheckpoints(items) {
	return items.filter((item) => item?.status && item.status !== "skipped").length;
}

function selectionContext(packet, candidates) {
	const matrix = candidates.flatMap((candidate) => candidate.heldOutEntries || []);
	const scenarioIds = scenarioIdsForPacket(packet, matrix);
	const candidateIds = candidates.map((candidate) => candidate.id);
	const frontierIds = frontierCandidateIds(matrix, candidateIds, scenarioIds);
	const rankedFrontierIds = rankCandidateIds(frontierIds, matrix, candidates, scenarioIds);
	return {
		matrix,
		scenarioIds,
		candidateIds,
		frontierIds,
		rankedFrontierIds,
	};
}

function selectionOutcomeFor(packet, artifactRoot, candidates, rankedFrontierIds, env, checkpointLedger) {
	const checkpointOutcomes = {
		review: [...checkpointLedger.review],
		fullGate: [...checkpointLedger.fullGate],
	};
	const rejectedFinalistCandidateIds = [];
	const selectionConstraintIneligibleCandidateIds = [];
	const rejectionReasons = {};
	for (const candidateId of rankedFrontierIds) {
		const candidate = candidates.find((item) => item.id === candidateId);
		if (!candidate) {
			continue;
		}
		const constraintRejectionReasons = candidateConstraintRejectionReasons(packet, candidate);
		if (constraintRejectionReasons.length > 0) {
			rejectedFinalistCandidateIds.push(candidateId);
			selectionConstraintIneligibleCandidateIds.push(candidateId);
			rejectionReasons[candidateId] = constraintRejectionReasons;
			continue;
		}
		const checkpointOutcome = evaluateCandidateCheckpoints(packet, artifactRoot, candidate, env);
		if (checkpointOutcome.executed?.review) {
			recordCheckpointOutcome(checkpointOutcomes.review, checkpointOutcome.review);
		}
		if (checkpointOutcome.executed?.fullGate) {
			recordCheckpointOutcome(checkpointOutcomes.fullGate, checkpointOutcome.fullGate);
		}
		if (checkpointOutcome.admissible) {
			return {
				selectedCandidateId: candidateId,
				checkpointOutcomes,
				selectionTelemetry: {
					rankedFrontierCandidateIds: rankedFrontierIds,
					rejectedFinalistCandidateIds,
					selectionConstraintIneligibleCandidateIds,
					rejectionReasons,
				},
				status: "completed",
				reasonCodes: [],
			};
		}
		rejectedFinalistCandidateIds.push(candidateId);
		rejectionReasons[candidateId] = checkpointOutcome.rejectionReasons;
	}
	return {
		selectedCandidateId: null,
		checkpointOutcomes,
		selectionTelemetry: {
			rankedFrontierCandidateIds: rankedFrontierIds,
			rejectedFinalistCandidateIds,
			selectionConstraintIneligibleCandidateIds,
			rejectionReasons,
		},
		status: "blocked",
		reasonCodes: selectionConstraintIneligibleCandidateIds.length === rankedFrontierIds.length
			? ["no_selection_policy_eligible_candidate"]
			: ["no_checkpoint_admissible_candidate"],
	};
}

function searchTelemetry(candidates, generationSummaries, selectionOutcome, stopReason) {
	const mutatedCandidates = candidates.filter((candidate) => candidate.id !== "seed");
	return {
		candidateCount: candidates.length,
		generationCount: generationSummaries.length,
		mutationInvocationCount: mutatedCandidates.filter((candidate) => candidate.origin === "mutation").length,
		mergeInvocationCount: mutatedCandidates.filter((candidate) => candidate.origin === "merge").length,
		heldOutEvaluationCount: 1 + mutatedCandidates.filter((candidate) => (candidate.heldOutEntries || []).length > 0).length,
		reviewCheckpointCount: countExecutedCheckpoints(selectionOutcome?.checkpointOutcomes?.review || []),
		fullGateCheckpointCount: countExecutedCheckpoints(selectionOutcome?.checkpointOutcomes?.fullGate || []),
		stopReason,
	};
}

function resultContext(packet, candidates, generationSummaries, selectionOutcome, stopReason, now) {
	const { matrix, scenarioIds, candidateIds, frontierIds, rankedFrontierIds } = selectionContext(packet, candidates);
	return {
		generatedAt: now.toISOString(),
		repoRoot: packet.repoRoot,
		optimizeInputFile: packet.optimizeInputFile,
		searchConfig: packet.searchConfig,
		searchConfigSources: packet.searchConfigSources || {},
		experimentContext: experimentContext(packet),
		telemetryCompleteness: telemetryCompleteness(matrix, candidates),
		candidateRegistry: candidateRegistry(candidates),
		generationSummaries,
		heldOutEvaluationMatrix: matrix,
		pareto: {
			frontierCandidateIds: frontierIds,
			perScenarioBestCandidateIds: perScenarioBestCandidateIds(matrix, scenarioIds, candidateIds),
		},
		checkpointOutcomes: selectionOutcome?.checkpointOutcomes || { review: [], fullGate: [] },
		searchTelemetry: searchTelemetry(candidates, generationSummaries, selectionOutcome, stopReason),
		selectionTelemetry: selectionOutcome?.selectionTelemetry || { rankedFrontierCandidateIds: rankedFrontierIds },
		rankedFrontierIds,
	};
}

function buildCompletedResult(packet, inputFile, candidates, schemaVersion, stopReason, generationSummaries = [], selectionOutcome = null, now = new Date()) {
	const context = resultContext(packet, candidates, generationSummaries, selectionOutcome, stopReason, now);
	const selectedCandidateId = selectionOutcome?.selectedCandidateId || context.rankedFrontierIds[0] || "seed";
	const selectedCandidate = candidates.find((candidate) => candidate.id === selectedCandidateId) || candidates[0];
	return {
		schemaVersion,
		generatedAt: context.generatedAt,
		status: "completed",
		inputFile,
			repoRoot: context.repoRoot,
			optimizeInputFile: context.optimizeInputFile,
			searchConfig: context.searchConfig,
			searchConfigSources: context.searchConfigSources,
			experimentContext: context.experimentContext,
			telemetryCompleteness: context.telemetryCompleteness,
			selectedCandidateId,
			candidateRegistry: context.candidateRegistry,
		generationSummaries: context.generationSummaries,
		heldOutEvaluationMatrix: context.heldOutEvaluationMatrix,
		pareto: context.pareto,
		checkpointOutcomes: context.checkpointOutcomes,
		searchTelemetry: context.searchTelemetry,
		proposalBridge: {
			optimizeInputFile: context.optimizeInputFile,
			selectedCandidateId,
			selectedTargetFile: selectedCandidate.targetFile,
		},
		selectionTelemetry: context.selectionTelemetry,
	};
}

function buildCheckpointBlockedResult(packet, inputFile, candidates, schemaVersion, stopReason, generationSummaries = [], selectionOutcome = null, now = new Date()) {
	const context = resultContext(packet, candidates, generationSummaries, selectionOutcome, stopReason, now);
	return {
		schemaVersion,
		generatedAt: context.generatedAt,
		status: "blocked",
		inputFile,
			repoRoot: context.repoRoot,
			optimizeInputFile: context.optimizeInputFile,
			searchConfig: context.searchConfig,
			searchConfigSources: context.searchConfigSources,
			experimentContext: context.experimentContext,
			telemetryCompleteness: context.telemetryCompleteness,
			candidateRegistry: context.candidateRegistry,
		generationSummaries: context.generationSummaries,
		heldOutEvaluationMatrix: context.heldOutEvaluationMatrix,
		pareto: context.pareto,
		checkpointOutcomes: context.checkpointOutcomes,
		searchTelemetry: context.searchTelemetry,
		proposalBridge: {
			optimizeInputFile: context.optimizeInputFile,
		},
		selectionTelemetry: context.selectionTelemetry,
		reasonCodes: selectionOutcome?.reasonCodes || ["no_checkpoint_admissible_candidate"],
		missingEvidence: [],
		suggestedNextSteps: [
			"inspect checkpoint outcomes for the rejected frontier candidates",
			"tighten the prompt or search brief to satisfy review and full-gate constraints",
			"rerun optimize search after addressing the blocking checkpoint findings",
		],
	};
}

function buildGenerationSummary(generationIndex, proposedCandidates, frontierIds, parentFrontierCandidateIds) {
	return {
		generationIndex,
		parentFrontierCandidateIds,
		proposedCandidateIds: proposedCandidates.map((candidate) => candidate.id),
		promotedCandidateIds: proposedCandidates
			.filter((candidate) => Array.isArray(candidate.heldOutEntries) && candidate.heldOutEntries.length > 0)
			.map((candidate) => candidate.id),
		frontierCandidateIds: frontierIds,
	};
}

function retainParentCandidates(frontierIds, matrix, candidates, scenarioIds, populationLimit) {
	const ranked = rankCandidateIds(frontierIds, matrix, candidates, scenarioIds);
	return ranked
		.slice(0, Math.max(1, populationLimit))
		.map((candidateId) => candidates.find((candidate) => candidate.id === candidateId))
		.filter(Boolean);
}

function buildSeedSearchCandidate(packet) {
	return {
		...buildSeedCandidate(packet),
		heldOutEntries: collectSeedHeldOutEntries(packet),
	};
}

function nextGenerationCandidates(packet, allCandidates, scenarioIds, nextGenerationIndex) {
	const matrix = allCandidates.flatMap((candidate) => candidate.heldOutEntries || []);
	const candidateIds = allCandidates.map((candidate) => candidate.id);
	const frontierIds = frontierCandidateIds(matrix, candidateIds, scenarioIds);
	const rankedMutationParents = retainParentCandidates(
		frontierIds,
		matrix,
		allCandidates,
		scenarioIds,
		packet.searchConfig.populationLimit,
	);
	const mutationParents = prioritizeMutationParents(
		rankedMutationParents.filter((candidate) => candidateCanSeedMutation(candidate, nextGenerationIndex)),
	);
	const mergeParents = shouldReviewFrontierPromotions(packet)
		? mutationParents.filter(candidatePassedPromotionReview)
		: mutationParents;
	return { mutationParents, mergeParents, mergeFeedbackCandidates: rankedMutationParents };
}

function appendGenerationSummary(allCandidates, generationSummaries, generationIndex, evaluatedCandidates, parentCandidates, scenarioIds) {
	const nextMatrix = allCandidates.flatMap((candidate) => candidate.heldOutEntries || []);
	const nextFrontierIds = frontierCandidateIds(nextMatrix, allCandidates.map((candidate) => candidate.id), scenarioIds);
	generationSummaries.push(buildGenerationSummary(
		generationIndex,
		evaluatedCandidates,
		nextFrontierIds,
		parentCandidates.map((candidate) => candidate.id),
	));
}

function runGenerations(packet, artifactRoot, seedCandidate, readiness, checkpointLedger, env) {
	const scenarioIds = scenarioIdsForPacket(packet, seedCandidate.heldOutEntries);
	const allCandidates = [seedCandidate];
	const generationSummaries = [];
	let stopReason = "seed_only";
	recordFrontierPromotionReviews(packet, artifactRoot, allCandidates, scenarioIds, checkpointLedger, env);
	for (let generationIndex = 1; generationIndex <= packet.searchConfig.generationLimit; generationIndex += 1) {
		const { mutationParents, mergeParents, mergeFeedbackCandidates } = nextGenerationCandidates(packet, allCandidates, scenarioIds, generationIndex);
		const evaluatedCandidates = evaluateMutationCandidates(packet, artifactRoot, mutationParents, readiness.feedbackSignals, env, {
			generationIndex,
			existingCandidates: allCandidates,
			frontierCandidates: mergeParents,
			mergeFeedbackCandidates,
		});
		if (evaluatedCandidates.length === 0) {
			return {
				allCandidates,
				generationSummaries,
				stopReason: generationIndex === 1 ? "seed_only" : "no_new_candidates",
			};
		}
		allCandidates.push(...evaluatedCandidates);
		recordFrontierPromotionReviews(packet, artifactRoot, allCandidates, scenarioIds, checkpointLedger, env);
		appendGenerationSummary(allCandidates, generationSummaries, generationIndex, evaluatedCandidates, mutationParents, scenarioIds);
		stopReason = generationIndex === packet.searchConfig.generationLimit ? "generation_limit" : "frontier_continue";
	}
	return { allCandidates, generationSummaries, stopReason };
}

function finalizeSearchResult(packet, inputFile, artifactRoot, candidates, schemaVersion, stopReason, generationSummaries, checkpointLedger, env, now) {
	const context = selectionContext(packet, candidates);
	const selectionOutcome = selectionOutcomeFor(packet, artifactRoot, candidates, context.rankedFrontierIds, env, checkpointLedger);
	if (selectionOutcome.status === "blocked") {
		return buildCheckpointBlockedResult(
			packet,
			inputFile,
			candidates,
			schemaVersion,
			"checkpoint_rejected",
			generationSummaries,
			selectionOutcome,
			now,
		);
	}
	return buildCompletedResult(
		packet,
		inputFile,
		candidates,
		schemaVersion,
		stopReason,
		generationSummaries,
		selectionOutcome,
		now,
	);
}

export function runOptimizeSearch(packet, {
	inputFile = null,
	outputFile = null,
	schemaVersion,
	now = new Date(),
	env,
} = {}) {
	const readiness = evaluateReadiness(packet);
	if (readiness.reasons.length > 0) {
		return buildBlockedResult(packet, inputFile, readiness.reasons, readiness.missingEvidence, schemaVersion, now);
	}
	const seedCandidate = buildSeedSearchCandidate(packet);
	const artifactRoot = dirname(outputFile || inputFile || packet.optimizeInputFile);
	const checkpointLedger = createCheckpointLedger();
	try {
		const result = canRunMutation(packet)
			? runGenerations(packet, artifactRoot, seedCandidate, readiness, checkpointLedger, env)
			: { allCandidates: [seedCandidate], generationSummaries: [], stopReason: "seed_only" };
		return finalizeSearchResult(
			packet,
			inputFile,
			artifactRoot,
			result.allCandidates,
			schemaVersion,
			result.stopReason,
			result.generationSummaries,
			checkpointLedger,
			env,
			now,
		);
	} catch {
		return finalizeSearchResult(
			packet,
			inputFile,
			artifactRoot,
			[seedCandidate],
			schemaVersion,
			"seed_only",
			[],
			checkpointLedger,
			env,
			now,
		);
	}
}

function evaluateReadiness(packet) {
	const heldOutEntries = collectSeedHeldOutEntries(packet);
	const feedbackSignals = collectFeedbackSignals(packet);
	const reasons = [];
	const missingEvidence = [];
	if (heldOutEntries.length === 0) {
		reasons.push("missing_held_out_scenarios");
		missingEvidence.push("held_out scenario ids");
	}
	if (!heldOutEntries.some((entry) => typeof entry.score === "number")) {
		reasons.push("missing_per_scenario_scores");
		missingEvidence.push("per-scenario score or pass/fail records");
	}
	if (feedbackSignals.length === 0) {
		reasons.push("missing_textual_feedback");
		missingEvidence.push("compareArtifact reasons or humanReviewFindings");
	}
	return {
		heldOutEntries,
		feedbackSignals,
		reasons,
		missingEvidence,
	};
}
