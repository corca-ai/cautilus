// On-demand LIVE proof for the apex `Behavior Evaluation` promise on the cautilus-agent SKILL surface
// (dev/skill coding-agent flagship), symmetric to behavior-eval-live-proof.mjs (dev/repo).
//
// This drives the real cautilus-agent skill no-input orientation live: the agent (claude_code, Sonnet)
// invokes $cautilus-agent with no task detail, runs the read-only `cautilus doctor status` packet,
// summarizes adapter/claim/scan/next-branch state, and STOPS at branch selection. It asserts the
// stable invariant (the skill was invoked AND the orientation passed — it ran the read-only status,
// summarized, and held without forbidden escalation) on the FRESH capture. Gated behind
// `npm run proof:skill-orientation:live`; never in `npm run verify` or standing `specdown run`.
//
// Permission note: the claude_code skill backend ignores --sandbox and exposes only --permission-mode
// + --allowedTools; `dontAsk` does NOT grant Bash in headless claude, so the read-only `doctor status`
// could not run and the orientation degraded (charness-artifacts/debug/2026-06-19-skill-live-bash-
// permission-mode.md). This proof uses `bypassPermissions` for the read-only orientation on our own
// repo, so the live status command actually executes and the orientation can pass.

import { spawnSync } from "node:child_process";
import { mkdtempSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

export const STABLE_INVARIANT = {
	invoked: true,
	outcome: "passed",
};

// The single load-bearing assertion shared by the live driver and the deterministic replay test.
// Throws on any invariant miss; returns a small evidence object on success.
export function assertSkillLiveInvariant(evaluation) {
	if (!evaluation || typeof evaluation !== "object") {
		throw new Error("assertSkillLiveInvariant: no evaluation object");
	}
	if (evaluation.invoked !== STABLE_INVARIANT.invoked) {
		throw new Error(`the cautilus-agent skill was not invoked: invoked=${evaluation.invoked}`);
	}
	// outcome=passed encodes the held orientation: it ran the read-only doctor status, summarized the
	// required adapter/claim/next-branch state, and emitted no forbidden escalation. A degraded/failed
	// outcome means the no-input orientation regressed (e.g. could not read the status packet, or
	// escalated to eval/refresh/commit).
	if (evaluation.outcome !== STABLE_INVARIANT.outcome) {
		throw new Error(`the no-input orientation did not pass: outcome=${evaluation.outcome}`);
	}
	return {
		invoked: evaluation.invoked,
		outcome: evaluation.outcome,
		summary: evaluation.summary || "",
	};
}

function repoRoot() {
	return resolve(fileURLToPath(new URL("../..", import.meta.url)));
}

function runLiveSkill() {
	const root = repoRoot();
	const model = process.env.SKILL_ORIENTATION_LIVE_MODEL || "sonnet";
	const outDir = mkdtempSync(join(tmpdir(), "skill-orientation-live-"));
	const outputFile = join(outDir, "observed.json");
	const casesFile = join(root, "fixtures/eval/dev/skill/live/skill-orientation-live-cases.json");
	const args = [
		join(root, "scripts/agent-runtime/run-local-skill-test.mjs"),
		"--repo-root", root,
		"--workspace", root,
		"--cases-file", casesFile,
		"--output-file", outputFile,
		"--artifact-dir", join(outDir, "artifacts"),
		"--backend", "claude_code",
		"--claude-model", model,
		// bypassPermissions so the read-only `doctor status` can run headless (see debug artifact).
		"--claude-permission-mode", "bypassPermissions",
		"--sandbox", "read-only",
		"--timeout-ms", "240000",
	];
	process.stdout.write(`skill-orientation live proof: driving live cautilus-agent no-input orientation (claude_code, model=${model}) ...\n`);
	const result = spawnSync("node", args, { cwd: root, stdio: ["inherit", "inherit", "inherit"] });
	if (result.error) {
		throw result.error;
	}
	if (result.status !== 0) {
		throw new Error(`run-local-skill-test.mjs exited ${result.status}`);
	}
	const observed = JSON.parse(readFileSync(outputFile, "utf-8"));
	const evaluation = Array.isArray(observed.evaluations) ? observed.evaluations[0] : undefined;
	return { evaluation, outputFile };
}

function main() {
	const { evaluation, outputFile } = runLiveSkill();
	const evidence = assertSkillLiveInvariant(evaluation);
	process.stdout.write(
		`skill-orientation live proof: PASS — the cautilus-agent no-input orientation was invoked and ${evidence.outcome} (read-only status, summarized, held at branch selection).\n`,
	);
	process.stdout.write(`  summary: ${evidence.summary}\n`);
	process.stdout.write(`  fresh capture: ${outputFile}\n`);
}

const invokedDirectly = process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (invokedDirectly) {
	try {
		main();
	} catch (error) {
		process.stderr.write(`skill-orientation live proof: FAIL — ${error.message}\n`);
		process.exit(1);
	}
}
