# Cautilus Handoff

## Workflow Trigger

- 다음 세션에서 이 문서를 멘션하면 먼저
  [README.md](/home/ubuntu/cautilus/README.md),
  [AGENTS.md](/home/ubuntu/cautilus/AGENTS.md),
  [docs/master-plan.md](/home/ubuntu/cautilus/docs/master-plan.md),
  [docs/contracts/behavior-intent.md](/home/ubuntu/cautilus/docs/contracts/behavior-intent.md),
  [docs/contracts/scenario-proposal-inputs.md](/home/ubuntu/cautilus/docs/contracts/scenario-proposal-inputs.md),
  [docs/contracts/chatbot-normalization.md](/home/ubuntu/cautilus/docs/contracts/chatbot-normalization.md),
  [docs/contracts/skill-normalization.md](/home/ubuntu/cautilus/docs/contracts/skill-normalization.md),
  [skills/cautilus/SKILL.md](/home/ubuntu/cautilus/skills/cautilus/SKILL.md)
  를 읽는다.
- 시작 workflow는 `impl` 기준이다.
- product-owned seam이면 `cautilus`에서 먼저 고친다. host adapter, prompt, policy, consumer artifact는 host 소유다.
- 지금부터의 기본 pickup은 `behavior intent` contract를 여기서 더 굳힐지, 아니면 다른 roadmap gap으로 이동할지 결정하는 것이다.

## Current State

- `report -> review -> optimize -> revision artifact`가 공유하는
  `cautilus.behavior_intent.v1` thin contract가 들어가 있다.
- `scenario proposal` seam도 같은 contract를 optional하게 carry한다.
  - proposal candidate
  - generated proposal
  - embedded draft scenario
- 세 normalization helper가 모두 intent profile을 emit한다.
  - `cli`:
    default `behaviorSurface: operator_cli`
  - `chatbot`:
    pattern class별 default surface
    `workflow_conversation`, `thread_followup`, `thread_context_recovery`
  - `skill`:
    default surface
    `skill_validation`, `operator_workflow_recovery`
- helper input에는 optional `intentProfile`을 둘 수 있고, host가 주면 그 값을 우선한다.
- `behavior-intent` 문서에는 `host-declared profile`과
  `default-derived profile`의 현재 경계가 적혀 있다.
- local proof:
  - `npm run verify` 통과
- 현재 working tree는 clean 이다.

## Next Session

1. `behaviorSurface`를 product-owned catalog로 더 엄밀히 고정할지 결정한다.
   - 지금은 working vocabulary만 있다.
   - 아직 closed catalog는 아니다.
2. 만약 intent contract를 더 밀면, 다음 자연스러운 후보는 scenario family별 reusable dimension catalog다.
   - 예: conversational continuity
   - operator recovery
   - validation integrity
3. intent 확장을 여기서 멈춘다면 다음 자연스러운 후보는 `artifact-root auto layout`이다.
4. 어느 쪽이든 문서 먼저, 그 다음 runtime/fixture/test 순서로 간다.
5. 변경 후에는 항상 `npm run verify`를 다시 돌린다.

## Discuss

- 현재 contract는 여전히 thin packet이다. prompt schema나 policy ontology가 아니다.
- 이제 shared profile은 helper들이 널리 emit하지만, dimension semantics는 아직 seam-local example 수준이다.
- 다음 결정의 핵심은 “surface names를 제품 catalog로 고정할 것인가”이지, helper를 더 추가로 연결하는 일은 아니다.

## Premortem

- 가장 쉬운 오해는 surface 이름이 몇 개 생겼으니 제품이 이미 완전한 intent taxonomy를 가졌다고 보는 것이다.
  아니다. 아직 thin working vocabulary다.
- 다음 쉬운 오해는 default-derived profile이 있으니 host-declared profile은 중요하지 않다고 보는 것이다.
  아니다. host가 더 좋은 truth를 주면 그쪽이 더 강한 입력이다.
- 또 다른 쉬운 오해는 scenario proposal에 intent profile이 optional이므로 앞으로도 catalog 결정을 미뤄도 된다고 보는 것이다.
  현재는 괜찮지만, dimensions를 재사용하려면 곧 naming discipline이 필요해진다.
- packaged skill copy를 다시 잊고 repo-bundled skill만 수정하면 distribution-surface test가 깨진다.

## References

- [README.md](/home/ubuntu/cautilus/README.md)
- [AGENTS.md](/home/ubuntu/cautilus/AGENTS.md)
- [docs/master-plan.md](/home/ubuntu/cautilus/docs/master-plan.md)
- [docs/contracts/behavior-intent.md](/home/ubuntu/cautilus/docs/contracts/behavior-intent.md)
- [docs/contracts/scenario-proposal-inputs.md](/home/ubuntu/cautilus/docs/contracts/scenario-proposal-inputs.md)
- [docs/contracts/chatbot-normalization.md](/home/ubuntu/cautilus/docs/contracts/chatbot-normalization.md)
- [docs/contracts/skill-normalization.md](/home/ubuntu/cautilus/docs/contracts/skill-normalization.md)
- [scripts/agent-runtime/behavior-intent.mjs](/home/ubuntu/cautilus/scripts/agent-runtime/behavior-intent.mjs)
- [scripts/agent-runtime/chatbot-proposal-candidates.mjs](/home/ubuntu/cautilus/scripts/agent-runtime/chatbot-proposal-candidates.mjs)
- [scripts/agent-runtime/skill-proposal-candidates.mjs](/home/ubuntu/cautilus/scripts/agent-runtime/skill-proposal-candidates.mjs)
- [scripts/agent-runtime/cli-proposal-candidates.mjs](/home/ubuntu/cautilus/scripts/agent-runtime/cli-proposal-candidates.mjs)
