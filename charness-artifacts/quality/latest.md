# Quality Review
Date: 2026-07-11

## Scope

Target boundary: third autonomous improvement pass and prepared `v0.19.2` bundle across correctness, mutation safety, direct testability, focused test economics, and release readiness.

Ambient repo findings: standing gates were green before implementation; claim evidence retains warning-only historical debt, and no proof-preserving specdown optimization seam was found.

## Current Gates

- `./scripts/run-quality.sh --read-only`
- focused Go and Node owner tests plus eslint
- `npm run hooks:check`
- `npm run verify`
- `npm run security:secrets:history`
- `npm run release:publisher-policy:check`
- `npm run test:on-demand`
- release surface packet and fresh-checkout probes

## Runtime Signals

- runtime source: structured metrics from `.charness/quality/runtime-signals.json` rendered by the quality planner; profile `local-verify`, plus six direct before/after focused-suite measurements.
- runtime hot spots: pre-implementation `lint · specs` was 16.08s latest / 15.98s median against 35.0s; final prepared-tree verify completed in 58.99s with lint specs at 17.89s and Go race at 15.16s.
- coverage gate: prepared-tree verify passed at 65.4% combined statement coverage; coverage-floor reported 141 floored, 25 warn-band, 42 cleared drift-lock, and no failure.
- evaluator depth: deterministic gates only because all selected defects are encoding, filesystem, parser, and packet-construction invariants; no provider or model behavior changed.

## Healthy

- Go and Node review producers preserve Unicode code-point prefixes and now fail closed with a path-bearing error when a captured-present consumer prompt becomes unreadable.
- Node active-run optional paths treat semantic emptiness as absent while retaining non-empty path identity.
- `workspace-start`, `prepare-compare-worktrees`, and `prune-workspace-artifacts` reject malformed required values before filesystem, Git metadata, or recursive-deletion side effects.
- Direct Go active-run tests cover explicit, active, automatic, manifest, missing-target, and non-directory behavior without CLI-smoke indirection.
- Prepared `0.19.2` gates, requested-review posture, release surface packet, and declared fresh-checkout probes pass.

## Weak

- Claim evidence audit remains warning-only with 47 historical checked-in evidence warnings: 26 hash mismatches and 21 unreadable objects.
- The maintainer-installed binary was `0.18.0` while the prepared repo binary reported `0.19.2`; post-publish install refresh must close this skew.
- The generated public release-notes asset is provenance-heavy and does not carry the full operator story from the checked-in release record.

## Missing

- Public `v0.19.2` workflow, asset, checksum, attestation, and install readback proof cannot exist until ordered tag publication.
- No safe dominant-specdown speed change was established, and no total verification speedup is claimed.
- No executable repo-wide CLI side-effect contract exists; concrete mutation sentinels now protect the three reproduced entrypoints.

## Deferred

- Public release-note pipeline redesign is deferred because it does not protect this patch and would reopen release infrastructure.
- Historical claim-evidence warning classification remains a provenance-policy slice, not an automatic warning-to-error conversion.
- The 7,237-line CLI smoke file split remains deferred because a mechanical split would add churn without a current failure or runtime proof.
- Grapheme, token-budget, and raw leading-dash value escape semantics remain outside the current contracts.

## Advisory

- structural review result: command: quality planner and inventories found zero structural-waste, dual-implementation, lint-ignore, dead-code, or command-registry findings; selected work stayed at reproduced producer/consumer boundaries.
- prose review result: artifact: release critique required binary/source-checkout audience separation and explicit consumer-prompt recovery because the packaged Agent parity packet showed no behavior migration.
- test isolation experiment: command: shared-process Node mode took 15.42s and 15.34s versus isolated 4.87s cold and 1.67s warm and leaked a CLI main-guard stack trace, so the standing isolation contract was retained.
- focused fixture economics: command: `prepare-compare-worktrees` median changed from 1.85s to 1.57s by reusing one immutable Git repo while preserving sequential unique sandboxes, worktree-state checks, and regression cleanup.

## Delegated Review

- Delegated Review: executed — a parent-delegated high-leverage reviewer triaged candidates, reviewed every implementation slice, and returned final `READY` verdicts after concrete should-fixes; all final shared-tree fingerprints were clean.
- Release critique: executed — Gawande operational and Minto/Raskin first-contact angles plus a separate counterweight produced `charness-artifacts/critique/2026-07-11-v0-19-2-release-critique.md`.
- Slow-gate lenses: fixture-economics=implemented with measured proof; parallel-critical-path=rejected after shared-process measurement; duplicated-proof=rejected because specdown run and strict trace carry distinct contracts.
- Reviewer tier: high-leverage was requested; the host defaulted execution and did not expose application metadata.

## Commands Run

- read-only quality planner, runtime summary, standing-test economics, structural waste, brittle-source, dual-implementation, dead-code, CLI, skill, and claim-evidence inventories
- focused old-code reproductions, Go tests/coverage, Node owner suites, eslint, debug/goal/critique validators, and reviewer-boundary snapshot/verify
- `npm run hooks:check`, `npm run verify`, `npm run security:secrets:history`, `npm run release:publisher-policy:check`, and `npm run test:on-demand`
- `npm run critique:surface-packet:check` and release fresh-checkout probes with `--run-probes`

## Recommended Next Quality Moves

- active post-publish release proof — capability_needed=operator-install confidence; next_center=`v0.19.2` GitHub workflow and installed-version readback; transformation=verify assets/checksums/attestations then refresh the maintainer install; proof_boundary=repo-owned publisher plus install smoke; enforcement_posture=release blocker until public and distinct-channel proof pass.
- passive claim-evidence provenance triage because warning records need source classification before policy changes; capability_needed=trustworthy historical evidence references; next_center=47 warning records; transformation=classify stale bundles without changing warn semantics; proof_boundary=current audit plus immutable objects; enforcement_posture=no-gate because classifications do not yet exist.
- passive public-note role review because the current asset is valid provenance but thin operator communication; capability_needed=durable public release narrative; next_center=release-notes workflow template; transformation=decide whether to embed target scope or explicitly name the checked-in narrative; proof_boundary=release workflow contract tests; enforcement_posture=no-gate because this patch retains an honest checked-in release record.

## History

- [Second autonomous improvement](2026-07-11-second-autonomous-improvement.md)
- [2026-05-10 quality review](2026-05-10-quality-review.md)
- [2026-04-22 quality review](history/2026-04-22.md)
