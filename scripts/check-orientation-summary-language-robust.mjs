// Lint: no-input orientation cases must not grade their summary with language-brittle
// requiredSummaryFragments.
//
// The Cautilus Agent's no-input first-touch orientation summary is graded SEMANTICALLY by the
// language-robust reasoning-soundness judge (fixtures/eval/dev/skill/
// reasoning-soundness-calibration.dev-skill-no-input-orientation.json), composited with the
// deterministic process facet held_no_input_orientation. A requiredSummaryFragments list on an
// orientation case re-introduces an English-literal string matcher over a summary that this repo's
// CLAUDE.md requires to be Korean, which forced a behaviorally sound live orientation to `failed`
// on 2026-06-20 (charness-artifacts/debug/2026-06-20-skill-orientation-live-summary-fragment-language.md,
// the repeated-symptom sibling of the 2026-06-19 command-fragment incident).
//
// The language-independent guards stay: requiredCommandFragments proves the read-only `doctor status`
// packet ran, and forbiddenSummaryFragments/forbiddenCommandFragments prove no forbidden escalation.
// Only the semantic "did it summarize the required state" dimension moves to the judge.
//
// This guard also covers the bounded-improvement HELD-OUT orientation variant
// (fixtures/eval/dev/skill/improve/skill-orientation-improve.fixture.json). That case withholds the
// orientation recipe from its prompt, so it cannot carry ORIENTATION_PROMPT_SIGNATURE; it is matched by
// HELD_OUT_ORIENTATION_PROMPT_SIGNATURE instead. On that surface there is no reasoning-judge backstop
// and the judge cannot run in the live improve loop (replay-only), so the held-out summary stays graded
// by the command/escalation guards and this lint keeps a brittle English summary matcher from creeping
// back. See charness-artifacts/spec/2026-06-20-improve-orientation-summary-language-robustness.md.

import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import process from "node:process";

// A no-input orientation case is identified by its prompt signature rather than a hardcoded caseId,
// so the guard survives a case rename and covers the constructed control that shares the prompt.
export const ORIENTATION_PROMPT_SIGNATURE = ["first-touch orientation", "stop at branch selection"];

// The bounded-improvement HELD-OUT variant (fixtures/eval/dev/skill/improve/) deliberately withholds
// the orientation recipe so SKILL.md is the only source of the discipline, which means it structurally
// cannot carry ORIENTATION_PROMPT_SIGNATURE. It is still a no-input first-touch orientation case whose
// summary must stay language-robust (graded by command/escalation guards, not an English string match),
// so detect it by its held-out no-input phrasing. The two tokens together are specific to the held-out
// orientation prompt and do not match the spoon-fed orientation or eval-fixture prompts.
export const HELD_OUT_ORIENTATION_PROMPT_SIGNATURE = ["do whatever your skill says to do first", "invoked without a task"];

function matchesSignature(prompt, signature) {
	return signature.every((token) => prompt.includes(token));
}

export function isNoInputOrientationCase(testCase) {
	const prompt = typeof testCase?.prompt === "string" ? testCase.prompt.toLowerCase() : "";
	if (!prompt) {
		return false;
	}
	return matchesSignature(prompt, ORIENTATION_PROMPT_SIGNATURE) || matchesSignature(prompt, HELD_OUT_ORIENTATION_PROMPT_SIGNATURE);
}

// Pure: given one parsed suite file, return the orientation cases that still declare a
// non-empty requiredSummaryFragments. Files without a `cases` array (results maps, calibration,
// verdicts) yield nothing.
export function findSuiteViolations(filePath, parsed) {
	if (!parsed || !Array.isArray(parsed.cases)) {
		return [];
	}
	const violations = [];
	for (const testCase of parsed.cases) {
		if (!isNoInputOrientationCase(testCase)) {
			continue;
		}
		const fragments = testCase.requiredSummaryFragments;
		if (Array.isArray(fragments) && fragments.length > 0) {
			violations.push({
				file: filePath,
				caseId: typeof testCase.caseId === "string" ? testCase.caseId : "(unknown case)",
				fragments,
			});
		}
	}
	return violations;
}

function listJsonFiles(dir) {
	const out = [];
	for (const entry of readdirSync(dir, { withFileTypes: true })) {
		const full = join(dir, entry.name);
		if (entry.isDirectory()) {
			out.push(...listJsonFiles(full));
		} else if (entry.isFile() && entry.name.endsWith(".json")) {
			out.push(full);
		}
	}
	return out;
}

// Walk a fixtures root and collect every orientation-case violation. Unparseable JSON is reported
// as its own violation so a corrupt suite cannot hide a brittle matcher behind a parse skip.
export function collectViolations(rootDir) {
	if (!statSync(rootDir, { throwIfNoEntry: false })?.isDirectory()) {
		return [];
	}
	const violations = [];
	for (const file of listJsonFiles(rootDir)) {
		let parsed;
		try {
			parsed = JSON.parse(readFileSync(file, "utf-8"));
		} catch (error) {
			violations.push({ file, caseId: "(unparseable JSON)", fragments: [String(error.message)] });
			continue;
		}
		violations.push(...findSuiteViolations(file, parsed));
	}
	return violations;
}

// Run the check over one fixtures root and return a process exit code (0 ok, 1 violations).
// Streams are injectable so the CLI behavior is unit-testable without spawning a subprocess.
export function runCli(fixturesRoot, streams = {}) {
	const stdout = streams.stdout ?? process.stdout;
	const stderr = streams.stderr ?? process.stderr;
	const violations = collectViolations(fixturesRoot);
	if (violations.length === 0) {
		stdout.write("orientation-summary-language-robust: OK — no orientation case declares a language-brittle requiredSummaryFragments.\n");
		return 0;
	}
	stderr.write("orientation-summary-language-robust: FAIL — no-input orientation cases must not declare requiredSummaryFragments.\n");
	for (const violation of violations) {
		const rel = violation.file.startsWith(fixturesRoot) ? violation.file.slice(fixturesRoot.length + 1) : violation.file;
		stderr.write(`  ${rel} :: ${violation.caseId} -> ${JSON.stringify(violation.fragments)}\n`);
	}
	stderr.write(
		"\nOn the dev/skill no-input orientation surface the summary is graded semantically by the language-robust\n" +
		"reasoning-soundness judge (reasoning-soundness-calibration.dev-skill-no-input-orientation.json). On the\n" +
		"held-out improve surface there is no judge backstop and the judge cannot run in the live improve loop, so\n" +
		"the summary stays graded by the command/escalation guards only. Either way the fix is the same: remove\n" +
		"requiredSummaryFragments from the orientation case and keep requiredCommandFragments + forbidden*Fragments\n" +
		"as the language-independent packet/escalation guards.\n" +
		"See charness-artifacts/debug/2026-06-20-skill-orientation-live-summary-fragment-language.md and\n" +
		"charness-artifacts/spec/2026-06-20-improve-orientation-summary-language-robustness.md.\n",
	);
	return 1;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
	const repoRoot = resolve(fileURLToPath(new URL("..", import.meta.url)));
	process.exit(runCli(join(repoRoot, "fixtures", "eval")));
}
