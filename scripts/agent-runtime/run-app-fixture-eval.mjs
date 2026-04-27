import { readFileSync, writeFileSync } from "node:fs";
import process from "node:process";

const CHAT_CASES_SCHEMA = "cautilus.app_chat_test_cases.v1";
const CHAT_OBSERVED_SCHEMA = "cautilus.app_chat_evaluation_inputs.v1";
const PROMPT_CASES_SCHEMA = "cautilus.app_prompt_test_cases.v1";
const PROMPT_OBSERVED_SCHEMA = "cautilus.app_prompt_evaluation_inputs.v1";

function usage(exitCode = 0) {
	const text = [
		"Usage:",
		"  node scripts/agent-runtime/run-app-fixture-eval.mjs --cases-file <file> --output-file <file> --backend fixture",
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

function parseArgs(argv) {
	const options = {
		casesFile: null,
		outputFile: null,
		backend: null,
	};
	for (let index = 0; index < argv.length; index += 1) {
		const arg = argv[index];
		if (arg === "-h" || arg === "--help") {
			usage(0);
		}
		if (arg === "--cases-file") {
			options.casesFile = readRequiredValue(argv, index + 1, arg);
			index += 1;
			continue;
		}
		if (arg === "--output-file") {
			options.outputFile = readRequiredValue(argv, index + 1, arg);
			index += 1;
			continue;
		}
		if (arg === "--backend") {
			options.backend = readRequiredValue(argv, index + 1, arg);
			index += 1;
			continue;
		}
		fail(`Unknown argument: ${arg}`);
	}
	if (!options.casesFile) {
		fail("--cases-file is required");
	}
	if (!options.outputFile) {
		fail("--output-file is required");
	}
	if (options.backend !== "fixture") {
		fail("--backend must be fixture for this runner");
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

function assistantText(testCase) {
	return `Fixture response includes ${expectedFinalText(testCase)}.`;
}

function baseEvaluation(testCase, cases) {
	return {
		caseId: assertString(testCase.caseId, "case.caseId"),
		displayName: testCase.displayName || testCase.caseId,
		provider: assertString(testCase.provider || cases.provider, "case.provider"),
		model: assertString(testCase.model || cases.model, "case.model"),
		harness: "fixture-backend",
		mode: "messaging",
		durationMs: 1,
		expected: testCase.expected,
	};
}

function chatEvaluation(testCase, cases) {
	const messages = Array.isArray(testCase.messages) ? testCase.messages : [];
	const finalText = assistantText(testCase);
	return {
		...baseEvaluation(testCase, cases),
		observed: {
			messages: [
				...messages,
				{ role: "assistant", content: finalText },
			],
			finalText,
		},
	};
}

function promptEvaluation(testCase, cases) {
	const input = assertString(testCase.input, "case.input");
	const finalText = assistantText(testCase);
	return {
		...baseEvaluation(testCase, cases),
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

export function buildObservedAppFixtureInput(cases) {
	const schemaVersion = cases.schemaVersion;
	const evaluations = Array.isArray(cases.cases) ? cases.cases : [];
	if (schemaVersion === CHAT_CASES_SCHEMA) {
		return {
			schemaVersion: CHAT_OBSERVED_SCHEMA,
			suiteId: cases.suiteId,
			suiteDisplayName: cases.suiteDisplayName || cases.suiteId,
			evaluations: evaluations.map((entry) => chatEvaluation(entry, cases)),
		};
	}
	if (schemaVersion === PROMPT_CASES_SCHEMA) {
		return {
			schemaVersion: PROMPT_OBSERVED_SCHEMA,
			suiteId: cases.suiteId,
			suiteDisplayName: cases.suiteDisplayName || cases.suiteId,
			evaluations: evaluations.map((entry) => promptEvaluation(entry, cases)),
		};
	}
	throw new Error(`unsupported cases schemaVersion: ${schemaVersion}`);
}

export function main(argv = process.argv.slice(2)) {
	const options = parseArgs(argv);
	const packet = buildObservedAppFixtureInput(readJson(options.casesFile));
	writeFileSync(options.outputFile, `${JSON.stringify(packet, null, 2)}\n`, "utf-8");
}

if (import.meta.url === `file://${process.argv[1]}`) {
	main();
}
