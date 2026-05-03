# Canonical Spec Curation Fixture Runtime Debug
Date: 2026-05-03

## Problem

`./bin/cautilus eval test --repo-root . --adapter-name self-dogfood-canonical-spec-curation-flow --runtime fixture --output-dir /tmp/cautilus-canonical-spec-curation-fixture-smoke` failed before producing `eval-observed.json`.
The runner stderr was `--fixture-results-file is required when --backend fixture`.

## Correct Behavior

Given a dev/skill episode adapter is evaluated with the fixture runtime, when the adapter command delegates to `run-local-skill-test.mjs --backend fixture`, then the command must also provide a fixture results file.
Given no fixture results file exists for an episode adapter, when evaluating the behavior, then the honest proof path is a live backend such as Codex or Claude rather than fixture runtime.

## Observed Facts

- The new adapter command passes `{backend}` through to `scripts/run-self-dogfood-skill-refresh-flow-eval.mjs`.
- That wrapper passes fixture settings through to `scripts/agent-runtime/run-local-skill-test.mjs`.
- `run-local-skill-test.mjs` explicitly rejects `--backend fixture` without `--fixture-results-file`.
- The new canonical-spec-curation adapter intentionally does not include a fixture results file.
- Existing live episode adapters such as packet-first use Codex or Claude runtime proof rather than fixture runtime proof.

## Reproduction

```bash
./bin/cautilus eval test --repo-root . \
  --adapter-name self-dogfood-canonical-spec-curation-flow \
  --runtime fixture \
  --output-dir /tmp/cautilus-canonical-spec-curation-fixture-smoke
```

## Candidate Causes

- The adapter forgot to provide a fixture-results file for fixture runtime.
- The eval runner should reject fixture runtime earlier when an adapter command cannot supply fixture results.
- The test command was the wrong proof path for an episode behavior that needs a live skill agent.

## Hypothesis

If this failure is the expected fixture-runtime boundary, then focused normalizer tests and adapter resolution should still pass, and the live Codex runtime should be the correct proof path for the new episode fixture.

## Verification

- `node --test scripts/agent-runtime/audit-cautilus-canonical-spec-curation-flow-log.test.mjs scripts/agent-runtime/run-local-skill-test.test.mjs`
- `go test ./internal/runtime -run 'TestNormalizeEvaluationInputAcceptsDevSkillEpisodeTurns|TestNormalizeEvaluationInputAcceptsPacketFirstAuditKind|TestNormalizeEvaluationInputAcceptsCanonicalSpecCurationAuditKind' -count=1`
- `./bin/cautilus adapter resolve --repo-root . --adapter-name self-dogfood-canonical-spec-curation-flow`

These checks passed.
The live runtime still needs to be run before using this new adapter as claim evidence.

## Root Cause

The failure was not a product regression in the new audit logic.
It was a fixture-runtime mismatch: fixture-backed skill episode evaluation requires explicit fixture results, and this new adapter is a live episode adapter without such a file.

## Seam Risk

- Interrupt ID: canonical-spec-curation-fixture-runtime
- Risk Class: none
- Seam: dev/skill episode adapter runtime selection
- Disproving Observation: the wrapper and local skill test runner both explicitly require `--fixture-results-file` for fixture backend.
- What Local Reasoning Cannot Prove: whether the product should later expose a clearer adapter-level readiness message before entering the command template.
- Generalization Pressure: low

## Interrupt Decision

- Premortem Required: no
- Next Step: impl
- Handoff Artifact: none

## Prevention

Do not use fixture runtime as proof for live skill episode adapters unless the adapter declares a fixture results file.
For this canonical-spec-curation slice, use live Codex runtime proof and record the fixture-runtime boundary as not claimed.

## Related Prior Incidents

- `charness-artifacts/debug/debug-2026-05-03-eval-surface-related-evidence-ref.md`: shows prior claim-evidence work where strict validation caught an overclaim before evidence attachment.
