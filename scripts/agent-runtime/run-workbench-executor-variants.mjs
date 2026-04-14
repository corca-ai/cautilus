import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import process from "node:process";

import { loadAdapter as loadAdapterPayload } from "../resolve_adapter.mjs";
import { buildReviewPacket } from "./build-review-packet.mjs";
import { buildReviewPromptInput } from "./build-review-prompt-input.mjs";
import {
	createProgressLogger,
	ownershipHintForRepo,
	runBashCommandWithProgress,
} from "./command-progress.mjs";
import { REVIEW_PROMPT_INPUTS_SCHEMA } from "./contract-versions.mjs";
import {
	buildReviewSummaryPacket,
	normalizeReviewVariantResult,
} from "./review-variant-contract.mjs";
import { renderReviewPrompt } from "./render-review-prompt.mjs";
import { resolveRunDir } from "./active-run.mjs";

const SCRIPT_DIR = dirname(fileURLToPath(import.meta.url));
const TOOL_ROOT = resolve(SCRIPT_DIR, "..", "..");
const VALUE_OPTIONS = new Map([
	["--repo-root", "repoRoot"],
	["--adapter", "adapter"],
	["--adapter-name", "adapterName"],
	["--workspace", "workspace"],
	["--prompt-file", "promptFile"],
	["--schema-file", "schemaFile"],
	["--scenario-file", "scenarioFile"],
	["--scenario", "scenarioId"],
	["--output-under-test", "outputUnderTest"],
	["--output-text-key", "outputTextKey"],
	["--output-dir", "outputDir"],
	["--report-file", "reportFile"],
	["--review-packet", "reviewPacketFile"],
	["--review-prompt-input", "reviewPromptInputFile"],
]);
const REQUIRED_FIELDS = ["workspace"];

function fail(message) {
	process.stderr.write(`${message}\n`);
	process.exit(1);
}

function printUsage() {
	process.stdout.write(
		"Usage: node scripts/agent-runtime/run-workbench-executor-variants.mjs [--repo-root DIR] [--adapter PATH | --adapter-name NAME] --workspace DIR [--prompt-file FILE | --report-file FILE | --review-packet FILE | --review-prompt-input FILE | --scenario-file FILE] [--scenario ID] [--output-under-test FILE] [--output-text-key DOT_PATH] [--schema-file FILE] [--output-dir DIR] [--variant-id ID] [--quiet]\n",
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
	if (options.outputTextKey && !options.outputUnderTest) {
		fail("--output-text-key requires --output-under-test");
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
		scenarioFile: null,
		scenarioId: null,
		outputDir: null,
		outputUnderTest: null,
		outputTextKey: null,
		reportFile: null,
		reviewPacketFile: null,
		reviewPromptInputFile: null,
		variantIds: [],
		quiet: false,
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
		if (arg === "--quiet") {
			options.quiet = true;
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
	const payload = loadAdapterPayload(repoRoot, {
		adapter: options.adapter,
		adapterName: options.adapterName,
	});
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

async function runVariant(repoRoot, variant, replacements, log) {
	const command = renderTemplate(variant.command_template, replacements);
	const label = `variant ${variant.id}`;
	const result = await runBashCommandWithProgress({
		repoRoot,
		command,
		stdoutFile: `${replacements.output_file_raw}.stdout`,
		stderrFile: `${replacements.output_file_raw}.stderr`,
		log,
		startMessage: `${label} start: ${command}`,
		heartbeatMessage: `${label} still running`,
		completionLabel: label,
		ownershipHint: ownershipHintForRepo(TOOL_ROOT, repoRoot),
	});
	return {
		id: variant.id,
		tool: variant.tool,
		command,
		startedAt: result.startedAt,
		completedAt: result.completedAt,
		durationMs: result.durationMs,
		exitCode: result.exitCode,
		signal: result.signal,
		stdout: result.stdout,
		stderr: result.stderr,
		outputFile: replacements.output_file_raw,
		stdoutFile: result.stdoutFile,
		stderrFile: result.stderrFile,
		status: result.status,
	};
}

function resolveRequiredPath(cliValue, adapterValue, fieldName, repoRoot) {
	const value = cliValue ?? adapterValue;
	if (!value) {
		fail(`Missing required argument or adapter default: ${fieldName}`);
	}
	return resolve(repoRoot, value);
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
	const promptInputArgs = ["--review-packet", reviewPacketFile];
	if (options.outputUnderTest) {
		promptInputArgs.push("--output-under-test", options.outputUnderTest);
	}
	if (options.outputTextKey) {
		promptInputArgs.push("--output-text-key", options.outputTextKey);
	}
	const promptInput = buildReviewPromptInput(promptInputArgs, { now: new Date() });
	writeFileSync(reviewPromptInputFile, `${JSON.stringify(promptInput, null, 2)}\n`, "utf-8");
	return {
		promptFile: renderPromptFromInputFile(reviewPromptInputFile, outputDir),
		reviewPacketFile,
		reviewPromptInputFile,
		outputUnderTestFile: promptInput.outputUnderTestFile ?? null,
	};
}

function validatePromptArtifactOptions(options) {
	if (options.outputUnderTest && options.promptFile) {
		fail("--output-under-test cannot be combined with --prompt-file");
	}
	if (options.outputUnderTest && options.reviewPromptInputFile) {
		fail("--output-under-test cannot be combined with --review-prompt-input");
	}
	if (options.scenarioFile && !options.outputUnderTest) {
		fail("--scenario-file requires --output-under-test");
	}
	if (options.scenarioFile && (options.promptFile || options.reviewPromptInputFile || options.reviewPacketFile || options.reportFile)) {
		fail("--scenario-file cannot be combined with prompt, review-packet, or report inputs");
	}
}

function resolveDirectPromptArtifact(options, adapterPayload, repoRoot) {
	const promptFile = options.promptFile
		? resolve(repoRoot, options.promptFile)
		: !options.outputUnderTest && adapterPayload.data.default_prompt_file
			? resolve(repoRoot, adapterPayload.data.default_prompt_file)
			: null;
	if (!promptFile) {
		return null;
	}
	return {
		promptFile,
		reviewPacketFile: options.reviewPacketFile ? resolve(repoRoot, options.reviewPacketFile) : null,
		reviewPromptInputFile: options.reviewPromptInputFile ? resolve(repoRoot, options.reviewPromptInputFile) : null,
		outputUnderTestFile: null,
	};
}

function resolvePromptArtifactFromInputFile(options, repoRoot, outputDir) {
	if (!options.reviewPromptInputFile) {
		return null;
	}
	const reviewPromptInputFile = resolve(repoRoot, options.reviewPromptInputFile);
	const promptInput = JSON.parse(readFileSync(reviewPromptInputFile, "utf-8"));
	return {
		promptFile: renderPromptFromInputFile(reviewPromptInputFile, outputDir),
		reviewPacketFile: options.reviewPacketFile ? resolve(repoRoot, options.reviewPacketFile) : null,
		reviewPromptInputFile,
		outputUnderTestFile: promptInput.outputUnderTestFile ?? null,
	};
}

function resolvePromptArtifactFromScenario(options, outputDir) {
	if (!options.scenarioFile) {
		return null;
	}
	const reviewPromptInputFile = join(outputDir, "review-prompt-input.json");
	const promptInputArgs = [
		"--scenario-file",
		resolve(options.repoRoot, options.scenarioFile),
		"--repo-root",
		resolve(options.repoRoot),
		"--output-under-test",
		resolve(options.repoRoot, options.outputUnderTest),
	];
	if (options.scenarioId) {
		promptInputArgs.push("--scenario", options.scenarioId);
	}
	if (options.outputTextKey) {
		promptInputArgs.push("--output-text-key", options.outputTextKey);
	}
	if (options.adapter) {
		promptInputArgs.push("--adapter", options.adapter);
	}
	if (options.adapterName) {
		promptInputArgs.push("--adapter-name", options.adapterName);
	}
	const promptInput = buildReviewPromptInput(promptInputArgs, { now: new Date() });
	writeFileSync(reviewPromptInputFile, `${JSON.stringify(promptInput, null, 2)}\n`, "utf-8");
	return {
		promptFile: renderPromptFromInputFile(reviewPromptInputFile, outputDir),
		reviewPacketFile: null,
		reviewPromptInputFile,
		outputUnderTestFile: promptInput.outputUnderTestFile ?? null,
	};
}

function buildOutputUnderTestWarnings(variants, outputUnderTestFile) {
	if (!outputUnderTestFile?.absolutePath) {
		return [];
	}
	return variants
		.filter((variant) => !variant.command_template.includes("{output_under_test}"))
		.map((variant) =>
			`Variant ${variant.id} does not reference {output_under_test}; it will need to rely on the rendered prompt for the artifact path.`,
		);
}

function resolvePromptArtifacts(options, adapterPayload, repoRoot, outputDir) {
	validatePromptArtifactOptions(options);
	const directPromptArtifact = resolveDirectPromptArtifact(options, adapterPayload, repoRoot);
	if (directPromptArtifact) {
		return directPromptArtifact;
	}
	const promptArtifactFromInput = resolvePromptArtifactFromInputFile(options, repoRoot, outputDir);
	if (promptArtifactFromInput) {
		return promptArtifactFromInput;
	}
	const promptArtifactFromScenario = resolvePromptArtifactFromScenario(options, outputDir);
	if (promptArtifactFromScenario) {
		return promptArtifactFromScenario;
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

async function main() {
	const options = parseArgs(process.argv.slice(2));
	const log = createProgressLogger({ quiet: options.quiet });
	const repoRoot = resolve(options.repoRoot);
	const resolvedRun = resolveRunDir({ outputDir: options.outputDir });
	if (resolvedRun.source === "auto") {
		process.stderr.write(`Active run: ${resolvedRun.runDir}\n`);
	}
	log(
		`review variants start: repo=${repoRoot} workspace=${resolve(options.workspace)} output=${resolvedRun.runDir}`,
	);
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
	const outputDir = resolvedRun.runDir;
	mkdirSync(outputDir, { recursive: true });
	const promptArtifacts = resolvePromptArtifacts(options, adapterPayload, repoRoot, outputDir);
	const promptFile = promptArtifacts.promptFile;
	log(`review variants artifacts ready: prompt=${promptFile} schema=${schemaFile}`);
	const warnings = buildOutputUnderTestWarnings(selectedVariants, promptArtifacts.outputUnderTestFile);
	for (const warning of warnings) {
		log(`warning: ${warning}`);
	}

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
			output_under_test: shellEscape(promptArtifacts.outputUnderTestFile?.absolutePath ?? ""),
		};
		results.push(await runVariant(repoRoot, variant, replacements, log));
	}

	const variantSummaries = results.map((result) => {
		let rawOutput = null;
		let rawOutputError = null;
		if (existsSync(result.outputFile)) {
			try {
				rawOutput = JSON.parse(readFileSync(result.outputFile, "utf-8"));
			} catch (error) {
				rawOutputError = error;
			}
		}
		const output = normalizeReviewVariantResult(result, rawOutput, rawOutputError);
		writeFileSync(result.outputFile, `${JSON.stringify(output, null, 2)}\n`, "utf-8");
		return {
			id: result.id,
			tool: result.tool,
			status: output.status,
			executionStatus: result.status,
			startedAt: result.startedAt,
			completedAt: result.completedAt,
			durationMs: result.durationMs,
			exitCode: result.exitCode,
			signal: result.signal,
			outputFile: result.outputFile,
			stdoutFile: result.stdoutFile,
			stderrFile: result.stderrFile,
			command: result.command,
			stdout: result.stdout,
			stderr: result.stderr,
			telemetry: output && typeof output.telemetry === "object" ? output.telemetry : null,
			output,
			...(Array.isArray(output.reasonCodes) && output.reasonCodes.length > 0 ? { reasonCodes: output.reasonCodes } : {}),
		};
	});

	const summary = buildReviewSummaryPacket({
		repoRoot,
		adapterPath: adapterPayload.path,
		workspace,
		promptFile,
		reviewPacketFile: promptArtifacts.reviewPacketFile,
		reviewPromptInputFile: promptArtifacts.reviewPromptInputFile,
		outputUnderTestFile: promptArtifacts.outputUnderTestFile,
		warnings,
		schemaFile,
		outputDir,
		variants: variantSummaries,
	});
	const summaryFile = join(outputDir, "review-summary.json");
	writeFileSync(summaryFile, `${JSON.stringify(summary, null, 2)}\n`, "utf-8");
	log(
		`review variants complete: status=${summary.status} summary=${summaryFile}`,
	);
	process.stdout.write(`${summaryFile}\n`);
	if (summary.status !== "passed") {
		process.exit(1);
	}
}

main();
