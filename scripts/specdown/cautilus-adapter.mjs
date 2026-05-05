#!/usr/bin/env node
import { spawnSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
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

function jsonExpectation(req) {
	const columns = req.columns ?? [];
	const cells = req.cells ?? [];
	return {
		args: parseArgs(cell(columns, cells, "args_json")),
		path: cell(columns, cells, "path"),
		jsonPath: cell(columns, cells, "json_path"),
		exists: cell(columns, cells, "exists"),
		equals: cell(columns, cells, "equals"),
		includes: cell(columns, cells, "includes"),
		minNumber: cell(columns, cells, "min_number"),
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

function readJSONFile(path) {
	if (!path) {
		throw new Error("path is required");
	}
	return JSON.parse(readFileSync(path, "utf-8"));
}

function parseJSONPath(path) {
	if (!path) {
		return [];
	}
	const result = [];
	for (const segment of path.split(".")) {
		const matcher = /([^.[\]]+)|\[(\d+)]/g;
		let match;
		while ((match = matcher.exec(segment)) !== null) {
			if (match[1]) {
				result.push(match[1]);
			} else {
				result.push(Number(match[2]));
			}
		}
	}
	return result;
}

function valueAtPath(root, path) {
	let current = root;
	for (const segment of parseJSONPath(path)) {
		if (current === null || current === undefined) {
			return { found: false, value: undefined };
		}
		if (typeof segment === "number") {
			if (!Array.isArray(current) || segment >= current.length) {
				return { found: false, value: undefined };
			}
			current = current[segment];
			continue;
		}
		if (typeof current !== "object" || !(segment in current)) {
			return { found: false, value: undefined };
		}
		current = current[segment];
	}
	return { found: true, value: current };
}

function printable(value) {
	if (typeof value === "string") return value;
	if (value === undefined) return "undefined";
	return JSON.stringify(value);
}

function verifyJSONValue(payload, expectation, label) {
	const { found, value } = valueAtPath(payload, expectation.jsonPath);
	const existsFailure = verifyJSONExists(found, expectation, label);
	if (existsFailure) return existsFailure;
	if (!found) {
		return failed("JSON path not found", expectation.jsonPath, "missing", label);
	}
	return verifyJSONComparisons(value, expectation, label);
}

function verifyJSONExists(found, expectation, label) {
	if (!expectation.exists) return null;
	const expected = expectation.exists === "yes";
	if (found === expected) return null;
	return failed("JSON path existence mismatch", expectation.exists, found ? "yes" : "no", label);
}

function verifyJSONComparisons(value, expectation, label) {
	const rendered = printable(value);
	if (expectation.equals && rendered !== expectation.equals) {
		return failed("JSON value mismatch", expectation.equals, rendered, label);
	}
	if (expectation.includes && !rendered.includes(expectation.includes)) {
		return failed("JSON value did not include expected text", expectation.includes, rendered, label);
	}
	return verifyJSONMinimum(value, expectation, label);
}

function verifyJSONMinimum(value, expectation, label) {
	if (!expectation.minNumber) return null;
	const actual = Number(value);
	const expected = Number(expectation.minNumber);
	if (Number.isFinite(actual) && actual >= expected) return null;
	return failed("JSON numeric minimum not met", expectation.minNumber, printable(value), label);
}

function handleJSONCommand(req) {
	const expectation = jsonExpectation(req);
	const label = `${expectation.args.join(" ")} ${expectation.jsonPath}`.trim();
	const result = spawnSync(cautilusCommand(), expectation.args, {
		cwd: process.cwd(),
		encoding: "utf-8",
		maxBuffer: 10 * 1024 * 1024,
	});
	const exitFailure = verifyExitCode(result, 0, label);
	if (exitFailure) return exitFailure;
	let payload;
	try {
		payload = JSON.parse(result.stdout);
	} catch (error) {
		return failed("Command stdout was not JSON", "valid JSON", result.stdout || error.message, label);
	}
	return verifyJSONValue(payload, expectation, label) ?? { type: "passed" };
}

function handleJSONFile(req) {
	const expectation = jsonExpectation(req);
	const label = `${expectation.path} ${expectation.jsonPath}`.trim();
	let payload;
	try {
		payload = readJSONFile(expectation.path);
	} catch (error) {
		return failed("Could not read JSON file", expectation.path, error.message, label);
	}
	return verifyJSONValue(payload, expectation, label) ?? { type: "passed" };
}

function handleAssert(req) {
	if (req.check === "cautilus-command") {
		return handleCommand(req);
	}
	if (req.check === "cautilus-json-command") {
		return handleJSONCommand(req);
	}
	if (req.check === "cautilus-json-file") {
		return handleJSONFile(req);
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
