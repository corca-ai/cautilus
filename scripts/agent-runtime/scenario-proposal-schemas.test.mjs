import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import test from "node:test";

import { buildScenarioProposalInput } from "./build-scenario-proposal-input.mjs";
import { buildScenarioProposalPacket } from "./generate-scenario-proposals.mjs";

const FIXTURE_ROOT = join(process.cwd(), "fixtures", "scenario-proposals");
const PORTABLE_EVIDENCE_SOURCE_KINDS = [
	"human_conversation",
	"agent_run",
	"skill_evaluation",
	"workflow_run",
];
const PORTABLE_EVIDENCE_ORIGINS = [
	"real",
	"synthetic",
	"replayed",
	"operator_authored",
];

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
		if (schema.minLength !== undefined) {
			assert.ok(value.length >= schema.minLength, `${path} must have length >= ${schema.minLength}`);
		}
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

test("scenario proposal evidence schema bounds portable provenance fields", () => {
	const inputSchema = readJson("input.schema.json");
	const outputSchema = readJson("proposals.schema.json");
	const inputEvidence = inputSchema.properties.proposalCandidates.items.properties.evidence.items;
	const outputEvidence = outputSchema.properties.proposals.items.properties.evidence.items;
	assert.equal(outputSchema.properties.proposals.items.properties.evidence.minItems, 1, "proposal output evidence must keep at least one signal");
	for (const [label, schema] of Object.entries({ inputEvidence, outputEvidence })) {
		assert.deepEqual(schema.required, ["sourceKind", "title", "observedAt"], `${label} should keep v1 evidence compatibility`);
		assert.deepEqual(schema.properties.sourceKind.enum, PORTABLE_EVIDENCE_SOURCE_KINDS, `${label} should bound sourceKind to portable source ports`);
		assert.deepEqual(schema.properties.origin.enum, PORTABLE_EVIDENCE_ORIGINS, `${label} should bound origin to portable activity labels`);
		assert.deepEqual(schema.properties.activityProvenance.properties.split.enum, ["proposal", "train", "review"], `${label} should keep mutable/proposal splits explicit`);
		assert.equal(schema.properties.activityProvenance.additionalProperties, false, `${label} should reject raw host storage fields inside activityProvenance`);
		for (const identityField of ["activityId", "taskKey", "recurrenceKey", "replayId"]) {
			assert.equal(schema.properties.activityProvenance.properties[identityField].minLength, 1, `${label}.${identityField} should require a non-empty string`);
		}
	}
});

test("scenario proposal provenance survives prepare-input and propose", () => {
	const packet = buildScenarioProposalInput({
		proposalCandidates: readJson("candidates.json"),
		existingScenarioRegistry: readJson("registry.json"),
		scenarioCoverage: readJson("coverage.json"),
		families: ["fast_regression"],
		windowDays: 14,
		now: "2026-04-11T00:00:00.000Z",
	});
	const inputOrigins = packet.proposalCandidates[0].evidence.map((entry) => entry.origin).sort();
	assert.deepEqual(inputOrigins, [...PORTABLE_EVIDENCE_ORIGINS].sort());

	const proposalPacket = buildScenarioProposalPacket(packet);
	const proposal = proposalPacket.proposals.find((entry) => entry.proposalKey === "review-after-retro");
	assert.ok(proposal, "review-after-retro proposal should be emitted");
	assert.deepEqual(proposal.evidence.map((entry) => entry.origin), ["replayed", "real", "synthetic"]);
	assert.equal(proposal.evidence[0].activityProvenance.replayId, "replay-1");
	assert.equal(proposal.evidence[0].activityProvenance.taskKey, "review-after-retro");
	assert.equal(proposal.evidence.length, 3, "proposal output keeps the top-ranked evidence entries");
});
