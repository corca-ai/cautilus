import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import {
	PHASES,
	parseArgs,
	resolveScript,
	runtimeSignalPayload,
	runPhases,
} from "./run-verify.mjs";

function makeSink() {
	const chunks = [];
	const sink = {
		write(chunk) {
			chunks.push(String(chunk));
		},
	};
	return { sink, text: () => chunks.join("") };
}

function makeSpawn(plan) {
	const calls = [];
	return {
		calls,
		spawn(cmd, args) {
			const script = args[args.length - 1];
			calls.push({ cmd, script });
			const step = plan.shift() ?? { status: 0 };
			return step;
		},
	};
}

test("PHASES covers every npm run verify sub-phase", () => {
	const ids = PHASES.map((p) => p.id);
	assert.deepEqual(ids, [
		"lint:eslint",
		// TODO(specdown-rewrite): restore together with the lint:specs phase in run-verify.mjs.
		// "lint:specs",
		"lint:scenario-normalizers",
		"lint:contracts",
		"claims:audit-evidence",
		"claims:evidence-state:check",
		"release:claim-freshness",
		"claims:status-report:check",
		"lint:links",
		"lint:skill-disclosure",
		"lint:go",
		"vet:go",
		"security:govulncheck",
		"security:secrets",
		"test:go:race",
		"test:node",
		"test:coverage",
		"coverage:floor:check",
	]);
});

test("parseArgs defaults to non-verbose", () => {
	assert.deepEqual(parseArgs([]), {
		verbose: false,
		help: false,
		runtimeSignalPath: null,
	});
});

test("parseArgs recognizes --verbose", () => {
	assert.deepEqual(parseArgs(["--verbose"]), {
		verbose: true,
		help: false,
		runtimeSignalPath: null,
	});
});

test("parseArgs recognizes --help", () => {
	assert.deepEqual(parseArgs(["--help"]), {
		verbose: false,
		help: true,
		runtimeSignalPath: null,
	});
});

test("parseArgs recognizes runtime signal output", () => {
	assert.deepEqual(parseArgs(["--runtime-signal", "out/runtime.json"]), {
		verbose: false,
		help: false,
		runtimeSignalPath: "out/runtime.json",
	});
});

test("parseArgs rejects missing runtime signal path", () => {
	assert.throws(
		() => parseArgs(["--runtime-signal"]),
		/--runtime-signal requires a path/,
	);
});

test("parseArgs rejects unknown flags", () => {
	assert.throws(() => parseArgs(["--nope"]), /unknown argument/);
});

test("resolveScript swaps to verbose id when requested", () => {
	const testNode = PHASES.find((p) => p.id === "test:node");
	assert.equal(resolveScript(testNode, { verbose: false }), "test:node");
	assert.equal(resolveScript(testNode, { verbose: true }), "test:node:spec");
});

test("resolveScript keeps phase id when no verbose id declared", () => {
	const eslint = PHASES.find((p) => p.id === "lint:eslint");
	assert.equal(resolveScript(eslint, { verbose: true }), "lint:eslint");
});

test("runPhases emits one ▶ label per phase and ✔ on success", () => {
	const out = makeSink();
	const err = makeSink();
	const { spawn, calls } = makeSpawn([]);
	const phases = [
		{ id: "lint:a", label: "lint · a" },
		{ id: "lint:b", label: "lint · b" },
	];
	const result = runPhases(phases, {
		spawn,
		stdout: out.sink,
		stderr: err.sink,
	});
	assert.equal(result.ok, true);
	assert.equal(result.status, 0);
	assert.equal(calls.length, 2);
	assert.equal(calls[0].script, "lint:a");
	assert.equal(calls[1].script, "lint:b");
	const text = out.text();
	assert.match(text, /▶ lint · a/);
	assert.match(text, /▶ lint · b/);
	assert.match(text, /✔ lint · a/);
	assert.match(text, /✔ lint · b/);
	assert.match(text, /verify · all phases passed/);
});

test("runPhases writes a quality runtime signal when requested", () => {
	const root = mkdtempSync(join(tmpdir(), "cautilus-quality-runtime-"));
	const outputPath = join(root, "runtime", "verify.json");
	const out = makeSink();
	const err = makeSink();
	const { spawn } = makeSpawn([]);
	const phases = [{ id: "lint:a", label: "lint · a" }];
	const result = runPhases(phases, {
		spawn,
		stdout: out.sink,
		stderr: err.sink,
		runtimeSignalPath: outputPath,
	});
	assert.equal(result.ok, true);
	const payload = JSON.parse(readFileSync(outputPath, "utf-8"));
	assert.equal(payload.schemaVersion, "cautilus.quality_runtime_signal.v1");
	assert.equal(payload.status, "passed");
	assert.equal(payload.phaseCount, 1);
	assert.deepEqual(payload.phases[0].command, [
		"npm",
		"run",
		"--silent",
		"lint:a",
	]);
});

test("runPhases writes a failed quality runtime signal when a phase fails", () => {
	const root = mkdtempSync(join(tmpdir(), "cautilus-quality-runtime-fail-"));
	const outputPath = join(root, "runtime", "verify.json");
	const out = makeSink();
	const err = makeSink();
	const { spawn } = makeSpawn([{ status: 0 }, { status: 7 }]);
	const phases = [
		{ id: "lint:a", label: "lint · a" },
		{ id: "lint:b", label: "lint · b" },
	];
	const result = runPhases(phases, {
		spawn,
		stdout: out.sink,
		stderr: err.sink,
		runtimeSignalPath: outputPath,
	});
	assert.equal(result.ok, false);
	const payload = JSON.parse(readFileSync(outputPath, "utf-8"));
	assert.equal(payload.schemaVersion, "cautilus.quality_runtime_signal.v1");
	assert.equal(payload.status, "failed");
	assert.equal(payload.exitCode, 7);
	assert.equal(payload.failedPhase, "lint:b");
	assert.equal(payload.phaseCount, 2);
	assert.deepEqual(
		payload.phases.map((phase) => [phase.id, phase.status, phase.exitCode]),
		[
			["lint:a", "passed", 0],
			["lint:b", "failed", 7],
		],
	);
});

test("runPhases short-circuits on first non-zero exit and names the phase", () => {
	const out = makeSink();
	const err = makeSink();
	const { spawn, calls } = makeSpawn([{ status: 0 }, { status: 7 }]);
	const phases = [
		{ id: "a", label: "phase · a" },
		{ id: "b", label: "phase · b" },
		{ id: "c", label: "phase · c" },
	];
	const result = runPhases(phases, {
		spawn,
		stdout: out.sink,
		stderr: err.sink,
	});
	assert.equal(result.ok, false);
	assert.equal(result.status, 7);
	assert.equal(result.failedPhase, "b");
	assert.equal(calls.length, 2);
	const outText = out.text();
	assert.match(outText, /▶ phase · a/);
	assert.match(outText, /▶ phase · b/);
	assert.doesNotMatch(outText, /▶ phase · c/);
	assert.match(err.text(), /✖ phase · b failed \(exit 7\)/);
	assert.doesNotMatch(outText, /verify · all phases passed/);
});

test("runPhases reports spawn error with phase label", () => {
	const out = makeSink();
	const err = makeSink();
	const { spawn } = makeSpawn([{ error: new Error("ENOENT npm") }]);
	const result = runPhases([{ id: "x", label: "phase · x" }], {
		spawn,
		stdout: out.sink,
		stderr: err.sink,
	});
	assert.equal(result.ok, false);
	assert.equal(result.status, 1);
	assert.equal(result.failedPhase, "x");
	assert.match(err.text(), /✖ phase · x failed to start: ENOENT npm/);
});

test("runPhases writes a failed quality runtime signal when spawn fails", () => {
	const root = mkdtempSync(join(tmpdir(), "cautilus-quality-runtime-spawn-"));
	const outputPath = join(root, "runtime", "verify.json");
	const out = makeSink();
	const err = makeSink();
	const { spawn } = makeSpawn([{ error: new Error("ENOENT npm") }]);
	const result = runPhases([{ id: "x", label: "phase · x" }], {
		spawn,
		stdout: out.sink,
		stderr: err.sink,
		runtimeSignalPath: outputPath,
	});
	assert.equal(result.ok, false);
	const payload = JSON.parse(readFileSync(outputPath, "utf-8"));
	assert.equal(payload.status, "failed");
	assert.equal(payload.failedPhase, "x");
	assert.equal(payload.phases[0].status, "failed_to_start");
	assert.equal(payload.phases[0].error, "ENOENT npm");
});

test("runPhases forwards verbose to resolveScript", () => {
	const out = makeSink();
	const err = makeSink();
	const { spawn, calls } = makeSpawn([]);
	const phases = [
		{ id: "base", verboseId: "base:spec", label: "phase · base" },
	];
	runPhases(phases, {
		verbose: true,
		spawn,
		stdout: out.sink,
		stderr: err.sink,
	});
	assert.equal(calls[0].script, "base:spec");
});

test("runtimeSignalPayload summarizes failed phases", () => {
	const payload = runtimeSignalPayload(
		{
			ok: false,
			status: 7,
			failedPhase: "lint:a",
			phaseResults: [
				{
					id: "lint:a",
					label: "lint · a",
					script: "lint:a",
					status: "failed",
					exitCode: 7,
					durationMs: 12,
				},
			],
		},
		100,
	);
	assert.equal(payload.status, "failed");
	assert.equal(payload.exitCode, 7);
	assert.equal(payload.totalDurationMs, 12);
	assert.equal(payload.failedPhase, "lint:a");
});
