import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import process from "node:process";
import { pathToFileURL } from "node:url";

import { buildDeploymentEvidence } from "./deployment-evidence.mjs";
import { writeJsonOutput } from "./output-files.mjs";

function usage(exitCode = 0) {
	const text = [
		"Usage:",
		"  node ./scripts/agent-runtime/build-deployment-evidence.mjs --input <file> [--output <file>]",
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
	const options = { input: null, output: null };
	for (let index = 0; index < argv.length; index += 1) {
		const arg = argv[index];
		if (arg === "-h" || arg === "--help") {
			usage(0);
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
	if (!options.input) {
		fail("--input is required");
	}
	return options;
}

function readJson(path) {
	const resolved = resolve(path);
	if (!existsSync(resolved)) {
		fail(`input file not found: ${resolved}`);
	}
	return JSON.parse(readFileSync(resolved, "utf-8"));
}

function writeJson(path, value) {
	if (!path) {
		process.stdout.write(`${JSON.stringify(value, null, 2)}\n`);
		return;
	}
	writeJsonOutput(path, value);
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
	const options = parseArgs(process.argv.slice(2));
	const packet = buildDeploymentEvidence(readJson(options.input));
	writeJson(options.output, packet);
}
