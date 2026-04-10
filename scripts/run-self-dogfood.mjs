import { cpSync, existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";
import process from "node:process";

import { pruneWorkspaceArtifacts } from "./agent-runtime/prune-workspace-artifacts.mjs";
import { enrichExperimentPrompt } from "./self-dogfood-experiment-prompt.mjs";

const SCRIPT_DIR = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(SCRIPT_DIR, "..");
const BIN_PATH = join(REPO_ROOT, "bin", "cautilus");
const RESOLVE_ADAPTER_SCRIPT = join(REPO_ROOT, "scripts", "resolve_adapter.py");
const STATUS_RANK = new Map([
	["pass", 0],
	["concern", 1],
	["blocker", 2],
]);
const DEFAULT_REVIEW_TIMEOUT_MS = 120000;

function usage(exitCode = 0) {
	const text = [
		"Usage:",
		"  node ./scripts/run-self-dogfood.mjs [--repo-root <dir>] [--workspace <dir>] [--artifact-root <dir>] [--baseline-ref <ref>] [--intent <text>] [--review-adapter-name <name>] [--review-adapter <path>] [--gate-adapter-name <name>] [--gate-adapter <path>] [--run-id <id>] [--keep-last <n>] [--review-timeout-ms <ms>] [--quiet]",
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
			"Cautilus should record and surface its own self-dogfood result honestly before operators trust broader consumer runs.",
		reviewAdapter: null,
		reviewAdapterName: null,
		gateAdapter: null,
		gateAdapterName: null,
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
	const field = {
		"--repo-root": "repoRoot",
		"--workspace": "workspace",
		"--artifact-root": "artifactRoot",
		"--baseline-ref": "baselineRef",
		"--intent": "intent",
		"--review-adapter": "reviewAdapter",
		"--review-adapter-name": "reviewAdapterName",
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
	if (options.reviewAdapter && options.reviewAdapterName) {
		fail("Use either --review-adapter or --review-adapter-name, not both.");
	}
	if (options.gateAdapter && options.gateAdapterName) {
		fail("Use either --gate-adapter or --gate-adapter-name, not both.");
	}
	if (!options.reviewAdapter && !options.reviewAdapterName) {
		options.reviewAdapterName = "self-dogfood";
	}
	return options;
}

function createRunId(now = new Date()) {
	return now.toISOString().replace(/:/g, "-");
}

function runCautilus(repoRoot, args, quiet, timeoutMs = null) {
	return spawnSync("node", [BIN_PATH, ...args], {
		cwd: repoRoot,
		encoding: "utf-8",
		env: process.env,
		timeout: timeoutMs ?? undefined,
		stdio: quiet ? "pipe" : ["ignore", "pipe", "pipe"],
	});
}

function loadAdapter(repoRoot, adapter, adapterName) {
	const args = [RESOLVE_ADAPTER_SCRIPT, "--repo-root", repoRoot];
	if (adapter) {
		args.push("--adapter", adapter);
	}
	if (adapterName) {
		args.push("--adapter-name", adapterName);
	}
	const result = spawnSync("python3", args, {
		cwd: repoRoot,
		encoding: "utf-8",
	});
	if (result.status !== 0) {
		fail(`adapter resolve failed.\n${result.stderr}`);
	}
	return JSON.parse(result.stdout);
}

function resolveReviewTimeoutMs(options, repoRoot) {
	if (options.reviewTimeoutMs !== null) {
		return options.reviewTimeoutMs;
	}
	const adapterPayload = loadAdapter(repoRoot, options.reviewAdapter, options.reviewAdapterName);
	return adapterPayload.data.review_timeout_ms ?? DEFAULT_REVIEW_TIMEOUT_MS;
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

function buildSummary({ repoRoot, workspace, artifactRoot, runId, baselineRef, intent, reportPath, report, reviewSummaryPath, reviewSummary }) {
	let overallStatus = statusFromRecommendation(report.recommendation);
	for (const variant of reviewSummary.variants) {
		overallStatus = maxStatus(overallStatus, statusFromVariant(variant));
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
		reviewSummaryPath,
		reviewTelemetry: reviewSummary.telemetry ?? null,
		reviewVariants: reviewSummary.variants.map((variant) => ({
			id: variant.id,
			tool: variant.tool,
			executionStatus: variant.status,
			verdict: variant.output?.verdict ?? null,
			summary: variant.output?.summary ?? null,
			findingsCount: Array.isArray(variant.output?.findings) ? variant.output.findings.length : 0,
			outputFile: variant.outputFile,
		})),
	};
}

function renderMarkdown(summary) {
	const hasTimeout = summary.reviewVariants.some((variant) =>
		variant.executionStatus === "failed"
			&& typeof variant.summary === "string"
			&& variant.summary.includes("timed out"),
	);
	const nextAction = summary.overallStatus === "pass"
		? "No immediate action. The last explicit self-dogfood run is green."
		: hasTimeout
			? "Increase --review-timeout-ms or trim the named self-dogfood review surface before trusting the latest report."
			: "Inspect review-summary.json before trusting the automated recommendation.";
	const lines = [
		"# Cautilus Self-Dogfood",
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
		`- explicit review: ${summary.overallStatus}`,
		`- next action: ${nextAction}`,
		"",
		"## Review Variants",
		"",
	];
	for (const variant of summary.reviewVariants) {
		lines.push(
			`- ${variant.id}: execution=${variant.executionStatus}, verdict=${variant.verdict ?? "n/a"}, findings=${variant.findingsCount}`,
		);
		if (variant.summary) {
			lines.push(`  summary: ${variant.summary}`);
		}
	}
	lines.push(
		"",
		"## Artifacts",
		"",
		`- report.json: ${summary.reportPath}`,
		`- review-summary.json: ${summary.reviewSummaryPath}`,
		`- summary.json: ${join(summary.artifactRoot, "latest", "summary.json")}`,
	);
	return `${lines.join("\n")}\n`;
}

function syntheticReviewSummary(reviewDir, timeoutMs, reviewAdapterName) {
	const summaryPath = join(reviewDir, "summary.json");
	const message = `Self-dogfood review variants timed out after ${timeoutMs}ms.`;
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
				id: "review-timeout",
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
							path: "self-dogfood/review",
						},
					],
				},
			},
		],
	};
	writeFileSync(summaryPath, `${JSON.stringify(summary, null, 2)}\n`, "utf-8");
	return { summaryPath, summary };
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
	const artifactRoot = resolve(options.artifactRoot ?? join(repoRoot, "artifacts", "self-dogfood"));
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
		reviewDir: join(runDir, "review"),
	};
}

function ensureRunDirectories(paths) {
	mkdirSync(paths.modeDir, { recursive: true });
	mkdirSync(paths.reviewDir, { recursive: true });
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

function prepareReviewPrompt(repoRoot, modeReportPath, reviewDir, options) {
	const reviewPacketPath = join(reviewDir, "review-packet.json");
	const promptInputPath = join(reviewDir, "review-prompt-input.json");
	const promptPath = join(reviewDir, "review.prompt.md");
	const reviewPrepareArgs = [
		"review",
		"prepare-input",
		"--repo-root",
		repoRoot,
		"--report-file",
		modeReportPath,
		"--output",
		reviewPacketPath,
		...(options.reviewAdapter ? ["--adapter", options.reviewAdapter] : []),
		...(options.reviewAdapterName ? ["--adapter-name", options.reviewAdapterName] : []),
	];
	const reviewPrepare = runCautilus(repoRoot, reviewPrepareArgs, options.quiet);
	if (reviewPrepare.status !== 0) {
		fail(`review prepare-input failed.\n${reviewPrepare.stderr}`);
	}
	const promptInputResult = runCautilus(
		repoRoot,
		["review", "build-prompt-input", "--review-packet", reviewPacketPath, "--output", promptInputPath],
		options.quiet,
	);
	if (promptInputResult.status !== 0) {
		fail(`review build-prompt-input failed.\n${promptInputResult.stderr}`);
	}
	const renderPromptResult = runCautilus(
		repoRoot,
		["review", "render-prompt", "--input", promptInputPath, "--output", promptPath],
		options.quiet,
	);
	if (renderPromptResult.status !== 0) {
		fail(`review render-prompt failed.\n${renderPromptResult.stderr}`);
	}
	enrichExperimentPrompt({
		promptPath,
		promptInputPath,
		adapterName: options.reviewAdapterName ?? "self-dogfood",
		reviewTimeoutMs: options.reviewTimeoutMs,
	});
	return { reviewPacketPath, promptInputPath, promptPath };
}

function runReviewVariants(repoRoot, workspace, reviewDir, modeReportPath, options) {
	const promptArtifacts = prepareReviewPrompt(repoRoot, modeReportPath, reviewDir, options);
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
		...(options.reviewAdapter ? ["--adapter", options.reviewAdapter] : []),
		...(options.reviewAdapterName ? ["--adapter-name", options.reviewAdapterName] : []),
		...(options.quiet ? ["--quiet"] : []),
	];
	const result = runCautilus(repoRoot, args, options.quiet, options.reviewTimeoutMs);
	if (timedOut(result)) {
		return syntheticReviewSummary(reviewDir, options.reviewTimeoutMs, options.reviewAdapter ?? options.reviewAdapterName);
	}
	const summaryPath = readJsonPathFromStdout(result, "review variants");
	return {
		summaryPath,
		summary: readJsonFile(summaryPath, "review summary"),
	};
}

function persistRunArtifacts(paths, report, reviewSummary, summary) {
	const runReportPath = join(paths.runDir, "report.json");
	const runReviewSummaryPath = join(paths.runDir, "review-summary.json");
	writeFileSync(runReportPath, `${JSON.stringify(report, null, 2)}\n`, "utf-8");
	writeFileSync(runReviewSummaryPath, `${JSON.stringify(reviewSummary, null, 2)}\n`, "utf-8");
	writeFileSync(join(paths.runDir, "summary.json"), `${JSON.stringify(summary, null, 2)}\n`, "utf-8");
	writeFileSync(join(paths.runDir, "latest.md"), renderMarkdown(summary), "utf-8");
	return { runReportPath, runReviewSummaryPath };
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
	const reviewTimeoutMs = resolveReviewTimeoutMs(options, paths.repoRoot);
	ensureRunDirectories(paths);

	const { reportPath, report } = runModeEvaluation(paths.repoRoot, paths.workspace, paths.modeDir, options);
	const reviewArtifacts = runReviewVariants(
		paths.repoRoot,
		paths.workspace,
		paths.reviewDir,
		reportPath,
		{ ...options, reviewTimeoutMs },
	);
	const reviewSummary = reviewArtifacts.summary;
	const summary = buildSummary({
		repoRoot: paths.repoRoot,
		workspace: paths.workspace,
		artifactRoot: paths.artifactRoot,
		runId: paths.runId,
		baselineRef: options.baselineRef,
		intent: options.intent,
		reportPath: join(paths.runDir, "report.json"),
		report,
		reviewSummaryPath: join(paths.runDir, "review-summary.json"),
		reviewSummary,
	});
	persistRunArtifacts(paths, report, reviewSummary, summary);
	finalizeRun(paths, summary, options.keepLast);
}

const entryHref = process.argv[1] ? new URL(`file://${process.argv[1]}`).href : "";
if (import.meta.url === entryHref) {
	main();
}
