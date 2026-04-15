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
- example fixture: [chatbot-consumer-input.json](../../fixtures/scenario-proposals/chatbot-consumer-input.json)
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
- example fixture: [skill-validation-input.json](../../fixtures/scenario-proposals/skill-validation-input.json)
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
  derivation, slug helpers) live as neutral functions inside
  [internal/runtime/proposals.go](../../internal/runtime/proposals.go)
  whose names do not mention any one archetype.
- Fixture filenames reflect their archetype: `chatbot-*`, `skill-*`,
  `workflow-*`. A fixture must not mix archetype shapes in one file.
- The renamed canonical evaluation workflow document is
  [docs/evaluation-process.md](../evaluation-process.md). `docs/workflow.md`
  no longer exists to avoid colliding with the `workflow` archetype name.

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

1. **Experimental archetype escape hatch.** This spec requires every
   first-class archetype to ship in a coordinated slice. That discipline
   is intentional, but leaves no room for research prototypes. Consider a
   relaxed namespace (location TBD — keep the `prototypes/` hint Go-side
   if the surface ends up living in `internal/runtime/`) with relaxed
   rules for exploratory surfaces, and a promotion checklist into
   first-class status when the surface earns a schema/helper/CLI/
   contract slice.
2. **Archetype-extension hardening.** Surfaced by an
    onboarding-lens premortem on the Node-removal slice (round 2): a new
    contributor told to add a 4th first-class archetype must currently
    grep across files this spec does not name, and the 1:1 mapping has
    no inverse-completeness check. The deletion slice is intentionally
    not bundling these because they are extension-time concerns, not
    Node-removal concerns. Pick this up before — or together with — the
    next first-class archetype actually being added.

    Required edits this spec should name (today the contributor must
    discover them by greping):

    - `internal/app/app.go` dispatch table (around L176-181) and the
      `switch kind` block (around L691-731). Source-guard rows for
      `handleScenarioNormalize{Chatbot,Skill,Workflow}`.
    - `internal/runtime/intent.go` `BehaviorSurfaces` /
      `BehaviorDimensions` registries. `BehaviorSurfaces[...]` lookup
      currently returns the empty string on a missing key; consider a
      panic-on-miss helper as a separate seam.
    - `internal/runtime/proposals.go` `assert<Archetype>TargetKind`
      isolation pattern (around L189-205). Source-guard row for each
      assertion function name. Without this, a new archetype can
      silently accept another archetype's `targetKind` and break the
      1:1 mapping invariant.
    - `internal/cli/command-registry.json` already has a Source Guard
      for the `commands` array paths; the per-command `group`, `usage`,
      and `example` inline fields are NOT guarded. Decide whether to
      widen the guard or leave them as cosmetic.
    - `skills/cautilus/SKILL.md` references list ordering (chatbot ·
      skill-* · workflow). Source-guard row pinning the archetype
      reference order would prevent skill-loading agents from missing
      a new archetype.
    - `README.md` Repo Layout schema-file bullets and the Scenarios
      section's literal `"Cautilus has three first-class evaluation
      archetypes"` count line. Either source-guard the count or
      reword to be count-agnostic.
    - `internal/runtime/proposals.go` extension-shape contract: the
      file is now ~800 lines flat with no `register(...)` seam. A
      6-line comment block at the top naming the per-archetype
      contract (top-level `Normalize<Archetype>ProposalCandidates`,
      `build<Archetype>...Candidate` builders, `assert<Archetype>...`
      isolation, shared `mergeCandidatesByProposalKey`) would cut the
      first read time meaningfully.
    - `internal/runtime/proposals.go` `humanizeTargetKind` map
      (around L685): if a new archetype introduces a new `targetKind`,
      the fallback renders lower-case. Either Title Case the fallback
      or require the spec to name the map.
    - Spec walkthrough: today this spec is a registry of endpoints,
      not an ordered "to add an archetype, edit these N files in this
      order" checklist. Add such a checklist (or generate one from
      the Source Guard table) so `npm run lint:specs` passing means
      "the slice is complete," not "the surfaces named in the table
      exist."
    - Inverse-completeness lint: enumerate archetypes from `###`
      headings in this spec; for each, assert that every required
      surface (schema constant, helper function, CLI subcommand,
      fixture, contract doc, behavior surfaces, assertion function,
      handler, README block, SKILL.md reference) actually exists.
      Larger seam, may be its own spec lint command.

    Test gaps in `internal/runtime/proposals_test.go` that should land
    with the same hardening pass (also surfaced by the round-2
    code-level audit lens):

    - The `eventTriggeredFollowupPatterns` branch
      (`buildEventTriggeredFollowupCandidate`) has zero direct
      coverage. One subcase using an `eventType: "app_mention"`
      conversation closes it.
    - The workflow `description` "CLI Workflow" prefix has no
      regression guard; a future refactor that drops the prefix would
      ship silently.
    - `mergeCandidatesByProposalKey` insertion-order is asserted only
      by parity inspection; no Go test pins it. A future refactor back
      to `for k,v := range map` would reintroduce nondeterminism.

    All of the above were considered for inclusion in the Node-removal
    slice and rejected (counterweight classification (d) "valid but
    defer") because they are extension-time scaffolding, not
    dual-implementation retirement. Bundling would have inflated the
    slice's intent without protecting any current user.

Every item above must keep the 1:1 archetype mapping intact. When adding a
new first-class evaluation target, update this spec first and introduce the
matching schema, helper, CLI, fixture, and contract document in one
coordinated slice.
