# HITL Review: README, AGENTS, and Claim Specs
Date: 2026-05-05

## Target

- [README.md](../../README.md)
- [AGENTS.md](../../AGENTS.md)
- [docs/specs/user/index.spec.md](../../docs/specs/user/index.spec.md) and user claim pages
- [docs/specs/maintainer/index.spec.md](../../docs/specs/maintainer/index.spec.md) and maintainer proof-area pages

## Goal

Use human judgment to decide whether the four reader-facing surfaces now tell one coherent product story.
The desired final state is that a maintainer can review these four surfaces and be satisfied that Cautilus's product promises, proof boundaries, and remaining evidence gaps are understandable without reading raw claim packets first.

## Accepted Rules

- README is the first product narrative.
  It should point readers to the claim specs quickly and should not make raw packets or archived proof specs feel like the primary review surface.
- AGENTS.md is the repo operating contract.
  It should route agents to the current source of truth and should avoid copying detailed product catalogs that belong in specs or skills.
- User-facing specs are the promise map.
  They should use plain product language, ordered by the reader's mental model: claim discovery, evaluation, optimization, doctor/readiness, ownership, reviewable artifacts, and proof debt.
- Maintainer-facing specs are the proof map.
  They may use internal vocabulary, but each page must map back to the U-claim ids in the user-facing index and must expose evidence or explicit evidence gaps.
- Raw `claim discover` packets are high-recall proof-planning inputs, not the primary human review surface for product meaning.
- Evidence gaps are acceptable only when they name a concrete owner and next action.
- Dense tables are not an acceptable primary HITL review surface.
  If a generated packet or matrix matters, present the decision first and keep the raw structure as evidence.

## Current Pre-HITL Cleanup

- Added U-claim ids to [docs/specs/user/index.spec.md](../../docs/specs/user/index.spec.md), matching the `Aligned user claims` references used by maintainer pages.
- Clarified that unevidenced work appears as explicit evidence gaps, not empty subclaims or vague proof-debt placeholders.
- Added maintainer-index guidance explaining that maintainer pages should be read after the user-facing index and that `Aligned user claims` refers to U-claim ids.
- Tightened README wording so each claim page pairs a bounded promise with executable evidence or an explicit evidence gap.

## Review Queue

1. README first-reader pass.
   Decision: does the README quickly communicate what Cautilus is, why `claim/eval/optimize` matter, and where the curated spec SOT lives?
2. User spec index and U-claim pages.
   Decision: are U1-U7 the right user-facing promise set, in the right order, with plain enough wording?
3. Maintainer spec index and proof-area pages.
   Decision: does the maintainer tree give enough internal proof routing without becoming a raw implementation dump?
4. AGENTS.md operating contract.
   Decision: does it tell future agents how to work in this repo without duplicating or drifting from README/specs/skills?

## Known Risks To Ask About

- README is still long and mixes quick-start, scenario proposal, claim workflow, eval surfaces, and older normalization-family examples.
  It may need a stronger first-screen path to the current claim spec SOT.
- Some README links still point at archived `docs/specs/old/**` pages as historical context.
  That may be acceptable, but a human should confirm whether it distracts from the active spec tree.
- Maintainer specs are now structurally consistent, but several pages still have `Evidence Gaps`.
  HITL should decide whether those gaps are acceptable as honest proof debt before more implementation work starts.
- AGENTS.md is operationally useful but may still be too long for a new agent's first read.

## Next HITL Chunk

Start with README lines 1-90 and ask whether the opening narrative plus quick links are good enough for the product's first-reader story.
Do not ask the human to review the whole README at once.
