#!/usr/bin/env node

// Project the HITL-ratified gold set into the fingerprint-keyed claim inventory
// that the spec surface (apex/ledger/evidence) and the audit registry consume.
//
// Build:  node scripts/agent-runtime/build-goldset-projection.mjs [--repo-root <dir>]
// Check:  node scripts/agent-runtime/build-goldset-projection.mjs --check
//
// --check regenerates the inventory in memory and fails when the checked-in
// artifact drifted or the projection is structurally invalid (e.g. a T1 claim
// lost its badge binding). The gold set is consumed as a checked-in artifact;
// no gold-set logic enters the Go engine/runtime.

import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import process from "node:process";
import { pathToFileURL } from "node:url";

import { buildInventory, validateInventory } from "./goldset-projection-lib.mjs";

export const GOLD_SET_PATH =
	"charness-artifacts/eval-trust/goldset-v2-head/gold-set-proposal.user-product.json";
export const BADGE_MAP_PATH = "docs/specs/audit/claim-badge-map.json";
export const OVERRIDES_PATH = "docs/specs/audit/claim-proof-route-overrides.json";
export const REGISTRY_PATH = "docs/specs/audit/surface-registry.json";
export const INVENTORY_PATH = ".cautilus/specdown/claim-inventory.json";

function usage(exitCode = 0) {
	const text = [
		"Usage:",
		"  node scripts/agent-runtime/build-goldset-projection.mjs [--repo-root <dir>] [--json]",
		"  node scripts/agent-runtime/build-goldset-projection.mjs --check [--repo-root <dir>] [--json]",
		"",
		"Build regenerates the fingerprint-keyed claim inventory from the gold set,",
		"the badge map, and the proof-route overrides. --check regenerates in memory",
		"and fails on drift or a structurally invalid projection.",
	].join("\n");
	(exitCode === 0 ? process.stdout : process.stderr).write(`${text}\n`);
	process.exit(exitCode);
}

export function parseArgs(argv) {
	const args = { repoRoot: process.cwd(), check: false, json: false };
	for (let index = 0; index < argv.length; index += 1) {
		const arg = argv[index];
		if (arg === "-h" || arg === "--help") {
			usage(0);
		} else if (arg === "--repo-root") {
			args.repoRoot = argv[++index] || "";
		} else if (arg === "--check") {
			args.check = true;
		} else if (arg === "--json") {
			args.json = true;
		} else {
			throw new Error(`Unknown argument: ${arg}`);
		}
	}
	if (!args.repoRoot) {
		throw new Error("--repo-root is required");
	}
	args.repoRoot = resolve(args.repoRoot);
	return args;
}

function readJson(repoRoot, relPath) {
	const abs = resolve(repoRoot, relPath);
	if (!existsSync(abs)) {
		throw new Error(`Missing required input: ${relPath}`);
	}
	return JSON.parse(readFileSync(abs, "utf-8"));
}

function serialize(inventory) {
	return `${JSON.stringify(inventory, null, 2)}\n`;
}

export function generate(repoRoot) {
	const goldSet = readJson(repoRoot, GOLD_SET_PATH);
	const badgeMapDoc = readJson(repoRoot, BADGE_MAP_PATH);
	const overrideDoc = readJson(repoRoot, OVERRIDES_PATH);
	const registryDoc = readJson(repoRoot, REGISTRY_PATH);
	const inventory = buildInventory({
		goldSet,
		badgeMapDoc,
		overrideDoc,
		registryDoc,
		paths: {
			goldSet: GOLD_SET_PATH,
			badgeMap: BADGE_MAP_PATH,
			overrides: OVERRIDES_PATH,
			registry: REGISTRY_PATH,
		},
	});
	const errors = validateInventory(inventory, badgeMapDoc);
	return { inventory, inventoryText: serialize(inventory), errors };
}

function writeFileEnsuringDir(absPath, text) {
	mkdirSync(dirname(absPath), { recursive: true });
	writeFileSync(absPath, text, "utf-8");
}

function reportSummary(inventory) {
	const { summary, reconciliation } = inventory;
	return (
		`claim inventory built: ${summary.durableGraded} durable-graded ` +
		`(T1=${summary.byTier.T1} T2=${summary.byTier.T2} T3=${summary.byTier.T3}), ` +
		`${summary.nonGraded} non-graded; ${summary.t1BadgeBindings}/7 T1 badge-bound; ` +
		`${reconciliation.divergenceCount}/${reconciliation.badges.length} badges divergent`
	);
}

function runBuild(args) {
	const { inventory, inventoryText, errors } = generate(args.repoRoot);
	writeFileEnsuringDir(resolve(args.repoRoot, INVENTORY_PATH), inventoryText);
	if (args.json) {
		process.stdout.write(inventoryText);
	} else {
		process.stdout.write(`${reportSummary(inventory)}\n`);
	}
	if (errors.length > 0) {
		process.stderr.write(`FAIL: projection invalid:\n  - ${errors.join("\n  - ")}\n`);
		process.exit(1);
	}
	process.exit(0);
}

function runCheck(args) {
	const { inventory, inventoryText, errors } = generate(args.repoRoot);
	const failures = [...errors];
	const abs = resolve(args.repoRoot, INVENTORY_PATH);
	const onDisk = existsSync(abs) ? readFileSync(abs, "utf-8") : null;
	if (onDisk !== inventoryText) {
		failures.push(
			`${INVENTORY_PATH} is stale — run npm run specdown:project to regenerate`,
		);
	}
	if (args.json) {
		process.stdout.write(`${JSON.stringify({ ok: failures.length === 0, failures }, null, 2)}\n`);
	} else if (failures.length === 0) {
		process.stdout.write(`OK: ${reportSummary(inventory)}\n`);
	} else {
		process.stderr.write(`FAIL:\n  - ${failures.join("\n  - ")}\n`);
	}
	process.exit(failures.length === 0 ? 0 : 1);
}

export function main(argv) {
	const args = parseArgs(argv);
	if (args.check) runCheck(args);
	else runBuild(args);
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
	main(process.argv.slice(2));
}
