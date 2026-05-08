# HITL Review: Cautilus User-Facing Specs
Date: 2026-05-08

## Target

- Current active target: [docs/specs/user/claim-discovery.spec.md](../../docs/specs/user/claim-discovery.spec.md)
- Runtime state: `.charness/hitl/runtime/hitl-20260508-062748/`
- Runtime files remain intentionally uncommitted unless the user explicitly asks otherwise.

## Goal

Use human judgment to make Cautilus user-facing specs read as product acceptance stories, not implementation notes.
The next reviewer should judge whether the rewritten Claim Discovery sections preserve user value, shared vocabulary, command/skill boundaries, and honest evidence status.

## Accepted Rules

- Each user-story spec should expose the pain point in the first sentence.
- The first workflow introduction should name the concrete CLI command plus the `cautilus-agent` skill.
- In user-facing specs, prefer command surfaces such as `claim discover`, `claim show`, or `cautilus claim` over "the binary".
- Use `entry and linked docs` in product-facing language; Markdown may appear only in lower-level technical evidence when needed.
- Discovery creates candidates, not proof.
- If a declared promise is inside the configured entry and linked-doc boundary but no candidate appears, that is a `claim discover` bug.
- If an important behavior appears only outside that boundary, it is a documentation, catalog, or alignment gap for Cautilus Agent or a human to raise.
- Prepared Cautilus eval checks are not executed eval proof.
  Keep prepared, not executed, visible until the user explicitly approves the eval.
- After a user asks HITL to rewrite a chunk, show the changed chunk before advancing.
- After all chunks for a target are reviewed, show the full updated target before closing that target.

## Applied This Session

- Renamed the bundled skill surface to `cautilus-agent`.
- Removed generic Specdown readiness coupling from `doctor`, docs, adapter config, and Cautilus Agent surfaces.
- Harmonized user-facing specs around pain-point openings, command surfaces, `cautilus-agent` naming, candidate-not-proof language, and prepared-not-executed eval boundaries.
- Rewrote the Claim Discovery heuristic section as examples first, implementation evidence last.
- Updated the HITL runtime target/cursor to Claim Discovery.
- Recorded premortem evidence at [charness-artifacts/premortem/hitl-user-spec-closeout.md](../premortem/hitl-user-spec-closeout.md).
- Opened Charness follow-ups:
  [#117](https://github.com/corca-ai/charness/issues/117),
  [#118](https://github.com/corca-ai/charness/issues/118),
  [#119](https://github.com/corca-ai/charness/issues/119),
  [#120](https://github.com/corca-ai/charness/issues/120).

## Current Queue

1. `claim-discover-heuristics-and-dedupe-evidence`
   Target: [docs/specs/user/claim-discovery.spec.md](../../docs/specs/user/claim-discovery.spec.md) lines 62-129.
   Decision: does the rewritten example-first `claim discover` section expose extraction heuristics, evidence-route classification, duplicate handling, and implementation evidence without drifting back to user-facing binary vocabulary?
2. `cautilus-agent-curation-proof`
   Target: lines 131-160.
   Decision: does this show `cautilus-agent` curation behavior while clearly limiting proof to prepared fixture and audit-hook readiness, not executed Cautilus eval?
3. `next-action-groups-and-prepared-eval`
   Target: lines 162-243.
   Decision: do next-action groups and prepared eval explain what happens next without confusing user workflow with maintainer proof?

## Next HITL Step

Present Claim Discovery lines 62-129, including the implementation-evidence block.
Show the source text directly, then ask whether the chunk is acceptable or needs another rewrite.
Do not execute `dogfood:cautilus-claim-discovery-curation-flow:eval:codex` without explicit user approval.

## Verified

- `npm run lint:specs -- docs/specs/user/index.spec.md docs/specs/user/claim-discovery.spec.md docs/specs/user/doctor-readiness.spec.md docs/specs/user/evaluation.spec.md docs/specs/user/optimization.spec.md docs/specs/user/ownership.spec.md docs/specs/user/reviewable-artifacts.spec.md docs/specs/user/evidence-gaps.spec.md`
- `npm run verify`
- `npm run specdown`
- `npm run specdown:pages`
- `npm run hooks:check`
