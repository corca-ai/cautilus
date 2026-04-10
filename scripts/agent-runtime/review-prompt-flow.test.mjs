import assert from "node:assert/strict";
import { mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";

import { buildReviewPromptInput } from "./build-review-prompt-input.mjs";
import { REVIEW_PROMPT_INPUTS_SCHEMA } from "./contract-versions.mjs";
import { renderReviewPrompt } from "./render-review-prompt.mjs";

function readJson(path) {
	return JSON.parse(readFileSync(path, "utf-8"));
}

function validateAgainstSchema(schema, value, path = "root") {
	if (schema.type === "object") {
		assert.equal(typeof value, "object", `${path} must be an object`);
		assert.notEqual(value, null, `${path} must not be null`);
		for (const key of schema.required || []) {
			assert.ok(key in value, `${path}.${key} must exist`);
		}
		for (const [key, propertySchema] of Object.entries(schema.properties || {})) {
			if (key in value) {
				validateAgainstSchema(propertySchema, value[key], `${path}.${key}`);
			}
		}
		return;
	}
	if (schema.type === "array") {
		assert.ok(Array.isArray(value), `${path} must be an array`);
		return;
	}
	if (schema.type === "string") {
		assert.equal(typeof value, "string", `${path} must be a string`);
		if (schema.const !== undefined) {
			assert.equal(value, schema.const, `${path} must equal ${schema.const}`);
		}
	}
}

function createReviewPacketFixture() {
	const root = mkdtempSync(join(tmpdir(), "cautilus-review-prompt-"));
	const schemaPath = join(process.cwd(), "fixtures", "review", "prompt-input.schema.json");
	mkdirSync(join(root, "fixtures"), { recursive: true });
	mkdirSync(join(root, "reports"), { recursive: true });
	writeFileSync(join(root, "fixtures", "review.prompt.md"), "Prefer concrete operator-facing evidence.\n", "utf-8");
	writeFileSync(join(root, "fixtures", "review.schema.json"), '{"type":"object"}\n', "utf-8");
	const reviewPacketPath = join(root, "review-packet.json");
	writeFileSync(
		reviewPacketPath,
		`${JSON.stringify(
			{
				schemaVersion: "cautilus.review_packet.v1",
				generatedAt: "2026-04-11T00:03:00.000Z",
				repoRoot: root,
				adapterPath: join(root, ".agents", "cautilus-adapter.yaml"),
				reportFile: join(root, "reports", "latest.json"),
				report: {
					schemaVersion: "cautilus.report_packet.v1",
					generatedAt: "2026-04-11T00:02:00.000Z",
					candidate: "feature/cli",
					baseline: "origin/main",
					intent: "The CLI should explain missing adapter setup without operator guesswork.",
					commands: [],
					commandObservations: [],
					modesRun: ["held_out"],
					modeSummaries: [
						{
							mode: "held_out",
							status: "passed",
							summary: "held_out completed across 1 command.",
							compareArtifact: {
								schemaVersion: "cautilus.compare_artifact.v1",
								summary: "Held-out doctor messaging improved.",
								verdict: "improved",
								improved: ["doctor-missing-adapter"],
							},
							scenarioTelemetrySummary: {
								schemaVersion: "cautilus.scenario_telemetry_summary.v1",
								generatedAt: "2026-04-11T00:02:00.000Z",
								source: "report_mode:held_out",
								overall: { scenarioCount: 1, runCount: 1, total_tokens: 200 },
								scenarios: [],
							},
						},
					],
					telemetry: { modeCount: 1 },
					improved: ["doctor-missing-adapter"],
					regressed: [],
					unchanged: [],
					noisy: [],
					humanReviewFindings: [],
					recommendation: "defer",
				},
				defaultPromptFile: {
					relativePath: "fixtures/review.prompt.md",
					absolutePath: join(root, "fixtures", "review.prompt.md"),
					exists: true,
				},
				defaultSchemaFile: {
					relativePath: "fixtures/review.schema.json",
					absolutePath: join(root, "fixtures", "review.schema.json"),
					exists: true,
				},
				artifactFiles: [
					{
						relativePath: "README.md",
						absolutePath: join(root, "README.md"),
						exists: false,
					},
				],
				reportArtifacts: [
					{
						relativePath: "reports/latest.json",
						absolutePath: join(root, "reports", "latest.json"),
						exists: false,
					},
				],
				comparisonQuestions: ["Which scenario-level deltas actually matter to a real operator?"],
				humanReviewPrompts: [
					{
						id: "real-user",
						prompt: "Where would a real user still judge the candidate worse despite benchmark wins?",
					},
				],
			},
			null,
			2,
		)}\n`,
		"utf-8",
	);
	return { root, reviewPacketPath, schemaPath };
}

test("buildReviewPromptInput emits the explicit meta-prompt contract", () => {
	const { root, reviewPacketPath, schemaPath } = createReviewPacketFixture();
	try {
		const packet = buildReviewPromptInput(["--review-packet", reviewPacketPath], {
			now: new Date("2026-04-11T00:04:00.000Z"),
		});
		assert.equal(packet.schemaVersion, REVIEW_PROMPT_INPUTS_SCHEMA);
		validateAgainstSchema(readJson(schemaPath), packet);
		assert.equal(packet.modeSummaries[0].compareArtifact.verdict, "improved");
		assert.equal(packet.metaPrompt.instructions.length, 4);
	} finally {
		rmSync(root, { recursive: true, force: true });
	}
});

test("renderReviewPrompt turns review prompt inputs into a portable meta-prompt", () => {
	const { root, reviewPacketPath } = createReviewPacketFixture();
	try {
		const packet = buildReviewPromptInput(["--review-packet", reviewPacketPath], {
			now: new Date("2026-04-11T00:04:00.000Z"),
		});
		const prompt = renderReviewPrompt(packet);
		assert.match(prompt, /# Cautilus Review/);
		assert.match(prompt, /Which scenario-level deltas actually matter to a real operator/);
		assert.match(prompt, /Held-out doctor messaging improved\./);
		assert.match(prompt, /## Consumer Prompt Addendum/);
		assert.match(prompt, /Prefer concrete operator-facing evidence\./);
	} finally {
		rmSync(root, { recursive: true, force: true });
	}
});
