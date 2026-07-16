# Cautilus Handoff

## Workflow Trigger

권장 호출(다음 세션): `@docs/internal/handoff.md 핸드오프대로 진행 — 먼저 charness:handoff로 현재 상태를 확인하고, 구체적인 새 요청이 없으면 자동 착수하지 않는다.`

mention-only 픽업이면 `charness:handoff`로 이 baton과 최신 goal/release 상태를 확인한다.
구체적인 작업 요청이 함께 있으면 그 요청이 우선한다.

## Current State

- 현재 활성 구현 트랙은 없다.
- 공개 릴리스는 `v0.19.4`이며 workflow, 7개 asset/checksum, distinct-channel(HTTP 200) verify, install.sh 스모크가 통과했다.
- `v0.19.4`는 두 테마를 담았다: find-skills retirement realign(문서 + 재캡처한 flagship live proof + 셸 evaluate 예제의 find-skills 제거)과 품질 툴링(packaged mirror parity gate, hermetic coverage-floor 테스트, monotonic floor writer, stale floor 13개 상향). 소비자 노출 바이너리/Agent 동작 변화는 없다.
- canonical 릴리스 증거와 post-publish 검증 disposition은 `charness-artifacts/release/latest.md`가 소유한다.
- 최근 자율 개선의 품질 상태, warning-only 부채, runtime 비주장은 `charness-artifacts/quality/latest.md`가 소유한다.
- release page가 asset보다 먼저 보일 수 있다는 재발 방지 순서는 `docs/maintainers/releasing.md`에 반영됐다.
- PATH의 `cautilus`는 이 세션에서 전역 갱신하지 않았다.
  격리된 public installer proof는 `0.19.3`을 확인했지만 이를 사용자 전역 설치 상태와 같다고 주장하지 않는다.
- `cautilus doctor --repo-root .`는 adapter readiness를 통과했지만 dev/repo runner assessment가 현재 source hashes보다 오래됐다고 안내한다.
- `find-skills`(2026-07-13 상위 charness에서 public 제거) 재정렬 full flip을 완주했다: `AGENTS.md` Skill Routing을 `charness catalog list` 규약으로 바꾸고, 라이브 2회 재캡처(claude-sonnet-5) + blind 재채점으로 Behavior Evaluation dev/repo routing 약속을 freshly-proven으로 복원했다. 불변식은 Branch B(`AGENTS.md` orient + `charness:impl` work skill, bootstrapHelper=none); dev/skill orientation proof는 영향 없음.
- coordinated flip은 랜딩 완료다(계약 `docs/contracts/find-skills-retirement-realign.md` status: LANDED). FD5-frozen codex-provenance replay 클레임(`reasoning-soundness-calibration.dev-repo-realsurface-routing.*`, `checked-in-agents-routing.fixture.json`)은 의도적으로 historical(find-skills)로 남겨뒀다.

## Next Session

1. `git status --short --branch`, `charness-artifacts/goals/2026-07-11-fifth-autonomous-two-hour-improvement-release.md`, `charness-artifacts/release/latest.md`를 확인한다.
2. 구체적인 사용자 요청이 없으면 dormant roadmap 트랙을 자동으로 시작하지 않는다.
3. evaluation/self-dogfood를 재개한다면 먼저 doctor의 `refresh_runner_assessment` 경로를 따른다.
4. release infrastructure를 다시 건드린다면 release-page readiness와 asset readiness의 소유권을 먼저 정하고, `charness-artifacts/debug/latest.md`의 재현을 읽는다.

## Discuss

- PATH-level `cautilus` 갱신은 사용자 환경 mutation이므로 다음 작업에서 필요할 때 명시적으로 결정한다.
- Public release-notes asset에 operator story를 포함할지는 타당하지만 이 patch에서 의도적으로 미룬 release-infrastructure 결정이다.
- Claim-evidence audit의 47개 warning과 범용 `BuildReviewPromptInput` proof는 후속 후보이지 활성 약속이 아니다.
- FD5-frozen codex-provenance replay 클레임(`dev-repo-realsurface-routing`)은 여전히 find-skills를 historical로 담고 있다(의도적 유예; `find-skills-retirement-realign.md`의 landed note 참고). 현재 convention으로 재정렬할지는 별도 슬라이스 결정이다.
- 현재 `lint · specs` 병목에는 proof-preserving 최적화 seam이 확인되지 않았으므로 새 측정 없이 gate를 줄이거나 병렬화하지 않는다.

## References

- [Latest completed goal](../../charness-artifacts/goals/2026-07-11-fifth-autonomous-two-hour-improvement-release.md)
- [Release proof](../../charness-artifacts/release/latest.md)
- [Quality evidence](../../charness-artifacts/quality/latest.md)
- [Session retro](../../charness-artifacts/retro/2026-07-11-fifth-autonomous-two-hour-improvement-release-retro.md)
- [Release timing debug](../../charness-artifacts/debug/latest.md)
- [Product direction](../master-plan.md)

Refresh kept: `v0.19.3` public proof, no-active-track boundary, stale runner-assessment cue, PATH-level non-claim, and release asset-readiness ownership because each changes the next operator's first action.
Refresh non-claims: per-slice chronology, exact test outputs, and reviewer dialogue remain in git history and the owning goal, quality, critique, debug, retro, and release artifacts.
