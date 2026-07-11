import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { existsSync, mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const SCRIPT_PATH = fileURLToPath(
	new URL("./prepare-deployment-evidence-input.mjs", import.meta.url),
);
const SCENARIO_RESULTS_PATH = fileURLToPath(
	new URL("../../fixtures/scenario-results/example-results.json", import.meta.url),
);

function snapshotFiles(path) {
	return Object.fromEntries(
		readdirSync(path).map((name) => [name, readFileSync(join(path, name), "utf-8")]),
	);
}

function validArgs(outputPath) {
	return [
		"--surface",
		"workflow",
		"--runtime",
		"codex",
		"--source-kind",
		"scenario_results",
		"--input",
		SCENARIO_RESULTS_PATH,
		"--output",
		outputPath,
	];
}

function replaceOptionValue(args, option, value) {
	const next = [...args];
	const index = next.indexOf(option);
	assert.notEqual(index, -1, `missing test option ${option}`);
	next[index + 1] = value;
	return next;
}

test("prepare deployment evidence input CLI accepts valid values", () => {
	const sandboxCwd = mkdtempSync(join(tmpdir(), "cautilus-deployment-input-valid-"));
	try {
		const outputPath = join(sandboxCwd, "input.json");
		const result = spawnSync(process.execPath, [SCRIPT_PATH, ...validArgs(outputPath)], {
			cwd: sandboxCwd,
			encoding: "utf-8",
		});
		assert.equal(result.status, 0, result.stderr);
		assert.equal(result.stderr, "");
		const packet = JSON.parse(readFileSync(outputPath, "utf-8"));
		assert.equal(packet.schemaVersion, "cautilus.deployment_evidence_inputs.v1");
		assert.equal(packet.rows.length, 1);
		assert.equal(packet.rows[0].runtime, "codex");
	} finally {
		rmSync(sandboxCwd, { recursive: true, force: true });
	}
});

test("prepare deployment evidence input CLI rejects malformed values before side effects", () => {
	const cases = [
		{ option: "--surface", value: "--help" },
		{ option: "--runtime", value: "--help" },
		{ option: "--source-kind", value: "--help" },
		{ option: "--input", value: "--help", seedInput: true },
		{ option: "--pass-status", value: "--help", append: true },
		{ option: "--output", value: "--help" },
		{ option: "--output", value: " \t\n" },
	];

	for (const testCase of cases) {
		const sandboxCwd = mkdtempSync(join(tmpdir(), "cautilus-deployment-input-invalid-"));
		try {
			if (testCase.seedInput) {
				writeFileSync(
					join(sandboxCwd, testCase.value),
					readFileSync(SCENARIO_RESULTS_PATH, "utf-8"),
					"utf-8",
				);
			}
			const outputPath = join(sandboxCwd, "input.json");
			const baseArgs = validArgs(outputPath);
			const args = testCase.append
				? [...baseArgs, testCase.option, testCase.value]
				: replaceOptionValue(baseArgs, testCase.option, testCase.value);
			const before = snapshotFiles(sandboxCwd);
			const result = spawnSync(process.execPath, [SCRIPT_PATH, ...args], {
				cwd: sandboxCwd,
				encoding: "utf-8",
			});
			assert.notEqual(result.status, 0, `${testCase.option} accepted ${JSON.stringify(testCase.value)}`);
			assert.match(result.stderr, new RegExp(`Missing value for ${testCase.option}`));
			assert.deepEqual(snapshotFiles(sandboxCwd), before);
		} finally {
			rmSync(sandboxCwd, { recursive: true, force: true });
		}
	}
});

test("prepare deployment evidence input CLI reports invalid JSON without a stack trace", () => {
	const sandboxCwd = mkdtempSync(join(tmpdir(), "cautilus-deployment-input-json-"));
	try {
		const inputPath = join(sandboxCwd, "invalid.json");
		const outputPath = join(sandboxCwd, "input.json");
		writeFileSync(inputPath, "SECRET_SENTINEL\nX", "utf-8");
		const args = replaceOptionValue(validArgs(outputPath), "--input", inputPath);
		const result = spawnSync(process.execPath, [SCRIPT_PATH, ...args], {
			cwd: sandboxCwd,
			encoding: "utf-8",
		});
		assert.notEqual(result.status, 0);
		assert.equal(result.stderr, `invalid JSON in input file: ${inputPath}\n`);
		assert.doesNotMatch(result.stderr, /SECRET_SENTINEL/);
		assert.doesNotMatch(result.stderr, /SyntaxError|\n\s+at /);
		assert.equal(existsSync(outputPath), false);
	} finally {
		rmSync(sandboxCwd, { recursive: true, force: true });
	}
});
