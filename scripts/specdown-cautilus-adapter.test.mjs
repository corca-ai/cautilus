import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { chmodSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";

const ADAPTER_PATH = join(process.cwd(), "scripts", "specdown", "cautilus-adapter.mjs");

async function withTempDir(label, fn) {
	const root = mkdtempSync(join(tmpdir(), `cautilus-specdown-adapter-${label}-`));
	try {
		return await fn(root);
	} finally {
		rmSync(root, { recursive: true, force: true });
	}
}

function sendAssert(cwd, message, env = {}) {
	return new Promise((resolve, reject) => {
		const child = spawn("node", [ADAPTER_PATH], {
			cwd,
			env: { ...process.env, ...env },
			stdio: ["pipe", "pipe", "pipe"],
		});
		let stdout = "";
		let stderr = "";
		child.stdout.on("data", (chunk) => {
			stdout += chunk;
		});
		child.stderr.on("data", (chunk) => {
			stderr += chunk;
		});
		child.on("error", reject);
		child.on("close", (code) => {
			if (code !== 0) {
				reject(new Error(`adapter exited ${code}: ${stderr}`));
				return;
			}
			resolve(JSON.parse(stdout.trim()));
		});
		child.stdin.end(`${JSON.stringify(message)}\n`);
	});
}

test("cautilus-json-file checks structured values in a JSON artifact", async () => {
	await withTempDir("json-file", async (root) => {
		writeFileSync(
			join(root, "artifact.json"),
			JSON.stringify({
				schemaVersion: "example.v1",
				counts: { passed: 3 },
				items: [{ id: "alpha" }],
			}),
			"utf-8",
		);
		const response = await sendAssert(root, {
			type: "assert",
			id: 1,
			check: "cautilus-json-file",
			columns: ["path", "json_path", "min_number"],
			cells: ["artifact.json", "counts.passed", "2"],
		});
		assert.equal(response.type, "passed");
	});
});

test("cautilus-readiness verifies doctor check meaning from command output", async () => {
	await withTempDir("readiness", async (root) => {
		const fakeCautilus = join(root, "fake-cautilus.mjs");
		writeFileSync(
			fakeCautilus,
			[
				"#!/usr/bin/env node",
				"console.log(JSON.stringify({",
				"  status: 'ready',",
				"  checks: [{",
				"    id: 'execution_surface',",
				"    ok: true,",
				"    meaning: 'Cautilus can point the user to an executable first run.'",
				"  }]",
				"}));",
			].join("\n"),
			"utf-8",
		);
		chmodSync(fakeCautilus, 0o755);
		const response = await sendAssert(
			root,
			{
				type: "assert",
				id: 1,
				check: "cautilus-readiness",
				columns: ["workflow", "command", "doctor_check", "meaning"],
				cells: [
					"first bounded eval",
					"cautilus doctor --repo-root .",
					"execution_surface",
					"Cautilus can point the user to an executable first run.",
				],
			},
			{ CAUTILUS_BIN: fakeCautilus },
		);
		assert.equal(response.type, "passed");
	});
});

test("cautilus-json-file reports mismatched structured values", async () => {
	await withTempDir("json-file-fail", async (root) => {
		writeFileSync(join(root, "artifact.json"), JSON.stringify({ schemaVersion: "example.v1" }), "utf-8");
		const response = await sendAssert(root, {
			type: "assert",
			id: 1,
			check: "cautilus-json-file",
			columns: ["path", "json_path", "equals"],
			cells: ["artifact.json", "schemaVersion", "other.v1"],
		});
		assert.equal(response.type, "failed");
		assert.match(response.message, /JSON value mismatch/);
	});
});
