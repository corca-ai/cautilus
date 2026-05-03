# Active Run And Workspace Lifecycle

Active runs keep multi-command workflows resumable without hiding workspace ownership.

Aligned user claims: U2, U6, U7.
Proof route: deterministic.
Current evidence status: proof-planning.
Next action: keep active-run resolution, auto-materialization, pruning, and run-directory freshness tied to command tests and packet fields.
Absorbs: active run, run directory, workspace lifecycle, manifest, auto-materialize, prune, output directory, compare workspace, candidate workspace, baseline workspace.

## Maintainer Promise

Cautilus can allocate and remember a per-run workspace for a workflow, but command artifacts own workflow metadata.
The active-run marker helps commands resume the same bounded workflow without turning local workspace contents into product-owned behavior.

## Proof Notes

This area should absorb claims from `docs/contracts/active-run.md` and workspace preparation code.
It should not be folded into binary/skill responsibility unless the claim is specifically about agent routing.
