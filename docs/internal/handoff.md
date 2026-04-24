# Cautilus Handoff

## Workflow Trigger

다음 세션의 기본 pickup은 `charness:find-skills`로 설치된 스킬 지도를 먼저 재확인한 뒤, [docs/master-plan.md](../master-plan.md)의 `Immediate Next Moves`에서 evidence가 축적된 슬라이스를 고르는 것이다.
첫 행동은 `git status --short`로 live worktree를 확인하는 것이고, 그 다음 이 handoff의 `Next Session` 섹션을 읽는다.
이 handoff는 mention-only pickup 기준 문서이며, handoff adapter는 `docs/internal/handoff.md`를 canonical artifact로 해석한다.

## Current State

- 직전 세션의 handoff은 `ae8d6df Define runtime fingerprint optimization contract` 시점에 멈춰 있었으나, 그 이후 `de6169f Implement runtime fingerprint optimization flow`와 0.12.3 release, coverage-floor gate, gitleaks 스캔 등이 landed 돼 stale 상태였다.
- 이번 세션은 stale handoff을 확인하고 그 이후 남아 있던 runtime fingerprint 첫 구현 슬라이스의 열린 결정 2개를 닫았다.
  - HTML report가 `report.runtimeContext`의 warnings / notes / comparisons를 Decision Signals 섹션에 렌더링한다.
    pinned mismatch는 aggregate status를 `blocker`로 끌어올리고, 패널 lead 문구가 pinned 블록을 명시한다.
    커밋은 `6f543c9 Render runtime context in HTML report`다.
  - `optimizer.kind`는 사용자-facing surface에서 완전히 제거됐다.
    `repair` / `reflection` / `history_followup` 세 preset이 Go 경로에서는 동일한 evidence priority로 수렴했고 Node 경로도 단일 ordering으로 정리됐다.
    `revisionReasons`와 `evidenceFocus`는 evidence shape에서 derive돼 proposal packet에 이미 실린다.
    하위호환 별도 유지 없음. 커밋은 `913d973 Remove optimizer.kind from user-facing optimize surface`다.
- `optimizer.kind` 제거는 breaking change라 host repo migration 가이드를 GitHub 이슈로 남겼다.
  - [corca-ai/cautilus#31](https://github.com/corca-ai/cautilus/issues/31): optimizer.kind 제거, old/new packet shape, CLI migration, proposal 읽기 경로.
- runtime fingerprint 계약 문서와 optimize 계약 문서에서 `optimizer.kind` compatibility alias 관련 문구는 모두 제거됐다.
  `docs/contracts/runtime-fingerprint-optimization.md`의 Premortem `Bundle anyway` 항목과 Deferred Decisions에서 관련 줄을 지웠다.
- `npm run verify` (go vet + lint + specdown + gitleaks + go race + node tests)와 `npm run hooks:check`는 통과했다.
  Cautilus worktree는 `913d973` 이후 clean이었다가 이 handoff 업데이트 커밋 전까지 변경 없음.

## Next Session

1. `git status --short`로 사용자 변경 여부를 먼저 확인한다.
2. `charness:find-skills`로 설치된 public / support / integration 스킬 지도를 한 번 갱신한다.
3. [docs/master-plan.md](../master-plan.md)의 `Immediate Next Moves` 중 dogfood evidence가 축적된 슬라이스를 하나만 고른다.
   - 후보 1: `instruction-surface` 경계 확장 — 추가 routing fidelity 증거가 필요한지 먼저 점검한다.
   - 후보 2: `optimize-search`의 richer merge heuristic — 최근 self-dogfood / 리뷰 artifact에 "현재 heuristic이 부족하다"는 관찰이 있는 경우에만 진입한다.
   - 후보 3: `scenario-history` 확장 — reusable baseline result 쪽 evidence가 있는 경우에만 진입한다.
4. 선택한 슬라이스에 대해 `charness:spec` → `charness:impl` 순으로 작업하되, 이미 landed된 계약이 있으면 `impl`로 바로 들어간다.

## Discuss

- runtime fingerprint의 두 번째 슬라이스 (automatic prior-evidence selection, provider API 연동)를 언제 시작할지
- `optimizer.kind` 제거 이후 host repo 쪽에서 packet validation error가 관찰되는지 (이슈 #31 반응 모니터링)
- HTML report에 `runtimeContext.comparisons` 테이블이 실제 dogfood에서 읽히는지, 줄여야 할지 늘려야 할지

## References

- [docs/master-plan.md](../master-plan.md)
- [docs/contracts/runtime-fingerprint-optimization.md](../contracts/runtime-fingerprint-optimization.md)
- [docs/contracts/optimization.md](../contracts/optimization.md)
- [docs/contracts/reporting.md](../contracts/reporting.md)
- [docs/contracts/adapter-contract.md](../contracts/adapter-contract.md)
- [corca-ai/cautilus#31](https://github.com/corca-ai/cautilus/issues/31) — optimizer.kind 제거 마이그레이션 노트
- [corca-ai/charness#66](https://github.com/corca-ai/charness/issues/66) — ideation/spec의 enum-axis consistency 점검 제안 (여전히 열려 있음)
