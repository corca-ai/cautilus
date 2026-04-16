# Archetype Boundary (cautilus.archetype.v1)

`Cautilus` has exactly three first-class evaluation archetypes. Every
product-owned helper, schema, fixture, CLI subcommand, and contract document
must map 1:1 to one of these archetypes, or be a cross-archetype utility
that serves all three without giving one archetype preferential naming.

This spec is the standing contract for that mapping. When it drifts,
`npm run lint:specs` fails. When new user-facing copy talks about Cautilus's
targets, it must reconcile with the vocabulary below.

## Archetypes

### chatbot

What it evaluates: multi-turn conversational behavior inside a single session.

- schema: `cautilus.chatbot_normalization_inputs.v1`
- helper: `NormalizeChatbotProposalCandidates` in
  [proposals.go](../../internal/runtime/proposals.go)
- CLI subcommand: `cautilus scenario normalize chatbot`
- contract document: [chatbot-normalization.md](../contracts/chatbot-normalization.md)
- example fixture: [chatbot-consumer-input.json](../../fixtures/scenario-proposals/samples/chatbot-consumer-input.json)
- starter kit: [examples/starters/chatbot/](../../examples/starters/chatbot/)
- behavior surfaces: `conversation_continuity`, `thread_followup`,
  `thread_context_recovery`

### skill

What it evaluates: a single skill or agent invocation — does it trigger on
the right prompts, execute the intended task cleanly, and keep declared
validation surfaces passing.

- schema: `cautilus.skill_normalization_inputs.v2`
- helper: `NormalizeSkillProposalCandidates` in
  [proposals.go](../../internal/runtime/proposals.go)
- CLI subcommand: `cautilus scenario normalize skill`
- contract document: [skill-normalization.md](../contracts/skill-normalization.md)
- example fixture: [skill-validation-input.json](../../fixtures/scenario-proposals/samples/skill-validation-input.json)
- starter kit: [examples/starters/skill/](../../examples/starters/skill/)
- behavior surfaces: `skill_validation`, `skill_trigger_selection`,
  `skill_execution_quality`

The skill archetype must not accept `cli_workflow` inputs. Workflow shapes
go to the workflow archetype.

### workflow

What it evaluates: stateful automation that persists across multiple
invocations and must recover when it hits a known blocker.

- schema: `cautilus.workflow_normalization_inputs.v1`
- helper: `NormalizeWorkflowProposalCandidates` in
  [proposals.go](../../internal/runtime/proposals.go)
- CLI subcommand: `cautilus scenario normalize workflow`
- contract document: [workflow-normalization.md](../contracts/workflow-normalization.md)
- example fixture: [workflow-recovery-input.json](../../fixtures/scenario-proposals/samples/workflow-recovery-input.json)
- starter kit: [examples/starters/workflow/](../../examples/starters/workflow/)
- behavior surfaces: `operator_workflow_recovery`

## Why skill stays unified

The skill archetype covers three sub-drifts: validation, trigger selection,
and execution quality. The same `evaluationRuns` shape describes all three,
and a single host session commonly evaluates more than one at once (one
skill invocation produces trigger + execution signals together). Splitting
them into three archetypes would duplicate schema, helper, and CLI without
a clear user-facing payoff. The split stays at the `surface` level inside
one helper instead. Revisit this decision only when a sub-drift diverges in
input shape or is owned by a distinct host class.

## Invariants

- No archetype helper may accept another archetype's schema id.
- Each archetype's contract document may reference only its own schema id
  when declaring input boundary, aside from clearly labeled cross-references.
- Cross-archetype utilities (merge-by-proposal-key, intent-profile
  derivation, slug helpers) live as neutral functions inside
  [internal/runtime/proposals.go](../../internal/runtime/proposals.go)
  whose names do not mention any one archetype.
- Fixture filenames reflect their archetype: `chatbot-*`, `skill-*`,
  `workflow-*`. A fixture must not mix archetype shapes in one file.
  See Fixture Naming below for the canonical / minimal / specialized
  split.
- The renamed canonical evaluation workflow document is
  [docs/guides/evaluation-process.md](../guides/evaluation-process.md). `docs/workflow.md`
  no longer exists to avoid colliding with the `workflow` archetype name.

## Introspection Surfaces

Three command surfaces let operators and tooling discover what `Cautilus`
exposes. They are intentionally separate because they serve different
audiences and grow at different rates:

- `cautilus --help` (and `cautilus <subcommand> --help`) — human-readable
  terminal text. Not a stable machine-parseable contract; do not script
  against its shape.
- `cautilus commands [--json]` — machine-readable CLI registry. Wrapper
  tooling and agents parse it for safe probing and dispatch. Enumerates
  every command path, usage string, and group. Grows with the CLI
  surface on every new subcommand.
- `cautilus scenarios [--json]` — machine-readable archetype catalog.
  Enumerates the first-class evaluation archetypes defined in this spec
  and their canonical entry commands. Answers "what can I evaluate?"
  rather than "what commands exist?". Fixed cardinality: grows only when
  this spec adds a new archetype.

The three are deliberately not merged. `commands` is a CLI-shape index
pinned to the CLI registry; `scenarios` is an evaluation-semantics index
pinned to this spec. Merging would conflate dispatch metadata with
archetype meaning, and every new subcommand would touch the scenarios
payload by accident.

Guidance for callers:

- Agents picking an archetype should read `cautilus scenarios --json`.
- Wrapper tools dispatching commands should read
  `cautilus commands --json`.
- Human operators use `cautilus --help`; no other surface promises the
  same shape.

Source-guard coverage for the underlying command paths already lives in
[current-product.spec.md](./current-product.spec.md) and
[standalone-surface.spec.md](./standalone-surface.spec.md), so this
section does not restate those rows.

## Fixture Naming

Each archetype's fixtures split into three roles. Every new archetype
slice must respect this split.

- **Canonical.** `fixtures/scenario-proposals/<archetype>-input.json`.
  One per archetype. This is the realistic reference shape — what a
  typical consumer input actually looks like. Standing functional checks
  (`docs/specs/current-product.spec.md`) and the `cautilus scenarios`
  catalog point at this file.
- **Minimal.** Emitted by `cautilus scenario normalize <archetype> --example-input`
  and `cautilus skill evaluate --example-input` on stdout. Not a file.
  The minimal shape is the smallest valid packet that satisfies the
  published schema; it exists so operators can `--example-input | <same
  command>` without opening the repo. The stdout payload is
  schema-validated by
  [internal/app/examples_schema_test.go](../../internal/app/examples_schema_test.go),
  which pins "minimal = stdout" as the single source of truth.
- **Specialized.** `fixtures/scenario-proposals/samples/<archetype>-<specialization>-input.json`.
  Consumer- or sub-surface-shaped examples (e.g.
  `chatbot-consumer-input.json`, `skill-validation-input.json`,
  `workflow-recovery-input.json`). Referenced from consumer-facing copy
  (README, archetype section headers, consumer-readiness appendix, this
  spec's Functional Check). Multiple specialized fixtures per archetype
  are allowed.

This split is deliberate. Conflating canonical with specialized would
force one file to serve two audiences (schema reference vs. realistic
consumer narrative) and make either role harder to read. Adding a
minimal fixture file alongside the `--example-input` stdout would
duplicate the minimal payload in two places and invite drift.

Starter kits under `examples/starters/<archetype>/` keep a copy of the
canonical fixture at `input.json` so each starter stays self-contained
when a consumer copies just that directory. The copy is kept
byte-identical to the canonical fixture by a drift test
([scripts/starter-kit-parity.test.mjs](../../scripts/starter-kit-parity.test.mjs));
update both files together or re-run the copy. The starter copy is not
a new fixture role — it is an intentional duplicate carried for consumer
convenience.

## Source Guard

> check:source_guard
| file | mode | pattern |
| --- | --- | --- |
| internal/contracts/constants.go | fixed | ChatbotNormalizationInputsSchema |
| internal/contracts/constants.go | fixed | "cautilus.chatbot_normalization_inputs.v1" |
| internal/contracts/constants.go | fixed | SkillNormalizationInputsSchema |
| internal/contracts/constants.go | fixed | "cautilus.skill_normalization_inputs.v2" |
| internal/contracts/constants.go | fixed | WorkflowNormalizationInputsSchema |
| internal/contracts/constants.go | fixed | "cautilus.workflow_normalization_inputs.v1" |
| internal/runtime/proposals.go | file_exists |  |
| internal/runtime/proposals.go | fixed | func NormalizeChatbotProposalCandidates |
| internal/runtime/proposals.go | fixed | func NormalizeSkillProposalCandidates |
| internal/runtime/proposals.go | fixed | func NormalizeWorkflowProposalCandidates |
| internal/runtime/proposals.go | fixed | func assertSkillTargetKind |
| internal/runtime/proposals.go | fixed | func assertWorkflowTargetKind |
| internal/runtime/scenarios.go | file_exists |  |
| internal/runtime/scenarios.go | fixed | "cautilus.scenarios.v1" |
| internal/runtime/scenarios.go | fixed | Archetype:     "chatbot" |
| internal/runtime/scenarios.go | fixed | Archetype:     "skill" |
| internal/runtime/scenarios.go | fixed | Archetype:     "workflow" |
| internal/app/app.go | fixed | func handleScenarioNormalizeChatbot |
| internal/app/app.go | fixed | func handleScenarioNormalizeSkill |
| internal/app/app.go | fixed | func handleScenarioNormalizeWorkflow |
| skills/cautilus/SKILL.md | fixed | scenario normalize chatbot |
| skills/cautilus/SKILL.md | fixed | scenario normalize skill |
| skills/cautilus/SKILL.md | fixed | scenario normalize workflow |
| skills/cautilus/SKILL.md | fixed | exactly three first-class evaluation archetypes |
| README.md | fixed | Cautilus has three first-class evaluation archetypes |
| fixtures/scenario-proposals/chatbot-input.schema.json | file_exists |  |
| fixtures/scenario-proposals/chatbot-input.schema.json | fixed | cautilus.chatbot_normalization_inputs.v1 |
| fixtures/scenario-proposals/skill-input.schema.json | file_exists |  |
| fixtures/scenario-proposals/skill-input.schema.json | fixed | cautilus.skill_normalization_inputs.v2 |
| fixtures/scenario-proposals/workflow-input.schema.json | file_exists |  |
| fixtures/scenario-proposals/workflow-input.schema.json | fixed | cautilus.workflow_normalization_inputs.v1 |
| fixtures/scenario-proposals/samples/chatbot-consumer-input.json | file_exists |  |
| fixtures/scenario-proposals/samples/skill-validation-input.json | file_exists |  |
| fixtures/scenario-proposals/samples/workflow-recovery-input.json | file_exists |  |
| fixtures/scenario-proposals/samples/workflow-recovery-input.json | fixed | cautilus.workflow_normalization_inputs.v1 |
| docs/contracts/chatbot-normalization.md | file_exists |  |
| docs/contracts/skill-normalization.md | file_exists |  |
| docs/contracts/workflow-normalization.md | file_exists |  |
| docs/guides/evaluation-process.md | file_exists |  |
| internal/cli/command-registry.json | fixed | "path": ["scenario", "normalize", "chatbot"] |
| internal/cli/command-registry.json | fixed | "path": ["scenario", "normalize", "skill"] |
| internal/cli/command-registry.json | fixed | "path": ["scenario", "normalize", "workflow"] |

## Functional Check

The three archetype normalize commands must each resolve their own example
fixture into a valid proposal candidate list.

```run:shell
$ cautilus scenario normalize chatbot --input ./fixtures/scenario-proposals/samples/chatbot-consumer-input.json
$ cautilus scenario normalize skill --input ./fixtures/scenario-proposals/samples/skill-validation-input.json
$ cautilus scenario normalize workflow --input ./fixtures/scenario-proposals/samples/workflow-recovery-input.json
```

The skill command must reject a workflow-shaped input with an actionable
error that mentions `cautilus scenario normalize workflow`.

## Experimental Prototypes

The 1:1 archetype boundary above is intentionally strict: every
first-class archetype must ship a schema constant, helper, CLI
subcommand, contract document, fixture, README block, SKILL.md
reference, scenarios-catalog entry, and source-guard rows in one
coordinated slice. That discipline keeps the contract honest but leaves
no room to explore a fourth shape before its surface is understood.

The escape hatch is the explicit `prototypes` namespace at
[`internal/runtime/prototypes/`](../../internal/runtime/prototypes).
Code that lives there is **not** a first-class archetype:

- Schemas use the `cautilus.<name>_prototype.v0` naming pattern. The
  `v0` band signals "may break without consumer migration." Stable
  schemas use `v1+` and live outside the prototypes directory.
- Source-guard rows are not required.
- README and SKILL.md must not advertise prototype surfaces.
- The packaged-skill sync script does not surface prototype docs.
- Prototype helpers may not be referenced from any first-class
  archetype helper or from `internal/runtime/scenarios.go`.
- Each prototype declares its expected lifetime in a top-of-file
  comment: `// Prototype lifetime: until promoted to first-class or
  removed by <YYYY-MM-DD>.`

A prototype graduates to a first-class archetype only by completing
the full ordered "Adding A New First-Class Archetype" checklist below
in one slice. That slice must also delete the prototype copy under
`internal/runtime/prototypes/` so the canonical surface is the
promoted one.

## Adding A New First-Class Archetype

`npm run lint:specs` passing only proves the surfaces named in the
Source Guard table exist. It does not prove the slice that adds a
fourth archetype is complete. When introducing a new first-class
archetype, edit these files in this order in one coordinated slice
(everything from step 1 must be merged together; the spec lint must
also pass after the table is widened in step 9):

1. `internal/contracts/constants.go` — add the new
   `<Archetype>NormalizationInputsSchema` constant + literal string.
2. `fixtures/scenario-proposals/<archetype>-input.schema.json` — JSON
   schema file pinned to the new schema id.
3. `fixtures/scenario-proposals/<archetype>-*-input.json` — at least
   one canonical example fixture matching the new schema.
4. `internal/runtime/proposals.go` — add
   `Normalize<Archetype>ProposalCandidates`, the per-pattern
   `build<Archetype>...Candidate` builders, and an
   `assert<Archetype>TargetKind` isolation function (extend the
   contract comment block at the top of the file).
5. `internal/runtime/intent.go` — add any new behavior surfaces and
   dimensions needed for the new archetype to the `BehaviorSurfaces` /
   `BehaviorDimensions` registries and to the
   `defaultSuccessDimensionsBySurface` map. Wire the new dimensions
   into `behaviorDimensionCatalog` so they apply to the right surface.
6. `internal/runtime/scenarios.go` — add a `ScenarioCatalogEntry` for
   the new archetype so `cautilus scenarios` includes it.
7. `internal/cli/command-registry.json` — register the new
   `["scenario", "normalize", "<archetype>"]` command path.
8. `internal/app/app.go` — wire `handleScenarioNormalize<Archetype>`
   in the `nativeHandler` dispatch table and the `switch kind` block,
   then add the matching parser if needed.
9. `docs/specs/archetype-boundary.spec.md` — add the new archetype's
   `###` section above, widen the Source Guard table to include all
   files touched in steps 1-8, and update any count language that
   said "three" archetypes.
10. `docs/contracts/<archetype>-normalization.md` — contract document
    for the new helper boundary.
11. `README.md` — add a Scenarios block with what-you-bring,
    what-happens, what-comes-back, and next-action; update the
    archetype count line.
12. `skills/cautilus/SKILL.md` — add a Scenarios sub-block matching
    the README copy and re-run the packaged-skill sync (Slice 0
    `node scripts/release/sync-packaged-skill.mjs .`).

The Source Guard table above only enforces existence of named
patterns; it does not enforce ordering of the steps themselves. An
inverse-completeness check — `npm run lint:archetypes`, implemented
by [scripts/check-archetype-completeness.mjs](../../scripts/check-archetype-completeness.mjs)
— walks each archetype `###` heading in this spec and asserts every
required surface is present (schema constant, helper, CLI subcommand,
fixture, contract doc, behavior surfaces, assertion function, handler,
scenarios catalog entry, README block, SKILL.md reference). It does
not enforce ordering or co-commit; those stay the contributor's job.

Every new archetype must keep the 1:1 archetype mapping intact. When
adding a new first-class evaluation target, update this spec first and
introduce the matching schema, helper, CLI, fixture, and contract
document in one coordinated slice.
