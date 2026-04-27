import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import process from "node:process";
import { pathToFileURL } from "node:url";

import { SCENARIO_PROPOSAL_INPUTS_SCHEMA } from "./generate-scenario-proposals.mjs";
import { writeTextOutput } from "./output-files.mjs";

function usage(exitCode = 0) {
	const text = [
		"Usage:",
		"  node ./scripts/agent-runtime/build-scenario-proposal-input.mjs --candidates <file> --registry <file> --coverage <file> [--family <name>] [--window-days <days>] [--now <iso>] [--output <file>]",
		"",
		"Output packet:",
		`  schemaVersion: ${SCENARIO_PROPOSAL_INPUTS_SCHEMA}`,
	].join("\n");
	const out = exitCode === 0 ? process.stdout : process.stderr;
	out.write(`${text}\n`);
	process.exit(exitCode);
}

function consumeValue(argv, index, arg) {
	const value = argv[index + 1] || "";
	if (!value) {
		throw new Error(`${arg} requires a value`);
	}
	return value;
}

function applyOption(result, arg, value) {
	const handlers = {
		"--candidates": () => {
			result.candidatesPath = value;
		},
		"--registry": () => {
			result.registryPath = value;
		},
		"--coverage": () => {
			result.coveragePath = value;
		},
		"--output": () => {
			result.outputPath = value;
		},
		"--family": () => {
			result.families.push(value);
		},
		"--window-days": () => {
			result.windowDays = value;
		},
		"--now": () => {
			result.now = value;
		},
	};
	const handler = handlers[arg];
	if (!handler) {
		throw new Error(`Unknown argument: ${arg}`);
	}
	handler();
}

function parseArgs(argv) {
	const result = {
		candidatesPath: "",
		registryPath: "",
		coveragePath: "",
		outputPath: "",
		families: [],
		windowDays: undefined,
		now: undefined,
	};
	for (let index = 0; index < argv.length; index += 1) {
		const arg = argv[index];
		if (arg === "-h" || arg === "--help") {
			usage(0);
		}
		const value = consumeValue(argv, index, arg);
		applyOption(result, arg, value);
		index += 1;
	}
	for (const [flag, value] of [
		["--candidates", result.candidatesPath],
		["--registry", result.registryPath],
		["--coverage", result.coveragePath],
	]) {
		if (!value) {
			throw new Error(`${flag} is required`);
		}
	}
	return result;
}

function parseJsonArray(path, field) {
	let parsed;
	try {
		parsed = JSON.parse(readFileSync(path, "utf-8"));
	} catch (error) {
		throw new Error(`Failed to read JSON from ${path}: ${error.message}`);
	}
	if (!Array.isArray(parsed)) {
		throw new Error(`${field} must be a JSON array`);
	}
	return parsed;
}

function parseWindowDays(value) {
	if (value === undefined) {
		return 14;
	}
	const parsed = Number(value);
	if (!Number.isInteger(parsed) || parsed <= 0) {
		throw new Error("--window-days must be a positive integer");
	}
	return parsed;
}

function parseNow(value) {
	if (value === undefined) {
		return undefined;
	}
	const now = new Date(value);
	if (Number.isNaN(now.getTime())) {
		throw new Error("--now must be a valid ISO timestamp");
	}
	return now.toISOString();
}

export function buildScenarioProposalInput({
	proposalCandidates,
	existingScenarioRegistry,
	scenarioCoverage,
	families = [],
	windowDays = 14,
	now,
}) {
	if (!Array.isArray(proposalCandidates)) {
		throw new Error("proposalCandidates must be an array");
	}
	if (!Array.isArray(existingScenarioRegistry)) {
		throw new Error("existingScenarioRegistry must be an array");
	}
	if (!Array.isArray(scenarioCoverage)) {
		throw new Error("scenarioCoverage must be an array");
	}
	if (!Array.isArray(families)) {
		throw new Error("families must be an array");
	}
	return {
		schemaVersion: SCENARIO_PROPOSAL_INPUTS_SCHEMA,
		windowDays,
		families,
		proposalCandidates,
		existingScenarioRegistry,
		scenarioCoverage,
		...(now ? { now } : {}),
	};
}

export function main(argv = process.argv.slice(2)) {
	try {
		const args = parseArgs(argv);
		const packet = buildScenarioProposalInput({
			proposalCandidates: parseJsonArray(args.candidatesPath, "proposalCandidates"),
			existingScenarioRegistry: parseJsonArray(args.registryPath, "existingScenarioRegistry"),
			scenarioCoverage: parseJsonArray(args.coveragePath, "scenarioCoverage"),
			families: args.families.filter(Boolean),
			windowDays: parseWindowDays(args.windowDays),
			now: parseNow(args.now),
		});
		const text = `${JSON.stringify(packet, null, 2)}\n`;
		if (args.outputPath) {
			writeTextOutput(args.outputPath, text);
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
