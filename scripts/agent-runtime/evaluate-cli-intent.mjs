import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { spawnSync } from "node:child_process";
import process from "node:process";
import { pathToFileURL } from "node:url";

import { REPORT_INPUTS_SCHEMA, buildReportPacket } from "./build-report-packet.mjs";

export const CLI_EVALUATION_INPUTS_SCHEMA = "cautilus.cli_evaluation_inputs.v1";
export const CLI_EVALUATION_PACKET_SCHEMA = "cautilus.cli_evaluation_packet.v1";

const MODE_VALUES = new Set(["iterate", "held_out", "comparison", "full_gate"]);

function usage(exitCode = 0) {
	const text = [
		"Usage:",
		"  node ./scripts/agent-runtime/evaluate-cli-intent.mjs --input <file> [--output <file>]",
		"",
		"Input packet:",
		`  schemaVersion: ${CLI_EVALUATION_INPUTS_SCHEMA}`,
		"  candidate: <string>",
		"  baseline: <string>",
		"  intent: <string>",
		"  surfaceId: <string>",
		"  mode: held_out | full_gate | iterate | comparison",
		"  command: [\"node\", \"./bin/cautilus\", \"--help\"]",
	].join("\n");
	const out = exitCode === 0 ? process.stdout : process.stderr;
	out.write(`${text}\n`);
	process.exit(exitCode);
}

function readOptionValue(argv, index, option) {
	const value = argv[index + 1] || "";
	if (!value) {
		throw new Error(`${option} requires a value`);
	}
	return value;
}

function parseArgs(argv) {
	let inputPath = "";
	let outputPath = "";
	for (let index = 0; index < argv.length; index += 1) {
		const arg = argv[index];
		if (arg === "-h" || arg === "--help") {
			usage(0);
		}
		if (arg === "--input") {
			inputPath = readOptionValue(argv, index, arg);
			index += 1;
			continue;
		}
		if (arg === "--output") {
			outputPath = readOptionValue(argv, index, arg);
			index += 1;
			continue;
		}
		throw new Error(`Unknown argument: ${arg}`);
	}
	if (!inputPath) {
		throw new Error("--input is required");
	}
	return { inputPath, outputPath };
}

function parseJsonFile(path) {
	try {
		return JSON.parse(readFileSync(path, "utf-8"));
	} catch (error) {
		throw new Error(`Failed to read JSON from ${path}: ${error.message}`);
	}
}

function normalizeNonEmptyString(value, field) {
	if (typeof value !== "string" || !value.trim()) {
		throw new Error(`${field} must be a non-empty string`);
	}
	return value;
}

function normalizeMode(value, field) {
	const mode = normalizeNonEmptyString(value, field);
	if (!MODE_VALUES.has(mode)) {
		throw new Error(`${field} must be one of ${[...MODE_VALUES].join(", ")}`);
	}
	return mode;
}

function normalizeCommand(command) {
	if (!Array.isArray(command) || command.length === 0) {
		throw new Error("command must be a non-empty array");
	}
	return command.map((part, index) => normalizeNonEmptyString(part, `command[${index}]`));
}

function normalizeEnvironment(environment) {
	if (environment === undefined) {
		return {};
	}
	if (!environment || typeof environment !== "object" || Array.isArray(environment)) {
		throw new Error("environment must be an object");
	}
	return Object.fromEntries(
		Object.entries(environment).map(([key, value]) => [
			normalizeNonEmptyString(key, "environment key"),
			normalizeNonEmptyString(value, `environment.${key}`),
		]),
	);
}

function normalizeExpectationStrings(value, field) {
	if (value === undefined) {
		return [];
	}
	if (!Array.isArray(value)) {
		throw new Error(`${field} must be an array`);
	}
	return value.map((entry, index) => normalizeNonEmptyString(entry, `${field}[${index}]`));
}

function normalizeFileContains(value) {
	if (value === undefined) {
		return [];
	}
	if (!Array.isArray(value)) {
		throw new Error("expectations.filesContain must be an array");
	}
	return value.map((entry, index) => {
		if (!entry || typeof entry !== "object" || Array.isArray(entry)) {
			throw new Error(`expectations.filesContain[${index}] must be an object`);
		}
		return {
			path: normalizeNonEmptyString(entry.path, `expectations.filesContain[${index}].path`),
			text: normalizeNonEmptyString(entry.text, `expectations.filesContain[${index}].text`),
		};
	});
}

function normalizeExpectations(expectations) {
	if (!expectations || typeof expectations !== "object" || Array.isArray(expectations)) {
		throw new Error("expectations must be an object");
	}
	const normalized = {
		stdoutContains: normalizeExpectationStrings(expectations.stdoutContains, "expectations.stdoutContains"),
		stderrContains: normalizeExpectationStrings(expectations.stderrContains, "expectations.stderrContains"),
		stdoutNotContains: normalizeExpectationStrings(
			expectations.stdoutNotContains,
			"expectations.stdoutNotContains",
		),
		stderrNotContains: normalizeExpectationStrings(
			expectations.stderrNotContains,
			"expectations.stderrNotContains",
		),
		filesExist: normalizeExpectationStrings(expectations.filesExist, "expectations.filesExist"),
		filesContain: normalizeFileContains(expectations.filesContain),
	};
	if (expectations.exitCode !== undefined) {
		if (!Number.isInteger(expectations.exitCode)) {
			throw new Error("expectations.exitCode must be an integer");
		}
		normalized.exitCode = expectations.exitCode;
	}
	const expectationCount =
		normalized.stdoutContains.length +
		normalized.stderrContains.length +
		normalized.stdoutNotContains.length +
		normalized.stderrNotContains.length +
		normalized.filesExist.length +
		normalized.filesContain.length +
		(normalized.exitCode !== undefined ? 1 : 0);
	if (expectationCount === 0) {
		throw new Error("expectations must declare at least one bounded check");
	}
	return normalized;
}

function normalizeInput(input) {
	if (!input || typeof input !== "object" || Array.isArray(input)) {
		throw new Error("input must be an object");
	}
	if (input.schemaVersion !== CLI_EVALUATION_INPUTS_SCHEMA) {
		throw new Error(`schemaVersion must be ${CLI_EVALUATION_INPUTS_SCHEMA}`);
	}
	const timeoutMs = input.timeoutMs === undefined ? 30000 : input.timeoutMs;
	if (!Number.isInteger(timeoutMs) || timeoutMs <= 0) {
		throw new Error("timeoutMs must be a positive integer");
	}
	return {
		candidate: normalizeNonEmptyString(input.candidate, "candidate"),
		baseline: normalizeNonEmptyString(input.baseline, "baseline"),
		intent: normalizeNonEmptyString(input.intent, "intent"),
		surfaceId: normalizeNonEmptyString(input.surfaceId, "surfaceId"),
		mode: normalizeMode(input.mode, "mode"),
		command: normalizeCommand(input.command),
		workingDirectory: input.workingDirectory ? normalizeNonEmptyString(input.workingDirectory, "workingDirectory") : ".",
		environment: normalizeEnvironment(input.environment),
		stdinText: input.stdinText === undefined ? "" : String(input.stdinText),
		timeoutMs,
		expectations: normalizeExpectations(input.expectations),
	};
}

function resolveWorkingDirectory(workingDirectory, baseDir) {
	return resolve(baseDir, workingDirectory);
}

function resolveExpectationPath(path, workingDirectory) {
	return resolve(workingDirectory, path);
}

function runProcess(input, workingDirectory) {
	const startedAt = new Date();
	const startedAtMs = Date.now();
	const result = spawnSync(input.command[0], input.command.slice(1), {
		cwd: workingDirectory,
		encoding: "utf-8",
		input: input.stdinText,
		timeout: input.timeoutMs,
		env: {
			...process.env,
			...input.environment,
		},
	});
	const completedAt = new Date();
	return {
		startedAt: startedAt.toISOString(),
		completedAt: completedAt.toISOString(),
		durationMs: completedAt.getTime() - startedAtMs,
		exitCode: typeof result.status === "number" ? result.status : null,
		signal: result.signal || null,
		stdout: result.stdout || "",
		stderr: result.stderr || "",
		error: result.error ? String(result.error.message || result.error) : null,
	};
}

function createExpectationResult(id, status, message) {
	return { id, status, message };
}

function evaluateExitCode(expectations, observation, results) {
	if (expectations.exitCode === undefined) {
		return;
	}
	const passed = observation.exitCode === expectations.exitCode;
	results.push(
		createExpectationResult(
			"exit-code",
			passed ? "passed" : "failed",
			passed
				? `Exit code matched ${expectations.exitCode}.`
				: `Expected exit code ${expectations.exitCode}, saw ${observation.exitCode}.`,
		),
	);
}

function evaluateContainsChecks(idPrefix, haystack, needles, positive, results) {
	for (const [index, needle] of needles.entries()) {
		const passed = haystack.includes(needle);
		const finalPassed = positive ? passed : !passed;
		const verb = positive ? "contain" : "avoid";
		results.push(
			createExpectationResult(
				`${idPrefix}-${index + 1}`,
				finalPassed ? "passed" : "failed",
				finalPassed ? `Output did ${verb} "${needle}".` : `Output did not ${verb} "${needle}".`,
			),
		);
	}
}

function evaluateFileExists(expectations, workingDirectory, results) {
	for (const [index, relativePath] of expectations.filesExist.entries()) {
		const exists = existsSync(resolveExpectationPath(relativePath, workingDirectory));
		results.push(
			createExpectationResult(
				`file-exists-${index + 1}`,
				exists ? "passed" : "failed",
				exists ? `Observed expected file ${relativePath}.` : `Missing expected file ${relativePath}.`,
			),
		);
	}
}

function evaluateFileContains(expectations, workingDirectory, results) {
	for (const [index, entry] of expectations.filesContain.entries()) {
		const resolvedPath = resolveExpectationPath(entry.path, workingDirectory);
		const exists = existsSync(resolvedPath);
		const passed = exists && readFileSync(resolvedPath, "utf-8").includes(entry.text);
		results.push(
			createExpectationResult(
				`file-contains-${index + 1}`,
				passed ? "passed" : "failed",
				passed
					? `Observed expected text in ${entry.path}.`
					: `Did not observe expected text in ${entry.path}.`,
			),
		);
	}
}

function buildExpectationResults(expectations, observation, workingDirectory) {
	const results = [];
	evaluateExitCode(expectations, observation, results);
	evaluateContainsChecks("stdout-contains", observation.stdout, expectations.stdoutContains, true, results);
	evaluateContainsChecks("stderr-contains", observation.stderr, expectations.stderrContains, true, results);
	evaluateContainsChecks("stdout-not-contains", observation.stdout, expectations.stdoutNotContains, false, results);
	evaluateContainsChecks("stderr-not-contains", observation.stderr, expectations.stderrNotContains, false, results);
	evaluateFileExists(expectations, workingDirectory, results);
	evaluateFileContains(expectations, workingDirectory, results);
	return results;
}

function summarizeRecommendation(expectationResults) {
	return expectationResults.every((entry) => entry.status === "passed") ? "accept-now" : "reject";
}

function commandText(command) {
	return command.join(" ");
}

function buildCliReport(input, observation, expectationResults, now) {
	const recommendation = summarizeRecommendation(expectationResults);
	const passed = recommendation === "accept-now";
	return buildReportPacket(
		{
			schemaVersion: REPORT_INPUTS_SCHEMA,
			candidate: input.candidate,
			baseline: input.baseline,
			intent: input.intent,
			commands: [
				{
					mode: input.mode,
					command: commandText(input.command),
					label: "cli evaluation command",
				},
			],
			modeRuns: [
				{
					mode: input.mode,
					status: passed ? "passed" : "failed",
					summary: passed ? "CLI intent expectations passed." : "CLI intent expectations failed.",
					startedAt: observation.startedAt,
					completedAt: observation.completedAt,
					durationMs: observation.durationMs,
					candidateResults: [
						{
							scenarioId: input.surfaceId,
							status: passed ? "passed" : "failed",
							timestamp: observation.completedAt,
							startedAt: observation.startedAt,
							completedAt: observation.completedAt,
							durationMs: observation.durationMs,
						},
					],
				},
			],
			improved: passed ? [input.surfaceId] : [],
			regressed: passed ? [] : [input.surfaceId],
			unchanged: [],
			noisy: [],
			humanReviewFindings: [],
			recommendation,
		},
		{ now },
	);
}

export function evaluateCliIntent(input, { now = new Date(), baseDir = process.cwd() } = {}) {
	const normalized = normalizeInput(input);
	const workingDirectory = resolveWorkingDirectory(normalized.workingDirectory, baseDir);
	const observation = runProcess(normalized, workingDirectory);
	const expectationResults = buildExpectationResults(normalized.expectations, observation, workingDirectory);
	const recommendation = summarizeRecommendation(expectationResults);
	return {
		schemaVersion: CLI_EVALUATION_PACKET_SCHEMA,
		generatedAt: now.toISOString(),
		candidate: normalized.candidate,
		baseline: normalized.baseline,
		intent: normalized.intent,
		surfaceId: normalized.surfaceId,
		mode: normalized.mode,
		workingDirectory,
		command: normalized.command,
		observation,
		expectationResults,
		summary: {
			passedExpectationCount: expectationResults.filter((entry) => entry.status === "passed").length,
			failedExpectationCount: expectationResults.filter((entry) => entry.status !== "passed").length,
			recommendation,
		},
		report: buildCliReport(normalized, observation, expectationResults, now),
	};
}

export function main(argv = process.argv.slice(2)) {
	try {
		const { inputPath, outputPath } = parseArgs(argv);
		const resolvedInputPath = resolve(inputPath);
		const packet = evaluateCliIntent(parseJsonFile(resolvedInputPath), {
			baseDir: resolve(resolvedInputPath, ".."),
		});
		const text = `${JSON.stringify(packet, null, 2)}\n`;
		if (outputPath) {
			writeFileSync(outputPath, text, "utf-8");
			return;
		}
		process.stdout.write(text);
	} catch (error) {
		process.stderr.write(`${error.message}\n`);
		process.exit(1);
	}
}

const entryHref = process.argv[1] ? pathToFileURL(resolve(process.argv[1])).href : "";
if (import.meta.url === entryHref) {
	main();
}
