import assert from "node:assert/strict";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { spawnSync } from "node:child_process";
import test from "node:test";

const SCRIPT_PATH = join(process.cwd(), "scripts", "check-spec-evidence.mjs");

function writeFile(root, relativePath, content) {
	const fullPath = join(root, relativePath);
	mkdirSync(join(fullPath, ".."), { recursive: true });
	writeFileSync(fullPath, content, "utf-8");
}

function withTempRepo(label, fn) {
	const root = mkdtempSync(join(tmpdir(), `cautilus-check-spec-evidence-${label}-`));
	try {
		fn(root);
	} finally {
		rmSync(root, { recursive: true, force: true });
	}
}

function runScript(root) {
	return spawnSync("node", [SCRIPT_PATH], { cwd: root, encoding: "utf-8" });
}

test("passes when subclaim spec attaches an evidence directive", () => {
	withTempRepo("pass-evidence", (root) => {
		writeFile(
			root,
			"docs/specs/user/feature.spec.md",
			[
				"# Feature",
				"",
				"## Subclaims",
				"",
				"- The binary does X.",
				"",
				"## Evidence",
				"",
				"> check:cautilus-command",
				"| args_json | stdout_includes |",
				"| --- | --- |",
				'| ["feature","--help"] | feature |',
				"",
			].join("\n"),
		);
		const result = runScript(root);
		assert.equal(result.status, 0, result.stderr);
		assert.match(result.stdout, /spec evidence checks passed \(1 subclaim specs\)/);
	});
});

test("passes when subclaim spec logs explicit evidence gaps", () => {
	withTempRepo("pass-gaps", (root) => {
		writeFile(
			root,
			"docs/specs/user/feature.spec.md",
			[
				"# Feature",
				"",
				"## Subclaims",
				"",
				"- The binary does X.",
				"",
				"## Evidence Gaps",
				"",
				"- Subclaim X needs a fixture run; owner: maintainer; next: author fixture.",
				"",
			].join("\n"),
		);
		const result = runScript(root);
		assert.equal(result.status, 0, result.stderr);
	});
});

test("fails when spec uses 'Evidence is pending' as the closing state", () => {
	withTempRepo("fail-pending", (root) => {
		writeFile(
			root,
			"docs/specs/user/feature.spec.md",
			[
				"# Feature",
				"",
				"## Subclaims",
				"",
				"- The binary does X.",
				"",
				"## Evidence",
				"",
				"Evidence is pending.",
				"",
			].join("\n"),
		);
		const result = runScript(root);
		assert.equal(result.status, 1);
		assert.match(result.stderr, /"Evidence is pending" is not a valid closing state/);
	});
});

test("fails when neither Evidence nor Evidence Gaps section is present", () => {
	withTempRepo("fail-missing-section", (root) => {
		writeFile(
			root,
			"docs/specs/user/feature.spec.md",
			[
				"# Feature",
				"",
				"## Subclaims",
				"",
				"- The binary does X.",
				"",
			].join("\n"),
		);
		const result = runScript(root);
		assert.equal(result.status, 1);
		assert.match(
			result.stderr,
			/missing both "## Evidence" and "## Evidence Gaps" sections/,
		);
	});
});

test("fails when Evidence and Evidence Gaps sections are both empty of concrete entries", () => {
	withTempRepo("fail-empty", (root) => {
		writeFile(
			root,
			"docs/specs/user/feature.spec.md",
			[
				"# Feature",
				"",
				"## Subclaims",
				"",
				"- The binary does X.",
				"",
				"## Evidence",
				"",
				"Some narrative without any directive or link.",
				"",
			].join("\n"),
		);
		const result = runScript(root);
		assert.equal(result.status, 1);
		assert.match(
			result.stderr,
			/neither "## Evidence" nor "## Evidence Gaps" carries a concrete entry/,
		);
	});
});

test("skips index.spec.md pages", () => {
	withTempRepo("skip-index", (root) => {
		writeFile(
			root,
			"docs/specs/index.spec.md",
			["# Index", "", "- [User](user/index.spec.md)", ""].join("\n"),
		);
		writeFile(
			root,
			"docs/specs/user/index.spec.md",
			["# User Index", "", "- [Feature](feature.spec.md)", ""].join("\n"),
		);
		writeFile(
			root,
			"docs/specs/user/feature.spec.md",
			[
				"# Feature",
				"",
				"## Subclaims",
				"",
				"- The binary does X.",
				"",
				"## Evidence Gaps",
				"",
				"- Tracked.",
				"",
			].join("\n"),
		);
		const result = runScript(root);
		assert.equal(result.status, 0, result.stderr);
		assert.match(result.stdout, /\(1 subclaim specs\)/);
	});
});

test("fails when a non-index spec is missing the Subclaims section", () => {
	withTempRepo("fail-no-subclaims", (root) => {
		writeFile(
			root,
			"docs/specs/maintainer/area.spec.md",
			[
				"# Area",
				"",
				"## Maintainer Promise",
				"",
				"Some text.",
				"",
				"## Proof Notes",
				"",
				"More text.",
				"",
			].join("\n"),
		);
		const result = runScript(root);
		assert.equal(result.status, 1);
		assert.match(result.stderr, /missing "## Subclaims" section/);
	});
});
