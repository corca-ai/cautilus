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
	withRuntimeSignalSamples,
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

function nodeTestGlobs(script) {
	const nodeTestStart = script.indexOf("node --test ");
	assert.notEqual(nodeTestStart, -1, `script does not run node --test: ${script}`);
	const nodeTestCommand = script.slice(nodeTestStart).split(" && ")[0];
	return nodeTestCommand.split(/\s+/).filter((token) => token.endsWith(".test.mjs"));
}

test("PHASES covers every npm run verify sub-phase", () => {
	const ids = PHASES.map((p) => p.id);
	assert.deepEqual(ids, [
		"lint:eslint",
		"audit:surface:check",
		"lint:specs",
		"specdown:ledger:check",
		"specdown:project:check",
		"specdown:claim-state:check",
		"lint:scenario-normalizers",
		"lint:contracts",
		"claims:audit-evidence",
		"claims:evidence-state:check",
		"claims:source-freshness:check",
		"release:claim-freshness",
		"claims:status-report:check",
		"lint:links",
		"lint:skill-disclosure",
		"lint:go",
		"vet:go",
		"security:govulncheck",
		"security:secrets",
		"test:go:race",
		"test:coverage",
		"coverage:floor:check",
	]);
});

test("coverage node runners keep the same test glob as test:node", () => {
	const { scripts } = JSON.parse(readFileSync("package.json", "utf-8"));
	const expectedGlobs = nodeTestGlobs(scripts["test:node"]);

	assert.deepEqual(nodeTestGlobs(scripts["test:node:coverage"]), expectedGlobs);
	assert.deepEqual(nodeTestGlobs(scripts["test:node:coverage:spec"]), expectedGlobs);
});

test("parseArgs defaults to non-verbose", () => {
	assert.deepEqual(parseArgs([]), {
		verbose: false,
		help: false,
		runtimeSignalPath: null,
		runtimeProfile: null,
	});
});

test("parseArgs recognizes --verbose", () => {
	assert.deepEqual(parseArgs(["--verbose"]), {
		verbose: true,
		help: false,
		runtimeSignalPath: null,
		runtimeProfile: null,
	});
});

test("parseArgs recognizes --help", () => {
	assert.deepEqual(parseArgs(["--help"]), {
		verbose: false,
		help: true,
		runtimeSignalPath: null,
		runtimeProfile: null,
	});
});

test("parseArgs recognizes runtime signal output", () => {
	assert.deepEqual(parseArgs(["--runtime-signal", "out/runtime.json"]), {
		verbose: false,
		help: false,
		runtimeSignalPath: "out/runtime.json",
		runtimeProfile: null,
	});
});

test("parseArgs recognizes runtime profile", () => {
	assert.deepEqual(parseArgs(["--runtime-profile", "local-verify"]), {
		verbose: false,
		help: false,
		runtimeSignalPath: null,
		runtimeProfile: "local-verify",
	});
});

test("parseArgs rejects missing runtime signal path", () => {
	assert.throws(
		() => parseArgs(["--runtime-signal"]),
		/--runtime-signal requires a path/,
	);
});

test("parseArgs rejects missing runtime profile id", () => {
	assert.throws(
		() => parseArgs(["--runtime-profile"]),
		/--runtime-profile requires a profile id/,
	);
});

test("parseArgs rejects unknown flags", () => {
	assert.throws(() => parseArgs(["--nope"]), /unknown argument/);
});

test("resolveScript swaps to verbose id when requested", () => {
	const coverage = PHASES.find((p) => p.id === "test:coverage");
	assert.equal(resolveScript(coverage, { verbose: false }), "test:coverage");
	assert.equal(resolveScript(coverage, { verbose: true }), "test:coverage:spec");
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
		runtimeProfile: "local-verify",
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
	assert.ok(payload.profiles["local-verify"]);
	assert.equal(
		payload.profiles["local-verify"].commands["lint · a"].latest.elapsed_ms,
		payload.phases[0].durationMs,
	);
});

test("withRuntimeSignalSamples keeps a bounded recent window per phase label", () => {
	const existingSignals = {
		profiles: {
			"local-test": {
				commands: {
					"lint · a": {
						latest: { timestamp: "2026-07-08T00:00:00.000Z", elapsed_ms: 10 },
						recent_elapsed_ms: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
						median_recent_elapsed_ms: 6,
						max_recent_elapsed_ms: 10,
						samples: 10,
					},
				},
			},
		},
	};
	const payload = {
		...runtimeSignalPayload(
			{
				ok: true,
				status: 0,
				totalElapsedMs: 11,
				phaseResults: [
					{
						id: "lint:a",
						label: "lint · a",
						durationMs: 11,
						status: "passed",
						exitCode: 0,
					},
				],
			},
			0,
		),
		generatedAt: "2026-07-08T01:00:00.000Z",
	};

	const merged = withRuntimeSignalSamples(payload, {
		existingSignals,
		runtimeProfile: "local-test",
	});
	const command = merged.profiles["local-test"].commands["lint · a"];
	assert.deepEqual(command.recent_elapsed_ms, [2, 3, 4, 5, 6, 7, 8, 9, 10, 11]);
	assert.equal(command.samples, 11);
	assert.equal(command.latest.elapsed_ms, 11);
	assert.equal(command.latest.timestamp, "2026-07-08T01:00:00.000Z");
	assert.equal(command.median_recent_elapsed_ms, 7);
	assert.equal(command.max_recent_elapsed_ms, 11);
});

test("withRuntimeSignalSamples preserves unobserved phase samples on partial runs", () => {
	const existingSignals = {
		profiles: {
			"local-test": {
				commands: {
					"lint · a": {
						latest: { timestamp: "2026-07-08T00:00:00.000Z", elapsed_ms: 10 },
						recent_elapsed_ms: [10],
						median_recent_elapsed_ms: 10,
						max_recent_elapsed_ms: 10,
						samples: 1,
					},
					"lint · b": {
						latest: { timestamp: "2026-07-08T00:00:00.000Z", elapsed_ms: 20 },
						recent_elapsed_ms: [20],
						median_recent_elapsed_ms: 20,
						max_recent_elapsed_ms: 20,
						samples: 1,
					},
				},
			},
		},
	};
	const payload = {
		...runtimeSignalPayload(
			{
				ok: false,
				status: 7,
				failedPhase: "lint:a",
				phaseResults: [
					{
						id: "lint:a",
						label: "lint · a",
						durationMs: 11,
						status: "failed",
						exitCode: 7,
					},
				],
			},
			0,
		),
		generatedAt: "2026-07-08T02:00:00.000Z",
	};

	const merged = withRuntimeSignalSamples(payload, {
		existingSignals,
		runtimeProfile: "LOCAL TEST",
	});
	assert.equal(merged.runtimeProfile, "local-test");
	assert.equal(merged.profiles["local-test"].commands["lint · a"].latest.elapsed_ms, 11);
	assert.deepEqual(
		merged.profiles["local-test"].commands["lint · b"],
		existingSignals.profiles["local-test"].commands["lint · b"],
	);
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
