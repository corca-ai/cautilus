# Active Run

`Cautilus` pins one product-owned per-run workspace root per workflow and
keeps the reference sticky across consumer command invocations with a shell
environment variable. This contract is what makes `mode evaluate`, `review
prepare-input`, `review variants`, `workspace prepare-compare`, and related
consumers drop all of their artifacts into one coherent `runDir` without
operator path-threading.

It owns:

- the env var name, precedence rule, and default root
- the shell-evalable stdout format of `cautilus workspace start`
- the canonical filenames each consumer command writes under a `runDir`
- the load-bearing "one workflow = one runDir" invariant
- the rejected alternatives that operators should not re-propose

It does not own:

- adapter-specific artifacts inside the `runDir` (host-owned)
- per-run telemetry, cost, or token schema (owned by `reporting.md`,
  `scenario-results.md`, `optimization.md`, and sibling contracts)
- pruning policy (owned by `workspace prune-artifacts`, explicitly opt-in)

## Env Var Contract

- **Name**: `CAUTILUS_RUN_DIR`
- **Value**: absolute path to the currently active `runDir`
- **Scope**: the current shell (or agent runtime) process. No state files.

Consumer commands resolve their target `runDir` through one shared helper,
`scripts/agent-runtime/active-run.mjs::resolveRunDir`, using this precedence:

1. `options.outputDir` (the explicit `--output-dir`, `--output`, or
   equivalent flag). Wins unconditionally. Created recursively if missing.
2. `process.env.CAUTILUS_RUN_DIR`. Loud fail if the path is missing or is
   not a directory — that indicates the active run was lost or corrupted.
3. Auto-materialize a fresh `runDir` under the configured or default root
   (`./.cautilus/runs/`, cwd-relative, created on first use). Consumers
   that auto-materialize MUST emit `Active run: <abs path>` to stderr once
   so the operator sees where artifacts landed.

## One Workflow = One runDir

This is a load-bearing invariant. A workflow is one evaluation intent; its
mode runs, compare worktrees, review packets, review variants, and
optimization outputs belong under one marker-bearing directory.

The pruner (`scripts/agent-runtime/prune-workspace-artifacts.mjs`) is
designed around it — its `EXACT_MARKERS` set is intentionally
non-exclusive so multiple consumer commands can leave recognized markers
inside the same directory without producing sibling directories.

Start a workflow once:

```bash
eval "$(cautilus workspace start --label <meaningful-label>)"
```

Every consumer command in that shell inherits `CAUTILUS_RUN_DIR` and
resolves the same target `runDir`. An operator never has to thread paths
between commands or parse JSON payloads.

## Default Root

- Path: `./.cautilus/runs/` relative to the current working directory.
- Auto-created with `mkdirSync(..., { recursive: true })` on first use, by
  both `workspace start` and `resolveRunDir`'s auto-materialize branch.
- Each `runDir` inside the root is named `<YYYYMMDDTHHMMSSmmmZ>-<slug>`
  where `slug` is a slugified `--label` (default `run`).
- Every `runDir` carries a `run.json` manifest at its top. The manifest is
  only a recognition marker for the pruner; workflow metadata belongs in
  per-command artifacts, not in the manifest.

## Shell-Export stdout Format

`cautilus workspace start` (without `--json`) emits exactly one line on
stdout:

```
export CAUTILUS_RUN_DIR='/abs/path/to/.cautilus/runs/20260411T103215123Z-<slug>'
```

The path is wrapped in POSIX single-quoted form, with embedded single
quotes escaped as `'\''`. This makes `eval "$(...)"` safe even for roots
that contain spaces or shell metacharacters.

`--json` flips the stdout to the `cautilus.workspace_run_manifest.v1`
payload used by automation and internal test scripts. `--json` is the
machine path, not the operator happy path — no JSON parser dependency is
introduced for the default flow.

## Canonical Filenames

Consumer commands invoked inside an active run default their reads and
writes to these canonical names within the resolved `runDir`. Explicit
`--output-dir`, `--output`, `--output-file`, `--report-file`, etc. remain
as overrides for automation and tests.

| File or subdirectory              | Written by                          | Consumed by                                                 | Notes                                               |
| --------------------------------- | ----------------------------------- | ----------------------------------------------------------- | --------------------------------------------------- |
| `run.json`                        | `workspace start`                   | `workspace prune-artifacts`                                 | Manifest marker. `cautilus.workspace_run_manifest.v1`. |
| `report-input.json`               | `mode evaluate` (intermediate)      | `report build` (optional)                                   | Assembled report packet inputs. Defaults here when `CAUTILUS_RUN_DIR` is pinned and `report build --input` is omitted. |
| `report.json`                     | `mode evaluate`, `report build`     | `review prepare-input`, `evidence prepare-input`, `optimize prepare-input` | `cautilus.report_packet.v1`. Defaults here when an active-run-aware helper omits `--report-file`. |
| `<mode>-scenario-results.json`    | `mode evaluate`                     | `report build`, `evidence prepare-input`                    | Mode-prefixed so multiple modes coexist.            |
| `selected-profile.json`           | `mode evaluate` (profile-backed)    | internal                                                    | Scenario profile selection snapshot.                |
| `selected-scenario-ids.json`      | `mode evaluate` (profile-backed)    | internal                                                    | Materialized scenario id list.                      |
| `baseline-cache.json`             | `mode evaluate` (comparison)        | internal                                                    | Baseline cache seed key.                            |
| `baseline/`                       | `workspace prepare-compare`         | adapter commands                                            | Git worktree. Directory marker.                     |
| `candidate/`                      | `workspace prepare-compare`         | adapter commands                                            | Git worktree. Directory marker.                     |
| `review-packet.json`              | `review prepare-input`              | `review build-prompt-input`, `review variants`              | `cautilus.review_packet.v1`. Defaults here when `CAUTILUS_RUN_DIR` is pinned and `--output` is omitted. |
| `review-prompt-input.json`        | `review build-prompt-input`         | `review render-prompt`                                      | `cautilus.review_prompt_inputs.v1`.                 |
| `review.prompt.md`                | `review render-prompt`              | executor variants (optional)                                | Rendered meta-prompt.                               |
| `evidence-input.json`             | `evidence prepare-input`            | `evidence bundle`                                           | `cautilus.evidence_bundle_inputs.v1`. Defaults here when `CAUTILUS_RUN_DIR` is pinned and `evidence prepare-input --output` or `evidence bundle --input` is omitted. |
| `evidence-bundle.json`            | `evidence bundle`                   | `optimize prepare-input` (optional)                         | `cautilus.evidence_bundle.v1`. Defaults here when `CAUTILUS_RUN_DIR` is pinned and `evidence bundle --output` is omitted. |
| `optimize-input.json`             | `optimize prepare-input`            | `optimize propose`                                          | `cautilus.optimize_inputs.v1`. Defaults here when `CAUTILUS_RUN_DIR` is pinned and `optimize prepare-input --output` or `optimize propose --input` is omitted. |
| `optimize-proposal.json`          | `optimize propose`                  | `optimize build-artifact`                                   | `cautilus.optimize_proposal.v1`. Defaults here when `CAUTILUS_RUN_DIR` is pinned and `optimize propose --output` or `optimize build-artifact --proposal-file` is omitted. |
| `revision-artifact.json`          | `optimize build-artifact`           | operator                                                    | `cautilus.revision_artifact.v1`. Defaults here when `CAUTILUS_RUN_DIR` is pinned and `optimize build-artifact --output` is omitted. |
| `variant-*.json`                  | `review variants`                   | operator / review                                           | One file per executor variant.                      |
| `<stage>-<index>.stdout`          | `review variants`, `mode evaluate`  | debug, audit                                                | Captured process stdout.                            |
| `<stage>-<index>.stderr`          | `review variants`, `mode evaluate`  | debug, audit                                                | Captured process stderr.                            |

### Wired Consumers

Consumer commands marked **wired** resolve their target `runDir` through
one of two helpers in `scripts/agent-runtime/active-run.mjs`:

- **Workflow-creating commands** call `resolveRunDir` and honor the
  full precedence chain (explicit `--output-dir` > `CAUTILUS_RUN_DIR` >
  auto-materialize under `./.cautilus/runs/`). They emit `Active run:
  <abs path>` to stderr exactly once when they auto-materialize.
  Currently wired: `mode evaluate`, `workspace prepare-compare`.
- **Consume-only file-in/file-out helpers** call `readActiveRunDir`
  instead. They never mint a fresh `runDir`, never auto-materialize,
  and never emit the `Active run:` banner. The `### Consume-Only
  Helpers` subsection documents the exact rule. Scheduled to land on
  this pattern: `review prepare-input` and the rest of the
  consume-only list below.

`review variants` is not yet classified and will pick its pattern as
part of its own slice (see Probe Questions).

| Consumer              | Status     | Canonical rows                                                      | Notes                                                         |
| --------------------- | ---------- | ------------------------------------------------------------------- | ------------------------------------------------------------- |
| `mode evaluate`       | wired      | `report-input.json`, `report.json`, `<mode>-scenario-results.json`, `selected-profile.json`, `selected-scenario-ids.json`, `baseline-cache.json`, `<stage>-<index>.stdout/stderr` | `--output-dir` is optional. Mode-prefixed scenario-results keeps multi-mode coexistence inside one `runDir`. |
| `workspace prepare-compare` | wired  | `baseline/`, `candidate/`                                        | `--output-dir` is optional. Retries inside one active `runDir` reuse the git worktree registrations and rebuild `baseline/` and `candidate/` without requiring `--force`. |
| `report build`               | wired   | `report-input.json`, `report.json`                              | Consume-only helper. Defaults `--input` to `report-input.json` and `--output` to `report.json` inside the active run; keeps stdout fallback when no active run is pinned. |
| `review prepare-input`      | wired   | `review-packet.json`                                             | Consume-only helper. Defaults `--report-file` to `report.json` and `--output` to `review-packet.json` inside the active run; keeps stdout fallback when no active run is pinned. |
| `evidence prepare-input`    | wired   | `evidence-input.json`                                            | Consume-only helper. Defaults `--report-file` to `report.json` and `--output` to `evidence-input.json` inside the active run. `--scenario-results-file`, `--run-audit-file`, and `--history-file` stay explicit until they have single canonical runDir filenames. |
| `evidence bundle`           | wired   | `evidence-bundle.json`                                           | Consume-only helper. Defaults `--input` to `evidence-input.json` and `--output` to `evidence-bundle.json` inside the active run; keeps stdout fallback when no active run is pinned. |
| `optimize prepare-input`    | wired   | `optimize-input.json`                                            | Consume-only helper. Defaults `--report-file` to `report.json` and `--output` to `optimize-input.json` inside the active run. `--review-summary` and `--history-file` stay explicit until they have single canonical runDir filenames. |
| `optimize propose`          | wired   | `optimize-proposal.json`                                         | Consume-only helper. Defaults `--input` to `optimize-input.json` and `--output` to `optimize-proposal.json` inside the active run; keeps stdout fallback when no active run is pinned. |
| `optimize build-artifact`   | wired   | `revision-artifact.json`                                         | Consume-only helper. Defaults `--proposal-file` to `optimize-proposal.json` and `--output` to `revision-artifact.json` inside the active run; preserves the proposal-carried `inputFile` fallback. |
| `review variants`           | wired    | `variant-*.json`, `<stage>-<index>.stdout/stderr`               | Workflow-creating helper. `--output-dir` is optional; explicit path wins, otherwise it uses `CAUTILUS_RUN_DIR`, otherwise it auto-materializes a fresh runDir and emits `Active run:` once. |

### Consume-Only Helpers

File-in/file-out helpers that read and write inside an existing `runDir`
do **not** reuse the `resolveRunDir` helper. They use a separate
`readActiveRunDir({ env = process.env })` helper from
`scripts/agent-runtime/active-run.mjs` that returns the absolute path in
`CAUTILUS_RUN_DIR` when it is set and points at an existing directory,
throws loud if the env var is set but the path is missing or is not a
directory, and returns `null` when the env var is unset.

This separation is load-bearing because consume-only helpers must never
mint a fresh `runDir`. Only `mode evaluate` and `workspace
prepare-compare` are permitted to start a workflow; every other
runDir-aware command reads an existing active run or falls back to
command-specific legacy behavior when no active run is pinned and the
operator did not thread explicit paths.

Consume-only helpers also do **not** emit the `Active run:` stderr
banner. The banner is a workflow-creation signal, and consume-only
commands never create a workflow.

Commands that follow this pattern:

- `review prepare-input` (wired in slice 5)
- `evidence prepare-input` (wired with report/output defaults; multi-source optional inputs remain explicit)
- `optimize prepare-input` (wired with report/output defaults; review summary and history remain explicit)
- `report build` (wired)
- `evidence bundle` (wired)
- `optimize propose` (wired)
- `optimize build-artifact` (wired)

Each consume-only slice decides which canonical filenames become the
default for its `--input`-style and `--output`-style flags, records the
decision inline in the Canonical Filenames table above, and preserves
whatever pre-active-run backwards-compatible behavior the command
already had (for example, `review prepare-input` keeps writing to stdout
when neither an active run nor an explicit `--output` is available).

The conservative rule is load-bearing: only helpers whose source and
destination filenames are already singular and product-owned get
automatic active-run defaults. Inputs that still have multiple plausible
runDir candidates, such as mode-prefixed scenario-results files or
review/history artifacts that do not yet have canonical product-owned
filenames, stay explicit until the contract names them.

## Entry Surface

- `cautilus workspace start [--root R] [--label L] [--json]`
  - library: `scripts/agent-runtime/workspace-start.mjs`
  - default stdout: `export CAUTILUS_RUN_DIR='<abs runDir>'`
  - `--json` alternate: `cautilus.workspace_run_manifest.v1` payload
- `cautilus workspace prune-artifacts --root R [--keep-last N] [--max-age-days N]`
  - explicit opt-in. `workspace start` does not clean up older runs.

## Rejected Alternatives

Record these so future sessions do not re-propose them:

1. **Consumer `--artifact-root` flag (Option D)**. Each consumer would
   mint its own `runDir` when given `--artifact-root`. Breaks "one workflow
   = one runDir" — sibling directories proliferate inside one root, and
   the pruner sees N bundles per workflow instead of 1. Rejected.
2. **State file (`./.cautilus/active-run`)**. Persists the active `runDir`
   in a repo-local file instead of an env var. Stale across sessions
   (forgetting to finish lingers), unsafe across multiple shells, and adds
   a new failure mode (corrupt/missing state file). Rejected.
3. **mtime-latest resolution**. No env var; consumers resolve `runDir` by
   finding the most recently touched directory under the root. Ambiguous
   across parallel workflows, silently grabs yesterday's workflow across
   session gaps, requires a magic freshness threshold. Rejected.
4. **Zero-ceremony default (no `workspace start` at all)**. Each consumer
   materializes a fresh `runDir` by default. Multi-command workflows
   collapse back to explicit path threading — the original pain point.
   Rejected.
5. **Bundling `jq` as a dependency**. Only needed if stdout were JSON; the
   shell-export format makes `jq` unnecessary for the happy path. The
   `--json` branch stays available for automation that already has a JSON
   parser at hand. Rejected as unnecessary.

## Fixed Decisions

- Env var name is `CAUTILUS_RUN_DIR`. Single source of truth across the
  product, the bundled skill, and the packaged skill copy.
- Default root is `./.cautilus/runs/`, cwd-relative, auto-created.
- `workspace start` is the only per-run materializer entry. `workspace
  new-run` is removed, not aliased.
- The `run.json` manifest is intentionally thin: `schemaVersion`, `label`,
  `startedAt` — marker only.
- `workspace start` stdout is POSIX `export`, single-quoted.
- `--json` is the machine branch, not a drop-in alias.

## Probe Questions

- Should `--shell fish` (or similar) emit shell-specific `set -gx` syntax?
  Currently defer: `eval "$(...)"` inside a bash subshell from fish works
  via `bass`/`babelfish` and fish users typically already have that
  wrapper in place.
- Should `run.json` carry workflow metadata (mode, baseline ref, adapter
  name) so the pruner and HTML views can present richer summaries?
  Currently defer: per-command artifacts already carry that context.
- Should `evidence prepare-input`, `optimize prepare-input`, `report
  build`, `optimize propose`, and sibling helpers auto-resolve their
  `--input` / `--output` to canonical names inside the active run?
  **Resolved (slice 5 decision)**: yes, via a new `readActiveRunDir`
  helper rather than `resolveRunDir`. The full rule is captured in the
  `### Consume-Only Helpers` subsection above. Each consume-only slice
  decides its own canonical defaults and its own legacy fallback
  behavior, but the helper shape, the loud-fail validation rule, and
  the "no workflow minting, no `Active run:` banner" invariants are
  fixed for every file-in/file-out consumer after `mode evaluate` and
  `workspace prepare-compare`.
- Is `review variants` a workflow-creating command that mints runDirs
  (and therefore uses `resolveRunDir`), or is it a consume-only
  command that only reads an existing active run (and therefore uses
  `readActiveRunDir`)?
  **Resolved (slice 6 decision)**: workflow-creating. An operator can
  legitimately run `review variants` standalone with a hand-rolled
  `--prompt-file` plus `--schema-file`, no prior `mode evaluate`, and
  expect a fresh runDir for the resulting `variant-*.json` outputs.
  The command therefore follows the same precedence chain as other
  workflow-creating helpers (explicit `--output-dir` >
  `CAUTILUS_RUN_DIR` > auto-materialize under `./.cautilus/runs/`) and
  emits `Active run: <abs path>` once only when it auto-materializes.

## Source References

- [../../scripts/agent-runtime/active-run.mjs](/home/ubuntu/cautilus/scripts/agent-runtime/active-run.mjs)
- [../../scripts/agent-runtime/active-run.test.mjs](/home/ubuntu/cautilus/scripts/agent-runtime/active-run.test.mjs)
- [../../scripts/agent-runtime/workspace-start.mjs](/home/ubuntu/cautilus/scripts/agent-runtime/workspace-start.mjs)
- [../../scripts/agent-runtime/workspace-start.test.mjs](/home/ubuntu/cautilus/scripts/agent-runtime/workspace-start.test.mjs)
- [../../scripts/agent-runtime/prune-workspace-artifacts.mjs](/home/ubuntu/cautilus/scripts/agent-runtime/prune-workspace-artifacts.mjs)
- [./reporting.md](/home/ubuntu/cautilus/docs/contracts/reporting.md)
- [./review-packet.md](/home/ubuntu/cautilus/docs/contracts/review-packet.md)
- [./optimization.md](/home/ubuntu/cautilus/docs/contracts/optimization.md)
