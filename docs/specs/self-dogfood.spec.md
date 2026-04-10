# Cautilus Self Dogfood

`Cautilus`는 자기 자신에 대해 cheap deterministic gate와 explicit
LLM-backed self-dogfood를 분리해서 운영해야 한다.

`npm run verify`와 hook/CI는 standing gate로 남기고, self-dogfood는
operator가 quality를 명시적으로 돌릴 때만 실행한다.
specdown은 expensive run을 다시 실행하는 대신, 마지막 recorded result의
artifact 위치를 현재 계약으로 보여준다.

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
| .agents/quality-adapter.yaml | file_exists |  |
| .agents/quality-adapter.yaml | fixed | npm run dogfood:self |
| package.json | fixed | "dogfood:self" |
| scripts/run-self-dogfood.mjs | file_exists |  |
| scripts/run-self-dogfood.mjs | fixed | latest.md |
| scripts/run-self-dogfood.test.mjs | file_exists |  |
| README.md | fixed | npm run dogfood:self |
| README.md | fixed | artifacts/self-dogfood/latest/ |
| skills/cautilus/SKILL.md | fixed | npm run dogfood:self |
| .gitignore | fixed | artifacts/self-dogfood/ |

## Functional Check

Self-dogfood는 standing gate가 아니라 explicit quality path다.
최소한 아래 command surface가 현재 repo에서 설명 가능해야 한다.

```run:shell
$ node ./bin/cautilus doctor --repo-root .
$ npm run dogfood:self
```

## Latest Recorded Result

The latest explicit self-dogfood bundle should be written to these stable
paths:

- `artifacts/self-dogfood/latest/summary.json`
- `artifacts/self-dogfood/latest/report.json`
- `artifacts/self-dogfood/latest/review-summary.json`
- `artifacts/self-dogfood/latest/latest.md`

The standing spec gate does not rerun the LLM-backed review. It only keeps the
contract, command surface, and latest-artifact paths honest.
