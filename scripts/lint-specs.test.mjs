import assert from "node:assert/strict";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { spawnSync } from "node:child_process";
import test from "node:test";

const SCRIPT_PATH = join(process.cwd(), "scripts", "lint-specs.mjs");
const LEDGER_SCRIPT_PATH = join(process.cwd(), "scripts", "agent-runtime", "render-promise-ledger.mjs");
const DURATION_PATTERN = String.raw`\d+(?:ms|\.\d{2}s)`;

function writeFile(root, relativePath, content) {
	const fullPath = join(root, relativePath);
	mkdirSync(join(fullPath, ".."), { recursive: true });
	writeFileSync(fullPath, content, "utf-8");
}

test("lint-specs target mode runs specdown with the selected file as entry", () => {
	const root = mkdtempSync(join(tmpdir(), "cautilus-lint-specs-target-"));
	try {
		writeFile(
			root,
			"specdown.json",
			JSON.stringify({
				entry: "docs/specs/index.spec.md",
				adapters: [],
				reporters: [{ builtin: "json", outFile: ".artifacts/specdown/report.json" }],
			}),
		);
		writeFile(
			root,
			"docs/specs/index.spec.md",
			[
				"# Test Report",
				"",
				"- [Product](user/product.spec.md)",
				"",
			].join("\n"),
		);
		writeFile(
			root,
			"docs/specs/user/product.spec.md",
			[
				"# Product",
				"",
				"```run:shell",
				"echo focused",
				"```",
				"",
			].join("\n"),
		);

		const result = spawnSync("node", [SCRIPT_PATH, "docs/specs/user/product.spec.md"], {
			cwd: root,
			encoding: "utf-8",
		});
		assert.equal(result.status, 0, result.stderr);
		assert.match(result.stdout, /spec checks passed \(1 selected spec\(s\)\)/);
		assert.match(result.stdout, /specdown focused run: docs\/specs\/user\/product\.spec\.md/);
		assert.match(result.stdout, new RegExp(`lint-specs timing: check=${DURATION_PATTERN}, focused=${DURATION_PATTERN}, total=${DURATION_PATTERN}`));
	} finally {
		rmSync(root, { recursive: true, force: true });
	}
});

function writeTypedTraceFixture(root, { typeApex = "apex" } = {}) {
	writeFile(
		root,
		"specdown.json",
		JSON.stringify({
			entry: "docs/specs/index.spec.md",
			trace: {
				types: ["apex", "promise"],
				edges: { badges: { from: "apex", to: "promise", count: "1 → 1..*" } },
			},
			adapters: [],
			reporters: [{ builtin: "json", outFile: ".artifacts/specdown/report.json" }],
		}),
	);
	writeFile(
		root,
		"docs/specs/index.spec.md",
		[
			"---",
			`type: ${typeApex}`,
			"---",
			"",
			"# Test Apex",
			"",
			"Proof: [badges::Product](user/product.spec.md)",
			"Generated: [Promise Ledger](generated/promise-ledger.spec.md)",
			"",
			"```run:shell",
			"echo apex",
			"```",
			"",
		].join("\n"),
	);
	writeFile(
		root,
		"docs/specs/user/product.spec.md",
		["---", "type: promise", "---", "", "# Product", "", "```run:shell", "echo promise", "```", ""].join("\n"),
	);
}

test("lint-specs full mode runs specdown and validates the typed trace graph", () => {
	const root = mkdtempSync(join(tmpdir(), "cautilus-lint-specs-full-"));
	try {
		writeTypedTraceFixture(root);
		const ledger = spawnSync("node", [LEDGER_SCRIPT_PATH, "--repo-root", root], {
			cwd: root,
			encoding: "utf-8",
		});
		assert.equal(ledger.status, 0, ledger.stderr);
		const result = spawnSync("node", [SCRIPT_PATH], { cwd: root, encoding: "utf-8" });
		assert.equal(result.status, 0, result.stderr);
		assert.match(result.stdout, /spec checks passed \(3 specs\)/);
		assert.match(result.stdout, /specdown trace -strict: 2 typed doc\(s\), 1 edge\(s\), graph valid/);
		assert.match(result.stdout, /promise ledger check: promise ledger rendered: 1 promise\(s\), 0 governed-by\/implemented-by edge\(s\)/);
		assert.match(
			result.stdout,
			new RegExp(
				`lint-specs timing: check=${DURATION_PATTERN}, specdown=${DURATION_PATTERN}, trace=${DURATION_PATTERN}, ledger=${DURATION_PATTERN}, total=${DURATION_PATTERN}`,
			),
		);
	} finally {
		rmSync(root, { recursive: true, force: true });
	}
});

test("lint-specs full mode fails when the generated promise ledger is stale", () => {
	const root = mkdtempSync(join(tmpdir(), "cautilus-lint-specs-ledger-stale-"));
	try {
		writeTypedTraceFixture(root);
		writeFile(root, "docs/specs/generated/promise-ledger.spec.md", "# stale\n");
		const result = spawnSync("node", [SCRIPT_PATH], { cwd: root, encoding: "utf-8" });
		assert.equal(result.status, 1);
		assert.match(result.stderr, /promise-ledger\.spec\.md is stale/);
		assert.match(result.stdout, /specdown trace -strict: 2 typed doc\(s\), 1 edge\(s\), graph valid/);
		assert.doesNotMatch(result.stdout, /lint-specs timing:/);
	} finally {
		rmSync(root, { recursive: true, force: true });
	}
});

test("lint-specs full mode fails when the trace graph has no typed documents", () => {
	const root = mkdtempSync(join(tmpdir(), "cautilus-lint-specs-vacuous-"));
	try {
		// Apex carries no `type:` frontmatter, so the trace graph is empty even though
		// `specdown trace -strict` itself would exit 0; the non-vacuity guard must fail.
		writeTypedTraceFixture(root, { typeApex: "" });
		writeFile(
			root,
			"docs/specs/index.spec.md",
			["# Test Apex", "", "Proof: [Product](user/product.spec.md)", "Generated: [Promise Ledger](generated/promise-ledger.spec.md)", "", "```run:shell", "echo apex", "```", ""].join("\n"),
		);
		writeFile(
			root,
			"docs/specs/user/product.spec.md",
			["# Product", "", "```run:shell", "echo promise", "```", ""].join("\n"),
		);
		writeFile(
			root,
			"docs/specs/generated/promise-ledger.spec.md",
			["# Promise Ledger", "", "No typed graph.", ""].join("\n"),
		);
		const result = spawnSync("node", [SCRIPT_PATH], { cwd: root, encoding: "utf-8" });
		assert.equal(result.status, 1);
		assert.match(result.stderr, /no typed documents found/);
	} finally {
		rmSync(root, { recursive: true, force: true });
	}
});
