# Critique: Post-release hardening fresh review

Date: 2026-07-08

Fresh-eye satisfaction: parent-delegated

Packet Consumed: `charness-artifacts/critique/2026-07-08-050954-packet.md`

## Reviewer Tier Evidence

- Requested tier: high-leverage
- Requested spawn fields: none
- Host exposure state: pending-parent-spawn
- Application state: findings recorded; code changes not applied in this critique-only pass

## Target

Code critique for commit `3ebda667 Harden provenance and release gates`.

## Diff Scope

The commit hardened scenario proposal provenance validation and review output, synchronized Cautilus Agent references, refreshed claim artifacts, and added release publisher/readback guardrails.

## Capability At Stake

The product should reject malformed provenance consistently, keep the installed Cautilus Agent surface aligned with shipped contracts, and prevent maintainers from tagging releases when release gate policy or verification is stale.

## Angles

- Problem framing: did the diff solve the real absorption and release-gate problems rather than adjacent documentation problems?
- Diagnostic/root-cause: did Go, Node, schema, and generated proposal surfaces actually converge?
- Operational checklist: can a maintainer still bypass or accidentally weaken release gates?
- Counterweight: which concerns must block the next ship, which are cheap bundle work, and which belong to release-closure follow-up?

## Findings

### Act Before Ship

1. Go accepts whitespace-padded provenance enum values and can emit schema-invalid output.
   Evidence: strong.
   `normalizeNonEmptyString` trims strings, `optionalEnumStringValue` validates the trimmed value, but the emitted evidence and provenance summary still read raw `origin` and `split` values from the original map.
   This can make Go accept `origin: " replayed "` or `split: " review "`, then emit output that the schema and Node runtime would reject.

2. `.agents/skills/cautilus-agent` is stale.
   Evidence: strong.
   `skills/cautilus-agent/` and `plugins/cautilus/skills/cautilus-agent/` were updated, but `.agents/skills/cautilus-agent/references/scenario-proposal-sources.md` still shows `evidence: []` and `cli_evaluation`.
   The release boundary currently describes `.agents/skills/cautilus-agent/` as the canonical checked-in skill path, so this is not merely a local cache concern.

3. The release policy gate is self-policing.
   Evidence: strong.
   `publish-release.mjs` runs the commands declared in `.agents/release-adapter.yaml`; it does not independently require the policy checker.
   If the adapter list is weakened to `true`, publish can still push the branch and tag.

4. `npm run verify` is not enforced pre-tag.
   Evidence: strong.
   The adapter declares `quality_command: npm run verify`, and docs require it, but `publish-release.mjs` does not enforce that command before branch/tag push.
   CI after tag creation is too late for a clean release boundary.

### Bundle Anyway

5. Requested review commands have no timeout and run through `shell: true`.
   Evidence: moderate.
   The YAML is repo-owned, so this is not a security panic, but a hung command can stall release publish indefinitely.

6. `release:smoke-install:current` still allows `--repo` and `--installer-source` overrides.
   Evidence: moderate.
   The adapter command does not pass those overrides, but the current-version public readback wrapper can still be manually pointed at a fork or local installer.

7. `publish-release.mjs` does not re-check the worktree after requested review commands.
   Evidence: moderate.
   Current commands are check-like, but future gates could generate files and exit 0 before the helper tags.

### Valid But Defer

8. Post-publish install readback remains pending/manual.
   Evidence: strong.
   This is honest today because public release assets do not exist until after tag workflow publication, and the release state says `pending-public-release`.
   A later `release:close` or readback evidence helper should execute and record the adapter readback command.

## Structured Findings

- F1 | bin: act-before-ship | evidence: strong | ref: internal/runtime/proposals.go:376 | action: fix | note: Go should reject or canonicalize whitespace-padded provenance enum values
- F2 | bin: act-before-ship | evidence: strong | ref: .agents/skills/cautilus-agent/references/scenario-proposal-sources.md:141 | action: fix | note: repo-local installed Cautilus Agent reference is stale
- F3 | bin: act-before-ship | evidence: strong | ref: scripts/release/publish-release.mjs:371 | action: fix | note: publish helper must independently enforce release policy checker
- F4 | bin: act-before-ship | evidence: strong | ref: .agents/release-adapter.yaml:11 | action: fix | note: publish helper should enforce quality_command or an equivalent required pre-tag verify gate
- F5 | bin: bundle-anyway | evidence: moderate | ref: scripts/release/publish-release.mjs:92 | action: fix | note: requested review command runner should use timeout and better failure reporting
- F6 | bin: bundle-anyway | evidence: moderate | ref: scripts/release/run-install-smoke-current.mjs:13 | action: fix | note: current public install readback wrapper should own repo and installer source
- F7 | bin: bundle-anyway | evidence: moderate | ref: scripts/release/publish-release.mjs:372 | action: fix | note: publish helper should re-check clean worktree after requested review commands
- F8 | bin: valid-but-defer | evidence: strong | ref: scripts/release/publish-release.mjs:355 | action: defer | follow-up: deferred release-close-readback-helper | note: post-publish readback closure belongs in a later release-closure slice

## Deliberately Not Doing

This critique-only pass does not apply code fixes.
It records the fresh findings so the next implementation pass can address the Act Before Ship and Bundle Anyway items as one coherent hardening slice.

## Next Move

Fix F1-F4 before treating `3ebda667` as ship-ready.
Bundle F5-F7 if touching release helper code in that same slice.
Defer F8 to a release-closure helper instead of forcing post-publish asset checks into the pre-tag helper.
