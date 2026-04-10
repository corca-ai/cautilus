# Cautilus Handoff

## Workflow Trigger

- 다음 세션에서 이 문서를 멘션하면 먼저
  [README.md](/home/ubuntu/cautilus/README.md),
  [AGENTS.md](/home/ubuntu/cautilus/AGENTS.md),
  [docs/master-plan.md](/home/ubuntu/cautilus/docs/master-plan.md),
  [docs/release-boundary.md](/home/ubuntu/cautilus/docs/release-boundary.md),
  [skills/cautilus/SKILL.md](/home/ubuntu/cautilus/skills/cautilus/SKILL.md)
  를 읽는다.
- 시작 workflow는 `impl` 기준이다.
- plugin/install surface를 건드리면 packaging shape를 3-5줄로 먼저 적고 구현에 들어간다.
- 작업 시작 repo는 항상 [cautilus](/home/ubuntu/cautilus) 이다. consumer repo 검증은 새 surface를 붙인 뒤 spot-check 용도로만 쓴다.
- product-owned seam이면 `cautilus`에서 먼저 고친다. host adapter, prompt, policy, consumer artifact 문제는 해당 consumer repo 소유다.

## Current State

- 워크트리는 clean 상태다.
- 최신 핵심 커밋은 `8fff243` `Add repo-local Codex plugin surface for Cautilus` 이다.
- Codex용 최소 install surface는 이제 실제 파일로 존재한다.
  - [.codex-plugin/plugin.json](/home/ubuntu/cautilus/.codex-plugin/plugin.json)
  - [.agents/plugins/marketplace.json](/home/ubuntu/cautilus/.agents/plugins/marketplace.json)
  - [skills/cautilus/SKILL.md](/home/ubuntu/cautilus/skills/cautilus/SKILL.md) frontmatter
- 기존 standalone surface는 계속 유효하다.
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
- 아직 남아 있는 실제 제품 gap은 두 가지다.
  - run artifact auto layout 부재
  - Claude install surface 부재
- `npm run lint`, `npm run test`, `npm run verify` 는 `8fff243` 이후 다시 통과했다.

## Next Session

1. Codex local install/readiness를 한 번 spot-check 한다.
   - 현재 repo root가 plugin root 역할을 한다.
   - 확인 대상:
     - [.codex-plugin/plugin.json](/home/ubuntu/cautilus/.codex-plugin/plugin.json)
     - [.agents/plugins/marketplace.json](/home/ubuntu/cautilus/.agents/plugins/marketplace.json)
   - 목표는 “구조가 맞다”를 문서 추론으로 끝내지 않고, local install path가 실제로 읽히는지 확인하는 것이다.
2. Claude install surface의 최소 shape를 추가한다.
   - 참조:
     - [/home/ubuntu/claude-plugins/plugins/cwf/.claude-plugin/plugin.json](/home/ubuntu/claude-plugins/plugins/cwf/.claude-plugin/plugin.json)
     - [/home/ubuntu/claude-plugins/.claude-plugin/marketplace.json](/home/ubuntu/claude-plugins/.claude-plugin/marketplace.json)
   - guardrail:
     - `Cautilus` product assets만 포함
     - consumer adapter/prompt/policy는 포함하지 않음
3. packaging surface를 건드린 뒤 필요하면
   [README.md](/home/ubuntu/cautilus/README.md),
   [docs/release-boundary.md](/home/ubuntu/cautilus/docs/release-boundary.md),
   [docs/master-plan.md](/home/ubuntu/cautilus/docs/master-plan.md)
   를 같은 work unit에서 동기화한다.
4. packaging 흐름이 잠잠해지면 artifact-root auto layout slice로 돌아간다.
   - 가장 자연스러운 다음 구현은 `mode evaluate` / `review variants` 에 `--artifact-root` 또는 equivalent option을 넣고 timestamped run subdirectory를 자동 생성하는 것이다.
5. 변경 후에는 항상 `npm run lint`, `npm run test`, `npm run verify` 를 다시 돌린다.

## Discuss

- 지금 가장 먼저 확인할 것은 “Codex minimal package가 실제 install/readiness path에서도 맞는가”다.
- 그 다음 판단 포인트는 Claude packaging을 repo root shared surface로 둘지, 별도 package subtree로 둘지다.
- artifact pruning은 이미 있으므로, artifact auto layout이 다음 runtime slice로 가장 자연스럽다.

## Premortem

- 가장 쉬운 오해는 Codex plugin 파일이 생겼으니 install story 전체가 끝났다고 보는 것이다.
  실제로는 Codex repo-local surface만 최소로 생겼고, Claude surface와 real smoke check는 아직 남아 있다.
- 또 다른 쉬운 오해는 `workspace prune-artifacts`가 run layout까지 해결했다고 생각하는 것이다.
  실제로는 pruning helper만 있고, run directory naming/creation policy는 아직 없다.
- Claude packaging에서 참조 repo 구조를 그대로 복붙하면 product boundary가 흐려질 수 있다.
  참조는 하되 `Cautilus`는 repo-agnostic single-product package여야 한다.
- packaging을 consumer adapter bundling으로 확장하기 시작하면 경계가 무너진다.
  adapter, prompt, policy는 host-owned 상태를 유지한다.

## References

- [README.md](/home/ubuntu/cautilus/README.md)
- [AGENTS.md](/home/ubuntu/cautilus/AGENTS.md)
- [docs/master-plan.md](/home/ubuntu/cautilus/docs/master-plan.md)
- [docs/release-boundary.md](/home/ubuntu/cautilus/docs/release-boundary.md)
- [docs/workflow.md](/home/ubuntu/cautilus/docs/workflow.md)
- [skills/cautilus/SKILL.md](/home/ubuntu/cautilus/skills/cautilus/SKILL.md)
- [.codex-plugin/plugin.json](/home/ubuntu/cautilus/.codex-plugin/plugin.json)
- [.agents/plugins/marketplace.json](/home/ubuntu/cautilus/.agents/plugins/marketplace.json)
- [bin/cautilus](/home/ubuntu/cautilus/bin/cautilus)
- [prune-workspace-artifacts.mjs](/home/ubuntu/cautilus/scripts/agent-runtime/prune-workspace-artifacts.mjs)
- [evaluate-adapter-mode.mjs](/home/ubuntu/cautilus/scripts/agent-runtime/evaluate-adapter-mode.mjs)
- [scenario-history.mjs](/home/ubuntu/cautilus/scripts/agent-runtime/scenario-history.mjs)
- https://developers.openai.com/codex/plugins/build
- [/home/ubuntu/claude-plugins/plugins/cwf/.claude-plugin/plugin.json](/home/ubuntu/claude-plugins/plugins/cwf/.claude-plugin/plugin.json)
- [/home/ubuntu/claude-plugins/.claude-plugin/marketplace.json](/home/ubuntu/claude-plugins/.claude-plugin/marketplace.json)
