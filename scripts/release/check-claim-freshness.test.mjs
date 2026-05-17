import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import { checkClaimFreshness, repairCommands } from "./check-claim-freshness.mjs";

const SCRIPT = join(process.cwd(), "scripts", "release", "check-claim-freshness.mjs");

test("repairCommands points release operators at saved packet refresh and projections", () => {
	assert.deepEqual(repairCommands({ claims: ".cautilus/claims/evidenced-typed-runners.json" }), [
		"npm run claims:refresh:all",
	]);
});

function withPackage(script, fn) {
	const root = mkdtempSync(join(tmpdir(), "cautilus-claim-freshness-"));
	try {
		writeFileSync(
			join(root, "package.json"),
			`${JSON.stringify({
				type: "module",
				scripts: {
					"claims:evidence-state:check": script,
				},
			})}\n`,
			"utf-8",
		);
		fn(root);
	} finally {
		rmSync(root, { recursive: true, force: true });
	}
}

test("checkClaimFreshness returns release metadata when generated claim state is fresh", () => {
	withPackage("node -e \"process.exit(0)\"", (root) => {
		assert.deepEqual(checkClaimFreshness({ repoRoot: root, claims: ".cautilus/claims/custom.json" }), {
			status: "fresh",
			repoRoot: root,
			claims: ".cautilus/claims/custom.json",
			reachablePacketGitCommit: null,
		});
	});
});

test("checkClaimFreshness rejects claim packets based on local-only commits", () => {
	withPackage("node -e \"process.exit(0)\"", (root) => {
		writeFileSync(join(root, "status-summary.json"), JSON.stringify({
			gitState: {
				packetGitCommit: "31d4879c7ccb43b1442415f67806f277ca3652d9",
			},
		}));
		assert.throws(
			() => checkClaimFreshness({
				repoRoot: root,
				claims: ".cautilus/claims/custom.json",
				status: "status-summary.json",
				gitRunner: () => ({ status: 1, stdout: "", stderr: "not an ancestor" }),
			}),
			(error) => {
				assert.match(error.message, /claim packet commit 31d4879c7ccb43b1442415f67806f277ca3652d9 is not reachable from HEAD/);
				assert.match(error.message, /Regenerate claim state from a commit reachable in the release HEAD history/);
				return true;
			},
		);
	});
});

test("checkClaimFreshness reports reachable packet commit metadata", () => {
	withPackage("node -e \"process.exit(0)\"", (root) => {
		writeFileSync(join(root, "status-summary.json"), JSON.stringify({
			gitState: {
				packetGitCommit: "419715712066c7a575cd44ba9bfaa961bed4da66",
			},
		}));
		assert.deepEqual(checkClaimFreshness({
			repoRoot: root,
			claims: ".cautilus/claims/custom.json",
			status: "status-summary.json",
			gitRunner: () => ({ status: 0, stdout: "", stderr: "" }),
		}), {
			status: "fresh",
			repoRoot: root,
			claims: ".cautilus/claims/custom.json",
			reachablePacketGitCommit: "419715712066c7a575cd44ba9bfaa961bed4da66",
		});
	});
});

test("checkClaimFreshness reports the exact repair sequence when generated claim state is stale", () => {
	withPackage("node -e \"console.error('claim projection drift'); process.exit(1)\"", (root) => {
		assert.throws(
			() => checkClaimFreshness({ repoRoot: root, claims: ".cautilus/claims/custom.json" }),
			(error) => {
				assert.match(error.message, /Release claim freshness preflight failed/);
				assert.match(error.message, /claim projection drift/);
				assert.match(error.message, /npm run claims:refresh:all/);
				return true;
			},
		);
	});
});

test("check-claim-freshness CLI prints fresh release metadata", () => {
	withPackage("node -e \"process.exit(0)\"", (root) => {
		const result = spawnSync(
			"node",
			[SCRIPT, "--repo-root", root, "--claims", ".cautilus/claims/custom.json"],
			{ encoding: "utf-8" },
		);
		assert.equal(result.status, 0, result.stderr);
		assert.deepEqual(JSON.parse(result.stdout), {
			status: "fresh",
			repoRoot: root,
			claims: ".cautilus/claims/custom.json",
			reachablePacketGitCommit: null,
		});
	});
});

test("check-claim-freshness CLI reports argument errors", () => {
	const result = spawnSync("node", [SCRIPT, "--unexpected"], { encoding: "utf-8" });
	assert.equal(result.status, 1);
	assert.match(result.stderr, /Unknown argument: --unexpected/);
});

test("check-claim-freshness CLI renders usage", () => {
	const result = spawnSync("node", [SCRIPT, "--help"], { encoding: "utf-8" });
	assert.equal(result.status, 0);
	assert.match(result.stdout, /Usage:/);
	assert.match(result.stdout, /--repo-root <dir>/);
	assert.match(result.stdout, /--status <status-summary\.json>/);
});
