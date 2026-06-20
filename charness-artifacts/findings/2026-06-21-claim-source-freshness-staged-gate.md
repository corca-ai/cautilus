# Claim-source freshness gate — closes the authoring-slice detection gap

Date: 2026-06-21.
Closes `follow-up: claim-freshness-precommit` from
`charness-artifacts/debug/2026-06-20-claim-packet-stale-after-firstslice-docs-specs.md`.

## The gap

The existing claim-staleness gate (`claims:evidence-state:check`) computes drift from a COMMITTED diff
(`workingTreePolicy: excluded`). So a slice that edits a claim source (README/AGENTS/CLAUDE or a linked
doc, incl. `docs/specs/**`) passes its own pre-commit verify — the working-tree edit is invisible to a
committed-diff — commits, and ships latent staleness that only the NEXT verify/push catches. That is
exactly what shipped from the specdown first slice (`6dd78e77`) into the next session.

## The fix (minimal, working-tree-aware)

The claim packet already records, per scanned source, the sha256 of its content at discovery time
(`latest.json` `sourceInventory[].contentHash`, raw bytes — verified). A new check hashes each source on
disk and compares:

- `scripts/check-claim-source-freshness.mjs` — fails if any scanned source's on-disk content differs from
  its recorded `contentHash`, or a recorded source is missing on disk. Names the offending files and the
  exact repair (`npm run claims:refresh:all`). No discovery re-run (cheap, deterministic).
- npm `claims:source-freshness:check`; wired into `npm run verify` right after `claims:evidence-state:check`
  (and therefore into the pre-push hook, which runs verify). `scripts/run-verify.test.mjs` PHASES kept in sync.
- `scripts/check-claim-source-freshness.test.mjs` — 6 tests: fresh→pass, edited→fail (names file + repair),
  missing→fail, hash-less inventory entries skipped.

Because it compares the packet to the WORKING TREE (not a committed diff), it catches both the
authoring-slice edit AND a clean-tree-but-stale-packet state (the exact state inherited this session).

## Why no false positives

All 73 current inventory sources match disk (verify-green now). The generated `claim-evidence-state.md`
is NOT a scanned source (excluded), so the refresh-order regeneration cannot trip it. The generated
`projected-claim-state.md` IS a scanned source but `claims:refresh:all` re-scans it from disk, so a
legitimate refresh always satisfies the check (no infinite loop). Editing a source without refreshing is
the only failure path — which is the intended behavior.

## Load-bearing proof

Appended a line to `docs/guides/cli.md` (a real claim source) → `claims:source-freshness:check` exit 1
naming `docs/guides/cli.md` + `npm run claims:refresh:all`; `git checkout` revert → exit 0. This is the
exact edit class that previously shipped latent staleness; it now fails the gate in the authoring slice.

## Scope / follow-up

- In scope: MODIFIED or REMOVED existing scanned sources (the common case).
- Out of scope (`follow-up: claim-source-newlink-detection`): a NEW linked source not yet in the inventory
  needs re-traversal to detect; the contentHash check iterates the recorded inventory and cannot see a
  brand-new link. `claims:evidence-state:check` / pre-push verify still backstop the committed case.
- A dedicated pre-commit hook (vs. the verify phase) is a further tightening; verify + pre-push already
  close the ship-gap, which is what the RCA targeted.

## Verification

- `node --test scripts/check-claim-source-freshness.test.mjs`: 6/6 pass.
- `npm run claims:source-freshness:check`: fresh (73 sources). `run-verify.test.mjs` PHASES in sync.
- `npm run verify`: green, all phases (257.70s); new `claim source freshness` phase passes (194ms);
  coverage floor cleared.
- Fresh-eye Sonnet critique (foreground): READY, no blocker, no edits. Independently confirmed sha256
  correctness, the false-positive analysis (`claims:refresh:all` does NOT regenerate the in-inventory
  `projected-claim-state.md`, so a clean refresh always satisfies the check — no infinite loop), scope
  honesty, wiring/PHASES sync, and the live mutate→fail / revert→pass behavior.

This is track B from the handoff. Track A (apex Proof Debt) stays for the next session.
