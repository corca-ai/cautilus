# Cautilus Handoff

## Workflow Trigger

다음 세션의 기본 pickup은 `charness:find-skills`로 설치된 스킬 지도를 먼저 재확인한 뒤, [docs/master-plan.md](../master-plan.md)의 `Immediate Next Moves`에서 evidence가 축적된 슬라이스를 고르는 것이다.
첫 행동은 `git status --short`로 live worktree를 확인하는 것이고, 그 다음 이 handoff의 `Next Session` 섹션을 읽는다.
이 handoff는 mention-only pickup 기준 문서이며, handoff adapter는 `docs/internal/handoff.md`를 canonical artifact로 해석한다.

## Current State

- Cautilus `v0.13.0`이 게시됐다 ([release](https://github.com/corca-ai/cautilus/releases/tag/v0.13.0), 태그 `b3e90f4`).
  minor bump 근거: `optimizer.kind` 제거(breaking) + HTML report `runtimeContext` 렌더(additive) + instruction-surface fixture 정리(additive).
  release-artifacts / verify-public-release / install-sh smoke 모두 green, 자세한 기록은 [charness-artifacts/release/latest.md](../../charness-artifacts/release/latest.md).
- 직전 세션 후반에 `instruction-surface` 자가 평가 fixture를 제품 가설 1개로 좁혔다.
  이전 세션에서 5개 fixture 변형 중 4개(`claude-only-routing`, `nested-override-routing`, `linked-doc-routing`, `claude-symlink-routing`)가 instruction이 의도대로 steer하는지를 묻는 게 아니라 runner의 mechanical capability를 검증하고 있었다.
  self-dogfood 가설 1개(`checked-in-agents-routing`, 실제 cautilus AGENTS.md vs. 약속된 routing)만 남기고 나머지는 unit test로 강등 — `instruction-surface-case-suite` 파서와 `materializeInstructionSurface`의 symlink/nested/linked 경로는 신규 unit test 두 파일에서 커버.
- v0.13.0 release record 안에 있던 "ROOT_ENTRY_ALIASES leak" 표현은 잘못된 프레이밍이었다.
  현재 masking은 의도된 overlay다 — 루트 AGENTS.md/CLAUDE.md만 교체하고 워크스페이스의 번들 스킬과 나머지 repo는 그대로 노출하는 것이 `instruction-surface` 평가의 의도된 환경이다.
- `instruction-surface`가 별도 first-class surface로 남을지, 챗봇의 system-prompt 평가 한 shape으로 흡수될지는 다음 단계 재설계 거리로 [docs/specs/instruction-surface.spec.md § Open Redesign](../specs/instruction-surface.spec.md)에 명시했다.
- `npm run verify`, `npm run coverage:floor:check`, `npm run hooks:check` 모두 통과.

## Next Session

1. `git status --short`로 사용자 변경 여부를 먼저 확인한다.
2. `charness:find-skills`로 설치된 public / support / integration 스킬 지도를 한 번 갱신한다.
3. 아래 중 하나를 진입점으로 고른다.
   - 후보 1 (`instruction-surface` Phase B 재설계): [docs/specs/instruction-surface.spec.md § Open Redesign](../specs/instruction-surface.spec.md)의 세 질문(별도 surface 유지 vs. 챗봇 흡수, 차원별 dogfood fixture, 워크스페이스-shaped system prompt) 중 하나에 대해 `charness:ideation` → `charness:spec` 진입.
   - 후보 2: `optimize-search`의 richer merge heuristic — 최근 self-dogfood / 리뷰 artifact에 "현재 heuristic이 부족하다"는 관찰이 있는 경우에만 진입한다.
   - 후보 3: `scenario-history` 확장 — [docs/contracts/scenario-history.md § Trigger to unlock](../contracts/scenario-history.md)의 3 trigger 중 하나가 발동된 경우에만 진입한다.
4. 선택한 슬라이스에 대해 `charness:spec` → `charness:impl` 순으로 작업하되, 이미 landed된 계약이 있으면 `impl`로 바로 들어간다.

## Discuss

- runtime fingerprint의 두 번째 슬라이스 (automatic prior-evidence selection, provider API 연동)를 언제 시작할지.
- `optimizer.kind` 제거 이후 host repo 쪽에서 packet validation error가 관찰되는지 (이슈 #31 반응 모니터링).
- `instruction-surface` Phase B 재설계의 큰 질문 — 챗봇 평가의 한 shape으로 흡수할지 별도 first-class로 둘지.

## References

- [docs/master-plan.md](../master-plan.md)
- [docs/contracts/instruction-surface.md](../contracts/instruction-surface.md)
- [docs/specs/instruction-surface.spec.md](../specs/instruction-surface.spec.md) — Phase B 재설계 질문이 `Open Redesign`에 있음
- [docs/contracts/runtime-fingerprint-optimization.md](../contracts/runtime-fingerprint-optimization.md)
- [docs/contracts/scenario-history.md](../contracts/scenario-history.md)
- [corca-ai/cautilus#31](https://github.com/corca-ai/cautilus/issues/31) — optimizer.kind 제거 마이그레이션 노트
- [corca-ai/charness#66](https://github.com/corca-ai/charness/issues/66) — ideation/spec의 enum-axis consistency 점검 제안 (여전히 열려 있음)
