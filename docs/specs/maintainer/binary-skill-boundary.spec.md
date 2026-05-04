# Binary And Skill Boundary

The binary and bundled skill own different parts of the workflow.

Aligned user claims: U1, U4, U7.
Proof route: deterministic plus dev/skill eval.
Current evidence status: partial.
Next action: keep command-discovery and skill-disclosure checks deterministic, then prove claim-review routing through a checked dev/skill fixture.
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

## Evidence Gaps

- Negative test proving the binary code path never opens a direct LLM provider connection for claim discovery or claim review. Owner: maintainer. Next action: add a build-time grep guard or a runtime assertion test against the binary build; no existing import-policy check today.
