import readline from "node:readline";
import process from "node:process";

import { collectSpecGraph, makeSourceGuardRow, validateSourceGuardRow } from "./spec-source-guard-lib.mjs";

const repoRoot = process.cwd();
let graphValidated = false;
let graphError = null;

function ensureSpecGraph() {
	if (graphValidated) {
		return;
	}
	try {
		collectSpecGraph(repoRoot);
	} catch (error) {
		graphError = error;
	}
	graphValidated = true;
}

function writeResponse(response) {
	process.stdout.write(`${JSON.stringify(response)}\n`);
}

const rl = readline.createInterface({
	input: process.stdin,
	crlfDelay: Infinity,
});

rl.on("line", (line) => {
	const request = JSON.parse(line);
	if (request.type !== "assert") {
		writeResponse({
			id: request.id,
			type: "failed",
			message: `unsupported request type: ${request.type}`,
			expected: "assert",
			actual: request.type ?? "empty",
		});
		return;
	}

	if (request.check !== "source_guard") {
		writeResponse({
			id: request.id,
			type: "failed",
			message: `unsupported check: ${request.check}`,
			expected: "source_guard",
			actual: request.check ?? "empty",
		});
		return;
	}

	ensureSpecGraph();
	if (graphError !== null) {
		writeResponse({
			id: request.id,
			type: "failed",
			message: graphError.message,
			expected: graphError.expected,
			actual: graphError.actual,
			label: "spec graph",
		});
		return;
	}

	try {
		const row = makeSourceGuardRow(request.columns ?? [], request.cells ?? []);
		validateSourceGuardRow(repoRoot, row);
		writeResponse({ id: request.id, type: "passed" });
	} catch (error) {
		writeResponse({
			id: request.id,
			type: "failed",
			message: error.message,
			expected: error.expected,
			actual: error.actual,
			label: `source_guard ${request.cells?.[0] ?? "<unknown>"}`,
		});
	}
});
