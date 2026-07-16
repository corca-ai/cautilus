# v0.20.0 Release Critique

Date: 2026-07-16
Reviewer: parent-delegated `charness:bounded-reviewer` (agentId a2c94588809f4a007), read-only.
Scope: pre-publish gate for the minor release `0.19.4 → 0.20.0` (sixth autonomous improvement bundle).

## Verdict

BLOCK (narrow) → resolved to PASS after the single flagged fix.

## Confirmed Findings

- HIGH — the release record `charness-artifacts/release/latest.md` pre-declared its own delegated release critique as passed ("a separate delegated release critique cleared the bundle before publish") in past tense before this critique had concluded. For a "Proven On Itself" product, recording a review clearance before the review concludes is the exact overclaim this gate exists to catch.
  Disposition: FIXED before publish — the line was reworded to record the critique's real disposition (surfaces cleared, this one overclaim flagged and corrected), not a premature clearance.
- LOW — the goal artifact carries two hashes for slice 2 (Slice Plan `dff6a1cd` vs Slice Log `8c25e161`), a known autosquash-rebase residue.
  Disposition: reconcile at closeout (not a publish blocker; not in the release record).

## Verified Sound (non-issues)

- Version: minor `0.20.0` is the lightest honest bump (pre-1.0 breaking schema rename forbids patch, does not warrant major). All five version manifests agree at `0.20.0` (package.json, package-lock.json, marketplace.json, Claude plugin.json, Codex plugin.json).
- Schema rename complete: `LiveTargetCatalogSchema` emitted; `RetiredWorkbenchInstanceCatalogSchema` retained only to reject; the reject fires before instance validation with an actionable both-schemas message; red-first cli_smoke test proves it. No consumer-facing doc/fixture still references the old schema.
- Per-commit consistency: slice-2 commit `dff6a1cd` carries both the `git_hooks.go` deletion and the floor-entry removal (verified `git show`); git_hooks.go is absent and has zero floor entries at that tree.
- Slice-1 fail-closed logic, slice-3 SemVer 11.4 compare, migration + rollback (`CAUTILUS_VERSION=v0.19.4`) guidance, and the non-claims block (dormant SemVer, no macOS, no provider/live, claim-refresh-did-not-launder) all verified accurate.

## Biggest Risk (disclosed)

The rename is a hard break with no compat shim: old-schema `kind: command` adapters fail outright on `discover live-targets`. Acceptable pre-1.0 and disclosed thoroughly (actionable error + migration note + rollback), so it is a disclosed risk, not a hidden one.
