import assert from "node:assert/strict";
import { existsSync, mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { spawnSync } from "node:child_process";
import test from "node:test";
import { ACTIVE_RUN_ENV_VAR } from "./active-run.mjs";
import { BEHAVIOR_DIMENSIONS } from "./behavior-intent.mjs";

const SCRIPT_PATH = join(process.cwd(), "scripts", "agent-runtime", "build-review-packet.mjs");

function createRepo() {
	const root = mkdtempSync(join(tmpdir(), "cautilus-review-packet-"));
	const adapterDir = join(root, ".agents");
	const namedAdapterDir = join(adapterDir, "cautilus-adapters");
	mkdirSync(adapterDir, { recursive: true });
	mkdirSync(namedAdapterDir, { recursive: true });
	mkdirSync(join(root, "fixtures"), { recursive: true });
	mkdirSync(join(root, "reports"), { recursive: true });
	writeFileSync(join(root, "fixtures", "review.prompt.md"), "review prompt\n", "utf-8");
	writeFileSync(join(root, "fixtures", "review.schema.json"), '{"type":"object"}\n', "utf-8");
	writeFileSync(join(root, "reports", "latest.json"), '{"schemaVersion":"cautilus.report_packet.v2"}\n', "utf-8");
	writeFileSync(
		join(adapterDir, "cautilus-adapter.yaml"),
		[
			"version: 1",
			"repo: temp",
			"evaluation_surfaces:",
			"  - operator workflow",
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
	writeFileSync(
		join(namedAdapterDir, "operator-review.yaml"),
		[
			"version: 1",
			"repo: temp",
			"evaluation_surfaces:",
			"  - operator workflow",
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

function writeValidReport(reportFile) {
	writeFileSync(
		reportFile,
		JSON.stringify(
			{
				schemaVersion: "cautilus.report_packet.v2",
				generatedAt: "2026-04-11T00:00:00.000Z",
				candidate: "feature/operator-guidance",
				baseline: "origin/main",
				intent: "Operator-facing behavior should stay legible.",
				intentProfile: {
					schemaVersion: "cautilus.behavior_intent.v1",
					intentId: "intent-operator-behavior-legibility",
					summary: "Operator-facing behavior should stay legible.",
					behaviorSurface: "operator_behavior",
					successDimensions: [
						{
							id: BEHAVIOR_DIMENSIONS.OPERATOR_GUIDANCE_CLARITY,
							summary: "Keep the operator-facing guidance explicit and easy to follow.",
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
}

function runBuildReviewPacket(args, { env = process.env } = {}) {
	return spawnSync("node", [SCRIPT_PATH, ...args], {
		cwd: process.cwd(),
		encoding: "utf-8",
		env,
	});
}

test("build-review-packet collects adapter review surfaces around a report packet", () => {
	const root = createRepo();
	try {
		const reportFile = join(root, "reports", "latest.json");
		writeValidReport(reportFile);
		const result = runBuildReviewPacket(["--repo-root", root, "--report-file", reportFile]);
		assert.equal(result.status, 0, result.stderr);
		const packet = JSON.parse(result.stdout);
		assert.equal(packet.schemaVersion, "cautilus.review_packet.v1");
		assert.equal(packet.artifactFiles[0].exists, true);
		assert.equal(packet.reportArtifacts[0].exists, true);
		assert.equal(packet.comparisonQuestions[0], "Which scenarios improved?");
		assert.equal(packet.humanReviewPrompts[0].id, "operator");
		assert.equal(packet.defaultPromptFile.exists, true);
		assert.equal(packet.report.intentProfile.intentId, "intent-operator-behavior-legibility");
	} finally {
		rmSync(root, { recursive: true, force: true });
	}
});

test("build-review-packet defaults to the active run report and review-packet paths", () => {
	const root = createRepo();
	try {
		const runDir = join(root, "active-run");
		mkdirSync(runDir, { recursive: true });
		writeValidReport(join(runDir, "report.json"));
		const result = runBuildReviewPacket(["--repo-root", root], {
			env: { ...process.env, [ACTIVE_RUN_ENV_VAR]: runDir },
		});
		assert.equal(result.status, 0, result.stderr);
		assert.equal(result.stdout, "");
		assert.doesNotMatch(result.stderr, /Active run:/);
		const packetPath = join(runDir, "review-packet.json");
		assert.equal(existsSync(packetPath), true);
		const packet = JSON.parse(readFileSync(packetPath, "utf-8"));
		assert.equal(packet.reportFile, join(runDir, "report.json"));
		assert.equal(packet.schemaVersion, "cautilus.review_packet.v1");
	} finally {
		rmSync(root, { recursive: true, force: true });
	}
});

test("build-review-packet fails loudly when the active run report is missing", () => {
	const root = createRepo();
	try {
		const runDir = join(root, "active-run");
		mkdirSync(runDir, { recursive: true });
		const result = runBuildReviewPacket(["--repo-root", root], {
			env: { ...process.env, [ACTIVE_RUN_ENV_VAR]: runDir },
		});
		assert.equal(result.status, 1);
		assert.match(result.stderr, /Report file not found:/);
	} finally {
		rmSync(root, { recursive: true, force: true });
	}
});

test("build-review-packet rejects legacy report packet schema versions at the boundary", () => {
	const root = createRepo();
	try {
		const reportFile = join(root, "reports", "legacy.json");
		writeFileSync(
			reportFile,
			JSON.stringify({
				schemaVersion: "cautilus.report_packet.v1",
			}),
			"utf-8",
		);
		const result = runBuildReviewPacket(["--repo-root", root, "--report-file", reportFile]);
		assert.equal(result.status, 1);
		assert.match(result.stderr, /legacy schemaVersion cautilus\.report_packet\.v1/);
		assert.match(result.stderr, /cautilus report build/);
	} finally {
		rmSync(root, { recursive: true, force: true });
	}
});

test("build-review-packet preserves stdout behavior without an active run", () => {
	const root = createRepo();
	try {
		const reportFile = join(root, "reports", "latest.json");
		writeValidReport(reportFile);
		const result = runBuildReviewPacket(["--repo-root", root, "--report-file", reportFile], {
			env: { ...process.env, [ACTIVE_RUN_ENV_VAR]: "" },
		});
		assert.equal(result.status, 0, result.stderr);
		const packet = JSON.parse(result.stdout);
		assert.equal(packet.reportFile, reportFile);
		assert.equal(result.stderr, "");
	} finally {
		rmSync(root, { recursive: true, force: true });
	}
});

test("build-review-packet can recover adapter selection from report adapterContext", () => {
	const root = createRepo();
	try {
		const reportFile = join(root, "reports", "latest.json");
		writeValidReport(reportFile);
		const report = JSON.parse(readFileSync(reportFile, "utf-8"));
		report.adapterContext = { adapterName: "operator-review" };
		writeFileSync(reportFile, `${JSON.stringify(report, null, 2)}\n`, "utf-8");
		const result = runBuildReviewPacket(["--repo-root", root, "--report-file", reportFile]);
		assert.equal(result.status, 0, result.stderr);
		const packet = JSON.parse(result.stdout);
		assert.match(packet.adapterPath, /operator-review\.yaml$/);
	} finally {
		rmSync(root, { recursive: true, force: true });
	}
});

test("build-review-packet lets an explicit output path override the active run default", () => {
	const root = createRepo();
	try {
		const runDir = join(root, "active-run");
		mkdirSync(runDir, { recursive: true });
		writeValidReport(join(runDir, "report.json"));
		const explicitOutput = join(root, "reports", "nested", "explicit-review-packet.json");
		const result = runBuildReviewPacket(
			["--repo-root", root, "--output", explicitOutput],
			{
				env: { ...process.env, [ACTIVE_RUN_ENV_VAR]: runDir },
			},
		);
		assert.equal(result.status, 0, result.stderr);
		assert.equal(existsSync(explicitOutput), true);
		assert.equal(existsSync(join(runDir, "review-packet.json")), false);
		const packet = JSON.parse(readFileSync(explicitOutput, "utf-8"));
		assert.equal(packet.reportFile, join(runDir, "report.json"));
	} finally {
		rmSync(root, { recursive: true, force: true });
	}
});

test("build-review-packet still requires --report-file when no active run is pinned", () => {
	const root = createRepo();
	try {
		const result = runBuildReviewPacket(["--repo-root", root]);
		assert.equal(result.status, 1);
		assert.match(result.stderr, /--report-file is required/);
	} finally {
		rmSync(root, { recursive: true, force: true });
	}
});

test("build-review-packet fails loudly when the active run directory is missing", () => {
	const root = createRepo();
	try {
		const missingDir = join(root, "missing-run");
		const result = runBuildReviewPacket(["--repo-root", root], {
			env: { ...process.env, [ACTIVE_RUN_ENV_VAR]: missingDir },
		});
		assert.equal(result.status, 1);
		assert.match(result.stderr, new RegExp(`${ACTIVE_RUN_ENV_VAR} does not exist`));
	} finally {
		rmSync(root, { recursive: true, force: true });
	}
});
