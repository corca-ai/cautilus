import assert from "node:assert/strict";
import test from "node:test";

import { main, parseArgs, prepareRelease } from "./prepare-release.mjs";

test("parseArgs accepts a release version and repo root", () => {
	const options = parseArgs(["0.15.4", "--repo-root", "/tmp/cautilus"]);
	assert.equal(options.version, "0.15.4");
	assert.equal(options.repoRoot, "/tmp/cautilus");

	const reordered = parseArgs(["--repo-root", "/tmp/cautilus", "v0.15.4"]);
	assert.equal(reordered.version, "0.15.4");
	assert.equal(reordered.repoRoot, "/tmp/cautilus");
});

test("parseArgs rejects missing or extra version arguments", () => {
	assert.throws(() => parseArgs([]), /target version/);
	assert.throws(() => parseArgs(["0.15.4", "0.15.5"]), /Unknown argument/);
	assert.throws(() => parseArgs(["not-a-version"]), /Expected a semver-like version/);
	assert.throws(() => parseArgs(["0.15.4", "--repo-root"]), /--repo-root requires a value/);
});

test("prepareRelease forwards the target version to the bump helper before freshness", () => {
	const calls = [];
	const result = prepareRelease({
		repoRoot: "/repo",
		version: "0.15.4",
		run(command, args, options) {
			calls.push({ command, args, cwd: options.cwd });
			return { status: 0 };
		},
	});
	assert.deepEqual(calls, [
		{ command: "npm", args: ["run", "skills:sync-packaged"], cwd: "/repo" },
		{ command: "node", args: ["scripts/release/bump-version.mjs", "0.15.4"], cwd: "/repo" },
		{ command: "npm", args: ["run", "release:claim-freshness"], cwd: "/repo" },
	]);
	assert.equal(result.version, "0.15.4");
});

test("prepareRelease stops when a release helper fails", () => {
	const calls = [];
	assert.throws(
		() => prepareRelease({
			repoRoot: "/repo",
			version: "0.15.4",
			run(command, args) {
				calls.push({ command, args });
				return { status: calls.length === 2 ? 1 : 0 };
			},
		}),
		/node scripts\/release\/bump-version\.mjs 0\.15\.4 failed with exit 1/,
	);
	assert.deepEqual(calls, [
		{ command: "npm", args: ["run", "skills:sync-packaged"] },
		{ command: "node", args: ["scripts/release/bump-version.mjs", "0.15.4"] },
	]);
});

test("main returns success with injected release command runner", () => {
	const calls = [];
	const status = main(["0.15.4", "--repo-root", "/repo"], {
		run(command, args) {
			calls.push({ command, args });
			return { status: 0 };
		},
	});
	assert.equal(status, 0);
	assert.equal(calls.length, 3);
});

test("main reports release preparation errors", () => {
	let message = "";
	let exitCode = null;
	const status = main(["0.15.4"], {
		run() {
			return { status: 1 };
		},
		stderr: { write(value) { message += value; } },
		exit(value) { exitCode = value; },
	});
	assert.equal(status, 1);
	assert.equal(exitCode, 1);
	assert.match(message, /npm run skills:sync-packaged failed/);
});
