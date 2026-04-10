import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import test from "node:test";

import { buildChatbotProposalCandidates } from "./normalize-chatbot-proposals.mjs";
import { buildCliProposalCandidates } from "./normalize-cli-proposals.mjs";
import { buildSkillProposalCandidates } from "./normalize-skill-proposals.mjs";

const FIXTURE_ROOT = join(process.cwd(), "fixtures", "scenario-proposals");

function readJson(name) {
	return JSON.parse(readFileSync(join(FIXTURE_ROOT, name), "utf-8"));
}

test("Ceal-shaped chatbot packet produces the expected proposal keys", () => {
	const candidates = buildChatbotProposalCandidates(readJson("ceal-chatbot-input.json"));
	assert.deepEqual(
		candidates.map((candidate) => candidate.proposalKey).sort(),
		[
			"ambiguous-confirmation-needs-context",
			"event-triggered-followup",
			"repo-review-needs-target-clarification",
		],
	);
});

test("charness-shaped skill packet produces deterministic validation regression candidates", () => {
	const candidates = buildSkillProposalCandidates(readJson("charness-skill-input.json"));
	assert.deepEqual(
		candidates.map((candidate) => candidate.proposalKey).sort(),
		[
			"profile-engineering-quality-bootstrap-regression",
			"public-skill-impl-smoke-scenario-regression",
		],
	);
});

test("crill-shaped workflow packet produces an operator-recovery candidate", () => {
	const candidates = buildSkillProposalCandidates(readJson("crill-skill-input.json"));
	assert.equal(candidates.length, 1);
	assert.equal(candidates[0].proposalKey, "cli-workflow-scan-settings-seed-replay-seed-repeated-screen-no-progress");
	assert.ok(candidates[0].tags.includes("operator-recovery"));
});

test("Cautilus-shaped CLI packet produces guidance and behavior-contract candidates", () => {
	const candidates = buildCliProposalCandidates(readJson("cli-input.json"));
	assert.deepEqual(
		candidates.map((candidate) => candidate.proposalKey).sort(),
		[
			"cli-adapter-init-scaffold-adapter-init-default-behavior-contract",
			"cli-doctor-missing-adapter-doctor-no-adapter-operator-guidance",
		],
	);
});
