const REVIEW_SEVERITY_RANK = new Map([
	["pass", 0],
	["concern", 1],
	["blocker", 2],
]);

function reviewOutcomeSeverity(outcome) {
	const variants = Array.isArray(outcome?.variants) ? outcome.variants : [];
	const verdict = variants.reduce((highest, variant) => {
		const next = typeof variant?.verdict === "string" ? variant.verdict : "pass";
		return (REVIEW_SEVERITY_RANK.get(next) || 0) > (REVIEW_SEVERITY_RANK.get(highest) || 0) ? next : highest;
	}, "pass");
	return outcome?.admissible === false && verdict === "pass" ? "concern" : verdict;
}

function repairGenerationBudget(candidate) {
	const outcome = candidate?.promotionReviewOutcome;
	if (!candidate || outcome?.admissible !== false) {
		return Number.POSITIVE_INFINITY;
	}
	return reviewOutcomeSeverity(outcome) === "blocker" ? 0 : 1;
}

export function candidateCanSeedMutation(candidate, nextGenerationIndex) {
	if (!candidate || candidate?.promotionReviewOutcome?.admissible !== false) {
		return true;
	}
	const reviewedAtGeneration = candidate.promotionReviewOutcome?.reviewedAtGeneration ?? candidate.generationIndex;
	return nextGenerationIndex <= reviewedAtGeneration + repairGenerationBudget(candidate);
}
