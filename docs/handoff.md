# Cautilus Handoff

이 문서는 다음 세션이 바로 이어야 할 한 수만 남긴다.
장기 누적 운영 패턴은 [docs/working-patterns.md](./working-patterns.md) 가 source of truth — 세션 bookkeeping 과 분리한다.

## Workflow Trigger

다음 세션이 이 핸드오프를 멘션하면:

1. **먼저 읽기**: [README.md](../README.md), [AGENTS.md](../AGENTS.md), [docs/master-plan.md](./master-plan.md), [docs/operator-acceptance.md](./operator-acceptance.md) Tier 6b, [docs/working-patterns.md](./working-patterns.md).
2. **바로 착수할 작업**: 아래 `Next Session` 1순위 — HTML report 를 브라우저에서 실제로 열어 보는 사람 판정 패스 + 2순위 중 사용자 지정 항목.
3. **패턴 발동 모델**: [working-patterns.md](./working-patterns.md) 참고.
   premortem · 카운터웨이트 · iterative premortem 은 사용자가 명시적으로 요청할 때만.

## Current State

2026-04-16 세션 완료.
HTML report claim 1–9 전부 승격 — spec ↔ impl co-evolve tight loop 로 9 commit 누적.

### 이번 세션 커밋 (모두 unpushed; 사용자가 push 시점 결정)

```
899560b Add run-index aggregator for claim 9
066f281 Add HTML renderers for compare, scenario proposals, and evidence
16d4d88 Add HTML renderers for review packet and review variants summary
c9ab378 Add cautilus report render-html for claim 3
b134e50 Promote self-dogfood experiments HTML to claim 2 executable rows
06428b6 Promote self-dogfood HTML to claim 1 executable rows
```

이 핸드오프 commit + operator-acceptance / spec seed-label 제거 commit 추가 필요.

### HTML report 표면 전체

신규 CLI 7개 (모두 `cautilus ... --input <json> [--output <html>]` 패턴):

- `cautilus report render-html`
- `cautilus review render-html`
- `cautilus review render-variants-summary-html`
- `cautilus workspace render-compare-html`
- `cautilus scenario render-proposals-html`
- `cautilus evidence render-html`
- `cautilus artifacts render-index-html --run-dir <path>`

Self-dogfood 기존 두 개 (`self-dogfood render-html`, `self-dogfood render-experiments-html`) 는 claim 1–2 guard 로 잠긴 상태로 살아 있음.

### 모든 gate 녹색 (커밋 직후 기준)

- `npm run verify` (eslint + specs + archetypes + links + go race + node)
- `npm run hooks:check`
- 677 spec guard rows across 6 specs (이번 세션에 +71 승격)
- 98 link files
- 3 archetype × 11 surface

### charness 이슈 4건 (변동 없음)

- [#26 narrative](https://github.com/corca-ai/charness/issues/26), [#27 quality + init-repo](https://github.com/corca-ai/charness/issues/27), [#30 init-repo inspector](https://github.com/corca-ai/charness/issues/30), [#31 find-skills](https://github.com/corca-ai/charness/issues/31).

## Next Session

### 1순위 — HTML report 인간 판정 패스

operator-acceptance Tier 6b (6.13–6.21) 를 사람이 브라우저에서 실제로 연다.
자동 guard 는 렌더러/핸들러/CLI 등록 생존만 확인 — 시각 품질은 사람만 본다.
판단 결과는 별도 기록 필요 (승/보류/거부).

권장 시나리오:

1. 실제 run 을 하나 만든다 (`cautilus report build --input fixtures/reports/report-input.json` 등).
2. 각 render 명령으로 HTML 을 생성한다.
3. `cautilus artifacts render-index-html --run-dir <path>` 로 글로벌 TOC 를 띄운다.
4. 브라우저에서 index.html 을 열고 사이드바를 타고 모든 artifact HTML 을 훑는다.
5. 각 항목에서 상태 chip 의 정확성 + 링크 rewriting 의 끊김 없음을 확인한다.

### 2순위 — 사용자 지정 또는 누적 이월

- **UNINSTALL.md** — Cautilus 가 uninstall 계약을 가질지 결정 후 작성.
  현재 `install.md` "Current Boundaries" 가 약식으로 담음.
- **`reformat-prose.mjs` 를 `npm run` 에 노출** — `fix:prose` (apply) + `lint:prose` (check-only, CI-appropriate) pair.
  prose fragility 재발 시 승격 권장, 지금은 orphan 유지.
- **Master Plan Immediate Next Moves** (이월):
  (1) 최적화 레이어 다음 bounded improvement seam (dogfood 증거 요구 시),
  (2) scenario-history 확장 — unlock trigger 대기 ([scenario-history.md § Deferred Expansion](./contracts/scenario-history.md)),
  (5) starter kit 실사용 pain 정리.
- **mode evaluate --emit-html 통합** — 현재는 `cautilus report build` → `cautilus report render-html` 두 단계.
  자주 쓰이면 `--emit-html` 플래그로 one-shot 승격 고려.
  지금은 wrapper script 가 대신 묶을 수 있으므로 급하지 않음.

### 영구 drop (예전 세션 결정 유지)

D, B, M, I, H, G, J, L, C, Validator subset 확장, `MustBehaviorSurface` 재도입.

## Discuss

- **Compare artifact iframe vs single diff page**: 이번 세션이 단일 diff 페이지로 확정 (claim 6 rationale 커밋 메시지 + spec 에 기록).
  baseline/candidate report.html 동거를 가정할 수 없어서 iframe 은 부서지기 쉽다는 이유.
  사용자가 iframe 경험을 원하면 재고 여지는 있음.
- **charness 이슈 impl 순서**: `#31 find-skills` 가 support 스킬 발견성에 제일 직접적 (변동 없음).
  단 charness 리포 작업이라 Cautilus 세션과는 분리.
- **의도적으로 안 하는 것** (유지):
  한국어 `README.ko.md`, JSON 키 순서 통일, Node shim for air-gapped consumers, SKILL.md → `docs/` upward 링크 (SKILL.md self-contained 관습), `cautilus.behavior_intent` 스키마 bump, scenario-history 두 조각 확장 (trigger 대기), 새 starter smoke 자동화, Homebrew managed smoke CI 편입, Admin web UI / scenario persistence UI / runtime-log mining / host-specific prompt benchmark profiles.

## References

- [README.md](../README.md)
- [AGENTS.md](../AGENTS.md)
- [docs/master-plan.md](./master-plan.md)
- [docs/working-patterns.md](./working-patterns.md) — 누적 운영 패턴 + premortem hazards
- [docs/specs/index.spec.md](./specs/index.spec.md)
- [docs/specs/html-report.spec.md](./specs/html-report.spec.md) — claim 1–9 guard block 이 모두 승격 완료
- [docs/operator-acceptance.md](./operator-acceptance.md) — Tier 6b (6.13–6.21)
- [docs/specs/archetype-boundary.spec.md](./specs/archetype-boundary.spec.md)
- [docs/specs/current-product.spec.md](./specs/current-product.spec.md)
- [docs/contracts/scenario-history.md](./contracts/scenario-history.md) (§ Deferred Expansion)
- charness 이슈 [#26](https://github.com/corca-ai/charness/issues/26), [#27](https://github.com/corca-ai/charness/issues/27), [#30](https://github.com/corca-ai/charness/issues/30), [#31](https://github.com/corca-ai/charness/issues/31)
