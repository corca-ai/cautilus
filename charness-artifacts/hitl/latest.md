# HITL Review: Cautilus User-Facing Specs
Date: 2026-05-05

## Target

- [docs/specs/user/index.spec.md](../../docs/specs/user/index.spec.md) and user claim pages

## Goal

Use human judgment to reshape the user-facing claim spec tree so it reads as acceptance criteria for Cautilus's product promises.
The desired final state is that a user or maintainer can read the index and story pages, see the user job, the Cautilus surface, the acceptance criteria, and the current proof or gap without reading raw claim packets first.

## Accepted Rules

- User-facing specs should read like top-level user stories whose acceptance criteria carry local executable proof or an explicit gap.
- Top-level stories should name the user-facing actor, the Cautilus command or bundled-skill surface, and the outcome.
- The user-facing index should use named stories rather than visible U-numbering.
  Internal stable IDs may remain hidden or secondary if maintainer mapping still needs them.
- Story order should follow the user's workflow:
  Readiness;
  Claim Discovery;
  Behavior Evaluation;
  Bounded Optimization;
  Host Ownership.
- Reviewable artifacts, evidence visibility, and no-satisfied-without-valid-evidence are cross-cutting acceptance invariants, not separate top-level user jobs.
- Acceptance criteria and proof should not be separated into distant `Evidence` sections.
  A specdown block or check table directly under the criterion is the report-visible proof.
- Public claim proof should not rely on source guards or simple stdout substring checks except as narrow command-discovery smoke.
  Stronger proof should inspect structured packets, artifact freshness, schema, projections, or focused behavior contracts.
- Standing `specdown run` should stay cheap.
  Expensive Cautilus eval and optimize proof should be produced on demand as explicit artifacts, while the specdown report projects the latest selected artifact's status, provenance, freshness, and gaps.
- Standing `specdown run` may execute cheap deterministic local Cautilus setup contracts such as `adapter init`, `doctor`, `agent status`, command discovery, schema validation, and JSON packet projection.
  It should not execute LLM-backed eval runners, optimize search, review variants, or other materially stateful/expensive behavior loops.
  Those runs should be produced on demand as durable Cautilus artifacts and then projected by the specdown report.
- Public proof should prefer raw command output or raw generated files when the output is understandable enough.
  Avoid curated excerpts unless the full output would materially obscure the acceptance claim; if an excerpt is necessary, prefer improving the binary's output shape first.
- Generated sample workspaces should avoid nondeterministic values in the public report when the binary can accept stable inputs.
  For adapter examples, prefer `cautilus adapter init --repo-name <stable-name>` over wildcarding temporary directory names.
- If a table includes prose labels such as setup conditions, the executable proof should still be anchored in binary vocabulary and raw packet fields such as `status`, `checks[*].id`, `checks[*].ok`, `checks[*].meaning`, `suggestions`, and `next_action`.
  Raw doctor packets should remain available in a collapsible `run:shell` block when a table summarizes them.
- Standalone Cautilus promises claim discovery, proof-routing packets, Cautilus-specific claim-spec curation, bundled-skill workflow, and Cautilus evidence artifact interpretation.
  Specdown owns executable Markdown and reports.
  Charness owns portable spec workflow discipline and optional orchestration when installed.

## Current Decisions

- [docs/specs/user/index.spec.md](../../docs/specs/user/index.spec.md) has been applied to the accepted index direction.
- [docs/specs/user/doctor-readiness.spec.md](../../docs/specs/user/doctor-readiness.spec.md) has been rewritten as the first revised story page.
  It now uses H2 acceptance chunks directly instead of a generic `## Acceptance Criteria` wrapper.
  The page defines a valid Cautilus adapter locally, links deeper adapter ownership to Host Ownership, covers ready and blocked conditions, separates next bounded actions from setup readiness, and explains why `agent status --json` is a skill-orientation packet rather than a duplicate of `doctor`.
- The readiness opening and first H2 chunk have been tightened through HITL.
  `agent status` is no longer in the top story sentence, the story names concrete user choices, and the valid-adapter example is backed by a `run:shell` excerpt from this repo's real `.agents/cautilus-adapter.yaml`.
- `doctor` now emits a machine-readable `meaning` field for readiness checks, and the specdown adapter has a `check:cautilus-readiness` proof shape so the first readiness table is no longer prose-only.
- Follow-up decision: replace the repo-adapter excerpt with the full YAML produced by `cautilus adapter init --repo-name sample-skill-repo --scenario skill`, and link this repo's real `.agents/cautilus-adapter.yaml` only for readers who want the production adapter.
- Follow-up decision: fold `check:cautilus-readiness` back into a more general, public-friendly `check:cautilus-json-command` shape instead of keeping a readiness-specific specdown adapter.
- The remaining user-facing child pages are still in the earlier story / acceptance-criteria / JSON-projection shape and should be updated only after the readiness house style is accepted.
- Cross-cutting criteria remain linked to `reviewable-artifacts.spec.md` and `proof-debt.spec.md`, but those pages now read as acceptance invariants rather than independent numbered product jobs.
- The old existence-based evidence lint has been removed.
  Specdown and Cautilus artifact-viewer checks now carry the report-visible proof path.

## Review Queue

1. Readiness story page.
   Decision: review the rewritten H2 chunks, especially whether the ready condition table, blocked-condition table, next-action table, and bundled-skill orientation table are the right acceptance boundaries.
2. Claim Discovery story page.
   Decision: does [claim-discovery.spec.md](../../docs/specs/user/claim-discovery.spec.md) promise discovery from selected repo docs, proof-planning packets, and bundled-skill curation without pretending discovery proves behavior?
3. Behavior Evaluation story page.
   Decision: does [evaluation.spec.md](../../docs/specs/user/evaluation.spec.md) explain why `eval` exists, name the `dev/repo`, `dev/skill`, `app/chat`, and `app/prompt` surfaces, and project latest evidence artifacts cheaply?
4. Bounded Optimization story page.
   Decision: does [optimization.spec.md](../../docs/specs/user/optimization.spec.md) explain what improves, how intent and protected checks are preserved, and how on-demand proof feeds the spec report?
5. Host Ownership story page and cross-cutting invariants.
   Decision: do [ownership.spec.md](../../docs/specs/user/ownership.spec.md), [reviewable-artifacts.spec.md](../../docs/specs/user/reviewable-artifacts.spec.md), and [proof-debt.spec.md](../../docs/specs/user/proof-debt.spec.md) put adapter ownership, reopenable artifacts, and evidence gaps at the right level?

## Known Risks To Ask About

- The specdown adapter now supports cheap `cautilus-json-command` and `cautilus-json-file` checks, but the exact proof rows are still first-pass selections and should be reviewed story by story.
- The rewritten readiness page intentionally shows the target public proof shape without wiring a new `check:cautilus-readiness` or `run:cautilus-cli` adapter yet.
  Update: the first readiness chunk now uses `check:cautilus-readiness`.
  Later chunks still need equivalent domain proof shapes for blocked cases, next-action mapping, and bundled-skill orientation.
- `specdown`-missing readiness can be simulated honestly by running a compiled Cautilus binary with a `PATH` that excludes `specdown`.
  Current observation: `specdown_available=false` is reported correctly, but `next_action.kind` currently falls back to `edit_adapter`, which is misleading for an environment prerequisite and should be fixed before finalizing the blocked-case table.
- Stronger proof may still need better artifact-role resolution instead of hardcoded latest evidence bundle paths.
- Maintainer-facing pages currently refer to U-claim IDs.
  If visible U-numbering leaves the user index, maintainer alignment needs secondary stable anchors or a mapping update.

## Next HITL Chunk

Start HITL with [docs/specs/user/doctor-readiness.spec.md](../../docs/specs/user/doctor-readiness.spec.md).
Review the four H2 chunks:
ready conditions;
blocked conditions;
state-to-next-action mapping;
bundled-skill orientation from `agent status --json`.
Ask whether each chunk is a user-facing acceptance boundary, whether any rows are missing or too implementation-specific, and which proof rows should become executable once the readiness adapter exists.
