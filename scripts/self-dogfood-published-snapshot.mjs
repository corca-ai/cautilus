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
				stdoutFile: null,
				stderrFile: null,
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
			}))
			: summary.reviewVariants,
	};
}
