import assert from "node:assert/strict";
import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { spawnSync } from "node:child_process";
import test from "node:test";

const SCRIPT_PATH = join(process.cwd(), "scripts", "agent-runtime", "build-review-packet.mjs");

function createRepo() {
	const root = mkdtempSync(join(tmpdir(), "cautilus-review-packet-"));
	const adapterDir = join(root, ".agents");
	mkdirSync(adapterDir, { recursive: true });
	mkdirSync(join(root, "fixtures"), { recursive: true });
	mkdirSync(join(root, "reports"), { recursive: true });
	writeFileSync(join(root, "fixtures", "review.prompt.md"), "review prompt\n", "utf-8");
	writeFileSync(join(root, "fixtures", "review.schema.json"), '{"type":"object"}\n', "utf-8");
	writeFileSync(join(root, "reports", "latest.json"), '{"schemaVersion":"cautilus.report_packet.v1"}\n', "utf-8");
	writeFileSync(
		join(adapterDir, "cautilus-adapter.yaml"),
		[
			"version: 1",
			"repo: temp",
			"evaluation_surfaces:",
			"  - cli behavior",
			"baseline_options:",
			"  - baseline git ref via {baseline_ref}",
			"held_out_command_templates:",
			"  - npm run held-out",
			"artifact_paths:",
			"  - fixtures/review.prompt.md",
			"report_paths:",
			"  - reports/latest.json",
			"comparison_questions:",
			"  - Which scenarios improved?",
			"human_review_prompts:",
			"  - id: operator",
			"    prompt: Where is the workflow still brittle?",
			"default_prompt_file: fixtures/review.prompt.md",
			"default_schema_file: fixtures/review.schema.json",
			"",
		].join("\n"),
		"utf-8",
	);
	return root;
}

test("build-review-packet collects adapter review surfaces around a report packet", () => {
	const root = createRepo();
	try {
		const reportFile = join(root, "reports", "latest.json");
		writeFileSync(
			reportFile,
			JSON.stringify(
				{
					schemaVersion: "cautilus.report_packet.v1",
					generatedAt: "2026-04-11T00:00:00.000Z",
					candidate: "feature/cli",
					baseline: "origin/main",
					intent: "CLI behavior should stay legible.",
					intentProfile: {
						schemaVersion: "cautilus.behavior_intent.v1",
						intentId: "intent-cli-behavior-legibility",
						summary: "CLI behavior should stay legible.",
						behaviorSurface: "operator_cli",
						successDimensions: [
							{
								id: "legibility",
								summary: "Operators can understand the next step.",
							},
						],
						guardrailDimensions: [],
					},
					commands: [],
					modesRun: [],
					modeSummaries: [],
					telemetry: {},
					improved: [],
					regressed: [],
					unchanged: [],
					noisy: [],
					humanReviewFindings: [],
					recommendation: "defer",
				},
				null,
				2,
			),
			"utf-8",
		);
		const result = spawnSync(
			"node",
			[
				SCRIPT_PATH,
				"--repo-root",
				root,
				"--report-file",
				reportFile,
			],
			{
				cwd: process.cwd(),
				encoding: "utf-8",
			},
		);
		assert.equal(result.status, 0, result.stderr);
		const packet = JSON.parse(result.stdout);
		assert.equal(packet.schemaVersion, "cautilus.review_packet.v1");
		assert.equal(packet.artifactFiles[0].exists, true);
		assert.equal(packet.reportArtifacts[0].exists, true);
		assert.equal(packet.comparisonQuestions[0], "Which scenarios improved?");
		assert.equal(packet.humanReviewPrompts[0].id, "operator");
		assert.equal(packet.defaultPromptFile.exists, true);
		assert.equal(packet.report.intentProfile.intentId, "intent-cli-behavior-legibility");
	} finally {
		rmSync(root, { recursive: true, force: true });
	}
});
