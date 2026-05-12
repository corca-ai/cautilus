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
		"./bin/cautilus discover claims --repo-root . --previous .cautilus/claims/evidenced-typed-runners.json --output .cautilus/claims/evidenced-typed-runners.json",
		"npm run claims:canonical-map",
		"npm run claims:evidence-state",
		"npm run claims:status-report",
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
				assert.match(
					error.message,
					/\.\/bin\/cautilus discover claims --repo-root \. --previous \.cautilus\/claims\/custom\.json --output \.cautilus\/claims\/custom\.json/,
				);
				assert.match(error.message, /npm run claims:evidence-state/);
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
});
