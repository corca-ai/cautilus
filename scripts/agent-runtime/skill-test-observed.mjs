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

function totalTokensForResult(result) {
	const totalTokens = Number(result?.metrics?.total_tokens ?? result?.telemetry?.total_tokens);
	return Number.isFinite(totalTokens) ? totalTokens : null;
}

function cacheReadTokensForResult(result) {
	const cacheReadTokens = Number(result?.telemetry?.cache_read_input_tokens ?? 0);
	return Number.isFinite(cacheReadTokens) ? cacheReadTokens : 0;
}

function uncachedTokensForResult(result) {
	const explicitUncachedTokens = Number(result?.metrics?.uncached_tokens);
	if (Number.isFinite(explicitUncachedTokens)) {
		return explicitUncachedTokens;
	}
	const totalTokens = totalTokensForResult(result);
	if (totalTokens === null) {
		return null;
	}
	return Math.max(0, totalTokens - cacheReadTokensForResult(result));
}

function addUncachedTokenMetrics(metrics, telemetry) {
	if (typeof metrics.total_tokens !== "number") {
		return metrics;
	}
	const cacheReadTokens = Number(telemetry?.cache_read_input_tokens ?? 0);
	const cacheRead = Number.isFinite(cacheReadTokens) ? cacheReadTokens : 0;
	const computedUncachedTokens = Math.round(Math.max(0, metrics.total_tokens - cacheRead));
	const uncachedTokens = metrics.uncached_tokens ?? computedUncachedTokens;
	return {
		...metrics,
		uncached_tokens: uncachedTokens,
		median_run_uncached_tokens: metrics.median_run_uncached_tokens ?? uncachedTokens,
		peak_run_uncached_tokens: metrics.peak_run_uncached_tokens ?? uncachedTokens,
	};
}

export function buildObservedBaseResult(testCase, observed, durationMs, artifactRefs, assertString) {
	const telemetry = normalizeSkillTelemetry(observed?.telemetry);
	const metrics = addUncachedTokenMetrics(
		withTelemetryMetricFallback(normalizeSkillMetrics(observed?.metrics), telemetry),
		telemetry,
	);
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

function aggregateUncachedTokenMetrics(results) {
	const tokenRows = results
		.map((result) => ({
			totalTokens: totalTokensForResult(result),
			cacheReadTokens: cacheReadTokensForResult(result),
		}))
		.filter((row) => row.totalTokens !== null);
	const runUncachedValues = results
		.map(uncachedTokensForResult)
		.filter((value) => value !== null);
	if (runUncachedValues.length === 0) {
		return {};
	}
	const medianTotalTokens = median(tokenRows.map((row) => row.totalTokens));
	const medianCacheReadTokens = median(tokenRows.map((row) => row.cacheReadTokens));
	const aggregateUncachedTokens = medianTotalTokens === null || medianCacheReadTokens === null
		? median(runUncachedValues)
		: Math.max(0, medianTotalTokens - medianCacheReadTokens);
	return {
		uncached_tokens: Math.round(aggregateUncachedTokens),
		median_run_uncached_tokens: Math.round(median(runUncachedValues)),
		peak_run_uncached_tokens: Math.round(Math.max(...runUncachedValues)),
	};
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
	Object.assign(aggregates, aggregateUncachedTokenMetrics(results));
	return Object.keys(aggregates).length > 0 ? aggregates : null;
}
