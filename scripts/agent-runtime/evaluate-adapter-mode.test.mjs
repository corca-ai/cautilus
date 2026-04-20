import assert from "node:assert/strict";
import { chmodSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { spawnSync } from "node:child_process";
import test from "node:test";

import { ADAPTER_MODE_EVALUATION_PACKET_SCHEMA } from "./evaluate-adapter-mode.mjs";

const SCRIPT_PATH = join(process.cwd(), "scripts", "agent-runtime", "evaluate-adapter-mode.mjs");

function writeExecutable(root, name, body) {
	const filePath = join(root, name);
	writeFileSync(filePath, body, "utf-8");
	chmodSync(filePath, 0o755);
	return filePath;
}

test("evaluate-adapter-mode re-exports the adapter mode packet schema", () => {
	assert.equal(ADAPTER_MODE_EVALUATION_PACKET_SCHEMA, "cautilus.adapter_mode_evaluation.v1");
});

test("evaluate-adapter-mode delegates to cautilus mode evaluate", () => {
	const root = mkdtempSync(join(tmpdir(), "cautilus-mode-shim-"));
	try {
		const argsFile = join(root, "args.txt");
		const fakeBin = writeExecutable(root, "fake-cautilus.sh", `#!/bin/sh
printf '%s\n' "$@" > "$CAUTILUS_TEST_ARGS_FILE"
echo shim-stdout
echo shim-stderr >&2
exit 9
`);
		const result = spawnSync(
			"node",
			[
				SCRIPT_PATH,
				"--repo-root",
				".",
				"--mode",
				"held_out",
				"--intent",
				"Operator-facing behavior should remain legible.",
			],
			{
				encoding: "utf-8",
				env: {
					...process.env,
					CAUTILUS_CLI_SHIM_BIN: fakeBin,
					CAUTILUS_TEST_ARGS_FILE: argsFile,
				},
			},
		);
		assert.equal(result.status, 9);
		assert.equal(result.stdout, "shim-stdout\n");
		assert.equal(result.stderr, "shim-stderr\n");
		assert.deepEqual(readFileSync(argsFile, "utf-8").trim().split("\n"), [
			"mode",
			"evaluate",
			"--repo-root",
			".",
			"--mode",
			"held_out",
			"--intent",
			"Operator-facing behavior should remain legible.",
		]);
	} finally {
		rmSync(root, { recursive: true, force: true });
	}
});
