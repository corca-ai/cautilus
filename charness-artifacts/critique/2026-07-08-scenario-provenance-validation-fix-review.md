# Critique: Scenario Provenance Validation Fix
Date: 2026-07-08
Target: scenario provenance validation fix worktree
Fresh-Eye Satisfaction: parent-delegated
Packet Consumed: `charness-artifacts/critique/2026-07-08-025153-packet.md`
Reference: delegated fresh-eye critique after `charness-artifacts/critique/2026-07-08-skillopt-provenance-post-commit-critique.md`

## Reviewer Tier Evidence

- Requested tier: `high-leverage`
- Requested spawn fields: `none`
- Host exposure state: `pending-parent-spawn`
- Application state: `unverified-by-packet`
- Applied evidence boundary: host did not expose separate tier-application confirmation; parent used the available default subagent spawn surface.

## Change

This follow-up fixes the concrete validation defects found after the first SkillOpt scenario provenance absorption commit.
The slice rejects evidence-free proposal candidates, rejects malformed optional provenance enum fields in the Go CLI runtime, keeps the Node helper aligned on evidence cardinality, narrows overclaiming docs, and refreshes generated claim evidence.

## Capability At Stake

Cautilus should not claim a SkillOpt-derived scenario proposal handoff if the product-owned proposal boundary can emit packets with no evidence or malformed provenance.
The critical behavior is rejection before `discover scenarios propose` emits an operator-reviewable proposal packet.

## Delegated Review Summary

- Runtime contract parity reviewer: no remaining Act Before Ship items; noted only a small Node test indentation cleanup.
- Release readiness reviewer: no semantic blocker, but required committing refreshed generated claim artifacts and the prepared critique packet before release.
- Counterweight reviewer: found a real remaining Act Before Ship bug where Go still accepted explicit JSON `null` for `origin` and `activityProvenance.split`.

## Findings

### Act Before Ship

- Explicit `null` optional provenance enums in Go were still treated as absent after the first repair.
  Fixed by making optional enum validation skip only absent keys, not present `nil` values, and by adding Go runtime plus CLI negative cases for null origin and null split.
  Evidence: `internal/runtime/proposals.go`, `internal/runtime/proposals_test.go`, `internal/app/cli_smoke_test.go`.

### Bundle Anyway

- Commit the generated claim refresh and prepared critique packet with this slice.
  The release-readiness delegated review correctly treated uncommitted generated evidence and untracked packet artifacts as release blockers, not semantic code blockers.

- Keep the Node provenance test block readable.
  A stray indentation drift in the numeric origin negative case was corrected while preserving the existing assertions.

### Over-Worry

- Do not require Go and Node to produce identical diagnostic strings for every malformed provenance value.
  The contract requirement is rejection at the boundary; public CLI smoke checks the Go operator-facing stderr where it matters most.

- Do not require v1 to make provenance mandatory on every evidence item.
  The docs now state that provenance is optional in v1 and validated when present.

### Valid But Defer

- Semantic v2 rules such as `origin: replayed` requiring a `replayId`, split/origin compatibility, and score range semantics remain useful future hardening.
  They are not blockers for the current validation parity fix.

## Structured Findings

- F1 | bin: act-before-ship | evidence: strong | ref: internal/runtime/proposals.go | action: fix | note: Go accepted explicit null optional provenance as absent.
- F2 | bin: bundle-anyway | evidence: strong | ref: .cautilus/claims/status-summary.json | action: fix | note: generated claim artifacts must be committed with the release slice.
- F3 | bin: bundle-anyway | evidence: moderate | ref: scripts/agent-runtime/scenario-proposals.test.mjs | action: fix | note: Node test indentation drift reduced readability.
- F4 | bin: valid-but-defer | evidence: moderate | ref: docs/contracts/scenario-proposal-inputs.md | action: defer | note: v2 semantic provenance constraints are future hardening.

## Release Decision

No delegated reviewer left a semantic Act Before Ship item after the null-path fix.
Proceed to focused verification, full verify, hooks check, commit, and patch release if those gates pass.
