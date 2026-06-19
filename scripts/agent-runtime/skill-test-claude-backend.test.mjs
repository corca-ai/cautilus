import assert from "node:assert/strict";
import test from "node:test";

import {
	CLAUDE_CLI_ENV,
	claudeArgs,
	extractClaudeCommandText,
	extractClaudeTelemetry,
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

test("extractClaudeTelemetry keeps structured token, cost, and model metadata", () => {
	const telemetry = extractClaudeTelemetry(JSON.stringify({
		type: "result",
		total_cost_usd: 0.05,
		usage: {
			input_tokens: 10,
			cache_creation_input_tokens: 20,
			cache_read_input_tokens: 30,
			output_tokens: 40,
		},
		modelUsage: {
			"claude-haiku-4-5-20251001": {
				costUSD: 0.001,
				outputTokens: 10,
			},
			"claude-sonnet-4-6": {
				costUSD: 0.049,
				outputTokens: 40,
			},
		},
	}));
	assert.deepEqual(telemetry, {
		provider: "anthropic",
		model: "claude-sonnet-4-6",
		uncached_input_tokens: 10,
		cache_creation_input_tokens: 20,
		cache_read_input_tokens: 30,
		prompt_tokens: 60,
		output_tokens: 40,
		completion_tokens: 40,
		total_tokens: 100,
		cost_usd: 0.05,
	});
});

test("parseClaudeOutput throws on unparseable input", () => {
	assert.throws(() => parseClaudeOutput("not json at all"), /JSON/i);
});

test("claudeArgs includes stream-json output and dynamic prompt exclusion", () => {
	assert.deepEqual(claudeArgs({ model: null }), [
		"-p",
		"--no-session-persistence",
		"--output-format", "stream-json",
		"--verbose",
		"--exclude-dynamic-system-prompt-sections",
	]);
	assert.deepEqual(claudeArgs({ model: "claude-opus-4-1" }), [
		"-p",
		"--no-session-persistence",
		"--output-format", "stream-json",
		"--verbose",
		"--exclude-dynamic-system-prompt-sections",
		"--model", "claude-opus-4-1",
	]);
});

test("claudeArgs applies runtime-specific model and permission settings", () => {
	assert.deepEqual(claudeArgs({
		model: "claude-opus-4-1",
		claudeModel: "claude-sonnet-4-6",
		claudePermissionMode: "dontAsk",
		claudeAllowedTools: "Bash(cautilus *)",
	}), [
		"-p",
		"--no-session-persistence",
		"--output-format", "stream-json",
		"--verbose",
		"--exclude-dynamic-system-prompt-sections",
		"--model", "claude-sonnet-4-6",
		"--permission-mode", "dontAsk",
		"--allowedTools", "Bash(cautilus *)",
	]);
});

test("parseClaudeOutput finds the result line in a stream-json transcript", () => {
	const raw = [
		JSON.stringify({ type: "system", subtype: "init" }),
		JSON.stringify({ type: "assistant", message: { content: [{ type: "tool_use", name: "Bash", input: { command: "./bin/cautilus doctor status --repo-root . --json" } }] } }),
		JSON.stringify({ type: "result", subtype: "success", result: '{"invoked":true,"summary":"Oriented.","outcome":"passed"}' }),
	].join("\n");
	assert.deepEqual(parseClaudeOutput(raw), {
		invoked: true,
		summary: "Oriented.",
		outcome: "passed",
	});
});

test("extractClaudeCommandText collects Bash commands from a stream-json transcript", () => {
	const raw = [
		JSON.stringify({ type: "assistant", message: { content: [{ type: "tool_use", name: "Bash", input: { command: "./bin/cautilus doctor status --repo-root . --json" } }] } }),
		JSON.stringify({ type: "assistant", message: { content: [{ type: "text", text: "thinking" }, { type: "tool_use", name: "Bash", input: { command: "git status" } }] } }),
		JSON.stringify({ type: "result", result: "{}" }),
	].join("\n");
	const commandText = extractClaudeCommandText(raw);
	assert.match(commandText, /doctor status/);
	assert.match(commandText, /git status/);
});

test("extractClaudeCommandText returns null when there is no transcript", () => {
	assert.equal(extractClaudeCommandText(JSON.stringify({ type: "result", result: "{}" })), null);
});

test("extractClaudeTelemetry reads the result envelope from a stream-json transcript", () => {
	const raw = [
		JSON.stringify({ type: "assistant", message: { content: [{ type: "tool_use", name: "Bash", input: { command: "ls" } }] } }),
		JSON.stringify({ type: "result", total_cost_usd: 0.02, usage: { input_tokens: 5, output_tokens: 7 } }),
	].join("\n");
	const telemetry = extractClaudeTelemetry(raw);
	assert.equal(telemetry.provider, "anthropic");
	assert.equal(telemetry.cost_usd, 0.02);
	assert.equal(telemetry.total_tokens, 12);
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
