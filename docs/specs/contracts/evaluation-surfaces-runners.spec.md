---
type: contract
---

# Evaluation Surfaces And Runners

Evaluation uses explicit surfaces, presets, fixtures, and runners.

Map keys: `promise.evaluation`, `rule.packet-freshness`, `rule.cost-and-proof-freshness`, `rule.host-owned-execution`.
Evidence path: deterministic plus fixture-backed eval.
Evidence status: open gap.
Next action: keep normalizer, fixture, and public spec proof aligned with `dev/repo`, `dev/skill`, `app/chat`, and `app/prompt`.
Terms covered here: dev surface, app surface, repo preset, skill preset, chat preset, prompt preset, fixture composition, runner readiness, evaluate fixture, evaluate observation, scenario normalization.

## Maintainer Promise

The top-level evaluation surfaces are `dev` and `app`, the shipped presets are `repo`, `skill`, `chat`, and `prompt`, and fixtures declare their surface and preset so the reader can tell what kind of behavior is under test.

## Subclaims

- `evaluate fixture` and `evaluate observation` keep a uniform CLI shape across all four shipped presets.
- Each shipped preset is fixture-backed so a reviewer can reopen the input, observed output, and summary packets.
- Fixtures declare their surface and preset; mismatched declarations fail rather than silently routing to a different preset.
- Scenario normalizers and proposal-input pipelines stay aligned with the shipped surface vocabulary.

## Evidence

- User-facing evaluation surface smoke is enforced by [docs/specs/user/evaluation.spec.md](../user/evaluation.spec.md) (specdown directives over `evaluate fixture --help`).
- Per-preset fixture-backed summary packet evidence is preserved in [charness-artifacts/spec/evaluation-surfaces-runners-proof.md](../../../charness-artifacts/spec/evaluation-surfaces-runners-proof.md), which records selected fields and source hashes from the ignored self-dogfood output paths without making those generated paths direct spec links.
- [internal/runtime/evaluation_input_test.go](../../../internal/runtime/evaluation_input_test.go) `TestNormalizeEvaluationInputRejectsCrossAxisCombo`, `RejectsUnsupportedSurface`, and `RejectsUnsupportedPreset` enforce that mismatched surface/preset declarations fail rather than silently routing.
- `npm run lint:scenario-normalizers` proves runtime completeness of the surviving `discover scenarios normalize` helpers via [scripts/check-scenario-normalization-completeness.mjs](../../../scripts/check-scenario-normalization-completeness.mjs).
