import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import process from "node:process";
import { pathToFileURL } from "node:url";

import { CHATBOT_NORMALIZATION_INPUTS_SCHEMA } from "./contract-versions.mjs";
import { normalizeChatbotProposalCandidates } from "./chatbot-proposal-candidates.mjs";

export { CHATBOT_NORMALIZATION_INPUTS_SCHEMA } from "./contract-versions.mjs";

function usage(exitCode = 0) {
	const text = [
		"Usage:",
		"  node ./scripts/agent-runtime/normalize-chatbot-proposals.mjs --input <file> [--output <file>]",
		"",
		"Input packet:",
		`  schemaVersion: ${CHATBOT_NORMALIZATION_INPUTS_SCHEMA}`,
		"  conversationSummaries: [...]",
		"  runSummaries: [...]",
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

export function buildChatbotProposalCandidates(input) {
	if (input.schemaVersion !== CHATBOT_NORMALIZATION_INPUTS_SCHEMA) {
		throw new Error(`schemaVersion must be ${CHATBOT_NORMALIZATION_INPUTS_SCHEMA}`);
	}
	return normalizeChatbotProposalCandidates({
		conversationSummaries: assertArray(input.conversationSummaries, "conversationSummaries"),
		runSummaries: assertArray(input.runSummaries, "runSummaries"),
	});
}

export function main(argv = process.argv.slice(2)) {
	try {
		const { inputPath, outputPath } = parseArgs(argv);
		const input = parseJsonFile(inputPath);
		const candidates = buildChatbotProposalCandidates(input);
		const text = `${JSON.stringify(candidates, null, 2)}\n`;
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
