# Cautilus Handoff

## Workflow Trigger

권장 호출(다음 세션): `@docs/internal/handoff.md 핸드오프대로 진행합시다 — developer track 232 HITL을 시작해주세요. 시작 전 앵커 결정(developer 232를 새 HEAD로 재추출 vs 기존 line만 재번호)부터 확정.`

doc 멘션만으로 픽업하면 이 트리거의 workflow를 실행하세요(파일 재독만 하지 말 것).

## Current State

- **Apex-consistency sweep 완료 (2026-06-18, commits `8e61db5`+`d97485c`)**: 5개 서브에이전트 탐색 → 레포 전체를 잠긴 apex(`docs/specs/index.spec.md` proof-badge proven/declared/promised)에 정합. 외부 포지셔닝(README "What's Ready Today" 섹션 + package/plugin×2/marketplace metadata desc·keywords·defaultPrompt)을 eval-only→full discover/eval/improve 프레임워크로; transitional "during the contract rewrite" 프레이밍 standing 가드레일화(SKILL.md L28/67·release-boundary·version-provenance·specs/old banner); `linked Markdown`→`linked docs` 잔여(SKILL.md·master-plan·adapter epic title); deprecated `docs/claims/*.md` **retire**(live canonical-map은 docs/specs 인덱스 사용, scan 제외 확인). claim-discovery.spec bucketCount 6→7 sync(README +2줄 shift가 dogfood claim README:95 재키잉→needs-scenario). `verify`/drift/hooks green, bounded review **ready**.
- **그 전 (2026-06-18)**: doc-tightening+re-anchor(`3080482`/`36a3588`/`7c6ccda`), `linkedMarkdownDepth`→`linkedDocDepth` 리네임(legacy 키/필드 read-수용; Markdown-link **메커니즘** 식별자는 정밀어로 유지)·SKILL.md 정합(`a560cbb`). 상세 = `goldset-v2-head/ANCHOR.md`.
- **user-product 골드셋 = DONE**: 74/74 file-ratified. verdict·tier·rule은 `charness-artifacts/eval-trust/goldset-v2-head/`에 박제(`HITL-CLOSEOUT.md` + `gold-set-proposal.user-product.json`). verdict는 `claimFingerprint`로 이월.
- **defer된 것**: proposal/closeout의 line 앵커는 아직 `558cda7` 기준(재번호 미실행). developer-track 재추출 때 both-track 동시 재번호 — ANCHOR.md "Re-anchor status" 참조.

## 다음 세션: Developer track 232 HITL

1. **앵커 결정(시작 전)**: `gold-set-proposal.developer.json`(558cda7, doc-tightening으로 line-shifted)을 새 HEAD로 재추출(=defer된 line 재번호 실현, 권장) vs 기존 line만 재번호. user-product과 같은 공유 코퍼스 shift.
2. **HITL 실행**: epic-브랜치별 R10 결정카드 전수 리뷰. R1–R18 + verdict vocab(accept/relabel/not-a-claim/badly-bounded/retire-source/rewrite-source) 그대로. branch-staged apply+commit으로 verdict 파일 확정(working-state로 안 끝냄).
3. **그 다음**: cli.md recall probe(과분할 표면, 골드셋 무접근 fresh 서브에이전트). 전면 both-track 재생성.

## Discuss (열린 결정 / 이월 follow-up)

- **앵커 방식**: 위 1번 — 재추출(verdict는 fingerprint carry 필요, `build-gold-set-proposal`은 항상 pending 방출) vs 재번호(verdict 보존).
- **sweep 잔여(optional, needs-decision — 의도적 미적용)**: `AGENTS.md:9` "temporary product-planning notes while they are being rewritten"(영어-docs 예외 정책 문구라 유지); `.agents/release-adapter.yaml:19` Homebrew `brew uninstall` 마이그레이션 절(유지=정직한 마이그레이션 안내 vs README/cli처럼 drop); 계약 `claim-discovery-workflow.md:6` "not yet the workflow users expect"(결정론 discovery scope 서술 vs apex Claim Discovery=PROVEN); ledger/evidence "open gap" vs apex "proven"(user-vs-maintainer 2축 의도, optional 주석); `docs/specs/old/**` archived인데 run:shell proof 블록 여전(specdown 43 green이라 무해하나 inert 의도면 별도).
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
