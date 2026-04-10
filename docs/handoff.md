# Cautilus Handoff

## Workflow Trigger

- 다음 세션에서 이 문서를 멘션하면 `impl`로 이어서 `ceal` 또는 남은 deeper consumer verification부터 시작한다.
- 시작 직후 [README.md](/home/ubuntu/cautilus/README.md), [AGENTS.md](/home/ubuntu/cautilus/AGENTS.md), [docs/master-plan.md](/home/ubuntu/cautilus/docs/master-plan.md), [docs/workflow.md](/home/ubuntu/cautilus/docs/workflow.md), [docs/consumer-readiness.md](/home/ubuntu/cautilus/docs/consumer-readiness.md)를 읽는다.
- 작업 시작점은 [cautilus](/home/ubuntu/cautilus) repo다. 여기서 binary와 contracts를 기준으로 판단하고, [crill](/home/ubuntu/crill) 에 official `cautilus-adapter` 기준으로 `doctor`, relevant mode/review/cli paths를 실제 consumer 검증으로 태운다.
- gap이 product-owned runtime/contract 문제면 먼저 [cautilus](/home/ubuntu/cautilus) 에서 고치고, consumer-owned adapter/artifact/policy 문제면 [crill](/home/ubuntu/crill) 에서 고친다.

## Current State

- `Cautilus`는 standalone binary + bundled skill 제품 경계를 거의 닫았다.
- 공식 adapter contract는 `cautilus-adapter.yaml` / `cautilus-adapters/` 로 고정됐다.
- standalone surface는 `adapter resolve/init`, `doctor`, `workspace prepare-compare`, `mode evaluate`, `review prepare-input`, `review build-prompt-input`, `review render-prompt`, `review variants`, `cli evaluate`, `scenario normalize chatbot|cli|skill`, `scenario prepare-input`, `scenario propose`, `scenario summarize-telemetry` 까지 다 있다.
- `review variants` runner는 이제 `--report-file`만으로 review packet, prompt-input, rendered prompt를 합성할 수 있다.
- scenario proposal helper는 `chatbot`, `cli`, `skill` 세 유즈케이스를 모두 first-class로 가진다.
- release/install surface는 [install.sh](/home/ubuntu/cautilus/install.sh), [docs/releasing.md](/home/ubuntu/cautilus/docs/releasing.md), [scripts/release/fetch-github-archive-sha256.mjs](/home/ubuntu/cautilus/scripts/release/fetch-github-archive-sha256.mjs), [scripts/release/render-homebrew-formula.mjs](/home/ubuntu/cautilus/scripts/release/render-homebrew-formula.mjs), [scripts/release/resolve-release-targets.mjs](/home/ubuntu/cautilus/scripts/release/resolve-release-targets.mjs), [verify.yml](/home/ubuntu/cautilus/.github/workflows/verify.yml), [release-artifacts.yml](/home/ubuntu/cautilus/.github/workflows/release-artifacts.yml) 까지 checked-in 상태다.
- release target 기본값은 `origin`에서 유도한다. 현재 source repo는 `corca-ai/cautilus`, tap target은 `corca-ai/homebrew-tap` 이다.
- 최신 `cautilus` 커밋은 `73dacf0` (`Add product-owned A/B worktree preparation`) 이고, 이번 상태에서 `npm run verify`는 통과했다.
- `ceal`, `charness`, `crill` 모두 readiness 문서상 official adapter consumer이지만, 아직 남은 핵심은 실제 multi-consumer verification이다.
- 이번 세션에서 `crill` consumer verification은 실제로 닫았다.
  root adapter `full_gate`는 `accept-now`를 냈고, `/home/ubuntu/crill/.agents/cautilus-adapters/cli-smoke.yaml` 와 `/home/ubuntu/crill/.agents/cautilus-adapters/operator-recovery.yaml` 도 각각 `full_gate`로 통과했다.
- `crill`은 이제 explicit `cli evaluate` packet도 가진다.
  `node ./bin/cautilus cli evaluate --input /home/ubuntu/crill/tests/fixtures/cautilus/cli-help.json`
  이 `accept-now`를 냈다.
- `crill operator-recovery` 는 이제 report-driven `review variants`도 실제로 돈다.
  `WORKBENCH_REVIEW_TIMEOUT_SECONDS=180 node ./bin/cautilus review variants --repo-root /home/ubuntu/crill --adapter-name operator-recovery --workspace /home/ubuntu/crill --report-file /tmp/cautilus-crill-operator-recovery-review/report.json --output-dir /tmp/cautilus-crill-operator-review`
  이 one-variant passing summary를 남겼다.
- A/B 비교는 이제 product-owned helper로도 닫혔다.
  `node ./bin/cautilus workspace prepare-compare --repo-root . --baseline-ref origin/main --output-dir /tmp/cautilus-compare`
  가 baseline/candidate git worktree를 준비해 준다.

## Next Session

1. `ceal` consumer verification을 다시 열지, 아니면 `crill`의 다음 깊이인 compare/A-B consumer artifacts를 체크인할지 선택한다.
2. `crill` 쪽을 더 밀면 current named adapters와 explicit packet을 기준으로 시작한다.
   - `cli-smoke`
   - `operator-recovery`
   - `tests/fixtures/cautilus/cli-help.json`
3. `crill`은 이제 `review variants` 와 explicit CLI packet까지 있다.
   다음 남은 축은 compare/A-B 를 consumer-owned artifact로 올릴지 여부다.
4. 필요하면 `workspace prepare-compare` 와 named adapter `comparison_command_templates` 를 묶어 `crill` compare surface를 체크인한다.
5. 다음 결과를 [docs/consumer-readiness.md](/home/ubuntu/cautilus/docs/consumer-readiness.md) 와 이 handoff에 계속 반영한다.

## Discuss

- 현재 큰 제품 설계 결정은 대부분 끝났다. 다음 세션의 중심은 새 설계가 아니라 남은 consumer depth (`ceal` 또는 `crill review variants` / explicit CLI packet) 다.
- `crill` root/named adapter 검증 후 남는 큰 축은 `ceal` migration 심화, `crill review variants` 같은 더 깊은 consumer surface, 그리고 실제 release cadence 운영 정리다.
- tap target은 더 이상 미정이 아니다. 남은 것은 tap repo 운영 절차이지 target discovery가 아니다.

## References

- [README.md](/home/ubuntu/cautilus/README.md)
- [AGENTS.md](/home/ubuntu/cautilus/AGENTS.md)
- [docs/master-plan.md](/home/ubuntu/cautilus/docs/master-plan.md)
- [docs/workflow.md](/home/ubuntu/cautilus/docs/workflow.md)
- [docs/consumer-readiness.md](/home/ubuntu/cautilus/docs/consumer-readiness.md)
- [docs/consumer-migration.md](/home/ubuntu/cautilus/docs/consumer-migration.md)
- [docs/releasing.md](/home/ubuntu/cautilus/docs/releasing.md)
- [bin/cautilus](/home/ubuntu/cautilus/bin/cautilus)
- [scripts/agent-runtime/run-workbench-executor-variants.mjs](/home/ubuntu/cautilus/scripts/agent-runtime/run-workbench-executor-variants.mjs)
- [scripts/release/resolve-release-targets.mjs](/home/ubuntu/cautilus/scripts/release/resolve-release-targets.mjs)
- [/home/ubuntu/crill/.agents/cautilus-adapter.yaml](/home/ubuntu/crill/.agents/cautilus-adapter.yaml)
- [/home/ubuntu/crill](/home/ubuntu/crill)
