// On-demand LIVE proof for the apex `Behavior Evaluation` promise (dev/repo coding-agent flagship).
//
// This is the checked-in executable proof that runs the BEHAVIOR live: it drives the real agent
// (claude_code backend, Sonnet) against this repo's own AGENTS.md and asserts the stable
// cross-runtime routing invariant on the FRESH capture. It is gated behind
// `npm run proof:behavior-eval:live` and never runs inside `npm run verify` or standing
// `specdown run` (live cost; operator decision "매 실행마다 도는 건 아닌").
//
// The standing deterministic gate (behavior-eval-live-proof.test.mjs) replays the checked-in
// operator-witnessed capture through the SAME assertLiveInvariant() below, so the displayed
// invariant and the graded invariant cannot drift.
//
// What is asserted (the stable invariant, not runtime-specific shapes): the agent oriented on
// AGENTS.md and routed to the find-skills startup bootstrap. The claude runtime reports
// runtime-specific shapes (firstToolCall "Skill(charness:find-skills)", loadedInstructionFiles
// ["CLAUDE.md"], where CLAUDE.md is a symlink to AGENTS.md) that differ from the codex capture;
// those are deliberately NOT asserted. A real regression — the agent failing to orient on
// AGENTS.md or dropping the find-skills bootstrap — fails this proof loudly.

import { spawnSync } from "node:child_process";
import { mkdtempSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

export const STABLE_INVARIANT = {
	observationStatus: "observed",
	entryFile: "AGENTS.md",
	bootstrapHelper: "charness:find-skills",
};

// The single load-bearing assertion shared by the live driver and the deterministic replay test.
// Throws on any invariant miss; returns a small evidence object on success.
export function assertLiveInvariant(evaluation) {
	if (!evaluation || typeof evaluation !== "object") {
		throw new Error("assertLiveInvariant: no evaluation object");
	}
	const status = evaluation.observationStatus;
	if (status !== STABLE_INVARIANT.observationStatus) {
		throw new Error(
			`live agent did not produce an observation: observationStatus=${status} blockerKind=${evaluation.blockerKind || ""}`,
		);
	}
	if (evaluation.entryFile !== STABLE_INVARIANT.entryFile) {
		throw new Error(`agent did not orient on AGENTS.md: entryFile=${evaluation.entryFile}`);
	}
	const bootstrap = evaluation.routingDecision && evaluation.routingDecision.bootstrapHelper;
	if (bootstrap !== STABLE_INVARIANT.bootstrapHelper) {
		throw new Error(`agent dropped the find-skills startup bootstrap: bootstrapHelper=${bootstrap}`);
	}
	return {
		entryFile: evaluation.entryFile,
		bootstrapHelper: bootstrap,
		reasonSummary: (evaluation.routingDecision && evaluation.routingDecision.reasonSummary) || "",
	};
}

function repoRoot() {
	// scripts/on-demand/behavior-eval-live-proof.mjs -> repo root is two levels up.
	return resolve(fileURLToPath(new URL("../..", import.meta.url)));
}

function runLiveAgent() {
	const root = repoRoot();
	const model = process.env.BEHAVIOR_EVAL_LIVE_MODEL || "sonnet";
	const outDir = mkdtempSync(join(tmpdir(), "behavior-eval-live-"));
	const outputFile = join(outDir, "observed.json");
	const casesFile = join(root, "fixtures/eval/dev/repo/live/behavior-eval-live-cases.json");
	const args = [
		join(root, "scripts/agent-runtime/run-local-eval-test.mjs"),
		"--repo-root", root,
		"--workspace", root,
		"--cases-file", casesFile,
		"--output-file", outputFile,
		"--artifact-dir", join(outDir, "artifacts"),
		"--backend", "claude_code",
		"--claude-model", model,
		"--claude-permission-mode", "dontAsk",
		"--sandbox", "read-only",
		"--timeout-ms", "240000",
	];
	process.stdout.write(`behavior-eval live proof: driving live agent (claude_code, model=${model}) against ${root}/AGENTS.md ...\n`);
	const result = spawnSync("node", args, { cwd: root, stdio: ["inherit", "inherit", "inherit"] });
	if (result.error) {
		throw result.error;
	}
	if (result.status !== 0) {
		throw new Error(`run-local-eval-test.mjs exited ${result.status}`);
	}
	const observed = JSON.parse(readFileSync(outputFile, "utf-8"));
	const evaluation = Array.isArray(observed.evaluations) ? observed.evaluations[0] : undefined;
	return { evaluation, outputFile };
}

function main() {
	const { evaluation, outputFile } = runLiveAgent();
	const evidence = assertLiveInvariant(evaluation);
	process.stdout.write(
		`behavior-eval live proof: PASS — live agent oriented on ${evidence.entryFile} and routed to ${evidence.bootstrapHelper}.\n`,
	);
	process.stdout.write(`  reasonSummary: ${evidence.reasonSummary}\n`);
	process.stdout.write(`  fresh capture: ${outputFile}\n`);
}

const invokedDirectly = process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (invokedDirectly) {
	try {
		main();
	} catch (error) {
		process.stderr.write(`behavior-eval live proof: FAIL — ${error.message}\n`);
		process.exit(1);
	}
}
