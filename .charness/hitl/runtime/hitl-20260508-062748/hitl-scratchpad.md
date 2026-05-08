# HITL Scratchpad: hitl-20260508-062748

- Updated: 2026-05-08T06:27:48+00:00
- Target: docs/specs/user/doctor-readiness.spec.md
- Base Ref: main
- Scope: readiness-spec-after-cautilus-agent-rename
- Apply Mode: explicit-after-all-chunks

## Agreements

- Review starts after commit `2b3ea32 Rename bundled skill to Cautilus Agent`.
- This HITL is for spec-document judgment, not approval to execute the prepared Cautilus eval.
- Do not edit the target during chunk review; collect feedback first.
- Review criteria: user value, shared product vocabulary, binary versus Cautilus Agent responsibility, high-recall binary discovery with accepted false positives, in-scope missed declaration as a `claim discover` bug, out-of-scope missing behavior as narrative/catalog/alignment work, and honest prepared-but-not-executed eval evidence.
- Opening should introduce the concrete surfaces as the `cautilus claim` CLI command and the `cautilus-agent` skill, while later prose may use Cautilus Agent as the readable product name.
- Use `entry and linked docs` in the opening instead of emphasizing Markdown; Markdown can remain in lower-level evidence sections only when it is technically necessary.
- Each user-story spec should expose the pain point in the first sentence.
- Each user-story spec should mention the concrete CLI command plus the `cautilus-agent` skill the first time it introduces the workflow, even when the CLI command is normally run by the agent rather than the user directly.
- After the user asks HITL to rewrite or change the current chunk, show the changed chunk text back to the user before advancing the cursor.
- In user-facing specs, prefer concrete command surfaces such as `claim discover` or `cautilus claim` over "the binary"; reserve binary wording for maintainer-facing boundary discussion or cases where the standalone executable itself is the point.

## Open Questions

- After Claim Discovery review, revisit the Readiness story opening with the same surface-naming pattern.
- Is `specdown_available=false` still supposed to block generic `cautilus doctor` readiness, or should it become a docs/report-specific readiness branch or warning?

## Applied Changes

- `docs/specs/user/claim-discovery.spec.md`: changed the opening surface sentence to `Using the cautilus claim CLI command and the cautilus-agent skill...`.
- `docs/specs/user/claim-discovery.spec.md`: changed Pass 1 from `entry docs and linked Markdown` to `entry and linked docs`.
- `npm run lint:specs -- docs/specs/user/claim-discovery.spec.md` passed after the edit.
- `docs/specs/user/doctor-readiness.spec.md`: changed the opening to start from setup-spend risk and introduce `cautilus doctor` CLI command plus `cautilus-agent` skill.
- Removed generic specdown readiness coupling from `doctor` code, user specs, maintainer readiness spec, README, adapter config, Cautilus Agent skill surfaces, and claim-discovery heuristic examples.
- Removed the remaining `specdown_available` / `install_specdown` test-only references after the user asked that even the negative regression assertions go away.
- `npm run specdown`, `npm run specdown:pages`, `npm run verify`, and `npm run hooks:check` passed after the specdown-coupling removal.
- Committed `b14707a Remove specdown from doctor readiness` and `0d04dfc Drop retired specdown regression assertions`.
- `docs/specs/user/doctor-readiness.spec.md`: rewrote the agent-status branch prose so it starts from the user value of a safe next branch before agent workflow budget is spent.
- `npm run lint:specs -- docs/specs/user/doctor-readiness.spec.md` passed after the agent-status branch rewrite.
- `docs/specs/user/claim-discovery.spec.md`: rewrote source-boundary prose to avoid leading with internal JSON/engine structure and reframed the example around saved packet, selected entries, linked docs, outside boundary, and candidate-not-proof status.
- `npm run lint:specs -- docs/specs/user/claim-discovery.spec.md` passed after the source-boundary rewrite.
- `docs/specs/user/claim-discovery.spec.md`: rewrote the binary heuristic section into example-first H3 signals: readable docs not fenced examples, promise words to next evidence route, duplicate source sentences to one candidate, then implementation evidence.
- `npm run lint:specs -- docs/specs/user/claim-discovery.spec.md` passed after the heuristic section rewrite.
- Premortem reviewers found remaining drift in user-facing specs: `binary` wording in Claim Discovery, `linked Markdown` in the workflow table, missing `cautilus-agent` skill naming in Evaluation and Optimization, missing pain-point openings, prepared eval wording that could sound executed, and stale HITL target/chunk bounds.
- Applied the premortem fixes across `docs/specs/user/*.spec.md`: command-surface vocabulary, pain-point openings, `cautilus-agent` skill naming, candidate-not-proof wording, prepared-not-executed curation language, and Claim Discovery chunk-bound resync.
- Updated Charness issue https://github.com/corca-ai/charness/issues/119 so active HITL pre-edit constraints also include target/cursor/chunk-bound validation.
- `npm run lint:specs -- docs/specs/user/index.spec.md docs/specs/user/claim-discovery.spec.md docs/specs/user/doctor-readiness.spec.md docs/specs/user/evaluation.spec.md docs/specs/user/optimization.spec.md docs/specs/user/ownership.spec.md docs/specs/user/reviewable-artifacts.spec.md docs/specs/user/evidence-gaps.spec.md` passed after the full user-spec harmonization.

## Current Review

- Switched to `docs/specs/user/doctor-readiness.spec.md` at the user's request.
- Larger chunks are allowed for this pass.

## Accepted Chunks

- `readiness-opening-adapter-and-checks`: accepted after adding pain-point first sentence and concrete `cautilus doctor` CLI command plus `cautilus-agent` skill wording.
- `readiness-blockers-and-next-action`: applied after removing strong specdown coupling and keeping blocker prose focused on actual setup states: missing git repo, no commits, missing adapter, invalid adapter, incomplete adapter, and runner readiness.
- `readiness-agent-status-branching`: accepted after rewrite because it now starts from the user value of a safe next branch before agent workflow budget is spent, then distinguishes human-facing `doctor` readiness from the Cautilus Agent orientation packet.
- `source-boundary-and-candidate-status`: applied after rewrite because it now starts from the user question of which docs were scanned, avoids leading with JSON/engine structure, and distinguishes in-scope discovery misses, out-of-boundary documentation/catalog/alignment gaps, and candidate-not-proof status.

## Feedback

- For `readiness-blockers-and-next-action`, user supports making the section more user-oriented.
- User flagged that strong Specdown coupling was supposed to be removed, yet the readiness spec still treats missing specdown as a blocker.
- Local scan shows this is not only stale prose: `appendSpecdownCheck`, `doctor_next_action`, app tests, the user spec index, Cautilus Agent instructions, and maintainer readiness spec still treat specdown as a public claim-spec report prerequisite.
- Follow-up scan now shows zero `specdown_available` / `install_specdown` references across README, docs, skills, plugins, `.agents`, internal code, scripts, examples, fixtures, package metadata, and `specdown.json`.
- User asked whether HITL currently shows the full target document after all chunks for that target are reviewed.
- Current HITL skill has an Apply Phase but no explicit full-target readback requirement, so issue https://github.com/corca-ai/charness/issues/117 was opened.
- User pointed out that after HITL applies a requested rewrite, the changed chunk should be shown immediately.
- This is a general HITL skill contract issue rather than only an adapter preference, so issue https://github.com/corca-ai/charness/issues/118 was opened.
- User flagged "The binary" as terminology drift in the heuristic section because the agreed user-facing surface is the `cautilus claim` CLI command / `claim discover`.
- Premortem counterweight flagged stale HITL state: target was still Readiness while cursor and pending chunks had moved to Claim Discovery.
- Runtime state and queue are now resynced to `docs/specs/user/claim-discovery.spec.md`; next HITL should present `claim-discover-heuristics-and-dedupe-evidence` with target lines `62-129`.
