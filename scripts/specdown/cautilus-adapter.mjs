#!/usr/bin/env node
import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import { createInterface } from "node:readline";

function cell(columns, cells, name) {
	const index = columns.indexOf(name);
	return index === -1 ? "" : cells[index];
}

function parseArgs(value) {
	if (!value) {
		return [];
	}
	try {
		const parsed = JSON.parse(value);
		if (!Array.isArray(parsed) || parsed.some((item) => typeof item !== "string")) {
			throw new Error("args_json must be a JSON array of strings");
		}
		return parsed;
	} catch (error) {
		throw new Error(`Invalid args_json: ${error.message}`);
	}
}

function failed(message, expected, actual, label) {
	return {
		type: "failed",
		message,
		expected,
		actual,
		label,
	};
}

function verifyExitCode(result, expectedExitCode, label) {
	const actualExitCode = result.status ?? 1;
	if (actualExitCode !== expectedExitCode) {
		return failed("Unexpected exit code", String(expectedExitCode), String(actualExitCode), label);
	}
	return null;
}

function verifyIncludes(actual, expected, streamName, label) {
	if (!expected || actual.includes(expected)) {
		return null;
	}
	return failed(`${streamName} did not include expected text`, expected, actual, label);
}

function commandExpectation(req) {
	const columns = req.columns ?? [];
	const cells = req.cells ?? [];
	return {
		args: parseArgs(cell(columns, cells, "args_json")),
		expectedExitCode: Number(cell(columns, cells, "exit_code") || "0"),
		stdoutIncludes: cell(columns, cells, "stdout_includes"),
		stderrIncludes: cell(columns, cells, "stderr_includes"),
	};
}

function cautilusCommand() {
	if (process.env.CAUTILUS_BIN) {
		return process.env.CAUTILUS_BIN;
	}
	if (existsSync("./bin/cautilus")) {
		return "./bin/cautilus";
	}
	return process.platform === "win32" ? "cautilus.exe" : "cautilus";
}

function handleCommand(req) {
	const { args, expectedExitCode, stdoutIncludes, stderrIncludes } = commandExpectation(req);
	const label = args.join(" ");
	const result = spawnSync(cautilusCommand(), args, {
		cwd: process.cwd(),
		encoding: "utf-8",
		maxBuffer: 10 * 1024 * 1024,
	});
	const failure =
		verifyExitCode(result, expectedExitCode, label) ??
		verifyIncludes(result.stdout, stdoutIncludes, "stdout", label) ??
		verifyIncludes(result.stderr, stderrIncludes, "stderr", label);
	if (failure) return failure;
	return { type: "passed" };
}

function handleAssert(req) {
	if (req.check === "cautilus-command") {
		return handleCommand(req);
	}
	return {
		type: "failed",
		message: `Unsupported Cautilus check: ${req.check}`,
	};
}

const rl = createInterface({ input: process.stdin });
rl.on("line", (line) => {
	try {
		const req = JSON.parse(line);
		if (req.type === "assert") {
			process.stdout.write(`${JSON.stringify({ id: req.id, ...handleAssert(req) })}\n`);
			return;
		}
		process.stdout.write(`${JSON.stringify({ id: req.id, error: `Unsupported request type: ${req.type}` })}\n`);
	} catch (error) {
		process.stdout.write(`${JSON.stringify({ id: 0, error: error.message })}\n`);
	}
});
