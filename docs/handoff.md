# Cautilus Handoff

## Workflow Trigger

- 다음 세션에서 이 문서를 멘션하면 먼저
  [README.md](/home/ubuntu/cautilus/README.md),
  [AGENTS.md](/home/ubuntu/cautilus/AGENTS.md),
  [docs/master-plan.md](/home/ubuntu/cautilus/docs/master-plan.md),
  [docs/contracts/active-run.md](/home/ubuntu/cautilus/docs/contracts/active-run.md),
  [docs/contracts/behavior-intent.md](/home/ubuntu/cautilus/docs/contracts/behavior-intent.md),
  [docs/contracts/scenario-proposal-inputs.md](/home/ubuntu/cautilus/docs/contracts/scenario-proposal-inputs.md),
  [docs/specs/self-dogfood.spec.md](/home/ubuntu/cautilus/docs/specs/self-dogfood.spec.md),
  [scripts/agent-runtime/active-run.mjs](/home/ubuntu/cautilus/scripts/agent-runtime/active-run.mjs),
  [scripts/agent-runtime/workspace-start.mjs](/home/ubuntu/cautilus/scripts/agent-runtime/workspace-start.mjs),
  [scripts/agent-runtime/evaluate-adapter-mode.mjs](/home/ubuntu/cautilus/scripts/agent-runtime/evaluate-adapter-mode.mjs),
  [skills/cautilus/SKILL.md](/home/ubuntu/cautilus/skills/cautilus/SKILL.md)
  를 읽는다.
- 시작 workflow는 `impl` 기준이다.
- product-owned seam이면 `cautilus`에서 먼저 고친다. host adapter, prompt,
  policy, consumer artifact는 host 소유다.
- `artifact-root auto layout` slice는 active-run env var contract로
  정착되었다. 기본 pickup은 아래 Next Session 순서를 따른다. active-run
  helper, `workspace start` entry, `docs/contracts/active-run.md` 모두
  확정된 상태. `mode evaluate` (slice 3)와 `workspace prepare-compare`
  (slice 4) 둘 다 `resolveRunDir`을 통해 env var contract에 wired 되어
  있다. 다음 작업은 남은 consumer 명령들 (`review prepare-input`,
  `review variants`)을 같은 helper에 하나씩 wiring하는 것이다.
- 세션을 시작하기 전에 `node --version`이 `v22.x` 이상인지 먼저 본다.
  Node 20에서는 self-dogfood test fixture가 `node - <<EOF ... await import()`
  패턴 때문에 깨진다. `.n`이 깔려 있다면 `N_PREFIX=/home/ubuntu/.n n install 22`로
  한 번만 올려두면 된다.

## Current State

- packaged SKILL.md drift는 이제 spec layer에서도 이중 차단된다.
  - `docs/specs/standalone-surface.spec.md`의 `check:source_guard`에
    `plugins/cautilus/skills/cautilus/SKILL.md`(file_exists + 23개 명령 pattern)와
    `plugins/cautilus/skills/cautilus/agents/openai.yaml`(file_exists + `Cautilus`)
    row가 추가되었다. bundled `skills/cautilus/SKILL.md` block 바로 다음에
    같은 순서로 mirror 되어 있다.
  - `scripts/release/distribution-surface.test.mjs`의 `packaged cautilus skill
    stays in sync` test는 그대로 byte-equal을 보장한다. 이제 spec source_guard와
    distribution test 두 곳에서 packaged copy 누락을 잡는다.
- `cautilus workspace start`가 active-run env var contract의 happy-path
  entry로 들어왔다. `workspace new-run`은 `workspace start --json`로
  완전히 흡수되었다. parallel period 없이 single source of truth.
  - `scripts/agent-runtime/workspace-start.mjs`가 default mode에서
    `export CAUTILUS_RUN_DIR='<abs runDir>'` 한 줄을 stdout으로 찍는다.
    사용자/skill agent는 `eval "$(cautilus workspace start --label X)"`
    한 줄로 active run을 현재 shell에 박는다. JSON parser나 jq 의존 없음.
  - `--json`은 자동화 path. test와 internal script가 spawn해서 결과를
    받을 때만 쓴다. 기존 `new-workspace-run.mjs`의 JSON shape를 그대로
    유지한다.
  - `--root` 기본값은 `./.cautilus/runs/` (cwd 상대). 없으면 recursive로
    auto-create. `--label` 기본값은 `run`. 안에 `run.json` manifest
    (`cautilus.workspace_run_manifest.v1`)가 쓰이고 pruner의
    `EXACT_MARKERS`에 이미 등록되어 있다.
  - `scripts/agent-runtime/active-run.mjs`의 `resolveRunDir` helper가
    explicit `outputDir` > env var > auto-materialize 순으로 runDir을
    해결한다. consumer 명령들은 이걸 wiring하기 시작하면 path-threading이
    사라진다 (다음 슬라이스).
  - `scripts/agent-runtime/workspace-start.test.mjs`는 slugifier,
    timestamp formatter, shell single-quote escaping, shell-export rendering,
    createRun happy/edge path, default-root fallback, CLI shell-export 모드,
    `--json` 모드, default-root 자동 생성, pruner integration까지 17 test로
    고정한다. `active-run.test.mjs`는 helper 자체를 11 test로 잠근다.
  - `bin/cautilus workspace start` subcommand로 wiring 완료. README,
    `docs/workflow.md`, `docs/master-plan.md`, bundled + packaged
    `skills/cautilus/SKILL.md`, `docs/specs/current-product.spec.md`,
    `docs/specs/standalone-surface.spec.md` 모두 새 surface로 갱신됨.
- active-run env var contract가 durable 문서로 잠겼다.
  - `docs/contracts/active-run.md`가 env var 이름(`CAUTILUS_RUN_DIR`),
    precedence rule (`explicit --output-dir > env var > auto-materialize`),
    default root (`./.cautilus/runs/`, cwd 상대, 자동 생성), stdout
    shell-export 포맷, canonical filename 표(`report.json`,
    `<mode>-scenario-results.json`, `baseline/`, `candidate/`,
    `review-packet.json`, `evidence-input.json`, `optimize-proposal.json`,
    `variant-*.json`, `*.stdout`/`*.stderr` 등), "한 workflow = 한 runDir"
    invariant, 거절된 대안(Option D / state file / mtime-latest /
    zero-ceremony / bundled jq)의 이유를 한 파일에 고정한다.
  - `docs/specs/current-product.spec.md`가 이 파일을 `check:source_guard`
    (file_exists + `CAUTILUS_RUN_DIR`, `One Workflow = One runDir`,
    `Canonical Filenames`, `Rejected Alternatives`,
    `cautilus.workspace_run_manifest.v1` fixed pattern)로 잠근다. 섹션
    제목을 고치면 spec gate가 깨져서 drift를 잡는다.
  - 다음 세션의 consumer wiring 슬라이스들은 canonical filename 표를
    contract로 보고 slice 별 열린 항목(예: `<mode>-scenario-results.json`
    그대로 유지할지 `scenario-results.json`으로 고정할지)을 표 자체를
    갱신하는 형태로 확정한다.
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
- local proof (Node v22.22.2 기준, 이번 세션 마지막 측정값):
  - `npm run verify`: 150/150 green
  - `node ./scripts/check-specs.mjs`: `spec checks passed (4 specs, 396 guard rows)`
  - `node ./bin/cautilus doctor --repo-root .`: `ready`
  - 빠른 happy-path smoke:
    `eval "$(node ./bin/cautilus workspace start --label smoke)"` →
    `CAUTILUS_RUN_DIR`이 현재 shell에 박히고 `run.json` 마커가 생긴다.
- 이번 세션에서 experiments를 다시 돌리지는 않았다. 마지막으로 기록된
  stronger-claim 상태는 여전히 `gate-honesty-a=blocker`,
  `gate-honesty-b=concern`, `binary-surface=concern`, `skill-surface=pass`,
  `review-completion=pass`이다.
- slice 4 (`workspace prepare-compare` active-run wiring) 완료 상태:
  - `scripts/agent-runtime/prepare-compare-worktrees.mjs`가 `resolveRunDir`을
    import해서 `--output-dir`을 옵션으로 다룬다. precedence는 slice 3과
    동일하다 (`explicit > CAUTILUS_RUN_DIR > auto-materialize`).
    auto-materialize 경로에서는 stderr에 `Active run: <abs runDir>` 한 줄을
    찍는다. explicit과 env var 경로는 조용히 동작한다.
  - 기존 `ensureDirectory` helper는 `resolveRunDir`이 내부에서 `mkdirSync`를
    호출하므로 dead code가 되어 제거했다.
  - canonical filename은 `baseline/`, `candidate/` 디렉터리다. active run
    내부 retry 시나리오에서는 `removeExistingWorktree`가 git worktree
    registration을 먼저 푼 뒤 다시 붙인다. 같은 runDir에 두 번 호출해도
    `--force` 없이 collision-free로 동작한다. `run.json` marker와
    `baseline/`, `candidate/`는 한 runDir 안에서 공존한다.
  - `scripts/agent-runtime/prepare-compare-worktrees.test.mjs`에 4개
    regression test 추가: env var path, auto-materialize + `Active run:`
    banner, 같은 runDir retry 시 git worktree re-attach, explicit override가
    inherited `CAUTILUS_RUN_DIR`을 이기는 경로. 기존 2 test는 explicit
    `--output-dir` regression guard로 그대로 유지.
  - README, `docs/workflow.md`, bundled + packaged `skills/cautilus/SKILL.md`
    에 "--output-dir는 active run이 pinned 되어 있으면 생략 가능" 한 단락
    (README/workflow) 또는 한 문장(bundled/packaged SKILL.md)을 mirror.
  - `docs/contracts/active-run.md`의 `### Wired Consumers` 표에서
    `workspace prepare-compare` 행을 `wired`로 바꾸고 retry 시 git worktree
    re-attach가 자동이라는 note를 붙였다.
  - self-dogfood script는 `prepare-compare`를 직접 부르지 않으므로 parent
    shell에서 오염될 리스크가 없다.
- slice 3 (`mode evaluate` active-run wiring) 완료 상태:
  - `scripts/agent-runtime/evaluate-adapter-mode.mjs`가 `active-run.mjs`의
    `resolveRunDir`을 import해서 `--output-dir`을 옵션으로 다룬다.
    precedence는 `explicit --output-dir > CAUTILUS_RUN_DIR > auto-materialize
    (./.cautilus/runs/)`. auto-materialize 경로에서는 stderr에
    `Active run: <abs runDir>` 한 줄을 찍는다. explicit과 env var 경로는
    조용히 동작한다.
  - canonical `${mode}-scenario-results.json`은 그대로 유지 (여러 mode가
    한 runDir에 공존할 수 있도록).
  - `scripts/agent-runtime/evaluate-adapter-mode.test.mjs`에 4개 regression
    test 추가: env var path, auto-materialize + `Active run:` 로그,
    같은 runDir retry 시 `report.json` overwrite, explicit override가
    inherited `CAUTILUS_RUN_DIR`을 이기는 경로. 기존 7 test는 explicit
    `--output-dir` regression guard로 그대로 유지. 총 154/154 green.
  - README, `docs/workflow.md`, bundled + packaged `skills/cautilus/SKILL.md`
    에 "--output-dir는 active run이 pinned 되어 있으면 생략 가능" 한 줄을
    넣어 mirror. downstream 예시들은 여전히 `/tmp/cautilus-mode/...`를
    참조하므로 example chain 자체는 그대로.
  - `docs/contracts/active-run.md` Canonical Filenames 섹션에 `### Wired
    Consumers` 서브섹션을 추가하고 `mode evaluate`를 `wired`로 표시. 나머지
    consumer (`workspace prepare-compare`, `review prepare-input`,
    `review variants`)는 `not yet`으로 표시. 섹션 제목 자체는 spec
    source_guard가 잡고 있는 그대로 `Canonical Filenames`다.
  - self-dogfood scripts는 `--output-dir`을 explicit하게 넘기므로
    parent 세션의 stray `CAUTILUS_RUN_DIR`에 오염되지 않는다 (test 4가
    regression으로 고정).

## Next Session

1. **Slice 5: `review prepare-input` active-run wiring**. 다른 slice들과 달리
   output이 단일 파일(`review-packet.json`)이라 패턴이 약간 다르다. 구체
   작업:
   - `scripts/agent-runtime/build-review-packet.mjs` (또는 명령 구현 파일)
     에서 `--output` flag를 옵션으로 다룬다. explicit `--output`이면 그
     파일로, 없으면 runDir 안의 `review-packet.json`으로 떨어진다.
   - report 입력 경로(`--report-file`)도 active run 안의 `report.json`을
     default로 잡을지 결정해야 한다 — contract doc Probe Questions 섹션의
     file-in/file-out 질문이 여기에 걸려 있다. slice 시작 시 결정한 답을
     contract doc에 기록한다.
   - auto-materialize 경로에서 `Active run: <abs runDir>` stderr banner.
   - test 네 개 추가 (env var path, auto-materialize + banner, retry 시
     review-packet.json overwrite, explicit `--output` override).
   - `docs/contracts/active-run.md`의 `### Wired Consumers` 표에서
     `review prepare-input` 행을 `wired`로 바꾼다.
2. **Slice 6: `review variants` active-run wiring**. 현재 `--output-dir`이
   required다. slice 3/4와 같은 패턴으로 옵셔널화하고, canonical filename
   표의 `variant-*.json`과 `<stage>-<index>.stdout/stderr`를 `wired`로
   마킹한다. review variants가 이미 runDir 안에 `review-packet.json`이
   있으면 그것을 default로 읽는 옵션도 같이 고민한다. self-dogfood script
   (`scripts/run-self-dogfood.mjs` line 485)가 `--output-dir`을 explicit
   하게 넘기므로 slice 3의 precedence rule 1 regression test와 같은 것을
   이 slice에도 건다.
4. **Slice 후반: file-in/file-out helper 결정**. `evidence prepare-input`,
   `optimize prepare-input`, `report build`, `evidence bundle`,
   `optimize propose`, `optimize build-artifact` 같은 helper들도 active run
   안에서는 canonical filename을 default로 삼을지 결정한다. contract doc의
   Probe Questions 섹션이 이 결정을 기다리고 있다. 필요하면 contract 표에
   row를 더 추가하면서 slice별로 풀어간다.
5. HTML view follow-ups는 다음 우선순위로 내려간다.
   - `artifacts/self-dogfood/experiments/latest/` 번들이 다시 쓰이기 시작하면
     그때 HTML view를 experiments surface까지 확장할지 결정한다. 지금은 해당
     디렉터리가 비어 있어서 defer.
6. `binary-surface` experiment가 `skill-surface`처럼 stable pass로 떨어졌는지
   다시 본다. 필요하면 enrichment prompt를 더 깎는다.
7. `quality` workflow가 canonical dogfood와 experiments를 어떻게 함께 요약해야
   operator에게 덜 거짓말 같은지 결론을 낸다.
8. 변경 후에는 항상 `npm run verify`를 다시 돌린다. 실행 전에 Node 22가 활성화
   되어 있는지 먼저 확인한다.

## Discuss

- artifact-root 결정은 active-run env var contract로 정착되었다 — 한
  workflow = 한 runDir, `CAUTILUS_RUN_DIR`이 그 sticky reference. consumer
  명령에 `--artifact-root` flag를 심는 Option D는 polymorphic하게 고려했다
  가 폐기되었다. 이유: 각 consumer 명령이 자기 runDir을 mint하면 sibling
  runDir이 생겨서 "한 workflow = 한 runDir" load-bearing 가정이 깨진다.
  active run env var이 그 가정을 자연스럽게 보존하면서 path threading을
  없앤다. 아직 열려 있는 질문:
  - `run.json` manifest에 workflow metadata(mode, baseline ref, adapter
    name)를 더 담을지. 지금은 `schemaVersion`, `label`, `startedAt`만이다.
  - fish shell 사용자를 위해 `--shell fish` 같은 flavor 옵션을 추가할지.
    지금은 POSIX `export` 한 줄만 emit한다.
- HTML view는 self-dogfood latest surface 안에서만 materialize 되었다.
  다음 결정은 두 가지다:
  - `experiments/`에도 같은 뷰를 낼지 (지금은 defer, 데이터가 없다)
  - host-agnostic `cautilus report html` CLI를 본격적으로 product-owned
    시킬지 (master plan item 6의 defer 조건, 즉 JSON/YAML report boundary가
    여러 consumer에서 이미 안정화되었는가를 먼저 검증해야 한다)
- behavior intent catalog는 여전히 닫혀 있다. 다음 결정은 intent taxonomy
  확장 여부가 아니라 active-run wiring을 어디까지 끌고 갈지다.
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
- 일곱 번째 오해: "`workspace start`를 consumer 명령마다 한 번씩 새로
  호출해야 한다." 아니다. 한 workflow = 한 `runDir`이 기본이고, 그 아래
  `report.json`, `baseline/`, `candidate/`, `review-packet.json` 같은 서로
  다른 marker가 공존하도록 설계되어 있다. workflow 시작 시 한 번
  `eval "$(cautilus workspace start --label X)"`만 한다. `run.json`
  manifest는 pruner가 empty bundle을 recognize 하기 위한 marker일 뿐
  workflow metadata가 아니다.
- 여덟 번째 오해: "`runDir`이 pruner가 알아서 관리하니까 operator는
  `--keep-last`를 넘길 필요가 없다." 아니다. `workspace prune-artifacts`는
  여전히 explicit opt-in이다. `workspace start`만으로는 정리되지 않는다.
- 아홉 번째 오해: "`workspace start` stdout이 JSON이니까 `jq`로 파싱해야
  한다." 아니다. default stdout은 `export CAUTILUS_RUN_DIR='...'` 한 줄
  shell-evalable string이다. `eval "$(...)"` 한 줄로 끝. JSON이 정말로
  필요한 자동화 path만 `--json` flag를 명시적으로 켠다.
- 열 번째 오해: "`mode evaluate`가 옵셔널 `--output-dir`이니까 self-dogfood
  script들도 `--output-dir`을 빼도 된다." 아니다. `scripts/run-self-dogfood.mjs`와
  `scripts/run-self-dogfood-experiments.mjs`는 per-bundle 전용 경로를 mint해서
  `--output-dir`로 넘긴다 (예: `artifacts/self-dogfood/runs/<ts>/mode`).
  parent 세션의 stray `CAUTILUS_RUN_DIR`이 inherited 되더라도 explicit
  override가 precedence 1번이라 self-dogfood 경로가 오염되지 않는 게
  load-bearing이다. `evaluate-adapter-mode.test.mjs`의 `explicit --output-dir
  overrides an inherited CAUTILUS_RUN_DIR` test가 그 regression을 잡는다.
  self-dogfood script에서 `--output-dir`을 빼면 그 test는 여전히 통과하지만
  실제 self-dogfood bundle이 엉뚱한 경로에 떨어진다.
- 열한 번째 오해: "`Active run: <path>` 한 줄 stderr 배너가 `--quiet`에
  따라 사라진다." 아니다. `Active run:` 배너는 auto-materialize 경로에서만
  한 번 찍히고 `--quiet`은 무시한다. 이건 progress chatter가 아니라
  operator가 artifact 경로를 놓치지 않게 하는 load-bearing signal이다.
  explicit `--output-dir`이나 env var path에서는 애초에 이 배너가 없다.

## References

- [README.md](/home/ubuntu/cautilus/README.md)
- [AGENTS.md](/home/ubuntu/cautilus/AGENTS.md)
- [docs/master-plan.md](/home/ubuntu/cautilus/docs/master-plan.md)
- [docs/contracts/active-run.md](/home/ubuntu/cautilus/docs/contracts/active-run.md)
- [docs/contracts/behavior-intent.md](/home/ubuntu/cautilus/docs/contracts/behavior-intent.md)
- [docs/contracts/scenario-proposal-inputs.md](/home/ubuntu/cautilus/docs/contracts/scenario-proposal-inputs.md)
- [docs/specs/self-dogfood.spec.md](/home/ubuntu/cautilus/docs/specs/self-dogfood.spec.md)
- [scripts/agent-runtime/workspace-start.mjs](/home/ubuntu/cautilus/scripts/agent-runtime/workspace-start.mjs)
- [scripts/agent-runtime/workspace-start.test.mjs](/home/ubuntu/cautilus/scripts/agent-runtime/workspace-start.test.mjs)
- [scripts/agent-runtime/active-run.mjs](/home/ubuntu/cautilus/scripts/agent-runtime/active-run.mjs)
- [scripts/agent-runtime/active-run.test.mjs](/home/ubuntu/cautilus/scripts/agent-runtime/active-run.test.mjs)
- [scripts/agent-runtime/evaluate-adapter-mode.mjs](/home/ubuntu/cautilus/scripts/agent-runtime/evaluate-adapter-mode.mjs)
- [scripts/agent-runtime/evaluate-adapter-mode.test.mjs](/home/ubuntu/cautilus/scripts/agent-runtime/evaluate-adapter-mode.test.mjs)
- [scripts/agent-runtime/prepare-compare-worktrees.mjs](/home/ubuntu/cautilus/scripts/agent-runtime/prepare-compare-worktrees.mjs)
- [scripts/agent-runtime/prepare-compare-worktrees.test.mjs](/home/ubuntu/cautilus/scripts/agent-runtime/prepare-compare-worktrees.test.mjs)
- [scripts/agent-runtime/prune-workspace-artifacts.mjs](/home/ubuntu/cautilus/scripts/agent-runtime/prune-workspace-artifacts.mjs)
- [scripts/render-self-dogfood-html.mjs](/home/ubuntu/cautilus/scripts/render-self-dogfood-html.mjs)
- [scripts/render-self-dogfood-html.test.mjs](/home/ubuntu/cautilus/scripts/render-self-dogfood-html.test.mjs)
- [scripts/run-self-dogfood.mjs](/home/ubuntu/cautilus/scripts/run-self-dogfood.mjs)
- [artifacts/self-dogfood/latest/index.html](/home/ubuntu/cautilus/artifacts/self-dogfood/latest/index.html)
- [scripts/agent-runtime/behavior-intent.mjs](/home/ubuntu/cautilus/scripts/agent-runtime/behavior-intent.mjs)
- [scripts/agent-runtime/cli-proposal-candidates.mjs](/home/ubuntu/cautilus/scripts/agent-runtime/cli-proposal-candidates.mjs)
- [scripts/agent-runtime/chatbot-proposal-candidates.mjs](/home/ubuntu/cautilus/scripts/agent-runtime/chatbot-proposal-candidates.mjs)
- [scripts/agent-runtime/skill-proposal-candidates.mjs](/home/ubuntu/cautilus/scripts/agent-runtime/skill-proposal-candidates.mjs)
