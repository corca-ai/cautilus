# Debug Review
Date: 2026-05-17

## Problem

`git push origin main` stopped in the pre-push verify gate after the budget-attribution telemetry patch.

## Correct Behavior

Given deployment evidence row normalization accepts optional telemetry attribution fields, when `npm run lint:eslint` runs, then the row normalizer should preserve explicit fields while staying below the repo complexity budget.

## Observed Facts

The exact failure was:

```text
/home/hwidong/codes/cautilus/scripts/agent-runtime/deployment-evidence.mjs
  162:1   error  Function 'normalizeEvidenceRow' has a complexity of 13. Maximum allowed is 12        complexity
  162:10  error  Refactor this function to reduce its Cognitive Complexity from 15 to the 12 allowed  sonarjs/cognitive-complexity
```

Focused Node and Go behavior tests passed before the push attempt.
The pre-push verify gate caught the maintainability failure before the branch was pushed.

## Reproduction

Run `npm run lint:eslint -- scripts/agent-runtime/deployment-evidence.mjs` after adding row-level attribution fields inline to `normalizeEvidenceRow`.

## Candidate Causes

- New row string-field projection logic added another branch/loop inside an already branchy normalizer.
- Success-count validation, optional string copying, and numeric telemetry copying stayed in one function instead of helper seams.
- The focused tests exercised behavior but did not include the lint complexity gate.

## Hypothesis

If optional row string and numeric copying move into small helper functions, then `normalizeEvidenceRow` will preserve the same packet shape while dropping below the lint complexity limit.

## Verification

After extracting optional field-copy helpers, `npm run lint:eslint -- scripts/agent-runtime/deployment-evidence.mjs` passed.
`node --test --test-reporter=dot --test-reporter-destination=stdout scripts/agent-runtime/deployment-evidence.test.mjs scripts/agent-runtime/deployment-evidence-schemas.test.mjs` also passed.

## Root Cause

The implementation extended a known projection hot spot inline.
`normalizeEvidenceRow` already validated row shape, sample counts, success counts, optional strings, numeric duration, telemetry numeric fields, and success-rate calculation.
Adding attribution string fields inside that function crossed the repo's complexity threshold.

## Detection Gap

- Focused behavior tests | did not run ESLint complexity | run `npm run lint:eslint -- <changed projection files>` before pushing packet-shape changes.
- Existing complexity memory | similar deployment-evidence complexity had been debugged before | treat row projection changes as helper-first in this file.

## Sibling Search

- Mental model: packet projection fields are cheap to add inline because each field is optional.
- Prior incident axis: `debug-2026-05-16-deployment-evidence-cache-telemetry-complexity.md` records the same file exceeding complexity during cache telemetry expansion.
- Projection axis: inspect row and summary builders when adding another telemetry field family.
- Schema axis: keep schema additions declarative; avoid mirroring schema branches in one normalizer.

## Seam Risk

- Interrupt ID: deployment-evidence-attribution-complexity
- Risk Class: none
- Seam: Node deployment-evidence projection lint gate
- Disproving Observation: pre-push verify stopped before any remote state changed.
- What Local Reasoning Cannot Prove: whether future attribution field families will stay below complexity unless helper seams become the default.
- Generalization Pressure: monitor

## Interrupt Decision

- Critique Required: no
- Next Step: impl
- Handoff Artifact: none

## Prevention

Extract optional field-copy helpers in `deployment-evidence.mjs` and keep future row projection additions data-driven.
For broad packet-shape patches, run the focused lint command before the push attempt.
