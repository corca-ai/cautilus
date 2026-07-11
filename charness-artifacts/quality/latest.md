# Quality Review
Date: 2026-07-11
Title: Fifth autonomous improvement and v0.19.3 preparation

## Scope

Target boundary: accumulated `v0.19.3` patch across scenario input correctness, truthful failure diagnostics, deployment CLI hygiene, isolated coverage economics, and release readiness.

Ambient repo findings: standing gates are green; 47 historical claim-evidence warnings remain policy-deferred, and no proof-preserving specdown optimization seam was found.

## Current Gates

- Read-only quality, focused Go/Node owner tests, Go race, eslint, full coverage, coverage floors, and debug/critique validators passed during implementation.
- Release preparation synchronized all five versioned surfaces and packaged Agent parity.
- Final exact-tree pre-push, hooks, on-demand, requested-review, fresh-checkout, dry-run, and public gates remain the release boundary.

## Runtime Signals

- runtime source: structured metrics from `.charness/quality/runtime-signals.json` rendered by `render_runtime_summary.py`; profile `local-verify`.
- runtime hot spots: `lint · specs` 16.1s latest / 16.0s median against 35.0s; standard coverage 4.1s latest / 3.9s median against 10.0s.
- coverage gate: passed with 198 files; 144 floors, 25 warning-band files, and no floor failure after the new buffered floors.
- evaluator depth: deterministic gates only because no Agent prompt, packaged skill behavior, provider route, or live evaluator contract changed.

## Healthy

- Both Go scenario consumers and the maintained JavaScript producer reject malformed registry/coverage shape and numeric domains consistently while preserving missing-field compatibility.
- Artifact prune, Agent overwrite, command capture, and command startup failures cannot claim success without required durable effects and actionable one-line causes.
- Deployment executables reject malformed values before mutation and sanitize syntax, semantic, and path-controlled write failures without leaking Node stacks.
- Standard and detailed coverage commands retain isolated report ownership, wait for both producers, and aggregate only successful fresh reports.
- Release surface packet, manifest sync, publisher policy, and parent-delegated release critique are ready for the exact-tree gate.

## Weak

- Claim-evidence audit remains warning-only with 26 historical hash mismatches and 21 unreadable checked-in objects.
- Local coverage timings have strong cache/order effects and cannot support a portable or global speed percentage.
- The public release-notes asset remains provenance-focused rather than the full operator narrative.

## Missing

- Public `v0.19.3` workflow, asset/checksum, install/update, and attestation proof cannot exist until ordered publication.
- No native macOS run is available under the current release adapter; Linux/current-host evidence must not be generalized.
- No repo-wide CLI side-effect probe contract exists; reproduced mutating commands instead carry direct process/filesystem sentinels.

## Deferred

- Historical claim-evidence classification requires a provenance-policy slice before enforcement changes.
- Public operator-notes redesign and macOS/adapter policy reconciliation remain separate release-infrastructure decisions.
- Dominant specdown optimization remains deferred without a proof-preserving seam.

## Advisory

- structural review result: artifact: the owning goal shows the capability needed is trustworthy malformed-input refusal and actionable failure evidence; existing owner tests and release helpers are the current centers, so changes strengthened those centers without a new gate family.
- prose review result: command: Cautilus Agent trigger boundaries and progressive disclosure are unchanged according to packet parity and skill-disclosure gates, so Agent refresh claims remain out of scope.
- command: Node isolation experiments remained slower than the default and leaked main-guard output, so shared-process mode was rejected.

## Delegated Review

- Delegated Review: executed — one parent-delegated high-leverage reviewer triaged candidates and reviewed every implementation slice; two release angles plus one separate counterweight produced the final release critique.
- Slow-gate lenses (fixture-economics, parallel-critical-path, duplicated-proof): parallel critical path was implemented only for isolated coverage producers with measured local proof; fixture and duplicated-proof changes were rejected for lack of evidence.

## Commands Run

- quality planner, runtime summary, standing-test economics, structural waste, CLI side-effect, lint-ignore, skill-ergonomics, and dead-code inventories
- focused old-code reproductions, Go/Node tests, race, eslint, coverage/floor, and artifact validators
- release planner, surface packet, publisher policy, preparation, critique packet, and dry-run planning

## Recommended Next Quality Moves

- active exact-tree release proof — capability_needed=publish only reviewed state; next_center=repo-owned ordered publisher; transformation=run post-prepare local/fresh-checkout gates then workflow/assets/install/attestation readbacks; proof_boundary=public `v0.19.3` plus install and provenance; enforcement_posture=existing-gate-reuse.
- passive claim-warning classification — capability_needed=trustworthy historical evidence provenance; next_center=47 warning records; transformation=classify source state before policy escalation; proof_boundary=immutable evidence objects and current audit; enforcement_posture=no-gate because classifications do not yet exist.

## History

- [Second autonomous improvement](2026-07-11-second-autonomous-improvement.md)
- [2026-05-10 quality review](2026-05-10-quality-review.md)
- [2026-04-22 quality review](history/2026-04-22.md)
