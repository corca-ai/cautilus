import process from "node:process";
import { pathToFileURL } from "node:url";
import { resolve } from "node:path";

import { loadAdapter } from "./resolve_adapter.mjs";

const COMMAND_FIELDS = [
	"eval_test_command_templates",
	"iterate_command_templates",
	"held_out_command_templates",
	"comparison_command_templates",
	"full_gate_command_templates",
];

function hasItems(value) {
	return Array.isArray(value) && value.length > 0;
}

function check(id, ok, detail) {
	return { id, ok, detail };
}

function initCommand(repoRoot, adapterName) {
	let command = `cautilus adapter init --repo-root ${repoRoot}`;
	if (adapterName) {
		command += ` --adapter-name ${adapterName}`;
	}
	return command;
}

function baseResult(repoRoot, payload, checks, suggestions) {
	return {
		repo_root: repoRoot,
		adapter_path: payload.path,
		searched_paths: payload.searched_paths ?? [],
		checks,
		suggestions,
		warnings: payload.warnings ?? [],
		errors: payload.errors ?? [],
	};
}

function missingAdapterResult(repoRoot, payload, adapterName) {
	const checks = [check("adapter_found", false, "No checked-in adapter was found.")];
	const suggestions = [initCommand(repoRoot, adapterName)];
	if (payload.warnings?.length) {
		suggestions.push(...payload.warnings);
	}
	return {
		status: "missing_adapter",
		ready: false,
		summary: "Adapter missing.",
		...baseResult(repoRoot, payload, checks, suggestions),
	};
}

function invalidAdapterResult(repoRoot, payload, checks) {
	return {
		status: "invalid_adapter",
		ready: false,
		summary: "Adapter is present but invalid.",
		...baseResult(repoRoot, payload, checks, [
			"Repair the adapter fields reported in errors before running evaluation.",
			"See docs/contracts/adapter-contract.md for the canonical adapter shape.",
		]),
	};
}

function pushFieldCheck(checks, suggestions, { id, ok, okDetail, missingDetail, suggestion }) {
	checks.push(check(id, ok, ok ? okDetail : missingDetail));
	if (!ok) {
		suggestions.push(suggestion);
	}
}

function collectReadinessChecks(data, checks, suggestions) {
	const hasRepo = typeof data.repo === "string" && Boolean(data.repo.trim());
	pushFieldCheck(checks, suggestions, {
		id: "repo_name",
		ok: hasRepo,
		okDetail: "Adapter declares repo.",
		missingDetail: "Adapter is missing a repo name.",
		suggestion: "Set adapter.repo to the host repo name.",
	});

	const hasSurfaces = hasItems(data.evaluation_surfaces);
	pushFieldCheck(checks, suggestions, {
		id: "evaluation_surfaces",
		ok: hasSurfaces,
		okDetail: "Adapter declares evaluation surfaces.",
		missingDetail: "Adapter is missing evaluation_surfaces.",
		suggestion: "Add at least one evaluation_surfaces entry that states what the adapter judges.",
	});

	const hasBaselines = hasItems(data.baseline_options);
	pushFieldCheck(checks, suggestions, {
		id: "baseline_options",
		ok: hasBaselines,
		okDetail: "Adapter declares baseline options.",
		missingDetail: "Adapter is missing baseline_options.",
		suggestion: "Add at least one baseline_options entry so comparisons stay explicit.",
	});

	const automatedCommands = COMMAND_FIELDS.some((field) => hasItems(data[field]));
	const hasVariants = hasItems(data.executor_variants);
	pushFieldCheck(checks, suggestions, {
		id: "execution_surface",
		ok: automatedCommands || hasVariants,
		okDetail: "Adapter declares runnable command templates or executor variants.",
		missingDetail: "Adapter has no command templates or executor variants yet.",
		suggestion:
			"Add at least one skill_test/iterate/held_out/comparison/full_gate command template or executor_variants entry.",
	});
}

export function doctorRepo(repoRoot, { adapter = null, adapterName = null } = {}) {
	const payload = loadAdapter(repoRoot, { adapter, adapterName });
	const checks = [];
	const suggestions = [];
	const data = payload.data ?? {};

	if (!payload.found) {
		return missingAdapterResult(repoRoot, payload, adapterName);
	}

	checks.push(check("adapter_found", true, `Using adapter at ${payload.path}`));

	if (!payload.valid) {
		checks.push(check("adapter_valid", false, "Adapter failed schema validation."));
		return invalidAdapterResult(repoRoot, payload, checks);
	}

	checks.push(check("adapter_valid", true, "Adapter passed schema validation."));
	collectReadinessChecks(data, checks, suggestions);

	const ready = checks.every((item) => item.ok);
	return {
		status: ready ? "ready" : "incomplete_adapter",
		ready,
		summary: ready ? "Adapter is ready for standalone Cautilus use." : "Adapter exists but is not ready yet.",
		...baseResult(repoRoot, payload, checks, suggestions),
	};
}

function fail(message) {
	process.stderr.write(`${message}\n`);
	process.exit(1);
}

function usage(exitCode = 0) {
	const text = [
		"Usage:",
		"  node ./scripts/doctor.mjs --repo-root <dir> [--adapter <path>] [--adapter-name <name>]",
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
	const result = doctorRepo(resolve(options.repoRoot), {
		adapter: options.adapter,
		adapterName: options.adapterName,
	});
	process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
	process.exit(result.ready ? 0 : 1);
}

const entryHref = process.argv[1] ? pathToFileURL(resolve(process.argv[1])).href : "";
if (import.meta.url === entryHref) {
	main();
}
