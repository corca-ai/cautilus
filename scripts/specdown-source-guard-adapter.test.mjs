import assert from "node:assert/strict";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { spawnSync } from "node:child_process";
import test from "node:test";

const ADAPTER_PATH = join(process.cwd(), "scripts", "specdown-source-guard-adapter.mjs");

function writeFile(root, relativePath, content) {
	const fullPath = join(root, relativePath);
	mkdirSync(join(fullPath, ".."), { recursive: true });
	writeFileSync(fullPath, content, "utf-8");
}

function createSpecRepo() {
	const root = mkdtempSync(join(tmpdir(), "cautilus-specdown-adapter-"));
	writeFile(
		root,
		"docs/specs/index.spec.md",
		[
			"# Specs",
			"",
			"- [Product](product.spec.md)",
			"",
		].join("\n"),
	);
	writeFile(
		root,
		"docs/specs/product.spec.md",
		[
			"# Product",
			"",
			"> check:source_guard",
			"| file | mode | pattern |",
			"| --- | --- | --- |",
			"| README.md | file_exists |  |",
			"| package.json | fixed | \"verify\" |",
			"",
		].join("\n"),
	);
	writeFile(root, "README.md", "# temp\n");
	writeFile(root, "package.json", '{ "scripts": { "verify": "npm run test" } }\n');
	return root;
}

test("specdown source_guard adapter passes valid rows", () => {
	const root = createSpecRepo();
	try {
		const input = [
			JSON.stringify({
				type: "assert",
				id: 1,
				check: "source_guard",
				columns: ["file", "mode", "pattern"],
				cells: ["README.md", "file_exists", ""],
			}),
			JSON.stringify({
				type: "assert",
				id: 2,
				check: "source_guard",
				columns: ["file", "mode", "pattern"],
				cells: ["package.json", "fixed", "\"verify\""],
			}),
			"",
		].join("\n");
		const result = spawnSync("node", [ADAPTER_PATH], {
			cwd: root,
			input,
			encoding: "utf-8",
		});
		assert.equal(result.status, 0, result.stderr);
		const responses = result.stdout
			.trim()
			.split("\n")
			.map((line) => JSON.parse(line));
		assert.deepEqual(
			responses.map((response) => response.type),
			["passed", "passed"],
		);
	} finally {
		rmSync(root, { recursive: true, force: true });
	}
});

test("specdown source_guard adapter reports missing fixed patterns", () => {
	const root = createSpecRepo();
	try {
		const result = spawnSync("node", [ADAPTER_PATH], {
			cwd: root,
			input: `${JSON.stringify({
				type: "assert",
				id: 1,
				check: "source_guard",
				columns: ["file", "mode", "pattern"],
				cells: ["package.json", "fixed", "\"lint\""],
			})}\n`,
			encoding: "utf-8",
		});
		assert.equal(result.status, 0, result.stderr);
		const response = JSON.parse(result.stdout.trim());
		assert.equal(response.type, "failed");
		assert.match(response.message, /Missing fixed pattern/);
		assert.equal(response.expected, "\"lint\"");
	} finally {
		rmSync(root, { recursive: true, force: true });
	}
});
