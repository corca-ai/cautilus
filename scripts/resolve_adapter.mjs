import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import process from "node:process";
import { pathToFileURL } from "node:url";

import { validateInstanceDiscovery, validateLiveRunInvocation } from "./_adapter_workbench.mjs";
import { loadFile } from "./_stdlib_yaml.mjs";

export const ADAPTER_CANDIDATES = [
	".agents/cautilus-adapter.yaml",
	".codex/cautilus-adapter.yaml",
	".claude/cautilus-adapter.yaml",
	"docs/cautilus-adapter.yaml",
	"cautilus-adapter.yaml",
];

export const NAMED_ADAPTER_DIRS = [
	".agents/cautilus-adapters",
	".codex/cautilus-adapters",
	".claude/cautilus-adapters",
	"docs/cautilus-adapters",
	"cautilus-adapters",
];

const STRING_LIST_FIELDS = [
	"evaluation_surfaces",
	"baseline_options",
	"required_prerequisites",
	"preflight_commands",
	"eval_test_command_templates",
	"artifact_paths",
	"report_paths",
	"comparison_questions",
];

const INTEGER_FIELDS = [
	"version",
	"review_timeout_ms",
];

const STRING_FIELDS = [
	"repo",
	"history_file_hint",
	"profile_default",
	"default_prompt_file",
	"default_schema_file",
	"evaluation_input_default",
];

const EXECUTOR_VARIANT_STRING_FIELDS = [
	"id",
	"tool",
	"command_template",
];

const EXECUTOR_VARIANT_OPTIONAL_STRING_FIELDS = ["purpose"];
const EXECUTOR_VARIANT_STRING_LIST_FIELDS = ["required_prerequisites", "safety_notes"];
const OPTIMIZE_SEARCH_BUDGETS = new Set(["light", "medium", "heavy"]);
const REVIEW_CHECKPOINT_POLICIES = new Set(["final_only", "frontier_promotions"]);
const THREE_PARENT_POLICIES = new Set(["disabled", "coverage_expansion"]);

function fail(message) {
	process.stderr.write(`${message}\n`);
	process.exit(1);
}

function stringList(value, field, errors) {
	if (value === undefined || value === null) {
		return null;
	}
	if (!Array.isArray(value) || value.some((item) => typeof item !== "string")) {
		errors.push(`${field} must be a list of strings`);
		return null;
	}
	return [...value];
}

function intValue(value, field, errors) {
	if (value === undefined || value === null) {
		return null;
	}
	if (!Number.isInteger(value)) {
		errors.push(`${field} must be an integer`);
		return null;
	}
	return value;
}

function validateReviewPrompts(value, errors) {
	if (value === undefined || value === null) {
		return null;
	}
	if (!Array.isArray(value)) {
		errors.push("human_review_prompts must be a list");
		return null;
	}
	const prompts = [];
	for (const [index, item] of value.entries()) {
		if (!item || typeof item !== "object" || Array.isArray(item)) {
			errors.push(`human_review_prompts[${index}] must be a mapping`);
			continue;
		}
		const promptId = item.id;
		const prompt = item.prompt;
		if (typeof promptId !== "string" || typeof prompt !== "string") {
			errors.push(`human_review_prompts[${index}] must include string id and prompt`);
			continue;
		}
		prompts.push({ id: promptId, prompt });
	}
	return prompts;
}

function validateRequiredVariantStrings(item, index, errors, variant) {
	let missingRequired = false;
	for (const field of EXECUTOR_VARIANT_STRING_FIELDS) {
		const fieldValue = item[field];
		if (typeof fieldValue !== "string" || !fieldValue.trim()) {
			errors.push(`executor_variants[${index}].${field} must be a non-empty string`);
			missingRequired = true;
			continue;
		}
		variant[field] = fieldValue;
	}
	return missingRequired;
}

function validateOptionalVariantStrings(item, index, errors, variant) {
	for (const field of EXECUTOR_VARIANT_OPTIONAL_STRING_FIELDS) {
		const fieldValue = item[field];
		if (fieldValue === undefined || fieldValue === null) {
			continue;
		}
		if (typeof fieldValue !== "string") {
			errors.push(`executor_variants[${index}].${field} must be a string`);
			continue;
		}
		variant[field] = fieldValue;
	}
}

function validateVariantStringLists(item, index, errors, variant) {
	for (const field of EXECUTOR_VARIANT_STRING_LIST_FIELDS) {
		const fieldValue = stringList(item[field], `executor_variants[${index}].${field}`, errors);
		if (fieldValue !== null) {
			variant[field] = fieldValue;
		}
	}
}

function validateExecutorVariant(item, index, errors) {
	if (!item || typeof item !== "object" || Array.isArray(item)) {
		errors.push(`executor_variants[${index}] must be a mapping`);
		return null;
	}
	const variant = {};
	const missingRequired = validateRequiredVariantStrings(item, index, errors, variant);
	validateOptionalVariantStrings(item, index, errors, variant);
	validateVariantStringLists(item, index, errors, variant);
	return missingRequired ? null : variant;
}

function validateExecutorVariants(value, errors) {
	if (value === undefined || value === null) {
		return null;
	}
	if (!Array.isArray(value)) {
		errors.push("executor_variants must be a list");
		return null;
	}
	const variants = [];
	for (const [index, item] of value.entries()) {
		const variant = validateExecutorVariant(item, index, errors);
		if (variant) {
			variants.push(variant);
		}
	}
	return variants;
}

function isObjectRecord(value) {
	return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function nonNegativeNumber(value, field, errors) {
	if (value === undefined || value === null) {
		return null;
	}
	if (typeof value !== "number" || !Number.isFinite(value) || value < 0) {
		errors.push(`${field} must be a non-negative number`);
		return null;
	}
	return value;
}

function positiveInteger(value, field, errors) {
	if (value === undefined || value === null) {
		return null;
	}
	if (!Number.isInteger(value) || value <= 0) {
		errors.push(`${field} must be a positive integer`);
		return null;
	}
	return value;
}

function nonEmptyString(value, field, errors) {
	if (value === undefined || value === null) {
		return null;
	}
	if (typeof value !== "string" || !value.trim()) {
		errors.push(`${field} must be a non-empty string`);
		return null;
	}
	return value.trim();
}

function validateOptimizeSearchBudget(name, value, errors) {
	if (!isObjectRecord(value)) {
		errors.push(`optimize_search.budgets.${name} must be a mapping`);
		return null;
	}
	const budget = {};
	validateOptimizeSearchBudgetNumbers(name, value, budget, errors);
	validateEnumStringField(
		value.review_checkpoint_policy,
		`optimize_search.budgets.${name}.review_checkpoint_policy`,
		REVIEW_CHECKPOINT_POLICIES,
		errors,
		budget,
		"review_checkpoint_policy",
	);
	validateBooleanField(
		value.merge_enabled,
		`optimize_search.budgets.${name}.merge_enabled`,
		errors,
		budget,
		"merge_enabled",
	);
	validateEnumStringField(
		value.three_parent_policy,
		`optimize_search.budgets.${name}.three_parent_policy`,
		THREE_PARENT_POLICIES,
		errors,
		budget,
		"three_parent_policy",
	);
	return budget;
}

function validateOptimizeSearchBudgetNumbers(name, value, budget, errors) {
	for (const field of ["generation_limit", "population_limit", "mutation_batch_size"]) {
		const normalized = positiveInteger(value[field], `optimize_search.budgets.${name}.${field}`, errors);
		if (normalized !== null) {
			budget[field] = normalized;
		}
	}
}

function validateEnumStringField(value, field, allowedValues, errors, target, targetKey) {
	const normalized = nonEmptyString(value, field, errors);
	if (normalized === null) {
		return;
	}
	if (!allowedValues.has(normalized)) {
		errors.push(`${field} must be one of: ${[...allowedValues].join(", ")}`);
		return;
	}
	target[targetKey] = normalized;
}

function validateBooleanField(value, field, errors, target, targetKey) {
	if (value === undefined || value === null) {
		return;
	}
	if (typeof value !== "boolean") {
		errors.push(`${field} must be a boolean`);
		return;
	}
	target[targetKey] = value;
}

function validateOptimizeSearchBudgets(value, errors) {
	if (value === undefined || value === null) {
		return null;
	}
	if (!isObjectRecord(value)) {
		errors.push("optimize_search.budgets must be a mapping");
		return null;
	}
	const budgets = {};
	for (const [name, budgetValue] of Object.entries(value)) {
		if (!OPTIMIZE_SEARCH_BUDGETS.has(name)) {
			errors.push(`optimize_search.budgets.${name} is not a supported tier`);
			continue;
		}
		const normalized = validateOptimizeSearchBudget(name, budgetValue, errors);
		if (normalized) {
			budgets[name] = normalized;
		}
	}
	return budgets;
}

function validateOptimizeSearchSelectionPolicy(value, errors) {
	if (value === undefined || value === null) {
		return null;
	}
	if (!isObjectRecord(value)) {
		errors.push("optimize_search.selection_policy must be a mapping");
		return null;
	}
	const selectionPolicy = {};
	const primaryObjective = nonEmptyString(
		value.primary_objective,
		"optimize_search.selection_policy.primary_objective",
		errors,
	);
	if (primaryObjective !== null) {
		selectionPolicy.primary_objective = primaryObjective;
	}
	const tieBreakers = stringList(value.tie_breakers, "optimize_search.selection_policy.tie_breakers", errors);
	if (tieBreakers !== null) {
		selectionPolicy.tie_breakers = tieBreakers;
	}
	if (value.constraint_caps !== undefined && value.constraint_caps !== null) {
		if (!isObjectRecord(value.constraint_caps)) {
			errors.push("optimize_search.selection_policy.constraint_caps must be a mapping");
		} else {
			constraintCapsFromEntries(Object.entries(value.constraint_caps), errors, selectionPolicy);
		}
	}
	return selectionPolicy;
}

function constraintCapsFromEntries(entries, errors, selectionPolicy) {
	const constraintCaps = {};
	for (const [key, rawValue] of entries) {
		const normalized = nonNegativeNumber(
			rawValue,
			`optimize_search.selection_policy.constraint_caps.${key}`,
			errors,
		);
		if (normalized !== null) {
			constraintCaps[key] = normalized;
		}
	}
	selectionPolicy.constraint_caps = constraintCaps;
}

function validateOptimizeSearch(value, errors) {
	if (value === undefined || value === null) {
		return null;
	}
	if (!isObjectRecord(value)) {
		errors.push("optimize_search must be a mapping");
		return null;
	}
	const optimizeSearch = {};
	validateEnumStringField(
		value.default_budget,
		"optimize_search.default_budget",
		OPTIMIZE_SEARCH_BUDGETS,
		errors,
		optimizeSearch,
		"default_budget",
	);
	const budgets = validateOptimizeSearchBudgets(value.budgets, errors);
	if (budgets !== null) {
		optimizeSearch.budgets = budgets;
	}
	const selectionPolicy = validateOptimizeSearchSelectionPolicy(value.selection_policy, errors);
	if (selectionPolicy !== null) {
		optimizeSearch.selection_policy = selectionPolicy;
	}
	return optimizeSearch;
}

function copyTypedStringFields(data, target, errors) {
	for (const field of STRING_FIELDS) {
		const value = data[field];
		if (value === undefined || value === null) {
			continue;
		}
		if (typeof value !== "string") {
			errors.push(`${field} must be a string`);
			continue;
		}
		target[field] = value;
	}
}

function copyTypedIntegerFields(data, target, errors) {
	for (const field of INTEGER_FIELDS) {
		const value = intValue(data[field], field, errors);
		if (value !== null) {
			target[field] = value;
		}
	}
}

function copyTypedStringListFields(data, target, errors) {
	for (const field of STRING_LIST_FIELDS) {
		const items = stringList(data[field], field, errors);
		if (items !== null) {
			target[field] = items;
		}
	}
}

export function validateAdapterData(data) {
	const errors = [];
	const validated = {};

	copyTypedStringFields(data, validated, errors);
	copyTypedIntegerFields(data, validated, errors);
	copyTypedStringListFields(data, validated, errors);

	const reviewPrompts = validateReviewPrompts(data.human_review_prompts, errors);
	if (reviewPrompts !== null) {
		validated.human_review_prompts = reviewPrompts;
	}

	const executorVariants = validateExecutorVariants(data.executor_variants, errors);
	if (executorVariants !== null) {
		validated.executor_variants = executorVariants;
	}

	const optimizeSearch = validateOptimizeSearch(data.optimize_search, errors);
	if (optimizeSearch !== null) {
		validated.optimize_search = optimizeSearch;
	}

	const instanceDiscovery = validateInstanceDiscovery(data.instance_discovery, errors);
	if (instanceDiscovery !== null) {
		validated.instance_discovery = instanceDiscovery;
	}

	const liveRunInvocation = validateLiveRunInvocation(data.live_run_invocation, errors);
	if (liveRunInvocation !== null) {
		validated.live_run_invocation = liveRunInvocation;
	}

	return { validated, errors };
}

export function inferRepoDefaults(repoRoot) {
	const inferred = {};
	const packageJson = resolve(repoRoot, "package.json");
	if (!existsSync(packageJson)) {
		return inferred;
	}

	const packageData = JSON.parse(readFileSync(packageJson, "utf-8"));
	const scripts = packageData.scripts;
	if (!scripts || typeof scripts !== "object" || Array.isArray(scripts)) {
		return inferred;
	}

	if (typeof scripts.check === "string") {
		inferred.preflight_commands = ["npm run check"];
	}

	const reportPath = resolve(repoRoot, "specs/report/audit-report.html");
	if (existsSync(reportPath)) {
		inferred.report_paths = ["specs/report/audit-report.html"];
	}

	inferred.repo = repoRoot.split(/[\\/]/u).at(-1);
	inferred.history_file_hint = "/tmp/cautilus-history.json";
	return inferred;
}

export function namedAdapterCandidates(adapterName) {
	return NAMED_ADAPTER_DIRS.map((directory) => `${directory}/${adapterName}.yaml`);
}

export function findAdapter(repoRoot, candidates = ADAPTER_CANDIDATES) {
	for (const candidate of candidates) {
		const adapterPath = resolve(repoRoot, candidate);
		if (existsSync(adapterPath)) {
			return adapterPath;
		}
	}
	return null;
}

function resolveAdapterLookup(repoRoot, adapter, adapterName) {
	if (adapter) {
		const adapterPath = resolve(repoRoot, adapter);
		return {
			adapterPath,
			searchedPaths: [adapterPath],
		};
	}
	const candidates = adapterName ? namedAdapterCandidates(adapterName) : ADAPTER_CANDIDATES;
	return {
		adapterPath: findAdapter(repoRoot, candidates),
		searchedPaths: candidates.map((candidate) => resolve(repoRoot, candidate)),
	};
}

function missingAdapterPayload(repoRoot, adapterName, searchedPaths) {
	return {
		found: false,
		valid: true,
		path: null,
		data: inferRepoDefaults(repoRoot),
		errors: [],
		warnings: [
			adapterName
				? `No named cautilus adapter '${adapterName}' found. Falling back to inferred defaults.`
				: "No cautilus adapter found. Falling back to inferred defaults.",
		],
		searched_paths: searchedPaths,
	};
}

function adapterFilePayload(adapterPath, searchedPaths) {
	const raw = loadFile(adapterPath);
	const rawData = raw && typeof raw === "object" && !Array.isArray(raw) ? raw : {};
	const warnings =
		raw && typeof raw === "object" && !Array.isArray(raw)
			? []
			: ["Adapter file did not contain a mapping. Using empty data."];
	const { validated, errors } = validateAdapterData(rawData);
	return {
		found: true,
		valid: errors.length === 0,
		path: adapterPath,
		data: validated,
		errors,
		warnings,
		searched_paths: searchedPaths,
	};
}

export function loadAdapter(repoRoot, { adapter = null, adapterName = null } = {}) {
	if (adapter && adapterName) {
		throw new Error("Use either adapter or adapterName, not both.");
	}
	const { adapterPath, searchedPaths } = resolveAdapterLookup(repoRoot, adapter, adapterName);
	if (!adapterPath || !existsSync(adapterPath)) {
		return missingAdapterPayload(repoRoot, adapterName, searchedPaths);
	}
	return adapterFilePayload(adapterPath, searchedPaths);
}

function usage(exitCode = 0) {
	const text = [
		"Usage:",
		"  node ./scripts/resolve_adapter.mjs --repo-root <dir> [--adapter <path> | --adapter-name <name>]",
	].join("\n");
	const out = exitCode === 0 ? process.stdout : process.stderr;
	out.write(`${text}\n`);
	process.exit(exitCode);
}

function parseArgs(argv) {
	const options = {
		repoRoot: null,
		adapter: null,
		adapterName: null,
	};
	for (let index = 0; index < argv.length; index += 1) {
		const arg = argv[index];
		if (arg === "-h" || arg === "--help") {
			usage(0);
		}
		const field = {
			"--repo-root": "repoRoot",
			"--adapter": "adapter",
			"--adapter-name": "adapterName",
		}[arg];
		if (!field) {
			fail(`Unknown argument: ${arg}`);
		}
		const value = argv[index + 1];
		if (!value) {
			fail(`Missing value for ${arg}`);
		}
		options[field] = value;
		index += 1;
	}
	if (!options.repoRoot) {
		fail("--repo-root is required");
	}
	if (options.adapter && options.adapterName) {
		fail("Use either --adapter or --adapter-name, not both.");
	}
	return options;
}

export function main(argv = process.argv.slice(2)) {
	const options = parseArgs(argv);
	const payload = loadAdapter(resolve(options.repoRoot), {
		adapter: options.adapter,
		adapterName: options.adapterName,
	});
	process.stdout.write(`${JSON.stringify(payload, null, 2)}\n`);
}

const entryHref = process.argv[1] ? pathToFileURL(resolve(process.argv[1])).href : "";
if (import.meta.url === entryHref) {
	main();
}
