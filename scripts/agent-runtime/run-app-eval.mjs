import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { spawnSync } from "node:child_process";
import process from "node:process";

const CHAT_CASES_SCHEMA = "cautilus.app_chat_test_cases.v1";
const CHAT_OBSERVED_SCHEMA = "cautilus.app_chat_evaluation_inputs.v1";
const PROMPT_CASES_SCHEMA = "cautilus.app_prompt_test_cases.v1";
const PROMPT_OBSERVED_SCHEMA = "cautilus.app_prompt_evaluation_inputs.v1";
const CODEX_SESSION_MODES = ["ephemeral", "persistent"];
const BACKENDS = ["fixture", "codex_exec", "claude_code"];

const CLAUDE_CLI_ENV = {
	CLAUDE_CODE_DISABLE_NONESSENTIAL_TRAFFIC: "1",
	CLAUDE_CODE_DISABLE_AUTO_MEMORY: "1",
	ENABLE_CLAUDEAI_MCP_SERVERS: "false",
	DISABLE_TELEMETRY: "1",
	DISABLE_AUTOUPDATER: "1",
	DISABLE_BUG_COMMAND: "1",
	DISABLE_ERROR_REPORTING: "1",
	CLAUDE_CODE_IDE_SKIP_AUTO_INSTALL: "1",
};

function usage(exitCode = 0) {
	const text = [
		"Usage:",
		"  node scripts/agent-runtime/run-app-eval.mjs --cases-file <file> --output-file <file> --backend fixture|codex_exec|claude_code [--workspace <dir>] [--artifact-dir <dir>] [--timeout-ms <ms>] [--codex-model <model>] [--codex-reasoning-effort <level>] [--codex-session-mode ephemeral|persistent] [--codex-config <key=value>] [--claude-model <model>] [--claude-permission-mode <mode>] [--claude-allowed-tools <rules>]",
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

function parseCodexSessionMode(value) {
	if (!CODEX_SESSION_MODES.includes(value)) {
		fail("--codex-session-mode must be ephemeral or persistent");
	}
	return value;
}

function defaultOptions() {
	return {
		casesFile: null,
		outputFile: null,
		backend: null,
		workspace: process.cwd(),
		artifactDir: null,
		timeoutMs: 120000,
		codexModel: null,
		codexReasoningEffort: null,
		codexSessionMode: "ephemeral",
		codexConfigOverrides: [],
		claudeModel: null,
		claudePermissionMode: null,
		claudeAllowedTools: null,
	};
}

const VALUE_OPTIONS = {
	"--cases-file": (options, value) => { options.casesFile = resolve(value); },
	"--output-file": (options, value) => { options.outputFile = resolve(value); },
	"--backend": (options, value) => { options.backend = value; },
	"--workspace": (options, value) => { options.workspace = resolve(value); },
	"--artifact-dir": (options, value) => { options.artifactDir = resolve(value); },
	"--codex-model": (options, value) => { options.codexModel = value; },
	"--codex-reasoning-effort": (options, value) => { options.codexReasoningEffort = value; },
	"--codex-session-mode": (options, value) => { options.codexSessionMode = parseCodexSessionMode(value); },
	"--codex-config": (options, value) => { options.codexConfigOverrides.push(value); },
	"--claude-model": (options, value) => { options.claudeModel = value; },
	"--claude-permission-mode": (options, value) => { options.claudePermissionMode = value; },
	"--claude-allowed-tools": (options, value) => { options.claudeAllowedTools = value; },
};

function applyArgument(options, argv, index) {
	const arg = argv[index];
	if (arg === "-h" || arg === "--help") {
		usage(0);
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
	if (!BACKENDS.includes(options.backend)) {
		fail("--backend must be fixture, codex_exec, or claude_code");
	}
	if (!options.artifactDir) {
		options.artifactDir = join(dirname(options.outputFile), "app-eval");
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

function expectedFinalText(testCase) {
	const expected = assertObject(testCase.expected, "case.expected");
	return assertString(expected.finalText, "case.expected.finalText");
}

function fixtureAssistantText(testCase) {
	return `Fixture response includes ${expectedFinalText(testCase)}.`;
}

function baseEvaluation(testCase, cases, runtime) {
	return {
		caseId: assertString(testCase.caseId, "case.caseId"),
		displayName: testCase.displayName || testCase.caseId,
		provider: runtime.provider,
		model: runtime.model,
		harness: runtime.harness,
		mode: "messaging",
		durationMs: runtime.durationMs,
		expected: testCase.expected,
	};
}

function fixtureRuntime(testCase, cases) {
	return {
		provider: assertString(testCase.provider || cases.provider, "case.provider"),
		model: assertString(testCase.model || cases.model, "case.model"),
		harness: "fixture-backend",
		durationMs: 1,
	};
}

function codexRuntime(options, durationMs) {
	return {
		provider: "openai",
		model: options.codexModel || "codex-default",
		harness: "codex_exec",
		durationMs,
	};
}

function claudeRuntime(options, durationMs) {
	return {
		provider: "anthropic",
		model: options.claudeModel || "claude-default",
		harness: "claude_code",
		durationMs,
	};
}

function chatEvaluation(testCase, cases, runtime, finalText) {
	const messages = Array.isArray(testCase.messages) ? testCase.messages : [];
	return {
		...baseEvaluation(testCase, cases, runtime),
		observed: {
			messages: [
				...messages,
				{ role: "assistant", content: finalText },
			],
			finalText,
		},
	};
}

function promptEvaluation(testCase, cases, runtime, finalText) {
	const input = assertString(testCase.input, "case.input");
	return {
		...baseEvaluation(testCase, cases, runtime),
		observed: {
			input,
			messages: [
				{ role: "user", content: input },
				{ role: "assistant", content: finalText },
			],
			finalText,
		},
	};
}

function codexArgs(options, schemaFile, resultFile) {
	const args = [
		"exec",
		"-C",
		options.workspace,
		"--sandbox",
		"read-only",
	];
	if (options.codexSessionMode === "ephemeral") {
		args.push("--ephemeral");
	}
	args.push("--output-schema", schemaFile, "-o", resultFile);
	if (options.codexModel) {
		args.push("--model", options.codexModel);
	}
	if (options.codexReasoningEffort) {
		args.push("-c", `model_reasoning_effort="${options.codexReasoningEffort}"`);
	}
	for (const override of options.codexConfigOverrides) {
		args.push("-c", override);
	}
	args.push("-");
	return args;
}

function claudeArgs(options) {
	const args = [
		"-p",
		"--no-session-persistence",
		"--output-format", "json",
		"--exclude-dynamic-system-prompt-sections",
	];
	if (options.claudeModel) {
		args.push("--model", options.claudeModel);
	}
	if (options.claudePermissionMode) {
		args.push("--permission-mode", options.claudePermissionMode);
	}
	if (options.claudeAllowedTools) {
		args.push("--allowedTools", options.claudeAllowedTools);
	}
	return args;
}

function outputSchema() {
	return {
		type: "object",
		additionalProperties: false,
		required: ["finalText"],
		properties: {
			finalText: { type: "string" },
		},
	};
}

function renderClaudePrompt(cases, testCase) {
	return [
		renderPrompt(cases, testCase),
		"",
		"You MUST respond with ONLY a JSON object matching this schema, with no markdown fences or commentary:",
		"",
		JSON.stringify(outputSchema(), null, 2),
		"",
	].join("\n");
}

function extractJSON(text) {
	const fenced = text.match(/```(?:json)?\s*\n([\s\S]*?)\n\s*```/);
	if (fenced) {
		return JSON.parse(fenced[1]);
	}
	const braceMatch = text.match(/\{[\s\S]*\}/);
	if (braceMatch) {
		return JSON.parse(braceMatch[0]);
	}
	return JSON.parse(text);
}

function parseClaudeOutput(raw) {
	try {
		const parsed = JSON.parse(raw);
		if (parsed.result !== undefined) {
			return extractJSON(typeof parsed.result === "string" ? parsed.result : JSON.stringify(parsed.result));
		}
		return parsed;
	} catch {
		return extractJSON(raw);
	}
}

function renderPrompt(cases, testCase) {
	if (cases.schemaVersion === PROMPT_CASES_SCHEMA) {
		return [
			"You are running an app/prompt behavior fixture.",
			cases.system ? `System prompt:\n${cases.system}` : "System prompt: none",
			`User input:\n${assertString(testCase.input, "case.input")}`,
			"Return only JSON matching the provided schema.",
		].join("\n\n");
	}
	const messages = Array.isArray(testCase.messages) ? testCase.messages : [];
	return [
		"You are running an app/chat behavior fixture.",
		cases.system ? `System prompt:\n${cases.system}` : "System prompt: none",
		"Conversation so far:",
		messages.map((message) => `${message.role}: ${message.content}`).join("\n"),
		"Return only JSON matching the provided schema.",
	].join("\n\n");
}

function runCodexCase(options, cases, testCase, index) {
	const caseID = assertString(testCase.caseId, `cases[${index}].caseId`);
	const caseDir = join(options.artifactDir, caseID);
	mkdirSync(caseDir, { recursive: true });
	const schemaFile = join(caseDir, "schema.json");
	const resultFile = join(caseDir, "result.json");
	const stdoutFile = join(caseDir, "stdout.jsonl");
	const stderrFile = join(caseDir, "stderr.txt");
	const prompt = renderPrompt(cases, testCase);
	writeFileSync(schemaFile, `${JSON.stringify(outputSchema(), null, 2)}\n`, "utf-8");
	const started = Date.now();
	const completed = spawnSync("codex", codexArgs(options, schemaFile, resultFile), {
		input: prompt,
		encoding: "utf-8",
		timeout: options.timeoutMs,
		maxBuffer: 20 * 1024 * 1024,
	});
	const durationMs = Date.now() - started;
	writeFileSync(stdoutFile, completed.stdout || "", "utf-8");
	writeFileSync(stderrFile, completed.stderr || "", "utf-8");
	if (completed.error) {
		throw completed.error;
	}
	if (completed.status !== 0) {
		throw new Error(`codex exec failed for ${caseID} with exit ${completed.status}: ${completed.stderr || completed.stdout}`);
	}
	const result = readJson(resultFile);
	return {
		finalText: assertString(result.finalText, `codex result for ${caseID}.finalText`),
		runtime: codexRuntime(options, durationMs),
	};
}

function runClaudeCase(options, cases, testCase, index) {
	const caseID = assertString(testCase.caseId, `cases[${index}].caseId`);
	const caseDir = join(options.artifactDir, caseID);
	mkdirSync(caseDir, { recursive: true });
	const promptFile = join(caseDir, "prompt.md");
	const resultFile = join(caseDir, "result.json");
	const rawFile = join(caseDir, "result.raw");
	const stderrFile = join(caseDir, "stderr.txt");
	const prompt = renderClaudePrompt(cases, testCase);
	writeFileSync(promptFile, prompt, "utf-8");
	const started = Date.now();
	const completed = spawnSync("claude", claudeArgs(options), {
		cwd: options.workspace,
		encoding: "utf-8",
		env: {
			...process.env,
			...CLAUDE_CLI_ENV,
		},
		input: prompt,
		timeout: options.timeoutMs,
		maxBuffer: 20 * 1024 * 1024,
	});
	const durationMs = Date.now() - started;
	writeFileSync(rawFile, completed.stdout || "", "utf-8");
	writeFileSync(stderrFile, completed.stderr || "", "utf-8");
	if (completed.error) {
		throw completed.error;
	}
	if (completed.status !== 0) {
		throw new Error(`claude_code failed for ${caseID} with exit ${completed.status}: ${completed.stderr || completed.stdout}`);
	}
	const result = parseClaudeOutput(completed.stdout ?? "");
	writeFileSync(resultFile, `${JSON.stringify(result, null, 2)}\n`, "utf-8");
	return {
		finalText: assertString(result.finalText, `claude result for ${caseID}.finalText`),
		runtime: claudeRuntime(options, durationMs),
	};
}

function backendResult(options, cases, entry, index) {
	if (options.backend === "codex_exec") {
		return runCodexCase(options, cases, entry, index);
	}
	if (options.backend === "claude_code") {
		return runClaudeCase(options, cases, entry, index);
	}
	return { finalText: fixtureAssistantText(entry), runtime: fixtureRuntime(entry, cases) };
}

export function buildObservedAppInput(cases, options = { backend: "fixture" }) {
	const schemaVersion = cases.schemaVersion;
	const evaluations = Array.isArray(cases.cases) ? cases.cases : [];
	if (schemaVersion !== CHAT_CASES_SCHEMA && schemaVersion !== PROMPT_CASES_SCHEMA) {
		throw new Error(`unsupported cases schemaVersion: ${schemaVersion}`);
	}
	const observedEvaluations = evaluations.map((entry, index) => {
		const result = backendResult(options, cases, entry, index);
		return schemaVersion === CHAT_CASES_SCHEMA
			? chatEvaluation(entry, cases, result.runtime, result.finalText)
			: promptEvaluation(entry, cases, result.runtime, result.finalText);
	});
	return {
		schemaVersion: schemaVersion === CHAT_CASES_SCHEMA ? CHAT_OBSERVED_SCHEMA : PROMPT_OBSERVED_SCHEMA,
		suiteId: cases.suiteId,
		suiteDisplayName: cases.suiteDisplayName || cases.suiteId,
		evaluations: observedEvaluations,
	};
}

export function main(argv = process.argv.slice(2)) {
	const options = parseArgs(argv);
	mkdirSync(dirname(options.outputFile), { recursive: true });
	mkdirSync(options.artifactDir, { recursive: true });
	const packet = buildObservedAppInput(readJson(options.casesFile), options);
	writeFileSync(options.outputFile, `${JSON.stringify(packet, null, 2)}\n`, "utf-8");
}

if (import.meta.url === `file://${process.argv[1]}`) {
	main();
}
