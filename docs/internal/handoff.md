# Cautilus Handoff

## Workflow Trigger

다음 세션은 `charness:hitl`로 [docs/specs/user/claim-discovery.spec.md](../specs/user/claim-discovery.spec.md)를 재개하세요.
먼저 `git status --short`를 보고, repo 규칙대로 `charness:find-skills`를 한 번 실행한 뒤, 현재 HITL runtime의 active rules와 queue cursor를 확인하세요.

## Current State

- Latest committed slice: `edb7ea2 Harmonize user specs for HITL handoff`.
  User-facing specs now follow the current session rules: pain-point opening, concrete CLI command plus `cautilus-agent` skill on first workflow introduction, command-surface vocabulary instead of user-facing "binary", no generic Specdown readiness coupling, and prepared-not-executed eval language.
- Recent support commits:
  `2b3ea32 Rename bundled skill to Cautilus Agent`,
  `b14707a Remove specdown from doctor readiness`,
  `0d04dfc Drop retired specdown regression assertions`,
  `dcee67a Record HITL terminology drift retro`.
- Premortem artifact: [charness-artifacts/premortem/hitl-user-spec-closeout.md](../../charness-artifacts/premortem/hitl-user-spec-closeout.md).
  It records the delegated angle reviews and the counterweight triage used before `edb7ea2`.
- Charness follow-ups opened during this session:
  [#117](https://github.com/corca-ai/charness/issues/117) full-target readback after chunks,
  [#118](https://github.com/corca-ai/charness/issues/118) show rewritten chunk after edit,
  [#119](https://github.com/corca-ai/charness/issues/119) accepted HITL rules as active pre-edit constraints plus target/cursor/chunk-bound validation.
- `.charness/hitl/` remains runtime state and is intentionally uncommitted unless the user explicitly asks otherwise.

## Next Session

1. Confirm worktree state.
   Expected dirty state is only HITL runtime under `.charness/hitl/runtime/...` unless the user has changed more.
2. Read `.charness/hitl/runtime/hitl-20260508-062748/rules.yaml`, `state.yaml`, `queue.json`, and `hitl-scratchpad.md`.
   The state has been resynced to `docs/specs/user/claim-discovery.spec.md`.
3. Resume with queue item `claim-discover-heuristics-and-dedupe-evidence`.
   Present [docs/specs/user/claim-discovery.spec.md](../specs/user/claim-discovery.spec.md) lines 62-129, including the implementation-evidence block, before asking for judgment.
4. Apply the active HITL rules before every edit:
   show the rewritten chunk after changes, keep user-facing command vocabulary, and do not advance cursor until the user accepts or redirects.
5. After Claim Discovery chunks are all reviewed, show the full updated Claim Discovery document before considering that target complete.
6. Do not run the prepared Cautilus eval unless the user explicitly approves it.
   The prepared command remains `dogfood:cautilus-claim-discovery-curation-flow:eval:codex`.

## Discuss

- Whether the updated Claim Discovery heuristic section is now too example-heavy or has the right example-to-implementation balance.
- Whether lower-level packet output may still show Markdown traversal terms while user-facing prose says entry and linked docs.
- Whether any Cautilus-only spec authoring pattern from this HITL should move into Charness after #117-#119.

## References

- [docs/specs/user/index.spec.md](../specs/user/index.spec.md)
- [docs/specs/user/claim-discovery.spec.md](../specs/user/claim-discovery.spec.md)
- [docs/internal/working-patterns.md](./working-patterns.md)
- [charness-artifacts/retro/hitl-terminology-drift.md](../../charness-artifacts/retro/hitl-terminology-drift.md)
- [charness-artifacts/premortem/hitl-user-spec-closeout.md](../../charness-artifacts/premortem/hitl-user-spec-closeout.md)
