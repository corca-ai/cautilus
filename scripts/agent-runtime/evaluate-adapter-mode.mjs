import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import process from "node:process";

import { loadAdapter as loadAdapterPayload } from "../resolve_adapter.mjs";
import {
	ADAPTER_MODE_EVALUATION_PACKET_SCHEMA,
	REPORT_INPUTS_SCHEMA,
	SCENARIO_RESULTS_SCHEMA,
} from "./contract-versions.mjs";
import { resolveRunDir } from "./active-run.mjs";
import { buildReportPacket } from "./build-report-packet.mjs";
import {
	createProgressLogger,
	ownershipHintForRepo,
	runBashCommandWithProgress,
} from "./command-progress.mjs";
import {
	createScenarioBaselineCacheSeed,
	loadScenarioHistory,
	loadScenarioProfile,
	saveScenarioHistory,
	selectProfileScenarioIds,
	updateScenarioHistory,
} from "./scenario-history.mjs";
import { normalizeScenarioResultsPacket } from "./scenario-results.mjs";
import {
	buildModeSummaryText,
	classifyScenarioBuckets,
	resolvedModeStatus,
} from "./mode-evaluation-summary.mjs";

export { ADAPTER_MODE_EVALUATION_PACKET_SCHEMA } from "./contract-versions.mjs";

const SCRIPT_DIR = dirname(fileURLToPath(import.meta.url));
const TOOL_ROOT = resolve(SCRIPT_DIR, "..", "..");
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
	"--candidate-results-file": "scenarioResultsFile",
	"--scenario-results-file": "scenarioResultsFile",
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
		"  node ./scripts/agent-runtime/evaluate-adapter-mode.mjs --repo-root <dir> --mode <iterate|held_out|comparison|full_gate> --intent <text> [--output-dir <dir>] [--baseline-ref <ref>] [--baseline-repo <dir>] [--candidate-repo <dir>] [--adapter <path> | --adapter-name <name>] [--history-file <path>] [--profile <name>] [--split <name>] [--scenario-results-file <path>] [--skip-preflight] [--quiet]",
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
		scenarioResultsFile: null,
		recommendationOnPass: null,
		quiet: false,
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
	if (arg === "--quiet") {
		options.quiet = true;
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
	const payload = loadAdapterPayload(repoRoot, {
		adapter: options.adapter,
		adapterName: options.adapterName,
	});
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
function profileReference(options, adapterData) {
	return options.profile || adapterData.profile_default || "default";
}

function resolveScenarioProfile(repoRoot, reference) {
	const candidatePath = resolve(repoRoot, reference);
	if (!existsSync(candidatePath)) {
		return null;
	}
	return {
		path: candidatePath,
		profile: loadScenarioProfile(candidatePath),
	};
}

function emptyScenarioResultsPacket(mode) {
	return {
		schemaVersion: SCENARIO_RESULTS_SCHEMA,
		source: `mode_evaluate:${mode}`,
		mode,
		results: [],
	};
}

function readScenarioResults(path, mode) {
	if (!existsSync(path)) {
		return emptyScenarioResultsPacket(mode);
	}
	const parsed = JSON.parse(readFileSync(path, "utf-8"));
	const normalized = normalizeScenarioResultsPacket(parsed, "scenarioResults");
	if (normalized.mode && normalized.mode !== mode) {
		fail(`scenario results mode ${normalized.mode} does not match requested mode ${mode}`);
	}
	return normalized.mode ? normalized : { ...normalized, mode };
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

function sha256(value) {
	return createHash("sha256").update(value).digest("hex");
}
function resolveBaselineFingerprint(context, options) {
	try {
		return execFileSync("git", ["-C", context.baselineRepo, "rev-parse", "HEAD"], {
			encoding: "utf-8",
		}).trim();
	} catch {
		return sha256(JSON.stringify({ baselineRepo: context.baselineRepo, baselineRef: options.baselineRef || "HEAD" }));
	}
}
function baselineRepoLabel(context, options, baselineFingerprint) { return `${options.baselineRef || "HEAD"}@${baselineFingerprint.slice(0, 12)}`; }

function buildReplacements(options, adapterData, context) {
	return {
		baseline_ref: shellEscape(options.baselineRef || "HEAD"),
		baseline_repo: shellEscape(context.baselineRepo),
		candidate_repo: shellEscape(context.candidateRepo),
		history_file: shellEscape(context.historyFile),
		profile: shellEscape(context.profileArgument),
		split: shellEscape(options.split || DEFAULT_SPLIT_BY_MODE[options.mode]),
		selected_scenario_ids_file: shellEscape(context.selectedScenarioIdsFile),
		iterate_samples: String(sampleValue(options.iterateSamples, adapterData.iterate_samples_default, 2)),
		held_out_samples: String(sampleValue(options.heldOutSamples, adapterData.held_out_samples_default, 2)),
		comparison_samples: String(
			sampleValue(options.comparisonSamples, adapterData.comparison_samples_default, 2),
		),
		full_gate_samples: String(sampleValue(options.fullGateSamples, adapterData.full_gate_samples_default, 2)),
		output_dir: shellEscape(context.outputDir),
		candidate_results_file: shellEscape(context.scenarioResultsFile),
		scenario_results_file: shellEscape(context.scenarioResultsFile),
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
	const resolvedRun = resolveRunDir({ outputDir: options.outputDir });
	if (resolvedRun.source === "auto") {
		process.stderr.write(`Active run: ${resolvedRun.runDir}\n`);
	}
	const outputDir = resolvedRun.runDir;
	const selectedSplit = options.split || DEFAULT_SPLIT_BY_MODE[options.mode];
	const profileRef = profileReference(options, adapterData);
	const scenarioProfileInput = resolveScenarioProfile(repoRoot, profileRef);
	const historyFile = resolveHistoryFile(repoRoot, adapterData, options.historyFile);
	const selectedScenarioIdsFile = join(outputDir, "selected-scenario-ids.json");
	const context = {
		repoRoot,
		adapterData,
		templates,
		outputDir,
		candidateRepo: resolve(options.candidateRepo || repoRoot),
		baselineRepo: resolve(options.baselineRepo || repoRoot),
		historyFile,
		profileRef,
		selectedSplit,
		selectedScenarioIdsFile,
		scenarioResultsFile: resolve(
			options.scenarioResultsFile || join(outputDir, `${options.mode}-scenario-results.json`),
		),
		reportInputFile: join(outputDir, "report-input.json"),
		reportFile: join(outputDir, "report.json"),
		baselineCacheFile: join(outputDir, "baseline-cache.json"),
	};
	if (scenarioProfileInput) {
		const history = loadScenarioHistory(historyFile, scenarioProfileInput.profile);
		const selectedScenarioIds = selectProfileScenarioIds({
			profile: scenarioProfileInput.profile,
			split: selectedSplit,
			history,
			fullCheck: options.mode === "full_gate",
		});
		const selectedProfileFile = join(outputDir, "selected-profile.json");
		const filteredProfile = {
			...scenarioProfileInput.profile,
			scenarios: scenarioProfileInput.profile.scenarios.filter((scenario) =>
				selectedScenarioIds.includes(scenario.scenarioId)
			),
		};
		writeFileSync(selectedProfileFile, `${JSON.stringify(filteredProfile, null, 2)}\n`, "utf-8");
		writeFileSync(selectedScenarioIdsFile, `${JSON.stringify(selectedScenarioIds, null, 2)}\n`, "utf-8");
		context.scenarioProfile = scenarioProfileInput.profile;
		context.scenarioProfileFile = scenarioProfileInput.path;
		context.selectedProfileFile = selectedProfileFile;
		context.selectedScenarioIds = selectedScenarioIds;
		context.loadedHistory = history;
		context.profileArgument = selectedProfileFile;
	} else {
		writeFileSync(selectedScenarioIdsFile, "[]\n", "utf-8");
		context.scenarioProfile = null;
		context.selectedScenarioIds = [];
		context.loadedHistory = null;
		context.profileArgument = profileRef;
	}
	context.replacements = buildReplacements(options, adapterData, context);
	return context;
}

async function executeTemplateSeries(templates, stage, context, options, log) {
	const observations = [];
	for (const [index, template] of templates.entries()) {
		const command = renderTemplate(template, context.replacements);
		const label = `${stage} ${index + 1}/${templates.length}`;
		const result = await runBashCommandWithProgress({
			repoRoot: context.repoRoot,
			command,
			stdoutFile: join(context.outputDir, `${stage}-${index + 1}.stdout`),
			stderrFile: join(context.outputDir, `${stage}-${index + 1}.stderr`),
			log,
			startMessage: `${label} start: ${command}`,
			heartbeatMessage: `${label} still running`,
			completionLabel: label,
			ownershipHint: ownershipHintForRepo(TOOL_ROOT, context.repoRoot),
		});
		const observation = createObservation(stage, index + 1, result);
		observations.push(observation);
		if (result.status !== "passed") {
			break;
		}
	}
	return observations;
}

async function executePreflight(options, context, log) {
	if (options.skipPreflight) {
		log("preflight skipped");
		return [];
	}
	const observations = await executeTemplateSeries(
		context.adapterData.preflight_commands ?? [],
		"preflight",
		context,
		options,
		log,
	);
	const failedObservation = observations.find((entry) => entry.status !== "passed");
	if (failedObservation) {
		fail(`Preflight command failed: ${failedObservation.command}`);
	}
	return observations;
}

function buildModeReportInput(options, context, modeObservations, commandObservations) {
	const scenarioResults = readScenarioResults(context.scenarioResultsFile, options.mode);
	const scenarioBuckets = classifyScenarioBuckets(scenarioResults);
	const modeStatus = resolvedModeStatus(modeObservations, scenarioResults);
	const modeRun = {
		mode: options.mode,
		status: modeStatus,
		summary: buildModeSummaryText(options.mode, modeStatus, modeObservations.length, scenarioBuckets),
		...(modeObservations[0]?.startedAt ? { startedAt: modeObservations[0].startedAt } : {}),
		...(modeObservations.at(-1)?.completedAt ? { completedAt: modeObservations.at(-1).completedAt } : {}),
		durationMs: aggregateDuration(modeObservations),
		scenarioResults,
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
function persistBaselineCacheIfNeeded(context, options) {
	if (options.mode !== "comparison" || !context.scenarioProfile || context.selectedScenarioIds.length === 0) {
		return null;
	}
	const baselineFingerprint = resolveBaselineFingerprint(context, options);
	const cacheSeed = createScenarioBaselineCacheSeed({
		profile: context.scenarioProfile,
		selectedScenarioIds: context.selectedScenarioIds,
		baselineFingerprint,
		cacheSampleCount: sampleValue(
			options.comparisonSamples,
			context.adapterData.comparison_samples_default,
			2,
		),
		baselineRepoLabel: baselineRepoLabel(context, options, baselineFingerprint),
	});
	writeFileSync(context.baselineCacheFile, `${JSON.stringify(cacheSeed, null, 2)}\n`, "utf-8");
	return cacheSeed;
}

function persistScenarioHistoryIfNeeded(context, options) {
	if (!context.scenarioProfile) {
		return null;
	}
	const scenarioResults = readScenarioResults(context.scenarioResultsFile, options.mode);
	const timestamp = scenarioResults.completedAt || scenarioResults.timestamp || new Date().toISOString();
	const updatedHistory = updateScenarioHistory({
		profile: context.scenarioProfile,
		history: context.loadedHistory,
		selectedScenarioIds: context.selectedScenarioIds,
		candidateResults: scenarioResults.results,
		timestamp,
		split: context.selectedSplit,
		fullCheck: options.mode === "full_gate",
	});
	saveScenarioHistory(context.historyFile, updatedHistory);
	writeFileSync(join(context.outputDir, "scenario-history.snapshot.json"), `${JSON.stringify(updatedHistory, null, 2)}\n`, "utf-8");
	return updatedHistory;
}

export async function evaluateAdapterMode(inputOptions) {
	const options = parseArgs(inputOptions);
	const adapterPayload = loadAdapter(options);
	const context = resolveModeContext(options, adapterPayload);
	const log = createProgressLogger({ quiet: options.quiet });
	log(`mode evaluate start: mode=${options.mode} repo=${context.repoRoot} output=${context.outputDir}`);
	const preflightObservations = await executePreflight(options, context, log);
	const modeObservations = await executeTemplateSeries(context.templates, options.mode, context, options, log);
	const commandObservations = [...preflightObservations, ...modeObservations];
	const reportInput = buildModeReportInput(options, context, modeObservations, commandObservations);
	const report = persistModeReport(context, reportInput);
	const baselineCache = persistBaselineCacheIfNeeded(context, options);
	const scenarioHistory = persistScenarioHistoryIfNeeded(context, options);
	log(`mode evaluate complete: status=${report.recommendation} report=${context.reportFile}`);
	return {
		schemaVersion: ADAPTER_MODE_EVALUATION_PACKET_SCHEMA,
		repoRoot: context.repoRoot,
		adapterPath: adapterPayload.path,
		mode: options.mode,
		reportInputFile: context.reportInputFile,
		reportFile: context.reportFile,
		historyFile: context.scenarioProfile ? context.historyFile : null,
		selectedScenarioIds: context.selectedScenarioIds,
		baselineCacheFile: baselineCache ? context.baselineCacheFile : null,
		commandObservations,
		...(baselineCache ? { baselineCache } : {}),
		...(scenarioHistory ? { scenarioHistory } : {}),
		report,
	};
}

export async function main(argv = process.argv.slice(2)) {
	try {
		const packet = await evaluateAdapterMode(argv);
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
