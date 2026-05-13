import assert from "node:assert/strict";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";

import { buildSurfaceCritiquePacket, SURFACE_CRITIQUE_PACKET_SCHEMA } from "./prepare-surface-critique-packet.mjs";

const REPO_ROOT = process.cwd();

function writeFile(root, relativePath, text) {
	const filePath = join(root, relativePath);
	mkdirSync(join(filePath, ".."), { recursive: true });
	writeFileSync(filePath, text, "utf-8");
}

function writeMinimalRepo(root, surfaceSourcePaths) {
	writeFile(
		root,
		".agents/surfaces.json",
		`${JSON.stringify(
			{
				version: 1,
				surfaces: [
					{
						surface_id: "release-packaging",
						source_paths: surfaceSourcePaths,
						derived_paths: [
							".agents/plugins/marketplace.json",
							".claude-plugin/marketplace.json",
							"plugins/cautilus/.claude-plugin/plugin.json",
							"plugins/cautilus/.codex-plugin/plugin.json",
							"plugins/cautilus/skills/cautilus-agent/**",
						],
					},
				],
			},
			null,
			2,
		)}\n`,
	);
	writeFile(root, ".agents/retro-adapter.yaml", "auto_session_trigger_surfaces:\n  - release-packaging\nauto_session_trigger_path_globs: []\n");
	writeFile(root, "docs/maintainers/releasing.md", "- [release-boundary.md](./release-boundary.md) still matches the product-owned surface\n");
	writeFile(root, "docs/maintainers/release-boundary.md", "# Release Boundary\n");
	writeFile(
		root,
		"scripts/retro-surface-trigger-contract.test.mjs",
		[
			'".agents/release-adapter.yaml"',
			'".agents/surfaces.json"',
			'"docs/maintainers/releasing.md"',
			'"install.sh"',
			'"package.json"',
			'"package-lock.json"',
			'"scripts/release/verify-public-release.mjs"',
			'".agents/plugins/marketplace.json"',
			'".claude-plugin/marketplace.json"',
			'"plugins/cautilus/.claude-plugin/plugin.json"',
			'"plugins/cautilus/.codex-plugin/plugin.json"',
			'"plugins/cautilus/skills/cautilus-agent/SKILL.md"',
		].join("\n"),
	);
}

test("current release surface critique packet is ready and separates audit-only marketplace from rewrite metadata", () => {
	const packet = buildSurfaceCritiquePacket({ repoRoot: REPO_ROOT });
	assert.equal(packet.schemaVersion, SURFACE_CRITIQUE_PACKET_SCHEMA);
	assert.equal(packet.status, "ready");
	assert.deepEqual(packet.findings, []);
	assert.deepEqual(packet.releaseControlDocs, [
		"docs/maintainers/release-boundary.md",
		"docs/maintainers/releasing.md",
	]);
	const marketplace = packet.roleMatrix.find((entry) => entry.pathPattern === ".agents/plugins/marketplace.json");
	assert(marketplace);
	assert(marketplace.roles.includes("release:audit-only"));
	assert.equal(marketplace.roles.includes("release:prepare-rewrite"), false);
});

test("packet flags linked release control docs that are missing from the release surface", () => {
	const root = mkdtempSync(join(tmpdir(), "cautilus-surface-packet-"));
	try {
		writeMinimalRepo(root, [
			".agents/release-adapter.yaml",
			".agents/surfaces.json",
			"docs/maintainers/releasing.md",
			"install.sh",
			"package.json",
			"package-lock.json",
			"scripts/release/**",
		]);
		const packet = buildSurfaceCritiquePacket({ repoRoot: root });
		assert.equal(packet.status, "blocked");
		assert(packet.findings.some((finding) => finding.id === "release_control_doc_not_in_surface" && finding.path === "docs/maintainers/release-boundary.md"));
	} finally {
		rmSync(root, { recursive: true, force: true });
	}
});

test("packet flags release surface paths without representative retro trigger cases", () => {
	const root = mkdtempSync(join(tmpdir(), "cautilus-surface-packet-"));
	try {
		writeMinimalRepo(root, [
			".agents/release-adapter.yaml",
			".agents/surfaces.json",
			"docs/maintainers/release-boundary.md",
			"docs/maintainers/releasing.md",
			"install.sh",
			"package.json",
			"package-lock.json",
			"scripts/release/**",
		]);
		writeFile(root, "scripts/retro-surface-trigger-contract.test.mjs", '"package.json"\n');
		const packet = buildSurfaceCritiquePacket({ repoRoot: root });
		assert.equal(packet.status, "needs_attention");
		assert(packet.findings.some((finding) => finding.id === "missing_retro_contract_case" && finding.value === "install.sh"));
	} finally {
		rmSync(root, { recursive: true, force: true });
	}
});
