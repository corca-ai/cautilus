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
- 지금부터의 기본 pickup은 `artifact-root auto layout` slice다.

## Current State

- `cautilus.behavior_intent.v1`는 이제 closed product-owned
  `behaviorSurface` catalog와 reusable dimension catalog를 가진다.
  - `operator_behavior`
  - `operator_cli`
  - `workflow_conversation`
  - `thread_followup`
  - `thread_context_recovery`
  - `skill_validation`
  - `operator_workflow_recovery`
  - `review_variant_workflow`
- runtime은 이제 catalog 밖의 `behaviorSurface`와 dimension id를 거부한다.
- runtime은 dimension kind와 surface applicability도 검증한다.
- helper default는 이제 seam-owned prose가 아니라 product-owned dimension ids를 사용한다.
  - `cli` guidance: `operator_guidance_clarity`, `recovery_next_step`
  - `cli` behavior contract: `contract_integrity`
  - `chatbot` clarification/context recovery: `target_clarification`
  - `chatbot` follow-up: `workflow_continuity`
  - `skill` validation: `validation_integrity`
  - `skill` workflow recovery: `workflow_recovery`, `recovery_next_step`
  - `optimize` guardrails:
    `repair_explicit_regressions_first`,
    `review_findings_binding`,
    `history_focuses_next_probe`,
    `rerun_relevant_gates`
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
- host-declared profile도 이제 product-owned dimension ids를 써야 하며 summary는 canonicalized 된다.
- local proof:
  - `npm run verify` 통과
- quality pass:
  - existing deterministic gate (`npm run verify`) is sufficient for this slice
  - biggest residual risk is that JSON schema does not enumerate the catalog; runtime validation is the enforcing layer

## Next Session

1. 다음 slice는 `artifact-root auto layout`이다.
2. 먼저 product-owned artifact-root rules를 문서에 적는다.
3. 그 다음 CLI/runtime이 default root와 run-type subdirectory를 materialize하게 한다.
4. `workspace prune-artifacts`와 naming 충돌이 없는지 바로 테스트로 고정한다.
5. 변경 후에는 항상 `npm run verify`를 다시 돌린다.

## Discuss

- behavior intent catalog는 이번 slice로 일단 닫혔다.
- 다음 결정은 intent taxonomy를 더 키울지 여부가 아니라, artifact-root operator surface를 어디까지 auto-materialize할지다.
- schema까지 catalog enum을 밀어넣을지는 아직 deferred다. 지금 enforcing layer는 runtime이다.

## Premortem

- 가장 쉬운 오해는 JSON schema가 catalog를 강제하니 runtime 검증은 중복이라고 보는 것이다.
  아니다. 지금 enforcing layer는 runtime과 tests다.
- 다음 쉬운 오해는 host-declared profile의 summary를 자유 prose로 계속 바꿔도 된다고 보는 것이다.
  아니다. dimension summary는 이제 product-owned canonical summary로 정규화된다.
- 또 다른 쉬운 오해는 catalog를 닫았으니 helper defaults를 더 늘릴 때 문서 업데이트 없이 code만 바꿔도 된다고 보는 것이다.
  아니다. behavior-intent doc과 normalization docs를 같이 바꿔야 drift가 없다.
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
