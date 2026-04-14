import assert from "node:assert/strict";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { spawnSync } from "node:child_process";
import test from "node:test";

import { findBrokenLinksInFile, stripFencedCodeBlocks } from "./check-markdown-links.mjs";

const CHECK_SCRIPT = join(process.cwd(), "scripts", "check-markdown-links.mjs");

function git(root, args) {
	const result = spawnSync("git", ["-C", root, ...args], { encoding: "utf-8" });
	assert.equal(result.status, 0, result.stderr);
	return result.stdout.trim();
}

function initRepo(root) {
	git(root, ["init"]);
	git(root, ["config", "user.name", "Cautilus Test"]);
	git(root, ["config", "user.email", "test@example.com"]);
}

function write(root, relative, content) {
	const absolute = join(root, relative);
	mkdirSync(join(absolute, ".."), { recursive: true });
	writeFileSync(absolute, content, "utf-8");
	git(root, ["add", relative]);
	return absolute;
}

function runLinter(root) {
	return spawnSync("node", [CHECK_SCRIPT], {
		cwd: root,
		encoding: "utf-8",
	});
}

test("passes when every local link resolves to a real file", () => {
	const root = mkdtempSync(join(tmpdir(), "cautilus-link-ok-"));
	try {
		initRepo(root);
		write(root, "target.md", "# target\n");
		write(root, "doc.md", "See [target](./target.md) and [external](https://example.com).\n");
		const result = runLinter(root);
		assert.equal(result.status, 0, `${result.stdout}\n${result.stderr}`);
		assert.match(result.stdout, /2 file\(s\) checked/);
	} finally {
		rmSync(root, { recursive: true, force: true });
	}
});

test("fails when an inline link points at a missing file and reports file:line and target", () => {
	const root = mkdtempSync(join(tmpdir(), "cautilus-link-broken-"));
	try {
		initRepo(root);
		write(root, "doc.md", "padding line\n\n[gone](./missing.md)\n");
		const result = runLinter(root);
		assert.equal(result.status, 1, `${result.stdout}\n${result.stderr}`);
		assert.match(result.stderr, /doc\.md:3 -> \.\/missing\.md/);
	} finally {
		rmSync(root, { recursive: true, force: true });
	}
});

test("ignores links inside fenced code blocks", () => {
	const root = mkdtempSync(join(tmpdir(), "cautilus-link-fence-"));
	try {
		initRepo(root);
		write(
			root,
			"doc.md",
			"```\n[should-not-check](./missing.md)\n```\n",
		);
		const result = runLinter(root);
		assert.equal(result.status, 0, `${result.stdout}\n${result.stderr}`);
	} finally {
		rmSync(root, { recursive: true, force: true });
	}
});

test("ignores pure anchor fragments and external URL schemes", () => {
	const broken = findBrokenLinksInFile(
		"/fake/doc.md",
		"[a](#section)\n[b](https://example.com)\n[c](mailto:a@b.co)\n",
	);
	assert.deepEqual(broken, []);
});

test("strips anchor from local links before checking the file exists", () => {
	const root = mkdtempSync(join(tmpdir(), "cautilus-link-anchor-"));
	try {
		initRepo(root);
		write(root, "target.md", "# target\n");
		write(root, "doc.md", "Jump [here](./target.md#deep-section).\n");
		const result = runLinter(root);
		assert.equal(result.status, 0, `${result.stdout}\n${result.stderr}`);
	} finally {
		rmSync(root, { recursive: true, force: true });
	}
});

test("stripFencedCodeBlocks preserves line numbers by emptying fenced lines", () => {
	const input = "a\n```\ninside\n```\nb\n";
	const output = stripFencedCodeBlocks(input);
	assert.equal(output.split("\n").length, input.split("\n").length);
	assert.match(output, /^a\n\n\n\nb\n$/);
});
