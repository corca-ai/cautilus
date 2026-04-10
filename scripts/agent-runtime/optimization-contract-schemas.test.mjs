import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import test from "node:test";

const OPTIMIZE_FIXTURE_ROOT = join(process.cwd(), "fixtures", "optimize");

function readJson(name) {
	return JSON.parse(readFileSync(join(OPTIMIZE_FIXTURE_ROOT, name), "utf-8"));
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
	if (schema.type === "boolean") {
		assert.equal(typeof value, "boolean", `${path} must be a boolean`);
	}
}

test("optimize input and proposal examples match the checked-in schemas", () => {
	validateAgainstSchema(readJson("input.schema.json"), readJson("example-input.json"));
	validateAgainstSchema(readJson("proposal.schema.json"), readJson("example-proposal.json"));
});
