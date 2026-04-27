import assert from "node:assert/strict";
import { chmodSync, mkdirSync, mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { delimiter, join } from "node:path";
import test from "node:test";

import { buildObservedAppInput, main } from "./run-app-eval.mjs";

test("buildObservedAppInput materializes fixture-backed app/chat observations", () => {
	const packet = buildObservedAppInput({
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

test("buildObservedAppInput materializes fixture-backed app/prompt observations", () => {
	const packet = buildObservedAppInput({
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

test("main writes fixture-backed observed packet from a cases file", () => {
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

test("main writes claude-backed observed packet from a Claude CLI JSON result", () => {
	const root = mkdtempSync(join(tmpdir(), "cautilus-app-claude-"));
	const fakeBin = join(root, "bin");
	mkdirSync(fakeBin);
	const fakeClaude = join(fakeBin, "claude");
	writeFileSync(fakeClaude, [
		"#!/usr/bin/env node",
		"let input = '';",
		"process.stdin.on('data', (chunk) => { input += chunk; });",
		"process.stdin.on('end', () => {",
		"  if (!input.includes('ONLY a JSON object')) { process.exit(2); }",
		"  process.stdout.write(JSON.stringify({ result: JSON.stringify({ finalText: 'Cautilus from Claude' }) }));",
		"});",
		"",
	].join("\n"));
	chmodSync(fakeClaude, 0o755);
	const casesFile = join(root, "cases.json");
	const outputFile = join(root, "observed.json");
	writeFileSync(casesFile, JSON.stringify({
		schemaVersion: "cautilus.app_chat_test_cases.v1",
		suiteId: "chat-demo",
		provider: "fixture",
		model: "fixture-backend",
		cases: [
			{
				caseId: "greeting",
				messages: [{ role: "user", content: "Name the product." }],
				expected: { finalText: "Cautilus" },
			},
		],
	}));
	const oldPath = process.env.PATH;
	process.env.PATH = `${fakeBin}${delimiter}${oldPath ?? ""}`;
	try {
		main(["--cases-file", casesFile, "--output-file", outputFile, "--backend", "claude_code"]);
	} finally {
		process.env.PATH = oldPath;
	}
	const packet = JSON.parse(readFileSync(outputFile, "utf-8"));
	assert.equal(packet.schemaVersion, "cautilus.app_chat_evaluation_inputs.v1");
	assert.equal(packet.evaluations[0].harness, "claude_code");
	assert.equal(packet.evaluations[0].provider, "anthropic");
	assert.equal(packet.evaluations[0].observed.finalText, "Cautilus from Claude");
});
