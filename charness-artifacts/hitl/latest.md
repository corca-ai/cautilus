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
- Product vocabulary should align across user prose, Cautilus JSON packets, bundled-skill guidance, maintainer specs, tests, and helper names whenever the same concept is meant.
- The user-facing index should use named stories rather than visible U-numbering.
  Internal stable IDs may remain hidden or secondary if maintainer mapping still needs them.
- Story order should follow the user's workflow:
  Readiness;
  Claim Discovery;
  Behavior Evaluation;
  Bounded Optimization;
  Host Ownership.
- Reviewable artifacts, evidence visibility, and no-satisfied-without-valid-evidence are cross-cutting acceptance invariants, not separate top-level user jobs.
  Cross-cutting stories should remain visible in the index and should also appear locally inside the main stories where they constrain the workflow.
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
- For `*.spec.md` review, the primary human-readable surface is the generated specdown HTML report.
  Markdown CLI preview is a supplemental line-wrap check, not the acceptance surface.
- Claim Discovery requires smaller HITL chunks than deterministic Readiness because deterministic discovery packets, agent proof-routing judgment, and bundled-skill curation are different acceptance boundaries.
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
- The readiness opening and H2 chunks have been tightened through HITL.
  The story names concrete user choices, the valid-adapter example is generated by `cautilus adapter init --repo-name sample-skill-repo --scenario skill`, and this repo's real `.agents/cautilus-adapter.yaml` is linked as production context rather than excerpted as the teaching example.
- `doctor` now emits a machine-readable `meaning` field for readiness checks, and the specdown adapter uses the general `check:cautilus-json-command` shape instead of a readiness-specific adapter.
  The check supports selector paths such as `checks[id=adapter_found].ok`, expected nonzero JSON exits, and controlled `PATH` simulation for missing `specdown`.
- `doctor` now reports `next_action.kind=install_specdown` when the only incomplete readiness blocker is missing `specdown`.
  This keeps the public claim-spec prerequisite distinct from adapter editing.
- The implementation pass has reshaped all user-facing child pages to the accepted house style.
  They use direct H2 acceptance chunks, executable `run:shell` projections or raw generated files under the relevant chunk, and structured Cautilus artifact checks below the visible output.
  HITL approval still needs to run again from the beginning in small chunks.
- Cross-cutting criteria are linked as [Reviewable Artifacts](../../docs/specs/user/reviewable-artifacts.spec.md) and [Evidence Gaps](../../docs/specs/user/evidence-gaps.spec.md).
  The old public filename `proof-debt.spec.md` has been renamed to `evidence-gaps.spec.md`.
- The old existence-based evidence lint has been removed.
  Specdown and Cautilus artifact-viewer checks now carry the report-visible proof path.
- Design premortem issues acted on before implementation closeout:
  selector-path support was added before relying on `check:cautilus-json-command`;
  blocked readiness cases now verify nonzero JSON output;
  missing `specdown` now has its own next action;
  the generated adapter YAML is shown as a full generated sample;
  standing specdown work remains cheap and projects on-demand eval/optimize artifacts rather than rerunning those loops.
- Post-implementation premortem issues acted on before commit:
  the visible missing-git `run:shell` block and the verifying `check:cautilus-json-command` now target the same generated repo path;
  `npm run lint:specs` has verified the actual `specdown run` integration path for directive params, variable substitution, and the generalized JSON-command adapter.
- HITL follow-up accepted after commit:
  adapter context should be the first Readiness H2 instead of an abrupt opening paragraph;
  ready-check H2 should explain `id`, `ok`, stable `meaning`, and run-specific `detail`;
  `Repo-Owned Adapter` and `Executable Claim-Spec Report` are better H3 labels;
  `specdown_available.detail` should show the resolved executable path when present and searched `PATH` when missing.
- HITL paused on 2026-05-06 to record broader design principles before restarting from the index.
  Durable rule: Cautilus should align user language, product-domain language, CLI JSON fields, bundled-skill guidance, maintainer specs, tests, and helper names whenever they refer to the same concept.
  Durable rule: workflow stories are the main concern decomposition, while cross-cutting stories such as Reviewable Artifacts and Evidence Gaps must stay visible in the index and reappear locally in story proof.
- Readiness is treated as reviewed because its proof is deterministic:
  generated adapter setup, `doctor` ready/blocker states, missing specdown simulation, next bounded action, and bundled-skill orientation all pass through cheap specdown-visible Cautilus checks.
- Claim Discovery should resume in smaller chunks.
  The deterministic boundary packet, the non-verdict contract, the next-work bucket routing, and bundled-skill curation each need separate review because agent judgment enters proof planning and curation.

## Review Queue

1. Claim Discovery: story and discovery boundary.
   Decision: does the opening and first AC show selected repo docs, discovery scope, and nonzero candidate discovery without pretending discovery proves behavior?
2. Claim Discovery: non-verdict boundary.
   Decision: does the claim packet remain visibly a proof plan, not a certificate?
3. Claim Discovery: next-work buckets.
   Decision: does the visible output and artifact proof show human, agent, deterministic, eval-planning, and split/defer routing before fixture work starts?
4. Claim Discovery: bundled-skill curation.
   Decision: does the proof show enough Cautilus run or reviewed skill evidence that curation is not only deterministic packet discovery?
5. Behavior Evaluation story page.
   Decision: does [evaluation.spec.md](../../docs/specs/user/evaluation.spec.md) explain why `eval` exists, name the `dev/repo`, `dev/skill`, `app/chat`, and `app/prompt` surfaces, and project latest evidence artifacts cheaply?
6. Bounded Optimization story page.
   Decision: does [optimization.spec.md](../../docs/specs/user/optimization.spec.md) explain what improves, how intent and protected checks are preserved, and how on-demand proof feeds the spec report?
7. Host Ownership story page.
   Decision: does [ownership.spec.md](../../docs/specs/user/ownership.spec.md) put adapter ownership and host policy at the right level?
8. Reviewable Artifacts cross-cutting story.
   Decision: does [reviewable-artifacts.spec.md](../../docs/specs/user/reviewable-artifacts.spec.md) stay cross-cutting while still carrying local specdown-visible evidence?
9. Evidence Gaps cross-cutting story.
   Decision: does [evidence-gaps.spec.md](../../docs/specs/user/evidence-gaps.spec.md) explain missing or weak evidence without old proof-debt vocabulary?

## Known Risks To Ask About

- The specdown adapter now supports cheap `cautilus-json-command` and `cautilus-json-file` checks, but the exact proof rows are still first-pass selections and should be reviewed story by story.
- On-demand artifact projection still uses dated evidence bundle paths.
  This is honest for now because the report shows selected artifacts, but stronger artifact-role resolution would reduce manual refresh work later.
- Stronger proof may still need better artifact-role resolution instead of hardcoded latest evidence bundle paths.
- Maintainer-facing pages currently refer to U-claim IDs.
  If visible U-numbering leaves the user index, maintainer alignment needs secondary stable anchors or a mapping update.

## Next HITL Chunk

Restart HITL with [docs/specs/index.spec.md](../../docs/specs/index.spec.md), then [docs/specs/user/index.spec.md](../../docs/specs/user/index.spec.md), then the user-facing child pages.
Review from the top in small chunks.
For each spec chunk, show the source text, the generated specdown HTML/report-visible shape, and the actual `specdown run` output for its code fences.
Ask whether each chunk is a user-facing acceptance boundary, whether any rows are missing or too implementation-specific, and whether the visible output is honest enough for a user and an agent.
