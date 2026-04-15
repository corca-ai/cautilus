import assert from "node:assert/strict";
import { mkdtempSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { spawnSync } from "node:child_process";
import test from "node:test";

import { enrichExperimentPrompt, excerptFileContent } from "./self-dogfood-experiment-prompt.mjs";

test("excerptFileContent keeps the self-dogfood command section for skill-surface prompts", () => {
	const content = [
		"# Cautilus",
		"",
		"Intro paragraph about the bundled skill.",
		"",
		"Run the explicit self-dogfood pass for this repo and refresh the latest local",
		"artifacts:",
		"",
		"```bash",
		"npm run dogfood:self",
		"```",
		"",
		"Run the self-dogfood tuning experiments without changing the canonical latest",
		"bundle:",
		"",
		"```bash",
		"npm run dogfood:self:experiments",
		"```",
		"",
		"When the job only needs to refresh the static HTML comparison view of the",
		"current latest experiments bundle, use:",
		"",
		"```bash",
		"npm run dogfood:self:experiments:html",
		"```",
	].join("\n");

	const excerpt = excerptFileContent(content, "self-dogfood-skill-surface");

	assert.match(excerpt, /npm run dogfood:self/);
	assert.match(excerpt, /npm run dogfood:self:experiments/);
	assert.match(excerpt, /npm run dogfood:self:experiments:html/);
	assert.ok(!excerpt.startsWith("# Cautilus"));
});

test("excerptFileContent prefers standing-gate claim lines for gate-honesty prompts", () => {
	const content = [
		"version: 1",
		"repo: cautilus",
		"evaluation_surfaces:",
		"  - deterministic self-consumer standing gate for the product repo",
		"full_gate_command_templates:",
		"  - npm run verify",
		"comparison_questions:",
		"  - Does the current deterministic self-consumer gate stay honest about what it actually proves for the product repo?",
		"human_review_prompts:",
		"  - id: operator",
		"    prompt: Where would an operator still conclude that the root standing gate overclaims beyond npm run verify and its listed product artifacts?",
	].join("\n");

	const excerpt = excerptFileContent(content, "self-dogfood-gate-honesty-a");

	assert.match(excerpt, /standing gate/);
	assert.match(excerpt, /npm run verify/);
	assert.match(excerpt, /overclaims/);
});

test("excerptFileContent surfaces timeout enforcement and published artifacts for review-completion prompts", () => {
	const content = [
		"function resolveReviewTimeoutMs(options, repoRoot) {",
		"\treturn adapterPayload.data.review_timeout_ms ?? DEFAULT_REVIEW_TIMEOUT_MS;",
		"}",
		"",
		"function runReviewVariants(repoRoot, workspace, reviewDir, modeReportPath, options) {",
		"\tconst result = runCautilus(repoRoot, args, options.quiet, options.reviewTimeoutMs);",
		"}",
		"",
		"function writeLatestArtifacts(latestDir, { summary, report, reviewSummary, latestMarkdown }) {",
		"\twriteFileSync(join(latestDir, \"summary.json\"), text, \"utf-8\");",
		"\twriteFileSync(join(latestDir, \"review-summary.json\"), text, \"utf-8\");",
		"}",
	].join("\n");

	const excerpt = excerptFileContent(content, "self-dogfood-review-completion");

	assert.match(excerpt, /resolveReviewTimeoutMs/);
	assert.match(excerpt, /runReviewVariants/);
	assert.match(excerpt, /review-summary\.json/);
});

function setupPromptEnv({
	adapterName,
	artifactBody = "stub artifact body for excerpt",
	promptInputExtras = {},
}) {
	const root = mkdtempSync(join(tmpdir(), `cautilus-prompt-shape-${adapterName}-`));
	mkdirSync(join(root, ".agents"), { recursive: true });
	const artifactAbs = join(root, ".agents", "cautilus-adapter.yaml");
	writeFileSync(artifactAbs, `${artifactBody}\n`, "utf-8");
	const promptPath = join(root, "review.prompt.md");
	const promptInputPath = join(root, "review-prompt-input.json");
	writeFileSync(promptPath, "# Prompt\n", "utf-8");
	writeFileSync(
		promptInputPath,
		`${JSON.stringify({
			repoRoot: root,
			artifactFiles: [
				{
					relativePath: ".agents/cautilus-adapter.yaml",
					absolutePath: artifactAbs,
					exists: true,
				},
			],
			...promptInputExtras,
		})}\n`,
		"utf-8",
	);
	return { root, promptPath, promptInputPath };
}

test("enrichExperimentPrompt always emits Experiment Context with adapter + timeout", () => {
	for (const adapterName of [
		"self-dogfood",
		"self-dogfood-gate-honesty-a",
		"self-dogfood-review-completion",
		"self-dogfood-binary-surface",
		"self-dogfood-skill-surface",
	]) {
		const { promptPath, promptInputPath } = setupPromptEnv({ adapterName });
		enrichExperimentPrompt({
			promptPath,
			promptInputPath,
			adapterName,
			reviewTimeoutMs: 45000,
		});
		const rendered = readFileSync(promptPath, "utf-8");
		assert.match(rendered, /## Experiment Context/, `missing section for ${adapterName}`);
		assert.match(rendered, new RegExp(`- adapter: ${adapterName}`));
		assert.match(rendered, /- bounded review timeout: 45000ms/);
	}
});

test("enrichExperimentPrompt emits adapter-specific guidance bullets per adapter", () => {
	const cases = [
		{
			adapterName: "self-dogfood",
			must: [
				/canonical operator-facing self-dogfood claim/,
				/gateRecommendation as the raw deterministic signal/,
				/ignore stale files under artifacts\/self-dogfood\/latest/,
			],
		},
		{
			adapterName: "self-dogfood-review-completion",
			must: [
				/bounded review surface can leave usable operator evidence/,
				/review-variant step, not to the standing full_gate/,
				/resolves adapter review_timeout_ms/,
			],
		},
		{
			adapterName: "self-dogfood-gate-honesty-a",
			must: [
				/honesty of the standing gate's narrow claim boundary/,
				/narrower and more evidence-proportional than the baseline/,
			],
		},
		{
			adapterName: "self-dogfood-binary-surface",
			must: [
				/standalone binary surface is discoverable/,
				/do not widen into bundled-skill or repo-wide quality claims/,
			],
		},
		{
			adapterName: "self-dogfood-skill-surface",
			must: [
				/operators can follow the skill path/,
			],
		},
	];
	for (const { adapterName, must } of cases) {
		const { promptPath, promptInputPath } = setupPromptEnv({ adapterName });
		enrichExperimentPrompt({
			promptPath,
			promptInputPath,
			adapterName,
			reviewTimeoutMs: 30000,
		});
		const rendered = readFileSync(promptPath, "utf-8");
		for (const pattern of must) {
			assert.match(rendered, pattern, `${adapterName}: missing bullet ${pattern}`);
		}
	}
});

test("enrichExperimentPrompt emits Current Run Evidence only for self-dogfood adapter", () => {
	const adapterName = "self-dogfood";
	const { promptPath, promptInputPath } = setupPromptEnv({
		adapterName,
		promptInputExtras: {
			currentReportEvidence: {
				reportFile: "/tmp/report.json",
				automatedRecommendation: "accept-now",
			},
		},
	});
	enrichExperimentPrompt({
		promptPath,
		promptInputPath,
		adapterName,
		reviewTimeoutMs: 30000,
		currentReportPath: "/tmp/current-report.json",
		projectedReportPath: "/tmp/projected-report.json",
		projectedReviewSummaryPath: "/tmp/projected-review-summary.json",
		projectedSummaryPath: "/tmp/projected-summary.json",
	});
	const rendered = readFileSync(promptPath, "utf-8");
	assert.match(rendered, /## Current Run Evidence/);
	assert.match(rendered, /- current report file: \/tmp\/current-report\.json/);
	assert.match(rendered, /- projected published report\.json: \/tmp\/projected-report\.json/);
	assert.match(rendered, /- projected review-summary\.json: \/tmp\/projected-review-summary\.json/);
	assert.match(rendered, /- projected summary\.json: \/tmp\/projected-summary\.json/);
	assert.match(rendered, /- current gateRecommendation: accept-now/);
	assert.match(
		rendered,
		/- summary\.json is written after this review from the current report plus your structured verdict\./,
	);
	assert.match(
		rendered,
		/published latest report\.json will embed selfDogfoodPublication/,
	);
	assert.match(
		rendered,
		/gateRecommendation should stay equal to the current automated recommendation/,
	);
	assert.match(
		rendered,
		/reportRecommendation should reflect the stronger of the deterministic gate result/,
	);
});

test("enrichExperimentPrompt falls back to n/a in Current Run Evidence when paths missing", () => {
	const adapterName = "self-dogfood";
	const { promptPath, promptInputPath } = setupPromptEnv({ adapterName });
	enrichExperimentPrompt({
		promptPath,
		promptInputPath,
		adapterName,
		reviewTimeoutMs: 30000,
	});
	const rendered = readFileSync(promptPath, "utf-8");
	assert.match(rendered, /- current report file: n\/a/);
	assert.match(rendered, /- projected published report\.json: n\/a/);
	assert.match(rendered, /- projected review-summary\.json: n\/a/);
	assert.match(rendered, /- projected summary\.json: n\/a/);
	assert.match(rendered, /- current gateRecommendation: n\/a/);
});

test("enrichExperimentPrompt omits Current Run Evidence for non-self-dogfood adapters", () => {
	for (const adapterName of [
		"self-dogfood-gate-honesty-a",
		"self-dogfood-review-completion",
		"self-dogfood-binary-surface",
		"self-dogfood-skill-surface",
	]) {
		const { promptPath, promptInputPath } = setupPromptEnv({ adapterName });
		enrichExperimentPrompt({
			promptPath,
			promptInputPath,
			adapterName,
			reviewTimeoutMs: 30000,
			currentReportPath: "/tmp/cur.json",
			projectedReportPath: "/tmp/proj.json",
			projectedReviewSummaryPath: "/tmp/rs.json",
			projectedSummaryPath: "/tmp/s.json",
		});
		const rendered = readFileSync(promptPath, "utf-8");
		assert.doesNotMatch(
			rendered,
			/## Current Run Evidence/,
			`${adapterName} must not emit Current Run Evidence section`,
		);
	}
});

test("enrichExperimentPrompt emits Inlined Artifact Excerpts when artifactFiles present", () => {
	const adapterName = "self-dogfood";
	const { promptPath, promptInputPath, root } = setupPromptEnv({
		adapterName,
		artifactBody: "self-dogfood marker line for adapter excerpt",
	});
	enrichExperimentPrompt({
		promptPath,
		promptInputPath,
		adapterName,
		reviewTimeoutMs: 30000,
	});
	const rendered = readFileSync(promptPath, "utf-8");
	assert.match(rendered, /## Inlined Artifact Excerpts/);
	assert.match(rendered, /Use these excerpts as the primary evidence/);
	assert.match(
		rendered,
		new RegExp(`### ${join(root, ".agents", "cautilus-adapter.yaml").replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}`),
	);
	assert.match(rendered, /```text[\s\S]+?self-dogfood marker line/);
});

test("enrichExperimentPrompt omits Inlined Artifact Excerpts when no artifactFiles present", () => {
	const adapterName = "self-dogfood";
	const root = mkdtempSync(join(tmpdir(), "cautilus-prompt-shape-empty-"));
	const promptPath = join(root, "review.prompt.md");
	const promptInputPath = join(root, "review-prompt-input.json");
	writeFileSync(promptPath, "# Prompt\n", "utf-8");
	writeFileSync(
		promptInputPath,
		`${JSON.stringify({ repoRoot: root, artifactFiles: [] })}\n`,
		"utf-8",
	);
	enrichExperimentPrompt({
		promptPath,
		promptInputPath,
		adapterName,
		reviewTimeoutMs: 30000,
	});
	const rendered = readFileSync(promptPath, "utf-8");
	assert.doesNotMatch(rendered, /## Inlined Artifact Excerpts/);
});

test("enrichExperimentPrompt omits Baseline Artifact Excerpts for non gate-honesty-b adapters", () => {
	for (const adapterName of [
		"self-dogfood",
		"self-dogfood-gate-honesty-a",
		"self-dogfood-review-completion",
		"self-dogfood-binary-surface",
		"self-dogfood-skill-surface",
	]) {
		const { promptPath, promptInputPath } = setupPromptEnv({ adapterName });
		enrichExperimentPrompt({
			promptPath,
			promptInputPath,
			adapterName,
			reviewTimeoutMs: 30000,
		});
		const rendered = readFileSync(promptPath, "utf-8");
		assert.doesNotMatch(
			rendered,
			/## Baseline Artifact Excerpts/,
			`${adapterName} must not emit Baseline Artifact Excerpts section`,
		);
	}
});

test("enrichExperimentPrompt inlines baseline excerpts for gate-honesty-b", () => {
	const root = mkdtempSync(join(tmpdir(), "cautilus-gate-honesty-baseline-"));
	mkdirSync(join(root, ".agents"), { recursive: true });
	mkdirSync(join(root, "docs", "specs"), { recursive: true });
	writeFileSync(
		join(root, ".agents", "cautilus-adapter.yaml"),
		[
			"version: 1",
			"evaluation_surfaces:",
			"  - standalone binary and bundled skill self-consumer gate",
			"full_gate_command_templates:",
			"  - npm run verify",
		].join("\n"),
		"utf-8",
	);
	writeFileSync(join(root, "README.md"), "`npm run verify` proves a broader self-consumer gate.\n", "utf-8");
	writeFileSync(
		join(root, "docs", "specs", "self-dogfood.spec.md"),
		"canonical latest report의 claim은 좁아야 한다.\n",
		"utf-8",
	);
	spawnSync("git", ["init", "-b", "main"], { cwd: root, encoding: "utf-8" });
	spawnSync("git", ["config", "user.name", "Test User"], { cwd: root, encoding: "utf-8" });
	spawnSync("git", ["config", "user.email", "test@example.com"], { cwd: root, encoding: "utf-8" });
	spawnSync("git", ["add", "."], { cwd: root, encoding: "utf-8" });
	spawnSync("git", ["commit", "-m", "baseline"], { cwd: root, encoding: "utf-8" });

	writeFileSync(
		join(root, ".agents", "cautilus-adapter.yaml"),
		[
			"version: 1",
			"evaluation_surfaces:",
			"  - deterministic self-consumer standing gate for the product repo",
			"full_gate_command_templates:",
			"  - npm run verify",
		].join("\n"),
		"utf-8",
	);

	const promptPath = join(root, "review.prompt.md");
	const promptInputPath = join(root, "review-prompt-input.json");
	writeFileSync(promptPath, "# Prompt\n", "utf-8");
	writeFileSync(
		promptInputPath,
		`${JSON.stringify({
			repoRoot: root,
			baseline: "main",
			artifactFiles: [
				{
					relativePath: ".agents/cautilus-adapter.yaml",
					absolutePath: join(root, ".agents", "cautilus-adapter.yaml"),
					exists: true,
				},
			],
		})}\n`,
		"utf-8",
	);

	enrichExperimentPrompt({
		promptPath,
		promptInputPath,
		adapterName: "self-dogfood-gate-honesty-b",
		reviewTimeoutMs: 30000,
	});

	const rendered = readFileSync(promptPath, "utf-8");
	assert.match(rendered, /## Baseline Artifact Excerpts \(main\)/);
	assert.match(rendered, /main:\.agents\/cautilus-adapter\.yaml/);
	assert.match(rendered, /standalone binary and bundled skill self-consumer gate/);
	assert.match(rendered, /deterministic self-consumer standing gate for the product repo/);
});
