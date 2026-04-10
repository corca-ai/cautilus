# Cautilus Handoff

## Workflow Trigger

- 다음 세션에서 이 문서를 멘션하면 먼저
  [README.md](/home/ubuntu/cautilus/README.md),
  [AGENTS.md](/home/ubuntu/cautilus/AGENTS.md),
  [docs/master-plan.md](/home/ubuntu/cautilus/docs/master-plan.md),
  [docs/contracts/behavior-intent.md](/home/ubuntu/cautilus/docs/contracts/behavior-intent.md),
  [docs/contracts/scenario-proposal-inputs.md](/home/ubuntu/cautilus/docs/contracts/scenario-proposal-inputs.md),
  [skills/cautilus/SKILL.md](/home/ubuntu/cautilus/skills/cautilus/SKILL.md)
  를 읽는다.
- 시작 workflow는 `impl` 기준이다.
- product-owned seam이면 `cautilus`에서 먼저 고친다. host adapter, prompt, policy, consumer artifact는 host 소유다.
- 지금부터의 기본 pickup은 behavior-surface catalog 위에 dimension catalog를 올릴지, 아니면 다른 roadmap gap으로 이동할지 결정하는 것이다.

## Current State

- `cautilus.behavior_intent.v1`는 이제 closed product-owned
  `behaviorSurface` catalog를 가진다.
  - `operator_behavior`
  - `operator_cli`
  - `workflow_conversation`
  - `thread_followup`
  - `thread_context_recovery`
  - `skill_validation`
  - `operator_workflow_recovery`
  - `review_variant_workflow`
- runtime은 이제 catalog 밖의 `behaviorSurface`를 거부한다.
- `report -> review -> optimize -> revision artifact`가 같은 contract를 공유한다.
- `scenario proposal` seam도 같은 contract를 optional하게 carry한다.
  - proposal candidate
  - generated proposal
  - embedded draft scenario
- 세 normalization helper가 모두 intent profile을 emit한다.
  - `cli`
  - `chatbot`
  - `skill`
- helper input에는 optional `intentProfile`을 둘 수 있고, host가 주면 그 값을 우선한다.
- local proof:
  - `npm run verify` 통과
- 현재 working tree는 clean 이다.

## Next Session

1. 다음 자연스러운 후보는 reusable dimension catalog다.
   - conversational continuity
   - operator recovery
   - validation integrity
2. 이걸 한다면 먼저 문서에서 “surface는 closed catalog, dimension은 seam-scoped reusable vocabulary”라는 경계를 적는다.
3. 그 다음 runtime에서는 helper별 default dimension ids를 상수화하는 작은 slice로 간다.
4. 만약 intent contract 확장을 여기서 멈춘다면 다음 자연스러운 후보는 `artifact-root auto layout`이다.
5. 변경 후에는 항상 `npm run verify`를 다시 돌린다.

## Discuss

- surface naming은 이제 product-owned catalog로 고정됐다.
- 아직 고정되지 않은 것은 dimension semantics다.
- 다음 결정의 핵심은 taxonomy를 더 키울지 말지가 아니라, dimension ids를 seam-local prose에서 reusable product vocabulary로 승격할지 말지다.

## Premortem

- 가장 쉬운 오해는 surface catalog를 닫았으니 dimension catalog도 이미 있다고 보는 것이다.
  아니다. 지금은 surface만 closed이고 dimensions는 아직 example-driven이다.
- 다음 쉬운 오해는 host-declared profile도 이제 product-owned defaults만 써야 하므로 host nuance가 사라진다고 보는 것이다.
  아니다. host는 catalog 안에서 더 좋은 summary와 dimensions를 줄 수 있다.
- 또 다른 쉬운 오해는 unknown surface를 runtime이 거부하기 시작했으니 외부 consumer 확장이 막혔다고 보는 것이다.
  실제로는 product-owned surface를 더 추가할 때 명시적으로 계약을 바꾸자는 뜻이다.
- packaged skill copy를 다시 잊고 repo-bundled skill만 수정하면 distribution-surface test가 깨진다.

## References

- [README.md](/home/ubuntu/cautilus/README.md)
- [AGENTS.md](/home/ubuntu/cautilus/AGENTS.md)
- [docs/master-plan.md](/home/ubuntu/cautilus/docs/master-plan.md)
- [docs/contracts/behavior-intent.md](/home/ubuntu/cautilus/docs/contracts/behavior-intent.md)
- [docs/contracts/scenario-proposal-inputs.md](/home/ubuntu/cautilus/docs/contracts/scenario-proposal-inputs.md)
- [scripts/agent-runtime/behavior-intent.mjs](/home/ubuntu/cautilus/scripts/agent-runtime/behavior-intent.mjs)
- [scripts/agent-runtime/cli-proposal-candidates.mjs](/home/ubuntu/cautilus/scripts/agent-runtime/cli-proposal-candidates.mjs)
- [scripts/agent-runtime/chatbot-proposal-candidates.mjs](/home/ubuntu/cautilus/scripts/agent-runtime/chatbot-proposal-candidates.mjs)
- [scripts/agent-runtime/skill-proposal-candidates.mjs](/home/ubuntu/cautilus/scripts/agent-runtime/skill-proposal-candidates.mjs)
