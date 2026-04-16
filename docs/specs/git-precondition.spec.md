# Git Precondition and Runtime Selection

`Cautilus`는 git repo를 전제로 동작한다.
Worktree 기반 A/B, ref 고정, review packet의 커밋 해시 참조 모두 git 위에서만 의미가 있다.
이 spec은 그 전제를 doctor에서 명시적으로 검증하고, skill test의 런타임 선택을 제품 표면으로 올린다.

## Git Precondition in Doctor

### 결정

- `cautilus doctor --scope repo`는 adapter 체크 **이전에** git precondition을 검증한다.
- 두 체크: `git_repo` (git 저장소인가), `git_has_commits` (최소 1 커밋이 있는가).
- 실패 시 early return — adapter 체크를 진행하지 않는다.
- next_steps 안내는 `.gitignore` 설정을 먼저 안내하고, `git add -A` 같은 일괄 스테이징을 **절대 제안하지 않는다**.
  대용량 파일, 하위 모듈, 민감 파일 사고를 사전에 방지하기 위함이다.

### Doctor 출력 형태

`git_repo` 실패:

```json
{
  "status": "missing_git",
  "ready": false,
  "summary": "Not a git repository.",
  "checks": [
    { "id": "git_repo", "ok": false, "detail": "This directory is not a git repository." }
  ],
  "suggestions": [
    "Run git init to initialize a repository.",
    "Set up a .gitignore before your first commit to avoid tracking large or sensitive files."
  ]
}
```

`git_has_commits` 실패:

```json
{
  "status": "no_commits",
  "ready": false,
  "summary": "Git repository has no commits.",
  "checks": [
    { "id": "git_repo", "ok": true, "detail": "This directory is a git repository." },
    { "id": "git_has_commits", "ok": false, "detail": "Git repository has no commits yet." }
  ],
  "suggestions": [
    "Set up a .gitignore first, then create your initial commit."
  ]
}
```

### 의도적으로 하지 않는 것

- `.gitignore` 내용 검증 — doctor가 판단할 범위가 아니다.
- `git add` 명령 제안 — 무엇을 커밋할지는 사용자 판단이다.
- non-git 환경용 `/tmp` 복사 폴백 — git init를 강제한다.

## Runtime Selection in Skill Test

### 결정

- `run-local-skill-test.mjs`에 `--backend claude_code` 백엔드를 추가한다.
- `claude -p`를 통해 프롬프트를 전달하고, 출력에서 JSON을 추출한다.
- `claude`는 `--output-schema`가 없으므로 프롬프트에 스키마를 명시하고 응답에서 JSON 블록을 파싱한다.
- `cautilus skill test`에 `--runtime codex|claude` 플래그를 추가한다.
- 어댑터에 `default_runtime` 필드를 둔다 (선택적, 기본값 codex).
- CLI `--runtime`이 어댑터 기본값을 오버라이드한다.
- `{backend}` 플레이스홀더를 skill_test_command_templates에서 사용할 수 있게 한다.
- 결과 아티팩트에 런타임 이름과 버전을 기록한다.

### 런타임 매핑

| `--runtime` | `--backend` 값 | 실행 바이너리 |
| --- | --- | --- |
| codex | codex_exec | `codex exec` |
| claude | claude_code | `claude -p` |

### 의도적으로 하지 않는 것

- 크로스 런타임 컨센서스 — 한 번에 하나의 프로바이더만 선택한다.
- 런타임별 모델 자동 매핑 — 모델은 여전히 어댑터 템플릿이 명시한다.

## Source Guard

> check:source_guard
| file | mode | pattern |
| --- | --- | --- |
| internal/runtime/adapter.go | fixed | git_repo |
| internal/runtime/adapter.go | fixed | git_has_commits |
| internal/runtime/adapter.go | fixed | missing_git |
| internal/runtime/adapter.go | fixed | no_commits |
| internal/runtime/adapter.go | fixed | .gitignore |
| internal/app/cli_smoke_test.go | fixed | TestCLIDoctorReportsGitPreconditionFailureForNonGitDirectory |
| internal/app/cli_smoke_test.go | fixed | TestCLIDoctorReportsNoCommitsForEmptyGitRepo |
| scripts/agent-runtime/run-local-skill-test.mjs | fixed | claude_code |
| scripts/agent-runtime/skill-test-claude-backend.mjs | file_exists |  |
| scripts/agent-runtime/skill-test-claude-backend.mjs | fixed | runClaudeSample |
| scripts/agent-runtime/skill-test-claude-backend.mjs | fixed | parseClaudeOutput |
