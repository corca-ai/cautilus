import { existsSync, mkdirSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { spawnSync } from "node:child_process";
import process from "node:process";
import { pathToFileURL } from "node:url";

import { loadAdapter } from "../resolve_adapter.mjs";

const LIVE_RUN_REQUEST_SCHEMA = "cautilus.live_run_invocation_request.v1";
const LIVE_RUN_RESULT_SCHEMA = "cautilus.live_run_invocation_result.v1";
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

function validateScenarioPacket(scenario) {
	if (!scenario || typeof scenario !== "object" || Array.isArray(scenario)) {
		fail("request.scenario must be an object");
	}
	assertString(scenario.scenarioId, "request.scenario.scenarioId");
	assertString(scenario.name, "request.scenario.name");
	assertString(scenario.description, "request.scenario.description");
	assertPositiveInteger(scenario.maxTurns, "request.scenario.maxTurns");
	assertString(scenario.sideEffectsMode, "request.scenario.sideEffectsMode");
	if (!Array.isArray(scenario.simulatorTurns) || scenario.simulatorTurns.length === 0) {
		fail("request.scenario.simulatorTurns must be a non-empty list of strings");
	}
	for (const [index, turn] of scenario.simulatorTurns.entries()) {
		assertString(turn, `request.scenario.simulatorTurns[${index}]`);
	}
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

function executeLiveRunCommand(options, context, payload, liveRunInvocation) {
	const consumerCommandTemplate = resolveConsumerCommand(liveRunInvocation);
	const replacements = {
		repo_root: shellEscape(context.repoRoot),
		adapter_path: shellEscape(payload.path ?? context.adapterPath ?? ""),
		instance_id: shellEscape(options.instanceId),
		request_file: shellEscape(context.requestFile),
		output_file: shellEscape(context.outputFile),
	};
	const command = renderTemplate(consumerCommandTemplate, replacements);
	mkdirSync(dirname(context.outputFile), { recursive: true });
	const result = spawnSync("bash", ["-lc", command], {
		cwd: context.repoRoot,
		encoding: "utf-8",
	});
	if (result.status !== 0) {
		const detail = [result.stdout, result.stderr].filter(Boolean).join("\n").trim();
		fail(detail ? `live run command failed: ${detail}` : "live run command failed");
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
	executeLiveRunCommand(options, context, payload, liveRunInvocation);
	readAndValidateOutput(context, request);
}

const entryHref = process.argv[1] ? pathToFileURL(resolve(process.argv[1])).href : "";
if (import.meta.url === entryHref) {
	main();
}
