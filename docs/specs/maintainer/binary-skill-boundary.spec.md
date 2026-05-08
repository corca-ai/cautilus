# Binary And Skill Boundary

The binary and Cautilus Agent own different parts of the workflow.

Aligned model anchors: `promise.claim-discovery`, `promise.readiness`, `concern.agent-human-resumability`, `concern.host-owned-execution`.
Proof route: deterministic plus dev/skill eval.
Current evidence status: covered.
Next action: keep command-discovery, skill-disclosure, and product-import-isolation checks deterministic, then prove claim-review routing through a checked dev/skill fixture.
Absorbs: command discovery, help text, packet examples, skill routing, review budget, LLM-backed claim review, subagent orchestration, progressive disclosure, install smoke.

## Maintainer Promise

The binary owns deterministic command execution, packet schemas, help text, and reusable artifacts; the Cautilus Agent owns sequencing, decision boundaries, review-budget explanation, and agent-driven claim curation, and the binary never calls an LLM provider directly for claim discovery or claim review.

## Subclaims

- The binary owns deterministic command execution, packet schemas, help text, and reusable artifacts.
- The Cautilus Agent owns sequencing, decision boundaries, review-budget explanation, and agent-driven claim curation.
- The binary does not call an LLM provider directly for claim discovery or claim review; LLM work routes through Cautilus Agent or subagent surfaces.
- Progressive disclosure between the binary and the Cautilus Agent stays within a deterministically checkable contract.

## Evidence

- `npm run lint:skill-disclosure` enforces the progressive-disclosure contract between the source and packaged Cautilus Agent via [scripts/check-cautilus-skill-disclosure.mjs](../../../scripts/check-cautilus-skill-disclosure.mjs).
- [internal/cli/registry_test.go](../../../internal/cli/registry_test.go) covers the deterministic command-discovery surface that `cautilus commands --json` advertises.
- The Cautilus Agent `dev/skill` self-dogfood fixtures (first-scan-flow, refresh-flow, review-prepare-flow, reviewer-launch-flow) under [fixtures/eval/dev/skill/](../../../fixtures/eval/dev/skill/) exercise the skill-driven branches end-to-end.
- `npm run lint:product-import-isolation` ([scripts/check-product-import-isolation.mjs](../../../scripts/check-product-import-isolation.mjs)) parses every non-test Go file under `cmd/` and `internal/`, rejects any third-party import outside an explicit allowlist (currently `gopkg.in/yaml.v3` only), and rejects forbidden LLM provider host strings in the source; this proves the binary code path never opens a direct LLM provider connection. Self-test: [scripts/check-product-import-isolation.test.mjs](../../../scripts/check-product-import-isolation.test.mjs).
