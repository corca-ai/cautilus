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
- helper: [chatbot-proposal-candidates.mjs](../../scripts/agent-runtime/chatbot-proposal-candidates.mjs)
- CLI wrapper: [normalize-chatbot-proposals.mjs](../../scripts/agent-runtime/normalize-chatbot-proposals.mjs)
- CLI subcommand: `cautilus scenario normalize chatbot`
- contract document: [chatbot-normalization.md](../contracts/chatbot-normalization.md)
- example fixture: [chatbot-consumer-input.json](../../fixtures/scenario-proposals/chatbot-consumer-input.json)
- behavior surfaces: `workflow_conversation`, `thread_followup`,
  `thread_context_recovery`

### skill

What it evaluates: a single skill or agent invocation — does it trigger on
the right prompts, execute the intended task cleanly, and keep declared
validation surfaces passing.

- schema: `cautilus.skill_normalization_inputs.v2`
- helper: [skill-proposal-candidates.mjs](../../scripts/agent-runtime/skill-proposal-candidates.mjs)
- CLI wrapper: [normalize-skill-proposals.mjs](../../scripts/agent-runtime/normalize-skill-proposals.mjs)
- CLI subcommand: `cautilus scenario normalize skill`
- contract document: [skill-normalization.md](../contracts/skill-normalization.md)
- example fixture: [skill-validation-input.json](../../fixtures/scenario-proposals/skill-validation-input.json)
- behavior surfaces: `skill_validation`, `skill_trigger_selection`,
  `skill_execution_quality`

The skill archetype must not accept `cli_workflow` inputs. Workflow shapes
go to the workflow archetype.

### workflow

What it evaluates: stateful automation that persists across multiple
invocations and must recover when it hits a known blocker.

- schema: `cautilus.workflow_normalization_inputs.v1`
- helper: [workflow-proposal-candidates.mjs](../../scripts/agent-runtime/workflow-proposal-candidates.mjs)
- CLI wrapper: [normalize-workflow-proposals.mjs](../../scripts/agent-runtime/normalize-workflow-proposals.mjs)
- CLI subcommand: `cautilus scenario normalize workflow`
- contract document: [workflow-normalization.md](../contracts/workflow-normalization.md)
- example fixture: [workflow-recovery-input.json](../../fixtures/scenario-proposals/workflow-recovery-input.json)
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
  derivation, slug helpers) live under
  `scripts/agent-runtime/shared/` or as neutral modules whose name does not
  mention any one archetype.
- Fixture filenames reflect their archetype: `chatbot-*`, `skill-*`,
  `workflow-*`. A fixture must not mix archetype shapes in one file.
- The renamed canonical evaluation workflow document is
  [docs/evaluation-process.md](../evaluation-process.md). `docs/workflow.md`
  no longer exists to avoid colliding with the `workflow` archetype name.

## Source Guard

> check:source_guard
| file | mode | pattern |
| --- | --- | --- |
| scripts/agent-runtime/contract-versions.mjs | fixed | CHATBOT_NORMALIZATION_INPUTS_SCHEMA = "cautilus.chatbot_normalization_inputs.v1" |
| scripts/agent-runtime/contract-versions.mjs | fixed | SKILL_NORMALIZATION_INPUTS_SCHEMA = "cautilus.skill_normalization_inputs.v2" |
| scripts/agent-runtime/contract-versions.mjs | fixed | WORKFLOW_NORMALIZATION_INPUTS_SCHEMA = "cautilus.workflow_normalization_inputs.v1" |
| scripts/agent-runtime/chatbot-proposal-candidates.mjs | file_exists |  |
| scripts/agent-runtime/skill-proposal-candidates.mjs | file_exists |  |
| scripts/agent-runtime/workflow-proposal-candidates.mjs | file_exists |  |
| scripts/agent-runtime/workflow-proposal-candidates.mjs | fixed | normalizeWorkflowProposalCandidates |
| scripts/agent-runtime/normalize-chatbot-proposals.mjs | file_exists |  |
| scripts/agent-runtime/normalize-skill-proposals.mjs | file_exists |  |
| scripts/agent-runtime/normalize-workflow-proposals.mjs | file_exists |  |
| fixtures/scenario-proposals/chatbot-input.schema.json | file_exists |  |
| fixtures/scenario-proposals/chatbot-input.schema.json | fixed | cautilus.chatbot_normalization_inputs.v1 |
| fixtures/scenario-proposals/skill-input.schema.json | file_exists |  |
| fixtures/scenario-proposals/skill-input.schema.json | fixed | cautilus.skill_normalization_inputs.v2 |
| fixtures/scenario-proposals/workflow-input.schema.json | file_exists |  |
| fixtures/scenario-proposals/workflow-input.schema.json | fixed | cautilus.workflow_normalization_inputs.v1 |
| fixtures/scenario-proposals/chatbot-consumer-input.json | file_exists |  |
| fixtures/scenario-proposals/skill-validation-input.json | file_exists |  |
| fixtures/scenario-proposals/workflow-recovery-input.json | file_exists |  |
| fixtures/scenario-proposals/workflow-recovery-input.json | fixed | cautilus.workflow_normalization_inputs.v1 |
| docs/contracts/chatbot-normalization.md | file_exists |  |
| docs/contracts/skill-normalization.md | file_exists |  |
| docs/contracts/workflow-normalization.md | file_exists |  |
| docs/evaluation-process.md | file_exists |  |
| internal/cli/command-registry.json | fixed | "path": ["scenario", "normalize", "chatbot"] |
| internal/cli/command-registry.json | fixed | "path": ["scenario", "normalize", "skill"] |
| internal/cli/command-registry.json | fixed | "path": ["scenario", "normalize", "workflow"] |

## Functional Check

The three archetype normalize commands must each resolve their own example
fixture into a valid proposal candidate list.

```run:shell
$ cautilus scenario normalize chatbot --input ./fixtures/scenario-proposals/chatbot-consumer-input.json
$ cautilus scenario normalize skill --input ./fixtures/scenario-proposals/skill-validation-input.json
$ cautilus scenario normalize workflow --input ./fixtures/scenario-proposals/workflow-recovery-input.json
```

The skill command must reject a workflow-shaped input with an actionable
error that mentions `cautilus scenario normalize workflow`.

## Follow-up Work

The initial slice that landed this spec covers: schema split, helper split,
CLI subcommand for workflow, contract doc split, fixture cleanup,
`docs/workflow.md` rename to `docs/evaluation-process.md`, README Scenarios
rewrite with three archetype blocks. Follow-up work that must reconcile
with this spec:

1. **`cautilus scenarios` command.** Print the three archetypes with one
   example input path and one next-step command each. Machine-readable
   (`--json`) companion so an agent can pick by archetype. Pairs with the
   next item.
2. **`cautilus --help` grouping.** Replace the 34-line flat usage list with
   purpose-based groups: `Run an evaluation scenario`, `Set up and check a
   repo`, `Turn results into next moves`, `Introspection`. Backed by a
   `group` field in `internal/cli/command-registry.json`.
3. **`cautilus adapter init --scenario <chatbot|skill|workflow>`.** Emit a
   starter adapter template whose command slots match the selected
   archetype (for example, skill pre-fills `skill_test_command_templates`).
4. **`--example-input` on every normalize/evaluate command.** Write a
   minimal fixture-shaped JSON to stdout so operators can stop clicking
   into fixtures on GitHub.
5. **Inline-glossary pass across README.** First use of `held-out`,
   `packet`, `bounded`, `executor variant`, `review variant`,
   `intent-first` gets a one-line parenthetical definition. No separate
   glossary document; definitions stay next to first use.
6. **Surface-name disambiguation.** `workflow_conversation` (chatbot
   archetype) and `operator_workflow_recovery` (workflow archetype) both
   contain the word `workflow` in the catalog. Consider renaming
   `workflow_conversation` to `conversation_continuity` in
   `cautilus.behavior_intent.v1` so archetype vocabulary does not leak
   across boundaries. Requires a bump of `cautilus.behavior_intent.v1` or a
   catalog-level deprecation.
7. **Doctor next-step hint.** After `ready`, print a short pointer to
   `cautilus scenarios` so a first-time user knows which scenario applies
   to their situation.
8. **Bundled skill SKILL.md scenario preamble.** Mirror the three
   archetype blocks from README into the top of
   [skills/cautilus/SKILL.md](../../skills/cautilus/SKILL.md) so a
   skill-loading agent starts with the same mental model as a human.
9. **Fixture naming parity.** `workflow-recovery-input.json` breaks the
   `<archetype>-input.json` convention that `chatbot-input.json` and
   `skill-input.json` follow. Add a canonical
   `workflow-input.json` and keep `workflow-recovery-input.json` only as a
   named specialized example, or rename outright. Whichever path is chosen,
   the generic example file name should match the archetype name.
10. **Narrative adapter source alignment.**
    [`.agents/narrative-adapter.yaml`](../../.agents/narrative-adapter.yaml)
    `source_documents` should include `archetype-boundary.spec.md`, so
    narrative runs keep README, SKILL.md, and master-plan aligned to the
    three-archetype contract.
11. **README section ordering.** Scenarios block is the most scannable
    section for first-time readers, but currently sits below Why Cautilus
    and Core Flow. Reorder the top of README so readers hit the three
    scenario blocks before the philosophy block. Pairs naturally with
    follow-up 5 (inline glossary).
12. **Experimental archetype escape hatch.** This spec requires every
    first-class archetype to ship in a coordinated slice. That discipline
    is intentional, but leaves no room for research prototypes. Consider a
    `scripts/agent-runtime/prototypes/` namespace with relaxed rules for
    exploratory surfaces, and a promotion checklist into first-class
    status when the surface earns a schema/helper/CLI/contract slice.
13. **Remove Node normalize helper dual implementation.** The archetype
    normalization logic currently exists twice: once in Go
    (`internal/runtime/proposals.go`, shipped via the `cautilus` binary)
    and once in Node
    (`scripts/agent-runtime/{chatbot,skill,workflow}-proposal-candidates.mjs`
    plus `normalize-{chatbot,skill,workflow}-proposals.mjs`). The Node
    path is historical from the pre-Go era. No test verifies that the
    two implementations agree on output, and the first post-archetype
    premortem found concrete field-shape divergence on empty
    `blockerKind` and `metrics` values. Contract docs further confuse
    the picture by pointing at the Node `.mjs` files as "the helper"
    even though the shipped helper is the Go CLI.

    Target state:
    - Delete every `*-proposal-candidates.mjs` and
      `normalize-*-proposals.mjs` helper under `scripts/agent-runtime/`.
    - Drop their test files under `scripts/agent-runtime/`.
    - Remove the "Direct script usage is also supported" block in
      README that lists these helpers.
    - Rewrite `docs/contracts/{chatbot,skill,workflow}-normalization.md`
      so "Current Slice" references `cautilus scenario normalize ...`
      as the canonical helper instead of the Node `.mjs` files.
    - Refresh `archetype-boundary.spec.md` source guard table to stop
      pointing at Node files for helper existence.
    - Verify the standalone functional check still exercises each
      archetype via the binary.

    Out of scope for the removal slice: other scripts under
    `scripts/agent-runtime/` (workspace, review-variant, optimize-search,
    scenario-history, etc.). Only the archetype-normalization dual
    implementation is being retired here. Cross-runtime tooling outside
    the archetype layer stays as is until a separate decision retires it.

Every item above must keep the 1:1 archetype mapping intact. When adding a
new first-class evaluation target, update this spec first and introduce the
matching schema, helper, CLI, fixture, and contract document in one
coordinated slice.
