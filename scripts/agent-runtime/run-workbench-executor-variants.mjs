import { execFileSync, spawnSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import process from "node:process";

import { buildReviewPacket } from "./build-review-packet.mjs";
import { buildReviewPromptInput } from "./build-review-prompt-input.mjs";
import { REVIEW_PROMPT_INPUTS_SCHEMA } from "./contract-versions.mjs";
import { renderReviewPrompt } from "./render-review-prompt.mjs";

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
	["--report-file", "reportFile"],
	["--review-packet", "reviewPacketFile"],
	["--review-prompt-input", "reviewPromptInputFile"],
]);
const REQUIRED_FIELDS = ["workspace", "outputDir"];

function fail(message) {
	process.stderr.write(`${message}\n`);
	process.exit(1);
}

function printUsage() {
	process.stdout.write(
		"Usage: node scripts/agent-runtime/run-workbench-executor-variants.mjs [--repo-root DIR] [--adapter PATH | --adapter-name NAME] --workspace DIR [--prompt-file FILE | --report-file FILE | --review-packet FILE | --review-prompt-input FILE] [--schema-file FILE] --output-dir DIR [--variant-id ID]\n",
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
		reportFile: null,
		reviewPacketFile: null,
		reviewPromptInputFile: null,
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

function sumTelemetryField(variants, field) {
	let seen = false;
	let total = 0;
	for (const variant of variants) {
		const value = variant.telemetry && typeof variant.telemetry[field] === "number"
			? variant.telemetry[field]
			: null;
		if (value === null) {
			continue;
		}
		seen = true;
		total += value;
	}
	return seen ? total : null;
}

function renderPromptFromInputFile(reviewPromptInputFile, outputDir) {
	const promptInput = JSON.parse(readFileSync(reviewPromptInputFile, "utf-8"));
	if (promptInput?.schemaVersion !== REVIEW_PROMPT_INPUTS_SCHEMA) {
		fail(`review prompt input must use schemaVersion ${REVIEW_PROMPT_INPUTS_SCHEMA}`);
	}
	const renderedPromptFile = join(outputDir, "review.prompt.md");
	writeFileSync(renderedPromptFile, renderReviewPrompt(promptInput), "utf-8");
	return renderedPromptFile;
}

function resolvePromptFromReviewPacket(options, adapterPayload, repoRoot, outputDir) {
	const reviewPacketFile = resolveReviewPacket(options, adapterPayload, repoRoot, outputDir);
	const reviewPromptInputFile = join(outputDir, "review-prompt-input.json");
	const promptInput = buildReviewPromptInput(
		["--review-packet", reviewPacketFile],
		{ now: new Date() },
	);
	writeFileSync(reviewPromptInputFile, `${JSON.stringify(promptInput, null, 2)}\n`, "utf-8");
	return {
		promptFile: renderPromptFromInputFile(reviewPromptInputFile, outputDir),
		reviewPacketFile,
		reviewPromptInputFile,
	};
}

function resolvePromptArtifacts(options, adapterPayload, repoRoot, outputDir) {
	const promptFile = options.promptFile
		? resolve(repoRoot, options.promptFile)
		: adapterPayload.data.default_prompt_file
			? resolve(repoRoot, adapterPayload.data.default_prompt_file)
			: null;
	if (promptFile) {
		return {
			promptFile,
			reviewPacketFile: options.reviewPacketFile ? resolve(repoRoot, options.reviewPacketFile) : null,
			reviewPromptInputFile: options.reviewPromptInputFile ? resolve(repoRoot, options.reviewPromptInputFile) : null,
		};
	}
	if (options.reviewPromptInputFile) {
		const reviewPromptInputFile = resolve(repoRoot, options.reviewPromptInputFile);
		return {
			promptFile: renderPromptFromInputFile(reviewPromptInputFile, outputDir),
			reviewPacketFile: options.reviewPacketFile ? resolve(repoRoot, options.reviewPacketFile) : null,
			reviewPromptInputFile,
		};
	}
	return resolvePromptFromReviewPacket(options, adapterPayload, repoRoot, outputDir);
}

function resolveReviewPacket(options, adapterPayload, repoRoot, outputDir) {
	if (options.reviewPacketFile) {
		return resolve(repoRoot, options.reviewPacketFile);
	}
	if (!options.reportFile) {
		fail("Provide --prompt-file, adapter default_prompt_file, --review-prompt-input, --review-packet, or --report-file");
	}
	const reviewPacketFile = join(outputDir, "review-packet.json");
	const packet = buildReviewPacket(
		[
			"--repo-root",
			repoRoot,
			"--report-file",
			resolve(repoRoot, options.reportFile),
			...(options.adapter ? ["--adapter", options.adapter] : []),
			...(options.adapterName ? ["--adapter-name", options.adapterName] : []),
		],
		{ now: new Date() },
	);
	writeFileSync(reviewPacketFile, `${JSON.stringify(packet, null, 2)}\n`, "utf-8");
	return reviewPacketFile;
}

function summarizeTelemetry(variants) {
	if (variants.length === 0) {
		return null;
	}
	const providers = Array.from(
		new Set(
			variants
				.map((variant) => variant.telemetry && variant.telemetry.provider)
				.filter((value) => typeof value === "string" && value.length > 0),
		),
	);
	const models = Array.from(
		new Set(
			variants
				.map((variant) => variant.telemetry && variant.telemetry.model)
				.filter((value) => typeof value === "string" && value.length > 0),
		),
	);
	const summary = {
		startedAt: variants[0].startedAt,
		completedAt: variants[variants.length - 1].completedAt,
		durationMs: variants.reduce((total, variant) => total + variant.durationMs, 0),
		averageVariantDurationMs:
			variants.reduce((total, variant) => total + variant.durationMs, 0) / variants.length,
		variantCount: variants.length,
		passedVariantCount: variants.filter((variant) => variant.status === "passed").length,
		failedVariantCount: variants.filter((variant) => variant.status !== "passed").length,
	};
	if (providers.length > 0) {
		summary.providers = providers;
	}
	if (models.length > 0) {
		summary.models = models;
	}
	for (const field of [
		"prompt_tokens",
		"completion_tokens",
		"total_tokens",
		"cost_usd",
	]) {
		const total = sumTelemetryField(variants, field);
		if (total !== null) {
			summary[field] = total;
		}
	}
	return summary;
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
	const schemaFile = resolveRequiredPath(
		options.schemaFile,
		adapterPayload.data.default_schema_file,
		"schemaFile",
		repoRoot,
	);
	const outputDir = resolve(options.outputDir);
	mkdirSync(outputDir, { recursive: true });
	const promptArtifacts = resolvePromptArtifacts(options, adapterPayload, repoRoot, outputDir);
	const promptFile = promptArtifacts.promptFile;

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

	const variantSummaries = results.map((result) => {
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
	});

	const summary = {
		repoRoot,
		adapterPath: adapterPayload.path,
		workspace,
		promptFile,
		reviewPacketFile: promptArtifacts.reviewPacketFile,
		reviewPromptInputFile: promptArtifacts.reviewPromptInputFile,
		schemaFile,
		outputDir,
		telemetry: summarizeTelemetry(variantSummaries),
		variants: variantSummaries,
	};
	const summaryFile = join(outputDir, "summary.json");
	writeFileSync(summaryFile, `${JSON.stringify(summary, null, 2)}\n`, "utf-8");
	process.stdout.write(`${summaryFile}\n`);
	if (results.some((result) => result.status !== "passed")) {
		process.exit(1);
	}
}

main();
