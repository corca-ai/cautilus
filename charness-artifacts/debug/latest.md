# Release Real-Host Proof Check Debug
Date: 2026-05-09

## Problem

During the v0.14.0 release preflight, `check_real_host_proof.py --repo-root .` crashed before returning the release-time proof requirement payload.

## Correct Behavior

Given the release adapter declares no release-time real-host proof triggers, when the helper runs from this repo, then it should return a JSON payload with `required: false` or a clear adapter contract error that names the missing repo metadata.

## Observed Facts

- `python3 /home/hwidong/.codex/plugins/cache/local/charness/0.5.19/skills/release/scripts/check_real_host_proof.py --repo-root .` raised `scripts.surfaces_lib.SurfaceError: missing surfaces manifest '/home/hwidong/codes/cautilus/.agents/surfaces.json'`.
- `.agents/release-adapter.yaml` had `real_host_required_surfaces: []` and `real_host_required_path_globs: []`.
- The helper loads the surfaces manifest before checking whether any configured real-host trigger exists.
- The repo had no `.agents/surfaces.json` before this release slice.

## Reproduction

Run the release helper without a surfaces manifest:

```bash
python3 /home/hwidong/.codex/plugins/cache/local/charness/0.5.19/skills/release/scripts/check_real_host_proof.py --repo-root .
```

## Candidate Causes

- The helper unconditionally requires `.agents/surfaces.json` even when the release adapter has no real-host trigger configured.
- The Cautilus repo was missing the release/CLI/spec surface inventory expected by shared Charness release tooling.
- The release adapter and the release helper evolved separately, leaving the adapter valid but the supporting surface manifest absent.

## Hypothesis

If the repo adds a valid `.agents/surfaces.json` naming the release packaging, CLI plus Cautilus Agent, and promise-spec surfaces, then the helper should load the manifest and return `required: false` for the current slice unless changed paths match configured real-host proof triggers.

## Verification

- Added `.agents/surfaces.json` with `release-packaging`, `cli-agent-product`, and `promise-specs` surfaces.
- Reran `check_real_host_proof.py --repo-root .`.
- The helper returned JSON with `required: false` and `reason: No configured release-time real-host proof trigger matched the current slice.`

## Root Cause

The Cautilus release adapter was valid, but the repo lacked the Charness surface manifest that `check_real_host_proof.py` expects before it can classify changed paths.
Because the helper loads that manifest before applying the empty trigger lists, a missing manifest surfaced as an exception rather than a non-required proof result.

## Seam Risk

- Interrupt ID: release-real-host-proof-surfaces-manifest
- Risk Class: contract-freeze-risk
- Seam: Charness release helper contract versus Cautilus repo release metadata
- Disproving Observation: A repo with a valid `.agents/surfaces.json` can run the helper and receive a structured `required` result.
- What Local Reasoning Cannot Prove: Whether other repos with empty real-host trigger lists intentionally omit `.agents/surfaces.json` and would prefer the helper to degrade without requiring one.
- Generalization Pressure: monitor

## Interrupt Decision

- Premortem Required: no
- Next Step: impl
- Handoff Artifact: `.agents/surfaces.json`

## Prevention

Keep `.agents/surfaces.json` checked in with release packaging and CLI/Agent surfaces so release helpers can classify changed paths before publish.
If Charness later changes `check_real_host_proof.py` to tolerate missing manifests with empty trigger lists, this repo metadata should still remain useful for release and quality routing.
