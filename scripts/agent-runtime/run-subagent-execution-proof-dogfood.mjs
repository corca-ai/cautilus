#!/usr/bin/env node
import { spawnSync } from "node:child_process";
import process from "node:process";
import { pathToFileURL } from "node:url";

const DEFAULT_COMMANDS = [
	{
		id: "codex",
		command: "npm",
		args: ["run", "dogfood:subagent-execution-proof:codex"],
	},
	{
		id: "claude",
		command: "npm",
		args: ["run", "dogfood:subagent-execution-proof:claude"],
	},
];

function commandsFromEnv() {
	if (!process.env.CAUTILUS_SUBAGENT_DOGFOOD_COMMANDS_JSON) {
		return DEFAULT_COMMANDS;
	}
	const parsed = JSON.parse(process.env.CAUTILUS_SUBAGENT_DOGFOOD_COMMANDS_JSON);
	if (!Array.isArray(parsed) || parsed.length === 0) {
		throw new Error("CAUTILUS_SUBAGENT_DOGFOOD_COMMANDS_JSON must be a non-empty array");
	}
	return parsed.map((entry, index) => ({
		id: stringField(entry.id, `commands[${index}].id`),
		command: stringField(entry.command, `commands[${index}].command`),
		args: arrayField(entry.args, `commands[${index}].args`),
	}));
}

function stringField(value, field) {
	if (typeof value !== "string" || !value.trim()) {
		throw new Error(`${field} must be a non-empty string`);
	}
	return value;
}

function arrayField(value, field) {
	if (!Array.isArray(value) || value.some((item) => typeof item !== "string")) {
		throw new Error(`${field} must be an array of strings`);
	}
	return value;
}

export function runSubagentExecutionProofDogfood(commands = DEFAULT_COMMANDS, options = {}) {
	const results = [];
	for (const entry of commands) {
		process.stderr.write(`subagent execution proof ${entry.id} start\n`);
		const result = spawnSync(entry.command, entry.args, {
			cwd: options.cwd ?? process.cwd(),
			env: options.env ?? process.env,
			stdio: options.stdio ?? "inherit",
		});
		const status = result.status ?? 1;
		results.push({ id: entry.id, status });
		process.stderr.write(`subagent execution proof ${entry.id} ${status === 0 ? "passed" : `failed status=${status}`}\n`);
	}
	const failed = results.filter((result) => result.status !== 0);
	process.stderr.write(`subagent execution proof summary: ${results.length - failed.length}/${results.length} passed\n`);
	return failed.length === 0 ? 0 : 1;
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
	try {
		process.exitCode = runSubagentExecutionProofDogfood(commandsFromEnv());
	} catch (error) {
		process.stderr.write(`${error.message}\n`);
		process.exit(1);
	}
}
