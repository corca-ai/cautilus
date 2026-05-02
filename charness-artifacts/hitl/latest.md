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
- Accepted `claim-docs-contracts-claim-discovery-workflow-md-603` as deterministic proof work for the binary/skill boundary, while keeping host prompts and adapters outside the Cautilus product boundary.
- Accepted `claim-docs-contracts-live-run-invocation-md-58` as deterministic proof work for the `persona_prompt` loop boundary, packet shape, persona prompt shaping, result normalization, and adapter-owned backend command handoff.
- Rejected the overbroad wording that the bundled skill generally owns LLM review and subagent orchestration.
  The accepted replacement is scoped to claim discovery: the bundled skill owns LLM-backed claim review, review-budget explanation, and subagent orchestration for the claim discovery workflow.
  `eval` and `optimize` may still orchestrate model-involving behavior through adapter-owned runners.
- Accepted `claim-docs-contracts-claim-discovery-workflow-md-565` as dev/skill eval proof work for explicit review-budget confirmation before LLM-backed claim review.
- Added `npm run claims:apply-review-results` so historical review-result packets are filtered to the current claim IDs before replay.
  This preserves audit history on disk without making stale IDs a trap for the next claim refresh.

## Current Packet Snapshot

- Candidate count: 265.
- Source count: 23.
- `docs/specs/**` source count: 0.
- `docs/maintainers/**` source count: 0.
- Candidates sourced from excluded specs or maintainer docs: 0.
- Agent-reviewed claims carried forward: 79.
- Human-reviewed claims: 10.
- Satisfied claims carried forward: 16.
- User-facing claims: 69.

## Next HITL Queue

Continue with readable cards from `.cautilus/claims/review-input-human-confirm-action-bucket.json` and `.cautilus/claims/review-input-human-align-action-bucket.json`.

The prior ten human-reviewed cards have been applied and should not be asked again.
Start with claims that test whether the remaining human-confirm and human-alignment items are true alignment blockers, evidence-backed proof work, or developer-only contract detail:

- `claim-docs-contracts-claim-discovery-workflow-md-663`: already satisfied and already reviewed non-stale claims are excluded from review clusters by default so reviewer budget stays focused on unresolved heuristic claims while carried evidence and prior decisions remain auditable under `skippedClaims`.
- `claim-docs-contracts-runner-readiness-md-198`: if the current git commit differs from `repoCommit` but the adapter and listed runner file hashes still match, `doctor` and `agent status` should expose the drift as assessment provenance without marking the assessment stale.
- `claim-skills-cautilus-skill-md-67` and `claim-skills-cautilus-skill-md-68`: the Cautilus skill must rerun `agent status` before state-mutating branch execution, with a narrow refresh-plan exception.

## Open Questions

- Should the claim review browser support per-example comments instead of only decision-card comments?
- Which remaining contract claims are developer-facing proof work rather than user-facing product claims?
- Which remaining human-confirm claims are concrete enough for deterministic proof without more maintainer discussion?
