import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { spawnSync } from "node:child_process";

import {
	renderPrompt,
	baseSchema,
	backendFailureResult,
	normalizeObservedResult,
	artifactRef,
	sampleDir,
} from "./run-local-skill-test.mjs";

export const CLAUDE_CLI_ENV = {
	CLAUDE_CODE_DISABLE_NONESSENTIAL_TRAFFIC: "1",
	CLAUDE_CODE_DISABLE_AUTO_MEMORY: "1",
	ENABLE_CLAUDEAI_MCP_SERVERS: "false",
	DISABLE_TELEMETRY: "1",
	DISABLE_AUTOUPDATER: "1",
	DISABLE_BUG_COMMAND: "1",
	DISABLE_ERROR_REPORTING: "1",
	CLAUDE_CODE_IDE_SKIP_AUTO_INSTALL: "1",
};

export function claudeArgs(options) {
	const args = [
		"-p",
		"--output-format", "json",
		"--exclude-dynamic-system-prompt-sections",
	];
	if (options.model) {
		args.push("--model", options.model);
	}
	return args;
}

function renderClaudePrompt(skillId, testCase, schema) {
	const basePrompt = renderPrompt(skillId, testCase);
	const lines = [
		basePrompt,
		"",
		"You MUST respond with ONLY a JSON object matching this schema — no markdown fences, no commentary:",
		"",
		JSON.stringify(schema, null, 2),
	];
	return `${lines.join("\n")}\n`;
}

function extractJSON(text) {
	const fenced = text.match(/```(?:json)?\s*\n([\s\S]*?)\n\s*```/);
	if (fenced) {
		return JSON.parse(fenced[1]);
	}
	const braceMatch = text.match(/\{[\s\S]*\}/);
	if (braceMatch) {
		return JSON.parse(braceMatch[0]);
	}
	return JSON.parse(text);
}

export function parseClaudeOutput(raw) {
	try {
		const parsed = JSON.parse(raw);
		if (parsed.result !== undefined) {
			return extractJSON(typeof parsed.result === "string" ? parsed.result : JSON.stringify(parsed.result));
		}
		return parsed;
	} catch {
		return extractJSON(raw);
	}
}

export function runClaudeSample(options, testCase, artifactDir, sampleIndex) {
	const caseDir = join(artifactDir, testCase.caseId);
	const outputDir = sampleDir(caseDir, sampleIndex, testCase.repeatCount);
	mkdirSync(outputDir, { recursive: true });
	const promptFile = join(outputDir, "prompt.md");
	const outputFile = join(outputDir, "result.json");
	const rawFile = join(outputDir, "result.raw");
	const stderrFile = join(outputDir, "result.stderr");
	const schema = baseSchema(testCase.evaluationKind);
	const prompt = renderClaudePrompt(testCase.targetId, testCase, schema);
	writeFileSync(promptFile, prompt);

	const started = Date.now();
	const result = spawnSync("claude", claudeArgs(options), {
		cwd: options.workspace,
		encoding: "utf-8",
		env: {
			...process.env,
			...CLAUDE_CLI_ENV,
			PATH: `${join(options.repoRoot, "bin")}:${process.env.PATH ?? ""}`,
		},
		input: prompt,
		timeout: options.timeoutMs,
	});
	const durationMs = Date.now() - started;
	writeFileSync(stderrFile, result.stderr ?? "");
	writeFileSync(rawFile, result.stdout ?? "");
	const artifactRefs = [
		artifactRef("prompt", promptFile),
		artifactRef("raw", rawFile),
		artifactRef("stderr", stderrFile),
	];
	if (result.error?.code === "ETIMEDOUT") {
		return backendFailureResult(testCase, `The claude_code runner timed out after ${options.timeoutMs}ms.`, durationMs, artifactRefs);
	}
	if (result.status !== 0) {
		return backendFailureResult(testCase, `The claude_code runner exited with status ${result.status}.`, durationMs, artifactRefs);
	}
	let observed;
	try {
		observed = parseClaudeOutput(result.stdout ?? "");
	} catch (error) {
		return backendFailureResult(testCase, `The claude_code runner did not produce valid JSON: ${error.message}`, durationMs, artifactRefs);
	}
	writeFileSync(outputFile, `${JSON.stringify(observed, null, 2)}\n`);
	artifactRefs.push(artifactRef("result", outputFile));
	return normalizeObservedResult(testCase, observed, durationMs, artifactRefs);
}
