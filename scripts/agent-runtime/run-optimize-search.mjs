import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import process from "node:process";
import { pathToFileURL } from "node:url";

import { readActiveRunDir } from "./active-run.mjs";
import {
	OPTIMIZE_SEARCH_INPUTS_SCHEMA,
	OPTIMIZE_SEARCH_RESULT_SCHEMA,
} from "./contract-versions.mjs";
import { runOptimizeSearch as runOptimizeSearchCore } from "./optimize-search-core.mjs";

function usage(exitCode = 0) {
	const text = [
		"Usage:",
		"  node ./scripts/agent-runtime/run-optimize-search.mjs --input <file> [--output <file>] [--json]",
		"",
		"Output packet:",
		`  schemaVersion: ${OPTIMIZE_SEARCH_RESULT_SCHEMA}`,
	].join("\n");
	const out = exitCode === 0 ? process.stdout : process.stderr;
	out.write(`${text}\n`);
	process.exit(exitCode);
}

function fail(message) {
	throw new Error(message);
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
		input: null,
		output: null,
		json: false,
	};
	for (let index = 0; index < argv.length; index += 1) {
		const arg = argv[index];
		if (arg === "-h" || arg === "--help") {
			usage(0);
		}
		if (arg === "--json") {
			options.json = true;
			continue;
		}
		const field = {
			"--input": "input",
			"--output": "output",
		}[arg];
		if (!field) {
			fail(`Unknown argument: ${arg}`);
		}
		options[field] = readRequiredValue(argv, index + 1, arg);
		index += 1;
	}
	return options;
}

function resolveCommandOptions(options, { env = process.env } = {}) {
	const activeRunDir = readActiveRunDir({ env });
	const resolved = {
		...options,
		input: options.input ? resolve(options.input) : null,
		output: options.output ? resolve(options.output) : null,
	};
	if (!resolved.input && activeRunDir) {
		resolved.input = join(activeRunDir, "optimize-search-input.json");
	}
	if (!resolved.input) {
		fail("--input is required");
	}
	if (!resolved.output && activeRunDir) {
		resolved.output = join(activeRunDir, "optimize-search-result.json");
	}
	return resolved;
}

function readJsonFile(path, label) {
	const resolved = resolve(path);
	if (!existsSync(resolved)) {
		fail(`${label} not found: ${resolved}`);
	}
	try {
		const packet = JSON.parse(readFileSync(resolved, "utf-8"));
		if (!packet || typeof packet !== "object" || Array.isArray(packet)) {
			fail(`${label} must be a JSON object`);
		}
		return { path: resolved, packet };
	} catch (error) {
		fail(`Failed to read JSON from ${resolved}: ${error.message}`);
	}
}

function parseInputFile(path) {
	const parsed = readJsonFile(path, "search input");
	if (parsed.packet.schemaVersion !== OPTIMIZE_SEARCH_INPUTS_SCHEMA) {
		fail(`search input must use schemaVersion ${OPTIMIZE_SEARCH_INPUTS_SCHEMA}`);
	}
	return parsed;
}

function writeText(path, value) {
	mkdirSync(dirname(path), { recursive: true });
	writeFileSync(path, value, "utf-8");
}

export function runOptimizeSearch(packet, options) {
	return runOptimizeSearchCore(packet, {
		...options,
		schemaVersion: OPTIMIZE_SEARCH_RESULT_SCHEMA,
	});
}

export function main(argv = process.argv.slice(2)) {
	try {
		const options = resolveCommandOptions(parseArgs(argv), { env: process.env });
		const input = parseInputFile(options.input);
		const result = runOptimizeSearch(input.packet, {
			inputFile: input.path,
			outputFile: options.output,
			now: new Date(),
			env: process.env,
		});
		const text = `${JSON.stringify(result, null, 2)}\n`;
		if (options.output) {
			writeText(options.output, text);
		}
		if (!options.output || options.json) {
			process.stdout.write(text);
		}
		if (result.status === "blocked") {
			process.exit(1);
		}
	} catch (error) {
		if (error instanceof Error) {
			process.stderr.write(`${error.message}\n`);
			process.exit(1);
		}
		throw error;
	}
}

const entryHref = process.argv[1] ? pathToFileURL(resolve(process.argv[1])).href : "";
if (import.meta.url === entryHref) {
	main();
}
