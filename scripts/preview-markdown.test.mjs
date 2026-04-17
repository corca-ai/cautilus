import test from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, mkdirSync, rmSync, writeFileSync, existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";

import { parseArgs, previewMarkdown, selectMarkdownFiles } from "./preview-markdown.mjs";

test("parseArgs accepts changed/specs/stdout and custom widths", () => {
	const parsed = parseArgs(["--changed", "--specs", "--stdout", "--width", "120", "--width", "72"]);
	assert.deepEqual(parsed, {
		changed: true,
		specsOnly: true,
		stdout: true,
		widths: [120, 72],
		paths: [],
		help: false,
	});
});

test("parseArgs accepts explicit markdown targets", () => {
	const parsed = parseArgs(["docs/guides", "README.md"]);
	assert.deepEqual(parsed, {
		changed: false,
		specsOnly: false,
		stdout: false,
		widths: [],
		paths: ["docs/guides", "README.md"],
		help: false,
	});
});

test("selectMarkdownFiles narrows to changed files", () => {
	const root = mkdtempSync(join(tmpdir(), "cautilus-preview-"));
	try {
		writeFileSync(join(root, "README.md"), "# Root\n");
		writeFileSync(join(root, "README.ko.md"), "# Korean\n");
		writeFileSync(join(root, "install.md"), "# Install\n");
		mkdirSync(join(root, "docs", "specs"), { recursive: true });
		writeFileSync(join(root, "docs", "specs", "index.spec.md"), "# Spec\n");
		const files = selectMarkdownFiles(
			root,
			{ changed: true, specsOnly: false, stdout: false, widths: [] },
			(cmd, args) => {
				if (cmd !== "git") throw new Error(`unexpected command ${cmd}`);
				assert.deepEqual(args, ["status", "--short", "--untracked-files=all", "--", "*.md", "docs/specs/*.md"]);
				return {
					status: 0,
					stdout: " M README.md\n?? docs/specs/index.spec.md\n",
					stderr: "",
				};
			},
		);
		assert.deepEqual(files, [join(root, "README.md"), join(root, "docs", "specs", "index.spec.md")]);
	} finally {
		rmSync(root, { recursive: true, force: true });
	}
});

test("selectMarkdownFiles expands explicit files and directories", () => {
	const root = mkdtempSync(join(tmpdir(), "cautilus-preview-"));
	try {
		writeFileSync(join(root, "README.md"), "# Root\n");
		mkdirSync(join(root, "docs", "guides"), { recursive: true });
		writeFileSync(join(root, "docs", "guides", "consumer-adoption.md"), "# Guide\n");
		const files = selectMarkdownFiles(root, {
			changed: false,
			specsOnly: false,
			stdout: false,
			widths: [],
			paths: ["docs/guides", "README.md"],
		});
		assert.deepEqual(files, [join(root, "README.md"), join(root, "docs", "guides", "consumer-adoption.md")]);
	} finally {
		rmSync(root, { recursive: true, force: true });
	}
});

test("previewMarkdown writes rendered artifacts with default widths", () => {
	const root = mkdtempSync(join(tmpdir(), "cautilus-preview-"));
	try {
		writeFileSync(join(root, "README.md"), "# Root\n");
		writeFileSync(join(root, "README.ko.md"), "# Korean\n");
		writeFileSync(join(root, "install.md"), "# Install\n");
		mkdirSync(join(root, "docs", "specs"), { recursive: true });
		writeFileSync(join(root, "docs", "specs", "index.spec.md"), "# Spec\n");

		const calls = [];
		const result = previewMarkdown(
			root,
			{ changed: false, specsOnly: false, stdout: false, widths: [], paths: [] },
			{
				spawn(cmd, args) {
					calls.push([cmd, args]);
					if (cmd === "sh") {
						return { status: 0, stdout: "/usr/bin/glow\n", stderr: "" };
					}
					if (cmd === "glow") {
						return { status: 0, stdout: `rendered:${args.at(-1)}:w${args[1]}\n`, stderr: "" };
					}
					throw new Error(`unexpected command ${cmd}`);
				},
				stdout: { write() {} },
			},
		);

		assert.equal(result.fileCount, 4);
		assert.equal(result.renderCount, 8);
		assert.equal(calls.filter(([cmd]) => cmd === "glow").length, 8);
		const artifact = join(root, ".artifacts", "markdown-preview", "README.md.w80.txt");
		assert.equal(existsSync(artifact), true);
		assert.equal(readFileSync(artifact, "utf-8"), `rendered:${join(root, "README.md")}:w80\n`);
	} finally {
		rmSync(root, { recursive: true, force: true });
	}
});
