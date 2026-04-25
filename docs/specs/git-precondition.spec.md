# Git Preconditions And Runtime Choice

`Cautilus` assumes a git-backed repo when it evaluates a host workspace.
Worktree-based comparisons, baseline refs, and review packets all depend on that assumption.
`doctor` should therefore fail early with an explicit status when the repo is missing or has no commits.

`eval test` also exposes a small user-facing runtime choice.
The deeper backend behavior is covered by lower-level tests, but the public command contract should still reject invalid runtime names before doing work.

## Executable Proof

```run:shell
# Fail early outside git, fail clearly in an empty git repo, and reject invalid runtime names.
tmpdir=$(mktemp -d)
./bin/cautilus doctor --repo-root "$tmpdir" >"$tmpdir/missing-git.json" 2>&1 || true
grep -q '"status": "missing_git"' "$tmpdir/missing-git.json"
git -C "$tmpdir" init >/dev/null 2>&1
./bin/cautilus doctor --repo-root "$tmpdir" >"$tmpdir/no-commits.json" 2>&1 || true
grep -q '"status": "no_commits"' "$tmpdir/no-commits.json"
./bin/cautilus eval test --repo-root . --adapter-name self-dogfood-eval-skill --runtime banana >"$tmpdir/runtime.txt" 2>&1 || true
grep -q -- '--runtime must be codex or claude' "$tmpdir/runtime.txt"
```
