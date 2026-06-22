# Debug Review
Date: 2026-06-22

## Problem

`npm run verify` failed after the issue #49 implementation even though the focused behavior tests passed.
The exact failing gate was eslint complexity in `scripts/agent-runtime/skill-test-claude-backend.mjs`.

## Correct Behavior

Given the Claude skill-test backend now reads parent and subagent transcripts, when `npm run verify` runs, then eslint should pass while command-fragment matching still includes subagent tool calls.

## Observed Facts

The exact failure was:

```text
/home/hwidong/codes/cautilus/scripts/agent-runtime/skill-test-claude-backend.mjs
  157:8   error  Function 'findClaudeSubagentTranscriptFiles' has a complexity of 17. Maximum allowed is 12
  157:17  error  Refactor this function to reduce its Cognitive Complexity from 18 to the 12 allowed
  232:8   error  Function 'runClaudeSample' has a complexity of 14. Maximum allowed is 12
```

After the first refactor, `findClaudeSubagentTranscriptFiles` passed but `runClaudeSample` still failed at complexity 13.
Focused tests for the Claude backend and skill evaluation had passed before `verify`.

## Reproduction

Run:

```bash
npm run verify
```

Focused reproduction for the lint failure:

```bash
npm run lint:eslint -- scripts/agent-runtime/skill-test-claude-backend.mjs
```

## Candidate Causes

- Session-tree discovery added project-dir enumeration, dedupe, JSONL filtering, and mtime sorting in one helper.
- `runClaudeSample` was already near the complexity threshold, and adding subagent artifact collection pushed it over the limit.
- The focused behavior tests did not exercise eslint complexity budgets.

## Hypothesis

If session-tree discovery and process-failure branching are split into smaller helpers, then eslint complexity should pass without changing command extraction behavior.

## Verification

After extracting project-name discovery, subagent-dir construction, transcript-file listing, transcript sorting, subagent artifact refs, and Claude process-failure handling, the focused lint command passed:

```bash
npm run lint:eslint -- scripts/agent-runtime/skill-test-claude-backend.mjs
```

The focused Claude backend test also passed:

```bash
node --test scripts/agent-runtime/skill-test-claude-backend.test.mjs
```

## Root Cause

The implementation treated the session-tree scan as a small local extension to command extraction, but the required filesystem fallbacks created enough control flow to exceed the repo lint budget.
The second failure was the same pattern in the caller: adding artifact preservation directly to `runClaudeSample` crossed an already-tight function complexity limit.

## Invariant Proof

- Invariant: command-fragment matching over Claude skill-test runs includes parent stream-json tool calls and same-session subagent transcript tool calls.
- Producer Proof: `extractClaudeCommandText` now reads the parent transcript plus files from `findClaudeSubagentTranscriptFiles`.
- Final-Consumer Proof: `skill-test-claude-backend.test.mjs` asserts a parent `git status` command and a subagent `quality-lenses.md` Read description both appear in command text.
- Interface-Shape Sibling Scan: `runClaudeSample` adds `subagent_transcript` artifact refs but keeps the observed packet shape and expectation API unchanged.
- Non-Claims: this does not prove a live Claude run on this machine can spawn a subagent; it proves the checked-in matcher reads a representative session tree when the runtime records one.

## Detection Gap

- focused behavior tests | did not run eslint complexity | run focused `npm run lint:eslint -- <changed helper file>` after helper-heavy runtime changes
- existing debug memory | prior complexity incidents already showed packet/runtime helpers can exceed lint after behavior tests pass | treat filesystem traversal and packet projection as helper-first surfaces

## Sibling Search

- Mental model: adding one observation source to a runner is a local branch, not a complexity-sensitive workflow.
- same-file: `findClaudeSubagentTranscriptFiles` and `runClaudeSample` both crossed or nearly crossed complexity after the first implementation | decision: split helpers | proof: focused lint passed
- cross-file: `scripts/agent-runtime/skill-evaluation-runs.mjs` also gained threshold branching, but the focused verify failure named only the Claude backend | decision: rely on full `verify` after the repair | proof: `npm run verify` passed

## Seam Risk

- Interrupt ID: claude-subagent-threshold-lint-complexity
- Risk Class: none
- Seam: none
- Disproving Observation: none
- What Local Reasoning Cannot Prove: none
- Generalization Pressure: monitor

## Interrupt Decision

- Critique Required: no
- Next Step: impl
- Handoff Artifact: none

## Prevention

Keep runtime filesystem discovery and packet/artifact projection helper-first.
For issue slices that touch runner observation surfaces, run focused eslint before the full verify gate so complexity failures are caught while the edited function is still small in memory.

## Related Prior Incidents

- `debug-2026-05-17-deployment-evidence-attribution-complexity.md` — optional packet projection fields exceeded complexity after focused behavior tests passed.
- `debug-2026-06-19-app-prompt-intent-judge-helper-complexity.md` — helper-heavy proof code passed focused tests but failed verify on complexity.
