import assert from "node:assert/strict";
import { existsSync, lstatSync, readFileSync, rmSync } from "node:fs";
import { join, resolve } from "node:path";
import test from "node:test";

import { runExternalConsumerOnboardingSmoke } from "./smoke-external-consumer.mjs";

test("external consumer onboarding smoke bootstraps a repo through the first bounded run", async () => {
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
		assert.ok(existsSync(result.reportPath));
		assert.match(readFileSync(result.adapterPath, "utf-8"), /version: 1/);
		assert.match(readFileSync(result.adapterPath, "utf-8"), /held_out_command_templates:/);
		assert.match(readFileSync(result.adapterPath, "utf-8"), /external consumer smoke ok/);
		assert.equal(result.report.schemaVersion, "cautilus.report_packet.v2");
		assert.equal(result.report.intent, "Fresh consumer onboarding smoke should reach one bounded run after doctor ready.");
		assert.equal(result.commands.some((entry) => /git$/.test(entry.command)), true);
		assert.equal(result.commands.some((entry) => /cautilus$/.test(entry.command)), true);
		assert.equal(
			result.commands.some((entry) => entry.args.includes("mode") && entry.args.includes("evaluate")),
			true,
		);
	} finally {
		rmSync(result.workdir, { recursive: true, force: true });
	}
});
