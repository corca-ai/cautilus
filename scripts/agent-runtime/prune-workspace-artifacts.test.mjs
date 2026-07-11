import assert from "node:assert/strict";
import { existsSync, mkdirSync, mkdtempSync, rmSync, utimesSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { spawnSync } from "node:child_process";
import test from "node:test";

const SCRIPT_PATH = join(process.cwd(), "scripts", "agent-runtime", "prune-workspace-artifacts.mjs");

function makeRunDir(root, name, markerName, ageDays) {
	const path = join(root, name);
	mkdirSync(path, { recursive: true });
	if (markerName === "baseline") {
		mkdirSync(join(path, "baseline"), { recursive: true });
		mkdirSync(join(path, "candidate"), { recursive: true });
	} else {
		writeFileSync(join(path, markerName), "{}\n", "utf-8");
	}
	const timestamp = new Date(Date.now() - ageDays * 24 * 60 * 60 * 1000);
	utimesSync(path, timestamp, timestamp);
	return path;
}

test("prune-workspace-artifacts keeps the newest recognized run directories and skips unknown ones", () => {
	const root = mkdtempSync(join(tmpdir(), "cautilus-prune-artifacts-"));
	try {
		const artifactRoot = join(root, "artifacts");
		mkdirSync(artifactRoot, { recursive: true });
		const oldRun = makeRunDir(artifactRoot, "run-old", "report.json", 10);
		const midRun = makeRunDir(artifactRoot, "run-mid", "summary.json", 5);
		const newRun = makeRunDir(artifactRoot, "run-new", "baseline", 1);
		mkdirSync(join(artifactRoot, "notes"), { recursive: true });

		const result = spawnSync(
			"node",
			[SCRIPT_PATH, "--root", artifactRoot, "--keep-last", "2"],
			{ encoding: "utf-8" },
		);
		assert.equal(result.status, 0, result.stderr);
		const payload = JSON.parse(result.stdout);
		assert.equal(payload.pruned.length, 1);
		assert.equal(payload.pruned[0].path, oldRun);
		assert.equal(payload.kept.length, 2);
		assert.equal(payload.skipped.length, 1);
		assert.equal(existsSync(oldRun), false);
		assert.equal(existsSync(midRun), true);
		assert.equal(existsSync(newRun), true);
	} finally {
		rmSync(root, { recursive: true, force: true });
	}
});

test("prune-workspace-artifacts supports age-based dry runs without deleting artifacts", () => {
	const root = mkdtempSync(join(tmpdir(), "cautilus-prune-artifacts-dry-"));
	try {
		const artifactRoot = join(root, "artifacts");
		mkdirSync(artifactRoot, { recursive: true });
		const oldRun = makeRunDir(artifactRoot, "run-old", "report.json", 12);
		const newRun = makeRunDir(artifactRoot, "run-new", "report.json", 1);

		const result = spawnSync(
			"node",
			[SCRIPT_PATH, "--root", artifactRoot, "--max-age-days", "7", "--dry-run"],
			{ encoding: "utf-8" },
		);
		assert.equal(result.status, 0, result.stderr);
		const payload = JSON.parse(result.stdout);
		assert.equal(payload.dryRun, true);
		assert.equal(payload.pruned.length, 1);
		assert.equal(payload.pruned[0].path, oldRun);
		assert.equal(existsSync(oldRun), true);
		assert.equal(existsSync(newRun), true);
	} finally {
		rmSync(root, { recursive: true, force: true });
	}
});

test("prune-workspace-artifacts rejects invalid required values before deletion", async (t) => {
	const cases = [
		{ option: "--root", value: "--dry-run", diagnostic: "Missing value for --root" },
		{ option: "--root", value: " \t\n", diagnostic: "Missing value for --root" },
		{ option: "--keep-last", value: "--dry-run", diagnostic: "Missing value for --keep-last" },
		{ option: "--max-age-days", value: "--dry-run", diagnostic: "Missing value for --max-age-days" },
		{ option: "--keep-last", value: "-1", diagnostic: "--keep-last must be a non-negative integer" },
		{ option: "--max-age-days", value: "-1", diagnostic: "--max-age-days must be a non-negative number" },
	];
	for (const testCase of cases) {
		await t.test(`${testCase.option} rejects ${JSON.stringify(testCase.value)}`, () => {
			const sandboxCwd = mkdtempSync(join(tmpdir(), "cautilus-prune-invalid-"));
			try {
				const artifactRoot = testCase.option === "--root"
					? join(sandboxCwd, testCase.value)
					: join(sandboxCwd, "artifacts");
				const sentinel = makeRunDir(artifactRoot, "run-sentinel", "run.json", 1);
				const args = [
					SCRIPT_PATH,
					"--root",
					artifactRoot,
					"--keep-last",
					"0",
					"--max-age-days",
					"0",
				];
				const optionIndex = args.indexOf(testCase.option);
				args.splice(optionIndex + 1, 1, testCase.value);
				const result = spawnSync("node", args, {
					cwd: sandboxCwd,
					encoding: "utf-8",
				});
				assert.notEqual(result.status, 0);
				assert.match(result.stderr, new RegExp(testCase.diagnostic));
				assert.equal(existsSync(sentinel), true);
			} finally {
				rmSync(sandboxCwd, { recursive: true, force: true });
			}
		});
	}
});
