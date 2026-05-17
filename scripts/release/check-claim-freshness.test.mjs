import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { chmodSync, mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import process from "node:process";
import test from "node:test";
import { checkClaimFreshness, repairCommands } from "./check-claim-freshness.mjs";

const SCRIPT = join(process.cwd(), "scripts", "release", "check-claim-freshness.mjs");

test("repairCommands points release operators at saved packet refresh and projections", () => {
	assert.deepEqual(repairCommands({ claims: ".cautilus/claims/evidenced-typed-runners.json" }), [
		`cd '${process.cwd()}' && npm run claims:refresh:all`,
	]);
	assert.deepEqual(repairCommands({
		repoRoot: "/tmp/cautilus repo",
		claims: "custom claims;danger.json",
		status: "custom status's.json",
	}), [
		"cd '/tmp/cautilus repo' && ./bin/cautilus discover claims status --input 'custom claims;danger.json' --sample-claims 1 > 'custom status'\\''s.json'",
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

function writeJson(path, value) {
	writeFileSync(path, `${JSON.stringify(value, null, 2)}\n`, "utf-8");
}

function writeSelectedClaimState(root, { claims = "claims.json", status = "status-summary.json", statusPacket } = {}) {
	writeJson(join(root, claims), {
		schemaVersion: "cautilus.claims.v1",
		claimCandidates: [],
		claimSummary: {},
	});
	writeJson(join(root, status), statusPacket);
	return { claims, status };
}

function statusRunnerReturning(packet) {
	return () => ({ status: 0, stdout: JSON.stringify(packet), stderr: "" });
}

const REACHABLE_COMMIT = "419715712066c7a575cd44ba9bfaa961bed4da66";

function statusPacket(overrides = {}) {
	const { gitState: gitStateOverrides = {}, ...packetOverrides } = overrides;
	return {
		schemaVersion: "cautilus.claim_status.v1",
		claimSummary: {},
		gitState: {
			isStale: false,
			packetGitCommit: REACHABLE_COMMIT,
			currentGitCommit: "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
			headDrift: false,
			changedFileCount: 0,
			changedFiles: [],
			changedSources: [],
			comparisonStatus: "fresh",
			recommendedAction: "The claim packet commit matches the inspected checkout.",
			...gitStateOverrides,
		},
		...packetOverrides,
	};
}

test("checkClaimFreshness returns release metadata when generated claim state is fresh", () => {
	withPackage("node -e \"process.exit(0)\"", (root) => {
		const savedStatus = statusPacket();
		const { claims, status } = writeSelectedClaimState(root, {
			claims: ".cautilus-claims-custom.json",
			status: ".cautilus-status-custom.json",
			statusPacket: savedStatus,
		});
		const statusRunnerCalls = [];
		assert.deepEqual(checkClaimFreshness({
			repoRoot: root,
			claims,
			status,
			statusRunner: (repoRoot, claimsPath) => {
				statusRunnerCalls.push({ repoRoot, claimsPath });
				return { status: 0, stdout: JSON.stringify(statusPacket({
				gitState: {
					currentGitCommit: "bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb",
					headDrift: true,
					changedFileCount: 1,
					changedFiles: ["generated.json"],
					comparisonStatus: "fresh-with-head-drift",
					recommendedAction: "HEAD drift does not affect claim sources.",
				},
				})), stderr: "" };
			},
			gitRunner: () => ({ status: 0, stdout: "", stderr: "" }),
		}), {
			status: "fresh",
			repoRoot: root,
			claims,
			reachablePacketGitCommit: REACHABLE_COMMIT,
		});
		assert.deepEqual(statusRunnerCalls, [{ repoRoot: root, claimsPath: claims }]);
	});
});

test("checkClaimFreshness rejects claim packets based on local-only commits", () => {
	withPackage("node -e \"process.exit(0)\"", (root) => {
		const localOnlyStatus = statusPacket({
			gitState: {
				packetGitCommit: "31d4879c7ccb43b1442415f67806f277ca3652d9",
			},
		});
		const { claims, status } = writeSelectedClaimState(root, { statusPacket: localOnlyStatus });
		assert.throws(
			() => checkClaimFreshness({
				repoRoot: root,
				claims,
				status,
				statusRunner: statusRunnerReturning(localOnlyStatus),
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
		const savedStatus = statusPacket();
		const { claims, status } = writeSelectedClaimState(root, { statusPacket: savedStatus });
		assert.deepEqual(checkClaimFreshness({
			repoRoot: root,
			claims,
			status,
			statusRunner: statusRunnerReturning(savedStatus),
			gitRunner: () => ({ status: 0, stdout: "", stderr: "" }),
		}), {
			status: "fresh",
			repoRoot: root,
			claims,
			reachablePacketGitCommit: "419715712066c7a575cd44ba9bfaa961bed4da66",
		});
	});
});

test("checkClaimFreshness reports the exact repair sequence when generated claim state is stale", () => {
	withPackage("node -e \"console.error('claim projection drift'); process.exit(1)\"", (root) => {
		mkdirSync(join(root, ".cautilus", "claims"), { recursive: true });
		const savedStatus = statusPacket();
		writeJson(join(root, ".cautilus", "claims", "evidenced-typed-runners.json"), {
			schemaVersion: "cautilus.claims.v1",
			claimCandidates: [],
			claimSummary: {},
		});
		writeJson(join(root, ".cautilus", "claims", "status-summary.json"), savedStatus);
		assert.throws(
			() => checkClaimFreshness({
				repoRoot: root,
				claims: ".cautilus/claims/evidenced-typed-runners.json",
				status: ".cautilus/claims/status-summary.json",
				statusRunner: statusRunnerReturning(savedStatus),
			}),
			(error) => {
				assert.match(error.message, /Release claim freshness preflight failed/);
				assert.match(error.message, /claim projection drift/);
				assert.match(error.message, /npm run claims:refresh:all/);
				return true;
			},
		);
	});
});

test("checkClaimFreshness rejects matching stale status snapshots", () => {
	withPackage("node -e \"process.exit(0)\"", (root) => {
		const staleStatus = statusPacket({
			gitState: {
				isStale: true,
				changedSourceCount: 1,
				changedSources: ["docs/master-plan.md"],
				comparisonStatus: "stale",
				recommendedAction: "Refresh claims before release.",
			},
		});
		const { claims, status } = writeSelectedClaimState(root, { statusPacket: staleStatus });
		assert.throws(
			() => checkClaimFreshness({
				repoRoot: root,
				claims,
				status,
				statusRunner: statusRunnerReturning(staleStatus),
				gitRunner: () => ({ status: 0, stdout: "", stderr: "" }),
			}),
			/claim status snapshot .* reports stale claim state/,
		);
	});
});

test("checkClaimFreshness rejects missing selected claim or status files", () => {
	withPackage("node -e \"process.exit(0)\"", (root) => {
		const savedStatus = statusPacket();
		writeJson(join(root, "status-summary.json"), savedStatus);
		assert.throws(
			() => checkClaimFreshness({
				repoRoot: root,
				claims: "missing-claims.json",
				status: "status-summary.json",
				statusRunner: statusRunnerReturning(savedStatus),
			}),
			/claim packet .*missing-claims\.json is missing/,
		);
		writeJson(join(root, "claims.json"), { claimCandidates: [], claimSummary: {} });
		assert.throws(
			() => checkClaimFreshness({
				repoRoot: root,
				claims: "claims.json",
				status: "missing-status.json",
				statusRunner: statusRunnerReturning(savedStatus),
			}),
			/claim status snapshot .*missing-status\.json is missing/,
		);
	});
});

test("checkClaimFreshness rejects stale selected status snapshots", () => {
	withPackage("node -e \"process.exit(0)\"", (root) => {
		const savedStatus = statusPacket({ claimSummary: { byReviewStatus: { pending: 1 } } });
		const refreshedStatus = statusPacket({ claimSummary: { byReviewStatus: { pending: 2 } } });
		const { claims, status } = writeSelectedClaimState(root, { statusPacket: savedStatus });
		assert.throws(
			() => checkClaimFreshness({
				repoRoot: root,
				claims,
				status,
				statusRunner: statusRunnerReturning(refreshedStatus),
			}),
			/claim status snapshot .* is stale for selected claim packet/,
		);
	});
});

test("checkClaimFreshness keeps custom paths independent from default projection drift", () => {
	withPackage("node -e \"console.error('default projection drift'); process.exit(1)\"", (root) => {
		const savedStatus = statusPacket();
		const { claims, status } = writeSelectedClaimState(root, {
			claims: "custom-claims.json",
			status: "custom-status.json",
			statusPacket: savedStatus,
		});
		assert.deepEqual(checkClaimFreshness({
			repoRoot: root,
			claims,
			status,
			statusRunner: statusRunnerReturning(savedStatus),
			gitRunner: () => ({ status: 0, stdout: "", stderr: "" }),
		}), {
			status: "fresh",
			repoRoot: root,
			claims,
			reachablePacketGitCommit: REACHABLE_COMMIT,
		});
	});
});

test("checkClaimFreshness treats default-equivalent paths as default claim state", () => {
	withPackage("node -e \"console.error('default projection drift'); process.exit(1)\"", (root) => {
		mkdirSync(join(root, ".cautilus", "claims"), { recursive: true });
		const savedStatus = statusPacket();
		writeJson(join(root, ".cautilus", "claims", "evidenced-typed-runners.json"), {
			schemaVersion: "cautilus.claims.v1",
			claimCandidates: [],
			claimSummary: {},
		});
		writeJson(join(root, ".cautilus", "claims", "status-summary.json"), savedStatus);
		assert.throws(
			() => checkClaimFreshness({
				repoRoot: root,
				claims: "./.cautilus/claims/evidenced-typed-runners.json",
				status: "./.cautilus/claims/status-summary.json",
				statusRunner: statusRunnerReturning(savedStatus),
				gitRunner: () => ({ status: 0, stdout: "", stderr: "" }),
			}),
			/default projection drift/,
		);
	});
});

test("checkClaimFreshness wraps invalid selected status JSON with repair guidance", () => {
	withPackage("node -e \"process.exit(0)\"", (root) => {
		writeJson(join(root, "claims.json"), {
			schemaVersion: "cautilus.claims.v1",
			claimCandidates: [],
			claimSummary: {},
		});
		writeFileSync(join(root, "status-summary.json"), "{broken", "utf-8");
		assert.throws(
			() => checkClaimFreshness({
				repoRoot: root,
				claims: "claims.json",
				status: "status-summary.json",
			}),
			(error) => {
				assert.match(error.message, /Release claim freshness preflight failed/);
				assert.match(error.message, /is not readable JSON/);
				assert.match(error.message, /cd '.*' && \.\/bin\/cautilus discover claims status/);
				return true;
			},
		);
	});
});

test("check-claim-freshness CLI prints fresh release metadata", () => {
	withPackage("node -e \"process.exit(0)\"", (root) => {
		const savedStatus = statusPacket({
			gitState: {
				packetGitCommit: "",
			},
		});
		const { claims, status } = writeSelectedClaimState(root, { statusPacket: savedStatus });
		const binDir = join(root, "bin");
		mkdirSync(binDir, { recursive: true });
		const fakeCautilus = join(binDir, "cautilus");
		writeFileSync(
			fakeCautilus,
			[
				"#!/usr/bin/env node",
				"const { writeFileSync } = await import('node:fs');",
				"const { join } = await import('node:path');",
				"writeFileSync(join(process.cwd(), 'argv.json'), JSON.stringify(process.argv.slice(2)));",
				`process.stdout.write(${JSON.stringify(JSON.stringify(savedStatus))});`,
				"",
			].join("\n"),
			"utf-8",
		);
		chmodSync(fakeCautilus, 0o755);
		const result = spawnSync(
			"node",
			[SCRIPT, "--repo-root", root, "--claims", claims, "--status", status],
			{ encoding: "utf-8" },
		);
		assert.equal(result.status, 0, result.stderr);
		assert.deepEqual(JSON.parse(result.stdout), {
			status: "fresh",
			repoRoot: root,
			claims,
			reachablePacketGitCommit: null,
		});
		const argv = JSON.parse(spawnSync("node", ["-e", `process.stdout.write(require('node:fs').readFileSync(${JSON.stringify(join(root, "argv.json"))}, 'utf-8'))`], {
			encoding: "utf-8",
		}).stdout);
		assert.deepEqual(argv, ["discover", "claims", "status", "--input", claims, "--sample-claims", "1"]);
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
