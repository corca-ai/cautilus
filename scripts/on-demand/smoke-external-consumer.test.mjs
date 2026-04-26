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
		assert.ok(existsSync(result.fixturePath));
		assert.ok(existsSync(result.runnerPath));
		assert.ok(existsSync(result.evalSummaryPath));
		assert.ok(existsSync(result.evalObservedPath));
		assert.ok(existsSync(result.evalCasesPath));
		assert.match(readFileSync(result.adapterPath, "utf-8"), /version: 1/);
		assert.match(readFileSync(result.adapterPath, "utf-8"), /evaluation_input_default: fixtures\/eval\/app\/prompt\/onboarding-smoke\.fixture\.json/);
		assert.match(readFileSync(result.adapterPath, "utf-8"), /eval_test_command_templates:/);
		assert.match(readFileSync(result.adapterPath, "utf-8"), /cautilus-smoke-eval\.mjs/);
		assert.equal(result.evalSummary.schemaVersion, "cautilus.app_prompt_evaluation_summary.v1");
		assert.equal(result.evalSummary.recommendation, "accept-now");
		assert.equal(result.commands.some((entry) => /git$/.test(entry.command)), true);
		assert.equal(result.commands.some((entry) => /cautilus$/.test(entry.command)), true);
		assert.equal(
			result.commands.some((entry) => entry.args.includes("eval") && entry.args.includes("test")),
			true,
		);
	} finally {
		rmSync(result.workdir, { recursive: true, force: true });
	}
});
