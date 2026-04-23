import { deriveCodexCostTelemetry } from "./codex-pricing.mjs";

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

function normalizeSessionMode(value) {
	return value === "ephemeral" || value === "persistent" ? value : null;
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

function parseJsonLines(raw) {
	if (typeof raw !== "string" || raw.trim() === "") {
		return [];
	}
	return raw
		.split("\n")
		.map((line) => line.trim())
		.filter(Boolean)
		.flatMap((line) => {
			try {
				const parsed = JSON.parse(line);
				return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? [parsed] : [];
			} catch {
				return [];
			}
		});
}

function codexPayload(entry) {
	if (isObjectRecord(entry?.payload)) {
		return entry.payload;
	}
	if (isObjectRecord(entry?.msg)) {
		if (isObjectRecord(entry.msg.payload)) {
			return entry.msg.payload;
		}
		return entry.msg;
	}
	return {};
}

function codexEntryType(entry) {
	if (typeof entry?.type === "string" && entry.type) {
		return entry.type;
	}
	if (typeof entry?.msg?.type === "string" && entry.msg.type) {
		return entry.msg.type;
	}
	const payloadType = codexPayload(entry).type;
	return typeof payloadType === "string" ? payloadType : null;
}

function codexModelFromPayload(payload) {
	if (!isObjectRecord(payload)) {
		return null;
	}
	return payload.model_name
		?? payload.model
		?? payload.model_info?.slug
		?? payload.info?.model_name
		?? payload.info?.model
		?? null;
}

function codexTotalsFromUsage(usage) {
	if (!isObjectRecord(usage)) {
		return null;
	}
	const input = normalizeNonNegativeInteger(usage.input_tokens) ?? 0;
	const output = normalizeNonNegativeInteger(usage.output_tokens) ?? 0;
	const cachedInput = normalizeNonNegativeInteger(usage.cached_input_tokens);
	const cacheReadInput = normalizeNonNegativeInteger(usage.cache_read_input_tokens);
	const cached = Math.max(cachedInput ?? 0, cacheReadInput ?? 0);
	const reasoning = normalizeNonNegativeInteger(usage.reasoning_output_tokens) ?? 0;
	return {
		input,
		output,
		cached,
		reasoning,
	};
}

function codexTelemetryFromTotals(totals, provider, model, sessionMode) {
	const costTelemetry = deriveCodexCostTelemetry({ provider, model, totals });
	if (!totals) {
		return compactTelemetry({
			provider,
			model,
			session_mode: normalizeSessionMode(sessionMode),
			...(costTelemetry ?? {}),
		});
	}
	const promptTokens = totals.input + totals.cached;
	const completionTokens = totals.output + totals.reasoning;
	return compactTelemetry({
		provider,
		model,
		session_mode: normalizeSessionMode(sessionMode),
		prompt_tokens: promptTokens > 0 ? promptTokens : null,
		completion_tokens: completionTokens > 0 ? completionTokens : null,
		total_tokens: promptTokens + completionTokens > 0 ? promptTokens + completionTokens : null,
		...(costTelemetry ?? {}),
	});
}

function codexTokenTotalsState() {
	return {
		provider: null,
		model: null,
		lastTotals: null,
		summedLastUsage: null,
	};
}

function addCodexUsageTotals(current, next) {
	if (!next) {
		return current;
	}
	if (!current) {
		return next;
	}
	return {
		input: current.input + next.input,
		output: current.output + next.output,
		cached: current.cached + next.cached,
		reasoning: current.reasoning + next.reasoning,
	};
}

function applyCodexSessionMeta(state, payload) {
	return {
		...state,
		provider:
			typeof payload.model_provider === "string" && payload.model_provider.trim()
				? payload.model_provider
				: state.provider,
		model: codexModelFromPayload(payload) ?? state.model,
	};
}

function applyCodexTurnContext(state, payload) {
	return {
		...state,
		model: codexModelFromPayload(payload) ?? state.model,
	};
}

function applyCodexTokenCount(state, payload) {
	return {
		...state,
		lastTotals: codexTotalsFromUsage(payload.info?.total_token_usage) ?? state.lastTotals,
		summedLastUsage: addCodexUsageTotals(
			state.summedLastUsage,
			codexTotalsFromUsage(payload.info?.last_token_usage),
		),
		model: codexModelFromPayload(payload) ?? state.model,
	};
}

function reduceCodexEntry(state, entry) {
	const payload = codexPayload(entry);
	const type = codexEntryType(entry);
	if (type === "session_meta") {
		return applyCodexSessionMeta(state, payload);
	}
	if (type === "turn_context") {
		return applyCodexTurnContext(state, payload);
	}
	if (type === "event_msg" && payload.type === "token_count") {
		return applyCodexTokenCount(state, payload);
	}
	return state;
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
	for (const key of ["provider", "model", "cost_truth", "pricing_source", "pricing_version"]) {
		if (typeof value[key] === "string" && value[key].trim()) {
			telemetry[key] = value[key];
		}
	}
	if (normalizeSessionMode(value.session_mode)) {
		telemetry.session_mode = value.session_mode;
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
	for (const key of ["provider", "model", "cost_truth", "pricing_source", "pricing_version", "session_mode"]) {
		const values = Array.from(new Set(
			telemetryResults
				.map((entry) => {
					if (key === "session_mode") {
						return normalizeSessionMode(entry[key]);
					}
					return typeof entry[key] === "string" && entry[key].trim() ? entry[key] : null;
				})
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

export function extractCodexTelemetry(raw, options = {}) {
	const sessionMode = normalizeSessionMode(options.codexSessionMode) ?? "ephemeral";
	const entries = Array.isArray(raw) ? raw : parseJsonLines(raw);
	if (entries.length === 0) {
		return compactTelemetry({
			model: options.codexModel ?? options.model ?? null,
			session_mode: sessionMode,
		});
	}
	const initialState = {
		...codexTokenTotalsState(),
		model: options.codexModel ?? options.model ?? null,
	};
	const finalState = entries.reduce(reduceCodexEntry, initialState);
	return codexTelemetryFromTotals(
		finalState.lastTotals ?? finalState.summedLastUsage,
		finalState.provider,
		finalState.model,
		sessionMode,
	);
}
