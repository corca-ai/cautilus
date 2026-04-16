import assert from "node:assert/strict";
import { existsSync, lstatSync, readFileSync, rmSync } from "node:fs";
import { join, resolve } from "node:path";
import test from "node:test";

import { runExternalConsumerOnboardingSmoke } from "./smoke-external-consumer.mjs";

test("external consumer onboarding smoke bootstraps a repo to doctor-ready", async () => {
	const repoRoot = resolve(process.cwd(), "bin", "cautilus");
	const result = await runExternalConsumerOnboardingSmoke({
		cautilusBin: repoRoot,
		keepWorkdir: true,
	});
	try {
		assert.equal(result.ok, true);
		assert.equal(result.ready, true);
		assert.ok(existsSync(result.adapterPath));
		assert.ok(existsSync(join(result.agentSkillRoot, "SKILL.md")));
		assert.ok(lstatSync(result.claudeSkillLink).isSymbolicLink());
		assert.match(readFileSync(result.adapterPath, "utf-8"), /version: 1/);
		assert.match(readFileSync(result.adapterPath, "utf-8"), /held_out_command_templates:/);
		assert.match(readFileSync(result.adapterPath, "utf-8"), /external consumer smoke ok/);
		assert.equal(result.commands.some((entry) => /git$/.test(entry.command)), true);
		assert.equal(result.commands.some((entry) => /cautilus$/.test(entry.command)), true);
	} finally {
		rmSync(result.workdir, { recursive: true, force: true });
	}
});
