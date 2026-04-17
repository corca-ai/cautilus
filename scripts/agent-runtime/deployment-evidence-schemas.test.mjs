import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import test from "node:test";

import { buildDeploymentEvidence } from "./deployment-evidence.mjs";

const FIXTURE_ROOT = join(process.cwd(), "fixtures", "deployment-evidence");

function readJson(name) {
	return JSON.parse(readFileSync(join(FIXTURE_ROOT, name), "utf-8"));
}

function validateAgainstSchema(schema, value, path = "root") {
	if (schema.type === "object") {
		assert.equal(typeof value, "object", `${path} must be an object`);
		assert.notEqual(value, null, `${path} must not be null`);
		assert.equal(Array.isArray(value), false, `${path} must not be an array`);
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
		for (const [index, item] of value.entries()) {
			validateAgainstSchema(schema.items || {}, item, `${path}[${index}]`);
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
		assert.equal(Number.isInteger(value), true, `${path} must be an integer`);
		if (schema.minimum !== undefined) {
			assert.ok(value >= schema.minimum, `${path} must be >= ${schema.minimum}`);
		}
		return;
	}
	if (schema.type === "number") {
		assert.equal(typeof value, "number", `${path} must be a number`);
		if (schema.minimum !== undefined) {
			assert.ok(value >= schema.minimum, `${path} must be >= ${schema.minimum}`);
		}
		if (schema.maximum !== undefined) {
			assert.ok(value <= schema.maximum, `${path} must be <= ${schema.maximum}`);
		}
	}
}

test("deployment evidence input fixture matches the checked-in schema", () => {
	validateAgainstSchema(readJson("input.schema.json"), readJson("example-input.json"));
});

test("deployment evidence output fixture matches the checked-in schema", () => {
	validateAgainstSchema(readJson("evidence.schema.json"), readJson("example-evidence.json"));
});

test("buildDeploymentEvidence reproduces the checked-in example packet", () => {
	const packet = buildDeploymentEvidence(
		readJson("example-input.json"),
		{ now: new Date("2026-04-17T12:00:00.000Z") },
	);
	assert.deepEqual(packet, readJson("example-evidence.json"));
});
