import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import process from "node:process";
import { pathToFileURL } from "node:url";

import { buildBehaviorIntentProfile } from "./behavior-intent.mjs";
import { REPORT_INPUTS_SCHEMA, REPORT_PACKET_SCHEMA } from "./contract-versions.mjs";
import { normalizeScenarioResultsPacket } from "./scenario-results.mjs";
import { summarizeScenarioTelemetryEntries } from "./scenario-result-telemetry.mjs";

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
	if (!inputPath) {
		throw new Error("--input is required");
	}
	return { inputPath, outputPath };
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

function normalizeReviewFinding(entry, index) {
	if (!entry || typeof entry !== "object" || Array.isArray(entry)) {
		throw new Error(`humanReviewFindings[${index}] must be an object`);
	}
	return {
		severity: normalizeNonEmptyString(entry.severity, `humanReviewFindings[${index}].severity`),
		message: normalizeNonEmptyString(entry.message, `humanReviewFindings[${index}].message`),
		...(entry.path !== undefined
			? { path: normalizeNonEmptyString(entry.path, `humanReviewFindings[${index}].path`) }
			: {}),
	};
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

export function buildReportPacket(input, { now = new Date() } = {}) {
	if (!input || typeof input !== "object" || Array.isArray(input)) {
		throw new Error("input must be an object");
	}
	if (input.schemaVersion !== REPORT_INPUTS_SCHEMA) {
		throw new Error(`schemaVersion must be ${REPORT_INPUTS_SCHEMA}`);
	}
	const modeRuns = assertArray(input.modeRuns, "modeRuns").map((entry, index) => normalizeModeRun(entry, index));
	const modeSummaries = modeRuns.map((modeRun) => {
		const scenarioResults = modeRun.scenarioResults?.results || [];
		const scenarioTelemetrySummary = scenarioResults.length > 0
			? summarizeScenarioTelemetryEntries(scenarioResults, {
				now,
				source: `report_mode:${modeRun.mode}`,
			})
			: null;
		return {
			mode: modeRun.mode,
			status: modeRun.status,
			...(modeRun.summary ? { summary: modeRun.summary } : {}),
			...(modeRun.startedAt ? { startedAt: modeRun.startedAt } : {}),
			...(modeRun.completedAt ? { completedAt: modeRun.completedAt } : {}),
			...(typeof modeRun.durationMs === "number" ? { durationMs: modeRun.durationMs } : {}),
			...(createModeTelemetry(modeRun, scenarioTelemetrySummary)
				? { telemetry: createModeTelemetry(modeRun, scenarioTelemetrySummary) }
				: {}),
			...(modeRun.scenarioResults?.compareArtifact
				? { compareArtifact: modeRun.scenarioResults.compareArtifact }
				: {}),
			...(scenarioTelemetrySummary ? { scenarioTelemetrySummary } : {}),
		};
	});
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
		commandObservations: assertArray(input.commandObservations, "commandObservations").map((entry, index) =>
			normalizeCommandObservation(entry, index),
		),
		modesRun: modeSummaries.map((entry) => entry.mode),
		modeSummaries,
		telemetry: summarizeReportTelemetry(modeSummaries),
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
		const { inputPath, outputPath } = parseArgs(argv);
		const packet = buildReportPacket(parseJsonFile(inputPath));
		const text = `${JSON.stringify(packet, null, 2)}\n`;
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
