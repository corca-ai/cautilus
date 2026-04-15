# Cautilus Handoff

이 문서는 다음 세션이 바로 이어야 할 한 수만 남긴다.

## Workflow Trigger

- 다음 세션에서 이 문서를 멘션하면 먼저
  [README.md](../README.md),
  [AGENTS.md](../AGENTS.md),
  [docs/master-plan.md](./master-plan.md),
  [docs/specs/index.spec.md](./specs/index.spec.md),
  [docs/specs/archetype-boundary.spec.md](./specs/archetype-boundary.spec.md),
  [docs/specs/current-product.spec.md](./specs/current-product.spec.md)
  를 읽고, 이 핸드오프의 `## Working Patterns` 섹션도 참고용으로 확인한다.
- **패턴 발동은 사용자-요청 모델이다.** premortem/카운터웨이트/iterative
  premortem 등은 **사용자가 명시적으로 요청할 때만 발동**한다.
  에이전트가 "필요하겠다"고 판단해서 자발적으로 돌리지 않는다.
- 시작 branch는 `main`이다. 이번 세션 끝에 로컬 `main` 은 4 커밋 (품질
  리뷰 리프레시 + phase-label verify + prompt shape assert + SKILL.md
  trim) + 이 핸드오프 커밋이 `origin/main` 보다 앞선 상태로 남는다.
  다음 세션 시작 시 먼저 `git status` / `git log origin/main..HEAD` 로
  unpushed 확인 후 push 여부 결정.
- product-owned seam이면 `cautilus`에서 먼저 고친다.

## Current State

이번 세션은 `/charness:quality` 로 시작해 2026-04-15 품질 리뷰 갱신
후 세 개의 advisory ergonomics smell 을 바로 deterministic 개선으로
승격. 한 세션 4 커밋으로 "다음 한 수" 다시 비워진 상태.

- **품질 리뷰 refresh.** 이전 2026-04-12 리뷰를
  `skill-outputs/quality/history/` 로 rotate. 새 리뷰에서 세 advisory
  발견: (1) `phase_level_signal: weak` + `escape_hatch: missing` on
  pre-push, (2) `long_core` on `skills/cautilus/SKILL.md` (297 non-empty
  lines vs 160 threshold), (3) 이월된 self-dogfood prompt shape deterministic
  assertion missing.
- **#1 — verify phase label + verbose escape hatch.**
  `scripts/run-verify.mjs` 가 9 phase (eslint/specs/archetypes/links/
  golangci/vet/govulncheck/go race/node) 를 ▶ 라벨 + 경과시간으로 순차
  실행. 실패 시 `✖ <label> (exit N)` 로 어느 phase 가 터졌는지 스크롤 없이
  확인. `npm run verify:verbose` + `npm run test:node:spec` 가 verbose
  escape hatch. 11 unit test 로 PHASES 커버리지, arg parse, resolver,
  success / short-circuit / spawn-error / verbose routing 검증.
- **#2 — self-dogfood prompt shape deterministic assertion.**
  `scripts/self-dogfood-experiment-prompt.test.mjs` 에 9 test 추가.
  6 adapter variant (self-dogfood, gate-honesty-{a,b},
  review-completion, binary-surface, skill-surface) × 4 section
  (Experiment Context / Current Run Evidence / Inlined Artifact
  Excerpts / Baseline Artifact Excerpts) 매트릭스로 각 섹션의 존재/부재
  + 필수 bullet/path/fallback 을 결정론 체크. 2026-04-12 "Missing"
  이월분 해소.
- **#3 — SKILL.md core trim 297 → 159 non-empty lines (−46%).**
  세 reference 로 progressive disclosure 분리:
  `references/bootstrap-inventory.md` (LLM-behavior surface 인벤토리
  checklist; adapter YAML 편집 전 체크), `references/self-dogfood-runner.md`
  (4 maintainer-local `dogfood:self*` wrapper + claim boundary),
  `references/command-cookbook.md` (step-8 concrete cautilus CLI
  invocation 블록 전체). `standalone-surface.spec.md` 의 커맨드 가드
  블록 + `self-dogfood.spec.md` + `current-product.spec.md` 의 관련
  가드를 새 reference 파일로 재지정 (source + packaged twin 모두).
  `internal/app/cli_smoke_test.go` 도 inventory 문자열을 새 reference
  에서 읽도록 갱신. `plugins/cautilus/skills/cautilus/` 패키지 트리는
  `npm run skills:sync-packaged` 로 재동기화 (byte-identity 테스트 유지).

## Unpushed Commits

이번 세션 4 커밋 (main 기준 push 전):

```
26e3d7f Trim skills/cautilus/SKILL.md core from 297 → 159 non-empty lines
7d7c60c Assert self-dogfood review prompt shape per adapter
e51d09a Phase-label verify + expose test:node:spec verbose escape hatch
da72e5d Refresh quality review for post-starter-kit surface (advisory ergonomics smells)
```

## Last Verified

- `npm run verify` (Go + Node all green; 새 phase-labeled orchestrator
  통과, 총 31-32s)
- `npm run lint:specs` (5 specs, **603 guard rows** — +5 from spec
  guard 재지정)
- `npm run lint:archetypes` (3 archetypes × 11 surface 유지)
- `npm run lint:links` (86 파일; 3개 신규 reference 포함)
- `node --test test:node:spec` (222 pass / 0 fail / ~22s; run-verify
  unit test 11건, prompt shape test 12건 포함)
- `inventory_skill_ergonomics` — `long_core` advisory 해소 (159 < 160);
  `mode_pressure_terms_present` + `code_fence_without_helper_script` 는
  CLI product skill 특성상 잔존, advisory 수용

## Next Session

4 커밋 push 전. 먼저 push 후 방향 선택.

- **(옵션 A) README / operator-acceptance 축약 (defer 된 #4).**
  2026-04-15 품질 리뷰의 `long_entrypoint` + mode/option pressure
  advisory. README 를 다른 이유로 편집할 때 in-flight 로 합치는 것이
  원래 계획. 별도 세션 요청이면 바로 착수 가능.
- **(옵션 B) Master Plan 의 Immediate Next Moves.**
  열린 것: (1) 최적화 레이어 다음 bounded improvement seam
  (dogfood 증거 요구 시), (2) scenario-history 확장 — unlock trigger
  대기 ([scenario-history.md § Deferred Expansion](./contracts/scenario-history.md)),
  (5) starter kit 실사용 pain 정리, (6) 다른 packet type HTML
  rendering.
- **(옵션 C) 3-angle 우선순위 투표로 drive-by 발굴.**
  Working Patterns 대로 사용자가 요청 시.

현재 남은 **영구 drop** 목록:

- D (category-confused docs-shuffle), B (prototype lifetime enforcement),
  M (stderr deprecation warning), I (smoke-external-consumer
  `--example-input`), H, G, J, L, C (plugins/ equality guard / rewriter
  idempotency test), Validator subset 확장, `MustBehaviorSurface` 재도입.

## Consumer Migration (v0.4.x)

이번 세션 외부 영향은 모두 additive 또는 문서 경로 이동. 동작 변화
없음.

- **`skills/cautilus/SKILL.md` content relocation** (additive for
  consumers; packaged 트리에 새 reference 추가됨).
  네 개 `npm run dogfood:self*` wrapper 설명은 이제
  `references/self-dogfood-runner.md`, step-8 concrete CLI invocation
  블록은 `references/command-cookbook.md`, adapter YAML 편집 전 인벤토리는
  `references/bootstrap-inventory.md`. SKILL.md core 는 선택/순서만
  보유. `cautilus install --repo-root .` 이 설치하는 tree 는 새
  reference 포함 (test 가 검증).
- **`npm run verify:verbose`, `npm run test:node:spec`** (additive):
  기존 `npm run verify` 는 phase-labeled orchestrator 로 감싸짐, 외부
  인터페이스 동일. pre-push 는 변화 없이 여전히 `npm run verify`.
- **spec guard 재지정** (no-op for consumers): 동일 문자열이 이제
  `references/*.md` 에 있어 spec guard rows 가 그쪽을 가리킴.

## Discuss

- 이번 세션 판단:
  - **#1 (verify phase label)**: pre-push 는 계속 `npm run verify` 를
    부르는 단일 엔트리. 실패 위치 명확성만 올리려고 phase 라벨을 위로
    빼고, 테스트를 위해 `PHASES` + `resolveScript` + `runPhases` 를 순수
    함수로 분리. 외부 인터페이스 동일. dot reporter 를 기본값으로 유지
    (standing gate verbosity 원칙), verbose 는 명시적 opt-in.
  - **#2 (prompt shape assert)**: 이전 리뷰가 "smoke 로는 섹션 누락을
    놓칠 수 있다" 고 못박아놨던 이월분. 6 adapter variant × 4 section
    매트릭스로 gating 규칙 (Current Run Evidence 는 `self-dogfood` 전용,
    Baseline Artifact Excerpts 는 `gate-honesty-b` 전용) 을 결정론
    assert. 섹션별 필수 bullet + fallback 경로 (`n/a`) 까지 커버.
  - **#3 (SKILL.md trim)**: `long_core` advisory 는 tasteful 하지 않고
    progressive-disclosure 원칙의 objective test. core 에서 삭제가
    아니라 reference 로 이동 — spec guard + Go test + packaged 트리
    세 군데가 이동을 따라가야 통과. "문서를 옮기면 그걸 assert 하는
    gate 도 같이 옮긴다" 원칙이 이번 세션에 구체화된 working pattern.
  - scenario-history: 이전 세션 defer 결정 유지. Trigger 3종은 이번에도
    발생 없음.

- **현재 열려 있는 설계 질문:** 없음. 이번 세션은 품질 개선만.

- 아직 의도적으로 안 하는 것:
  - 한국어 `README.ko.md`.
  - JSON 키 순서 통일.
  - Node shim for air-gapped consumers.
  - SKILL.md → docs/ upward 링크 (SKILL.md self-contained 관습).
  - `cautilus.behavior_intent` 스키마 bump (v1 유지 + 별칭 충분).
  - scenario-history 두 조각 확장 — **trigger 대기**.
  - 새 starter smoke 자동화 (사용자가 개밥 repos 에서 수동 검증 선호).
  - Homebrew managed smoke 를 CI/pre-push 에 편입.
  - Admin web UI / scenario persistence UI / runtime-log mining 구현 /
    host-specific prompt benchmark profiles (current-product.spec.md
    가 명시적으로 제외).
  - 위 drop 리스트.

## Working Patterns

지난 세션들에서 실제로 효과가 컸던 운영 패턴. **사용자가 요청할 때
발동한다** (자동 적용 모델은 두 세션 연속 실패 후 폐기, Workflow
Trigger 참고).

- **Premortem은 두 시점에 각각 돌린다: 결정 직전 + 실행 직전.**
  핸드오프에 "premortem 완료"라고 적혀 있어도 그건 **결정에 대한
  커버리지**이고, 실제로 카스케이드·삭제·리네임 코드를 칠 때는 **실행
  각도로 다시** 돌려야 한다. 실행 후 premortem 도 유효함 (이전 세션 E
  fold-in 2건 실제 잡음).
- **Angle 수는 슬라이스 규모에 맞춘다.** 단일 슬라이스 = 1각, 2-3 슬라이스
  = 2각, 스펙 리네임·스키마 bump·다수 파일 카스케이드 = 3-4각. 이번
  세션 scenario-history 는 breaking change 후보였기에 4각.
- **premortem 직후 카운터웨이트 1회.** 여러 에이전트 결과가 쌓이면 **하나의
  카운터웨이트 에이전트**에게 "과한 걱정 / YAGNI / premature optimization
  을 솔직히 지적해줘" 를 돌린다. 카운터웨이트는 각 finding 을 (a) 출시
  전 반드시 고침, (b) 같은 변경에 끼워넣기 cheap, (c) 과한 걱정 → 무시,
  (d) 유효하지만 defer 로 분류해야 한다. **1각 결과가 작으면
  카운터웨이트 skip** (이전 세션 E 가 예).
- **Premortem 의 한 agent 가 devil's-advocate 역할을 제대로 하면 별도
  카운터웨이트 agent 를 생략 가능.** 단 그 agent 의 핵심 주장은 repo
  에서 직접 검증해야 한다. 이번 세션 scenario-history 가 예 — C 의
  3대 주장 (self-dogfood = full_gate, profile 0 체크인, Part 2 call
  site 0) 을 3 grep + 1 read 로 confirm. 검증 없이 C 주장을 그대로
  받는 건 위험.
- **우선순위 투표도 카운터웨이트를 건다.** Follow-up promote 결정에서
  3-angle 투표만 보고 2/3 득표로 promote 하면 "tidiness reflex"
  아이템이 실려 올 수 있다. 카운터웨이트 한 번은 그런 consensus-by-
  accident 를 잡아낸다.
- **스펙에 `Deliberately not doing` 섹션을 박는다.** 결정을 기록할 때
  채택한 것만이 아니라 **고려하고 기각한 대안 + 기각 사유**도 같이
  적는다. 6개월 뒤 재논의를 막고, 다음 세션이 "왜 이건 안 했지?" 를
  바로 판단할 수 있다.
- **Deferred slice 도 같은 원리로 박는다.** premortem 후 defer 로
  결정된 큰 slice 는 해당 contract 문서에 "Deferred Expansion" 섹션
  으로 **scope + why + trigger + must-fix 분류** 를 남긴다. 다음
  세션이 4각 premortem 재실행 없이 바로 판단할 수 있다. 이번 세션
  scenario-history 가 예 — [scenario-history.md](./contracts/scenario-history.md).
- **Iterative premortem.** 라운드 1 결과 일부 반영 → 거기서 생긴
  **새 결정**에 대해 라운드 2 다시.
- **Breaking change 의 actionable error 계약.** 스키마·서브커맨드
  리네임 시 옛 경로는 `actionable error` 로 새 경로를 가리켜야 한다.
- **Catalog-level deprecation vs schema bump.** v1 surface 이름이
  archetype vocabulary 를 leak 하면 schema bump 가 아니라 catalog-level
  deprecation (별칭 + silent 정규화) 이 default. 스키마 bump 는 consumer
  migration 을 강제해야 할 실제 이유가 있을 때만.
- **Pre-deletion parity gate 는 시맨틱 byte-identity 로 읽는다.**
  `jq --sort-keys 'sort_by(.proposalKey)'` 후 byte 동일이면 gate 통과.
  **Parity test 가 true byte-identity 를 요구하는데 슬라이스가 의도적
  으로 source→dest 변환을 도입하면, parity test 를 "변환 후 비교" 로
  재정의** (이전 세션 E `distribution-surface.test.mjs` 예).
- **Standing gate 먼저, 슬라이스 나중.** 다수 파일 카스케이드를 수반
  하는 슬라이스를 계획 중이면 린터부터. 이전 세션 A (archetype
  completeness lint) 가 예.
- **Standing gate 가 landed 되면 escape hatch 를 재평가.** 이전 세션 N
  (`MustBehaviorSurface` 삭제) 가 예.
- **Follow-up 번호는 스펙에서 삭제될 때 재넘버링한다.** gap 을 남기지
  말고 삭제 + 재넘버링 + cross-ref 갱신을 한 커밋에.
- **Fixture 이름 컨벤션: canonical / minimal / specialized.** 이번
  세션 §2 에서 공식화. canonical=`<archetype>-input.json` (realistic,
  full), minimal=`--example-input` stdout (schema 최소), specialized=
  `samples/` 하위 (consumer narrative). Starter kit input.json 은
  canonical 의 drift-tested copy 이며 새 역할 아님.
- **External dependency 추가 전에 기존 관행 먼저 확인.** 이전 세션 F
  에서 Ajv 추가 대신 Node 측 minimal validator 패턴을 Go 로 포팅.
  이번 세션 §3 에서 Homebrew smoke 새 스크립트 만들지 않고 기존
  `run-install-smoke.mjs` 의 homebrew 채널 재사용.
- **Copy + drift test 패턴.** 의도된 파일 중복 (starter/<X>/input.json
  ↔ canonical fixture) 은 drift test 로 byte-identity 를 강제하는
  기존 standing pattern (sync-packaged-skill + distribution-surface
  test) 을 따른다. 추상화 재발명 금지.
- **문서를 옮기면 그걸 assert 하는 gate 도 같이 옮긴다.** 이번 세션
  SKILL.md core → `references/*.md` 이동 때 확인: spec guard rows,
  Go smoke test 의 문자열 assert, packaged 트리 sync 세 군데가
  이동을 따라가야 verify 통과. 이동 전에 grep 으로 해당 경로를
  assert 하는 곳을 전부 찾아 같은 슬라이스 안에서 재지정할 것.

## Premortem Hazards

- 가장 쉬운 오해: 아키타입 확장을 미리 많이 해두려는 욕심. 네 번째
  (예: `tool_use`, `pipeline`) 유혹이 와도 하지 말자.
  `archetype-boundary.spec.md` 가 요구하는 대로, 새 아키타입은 schema
  + helper + CLI + contract + fixture + README + SKILL.md + scenarios.go
  + starter kit 까지 한 슬라이스에 같이 가져올 때만 추가. 순서는
  스펙의 "Adding A New First-Class Archetype" 12-step walkthrough.
  `npm run lint:archetypes` 가 이 완결성을 자동 검증 (starter kit 은
  optional 로 남겨둠).
- 프로토타입은 `internal/runtime/prototypes/` 로 간다 (escape hatch).
  `cautilus.<name>_prototype.v0` 네이밍.
- **`sync-packaged-skill.mjs` 가 upward 링크를 rewriting 한다.**
  packaged 트리의 `.md` 파일 내용이 source 와 byte-identical 이 아니다.
  새 consumer-facing docs 를 `skills/cautilus/references/` 아래 추가
  할 때 upward 링크를 쓰면 rewriter 가 packaged 복사본에서 자동으로
  2 level 더 깊게 rewrite. **Link text 에 경로를 쓰지 말 것** — 그러면
  packaged 에서 text/target mismatch. filename-label 또는 human-label.
- **Starter kit fixture drift.** `examples/starters/<archetype>/input.json`
  은 `fixtures/scenario-proposals/<archetype>-input.json` 의 byte-
  identical copy. 한 쪽만 편집하면 `scripts/starter-kit-parity.test.mjs`
  실패. 같이 갱신하거나 `cp` 로 재복사.
- **핸드오프 bookkeeping 은 세션 말미에 한 번만.** 매 커밋마다
  unpushed count 를 업데이트하면 off-by-one 정정 마이크로 커밋이
  쌓인다. 슬라이스 전부 끝내고 푸시 직전 한 번 정리하거나, 아예
  push 까지 세션 안에서 끝내는 것이 낫다.

## References

- [README.md](../README.md)
- [docs/master-plan.md](./master-plan.md)
- [docs/specs/archetype-boundary.spec.md](./specs/archetype-boundary.spec.md)
- [docs/specs/current-product.spec.md](./specs/current-product.spec.md)
- [docs/contracts/chatbot-normalization.md](./contracts/chatbot-normalization.md)
- [docs/contracts/skill-normalization.md](./contracts/skill-normalization.md)
- [docs/contracts/workflow-normalization.md](./contracts/workflow-normalization.md)
- [docs/contracts/behavior-intent.md](./contracts/behavior-intent.md)
- [docs/contracts/scenario-history.md](./contracts/scenario-history.md)
  (§ Deferred Expansion: scenario-history 확장 premortem findings)
- [docs/consumer-migration.md](./consumer-migration.md)
- [docs/evaluation-process.md](./evaluation-process.md)
- [docs/external-consumer-onboarding.md](./external-consumer-onboarding.md)
- [docs/releasing.md](./releasing.md)
- [examples/starters/chatbot/](../examples/starters/chatbot/)
- [examples/starters/skill/](../examples/starters/skill/)
- [examples/starters/workflow/](../examples/starters/workflow/)
- [internal/runtime/proposals.go](../internal/runtime/proposals.go)
- [internal/runtime/proposals_test.go](../internal/runtime/proposals_test.go)
- [internal/runtime/scenarios.go](../internal/runtime/scenarios.go)
- [internal/runtime/intent.go](../internal/runtime/intent.go)
- [internal/runtime/prototypes/README.md](../internal/runtime/prototypes/README.md)
- [internal/app/examples.go](../internal/app/examples.go)
- [internal/app/examples_schema_test.go](../internal/app/examples_schema_test.go)
- [scripts/check-markdown-links.mjs](../scripts/check-markdown-links.mjs)
- [scripts/check-specs.mjs](../scripts/check-specs.mjs)
- [scripts/check-archetype-completeness.mjs](../scripts/check-archetype-completeness.mjs)
- [scripts/release/sync-packaged-skill.mjs](../scripts/release/sync-packaged-skill.mjs)
- [scripts/release/run-install-smoke.mjs](../scripts/release/run-install-smoke.mjs)
- [scripts/starter-kit-parity.test.mjs](../scripts/starter-kit-parity.test.mjs)
