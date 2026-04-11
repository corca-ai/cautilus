# Cautilus Handoff

## Workflow Trigger

- 다음 세션에서 이 문서를 멘션하면 먼저
  [README.md](/home/ubuntu/cautilus/README.md),
  [AGENTS.md](/home/ubuntu/cautilus/AGENTS.md),
  [docs/master-plan.md](/home/ubuntu/cautilus/docs/master-plan.md),
  [docs/contracts/behavior-intent.md](/home/ubuntu/cautilus/docs/contracts/behavior-intent.md),
  [docs/contracts/scenario-proposal-inputs.md](/home/ubuntu/cautilus/docs/contracts/scenario-proposal-inputs.md),
  [docs/specs/self-dogfood.spec.md](/home/ubuntu/cautilus/docs/specs/self-dogfood.spec.md),
  [skills/cautilus/SKILL.md](/home/ubuntu/cautilus/skills/cautilus/SKILL.md)
  를 읽는다.
- 시작 workflow는 `impl` 기준이다.
- product-owned seam이면 `cautilus`에서 먼저 고친다. host adapter, prompt,
  policy, consumer artifact는 host 소유다.
- `artifact-root auto layout` slice는 per-run materializer로 닫혔다. 기본
  pickup은 이제 아래 Next Session의 순서를 따른다. consumer-side
  `--artifact-root` 통합은 여전히 defer다.
- 세션을 시작하기 전에 `node --version`이 `v22.x` 이상인지 먼저 본다.
  Node 20에서는 self-dogfood test fixture가 `node - <<EOF ... await import()`
  패턴 때문에 깨진다. `.n`이 깔려 있다면 `N_PREFIX=/home/ubuntu/.n n install 22`로
  한 번만 올려두면 된다.

## Current State

- `cautilus workspace new-run`이 product-owned per-run artifact-root
  materializer로 들어왔다.
  - `scripts/agent-runtime/new-workspace-run.mjs`가 `--root <dir>`와 optional
    `--label <name>`을 받아 `<YYYYMMDDTHHMMSSmmmZ>-<slug>/` 디렉터리를 한 번만
    만든다. label은 slugify되고, 비거나 unsafe하면 `run`으로 fallback한다.
  - 안에 `run.json` manifest(`cautilus.workspace_run_manifest.v1`,
    `startedAt`, `label`)가 쓰이고, `prune-workspace-artifacts.mjs`의
    `EXACT_MARKERS`에 `run.json`이 추가돼서 빈 bundle도 pruner가 곧바로
    recognize한다.
  - collision, missing root, non-directory root는 모두 loud fail이다. CLI는
    resolved `runDir`을 포함한 JSON 한 덩어리를 stdout으로 내보낸다.
  - consumer CLI (`mode evaluate`, `workspace prepare-compare`,
    `review variants`, `review prepare-input`)는 손대지 않았다. operator가
    `runDir`을 받아 `--output-dir`에 직접 넘긴다.
  - `bin/cautilus workspace new-run` subcommand로 wiring 완료. README,
    `docs/workflow.md`, bundled + packaged `skills/cautilus/SKILL.md`,
    `docs/specs/current-product.spec.md`, `docs/specs/standalone-surface.spec.md`
    모두 같은 prose/guard를 가진다.
  - `scripts/agent-runtime/new-workspace-run.test.mjs`는 slugifier,
    timestamp formatter, createRun happy/edge path, CLI smoke, pruner
    integration까지 10개 test로 고정한다.
- self-dogfood `latest/` 위에 product-owned 정적 HTML 뷰가 들어왔다.
  - `scripts/render-self-dogfood-html.mjs`가 `summary.json`, `report.json`,
    `review-summary.json`을 읽어 self-contained `index.html`을 쓴다.
    inline CSS, no external asset, no script tag, 모든 텍스트는 escape된다.
  - `npm run dogfood:self`는 `latest.md`를 쓸 때 같은 transaction에서
    `index.html`도 다시 쓴다.
  - `npm run dogfood:self:html`은 LLM review를 다시 돌리지 않고 현재 체크인된
    JSON 번들에서만 HTML을 다시 뽑는 read-only refresh 경로다.
  - `artifacts/self-dogfood/latest/index.html`은 published snapshot의 다섯
    번째 파일로 Git에 체크인되어 있다. `.gitignore` allowlist도 그에 맞춰
    확장되었다.
  - `docs/specs/self-dogfood.spec.md`가 새 파일과 npm scripts를 모두
    `check:source_guard`로 묶고, published-snapshot 경로 목록도 다섯 개로
    갱신되어 있다.
  - master plan item 6의 generic `cautilus report html` CLI는 여전히 defer다.
    이 slice는 self-dogfood surface 안으로 좁게 고정되어 있다.
- `cautilus.behavior_intent.v1`은 여전히 closed product-owned `behaviorSurface`
  catalog와 reusable dimension catalog를 가진다.
  - `operator_behavior`
  - `operator_cli`
  - `workflow_conversation`
  - `thread_followup`
  - `thread_context_recovery`
  - `skill_validation`
  - `operator_workflow_recovery`
  - `review_variant_workflow`
- runtime은 catalog 밖의 `behaviorSurface`와 dimension id를 거부한다.
  dimension kind와 surface applicability도 함께 검증한다.
- helper default는 seam-owned prose가 아니라 product-owned dimension ids를
  계속 사용한다.
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
- `report -> review -> optimize -> revision artifact`가 같은 contract를
  공유한다. `scenario proposal` seam도 같은 contract를 optional하게 carry한다.
- 세 normalization helper(`cli`, `chatbot`, `skill`)는 모두 intent profile을
  emit한다. host-declared profile도 product-owned dimension ids를 써야 하며
  summary는 canonicalized 된다.
- canonical self-dogfood claim은 "self-dogfood result를 정직하게 기록하고
  surfaced 하는가"로 계속 좁혀져 있다. `latest` summary는
  `gateRecommendation`과 `reportRecommendation`을 계속 분리한다.
- local proof (Node v22.22.2 기준):
  - `npm run verify`: 134/134 green (artifact-root auto layout slice가 test
    10개 추가)
  - `node ./bin/cautilus doctor --repo-root .`: `ready`
- 이번 세션에서 experiments를 다시 돌리지는 않았다. 마지막으로 기록된
  stronger-claim 상태는 여전히 `gate-honesty-a=blocker`,
  `gate-honesty-b=concern`, `binary-surface=concern`, `skill-surface=pass`,
  `review-completion=pass`이다.

## Next Session

1. 기본 pickup은 packaged SKILL.md drift 이중 차단이다.
   `scripts/release/distribution-surface.test.mjs`의
   `packaged cautilus skill stays in sync` test가 이미 돌지만,
   `docs/specs/self-dogfood.spec.md` 또는 `docs/specs/standalone-surface.spec.md`의
   `check:source_guard` rows에 `plugins/cautilus/skills/cautilus/SKILL.md`의
   핵심 패턴(예: `node ./bin/cautilus workspace new-run`)을 추가해
   bundled/packaged 두 곳이 같은 지시를 가지는지 spec layer에서도 고정할지
   결정한다. 이번 slice에서 두 파일을 손으로 mirror 했기 때문에 drift가 한
   번만 어긋나면 바로 깨진다.
2. consumer-side `--artifact-root` 통합(Option D)은 defer 그대로 유지한다.
   `mode evaluate`, `workspace prepare-compare`, `review variants`,
   `review prepare-input`이 각자 `--output-dir`을 그대로 쓰는 동안 operator는
   `workspace new-run`의 `runDir`을 stdin JSON에서 뽑아 넘긴다. 실제로 한
   workflow에서 여러 consumer가 같은 `runDir`을 공유했을 때 marker 충돌이
   나지 않는지 한 번 더 확인한다.
3. HTML view follow-ups는 다음 우선순위로 내려간다.
   - `artifacts/self-dogfood/experiments/latest/` 번들이 다시 쓰이기 시작하면
     그때 HTML view를 experiments surface까지 확장할지 결정한다. 지금은 해당
     디렉터리가 비어 있어서 defer.
4. `binary-surface` experiment가 `skill-surface`처럼 stable pass로 떨어졌는지
   다시 본다. 필요하면 enrichment prompt를 더 깎는다.
5. `quality` workflow가 canonical dogfood와 experiments를 어떻게 함께 요약해야
   operator에게 덜 거짓말 같은지 결론을 낸다.
6. 변경 후에는 항상 `npm run verify`를 다시 돌린다. 실행 전에 Node 22가 활성화
   되어 있는지 먼저 확인한다.

## Discuss

- artifact-root 결정은 per-run materializer(`workspace new-run`)까지 좁혔다.
  아직 열려 있는 후속 질문:
  - consumer CLI에 `--artifact-root` flag를 심어서 new-run 호출 자체도
    product가 내부에서 하도록 만들지 (Option D). 지금은 defer — 네 CLI를
    동시에 건드려야 하고 `--output-dir`과의 coexistence 규칙이 커진다.
  - `run.json` manifest에 workflow metadata(mode, baseline ref, adapter
    name)를 더 담을지. 지금은 `schemaVersion`, `label`, `startedAt`만이다.
- HTML view는 self-dogfood latest surface 안에서만 materialize 되었다.
  다음 결정은 두 가지다:
  - `experiments/`에도 같은 뷰를 낼지 (지금은 defer, 데이터가 없다)
  - host-agnostic `cautilus report html` CLI를 본격적으로 product-owned
    시킬지 (master plan item 6의 defer 조건, 즉 JSON/YAML report boundary가
    여러 consumer에서 이미 안정화되었는가를 먼저 검증해야 한다)
- behavior intent catalog는 여전히 닫혀 있다. 다음 결정은 intent taxonomy
  확장 여부가 아니라 위의 `--artifact-root` consumer 통합을 할지다.
- schema까지 catalog enum을 밀어넣을지는 여전히 deferred다. 지금 enforcing
  layer는 runtime과 tests다.

## Premortem

- 가장 쉬운 오해: "`index.html`이 self-dogfood의 source of truth다"라고
  착각해서 JSON을 손대지 않고 HTML을 직접 수정한다.
  아니다. footer와 spec 모두 read-only view라고 명시되어 있고, 어차피 다음
  `dogfood:self` run이 덮어쓴다. JSON 세 파일이 source of truth다.
- 두 번째 쉬운 오해: "self-dogfood skill/doc 업데이트는 bundled copy 하나만
  고치면 된다." 아니다. `skills/cautilus/SKILL.md`를 고칠 때마다
  `plugins/cautilus/skills/cautilus/SKILL.md`도 같이 건드려야 `packaged cautilus
  skill stays in sync with the repo-bundled skill source` test가 통과한다.
- 세 번째 오해: "JSON schema가 catalog를 강제하니 runtime 검증은 중복이다."
  아니다. 지금 enforcing layer는 runtime과 tests다.
- 네 번째 오해: "host-declared profile의 summary를 자유 prose로 계속 바꿔도
  된다." 아니다. dimension summary는 product-owned canonical summary로
  정규화된다.
- 다섯 번째 오해: "Node 20으로도 self-dogfood test가 돌 것이다." 아니다.
  `scripts/run-self-dogfood.test.mjs`,
  `scripts/run-self-dogfood-experiments.test.mjs`,
  `scripts/agent-runtime/run-workbench-executor-variants.test.mjs`의 fixture들이
  `node - <<EOF ... await import() ... EOF` 패턴을 쓴다. 이건 Node 22 이상의
  stdin ESM detection에 의존한다. 세션을 시작할 때 Node 22가 활성화되어 있는지
  먼저 확인한다.
- 여섯 번째 오해: "catalog를 닫았으니 helper defaults를 더 늘릴 때 문서 업데이트
  없이 code만 바꿔도 된다." 아니다. behavior-intent doc과 normalization docs를
  같이 바꿔야 drift가 없다.
- 일곱 번째 오해: "`workspace new-run`을 consumer 명령마다 한 번씩 새로
  호출해야 한다." 아니다. 한 workflow = 한 `runDir`이 기본이고, 그 아래
  `report.json`, `baseline/`, `candidate/`, `review-packet.json` 같은 서로
  다른 marker가 공존하도록 설계되어 있다. `run.json` manifest는 pruner가
  empty bundle을 recognize 하기 위한 marker일 뿐 workflow metadata가 아니다.
- 여덟 번째 오해: "`runDir`이 pruner가 알아서 관리하니까 operator는
  `--keep-last`를 넘길 필요가 없다." 아니다. `workspace prune-artifacts`는
  여전히 explicit opt-in이다. `new-run`만으로는 정리되지 않는다.

## References

- [README.md](/home/ubuntu/cautilus/README.md)
- [AGENTS.md](/home/ubuntu/cautilus/AGENTS.md)
- [docs/master-plan.md](/home/ubuntu/cautilus/docs/master-plan.md)
- [docs/contracts/behavior-intent.md](/home/ubuntu/cautilus/docs/contracts/behavior-intent.md)
- [docs/contracts/scenario-proposal-inputs.md](/home/ubuntu/cautilus/docs/contracts/scenario-proposal-inputs.md)
- [docs/specs/self-dogfood.spec.md](/home/ubuntu/cautilus/docs/specs/self-dogfood.spec.md)
- [scripts/agent-runtime/new-workspace-run.mjs](/home/ubuntu/cautilus/scripts/agent-runtime/new-workspace-run.mjs)
- [scripts/agent-runtime/new-workspace-run.test.mjs](/home/ubuntu/cautilus/scripts/agent-runtime/new-workspace-run.test.mjs)
- [scripts/agent-runtime/prune-workspace-artifacts.mjs](/home/ubuntu/cautilus/scripts/agent-runtime/prune-workspace-artifacts.mjs)
- [scripts/render-self-dogfood-html.mjs](/home/ubuntu/cautilus/scripts/render-self-dogfood-html.mjs)
- [scripts/render-self-dogfood-html.test.mjs](/home/ubuntu/cautilus/scripts/render-self-dogfood-html.test.mjs)
- [scripts/run-self-dogfood.mjs](/home/ubuntu/cautilus/scripts/run-self-dogfood.mjs)
- [artifacts/self-dogfood/latest/index.html](/home/ubuntu/cautilus/artifacts/self-dogfood/latest/index.html)
- [scripts/agent-runtime/behavior-intent.mjs](/home/ubuntu/cautilus/scripts/agent-runtime/behavior-intent.mjs)
- [scripts/agent-runtime/cli-proposal-candidates.mjs](/home/ubuntu/cautilus/scripts/agent-runtime/cli-proposal-candidates.mjs)
- [scripts/agent-runtime/chatbot-proposal-candidates.mjs](/home/ubuntu/cautilus/scripts/agent-runtime/chatbot-proposal-candidates.mjs)
- [scripts/agent-runtime/skill-proposal-candidates.mjs](/home/ubuntu/cautilus/scripts/agent-runtime/skill-proposal-candidates.mjs)
