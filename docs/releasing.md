# Releasing

`Cautilus` publishes through tagged GitHub releases, not npm.

The default release targets come from the current `origin` remote. In this
repo today that resolves to:

- source repo: `corca-ai/cautilus`
- tap repo: `corca-ai/homebrew-tap`

## Preconditions

- [LICENSE](/home/ubuntu/cautilus/LICENSE) stays in sync with the public repo
- `npm run verify` passes on `main`
- [release-boundary.md](/home/ubuntu/cautilus/docs/release-boundary.md) still
  matches the product-owned surface

## Release Steps

1. Bump [package.json](/home/ubuntu/cautilus/package.json) version.
2. Run:

```bash
npm run verify
node ./bin/cautilus --version
```

3. Commit and tag:

```bash
git tag v0.1.0
git push origin main --tags
```

The checked-in release workflow at
[release-artifacts.yml](/home/ubuntu/cautilus/.github/workflows/release-artifacts.yml)
will re-run `verify`, compute the tagged archive checksum, render the Homebrew
formula, and attach those artifacts to the GitHub release.

4. After GitHub exposes the release archive, compute the checksum:

```bash
node ./scripts/release/fetch-github-archive-sha256.mjs --version v0.1.0
```

5. Render the Homebrew formula body:

```bash
node ./scripts/release/render-homebrew-formula.mjs \
  --version v0.1.0 \
  --sha256 <sha256>
```

6. Update the Homebrew tap repo with the rendered formula.
   The default target for this repo is `corca-ai/homebrew-tap`.
7. Verify the public installer path:

```bash
curl -fsSL https://raw.githubusercontent.com/corca-ai/cautilus/main/install.sh | sh
cautilus --version
```

## Guardrails

- Keep release artifacts source-based unless a stronger binary distribution
  contract is added explicitly.
- If the installer contract changes, update [README.md](/home/ubuntu/cautilus/README.md),
  [docs/handoff.md](/home/ubuntu/cautilus/docs/handoff.md), and
  [docs/release-boundary.md](/home/ubuntu/cautilus/docs/release-boundary.md)
  in the same work unit.
- Do not claim Homebrew tap publication until the tap repo actually exists and
  points at tagged GitHub archives.
