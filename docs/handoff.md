# Cautilus Handoff

이 문서는 다음 세션 pickup에 필요한 현재 상태와 다음 한 수만 남긴다.
지속 결정은 원본 문서와 spec에 남기고, 여기에는 branch-local baton pass만 적는다.

## Workflow Trigger

- 다음 세션에서 이 문서를 멘션하면 먼저
  [README.md](../README.md),
  [AGENTS.md](../AGENTS.md),
  [docs/master-plan.md](./master-plan.md),
  [docs/specs/current-product.spec.md](./specs/current-product.spec.md),
  [docs/temp-product-decisions-2026-04-10.md](./temp-product-decisions-2026-04-10.md),
  [internal/cli/command-registry.json](../internal/cli/command-registry.json),
  [internal/app/cli_smoke_test.go](../internal/app/cli_smoke_test.go),
  [scripts/agent-runtime/evaluate-adapter-mode.mjs](../scripts/agent-runtime/evaluate-adapter-mode.mjs),
  [skills/cautilus/SKILL.md](../skills/cautilus/SKILL.md)
  를 읽는다.
- 시작 branch는 현재 `main`이다.
- product-owned seam이면 `cautilus`에서 먼저 고친다. consumer adapter, prompt,
  consumer proof expansion은 각 consumer repo 소유다.

## Current State

- `Cautilus`는 계속 standalone Go CLI다.
  - public command surface source of truth는
    [internal/cli/command-registry.json](../internal/cli/command-registry.json) 하나다.
  - [bin/cautilus](../bin/cautilus)는 repo-local shim이다.
- install/update lifecycle은 이제 Go CLI가 직접 소유한다.
  - `cautilus install --repo-root .`
  - `cautilus update --repo-root .`
  - `cautilus skills install`은 low-level compatibility seam으로만 남아 있다.
- Homebrew는 더 이상 deferred note가 아니다.
  - release workflow가 formula artifact를 만들고
    `HOMEBREW_TAP_TOKEN`이 있으면 tap publish까지 수행한다.
- 다른 머신용 operator install guide를 추가했다.
  - [install.md](../install.md)
- 이 머신에는 user-local fallback prefix로 Homebrew를 미리 설치했다.
  - `~/.linuxbrew/bin/brew`
  - `~/.zshrc`에서 `brew shellenv`를 로드한다.
- `CLI product evaluation` surface는 `cautilus`에서 제거됐다.
  - `cli evaluate`
  - `scenario normalize cli`
  - 관련 contracts, fixtures, Node helpers, Go handlers, acceptance tests
- 제거 전에 보존이 필요한 seed는 `crill`로 먼저 옮겼다.
  - `../crill/scripts/cautilus/cli-product-scan/`
  - `crill` commit: `09a1705` (`Preserve extracted Cautilus CLI scan seed`)
- `cautilus` 쪽 cleanup commit은 끝났다.
  - commit: `7669158` (`Drop CLI product evaluation from Cautilus`)
- 현재 `cautilus`에서 살아 있는 product framing은
  `agent runtime`, `chatbot`, `skill`, `durable workflow` 쪽이다.
- scenario-history decision은 이미 runtime에 연결돼 있다.
  - profile-backed selection
  - history update
  - comparison baseline-cache seed materialization
- packaged plugin skill copy는 repo skill source와 다시 sync돼 있다.

## Last Verified

- `go test ./internal/app ./internal/runtime ./internal/cli`
- `node --test scripts/agent-runtime/*.test.mjs`
- `node --test bin/*.test.mjs scripts/release/*.test.mjs`
- `npm run verify`
- `npm run hooks:check`
- 실제 release install smoke:
  - `CAUTILUS_VERSION=v0.2.1 ./install.sh`
  - installed wrapper 경유 `cautilus --version`
- login shell에서 `brew --version`
- CLI-eval 잔흔 검색:
  history note인 [docs/temp-product-decisions-2026-04-10.md](./temp-product-decisions-2026-04-10.md)만 남고,
  제품 surface 쪽 검색은 비웠다.

## Next Session

1. unreleased install-surface fixes를 patch release로 묶는다.
   - `install.sh` checksum manifest의 `dist/` prefix 허용
   - Go managed installer도 같은 형식을 허용
2. 새 tag에서 release workflow를 다시 태워 Homebrew tap publish를 확인한다.
   - org secret `HOMEBREW_TAP_TOKEN`은 이미 추가됐다고 들은 상태다.
3. 그 다음 실제 zero-state machine이나 clean shell에서 `brew install`, `cautilus update`를 smoke한다.
4. `cautilus` 바이너리 설치 surface가 실제로 안정적이면 그 다음 `crill`에서
   `scripts/cautilus/cli-product-scan/` seed를 실제 확장으로 다듬는다.
5. `cautilus`에서 남은 정리는 history note 정리 정도다.
   - [docs/temp-product-decisions-2026-04-10.md](./temp-product-decisions-2026-04-10.md)

## Discuss

- `cautilus` 쪽에서 사실상 닫힌 것:
  - CLI product evaluation surface 복구
  - `cautilus`로 `cautilus` CLI를 평가하는 seam
- 아직 판단 여지가 있는 것:
  - `crill`에서 옮겨간 seed를 preservation artifact로 둘지, 실제 consumer feature로 승격할지
  - history note를 얼마나 적극적으로 archive/trim할지

## Premortem

- 가장 쉬운 오해: `Cautilus`가 더 이상 CLI가 아니라는 해석.
  아니다. 없앤 것은 `CLI를 평가 대상 제품 surface로 취급하던 seam`이지,
  Go 기반 `cautilus` CLI 자체가 아니다.
- 두 번째 오해: `docs/temp-product-decisions-2026-04-10.md`의 예전 CLI-eval
  서술을 현재 contract로 읽는 것.
  아니다. 현재 contract는
  [README.md](../README.md),
  [docs/master-plan.md](./master-plan.md),
  [docs/specs/current-product.spec.md](./specs/current-product.spec.md)
  를 따른다.
- 세 번째 오해: `crill` seed 보존이 곧 `cautilus` product surface 유지라는 해석.
  아니다. ownership은 이미 `crill` 쪽 확장 아이디어로 분리했다.

## References

- [README.md](../README.md)
- [AGENTS.md](../AGENTS.md)
- [docs/master-plan.md](./master-plan.md)
- [docs/specs/current-product.spec.md](./specs/current-product.spec.md)
- [docs/temp-product-decisions-2026-04-10.md](./temp-product-decisions-2026-04-10.md)
- [docs/consumer-readiness.md](./consumer-readiness.md)
- [internal/cli/command-registry.json](../internal/cli/command-registry.json)
- [internal/app/cli_smoke_test.go](../internal/app/cli_smoke_test.go)
- [scripts/agent-runtime/evaluate-adapter-mode.mjs](../scripts/agent-runtime/evaluate-adapter-mode.mjs)
- [skills/cautilus/SKILL.md](../skills/cautilus/SKILL.md)
