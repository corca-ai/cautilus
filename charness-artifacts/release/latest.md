# Release Surface Check
Date: 2026-07-16

Released Cautilus `v0.19.4`.

## Release Scope

Patch release (0.19.3 → 0.19.4) bundling two internal themes with no consumer-visible binary or Cautilus Agent behavior change:

- find-skills retirement realign: removed dangling references to the retired upstream `find-skills` skill from AGENTS.md and docs, added `docs/contracts/find-skills-retirement-realign.md`, re-captured the Behavior Evaluation flagship live proof on a find-skills-free AGENTS.md, and realigned the shipped `evaluate observation --example-input` example off the retired token.
- quality tooling: a packaged cautilus-agent mirror parity gate (`lint:skill-packaged-sync`), hermetic coverage-floor tests, a monotonic coverage-floor writer with `--only-stale`/`--buffer` modes (`coverage:floor:raise-stale`), and 13 stale coverage floors raised off placeholder values.

## Current Version

- previous version: `0.19.3`
- target version: `0.19.4`
- git branch: `main`
- git remote: `origin`

## Verification

- `npm run verify` passed before publish.
- The v0.19.4 release critique (`charness-artifacts/critique/2026-07-16-v0-19-4-release-critique.md`) cleared the release: patch bump justified, the one Act-Before-Ship item (this record) resolved, and the examples.go find-skills emission fixed in this release rather than deferred.
- `npm run release:claim-freshness` reported the claim packet `fresh` and HEAD-reachable before tagging.

## Non-Claims

- The GitHub release-notes asset is provenance-oriented and is not claimed to carry this operator narrative.
- No native macOS execution proof was run; Linux/current-host install proof does not substitute for it.
- No provider-backed or live evaluator behavior was exercised for this patch beyond the already-committed re-captured flagship live proof.
- The 13 raised coverage floors use a conservative 10pp buffer and are not claimed to be tight ratchets; several internal (non-shipped) `find-skills` references remain frozen by the retirement contract's FD5/AC4.

## User Update Steps

- Binary operators update by re-running `curl -fsSL https://raw.githubusercontent.com/corca-ai/cautilus/main/install.sh | sh`, and roll back by setting `CAUTILUS_VERSION=v0.19.3` when running that installer, then checking `cautilus --version`.
- Cautilus Agent and plugin behavior content did not change in this patch, so Agent-only consumers do not need `charness update` or `cautilus init` for it.
