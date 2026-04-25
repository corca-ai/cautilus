import assert from "node:assert/strict";
import test from "node:test";

import { normalizeInstructionSurfaceCaseSuite } from "./instruction-surface-case-suite.mjs";

const SCHEMA = "cautilus.instruction_surface_cases.v1";

function normalize(evaluation) {
	return normalizeInstructionSurfaceCaseSuite({
		schemaVersion: SCHEMA,
		suiteId: "demo",
		evaluations: [evaluation],
	}).evaluations[0];
}

test("normalize accepts a minimal evaluation and defaults displayName to evaluationId", () => {
	const evaluated = normalize({
		evaluationId: "minimal",
		prompt: "Read the repo instructions and route this task.",
	});
	assert.equal(evaluated.evaluationId, "minimal");
	assert.equal(evaluated.displayName, "minimal");
	assert.deepEqual(evaluated.requiredInstructionFiles, []);
	assert.equal(evaluated.expectedEntryFile, undefined);
	assert.equal(evaluated.expectedRouting, undefined);
	assert.equal(evaluated.instructionSurface, undefined);
});

test("normalize carries optional task path, file expectations, and expected routing", () => {
	const evaluated = normalize({
		evaluationId: "scoped",
		displayName: "Scoped task",
		prompt: "Route the scoped task.",
		taskPath: "apps/demo",
		expectedEntryFile: "AGENTS.md",
		requiredInstructionFiles: ["AGENTS.md", "apps/demo/AGENTS.md"],
		forbiddenInstructionFiles: ["legacy/AGENTS.md"],
		requiredSupportingFiles: ["docs/internal/routing-note.md"],
		forbiddenSupportingFiles: ["docs/internal/secret-note.md"],
		expectedRouting: {
			selectedSkill: "none",
			bootstrapHelper: "find-skills",
			workSkill: "impl",
			selectedSupport: "none",
			firstToolCallPattern: "exec_command",
		},
	});
	assert.equal(evaluated.displayName, "Scoped task");
	assert.equal(evaluated.taskPath, "apps/demo");
	assert.equal(evaluated.expectedEntryFile, "AGENTS.md");
	assert.deepEqual(evaluated.requiredInstructionFiles, ["AGENTS.md", "apps/demo/AGENTS.md"]);
	assert.deepEqual(evaluated.forbiddenInstructionFiles, ["legacy/AGENTS.md"]);
	assert.deepEqual(evaluated.requiredSupportingFiles, ["docs/internal/routing-note.md"]);
	assert.deepEqual(evaluated.forbiddenSupportingFiles, ["docs/internal/secret-note.md"]);
	assert.deepEqual(evaluated.expectedRouting, {
		selectedSkill: "none",
		bootstrapHelper: "find-skills",
		workSkill: "impl",
		selectedSupport: "none",
		firstToolCallPattern: "exec_command",
	});
});

test("normalize carries inline-file instruction surfaces with default kind", () => {
	const evaluated = normalize({
		evaluationId: "inline",
		prompt: "Route the inline surface.",
		instructionSurface: {
			surfaceLabel: "claude_only",
			files: [
				{ path: "CLAUDE.md", content: "# CLAUDE\n\nUse discovery-first routing.\n" },
			],
		},
	});
	assert.equal(evaluated.instructionSurface.surfaceLabel, "claude_only");
	assert.equal(evaluated.instructionSurface.files[0].path, "CLAUDE.md");
	assert.equal(evaluated.instructionSurface.files[0].kind, "file");
	assert.equal(evaluated.instructionSurface.files[0].content, "# CLAUDE\n\nUse discovery-first routing.\n");
});

test("normalize carries source-file instruction surface entries", () => {
	const evaluated = normalize({
		evaluationId: "source",
		prompt: "Route the source surface.",
		instructionSurface: {
			files: [
				{ path: "AGENTS.md", sourceFile: "fixtures/some-agents.md" },
			],
		},
	});
	assert.equal(evaluated.instructionSurface.files[0].sourceFile, "fixtures/some-agents.md");
	assert.equal(evaluated.instructionSurface.files[0].content, undefined);
});

test("normalize carries symlink instruction surface entries", () => {
	const evaluated = normalize({
		evaluationId: "symlink",
		prompt: "Route the symlink surface.",
		instructionSurface: {
			files: [
				{ path: "CLAUDE.md", content: "# CLAUDE\n" },
				{ path: "AGENTS.md", kind: "symlink", targetPath: "CLAUDE.md" },
			],
		},
	});
	assert.equal(evaluated.instructionSurface.files[1].kind, "symlink");
	assert.equal(evaluated.instructionSurface.files[1].targetPath, "CLAUDE.md");
	assert.equal(evaluated.instructionSurface.files[1].content, undefined);
});

test("normalize rejects unknown schemaVersion", () => {
	assert.throws(() => normalizeInstructionSurfaceCaseSuite({
		schemaVersion: "wrong",
		suiteId: "demo",
		evaluations: [{ evaluationId: "x", prompt: "y" }],
	}), /schemaVersion must be cautilus\.instruction_surface_cases\.v1/);
});

test("normalize rejects empty evaluations array", () => {
	assert.throws(() => normalizeInstructionSurfaceCaseSuite({
		schemaVersion: SCHEMA,
		suiteId: "demo",
		evaluations: [],
	}), /evaluations must be a non-empty array/);
});

test("normalize rejects file entries that declare neither content nor sourceFile", () => {
	assert.throws(() => normalize({
		evaluationId: "bad",
		prompt: "Route the bad surface.",
		instructionSurface: {
			files: [{ path: "AGENTS.md" }],
		},
	}), /content/);
});

test("normalize rejects symlink entries that omit targetPath", () => {
	assert.throws(() => normalize({
		evaluationId: "bad-symlink",
		prompt: "Route the broken symlink surface.",
		instructionSurface: {
			files: [{ path: "AGENTS.md", kind: "symlink" }],
		},
	}), /targetPath/);
});
