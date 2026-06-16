# Cautilus Handoff

## Workflow Trigger

**진행 상태 (2026-06-17, 고정 계획 1–2 완료분)**: 292 골드셋을 `claimAudience`로 세그먼트(commit `1ecdf32`, user-product 121 + developer 171) → user-product HITL 표본 15/24 → 설계 수확을 spec에 fold(commit `adb488a`) → **DAG 실현(item 1, commit `6ecda96`)** + **recall probe(item 2, commit `2e5df6c`)** 완료, 둘 다 위임 fresh-eye critique(NEEDS CHANGES → 2블로커 반영: review-feedback→I1 과연결 제거, recall L8 두 번째 TRUE-FN 승격) 후 커밋 → **README/docs 유저-가치 재작성(item 3, surgical lead-swap)** 완료: README 리드 + `docs/specs/index.spec.md` apex를 락 apex로 정렬(index proof badge proven/declared/promised는 이미 배선됨), wrapper→models 일관화, eval-trust 스냅샷은 README@`d20e043`로 frozen(재-앵커는 slice 3). **다음: item 4(slice3 facets 템플릿).**

**핵심 수확 (292의 정체)**: 과다추출이 **아님**. = audience 혼합(분리완료) + 카운트 착시 + **flatness**(121 클레임에 `claimSemanticGroup` 55종, 근중복 다수) + **proof-route 라벨 ~20% 오류**(에이전트가 `human-auditable` 과배정 / `deterministic` 과신). → 에이전트는 클레임을 잘 찾되 **proof 라우팅이 약함.**

**비준된 모델 (rules R10–R15; 런타임 `.charness/hitl/runtime/hitl-20260611-082742` gitignored; durable = `charness-artifacts/hitl/latest.md`)**:
- **APEX (락)** = 유저-가치 포지셔닝 1줄: *"Cautilus is the framework for discovering, evaluating, and improving agent behavior. It lets you pin down the behavior that matters, prove it survives every change to your prompts, skills, and models, and improve it within explicit budgets—whether you're protecting an AGENTS.md, a single skill, a prompt, or a full agent loop."* (도구 중심 아님; `docs/specs/index.spec.md` apex가 리드할 문장; 풀 비전 + proof badge proven/declared/promised로 eval-only 릴리스 경계 정직 표시.)
- **에픽** = 6 브랜치(Agent / setup / discover / eval / improve / Meta-Cross), ~2/브랜치 ~11개, 유저스토리 지향(도그마 아님).
- **클레임 = DAG (R15) — 실현됨(item 1)**: `scripts/build-epic-dag.mjs`(+test, 결정론·재생성 idempotent)가 tree를 claim-centric DAG로 변환 → `epic-dag-proposal.json`(121 claims, orphan 0, multi-epic 엣지 **16개**, primaryEpic=tree home 보존, epicCoverage=supportingEpics 역함수). 16엣지 = 모호 그룹(review-feedback 제외) + cross-actor README:68; review-feedback 4개는 edge-audit로 싱글톤 D2 강등(진술-비근거 I1 추론 제거). **thin epic 신호**: A2-curation(2)·I1-improve(4) = 소스가 에이전트-큐레이션 actor와 improve 슬라이스를 과소문서화한다는 정직한 coverage gap(작도 artifact 아님).
- **측정 정정 → recall 1구역 측정됨(item 2)**: HITL은 precision/label/proof-route/tier만 잼(놓친 건 행이 없어 구조적으로 못 봄). `recall-probe-readme-1-70.{md,blind.json}` = 골드셋 무접근 fresh 서브에이전트가 README:1–70 백지 열거 → 전체 292와 diff. **결과**: 에이전트 최강 표면에서 assertion-recall 높음 — 21 claim-line 중 6개는 MERGE(2–4 assertion을 1 composite로 접음), genuine FN은 **2개(README:8 "agents are first-class users" 원칙 + README:30 "not for" 부정 경계)**, 둘 다 **원칙/경계 형태**(에이전트 blind spot = capability 아닌 principle/exclusion). 주의: n=1, 최강 표면이라 directional. cli.md(과분할 표면) 추가 probe 권장.

**고정 계획 (1–4 순차) — 진행 상태**:
1. ✅ **DAG 실현 (완료, commit `6ecda96`)** — `scripts/build-epic-dag.mjs`(+test) → `epic-dag-proposal.json`. 16 multi-epic 엣지, primaryEpic 보존, orphan 0. 위 "클레임=DAG" 항목 참조.
2. ✅ **recall probe (완료, commit `2e5df6c`)** — `recall-probe-readme-1-70.{md,blind.json}`. genuine FN 2개(원칙/경계 형태). 위 "측정 정정" 항목 참조.
3. ✅ **README/docs 유저-가치 재작성 (완료, surgical lead-swap)** — README 리드(L3–13)를 락 apex로 교체, `docs/specs/index.spec.md` apex를 락 apex로 정렬(proof badge proven/declared/promised는 이미 배선돼 있었음), wrapper→models 일관화. recall genuine FN 2종(README "agents are first-class users" 원칙 + "Not for …" 경계) 의도적 보존. README/handoff = claim source → `npm run claims:refresh:all` 실행. eval-trust 스냅샷(gold-set/epic-dag/recall-probe)은 README@`d20e043`로 frozen, 재-앵커는 slice 3.
4. ⏳ **slice 3 impl** — 추출 템플릿이 per-claim facets `{audience, recommendedProof, tier/epic, supportingEpics[]}` 직접 방출 + proof-route 가이드 강화(R12: enabler가 static 계약→deterministic / agent 행동→cautilus-eval) + 55 그룹 → ~11 에픽 collapse. **템플릿 추가 프롬프트(recall 수확)**: 설계-원칙 클레임("X is a first-class ...")과 부정/스코프-경계/배제 클레임("not for", "does not", "opt-in until")을 명시적으로 요구 — 측정된 blind spot 2종. **drop/dedup 큐레이터는 deferred**(표본상 불필요 근거; 필요시 새 시임보다 review 시임 재사용). md-148 비대칭(evaluate claims plan 명시하나 싱글톤)도 여기서 facets로 해소.

권장 호출 프롬프트: `@docs/internal/handoff.md 핸드오프대로 진행합시다 — 고정한 item 4(slice3 facets 템플릿: 추출 템플릿이 per-claim facets {audience, recommendedProof, tier/epic, supportingEpics[]} 방출 + 55그룹→~11에픽 collapse + R12 proof-route 강화 + 원칙·부정/경계 claim 프롬프트)를 진행해주세요.`

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
