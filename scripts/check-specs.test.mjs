import assert from "node:assert/strict";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { spawnSync } from "node:child_process";
import test from "node:test";

const SCRIPT_PATH = join(process.cwd(), "scripts", "check-specs.mjs");

function writeFile(root, relativePath, content) {
	const fullPath = join(root, relativePath);
	mkdirSync(join(fullPath, ".."), { recursive: true });
	writeFileSync(fullPath, content, "utf-8");
}

test("check-specs validates linked public specs from specdown entry", () => {
	const root = mkdtempSync(join(tmpdir(), "cautilus-check-specs-pass-"));
	try {
		writeFile(root, "specdown.json", JSON.stringify({ entry: "docs/specs/index.spec.md" }));
		writeFile(
			root,
			"docs/specs/index.spec.md",
			[
				"# Test Report",
				"",
				"- [User](user/index.spec.md)",
				"",
			].join("\n"),
		);
		writeFile(
			root,
			"docs/specs/user/index.spec.md",
			[
				"# Test Specs",
				"",
				"- [Product](product.spec.md)",
				"",
			].join("\n"),
		);
		writeFile(
			root,
			"docs/specs/user/product.spec.md",
			[
				"# Product",
				"",
				"[Readme](../../../README.md)",
				"",
			].join("\n"),
		);
		writeFile(root, "README.md", "# temp\n");

		const result = spawnSync("node", [SCRIPT_PATH], {
			cwd: root,
			encoding: "utf-8",
		});
		assert.equal(result.status, 0, result.stderr);
		assert.match(result.stdout, /spec checks passed \(3 specs\)/);
	} finally {
		rmSync(root, { recursive: true, force: true });
	}
});

test("check-specs fails when an active spec is not linked from the index", () => {
	const root = mkdtempSync(join(tmpdir(), "cautilus-check-specs-fail-"));
	try {
		writeFile(root, "specdown.json", JSON.stringify({ entry: "docs/specs/index.spec.md" }));
		writeFile(
			root,
			"docs/specs/index.spec.md",
			[
				"# Test Report",
				"",
				"- [User](user/index.spec.md)",
				"",
			].join("\n"),
		);
		writeFile(
			root,
			"docs/specs/user/index.spec.md",
			[
				"# Test Specs",
				"",
				"- [Product](product.spec.md)",
				"",
			].join("\n"),
		);
		writeFile(
			root,
			"docs/specs/user/product.spec.md",
			[
				"# Product",
				"",
				"[Readme](../../../README.md)",
				"",
			].join("\n"),
		);
		writeFile(
			root,
			"docs/specs/user/extra.spec.md",
			[
				"# Extra",
				"",
				"[Readme](../../../README.md)",
				"",
			].join("\n"),
		);
		writeFile(root, "README.md", "# temp\n");

		const result = spawnSync("node", [SCRIPT_PATH], {
			cwd: root,
			encoding: "utf-8",
		});
		assert.equal(result.status, 1);
		assert.match(result.stderr, /Specdown entry does not link docs\/specs\/user\/extra\.spec\.md/);
	} finally {
		rmSync(root, { recursive: true, force: true });
	}
});

test("check-specs fails on broken relative links inside docs/specs", () => {
	const root = mkdtempSync(join(tmpdir(), "cautilus-check-specs-broken-link-"));
	try {
		writeFile(root, "specdown.json", JSON.stringify({ entry: "docs/specs/index.spec.md" }));
		writeFile(
			root,
			"docs/specs/index.spec.md",
			[
				"# Test Report",
				"",
				"- [User](user/index.spec.md)",
				"",
			].join("\n"),
		);
		writeFile(
			root,
			"docs/specs/user/index.spec.md",
			[
				"# Test Specs",
				"",
				"- [Product](product.spec.md)",
				"",
			].join("\n"),
		);
		writeFile(
			root,
			"docs/specs/user/product.spec.md",
			[
				"# Product",
				"",
				"[Missing](missing.md)",
				"",
			].join("\n"),
		);

		const result = spawnSync("node", [SCRIPT_PATH], {
			cwd: root,
			encoding: "utf-8",
		});
		assert.equal(result.status, 1);
		assert.match(result.stderr, /Broken spec link in docs\/specs\/user\/product\.spec\.md: missing\.md/);
	} finally {
		rmSync(root, { recursive: true, force: true });
	}
});
