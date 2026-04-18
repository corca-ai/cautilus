import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import test from "node:test";

const FIXTURE_ROOT = join(process.cwd(), "fixtures", "instruction-surface");

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
	if (schema.type === "number") {
		assert.equal(typeof value, "number", `${path} must be a number`);
		if (schema.minimum !== undefined) {
			assert.ok(value >= schema.minimum, `${path} must be >= ${schema.minimum}`);
		}
		return;
	}
	if (schema.type === "boolean") {
		assert.equal(typeof value, "boolean", `${path} must be a boolean`);
	}
}

test("instruction-surface cases schema matches the checked-in fixture", () => {
	validateAgainstSchema(readJson("cases.schema.json"), readJson("cases.json"));
});

test("instruction-surface input schema matches the checked-in fixture", () => {
	validateAgainstSchema(readJson("input.schema.json"), readJson("input.json"));
});
