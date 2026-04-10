# Cautilus Standalone Surface

`Cautilus`는 Ceal consumer migration 이전에 standalone binary와 bundled
skill로 설명 가능해야 한다.

Ceal의 기존 `workbench` 시나리오는 여전히 유용한 dogfood 입력이지만,
제품의 canonical surface는 이 repo 안에서 닫혀 있어야 한다.

## Source Guard

> check:source_guard
| file | mode | pattern |
| --- | --- | --- |
| README.md | fixed | standalone binary plus a bundled skill |
| README.md | fixed | intentful behavior evaluation |
| AGENTS.md | fixed | independent binary plus bundled skill |
| bin/cautilus | file_exists |  |
| bin/cautilus | fixed | cautilus doctor |
| bin/cautilus | fixed | scenario normalize chatbot |
| bin/cautilus | fixed | scenario normalize skill |
| bin/cautilus | fixed | scenario summarize-telemetry |
| bin/cautilus | fixed | scenario prepare-input |
| bin/cautilus | fixed | scenario propose |
| bin/cautilus | fixed | report build |
| bin/cautilus | fixed | mode evaluate |
| bin/cautilus | fixed | cli evaluate |
| bin/cautilus | fixed | review prepare-input |
| bin/cautilus | fixed | review build-prompt-input |
| bin/cautilus | fixed | review render-prompt |
| bin/cautilus | fixed | --version |
| bin/cautilus.test.mjs | file_exists |  |
| bin/cautilus.test.mjs | fixed | standalone temp repo can adopt cautilus without Ceal-owned paths |
| skills/cautilus/SKILL.md | file_exists |  |
| skills/cautilus/SKILL.md | fixed | node ./bin/cautilus adapter resolve --repo-root . |
| skills/cautilus/SKILL.md | fixed | node ./bin/cautilus doctor --repo-root . |
| skills/cautilus/SKILL.md | fixed | node ./bin/cautilus scenario normalize chatbot |
| skills/cautilus/SKILL.md | fixed | node ./bin/cautilus scenario normalize skill |
| skills/cautilus/SKILL.md | fixed | node ./bin/cautilus scenario summarize-telemetry |
| skills/cautilus/SKILL.md | fixed | node ./bin/cautilus scenario prepare-input |
| skills/cautilus/SKILL.md | fixed | node ./bin/cautilus scenario propose |
| skills/cautilus/SKILL.md | fixed | node ./bin/cautilus report build |
| skills/cautilus/SKILL.md | fixed | node ./bin/cautilus mode evaluate |
| skills/cautilus/SKILL.md | fixed | node ./bin/cautilus cli evaluate |
| skills/cautilus/SKILL.md | fixed | node ./bin/cautilus review prepare-input |
| skills/cautilus/SKILL.md | fixed | node ./bin/cautilus review build-prompt-input |
| skills/cautilus/SKILL.md | fixed | node ./bin/cautilus review render-prompt |
| skills/cautilus/SKILL.md | fixed | node ./bin/cautilus review variants |
| skills/cautilus/agents/openai.yaml | file_exists |  |
| skills/cautilus/agents/openai.yaml | fixed | Cautilus |
| docs/master-plan.md | fixed | standalone installable CLI plus bundled reusable skill |
| docs/master-plan.md | fixed | CLI behavior |

## Functional Check

현재 단계에서 standalone surface는 최소한 아래를 만족해야 한다.

- binary와 bundled skill이 같은 workflow entrypoint를 가리킨다.
- adapter resolve/init/doctor/scenario normalize chatbot/scenario normalize skill/scenario summarize-telemetry/scenario prepare-input/scenario propose/report build/mode evaluate/cli evaluate/review prepare-input/review build-prompt-input/review render-prompt/review variants는 Ceal-local script path 없이 설명된다.
- Ceal repoint는 제품 정의가 아니라 consumer migration 단계로 남아 있다.

```run:shell
$ node ./bin/cautilus --help
$ node ./bin/cautilus doctor --repo-root . || true
$ node ./bin/cautilus scenario normalize chatbot --input ./fixtures/scenario-proposals/chatbot-input.json
$ node ./bin/cautilus scenario normalize skill --input ./fixtures/scenario-proposals/skill-input.json
$ node ./bin/cautilus scenario summarize-telemetry --results ./fixtures/scenario-results/example-results.json || true
$ node ./bin/cautilus scenario prepare-input --candidates ./fixtures/scenario-proposals/candidates.json --registry ./fixtures/scenario-proposals/registry.json --coverage ./fixtures/scenario-proposals/coverage.json --family fast_regression --window-days 14 --now 2026-04-11T00:00:00.000Z
$ node ./bin/cautilus scenario propose --input ./fixtures/scenario-proposals/standalone-input.json
$ node ./bin/cautilus report build --input ./fixtures/reports/report-input.json
$ node ./bin/cautilus mode evaluate --repo-root . --mode held_out --intent "CLI behavior should remain legible." --baseline-ref origin/main --output-dir /tmp/cautilus-mode || true
$ node ./bin/cautilus cli evaluate --input ./fixtures/cli-evaluation/doctor-missing-adapter.json
$ node ./bin/cautilus review prepare-input --repo-root . --report-file ./fixtures/reports/report-input.json || true
$ node ./bin/cautilus review build-prompt-input --review-packet /tmp/cautilus-mode/review.json || true
$ node ./bin/cautilus review render-prompt --input /tmp/cautilus-mode/review-prompt-input.json || true
$ node ./bin/cautilus --version
$ node --test ./bin/cautilus.test.mjs
$ test -f skills/cautilus/SKILL.md
$ test -f skills/cautilus/agents/openai.yaml
```
