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

- Codex local install/readiness spot-check 결과, repo marketplace는 실제로 읽히지만
  기존 `source.path: "./"` 는 Codex 0.118.0 app-server `plugin/list` 기준 invalid 였다.
  - 실제 에러: `local plugin source path must not be empty`
- 그래서 local install surface는 repo-root pseudo plugin이 아니라
  subtree package로 정리됐다.
  - [plugins/cautilus/.codex-plugin/plugin.json](/home/ubuntu/cautilus/plugins/cautilus/.codex-plugin/plugin.json)
  - [.agents/plugins/marketplace.json](/home/ubuntu/cautilus/.agents/plugins/marketplace.json)
  - [plugins/cautilus/.claude-plugin/plugin.json](/home/ubuntu/cautilus/plugins/cautilus/.claude-plugin/plugin.json)
  - [.claude-plugin/marketplace.json](/home/ubuntu/cautilus/.claude-plugin/marketplace.json)
  - [plugins/cautilus/skills/cautilus/SKILL.md](/home/ubuntu/cautilus/plugins/cautilus/skills/cautilus/SKILL.md)
  - [scripts/release/check-codex-marketplace.mjs](/home/ubuntu/cautilus/scripts/release/check-codex-marketplace.mjs)
- packaged skill copy는 현재 repo-bundled skill과 exact sync test로 묶었다.
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
- 아직 남아 있는 실제 제품 gap은 한 가지다.
  - run artifact auto layout 부재
- local proof는 현재 이렇게 확보됐다.
  - `node ./scripts/release/check-codex-marketplace.mjs --repo-root .` 통과
  - `claude plugins validate ./.claude-plugin/marketplace.json` 통과
  - `claude plugins validate ./plugins/cautilus/.claude-plugin/plugin.json` 통과
  - `npm run lint`, `npm run test`, `npm run verify` 통과

## Next Session

1. artifact-root auto layout slice로 돌아간다.
   - 가장 자연스러운 다음 구현은 `mode evaluate` / `review variants` 에 `--artifact-root` 또는 equivalent option을 넣고 timestamped run subdirectory를 자동 생성하는 것이다.
2. 현재 pruning helper와 충돌하지 않게 run directory naming policy를 먼저 짧게 고정한다.
3. 변경 후에는 항상 `npm run lint`, `npm run test`, `npm run verify` 를 다시 돌린다.

## Discuss

- Codex 쪽 판단은 이미 나왔다. repo root shared surface는 현재 Codex 규칙과 맞지 않고,
  별도 package subtree가 맞다.
- Claude도 같은 결론이다. local install surface는 root shared surface보다
  subtree package shape가 product boundary를 더 잘 지킨다.
- artifact pruning은 이미 있으므로, artifact auto layout이 다음 runtime slice로 가장 자연스럽다.

## Premortem

- 가장 쉬운 오해는 Codex marketplace가 문서상 있으니 실제 install path도 된다고
  생각하는 것이다. 이번 spot-check로 `./` root source는 실제로 invalid 였다는 게
  확인됐다.
- 다음 쉬운 오해는 subtree package를 만들었으니 root skill과 packaged skill이
  자동으로 sync 된다고 보는 것이다. 현재는 copy + sync test 방식이므로 둘 중 하나만
  고치면 gate가 깨진다.
- 또 다른 쉬운 오해는 `workspace prune-artifacts`가 run layout까지 해결했다고 생각하는 것이다.
  실제로는 pruning helper만 있고, run directory naming/creation policy는 아직 없다.
- Claude validate 통과를 실제 install/discovery proof와 동일시하는 것도 쉬운 오해다.
  지금은 checked-in manifest shape proof까지 확보된 상태이고, 실제 end-to-end install smoke는
  필요할 때 별도 spot-check로 다루면 된다.
- packaging을 consumer adapter bundling으로 확장하기 시작하면 경계가 무너진다.
  adapter, prompt, policy는 host-owned 상태를 유지한다.

## References

- [README.md](/home/ubuntu/cautilus/README.md)
- [AGENTS.md](/home/ubuntu/cautilus/AGENTS.md)
- [docs/master-plan.md](/home/ubuntu/cautilus/docs/master-plan.md)
- [docs/release-boundary.md](/home/ubuntu/cautilus/docs/release-boundary.md)
- [docs/workflow.md](/home/ubuntu/cautilus/docs/workflow.md)
- [skills/cautilus/SKILL.md](/home/ubuntu/cautilus/skills/cautilus/SKILL.md)
- [plugins/cautilus/.codex-plugin/plugin.json](/home/ubuntu/cautilus/plugins/cautilus/.codex-plugin/plugin.json)
- [plugins/cautilus/.claude-plugin/plugin.json](/home/ubuntu/cautilus/plugins/cautilus/.claude-plugin/plugin.json)
- [plugins/cautilus/skills/cautilus/SKILL.md](/home/ubuntu/cautilus/plugins/cautilus/skills/cautilus/SKILL.md)
- [.agents/plugins/marketplace.json](/home/ubuntu/cautilus/.agents/plugins/marketplace.json)
- [.claude-plugin/marketplace.json](/home/ubuntu/cautilus/.claude-plugin/marketplace.json)
- [check-codex-marketplace.mjs](/home/ubuntu/cautilus/scripts/release/check-codex-marketplace.mjs)
- [bin/cautilus](/home/ubuntu/cautilus/bin/cautilus)
- [prune-workspace-artifacts.mjs](/home/ubuntu/cautilus/scripts/agent-runtime/prune-workspace-artifacts.mjs)
- [evaluate-adapter-mode.mjs](/home/ubuntu/cautilus/scripts/agent-runtime/evaluate-adapter-mode.mjs)
- [scenario-history.mjs](/home/ubuntu/cautilus/scripts/agent-runtime/scenario-history.mjs)
- https://developers.openai.com/codex/plugins/build
- [/home/ubuntu/claude-plugins/plugins/cwf/.claude-plugin/plugin.json](/home/ubuntu/claude-plugins/plugins/cwf/.claude-plugin/plugin.json)
- [/home/ubuntu/claude-plugins/.claude-plugin/marketplace.json](/home/ubuntu/claude-plugins/.claude-plugin/marketplace.json)
