import assert from "node:assert/strict";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { spawnSync } from "node:child_process";
import test from "node:test";

import { binaryAssetName, renderBinaryAssetUrl } from "./binary-assets.mjs";
import { renderArchiveUrl } from "./fetch-github-archive-sha256.mjs";
import { renderHomebrewFormula } from "./render-homebrew-formula.mjs";
import { deriveTapRepo, parseGitHubRemoteUrl, resolveReleaseTargets } from "./resolve-release-targets.mjs";

const REPO_ROOT = process.cwd();
const PACKAGE_VERSION = JSON.parse(readFileSync(join(REPO_ROOT, "package.json"), "utf-8")).version;

function readTree(root) {
	const entries = [];
	function visit(current, relative = "") {
		for (const entry of readdirSync(current, { withFileTypes: true })) {
			const entryRelative = relative ? join(relative, entry.name) : entry.name;
			const fullPath = join(current, entry.name);
			if (entry.isDirectory()) {
				visit(fullPath, entryRelative);
				continue;
			}
			entries.push({
				path: entryRelative,
				content: readFileSync(fullPath, "utf-8"),
			});
		}
	}
	visit(root);
	return entries.sort((a, b) => a.path.localeCompare(b.path));
}

test("cautilus --version matches package.json", () => {
	const pkg = JSON.parse(readFileSync(join(REPO_ROOT, "package.json"), "utf-8"));
	const result = spawnSync(join(REPO_ROOT, "bin", "cautilus"), ["--version"], {
		cwd: REPO_ROOT,
		encoding: "utf-8",
	});
	assert.equal(result.status, 0, result.stderr);
	assert.equal(result.stdout.trim(), pkg.version);
});

test("package metadata does not claim an npm bin install surface", () => {
	const pkg = JSON.parse(readFileSync(join(REPO_ROOT, "package.json"), "utf-8"));
	assert.equal("bin" in pkg, false);
});

test("repo root exposes an official self-consumer adapter and doctor returns ready", () => {
	const result = spawnSync(join(REPO_ROOT, "bin", "cautilus"), ["doctor", "--repo-root", REPO_ROOT], {
		cwd: REPO_ROOT,
		encoding: "utf-8",
	});
	assert.equal(result.status, 0, result.stderr);
	const payload = JSON.parse(result.stdout);
	assert.equal(payload.ready, true);
	assert.equal(payload.status, "ready");
	assert.equal(payload.adapter_path, join(REPO_ROOT, ".agents", "cautilus-adapter.yaml"));
});

test("install.sh remains syntactically valid shell", () => {
	const result = spawnSync("bash", ["-n", join(REPO_ROOT, "install.sh")], {
		cwd: REPO_ROOT,
		encoding: "utf-8",
	});
	assert.equal(result.status, 0, result.stderr);
});

test("install.sh downloads a tagged binary asset and writes a wrapper that preserves caller context", () => {
	const installer = readFileSync(join(REPO_ROOT, "install.sh"), "utf-8");
	assert.match(installer, /need_cmd uname/);
	assert.doesNotMatch(installer, /need_cmd node/);
	assert.doesNotMatch(installer, /npm install --omit=dev/);
	assert.doesNotMatch(installer, /go build -o "\$TARGET_DIR\/bin\/cautilus-real"/);
	assert.match(installer, /ASSET_NAME="cautilus_\$\{VERSION_TRIMMED\}_\$\{ASSET_OS\}_\$\{ASSET_ARCH\}\.tar\.gz"/);
	assert.match(installer, /releases\/download\/\$VERSION\/\$ASSET_NAME/);
	assert.match(installer, /releases\/download\/\$VERSION\/cautilus-\$VERSION-checksums\.txt/);
	assert.match(installer, /path = \$2/);
	assert.match(installer, /if \(path == asset\)/);
	assert.match(installer, /sha256sum "\$1" \| awk '\{print \$1\}'/);
	assert.match(installer, /shasum -a 256 "\$1" \| awk '\{print \$1\}'/);
	assert.match(installer, /Checksum mismatch for %s/);
	assert.match(installer, /mv "\$TARGET_DIR\/bin\/cautilus" "\$TARGET_DIR\/bin\/cautilus-real"/);
	assert.match(installer, /CAUTILUS_CALLER_CWD="\\\$\(pwd\)"/);
	assert.match(installer, /exec "\$TARGET_DIR\/bin\/cautilus-real" "\\\$@"/);
});

test("release workflow attaches provenance attestations for the public binary matrix", () => {
	const workflow = readFileSync(join(REPO_ROOT, ".github", "workflows", "release-artifacts.yml"), "utf-8");
	assert.match(workflow, /id-token: write/);
	assert.match(workflow, /attestations: write/);
	assert.match(workflow, /artifact-metadata: write/);
	assert.match(workflow, /uses: actions\/attest@v4/);
	assert.match(workflow, /subject-checksums: dist\/cautilus-\$\{\{ github\.ref_name \}\}-checksums\.txt/);
});

test("dead runtime compatibility shims stay deleted", () => {
	assert.equal(existsSync(join(REPO_ROOT, "scripts", "install-skills.mjs")), false);
	assert.equal(existsSync(join(REPO_ROOT, "scripts", "cli-registry.mjs")), false);
});

test("homebrew formula renderer produces a stable formula body", () => {
	const formula = renderHomebrewFormula({
		version: `v${PACKAGE_VERSION}`,
		repo: "corca-ai/cautilus",
		sha256: "abc123",
	});
	assert.match(formula, /class Cautilus < Formula/);
	assert.match(formula, new RegExp(`https://github.com/corca-ai/cautilus/archive/refs/tags/v${PACKAGE_VERSION}\\.tar\\.gz`));
	assert.match(formula, /sha256 "abc123"/);
	assert.match(formula, /depends_on "go" => :build/);
	assert.doesNotMatch(formula, /depends_on "node"/);
	assert.match(formula, /system "go", "build"/);
	assert.match(formula, /cautilus --version/);
});

test("github archive URL renderer targets tagged source archives", () => {
	assert.equal(
		renderArchiveUrl({ repo: "corca-ai/cautilus", version: `v${PACKAGE_VERSION}` }),
		`https://github.com/corca-ai/cautilus/archive/refs/tags/v${PACKAGE_VERSION}.tar.gz`,
	);
});

test("binary release asset helpers target tagged GitHub release assets", () => {
	assert.equal(
		binaryAssetName({ version: `v${PACKAGE_VERSION}`, goos: "linux", goarch: "amd64" }),
		`cautilus_${PACKAGE_VERSION}_linux_x64.tar.gz`,
	);
	assert.equal(
		renderBinaryAssetUrl({ repo: "corca-ai/cautilus", version: `v${PACKAGE_VERSION}`, goos: "darwin", goarch: "arm64" }),
		`https://github.com/corca-ai/cautilus/releases/download/v${PACKAGE_VERSION}/cautilus_${PACKAGE_VERSION}_darwin_arm64.tar.gz`,
	);
});

test("release target helpers parse the current GitHub remote and derive the default tap repo", () => {
	assert.deepEqual(parseGitHubRemoteUrl("https://github.com/corca-ai/cautilus"), {
		owner: "corca-ai",
		repo: "cautilus",
	});
	assert.deepEqual(parseGitHubRemoteUrl("git@github.com:corca-ai/cautilus.git"), {
		owner: "corca-ai",
		repo: "cautilus",
	});
	assert.equal(deriveTapRepo("corca-ai/cautilus"), "corca-ai/homebrew-tap");
	assert.deepEqual(resolveReleaseTargets({ remoteUrl: "https://github.com/corca-ai/cautilus" }), {
		sourceRepo: "corca-ai/cautilus",
		tapRepo: "corca-ai/homebrew-tap",
	});
});

test("repo marketplace points Codex at the packaged cautilus plugin subtree", () => {
	const marketplace = JSON.parse(
		readFileSync(join(REPO_ROOT, ".agents", "plugins", "marketplace.json"), "utf-8"),
	);
	assert.equal(marketplace.plugins[0].name, "cautilus");
	assert.equal(marketplace.plugins[0].source.source, "local");
	assert.equal(marketplace.plugins[0].source.path, "./plugins/cautilus");
});

test("repo marketplace points Claude at the packaged cautilus plugin subtree", () => {
	const marketplace = JSON.parse(
		readFileSync(join(REPO_ROOT, ".claude-plugin", "marketplace.json"), "utf-8"),
	);
	assert.equal(marketplace.plugins[0].name, "cautilus");
	assert.equal(marketplace.plugins[0].source, "./plugins/cautilus");
	assert.equal(marketplace.plugins[0].version, PACKAGE_VERSION);
});

test("packaged cautilus plugin manifest points at its bundled skills directory", () => {
	const manifest = JSON.parse(
		readFileSync(join(REPO_ROOT, "plugins", "cautilus", ".codex-plugin", "plugin.json"), "utf-8"),
	);
	assert.equal(manifest.name, "cautilus");
	assert.equal(manifest.skills, "./skills/");
});

test("packaged cautilus Claude plugin manifest carries stable product metadata", () => {
	const manifest = JSON.parse(
		readFileSync(join(REPO_ROOT, "plugins", "cautilus", ".claude-plugin", "plugin.json"), "utf-8"),
	);
	assert.equal(manifest.name, "cautilus");
	assert.equal(manifest.version, PACKAGE_VERSION);
	assert.equal(manifest.repository, "https://github.com/corca-ai/cautilus");
});

test("packaged cautilus skill stays in sync with the repo-bundled skill source", () => {
	const repoTree = readTree(join(REPO_ROOT, "skills", "cautilus"));
	const packagedTree = readTree(
		join(REPO_ROOT, "plugins", "cautilus", "skills", "cautilus"),
	);
	assert.deepEqual(packagedTree, repoTree);
});
