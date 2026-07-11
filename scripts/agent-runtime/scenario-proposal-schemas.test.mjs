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
		if (schema.maximum !== undefined) {
			assert.ok(value <= schema.maximum, `${path} must be <= ${schema.maximum}`);
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

test("scenario proposal packet rejects malformed registry and coverage", () => {
	const base = {
		schemaVersion: "cautilus.scenario_proposal_inputs.v1",
		families: [],
		proposalCandidates: [],
		existingScenarioRegistry: [],
		scenarioCoverage: [],
	};
	const cases = [
		["registry must be array", { existingScenarioRegistry: "bad" }, /existingScenarioRegistry must be an array/],
		["registry null must be array", { existingScenarioRegistry: null }, /existingScenarioRegistry must be an array/],
		["registry entry must be object", { existingScenarioRegistry: ["bad"] }, /existingScenarioRegistry\[0\] must be an object/],
		["coverage must be array", { scenarioCoverage: "bad" }, /scenarioCoverage must be an array/],
		["coverage null must be array", { scenarioCoverage: null }, /scenarioCoverage must be an array/],
		["coverage entry must be object", { scenarioCoverage: ["bad"] }, /scenarioCoverage\[0\] must be an object/],
		["coverage key must be non-empty", { scenarioCoverage: [{ scenarioKey: " " }] }, /scenarioCoverage\[0\]\.scenarioKey must be a non-empty string/],
		["coverage count must be numeric", { scenarioCoverage: [{ scenarioKey: "scenario-a", recentResultCount: "bad" }] }, /scenarioCoverage\[0\]\.recentResultCount must be a non-negative number/],
		["coverage count must be a number", { scenarioCoverage: [{ scenarioKey: "scenario-a", recentResultCount: "3" }] }, /scenarioCoverage\[0\]\.recentResultCount must be a non-negative number/],
		["coverage count must be non-negative", { scenarioCoverage: [{ scenarioKey: "scenario-a", recentResultCount: -1 }] }, /scenarioCoverage\[0\]\.recentResultCount must be a non-negative number/],
	];
	for (const [name, override, expected] of cases) {
		assert.throws(() => buildScenarioProposalPacket({ ...base, ...override }), expected, name);
	}
});

test("scenario proposal evidence schema bounds portable provenance fields", () => {
	const inputSchema = readJson("input.schema.json");
	const outputSchema = readJson("proposals.schema.json");
	const inputEvidence = inputSchema.properties.proposalCandidates.items.properties.evidence.items;
	const outputEvidence = outputSchema.properties.proposals.items.properties.evidence.items;
	assert.equal(outputSchema.properties.proposals.items.properties.evidence.minItems, 1, "proposal output evidence must keep at least one signal");
	assert.deepEqual(outputSchema.properties.proposals.items.required.includes("provenanceSummary"), true, "proposal output must include a reviewable provenance summary");
	for (const [label, schema] of Object.entries({ inputEvidence, outputEvidence })) {
		assert.deepEqual(schema.required, ["sourceKind", "title", "observedAt"], `${label} should keep v1 evidence compatibility`);
		assert.deepEqual(schema.properties.sourceKind.enum, PORTABLE_EVIDENCE_SOURCE_KINDS, `${label} should bound sourceKind to portable source ports`);
		assert.deepEqual(schema.properties.origin.enum, PORTABLE_EVIDENCE_ORIGINS, `${label} should bound origin to portable activity labels`);
		assert.deepEqual(schema.properties.activityProvenance.properties.split.enum, ["proposal", "train", "review"], `${label} should keep mutable/proposal splits explicit`);
		assert.equal(schema.properties.activityProvenance.properties.score.minimum, 0, `${label}.score should reject negative confidence`);
		assert.equal(schema.properties.activityProvenance.properties.score.maximum, 1, `${label}.score should reject confidence above 1`);
		assert.equal(schema.properties.activityProvenance.additionalProperties, false, `${label} should reject raw host storage fields inside activityProvenance`);
		assert.equal(schema.allOf.length, 2, `${label} should encode replayId/origin compatibility`);
		assert.deepEqual(schema.allOf[0].if.properties.origin.const, "replayed", `${label} should make replayed origin explicit`);
		assert.deepEqual(schema.allOf[0].then.properties.activityProvenance.required, ["replayId"], `${label} should require replayId for replayed origin`);
		assert.deepEqual(schema.allOf[1].then.properties.origin.const, "replayed", `${label} should require replayed origin when replayId is present`);
		for (const identityField of ["activityId", "taskKey", "recurrenceKey", "replayId"]) {
			assert.equal(schema.properties.activityProvenance.properties[identityField].minLength, 1, `${label}.${identityField} should require a non-empty string`);
		}
	}
	const summarySchema = outputSchema.properties.proposals.items.properties.provenanceSummary;
	assert.deepEqual(summarySchema.required, ["originCounts", "splitCounts", "replayEvidenceCount", "scoredEvidenceCount"]);
	assert.equal(summarySchema.properties.originCounts.additionalProperties, false);
	assert.equal(summarySchema.properties.originCounts.properties.replayed.minimum, 0);
	assert.equal(summarySchema.properties.splitCounts.additionalProperties, false);
	assert.equal(summarySchema.properties.splitCounts.properties.review.minimum, 0);
	assert.equal(summarySchema.properties.maxScore.minimum, 0);
	assert.equal(summarySchema.properties.maxScore.maximum, 1);
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
	assert.equal(proposal.provenanceSummary.replayEvidenceCount, 1);
	assert.equal(proposal.provenanceSummary.scoredEvidenceCount, 1);
	assert.equal(proposal.provenanceSummary.maxScore, 0.82);
});
