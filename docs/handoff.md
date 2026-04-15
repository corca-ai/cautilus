# Cautilus Handoff

이 문서는 다음 세션이 바로 이어야 할 한 수만 남긴다.
장기 누적 운영 패턴은 [docs/working-patterns.md](./working-patterns.md) 가 source of truth — 세션 bookkeeping 과 분리한다.

## Workflow Trigger

다음 세션이 이 핸드오프를 멘션하면:

1. **먼저 읽기**: [README.md](../README.md), [AGENTS.md](../AGENTS.md), [docs/specs/html-report.spec.md](./specs/html-report.spec.md), [docs/operator-acceptance.md](./operator-acceptance.md) Tier 6b, [docs/working-patterns.md](./working-patterns.md).
2. **바로 착수할 작업**: HTML report spec 을 specdown 스타일로 impl 과 co-evolve.
   `html-report.spec.md` 의 "다음 세션 확장 순서" 섹션이 authoritative 6-step roadmap.
3. **스킬 사용**: `charness:find-skills` 로 `charness:support/specdown` + `charness:spec` 접근성 먼저 확인.
   실패 시 fallback — `/home/hwidong/codes/specdown/internal/specdown/reporter/html/` 직접 read (스킬은 편의 도구이지 블로커가 아니다).
4. **패턴 발동 모델**: [working-patterns.md](./working-patterns.md) 참고.
   premortem · 카운터웨이트 · iterative premortem 은 사용자가 명시적으로 요청할 때만.

## Current State

2026-04-15~16 세션 완료.
랜딩 리드미 재작성 + 구조 분할 + semantic line break 정책 + Tier 6 Promotion Readiness + HTML report seed spec 까지.

### 이번 세션 커밋 (모두 `origin/main` 푸시 완료)

```
c028a7a Apply premortem fixes before push
eaeb9b0 Spec the HTML report surface as the human-review promise in README
6846ebd Extend semantic line breaks to docs/contracts/ and remaining docs prose
8c43d3a Adopt semantic line breaks for landing-surface prose markdown
2aaafd1 Realign specs and README phrasing after rewrite
e88525e Rewrite README as a landing page for internal promo and OSS discovery
ae9b57e Split CLI catalog, dev workflow, and GEPA deep-dive out of README
b41a72e Capture README rewrite research and refined structure decision
```

이 핸드오프 커밋 + `docs/working-patterns.md` spill + `.agents/handoff-adapter.yaml` 은 unpushed.

### 모든 gate 녹색

- `npm run verify` (eslint + specs + archetypes + links + go race + node)
- `npm run hooks:check`
- 608 spec guard rows across 6 specs (html-report.spec.md seed 포함)
- 97 link files
- 3 archetype × 11 surface
- distribution-surface 16 assertion

### charness 이슈 4건

- [#26 narrative](https://github.com/corca-ai/charness/issues/26) — audience-first, comparables research, tension/decision log, truth-claim audit, compression metric + self-premortem sub-step (코멘트).
- [#27 quality + init-repo](https://github.com/corca-ai/charness/issues/27) — brittle fixed-string assertion + prose-wrap policy + "fix includes tool" (코멘트).
- [#30 init-repo inspector](https://github.com/corca-ai/charness/issues/30) — case-insensitive matching + adapter path override.
- [#31 find-skills](https://github.com/corca-ai/charness/issues/31) — named-skill trigger 강화 + return payload 풍부화.

## Next Session

### 1순위 — HTML report spec ↔ impl co-evolve

[html-report.spec.md](./specs/html-report.spec.md) 가 authoritative roadmap.
6-step 요약:

1. `charness:find-skills` 로 `charness:spec` + `charness:support/specdown` 접근성 확인. 실패 시 specdown 리포 직접 읽기 fallback.
2. Claim 1–2 (self-dogfood) 보강 — 기존 `internal/runtime/self_dogfood_html.go` 에 페이지 내 TOC + 링크 rewriting + 상태 색상 단언.
3. Claim 3 (mode evaluate report) — 가장 가치 큼. 새 렌더러 (`cautilus report render-html` 또는 `cautilus mode evaluate --emit-html`).
4. Claim 4–5 (review packet, review variants summary) — 3의 패턴 재사용.
5. Claim 6–8 (compare, scenario proposal, evidence) — 순차.
6. Claim 9 (글로벌 TOC 통합) — 집계층, 개별 artifact HTML 이 최소 하나 구현된 후.

각 단계는 spec row 추가 → `npm run lint:specs` fail → impl → pass 의 tight loop.
commit 당 claim 하나 권장.

### 2순위 — 1순위 끝난 후 또는 사용자 지정

- **UNINSTALL.md** — Cautilus 가 uninstall 계약을 가질지 결정 후 작성.
  현재 `install.md` "Current Boundaries" 가 관련 내용을 약식으로 담음.
  charness #30 inspector 가 case-insensitive + adapter override 로 고쳐지면 false-positive 부담 줄어 우선순위 낮음.
- **`reformat-prose.mjs` 를 `npm run` 에 노출** — `fix:prose` (apply) + `lint:prose` (check-only, CI-appropriate) pair.
  다음 prose fragility 가 재발하면 그때 승격 권장, 지금은 orphan 유지.
- **Master Plan Immediate Next Moves** (이월):
  (1) 최적화 레이어 다음 bounded improvement seam (dogfood 증거 요구 시),
  (2) scenario-history 확장 — unlock trigger 대기 ([scenario-history.md § Deferred Expansion](./contracts/scenario-history.md)),
  (5) starter kit 실사용 pain 정리.

### 영구 drop (예전 세션 결정 유지)

D, B, M, I, H, G, J, L, C, Validator subset 확장, `MustBehaviorSurface` 재도입.

## Discuss

- **HTML compare artifact (claim 6) 설계 미결**: baseline/candidate 를 "두 개의 report.html 을 나란히 iframe" vs "diff 전용 페이지" — specdown 에 이 패턴이 없어 선행 사례 없음.
  다음 세션이 초안 정함.
- **charness 이슈 impl 순서**: 내가 구현한다면 `#31 find-skills` 가 support 스킬 발견성에 제일 직접적.
  단 charness 리포 작업이라 Cautilus 세션과는 분리.
- **의도적으로 안 하는 것** (유지):
  한국어 `README.ko.md`, JSON 키 순서 통일, Node shim for air-gapped consumers, SKILL.md → `docs/` upward 링크 (SKILL.md self-contained 관습), `cautilus.behavior_intent` 스키마 bump, scenario-history 두 조각 확장 (trigger 대기), 새 starter smoke 자동화, Homebrew managed smoke CI 편입, Admin web UI / scenario persistence UI / runtime-log mining / host-specific prompt benchmark profiles (current-product.spec.md 가 명시적 제외).

## References

- [README.md](../README.md)
- [AGENTS.md](../AGENTS.md)
- [docs/master-plan.md](./master-plan.md)
- [docs/working-patterns.md](./working-patterns.md) — 누적 운영 패턴 + premortem hazards
- [docs/specs/index.spec.md](./specs/index.spec.md)
- [docs/specs/html-report.spec.md](./specs/html-report.spec.md) — ★ 다음 세션 primary target
- [docs/specs/archetype-boundary.spec.md](./specs/archetype-boundary.spec.md)
- [docs/specs/current-product.spec.md](./specs/current-product.spec.md)
- [docs/operator-acceptance.md](./operator-acceptance.md) — Tier 6b 참조
- [docs/readme-research.md](./readme-research.md) — 2026-04-15 README 재작성 decision log
- [docs/contracts/scenario-history.md](./contracts/scenario-history.md) (§ Deferred Expansion)
- [scripts/reformat-prose.mjs](../scripts/reformat-prose.mjs) — semantic-wrap 강제 도구
- charness 이슈 [#26](https://github.com/corca-ai/charness/issues/26), [#27](https://github.com/corca-ai/charness/issues/27), [#30](https://github.com/corca-ai/charness/issues/30), [#31](https://github.com/corca-ai/charness/issues/31)
- `/home/hwidong/codes/specdown/internal/specdown/reporter/html/` (sibling repo, 링크 아님) — HTML reporter 참조 구현. 1:1 port 아님, 패턴·시각 언어만 차용.
