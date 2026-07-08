import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { chmodSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
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
	return sendAsserts(cwd, [message], env).then((responses) => responses[0]);
}

function sendAsserts(cwd, messages, env = {}) {
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
			resolve(stdout.trim().split("\n").filter(Boolean).map((line) => JSON.parse(line)));
		});
		child.stdin.end(messages.map((message) => JSON.stringify(message)).join("\n") + "\n");
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

test("cautilus-json-command verifies selected command JSON and sibling meaning", async () => {
	await withTempDir("json-command", async (root) => {
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
				check: "cautilus-json-command",
				checkParams: { command: "cautilus doctor --repo-root ." },
				columns: ["label", "path", "equals", "meaning"],
				cells: [
					"first bounded eval",
					"checks[id=execution_surface].ok",
					"true",
					"Cautilus can point the user to an executable first run.",
				],
			},
			{ CAUTILUS_BIN: fakeCautilus },
		);
		assert.equal(response.type, "passed");
	});
});

test("cautilus-json-command can verify nonzero JSON command payloads", async () => {
	await withTempDir("json-command-nonzero", async (root) => {
		const fakeCautilus = join(root, "fake-cautilus.mjs");
		writeFileSync(
			fakeCautilus,
			[
				"#!/usr/bin/env node",
				"console.log(JSON.stringify({",
				"  status: 'incomplete_adapter',",
				"  next_action: { kind: 'edit_adapter' }",
				"}));",
				"process.exit(1);",
			].join("\n"),
			"utf-8",
		);
		chmodSync(fakeCautilus, 0o755);
		const response = await sendAssert(
			root,
			{
				type: "assert",
				id: 1,
				check: "cautilus-json-command",
				checkParams: { command: "cautilus doctor --repo-root .", exit_code: "1" },
				columns: ["path", "equals"],
				cells: ["next_action.kind", "edit_adapter"],
			},
			{ CAUTILUS_BIN: fakeCautilus },
		);
		assert.equal(response.type, "passed");
	});
});

test("cautilus-json-command reuses identical command JSON within one adapter process", async () => {
	await withTempDir("json-command-cache", async (root) => {
		const fakeCautilus = join(root, "fake-cautilus.mjs");
		const counterPath = join(root, "counter.txt");
		writeFileSync(
			fakeCautilus,
			[
				"#!/usr/bin/env node",
				"import { existsSync, readFileSync, writeFileSync } from 'node:fs';",
				`const counterPath = ${JSON.stringify(counterPath)};`,
				"const current = existsSync(counterPath) ? Number(readFileSync(counterPath, 'utf-8')) : 0;",
				"writeFileSync(counterPath, String(current + 1));",
				"console.log(JSON.stringify({ schemaVersion: 'example.v1', status: 'ready' }));",
			].join("\n"),
			"utf-8",
		);
		chmodSync(fakeCautilus, 0o755);
		const responses = await sendAsserts(
			root,
			[
				{
					type: "assert",
					id: 1,
					check: "cautilus-json-command",
					checkParams: { command: "cautilus doctor --repo-root ." },
					columns: ["path", "equals"],
					cells: ["schemaVersion", "example.v1"],
				},
				{
					type: "assert",
					id: 2,
					check: "cautilus-json-command",
					checkParams: { command: "cautilus doctor --repo-root ." },
					columns: ["path", "equals"],
					cells: ["status", "ready"],
				},
			],
			{ CAUTILUS_BIN: fakeCautilus },
		);
		assert.deepEqual(responses.map((response) => response.type), ["passed", "passed"]);
		assert.equal(readFileSync(counterPath, "utf-8"), "1");
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
