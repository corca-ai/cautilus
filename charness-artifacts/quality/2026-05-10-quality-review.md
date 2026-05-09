# Quality Review

Date: 2026-05-10

## Scope

Review-learning summary CLI slice plus Cautilus Agent progressive-disclosure surface.
The main ownership risk is overclaiming selected-packet aggregation as active-run learning.

## Concept Risks

- `cautilus review feedback summarize` is intentionally a selected-input CLI surface.
  It does not discover active-run packet sets, choose default packet locations, or rank methods automatically.
- The Cautilus Agent mentions the new command only as a follow-on for explicitly selected packets.
  This keeps routing and guardrails in the agent while broad command discovery and schema output remain in the binary.
- The remaining gap is now narrower: active-run or report-level packet discovery and default placement.

## Current Gates

- `go test ./internal/app ./internal/cli ./internal/contracts`
- `npm run lint:skill-disclosure`
- `npm run lint:links`
- `npm run lint:specs`
- `./bin/cautilus commands --json`
- `./bin/cautilus doctor --repo-root . --scope agent-surface`

## Runtime Signals

- `review feedback summarize` appears in `./bin/cautilus commands --json`.
- `./bin/cautilus review feedback summarize --input charness-artifacts/hitl/issue-33-review-feedback.json` emits `cautilus.review_feedback_summary.v1` with `aggregation.basis=selected_review_feedback_packets`.
- `doctor --scope agent-surface` reports the local Cautilus Agent surface is ready.
- Skill ergonomics inventory reports `long_core` for both source and packaged Cautilus Agent skill copies.
  The standing disclosure gate still passes at the configured 180 non-empty-line limit.

## Standing Test Economics

The focused Go and doc gates are fast enough for this slice.
The full `npm run verify` remains the stop gate before commit or push.

## Coverage and Eval Depth

- Deterministic coverage exists for successful selected-packet aggregation and non-feedback packet rejection.
- No evaluator-backed proof was run because this slice is a deterministic CLI/report boundary, not prompt behavior.

## Maintainer-Local Enforcement

- `healthy`: command registry exposes the new CLI surface.
- `healthy`: source and packaged Cautilus Agent skill copies stay synchronized by the skill-disclosure gate.
- `weak`: Cautilus Agent core remains exactly at the 180-line disclosure ceiling.

## Enforcement Triage

- `AUTO_EXISTING`: `go test ./internal/app ./internal/cli ./internal/contracts` covers command behavior and registry shape.
- `AUTO_EXISTING`: `npm run lint:skill-disclosure` catches progressive-disclosure line-budget drift.
- `AUTO_EXISTING`: `npm run lint:specs` and `npm run lint:links` catch spec and doc wiring drift.
- `NON_AUTOMATABLE`: deciding active-run packet discovery semantics remains product design work.

## Healthy

- The binary owns broad command discovery and summary packet emission.
- The Cautilus Agent owns when to call the summary command and explicitly avoids inventing active-run discovery.
- Specs now distinguish current selected-packet aggregation from the still-open active-run aggregation gap.

## Weak

- The Cautilus Agent skill is still at its line ceiling.
  Future command guidance should move detail into references or remove older prose instead of adding another line.

## Missing

- No active-run or report surface discovers review-feedback packet sets yet.
- No durable checked-in summary artifact is selected as standing evidence beyond deterministic CLI tests and the issue #33 sample packet.

## Deferred

- Do not claim automatic operator-learning aggregation from active runs yet.
- Do not make learned method ids public product vocabulary in this slice.

## Delegated Review

blocked: this turn did not include explicit subagent authorization for the new implementation slice, and the host instruction only allows spawning subagents when explicitly requested.

## Commands Run

- `python3 /home/hwidong/.codex/plugins/cache/local/charness/0.5.19/skills/quality/scripts/resolve_adapter.py --repo-root .`
- `python3 /home/hwidong/.codex/plugins/cache/local/charness/0.5.19/skills/quality/scripts/bootstrap_adapter.py --repo-root .`
- `python3 /home/hwidong/.codex/plugins/cache/local/charness/0.5.19/skills/quality/scripts/resolve_quality_artifact.py --repo-root . --intent current`
- `python3 /home/hwidong/.codex/plugins/cache/local/charness/0.5.19/skills/quality/scripts/inventory_skill_ergonomics.py --repo-root . --skill-path skills/cautilus-agent/SKILL.md --json`
- `python3 /home/hwidong/.codex/plugins/cache/local/charness/0.5.19/skills/quality/scripts/inventory_skill_ergonomics.py --repo-root . --skill-path plugins/cautilus/skills/cautilus-agent/SKILL.md --json`
- `./bin/cautilus commands --json`
- `./bin/cautilus doctor --repo-root . --scope agent-surface`
- `./bin/cautilus review feedback summarize --input charness-artifacts/hitl/issue-33-review-feedback.json`

## Recommended Next Gates

- `active` / `AUTO_CANDIDATE`: add active-run packet discovery only after the default review-feedback packet location is decided.
- `passive`: move some Cautilus Agent detail into references before adding the next agent-facing command boundary.
