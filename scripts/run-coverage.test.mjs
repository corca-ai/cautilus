import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import test from "node:test";
import { fileURLToPath } from "node:url";

import { runCoverage } from "./run-coverage.mjs";

const SCRIPT_PATH = fileURLToPath(new URL("./run-coverage.mjs", import.meta.url));

test("runCoverage starts isolated Go and Node coverage before aggregating", async () => {
	const started = [];
	let aggregateCalls = 0;
	await runCoverage({
		runScript: async (name) => {
			started.push(name);
		},
		aggregate: async () => {
			aggregateCalls += 1;
			assert.deepEqual(started, ["test:go:coverage", "test:node:coverage"]);
		},
	});
	assert.equal(aggregateCalls, 1);
});

test("runCoverage waits for both commands and skips aggregation when either fails", async () => {
	const started = [];
	let aggregateCalls = 0;
	let finishGo;
	const goFinished = new Promise((resolve) => {
		finishGo = resolve;
	});
	let rejectionObserved = false;
	const run = runCoverage({
			runScript: async (name) => {
				started.push(name);
				if (name === "test:go:coverage") {
					await goFinished;
					return;
				}
				if (name === "test:node:coverage") {
					throw new Error("node coverage failed");
				}
			},
			aggregate: async () => {
				aggregateCalls += 1;
			},
		});
	const observed = run.catch((error) => {
		rejectionObserved = true;
		return error;
	});
	await new Promise((resolve) => setImmediate(resolve));
	assert.deepEqual(started, ["test:go:coverage", "test:node:coverage"]);
	assert.equal(rejectionObserved, false);
	assert.equal(aggregateCalls, 0);
	finishGo();
	const error = await observed;
	assert.match(error.message, /test:node:coverage: node coverage failed/);
	assert.equal(rejectionObserved, true);
	assert.equal(aggregateCalls, 0);
});

test("runCoverage can select the detailed Node coverage reporter without changing Go isolation", async () => {
	const started = [];
	await runCoverage({
		nodeScript: "test:node:coverage:spec",
		runScript: async (name) => {
			started.push(name);
		},
		aggregate: async () => {},
	});
	assert.deepEqual(started, ["test:go:coverage", "test:node:coverage:spec"]);
});

test("runCoverage rejects non-coverage npm scripts before starting child commands", () => {
	const result = spawnSync(process.execPath, [SCRIPT_PATH, "--node-script", "test"], {
		encoding: "utf-8",
	});
	assert.notEqual(result.status, 0);
	assert.equal(result.stdout, "");
	assert.equal(
		result.stderr,
		"--node-script must be test:node:coverage or test:node:coverage:spec\n",
	);
});
