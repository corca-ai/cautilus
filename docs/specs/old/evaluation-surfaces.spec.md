# Evaluation Surfaces

`Cautilus` exposes two top-level evaluation surfaces, distinguished by the user problem being protected: AI-assisted development work versus AI-powered product behavior.
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
The first impl slice ports `instruction-surface test/evaluate` to the new shape under `surface: dev, preset: repo`.
Subsequent slices port skill, chat, and prompt presets one at a time.

## Fixed Decisions

### Two surfaces

- `dev` — AI-assisted development work.
  Use this when the thing being protected is how an agent helps build, maintain, or operate a repo or portable development capability.
  The runner drives a coding-agent harness (Claude Code, Codex) with a real or fixture workspace.
  Provider stance: ride the operator's habitual setup.
  Acceptance checks live in tools the harness provides (file system, tool calls, first-routing decisions).
- `app` — AI-powered product behavior.
  Use this when the thing being protected is an AI-powered product, chat loop, prompt endpoint, or service response.
  The runner sends system prompt + messages to an LLM provider or an equivalent CLI messaging runtime and inspects the response.
  Provider stance: pin model in fixture.
  Provider can be direct API (anthropic/openai/...) **or** a coding-agent CLI in messaging mode (`claude -p` with `--system-prompt` override, `codex exec` equivalent), so a user who only has CLI tooling installed can still run app fixtures.

### Four presets

Each preset belongs to one surface and locks fixture shape so an adapter can validate offline:

| surface | preset   | fixture shape                                 | answers                                                   |
| ------- | -------- | --------------------------------------------- | --------------------------------------------------------- |
| dev     | `repo`   | workspace + prompt                            | does the agent obey this repo's stated work contract?     |
| dev     | `skill`  | workspace (real or fixture) + skill reference | does this one skill trigger / execute / validate?         |
| app     | `chat`   | system prompt + `messages: [...]`             | does this product conversation match expectations?        |
| app     | `prompt` | system prompt + `input` + `expected`          | does this single product response match expectations?     |

`dev / skill` covers both repo-local skills (workspace points at the consuming repo) and portable plugins (workspace points at a plugin-authored fixture workspace).
The `--workspace` CLI flag is the source of truth for workspace resolution and defaults to the operator's `cwd`; the fixture body itself does not carry a workspace path.
Skill identity also defaults from `suiteId`; the fixture may override it through the optional top-level `skillId` field.
Both surfaces are conceptually episode-based.
A one-turn fixture is the degenerate case of a multi-turn episode; `app / prompt` stays intentionally one-turn because prompt I/O is the operator-facing concept.

### Episode turns

`turns: [...]` is the shared episode model.
Each turn has one required `input` string.
Dev-surface turns may also carry runtime-adapter hints such as `injectSkill: true` when the runner must materialize a portable skill body for a coding-agent CLI that does not perform host skill expansion itself.
Those hints are adapter instructions, not product concepts; the portable fixture contract remains the ordered user inputs and the expected behavior evidence.

Single-turn fixtures may continue to use the preset's compact field (`prompt`, `messages`, or `input`) when that is clearer.
When a case provides `turns`, the runner must preserve turn order, record a transcript or runtime log artifact, and evaluate the resulting episode rather than treating each turn as an independent case.
For `dev / skill`, the first shipped multi-turn slice is audit-backed: a case can set `auditKind` to a supported product audit, and the runner derives the case outcome from the audit packet instead of asking the agent to self-report JSON at the end of the episode.

**Per-surface preset axes are different on purpose:**
- `dev` preset axis = **development-work scope** (`repo` = open-ended repo/work contract, `skill` = one bounded capability).
- `app` preset axis = **turn shape** (`chat` = multi-turn conversation, `prompt` = single-turn I/O).

This is acknowledged mixed-axis usage at the surface level, not within one surface.
Adding a cross-axis value (e.g., `dev / chat` or `app / skill`) is rejected by the evaluation-input schema normalizer and covered by unit tests.
A new value on either axis must pass the taxonomy-axis checkpoint and update the normalizer tests.

### Uniform CLI

- `cautilus eval test --fixture <file>` — produce observed input packet
- `cautilus eval evaluate --input <file>` — score the packet against expectations
- Preset is read from the fixture, not from the CLI. Operators learn one command shape.

### Fixture composition (all required)

- **C1 — multi-case suite**: one fixture file holds N cases under `cases: [...]`.
  Carries N evaluations through the same surface/preset and shares fields like `system` or `workspace` at the suite level.
- **C2 — inheritance**: `extends: <path>` deep-merges a base fixture before applying overrides.
  Shipped 2026-05-01 for file-backed `cautilus eval test` fixtures: object fields deep-merge, arrays replace, scalar child fields override, and `extends` paths must be relative to the child fixture.
  Lets users compare model variants, prompt variants, or workspace variants without copy-paste.
- **C3 — multi-step composition**: `steps: [...]` carries a sequence where each step references another fixture (`$ref`) or is inline.
  Shipped 2026-05-01 with strict explicit projection: every step must declare `outputProjection`, a mapping from output keys to dotted paths in that step's eval summary.
  Cautilus does not infer a generic output node from heterogeneous preset summaries.
  Projected step output is addressable in later steps via a single placeholder grammar:

  - shape: `${steps[<index>].output(.<dotted.path>)?}`
  - `<index>` is 0-based and refers to a previously executed step in the same suite.
  - `output` is the explicit projection object declared by the previous step's `outputProjection`.
  - `outputProjection` paths are dotted paths into that step's eval summary, such as `evaluations[0].observed.finalText`.
  - `<dotted.path>` is an optional dotted JSON path into that node (e.g., `${steps[0].output.text}` or `${steps[1].output.evidence[0].title}`).
  - Bare `${steps[0]}` is an error; `output` is required.
  - Forward references (`${steps[N]}` where N is the current or later step) are an error.
  - String interpolation in any string-shaped fixture field; non-string substitutions stay JSON-typed only when the entire field is the placeholder.

  This replaces the dropped workflow archetype.
- **C4 — snapshot baselines**: `expected.snapshot: <path>` compares current app output against a golden text file.
  Shipped 2026-05-01 for `app/chat` and `app/prompt` `finalText`: snapshot paths are resolved relative to the fixture file, must stay under the fixture file's directory, the resolved text is frozen into the test-cases packet, and mismatches surface a text-equality diff in the evaluation summary.
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

- `cautilus instruction-surface test/evaluate` — replaced by `cautilus eval test/evaluate` with `surface=dev, preset=repo`.
- The `workflow` first-class archetype — multi-step composition (C3) replaces it.
- `cautilus.instruction_surface_*` schemas — replaced by `cautilus.evaluation_*` schemas.
- `instruction_surface_*` adapter fields — replaced by `eval_test_command_templates` and `evaluation_input_default`.

`scenario normalize chatbot|skill|workflow` feed proposal-input normalization, not evaluation.
Their public catalog now presents them as scenario normalization families through `normalizationFamilies`, not evaluation archetypes.

Migration tracked at [corca-ai/cautilus#32](https://github.com/corca-ai/cautilus/issues/32).

## Probe Questions

Answers should land through implementation slices, not through more spec churn:

- **deep-merge semantics for `extends`**: arrays replace vs. concat, nested case-list merge rules, conflict detection.
  Start with deep-merge-replaces-arrays and tighten if real fixtures collide.
- **snapshot diff granularity**: byte-equal vs. structural-equal vs. semantic-similar.
  The first shipped snapshot slice is exact text equality for app `finalText`; structural JSON snapshots and semantic similarity stay deferred until real fixtures justify them.
- **app surface CLI runtime parity in practice**: the cross-runtime equivalence rules in `Fixed Decisions § Result packet` define the contract. The probe is whether those rules are sufficient to keep consumer comparisons honest, or whether more fields need to be promoted to MUST-be-present.
  Track real-fixture cases that surface gaps and revisit the equivalence list, not the architectural decision.

## Deferred Decisions

- **migration plan for `scenario normalize chatbot|skill|workflow`**: closed 2026-05-01.
  The commands still feed proposals, not evaluations; their catalog, doctor guide, version state, lint script, tests, and docs now use normalization-family vocabulary instead of public archetype vocabulary.
- **plugin author distinct CLI flow**: stick with `--workspace` flag for now.
  Revisit if plugin authors need richer fixture-workspace tooling (linting plugin manifest from fixture, etc.).
- **cross-surface composition**: a `dev` step that invokes an `app` fixture, or vice versa.
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
- **Per-preset CLI commands** like `cautilus dev repo test`.
  Preset lives in the fixture; CLI stays uniform.
  Otherwise the operator surface grows with every preset added.
- **Direct API as the only app runtime.**
  Coding-agent CLI in messaging mode (Claude `-p`, Codex `exec`) MUST be a supported runtime so users without API keys can still run app fixtures.
- **A separate ideation document** for this redesign.
  The 2026-04-25 chat ideation outcome is captured here directly.

## Constraints

- All four composition features (C1–C4) MUST be expressible in the v1 fixture schema, even if impl wires them across multiple slices.
- `dev` surface MUST work with the operator's installed Claude Code or Codex without re-pinning model versions.
- `app` surface MUST work without an API key when the user has Claude or Codex CLI installed.
- Preset is deterministic from `(surface, preset)` and validated offline.
- Result packet schema MUST stay stable across surfaces so downstream consumers (`optimize prepare-input`, `report.json`) treat all four presets uniformly.
- No backward compatibility for prior public commands or schemas. Cuts are clean.

## Success Criteria

1. A user with Claude Code installed and no other config can run `cautilus eval test --fixture <dev-repo.fixture.json>` against their own repo and get a usable result with provider, model, harness, durationMs, and costUsd recorded.
2. A user with Claude CLI but no API key can run `cautilus eval test --fixture <chat.fixture.json>` and get a usable result.
3. A fixture using `extends: ./base.fixture.json` correctly inherits base fields and applies overrides.
4. A `steps: [...]` fixture executes each step in order, and step N can read step (N-1)'s output.
5. A fixture with `expected.snapshot: ./golden.txt` passes when app `finalText` matches the snapshot text and fails with a diff when it doesn't.
6. Adding a fifth preset value requires the same justification as the existing four (taxonomy axis checkpoint passes).

## Acceptance Checks

Each criterion has at least one executable check.

- **C1 multi-case**: a suite with `cases: [a, b]` evaluates both, fixture-backend driver.
- **C2 extends**: `child.fixture.json` extends `base.fixture.json`, asserts inherited and overridden fields.
- **C3 multi-step**: 2-step fixture where step 1 declares `outputProjection`, step 2 reads `${steps[0].output.text}` (dotted path), step 2 uses `${steps[0].output}` as a whole-output JSON substitution, and an invalid placeholder (`${steps[0]}`, forward ref, missing index) errors with a parse-error.
- **C4 snapshot**: app/prompt pass case (output matches snapshot) and mismatch case (output diff surfaces in result).
- **Per-preset proof**:
  - `dev / repo`: cautilus's own AGENTS.md routing test (current self-dogfood, ported).
  - `dev / skill`: portable plugin probe in fixture workspace (port from current skill test fixtures).
  - `dev / skill` multi-turn: Cautilus first-scan, refresh-flow, and review-prepare episode fixtures produce transcript artifacts and audit-backed skill evaluation packets.
  - `app / chat`: multi-turn fixture against fixture-backend (no real model).
  - `app / prompt`: single-turn fixture against fixture-backend.
- **CLI runtime parity**: `app / chat` fixture run via direct API and via `claude -p --system-prompt` produces packets where the MUST-be-byte-equal fields match, the MUST-be-present-and-non-empty fields are populated on both sides, and the MAY-differ fields are carried with a harness tag.
- **Spec lint**: `npm run lint:specs` accepts this spec; `npm run lint:scenario-normalizers` keeps the surviving proposal-input normalizers complete.
- **Taxonomy axis**: per-surface preset enums kept narrow; mixed-axis values (e.g., adding `dev / chat`) rejected at the schema validator.

## Premortem

Bounded fresh-eye review delegated 2026-04-25 to a subagent reading this spec, `instruction-surface.spec.md`, `archetype-boundary.spec.md`, `master-plan.md`, and the taxonomy-axis-checkpoint reference.
Verdict: ready with named tightenings.
Five findings folded back into Fixed Decisions, Constraints, and Acceptance Checks above.

Anchored re-litigation notes:

1. **"`dev / skill` and `dev / repo` look like duplicate tests at fixture level."**
   They differ in scope, not runtime.
   `repo` asks an open-ended question against the real repo or fixture workspace; `skill` is bounded to one capability and the workspace knob distinguishes plugin-fixture from real-repo.
   The per-surface preset axes (development-work scope for `dev`, turn-shape for `app`) are explicit in `Fixed Decisions`.

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

`dev / repo` preset shipped:

- `cautilus eval test`, `cautilus eval evaluate` accept `cautilus.evaluation_input.v1` fixtures.
- Schema validates `surface=dev, preset=repo` only; C2/C3/C4 fields stub-error until their slices land.
- Self-dogfood fixture lives at `fixtures/eval/dev/repo/checked-in-agents-routing.fixture.json`; runner under `scripts/run-self-dogfood-eval.mjs`.
- Prior `cautilus instruction-surface test/evaluate`, `cautilus.instruction_surface_*` schemas, `instruction_surface_*` adapter fields, and the `workflow` archetype framing in this layer are removed without aliases.

Follow-up slices proceed in this order:

1. ~~`dev / skill` preset — replace `cautilus skill test/evaluate`.~~ Shipped 2026-04-25.
   `cautilus.evaluation_input.v1` now translates `surface=dev, preset=skill` cases into the existing `cautilus.skill_test_cases.v1` shape, the `cautilus eval evaluate` handler dispatches to `BuildSkillEvaluationSummary` when the observed packet uses `cautilus.skill_evaluation_inputs.v1`, and the `cautilus skill test/evaluate` commands plus their adapter slots and example fixtures were cut without aliases.
   Multi-turn episode support shipped 2026-04-27 for audit-backed `dev / skill` cases: fixtures may use `turns` and `auditKind`, and the local skill runner can drive persistent Codex and Claude episodes, write transcript artifacts, and derive the observed case result from the audit packet.
   Live refresh-flow proof shipped for both runtimes: `npm run dogfood:cautilus-refresh-flow:eval:codex` and `npm run dogfood:cautilus-refresh-flow:eval:claude` both returned `recommendation=accept-now`.
   Live first-scan proof shipped for both runtimes: `npm run dogfood:cautilus-first-scan-flow:eval:codex` and `npm run dogfood:cautilus-first-scan-flow:eval:claude` both returned `recommendation=accept-now`.
   Live review-prepare proof shipped for both runtimes: `npm run dogfood:cautilus-review-prepare-flow:eval:codex` and `npm run dogfood:cautilus-review-prepare-flow:eval:claude` both returned `recommendation=accept-now`.
   Live reviewer-launch proof shipped for both runtimes: `npm run dogfood:cautilus-reviewer-launch-flow:eval:codex` and `npm run dogfood:cautilus-reviewer-launch-flow:eval:claude` both returned `recommendation=accept-now`.
   Live review-to-eval proof shipped for both runtimes: `npm run dogfood:cautilus-review-to-eval-flow:eval:codex` and `npm run dogfood:cautilus-review-to-eval-flow:eval:claude` both returned `recommendation=accept-now`.
2. `app / chat` preset — replace `cautilus mode evaluate` chatbot mode.
   Additive accept shipped 2026-04-25: `cautilus.evaluation_input.v1` accepts `surface=app, preset=chat` and translates fixtures to `cautilus.app_chat_test_cases.v1`; `cautilus eval evaluate` dispatches `BuildAppChatEvaluationSummary` on `cautilus.app_chat_evaluation_inputs.v1`; the result packet enforces the cross-runtime equivalence rules (provider/model/harness/mode=`messaging`/durationMs/observed.messages/observed.finalText required) at the evaluator boundary.
   The matching cut shipped 2026-04-26: `cautilus mode evaluate`, the `iterate / held_out / comparison / full_gate` adapter slots, and the chatbot scenario init scaffold were removed without aliases.
   Codex backend proof shipped 2026-04-27: `npm run dogfood:app-chat:fixture` and `npm run dogfood:app-chat:codex` both run the checked-in `app / chat` fixture through `cautilus eval test`; the Codex run returned `recommendation=accept-now` while still reporting `productProofReady=false`.
   Claude backend proof shipped 2026-04-27: `npm run dogfood:app-chat:claude` runs the same checked-in fixture with `--runtime claude`; the Claude run returned `recommendation=accept-now` while remaining backend proof, not app product-runner proof.
   Optimize-search candidate held-out evaluation and final full-gate checkpoints now use `cautilus eval test` when the selected adapter exposes `evaluation_input_default`; they still honest-skip with `status=skipped` and `skipReason=surface_unavailable` when no eval-test surface is declared.
3. ~~`app / prompt` preset — new.~~ Shipped 2026-04-26.
   `cautilus.evaluation_input.v1` now accepts `surface=app, preset=prompt` and translates fixtures to `cautilus.app_prompt_test_cases.v1`; `cautilus eval evaluate` dispatches `BuildAppPromptEvaluationSummary` on `cautilus.app_prompt_evaluation_inputs.v1`.
   The result packet keeps the app-surface runtime fields from `app/chat` (`provider`, `model`, `harness`, `mode=messaging`, `durationMs`, `observed.messages`, `observed.finalText`) and adds required `observed.input` for the single-turn I/O boundary.
   Codex backend proof shipped 2026-04-27: `npm run dogfood:app-prompt:fixture` and `npm run dogfood:app-prompt:codex` both run the checked-in `app / prompt` fixture through `cautilus eval test`; the Codex run returned `recommendation=accept-now` while still reporting `productProofReady=false`.
   Claude backend proof shipped 2026-04-27: `npm run dogfood:app-prompt:claude` runs the same checked-in fixture with `--runtime claude`; the Claude run returned `recommendation=accept-now` while remaining backend proof, not app product-runner proof.
4. ~~C2 `extends` composition primitive.~~ Shipped 2026-05-01.
   File-backed `cautilus eval test` fixtures can extend a relative base fixture; object fields deep-merge, arrays replace, and scalar child fields override.
5. ~~C3 `steps` composition primitive.~~ Shipped 2026-05-01.
   Multi-step `eval test` fixtures execute each step in order, require explicit `outputProjection`, and allow only prior projected outputs to feed later step placeholders.
6. ~~C4 `expected.snapshot` composition primitive.~~ Shipped 2026-05-01 for app `finalText` snapshots.
7. ~~Rescope `scenario normalize` proposal-input lineage.~~ Shipped 2026-05-01.
   The `archetype-boundary.spec.md` retirement was absorbed into the `mode evaluate` cut slice (2026-04-26): the spec was removed, the runtime-completeness check for surviving `scenario normalize` plumbing was later renamed to `lint:scenario-normalizers`, and AGENTS.md / CLAUDE.md / README.md / master-plan.md were realigned to point at this spec instead.
   This slice completes the vocabulary cut: `cautilus scenarios --json` emits `cautilus.scenario_normalization_catalog.v1` with `normalizationFamilies`, `first_bounded_run` uses the same field, and the lint command is now `lint:scenario-normalizers`.
