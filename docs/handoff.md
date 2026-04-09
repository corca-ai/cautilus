# Cautilus Handoff

## Workflow Trigger

- 다음 세션에서 이 문서를 멘션하면 `$ceal:impl`로 이어서 Ceal `workbench` import 1차분을 실제 파일 복사에서 runtime entrypoint와 Ceal repoint plan까지 밀어붙인다.
- 시작 직후 [ceal-workbench-extraction.md](/home/ubuntu/cautilus/docs/ceal-workbench-extraction.md), [workflow.md](/home/ubuntu/cautilus/docs/workflow.md), [adapter-contract.md](/home/ubuntu/cautilus/docs/contracts/adapter-contract.md), [reporting.md](/home/ubuntu/cautilus/docs/contracts/reporting.md)를 읽고 현재 `Cautilus`가 이미 가진 generic contract와 아직 없는 runtime surface를 구분한다.
- 그 다음 `/home/ubuntu/ceal/.agents/workbench-adapter.yaml`, `/home/ubuntu/ceal/.agents/workbench-adapters/code-quality.yaml`, `/home/ubuntu/ceal/.agents/workbench-adapters/skill-smoke.yaml`를 읽고 Ceal adapter를 바꾸지 않은 채 `Cautilus` 스크립트로 읽을 수 있는지 먼저 확인한다.

## Current State

- `Cautilus`는 Ceal `workbench`를 떼어내는 별도 evaluation product로 잡혔다.
- 초기 문서로 [ceal-workbench-extraction.md](/home/ubuntu/cautilus/docs/ceal-workbench-extraction.md)가 추가돼 source-of-truth, ownership split, import sequence가 정리됐다.
- 1차 import로 generic workflow 문서, adapter/reporting contract 문서, adapter example, bootstrap scripts가 들어왔다.
- 현재 스크립트는 Ceal의 adapter search order와 placeholder contract를 그대로 유지해 초기 semantic drift를 피하는 상태다.
- `python3 /home/ubuntu/cautilus/scripts/resolve_adapter.py --repo-root /home/ubuntu/ceal`와 named adapter variant 검증이 통과해, Ceal default / `code-quality` / `skill-smoke` adapter를 현재 스크립트가 그대로 읽는 것이 확인됐다.
- `python3 /home/ubuntu/cautilus/scripts/init_adapter.py --repo-root /home/ubuntu/cautilus --output /tmp/cautilus-adapter.yaml`도 동작해 minimal scaffold path가 살아 있다.
- 아직 없는 것:
  - repo root README
  - actual runtime entrypoint or CLI
  - Ceal가 `Cautilus`를 실제로 소비하는 repoint

## Next Session

1. `Cautilus`에 minimal runtime entrypoint를 추가할지, 아니면 docs+scripts product 상태를 한 번 더 유지할지 결정한다.
2. Ceal `workbench`가 generic docs/scripts를 `Cautilus`에서 소비하도록 바꿀 cut line을 정한다.
3. Ceal 쪽 invocation surface를 바꿀 때 adapter file 이름과 search order를 그대로 유지할지 점검한다.
4. `charness`가 release-ready에 가까워지면 evaluation engine을 future external integration으로 받는 문구와 manifest readiness 조건을 맞춘다.

## Discuss

- `Cautilus`를 docs+scripts 중심 제품으로 한동안 유지할지, 바로 CLI/package 경계까지 만들지 결정이 필요하다.
- adapter file naming을 당장은 `workbench-adapter`로 유지할지, 어느 시점에 `cautilus` naming으로 바꿀지 정해야 한다.
- Ceal repoint를 한 번에 할지, docs/scripts 먼저 그리고 invocation surface 나중으로 나눌지 결정이 필요하다.
- `charness`에 manifest를 넣는 시점을 `Cautilus` 첫 release boundary 이후로 엄격히 미룰지 확인이 필요하다.

## References

- [docs/handoff.md](/home/ubuntu/cautilus/docs/handoff.md)
- [ceal-workbench-extraction.md](/home/ubuntu/cautilus/docs/ceal-workbench-extraction.md)
- [workflow.md](/home/ubuntu/cautilus/docs/workflow.md)
- [adapter-contract.md](/home/ubuntu/cautilus/docs/contracts/adapter-contract.md)
- [reporting.md](/home/ubuntu/cautilus/docs/contracts/reporting.md)
- [adapter.example.yaml](/home/ubuntu/cautilus/examples/adapter.example.yaml)
- [resolve_adapter.py](/home/ubuntu/cautilus/scripts/resolve_adapter.py)
- [init_adapter.py](/home/ubuntu/cautilus/scripts/init_adapter.py)
- [WORKBENCH_PRODUCT_EXTRACTION_PLAN.md](/home/ubuntu/ceal/WORKBENCH_PRODUCT_EXTRACTION_PLAN.md)
- `/home/ubuntu/ceal/.agents/workbench-adapter.yaml`
- `/home/ubuntu/ceal/.agents/workbench-adapters/code-quality.yaml`
- `/home/ubuntu/ceal/.agents/workbench-adapters/skill-smoke.yaml`
- `python3 /home/ubuntu/cautilus/scripts/resolve_adapter.py --repo-root /home/ubuntu/ceal`
- `python3 /home/ubuntu/cautilus/scripts/resolve_adapter.py --repo-root /home/ubuntu/ceal --adapter-name code-quality`
- `python3 /home/ubuntu/cautilus/scripts/resolve_adapter.py --repo-root /home/ubuntu/ceal --adapter-name skill-smoke`
