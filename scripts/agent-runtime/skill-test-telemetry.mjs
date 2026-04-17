function normalizeNonNegativeInteger(value) {
	return Number.isInteger(value) && value >= 0 ? value : null;
}

function normalizeNonNegativeNumber(value) {
	return typeof value === "number" && Number.isFinite(value) && value >= 0 ? value : null;
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

function isObjectRecord(value) {
	return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function claudeModelScore(usage) {
	return (
		normalizeNonNegativeNumber(usage.costUSD) ??
		normalizeNonNegativeInteger(usage.outputTokens) ??
		normalizeNonNegativeInteger(usage.inputTokens) ??
		-1
	);
}

function dominantClaudeModel(modelUsage) {
	if (!isObjectRecord(modelUsage)) {
		return null;
	}
	return Object.entries(modelUsage)
		.filter(([, usage]) => isObjectRecord(usage))
		.map(([model, usage]) => ({ model, score: claudeModelScore(usage) }))
		.sort((left, right) => right.score - left.score)[0]?.model ?? null;
}

function parseClaudeEnvelope(raw) {
	try {
		const parsed = JSON.parse(raw);
		return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? parsed : null;
	} catch {
		return null;
	}
}

function compactTelemetry(telemetry) {
	const compact = {};
	for (const [key, value] of Object.entries(telemetry)) {
		if (value !== null) {
			compact[key] = value;
		}
	}
	return Object.keys(compact).length > 0 ? compact : null;
}

function claudePromptTokens(usage) {
	return [
		normalizeNonNegativeInteger(usage.input_tokens),
		normalizeNonNegativeInteger(usage.cache_creation_input_tokens),
		normalizeNonNegativeInteger(usage.cache_read_input_tokens),
	]
		.filter((value) => value !== null)
		.reduce((sum, value) => sum + value, 0);
}

function claudeTelemetryModel(envelope, options) {
	return dominantClaudeModel(envelope.modelUsage) ?? options.claudeModel ?? options.model ?? null;
}

function normalizeNumericFields(source, keys) {
	const normalized = {};
	for (const key of keys) {
		const numeric = Number(source?.[key]);
		if (!Number.isFinite(numeric) || numeric < 0) {
			continue;
		}
		normalized[key] = key === "cost_usd" ? Number(numeric.toFixed(12)) : Math.round(numeric);
	}
	return Object.keys(normalized).length > 0 ? normalized : null;
}

export function normalizeSkillMetrics(value) {
	return normalizeNumericFields(value, ["total_tokens", "cost_usd"]);
}

export function normalizeSkillTelemetry(value) {
	if (!value || typeof value !== "object" || Array.isArray(value)) {
		return null;
	}
	const telemetry = {};
	for (const key of ["provider", "model"]) {
		if (typeof value[key] === "string" && value[key].trim()) {
			telemetry[key] = value[key];
		}
	}
	return {
		...telemetry,
		...(normalizeNumericFields(value, ["prompt_tokens", "completion_tokens", "total_tokens", "cost_usd"]) ?? {}),
	};
}

export function aggregateSkillTelemetry(results) {
	const telemetryResults = results
		.map((result) => result.telemetry)
		.filter((value) => value && typeof value === "object");
	if (telemetryResults.length === 0) {
		return null;
	}
	const telemetry = {};
	for (const key of ["provider", "model"]) {
		const values = Array.from(new Set(
			telemetryResults
				.map((entry) => (typeof entry[key] === "string" && entry[key].trim() ? entry[key] : null))
				.filter(Boolean),
		));
		if (values.length === 1) {
			telemetry[key] = values[0];
		}
	}
	for (const key of ["prompt_tokens", "completion_tokens", "total_tokens", "cost_usd"]) {
		const values = telemetryResults
			.map((entry) => Number(entry[key]))
			.filter((value) => Number.isFinite(value));
		const value = median(values);
		if (value === null) {
			continue;
		}
		telemetry[key] = key === "cost_usd" ? Number(value.toFixed(12)) : Math.round(value);
	}
	return Object.keys(telemetry).length > 0 ? telemetry : null;
}

export function extractClaudeTelemetry(raw, options = {}) {
	const envelope = typeof raw === "string" ? parseClaudeEnvelope(raw) : raw;
	if (!envelope) {
		return null;
	}
	const usage = isObjectRecord(envelope.usage) ? envelope.usage : {};
	const promptTokens = claudePromptTokens(usage);
	const completionTokens = normalizeNonNegativeInteger(usage.output_tokens);
	return compactTelemetry({
		provider: "anthropic",
		model: claudeTelemetryModel(envelope, options),
		prompt_tokens: promptTokens > 0 ? promptTokens : null,
		completion_tokens: completionTokens,
		total_tokens: completionTokens === null && promptTokens === 0 ? null : promptTokens + (completionTokens ?? 0),
		cost_usd: normalizeNonNegativeNumber(envelope.total_cost_usd),
	});
}
