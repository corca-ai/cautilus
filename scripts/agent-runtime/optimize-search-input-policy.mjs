import { existsSync, readdirSync } from "node:fs";
import { resolve } from "node:path";

import { loadAdapter as loadAdapterPayload, NAMED_ADAPTER_DIRS } from "../resolve_adapter.mjs";

export const SEARCH_BUDGETS = {
	light: {
		generationLimit: 1,
		populationLimit: 3,
		mutationBatchSize: 3,
		reviewCheckpointPolicy: "final_only",
		mergeEnabled: false,
		threeParentPolicy: "coverage_expansion",
	},
	medium: {
		generationLimit: 2,
		populationLimit: 5,
		mutationBatchSize: 4,
		reviewCheckpointPolicy: "frontier_promotions",
		mergeEnabled: false,
		threeParentPolicy: "coverage_expansion",
	},
	heavy: {
		generationLimit: 3,
		populationLimit: 8,
		mutationBatchSize: 5,
		reviewCheckpointPolicy: "frontier_promotions",
		mergeEnabled: false,
		threeParentPolicy: "coverage_expansion",
	},
};

export const REVIEW_CHECKPOINT_POLICIES = new Set(["final_only", "frontier_promotions"]);
export const THREE_PARENT_POLICIES = new Set(["disabled", "coverage_expansion"]);

function asRecord(value) {
	return value && typeof value === "object" && !Array.isArray(value) ? value : {};
}

function isObjectRecord(value) {
	return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function firstNonEmptyString(...values) {
	for (const value of values) {
		if (typeof value === "string" && value.trim() !== "") {
			return value;
		}
	}
	return null;
}

function resolveSelectionOverride(adapterSelectionPolicy, resolveSelectionPolicy) {
	if (!isObjectRecord(adapterSelectionPolicy)) {
		return null;
	}
	return resolveSelectionPolicy({
		primaryObjective: adapterSelectionPolicy.primary_objective,
		tieBreakers: adapterSelectionPolicy.tie_breakers,
		constraintCaps: adapterSelectionPolicy.constraint_caps,
	});
}

function discoverSoleNamedAdapter(repoRoot) {
	const discovered = [];
	for (const directory of NAMED_ADAPTER_DIRS) {
		const absoluteDir = resolve(repoRoot, directory);
		if (!existsSync(absoluteDir)) {
			continue;
		}
		for (const entry of readdirSync(absoluteDir, { withFileTypes: true })) {
			if (entry.isDirectory() || !entry.name.endsWith(".yaml")) {
				continue;
			}
			discovered.push(entry.name.slice(0, -5));
		}
	}
	const unique = [...new Set(discovered)].filter(Boolean);
	return unique.length === 1 ? unique[0] : null;
}

export function resolveAdapterSelection(optimizeInput, evaluationOptions) {
	const report = asRecord(optimizeInput.report);
	const adapterContext = asRecord(report.adapterContext);
	const repoRoot = resolve(optimizeInput.repoRoot);
	const resolvedAdapter = firstNonEmptyString(evaluationOptions.adapter, adapterContext.adapter);
	if (resolvedAdapter) {
		return { adapter: resolvedAdapter, adapterName: null, inferredNamedAdapter: null };
	}
	const resolvedAdapterName = firstNonEmptyString(evaluationOptions.adapterName, adapterContext.adapterName);
	if (resolvedAdapterName) {
		return { adapter: null, adapterName: resolvedAdapterName, inferredNamedAdapter: null };
	}
	return {
		adapter: null,
		adapterName: null,
		inferredNamedAdapter: discoverSoleNamedAdapter(repoRoot),
	};
}

export function loadResolvedAdapter(optimizeInput, evaluationOptions, fail) {
	const repoRoot = resolve(optimizeInput.repoRoot);
	const selection = resolveAdapterSelection(optimizeInput, evaluationOptions);
	const payload = loadAdapterPayload(repoRoot, {
		adapter: selection.adapter,
		adapterName: selection.adapterName ?? selection.inferredNamedAdapter,
	});
	if (!payload.valid) {
		fail(`Adapter is invalid: ${JSON.stringify(payload.errors ?? [])}`);
	}
	return { payload, selection };
}

function toSearchPreset(adapterBudget) {
	if (!isObjectRecord(adapterBudget)) {
		return {};
	}
	const preset = {};
	const numericFields = {
		generation_limit: "generationLimit",
		population_limit: "populationLimit",
		mutation_batch_size: "mutationBatchSize",
	};
	for (const [adapterKey, packetKey] of Object.entries(numericFields)) {
		if (Number.isInteger(adapterBudget[adapterKey]) && adapterBudget[adapterKey] > 0) {
			preset[packetKey] = adapterBudget[adapterKey];
		}
	}
	if (typeof adapterBudget.review_checkpoint_policy === "string" && REVIEW_CHECKPOINT_POLICIES.has(adapterBudget.review_checkpoint_policy)) {
		preset.reviewCheckpointPolicy = adapterBudget.review_checkpoint_policy;
	}
	if (typeof adapterBudget.merge_enabled === "boolean") {
		preset.mergeEnabled = adapterBudget.merge_enabled;
	}
	if (typeof adapterBudget.three_parent_policy === "string" && THREE_PARENT_POLICIES.has(adapterBudget.three_parent_policy)) {
		preset.threeParentPolicy = adapterBudget.three_parent_policy;
	}
	return preset;
}

function applyExplicitOverrides(preset, options) {
	return {
		reviewCheckpointPolicy:
			options.reviewCheckpointExplicit && options.reviewCheckpointPolicy
				? options.reviewCheckpointPolicy
				: preset.reviewCheckpointPolicy,
		mergeEnabled:
			typeof options.mergeEnabled === "boolean"
				? options.mergeEnabled
				: Boolean(preset.mergeEnabled),
		threeParentPolicy:
			options.threeParentExplicit && options.threeParentPolicy
				? options.threeParentPolicy
				: preset.threeParentPolicy,
	};
}

function buildSearchConfigSources(adapterPath, options, presetSource, selectionPolicySource) {
	return {
		adapterPath,
		budget: options.budgetExplicit ? "explicit_override" : options.budgetSource,
		preset: presetSource,
		selectionPolicy: selectionPolicySource,
		reviewCheckpointPolicy: options.reviewCheckpointExplicit ? "explicit_override" : presetSource,
		mergeEnabled: typeof options.mergeEnabled === "boolean" ? "explicit_override" : presetSource,
		threeParentPolicy: options.threeParentExplicit ? "explicit_override" : presetSource,
	};
}

function resolveBudget(options, adapterOptimizeSearch) {
	if (
		!options.budgetExplicit &&
		typeof adapterOptimizeSearch.default_budget === "string" &&
		Object.prototype.hasOwnProperty.call(SEARCH_BUDGETS, adapterOptimizeSearch.default_budget)
	) {
		return {
			budget: adapterOptimizeSearch.default_budget,
			budgetSource: "adapter_default",
		};
	}
	return {
		budget: options.budget,
		budgetSource: "product_default",
	};
}

function resolvePreset(budget, adapterOptimizeSearch) {
	const adapterPreset = toSearchPreset(asRecord(asRecord(adapterOptimizeSearch.budgets)[budget]));
	return {
		preset: {
			...(SEARCH_BUDGETS[budget] ?? SEARCH_BUDGETS.medium),
			...adapterPreset,
		},
		presetSource: Object.keys(adapterPreset).length > 0 ? "adapter_preset" : "product_default",
	};
}

function resolveSelectionPolicySource(options, adapterOptimizeSearch, deriveSelectionPolicy, resolveSelectionPolicy) {
	if (isObjectRecord(options.selectionPolicy)) {
		return {
			selectionPolicy: resolveSelectionPolicy(options.selectionPolicy),
			selectionPolicySource: "explicit_override",
		};
	}
	const selectionOverride = resolveSelectionOverride(adapterOptimizeSearch.selection_policy, resolveSelectionPolicy);
	if (selectionOverride) {
		return {
			selectionPolicy: selectionOverride,
			selectionPolicySource: "adapter_default",
		};
	}
	return {
		selectionPolicy: deriveSelectionPolicy(),
		selectionPolicySource: "product_default",
	};
}

export function defaultThreeParentPolicy() {
	return SEARCH_BUDGETS.medium.threeParentPolicy;
}

export function defaultReviewCheckpointPolicy(budget) {
	return SEARCH_BUDGETS[budget]?.reviewCheckpointPolicy ?? SEARCH_BUDGETS.medium.reviewCheckpointPolicy;
}

export function buildSearchConfig(
	budget,
	preset,
	reviewCheckpointPolicy,
	selectionPolicy,
	mergeEnabled,
	threeParentPolicy,
) {
	return {
		algorithm: "reflective_pareto",
		budget,
		generationLimit: preset.generationLimit,
		populationLimit: preset.populationLimit,
		mutationBatchSize: preset.mutationBatchSize,
		candidateSelection: "pareto",
		reviewCheckpointPolicy,
		fullGateCheckpointPolicy: "final_only",
		selectionPolicy,
		mergeEnabled,
		threeParentPolicy,
	};
}

export function defaultMutationBackends(budget) {
	if (budget === "light") {
		return [{ id: "codex-mutate", backend: "codex_exec" }];
	}
	return [
		{ id: "codex-mutate", backend: "codex_exec" },
		{ id: "claude-mutate", backend: "claude_p" },
	];
}

export function buildMutationConfig(budget, packet) {
	return {
		backends: defaultMutationBackends(budget),
		trainScenarioLimit: Math.max(1, packet.searchConfig.mutationBatchSize - 1),
		promptVariantLimit: packet.searchConfig.mutationBatchSize,
	};
}

export function resolveSearchPolicy(options, adapterPayload, deriveSelectionPolicy, resolveSelectionPolicy) {
	const adapterOptimizeSearch = asRecord(adapterPayload?.data?.optimize_search);
	const { budget, budgetSource } = resolveBudget(options, adapterOptimizeSearch);
	const { preset, presetSource } = resolvePreset(budget, adapterOptimizeSearch);
	const { selectionPolicy, selectionPolicySource } = resolveSelectionPolicySource(
		options,
		adapterOptimizeSearch,
		deriveSelectionPolicy,
		resolveSelectionPolicy,
	);
	const explicitOverrides = applyExplicitOverrides(preset, options);
	return {
		budget,
		preset,
		reviewCheckpointPolicy: explicitOverrides.reviewCheckpointPolicy,
		selectionPolicy,
		mergeEnabled: explicitOverrides.mergeEnabled,
		threeParentPolicy: explicitOverrides.threeParentPolicy,
		searchConfigSources: buildSearchConfigSources(
			adapterPayload?.path ?? null,
			{
				...options,
				budgetSource,
			},
			presetSource,
			selectionPolicySource,
		),
	};
}
