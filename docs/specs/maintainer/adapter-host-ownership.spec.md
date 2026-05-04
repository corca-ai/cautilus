# Adapter And Host Ownership

Host repos own runtime-specific behavior.

Aligned user claims: U2, U5.
Proof route: deterministic plus consumer dogfood.
Current evidence status: partial.
Next action: connect adapter contract tests and at least one consumer repo proof that Cautilus invokes host-owned runners without importing host-specific logic.
Absorbs: adapters, prompts, model choice, credentials, runtime launch, command templates, backend selection, fixtures, acceptance policy, repo-specific flags, portable schema.

## Maintainer Promise

Cautilus owns generic workflow contracts, packet shapes, readiness semantics, behavior-surface vocabulary, and normalization helpers, while host repos own prompts, runners, credentials, model or backend selection, fixtures, and policy.

## Subclaims

- Cautilus-owned schemas and packet shapes describe the workflow without encoding host-specific runtime details.
- Adapters expose host-owned commands and runtime decisions explicitly so they remain inspectable rather than hidden inside product logic.
- The same product workflow runs unchanged across two adapters because repo-specific behavior lives in adapters and fixtures.
- Cautilus does not import host-specific prompts, runners, credentials, or policy into product code paths.

## Evidence

- [internal/runtime/adapter_test.go](../../../internal/runtime/adapter_test.go) `TestValidateAdapterData*` family covers explicit and command-instance discovery, live-run invocation, typed runner readiness, and claim-discovery configuration against the adapter contract.
- [scripts/agent-runtime/adapter-resolution.test.mjs](../../../scripts/agent-runtime/adapter-resolution.test.mjs) covers adapter resolution across host-owned name and path variants.
- [scripts/on-demand/smoke-external-consumer.test.mjs](../../../scripts/on-demand/smoke-external-consumer.test.mjs) bootstraps a temporary external consumer repo through `npm run consumer:onboard:smoke` and asserts the same product workflow runs unchanged.

## Evidence Gaps

- Negative test proving product code paths do not import host-specific prompts, runners, credentials, or policy. Owner: maintainer. Next action: add a build-time grep guard against host-specific names in the product source tree; no existing import-policy check today.
