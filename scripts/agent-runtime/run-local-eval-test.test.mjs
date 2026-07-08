import assert from "node:assert/strict";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, symlinkSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";

import {
	buildObservedInstructionSurfaceInput,
	codexFailureBlockerKind,
	codexArgs,
	prepareCodexRuntimeEnv,
	renderPrompt,
} from "./run-local-eval-test.mjs";
import {
	backendFailureResult,
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

test("renderPrompt explains how prompt-provided root instructions map to AGENTS.md", () => {
	const prompt = renderPrompt({
		prompt: "User request: continue from docs/internal/handoff.md and implement the next slice.",
	});
	assert.match(prompt, /report the root instruction artifact path as the entry file/);
	assert.match(prompt, /that artifact path is AGENTS\.md/);
	assert.match(prompt, /Do not report a user-referenced task document as the entry file/);
});

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
				prompt: "User request: continue from docs/internal/handoff.md and implement the next slice. Read the repo instructions first, then identify both the startup bootstrap helper and the durable work skill you would use for this implementation task.",
				expectedEntryFile: "AGENTS.md",
				requiredInstructionFiles: ["AGENTS.md"],
				allowedFirstToolCalls: ["none", "functions.exec_command"],
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
	assert.deepEqual(packet.evaluations[0].allowedFirstToolCalls, ["none", "functions.exec_command"]);
	assert.equal(packet.evaluations[0].loadedInstructionFiles[0], "AGENTS.md");
	assert.equal(packet.evaluations[0].telemetry, undefined);
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

test("codexArgs keeps user config so the isolated home's provisioned skill surface loads", () => {
	// The isolated CODEX_HOME is provisioned with the installed plugin surface and a
	// copied config.toml (see provisionInstalledSkillSurface), so codex must read that
	// config rather than ignore it -- otherwise the agent under test loses its skills.
	assert.deepEqual(
		codexArgs({
			workspace: "/repo",
			sandbox: "read-only",
			codexSessionMode: "ephemeral",
			codexHomeMode: "isolated",
			codexConfigOverrides: [],
		}, "/tmp/schema.json", "/tmp/result.json"),
		[
			"exec",
			"-C",
			"/repo",
			"--sandbox",
			"read-only",
			"--ephemeral",
			"--output-schema",
			"/tmp/schema.json",
			"-o",
			"/tmp/result.json",
			"-",
		],
	);
});

test("prepareCodexRuntimeEnv provisions auth plus the installed skill surface into an isolated Codex home", () => {
	const tempRoot = mkdtempSync(join(tmpdir(), "cautilus-codex-home-"));
	const sourceHome = join(tempRoot, "source-home");
	const outputDir = join(tempRoot, "output");
	mkdirSync(sourceHome, { recursive: true });
	mkdirSync(outputDir, { recursive: true });
	mkdirSync(join(sourceHome, "plugins", "charness"), { recursive: true });
	writeFileSync(join(sourceHome, "plugins", "charness", "marker.txt"), "installed\n");
	writeFileSync(join(sourceHome, "auth.json"), "{\"token\":\"test\"}\n");
	writeFileSync(join(sourceHome, "config.toml"), "[plugins.\"charness@local\"]\nenabled = true\n");

	const prepared = prepareCodexRuntimeEnv(
		{ codexHomeMode: "isolated", codexAuthMode: "inherit" },
		{ CODEX_HOME: sourceHome, PATH: "/usr/bin" },
	);

	assert.equal(prepared.preflightBlocker, null);
	assert.equal(prepared.env.CODEX_HOME.startsWith(outputDir), false);
	assert.equal(readFileSync(join(prepared.env.CODEX_HOME, "auth.json"), "utf-8"), "{\"token\":\"test\"}\n");
	// The installed plugin/skill surface and its enablement config carry over so the
	// agent under test keeps the skills the repo treats as installed (e.g. charness).
	assert.equal(
		readFileSync(join(prepared.env.CODEX_HOME, "config.toml"), "utf-8"),
		"[plugins.\"charness@local\"]\nenabled = true\n",
	);
	assert.equal(readFileSync(join(prepared.env.CODEX_HOME, "plugins", "charness", "marker.txt"), "utf-8"), "installed\n");
	prepared.cleanup();
	assert.equal(existsSync(prepared.env.CODEX_HOME), false);
});

test("prepareCodexRuntimeEnv reports runner_auth_missing before isolated Codex runs", () => {
	const tempRoot = mkdtempSync(join(tmpdir(), "cautilus-codex-home-missing-"));
	const prepared = prepareCodexRuntimeEnv(
		{ codexHomeMode: "isolated", codexAuthMode: "inherit" },
		{ CODEX_HOME: join(tempRoot, "empty-home"), PATH: "/usr/bin" },
	);

	assert.equal(prepared.env.CODEX_HOME.startsWith(join(tempRoot, "output")), false);
	assert.equal(prepared.preflightBlocker.blockerKind, "runner_auth_missing");
	assert.match(prepared.preflightBlocker.summary, /cannot authenticate/);
	prepared.cleanup();
	assert.equal(existsSync(prepared.env.CODEX_HOME), false);
});

test("prepareCodexRuntimeEnv keeps the inherited Codex home untouched when auth is available", () => {
	const baseEnv = { CODEX_HOME: "/home/user/.codex", OPENAI_API_KEY: "test-key", PATH: "/usr/bin" };
	const prepared = prepareCodexRuntimeEnv({ codexHomeMode: "inherit", codexAuthMode: "env" }, baseEnv);

	assert.equal(prepared.preflightBlocker, null);
	assert.equal(prepared.cleanup, null);
	assert.equal(prepared.env, baseEnv);
});

test("prepareCodexRuntimeEnv reports runner_auth_missing for env auth mode without OPENAI_API_KEY", () => {
	const inherited = prepareCodexRuntimeEnv(
		{ codexHomeMode: "inherit", codexAuthMode: "env" },
		{ CODEX_HOME: "/home/user/.codex", PATH: "/usr/bin" },
	);
	assert.equal(inherited.preflightBlocker.blockerKind, "runner_auth_missing");
	assert.match(inherited.preflightBlocker.summary, /OPENAI_API_KEY is not set/);
	assert.equal(inherited.cleanup, null);

	const tempRoot = mkdtempSync(join(tmpdir(), "cautilus-codex-env-auth-"));
	const isolated = prepareCodexRuntimeEnv(
		{ codexHomeMode: "isolated", codexAuthMode: "env" },
		{ CODEX_HOME: join(tempRoot, "empty-home"), PATH: "/usr/bin" },
	);
	assert.equal(isolated.preflightBlocker.blockerKind, "runner_auth_missing");
	assert.match(isolated.preflightBlocker.summary, /OPENAI_API_KEY is not set/);
	isolated.cleanup();
	assert.equal(existsSync(isolated.env.CODEX_HOME), false);
});

test("codexFailureBlockerKind classifies 401 auth stderr separately", () => {
	assert.equal(
		codexFailureBlockerKind("ERROR: unexpected status 401 Unauthorized: Missing bearer or basic authentication in header"),
		"runner_auth_missing",
	);
	assert.equal(codexFailureBlockerKind("process exited with code 2"), "runner_execution_failed");
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
	assert.equal(
		normalizeRoutingDecision({
			firstToolCall: "exec_command: sed -n '1,220p' AGENTS.md",
		}).firstToolCall,
		"functions.exec_command",
	);
});

test("normalizeRoutingDecision rejects malformed routing records", () => {
	assert.deepEqual(normalizeRoutingDecision(null), {});
	assert.throws(() => normalizeRoutingDecision("impl"), /observed\.routingDecision must be an object/);
	assert.throws(
		() => normalizeRoutingDecision({ selectedSkill: ["impl"] }),
		/observed\.routingDecision\.selectedSkill must be a string/,
	);
});

test("backendFailureResult records a blocked no-routing observation", () => {
	assert.deepEqual(backendFailureResult("runner failed", "runner_auth_missing"), {
		observationStatus: "blocked",
		blockerKind: "runner_auth_missing",
		summary: "runner failed",
		loadedInstructionFiles: [],
		loadedSupportingFiles: [],
		routingDecision: {
			selectedSkill: "none",
			bootstrapHelper: "none",
			workSkill: "none",
			selectedSupport: "none",
			firstToolCall: "none",
			reasonSummary: "runner failed",
		},
	});
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

test("materializeInstructionSurface reads instruction content from a source file", () => {
	const artifactDir = mkdtempSync(join(tmpdir(), "cautilus-instruction-surface-"));
	const workspace = createInstructionSurfaceWorkspace();
	const casesDir = join(artifactDir, "cases");
	mkdirSync(casesDir, { recursive: true });
	const sourceFile = join(casesDir, "agent-source.md");
	writeFileSync(sourceFile, "# AGENTS\n\nLoaded from fixture source.\n", "utf-8");
	const materialized = materializeInstructionSurface(
		{
			workspace,
			casesFile: join(casesDir, "cases.json"),
		},
		{
			instructionSurface: {
				surfaceLabel: "source_file_surface",
				files: [
					{ path: "AGENTS.md", sourceFile: "agent-source.md" },
				],
			},
		},
		artifactDir,
	);
	try {
		assert.equal(readFileSync(join(workspace, "AGENTS.md"), "utf-8"), "# AGENTS\n\nLoaded from fixture source.\n");
		assert.equal(materialized.instructionSurface.files[0].sourceKind, "source_file");
		assert.equal(materialized.instructionSurface.files[0].sourceFile, sourceFile);
		assert.equal(materialized.artifactRefs.some((ref) => ref.kind === "instruction_surface_source" && ref.path === sourceFile), true);
	} finally {
		materialized.restore();
	}
});

test("materializeInstructionSurface rejects paths that escape or target directories", () => {
	const artifactDir = mkdtempSync(join(tmpdir(), "cautilus-instruction-surface-"));
	const workspace = createInstructionSurfaceWorkspace();
	assert.throws(
		() => materializeInstructionSurface(
			{ workspace, casesFile: join(workspace, "cases.json") },
			{ instructionSurface: { surfaceLabel: "escape", files: [{ path: "../AGENTS.md", content: "escape" }] } },
			artifactDir,
		),
		/instruction surface path escapes workspace/,
	);
	mkdirSync(join(workspace, "docs"), { recursive: true });
	assert.throws(
		() => materializeInstructionSurface(
			{ workspace, casesFile: join(workspace, "cases.json") },
			{ instructionSurface: { surfaceLabel: "directory", files: [{ path: "docs", content: "directory" }] } },
			artifactDir,
		),
		/instruction surface path points to a directory/,
	);
});

test("materializeInstructionSurface captures default symlink instructions and skips directories", () => {
	const artifactDir = mkdtempSync(join(tmpdir(), "cautilus-instruction-surface-"));
	const workspace = mkdtempSync(join(tmpdir(), "cautilus-instruction-surface-workspace-"));
	mkdirSync(join(workspace, "AGENTS.md"));
	writeFileSync(join(workspace, "README.md"), "# Linked Instructions\n", "utf-8");
	symlinkSync("README.md", join(workspace, "CLAUDE.md"));
	const materialized = materializeInstructionSurface(
		{ workspace, casesFile: join(workspace, "cases.json") },
		{},
		artifactDir,
	);
	assert.equal(materialized.instructionSurface.files.length, 1);
	assert.equal(materialized.instructionSurface.files[0].path, "CLAUDE.md");
	assert.equal(materialized.instructionSurface.files[0].kind, "symlink");
	assert.equal(materialized.instructionSurface.files[0].targetPath, "README.md");
	assert.equal(materialized.artifactRefs.length, 1);
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
