# Operator Acceptance

이 문서는 다른 머신에서 코틸러스를 처음 인수하는 인간 또는 에이전트가
순서대로 따라하면 통과/불통과를 판정할 수 있는 체크리스트다.

각 항목에는 실행자 구분, 비용 표시, 순서 의존성을 명시한다.

- **실행자**: `기계적` = 에이전트가 exit code와 stdout만으로 판정 가능,
  `인간 판단` = 사람이 출력을 읽고 의미를 판단해야 함
- **비용**: `무료` = 로컬 연산만, `LLM` = API 호출 비용 발생
- **의존**: 앞 단계의 완료를 전제하는 경우 표시

Source of truth는 이 문서가 아니라 각 spec 파일의 Functional Check와
[releasing.md](./releasing.md)다.
이 문서는 그 정보를 인수 관점에서 재배열한 것이다.

## 먼저 읽을 문서

새 maintainer는 명령을 실행하기 전에 다음 순서로 현재 표면을 확인한다.

1. [README.md](../../README.md): 제품 범위, 설치 경로, probe surface.
2. [docs/master-plan.md](../master-plan.md): 현재 단계, 열린 우선순위, 의도적으로 미룬 일.
3. [docs/internal/handoff.md](../internal/handoff.md): 진행 중인 다음 slice와 volatile pickup state.
4. [docs/maintainers/development.md](./development.md): 로컬 개발과 self-dogfood 실행 방식.
5. 이 문서: takeover 판단을 위한 tiered acceptance sequence.

---

## Tier 0: 환경 전제조건

다른 모든 tier보다 먼저 확인한다. 하나라도 실패하면 이후 단계는 무의미하다.

| 항목 | 명령 | 통과 조건 | 실행자 |
|---|---|---|---|
| Node.js | `node --version` | `v22.x` 이상 출력 | 기계적 |
| Go | `go env GOVERSION` | `go1.26.2` 이상 출력 | 기계적 |
| golangci-lint | `golangci-lint --version` | 버전 출력, exit 0 | 기계적 |
| govulncheck | `govulncheck --version` | 버전 출력, exit 0 | 기계적 |
| npm 의존성 설치 | `npm install` | exit 0 | 기계적 |
| Git hooks 설치 | `npm run hooks:install` | exit 0 | 기계적 |

---

## Tier 1: 바이너리 및 설치 검증

비용: 무료. 의존: Tier 0 완료.

이 tier는 Go 바이너리가 빌드되고 기본 명령이 동작하는지 확인한다.

| # | 명령 | 통과 조건 | 실행자 |
|---|---|---|---|
| 1.1 | `./bin/cautilus --version` | `0.2.0` 등 버전 문자열 출력, exit 0 | 기계적 |
| 1.2 | `cautilus version --verbose` | 버전 + provenance 정보 출력, exit 0 | 기계적 |
| 1.3 | `cautilus --help` | 서브커맨드 목록 출력, exit 0 | 기계적 |
| 1.4 | `npm run release:smoke-install -- --channel install_sh --version v0.3.0` | isolated temp root에서 public install/update flow 통과, exit 0 | 기계적 |

---

## Tier 2: Standing Gate

비용: 무료. 의존: Tier 1 완료.

이 tier는 repo의 상시 품질 게이트를 통과하는지 확인한다.
`npm run verify`는 lint (ESLint + golangci-lint + go vet + govulncheck +
placeholder drift + specdown 기반 spec source guard) + Go race test + standing Node tests를 포함한다.

| # | 명령 | 포함 내용 | 통과 조건 | 실행자 |
|---|---|---|---|---|
| 2.1 | `npm run verify` | ESLint, golangci-lint, go vet, govulncheck, placeholder drift, spec source guard, `go test -race`, Node tests | exit 0 | 기계적 |
| 2.2 | `npm run hooks:check` | Git hooks가 제대로 설치되어 있는지 | exit 0 | 기계적 |

이 두 명령이 통과하면 코드 수준의 정합성은 확인된 것이다.

**개별 확인이 필요할 때:**

| 명령 | 용도 |
|---|---|
| `npm run lint` | lint만 (ESLint + specs + Go lint + vet + govulncheck) |
| `npm run lint:specs` | public spec index/link 검증 + 전체 cheap spec suite |
| `npm run specdown` | 전체 executable spec surface |
| `npm run test` | Go test + Node test (race 없이) |
| `npm run test:go:race` | Go race detector 포함 테스트 |
| `npm run test:node` | Node test만 |
| `npm run test:on-demand` | 무거운 self-dogfood workflow script tests |
| `node --test ./bin/cautilus.test.mjs` | repo shim 전용 테스트 |

---

## Tier 3: Product CLI Surface

비용: 무료 (checked-in fixture 기반). 의존: Tier 1 완료.

이 tier는 코틸러스의 전체 CLI 커맨드가 fixture 입력으로 정상 동작하는지
확인한다. 모든 명령은 LLM 호출 없이 로컬에서 돌아간다.

### 3a. Adapter 및 Doctor

| # | 명령 | 통과 조건 | 실행자 |
|---|---|---|---|
| 3.1 | `cautilus adapter resolve --repo-root .` | adapter 경로 출력, exit 0 | 기계적 |
| 3.2 | `cautilus doctor --repo-root .` | stdout에 `ready` 포함, exit 0 | 기계적 |
| 3.3 | `node ./scripts/init_adapter.mjs --repo-root /tmp/cautilus-oa-check --output /tmp/cautilus-oa-check/cautilus-adapter.yaml --force` | YAML 파일 생성, exit 0 | 기계적 |
| 3.3a | `go test ./internal/app -run 'TestCLIEvalLive|TestCLILiveEval'` | synthetic consumer repo에서 `eval live` 표면과 `eval live` smoke 통과, exit 0 | 기계적 |

### 3b. Workspace 명령

| # | 명령 | 통과 조건 | 실행자 |
|---|---|---|---|
| 3.4 | `cautilus workspace prepare-compare --repo-root . --baseline-ref origin/main --output-dir /tmp/cautilus-oa-compare` | baseline/, candidate/ 디렉토리 생성, exit 0 | 기계적 |
| 3.5 | `cautilus workspace prune-artifacts --root /tmp/cautilus-oa-runs --keep-last 20` | exit 0 (대상 없어도 통과) | 기계적 |
| 3.6 | `mkdir -p /tmp/cautilus-oa-runs && cautilus workspace start --root /tmp/cautilus-oa-runs --label oa-check --json` | JSON 출력에 `runDir` 포함, exit 0 | 기계적 |

### 3c. Scenario 명령

| # | 명령 | 통과 조건 | 실행자 |
|---|---|---|---|
| 3.7 | `cautilus scenario normalize chatbot --input ./fixtures/scenario-proposals/chatbot-input.json` | JSON 출력, exit 0 | 기계적 |
| 3.8 | `cautilus scenario normalize skill --input ./fixtures/scenario-proposals/skill-input.json` | JSON 출력, exit 0 | 기계적 |
| 3.9 | `cautilus scenario normalize workflow --input ./fixtures/scenario-proposals/workflow-input.json` | JSON 출력, exit 0 | 기계적 |
| 3.10 | `cautilus scenario prepare-input --candidates ./fixtures/scenario-proposals/candidates.json --registry ./fixtures/scenario-proposals/registry.json --coverage ./fixtures/scenario-proposals/coverage.json --family fast_regression --window-days 14 --now 2026-04-11T00:00:00.000Z` | JSON 출력, exit 0 | 기계적 |
| 3.11 | `cautilus scenario propose --input ./fixtures/scenario-proposals/standalone-input.json` | JSON 출력, exit 0 | 기계적 |
| 3.12 | `cautilus scenario summarize-telemetry --results ./fixtures/scenario-results/example-results.json` | JSON 출력, exit 0 | 기계적 |
| 3.12a | `cautilus scenario review-conversations --input ./fixtures/scenario-conversation-review/input.json` | JSON 출력에 `cautilus.scenario_conversation_review.v1` 포함, exit 0 | 기계적 |

### 3d. Report 및 Evidence

| # | 명령 | 통과 조건 | 실행자 |
|---|---|---|---|
| 3.13 | `cautilus report build --input ./fixtures/reports/report-input.json` | JSON 출력에 `cautilus.report_packet.v2` 포함, exit 0 | 기계적 |
| 3.14 | `cautilus evidence prepare-input --report-file ./fixtures/reports/report-input.json --scenario-results-file ./fixtures/scenario-results/example-results.json` | JSON 출력, exit 0 | 기계적 |
| 3.15 | `cautilus evidence bundle --input ./fixtures/evidence/example-input.json` | JSON 출력, exit 0 | 기계적 |

### 3e. Optimize

| # | 명령 | 통과 조건 | 실행자 |
|---|---|---|---|
| 3.16 | `cautilus optimize prepare-input --report-file ./fixtures/reports/report-input.json --target prompt --budget light` | JSON 출력, exit 0 | 기계적 |
| 3.17 | `cautilus optimize propose --input ./fixtures/optimize/example-input.json` | JSON 출력, exit 0 | 기계적 |
| 3.18 | `cautilus optimize build-artifact --proposal-file ./fixtures/optimize/example-proposal.json --input-file ./fixtures/optimize/example-input.json` | JSON 출력, exit 0 | 기계적 |

### 3f. Review (fixture 기반, LLM 없음)

의존: review 입력은 체크인된 report fixture에서 만든 `report.json`을 사용한다.
`cautilus eval test`는 현재 `eval-observed.json`과 `eval-summary.json`을 만들며, review packet 입력을 직접 만들지는 않는다.

| # | 명령 | 통과 조건 | 실행자 |
|---|---|---|---|
| 3.19 | `cautilus eval test --repo-root . --fixture fixtures/eval/dev/repo/checked-in-agents-routing.fixture.json --output-dir /tmp/cautilus-oa-eval` | observed packet 생성, exit 0 | 기계적 |
| 3.20 | `cautilus report build --input ./fixtures/reports/report-input.json --output /tmp/cautilus-oa-eval/report.json && cautilus review prepare-input --repo-root . --report-file /tmp/cautilus-oa-eval/report.json --output /tmp/cautilus-oa-eval/review.json` | review.json 생성, exit 0. 의존: report fixture | 기계적 |
| 3.21 | `cautilus review build-prompt-input --review-packet /tmp/cautilus-oa-eval/review.json` | review-prompt-input.json 생성, exit 0. 의존: 3.20 | 기계적 |
| 3.22 | `cautilus review render-prompt --input /tmp/cautilus-oa-eval/review-prompt-input.json` | 프롬프트 텍스트 출력, exit 0. 의존: 3.21 | 기계적 |

---

## Tier 4: Self-Dogfood

비용: **LLM API 호출 발생** (codex-review executor variant).
의존: Tier 2 완료.

이 tier는 코틸러스가 자기 자신의 품질을 정직하게 기록하고 surface하는지
확인한다. LLM 비용이 들기 때문에 인간이 실행 여부를 판단한다.

| # | 명령 | 통과 조건 | 실행자 | 비용 |
|---|---|---|---|---|
| 4.1 | `npm run dogfood:self` | `artifacts/self-dogfood/eval/latest/eval-summary.json` 생성, `recommendation=accept-now`, `evaluationCounts.failed=0`, `evaluationCounts.blocked=0`, `evaluationCounts.passed=evaluationCounts.total` | 인간 판단 | LLM |
| 4.2 | `npm run dogfood:self:eval` | `artifacts/self-dogfood/eval/latest/eval-summary.json` 생성, `recommendation=accept-now`, `evaluationCounts.failed=0`, `evaluationCounts.blocked=0`, `evaluationCounts.passed=evaluationCounts.total` | 인간 판단 | LLM |

**통과 판정 기준 상세:**

- `dogfood:self`는 현재 `dogfood:self:eval`의 canonical alias다.
- `dogfood:self:eval`은 현재 checked-in `cautilus.evaluation_input.v1` fixture(`fixtures/eval/dev/repo/`)를 재실행해
  `eval-summary.json`을 갱신해야 한다.
  `recommendation=accept-now`와 `evaluationCounts.failed=0`, `evaluationCounts.blocked=0`, `evaluationCounts.passed=evaluationCounts.total`이 기본 통과선이다.
- broader report/review self-dogfood와 experiments runner는 `mode evaluate` cut 이후 아직 새 eval surface 위로 재구축되지 않았다.

**HTML 뷰만 갱신 (LLM 호출 없음):**

| # | 명령 | 통과 조건 | 실행자 | 비용 |
|---|---|---|---|---|
| 4.4 | `npm run dogfood:self:html` | `index.html` 갱신, exit 0 | 기계적 | 무료 |
| 4.5 | broader self-dogfood HTML | report/review self-dogfood가 새 eval surface 위로 재구축될 때 다시 정의 | 기계적 | 무료 |

---

## Tier 5: Consumer Proof

비용: 무료~LLM (명령에 따라 다름).
의존: Tier 1 완료 + 외부 repo 접근 필요.

이 tier는 코틸러스가 실제 consumer repo에서 동작하는지 확인한다.
현재 4개 consumer가 등록되어 있다.
전체 evidence는 [consumer-readiness.md](./consumer-readiness.md)가
source of truth다.

### 5a. 최소 검증 (기계적)

모든 consumer repo에서 아래가 통과해야 한다:

| # | 명령 (각 repo에서) | 통과 조건 | 실행자 |
|---|---|---|---|
| 5.0 | `npm run consumer:onboard:smoke` | temp consumer repo가 `install -> adapter init -> doctor ready -> eval test`까지 통과, `eval-summary.json` recommendation이 `accept-now`, exit 0 | 기계적 |
| 5.1 | `cautilus doctor --repo-root <repo-path>` | `ready` 출력, exit 0 | 기계적 |
| 5.2 | `cautilus adapter resolve --repo-root <repo-path>` | adapter 경로 출력, exit 0 | 기계적 |

현재 확인 중인 consumer normalization family:

| target | 역할 | 경로 예시 |
|---|---|---|
| cautilus | self-consumer | `.` (이 repo) |
| chatbot consumer | live consumer, chatbot 참조 | `<chatbot-consumer-path>` |
| skill-validation consumer | live consumer, skill 참조 | `<skill-consumer-path>` |
| workflow consumer | live consumer, durable-workflow 참조 | `<workflow-consumer-path>` |

### 5b. 깊은 검증 (인간 판단, 선택적)

consumer-readiness.md에 기록된 deeper evidence path. 전부 돌릴 필요는
없으나, release 전에는 최소 하나의 consumer에서 deep path를 확인한다.

| # | 대상 | 명령 예시 | 통과 조건 | 비용 |
|---|---|---|---|---|
| 5.3 | workflow consumer | `cautilus eval test --repo-root <workflow-consumer-path> --fixture <fixture.json> --output-dir /tmp/cautilus-workflow-eval` | observed packet의 recommendation이 `accept-now` | 무료 |
| 5.4 | workflow consumer | `cautilus review variants --repo-root <workflow-consumer-path> --adapter-name operator-recovery ...` | review summary에 passing variant 존재 | LLM |

---

## Tier 6: Promotion Readiness

비용: 무료 (6a) + **인간 판단** (6b).
의존: Tier 0-3 완료.

이 tier는 *"다른 사람에게 이 리포 링크를 던지고 리드미의 주장을 자신있게 홍보할 수 있는가"*를 판정한다.
Tier 3이 "CLI가 돌아가는가"라면 이 tier는 "리드미의 각 문장이 참인가"이다.
외부 홍보 (블로그, 소셜, 사내 공유) 전에 이 tier가 녹색이어야 안전하다.

### 6a. CLI claim coverage (기계적)

리드미의 주장 ↔ 검증 명령 1:1 매핑.

| # | 리드미 주장 | 검증 명령 | 통과 조건 |
|---|---|---|---|
| 6.1 | GEPA-style bounded prompt search — prepare | `cautilus optimize search prepare-input --optimize-input ./fixtures/optimize/example-input.json --held-out-results-file ./fixtures/scenario-results/example-results.json --budget light` | JSON 출력, exit 0 |
| 6.2 | GEPA search — run (blocked-readiness 포함) | `cautilus optimize search run --input <6.1 출력>` | JSON 출력 (blocked result도 통과로 간주), exit 0 |
| 6.3 | Agent track — plugin surface doctor | `cautilus doctor --repo-root . --scope agent-surface` | `ready` 출력, exit 0 |
| 6.4 | Claude marketplace manifest | `claude plugins validate ./.claude-plugin/marketplace.json` | exit 0 |
| 6.5 | Claude plugin manifest (packaged) | `claude plugins validate ./plugins/cautilus/.claude-plugin/plugin.json` | exit 0 |
| 6.6 | Codex marketplace 발견 | `node ./scripts/release/check-codex-marketplace.mjs --repo-root .` | exit 0 |
| 6.7 | Starter kits — normalization families | `npm run consumer:starters:smoke` | 3개 starter가 `adapter resolve`, `doctor`, `scenario normalize` 통과 |
| 6.10 | Packet shape — 3 normalization families (optional, `jq` 필요) | `cautilus scenario normalize chatbot --input ./fixtures/scenario-proposals/chatbot-input.json \| jq -e '.candidates\|length>0'` (skill, workflow도 동일 패턴으로) | 각각 exit 0 |

`jq`가 없는 환경에서는 6.10을 스킵해도 된다. 나머지 행은 의존성 없이 돈다.

### 6b. HTML report — human review (인간 판단)

리드미는 *"static HTML views of the same artifacts so a human reviewer can judge them in a browser without an agent in the loop"*을 약속한다.
이 약속이 참인지는 사람이 브라우저에서 실제로 열어봐야 판정 가능하다.

**상세 claim SOT는** [reviewable-artifacts.spec.md](../specs/user/reviewable-artifacts.spec.md) **이고, 이전 HTML proof page는** [old/html-report.spec.md](../specs/old/html-report.spec.md) **에 보관되어 있다.** 아래 행은 인간 판단 체크리스트로만 사용한다.

| # | 대상 | 확인 방법 | 인간 판단 기준 |
|---|---|---|---|
| 6.13 | Self-dogfood latest | 브라우저에서 `artifacts/self-dogfood/latest/index.html` 열기 | Decision Summary 가 먼저 보이고 `what happened / why it matters / what to inspect next` 가 raw JSON field 보다 먼저 인지 가능 |
| 6.14 | Self-dogfood experiments | `artifacts/self-dogfood/experiments/latest/index.html` 열기 | 전체 blocker/pass, deterministic gate, review recommendation 의 차이가 상단에서 설명되고 실패 experiment 의 inspect link 로 바로 이동 가능 |
| 6.15 | Eval report HTML | `cautilus report render-html --input <report.json>` 실행 후 `report.html` 열기 | intent / decision signals / modes / scenario outcomes / command observations / human review findings 가 TOC 와 함께 한 페이지에서 읽히고 contamination warning 이 recommendation 보다 먼저 눈에 들어옴 |
| 6.16 | Review packet HTML | `cautilus review render-html --input <review.json>` 실행 후 `review.html` 열기 | intent / review path / comparison questions / human review prompts / artifactFiles 가 연결 탐색 가능하고 reviewer 가 무엇부터 읽어야 하는지 먼저 보임 |
| 6.17 | Review variants summary HTML | `cautilus review render-variants-summary-html --input <review-summary.json>` 실행 후 `review-summary.html` 열기 | overall verdict / consensus-or-divergence / telemetry / variant별 execution + verdict + findings / reasonCodes 가 구조적으로 읽힘 |
| 6.18 | Compare artifact HTML | `cautilus workspace render-compare-html --input <compare-artifact.json>` 실행 후 `compare.html` 열기 | signal map / scenario buckets / deltas / threshold reasons / artifactPaths 가 단일 diff 페이지에서 읽히고 어떤 layer 가 decision 을 carry 하는지 먼저 보임 |
| 6.19 | Scenario proposals HTML | `cautilus scenario render-proposals-html --input <proposals.json>` 실행 후 `proposals.html` 열기 | selection signals / attention view / full ranked proposals 가 순서대로 읽히고 각 proposal 의 proposalKey / title / action / family / rationale / attention reason 이 카드 단위로 보임 |
| 6.19a | Scenario conversation review HTML | `cautilus scenario render-conversation-review-html --input <conversation-review.json>` 실행 후 `conversation-review.html` 열기 | selection signals / attention threads / all threads 가 순서대로 읽히고 각 thread 안에서 linked proposals 와 transcript 가 분리되어 읽힘 |
| 6.20 | Evidence bundle HTML | `cautilus evidence render-html --input <evidence-bundle.json>` 실행 후 `evidence-bundle.html` 열기 | summary counts / sourceKind grouped signals / severity chips / guidance / sources 가 읽혀서 mining signal 이 flat list 로 뭉개지지 않음 |
| 6.21 | Run index HTML (global TOC) | `cautilus artifacts render-index-html --run-dir <path>` 실행 후 `index.html` 열기 | run 의 모든 artifact 가 사이드바에서 한눈에 보이고 aggregate 상태 chip 이 정확하며 review flow 순서로 읽힘 |

이 tier 의 모든 row 는 각 HTML 이 브라우저에서 실제로 열릴 때 인간이 판정한다.
자동 guard (`npm run verify`) 는 렌더러 함수 / 핸들러 / CLI 등록이 살아 있음을 확인할 뿐, 시각 품질은 사람이 본다.

---

## 전체 통과 판정

| 등급 | 기준 | 의미 |
|---|---|---|
| **최소 인수** | Tier 0-2 전체 통과 | 코드가 빌드되고 standing gate가 녹색 |
| **제품 인수** | Tier 0-3 전체 통과 | CLI surface 전체가 fixture 기반으로 동작 |
| **품질 인수** | Tier 0-4 전체 통과 | self-dogfood까지 녹색 |
| **완전 인수** | Tier 0-5 전체 통과 | consumer repo까지 검증 완료 |
| **홍보 준비** | Tier 0-3, 6a 전체 통과 + 6b 중 현재 구현된 항목 (6.13, 6.14) 통과 | 리드미의 claim surface가 참이라고 공식 인정할 수 있음 |

release 전에는 최소 **품질 인수** (Tier 0-4)를 달성해야 한다.
외부 **홍보** 전에는 **홍보 준비** 도 함께 달성해야 한다.

---

## 정리 (Tier 3 임시 파일)

Tier 3 실행 후 남는 임시 디렉토리를 정리한다:

```bash
rm -rf /tmp/cautilus-oa-check /tmp/cautilus-oa-compare /tmp/cautilus-oa-runs /tmp/cautilus-oa-mode
```
