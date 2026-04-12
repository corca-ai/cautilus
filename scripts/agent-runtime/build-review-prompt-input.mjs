import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import process from "node:process";
import { pathToFileURL } from "node:url";

import { buildBehaviorIntentProfile } from "./behavior-intent.mjs";
import { REVIEW_PACKET_SCHEMA, REVIEW_PROMPT_INPUTS_SCHEMA } from "./contract-versions.mjs";

const META_PROMPT_OBJECTIVE =
	"Judge whether the candidate is actually better than the baseline for the stated intent.";
const META_PROMPT_INSTRUCTIONS = [
	"Treat prompts, wrappers, and benchmark text as mutable implementation details.",
	"Prefer held-out and full-gate evidence over train-only wins.",
	"Call out cases where automated recommendation and real-user judgment diverge.",
	"Use compare artifacts and scenario telemetry when they make the decision more legible.",
];

function usage(exitCode = 0) {
	const text = [
		"Usage:",
		"  node ./scripts/agent-runtime/build-review-prompt-input.mjs --review-packet <file> [--output <file>]",
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
		reviewPacket: null,
		output: null,
	};
	for (let index = 0; index < argv.length; index += 1) {
		const arg = argv[index];
		if (arg === "-h" || arg === "--help") {
			usage(0);
		}
		const field = {
			"--review-packet": "reviewPacket",
			"--output": "output",
		}[arg];
		if (!field) {
			fail(`Unknown argument: ${arg}`);
		}
		options[field] = readRequiredValue(argv, index + 1, arg);
		index += 1;
	}
	if (!options.reviewPacket) {
		fail("--review-packet is required");
	}
	return options;
}

function parseReviewPacket(path) {
	const resolved = resolve(path);
	if (!existsSync(resolved)) {
		fail(`Review packet not found: ${resolved}`);
	}
	const parsed = JSON.parse(readFileSync(resolved, "utf-8"));
	if (parsed?.schemaVersion !== REVIEW_PACKET_SCHEMA) {
		fail(`review packet must use schemaVersion ${REVIEW_PACKET_SCHEMA}`);
	}
	return { path: resolved, packet: parsed };
}

function fileRecordSummary(record) {
	if (!record) {
		return null;
	}
	return {
		relativePath: record.relativePath || null,
		absolutePath: record.absolutePath,
		exists: Boolean(record.exists),
	};
}

function summarizeMode(modeSummary) {
	return {
		mode: modeSummary.mode,
		status: modeSummary.status,
		...(modeSummary.summary ? { summary: modeSummary.summary } : {}),
		...(modeSummary.telemetry ? { telemetry: modeSummary.telemetry } : {}),
		...(modeSummary.scenarioTelemetrySummary ? { scenarioTelemetrySummary: modeSummary.scenarioTelemetrySummary } : {}),
		...(modeSummary.compareArtifact ? { compareArtifact: modeSummary.compareArtifact } : {}),
	};
}

function summarizeCommandObservation(observation) {
	return {
		...(observation.stage ? { stage: observation.stage } : {}),
		...(observation.command ? { command: observation.command } : {}),
		...(observation.status ? { status: observation.status } : {}),
		...(observation.exitCode !== undefined ? { exitCode: observation.exitCode } : {}),
		...(observation.durationMs !== undefined ? { durationMs: observation.durationMs } : {}),
		...(observation.startedAt ? { startedAt: observation.startedAt } : {}),
		...(observation.completedAt ? { completedAt: observation.completedAt } : {}),
	};
}

export function buildReviewPromptInput(inputOptions, { now = new Date() } = {}) {
	const options = parseArgs(inputOptions);
	const reviewPacket = parseReviewPacket(options.reviewPacket);
	const report = reviewPacket.packet.report;
	const defaultPromptFile = fileRecordSummary(reviewPacket.packet.defaultPromptFile);
	const defaultSchemaFile = fileRecordSummary(reviewPacket.packet.defaultSchemaFile);
	return {
		schemaVersion: REVIEW_PROMPT_INPUTS_SCHEMA,
		generatedAt: now.toISOString(),
		reviewPacketFile: reviewPacket.path,
		repoRoot: reviewPacket.packet.repoRoot,
		adapterPath: reviewPacket.packet.adapterPath,
		intent: report.intent,
		intentProfile: buildBehaviorIntentProfile({
			intent: report.intent,
			intentProfile: report.intentProfile,
		}),
		candidate: report.candidate,
		baseline: report.baseline,
		automatedRecommendation: report.recommendation,
		currentReportEvidence: {
			reportFile: reviewPacket.packet.reportFile,
			reportGeneratedAt: report.generatedAt,
			automatedRecommendation: report.recommendation,
			commandObservations: (report.commandObservations || []).map((entry) => summarizeCommandObservation(entry)),
		},
		modeSummaries: (report.modeSummaries || []).map((entry) => summarizeMode(entry)),
		comparisonQuestions: reviewPacket.packet.comparisonQuestions || [],
		humanReviewPrompts: reviewPacket.packet.humanReviewPrompts || [],
		artifactFiles: (reviewPacket.packet.artifactFiles || []).map((entry) => fileRecordSummary(entry)),
		reportArtifacts: (reviewPacket.packet.reportArtifacts || []).map((entry) => fileRecordSummary(entry)),
		...(defaultPromptFile ? { defaultPromptFile } : {}),
		...(defaultSchemaFile ? { defaultSchemaFile } : {}),
		metaPrompt: {
			objective: META_PROMPT_OBJECTIVE,
			instructions: META_PROMPT_INSTRUCTIONS,
		},
	};
}

export function main(argv = process.argv.slice(2)) {
	try {
		const options = parseArgs(argv);
		const packet = buildReviewPromptInput(argv);
		const text = `${JSON.stringify(packet, null, 2)}\n`;
		if (options.output) {
			writeFileSync(resolve(options.output), text, "utf-8");
			return;
		}
		process.stdout.write(text);
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
