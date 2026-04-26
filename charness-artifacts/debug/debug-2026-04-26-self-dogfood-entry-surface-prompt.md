# Debug Review: self-dogfood entry surface prompt
Date: 2026-04-26

## Problem

`npm run dogfood:self` completed with exit 0 but wrote `artifacts/self-dogfood/eval/latest/eval-summary.json` with `recommendation=reject`.
The failing expectation was:

```text
entryFile expected "AGENTS.md"
loadedInstructionFiles missing "AGENTS.md"
```

The observed model selected the correct routing pair, `bootstrapHelper=charness:find-skills` and `workSkill=charness:impl`, but reported `entryFile=docs/internal/handoff.md`.

## Correct Behavior

Given the self-dogfood evaluation harness supplies the root repository instruction surface as the entry surface, when a model relies on those root instructions for the first routing decision, then the observed packet should report `entryFile=AGENTS.md` and include `AGENTS.md` in `loadedInstructionFiles`.
If the model reads the user-referenced task document after the root instructions, then that document may be a supporting file or later instruction input, but it is not the entry file.

## Observed Facts

- The failed case was `checked-in-agents-routing`.
- The command exited 0; the failure came from the evaluation recommendation, not a runtime crash.
- Routing passed: the model selected `charness:find-skills` as bootstrap helper and `charness:impl` as durable work skill.
- Entry-file fidelity failed: observed `entryFile=docs/internal/handoff.md`.
- Required instruction-file fidelity failed: `loadedInstructionFiles` omitted `AGENTS.md`.
- The model summary said the handoff was used "after the root repo instruction surface already present in the prompt."
- The generated prompt told the model that "root repository instructions are the entry surface" but also asked for the first instruction file "intentionally used" and to list files "actually read."
- Related prior incidents: `debug-2026-04-26-self-dogfood-task-trigger-ambiguity.md` and `debug-2026-04-26-self-dogfood-work-skill-deferral.md`.

## Reproduction

Run:

```bash
npm run dogfood:self
```

Then inspect:

```bash
jq '{recommendation, evaluationCounts, evaluations}' artifacts/self-dogfood/eval/latest/eval-summary.json
```

The failing observed packet is in:

```text
artifacts/self-dogfood/eval/latest/eval-test/checked-in-agents-routing/result.json
```

## Candidate Causes

- The model regressed and ignored the root instruction surface.
- The prompt is ambiguous because the root instructions may already be present in the evaluation context rather than read through an explicit file-open action.
- The evaluator over-specifies `AGENTS.md` for models that correctly rely on prompt-provided root instructions but report the next task document as the first file they intentionally opened.
- The recent agent-surface materialization changed the Codex context enough to make the model choose a different wording path.

## Hypothesis

If the evaluation prompt states that prompt-provided root repository instructions still count as `AGENTS.md` for `entryFile` and `loadedInstructionFiles`, then the existing expectation becomes unambiguous and `npm run dogfood:self` should return `recommendation=accept-now`.

## Verification

Added explicit prompt guidance in `scripts/agent-runtime/run-local-eval-test.mjs` for root instructions supplied by the evaluation harness.
Reran:

```bash
node --test --test-reporter=spec --test-reporter-destination=stdout scripts/agent-runtime/run-local-eval-test.test.mjs scripts/run-self-dogfood-eval.test.mjs
npm run dogfood:self
```

The focused tests passed.
The self-dogfood run produced `recommendation=accept-now`, with observed `entryFile=AGENTS.md`, `loadedInstructionFiles` including `AGENTS.md`, and routing still passing.

## Root Cause

The self-dogfood prompt asked for files the model had "actually read" without explaining how to report root instructions that were supplied by the harness as evaluation context.
That allowed a model to correctly rely on root repo instructions but report the user-referenced task document as the first intentionally opened file.

## Seam Risk

- Interrupt ID: self-dogfood-entry-surface-prompt
- Risk Class: none
- Seam: Codex `exec` observation wording versus self-dogfood instruction-surface evaluator fields
- Disproving Observation: a model can rely on root instructions supplied by the harness and still omit `AGENTS.md` when the prompt asks only for files it "actually read"
- What Local Reasoning Cannot Prove: whether future models will infer the same artifact path when root instructions arrive as context rather than through a file read
- Generalization Pressure: monitor

## Interrupt Decision

- Premortem Required: no
- Next Step: impl
- Handoff Artifact: none

## Prevention

Keep instruction-surface prompts explicit about the difference between the root instruction artifact and later task documents.
When a fixture asserts `expectedEntryFile`, the generated prompt should tell the model how to report root instructions that were supplied by the harness rather than opened manually.
