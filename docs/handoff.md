# Cautilus Handoff

## Workflow Trigger

- 다음 세션에서 이 문서를 멘션하면 먼저
  [README.md](/home/ubuntu/cautilus/README.md),
  [AGENTS.md](/home/ubuntu/cautilus/AGENTS.md),
  [docs/master-plan.md](/home/ubuntu/cautilus/docs/master-plan.md),
  [docs/contracts/optimization.md](/home/ubuntu/cautilus/docs/contracts/optimization.md),
  [docs/contracts/revision-artifact.md](/home/ubuntu/cautilus/docs/contracts/revision-artifact.md),
  [skills/cautilus/SKILL.md](/home/ubuntu/cautilus/skills/cautilus/SKILL.md)
  를 읽는다.
- 시작 workflow는 `impl` 기준이다.
- 현재 이어서 할 일은 `DSPy`에서 가져온 개념을 `optimize` seam 위에서 더 일반화하는 것이다.
- product-owned seam이면 `cautilus`에서 먼저 고친다. host adapter, prompt, policy, consumer artifact는 host 소유다.

## Current State

- `optimize` seam에 `optimizer kind`, `budget`, `trial telemetry`, `evidence provenance`가 들어갔다.
  - 커밋: `aa7e41c` `Make optimize proposals bounded and auditable`
- 그 위에 durable revision artifact surface를 추가했다.
  - 새 계약:
    [optimization.md](/home/ubuntu/cautilus/docs/contracts/optimization.md),
    [revision-artifact.md](/home/ubuntu/cautilus/docs/contracts/revision-artifact.md)
  - 새 CLI:
    `cautilus optimize build-artifact`
  - 새 구현:
    [build-revision-artifact.mjs](/home/ubuntu/cautilus/scripts/agent-runtime/build-revision-artifact.mjs)
  - 커밋: `fcce47e` `Add durable artifacts for optimize revisions`
- standalone/product surface는 현재 여기까지 설명된다.
  - `optimize prepare-input`
  - `optimize propose`
  - `optimize build-artifact`
- repo-bundled skill과 packaged skill copy는 다시 sync 상태다.
- 현재 working tree는 clean 이다.
- local proof:
  - `npm run lint` 통과
  - `npm run test` 통과
  - `npm run verify` 통과

## Next Session

1. `intent/signature-like contract`를 `optimize` 위에 얇게 추가하는 slice로 간다.
   - 목표는 `prompt`/`adapter`보다 한 단계 위의 “무슨 행동을 고치려는가”를 packet으로 고정하는 것이다.
2. 범위는 `review`, `optimize`, `revision artifact`가 공유할 수 있는 최소 공통면으로 제한한다.
   - 예: `intent_id`, `behavior_surface`, `success dimensions`, `guardrail dimensions`
3. 구현은 문서부터 시작한다.
   - 새 contract 문서 1개
   - optimize input/proposal/artifact 중 필요한 최소 필드만 확장
   - fixture/test 동기화
4. 그 다음에만 broader roadmap으로 돌아간다.
   - `artifact-root auto layout`은 여전히 유효한 제품 gap이지만, 현재 세션 흐름상 우선순위는 intent contract가 더 자연스럽다.
5. 변경 후에는 항상 `npm run lint`, `npm run test`, `npm run verify`를 다시 돌린다.

## Discuss

- 지금 `optimizer kind`는 서로 다른 탐색 알고리즘이라기보다 evidence weighting plan에 가깝다.
- 그래서 다음 slice의 핵심은 optimizer를 더 복잡하게 만드는 것이 아니라, optimizer가 겨누는 `intent`를 더 명시적으로 만드는 것이다.
- `revision artifact`는 이미 durable object가 됐으므로, 다음에는 “무엇을 왜 고치는가”를 더 잘 설명하는 계약층이 필요하다.
- packaging/install surface는 현재 안정적이다. 당분간 주 작업축이 아니다.

## Premortem

- 가장 쉬운 오해는 `optimize build-artifact`가 자동 수정 표면이라고 보는 것이다.
  아니다. 현재도 proposal/artifact는 bounded operator packet일 뿐이다.
- 다음 쉬운 오해는 `optimizer kind`가 실제 optimizer algorithm을 뜻한다고 보는 것이다.
  현재는 evidence prioritization plan에 더 가깝다.
- 또 다른 쉬운 오해는 revision artifact가 생겼으니 intent contract는 없어도 된다고 보는 것이다.
  실제로는 반대다. 이제 durable object가 생겼기 때문에, 그 object가 표현하는 행동 intent를 더 엄밀히 적어야 한다.
- packaged skill copy를 다시 잊고 repo-bundled skill만 수정하면 distribution-surface test가 깨진다.

## References

- [README.md](/home/ubuntu/cautilus/README.md)
- [AGENTS.md](/home/ubuntu/cautilus/AGENTS.md)
- [docs/master-plan.md](/home/ubuntu/cautilus/docs/master-plan.md)
- [docs/contracts/optimization.md](/home/ubuntu/cautilus/docs/contracts/optimization.md)
- [docs/contracts/revision-artifact.md](/home/ubuntu/cautilus/docs/contracts/revision-artifact.md)
- [docs/specs/current-product.spec.md](/home/ubuntu/cautilus/docs/specs/current-product.spec.md)
- [skills/cautilus/SKILL.md](/home/ubuntu/cautilus/skills/cautilus/SKILL.md)
- [plugins/cautilus/skills/cautilus/SKILL.md](/home/ubuntu/cautilus/plugins/cautilus/skills/cautilus/SKILL.md)
- [bin/cautilus](/home/ubuntu/cautilus/bin/cautilus)
- [build-optimize-input.mjs](/home/ubuntu/cautilus/scripts/agent-runtime/build-optimize-input.mjs)
- [generate-optimize-proposal.mjs](/home/ubuntu/cautilus/scripts/agent-runtime/generate-optimize-proposal.mjs)
- [build-revision-artifact.mjs](/home/ubuntu/cautilus/scripts/agent-runtime/build-revision-artifact.mjs)
