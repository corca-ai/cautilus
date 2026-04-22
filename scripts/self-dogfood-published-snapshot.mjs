function makeRepoRelative(repoRoot, value) {
	if (typeof value !== "string") {
		return value;
	}
	const normalizedRepoRoot = repoRoot.endsWith("/") ? repoRoot : `${repoRoot}/`;
	if (value === repoRoot) {
		return ".";
	}
	if (value.startsWith(normalizedRepoRoot)) {
		return value.slice(normalizedRepoRoot.length);
	}
	return value;
}

function sanitizeFinding(repoRoot, finding) {
	if (!finding || typeof finding !== "object") {
		return finding;
	}
	return {
		...finding,
		...(typeof finding.path === "string" ? { path: makeRepoRelative(repoRoot, finding.path) } : {}),
	};
}

function publishDiagnosticPath(repoRoot, executionStatus, value) {
	if (executionStatus === "passed") {
		return null;
	}
	return makeRepoRelative(repoRoot, value);
}

export function buildPublishedReport(repoRoot, report) {
	return {
		...report,
		candidate: makeRepoRelative(repoRoot, report.candidate),
		commandObservations: Array.isArray(report.commandObservations)
			? report.commandObservations.map((observation) => {
				const published = { ...observation };
				delete published.stdoutFile;
				delete published.stderrFile;
				return published;
			})
			: report.commandObservations,
	};
}

export function buildPublishedSelfDogfoodReport(repoRoot, artifactRoot, report, summary) {
	return {
		...buildPublishedReport(repoRoot, report),
		selfDogfoodPublication: {
			schemaVersion: "cautilus.self_dogfood_publication.v1",
			artifactRoot: makeRepoRelative(repoRoot, artifactRoot),
			latestBundle: {
				summaryPath: "artifacts/self-dogfood/latest/summary.json",
				reportPath: "artifacts/self-dogfood/latest/report.json",
				reviewSummaryPath: "artifacts/self-dogfood/latest/review-summary.json",
				latestMarkdownPath: "artifacts/self-dogfood/latest/latest.md",
				indexPath: "artifacts/self-dogfood/latest/index.html",
			},
			runId: summary.runId ?? null,
			intent: summary.intent ?? report.intent ?? null,
			overallStatus: summary.overallStatus ?? null,
			gateRecommendation: summary.gateRecommendation ?? report.recommendation ?? null,
			reportRecommendation: summary.reportRecommendation ?? null,
		},
	};
}

export function buildPublishedReviewSummary(repoRoot, reviewSummary) {
	return {
		...reviewSummary,
		repoRoot: ".",
		workspace: ".",
		adapterPath: makeRepoRelative(repoRoot, reviewSummary.adapterPath),
		promptFile: null,
		reviewPacketFile: null,
		reviewPromptInputFile: null,
		schemaFile: makeRepoRelative(repoRoot, reviewSummary.schemaFile),
		outputDir: null,
		variants: Array.isArray(reviewSummary.variants)
			? reviewSummary.variants.map((variant) => ({
				...variant,
				outputFile: null,
				stdoutFile: publishDiagnosticPath(repoRoot, variant.status, variant.stdoutFile),
				stderrFile: publishDiagnosticPath(repoRoot, variant.status, variant.stderrFile),
				command: null,
				stdout: "",
				stderr: "",
				output: variant.output
					? {
						...variant.output,
						findings: Array.isArray(variant.output.findings)
							? variant.output.findings.map((finding) => sanitizeFinding(repoRoot, finding))
							: variant.output.findings,
					}
					: variant.output,
			}))
			: reviewSummary.variants,
	};
}

export function buildPublishedSummary(repoRoot, artifactRoot, summary) {
	return {
		...summary,
		repoRoot: ".",
		workspace: ".",
		artifactRoot: makeRepoRelative(repoRoot, artifactRoot),
		reportPath: "artifacts/self-dogfood/latest/report.json",
		reviewSummaryPath: "artifacts/self-dogfood/latest/review-summary.json",
		reviewVariants: Array.isArray(summary.reviewVariants)
			? summary.reviewVariants.map((variant) => ({
				...variant,
				outputFile: null,
				stderrFile: publishDiagnosticPath(repoRoot, variant.executionStatus, variant.stderrFile),
			}))
			: summary.reviewVariants,
	};
}
