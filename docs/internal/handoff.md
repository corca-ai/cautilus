# Cautilus Handoff

## Workflow Trigger

권장 호출(다음 세션): `@docs/internal/handoff.md 핸드오프대로 진행합시다 — apex가 7/7 proven으로 "Cautilus, Proven On Itself"가 완성됐고 비증명 배지는 더 없습니다. 첫 행동으로 charness:ideation 을 호출해 다음 방향 결정 프레임(옵션·tradeoff·추천·다음 스텝)을 받으세요. 결정이 서면 그때 charness:impl 등 적절한 work skill로 이어가세요.` 방향 후보는 아래 Next Session 참고.

첫 tool call = `charness:ideation`. doc 멘션만으로 픽업해도 파일 재독에 그치지 말고 이 workflow를 바로 실행하세요. (직접 impl로 가지 말 것 — 비증명 배지가 없어 다음 타깃은 자동 도출되지 않으며, 방향 결정이 선행돼야 함.)

## Current State

- **A Testable Agent LANDED: promised→proven (deterministic). apex 이제 7 proven / 0 declared / 0 promised, 7/7 consistent, honest=true.** 마지막 비증명 배지가 닫혔고 "Proven On Itself" 명제 완성.
  - Slice 1 `82e6e2c6`(① readiness 검증: doctor status runnerReadiness verdict + 3개 assessment fixture cautilus-json-file + claims plan requiredRunnerCapability + controlled stale 탐지). Slice 2 `3fb46b5f`(② agent-helps-build: `cautilus-agent` 스킬에 Runner Readiness 라우팅 + prepared dogfood fixture + 실행 audit test; apex flip).
  - 기록 계약(landed notes 포함): `charness-artifacts/spec/2026-06-21-a-testable-agent-promised-to-proven.md`.
- **이번 세션 커밋 미push(push는 user 몫):** `82e6e2c6`(Slice 1) + `3fb46b5f`(Slice 2). 직전 미push 6개(`2dd0cd5b`·`86ecc52b`·`9f27986e`·`170fcb5e`·`65e7f3fe`·`b75f1cfd`)도 함께 대기 중. 작업트리 clean, `npm run verify` green, `hooks:check` ready.
- **남은 deferred(Proof Debt, 비차단):** Behavior Evaluation app/chat liveness + app/prompt product-runner; A Testable Agent live runner-building 에피소드(deterministic readiness+prepared-skill은 proven, live `cautilus-eval` 에피소드만 deferred). 모두 apex Proof Debt 표에 명시됨.

## Next Session

1. 비증명 배지가 없으므로 "다음 헤드라인"은 자동 도출되지 않음 → **charness:ideation** 으로 결정 프레임(tradeoff·추천·다음 스텝). 방향 후보: (a) deferred Proof-Debt 항목을 live로 끌어올리기 — Behavior Evaluation app/chat liveness, app/prompt product-runner, A Testable Agent live runner-building 에피소드; (b) consumer adoption/릴리스 표면; (c) 그 외 사용자 지정. 모두 비차단이라 어느 것도 "명백한 필수 다음"이 아님 — user 결정 사항.
2. (a) deferred를 live로: A Testable Agent live 에피소드라면 dogfood 어댑터 + `dogfood:cautilus-runner-readiness-flow:eval:*` 스크립트 추가 후 live cautilus-eval, route를 deterministic→cautilus-eval로 승급(① supporting). app surfaces는 runner-readiness 기판 위에서 in-process/live product-runner.
3. claim-source(docs/specs/**, registry, README/AGENTS/CLAUDE, 링크 문서) 편집 시 push 전 `npm run claims:refresh:all`. `skills/cautilus-agent/` 편집 시 3사본(`skills/`·`.agents/skills/`·`plugins/`) byte-identical 유지(`npm run skills:sync-packaged` + `.agents/skills`는 수동 cp) + disclosure 게이트(core ≤185 non-empty).

## Discuss

- **D1:** A Testable Agent ② 증명은 prepared-skill(deterministic)로 닫고 live 에피소드는 deferred — user 기존 수용. live로 끌어올릴지는 ideation 결정 사항.
- 비차단: `a-testable-agent`는 `no-t1-claim`(gold-set T1 없음) 유지 — Readiness와 동형, 비차단. T1 억지 생성 금지.

## References

- **명제 완성 증거:** apex `docs/specs/index.spec.md`(7/7 proven) · leaf `docs/specs/user/a-testable-agent.spec.md` · 배경 `docs/contracts/runner-readiness.md`.
- **이번 세션 계약(landed):** `charness-artifacts/spec/2026-06-21-a-testable-agent-promised-to-proven.md`.
- **proof 머신:** `scripts/agent-runtime/surface-audit-lib.mjs`(evidence-binding) · 레지스트리 `docs/specs/audit/surface-registry.json` · disclosure 게이트 `scripts/check-cautilus-skill-disclosure.mjs`(core 185 상한 + Runner Readiness required fragments).
- **prepared-skill 패턴 참고:** `docs/specs/user/claim-discovery.spec.md` + audit `scripts/agent-runtime/audit-cautilus-runner-readiness-flow-log.mjs`(+test).

## 제약

- **claim-source = docs/specs/** + README/AGENTS/CLAUDE + surface-registry.json + 링크 문서.** 편집 시 push 전 `npm run claims:refresh:all`(evidence-state alone 불충분). handoff·charness-artifacts/는 claim-source 아님.
- critique/fresh-eye는 **포그라운드 Sonnet 서브에이전트**. bug/error/regression은 `charness:debug`. `lint:specs` ON 유지. `skills/cautilus-agent/` 편집은 freeze-intent + progressive-disclosure(`lint:skill-disclosure`) + 3사본 동기화.
