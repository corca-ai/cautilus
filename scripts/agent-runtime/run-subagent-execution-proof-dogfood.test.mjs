import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { join } from "node:path";
import test from "node:test";

const SCRIPT = join(process.cwd(), "scripts", "agent-runtime", "run-subagent-execution-proof-dogfood.mjs");

test("subagent dogfood wrapper runs all backends before failing", () => {
	const commands = [
		{
			id: "first",
			command: process.execPath,
			args: ["-e", "process.exit(3)"],
		},
		{
			id: "second",
			command: process.execPath,
			args: ["-e", "process.stderr.write('SECOND_RAN\\n')"],
		},
	];
	const result = spawnSync(process.execPath, [SCRIPT], {
		encoding: "utf-8",
		env: {
			...process.env,
			CAUTILUS_SUBAGENT_DOGFOOD_COMMANDS_JSON: JSON.stringify(commands),
		},
	});
	assert.equal(result.status, 1);
	assert.match(result.stderr, /first failed status=3/);
	assert.match(result.stderr, /SECOND_RAN/);
	assert.match(result.stderr, /summary: 1\/2 passed/);
});
