# Evaluation Surfaces And Runners

Evaluation uses explicit surfaces, presets, fixtures, and runners.

Aligned user claims: U2, U5.
Proof route: deterministic plus fixture-backed eval.
Current evidence status: partial.
Next action: keep normalizer, fixture, and public spec proof aligned with `dev/repo`, `dev/skill`, `app/chat`, and `app/prompt`.
Absorbs: dev surface, app surface, repo preset, skill preset, chat preset, prompt preset, fixture composition, runner readiness, eval test, eval evaluate, scenario normalization.

## Maintainer Promise

The top-level evaluation surfaces are `dev` and `app`, the shipped presets are `repo`, `skill`, `chat`, and `prompt`, and fixtures declare their surface and preset so the reader can tell what kind of behavior is under test.

## Subclaims

- `eval test` and `eval evaluate` keep a uniform CLI shape across all four shipped presets.
- Each shipped preset is fixture-backed so a reviewer can reopen the input, observed output, and summary packets.
- Fixtures declare their surface and preset; mismatched declarations fail rather than silently routing to a different preset.
- Scenario normalizers and proposal-input pipelines stay aligned with the shipped surface vocabulary.

## Evidence

- User-facing evaluation surface smoke is enforced by [docs/specs/user/evaluation.spec.md](../user/evaluation.spec.md) (specdown directives over `eval test --help`).
- `npm run lint:scenario-normalizers` proves runtime completeness of the surviving `scenario normalize` helpers via [scripts/check-scenario-normalization-completeness.mjs](../../../scripts/check-scenario-normalization-completeness.mjs).

## Evidence Gaps

- Per-preset fixture-backed eval result packet linked from this page so the four presets each have an observable end-to-end packet beyond help-text smoke. Owner: maintainer. Next action: link the four `npm run dogfood:app-{prompt,chat}:{codex,claude}` and `dogfood:self:eval` summary packets to the matching subclaim.
- Test proving fixtures with mismatched surface/preset declarations fail rather than silently routing to a different preset. Owner: maintainer. Next action: add a focused unit test against the fixture loader.
