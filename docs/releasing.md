# Releasing

`Cautilus` publishes through tagged GitHub releases, not npm.

The default release targets come from the current `origin` remote. In this
repo today that resolves to:

- source repo: `corca-ai/cautilus`
- tap repo: `corca-ai/homebrew-tap`

## Preconditions

- [LICENSE](../LICENSE) stays in sync with the public repo
- Go `1.26.x` and `golangci-lint` are installed in the maintainer clone
- `npm run hooks:check` passes in the maintainer clone
- `npm run verify` passes on `main`
- [release-boundary.md](./release-boundary.md) still
  matches the product-owned surface

## Release Steps

1. Bump [package.json](../package.json) version.
2. Run:

```bash
npm run hooks:check
npm run verify
cautilus --version
```

3. Commit and tag:

```bash
git tag v0.2.0
git push origin main --tags
```

The checked-in release workflow at
[release-artifacts.yml](../.github/workflows/release-artifacts.yml)
will re-run `verify`, build the tagged binary assets, compute checksums, render
the Homebrew formula, and attach those artifacts to the GitHub release.

4. After GitHub exposes the release assets, verify the public installer path:

```bash
curl -fsSL https://raw.githubusercontent.com/corca-ai/cautilus/main/install.sh | sh
cautilus --version
```

5. Confirm the tagged checksum manifest was attached alongside the binary
   assets.

6. If you need the source-archive checksum for the reference Homebrew formula:

```bash
node ./scripts/release/fetch-github-archive-sha256.mjs --version v0.2.0
```

7. Render the Homebrew formula body:

```bash
node ./scripts/release/render-homebrew-formula.mjs \
  --version v0.2.0 \
  --sha256 <sha256>
```

8. Update the Homebrew tap repo with the rendered formula.
   The default target for this repo is `corca-ai/homebrew-tap`.

## Guardrails

- Keep release artifacts on the checked-in binary matrix unless the public
  install contract changes explicitly.
- If the installer contract changes, update [README.md](../README.md),
  [docs/handoff.md](./handoff.md), and
  [docs/release-boundary.md](./release-boundary.md)
  in the same work unit.
- Do not claim Homebrew tap publication until the tap repo actually exists and
  points at tagged GitHub archives.
