import assert from "node:assert/strict";
import { chmodSync, mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";

import {
	CLI_EVALUATION_INPUTS_SCHEMA,
	CLI_EVALUATION_PACKET_SCHEMA,
	evaluateCliIntent,
} from "./evaluate-cli-intent.mjs";

function writeExecutable(root, name, body) {
	const filePath = join(root, name);
	writeFileSync(filePath, body, "utf-8");
	chmodSync(filePath, 0o755);
	return filePath;
}

test("evaluateCliIntent executes a bounded CLI packet and reports expectation failures", () => {
	const root = mkdtempSync(join(tmpdir(), "cautilus-cli-eval-"));
	try {
		writeExecutable(
			root,
			"intent-check.sh",
			`#!/bin/sh
echo "adapter missing"
echo "next: run adapter init" >&2
exit 1
`,
		);
		const packet = evaluateCliIntent(
			{
				schemaVersion: CLI_EVALUATION_INPUTS_SCHEMA,
				candidate: "feature/cli-eval",
				baseline: "origin/main",
				intent: "The command should explain what is missing and how to recover.",
				surfaceId: "missing-adapter-message",
				mode: "held_out",
				workingDirectory: ".",
				command: ["sh", "./intent-check.sh"],
				expectations: {
					exitCode: 1,
					stdoutContains: ["adapter missing"],
					stderrContains: ["adapter init"],
					stderrNotContains: ["traceback"],
				},
			},
			{ now: new Date("2026-04-11T01:00:00.000Z"), baseDir: root },
		);
		assert.equal(packet.schemaVersion, CLI_EVALUATION_PACKET_SCHEMA);
		assert.equal(packet.summary.failedExpectationCount, 0);
		assert.equal(packet.summary.recommendation, "accept-now");
		assert.equal(packet.report.schemaVersion, "cautilus.report_packet.v2");
		assert.equal(packet.report.modeSummaries[0].scenarioTelemetrySummary.overall.totalDurationMs, packet.observation.durationMs);
	} finally {
		rmSync(root, { recursive: true, force: true });
	}
});

test("evaluateCliIntent checks side effects in the working directory", () => {
	const root = mkdtempSync(join(tmpdir(), "cautilus-cli-side-effect-"));
	try {
		mkdirSync(join(root, "out"), { recursive: true });
		writeExecutable(
			root,
			"write-output.sh",
			`#!/bin/sh
printf 'hello\\n' > ./out/result.txt
exit 0
`,
		);
		const packet = evaluateCliIntent(
			{
				schemaVersion: CLI_EVALUATION_INPUTS_SCHEMA,
				candidate: "feature/cli-side-effect",
				baseline: "origin/main",
				intent: "The command should write the expected artifact for operators.",
				surfaceId: "writes-output-file",
				mode: "full_gate",
				workingDirectory: ".",
				command: ["sh", "./write-output.sh"],
				expectations: {
					exitCode: 0,
					filesExist: ["out/result.txt"],
					filesContain: [
						{
							path: "out/result.txt",
							text: "hello",
						},
					],
				},
			},
			{ now: new Date("2026-04-11T02:00:00.000Z"), baseDir: root },
		);
		assert.equal(packet.summary.recommendation, "accept-now");
		assert.equal(readFileSync(join(root, "out", "result.txt"), "utf-8"), "hello\n");
		assert.equal(packet.report.modesRun[0], "full_gate");
	} finally {
		rmSync(root, { recursive: true, force: true });
	}
});
