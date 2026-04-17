import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { spawnSync } from "node:child_process";
import process from "node:process";
import { pathToFileURL } from "node:url";

import {
	SKILL_EVALUATION_INPUTS_SCHEMA,
} from "./contract-versions.mjs";
import { normalizeSkillTestCaseSuite } from "./skill-test-case-suite.mjs";
import { runClaudeSample } from "./skill-test-claude-backend.mjs";

export { normalizeSkillTestCaseSuite } from "./skill-test-case-suite.mjs";

function usage(exitCode = 0) {
	const text = [
		"Usage:",
		"  node ./scripts/agent-runtime/run-local-skill-test.mjs --repo-root <dir> --workspace <dir> --cases-file <file> --output-file <file> [--artifact-dir <dir>] [--backend codex_exec|fixture] [--fixture-results-file <file>] [--sandbox read-only|workspace-write] [--timeout-ms <ms>] [--model <model>] [--reasoning-effort <level>] [--codex-model <model>] [--codex-reasoning-effort <level>] [--codex-config <key=value>] [--claude-model <model>] [--claude-permission-mode <mode>] [--claude-allowed-tools <rules>]",
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
	if (!Number.isInteger(parsed) || parsed <= 0) {
		fail(`${option} must be a positive integer`);
	}
	return parsed;
}

function defaultOptions() {
	return {
		repoRoot: process.cwd(),
		workspace: process.cwd(),
		casesFile: null,
		outputFile: null,
		artifactDir: null,
		backend: "codex_exec",
		fixtureResultsFile: null,
		sandbox: "read-only",
		timeoutMs: 120000,
		model: null,
		reasoningEffort: null,
		codexModel: null,
		codexReasoningEffort: null,
		codexConfigOverrides: [],
		claudeModel: null,
		claudePermissionMode: null,
		claudeAllowedTools: null,
	};
}

const VALUE_OPTIONS = {
	"--repo-root": (options, value) => {
		options.repoRoot = resolve(value);
	},
	"--workspace": (options, value) => {
		options.workspace = resolve(value);
	},
	"--cases-file": (options, value) => {
		options.casesFile = resolve(value);
	},
	"--output-file": (options, value) => {
		options.outputFile = resolve(value);
	},
	"--artifact-dir": (options, value) => {
		options.artifactDir = resolve(value);
	},
	"--backend": (options, value) => {
		options.backend = value;
	},
	"--fixture-results-file": (options, value) => {
		options.fixtureResultsFile = resolve(value);
	},
	"--sandbox": (options, value) => {
		options.sandbox = value;
	},
	"--model": (options, value) => {
		options.model = value;
	},
	"--reasoning-effort": (options, value) => {
		options.reasoningEffort = value;
	},
	"--codex-model": (options, value) => {
		options.codexModel = value;
	},
	"--codex-reasoning-effort": (options, value) => {
		options.codexReasoningEffort = value;
	},
	"--codex-config": (options, value) => {
		options.codexConfigOverrides.push(value);
	},
	"--claude-model": (options, value) => {
		options.claudeModel = value;
	},
	"--claude-permission-mode": (options, value) => {
		options.claudePermissionMode = value;
	},
	"--claude-allowed-tools": (options, value) => {
		options.claudeAllowedTools = value;
	},
};

function applyArgument(options, argv, index) {
	const arg = argv[index];
	if (arg === "-h" || arg === "--help") {
		usage(0);
		return index;
	}
	if (arg === "--timeout-ms") {
		options.timeoutMs = parsePositiveInteger(readRequiredValue(argv, index + 1, arg), arg);
		return index + 1;
	}
	const applyValue = VALUE_OPTIONS[arg];
	if (!applyValue) {
		fail(`Unknown argument: ${arg}`);
	}
	applyValue(options, readRequiredValue(argv, index + 1, arg));
	return index + 1;
}

function parseArgs(argv) {
	const options = defaultOptions();
	for (let index = 0; index < argv.length; index += 1) {
		index = applyArgument(options, argv, index);
	}
	if (!options.casesFile) {
		fail("--cases-file is required");
	}
	if (!options.outputFile) {
		fail("--output-file is required");
	}
	if (!["codex_exec", "claude_code", "fixture"].includes(options.backend)) {
		fail("--backend must be codex_exec, claude_code, or fixture");
	}
	if (!["read-only", "workspace-write"].includes(options.sandbox)) {
		fail("--sandbox must be read-only or workspace-write");
	}
	if (options.backend === "fixture" && !options.fixtureResultsFile) {
		fail("--fixture-results-file is required when --backend fixture");
	}
	if (!options.artifactDir) {
		options.artifactDir = join(dirname(options.outputFile), "local-skill-test");
	}
	return options;
}

function readJson(path) {
	return JSON.parse(readFileSync(path, "utf-8"));
}

function assertObject(value, field) {
	if (!value || typeof value !== "object" || Array.isArray(value)) {
		throw new Error(`${field} must be an object`);
	}
	return value;
}

function assertString(value, field) {
	if (typeof value !== "string" || !value.trim()) {
		throw new Error(`${field} must be a non-empty string`);
	}
	return value;
}

export function baseSchema(evaluationKind) {
	if (evaluationKind === "trigger") {
		return {
			type: "object",
			additionalProperties: false,
			required: ["invoked", "summary"],
			properties: {
				invoked: { type: "boolean" },
				summary: { type: "string" },
			},
		};
	}
	return {
		type: "object",
		additionalProperties: false,
		required: ["invoked", "summary", "outcome"],
		properties: {
			invoked: { type: "boolean" },
			summary: { type: "string" },
			outcome: { type: "string", enum: ["passed", "failed", "degraded", "blocked"] },
		},
	};
}

export function renderPrompt(skillId, testCase) {
	const lines = [
		`You are being evaluated on whether you can use the local skill "${skillId}" when appropriate.`,
		"Work inside the current repo checkout.",
		`Be honest about whether you actually used the local skill "${skillId}" while solving the request.`,
		"Return only JSON matching the provided schema after you finish.",
		"",
		`Evaluation kind: ${testCase.evaluationKind}`,
	];
	if (testCase.expectedTrigger) {
		lines.push(`Expected trigger: ${testCase.expectedTrigger}`);
	}
	lines.push(
		"",
		"User request:",
		testCase.prompt,
	);
	if (testCase.evaluationKind === "execution") {
		lines.push(
			"",
			"For outcome:",
			'- use "passed" when the task completed cleanly',
			'- use "degraded" when it completed but with visible quality, confidence, or budget issues',
			'- use "blocked" when a missing dependency, permission, or unclear contract stopped you',
			'- use "failed" when the result was materially wrong or unusable',
		);
	}
	return `${lines.join("\n")}\n`;
}

export function artifactRef(kind, path) {
	return { kind, path };
}

export function sampleDir(caseDir, sampleIndex, repeatCount) {
	if (repeatCount <= 1) {
		return caseDir;
	}
	return join(caseDir, `sample-${sampleIndex + 1}`);
}

export function codexArgs(options, schemaFile, outputFile) {
	const args = [
		"exec",
		"-C",
		options.workspace,
		"--sandbox",
		options.sandbox,
		"--ephemeral",
		"--output-schema",
		schemaFile,
		"-o",
		outputFile,
	];
	if (options.codexModel ?? options.model) {
		args.push("--model", options.codexModel ?? options.model);
	}
	if (options.codexReasoningEffort ?? options.reasoningEffort) {
		args.push("-c", `model_reasoning_effort="${options.codexReasoningEffort ?? options.reasoningEffort}"`);
	}
	for (const override of options.codexConfigOverrides ?? []) {
		args.push("-c", override);
	}
	args.push("-");
	return args;
}

export function backendFailureResult(testCase, message, durationMs, artifactRefs) {
	const result = {
		invoked: false,
		summary: message,
		metrics: {
			duration_ms: durationMs,
		},
		artifactRefs,
	};
	if (testCase.evaluationKind === "trigger") {
		result.expectedTrigger = testCase.expectedTrigger;
	}
	if (testCase.evaluationKind === "execution") {
		result.outcome = "blocked";
		result.blockerKind = "runner_execution_failed";
		if (testCase.thresholds) {
			result.thresholds = testCase.thresholds;
		}
	}
	return result;
}

export function normalizeObservedResult(testCase, observed, durationMs, artifactRefs) {
	const invoked = Boolean(observed?.invoked);
	const summary = assertString(observed?.summary, "observed.summary");
	const result = {
		invoked,
		summary,
		metrics: {
			duration_ms: durationMs,
		},
		artifactRefs,
	};
	if (testCase.thresholds) {
		result.thresholds = testCase.thresholds;
	}
	if (testCase.evaluationKind === "trigger") {
		result.expectedTrigger = testCase.expectedTrigger;
		return result;
	}
	const outcome = assertString(observed?.outcome, "observed.outcome");
	if (!["passed", "failed", "degraded", "blocked"].includes(outcome)) {
		throw new Error("observed.outcome must be passed, failed, degraded, or blocked");
	}
	result.outcome = outcome;
	if (typeof observed?.blockerKind === "string" && observed.blockerKind.trim()) {
		result.blockerKind = observed.blockerKind;
	}
	return result;
}

function fixtureResultForSample(testCase, fixtureResults, sampleIndex) {
	const raw = fixtureResults[testCase.caseId];
	if (Array.isArray(raw)) {
		const observed = raw[sampleIndex];
		if (observed === undefined) {
			throw new Error(`fixtureResults.${testCase.caseId}[${sampleIndex}] must exist`);
		}
		return observed;
	}
	if (raw === undefined) {
		throw new Error(`fixtureResults.${testCase.caseId} must exist`);
	}
	return raw;
}

function runFixtureSample(testCase, fixtureResults, artifactDir, sampleIndex) {
	const caseDir = join(artifactDir, testCase.caseId);
	const outputDir = sampleDir(caseDir, sampleIndex, testCase.repeatCount);
	mkdirSync(outputDir, { recursive: true });
	const promptFile = join(outputDir, "prompt.md");
	writeFileSync(promptFile, renderPrompt(testCase.targetId, testCase));
	const observed = assertObject(
		fixtureResultForSample(testCase, fixtureResults, sampleIndex),
		`fixtureResults.${testCase.caseId}`,
	);
	const artifactRefs = [artifactRef("prompt", promptFile)];
	return normalizeObservedResult(testCase, observed, Number(observed.duration_ms ?? 0), artifactRefs);
}

function runCodexSample(options, testCase, artifactDir, sampleIndex) {
	const caseDir = join(artifactDir, testCase.caseId);
	const outputDir = sampleDir(caseDir, sampleIndex, testCase.repeatCount);
	mkdirSync(outputDir, { recursive: true });
	const promptFile = join(outputDir, "prompt.md");
	const schemaFile = join(outputDir, "schema.json");
	const outputFile = join(outputDir, "result.json");
	const stderrFile = join(outputDir, "result.stderr");
	const prompt = renderPrompt(testCase.targetId, testCase);
	writeFileSync(promptFile, prompt);
	writeFileSync(schemaFile, `${JSON.stringify(baseSchema(testCase.evaluationKind), null, 2)}\n`);

	const started = Date.now();
	const result = spawnSync("codex", codexArgs(options, schemaFile, outputFile), {
		cwd: options.workspace,
		encoding: "utf-8",
		env: {
			...process.env,
			PATH: `${join(options.repoRoot, "bin")}:${process.env.PATH ?? ""}`,
		},
		input: prompt,
		timeout: options.timeoutMs,
	});
	const durationMs = Date.now() - started;
	writeFileSync(stderrFile, result.stderr ?? "");
	const artifactRefs = [
		artifactRef("prompt", promptFile),
		artifactRef("schema", schemaFile),
		artifactRef("stderr", stderrFile),
	];
	if (result.error?.code === "ETIMEDOUT") {
		return backendFailureResult(testCase, `The codex_exec runner timed out after ${options.timeoutMs}ms.`, durationMs, artifactRefs);
	}
	if (result.status !== 0) {
		return backendFailureResult(testCase, `The codex_exec runner exited with status ${result.status}.`, durationMs, artifactRefs);
	}
	let observed;
	try {
		observed = readJson(outputFile);
	} catch (error) {
		return backendFailureResult(testCase, `The codex_exec runner did not produce valid JSON: ${error.message}`, durationMs, artifactRefs);
	}
	artifactRefs.push(artifactRef("result", outputFile));
	return normalizeObservedResult(testCase, observed, durationMs, artifactRefs);
}

function numericMetricValues(results, metricKey) {
	return results
		.map((result) => Number(result?.metrics?.[metricKey]))
		.filter((value) => Number.isFinite(value));
}

function median(values) {
	if (values.length === 0) {
		return null;
	}
	const sorted = [...values].sort((left, right) => left - right);
	const mid = Math.floor(sorted.length / 2);
	if (sorted.length % 2 === 1) {
		return sorted[mid];
	}
	return (sorted[mid - 1] + sorted[mid]) / 2;
}

function aggregateMetrics(results) {
	const aggregates = {};
	for (const metricKey of ["duration_ms", "total_tokens", "cost_usd"]) {
		const values = numericMetricValues(results, metricKey);
		if (values.length === 0) {
			continue;
		}
		const value = median(values);
		if (value === null) {
			continue;
		}
		aggregates[metricKey] = metricKey === "cost_usd" ? value : Math.round(value);
	}
	return Object.keys(aggregates).length > 0 ? aggregates : null;
}

function summarizeStatusCounts(statusCounts) {
	return ["passed", "degraded", "blocked", "failed"]
		.filter((status) => Number(statusCounts[status] ?? 0) > 0)
		.map((status) => `${status}=${statusCounts[status]}`)
		.join(", ");
}

function writeAggregateArtifact(caseDir, payload) {
	const aggregateFile = join(caseDir, "aggregate.json");
	writeFileSync(aggregateFile, `${JSON.stringify(payload, null, 2)}\n`);
	return aggregateFile;
}

function aggregateTriggerSamples(testCase, sampleResults, artifactDir) {
	const invokedRuns = sampleResults.filter((result) => result.invoked).length;
	const matchedRuns = sampleResults.filter((result) => (
		testCase.expectedTrigger === "must_invoke" ? result.invoked : !result.invoked
	)).length;
	const consensusReached = matchedRuns >= testCase.minConsensusCount;
	const caseDir = join(artifactDir, testCase.caseId);
	const aggregatePayload = {
		evaluationKind: testCase.evaluationKind,
		repeatCount: testCase.repeatCount,
		minConsensusCount: testCase.minConsensusCount,
		expectedTrigger: testCase.expectedTrigger,
		consensusReached,
		matchedRuns,
		sampleSummaries: sampleResults.map((result, index) => ({
			sampleIndex: index + 1,
			invoked: result.invoked,
			summary: result.summary,
			metrics: result.metrics ?? null,
		})),
	};
	const aggregateFile = writeAggregateArtifact(caseDir, aggregatePayload);
	const artifactRefs = sampleResults.flatMap((result) => result.artifactRefs ?? []);
	artifactRefs.push(artifactRef("aggregate", aggregateFile));
	const aggregateSummary = consensusReached
		? `Trigger consensus matched ${testCase.expectedTrigger} in ${matchedRuns}/${testCase.repeatCount} run(s).`
		: `Trigger consensus failed for ${testCase.expectedTrigger}: only ${matchedRuns}/${testCase.repeatCount} run(s) matched.`;
	return {
		invoked: consensusReached ? testCase.expectedTrigger === "must_invoke" : testCase.expectedTrigger !== "must_invoke",
		summary: testCase.repeatCount > 1 ? aggregateSummary : `${aggregateSummary} ${sampleResults[0]?.summary ?? ""}`.trim(),
		expectedTrigger: testCase.expectedTrigger,
		metrics: aggregateMetrics(sampleResults),
		sampling: {
			sampleCount: testCase.repeatCount,
			consensusCount: matchedRuns,
			matchingCount: matchedRuns,
			invokedCount: invokedRuns,
			stable: consensusReached,
		},
		artifactRefs,
	};
}

function aggregateExecutionSamples(testCase, sampleResults, artifactDir) {
	const invokedRuns = sampleResults.filter((result) => result.invoked).length;
	const statusCounts = { passed: 0, degraded: 0, blocked: 0, failed: 0 };
	for (const result of sampleResults) {
		if (result.outcome) {
			statusCounts[result.outcome] += 1;
		}
	}
	const consensusOutcome = ["passed", "failed", "blocked", "degraded"]
		.find((status) => statusCounts[status] >= testCase.minConsensusCount)
		?? (invokedRuns >= testCase.minConsensusCount ? "degraded" : "blocked");
	const consensusReached = statusCounts[consensusOutcome] >= testCase.minConsensusCount;
	const caseDir = join(artifactDir, testCase.caseId);
	const aggregatePayload = {
		evaluationKind: testCase.evaluationKind,
		repeatCount: testCase.repeatCount,
		minConsensusCount: testCase.minConsensusCount,
		consensusReached,
		invokedRuns,
		statusCounts,
		sampleSummaries: sampleResults.map((result, index) => ({
			sampleIndex: index + 1,
			invoked: result.invoked,
			outcome: result.outcome ?? null,
			summary: result.summary,
			metrics: result.metrics ?? null,
		})),
	};
	const aggregateFile = writeAggregateArtifact(caseDir, aggregatePayload);
	const artifactRefs = sampleResults.flatMap((result) => result.artifactRefs ?? []);
	artifactRefs.push(artifactRef("aggregate", aggregateFile));
	const prefix = consensusReached
		? `Execution consensus reached ${consensusOutcome} in ${statusCounts[consensusOutcome]}/${testCase.repeatCount} run(s).`
		: `Execution results were unstable across ${testCase.repeatCount} run(s): ${summarizeStatusCounts(statusCounts)}.`;
	return {
		invoked: invokedRuns >= testCase.minConsensusCount,
		summary: testCase.repeatCount > 1 ? prefix : `${prefix} ${sampleResults[0]?.summary ?? ""}`.trim(),
		outcome: consensusOutcome,
		metrics: aggregateMetrics(sampleResults),
		thresholds: testCase.thresholds ?? null,
		sampling: {
			sampleCount: testCase.repeatCount,
			consensusCount: statusCounts[consensusOutcome],
			invokedCount: invokedRuns,
			stable: consensusReached,
			statusCounts,
		},
		artifactRefs,
	};
}

function runCaseSamples(options, testCase, fixtureResults) {
	const sampleResults = [];
	for (let sampleIndex = 0; sampleIndex < testCase.repeatCount; sampleIndex += 1) {
		let observed;
		if (options.backend === "fixture") {
			observed = runFixtureSample(testCase, fixtureResults, options.artifactDir, sampleIndex);
		} else if (options.backend === "claude_code") {
			observed = runClaudeSample(options, testCase, options.artifactDir, sampleIndex);
		} else {
			observed = runCodexSample(options, testCase, options.artifactDir, sampleIndex);
		}
		sampleResults.push(observed);
	}
	return testCase.evaluationKind === "trigger"
		? aggregateTriggerSamples(testCase, sampleResults, options.artifactDir)
		: aggregateExecutionSamples(testCase, sampleResults, options.artifactDir);
}

export function buildObservedSkillEvaluationInput(options) {
	const suite = normalizeSkillTestCaseSuite(readJson(options.casesFile));
	const fixtureResults = options.fixtureResultsFile ? readJson(options.fixtureResultsFile) : null;
	const evaluations = suite.cases.map((testCase) => {
		const observed = runCaseSamples(options, testCase, fixtureResults);
		return {
			evaluationId: testCase.caseId,
			targetKind: testCase.targetKind,
			targetId: testCase.targetId,
			displayName: testCase.displayName,
			evaluationKind: testCase.evaluationKind,
			prompt: testCase.prompt,
			startedAt: new Date().toISOString(),
			invoked: observed.invoked,
			summary: observed.summary,
			...(observed.expectedTrigger ? { expectedTrigger: observed.expectedTrigger } : {}),
			...(observed.outcome ? { outcome: observed.outcome } : {}),
			...(observed.blockerKind ? { blockerKind: observed.blockerKind } : {}),
			...(observed.metrics ? { metrics: observed.metrics } : {}),
			...(observed.sampling ? { sampling: observed.sampling } : {}),
			...(observed.thresholds ? { thresholds: observed.thresholds } : {}),
			...(observed.artifactRefs ? { artifactRefs: observed.artifactRefs } : {}),
		};
	});
	return {
		schemaVersion: SKILL_EVALUATION_INPUTS_SCHEMA,
		skillId: suite.skillId,
		skillDisplayName: suite.skillDisplayName,
		evaluations,
	};
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
	const options = parseArgs(process.argv.slice(2));
	mkdirSync(dirname(options.outputFile), { recursive: true });
	mkdirSync(options.artifactDir, { recursive: true });
	const packet = buildObservedSkillEvaluationInput(options);
	writeFileSync(options.outputFile, `${JSON.stringify(packet, null, 2)}\n`);
	process.stdout.write(`${options.outputFile}\n`);
}
