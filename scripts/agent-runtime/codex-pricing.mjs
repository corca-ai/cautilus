const PRICING_VERSION = "2026-04-19";
const PRICING_SOURCE = "openai_api_pricing";

const MODEL_PRICING = new Map([
	[
		"gpt-5.4",
		{
			inputCostPerToken: 2.5 / 1_000_000,
			cachedInputCostPerToken: 0.25 / 1_000_000,
			outputCostPerToken: 15 / 1_000_000,
		},
	],
	[
		"gpt-5.4-mini",
		{
			inputCostPerToken: 0.75 / 1_000_000,
			cachedInputCostPerToken: 0.075 / 1_000_000,
			outputCostPerToken: 4.5 / 1_000_000,
		},
	],
	[
		"gpt-5.4-nano",
		{
			inputCostPerToken: 0.2 / 1_000_000,
			cachedInputCostPerToken: 0.02 / 1_000_000,
			outputCostPerToken: 1.25 / 1_000_000,
		},
	],
]);

const MODEL_ALIASES = new Map([
	["gpt 5.4", "gpt-5.4"],
	["gpt 5.4 mini", "gpt-5.4-mini"],
	["gpt 5.4 nano", "gpt-5.4-nano"],
]);

function normalizeModelId(model) {
	if (typeof model !== "string" || !model.trim()) {
		return null;
	}
	const canonical = model.trim().toLowerCase().replace(/[_\s]+/g, "-");
	if (MODEL_PRICING.has(canonical)) {
		return canonical;
	}
	return MODEL_ALIASES.get(canonical.replace(/-/g, " ")) ?? null;
}

function round12(value) {
	return Number(value.toFixed(12));
}

export function deriveCodexCostTelemetry({ provider, model, totals }) {
	if (typeof provider === "string" && provider.trim() && provider !== "openai") {
		return null;
	}
	const resolvedModel = normalizeModelId(model);
	if (!resolvedModel || !totals) {
		return null;
	}
	const pricing = MODEL_PRICING.get(resolvedModel);
	if (!pricing) {
		return null;
	}
	const input = totals.input ?? 0;
	const cached = totals.cached ?? 0;
	const output = (totals.output ?? 0) + (totals.reasoning ?? 0);
	const costUsd = (
		(input * pricing.inputCostPerToken) +
		(cached * pricing.cachedInputCostPerToken) +
		(output * pricing.outputCostPerToken)
	);
	return {
		cost_usd: round12(costUsd),
		cost_truth: "derived_pricing",
		pricing_source: PRICING_SOURCE,
		pricing_version: PRICING_VERSION,
	};
}

