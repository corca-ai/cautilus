import { test } from "node:test";
import assert from "node:assert/strict";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { renderClaimState } from "./projected-claim-state-lib.mjs";
import { INVENTORY_PATH, PAGE_PATH, generate, main, parseArgs } from "./render-projected-claim-state.mjs";

const REPO_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "../..");

// A minimal but well-formed inventory so the render shell's build/check paths can
// be exercised in isolation, without depending on the real checked-in inventory.
function writeInventory(root) {
	const inventory = {
		schemaVersion: "cautilus.claim_inventory.v1",
		generatedFrom: { goldSet: "gold.json", track: "user-product", packetGitCommit: "deadbeef" },
		summary: {
			totalEntries: 2,
			durableGraded: 2,
			nonGraded: 0,
			byTier: { T1: 1, T2: 1, T3: 0 },
			byVerdict: { accept: 2 },
			nonGradedByVerdict: {},
			t1BadgeBindings: 1,
			overridesApplied: 0,
		},
		entriesByFingerprint: {
			"sha256:a": {
				claimId: "claim-a-1",
				significanceTier: "T1",
				ratifiedProofRoute: "deterministic",
				primaryEpic: "APEX",
				summary: "headline",
				sourceRef: "README.md:4",
				maintainerVerdict: "accept",
				badge: "readiness",
			},
			"sha256:b": {
				claimId: "claim-b-2",
				significanceTier: "T2",
				ratifiedProofRoute: "deterministic",
				primaryEpic: "E1",
				summary: "backing",
				sourceRef: "README.md:9",
				maintainerVerdict: "accept",
				badge: null,
			},
		},
		reconciliation: { registryBadgeCount: 0, badges: [], divergenceCount: 0, divergentBadges: [] },
	};
	const abs = resolve(root, INVENTORY_PATH);
	mkdirSync(dirname(abs), { recursive: true });
	writeFileSync(abs, `${JSON.stringify(inventory, null, 2)}\n`, "utf-8");
	return inventory;
}

function runMain(argv) {
	const out = [];
	const err = [];
	const originalExit = process.exit;
	const originalOut = process.stdout.write;
	const originalErr = process.stderr.write;
	let code = null;
	process.exit = (value) => {
		code = value ?? 0;
		throw new Error(`__exit__${code}`);
	};
	process.stdout.write = (chunk) => out.push(String(chunk));
	process.stderr.write = (chunk) => err.push(String(chunk));
	try {
		main(argv);
	} catch (error) {
		if (!String(error.message).startsWith("__exit__")) throw error;
	} finally {
		process.exit = originalExit;
		process.stdout.write = originalOut;
		process.stderr.write = originalErr;
	}
	return { code, out: out.join(""), err: err.join("") };
}

test("parseArgs recognizes check/json and defaults repo-root", () => {
	const args = parseArgs(["--repo-root", "/tmp/x", "--check", "--json"]);
	assert.equal(args.check, true);
	assert.equal(args.json, true);
	assert.equal(args.repoRoot, resolve("/tmp/x"));
});

test("parseArgs rejects unknown flags and empty repo-root", () => {
	assert.throws(() => parseArgs(["--nope"]), /Unknown argument/);
	assert.throws(() => parseArgs(["--repo-root", ""]), /--repo-root is required/);
});

test("generate renders the checked-in page from the real inventory", () => {
	const { markdown } = generate(REPO_ROOT);
	const onDisk = readFileSync(resolve(REPO_ROOT, PAGE_PATH), "utf-8");
	assert.equal(markdown, onDisk);
});

test("render shell: build writes the page, then check passes", () => {
	const root = mkdtempSync(resolve(tmpdir(), "projected-claim-state-"));
	try {
		const inventory = writeInventory(root);
		const built = runMain(["--repo-root", root]);
		assert.equal(built.code, 0);
		assert.match(built.out, /2 durable-graded/);
		const page = readFileSync(resolve(root, PAGE_PATH), "utf-8");
		assert.equal(page, renderClaimState(inventory));

		const checked = runMain(["--repo-root", root, "--check"]);
		assert.equal(checked.code, 0);
		assert.match(checked.out, /^OK:/);
	} finally {
		rmSync(root, { recursive: true, force: true });
	}
});

test("render shell: build --json reports the page path", () => {
	const root = mkdtempSync(resolve(tmpdir(), "projected-claim-state-json-"));
	try {
		writeInventory(root);
		const built = runMain(["--repo-root", root, "--json"]);
		assert.equal(built.code, 0);
		const payload = JSON.parse(built.out);
		assert.equal(payload.ok, true);
		assert.equal(payload.page, PAGE_PATH);
	} finally {
		rmSync(root, { recursive: true, force: true });
	}
});

test("render shell: --help exits 0 with usage", () => {
	const helped = runMain(["--help"]);
	assert.equal(helped.code, 0);
	assert.match(helped.out, /Usage:/);
});

test("render shell: check fails on drift", () => {
	const root = mkdtempSync(resolve(tmpdir(), "projected-claim-state-drift-"));
	try {
		writeInventory(root);
		runMain(["--repo-root", root]);
		writeFileSync(resolve(root, PAGE_PATH), "# tampered\n", "utf-8");
		const checked = runMain(["--repo-root", root, "--check"]);
		assert.equal(checked.code, 1);
		assert.match(checked.err, /stale/);
	} finally {
		rmSync(root, { recursive: true, force: true });
	}
});

test("render shell: check --json reports failures structurally", () => {
	const root = mkdtempSync(resolve(tmpdir(), "projected-claim-state-jsoncheck-"));
	try {
		writeInventory(root);
		// No page written yet, so --check must report it as missing/stale.
		const checked = runMain(["--repo-root", root, "--check", "--json"]);
		assert.equal(checked.code, 1);
		const payload = JSON.parse(checked.out);
		assert.equal(payload.ok, false);
		assert.ok(payload.failures.length > 0);
	} finally {
		rmSync(root, { recursive: true, force: true });
	}
});

test("generate throws when the inventory is missing", () => {
	const root = mkdtempSync(resolve(tmpdir(), "projected-claim-state-empty-"));
	try {
		assert.throws(() => generate(root), /Missing required input/);
		assert.ok(!existsSync(resolve(root, PAGE_PATH)));
	} finally {
		rmSync(root, { recursive: true, force: true });
	}
});
