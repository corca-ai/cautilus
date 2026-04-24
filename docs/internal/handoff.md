# Cautilus Handoff

## Workflow Trigger

다음 세션의 기본 pickup은 `charness:find-skills`로 설치된 스킬 지도를 먼저 재확인한 뒤, [docs/master-plan.md](../master-plan.md)의 `Immediate Next Moves`에서 evidence가 축적된 슬라이스를 고르는 것이다.
첫 행동은 `git status --short`로 live worktree를 확인하는 것이고, 그 다음 이 handoff의 `Next Session` 섹션을 읽는다.
이 handoff는 mention-only pickup 기준 문서이며, handoff adapter는 `docs/internal/handoff.md`를 canonical artifact로 해석한다.

## Current State

- 세션 말미에 Cautilus `v0.13.0`이 게시됐다 ([release](https://github.com/corca-ai/cautilus/releases/tag/v0.13.0), 태그 `b3e90f4`).
  minor bump 근거: `optimizer.kind` 제거(breaking) + HTML report `runtimeContext` 렌더(additive) + instruction-surface fixture 5/5(additive, fixture-only).
  `release-artifacts`, `verify-public-release`, install-sh smoke install 모두 green.
  릴리즈 직후 coverage-floor 게이트가 3개 파일 drift로 CI 붉은색이 됐고 `d211888 Realign coverage floors after 0.13.0 release surface changes`에서 동일 해시 2회 측정 후 realign하여 main 복구.
  전체 기록은 [charness-artifacts/release/latest.md](../../charness-artifacts/release/latest.md).
- 이번 세션은 handoff candidate 1 (`instruction-surface` 경계 확장)의 첫 축을 닫았다.
  `fixtures/instruction-surface/cases.json`의 `claude-only-routing`과 `claude-symlink-routing`에 `expectedRouting: { selectedSkill: "none" }`이 추가됐고, 같은 기대치와 호환되도록 `fixture-results.json`의 `claude-symlink-routing` routing decision도 채워졌다.
  fixture backend e2e 기준 `evaluationsWithExpectedRoute`와 `matchedExpectedRoute`가 3 → 5로 올랐고, summary recommendation은 `accept-now`.
  커밋은 `d93084a Assert routing fidelity on all instruction-surface variants`다.
- 이 슬라이스는 measurement coverage만 닫았다.
  `scripts/agent-runtime/instruction-surface-support.mjs`의 `ROOT_ENTRY_ALIASES`는 루트 AGENTS.md / CLAUDE.md만 마스킹하므로, `claude_only` / `claude_symlink` surface가 활성일 때도 `skills/cautilus/SKILL.md`와 `plugins/cautilus/skills/cautilus/SKILL.md`는 candidate workspace에 그대로 남는다.
  직전 real-codex 런(`artifacts/self-dogfood/instruction-surface/latest/instruction-surface-summary.json`, 2026-04-19)에서는 이 영향으로 `claude-only-routing`이 `selectedSkill: "cautilus"`를 반환했다.
  다음 real-codex `dogfood:self:instruction-surface` 런은 새 기대치 때문에 이 leak을 reject로 드러낼 것이다.
- `npm run verify`와 `npm run hooks:check`는 통과.

## Next Session

1. `git status --short`로 사용자 변경 여부를 먼저 확인한다.
2. `charness:find-skills`로 설치된 public / support / integration 스킬 지도를 한 번 갱신한다.
3. 아래 중 하나를 진입점으로 고른다.
   - 후보 1a (자연 후속): instruction-surface surface-isolation 확장.
     `ROOT_ENTRY_ALIASES` 너머까지 materialization 마스킹 범위를 넓혀 declared surface가 실제로만 노출되게 한다.
     real-codex dogfood를 먼저 돌려 현재 leak을 reject로 재현한 뒤 진입하는 것이 정직하다.
   - 후보 2: `optimize-search`의 richer merge heuristic — 최근 self-dogfood / 리뷰 artifact에 "현재 heuristic이 부족하다"는 관찰이 있는 경우에만 진입한다.
   - 후보 3: `scenario-history` 확장 — [docs/contracts/scenario-history.md § Trigger to unlock](../contracts/scenario-history.md)의 3 trigger 중 하나가 발동된 경우에만 진입한다.
4. 선택한 슬라이스에 대해 `charness:spec` → `charness:impl` 순으로 작업하되, 이미 landed된 계약이 있으면 `impl`로 바로 들어간다.

## Discuss

- real-codex `dogfood:self:instruction-surface` 재실행 타이밍 — 새 기대치 하에서 leak이 얼마나 크게 드러나는지 확인한 뒤 surface-isolation slice 우선순위를 정한다.
- runtime fingerprint의 두 번째 슬라이스 (automatic prior-evidence selection, provider API 연동)를 언제 시작할지.
- `optimizer.kind` 제거 이후 host repo 쪽에서 packet validation error가 관찰되는지 (이슈 #31 반응 모니터링).

## References

- [docs/master-plan.md](../master-plan.md)
- [docs/contracts/instruction-surface.md](../contracts/instruction-surface.md)
- [docs/specs/instruction-surface.spec.md](../specs/instruction-surface.spec.md)
- [scripts/agent-runtime/instruction-surface-support.mjs](../../scripts/agent-runtime/instruction-surface-support.mjs) — `ROOT_ENTRY_ALIASES`와 surface materialization 위치
- [docs/contracts/runtime-fingerprint-optimization.md](../contracts/runtime-fingerprint-optimization.md)
- [docs/contracts/scenario-history.md](../contracts/scenario-history.md)
- [corca-ai/cautilus#31](https://github.com/corca-ai/cautilus/issues/31) — optimizer.kind 제거 마이그레이션 노트
- [corca-ai/charness#66](https://github.com/corca-ai/charness/issues/66) — ideation/spec의 enum-axis consistency 점검 제안 (여전히 열려 있음)
