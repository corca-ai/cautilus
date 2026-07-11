import assert from "node:assert/strict";
import test from "node:test";

import { runCoverage } from "./run-coverage.mjs";

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
