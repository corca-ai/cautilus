# Cautilus Handoff

## Workflow Trigger

**진행 상태 (2026-06-16, user-product HITL 완료분)**: 292 골드셋을 `claimAudience`로 세그먼트(commit `1ecdf32`, user-product 121 + developer 171, 가역성 검증, 위임 critique SAFE) → user-product 트랙에 골드셋 HITL 재개 → 대표 표본 15/24 리뷰. precision 깨끗(not-a-claim 0). 설계 수확을 spec에 fold(commit `adb488a`, fresh-eye critique NEEDS CHANGES 3블로커 반영).

**핵심 수확 (292의 정체)**: 과다추출이 **아님**. = audience 혼합(분리완료) + 카운트 착시 + **flatness**(121 클레임에 `claimSemanticGroup` 55종, 근중복 다수) + **proof-route 라벨 ~20% 오류**(에이전트가 `human-auditable` 과배정 / `deterministic` 과신). → 에이전트는 클레임을 잘 찾되 **proof 라우팅이 약함.**

**비준된 모델 (rules R10–R15; 런타임 `.charness/hitl/runtime/hitl-20260611-082742` gitignored; durable = `charness-artifacts/hitl/latest.md`)**:
- **APEX (락)** = 유저-가치 포지셔닝 1줄: *"Cautilus is the framework for discovering, evaluating, and improving agent behavior. It lets you pin down the behavior that matters, prove it survives every change to your prompts, skills, and models, and improve it within explicit budgets—whether you're protecting an AGENTS.md, a single skill, a prompt, or a full agent loop."* (도구 중심 아님; `docs/specs/index.spec.md` apex가 리드할 문장; 풀 비전 + proof badge proven/declared/promised로 eval-only 릴리스 경계 정직 표시.)
- **에픽** = 6 브랜치(Agent / setup / discover / eval / improve / Meta-Cross), ~2/브랜치 ~11개, 유저스토리 지향(도그마 아님).
- **클레임 = DAG (R15)**: 한 클레임이 여러 에픽을 `supportingEpics[]` facet으로 지지(many-to-many, acyclic) — tree 단일부모 폭정 제거, orphan 금지(엣지 ≥1). **단 아직 미실현**: grounding artifact `charness-artifacts/eval-trust/goldset-v2-agent-extraction/epic-tree-proposal.json`는 121→11 에픽·orphan 0이지만 **TREE form**.
- **측정 정정**: HITL은 precision/label/proof-route/tier를 잼, **recall은 못 잼**(추출 리스트를 읽어 놓친 걸 못 찾음 → 별도 probe 필요).

**컴팩트 후 고정 계획 (사용자 지시: 1–4 순차)**:
1. **DAG 실현** — `epic-tree-proposal.json`에 `supportingEpics[]` facet 도입, multi-epic 엣지 배속(모호 9건 + cross-actor README:68 "agent curates"=Agent+Discover). 모델을 말→데이터로.
2. **recall probe** — bounded 소스 구역 1개 골라 "있어야 할 클레임" 백지 독립 열거 → 에이전트 추출과 diff → false-negative 측정. 보조: 휴리스틱 미매치 diff(노이즈 주의).
3. **README/docs 유저-가치 재작성** — 현재 메커니즘 리드를 위 apex로 교체, `docs/specs/index.spec.md` apex + proof badge 배선("improve Cautilus as a product"와 직결).
4. **slice 3 impl** — 추출 템플릿이 per-claim facets `{audience, recommendedProof, tier/epic, supportingEpics[]}` 직접 방출 + proof-route 가이드 강화(R12: enabler가 static 계약→deterministic / agent 행동→cautilus-eval) + 55 그룹 → ~11 에픽 collapse. **drop/dedup 큐레이터는 deferred**(표본상 불필요 근거; 필요시 새 시임보다 review 시임 재사용).

권장 호출 프롬프트: `@docs/internal/handoff.md 핸드오프대로 진행합시다 — 고정한 1–4(DAG 실현 → recall probe → README 유저-가치 재작성 → slice3 facets 템플릿)를 진행해주세요.`

**대상/이월 자산**: HITL 세션 `hitl-20260611-082742` (표본 15/24 완료; 나머지 9개 선택: cli 86,91 / cdw 92,98,103,108,114 / cet 115,120; developer 트랙 171개 나중). 규칙 **R1–R15** (rules.yaml): R7 클레임 하나씩 / R8 우산 / R9 전제 / **R10 결정카드(검산포인트+추천+의심점, 5개 묶음 tally) / R11 리뷰 대상=클레임 진술(summary)이지 verbatim 아님 / R12 capability claim proof 라우팅(enabler 기준) / R13 significance(worth-proving) / R14 epic 트리 / R15 DAG-facet**. 골드셋 트랙: `gold-set-proposal.{user-product,developer}.json`. 세그먼트 도구: `scripts/segment-goldset-by-audience.mjs`(+test).
**제약**: push는 사용자 몫(의도적 보류). handoff/claim-source 편집 후 `npm run claims:refresh:all`. ground truth 전 큐레이션 빌드 금지. raw를 큐레이션 후 채점 금지(recall은 별도 probe). docs/internal/* 제외 금지. critique/fresh-eye 리뷰는 서브에이전트 위임.

**이전(2026-06-16 이전 pivot, 완료)**: `charness:debug`(charness-artifacts/debug/latest.md)가 292를 큐레이션-단계-부재 증상으로 진단 → ground-truth-first spec 비준(D1/D2/D3, 기록은 spec에 보존) → 위 HITL이 그 ground truth를 산출하며 "큐레이터 빌드?" 질문을 **"claim-graph 모델 fold"**로 대체. 이전 HITL `hitl-20260609-235609` superseded. 캘리브레이션 샘플([2026-06-10-agent-extraction-readme-sample.md](../../charness-artifacts/eval-trust/2026-06-10-agent-extraction-readme-sample.md))은 verdict 잣대로 유효.

## Current State (2026-06-10)

- **추출 계약 slice 1 출하** (commit `cb3994a`): `discover claims extraction-input` / `apply-extraction` 명령쌍 가동.
  input 패킷 = 소스+콘텐츠 해시, 임베디드 템플릿 v1(버전+해시, 병합된 classification_hints 포함), bounds, `--adapter <path>` 오버라이드(읽기 전용 형제 코퍼스용).
  apply = 결과 스키마/templateHash/소스 드리프트는 커맨드 레벨 실패, 앵커링·primary 정확히 1개·rune 바운드·중복 핑거프린트·스코프는 클레임 레벨 거부(`extractionAudit.rejectedClaims`에 기록, 절대 침묵 드롭 없음), `extractionMode: agent` proof-plan 합성.
- 핑거프린트 = sha256(정규화 primary verbatim 발췌)로 전 모드 통일, 휴리스틱 동치성 골든 테스트 고정.
  휴리스틱 패킷도 이제 `extractionMode: heuristic`을 명시(필드 부재 = heuristic 호환 읽기, 테스트 고정).
- `validate` 확장: 해시 일치 시 미앵커 발췌 = 하드 실패, 해시 드리프트 시 = stale-anchor finding(통과), agent 패킷은 `extractionAudit`로 audit-presence 충족(first-extraction), refresh 타깃은 carryForward도 요구.
- 검증: Go+node 전체 스위트, lint 체인, specdown 43 스펙 green. `docs/specs/user/claim-discovery.spec.md`에 실행 가능한 시임 섹션 추가(fixture 레포 라운드트립 run:shell 2블록).
- 위임 fresh-eye critique verdict **ready, 블로커 0** (계약 Critique 섹션에 기록).
- 남은 슬라이스 (2026-06-11 재서열): 게이트 설계 + docs 진실 갱신 → 새 골드셋(에이전트 추출 출력 HITL) → 2 에이전트 표면 → 3 refresh 합성(`extraction-input --previous`, carry-forward) → 4 비교 측정(새 골드셋 기준).
- S0 36-엔트리 골드셋 제안서는 superseded(33 미비준 엔트리 재생성 대기); HITL 규칙 R1–R6은 이월 자산.
- **push는 사용자 몫(의도적 보류).**

## Discuss

- 이 레포 `claims:refresh:all` 운영: agent-추출 모드에서 푸시 게이트가 "재생성"이 아니라 "유효성 검증 + staleness 보고"로 바뀌는 시점 — apply-extraction이 출하됐으므로 이제 결정 가능 (계약 Deferred Decisions).
- agent 패킷의 dogfood 출력 경로: 게이트 결정 전까지 `state_path` 회피 (계약에 명시).
- 템플릿 v1 프로즈 품질은 slice 4 비교 측정이 판정 — 측정 전 프로즈 다듬기는 추측이므로 보류.
- 심판 모델 고정값(sonnet) vs 제품 러너 정합/비용 (이월), harmony judge 배지 배선 (이월).

## References

- [docs/contracts/claim-extraction-template.md](../contracts/claim-extraction-template.md) — 추출 시임 빌드 컨트랙트 (canonical; slice 1 shipped 마킹됨)
- [골 아티팩트](../../charness-artifacts/goals/2026-06-10-adapter-owned-discovery-classification.md) — redesign 결정·슬라이스 로그·수용 기준
- [docs/specs/user/claim-discovery.spec.md](../specs/user/claim-discovery.spec.md) — 시임 실행 가능 스펙 (run:shell 라운드트립)
- [docs/contracts/claim-discovery-workflow.md](../contracts/claim-discovery-workflow.md) — 워크플로우 경계 (충돌 시 추출 시임 디테일은 새 계약이 우선)
- [S2 측정 아티팩트](../../charness-artifacts/eval-trust/2026-06-10-discovery-classification-s2-lexicon-proposal.md), [S1 베이스라인](../../charness-artifacts/eval-trust/2026-06-10-discovery-classification-s1-baseline.md) — 비교 하네스
