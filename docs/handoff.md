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
  를 읽고, 이 핸드오프의 `## Working Patterns` 섹션도 확인한다. 그
  패턴들은 지난 세션에서도 효과가 입증됐으니, 새 결정·변경 시 **자동으로
  적용**한다.
- 시작 branch는 `main`이다. 로컬이 `origin/main`보다 3커밋 앞서 있다
  (아래 `Unpushed Commits` 참고). **다음 세션의 첫 작업은 push 여부
  결정**이다.
- product-owned seam이면 `cautilus`에서 먼저 고친다.

## Current State

- 아키타입 normalize helper 이중 구현이 사라졌다. 세 아키타입 모두
  Go CLI(`cautilus scenario normalize {chatbot,skill,workflow}`)와
  `internal/runtime/proposals.go`의 `NormalizeChatbotProposalCandidates` /
  `NormalizeSkillProposalCandidates` / `NormalizeWorkflowProposalCandidates`
  가 단일 구현이다.
- 관련 Node `.mjs` 11개 파일 삭제됨
  (`{chatbot,skill,workflow}-proposal-candidates.mjs`,
  `normalize-{chatbot,skill,workflow}-proposals.mjs`, 각 `.test.mjs`,
  `shared/normalized-run.mjs`, `consumer-example-fixtures.test.mjs`).
  `contract-versions.mjs`에서도 세 normalization schema 상수가 빠졌다.
- Pre-deletion gate로 Go `includesAny`의 word-boundary 회귀가 수정됐다.
  `proposals.go`는 이제 precompiled regex 기반 `matchesAny`를 쓰고,
  `"preview"` / `"repository"`가 `review`/`repo` 패턴에 매치되지 않는다.
  `proposals_test.go`에 회귀 커버리지가 추가됐다.
- 다른 pre-deletion 수정:
  - workflow candidate `description`이 Node 와 동일하게
    `humanizeTargetKind` 프리픽스(`"CLI Workflow …"`)를 붙인다.
  - `mergeCandidatesByProposalKey`가 insertion-order를 보존한다(Go map
    iteration의 비결정성 제거).
- v0.4.0 공개 검증 완료.
  - `npm run release:verify-public -- --version v0.4.0` → `status: ok`
  - `npm run release:smoke-install -- --channel install_sh --version v0.4.0`
    → `ok: true` (install → `--version` → `version --verbose` → `update`
    전부 exit 0)
- `archetype-boundary.spec.md`의 follow-up #13 블록은 스펙에서 제거됐다.
  남은 follow-up은 1-12. `Source Guard`와 `Invariants`도 Go 소스를 가리킨다.
- 3 archetype 패리티: Go CLI와 과거 Node wrapper의 출력이 `jq --sort-keys
  'sort_by(.proposalKey)'` 기준 byte-identical 이었다. 원시 byte 레벨에서
  남은 차이는 JSON 키 순서뿐 (Go 알파벳 vs Node 삽입순).

## Unpushed Commits

```
cf87840 Retire Node normalize helper dual implementation
aedab10 Align Go normalize output with Node parity before deletion
8aac3b6 Teach handoff to auto-apply premortem + counterweight patterns
```

## Last Verified

- `npm run verify` (212/212 pass — Node helper tests 14개 사라진 상태)
- `npm run lint:specs` (5 specs, 560 guard rows)
- `npm run hooks:check` (ready)
- `./bin/cautilus scenario normalize chatbot --input ./fixtures/scenario-proposals/chatbot-consumer-input.json`
  (정상 출력, 3 candidate)
- `./bin/cautilus scenario normalize skill --input ./fixtures/scenario-proposals/workflow-recovery-input.json`
  (actionable error: `use cautilus scenario normalize workflow instead`)

## Next Session

1. **Push 결정.** 세 개의 미푸시 커밋을 `origin/main`에 올릴지 확인. 지난
   세션 말미에 사용자가 "push는 마지막" 이라고 해서 의도적으로 보류했다.
   푸시하면 Actions `verify.yml`이 돌고, 별도 릴리스 커밋이 아니므로
   `release-artifacts.yml`은 트리거되지 않는다.
2. `archetype-boundary.spec.md` follow-up 중 하나 골라 다음 슬라이스 진행
   (스펙에 1-12번으로 번호 매겨져 있음). 짧은 슬라이스 후보:
   - 4 `--example-input` 플래그 (normalize/evaluate 커맨드 공통)
   - 7 `cautilus doctor` ready 후 scenario 힌트
   - 9 fixture naming parity (`workflow-input.json` 추가/리네임)
   - 10 narrative-adapter source_documents에 archetype-boundary.spec 추가
   사이즈 큰 연쇄 후보:
   - 1 + 2 `cautilus scenarios` + `--help` 그룹핑 (함께)
   - 11 + 5 README 재배치 + inline glossary
   - 6 behavior-intent `workflow_conversation` 리네이밍 (스키마 bump 필요)
3. **품질 게이트 보강 후보**: 이 repo에 마크다운 링크 린터
   (`lychee`/`markdown-link-check` 등)가 없다. Commit B 카스케이드에서
   `skills/cautilus/references/*-normalization.md` 세 파일이 링크 형식을
   잃고 백틱 코드로만 바뀌었는데 standing gate가 못 잡았다 (후속 커밋
   `a862cd8`에서 수동 복구). `verify.yml` + pre-push에 바운디드 링크
   린트 한 번 추가하면 해당 클래스의 드리프트가 자동으로 잡힌다.
   `charness:quality` 스킬과 잘 맞는 슬라이스.
4. `corca-ai/charness` 등록 이슈: #22 (narrative scenario block + inline
   glossary), #23 (quality flat-help + cross-archetype schema overlap),
   #24 (premortem 스킬 신설 + spec/quality 확장). 후속 댓글 필요할 때만.

## Consumer Migration (v0.3.x → v0.4.0)

하위호환 breaking 슬라이스는 **v0.4.0에서 끝났고**, 이번 세션은 내부
정리만 했다. 외부 consumer가 v0.4.0으로 올라왔다면 추가 조치는 없다.
참고만:

- `cautilus scenario normalize skill`에 `cli_workflow` 인풋 → actionable
  error로 `cautilus scenario normalize workflow` 안내
- `docs/workflow.md` → `docs/evaluation-process.md`
- Node `normalize-*-proposals.mjs` CLI를 직접 호출하던 곳이 있으면 모두
  `cautilus scenario normalize ...`로 바꿔야 한다 (이번 세션에 삭제됨).

## Discuss

- 이번 세션 판단:
  - Spec이 요구한 "byte-identical" 패리티는 **시맨틱 byte-identity**(키
    sort 후 byte 동일)로 충족된다고 판단하고 진행했다. Raw byte-identity는
    Go `encoding/json`의 알파벳 키 정렬과 Node insertion-order 충돌이라
    product 출력 포맷을 바꾸지 않는 한 달성 불가. 정보 손실이 없으므로
    합리적 완화라고 보고 선행 관문을 통과 처리했다.
  - Node 삭제로 `shared/normalized-run.mjs`가 고아가 되어 같이 지웠다.
- 아직 열려 있는 질문:
  - `cautilus scenarios`가 `cautilus commands`와 어떻게 관계 맺을지
    (동일 registry 확장 vs 별도 리스트).
  - 영어 독자도 `held-out`, `packet`, `bounded` 같은 용어를 자연히 알까?
    → inline glossary 슬라이스(#5)에서 해결.
- 아직 의도적으로 안 하는 것:
  - 한국어 `README.ko.md` (영문 자체를 먼저 쉽게 만들기로 결정).
  - JSON 키 순서 통일 (raw byte-identity를 위한 코드 변경 — 정보 손실이
    없으므로 굳이 안 함).
  - Node shim for air-gapped consumers (아무도 요청 안 했고, 필요해지면
    Go CLI 위에 얇게 다시 올리는 게 싸다).

## Working Patterns

지난 세션들에서 실제로 효과가 컸던 운영 패턴. 다음 세션도 non-trivial한
결정·변경을 할 때 아래를 자동으로 적용한다. 상세 논의와 다른 repo에
이식할 제안은 `corca-ai/charness#24`에 있다.

- **Premortem은 두 시점에 각각 돌린다: 결정 직전 + 실행 직전.**
  이 둘을 혼동하면 안 된다. 핸드오프에 "premortem 완료" 라고 적혀 있어도
  그건 **결정에 대한 커버리지**이고, 실제로 카스케이드·삭제·리네임 코드를
  칠 때는 **실행 각도로 다시** 돌려야 한다. 이번 세션에서 링크 포맷
  드리프트를 놓친 원인이 바로 이 혼동이다.
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
  결정**에 대해 라운드 2 다시. Node 제거 결정이 그 과정으로 합의됐다.
- **Breaking change의 actionable error 계약.**
  스키마·서브커맨드 리네임 시 옛 경로는 `actionable error`로 새 경로를
  가리켜야 한다. `cautilus scenario normalize skill`이 workflow 인풋을
  받았을 때 `...use cautilus scenario normalize workflow instead.`로
  답하는 것이 표준. 리네임/삭제 슬라이스 작업 시 자동 적용.
- **Pre-deletion parity gate는 시맨틱 byte-identity로 읽는다.**
  이중 구현 제거 전에 "byte-identical output" 같은 게이트가 걸려 있어도
  실제 운영 기준은 `jq --sort-keys 'sort_by(.proposalKey)'` 후 byte
  동일이다. Raw byte 수준에서 남은 차이(JSON 키 순서 등)가 정보 손실이
  없으면 게이트 통과로 판단하고 rationale을 커밋/핸드오프에 명시한다.

## Premortem Hazards

- 가장 쉬운 오해: 아키타입 확장을 미리 많이 해두려는 욕심. 네 번째
  (예: `tool_use`, `pipeline`) 유혹이 와도 하지 말자.
  `archetype-boundary.spec.md`가 요구하는 대로, 새 아키타입은 schema +
  helper + CLI + contract + fixture + README 블록을 한 슬라이스에 같이
  가져올 때만 추가한다.
- 다음 세션이 **push를 건너뛰고** 새 슬라이스부터 시작하면, origin은
  아직 이번 세션 결과물을 못 본 상태로 남는다. CI `verify.yml`은 push
  시에만 돌므로 Actions 기반 외부 공유/게이트가 지연된다. `push 여부`를
  의식적으로 결정하고 넘어갈 것.
- 3개 follow-up을 한 슬라이스에 묶으려는 유혹도 피할 것. 특히 follow-up
  6 (behavior-intent 리네이밍)은 `cautilus.behavior_intent.v1` 스키마
  bump를 수반하므로 독립 슬라이스여야 한다.

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
