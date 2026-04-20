import assert from "node:assert/strict";
import { chmodSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { spawnSync } from "node:child_process";
import test from "node:test";

const SCRIPT_PATH = join(process.cwd(), "scripts", "agent-runtime", "run-executor-variants.mjs");

function writeExecutable(root, name, body) {
	const filePath = join(root, name);
	writeFileSync(filePath, body, "utf-8");
	chmodSync(filePath, 0o755);
	return filePath;
}

test("run-executor-variants delegates to cautilus review variants", () => {
	const root = mkdtempSync(join(tmpdir(), "cautilus-review-shim-"));
	try {
		const argsFile = join(root, "args.txt");
		const fakeBin = writeExecutable(root, "fake-cautilus.sh", `#!/bin/sh
printf '%s\n' "$@" > "$CAUTILUS_TEST_ARGS_FILE"
echo shim-stdout
echo shim-stderr >&2
exit 7
`);
		const result = spawnSync("node", [SCRIPT_PATH, "--workspace", ".", "--output-dir", "/tmp/cautilus-review"], {
			encoding: "utf-8",
			env: {
				...process.env,
				CAUTILUS_CLI_SHIM_BIN: fakeBin,
				CAUTILUS_TEST_ARGS_FILE: argsFile,
			},
		});
		assert.equal(result.status, 7);
		assert.equal(result.stdout, "shim-stdout\n");
		assert.equal(result.stderr, "shim-stderr\n");
		assert.deepEqual(readFileSync(argsFile, "utf-8").trim().split("\n"), [
			"review",
			"variants",
			"--workspace",
			".",
			"--output-dir",
			"/tmp/cautilus-review",
		]);
	} finally {
		rmSync(root, { recursive: true, force: true });
	}
});
