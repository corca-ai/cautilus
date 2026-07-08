import assert from "node:assert/strict";
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { spawnSync } from "node:child_process";
import test from "node:test";

import { buildLedgerModel, parseArgs, renderPromiseLedger } from "./render-promise-ledger.mjs";

const SCRIPT_PATH = join(process.cwd(), "scripts", "agent-runtime", "render-promise-ledger.mjs");

// Synthetic trace graph: apex badges two promises in order; promise-a is
// governed by one rule and implemented by one contract; promise-b (last in
// badges order) carries no governance/contract edges.
const GRAPH = {
	documents: [
		{ path: "docs/specs/index.spec.md", type: "apex" },
		{ path: "docs/specs/user/promise-a.spec.md", type: "promise" },
		{ path: "docs/specs/user/promise-b.spec.md", type: "promise" },
		{ path: "docs/specs/rules/rule-x.spec.md", type: "rule" },
		{ path: "docs/specs/contracts/contract-y.spec.md", type: "contract" },
	],
	directEdges: [
		{ source: "docs/specs/index.spec.md", target: "docs/specs/user/promise-a.spec.md", edge: "badges" },
		{ source: "docs/specs/index.spec.md", target: "docs/specs/user/promise-b.spec.md", edge: "badges" },
		{ source: "docs/specs/user/promise-a.spec.md", target: "docs/specs/rules/rule-x.spec.md", edge: "governed-by" },
		{ source: "docs/specs/user/promise-a.spec.md", target: "docs/specs/contracts/contract-y.spec.md", edge: "implemented-by" },
	],
};

const TITLES = {
	"docs/specs/user/promise-a.spec.md": "Promise A",
	"docs/specs/user/promise-b.spec.md": "Promise B",
	"docs/specs/rules/rule-x.spec.md": "Rule X",
	"docs/specs/contracts/contract-y.spec.md": "Contract Y",
};

test("buildLedgerModel orders promises by badges edge order and groups edges by kind", () => {
	const model = buildLedgerModel(GRAPH, (path) => TITLES[path]);
	assert.deepEqual(
		model.map((p) => p.name),
		["Promise A", "Promise B"],
	);
	assert.equal(model[0].path, "../user/promise-a.spec.md");
	assert.deepEqual(model[0].rules, [{ name: "Rule X", path: "../rules/rule-x.spec.md" }]);
	assert.deepEqual(model[0].contracts, [{ name: "Contract Y", path: "../contracts/contract-y.spec.md" }]);
	// Promise B has no governance/contract edges.
	assert.deepEqual(model[1].rules, []);
	assert.deepEqual(model[1].contracts, []);
});

test("renderPromiseLedger emits a generated map with dashes for edge-less promises", () => {
	const model = buildLedgerModel(GRAPH, (path) => TITLES[path]);
	const md = renderPromiseLedger(model);
	assert.match(md, /^# Cautilus Promise Ledger/);
	assert.match(md, /GENERATED — do not edit by hand/);
	assert.match(
		md,
		/\| \[Promise A\]\(\.\.\/user\/promise-a\.spec\.md\) \| \[Rule X\]\(\.\.\/rules\/rule-x\.spec\.md\) \| \[Contract Y\]\(\.\.\/contracts\/contract-y\.spec\.md\) \|/,
	);
	// Edge-less promise renders an em dash, not an empty cell.
	assert.match(md, /\| \[Promise B\]\(\.\.\/user\/promise-b\.spec\.md\) \| — \| — \|/);
	// Reverse coverage view lists the governing promise for the rule.
	assert.match(md, /\| \[Rule X\]\(\.\.\/rules\/rule-x\.spec\.md\) \| Promise A \|/);
	// No edge-prefixed links leak into the generated page (those would become stray trace edges).
	assert.doesNotMatch(md, /\[(governed-by|implemented-by|badges)::/);
});

test("renderPromiseLedger uses a prose empty state when no rules govern promises", () => {
	const graph = {
		documents: GRAPH.documents.filter((doc) => doc.type === "apex" || doc.type === "promise"),
		directEdges: GRAPH.directEdges.filter((edge) => edge.edge === "badges"),
	};
	const model = buildLedgerModel(graph, (path) => TITLES[path]);
	const md = renderPromiseLedger(model);
	assert.match(md, /No cross-cutting rule coverage edges are present/);
	assert.doesNotMatch(md, /\| Cross-cutting rule \| Governs promises \|\n\| --- \| --- \|\n\n/);
});

test("parseArgs reads flags and rejects unknown arguments", () => {
	const args = parseArgs(["--check", "--repo-root", "/tmp/x", "--json"]);
	assert.equal(args.check, true);
	assert.equal(args.json, true);
	assert.equal(args.repoRoot, "/tmp/x");
	assert.throws(() => parseArgs(["--bogus"]), /Unknown argument/);
});

function writeFile(root, relativePath, content) {
	const fullPath = join(root, relativePath);
	mkdirSync(join(fullPath, ".."), { recursive: true });
	writeFileSync(fullPath, content, "utf-8");
}

// Build a minimal typed-trace fixture repo so the build/check paths run end to
// end through `specdown trace` (covers readGraph, readTitle, generate, main).
function writeLedgerFixture(root) {
	writeFile(
		root,
		"specdown.json",
		JSON.stringify({
			entry: "docs/specs/index.spec.md",
			trace: {
				types: ["apex", "promise", "rule", "contract"],
				edges: {
					badges: { from: "apex", to: "promise", count: "1 → 1..*" },
					"governed-by": { from: "promise", to: "rule", count: "1..* → 0..*" },
					"implemented-by": { from: "promise", to: "contract", count: "1..* → 0..*" },
				},
			},
		}),
	);
	writeFile(root, "docs/specs/index.spec.md", ["---", "type: apex", "---", "", "# Fixture Apex", "", "[badges::P](user/p.spec.md)", ""].join("\n"));
	writeFile(
		root,
		"docs/specs/user/p.spec.md",
		["---", "type: promise", "---", "", "# Promise P", "", "[governed-by::R](../rules/r.spec.md)", "[implemented-by::C](../contracts/c.spec.md)", ""].join("\n"),
	);
	writeFile(root, "docs/specs/rules/r.spec.md", ["---", "type: rule", "---", "", "# Rule R", ""].join("\n"));
	writeFile(root, "docs/specs/contracts/c.spec.md", ["---", "type: contract", "---", "", "# Contract C", ""].join("\n"));
}

test("render-promise-ledger build then check passes, and a mutated page fails check", () => {
	const root = mkdtempSync(join(tmpdir(), "cautilus-ledger-"));
	try {
		writeLedgerFixture(root);

		const build = spawnSync("node", [SCRIPT_PATH, "--repo-root", root], { cwd: root, encoding: "utf-8" });
		assert.equal(build.status, 0, build.stderr);
		assert.match(build.stdout, /promise ledger rendered: 1 promise\(s\), 2 governed-by\/implemented-by edge\(s\)/);

		const page = readFileSync(join(root, "docs/specs/generated/promise-ledger.spec.md"), "utf-8");
		assert.match(page, /\| \[Promise P\]\(\.\.\/user\/p\.spec\.md\) \| \[Rule R\]\(\.\.\/rules\/r\.spec\.md\) \| \[Contract C\]\(\.\.\/contracts\/c\.spec\.md\) \|/);

		const checkOk = spawnSync("node", [SCRIPT_PATH, "--check", "--repo-root", root], { cwd: root, encoding: "utf-8" });
		assert.equal(checkOk.status, 0, checkOk.stderr);
		assert.match(checkOk.stdout, /OK: promise ledger rendered/);

		// Drift: hand-edit the generated page and confirm --check fails.
		writeFileSync(join(root, "docs/specs/generated/promise-ledger.spec.md"), `${page}\nhand edit\n`, "utf-8");
		const checkStale = spawnSync("node", [SCRIPT_PATH, "--check", "--repo-root", root], { cwd: root, encoding: "utf-8" });
		assert.equal(checkStale.status, 1);
		assert.match(checkStale.stderr, /is stale — run npm run specdown:ledger/);
	} finally {
		rmSync(root, { recursive: true, force: true });
	}
});
