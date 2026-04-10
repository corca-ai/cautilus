# Quality Review

Date: 2026-04-10

## Scope

Review repo-wide quality posture with emphasis on missing `pre-push`, test
coverage confidence, and duplicate tests or code.

## Commands Run

- `git status --short`
- `node ./bin/cautilus adapter resolve --repo-root .`
- `node ./bin/cautilus doctor --repo-root .`
- `npm run verify`
- `node --test --experimental-test-coverage bin/*.test.mjs scripts/*.test.mjs scripts/agent-runtime/*.test.mjs scripts/release/*.test.mjs`
- ad-hoc duplicate-shingle scans across `*.mjs` and `*.test.mjs`

## Runtime Signals

- `npm run verify` passed with `111` tests and `spec checks passed (3 specs,
  271 guard rows)`.
- `doctor` failed only because this repo intentionally has no checked-in
  `cautilus` adapter; that is product state, not a broken repo gate.
- Test coverage from Node's built-in reporter reached `88.47%` lines,
  `64.82%` branches, `92.12%` functions overall.
- Lowest-confidence runtime seams are release helpers
  (`fetch-github-archive-sha256.mjs` `21.88%` lines,
  `render-homebrew-formula.mjs` `36.28%`) and several proposal/evidence CLI
  wrappers in the `67-78%` range.
- Duplicate-window scans showed real structural repetition:
  `normalize-{chatbot,cli,skill}-proposals.mjs` are near-clones, and schema
  contract tests share one repeated harness shape.

## Healthy

- The standing repo gate remains cheap and real: `npm run verify`.
- A checked-in `.githooks/pre-push` now runs `npm run verify` from repo root.
- Repo-owned `hooks:install` and `hooks:check` scripts plus executable tests
  now make maintainer-local hook setup deterministic instead of tribal
  knowledge.
- Existing test volume is broad at the boundary level: CLI entrypoints,
  contract builders, spec checks, packaging, and distribution surfaces all have
  executable coverage.

## Weak

- Overall line coverage looks healthy, but branch coverage at `64.82%` leaves
  plenty of unhappy-path logic unproved.
- `bin/cautilus.test.mjs` is `1627` lines, which makes boundary confidence
  dense but hard to maintain and easy to duplicate incidentally.
- Release helper tests are still mostly renderer/syntax checks rather than
  behavior-heavy proof.
- Schema contract tests repeat the same harness pattern across multiple files.

## Missing

- No deterministic duplicate-budget gate exists yet for repeated helper shells
  or repeated schema-test harnesses.
- No coverage threshold gate exists, so low-value files can stay undercovered
  as long as the suite stays green.

## Recommended Next Gates

- `AUTO_EXISTING`: keep `npm run verify` as the shared code/test gate and
  `npm run hooks:check` as the maintainer-local hook validator.
- `AUTO_CANDIDATE`: extract one shared normalization CLI wrapper behind
  `normalize-{chatbot,cli,skill}-proposals.mjs` to remove a measured duplicate
  seam.
- `AUTO_CANDIDATE`: collapse repeated schema contract tests into one shared
  test helper so new schema families add assertions, not another full harness.
- `AUTO_CANDIDATE`: add a narrow coverage floor for the weakest maintained
  seams first, especially release helpers and proposal/evidence CLI wrappers.
