import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import process from "node:process";
import { pathToFileURL } from "node:url";

import { prepareDeploymentEvidenceInput } from "./deployment-evidence.mjs";

function usage(exitCode = 0) {
	const text = [
		"Usage:",
		"  node ./scripts/agent-runtime/prepare-deployment-evidence-input.mjs --surface <chatbot|skill|workflow> --runtime <name> --source-kind <skill_evaluation_summary|scenario_results> --input <file> [--pass-status <status>] [--output <file>]",
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
		surface: null,
		runtime: null,
		sourceKind: null,
		input: null,
		output: null,
		passStatuses: [],
	};
	for (let index = 0; index < argv.length; index += 1) {
		const arg = argv[index];
		if (arg === "-h" || arg === "--help") {
			usage(0);
		}
		if (arg === "--pass-status") {
			options.passStatuses.push(readRequiredValue(argv, index + 1, arg));
			index += 1;
			continue;
		}
		const field = {
			"--surface": "surface",
			"--runtime": "runtime",
			"--source-kind": "sourceKind",
			"--input": "input",
			"--output": "output",
		}[arg];
		if (!field) {
			fail(`Unknown argument: ${arg}`);
		}
		options[field] = readRequiredValue(argv, index + 1, arg);
		index += 1;
	}
	if (!options.surface || !options.runtime || !options.sourceKind || !options.input) {
		fail("--surface, --runtime, --source-kind, and --input are required");
	}
	return options;
}

function readJson(path) {
	const resolved = resolve(path);
	if (!existsSync(resolved)) {
		fail(`input file not found: ${resolved}`);
	}
	return {
		path: resolved,
		packet: JSON.parse(readFileSync(resolved, "utf-8")),
	};
}

function writeJson(path, value) {
	if (!path) {
		process.stdout.write(`${JSON.stringify(value, null, 2)}\n`);
		return;
	}
	writeFileSync(resolve(path), `${JSON.stringify(value, null, 2)}\n`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
	const options = parseArgs(process.argv.slice(2));
	const input = readJson(options.input);
	const packet = prepareDeploymentEvidenceInput({
		surface: options.surface,
		runtime: options.runtime,
		sourceKind: options.sourceKind,
		packet: input.packet,
		sourcePath: input.path,
		passStatuses: options.passStatuses.length > 0 ? options.passStatuses : null,
	});
	writeJson(options.output, packet);
}
