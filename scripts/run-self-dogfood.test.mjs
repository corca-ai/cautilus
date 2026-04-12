import assert from "node:assert/strict";
import { chmodSync, existsSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { spawnSync } from "node:child_process";
import test from "node:test";

// Product-owned proof for the explicit root self-consumer quality path.
const SCRIPT_PATH = join(process.cwd(), "scripts", "run-self-dogfood.mjs");

function writeExecutable(root, relativePath, body) {
	const filePath = join(root, relativePath);
	mkdirSync(join(filePath, ".."), { recursive: true });
	writeFileSync(filePath, body, "utf-8");
	chmodSync(filePath, 0o755);
	return filePath;
}

function writeFile(root, relativePath, content) {
	const filePath = join(root, relativePath);
	mkdirSync(join(filePath, ".."), { recursive: true });
	writeFileSync(filePath, content, "utf-8");
}

function createDogfoodRepo({ reviewTimeoutMs = null } = {}) {
	const root = mkdtempSync(join(tmpdir(), "cautilus-self-dogfood-"));
	writeFile(root, "README.md", "# temp\n");
	writeFile(root, "docs/workflow.md", "# workflow\n");
	writeFile(root, "docs/specs/self-dogfood.spec.md", "# self-dogfood\n");
	writeFile(root, "skills/cautilus/SKILL.md", "# skill\n");
	writeFile(root, "plugins/cautilus/skills/cautilus/SKILL.md", "# packaged skill\n");
	writeFile(root, "schema.json", '{"type":"object"}\n');
	writeExecutable(
		root,
		"variant.sh",
		`#!/usr/bin/env sh
set -eu
output_file="$1"
prompt_file="$2"
schema_file="$3"
verdict="\${CAUTILUS_TEST_VARIANT_VERDICT:-pass}"
summary="\${CAUTILUS_TEST_VARIANT_SUMMARY:-self dogfood ok}"
if [ -n "\${CAUTILUS_TEST_SLEEP_MS:-}" ]; then
  node -e "setTimeout(() => {}, Number(process.argv[1]))" "$CAUTILUS_TEST_SLEEP_MS"
fi
node - "$output_file" "$prompt_file" "$schema_file" "$verdict" "$summary" <<'EOF'
const [outputFile, promptFile, schemaFile, verdict, summary] = process.argv.slice(2);
const { readFileSync, writeFileSync } = await import("node:fs");
const promptText = readFileSync(promptFile, "utf-8");
writeFileSync(
	outputFile,
	JSON.stringify({
		verdict,
		summary: summary + ": " + promptText.split("\\n")[0],
		findings: [{ severity: verdict, message: schemaFile, path: "self-dogfood/mock" }],
	}) + "\\n",
	"utf-8",
);
EOF
`,
	);
	writeFile(
		root,
		".agents/cautilus-adapter.yaml",
		[
			"version: 1",
			"repo: temp",
			"evaluation_surfaces:",
			"  - self dogfood full gate",
			"baseline_options:",
			"  - baseline git ref via {baseline_ref}",
			"full_gate_command_templates:",
			"  - node -e \"console.log('full gate ok')\"",
			"",
		].join("\n"),
	);
	writeFile(
		root,
		".agents/cautilus-adapters/self-dogfood.yaml",
		[
			"version: 1",
			"repo: temp",
			"evaluation_surfaces:",
			"  - self dogfood review",
			"baseline_options:",
			"  - baseline git ref via {baseline_ref}",
			...(reviewTimeoutMs === null ? [] : [`review_timeout_ms: ${reviewTimeoutMs}`]),
			"executor_variants:",
			"  - id: mock-review",
			"    tool: command",
			"    command_template: sh {candidate_repo}/variant.sh {output_file} {prompt_file} {schema_file}",
			"human_review_prompts:",
			"  - id: operator",
			"    prompt: smoke",
			"default_schema_file: schema.json",
			"",
		].join("\n"),
	);
	return root;
}

test("run-self-dogfood proves the root self-consumer quality path and writes latest artifacts", () => {
	const root = createDogfoodRepo();
	try {
		const artifactRoot = join(root, "artifacts");
		const first = spawnSync(
			"node",
			[SCRIPT_PATH, "--repo-root", root, "--artifact-root", artifactRoot, "--run-id", "run-1", "--keep-last", "1"],
			{
				cwd: process.cwd(),
				encoding: "utf-8",
			},
		);
		assert.equal(first.status, 0, first.stderr);
		const firstSummary = JSON.parse(readFileSync(first.stdout.trim(), "utf-8"));
		assert.equal(firstSummary.runId, "run-1");
		assert.equal(firstSummary.overallStatus, "pass");
		assert.ok(existsSync(join(artifactRoot, "latest", "latest.md")));
		assert.deepEqual(readdirSync(join(artifactRoot, "latest")).sort(), ["index.html", "latest.md", "report.json", "review-summary.json", "summary.json"]);
		const publishedSummary = JSON.parse(readFileSync(join(artifactRoot, "latest", "summary.json"), "utf-8"));
		assert.equal(publishedSummary.repoRoot, ".");
		assert.equal(publishedSummary.reportPath, "artifacts/self-dogfood/latest/report.json");
		const publishedReviewSummary = JSON.parse(readFileSync(join(artifactRoot, "latest", "review-summary.json"), "utf-8"));
		assert.equal(publishedReviewSummary.repoRoot, ".");
		assert.equal(publishedReviewSummary.variants[0].outputFile, null);
		const reviewPrompt = readFileSync(join(artifactRoot, "runs", "run-1", "review", "review.prompt.md"), "utf-8");
		assert.match(reviewPrompt, /## Current Run Evidence/);
		assert.match(reviewPrompt, /current gateRecommendation: accept-now/);
		assert.match(reviewPrompt, /projected summary\.json:/);

		const second = spawnSync(
			"node",
			[SCRIPT_PATH, "--repo-root", root, "--artifact-root", artifactRoot, "--run-id", "run-2", "--keep-last", "1"],
			{
				cwd: process.cwd(),
				encoding: "utf-8",
			},
		);
		assert.equal(second.status, 0, second.stderr);
		const secondSummary = JSON.parse(readFileSync(second.stdout.trim(), "utf-8"));
		assert.equal(secondSummary.runId, "run-2");
		assert.deepEqual(readdirSync(join(artifactRoot, "runs")), ["run-2"]);
		assert.deepEqual(readdirSync(join(artifactRoot, "latest")).sort(), ["index.html", "latest.md", "report.json", "review-summary.json", "summary.json"]);
	} finally {
		rmSync(root, { recursive: true, force: true });
	}
});

test("run-self-dogfood keeps latest artifacts even when review returns concern", () => {
	const root = createDogfoodRepo();
	try {
		const artifactRoot = join(root, "artifacts");
		const result = spawnSync(
			"node",
			[SCRIPT_PATH, "--repo-root", root, "--artifact-root", artifactRoot, "--run-id", "concern-run"],
			{
				cwd: process.cwd(),
				encoding: "utf-8",
				env: {
					...process.env,
					CAUTILUS_TEST_VARIANT_VERDICT: "concern",
					CAUTILUS_TEST_VARIANT_SUMMARY: "needs work",
				},
			},
		);
		assert.equal(result.status, 1);
		const summary = JSON.parse(readFileSync(result.stdout.trim(), "utf-8"));
		assert.equal(summary.overallStatus, "concern");
		assert.equal(summary.reportRecommendation, "defer");
		assert.equal(summary.gateRecommendation, "accept-now");
		assert.ok(existsSync(join(artifactRoot, "latest", "latest.md")));
		const latest = readFileSync(join(artifactRoot, "latest", "latest.md"), "utf-8");
		assert.match(latest, /overallStatus: concern/);
		assert.match(latest, /reportRecommendation: defer/);
		assert.match(latest, /gateRecommendation: accept-now/);
	} finally {
		rmSync(root, { recursive: true, force: true });
	}
});

test("run-self-dogfood writes a blocker summary when review variants time out", () => {
	const root = createDogfoodRepo({ reviewTimeoutMs: 10 });
	try {
		const artifactRoot = join(root, "artifacts");
		const result = spawnSync(
			"node",
			[SCRIPT_PATH, "--repo-root", root, "--artifact-root", artifactRoot, "--run-id", "timeout-run"],
			{
				cwd: process.cwd(),
				encoding: "utf-8",
				env: {
					...process.env,
					CAUTILUS_TEST_SLEEP_MS: "100",
				},
			},
		);
		assert.equal(result.status, 1);
		const summary = JSON.parse(readFileSync(result.stdout.trim(), "utf-8"));
		assert.equal(summary.overallStatus, "blocker");
		assert.equal(summary.reportRecommendation, "reject");
		assert.equal(summary.gateRecommendation, "accept-now");
		assert.equal(summary.reviewVariants[0].id, "review-timeout");
		const latest = readFileSync(join(artifactRoot, "latest", "latest.md"), "utf-8");
		assert.match(latest, /overallStatus: blocker/);
		assert.match(latest, /gateRecommendation: accept-now/);
	} finally {
		rmSync(root, { recursive: true, force: true });
	}
});
