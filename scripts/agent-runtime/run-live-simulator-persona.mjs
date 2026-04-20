import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { spawnSync } from "node:child_process";
import process from "node:process";
import { pathToFileURL } from "node:url";

const LIVE_RUN_SIMULATOR_REQUEST_SCHEMA = "cautilus.live_run_simulator_request.v1";
const LIVE_RUN_SIMULATOR_RESULT_SCHEMA = "cautilus.live_run_simulator_result.v1";
const EXECUTION_STATUSES = new Set(["completed", "blocked", "failed"]);
const ACTIONS = new Set(["continue", "stop"]);

function fail(message) {
	process.stderr.write(`${message}\n`);
	process.exit(1);
}

function usage(exitCode = 0) {
	const text = [
		"Usage:",
		"  node ./scripts/agent-runtime/run-live-simulator-persona.mjs --workspace <dir> --simulator-request-file <file> --simulator-result-file <file> --backend codex_exec|claude_p|fixture [--fixture-results-file <file>] [--timeout-ms <ms>]",
	].join("\n");
	const out = exitCode === 0 ? process.stdout : process.stderr;
	out.write(`${text}\n`);
	process.exit(exitCode);
}

function assertString(value, field) {
	if (typeof value !== "string" || !value.trim()) {
		fail(`${field} must be a non-empty string`);
	}
	return value;
}

function assertPositiveInteger(value, field) {
	if (!Number.isInteger(value) || value <= 0) {
		fail(`${field} must be a positive integer`);
	}
	return value;
}

function setArgOption(options, arg, value) {
	switch (arg) {
		case "--workspace":
			options.workspace = resolve(value);
			return;
		case "--simulator-request-file":
			options.simulatorRequestFile = resolve(value);
			return;
		case "--simulator-result-file":
			options.simulatorResultFile = resolve(value);
			return;
		case "--backend":
			options.backend = value;
			return;
		case "--fixture-results-file":
			options.fixtureResultsFile = resolve(value);
			return;
		case "--timeout-ms":
			options.timeoutMs = Number(value);
			if (!Number.isInteger(options.timeoutMs) || options.timeoutMs <= 0) {
				fail("--timeout-ms must be a positive integer");
			}
			return;
		default:
			fail(`Unknown argument: ${arg}`);
	}
}

function parseArgs(argv) {
	const options = {
		workspace: process.cwd(),
		simulatorRequestFile: null,
		simulatorResultFile: null,
		backend: null,
		fixtureResultsFile: null,
		timeoutMs: 120000,
	};
	for (let index = 0; index < argv.length; index += 1) {
		const arg = argv[index];
		if (arg === "-h" || arg === "--help") {
			usage(0);
		}
		const value = argv[index + 1];
		if (!value) {
			fail(`Missing value for ${arg}`);
		}
		setArgOption(options, arg, value);
		index += 1;
	}
	if (!options.simulatorRequestFile) {
		fail("--simulator-request-file is required");
	}
	if (!options.simulatorResultFile) {
		fail("--simulator-result-file is required");
	}
	if (!["codex_exec", "claude_p", "fixture"].includes(options.backend)) {
		fail("--backend must be codex_exec, claude_p, or fixture");
	}
	if (options.backend === "fixture" && !options.fixtureResultsFile) {
		fail("--fixture-results-file is required when --backend fixture");
	}
	return options;
}

function readJson(path, label) {
	try {
		return JSON.parse(readFileSync(path, "utf-8"));
	} catch (error) {
		fail(`${label} must be valid JSON: ${error.message}`);
	}
}

function writeJson(path, value) {
	writeFileSync(path, `${JSON.stringify(value, null, 2)}\n`, "utf-8");
}

function normalizeSimulatorTurn(value, field) {
	if (typeof value === "string") {
		return { text: assertString(value, field) };
	}
	if (!value || typeof value !== "object" || Array.isArray(value)) {
		fail(`${field} must be either a string or an object with text`);
	}
	const normalized = {
		text: assertString(value.text, `${field}.text`),
	};
	if (value.metadata !== undefined) {
		if (!value.metadata || typeof value.metadata !== "object" || Array.isArray(value.metadata)) {
			fail(`${field}.metadata must be an object when present`);
		}
		normalized.metadata = value.metadata;
	}
	return normalized;
}

function validateTranscript(entries, field) {
	if (!Array.isArray(entries)) {
		fail(`${field} must be an array`);
	}
	for (const [index, entry] of entries.entries()) {
		if (!entry || typeof entry !== "object" || Array.isArray(entry)) {
			fail(`${field}[${index}] must be an object`);
		}
		assertPositiveInteger(entry.turnIndex, `${field}[${index}].turnIndex`);
		normalizeSimulatorTurn(entry.simulatorTurn, `${field}[${index}].simulatorTurn`);
		normalizeSimulatorTurn(entry.assistantTurn, `${field}[${index}].assistantTurn`);
	}
}

function validateSimulatorRequest(packet) {
	if (!packet || typeof packet !== "object" || Array.isArray(packet)) {
		fail("simulator request packet must be an object");
	}
	if (packet.schemaVersion !== LIVE_RUN_SIMULATOR_REQUEST_SCHEMA) {
		fail(`simulator request packet must use schemaVersion ${LIVE_RUN_SIMULATOR_REQUEST_SCHEMA}`);
	}
	assertString(packet.requestId, "simulator request.requestId");
	assertString(packet.instanceId, "simulator request.instanceId");
	assertString(packet.scenarioId, "simulator request.scenarioId");
	assertPositiveInteger(packet.turnIndex, "simulator request.turnIndex");
	assertPositiveInteger(packet.maxTurns, "simulator request.maxTurns");
	assertString(packet.instructions, "simulator request.instructions");
	validateTranscript(packet.transcript ?? [], "simulator request.transcript");
}

function validateSimulatorResult(packet, request) {
	if (!packet || typeof packet !== "object" || Array.isArray(packet)) {
		fail("simulator result packet must be an object");
	}
	if (packet.schemaVersion !== LIVE_RUN_SIMULATOR_RESULT_SCHEMA) {
		fail(`simulator result packet must use schemaVersion ${LIVE_RUN_SIMULATOR_RESULT_SCHEMA}`);
	}
	if (assertString(packet.requestId, "simulator result.requestId") !== request.requestId) {
		fail(`simulator result.requestId ${packet.requestId} does not match request.requestId ${request.requestId}`);
	}
	if (assertString(packet.instanceId, "simulator result.instanceId") !== request.instanceId) {
		fail(`simulator result.instanceId ${packet.instanceId} does not match request.instanceId ${request.instanceId}`);
	}
	if (assertPositiveInteger(packet.turnIndex, "simulator result.turnIndex") !== request.turnIndex) {
		fail(`simulator result.turnIndex ${packet.turnIndex} does not match request.turnIndex ${request.turnIndex}`);
	}
	const executionStatus = assertString(packet.executionStatus, "simulator result.executionStatus");
	if (!EXECUTION_STATUSES.has(executionStatus)) {
		fail("simulator result.executionStatus must be one of: completed, blocked, failed");
	}
	assertString(packet.summary, "simulator result.summary");
	if (executionStatus === "completed") {
		validateCompletedSimulatorResult(packet);
		return;
	}
	if (!Array.isArray(packet.diagnostics) || packet.diagnostics.length === 0) {
		fail(`${executionStatus} simulator result must include diagnostics`);
	}
}

function validateCompletedSimulatorResult(packet) {
	const action = assertString(packet.action, "simulator result.action");
	if (!ACTIONS.has(action)) {
		fail("simulator result.action must be continue or stop");
	}
	if (action === "continue") {
		normalizeSimulatorTurn(packet.simulatorTurn, "simulator result.simulatorTurn");
		return;
	}
	assertString(packet.stopReason, "simulator result.stopReason");
}

function renderPersonaPrompt(request) {
	const transcriptLines = (request.transcript || []).flatMap((entry) => [
		`Turn ${entry.turnIndex} user: ${entry.simulatorTurn.text}`,
		`Turn ${entry.turnIndex} assistant: ${entry.assistantTurn.text}`,
	]);
	const lines = [
		"You are a synthetic user simulator in a bounded chatbot evaluation loop.",
		"Decide whether the user should continue with one more turn or stop because the goal is already satisfied.",
		"If you continue, return one concise user turn.",
		"If you stop, use stopReason `goal_satisfied` unless a more specific stop reason is clearly required.",
		"",
		"Persona instructions:",
		request.instructions,
		"",
		`Next turn index: ${request.turnIndex}`,
		`Max turns: ${request.maxTurns}`,
		"",
		"Transcript so far:",
		...(transcriptLines.length > 0 ? transcriptLines : ["(no prior turns)"]),
		"",
		"Return only JSON matching the provided schema.",
	];
	return `${lines.join("\n")}\n`;
}

function personaSchema() {
	return {
		type: "object",
		required: ["action", "summary"],
		properties: {
			action: {
				type: "string",
				enum: ["continue", "stop"],
			},
			summary: {
				type: "string",
			},
			nextTurnText: {
				type: "string",
			},
			stopReason: {
				type: "string",
			},
		},
	};
}

function buildMissingFixtureResponse(request) {
	return {
		schemaVersion: LIVE_RUN_SIMULATOR_RESULT_SCHEMA,
		requestId: request.requestId,
		instanceId: request.instanceId,
		turnIndex: request.turnIndex,
		executionStatus: "failed",
		summary: "Fixture simulator response was missing.",
		diagnostics: [{ code: "missing_fixture_response", severity: "error", message: `No fixture response for turn ${request.turnIndex}.` }],
	};
}

function buildFixtureContinueResult(request, response, index) {
	return {
		schemaVersion: LIVE_RUN_SIMULATOR_RESULT_SCHEMA,
		requestId: request.requestId,
		instanceId: request.instanceId,
		turnIndex: request.turnIndex,
		executionStatus: "completed",
		action: "continue",
		summary: typeof response.summary === "string" && response.summary.trim() ? response.summary : "Fixture simulator continued the conversation.",
		simulatorTurn: normalizeSimulatorTurn(response.simulatorTurn ?? response.nextTurnText, `fixture.responses[${index}].simulatorTurn`),
	};
}

function buildFixtureStopResult(request, response) {
	return {
		schemaVersion: LIVE_RUN_SIMULATOR_RESULT_SCHEMA,
		requestId: request.requestId,
		instanceId: request.instanceId,
		turnIndex: request.turnIndex,
		executionStatus: "completed",
		action: "stop",
		stopReason: typeof response.stopReason === "string" && response.stopReason.trim() ? response.stopReason : "goal_satisfied",
		summary: typeof response.summary === "string" && response.summary.trim() ? response.summary : "Fixture simulator stopped the conversation.",
	};
}

function fixtureResult(request, fixtureFile) {
	const fixture = readJson(fixtureFile, "fixture results file");
	const responses = Array.isArray(fixture.responses) ? fixture.responses : [];
	const responseIndex = request.turnIndex - 1;
	const response = responses[responseIndex] ?? null;
	if (!response || typeof response !== "object" || Array.isArray(response)) {
		return buildMissingFixtureResponse(request);
	}
	const action = assertString(response.action, `fixture.responses[${responseIndex}].action`);
	if (action === "continue") {
		return buildFixtureContinueResult(request, response, responseIndex);
	}
	return buildFixtureStopResult(request, response);
}

function llmResult(request, options) {
	const tempDir = mkdtempSync(join(tmpdir(), "cautilus-live-persona-"));
	try {
		const promptFile = join(tempDir, "prompt.txt");
		const schemaFile = join(tempDir, "schema.json");
		const outputFile = join(tempDir, "output.json");
		writeFileSync(promptFile, renderPersonaPrompt(request), "utf-8");
		writeJson(schemaFile, personaSchema());
		const runner = resolve(process.cwd(), "scripts", "agent-runtime", "run-review-variant.sh");
		const result = spawnSync(
			"bash",
			[
				runner,
				"--backend",
				options.backend,
				"--workspace",
				options.workspace,
				"--prompt-file",
				promptFile,
				"--schema-file",
				schemaFile,
				"--output-file",
				outputFile,
			],
			{
				encoding: "utf-8",
				timeout: options.timeoutMs,
			},
		);
		if (result.error?.code === "ETIMEDOUT") {
			return {
				schemaVersion: LIVE_RUN_SIMULATOR_RESULT_SCHEMA,
				requestId: request.requestId,
				instanceId: request.instanceId,
				turnIndex: request.turnIndex,
				executionStatus: "failed",
				summary: "Simulator persona timed out before producing a result.",
				diagnostics: [{ code: "persona_timeout", severity: "error", message: `Simulator backend timed out after ${options.timeoutMs}ms.` }],
			};
		}
		if (result.status !== 0) {
			const detail = [result.stdout, result.stderr].filter(Boolean).join("\n").trim();
			return {
				schemaVersion: LIVE_RUN_SIMULATOR_RESULT_SCHEMA,
				requestId: request.requestId,
				instanceId: request.instanceId,
				turnIndex: request.turnIndex,
				executionStatus: "failed",
				summary: "Simulator persona backend failed.",
				diagnostics: [{ code: "persona_backend_failed", severity: "error", message: detail || "Simulator backend failed." }],
			};
		}
		const parsed = readJson(outputFile, "persona backend output");
		const action = assertString(parsed.action, "persona backend output.action");
		if (action === "continue") {
			return {
				schemaVersion: LIVE_RUN_SIMULATOR_RESULT_SCHEMA,
				requestId: request.requestId,
				instanceId: request.instanceId,
				turnIndex: request.turnIndex,
				executionStatus: "completed",
				action,
				summary: assertString(parsed.summary, "persona backend output.summary"),
				simulatorTurn: { text: assertString(parsed.nextTurnText, "persona backend output.nextTurnText") },
			};
		}
		return {
			schemaVersion: LIVE_RUN_SIMULATOR_RESULT_SCHEMA,
			requestId: request.requestId,
			instanceId: request.instanceId,
			turnIndex: request.turnIndex,
			executionStatus: "completed",
			action: "stop",
			stopReason: assertString(parsed.stopReason || "goal_satisfied", "persona backend output.stopReason"),
			summary: assertString(parsed.summary, "persona backend output.summary"),
		};
	} finally {
		rmSync(tempDir, { recursive: true, force: true });
	}
}

export function main(argv = process.argv.slice(2)) {
	const options = parseArgs(argv);
	const request = readJson(options.simulatorRequestFile, "simulator request file");
	validateSimulatorRequest(request);
	const result = options.backend === "fixture"
		? fixtureResult(request, options.fixtureResultsFile)
		: llmResult(request, options);
	validateSimulatorResult(result, request);
	writeJson(options.simulatorResultFile, result);
}

const entryHref = process.argv[1] ? pathToFileURL(resolve(process.argv[1])).href : "";
if (import.meta.url === entryHref) {
	main();
}
