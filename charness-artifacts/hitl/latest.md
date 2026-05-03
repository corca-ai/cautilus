# HITL Review: executable claim spec tree
Date: 2026-05-03

## Target

[docs/specs/user/index.spec.md](../../docs/specs/user/index.spec.md), [docs/specs/maintainer/index.spec.md](../../docs/specs/maintainer/index.spec.md), the per-claim spec pages under `docs/specs/user/`, and the refreshed Cautilus claim packets.

## Goal

Use maintainer review to approve the executable claim spec tree before spending more time on raw sentence candidates.
Raw `claim discover` output remains the source-ref-backed proof-planning input.
The human-facing review target is now the user-facing and maintainer-facing spec indexes plus per-claim spec pages.

## Accepted Rules

- Dense Markdown tables are not an acceptable primary HITL review surface.
- Show claim review as cards with source, claim text, reason for asking, and a small decision menu.
- Do not pick HITL chunks by report row order.
- Prioritize items that can change the next implementation move: unclear wording, likely false positives, likely non-user-facing claims, and ambiguous proof routes.
- `docs/specs/*.spec.md` is not ordinary prose claim source for this review.
- Executable specs should be treated as proof or evidence context for public claims, not as human-confirm prose claims.
- `docs/maintainers/**` is not user-facing.
- Maintainer evidence notes should be excluded from user-facing claim review or relabeled as internal evidence.
- Raw sentence candidates are not the primary human review surface once the decision is product meaning, duplication, audience alignment, or next-action grouping.
- User-facing canonical claims must use plain product language.
- Maintainer-facing canonical claims may use internal terms, but each maintainer claim must map back to user-facing claim ids.
- The active spec tree is manually maintained or review-applied source, not a volatile generated report block.
- `docs/specs/user/index.spec.md` is the user-facing SOT; `docs/specs/maintainer/index.spec.md` is the maintainer-facing SOT.
- `docs/specs/index.spec.md` is the executable report entry that links both indexes.
- `docs/specs/old/**` is archival implementation-spec material and should not be reviewed as active claim source.
- `docs/claims/user-facing.md` and `docs/claims/maintainer-facing.md` are superseded by the spec tree and should be treated as historical planning context until a later cleanup slice removes or absorbs them.
- `specdown` is a hard prerequisite for the public Cautilus claim-document workflow, not a nice-to-have peer dependency.

## Decisions Applied

- Added `docs/specs/**` and `docs/maintainers/**` to this repo's `claim_discovery.exclude`.
- Kept `docs/specs` as an evidence root in contract examples, preserving the proof-source role.
- Regenerated claim packets after committing the source-boundary change so packet git state points at the source-boundary commit.
- Filtered existing review results while reapplying them to the new claim map so updates for removed claim ids do not block remaining reviewed evidence.
- Accepted `claim-skills-cautilus-skill-md-112` as the human-reviewed false-negative boundary for entry-doc and linked-Markdown discovery.
- Accepted `claim-skills-cautilus-skill-md-118` as a real constrained-terminal browser-review path and reclassified it for deterministic/browser-runtime proof.
- Accepted `claim-docs-contracts-adapter-contract-md-424` as user-facing because Cautilus users include adapter authors and repo operators; reclassified it as deterministic proof work and set `claimAudience=user` through a review-result update.
- Accepted that `human-auditable` must not mean human-only or evidence-free.
  Human judgment may approve framing or proof route, but satisfaction still requires at least one concrete support item, or the claim should be split/deferred.
- Accepted `claim-docs-contracts-claim-discovery-workflow-md-156` as deterministic proof work for selected claim-map behavior.
- Accepted `claim-docs-contracts-claim-discovery-workflow-md-229` as an overclaim-prevention rule that still needs deterministic supporting proof before satisfaction.
- Accepted the current `claim-skills-cautilus-skill-md-68` as a user-facing skill-routing claim that should be proven with a dev/skill eval fixture.
  This is the post-removal "Use this path when..." claim, not the removed numbered-branch policy that previously occupied nearby line-based ids.
- Accepted `claim-docs-contracts-claim-discovery-workflow-md-603` as deterministic proof work for the binary/skill boundary, while keeping host prompts and adapters outside the Cautilus product boundary.
- Accepted `claim-docs-contracts-live-run-invocation-md-58` as deterministic proof work for the `persona_prompt` loop boundary, packet shape, persona prompt shaping, result normalization, and adapter-owned backend command handoff.
- Rejected the overbroad wording that the bundled skill generally owns LLM review and subagent orchestration.
  The accepted replacement is scoped to claim discovery: the bundled skill owns LLM-backed claim review, review-budget explanation, and subagent orchestration for the claim discovery workflow.
  `eval` and `optimize` may still orchestrate model-involving behavior through adapter-owned runners.
- Accepted `claim-docs-contracts-claim-discovery-workflow-md-565` as dev/skill eval proof work for explicit review-budget confirmation before LLM-backed claim review.
- Added `npm run claims:apply-review-results` so historical review-result packets are filtered to the current claim IDs before replay.
  This preserves audit history on disk without making stale IDs a trap for the next claim refresh.
- Removed the overfit no-input `nextBranches` execution policy from the bundled, packaged, and repo-local Cautilus skill bodies.
  The removed numbered-branch policy is no longer a proof target.
- Added fingerprint guards to the skill-line HITL review results so historical line-based claim IDs cannot silently apply to a different current claim after prose is inserted or removed.
- Accepted `claim-docs-contracts-claim-discovery-workflow-md-663` as deterministic proof work for review-input budget behavior.
- Accepted `claim-docs-contracts-runner-readiness-md-198` as deterministic proof work.
  One shared runner-readiness drift test is sufficient if `doctor` and `agent status` use the same assessment logic.
- Added canonical claim catalogs under `docs/claims/`.
- Linked the user-facing and maintainer-facing claim catalogs from README quick links.
- Updated the bundled Cautilus skill contract so raw candidates are treated as high-recall proof-planning inputs and catalog curation happens before broad HITL.
- Added exact audience hints for the two catalog documents in `.agents/cautilus-adapter.yaml`.
- Tightened the README wording so the claim catalog is the product promise map and the public spec report is executable proof for selected promises.
- Moved bundled skill docs from the `user` audience hint to the `developer` audience hint so agent instruction prose does not inflate user-facing claim counts.
- Added catalog-level evidence status, next action, and absorbed-theme fields to the maintainer-facing catalog.
- Added `.cautilus/claims/canonical-claim-map.json` so the U/M catalog compression is machine-auditable instead of only prose.
- Updated `.cautilus/claims/claim-status-report.md` to show canonical catalog coverage before raw action buckets.
- Reordered the user-facing catalog by product jobs:
  `claim`, `eval`, `optimize`, then `doctor` as the main readiness support surface, followed by supporting ownership, agent, artifact, surface, and proof-debt promises.
- Replaced the former cross-cutting U0-style bucket with a short noncanonical introduction.
  Proof-bearing promises must still appear in numbered U1-U9 claims.
- Clarified that `doctor` readiness means the selected Cautilus surface can run; it does not prove repo behavior claims by itself.
- Updated the skill and workflow contract so this order is Cautilus-specific.
  Consumer repos should derive their own top user jobs from adapter `semantic_groups`, source-doc headings, declared product surfaces, and README or guide structure instead of copying Cautilus command names.
- Promoted the curated promise map into executable specdown pages:
  [docs/specs/user/index.spec.md](../../docs/specs/user/index.spec.md), per-claim pages under `docs/specs/user/`, [docs/specs/maintainer/index.spec.md](../../docs/specs/maintainer/index.spec.md), and [docs/specs/index.spec.md](../../docs/specs/index.spec.md).
- Moved previous implementation specs to `docs/specs/old/**`.
- Changed `specdown.json` so the executable report entry is [docs/specs/index.spec.md](../../docs/specs/index.spec.md).
- Added a repo-local specdown adapter at `scripts/specdown/cautilus-adapter.mjs` for executable `check:cautilus-command` evidence.
- Added `specdown_available` readiness checks to repo and agent-surface doctor output.
- Updated the bundled Cautilus skill so it treats the spec tree as the active SOT for curated claim docs.

## Current Packet Snapshot

- Packet source commit: cf91bf29b47a9b6a2a439659e283773436e6ec18.
- Candidate count: 310.
- Source count: 25.
- `docs/specs/**` source count: 0.
- `docs/maintainers/**` source count: 0.
- Candidates sourced from excluded specs or maintainer docs: 0.
- Agent-reviewed claims carried forward: 67.
- Human-reviewed claims: 6.
- Satisfied claims carried forward: 15.
- User-facing claims: 84.
- User-facing raw claims mapped to U1-U9: 84.
- User-facing raw claims not mapped to U1-U9: 0.
- User-facing mappings recommended for semantic sampling: 57.
- U1-U9 absorption counts: U1=2, U2=10, U3=2, U4=17, U5=25, U6=7, U7=6, U8=11, U9=4.

## Next HITL Queue

Review [docs/specs/user/index.spec.md](../../docs/specs/user/index.spec.md) first, then the per-claim pages under `docs/specs/user/`.
Decide whether the first-reader order is right:
claim discovery, evaluation, optimization, doctor/readiness, then supporting ownership, artifact, and proof-debt promises.
Check that each page is readable as user-facing product language while still leaving honest proof debt visible.

Then review [docs/specs/maintainer/index.spec.md](../../docs/specs/maintainer/index.spec.md).
Decide whether it is enough as an index for the next slice, or whether the maintainer tree needs one page per internal claim area before raw claim review resumes.

The canonical map is heuristic and should not be treated as human-approved compression yet.
After the next fresh `claim discover`, sample the medium/low-confidence mappings called out in `.cautilus/claims/canonical-claim-map.json`, especially the larger claim, eval, and ownership buckets.

After catalog review, return to action-bucket review only for claims that are not absorbed by the canonical catalogs:
`.cautilus/claims/review-input-human-align-action-bucket.json`, `.cautilus/claims/review-input-split-or-defer-action-bucket.json`, and `.cautilus/claims/review-input-human-confirm-action-bucket.json`.

## Open Questions

- Should the claim review browser support per-example comments instead of only decision-card comments?
- Should the historical `docs/claims/*` pages be deleted after their useful content is absorbed into the spec tree, or kept as archived planning context?
- Which user-facing spec pages should receive real executable proof first beyond command-surface smoke checks?
- Which remaining raw candidates are not absorbed by U1-U9 or M1-M10 and still need separate review?
