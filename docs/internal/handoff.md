# Cautilus Handoff

## Workflow Trigger

`docs/proven-promises.md`의 7-promise flagship 문서를 HITL로 "깎는" 중입니다.
다음 세션은 `charness:hitl`로 promise 문장 voice-sharpening 루프를 이어서 진행하세요.
**이전의 "index.spec.md부터 500+ claim을 직접 human review" 흐름은 폐기했습니다.**
그 함정(361 raw claim을 한 줄씩 손검토)으로 돌아가지 마세요.

## Current State (2026-06-08 재정렬)

2주 막힘의 진짜 원인을 찾고 방향을 재정렬한 세션입니다.

- **핵심 재정렬:** dogfood를 361 raw claim 고도가 아니라 **7 user promise(U1–U7) 고도**에서 한다.
  raw claim은 high-recall provenance일 뿐 리뷰 단위가 아님 (제품 스스로 `claim-readme-md-67`에서 그렇게 말함).
- **막힘의 뿌리:** leaf→promise canonicalization이 low-confidence·over-inclusive (medium 277/361).
  per-promise 카운트가 부풀고 misroute됨 (U2 "Claim Discovery" 53개 중 다수가 실제론 eval/improve/태그라인 문장).
  → `charness-artifacts/findings/2026-06-08-canonicalization-precision-root-finding.md`에 박아둠.
  **#1 Cautilus-improve dogfood 타깃**이지만 지금은 안 쫓음.
- **산출물:**
  - `docs/proven-promises.md` — 7 promise skeleton v1.
    promise당 손-검증 exemplar leaf, 정직한 상태(U1·U2·U5·U6·U7 proven, U3 thin, U4 promised), 카운트 의도적 생략, CLI↔Agent split 인라인.
  - 위 findings 노트.
- **커밋 (HEAD = `e697e0c`; origin/main push 여부 확인 필요 — claim source는 안 건드렸으니 stale-claim 게이트는 안 걸릴 것):**
  - `e697e0c` flagship skeleton + canonicalization finding
  - `ce80dea` render bug lead park + capability inventory refresh
- **선결과제 (사용자 확정):** 이 최상위 promise들을 증명하는 게 *유일한* 선결과제.
  특히 U3(thin)·U4(promised)가 약함.

## 진행 중 / 남은 것

1. **HITL voice-sharpening:** `docs/proven-promises.md`의 promise 문장을 사용자 목소리로 깎기.
   현재 문장은 agent 제안 voice. `charness:hitl`로 chunk별 진행, resumable.
2. **stash@{0}:** 이전 spec review 코멘트 (`index.spec.md`, `doctor-readiness.spec.md`).
   그중 doctor-readiness render 버그 lead는 `charness-artifacts/debug/debug-2026-06-08-doctor-readiness-adapter-yaml-render.md`에 별도 보관 — 고칠 땐 `charness:debug`.
3. **top-promise 증명:** voice 확정 후 U3/U4부터 실제 evidence로 promote.
4. **canonicalization 타깃:** 위 findings 노트의 improve 슬라이스(gold set으로 leaf→promise precision 측정) — 별도 세션.

## Discuss

- promise 문장을 어느 수준까지 외부(컨설팅 고객) 대상으로 다듬을지.
- U3/U4 증명을 위해 어떤 runner/evidence가 필요한지.
- canonicalization improve를 언제 첫 dogfood 슬라이스로 열지.

## References

- [docs/specs/index.spec.md](../specs/index.spec.md)
- [charness-artifacts/findings/2026-06-08-canonicalization-precision-root-finding.md](../../charness-artifacts/findings/2026-06-08-canonicalization-precision-root-finding.md)
- [charness-artifacts/debug/debug-2026-06-08-doctor-readiness-adapter-yaml-render.md](../../charness-artifacts/debug/debug-2026-06-08-doctor-readiness-adapter-yaml-render.md)
- [.cautilus/claims/canonical-claim-map.json](../../.cautilus/claims/canonical-claim-map.json)
- [docs/specs/user/index.spec.md](../specs/user/index.spec.md)
