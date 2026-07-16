# Cautilus Handoff

## Workflow Trigger

권장 호출(다음 세션): `@docs/internal/handoff.md 핸드오프대로 진행 — 먼저 charness:handoff로 현재 상태를 확인하고, 구체적인 새 요청이 없으면 자동 착수하지 않는다.`

mention-only 픽업이면 `charness:handoff`로 이 baton과 최신 goal/release 상태를 확인한다.
구체적인 작업 요청이 함께 있으면 그 요청이 우선한다.

## Current State

- 현재 활성 구현 트랙은 없다.
- 공개 릴리스는 `v0.20.0`(minor)이며 workflow(run `29486505150`), 7개 asset/checksum, distinct-channel(HTTP 200) verify, install.sh 스모크(`0.20.0`), Linux x64 attestation이 통과했다.
- `v0.20.0`은 여섯 번째 자율 개선 번들이다: 한 개의 유저 허가 breaking 스키마 리네임 + non-breaking gate/correctness/dead-code/doc 묶음.
  - **Breaking**: live-target 발견 스키마 `cautilus.workbench_instance_catalog.v1` → `cautilus.live_target_catalog.v1`. `discover live-targets`는 옛 schemaVersion을 actionable rename error로 거부한다. `kind: command` 소비자는 `command_template` 출력을 새 스키마로 바꿔야 한다(`kind: explicit`는 무변경). 마이그레이션 노트는 `charness-artifacts/release/latest.md`.
  - Non-breaking: coverage-floor fail-closed(floored-but-absent), 죽은 `git_hooks.go` 삭제, SemVer 11.4 prerelease 비교 수정, README/spec 자기일관성.
- canonical 릴리스 증거와 breaking-change 마이그레이션 노트는 `charness-artifacts/release/latest.md`가 소유한다.
- 이번 세션의 품질 증명(broad verify + pre-push + 두 위임 리뷰 + 공개 검증)은 goal의 `## Final Verification`이 소유한다. `charness-artifacts/quality/latest.md`는 직전 packaged-mirror parity 리뷰를 담은 standing 문서로 남는다. 47개 claim-evidence 경고는 여전히 warn-only이며 리네임 후에도 세탁되지 않았다.
- 이번 세션에서 확립한 두 운영 패턴(가드된 외부 명령 중 워크트리 freeze; 다중 pathspec `git add` 후 스테이징 확인)은 `docs/internal/working-patterns.md`에 기록됐다.
- PATH의 `cautilus`는 이 세션에서 전역 갱신하지 않았다. 격리된 install.sh 스모크는 `0.20.0`을 확인했지만 사용자 전역 설치 상태와 같다고 주장하지 않는다.

## Next Session

1. `git status --short --branch`, `charness-artifacts/goals/2026-07-16-sixth-autonomous-improvement-release.md`, `charness-artifacts/release/latest.md`를 확인한다.
2. 구체적인 사용자 요청이 없으면 dormant roadmap 트랙을 자동으로 시작하지 않는다.
3. breaking 리네임 후속: `workbench`는 master-plan이 미래 GUI용으로 예약한 이름이다. 내부 파일/디렉토리(`workbench_commands.go`, `fixtures/workbench-instance-discovery/`, `workbench-instance-discovery.md`)는 의도적으로 유지했다 — 별도 vocab 패스로 리네임할지는 결정 대상.
4. release infrastructure를 다시 건드린다면 가드된 publish 중 워크트리를 건드리지 않는다(`working-patterns.md`의 새 패턴 참고).

## Discuss

- PATH-level `cautilus` 갱신은 사용자 환경 mutation이므로 다음 작업에서 필요할 때 명시적으로 결정한다.
- Public release-notes asset에 operator story를 포함할지는 타당하지만 이 patch에서 의도적으로 미룬 release-infrastructure 결정이다.
- Claim-evidence audit의 47개 warning과 범용 `BuildReviewPromptInput` proof는 후속 후보이지 활성 약속이 아니다.
- FD5-frozen codex-provenance replay 클레임(`dev-repo-realsurface-routing`)은 여전히 find-skills를 historical로 담고 있다(의도적 유예; `find-skills-retirement-realign.md`의 landed note 참고). 현재 convention으로 재정렬할지는 별도 슬라이스 결정이다.
- 현재 `lint · specs` 병목에는 proof-preserving 최적화 seam이 확인되지 않았으므로 새 측정 없이 gate를 줄이거나 병렬화하지 않는다.

## References

- [Latest completed goal](../../charness-artifacts/goals/2026-07-16-sixth-autonomous-improvement-release.md)
- [Release proof](../../charness-artifacts/release/latest.md)
- [Quality evidence](../../charness-artifacts/quality/latest.md)
- [Session retro](../../charness-artifacts/retro/2026-07-16-sixth-autonomous-improvement-and-v0-20-0-breaking-rename-release.md)
- [Bundle disposition](../../charness-artifacts/critique/2026-07-16-sixth-autonomous-improvement-release-disposition.md)
- [v0.20.0 release critique](../../charness-artifacts/critique/2026-07-16-v0-20-0-release-critique.md)
- [Product direction](../master-plan.md)

Refresh kept: `v0.20.0` public proof, the breaking rename + migration boundary, no-active-track boundary, the reserved-`workbench` follow-up, PATH-level non-claim, and the two new guarded-command/`git add` operating patterns because each changes the next operator's first action.
Refresh non-claims: per-slice chronology, exact test outputs, and reviewer dialogue remain in git history and the owning goal, quality, critique, retro, and release artifacts.
