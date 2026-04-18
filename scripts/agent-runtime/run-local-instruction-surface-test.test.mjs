import assert from "node:assert/strict";
import { mkdtempSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";

import {
	buildObservedInstructionSurfaceInput,
	codexArgs,
} from "./run-local-instruction-surface-test.mjs";

test("buildObservedInstructionSurfaceInput materializes fixture-backed instruction-surface observations", () => {
	const artifactDir = mkdtempSync(join(tmpdir(), "cautilus-instruction-surface-"));
	const originalAgents = readFileSync(join(process.cwd(), "AGENTS.md"), "utf-8");
	const packet = buildObservedInstructionSurfaceInput({
		repoRoot: process.cwd(),
		workspace: process.cwd(),
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
	assert.equal(packet.evaluations[3].loadedSupportingFiles[0], "docs/internal/routing-note.md");
	assert.equal(packet.evaluations[4].instructionSurface.files[1].kind, "symlink");
	assert.equal(packet.evaluations[4].instructionSurface.files[1].targetPath, "CLAUDE.md");
	assert.equal(readFileSync(join(process.cwd(), "AGENTS.md"), "utf-8"), originalAgents);
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
