import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { spawnSync } from "node:child_process";
import test from "node:test";

import { checkClaimSourceFreshness, findStaleClaimSources } from "./check-claim-source-freshness.mjs";

const SCRIPT_PATH = join(process.cwd(), "scripts", "check-claim-source-freshness.mjs");

function sha256(text) {
	return `sha256:${createHash("sha256").update(Buffer.from(text)).digest("hex")}`;
}

function writeFile(root, relativePath, content) {
	const fullPath = join(root, relativePath);
	mkdirSync(join(fullPath, ".."), { recursive: true });
	writeFileSync(fullPath, content, "utf-8");
}

// Build a tmp repo whose packet records contentHash for each named source at its written content.
function buildRepo(sources, { extraInventory = [] } = {}) {
	const root = mkdtempSync(join(tmpdir(), "cautilus-claim-source-freshness-"));
	const inventory = [];
	for (const [path, content] of Object.entries(sources)) {
		writeFile(root, path, content);
		inventory.push({ path, contentHash: sha256(content), depth: 0, kind: "doc", status: "read" });
	}
	inventory.push(...extraInventory);
	writeFile(root, ".cautilus/claims/latest.json", JSON.stringify({ sourceInventory: inventory }));
	return root;
}

test("checkClaimSourceFreshness passes when every scanned source matches the packet", () => {
	const root = buildRepo({ "README.md": "# Demo\n", "docs/guides/cli.md": "cli\n" });
	try {
		const result = checkClaimSourceFreshness({ repoRoot: root });
		assert.equal(result.status, "fresh");
		assert.equal(result.comparedSourceCount, 2);
		assert.deepEqual(result.changed, []);
	} finally {
		rmSync(root, { recursive: true, force: true });
	}
});

test("findStaleClaimSources flags a source edited after discovery", () => {
	const root = buildRepo({ "README.md": "# Demo\n", "docs/guides/cli.md": "cli\n" });
	try {
		writeFile(root, "README.md", "# Demo edited after the packet was discovered\n");
		const result = findStaleClaimSources({ repoRoot: root });
		assert.deepEqual(result.changed, ["README.md"]);
		assert.deepEqual(result.missing, []);
	} finally {
		rmSync(root, { recursive: true, force: true });
	}
});

test("check-claim-source-freshness CLI fails and names the edited source plus the repair", () => {
	const root = buildRepo({ "README.md": "# Demo\n" });
	try {
		writeFile(root, "README.md", "# Demo edited\n");
		const result = spawnSync("node", [SCRIPT_PATH, "--repo-root", root], { encoding: "utf-8" });
		assert.equal(result.status, 1);
		assert.match(result.stderr, /Claim source freshness check failed/);
		assert.match(result.stderr, /Edited since the claim packet was discovered: README\.md/);
		assert.match(result.stderr, /npm run claims:refresh:all/);
	} finally {
		rmSync(root, { recursive: true, force: true });
	}
});

test("check-claim-source-freshness CLI flags a recorded source missing on disk", () => {
	const root = buildRepo({ "README.md": "# Demo\n" });
	try {
		rmSync(join(root, "README.md"));
		const result = spawnSync("node", [SCRIPT_PATH, "--repo-root", root], { encoding: "utf-8" });
		assert.equal(result.status, 1);
		assert.match(result.stderr, /missing on disk: README\.md/);
	} finally {
		rmSync(root, { recursive: true, force: true });
	}
});

test("check-claim-source-freshness CLI passes on a fresh packet", () => {
	const root = buildRepo({ "README.md": "# Demo\n", "AGENTS.md": "# Agents\n" });
	try {
		const result = spawnSync("node", [SCRIPT_PATH, "--repo-root", root], { encoding: "utf-8" });
		assert.equal(result.status, 0, result.stderr);
		assert.match(result.stdout, /"status": "fresh"/);
	} finally {
		rmSync(root, { recursive: true, force: true });
	}
});

test("findStaleClaimSources skips inventory entries without a usable contentHash", () => {
	const root = buildRepo(
		{ "README.md": "# Demo\n" },
		{ extraInventory: [{ path: "docs/missing-hash.md", depth: 1, kind: "doc", status: "missing" }] },
	);
	try {
		const result = findStaleClaimSources({ repoRoot: root });
		// only README.md (with a contentHash) is compared; the hash-less entry is ignored.
		assert.equal(result.comparedSourceCount, 1);
		assert.deepEqual(result.changed, []);
		assert.deepEqual(result.missing, []);
	} finally {
		rmSync(root, { recursive: true, force: true });
	}
});
