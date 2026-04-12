# Cautilus Standalone Surface

`Cautilus`는 Ceal consumer migration 이전에 standalone binary와 bundled
skill로 설명 가능해야 한다.

Ceal의 기존 `workbench` 시나리오는 여전히 유용한 dogfood 입력이지만,
제품의 canonical surface는 이 repo 안에서 닫혀 있어야 한다.
여기서 `Source Guard`는 standing cheap gate이고, `Functional Check`는
standalone acceptance boundary만 남긴다.

## Source Guard

> check:source_guard
| file | mode | pattern |
| --- | --- | --- |
| README.md | fixed | standalone binary plus a bundled skill |
| README.md | fixed | intentful behavior evaluation |
| AGENTS.md | fixed | independent binary plus bundled skill |
| bin/cautilus | file_exists |  |
| go.mod | file_exists |  |
| go.mod | fixed | module github.com/corca-ai/cautilus |
| cmd/cautilus/main.go | file_exists |  |
| cmd/cautilus/main.go | fixed | app.Run |
| bin/cautilus | fixed | CAUTILUS_TOOL_ROOT |
| bin/cautilus | fixed | exec go -C |
| internal/cli/command-registry.json | file_exists |  |
| internal/cli/command-registry.json | fixed | cautilus doctor [args] |
| internal/cli/command-registry.json | fixed | "path": ["version"] |
| internal/cli/command-registry.json | fixed | "path": ["skills", "install"] |
| internal/cli/command-registry.json | fixed | "path": ["scenario", "summarize-telemetry"] |
| .claude-plugin/marketplace.json | file_exists |  |
| .agents/plugins/marketplace.json | file_exists |  |
| plugins/cautilus/.claude-plugin/plugin.json | file_exists |  |
| plugins/cautilus/.codex-plugin/plugin.json | file_exists |  |
| bin/cautilus | fixed | CAUTILUS_CALLER_CWD |
| bin/cautilus.test.mjs | file_exists |  |
| bin/cautilus.test.mjs | fixed | repo shim forwards --version to the Go CLI entry |
| bin/cautilus.test.mjs | fixed | repo shim preserves caller cwd while resolving doctor against a consumer repo |
| bin/cautilus.test.mjs | fixed | repo shim keeps bundled skills install working from a consumer repo |
| skills/bundled.go | file_exists |  |
| skills/bundled.go | fixed | go:embed cautilus |
| internal/app/cli_smoke_test.go | file_exists |  |
| internal/app/cli_smoke_test.go | fixed | TestCLIRootSelfConsumerRepoStaysDoctorReady |
| internal/app/cli_smoke_test.go | fixed | TestCLIStandaloneTempRepoCanAdoptCautilusWithoutCealPaths |
| internal/app/cli_smoke_test.go | fixed | TestCLISkillsInstallCreatesRepoLocalCanonicalSkill |
| skills/cautilus/SKILL.md | file_exists |  |
| skills/cautilus/SKILL.md | fixed | cautilus skills install |
| skills/cautilus/SKILL.md | fixed | cautilus adapter resolve --repo-root . |
| skills/cautilus/SKILL.md | fixed | cautilus doctor --repo-root . |
| skills/cautilus/SKILL.md | fixed | cautilus workspace prepare-compare |
| skills/cautilus/SKILL.md | fixed | cautilus workspace prune-artifacts |
| skills/cautilus/SKILL.md | fixed | eval "$(cautilus workspace start --label mode-held-out)" |
| skills/cautilus/SKILL.md | fixed | cautilus scenario normalize chatbot |
| skills/cautilus/SKILL.md | fixed | cautilus scenario normalize cli |
| skills/cautilus/SKILL.md | fixed | cautilus scenario normalize skill |
| skills/cautilus/SKILL.md | fixed | cautilus scenario summarize-telemetry |
| skills/cautilus/SKILL.md | fixed | cautilus scenario prepare-input |
| skills/cautilus/SKILL.md | fixed | cautilus scenario propose |
| skills/cautilus/SKILL.md | fixed | cautilus evidence prepare-input |
| skills/cautilus/SKILL.md | fixed | cautilus evidence bundle |
| skills/cautilus/SKILL.md | fixed | cautilus report build |
| skills/cautilus/SKILL.md | fixed | cautilus mode evaluate |
| skills/cautilus/SKILL.md | fixed | cautilus optimize prepare-input |
| skills/cautilus/SKILL.md | fixed | cautilus optimize propose |
| skills/cautilus/SKILL.md | fixed | cautilus optimize build-artifact |
| skills/cautilus/SKILL.md | fixed | cautilus cli evaluate |
| skills/cautilus/SKILL.md | fixed | cautilus review prepare-input |
| skills/cautilus/SKILL.md | fixed | cautilus review build-prompt-input |
| skills/cautilus/SKILL.md | fixed | cautilus review render-prompt |
| skills/cautilus/SKILL.md | fixed | cautilus review variants |
| skills/cautilus/agents/openai.yaml | file_exists |  |
| skills/cautilus/agents/openai.yaml | fixed | Cautilus |
| plugins/cautilus/skills/cautilus/SKILL.md | file_exists |  |
| plugins/cautilus/skills/cautilus/SKILL.md | fixed | cautilus skills install |
| plugins/cautilus/skills/cautilus/SKILL.md | fixed | cautilus adapter resolve --repo-root . |
| plugins/cautilus/skills/cautilus/SKILL.md | fixed | cautilus doctor --repo-root . |
| plugins/cautilus/skills/cautilus/SKILL.md | fixed | cautilus workspace prepare-compare |
| plugins/cautilus/skills/cautilus/SKILL.md | fixed | cautilus workspace prune-artifacts |
| plugins/cautilus/skills/cautilus/SKILL.md | fixed | eval "$(cautilus workspace start --label mode-held-out)" |
| plugins/cautilus/skills/cautilus/SKILL.md | fixed | cautilus scenario normalize chatbot |
| plugins/cautilus/skills/cautilus/SKILL.md | fixed | cautilus scenario normalize cli |
| plugins/cautilus/skills/cautilus/SKILL.md | fixed | cautilus scenario normalize skill |
| plugins/cautilus/skills/cautilus/SKILL.md | fixed | cautilus scenario summarize-telemetry |
| plugins/cautilus/skills/cautilus/SKILL.md | fixed | cautilus scenario prepare-input |
| plugins/cautilus/skills/cautilus/SKILL.md | fixed | cautilus scenario propose |
| plugins/cautilus/skills/cautilus/SKILL.md | fixed | cautilus evidence prepare-input |
| plugins/cautilus/skills/cautilus/SKILL.md | fixed | cautilus evidence bundle |
| plugins/cautilus/skills/cautilus/SKILL.md | fixed | cautilus report build |
| plugins/cautilus/skills/cautilus/SKILL.md | fixed | cautilus mode evaluate |
| plugins/cautilus/skills/cautilus/SKILL.md | fixed | cautilus optimize prepare-input |
| plugins/cautilus/skills/cautilus/SKILL.md | fixed | cautilus optimize propose |
| plugins/cautilus/skills/cautilus/SKILL.md | fixed | cautilus optimize build-artifact |
| plugins/cautilus/skills/cautilus/SKILL.md | fixed | cautilus cli evaluate |
| plugins/cautilus/skills/cautilus/SKILL.md | fixed | cautilus review prepare-input |
| plugins/cautilus/skills/cautilus/SKILL.md | fixed | cautilus review build-prompt-input |
| plugins/cautilus/skills/cautilus/SKILL.md | fixed | cautilus review render-prompt |
| plugins/cautilus/skills/cautilus/SKILL.md | fixed | cautilus review variants |
| plugins/cautilus/skills/cautilus/agents/openai.yaml | file_exists |  |
| plugins/cautilus/skills/cautilus/agents/openai.yaml | fixed | Cautilus |
| install.sh | fixed | releases/download/$VERSION/$ASSET_NAME |
| install.sh | fixed | need_cmd uname |
| scripts/release/binary-assets.mjs | file_exists |  |
| scripts/release/binary-assets.mjs | fixed | binaryAssetName |
| docs/master-plan.md | fixed | standalone installable CLI plus bundled reusable skill |
| docs/master-plan.md | fixed | CLI behavior |

## Functional Check

현재 단계에서 standalone surface는 최소한 아래를 만족해야 한다.

- binary와 bundled skill이 같은 workflow entrypoint를 가리킨다.
- host repo는 `cautilus skills install`로 canonical `.agents/skills/cautilus` surface를 materialize할 수 있다.
- packaged local skill surface는 repo-local Codex/Claude marketplace로도 설명된다.
- adapter resolve/init/doctor/workspace prepare-compare/workspace prune-artifacts/workspace start/scenario normalize chatbot/scenario normalize cli/scenario normalize skill/scenario summarize-telemetry/scenario prepare-input/scenario propose/evidence prepare-input/evidence bundle/report build/mode evaluate/optimize prepare-input/optimize propose/optimize build-artifact/cli evaluate/review prepare-input/review build-prompt-input/review render-prompt/review variants는 Ceal-local script path 없이 설명된다.
- Ceal repoint는 제품 정의가 아니라 consumer migration 단계로 남아 있다.

```run:shell
$ cautilus --help
$ cautilus doctor --repo-root .
$ cautilus workspace prepare-compare --repo-root . --baseline-ref origin/main --output-dir /tmp/cautilus-compare || true
$ cautilus workspace prune-artifacts --root /tmp/cautilus-runs --keep-last 20 || true
$ mkdir -p /tmp/cautilus-runs
$ cautilus workspace start --root /tmp/cautilus-runs --label mode-held-out --json || true
$ cautilus scenario normalize chatbot --input ./fixtures/scenario-proposals/chatbot-input.json
$ cautilus scenario normalize cli --input ./fixtures/scenario-proposals/cli-input.json
$ cautilus scenario normalize skill --input ./fixtures/scenario-proposals/skill-input.json
$ cautilus scenario summarize-telemetry --results ./fixtures/scenario-results/example-results.json || true
$ cautilus scenario prepare-input --candidates ./fixtures/scenario-proposals/candidates.json --registry ./fixtures/scenario-proposals/registry.json --coverage ./fixtures/scenario-proposals/coverage.json --family fast_regression --window-days 14 --now 2026-04-11T00:00:00.000Z
$ cautilus scenario propose --input ./fixtures/scenario-proposals/standalone-input.json
$ cautilus evidence prepare-input --report-file ./fixtures/reports/report-input.json --scenario-results-file ./fixtures/scenario-results/example-results.json || true
$ cautilus evidence bundle --input ./fixtures/evidence/example-input.json
$ cautilus report build --input ./fixtures/reports/report-input.json
$ cautilus mode evaluate --repo-root . --mode held_out --intent "CLI behavior should remain legible." --baseline-ref origin/main --output-dir /tmp/cautilus-mode || true
$ cautilus optimize prepare-input --report-file ./fixtures/reports/report-input.json --target prompt --optimizer repair --budget light || true
$ cautilus optimize propose --input ./fixtures/optimize/example-input.json
$ cautilus optimize build-artifact --proposal-file ./fixtures/optimize/example-proposal.json --input-file ./fixtures/optimize/example-input.json
$ cautilus cli evaluate --input ./fixtures/cli-evaluation/doctor-missing-adapter.json
$ cautilus review prepare-input --repo-root . --report-file ./fixtures/reports/report-input.json || true
$ cautilus review build-prompt-input --review-packet /tmp/cautilus-mode/review.json || true
$ cautilus review render-prompt --input /tmp/cautilus-mode/review-prompt-input.json || true
$ cautilus --version
$ cautilus version --verbose
$ node --test ./bin/cautilus.test.mjs
```
