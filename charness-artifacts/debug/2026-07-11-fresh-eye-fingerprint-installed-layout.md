# Debug Review
Date: 2026-07-11

## Problem

The installed fresh-eye review reference instructed the operator to run `python3 skills/shared/scripts/reviewer_boundary_fingerprint.py`, but Cautilus has no repo-local `skills/shared/scripts/` tree and the command failed with `[Errno 2] No such file or directory`.

## Correct Behavior

Given an installed Charness skill in a consumer repo, when a fresh-eye review requests the rail-1 fingerprint helper, then the invocation should resolve the helper from the installed skill/plugin layout and create the snapshot without assuming an authoring-repo source tree.

## Observed Facts

- The exact failing path was `/home/hwidong/codes/cautilus/skills/shared/scripts/reviewer_boundary_fingerprint.py`.
- `rg --files` found the helper at `/home/hwidong/.codex/plugins/cache/local/charness/0.66.1/shared/scripts/reviewer_boundary_fingerprint.py`.
- The installed reference itself contains the `<repo-root>/skills/shared/scripts/...` command.
- Web search was not useful because the failing identity is a local installed-layout path and the installed source is the authoritative observation.

## Reproduction

- From the Cautilus root, run `python3 skills/shared/scripts/reviewer_boundary_fingerprint.py snapshot --repo-root . --out /tmp/fingerprint.json`; Python exits with status 2 because the file is absent.

## Candidate Causes

- The helper was omitted from the Cautilus repository package.
- The reference was authored for the Charness source checkout and copied into an installed plugin without path adaptation.
- The plugin cache installation was incomplete or stale.
- The command should have used runtime bootstrap resolution rather than a repo-root path.

## Hypothesis

- Falsifiable claim: the reference carries an authoring-repo path assumption while the plugin installation is complete; invoking the helper from the installed plugin path will create a valid snapshot | disconfirmer: search the installed package for the helper and execute that exact path.

## Verification

- confirmed — the installed package contains one helper under `shared/scripts/`, while the reference contains the repo-root command and Cautilus has no corresponding path.

## Root Cause

The installed portable reference hardcodes the authoring-repo location for a shared helper instead of resolving the helper relative to the installed Charness package.

## Invariant Proof

- Invariant: fresh-eye rail-1 commands must resolve from the installed package in consumer repos.
- Producer Proof: the installed package exposes `shared/scripts/reviewer_boundary_fingerprint.py`.
- Final-Consumer Proof: the installed helper path created the snapshot, the first verify correctly reported parent-authored drift, and the clean follow-up snapshot/review/verify returned `ok: true` with no drift.
- Interface-Shape Sibling Scan: scaffold and validator instructions already emit installed-layout paths; the fresh-eye prose command is the divergent sibling.
- Non-Claims: this Cautilus run does not repair or release the external Charness plugin.

## Detection Gap

- installed-skill portability validation | the reference command was not cold-started from a consumer repo | add an installed-layout fixture that executes or resolves every shared-helper command emitted by public references.

## Sibling Search

- Mental model: a portable skill reference can name an authoring-repo helper path because the consumer will have the same tree.
- same layer axis: installed Charness references containing `<repo-root>/skills/shared/scripts` | decision: same class, diagnostic-only for this slice | proof: static scan found the fresh-eye occurrence.
- abstraction up axis: public references that name source-tree helper paths instead of emitted or relative installed paths | decision: same class, diagnostic-only for this slice | proof: scaffold/validator paths in this run demonstrate the safer installed-layout pattern; no action needed in Cautilus because Charness owns the installed package.
- specialization down axis: the snapshot and verify subcommands share the same wrong executable path | decision: same bug, fix now | proof: operational workaround now uses the exact installed-version helper for both commands; the upstream repair remains Charness-owned.
- mental-model axis: repo-owned versus plugin-owned helper identity | decision: intentional plain-text or non-rendering boundary | proof: Cautilus does not own Charness plugin packaging.
- cross-file: `/home/hwidong/.codex/plugins/cache/local/charness/0.66.1/shared/references/fresh-eye-subagent-review.md` and its sibling installed helper.

## Seam Risk

- Interrupt ID: fresh-eye-fingerprint-installed-layout
- Risk Class: none
- Seam: installed Charness reference to consumer-repo execution
- Disproving Observation: the installed helper path successfully creates and verifies the reviewer boundary snapshot.
- What Local Reasoning Cannot Prove: whether a future Charness version repairs the portable reference.
- Generalization Pressure: monitor

## Interrupt Decision

- Resolution: resolved
- Critique Required: yes
- Next Step: impl
- Handoff Artifact: none

Upstream disposition: open — Charness-owned; the Cautilus run interruption is resolved by the installed-helper workaround.

## Prevention

Use the installed helper path for this run, preserve this incident as repo debug memory, and route the portable-reference repair to the Charness owner rather than adding a Cautilus-local compatibility copy.
The recorded `Next Step: impl` means continue the Cautilus goal after the workaround; it does not authorize a Cautilus product fix for Charness.
