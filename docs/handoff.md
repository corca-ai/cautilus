# Cautilus Handoff

## Workflow Trigger

- 다음 세션에서 이 문서를 멘션하면 `impl`로 이어서 standalone binary + bundled skill surface를 먼저 굳히고, 그 다음 Ceal을 consumer로 repoint하는 순서로 진행한다.
- 시작 직후 [README.md](/home/ubuntu/cautilus/README.md), [AGENTS.md](/home/ubuntu/cautilus/AGENTS.md), [master-plan.md](/home/ubuntu/cautilus/docs/master-plan.md), [workflow.md](/home/ubuntu/cautilus/docs/workflow.md), [current-product.spec.md](/home/ubuntu/cautilus/docs/specs/current-product.spec.md)를 읽고 현재 제품 경계와 다음 단계 계획을 다시 잡는다.
- 그 다음 bundled skill, CLI, executable spec이 같은 standalone surface를 가리키는지 확인하고, Ceal 관련 repoint는 consumer migration으로만 다룬다.

## Current State

- `Cautilus`는 Ceal `workbench`를 떼어내는 별도 intentful behavior evaluation product로 잡혔다.
- [ceal-workbench-extraction.md](/home/ubuntu/cautilus/docs/ceal-workbench-extraction.md)에 extraction source-of-truth와 import sequence가 정리돼 있다.
- `README.md`, `AGENTS.md`, `docs/specs/`, `docs/master-plan.md`, `package.json`, `eslint.config.mjs`가 추가돼 이제 이 리포만의 제품 문서와 품질 바닥이 생겼다.
- minimal CLI [bin/cautilus](/home/ubuntu/cautilus/bin/cautilus)가 추가돼 `adapter resolve`, `adapter init`, `review variants`를 직접 호출할 수 있다.
- bundled standalone skill [skills/cautilus/SKILL.md](/home/ubuntu/cautilus/skills/cautilus/SKILL.md)이 추가돼 binary와 같은 workflow surface를 문서화하기 시작했다.
- standalone `doctor` command가 추가돼 host repo의 adapter readiness를 deterministic하게 검사할 수 있다.
- official adapter contract는 `cautilus-adapter.yaml` 과
  `cautilus-adapters/` 로 고정됐다.
- temp repo smoke test가 추가돼 `adapter init -> doctor -> review variants`가 Ceal-owned path 없이 끝까지 도는지 검증한다.
- Ceal 1차 consumer repoint가 진행돼 generic adapter-resolution test, generic variant runner, skill bootstrap command, `skill-smoke` iterate command이 `Cautilus` surface를 보게 됐다.
- generic scenario/history contract 초안이 [scenario-history.md](/home/ubuntu/cautilus/docs/contracts/scenario-history.md) 로 추가돼 profile, graduation, baseline-cache 규칙을 제품 경계로 분리하기 시작했다.
- generic scenario proposal source contract 초안이 [scenario-proposal-sources.md](/home/ubuntu/cautilus/docs/contracts/scenario-proposal-sources.md) 로 추가돼 recent activity, blocked run, coverage source port를 제품 경계로 분리하기 시작했다.
- [scenario-history.mjs](/home/ubuntu/cautilus/scripts/agent-runtime/scenario-history.mjs) 가 추가돼 selection, graduation, history persistence helper가 이제 제품-owned runtime seam으로 존재한다.
- [scenario-proposals.mjs](/home/ubuntu/cautilus/scripts/agent-runtime/scenario-proposals.mjs) 가 추가돼 normalized proposal candidate를 merge, rank, draft scenario payload로 바꾸는 첫 product-owned runtime seam이 생겼다.
- minimal CLI [bin/cautilus](/home/ubuntu/cautilus/bin/cautilus)에 `scenario propose`가 추가돼 normalized input packet에서 standalone proposal packet을 직접 만들 수 있다.
- checked-in example input [fixtures/scenario-proposals/standalone-input.json](/home/ubuntu/cautilus/fixtures/scenario-proposals/standalone-input.json) 과 `bin/cautilus` test가 붙어 proposal generation도 Ceal-owned path 없이 검증된다.
- [scenario-proposal-inputs.md](/home/ubuntu/cautilus/docs/contracts/scenario-proposal-inputs.md) 가 추가돼 `scenario propose` 앞단의 host-owned packet boundary를 이제 제품 계약으로 설명할 수 있다.
- `scenario prepare-input` reference command와 split fixtures가 추가돼 host-owned normalization seam도 file-based executable surface로 설명할 수 있다.
- proposal input/output schema fixture가 추가돼 packet contract를 narrative만이 아니라 checked-in artifact로도 검증하기 시작했다.
- `chatbot` / `skill`을 첫 use-case-specific normalization helper 후보로 잡는 방향이 정리됐다. Ceal은 `chatbot` primary reference, charness는 `skill` primary reference, crill은 durable workflow edge-case reference로 본다.
- [chatbot-proposal-candidates.mjs](/home/ubuntu/cautilus/scripts/agent-runtime/chatbot-proposal-candidates.mjs) 가 추가돼 review clarification, event-triggered follow-up, ambiguous confirmation blocked run을 generic `proposalCandidates`로 바꾸는 첫 `chatbot` helper seam이 생겼다.
- `scenario normalize chatbot` command와 checked-in input fixture가 추가돼 `chatbot` helper도 이제 standalone binary surface로 바로 부를 수 있다.
- [skill-proposal-candidates.mjs](/home/ubuntu/cautilus/scripts/agent-runtime/skill-proposal-candidates.mjs) 가 추가돼 `charness`형 smoke/validation failure와 `crill`형 blocked workflow artifact를 같은 generic `proposalCandidates` contract로 바꾸는 첫 `skill` helper seam이 생겼다.
- `scenario normalize skill` command와 checked-in input fixture가 추가돼 `skill` helper도 이제 standalone binary surface로 바로 부를 수 있다.
- `chatbot` / `skill` helper input packet용 checked-in JSON Schema artifact가 추가돼 use-case helper boundary도 fixture와 함께 executable contract가 됐다.
- `ceal`, `charness`, `crill` shaped normalized packet example도 checked-in fixture/test로 추가돼 consumer-owned reader와 product-owned helper boundary를 repo 안에서 바로 보여줄 수 있다.
- [consumer-readiness.md](/home/ubuntu/cautilus/docs/consumer-readiness.md) 가 추가돼 현재 honest consumer status가 고정됐다. 지금은 `ceal`, `charness`, `crill` 모두 official `cautilus-adapter` 기준 live consumer이고, 각 repo는 동시에 다른 normalization reference 역할도 가진다.
- [consumer-migration.md](/home/ubuntu/cautilus/docs/consumer-migration.md)가 추가돼
  `charness`, `crill` 같은 target repo를 공식 `cautilus-adapter`
  contract로 올리는 순서가 문서화됐다.
- `README.md`, `workflow.md`, `master-plan.md`, bundled skill이 이제
  `intentful behavior evaluation`을 제품 프레이밍으로 직접 설명한다.
- [release-boundary.md](/home/ubuntu/cautilus/docs/release-boundary.md)가 추가돼
  지금 단계의 standalone install surface와 consumer-owned surface가
  명시됐다.
- [adapter-contract.md](/home/ubuntu/cautilus/docs/contracts/adapter-contract.md)와
  [consumer-migration.md](/home/ubuntu/cautilus/docs/consumer-migration.md)에
  root `cautilus-adapter.yaml`를 언제 named `cautilus-adapters/`로 분리할지
  explicit split criteria가 추가됐다.
- `fullCheck`는 scenario selection은 전체로 열되 `trainRunCount`나 graduation history는 전진시키지 않는 규칙으로 고정됐다.
- `scenario summarize-telemetry` command가 추가돼 explicit scenario result
  packet이나 persisted history에서 scenario별 cost/token/duration summary를
  바로 만들 수 있다.
- `report build` command와 checked-in report fixture/schema가 추가돼
  held-out/full-gate mode run과 scenario telemetry를
  `cautilus.report_packet.v1`로 올릴 수 있다.
- `mode evaluate` command가 추가돼 adapter-defined iterate/held-out/
  comparison/full-gate command template를 직접 실행하고, command
  observation + report input + final report packet을 한 번에 남길 수 있다.
- `review prepare-input` command가 추가돼 report packet, adapter
  `comparison_questions`, `human_review_prompts`, artifact/report paths를 한
  review packet으로 묶을 수 있다.
- `cli evaluate` command와 checked-in CLI fixture/schema가 추가돼
  bounded command packet 하나를 실행하고 stdout/stderr/exit code/side
  effect expectation을 검사한 뒤 embedded report packet까지 만들 수 있다.
- [cli-evaluation.md](/home/ubuntu/cautilus/docs/contracts/cli-evaluation.md)가
  추가돼 CLI evaluation이 범용 test runner가 아니라 bounded intent packet
  surface라는 점을 제품 계약으로 고정했다.
- Ceal에서 generic runtime seam으로 볼 수 있는 executor-variant 러너와 검증용 테스트, review verdict schema를 가져왔다.
- [scripts/init_adapter.py](/home/ubuntu/cautilus/scripts/init_adapter.py)는 `PyYAML` 의존성을 제거하고 stdlib-only YAML writer로 바뀌었다.
- [workflow.md](/home/ubuntu/cautilus/docs/workflow.md)와 [adapter-contract.md](/home/ubuntu/cautilus/docs/contracts/adapter-contract.md)는 Ceal 최신 generic knowledge를 반영하도록 보강됐다.
- executor-variant summary는 이제 wall-clock latency를 항상 남기고,
  checked-in wrapper가 주면 optional cost/token telemetry도 함께 남긴다.
- `review variants` summary는 variant별 telemetry를 보존하면서, top-level
  aggregate cost/token/latency도 함께 쓴다.
- `npm install`, `npm run lint`, `npm run test`, `npm run verify`가 모두 통과했다.
- `Cautilus` resolver는 Ceal의 `skill-smoke`, `code-quality` adapter를 이미 읽을 수 있어 consumer repoint의 전제는 갖췄다.
- 아직 없는 것:
  - host-specific recent activity / blocked run mining adapter
  - example set을 넘는 다음 generic pattern class 확장 기준

## Next Session

1. `review prepare-input` 위에 prompt generation/runtime을 product-owned로
   올릴지, 계속 consumer-owned로 둘지 결정한다.
2. `mode evaluate`가 읽는 candidate result packet과 compare artifact
   contract를 더 엄격히 고정한다.
3. `cli evaluate`를 chatbot/skill use case와 어떻게 연결할지 정한다.
   다음 후보는 `cli` normalization helper, CLI-specific human-review prompt
   seam, compare artifact 연동이다.
4. 필요하면 consumer example 위에서 새로운 pattern class를 늘리고, raw
   reader logic은 여전히 consumer-owned로 남긴다.
5. Ceal migration을 handoff와 plan 기준으로 다시 자르고, product-owned
   runtime seam과 consumer-owned storage/operator seam을 명확히 나눈다.
6. wider reuse 전에 `release-boundary.md` 기준으로 package/install story를
   실제 배포 surface로 바꿀지 결정한다.

## Discuss

- official adapter naming은 `cautilus-adapter.yaml` 과 `cautilus-adapters/` 로 고정한다.
- standalone skill 배포 경로를 repo-local `skills/`로만 둘지, 추후 installable package 형태까지 같이 정의할지 정해야 한다.
- Ceal repoint를 한 번에 할지, tests/review-variant/adapter-resolution부터 단계적으로 할지 정해야 한다.
- scenario proposal engine을 Slack/Ceal storage model에서 얼마나 빨리 분리할지 결정이 필요하다.
- cost/latency telemetry를 adapter-driven mode execution이 직접 report packet으로 남길지, 중간 input packet을 남긴 뒤 report를 조립할지 정해야 한다.
- `charness`나 다른 consumer에 공개할 release boundary를 언제 처음 만들지 정해야 한다.
- npm package, Homebrew, skill installer 같은 배포 채널은 아직 정의하지 않았다.

## References

- [docs/handoff.md](/home/ubuntu/cautilus/docs/handoff.md)
- [README.md](/home/ubuntu/cautilus/README.md)
- [AGENTS.md](/home/ubuntu/cautilus/AGENTS.md)
- [ceal-workbench-extraction.md](/home/ubuntu/cautilus/docs/ceal-workbench-extraction.md)
- [master-plan.md](/home/ubuntu/cautilus/docs/master-plan.md)
- [workflow.md](/home/ubuntu/cautilus/docs/workflow.md)
- [adapter-contract.md](/home/ubuntu/cautilus/docs/contracts/adapter-contract.md)
- [consumer-migration.md](/home/ubuntu/cautilus/docs/consumer-migration.md)
- [reporting.md](/home/ubuntu/cautilus/docs/contracts/reporting.md)
- [cli-evaluation.md](/home/ubuntu/cautilus/docs/contracts/cli-evaluation.md)
- [scenario-history.md](/home/ubuntu/cautilus/docs/contracts/scenario-history.md)
- [scenario-proposal-sources.md](/home/ubuntu/cautilus/docs/contracts/scenario-proposal-sources.md)
- [current-product.spec.md](/home/ubuntu/cautilus/docs/specs/current-product.spec.md)
- [scenario-history.mjs](/home/ubuntu/cautilus/scripts/agent-runtime/scenario-history.mjs)
- [build-report-packet.mjs](/home/ubuntu/cautilus/scripts/agent-runtime/build-report-packet.mjs)
- [build-review-packet.mjs](/home/ubuntu/cautilus/scripts/agent-runtime/build-review-packet.mjs)
- [evaluate-adapter-mode.mjs](/home/ubuntu/cautilus/scripts/agent-runtime/evaluate-adapter-mode.mjs)
- [evaluate-cli-intent.mjs](/home/ubuntu/cautilus/scripts/agent-runtime/evaluate-cli-intent.mjs)
- [report-input.json](/home/ubuntu/cautilus/fixtures/reports/report-input.json)
- [doctor-missing-adapter.json](/home/ubuntu/cautilus/fixtures/cli-evaluation/doctor-missing-adapter.json)
- [adapter.example.yaml](/home/ubuntu/cautilus/examples/adapter.example.yaml)
- [review-verdict.schema.json](/home/ubuntu/cautilus/fixtures/workbench/review-verdict.schema.json)
- [cautilus](/home/ubuntu/cautilus/bin/cautilus)
- [skills/cautilus/SKILL.md](/home/ubuntu/cautilus/skills/cautilus/SKILL.md)
- [resolve_adapter.py](/home/ubuntu/cautilus/scripts/resolve_adapter.py)
- [init_adapter.py](/home/ubuntu/cautilus/scripts/init_adapter.py)
- [run-workbench-review-variant.sh](/home/ubuntu/cautilus/scripts/agent-runtime/run-workbench-review-variant.sh)
- [run-workbench-executor-variants.mjs](/home/ubuntu/cautilus/scripts/agent-runtime/run-workbench-executor-variants.mjs)
- [workbench-adapter-resolution.test.mjs](/home/ubuntu/cautilus/scripts/agent-runtime/workbench-adapter-resolution.test.mjs)
- [run-workbench-review-variant.test.mjs](/home/ubuntu/cautilus/scripts/agent-runtime/run-workbench-review-variant.test.mjs)
- [run-workbench-executor-variants.test.mjs](/home/ubuntu/cautilus/scripts/agent-runtime/run-workbench-executor-variants.test.mjs)
- [WORKBENCH_PRODUCT_EXTRACTION_PLAN.md](/home/ubuntu/ceal/WORKBENCH_PRODUCT_EXTRACTION_PLAN.md)
- [/home/ubuntu/ceal/.agents/skills/workbench/SKILL.md](/home/ubuntu/ceal/.agents/skills/workbench/SKILL.md)
- `/home/ubuntu/ceal/.agents/cautilus-adapter.yaml`
- `/home/ubuntu/ceal/.agents/cautilus-adapters/code-quality.yaml`
- `/home/ubuntu/ceal/.agents/cautilus-adapters/skill-smoke.yaml`
- `/home/ubuntu/ceal/scripts/agent-runtime/prompt-benchmark-profile.mjs`
- `/home/ubuntu/ceal/scripts/agent-runtime/propose-audit-scenarios.mjs`
- `python3 /home/ubuntu/cautilus/scripts/resolve_adapter.py --repo-root /home/ubuntu/ceal`
- `python3 /home/ubuntu/cautilus/scripts/resolve_adapter.py --repo-root /home/ubuntu/ceal --adapter-name code-quality`
- `python3 /home/ubuntu/cautilus/scripts/resolve_adapter.py --repo-root /home/ubuntu/ceal --adapter-name skill-smoke`
- `npm run lint`
- `npm run test`
- `npm run verify`
