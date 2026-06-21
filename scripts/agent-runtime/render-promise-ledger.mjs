#!/usr/bin/env node

// Render the Cautilus Promise Ledger page (docs/specs/generated/promise-ledger.spec.md)
// from the typed Specdown trace graph. Each promise's governing cross-cutting
// rules and implementing contracts are derived from the `governed-by::` /
// `implemented-by::` edges on its leaf spec, so the human-readable map cannot
// drift from the edges that `specdown trace -strict` already enforces.
//
// Build:  node scripts/agent-runtime/render-promise-ledger.mjs [--repo-root <dir>]
// Check:  node scripts/agent-runtime/render-promise-ledger.mjs --check
//
// --check re-renders in memory and fails when the checked-in page drifted from
// the graph. This is the principled replacement for hand-maintaining the
// promise/rule/contract relationships in several restated "view" pages.

import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { dirname, resolve } from "node:path";
import process from "node:process";
import { pathToFileURL } from "node:url";

export const LEDGER_PAGE_PATH = "docs/specs/generated/promise-ledger.spec.md";

const GENERATED_NOTICE =
	"<!-- GENERATED — do not edit by hand. Source: the typed Specdown trace graph in specdown.json. Regenerate: npm run specdown:ledger. -->";

// Convert a repo-root-relative spec path (docs/specs/...) into a path relative
// to the ledger page that links it (docs/specs/generated/promise-ledger.spec.md).
// The page lives one level under docs/specs/, so the docs/specs/ prefix maps to ../.
function relFromLedger(repoRelPath) {
	if (!repoRelPath.startsWith("docs/specs/")) {
		throw new Error(`Unexpected spec path outside docs/specs: ${repoRelPath}`);
	}
	return repoRelPath.replace(/^docs\/specs\//, "../");
}

// Build the ordered promise model from the trace graph. Promise order follows
// the apex `badges` edge order (the product reading order), and per-promise
// rule/contract order follows the edge declaration order on the leaf.
export function buildLedgerModel(graph, titleOf) {
	const typeByPath = new Map(graph.documents.map((doc) => [doc.path, doc.type]));
	const apexPath = graph.documents.find((doc) => doc.type === "apex")?.path;

	const orderedPromisePaths = graph.directEdges
		.filter((edge) => edge.edge === "badges" && edge.source === apexPath)
		.map((edge) => edge.target);

	const link = (path) => ({ name: titleOf(path), path: relFromLedger(path) });

	return orderedPromisePaths.map((promisePath) => {
		const outgoing = graph.directEdges.filter((edge) => edge.source === promisePath);
		const rules = outgoing
			.filter((edge) => edge.edge === "governed-by" && typeByPath.get(edge.target) === "rule")
			.map((edge) => link(edge.target));
		const contracts = outgoing
			.filter((edge) => edge.edge === "implemented-by" && typeByPath.get(edge.target) === "contract")
			.map((edge) => link(edge.target));
		return { name: titleOf(promisePath), path: relFromLedger(promisePath), rules, contracts };
	});
}

function mdLink({ name, path }) {
	return `[${name}](${path})`;
}

function cellOrDash(links) {
	return links.length === 0 ? "—" : links.map(mdLink).join(", ");
}

export function renderPromiseLedger(promises) {
	const lines = [];
	lines.push("# Cautilus Promise Ledger");
	lines.push("");
	lines.push(GENERATED_NOTICE);
	lines.push("");
	lines.push(
		"This page is generated from the typed Specdown trace graph in `specdown.json`.",
	);
	lines.push(
		"Each promise's governing cross-cutting rules and implementing contracts are derived from the `governed-by::` and `implemented-by::` edges on its leaf spec, so this map cannot drift from the edges that `specdown trace -strict` enforces.",
	);
	lines.push("");
	lines.push("## Promise Map");
	lines.push("");
	lines.push("| Promise | Governed by (rules) | Implemented by (contracts) |");
	lines.push("| --- | --- | --- |");
	for (const promise of promises) {
		lines.push(
			`| ${mdLink(promise)} | ${cellOrDash(promise.rules)} | ${cellOrDash(promise.contracts)} |`,
		);
	}
	lines.push("");
	lines.push("## Cross-Cutting Rule Coverage");
	lines.push("");
	lines.push(
		"Reverse view: which promises each cross-cutting rule governs (derived from the same `governed-by::` edges).",
	);
	lines.push("");
	lines.push("| Cross-cutting rule | Governs promises |");
	lines.push("| --- | --- |");
	const ruleCoverage = new Map();
	for (const promise of promises) {
		for (const rule of promise.rules) {
			if (!ruleCoverage.has(rule.path)) {
				ruleCoverage.set(rule.path, { rule, promises: [] });
			}
			ruleCoverage.get(rule.path).promises.push(promise.name);
		}
	}
	const sortedRules = [...ruleCoverage.values()].sort((a, b) => a.rule.name.localeCompare(b.rule.name));
	for (const { rule, promises: governed } of sortedRules) {
		lines.push(`| ${mdLink(rule)} | ${governed.join(", ")} |`);
	}
	lines.push("");
	return `${lines.join("\n")}\n`;
}

function readTitle(repoRoot, repoRelPath) {
	const content = readFileSync(resolve(repoRoot, repoRelPath), "utf-8");
	for (const line of content.split("\n")) {
		const match = /^# (.+)$/.exec(line);
		if (match) return match[1].trim();
	}
	throw new Error(`No H1 title found in ${repoRelPath}`);
}

function readGraph(repoRoot) {
	const result = spawnSync("specdown", ["trace"], { cwd: repoRoot, encoding: "utf-8" });
	if (result.error) throw result.error;
	if (result.status !== 0) {
		throw new Error(`specdown trace failed (exit ${result.status}): ${result.stderr || ""}`);
	}
	return JSON.parse(result.stdout);
}

export function generate(repoRoot) {
	const graph = readGraph(repoRoot);
	const promises = buildLedgerModel(graph, (path) => readTitle(repoRoot, path));
	return { promises, markdown: renderPromiseLedger(promises) };
}

export function parseArgs(argv) {
	const args = { repoRoot: process.cwd(), check: false, json: false };
	for (let index = 0; index < argv.length; index += 1) {
		const arg = argv[index];
		if (arg === "-h" || arg === "--help") {
			process.stdout.write(
				[
					"Usage:",
					"  node scripts/agent-runtime/render-promise-ledger.mjs [--repo-root <dir>] [--json]",
					"  node scripts/agent-runtime/render-promise-ledger.mjs --check [--repo-root <dir>] [--json]",
				].join("\n") + "\n",
			);
			process.exit(0);
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
	if (!args.repoRoot) throw new Error("--repo-root is required");
	args.repoRoot = resolve(args.repoRoot);
	return args;
}

function summary(promises) {
	const edgeCount = promises.reduce((sum, p) => sum + p.rules.length + p.contracts.length, 0);
	return `promise ledger rendered: ${promises.length} promise(s), ${edgeCount} governed-by/implemented-by edge(s)`;
}

export function main(argv) {
	const args = parseArgs(argv);
	const { promises, markdown } = generate(args.repoRoot);
	const abs = resolve(args.repoRoot, LEDGER_PAGE_PATH);
	if (args.check) {
		const onDisk = existsSync(abs) ? readFileSync(abs, "utf-8") : null;
		const stale = onDisk !== markdown;
		if (args.json) {
			process.stdout.write(`${JSON.stringify({ ok: !stale }, null, 2)}\n`);
		} else if (stale) {
			process.stderr.write(
				`FAIL:\n  - ${LEDGER_PAGE_PATH} is stale — run npm run specdown:ledger to regenerate\n`,
			);
		} else {
			process.stdout.write(`OK: ${summary(promises)}\n`);
		}
		process.exit(stale ? 1 : 0);
	}
	mkdirSync(dirname(abs), { recursive: true });
	writeFileSync(abs, markdown, "utf-8");
	process.stdout.write(`${summary(promises)}\n`);
	process.exit(0);
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
	main(process.argv.slice(2));
}
