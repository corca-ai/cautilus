# Recent Retro Lessons

## Current Focus

- One continuous session that started with `/init-repo` + `/quality`, produced 17 commits including coverage-floor gate introduction, evaluate-skill split, gitleaks wiring, Node coverage driver swap (to `c8`), two charness issues (#70, #71), one debug artifact, and the v0.12.3 release. (source: `charness-artifacts/retro/2026-04-24-debug-first-and-measurement-gates.md`)

## Repeat Traps

- **Adapter side-effects accepted without review.** `bootstrap_adapter.py` wrote pytest-shaped defaults into a Node+Go adapter; I committed some of them before the user caught it. Running a charness skill's auto-write helpers without first reading the diff is the shape of waste that keeps repeating. (source: `charness-artifacts/retro/2026-04-24-debug-first-and-measurement-gates.md`)
- **Coverage floor written before a refactor that changed the layout.** I initialized `coverage-floor.json` from a measurement, then split `evaluate-skill.mjs` afterwards. CI then failed on the first bump because the floor still referenced the old file shape. The cost was two "realign floor" commits that the agenda never planned for. (source: `charness-artifacts/retro/2026-04-24-debug-first-and-measurement-gates.md`)
- **Debug skill arrived late.** AGENTS.md names `charness:debug` as the route for "any bug, error, regression, or unexpected behavior," but when coverage became non-deterministic I tried a tolerance knob first and only ran `debug` after the user asked me to. The real fix (c8) came directly from the debug flow once it was invoked; everything before it was wasted motion. (source: `charness-artifacts/retro/2026-04-24-debug-first-and-measurement-gates.md`)
- **Host-capability question asked the user.** During `release` I asked the user whether the host allows subagent spawning and whether to "skip premortem." AGENTS.md L80–84 explicitly forbids that pattern: delegation is by repo contract, and host blocks get reported, not polled. The rule was in my context but lost eyeball gravity mid-flow. (source: `charness-artifacts/retro/2026-04-24-debug-first-and-measurement-gates.md`)

## Next-Time Checklist

- Already landed: charness issues #70 (bootstrap defaults) and #71 (delegation eyeball gravity). These are the right platform-level leverage. (source: `charness-artifacts/retro/2026-04-24-debug-first-and-measurement-gates.md`)
- Before introducing any measurement-based gate (coverage, runtime budget, token cost, etc.), run the underlying measurement **three times on the same commit** and confirm drift < threshold. Only then initialize the floor/baseline and wire it into CI. Record that repeatability check as a one-liner in the gate's script header. (source: `charness-artifacts/retro/2026-04-24-debug-first-and-measurement-gates.md`)
- Consider a lightweight repo-local `scripts/check-workflow-parity.mjs` that fails when two workflow files reference the same `npm run` script but differ in tool-install lines. Low priority, revisit if this miss recurs. ### memory (source: `charness-artifacts/retro/2026-04-24-debug-first-and-measurement-gates.md`)
- The release adapter now exists (`cbf3d1f`); future release flows will see declared seams up front. (source: `charness-artifacts/retro/2026-04-24-debug-first-and-measurement-gates.md`)

## Selection Policy

- Source: `charness-artifacts/retro/lesson-selection-index.json`
- Slots: current_focus=2, repeat_trap=4, next_improvement=4
- Policy: advisory recency half-life 14 days plus recurrence boost with adaptive alpha.

## Sources

- `charness-artifacts/retro/2026-04-24-debug-first-and-measurement-gates.md`
