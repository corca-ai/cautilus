# Skill Testing Contract

`Cautilus` exposes the `repo / skill` preset under `cautilus eval test` for the common operator request:

`Use Cautilus to test this skill.`

`cautilus eval evaluate` remains the packet summarizer for already observed runs.
`cautilus eval test --fixture <skill.fixture.json>` sits one step earlier and owns the bounded workflow that turns a checked-in case suite plus adapter-owned runner into the observed evaluation packet.

## Problem

`eval evaluate` is valuable once a host already has a normalized `cautilus.skill_evaluation_inputs.v1` packet, but that starts too late for the operator flow where an agent should be able to run a local skill test with one explicit command path.

The product-owned first slice is:

`checked-in skill cases -> cautilus eval test -> observed skill evaluation input -> cautilus eval evaluate -> skill evaluation summary -> cautilus scenario normalize skill`

This keeps host execution ownership in the adapter while letting `Cautilus` own the operator-facing command, output paths, runDir behavior, and downstream chaining.

## Input Boundary

`cautilus eval test` accepts a checked-in fixture with schema `cautilus.evaluation_input.v1` and `surface=repo, preset=skill`.

Minimum shape:

- `surface: repo`
- `preset: skill`
- `suiteId`
- optional `suiteDisplayName`
- optional `skillId` (defaults to `suiteId`)
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
  - optional `requiredSummaryFragments`
  - optional `forbiddenSummaryFragments`
  - optional `requiredCommandFragments`
  - optional `forbiddenCommandFragments`
  - optional `repeatCount`
  - optional `minConsensusCount`

The fixture is internally translated into a `cautilus.skill_test_cases.v1` packet that the adapter-owned runner already consumes.

When `repeatCount` is greater than `1`, the adapter-owned runner should execute that case multiple times and emit one aggregated observed evaluation result.
`minConsensusCount` is the minimum number of matching runs required for that aggregated result to count as a clean pass.
If omitted, it defaults to `repeatCount`.

The checked-in fixture owns the prompts and expectations.
Fragment expectations are intentionally runner-level guardrails, not product-owned host log parsing.
They let a skill fixture say which final summary fragments must or must not appear, and which structured command-log fragments must or must not appear when the selected runner can observe commands.
If a backend cannot observe commands, command expectations should be treated as unavailable evidence rather than inferred from prose.
The adapter-owned runner still owns:

- how the local host runtime is actually invoked
- how invocation is observed
- how output files or transcripts are collected
- any host-specific backend choice such as `codex exec`

By default, skill tests should exercise the runtime that the local CLI would actually use.
They should not pin a model unless the adapter command template or a pinned-runtime policy explicitly does so.
When runtime telemetry is available, downstream summaries should preserve enough runtime identity to report model-runtime changes without making ordinary default-runtime changes fail the test.
A pinned-runtime mismatch blocks the workflow because the run did not test the declared runtime.
See [runtime-fingerprint-optimization.md](./runtime-fingerprint-optimization.md).

## Adapter Boundary

The adapter may define:

- `evaluation_input_default`
- `eval_test_command_templates`

Placeholders for the runner template:

- `{candidate_repo}`
- `{output_dir}`
- `{eval_cases_file}` — translated `cautilus.skill_test_cases.v1` packet
- `{eval_observed_file}` — runner writes a `cautilus.skill_evaluation_inputs.v1` packet here
- `{backend}` — resolved from `--runtime` CLI flag, adapter `default_runtime`, or `codex_exec` fallback

For Codex-backed runners, default session mode should stay `ephemeral`, but a command template may opt into persistent mode for bounded probes that intentionally depend on session or fork tool surface.
When that opt-out is used, the emitted telemetry should include `session_mode`.

## Output Boundary

`cautilus eval test` creates one bounded workflow directory containing:

- `eval-cases.json` — translated case suite written by the product
- `eval-observed.json` — observed packet written by the runner
- `eval-summary.json` — `cautilus.skill_evaluation_summary.v1` rolled up by the product
- per-command stdout/stderr artifacts
- any adapter-owned raw runner artifacts
- per-case aggregate artifacts when repeated runs are used

The summary is a product-owned output even when the adapter-owned runner produced the raw observed packet.

## Guardrails

- Do not make `eval test` parse raw host logs directly inside the product.
- Do not require every host to expose provider telemetry before the seam is usable.
- Do not collapse deterministic packaging or bootstrap validation into this workflow.
  Keep those as repo-owned cheap gates.
- Do not force operators to hand-edit `cautilus.skill_evaluation_inputs.v1` when a checked-in fixture plus adapter runner can produce it.
