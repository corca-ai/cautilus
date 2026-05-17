import { readFileSync } from "node:fs";
import test from "node:test";
import assert from "node:assert/strict";

test("spec-report uses the Node 24 GitHub Pages artifact action", () => {
	const workflow = readFileSync(".github/workflows/spec-report.yml", "utf8");

	assert.match(workflow, /actions\/upload-pages-artifact@v5/);
	assert.doesNotMatch(workflow, /actions\/upload-pages-artifact@v3/);
});
