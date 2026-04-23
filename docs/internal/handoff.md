# Cautilus Handoff

## Workflow Trigger

다음 세션의 기본 pickup은 `charness:impl`로 Go runtime consolidation의 다음 슬라이스를 진행하는 것이다.
먼저 [docs/contracts/go-runtime-consolidation.md](../contracts/go-runtime-consolidation.md), [docs/maintainers/go-runtime-consolidation-premortem.md](../maintainers/go-runtime-consolidation-premortem.md), [docs/contracts/active-run.md](../contracts/active-run.md), [docs/contracts/live-run-invocation.md](../contracts/live-run-invocation.md), [docs/contracts/workbench-instance-discovery.md](../contracts/workbench-instance-discovery.md)를 다시 읽는다.
이번 pickup의 기준은 shipped runtime semantics를 Go가 소유하고, runtime duplicate는 하위호환성 고려 없이 제거할 수 있다는 점이다.
instruction-surface나 init-repo 운영 표면을 건드리는 요청이면 먼저 [docs/contracts/instruction-surface.md](../contracts/instruction-surface.md), [docs/internal/working-patterns.md](./working-patterns.md), [charness-artifacts/init-repo/latest.md](../../charness-artifacts/init-repo/latest.md)를 같이 읽는다.
이 handoff는 mention-only pickup 기준 문서이며, handoff adapter는 `docs/internal/handoff.md`를 canonical artifact로 해석한다.

## Current State

- Go runtime consolidation의 first implementation slice는 landed 상태다.
- `mode evaluate`의 profile-backed scenario selection, history persistence, baseline-cache seed semantics는 Go path에 있다.
  구현 시작점은 [internal/app/remaining_commands.go](../../internal/app/remaining_commands.go)와 [internal/runtime/scenario_history.go](../../internal/runtime/scenario_history.go)다.
- `workbench discover`, `workbench run-live`, `workbench run-simulator-persona`, product-owned evaluator contract, `workbench run-scenarios`, `workbench prepare-request-batch`의 shipped semantics는 Go command surface가 소유한다.
  자세한 runtime 상태는 [docs/contracts/go-runtime-consolidation.md](../contracts/go-runtime-consolidation.md)와 관련 command files를 따른다.
- `run-executor-variants`와 `evaluate-adapter-mode` direct Node entrypoint는 아직 thin Go CLI shim으로 남아 있다.
  유지 정책은 없고, equivalent Go path가 landed한 seam부터 제거할 수 있다.
- 이번 세션에서 init-repo 운영 표면 정규화가 landed 됐다.
  관련 커밋은 `6466341`, `5e7cdc6`, `24fdec0`이다.
  핵심은 install pointer를 `README.md`로 맞춘 것, `docs/internal/working-patterns.md`를 repo memory에 넣은 것, startup bootstrap을 `find-skills` 중심으로 명확히 한 것, bundled `skills/cautilus/` semantic-change proof policy와 operator acceptance read-first path를 보강한 것이다.
- instruction-surface nested override failure는 coding-agent root-first 계약으로 정리됐다.
  관련 커밋은 `60fd201`과 `fd41fa2`이며, 실제 구현 결정은 `fd41fa2`다.
  `charness-artifacts/debug/latest.md`에는 실패 분석이 남아 있으므로, 그 문서를 읽을 때는 root-first fix가 이미 landed 됐다는 점을 같이 적용한다.
- 최근 확인 결과 `./bin/cautilus instruction-surface test --repo-root . --adapter-name self-dogfood-instruction-surface`는 `accept-now`, 5/5 passed 상태였고, `npm run verify`, `npm run hooks:check`도 통과했다.
- Charness 쪽 후속은 `corca-ai/charness#64`에 남겨져 있다.
  init-repo/quality 권장사항 수용, multi-review posture, 게이트와 어댑터의 강결합 위험은 Cautilus 기본 runtime pickup의 범위가 아니라 Charness follow-up로 다룬다.

## Next Session

1. `git status --short`로 사용자 변경과 이전 세션 변경을 먼저 분리한다.
2. 기본 경로라면 `charness:impl`로 next runtime slice를 시작하고, [docs/contracts/go-runtime-consolidation.md](../contracts/go-runtime-consolidation.md)의 완료된 first implementation slice와 이어지는 workbench/live-run migration 우선순위를 다시 확인한다.
3. batch primitive의 next probe는 prep surface 확장 쪽이다.
   draft scenario 배열만으로 충분한지, 아니면 scenario proposals packet이나 consumer scenario catalog를 product prep command가 직접 읽어야 하는지 다시 자른다.
4. `run-executor-variants`와 `evaluate-adapter-mode` shim removal은 early cleanup 후보다.
   하위호환성은 고려하지 않으므로 equivalent Go path가 landed한 seam은 direct Node runtime entrypoint를 제거할 수 있다.
5. packet-builder surfaces는 첫 대상이 아니다.
   workbench/live-run runtime seam과 batch primitive 후속 slice를 먼저 정리한 뒤, builder 계층이 실제 shipped semantics를 소유하는지 다시 분류한다.
6. 해당 seam을 옮기면 docs와 bundled skill references도 같은 슬라이스에서 같이 정리한다.

## Discuss

- second-wave migration에서 packet-builder surfaces를 어디까지 Go로 끌어올릴지
- `prepare-request-batch`의 다음 제품 소유 범위를 scenario proposals packet이나 consumer scenario catalog reading까지 넓힐지
- instruction-surface나 init-repo 쪽 요청으로 전환되면, root-first 계약과 Charness issue #64의 범위를 Cautilus runtime 작업과 섞지 않을지

## References

- [docs/contracts/go-runtime-consolidation.md](../contracts/go-runtime-consolidation.md)
- [docs/maintainers/go-runtime-consolidation-premortem.md](../maintainers/go-runtime-consolidation-premortem.md)
- [docs/contracts/active-run.md](../contracts/active-run.md)
- [docs/contracts/live-run-invocation.md](../contracts/live-run-invocation.md)
- [docs/contracts/workbench-instance-discovery.md](../contracts/workbench-instance-discovery.md)
- [docs/contracts/instruction-surface.md](../contracts/instruction-surface.md)
- [docs/internal/working-patterns.md](./working-patterns.md)
- [charness-artifacts/init-repo/latest.md](../../charness-artifacts/init-repo/latest.md)
