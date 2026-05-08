# Recent Retro Lessons

## Current Focus

- The session reviewed and rewrote user-facing Cautilus specs through HITL. (source: `charness-artifacts/retro/hitl-terminology-drift.md`)
- One continuous session that started with `/init-repo` + `/quality`, produced 17 commits including coverage-floor gate introduction, evaluate-skill split, gitleaks wiring, Node coverage driver swap (to `c8`), two charness issues (#70, #71), one debug artifact, and the v0.12.3 release. (source: `charness-artifacts/retro/2026-04-24-debug-first-and-measurement-gates.md`)

## Repeat Traps

- I advanced the HITL loop after edits by reporting verification, but did not consistently show the changed chunk, which made the user carry review state. (source: `charness-artifacts/retro/hitl-terminology-drift.md`)
- I opened follow-up issues only after the user named the workflow gap, instead of noticing that the HITL loop itself was failing its review contract. (source: `charness-artifacts/retro/hitl-terminology-drift.md`)
- I treated local phrase fixes as isolated edits instead of scanning the whole affected chunk for the same vocabulary class. (source: `charness-artifacts/retro/hitl-terminology-drift.md`)
- I used maintainer/internal language in user-facing prose because the implementation evidence was nearby and pulled the writing back toward code structure. (source: `charness-artifacts/retro/hitl-terminology-drift.md`)

## Next-Time Checklist

- Capability: update Charness HITL so rewritten chunks and whole-target readbacks are first-class states rather than operator memory. (source: `charness-artifacts/retro/hitl-terminology-drift.md`)
- Memory: keep the user-facing terminology rule in the current HITL runtime and carry it into future user-spec reviews. (source: `charness-artifacts/retro/hitl-terminology-drift.md`)
- Workflow: after editing a HITL chunk, always show the changed chunk before asking to continue. (source: `charness-artifacts/retro/hitl-terminology-drift.md`)
- Workflow: before editing a HITL chunk, run a short "active rules" pass from `rules.yaml` and scratchpad agreements, then state which rules apply to this chunk. (source: `charness-artifacts/retro/hitl-terminology-drift.md`)

## Selection Policy

- Source: `charness-artifacts/retro/lesson-selection-index.json`
- Slots: current_focus=2, repeat_trap=4, next_improvement=4
- Policy: advisory recency half-life 14 days plus recurrence boost with adaptive alpha.

## Sources

- `charness-artifacts/retro/2026-04-24-debug-first-and-measurement-gates.md`
- `charness-artifacts/retro/hitl-terminology-drift.md`
