# HITL Scratchpad: hitl-20260507-085934

- Updated: 2026-05-07T08:59:34+00:00
- Target: docs/specs/user/claim-discovery.spec.md
- Base Ref: main
- Scope: claim-discovery-spec-rewrite
- Apply Mode: explicit-after-all-chunks

## Agreements

- Review target is the rewritten `docs/specs/user/claim-discovery.spec.md`, not approval to execute Cautilus eval.
- The spec should not rely on prose that is tightly coupled to the prior chat discussion.
- Discovery extraction should be example-driven: source signal, extracted candidate, source refs, filtering, and de-duplication should be visible.
- Actor ownership must stay explicit: `claim discover` extracts and de-duplicates, `claim show` summarizes next-work buckets, and the bundled skill curates the saved packet through an agent-facing workflow.
- The dev/skill curation proof must remain prepared but not claimed as passed until the direct Cautilus eval is explicitly approved and run.
- Accepted `claim-discovery-purpose-and-actor-map`: the opening states the user value and actor split clearly enough to proceed.

## Open Questions

- Does the rewritten opening now make Claim Discovery feel like a user-valuable story rather than an internal implementation note?

## Closeout

- HITL closed after applying feedback to code and `docs/specs/user/claim-discovery.spec.md`.
- Internal terms were reduced in the user-facing spec: `proof-plan`, `non-verdict boundary`, `packet`, `bucket`, and `de-dup` are replaced or translated where they were confusing.
- Code now exposes discovery heuristic families under `discoveryEngine.heuristics`.
- `TestDiscoverClaimProofPlanUsesCandidateHeuristicsTogether` proves filtering, classification, and duplicate sentence merging together.
- The prepared skill-evaluation fixture now explicitly asks for extraction heuristics and next-action groups.
- Current chunk feedback: `non-verdict boundary` and `proof-plan` are unclear internal terms for the user-facing spec. Candidate replacement direction: say directly that discovery creates candidates, and a discovered claim is not verified until evidence is attached.
- Accepted wording direction for `claim-discovery-boundary-and-non-verdict`: use `A user can audit where candidates came from.` and prose like `Discovery creates candidates. A discovered claim is not treated as verified until matching evidence is attached.`
- Current chunk feedback for `claim-discovery-extraction-examples`: examples are good, but `signal used by` is ambiguous because it looks like an extracted field even though it is explanatory prose. The section should say whether examples are representative or complete. It should remove or translate internal terms such as `packet`, `proof route`, `readiness`, `deterministic`, `ready-for-proof`, `cautilus-eval`, `needs-scenario`, and `de-dup`.
- Accepted direction for extraction rewrite: lead with "Cautilus uses these heuristics to create candidates" rather than "A user can audit extraction"; separate actual output fields from author explanation; show duplicate handling as "N source lines -> 1 candidate with multiple source refs"; preserve concrete examples but make the heuristic coverage explicit.
- Added extraction rewrite requirement: the spec should show evidence that the actual heuristic functions are used together, not just assert them. Prefer an executable truthy check over several function-existence greps if the implementation already exposes or can cheaply expose a combined heuristic test surface.
- Added duplicate-handling rewrite requirement: show duplicate handling at the sentence level, for example two identical source sentences in `README.md` and `AGENTS.md` becoming one candidate with two source refs.
- Accepted `claim-discovery-next-work-buckets` actor boundary: `claim show` owns the summary after discovery. Needs wording cleanup: translate internal bucket/proof-plan vocabulary and separate full possible next-action categories from the categories present in this repo's current output.
