# Consumer Readiness

This note is an evidence appendix.
It records current dogfood and live-consumer proof for `Cautilus`, but it is
not the canonical product vocabulary.
Product-facing docs should describe repo-agnostic surfaces such as `chatbot`,
`skill`, `cli`, `workflow`, and `agent runtime` first, then point here for
concrete checked-in host evidence.

This note records how `Cautilus` currently maps onto the four intended test
targets under `~/`:

- `cautilus`
- `ceal`
- `charness`
- `crill`

The goal is to keep product claims honest.
All four repos now expose an official `cautilus-adapter`, but they do not yet
exercise the same depth of evaluator surface.

## Snapshot

The checks below were recorded on 2026-04-10 UTC with the current
`cautilus` CLI on `PATH`.

## Cautilus

Current role: product repo self-consumer

Evidence:

- `cautilus doctor --repo-root /path/to/cautilus`
  returns `ready`
- checked-in root adapter:
  [.agents/cautilus-adapter.yaml](../.agents/cautilus-adapter.yaml)
- checked-in named adapter:
  [.agents/cautilus-adapters/self-dogfood.yaml](../.agents/cautilus-adapters/self-dogfood.yaml)
- explicit self-dogfood command:
  `npm run dogfood:self`
- explicit tuning command:
  `npm run dogfood:self:experiments`

What this means:

- `cautilus` now satisfies its own official adapter discovery contract.
- The repo keeps cheap deterministic proof in the root adapter and one explicit
  LLM-backed self-dogfood path in a named adapter instead of overloading CI or
  pre-push with expensive review work.
- The repo also keeps named experiment adapters for A/B and split-surface
  tuning without mutating the canonical self-dogfood contract.
- The honest product claim is now that `Cautilus` can declare and run its own
  self-consumer quality path, not only validate other repos.
- Stronger claims about the standalone binary surface or bundled skill surface
  are kept in named experiment adapters instead of being smuggled into the
  canonical latest report.

## Ceal

Current role: live consumer

Evidence:

- `cautilus doctor --repo-root /home/ubuntu/ceal`
  returns `ready`
- checked-in adapter:
  [/home/ubuntu/ceal/.agents/cautilus-adapter.yaml](/home/ubuntu/ceal/.agents/cautilus-adapter.yaml)
- checked-in named adapters:
  [/home/ubuntu/ceal/.agents/cautilus-adapters/code-quality.yaml](/home/ubuntu/ceal/.agents/cautilus-adapters/code-quality.yaml)
  and
  [/home/ubuntu/ceal/.agents/cautilus-adapters/skill-smoke.yaml](/home/ubuntu/ceal/.agents/cautilus-adapters/skill-smoke.yaml)

What this means:

- `ceal` is the first repo that already satisfies the current adapter discovery
  contract.
- It remains the primary live test target for adapter resolve/init/doctor and
  review-variant surfaces.
- It is also the primary reference for `chatbot` normalization behavior.

## charness

Current role: live consumer and primary `skill` normalization reference

Evidence:

- `cautilus doctor --repo-root /home/ubuntu/charness`
  returns `ready`
- checked-in `Cautilus` adapter:
  [/home/ubuntu/charness/.agents/cautilus-adapter.yaml](/home/ubuntu/charness/.agents/cautilus-adapter.yaml)
- existing repo-local adapter asset:
  [/home/ubuntu/charness/.agents/quality-adapter.yaml](/home/ubuntu/charness/.agents/quality-adapter.yaml)

What this means:

- `charness` now satisfies the official adapter discovery contract.
- Its current root adapter is intentionally narrow: it lifts the repo-owned
  `quality` gate into one official `Cautilus` entrypoint.
- It remains the primary reference for `skill` normalization inputs, especially
  public skill, profile, and validation drift patterns.

## crill

Current role: live consumer and primary durable-workflow normalization
reference

Evidence:

- `cautilus doctor --repo-root /home/ubuntu/crill`
  returns `ready`
- `cautilus mode evaluate --repo-root /home/ubuntu/crill --mode full_gate --intent 'Crill root validation entrypoint should run cleanly as the official Cautilus consumer gate.' --baseline-ref origin/main --output-dir /tmp/cautilus-crill-full-gate`
  returns a report with recommendation `accept-now`
- `cautilus cli evaluate --input /home/ubuntu/crill/tests/fixtures/cautilus/cli-help.json`
  returns `accept-now`
- `WORKBENCH_REVIEW_TIMEOUT_SECONDS=180 cautilus review variants --repo-root /home/ubuntu/crill --adapter-name operator-recovery --workspace /home/ubuntu/crill --report-file /tmp/cautilus-crill-operator-recovery-review/report.json --output-dir /tmp/cautilus-crill-operator-review`
  returns a summary with one passing `codex-review` variant
- `cautilus workspace prepare-compare --repo-root /home/ubuntu/crill --baseline-ref origin/main --output-dir /tmp/cautilus-crill-compare --force`
  followed by
  `cautilus mode evaluate --repo-root /home/ubuntu/crill --adapter-name consumer-artifacts --mode comparison --intent 'Crill should keep widening its checked-in Cautilus consumer surfaces honestly.' --baseline-ref origin/main --baseline-repo /tmp/cautilus-crill-compare/baseline --candidate-repo /tmp/cautilus-crill-compare/candidate --output-dir /tmp/cautilus-crill-consumer-compare`
  returns a report whose compare artifact verdict is `improved`
- checked-in `Cautilus` adapter:
  [/home/ubuntu/crill/.agents/cautilus-adapter.yaml](/home/ubuntu/crill/.agents/cautilus-adapter.yaml)
- checked-in named `Cautilus` adapters:
  [/home/ubuntu/crill/.agents/cautilus-adapters/cli-smoke.yaml](/home/ubuntu/crill/.agents/cautilus-adapters/cli-smoke.yaml)
  and
  [/home/ubuntu/crill/.agents/cautilus-adapters/operator-recovery.yaml](/home/ubuntu/crill/.agents/cautilus-adapters/operator-recovery.yaml)
  and
  [/home/ubuntu/crill/.agents/cautilus-adapters/consumer-artifacts.yaml](/home/ubuntu/crill/.agents/cautilus-adapters/consumer-artifacts.yaml)
- checked-in explicit `cli evaluate` packet:
  [/home/ubuntu/crill/tests/fixtures/cautilus/cli-help.json](/home/ubuntu/crill/tests/fixtures/cautilus/cli-help.json)

What this means:

- `crill` now satisfies the official adapter discovery contract.
- Its current root adapter now proves repo-wide validation and workflow review
  as one passing official `Cautilus` entrypoint, not only a `doctor`-ready
  config.
- It also now exposes narrower named `Cautilus` consumers for the CLI surface
  and operator-recovery/runtime seam.
- It now also has one checked-in explicit CLI intent packet plus one passing
  report-driven `review variants` path plus one passing explicit comparison
  path, so the honest product claim is no longer limited to `mode evaluate`
  depth.
- It remains the strongest reference for blocked durable workflow artifacts,
  replay seed regressions, and operator-recovery patterns.

## Product Positioning

Right now the honest product stance is:

- `cautilus` is the product repo self-consumer and explicit self-dogfood target
- `ceal` is the deepest live consumer and the primary `chatbot` reference
- `charness` is a live consumer and the primary skill-validation reference
- `crill` is a live consumer and the primary durable-workflow reference

This split is acceptable.
It keeps one official adapter contract while still grounding the normalization
layer in multiple real repos with different product shapes.

## Near-Term Implications

1. Keep proving the deepest binary/skill behavior against `ceal`.
2. Keep checked-in consumer-shaped normalized packet examples for
   `ceal`, `charness`, and `crill`.
3. `crill` now covers root and named adapters, explicit CLI packets, review
   variants, and checked-in compare/A-B consumer artifacts; the next depth is
   product-owned helper guidance for evidence mining and bounded optimization.
4. `Cautilus` now has a first product-owned bounded optimizer seam in-tree, but
   it still needs consumer-level proof in `crill` or `ceal` before it should be
   treated as a validated live-consumer claim.
