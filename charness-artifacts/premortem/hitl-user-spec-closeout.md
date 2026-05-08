# HITL User Spec Closeout Premortem
Date: 2026-05-08

## Execution

Fresh-eye premortem was delegated to three bounded reviewers:
one user-facing vocabulary angle, one proof-honesty angle, and one counterweight reviewer.

## Fresh-Eye Satisfaction

parent-delegated

## Decision

Before handing off to the next HITL session, normalize the user-facing specs around the accepted session rules:
pain point first, concrete CLI command plus `cautilus-agent` skill at workflow introduction, command-surface vocabulary instead of "the binary", no generic Specdown readiness coupling, and honest prepared-but-not-executed eval boundaries.

## Angles

- User-facing vocabulary and DDD shared-language drift.
- Executable evidence, proof honesty, and prepared-but-not-run boundaries.
- Counterweight triage to avoid blocking on broad report vocabulary or unnecessary eval execution.

## Findings

### Act Before Ship

- Claim Discovery still used "binary" in user-facing command ownership language.
  This was fixed by using `claim discover`, `claim show`, and `cautilus-agent` skill ownership.
- The Claim Discovery workflow table still said "linked Markdown" in concept prose.
  This was fixed to "entry docs and linked docs"; lower-level machine output may still expose Markdown traversal when it is technical evidence.
- Evaluation and Optimization openings did not start with pain points and did not name the `cautilus-agent` skill on first workflow introduction.
  This was fixed.
- Evidence Gaps still used `proof-plan` and `non-verdict` wording in user-facing prose.
  This was fixed to candidate-not-proof language while keeping the actual packet field check lightweight.
- The curation section could read as if the Cautilus eval had passed because it said the spec verifies the prepared dogfood episode and echoed `curation-audit-test=passed`.
  This was fixed to fixture/audit-hook readiness and `curation-audit-unit-test=passed`.
- HITL runtime state had a stale target and too-narrow line bounds for the current Claim Discovery chunk.
  This was fixed in the runtime queue and state so the next HITL starts from Claim Discovery and shows the heuristic chunk through implementation evidence.

### Bundle Anyway

- Broader user-story harmonization was cheap and bundled across all `docs/specs/user/*.spec.md` files.
- The `cautilus-agent` naming pattern was applied in the index and story openings.

### Over-Worry

- Do not run the prepared Cautilus eval before handoff.
  The current HITL remains a spec-document review, and eval execution still requires explicit approval.
- Do not purge every lower-level Markdown reference.
  The accepted rule demotes Markdown in product-facing opening language; technical evidence can still name Markdown traversal when the packet or code does.

### Valid but Defer

- Full product JSON vocabulary changes, such as renaming existing packet fields, are deferred.
  This pass only normalizes user-facing docs and HITL state.

## Counterweight Triage

- Act before ship: command-surface vocabulary, pain-point openings, prepared-not-executed clarity, and HITL cursor resync.
- Bundle anyway: user-story opening harmonization across the remaining story pages.
- Over-worry: executing the Cautilus eval or removing every technical Markdown reference.
- Valid but defer: schema or packet field renames.

## Deliberately Not Doing

- Do not execute `dogfood:cautilus-claim-discovery-curation-flow:eval:codex`.
- Do not rename JSON fields or historical artifact keys in this pass.
- Do not treat current Claim Discovery edits as HITL-accepted; the next session should review the rewritten chunks.

## Next Move

Run focused spec lint for all user specs, update handoff, then in the next session resume HITL at the rewritten Claim Discovery heuristic chunk.
