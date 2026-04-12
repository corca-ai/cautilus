import assert from "node:assert/strict";
import { chmodSync, mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, delimiter } from "node:path";
import { spawnSync } from "node:child_process";
import test from "node:test";

const SCRIPT_PATH = join(process.cwd(), "scripts", "run-govulncheck.mjs");

function writeExecutable(root, name, body) {
	const target = join(root, name);
	mkdirSync(join(target, ".."), { recursive: true });
	writeFileSync(target, body, "utf-8");
	chmodSync(target, 0o755);
	return target;
}

test("run-govulncheck executes a PATH-provided govulncheck binary", () => {
	const root = mkdtempSync(join(tmpdir(), "cautilus-govulncheck-path-"));
	try {
		writeExecutable(
			root,
			"govulncheck",
			"#!/usr/bin/env sh\nset -eu\nprintf 'govulncheck ok %s\\n' \"$*\"\n",
		);
		const result = spawnSync(process.execPath, [SCRIPT_PATH, "./..."], {
			cwd: process.cwd(),
			encoding: "utf-8",
			env: {
				...process.env,
				PATH: `${root}${delimiter}${process.env.PATH ?? ""}`,
			},
		});
		assert.equal(result.status, 0, result.stderr);
		assert.match(result.stdout, /govulncheck ok \.\/\.\.\./);
	} finally {
		rmSync(root, { recursive: true, force: true });
	}
});

test("run-govulncheck prints an actionable install hint when the binary is missing", () => {
	const root = mkdtempSync(join(tmpdir(), "cautilus-govulncheck-missing-"));
	try {
		const result = spawnSync(process.execPath, [SCRIPT_PATH, "./..."], {
			cwd: process.cwd(),
			encoding: "utf-8",
			env: {
				...process.env,
				PATH: root,
			},
		});
		assert.equal(result.status, 1);
		assert.match(result.stderr, /govulncheck was not found/);
		assert.match(result.stderr, /golang\.org\/x\/vuln\/cmd\/govulncheck@v1\.1\.4/);
	} finally {
		rmSync(root, { recursive: true, force: true });
	}
});
