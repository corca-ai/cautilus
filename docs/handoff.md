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
- 시작 branch는 `main`이다. 이번 세션 끝에 6커밋이 로컬에 쌓여 있고
  **사용자가 직접 push할 예정**. 다음 세션 시점에 `origin/main`이
  로컬과 동일한지 `git fetch && git log origin/main..HEAD` 로 먼저 확인.
- product-owned seam이면 `cautilus`에서 먼저 고친다.

## Current State

이번 세션에 6슬라이스가 landed (`archetype-boundary.spec.md` follow-up
전부 소화, 남은 것은 `follow-up 1` 1건):

- README `## Scenarios` 블록이 `## Why Cautilus` 위로 올라가 있다 (첫
  방문자가 philosophy 전에 3 아키타입 블록을 먼저 본다). `held-out`,
  `packet`, `bounded`, `review variant`, `executor variant` 첫 등장에
  one-line parenthetical 정의 추가. `intent-first`는 principle list에서
  self-defining.
- `cautilus scenarios [--json]` 신규 introspection 커맨드. 3 아키타입
  catalog를 `cautilus.scenarios.v1` 스키마로 노출. 카탈로그는
  [internal/runtime/scenarios.go](../internal/runtime/scenarios.go)에
  있고, example input은 canonical 이름(`chatbot-input.json`,
  `skill-input.json`, `workflow-input.json`) 사용. 스펙 Source Guard 는
  specialized (`chatbot-consumer-input.json`, `skill-validation-input.json`)
  그대로 — handoff 설계 의도 (스펙=specialized, current-product/scenarios=canonical).
- `cautilus doctor` ready 페이로드에 `next_steps` 필드 추가 (snake_case,
  doctor 전체 컨벤션 일치). 첫 메시지는 `cautilus scenarios` 안내 고정.
- `workflow_conversation` → `conversation_continuity` catalog-level
  deprecation. 스키마는 `cautilus.behavior_intent.v1` 유지. Go/Node 양쪽
  입력에서 옛 이름을 silently 정규화 (`deprecatedBehaviorSurfaceAliases`
  in `intent.go`, `DEPRECATED_BEHAVIOR_SURFACE_ALIASES` in
  `behavior-intent.mjs`). `docs/consumer-migration.md`에 "Deprecated
  Surface Names" 섹션이 있다.
- `docs/specs/archetype-boundary.spec.md`가:
  (a) ordered "Adding A New First-Class Archetype" 12-step walkthrough을
  갖고, (b) `### Experimental Prototypes` 섹션으로 escape hatch 명시,
  (c) Source Guard가 `assertSkillTargetKind`/`assertWorkflowTargetKind`,
  `handleScenarioNormalize{Chatbot,Skill,Workflow}`, `scenarios.go`,
  SKILL.md normalize 커맨드, README/SKILL.md의 "three" 카운트 라인을
  포함한다.
- `internal/runtime/prototypes/` 디렉터리 + README가 escape hatch의 실제
  landing spot. `cautilus.<name>_prototype.v0` 네이밍, 상단에
  `// Prototype lifetime:` 코멘트 규약, 승격 체크리스트.
- `internal/runtime/proposals.go` 상단에 per-archetype contract 코멘트
  블록 (네 shape 명시 + "lint는 scenarios.go 누락을 못 잡는다" 명시).
  `humanizeTargetKind` fallback이 Title Case. `MustBehaviorSurface`
  panic-on-miss 헬퍼 추가 (호출자 0, escape hatch).
- `proposals_test.go`에 3개 regression guard 추가: event-triggered
  followup 커버리지, "CLI Workflow" 라벨, `mergeCandidatesByProposalKey`
  insertion-order.
- 4-angle premortem (document-cascade / blast-radius / external-callers /
  onboarding-readability) + 카운터웨이트로 (a)+(b) finding fold-in
  클린업.

## Unpushed Commits

사용자가 직접 push 예정. 6커밋:

```
f73d356 Apply premortem (a)+(b) findings: cross-refs, discoverability, names
4241a4f Define the Experimental Prototypes escape hatch
88b1dc7 Harden archetype-extension seams for a future fourth archetype
a5151e9 Rename workflow_conversation surface to conversation_continuity
6bf065d Add cautilus scenarios command and doctor next-step hint
b0f038e Reorder README Scenarios above philosophy + add inline glossary
```

## Last Verified

- `npm run verify` (Go + Node all green; ~22s)
- `npm run lint:specs` (5 specs, 583 guard rows)
- `npm run lint:links` (62 files checked, 19 derived skipped)
- `./bin/cautilus scenarios` — canonical 경로 3개 출력 확인
- `./bin/cautilus scenarios --json` — `cautilus.scenarios.v1` payload 확인
- `./bin/cautilus doctor --repo-root <tmp-with-adapter>` — ready payload에
  `next_steps: ["Run \`cautilus scenarios\` …"]` 확인
- `./bin/cautilus scenario normalize {chatbot,skill,workflow} --example-input`
  round-trip 통과 (이전 세션 유지)

## Next Session

이번 세션 끝에 3-angle 우선순위 투표 + 카운터웨이트로 확정된 top 3
(스코프 캡 3슬라이스 상한).

1. **A — inverse-completeness spec lint.**
   `docs/specs/archetype-boundary.spec.md`의 `## Archetypes` 아래
   `###` 헤딩을 enumerate 해서 각 아키타입이 11개 surface 카테고리
   (schema constant, helper, CLI subcommand, fixture, contract doc,
   behavior surfaces, assertion function, handler, scenarios catalog
   entry, README block, SKILL.md reference) 전부 가지고 있는지 검증.
   `npm run lint:specs` 또는 별도 스크립트. **순서·코-커밋 강제는
   out-of-scope** — 스펙 line 222에 명시됨. 현재 Source Guard의 역방향
   (존재는 맞지만 각 아키타입이 full set인지 아닌지) 을 잠그는 standing
   gate. 유일하게 3/3 만장일치 픽.
2. **E — packaged-skill relative links.**
   `plugins/cautilus/skills/cautilus/references/*.md`가 `cpSync`로 복사된
   뒤 상대링크가 깨짐 (상위 트리 깊이가 다름). 현재 `scripts/check-markdown-links.mjs`가
   이 디렉터리를 `derived`로 skip해서 우회 중. 고치고 나면 linter의
   skip을 제거. 두 경로: (a) sync 스크립트가 경로 rewriting, (b)
   consumer-facing docs를 link-free로 재작성. 설계 질문부터 먼저.
3. **F — examples.go schema validation.**
   `internal/app/examples.go`의 예제 JSON을
   `fixtures/scenario-proposals/*-input.schema.json`으로 schema-validate
   하는 gate 추가. 예제 문자열이 `cautilus scenario normalize <archetype>
   --example-input`으로 노출되므로 onboarding agent가 첫 터치하는
   surface. round-trip은 parseable만 증명하므로 schema 대조 필요.

**Honorable mention (다음 세션이 아니라 그 다음 가까이):**
- K — `skills/cautilus/SKILL.md` §2 (`skill test` vs `skill evaluate`
  스키마 혼동 문구 재작성)
- C — `plugins/` 미러 equality guard (cpSync 우회가 현실 위협 되면 추가)
- N — `MustBehaviorSurface` 삭제 또는 call-site refactor (드라이브-바이)

**영구 drop:**
- D — `cautilus.scenarios.v1` 별도 inventory 등록 (category-confused
  docs-shuffle; 스키마는 이미 `scenarios.go` + Source Guard에 있고
  `release-boundary.md`는 릴리스 surface inventory지 스키마 inventory가
  아님)
- B — 프로토타입 lifetime 코멘트 enforcement (YAGNI; Go 프로토타입 0건)
- M — stderr deprecation warning on `workflow_conversation` 별칭
  (`BuildBehaviorIntentProfile` 시그니처 변경 대비 효용 부족;
  `consumer-migration.md` prose로 충분)
- I — smoke-external-consumer `--example-input` 커버리지 (deterministic
  unit test가 이미 커버)
- H, G, J, L — 3-angle 전원일치 reject (plugin manifest version lag,
  release-artifacts old-tag rerun, canonical workflow-input 크기,
  doctor next_steps 조건부 분기)

## Consumer Migration (v0.4.x)

v0.4.x 내에서 breaking change는 없다. 이번 세션의 외부 영향:

- `workflow_conversation` → `conversation_continuity` (catalog-level
  deprecation, v1 유지). 별칭 계속 accepted. 새 emitter는 canonical
  이름 사용. `docs/consumer-migration.md` "Deprecated Surface Names"
  참고.
- `cautilus scenarios` 신규 introspection 커맨드 (additive).
- `cautilus doctor` ready payload에 `next_steps` 필드 (additive).
- `cautilus.scenarios.v1` 신규 스키마 (catalog-only, `cautilus scenarios
  --json`에서 노출).

## Discuss

- 이번 세션 판단:
  - `workflow_conversation` 리네임을 스키마 bump 대신 catalog-level
    deprecation + 별칭으로 한 이유: 외부 emitter가 바로 깨지지 않도록.
    명시적 consumer가 적은 현 시점에서 zero-migration 경로가 더
    정직했다. 별칭이 영원히 사는 리스크는 있지만 stderr warning (M)은
    플러밍 비용 대비 효용 부족으로 drop.
  - `scenarios.go`가 canonical fixture 이름 (`chatbot-input.json`,
    `skill-input.json`)을 쓰고 스펙 Source Guard는 specialized
    (`chatbot-consumer-input.json`, `skill-validation-input.json`)를
    그대로 쓰는 설계. 이유: 지난 세션 핸드오프에 "스펙/README
    Scenarios/archetype-boundary/consumer-readiness는 specialized,
    current-product만 canonical" 설계 의도가 박혀 있었음. `scenarios`는
    introspection 진입부이므로 current-product = canonical 계열과 align.
  - `MustBehaviorSurface`를 만들었지만 call-site refactor는 생략.
    Escape hatch로 존재. 다음 세션 Honorable (N) 후보.
  - 4-angle premortem이 5-slice 클린업 대비 oversize였음.
    Counterfactual: blast-radius + document-cascade 두 각도만으로 거의
    같은 (a) 리스트 나왔음. D를 2/3 득표에도 impact-leverage의
    rejection 덕분에 뒤집은 것이 3-angle의 유일한 실질 이득.
    다음에 이 규모는 1-2각으로 충분.
  - 이번 투표에서 promote된 A/E/F는 **세 각도가 독립적으로** 신호를
    준 것 (A는 3/3, E와 F는 2/3인데 rejection이 아니라 단순 deferral).
    우연 합의가 아님.

- **Deferred from retrospective** (이번 세션 + 이전 세션 defer 합산):
  - F2b (plugin relative links) → **다음 세션 promote (E)**.
  - F2c (examples.go schema validation) → **다음 세션 promote (F)**.
  - F3c: `release-artifacts.yml` old-tag 재실행 시 `lint:links` 부재로
    깨질 수 있음 — 재실행 시나리오가 드물어 우선순위 낮음.
  - F3d: plugin manifest `0.4.0` lag — `release:prepare`가 auto-fix.
  - F3e: smoke-external-consumer `--example-input` 커버리지 →
    이번 투표에서 drop (unit test가 커버).
  - F4e: canonical `workflow-input.json` (47줄) vs specialized
    `workflow-recovery-input.json` (30줄) — 이번 투표 drop, 설계 질문은
    미해결 (canonical=minimal vs canonical=full reference).
  - F4f (SKILL.md §2 wording) → Honorable (K).

- 아직 열려 있는 질문:
  - `cautilus scenarios`가 `cautilus commands`와 어떻게 관계 맺을지
    (동일 registry 확장 vs 별도 리스트). 현재는 별도 payload.
  - canonical=minimal vs canonical=full 정의 (F4e 연장).

- 아직 의도적으로 안 하는 것:
  - 한국어 `README.ko.md` (영문 자체를 먼저 쉽게 만들기로 결정).
  - JSON 키 순서 통일 (정보 손실 없어서 안 함).
  - Node shim for air-gapped consumers.
  - SKILL.md → docs/ upward 링크 (SKILL.md self-contained 관습).
  - `cautilus.behavior_intent` 스키마 bump (v1 유지 + 별칭 충분).
  - 위 drop 리스트 (D, B, M, I, H, G, J, L) — 각 drop 이유는 Next
    Session 참고.

## Working Patterns

지난 세션들에서 실제로 효과가 컸던 운영 패턴. **사용자가 요청할 때
발동한다** (자동 적용 모델은 두 세션 연속 실패 후 폐기, Workflow
Trigger 참고).

- **Premortem은 두 시점에 각각 돌린다: 결정 직전 + 실행 직전.**
  이 둘을 혼동하면 안 된다. 핸드오프에 "premortem 완료"라고 적혀 있어도
  그건 **결정에 대한 커버리지**이고, 실제로 카스케이드·삭제·리네임 코드를
  칠 때는 **실행 각도로 다시** 돌려야 한다.
  - 결정 전 premortem 대상: 스펙 확정 직전, 브레이킹 체인지 직전,
    이중 구현을 한쪽으로 합치는 결정 직전 등. 관점: 스펙 드리프트,
    외부 사용자, devil's advocate, 예측 불가능한 결과.
  - 실행 전 premortem 대상: 삭제·리네임 슬라이스 코드를 치기 직전,
    다수 파일 카스케이드 직전, 문서 체인 편집 직전 등. 관점:
    **문서 카스케이드**, **블라스트 반경**, **외부 호출자**,
    **가독성 드리프트**.
  방법: 일반 general-purpose 에이전트 N개를 **명시적으로 다른 각도**로
  병렬 실행. 각 프롬프트는 self-contained 하게. 이미 follow-up에 잡힌
  항목은 프롬프트에 "DO NOT report these"로 명시.
- **Angle 수는 슬라이스 규모에 맞춘다.** 이번 세션 (5-slice 클린업) 에서
  4-angle 은 oversize 였음. 규모별 기준: 단일 슬라이스 = 1각, 2-3
  슬라이스 = 2각, 스펙 리네임·스키마 bump·다수 파일 카스케이드 = 3-4각.
- **premortem 직후 카운터웨이트 1회.**
  여러 에이전트 결과가 쌓이면 **하나의 카운터웨이트 에이전트**에게
  "과한 걱정 / YAGNI / premature optimization을 솔직히 지적해줘"라고
  돌린다. 카운터웨이트는 각 finding을 (a) 출시 전 반드시 고침, (b) 같은
  변경에 끼워넣기 cheap, (c) 과한 걱정 → 무시, (d) 유효하지만 defer로
  분류해야 한다.
- **우선순위 투표도 카운터웨이트를 건다.** Follow-up promote 결정에서
  3-angle 투표만 보고 2/3 득표로 promote하면 "tidiness reflex" 아이템
  (category-confused docs-shuffle 등)이 실려 올 수 있다. 카운터웨이트
  한 번은 그런 consensus-by-accident를 잡아낸다.
- **스펙에 `Deliberately not doing` 섹션을 박는다.**
  결정을 기록할 때 채택한 것만이 아니라 **고려하고 기각한 대안 + 기각
  사유**도 같이 적는다. 6개월 뒤 재논의를 막고, 다음 세션이 "왜 이건
  안 했지?"를 바로 판단할 수 있다.
- **Iterative premortem.** 라운드 1 결과 일부 반영 → 거기서 생긴 **새
  결정**에 대해 라운드 2 다시.
- **Breaking change의 actionable error 계약.**
  스키마·서브커맨드 리네임 시 옛 경로는 `actionable error`로 새 경로를
  가리켜야 한다.
- **Catalog-level deprecation vs schema bump.** v1 surface 이름이
  archetype vocabulary를 leak 하면 schema bump 가 아니라 catalog-level
  deprecation (별칭 + silent 정규화) 이 default. 스키마 bump는 consumer
  migration 을 강제해야 할 실제 이유가 있을 때만.
- **Pre-deletion parity gate는 시맨틱 byte-identity로 읽는다.**
  `jq --sort-keys 'sort_by(.proposalKey)'` 후 byte 동일이면 gate 통과.
- **Standing gate 먼저, 슬라이스 나중.** 다수 파일 카스케이드를 수반하는
  슬라이스를 계획 중이면, 그 드리프트 클래스를 잡는 린터가 이미 있는지
  먼저 확인하고, 없으면 린터부터 올린다. 다음 세션의 A가 이 패턴.
- **Follow-up 번호는 스펙에서 삭제될 때 재넘버링한다.** gap을 남기지
  말고 삭제 + 재넘버링 + cross-ref 갱신을 한 커밋에 묶어라. 테스트
  코멘트와 `scenarios.go` 같은 다른 Go 파일의 "see follow-up N" 코멘트도
  같이 갱신.
- **Fixture 이름 컨벤션: canonical vs specialized.** 스펙과 README
  Scenarios 와 archetype-boundary 와 consumer-readiness 는 specialized
  (`chatbot-consumer-input.json`) 를 쓰고, current-product 와 `cautilus
  scenarios` 는 canonical (`chatbot-input.json`) 을 쓴다. 새 surface 가
  등장하면 이 분리 원칙을 따라야 한다.

## Premortem Hazards

- 가장 쉬운 오해: 아키타입 확장을 미리 많이 해두려는 욕심. 네 번째
  (예: `tool_use`, `pipeline`) 유혹이 와도 하지 말자.
  `archetype-boundary.spec.md`가 요구하는 대로, 새 아키타입은 schema +
  helper + CLI + contract + fixture + README + SKILL.md + scenarios.go
  catalog entry 를 한 슬라이스에 같이 가져올 때만 추가한다. 순서는
  스펙의 "Adding A New First-Class Archetype" 12-step walkthrough 를
  따른다.
- 프로토타입은 `internal/runtime/prototypes/`로 간다 (escape hatch).
  `cautilus.<name>_prototype.v0` 네이밍. 승격은 12-step walkthrough
  전부 돌고 프로토타입 copy 삭제.
- **다음 세션 A (inverse-completeness lint) 가 landing 전에 새 아키타입을
  추가하면 안 된다.** A 가 standing gate 로 먼저 올라야 그 이후 슬라이스가
  자동 검증된다.
- 다음 세션 E (relative links 재작성) 는 `scripts/release/sync-packaged-skill.mjs`
  변경을 수반할 수 있다 — `cpSync` 단순 복사에서 경로 rewriting 으로
  간다면 링크 린터의 derived-skip 도 같이 풀어야 한다. 두 변경을 한
  슬라이스에 묶고 premortem (문서 카스케이드 각도) 한 번 돌릴 것.
- **핸드오프 bookkeeping은 세션 말미에 한 번만.** 중간에 unpushed count 를
  매 커밋마다 업데이트하면 off-by-one 정정 마이크로 커밋이 쌓인다.
  슬라이스 전부 끝내고 푸시 직전에 한 번 정리하거나, 아예 push 까지
  세션 안에서 끝내는 것이 낫다 (이번 세션은 후자로 못 했고 사용자가
  직접 push).

## References

- [README.md](../README.md)
- [docs/master-plan.md](./master-plan.md)
- [docs/specs/archetype-boundary.spec.md](./specs/archetype-boundary.spec.md)
- [docs/specs/current-product.spec.md](./specs/current-product.spec.md)
- [docs/contracts/chatbot-normalization.md](./contracts/chatbot-normalization.md)
- [docs/contracts/skill-normalization.md](./contracts/skill-normalization.md)
- [docs/contracts/workflow-normalization.md](./contracts/workflow-normalization.md)
- [docs/contracts/behavior-intent.md](./contracts/behavior-intent.md)
- [docs/consumer-migration.md](./consumer-migration.md)
- [docs/evaluation-process.md](./evaluation-process.md)
- [docs/external-consumer-onboarding.md](./external-consumer-onboarding.md)
- [internal/runtime/proposals.go](../internal/runtime/proposals.go)
- [internal/runtime/proposals_test.go](../internal/runtime/proposals_test.go)
- [internal/runtime/scenarios.go](../internal/runtime/scenarios.go)
- [internal/runtime/intent.go](../internal/runtime/intent.go)
- [internal/runtime/prototypes/README.md](../internal/runtime/prototypes/README.md)
- [internal/app/examples.go](../internal/app/examples.go)
- [scripts/check-markdown-links.mjs](../scripts/check-markdown-links.mjs)
- [scripts/check-specs.mjs](../scripts/check-specs.mjs)
- [scripts/release/sync-packaged-skill.mjs](../scripts/release/sync-packaged-skill.mjs)
