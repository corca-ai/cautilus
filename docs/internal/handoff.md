# Cautilus Handoff

이 문서는 다음 세션이 바로 이어야 할 현재 상태와 다음 한 수만 남긴다.
장기 패턴은 [working-patterns.md](./working-patterns.md) 가 source of truth 다.

## 먼저 읽기

다음 세션이 이 문서를 멘션하면 먼저 아래만 읽는다.

1. [README.md](../../README.md)
2. [AGENTS.md](../../AGENTS.md)
3. [docs/master-plan.md](../master-plan.md)
4. [docs/maintainers/releasing.md](../maintainers/releasing.md)
5. [docs/maintainers/consumer-readiness.md](../maintainers/consumer-readiness.md)

## Current State

2026-04-18 세션 기준 `main` 은 `origin/main` 앞에 여러 커밋이 있다.
핵심 변화는 네 묶음이다.

1. external workflow consumer proof 를 archetype 수준으로 정리했다.
2. `mode evaluate` / `report.json` 이 comparison-backed rejection 과 pure execution failure 를 구분한다.
3. persisted artifact 에 rate limit 시그니처가 있으면 `report.json` 에 `reasonCodes` 와 `warnings` 로 contamination 을 올린다.
4. `version --verbose`, README, CLI reference, bundled skill 이 현재 product surface 와 report 해석 규칙을 더 직접 설명한다.

## Recent Commits

이미 local `main` 에 있는 주요 커밋:

```text
ae98ee8 Surface rate-limit contamination in reports
010b808 Record workflow consumer contamination reporting
```

이번 세션에서 아직 push 전 상태로 마무리해야 하는 작업:

- `version --verbose` product summary
- bundled skill 의 current report surface / outputs 설명
- README / CLI reference 의 first-value wording 보강
- handoff 갱신
- release prepare, tag, push

## Release Note

이 릴리즈 라인의 operator-facing 핵심은 아래 두 문장으로 요약된다.

- `report.json` 은 이제 comparison-backed rejection 과 pure execution failure 를 더 명확히 구분한다.
- persisted artifact 에 rate limit 시그니처가 있으면 `provider_rate_limit_contamination` 이 `reasonCodes` / `warnings` 로 올라와 첫 report surface 에서 바로 읽힌다.

`Ceal` 같은 external consumer 에게는 새 버전에서 아래를 다시 확인하라고 안내하면 된다.

1. `cautilus mode evaluate --mode held_out ...`
2. 생성된 `report.json` 의 `reasonCodes`, `warnings`, `modeSummaries[*].summary`
3. 같은 evidence 를 `review prepare-input -> review build-prompt-input -> review variants` 로 다시 태웠을 때 contamination warning 이 review surface 까지 이어지는지

## Next Session

릴리즈가 끝난 뒤 다음으로 가장 가치 큰 작업은 두 가지다.

1. CLI registry / help surface 를 `usage + example` 카탈로그에서 한 단계 올리기
   `summary`, `when_to_use`, `produces`, `next_step` 를 command registry 에 넣고 `cautilus --help`, topic help, `commands --json` 에 노출하는 일.
2. README 의 대표 루프를 proposal-only 예시에서 evaluation loop 까지 확장하기
   `mode evaluate -> report -> review -> html` 이 한 번에 보이게 해야 한다.

## Release Checklist

현재 세션을 닫기 전 해야 할 순서:

1. 현재 변경 커밋
2. `npm run verify`
3. `npm run hooks:check`
4. `npm run test:on-demand`
5. `npm run release:prepare -- <next-version>`
6. release metadata 커밋
7. `git tag v<next-version>`
8. `git push origin main --tags`
9. tag workflow 가 끝난 뒤 `npm run release:verify-public -- --version v<next-version>`

## References

- [README.md](../../README.md)
- [docs/cli-reference.md](../cli-reference.md)
- [docs/contracts/reporting.md](../contracts/reporting.md)
- [docs/maintainers/consumer-readiness.md](../maintainers/consumer-readiness.md)
- [docs/internal/research/ceal-consumer-follow-up-2026-04-17.md](./research/ceal-consumer-follow-up-2026-04-17.md)
- [skills/cautilus/SKILL.md](../../skills/cautilus/SKILL.md)
