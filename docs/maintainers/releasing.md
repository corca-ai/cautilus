# Releasing

`Cautilus` publishes through tagged GitHub releases, not npm.

The default release targets come from the current `origin` remote.
In this repo today that resolves to:

- source repo: `corca-ai/cautilus`
- tap repo: `corca-ai/homebrew-tap`

## Preconditions

- [LICENSE](../../LICENSE) stays in sync with the public repo
- Go `1.26.2+`, `golangci-lint`, and `govulncheck` are installed in the maintainer clone
- `npm run hooks:check` passes in the maintainer clone
- `npm run verify` passes on `main`
- [release-boundary.md](./release-boundary.md) still matches the product-owned surface

## Release Steps

1. Prepare the checked-in release metadata with the target version.

```bash
npm run release:prepare -- <next-version>
```

This updates the maintained version surfaces together:

- [package.json](../../package.json)
- [package-lock.json](../../package-lock.json)
- [.claude-plugin/marketplace.json](../../.claude-plugin/marketplace.json)
- [plugins/cautilus/.claude-plugin/plugin.json](../../plugins/cautilus/.claude-plugin/plugin.json)
- [plugins/cautilus/.codex-plugin/plugin.json](../../plugins/cautilus/.codex-plugin/plugin.json)
- [install.md](../../install.md)
- the packaged `plugins/cautilus/skills/cautilus/` tree from the bundled `skills/cautilus/` source (upward relative markdown links inside `.md` files are rewritten so they still resolve to the same repo-root targets from the two-levels-deeper packaged location; sibling `./X` links and non-markdown files stay byte-identical)

2. Run:

```bash
npm run hooks:check
npm run verify
npm run test:on-demand
cautilus --version
```

3. Commit the checked-in release metadata:

```bash
git commit -am "Prepare v<next-version> release"
```

4. Publish the release ref in one ordered helper:

```bash
npm run release:publish -- --version <next-version>
```

This helper refuses a dirty worktree, verifies the checked-in release surface already matches the target version, pushes the current branch first, then creates `v<version>` at `HEAD`, verifies the tag target, and pushes only that tag.
Do not replace it with ad-hoc parallel `git commit` / `git tag` / `git push --tags` invocations.

The checked-in release workflow at [release-artifacts.yml](../../.github/workflows/release-artifacts.yml) will re-run `verify`, build the tagged binary assets, compute checksums, render the Homebrew formula, publish the formula to the tap repo when `HOMEBREW_TAP_TOKEN` is available, generate GitHub artifact attestations from the checksum manifest, and attach those artifacts to the GitHub release.
After those artifacts are published, the same workflow now retries [verify-public-release.mjs](../../scripts/release/verify-public-release.mjs) until the public release API and tap formula reflect the tagged version, so a green workflow run means the product-owned public release surface is visible from GitHub.

5. Treat the tag-triggered workflow as the default owner of public release verification.
   Do not include a local public-release verification replay in the normal maintainer checklist.
   Only run the helper below for workflow debugging or an explicit manual re-check after the tagged workflow has already had time to publish the release object and assets:

```bash
node ./scripts/release/verify-public-release.mjs --version v<next-version>
```

The helper checks the tagged GitHub release for:

- the expected binary asset matrix
- the release checksum assets
- the rendered `Cautilus.rb` artifact
- the checked-in release notes asset
- the published Homebrew tap formula, unless `--skip-tap-check` is used

For eventual-consistency windows outside CI, the helper also supports bounded retries:

```bash
node ./scripts/release/verify-public-release.mjs --version v<next-version> --retry-attempts 10 --retry-delay-ms 30000
```

6. Verify the public installer path:

```bash
npm run release:smoke-install -- --channel install_sh --version v<next-version>
```

This runs the public `install.sh` flow inside an isolated temp install root, then verifies:

- `cautilus --version`
- `cautilus version --verbose`
- `cautilus update`

7. Verify the supported install smoke matrix before treating the release line as closed:

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

The product-owned smoke helper can also drive the Homebrew path, but it requires explicit opt-in because it mutates the host package-manager state.
On a Linux or macOS machine that already has Homebrew installed, use the dedicated on-demand npm script (`--allow-system-mutation` is wired in):

```bash
npm run release:smoke-install:brew -- --version v<next-version>
```

The underlying helper is also reachable without the npm wrapper if another flag combination is needed:

```bash
npm run release:smoke-install -- --channel homebrew --version v<next-version> --allow-system-mutation
```

`release:smoke-install:brew` is intentionally on-demand only: it is not wired into `verify`, pre-push hooks, or CI.
Run it when a release line is being closed, not on every repo change.

8. Verify the public provenance for one released binary with GitHub CLI:

```bash
gh attestation verify \
  "cautilus_<next-version>_linux_x64.tar.gz" \
  --repo corca-ai/cautilus
```

9. If you need the source-archive checksum for the Homebrew formula manually:

```bash
node ./scripts/release/fetch-github-archive-sha256.mjs --version v<next-version>
```

10. Render the Homebrew formula body:

```bash
node ./scripts/release/render-homebrew-formula.mjs \
  --version v<next-version> \
  --sha256 <sha256>
```

11. Confirm the Homebrew tap repo was updated with the rendered formula if you skipped the scripted tap check.
    The default target for this repo is `corca-ai/homebrew-tap`.

## Guardrails

- Keep release artifacts on the checked-in binary matrix unless the public install contract changes explicitly.
- Keep checksum manifests and GitHub artifact attestations aligned; if the release workflow shape changes, update the verification example above in the same change.
- If the installer contract changes, update [README.md](../../README.md), [install.md](../../install.md), [handoff.md](../internal/handoff.md), and [release-boundary.md](./release-boundary.md) in the same work unit.
- Keep the tap publication token name aligned with the shared org secret: `HOMEBREW_TAP_TOKEN`.
- Keep branch push and tag push in the checked-in helper order; do not recreate the release race with manual `git push --tags`.
