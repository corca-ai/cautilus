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
- Standalone Cautilus promises claim discovery, proof-routing packets, Cautilus-specific claim-spec curation, bundled-skill workflow, and Cautilus evidence artifact interpretation.
  Specdown owns executable Markdown and reports.
  Charness owns portable spec workflow discipline and optional orchestration when installed.

## Current Decisions

- [docs/specs/user/index.spec.md](../../docs/specs/user/index.spec.md) has been applied to the accepted index direction.
- The user-facing child pages have been pre-shaped into the accepted story / acceptance-criteria format so later HITL can review story content rather than first fighting old section structure.
- Cross-cutting criteria remain linked to `reviewable-artifacts.spec.md` and `proof-debt.spec.md`, but those pages now read as acceptance invariants rather than independent numbered product jobs.
- The old existence-based evidence lint has been removed.
  Specdown and Cautilus artifact-viewer checks now carry the report-visible proof path.

## Review Queue

1. Readiness story page.
   Decision: are the selected readiness acceptance criteria the right ones, and is the current cheap JSON projection enough proof for this story?
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
- Stronger proof may still need better artifact-role resolution instead of hardcoded latest evidence bundle paths.
- Maintainer-facing pages currently refer to U-claim IDs.
  If visible U-numbering leaves the user index, maintainer alignment needs secondary stable anchors or a mapping update.

## Next HITL Chunk

Start HITL with [docs/specs/user/doctor-readiness.spec.md](../../docs/specs/user/doctor-readiness.spec.md).
Review the story wording, the three acceptance criteria, and whether the current JSON projection checks prove the right boundary without overclaiming.
