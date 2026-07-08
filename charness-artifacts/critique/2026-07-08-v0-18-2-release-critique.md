# Critique Review
Date: 2026-07-08

## Decision Under Review

Release `v0.18.2` as a patch after `v0.18.1`.
The release bundles scenario proposal provenance hardening, release gate hardening, and faster test-boundary coverage.

## Release Scope

Version: `0.18.2`, tag `v0.18.2`.
Consumer-facing change: scenario proposal packets and review HTML now preserve and summarize evidence provenance, including `origin`, `activityProvenance`, and `provenanceSummary`.
Maintainer-facing change: release publish now runs requested review commands and reports `postPublishInstallReadback`, while local test feedback is faster without removing real binary smokes.

## Surface-Lock Inventory

- Release surfaces: `.agents/release-adapter.yaml`, `scripts/release/publish-release.mjs`, `scripts/release/run-install-smoke-current.mjs`, `docs/maintainers/releasing.md`, `docs/maintainers/release-boundary.md`, and `charness-artifacts/release/latest.md`.
- Version surfaces: `package.json`, `package-lock.json`, `.claude-plugin/marketplace.json`, `plugins/cautilus/.claude-plugin/plugin.json`, and `plugins/cautilus/.codex-plugin/plugin.json`.
- User/operator surfaces: `docs/contracts/scenario-proposal-inputs.md`, `docs/contracts/scenario-proposal-sources.md`, `docs/guides/cli.md`, `internal/runtime/proposals.go`, and `internal/runtime/artifact_html.go`.
- Verification surfaces: `charness-artifacts/critique/2026-07-08-053648-packet.md`, `charness-artifacts/quality/latest.md`, `npm run verify`, `npm run critique:surface-packet:check`, and `npm run release:publisher-policy:check`.

## Failure Angles

- Atul Gawande / operational checklist: release metadata and release record still pointed at `v0.18.1`, and the previous release artifact claimed requested review and install-refresh surfaces were not configured.
- Barbara Minto / communication structure: the `v0.18.2` release scope must name the scenario proposal provenance contract, not only internal gate hardening or test cleanup.
- Jef Raskin / humane operator surface: release operator wording must explain the new publish ledger fields and keep post-publish install readback separate from pre-tag proof.

## Counterweight Pass

- The version and release artifact mismatch is a real ship blocker because `publish-release.mjs` audits the target declaration, release scope, and verification sections before pushing.
- The scenario provenance contract belongs in release scope because it changes the operator-visible packet and HTML evidence summary.
- The stale `not_configured` release artifact text is cheap to fix in the target-specific `v0.18.2` record and should not be carried forward.
- Fake Cautilus binaries in fast tests are not release blockers because real `bin/cautilus --version`, consumer `init`, coverage, and release smoke surfaces remain.
- Structured runtime timing budgets and Cautilus Agent ergonomics remain valid quality debt, but they are not patch-release blockers.

## Operator Action Required

- Run `npm run release:prepare -- 0.18.2`.
- Replace `charness-artifacts/release/latest.md` with a target-specific `v0.18.2` record that declares `Released Cautilus `v0.18.2`.` and includes `## Release Scope` plus `## Verification`.
- Record `npm run critique:surface-packet:check`, `npm run release:publisher-policy:check`, `npm run verify`, `npm run hooks:check`, and the post-publish install readback state in the release record.

## Upgrade Path

Operators with an existing install refresh through the install-sh channel after the GitHub release is public.
Maintainers should run `npm run release:smoke-install:current -- --skip-update` after publication for version readback, and the full `npm run release:smoke-install -- --channel install_sh --version v0.18.2` when closing the release line.

## Structured Findings

- F1 | bin: act-before-ship | evidence: strong | ref: package.json:4, charness-artifacts/release/latest.md:6 | action: fix | note: v0.18.2 cannot publish while release surfaces still declare v0.18.1
- F2 | bin: act-before-ship | evidence: strong | ref: docs/contracts/scenario-proposal-inputs.md:87, internal/runtime/proposals.go:486, internal/runtime/artifact_html.go:554 | action: fix | note: release scope must name scenario proposal provenance contract
- F3 | bin: bundle-anyway | evidence: strong | ref: .agents/release-adapter.yaml:26, charness-artifacts/release/latest.md:96 | action: fix | note: target release artifact should record requested review and install-refresh surfaces instead of stale not_configured text
- F4 | bin: over-worry | evidence: moderate | ref: scripts/release/run-install-smoke-current.mjs:13, scripts/release/run-install-smoke.mjs:81 | action: document | note: current smoke wrapper permits repo and installer-source smoke options but this is not a patch-release blocker
- F5 | bin: valid-but-defer | evidence: weak | ref: charness-artifacts/quality/latest.md:40 | action: defer | note: structured runtime timing budgets and Cautilus Agent ergonomics are real debt outside v0.18.2

## Reviewer Tier Evidence

- Requested tier: high-leverage release critique.
- Requested spawn fields: three `explorer` angle reviewers and one separate `explorer` counterweight reviewer.
- Host exposure state: host-defaulted
- Application state: parent received completed subagent results for operational, communication, operator-interface, and counterweight passes.

## Fresh-Eye Satisfaction

parent-delegated

## Packet Consumed

`charness-artifacts/critique/2026-07-08-053648-packet.md`
