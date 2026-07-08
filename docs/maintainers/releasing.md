# Releasing

`Cautilus` publishes through tagged GitHub releases, not npm.

The default release targets come from the current `origin` remote.
In this repo today that resolves to:

- source repo: `corca-ai/cautilus`

## Preconditions

- [LICENSE](../../LICENSE) stays in sync with the public repo
- Go `1.26.5+`, `golangci-lint`, and `govulncheck` are installed in the maintainer clone
- `npm run hooks:check` passes in the maintainer clone
- `npm run verify` passes on `main`
- `npm run security:secrets:history` passes in the maintainer clone before the tag is prepared
- `npm run release:claim-freshness` passes before the tag is prepared
- `npm run release:publisher-policy:check` passes before the tag is prepared
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
- the packaged `plugins/cautilus/skills/cautilus-agent/` tree from the bundled `skills/cautilus-agent/` source (upward relative markdown links inside `.md` files are rewritten so they still resolve to the same repo-root targets from the two-levels-deeper packaged location; sibling `./X` links and non-markdown files stay byte-identical)

The repo-local Codex marketplace at [.agents/plugins/marketplace.json](../../.agents/plugins/marketplace.json) is a release-packaging audit surface, but it has no version field and `release:prepare` does not rewrite it.

2. Run:

```bash
npm run hooks:check
npm run verify
npm run security:secrets:history
npm run release:publisher-policy:check
npm run test:on-demand
cautilus --version
```

3. Commit the checked-in release metadata:

```bash
git commit -am "Prepare v<next-version> release"
```

Before publishing, make sure [charness-artifacts/release/latest.md](../../charness-artifacts/release/latest.md) already mentions the target tag and includes release scope plus verification context.
The publish helper audits this narrative surface together with the public release-note workflow template, so a stale release record or a release-note pointer back to mutable tagged source context blocks tagging.

4. Publish the release ref in one ordered helper:

```bash
npm run release:publish -- --version <next-version>
```

This helper refuses a dirty worktree, verifies the checked-in release surface already matches the target version, verifies the release narrative is target-specific and the public release-note template is self-contained, pushes `HEAD` to the target branch first, verifies the remote branch target, then creates `v<version>` at `HEAD`, verifies both local and remote tag targets, and pushes only that tag.
Its JSON and text output separate release states: `localPrepared`, `auditNarrativeCommitted`, `requestedReviewCommands`, `branchPushed`, `tagPushed`, `workflowPublication`, `publicReleaseVerification`, and `postPublishInstallReadback`.
If a later publish step fails after an earlier step was verified, the helper reports the same release-state ledger on failure so the operator can see whether the branch, tag, workflow, or public release boundary is still open.
Do not replace it with ad-hoc parallel `git commit` / `git tag` / `git push --tags` invocations.
Use `--target-branch main` when publishing from a prepared release branch or detached release worktree that should update `main`.
The release adapter's requested review commands are part of the release gate and include the full git-history secret scan; if they fail, fix the deterministic surface before tagging.
The publish helper runs those requested review commands before pushing the branch or tag.

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
- the checked-in release notes asset, including source archive checksum agreement and source-tree release-record pointer rejection

For eventual-consistency windows outside CI, the helper also supports bounded retries:

```bash
node ./scripts/release/verify-public-release.mjs --version v<next-version> --retry-attempts 10 --retry-delay-ms 30000
```

6. Verify the public installer path:

```bash
npm run release:smoke-install -- --channel install_sh --version v<next-version>
```

The current-version wrapper below is the adapter-recorded post-publish install smoke readback for the checked-in package version:

```bash
npm run release:smoke-install:current -- --skip-update
```

That readback intentionally skips `cautilus update`; it confirms install and version readback after the public release is visible.
The full smoke command above omits `--skip-update` and verifies update behavior too.

The full smoke command runs the public `install.sh` flow inside an isolated temp install root, then verifies:

- `cautilus --version`
- `cautilus version --verbose`
- `cautilus update`

The adapter-recorded readback verifies only:

- `cautilus --version`
- `cautilus version --verbose`

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
