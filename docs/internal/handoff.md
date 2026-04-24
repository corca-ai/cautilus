# Cautilus Handoff

## Workflow Trigger

다음 세션의 기본 pickup은 `charness:impl`로 runtime fingerprint / model-runtime drift 첫 구현 슬라이스를 시작하는 것이다.
첫 행동은 `git status --short`로 live worktree를 확인하는 것이고, 그 다음 [docs/contracts/runtime-fingerprint-optimization.md](../contracts/runtime-fingerprint-optimization.md)와 관련 계약 문서를 읽는다.
관련 계약 문서는 [docs/contracts/reporting.md](../contracts/reporting.md), [docs/contracts/adapter-contract.md](../contracts/adapter-contract.md), [docs/contracts/skill-testing.md](../contracts/skill-testing.md), [docs/contracts/instruction-surface.md](../contracts/instruction-surface.md), [docs/contracts/optimization.md](../contracts/optimization.md), [docs/contracts/optimization-search.md](../contracts/optimization-search.md)다.
이 handoff는 mention-only pickup 기준 문서이며, handoff adapter는 `docs/internal/handoff.md`를 canonical artifact로 해석한다.

## Current State

- 이번 세션에서 runtime fingerprint / model-runtime drift / optimize simplification 설계 계약이 landed 됐다.
  커밋은 `ae8d6df Define runtime fingerprint optimization contract`다.
- 새 canonical 설계 문서는 [docs/contracts/runtime-fingerprint-optimization.md](../contracts/runtime-fingerprint-optimization.md)다.
  핵심 결정은 `telemetry.runtimeFingerprint`를 canonical write path로 쓰고, flat telemetry는 compatibility input으로 읽는 것이다.
- 첫 구현 비교 기준은 자동 추론이 아니라 explicit prior-evidence input이다.
  active run, scenario history, deployment evidence에서 자동 prior를 고르는 일은 deferred다.
- runtime drift code는 behavior-outcome `reasonCodes`와 섞지 않는다.
  `model_runtime_changed`는 warning/context이고, pinned policy mismatch만 workflow block이 될 수 있다.
- adapter-owned pinned runtime policy는 `runtime_policy`로 문서화됐다.
  기본은 `mode: observe`, pinned path는 declared runtime fields와 observed `telemetry.runtimeFingerprint`를 비교한다.
- optimize 설계는 새 `simplification` kind를 추가하지 않는다.
  `passing_simplification`은 revision reason이고, shorter target preference는 selection objective / `shorter_target` tie-breaker다.
- premortem과 counterweight 결과는 runtime fingerprint 계약 문서의 `Premortem` 섹션에 반영됐다.
- charness 쪽 workflow 개선 이슈는 `corca-ai/charness#66`에 열려 있다.
  내용은 ideation/spec이 새 mode/kind를 제안하기 전에 enum-axis consistency를 점검해야 한다는 것이다.
- `npm run verify`와 `npm run hooks:check`는 통과했다.
  마지막 확인 기준으로 Cautilus worktree는 clean이었다.

## Next Session

1. `git status --short`로 사용자 변경 여부를 먼저 확인한다.
2. [docs/contracts/runtime-fingerprint-optimization.md](../contracts/runtime-fingerprint-optimization.md)의 `First Implementation Slice`를 기준으로 작업 범위를 자른다.
3. 첫 구현은 기존 telemetry에서 `telemetry.runtimeFingerprint`를 정규화하는 것부터 시작한다.
   flat `provider`, `model`, `session_mode`, `pricing_version`은 compatibility input으로 읽는다.
4. prior-evidence input의 minimal packet/file surface를 먼저 정하고, 그 explicit prior evidence와 current fingerprint를 비교해 runtime-context codes를 emit한다.
   current identity가 없으면 `model_runtime_unobserved`, prior identity가 없으면 non-failing no-prior context로 처리한다.
5. 기본 warning path가 선명해진 뒤 `runtime_policy.mode: pinned`와 `model_runtime_pinned_mismatch` block path를 추가한다.
6. optimize wiring은 이번 첫 구현 슬라이스에 끌어오지 않는다.
   runtime warning path와 pinned mismatch path가 landed된 뒤 별도 슬라이스에서 `model_runtime_changed`와 `passing_simplification`을 proposal context로 넣는다.

## Discuss

- explicit prior-evidence input의 CLI/API 이름과 packet 위치
- runtime-context reason codes를 어느 packet path에 둘지
- HTML report가 첫 슬라이스에서 runtime warnings를 보여줘야 하는지
- `optimizer.kind`를 언제 사용자-facing surface에서 축소할지

## References

- [docs/contracts/runtime-fingerprint-optimization.md](../contracts/runtime-fingerprint-optimization.md)
- [docs/contracts/reporting.md](../contracts/reporting.md)
- [docs/contracts/adapter-contract.md](../contracts/adapter-contract.md)
- [docs/contracts/skill-testing.md](../contracts/skill-testing.md)
- [docs/contracts/instruction-surface.md](../contracts/instruction-surface.md)
- [docs/contracts/optimization.md](../contracts/optimization.md)
- [docs/contracts/optimization-search.md](../contracts/optimization-search.md)
- [corca-ai/charness#66](https://github.com/corca-ai/charness/issues/66)
