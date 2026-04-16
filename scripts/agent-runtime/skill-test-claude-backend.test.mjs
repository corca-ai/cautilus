import assert from "node:assert/strict";
import test from "node:test";

import { parseClaudeOutput } from "./skill-test-claude-backend.mjs";

test("parseClaudeOutput extracts JSON from claude --output-format json envelope", () => {
	const raw = JSON.stringify({
		type: "result",
		subtype: "success",
		is_error: false,
		result: '{"invoked":true,"summary":"Skill was invoked.","outcome":"passed"}',
		duration_ms: 5000,
		total_cost_usd: 0.05,
	});
	const parsed = parseClaudeOutput(raw);
	assert.deepEqual(parsed, {
		invoked: true,
		summary: "Skill was invoked.",
		outcome: "passed",
	});
});

test("parseClaudeOutput handles bare JSON object", () => {
	const raw = '{"invoked":false,"summary":"Skill was not needed."}';
	const parsed = parseClaudeOutput(raw);
	assert.deepEqual(parsed, {
		invoked: false,
		summary: "Skill was not needed.",
	});
});

test("parseClaudeOutput extracts JSON from fenced code block", () => {
	const raw = 'Here is the result:\n```json\n{"invoked":true,"summary":"Done.","outcome":"passed"}\n```\n';
	const parsed = parseClaudeOutput(raw);
	assert.deepEqual(parsed, {
		invoked: true,
		summary: "Done.",
		outcome: "passed",
	});
});

test("parseClaudeOutput handles envelope with object result (not string)", () => {
	const raw = JSON.stringify({
		type: "result",
		result: { invoked: true, summary: "Direct object.", outcome: "degraded" },
	});
	const parsed = parseClaudeOutput(raw);
	assert.deepEqual(parsed, {
		invoked: true,
		summary: "Direct object.",
		outcome: "degraded",
	});
});

test("parseClaudeOutput throws on unparseable input", () => {
	assert.throws(() => parseClaudeOutput("not json at all"), /JSON/i);
});
