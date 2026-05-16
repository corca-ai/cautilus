# Gather: GitHub issue 44 behavior-test contract

Source: https://github.com/corca-ai/cautilus/issues/44
Access mode: GitHub CLI direct-cli (`gh issue view 44 --json number,title,state,author,body,labels,comments,url,createdAt,updatedAt`).
Freshness: fetched 2026-05-16 during the issue-44 design turn.

## Primary Issue

- Repo: `corca-ai/cautilus`
- Issue: #44, `Expose behavior-test recommendation contract for Charness quality`
- State: OPEN
- Created: 2026-05-16T08:04:10Z
- Updated: 2026-05-16T08:04:10Z
- Labels: `feature request`, `test`
- Comments: none at fetch time

## Reporter Context

Charness issue `corca-ai/charness#168` was reframed after maintainer discussion.
The desired boundary is that Charness quality detects, recommends, and records when installed repos need agent/user behavior proof, while Cautilus owns behavior-evaluation surfaces, execution model, comparison semantics, and machine-readable result shape.
Charness should not grow a parallel behavior-test runner or wrap deterministic repo gates as behavior proof.

JTBD: A maintainer running Charness quality in an installed repo wants the agent to notice behavior-risk seams, propose a Cautilus-backed behavior test when appropriate, and record missing or executed proof honestly without inventing a local runner.

## Observed Gap

The issue asks Cautilus to define a consumer contract for Charness quality:

1. When should Charness quality recommend Cautilus behavior proof instead of deterministic validation or HITL review?
2. Which minimal input shape should Charness point to: fixture, observation, skill-experiment, scenario catalog, or another contract?
3. Which result fields should Charness persist in its quality artifact, including source/log identity, baseline/variant identity, dimensions, status, evaluator limitations, and next action?
4. How should Cautilus distinguish agent behavior proof from product/UI behavior proof without requiring Charness to model the whole workflow?
5. What should Charness do in recommend-only mode when Cautilus is absent or no explicit log-backed request exists?

## Related Sources Fetched

- `corca-ai/charness#168`: Charness-side discussion was reframed so Charness owns quality routing and Cautilus owns evaluator semantics/result shape.
- `corca-ai/cautilus#34`: resolved by `cautilus eval skill-experiment compare`, which compares host-preserved baseline and variant outputs and does not execute or install skills.
- `corca-ai/cautilus#3`: closed with guidance away from deterministic gate wrapping and toward LLM-behavior surface inventory.
- `corca-ai/cautilus#30`: open dogfood story showing instruction-surface behavior proof and the difference between routing proof and deeper backend capability proof.

## Relevant Local Contract Signals

- `README.md` says the current external-adoption slice is eval-only and stable around `evaluate fixture`, `evaluate observation`, and post-run `skill-experiment compare`.
- `docs/master-plan.md` says Cautilus owns generic claim-to-proof workflow, durable packets, and intent-first behavior evaluation while consumer repos own fixtures, runners, prompts, wrappers, and policy.
- `docs/contracts/skill-clone-experiment.md` is a precedent for compare-only Cautilus ownership after host execution already produced baseline and variant outputs.
- `docs/contracts/skill-testing.md` and `docs/contracts/skill-evaluation.md` define the current `dev/skill` fixture and observation boundaries.
- `docs/contracts/behavior-intent.md` defines product-owned behavior surfaces and dimensions.
- `docs/contracts/reporting.md` defines report packets, explicit provenance, recommendation values, telemetry, limitations, and result interpretation rules.

## Design Implication

The smallest useful Cautilus-side design is likely a documented recommendation/result contract that Charness can cite and later implement against.
It should not create a new runner first.
It should map behavior-risk seams to existing Cautilus proof families, define recommend-only vs executable states, and name a small result record shape that Charness can persist without understanding host-specific execution details.
