import assert from "node:assert/strict";
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { spawnSync } from "node:child_process";
import test from "node:test";

const SCRIPT = join(process.cwd(), "scripts", "check-placeholder-drift.mjs");

function setupFakeRepo(goBody, contractBody) {
	const root = mkdtempSync(join(tmpdir(), "check-placeholder-drift-"));
	mkdirSync(join(root, "internal", "app"), { recursive: true });
	mkdirSync(join(root, "docs", "contracts"), { recursive: true });
	mkdirSync(join(root, "scripts"), { recursive: true });
	writeFileSync(join(root, "internal", "app", "remaining_commands.go"), goBody);
	writeFileSync(join(root, "docs", "contracts", "skill-testing.md"), contractBody);
	writeFileSync(join(root, "scripts", "check-placeholder-drift.mjs"), "");
	return root;
}

function runAt(cwd) {
	return spawnSync("node", [SCRIPT], { cwd, encoding: "utf-8" });
}

test("passes when every placeholder in go replacements map is in contract doc", () => {
	const goBody = [
		"func runEvalTestPipeline() {",
		"    replacements := map[string]string{",
		'        "candidate_repo":     foo,',
		'        "backend":            bar,',
		'        "eval_observed_file": baz,',
		"    }",
		"}",
		"",
	].join("\n");
	const contractBody = "Supported placeholders include `{candidate_repo}`, `{backend}`, and `{eval_observed_file}`.\n";
	const root = setupFakeRepo(goBody, contractBody);
	try {
		const result = runAt(root);
		assert.equal(result.status, 0, result.stderr);
		assert.match(result.stdout, /ok/);
	} finally {
		rmSync(root, { recursive: true, force: true });
	}
});

test("fails when a placeholder is missing from the contract doc", () => {
	const goBody = [
		"func runEvalTestPipeline() {",
		"    replacements := map[string]string{",
		'        "candidate_repo":     foo,',
		'        "new_placeholder":    bar,',
		'        "eval_observed_file": baz,',
		"    }",
		"}",
		"",
	].join("\n");
	const contractBody = "Only `{candidate_repo}` and `{eval_observed_file}` are mentioned here.\n";
	const root = setupFakeRepo(goBody, contractBody);
	try {
		const result = runAt(root);
		assert.equal(result.status, 1);
		assert.match(result.stderr, /\{new_placeholder\}/);
		assert.match(result.stderr, /skill-testing\.md/);
	} finally {
		rmSync(root, { recursive: true, force: true });
	}
});
