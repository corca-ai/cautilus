import { readFileSync, rmSync } from "node:fs";
import process from "node:process";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { writeTextOutput } from "./output-files.mjs";

function fail(message) {
	process.stderr.write(`${message}\n`);
	process.exit(1);
}

function usage(exitCode = 0) {
	const text = [
		"Usage:",
		"  node ./scripts/agent-runtime/review-variant-json.mjs schema-json <schema-file>",
		"  node ./scripts/agent-runtime/review-variant-json.mjs normalize-codex-schema <schema-file> <output-file>",
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

function isObjectSchema(value) {
	return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function sameSchema(left, right) {
	return JSON.stringify(left) === JSON.stringify(right);
}

function canMergeSchemaDefinitions(existing, next) {
	return isObjectSchema(existing) && isObjectSchema(next) && existing.type === next.type;
}

function mergeEnumValues(existing = [], next = []) {
	return Array.from(new Set([...existing, ...next]));
}

function mergeNestedItems(existing, next, merged) {
	if (isObjectSchema(existing.items) && isObjectSchema(next.items)) {
		merged.items = mergeSchemaDefinitions(existing.items, next.items);
	}
}

function mergeSchemaDefinitions(existing, next) {
	if (!existing) {
		return next;
	}
	if (!next) {
		return existing;
	}
	if (sameSchema(existing, next)) {
		return existing;
	}
	if (!canMergeSchemaDefinitions(existing, next)) {
		return existing;
	}
	const merged = {
		...existing,
		...next,
	};
	if (Array.isArray(existing.enum) || Array.isArray(next.enum)) {
		merged.enum = mergeEnumValues(existing.enum, next.enum);
	}
	if (typeof existing.minLength === "number" && typeof next.minLength === "number") {
		merged.minLength = Math.min(existing.minLength, next.minLength);
	}
	mergeNestedItems(existing, next, merged);
	return merged;
}

function normalizeOptionalCodexProperty(definition) {
	if (!isObjectSchema(definition)) {
		return definition;
	}
	if (definition.type === "string") {
		const normalized = { ...definition };
		delete normalized.minLength;
		if (Array.isArray(normalized.enum)) {
			normalized.enum = Array.from(new Set([...normalized.enum, ""]));
		}
		return normalized;
	}
	return definition;
}

function rootKeywordForSchema(schema) {
	if (Array.isArray(schema.oneOf)) {
		return "oneOf";
	}
	if (Array.isArray(schema.anyOf)) {
		return "anyOf";
	}
	return null;
}

function branchSchemasForCodex(schema) {
	const rootKeyword = rootKeywordForSchema(schema);
	if (!rootKeyword) {
		return [];
	}
	const branches = schema[rootKeyword];
	if (!branches.every((branch) => isObjectSchema(branch) && branch.type === "object")) {
		return [];
	}
	return branches;
}

function countRequiredFields(branches) {
	const requiredCounts = new Map();
	for (const branch of branches) {
		for (const key of new Set(Array.isArray(branch.required) ? branch.required : [])) {
			requiredCounts.set(key, (requiredCounts.get(key) ?? 0) + 1);
		}
	}
	return requiredCounts;
}

function mergePropertiesInto(target, properties) {
	if (!isObjectSchema(properties)) {
		return;
	}
	for (const [key, value] of Object.entries(properties)) {
		target[key] = mergeSchemaDefinitions(target[key], value);
	}
}

function normalizeOptionalPropertiesForCodex(properties, requiredCounts, branchCount) {
	for (const [key, value] of Object.entries(properties)) {
		if ((requiredCounts.get(key) ?? 0) !== branchCount) {
			properties[key] = normalizeOptionalCodexProperty(value);
		}
	}
}

function buildCodexObjectSchema(schema, properties) {
	const normalized = {
		type: "object",
		additionalProperties: false,
		properties,
		required: Object.keys(properties),
	};
	if (typeof schema.description === "string") {
		normalized.description = schema.description;
	}
	return normalized;
}

export function normalizeCodexSchema(schema) {
	if (!isObjectSchema(schema) || schema.type === "object") {
		return schema;
	}
	const branches = branchSchemasForCodex(schema);
	if (branches.length === 0) {
		return schema;
	}
	const mergedProperties = {};
	for (const branch of branches) {
		mergePropertiesInto(mergedProperties, branch.properties);
	}
	mergePropertiesInto(mergedProperties, schema.properties);
	normalizeOptionalPropertiesForCodex(
		mergedProperties,
		countRequiredFields(branches),
		branches.length,
	);
	return buildCodexObjectSchema(schema, mergedProperties);
}

function normalizeCodexSchemaFile(schemaFile, outputFile) {
	const inputPath = resolve(schemaFile);
	const outputPath = resolve(outputFile);
	const parsed = JSON.parse(readFileSync(inputPath, "utf-8"));
	const normalized = normalizeCodexSchema(parsed);
	writeTextOutput(outputPath, `${JSON.stringify(normalized, null, 2)}\n`);
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
	writeTextOutput(outputPath, `${JSON.stringify(normalized, null, 2)}\n`);
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
	if (command === "normalize-codex-schema") {
		if (rest.length !== 2) {
			usage(1);
		}
		normalizeCodexSchemaFile(rest[0], rest[1]);
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
