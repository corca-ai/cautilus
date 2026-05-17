import { readFileSync } from "node:fs";
import test from "node:test";
import assert from "node:assert/strict";

test("spec-report uses the Node 24 GitHub Pages artifact action", () => {
	const workflow = readFileSync(".github/workflows/spec-report.yml", "utf8");

	assert.match(workflow, /actions\/upload-pages-artifact@v5/);
	assert.doesNotMatch(workflow, /actions\/upload-pages-artifact@v3/);
});

test("verify workflows run the checked-in verify gate", () => {
	for (const path of [".github/workflows/verify.yml", ".github/workflows/release-artifacts.yml"]) {
		const workflow = readFileSync(path, "utf8");
		assert.match(workflow, /- run: npm run verify/);
	}
});

test("package scripts keep local gates and external consumer onboarding smoke", () => {
	const packageJSON = JSON.parse(readFileSync("package.json", "utf8"));

	assert.equal(packageJSON.scripts.verify, "node scripts/run-verify.mjs");
	assert.equal(packageJSON.scripts["hooks:check"], "node scripts/check-git-hooks.mjs");
	assert.equal(packageJSON.scripts["consumer:onboard:smoke"], "node scripts/on-demand/smoke-external-consumer.mjs");
});
