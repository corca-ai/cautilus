# Development

Dev environment, checks, and self-dogfood workflow for working on the `Cautilus` product itself.
For consumer installation and use, see the [README](../../README.md).

## Tooling

Install the local Node tooling, and make sure Go `1.26.5+`, `golangci-lint`, and `govulncheck` are available on `PATH` (or under `$(go env GOPATH)/bin`):

```bash
npm install
npm run hooks:install
go version
golangci-lint --version
govulncheck --version
```

`hooks:install` is a once-per-clone setup step that points `core.hooksPath` at the checked-in `.githooks` directory, where `pre-push` runs `npm run verify` and generated artifact drift checks through a tracked-worktree guard.

Adapter bootstrap, release/install helpers, and provider-facing command wrappers still live in Node where that keeps the product boundary thinner.
Shipped behavior semantics for native product surfaces belong in Go under `internal/runtime/`.
For `improve search`, the source of truth is the Go runtime plus its Go tests, not the Node research harness.
Retired richer Node improve-search experiments live under `scripts/experiments/improve-search-js/` so they cannot masquerade as shipped `agent-runtime` behavior.
The standalone release surface does not depend on `python3`.

## Standing checks

```bash
npm run verify
npm run hooks:check
```

Use these before stopping.
Use `npm run lint` or `npm run test` directly only when iterating on one seam.
`npm run lint` includes placeholder drift, `golangci-lint run`, `go vet`, and `govulncheck`.
`npm run verify` runs the same standing lint phases, then adds `go test -race` before the standing Node test suite.
Do not require all three in sequence before stopping.
`npm run lint:specs` validates the spec index, checks relative spec links, runs the full public spec suite with `specdown run -quiet`, validates the typed trace graph, and checks generated promise-ledger drift from that same trace.
On success it prints a compact timing line for the check, specdown, trace, and ledger phases so future slow-gate work can start from measured hot spots.
Pass one or more spec files after `--` to validate only those linked files and run each one as a focused temporary specdown entry:

```bash
npm run lint:specs -- docs/specs/promises/claim-discovery.spec.md
```

Use `npm run specdown` when you want the full reporter output instead of the quiet standing gate.

## Rendered Markdown Preview

When landing docs or public spec prose change, preview the rendered markdown instead of trusting source line breaks alone.

```bash
npm run docs:preview
```

This writes `glow` snapshots and `manifest.json` under `.artifacts/markdown-preview/` for:

- `README.md`
- `docs/specs/*.md`

When `.agents/markdown-preview.yaml` exists, `docs:preview` uses that checked-in scope, widths, and artifact directory instead of the built-in defaults.

Useful narrower paths:

```bash
npm run docs:preview:changed
npm run docs:preview:specs
npm run docs:preview -- docs/guides docs/specs/user/index.spec.md
```

`docs:preview:changed` only renders matching markdown files currently shown by `git status`.
Pass explicit files or directories after `--` when you want to inspect one guide or one prose subtree instead of the default landing docs plus public specs.
`quality` and `narrative` can reuse the checked-in `.agents/markdown-preview.yaml` scope through the shared charness support helper.
The preview command is intentionally advisory, not part of `pre-push`.
Install `glow` first if the command is missing on `PATH`:

```bash
brew install glow
```

## Test layering

Keep each layer honest so the same claim is not restated three times.

- `docs/specs/user/**/*.spec.md` and `docs/specs/contracts/**/*.spec.md` own the active claim specs.
- `docs/specs/old/*.spec.md` keeps archived proof specs until they are absorbed or removed.
- `internal/app/app_test.go` owns single-command native command behavior and JSON payload shape.
- `internal/app/cli_smoke_test.go` owns multi-command integration flows that mutate repos, install surfaces, or write artifact trees.
- `scripts/on-demand/*.test.mjs` owns heavier end-to-end consumer and self-dogfood flows that are valuable but too expensive for the standing gate.

When adding a new check, start from the narrowest layer that can prove the behavior.
Do not add a new CLI smoke test for a single-command contract that is already covered by a public spec and an app-level test.
Do not push deterministic helper logic into an end-to-end smoke when a fixture-backed unit test can prove it more precisely.

## On-demand checks

```bash
npm run test:on-demand
```

Not part of the standing gate.
Owns the heavier self-dogfood workflow script tests that prove operator-facing quality record behavior without paying that cost on every `pre-push` and CI `verify` run.
Run it when changing release-prep flow, self-dogfood workflow scripts, or operator-facing quality record behavior.

## Self-dogfood workflow

Refresh the canonical latest bundle and its HTML view:

```bash
npm run dogfood:self
```

`dogfood:self` is explicit quality work, not a standing pre-push or CI gate.
It currently delegates to `dogfood:self:eval` and refreshes `artifacts/self-dogfood/eval/latest/`.
Its canonical claim is intentionally narrow: the shipped `cautilus evaluate` runner can exercise the repo's checked-in self-dogfood adapter and materialize a current evaluation summary packet without relying on one-off manual wiring.

Refresh the canonical `dev / repo` self-dogfood bundle:

```bash
npm run dogfood:self:eval
```

This is also on-demand quality work, not a standing pre-push or CI gate.
It refreshes `artifacts/self-dogfood/eval/latest/`.
The canonical claim is the same as `dogfood:self`: the shipped `cautilus evaluate` runner can exercise the repo's checked-in self-dogfood adapter and materialize a current evaluation summary packet without relying on one-off manual wiring.
The broader report/review self-dogfood and tuning-experiment runners were retired with `mode evaluate`.
Rebuild them on the eval-test surface before restoring commands that claim report/review or experiment coverage.

When a change touches subagent orchestration, fanout workers, or the `subagent_execution_proof` audit, run the live-runtime subagent dogfood gate:

```bash
npm run dogfood:subagent-execution-proof
```

Use the backend-specific wrappers while iterating:

```bash
npm run dogfood:subagent-execution-proof:codex
npm run dogfood:subagent-execution-proof:claude
```

This uses the checked-in `dev / skill` fixture and named adapter to verify that the selected coding-agent CLI produced auditable completed child-result evidence.
The aggregate wrapper runs the Codex and Claude backend checks independently and reports failure only after both have produced whatever readiness artifacts they can.
The backend-specific wrappers pin lightweight live models, so model entitlement failures should be read as local runtime setup failures.

Refresh the HTML views without replaying LLM-backed reviews:

```bash
npm run dogfood:self:html
```

This is a thin wrapper around the product-owned `cautilus doctor artifacts render-self-dogfood-html` command (see [cli.md](../guides/cli.md)).

## Runtime ownership

Keep runtime ownership explicit so Node helpers do not silently grow a second product runtime again.

- `internal/runtime/` owns shipped behavior semantics for native product surfaces.
- `scripts/agent-runtime/` may own thin wrappers, fixture helpers, and provider command glue, but not the sole shipped meaning of a surface.
- richer retired Node product experiments belong under `scripts/experiments/`, not under `scripts/agent-runtime/`
- If a change alters shipped `improve search` behavior, the same slice must update the Go runtime and its Go acceptance tests.
- If a richer Node experiment needs to exist before parity lands, keep it clearly experimental and do not let product docs or release claims treat it as the shipped runtime.

## Release verification

The tag-triggered release workflow now retries public release verification until the GitHub release API and tap formula expose the tagged version.
That check is CI-owned and is not part of the normal local release checklist.
If you need to replay it locally for workflow debugging after the release workflow has already published the tagged release, run:

```bash
node ./scripts/release/verify-public-release.mjs --version <tag>
```

## Commit discipline

Per [AGENTS.md](../../AGENTS.md), create a git commit after each meaningful unit of work.
Write commit subjects so later announcements can recover intent without guessing — state user-facing or operator-facing purpose, not mechanism.
Add a short body when it clarifies the trigger, boundary, or behavior change.
