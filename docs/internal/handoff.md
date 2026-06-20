# Cautilus Handoff

## Workflow Trigger

권장 호출(다음 세션): `@docs/internal/handoff.md 핸드오프대로 진행합시다 — declared 티어가 비었으니(proven 6 / declared 0 / promised 1) 다음은 마지막 비증명 배지 "A Testable Agent"를 promised→proven 으로 올립니다. 단, 이건 직전 두 슬라이스와 달리 proof-route flip이 아니라 스펙이 아예 없습니다(promised, no spec) — charness:ideation 으로 "clean invokable runner"가 무엇을 증명 가능한 행동으로 의미하는지부터 잡고(배경: docs/contracts/runner-readiness.md), charness:spec 으로 실행계약화한 뒤 impl. 7/7 proven 이면 apex "Proven On Itself" 명제가 완성됨. 버그/회귀는 charness:debug, 랜딩 전 critique는 포그라운드 Sonnet 서브에이전트, claim-source 편집 시 push 전 npm run claims:refresh:all.`

doc 멘션만으로 픽업하면 이 트리거의 workflow를 실행하세요(파일 재독만 하지 말 것).

## Current State

- **Reviewable Artifacts LANDED: declared→proven (deterministic live-regen).** declared 티어가 0이 됨. 3커밋 미push(push는 user 몫): `2dd0cd5b`(contract) · `86ecc52b`(landing) · `9f27986e`(fresh-eye 후 tightening). 작업트리 clean, `npm run verify` green, `hooks:check` ready.
- **Apex 현재: proven 6 / declared 0 / promised 1, 7/7 consistent, honest=true.** 남은 비증명 배지는 `A Testable Agent`(promised, 스펙 없음) 하나뿐 — 이게 7/7로 가는 마지막 관문.
- **재사용 가능한 레버:** deterministic live-regen 패턴이 packet/view/report 표면에 대해 증명됨 — `run:shell -> $var` 캡처 + `check:cautilus-json-command(command=cautilus … ${var})`(인터폴레이션 됨) + `$ cmd` 골든블록(노티스 grep). 비-cautilus 도구(node 렌더러/jq)는 반드시 `run:shell`/golden, `cautilus-json-command` 불가(parseCommand가 cautilus 바이너리 강제). evidence:[] deterministic 라우트는 proofSpec+checkCount>0 만으로 proven(Readiness 형태).

## Next Session — A Testable Agent (promised→proven)

1. `charness:ideation`: 이 배지는 proof-route flip이 아님 — 증명할 "행동"의 개념부터. apex 약속은 "clean, invokable runner … makes any agent testable." 무엇을 결정적으로/eval로/human-auditable로 증명할지(어느 proof-class), 어떤 CLI/패킷이 그 runner-readiness를 산출하는지 잡기. 배경 계약: `docs/contracts/runner-readiness.md`.
2. `charness:spec`: leaf 스펙(`docs/specs/user/` 신규) + 레지스트리 라우트(`a-testable-agent`: proofClass none→결정된 클래스, proofSpec/evidence) + apex 배지 promised→proven 계약화. 직전 두 슬라이스 패턴 참고.
3. impl + audit/project/claim-state 재생성 + `npm run verify` + `npm run claims:refresh:all`. 성공 시 apex 7/7 proven.

## Discuss

- **D1(분기):** 다음 헤드라인 = A Testable Agent(마지막 비증명 배지, 7/7 완성, 단 ideation/spec 선행 필요·가장 큰 리프트) 권장. **대안:** 이미 proven 인 Behavior Evaluation의 app-surface Proof Debt 심화 — `app/chat` liveness(실제 live 앱 재실행 $·owner 시나리오) + `app/prompt` product-runner. 배지 플립은 아니고 Proof Debt 한 줄 축소. user가 7/7 완성을 우선할지 app-surface 깊이를 우선할지 선택.
- 비차단 참고: 모든 7/7 배지가 `route-class-mismatch`(또는 no-t1-claim)로 divergent — 설계상 read-only·비차단(`projected-claim-state.md:60`). Reviewable Artifacts도 deterministic vs ratified cautilus-eval(claim-readme-md-137)로 mismatch 유지, claim-discovery와 동형. gold-set 재비준은 별도 결정.

## 제약

- **claim-source = docs/specs/** + README/AGENTS/CLAUDE + surface-registry.json + 링크 문서.** 편집 시 push 전 `npm run claims:refresh:all`(evidence-state alone 불충분 — isStale가 strict equality 강제). handoff는 claim-source 아님.
- critique/fresh-eye는 **포그라운드 Sonnet 서브에이전트**. bug/error/regression은 `charness:debug`. `lint:specs` ON 유지.

## References

- **직전 계약(LANDED, 패턴 참고):** `charness-artifacts/spec/2026-06-21-reviewable-artifacts-deterministic-live-regen.md` · 그 직전 `…-host-ownership-human-auditable-proofclass.md`.
- **타깃 배경:** `docs/contracts/runner-readiness.md`(A Testable Agent) · apex `docs/specs/index.spec.md` · 레지스트리 `docs/specs/audit/surface-registry.json`(route `a-testable-agent`, 현재 proofClass none).
- **proof 머신:** `scripts/agent-runtime/surface-audit-lib.mjs`(PROOF_CLASSES/computeObserved) · `goldset-projection-lib.mjs`(ROUTE_TO_PROOF_CLASS=항등, reconcile 비차단) · specdown 어댑터 `scripts/specdown/cautilus-adapter.mjs`.
