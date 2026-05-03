# Binary And Skill Boundary

The binary and bundled skill own different parts of the workflow.

Aligned user claims: U1, U4, U7.
Proof route: deterministic plus dev/skill eval.
Current evidence status: partial.
Next action: keep command-discovery and skill-disclosure checks deterministic, then prove claim-review routing through a checked dev/skill fixture.
Absorbs: command discovery, help text, packet examples, skill routing, review budget, LLM-backed claim review, subagent orchestration, progressive disclosure, install smoke.

## Maintainer Promise

The binary owns deterministic command execution, packet schemas, help text, and reusable artifacts.
The bundled skill owns sequencing, decision boundaries, review-budget explanation, and agent-driven claim curation.
The binary should not call an LLM provider directly for claim discovery or claim review.

## Proof Notes

`npm run lint:skill-disclosure` proves the bundled and packaged skill stay within the progressive-disclosure contract.
The remaining proof gap is behavior-level: a maintained dev/skill fixture should show the skill choosing the claim-review branch without treating raw discovery as a finished answer.
