import assert from "node:assert/strict";
import { mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";

import { buildObservedAppFixtureInput, main } from "./run-app-fixture-eval.mjs";

test("buildObservedAppFixtureInput materializes app/chat fixture observations", () => {
	const packet = buildObservedAppFixtureInput({
		schemaVersion: "cautilus.app_chat_test_cases.v1",
		suiteId: "chat-demo",
		suiteDisplayName: "Chat Demo",
		provider: "fixture",
		model: "fixture-backend",
		cases: [
			{
				caseId: "greeting",
				displayName: "Greeting",
				messages: [{ role: "user", content: "Name the product." }],
				expected: { finalText: "Cautilus" },
			},
		],
	});
	assert.equal(packet.schemaVersion, "cautilus.app_chat_evaluation_inputs.v1");
	assert.equal(packet.evaluations[0].observed.finalText, "Fixture response includes Cautilus.");
	assert.deepEqual(packet.evaluations[0].observed.messages.at(-1), {
		role: "assistant",
		content: "Fixture response includes Cautilus.",
	});
});

test("buildObservedAppFixtureInput materializes app/prompt fixture observations", () => {
	const packet = buildObservedAppFixtureInput({
		schemaVersion: "cautilus.app_prompt_test_cases.v1",
		suiteId: "prompt-demo",
		provider: "fixture",
		model: "fixture-backend",
		cases: [
			{
				caseId: "tagline",
				input: "Describe the product.",
				expected: { finalText: "behavior" },
			},
		],
	});
	assert.equal(packet.schemaVersion, "cautilus.app_prompt_evaluation_inputs.v1");
	assert.equal(packet.evaluations[0].observed.input, "Describe the product.");
	assert.equal(packet.evaluations[0].observed.finalText, "Fixture response includes behavior.");
});

test("main writes observed packet from a cases file", () => {
	const root = mkdtempSync(join(tmpdir(), "cautilus-app-fixture-"));
	const casesFile = join(root, "cases.json");
	const outputFile = join(root, "observed.json");
	writeFileSync(casesFile, JSON.stringify({
		schemaVersion: "cautilus.app_prompt_test_cases.v1",
		suiteId: "prompt-demo",
		provider: "fixture",
		model: "fixture-backend",
		cases: [
			{
				caseId: "tagline",
				input: "Describe the product.",
				expected: { finalText: "behavior" },
			},
		],
	}));
	main(["--cases-file", casesFile, "--output-file", outputFile, "--backend", "fixture"]);
	const packet = JSON.parse(readFileSync(outputFile, "utf-8"));
	assert.equal(packet.schemaVersion, "cautilus.app_prompt_evaluation_inputs.v1");
});
