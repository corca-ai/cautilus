import { readFileSync } from "node:fs";

export const EXECUTION_STATUSES = new Set(["passed", "failed", "degraded", "blocked"]);

export function parseJsonFile(path) {
	try {
		return JSON.parse(readFileSync(path, "utf-8"));
	} catch (error) {
		throw new Error(`Failed to read JSON from ${path}: ${error.message}`);
	}
}

export function normalizeNonEmptyString(value, field) {
	if (typeof value !== "string" || !value.trim()) {
		throw new Error(`${field} must be a non-empty string`);
	}
	return value.trim();
}

export function normalizeOptionalString(value, field) {
	if (value === undefined || value === null) {
		return null;
	}
	return normalizeNonEmptyString(value, field);
}

export function normalizeOptionalIsoTime(value, field) {
	const text = normalizeOptionalString(value, field);
	if (!text) {
		return null;
	}
	if (!Number.isFinite(Date.parse(text))) {
		throw new Error(`${field} must be a valid ISO timestamp`);
	}
	return text;
}

export function normalizeBoolean(value, field) {
	if (typeof value !== "boolean") {
		throw new Error(`${field} must be a boolean`);
	}
	return value;
}

export function normalizeNonNegativeNumber(value, field) {
	if (value === undefined || value === null) {
		return null;
	}
	if (typeof value !== "number" || !Number.isFinite(value) || value < 0) {
		throw new Error(`${field} must be a non-negative number`);
	}
	return value;
}

export function normalizeOptionalMetrics(value, field) {
	if (value === undefined || value === null) {
		return null;
	}
	if (!value || typeof value !== "object" || Array.isArray(value)) {
		throw new Error(`${field} must be an object`);
	}
	const metrics = {};
	const totalTokens = normalizeNonNegativeNumber(value.total_tokens, `${field}.total_tokens`);
	const durationMs = normalizeNonNegativeNumber(value.duration_ms, `${field}.duration_ms`);
	const costUsd = normalizeNonNegativeNumber(value.cost_usd, `${field}.cost_usd`);
	if (totalTokens !== null) {
		metrics.total_tokens = totalTokens;
	}
	if (durationMs !== null) {
		metrics.duration_ms = durationMs;
	}
	if (costUsd !== null) {
		metrics.cost_usd = costUsd;
	}
	return Object.keys(metrics).length > 0 ? metrics : null;
}

export function normalizeOptionalSessionMode(value, field) {
	const sessionMode = normalizeOptionalString(value, field);
	if (sessionMode === null) {
		return null;
	}
	if (!["ephemeral", "persistent"].includes(sessionMode)) {
		throw new Error(`${field} must be ephemeral or persistent`);
	}
	return sessionMode;
}

export function normalizeOptionalTelemetry(value, field) {
	if (value === undefined || value === null) {
		return null;
	}
	if (!value || typeof value !== "object" || Array.isArray(value)) {
		throw new Error(`${field} must be an object`);
	}
	const telemetry = {};
	for (const key of ["provider", "model", "cost_truth", "pricing_source", "pricing_version"]) {
		const normalized = normalizeOptionalString(value[key], `${field}.${key}`);
		if (normalized !== null) {
			telemetry[key] = normalized;
		}
	}
	const sessionMode = normalizeOptionalSessionMode(value.session_mode, `${field}.session_mode`);
	if (sessionMode !== null) {
		telemetry.session_mode = sessionMode;
	}
	for (const key of ["prompt_tokens", "completion_tokens", "total_tokens", "cost_usd"]) {
		const normalized = normalizeNonNegativeNumber(value[key], `${field}.${key}`);
		if (normalized !== null) {
			telemetry[key] = normalized;
		}
	}
	return Object.keys(telemetry).length > 0 ? telemetry : null;
}

export function normalizeOptionalThresholds(value, field) {
	if (value === undefined || value === null) {
		return null;
	}
	if (!value || typeof value !== "object" || Array.isArray(value)) {
		throw new Error(`${field} must be an object`);
	}
	const thresholds = {};
	const maxTokens = normalizeNonNegativeNumber(value.max_total_tokens, `${field}.max_total_tokens`);
	const maxDuration = normalizeNonNegativeNumber(value.max_duration_ms, `${field}.max_duration_ms`);
	const maxCost = normalizeNonNegativeNumber(value.max_cost_usd, `${field}.max_cost_usd`);
	if (maxTokens !== null) {
		thresholds.max_total_tokens = maxTokens;
	}
	if (maxDuration !== null) {
		thresholds.max_duration_ms = maxDuration;
	}
	if (maxCost !== null) {
		thresholds.max_cost_usd = maxCost;
	}
	return Object.keys(thresholds).length > 0 ? thresholds : null;
}

export function assertObjectRecord(value, field) {
	if (!value || typeof value !== "object" || Array.isArray(value)) {
		throw new Error(`${field} must be an object`);
	}
}

function normalizeSamplingCounts(value, field, sampling) {
	for (const key of ["consensusCount", "matchingCount", "invokedCount"]) {
		const count = normalizeNonNegativeNumber(value[key], `${field}.${key}`);
		if (count === null) {
			continue;
		}
		if (!Number.isInteger(count)) {
			throw new Error(`${field}.${key} must be an integer`);
		}
		sampling[key] = count;
	}
}

function normalizeSamplingStatusCounts(value, field) {
	if (value.statusCounts === undefined || value.statusCounts === null) {
		return null;
	}
	assertObjectRecord(value.statusCounts, `${field}.statusCounts`);
	const statusCounts = {};
	for (const status of EXECUTION_STATUSES) {
		const count = normalizeNonNegativeNumber(value.statusCounts[status], `${field}.statusCounts.${status}`);
		if (count === null) {
			continue;
		}
		if (!Number.isInteger(count)) {
			throw new Error(`${field}.statusCounts.${status} must be an integer`);
		}
		statusCounts[status] = count;
	}
	return Object.keys(statusCounts).length > 0 ? statusCounts : null;
}

export function normalizeOptionalSampling(value, field) {
	if (value === undefined || value === null) {
		return null;
	}
	assertObjectRecord(value, field);
	const sampleCount = normalizeNonNegativeNumber(value.sampleCount, `${field}.sampleCount`);
	if (sampleCount === null || !Number.isInteger(sampleCount) || sampleCount < 1) {
		throw new Error(`${field}.sampleCount must be a positive integer`);
	}
	const sampling = { sampleCount };
	normalizeSamplingCounts(value, field, sampling);
	if (value.stable !== undefined && value.stable !== null) {
		sampling.stable = normalizeBoolean(value.stable, `${field}.stable`);
	}
	const statusCounts = normalizeSamplingStatusCounts(value, field);
	if (statusCounts) {
		sampling.statusCounts = statusCounts;
	}
	return sampling;
}

export function normalizeOptionalBaseline(value, field) {
	if (value === undefined || value === null) {
		return null;
	}
	if (!value || typeof value !== "object" || Array.isArray(value)) {
		throw new Error(`${field} must be an object`);
	}
	return {
		invoked: normalizeBoolean(value.invoked, `${field}.invoked`),
		summary: normalizeOptionalString(value.summary, `${field}.summary`),
		outcome: normalizeOptionalString(value.outcome, `${field}.outcome`),
		metrics: normalizeOptionalMetrics(value.metrics, `${field}.metrics`),
	};
}

export function normalizeArtifactRefs(value, field) {
	if (value === undefined || value === null) {
		return [];
	}
	if (!Array.isArray(value)) {
		throw new Error(`${field} must be an array`);
	}
	return value.map((entry, index) => {
		if (!entry || typeof entry !== "object" || Array.isArray(entry)) {
			throw new Error(`${field}[${index}] must be an object`);
		}
		const kind = normalizeNonEmptyString(entry.kind, `${field}[${index}].kind`);
		const path = normalizeNonEmptyString(entry.path, `${field}[${index}].path`);
		return { kind, path };
	});
}
