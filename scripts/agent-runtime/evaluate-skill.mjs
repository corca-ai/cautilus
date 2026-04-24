import { writeFileSync } from "node:fs";
import { resolve } from "node:path";
import process from "node:process";
import { pathToFileURL } from "node:url";

import {
	SKILL_EVALUATION_INPUTS_SCHEMA,
	SKILL_EVALUATION_SUMMARY_SCHEMA,
} from "./contract-versions.mjs";
import {
	normalizeNonEmptyString,
	normalizeOptionalString,
	parseJsonFile,
} from "./skill-evaluation-normalizers.mjs";
import {
	evaluateNormalizedRun,
	normalizeRun,
} from "./skill-evaluation-runs.mjs";
import {
	buildComparisonSummary,
	buildEvaluationCounts,
	buildSamplingSummary,
	recommendationFromCounts,
	serializeEvaluation,
	serializeEvaluationRun,
} from "./skill-evaluation-summary.mjs";

export { SKILL_EVALUATION_INPUTS_SCHEMA, SKILL_EVALUATION_SUMMARY_SCHEMA } from "./contract-versions.mjs";

function usage(exitCode = 0) {
	const text = [
		"Usage:",
		"  node ./scripts/agent-runtime/evaluate-skill.mjs --input <file> [--output <file>]",
		"",
		"Input packet:",
		`  schemaVersion: ${SKILL_EVALUATION_INPUTS_SCHEMA}`,
		"  skillId: <string>",
		"  evaluations: [...]",
	].join("\n");
	const out = exitCode === 0 ? process.stdout : process.stderr;
	out.write(`${text}\n`);
	process.exit(exitCode);
}

function parseArgs(argv) {
	let inputPath = "";
	let outputPath = "";
	for (let index = 0; index < argv.length; index += 1) {
		const arg = argv[index];
		if (arg === "-h" || arg === "--help") {
			usage(0);
		}
		if (arg === "--input") {
			inputPath = argv[index + 1] || "";
			index += 1;
			continue;
		}
		if (arg === "--output") {
			outputPath = argv[index + 1] || "";
			index += 1;
			continue;
		}
		throw new Error(`Unknown argument: ${arg}`);
	}
	if (!inputPath) {
		throw new Error("--input is required");
	}
	return { inputPath, outputPath };
}

export function buildSkillEvaluationSummary(input, now = new Date().toISOString()) {
	if (input.schemaVersion !== SKILL_EVALUATION_INPUTS_SCHEMA) {
		throw new Error(`schemaVersion must be ${SKILL_EVALUATION_INPUTS_SCHEMA}`);
	}
	const skillId = normalizeNonEmptyString(input.skillId, "skillId");
	const skillDisplayName = normalizeOptionalString(input.skillDisplayName, "skillDisplayName") || skillId;
	if (!Array.isArray(input.evaluations) || input.evaluations.length === 0) {
		throw new Error("evaluations must be a non-empty array");
	}

	const evaluations = input.evaluations.map((run, index) => evaluateNormalizedRun(normalizeRun(run, index)));
	const counts = buildEvaluationCounts(evaluations);
	const comparisonSummary = buildComparisonSummary(evaluations);
	const samplingSummary = buildSamplingSummary(evaluations, counts);
	const recommendation = recommendationFromCounts(counts, comparisonSummary);

	return {
		schemaVersion: SKILL_EVALUATION_SUMMARY_SCHEMA,
		skillId,
		skillDisplayName,
		evaluatedAt: now,
		recommendation,
		evaluationCounts: counts,
		samplingSummary,
		comparisonSummary,
		evaluations: evaluations.map((entry) => serializeEvaluation(entry)),
		evaluationRuns: evaluations.map((entry) => serializeEvaluationRun(entry)),
	};
}

export function main(argv = process.argv.slice(2)) {
	try {
		const { inputPath, outputPath } = parseArgs(argv);
		const input = parseJsonFile(inputPath);
		const summary = buildSkillEvaluationSummary(input);
		const text = `${JSON.stringify(summary, null, 2)}\n`;
		if (outputPath) {
			writeFileSync(outputPath, text, "utf-8");
			return;
		}
		process.stdout.write(text);
	} catch (error) {
		process.stderr.write(`${error.message}\n`);
		process.exit(1);
	}
}

const entryHref = process.argv[1] ? pathToFileURL(resolve(process.argv[1])).href : "";
if (import.meta.url === entryHref) {
	main();
}
