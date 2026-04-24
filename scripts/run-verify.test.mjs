import { test } from "node:test";
import assert from "node:assert/strict";

import {
	PHASES,
	parseArgs,
	resolveScript,
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
		"lint:specs",
		"lint:archetypes",
		"lint:contracts",
		"lint:links",
		"lint:skill-disclosure",
		"lint:go",
		"vet:go",
		"security:govulncheck",
		"security:secrets",
		"test:go:race",
		"test:node",
	]);
});

test("parseArgs defaults to non-verbose", () => {
	assert.deepEqual(parseArgs([]), { verbose: false, help: false });
});

test("parseArgs recognizes --verbose", () => {
	assert.deepEqual(parseArgs(["--verbose"]), { verbose: true, help: false });
});

test("parseArgs recognizes --help", () => {
	assert.deepEqual(parseArgs(["--help"]), { verbose: false, help: true });
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
