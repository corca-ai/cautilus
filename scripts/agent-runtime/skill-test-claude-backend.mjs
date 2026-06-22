import { existsSync, mkdirSync, readdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { homedir } from "node:os";
import { join, resolve } from "node:path";
import { spawnSync } from "node:child_process";

import {
	renderPrompt,
	baseSchema,
	backendFailureResult,
	normalizeObservedResult,
	artifactRef,
	sampleDir,
} from "./run-local-skill-test.mjs";
import { extractClaudeTelemetry, resolveClaudeResultEnvelope } from "./skill-test-telemetry.mjs";
import { applyObservationExpectations } from "./skill-test-expectations.mjs";

export { extractClaudeTelemetry } from "./skill-test-telemetry.mjs";

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
		"--no-session-persistence",
		// stream-json (with --verbose) emits the per-turn tool_use transcript so the deterministic
		// command-fragment matchers can be applied to the claude backend, symmetric to codex; the
		// final `type:"result"` line still carries the structured result and usage envelope.
		"--output-format", "stream-json",
		"--verbose",
		"--exclude-dynamic-system-prompt-sections",
	];
	if (options.claudeModel ?? options.model) {
		args.push("--model", options.claudeModel ?? options.model);
	}
	if (options.claudePermissionMode) {
		args.push("--permission-mode", options.claudePermissionMode);
	}
	if (options.claudeAllowedTools) {
		args.push("--allowedTools", options.claudeAllowedTools);
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
	const envelope = resolveClaudeResultEnvelope(raw);
	if (envelope && envelope.result !== undefined) {
		return extractJSON(typeof envelope.result === "string" ? envelope.result : JSON.stringify(envelope.result));
	}
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

// Collect the agent's shell command log from a claude stream-json transcript so the deterministic
// command-fragment matchers (requiredCommandFragments / forbiddenCommandFragments) can be applied.
// Returns null when no transcript is available (e.g. single-object `json` output), which keeps the
// command matchers a no-op rather than asserting against an empty log.
export function extractClaudeCommandText(raw, options = {}) {
	const commands = [];
	for (const text of claudeCommandTranscriptTexts(raw, options)) {
		collectClaudeCommandText(text, commands);
	}
	return commands.length > 0 ? commands.join("\n") : claudeStreamTranscriptObserved(raw) ? "" : null;
}

function collectClaudeCommandText(raw, commands) {
	for (const line of String(raw ?? "").split("\n")) {
		const trimmed = line.trim();
		if (!trimmed) {
			continue;
		}
		let parsed;
		try {
			parsed = JSON.parse(trimmed);
		} catch {
			continue;
		}
		collectClaudeToolCommands(parsed, commands);
	}
}

function claudeCommandTranscriptTexts(raw, options = {}) {
	const texts = [raw];
	for (const file of findClaudeSubagentTranscriptFiles(raw, options)) {
		try {
			texts.push(readFileSync(file, "utf-8"));
		} catch {
			// The command matcher is best-effort over runtime-owned transcript files.
		}
	}
	return texts;
}

export function extractClaudeSessionId(raw) {
	for (const line of String(raw ?? "").split("\n")) {
		const trimmed = line.trim();
		if (!trimmed) {
			continue;
		}
		try {
			const event = JSON.parse(trimmed);
			for (const key of ["session_id", "sessionId"]) {
				if (typeof event[key] === "string" && event[key].trim()) {
					return event[key].trim();
				}
			}
		} catch {
			// Ignore non-JSON progress lines from older Claude builds.
		}
	}
	return null;
}

function claudeProjectDirName(workspace) {
	return resolve(workspace).replace(/[\\/]/g, "-");
}

export function findClaudeSubagentTranscriptFiles(raw, options = {}) {
	const sessionId = options.sessionId ?? extractClaudeSessionId(raw);
	if (!sessionId) {
		return [];
	}
	const projectsRoot = options.projectsRoot ?? join(homedir(), ".claude", "projects");
	if (!existsSync(projectsRoot)) {
		return [];
	}
	return sortClaudeTranscriptFiles(
		uniqueClaudeSubagentDirs(projectsRoot, sessionId, options.workspace)
			.flatMap((dir) => claudeSubagentTranscriptFiles(dir)),
	);
}

function projectSessionSubagentDir(projectsRoot, projectName, sessionId) {
	return join(projectsRoot, projectName, sessionId, "subagents");
}

function projectNames(projectsRoot) {
	try {
		return readdirSync(projectsRoot, { withFileTypes: true })
			.filter((entry) => entry.isDirectory())
			.map((entry) => entry.name);
	} catch {
		return [];
	}
}

function uniqueClaudeSubagentDirs(projectsRoot, sessionId, workspace = null) {
	if (workspace) {
		const dir = projectSessionSubagentDir(projectsRoot, claudeProjectDirName(workspace), sessionId);
		return existsSync(dir) ? [dir] : [];
	}
	return projectNames(projectsRoot)
		.map((name) => projectSessionSubagentDir(projectsRoot, name, sessionId))
		.filter((dir, index, dirs) => dirs.indexOf(dir) === index && existsSync(dir));
}

function claudeSubagentTranscriptFiles(dir) {
	try {
		return readdirSync(dir, { withFileTypes: true })
			.filter((entry) => entry.isFile() && entry.name.endsWith(".jsonl"))
			.map((entry) => join(dir, entry.name));
	} catch {
		return [];
	}
}

function sortClaudeTranscriptFiles(files) {
	return files.sort((left, right) => {
		try {
			return statSync(left).mtimeMs - statSync(right).mtimeMs;
		} catch {
			return left.localeCompare(right);
		}
	});
}

function addClaudeSubagentArtifactRefs(artifactRefs, raw, workspace) {
	for (const file of findClaudeSubagentTranscriptFiles(raw, { workspace })) {
		artifactRefs.push(artifactRef("subagent_transcript", file));
	}
}

function claudeProcessFailure(result, testCase, options, durationMs, artifactRefs) {
	if (result.error?.code === "ETIMEDOUT") {
		return backendFailureResult(testCase, `The claude_code runner timed out after ${options.timeoutMs}ms.`, durationMs, artifactRefs);
	}
	if (result.status !== 0) {
		return backendFailureResult(testCase, `The claude_code runner exited with status ${result.status}.`, durationMs, artifactRefs);
	}
	return null;
}

function claudeStreamTranscriptObserved(raw) {
	for (const line of String(raw ?? "").split("\n")) {
		const trimmed = line.trim();
		if (!trimmed) {
			continue;
		}
		try {
			const event = JSON.parse(trimmed);
			if (event.type && event.type !== "result") {
				return true;
			}
			if (event.session_id || event.sessionId) {
				return true;
			}
		} catch {
			// Ignore non-JSON progress lines from older Claude builds.
		}
	}
	return false;
}

function collectToolUseCommand(value, output) {
	if (value.type !== "tool_use" || !value.input || typeof value.input !== "object") {
		return;
	}
	for (const key of ["command", "cmd", "description"]) {
		if (typeof value.input[key] === "string" && value.input[key].trim()) {
			output.push(value.input[key]);
		}
	}
	const scalarParts = toolUseScalarParts(value.input);
	if (scalarParts.length > 0) {
		output.push(`${value.name ?? "tool"} ${scalarParts.join(" ")}`);
	}
}

function toolUseScalarParts(input) {
	const keys = ["file_path", "pattern", "path", "glob", "query", "url"];
	return keys.flatMap((key) => {
		const value = input[key];
		if (typeof value === "string" && value.trim()) {
			return [`${key}=${value.trim()}`];
		}
		if (typeof value === "number" || typeof value === "boolean") {
			return [`${key}=${value}`];
		}
		return [];
	});
}

function collectClaudeToolCommands(value, output) {
	if (Array.isArray(value)) {
		value.forEach((entry) => collectClaudeToolCommands(entry, output));
		return;
	}
	if (!value || typeof value !== "object") {
		return;
	}
	collectToolUseCommand(value, output);
	for (const entry of Object.values(value)) {
		if (entry && typeof entry === "object") {
			collectClaudeToolCommands(entry, output);
		}
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
	addClaudeSubagentArtifactRefs(artifactRefs, result.stdout ?? "", options.workspace);
	const failure = claudeProcessFailure(result, testCase, options, durationMs, artifactRefs);
	if (failure) {
		return failure;
	}
	let observed;
	try {
		observed = parseClaudeOutput(result.stdout ?? "");
	} catch (error) {
		return backendFailureResult(testCase, `The claude_code runner did not produce valid JSON: ${error.message}`, durationMs, artifactRefs);
	}
	const telemetry = extractClaudeTelemetry(result.stdout ?? "", options);
	writeFileSync(outputFile, `${JSON.stringify(observed, null, 2)}\n`);
	artifactRefs.push(artifactRef("result", outputFile));
	return applyObservationExpectations(
		testCase,
		normalizeObservedResult(
			testCase,
			{
				...observed,
				...(telemetry ? {
					metrics: {
						total_tokens: telemetry.total_tokens,
						cost_usd: telemetry.cost_usd,
					},
					telemetry,
				} : {}),
			},
			durationMs,
			artifactRefs,
		),
		extractClaudeCommandText(result.stdout ?? "", { workspace: options.workspace }),
	);
}
