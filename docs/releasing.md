# Releasing

`Cautilus` publishes through tagged GitHub releases, not npm.

The default release targets come from the current `origin` remote. In this
repo today that resolves to:

- source repo: `corca-ai/cautilus`
- tap repo: `corca-ai/homebrew-tap`

## Preconditions

- [LICENSE](../LICENSE) stays in sync with the public repo
- Go `1.26.2+`, `golangci-lint`, and `govulncheck` are installed in the
  maintainer clone
- `npm run hooks:check` passes in the maintainer clone
- `npm run verify` passes on `main`
- [release-boundary.md](./release-boundary.md) still
  matches the product-owned surface

## Release Steps

1. Prepare the checked-in release metadata with the target version.

```bash
npm run release:prepare -- 0.2.4
```

This updates the maintained version surfaces together:

- [package.json](../package.json)
- [package-lock.json](../package-lock.json)
- [.claude-plugin/marketplace.json](../.claude-plugin/marketplace.json)
- [plugins/cautilus/.claude-plugin/plugin.json](../plugins/cautilus/.claude-plugin/plugin.json)
- [plugins/cautilus/.codex-plugin/plugin.json](../plugins/cautilus/.codex-plugin/plugin.json)
- [install.md](../install.md)
- the packaged `plugins/cautilus/skills/cautilus/` tree from the bundled
  `skills/cautilus/` source

2. Run:

```bash
npm run hooks:check
npm run verify
npm run test:on-demand
cautilus --version
```

3. Commit and tag:

```bash
git tag v0.2.4
git push origin main --tags
```

The checked-in release workflow at
[release-artifacts.yml](../.github/workflows/release-artifacts.yml)
will re-run `verify`, build the tagged binary assets, compute checksums, render
the Homebrew formula, publish the formula to the tap repo when
`HOMEBREW_TAP_TOKEN` is available, generate GitHub artifact attestations from
the checksum manifest, and attach those artifacts to the GitHub release.

4. After GitHub exposes the release assets, verify the public installer path:

```bash
curl -fsSL https://raw.githubusercontent.com/corca-ai/cautilus/main/install.sh | sh
cautilus --version
```

5. Verify the supported install smoke matrix before treating the release line
   as closed:

- native macOS + `install.sh`
- native macOS + `brew install corca-ai/tap/cautilus`
- native Linux + `install.sh`
- native Linux + `brew install corca-ai/tap/cautilus`

On each machine, at minimum confirm:

```bash
cautilus --version
cautilus version --verbose
```

For Homebrew installs, also confirm:

```bash
cautilus update
```

6. Confirm the tagged checksum manifest was attached alongside the binary
   assets.

7. Verify the public provenance for one released binary with GitHub CLI:

```bash
gh attestation verify \
  "cautilus_0.2.0_linux_x64.tar.gz" \
  --repo corca-ai/cautilus
```

8. If you need the source-archive checksum for the Homebrew formula manually:

```bash
node ./scripts/release/fetch-github-archive-sha256.mjs --version v0.2.0
```

9. Render the Homebrew formula body:

```bash
node ./scripts/release/render-homebrew-formula.mjs \
  --version v0.2.0 \
  --sha256 <sha256>
```

10. Confirm the Homebrew tap repo was updated with the rendered formula.
   The default target for this repo is `corca-ai/homebrew-tap`.

## Guardrails

- Keep release artifacts on the checked-in binary matrix unless the public
  install contract changes explicitly.
- Keep checksum manifests and GitHub artifact attestations aligned; if the
  release workflow shape changes, update the verification example above in the
  same change.
- If the installer contract changes, update [README.md](../README.md),
  [install.md](../install.md),
  [docs/handoff.md](./handoff.md), and
  [docs/release-boundary.md](./release-boundary.md)
  in the same work unit.
- Keep the tap publication token name aligned with the shared org secret:
  `HOMEBREW_TAP_TOKEN`.
