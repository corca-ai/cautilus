# v0.19.2 release critique
Date: 2026-07-11

## Execution

- Target: `release-critique`.
- Packet Consumed: `charness-artifacts/critique/2026-07-11-105243-packet.md`.
- Angles: Gawande operational checklist; Minto and Raskin communication and first contact; separate skeptical counterweight.

## Decision Under Review

Publish `v0.19.2` as a compatible patch containing Go binary correctness fixes, source-checkout Node helper safety and parity fixes, direct regression proof, and one focused test-fixture economy improvement.
No install contract, packet schema, or Cautilus Agent behavior migration is part of this release.

## Release Scope

The binary gains Unicode-safe claim-review excerpts and fail-closed consumer-prompt reads.
Source-checkout workflows gain whitespace-safe active-run resolution and pre-mutation required-value guards in `workspace-start`, `prepare-compare-worktrees`, and `prune-workspace-artifacts`.
The focused compare-worktree parser suite reuses an immutable Git fixture while retaining per-case mutation oracles.

## Capability at Stake

Operators should receive the fixes through the correct distribution channel, understand the intentional new consumer-prompt failure mode, and be able to update or roll back without mistaking local source-helper repairs for a repo-wide parser or Agent migration.

## Surface-Lock Inventory

- Version locks: package manifest, lockfile, Claude/Codex plugin manifests, and marketplace metadata through the repo-owned prepare helper.
- Binary locks: Go claim-review excerpt and consumer-prompt failure behavior plus release archives, checksums, and attestations.
- Source-checkout locks: Node prompt rendering, active-run whitespace semantics, three mutating parser guards, and their tests.
- Agent/plugin lock: packaged skill-tree parity only; no Agent behavior change.
- Narrative locks: this critique, target-specific release record, handoff, and generated public release metadata.
- Unchanged: installer contract, structured stdout schema, and provider/live evaluator behavior.

## Failure Angles

- Operational: tagging before target manifests, target release narrative, clean-tree state, broad gates, or fresh-checkout probes would freeze an unproved bundle.
- First contact: collapsing binary and source-checkout changes into one generic CLI claim would misstate what installed users receive.
- Recovery: a stale captured consumer-prompt path now fails loudly; release prose must tell the operator to restore the path or regenerate the input packet.
- Communication: the measured `1.85s` to `1.57s` improvement applies only to one focused suite, not total verification.
- Interface: all-whitespace optional active-run values become absent, but non-empty path identity remains unchanged.

## Counterweight Pass

- Act Before Ship: prepare `0.19.2`, write the target release narrative, commit critique state, complete broad/fresh gates and goal closeout, and publish only from a clean tree.
- Bundle Anyway: distinguish binary, source-checkout, and unchanged Agent channels; include consumer-prompt recovery, bounded parser claims, narrow timing evidence, and update/rollback commands.
- Over-Worry: public proof cannot exist before tag publication and is correctly owned by the ordered post-publish verifier; raw leading-dash relative values remain expressible through `./` or absolute paths and have no observed consumer dependency.
- Valid but Defer: the generated public notes asset is provenance-heavy, but redesigning its role during this patch would reopen release infrastructure without protecting the fixes.

## Operator Action Required

1. Run the repo-owned `0.19.2` prepare flow, update the target-specific release record, and commit every meaningful critique/release artifact.
2. Complete verify, hooks, on-demand, requested-review, fresh-checkout, and release preflight gates before ordered publication.
3. After tag publication, require workflow/public asset verification and install readback before calling the release complete.

## Upgrade Path

Upgrade through the supported installer or normal update channel, then confirm `cautilus --version` and `cautilus version --verbose`.
Rollback by invoking the installer with `CAUTILUS_VERSION=v0.19.1`, then verify the version.
Source-checkout users must move their checkout or tag to receive or roll back the Node helper changes; no Agent migration is required.

## Structured Findings

- F1 | bin: act-before-ship | evidence: strong | ref: package.json:4; charness-artifacts/release/latest.md:4 | action: fix | note: prepare and record the target 0.19.2 surface before tagging
- F2 | bin: act-before-ship | evidence: strong | ref: docs/maintainers/releasing.md:14 | action: fix | note: complete broad, fresh-checkout, and goal-closeout proof before publication
- F3 | bin: bundle-anyway | evidence: strong | ref: internal/runtime/review.go; scripts/agent-runtime/render-review-prompt.mjs | action: fix | note: explain fail-closed consumer-prompt recovery and distinguish binary from source-checkout channels
- F4 | bin: bundle-anyway | evidence: strong | ref: scripts/agent-runtime/workspace-start.mjs; scripts/agent-runtime/prepare-compare-worktrees.mjs; scripts/agent-runtime/prune-workspace-artifacts.mjs | action: document | note: bound parser claims to the three reproduced mutating entrypoints
- F5 | bin: over-worry | evidence: strong | ref: docs/maintainers/releasing.md | action: defer | note: public and install proof is necessarily post-tag and already owned by ordered verification
- F6 | bin: valid-but-defer | evidence: moderate | ref: .github/workflows/release-artifacts.yml:58 | action: defer | note: reconsider the generic public notes asset role outside this patch release

## Deliberately Not Doing

- No repo-wide parser abstraction or generic parser-hardening claim.
- No global test-speed percentage or provider/live-behavior claim.
- No Cautilus Agent migration.
- No public release-notes pipeline redesign in this patch.

## Reviewer Tier Evidence

- Requested tier: high-leverage.
- Requested spawn fields: none exposed by the adapter.
- Host exposure state: host-defaulted
- Application state: unverified; the host did not expose model-application metadata.

## Fresh-Eye Satisfaction

parent-delegated

## Boundary Ownership

- Producer: repo-owned release prepare/publish helpers and target release narrative.
- Consumer: binary installers, source-checkout operators, and plugin consumers reading the published release.
- Owning surface: release-packaging.
- Verdict: owned-correctly

## Next Move

Prepare `v0.19.2`, write the scoped release record, run the complete verification lane, publish through the ordered helper, then bind public and install readback into release and goal closeout artifacts.
