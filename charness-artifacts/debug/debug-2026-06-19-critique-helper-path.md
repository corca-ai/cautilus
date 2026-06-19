# Debug Review: critique scaffold helper path is plugin-owned, not repo-local
Date: 2026-06-19

## Problem

While closing the app/chat clarification-first breadth slice, the command `python3 scripts/check_artifact_surface_preflight.py --type critique --emit-stub` failed with `python3: can't open file '/home/ubuntu/cautilus/scripts/check_artifact_surface_preflight.py': [Errno 2] No such file or directory`.

## Correct Behavior

Given a critique artifact needs a scaffold or validation helper, the operator should invoke the installed Charness plugin helper path when the consumer repo does not copy those scripts into `scripts/`.
Then the critique closeout should continue without treating the missing repo-local helper as a product test failure.

## Observed Facts

- The repo has no `scripts/check_artifact_surface_preflight.py`.
- `rg --files | rg 'check_artifact_surface_preflight|scaffold_critique_artifact|validate_critique'` returned no repo-local helper.
- The installed plugin contains `/home/ubuntu/.codex/plugins/cache/local/charness/0.52.5/scripts/check_artifact_surface_preflight.py`, `/home/ubuntu/.codex/plugins/cache/local/charness/0.52.5/scripts/validate_critique_artifacts.py`, and `/home/ubuntu/.codex/plugins/cache/local/charness/0.52.5/skills/critique/scripts/scaffold_critique_artifact.py`.
- The plugin top-level preflight helper then tried to open `/home/ubuntu/.codex/plugins/cache/local/charness/0.52.5/skills/public/critique/scripts/scaffold_critique_artifact.py`, which does not exist in this installed layout.

## Reproduction

```bash
python3 scripts/check_artifact_surface_preflight.py --type critique --emit-stub
```

This fails in this repo because the helper path is not checked in under `scripts/`.

## Candidate Causes

- The critique reference showed a repo-local command form, but this repo relies on installed plugin scripts instead of copied helper scripts.
- The helper script was accidentally deleted from the repo.
- The current working directory was wrong.

## Hypothesis

If the error is path ownership rather than a missing capability, then searching the installed Charness plugin should find the helper scripts and the repo-local search should not.
If the top-level plugin preflight helper has a stale internal path for this installed layout, then the direct skill-local scaffold path should be preferred for this slice.

## Verification

Confirmed.
The repo-local search found no helper, while the plugin path search found the scaffold and validator scripts.
The top-level plugin preflight helper also failed in this layout with a stale `skills/public/critique` path.
The correct closeout path is to use the installed skill-local scaffold path or follow the existing local critique artifact shape, not to add copied helper scripts to the repo in this slice.

## Root Cause

The first failed command used a generic example path as if this consumer repo owned that helper under `scripts/`.
In this clone, critique artifact helpers live in the installed Charness plugin cache, and existing critique artifacts are hand-authored to the repo's accepted shape.
The second failed command exposed an installed-plugin layout mismatch in the top-level helper, so the narrower direct scaffold path is the reliable helper path for this slice.

## Invariant Proof

- Invariant: n/a - not a workflow-boundary propagation bug
- Producer Proof: n/a
- Final-Consumer Proof: n/a
- Interface-Shape Sibling Scan: n/a
- Non-Claims: this does not validate the critique artifact by itself; it only identifies the path mistake and the correct helper ownership.

## Detection Gap

- critique closeout helper lookup | the generic reference command failed late because it assumed a copied repo-local helper | use the installed plugin path when invoking helper scripts from installed skills

## Sibling Search

- Mental model: installed skill helper examples can be run verbatim from the consumer repo root.
- cross-file: no cross-file sibling — this was an operator command-path mistake, not a repo source pattern.

## Seam Risk

- Interrupt ID: none
- Risk Class: none
- Seam: installed Charness plugin helper path versus consumer repo script path
- Disproving Observation: plugin path search found the helpers
- What Local Reasoning Cannot Prove: whether future Charness versions will install the helper at the same cache path
- Generalization Pressure: monitor

## Interrupt Decision

- Critique Required: no
- Next Step: impl
- Handoff Artifact: none

## Prevention

Use `/home/ubuntu/.codex/plugins/cache/local/charness/0.52.5/skills/critique/scripts/scaffold_critique_artifact.py` directly when this repo has no copied helper and the top-level preflight helper does not match the installed layout.
Do not add helper copies to the repo just to repair an operator command typo.
