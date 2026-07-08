import assert from "node:assert/strict";
import { mkdtempSync, mkdirSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";

import { checkReleasePublisherPolicy, main, parseArgs } from "./check-release-publisher-policy.mjs";

function writeFixtureRepo({ omitReviewCommand = false, omitPostPublishReadback = false, omitReleaseBoundaryText = false } = {}) {
	const root = mkdtempSync(join(tmpdir(), "cautilus-release-policy-"));
	mkdirSync(join(root, ".agents"), { recursive: true });
	mkdirSync(join(root, "docs", "maintainers"), { recursive: true });
	writeFileSync(
		join(root, "package.json"),
		JSON.stringify(
			{
				scripts: {
					"release:prepare": "node scripts/release/prepare-release.mjs",
					"release:publish": "node scripts/release/publish-release.mjs",
					"release:publisher-policy:check": "node scripts/release/check-release-publisher-policy.mjs",
					"release:smoke-install:current": "node scripts/release/run-install-smoke-current.mjs",
				},
			},
			null,
			2,
		),
	);
	writeFileSync(
		join(root, ".agents", "release-adapter.yaml"),
		[
			"requested_review_commands:",
			"  - \"npm run critique:surface-packet:check\"",
			"  - \"npm run security:secrets:history\"",
			omitReviewCommand ? "" : "  - \"npm run release:publisher-policy:check\"",
			omitPostPublishReadback ? "" : "post_publish_install_refresh: \"npm run release:smoke-install:current -- --skip-update\"",
			"",
		].join("\n"),
	);
	writeFileSync(
		join(root, "docs", "maintainers", "release-boundary.md"),
		omitReleaseBoundaryText
			? "stale release boundary\n"
			: [
				"Do not cut this repo's releases with the generic charness `release` skill publisher.",
				"the repo-owned scripts above are the only supported path.",
				"requested review commands",
				"post-publish install smoke readback",
				"",
			].join("\n"),
	);
	writeFileSync(
		join(root, "docs", "maintainers", "releasing.md"),
		[
			"npm run security:secrets:history",
			"npm run release:publisher-policy:check",
			"npm run release:publish -- --version <next-version>",
			"npm run release:smoke-install:current -- --skip-update",
			"",
		].join("\n"),
	);
	return root;
}

test("checkReleasePublisherPolicy accepts the repo-owned release publisher gate", () => {
	const root = writeFixtureRepo();
	const result = checkReleasePublisherPolicy(root);
	assert.deepEqual(result, {
		ok: true,
		findings: [],
	});
});

test("checkReleasePublisherPolicy rejects a missing requested review command", () => {
	const root = writeFixtureRepo({ omitReviewCommand: true });
	const result = checkReleasePublisherPolicy(root);
	assert.equal(result.ok, false);
	assert.equal(result.findings[0].code, "missing_requested_review_command");
});

test("checkReleasePublisherPolicy rejects a missing post-publish readback", () => {
	const root = writeFixtureRepo({ omitPostPublishReadback: true });
	const result = checkReleasePublisherPolicy(root);
	assert.equal(result.ok, false);
	assert.equal(result.findings[0].code, "missing_post_publish_install_refresh");
});

test("checkReleasePublisherPolicy rejects missing release boundary policy text", () => {
	const root = writeFixtureRepo({ omitReleaseBoundaryText: true });
	const result = checkReleasePublisherPolicy(root);
	assert.equal(result.ok, false);
	assert.ok(result.findings.some((finding) => finding.code === "release_boundary_missing_policy_text"));
});

test("parseArgs reads repo root and json flags", () => {
	const options = parseArgs(["--repo-root", ".", "--json"]);
	assert.equal(options.repoRoot, process.cwd());
	assert.equal(options.json, true);
});

test("parseArgs rejects unknown flags and missing values", () => {
	assert.throws(() => parseArgs(["--repo-root"]), /--repo-root requires a value/);
	assert.throws(() => parseArgs(["--wat"]), /Unknown argument: --wat/);
});

test("checkReleasePublisherPolicy reports missing scripts and docs", () => {
	const root = writeFixtureRepo();
	writeFileSync(join(root, "package.json"), JSON.stringify({ scripts: {} }, null, 2));
	writeFileSync(join(root, "docs", "maintainers", "releasing.md"), "stale\n");
	const result = checkReleasePublisherPolicy(root);
	assert.equal(result.ok, false);
	assert.ok(result.findings.some((finding) => finding.code === "missing_package_script"));
	assert.ok(result.findings.some((finding) => finding.code === "releasing_guide_missing_policy_text"));
});

test("main prints json for a clean release publisher policy", async () => {
	const root = writeFixtureRepo();
	const writes = [];
	const originalWrite = process.stdout.write;
	process.stdout.write = (chunk) => {
		writes.push(String(chunk));
		return true;
	};
	try {
		await main(["--repo-root", root, "--json"]);
	} finally {
		process.stdout.write = originalWrite;
	}
	assert.match(writes.join(""), /"ok": true/);
});
