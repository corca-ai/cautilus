# Working Patterns

누적된 Cautilus 운영·설계 패턴 모음.
핸드오프 ([handoff.md](./handoff.md)) 는 "다음 한 수" 에 집중하고, 이 문서는 세션을 넘어 유지되는 durable 운영 원칙·함정 목록을 담는다.

## 발동 모델

패턴 발동은 **사용자-요청 모델**이다.
premortem / 카운터웨이트 / iterative premortem 등은 사용자가 명시적으로 요청할 때만 발동한다.
에이전트가 "필요하겠다" 고 판단해서 자발적으로 돌리지 않는다.
(자동 적용 모델은 두 세션 연속 실패 후 폐기.)

## Premortem 및 카운터웨이트 원칙

- **두 시점에 각각 돌린다: 결정 직전 + 실행 직전.**
  핸드오프에 "premortem 완료" 라고 적혀 있어도 그건 **결정에 대한 커버리지** 이고, 실제로 카스케이드·삭제·리네임 코드를 칠 때는 **실행 각도로 다시** 돌려야 한다.
  실행 후 premortem 도 유효함.
- **Angle 수는 슬라이스 규모에 맞춘다.**
  단일 슬라이스 = 1각, 2–3 슬라이스 = 2각, 스펙 리네임·스키마 bump·다수 파일 카스케이드 = 3–4각.
- **premortem 직후 카운터웨이트 1회.**
  여러 에이전트 결과가 쌓이면 **하나의 카운터웨이트 에이전트** 에게 "과한 걱정 / YAGNI / premature optimization 을 솔직히 지적해줘" 를 돌린다.
  카운터웨이트는 각 finding 을 (a) 출시 전 반드시 고침, (b) 같은 변경에 끼워넣기 cheap, (c) 과한 걱정 → 무시, (d) 유효하지만 defer 로 분류한다.
  **1각 결과가 작으면 카운터웨이트 skip**.
- **Premortem 의 한 agent 가 devil's-advocate 역할을 제대로 하면 별도 카운터웨이트 agent 를 생략 가능.**
  단 그 agent 의 핵심 주장은 repo 에서 직접 검증해야 한다 (grep + read 로 confirm; 검증 없이 그대로 받는 건 위험).
- **우선순위 투표도 카운터웨이트를 건다.**
  Follow-up promote 결정에서 3-angle 투표만 보고 2/3 득표로 promote 하면 "tidiness reflex" 아이템이 실려 올 수 있다.
  카운터웨이트 한 번은 그런 consensus-by-accident 를 잡아낸다.
- **Iterative premortem.**
  라운드 1 결과 일부 반영 → 거기서 생긴 **새 결정** 에 대해 라운드 2 다시.

## 결정 기록 원칙

- **스펙에 `Deliberately not doing` 섹션을 박는다.**
  결정을 기록할 때 채택한 것만이 아니라 **고려하고 기각한 대안 + 기각 사유** 도 같이 적는다.
  6개월 뒤 재논의를 막고, 다음 세션이 "왜 이건 안 했지?" 를 바로 판단할 수 있다.
- **Deferred slice 도 같은 원리로 박는다.**
  premortem 후 defer 로 결정된 큰 slice 는 해당 contract 문서에 "Deferred Expansion" 섹션으로 **scope + why + trigger + must-fix 분류** 를 남긴다.
  다음 세션이 4각 premortem 재실행 없이 바로 판단할 수 있다.
- **Follow-up 번호는 스펙에서 삭제될 때 재넘버링한다.**
  gap 을 남기지 말고 삭제 + 재넘버링 + cross-ref 갱신을 한 커밋에.

## Breaking Change 및 마이그레이션

- **Breaking change 의 actionable error 계약.**
  스키마·서브커맨드 리네임 시 옛 경로는 `actionable error` 로 새 경로를 가리켜야 한다.
- **Catalog-level deprecation vs schema bump.**
  v1 surface 이름이 archetype vocabulary 를 leak 하면 schema bump 가 아니라 catalog-level deprecation (별칭 + silent 정규화) 이 default.
  스키마 bump 는 consumer migration 을 강제해야 할 실제 이유가 있을 때만.
- **Pre-deletion parity gate 는 시맨틱 byte-identity 로 읽는다.**
  `jq --sort-keys 'sort_by(.proposalKey)'` 후 byte 동일이면 gate 통과.
  **Parity test 가 true byte-identity 를 요구하는데 슬라이스가 의도적으로 source→dest 변환을 도입하면, parity test 를 "변환 후 비교" 로 재정의**.

## Standing Gate 순서

- **Standing gate 먼저, 슬라이스 나중.**
  다수 파일 카스케이드를 수반하는 슬라이스를 계획 중이면 린터부터.
- **Standing gate 가 landed 되면 escape hatch 를 재평가.**
  임시로 남겨둔 enforcement escape (`Must*` 헬퍼 등) 는 gate 가 들어온 뒤 삭제 가능한지 확인.

## Fixture 및 Copy 컨벤션

- **Fixture 이름 컨벤션: canonical / minimal / specialized.**
  canonical=`<archetype>-input.json` (realistic, full), minimal=`--example-input` stdout (schema 최소), specialized=`samples/` 하위 (consumer narrative).
  Starter kit `input.json` 은 canonical 의 drift-tested copy 이며 새 역할 아님.
- **Copy + drift test 패턴.**
  의도된 파일 중복 (starter/<X>/input.json ↔ canonical fixture) 은 drift test 로 byte-identity 를 강제하는 기존 standing pattern (sync-packaged-skill + distribution-surface test) 을 따른다.
  추상화 재발명 금지.

## 외부 의존성 및 문서 이동

- **External dependency 추가 전에 기존 관행 먼저 확인.**
  Ajv 추가 대신 Node 측 minimal validator 패턴을 Go 로 포팅하거나, 새 smoke 스크립트 만들지 않고 기존 `run-install-smoke.mjs` 의 채널 재사용.
- **문서를 옮기면 그걸 assert 하는 gate 도 같이 옮긴다.**
  예: SKILL.md core → `references/*.md` 이동 때 spec guard rows, Go smoke test 의 문자열 assert, packaged 트리 sync 세 군데가 이동을 따라가야 verify 통과.
  이동 전에 grep 으로 해당 경로를 assert 하는 곳을 전부 찾아 같은 슬라이스 안에서 재지정.

## Go / JS 경계

- **기본 원칙: `Go` 는 shipped product surface, `JS` 는 bounded helper/runtime seam.**
  이 repo 는 `standalone binary plus bundled skill` 을 제품 표면으로 약속한다.
  따라서 operator 가 `cautilus ...` 로 직접 기대하게 되는 안정 명령, release artifact 가 "공식 지원" 한다고 말할 표면, 장기적으로 에러 계약을 강하게 고정할 표면은 `Go CLI` 로 끌어올리는 쪽이 기본이다.
  반대로 host repo adapter 와 consumer-owned command 사이를 잇는 thin orchestration, packet assembly/validation helper, direct script usage 로도 충분한 bounded runtime seam 은 우선 `scripts/` 또는 `scripts/agent-runtime/` 에 둔다.
- **"지금 당장 Go 로 안 가는" 첫 기준은 surface stability 이다.**
  contract shape, placeholder set, adapter indirection 이 아직 바뀔 가능성이 크면 `Go` 승격을 서두르지 않는다.
  이 단계에서 `Go` 로 올리면 binary UX, docs, smoke, CLI help, registry surface 까지 같이 고정하게 되어 iteration cost 가 커진다.
- **둘째 기준은 ownership cut 이다.**
  `Go` 로 올릴 표면은 product-owned behavior 가 명확해야 한다.
  consumer-owned actual probe/launch/auth/runtime wiring 위에 얇게 얹는 helper 는 먼저 `JS` 에 두고, product 가 정확히 무엇을 책임질지 굳은 뒤 승격한다.
- **셋째 기준은 operator expectation 이다.**
  operator 가 이 기능을 `cautilus commands` 나 CLI reference 에서 찾아 쓰는 것이 자연스러운 상태가 되면 `Go` 로 승격할 압력이 생긴다.
  반대로 wrapper tool, self-dogfood script, adapter-owned flow 가 직접 `node scripts/...` 로 호출해도 괜찮은 seam 이면 아직 `JS` 에 머물 수 있다.
- **넷째 기준은 binary promise cost 이다.**
  `Go` 로 승격하는 순간 그 seam 은 standalone binary release, install surface, 장기 backward compatibility 기대를 같이 짊어진다.
  그 비용을 치를 만큼 benefit 이 아직 없으면 `JS` helper 로 남기는 편이 맞다.

### Workbench Seams 에 적용

- **`discover-workbench-instances` 는 지금 `JS` 가 맞다.**
  현재 helper 가 product-owned 로 고정한 것은 `explicit` stanza normalization 뿐이다.
  `kind: command` discovery 는 여전히 consumer-owned probe command 에 의존하므로, 전체 discovery surface 가 `Go` 에서 stable 하다고 보기 이르다.
- **`run-live-instance-scenario` 도 지금은 `JS` 가 맞다.**
  방금 추가한 helper 는 request/result packet 검증과 consumer command dispatch 만 담당한다.
  실제 실행은 여전히 adapter 의 `consumer_command_template` 뒤에 있고, 이 indirection 자체가 막 고정된 seam 이다.
- **즉 "Go 로 못 간다" 가 아니라 "지금 승격 cost 를 낼 만큼 product-owned behavior 가 아직 충분히 응고되지 않았다" 가 정확한 표현이다.**
  현재 단계에서 `Go` 로 올리면 thin wrapper 이상의 사용자 가치보다 surface-freeze cost 가 더 크다.

### Go 승격 Trigger

- adapter indirection (`consumer_command_template` 등) 이 두세 세션 이상 안정적으로 유지된다.
- operator-facing CLI entrypoint 가 실제로 필요해진다.
- direct script usage 가 아니라 `cautilus <subcommand>` 로 문서화하는 편이 더 자연스럽다.
- binary-level smoke / help text / command discovery 에 포함시킬 가치가 생긴다.
- helper 가 더 이상 consumer experiment seam 이 아니라 shipped product capability 로 취급된다.

## 핸드오프 Bookkeeping

- **핸드오프 bookkeeping 은 세션 말미에 한 번만.**
  매 커밋마다 unpushed count 를 업데이트하면 off-by-one 정정 마이크로 커밋이 쌓인다.
  슬라이스 전부 끝내고 푸시 직전 한 번 정리하거나, 아예 push 까지 세션 안에서 끝내는 것이 낫다.

## Premortem Hazards

항상 의식해야 하는 함정들.

- **아키타입 확장 욕심**.
  네 번째 (`tool_use`, `pipeline` 등) 유혹이 와도 추가하지 말 것.
  `archetype-boundary.spec.md` 가 요구하는 대로, 새 아키타입은 schema + helper + CLI + contract + fixture + README + SKILL.md + scenarios.go + starter kit 까지 한 슬라이스에 같이 가져올 때만.
  순서는 스펙의 "Adding A New First-Class Archetype" 12-step walkthrough.
  `npm run lint:archetypes` 가 이 완결성을 자동 검증 (starter kit 은 optional).
- **프로토타입 격리**.
  프로토타입은 `internal/runtime/prototypes/` 로 간다 (escape hatch).
  `cautilus.<name>_prototype.v0` 네이밍.
- **`sync-packaged-skill.mjs` 가 upward 링크를 rewriting 한다.**
  packaged 트리의 `.md` 파일 내용이 source 와 byte-identical 이 아니다.
  새 consumer-facing docs 를 `skills/cautilus/references/` 아래 추가할 때 upward 링크를 쓰면 rewriter 가 packaged 복사본에서 자동으로 2 level 더 깊게 rewrite.
  **Link text 에 경로를 쓰지 말 것** — 그러면 packaged 에서 text/target mismatch.
  filename-label 또는 human-label.
- **Starter kit fixture drift.**
  `examples/starters/<archetype>/input.json` 은 `fixtures/scenario-proposals/<archetype>-input.json` 의 byte-identical copy.
  한 쪽만 편집하면 `scripts/starter-kit-parity.test.mjs` 실패.
  같이 갱신하거나 `cp` 로 재복사.

## Narrative / Spec 작성 시 Self-Premortem

2026-04-15~16 세션에서 확립.
랜딩 surface 재작성·seed spec 작성 직후 commit 전에 자체 검토 1회.
3 체크 질문:

1. 같은 문서 내 두 섹션이 서로 모순되는 요구를 주장하는가? (예: universal requirement 와 expansion order 가 같은 요구를 반대로)
2. 각 claim 에 scope (무엇을 만족해야 하나) 가 명시되어 있고 implementation (어떻게 만족할지) 은 일부러 비어 있는가? ("don't prescribe impl" 이 "don't prescribe scope" 로 혼동되기 쉬움)
3. 참조한 예시·fixture·경로가 canonical source 와 일치하는가? 여러 기존 문서에서 섞어오지 않았는가?

세 질문을 통과 못 하면 commit 전에 수정.
이 pattern 은 charness narrative skill 개선 이슈 (#26) 에도 반영 제안됨.
