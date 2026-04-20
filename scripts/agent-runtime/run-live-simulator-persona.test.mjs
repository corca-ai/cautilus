import assert from "node:assert/strict";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { spawnSync } from "node:child_process";
import test from "node:test";

const SCRIPT_PATH = join(process.cwd(), "scripts", "agent-runtime", "run-live-simulator-persona.mjs");

function runPersonaHelper(args, cwd = process.cwd()) {
	return spawnSync("node", [SCRIPT_PATH, ...args], {
		cwd,
		encoding: "utf-8",
	});
}

function writeJSON(path, value) {
	writeFileSync(path, `${JSON.stringify(value, null, 2)}\n`, "utf-8");
}

function writeSimulatorRequest(root, turnIndex) {
	const requestFile = join(root, `request-${turnIndex}.json`);
	writeJSON(requestFile, {
		schemaVersion: "cautilus.live_run_simulator_request.v1",
		requestId: "req-persona-123",
		instanceId: "ceal",
		scenarioId: "persona-review",
		turnIndex,
		maxTurns: 3,
		instructions: "Act like a pragmatic operator. Stop once enough context is collected.",
		transcript: turnIndex === 1 ? [] : [
			{
				turnIndex: 1,
				simulatorTurn: { text: "대상 repo는 cautilus입니다." },
				assistantTurn: { text: "좋습니다. 바로 검토하겠습니다." },
			},
		],
	});
	return requestFile;
}

test("run-live-simulator-persona returns a fixture-backed continue turn", () => {
	const root = mkdtempSync(join(tmpdir(), "cautilus-live-persona-continue-"));
	try {
		const fixtureFile = join(root, "fixture.json");
		const requestFile = writeSimulatorRequest(root, 1);
		const outputFile = join(root, "result.json");
		writeJSON(fixtureFile, {
			responses: [
				{
					action: "continue",
					summary: "The synthetic user still needs the repo name.",
					nextTurnText: "대상 repo는 cautilus입니다.",
				},
			],
		});
		const result = runPersonaHelper([
			"--workspace",
			root,
			"--simulator-request-file",
			requestFile,
			"--simulator-result-file",
			outputFile,
			"--backend",
			"fixture",
			"--fixture-results-file",
			fixtureFile,
		]);
		assert.equal(result.status, 0, result.stderr);
		const payload = JSON.parse(readFileSync(outputFile, "utf-8"));
		assert.equal(payload.executionStatus, "completed");
		assert.equal(payload.action, "continue");
		assert.equal(payload.simulatorTurn.text, "대상 repo는 cautilus입니다.");
	} finally {
		rmSync(root, { recursive: true, force: true });
	}
});

test("run-live-simulator-persona returns a fixture-backed stop result", () => {
	const root = mkdtempSync(join(tmpdir(), "cautilus-live-persona-stop-"));
	try {
		const fixtureFile = join(root, "fixture.json");
		const requestFile = writeSimulatorRequest(root, 2);
		const outputFile = join(root, "result.json");
		writeJSON(fixtureFile, {
			responses: [
				{
					action: "continue",
					summary: "The synthetic user still needs the repo name.",
					nextTurnText: "대상 repo는 cautilus입니다.",
				},
				{
					action: "stop",
					stopReason: "goal_satisfied",
					summary: "The synthetic user has enough context to stop.",
				},
			],
		});
		const result = runPersonaHelper([
			"--workspace",
			root,
			"--simulator-request-file",
			requestFile,
			"--simulator-result-file",
			outputFile,
			"--backend",
			"fixture",
			"--fixture-results-file",
			fixtureFile,
		]);
		assert.equal(result.status, 0, result.stderr);
		const payload = JSON.parse(readFileSync(outputFile, "utf-8"));
		assert.equal(payload.executionStatus, "completed");
		assert.equal(payload.action, "stop");
		assert.equal(payload.stopReason, "goal_satisfied");
	} finally {
		rmSync(root, { recursive: true, force: true });
	}
});
