import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import test from "node:test";

import { buildScenarioProposalInput } from "./build-scenario-proposal-input.mjs";
import { buildScenarioProposalPacket } from "./generate-scenario-proposals.mjs";

const FIXTURE_ROOT = join(process.cwd(), "fixtures", "scenario-proposals");

function readJson(name) {
	return JSON.parse(readFileSync(join(FIXTURE_ROOT, name), "utf-8"));
}

function validateAgainstSchema(schema, value, path = "root") {
	if (schema.type === "object") {
		assert.equal(typeof value, "object", `${path} must be an object`);
		assert.notEqual(value, null, `${path} must not be null`);
		for (const key of schema.required || []) {
			assert.ok(key in value, `${path}.${key} must exist`);
		}
		for (const [key, propertySchema] of Object.entries(schema.properties || {})) {
			if (key in value) {
				validateAgainstSchema(propertySchema, value[key], `${path}.${key}`);
			}
		}
		return;
	}
	if (schema.type === "array") {
		assert.ok(Array.isArray(value), `${path} must be an array`);
		if (schema.minItems !== undefined) {
			assert.ok(value.length >= schema.minItems, `${path} must contain at least ${schema.minItems} item(s)`);
		}
		for (const [index, item] of value.entries()) {
			validateAgainstSchema(schema.items, item, `${path}[${index}]`);
		}
		return;
	}
	if (schema.type === "string") {
		assert.equal(typeof value, "string", `${path} must be a string`);
		if (schema.const !== undefined) {
			assert.equal(value, schema.const, `${path} must equal ${schema.const}`);
		}
		if (schema.enum) {
			assert.ok(schema.enum.includes(value), `${path} must be one of ${schema.enum.join(", ")}`);
		}
		return;
	}
	if (schema.type === "integer") {
		assert.equal(typeof value, "number", `${path} must be a number`);
		assert.ok(Number.isInteger(value), `${path} must be an integer`);
		if (schema.minimum !== undefined) {
			assert.ok(value >= schema.minimum, `${path} must be >= ${schema.minimum}`);
		}
		return;
	}
	if (schema.type === "boolean") {
		assert.equal(typeof value, "boolean", `${path} must be a boolean`);
	}
}

test("scenario proposal input schema matches the standalone input fixture", () => {
	const schema = readJson("input.schema.json");
	const fixture = readJson("standalone-input.json");
	validateAgainstSchema(schema, fixture);
});

test("chatbot normalization input schema matches the chatbot fixture", () => {
	const schema = readJson("chatbot-input.schema.json");
	const fixture = readJson("chatbot-input.json");
	validateAgainstSchema(schema, fixture);
});

test("skill normalization input schema matches the skill fixture", () => {
	const schema = readJson("skill-input.schema.json");
	const fixture = readJson("skill-input.json");
	validateAgainstSchema(schema, fixture);
});

test("workflow normalization input schema matches the workflow fixture", () => {
	const schema = readJson("workflow-input.schema.json");
	const fixture = readJson("workflow-input.json");
	validateAgainstSchema(schema, fixture);
});

test("scenario proposal output schema matches the generated proposal packet", () => {
	const inputSchema = readJson("input.schema.json");
	const outputSchema = readJson("proposals.schema.json");
	const packet = buildScenarioProposalInput({
		proposalCandidates: readJson("candidates.json"),
		existingScenarioRegistry: readJson("registry.json"),
		scenarioCoverage: readJson("coverage.json"),
		families: ["fast_regression"],
		windowDays: 14,
		now: "2026-04-11T00:00:00.000Z",
	});
	validateAgainstSchema(inputSchema, packet);
	const proposalPacket = buildScenarioProposalPacket(packet);
	validateAgainstSchema(outputSchema, proposalPacket);
});
