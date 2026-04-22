# Releasing

`Cautilus` publishes through tagged GitHub releases, not npm.

The default release targets come from the current `origin` remote.
In this repo today that resolves to:

- source repo: `corca-ai/cautilus`

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

The checked-in release workflow at [release-artifacts.yml](../../.github/workflows/release-artifacts.yml) will re-run `verify`, build the tagged binary assets, compute checksums, generate GitHub artifact attestations from the checksum manifest, and attach those artifacts to the GitHub release.
After those artifacts are published, the same workflow now retries [verify-public-release.mjs](../../scripts/release/verify-public-release.mjs) until the public release API reflects the tagged version, so a green workflow run means the product-owned public release surface is visible from GitHub.

5. Treat the tag-triggered workflow as the default owner of public release verification.
   Do not include a local public-release verification replay in the normal maintainer checklist.
   Only run the helper below for workflow debugging or an explicit manual re-check after the tagged workflow has already had time to publish the release object and assets:

```bash
node ./scripts/release/verify-public-release.mjs --version v<next-version>
```

The helper checks the tagged GitHub release for:

- the expected binary asset matrix
- the release checksum assets
- the checked-in release notes asset

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
- native Linux + `install.sh`

On each machine, at minimum confirm:

```bash
cautilus --version
cautilus version --verbose
```

8. Verify the public provenance for one released binary with GitHub CLI:

```bash
gh attestation verify \
  "cautilus_<next-version>_linux_x64.tar.gz" \
  --repo corca-ai/cautilus
```

9. If you need the source-archive checksum manually:

```bash
node ./scripts/release/fetch-github-archive-sha256.mjs --version v<next-version>
```

## Guardrails

- Keep release artifacts on the checked-in binary matrix unless the public install contract changes explicitly.
- Keep checksum manifests and GitHub artifact attestations aligned; if the release workflow shape changes, update the verification example above in the same change.
- If the installer contract changes, update [README.md](../../README.md), [handoff.md](../internal/handoff.md), and [release-boundary.md](./release-boundary.md) in the same work unit.
- Keep branch push and tag push in the checked-in helper order; do not recreate the release race with manual `git push --tags`.
