import {
	DEPLOYMENT_EVIDENCE_INPUTS_SCHEMA,
	DEPLOYMENT_EVIDENCE_SCHEMA,
	SCENARIO_RESULTS_SCHEMA,
	SKILL_EVALUATION_SUMMARY_SCHEMA,
} from "./contract-versions.mjs";

const DEPLOYMENT_SURFACES = new Set(["chatbot", "skill", "workflow"]);
const SOURCE_KINDS = new Set(["skill_evaluation_summary", "scenario_results"]);

function normalizeNonEmptyString(value, field) {
	if (typeof value !== "string" || !value.trim()) {
		throw new Error(`${field} must be a non-empty string`);
	}
	return value;
}

function normalizeOptionalString(value, field) {
	if (value === undefined || value === null) {
		return null;
	}
	return normalizeNonEmptyString(value, field);
}

function normalizePositiveInteger(value, field, defaultValue = null) {
	if (value === undefined || value === null) {
		return defaultValue;
	}
	const normalized = Number(value);
	if (!Number.isInteger(normalized) || normalized <= 0) {
		throw new Error(`${field} must be a positive integer`);
	}
	return normalized;
}

function normalizeNonNegativeInteger(value, field, defaultValue = null) {
	if (value === undefined || value === null) {
		return defaultValue;
	}
	const normalized = Number(value);
	if (!Number.isInteger(normalized) || normalized < 0) {
		throw new Error(`${field} must be a non-negative integer`);
	}
	return normalized;
}

function normalizeNonNegativeNumber(value, field) {
	if (value === undefined || value === null) {
		return null;
	}
	const normalized = Number(value);
	if (!Number.isFinite(normalized) || normalized < 0) {
		throw new Error(`${field} must be a non-negative number`);
	}
	return normalized;
}

function ratio(numerator, denominator) {
	if (denominator <= 0) {
		return null;
	}
	return Number((numerator / denominator).toFixed(4));
}

function quantile(values, quantileValue) {
	if (values.length === 0) {
		return null;
	}
	const sorted = [...values].sort((left, right) => left - right);
	if (sorted.length === 1) {
		return sorted[0];
	}
	const position = (sorted.length - 1) * quantileValue;
	const lower = Math.floor(position);
	const upper = Math.ceil(position);
	if (lower === upper) {
		return sorted[lower];
	}
	const weight = position - lower;
	return sorted[lower] + (sorted[upper] - sorted[lower]) * weight;
}

function normalizeTelemetry(record, field) {
	if (record === undefined || record === null) {
		return {};
	}
	if (!record || typeof record !== "object" || Array.isArray(record)) {
		throw new Error(`${field} must be an object`);
	}
	const telemetry = {};
	for (const key of ["provider", "model"]) {
		const value = normalizeOptionalString(record[key], `${field}.${key}`);
		if (value !== null) {
			telemetry[key] = value;
		}
	}
	for (const key of ["total_tokens", "cost_usd"]) {
		const value = normalizeNonNegativeNumber(record[key], `${field}.${key}`);
		if (value !== null) {
			telemetry[key] = key === "cost_usd" ? Number(value.toFixed(12)) : Math.round(value);
		}
	}
	return telemetry;
}

function normalizeMetrics(record, field) {
	if (record === undefined || record === null) {
		return {};
	}
	if (!record || typeof record !== "object" || Array.isArray(record)) {
		throw new Error(`${field} must be an object`);
	}
	const metrics = {};
	for (const key of ["duration_ms", "durationMs", "total_tokens", "cost_usd"]) {
		const value = normalizeNonNegativeNumber(record[key], `${field}.${key}`);
		if (value === null) {
			continue;
		}
		if (key === "durationMs") {
			metrics.duration_ms = Math.round(value);
			continue;
		}
		metrics[key] = key === "cost_usd" ? Number(value.toFixed(12)) : Math.round(value);
	}
	return metrics;
}

function normalizeSurface(value, field) {
	const surface = normalizeNonEmptyString(value, field);
	if (!DEPLOYMENT_SURFACES.has(surface)) {
		throw new Error(`${field} must be one of ${[...DEPLOYMENT_SURFACES].join(", ")}`);
	}
	return surface;
}

function normalizeSourceKind(value, field) {
	const sourceKind = normalizeNonEmptyString(value, field);
	if (!SOURCE_KINDS.has(sourceKind)) {
		throw new Error(`${field} must be one of ${[...SOURCE_KINDS].join(", ")}`);
	}
	return sourceKind;
}

function normalizeEvidenceRow(row, index) {
	if (!row || typeof row !== "object" || Array.isArray(row)) {
		throw new Error(`rows[${index}] must be an object`);
	}
	const sampleCount = normalizePositiveInteger(row.sampleCount, `rows[${index}].sampleCount`, 1);
	const successCount = normalizeNonNegativeInteger(row.successCount, `rows[${index}].successCount`, 0);
	if (successCount > sampleCount) {
		throw new Error(`rows[${index}].successCount must be less than or equal to sampleCount`);
	}
	const normalized = {
		surface: normalizeSurface(row.surface, `rows[${index}].surface`),
		scenarioId: normalizeNonEmptyString(row.scenarioId, `rows[${index}].scenarioId`),
		runtime: normalizeNonEmptyString(row.runtime, `rows[${index}].runtime`),
		sourceKind: normalizeSourceKind(row.sourceKind, `rows[${index}].sourceKind`),
		status: normalizeNonEmptyString(row.status, `rows[${index}].status`),
		sampleCount,
		successCount,
	};
	for (const [key, value] of Object.entries({
		scenarioLabel: normalizeOptionalString(row.scenarioLabel, `rows[${index}].scenarioLabel`),
		sourcePath: normalizeOptionalString(row.sourcePath, `rows[${index}].sourcePath`),
		provider: normalizeOptionalString(row.provider, `rows[${index}].provider`),
		model: normalizeOptionalString(row.model, `rows[${index}].model`),
	})) {
		if (value !== null) {
			normalized[key] = value;
		}
	}
	for (const [key, value] of Object.entries({
		duration_ms: normalizeNonNegativeNumber(row.duration_ms, `rows[${index}].duration_ms`),
		total_tokens: normalizeNonNegativeNumber(row.total_tokens, `rows[${index}].total_tokens`),
		cost_usd: normalizeNonNegativeNumber(row.cost_usd, `rows[${index}].cost_usd`),
	})) {
		if (value !== null) {
			normalized[key] = key === "cost_usd" ? Number(value.toFixed(12)) : Math.round(value);
		}
	}
	normalized.successRate = ratio(successCount, sampleCount);
	return normalized;
}

function resolveSkillScenarioLabel(evaluation, index) {
	return normalizeOptionalString(evaluation.displayName, `evaluations[${index}].displayName`) ??
		normalizeNonEmptyString(evaluation.targetId, `evaluations[${index}].targetId`);
}

function skillSampling(evaluation, index) {
	const sampleCount = normalizePositiveInteger(evaluation?.sampling?.sampleCount, `evaluations[${index}].sampling.sampleCount`, 1);
	return {
		sampleCount,
		successCount: normalizeNonNegativeInteger(
			evaluation?.sampling?.passCount,
			`evaluations[${index}].sampling.passCount`,
			evaluation?.status === "passed" ? sampleCount : 0,
		),
	};
}

function buildSkillSummaryRow(evaluation, index, context) {
	const sampling = skillSampling(evaluation, index);
	const metrics = normalizeMetrics(evaluation.metrics, `evaluations[${index}].metrics`);
	const telemetry = normalizeTelemetry(evaluation.telemetry, `evaluations[${index}].telemetry`);
	return {
		surface: context.surface,
		scenarioId: normalizeNonEmptyString(evaluation.evaluationId, `evaluations[${index}].evaluationId`),
		scenarioLabel: resolveSkillScenarioLabel(evaluation, index),
		runtime: context.runtime,
		sourceKind: context.sourceKind,
		status: normalizeNonEmptyString(evaluation.status, `evaluations[${index}].status`),
		sampleCount: sampling.sampleCount,
		successCount: sampling.successCount,
		sourcePath: context.sourcePath ?? null,
		provider: telemetry.provider ?? null,
		model: telemetry.model ?? null,
		duration_ms: metrics.duration_ms ?? null,
		total_tokens: metrics.total_tokens ?? null,
		cost_usd: metrics.cost_usd ?? null,
	};
}

function skillSummaryRows(packet, context) {
	if (packet?.schemaVersion !== SKILL_EVALUATION_SUMMARY_SCHEMA) {
		throw new Error(`skill summary must use schemaVersion ${SKILL_EVALUATION_SUMMARY_SCHEMA}`);
	}
	return (Array.isArray(packet.evaluations) ? packet.evaluations : [])
		.map((evaluation, index) => buildSkillSummaryRow(evaluation, index, context));
}

function scenarioResultRows(packet, context) {
	if (packet?.schemaVersion !== SCENARIO_RESULTS_SCHEMA) {
		throw new Error(`scenario results must use schemaVersion ${SCENARIO_RESULTS_SCHEMA}`);
	}
	const passStatuses = new Set(context.passStatuses ?? ["passed"]);
	return (Array.isArray(packet.results) ? packet.results : []).map((result, index) => {
		const metrics = normalizeMetrics(result, `results[${index}]`);
		const telemetry = normalizeTelemetry(result.telemetry, `results[${index}].telemetry`);
		const status = normalizeNonEmptyString(result.status, `results[${index}].status`);
		return {
			surface: context.surface,
			scenarioId: normalizeNonEmptyString(result.scenarioId, `results[${index}].scenarioId`),
			scenarioLabel:
				normalizeOptionalString(result.displayName, `results[${index}].displayName`) ??
				normalizeNonEmptyString(result.scenarioId, `results[${index}].scenarioId`),
			runtime: context.runtime,
			sourceKind: context.sourceKind,
			status,
			sampleCount: 1,
			successCount: passStatuses.has(status) ? 1 : 0,
			sourcePath: context.sourcePath ?? null,
			provider: telemetry.provider ?? null,
			model: telemetry.model ?? null,
			duration_ms: metrics.duration_ms ?? null,
			total_tokens: telemetry.total_tokens ?? metrics.total_tokens ?? null,
			cost_usd: telemetry.cost_usd ?? metrics.cost_usd ?? null,
		};
	});
}

export function prepareDeploymentEvidenceInput({ surface, runtime, sourceKind, packet, sourcePath = null, passStatuses = null }) {
	const context = {
		surface: normalizeSurface(surface, "surface"),
		runtime: normalizeNonEmptyString(runtime, "runtime"),
		sourceKind: normalizeSourceKind(sourceKind, "sourceKind"),
		sourcePath,
		passStatuses,
	};
	const rows = sourceKind === "skill_evaluation_summary"
		? skillSummaryRows(packet, context)
		: scenarioResultRows(packet, context);
	return {
		schemaVersion: DEPLOYMENT_EVIDENCE_INPUTS_SCHEMA,
		rows: rows.map((row, index) => normalizeEvidenceRow(row, index)),
	};
}

function metricSummary(rows, key, quantileLabel, quantileValue) {
	const values = rows
		.map((row) => Number(row[key]))
		.filter((value) => Number.isFinite(value));
	if (values.length === 0) {
		return {};
	}
	const metric = quantile(values, quantileValue);
	if (metric === null) {
		return {};
	}
	return {
		[`${quantileLabel}_${key}`]: key === "cost_usd" ? Number(metric.toFixed(12)) : Math.round(metric),
	};
}

function summarizeRows(rows, seed = {}) {
	const scenarioCount = new Set(rows.map((row) => row.scenarioId)).size;
	const totalSamples = rows.reduce((sum, row) => sum + row.sampleCount, 0);
	const successfulSamples = rows.reduce((sum, row) => sum + row.successCount, 0);
	const statusCounts = rows.reduce((counts, row) => {
		counts[row.status] = (counts[row.status] ?? 0) + 1;
		return counts;
	}, {});
	const sourceKinds = Array.from(new Set(rows.map((row) => row.sourceKind))).sort();
	return {
		...seed,
		rowCount: rows.length,
		scenarioCount,
		totalSamples,
		successfulSamples,
		successRate: ratio(successfulSamples, totalSamples),
		statusCounts,
		sourceKinds,
		...metricSummary(rows, "duration_ms", "p50", 0.5),
		...metricSummary(rows, "duration_ms", "p90", 0.9),
		...metricSummary(rows, "total_tokens", "p50", 0.5),
		...metricSummary(rows, "total_tokens", "p90", 0.9),
		...metricSummary(rows, "cost_usd", "p50", 0.5),
		...metricSummary(rows, "cost_usd", "p90", 0.9),
	};
}

function groupKey(row) {
	return JSON.stringify({
		surface: row.surface,
		runtime: row.runtime,
		provider: row.provider ?? null,
		model: row.model ?? null,
	});
}

export function buildDeploymentEvidence(input, { now = new Date() } = {}) {
	if (input?.schemaVersion !== DEPLOYMENT_EVIDENCE_INPUTS_SCHEMA) {
		throw new Error(`schemaVersion must be ${DEPLOYMENT_EVIDENCE_INPUTS_SCHEMA}`);
	}
	if (!Array.isArray(input.rows) || input.rows.length === 0) {
		throw new Error("rows must be a non-empty array");
	}
	const rows = input.rows.map((row, index) => normalizeEvidenceRow(row, index))
		.sort((left, right) =>
			left.surface.localeCompare(right.surface) ||
			left.runtime.localeCompare(right.runtime) ||
			left.scenarioId.localeCompare(right.scenarioId),
		);
	const grouped = new Map();
	for (const row of rows) {
		const key = groupKey(row);
		if (!grouped.has(key)) {
			grouped.set(key, []);
		}
		grouped.get(key).push(row);
	}
	const summaries = [...grouped.entries()]
		.map(([key, value]) => summarizeRows(value, JSON.parse(key)))
		.sort((left, right) =>
			left.surface.localeCompare(right.surface) ||
			left.runtime.localeCompare(right.runtime) ||
			String(left.model ?? "").localeCompare(String(right.model ?? "")),
		);
	return {
		schemaVersion: DEPLOYMENT_EVIDENCE_SCHEMA,
		generatedAt: now.toISOString(),
		overall: summarizeRows(rows, {
			surfaceCount: new Set(rows.map((row) => row.surface)).size,
			runtimes: Array.from(new Set(rows.map((row) => row.runtime))).sort(),
			providers: Array.from(new Set(rows.map((row) => row.provider).filter(Boolean))).sort(),
			models: Array.from(new Set(rows.map((row) => row.model).filter(Boolean))).sort(),
		}),
		rows,
		summaries,
	};
}
