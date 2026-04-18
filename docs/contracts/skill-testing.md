# Skill Testing Contract

`Cautilus` should support a first-class `skill test` workflow for the common operator request:

`Use Cautilus to test this skill.`

`skill evaluate` remains the packet summarizer for already observed runs.
`skill test` sits one step earlier and owns the bounded workflow that turns a checked-in case suite plus adapter-owned runner into the observed evaluation packet.

## Problem

`skill evaluate` is valuable once a host already has a normalized `cautilus.skill_evaluation_inputs.v1` packet, but that starts too late for the operator flow where an agent should be able to run a local skill test with one explicit command path.

The product-owned first slice should be:

`checked-in skill cases -> cautilus skill test -> observed skill evaluation input -> cautilus skill evaluate -> skill evaluation summary -> cautilus scenario normalize skill`

This keeps host execution ownership in the adapter while letting `Cautilus` own the operator-facing command, output paths, runDir behavior, and downstream chaining.

## Input Boundary

`cautilus skill test` should consume a checked-in case suite with schema `cautilus.skill_test_cases.v1`.

Minimum shape:

- `skillId`
- optional `skillDisplayName`
- optional suite-level `repeatCount`
- optional suite-level `minConsensusCount`
- `cases`
  - `caseId`
  - optional `targetKind`
  - optional `targetId`
  - optional `displayName`
  - `evaluationKind`
    - `trigger`
    - `execution`
  - `prompt`
  - trigger-only `expectedTrigger`
    - `must_invoke`
    - `must_not_invoke`
  - optional execution `thresholds`
  - optional `repeatCount`
  - optional `minConsensusCount`

When `repeatCount` is greater than `1`, the adapter-owned runner should execute that case multiple times and emit one aggregated observed evaluation result.
`minConsensusCount` is the minimum number of matching runs required for that aggregated result to count as a clean pass.
If omitted, it defaults to `repeatCount`.

The checked-in case suite owns the prompts and expectations.
The adapter-owned runner still owns:

- how the local host runtime is actually invoked
- how invocation is observed
- how output files or transcripts are collected
- any host-specific backend choice such as `codex exec`

## Adapter Boundary

The adapter may define:

- `skill_cases_default`
- `skill_test_command_templates`

Current placeholder additions for that seam:

- `{skill_id}`
- `{skill_cases_file}`
- `{skill_eval_input_file}`
- `{backend}` — resolved from `--runtime` CLI flag, adapter `default_runtime`, or `codex_exec` fallback

Existing placeholders such as `{candidate_repo}` and `{output_dir}` remain available, so a checked-in runner can use a disposable workspace and emit its raw artifacts beside the generated input packet.

## Output Boundary

`cautilus skill test` should create one bounded workflow directory containing:

- `skill-evaluation-input.json`
- `skill-evaluation-summary.json`
- `skill-candidates.json`
- per-command stdout/stderr artifacts
- any adapter-owned raw runner artifacts
- per-case aggregate artifacts when repeated runs are used

The summary and candidates should be product-owned outputs even when the adapter-owned runner produced the raw observed packet.

## Guardrails

- Do not make `skill test` parse raw host logs directly inside the product.
- Do not require every host to expose provider telemetry before the seam is usable.
- Do not collapse deterministic packaging or bootstrap validation into this workflow.
  Keep those as repo-owned cheap gates.
- Do not force operators to hand-edit `cautilus.skill_evaluation_inputs.v1` when a checked-in case suite plus adapter runner can produce it.
