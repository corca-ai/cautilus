# Cautilus Handoff

## Workflow Trigger

- 다음 세션에서 이 문서를 멘션하면 먼저
  [README.md](../README.md),
  [AGENTS.md](../AGENTS.md),
  [docs/master-plan.md](./master-plan.md),
  [docs/contracts/reporting.md](./contracts/reporting.md),
  [docs/consumer-migration.md](./consumer-migration.md),
  [docs/release-boundary.md](./release-boundary.md),
  [docs/contracts/active-run.md](./contracts/active-run.md),
  [docs/contracts/behavior-intent.md](./contracts/behavior-intent.md),
  [docs/contracts/scenario-proposal-inputs.md](./contracts/scenario-proposal-inputs.md),
  [docs/specs/self-dogfood.spec.md](./specs/self-dogfood.spec.md),
  [docs/specs/current-product.spec.md](./specs/current-product.spec.md),
  [bin/cautilus](../bin/cautilus),
  [scripts/agent-runtime/report-packet.mjs](../scripts/agent-runtime/report-packet.mjs),
  [scripts/agent-runtime/active-run.mjs](../scripts/agent-runtime/active-run.mjs),
  [scripts/agent-runtime/workspace-start.mjs](../scripts/agent-runtime/workspace-start.mjs),
  [scripts/agent-runtime/evaluate-adapter-mode.mjs](../scripts/agent-runtime/evaluate-adapter-mode.mjs),
  [scripts/agent-runtime/prepare-compare-worktrees.mjs](../scripts/agent-runtime/prepare-compare-worktrees.mjs),
  [scripts/agent-runtime/build-review-packet.mjs](../scripts/agent-runtime/build-review-packet.mjs),
  [skills/cautilus/SKILL.md](../skills/cautilus/SKILL.md)
  를 읽는다. `evaluate-adapter-mode.mjs`와 `prepare-compare-worktrees.mjs`는
  workflow-creating wiring exemplar고, `build-review-packet.mjs`는
  consume-only wiring exemplar다. `run-workbench-executor-variants.mjs`
  역시 이제 workflow-creating exemplar로 쓸 수 있다. 이번 세션 이후
  standalone install contract는 `cautilus` on `PATH` +
  `cautilus skills install`이고, report boundary는
  `cautilus.report_packet.v2`만 허용된다는 점을 먼저 기억한다.
- 시작 workflow는 `impl` 기준이다.
- product-owned seam이면 `cautilus`에서 먼저 고친다. host adapter, prompt,
  policy, consumer artifact는 host 소유다.
- active-run env var contract는 정착되었고 현재 wired consumer는 열 개다
  (`mode evaluate`, `workspace prepare-compare`, `report build`,
  `review prepare-input`, `evidence prepare-input`, `evidence bundle`,
  `optimize prepare-input`, `optimize propose`, `optimize build-artifact`,
  `review variants`).
  `docs/contracts/active-run.md`의 `### Wired Consumers` 표가 authoritative
  status고, 다음 pickup은 아래 Next Session 순서를 따른다.
- 세션을 시작하기 전에 `node --version`이 `v22.x` 이상인지 먼저 본다.
  Node 20에서는 self-dogfood test fixture가 `node - <<EOF ... await import()`
  패턴 때문에 깨진다. `.n`이 깔려 있다면 `N_PREFIX=/home/ubuntu/.n n install 22`로
  한 번만 올려두면 된다.

## Current State

- standalone install/skill contract가 product-owned canonical surface로
  다시 고정되었다.
  - `bin/cautilus`에 `cautilus skills install`이 들어왔고, host repo 기준
    `.agents/skills/cautilus/`를 canonical checked-in path로 materialize한다.
    `.claude/skills -> ../.agents/skills`는 compatibility shim이다.
  - bundled skill과 packaged plugin skill은 이제 repo-local
    `node ./bin/cautilus`가 아니라 standalone `cautilus` command를 호출한다.
  - `README.md`, `docs/consumer-migration.md`,
    `docs/release-boundary.md`, `docs/specs/current-product.spec.md`가
    모두 같은 install story를 말한다. plugin marketplace surface는
    canonical consumer install contract가 아니라 local test fixture다.
- report boundary contract도 pre-public breaking change로 정리되었다.
  - current report packet은 `cautilus.report_packet.v2`다.
  - `review prepare-input`, `evidence prepare-input`,
    `optimize prepare-input`은 legacy
    `cautilus.report_packet.v1`을 boundary에서 바로 거절한다.
    deep fallback이나 implicit migration은 없다.
  - shared validator는
    [scripts/agent-runtime/report-packet.mjs](../scripts/agent-runtime/report-packet.mjs)에
    있고, 최소 required shape는 `generatedAt`, `candidate`, `baseline`,
    `intent`, `intentProfile`, `recommendation`이다.
    `intentProfile.summary`는 `intent`와 정확히 같아야 하고,
    behavior-intent catalog도 runtime에서 검증된다.
- `crill` handoff는 이미 새 contract 기준으로 갱신됐다.
  다음 operator가 consumer follow-up을 바로 집을 수 있게
  `docs/handoff.md` 기본 pickup을 Linux consumer sync로 바꿨고,
  stale file 다섯 개 (`run-optimize-smoke.sh`, `run-evidence-smoke.sh`,
  `run-consumer-compare.py`, 두 report fixture)를 명시했다.
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
  - `scripts/agent-runtime/active-run.mjs`에는 이제 workflow-creating용
    `resolveRunDir`과 consume-only용 `readActiveRunDir`이 함께 있다.
    consumer wiring은 slice 3/4/5/6 plus consume-only helper follow-up까지
    들어왔다 (아래 wiring state).
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
- self-dogfood `experiments/latest/`에도 compare-first 정적 HTML 뷰가 들어왔다.
  - `scripts/render-self-dogfood-experiments-html.mjs`가
    `summary.json`과 `report.json`을 읽어 `index.html`을 만든다.
    baseline gate와 named experiment adapter들을 한 화면에서 비교 가능하게
    보여주는 게 load-bearing rule이다. A/B 결과를 isolated summary들로만
    남겨 operator가 머리로 diff하지 않게 한다.
  - `npm run dogfood:self:experiments`는 latest bundle을 갱신할 때
    `index.html`도 같이 다시 쓴다.
  - `npm run dogfood:self:experiments:html`은 read-only refresh 경로다.
    experiment review를 다시 돌리지 않고 현재 latest bundle에서만 HTML compare
    view를 다시 뽑는다.
  - `docs/specs/self-dogfood.spec.md`는 experiments latest stable path를
    `summary.json`, `report.json`, `latest.md`, `index.html` 네 개로 고정하고,
    "A/B 결과는 비교 가능하게 surfaced 해야 한다"는 rule을 source-of-truth
    spec으로 잠갔다.
- `binary-surface` stronger-claim experiment는 이제 stable `pass`로 떨어진다.
  - `.agents/cautilus-adapters/self-dogfood-binary-surface.yaml`이
    `docs/consumer-readiness.md`, `scripts/run-self-dogfood.mjs`,
    `scripts/run-self-dogfood.test.mjs`까지 artifact surface에 포함해서
    root self-consumer evidence를 함께 본다.
  - `scripts/self-dogfood-experiment-prompt.mjs`의 binary-surface excerpt
    패턴은 `run-self-dogfood`, `root self-consumer`,
    `consumer-readiness`, `latest artifacts`를 우선 잡아서 prompt 상단에서
    evidentiary seam이 드러나게 바뀌었다.
  - `bin/cautilus.test.mjs`에
    `cautilus root self-consumer repo stays doctor-ready and keeps the named self-dogfood adapter`
    smoke가 추가되었고, `scripts/run-self-dogfood.test.mjs`의 첫 test 이름도
    root self-consumer quality path를 직접 말하도록 바뀌었다.
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
- active-run consumer wiring state:
  - wired workflow-creating consumers: `mode evaluate`,
    `workspace prepare-compare`, `review variants`. 셋 다
    `resolveRunDir`을 호출해서 precedence (`explicit --output-dir >
    CAUTILUS_RUN_DIR > auto-materialize under ./.cautilus/runs/`)를 지키고,
    auto-materialize 경로일 때만 stderr에 `Active run: <abs runDir>` 한 줄을
    찍는다. explicit과 env var 경로는 조용히 동작한다.
  - wired consume-only helper: `review prepare-input`.
    `readActiveRunDir`을 호출해서 active run이 pin되어 있으면
    `report.json`을 `--report-file` 기본값으로, `review-packet.json`을
    `--output` 기본값으로 사용한다. env var가 없으면 기존처럼 explicit
    `--report-file`을 요구하고 stdout fallback을 유지한다. consume-only
    rule에 따라 `Active run:` stderr banner는 찍지 않는다.
  - wired workflow-creating helper: `review variants`.
    hand-rolled `--prompt-file` + `--schema-file`만으로도 정당한 standalone
    run이 가능하다고 보고 `resolveRunDir` 패턴으로 분류했다. explicit
    `--output-dir` > `CAUTILUS_RUN_DIR` > auto-materialize 순서를 따르고,
    auto-materialize 때만 stderr에 `Active run: <abs runDir>` 한 줄을 찍는다.
    env var 경로와 explicit 경로는 조용하다. canonical summary filename은 이제
    `review-summary.json`이다.
  - wired consume-only helpers: `report build`, `evidence prepare-input`,
    `evidence bundle`, `optimize prepare-input`, `optimize propose`,
    `optimize build-artifact`.
    - `report build`: active run 안에서는 `report-input.json` →
      `report.json` default, no active run이면 기존 stdout fallback 유지.
    - `evidence prepare-input`: active run 안에서는 `report.json` →
      `evidence-input.json` default. optional input 중
      `run-audit-summary.json`과 `scenario-history.snapshot.json`은 파일이
      실제로 있을 때만 각각 `--run-audit-file`, `--history-file` default로
      잡힌다. scenario results는 이름을 바꾸지 않고
      `<mode>-scenario-results.json`을 유지한다. 대신 operator가
      `--scenario-mode <iterate|held_out|comparison|full_gate>`를 넘겼을 때만
      같은 active run 안의 해당 canonical file을 기본값으로 읽는다.
    - `evidence bundle`: active run 안에서는 `evidence-input.json` →
      `evidence-bundle.json` default, no active run이면 stdout fallback 유지.
    - `optimize prepare-input`: active run 안에서는 `report.json` →
      `optimize-input.json` default. optional input 중
      `review-summary.json`과 `scenario-history.snapshot.json`은 파일이 있을 때
      각각 `--review-summary`, `--history-file` default로 잡힌다.
    - `optimize propose`: active run 안에서는 `optimize-input.json` →
      `optimize-proposal.json` default, no active run이면 stdout fallback 유지.
    - `optimize build-artifact`: active run 안에서는
      `optimize-proposal.json` → `revision-artifact.json` default. proposal이
      들고 있는 `inputFile` fallback은 그대로 유지.
  - mode evaluate의 canonical output은 `${mode}-scenario-results.json` +
    `report.json` + `report-input.json` 등 mode-prefixed 구조 그대로 유지해서
    한 runDir 안에 여러 mode가 공존할 수 있다. profile-backed run이면
    repo-level history source of truth를 갱신한 직후 같은 시점의 snapshot을
    `scenario-history.snapshot.json`으로도 materialize한다.
  - prepare-compare의 retry는 `removeExistingWorktree`가 git worktree
    registration을 먼저 풀기 때문에 같은 runDir에 두 번 호출해도 `--force`
    없이 collision-free다. `run.json` marker와 `baseline/`, `candidate/`가
    한 runDir 안에 공존한다.
  - slice 3/4는 기존처럼 env var / auto-materialize + banner /
    same-runDir retry / explicit-over-env를 고정한다. slice 5는
    `readActiveRunDir` helper validation 4개와 `build-review-packet`
    regression 6개를 추가해서 default-in-runDir / missing report /
    stdout fallback / explicit-over-env / missing `--report-file` /
    missing active-run dir를 고정한다.
  - slice 6은 `run-workbench-executor-variants`에 env var / auto-materialize
    + banner / explicit-over-env regression을 추가했다. 기존 explicit
    `--output-dir` 경로 test들은 그대로 유지된다.
  - consume-only helper filename follow-up slice는 구현까지 끝났다.
    `review-summary.json`, `run-audit-summary.json`,
    `scenario-history.snapshot.json`이 product-owned canonical filename으로
    정착되었고, multi-source ambiguity가 남는 scenario results만
    `--scenario-mode`를 통해 operator가 선택하게 했다.
  - self-dogfood script들 (`scripts/run-self-dogfood.mjs`,
    `scripts/run-self-dogfood-experiments.mjs`)은 여전히 `--output-dir`을
    explicit하게 넘긴다. parent shell의 stray `CAUTILUS_RUN_DIR`이
    inherited 되더라도 precedence rule 1 때문에 self-dogfood bundle 경로가
    오염되지 않는다. 이건 load-bearing regression이라 slice 6에서도 동일한
    explicit-override test를 건다.
  - `docs/contracts/active-run.md`의 `### Wired Consumers` 표가
    authoritative status. active-run 쪽 open question은 이제 filename naming보다
    `run.json` metadata 확장과 shell flavor surface 같은 operator ergonomics다.
- local proof (Node v22.22.2 기준, 이번 세션 마지막 측정값):
  - `node --test bin/cautilus.test.mjs`: 23/23 green
  - `node --test scripts/agent-runtime/run-workbench-executor-variants.test.mjs`: 8/8 green
  - `npm run verify`: 190/190 green
  - `node ./scripts/check-specs.mjs`: `spec checks passed (4 specs, 416 guard rows)`
  - `cautilus doctor --repo-root .`: `ready`
  - `npm run hooks:check`: `ready`
  - `node ./scripts/run-self-dogfood-experiments.mjs --experiment-adapter-name self-dogfood-binary-surface --quiet`:
    exit `0`, latest summary `overallStatus=pass`,
    `experiments[0].overallStatus=pass`
  - `git push origin main`: success. 최근 push에는
    `c660470 Make PATH-based install and repo-local skills the canonical surface`와
    `85666ee Make report packet v2 explicit at runtime boundaries`가 포함된다.
  - 빠른 happy-path smoke:
    `eval "$(cautilus workspace start --label smoke)"` →
    `CAUTILUS_RUN_DIR`이 현재 shell에 박히고 `run.json` 마커가 생긴다.
  - end-to-end smoke (이번 세션에서 한 번 확인): 임시 git repo에서
    `workspace start` → `workspace prepare-compare --baseline-ref HEAD~1
    --candidate-ref HEAD` (no `--output-dir`) → `$CAUTILUS_RUN_DIR` 안에
    `baseline`, `candidate`, `run.json`이 동시 존재.
- 이번 세션에서 `binary-surface` experiment를 다시 돌렸고 현재 기록된
  stronger-claim 상태는 `gate-honesty-a=blocker`,
  `gate-honesty-b=concern`, `binary-surface=pass`, `skill-surface=pass`,
  `review-completion=pass`이다.

## Next Session

1. live consumer follow-up을 `cautilus` 쪽에서 추적한다.
   우선순위는 `crill`이고, 확인 대상은 다음 두 seam이다.
   - standalone install contract: consumer runner default가 절대 경로가 아니라
     `cautilus` on `PATH`를 전제하는가
   - report boundary contract: checked-in report fixture가
     `cautilus.report_packet.v2` + valid `intentProfile`로 올라왔는가
2. `crill` follow-up이 끝나면 `ceal`과 `charness`도 같은 두 seam으로 빠르게
   훑는다. `docs/consumer-migration.md`의 live-consumer claim이 실제 host repo
   state와 어긋나면 그때 문서/claim을 같이 조정한다.
3. consumer migration 반복이 커지면 `cautilus report build` 또는 별도
   migration helper를 product surface로 올릴지 판단한다.
   지금은 의도적으로 fallback을 넣지 않았고 strict boundary를 택했다.
   따라서 helper를 추가하더라도 "legacy 자동 수용"이 아니라
   "명시적 rebuild 도구"여야 한다.
4. self-dogfood HTML / experiments compare 후속은 당장 기본 pickup이 아니다.
   consumer sync가 닫힌 뒤에만 `quality` workflow와 generic report HTML 승격
   여부를 다시 검토한다.
5. 변경 후에는 항상 `npm run verify`를 다시 돌린다. 실행 전에 Node 22가
   활성화되어 있는지 먼저 확인한다.

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
- multi-source optional input canonicalization은 구현까지 끝났다.
  - `review variants` summary는 `review-summary.json`으로 승격되었다.
  - run-audit summary는 `run-audit-summary.json`으로 승격되었다.
  - history는 repo-level persistent state를 유지하고, runDir에는 같은 시점의
    `scenario-history.snapshot.json`을 materialize한다.
  - scenario results는 `<mode>-scenario-results.json`을 유지하고,
    `evidence prepare-input`은 `--scenario-mode`가 있을 때만 해당 canonical
    file을 default로 읽는다. 없으면 추측하지 않는다.
- HTML view는 이제 self-dogfood latest와 experiments latest 둘 다에
  materialize 된다.
  - `scripts/render-self-dogfood-experiments-html.mjs`가
    `artifacts/self-dogfood/experiments/latest/index.html`을 만든다.
  - experiments compare view의 load-bearing rule은 "A/B 결과는 한 화면에서
    baseline gate와 experiment adapter를 비교 가능하게 보여야 한다"이다.
  - 다음 결정은 host-agnostic `cautilus report html` CLI를 본격적으로
    product-owned 시킬지 여부다 (master plan item 6의 defer 조건, 즉
    JSON/YAML report boundary가 여러 consumer에서 이미 안정화되었는가를
    먼저 검증해야 한다).
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

- [README.md](../README.md)
- [AGENTS.md](../AGENTS.md)
- [docs/master-plan.md](./master-plan.md)
- [docs/consumer-readiness.md](./consumer-readiness.md)
- [docs/contracts/active-run.md](./contracts/active-run.md)
- [docs/contracts/behavior-intent.md](./contracts/behavior-intent.md)
- [docs/contracts/scenario-proposal-inputs.md](./contracts/scenario-proposal-inputs.md)
- [docs/specs/self-dogfood.spec.md](./specs/self-dogfood.spec.md)
- [bin/cautilus.test.mjs](../bin/cautilus.test.mjs)
- [scripts/agent-runtime/workspace-start.mjs](../scripts/agent-runtime/workspace-start.mjs)
- [scripts/agent-runtime/workspace-start.test.mjs](../scripts/agent-runtime/workspace-start.test.mjs)
- [scripts/agent-runtime/active-run.mjs](../scripts/agent-runtime/active-run.mjs)
- [scripts/agent-runtime/active-run.test.mjs](../scripts/agent-runtime/active-run.test.mjs)
- [scripts/agent-runtime/evaluate-adapter-mode.mjs](../scripts/agent-runtime/evaluate-adapter-mode.mjs)
- [scripts/agent-runtime/evaluate-adapter-mode.test.mjs](../scripts/agent-runtime/evaluate-adapter-mode.test.mjs)
- [scripts/agent-runtime/prepare-compare-worktrees.mjs](../scripts/agent-runtime/prepare-compare-worktrees.mjs)
- [scripts/agent-runtime/prepare-compare-worktrees.test.mjs](../scripts/agent-runtime/prepare-compare-worktrees.test.mjs)
- [scripts/agent-runtime/prune-workspace-artifacts.mjs](../scripts/agent-runtime/prune-workspace-artifacts.mjs)
- [scripts/render-self-dogfood-html.mjs](../scripts/render-self-dogfood-html.mjs)
- [scripts/render-self-dogfood-html.test.mjs](../scripts/render-self-dogfood-html.test.mjs)
- [scripts/render-self-dogfood-experiments-html.mjs](../scripts/render-self-dogfood-experiments-html.mjs)
- [scripts/render-self-dogfood-experiments-html.test.mjs](../scripts/render-self-dogfood-experiments-html.test.mjs)
- [scripts/run-self-dogfood.mjs](../scripts/run-self-dogfood.mjs)
- [scripts/run-self-dogfood.test.mjs](../scripts/run-self-dogfood.test.mjs)
- [scripts/run-self-dogfood-experiments.mjs](../scripts/run-self-dogfood-experiments.mjs)
- [scripts/self-dogfood-experiment-prompt.mjs](../scripts/self-dogfood-experiment-prompt.mjs)
- [artifacts/self-dogfood/latest/index.html](../artifacts/self-dogfood/latest/index.html)
- [scripts/agent-runtime/behavior-intent.mjs](../scripts/agent-runtime/behavior-intent.mjs)
- [scripts/agent-runtime/cli-proposal-candidates.mjs](../scripts/agent-runtime/cli-proposal-candidates.mjs)
- [scripts/agent-runtime/chatbot-proposal-candidates.mjs](../scripts/agent-runtime/chatbot-proposal-candidates.mjs)
- [scripts/agent-runtime/skill-proposal-candidates.mjs](../scripts/agent-runtime/skill-proposal-candidates.mjs)
