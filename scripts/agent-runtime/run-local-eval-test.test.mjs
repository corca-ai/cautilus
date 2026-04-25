import assert from "node:assert/strict";
import { existsSync, mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";

import {
	buildObservedInstructionSurfaceInput,
	codexArgs,
} from "./run-local-eval-test.mjs";
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
	const artifactDir = mkdtempSync(join(tmpdir(), "cautilus-eval-"));
	const workspace = createInstructionSurfaceWorkspace();
	const casesFile = join(artifactDir, "eval-cases.json");
	const fixtureResultsFile = join(artifactDir, "fixture-results.json");
	writeFileSync(casesFile, JSON.stringify({
		schemaVersion: "cautilus.evaluation_cases.v1",
		suiteId: "eval-demo",
		evaluations: [
			{
				evaluationId: "checked-in-agents-routing",
				prompt: "Read the repo instructions first and decide how to route this task.",
				expectedEntryFile: "AGENTS.md",
				requiredInstructionFiles: ["AGENTS.md"],
				expectedRouting: { selectedSkill: "none" },
			},
		],
	}));
	writeFileSync(fixtureResultsFile, JSON.stringify({
		"checked-in-agents-routing": {
			observationStatus: "observed",
			summary: "Started from AGENTS.md and kept routing narrow.",
			entryFile: "AGENTS.md",
			loadedInstructionFiles: ["AGENTS.md"],
			loadedSupportingFiles: [],
			routingDecision: { selectedSkill: "none" },
		},
	}));
	const packet = buildObservedInstructionSurfaceInput({
		repoRoot: process.cwd(),
		workspace,
		casesFile,
		artifactDir,
		backend: "fixture",
		fixtureResultsFile,
	});
	assert.equal(packet.schemaVersion, "cautilus.evaluation_observed.v1");
	assert.equal(packet.suiteId, "eval-demo");
	assert.equal(packet.evaluations.length, 1);
	assert.equal(packet.evaluations[0].evaluationId, "checked-in-agents-routing");
	assert.equal(packet.evaluations[0].expectedEntryFile, "AGENTS.md");
	assert.equal(packet.evaluations[0].loadedInstructionFiles[0], "AGENTS.md");
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
			codexSessionMode: "ephemeral",
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

test("codexArgs omits --ephemeral when session mode is persistent", () => {
	assert.deepEqual(
		codexArgs({
			workspace: "/repo",
			sandbox: "read-only",
			codexSessionMode: "persistent",
			codexConfigOverrides: [],
		}, "/tmp/schema.json", "/tmp/result.json"),
		[
			"exec",
			"-C",
			"/repo",
			"--sandbox",
			"read-only",
			"--output-schema",
			"/tmp/schema.json",
			"-o",
			"/tmp/result.json",
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

test("materializeInstructionSurface materializes a symlink entry and restores the original alias", () => {
	const artifactDir = mkdtempSync(join(tmpdir(), "cautilus-instruction-surface-"));
	const workspace = createInstructionSurfaceWorkspace();
	const originalAgents = readFileSync(join(workspace, "AGENTS.md"), "utf-8");
	const materialized = materializeInstructionSurface(
		{
			workspace,
			casesFile: join(workspace, "fixtures", "instruction-surface", "cases.json"),
		},
		{
			instructionSurface: {
				surfaceLabel: "claude_symlink",
				files: [
					{ path: "CLAUDE.md", content: "# CLAUDE\n\nUse discovery-first routing.\n" },
					{ path: "AGENTS.md", kind: "symlink", targetPath: "CLAUDE.md" },
				],
			},
		},
		artifactDir,
	);
	try {
		assert.equal(readFileSync(join(workspace, "AGENTS.md"), "utf-8"), "# CLAUDE\n\nUse discovery-first routing.\n");
		assert.equal(readFileSync(join(workspace, "CLAUDE.md"), "utf-8"), "# CLAUDE\n\nUse discovery-first routing.\n");
		const symlinkEntry = materialized.instructionSurface.files.find((file) => file.kind === "symlink");
		assert.equal(symlinkEntry.targetPath, "CLAUDE.md");
		assert.equal(symlinkEntry.sourceKind, "inline_symlink");
	} finally {
		materialized.restore();
	}
	assert.equal(readFileSync(join(workspace, "AGENTS.md"), "utf-8"), originalAgents);
});

test("materializeInstructionSurface writes nested instruction overrides under scoped subtrees", () => {
	const artifactDir = mkdtempSync(join(tmpdir(), "cautilus-instruction-surface-"));
	const workspace = createInstructionSurfaceWorkspace();
	const materialized = materializeInstructionSurface(
		{
			workspace,
			casesFile: join(workspace, "fixtures", "instruction-surface", "cases.json"),
		},
		{
			instructionSurface: {
				surfaceLabel: "nested_override",
				files: [
					{ path: "AGENTS.md", content: "# AGENTS\n\nRead nested overrides.\n" },
					{ path: "apps/demo/AGENTS.md", content: "# Nested AGENTS\n\nUse discovery-first routing inside apps/demo.\n" },
				],
			},
		},
		artifactDir,
	);
	try {
		assert.equal(readFileSync(join(workspace, "AGENTS.md"), "utf-8"), "# AGENTS\n\nRead nested overrides.\n");
		assert.equal(readFileSync(join(workspace, "apps/demo/AGENTS.md"), "utf-8"), "# Nested AGENTS\n\nUse discovery-first routing inside apps/demo.\n");
	} finally {
		materialized.restore();
	}
	assert.equal(existsSync(join(workspace, "apps/demo/AGENTS.md")), false);
});

test("materializeInstructionSurface writes linked progressive-disclosure docs that remain after the run", () => {
	const artifactDir = mkdtempSync(join(tmpdir(), "cautilus-instruction-surface-"));
	const workspace = createInstructionSurfaceWorkspace();
	const materialized = materializeInstructionSurface(
		{
			workspace,
			casesFile: join(workspace, "fixtures", "instruction-surface", "cases.json"),
		},
		{
			instructionSurface: {
				surfaceLabel: "linked_progressive_doc",
				files: [
					{ path: "AGENTS.md", content: "# AGENTS\n\nRead docs/internal/routing-note.md when routing.\n" },
					{ path: "docs/internal/routing-note.md", content: "# Routing Note\n\nPrefer discovery-first routing.\n" },
				],
			},
		},
		artifactDir,
	);
	try {
		assert.equal(readFileSync(join(workspace, "docs/internal/routing-note.md"), "utf-8"), "# Routing Note\n\nPrefer discovery-first routing.\n");
	} finally {
		materialized.restore();
	}
	assert.equal(existsSync(join(workspace, "docs/internal/routing-note.md")), false);
});

test("relativizeObservedPath keeps workspace-relative evidence stable", () => {
	const workspace = "/tmp/cautilus-candidate";
	assert.equal(relativizeObservedPath(workspace, "/tmp/cautilus-candidate/AGENTS.md"), "AGENTS.md");
	assert.equal(relativizeObservedPath(workspace, "/tmp/cautilus-candidate/docs/internal/routing-note.md"), "docs/internal/routing-note.md");
	assert.equal(relativizeObservedPath(workspace, "/outside/README.md"), "/outside/README.md");
});
