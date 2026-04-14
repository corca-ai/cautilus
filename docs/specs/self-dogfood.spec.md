# Cautilus Self Dogfood

`Cautilus`는 자기 자신에 대해 cheap deterministic gate와 explicit
LLM-backed self-dogfood를 분리해서 운영해야 한다.

`npm run verify`와 hook/CI는 standing gate로 남기고, self-dogfood는
operator가 quality를 명시적으로 돌릴 때만 실행한다.
specdown은 expensive run을 다시 실행하는 대신, 마지막 recorded result의
artifact 위치를 현재 계약으로 보여준다.

canonical latest report의 claim은 좁아야 한다. 기본 `dogfood:self`는
"self-dogfood result를 정직하게 기록하고 surfaced 하는가"를 말하고,
standalone binary 또는 bundled skill 같은 stronger surface claim은
named experiment adapter에서 따로 다룬다.

## Source Guard

> check:source_guard
| file | mode | pattern |
| --- | --- | --- |
| .agents/cautilus-adapter.yaml | file_exists |  |
| .agents/cautilus-adapter.yaml | fixed | full_gate_command_templates |
| .agents/cautilus-adapter.yaml | fixed | npm run verify |
| .agents/cautilus-adapters/self-dogfood.yaml | file_exists |  |
| .agents/cautilus-adapters/self-dogfood.yaml | fixed | executor_variants |
| .agents/cautilus-adapters/self-dogfood.yaml | fixed | codex-review |
| .agents/cautilus-adapters/self-dogfood.yaml | fixed | review_timeout_ms |
| .agents/cautilus-adapters/self-dogfood.yaml | fixed | scripts/run-self-dogfood.mjs |
| .agents/cautilus-adapters/self-dogfood-binary-surface.yaml | file_exists |  |
| .agents/cautilus-adapters/self-dogfood-binary-surface.yaml | fixed | docs/consumer-readiness.md |
| .agents/cautilus-adapters/self-dogfood-binary-surface.yaml | fixed | scripts/on-demand/run-self-dogfood.test.mjs |
| .agents/cautilus-adapters/self-dogfood-gate-honesty-a.yaml | file_exists |  |
| .agents/cautilus-adapters/self-dogfood-gate-honesty-b.yaml | file_exists |  |
| .agents/cautilus-adapters/self-dogfood-skill-surface.yaml | file_exists |  |
| .agents/cautilus-adapters/self-dogfood-review-completion.yaml | file_exists |  |
| .agents/quality-adapter.yaml | file_exists |  |
| .agents/quality-adapter.yaml | fixed | ./bin/cautilus adapter resolve --repo-root . |
| .agents/quality-adapter.yaml | fixed | npm run dogfood:self |
| package.json | fixed | "dogfood:self" |
| package.json | fixed | "dogfood:self:experiments" |
| package.json | fixed | "dogfood:self:html" |
| package.json | fixed | "dogfood:self:experiments:html" |
| scripts/run-self-dogfood.mjs | file_exists |  |
| scripts/run-self-dogfood.mjs | fixed | latest.md |
| scripts/run-self-dogfood.mjs | fixed | self-dogfood render-html |
| scripts/run-self-dogfood.mjs | fixed | gateRecommendation |
| scripts/run-self-dogfood.mjs | fixed | reportRecommendation |
| scripts/self-dogfood-published-snapshot.mjs | file_exists |  |
| scripts/self-dogfood-published-snapshot.mjs | fixed | selfDogfoodPublication |
| artifacts/self-dogfood/latest/report.json | fixed | selfDogfoodPublication |
| scripts/self-dogfood-experiment-prompt.mjs | file_exists |  |
| scripts/self-dogfood-experiment-prompt.mjs | fixed | Current Run Evidence |
| scripts/self-dogfood-experiment-prompt.mjs | fixed | projected summary.json |
| scripts/self-dogfood-experiment-prompt.mjs | fixed | gateRecommendation |
| scripts/on-demand/run-self-dogfood.test.mjs | file_exists |  |
| scripts/on-demand/run-self-dogfood.test.mjs | fixed | root self-consumer quality path |
| internal/runtime/self_dogfood_html.go | file_exists |  |
| internal/runtime/self_dogfood_html.go | fixed | Cautilus Self-Dogfood |
| internal/runtime/self_dogfood_html.go | fixed | A/B Comparison |
| internal/runtime/self_dogfood_html_test.go | file_exists |  |
| scripts/run-self-dogfood-experiments.mjs | file_exists |  |
| scripts/run-self-dogfood-experiments.mjs | fixed | DEFAULT_EXPERIMENT_ADAPTERS |
| scripts/run-self-dogfood-experiments.mjs | fixed | gateRecommendation |
| scripts/run-self-dogfood-experiments.mjs | fixed | reportRecommendation |
| scripts/run-self-dogfood-experiments.mjs | fixed | self-dogfood render-experiments-html |
| scripts/on-demand/run-self-dogfood-experiments.test.mjs | file_exists |  |
| scripts/self-dogfood-experiment-prompt.mjs | file_exists |  |
| README.md | fixed | npm run dogfood:self |
| README.md | fixed | artifacts/self-dogfood/latest/ |
| README.md | fixed | npm run dogfood:self:experiments |
| README.md | fixed | npm run dogfood:self:html |
| README.md | fixed | npm run dogfood:self:experiments:html |
| README.md | fixed | cautilus self-dogfood render-html |
| README.md | fixed | cautilus self-dogfood render-experiments-html |
| skills/cautilus/SKILL.md | fixed | npm run dogfood:self |
| skills/cautilus/SKILL.md | fixed | npm run dogfood:self:experiments |
| skills/cautilus/SKILL.md | fixed | npm run dogfood:self:html |
| skills/cautilus/SKILL.md | fixed | npm run dogfood:self:experiments:html |
| internal/cli/command-registry.json | fixed | "path": ["self-dogfood", "render-html"] |
| internal/cli/command-registry.json | fixed | "path": ["self-dogfood", "render-experiments-html"] |
| .gitignore | fixed | !artifacts/self-dogfood/latest/summary.json |
| .gitignore | fixed | !artifacts/self-dogfood/latest/index.html |

## Functional Check

Self-dogfood는 standing gate가 아니라 explicit quality path다.
최소한 아래 command surface가 현재 repo에서 설명 가능해야 한다.

```run:shell
$ cautilus doctor --repo-root .
$ npm run dogfood:self
$ npm run dogfood:self:experiments
```

## Latest Recorded Result

The latest explicit self-dogfood bundle should be written to these stable
paths:

- `artifacts/self-dogfood/latest/summary.json`
- `artifacts/self-dogfood/latest/report.json`
- `artifacts/self-dogfood/latest/review-summary.json`
- `artifacts/self-dogfood/latest/latest.md`
- `artifacts/self-dogfood/latest/index.html`

These five files are the published latest snapshot.
They should be stable enough to check into Git so CI, GitHub, and HTML report
renderers can inspect the latest self-dogfood result without replaying the
expensive review run.

The published `report.json` should also carry enough folded self-dogfood
context that an operator or review model can understand the surfaced claim
without opening `summary.json` first.
At minimum it should expose:

- a `selfDogfoodPublication` object
- the latest published artifact paths
- the raw deterministic `gateRecommendation`
- the folded final `reportRecommendation`
- the final `overallStatus`

`index.html` is a self-contained static view of the same three JSON files
(`summary.json`, `report.json`, `review-summary.json`). It is regenerated by
`cautilus self-dogfood render-html` every time `dogfood:self` refreshes the
latest bundle, and it can be regenerated independently through
`npm run dogfood:self:html` or `cautilus self-dogfood render-html` without
replaying the LLM-backed review. Operators should treat the JSON files as the
source of truth and not hand-edit `index.html` directly.

Per-run mode stdout/stderr, prompt artifacts, and review scratch files should
stay under `artifacts/self-dogfood/runs/` as local generated artifacts rather
than being copied into the checked-in latest snapshot.

The latest experiment bundle should be written to these stable paths:

- `artifacts/self-dogfood/experiments/latest/summary.json`
- `artifacts/self-dogfood/experiments/latest/report.json`
- `artifacts/self-dogfood/experiments/latest/latest.md`
- `artifacts/self-dogfood/experiments/latest/index.html`

When experiments are present, the surface must let operators compare the
deterministic gate baseline and each named experiment in one place. A/B results
must not be surfaced only as isolated per-adapter summaries that require manual
diffing.

The standing spec gate does not rerun the LLM-backed review. It only keeps the
contract, command surface, and latest-artifact paths honest.

The latest summaries should distinguish the raw deterministic gate
recommendation from the final self-dogfood recommendation:

- `gateRecommendation`: what the cheap mode gate recommended on its own
- `reportRecommendation`: what operators should trust after the explicit
  self-dogfood verdict is folded in

Named experiments may carry stronger claims such as:

- gate honesty
- standalone binary surface
- bundled skill surface
- review completion
