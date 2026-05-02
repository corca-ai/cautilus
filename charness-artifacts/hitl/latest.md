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
- Accepted `claim-skills-cautilus-skill-md-118` as the human-reviewed false-negative boundary for entry-doc and linked-Markdown discovery.
- Accepted `claim-skills-cautilus-skill-md-124` as a real constrained-terminal browser-review path and reclassified it for deterministic/browser-runtime proof.
- Accepted `claim-docs-contracts-adapter-contract-md-424` as user-facing because Cautilus users include adapter authors and repo operators; reclassified it as deterministic proof work and set `claimAudience=user` through a review-result update.

## Current Packet Snapshot

- Candidate count: 264.
- Source count: 23.
- `docs/specs/**` source count: 0.
- `docs/maintainers/**` source count: 0.
- Candidates sourced from excluded specs or maintainer docs: 0.
- Agent-reviewed claims carried forward: 77.
- Human-reviewed claims: 3.
- Satisfied claims carried forward: 16.
- User-facing claims: 69.

## Next HITL Queue

Continue with readable cards from `.cautilus/claims/review-input-human-confirm-action-bucket.json` and `.cautilus/claims/review-input-human-align-action-bucket.json`.

The prior three cards have been applied and should not be asked again.
Start with claims that test whether developer-looking contract text is actually operator-facing product contract, ordinary agent proof work, or future-work narrative:

- `claim-docs-contracts-claim-discovery-workflow-md-156`: selected related claim map should drive status summaries and inspect/refresh branch commands while `state_path` remains the first-discovery output path.
- `claim-docs-contracts-claim-discovery-workflow-md-225`: broad claims should stay visible in the packet but should not become fixture plans by default because one passing fixture would overclaim the umbrella promise.
- `claim-skills-cautilus-skill-md-74`: Cautilus claim discovery applies when the user asks whether a repo proves what it claims, whether docs and behavior are aligned, or which scenarios still need to be created.

## Open Questions

- Should the claim review browser support per-example comments instead of only decision-card comments?
- Which remaining contract claims are developer-facing proof work rather than user-facing product claims?
- Which remaining human-confirm claims are concrete enough for deterministic proof without more maintainer discussion?
