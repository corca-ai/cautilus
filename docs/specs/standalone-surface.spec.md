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
| AGENTS.md | fixed | independent binary plus bundled skill |
| bin/cautilus | file_exists |  |
| bin/cautilus | fixed | cautilus doctor |
| skills/cautilus/SKILL.md | file_exists |  |
| skills/cautilus/SKILL.md | fixed | node ./bin/cautilus adapter resolve --repo-root . |
| skills/cautilus/SKILL.md | fixed | node ./bin/cautilus doctor --repo-root . |
| skills/cautilus/SKILL.md | fixed | node ./bin/cautilus review variants |
| skills/cautilus/agents/openai.yaml | file_exists |  |
| skills/cautilus/agents/openai.yaml | fixed | Cautilus |
| docs/master-plan.md | fixed | standalone installable CLI plus bundled reusable skill |

## Functional Check

현재 단계에서 standalone surface는 최소한 아래를 만족해야 한다.

- binary와 bundled skill이 같은 workflow entrypoint를 가리킨다.
- adapter resolve/init/doctor/review variants는 Ceal-local script path 없이 설명된다.
- Ceal repoint는 제품 정의가 아니라 consumer migration 단계로 남아 있다.

```run:shell
$ node ./bin/cautilus --help
$ node ./bin/cautilus doctor --repo-root . || true
$ test -f skills/cautilus/SKILL.md
$ test -f skills/cautilus/agents/openai.yaml
```
