# Cautilus Handoff

## Workflow Trigger

권장 호출(다음 세션): `@docs/internal/handoff.md 핸드오프대로 진행합시다 — developer track 232 HITL을 시작해주세요. 시작 전 앵커 결정(developer 232를 새 HEAD로 재추출 vs 기존 line만 재번호)부터 확정.`

doc 멘션만으로 픽업하면 이 트리거의 workflow를 실행하세요(파일 재독만 하지 말 것).

## Current State

- **Doc-tightening + re-anchor 완료 (2026-06-18)**: HITL-CLOSEOUT §A source 편집(commit `3080482`) → claim-packet refresh(`36a3588`, isStale=false) → ANCHOR.md re-anchor 기록(`7c6ccda`). README/cli 릴리스-경계 disclaimer·stale Homebrew 제거, README:54 trim, `linked Markdown`→`linked docs`를 **전 산문 표면**(README/maintainer-facing/계약/spec)에 적용. `verify`·`hooks:check`·`generated:drift:check` green.
- **user-product 골드셋 = DONE**: 74/74 file-ratified. verdict·tier·rule은 `charness-artifacts/eval-trust/goldset-v2-head/`에 박제(`HITL-CLOSEOUT.md` + `gold-set-proposal.user-product.json`). verdict는 `claimFingerprint`로 이월.
- **defer된 것**: proposal/closeout의 line 앵커는 아직 `558cda7` 기준(재번호 미실행). developer-track 재추출 때 both-track 동시 재번호 — ANCHOR.md "Re-anchor status" 참조.

## 다음 세션: Developer track 232 HITL

1. **앵커 결정(시작 전)**: `gold-set-proposal.developer.json`(558cda7, doc-tightening으로 line-shifted)을 새 HEAD로 재추출(=defer된 line 재번호 실현, 권장) vs 기존 line만 재번호. user-product과 같은 공유 코퍼스 shift.
2. **HITL 실행**: epic-브랜치별 R10 결정카드 전수 리뷰. R1–R18 + verdict vocab(accept/relabel/not-a-claim/badly-bounded/retire-source/rewrite-source) 그대로. branch-staged apply+commit으로 verdict 파일 확정(working-state로 안 끝냄).
3. **그 다음**: cli.md recall probe(과분할 표면, 골드셋 무접근 fresh 서브에이전트). 전면 both-track 재생성.

## Discuss (열린 결정 / 이월 follow-up)

- **앵커 방식**: 위 1번 — 재추출(verdict는 fingerprint carry 필요, `build-gold-set-proposal`은 항상 pending 방출) vs 재번호(verdict 보존).
- **`linkedMarkdownDepth` 리네임**: 산문은 'linked docs'로 통일됐지만 스키마 필드 + `scripts/agent-runtime/render-claim-status-report.mjs:342` "linked Markdown depth" 라벨 + flow-log 테스트 3개는 유지(브레이킹 리네임=doc-tightening 범위 밖). doc↔라벨 mismatch는 의도적 deferral — 별도 게이트로 처리할지 결정.
- **cautilus-agent SKILL.md 코히런스**: 3개 미러 SKILL.md L9가 README가 방금 뺀 "during the current contract rewrite … remain opt-in" disclaimer를 아직 보유. cautilus-agent 변경 게이트(consumer-intent freeze + progressive-disclosure quality) 필요해 §A 범위 제외. 정합시킬지 결정.
- 심판 모델 고정값(sonnet) vs 제품 러너 정합/비용 (이월), harmony judge 배지 배선 (이월).

## 핵심 수확·비준 모델 (pointer — 상세는 `HITL-CLOSEOUT.md`)

- **292의 정체**: 과추출 아님 = audience 혼합 + 카운트 착시 + flatness + proof-route 라벨 ~20% 오류(에이전트는 클레임은 잘 찾되 proof 라우팅 약함).
- **모델**: APEX(유저-가치 1줄, `docs/specs/index.spec.md`) / 6 에픽 브랜치 / 클레임=DAG(`scripts/build-epic-dag.mjs`→`epic-dag-proposal.json`, 16 multi-epic 엣지) / recall blind spot=원칙·경계 2종. R1–R18 durable 전문=`HITL-CLOSEOUT.md`, 런타임 rules.yaml=`hitl-userprod-v2head-20260617`.

## 제약

push는 사용자 몫(의도적 보류). claim-source 편집 후 `npm run claims:refresh:all`. ground truth 전 큐레이션 빌드 금지. raw를 큐레이션 후 채점 금지(recall은 별도 probe). docs/internal/* 제외 금지. critique/fresh-eye 리뷰는 서브에이전트 위임.

## References

- `charness-artifacts/eval-trust/goldset-v2-head/` — 비준 골드셋 + `HITL-CLOSEOUT.md`(R1–R18, harvest) + `ANCHOR.md`(re-anchor status). developer 232 = `gold-set-proposal.developer.json`.
- `scripts/build-gold-set-proposal.mjs`·`segment-goldset-by-audience.mjs`·`build-epic-dag.mjs`(전부 +test) — 골드셋·세그먼트·DAG 도구.
- `docs/contracts/claim-extraction-template.md`·`docs/contracts/claim-discovery-workflow.md` — 추출 시임·워크플로우 계약.
- `docs/master-plan.md` — 로드맵.
