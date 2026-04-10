# Charness Consumer Boundary

This note records the current boundary between `Cautilus` and the `charness`
consumer repo so product work does not re-open consumer-owned decisions by
accident.

## Current Contract

- `charness` keeps `quality` as a strong proposal and review skill.
- `charness` keeps deterministic enforcement in repo-owned scripts, validators,
  and local quality gates.
- the root `cautilus-adapter.yaml` in `charness` remains the official default
  evaluator entrypoint, but it stays intentionally narrow
- `Cautilus` owns deeper evaluator-dependent behavior checks, intentful
  workflow review, and bounded external-review surfaces
- human-judgment-heavy checks stay explicit HITL workflows unless `Cautilus`
  productizes a bounded review surface for them

## What Stays In Charness

- repo-owned validators such as skill, profile, adapter, packaging, preset,
  and integration checks
- deterministic local gates such as markdown, secrets, duplicate, shell, and
  link checks
- public-skill policy, support-skill policy, preset vocabulary, and maintainer
  workflow wording
- the exact quality gate commands and failure thresholds that define
  `charness` local acceptance

## What Cautilus Should Own

- evaluator-dependent checks that go beyond deterministic local validation
- deeper `skill`-normalization and workflow-evaluation surfaces for
  `evaluator-required` public skills
- bounded compare, held-out, review-variant, and report-packet workflows once
  `charness` chooses to expose them through official `Cautilus` adapters
- generic product-owned helper logic that multiple consumer repos could reuse

## Guardrail

Do not widen `Cautilus` just to absorb `charness` repo hygiene scripts.
If `charness` already has a deterministic local gate, keep that enforcement in
the consumer repo and let `Cautilus` evaluate the higher-level behavior around
it when needed.

## Reopen Signals

- `charness` needs more than one default `Cautilus` operator decision and the
  root adapter becomes ambiguous
- `charness` wants evaluator-required public skills to route through named
  `Cautilus` adapters instead of one narrow root gate
- `charness` local gates stop being enough to explain behavior regressions and
  need product-owned compare or review packets to stay honest
