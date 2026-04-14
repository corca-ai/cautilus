import { cpSync, existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";
import process from "node:process";

import { loadAdapter as loadAdapterPayload } from "./resolve_adapter.mjs";
import { pruneWorkspaceArtifacts } from "./agent-runtime/prune-workspace-artifacts.mjs";
import { enrichExperimentPrompt } from "./self-dogfood-experiment-prompt.mjs";

const SCRIPT_DIR = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(SCRIPT_DIR, "..");
const BIN_PATH = join(REPO_ROOT, "bin", "cautilus");
const STATUS_RANK = new Map([
	["pass", 0],
	["concern", 1],
	["blocker", 2],
]);
const DEFAULT_REVIEW_TIMEOUT_MS = 20000;
const DEFAULT_EXPERIMENT_ADAPTERS = [
	"self-dogfood-gate-honesty-a",
	"self-dogfood-gate-honesty-b",
	"self-dogfood-binary-surface",
	"self-dogfood-skill-surface",
	"self-dogfood-review-completion",
];

function usage(exitCode = 0) {
	const text = [
		"Usage:",
		"  node ./scripts/run-self-dogfood-experiments.mjs [--repo-root <dir>] [--workspace <dir>] [--artifact-root <dir>] [--baseline-ref <ref>] [--intent <text>] [--experiment-adapter-name <name>] [--gate-adapter-name <name>] [--gate-adapter <path>] [--run-id <id>] [--keep-last <n>] [--review-timeout-ms <ms>] [--quiet]",
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

function parsePositiveInteger(value, option) {
	const parsed = Number(value);
	if (!Number.isInteger(parsed) || parsed < 0) {
		fail(`${option} must be a non-negative integer`);
	}
	return parsed;
}

function defaultOptions() {
	return {
		repoRoot: process.cwd(),
		workspace: null,
		artifactRoot: null,
		baselineRef: "origin/main",
		intent:
			"Cautilus should keep stronger self-dogfood claims proportional to the evidence each surface actually proves.",
		gateAdapter: null,
		gateAdapterName: null,
		experimentAdapterNames: [],
		runId: null,
		keepLast: 5,
		reviewTimeoutMs: null,
		quiet: false,
	};
}

function applyArgument(options, argv, index) {
	const arg = argv[index];
	if (arg === "-h" || arg === "--help") {
		usage(0);
	}
	if (arg === "--quiet") {
		options.quiet = true;
		return index;
	}
	if (arg === "--experiment-adapter-name") {
		options.experimentAdapterNames.push(readRequiredValue(argv, index + 1, arg));
		return index + 1;
	}
	const field = {
		"--repo-root": "repoRoot",
		"--workspace": "workspace",
		"--artifact-root": "artifactRoot",
		"--baseline-ref": "baselineRef",
		"--intent": "intent",
		"--gate-adapter": "gateAdapter",
		"--gate-adapter-name": "gateAdapterName",
		"--run-id": "runId",
	}[arg];
	if (field) {
		options[field] = readRequiredValue(argv, index + 1, arg);
		return index + 1;
	}
	if (arg === "--keep-last") {
		options.keepLast = parsePositiveInteger(readRequiredValue(argv, index + 1, arg), arg);
		return index + 1;
	}
	if (arg === "--review-timeout-ms") {
		options.reviewTimeoutMs = parsePositiveInteger(readRequiredValue(argv, index + 1, arg), arg);
		return index + 1;
	}
	fail(`Unknown argument: ${arg}`);
}

function parseArgs(argv) {
	const options = defaultOptions();
	for (let index = 0; index < argv.length; index += 1) {
		index = applyArgument(options, argv, index);
	}
	if (options.gateAdapter && options.gateAdapterName) {
		fail("Use either --gate-adapter or --gate-adapter-name, not both.");
	}
	if (options.experimentAdapterNames.length === 0) {
		options.experimentAdapterNames = [...DEFAULT_EXPERIMENT_ADAPTERS];
	}
	return options;
}

function createRunId(now = new Date()) {
	return now.toISOString().replace(/:/g, "-");
}

function runCautilus(repoRoot, args, quiet, timeoutMs = null) {
	return spawnSync(BIN_PATH, args, {
		cwd: repoRoot,
		encoding: "utf-8",
		env: process.env,
		timeout: timeoutMs ?? undefined,
		stdio: quiet ? "pipe" : ["ignore", "pipe", "pipe"],
	});
}

function loadAdapter(repoRoot, adapter, adapterName) {
	return loadAdapterPayload(repoRoot, { adapter, adapterName });
}

function expectSuccess(result, label) {
	if (result.status === 0) {
		return;
	}
	fail(`${label} failed.\n${result.stderr}`);
}

function readJsonFile(path, label) {
	if (!existsSync(path)) {
		fail(`${label} not found: ${path}`);
	}
	return JSON.parse(readFileSync(path, "utf-8"));
}

function readJsonPathFromStdout(result, label) {
	const filePath = result.stdout.trim();
	if (!filePath) {
		fail(`${label} did not print an artifact path.\n${result.stderr}`);
	}
	return resolve(filePath);
}

function maxStatus(current, next) {
	return STATUS_RANK.get(next) > STATUS_RANK.get(current) ? next : current;
}

function timedOut(result) {
	return result.error?.code === "ETIMEDOUT";
}

function statusFromRecommendation(recommendation) {
	if (recommendation === "accept-now") {
		return "pass";
	}
	if (recommendation === "defer") {
		return "concern";
	}
	return "blocker";
}

function recommendationFromStatus(status) {
	if (status === "pass") {
		return "accept-now";
	}
	if (status === "concern") {
		return "defer";
	}
	return "reject";
}

function statusFromVariant(variant) {
	if (variant.status !== "passed") {
		return "blocker";
	}
	const verdict = variant.output && typeof variant.output.verdict === "string" ? variant.output.verdict : "concern";
	return STATUS_RANK.has(verdict) ? verdict : "concern";
}

function summarizeExperimentStatus(summary) {
	let overallStatus = "pass";
	let findingsCount = 0;
	for (const variant of summary.variants) {
		overallStatus = maxStatus(overallStatus, statusFromVariant(variant));
		findingsCount += Array.isArray(variant.output?.findings) ? variant.output.findings.length : 0;
	}
	return {
		overallStatus,
		findingsCount,
	};
}

function syntheticReviewSummary(reviewDir, timeoutMs, reviewAdapterName) {
	const summaryPath = join(reviewDir, "review-summary.json");
	const message = `Self-dogfood experiment timed out after ${timeoutMs}ms.`;
	const summary = {
		repoRoot: null,
		adapterPath: reviewAdapterName,
		workspace: null,
		promptFile: join(reviewDir, "review.prompt.md"),
		reviewPacketFile: join(reviewDir, "review-packet.json"),
		reviewPromptInputFile: join(reviewDir, "review-prompt-input.json"),
		schemaFile: null,
		outputDir: reviewDir,
		telemetry: {
			durationMs: timeoutMs,
			averageVariantDurationMs: timeoutMs,
			variantCount: 1,
			passedVariantCount: 0,
			failedVariantCount: 1,
		},
		variants: [
			{
				id: `${reviewAdapterName}-timeout`,
				tool: "codex_exec",
				status: "failed",
				outputFile: null,
				stdoutFile: null,
				stderrFile: null,
				command: null,
				stdout: "",
				stderr: message,
				telemetry: null,
				output: {
					verdict: "blocker",
					summary: message,
					findings: [
						{
							severity: "blocker",
							message,
							path: `self-dogfood/experiments/${reviewAdapterName}`,
						},
					],
				},
			},
		],
	};
	writeFileSync(summaryPath, `${JSON.stringify(summary, null, 2)}\n`, "utf-8");
	return { summaryPath, summary };
}

function prepareExperimentPrompt(repoRoot, reportPath, reviewDir, adapterName, timeoutMs, options) {
	const reviewPacketPath = join(reviewDir, "review-packet.json");
	const promptInputPath = join(reviewDir, "review-prompt-input.json");
	const promptPath = join(reviewDir, "review.prompt.md");
	expectSuccess(
		runCautilus(
			repoRoot,
			[
				"review",
				"prepare-input",
				"--repo-root",
				repoRoot,
				"--report-file",
				reportPath,
				"--adapter-name",
				adapterName,
				"--output",
				reviewPacketPath,
			],
			options.quiet,
		),
		`review prepare-input (${adapterName})`,
	);
	expectSuccess(
		runCautilus(
			repoRoot,
			[
				"review",
				"build-prompt-input",
				"--review-packet",
				reviewPacketPath,
				"--output",
				promptInputPath,
			],
			options.quiet,
		),
		`review build-prompt-input (${adapterName})`,
	);
	expectSuccess(
		runCautilus(
			repoRoot,
			[
				"review",
				"render-prompt",
				"--input",
				promptInputPath,
				"--output",
				promptPath,
			],
			options.quiet,
		),
		`review render-prompt (${adapterName})`,
	);
	enrichExperimentPrompt({
		promptPath,
		promptInputPath,
		adapterName,
		reviewTimeoutMs: timeoutMs,
		currentReportPath: reportPath,
		projectedReviewSummaryPath: join(reviewDir, "review-summary.json"),
		projectedSummaryPath: join(reviewDir, "..", "summary.json"),
	});
	return { promptPath, reviewPacketPath, promptInputPath };
}

function writeLatestArtifacts(runDir, latestDir) {
	rmSync(latestDir, { recursive: true, force: true });
	mkdirSync(dirname(latestDir), { recursive: true });
	cpSync(runDir, latestDir, { recursive: true });
}

function pruneRuns(runsRoot, keepLast) {
	if (!existsSync(runsRoot)) {
		return;
	}
	pruneWorkspaceArtifacts(["--root", runsRoot, "--keep-last", String(keepLast)]);
}

function reportExitCode(summary) {
	return summary.overallStatus === "pass" ? 0 : 1;
}

function resolveRuntimePaths(options) {
	const repoRoot = resolve(options.repoRoot);
	const workspace = resolve(options.workspace ?? repoRoot);
	const artifactRoot = resolve(options.artifactRoot ?? join(repoRoot, "artifacts", "self-dogfood", "experiments"));
	const runsRoot = join(artifactRoot, "runs");
	const latestRoot = join(artifactRoot, "latest");
	const runId = options.runId || createRunId();
	const runDir = join(runsRoot, runId);
	return {
		repoRoot,
		workspace,
		artifactRoot,
		runsRoot,
		latestRoot,
		runId,
		runDir,
		modeDir: join(runDir, "mode"),
		experimentsDir: join(runDir, "experiments"),
	};
}

function ensureRunDirectories(paths) {
	mkdirSync(paths.modeDir, { recursive: true });
	mkdirSync(paths.experimentsDir, { recursive: true });
}

function runModeEvaluation(repoRoot, workspace, modeDir, options) {
	const args = [
		"mode",
		"evaluate",
		"--repo-root",
		repoRoot,
		"--candidate-repo",
		workspace,
		"--mode",
		"full_gate",
		"--intent",
		options.intent,
		"--baseline-ref",
		options.baselineRef,
		"--output-dir",
		modeDir,
		...(options.gateAdapter ? ["--adapter", options.gateAdapter] : []),
		...(options.gateAdapterName ? ["--adapter-name", options.gateAdapterName] : []),
		...(options.quiet ? ["--quiet"] : []),
	];
	const result = runCautilus(repoRoot, args, options.quiet);
	const reportPath = readJsonPathFromStdout(result, "mode evaluate");
	return {
		reportPath,
		report: readJsonFile(reportPath, "mode report"),
	};
}

function runExperimentReview(repoRoot, workspace, reportPath, reviewDir, adapterName, options) {
	mkdirSync(reviewDir, { recursive: true });
	const adapterPayload = loadAdapter(repoRoot, null, adapterName);
	const timeoutMs = options.reviewTimeoutMs ?? adapterPayload.data.review_timeout_ms ?? DEFAULT_REVIEW_TIMEOUT_MS;
	const promptArtifacts = prepareExperimentPrompt(repoRoot, reportPath, reviewDir, adapterName, timeoutMs, options);
	const args = [
		"review",
		"variants",
		"--repo-root",
		repoRoot,
		"--workspace",
		workspace,
		"--prompt-file",
		promptArtifacts.promptPath,
		"--output-dir",
		reviewDir,
		"--adapter-name",
		adapterName,
		...(options.quiet ? ["--quiet"] : []),
	];
	const result = runCautilus(repoRoot, args, options.quiet, timeoutMs);
	if (timedOut(result)) {
		return syntheticReviewSummary(reviewDir, timeoutMs, adapterName);
	}
	const summaryPath = readJsonPathFromStdout(result, `review variants (${adapterName})`);
	return {
		summaryPath,
		summary: readJsonFile(summaryPath, `review summary (${adapterName})`),
	};
}

function buildExperimentRecord(adapterName, summaryPath, summary) {
	const { overallStatus, findingsCount } = summarizeExperimentStatus(summary);
	const firstVariant = summary.variants[0] ?? null;
	return {
		adapterName,
		summaryPath,
		overallStatus,
		executionStatus:
			summary.variants.every((variant) => variant.status === "passed") ? "passed" : "failed",
		findingsCount,
		telemetry: summary.telemetry ?? null,
		variants: summary.variants.map((variant) => ({
			id: variant.id,
			executionStatus: variant.status,
			verdict: variant.output?.verdict ?? null,
			summary: variant.output?.summary ?? null,
			findingsCount: Array.isArray(variant.output?.findings) ? variant.output.findings.length : 0,
			outputFile: variant.outputFile,
		})),
		primarySummary: firstVariant?.output?.summary ?? null,
	};
}

function buildSummary({ repoRoot, workspace, artifactRoot, runId, baselineRef, intent, reportPath, report, experiments }) {
	let overallStatus = statusFromRecommendation(report.recommendation);
	for (const experiment of experiments) {
		overallStatus = maxStatus(overallStatus, experiment.overallStatus);
	}
	return {
		generatedAt: new Date().toISOString(),
		repoRoot,
		workspace,
		artifactRoot,
		runId,
		baselineRef,
		intent,
		overallStatus,
		reportRecommendation: recommendationFromStatus(overallStatus),
		gateRecommendation: report.recommendation,
		reportPath,
		modeTelemetry: report.telemetry ?? null,
		experiments,
	};
}

function renderMarkdown(summary) {
	const hasTimeout = summary.experiments.some((experiment) =>
		experiment.executionStatus === "failed"
		&& experiment.variants.some((variant) =>
			typeof variant.summary === "string" && variant.summary.includes("timed out"),
		),
	);
	const nextAction = summary.overallStatus === "pass"
		? "No immediate action. The current experiment set is green."
		: hasTimeout
			? "Raise --review-timeout-ms or remove slow experiment adapters before comparing verdict quality."
			: "Inspect blocker or concern experiment findings before changing the canonical self-dogfood adapter.";
	const lines = [
		"# Cautilus Self-Dogfood Experiments",
		"",
		`- generatedAt: ${summary.generatedAt}`,
		`- runId: ${summary.runId}`,
		`- baselineRef: ${summary.baselineRef}`,
		`- overallStatus: ${summary.overallStatus}`,
		`- reportRecommendation: ${summary.reportRecommendation}`,
		`- gateRecommendation: ${summary.gateRecommendation}`,
		"",
		"## Intent",
		"",
		summary.intent,
		"",
		"## Current Reading",
		"",
		`- deterministic gate: ${summary.gateRecommendation === "accept-now" ? "passed" : summary.gateRecommendation}`,
		`- experiments overall: ${summary.overallStatus}`,
		`- next action: ${nextAction}`,
		"",
		"## Experiments",
		"",
	];
	for (const experiment of summary.experiments) {
		lines.push(
			`- ${experiment.adapterName}: execution=${experiment.executionStatus}, verdict=${experiment.overallStatus}, findings=${experiment.findingsCount}`,
		);
		if (experiment.primarySummary) {
			lines.push(`  summary: ${experiment.primarySummary}`);
		}
	}
	lines.push(
		"",
		"## Artifacts",
		"",
		`- report.json: ${summary.reportPath}`,
		`- summary.json: ${join(summary.artifactRoot, "latest", "summary.json")}`,
		`- latest.md: ${join(summary.artifactRoot, "latest", "latest.md")}`,
	);
	return `${lines.join("\n")}\n`;
}

function writeRunArtifacts(paths, report, summary) {
	writeFileSync(join(paths.runDir, "report.json"), `${JSON.stringify(report, null, 2)}\n`, "utf-8");
	writeFileSync(join(paths.runDir, "summary.json"), `${JSON.stringify(summary, null, 2)}\n`, "utf-8");
	writeFileSync(join(paths.runDir, "latest.md"), renderMarkdown(summary), "utf-8");
	const renderResult = runCautilus(REPO_ROOT, ["self-dogfood", "render-experiments-html", "--latest-dir", paths.runDir], true);
	if (renderResult.status !== 0) {
		fail(`self-dogfood render-experiments-html failed.\n${renderResult.stderr}`);
	}
}

function finalizeRun(paths, summary, keepLast) {
	writeLatestArtifacts(paths.runDir, paths.latestRoot);
	pruneRuns(paths.runsRoot, keepLast);
	process.stdout.write(`${join(paths.latestRoot, "summary.json")}\n`);
	process.exit(reportExitCode(summary));
}

function main(argv = process.argv.slice(2)) {
	const options = parseArgs(argv);
	const paths = resolveRuntimePaths(options);
	ensureRunDirectories(paths);

	const { reportPath, report } = runModeEvaluation(paths.repoRoot, paths.workspace, paths.modeDir, options);
	const experiments = options.experimentAdapterNames.map((adapterName) => {
		const reviewDir = join(paths.experimentsDir, adapterName);
		const reviewArtifacts = runExperimentReview(paths.repoRoot, paths.workspace, reportPath, reviewDir, adapterName, options);
		return buildExperimentRecord(adapterName, reviewArtifacts.summaryPath, reviewArtifacts.summary);
	});
	const summary = buildSummary({
		repoRoot: paths.repoRoot,
		workspace: paths.workspace,
		artifactRoot: paths.artifactRoot,
		runId: paths.runId,
		baselineRef: options.baselineRef,
		intent: options.intent,
		reportPath: join(paths.runDir, "report.json"),
		report,
		experiments,
	});
	writeRunArtifacts(paths, report, summary);
	finalizeRun(paths, summary, options.keepLast);
}

const entryHref = process.argv[1] ? new URL(`file://${process.argv[1]}`).href : "";
if (import.meta.url === entryHref) {
	main();
}
