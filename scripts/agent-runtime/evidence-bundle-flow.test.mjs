import assert from "node:assert/strict";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { spawnSync } from "node:child_process";
import test from "node:test";

import { buildEvidenceInput } from "./build-evidence-input.mjs";
import { buildEvidenceBundle } from "./build-evidence-bundle.mjs";

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
		[
			join(process.cwd(), "scripts", "agent-runtime", "build-evidence-input.mjs"),
		],
		{
			cwd: process.cwd(),
			encoding: "utf-8",
		},
	);
	assert.equal(result.status, 1);
	assert.match(result.stderr, /At least one evidence source/);
});
