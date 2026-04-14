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
- **패턴 발동은 사용자-요청 모델이다.** 이전 두 세션 모두 "자동으로
  적용" 지침이 있었지만 연속으로 실패했다 (실행-전 premortem 스킵).
  수동적 rule은 읽을수록 무뎌진다는 증거. 이후로는 premortem/카운터웨이트/
  iterative premortem 등은 **사용자가 명시적으로 요청할 때만 발동**한다.
  에이전트가 "필요하겠다" 고 판단해서 자발적으로 돌리지 않는다. 사용자가
  안 부르면 안 돈다. 다만 패턴 자체의 유용성은 유지되므로 문서는 남긴다.
- 시작 branch는 `main`이다. 이번 세션 끝에 누적됐던 24커밋 전부를
  `origin/main`에 푸시했다. 다음 세션 시작 시점에는 로컬과 origin이
  동일. Actions `verify.yml`이 푸시 시점에 돌았고 결과는 세션 마지막
  Last Verified 참조.
- product-owned seam이면 `cautilus`에서 먼저 고친다.

## Current State

- 마크다운 링크 드리프트가 이제 standing gate로 잡힌다.
  `npm run lint:links`(= `node scripts/check-markdown-links.mjs`)가
  체크인된 `.md` 81개 중 62개(정본)의 로컬/상대 링크를 검증하고,
  `plugins/cautilus/skills/` 19개는 `cpSync` 파생본이라 스킵한다.
  외부 URL(https/mailto/...)과 순수 앵커(`#...`)는 의도적으로 제외.
  `npm run verify`에 `lint:links`가 들어가 있어 pre-push + CI 자동 커버.
- narrative-adapter가 이제 `archetype-boundary.spec.md`를
  `source_documents`로 읽는다. 다음 narrative 런부터 README/SKILL.md/
  master-plan을 세 아키타입 계약과 맞춰 검사한다.
- workflow 아키타입이 canonical `workflow-input.json`을 갖는다. 기존
  `workflow-recovery-input.json`은 specialized 예제로 README Scenarios
  블록에만 남기고, command-registry/operator-acceptance/schema parity
  test/current-product Functional Check는 모두 canonical 이름을 쓴다.
- `cautilus scenario normalize {chatbot,skill,workflow}`와
  `cautilus skill evaluate`에 `--example-input` 플래그 추가. minimal
  packet을 stdout으로 찍고 exit 0. 방출된 packet은 `--input /dev/stdin`
  으로 파이프해도 같은 명령을 통과한다(round-trip 보장).
- `skills/cautilus/SKILL.md`가 intro와 Bootstrap 사이에 3-아키타입
  Scenarios 프리앰블을 갖는다. 각 블록은 CLI 진입, `--example-input`
  self-inspection 경로, 출력 스키마를 한 블록에 담는다.
- `archetype-boundary.spec.md` follow-up 4, 7, 9, 10번이 은퇴하고
  나머지 1-9로 리넘버됐다. `proposals_test.go`의 cross-ref도 같이
  따라붙었다.
- `cautilus --help`가 flat 34줄 대신 4개 purpose 그룹으로 나온다
  (`Run an evaluation scenario` / `Set up and check a repo` /
  `Turn results into next moves` / `Introspection`). registry.json은
  top-level `groups` 선언 + 커맨드별 `group`/`usage`/`example` inline 구조로
  바뀌었다. `cautilus commands --json` 페이로드는 기존 `usage`/`examples`
  배열을 그룹 순서로 derive해 유지하고 `groups`만 추가로 노출 (schema
  version `cautilus.commands.v1` 그대로).
- `cautilus adapter init`에 `--scenario <chatbot|skill|workflow>` 플래그
  추가. 선택한 아키타입에 맞는 command slot을 미리 채운다 — skill은
  `skill_test_command_templates` + `skill_cases_default`, chatbot/workflow는
  `iterate_command_templates`에 각 archetype의 `cautilus scenario normalize`
  호출을 꽂는다. `evaluation_surfaces`도 아키타입 한 줄로 좁힌다. 알 수 없는
  값은 actionable error (`use chatbot, skill, or workflow`)로 리젝트.
- archetype-boundary follow-up #2 (help grouping) + 새 follow-up #2
  (adapter init --scenario)가 이번 세션에 둘 다 은퇴했고, 나머지 follow-up은
  1-7로 리넘버됐다.

## Unpushed Commits

없음. 이번 세션 끝에 전부 `origin/main`으로 푸시 완료.

## Last Verified

- `npm run verify` (Go + Node all green; 22s) — 이번 세션 두 슬라이스 후
  재실행 확인
- `npm run lint:specs` (5 specs, guard rows)
- `npm run lint:links` (62 files checked, 19 derived skipped)
- `./bin/cautilus --help` — 4-group 출력 확인 (run/setup/results/introspection)
- `./bin/cautilus adapter init --repo-root <tmp> --scenario skill` — YAML
  출력에서 `skill_test_command_templates` 프리필 + `skill_cases_default`
  세팅 확인 (chatbot/workflow도 각각 `iterate_command_templates` 프리필)
- `./bin/cautilus scenario normalize {chatbot,skill,workflow} --example-input`
  모두 round-trip 통과 (이전 세션 유지)

## Next Session

1. `archetype-boundary.spec.md` follow-up 중 하나 골라 다음 슬라이스 진행
   (스펙에 1-7번으로 번호 매겨져 있음). 짧은/중간 슬라이스 후보:
   - 2 inline glossary 패스 (README)
   - 5 README section ordering (2와 페어)
   사이즈 큰 슬라이스:
   - 1 + 4 `cautilus scenarios` 커맨드 + doctor 힌트 (함께 — 4는 1에 의존)
   - 3 behavior-intent `workflow_conversation` 리네이밍 (스키마 bump 필요)
   - 7 Archetype-extension hardening (다음 4번째 아키타입 직전/함께)
2. **remaining quality gate 후보**: 지금 `npm run verify` 체인은
   eslint + specs + links + golangci + go vet + govulncheck + go test
   -race + node test. 충분히 두껍다. 추가 gate는 dogfood 증거가 요청할 때만.
3. `corca-ai/charness` 등록 이슈: #22 (narrative scenario block + inline
   glossary), #23 (quality flat-help + cross-archetype schema overlap),
   #24 (premortem 스킬 신설 + spec/quality 확장). 후속 댓글 필요할 때만.

## Consumer Migration (v0.3.x → v0.4.0)

하위호환 breaking 슬라이스는 **v0.4.0에서 끝났고**, 이번 세션도 내부
정리만 했다. 외부 consumer가 v0.4.0으로 올라왔다면 추가 조치는 없다.
참고만:

- `cautilus scenario normalize skill`에 `cli_workflow` 인풋 → actionable
  error로 `cautilus scenario normalize workflow` 안내
- `docs/workflow.md` → `docs/evaluation-process.md`
- Node `normalize-*-proposals.mjs` CLI를 직접 호출하던 곳이 있으면 모두
  `cautilus scenario normalize ...`로 바꿔야 한다 (이전 세션에 삭제됨).
- normalize/evaluate 진입을 문서 없이 시도하는 agent는 `--example-input`
  으로 방출된 최소 packet을 출발점으로 쓸 수 있다.

## Discuss

- 이번 세션 판단:
  - 링크 린터는 **정본(source-of-truth) 파일만** 검증하고 `plugins/`
    `cpSync` 파생본은 스킵하는 구조로 갔다. 파생본의 상대경로는
    구조적으로 정본과 다른 깊이에 있어서 둘 다 동시에 통과시키려면
    링크 리라이팅이 필요한데, 정본이 맞으면 실사용(`cautilus install`
    로 consumer에 풀어낸 경로)은 어차피 상대경로가 망가지므로
    투자 가치가 낮다고 판단.
  - `--example-input`은 fixture 파일을 embed하지 않고 Go 문자열로
    인라인했다. fixture보다 더 작은 minimal packet을 명시적으로
    유지하기 위해서였고, round-trip 테스트가 동기화를 지킨다.
  - 스펙 follow-up 번호는 매 슬라이스 삭제 후 재넘버링했다.
    `proposals_test.go`와 내부 cross-ref가 따라붙는 cost(매번 2-3줄)
    보다 gap-leaving의 가독성 손해가 더 컸다고 판단.
- **세션 말미 회고 프리모르템 (사용자 요청으로 돌림):**
  4 angle (document-cascade / blast-radius / external-callers /
  onboarding-readability) + 카운터웨이트 1. 24개 finding 중:
  - (a) must-fix 2건 적용: F1a `operator-acceptance.md` 3d 섹션 번호
    충돌 (3.12 중복) → 3d-3f 섹션 +1 리넘버. F4a handoff commit count
    불일치 (14 vs 13) → 15로 통일.
  - (b) cheap fold-in 1건 적용: F1b `--example-input` discoverability
    — README Scenarios intro + `current-product.spec.md` Functional
    Check에 각각 1줄 추가.
  - (c) drop 5건: F1d/F3a/F4c/F4d — 각 doc는 specialized fixture 컨벤션
    에 이미 internally consistent (standalone-surface/consumer-readiness/
    README Scenarios/archetype-boundary는 specialized를 쓰고,
    current-product만 canonical을 쓰는 것이 설계 의도). F3b는 promotion.
  - (d) defer 7건: 아래 `Deferred from retrospective` 참고.
  - 카운터웨이트의 솔직한 counterfactual: 5-슬라이스 클린업엔 4-angle
    프리모르템이 오버사이즈였고, 1-angle(document-cascade)로 충분했을
    것. 실질 수익은 F3d 하나뿐이었는데 F3d는 릴리스 사이클 concern이라
    결국 (d) defer. 다음에 이 규모 변경엔 1-angle로 충분.
- **Deferred from retrospective** (archetype-boundary 확장 아닌 별도 슬라이스
  후보; 필요 시점에 집어라):
  - F2b: `plugins/cautilus/skills/cautilus/references/*.md`가
    `claude plugins install` / codex marketplace 경로에서 깨진 상대
    링크로 풀림. 현재 link 린터는 이 디렉토리를 derived로 스킵.
    해결은 sync 스크립트가 경로를 재작성하거나 consumer-facing docs를
    link-free로 바꾸는 쪽. 중간 사이즈.
  - F2c: `internal/app/examples.go`의 예제 JSON이
    `fixtures/scenario-proposals/*-input.schema.json`으로 schema-validate
    되지 않음. round-trip은 parseable만 증명. 짧은 슬라이스.
  - F3c: `.github/workflows/release-artifacts.yml`이 옛 태그를
    현재 `package.json`로 재실행 시 `lint:links` 없음으로 깨질 수 있음.
    CI 히스토리 재실행 시나리오가 드물어 우선순위 낮음.
  - F3d: plugin manifests (`0.4.0`)가 SKILL.md 콘텐츠 변경을 반영하지
    않음. **릴리스 사이클 concern** — `release:prepare`가 version을
    bump하므로 다음 릴리스 시 자동 해결. 미푸시 상태에선 노출 없음.
  - F3e: `scripts/on-demand/smoke-external-consumer.mjs`가 `--example-input`
    이나 canonical `workflow-input.json`을 커버하지 않음. 온보딩 smoke
    가드 확대 슬라이스.
  - F4e: canonical `workflow-input.json` (47줄) vs specialized
    `workflow-recovery-input.json` (30줄). "canonical = minimal" 관습과
    반대. 설계 질문 — canonical을 더 단순화할지, 아니면 "canonical =
    full reference packet" 로 재정의할지. 같이 chatbot/skill canonical
    도 재검토 필요할 수 있음.
  - F4f: SKILL.md Scenarios §2에서 "Inspect shape: `scenario normalize
    skill --example-input`" 가 `skill test`/`skill evaluate` 입력 형상과
    다름 (다른 schema). 온보딩 혼동 가능. SKILL.md §2 rewording 슬라이스.
- 아직 열려 있는 질문:
  - `cautilus scenarios`가 `cautilus commands`와 어떻게 관계 맺을지
    (동일 registry 확장 vs 별도 리스트).
- 아직 의도적으로 안 하는 것:
  - 한국어 `README.ko.md` (영문 자체를 먼저 쉽게 만들기로 결정).
  - JSON 키 순서 통일 (raw byte-identity를 위한 코드 변경 — 정보 손실이
    없으므로 굳이 안 함).
  - Node shim for air-gapped consumers.
  - SKILL.md → docs/ upward 링크 (SKILL.md는 self-contained references
    관습을 따르고 있어 docs/ 쪽으로 링크하지 않는다).

## Working Patterns

지난 세션들에서 실제로 효과가 컸던 운영 패턴. **사용자가 요청할 때
발동한다** (자동 적용 모델은 두 세션 연속 실패 후 폐기, Workflow
Trigger 참고). 상세 논의와 다른 repo에 이식할 제안은
`corca-ai/charness#24`에 있다.

- **Premortem은 두 시점에 각각 돌린다: 결정 직전 + 실행 직전.**
  이 둘을 혼동하면 안 된다. 핸드오프에 "premortem 완료" 라고 적혀 있어도
  그건 **결정에 대한 커버리지**이고, 실제로 카스케이드·삭제·리네임 코드를
  칠 때는 **실행 각도로 다시** 돌려야 한다.
  - 결정 전 premortem 대상: 스펙 확정 직전, 브레이킹 체인지 직전,
    이중 구현을 한쪽으로 합치는 결정 직전 등. 관점: 스펙 드리프트,
    외부 사용자, devil's advocate, 예측 불가능한 결과.
  - 실행 전 premortem 대상: 삭제·리네임 슬라이스 코드를 치기 직전,
    다수 파일 카스케이드 직전, 문서 체인 편집 직전 등. 관점:
    **문서 카스케이드**(모든 편집 대상에서 포맷/링크/경로 일관성),
    **블라스트 반경**(빠뜨린 참조 파일), **외부 호출자**(삭제된 경로를
    부르는 스크립트·CI·docs), **가독성 드리프트**(같은 개념이 파일마다
    다르게 표기되는지).
  방법: 일반 general-purpose 에이전트 3-4개를 **명시적으로 다른 각도**로
  병렬 실행. 각 프롬프트는 self-contained 하게 — 이전 대화 맥락 없이도
  읽혀야 한다. 이미 follow-up에 잡힌 항목은 프롬프트에 "DO NOT report
  these"로 명시.
- **premortem 직후 카운터웨이트 1회.**
  여러 에이전트 결과가 쌓이면 **하나의 카운터웨이트 에이전트**에게
  "과한 걱정 / YAGNI / premature optimization을 솔직히 지적해줘"라고
  돌린다. 이 단계 없으면 paranoid backlog가 쌓이고 결정이 마비된다.
  카운터웨이트는 각 finding을 (a) 출시 전 반드시 고침, (b) 같은
  변경에 끼워넣기 cheap, (c) 과한 걱정 → 무시, (d) 유효하지만 defer로
  분류해야 한다.
- **스펙에 `Deliberately not doing` 섹션을 박는다.**
  결정을 기록할 때 채택한 것만이 아니라 **고려하고 기각한 대안 + 기각
  사유**도 같이 적는다. 6개월 뒤 재논의를 막고, 다음 세션이 "왜 이건
  안 했지?"를 바로 판단할 수 있다.
- **Iterative premortem.**
  한 번에 끝내려 하지 말 것. 라운드 1 결과 일부 반영 → 거기서 생긴 **새
  결정**에 대해 라운드 2 다시.
- **Breaking change의 actionable error 계약.**
  스키마·서브커맨드 리네임 시 옛 경로는 `actionable error`로 새 경로를
  가리켜야 한다. `cautilus scenario normalize skill`이 workflow 인풋을
  받았을 때 `...use cautilus scenario normalize workflow instead.`로
  답하는 것이 표준.
- **Pre-deletion parity gate는 시맨틱 byte-identity로 읽는다.**
  이중 구현 제거 전에 "byte-identical output" 같은 게이트가 걸려 있어도
  실제 운영 기준은 `jq --sort-keys 'sort_by(.proposalKey)'` 후 byte
  동일이다. Raw byte 수준에서 남은 차이(JSON 키 순서 등)가 정보 손실이
  없으면 게이트 통과로 판단하고 rationale을 커밋/핸드오프에 명시한다.
- **Standing gate 먼저, 슬라이스 나중.**
  이번 세션 #1 슬라이스(링크 린터)가 그 예시. standing gate를 먼저
  올리면 이후 같은 세션의 다른 슬라이스가 자동 검증된다. 다수 파일
  카스케이드를 수반하는 슬라이스를 계획 중이면, 그 드리프트 클래스를
  잡는 린터가 이미 있는지 먼저 확인하고, 없으면 린터부터 올린다.
- **Follow-up 번호는 스펙에서 삭제될 때 재넘버링한다.**
  gap을 남기면 cross-ref가 "왜 #7이 없지?"로 깨져 보이고, 다음 세션이
  작업 전에 스펙을 읽을 때 불필요한 확인 비용이 붙는다. 삭제 + 재넘버링
  + cross-ref 갱신(테스트 코멘트, 스펙 내부 ref)을 한 커밋에 묶어라.

## Premortem Hazards

- 가장 쉬운 오해: 아키타입 확장을 미리 많이 해두려는 욕심. 네 번째
  (예: `tool_use`, `pipeline`) 유혹이 와도 하지 말자.
  `archetype-boundary.spec.md`가 요구하는 대로, 새 아키타입은 schema +
  helper + CLI + contract + fixture + README 블록을 한 슬라이스에 같이
  가져올 때만 추가한다. 그때는 follow-up 7 (Archetype-extension
  hardening)을 먼저 또는 함께 집는다.
- 3개 follow-up을 한 슬라이스에 묶으려는 유혹도 피할 것. 특히 follow-up
  3 (behavior-intent 리네이밍)은 `cautilus.behavior_intent.v1` 스키마
  bump를 수반하므로 독립 슬라이스여야 한다.
- **핸드오프 bookkeeping은 커밋 끝에 한 번만.** 지난 세션에서 unpushed
  count가 매 커밋마다 +1 되면서 off-by-one 정정용 마이크로 커밋이
  세 번 쌓였다. 슬라이스가 끝나고 푸시 직전에 한 번 정리하거나, 아예
  푸시를 이 세션 안에서 같이 끝내면 count 자체가 사라진다.

## References

- [README.md](../README.md)
- [docs/master-plan.md](./master-plan.md)
- [docs/specs/archetype-boundary.spec.md](./specs/archetype-boundary.spec.md)
- [docs/specs/current-product.spec.md](./specs/current-product.spec.md)
- [docs/contracts/chatbot-normalization.md](./contracts/chatbot-normalization.md)
- [docs/contracts/skill-normalization.md](./contracts/skill-normalization.md)
- [docs/contracts/workflow-normalization.md](./contracts/workflow-normalization.md)
- [docs/evaluation-process.md](./evaluation-process.md)
- [internal/runtime/proposals.go](../internal/runtime/proposals.go)
- [internal/runtime/proposals_test.go](../internal/runtime/proposals_test.go)
- [internal/app/examples.go](../internal/app/examples.go)
- [scripts/check-markdown-links.mjs](../scripts/check-markdown-links.mjs)
