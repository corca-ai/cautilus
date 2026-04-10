# Cautilus Handoff

## Workflow Trigger

- 다음 세션에서 이 문서를 멘션하면 먼저
  [README.md](/home/ubuntu/cautilus/README.md),
  [AGENTS.md](/home/ubuntu/cautilus/AGENTS.md),
  [docs/master-plan.md](/home/ubuntu/cautilus/docs/master-plan.md),
  [docs/contracts/behavior-intent.md](/home/ubuntu/cautilus/docs/contracts/behavior-intent.md),
  [docs/contracts/scenario-proposal-inputs.md](/home/ubuntu/cautilus/docs/contracts/scenario-proposal-inputs.md),
  [docs/contracts/optimization.md](/home/ubuntu/cautilus/docs/contracts/optimization.md),
  [skills/cautilus/SKILL.md](/home/ubuntu/cautilus/skills/cautilus/SKILL.md)
  를 읽는다.
- 시작 workflow는 `impl` 기준이다.
- product-owned seam이면 `cautilus`에서 먼저 고친다. host adapter, prompt, policy, consumer artifact는 host 소유다.
- 지금부터의 기본 pickup은 `behavior intent` contract를 더 넓힐지, 아니면 다른 roadmap gap으로 이동할지 결정하는 것이다.

## Current State

- `report -> review -> optimize -> revision artifact`가 공유하는
  `cautilus.behavior_intent.v1` thin contract가 들어가 있다.
- 그 위에 `scenario proposal` seam도 같은 contract를 optional하게 carry할 수 있게 확장했다.
  - `scenario_proposal_inputs` candidate가 optional `intentProfile`을 받을 수 있다.
  - generated proposal과 embedded draft scenario도 같은 `intentProfile`을 preserve한다.
  - `cli` normalization helper는 plain `intent`만 있어도
    `behaviorSurface: operator_cli`인 thin profile을 default-derived로 만든다.
- `behavior-intent` 문서에는 이제 `host-declared profile`과
  `default-derived profile`의 현재 경계가 적혀 있다.
- fixture/schema/spec/test가 전부 현재 contract에 맞게 동기화됐다.
- local proof:
  - `npm run verify` 통과
- 현재 working tree는 clean 이다.

## Next Session

1. `behavior intent`를 여기서 더 넓힐지 결정한다.
   - 가장 자연스러운 다음 후보는 `chatbot`/`skill` normalization helper도 같은 shared profile을 emit하게 만드는 것이다.
   - 대안은 intent 확장을 여기서 멈추고 roadmap의 다음 operator gap으로 넘어가는 것이다.
2. intent 확장을 계속하면, 먼저 어떤 seams가 `default-derived`로 충분하고 어떤 seams는 `host-declared`가 더 맞는지 문서로 선결정한다.
   - 특히 `workflow_conversation`, `skill_validation` 같은 `behaviorSurface` 이름을 product-owned catalog로 둘지 결정해야 한다.
3. 그 결론이 나면 runtime slice로 간다.
   - normalization helper
   - fixture/schema/test
4. intent 확장을 멈춘다면 다음 자연스러운 후보는 `artifact-root auto layout`이다.
5. 변경 후에는 항상 `npm run verify`를 다시 돌린다.

## Discuss

- 현재 contract는 여전히 thin packet이다. prompt schema나 policy ontology가 아니다.
- `cli` normalization은 now/packet-level proposal flow까지 intent profile을 carry하지만, `chatbot`과 `skill` helper는 아직 동일한 contract를 적극적으로 emit하지 않는다.
- `scenario proposal`에서는 intent profile이 optional이므로, product가 비-intent-aware host packet을 깨지지 않게 유지하고 있다.

## Premortem

- 가장 쉬운 오해는 `scenario proposal`이 intent profile을 가지기 시작했으니 모든 candidate miner가 이제 복잡한 dimension catalog를 가져야 한다고 보는 것이다.
  아니다. 지금도 optional이다.
- 다음 쉬운 오해는 `cli` helper가 default-derived profile을 만들 수 있으니 그 값이 항상 host truth보다 낫다고 보는 것이다.
  아니다. host-declared profile이 있으면 그쪽이 더 강한 입력이다.
- 또 다른 쉬운 오해는 `behaviorSurface` 값을 지금 바로 제품의 영구 catalog로 확정했다고 보는 것이다.
  아직 아니다. 현재는 thin fallback과 small explicit examples만 있다.
- packaged skill copy를 다시 잊고 repo-bundled skill만 수정하면 distribution-surface test가 깨진다.

## References

- [README.md](/home/ubuntu/cautilus/README.md)
- [AGENTS.md](/home/ubuntu/cautilus/AGENTS.md)
- [docs/master-plan.md](/home/ubuntu/cautilus/docs/master-plan.md)
- [docs/contracts/behavior-intent.md](/home/ubuntu/cautilus/docs/contracts/behavior-intent.md)
- [docs/contracts/cli-normalization.md](/home/ubuntu/cautilus/docs/contracts/cli-normalization.md)
- [docs/contracts/scenario-proposal-inputs.md](/home/ubuntu/cautilus/docs/contracts/scenario-proposal-inputs.md)
- [docs/contracts/scenario-proposal-sources.md](/home/ubuntu/cautilus/docs/contracts/scenario-proposal-sources.md)
- [docs/contracts/optimization.md](/home/ubuntu/cautilus/docs/contracts/optimization.md)
- [scripts/agent-runtime/behavior-intent.mjs](/home/ubuntu/cautilus/scripts/agent-runtime/behavior-intent.mjs)
- [scripts/agent-runtime/cli-proposal-candidates.mjs](/home/ubuntu/cautilus/scripts/agent-runtime/cli-proposal-candidates.mjs)
- [scripts/agent-runtime/scenario-proposals.mjs](/home/ubuntu/cautilus/scripts/agent-runtime/scenario-proposals.mjs)
- [fixtures/scenario-proposals/standalone-input.json](/home/ubuntu/cautilus/fixtures/scenario-proposals/standalone-input.json)
