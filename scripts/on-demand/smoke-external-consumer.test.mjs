import assert from "node:assert/strict";
import { existsSync, lstatSync, readFileSync, rmSync } from "node:fs";
import { join, resolve } from "node:path";
import test from "node:test";

import { buildOnboardingCapture, runExternalConsumerOnboardingSmoke } from "./smoke-external-consumer.mjs";

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
		assert.ok(existsSync(result.evalRecheckSummaryPath));
		assert.ok(existsSync(result.evalObservedPath));
		assert.ok(existsSync(result.evalCasesPath));
		assert.match(readFileSync(result.adapterPath, "utf-8"), /version: 1/);
		assert.match(readFileSync(result.adapterPath, "utf-8"), /evaluation_input_default: fixtures\/eval\/app\/prompt\/onboarding-smoke\.fixture\.json/);
		assert.match(readFileSync(result.adapterPath, "utf-8"), /eval_test_command_templates:/);
		assert.match(readFileSync(result.adapterPath, "utf-8"), /cautilus-smoke-eval\.mjs/);
		assert.equal(result.evalSummary.schemaVersion, "cautilus.app_prompt_evaluation_summary.v1");
		assert.equal(result.evalSummary.recommendation, "accept-now");
		assert.equal(result.evalRecheckSummary.schemaVersion, "cautilus.app_prompt_evaluation_summary.v1");
		assert.equal(result.evalRecheckSummary.recommendation, "accept-now");
		assert.match(result.firstBoundedRun.decisionLoopCommands[0], /cautilus evaluate fixture/);
		assert.match(result.firstBoundedRun.decisionLoopCommands[0], new RegExp(escapeRegExp(result.fixturePath)));
		assert.match(result.firstBoundedRun.decisionLoopCommands[0], new RegExp(escapeRegExp(result.evalOutputDir)));
		assert.match(result.firstBoundedRun.decisionLoopCommands[1], /cautilus evaluate observation/);
		assert.match(result.firstBoundedRun.decisionLoopCommands[1], new RegExp(escapeRegExp(result.evalObservedPath)));
		assert.match(result.firstBoundedRun.decisionLoopCommands[1], new RegExp(escapeRegExp(result.evalRecheckSummaryPath)));
		assert.equal(result.commands.some((entry) => /git$/.test(entry.command)), true);
		assert.equal(result.commands.some((entry) => /cautilus$/.test(entry.command)), true);
		assert.equal(
			result.commands.some((entry) => entry.args.includes("evaluate") && entry.args.includes("fixture")),
			true,
		);
		assert.equal(
			result.commands.some((entry) => entry.args.includes("evaluate") && entry.args.includes("observation")),
			true,
		);
	} finally {
		rmSync(result.workdir, { recursive: true, force: true });
	}
});

test("the onboarding capture records the human-auditable invariant the apex Host Ownership badge replays", async () => {
	const cautilusBin = resolve(process.cwd(), "bin", "cautilus");
	const result = await runExternalConsumerOnboardingSmoke({ cautilusBin, keepWorkdir: true });
	try {
		const capture = buildOnboardingCapture(result);
		assert.equal(capture.schemaVersion, "cautilus.consumer_onboarding_capture.v1");
		assert.equal(capture.provenance.kind, "operator-witnessed-onboarding");
		// The load-bearing invariant the leaf spec asserts on.
		assert.equal(capture.onboarding.ready, true);
		assert.equal(capture.onboarding.evalRecommendation, "accept-now");
		assert.equal(capture.onboarding.recheckRecommendation, "accept-now");
		assert.match(capture.onboarding.hostOwned.runnerPath, /cautilus-smoke-eval\.mjs$/);
		assert.match(capture.onboarding.hostOwned.adapterPath, /\.agents\/cautilus-adapter\.yaml$/);
		assert.match(capture.onboarding.packets.evalCasesPath, /^\.cautilus\/runs\/first-bounded-run\/eval-cases\.json$/);
		assert.match(capture.onboarding.packets.evalSummaryPath, /^\.cautilus\/runs\/first-bounded-run\/eval-summary\.json$/);
		assert.match(capture.onboarding.packets.evalObservedPath, /^\.cautilus\/runs\/first-bounded-run\/eval-observed\.json$/);
		assert.match(capture.onboarding.packets.evalRecheckSummaryPath, /^\.cautilus\/runs\/first-bounded-run\/eval-summary\.recheck\.json$/);
		assert.ok(capture.onboarding.steps.includes("cautilus doctor --format json"));
		assert.equal(capture.onboarding.steps.includes("cautilus doctor json"), false);
		assert.ok(capture.onboarding.steps.includes("cautilus evaluate fixture"));
		assert.ok(capture.onboarding.steps.includes("cautilus evaluate observation"));
		// Host-owned paths must be repo-relative — no absolute temp-workspace leakage.
		assert.equal(capture.onboarding.hostOwned.runnerPath.startsWith("/"), false);
		assert.equal(capture.onboarding.hostOwned.adapterPath.startsWith("/"), false);
		assert.equal(capture.onboarding.hostOwned.fixturePath.startsWith("/"), false);
		assert.equal(capture.onboarding.packets.evalCasesPath.startsWith("/"), false);
		assert.equal(capture.onboarding.packets.evalSummaryPath.startsWith("/"), false);
		assert.equal(capture.onboarding.packets.evalObservedPath.startsWith("/"), false);
		assert.equal(capture.onboarding.packets.evalRecheckSummaryPath.startsWith("/"), false);
	} finally {
		rmSync(result.workdir, { recursive: true, force: true });
	}
});

function escapeRegExp(value) {
	return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
