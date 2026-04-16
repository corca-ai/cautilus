# Development

Dev environment, checks, and self-dogfood workflow for working on the `Cautilus` product itself.
For consumer installation and use, see the [README](../../README.md) and [install.md](../../install.md).

## Tooling

Install the local Node tooling, and make sure Go `1.26.2+`, `golangci-lint`, and `govulncheck` are available on `PATH` (or under `$(go env GOPATH)/bin`):

```bash
npm install
npm run hooks:install
go version
golangci-lint --version
govulncheck --version
```

`hooks:install` is a once-per-clone setup step that points `core.hooksPath` at the checked-in `.githooks` directory, where `pre-push` runs `npm run verify`.

Adapter bootstrap, readiness, and review-variant JSON helpers live inside the product-owned Node runtime.
The standalone release surface does not depend on `python3`.

## Standing checks

```bash
npm run verify
npm run hooks:check
```

Use these before stopping.
Use `npm run lint` or `npm run test` directly only when iterating on one seam.
`npm run lint` includes `golangci-lint run`, `go vet`, and `govulncheck`.
`npm run verify` additionally runs `go test -race` before the standing Node test suite.
Do not require all three in sequence before stopping.
`npm run lint:specs` validates the spec index, checks relative spec links, and runs the full public spec suite with `specdown run -quiet`.
Use `npm run specdown` when you want the full reporter output instead of the quiet standing gate.

## Test layering

Keep each layer honest so the same claim is not restated three times.

- `docs/specs/*.spec.md` owns cheap public executable proofs for reader-facing product claims.
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
It refreshes `artifacts/self-dogfood/latest/`.
Its canonical claim is intentionally narrow: it should tell operators whether Cautilus is recording and surfacing its own self-dogfood result honestly, not whether every stronger binary or skill claim has already been proven.
The `latest/` bundle is the published snapshot meant to be checked into Git, so CI or a static HTML report can inspect the latest result without replaying the LLM-backed review.

The rendered HTML is written alongside the other published files at `artifacts/self-dogfood/latest/index.html` and is automatically refreshed every time `npm run dogfood:self` rewrites the latest bundle.

Tuning path for named A/B and split-surface reviews, including stronger binary and skill surface claims:

```bash
npm run dogfood:self:experiments
```

Writes aggregate experiment results under `artifacts/self-dogfood/experiments/latest/`, including a static `index.html` comparison view.
The view exists so the deterministic gate baseline and named experiment adapters can be compared side by side without reconstructing an A/B diff by hand.

Refresh the HTML views without replaying LLM-backed reviews:

```bash
npm run dogfood:self:html
npm run dogfood:self:experiments:html
```

These are thin wrappers around the product-owned `cautilus self-dogfood render-html` and `cautilus self-dogfood render-experiments-html` commands (see [cli-reference.md](../cli-reference.md)).

## Release verification

After a tag is published, verify the public release surface with:

```bash
npm run release:verify-public -- --version <tag>
```

## Commit discipline

Per [AGENTS.md](../../AGENTS.md), create a git commit after each meaningful unit of work.
Write commit subjects so later announcements can recover intent without guessing — state user-facing or operator-facing purpose, not mechanism.
Add a short body when it clarifies the trigger, boundary, or behavior change.
