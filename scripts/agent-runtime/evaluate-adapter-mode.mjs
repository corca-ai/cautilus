import { execFileSync, spawnSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import process from "node:process";

import { REPORT_INPUTS_SCHEMA, buildReportPacket } from "./build-report-packet.mjs";

export const ADAPTER_MODE_EVALUATION_PACKET_SCHEMA = "cautilus.adapter_mode_evaluation.v1";

const SCRIPT_DIR = dirname(fileURLToPath(import.meta.url));
const TOOL_ROOT = resolve(SCRIPT_DIR, "..", "..");
const RESOLVE_ADAPTER_SCRIPT = join(TOOL_ROOT, "scripts", "resolve_adapter.py");
const MODE_FIELD_BY_NAME = {
	iterate: "iterate_command_templates",
	held_out: "held_out_command_templates",
	comparison: "comparison_command_templates",
	full_gate: "full_gate_command_templates",
};
const SAMPLE_OPTION_FIELDS = {
	"--iterate-samples": "iterateSamples",
	"--held-out-samples": "heldOutSamples",
	"--comparison-samples": "comparisonSamples",
	"--full-gate-samples": "fullGateSamples",
};
const VALUE_OPTION_FIELDS = {
	"--repo-root": "repoRoot",
	"--adapter": "adapter",
	"--adapter-name": "adapterName",
	"--mode": "mode",
	"--intent": "intent",
	"--baseline-ref": "baselineRef",
	"--baseline-repo": "baselineRepo",
	"--candidate-repo": "candidateRepo",
	"--history-file": "historyFile",
	"--profile": "profile",
	"--split": "split",
	"--output-dir": "outputDir",
	"--candidate-results-file": "candidateResultsFile",
	"--recommendation-on-pass": "recommendationOnPass",
};
const DEFAULT_SPLIT_BY_MODE = {
	iterate: "train",
	held_out: "test",
	comparison: "all",
	full_gate: "all",
};

function usage(exitCode = 0) {
	const text = [
		"Usage:",
		"  node ./scripts/agent-runtime/evaluate-adapter-mode.mjs --repo-root <dir> --mode <iterate|held_out|comparison|full_gate> --intent <text> --output-dir <dir> [--baseline-ref <ref>] [--baseline-repo <dir>] [--candidate-repo <dir>] [--adapter <path> | --adapter-name <name>] [--history-file <path>] [--profile <name>] [--split <name>] [--candidate-results-file <path>] [--skip-preflight]",
	].join("\n");
	const out = exitCode === 0 ? process.stdout : process.stderr;
	out.write(`${text}\n`);
	process.exit(exitCode);
}

function fail(message) {
	process.stderr.write(`${message}\n`);
	process.exit(1);
}

function readRequiredValue(argv, index, option) {
	const value = argv[index];
	if (!value) {
		fail(`Missing value for ${option}`);
	}
	return value;
}

function parseIntegerOption(value, option) {
	const parsed = Number(value);
	if (!Number.isInteger(parsed) || parsed <= 0) {
		fail(`${option} must be a positive integer`);
	}
	return parsed;
}

function createDefaultOptions() {
	return {
		repoRoot: process.cwd(),
		adapter: null,
		adapterName: null,
		mode: null,
		intent: null,
		baselineRef: null,
		baselineRepo: null,
		candidateRepo: null,
		historyFile: null,
		profile: null,
		split: null,
		outputDir: null,
		candidateResultsFile: null,
		recommendationOnPass: null,
		skipPreflight: false,
		iterateSamples: null,
		heldOutSamples: null,
		comparisonSamples: null,
		fullGateSamples: null,
	};
}

function applyArgument(options, argv, index) {
	const arg = argv[index];
	if (arg === "-h" || arg === "--help") {
		usage(0);
	}
	if (arg === "--skip-preflight") {
		options.skipPreflight = true;
		return index;
	}
	if (SAMPLE_OPTION_FIELDS[arg]) {
		options[SAMPLE_OPTION_FIELDS[arg]] = parseIntegerOption(readRequiredValue(argv, index + 1, arg), arg);
		return index + 1;
	}
	const field = VALUE_OPTION_FIELDS[arg];
	if (!field) {
		fail(`Unknown argument: ${arg}`);
	}
	options[field] = readRequiredValue(argv, index + 1, arg);
	return index + 1;
}

function validateOptions(options) {
	if (options.adapter && options.adapterName) {
		fail("Use either --adapter or --adapter-name, not both.");
	}
	if (!options.mode || !(options.mode in MODE_FIELD_BY_NAME)) {
		fail("--mode must be one of iterate, held_out, comparison, full_gate");
	}
	if (!options.intent) {
		fail("--intent is required");
	}
	if (!options.outputDir) {
		fail("--output-dir is required");
	}
}

function parseArgs(argv) {
	const options = createDefaultOptions();
	for (let index = 0; index < argv.length; index += 1) {
		index = applyArgument(options, argv, index);
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
	if (!payload.found) {
		fail(`Adapter not found for repo ${repoRoot}`);
	}
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

function resolveHistoryFile(repoRoot, adapterData, explicitHistoryFile) {
	if (explicitHistoryFile) {
		return resolve(repoRoot, explicitHistoryFile);
	}
	if (adapterData.history_file_hint) {
		return resolve(repoRoot, adapterData.history_file_hint);
	}
	return join(repoRoot, ".cautilus", "history.json");
}

function sampleValue(explicitValue, adapterValue, fallback) {
	return explicitValue ?? adapterValue ?? fallback;
}

function recommendationOnPass(mode, explicitValue) {
	if (explicitValue) {
		return explicitValue;
	}
	return mode === "full_gate" ? "accept-now" : "defer";
}

function readCandidateResults(path) {
	if (!existsSync(path)) {
		return [];
	}
	const parsed = JSON.parse(readFileSync(path, "utf-8"));
	if (Array.isArray(parsed)) {
		return parsed;
	}
	if (parsed && typeof parsed === "object" && Array.isArray(parsed.candidateResults)) {
		return parsed.candidateResults;
	}
	fail(`candidate results file must be an array or an object with candidateResults: ${path}`);
}

function runShellCommand({ repoRoot, command, stdoutFile, stderrFile }) {
	const startedAt = new Date();
	const startedAtMs = Date.now();
	const result = spawnSync("bash", ["-lc", command], {
		cwd: repoRoot,
		encoding: "utf-8",
	});
	const completedAt = new Date();
	writeFileSync(stdoutFile, result.stdout || "", "utf-8");
	writeFileSync(stderrFile, result.stderr || "", "utf-8");
	return {
		command,
		startedAt: startedAt.toISOString(),
		completedAt: completedAt.toISOString(),
		durationMs: completedAt.getTime() - startedAtMs,
		...(typeof result.status === "number" ? { exitCode: result.status } : {}),
		...(result.signal ? { signal: result.signal } : {}),
		status: result.status === 0 ? "passed" : "failed",
		stdoutFile,
		stderrFile,
	};
}

function createObservation(stage, index, commandResult) {
	return {
		stage,
		index,
		status: commandResult.status,
		command: commandResult.command,
		startedAt: commandResult.startedAt,
		completedAt: commandResult.completedAt,
		durationMs: commandResult.durationMs,
		...(typeof commandResult.exitCode === "number" ? { exitCode: commandResult.exitCode } : {}),
		...(commandResult.signal ? { signal: commandResult.signal } : {}),
		stdoutFile: commandResult.stdoutFile,
		stderrFile: commandResult.stderrFile,
	};
}

function aggregateDuration(observations) {
	return observations.reduce((total, entry) => total + (entry.durationMs || 0), 0);
}

function classifyScenarioBuckets(candidateResults) {
	const improved = [];
	const regressed = [];
	const unchanged = [];
	const noisy = [];
	for (const result of candidateResults) {
		const scenarioId = typeof result.scenarioId === "string" ? result.scenarioId : null;
		if (!scenarioId) {
			continue;
		}
		switch (result.status) {
			case "passed":
			case "improved":
				improved.push(scenarioId);
				break;
			case "unchanged":
				unchanged.push(scenarioId);
				break;
			case "noisy":
				noisy.push(scenarioId);
				break;
			default:
				regressed.push(scenarioId);
				break;
		}
	}
	return { improved, regressed, unchanged, noisy };
}

function buildModeSummaryText(mode, status, commandCount) {
	if (status === "passed") {
		return `${mode} completed across ${commandCount} command${commandCount === 1 ? "" : "s"}.`;
	}
	return `${mode} failed before completing all command templates.`;
}

function buildReplacements(options, adapterData, context) {
	return {
		baseline_ref: shellEscape(options.baselineRef || "HEAD"),
		baseline_repo: shellEscape(context.baselineRepo),
		candidate_repo: shellEscape(context.candidateRepo),
		history_file: shellEscape(context.historyFile),
		profile: shellEscape(options.profile || adapterData.profile_default || "default"),
		split: shellEscape(options.split || DEFAULT_SPLIT_BY_MODE[options.mode]),
		iterate_samples: String(sampleValue(options.iterateSamples, adapterData.iterate_samples_default, 2)),
		held_out_samples: String(sampleValue(options.heldOutSamples, adapterData.held_out_samples_default, 2)),
		comparison_samples: String(
			sampleValue(options.comparisonSamples, adapterData.comparison_samples_default, 2),
		),
		full_gate_samples: String(sampleValue(options.fullGateSamples, adapterData.full_gate_samples_default, 2)),
		output_dir: shellEscape(context.outputDir),
		candidate_results_file: shellEscape(context.candidateResultsFile),
		report_input_file: shellEscape(context.reportInputFile),
		report_file: shellEscape(context.reportFile),
	};
}

function resolveModeContext(options, adapterPayload) {
	const repoRoot = resolve(options.repoRoot);
	const adapterData = adapterPayload.data;
	const templates = adapterData[MODE_FIELD_BY_NAME[options.mode]] ?? [];
	if (!Array.isArray(templates) || templates.length === 0) {
		fail(`Adapter does not define ${MODE_FIELD_BY_NAME[options.mode]}`);
	}
	const outputDir = resolve(options.outputDir);
	mkdirSync(outputDir, { recursive: true });
	const context = {
		repoRoot,
		adapterData,
		templates,
		outputDir,
		candidateRepo: resolve(options.candidateRepo || repoRoot),
		baselineRepo: resolve(options.baselineRepo || repoRoot),
		historyFile: resolveHistoryFile(repoRoot, adapterData, options.historyFile),
		candidateResultsFile: resolve(
			options.candidateResultsFile || join(outputDir, `${options.mode}-candidate-results.json`),
		),
		reportInputFile: join(outputDir, "report-input.json"),
		reportFile: join(outputDir, "report.json"),
	};
	context.replacements = buildReplacements(options, adapterData, context);
	return context;
}

function executeTemplateSeries(templates, stage, context) {
	const observations = [];
	for (const [index, template] of templates.entries()) {
		const command = renderTemplate(template, context.replacements);
		const result = runShellCommand({
			repoRoot: context.repoRoot,
			command,
			stdoutFile: join(context.outputDir, `${stage}-${index + 1}.stdout`),
			stderrFile: join(context.outputDir, `${stage}-${index + 1}.stderr`),
		});
		const observation = createObservation(stage, index + 1, result);
		observations.push(observation);
		if (result.status !== "passed") {
			break;
		}
	}
	return observations;
}

function executePreflight(options, context) {
	if (options.skipPreflight) {
		return [];
	}
	const observations = executeTemplateSeries(context.adapterData.preflight_commands ?? [], "preflight", context);
	const failedObservation = observations.find((entry) => entry.status !== "passed");
	if (failedObservation) {
		fail(`Preflight command failed: ${failedObservation.command}`);
	}
	return observations;
}

function buildModeReportInput(options, context, modeObservations, commandObservations) {
	const modeStatus = modeObservations.every((entry) => entry.status === "passed") ? "passed" : "failed";
	const candidateResults = readCandidateResults(context.candidateResultsFile);
	const scenarioBuckets = classifyScenarioBuckets(candidateResults);
	const modeRun = {
		mode: options.mode,
		status: modeStatus,
		summary: buildModeSummaryText(options.mode, modeStatus, modeObservations.length),
		...(modeObservations[0]?.startedAt ? { startedAt: modeObservations[0].startedAt } : {}),
		...(modeObservations.at(-1)?.completedAt ? { completedAt: modeObservations.at(-1).completedAt } : {}),
		durationMs: aggregateDuration(modeObservations),
		candidateResults,
	};
	return {
		schemaVersion: REPORT_INPUTS_SCHEMA,
		candidate: context.candidateRepo,
		baseline: options.baselineRef || context.baselineRepo,
		intent: options.intent,
		commands: modeObservations.map((entry) => ({
			mode: options.mode,
			command: entry.command,
			label: `${options.mode}-${entry.index}`,
		})),
		commandObservations,
		modeRuns: [modeRun],
		improved: scenarioBuckets.improved,
		regressed: scenarioBuckets.regressed,
		unchanged: scenarioBuckets.unchanged,
		noisy: scenarioBuckets.noisy,
		humanReviewFindings: [],
		recommendation:
			modeStatus === "passed"
				? recommendationOnPass(options.mode, options.recommendationOnPass)
				: "reject",
	};
}

function persistModeReport(context, reportInput) {
	writeFileSync(context.reportInputFile, `${JSON.stringify(reportInput, null, 2)}\n`, "utf-8");
	const report = buildReportPacket(reportInput);
	writeFileSync(context.reportFile, `${JSON.stringify(report, null, 2)}\n`, "utf-8");
	return report;
}

export function evaluateAdapterMode(inputOptions) {
	const options = parseArgs(inputOptions);
	const adapterPayload = loadAdapter(options);
	const context = resolveModeContext(options, adapterPayload);
	const preflightObservations = executePreflight(options, context);
	const modeObservations = executeTemplateSeries(context.templates, options.mode, context);
	const commandObservations = [...preflightObservations, ...modeObservations];
	const reportInput = buildModeReportInput(options, context, modeObservations, commandObservations);
	const report = persistModeReport(context, reportInput);
	return {
		schemaVersion: ADAPTER_MODE_EVALUATION_PACKET_SCHEMA,
		repoRoot: context.repoRoot,
		adapterPath: adapterPayload.path,
		mode: options.mode,
		reportInputFile: context.reportInputFile,
		reportFile: context.reportFile,
		commandObservations,
		report,
	};
}

export function main(argv = process.argv.slice(2)) {
	try {
		const packet = evaluateAdapterMode(argv);
		writeFileSync(
			packet.reportFile.replace(/\.json$/, ".mode-evaluation.json"),
			`${JSON.stringify(packet, null, 2)}\n`,
			"utf-8",
		);
		process.stdout.write(`${packet.reportFile}\n`);
	} catch (error) {
		if (error instanceof Error) {
			process.stderr.write(`${error.message}\n`);
		} else {
			process.stderr.write(`${String(error)}\n`);
		}
		process.exit(1);
	}
}

const entryHref = process.argv[1] ? pathToFileURL(resolve(process.argv[1])).href : "";
if (import.meta.url === entryHref) {
	main();
}
