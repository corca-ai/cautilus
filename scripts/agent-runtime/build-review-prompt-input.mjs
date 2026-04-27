import { existsSync, readFileSync } from "node:fs";
import { basename, resolve } from "node:path";
import process from "node:process";
import { pathToFileURL } from "node:url";

import { buildBehaviorIntentProfile } from "./behavior-intent.mjs";
import { loadAdapter as loadAdapterPayload } from "../resolve_adapter.mjs";
import { writeTextOutput } from "./output-files.mjs";
import {
	DRAFT_SCENARIO_SCHEMA,
	REVIEW_PACKET_SCHEMA,
	REVIEW_PROMPT_INPUTS_SCHEMA,
	SCENARIO_PROPOSAL_INPUTS_SCHEMA,
	SCENARIO_PROPOSALS_SCHEMA,
} from "./contract-versions.mjs";

const META_PROMPT_OBJECTIVE =
	"Judge whether the candidate is actually better than the baseline for the stated intent.";
const OUTPUT_UNDER_TEST_OBJECTIVE =
	"Judge whether the output under test actually satisfies the stated intent and dimensions.";
const META_PROMPT_INSTRUCTIONS = [
	"Treat prompts, wrappers, and benchmark text as mutable implementation details.",
	"Prefer held-out and full-gate evidence over train-only wins.",
	"Call out cases where automated recommendation and real-user judgment diverge.",
	"Use compare artifacts and scenario telemetry when they make the decision more legible.",
];
const OUTPUT_UNDER_TEST_INSTRUCTIONS = [
	"Judge the realized output artifact, not only the prompt plausibility.",
	"Use the output-under-test file as primary evidence for success and guardrail dimensions.",
];
const OUTPUT_UNDER_TEST_TEXT_LIMIT = 12000;

function usage(exitCode = 0) {
	const text = [
		"Usage:",
		"  node ./scripts/agent-runtime/build-review-prompt-input.mjs (--review-packet <file> | --scenario-file <file>) [--scenario <id>] [--repo-root <dir>] [--adapter <file> | --adapter-name <name>] [--output-under-test <file>] [--output-text-key <dot.path>] [--output <file>]",
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
		repoRoot: process.cwd(),
		adapter: null,
		adapterName: null,
		reviewPacket: null,
		scenarioFile: null,
		scenarioId: null,
		output: null,
		outputUnderTest: null,
		outputTextKey: null,
	};
	for (let index = 0; index < argv.length; index += 1) {
		const arg = argv[index];
		if (arg === "-h" || arg === "--help") {
			usage(0);
		}
		const field = {
			"--repo-root": "repoRoot",
			"--adapter": "adapter",
			"--adapter-name": "adapterName",
			"--review-packet": "reviewPacket",
			"--scenario-file": "scenarioFile",
			"--scenario": "scenarioId",
			"--output": "output",
			"--output-under-test": "outputUnderTest",
			"--output-text-key": "outputTextKey",
		}[arg];
		if (!field) {
			fail(`Unknown argument: ${arg}`);
		}
		options[field] = readRequiredValue(argv, index + 1, arg);
		index += 1;
	}
	if (options.adapter && options.adapterName) {
		fail("Use either --adapter or --adapter-name, not both.");
	}
	if (Boolean(options.reviewPacket) === Boolean(options.scenarioFile)) {
		fail("Provide exactly one of --review-packet or --scenario-file.");
	}
	if (options.outputTextKey && !options.outputUnderTest) {
		fail("--output-text-key requires --output-under-test");
	}
	if (options.scenarioFile && !options.outputUnderTest) {
		fail("--scenario-file requires --output-under-test");
	}
	return options;
}

function explicitFileRecord(path) {
	if (!path) {
		return null;
	}
	const resolved = resolve(path);
	return {
		relativePath: null,
		absolutePath: resolved,
		exists: existsSync(resolved),
	};
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

function parseJsonFile(path, label) {
	const resolved = resolve(path);
	if (!existsSync(resolved)) {
		fail(`${label} not found: ${resolved}`);
	}
	return { path: resolved, value: JSON.parse(readFileSync(resolved, "utf-8")) };
}

function loadAdapter(options) {
	if (!options.adapter && !options.adapterName) {
		return null;
	}
	const payload = loadAdapterPayload(resolve(options.repoRoot), {
		adapter: options.adapter,
		adapterName: options.adapterName,
	});
	if (!payload.valid) {
		fail(`Adapter is invalid: ${JSON.stringify(payload.errors ?? [])}`);
	}
	return payload;
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
		...(Array.isArray(modeSummary.reasonCodes) && modeSummary.reasonCodes.length > 0
			? { reasonCodes: modeSummary.reasonCodes }
			: {}),
		...(Array.isArray(modeSummary.warnings) && modeSummary.warnings.length > 0
			? { warnings: modeSummary.warnings }
			: {}),
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

function buildMetaPrompt(reviewMode) {
	return {
		objective: reviewMode === "output_under_test" ? OUTPUT_UNDER_TEST_OBJECTIVE : META_PROMPT_OBJECTIVE,
		instructions:
			reviewMode === "output_under_test"
				? [...META_PROMPT_INSTRUCTIONS, ...OUTPUT_UNDER_TEST_INSTRUCTIONS]
				: META_PROMPT_INSTRUCTIONS,
	};
}

function buildCurrentReportEvidence(reviewPacket, report) {
	return {
		reportFile: reviewPacket.packet.reportFile,
		reportGeneratedAt: report.generatedAt,
		automatedRecommendation: report.recommendation,
		commandObservations: (report.commandObservations || []).map((entry) => summarizeCommandObservation(entry)),
	};
}

function lookupDotPath(value, dotPath) {
	return String(dotPath)
		.trim()
		.split(".")
		.reduce((current, segment) => {
			if (current === undefined || current === null || !segment.trim()) {
				return undefined;
			}
			if (Array.isArray(current)) {
				const index = Number.parseInt(segment, 10);
				if (!Number.isInteger(index) || index < 0 || index >= current.length) {
					return undefined;
				}
				return current[index];
			}
			if (typeof current === "object") {
				return current[segment];
			}
			return undefined;
		}, value);
}

function coerceOutputText(value) {
	if (value === null || value === undefined) {
		throw new Error("output text value is null");
	}
	if (typeof value === "string") {
		return value;
	}
	if (Array.isArray(value)) {
		return value.map((entry) => coerceOutputText(entry)).join("\n");
	}
	if (typeof value === "object") {
		return JSON.stringify(value, null, 2);
	}
	return String(value);
}

function buildOutputUnderTestText(outputUnderTestFile, outputTextKey) {
	if (!outputUnderTestFile || !outputTextKey) {
		return null;
	}
	const parsed = JSON.parse(readFileSync(outputUnderTestFile.absolutePath, "utf-8"));
	const value = lookupDotPath(parsed, outputTextKey);
	if (value === undefined) {
		throw new Error(`output-under-test file ${outputUnderTestFile.absolutePath} does not contain key ${outputTextKey}`);
	}
	const fullText = coerceOutputText(value);
	return {
		key: outputTextKey,
		text: fullText.slice(0, OUTPUT_UNDER_TEST_TEXT_LIMIT),
		charCount: fullText.length,
		truncated: fullText.length > OUTPUT_UNDER_TEST_TEXT_LIMIT,
	};
}

function normalizeScenarioContext(record, sourceFile) {
	return {
		sourceFile,
		scenarioId: record.scenarioId ?? record.proposalKey ?? null,
		scenarioKey: record.benchmark?.scenarioKey ?? null,
		proposalKey: record.proposalKey ?? null,
		name: record.name ?? null,
		description: record.description ?? null,
		brief: record.brief ?? null,
		simulatorTurns: Array.isArray(record.simulatorTurns) ? record.simulatorTurns : [],
		intentProfile: record.intentProfile ?? null,
	};
}

function requiredScenarioIdFor(schemaVersion) {
	throw new Error(`--scenario is required when --scenario-file points at ${schemaVersion}`);
}

function resolveScenarioFromProposalInputs(source, sourceFile, scenarioId) {
	if (!scenarioId) {
		requiredScenarioIdFor(SCENARIO_PROPOSAL_INPUTS_SCHEMA);
	}
	const record = (source.proposalCandidates || []).find((entry) => entry?.proposalKey === scenarioId);
	if (!record) {
		throw new Error(`scenario ${scenarioId} not found in ${sourceFile}`);
	}
	return normalizeScenarioContext(record, sourceFile);
}

function resolveScenarioFromProposals(source, sourceFile, scenarioId) {
	if (!scenarioId) {
		requiredScenarioIdFor(SCENARIO_PROPOSALS_SCHEMA);
	}
	const record = (source.proposals || []).find((entry) => {
		return (
			entry?.proposalKey === scenarioId ||
			entry?.draftScenario?.scenarioId === scenarioId ||
			entry?.draftScenario?.benchmark?.scenarioKey === scenarioId
		);
	});
	if (!record?.draftScenario) {
		throw new Error(`scenario ${scenarioId} not found in ${sourceFile}`);
	}
	return normalizeScenarioContext(
		{
			...record.draftScenario,
			proposalKey: record.proposalKey ?? null,
		},
		sourceFile,
	);
}

function resolveScenarioContext(source, sourceFile, scenarioId) {
	const schemaVersion = source?.schemaVersion;
	if (schemaVersion === DRAFT_SCENARIO_SCHEMA) {
		return normalizeScenarioContext(source, sourceFile);
	}
	if (schemaVersion === SCENARIO_PROPOSAL_INPUTS_SCHEMA) {
		return resolveScenarioFromProposalInputs(source, sourceFile, scenarioId);
	}
	if (schemaVersion === SCENARIO_PROPOSALS_SCHEMA) {
		return resolveScenarioFromProposals(source, sourceFile, scenarioId);
	}
	if (source && typeof source === "object" && source.intentProfile) {
		return normalizeScenarioContext(source, sourceFile);
	}
	throw new Error(
		`scenario source must be a ${DRAFT_SCENARIO_SCHEMA}, ${SCENARIO_PROPOSAL_INPUTS_SCHEMA}, ${SCENARIO_PROPOSALS_SCHEMA}, or scenario-like object`,
	);
}

function buildAdapterFileRecord(options, relativePath) {
	if (!relativePath) {
		return null;
	}
	const absolutePath = resolve(options.repoRoot, relativePath);
	return fileRecordSummary({
		relativePath,
		absolutePath,
		exists: existsSync(absolutePath),
	});
}

function buildPacketFromReviewPacket(options, outputUnderTestFile, now) {
	const reviewPacket = parseReviewPacket(options.reviewPacket);
	const report = reviewPacket.packet.report;
	const reviewMode = outputUnderTestFile ? "output_under_test" : "prompt_under_test";
	const packet = {
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
		currentReportEvidence: buildCurrentReportEvidence(reviewPacket, report),
		modeSummaries: (report.modeSummaries || []).map((entry) => summarizeMode(entry)),
		comparisonQuestions: reviewPacket.packet.comparisonQuestions || [],
		humanReviewPrompts: reviewPacket.packet.humanReviewPrompts || [],
		artifactFiles: (reviewPacket.packet.artifactFiles || []).map((entry) => fileRecordSummary(entry)),
		reportArtifacts: (reviewPacket.packet.reportArtifacts || []).map((entry) => fileRecordSummary(entry)),
		reviewMode,
		metaPrompt: buildMetaPrompt(reviewMode),
	};
	const defaultPromptFile = fileRecordSummary(reviewPacket.packet.defaultPromptFile);
	const defaultSchemaFile = fileRecordSummary(reviewPacket.packet.defaultSchemaFile);
	if (defaultPromptFile) {
		packet.defaultPromptFile = defaultPromptFile;
	}
	if (defaultSchemaFile) {
		packet.defaultSchemaFile = defaultSchemaFile;
	}
	if (outputUnderTestFile) {
		packet.outputUnderTestFile = outputUnderTestFile;
		const outputUnderTestText = buildOutputUnderTestText(outputUnderTestFile, options.outputTextKey);
		if (outputUnderTestText) {
			packet.outputUnderTestText = outputUnderTestText;
		}
	}
	return packet;
}

function buildScenarioReviewPacketBase(options, outputUnderTestFile, now, scenarioContext, adapterPayload) {
	const adapterData = adapterPayload?.data ?? {};
	const intent = scenarioContext.description || scenarioContext.intentProfile?.summary;
	if (!intent) {
		throw new Error("scenario source must provide description or intentProfile.summary");
	}
	return {
		schemaVersion: REVIEW_PROMPT_INPUTS_SCHEMA,
		generatedAt: now.toISOString(),
		repoRoot: resolve(options.repoRoot),
		adapterPath: adapterPayload?.path ?? "",
		intent,
		intentProfile: buildBehaviorIntentProfile({
			intent,
			intentProfile: scenarioContext.intentProfile,
			fallbackBehaviorSurface: "review_variant_workflow",
		}),
		candidate: basename(outputUnderTestFile.absolutePath),
		baseline: "not_applicable",
		automatedRecommendation: "not_run",
		currentReportEvidence: {
			reportFile: "",
			reportGeneratedAt: "",
			automatedRecommendation: "not_run",
			commandObservations: [],
		},
		modeSummaries: [],
		comparisonQuestions: adapterData.comparison_questions ?? [],
		humanReviewPrompts: adapterData.human_review_prompts ?? [],
		artifactFiles: [],
		reportArtifacts: [],
		reviewMode: "output_under_test",
		metaPrompt: buildMetaPrompt("output_under_test"),
		scenarioContext,
		outputUnderTestFile,
	};
}

function attachScenarioPacketExtras(packet, options, adapterPayload, outputUnderTestFile) {
	const outputUnderTestText = buildOutputUnderTestText(outputUnderTestFile, options.outputTextKey);
	if (outputUnderTestText) {
		packet.outputUnderTestText = outputUnderTestText;
	}
	const defaultPromptFile = buildAdapterFileRecord(options, adapterPayload?.data?.default_prompt_file);
	const defaultSchemaFile = buildAdapterFileRecord(options, adapterPayload?.data?.default_schema_file);
	if (defaultPromptFile) {
		packet.defaultPromptFile = defaultPromptFile;
	}
	if (defaultSchemaFile) {
		packet.defaultSchemaFile = defaultSchemaFile;
	}
	return packet;
}

function buildPacketFromScenario(options, outputUnderTestFile, now) {
	const scenarioSource = parseJsonFile(options.scenarioFile, "Scenario file");
	const scenarioContext = resolveScenarioContext(scenarioSource.value, scenarioSource.path, options.scenarioId);
	const adapterPayload = loadAdapter(options);
	const packet = buildScenarioReviewPacketBase(options, outputUnderTestFile, now, scenarioContext, adapterPayload);
	return attachScenarioPacketExtras(packet, options, adapterPayload, outputUnderTestFile);
}

export function buildReviewPromptInput(inputOptions, { now = new Date() } = {}) {
	const options = parseArgs(inputOptions);
	const outputUnderTestFile = explicitFileRecord(options.outputUnderTest);
	return options.reviewPacket
		? buildPacketFromReviewPacket(options, outputUnderTestFile, now)
		: buildPacketFromScenario(options, outputUnderTestFile, now);
}

export function main(argv = process.argv.slice(2)) {
	try {
		const options = parseArgs(argv);
		const packet = buildReviewPromptInput(argv);
		const text = `${JSON.stringify(packet, null, 2)}\n`;
		if (options.output) {
			writeTextOutput(options.output, text);
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
