import { execFileSync, spawnSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import process from "node:process";

const SCRIPT_DIR = dirname(fileURLToPath(import.meta.url));
const TOOL_ROOT = resolve(SCRIPT_DIR, "..", "..");
const RESOLVE_ADAPTER_SCRIPT = join(TOOL_ROOT, "scripts", "resolve_adapter.py");
const VALUE_OPTIONS = new Map([
	["--repo-root", "repoRoot"],
	["--adapter", "adapter"],
	["--adapter-name", "adapterName"],
	["--workspace", "workspace"],
	["--prompt-file", "promptFile"],
	["--schema-file", "schemaFile"],
	["--output-dir", "outputDir"],
]);
const REQUIRED_FIELDS = ["workspace", "outputDir"];

function fail(message) {
	process.stderr.write(`${message}\n`);
	process.exit(1);
}

function printUsage() {
	process.stdout.write(
		"Usage: node scripts/agent-runtime/run-workbench-executor-variants.mjs [--repo-root DIR] [--adapter PATH | --adapter-name NAME] --workspace DIR --prompt-file FILE --schema-file FILE --output-dir DIR [--variant-id ID]\n",
	);
}

function readRequiredValue(argv, index, option) {
	const value = argv[index];
	if (!value) {
		fail(`Missing value for ${option}`);
	}
	return value;
}

function validateOptions(options) {
	if (options.adapter && options.adapterName) {
		fail("Use either --adapter or --adapter-name, not both.");
	}
	for (const field of REQUIRED_FIELDS) {
		if (!options[field]) {
			fail(`Missing required argument: ${field}`);
		}
	}
}

function parseArgs(argv) {
	const options = {
		repoRoot: process.cwd(),
		adapter: null,
		adapterName: null,
		workspace: null,
		promptFile: null,
		schemaFile: null,
		outputDir: null,
		variantIds: [],
	};
	for (let index = 0; index < argv.length; index += 1) {
		const arg = argv[index];
		const optionField = VALUE_OPTIONS.get(arg);
		if (optionField) {
			options[optionField] = readRequiredValue(argv, index + 1, arg);
			index += 1;
			continue;
		}
		if (arg === "--variant-id") {
			options.variantIds.push(readRequiredValue(argv, index + 1, arg));
			index += 1;
			continue;
		}
		if (arg === "-h" || arg === "--help") {
			printUsage();
			process.exit(0);
		}
		fail(`Unknown argument: ${arg}`);
	}
	validateOptions(options);
	return options;
}

function loadAdapter(options) {
	const repoRoot = resolve(options.repoRoot);
	const args = [RESOLVE_ADAPTER_SCRIPT, "--repo-root", repoRoot];
	if (options.adapter) {
		args.push("--adapter", options.adapter);
	}
	if (options.adapterName) {
		args.push("--adapter-name", options.adapterName);
	}
	const stdout = execFileSync("python3", args, {
		cwd: repoRoot,
		encoding: "utf-8",
	});
	const payload = JSON.parse(stdout);
	if (!payload.valid) {
		fail(`Adapter is invalid: ${JSON.stringify(payload.errors ?? [])}`);
	}
	return payload;
}

function shellEscape(value) {
	return `'${String(value).replace(/'/g, `'"'"'`)}'`;
}

function renderTemplate(template, replacements) {
	return template.replace(/\{([a-z_]+)\}/g, (match, key) => {
		if (!(key in replacements)) {
			fail(`Unknown placeholder in command template: ${match}`);
		}
		return replacements[key];
	});
}

function runVariant(repoRoot, variant, replacements) {
	const startedAt = new Date();
	const startedAtMs = Date.now();
	const command = renderTemplate(variant.command_template, replacements);
	const result = spawnSync("bash", ["-lc", command], {
		cwd: repoRoot,
		encoding: "utf-8",
	});
	const completedAt = new Date();
	return {
		id: variant.id,
		tool: variant.tool,
		command,
		startedAt: startedAt.toISOString(),
		completedAt: completedAt.toISOString(),
		durationMs: completedAt.getTime() - startedAtMs,
		exitCode: result.status,
		signal: result.signal,
		stdout: result.stdout,
		stderr: result.stderr,
		outputFile: replacements.output_file_raw,
		stderrFile: `${replacements.output_file_raw}.stderr`,
		status: result.status === 0 ? "passed" : "failed",
	};
}

function resolveRequiredPath(cliValue, adapterValue, fieldName, repoRoot) {
	const value = cliValue ?? adapterValue;
	if (!value) {
		fail(`Missing required argument or adapter default: ${fieldName}`);
	}
	return resolve(repoRoot, value);
}

function main() {
	const options = parseArgs(process.argv.slice(2));
	const repoRoot = resolve(options.repoRoot);
	const adapterPayload = loadAdapter(options);
	const variants = adapterPayload.data.executor_variants ?? [];
	if (variants.length === 0) {
		fail(`Adapter does not define executor_variants: ${adapterPayload.path}`);
	}
	const requestedVariantIds = new Set(options.variantIds.filter(Boolean));
	const selectedVariants = requestedVariantIds.size
		? variants.filter((variant) => requestedVariantIds.has(variant.id))
		: variants;
	if (selectedVariants.length === 0) {
		fail("No executor variants matched the requested --variant-id values.");
	}
	const workspace = resolve(options.workspace);
	const promptFile = resolveRequiredPath(
		options.promptFile,
		adapterPayload.data.default_prompt_file,
		"promptFile",
		repoRoot,
	);
	const schemaFile = resolveRequiredPath(
		options.schemaFile,
		adapterPayload.data.default_schema_file,
		"schemaFile",
		repoRoot,
	);
	const outputDir = resolve(options.outputDir);
	mkdirSync(outputDir, { recursive: true });

	const results = [];
	for (const variant of selectedVariants) {
		const outputFile = join(outputDir, `${variant.id}.json`);
		const replacements = {
			candidate_repo: shellEscape(workspace),
			prompt_file: shellEscape(promptFile),
			schema_file: shellEscape(schemaFile),
			output_file: shellEscape(outputFile),
			output_file_raw: outputFile,
			variant_id: shellEscape(variant.id),
		};
		results.push(runVariant(repoRoot, variant, replacements));
	}

	const summary = {
		repoRoot,
		adapterPath: adapterPayload.path,
		workspace,
		promptFile,
		schemaFile,
		outputDir,
		variants: results.map((result) => {
			const output = existsSync(result.outputFile)
				? JSON.parse(readFileSync(result.outputFile, "utf-8"))
				: null;
			return {
				id: result.id,
				tool: result.tool,
				status: result.status,
				startedAt: result.startedAt,
				completedAt: result.completedAt,
				durationMs: result.durationMs,
				exitCode: result.exitCode,
				signal: result.signal,
				outputFile: result.outputFile,
				stderrFile: result.stderrFile,
				command: result.command,
				stdout: result.stdout,
				stderr: result.stderr,
				telemetry: output && typeof output.telemetry === "object" ? output.telemetry : null,
				output,
			};
		}),
	};
	const summaryFile = join(outputDir, "summary.json");
	writeFileSync(summaryFile, `${JSON.stringify(summary, null, 2)}\n`, "utf-8");
	process.stdout.write(`${summaryFile}\n`);
	if (results.some((result) => result.status !== "passed")) {
		process.exit(1);
	}
}

main();
