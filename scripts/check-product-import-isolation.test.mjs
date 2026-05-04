import assert from "node:assert/strict";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { spawnSync } from "node:child_process";
import test from "node:test";

import { extractImports, checkProductImportIsolation } from "./check-product-import-isolation.mjs";

const SCRIPT_PATH = join(process.cwd(), "scripts", "check-product-import-isolation.mjs");

function writeFile(root, relativePath, content) {
	const fullPath = join(root, relativePath);
	mkdirSync(join(fullPath, ".."), { recursive: true });
	writeFileSync(fullPath, content, "utf-8");
}

function withTempRepo(label, fn) {
	const root = mkdtempSync(join(tmpdir(), `cautilus-check-product-import-isolation-${label}-`));
	try {
		fn(root);
	} finally {
		rmSync(root, { recursive: true, force: true });
	}
}

function runScript(root) {
	return spawnSync("node", [SCRIPT_PATH], { cwd: root, encoding: "utf-8" });
}

test("extractImports parses block, single, aliased, and underscore forms", () => {
	const source = [
		"package main",
		"",
		'import "fmt"',
		'import yamlv3 "gopkg.in/yaml.v3"',
		"",
		"import (",
		'\t"context"',
		'\t_ "embed"',
		'\tfoo "github.com/corca-ai/cautilus/internal/runtime"',
		"",
		'\t// commented out import',
		'\t// "should/not/appear"',
		'\t"net/http" // trailing comment',
		")",
		"",
	].join("\n");
	const imports = extractImports(source);
	assert.deepEqual(imports, [
		"fmt",
		"gopkg.in/yaml.v3",
		"context",
		"embed",
		"github.com/corca-ai/cautilus/internal/runtime",
		"net/http",
	]);
});

test("passes when product code only uses stdlib, internal, and allowed third-party imports", () => {
	withTempRepo("pass", (root) => {
		writeFile(
			root,
			"cmd/cautilus/main.go",
			[
				"package main",
				"",
				"import (",
				'\t"os"',
				"",
				'\t"github.com/corca-ai/cautilus/internal/app"',
				")",
				"",
				"func main() { os.Exit(app.Run(os.Args[1:], os.Stdout, os.Stderr)) }",
				"",
			].join("\n"),
		);
		writeFile(
			root,
			"internal/runtime/yaml_loader.go",
			[
				"package runtime",
				"",
				'import "gopkg.in/yaml.v3"',
				"",
				"var _ = yaml.Marshal",
				"",
			].join("\n"),
		);
		const result = runScript(root);
		assert.equal(result.status, 0, result.stderr);
		const payload = JSON.parse(result.stdout);
		assert.equal(payload.status, "ok");
		assert.deepEqual(payload.thirdPartyImports, ["gopkg.in/yaml.v3"]);
	});
});

test("fails when product code imports an LLM provider SDK", () => {
	withTempRepo("fail-provider-sdk", (root) => {
		writeFile(
			root,
			"internal/runtime/llm_call.go",
			[
				"package runtime",
				"",
				"import (",
				'\t"context"',
				"",
				'\t"github.com/anthropics/anthropic-sdk-go"',
				")",
				"",
				"var _ = context.TODO",
				"var _ = anthropic.NewClient",
				"",
			].join("\n"),
		);
		const result = runScript(root);
		assert.equal(result.status, 1);
		assert.match(
			result.stderr,
			/third-party import not in allowlist: github\.com\/anthropics\/anthropic-sdk-go/,
		);
	});
});

test("fails when product code imports a host-specific module", () => {
	withTempRepo("fail-host-import", (root) => {
		writeFile(
			root,
			"internal/runtime/charness_bridge.go",
			[
				"package runtime",
				"",
				'import "github.com/corca-ai/charness/skills"',
				"",
				"var _ = skills.Discover",
				"",
			].join("\n"),
		);
		const result = runScript(root);
		assert.equal(result.status, 1);
		assert.match(
			result.stderr,
			/third-party import not in allowlist: github\.com\/corca-ai\/charness\/skills/,
		);
	});
});

test("fails when product code embeds a forbidden LLM provider host string", () => {
	withTempRepo("fail-provider-host", (root) => {
		writeFile(
			root,
			"internal/runtime/raw_http.go",
			[
				"package runtime",
				"",
				'import "net/http"',
				"",
				'var endpoint = "https://api.anthropic.com/v1/messages"',
				"var _ = http.NewRequest",
				"",
			].join("\n"),
		);
		const result = runScript(root);
		assert.equal(result.status, 1);
		assert.match(result.stderr, /forbidden LLM provider host: api\.anthropic\.com/);
	});
});

test("ignores _test.go files so test fixtures may import anything", () => {
	withTempRepo("ignore-tests", (root) => {
		writeFile(
			root,
			"internal/runtime/runtime_test.go",
			[
				"package runtime",
				"",
				'import "github.com/anthropics/anthropic-sdk-go"',
				"",
				"var _ = anthropic.NewClient",
				"",
			].join("\n"),
		);
		const result = runScript(root);
		assert.equal(result.status, 0, result.stderr);
	});
});

test("checkProductImportIsolation can run programmatically against a custom repo root", () => {
	withTempRepo("api", (root) => {
		writeFile(
			root,
			"cmd/cautilus/main.go",
			[
				"package main",
				"",
				'import "os"',
				"",
				"func main() { _ = os.Args }",
				"",
			].join("\n"),
		);
		const result = checkProductImportIsolation({ repoRoot: root });
		assert.equal(result.problems.length, 0);
		assert.equal(result.inspectedFileCount, 1);
		assert.deepEqual(result.thirdPartyImports, []);
	});
});
