import assert from "node:assert/strict";
import test from "node:test";

import {
	CLAUDE_CLI_ENV,
	claudeArgs,
	parseClaudeOutput,
} from "./skill-test-claude-backend.mjs";

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

test("claudeArgs includes json output and dynamic prompt exclusion", () => {
	assert.deepEqual(claudeArgs({ model: null }), [
		"-p",
		"--output-format", "json",
		"--exclude-dynamic-system-prompt-sections",
	]);
	assert.deepEqual(claudeArgs({ model: "claude-opus-4-1" }), [
		"-p",
		"--output-format", "json",
		"--exclude-dynamic-system-prompt-sections",
		"--model", "claude-opus-4-1",
	]);
});

test("CLAUDE_CLI_ENV keeps reproducibility-oriented defaults enabled", () => {
	assert.deepEqual(CLAUDE_CLI_ENV, {
		CLAUDE_CODE_DISABLE_NONESSENTIAL_TRAFFIC: "1",
		CLAUDE_CODE_DISABLE_AUTO_MEMORY: "1",
		ENABLE_CLAUDEAI_MCP_SERVERS: "false",
		DISABLE_TELEMETRY: "1",
		DISABLE_AUTOUPDATER: "1",
		DISABLE_BUG_COMMAND: "1",
		DISABLE_ERROR_REPORTING: "1",
		CLAUDE_CODE_IDE_SKIP_AUTO_INSTALL: "1",
	});
});
