import {
	COMPARE_ARTIFACT_SCHEMA,
	SCENARIO_RESULTS_SCHEMA,
} from "./contract-versions.mjs";

const MODE_VALUES = new Set(["iterate", "held_out", "comparison", "full_gate"]);
const RESULT_STATUS_VALUES = new Set(["passed", "failed", "improved", "regressed", "unchanged", "noisy", "missing"]);
const COMPARE_VERDICT_VALUES = new Set(["improved", "regressed", "mixed", "unchanged", "inconclusive"]);
const COMPARE_DELTA_STATUS_VALUES = new Set(["improved", "regressed", "unchanged", "noisy"]);
const TELEMETRY_NUMERIC_FIELDS = ["prompt_tokens", "completion_tokens", "total_tokens", "cost_usd"];

function normalizeNonEmptyString(value, field) {
	if (typeof value !== "string" || !value.trim()) {
		throw new Error(`${field} must be a non-empty string`);
	}
	return value;
}

function normalizeOptionalString(value, field) {
	if (value === undefined || value === null) {
		return undefined;
	}
	return normalizeNonEmptyString(value, field);
}

function normalizeIsoTimestamp(value, field) {
	if (value === undefined || value === null) {
		return undefined;
	}
	if (typeof value !== "string" || !Number.isFinite(Date.parse(value))) {
		throw new Error(`${field} must be a valid ISO timestamp`);
	}
	return value;
}

function normalizeNonNegativeNumber(value, field) {
	if (value === undefined || value === null) {
		return undefined;
	}
	if (typeof value !== "number" || !Number.isFinite(value) || value < 0) {
		throw new Error(`${field} must be a non-negative number`);
	}
	return value;
}

function normalizeResultStatus(value, field) {
	if (value === undefined || value === null) {
		return undefined;
	}
	const status = normalizeNonEmptyString(value, field);
	if (!RESULT_STATUS_VALUES.has(status)) {
		throw new Error(`${field} must be one of ${[...RESULT_STATUS_VALUES].join(", ")}`);
	}
	return status;
}

function normalizeMode(value, field) {
	if (value === undefined || value === null) {
		return undefined;
	}
	const mode = normalizeNonEmptyString(value, field);
	if (!MODE_VALUES.has(mode)) {
		throw new Error(`${field} must be one of ${[...MODE_VALUES].join(", ")}`);
	}
	return mode;
}

function normalizeTelemetry(value, field) {
	if (value === undefined || value === null) {
		return undefined;
	}
	if (!value || typeof value !== "object" || Array.isArray(value)) {
		throw new Error(`${field} must be an object`);
	}
	const telemetry = {};
	for (const key of ["provider", "model"]) {
		const normalized = normalizeOptionalString(value[key], `${field}.${key}`);
		if (normalized !== undefined) {
			telemetry[key] = normalized;
		}
	}
	for (const key of TELEMETRY_NUMERIC_FIELDS) {
		const normalized = normalizeNonNegativeNumber(value[key], `${field}.${key}`);
		if (normalized !== undefined) {
			telemetry[key] = normalized;
		}
	}
	return Object.keys(telemetry).length > 0 ? telemetry : undefined;
}

function assertArray(value, field) {
	if (!Array.isArray(value)) {
		throw new Error(`${field} must be an array`);
	}
	return value;
}

function normalizeScenarioBucketEntry(value, field) {
	if (typeof value === "string") {
		return normalizeNonEmptyString(value, field);
	}
	if (!value || typeof value !== "object" || Array.isArray(value)) {
		throw new Error(`${field} must be a string or object`);
	}
	if (value.scenarioId !== undefined) {
		normalizeNonEmptyString(value.scenarioId, `${field}.scenarioId`);
	}
	if (value.metric !== undefined) {
		normalizeNonEmptyString(value.metric, `${field}.metric`);
	}
	if (value.reason !== undefined) {
		normalizeNonEmptyString(value.reason, `${field}.reason`);
	}
	if (value.summary !== undefined) {
		normalizeNonEmptyString(value.summary, `${field}.summary`);
	}
	return value;
}

function normalizeScenarioBucket(value, field) {
	if (value === undefined || value === null) {
		return [];
	}
	return assertArray(value, field).map((entry, index) =>
		normalizeScenarioBucketEntry(entry, `${field}[${index}]`),
	);
}

function normalizeCompareDelta(value, index, field) {
	if (!value || typeof value !== "object" || Array.isArray(value)) {
		throw new Error(`${field}[${index}] must be an object`);
	}
	const status = normalizeNonEmptyString(value.status, `${field}[${index}].status`);
	if (!COMPARE_DELTA_STATUS_VALUES.has(status)) {
		throw new Error(`${field}[${index}].status must be one of ${[...COMPARE_DELTA_STATUS_VALUES].join(", ")}`);
	}
	const normalized = {
		key: normalizeNonEmptyString(value.key, `${field}[${index}].key`),
		status,
		summary: normalizeNonEmptyString(value.summary, `${field}[${index}].summary`),
	};
	for (const optionalField of ["scenarioId", "metric", "artifactPath"]) {
		const optionalValue = normalizeOptionalString(
			value[optionalField],
			`${field}[${index}].${optionalField}`,
		);
		if (optionalValue !== undefined) {
			normalized[optionalField] = optionalValue;
		}
	}
	for (const numericField of ["baselineValue", "candidateValue"]) {
		const numericValue = normalizeNonNegativeNumber(
			value[numericField],
			`${field}[${index}].${numericField}`,
		);
		if (numericValue !== undefined) {
			normalized[numericField] = numericValue;
		}
	}
	return normalized;
}

function normalizeCompareVerdict(value, field) {
	const verdict = normalizeOptionalString(value, field);
	if (verdict !== undefined && !COMPARE_VERDICT_VALUES.has(verdict)) {
		throw new Error(`${field} must be one of ${[...COMPARE_VERDICT_VALUES].join(", ")}`);
	}
	return verdict;
}

function addCompareBuckets(normalized, value, field) {
	for (const bucketField of ["improved", "regressed", "unchanged", "noisy"]) {
		const bucket = normalizeScenarioBucket(value[bucketField], `${field}.${bucketField}`);
		if (bucket.length > 0) {
			normalized[bucketField] = bucket;
		}
	}
}

function addCompareDeltas(normalized, value, field) {
	const deltas = value.deltas === undefined ? [] : assertArray(value.deltas, `${field}.deltas`);
	if (deltas.length > 0) {
		normalized.deltas = deltas.map((entry, index) => normalizeCompareDelta(entry, index, `${field}.deltas`));
	}
}

function addCompareArtifactPaths(normalized, value, field) {
	const artifactPaths = value.artifactPaths === undefined ? [] : assertArray(value.artifactPaths, `${field}.artifactPaths`);
	if (artifactPaths.length > 0) {
		normalized.artifactPaths = artifactPaths.map((entry, index) =>
			normalizeNonEmptyString(entry, `${field}.artifactPaths[${index}]`),
		);
	}
}

export function normalizeCompareArtifact(value, field = "compareArtifact") {
	if (value === undefined || value === null) {
		return undefined;
	}
	if (!value || typeof value !== "object" || Array.isArray(value)) {
		throw new Error(`${field} must be an object`);
	}
	if (value.schemaVersion !== COMPARE_ARTIFACT_SCHEMA) {
		throw new Error(`${field}.schemaVersion must be ${COMPARE_ARTIFACT_SCHEMA}`);
	}
	const verdict = normalizeCompareVerdict(value.verdict, `${field}.verdict`);
	const normalized = {
		schemaVersion: COMPARE_ARTIFACT_SCHEMA,
		summary: normalizeNonEmptyString(value.summary, `${field}.summary`),
	};
	const generatedAt = normalizeIsoTimestamp(value.generatedAt, `${field}.generatedAt`);
	if (generatedAt !== undefined) {
		normalized.generatedAt = generatedAt;
	}
	if (verdict !== undefined) {
		normalized.verdict = verdict;
	}
	addCompareBuckets(normalized, value, field);
	addCompareDeltas(normalized, value, field);
	addCompareArtifactPaths(normalized, value, field);
	return normalized;
}

function addScenarioResultMetrics(normalized, result, label) {
	const overallScore = normalizeNonNegativeNumber(result.overallScore, `${label}.overallScore`);
	if (overallScore !== undefined) {
		normalized.overallScore = overallScore;
	}
	const passRate = normalizeNonNegativeNumber(result.passRate, `${label}.passRate`);
	if (passRate !== undefined) {
		if (passRate > 1) {
			throw new Error(`${label}.passRate must be <= 1`);
		}
		normalized.passRate = passRate;
	}
}

function addScenarioResultTimes(normalized, result, label) {
	for (const field of ["timestamp", "startedAt", "completedAt"]) {
		const normalizedValue = normalizeIsoTimestamp(result[field], `${label}.${field}`);
		if (normalizedValue !== undefined) {
			normalized[field] = normalizedValue;
		}
	}
	const durationMs = normalizeNonNegativeNumber(result.durationMs, `${label}.durationMs`);
	if (durationMs !== undefined) {
		normalized.durationMs = durationMs;
	}
}

export function normalizeScenarioResult(result, label = "result") {
	if (!result || typeof result !== "object" || Array.isArray(result)) {
		throw new Error(`${label} must be an object`);
	}
	const normalized = {
		scenarioId: normalizeNonEmptyString(result.scenarioId, `${label}.scenarioId`),
	};
	const status = normalizeResultStatus(result.status, `${label}.status`);
	if (status !== undefined) {
		normalized.status = status;
	}
	addScenarioResultMetrics(normalized, result, label);
	addScenarioResultTimes(normalized, result, label);
	const telemetry = normalizeTelemetry(result.telemetry, `${label}.telemetry`);
	if (telemetry !== undefined) {
		normalized.telemetry = telemetry;
	}
	return normalized;
}

export function normalizeScenarioResultsPacket(value, field = "scenarioResults") {
	if (!value || typeof value !== "object" || Array.isArray(value)) {
		throw new Error(`${field} must be an object`);
	}
	if (value.schemaVersion !== SCENARIO_RESULTS_SCHEMA) {
		throw new Error(`${field}.schemaVersion must be ${SCENARIO_RESULTS_SCHEMA}`);
	}
	const normalized = {
		schemaVersion: SCENARIO_RESULTS_SCHEMA,
		results: assertArray(value.results, `${field}.results`).map((entry, index) =>
			normalizeScenarioResult(entry, `${field}.results[${index}]`),
		),
	};
	const source = normalizeOptionalString(value.source, `${field}.source`);
	if (source !== undefined) {
		normalized.source = source;
	}
	const generatedAt = normalizeIsoTimestamp(value.generatedAt, `${field}.generatedAt`);
	if (generatedAt !== undefined) {
		normalized.generatedAt = generatedAt;
	}
	const mode = normalizeMode(value.mode, `${field}.mode`);
	if (mode !== undefined) {
		normalized.mode = mode;
	}
	const compareArtifact = normalizeCompareArtifact(value.compareArtifact, `${field}.compareArtifact`);
	if (compareArtifact !== undefined) {
		normalized.compareArtifact = compareArtifact;
	}
	return normalized;
}
