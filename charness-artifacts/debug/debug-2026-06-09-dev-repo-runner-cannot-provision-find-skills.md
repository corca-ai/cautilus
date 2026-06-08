# Debug: dev/repo routing eval cannot be proven live — runner does not provision find-skills

Status: RESOLVED (diagnosis) 2026-06-09 (charness:debug). Root cause confirmed; fix is a design decision held for the operator.
Surfaced while applying slice 3 of the proof-debt goal (replacing the hand-authored dev/repo fixture stand-in with the real capture).

## Problem

The dev/repo Behavior Evaluation claim ("the agent reads AGENTS.md first, then routes to `find-skills` then a work skill") cannot be reproduced by a live run of its own runner. The green deterministic proof came from replaying a recorded observation, not from a runner that can actually produce the routing today.

## Correct Behavior

Given a fixture that asserts the agent routes to `find-skills`, when the runner executes the agent live, then the agent must have `find-skills` available in its tool/skill surface — otherwise the live run cannot reproduce the asserted routing and the "proof" is not a proof of current behavior.

## Observed Facts

- Live default run `./bin/cautilus evaluate fixture --repo-root . --output-dir <tmp>` resolves to `--backend codex_exec` (runtime=codex) and drives a real codex agent (~38s). Result: `bootstrapHelper: none`, `firstToolCall: tool_search.tool_search_tool`, `workSkill: none`, `recommendation: defer`. The agent's own reason: "The required find-skills bootstrap was not available in the accessible tool surface."
- Deterministic run `--runtime fixture` replays `fixtures/eval/dev/repo/internal-runner-fixture-results.json` and passes (`accept-now`).
- The checked-in stand-in was hand-authored and diverged from a real 2026-05-04 codex capture (`artifacts/self-dogfood/dev-repo-self-dogfood/latest/.../result.json`); that real capture's `loadedInstructionFiles` referenced `/home/hwidong/.codex/plugins/cache/local/charness/0.5.16/skills/find-skills/SKILL.md` — i.e. it ran with access to the user's real `~/.codex`, where find-skills was installed.

## Reproduction

`./bin/cautilus evaluate fixture --repo-root . --output-dir $(mktemp -d)` (default backend = codex_exec) → routing fails with find-skills unavailable.

## Candidate Causes

1. The runner runs codex with an isolated CODEX_HOME that omits the skills/plugins.
2. The eval workspace excludes the repo's own `.agents/skills/`.
3. find-skills is not installed anywhere reachable by the runner.
4. AGENTS.md routing changed since 2026-05-04 (FALSIFIED earlier: find-skills-first is still current).

## Hypothesis

Isolated CODEX_HOME + workspace skill exclusion means find-skills is not present for the agent under test, so live routing to it is structurally impossible.

## Verification

- `scripts/agent-runtime/codex-eval-runtime.mjs`: `--codex-home-mode isolated` (which the dev/repo `command_template` hardcodes) creates `isolatedCodexHome()` = a fresh `mkdtemp` dir and copies **only** `auth.json` from the source home. Plugins/skills are not copied.
- `scripts/run-self-dogfood-eval.mjs`: `EXCLUDED_SOURCE_PATH_PREFIXES = [".agents/skills/", ".cautilus/runs/", ".claude/"]` — the repo's own skills are excluded from the eval workspace.

Both confirm the hypothesis.

## Root Cause

The dev/repo runner's `command_template` runs codex with `--codex-home-mode isolated`, which provisions an isolated CODEX_HOME containing only `auth.json` (no plugins/skills), and the workspace setup excludes `.agents/skills/`. So the agent under test has no `find-skills`. The fixture's `expectedRouting` requires `find-skills`, so no live run can pass. The repository's green dev/repo proof was therefore obtained by replaying a recorded observation (originally hand-authored; now swapped to the real 2026-05-04 capture, which itself ran under skill-available conditions). This is the structural origin of the maintainer's distrust: the proof never came from a runner that could reproduce the behavior.

## Invariant Proof

Producer→consumer invariant: a behavior eval that asserts "agent routes to skill X" must execute the agent in an environment where skill X is installed; otherwise the live observation cannot reproduce the assertion. The dev/repo runner violates this for `find-skills`.

## Detection Gap

`cautilus evaluate --runtime fixture` passes by replaying a recorded observation, so no gate ever exercised the live path against the assertion. The runner assessment (`.cautilus/runners/dev-repo-self-dogfood.assessment.json`) vouches for the runner but was produced under skill-available conditions and records no skill-provisioning precondition. Smallest gate that would have fired: a periodic live (or skill-provisioned) dev/repo run wired into a check, or an assessment field that records "asserted skills must be provisioned" and a doctor probe that the runner provisions them.

## Sibling Search

Wrong mental model: "the fixture result just needs to be the real capture." Real model: "the runner must be able to PRODUCE the asserted behavior live; a real-but-snapshot capture under different conditions is still not live-reproducible."
Structural siblings (four-axis): any eval that asserts routing to a skill/tool while running under an isolated home or skill-excluded workspace.
- dev/skill fixtures (cautilus-skill-routing, *-flow): do they assert routing to skills the isolated runner lacks? — follow-up: audit dev/skill runners for the same isolation gap.
- app/* surfaces: backed by fixture/LLM prompt, not skill-routing, so not affected by this specific gap.

## Seam Risk

External seam: the codex runtime + skill-plugin availability. Local reasoning ("find-skills should be there") was disproved by the runner's isolation config. The fix touches runner provisioning (the seam), so it is a design decision, not an ordinary inline edit.

## Prevention

- Decision for the operator (do not auto-apply): either (a) provision the asserted skills (`find-skills`, and whatever else the fixtures assert) into the runner's isolated CODEX_HOME / workspace so a live run can reproduce the routing, then re-capture and re-assess; or (b) honestly scope the dev/repo badge to "deterministic replay of a real capture; live reproduction requires a skill-provisioned runner," and record the provisioning gap as explicit proof debt.
- Until then: the Behavior Evaluation badge must NOT be flipped to a clean `proven`. The fixture swap (commit dd3f5e6) is an honesty improvement (real capture over fabrication) but does not establish live reproducibility.
- The runner assessment is now stale (the hashed fixture files changed) and must not be re-stamped as verified while the live path fails.
