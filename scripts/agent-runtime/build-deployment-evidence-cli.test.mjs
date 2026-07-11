import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const SCRIPT_PATH = fileURLToPath(new URL("./build-deployment-evidence.mjs", import.meta.url));
const EXAMPLE_INPUT_PATH = fileURLToPath(
	new URL("../../fixtures/deployment-evidence/example-input.json", import.meta.url),
);

function snapshotFiles(path) {
	return Object.fromEntries(
		readdirSync(path).map((name) => [name, readFileSync(join(path, name), "utf-8")]),
	);
}

test("build deployment evidence CLI accepts valid input and output paths", () => {
	const sandboxCwd = mkdtempSync(join(tmpdir(), "cautilus-deployment-evidence-valid-"));
	try {
		const outputPath = join(sandboxCwd, "evidence.json");
		const result = spawnSync(
			process.execPath,
			[SCRIPT_PATH, "--input", EXAMPLE_INPUT_PATH, "--output", outputPath],
			{ cwd: sandboxCwd, encoding: "utf-8" },
		);
		assert.equal(result.status, 0, result.stderr);
		assert.equal(result.stderr, "");
		assert.equal(existsSync(outputPath), true);
		const packet = JSON.parse(readFileSync(outputPath, "utf-8"));
		assert.equal(packet.schemaVersion, "cautilus.deployment_evidence.v1");
		assert.equal(packet.overall.rowCount, 2);
	} finally {
		rmSync(sandboxCwd, { recursive: true, force: true });
	}
});

test("build deployment evidence CLI rejects malformed required values before filesystem access", () => {
	const cases = [
		{ option: "--input", value: "--help", prefix: [], seedInput: true },
		{ option: "--input", value: " \t\n", prefix: [], seedInput: true },
		{ option: "--output", value: "--help", prefix: ["--input", EXAMPLE_INPUT_PATH] },
		{ option: "--output", value: " \t\n", prefix: ["--input", EXAMPLE_INPUT_PATH] },
	];

	for (const testCase of cases) {
		const sandboxCwd = mkdtempSync(join(tmpdir(), "cautilus-deployment-evidence-invalid-"));
		try {
			if (testCase.seedInput) {
				writeFileSync(
					join(sandboxCwd, testCase.value),
					readFileSync(EXAMPLE_INPUT_PATH, "utf-8"),
					"utf-8",
				);
			}
			const before = snapshotFiles(sandboxCwd);
			const result = spawnSync(
				process.execPath,
				[SCRIPT_PATH, ...testCase.prefix, testCase.option, testCase.value],
				{ cwd: sandboxCwd, encoding: "utf-8" },
			);
			assert.notEqual(result.status, 0, `${testCase.option} accepted ${JSON.stringify(testCase.value)}`);
			assert.match(result.stderr, new RegExp(`Missing value for ${testCase.option}`));
			assert.deepEqual(snapshotFiles(sandboxCwd), before);
		} finally {
			rmSync(sandboxCwd, { recursive: true, force: true });
		}
	}
});

test("build deployment evidence CLI reports invalid JSON without a stack trace", () => {
	const sandboxCwd = mkdtempSync(join(tmpdir(), "cautilus-deployment-evidence-json-"));
	try {
		const inputPath = join(sandboxCwd, "invalid.json");
		const outputPath = join(sandboxCwd, "evidence.json");
		writeFileSync(inputPath, "SECRET_SENTINEL\nX", "utf-8");
		const result = spawnSync(
			process.execPath,
			[SCRIPT_PATH, "--input", inputPath, "--output", outputPath],
			{ cwd: sandboxCwd, encoding: "utf-8" },
		);
		assert.notEqual(result.status, 0);
		assert.equal(result.stderr, `invalid JSON in input file: ${inputPath}\n`);
		assert.doesNotMatch(result.stderr, /SECRET_SENTINEL/);
		assert.doesNotMatch(result.stderr, /SyntaxError|\n\s+at /);
		assert.equal(existsSync(outputPath), false);
	} finally {
		rmSync(sandboxCwd, { recursive: true, force: true });
	}
});

test("build deployment evidence CLI reports semantic errors without a stack trace", () => {
	const sandboxCwd = mkdtempSync(join(tmpdir(), "cautilus-deployment-evidence-semantic-"));
	try {
		const inputPath = join(sandboxCwd, "invalid-contract.json");
		const outputPath = join(sandboxCwd, "evidence.json");
		writeFileSync(inputPath, JSON.stringify({ schemaVersion: "wrong", rows: [] }), "utf-8");
		const result = spawnSync(
			process.execPath,
			[SCRIPT_PATH, "--input", inputPath, "--output", outputPath],
			{ cwd: sandboxCwd, encoding: "utf-8" },
		);
		assert.notEqual(result.status, 0);
		assert.equal(result.stderr, "schemaVersion must be cautilus.deployment_evidence_inputs.v1\n");
		assert.doesNotMatch(result.stderr, /file:\/\/|\n\s+at |Node\.js/);
		assert.equal(existsSync(outputPath), false);
	} finally {
		rmSync(sandboxCwd, { recursive: true, force: true });
	}
});

test("build deployment evidence CLI keeps write errors on one line", () => {
	const sandboxCwd = mkdtempSync(join(tmpdir(), "cautilus-deployment-evidence-write-"));
	try {
		const outputPath = join(sandboxCwd, "output\nINJECTED");
		mkdirSync(outputPath);
		const result = spawnSync(
			process.execPath,
			[SCRIPT_PATH, "--input", EXAMPLE_INPUT_PATH, "--output", outputPath],
			{ cwd: sandboxCwd, encoding: "utf-8" },
		);
		assert.notEqual(result.status, 0);
		assert.equal(result.stderr.split("\n").length, 2, result.stderr);
		assert.match(result.stderr, /output INJECTED/);
		assert.doesNotMatch(result.stderr, /file:\/\/|\n\s+at |Node\.js/);
	} finally {
		rmSync(sandboxCwd, { recursive: true, force: true });
	}
});
