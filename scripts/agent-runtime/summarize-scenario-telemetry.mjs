import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import process from "node:process";
import { pathToFileURL } from "node:url";

import { SCENARIO_RESULTS_SCHEMA } from "./contract-versions.mjs";
import { SCENARIO_HISTORY_SCHEMA } from "./scenario-history.mjs";
import { normalizeScenarioResultsPacket } from "./scenario-results.mjs";
import {
	summarizeScenarioTelemetryEntries,
	summarizeScenarioTelemetryFromHistory,
} from "./scenario-result-telemetry.mjs";

function usage(exitCode = 0) {
	const text = [
		"Usage:",
		"  node ./scripts/agent-runtime/summarize-scenario-telemetry.mjs --results <file> [--output <file>]",
		"  node ./scripts/agent-runtime/summarize-scenario-telemetry.mjs --history <file> [--output <file>]",
		"",
		"Input forms:",
		`  --results: ${SCENARIO_RESULTS_SCHEMA} packet`,
		`  --history: ${SCENARIO_HISTORY_SCHEMA} packet`,
	].join("\n");
	const out = exitCode === 0 ? process.stdout : process.stderr;
	out.write(`${text}\n`);
	process.exit(exitCode);
}

function readOptionValue(argv, index, option) {
	const value = argv[index + 1] || "";
	if (!value) {
		throw new Error(`${option} requires a value`);
	}
	return value;
}

function parseArgs(argv) {
	let resultsPath = "";
	let historyPath = "";
	let outputPath = "";
	for (let index = 0; index < argv.length; index += 1) {
		const arg = argv[index];
		if (arg === "-h" || arg === "--help") {
			usage(0);
		}
		if (arg === "--results") {
			resultsPath = readOptionValue(argv, index, arg);
			index += 1;
			continue;
		}
		if (arg === "--history") {
			historyPath = readOptionValue(argv, index, arg);
			index += 1;
			continue;
		}
		if (arg === "--output") {
			outputPath = readOptionValue(argv, index, arg);
			index += 1;
			continue;
		}
		throw new Error(`Unknown argument: ${arg}`);
	}
	if ((resultsPath && historyPath) || (!resultsPath && !historyPath)) {
		throw new Error("Use exactly one of --results or --history");
	}
	return { resultsPath, historyPath, outputPath };
}

function parseJsonFile(path) {
	try {
		return JSON.parse(readFileSync(path, "utf-8"));
	} catch (error) {
		throw new Error(`Failed to read JSON from ${path}: ${error.message}`);
	}
}

export function buildScenarioTelemetrySummary({ resultsInput, historyInput }) {
	if (resultsInput !== undefined) {
		return summarizeScenarioTelemetryEntries(normalizeScenarioResultsPacket(resultsInput).results);
	}
	if (historyInput?.schemaVersion !== SCENARIO_HISTORY_SCHEMA) {
		throw new Error(`history input must use schemaVersion ${SCENARIO_HISTORY_SCHEMA}`);
	}
	return summarizeScenarioTelemetryFromHistory(historyInput);
}

export function main(argv = process.argv.slice(2)) {
	try {
		const { resultsPath, historyPath, outputPath } = parseArgs(argv);
		const packet = buildScenarioTelemetrySummary({
			...(resultsPath ? { resultsInput: parseJsonFile(resultsPath) } : {}),
			...(historyPath ? { historyInput: parseJsonFile(historyPath) } : {}),
		});
		const text = `${JSON.stringify(packet, null, 2)}\n`;
		if (outputPath) {
			writeFileSync(outputPath, text, "utf-8");
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
