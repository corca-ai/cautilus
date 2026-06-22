# Debug Review
Date: 2026-06-22

## Problem

`publish_release.py --execute` spent several minutes inside `npm run verify` because standing Go tests invoked the live `codex_exec` review backend through `improve search run`.

## Correct Behavior

Given `codex_exec` review variants are on-demand self-dogfood behavior, when `npm run verify` runs as a standing release gate, then it must not invoke the live `codex` CLI.
Standing tests should use deterministic fixture backends or fast local failure paths.

## Observed Facts

During the interrupted `v0.17.1` publish, process inspection showed:

```text
npm run verify
go test -covermode=atomic -coverprofile=coverage/go.out ./internal/...
bash scripts/agent-runtime/run-review-variant.sh --backend codex_exec ...
timeout --foreground 180s codex exec ...
```

The live call came from `internal/app/cli_smoke_test.go` improve-search smoke tests:

- `TestCLIImproveSearchPrepareRunAndProposeFromSearch`
- `TestCLIImproveSearchUsesHeldOutCompareArtifactReasonsAsFeedback`
- `TestCLIImproveSearchRunUsesEvalTestForHeldOutAndFullGate`

The release helper had already created local release commit `23b4957b` and local tag `v0.17.1`, but `git ls-remote origin refs/heads/main refs/tags/v0.17.1` showed the branch and tag were not pushed.

## Reproduction

Run the focused standing test before the fix:

```bash
go test ./internal/app -run 'TestCLIImproveSearchPrepareRunAndProposeFromSearch|TestCLIImproveSearchUsesHeldOutCompareArtifactReasonsAsFeedback|TestCLIImproveSearchRunUsesEvalTestForHeldOutAndFullGate'
```

Then inspect processes while it runs; at least one test can reach `run-review-variant.sh --backend codex_exec` and `codex exec`.

## Candidate Causes

- `BuildImproveSearchInput` defaults mutation backends to `codex_exec` for light budgets and `codex_exec` plus `claude_p` for medium budgets.
- The standing smoke tests called `improve search run` after `prepare-input` without overriding `mutationConfig.backends`.
- One smoke test used a fake `codex` binary, but that still exercised the `codex_exec` backend path inside standing `go test`.
- `npm run verify` includes `test:go:race` and `test:go:coverage`, both of which include `./internal/app`.

## Hypothesis

If standing improve-search tests rewrite the generated search input to use a deterministic `fixture` review backend, and `run-review-variant.sh` supports that fixture backend, then the tests can still cover mutation/evaluation/proposal behavior without invoking `codex exec`.

## Verification

The focused tests passed:

```bash
go test ./internal/app -run 'TestCLIImproveSearchPrepareRunAndProposeFromSearch|TestCLIImproveSearchRunReportsWhyNoCandidatesWereGenerated|TestCLIImproveSearchUsesHeldOutCompareArtifactReasonsAsFeedback|TestCLIImproveSearchRunUsesEvalTestForHeldOutAndFullGate'
```

A stronger sentinel check also passed with a failing `codex` binary first on `PATH`:

```bash
PATH=/tmp/cautilus-codex-sentinel:$PATH go test ./internal/app -run 'TestCLIImproveSearchPrepareRunAndProposeFromSearch|TestCLIImproveSearchRunReportsWhyNoCandidatesWereGenerated|TestCLIImproveSearchUsesHeldOutCompareArtifactReasonsAsFeedback|TestCLIImproveSearchRunUsesEvalTestForHeldOutAndFullGate'
```

The fixture backend itself produced a valid mutation output through:

```bash
bash scripts/agent-runtime/run-review-variant.sh --backend fixture --workspace . --prompt-file <tmp>/prompt.md --schema-file <tmp>/schema.json --output-file <tmp>/out.json
```

## Root Cause

The tests treated product-default mutation backends as harmless configuration, but `improve search run` executes the first configured backend.
Because the generated standing-test input kept `codex_exec`, normal `go test` could launch live agent work.

## Invariant Proof

- Invariant: standing `npm run verify` tests for improve search must not invoke live agent review backends.
- Producer Proof: the modified tests rewrite `mutationConfig.backends` to `fixture` or a local unsupported fixture-style backend before calling `improve search run`.
- Final-Consumer Proof: focused improve-search tests pass with a failing `codex` sentinel first on `PATH`.
- Interface-Shape Sibling Scan: `run-review-variant.sh` now has an explicit `fixture` backend for deterministic smoke paths while keeping `codex_exec` and `claude_p` for on-demand live review variants.
- Non-Claims: this does not remove live `codex_exec` from product defaults or on-demand self-dogfood workflows.

## Detection Gap

- release publish gate | full `verify` surfaced live backend use only by taking too long | add or preserve sentinel-style focused tests for standing smoke paths that should not call live agent CLIs
- improve-search smoke tests | asserted behavior outcomes but not backend class | rewrite generated input to fixture before standing `run` calls
- release helper | long silent subprocess made the live backend path hard to identify | process inspection was needed to see the active `codex exec`

## Sibling Search

- Mental model: using fake or default mutation backends in smoke tests is harmless because tests are local.
- same-file: three improve-search run tests could invoke `codex_exec` | decision: rewrite mutation backends to fixture before run | proof: sentinel PATH focused tests passed
- cross-file: `run-review-variant.sh` only supported live backends | decision: add deterministic `fixture` backend | proof: wrapper fixture command wrote valid mutation JSON
- on-demand sibling: scripts under `scripts/on-demand/` and self-dogfood adapters may still use live backends | decision: leave them unchanged because they are explicit on-demand surfaces | proof: no package script change moved them into `verify`

## Seam Risk

- Interrupt ID: verify-live-codex-exec
- Risk Class: none
- Seam: standing verify tests to live review backend wrapper
- Disproving Observation: `npm run verify` spawned `codex exec` from an internal Go smoke test
- What Local Reasoning Cannot Prove: whether every future test that prepares improve-search input will remember to override live mutation backends
- Generalization Pressure: monitor

## Interrupt Decision

- Critique Required: no
- Next Step: impl
- Handoff Artifact: none

## Prevention

Keep live review backends in explicit on-demand workflows.
When a standing test calls a command that can execute agent backends, either force a fixture backend in the input or add a sentinel proof that the live CLI is not reached.

## Related Prior Incidents

- `debug-2026-05-16-dev-repo-fixture-backend-results.md` — fixture-backed behavior needed explicit separation from live backend execution.
- `debug-2026-05-01-release-smoke-required-channel.md` — release gates previously mixed standing release proof with a channel-specific smoke expectation.
