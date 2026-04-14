import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import process from "node:process";
import { pathToFileURL } from "node:url";

import { REVIEW_PROMPT_INPUTS_SCHEMA } from "./contract-versions.mjs";

function usage(exitCode = 0) {
	const text = [
		"Usage:",
		"  node ./scripts/agent-runtime/render-review-prompt.mjs --input <file> [--output <file>]",
	].join("\n");
	const out = exitCode === 0 ? process.stdout : process.stderr;
	out.write(`${text}\n`);
	process.exit(exitCode);
}

function fail(message) {
	process.stderr.write(`${message}\n`);
	process.exit(1);
}

function readRequiredValue(argv, index, option) {
	const value = argv[index];
	if (!value) {
		fail(`Missing value for ${option}`);
	}
	return value;
}

function parseArgs(argv) {
	const options = {
		input: null,
		output: null,
	};
	for (let index = 0; index < argv.length; index += 1) {
		const arg = argv[index];
		if (arg === "-h" || arg === "--help") {
			usage(0);
		}
		const field = {
			"--input": "input",
			"--output": "output",
		}[arg];
		if (!field) {
			fail(`Unknown argument: ${arg}`);
		}
		options[field] = readRequiredValue(argv, index + 1, arg);
		index += 1;
	}
	if (!options.input) {
		fail("--input is required");
	}
	return options;
}

function parsePromptInput(path) {
	const resolved = resolve(path);
	if (!existsSync(resolved)) {
		fail(`Prompt input not found: ${resolved}`);
	}
	const parsed = JSON.parse(readFileSync(resolved, "utf-8"));
	if (parsed?.schemaVersion !== REVIEW_PROMPT_INPUTS_SCHEMA) {
		fail(`prompt input must use schemaVersion ${REVIEW_PROMPT_INPUTS_SCHEMA}`);
	}
	return parsed;
}

function renderTelemetry(telemetry) {
	if (!telemetry || typeof telemetry !== "object") {
		return null;
	}
	const parts = [];
	if (typeof telemetry.durationMs === "number") {
		parts.push(`durationMs=${telemetry.durationMs}`);
	}
	if (typeof telemetry.total_tokens === "number") {
		parts.push(`total_tokens=${telemetry.total_tokens}`);
	}
	if (typeof telemetry.cost_usd === "number") {
		parts.push(`cost_usd=${telemetry.cost_usd}`);
	}
	return parts.length > 0 ? parts.join(", ") : null;
}

function renderModeSummary(modeSummary) {
	const lines = [`- ${modeSummary.mode}: ${modeSummary.status}`];
	if (modeSummary.summary) {
		lines.push(`  summary: ${modeSummary.summary}`);
	}
	const telemetry = renderTelemetry(modeSummary.telemetry);
	if (telemetry) {
		lines.push(`  telemetry: ${telemetry}`);
	}
	if (modeSummary.compareArtifact?.summary) {
		lines.push(`  compare artifact: ${modeSummary.compareArtifact.summary}`);
	}
	return lines.join("\n");
}

function renderCommandObservation(observation) {
	const parts = [];
	if (observation.stage) {
		parts.push(observation.stage);
	}
	if (observation.status) {
		parts.push(observation.status);
	}
	if (observation.command) {
		parts.push(observation.command);
	}
	if (observation.exitCode !== undefined) {
		parts.push(`exitCode=${observation.exitCode}`);
	}
	if (observation.durationMs !== undefined) {
		parts.push(`durationMs=${observation.durationMs}`);
	}
	return `- ${parts.join(" | ")}`;
}

function renderCurrentReportEvidence(evidence) {
	if (!evidence || typeof evidence !== "object") {
		return [];
	}
	const lines = ["## Current Report Evidence"];
	if (evidence.reportFile) {
		lines.push(`- report file: ${evidence.reportFile}`);
	}
	if (evidence.reportGeneratedAt) {
		lines.push(`- report generatedAt: ${evidence.reportGeneratedAt}`);
	}
	if (evidence.automatedRecommendation) {
		lines.push(`- current automated recommendation: ${evidence.automatedRecommendation}`);
	}
	if (Array.isArray(evidence.commandObservations) && evidence.commandObservations.length > 0) {
		lines.push("- current command observations:");
		lines.push(...evidence.commandObservations.map((entry) => `  ${renderCommandObservation(entry).slice(2)}`));
	}
	return lines.length > 1 ? lines : [];
}

function renderIntentProfile(intentProfile) {
	if (!intentProfile || typeof intentProfile !== "object") {
		return [];
	}
	return [
		"## Intent Profile",
		`- intent id: ${intentProfile.intentId}`,
		`- behavior surface: ${intentProfile.behaviorSurface}`,
		...((intentProfile.successDimensions || []).map((entry) => `- success: ${entry.id} -> ${entry.summary}`)),
		...((intentProfile.guardrailDimensions || []).map((entry) => `- guardrail: ${entry.id} -> ${entry.summary}`)),
	];
}

function renderFileList(title, files) {
	const presentFiles = files.filter((entry) => entry && entry.absolutePath);
	if (presentFiles.length === 0) {
		return "";
	}
	return [
		title,
		...presentFiles.map((entry) => `- ${entry.absolutePath}${entry.exists ? "" : " (missing at render time)"}`),
	].join("\n");
}

function renderOutputUnderTest(fileRecord) {
	if (!fileRecord?.absolutePath) {
		return "";
	}
	return [
		"## Output Under Test",
		`- ${fileRecord.absolutePath}${fileRecord.exists ? "" : " (missing at render time)"}`,
		"- Use this artifact as the primary evidence of realized behavior for the stated dimensions.",
	].join("\n");
}

function renderScenarioContext(context) {
	if (!context || typeof context !== "object") {
		return "";
	}
	const lines = ["## Scenario Context"];
	if (context.sourceFile) {
		lines.push(`- source file: ${context.sourceFile}`);
	}
	if (context.scenarioId) {
		lines.push(`- scenario id: ${context.scenarioId}`);
	}
	if (context.scenarioKey) {
		lines.push(`- scenario key: ${context.scenarioKey}`);
	}
	if (context.proposalKey) {
		lines.push(`- proposal key: ${context.proposalKey}`);
	}
	if (context.name) {
		lines.push(`- name: ${context.name}`);
	}
	if (context.description) {
		lines.push(`- description: ${context.description}`);
	}
	if (context.brief) {
		lines.push(`- brief: ${context.brief}`);
	}
	if (Array.isArray(context.simulatorTurns) && context.simulatorTurns.length > 0) {
		lines.push("- simulator turns:");
		lines.push(...context.simulatorTurns.map((entry, index) => `  ${index + 1}. ${entry}`));
	}
	return lines.join("\n");
}

function renderOutputUnderTestText(textRecord) {
	if (!textRecord?.text) {
		return "";
	}
	const lines = ["## Output Under Test Text"];
	if (textRecord.key) {
		lines.push(`- extracted key: ${textRecord.key}`);
	}
	if (typeof textRecord.charCount === "number") {
		lines.push(`- extracted chars: ${textRecord.charCount}`);
	}
	if (textRecord.truncated) {
		lines.push("- excerpt truncated for bounded review.");
	}
	lines.push("```text", textRecord.text, "```");
	return lines.join("\n");
}

function maybeReadConsumerPrompt(promptInput) {
	const path = promptInput.defaultPromptFile?.absolutePath;
	if (!path || !promptInput.defaultPromptFile?.exists) {
		return "";
	}
	try {
		const text = readFileSync(path, "utf-8").trim();
		return text ? `\n## Consumer Prompt Addendum\n${text}\n` : "";
	} catch {
		return "";
	}
}

function defaultComparisonQuestions(promptInput) {
	return promptInput.comparisonQuestions?.length
		? promptInput.comparisonQuestions
		: ["Which behaviors improved, regressed, or stayed noisy in ways that matter to a real operator?"];
}

function defaultHumanReviewPrompts(promptInput) {
	return promptInput.humanReviewPrompts?.length
		? promptInput.humanReviewPrompts.map((entry) => `- ${entry.id}: ${entry.prompt}`)
		: ["- real-user: Where would a real user still judge the candidate worse despite benchmark wins?"];
}

function appendSectionLines(sections, sectionText) {
	if (!sectionText) {
		return;
	}
	sections.push("", ...sectionText.split("\n"));
}

export function renderReviewPrompt(promptInput) {
	const comparisonQuestions = defaultComparisonQuestions(promptInput);
	const humanReviewPrompts = defaultHumanReviewPrompts(promptInput);
	const sections = [
		"# Cautilus Review",
		"",
		promptInput.metaPrompt.objective,
		...promptInput.metaPrompt.instructions.map((entry) => `- ${entry}`),
		"",
		"## Evaluation",
		`- intent: ${promptInput.intent}`,
		`- candidate: ${promptInput.candidate}`,
		`- baseline: ${promptInput.baseline}`,
		`- automated recommendation: ${promptInput.automatedRecommendation}`,
		"",
		...renderCurrentReportEvidence(promptInput.currentReportEvidence),
		"",
		...renderIntentProfile(promptInput.intentProfile),
		"",
		"## Mode Summaries",
		...(promptInput.modeSummaries || []).flatMap((entry) => renderModeSummary(entry).split("\n")),
		"",
		"## Comparison Questions",
		...comparisonQuestions.map((entry, index) => `${index + 1}. ${entry}`),
		"",
		"## Human Review Lenses",
		...humanReviewPrompts,
	];
	appendSectionLines(sections, renderFileList("## Artifact Files", promptInput.artifactFiles || []));
	appendSectionLines(sections, renderScenarioContext(promptInput.scenarioContext));
	appendSectionLines(sections, renderOutputUnderTest(promptInput.outputUnderTestFile));
	appendSectionLines(sections, renderOutputUnderTestText(promptInput.outputUnderTestText));
	appendSectionLines(sections, renderFileList("## Report Artifacts", promptInput.reportArtifacts || []));
	if (promptInput.defaultSchemaFile?.absolutePath) {
		sections.push("", "## Output Contract", `- schema file: ${promptInput.defaultSchemaFile.absolutePath}`);
	}
	sections.push("", "Return a verdict that follows the provided output schema. If the evidence is insufficient for a bounded review, return the schema-compliant blocked payload with a concrete reason code and reason instead of prose.");
	const consumerPrompt = maybeReadConsumerPrompt(promptInput);
	return `${sections.join("\n")}${consumerPrompt}`.trimEnd() + "\n";
}

export function main(argv = process.argv.slice(2)) {
	try {
		const options = parseArgs(argv);
		const prompt = renderReviewPrompt(parsePromptInput(options.input));
		if (options.output) {
			writeFileSync(resolve(options.output), prompt, "utf-8");
			return;
		}
		process.stdout.write(prompt);
	} catch (error) {
		if (error instanceof Error) {
			process.stderr.write(`${error.message}\n`);
		} else {
			process.stderr.write(`${String(error)}\n`);
		}
		process.exit(1);
	}
}

const entryHref = process.argv[1] ? pathToFileURL(resolve(process.argv[1])).href : "";
if (import.meta.url === entryHref) {
	main();
}
