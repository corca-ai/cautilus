# Cautilus Handoff

이 문서는 다음 세션 pickup과 branch-local volatile state만 적는다.
지속되어야 하는 결정은 가능한 한 원본 문서와 spec에 남기고,
여기에는 "지금 어디까지 왔는가"와 "다음에 어디를 볼 것인가"만 남긴다.

## Workflow Trigger

- 다음 세션에서 이 문서를 멘션하면 먼저
  [README.md](../README.md),
  [AGENTS.md](../AGENTS.md),
  [docs/master-plan.md](./master-plan.md),
  [docs/cli-distribution.md](./cli-distribution.md),
  [docs/version-provenance.md](./version-provenance.md),
  [docs/contracts/active-run.md](./contracts/active-run.md),
  [docs/contracts/reporting.md](./contracts/reporting.md),
  [docs/contracts/behavior-intent.md](./contracts/behavior-intent.md),
  [docs/contracts/scenario-proposal-inputs.md](./contracts/scenario-proposal-inputs.md),
  [docs/release-boundary.md](./release-boundary.md),
  [docs/consumer-migration.md](./consumer-migration.md),
  [docs/specs/current-product.spec.md](./specs/current-product.spec.md),
  [docs/specs/self-dogfood.spec.md](./specs/self-dogfood.spec.md),
  [bin/cautilus](../bin/cautilus),
  [cmd/cautilus/main.go](../cmd/cautilus/main.go),
  [go.mod](../go.mod),
  [internal/cli/command-registry.json](../internal/cli/command-registry.json),
  [scripts/agent-runtime/report-packet.mjs](../scripts/agent-runtime/report-packet.mjs),
  [scripts/agent-runtime/active-run.mjs](../scripts/agent-runtime/active-run.mjs),
  [scripts/agent-runtime/workspace-start.mjs](../scripts/agent-runtime/workspace-start.mjs),
  [skills/cautilus/SKILL.md](../skills/cautilus/SKILL.md)
  를 읽는다.
- 시작 branch는 현재 `go-port`다. public `cautilus ...` surface는 사실상
  Go runtime이 소유하고 있고, `bin/cautilus`는 repo-local POSIX shim이다.
- product-owned seam이면 `cautilus`에서 먼저 고친다. host adapter, prompt,
  fixture, consumer artifact는 host 소유다.
- active-run 상태는 handoff prose보다
  [docs/contracts/active-run.md](./contracts/active-run.md)의
  `### Wired Consumers` 표를 신뢰한다.
- 세션 시작 전에 환경부터 확인한다.
  - `node --version`은 `v22.x` 이상이어야 한다.
  - repo root 안에서 `go env GOVERSION`은 현재 baseline인 `go1.26.2+`를
    가리켜야 한다.

## Current State

- `v0.2.0` standalone release는 이미 나갔고, 현재 작업 branch는 `go-port`
  (`origin/go-port` tracking)다.
- public CLI/runtime ownership은 이제 Go 쪽으로 넘어왔다.
  - entrypoint는 [cmd/cautilus/main.go](../cmd/cautilus/main.go)다.
  - `bin/cautilus`는 `go -C <repo-root> run ./cmd/cautilus`로 연결하는
    thin shim이다.
  - command usage/example/path source of truth는
    [internal/cli/command-registry.json](../internal/cli/command-registry.json)
    하나다.
- standalone install story는 현재 아래가 canonical이다.
  - tagged GitHub binary assets + [install.sh](../install.sh)
  - install 후 `cautilus --version`
  - consumer repo 안에서 `cautilus skills install`
  - Homebrew는 tap ownership / formula automation / update guidance가
    정직해질 때까지 defer다.
- version provenance / update check surface도 product-owned contract로 정리됐다.
  - `cautilus version`은 real command다.
  - `cautilus version --verbose`는 local provenance + cached release state를
    보여준다.
  - `cautilus version --check`는 fresh lookup을 강제한다.
  - automatic update hint는 interactive installed-binary usage에서만 돈다.
    CI, non-interactive, source checkout, `CAUTILUS_NO_UPDATE_CHECK=1`은
    remote check를 건너뛴다.
- report boundary는 strict하다.
  - 허용되는 packet schema는 `cautilus.report_packet.v2`뿐이다.
  - `review prepare-input`, `evidence prepare-input`,
    `optimize prepare-input`은 legacy `v1`을 boundary에서 바로 거절한다.
  - shared validator는
    [scripts/agent-runtime/report-packet.mjs](../scripts/agent-runtime/report-packet.mjs)
    에 있다.
- active-run contract는 정착됐다.
  - 시작점은 `cautilus workspace start`다.
  - sticky reference는 `CAUTILUS_RUN_DIR`이다.
  - precedence는 `explicit --output-dir > env var > auto-materialize`다.
  - wired consumer status는 handoff 본문이 아니라
    [docs/contracts/active-run.md](./contracts/active-run.md) 표가 authoritative다.
- self-dogfood latest와 experiments latest는 둘 다 checked-in HTML view를 가진다.
  - source of truth는 여전히 JSON bundle이다.
  - generic `cautilus report html` 승격은 아직 defer다.
- bundled skill과 packaged plugin skill sync는 계속 load-bearing이다.
  - [skills/cautilus/SKILL.md](../skills/cautilus/SKILL.md)를 바꾸면
    packaged copy도 같이 맞춰야 한다.
- public CLI smoke / acceptance의 주 경로는 이제 Go tests다.
  - [internal/app/cli_smoke_test.go](../internal/app/cli_smoke_test.go)가
    native CLI acceptance coverage를 가진다.
  - [bin/cautilus.test.mjs](../bin/cautilus.test.mjs)는 repo shim 쪽 gate다.

## Last Verified

- local environment
  - `node --version` -> `v22.22.2`
  - `go env GOVERSION` -> `go1.26.2`
- quick runtime sanity
  - `./bin/cautilus --version` -> `0.2.0`
- stop-before-leaving checks
  - `npm run verify`
  - `npm run hooks:check`
  - `npm run dogfood:self`

## Next Session

1. `go-port`에서 계속 작업한다. public runtime port 자체는 사실상 닫혔고,
   다음 우선순위는 release-channel honesty다.
2. release UX를 건드릴 때는 먼저
   [docs/cli-distribution.md](./cli-distribution.md)와
   [docs/version-provenance.md](./version-provenance.md)를 baseline으로 본다.
3. 현재 가장 product-facing한 open question은 Homebrew/tap honesty다.
   작업을 열면 세 가지를 한 번에 답해야 한다.
   - tap ownership
   - formula update automation
   - user-facing update guidance
4. Homebrew 전의 얇은 follow-up이 필요하면 old runtime seam을 다시 열지 말고
   version-provenance surface에서 자른다.
   - `doctor`가 install/version provenance를 얼마나 드러낼지
   - install-kind detection을 더 조일지
   - attestation verification timestamp를 cache에 남길지
5. release-surface change 이후에는 항상 최소한 아래를 다시 돌린다.
   - `./bin/cautilus --version`
   - `go test ./cmd/... ./internal/...`
   - `npm run verify`
   - `npm run hooks:check`

## Discuss

- active-run 쪽에서 아직 열려 있는 결정은 주로 operator ergonomics다.
  - `run.json` manifest에 workflow metadata를 더 넣을지
  - POSIX export 외에 `--shell fish` 같은 flavor surface를 열지
- generic HTML report surface는 여전히 defer다.
  - 현재 product-owned HTML은 self-dogfood latest / experiments latest에만
    좁게 고정되어 있다.
  - `cautilus report html`을 열기 전에 JSON/YAML report boundary가
    여러 consumer에서 안정적인지부터 다시 봐야 한다.
- behavior intent catalog는 여전히 closed catalog다.
  - schema enum까지 올릴지는 defer다.
  - 실제 enforcing layer는 runtime + tests다.

## Premortem

- 가장 쉬운 새 오해: "Go port가 끝났으니 이제 release story도 끝났다."
  아니다. 남은 핵심은 Homebrew/tap honesty와 update guidance 정합성이다.
- 두 번째 오해: "`bin/cautilus`와 Go entry가 각자 route table을 가져도 된다."
  아니다. source of truth는
  [internal/cli/command-registry.json](../internal/cli/command-registry.json)
  하나다.
- 세 번째 오해: "self-dogfood HTML이 source of truth다."
  아니다. 다음 refresh가 덮어쓰므로 JSON bundle을 먼저 고친다.
- 네 번째 오해: "bundled skill만 고치면 된다."
  아니다. packaged skill copy도 같이 맞춰야 한다.
- 다섯 번째 오해: "Node 20으로도 test가 대체로 돌 것이다."
  아니다. current self-dogfood / executor-variant fixture는 Node 22 baseline에
  기대고 있다.
- 여섯 번째 오해: "`workspace start`를 consumer command마다 새로 해야 한다."
  아니다. 한 workflow = 한 runDir가 기본이다.
- 일곱 번째 오해: "self-dogfood script에서 `--output-dir`을 빼도 된다."
  아니다. stray `CAUTILUS_RUN_DIR` 오염을 막는 explicit override가
  load-bearing이다.

## References

- [README.md](../README.md)
- [AGENTS.md](../AGENTS.md)
- [docs/master-plan.md](./master-plan.md)
- [docs/cli-distribution.md](./cli-distribution.md)
- [docs/version-provenance.md](./version-provenance.md)
- [docs/consumer-readiness.md](./consumer-readiness.md)
- [docs/contracts/active-run.md](./contracts/active-run.md)
- [docs/contracts/reporting.md](./contracts/reporting.md)
- [docs/contracts/behavior-intent.md](./contracts/behavior-intent.md)
- [docs/contracts/scenario-proposal-inputs.md](./contracts/scenario-proposal-inputs.md)
- [docs/release-boundary.md](./release-boundary.md)
- [docs/specs/current-product.spec.md](./specs/current-product.spec.md)
- [docs/specs/self-dogfood.spec.md](./specs/self-dogfood.spec.md)
- [bin/cautilus](../bin/cautilus)
- [cmd/cautilus/main.go](../cmd/cautilus/main.go)
- [go.mod](../go.mod)
- [internal/cli/command-registry.json](../internal/cli/command-registry.json)
- [internal/app/cli_smoke_test.go](../internal/app/cli_smoke_test.go)
- [scripts/agent-runtime/report-packet.mjs](../scripts/agent-runtime/report-packet.mjs)
- [scripts/agent-runtime/active-run.mjs](../scripts/agent-runtime/active-run.mjs)
- [scripts/agent-runtime/workspace-start.mjs](../scripts/agent-runtime/workspace-start.mjs)
- [skills/cautilus/SKILL.md](../skills/cautilus/SKILL.md)
