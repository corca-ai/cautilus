import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { spawnSync } from "node:child_process";
import process from "node:process";
import { pathToFileURL } from "node:url";

import {
	SKILL_EVALUATION_INPUTS_SCHEMA,
	SKILL_TEST_CASES_SCHEMA,
} from "./contract-versions.mjs";

function usage(exitCode = 0) {
	const text = [
		"Usage:",
		"  node ./scripts/agent-runtime/run-local-skill-test.mjs --repo-root <dir> --workspace <dir> --cases-file <file> --output-file <file> [--artifact-dir <dir>] [--backend codex_exec|fixture] [--fixture-results-file <file>] [--sandbox read-only|workspace-write] [--timeout-ms <ms>] [--model <model>] [--reasoning-effort <level>]",
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
	if (!["codex_exec", "fixture"].includes(options.backend)) {
		fail("--backend must be codex_exec or fixture");
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

function optionalString(value, field) {
	if (value === undefined || value === null) {
		return null;
	}
	if (typeof value !== "string") {
		throw new Error(`${field} must be a string`);
	}
	if (!value.trim()) {
		throw new Error(`${field} must be a non-empty string`);
	}
	return value;
}

function nonNegativeMetricObject(value, field) {
	if (value === undefined || value === null) {
		return null;
	}
	const record = assertObject(value, field);
	const normalized = {};
	for (const key of ["max_total_tokens", "max_duration_ms", "max_cost_usd"]) {
		if (!(key in record)) {
			continue;
		}
		const number = Number(record[key]);
		if (!Number.isFinite(number) || number < 0) {
			throw new Error(`${field}.${key} must be a non-negative number`);
		}
		normalized[key] = key === "max_cost_usd" ? number : Math.trunc(number);
	}
	return Object.keys(normalized).length > 0 ? normalized : null;
}

export function normalizeSkillTestCaseSuite(input) {
	if (input?.schemaVersion !== SKILL_TEST_CASES_SCHEMA) {
		throw new Error(`schemaVersion must be ${SKILL_TEST_CASES_SCHEMA}`);
	}
	const skillId = assertString(input.skillId, "skillId");
	const skillDisplayName = optionalString(input.skillDisplayName, "skillDisplayName") ?? skillId;
	if (!Array.isArray(input.cases) || input.cases.length === 0) {
		throw new Error("cases must be a non-empty array");
	}
	const cases = input.cases.map((entry, index) => {
		const record = assertObject(entry, `cases[${index}]`);
		const evaluationKind = assertString(record.evaluationKind, `cases[${index}].evaluationKind`);
		if (!["trigger", "execution"].includes(evaluationKind)) {
			throw new Error(`cases[${index}].evaluationKind must be trigger or execution`);
		}
		const targetKind = optionalString(record.targetKind, `cases[${index}].targetKind`) ?? "public_skill";
		if (!["public_skill", "profile", "integration"].includes(targetKind)) {
			throw new Error(`cases[${index}].targetKind must be public_skill, profile, or integration`);
		}
		const expectedTrigger = optionalString(record.expectedTrigger, `cases[${index}].expectedTrigger`);
		if (evaluationKind === "trigger" && !["must_invoke", "must_not_invoke"].includes(expectedTrigger ?? "")) {
			throw new Error("trigger cases must set expectedTrigger to must_invoke or must_not_invoke");
		}
		if (evaluationKind === "execution" && expectedTrigger) {
			throw new Error("execution cases must not set expectedTrigger");
		}
		return {
			caseId: assertString(record.caseId, `cases[${index}].caseId`),
			targetKind,
			targetId: optionalString(record.targetId, `cases[${index}].targetId`) ?? skillId,
			displayName: optionalString(record.displayName, `cases[${index}].displayName`) ?? skillDisplayName,
			evaluationKind,
			prompt: assertString(record.prompt, `cases[${index}].prompt`),
			expectedTrigger,
			thresholds: nonNegativeMetricObject(record.thresholds, `cases[${index}].thresholds`),
		};
	});
	return { skillId, skillDisplayName, cases };
}

function baseSchema(evaluationKind) {
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

function renderPrompt(skillId, testCase) {
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

function artifactRef(kind, path) {
	return { kind, path };
}

function codexArgs(options, schemaFile, outputFile) {
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
	if (options.model) {
		args.push("--model", options.model);
	}
	if (options.reasoningEffort) {
		args.push("-c", `model_reasoning_effort="${options.reasoningEffort}"`);
	}
	args.push("-");
	return args;
}

function backendFailureResult(testCase, message, durationMs, artifactRefs) {
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

function normalizeObservedResult(testCase, observed, durationMs, artifactRefs) {
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

function runFixtureCase(testCase, fixtureResults, artifactDir) {
	const caseDir = join(artifactDir, testCase.caseId);
	mkdirSync(caseDir, { recursive: true });
	const promptFile = join(caseDir, "prompt.md");
	writeFileSync(promptFile, renderPrompt(testCase.targetId, testCase));
	const observed = assertObject(fixtureResults[testCase.caseId], `fixtureResults.${testCase.caseId}`);
	const artifactRefs = [artifactRef("prompt", promptFile)];
	return normalizeObservedResult(testCase, observed, Number(observed.duration_ms ?? 0), artifactRefs);
}

function runCodexCase(options, testCase, artifactDir) {
	const caseDir = join(artifactDir, testCase.caseId);
	mkdirSync(caseDir, { recursive: true });
	const promptFile = join(caseDir, "prompt.md");
	const schemaFile = join(caseDir, "schema.json");
	const outputFile = join(caseDir, "result.json");
	const stderrFile = join(caseDir, "result.stderr");
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

export function buildObservedSkillEvaluationInput(options) {
	const suite = normalizeSkillTestCaseSuite(readJson(options.casesFile));
	const fixtureResults = options.fixtureResultsFile ? readJson(options.fixtureResultsFile) : null;
	const evaluations = suite.cases.map((testCase) => {
		const observed = options.backend === "fixture"
			? runFixtureCase(testCase, fixtureResults, options.artifactDir)
			: runCodexCase(options, testCase, options.artifactDir);
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
