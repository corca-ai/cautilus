import assert from "node:assert/strict";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";

import {
	buildSurfaceCritiquePacket,
	CLI_AGENT_PRODUCT_RULE_FAMILIES,
	RELEASE_PACKAGING_RULE_FAMILIES,
	renderPacketMarkdown,
	SUPPORTED_SURFACE_IDS,
	SURFACE_CRITIQUE_PACKET_SCHEMA,
} from "./prepare-surface-critique-packet.mjs";

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
	assert.deepEqual(packet.coverage, {
		surface_id: "release-packaging",
		rule_families: [...RELEASE_PACKAGING_RULE_FAMILIES],
	});
	assert.deepEqual(packet.releaseControlDocs, [
		"docs/maintainers/release-boundary.md",
		"docs/maintainers/releasing.md",
	]);
	const marketplace = packet.roleMatrix.find((entry) => entry.pathPattern === ".agents/plugins/marketplace.json");
	assert(marketplace);
	assert(marketplace.roles.includes("release:audit-only"));
	assert.equal(marketplace.roles.includes("release:prepare-rewrite"), false);
});

test("markdown render exposes scope and covered rule families so `ready` cannot be read as global", () => {
	const packet = buildSurfaceCritiquePacket({ repoRoot: REPO_ROOT });
	const md = renderPacketMarkdown(packet);
	assert.match(md, /# Surface Critique Packet — release-packaging/);
	assert.match(md, /\*\*Scope:\*\*/);
	assert.match(md, /does \*\*not\*\* imply that other repo surfaces are clean/);
	assert.match(md, /Surface ID: `release-packaging`/);
	for (const family of RELEASE_PACKAGING_RULE_FAMILIES) {
		assert(md.includes(`\`${family}\``), `markdown render must list rule family ${family}`);
	}
	assert.match(md, /Status: `ready`/);
	assert.match(md, /_No findings in covered rule families\._/);
});

test("markdown render lists findings with severity, id, path, and message when present", () => {
	const root = mkdtempSync(join(tmpdir(), "cautilus-surface-packet-md-"));
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
		const md = renderPacketMarkdown(packet);
		assert.match(md, /Status: `blocked`/);
		assert.match(md, /## Findings \(\d+\)/);
		assert.match(md, /\*\*\[high\]\*\* `release_control_doc_not_in_surface`/);
	} finally {
		rmSync(root, { recursive: true, force: true });
	}
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

test("dispatcher rejects unknown surface ids and lists supported ones", () => {
	assert.throws(
		() => buildSurfaceCritiquePacket({ repoRoot: REPO_ROOT, surfaceId: "nonexistent-surface" }),
		(error) => {
			assert(error instanceof Error);
			assert.match(error.message, /No rule bundle declared for surface id: nonexistent-surface/);
			for (const id of SUPPORTED_SURFACE_IDS) {
				assert(error.message.includes(id), `error message should list supported surface ${id}`);
			}
			return true;
		},
	);
});

function writeCliAgentRepo(root, { sourceFiles, packagedFiles }) {
	writeFile(
		root,
		".agents/surfaces.json",
		`${JSON.stringify(
			{
				version: 1,
				surfaces: [
					{
						surface_id: "cli-agent-product",
						source_paths: ["skills/cautilus-agent/**"],
						derived_paths: ["plugins/cautilus/skills/cautilus-agent/**"],
					},
				],
			},
			null,
			2,
		)}\n`,
	);
	for (const [relPath, content] of sourceFiles) {
		writeFile(root, `skills/cautilus-agent/${relPath}`, content);
	}
	for (const [relPath, content] of packagedFiles) {
		writeFile(root, `plugins/cautilus/skills/cautilus-agent/${relPath}`, content);
	}
}

test("cli-agent-product packet is ready when source and packaged skill trees have parity", () => {
	const root = mkdtempSync(join(tmpdir(), "cautilus-cli-agent-packet-"));
	try {
		writeCliAgentRepo(root, {
			sourceFiles: [
				["SKILL.md", "# Skill\n"],
				["references/a.md", "a\n"],
			],
			packagedFiles: [
				["SKILL.md", "# Skill\n"],
				["references/a.md", "a\n"],
			],
		});
		const packet = buildSurfaceCritiquePacket({ repoRoot: root, surfaceId: "cli-agent-product" });
		assert.equal(packet.surfaceId, "cli-agent-product");
		assert.deepEqual(packet.coverage, {
			surface_id: "cli-agent-product",
			rule_families: [...CLI_AGENT_PRODUCT_RULE_FAMILIES],
		});
		assert.equal(packet.status, "ready");
		assert.deepEqual(packet.findings, []);
		assert.equal(packet.sourceFileCount, 2);
		assert.equal(packet.packagedFileCount, 2);
	} finally {
		rmSync(root, { recursive: true, force: true });
	}
});

test("cli-agent-product packet flags files present in source but missing from packaged tree", () => {
	const root = mkdtempSync(join(tmpdir(), "cautilus-cli-agent-packet-"));
	try {
		writeCliAgentRepo(root, {
			sourceFiles: [
				["SKILL.md", "# Skill\n"],
				["references/added.md", "new\n"],
			],
			packagedFiles: [
				["SKILL.md", "# Skill\n"],
			],
		});
		const packet = buildSurfaceCritiquePacket({ repoRoot: root, surfaceId: "cli-agent-product" });
		assert.equal(packet.status, "blocked");
		const missing = packet.findings.find((finding) => finding.path === "plugins/cautilus/skills/cautilus-agent/references/added.md");
		assert(missing, "expected packaged-side missing finding");
		assert.equal(missing.id, "packaged_skill_tree_parity");
		assert.match(missing.message, /run `npm run skills:sync-packaged`/);
	} finally {
		rmSync(root, { recursive: true, force: true });
	}
});

test("cli-agent-product packet flags files present in packaged but missing from source tree", () => {
	const root = mkdtempSync(join(tmpdir(), "cautilus-cli-agent-packet-"));
	try {
		writeCliAgentRepo(root, {
			sourceFiles: [
				["SKILL.md", "# Skill\n"],
			],
			packagedFiles: [
				["SKILL.md", "# Skill\n"],
				["references/stale.md", "stale\n"],
			],
		});
		const packet = buildSurfaceCritiquePacket({ repoRoot: root, surfaceId: "cli-agent-product" });
		assert.equal(packet.status, "blocked");
		const orphan = packet.findings.find((finding) => finding.path === "plugins/cautilus/skills/cautilus-agent/references/stale.md");
		assert(orphan, "expected source-side orphan finding");
		assert.equal(orphan.id, "packaged_skill_tree_parity");
		assert.match(orphan.message, /has no source counterpart/);
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
