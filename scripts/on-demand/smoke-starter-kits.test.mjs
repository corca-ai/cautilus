import assert from "node:assert/strict";
import { isAbsolute, resolve } from "node:path";
import test from "node:test";

import { parseArgs, runStarterKitSmoke } from "./smoke-starter-kits.mjs";

test("parseArgs resolves the cautilus binary override", () => {
	assert.equal(parseArgs(["--cautilus-bin", "bin/cautilus"]).cautilusBin, resolve("bin/cautilus"));
	assert.throws(() => parseArgs(["--nope"]), /Unknown argument/);
});

test("starter kit smoke proves every normalization-family starter", () => {
	const result = runStarterKitSmoke({ cautilusBin: resolve(process.cwd(), "bin", "cautilus") });
	assert.equal(result.ok, true);
	assert.equal(result.schemaVersion, "cautilus.starter_kit_smoke.v1");
	assert.equal(result.starterCount, 3);
	assert.deepEqual(
		result.starters.map((entry) => entry.family),
		["chatbot", "skill", "workflow"],
	);
	for (const starter of result.starters) {
		assert.equal(starter.ok, true);
		assert.equal(starter.doctorReady, true);
		assert.ok(starter.candidateCount > 0);
		assert.equal(starter.starterPath, `examples/starters/${starter.family}`);
		assert.equal(starter.inputPath, `examples/starters/${starter.family}/input.json`);
		assert.equal(
			starter.normalizeCommand,
			`cautilus discover scenarios normalize ${starter.family} --input input.json`,
		);
		assert.equal(JSON.stringify(starter).includes(process.cwd()), false);
		assert.equal(isAbsolute(starter.starterPath), false);
		assert.equal(isAbsolute(starter.inputPath), false);
		assert.equal(starter.commands.length, 3);
		for (const command of starter.commands) {
			assert.equal(command.stdout, undefined);
			assert.equal(command.stderr, undefined);
			assert.equal(command.command, "bin/cautilus");
			for (const arg of command.args) {
				assert.equal(typeof arg === "string" && arg.startsWith(process.cwd()), false);
			}
		}
	}
});

test("starter kit smoke returns a structured failure packet when the binary cannot run", () => {
	const result = runStarterKitSmoke({ cautilusBin: resolve(process.cwd(), "bin", "missing-cautilus") });
	assert.equal(result.ok, false);
	assert.equal(result.schemaVersion, "cautilus.starter_kit_smoke.v1");
	assert.equal(result.starterCount, 3);
	assert.equal(result.starters.length, 3);
	for (const starter of result.starters) {
		assert.equal(starter.ok, false);
		assert.equal(starter.failure.phase, "doctor-adapter");
		assert.equal(starter.failure.command.command, "bin/missing-cautilus");
		assert.equal(starter.failure.command.exitCode, 1);
		assert.match(starter.failure.command.spawnError.message, /missing-cautilus/);
		assert.equal(JSON.stringify(starter).includes(process.cwd()), false);
	}
});
