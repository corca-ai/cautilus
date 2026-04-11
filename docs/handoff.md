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
  [scripts/agent-runtime/prepare-compare-worktrees.mjs](/home/ubuntu/cautilus/scripts/agent-runtime/prepare-compare-worktrees.mjs),
  [scripts/agent-runtime/build-review-packet.mjs](/home/ubuntu/cautilus/scripts/agent-runtime/build-review-packet.mjs),
  [skills/cautilus/SKILL.md](/home/ubuntu/cautilus/skills/cautilus/SKILL.md)
  를 읽는다. `evaluate-adapter-mode.mjs`와 `prepare-compare-worktrees.mjs`가
  slice 5/6의 wiring 패턴 exemplar다 — 복사 후 파일별 특수성만 조정한다.
- 시작 workflow는 `impl` 기준이다.
- product-owned seam이면 `cautilus`에서 먼저 고친다. host adapter, prompt,
  policy, consumer artifact는 host 소유다.
- active-run env var contract는 정착되었고 현재 wired consumer는 두 개다
  (`mode evaluate`, `workspace prepare-compare`).
  `docs/contracts/active-run.md`의 `### Wired Consumers` 표가 authoritative
  status고, 다음 pickup은 아래 Next Session 순서를 따른다.
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
    해결한다. consumer wiring은 slice 3/4로 시작되었다 (아래 wiring state).
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
  - `### Wired Consumers` 서브섹션이 Canonical Filenames 표 바로 아래에
    있다. 이 표가 각 consumer 명령의 active-run wiring 상태에 대한 single
    source of truth다. slice가 끝날 때마다 해당 행만 `not yet → wired`로
    바꾸면 된다.
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
- active-run consumer wiring state (slice 3/4 landed, commit `cdf9192` +
  `e9d7310`):
  - wired: `mode evaluate`, `workspace prepare-compare`. 둘 다
    `resolveRunDir`을 호출해서 precedence (`explicit --output-dir >
    CAUTILUS_RUN_DIR > auto-materialize under ./.cautilus/runs/`)를 지키고,
    auto-materialize 경로일 때만 stderr에 `Active run: <abs runDir>` 한 줄을
    찍는다. explicit과 env var 경로는 조용히 동작한다.
  - mode evaluate의 canonical output은 `${mode}-scenario-results.json` +
    `report.json` + `report-input.json` 등 mode-prefixed 구조 그대로 유지해서
    한 runDir 안에 여러 mode가 공존할 수 있다.
  - prepare-compare의 retry는 `removeExistingWorktree`가 git worktree
    registration을 먼저 풀기 때문에 같은 runDir에 두 번 호출해도 `--force`
    없이 collision-free다. `run.json` marker와 `baseline/`, `candidate/`가
    한 runDir 안에 공존한다.
  - 두 slice 각각 4개의 regression test를 새로 걸었다 (env var / auto-materialize
    + banner / same-runDir retry / explicit-over-env). 기존 test는 explicit
    `--output-dir` regression guard로 그대로 유지.
  - self-dogfood script들 (`scripts/run-self-dogfood.mjs`,
    `scripts/run-self-dogfood-experiments.mjs`)은 여전히 `--output-dir`을
    explicit하게 넘긴다. parent shell의 stray `CAUTILUS_RUN_DIR`이
    inherited 되더라도 precedence rule 1 때문에 self-dogfood bundle 경로가
    오염되지 않는다. 이건 load-bearing regression이라 slice 6에서도 동일한
    explicit-override test를 건다.
  - `docs/contracts/active-run.md`의 `### Wired Consumers` 표가
    authoritative status. 나머지 `review prepare-input`, `review variants`
    두 개가 `not yet`이다.
- local proof (Node v22.22.2 기준, 이번 세션 마지막 측정값):
  - `npm run verify`: 158/158 green
  - `node ./scripts/check-specs.mjs`: `spec checks passed (4 specs, 396 guard rows)`
  - `node ./bin/cautilus doctor --repo-root .`: `ready`
  - 빠른 happy-path smoke:
    `eval "$(node ./bin/cautilus workspace start --label smoke)"` →
    `CAUTILUS_RUN_DIR`이 현재 shell에 박히고 `run.json` 마커가 생긴다.
  - end-to-end smoke (이번 세션에서 한 번 확인): 임시 git repo에서
    `workspace start` → `workspace prepare-compare --baseline-ref HEAD~1
    --candidate-ref HEAD` (no `--output-dir`) → `$CAUTILUS_RUN_DIR` 안에
    `baseline`, `candidate`, `run.json`이 동시 존재.
- 이번 세션에서 experiments를 다시 돌리지는 않았다. 마지막으로 기록된
  stronger-claim 상태는 여전히 `gate-honesty-a=blocker`,
  `gate-honesty-b=concern`, `binary-surface=concern`, `skill-surface=pass`,
  `review-completion=pass`이다.

## Next Session

1. **Slice 5: `review prepare-input` active-run wiring.** 구현 파일은
   `scripts/agent-runtime/build-review-packet.mjs`다. 모든 design 결정은
   이미 `docs/contracts/active-run.md`의 `### Consume-Only Helpers`
   서브섹션과 Probe Questions(`Resolved (slice 5 decision)`)에 박혀 있다.
   다음 세션은 그 계약을 코드로 옮기기만 하면 된다. 요약:

   **Helper 추가 (slice 5 첫 작업):** `scripts/agent-runtime/active-run.mjs`에
   새 export를 추가한다. 같은 파일의 기존 `ensureExistingDirectory`
   file-scoped helper를 재사용할 수 있다.
   ```js
   export function readActiveRunDir({ env = process.env } = {}) {
     const value = env?.[ACTIVE_RUN_ENV_VAR];
     if (!value) return null;
     const resolved = resolve(value);
     ensureExistingDirectory(resolved, ACTIVE_RUN_ENV_VAR);
     return resolved;
   }
   ```
   `resolveRunDir`은 건드리지 않는다. 둘은 대등한 siblings다 —
   `resolveRunDir`은 workflow를 start하는 명령이 쓰고, `readActiveRunDir`은
   consume-only helper가 쓴다.

   **`scripts/agent-runtime/active-run.test.mjs` 확장:** 새 helper를 위해
   test 네 개 추가: (a) env var unset이면 `null`, (b) env var이 존재하는
   dir을 가리키면 absolute path, (c) env var이 missing path면 throw,
   (d) env var이 regular file이면 throw.

   **`build-review-packet.mjs` 변경:** `readActiveRunDir`을 import한 뒤
   `parseArgs` 이후에 한 번 호출해서 `activeRunDir`을 구한다. 그 다음:
   - `options.reportFile`이 unset이고 `activeRunDir`이 존재하면
     `options.reportFile = join(activeRunDir, "report.json")`.
   - `options.reportFile`이 여전히 unset이면 기존 `--report-file is required`
     fail 그대로.
   - `options.output`이 unset이고 `activeRunDir`이 존재하면
     `options.output = join(activeRunDir, "review-packet.json")`.
   - 기존 `if (options.output) writeFileSync ... else stdout` 분기는 그대로.
   - **`Active run:` stderr banner는 찍지 않는다** (contract doc의
     Consume-Only Helpers 규칙).

   **Test cases** (`build-review-packet.test.mjs`에 이미 있는 test 파일에
   추가하거나 없으면 새로 만든다):
   (a) env var set + report.json이 runDir에 있음 + `--report-file`/`--output`
       둘 다 생략 → runDir 안의 `report.json`을 읽고 `review-packet.json`을
       쓴다.
   (b) env var set + runDir 안에 `report.json`이 없음 → loud fail.
   (c) no env var + explicit `--report-file` + no `--output` → 현재 stdout
       backwards-compat 동작 유지.
   (d) env var set + explicit `--output <path>` → explicit 경로로 쓴다
       (explicit-over-env regression).
   (e) no env var + no `--report-file` → 여전히 `--report-file is required`
       loud fail.
   (f) env var이 set인데 missing dir을 가리킴 → loud fail.

   **Load-bearing self-dogfood regression:** `scripts/run-self-dogfood.mjs`의
   `prepareReviewPrompt` (line 429-445)는 `review prepare-input`에
   `--report-file`과 `--output`을 **둘 다 explicit하게** 넘긴다. test (d)가
   이 경로의 regression guard다.

   **끝나면:** `docs/contracts/active-run.md`의 `### Wired Consumers` 표에서
   `review prepare-input` 행을 `wired`로 바꾸고 review-packet.json row의
   Notes 칼럼에 canonical default를 명시한다. `### Consume-Only Helpers`
   섹션에서 `review prepare-input` 항목에 "wired" 표식만 추가한다 (다른
   항목들은 follow-up slice 대상).
2. **Slice 6: `review variants` active-run wiring.** 구현 파일은
   `scripts/agent-runtime/run-workbench-executor-variants.mjs` (CLI 진입점)
   이고, 현재 `--output-dir`이 required다.

   **Slice 6 첫 결정 (probe):** `docs/contracts/active-run.md`의 Probe
   Questions 섹션 마지막 항목이 이 결정을 기다린다 — `review variants`가
   workflow-creating(→ `resolveRunDir` + `Active run:` banner + auto-materialize)
   인지, consume-only(→ `readActiveRunDir` + no banner + no auto-materialize)
   인지. 판단 기준: "hand-rolled prompt file과 hand-rolled workspace만으로
   `review variants`를 독립 실행하는 operator가 fresh runDir을 mint하길
   기대하는가?" slice 6 세션은 이 질문을 먼저 답하고 contract doc에 기록한
   다음 구현에 들어간다. slice 3/4와 slice 5가 양쪽 exemplar다 — 결정에
   따라 한쪽 패턴을 복사한다.

   **공통 작업:** canonical rows는 `variant-*.json`과
   `<stage>-<index>.stdout/stderr`. 결정된 패턴에 맞춰 test를 건다.
   **load-bearing regression:** `scripts/run-self-dogfood.mjs`가
   `review variants`를 `--output-dir`로 explicit하게 호출하므로 (line 485),
   slice 3의 `explicit --output-dir overrides an inherited CAUTILUS_RUN_DIR`
   test와 동일한 것을 `run-workbench-executor-variants.test.mjs` 수준에
   꼭 건다. 이 regression은 패턴 선택과 무관하게 load-bearing이다.
3. **Slice 후반: file-in/file-out helper 결정.** `evidence prepare-input`,
   `optimize prepare-input`, `report build`, `evidence bundle`,
   `optimize propose`, `optimize build-artifact` 같은 helper들도 active run
   안에서는 canonical filename을 default로 삼을지 slice 5의 probe 답변에
   맞춰 각각 결정한다. 필요하면 contract 표에 row를 더 추가하면서 slice별로
   풀어간다.
4. HTML view follow-ups는 다음 우선순위로 내려간다.
   - `artifacts/self-dogfood/experiments/latest/` 번들이 다시 쓰이기 시작하면
     그때 HTML view를 experiments surface까지 확장할지 결정한다. 지금은 해당
     디렉터리가 비어 있어서 defer.
5. `binary-surface` experiment가 `skill-surface`처럼 stable pass로 떨어졌는지
   다시 본다. 필요하면 enrichment prompt를 더 깎는다.
6. `quality` workflow가 canonical dogfood와 experiments를 어떻게 함께 요약해야
   operator에게 덜 거짓말 같은지 결론을 낸다.
7. 변경 후에는 항상 `npm run verify`를 다시 돌린다. 실행 전에 Node 22가 활성화
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
