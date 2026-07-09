# Release Critique

Date: 2026-07-09

## Execution

Fresh-eye release critique ran through subagent `019f442a-343b-7182-b86a-7829fae91d40`.

## Fresh-Eye Satisfaction

parent-delegated

## Packet Consumed

n/a — release critique used the current working tree, CLI output-format contract, release adapter, and active goal artifact directly.

## Target

`release-critique`

## Release Scope

Version: `0.19.0`.
Tag: `v0.19.0`.
Consumer-facing change: minor release for structured CLI stdout defaulting to YAML, with `--format json` and compatible `--json` parser paths preserved.

## Surface-Lock Inventory

- `internal/app/app.go` CLI output-format parsing and structured stdout writing.
- `internal/app/app_test.go` and CLI smoke tests for YAML defaults, JSON override, and `init run` shell-export exception.
- `internal/cli/command-registry.json` command usage metadata.
- `scripts/agent-runtime/render-claim-evidence-state.mjs` and `scripts/release/check-claim-freshness.mjs` parser-facing internal commands.
- `docs/contracts/cli-output-format.md` and linked guide/spec surfaces.
- Source, packaged, and repo-local Cautilus Agent guidance.
- Generated claim artifacts under `.cautilus/claims/` and `docs/specs/generated/`.

## Findings

### Act Before Ship

- `discover claims status --json`, `evaluate claims plan --json`, and `discover claims validate --json` were advertised but failed with `unknown argument: --json`.
  Disposition: fixed by making the global output-format parser consume `--json` as a JSON stdout alias instead of forwarding it to command-local parsers.
- Wrapping stdout in `formattedWriter` before update-notice detection made interactive stdout look non-interactive.
  Disposition: fixed by detecting interactivity before wrapping stdout for formatted structured output.

### Bundle Anyway

- Parser-facing docs and scripts should prefer `--format json` even though `--json` remains compatible.
  Disposition: kept as the documented canonical parser path while targeted alias tests protect compatibility.

### Over-Worry

- Converting `--json` into a global alias could have broken commands that used it as a structured-output toggle.
  Disposition: `init run` and `improve search prepare-input` now use the writer explicit-format flag so `--json` still triggers structured output without leaking into parser args.

### Valid But Defer

- External consumers that parse default stdout without `--format json` may need release-note guidance.
  Disposition: release notes call out the new default and the parser-safe `--format json` path.

## Verification

- Targeted app test: `go test ./internal/app` passed after fixes.
- Alias smoke: `./bin/cautilus discover claims status --input .cautilus/claims/latest.json --sample-claims 1 --json` produced parseable JSON.
- Alias smoke: `./bin/cautilus evaluate claims plan --claims .cautilus/claims/evidenced-typed-runners.json --max-claims 1 --allow-stale-claims --json` produced parseable JSON.
- Alias smoke: `./bin/cautilus discover claims validate --claims .cautilus/claims/evidenced-typed-runners.json --json` produced parseable JSON.

## Operator Action Required

- Re-run broad verification after this critique disposition.
- Commit the implementation and critique proof before release preparation.
- Publish through the repo-owned release helper after `v0.19.0` release metadata is prepared.

## Upgrade Path

Operators with an existing install refresh the binary via the install-sh channel by re-running:

```bash
curl -fsSL https://raw.githubusercontent.com/corca-ai/cautilus/main/install.sh | sh
```

Claude Code and Codex plugin consumers pick up the Cautilus Agent refresh via `charness update` or by re-running `cautilus init` in the host repo.

## Deliberately Not Doing

- No JSON packet files or `--output` files are converted to YAML.
- No `--json` compatibility alias is removed.
- No default `init run` shell-export behavior is converted to YAML.

## Next Move

Proceed after broad verification, release preparation, release narrative update, dry-run publish, and clean-worktree checks pass.
