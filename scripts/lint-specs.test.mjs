import assert from "node:assert/strict";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { spawnSync } from "node:child_process";
import test from "node:test";

const SCRIPT_PATH = join(process.cwd(), "scripts", "lint-specs.mjs");

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
	} finally {
		rmSync(root, { recursive: true, force: true });
	}
});
