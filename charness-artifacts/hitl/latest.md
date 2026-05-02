# HITL Review: claim source boundary
Date: 2026-05-02

## Target

`.cautilus/claims/claim-status-comments.json` and the refreshed Cautilus claim packets.

## Goal

Use maintainer review to separate ordinary public claims from proof sources, maintainer-only evidence, and claims that still need human alignment.

## Accepted Rules

- Dense Markdown tables are not an acceptable primary HITL review surface.
- Show claim review as cards with source, claim text, reason for asking, and a small decision menu.
- Do not pick HITL chunks by report row order.
- Prioritize items that can change the next implementation move: unclear wording, likely false positives, likely non-user-facing claims, and ambiguous proof routes.
- `docs/specs/*.spec.md` is not ordinary prose claim source for this review.
- Executable specs should be treated as proof or evidence context for public claims, not as human-confirm prose claims.
- `docs/maintainers/**` is not user-facing.
- Maintainer evidence notes should be excluded from user-facing claim review or relabeled as internal evidence.

## Decisions Applied

- Added `docs/specs/**` and `docs/maintainers/**` to this repo's `claim_discovery.exclude`.
- Kept `docs/specs` as an evidence root in contract examples, preserving the proof-source role.
- Regenerated claim packets after committing the source-boundary change so packet git state points at the source-boundary commit.
- Filtered existing review results while reapplying them to the new claim map so updates for removed claim ids do not block remaining reviewed evidence.

## Current Packet Snapshot

- Candidate count: 264.
- Source count: 23.
- `docs/specs/**` source count: 0.
- `docs/maintainers/**` source count: 0.
- Candidates sourced from excluded specs or maintainer docs: 0.
- Reviewed claims carried forward: 77.
- Satisfied claims carried forward: 15.

## Next HITL Queue

Continue with readable cards from `.cautilus/claims/review-input-human-confirm-action-bucket.json` and `.cautilus/claims/review-input-human-align-action-bucket.json`.

Start with claims that test the remaining review boundary:

- `claim-skills-cautilus-skill-md-118`: missing user-facing features outside entry docs should be reported as entry-surface or narrative gaps unless another reviewed artifact proves an in-scope binary miss.
- `claim-skills-cautilus-skill-md-124`: constrained-terminal or phone review should use `npm run claims:status-server` to read the report and save structured comments.
- `claim-docs-contracts-adapter-contract-md-424`: rich scenario-by-scenario adapter signals should be persisted as files for executor variants and human reviewers.

## Open Questions

- Should the claim review browser support per-example comments instead of only decision-card comments?
- Which remaining contract claims are developer-facing proof work rather than user-facing product claims?
- Which remaining human-confirm claims are concrete enough for deterministic proof without more maintainer discussion?
