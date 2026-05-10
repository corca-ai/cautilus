# Quality Review
Date: 2026-05-10

## Scope

Cautilus Agent skill and repo-local adapter improvements from the issue #33 claim-readiness dogfood session.
The quality question is whether the learning is now in the agent-first product surface instead of remaining only in chat or maintainer memory.

## Current Gates

- `npm run lint:skill-disclosure`
- `./bin/cautilus adapter resolve --repo-root .`
- `python3 /home/hwidong/.codex/plugins/charness/skills/quality/scripts/inventory_skill_ergonomics.py --repo-root . --skill-path skills/cautilus-agent/SKILL.md --json`
- `python3 /home/hwidong/.codex/plugins/charness/skills/quality/scripts/inventory_skill_ergonomics.py --repo-root . --skill-path plugins/cautilus/skills/cautilus-agent/SKILL.md --json`
- `python3 /home/hwidong/.codex/plugins/charness/skills/quality/scripts/suggest_public_skill_dogfood.py --repo-root . --skill-id cautilus-agent`
- `python3 /home/hwidong/.codex/plugins/charness/skills/debug/scripts/scaffold_debug_artifact.py --repo-root . --json`

## Runtime Signals

- runtime source: missing structured timing capture for this docs/skill slice; command results came from direct gate output, not runtime metrics JSON.
- runtime hot spots: unavailable because no structured timing source was collected for this slice.
- coverage gate: not applicable for prose and adapter metadata changes; `npm run verify` remains the final stop gate.
- evaluator depth: no evaluator run was used; this was a product-surface guidance change plus adapter-path update.

## Healthy

- The portable skill now says to keep proof class and readiness separate before creating fixtures.
- The portable skill now routes `needs-scenario` and `needs-alignment` through normalized review-result packets and `claim review apply-result`, matching the dogfood path.
- The portable skill now warns that only concrete command, packet, runner, schema, or skill-behavior claims should be promoted to proof-ready without further split or alignment.
- The Cautilus adapter now names repo-local claim-status, evidence-state, and readiness terms and artifact paths so product-specific review context is discoverable without bloating the portable skill.

## Weak

- Skill ergonomics inventory reports `long_core` for `skills/cautilus-agent/SKILL.md`; the source and packaged copies are still close to the 180-line disclosure ceiling.
- Consumer-side dogfood scaffolding for `cautilus-agent` is not automated by the current Charness public-skill helper because it only discovers `skills/public/*/SKILL.md`.

## Missing

- No repo-owned helper currently maps `product_surfaces: cautilus_agent` to a consumer dogfood prompt/artifact the way `suggest_public_skill_dogfood.py` does for `skills/public`.
- No structured runtime sample was recorded for this docs/skill quality slice.

## Deferred

- Do not move Cautilus Agent under `skills/public/` just to satisfy the Charness public-skill helper; that would blur the Cautilus product boundary.
- Do not encode Cautilus-specific artifact paths into the portable skill body when the adapter can carry them.

## Advisory

- command: `inventory_skill_ergonomics.py` returned `status: clean` with `heuristics: ["long_core"]`, so this is a disclosure-pressure warning rather than a failing gate.
- artifact: `charness-artifacts/debug/latest.md` records the public-skill dogfood helper registry mismatch and keeps the follow-up attached to quality instead of treating the helper failure as invisible.

## Delegated Review

blocked. Host signal: the current tool contract limits new subagent spawning to tasks that ask for delegation; this focused patch used same-session quality and debug gates instead.

## Commands Run

- `npm run skills:sync-packaged`
- `npm run claims:evidence-state`
- `npm run claims:evidence-state:check`
- `npm run claims:status-report`
- `npm run claims:status-report:check`
- `npm run lint:skill-disclosure`
- `./bin/cautilus adapter resolve --repo-root .`
- `python3 /home/hwidong/.codex/plugins/charness/skills/quality/scripts/resolve_adapter.py --repo-root .`
- `python3 /home/hwidong/.codex/plugins/charness/skills/quality/scripts/bootstrap_adapter.py --repo-root .`
- `python3 /home/hwidong/.codex/plugins/charness/skills/quality/scripts/resolve_quality_artifact.py --repo-root . --intent current`
- `python3 /home/hwidong/.codex/plugins/charness/skills/quality/scripts/inventory_skill_ergonomics.py --repo-root . --skill-path skills/cautilus-agent/SKILL.md --json`
- `python3 /home/hwidong/.codex/plugins/charness/skills/quality/scripts/suggest_public_skill_dogfood.py --repo-root . --skill-id cautilus-agent`
- `python3 /home/hwidong/.codex/plugins/charness/skills/debug/scripts/resolve_adapter.py --repo-root .`
- `python3 /home/hwidong/.codex/plugins/charness/skills/debug/scripts/scaffold_debug_artifact.py --repo-root . --json`
- `python3 /home/hwidong/.codex/plugins/charness/scripts/validate_debug_artifact.py --repo-root .`
- `python3 /home/hwidong/.codex/plugins/charness/scripts/validate_quality_artifact.py --repo-root .`
- `npm run verify`
- `npm run hooks:check`

## Recommended Next Gates

- active `AUTO_CANDIDATE`: add a Cautilus Agent dogfood suggestion helper or adapter mapping for `product_surfaces: cautilus_agent`.
- passive `AUTO_CANDIDATE`: move detailed claim-readiness triage examples into a reference when the portable Cautilus Agent skill grows again because the core is already near the disclosure limit.

## History

- [2026-04-22 quality review](history/2026-04-22.md)
