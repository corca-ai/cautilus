# Cautilus Handoff

## Workflow Trigger

다음 세션은 **proof-debt 골을 활성화해서 실행**합니다.
먼저 골의 `## Discuss before activation`(서피스별 *컨펌된* 시나리오/픽스처)을 사용자와 해소한 뒤:

```
/goal @charness-artifacts/goals/2026-06-09-clear-proof-debt-live-proven.md
```

골이 미해소 discuss 때문에 `pursue-ready: False`라 그냥 `/goal`하면 fail-fast로 `/achieve`로 되돌립니다 — 의도된 게이트입니다.

## Current State (2026-06-09)

긴 세션에서 "왜 막혔나"를 끝까지 파고들어 방향을 재정렬하고 apex를 만든 뒤, 다음 작업을 골로 넘긴 상태.

- **재정렬:** dogfood를 361 raw claim이 아니라 **사용자 promise 고도**에서. 그리고 핵심 발견 — 7개 promise 중 **5개의 "proven"이 live 실행이 아니라 5월의 자기선언(`declared-eval-runner`) 번들 투영**. 사용자가 "증명을 못 믿겠다"던 그 느낌이 메커니즘 사실이었음. 진짜 live-proven은 Readiness·Claim Discovery 둘뿐.
- **apex 완성 (`9c60635`):** `docs/specs/index.spec.md`를 **"Cautilus, Proven On Itself"** 최상위로 승격. newcomer voice(HITL로 깎음, R1–R8), 각 promise가 라인넘버가 아니라 **자기 실행 스펙에 proof-link**, 정직한 배지(**proven** 2 / **declared** 4 / **promised** 1), **Proof Debt 표**, Evidence Gaps→honesty 논제, U-번호 헤더 제거. `docs/proven-promises.md`는 흡수·삭제. specdown dry-run 43 specs/169 cases exit 0, lint:specs/links green. README·AGENTS(=CLAUDE) memory realign 완료.
- **render 버그 (`5e0d850`):** 제 "trace config" 가설은 **falsified**(trace=traceability 그래프, 무관). 진짜 방향: specdown은 `run:` 블록 첫 줄이 주석이면 collapsed 렌더(syntax.md Summary Lines) → cat 블록 출력이 접힘. spec-authoring 수정 가능성, repro 필요. lead: `charness-artifacts/debug/debug-2026-06-08-doctor-readiness-adapter-yaml-render.md`.
- **charness#340 제기:** find-skills가 specdown을 support skill로 안 띄우고 integration tool로만 분류 → [corca-ai/charness#340](https://github.com/corca-ai/charness/issues/340) (OPEN, bug). 골 범위 밖.
- **골 (`5fbc663`):** `charness-artifacts/goals/2026-06-09-clear-proof-debt-live-proven.md` (draft) — Proof Debt 청산(declared/promised → live-proven, 컨펌 시나리오 위에서).
- HEAD = `5fbc663`, origin/main push 여부 확인 필요(여러 커밋 로컬).
- stash@{0}: 옛 spec review 코멘트(이미 apex로 해소됨, 정리해도 됨).

## Next Session

1. `git status --short` 깨끗한지 확인, 필요시 push.
2. 골의 Discuss-before-activation을 사용자와 해소: Behavior Evaluation(dev/repo·dev/skill·app/chat·app/prompt)·Bounded Improvement에 쓸 **컨펌된 시나리오/픽스처**를 사용자가 지정. 옛 5/3 번들로 회귀 금지.
3. `/goal @...clear-proof-debt-live-proven.md`로 활성화. 슬라이스 1(render 버그 repro→fix, charness:debug)·2(Host Ownership: 기존 `consumer:onboard:smoke` 연결)가 cheap de-risk.
4. 각 promise가 live-proven되면 apex 배지를 정직하게 갱신하고 Proof Debt 행 제거.

## Discuss

- 각 eval/improve 서피스의 "컨펌된 시나리오"는 무엇인가 (골 활성화의 핵심 게이트).
- live proof 비용 예산(바이너리 빌드+에이전트 실행)과 이번 라운드 in-scope 서피스.
- (백로그) apex를 discover JSON에서 agent-generate하는 generator를 언제 열지.

## References

- [charness-artifacts/goals/2026-06-09-clear-proof-debt-live-proven.md](../../charness-artifacts/goals/2026-06-09-clear-proof-debt-live-proven.md)
- [docs/specs/index.spec.md](../specs/index.spec.md)
- [charness-artifacts/findings/2026-06-08-canonicalization-precision-root-finding.md](../../charness-artifacts/findings/2026-06-08-canonicalization-precision-root-finding.md)
- [charness-artifacts/debug/debug-2026-06-08-doctor-readiness-adapter-yaml-render.md](../../charness-artifacts/debug/debug-2026-06-08-doctor-readiness-adapter-yaml-render.md)
