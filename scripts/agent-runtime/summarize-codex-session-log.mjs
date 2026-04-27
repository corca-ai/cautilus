#!/usr/bin/env node
import process from "node:process";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";

import {
	findCodexSessionLog,
	summarizeCodexSessionLogFile,
} from "./codex-session-summary.mjs";
import { writeTextOutput } from "./output-files.mjs";

function parseArgs(argv) {
	const options = {
		input: null,
		sessionId: null,
		output: null,
	};
	for (let index = 0; index < argv.length; index += 1) {
		const arg = argv[index];
		switch (arg) {
			case "--input":
				options.input = requiredValue(argv, ++index, arg);
				break;
			case "--session-id":
				options.sessionId = requiredValue(argv, ++index, arg);
				break;
			case "--output":
				options.output = requiredValue(argv, ++index, arg);
				break;
			default:
				throw new Error(`unknown argument: ${arg}`);
		}
	}
	if ((options.input && options.sessionId) || (!options.input && !options.sessionId)) {
		throw new Error("usage: summarize-codex-session-log.mjs (--input <codex-jsonl> | --session-id <id>) [--output <summary.json>]");
	}
	return options;
}

function requiredValue(argv, index, option) {
	const value = argv[index];
	if (!value) {
		throw new Error(`missing value for ${option}`);
	}
	return value;
}

export function main(argv = process.argv.slice(2)) {
	const options = parseArgs(argv);
	const inputPath = options.input ? resolve(options.input) : findCodexSessionLog(options.sessionId);
	const summary = summarizeCodexSessionLogFile(inputPath, { sessionId: options.sessionId ?? null });
	const body = `${JSON.stringify(summary, null, 2)}\n`;
	if (options.output) {
		writeTextOutput(options.output, body);
		return;
	}
	process.stdout.write(body);
}

const entryHref = process.argv[1] ? pathToFileURL(resolve(process.argv[1])).href : "";
if (import.meta.url === entryHref) {
	try {
		main();
	} catch (error) {
		console.error(error.message);
		process.exitCode = 1;
	}
}
