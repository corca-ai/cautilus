# Ignored Self-Dogfood Evidence Links Debug
Date: 2026-05-09

## Problem

The maintainer evaluation surfaces spec avoided a CI broken-link failure by converting ignored self-dogfood artifact links into plain code paths, but that weakened the evidence boundary instead of providing checkoutable evidence.

## Correct Behavior

Given a checked-in spec claims evidence, when the evidence is linked as a durable proof route, then the linked target should exist in a clean checkout.
Ignored generated self-dogfood outputs may be named as reproduction source paths, but they should not be the direct evidence link from the checked-in spec.

## Observed Facts

- `docs/specs/maintainer/evaluation-surfaces-runners.spec.md` named four `artifacts/self-dogfood/.../eval-summary.json` paths as selected evidence.
- `.gitignore` ignores `artifacts/self-dogfood/*` except the curated `artifacts/self-dogfood/latest/` subset.
- The four named eval summary files exist locally, but they are ignored and are not available in a clean checkout.
- `npm run lint:links` only passes for the spec because those generated paths were plain code paths rather than Markdown links.

## Reproduction

Run:

```bash
rg -n "artifacts/self-dogfood/.+eval-summary" docs/specs/maintainer/evaluation-surfaces-runners.spec.md
git check-ignore artifacts/self-dogfood/eval/latest/eval-summary.json
npm run lint:links
```

## Candidate Causes

- The spec treated local generated output paths as evidence without preserving a checkoutable evidence packet.
- The release unblock changed Markdown links to plain code paths, which fixed CI syntax but not the evidence contract.
- The self-dogfood outputs may be intentionally ignored because they are volatile, but the spec still needs a durable selected-evidence summary.

## Hypothesis

If the spec links to a checked-in `charness-artifacts/spec/` proof artifact that records selected fields and hashes from the ignored generated packets, then clean checkout readers can reopen the evidence without treating ignored self-dogfood outputs as checked-in docs.

## Verification

- Added `charness-artifacts/spec/evaluation-surfaces-runners-proof.md` with selected summary packet fields, source paths, and source SHA-256 hashes.
- Updated `docs/specs/maintainer/evaluation-surfaces-runners.spec.md` to link to that checked-in proof artifact.
- Preserved ignored `artifacts/self-dogfood/...` paths only as reproduction source paths inside the proof artifact.
- `npm run lint:links`: passed.
- `npm run lint:specs`: passed.
- Debug artifact validator: passed.

## Root Cause

The release-time fix addressed the broken Markdown link symptom but left the underlying proof boundary ambiguous.
A checked-in spec cannot use ignored generated artifacts as direct durable evidence unless it also checks in a selected evidence packet or generates the target before link validation.

## Seam Risk

- Interrupt ID: ignored-self-dogfood-evidence-links
- Risk Class: none
- Seam: none
- Disproving Observation: clean checkout link validation resolves the checked-in proof artifact and no spec evidence link points directly at ignored self-dogfood summaries.
- What Local Reasoning Cannot Prove: none
- Generalization Pressure: none

## Interrupt Decision

- Premortem Required: no
- Next Step: impl
- Handoff Artifact: none

## Prevention

When a spec depends on ignored generated output, check in a selected evidence artifact with enough fields and hashes to audit the claim.
Use ignored output paths as reproduction inputs, not as direct evidence links from checked-in specs.
