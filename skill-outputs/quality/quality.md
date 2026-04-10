# Quality Review

Date: 2026-04-10

## Scope

Repo-wide quality pass to:

- confirm the current executable gate surface
- close missing repo-local quality SoT for this repo
- choose the next product-owned helper slice honestly

## Commands Run

- `node ./bin/cautilus adapter resolve --repo-root .`
- `npm run lint`
- `npm run test`
- `npm run verify`

## Healthy

- The canonical local gates are green: `npm run lint`, `npm run test`, and
  `npm run verify` all pass.
- The repo now has a checked-in `.agents/quality-adapter.yaml`, so the current
  quality gate surface is no longer only implied by `AGENTS.md` and
  `package.json`.
- Standalone product SoT now stays aligned across the CLI, bundled skill,
  README, specs, fixture schemas, and contract docs for the new optimizer
  seam.
- The first bounded optimizer surface is now product-owned and deterministic:
  `optimize prepare-input` assembles explicit evidence, and `optimize propose`
  turns that packet into one bounded revision brief.

## Weak

- The new optimizer seam is product-owned and tested locally, but it is not yet
  proven through a live consumer such as `crill` or `ceal`.

## Missing

- No product-owned evidence-bundle helper exists yet for host-normalized raw
  evidence mining.

## Recommended Next Gates

- `AUTO_EXISTING`: keep `.agents/quality-adapter.yaml` pointed at
  `npm run lint`, `npm run test`, and `npm run verify` so local and documented
  quality surfaces stay aligned.
- `AUTO_CANDIDATE`: add one consumer-level proof for the optimizer seam after a
  repo such as `crill` gains a checked-in optimize input artifact.
- `DEFER`: keep HTML report work in a separate worktree so it does not blur the
  contract/helper boundary in the main checkout.
