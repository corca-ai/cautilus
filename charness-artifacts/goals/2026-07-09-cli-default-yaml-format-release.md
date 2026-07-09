# Achieve Goal: CLI default YAML format release

Status: active
Created: 2026-07-09
Activation: `/goal @charness-artifacts/goals/2026-07-09-cli-default-yaml-format-release.md`

This file is the living goal scratchpad.
It is active because the user explicitly requested design, implementation, push, and release for the CLI output-format change.

## Active Operating Frame

- Current slice: Prepare and publish the CLI stdout format release.
- Current slice intent: Commit the verified YAML-default stdout contract, then prepare and publish `v0.19.0`.
- Next action: commit implementation and proof artifacts, run release preparation, update release narrative, dry-run publish, then publish and verify public release.
- Verification cadence: cheap deterministic checks at commit boundaries;
  higher-cost or fresh-eye proof at slice boundaries; final broad/live proof at
  closeout.
- Gate cadence: pre-lock slices use `run_slice_closeout.py --skip-broad-pytest`;
  final/bundle proof records the verification lock and uses `--verification-lock`.
- Slice review packet: before fresh-eye slice critique, provide intent, changed
  files and owning/generated surfaces, expected invariants, tests/proof,
  non-claims, out-of-scope lines, and reviewer questions.
- History boundary: keep this frame current; move completed detail to
  `## Slice Log`, `## Operator Decision Queue`, `## Final Verification`,
  and `## Auto-Retro`.

## Goal

Design, implement, verify, push, and release the Cautilus CLI output-format change.
Structured stdout should default to YAML for agent readability.
JSON must remain available through `--format json` and compatible `--json` aliases where they already exist.
Durable packet files and `--output` paths must remain JSON unless a command explicitly documents a different file format.

## Non-Goals

- Do not convert JSON packet files, active-run artifacts, schemas, fixtures, or `--output <*.json>` artifacts to YAML.
- Do not remove the `--json` compatibility alias in this slice.
- Do not convert help text, command help, non-verbose `version`, or default `init run` shell-export stdout into YAML.
- Do not redesign interactive/live-run command templates beyond making their documented stdout/file boundaries honest.

## Boundaries

- External side-effect scope: name which phase or bundle any approved
  publish / push / remote-CI / apply applies to. That approval is phase-scoped
  and does not carry forward — after an approved publish/CI/apply lane
  completes, done-early test-only quality continuation is local by default
  (batch remote proof, run CI once over the final bundled state). Per-slice
  remote publication is assumed only when the operator explicitly asks or a
  runtime-affecting slice requires earlier publication.
- User explicitly requested push and release after implementation, so repo-owned release publication is in scope after local proof and release critique.
- `init run` keeps the documented shell-export default because `eval "$(cautilus init run ...)"` is an operator contract.
- `--format` applies to stdout presentation only; generated packet files remain JSON.

## User Acceptance

The user can run `cautilus doctor binary` and see YAML.
The user can run `cautilus doctor binary --format json` and parse JSON.
The user can run `cautilus init run --label demo` and still receive a shell export.
The user can inspect the published release and install readback for the released version.

## Agent Verification Plan

### Low-Cost Checks

- `go test ./internal/app ./internal/cli`
- `./bin/cautilus doctor binary`
- `./bin/cautilus doctor binary --format json`
- `./bin/cautilus init run --label <label>`
- `./bin/cautilus init run --label <label> --format yaml`
- `npm run lint:skill-disclosure`

### High-Confidence Checks

- `npm run verify`
- `npm run hooks:check`
- `npm run generated:drift:check`
- release planner and release publisher dry-run

### External Or Live Proof

- `npm run release:publish -- --version <target> --json`
- GitHub release workflow success
- `node ./scripts/release/verify-public-release.mjs --version <tag> --json`
- `npm run release:smoke-install:current -- --skip-update --json`

## Slice Plan

| Slice | Objective | Why Now | Expected Evidence | Status |
| --- | --- | --- | --- | --- |
| 1 | Lock CLI output-format contract | Prevent parser/file contract regressions | contract doc, subagent review findings, focused smoke | complete |
| 2 | Implement stdout YAML default and format override | Deliver requested behavior | code/tests, docs/spec sync, agent guidance sync | complete |
| 3 | Run quality and release readiness | Prove broad surface after command contract change | verify, hooks, quality probe, release critique | complete |
| 4 | Publish minor release | User requested push release | tag, workflow, public verifier, install readback | pending |

## Operator Decision Queue

none — the user explicitly approved the design direction and requested implementation, push, and release.

## Coordination Cues

Phase-appropriate routing for this run, deferred to `find-skills` (its
`--recommend-for-task` / `--recommendation-role --next-skill-id` recommendation
engine) — never a hard-coded phase-to-skill list here. `achieve` owns this slot
and the floors below; `find-skills` owns *which* skill answers a boundary. Fill
during the run:

- **Routing** — ask `find-skills` to recommend the skill for the current phase or
  boundary, and record the route it returns. At completion, recorded
  implementation / debug / quality / issue work needs this `Routing:` evidence
  or a `Routing: n/a — <reason>` opt-out.
- **Gather step** — when `## Context Sources` names an external source
  (URL / Slack / Notion / Docs / Drive), add a `Gather:` line here pointing at the
  gathered asset, or write `Gather: n/a — <reason>` when no external context
  applies.
- **Release step** — when this run touches a release surface (a version bump or
  install-manifest edit), add a `Release:` line here pointing at the release
  proof, or write `Release: n/a — <reason>`.
- **Issue closeout step** — when this goal resolves tracked GitHub issues, add
  an `Issue closeout:` line naming the close-intended issue numbers, carrier
  (`direct-commit`, PR body, release commit, or manual fallback), and
  `issue_tool.py validate-closeout-draft` / `verify-closeout` proof. If a
  tracked issue appears in `## Context Sources` as context only, use
  `Issue closeout: n/a — <reason>`.

Routing step line — record it on ONE physical line so the floor reads the whole
value (a soft-wrapped value is tolerated now, but one line is clearest). Copy the
form below and replace `<skill>` with the find-skills-recommended skill; the
placeholder is intentionally non-satisfying (the Gather / Release / Issue
closeout floors are presence-only, so no stub is seeded for them — add their line
per the bullets above when that boundary is crossed):

- `Routing: find-skills -> <skill> — <why this phase needs it>`
- Routing: find-skills -> achieve + spec + impl + quality + critique + release — this work changes a CLI contract, implementation, agent guidance, verification surface, and release state.
- Gather: n/a — no external source was used for this repo-local contract and release slice.
- Release: pending — release proof will be recorded after `v0.19.0` publication and public verification.
- Issue closeout: n/a — this slice does not resolve a tracked GitHub issue.

## Discuss Before Activation

A Before-phase summary of any consequential activation decision — surfaced from
the Non-Goals / Boundaries / Verification / Interview / Critique sections — that
must be resolved before `/goal`. Required only when a trigger fires (live/prod
proof, issue close/split, broad scope, irreversible side effect, or a
proof-level non-claim); replace the `fill` line below, or delete it when none
applies.

- Discuss before activation: resolved — the user confirmed `--format`, stated JSON is better for parsing and YAML is better for stdout, and explicitly requested implementation through push and release.

## Slice Log

### Slice 1: Implement default YAML stdout contract

- Objective: Change structured stdout to YAML by default while preserving JSON parser paths and JSON packet files.
- Why this approach: `--format` as stdout-only presentation keeps `--output` artifacts stable while making default CLI output easier for agents to inspect.
- Commits: pending release implementation commit.
- What changed: added `docs/contracts/cli-output-format.md`; made structured stdout default YAML; added global `--format yaml|json`; kept `--json` as a JSON stdout alias; preserved JSON `--output` packet files; preserved `init run` shell-export default; updated internal parser paths to request `--format json`; synced docs/specs/Cautilus Agent guidance.
- Alternatives rejected: converting packet files to YAML would break durable JSON schemas and existing parsers; removing `--json` would break current Cautilus Agent and scripts.
- Targeted verification: `go test ./internal/app ./internal/cli ./internal/runtime`; Node release and agent-runtime parser tests; strict JSON alias smokes for claim status, claim eval plan, and claim validate.
- Test duplication pressure: focused CLI contract tests cover default YAML, explicit JSON, and `init run` shell-default exception.
- Critique: subagent read-only review identified compatibility risks around file outputs, `init run`, path-only stdout commands, and JSON parser commands; these were folded into the contract. Release-critical subagent review then found a real `--json` parser leak and interactive wrapper risk; both were fixed before release.
- Off-goal findings: none yet.
- Lessons carried forward: stdout presentation and packet file format must stay separate.
- Metrics:

### Slice 2: Quality and release readiness

- Objective: Prove the CLI output-format contract after implementation.
- Why this approach: the change crosses code, docs, executable specs, generated claim state, and the packaged Cautilus Agent surface.
- Commits: pending release implementation commit.
- What changed: added release critique proof at `charness-artifacts/critique/2026-07-09-v0-19-0-cli-format-release-critique.md`; added debug proof at `charness-artifacts/debug/debug-2026-07-09-cli-json-alias-parser-leak.md`; refreshed claim artifacts after claim source changes.
- Alternatives rejected: publishing after the first green verify was rejected because fresh-eye release critique found a blocking compatibility gap.
- Targeted verification: `go test ./internal/app`; strict JSON alias smokes for `discover claims status --json`, `evaluate claims plan --json`, and `discover claims validate --json`; `python3 .../validate_debug_artifact.py --repo-root .`.
- Broad verification: `npm run verify` passed all phases in 49.31s after the release-critique fixes; `npm run hooks:check` passed; requested review commands passed.
- Test duplication pressure: app-level alias tests now cover every registry-advertised parser path that the subagent found missing.
- Critique: Faraday subagent verdict was `BLOCK` until the `--json` parser leak was fixed; disposition is recorded in the release critique artifact.
- Off-goal findings: none.
- Lessons carried forward: registry-advertised compatibility aliases need strict parser tests, not YAML-or-JSON decoders.
- Metrics:

## Context Sources

Durable references this goal was shaped from. A fresh session can reconstruct
the originating context by following them in order.

- User request: "`--format`에 동의. 설계해서 구현 완료 후 푸시 릴리즈까지 쭉 하길."
- User decision: "파싱할 때는 json 이 유리하고, stdout 으로는 yml 이 유리하다고 생각함"
- `AGENTS.md`
- `README.md`
- `docs/master-plan.md`
- `CLAUDE.md`
- `docs/internal/handoff.md`
- `docs/contracts/cli-output-format.md`
- Subagent design review: `Descartes` read-only compatibility review in this session.

## Interview Decisions

For each Before-phase question: family of options considered, chosen value, and
rejected-alternatives reason. Applies the anti-anchoring lesson to the artifact
itself so a fresh session sees the design space, not only the closed point.

- Format family: JSON default vs YAML default vs text default with opt-in structured output.
Chosen: YAML default for structured stdout, because Cautilus is agent-first and YAML is more readable/token-efficient for stdout inspection.
Rejected alternatives: JSON default preserves parser convenience but keeps agent-facing stdout noisy; text default would regress structured predictability.
- Parser family: remove `--json` vs keep `--json` vs add `--format` only.
Chosen: add `--format yaml|json` and keep `--json` as compatibility alias where already accepted.
Rejected alternatives: removing `--json` would break existing scripts; adding only `--format` without alias would force needless migration.
- File-format family: stdout and files share format vs stdout-only format.
Chosen: stdout-only `--format`; `--output` and packet files remain JSON.
Rejected alternatives: tying file format to stdout presentation would break source-of-truth packet schemas.
- Exception family: convert every command vs preserve documented shell/human outputs.
Chosen: preserve help, non-verbose `version`, and default `init run` shell export.
Rejected alternatives: converting `init run` default would break the documented `eval "$(cautilus init run ...)"` operator flow.

## Plan Critique Findings

Blockers folded into Boundaries/Verification/Slice Plan, over-worry raised but
not folded, and reviewer provenance. Preserves reasoning so a fresh session
re-verifies the folded revisions without re-running critique.

- Subagent finding: keep `--output` and active-run files JSON even when stdout defaults to YAML.
Folded into `docs/contracts/cli-output-format.md` and `writeOutputResolved`.
- Subagent finding: keep `init run` default shell stdout.
Folded into the `handleWorkspaceStart` exception and tests.
- Subagent finding: JSON parser commands should use `--format json`.
Folded into docs/specs/agent guidance and quality/release probe commands.

## Off-Goal Findings

Issues or deferred findings discovered during the run.

## Final Verification

Closeout evidence — replace each `TODO` with a bound `<path>` (a checked-in
retro / host-log probe / disposition-review artifact) or an explicit
`skipped: <allowed-reason>: <detail>`. The complete gate rejects a literal
`TODO` / `<path>` / `TBD` until you do.

Retro: TODO — create or explicitly skip with an allowed reason before complete
Host log probe: TODO — create or explicitly skip with an allowed reason before complete
Disposition review: TODO — create or explicitly skip only when policy allows before complete

## User Verification Instructions

## Auto-Retro

Retro dispositions: TODO — disposition every surfaced improvement, or record the explicit no-improvement opt-out
Structural follow-up: TODO — when the retro names a transferable waste item (a `## Sibling Search` trigger), classify its structural destination (`applied: <gate/hook/validator/test/contract change>` / `issue #N (recurs:|novel: <reason>)` / `repo-local guard: <path>` / `none — <reason>`); delete this line when no transferable waste was named
