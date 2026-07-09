# Session Retro
Date: 2026-07-09

## Mode

session

## Context

This session designed, implemented, verified, pushed, and released the `cli-default-yaml-format-release` goal.
The release changed structured CLI stdout to default YAML, added `--format yaml|json`, preserved `--json` compatibility, and kept JSON packet files stable.

## Evidence Summary

- Goal artifact: `charness-artifacts/goals/2026-07-09-cli-default-yaml-format-release.md`.
- Debug proof: `charness-artifacts/debug/latest.md` and `charness-artifacts/debug/debug-2026-07-09-cli-json-alias-parser-leak.md`.
- Release critique: `charness-artifacts/critique/2026-07-09-v0-19-0-cli-format-release-critique.md`.
- Disposition review: `charness-artifacts/critique/2026-07-09-cli-default-yaml-format-release-disposition-review.md`.
- Release proof: `charness-artifacts/release/latest.md`.
- Public proof: GitHub Actions run `28984676895`, local public verifier, and install-sh smoke readback.

## Waste

The main waste was assuming the first `--json` compatibility test set covered every advertised parser path.
Fresh-eye release critique found the missing claim parser aliases before publication, which prevented a bad release but forced another debug and verify loop.

## Critical Decisions

- Keep `--json` as a global compatibility alias instead of removing it from parser-facing command registry entries.
- Detect terminal interactivity before wrapping stdout with the formatted writer.
- Use `0.19.0` as a minor release because the default stdout presentation changed even though JSON parser/file contracts remain available.
- Keep the release tag fixed and record post-publish public proof on `main`.

## Expert Counterfactuals

- Engelbart system-improving lens: the tool layer should connect registry-advertised compatibility flags directly to strict parser tests.
  The fix now adds strict JSON tests for the claim parser aliases that the registry advertises.
- Decision-quality lens: a release critique with a concrete reproduction should be treated as a blocker even after broad verify passes.
  The session did this correctly; the improvement is to make the strict alias test class exist before the reviewer has to find it.

## Sibling Search

- same layer: `doctor commands --json`, `discover scenarios --json`, and `doctor binary --json` already had strict JSON tests.
- same layer: `discover claims status --json`, `evaluate claims plan --json`, and `discover claims validate --json` lacked strict JSON tests and were fixed in this slice.
- adjacent layer: internal scripts and executable specs already moved parser paths to `--format json`; no additional stale JSON parser callers remained after `npm run verify`.

## Next Improvements

- workflow: applied: run fresh-eye release critique before treating a broad local verify as release-ready when command contracts change.
- capability: applied: strict app tests now cover the missing registry-advertised `--json` parser aliases.
- memory: applied: debug and release critique artifacts record the stdout-vs-file format boundary and the alias leak.

## Persisted

Persisted: yes: charness-artifacts/retro/2026-07-09-cli-default-yaml-format-release-retro.md
