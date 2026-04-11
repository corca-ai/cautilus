import assert from "node:assert/strict";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { spawnSync } from "node:child_process";
import test from "node:test";

import { ACTIVE_RUN_ENV_VAR } from "./active-run.mjs";
import { buildEvidenceInput } from "./build-evidence-input.mjs";
import { buildEvidenceBundle } from "./build-evidence-bundle.mjs";

const BUILD_EVIDENCE_INPUT = join(process.cwd(), "scripts", "agent-runtime", "build-evidence-input.mjs");
const BUILD_EVIDENCE_BUNDLE = join(process.cwd(), "scripts", "agent-runtime", "build-evidence-bundle.mjs");

function writeJson(path, value) {
	writeFileSync(path, `${JSON.stringify(value, null, 2)}\n`, "utf-8");
}

function createEvidenceFixtureRoot() {
	const root = mkdtempSync(join(tmpdir(), "cautilus-evidence-flow-"));
	const reportFile = join(root, "report.json");
	const scenarioResultsFile = join(root, "scenario-results.json");
	const runAuditFile = join(root, "run-audit.json");

	writeJson(reportFile, {
		schemaVersion: "cautilus.report_packet.v1",
		generatedAt: "2026-04-11T00:02:00.000Z",
		candidate: "feature/cli",
		baseline: "origin/main",
		intent: "CLI guidance should stay legible under recovery pressure.",
		commands: [],
		commandObservations: [],
		modesRun: ["held_out"],
		modeSummaries: [],
		telemetry: {},
		improved: [],
		regressed: ["operator-recovery"],
		unchanged: [],
		noisy: ["workflow-retry-budget"],
		humanReviewFindings: [],
		recommendation: "defer",
	});
	writeJson(scenarioResultsFile, {
		schemaVersion: "cautilus.scenario_results.v1",
		generatedAt: "2026-04-11T00:00:10.000Z",
		source: "fixture",
		mode: "held_out",
		results: [
			{
				scenarioId: "operator-recovery",
				status: "failed",
				durationMs: 1200,
			},
		],
	});
	writeJson(runAuditFile, {
		summary: {
			totals: {
				runs: 2,
				launch_only_runs: 1,
			},
			warnings: {
				slow_llm_runs: 1,
				slow_transition_runs: 0,
				high_token_runs: 0,
			},
		},
	});
	return { root, reportFile, scenarioResultsFile, runAuditFile };
}

test("buildEvidenceInput assembles explicit report, scenario, and audit sources", () => {
	const { root, reportFile, scenarioResultsFile, runAuditFile } = createEvidenceFixtureRoot();
	try {
		const packet = buildEvidenceInput(
			[
				"--repo-root",
				root,
				"--report-file",
				reportFile,
				"--scenario-results-file",
				scenarioResultsFile,
				"--run-audit-file",
				runAuditFile,
			],
			{ now: new Date("2026-04-11T00:10:00.000Z") },
		);
		assert.equal(packet.schemaVersion, "cautilus.evidence_bundle_inputs.v1");
		assert.equal(packet.sources.length, 3);
		assert.equal(packet.report.regressed[0], "operator-recovery");
		assert.equal(packet.scenarioResults.results[0].status, "failed");
	} finally {
		rmSync(root, { recursive: true, force: true });
	}
});

test("buildEvidenceBundle summarizes prioritized evidence signals", () => {
	const { root, reportFile, scenarioResultsFile, runAuditFile } = createEvidenceFixtureRoot();
	try {
		const input = buildEvidenceInput(
			[
				"--repo-root",
				root,
				"--report-file",
				reportFile,
				"--scenario-results-file",
				scenarioResultsFile,
				"--run-audit-file",
				runAuditFile,
			],
			{ now: new Date("2026-04-11T00:10:00.000Z") },
		);
		const bundle = buildEvidenceBundle(input, {
			now: new Date("2026-04-11T00:11:00.000Z"),
			inputFile: join(root, "evidence-input.json"),
		});
		assert.equal(bundle.schemaVersion, "cautilus.evidence_bundle.v1");
		assert.ok(bundle.summary.signalCount >= 3);
		assert.ok(bundle.summary.highSignalCount >= 1);
		assert.equal(bundle.signals[0].severity, "high");
	} finally {
		rmSync(root, { recursive: true, force: true });
	}
});

test("build-evidence-input requires at least one source", () => {
	const result = spawnSync(
		"node",
		[BUILD_EVIDENCE_INPUT],
		{
			cwd: process.cwd(),
			encoding: "utf-8",
		},
	);
	assert.equal(result.status, 1);
	assert.match(result.stderr, /At least one evidence source/);
});

test("build-evidence-input defaults report.json and evidence-input.json inside the active run", () => {
	const { root, reportFile } = createEvidenceFixtureRoot();
	try {
		const runDir = join(root, "active-run");
		mkdirSync(runDir, { recursive: true });
		writeJson(join(runDir, "report.json"), JSON.parse(readFileSync(reportFile, "utf-8")));
		const result = spawnSync("node", [BUILD_EVIDENCE_INPUT], {
			cwd: root,
			encoding: "utf-8",
			env: { ...process.env, [ACTIVE_RUN_ENV_VAR]: runDir },
		});
		assert.equal(result.status, 0, result.stderr);
		const packetPath = join(runDir, "evidence-input.json");
		assert.equal(existsSync(packetPath), true);
		const packet = JSON.parse(readFileSync(packetPath, "utf-8"));
		assert.equal(packet.reportFile, join(runDir, "report.json"));
		assert.equal(packet.schemaVersion, "cautilus.evidence_bundle_inputs.v1");
		assert.equal(result.stdout, "");
	} finally {
		rmSync(root, { recursive: true, force: true });
	}
});

test("build-evidence-bundle defaults evidence-input.json and evidence-bundle.json inside the active run", () => {
	const { root, reportFile, scenarioResultsFile, runAuditFile } = createEvidenceFixtureRoot();
	try {
		const runDir = join(root, "active-run");
		mkdirSync(runDir, { recursive: true });
		const inputPath = join(runDir, "evidence-input.json");
		writeJson(
			inputPath,
			buildEvidenceInput(
				[
					"--repo-root",
					root,
					"--report-file",
					reportFile,
					"--scenario-results-file",
					scenarioResultsFile,
					"--run-audit-file",
					runAuditFile,
				],
				{ now: new Date("2026-04-11T00:10:00.000Z") },
			),
		);
		const result = spawnSync("node", [BUILD_EVIDENCE_BUNDLE], {
			cwd: root,
			encoding: "utf-8",
			env: { ...process.env, [ACTIVE_RUN_ENV_VAR]: runDir },
		});
		assert.equal(result.status, 0, result.stderr);
		const bundlePath = join(runDir, "evidence-bundle.json");
		assert.equal(existsSync(bundlePath), true);
		const bundle = JSON.parse(readFileSync(bundlePath, "utf-8"));
		assert.equal(bundle.inputFile, inputPath);
		assert.equal(bundle.schemaVersion, "cautilus.evidence_bundle.v1");
		assert.equal(result.stdout, "");
	} finally {
		rmSync(root, { recursive: true, force: true });
	}
});
