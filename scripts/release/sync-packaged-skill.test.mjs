import assert from "node:assert/strict";
import { mkdtempSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";

import { syncPackagedSkill } from "./sync-packaged-skill.mjs";

test("syncPackagedSkill replaces the packaged skill tree with the bundled source", () => {
	const root = mkdtempSync(join(tmpdir(), "cautilus-sync-packaged-"));
	const sourceDir = join(root, "skills", "cautilus");
	const destinationDir = join(root, "plugins", "cautilus", "skills", "cautilus");

	mkdirSync(join(sourceDir, "references"), { recursive: true });
	mkdirSync(destinationDir, { recursive: true });
	writeFileSync(join(sourceDir, "SKILL.md"), "# source skill\n", "utf-8");
	writeFileSync(join(sourceDir, "references", "workflow.md"), "source workflow\n", "utf-8");
	writeFileSync(join(destinationDir, "SKILL.md"), "# stale skill\n", "utf-8");
	writeFileSync(join(destinationDir, "stale.md"), "remove me\n", "utf-8");

	const result = syncPackagedSkill({ repoRoot: root, sourceDir, destinationDir });

	assert.equal(result.sourceDir, sourceDir);
	assert.equal(result.destinationDir, destinationDir);
	assert.equal(readFileSync(join(destinationDir, "SKILL.md"), "utf-8"), "# source skill\n");
	assert.equal(readFileSync(join(destinationDir, "references", "workflow.md"), "utf-8"), "source workflow\n");
	assert.throws(() => readFileSync(join(destinationDir, "stale.md"), "utf-8"));
});
