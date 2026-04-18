import assert from "node:assert/strict";
import { existsSync, mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";

import {
	buildObservedInstructionSurfaceInput,
	codexArgs,
} from "./run-local-instruction-surface-test.mjs";
import {
	materializeInstructionSurface,
	normalizeRoutingDecision,
	relativizeObservedPath,
} from "./instruction-surface-support.mjs";

function createInstructionSurfaceWorkspace() {
	const workspace = mkdtempSync(join(tmpdir(), "cautilus-instruction-surface-workspace-"));
	const agents = readFileSync(join(process.cwd(), "AGENTS.md"), "utf-8");
	writeFileSync(join(workspace, "AGENTS.md"), agents);
	writeFileSync(join(workspace, "CLAUDE.md"), agents);
	return workspace;
}

test("buildObservedInstructionSurfaceInput materializes fixture-backed instruction-surface observations", () => {
	const artifactDir = mkdtempSync(join(tmpdir(), "cautilus-instruction-surface-"));
	const workspace = createInstructionSurfaceWorkspace();
	const packet = buildObservedInstructionSurfaceInput({
		repoRoot: process.cwd(),
		workspace,
		casesFile: join(process.cwd(), "fixtures", "instruction-surface", "cases.json"),
		artifactDir,
		backend: "fixture",
		fixtureResultsFile: join(process.cwd(), "fixtures", "instruction-surface", "fixture-results.json"),
	});
	assert.equal(packet.schemaVersion, "cautilus.instruction_surface_inputs.v1");
	assert.equal(packet.suiteId, "instruction-surface-demo");
	assert.equal(packet.evaluations.length, 5);
	assert.equal(packet.evaluations[0].expectedEntryFile, "AGENTS.md");
	assert.equal(packet.evaluations[1].instructionSurface.surfaceLabel, "claude_only");
	assert.equal(packet.evaluations[3].loadedInstructionFiles[0], "AGENTS.md");
	assert.equal(packet.evaluations[4].instructionSurface.files[1].kind, "symlink");
	assert.equal(packet.evaluations[4].instructionSurface.files[1].targetPath, "CLAUDE.md");
	assert.equal(readFileSync(join(workspace, "AGENTS.md"), "utf-8"), readFileSync(join(process.cwd(), "AGENTS.md"), "utf-8"));
});

test("codexArgs applies runtime-specific model, effort, and config overrides", () => {
	assert.deepEqual(
		codexArgs({
			workspace: "/repo",
			sandbox: "workspace-write",
			model: "gpt-5.4",
			reasoningEffort: "high",
			codexModel: "gpt-5.4-mini",
			codexReasoningEffort: "low",
			codexConfigOverrides: [
				"project_doc_max_bytes=0",
				"include_apps_instructions=false",
			],
		}, "/tmp/schema.json", "/tmp/result.json"),
		[
			"exec",
			"-C",
			"/repo",
			"--sandbox",
			"workspace-write",
			"--ephemeral",
			"--output-schema",
			"/tmp/schema.json",
			"-o",
			"/tmp/result.json",
			"--model",
			"gpt-5.4-mini",
			"-c",
			"model_reasoning_effort=\"low\"",
			"-c",
			"project_doc_max_bytes=0",
			"-c",
			"include_apps_instructions=false",
			"-",
		],
	);
});

test("normalizeRoutingDecision canonicalizes deferred none values and tool prefixes", () => {
	assert.deepEqual(
		normalizeRoutingDecision({
			selectedSkill: "impl",
			bootstrapHelper: "find-skills",
			workSkill: "impl",
			selectedSupport: "none",
			firstToolCall: "functions.exec_command: rg --files .",
			reasonSummary: "route first",
		}),
		{
			selectedSkill: "impl",
			bootstrapHelper: "find-skills",
			workSkill: "impl",
			selectedSupport: "none",
			firstToolCall: "functions.exec_command",
			reasonSummary: "route first",
		},
	);
});

test("materializeInstructionSurface masks unspecified root aliases while a variant is active", () => {
	const artifactDir = mkdtempSync(join(tmpdir(), "cautilus-instruction-surface-"));
	const workspace = createInstructionSurfaceWorkspace();
	const originalAgents = readFileSync(join(workspace, "AGENTS.md"), "utf-8");
	const hadClaude = existsSync(join(workspace, "CLAUDE.md"));
	const originalClaudeTarget = hadClaude ? readFileSync(join(workspace, "CLAUDE.md"), "utf-8") : null;
	const materialized = materializeInstructionSurface(
		{
			workspace,
			casesFile: join(workspace, "fixtures", "instruction-surface", "cases.json"),
		},
		{
			instructionSurface: {
				surfaceLabel: "claude_only",
				files: [
					{
						path: "CLAUDE.md",
						content: "# CLAUDE\n\nUse discovery-first routing.\n",
					},
				],
			},
		},
		artifactDir,
	);
	try {
		assert.equal(readFileSync(join(workspace, "CLAUDE.md"), "utf-8"), "# CLAUDE\n\nUse discovery-first routing.\n");
		assert.throws(() => readFileSync(join(workspace, "AGENTS.md"), "utf-8"));
	} finally {
		materialized.restore();
	}
	assert.equal(readFileSync(join(workspace, "AGENTS.md"), "utf-8"), originalAgents);
	if (hadClaude) {
		assert.equal(readFileSync(join(workspace, "CLAUDE.md"), "utf-8"), originalClaudeTarget);
	} else {
		assert.equal(existsSync(join(workspace, "CLAUDE.md")), false);
	}
});

test("relativizeObservedPath keeps workspace-relative evidence stable", () => {
	const workspace = "/tmp/cautilus-candidate";
	assert.equal(relativizeObservedPath(workspace, "/tmp/cautilus-candidate/AGENTS.md"), "AGENTS.md");
	assert.equal(relativizeObservedPath(workspace, "/tmp/cautilus-candidate/docs/internal/routing-note.md"), "docs/internal/routing-note.md");
	assert.equal(relativizeObservedPath(workspace, "/outside/README.md"), "/outside/README.md");
});
