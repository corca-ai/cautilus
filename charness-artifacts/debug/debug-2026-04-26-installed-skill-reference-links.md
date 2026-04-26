# Debug Review: installed skill reference links
Date: 2026-04-26

## Problem

`npm run lint` failed in `lint:links` after the doctor first-run fix.
The failing links were all under `.agents/skills/cautilus/references/*` and pointed one directory too shallow for the materialized skill location.

## Correct Behavior

Given `.agents/skills/cautilus` is checked in as repo state, when `npm run lint:links` checks Markdown links, then installed skill reference links should resolve from `.agents/skills/cautilus/references`.
Source skill links under `skills/cautilus/references` can keep their own relative depth.

## Observed Facts

- `npm run test` passed before this incident.
- `npm run lint` failed only at `lint:links`.
- The broken links used `../../../scripts`, `../../../internal`, or `../../../fixtures`.
- That depth is correct from `skills/cautilus/references`, but from `.agents/skills/cautilus/references` it resolves under `.agents/`.
- The plugin copy already uses a different relative depth for its deeper install location.

## Reproduction

Run:

```bash
npm run lint:links
```

Before the fix, the command reports 13 broken links under `.agents/skills/cautilus/references`.

## Candidate Causes

- The materialized `.agents` skill copy retained source-tree relative links.
- The link checker intentionally includes checked-in `.agents` Markdown files.
- The Cautilus skill install path is deeper than the source `skills/cautilus` path.
- The links might have targeted generated files, but each target exists at the repo root with the correct depth.

## Hypothesis

If `.agents/skills/cautilus/references` links that target repo-root `scripts`, `internal`, and `fixtures` are changed from `../../../` to `../../../../`, then `npm run lint:links` should pass without altering the source skill links.

## Verification

Updated the materialized `.agents/skills/cautilus/references` links.
Ran:

```bash
npm run lint:links
```

The command passed with `check-markdown-links: ok (170 file(s) checked, local links only)`.

## Root Cause

The checked-in materialized skill surface had source-tree link depths.
The source tree path and installed `.agents` path have different depths, so the copied links no longer resolved.

## Seam Risk

- Interrupt ID: installed-skill-reference-links
- Risk Class: none
- Seam: source skill references versus checked-in materialized agent-surface references
- Disproving Observation: the same Markdown target depth cannot be valid from both `skills/cautilus/references` and `.agents/skills/cautilus/references`
- What Local Reasoning Cannot Prove: whether future `cautilus install --overwrite` should rewrite these links automatically or omit source references for consumers
- Generalization Pressure: monitor

## Interrupt Decision

- Premortem Required: no
- Next Step: impl
- Handoff Artifact: none

## Prevention

Keep `lint:links` in the closeout path whenever the checked-in installed skill surface changes.
If this repeats after reinstalling the skill, move the fix into install-time link rewriting instead of maintaining the checked-in copy by hand.
