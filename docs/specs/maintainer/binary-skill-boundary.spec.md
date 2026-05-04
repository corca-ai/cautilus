# Binary And Skill Boundary

The binary and bundled skill own different parts of the workflow.

Aligned user claims: U1, U4, U7.
Proof route: deterministic plus dev/skill eval.
Current evidence status: covered.
Next action: keep command-discovery, skill-disclosure, and product-import-isolation checks deterministic, then prove claim-review routing through a checked dev/skill fixture.
Absorbs: command discovery, help text, packet examples, skill routing, review budget, LLM-backed claim review, subagent orchestration, progressive disclosure, install smoke.

## Maintainer Promise

The binary owns deterministic command execution, packet schemas, help text, and reusable artifacts; the bundled skill owns sequencing, decision boundaries, review-budget explanation, and agent-driven claim curation, and the binary never calls an LLM provider directly for claim discovery or claim review.

## Subclaims

- The binary owns deterministic command execution, packet schemas, help text, and reusable artifacts.
- The bundled skill owns sequencing, decision boundaries, review-budget explanation, and agent-driven claim curation.
- The binary does not call an LLM provider directly for claim discovery or claim review; LLM work routes through the skill or subagent surface.
- Progressive disclosure between the binary and the bundled skill stays within a deterministically checkable contract.

## Evidence

- `npm run lint:skill-disclosure` enforces the progressive-disclosure contract between the bundled and packaged skill via [scripts/check-cautilus-skill-disclosure.mjs](../../../scripts/check-cautilus-skill-disclosure.mjs).
- [internal/cli/registry_test.go](../../../internal/cli/registry_test.go) covers the deterministic command-discovery surface that `cautilus commands --json` advertises.
- The bundled skill `dev/skill` self-dogfood fixtures (first-scan-flow, refresh-flow, review-prepare-flow, reviewer-launch-flow) under [fixtures/eval/dev/skill/](../../../fixtures/eval/dev/skill/) exercise the skill-driven branches end-to-end.
- `npm run lint:product-import-isolation` ([scripts/check-product-import-isolation.mjs](../../../scripts/check-product-import-isolation.mjs)) parses every non-test Go file under `cmd/` and `internal/`, rejects any third-party import outside an explicit allowlist (currently `gopkg.in/yaml.v3` only), and rejects forbidden LLM provider host strings in the source; this proves the binary code path never opens a direct LLM provider connection. Self-test: [scripts/check-product-import-isolation.test.mjs](../../../scripts/check-product-import-isolation.test.mjs).
