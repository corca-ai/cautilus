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

export function renderReviewPrompt(promptInput) {
	const comparisonQuestions = promptInput.comparisonQuestions?.length
		? promptInput.comparisonQuestions
		: ["Which behaviors improved, regressed, or stayed noisy in ways that matter to a real operator?"];
	const humanReviewPrompts = promptInput.humanReviewPrompts?.length
		? promptInput.humanReviewPrompts.map((entry) => `- ${entry.id}: ${entry.prompt}`)
		: ["- real-user: Where would a real user still judge the candidate worse despite benchmark wins?"];
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
	const artifactSection = renderFileList("## Artifact Files", promptInput.artifactFiles || []);
	if (artifactSection) {
		sections.push("", ...artifactSection.split("\n"));
	}
	const reportSection = renderFileList("## Report Artifacts", promptInput.reportArtifacts || []);
	if (reportSection) {
		sections.push("", ...reportSection.split("\n"));
	}
	if (promptInput.defaultSchemaFile?.absolutePath) {
		sections.push("", "## Output Contract", `- schema file: ${promptInput.defaultSchemaFile.absolutePath}`);
	}
	sections.push("", "Return a verdict that follows the provided output schema. Explain why you agree or disagree with the automated recommendation.");
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
