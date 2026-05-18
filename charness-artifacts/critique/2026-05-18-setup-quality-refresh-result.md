# Setup Quality Refresh Critique
Date: 2026-05-18

## Execution

Subagent critique completed for the Charness 0.7.0 setup and quality refresh.

## Fresh-Eye Satisfaction

parent-delegated

## Packet Consumed

`charness-artifacts/critique/2026-05-18-021414-packet.md`

## Target

`setup-quality-refresh`

## Change

Review of setup inspection, quality inventories, README entrypoint cleanup, generated claim evidence state repair, refreshed claim artifacts, and closeout gates.

## Angles

- Setup operating-surface fit
- Quality enforcement and gate honesty
- Counterweight triage for non-release scope

## Findings

- Setup normalization is healthy: `.agents/setup-adapter.yaml` maps this mature repo to existing source-of-truth docs and `inspect_repo.py` reports no missing surfaces.
- The previous spec lint failure had to be fixed before any green quality closeout.
- The generated Evidence State projection needed an empty-state renderer because Specdown rejects header-only tables.
- The untracked editor swap file `docs/specs/.index.spec.md.swp` must stay outside the commit.
- CI/local gate parity is a real release-surface gap, but the counterweight reviewer classified it as a follow-up gate rather than a blocker for this non-release refresh.
- README entrypoint line pressure was cheap to close and now reports no heuristic findings.
- Cautilus Agent `long_core` remains valid pressure but should be handled only when the agent surface is intentionally edited.

## Counterweight Triage

### Act Before Ship

- strong: fix the failed spec lint and rerun `npm run verify`.
- strong: exclude `docs/specs/.index.spec.md.swp`.

### Bundle Anyway

- strong: commit the refreshed find-skills inventory artifacts because semantic 0.7.0 capability inventory content changed.
- strong: commit the prepared critique packet and this result artifact as durable review evidence.
- moderate: keep the README entrypoint cleanup because it clears `long_entrypoint` without changing product direction.

### Over-Worry

- strong: do not create duplicate setup docs when the adapter already maps the existing roadmap and operator acceptance surfaces.
- moderate: do not shrink Cautilus Agent core solely to satisfy line-pressure smell.
- moderate: do not treat public-spec smoke-test count as automatic deletion pressure.

### Valid but Defer

- strong: add or waive local release-surface parity for release artifact build, attestation, publish, and spec-report Pages generation.
- moderate: add runtime budgets for structured verify phases.
- moderate: review public-spec proof layering case by case.

## Deliberately Not Doing

This critique does not introduce a release-local gate, rewrite Cautilus Agent disclosure, prune public-spec smoke tests, or modify setup source-of-truth docs.

## Next Move

Record the quality/setup refresh artifacts, keep the debug record with the generator fix, run standing gates, and commit the completed slice.
