import { readFileSync } from "node:fs";
import { join, resolve } from "node:path";
import process from "node:process";
import { pathToFileURL } from "node:url";

import { buildBehaviorIntentProfile } from "./behavior-intent.mjs";
import { REPORT_INPUTS_SCHEMA, REPORT_PACKET_SCHEMA } from "./contract-versions.mjs";
import { readActiveRunDir } from "./active-run.mjs";
import { normalizeScenarioResultsPacket } from "./scenario-results.mjs";
import { summarizeScenarioTelemetryEntries } from "./scenario-result-telemetry.mjs";
import {
	classifyModeSummary,
	summarizeReportReasons,
} from "./report-reason-classification.mjs";
import { writeTextOutput } from "./output-files.mjs";

export { REPORT_INPUTS_SCHEMA, REPORT_PACKET_SCHEMA } from "./contract-versions.mjs";

const MODE_VALUES = new Set(["iterate", "held_out", "comparison", "full_gate"]);
const NUMERIC_TELEMETRY_FIELDS = ["prompt_tokens", "completion_tokens", "total_tokens", "cost_usd"];

function usage(exitCode = 0) {
	const text = [
		"Usage:",
		"  node ./scripts/agent-runtime/build-report-packet.mjs --input <file> [--output <file>]",
		"",
		"Input packet:",
		`  schemaVersion: ${REPORT_INPUTS_SCHEMA}`,
		"  candidate: <string>",
		"  baseline: <string>",
		"  intent: <string>",
		"  modeRuns: [...]",
	].join("\n");
	const out = exitCode === 0 ? process.stdout : process.stderr;
	out.write(`${text}\n`);
	process.exit(exitCode);
}

function readOptionValue(argv, index, option) {
	const value = argv[index + 1] || "";
	if (!value) {
		throw new Error(`${option} requires a value`);
	}
	return value;
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
			inputPath = readOptionValue(argv, index, arg);
			index += 1;
			continue;
		}
		if (arg === "--output") {
			outputPath = readOptionValue(argv, index, arg);
			index += 1;
			continue;
		}
		throw new Error(`Unknown argument: ${arg}`);
	}
	return { inputPath, outputPath };
}

function resolveCommandOptions(options, { env = process.env } = {}) {
	const activeRunDir = readActiveRunDir({ env });
	const resolved = {
		...options,
		inputPath: options.inputPath,
		outputPath: options.outputPath,
	};
	if (!resolved.inputPath && activeRunDir) {
		resolved.inputPath = join(activeRunDir, "report-input.json");
	}
	if (!resolved.inputPath) {
		throw new Error("--input is required");
	}
	if (!resolved.outputPath && activeRunDir) {
		resolved.outputPath = join(activeRunDir, "report.json");
	}
	return resolved;
}

function parseJsonFile(path) {
	try {
		return JSON.parse(readFileSync(path, "utf-8"));
	} catch (error) {
		throw new Error(`Failed to read JSON from ${path}: ${error.message}`);
	}
}

function normalizeNonEmptyString(value, field) {
	if (typeof value !== "string" || !value.trim()) {
		throw new Error(`${field} must be a non-empty string`);
	}
	return value;
}

function normalizeOptionalString(value, field) {
	if (value === undefined) {
		return undefined;
	}
	return normalizeNonEmptyString(value, field);
}

function normalizeIsoTimestamp(value, field) {
	if (value === undefined) {
		return undefined;
	}
	if (typeof value !== "string" || !Number.isFinite(Date.parse(value))) {
		throw new Error(`${field} must be a valid ISO timestamp`);
	}
	return value;
}

function normalizeNonNegativeNumber(value, field) {
	if (value === undefined) {
		return undefined;
	}
	if (typeof value !== "number" || !Number.isFinite(value) || value < 0) {
		throw new Error(`${field} must be a non-negative number`);
	}
	return value;
}

function normalizeTelemetry(value, field) {
	if (value === undefined) {
		return null;
	}
	if (!value || typeof value !== "object" || Array.isArray(value)) {
		throw new Error(`${field} must be an object`);
	}
	const telemetry = {};
	for (const key of ["provider", "model"]) {
		if (value[key] !== undefined) {
			telemetry[key] = normalizeNonEmptyString(value[key], `${field}.${key}`);
		}
	}
	for (const key of NUMERIC_TELEMETRY_FIELDS) {
		const normalized = normalizeNonNegativeNumber(value[key], `${field}.${key}`);
		if (normalized !== undefined) {
			telemetry[key] = normalized;
		}
	}
	return Object.keys(telemetry).length > 0 ? telemetry : null;
}

function assertArray(value, field) {
	if (value === undefined) {
		return [];
	}
	if (!Array.isArray(value)) {
		throw new Error(`${field} must be an array`);
	}
	return value;
}

function normalizeMode(value, field) {
	const mode = normalizeNonEmptyString(value, field);
	if (!MODE_VALUES.has(mode)) {
		throw new Error(`${field} must be one of ${[...MODE_VALUES].join(", ")}`);
	}
	return mode;
}

function normalizeCommand(entry, index) {
	if (!entry || typeof entry !== "object" || Array.isArray(entry)) {
		throw new Error(`commands[${index}] must be an object`);
	}
	return {
		mode: normalizeMode(entry.mode, `commands[${index}].mode`),
		command: normalizeNonEmptyString(entry.command, `commands[${index}].command`),
		...(entry.label !== undefined
			? { label: normalizeNonEmptyString(entry.label, `commands[${index}].label`) }
			: {}),
	};
}

function reviewFindingShapeHint() {
	return 'minimum shape: {"severity":"concern","message":"Concrete review feedback","path":"optional/path.md"}';
}

function normalizeReviewFinding(entry, index) {
	if (!entry || typeof entry !== "object" || Array.isArray(entry)) {
		throw new Error(`humanReviewFindings[${index}] must be an object (${reviewFindingShapeHint()})`);
	}
	let severity;
	try {
		severity = normalizeNonEmptyString(entry.severity, `humanReviewFindings[${index}].severity`);
	} catch (error) {
		throw new Error(`${error.message} (${reviewFindingShapeHint()})`);
	}
	let message;
	try {
		message = normalizeNonEmptyString(entry.message, `humanReviewFindings[${index}].message`);
	} catch (error) {
		throw new Error(`${error.message} (${reviewFindingShapeHint()})`);
	}
	return {
		severity,
		message,
		...(entry.path !== undefined
			? (() => {
					try {
						return { path: normalizeNonEmptyString(entry.path, `humanReviewFindings[${index}].path`) };
					} catch (error) {
						throw new Error(`${error.message} (${reviewFindingShapeHint()})`);
					}
				})()
			: {}),
	};
}

function normalizeAdapterContext(value, field = "adapterContext") {
	if (value === undefined || value === null) {
		return null;
	}
	if (!value || typeof value !== "object" || Array.isArray(value)) {
		throw new Error(`${field} must be an object`);
	}
	const normalized = {};
	if (value.adapter !== undefined) {
		normalized.adapter = normalizeNonEmptyString(value.adapter, `${field}.adapter`);
	}
	if (value.adapterName !== undefined) {
		normalized.adapterName = normalizeNonEmptyString(value.adapterName, `${field}.adapterName`);
	}
	return Object.keys(normalized).length > 0 ? normalized : null;
}

function normalizeCommandObservation(entry, index) {
	if (!entry || typeof entry !== "object" || Array.isArray(entry)) {
		throw new Error(`commandObservations[${index}] must be an object`);
	}
	return {
		stage: normalizeNonEmptyString(entry.stage, `commandObservations[${index}].stage`),
		index: normalizeNonNegativeNumber(entry.index, `commandObservations[${index}].index`) ?? index + 1,
		status: normalizeNonEmptyString(entry.status, `commandObservations[${index}].status`),
		command: normalizeNonEmptyString(entry.command, `commandObservations[${index}].command`),
		...(entry.startedAt !== undefined
			? { startedAt: normalizeIsoTimestamp(entry.startedAt, `commandObservations[${index}].startedAt`) }
			: {}),
		...(entry.completedAt !== undefined
			? { completedAt: normalizeIsoTimestamp(entry.completedAt, `commandObservations[${index}].completedAt`) }
			: {}),
		...(entry.durationMs !== undefined
			? {
				durationMs: normalizeNonNegativeNumber(
					entry.durationMs,
					`commandObservations[${index}].durationMs`,
				),
			}
			: {}),
		...(entry.exitCode !== undefined
			? { exitCode: normalizeNonNegativeNumber(entry.exitCode, `commandObservations[${index}].exitCode`) }
			: {}),
		...(entry.signal !== undefined
			? { signal: normalizeNonEmptyString(entry.signal, `commandObservations[${index}].signal`) }
			: {}),
		...(entry.stdoutFile !== undefined
			? { stdoutFile: normalizeNonEmptyString(entry.stdoutFile, `commandObservations[${index}].stdoutFile`) }
			: {}),
		...(entry.stderrFile !== undefined
			? { stderrFile: normalizeNonEmptyString(entry.stderrFile, `commandObservations[${index}].stderrFile`) }
			: {}),
	};
}

function normalizeScenarioBuckets(entries, field) {
	return assertArray(entries, field).map((entry, index) => {
		if (typeof entry === "string") {
			return normalizeNonEmptyString(entry, `${field}[${index}]`);
		}
		if (!entry || typeof entry !== "object" || Array.isArray(entry)) {
			throw new Error(`${field}[${index}] must be a string or object`);
		}
		return entry;
	});
}

function normalizeModeRun(entry, index) {
	if (!entry || typeof entry !== "object" || Array.isArray(entry)) {
		throw new Error(`modeRuns[${index}] must be an object`);
	}
	if ("candidateResults" in entry) {
		throw new Error(`modeRuns[${index}].candidateResults is no longer supported; use scenarioResults`);
	}
	return {
		mode: normalizeMode(entry.mode, `modeRuns[${index}].mode`),
		status: normalizeOptionalString(entry.status, `modeRuns[${index}].status`) || "completed",
		...(entry.summary !== undefined
			? { summary: normalizeNonEmptyString(entry.summary, `modeRuns[${index}].summary`) }
			: {}),
		...(entry.startedAt !== undefined
			? { startedAt: normalizeIsoTimestamp(entry.startedAt, `modeRuns[${index}].startedAt`) }
			: {}),
		...(entry.completedAt !== undefined
			? { completedAt: normalizeIsoTimestamp(entry.completedAt, `modeRuns[${index}].completedAt`) }
			: {}),
		...(entry.durationMs !== undefined
			? { durationMs: normalizeNonNegativeNumber(entry.durationMs, `modeRuns[${index}].durationMs`) }
			: {}),
		...(entry.telemetry !== undefined
			? { telemetry: normalizeTelemetry(entry.telemetry, `modeRuns[${index}].telemetry`) }
			: {}),
		...(entry.scenarioResults !== undefined
			? {
				scenarioResults: normalizeScenarioResultsPacket(
					entry.scenarioResults,
					`modeRuns[${index}].scenarioResults`,
				),
			}
			: {}),
	};
}

function uniqueStrings(values) {
	return Array.from(new Set(values.filter((value) => typeof value === "string" && value.length > 0)));
}

function chooseNumber(explicitValue, fallbackValue) {
	return typeof explicitValue === "number" ? explicitValue : fallbackValue;
}

function copyModeTiming(modeRun, telemetry) {
	return {
		...(modeRun.startedAt ? { startedAt: modeRun.startedAt } : {}),
		...(modeRun.completedAt ? { completedAt: modeRun.completedAt } : {}),
		...(typeof modeRun.durationMs === "number" ? { durationMs: modeRun.durationMs } : {}),
		...telemetry,
	};
}

function collectNumericTelemetry(modeRun, scenarioOverall) {
	const telemetry = {};
	for (const field of NUMERIC_TELEMETRY_FIELDS) {
		const value = chooseNumber(modeRun.telemetry?.[field], scenarioOverall?.[field]);
		if (typeof value === "number") {
			telemetry[field] = value;
		}
	}
	return telemetry;
}

function collectAggregateStrings(modeRun, scenarioOverall, field, aggregateField) {
	return uniqueStrings([
		...(modeRun.telemetry?.[field] ? [modeRun.telemetry[field]] : []),
		...(scenarioOverall?.[aggregateField] || []),
	]);
}

function createModeTelemetry(modeRun, scenarioTelemetrySummary) {
	const scenarioOverall = scenarioTelemetrySummary?.overall ?? null;
	const telemetry = copyModeTiming(modeRun, collectNumericTelemetry(modeRun, scenarioOverall));
	const providers = collectAggregateStrings(modeRun, scenarioOverall, "provider", "providers");
	if (providers.length > 0) {
		telemetry.providers = providers;
	}
	const models = collectAggregateStrings(modeRun, scenarioOverall, "model", "models");
	if (models.length > 0) {
		telemetry.models = models;
	}
	return Object.keys(telemetry).length > 0 ? telemetry : null;
}

function parseIsoTime(value) {
	const millis = Date.parse(String(value || ""));
	return Number.isFinite(millis) ? millis : 0;
}

function sumModeTelemetryField(modeSummaries, field) {
	let seen = false;
	let total = 0;
	for (const modeSummary of modeSummaries) {
		const value = modeSummary.telemetry && typeof modeSummary.telemetry[field] === "number"
			? modeSummary.telemetry[field]
			: null;
		if (value === null) {
			continue;
		}
		seen = true;
		total += value;
	}
	return seen ? Number(total.toFixed(12)) : null;
}

function summarizeReportTelemetry(modeSummaries) {
	const telemetry = {
		modeCount: modeSummaries.length,
		modesWithScenarioResults: modeSummaries.filter((entry) => entry.scenarioTelemetrySummary).length,
	};
	const startedAtValues = modeSummaries
		.map((entry) => entry.startedAt || entry.telemetry?.startedAt)
		.filter(Boolean)
		.sort((left, right) => parseIsoTime(left) - parseIsoTime(right));
	const completedAtValues = modeSummaries
		.map((entry) => entry.completedAt || entry.telemetry?.completedAt)
		.filter(Boolean)
		.sort((left, right) => parseIsoTime(right) - parseIsoTime(left));
	if (startedAtValues.length > 0) {
		telemetry.startedAt = startedAtValues[0];
	}
	if (completedAtValues.length > 0) {
		telemetry.completedAt = completedAtValues[0];
	}
	const durationMs = sumModeTelemetryField(modeSummaries, "durationMs");
	if (durationMs !== null) {
		telemetry.durationMs = durationMs;
	}
	for (const field of NUMERIC_TELEMETRY_FIELDS) {
		const total = sumModeTelemetryField(modeSummaries, field);
		if (total !== null) {
			telemetry[field] = total;
		}
	}
	const providers = uniqueStrings(modeSummaries.flatMap((entry) => entry.telemetry?.providers || []));
	if (providers.length > 0) {
		telemetry.providers = providers;
	}
	const models = uniqueStrings(modeSummaries.flatMap((entry) => entry.telemetry?.models || []));
	if (models.length > 0) {
		telemetry.models = models;
	}
	return telemetry;
}

function buildModeScenarioTelemetrySummary(modeRun, now) {
	const scenarioResults = modeRun.scenarioResults?.results || [];
	return scenarioResults.length > 0
		? summarizeScenarioTelemetryEntries(scenarioResults, {
			now,
			source: `report_mode:${modeRun.mode}`,
		})
		: null;
}

function buildBaseModeSummary(modeRun, scenarioTelemetrySummary) {
	const telemetry = createModeTelemetry(modeRun, scenarioTelemetrySummary);
	return {
		mode: modeRun.mode,
		status: modeRun.status,
		...(modeRun.summary ? { summary: modeRun.summary } : {}),
		...(modeRun.startedAt ? { startedAt: modeRun.startedAt } : {}),
		...(modeRun.completedAt ? { completedAt: modeRun.completedAt } : {}),
		...(typeof modeRun.durationMs === "number" ? { durationMs: modeRun.durationMs } : {}),
		...(telemetry ? { telemetry } : {}),
		...(modeRun.scenarioResults?.compareArtifact
			? { compareArtifact: modeRun.scenarioResults.compareArtifact }
			: {}),
		...(scenarioTelemetrySummary ? { scenarioTelemetrySummary } : {}),
	};
}

function applyModeClassification(modeSummary, modeRun, commandObservations) {
	const classified = classifyModeSummary(modeSummary, modeRun, commandObservations);
	if (classified.reasonCodes.length > 0) {
		modeSummary.reasonCodes = classified.reasonCodes;
	}
	if (classified.warnings.length > 0) {
		modeSummary.warnings = classified.warnings;
		const warningSummary = classified.warnings.map((entry) => entry.summary).join(" ");
		modeSummary.summary = modeSummary.summary
			? `${modeSummary.summary} Warning: ${warningSummary}`
			: `Warning: ${warningSummary}`;
	}
	return modeSummary;
}

function createModeSummary(modeRun, commandObservations, now) {
	const scenarioTelemetrySummary = buildModeScenarioTelemetrySummary(modeRun, now);
	const modeSummary = buildBaseModeSummary(modeRun, scenarioTelemetrySummary);
	return applyModeClassification(modeSummary, modeRun, commandObservations);
}

export function buildReportPacket(input, { now = new Date() } = {}) {
	if (!input || typeof input !== "object" || Array.isArray(input)) {
		throw new Error("input must be an object");
	}
	if (input.schemaVersion !== REPORT_INPUTS_SCHEMA) {
		throw new Error(`schemaVersion must be ${REPORT_INPUTS_SCHEMA}`);
	}
	const modeRuns = assertArray(input.modeRuns, "modeRuns").map((entry, index) => normalizeModeRun(entry, index));
	const commandObservations = assertArray(input.commandObservations, "commandObservations").map((entry, index) =>
		normalizeCommandObservation(entry, index),
	);
	const adapterContext = normalizeAdapterContext(input.adapterContext);
	const modeSummaries = modeRuns.map((modeRun) => createModeSummary(modeRun, commandObservations, now));
	const reportReasons = summarizeReportReasons(modeSummaries);
	return {
		schemaVersion: REPORT_PACKET_SCHEMA,
		generatedAt: now.toISOString(),
		candidate: normalizeNonEmptyString(input.candidate, "candidate"),
		baseline: normalizeNonEmptyString(input.baseline, "baseline"),
		intent: normalizeNonEmptyString(input.intent, "intent"),
		intentProfile: buildBehaviorIntentProfile({
			intent: input.intent,
			intentProfile: input.intentProfile,
		}),
		commands: assertArray(input.commands, "commands").map((entry, index) => normalizeCommand(entry, index)),
		commandObservations,
		modesRun: modeSummaries.map((entry) => entry.mode),
		modeSummaries,
		telemetry: summarizeReportTelemetry(modeSummaries),
		...(reportReasons.reasonCodes.length > 0 ? { reasonCodes: reportReasons.reasonCodes } : {}),
		...(reportReasons.warnings.length > 0 ? { warnings: reportReasons.warnings } : {}),
		...(adapterContext ? { adapterContext } : {}),
		improved: normalizeScenarioBuckets(input.improved, "improved"),
		regressed: normalizeScenarioBuckets(input.regressed, "regressed"),
		unchanged: normalizeScenarioBuckets(input.unchanged, "unchanged"),
		noisy: normalizeScenarioBuckets(input.noisy, "noisy"),
		humanReviewFindings: assertArray(input.humanReviewFindings, "humanReviewFindings").map((entry, index) =>
			normalizeReviewFinding(entry, index),
		),
		recommendation: normalizeNonEmptyString(input.recommendation, "recommendation"),
	};
}

export function main(argv = process.argv.slice(2)) {
	try {
		const { inputPath, outputPath } = resolveCommandOptions(parseArgs(argv));
		const packet = buildReportPacket(parseJsonFile(inputPath));
		const text = `${JSON.stringify(packet, null, 2)}\n`;
		if (outputPath) {
			writeTextOutput(outputPath, text);
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
