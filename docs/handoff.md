# Cautilus Handoff

## Workflow Trigger

- 다음 세션에서 이 문서를 멘션하면 먼저
  [README.md](/home/ubuntu/cautilus/README.md),
  [AGENTS.md](/home/ubuntu/cautilus/AGENTS.md),
  [docs/master-plan.md](/home/ubuntu/cautilus/docs/master-plan.md),
  [docs/contracts/behavior-intent.md](/home/ubuntu/cautilus/docs/contracts/behavior-intent.md),
  [docs/contracts/optimization.md](/home/ubuntu/cautilus/docs/contracts/optimization.md),
  [docs/contracts/revision-artifact.md](/home/ubuntu/cautilus/docs/contracts/revision-artifact.md),
  [skills/cautilus/SKILL.md](/home/ubuntu/cautilus/skills/cautilus/SKILL.md)
  를 읽는다.
- 시작 workflow는 `impl` 기준이다.
- product-owned seam이면 `cautilus`에서 먼저 고친다. host adapter, prompt, policy, consumer artifact는 host 소유다.
- 지금부터의 기본 pickup은 `behavior intent` contract를 다른 product-owned seams로 확장할지, 아니면 optimization roadmap의 다음 gap으로 이동할지 결정하는 것이다.

## Current State

- `report -> review -> optimize -> revision artifact`가 공유하는
  `cautilus.behavior_intent.v1` thin contract를 추가했다.
  - 새 계약:
    [behavior-intent.md](/home/ubuntu/cautilus/docs/contracts/behavior-intent.md)
  - 새 구현:
    [behavior-intent.mjs](/home/ubuntu/cautilus/scripts/agent-runtime/behavior-intent.mjs)
- `build-report-packet`이 이제 plain `intent` 위에 `intentProfile`을 materialize한다.
- `review build-prompt-input`과 `render-review-prompt`가 같은 intent profile을 다시 사용한다.
- `optimize prepare-input`, `optimize propose`, `optimize build-artifact`가 같은 intent profile을 carry한다.
  - optimize seam은 report 쪽에서 guardrail dimensions가 비어 있으면 objective constraints를 default guardrail로 채운다.
- fixture/schema/spec/test가 전부 새 contract에 맞게 동기화됐다.
- local proof:
  - `npm run verify` 통과

## Next Session

1. `behavior intent`를 어디까지 product-owned로 밀지 결정한다.
   - 가장 자연스러운 후보는 `scenario proposal` 쪽 공유 contract다.
   - 대안은 optimization roadmap으로 돌아가 `artifact-root auto layout` 같은 operator surface gap을 푸는 것이다.
2. 만약 intent contract를 더 확장한다면, 먼저 “default-derived profile”과 “host-declared profile”의 경계를 문서로 더 명확히 한다.
   - 특히 `behaviorSurface`를 지금처럼 generic fallback으로 둘지, 더 explicit input을 요구할지 결정해야 한다.
3. 그 다음에만 runtime surface를 더 넓힌다.
   - 문서
   - runtime packet
   - fixture/schema/test
4. 변경 후에는 항상 `npm run verify`를 다시 돌린다.

## Discuss

- 이번 slice의 핵심은 optimizer algorithm을 더 복잡하게 만드는 것이 아니라, optimizer가 겨누는 행동 intent를 explicit packet으로 고정하는 것이었다.
- `report.intent` 문자열은 아직 남아 있지만, 이제 shared machine-readable contract는 `intentProfile` 쪽이다.
- optimize seam의 guardrail dimensions는 현재 product-owned default를 넣을 수 있지만, behavior surface 자체는 아직 host가 더 명시적으로 선언할 여지가 있다.

## Premortem

- 가장 쉬운 오해는 `intentProfile`이 prompt schema나 policy ontology라고 보는 것이다.
  아니다. 현재는 thin shared packet일 뿐이다.
- 다음 쉬운 오해는 report에 `intentProfile`이 생겼으니 host가 반드시 모든 dimension을 세세하게 선언해야 한다고 보는 것이다.
  아니다. 지금은 conservative fallback이 허용된다.
- 또 다른 쉬운 오해는 optimize가 guardrail dimensions를 채우므로 review/report도 같은 guardrail semantics를 이미 가진다고 보는 것이다.
  현재는 optimize seam만 objective constraints를 default guardrail로 승격한다.
- packaged skill copy를 다시 잊고 repo-bundled skill만 수정하면 distribution-surface test가 깨진다.

## References

- [README.md](/home/ubuntu/cautilus/README.md)
- [AGENTS.md](/home/ubuntu/cautilus/AGENTS.md)
- [docs/master-plan.md](/home/ubuntu/cautilus/docs/master-plan.md)
- [docs/contracts/behavior-intent.md](/home/ubuntu/cautilus/docs/contracts/behavior-intent.md)
- [docs/contracts/reporting.md](/home/ubuntu/cautilus/docs/contracts/reporting.md)
- [docs/contracts/review-packet.md](/home/ubuntu/cautilus/docs/contracts/review-packet.md)
- [docs/contracts/review-prompt-inputs.md](/home/ubuntu/cautilus/docs/contracts/review-prompt-inputs.md)
- [docs/contracts/optimization.md](/home/ubuntu/cautilus/docs/contracts/optimization.md)
- [docs/contracts/revision-artifact.md](/home/ubuntu/cautilus/docs/contracts/revision-artifact.md)
- [docs/specs/current-product.spec.md](/home/ubuntu/cautilus/docs/specs/current-product.spec.md)
- [scripts/agent-runtime/behavior-intent.mjs](/home/ubuntu/cautilus/scripts/agent-runtime/behavior-intent.mjs)
- [scripts/agent-runtime/build-report-packet.mjs](/home/ubuntu/cautilus/scripts/agent-runtime/build-report-packet.mjs)
- [scripts/agent-runtime/build-optimize-input.mjs](/home/ubuntu/cautilus/scripts/agent-runtime/build-optimize-input.mjs)
- [scripts/agent-runtime/generate-optimize-proposal.mjs](/home/ubuntu/cautilus/scripts/agent-runtime/generate-optimize-proposal.mjs)
- [scripts/agent-runtime/build-revision-artifact.mjs](/home/ubuntu/cautilus/scripts/agent-runtime/build-revision-artifact.mjs)
