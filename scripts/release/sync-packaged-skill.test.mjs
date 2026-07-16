import assert from "node:assert/strict";
import { mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";

import { checkPackagedSkillInSync, main, syncPackagedSkill } from "./sync-packaged-skill.mjs";

function seedSkillTree(root) {
	const sourceDir = join(root, "skills", "cautilus-agent");
	const destinationDir = join(root, "plugins", "cautilus", "skills", "cautilus-agent");
	mkdirSync(join(sourceDir, "references"), { recursive: true });
	mkdirSync(join(sourceDir, "agents"), { recursive: true });
	writeFileSync(join(sourceDir, "SKILL.md"), "# source skill\n", "utf-8");
	// An upward link is what the sync rewrites; the parity check must notice
	// when the packaged copy skips that rewrite.
	writeFileSync(
		join(sourceDir, "references", "evaluation-process.md"),
		"see [helper](../../../scripts/agent-runtime/active-run.mjs)\n",
		"utf-8",
	);
	// A non-markdown file with a link-shaped string that the sync must copy
	// verbatim (no rewrite). Guards the else-branch of expectedPackagedContent.
	writeFileSync(
		join(sourceDir, "agents", "openai.yaml"),
		"note: ../../../scripts/agent-runtime/active-run.mjs\n",
		"utf-8",
	);
	return { sourceDir, destinationDir };
}

test("syncPackagedSkill replaces the packaged skill tree with the bundled source", () => {
	const root = mkdtempSync(join(tmpdir(), "cautilus-sync-packaged-"));
	const sourceDir = join(root, "skills", "cautilus-agent");
	const destinationDir = join(root, "plugins", "cautilus", "skills", "cautilus-agent");

	mkdirSync(join(sourceDir, "references"), { recursive: true });
	mkdirSync(destinationDir, { recursive: true });
	writeFileSync(join(sourceDir, "SKILL.md"), "# source skill\n", "utf-8");
	writeFileSync(join(sourceDir, "references", "evaluation-process.md"), "source evaluation-process\n", "utf-8");
	writeFileSync(join(destinationDir, "SKILL.md"), "# stale skill\n", "utf-8");
	writeFileSync(join(destinationDir, "stale.md"), "remove me\n", "utf-8");

	const result = syncPackagedSkill({ repoRoot: root, sourceDir, destinationDir });

	assert.equal(result.sourceDir, sourceDir);
	assert.equal(result.destinationDir, destinationDir);
	assert.equal(readFileSync(join(destinationDir, "SKILL.md"), "utf-8"), "# source skill\n");
	assert.equal(readFileSync(join(destinationDir, "references", "evaluation-process.md"), "utf-8"), "source evaluation-process\n");
	assert.throws(() => readFileSync(join(destinationDir, "stale.md"), "utf-8"));
});

test("checkPackagedSkillInSync reports in-sync after a real sync", () => {
	const root = mkdtempSync(join(tmpdir(), "cautilus-sync-check-"));
	const { sourceDir, destinationDir } = seedSkillTree(root);

	syncPackagedSkill({ repoRoot: root, sourceDir, destinationDir });

	const result = checkPackagedSkillInSync({ repoRoot: root, sourceDir, destinationDir });
	assert.equal(result.inSync, true);
	assert.deepEqual(result.drifted, []);
	assert.deepEqual(result.missing, []);
	assert.deepEqual(result.extra, []);
});

test("checkPackagedSkillInSync catches a reference copied without the upward-link rewrite", () => {
	const root = mkdtempSync(join(tmpdir(), "cautilus-sync-check-"));
	const { sourceDir, destinationDir } = seedSkillTree(root);
	syncPackagedSkill({ repoRoot: root, sourceDir, destinationDir });

	// Simulate a stale mirror: copy the source reference verbatim, skipping the
	// upward-link rewrite that only the sync applies. The SKILL.md-only parity
	// check would miss this; the tree parity check must not.
	const sourceReference = readFileSync(join(sourceDir, "references", "evaluation-process.md"), "utf-8");
	writeFileSync(join(destinationDir, "references", "evaluation-process.md"), sourceReference, "utf-8");

	const result = checkPackagedSkillInSync({ repoRoot: root, sourceDir, destinationDir });
	assert.equal(result.inSync, false);
	assert.deepEqual(result.drifted, [join("references", "evaluation-process.md")]);
});

test("checkPackagedSkillInSync flags missing and extra packaged files", () => {
	const root = mkdtempSync(join(tmpdir(), "cautilus-sync-check-"));
	const { sourceDir, destinationDir } = seedSkillTree(root);
	syncPackagedSkill({ repoRoot: root, sourceDir, destinationDir });

	rmSync(join(destinationDir, "references", "evaluation-process.md"));
	writeFileSync(join(destinationDir, "orphan.md"), "not in source\n", "utf-8");

	const result = checkPackagedSkillInSync({ repoRoot: root, sourceDir, destinationDir });
	assert.equal(result.inSync, false);
	assert.deepEqual(result.missing, [join("references", "evaluation-process.md")]);
	assert.deepEqual(result.extra, ["orphan.md"]);
});

test("checkPackagedSkillInSync keeps non-markdown files verbatim and flags a rewritten one", () => {
	const root = mkdtempSync(join(tmpdir(), "cautilus-sync-check-"));
	const { sourceDir, destinationDir } = seedSkillTree(root);
	syncPackagedSkill({ repoRoot: root, sourceDir, destinationDir });

	// The YAML copies verbatim, so the mirror is in sync right after the copy.
	const clean = checkPackagedSkillInSync({ repoRoot: root, sourceDir, destinationDir });
	assert.equal(clean.inSync, true);

	// If someone re-based the link inside the non-markdown file, it no longer
	// matches the verbatim source and must be reported as drift.
	writeFileSync(
		join(destinationDir, "agents", "openai.yaml"),
		"note: ../../../../../scripts/agent-runtime/active-run.mjs\n",
		"utf-8",
	);
	const drifted = checkPackagedSkillInSync({ repoRoot: root, sourceDir, destinationDir });
	assert.equal(drifted.inSync, false);
	assert.deepEqual(drifted.drifted, [join("agents", "openai.yaml")]);
});

test("checkPackagedSkillInSync reports the whole source set missing when the package is absent", () => {
	const root = mkdtempSync(join(tmpdir(), "cautilus-sync-check-"));
	const { sourceDir, destinationDir } = seedSkillTree(root);

	const result = checkPackagedSkillInSync({ repoRoot: root, sourceDir, destinationDir });
	assert.equal(result.inSync, false);
	assert.deepEqual(result.missing.sort(), [
		"SKILL.md",
		join("agents", "openai.yaml"),
		join("references", "evaluation-process.md"),
	].sort());
});

test("checkPackagedSkillInSync validates its inputs", () => {
	assert.throws(() => checkPackagedSkillInSync({}), /repoRoot is required/);
	const root = mkdtempSync(join(tmpdir(), "cautilus-sync-check-"));
	assert.throws(
		() => checkPackagedSkillInSync({ repoRoot: root }),
		/Bundled skill source not found/,
	);
});

test("main --check returns 0 when in sync and 1 on drift", () => {
	const root = mkdtempSync(join(tmpdir(), "cautilus-sync-main-"));
	const { sourceDir, destinationDir } = seedSkillTree(root);
	syncPackagedSkill({ repoRoot: root, sourceDir, destinationDir });

	const sink = () => {
		let text = "";
		return { write: (chunk) => { text += chunk; }, get text() { return text; } };
	};

	const okOut = sink();
	assert.equal(main([root, "--check"], { stdout: okOut, stderr: sink() }), 0);
	assert.match(okOut.text, /"status": "in-sync"/);

	writeFileSync(join(destinationDir, "references", "evaluation-process.md"), "tampered\n", "utf-8");
	const failErr = sink();
	assert.equal(main([root, "--check"], { stdout: sink(), stderr: failErr }), 1);
	assert.match(failErr.text, /out of sync/);
	assert.match(failErr.text, /drifted: references\/evaluation-process\.md/);
});

test("main without --check writes the freshly synced tree and returns 0", () => {
	const root = mkdtempSync(join(tmpdir(), "cautilus-sync-main-"));
	const { destinationDir } = seedSkillTree(root);

	const out = { text: "", write(chunk) { this.text += chunk; } };
	assert.equal(main([root], { stdout: out, stderr: { write() {} } }), 0);
	// The default sync writes the real package path under the temp repo root.
	assert.match(out.text, /"destinationDir"/);
	assert.equal(
		readFileSync(join(destinationDir, "SKILL.md"), "utf-8"),
		"# source skill\n",
	);
});
