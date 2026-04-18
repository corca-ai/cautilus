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

2026-04-18 세션 기준 release 준비 버전은 `0.5.3` 이다.
핵심 변화는 여섯 묶음이다.

1. external workflow consumer proof 를 archetype 수준으로 정리했다.
2. `mode evaluate` / `report.json` 이 comparison-backed rejection 과 pure execution failure 를 구분한다.
3. persisted artifact 에 rate limit 시그니처가 있으면 `report.json` 에 `reasonCodes` 와 `warnings` 로 contamination 을 올린다.
4. `version --verbose`, README, CLI reference, bundled skill 이 현재 product surface 와 report 해석 규칙을 더 직접 설명한다.
5. `instruction-surface` 가 이제 planned spec 이 아니라 shipped surface 다.
   `cautilus instruction-surface test` / `evaluate`, 전용 contracts, fixtures, self-dogfood adapter 가 들어갔다.
6. instruction-surface self-dogfood 는 live repo 를 더럽히지 않도록 run-scoped candidate worktree 에서 돈다.
   이 세션의 local self-dogfood 는 `accept-now` 까지 확인했다.

## Recent Commits

최근 주요 커밋:

```text
70942fa Make instruction-surface dogfood expectations robust
9fbef9b Keep release gates clean around self-dogfood tests
0deee0f Stabilize instruction-surface self-dogfood isolation
cdd09d9 Harden live instruction-surface runner output
a2e36eb Add first-class instruction-surface evaluation
```

이전 public release 는 `v0.5.2` 였다.
이번 세션은 `v0.5.3` release line 을 준비 중이다.
manual `git tag` 대신 checked-in `release:publish` helper 를 계속 쓴다.

## Release Note

이번 release line 의 operator-facing 핵심은 아래 두 문장으로 요약된다.

- `instruction-surface` 가 이제 1급 product surface 다.
- self-dogfood 는 live repo surface 를 mutate 하지 않고 disposable candidate worktree 에서 녹색까지 확인된다.

consumer 에게는 새 버전에서 아래를 다시 확인하라고 안내하면 된다.

1. `cautilus instruction-surface test --repo-root . --adapter-name <adapter>`
2. 생성된 `instruction-surface-summary.json` 의 `recommendation`, `routingSummary`, `variantSummaries`
3. self-dogfood 같은 checked-in runner 가 disposable candidate workspace 를 쓰는지

## Next Session

다음 세션의 1순위는 `instruction-surface` 이후 남은 follow-up 이다.
핵심은 지금 shipped surface 를 더 풍부하게 만드는 것이지, `skill evaluate` 로 되돌리는 것이 아니다.

같이 기억할 update seam:

- `cautilus update --overwrite-skill` 자체는 유효한 방향으로 보였지만, machine-wide scan 은 하지 않기로 했다.
- 대신 `~/.cautilus` 아래의 명시적 managed install registry 를 두는 방향이 유력하다.
- 추천 이름은 `managed-installs.json` 이고, 첫 slice 는 repo-local bundled skill install entry 만 기록한다.
- 목표는 `cautilus update` 가 charness 를 노출하지 않으면서도 `Cautilus` 가 직접 관리하는 repo 들의 skill refresh 를 opt-in 으로 제공하게 하는 것이다.

그 다음 후보는 두 가지다.

1. CLI registry / help surface 를 `usage + example` 카탈로그에서 한 단계 올리기
   `summary`, `when_to_use`, `produces`, `next_step` 를 command registry 에 넣고 `cautilus --help`, topic help, `commands --json` 에 노출하는 일.
2. README 의 대표 루프를 proposal-only 예시에서 evaluation loop 까지 확장하기
   `mode evaluate -> report -> review -> html` 이 한 번에 보이게 해야 한다.
3. instruction-surface 에 multi-path expectation 을 넣기
   지금 self-dogfood fixture 는 stochastic 한 entry alias / linked progressive read 를 hard expectation 에서 뺐다.
   다음 slice 에서 `allowedEntryFiles` 나 equivalent route sets 같은 richer expectation shape 를 검토할 수 있다.

## Release Checklist

현재 세션을 닫기 전 해야 할 순서:

1. 현재 변경 커밋
2. `npm run verify`
3. `npm run hooks:check`
4. `npm run test:on-demand`
5. `npm run release:prepare -- <next-version>`
6. release metadata 커밋
7. `npm run release:publish -- --version <next-version>`
8. tag workflow 가 끝난 뒤 `npm run release:verify-public -- --version v<next-version>`

## References

- [README.md](../../README.md)
- [docs/cli-reference.md](../cli-reference.md)
- [docs/contracts/reporting.md](../contracts/reporting.md)
- [docs/maintainers/consumer-readiness.md](../maintainers/consumer-readiness.md)
- [docs/specs/instruction-surface.spec.md](../specs/instruction-surface.spec.md)
- [skills/cautilus/SKILL.md](../../skills/cautilus/SKILL.md)
