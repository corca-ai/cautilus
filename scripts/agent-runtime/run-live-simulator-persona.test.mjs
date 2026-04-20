import assert from "node:assert/strict";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { spawnSync } from "node:child_process";
import test from "node:test";

const SCRIPT = join(process.cwd(), "scripts", "agent-runtime", "run-live-simulator-persona.mjs");

function runPersona(args, cwd = process.cwd()) {
	return spawnSync("node", [SCRIPT, ...args], {
		cwd,
		encoding: "utf-8",
	});
}

function writeJson(path, value) {
	writeFileSync(path, `${JSON.stringify(value, null, 2)}\n`, "utf-8");
}

test("run-live-simulator-persona can continue from a fixture response", () => {
	const root = mkdtempSync(join(tmpdir(), "cautilus-live-persona-continue-"));
	try {
		const requestFile = join(root, "request.json");
		const resultFile = join(root, "result.json");
		const fixtureFile = join(root, "fixture.json");
		writeJson(requestFile, {
			schemaVersion: "cautilus.live_run_simulator_request.v1",
			requestId: "req-1",
			instanceId: "ceal",
			scenarioId: "scenario-1",
			turnIndex: 1,
			maxTurns: 3,
			instructions: "Act like a pragmatic user and continue if more information is needed.",
			transcript: [],
		});
		writeJson(fixtureFile, {
			responses: [
				{
					action: "continue",
					summary: "The user should ask one more clarifying question.",
					nextTurnText: "현재 review 대상이 어느 repo인지 먼저 확인할게요.",
				},
			],
		});
		const result = runPersona([
			"--workspace", root,
			"--simulator-request-file", requestFile,
			"--simulator-result-file", resultFile,
			"--backend", "fixture",
			"--fixture-results-file", fixtureFile,
		], root);
		assert.equal(result.status, 0, result.stderr);
		const output = JSON.parse(readFileSync(resultFile, "utf-8"));
		assert.equal(output.executionStatus, "completed");
		assert.equal(output.action, "continue");
		assert.equal(output.simulatorTurn.text, "현재 review 대상이 어느 repo인지 먼저 확인할게요.");
	} finally {
		rmSync(root, { recursive: true, force: true });
	}
});

test("run-live-simulator-persona can stop from a fixture response", () => {
	const root = mkdtempSync(join(tmpdir(), "cautilus-live-persona-stop-"));
	try {
		const requestFile = join(root, "request.json");
		const resultFile = join(root, "result.json");
		const fixtureFile = join(root, "fixture.json");
		writeJson(requestFile, {
			schemaVersion: "cautilus.live_run_simulator_request.v1",
			requestId: "req-2",
			instanceId: "ceal",
			scenarioId: "scenario-2",
			turnIndex: 2,
			maxTurns: 3,
			instructions: "Stop when the user goal is already satisfied.",
			transcript: [
				{
					turnIndex: 1,
					simulatorTurn: { text: "review 해주세요" },
					assistantTurn: { text: "대상 repo와 기준을 먼저 알려주세요." },
				},
			],
		});
		writeJson(fixtureFile, {
			responses: [
				{ action: "continue", nextTurnText: "repo는 cautilus입니다." },
				{ action: "stop", stopReason: "goal_satisfied", summary: "The user goal is already satisfied." },
			],
		});
		const result = runPersona([
			"--workspace", root,
			"--simulator-request-file", requestFile,
			"--simulator-result-file", resultFile,
			"--backend", "fixture",
			"--fixture-results-file", fixtureFile,
		], root);
		assert.equal(result.status, 0, result.stderr);
		const output = JSON.parse(readFileSync(resultFile, "utf-8"));
		assert.equal(output.executionStatus, "completed");
		assert.equal(output.action, "stop");
		assert.equal(output.stopReason, "goal_satisfied");
	} finally {
		rmSync(root, { recursive: true, force: true });
	}
});
