import { readFileSync, rmSync, writeFileSync } from "node:fs";
import process from "node:process";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";

function fail(message) {
	process.stderr.write(`${message}\n`);
	process.exit(1);
}

function usage(exitCode = 0) {
	const text = [
		"Usage:",
		"  node ./scripts/agent-runtime/review-variant-json.mjs schema-json <schema-file>",
		"  node ./scripts/agent-runtime/review-variant-json.mjs normalize-claude-output <raw-output-file> <output-file>",
	].join("\n");
	const out = exitCode === 0 ? process.stdout : process.stderr;
	out.write(`${text}\n`);
	process.exit(exitCode);
}

function schemaJson(schemaFile) {
	const parsed = JSON.parse(readFileSync(resolve(schemaFile), "utf-8"));
	process.stdout.write(JSON.stringify(parsed));
}

function normalizeClaudeOutput(rawOutputFile, outputFile) {
	const rawPath = resolve(rawOutputFile);
	const outputPath = resolve(outputFile);
	const payload = JSON.parse(readFileSync(rawPath, "utf-8"));
	if (payload?.is_error) {
		fail(payload.result || "claude -p returned is_error=true");
	}
	const structured = payload?.structured_output;
	const normalized = structured && typeof structured === "object" && !Array.isArray(structured)
		? structured
		: payload;
	writeFileSync(outputPath, `${JSON.stringify(normalized, null, 2)}\n`, "utf-8");
	rmSync(rawPath, { force: true });
}

export function main(argv = process.argv.slice(2)) {
	const [command, ...rest] = argv;
	if (!command || command === "-h" || command === "--help") {
		usage(0);
	}
	if (command === "schema-json") {
		if (rest.length !== 1) {
			usage(1);
		}
		schemaJson(rest[0]);
		return;
	}
	if (command === "normalize-claude-output") {
		if (rest.length !== 2) {
			usage(1);
		}
		normalizeClaudeOutput(rest[0], rest[1]);
		return;
	}
	fail(`Unknown command: ${command}`);
}

const entryHref = process.argv[1] ? pathToFileURL(resolve(process.argv[1])).href : "";
if (import.meta.url === entryHref) {
	main();
}
