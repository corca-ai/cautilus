# Scenario History And Proposal Normalization

Scenario history and proposal normalization keep protected checks reusable across tuning loops.

Map keys: `promise.evaluation`, `promise.optimization`, `concern.cost-and-proof-freshness`, `concern.agent-human-resumability`.
Evidence path: deterministic plus held-out eval.
Evidence status: open gap.
Next action: connect scenario proposal sources, scenario history cadence, normalizer coverage, and held-out selection to eval and optimize packets.
Terms covered here: scenario proposal, scenario history, protected check, held-out, iterate cadence, train cadence, normalizer, proposal packet, context recovery, skill failure episode.

## Maintainer Promise

Cautilus preserves useful scenarios as durable candidates that can be reused for eval, held-out validation, and optimization loops, and normalizers produce inspectable proposal packets rather than hidden one-off shapers.

## Subclaims

- Scenario proposals are stored as durable candidates that another agent or operator can reopen.
- Held-out selection and protected-check rules stay explicit so iterate-vs-train cadence does not silently drift.
- Normalizers produce inspectable proposal packets rather than hidden one-off shape transformations.
- Scenario history cadence is observable so reuse across tuning loops is auditable.

## Evidence

- [internal/runtime/scenario_history_test.go](../../../internal/runtime/scenario_history_test.go) `TestSelectProfileScenarioIDsReturnsAllTrainScenariosWithoutHistory`, `TestUpdateScenarioHistoryGraduatesPerfectTrainScenarios`, and `TestScenarioBaselineCacheKeyStableAcrossIDOrder` together prove deterministic held-out selection and observable history cadence.
- [internal/runtime/proposals_test.go](../../../internal/runtime/proposals_test.go) `TestNormalizeChatbotProposalCandidatesRespectsWordBoundary` family plus [scripts/agent-runtime/scenario-proposal-schemas.test.mjs](../../../scripts/agent-runtime/scenario-proposal-schemas.test.mjs) prove reproducible inspectable normalizer output across chatbot, skill, and workflow shapes.
- `npm run lint:scenario-normalizers` enforces runtime completeness of the surviving normalization helpers via [scripts/check-scenario-normalization-completeness.mjs](../../../scripts/check-scenario-normalization-completeness.mjs).

## Evidence Gaps

- Held-out eval result packet attached to a scenario-history cycle so the reuse contract has a reopenable end-to-end proof. Owner: maintainer. Next action: capture a self-dogfood scenario-history cycle with held-out validation under `artifacts/self-dogfood/` and link the summary; no checked-in artifact today.
