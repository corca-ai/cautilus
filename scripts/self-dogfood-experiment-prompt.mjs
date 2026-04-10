import { existsSync, readFileSync, writeFileSync } from "node:fs";

function adapterExcerptPatterns(adapterName) {
	if (adapterName.includes("gate-honesty")) {
		return ["self-dogfood", "verify", "hooks:check", "doctor", "adapter"];
	}
	if (adapterName.includes("review-completion")) {
		return ["reviewTimeoutMs", "dogfood:self", "latest.md", "timeout", "WORKBENCH_CODEX", "self-dogfood"];
	}
	if (adapterName.includes("skill-surface")) {
		return ["dogfood:self", "dogfood:self:experiments", "self-dogfood", "quality path", "bundled skill"];
	}
	return ["self-dogfood", "dogfood:self", "verify"];
}

function clippedLines(lines, matchIndexes, radius = 2, maxLines = 24) {
	const selected = new Set();
	for (const index of matchIndexes) {
		for (let offset = -radius; offset <= radius; offset += 1) {
			const candidate = index + offset;
			if (candidate >= 0 && candidate < lines.length) {
				selected.add(candidate);
			}
		}
	}
	const ordered = [...selected].sort((left, right) => left - right).slice(0, maxLines);
	return ordered.map((index) => lines[index]);
}

function excerptFileContent(content, adapterName) {
	const lines = content.split("\n");
	const loweredPatterns = adapterExcerptPatterns(adapterName).map((pattern) => pattern.toLowerCase());
	const matchIndexes = lines.flatMap((line, index) => {
		const lower = line.toLowerCase();
		return loweredPatterns.some((pattern) => lower.includes(pattern)) ? [index] : [];
	});
	if (matchIndexes.length > 0) {
		return clippedLines(lines, matchIndexes).join("\n").trim();
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
		lines.push("- do not run git diff or compare commits unless the prompt is missing a strictly required fact");
	}
	if (adapterName.includes("gate-honesty")) {
		lines.push("- judge the honesty of the standing gate claim from the current report and inlined excerpts, not from repo-wide exploration");
		lines.push("- do not inspect unrelated docs or git history unless the prompt is missing a strictly required fact");
	}
	if (adapterName.includes("skill-surface")) {
		lines.push("- judge whether operators can follow the skill path from the current docs and bundled skill surfaces");
	}
	return `${lines.join("\n")}\n`;
}

export function enrichExperimentPrompt({ promptPath, promptInputPath, adapterName, reviewTimeoutMs }) {
	const promptInput = JSON.parse(readFileSync(promptInputPath, "utf-8"));
	const rendered = readFileSync(promptPath, "utf-8");
	writeFileSync(
		promptPath,
		`${rendered.trimEnd()}\n${renderExperimentContext(adapterName, reviewTimeoutMs)}${renderArtifactExcerpts(promptInput, adapterName)}`,
		"utf-8",
	);
}
