import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import process from "node:process";
import { pathToFileURL } from "node:url";

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
	"iterate_command_templates",
	"held_out_command_templates",
	"comparison_command_templates",
	"full_gate_command_templates",
	"artifact_paths",
	"report_paths",
	"comparison_questions",
];

const INTEGER_FIELDS = [
	"version",
	"iterate_samples_default",
	"held_out_samples_default",
	"comparison_samples_default",
	"full_gate_samples_default",
	"review_timeout_ms",
];

const STRING_FIELDS = [
	"repo",
	"history_file_hint",
	"profile_default",
	"default_prompt_file",
	"default_schema_file",
];

const EXECUTOR_VARIANT_STRING_FIELDS = [
	"id",
	"tool",
	"command_template",
];

const EXECUTOR_VARIANT_OPTIONAL_STRING_FIELDS = ["purpose"];
const EXECUTOR_VARIANT_STRING_LIST_FIELDS = ["required_prerequisites", "safety_notes"];

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
	if (typeof scripts["prompt:bench:train"] === "string") {
		inferred.iterate_command_templates = [
			"npm run prompt:bench:train -- --baseline-ref {baseline_ref} --history-file {history_file} --samples {iterate_samples}",
		];
	}
	if (typeof scripts["prompt:bench:test"] === "string") {
		inferred.held_out_command_templates = [
			"npm run prompt:bench:test -- --baseline-ref {baseline_ref} --samples {held_out_samples}",
		];
	}
	if (typeof scripts["prompt:bench:full"] === "string") {
		inferred.full_gate_command_templates = [
			"npm run prompt:bench:full -- --baseline-ref {baseline_ref} --history-file {history_file} --samples {full_gate_samples}",
		];
	}

	const compareScript = resolve(repoRoot, "scripts/agent-runtime/compare-prompt-worktrees.mjs");
	if (existsSync(compareScript)) {
		inferred.comparison_command_templates = [
			"node scripts/agent-runtime/compare-prompt-worktrees.mjs --baseline-ref {baseline_ref} --profile {profile} --split {split} --samples {comparison_samples}",
		];
	}

	const reportPath = resolve(repoRoot, "specs/report/audit-workbench.html");
	if (existsSync(reportPath)) {
		inferred.report_paths = ["specs/report/audit-workbench.html"];
	}

	inferred.repo = repoRoot.split(/[\\/]/u).at(-1);
	inferred.iterate_samples_default = 2;
	inferred.held_out_samples_default = 2;
	inferred.comparison_samples_default = 2;
	inferred.full_gate_samples_default = 2;
	inferred.history_file_hint = "/tmp/workbench-history.json";
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
