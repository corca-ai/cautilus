import assert from "node:assert/strict";
import { chmodSync, mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { spawnSync } from "node:child_process";
import test from "node:test";

const SCRIPT_PATH = join(process.cwd(), "scripts", "agent-runtime", "run-workbench-review-variant.sh");

function writeExecutable(root, name, body) {
	const filePath = join(root, name);
	writeFileSync(filePath, body, "utf-8");
	chmodSync(filePath, 0o755);
	return filePath;
}

function writeJson(root, name, value) {
	const filePath = join(root, name);
	writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`, "utf-8");
	return filePath;
}

function runVariant(root, backend, outputName = `${backend}-output.json`) {
	const workspace = join(root, "workspace");
	mkdirSync(workspace, { recursive: true });
	const promptFile = join(root, `${backend}-prompt.txt`);
	const schemaFile = writeJson(root, `${backend}-schema.json`, {
		type: "object",
		additionalProperties: false,
		required: ["kind"],
		properties: {
			kind: { type: "string" },
			reason: { type: "string" },
		},
	});
	const outputFile = join(root, outputName);
	writeFileSync(promptFile, "Return the structured verdict.\n", "utf-8");
	const result = spawnSync(
		"bash",
		[
			SCRIPT_PATH,
			"--backend",
			backend,
			"--workspace",
			workspace,
			"--prompt-file",
			promptFile,
			"--schema-file",
			schemaFile,
			"--output-file",
			outputFile,
		],
		{
			cwd: process.cwd(),
			env: {
				...process.env,
				PATH: `${root}:${process.env.PATH ?? ""}`,
			},
			encoding: "utf-8",
		},
	);
	return { result, outputFile };
}

function runVariantWithEnv(root, backend, env, outputName = `${backend}-output.json`) {
	const workspace = join(root, "workspace");
	mkdirSync(workspace, { recursive: true });
	const promptFile = join(root, `${backend}-prompt.txt`);
	const schemaFile = writeJson(root, `${backend}-schema.json`, {
		type: "object",
		additionalProperties: false,
		required: ["kind"],
		properties: {
			kind: { type: "string" },
			reason: { type: "string" },
		},
	});
	const outputFile = join(root, outputName);
	writeFileSync(promptFile, "Return the structured verdict.\n", "utf-8");
	const result = spawnSync(
		"bash",
		[
			SCRIPT_PATH,
			"--backend",
			backend,
			"--workspace",
			workspace,
			"--prompt-file",
			promptFile,
			"--schema-file",
			schemaFile,
			"--output-file",
			outputFile,
		],
		{
			cwd: process.cwd(),
			env: {
				...process.env,
				...env,
				PATH: `${root}:${process.env.PATH ?? ""}`,
			},
			encoding: "utf-8",
		},
	);
	return { result, outputFile };
}

test("codex_exec wrapper closes stdin and writes structured output to the requested file", () => {
	const root = mkdtempSync(join(tmpdir(), "cautilus-workbench-codex-"));
	try {
		writeExecutable(
			root,
			"codex",
			`#!/bin/sh
out=""
while [ "$#" -gt 0 ]; do
  if [ "$1" = "-o" ]; then
    out="$2"
    shift 2
    continue
  fi
  shift
done
cat >/dev/null
printf '%s\\n' '{"kind":"stop","reason":"goal_satisfied"}' > "$out"
`,
		);
		const { result, outputFile } = runVariant(root, "codex_exec");
		assert.equal(result.status, 0, result.stderr);
		assert.deepEqual(JSON.parse(readFileSync(outputFile, "utf-8")), {
			kind: "stop",
			reason: "goal_satisfied",
		});
	} finally {
		rmSync(root, { recursive: true, force: true });
	}
});

test("claude_p wrapper extracts structured_output into the final output file", () => {
	const root = mkdtempSync(join(tmpdir(), "cautilus-workbench-claude-"));
	try {
		writeExecutable(
			root,
			"claude",
			`#!/bin/sh
schema=""
prev=""
for arg in "$@"; do
  if [ "$prev" = "--json-schema" ]; then
    schema="$arg"
    break
  fi
  prev="$arg"
done
printf '%s' "$schema" | grep -q '"kind"' || exit 17
cat >/dev/null
printf '%s\\n' '{"is_error":false,"structured_output":{"kind":"stop","reason":"goal_satisfied"}}'
`,
		);
		const { result, outputFile } = runVariant(root, "claude_p");
		assert.equal(result.status, 0, result.stderr);
		assert.deepEqual(JSON.parse(readFileSync(outputFile, "utf-8")), {
			kind: "stop",
			reason: "goal_satisfied",
		});
	} finally {
		rmSync(root, { recursive: true, force: true });
	}
});

test("codex_exec wrapper fails when codex stderr matches fatal skill-load patterns", () => {
	const root = mkdtempSync(join(tmpdir(), "cautilus-workbench-codex-stderr-"));
	try {
		writeExecutable(
			root,
			"codex",
			`#!/bin/sh
out=""
while [ "$#" -gt 0 ]; do
  if [ "$1" = "-o" ]; then
    out="$2"
    shift 2
    continue
  fi
  shift
done
echo 'failed to load skill /tmp/SKILL.md: invalid YAML' 1>&2
printf '%s\\n' '{"kind":"stop","reason":"goal_satisfied"}' > "$out"
`,
		);
		const { result, outputFile } = runVariant(root, "codex_exec", "codex-stderr-output.json");
		assert.notEqual(result.status, 0);
		assert.match(result.stderr, /fatal stderr pattern/);
		assert.match(readFileSync(`${outputFile}.stderr`, "utf-8"), /failed to load skill/);
	} finally {
		rmSync(root, { recursive: true, force: true });
	}
});

test("codex_exec wrapper forwards optional model config from environment", () => {
	const root = mkdtempSync(join(tmpdir(), "cautilus-workbench-codex-config-"));
	try {
		const argsFile = join(root, "codex-args.txt");
		writeExecutable(
			root,
			"codex",
			`#!/bin/sh
printf '%s\n' "$@" > "${argsFile}"
out=""
while [ "$#" -gt 0 ]; do
  if [ "$1" = "-o" ]; then
    out="$2"
    shift 2
    continue
  fi
  shift
done
cat >/dev/null
printf '%s\\n' '{"kind":"stop","reason":"goal_satisfied"}' > "$out"
`,
		);
		const { result } = runVariantWithEnv(
			root,
			"codex_exec",
			{
				WORKBENCH_CODEX_MODEL: "gpt-5.4",
				WORKBENCH_CODEX_REASONING_EFFORT: "low",
			},
			"codex-config-output.json",
		);
		assert.equal(result.status, 0, result.stderr);
		const args = readFileSync(argsFile, "utf-8");
		assert.match(args, /^exec$/m);
		assert.match(args, /^--model$/m);
		assert.match(args, /^gpt-5\.4$/m);
		assert.match(args, /^-c$/m);
		assert.match(args, /^model_reasoning_effort="low"$/m);
	} finally {
		rmSync(root, { recursive: true, force: true });
	}
});
