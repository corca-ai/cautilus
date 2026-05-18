# Quality Review
Date: 2026-05-18

## Scope

Repo-wide setup and quality refresh against Charness 0.7.0.
The slice checked whether the latest setup and quality inventories changed Cautilus's operating contract, then fixed the deterministic regression exposed by the run.

## Current Gates

- `npm run verify -- --runtime-signal charness-artifacts/quality/runtime-latest.json`
- `npm run hooks:check`
- `npm run dogfood:self`
- `npm run claims:refresh:all`
- `npm run lint:specs`
- `node --test --test-reporter=dot --test-reporter-destination=stdout scripts/agent-runtime/render-claim-evidence-state.test.mjs`
- `npm run critique:surface-packet:check`
- `./bin/cautilus doctor adapter --repo-root .`
- `./bin/cautilus doctor commands --json`
- `./bin/cautilus discover scenarios --json`

## Runtime Signals

- runtime source: `charness-artifacts/quality/runtime-latest.json` from `npm run verify -- --runtime-signal charness-artifacts/quality/runtime-latest.json`.
- runtime status: passed.
- runtime phases: 18.
- runtime total: 51341ms.
- runtime hot spots: `test:coverage` 10405ms, `test:node` 8584ms, `lint:specs` 7182ms, `claims:audit-evidence` 7106ms, `security:govulncheck` 6909ms.
- dogfood: `npm run dogfood:self` passed with `recommendation=accept-now`.

## Healthy

- Setup inspection resolves `.agents/setup-adapter.yaml`, reports `repo_mode=NORMALIZE`, `missing_surfaces=[]`, and `recommended_action=leave_as_is`.
- Skill routing remains intentionally custom, but all expected setup snippets are present and the repo-specific acknowledgement is recorded in the setup adapter.
- README entrypoint inventory now reports 138 non-empty lines and no `long_entrypoint` heuristic.
- Cautilus Agent source and packaged skill disclosure remain synchronized under `npm run lint:skill-disclosure`.
- The self-dogfood evaluation confirms checked-in AGENTS routing selects `find-skills` as the bootstrap helper and `charness:impl` for the sampled implementation task.
- Full verify and hook checks passed after the generated Evidence State table fix.

## Fixed

- `scripts/agent-runtime/render-claim-evidence-state.mjs` now renders empty sample sections as prose instead of header-only tables.
- `scripts/agent-runtime/render-claim-evidence-state.test.mjs` now covers the zero-row scenario sample case.
- `docs/specs/user/claim-discovery.spec.md` now separates stable bucket vocabulary from the regenerated current status packet.
- Claim artifacts were refreshed through `npm run claims:refresh:all`.
- The debug record for this failure is stored in `charness-artifacts/debug/debug-2026-05-18-evidence-state-empty-sample-table.md`.

## Weak

- CI/local gate parity inventory still reports release artifact build, attestation, and publish steps as CI-only surfaces after `npm run verify`.
- `spec-report.yml` still has a Pages build job without a canonical local gate.
- Cautilus Agent core remains near the disclosure ceiling at 179 non-empty lines.
- Public spec quality inventory still reports source-guard pressure and 13 smoke-test paths that need case-by-case proof-layering review.
- The quality runtime summary helper reports missing phase budgets even though structured runtime samples are now available.

## Missing

- None active for this slice.

## Deferred

- Do not create duplicate setup surfaces such as `docs/roadmap.md` or root-level `docs/operator-acceptance.md`; this repo already owns those contracts as `docs/master-plan.md` and `docs/maintainers/operator-acceptance.md`.
- Do not shrink the Cautilus Agent core only to satisfy line pressure while the disclosure gate is otherwise clean.
- Do not convert CI release publishing and Pages generation into a standing local gate in this non-release setup/quality refresh.
- Do not prune public-spec smoke tests without first identifying a specific duplicated proof already owned by a narrower layer.

## Advisory

- The untracked editor swap file `docs/specs/.index.spec.md.swp` was excluded from the work.
- `suggest_public_skill_dogfood.py --skill-id cautilus-agent` is not applicable to this repo-local public skill id because the helper expects Charness public skill ids.
- `run_dead_code_advisory.py` cannot produce useful vulture output when no git-visible Python source paths are selected.
- Local pytest temp footprint remains outside checked-in repo state.

## Delegated Review

executed: three parent-delegated reviewers consumed `charness-artifacts/critique/2026-05-18-021414-packet.md`.
The setup reviewer required fixing the failed spec lint before green closeout and warned against duplicate setup docs.
The quality reviewer classified CI/local parity as a real release-surface gap.
The counterweight reviewer agreed parity must be stated honestly but should not block this non-release refresh.
Fresh-eye satisfaction: `parent-delegated`.

## Commands Run

- `python3 /home/hwidong/.codex/plugins/cache/local/charness/0.7.0/skills/find-skills/scripts/list_capabilities.py --repo-root . --output-dir charness-artifacts/find-skills`
- `python3 /home/hwidong/.codex/plugins/cache/local/charness/0.7.0/skills/setup/scripts/inspect_repo.py --repo-root .`
- `python3 /home/hwidong/.codex/plugins/cache/local/charness/0.7.0/skills/setup/scripts/render_skill_routing.py --repo-root . --json`
- `python3 /home/hwidong/.codex/plugins/cache/local/charness/0.7.0/skills/quality/scripts/bootstrap_adapter.py --repo-root .`
- `python3 /home/hwidong/.codex/plugins/cache/local/charness/0.7.0/skills/quality/scripts/inventory_entrypoint_docs_ergonomics.py --repo-root . --json`
- `python3 /home/hwidong/.codex/plugins/cache/local/charness/0.7.0/skills/quality/scripts/inventory_skill_ergonomics.py --repo-root . --skill-path skills/cautilus-agent/SKILL.md --json`
- `python3 /home/hwidong/.codex/plugins/cache/local/charness/0.7.0/skills/quality/scripts/inventory_skill_ergonomics.py --repo-root . --skill-path plugins/cautilus/skills/cautilus-agent/SKILL.md --json`
- `python3 /home/hwidong/.codex/plugins/cache/local/charness/0.7.0/skills/quality/scripts/inventory_cli_ergonomics.py --repo-root . --json`
- `python3 /home/hwidong/.codex/plugins/cache/local/charness/0.7.0/skills/quality/scripts/inventory_public_spec_quality.py --repo-root . --json`
- `python3 /home/hwidong/.codex/plugins/cache/local/charness/0.7.0/skills/quality/scripts/inventory_ci_local_gate_parity.py --repo-root . --json`
- `python3 /home/hwidong/.codex/plugins/cache/local/charness/0.7.0/skills/quality/scripts/inventory_standing_gate_verbosity.py --repo-root . --json`
- `python3 /home/hwidong/.codex/plugins/cache/local/charness/0.7.0/skills/quality/scripts/inventory_standing_test_economics.py --repo-root . --json`
- `python3 /home/hwidong/.codex/plugins/cache/local/charness/0.7.0/skills/critique/scripts/prepare_packet.py --repo-root . --prepared-for setup-quality-refresh`
- `npm run critique:surface-packet:check`
- `./bin/cautilus doctor adapter --repo-root .`
- `./bin/cautilus doctor commands --json`
- `./bin/cautilus discover scenarios --json`
- `node --test --test-reporter=dot --test-reporter-destination=stdout scripts/agent-runtime/render-claim-evidence-state.test.mjs`
- `npm run claims:refresh:all`
- `npm run lint:specs`
- `python3 /home/hwidong/.codex/plugins/cache/local/charness/0.7.0/scripts/validate_debug_artifact.py --repo-root .`
- `npm run verify -- --runtime-signal charness-artifacts/quality/runtime-latest.json`
- `npm run hooks:check`
- `npm run dogfood:self`

## Recommended Next Gates

- Release-surface parity: either add explicit local operation gates for release artifact build, attestation, publish, and spec-report Pages generation, or document adapter-level waivers for those CI-only surfaces.
- Agent progressive disclosure: when the Cautilus Agent surface is next edited, extract durable detail into references before adding more core prose.
- Public spec proof layering: review the 13 smoke-test paths case by case and keep only smoke tests that prove cross-command, repo mutation, or artifact boundary behavior.
- Runtime budgets: add phase budgets now that `verify` emits structured runtime signals.

## History

- [2026-04-22 quality review](history/2026-04-22.md)
