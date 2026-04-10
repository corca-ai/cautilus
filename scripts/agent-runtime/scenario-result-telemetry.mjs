export const SCENARIO_TELEMETRY_SUMMARY_SCHEMA = "cautilus.scenario_telemetry_summary.v1";

const TELEMETRY_NUMERIC_FIELDS = [
	"prompt_tokens",
	"completion_tokens",
	"total_tokens",
	"cost_usd",
];

function parseIsoTime(value) {
	const millis = Date.parse(String(value || ""));
	return Number.isFinite(millis) ? millis : 0;
}

function normalizeNonNegativeNumber(value, field) {
	if (value === undefined || value === null) {
		return null;
	}
	if (typeof value !== "number" || !Number.isFinite(value) || value < 0) {
		throw new Error(`${field} must be a non-negative number`);
	}
	return value;
}

function normalizeIsoTimestamp(value, field) {
	if (value === undefined || value === null) {
		return null;
	}
	if (typeof value !== "string" || !Number.isFinite(Date.parse(value))) {
		throw new Error(`${field} must be a valid ISO timestamp`);
	}
	return value;
}

function setOptionalStringField(target, source, field, label) {
	if (source[field] === undefined) {
		return;
	}
	if (typeof source[field] !== "string" || !source[field].trim()) {
		throw new Error(`${label}.${field} must be a non-empty string`);
	}
	target[field] = source[field];
}

function setOptionalNumberField(target, source, field, label) {
	if (source[field] === undefined) {
		return;
	}
	if (typeof source[field] !== "number" || !Number.isFinite(source[field])) {
		throw new Error(`${label}.${field} must be a number`);
	}
	target[field] = source[field];
}

function readTelemetryStringFields(value, field, telemetry) {
	for (const key of ["provider", "model"]) {
		setOptionalStringField(telemetry, value, key, field);
	}
}

function readTelemetryNumericFields(value, field, telemetry) {
	for (const key of TELEMETRY_NUMERIC_FIELDS) {
		const normalized = normalizeNonNegativeNumber(value[key], `${field}.${key}`);
		if (normalized !== null) {
			telemetry[key] = normalized;
		}
	}
}

function normalizeTelemetry(value, field) {
	if (value === undefined || value === null) {
		return null;
	}
	if (!value || typeof value !== "object" || Array.isArray(value)) {
		throw new Error(`${field} must be an object`);
	}
	const telemetry = {};
	readTelemetryStringFields(value, field, telemetry);
	readTelemetryNumericFields(value, field, telemetry);
	return Object.keys(telemetry).length > 0 ? telemetry : null;
}

function setOptionalIsoField(target, source, field, label) {
	const value = normalizeIsoTimestamp(source[field], `${label}.${field}`);
	if (value) {
		target[field] = value;
	}
}

function setOptionalDurationField(target, source, label) {
	const durationMs = normalizeNonNegativeNumber(source.durationMs, `${label}.durationMs`);
	if (durationMs !== null) {
		target.durationMs = durationMs;
	}
}

export function normalizeScenarioResult(result, label = "result") {
	if (!result || typeof result !== "object" || Array.isArray(result)) {
		throw new Error(`${label} must be an object`);
	}
	if (typeof result.scenarioId !== "string" || !result.scenarioId.trim()) {
		throw new Error(`${label}.scenarioId must be a non-empty string`);
	}
	const normalized = {
		scenarioId: result.scenarioId,
	};
	setOptionalStringField(normalized, result, "status", label);
	setOptionalNumberField(normalized, result, "overallScore", label);
	setOptionalNumberField(normalized, result, "passRate", label);
	setOptionalIsoField(normalized, result, "timestamp", label);
	setOptionalIsoField(normalized, result, "startedAt", label);
	setOptionalIsoField(normalized, result, "completedAt", label);
	setOptionalDurationField(normalized, result, label);
	const telemetry = normalizeTelemetry(result.telemetry, `${label}.telemetry`);
	if (telemetry) {
		normalized.telemetry = telemetry;
	}
	return normalized;
}

function readEntryValue(entry, field, source) {
	if (source === "result") {
		return typeof entry[field] === "number" ? entry[field] : null;
	}
	return entry.telemetry && typeof entry.telemetry[field] === "number" ? entry.telemetry[field] : null;
}

function sumEntryField(entries, field, source = "telemetry") {
	let seen = false;
	let total = 0;
	for (const entry of entries) {
		const value = readEntryValue(entry, field, source);
		if (value === null) {
			continue;
		}
		seen = true;
		total += value;
	}
	return seen ? Number(total.toFixed(12)) : null;
}

function latestTimestamp(entries) {
	return (
		[...entries]
			.map((entry) => entry.completedAt || entry.timestamp || entry.startedAt || null)
			.filter(Boolean)
			.sort((left, right) => parseIsoTime(right) - parseIsoTime(left))[0] || null
	);
}

function uniqueValues(entries, field) {
	return Array.from(
		new Set(
			entries
				.map((entry) => entry.telemetry && entry.telemetry[field])
				.filter((value) => typeof value === "string" && value.length > 0),
		),
	);
}

function buildTelemetryBreakdown(entries, scenarioId = null) {
	const summary = {
		runCount: entries.length,
		latestTimestamp: latestTimestamp(entries),
	};
	if (scenarioId) {
		summary.scenarioId = scenarioId;
	}
	const totalDurationMs = sumEntryField(entries, "durationMs", "result");
	if (totalDurationMs !== null) {
		summary.totalDurationMs = totalDurationMs;
		summary.averageDurationMs = totalDurationMs / entries.length;
	}
	for (const field of TELEMETRY_NUMERIC_FIELDS) {
		const total = sumEntryField(entries, field, "telemetry");
		if (total !== null) {
			summary[field] = total;
		}
	}
	const providers = uniqueValues(entries, "provider");
	if (providers.length > 0) {
		summary.providers = providers;
	}
	const models = uniqueValues(entries, "model");
	if (models.length > 0) {
		summary.models = models;
	}
	return summary;
}

export function summarizeScenarioTelemetryEntries(entries, { now = new Date(), source = "candidate_results" } = {}) {
	const normalizedEntries = entries.map((entry, index) =>
		normalizeScenarioResult(entry, `entries[${index}]`),
	);
	const grouped = new Map();
	for (const entry of normalizedEntries) {
		const bucket = grouped.get(entry.scenarioId) || [];
		bucket.push(entry);
		grouped.set(entry.scenarioId, bucket);
	}
	const scenarios = [...grouped.entries()]
		.map(([scenarioId, scenarioEntries]) => buildTelemetryBreakdown(scenarioEntries, scenarioId))
		.sort(
			(left, right) =>
				(right.cost_usd ?? -1) - (left.cost_usd ?? -1) ||
				(right.total_tokens ?? -1) - (left.total_tokens ?? -1) ||
				parseIsoTime(right.latestTimestamp) - parseIsoTime(left.latestTimestamp),
		);
	return {
		schemaVersion: SCENARIO_TELEMETRY_SUMMARY_SCHEMA,
		generatedAt: now.toISOString(),
		source,
		overall: {
			scenarioCount: scenarios.length,
			...buildTelemetryBreakdown(normalizedEntries),
		},
		scenarios,
	};
}

export function summarizeScenarioTelemetryFromHistory(history, { now = new Date() } = {}) {
	if (!history || typeof history !== "object" || Array.isArray(history)) {
		throw new Error("history must be an object");
	}
	const entries = [];
	for (const [scenarioId, stat] of Object.entries(history.scenarioStats || {})) {
		for (const result of stat?.recentTrainResults || []) {
			entries.push({
				scenarioId,
				...result,
			});
		}
	}
	return summarizeScenarioTelemetryEntries(entries, { now, source: "scenario_history" });
}
