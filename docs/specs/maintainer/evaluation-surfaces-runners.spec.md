# Evaluation Surfaces And Runners

Evaluation uses explicit surfaces, presets, fixtures, and runners.

Aligned user claims: U2, U5.
Proof route: deterministic plus fixture-backed eval.
Current evidence status: partial.
Next action: keep normalizer, fixture, and public spec proof aligned with `dev/repo`, `dev/skill`, `app/chat`, and `app/prompt`.
Absorbs: dev surface, app surface, repo preset, skill preset, chat preset, prompt preset, fixture composition, runner readiness, eval test, eval evaluate, scenario normalization.

## Maintainer Promise

The top-level surfaces are `dev` and `app`.
The shipped presets are `repo`, `skill`, `chat`, and `prompt`.
Fixtures declare their surface and preset so the reader can tell what kind of behavior is under test.

## Proof Notes

The user-facing evaluation spec has command-surface smoke proof.
The stronger proof should link concrete fixtures and observed result packets for each shipped preset.
