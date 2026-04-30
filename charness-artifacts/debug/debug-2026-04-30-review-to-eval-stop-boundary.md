# Debug Review: review-to-eval stop boundary
Date: 2026-04-30

## Problem

The new `audit-cautilus-review-to-eval-flow-log` happy-path test failed even though the synthetic transcript included reviewer execution, `claim review apply-result`, `claim validate`, `claim plan-evals`, and a stop-boundary summary.

## Correct Behavior

Given a transcript that starts from `agent status`, runs fresh claim discovery, summarizes claims, prepares review input, executes one reviewer lane, applies the review result, validates the reviewed claim packet, plans evals, and says it stopped before writing fixtures or editing product files, when the review-to-eval audit runs, then it should pass with no findings.

## Observed Facts

- `node --test scripts/agent-runtime/audit-cautilus-review-to-eval-flow-log.test.mjs scripts/agent-runtime/skill-test-case-suite.test.mjs scripts/agent-runtime/run-local-skill-test.test.mjs` failed only the first new happy-path test.
- The exact assertion failure was `'failed' !== 'passed'`.
- Replaying the smallest synthetic transcript produced one finding: `missing_stop_boundary`.
- The assistant message said: `I stopped before writing fixtures or editing product files.`
- The stop-boundary regular expression recognized `product files.*not edited` and Korean variants, but not the direct English phrase `editing product files`.

## Reproduction

```bash
node --test scripts/agent-runtime/audit-cautilus-review-to-eval-flow-log.test.mjs
```

The smallest reproducer is the happy-path transcript in the first test case.
It fails with `missing_stop_boundary`.

## Candidate Causes

- The stop-boundary regular expression is narrower than the intended English wording.
- The transcript summarizer may be dropping assistant messages before audit matching.
- The forbidden-command audit may be turning the branch into a failure before message findings run.

## Hypothesis

If the stop-boundary matcher accepts the plain English phrase `editing product files`, then the same synthetic happy-path transcript will pass while the negative tests for wrong ordering and eval execution still fail.

## Verification

Before repair, direct audit replay returned:

```json
{
  "status": "failed",
  "findings": [
    {
      "id": "missing_stop_boundary"
    }
  ]
}
```

After repair, rerun:

```bash
node --test scripts/agent-runtime/audit-cautilus-review-to-eval-flow-log.test.mjs scripts/agent-runtime/skill-test-case-suite.test.mjs scripts/agent-runtime/run-local-skill-test.test.mjs
```

## Root Cause

The new audit's stop-boundary phrase matcher was overfit to passive wording like `product files not edited`.
The test used an equally valid active wording, `editing product files`, so the audit rejected a correct transcript.

## Seam Risk

- Interrupt ID: review-to-eval-stop-boundary
- Risk Class: none
- Seam: audit wording over a local synthetic transcript
- Disproving Observation: direct audit replay showed every required command was present and ordered; only the stop-boundary message finding failed
- What Local Reasoning Cannot Prove: whether live agent wording will cover every valid human phrasing
- Generalization Pressure: monitor

## Interrupt Decision

- Premortem Required: no
- Next Step: impl
- Handoff Artifact: none

## Prevention

When adding branch-boundary audits, include at least one active-voice and one passive-voice stop-boundary phrase in tests or make the matcher intentionally phrase-tolerant from the start.
Keep command ordering strict while keeping boundary wording flexible.
