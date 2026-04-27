import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import process from "node:process";
import { pathToFileURL } from "node:url";

import { SCENARIO_PROPOSAL_INPUTS_SCHEMA } from "./contract-versions.mjs";
import { generateScenarioProposals } from "./scenario-proposals.mjs";
import { writeTextOutput } from "./output-files.mjs";

export { SCENARIO_PROPOSAL_INPUTS_SCHEMA } from "./contract-versions.mjs";

function usage(exitCode = 0) {
	const text = [
		"Usage:",
		"  node ./scripts/agent-runtime/generate-scenario-proposals.mjs --input <file> [--output <file>]",
		"",
		"Input packet:",
		`  schemaVersion: ${SCENARIO_PROPOSAL_INPUTS_SCHEMA}`,
		"  proposalCandidates: [...]",
		"  existingScenarioRegistry: [...]",
		"  scenarioCoverage: [...]",
	].join("\n");
	const out = exitCode === 0 ? process.stdout : process.stderr;
	out.write(`${text}\n`);
	process.exit(exitCode);
}

function parseArgs(argv) {
	let inputPath = "";
	let outputPath = "";
	for (let index = 0; index < argv.length; index += 1) {
		const arg = argv[index];
		if (arg === "-h" || arg === "--help") {
			usage(0);
		}
		if (arg === "--input") {
			inputPath = argv[index + 1] || "";
			index += 1;
			continue;
		}
		if (arg === "--output") {
			outputPath = argv[index + 1] || "";
			index += 1;
			continue;
		}
		throw new Error(`Unknown argument: ${arg}`);
	}
	if (!inputPath) {
		throw new Error("--input is required");
	}
	return { inputPath, outputPath };
}

function parseJsonFile(path) {
	try {
		return JSON.parse(readFileSync(path, "utf-8"));
	} catch (error) {
		throw new Error(`Failed to read JSON from ${path}: ${error.message}`);
	}
}

function assertArray(value, field) {
	if (value === undefined) {
		return [];
	}
	if (!Array.isArray(value)) {
		throw new Error(`${field} must be an array`);
	}
	return value;
}

function readScenarioKeys(existingScenarioRegistry) {
	return assertArray(existingScenarioRegistry, "existingScenarioRegistry")
		.map((entry, index) => {
			if (!entry || typeof entry !== "object") {
				throw new Error(`existingScenarioRegistry[${index}] must be an object`);
			}
			const key = String(entry.scenarioKey || "").trim();
			if (!key) {
				throw new Error(`existingScenarioRegistry[${index}].scenarioKey must be a non-empty string`);
			}
			return key;
		});
}

function readScenarioCoverage(scenarioCoverage) {
	return new Map(
		assertArray(scenarioCoverage, "scenarioCoverage").map((entry, index) => {
			if (!entry || typeof entry !== "object") {
				throw new Error(`scenarioCoverage[${index}] must be an object`);
			}
			const scenarioKey = String(entry.scenarioKey || "").trim();
			if (!scenarioKey) {
				throw new Error(`scenarioCoverage[${index}].scenarioKey must be a non-empty string`);
			}
			const recentResultCount = Number(entry.recentResultCount ?? 0);
			if (!Number.isFinite(recentResultCount) || recentResultCount < 0) {
				throw new Error(`scenarioCoverage[${index}].recentResultCount must be a non-negative number`);
			}
			return [scenarioKey, recentResultCount];
		}),
	);
}

function parseNow(value) {
	if (value === undefined) {
		return new Date();
	}
	const now = new Date(value);
	if (Number.isNaN(now.getTime())) {
		throw new Error("now must be a valid ISO timestamp");
	}
	return now;
}

export function buildScenarioProposalPacket(input) {
	if (input.schemaVersion !== SCENARIO_PROPOSAL_INPUTS_SCHEMA) {
		throw new Error(`schemaVersion must be ${SCENARIO_PROPOSAL_INPUTS_SCHEMA}`);
	}
	const proposalCandidates = assertArray(input.proposalCandidates, "proposalCandidates");
	const families = assertArray(input.families, "families");
	return generateScenarioProposals({
		proposalCandidates,
		existingScenarioKeys: readScenarioKeys(input.existingScenarioRegistry),
		recentCoverage: readScenarioCoverage(input.scenarioCoverage),
		families,
		windowDays: input.windowDays,
		now: parseNow(input.now),
	});
}

export function main(argv = process.argv.slice(2)) {
	try {
		const { inputPath, outputPath } = parseArgs(argv);
		const input = parseJsonFile(inputPath);
		const packet = buildScenarioProposalPacket(input);
		const text = `${JSON.stringify(packet, null, 2)}\n`;
		if (outputPath) {
			writeTextOutput(outputPath, text);
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
