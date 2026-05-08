# HITL Scratchpad: hitl-20260505-010438

- Updated: 2026-05-05T01:04:38+00:00
- Target: docs/specs/user/index.spec.md and docs/specs/user/*.spec.md
- Base Ref:
- Scope: user-facing-claim-specs
- Apply Mode: explicit-after-all-chunks

## Agreements

- User-facing specs should read like top-level user stories whose subclaims are acceptance criteria.
- Each acceptance criterion should carry evidence or an explicit evidence gap.
- U-claim wording should avoid making the repo the primary actor when the user or system responsibility is clearer.
- U-claim wording should include the relevant command or skill surface, such as `claim`, `eval`, `optimize`, `doctor`, or the bundled skill, when that helps the story become inspectable.
- User-facing index direction accepted:
  use named user stories rather than visible U-numbering;
  order by user workflow;
  keep top-level stories to user job, product surface, and outcome;
  put detailed proof conditions under per-story acceptance criteria.
- Accepted user-story order:
  Readiness;
  Claim Discovery;
  Behavior Evaluation;
  Bounded Optimization;
  Host Ownership.
- Cross-cutting criteria are not separate top-level user jobs:
  reopenable artifacts, evidence visibility, and no-satisfied-without-valid-evidence should be acceptance invariants attached to the relevant story/spec surface.
- Standalone Cautilus promise accepted:
  Cautilus discovers declared behavior promises from selected repo truth surfaces, emits a proof-planning packet, helps curate user-facing and maintainer-facing claim specs through the bundled skill, and relies on specdown to render the executable report over curated claims and latest evidence artifacts.
- Product boundary accepted:
  Cautilus owns claim discovery, proof-routing packets, Cautilus-specific claim-spec curation, bundled-skill workflow, and Cautilus evidence artifact interpretation;
  specdown owns executable Markdown/report mechanics;
  Charness owns portable spec workflow discipline and optional orchestration when installed.
- Claim Discovery story and boundary accepted:
  `claim discover` starts from configured entry documents and linked Markdown, records `entry-docs-and-linked-markdown` with `README.md`, `AGENTS.md`, and `CLAUDE.md`, preserves provenance and schema in `.cautilus/claims/status-summary.json`, and shows at least one candidate without presenting discovery as proof.
- User-value story boundary accepted:
  proof-plan, packet, adapter, and gap language can remain as evidence or acceptance invariants, but user-facing `##` headings should name what the user can decide, avoid, reopen, or accomplish.
  The Claim Discovery non-verdict proof moved under the discovery story instead of standing as its own story.
- HITL closed before accepting Claim Discovery next-work buckets:
  the next review changed scope from chunk acceptance to a Claim Discovery rewrite.
  The rewrite must show extraction heuristics from entry docs, deterministic de-duplication, binary routing, and a separate dev/skill dogfood path where the bundled Cautilus skill runs discovery and curates the result.

## Open Questions

- Current review is scoped to the user-facing claim spec tree, not the README-first chunk recorded by the previous HITL artifact.
- Decide whether U-claims should consistently use `As a user...` language, system-responsibility language, or a compact hybrid such as `Using <surface>, a user can...`.
- U3 needs a sharper reason for `eval`: what behavior intent it evaluates and why deterministic tests alone are not enough.
- U4 needs a sharper reason for `optimize`: what improves, why the user would run it, and how bounded proof prevents open-ended retry.
- Reconsider whether readiness/doctor should move earlier as U1 because users may need to know whether the selected Cautilus surface can run before claim/eval/optimize.
- Reassess whether reviewable artifacts and evidence gaps belong as top-level user stories or as cross-cutting acceptance criteria under the workflow stories.
- User stories for `eval` and `optimize` should mention the bundled Cautilus skill as the sequencing and decision-boundary helper, not only the binary command.
- `cautilus eval test --help` exposes four first-class presets: `dev/repo`, `dev/skill`, `app/chat`, and `app/prompt`; the user-facing eval story probably should name those categories without overexplaining runner internals.
- `cautilus optimize --help` describes optimize as a bounded improvement front door after claim and eval proof are explicit; docs/contracts/runtime-fingerprint-optimization.md says behavior and guardrails come before shorter target, lower cost, and latency preferences.
- Consider removing visible U-numbering from the user-facing index, or making IDs secondary anchors only, because the order matters more than readers memorizing U1/U2 labels.
- Cross-cutting criteria may not need full separate pages if they are acceptance invariants for every workflow, but each invariant still needs evidence or an explicit evidence gap somewhere inspectable.
- Cross-cutting evidence should be visible in the specdown report through adapter-backed checks, not only as prose links.
- The current specdown adapter exposes `check:cautilus-command`, so command-surface evidence can be shown directly in check tables; deeper evidence may need either links to existing tests or a stronger adapter check later.
- AC and Evidence should not be split into distant sections; each acceptance criterion should carry its own evidence or explicit evidence gap directly below it.
- Current `stdout_includes` style `check:cautilus-command` rows are too source-guard-like for user-facing claim proof; they can prove command discovery smoke but should not be treated as real acceptance evidence for behavior promises.
- Stronger user-facing spec evidence should come from adapter checks that inspect structured packets, validate schemas, verify artifact projection, or run focused contract probes.
- User clarified that `Evidence:` labels are also unnecessary; in specdown, the executable block or check table directly under the AC is the visible evidence in the report.
- Neighbor repo `craken` uses AC/rationale prose followed immediately by `run:*` blocks or domain check tables, and its adapters expose domain checks such as `host-path`, `host-ownership`, and browser/editor operations rather than generic source guards.
- Do not blindly create one new Cautilus adapter check per AC; prefer good executable acceptance tests and domain adapters at the right boundary, reusing existing tests where they already prove the contract honestly.
- Cautilus-specific spec generation/curation guidance belongs in the bundled `skills/cautilus-agent/SKILL.md`; portable executable-contract guidance belongs in `charness:spec`; specdown-specific syntax/report mechanics belong in the specdown skill/docs.
- Standing `specdown run` should stay cheap and should not run Cautilus eval/optimize workflows directly.
- Expensive Cautilus proof should be produced on demand as explicit run artifacts; specdown should read and validate the latest selected artifact so the report shows evidence status, provenance, freshness, and gaps.
- Charness `spec` can own more of the portable pattern: AC-local executable proof, on-demand evidence projection, freshness/provenance, and no public source-guard proof.
- Cautilus-specific adapters/skills should own the concrete command families, artifact schemas, and interpretation of Cautilus run packets.
- Open portability question: Charness-installed users can consume Cautilus as a support binary/skill, but standalone Cautilus users still need Cautilus binary + bundled skill, with specdown, to turn claim discovery into a curated user/maintainer-facing spec report.
- Current likely boundary: Cautilus promises claim discovery and claim-spec curation for Cautilus-managed behavior evaluation; Charness promises portable spec workflow guidance and can use Cautilus as an optional validation/evidence support capability.
- Avoid making Cautilus own every spec-writing concern; it should own the claim-to-proof workflow and generated/curated Cautilus claim-spec surfaces, while leaving generic executable-spec style to specdown/charness:spec.
- Review other user-facing specs with the same user-value-story boundary before accepting remaining chunks.
- Resume HITL only after the Claim Discovery rewrite is prepared and before running the direct Cautilus eval.
