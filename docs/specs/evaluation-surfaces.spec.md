# Evaluation Surfaces

`Cautilus` exposes two top-level evaluation surfaces, distinguished by whether the thing under test needs a workspace runtime or a messaging runtime.
This spec replaces the prior split across `instruction-surface test/evaluate`, `skill test/evaluate`, `mode evaluate` chatbot mode, and the `chatbot/skill/workflow` archetype layer.

Status: redesign in progress.
The implementation contract is live; existing public commands continue to ship as deprecation aliases until the first slice lands.

## Problem

A user opening Cautilus today is asked to choose among `instruction-surface`, `skill`, `mode evaluate` chatbot, and three archetypes (`chatbot`, `skill`, `workflow`).
Those choices mix two unrelated axes:

- whether the evaluation needs a workspace (real instruction files, real plugins, real codebase) or just an LLM API call with a system prompt and messages
- whether the user pins a specific model or rides the operator's habitual coding-agent setup

Workflow as a first-class archetype is also more an artifact of past framing than a real third axis: a workflow is a multi-step chat or prompt with state.
The redesign collapses these into two surfaces (each with a small preset set) and one fixture schema that carries composition primitives instead of needing a third archetype.

## Current Slice

Define the two-surface contract, the four presets, and the four fixture composition primitives.
The first impl slice ports `instruction-surface test/evaluate` to the new shape under `surface: repo, preset: whole-repo`.
Subsequent slices port skill, chat, and prompt presets one at a time.

## Fixed Decisions

### Two surfaces

- `repo` — workspace runtime.
  The runner drives a coding-agent harness (Claude Code, Codex) with a real or fixture workspace.
  Provider stance: ride the operator's habitual setup.
  Acceptance checks live in tools the harness provides (file system, tool calls, first-routing decisions).
- `app` — messaging runtime.
  The runner sends system prompt + messages to an LLM provider and inspects the response.
  Provider stance: pin model in fixture.
  Provider can be direct API (anthropic/openai/...) **or** a coding-agent CLI in messaging mode (`claude -p` with `--system-prompt` override, `codex exec` equivalent), so a user who only has CLI tooling installed can still run app fixtures.

### Four presets

Each preset belongs to one surface and locks fixture shape so an adapter can validate offline:

| surface | preset       | fixture shape                                 | answers                                              |
| ------- | ------------ | --------------------------------------------- | ---------------------------------------------------- |
| repo    | `whole-repo` | workspace + prompt                            | does the agent obey this repo's stated contract?     |
| repo    | `skill`      | workspace (real or fixture) + skill reference | does this one skill trigger / execute / validate?    |
| app     | `chat`       | system prompt + `messages: [...]`             | does this multi-turn behavior match expectations?    |
| app     | `prompt`     | system prompt + `input` + `expected`          | does this single-turn I/O match expectations?        |

`repo / skill` covers both repo-local skills (fixture's `workspace` points at the consuming repo) and portable plugins (fixture's `workspace` points at a plugin-authored fixture workspace).
The `--workspace` knob distinguishes them; no separate preset.

**Per-surface preset axes are different on purpose:**
- `repo` preset axis = **scope** (`whole-repo` = open-ended agent behavior, `skill` = one bounded capability).
- `app` preset axis = **turn shape** (`chat` = multi-turn conversation, `prompt` = single-turn I/O).

This is acknowledged mixed-axis usage at the surface level, not within one surface.
Adding a cross-axis value (e.g., `repo / chat` or `app / skill`) is rejected by the schema validator and by `lint:eval-surfaces` (a new lint added with this spec).
A new value on either axis must pass the taxonomy-axis checkpoint and update the lint.

### Uniform CLI

- `cautilus eval test --fixture <file>` — produce observed input packet
- `cautilus eval evaluate --input <file>` — score the packet against expectations
- Preset is read from the fixture, not from the CLI. Operators learn one command shape.

### Fixture composition (all required)

- **C1 — multi-case suite**: one fixture file holds N cases under `cases: [...]`.
  Carries N evaluations through the same surface/preset and shares fields like `system` or `workspace` at the suite level.
- **C2 — inheritance**: `extends: <path>` deep-merges a base fixture before applying overrides.
  Lets users compare model variants, prompt variants, or workspace variants without copy-paste.
- **C3 — multi-step composition**: `steps: [...]` carries a sequence where each step references another fixture (`$ref`) or is inline.
  Step output is addressable in later steps via a single placeholder grammar:

  - shape: `${steps[<index>].output(.<dotted.path>)?}`
  - `<index>` is 0-based and refers to a previously executed step in the same suite.
  - `output` is the literal output node of the previous step's result packet.
  - `<dotted.path>` is an optional dotted JSON path into that node (e.g., `${steps[0].output.text}` or `${steps[1].output.evidence[0].title}`).
  - Bare `${steps[0]}` is an error; `output` is required.
  - Forward references (`${steps[N]}` where N is the current or later step) are an error.
  - String interpolation in any string-shaped fixture field; non-string substitutions stay JSON-typed only when the entire field is the placeholder.

  This replaces the dropped workflow archetype.
- **C4 — snapshot baselines**: `expected.snapshot: <path>` compares current output against a golden file.
  Snapshots are explicit artifacts — no auto-init by default.

### Result packet

Every result records `{provider, model, harness, mode (workspace|messaging), durationMs, costUsd?}` so cost / time / provider analysis works uniformly across surfaces and downstream tools (`optimize prepare-input`, `report.json`).

**Cross-runtime equivalence rules** (for `app` surface running same fixture under different harnesses):

- MUST be byte-equal across harnesses: `surface`, `preset`, `fixtureRef`, `caseId`.
- MUST be present and non-empty on every harness: `provider`, `model`, `harness`, `mode`, `durationMs`, `observed.messages`, `observed.finalText`.
- MAY differ across harnesses (and downstream consumers MUST treat as harness-tagged): token counts, `costUsd`, reasoning blocks (CLI in messaging mode often strips these), system-prompt prefix injections (CLI may add anti-jailbreak preludes), retry / rate-limit telemetry.
- A result that compares against another result MUST carry both harness tags so a consumer can decide whether the diff is real or harness-driven.

These rules are validated by acceptance check in this spec, not invented at impl time.

### Workflow archetype and prior commands

The redesign cuts cleanly with no backward compatibility (no external users yet).
Removed in this slice:

- `cautilus instruction-surface test/evaluate` — replaced by `cautilus eval test/evaluate` with `surface=repo, preset=whole-repo`.
- The `workflow` first-class archetype — multi-step composition (C3) replaces it.
- `cautilus.instruction_surface_*` schemas — replaced by `cautilus.evaluation_*` schemas.
- `instruction_surface_*` adapter fields — replaced by `eval_test_command_templates` and `evaluation_input_default`.

`scenario normalize chatbot|skill|workflow` are unchanged for now (they feed proposal-input normalization, not evaluation). They lose their archetype framing once the corresponding `cautilus eval` presets ship and proposal-input normalization is rescoped in a later slice.

Migration tracked at [corca-ai/cautilus#32](https://github.com/corca-ai/cautilus/issues/32).

## Probe Questions

Answers should land through implementation slices, not through more spec churn:

- **deep-merge semantics for `extends`**: arrays replace vs. concat, nested case-list merge rules, conflict detection.
  Start with deep-merge-replaces-arrays and tighten if real fixtures collide.
- **snapshot diff granularity**: byte-equal vs. structural-equal vs. semantic-similar.
  Default to structural-equal on parsed JSON / first-pass byte-equal on text; revisit when first preset hits real friction.
- **app surface CLI runtime parity in practice**: the cross-runtime equivalence rules in `Fixed Decisions § Result packet` define the contract. The probe is whether those rules are sufficient to keep consumer comparisons honest, or whether more fields need to be promoted to MUST-be-present.
  Track real-fixture cases that surface gaps and revisit the equivalence list, not the architectural decision.

## Deferred Decisions

- **migration plan for `scenario normalize chatbot|skill|workflow`**: those commands feed proposals, not evaluations. The redesign here is on the evaluation surface; proposal-input normalization is unchanged. The deprecation of the archetype layer lives in a separate handoff slice.
- **plugin author distinct CLI flow**: stick with `--workspace` flag for now.
  Revisit if plugin authors need richer fixture-workspace tooling (linting plugin manifest from fixture, etc.).
- **cross-surface composition**: a `repo` step that invokes an `app` fixture, or vice versa.
  Out of v1.
- **LLM-judge as a preset**: `app / judge` could land later. Not in v1.

## Non-Goals

- Replacing `optimize`, `evidence`, `report`, `review` packet flows.
  Those stay; the new evaluation packets feed them.
- Replacing `scenario propose` and the proposal pipeline.
- Adding a fifth preset before the four ship.

## Deliberately Not Doing

- **Keeping `workflow` as a first-class archetype.**
  Multi-step composition (C3) covers stateful sequences with less ceremony.
  The current archetype-boundary spec will be retired or rescoped after migration.
- **Per-preset CLI commands** like `cautilus repo whole-repo test`.
  Preset lives in the fixture; CLI stays uniform.
  Otherwise the operator surface grows with every preset added.
- **Direct API as the only app runtime.**
  Coding-agent CLI in messaging mode (Claude `-p`, Codex `exec`) MUST be a supported runtime so users without API keys can still run app fixtures.
- **A separate ideation document** for this redesign.
  The 2026-04-25 chat ideation outcome is captured here directly.

## Constraints

- All four composition features (C1–C4) MUST be expressible in the v1 fixture schema, even if impl wires them across multiple slices.
- `repo` surface MUST work with the operator's installed Claude Code or Codex without re-pinning model versions.
- `app` surface MUST work without an API key when the user has Claude or Codex CLI installed.
- Preset is deterministic from `(surface, preset)` and validated offline.
- Result packet schema MUST stay stable across surfaces so downstream consumers (`optimize prepare-input`, `report.json`) treat all four presets uniformly.
- No backward compatibility for prior public commands or schemas. Cuts are clean.

## Success Criteria

1. A user with Claude Code installed and no other config can run `cautilus eval test --fixture <whole-repo.fixture.json>` against their own repo and get a usable result with provider, model, harness, durationMs, and costUsd recorded.
2. A user with Claude CLI but no API key can run `cautilus eval test --fixture <chat.fixture.json>` and get a usable result.
3. A fixture using `extends: ./base.fixture.json` correctly inherits base fields and applies overrides.
4. A `steps: [...]` fixture executes each step in order, and step N can read step (N-1)'s output.
5. A fixture with `expected.snapshot: ./golden.json` passes when output matches and fails with a diff when it doesn't.
6. Adding a fifth preset value requires the same justification as the existing four (taxonomy axis checkpoint passes).

## Acceptance Checks

Each criterion has at least one executable check.

- **C1 multi-case**: a suite with `cases: [a, b]` evaluates both, fixture-backend driver.
- **C2 extends**: `child.fixture.json` extends `base.fixture.json`, asserts inherited and overridden fields.
- **C3 multi-step**: 2-step fixture where step 2 reads `${steps[0].output.text}` (dotted path) AND a separate fixture using bare `${steps[0].output}` (whole-output substitution); both pass, and an invalid placeholder (`${steps[0]}`, forward ref, missing index) errors with a parse-error.
- **C4 snapshot**: pass case (output matches snapshot) and mismatch case (output diff surfaces in result).
- **Per-preset proof**:
  - `repo / whole-repo`: cautilus's own AGENTS.md routing test (current self-dogfood, ported).
  - `repo / skill`: portable plugin probe in fixture workspace (port from current skill test fixtures).
  - `app / chat`: multi-turn fixture against fixture-backend (no real model).
  - `app / prompt`: single-turn fixture against fixture-backend.
- **CLI runtime parity**: `app / chat` fixture run via direct API and via `claude -p --system-prompt` produces packets where the MUST-be-byte-equal fields match, the MUST-be-present-and-non-empty fields are populated on both sides, and the MAY-differ fields are carried with a harness tag.
- **Spec lint**: `npm run lint:specs` accepts this spec; archetype lint scope follows the workflow-archetype removal.
- **Taxonomy axis**: per-surface preset enums kept narrow; mixed-axis values (e.g., adding `repo / chat`) rejected at the schema validator.

## Premortem

Bounded fresh-eye review delegated 2026-04-25 to a subagent reading this spec, `instruction-surface.spec.md`, `archetype-boundary.spec.md`, `master-plan.md`, and the taxonomy-axis-checkpoint reference.
Verdict: ready with named tightenings.
Five findings folded back into Fixed Decisions, Constraints, and Acceptance Checks above.

Anchored re-litigation notes:

1. **"`repo / skill` and `repo / whole-repo` look like duplicate tests at fixture level."**
   They differ in scope, not runtime.
   `whole-repo` asks an open-ended question against the real repo; `skill` is bounded to one capability and the workspace knob distinguishes plugin-fixture from real-repo.
   The per-surface preset axes (scope for `repo`, turn-shape for `app`) are explicit in `Fixed Decisions`.

2. **"Coding-agent CLI in messaging mode is the same as direct API."**
   It is not.
   `claude -p` may inject anti-jailbreak prefixes, may strip reasoning blocks, and may differ in token accounting from direct API.
   The cross-runtime equivalence rules in `Fixed Decisions § Result packet` make this concrete: which fields MUST be byte-equal, which MUST be present, which MAY differ with harness tag.

3. **"`extends` is just file include."**
   It is a deep-merge with array-replace semantics; child scalar wins on conflict.
   Documented in `Fixed Decisions § Fixture composition`.

4. **"`workflow` archetype removal breaks existing host repos."**
   No external host repos exist yet, so the workflow archetype and prior public commands are cut without aliases.
   Migration noted in a tracking issue rather than in code.

5. **"Taxonomy-axis checkpoint passed because the spec asserts it did."**
   The per-surface axes are spelled out and the schema validator rejects cross-axis values.
   Adding a fifth value requires both the checkpoint pass and explicit reasoning in the next spec edit.

## Canonical Artifact

`docs/specs/evaluation-surfaces.spec.md`.

This spec is the implementation contract.
Per-slice impl notes live in commits and the migration tracking issue.

## First Implementation Slice

`repo / whole-repo` preset shipped:

- `cautilus eval test`, `cautilus eval evaluate` accept `cautilus.evaluation_input.v1` fixtures.
- Schema validates `surface=repo, preset=whole-repo` only; C2/C3/C4 fields stub-error until their slices land.
- Self-dogfood fixture lives at `fixtures/eval/whole-repo/checked-in-agents-routing.fixture.json`; runner under `scripts/run-self-dogfood-eval.mjs`.
- Prior `cautilus instruction-surface test/evaluate`, `cautilus.instruction_surface_*` schemas, `instruction_surface_*` adapter fields, and the `workflow` archetype framing in this layer are removed without aliases.

Follow-up slices proceed in this order:

1. ~~`repo / skill` preset — replace `cautilus skill test/evaluate`.~~ Shipped 2026-04-25.
   `cautilus.evaluation_input.v1` now translates `surface=repo, preset=skill` cases into the existing `cautilus.skill_test_cases.v1` shape, the `cautilus eval evaluate` handler dispatches to `BuildSkillEvaluationSummary` when the observed packet uses `cautilus.skill_evaluation_inputs.v1`, and the `cautilus skill test/evaluate` commands plus their adapter slots and example fixtures were cut without aliases.
2. `app / chat` preset — replace `cautilus mode evaluate` chatbot mode.
3. `app / prompt` preset — new.
4. C2–C4 composition primitives, one per slice.
5. Retire `archetype-boundary.spec.md` and rescope `scenario normalize` proposal-input lineage.
