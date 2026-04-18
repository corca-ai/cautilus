import { normalizeSkillMetrics, normalizeSkillTelemetry } from "./skill-test-telemetry.mjs";

function withTelemetryMetricFallback(metrics, telemetry) {
	const normalizedMetrics = { ...(metrics ?? {}) };
	if (telemetry?.total_tokens !== undefined && normalizedMetrics.total_tokens === undefined) {
		normalizedMetrics.total_tokens = telemetry.total_tokens;
	}
	if (telemetry?.cost_usd !== undefined && normalizedMetrics.cost_usd === undefined) {
		normalizedMetrics.cost_usd = telemetry.cost_usd;
	}
	return normalizedMetrics;
}

export function buildObservedBaseResult(testCase, observed, durationMs, artifactRefs, assertString) {
	const telemetry = normalizeSkillTelemetry(observed?.telemetry);
	const metrics = withTelemetryMetricFallback(normalizeSkillMetrics(observed?.metrics), telemetry);
	return {
		invoked: Boolean(observed?.invoked),
		summary: assertString(observed?.summary, "observed.summary"),
		metrics: {
			duration_ms: durationMs,
			...metrics,
		},
		artifactRefs,
		...(telemetry ? { telemetry } : {}),
		...(testCase.thresholds ? { thresholds: testCase.thresholds } : {}),
	};
}

function numericMetricValues(results, metricKey) {
	return results
		.map((result) => Number(result?.metrics?.[metricKey]))
		.filter((value) => Number.isFinite(value));
}

function median(values) {
	if (values.length === 0) {
		return null;
	}
	const sorted = [...values].sort((left, right) => left - right);
	const mid = Math.floor(sorted.length / 2);
	if (sorted.length % 2 === 1) {
		return sorted[mid];
	}
	return (sorted[mid - 1] + sorted[mid]) / 2;
}

export function aggregateObservedMetrics(results) {
	const aggregates = {};
	for (const metricKey of ["duration_ms", "total_tokens", "cost_usd"]) {
		const values = numericMetricValues(results, metricKey);
		if (values.length === 0) {
			continue;
		}
		const value = median(values);
		if (value === null) {
			continue;
		}
		aggregates[metricKey] = metricKey === "cost_usd" ? value : Math.round(value);
	}
	return Object.keys(aggregates).length > 0 ? aggregates : null;
}
