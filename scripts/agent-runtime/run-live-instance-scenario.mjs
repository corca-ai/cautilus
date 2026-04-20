/* eslint-disable max-lines */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { spawnSync } from "node:child_process";
import process from "node:process";
import { pathToFileURL } from "node:url";

import { loadAdapter } from "../resolve_adapter.mjs";

const LIVE_RUN_REQUEST_SCHEMA = "cautilus.live_run_invocation_request.v1";
const LIVE_RUN_RESULT_SCHEMA = "cautilus.live_run_invocation_result.v1";
const LIVE_RUN_SIMULATOR_REQUEST_SCHEMA = "cautilus.live_run_simulator_request.v1";
const LIVE_RUN_SIMULATOR_RESULT_SCHEMA = "cautilus.live_run_simulator_result.v1";
const LIVE_RUN_TURN_REQUEST_SCHEMA = "cautilus.live_run_turn_request.v1";
const LIVE_RUN_TURN_RESULT_SCHEMA = "cautilus.live_run_turn_result.v1";
const LIVE_RUN_TRANSCRIPT_SCHEMA = "cautilus.live_run_transcript.v1";
const EXECUTION_STATUSES = new Set(["completed", "blocked", "failed"]);
const HELPER_PATH_PATTERN = /scripts\/agent-runtime\/run-live-instance-scenario\.mjs/u;

function fail(message) {
	process.stderr.write(`${message}\n`);
	process.exit(1);
}

function usage(exitCode = 0) {
	const text = [
		"Usage:",
		"  node ./scripts/agent-runtime/run-live-instance-scenario.mjs --repo-root <dir> [--adapter-path <path> | --adapter-name <name>] --instance-id <id> --request-file <file> --output-file <file>",
	].join("\n");
	const out = exitCode === 0 ? process.stdout : process.stderr;
	out.write(`${text}\n`);
	process.exit(exitCode);
}

function parseArgs(argv) {
	const options = {
		repoRoot: process.cwd(),
		adapterPath: null,
		adapterName: null,
		instanceId: null,
		requestFile: null,
		outputFile: null,
	};
	for (let index = 0; index < argv.length; index += 1) {
		const arg = argv[index];
		if (arg === "-h" || arg === "--help") {
			usage(0);
		}
		const field = {
			"--repo-root": "repoRoot",
			"--adapter-path": "adapterPath",
			"--adapter": "adapterPath",
			"--adapter-name": "adapterName",
			"--instance-id": "instanceId",
			"--request-file": "requestFile",
			"--output-file": "outputFile",
		}[arg];
		if (!field) {
			fail(`Unknown argument: ${arg}`);
		}
		const value = argv[index + 1];
		if (!value) {
			fail(`Missing value for ${arg}`);
		}
		options[field] = value;
		index += 1;
	}
	if (options.adapterPath && options.adapterName) {
		fail("Use either --adapter-path/--adapter or --adapter-name, not both.");
	}
	for (const field of ["instanceId", "requestFile", "outputFile"]) {
		if (!options[field]) {
			fail(`Missing required argument: ${field}`);
		}
	}
	return options;
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

function readJsonFile(filePath, label) {
	try {
		return JSON.parse(readFileSync(filePath, "utf-8"));
	} catch (error) {
		fail(`${label} must be valid JSON: ${error.message}`);
	}
}

function writeJsonFile(filePath, value) {
	writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`, "utf-8");
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

function normalizeScriptedSimulator(simulator) {
	if (!Array.isArray(simulator.turns) || simulator.turns.length === 0) {
		fail("request.scenario.simulator.turns must be a non-empty list");
	}
	return {
		kind: "scripted",
		scriptedTurns: simulator.turns.map((turn, index) =>
			normalizeSimulatorTurn(turn, `request.scenario.simulator.turns[${index}]`),
		),
	};
}

function normalizePersonaPromptSimulator(simulator) {
	if (typeof simulator.instructions !== "string" || !simulator.instructions.trim()) {
		fail("request.scenario.simulator.instructions must be a non-empty string");
	}
	const seedTurns = Array.isArray(simulator.seedTurns)
		? simulator.seedTurns.map((turn, index) =>
			normalizeSimulatorTurn(turn, `request.scenario.simulator.seedTurns[${index}]`),
		)
		: [];
	return {
		kind: "persona_prompt",
		instructions: simulator.instructions.trim(),
		seedTurns,
	};
}

function normalizeLegacySimulatorTurns(scenario) {
	if (!Array.isArray(scenario.simulatorTurns) || scenario.simulatorTurns.length === 0) {
		fail("request.scenario.simulatorTurns must be a non-empty list of strings");
	}
	return {
		kind: "scripted",
		scriptedTurns: scenario.simulatorTurns.map((turn, index) => ({
			text: assertString(turn, `request.scenario.simulatorTurns[${index}]`),
		})),
	};
}

function normalizeSimulatorSpec(scenario) {
	if (scenario.simulator && scenario.simulatorTurns) {
		fail("request.scenario.simulator and request.scenario.simulatorTurns cannot both be set");
	}
	if (scenario.simulator) {
		if (!scenario.simulator || typeof scenario.simulator !== "object" || Array.isArray(scenario.simulator)) {
			fail("request.scenario.simulator must be an object");
		}
		switch (scenario.simulator.kind) {
			case "scripted":
				return normalizeScriptedSimulator(scenario.simulator);
			case "persona_prompt":
				return normalizePersonaPromptSimulator(scenario.simulator);
			default:
				fail("request.scenario.simulator.kind must be scripted or persona_prompt");
		}
	}
	return normalizeLegacySimulatorTurns(scenario);
}

function validateAssistantTurn(turn, field) {
	if (!turn || typeof turn !== "object" || Array.isArray(turn)) {
		fail(`${field} must be an object`);
	}
	assertString(turn.text, `${field}.text`);
	if (turn.metadata !== undefined && (!turn.metadata || typeof turn.metadata !== "object" || Array.isArray(turn.metadata))) {
		fail(`${field}.metadata must be an object when present`);
	}
}

function validateTranscript(entries) {
	if (!Array.isArray(entries)) {
		fail("result.transcript must be an array when present");
	}
	for (const [index, entry] of entries.entries()) {
		if (!entry || typeof entry !== "object" || Array.isArray(entry)) {
			fail(`result.transcript[${index}] must be an object`);
		}
		assertPositiveInteger(entry.turnIndex, `result.transcript[${index}].turnIndex`);
		normalizeSimulatorTurn(entry.simulatorTurn, `result.transcript[${index}].simulatorTurn`);
		validateAssistantTurn(entry.assistantTurn, `result.transcript[${index}].assistantTurn`);
		if (entry.consumerSignal !== undefined && (!entry.consumerSignal || typeof entry.consumerSignal !== "object" || Array.isArray(entry.consumerSignal))) {
			fail(`result.transcript[${index}].consumerSignal must be an object when present`);
		}
	}
}

function validateScenarioPacket(scenario) {
	if (!scenario || typeof scenario !== "object" || Array.isArray(scenario)) {
		fail("request.scenario must be an object");
	}
	assertString(scenario.scenarioId, "request.scenario.scenarioId");
	assertString(scenario.name, "request.scenario.name");
	assertString(scenario.description, "request.scenario.description");
	assertPositiveInteger(scenario.maxTurns, "request.scenario.maxTurns");
	assertString(scenario.sideEffectsMode, "request.scenario.sideEffectsMode");
	normalizeSimulatorSpec(scenario);
}

function validateRequestPacket(request, expectedInstanceId) {
	if (!request || typeof request !== "object" || Array.isArray(request)) {
		fail("request packet must be an object");
	}
	if (request.schemaVersion !== LIVE_RUN_REQUEST_SCHEMA) {
		fail(`request packet must use schemaVersion ${LIVE_RUN_REQUEST_SCHEMA}`);
	}
	assertString(request.requestId, "request.requestId");
	const instanceId = assertString(request.instanceId, "request.instanceId");
	if (instanceId !== expectedInstanceId) {
		fail(`request.instanceId ${instanceId} does not match --instance-id ${expectedInstanceId}`);
	}
	assertPositiveInteger(request.timeoutMs, "request.timeoutMs");
	if (request.consumerMetadata !== undefined && (!request.consumerMetadata || typeof request.consumerMetadata !== "object" || Array.isArray(request.consumerMetadata))) {
		fail("request.consumerMetadata must be an object when present");
	}
	validateScenarioPacket(request.scenario);
}

function validateResultPacketBase(result, request) {
	if (!result || typeof result !== "object" || Array.isArray(result)) {
		fail("result packet must be an object");
	}
	if (result.schemaVersion !== LIVE_RUN_RESULT_SCHEMA) {
		fail(`result packet must use schemaVersion ${LIVE_RUN_RESULT_SCHEMA}`);
	}
	if (assertString(result.requestId, "result.requestId") !== request.requestId) {
		fail(`result.requestId ${result.requestId} does not match request.requestId ${request.requestId}`);
	}
	if (assertString(result.instanceId, "result.instanceId") !== request.instanceId) {
		fail(`result.instanceId ${result.instanceId} does not match request.instanceId ${request.instanceId}`);
	}
	const executionStatus = assertString(result.executionStatus, "result.executionStatus");
	if (!EXECUTION_STATUSES.has(executionStatus)) {
		fail("result.executionStatus must be one of: completed, blocked, failed");
	}
	assertString(result.summary, "result.summary");
	if (result.stopReason !== undefined) {
		assertString(result.stopReason, "result.stopReason");
	}
	if (result.transcript !== undefined) {
		validateTranscript(result.transcript);
	}
	return executionStatus;
}

function validateCompletedResult(result, request) {
	if (!result.scenarioResult || typeof result.scenarioResult !== "object" || Array.isArray(result.scenarioResult)) {
		fail("completed result must include scenarioResult");
	}
	if (assertString(result.scenarioResult.scenarioId, "result.scenarioResult.scenarioId") !== request.scenario.scenarioId) {
		fail(
			`result.scenarioResult.scenarioId ${result.scenarioResult.scenarioId} does not match request.scenario.scenarioId ${request.scenario.scenarioId}`,
		);
	}
	assertString(result.scenarioResult.status, "result.scenarioResult.status");
	assertString(result.scenarioResult.summary, "result.scenarioResult.summary");
}

function validateDiagnosticResult(result, executionStatus) {
	if (!Array.isArray(result.diagnostics) || result.diagnostics.length === 0) {
		fail(`${executionStatus} result must include diagnostics`);
	}
	for (const [index, diagnostic] of result.diagnostics.entries()) {
		if (!diagnostic || typeof diagnostic !== "object" || Array.isArray(diagnostic)) {
			fail(`result.diagnostics[${index}] must be an object`);
		}
		assertString(diagnostic.code, `result.diagnostics[${index}].code`);
		assertString(diagnostic.severity, `result.diagnostics[${index}].severity`);
		assertString(diagnostic.message, `result.diagnostics[${index}].message`);
	}
}

function validateResultPacket(result, request) {
	const executionStatus = validateResultPacketBase(result, request);
	if (executionStatus === "completed") {
		validateCompletedResult(result, request);
		return;
	}
	validateDiagnosticResult(result, executionStatus);
}

function validateTurnResultPacket(result, request, expectedTurnIndex) {
	if (!result || typeof result !== "object" || Array.isArray(result)) {
		fail("turn result packet must be an object");
	}
	if (result.schemaVersion !== LIVE_RUN_TURN_RESULT_SCHEMA) {
		fail(`turn result packet must use schemaVersion ${LIVE_RUN_TURN_RESULT_SCHEMA}`);
	}
	if (assertString(result.requestId, "turn result.requestId") !== request.requestId) {
		fail(`turn result.requestId ${result.requestId} does not match request.requestId ${request.requestId}`);
	}
	if (assertString(result.instanceId, "turn result.instanceId") !== request.instanceId) {
		fail(`turn result.instanceId ${result.instanceId} does not match request.instanceId ${request.instanceId}`);
	}
	if (assertPositiveInteger(result.turnIndex, "turn result.turnIndex") !== expectedTurnIndex) {
		fail(`turn result.turnIndex ${result.turnIndex} does not match expected turn index ${expectedTurnIndex}`);
	}
	const executionStatus = assertString(result.executionStatus, "turn result.executionStatus");
	if (!EXECUTION_STATUSES.has(executionStatus)) {
		fail("turn result.executionStatus must be one of: completed, blocked, failed");
	}
	assertString(result.summary, "turn result.summary");
	if (executionStatus === "completed") {
		validateAssistantTurn(result.assistantTurn, "turn result.assistantTurn");
		return;
	}
	validateDiagnosticResult(result, executionStatus);
}

function validateCompletedSimulatorResultPacket(result) {
	const action = assertString(result.action, "simulator result.action");
	if (action !== "continue" && action !== "stop") {
		fail("simulator result.action must be continue or stop");
	}
	if (action === "continue") {
		normalizeSimulatorTurn(result.simulatorTurn, "simulator result.simulatorTurn");
		return;
	}
	assertString(result.stopReason, "simulator result.stopReason");
}

function validateSimulatorResultPacket(result, request, expectedTurnIndex) {
	if (!result || typeof result !== "object" || Array.isArray(result)) {
		fail("simulator result packet must be an object");
	}
	if (result.schemaVersion !== LIVE_RUN_SIMULATOR_RESULT_SCHEMA) {
		fail(`simulator result packet must use schemaVersion ${LIVE_RUN_SIMULATOR_RESULT_SCHEMA}`);
	}
	if (assertString(result.requestId, "simulator result.requestId") !== request.requestId) {
		fail(`simulator result.requestId ${result.requestId} does not match request.requestId ${request.requestId}`);
	}
	if (assertString(result.instanceId, "simulator result.instanceId") !== request.instanceId) {
		fail(`simulator result.instanceId ${result.instanceId} does not match request.instanceId ${request.instanceId}`);
	}
	if (assertPositiveInteger(result.turnIndex, "simulator result.turnIndex") !== expectedTurnIndex) {
		fail(`simulator result.turnIndex ${result.turnIndex} does not match expected turn index ${expectedTurnIndex}`);
	}
	const executionStatus = assertString(result.executionStatus, "simulator result.executionStatus");
	if (!EXECUTION_STATUSES.has(executionStatus)) {
		fail("simulator result.executionStatus must be one of: completed, blocked, failed");
	}
	assertString(result.summary, "simulator result.summary");
	if (executionStatus === "completed") {
		validateCompletedSimulatorResultPacket(result);
		return;
	}
	validateDiagnosticResult(result, executionStatus);
}

function resolveConsumerCommand(liveRunInvocation) {
	const consumerCommandTemplate =
		liveRunInvocation.consumer_command_template ?? liveRunInvocation.command_template ?? null;
	if (!consumerCommandTemplate) {
		fail("Adapter does not declare a runnable live invocation command.");
	}
	if (!liveRunInvocation.consumer_command_template && HELPER_PATH_PATTERN.test(consumerCommandTemplate)) {
		fail(
			"live_run_invocation.command_template points back at the product helper. Set live_run_invocation.consumer_command_template to the consumer-owned command.",
		);
	}
	return consumerCommandTemplate;
}

function buildInvocationContext(options) {
	const repoRoot = resolve(options.repoRoot);
	return {
		repoRoot,
		adapterPath: options.adapterPath ? resolve(repoRoot, options.adapterPath) : null,
		requestFile: resolve(repoRoot, options.requestFile),
		outputFile: resolve(repoRoot, options.outputFile),
	};
}

function loadInvocationState(options, context) {
	const payload = loadAdapter(context.repoRoot, {
		adapter: context.adapterPath,
		adapterName: options.adapterName,
	});
	if (!payload.found) {
		fail("No checked-in adapter was found.");
	}
	if (!payload.valid) {
		fail(`Adapter is invalid: ${JSON.stringify(payload.errors ?? [])}`);
	}
	const liveRunInvocation = payload.data?.live_run_invocation;
	if (!liveRunInvocation) {
		fail("Adapter does not declare live_run_invocation.");
	}
	const request = readJsonFile(context.requestFile, "request file");
	validateRequestPacket(request, options.instanceId);
	return { payload, liveRunInvocation, request };
}

function buildReplacements(payload, context, options, extra = {}) {
	return {
		repo_root: shellEscape(context.repoRoot),
		adapter_path: shellEscape(payload.path ?? context.adapterPath ?? ""),
		instance_id: shellEscape(options.instanceId),
		request_file: shellEscape(context.requestFile),
		output_file: shellEscape(context.outputFile),
		...extra,
	};
}

function executeCommand(command, cwd, timeoutMs = 0) {
	const result = spawnSync("bash", ["-lc", command], {
		cwd,
		encoding: "utf-8",
		...(timeoutMs > 0 ? { timeout: timeoutMs } : {}),
	});
	const detail = [result.stdout, result.stderr].filter(Boolean).join("\n").trim();
	if (result.error?.code === "ETIMEDOUT") {
		return { timedOut: true, detail: `command timed out after ${timeoutMs}ms` };
	}
	if (result.status !== 0) {
		return { timedOut: false, detail: detail || "command failed" };
	}
	return { timedOut: false, detail: "" };
}

function hasMultiTurnLoop(liveRunInvocation) {
	return typeof liveRunInvocation.consumer_single_turn_command_template === "string"
		&& liveRunInvocation.consumer_single_turn_command_template.trim().length > 0;
}

function remainingTimeoutMs(startedAt, timeoutMs) {
	return Math.max(0, timeoutMs - (Date.now() - startedAt));
}

function captureTranscript(request) {
	return request.captureTranscript === true;
}

function transcriptExcerpt(transcript) {
	return transcript.slice(0, 2);
}

function buildCompletedResult(request, transcript, startedAt, stopReason, evaluation, artifactPaths = []) {
	const summary = typeof evaluation?.summary === "string" && evaluation.summary.trim()
		? evaluation.summary
		: `Completed ${transcript.length} turn(s); stop reason: ${stopReason}.`;
	const status = typeof evaluation?.status === "string" && evaluation.status.trim()
		? evaluation.status
		: "completed";
	return {
		schemaVersion: LIVE_RUN_RESULT_SCHEMA,
		requestId: request.requestId,
		instanceId: request.instanceId,
		executionStatus: "completed",
		summary,
		stopReason,
		startedAt: new Date(startedAt).toISOString(),
		completedAt: new Date().toISOString(),
		durationMs: Date.now() - startedAt,
		scenarioResult: {
			scenarioId: request.scenario.scenarioId,
			status,
			summary,
			...(transcript.length > 0 ? { transcriptExcerpt: transcriptExcerpt(transcript) } : {}),
		},
		...(captureTranscript(request) ? { transcript } : {}),
		...(evaluation ? { evaluation } : {}),
		...(artifactPaths.length > 0 ? { artifactPaths } : {}),
	};
}

function buildDiagnosticResult(request, transcript, startedAt, executionStatus, stopReason, summary, diagnostics) {
	return {
		schemaVersion: LIVE_RUN_RESULT_SCHEMA,
		requestId: request.requestId,
		instanceId: request.instanceId,
		executionStatus,
		summary,
		stopReason,
		startedAt: new Date(startedAt).toISOString(),
		completedAt: new Date().toISOString(),
		durationMs: Date.now() - startedAt,
		diagnostics,
		...(captureTranscript(request) && transcript.length > 0 ? { transcript } : {}),
	};
}

function diagnostic(code, message) {
	return { code, severity: "error", message };
}

function resolveSingleTurnTemplate(liveRunInvocation) {
	const template = liveRunInvocation.consumer_single_turn_command_template?.trim();
	if (!template || HELPER_PATH_PATTERN.test(template)) {
		fail("live_run_invocation.consumer_single_turn_command_template must point at a consumer-owned single-turn command.");
	}
	return template;
}

function resolveSimulatorPersonaTemplate(liveRunInvocation) {
	const template = liveRunInvocation.simulator_persona_command_template?.trim();
	if (!template) {
		fail("live_run_invocation.simulator_persona_command_template is required for simulator.kind persona_prompt.");
	}
	if (HELPER_PATH_PATTERN.test(template)) {
		fail("live_run_invocation.simulator_persona_command_template must point at a simulator-owned command, not the product helper.");
	}
	return template;
}

function buildTurnRequest(request, scriptedTurn, transcript, turnIndex) {
	return {
		schemaVersion: LIVE_RUN_TURN_REQUEST_SCHEMA,
		requestId: request.requestId,
		instanceId: request.instanceId,
		scenarioId: request.scenario.scenarioId,
		turnIndex,
		maxTurns: request.scenario.maxTurns,
		simulatorTurn: scriptedTurn,
		transcript,
		...(request.consumerMetadata ? { consumerMetadata: request.consumerMetadata } : {}),
		...(typeof request.captureTranscript === "boolean" ? { captureTranscript: request.captureTranscript } : {}),
	};
}

function buildSimulatorRequest(request, transcript, simulatorSpec, turnIndex) {
	return {
		schemaVersion: LIVE_RUN_SIMULATOR_REQUEST_SCHEMA,
		requestId: request.requestId,
		instanceId: request.instanceId,
		scenarioId: request.scenario.scenarioId,
		turnIndex,
		maxTurns: request.scenario.maxTurns,
		instructions: simulatorSpec.instructions,
		transcript,
		...(request.consumerMetadata ? { consumerMetadata: request.consumerMetadata } : {}),
	};
}

function runScriptedTurn(options, context, payload, request, singleTurnTemplate, transcript, scriptedTurn, turnIndex, artifactDir, startedAt) {
	const turnRequestFile = join(artifactDir, `turn-request-${String(turnIndex).padStart(2, "0")}.json`);
	const turnResultFile = join(artifactDir, `turn-result-${String(turnIndex).padStart(2, "0")}.json`);
	writeJsonFile(turnRequestFile, buildTurnRequest(request, scriptedTurn, transcript, turnIndex));
	const command = renderTemplate(singleTurnTemplate, buildReplacements(payload, context, options, {
		turn_request_file: shellEscape(turnRequestFile),
		turn_result_file: shellEscape(turnResultFile),
	}));
	const commandResult = executeCommand(command, context.repoRoot, remainingTimeoutMs(startedAt, request.timeoutMs));
	if (commandResult.timedOut) {
		return { completedResult: buildCompletedResult(request, transcript, startedAt, "timeout_reached", null) };
	}
	if (commandResult.detail) {
		return {
			completedResult: buildDiagnosticResult(
				request,
				transcript,
				startedAt,
				"failed",
				"consumer_turn_failed",
				"consumer single-turn command failed",
				[diagnostic("consumer_single_turn_command_failed", commandResult.detail)],
			),
		};
	}
	const turnResult = readJsonFile(turnResultFile, "turn result file");
	validateTurnResultPacket(turnResult, request, turnIndex);
	if (turnResult.executionStatus === "completed") {
		return {
			transcriptEntry: {
				turnIndex,
				simulatorTurn: scriptedTurn,
				assistantTurn: turnResult.assistantTurn,
				...(turnResult.consumerSignal ? { consumerSignal: turnResult.consumerSignal } : {}),
			},
		};
	}
	return {
		completedResult: buildDiagnosticResult(
			request,
			transcript,
			startedAt,
			turnResult.executionStatus,
			turnResult.executionStatus === "blocked" ? "blocked_by_consumer" : "consumer_turn_failed",
			turnResult.summary,
			turnResult.diagnostics,
		),
	};
}

function runSimulatorPersonaTurn(
	options,
	context,
	payload,
	request,
	liveRunInvocation,
	simulatorSpec,
	transcript,
	turnIndex,
	artifactDir,
	startedAt,
) {
	const simulatorTemplate = resolveSimulatorPersonaTemplate(liveRunInvocation);
	const simulatorRequestFile = join(artifactDir, `simulator-request-${String(turnIndex).padStart(2, "0")}.json`);
	const simulatorResultFile = join(artifactDir, `simulator-result-${String(turnIndex).padStart(2, "0")}.json`);
	writeJsonFile(simulatorRequestFile, buildSimulatorRequest(request, transcript, simulatorSpec, turnIndex));
	const command = renderTemplate(simulatorTemplate, buildReplacements(payload, context, options, {
		simulator_request_file: shellEscape(simulatorRequestFile),
		simulator_result_file: shellEscape(simulatorResultFile),
	}));
	const commandResult = executeCommand(command, context.repoRoot, remainingTimeoutMs(startedAt, request.timeoutMs));
	if (commandResult.timedOut) {
		return { completedResult: buildCompletedResult(request, transcript, startedAt, "timeout_reached", null) };
	}
	if (commandResult.detail) {
		return {
			completedResult: buildDiagnosticResult(
				request,
				transcript,
				startedAt,
				"failed",
				"simulator_persona_failed",
				"simulator persona command failed",
				[diagnostic("simulator_persona_command_failed", commandResult.detail)],
			),
		};
	}
	const simulatorResult = readJsonFile(simulatorResultFile, "simulator result file");
	validateSimulatorResultPacket(simulatorResult, request, turnIndex);
	if (simulatorResult.executionStatus === "completed") {
		if (simulatorResult.action === "stop") {
			return { stopReason: simulatorResult.stopReason };
		}
		return { simulatorTurn: simulatorResult.simulatorTurn };
	}
	return {
		completedResult: buildDiagnosticResult(
			request,
			transcript,
			startedAt,
			simulatorResult.executionStatus,
			simulatorResult.executionStatus === "blocked" ? "simulator_persona_blocked" : "simulator_persona_failed",
			simulatorResult.summary,
			simulatorResult.diagnostics,
		),
	};
}

function materializeTranscriptArtifact(request, transcript, artifactDir, stopReason, needsArtifact) {
	if (!needsArtifact) {
		return { transcriptFile: null, artifactPaths: [] };
	}
	const transcriptFile = join(artifactDir, "transcript.json");
	writeJsonFile(transcriptFile, {
		schemaVersion: LIVE_RUN_TRANSCRIPT_SCHEMA,
		requestId: request.requestId,
		instanceId: request.instanceId,
		scenarioId: request.scenario.scenarioId,
		stopReason,
		transcript,
		...(request.consumerMetadata ? { consumerMetadata: request.consumerMetadata } : {}),
	});
	return {
		transcriptFile,
		artifactPaths: captureTranscript(request) ? [transcriptFile] : [],
	};
}

function finalizeLoopResult(options, context, payload, liveRunInvocation, request, transcript, artifactDir, stopReason, startedAt) {
	const needsTranscriptArtifact = captureTranscript(request) || typeof liveRunInvocation.consumer_evaluator_command_template === "string";
	const { transcriptFile, artifactPaths } = materializeTranscriptArtifact(
		request,
		transcript,
		artifactDir,
		stopReason,
		needsTranscriptArtifact,
	);
	const evaluation = transcriptFile
		? evaluateTranscript(options, context, payload, liveRunInvocation, request, transcriptFile, artifactPaths, startedAt)
		: null;
	return buildCompletedResult(request, transcript, startedAt, stopReason, evaluation, artifactPaths);
}

function evaluateTranscript(options, context, payload, liveRunInvocation, request, transcriptFile, artifactPaths, startedAt) {
	const evaluatorTemplate = liveRunInvocation.consumer_evaluator_command_template?.trim();
	if (!evaluatorTemplate) {
		return null;
	}
	if (HELPER_PATH_PATTERN.test(evaluatorTemplate)) {
		fail("live_run_invocation.consumer_evaluator_command_template must point at a consumer-owned evaluator command.");
	}
	const remainingMs = remainingTimeoutMs(startedAt, request.timeoutMs);
	if (remainingMs <= 0) {
		return { status: "skipped", summary: "Evaluator skipped because the live-run timeout budget was exhausted." };
	}
	const evaluationOutputFile = join(dirname(transcriptFile), "evaluation.json");
	const command = renderTemplate(evaluatorTemplate, buildReplacements(payload, context, options, {
		transcript_file: shellEscape(transcriptFile),
		evaluation_output_file: shellEscape(evaluationOutputFile),
	}));
	const commandResult = executeCommand(command, context.repoRoot, remainingMs);
	if (commandResult.timedOut) {
		return { status: "failed", summary: "Evaluator timed out before producing a result." };
	}
	if (commandResult.detail) {
		return { status: "failed", summary: `Evaluator command failed: ${commandResult.detail}` };
	}
	const evaluation = readJsonFile(evaluationOutputFile, "evaluation output file");
	artifactPaths.push(evaluationOutputFile);
	return evaluation;
}

function executeScriptedLoop(options, context, payload, liveRunInvocation, request, singleTurnTemplate, simulatorSpec, startedAt, artifactDir) {
	const transcript = [];
	const turnCount = Math.min(request.scenario.maxTurns, simulatorSpec.scriptedTurns.length);
	for (let index = 0; index < turnCount; index += 1) {
		const turnOutcome = runScriptedTurn(
			options,
			context,
			payload,
			request,
			singleTurnTemplate,
			transcript,
			simulatorSpec.scriptedTurns[index],
			index + 1,
			artifactDir,
			startedAt,
		);
		if (turnOutcome.completedResult) {
			return turnOutcome.completedResult;
		}
		transcript.push(turnOutcome.transcriptEntry);
	}
	const stopReason = simulatorSpec.scriptedTurns.length > request.scenario.maxTurns ? "turn_limit_reached" : "scripted_turns_exhausted";
	return finalizeLoopResult(options, context, payload, liveRunInvocation, request, transcript, artifactDir, stopReason, startedAt);
}

function executePersonaPromptLoop(options, context, payload, liveRunInvocation, request, singleTurnTemplate, simulatorSpec, startedAt, artifactDir) {
	const transcript = [];
	for (let turnIndex = 1; turnIndex <= request.scenario.maxTurns; turnIndex += 1) {
		let simulatorTurn = null;
		if (turnIndex <= simulatorSpec.seedTurns.length) {
			simulatorTurn = simulatorSpec.seedTurns[turnIndex - 1];
		} else {
			const simulatorOutcome = runSimulatorPersonaTurn(
				options,
				context,
				payload,
				request,
				liveRunInvocation,
				simulatorSpec,
				transcript,
				turnIndex,
				artifactDir,
				startedAt,
			);
			if (simulatorOutcome.completedResult) {
				return simulatorOutcome.completedResult;
			}
			if (simulatorOutcome.stopReason) {
				return finalizeLoopResult(
					options,
					context,
					payload,
					liveRunInvocation,
					request,
					transcript,
					artifactDir,
					simulatorOutcome.stopReason,
					startedAt,
				);
			}
			simulatorTurn = simulatorOutcome.simulatorTurn;
		}
		const turnOutcome = runScriptedTurn(
			options,
			context,
			payload,
			request,
			singleTurnTemplate,
			transcript,
			simulatorTurn,
			turnIndex,
			artifactDir,
			startedAt,
		);
		if (turnOutcome.completedResult) {
			return turnOutcome.completedResult;
		}
		transcript.push(turnOutcome.transcriptEntry);
	}
	return finalizeLoopResult(options, context, payload, liveRunInvocation, request, transcript, artifactDir, "turn_limit_reached", startedAt);
}

function executeMultiTurnRun(options, context, payload, liveRunInvocation, request) {
	const singleTurnTemplate = resolveSingleTurnTemplate(liveRunInvocation);
	const simulatorSpec = normalizeSimulatorSpec(request.scenario);
	const startedAt = Date.now();
	const artifactDir = `${context.outputFile}.d`;
	mkdirSync(dirname(context.outputFile), { recursive: true });
	mkdirSync(artifactDir, { recursive: true });
	if (simulatorSpec.kind === "persona_prompt") {
		return executePersonaPromptLoop(options, context, payload, liveRunInvocation, request, singleTurnTemplate, simulatorSpec, startedAt, artifactDir);
	}
	return executeScriptedLoop(options, context, payload, liveRunInvocation, request, singleTurnTemplate, simulatorSpec, startedAt, artifactDir);
}

function executeLiveRunCommand(options, context, payload, liveRunInvocation, request) {
	mkdirSync(dirname(context.outputFile), { recursive: true });
	if (hasMultiTurnLoop(liveRunInvocation)) {
		writeJsonFile(context.outputFile, executeMultiTurnRun(options, context, payload, liveRunInvocation, request));
		return;
	}
	const consumerCommandTemplate = resolveConsumerCommand(liveRunInvocation);
	const command = renderTemplate(consumerCommandTemplate, buildReplacements(payload, context, options));
	const result = executeCommand(command, context.repoRoot);
	if (result.detail) {
		fail(`live run command failed: ${result.detail}`);
	}
}

function readAndValidateOutput(context, request) {
	if (!existsSync(context.outputFile)) {
		fail(`live run command did not produce output_file: ${context.outputFile}`);
	}
	const output = readJsonFile(context.outputFile, "result file");
	validateResultPacket(output, request);
}

export function main(argv = process.argv.slice(2)) {
	const options = parseArgs(argv);
	const context = buildInvocationContext(options);
	const { payload, liveRunInvocation, request } = loadInvocationState(options, context);
	executeLiveRunCommand(options, context, payload, liveRunInvocation, request);
	readAndValidateOutput(context, request);
}

const entryHref = process.argv[1] ? pathToFileURL(resolve(process.argv[1])).href : "";
if (import.meta.url === entryHref) {
	main();
}
