import assert from "node:assert/strict";
import { resolve } from "node:path";
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
		assert.equal(starter.commands.length, 3);
		for (const command of starter.commands) {
			assert.equal(command.stdout, undefined);
			assert.equal(command.stderr, undefined);
		}
	}
});
