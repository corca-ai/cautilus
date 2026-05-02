# Debug Review: canonical claim map ESLint
Date: 2026-05-03

## Problem

The new canonical claim map implementation failed `npm run verify` during the ESLint phase.

## Correct Behavior

Given canonical claim map scripts are maintained repo tooling, when `npm run verify` runs, then `npm run lint:eslint` should pass without unused variables or complexity-rule violations.

## Observed Facts

ESLint reported:

```text
/home/hwidong/codes/cautilus/scripts/agent-runtime/build-canonical-claim-map.mjs
   58:7   error  'asObject' is assigned a value but never used
  267:1   error  Function 'mapCandidate' has a complexity of 17. Maximum allowed is 12
  288:1   error  Function 'mappingFromBest' has a complexity of 20. Maximum allowed is 12
  353:32  error  'keywords' is defined but never used
  358:38  error  'keywords' is defined but never used

/home/hwidong/codes/cautilus/scripts/agent-runtime/render-claim-status-report.mjs
  356:1  error  Function 'renderCanonicalMap' has a complexity of 13. Maximum allowed is 12
```

After the first repair, ESLint still reported:

```text
/home/hwidong/codes/cautilus/scripts/agent-runtime/build-canonical-claim-map.mjs
  309:1  error  Function 'mappingFromBest' has a complexity of 16. Maximum allowed is 12
```

The focused canonical-map and status-report tests passed before the lint repair, so the failure was static maintainability rather than observed output behavior.

## Reproduction

```bash
npm run lint:eslint
```

## Candidate Causes

- The map builder mixed audience routing, confidence checks, and output packet shaping in single functions.
- The renderer mixed optional canonical-map summary handling with Markdown output in one function.
- Draft helpers left unused variables after catalog keyword fields were stripped from the public packet.

## Hypothesis

If audience-specific mapping, confidence checks, source-ref compaction, catalog keyword stripping, and catalog-review rendering are extracted into smaller helpers, then ESLint complexity and unused-variable rules should pass while focused tests keep passing.

## Verification

- `npm run lint:eslint` passed after extracting the helpers.
- `node --test --test-reporter=dot --test-reporter-destination=stdout scripts/agent-runtime/build-canonical-claim-map.test.mjs scripts/agent-runtime/render-claim-status-report.test.mjs` passed.

## Root Cause

The first implementation preserved the right behavior but concentrated too much branching in the new map builder and status-report renderer.
This repeated the same maintainability failure mode as `debug-2026-05-02-claim-status-report-eslint.md`.

## Seam Risk

- Interrupt ID: canonical-claim-map-eslint
- Risk Class: none
- Seam: local maintained Node scripts for claim-map and report generation
- Disproving Observation: focused tests passed before repair and after repair; ESLint now passes.
- What Local Reasoning Cannot Prove: whether the automatic U/M mapping is semantically acceptable to the maintainer.
- Generalization Pressure: monitor

## Interrupt Decision

- Premortem Required: yes
- Next Step: impl
- Handoff Artifact: none

## Prevention

Keep claim artifact scripts split into parsing, scoring, packet shaping, and rendering helpers.
When adding new report sections, run `npm run lint:eslint` before the full verify loop so complexity regressions fail earlier.

## Related Prior Incidents

- `debug-2026-05-02-claim-status-report-eslint.md`: the earlier claim status report renderer had the same pattern of correct behavior with excessive complexity in display helpers.
