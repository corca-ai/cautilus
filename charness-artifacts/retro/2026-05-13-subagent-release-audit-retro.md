# Subagent Release Audit Retro
Date: 2026-05-13

## Mode

Session.

## Context

This session shipped Cautilus `v0.15.4` for auditable subagent execution proof across Codex and Claude non-interactive backends.
The release completed, but the process exposed a stale public release-note pointer after publication.

## Evidence Summary

- Recent commits from `416f33e` through `d131215`.
- Public release `v0.15.4` at `https://github.com/corca-ai/cautilus/releases/tag/v0.15.4`.
- GitHub Actions `release-artifacts`, `verify-public-release`, main `verify`, and main `spec-report` runs.
- Local `npm run dogfood:subagent-execution-proof`, `npm run dogfood:self:eval`, `npm run verify`, `npm run hooks:check`, and install smoke runs.
- Debug artifacts for release prepare argument forwarding, fresh checkout shallow probes, and stale release-note pointer verification.

## Waste

- The release record was updated after the tag, so the initial public release notes pointed to stale tagged source context.
- The public release verifier checked asset presence and checksum structure but did not reject unverifiable source-tree delegation.
- The release process had to run full gates multiple times because the post-release audit fix landed after publication.
- The answer to whether the release was done briefly mixed two states: published binary release was done, but post-release audit hardening was still uncommitted.

## Critical Decisions

- Keeping repo-owned fixtures rather than making Cautilus own consumer fixture creation was correct.
  The implemented surface audits actual subagent execution proof while preserving host repo ownership of prompts and scenarios.
- Running both Codex and Claude dogfood before implementation was necessary.
  It exposed backend-specific proof shapes, especially Claude Task/Agent transcript results without `agentId`.
- Treating the stale release-note pointer as a real release quality miss was correct even though binaries and checksums were valid.
  It produced a verifier regression test instead of a one-off asset edit.

## Expert Counterfactuals

- Gary Klein would have run a pre-publication premortem on the release artifact reader path:
  "If an operator follows only the public release notes, what do they learn and what could be stale?"
- Daniel Kahneman would have forced separate checkboxes for `tag pushed`, `workflow succeeded`, `public assets verified`, `release explanation auditable`, and `worktree committed`.
  That separation would have prevented treating the first three as enough.

## Next Improvements

- Workflow: before `release:publish`, require the release record or public release notes to be self-contained for the target version.
- Workflow: closeout should name dirty worktree state explicitly after any post-publish correction, even when the public release itself is already valid.
- Capability: Charness release should add a public-release-notes audit that rejects unverifiable pointers to mutable or stale source-tree records.
- Capability: Charness release should expose release-state labels in closeout: local prepared, tag pushed, workflow completed, public verified, audit narrative committed.
- Memory: keep the stale release-note pointer debug artifact current so future release work starts from this failure mode.

## Persisted

Yes.
This artifact was persisted through the repo retro adapter.
