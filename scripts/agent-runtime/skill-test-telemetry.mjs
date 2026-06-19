import { deriveCodexCostTelemetry } from "./codex-pricing.mjs";
import {
	TELEMETRY_NUMERIC_FIELDS,
	TELEMETRY_STRING_FIELDS,
} from "./telemetry-fields.mjs";

export {
	TELEMETRY_NUMERIC_FIELDS,
	TELEMETRY_STRING_FIELDS,
} from "./telemetry-fields.mjs";

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

// Resolve the final `type:"result"` envelope from either a single-object `--output-format json`
// payload or a `--output-format stream-json` JSONL stream (where the result is the last line).
export function resolveClaudeResultEnvelope(raw) {
	if (raw && typeof raw === "object" && !Array.isArray(raw)) {
		return raw;
	}
	const single = parseClaudeEnvelope(raw);
	if (single && (single.type === "result" || single.result !== undefined || isObjectRecord(single.usage))) {
		return single;
	}
	const lines = parseJsonLines(raw);
	for (let index = lines.length - 1; index >= 0; index -= 1) {
		if (lines[index]?.type === "result") {
			return lines[index];
		}
	}
	return single;
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
		cachedInput,
		cacheReadInput,
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
		uncached_input_tokens: totals.input > 0 ? totals.input : null,
		cached_input_tokens: totals.cachedInput,
		cache_read_input_tokens: totals.cacheReadInput,
		prompt_tokens: promptTokens > 0 ? promptTokens : null,
		output_tokens: totals.output > 0 ? totals.output : null,
		reasoning_output_tokens: totals.reasoning > 0 ? totals.reasoning : null,
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

function sumOptionalInteger(left, right) {
	return left === null && right === null ? null : (left ?? 0) + (right ?? 0);
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
		cachedInput: sumOptionalInteger(current.cachedInput, next.cachedInput),
		cacheReadInput: sumOptionalInteger(current.cacheReadInput, next.cacheReadInput),
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
	for (const key of TELEMETRY_STRING_FIELDS) {
		if (typeof value[key] === "string" && value[key].trim()) {
			telemetry[key] = value[key];
		}
	}
	if (normalizeSessionMode(value.session_mode)) {
		telemetry.session_mode = value.session_mode;
	}
	return {
		...telemetry,
		...(normalizeNumericFields(value, TELEMETRY_NUMERIC_FIELDS) ?? {}),
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
	for (const key of [...TELEMETRY_STRING_FIELDS, "session_mode"]) {
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
	for (const key of TELEMETRY_NUMERIC_FIELDS) {
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
	const envelope = resolveClaudeResultEnvelope(raw);
	if (!envelope) {
		return null;
	}
	const usage = isObjectRecord(envelope.usage) ? envelope.usage : {};
	const uncachedInputTokens = normalizeNonNegativeInteger(usage.input_tokens);
	const cacheCreationInputTokens = normalizeNonNegativeInteger(usage.cache_creation_input_tokens);
	const cacheReadInputTokens = normalizeNonNegativeInteger(usage.cache_read_input_tokens);
	const promptTokens = claudePromptTokens(usage);
	const completionTokens = normalizeNonNegativeInteger(usage.output_tokens);
	return compactTelemetry({
		provider: "anthropic",
		model: claudeTelemetryModel(envelope, options),
		uncached_input_tokens: uncachedInputTokens,
		cache_creation_input_tokens: cacheCreationInputTokens,
		cache_read_input_tokens: cacheReadInputTokens,
		prompt_tokens: promptTokens > 0 ? promptTokens : null,
		output_tokens: completionTokens,
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
