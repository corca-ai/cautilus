# Cautilus Handoff

## Workflow Trigger

- 다음 세션에서 이 문서를 멘션하면 먼저 [README.md](/home/ubuntu/cautilus/README.md), [AGENTS.md](/home/ubuntu/cautilus/AGENTS.md), [docs/master-plan.md](/home/ubuntu/cautilus/docs/master-plan.md), [docs/workflow.md](/home/ubuntu/cautilus/docs/workflow.md), [skills/cautilus/SKILL.md](/home/ubuntu/cautilus/skills/cautilus/SKILL.md)을 읽는다.
- 시작 workflow는 `impl` 기준이다. 다만 plugin/install surface를 건드리면 packaging shape를 먼저 짧게 정리한 뒤 구현으로 들어간다.
- 작업 시작 repo는 항상 [cautilus](/home/ubuntu/cautilus) 이다. consumer repo 검증은 새 surface를 붙인 뒤 spot-check 용도로만 쓴다.
- product-owned seam이면 `cautilus`에서 먼저 고친다. host adapter, prompt, policy, consumer artifact 문제는 해당 consumer repo 소유다.

## Current State

- `Cautilus`는 현재 standalone binary + bundled skill 경계를 이미 상당 부분 닫았다.
  - `workspace prepare-compare`
  - `workspace prune-artifacts`
  - `mode evaluate`
  - `review variants`
  - `cli evaluate`
  - `scenario normalize chatbot|cli|skill`
  - `scenario prepare-input`
  - `scenario propose`
  - `scenario summarize-telemetry`
  - `evidence prepare-input`, `evidence bundle`
  - `optimize prepare-input`, `optimize propose`
- Codex install surface의 최소 골격도 이제 repo root에 들어갔다.
  - [.codex-plugin/plugin.json](/home/ubuntu/cautilus/.codex-plugin/plugin.json)
  - [.agents/plugins/marketplace.json](/home/ubuntu/cautilus/.agents/plugins/marketplace.json)
  - `skills/cautilus/SKILL.md` 는 installable skill 규약용 frontmatter를 가진다.
- product-facing 문서는 repo-agnostic surface vocabulary로 정리돼 있다. repo 이름은 migration/evidence appendix 쪽으로 내렸다.
- scenario-history 첫 runtime integration은 이미 들어갔다.
  - profile-backed mode run에서 scenario selection/history update 수행
  - profile-backed comparison run에서 baseline cache seed와 cache key materialization 수행
- 로그/용량 쪽의 첫 제품 대응도 들어갔다.
  - [prune-workspace-artifacts.mjs](/home/ubuntu/cautilus/scripts/agent-runtime/prune-workspace-artifacts.mjs)
  - `cautilus workspace prune-artifacts --root <dir> --keep-last <n> [--max-age-days <n>] [--dry-run]`
  - 현재 철학은 `log rotate`보다 `artifact-root pruning` 이다.
- 현재 남아 있는 실제 gap은 “run artifact를 어떻게 자동으로 구조화할지”와 “Codex surface 다음으로 Claude surface까지 어떻게 맞출지”다.
- 최근 핵심 커밋:
  - `97c5d93` `Wire scenario history into mode evaluation`
  - `4a3e906` `Materialize comparison baseline cache seeds`
  - `0f2c7ad` `Add workspace artifact pruning helper`
- 현재 `npm run lint`, `npm run test`, `npm run verify` 는 다시 통과한 상태다.

## Next Session

1. artifact-root story를 자동화할지 결정한다.
   - 가장 유력한 다음 slice는 `mode evaluate` / `review variants` 에 `--artifact-root` 또는 equivalent option을 넣어서 매 run마다 timestamped subdirectory를 자동 생성하게 하는 것이다.
   - 지금 `prune-artifacts`는 이미 있지만, run dir naming/layout은 아직 operator 책임이다.
2. Codex install surface를 실제로 한 번 읽어서 local install/readiness를 spot-check 한다.
   - 현재 repo root가 Codex plugin root 역할을 한다.
     - [.codex-plugin/plugin.json](/home/ubuntu/cautilus/.codex-plugin/plugin.json)
     - [.agents/plugins/marketplace.json](/home/ubuntu/cautilus/.agents/plugins/marketplace.json)
   - OpenAI 공식 문서 https://developers.openai.com/codex/plugins/build 기준으로 현재 shape가 깨지지 않는지만 확인하면 된다.
3. Claude Code target을 추가한다.
   - `/home/ubuntu/claude-plugins` 레포의 실제 shape를 참조한다.
   - 특히 [/home/ubuntu/claude-plugins/plugins/cwf/.claude-plugin/plugin.json](/home/ubuntu/claude-plugins/plugins/cwf/.claude-plugin/plugin.json) 과 [/home/ubuntu/claude-plugins/.claude-plugin/marketplace.json](/home/ubuntu/claude-plugins/.claude-plugin/marketplace.json) 을 참고해 Claude install surface를 맞춘다.
   - 목표는 Codex CLI와 Claude Code 양쪽에서 실제 설치 가능한 product surface를 갖추는 것이다.
4. plugin/install surface를 설계할 때 host coupling을 피한다.
   - `cautilus` plugin/package 안에는 repo-agnostic product assets만 넣는다.
   - consumer-specific adapter, prompt, output path, policy는 넣지 않는다.
5. packaging 다음 slice는 아래 순서가 맞다.
   - minimal Claude plugin package
   - local install/readiness check
   - 필요하면 README / standalone spec / handoff 동기화
6. 제품 변경 후에는 항상 `npm run lint`, `npm run test`, `npm run verify` 를 다시 돌린다.

## Discuss

- `prune-artifacts` 다음으로는 `artifact-root auto layout` 이 가장 자연스러운 후속이다.
- plugin/install surface는 이제 deferred가 아니라 실제 roadmap item으로 올려야 한다.
- Codex 쪽 minimal package는 이제 들어갔으므로, 다음 판단 포인트는 Claude 쪽도 같은 제품 경계로 묶을지와 local install smoke check를 어디까지 자동화할지다.
- Claude Code / Codex CLI 둘 다에서 설치 가능한 surface를 만들되, product noun은 여전히 `Cautilus` 하나로 유지해야 한다.

## Premortem

- 다음 세션에서 가장 쉬운 오해는 `workspace prune-artifacts`가 이미 artifact layout까지 해결했다고 생각하는 것이다.
  실제로는 pruning helper만 생겼고, run directory naming/creation policy는 아직 없다.
- 또 다른 쉬운 오해는 Codex plugin 골격이 들어갔으니 install story 전체가 끝났다고 보는 것이다.
  지금은 Codex repo-local surface만 최소한으로 생겼고, Claude surface와 실제 install smoke check는 아직 남아 있다.
- Claude용 packaging을 만들면서 `claude-plugins` 구조를 그대로 복붙하면 product boundary가 흐려질 수 있다.
  참조는 하되, `Cautilus`는 repo-agnostic single-product package여야 한다.
- plugin packaging을 consumer repo adapter bundling으로 잘못 확장할 위험이 있다.
  adapter/prompt/policy는 host-owned 상태를 유지해야 한다.

## References

- [README.md](/home/ubuntu/cautilus/README.md)
- [AGENTS.md](/home/ubuntu/cautilus/AGENTS.md)
- [docs/master-plan.md](/home/ubuntu/cautilus/docs/master-plan.md)
- [docs/workflow.md](/home/ubuntu/cautilus/docs/workflow.md)
- [docs/specs/current-product.spec.md](/home/ubuntu/cautilus/docs/specs/current-product.spec.md)
- [docs/specs/standalone-surface.spec.md](/home/ubuntu/cautilus/docs/specs/standalone-surface.spec.md)
- [skills/cautilus/SKILL.md](/home/ubuntu/cautilus/skills/cautilus/SKILL.md)
- [.codex-plugin/plugin.json](/home/ubuntu/cautilus/.codex-plugin/plugin.json)
- [.agents/plugins/marketplace.json](/home/ubuntu/cautilus/.agents/plugins/marketplace.json)
- [bin/cautilus](/home/ubuntu/cautilus/bin/cautilus)
- [evaluate-adapter-mode.mjs](/home/ubuntu/cautilus/scripts/agent-runtime/evaluate-adapter-mode.mjs)
- [scenario-history.mjs](/home/ubuntu/cautilus/scripts/agent-runtime/scenario-history.mjs)
- [prune-workspace-artifacts.mjs](/home/ubuntu/cautilus/scripts/agent-runtime/prune-workspace-artifacts.mjs)
- https://developers.openai.com/codex/plugins/build
- [/home/ubuntu/claude-plugins/README.md](/home/ubuntu/claude-plugins/README.md)
- [/home/ubuntu/claude-plugins/plugins/cwf/.claude-plugin/plugin.json](/home/ubuntu/claude-plugins/plugins/cwf/.claude-plugin/plugin.json)
- [/home/ubuntu/claude-plugins/.claude-plugin/marketplace.json](/home/ubuntu/claude-plugins/.claude-plugin/marketplace.json)
