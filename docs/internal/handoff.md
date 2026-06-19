# Cautilus Handoff

## Workflow Trigger

권장 호출(다음 세션): `@docs/internal/handoff.md 핸드오프대로 진행합시다 — Behavior Evaluation 배지가 proven으로 착지했으니 이제 릴리즈로 갑시다 (charness:release: 릴리즈 표면 cut/verify + CLI↔Cautilus Agent progressive-disclosure quality 패스).`

doc 멘션만으로 픽업하면 이 트리거의 workflow를 실행하세요(파일 재독만 하지 말 것).
합의된 남은 시퀀스: **릴리즈 → improve(라이브 cautilus improve 루프 proof) → specdown 재설계(맨 마지막).**

## Current State

- **apex `Behavior Evaluation` = proven (dev coding-agent 표면으로 scoped).** maintainer가 constructed-control reject-capability(load-bearing; `always-sound judge FAILS every decomposed claim` invariant + 3-behavior breadth로 핀)를 + natural-sound harvest와 함께 declared 너머 proven의 충분 기준으로 수락(2026-06-19). natural-population bar는 known(possibly-permanent) limitation으로 보존. wiring: `docs/contracts/eval-judge-collaboration.md`(Decision 섹션), `docs/specs/index.spec.md`(배지), `docs/specs/user/evaluation.spec.md`(intro). fresh-eye critique READY-WITH-EDITS(harvest-provenance 노트 fold). `lint:specs` 42 ok, judge invariants 23 ok, `npm run verify` 전 phase 통과, `claims:refresh:all` + `evidence-state:check` ok. 커밋 2개(미push — push는 user 몫). 증거: `charness-artifacts/eval-trust/2026-06-19-behavior-eval-badge-proven.md`.
- **B(app/prompt product-runner proof) = DEFERRED(정직 debt).** self-dogfood엔 진짜 prompt product가 없어 `productProofReady=true`를 제조 없이 못 만듦 — `app/chat` liveness와 구조적 sibling. 어세스먼트 패킷에 4 레그를 `present`로 적는 건 제조 트랩(금지).
- **C(dev 자연-unsound harvest) = 이미 소진·수락.** `2026-06-19-judge-natural-unsound-population-frontier.md`: ~44 실응답, 0 자연 unsound, "impractical to harvest" maintainer-accepted. 재-harvest는 재확인이거나 제조. 그 finding이 surface한 배지-criterion 결정을 위에서 닫음.
- **app eval 실행 상태:** replay 메커니즘은 오늘 작동(`discover scenarios normalize chatbot` + `app_chat/app_prompt_evaluation.go` + `evaluate live persona/request batch`). app/chat replay-eval는 착지함. **라이브 재실행(liveness)** 만 진짜 외부 제품 + 비용 필요.

## Next Session: 순서

1. **릴리즈(charness:release).** 릴리즈 표면 cut/verify(plugin 버전, install manifest, operator update). CLAUDE.md: `Cautilus`는 CLI+Cautilus Agent product → progressive-disclosure quality 패스(Cautilus Agent=routing/sequencing/guardrails, 바이너리=command discovery/help/scenario catalog/install smoke/doctor). 어댑터가 선택 surface를 실제 run 가능한지 확인(불가 시 waiver). push는 user.
2. **improve(라이브 루프 proof).** `Bounded Improvement` 배지는 아직 declared(저장 번들 투영). 다음 apex 기둥 = held-out 시나리오에서 라이브 `cautilus improve` 루프 1회 + spec assert. 메커니즘(`improve-search v2`)은 존재; 라이브-proof 축만 비어 있음 — eval의 prove-then-project→라이브 패턴 그대로.
3. **specdown 재설계(맨 마지막).** proof 표면 안정 후 apex specdown entry 재작성.

## Discuss (열린 결정)

- 릴리즈를 이번에 바로 진행할지(버전 bump 범위 포함) — maintainer 결정.
- 남은 app-surface Proof Debt: app/chat liveness(라이브 외부 제품+비용), app/prompt product-runner proof(진짜 prompt product). 둘 다 real-product 의존, 별도 maintainer 투자 결정.

## 제약

push는 사용자 몫(보류). claim-source(apex/evaluation.spec/AGENTS 등) 편집 후 `npm run claims:refresh:all`(소스 커밋 → refresh → 패킷 커밋); `status-summary.json is stale` push 실패 시 필요. 제네릭 엔진·런타임에 repo-specific judge 로직 금지. ground truth 제조 금지(sound=진짜 라이브 캡처, control만 구성). 새 런타임 표면엔 executable test. bug/error/regression은 `charness:debug`. critique/fresh-eye·라이브 runtime은 서브에이전트(Sonnet) 위임.

## References

- **배지 결정/증거**: `charness-artifacts/eval-trust/2026-06-19-behavior-eval-badge-proven.md` · `2026-06-19-judge-natural-unsound-population-frontier.md`; 계약 `docs/contracts/eval-judge-collaboration.md`(Decision 섹션).
- **배지 SOT**: `docs/specs/index.spec.md` · `docs/specs/user/evaluation.spec.md`. 로드맵 `docs/master-plan.md`(Phase 5 improve mostly-done, Phase 6 in-progress).
- **라이브 dev proof**: `npm run proof:behavior-eval:live` · `proof:skill-orientation:live`; 라이브 invariant 핀 `scripts/agent-runtime/reasoning-soundness-judge.test.mjs`.
- **app 메커니즘**: `cautilus discover scenarios normalize chatbot`, `app_chat_evaluation.go`/`app_prompt_evaluation.go`, `evaluate live persona/request batch`. runner 검증 계약 `docs/contracts/runner-verification.md`.
