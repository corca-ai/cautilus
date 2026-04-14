import assert from "node:assert/strict";
import test from "node:test";

import { excerptFileContent } from "./self-dogfood-experiment-prompt.mjs";

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
