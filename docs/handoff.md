# Cautilus Handoff

이 문서는 다음 세션이 바로 이어야 할 한 수만 남긴다.

## Workflow Trigger

- 다음 세션에서 이 문서를 멘션하면 먼저
  [README.md](../README.md),
  [AGENTS.md](../AGENTS.md),
  [docs/master-plan.md](./master-plan.md),
  [docs/specs/current-product.spec.md](./specs/current-product.spec.md),
  [docs/contracts/optimization-search.md](./contracts/optimization-search.md),
  [scripts/agent-runtime/optimize-search-core.mjs](../scripts/agent-runtime/optimize-search-core.mjs),
  [scripts/agent-runtime/optimize-search-mutation.mjs](../scripts/agent-runtime/optimize-search-mutation.mjs),
  [scripts/agent-runtime/optimize-search-merge.mjs](../scripts/agent-runtime/optimize-search-merge.mjs),
  [scripts/agent-runtime/optimize-search-flow.test.mjs](../scripts/agent-runtime/optimize-search-flow.test.mjs)
  를 읽는다.
- 시작 branch는 현재 `main`이다.
- product-owned seam이면 `cautilus`에서 먼저 고친다.

## Current State

- release hardening now includes two product-owned post-release helpers:
  - `npm run release:verify-public -- --version <tag>`
  - `npm run release:smoke-install -- --channel install_sh --version <tag>`
- external consumer onboarding now has:
  - [docs/external-consumer-onboarding.md](./external-consumer-onboarding.md)
  - `npm run consumer:onboard:smoke`
  - the smoke helper proves `install -> adapter init -> minimal runnable adapter
    wiring -> adapter resolve -> doctor ready` in a temp git repo
- release hardening now includes a product-owned public verification helper:
  - `npm run release:verify-public -- --version <tag>`
  - it verifies the tagged GitHub release asset matrix, checksum assets,
    rendered `Cautilus.rb`, release notes, and published Homebrew tap formula
- latest public release `v0.3.0` passes the new public verification helper.
- `Cautilus`의 GEPA-style optimize search는 이제 rejected sibling checkpoint
  signal을 merge selection, mutation parent ordering, reflection batch ordering
  모두에서 direct policy로 해석한다.
- self-dogfood claim surface를 dogfood evidence 기준으로 다시 좁혔다.
  - root standing gate adapter는 이제 standalone binary / bundled skill
    전체를 암시하지 않고 `deterministic self-consumer standing gate`로
    스코프를 제한한다.
  - gate-honesty / review-completion / skill-surface experiment prompts는
    claim boundary, timeout enforcement, published latest bundle artifact를
    더 직접 보게 된다.
  - skill-surface experiment timeout은 `30000ms`로 완화했다.
- 지금 닫힌 핵심:
  - reflective mutation + multi-generation Pareto frontier
  - frontier-promotion review feedback reinjection
  - scenario-scoped checkpoint feedback의 다음 reflection batch 우선순위 반영
  - concern-level rejected lineage의 다음 mutation batch repair-first 우선화
  - finding-level severity를 보존한 scenario-level reflection ordering
  - bounded 2-3 parent merge + `threeParentPolicy`
  - rejected sibling scenario-scoped checkpoint feedback의 merge selection weighting 반영
  - rejected sibling scenario-scoped checkpoint severity-aware merge
    tie-breaking
  - selection-cap public reason codes
  - concern/blocker 2-bucket pruning
  - final-only full-gate fallback
- optimize-search `v2`로 보던 최소 기준은 사실상 닫혔다.
  - checkpoint rejection이 단순 prompt context나 weighting이 아니라
    merge/mutation decision policy에도 명시적으로 반영된다.
- latest canonical self-dogfood published bundle는 `pass / accept-now` 상태다.
  - [artifacts/self-dogfood/latest/summary.json](../artifacts/self-dogfood/latest/summary.json)
- latest self-dogfood experiments bundle는 `pass / accept-now` 상태다.
  - [artifacts/self-dogfood/experiments/latest/summary.json](../artifacts/self-dogfood/experiments/latest/summary.json)
  - `gate-honesty-b`는 이제 baseline `origin/main` claim excerpt를 prompt에
    같이 넣어 current candidate가 baseline보다 더 좁고
    evidence-proportional하다는 비교를 직접 통과한다.
- 최근 관련 커밋:
  - `2393cf9` Preserve checkpoint severity in reflection feedback
  - `9cc12a3` Prioritize rejected mutation repairs under tight budget
  - `ade8bfa` Respect checkpoint severity in merge parent selection
  - `df9b4d1` rejected sibling signals bias merge selection
  - `fe99139` checkpointed scenarios prioritized in repair
  - `ff07f6b` pruning stays bounded to concern/blocker
  - `3943bd4` selection-cap reason codes stabilized
  - `95fd2fd` three-parent policy exposed

## Last Verified

- `npm run verify`
- `npm run hooks:check`
- `npm run release:verify-public -- --version v0.3.0`
- `npm run release:smoke-install -- --channel install_sh --version v0.3.0`
- `npm run consumer:onboard:smoke`
- `npm run dogfood:self`
- `npm run dogfood:self:experiments`

## Next Session

1. optimize-search `v2`는 implementation/evidence 둘 다 닫힌 slice로 보고,
   다음 bounded improvement seam을 고른다.
2. 우선순위 질문:
   - richer merge heuristics가 실제로 필요한지
   - 아니면 optimize-search contract를 유지하고 다른 roadmap slice로
     넘어갈지
3. 다음 slice를 고른 뒤 `npm run verify`, `npm run hooks:check`를 다시 닫는다.
4. release/consumer hardening 다음 후보:
   - Homebrew install smoke를 실제 managed helper로 더 다듬을지
   - external consumer onboarding smoke를 archetype-specific starter kits로
     넓힐지

## Discuss

- 현재 판단:
  - optimize-search `v2`는 닫혔다고 봐도 된다.
  - 더 나아가려면 이제 contract 확장보다 dogfood evidence가 먼저다.
  - self-dogfood canonical surface는 충분히 정직해졌고, stronger claim
    experiments도 모두 green이다.
- 아직 열려 있는 질문:
  - richer merge heuristics가 실제로 필요한지
  - 아니면 현재 bounded search seam을 유지하고 다른 roadmap slice로 넘어갈지
- 아직 의도적으로 안 하는 것:
  - multi-prompt or multi-component coupled updates
  - fine-tuning or trainer orchestration
  - consumer prompt auto-apply

## Premortem

- 가장 쉬운 오해: optimize-search seam을 더 만지는 것이 자동으로 다음 최선의
  수라는 해석.
  아니다. 이제는 evidence 없이 heuristic만 더 얹을 위험이 더 크다.
- 다음 세션에서 가장 쉬운 실수:
  optimize-search `v2`가 이미 닫혔는데도 self-dogfood evidence 정리를
  또 같은 seam에서 반복하는 것.
  다음 수는 이제 남은 heuristic 필요성을 확인하거나 다른 roadmap slice로
  이동하는 쪽이다.
- optimize-search 쪽에서도 merge heuristics를 넓히면서 다시 packet
  boundary를 흔들면 안 된다.
  다음 slice는 먼저 dogfood evidence가 진짜 부족한 heuristic을 가리키는지
  확인하는 편이 맞다.

## References

- [README.md](../README.md)
- [docs/master-plan.md](./master-plan.md)
- [docs/specs/current-product.spec.md](./specs/current-product.spec.md)
- [docs/contracts/optimization-search.md](./contracts/optimization-search.md)
- [scripts/agent-runtime/optimize-search-core.mjs](../scripts/agent-runtime/optimize-search-core.mjs)
- [scripts/agent-runtime/optimize-search-mutation.mjs](../scripts/agent-runtime/optimize-search-mutation.mjs)
- [scripts/agent-runtime/optimize-search-merge.mjs](../scripts/agent-runtime/optimize-search-merge.mjs)
- [scripts/agent-runtime/optimize-search-flow.test.mjs](../scripts/agent-runtime/optimize-search-flow.test.mjs)
