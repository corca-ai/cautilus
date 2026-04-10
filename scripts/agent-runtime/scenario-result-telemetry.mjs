import { SCENARIO_TELEMETRY_SUMMARY_SCHEMA } from "./contract-versions.mjs";
import { normalizeScenarioResult } from "./scenario-results.mjs";

export { SCENARIO_TELEMETRY_SUMMARY_SCHEMA } from "./contract-versions.mjs";

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
