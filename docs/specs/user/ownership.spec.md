# Product And Host Ownership

Cautilus owns the common evaluation workflow; the host repo owns the behavior being evaluated.

## User Promise

Cautilus standardizes claim, eval, optimize, readiness, and evidence packets without secretly taking over a repo's app, prompts, runners, credentials, or policy.

## Subclaims

- Host repos own prompts, model choices, credentials, runtime wiring, and acceptance policy.
- Cautilus-owned packets make the workflow reviewable across repos.
- Adapter-owned commands keep host behavior explicit instead of hiding it inside product logic.
- The same product workflow can be reused across repos because repo-specific behavior lives in adapters and fixtures.

## Evidence

- The maintainer-side proof of host-owned-runner invocation lives at [docs/specs/maintainer/adapter-host-ownership.spec.md](../maintainer/adapter-host-ownership.spec.md), which is where the adapter contract test and consumer dogfood are owned.
- [scripts/on-demand/smoke-external-consumer.test.mjs](../../../scripts/on-demand/smoke-external-consumer.test.mjs) bootstraps a temporary consumer repo through `npm run consumer:onboard:smoke` and exercises the end-to-end install → adapter init → first bounded run path against host-owned wiring.

## Evidence Gaps

- Per-host-owned-field test against [docs/contracts/adapter-contract.md](../../contracts/adapter-contract.md) (prompts, model choice, credentials, runtime launch). Owner: maintainer. Next action: enumerate the host-owned fields and author one focused test per field; existing `internal/runtime/adapter_test.go` covers shape but not per-field binding.
