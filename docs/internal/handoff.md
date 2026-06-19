# Cautilus Handoff

## Workflow Trigger

권장 호출(다음 세션): `@docs/internal/handoff.md 핸드오프대로 진행합시다 — Behavior Evaluation 배지가 proven으로 착지·push됐고 릴리즈는 취소(출시 산출물 무변경)했으니, 이제 improve(라이브 cautilus improve 루프 proof)로 갑시다.`

doc 멘션만으로 픽업하면 이 트리거의 workflow를 실행하세요(파일 재독만 하지 말 것).
합의된 남은 시퀀스: **improve(라이브 cautilus improve 루프 proof) → specdown 재설계(맨 마지막).** 릴리즈는 출시 표면(plugins/·skills/cautilus-agent/·bin/·cmd/·internal/·install.sh) 변경이 실제로 착지할 때만 cut.

## Current State

- **apex `Behavior Evaluation` = proven (dev coding-agent 표면으로 scoped).** maintainer가 constructed-control reject-capability(load-bearing; `always-sound judge FAILS every decomposed claim` invariant + 3-behavior breadth로 핀)를 + natural-sound harvest와 함께 declared 너머 proven의 충분 기준으로 수락(2026-06-19). natural-population bar는 known(possibly-permanent) limitation으로 보존. wiring: `docs/contracts/eval-judge-collaboration.md`(Decision 섹션), `docs/specs/index.spec.md`(배지), `docs/specs/user/evaluation.spec.md`(intro). fresh-eye critique READY-WITH-EDITS(harvest-provenance 노트 fold). `lint:specs` 42 ok, judge invariants 23 ok, `npm run verify` 전 phase 통과, `claims:refresh:all` + `evidence-state:check` ok. **origin/main에 push 완료**(`f1b2c14b`, pre-push verify+drift 통과). 증거: `charness-artifacts/eval-trust/2026-06-19-behavior-eval-badge-proven.md`.
- **릴리즈 = 취소(2026-06-20).** 출시 표면(바이너리 embed `skills/cautilus-agent` + `plugins/cautilus`)이 v0.16.1과 byte-동일 — 이번 세션은 docs/specs/contracts/claim-packet만 바꿔 version bump 정당성 없음. badge-proven 마일스톤은 main push로 이미 라이브. 릴리즈는 출시-표면 변경 착지 시에만.
- **B(app/prompt product-runner proof) = DEFERRED(정직 debt).** self-dogfood엔 진짜 prompt product가 없어 `productProofReady=true`를 제조 없이 못 만듦 — `app/chat` liveness와 구조적 sibling. 어세스먼트 패킷에 4 레그를 `present`로 적는 건 제조 트랩(금지).
- **C(dev 자연-unsound harvest) = 이미 소진·수락.** `2026-06-19-judge-natural-unsound-population-frontier.md`: ~44 실응답, 0 자연 unsound, "impractical to harvest" maintainer-accepted. 재-harvest는 재확인이거나 제조. 그 finding이 surface한 배지-criterion 결정을 위에서 닫음.
- **app eval 실행 상태:** replay 메커니즘은 오늘 작동(`discover scenarios normalize chatbot` + `app_chat/app_prompt_evaluation.go` + `evaluate live persona/request batch`). app/chat replay-eval는 착지함. **라이브 재실행(liveness)** 만 진짜 외부 제품 + 비용 필요.

## Next Session: 순서

1. **improve(라이브 루프 proof) — 다음 apex 기둥.** `Bounded Improvement` 배지는 아직 declared(저장 번들 투영). held-out 시나리오에서 라이브 `cautilus improve` 루프 1회 + spec assert. 메커니즘(`improve-search v2`)은 존재; 라이브-proof 축만 비어 있음 — eval의 prove-then-project→라이브 패턴 그대로. 라이브 비용·held-out 시나리오 선택 필요.
2. **specdown 재설계(맨 마지막).** proof 표면 안정 후 apex specdown entry 재작성.
- (릴리즈는 시퀀스에서 제외 — 출시 표면 변경이 실제 착지하면 그때 `charness:release`로 cut. 그때는 CLI+Cautilus Agent progressive-disclosure quality 패스 필요.)

## Discuss (열린 결정)

- improve 라이브 루프: 어떤 held-out 시나리오로 증명할지 + 라이브 비용 승인 — maintainer 결정.
- 남은 app-surface Proof Debt: app/chat liveness(라이브 외부 제품+비용), app/prompt product-runner proof(진짜 prompt product). 둘 다 real-product 의존, 별도 maintainer 투자 결정.

## 제약

push는 사용자 몫(보류). claim-source(apex/evaluation.spec/AGENTS 등) 편집 후 `npm run claims:refresh:all`(소스 커밋 → refresh → 패킷 커밋); `status-summary.json is stale` push 실패 시 필요. 제네릭 엔진·런타임에 repo-specific judge 로직 금지. ground truth 제조 금지(sound=진짜 라이브 캡처, control만 구성). 새 런타임 표면엔 executable test. bug/error/regression은 `charness:debug`. critique/fresh-eye·라이브 runtime은 서브에이전트(Sonnet) 위임.

## References

- **배지 결정/증거**: `charness-artifacts/eval-trust/2026-06-19-behavior-eval-badge-proven.md` · `2026-06-19-judge-natural-unsound-population-frontier.md`; 계약 `docs/contracts/eval-judge-collaboration.md`(Decision 섹션).
- **배지 SOT**: `docs/specs/index.spec.md` · `docs/specs/user/evaluation.spec.md`. 로드맵 `docs/master-plan.md`(Phase 5 improve mostly-done, Phase 6 in-progress).
- **라이브 dev proof**: `npm run proof:behavior-eval:live` · `proof:skill-orientation:live`; 라이브 invariant 핀 `scripts/agent-runtime/reasoning-soundness-judge.test.mjs`.
- **app 메커니즘**: `cautilus discover scenarios normalize chatbot`, `app_chat_evaluation.go`/`app_prompt_evaluation.go`, `evaluate live persona/request batch`. runner 검증 계약 `docs/contracts/runner-verification.md`.
