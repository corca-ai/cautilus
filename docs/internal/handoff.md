# Cautilus Handoff

## Workflow Trigger

다음 세션은 `charness:hitl`로 issue [#33](https://github.com/corca-ai/cautilus/issues/33) closeout을 우선 진행하세요.
현재 HITL 대상은 [docs/specs/index.spec.md](../specs/index.spec.md)이고, 활성 checkpoint는 [charness-artifacts/hitl/latest.md](../../charness-artifacts/hitl/latest.md)의 `hitl-20260509-053911`입니다.

## Current State

- Issue #33 is still open.
  It is now a Cautilus-native review-learning and shared-concern design question, not a request to import Engelbart vocabulary directly.
- The current implementation slice for #33 is `cautilus review feedback build`, which emits `cautilus.review_feedback.v1` from source-bound review outcomes.
  Read [docs/contracts/review-learning.md](../contracts/review-learning.md) before presenting the next HITL chunk.
- Latest pushed commit: `f5f68b6 Record checkoutable eval surface evidence`.
  The `v0.14.2` release is published and the latest `verify` and `spec-report` GitHub Actions for `f5f68b6` passed.
- The active HITL checkpoint says:
  target `docs/specs/index.spec.md`, status `in_progress`, queue item `specs-index-entry-map`, line range `1-37`, explicit apply required, apply mode `explicit-after-all-chunks`.
- Accepted HITL rules already recorded:
  show rewritten chunk text after edits, require full target readback after chunks, and include agent assessment before human decision.
- The older runtime `.charness/hitl/runtime/hitl-20260508-222100` is historical only.
  Do not advance that cursor.
- Charness follow-up issues from this session:
  [#136](https://github.com/corca-ai/charness/issues/136) checkoutable spec evidence,
  [#137](https://github.com/corca-ai/charness/issues/137) CI/local-gate parity.
  These are follow-up context, not blockers for #33 HITL.

## Next Session

1. Bootstrap with `git status --short`, `charness:find-skills`, and the `charness:hitl` adapter.
   Confirm the active checkpoint still matches `hitl-20260509-053911` before presenting a chunk.
2. Re-read [docs/contracts/review-learning.md](../contracts/review-learning.md) and apply this closeout question:
   Does the spec tree leave a clear place for Cautilus Agent to capture source-bound review feedback and turn it into reusable evidence about which discovery or evaluation methods produced review-useful proposals?
3. Present `specs-index-entry-map` from [docs/specs/index.spec.md](../specs/index.spec.md) lines 1-37.
   Use the required HITL shape: direct excerpt, related context, agent assessment, risks or gaps, non-binding recommended disposition, then the human decision request.
4. After the index chunk is accepted, continue in #33 closeout order:
   [Shared Concerns](../specs/concerns/index.spec.md), [Promise Model](../specs/model/index.spec.md), [User Workflow](../specs/user/index.spec.md), [Maintainer View](../specs/maintainer/index.spec.md), then [Evidence State](../specs/proof/index.spec.md).
   Prioritize pages that decide whether #33 is satisfied before polishing unrelated wording.
5. When the user accepts, narrows, reframes, rejects, or marks a missing-critical proposal, materialize one review-learning packet with `cautilus review feedback build`.
   Include `--proposal-id` or `--proposal-source-ref` for every non-`missing_critical` disposition.
6. Only after HITL acceptance and any needed edits are applied, run the appropriate checks, sync the HITL artifact, and close #33 with a comment that separates shipped decisions from deferred work.

## Discuss

- Whether `Shared Concerns` is sufficient to cover #33's shared-concern part without carrying Engelbart wording into the product surface.
- Whether review-learning evidence is clearly source-bound enough for future C-level evaluation of discovery/evaluation methods.
- Which parts of #33 should close now versus remain explicit deferred work.

## References

- [docs/specs/index.spec.md](../specs/index.spec.md)
- [docs/specs/concerns/index.spec.md](../specs/concerns/index.spec.md)
- [docs/contracts/review-learning.md](../contracts/review-learning.md)
- [charness-artifacts/hitl/latest.md](../../charness-artifacts/hitl/latest.md)
