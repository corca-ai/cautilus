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
- 시작 branch는 `main`이다. 이번 세션 끝에 4커밋이 로컬에 쌓여 있고
  **사용자가 push 여부를 결정**. 다음 세션 시점에 `origin/main`이
  로컬과 동일한지 `git fetch && git log origin/main..HEAD` 로 먼저 확인.
- product-owned seam이면 `cautilus`에서 먼저 고친다.

## Current State

지난 세션 끝 Top 3 (F, A, E) 전부 소화 + premortem fold-in 1건. 총 4커밋.

- **F — examples.go schema validation.** `internal/app/examples.go`의
  네 `--example-input` 상수 (`chatbotExampleInput`, `skillNormalizeExampleInput`,
  `workflowExampleInput`, `skillEvaluateExampleInput`)가 published
  `fixtures/.../*.schema.json`에 대해 schema-validate된다. Go test
  [internal/app/examples_schema_test.go](../internal/app/examples_schema_test.go)
  가 minimal validator를 포함 (Ajv 의존성 추가 없이 Node측 helper 포팅).
- **A — archetype inverse-completeness lint.** `npm run lint:archetypes`
  가 `docs/specs/archetype-boundary.spec.md`의 각 `###` archetype 섹션에
  대해 11개 surface 존재를 검증. Source Guard (존재 증명) + inverse
  (각 archetype이 full set을 가지는지)의 양방향 gate. 스크립트:
  [scripts/check-archetype-completeness.mjs](../scripts/check-archetype-completeness.mjs).
  `lint` chain에 편입. spec의 Follow-up Work 섹션 (follow-up 1) 삭제
  + 윗 문단을 새 lint 설명으로 재작성.
- **E — packaged-skill relative links.** `scripts/release/sync-packaged-skill.mjs`
  가 cpSync 후 packaged 트리의 `.md` 파일에서 upward relative markdown
  링크 앞에 `../../`를 prepend (source 3-deep → packaged 5-deep).
  `rewriteUpwardLinks` export됨. `scripts/check-markdown-links.mjs`의
  `DERIVED_PATH_PREFIXES` 우회 제거 — 82개 파일 전부 검증 (skip 없음).
  parity test (`distribution-surface.test.mjs`)는 rewriter 통과 후 비교로
  재정의. Source Guard의 DERIVED row 삭제.
- **Premortem fold-in (E).** 1각 (문서 카스케이드) premortem 결과:
  (1) `docs/releasing.md`가 sync를 cpSync-only로 기술 → rewriting 계약
  한 줄 추가. (2) `skills/cautilus/references/active-run.md`의 Source
  References가 경로를 visible text로 사용 → rewriter가 target만 수정하여
  packaged에서 text/target mismatch. 경로-라벨을 filename-라벨로 교체.

## Unpushed Commits

사용자가 push 여부 결정. 4커밋:

```
8ce124a Apply E-slice premortem fold-in: rewriting doc + link text
3e3e648 Close the packaged-skill relative-link loophole
65780f7 Land archetype inverse-completeness lint as a standing gate
5e61c41 Lock example-input packets to published schemas
```

## Last Verified

- `npm run verify` (Go + Node all green; ~40s)
- `npm run lint:specs` (5 specs, 588 guard rows)
- `npm run lint:archetypes` (3 archetypes × 11 surface check)
- `npm run lint:links` (82 files checked, **derived skip 없음**)
- `go test ./internal/app/ -run TestExampleInputConstants...` 통과
- `node scripts/release/sync-packaged-skill.mjs .` round-trip 통과
  (재실행 시에도 idempotent — rewriter가 이미 rewrite된 경로를 이중
  rewriting 하지 않는지는 premortem 범위 밖이었음, 다음 세션에서 검토
  할 수도)

## Next Session

이번 세션은 지난 핸드오프의 Top 3을 전부 소화했다. 다음 우선순위 투표가
아직 없다 — 사용자가 방향을 지정하거나, 3-angle 우선순위 투표를 요청할
수 있다.

지난 핸드오프의 **Honorable mention** (아직 promote되지 않음):

1. **K — `skills/cautilus/SKILL.md` §2 wording.** `skill test` vs
   `skill evaluate` 스키마 혼동 문구 재작성. drive-by 작업. 한 슬라이스.
2. **C — `plugins/` 미러 equality guard.** 현재 parity test가 rewriter
   통과 후 비교로 업그레이드 됐지만, rewriter의 idempotency (2회 실행
   시 `../../../../` → `../../../../../../`로 이중 rewriting 되지
   않는지) 는 아직 테스트 되지 않음. cpSync 우회 리스크가 현실화되면
   추가.
3. **N — `MustBehaviorSurface` 삭제 또는 call-site refactor.** 이전
   세션에서 만들었지만 호출자 0. 드라이브-바이 후보.

**새로 관찰된 작은 것들** (다음 세션이 의사결정):

- **Rewriter idempotency test.** `sync-packaged-skill.mjs`를 연속 2회
  실행하면 2회차에선 rewrite된 경로 (`../../../../../`) 가 다시 매칭
  되어 `../../../../../../../` 같이 이중 rewriting될 가능성. 현재는
  `rm -rf` 후 `cpSync`로 매번 원본에서 복사하므로 실제로는 문제 없음.
  하지만 idempotency 테스트가 방어적으로 한 줄 추가될 가능성.
- **`internal/app/examples_schema_test.go`의 minimal validator.**
  Go 쪽 JSON Schema validator. 현재 subset 범위 (object/array/string/
  integer/number/boolean + required/const/enum/minimum)만 커버.
  `additionalProperties`, `oneOf/anyOf`, `patternProperties` 등은 미커버.
  현재 schema 파일들이 이 subset으로만 작성되어 있으므로 OK. 새 schema
  기능을 추가하면 validator도 확장.

**영구 drop (이전 세션과 동일):**

- D (category-confused docs-shuffle), B (prototype lifetime enforcement),
  M (stderr deprecation warning), I (smoke-external-consumer
  `--example-input`), H, G, J, L.

## Consumer Migration (v0.4.x)

v0.4.x 내에서 breaking change는 없다. 이번 세션의 외부 영향:

- `cautilus scenario normalize {chatbot,skill,workflow} --example-input`
  및 `cautilus skill evaluate --example-input`가 내보내는 packet이
  이제 published schema에 대해 Go test로 validate 된다 (behavior 변화
  없음, guard만 강화).
- packaged `plugins/cautilus/skills/cautilus/references/` 하위 `.md`
  파일의 upward relative 링크가 `../../../` → `../../../../../`로
  rewriting된다. 이 트리를 copy해서 사용하는 consumer는 링크가 이제
  packaged 위치에서 올바르게 resolve된다 (이전에는 broken).
- `npm run lint:archetypes` 신규 gate (additive).

## Discuss

- 이번 세션 판단:
  - F를 Ajv 추가 대신 Go-native minimal validator로 처리. Node측에
    이미 같은 subset validator 관행 있었음 (`scenario-proposal-schemas.test.mjs`).
    의존성 추가 < 60줄 포팅.
  - A에서 11 surface 중 chatbot은 `assert<Archetype>TargetKind`가
    구조적으로 필요 없다 (input shape에 targetKind 없음). spec Invariants
    와 정합. `ASSERTION_REQUIRED` set으로 skill+workflow만 강제.
  - A linter의 complexity가 eslint 제한 (12) 초과 → 11개 check를
    각 helper 함수로 분할 + `ARCHETYPE_CHECKS` 배열로 dispatch. 각
    체크가 single-responsibility, 평가 완료.
  - E에서 (a) sync rewriting vs (b) link-free 재작성 중 (a) 선택 이유:
    source 파일의 개발자 UX 유지 + packaged에서도 legible.
    byte-identity parity test가 깨지는 것은 test 재정의로 해결 (source
    에 rewriter 적용 후 비교).
  - E premortem을 실행 **후**에 돌렸음 (사용자 명시 요청). 1각 (문서
    카스케이드) 만으로 2 finding 발견. 둘 다 (b) cheap fold-in으로
    반영. Working Patterns는 "실행 전"을 원칙으로 명시하지만, 이번은
    사용자 요청이 우선. 실제로 효과 있었음 (releasing.md 문구 + link
    text mismatch 둘 다 drift 방지).

- **Deferred from retrospective** (이번 세션 + 이전 세션 defer 합산):
  - F4e: canonical `workflow-input.json` (47줄) vs specialized
    `workflow-recovery-input.json` (30줄) — 이전 세션 drop, 설계 질문
    미해결 (canonical=minimal vs canonical=full reference).
  - F4f (SKILL.md §2 wording) → Honorable (K).
  - F3c: `release-artifacts.yml` old-tag 재실행 시 `lint:links` 부재로
    깨질 수 있음 — 재실행 시나리오가 드물어 우선순위 낮음.
  - F3d: plugin manifest `0.4.0` lag — `release:prepare`가 auto-fix.

- 아직 열려 있는 질문:
  - `cautilus scenarios`가 `cautilus commands`와 어떻게 관계 맺을지
    (동일 registry 확장 vs 별도 리스트). 현재는 별도 payload.
  - canonical=minimal vs canonical=full 정의 (F4e 연장).
  - `sync-packaged-skill.mjs` rewriter의 idempotency test 필요 여부
    (현재는 `rm -rf` + cpSync가 매번 원본 복사 → 실질 문제 없음).

- 아직 의도적으로 안 하는 것:
  - 한국어 `README.ko.md`.
  - JSON 키 순서 통일.
  - Node shim for air-gapped consumers.
  - SKILL.md → docs/ upward 링크 (SKILL.md self-contained 관습).
  - `cautilus.behavior_intent` 스키마 bump (v1 유지 + 별칭 충분).
  - 위 drop 리스트 (D, B, M, I, H, G, J, L) — 이전 세션 참고.

## Working Patterns

지난 세션들에서 실제로 효과가 컸던 운영 패턴. **사용자가 요청할 때
발동한다** (자동 적용 모델은 두 세션 연속 실패 후 폐기, Workflow
Trigger 참고).

- **Premortem은 두 시점에 각각 돌린다: 결정 직전 + 실행 직전.**
  이 둘을 혼동하면 안 된다. 핸드오프에 "premortem 완료"라고 적혀 있어도
  그건 **결정에 대한 커버리지**이고, 실제로 카스케이드·삭제·리네임 코드를
  칠 때는 **실행 각도로 다시** 돌려야 한다. **실행 후 premortem도
  유효함** — 이번 세션 E에서 fold-in 2건 실제로 잡음.
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
- **Angle 수는 슬라이스 규모에 맞춘다.** 5-slice 클린업에서 4-angle
  은 oversize 였음. 규모별 기준: 단일 슬라이스 = 1각, 2-3 슬라이스 =
  2각, 스펙 리네임·스키마 bump·다수 파일 카스케이드 = 3-4각.
  이번 세션 E (sync 스크립트 + linter skip 제거 + spec row 삭제 +
  parity test 재정의) 는 4-surface 변경이었지만 1각으로 충분했음
  (문서 카스케이드 각도가 가장 취약한 지점).
- **premortem 직후 카운터웨이트 1회.**
  여러 에이전트 결과가 쌓이면 **하나의 카운터웨이트 에이전트**에게
  "과한 걱정 / YAGNI / premature optimization을 솔직히 지적해줘"라고
  돌린다. 카운터웨이트는 각 finding을 (a) 출시 전 반드시 고침, (b) 같은
  변경에 끼워넣기 cheap, (c) 과한 걱정 → 무시, (d) 유효하지만 defer로
  분류해야 한다. **1각 결과가 작으면 카운터웨이트 skip** — 이번 세션
  E가 그 예 (2 finding, 둘 다 명백히 (b)).
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
  **Parity test가 true byte-identity를 요구하는데 슬라이스가 의도적으로
  source→dest 변환을 도입하면, parity test를 "변환 후 비교"로 재정의
  한다** — 이번 세션 E `distribution-surface.test.mjs` 가 예.
- **Standing gate 먼저, 슬라이스 나중.** 다수 파일 카스케이드를 수반하는
  슬라이스를 계획 중이면, 그 드리프트 클래스를 잡는 린터가 이미 있는지
  먼저 확인하고, 없으면 린터부터 올린다. 이번 세션 A가 이 패턴 — 새
  아키타입 추가 전에 inverse-completeness lint 먼저 landed.
- **Follow-up 번호는 스펙에서 삭제될 때 재넘버링한다.** gap을 남기지
  말고 삭제 + 재넘버링 + cross-ref 갱신을 한 커밋에 묶어라. 테스트
  코멘트와 `scenarios.go` 같은 다른 Go 파일의 "see follow-up N" 코멘트도
  같이 갱신.
- **Fixture 이름 컨벤션: canonical vs specialized.** 스펙과 README
  Scenarios 와 archetype-boundary 와 consumer-readiness 는 specialized
  (`chatbot-consumer-input.json`) 를 쓰고, current-product 와 `cautilus
  scenarios` 는 canonical (`chatbot-input.json`) 을 쓴다. 새 surface 가
  등장하면 이 분리 원칙을 따라야 한다.
- **External dependency 추가 전에 기존 관행 먼저 확인.** 이번 세션 F
  에서 Ajv 추가 대신 Node 측 이미 있던 minimal validator 패턴을 Go로
  포팅 (60줄). 기존 관행 재사용이 의존성 확장보다 우선.

## Premortem Hazards

- 가장 쉬운 오해: 아키타입 확장을 미리 많이 해두려는 욕심. 네 번째
  (예: `tool_use`, `pipeline`) 유혹이 와도 하지 말자.
  `archetype-boundary.spec.md`가 요구하는 대로, 새 아키타입은 schema +
  helper + CLI + contract + fixture + README + SKILL.md + scenarios.go
  catalog entry 를 한 슬라이스에 같이 가져올 때만 추가한다. 순서는
  스펙의 "Adding A New First-Class Archetype" 12-step walkthrough 를
  따른다. 이제 `npm run lint:archetypes` 가 이 완결성을 자동 검증한다.
- 프로토타입은 `internal/runtime/prototypes/`로 간다 (escape hatch).
  `cautilus.<name>_prototype.v0` 네이밍. 승격은 12-step walkthrough
  전부 돌고 프로토타입 copy 삭제.
- **`sync-packaged-skill.mjs`가 이제 upward 링크를 rewriting 한다.**
  packaged 트리의 `.md` 파일 내용이 source와 byte-identical이 아니다.
  새 consumer-facing docs를 `skills/cautilus/references/` 아래 추가할
  때 upward 링크를 쓰면 rewriter가 packaged 복사본에서 자동으로 2
  level 더 깊게 rewrite한다. **Link text에 경로를 쓰지 말 것** — 그러면
  packaged에서 text/target mismatch (이번 세션 E premortem fold-in 참고).
  filename-label 또는 human-label 을 쓴다.
- **핸드오프 bookkeeping은 세션 말미에 한 번만.** 중간에 unpushed count 를
  매 커밋마다 업데이트하면 off-by-one 정정 마이크로 커밋이 쌓인다.
  슬라이스 전부 끝내고 푸시 직전에 한 번 정리하거나, 아예 push 까지
  세션 안에서 끝내는 것이 낫다.

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
- [docs/releasing.md](./releasing.md)
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
