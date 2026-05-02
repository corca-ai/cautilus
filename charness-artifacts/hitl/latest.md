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
- Accepted that `human-auditable` must not mean human-only or evidence-free.
  Human judgment may approve framing or proof route, but satisfaction still requires at least one concrete support item, or the claim should be split/deferred.
- Accepted `claim-docs-contracts-claim-discovery-workflow-md-156` as deterministic proof work for selected claim-map behavior.
- Accepted `claim-docs-contracts-claim-discovery-workflow-md-229` as an overclaim-prevention rule that still needs deterministic supporting proof before satisfaction.
- Accepted `claim-skills-cautilus-skill-md-74` as a user-facing skill-routing claim that should be proven with a dev/skill eval fixture.

## Current Packet Snapshot

- Candidate count: 265.
- Source count: 23.
- `docs/specs/**` source count: 0.
- `docs/maintainers/**` source count: 0.
- Candidates sourced from excluded specs or maintainer docs: 0.
- Agent-reviewed claims carried forward: 77.
- Human-reviewed claims: 6.
- Satisfied claims carried forward: 15.
- User-facing claims: 69.

## Next HITL Queue

Continue with readable cards from `.cautilus/claims/review-input-human-confirm-action-bucket.json` and `.cautilus/claims/review-input-human-align-action-bucket.json`.

The prior six cards have been applied and should not be asked again.
Start with claims that test whether the remaining human-alignment items are true alignment blockers or can become evidence-backed proof work:

- `claim-docs-contracts-claim-discovery-workflow-md-602`: binary/skill boundary stays clean enough that consumer repos can use the binary plus bundled skill without Cautilus importing host-specific prompts or adapters.
- `claim-docs-contracts-live-run-invocation-md-58`: for `persona_prompt`, the product owns the loop boundary, request packet, persona prompt shaping, and result normalization.
- `claim-docs-contracts-claim-discovery-workflow-md-560`: the bundled skill owns LLM review and subagent orchestration.

## Open Questions

- Should the claim review browser support per-example comments instead of only decision-card comments?
- Which remaining contract claims are developer-facing proof work rather than user-facing product claims?
- Which remaining human-confirm claims are concrete enough for deterministic proof without more maintainer discussion?
