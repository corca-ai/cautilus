import { test } from "node:test";
import assert from "node:assert/strict";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import {
	APEX_BADGE_IDS,
	ROUTE_TO_PROOF_CLASS,
	badgeByFingerprint,
	buildInventory,
	isDurableGraded,
	isNonGraded,
	overrideRouteByFingerprint,
	reconcileBadges,
	resolveProofRoute,
	summarize,
	t1Records,
	validateInventory,
} from "./goldset-projection-lib.mjs";
import {
	BADGE_MAP_PATH,
	GOLD_SET_PATH,
	INVENTORY_PATH,
	OVERRIDES_PATH,
	REGISTRY_PATH,
	generate,
	main,
	parseArgs,
} from "./build-goldset-projection.mjs";

const REPO_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "../..");

function readRepoJson(relPath) {
	return JSON.parse(readFileSync(resolve(REPO_ROOT, relPath), "utf-8"));
}

function loadRealInputs() {
	return {
		goldSet: readRepoJson(GOLD_SET_PATH),
		badgeMapDoc: readRepoJson(BADGE_MAP_PATH),
		overrideDoc: readRepoJson(OVERRIDES_PATH),
		registryDoc: readRepoJson(REGISTRY_PATH),
	};
}

function realInventory(overrides = {}) {
	const inputs = { ...loadRealInputs(), ...overrides };
	return buildInventory(inputs);
}

const FP = {
	valueProp: "sha256:9018c538fe5ded20087c5b9c3dea13abd9b803fb454e5fd768c05164a726b596",
	threeJobs: "sha256:b2db3970d5430186c25796dcfce79426d64725377fd3d1a18a81687f66126add",
	install: "sha256:32437872b5e4ba1773bff79aab81ce278f3baca552daa84b30ffe00bdfadfb74",
	curation: "sha256:d86efe24767d201f86fa6b4f59a19f4b87689cfd278c2ee648573e80b0e4616f",
	intentFirst: "sha256:876d422ecc6981fb0023f848c23f90ac2be7fc0f9b0e2e615109b89044a5d21e",
	heldOut: "sha256:fca2fcfa646dc5c2d8a0113e913a099de9824ac235a6afcb08a50e2d84894960",
	bounded: "sha256:3f7d53374b3ad0a1f98d080a07490f3b717148e78267be931104835aebcc23ec",
	relabel8: "sha256:b207b54490c0db2ab75bded7ba0421b0d2898a095ed7948180593c7e765f40e8",
};

// ---------------------------------------------------------------------------
// AC1 — the projector emits the fingerprint-keyed inventory; exactly 7 T1 claims
// project and bind to apex badges via the explicit map; the 56/18 graded split
// matches the HITL closeout.
// ---------------------------------------------------------------------------

test("AC1: graded/non-graded split matches the HITL closeout exactly", () => {
	const inventory = realInventory();
	const { summary } = inventory;
	assert.equal(summary.totalEntries, 74);
	assert.equal(summary.durableGraded, 56);
	assert.equal(summary.nonGraded, 18);
	assert.deepEqual(summary.byTier, { T1: 7, T2: 41, T3: 8 });
	assert.deepEqual(summary.byVerdict, { accept: 54, relabel: 1, "rewrite-source": 1 });
	assert.deepEqual(summary.nonGradedByVerdict, {
		"not-a-claim": 11,
		"retire-source": 5,
		"badly-bounded": 2,
	});
	// The inventory is keyed by claimFingerprint and only carries graded entries.
	assert.equal(Object.keys(inventory.entriesByFingerprint).length, 56);
});

test("AC1: each inventory record carries the contracted fields", () => {
	const inventory = realInventory();
	const record = inventory.entriesByFingerprint[FP.valueProp];
	for (const field of [
		"significanceTier",
		"ratifiedProofRoute",
		"primaryEpic",
		"summary",
		"sourceRef",
		"audience",
	]) {
		assert.ok(field in record, `record missing ${field}`);
	}
	assert.equal(record.audience, "user");
});

test("AC1: exactly 7 T1 claims project, each bound to a known apex badge", () => {
	const inventory = realInventory();
	const t1 = t1Records(inventory);
	assert.equal(t1.length, 7);
	const validBadges = new Set(APEX_BADGE_IDS);
	for (const record of t1) {
		assert.ok(record.badge, `${record.claimId} has no badge`);
		assert.ok(validBadges.has(record.badge), `${record.claimId} -> unknown badge ${record.badge}`);
	}
	assert.equal(inventory.summary.t1BadgeBindings, 7);
});

test("AC1: the binding is by the explicit map, NOT by primaryEpic", () => {
	const inventory = realInventory();
	const byFp = inventory.entriesByFingerprint;
	// The three primaryEpic=APEX T1 claims would collapse onto one badge if the
	// binding were epic-driven; the explicit map routes them to distinct badges.
	assert.equal(byFp[FP.valueProp].primaryEpic, "APEX");
	assert.equal(byFp[FP.threeJobs].primaryEpic, "APEX");
	assert.equal(byFp[FP.intentFirst].primaryEpic, "APEX");
	assert.equal(byFp[FP.valueProp].badge, "behavior-evaluation");
	assert.equal(byFp[FP.threeJobs].badge, "claim-discovery");
	assert.equal(byFp[FP.intentFirst].badge, "behavior-evaluation");
	// Two claims with different epics still land on the same badge.
	assert.equal(byFp[FP.threeJobs].badge, byFp[FP.curation].badge);
	assert.notEqual(byFp[FP.threeJobs].primaryEpic, byFp[FP.curation].primaryEpic);
});

test("AC1: validateInventory passes on the real projection", () => {
	const { badgeMapDoc } = loadRealInputs();
	const errors = validateInventory(realInventory(), badgeMapDoc);
	assert.deepEqual(errors, []);
});

// ---------------------------------------------------------------------------
// AC2 — the projection is load-bearing: dropping or re-tiering a T1 claim fails.
// ---------------------------------------------------------------------------

function cloneGoldSet() {
	return JSON.parse(JSON.stringify(loadRealInputs().goldSet));
}

test("AC2: dropping a T1 claim from the gold set fails validation", () => {
	const goldSet = cloneGoldSet();
	goldSet.entries = goldSet.entries.filter((e) => e.claimFingerprint !== FP.valueProp);
	const inventory = buildInventory({ ...loadRealInputs(), goldSet });
	assert.equal(t1Records(inventory).length, 6);
	const errors = validateInventory(inventory, loadRealInputs().badgeMapDoc);
	assert.ok(errors.some((e) => e.includes("expected 7 T1")), errors.join("; "));
	assert.ok(
		errors.some((e) => e.includes("claim-readme-md-4") && e.includes("not a durable-graded entry")),
		errors.join("; "),
	);
});

test("AC2: re-tiering a T1 claim to T2 fails validation", () => {
	const goldSet = cloneGoldSet();
	for (const entry of goldSet.entries) {
		if (entry.claimFingerprint === FP.bounded) entry.significanceTier = "T2";
	}
	const inventory = buildInventory({ ...loadRealInputs(), goldSet });
	// The re-tiered claim loses its badge: projectEntry only sets a badge on the
	// T1 path (`tier === "T1" ? badgeMap.get(...) : null`), so shifting to T2
	// nulls it. The claim stays durable-graded, just no longer T1.
	assert.equal(inventory.entriesByFingerprint[FP.bounded].badge, null);
	assert.equal(inventory.entriesByFingerprint[FP.bounded].significanceTier, "T2");
	assert.equal(t1Records(inventory).length, 6);
	const errors = validateInventory(inventory, loadRealInputs().badgeMapDoc);
	assert.ok(errors.some((e) => e.includes("expected 7 T1")), errors.join("; "));
	assert.ok(
		errors.some((e) => e.includes("claim-readme-md-139") && e.includes("not T1")),
		errors.join("; "),
	);
});

// ---------------------------------------------------------------------------
// AC3 — the relabel proof route is resolved from the structured override surface,
// never from the prose note. The pre-relabel recommendedProof stays untouched.
// ---------------------------------------------------------------------------

test("AC3: the README:8 relabel route is pinned via the override surface", () => {
	const inventory = realInventory();
	const record = inventory.entriesByFingerprint[FP.relabel8];
	assert.equal(record.ratifiedProofRoute, "cautilus-eval");
	assert.equal(record.routeOverridden, true);
	// The structured agentLabels value is left at its pre-relabel value.
	assert.equal(record.recommendedProof, "deterministic");
	assert.equal(inventory.summary.overridesApplied, 1);
});

test("AC3: without the override the route falls back to recommendedProof (not the note)", () => {
	const inventory = buildInventory({ ...loadRealInputs(), overrideDoc: { overrides: [] } });
	const record = inventory.entriesByFingerprint[FP.relabel8];
	// Proves the route comes from the structured surface, never from parsing the
	// prose note (which still says cautilus-eval).
	assert.equal(record.ratifiedProofRoute, "deterministic");
	assert.equal(record.routeOverridden, false);
	assert.equal(inventory.summary.overridesApplied, 0);
});

test("resolveProofRoute honors the override map then falls back", () => {
	const overrideMap = overrideRouteByFingerprint({
		overrides: [{ claimFingerprint: "sha256:x", ratifiedProofRoute: "cautilus-eval" }],
	});
	assert.deepEqual(
		resolveProofRoute({ claimFingerprint: "sha256:x", agentLabels: { recommendedProof: "deterministic" } }, overrideMap),
		{ route: "cautilus-eval", overridden: true },
	);
	assert.deepEqual(
		resolveProofRoute({ claimFingerprint: "sha256:y", agentLabels: { recommendedProof: "human-auditable" } }, overrideMap),
		{ route: "human-auditable", overridden: false },
	);
});

// ---------------------------------------------------------------------------
// AC4 — reconcile the projected ratified routes against the apex proof-route
// registry; every divergence is surfaced, none silently tolerated. Read-only.
// ---------------------------------------------------------------------------

test("AC4: reconciliation surfaces badges with no ratified T1 headline claim", () => {
	const { reconciliation } = realInventory();
	const byBadge = new Map(reconciliation.badges.map((b) => [b.badge, b]));
	assert.equal(byBadge.get("readiness").divergence, "no-t1-claim");
	assert.equal(byBadge.get("a-testable-agent").divergence, "no-t1-claim");
});

test("AC4: reconciliation reports per-claim route/proof-class alignment", () => {
	const { reconciliation } = realInventory();
	const behavior = reconciliation.badges.find((b) => b.badge === "behavior-evaluation");
	// claim-4 (cautilus-eval) maps to cautilus-eval === the registry proof class.
	const aligned = behavior.boundT1.find((c) => c.claimId === "claim-readme-md-4");
	assert.equal(aligned.impliedProofClass, "cautilus-eval");
	assert.equal(aligned.matchesRegistry, true);
	// claim-136 (human-auditable) does not match the badge's cautilus-eval class -> surfaced.
	const unmapped = behavior.boundT1.find((c) => c.claimId === "claim-readme-md-136");
	assert.equal(unmapped.impliedProofClass, "human-auditable");
	assert.equal(unmapped.matchesRegistry, false);
	assert.equal(behavior.divergence, "route-class-mismatch");
});

test("AC4: every divergence is enumerated and counted", () => {
	const { reconciliation } = realInventory();
	assert.equal(reconciliation.registryBadgeCount, 7);
	assert.equal(reconciliation.divergenceCount, reconciliation.divergentBadges.length);
	// On the current ratified state, no badge is fully aligned (the apex badge
	// taxonomy and the gold-set T1 taxonomy are related but distinct).
	assert.equal(reconciliation.divergenceCount, 7);
});

test("AC4: reconciliation CAN report an aligned badge (machinery is not always-mismatch)", () => {
	const entriesByFingerprint = {
		"sha256:a": {
			significanceTier: "T1",
			badge: "claim-discovery",
			claimId: "synthetic",
			ratifiedProofRoute: "deterministic",
		},
	};
	const registryDoc = {
		routes: APEX_BADGE_IDS.map((id) => ({
			id,
			proofClass: id === "claim-discovery" ? "deterministic" : "none",
		})),
	};
	const reconciliation = reconcileBadges(entriesByFingerprint, registryDoc);
	const claimDiscovery = reconciliation.badges.find((b) => b.badge === "claim-discovery");
	assert.equal(claimDiscovery.divergence, "aligned");
	assert.deepEqual(claimDiscovery.mismatchedClaims, []);
});

// ---------------------------------------------------------------------------
// Pure helpers
// ---------------------------------------------------------------------------

test("isDurableGraded / isNonGraded partition the verdict space", () => {
	assert.equal(isDurableGraded({ maintainerVerdict: "accept" }), true);
	assert.equal(isDurableGraded({ maintainerVerdict: "relabel" }), true);
	assert.equal(isDurableGraded({ maintainerVerdict: "rewrite-source" }), true);
	assert.equal(isDurableGraded({ maintainerVerdict: "not-a-claim" }), false);
	assert.equal(isNonGraded({ maintainerVerdict: "retire-source" }), true);
	assert.equal(isNonGraded({ maintainerVerdict: "badly-bounded" }), true);
	assert.equal(isNonGraded({ maintainerVerdict: "accept" }), false);
});

test("badgeByFingerprint indexes the bindings", () => {
	const map = badgeByFingerprint({
		bindings: [{ claimFingerprint: "sha256:a", badge: "readiness" }],
	});
	assert.equal(map.get("sha256:a"), "readiness");
	assert.equal(map.has("sha256:b"), false);
});

test("summarize counts tiers, verdicts, and non-graded buckets", () => {
	const all = [
		{ maintainerVerdict: "accept", significanceTier: "T1" },
		{ maintainerVerdict: "accept", significanceTier: "T2" },
		{ maintainerVerdict: "not-a-claim" },
		{ maintainerVerdict: "retire-source" },
	];
	const graded = all.filter(isDurableGraded);
	const summary = summarize(all, graded);
	assert.equal(summary.totalEntries, 4);
	assert.equal(summary.durableGraded, 2);
	assert.equal(summary.nonGraded, 2);
	assert.deepEqual(summary.byTier, { T1: 1, T2: 1, T3: 0 });
	assert.deepEqual(summary.nonGradedByVerdict, { "not-a-claim": 1, "retire-source": 1 });
});

test("ROUTE_TO_PROOF_CLASS is the identity map (one shared verdict-mode vocabulary)", () => {
	assert.equal(ROUTE_TO_PROOF_CLASS.deterministic, "deterministic");
	assert.equal(ROUTE_TO_PROOF_CLASS["cautilus-eval"], "cautilus-eval");
	assert.equal(ROUTE_TO_PROOF_CLASS["human-auditable"], "human-auditable");
});

// ---------------------------------------------------------------------------
// Drift guard — the checked-in inventory matches the current projection.
// ---------------------------------------------------------------------------

test("the checked-in inventory artifact matches the current projection", () => {
	const { inventoryText } = generate(REPO_ROOT);
	const onDisk = readFileSync(resolve(REPO_ROOT, INVENTORY_PATH), "utf-8");
	assert.equal(
		onDisk,
		inventoryText,
		`${INVENTORY_PATH} is stale — run node scripts/agent-runtime/build-goldset-projection.mjs`,
	);
});

// ---------------------------------------------------------------------------
// Build shell — parseArgs + build/check run paths over synthetic inputs.
// ---------------------------------------------------------------------------

test("parseArgs reads flags and defaults", () => {
	const args = parseArgs(["--repo-root", "/tmp/x", "--check", "--json"]);
	assert.equal(args.check, true);
	assert.equal(args.json, true);
	assert.equal(args.repoRoot, "/tmp/x");
	assert.throws(() => parseArgs(["--bogus"]), /Unknown argument/);
});

function writeJson(root, relPath, value) {
	const abs = resolve(root, relPath);
	mkdirSync(dirname(abs), { recursive: true });
	writeFileSync(abs, `${JSON.stringify(value, null, 2)}\n`, "utf-8");
}

// A synthetic repo that satisfies the real-data validator (exactly 7 T1 claims,
// each bound to a distinct badge) so the shell's build/check run paths can be
// exercised without depending on the real gold set's content.
function syntheticRepo() {
	const root = mkdtempSync(resolve(tmpdir(), "goldset-projection-"));
	const t1 = APEX_BADGE_IDS.map((badge, i) => ({
		claimId: `c${i + 1}`,
		claimFingerprint: `sha256:${i + 1}`,
		significanceTier: "T1",
		summary: `headline ${i + 1}`,
		sourceRef: `README.md:${i + 1}`,
		maintainerVerdict: "accept",
		agentLabels: { recommendedProof: "deterministic", primaryEpic: "X", claimAudience: "user" },
	}));
	writeJson(root, GOLD_SET_PATH, {
		track: "user-product",
		packetGitCommit: "deadbeef",
		entries: [
			...t1,
			{ claimId: "c99", claimFingerprint: "sha256:99", maintainerVerdict: "not-a-claim", agentLabels: {} },
		],
	});
	writeJson(root, BADGE_MAP_PATH, {
		validBadgeIds: APEX_BADGE_IDS,
		bindings: APEX_BADGE_IDS.map((badge, i) => ({
			claimFingerprint: `sha256:${i + 1}`,
			claimId: `c${i + 1}`,
			badge,
		})),
	});
	writeJson(root, OVERRIDES_PATH, { overrides: [] });
	writeJson(root, REGISTRY_PATH, {
		routes: APEX_BADGE_IDS.map((id) => ({ id, proofClass: "deterministic" })),
	});
	return root;
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

test("build shell: build writes the artifact, then check passes", () => {
	const root = syntheticRepo();
	try {
		const built = runMain(["--repo-root", root]);
		assert.equal(built.code, 0);
		assert.match(built.out, /7 durable-graded/);
		assert.ok(existsSync(resolve(root, INVENTORY_PATH)));

		const checked = runMain(["--repo-root", root, "--check"]);
		assert.equal(checked.code, 0);
		assert.match(checked.out, /^OK:/);
	} finally {
		rmSync(root, { recursive: true, force: true });
	}
});

test("build shell: build --json emits the inventory", () => {
	const root = syntheticRepo();
	try {
		const built = runMain(["--repo-root", root, "--json"]);
		assert.equal(built.code, 0);
		const payload = JSON.parse(built.out);
		assert.equal(payload.schemaVersion, "cautilus.claim_inventory.v1");
		assert.equal(payload.summary.byTier.T1, 7);
	} finally {
		rmSync(root, { recursive: true, force: true });
	}
});

test("build shell: --help exits 0 with usage", () => {
	const helped = runMain(["--help"]);
	assert.equal(helped.code, 0);
	assert.match(helped.out, /Usage:/);
});

test("build shell: check fails on drift", () => {
	const root = syntheticRepo();
	try {
		runMain(["--repo-root", root]);
		writeFileSync(resolve(root, INVENTORY_PATH), "{}\n", "utf-8");
		const checked = runMain(["--repo-root", root, "--check"]);
		assert.equal(checked.code, 1);
		assert.match(checked.err, /stale/);
	} finally {
		rmSync(root, { recursive: true, force: true });
	}
});

test("build shell: check --json reports failures structurally", () => {
	const root = syntheticRepo();
	try {
		// Drop the badge binding so the projection is structurally invalid.
		writeJson(root, BADGE_MAP_PATH, { validBadgeIds: APEX_BADGE_IDS, bindings: [] });
		const checked = runMain(["--repo-root", root, "--check", "--json"]);
		assert.equal(checked.code, 1);
		const payload = JSON.parse(checked.out);
		assert.equal(payload.ok, false);
		assert.ok(payload.failures.length > 0);
	} finally {
		rmSync(root, { recursive: true, force: true });
	}
});

test("build shell: generate throws when an input is missing", () => {
	const root = mkdtempSync(resolve(tmpdir(), "goldset-projection-empty-"));
	try {
		assert.throws(() => generate(root), /Missing required input/);
	} finally {
		rmSync(root, { recursive: true, force: true });
	}
});
