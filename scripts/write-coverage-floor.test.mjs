import assert from "node:assert/strict";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";

import { computeFloors, main, parseArgs } from "./write-coverage-floor.mjs";

function entry(percent, statements = 100) {
	return {
		language: "node",
		summary: {
			num_statements: statements,
			covered_statements: Math.round((statements * percent) / 100),
			percent_covered: percent,
		},
	};
}

const sink = () => {
	let text = "";
	return { write: (chunk) => { text += chunk; }, get text() { return text; } };
};

test("parseArgs defaults and flag parsing", () => {
	assert.deepEqual(parseArgs([]), { onlyStale: false, bufferPp: 1.0, staleThresholdPp: 10.0 });
	assert.deepEqual(parseArgs(["--only-stale", "--buffer", "10", "--stale-threshold", "5"]), {
		onlyStale: true,
		bufferPp: 10,
		staleThresholdPp: 5,
	});
});

test("parseArgs rejects unknown and invalid arguments", () => {
	assert.throws(() => parseArgs(["--nope"]), /unknown argument/);
	assert.throws(() => parseArgs(["--buffer", "-1"]), /--buffer must be a non-negative number/);
	assert.throws(() => parseArgs(["--buffer", "x"]), /--buffer must be a non-negative number/);
	assert.throws(() => parseArgs(["--stale-threshold", "x"]), /--stale-threshold must be a non-negative number/);
});

test("full mode floors eligible files at pct-buffer, skips tiny and exempt files", () => {
	const floor = computeFloors({
		coverageFiles: {
			"a.mjs": entry(90),
			"tiny.mjs": entry(90, 10), // below MIN_STATEMENTS
			"exempt.mjs": entry(90),
		},
		exemptions: new Set(["exempt.mjs"]),
		bufferPp: 1.0,
	});
	assert.deepEqual(floor, { "a.mjs": 89 });
});

test("full mode is monotonic: never lowers an existing floor", () => {
	const floor = computeFloors({
		coverageFiles: { "a.mjs": entry(90) },
		existingFloor: { "a.mjs": 89.9 }, // pct-buffer (89) would lower it
		bufferPp: 1.0,
	});
	assert.equal(floor["a.mjs"], 89.9);
});

test("only-stale mode raises only stale floored files and leaves others verbatim", () => {
	const floor = computeFloors({
		coverageFiles: {
			"stale.go": entry(80), // floored at 5 -> gap 75 >= threshold
			"near.go": entry(80), // floored at 79 -> gap 1 < threshold
			"unfloored.go": entry(80), // not in existing floor
		},
		existingFloor: { "stale.go": 5, "near.go": 79 },
		onlyStale: true,
		bufferPp: 10,
		staleThresholdPp: 10,
	});
	assert.deepEqual(floor, { "stale.go": 70, "near.go": 79 }); // raised, held, unfloored ignored
});

test("only-stale mode drops a floored-and-exempted entry (avoids gate contradiction)", () => {
	const floor = computeFloors({
		coverageFiles: { "keep.go": entry(80) },
		existingFloor: { "keep.go": 5, "exempt.go": 40 },
		exemptions: new Set(["exempt.go"]),
		onlyStale: true,
		bufferPp: 10,
		staleThresholdPp: 10,
	});
	assert.deepEqual(floor, { "keep.go": 70 }); // exempt.go must not survive into the floor
});

test("full mode raises an existing floor toward pct-buffer", () => {
	const floor = computeFloors({
		coverageFiles: { "raise.mjs": entry(90) },
		existingFloor: { "raise.mjs": 50 }, // pct-buffer=89 > 50 -> raised
		bufferPp: 1.0,
	});
	assert.equal(floor["raise.mjs"], 89);
});

test("full mode clamps the floor at zero when the buffer exceeds coverage", () => {
	const floor = computeFloors({
		coverageFiles: { "low.mjs": entry(2) },
		bufferPp: 10,
	});
	assert.equal(floor["low.mjs"], 0);
});

test("only-stale mode holds when the gap is exactly the threshold", () => {
	const floor = computeFloors({
		coverageFiles: { "edge.go": entry(80) },
		existingFloor: { "edge.go": 70 }, // gap 10 == threshold; candidate 70 == existing -> held
		onlyStale: true,
		bufferPp: 10,
		staleThresholdPp: 10,
	});
	assert.equal(floor["edge.go"], 70);
});

test("only-stale mode stays monotonic when the buffer would lower a stale floor", () => {
	const floor = computeFloors({
		coverageFiles: { "s.go": entry(80) },
		existingFloor: { "s.go": 68 }, // gap 12 >= threshold 10, but pct-buffer=65 < 68
		onlyStale: true,
		bufferPp: 15,
		staleThresholdPp: 10,
	});
	assert.equal(floor["s.go"], 68); // held, not lowered to 65
});

test("main writes a sorted floor file and honors env overrides", () => {
	const dir = mkdtempSync(join(tmpdir(), "cautilus-write-floor-"));
	try {
		const floorPath = join(dir, "floor.json");
		writeFileSync(
			join(dir, "coverage.json"),
			JSON.stringify({ languages: ["go"], files: { "z.go": entry(80), "a.go": entry(80) } }),
		);
		writeFileSync(floorPath, JSON.stringify({ "z.go": 5, "a.go": 79 }));
		writeFileSync(join(dir, "exempt.txt"), "# none\n");

		const out = sink();
		const status = main(["--only-stale", "--buffer", "10", "--stale-threshold", "10"], {
			env: {
				COVERAGE_DIR: dir,
				COVERAGE_FLOOR_PATH: floorPath,
				COVERAGE_FLOOR_EXEMPTIONS_PATH: join(dir, "exempt.txt"),
			},
			stdout: out,
			stderr: sink(),
		});

		assert.equal(status, 0);
		const written = readFileSync(floorPath, "utf-8");
		assert.deepEqual(JSON.parse(written), { "a.go": 79, "z.go": 70 });
		assert.equal(Object.keys(JSON.parse(written))[0], "a.go"); // sorted
		assert.match(out.text, /only-stale, buffer 10pp/);
	} finally {
		rmSync(dir, { recursive: true, force: true });
	}
});

test("main fails when coverage.json is missing", () => {
	const dir = mkdtempSync(join(tmpdir(), "cautilus-write-floor-"));
	try {
		const err = sink();
		const status = main([], { env: { COVERAGE_DIR: dir }, stdout: sink(), stderr: err });
		assert.equal(status, 1);
		assert.match(err.text, /missing .*coverage\.json/);
	} finally {
		rmSync(dir, { recursive: true, force: true });
	}
});
