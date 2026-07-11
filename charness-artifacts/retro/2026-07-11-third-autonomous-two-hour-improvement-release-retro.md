# Retro: Third autonomous two-hour improvement and v0.19.2 release
Date: 2026-07-11

## Mode

session

## Context

This retro reviews goal `third-autonomous-two-hour-improvement-release`: a measured autonomous pass that landed correctness, mutation-safety, direct-testability, and focused test-economics changes, then published and verified `v0.19.2`.

## Evidence Summary

- Ten goal slices record candidate selection, eight implementation commits, one rejected isolation experiment, and release closeout.
- Prepared-tree `npm run verify` passed in 58.99s; hooks, history secrets, publisher policy, on-demand tests, fresh-checkout probes, and release surface packets also passed.
- GitHub Actions run `29150460445` passed artifact build, attestations, upload, and public verification; post-workflow install and update smoke reported `0.19.2`.
- Release, quality, critique, debug, and goal artifacts separate proven behavior from warning-only and live-provider non-claims.

## Waste

The release orchestrator treated release-page HTTP 200 as sufficient readiness for an asset-dependent install readback.
That produced a predictable 404, an extra workflow-watch/retry loop, and a misleading intermediate `failed` ledger until the tag workflow attached assets.
Some fresh-eye reviews also ran longer than their bounded prompts required, so explicit stop reminders were needed; the findings remained useful, but the coordinator should request concise evidence-ranked outputs earlier.

## Critical Decisions

- Select only reproduced or measured seams, which prevented speculative specdown and coverage work from consuming the timebox.
- Keep Node process isolation after the shared-process experiment was both slower and observably contaminated by a CLI main guard.
- Treat binary and source-checkout behavior as separate release audiences, avoiding an Agent or repo-wide parser overclaim.
- Publish one coherent patch through the repo-owned ordered helper, then retain the initial install failure and close it with unchanged-command post-workflow proof rather than erasing it.
- Add the page-versus-asset readiness rule to the maintainer release contract instead of guessing whether Cautilus or generic Charness should own a retry implementation.

## Expert Counterfactuals

- John Ousterhout's complexity lens would reject a shared argument-parser abstraction until repeated policy, not merely repeated syntax, exists; the three local guards plus owner tests keep change amplification low.
- Gary Klein's premortem lens would ask which green signal can still coexist with operator failure; here the answer is a visible release page with zero assets, so the release checklist should name the later readiness signal before execution.

## Sibling Search

- same layer: release page verification and public asset verification | decision: same waste, fix now | proof: the maintainer contract now requires workflow/public verification before retrying install readback.
- abstraction up: installed Charness publisher sequencing | decision: diagnostic-only | proof: the debug artifact records the external ownership uncertainty without inventing a local generic policy.
- specialization down: Cautilus install smoke | decision: intentional boundary | proof: it correctly failed an unavailable archive and passed unchanged after publication; silent fallback would weaken proof.
- mental-model siblings: page visibility, release record visibility, and binary download readiness | decision: same waste, fix now | proof: release and debug artifacts now keep these states separate.
- reviewer coordination: bounded fresh-eye review duration | decision: diagnostic-only | proof: stop reminders produced concise verdicts, but duration varied with judgment scope and exposed no stable repo-side automation seam.

## Next Improvements

- workflow: applied — `docs/maintainers/releasing.md` now preserves an early 404, waits for both workflow jobs, reruns the same install readback, and forbids page-only readiness claims.
- capability: applied — real-process mutation sentinels now protect workspace creation, Git worktree registration, and recursive artifact pruning before malformed input crosses a side-effect boundary.
- memory: applied — release, quality, debug, and handoff pointers keep the `v0.19.2` proof and the remaining PATH-level version skew explicit.
- workflow: none — reviewer-duration variance is accepted for this run because stop reminders worked and no deterministic repo-side gate can distinguish useful judgment from unbounded exploration without false positives.

## Persisted

Persisted: yes: charness-artifacts/retro/2026-07-11-third-autonomous-two-hour-improvement-release-retro.md

Packet Consumed: n/a (no adapter sections)
