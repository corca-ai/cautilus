# Active Run And Workspace Lifecycle

Active runs keep multi-command workflows resumable without hiding workspace ownership.

Aligned user claims: U2, U6, U7.
Proof route: deterministic.
Current evidence status: partial.
Next action: keep active-run resolution, auto-materialization, pruning, and run-directory freshness tied to command tests and packet fields.
Absorbs: active run, run directory, workspace lifecycle, manifest, auto-materialize, prune, output directory, compare workspace, candidate workspace, baseline workspace.

## Maintainer Promise

Cautilus can allocate and remember a per-run workspace for a workflow, but command artifacts own workflow metadata; the active-run marker resumes the same bounded workflow without turning local workspace contents into product-owned behavior.

## Subclaims

- The active-run marker resolves to a workspace that commands can resume without rebuilding state.
- Auto-materialization, pruning, and `CAUTILUS_RUN_DIR` resolution share one canonical lifecycle described under [docs/contracts/active-run.md](../../contracts/active-run.md).
- Workflow metadata lives in command artifacts; the workspace is not treated as the source of truth for the workflow.
- Compare, candidate, and baseline workspaces are inspectable rather than implicit.

## Evidence

- [scripts/agent-runtime/active-run.test.mjs](../../../scripts/agent-runtime/active-run.test.mjs) covers env-var, explicit, and auto-materialize precedence so sequential commands resolve to the same active run.
- [scripts/agent-runtime/workspace-start.test.mjs](../../../scripts/agent-runtime/workspace-start.test.mjs), [scripts/agent-runtime/prepare-compare-worktrees.test.mjs](../../../scripts/agent-runtime/prepare-compare-worktrees.test.mjs), and [scripts/agent-runtime/prune-workspace-artifacts.test.mjs](../../../scripts/agent-runtime/prune-workspace-artifacts.test.mjs) cover auto-materialize manifests, compare-worktree preparation, and prune cadence respectively.

## Evidence Gaps

- Test proving the active-run marker does not leak into product-owned packets as workflow truth. Owner: maintainer. Next action: assert that the marker only appears under the workspace boundary, not inside `cautilus.*` schema fields; existing tests only cover marker resolution, not its absence in product schemas.
