# HITL Terminology Drift Retro
Date: 2026-05-08

## Context

The session reviewed and rewrote user-facing Cautilus specs through HITL.
The user repeatedly corrected terminology and workflow drift: `cautilus-agent` naming, avoiding strong Specdown coupling, showing rewritten chunks after edits, showing full target docs after all chunks, and preferring command surfaces such as `claim discover` over "the binary" in user-facing specs.

## Evidence Summary

- Current worktree changes include `docs/specs/user/claim-discovery.spec.md`, `docs/specs/user/doctor-readiness.spec.md`, HITL runtime state, and refreshed find-skills artifacts.
- Recent commits include `2b3ea32 Rename bundled skill to Cautilus Agent`, `b14707a Remove specdown from doctor readiness`, and `0d04dfc Drop retired specdown regression assertions`.
- The current handoff already says each chunk should show source text and actual focused command output.
- The HITL skill contract does not explicitly require full-document readback after all chunks or showing rewritten text immediately after a rewrite request.

## Waste

- The same product-language decisions had to be corrected multiple times because they lived as chat feedback and scratchpad notes, not as an active pre-edit checklist.
- I treated local phrase fixes as isolated edits instead of scanning the whole affected chunk for the same vocabulary class.
- I advanced the HITL loop after edits by reporting verification, but did not consistently show the changed chunk, which made the user carry review state.
- I used maintainer/internal language in user-facing prose because the implementation evidence was nearby and pulled the writing back toward code structure.
- I opened follow-up issues only after the user named the workflow gap, instead of noticing that the HITL loop itself was failing its review contract.

## Critical Decisions

- `cautilus-agent` is the skill surface name; user-facing docs should introduce concrete CLI command plus `cautilus-agent` skill at first mention.
- Generic readiness should not require Specdown.
- In user-facing specs, prefer `claim discover`, `claim show`, or `cautilus claim` command surfaces over "the binary".
- HITL should show changed chunk text after a rewrite request before advancing.
- HITL should show the full updated target or target scope after all chunks are reviewed.

## Expert Counterfactuals

- A DDD lens would have forced a ubiquitous-language pass before each edit: identify the bounded context, list allowed terms for that context, and reject drift such as "the binary" in a user-facing story.
- A checklist-engineering lens would have turned accepted review rules into a small pre-edit gate: before patching, scan the target chunk for forbidden or risky terms, then after patching show the changed chunk and run the focused check.

## Next Improvements

- Workflow: before editing a HITL chunk, run a short "active rules" pass from `rules.yaml` and scratchpad agreements, then state which rules apply to this chunk.
- Workflow: after editing a HITL chunk, always show the changed chunk before asking to continue.
- Workflow: when a term is corrected, scan the current chunk and same target document for the old term class before stopping.
- Capability: update Charness HITL so rewritten chunks and whole-target readbacks are first-class states rather than operator memory.
- Memory: keep the user-facing terminology rule in the current HITL runtime and carry it into future user-spec reviews.

## Persisted

Pending persistence through the retro helper.
