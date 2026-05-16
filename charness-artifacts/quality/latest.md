# Quality Review
Date: 2026-05-16

## Scope

Repo-wide quality and setup posture after the cache-token telemetry closeout.
The main risk was that setup and quality detectors could misread a mature repo as missing operating surfaces or hide public-spec proof layering debt behind passing gates.

## Current Gates

- `npm run verify`
- `npm run hooks:check`
- `npm run lint:skill-disclosure`
- `npm run lint:specs -- docs/specs/user/claim-discovery.spec.md`
- `./bin/cautilus doctor adapter --repo-root .`
- `./bin/cautilus doctor commands --json`
- `./bin/cautilus discover scenarios --json`
- `python3 .../skills/setup/scripts/inspect_repo.py --repo-root .`

## Runtime Signals

- runtime source: `charness-artifacts/quality/runtime-latest.json` from `npm run verify -- --runtime-signal charness-artifacts/quality/runtime-latest.json`.
- runtime hot spots: `test:coverage` 10442ms, `test:node` 8749ms, `lint:specs` 6839ms, `security:secrets` 4256ms, `claims:audit-evidence` 3935ms.
- coverage gate: `npm run verify` remains the standing coverage and coverage-floor stop gate.
- evaluator depth: no LLM evaluator was run; this slice used deterministic setup, inventory, spec, hook, and CLI probes.

## Healthy

- Setup inspection now resolves the mature operating surface through `.agents/setup-adapter.yaml` and reports `missing_surfaces=[]`.
- CLI ergonomics inventory reports the command registry as clean with 59 grouped commands across seven namespaces.
- Lint-ignore inventory reports zero inline, file-level, blanket, or tool-level suppressions.
- Dual-implementation inventory reports `candidate_count=0`.
- Cautilus Agent source and packaged skill disclosure stay synchronized under `npm run lint:skill-disclosure`.
- `scripts/run-verify.mjs` can now emit a structured `cautilus.quality_runtime_signal.v1` timing packet for future quality reviews.

## Weak

- Public-spec quality inventory now reports 0 duplicated command examples after the archive/index proof cleanup.
- README entrypoint inventory now reports 140 non-empty lines and no `long_entrypoint` heuristic after moving detailed scenario and core-flow prose behind guide/spec links.
- Cautilus Agent core remains close to the disclosure ceiling at 179 non-empty lines.
- Standing-gate verbosity inventory still classifies `.githooks/pre-push` phase-level signal as weak, although the hook now prints phase start and elapsed-pass lines.

## Missing

- None active for this slice.

## Deferred

- Do not create default `docs/roadmap.md` or `docs/operator-acceptance.md`; this repo already owns those surfaces as `docs/master-plan.md` and `docs/maintainers/operator-acceptance.md`.
- Do not shrink the Cautilus Agent core only to satisfy the line-pressure smell while the skill ergonomics gate is otherwise clean.
- Do not fold local pytest temp-directory cleanup into this repo slice; the inventory signal is outside the checked-in repo state.

## Advisory

- inventory: `inventory_public_spec_quality.py` now reports `delegated_runner_specs=[]` and `duplicate_command_examples=[]`.
- runtime: `runtime-latest.json` reports 17 verify phases, `status=passed`, and a total duration of 42808ms.
- inventory: `inventory_entrypoint_docs_ergonomics.py` reports `README.md` with `heuristics=[]`.
- inventory: `inventory_skill_ergonomics.py` reports `long_core` for both source and packaged Cautilus Agent copies.
- inventory: `inventory_standing_test_economics.py` reports a multi-GB local pytest temp footprint outside repo state.
- inventory: `inventory_cli_ergonomics.py`, `inventory_lint_ignores.py`, and `inventory_dual_implementation.py` found no active implementation cleanup.

## Delegated Review

executed: setup reviewer confirmed the adapter and AGENTS routing changes, quality reviewer flagged public-spec proof layering and hook signal, and counterweight kept README, skill-core, and local pytest temp footprint out of this slice.
The standing test economics lens covered `fixture-economics`, `parallel-critical-path`, and `duplicated-proof`.

## Commands Run

- `python3 /home/hwidong/.codex/plugins/cache/local/charness/0.5.26/skills/quality/scripts/resolve_adapter.py --repo-root .`
- `python3 /home/hwidong/.codex/plugins/cache/local/charness/0.5.26/skills/quality/scripts/bootstrap_adapter.py --repo-root .`
- `python3 /home/hwidong/.codex/plugins/cache/local/charness/0.5.26/skills/quality/scripts/resolve_quality_artifact.py --repo-root . --intent current`
- `python3 /home/hwidong/.codex/plugins/cache/local/charness/0.5.26/skills/setup/scripts/inspect_repo.py --repo-root .`
- `python3 /home/hwidong/.codex/plugins/cache/local/charness/0.5.26/skills/setup/scripts/render_skill_routing.py --repo-root . --json`
- `python3 /home/hwidong/.codex/plugins/cache/local/charness/0.5.26/skills/quality/scripts/inventory_skill_ergonomics.py --repo-root . --skill-path skills/cautilus-agent/SKILL.md --json`
- `python3 /home/hwidong/.codex/plugins/cache/local/charness/0.5.26/skills/quality/scripts/inventory_skill_ergonomics.py --repo-root . --skill-path plugins/cautilus/skills/cautilus-agent/SKILL.md --json`
- `python3 /home/hwidong/.codex/plugins/cache/local/charness/0.5.26/skills/quality/scripts/inventory_cli_ergonomics.py --repo-root . --json`
- `python3 /home/hwidong/.codex/plugins/cache/local/charness/0.5.26/skills/quality/scripts/inventory_entrypoint_docs_ergonomics.py --repo-root . --json`
- `python3 /home/hwidong/.codex/plugins/cache/local/charness/0.5.26/skills/quality/scripts/inventory_standing_test_economics.py --repo-root . --json`
- `python3 /home/hwidong/.codex/plugins/cache/local/charness/0.5.26/skills/quality/scripts/inventory_standing_gate_verbosity.py --repo-root . --json`
- `python3 /home/hwidong/.codex/plugins/cache/local/charness/0.5.26/skills/quality/scripts/inventory_dual_implementation.py --repo-root .`
- `python3 /home/hwidong/.codex/plugins/cache/local/charness/0.5.26/skills/quality/scripts/inventory_lint_ignores.py --repo-root . --json`
- `python3 /home/hwidong/.codex/plugins/cache/local/charness/0.5.26/skills/quality/scripts/inventory_public_spec_quality.py --repo-root . --json`
- `python3 /home/hwidong/.codex/plugins/cache/local/charness/0.5.26/skills/quality/scripts/suggest_public_skill_dogfood.py --repo-root . --skill-id cautilus-agent`
- `./bin/cautilus doctor adapter --repo-root .`
- `npm run lint:skill-disclosure`
- `./bin/cautilus doctor commands --json`
- `./bin/cautilus discover scenarios --json`
- `npm run lint:specs -- docs/specs/user/claim-discovery.spec.md`
- `node --test scripts/check-git-hooks.test.mjs`
- `npm run verify`
- `npm run verify -- --runtime-signal charness-artifacts/quality/runtime-latest.json`
- `npm run hooks:check`

## Recommended Next Gates

- passive `AUTO_CANDIDATE`: extract Cautilus Agent core detail into references before adding more user-facing skill prose because the core is already near the disclosure ceiling.
- passive `NON_AUTOMATABLE`: revisit local pytest temp footprint only if it causes flaky cleanup, leaked state, or operator confusion outside this repo because the current signal is local machine state, not checked-in repo behavior.

## History

- [2026-04-22 quality review](history/2026-04-22.md)
