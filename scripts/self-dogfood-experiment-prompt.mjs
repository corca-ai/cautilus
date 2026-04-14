import { existsSync, readFileSync, writeFileSync } from "node:fs";

function adapterExcerptPatterns(adapterName) {
	if (adapterName === "self-dogfood") {
		return ["reportRecommendation", "gateRecommendation", "dogfood:self", "latest.md", "review-summary", "self-dogfood"];
	}
	if (adapterName.includes("gate-honesty")) {
		return [
			"standing gate",
			"dogfood:self",
			"npm run verify",
			"self-consumer gate",
			"overclaims",
			"self-dogfood",
		];
	}
	if (adapterName.includes("review-completion")) {
		return [
			"resolveReviewTimeoutMs",
			"runReviewVariants",
			"writeLatestArtifacts",
			"review-summary.json",
			"review_timeout_ms",
			"dogfood:self",
			"summary.json",
		];
	}
	if (adapterName.includes("binary-surface")) {
		return [
			"standalone binary",
			"dogfood:self",
			"run-self-dogfood",
			"root self-consumer",
			"consumer-readiness",
			"latest artifacts",
			"bin/cautilus",
			"--repo-root",
			"doctor",
			"self-dogfood",
		];
	}
	if (adapterName.includes("skill-surface")) {
		return [
			"dogfood:self:experiments:html",
			"dogfood:self:html",
			"dogfood:self:experiments",
			"dogfood:self",
			"self-dogfood",
		];
	}
	return ["self-dogfood", "dogfood:self", "verify"];
}

function clippedSections(lines, matchIndexes, radius = 3, maxLines = 40, maxSections = 3) {
	const sections = [];
	for (const index of matchIndexes) {
		appendSection(sections, lines.length, index, radius);
		if (sections.length >= maxSections) {
			break;
		}
	}
	return renderSections(lines, sections, maxLines);
}

function appendSection(sections, lineCount, index, radius) {
	const start = Math.max(0, index - radius);
	const end = Math.min(lineCount - 1, index + radius);
	const previous = sections.at(-1);
	if (previous && start <= previous.end + 1) {
		previous.end = Math.max(previous.end, end);
		return;
	}
	sections.push({ start, end });
}

function renderSections(lines, sections, maxLines) {
	const clipped = [];
	for (const [sectionIndex, section] of sections.entries()) {
		if (sectionIndex > 0) {
			clipped.push("...");
		}
		for (let index = section.start; index <= section.end; index += 1) {
			clipped.push(lines[index]);
			if (clipped.length >= maxLines) {
				return clipped;
			}
		}
	}
	return clipped;
}

function firstMatchIndexes(lines, adapterName) {
	return adapterExcerptPatterns(adapterName).flatMap((pattern) => {
		const loweredPattern = pattern.toLowerCase();
		const matchIndex = lines.findIndex((line) => line.toLowerCase().includes(loweredPattern));
		return matchIndex >= 0 ? [matchIndex] : [];
	});
}

export function excerptFileContent(content, adapterName) {
	const lines = content.split("\n");
	const patternMatches = firstMatchIndexes(lines, adapterName);
	if (patternMatches.length > 0) {
		return clippedSections(lines, patternMatches).join("\n").trim();
	}
	return lines.slice(0, 24).join("\n").trim();
}

function renderArtifactExcerpts(promptInput, adapterName) {
	const records = [...(promptInput.artifactFiles ?? []), ...(promptInput.reportArtifacts ?? [])];
	const excerpts = records.flatMap((record) => {
		if (!record?.absolutePath || !record.exists || !existsSync(record.absolutePath)) {
			return [];
		}
		const text = readFileSync(record.absolutePath, "utf-8");
		const excerpt = excerptFileContent(text, adapterName);
		if (!excerpt) {
			return [];
		}
		return [
			`### ${record.absolutePath}`,
			"```text",
			excerpt,
			"```",
		];
	});
	if (excerpts.length === 0) {
		return "";
	}
	return [
		"",
		"## Inlined Artifact Excerpts",
		"",
		"Use these excerpts as the primary evidence. Avoid extra shell commands unless the prompt is missing a required fact.",
		"",
		...excerpts,
		"",
	].join("\n");
}

function renderExperimentContext(adapterName, reviewTimeoutMs) {
	const lines = [
		"",
		"## Experiment Context",
		"",
		`- adapter: ${adapterName}`,
		`- bounded review timeout: ${reviewTimeoutMs}ms`,
	];
	if (adapterName.includes("review-completion")) {
		lines.push("- judge whether this bounded review surface can leave usable operator evidence without inspecting git diff or baseline history");
		lines.push("- treat the bounded review timeout as applying to the review-variant step, not to the standing full_gate command that prepared the current report");
		lines.push("- a narrower implementation that resolves adapter review_timeout_ms, enforces that bound around `cautilus review variants`, and writes review-summary/latest bundle artifacts counts as an improvement");
		lines.push("- do not run git diff or compare commits unless the prompt is missing a strictly required fact");
	}
	if (adapterName === "self-dogfood") {
		lines.push("- judge the canonical operator-facing self-dogfood claim, not stronger binary-surface or skill-surface claims");
		lines.push("- treat gateRecommendation as the raw deterministic signal and reportRecommendation as the operator-facing recommendation that should stay honest");
		lines.push("- ignore stale files under artifacts/self-dogfood/latest unless the prompt explicitly inlines them for the current run");
	}
	if (adapterName.includes("gate-honesty")) {
		lines.push("- judge the honesty of the standing gate's narrow claim boundary from the current report and inlined excerpts, not from repo-wide exploration");
		lines.push("- if the current surfaced claim is narrower and more evidence-proportional than the baseline's broader claim boundary, treat that as a real improvement");
		lines.push("- do not inspect unrelated docs or git history unless the prompt is missing a strictly required fact");
	}
	if (adapterName.includes("binary-surface")) {
		lines.push("- judge whether the standalone binary surface is discoverable and covered by product-owned checks from the current excerpts");
		lines.push("- do not widen into bundled-skill or repo-wide quality claims unless the prompt is missing a strictly required fact");
	}
	if (adapterName.includes("skill-surface")) {
		lines.push("- judge whether operators can follow the skill path from the current docs and bundled skill surfaces");
	}
	return `${lines.join("\n")}\n`;
}

function renderCurrentRunEvidence(promptInput, adapterName, currentReportPath, projectedReportPath, projectedReviewSummaryPath, projectedSummaryPath) {
	if (adapterName !== "self-dogfood") {
		return "";
	}
	const evidence = promptInput.currentReportEvidence ?? {};
	const lines = [
		"",
		"## Current Run Evidence",
		"",
		`- current report file: ${currentReportPath ?? evidence.reportFile ?? "n/a"}`,
		`- projected published report.json: ${projectedReportPath ?? "n/a"}`,
		`- projected review-summary.json: ${projectedReviewSummaryPath ?? "n/a"}`,
		`- projected summary.json: ${projectedSummaryPath ?? "n/a"}`,
		`- current gateRecommendation: ${evidence.automatedRecommendation ?? "n/a"}`,
		"- summary.json is written after this review from the current report plus your structured verdict.",
		"- the published latest report.json will embed selfDogfoodPublication with the latest bundle paths, overallStatus, gateRecommendation, and folded reportRecommendation.",
		"- gateRecommendation should stay equal to the current automated recommendation from report.json.",
		"- reportRecommendation should reflect the stronger of the deterministic gate result and your verdict (`pass -> accept-now`, `concern -> defer`, `blocker -> reject`).",
	];
	return `${lines.join("\n")}\n`;
}

export function enrichExperimentPrompt({
	promptPath,
	promptInputPath,
	adapterName,
	reviewTimeoutMs,
	currentReportPath = null,
	projectedReportPath = null,
	projectedReviewSummaryPath = null,
	projectedSummaryPath = null,
}) {
	const promptInput = JSON.parse(readFileSync(promptInputPath, "utf-8"));
	const rendered = readFileSync(promptPath, "utf-8");
	writeFileSync(
		promptPath,
		`${rendered.trimEnd()}\n${renderExperimentContext(adapterName, reviewTimeoutMs)}${renderCurrentRunEvidence(promptInput, adapterName, currentReportPath, projectedReportPath, projectedReviewSummaryPath, projectedSummaryPath)}${renderArtifactExcerpts(promptInput, adapterName)}`,
		"utf-8",
	);
}
