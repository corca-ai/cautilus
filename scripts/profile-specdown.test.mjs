import assert from "node:assert/strict";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { spawnSync } from "node:child_process";
import test from "node:test";

import { formatTextReport, parseArgs, profileSpecdown } from "./profile-specdown.mjs";

const SCRIPT_PATH = join(process.cwd(), "scripts", "profile-specdown.mjs");

function writeFile(root, relativePath, content) {
	const fullPath = join(root, relativePath);
	mkdirSync(join(fullPath, ".."), { recursive: true });
	writeFileSync(fullPath, content, "utf-8");
}

function writeSpecFixture(root) {
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
			"# Test Apex",
			"",
			"- [A](user/a.spec.md)",
			"- [B](user/b.spec.md)",
			"",
			"```run:shell",
			"echo apex",
			"```",
			"",
		].join("\n"),
	);
	writeFile(root, "docs/specs/user/a.spec.md", ["# A", "", "```run:shell", "echo a", "```", ""].join("\n"));
	writeFile(root, "docs/specs/user/b.spec.md", ["# B", "", "```run:shell", "echo b", "```", ""].join("\n"));
	writeFile(root, "docs/specs/old/inert.spec.md", ["# Inert", "", "```run:shell", "exit 99", "```", ""].join("\n"));
}

test("parseArgs recognizes report options and targets", () => {
	assert.deepEqual(parseArgs(["--json", "--top", "3", "--limit", "2", "docs/specs/index.spec.md"]), {
		help: false,
		json: true,
		top: 3,
		limit: 2,
		targets: ["docs/specs/index.spec.md"],
	});
});

test("parseArgs rejects invalid options", () => {
	assert.throws(() => parseArgs(["--top", "0"]), /positive integer/);
	assert.throws(() => parseArgs(["--limit"]), /--limit requires a value/);
	assert.throws(() => parseArgs(["--nope"]), /unknown argument/);
});

test("profileSpecdown profiles active specs and excludes archived specs", () => {
	const root = mkdtempSync(join(tmpdir(), "cautilus-specdown-profile-"));
	try {
		writeSpecFixture(root);
		const report = profileSpecdown({ repoRoot: root });

		assert.equal(report.schemaVersion, "cautilus.specdown_profile.v1");
		assert.equal(report.profiledCount, 3);
		assert.equal(report.totalCandidateCount, 3);
		assert.equal(report.limited, false);
		assert.deepEqual(
			report.entries.map((entry) => entry.specFile).sort(),
			[
				"docs/specs/index.spec.md",
				"docs/specs/user/a.spec.md",
				"docs/specs/user/b.spec.md",
			],
		);
		assert.ok(report.entries.every((entry) => Number.isInteger(entry.durationMs) && entry.durationMs >= 0));
	} finally {
		rmSync(root, { recursive: true, force: true });
	}
});

test("profileSpecdown supports selected targets and text output", () => {
	const root = mkdtempSync(join(tmpdir(), "cautilus-specdown-profile-target-"));
	try {
		writeSpecFixture(root);
		const report = profileSpecdown({
			repoRoot: root,
			targets: ["docs/specs/user/a.spec.md"],
		});
		const text = formatTextReport(report, { top: 1 });

		assert.equal(report.profiledCount, 1);
		assert.equal(report.entries[0].specFile, "docs/specs/user/a.spec.md");
		assert.match(text, /specdown per-spec profile: 1 spec\(s\), total/);
		assert.match(text, /docs\/specs\/user\/a\.spec\.md/);
	} finally {
		rmSync(root, { recursive: true, force: true });
	}
});

test("CLI emits JSON", () => {
	const root = mkdtempSync(join(tmpdir(), "cautilus-specdown-profile-cli-"));
	try {
		writeSpecFixture(root);
		const result = spawnSync(
			process.execPath,
			[SCRIPT_PATH, "--json", "--limit", "1"],
			{ cwd: root, encoding: "utf-8" },
		);

		assert.equal(result.status, 0, result.stderr);
		const report = JSON.parse(result.stdout);
		assert.equal(report.profiledCount, 1);
		assert.equal(report.totalCandidateCount, 3);
		assert.equal(report.limited, true);
	} finally {
		rmSync(root, { recursive: true, force: true });
	}
});
