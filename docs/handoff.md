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
- 시작 branch는 `main`이다. 이번 세션 끝에 사용자가 push 하여 로컬과
  `origin/main` 일치. 다음 세션 시작 시 `git fetch` 로 확인.
- product-owned seam이면 `cautilus`에서 먼저 고친다.

## Current State

이번 세션에 Top 3 소화 (§1, §2, §3) + scenario-history 확장 premortem
후 defer + archetype starter kits 3종 착륙. 한 세션 5 커밋으로 "다음
한 수"가 비워진 상태.

- **§1 — introspection surfaces spec 섹션.**
  `archetype-boundary.spec.md` 에 `--help`(사람) / `cautilus commands`
  (기계 CLI registry) / `cautilus scenarios`(archetype 의미 카탈로그)
  세 surface 역할을 못박음. 나중에 `scenarios` 를 `commands` 로 합치는
  실수 방지.
- **§2 — fixture canonical/specialized 분리.**
  canonical=full (`<archetype>-input.json`), minimal=`--example-input`
  stdout, specialized=`fixtures/scenario-proposals/samples/` 로 3 역할
  규약. 3개 specialized fixture (`chatbot-consumer`,
  `skill-validation`, `workflow-recovery`) 를 `samples/` 로 이동 +
  참조 5 파일 갱신. Fixture Naming 섹션이 스펙에 기록.
- **§3 — Homebrew on-demand smoke npm script.**
  `release:smoke-install:brew` = `run-install-smoke.mjs --channel
  homebrew --allow-system-mutation` wrap. 코드는 이미 완비되어 있었고
  npm script 편의 진입점만 빠져있던 상태. CI/pre-push 미편입, Linux+
  macOS 에서 brew 설치된 환경 on-demand only.
- **scenario-history 확장 premortem → defer.** 4각
  (cache migration / external consumer / devil's-advocate / doc cascade)
  + C 의 주장 직접 verification (self-dogfood 가 `full_gate` 모드 사용
  → baseline-cache 자체 비활성, 0 profile 체크인, `review variants` 와
  `skill evaluate` 에 history 코드 0건) 로 speculative 확인.
  Planned scope + 왜 defer + unlock trigger + must-fix 분류를
  [scenario-history.md § Deferred Expansion](./contracts/scenario-history.md)
  에 기록해서 다음 세션이 4각 premortem 재실행 안 해도 되게.
  master-plan Phase 3 의 "still open" 항목에 그 섹션 pointer 추가.
- **Archetype starter kits.**
  `examples/starters/{chatbot,skill,workflow}/` 3 세트. 각각
  `cautilus-adapter.yaml` (node -e smoke placeholder 로 복사 직후
  `doctor ready`) + `input.json` (canonical fixture 의 drift-tested
  copy) + `README.md`. 드리프트 방지는 `scripts/starter-kit-parity.test.mjs`
  가 byte-identity 검증. archetype-boundary spec 의 각 ### 에
  `starter kit:` bullet 추가 — `lint:archetypes` 의 pre-defined key set
  이 unknown bullet 을 무시하므로 11-surface 체크 영향 없음.

## Unpushed Commits

이번 세션 끝에 사용자가 push 하여 unpushed 없음. 이번 세션 5 커밋:

```
0d961e6 Add archetype starter kits under examples/starters/
b9d8a67 Record deferred scenario-history expansion with premortem findings
8949c66 Add on-demand Homebrew install smoke npm script
680c595 Split archetype fixtures into canonical + specialized samples
6939a04 Pin three introspection surfaces in archetype-boundary spec
```

## Last Verified

- `npm run verify` (Go + Node all green; 모든 lint 통과)
- `npm run lint:specs` (5 specs, 598 guard rows)
- `npm run lint:archetypes` (3 archetypes × 11 surface 유지)
- `npm run lint:links` (85 파일; starter README 3 추가 포함)
- `node --test scripts/starter-kit-parity.test.mjs` (3 archetype drift
  test pass)

## Next Session

이번 세션에 Top 3 + scenario-history 결정 + starter kits 소화. **즉시
대기** 큐가 비었다. 다음 세션은 방향 선택부터 한다:

- **(옵션 A) Master Plan 의 Immediate Next Moves 중 하나.**
  현재 열린 것:
  1. 최적화 레이어 다음 bounded improvement seam (GEPA 확장 또는 다른
     slice; dogfood 증거가 요구할 때만).
  2. scenario-history 확장 — **이번 세션에 defer**. unlock trigger 3개
     ([scenario-history.md § Deferred Expansion](./contracts/scenario-history.md))
     중 하나 발생 시 재고.
  5. starter kit 실사용 검증 후 관찰된 pain 정리 (개밥 repos 에서 직접
     사용 후 피드백). Homebrew managed smoke 로의 추가 승격 여부도
     이 경험치에 달림.
  6. 다른 packet type HTML rendering (JSON/YAML 경계 안정화 후;
     consumer 다수에서 안정화 요건 미달).
- **(옵션 B) 미해결 설계 질문 1건 정착.**
  - 이번 세션에 B-1 (introspection surfaces), B-2 (fixture 규약)
    둘 다 닫음.
  - 남은 설계 질문: Master Plan Phase 5 의 "richer merge heuristics"
    를 dogfood 증거 없이 확장할지 — 증거 없으면 다른 slice 로 이동.
- **(옵션 C) 3-angle 우선순위 투표로 drive-by 후보 발굴.**
  Working Patterns 대로 사용자가 투표 요청하면 3각 + 카운터웨이트 1회.

현재 남은 **영구 drop** 목록 (이전 세션까지):

- D (category-confused docs-shuffle), B (prototype lifetime enforcement),
  M (stderr deprecation warning), I (smoke-external-consumer
  `--example-input`), H, G, J, L, C (plugins/ equality guard / rewriter
  idempotency test), Validator subset 확장, `MustBehaviorSurface` 재도입.

## Consumer Migration (v0.4.x)

v0.4.x 내에서 실질 breaking 은 1건. 이번 세션 외부 영향:

- **specialized fixture 경로 이동** (breaking for scripts referencing
  the old paths): 3개 specialized fixture 가
  `fixtures/scenario-proposals/` → `fixtures/scenario-proposals/samples/`
  로 이동. consumer 가 이 경로를 hardcoded 참조했다면 path 업데이트
  필요. canonical `<archetype>-input.json` 은 그대로.
- **Archetype starter kits** (additive): `examples/starters/<archetype>/`
  가 새 consumer 에게 `adapter init` 보다 빠른 출발점 제공.
- **`release:smoke-install:brew`** (additive): on-demand, CI/pre-push
  미편입.
- **introspection surfaces spec 공식화** (additive): 동작 변화 없음,
  scenarios ↔ commands 관계만 문서화.
- **scenario-history 확장** (no change): 이번 세션 코드 변경 없음,
  defer 기록만.

## Discuss

- 이번 세션 판단:
  - §1: 세 surface 를 별도 유지 이유 = 청중 다름 + 성장 속도 다름
    (`commands` 는 새 subcommand 마다 증가, `scenarios` 는 spec 이
    archetype 추가할 때만). 머지 시 "새 subcommand 가 scenarios
    payload 를 의도치 않게 건드림" 이 위험.
  - §2: canonical=full 이 이미 관행이었음. 세 archetype 모두
    `<archetype>-input.json` 이 specialized 보다 크고 풍부. 규약화가
    새 관행 도입이 아니라 암묵 관행의 명시화.
  - §3: Homebrew smoke 코드가 이미 `run-install-smoke.mjs` 에 완비.
    npm script wrapper 한 줄만 빠져있었던 상태. 편의 진입점 추가가
    실작업 전부.
  - scenario-history: C (devil's-advocate) 가 "현재 baseline-cache 가
    생성되는 경로 자체가 없다 (self-dogfood = full_gate, profile 체크인
    0건, review variants/skill evaluate 는 history 코드 0건)" 를
    주장. 3 grep 으로 직접 confirm. Part 1 (reusable store) 는 공유할
    cache 가 없는 상태에서 공유 추상만 추가, Part 2 (broader ownership)
    는 call site 없음. master-plan Phase 5 의 "speculatively 말라"
    원칙 직접 적용하여 defer.
  - starter kits: fixture 는 copy + drift test. sync-packaged-skill
    과 동일 패턴이라 신규 abstraction 없음. `lint:archetypes` 가
    unknown bullet 을 무시하도록 설계되어 있어 spec 에 `starter kit:`
    bullet 추가가 11-surface 강제로 이어지지 않음 (사용자가 명시적으로
    피한 덫).

- **현재 열려 있는 설계 질문:** 없음. B-1, B-2 둘 다 이번 세션에 닫힘.

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
