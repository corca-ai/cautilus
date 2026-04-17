function compareArtifactBuckets(scenarioResults) {
	if (!scenarioResults.compareArtifact) {
		return null;
	}
	return {
		improved: scenarioResults.compareArtifact.improved || [],
		regressed: scenarioResults.compareArtifact.regressed || [],
		unchanged: scenarioResults.compareArtifact.unchanged || [],
		noisy: scenarioResults.compareArtifact.noisy || [],
	};
}

function classifyScenarioStatus(status) {
	switch (status) {
		case "passed":
		case "improved":
			return "improved";
		case "unchanged":
			return "unchanged";
		case "noisy":
			return "noisy";
		default:
			return "regressed";
	}
}

export function classifyScenarioBuckets(scenarioResults) {
	const compareBuckets = compareArtifactBuckets(scenarioResults);
	if (compareBuckets) {
		return compareBuckets;
	}
	const improved = [];
	const regressed = [];
	const unchanged = [];
	const noisy = [];
	for (const result of scenarioResults.results) {
		const scenarioId = typeof result.scenarioId === "string" ? result.scenarioId : null;
		if (!scenarioId) {
			continue;
		}
		switch (classifyScenarioStatus(result.status)) {
			case "improved":
				improved.push(scenarioId);
				continue;
			case "unchanged":
				unchanged.push(scenarioId);
				continue;
			case "noisy":
				noisy.push(scenarioId);
				continue;
			default:
				regressed.push(scenarioId);
		}
	}
	return { improved, regressed, unchanged, noisy };
}

function isComparisonRejected(status, scenarioResults) {
	return status === "failed" && (
		(scenarioResults.compareArtifact && typeof scenarioResults.compareArtifact === "object") ||
		(Array.isArray(scenarioResults.results) && scenarioResults.results.length > 0)
	);
}

export function resolvedModeStatus(modeObservations, scenarioResults) {
	const failedObservation = modeObservations.find((entry) => entry.status !== "passed");
	if (!failedObservation) {
		return "passed";
	}
	return isComparisonRejected("failed", scenarioResults) ? "rejected" : "failed";
}

export function buildModeSummaryText(mode, status, commandCount, scenarioBuckets = null) {
	if (status === "passed") {
		return `${mode} completed across ${commandCount} command${commandCount === 1 ? "" : "s"}.`;
	}
	if (status === "rejected") {
		const regressionCount = scenarioBuckets?.regressed?.length ?? 0;
		if (regressionCount > 0) {
			return `${mode} completed comparison and reported ${regressionCount} regression${regressionCount === 1 ? "" : "s"}.`;
		}
		return `${mode} completed comparison and returned a rejecting verdict.`;
	}
	return `${mode} failed before completing all command templates.`;
}
