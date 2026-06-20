#!/usr/bin/env node

// Render the fingerprint-keyed claim inventory into the generated Projected Claim
// State page (docs/specs/evidence/projected-claim-state.md) that the ledger and
// evidence surface read instead of restating tier/verdict/route state by hand.
//
// Build:  node scripts/agent-runtime/render-projected-claim-state.mjs [--repo-root <dir>]
// Check:  node scripts/agent-runtime/render-projected-claim-state.mjs --check
//
// --check re-renders the page in memory and fails when the checked-in page
// drifted from the inventory. The inventory is consumed read-only — this script
// never recomputes the projection (run npm run specdown:project for that); it
// only renders the already-projected state.

import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import process from "node:process";
import { pathToFileURL } from "node:url";

import { PAGE_PATH, renderClaimState } from "./projected-claim-state-lib.mjs";

export const INVENTORY_PATH = ".cautilus/specdown/claim-inventory.json";
export { PAGE_PATH };

function usage(exitCode = 0) {
	const text = [
		"Usage:",
		"  node scripts/agent-runtime/render-projected-claim-state.mjs [--repo-root <dir>] [--json]",
		"  node scripts/agent-runtime/render-projected-claim-state.mjs --check [--repo-root <dir>] [--json]",
		"",
		"Build re-renders the Projected Claim State page from the claim inventory.",
		"--check re-renders in memory and fails when the checked-in page drifted.",
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

function readInventory(repoRoot) {
	const abs = resolve(repoRoot, INVENTORY_PATH);
	if (!existsSync(abs)) {
		throw new Error(
			`Missing required input: ${INVENTORY_PATH} — run npm run specdown:project first`,
		);
	}
	return JSON.parse(readFileSync(abs, "utf-8"));
}

export function generate(repoRoot) {
	const inventory = readInventory(repoRoot);
	return { inventory, markdown: renderClaimState(inventory) };
}

function writeFileEnsuringDir(absPath, text) {
	mkdirSync(dirname(absPath), { recursive: true });
	writeFileSync(absPath, text, "utf-8");
}

function reportSummary(inventory) {
	const { summary, reconciliation } = inventory;
	return (
		`projected claim state rendered: ${summary.durableGraded} durable-graded ` +
		`(T1=${summary.byTier.T1} T2=${summary.byTier.T2} T3=${summary.byTier.T3}), ` +
		`${summary.t1BadgeBindings}/${summary.byTier.T1} T1 badge-bound; ` +
		`${reconciliation.divergenceCount}/${reconciliation.badges.length} badges divergent`
	);
}

function runBuild(args) {
	const { inventory, markdown } = generate(args.repoRoot);
	writeFileEnsuringDir(resolve(args.repoRoot, PAGE_PATH), markdown);
	if (args.json) {
		process.stdout.write(`${JSON.stringify({ ok: true, page: PAGE_PATH }, null, 2)}\n`);
	} else {
		process.stdout.write(`${reportSummary(inventory)}\n`);
	}
	process.exit(0);
}

function runCheck(args) {
	const { inventory, markdown } = generate(args.repoRoot);
	const abs = resolve(args.repoRoot, PAGE_PATH);
	const onDisk = existsSync(abs) ? readFileSync(abs, "utf-8") : null;
	const failures = [];
	if (onDisk !== markdown) {
		failures.push(`${PAGE_PATH} is stale — run npm run specdown:claim-state to regenerate`);
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
