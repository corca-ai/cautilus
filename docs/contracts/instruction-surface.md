# Instruction Surface Contract

`Cautilus` should support a first-class `instruction-surface` workflow for the operator request:

`Use Cautilus to test whether this repo instruction surface actually changes agent routing behavior.`

This surface is intentionally separate from `skill test` and `skill evaluate`.
It judges whether repository instruction files steer entry-file selection, progressive disclosure, scoped overrides, and first routing behavior honestly.
For coding-agent evaluation, root repository instructions are the entry surface.
Nested instruction files refine scoped tasks after the root policy is considered; they do not replace the root instruction surface as the entry point.

Use `cautilus.instruction_surface_cases.v1` for the checked-in case suite, `cautilus.instruction_surface_inputs.v1` for the observed packet, and `cautilus.instruction_surface_summary.v1` for the summary packet.

## Problem

Hosts can already validate scripts, fixtures, and deterministic outputs cheaply.
What stays awkward is proving whether an instruction-only change actually changes the agent's first routing move.

The first product-owned slice should be:

`checked-in instruction-surface cases -> cautilus instruction-surface test -> observed instruction-surface input -> cautilus instruction-surface evaluate -> instruction-surface summary`

This keeps raw runtime ownership in the adapter or checked-in runner while letting `Cautilus` own the case shape, provenance boundary, route scoring, and surface-comparison summary.

## Input Boundary

`cautilus instruction-surface test` should consume a checked-in case suite with schema `cautilus.instruction_surface_cases.v1`.

Minimum shape:

- `suiteId`
- optional `suiteDisplayName`
- `evaluations`
  - `evaluationId`
  - optional `displayName`
  - `prompt`
  - optional `taskPath`
  - optional `instructionSurface`
    - optional `surfaceLabel`
    - `files`
      - `path`
      - optional `kind`
        - `file`
        - `symlink`
      - file-only exactly one of `content` or `sourceFile`
      - symlink-only `targetPath`
  - optional `expectedEntryFile`
  - optional `requiredInstructionFiles`
  - optional `forbiddenInstructionFiles`
  - optional `requiredSupportingFiles`
  - optional `forbiddenSupportingFiles`
- optional `expectedRouting`
    - optional `selectedSkill`
    - optional `bootstrapHelper`
    - optional `workSkill`
    - optional `selectedSupport`
    - optional `firstToolCallPattern`

The checked-in case suite owns prompts, instruction-surface variants, and route/file expectations.
The runner still owns how the host runtime is invoked and how observed routing evidence is collected.

## Adapter Boundary

The adapter may define:

- `instruction_surface_cases_default`
- `instruction_surface_test_command_templates`

Current placeholder additions for that seam:

- `{instruction_surface_cases_file}`
- `{instruction_surface_input_file}`
- `{backend}`

Existing placeholders such as `{candidate_repo}` and `{output_dir}` remain available.
This lets a checked-in runner materialize temporary instruction-surface variants into a disposable workspace and emit raw artifacts beside the generated observed packet.

## Output Boundary

`cautilus instruction-surface test` should create one bounded workflow directory containing:

- `instruction-surface-input.json`
- `instruction-surface-summary.json`
- per-command stdout/stderr artifacts
- per-evaluation prompt/schema/result artifacts
- bounded instruction-surface provenance artifacts

The observed packet should preserve at least:

- which instruction surface was used
- the entry file the agent claims it started from
- the instruction files the agent claims it read
- the supporting files the agent claims it read
- the first routing decision
  - optional `bootstrapHelper` for discovery/bootstrap helpers such as `find-skills`
  - optional `workSkill` for the eventual durable work skill such as `impl`
  - optional legacy `selectedSkill` single-lane alias when the bootstrap/work split is not meaningful
- any expectation fields copied from the checked-in case
- optional runtime telemetry such as model, token totals, and `session_mode` when the adapter-owned runner exposes those fields explicitly

The summary should expose:

- recommendation
  - `accept-now`
  - `defer`
  - `reject`
- evaluation counts by status
- entry-file and file-boundary mismatch counts
- routing match / mismatch counts
- selected-skill alias counts
- bootstrap-helper counts
- work-skill counts
- grouped variant summaries for route comparison

## Current Recommendation Rules

- any failed expectation -> `reject`
- otherwise any blocked observation -> `defer`
- otherwise -> `accept-now`

This stays narrow on purpose.
The summary is about instruction-surface fidelity, not whole-task success.

## Premortem

The first slice fails if any of these happen:

1. it becomes a broad prose-quality review of markdown instead of a routing-fidelity surface
2. it hardcodes `AGENTS.md` as the only meaningful filename and misses `CLAUDE.md`, symlinks, nested overrides, or linked docs
3. it scores static file presence instead of the agent's actual first routing move
4. it reads the whole repo and destroys the bounded evidence story

The implementation should keep the case schema, observed packet, and summary narrow enough to make those failure modes obvious.

## Guardrails

- Do not bury instruction-surface scoring inside `skill evaluate`.
- Do not let this seam silently become a generic repository handbook review.
- Do not make whole-repo slurping the default evidence path.
- Do not treat nested overrides as repo-wide policy in the summary.
- Do not require one canonical filename when the effective instruction surface may start from `AGENTS.md`, `CLAUDE.md`, or a symlinked pair.
