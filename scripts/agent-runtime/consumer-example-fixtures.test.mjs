import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import test from "node:test";

import { buildChatbotProposalCandidates } from "./normalize-chatbot-proposals.mjs";
import { buildSkillProposalCandidates } from "./normalize-skill-proposals.mjs";

const FIXTURE_ROOT = join(process.cwd(), "fixtures", "scenario-proposals");

function readJson(name) {
	return JSON.parse(readFileSync(join(FIXTURE_ROOT, name), "utf-8"));
}

test("chatbot-consumer packet produces the expected proposal keys", () => {
	const candidates = buildChatbotProposalCandidates(readJson("chatbot-consumer-input.json"));
	assert.deepEqual(
		candidates.map((candidate) => candidate.proposalKey).sort(),
		[
			"ambiguous-confirmation-needs-context",
			"event-triggered-followup",
			"repo-review-needs-target-clarification",
		],
	);
});

test("skill-validation packet produces deterministic validation regression candidates", () => {
	const candidates = buildSkillProposalCandidates(readJson("skill-validation-input.json"));
	assert.deepEqual(
		candidates.map((candidate) => candidate.proposalKey).sort(),
		[
			"profile-engineering-quality-bootstrap-regression",
			"public-skill-impl-smoke-scenario-regression",
		],
	);
});

test("workflow-recovery packet produces an operator-recovery candidate", () => {
	const candidates = buildSkillProposalCandidates(readJson("workflow-recovery-input.json"));
	assert.equal(candidates.length, 1);
	assert.equal(candidates[0].proposalKey, "cli-workflow-scan-settings-seed-replay-seed-repeated-screen-no-progress");
	assert.ok(candidates[0].tags.includes("operator-recovery"));
});
