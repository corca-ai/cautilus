import { readFileSync } from "node:fs";
import test from "node:test";
import assert from "node:assert/strict";

const SPEC_REPORT_WORKFLOW = ".github/workflows/spec-report.yml";
const VERIFY_WORKFLOWS = [".github/workflows/verify.yml", ".github/workflows/release-artifacts.yml"];
const SPECDOWN_VERSION = "v0.48.0";

test("spec-report uses the Node 24 GitHub Pages artifact action", () => {
	const workflow = readFileSync(SPEC_REPORT_WORKFLOW, "utf8");

	assert.match(workflow, /actions\/upload-pages-artifact@v5/);
	assert.doesNotMatch(workflow, /actions\/upload-pages-artifact@v3/);
});

test("verify workflows run the checked-in verify gate", () => {
	for (const path of VERIFY_WORKFLOWS) {
		const workflow = readFileSync(path, "utf8");
		assert.match(workflow, /- run: npm run verify/);
	}
});

test("GitHub workflows pin specdown instead of installing latest", () => {
	const workflows = [SPEC_REPORT_WORKFLOW, ...VERIFY_WORKFLOWS];
	for (const path of workflows) {
		const workflow = readFileSync(path, "utf8");
		assert.doesNotMatch(workflow, /github\.com\/corca-ai\/specdown\/cmd\/specdown@latest/);
		assert.match(
			workflow,
			new RegExp(`go install github\\.com/corca-ai/specdown/cmd/specdown@${SPECDOWN_VERSION.replaceAll(".", "\\.")}`),
		);
	}
});

test("package scripts keep local gates and external consumer onboarding smoke", () => {
	const packageJSON = JSON.parse(readFileSync("package.json", "utf8"));

	assert.equal(packageJSON.scripts.verify, "node scripts/run-verify.mjs");
	assert.equal(packageJSON.scripts["hooks:check"], "node scripts/check-git-hooks.mjs");
	assert.equal(packageJSON.scripts["consumer:onboard:smoke"], "node scripts/on-demand/smoke-external-consumer.mjs");
	assert.equal(packageJSON.scripts["critique:surface-packet:check"], "node scripts/prepare-surface-critique-packet.mjs --check");
	assert.equal(
		packageJSON.scripts["critique:surface-packet:cli-agent:check"],
		"node scripts/prepare-surface-critique-packet.mjs --surface-id cli-agent-product --check",
	);
});

test("package scripts keep standing claim evidence audit scoped", () => {
	const packageJSON = JSON.parse(readFileSync("package.json", "utf8"));

	assert.match(packageJSON.scripts["claims:audit-evidence"], /--reference-scope active/);
	assert.match(packageJSON.scripts["claims:audit-evidence:full"], /--reference-scope full/);
});
