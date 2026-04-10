import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import test from "node:test";

import { buildReportPacket } from "./build-report-packet.mjs";

const REPORT_FIXTURE_ROOT = join(process.cwd(), "fixtures", "reports");
const SCENARIO_RESULTS_FIXTURE_ROOT = join(process.cwd(), "fixtures", "scenario-results");

function readJson(root, name) {
	return JSON.parse(readFileSync(join(root, name), "utf-8"));
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

test("scenario results schema matches the checked-in fixture", () => {
	validateAgainstSchema(
		readJson(SCENARIO_RESULTS_FIXTURE_ROOT, "results.schema.json"),
		readJson(SCENARIO_RESULTS_FIXTURE_ROOT, "example-results.json"),
	);
});

test("report input and generated report match the checked-in schemas", () => {
	const reportInput = readJson(REPORT_FIXTURE_ROOT, "report-input.json");
	validateAgainstSchema(readJson(REPORT_FIXTURE_ROOT, "report-input.schema.json"), reportInput);
	const report = buildReportPacket(reportInput, { now: new Date("2026-04-11T00:02:00.000Z") });
	validateAgainstSchema(readJson(REPORT_FIXTURE_ROOT, "report.schema.json"), report);
});
