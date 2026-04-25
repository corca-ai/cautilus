# Token efficiency for agent-runtime skill evaluation

Cautilus drives `claude` and `codex` as child processes to evaluate whether a
local skill is actually triggered and executed correctly. Each subprocess pays
a fixed context tax from the host CLI's harness. This document records what is
already stripped by default, what is intentionally left in to preserve
evaluation fidelity, and the experiments that still need to run before we can
strip more aggressively.

The runtime lives in `scripts/agent-runtime/skill-test-claude-backend.mjs` and
`scripts/agent-runtime/run-local-skill-test.mjs`.

## Core tension

Skill evaluation must stay faithful to what an end user's Claude Code / Codex
session actually sees when they invoke a skill. A hyper-optimized evaluation
harness would produce lower per-run token counts but no longer represent the
real deployment surface. The goal here is not "minimum tokens"; it is
"minimum tokens **without compromising evaluation fidelity or
reproducibility**".

"Normal user environment" is a distribution, not a point. Cautilus operators
have variable user homes, connector lists, git state, and repo docs. Inheriting
the operator's environment makes evaluation non-deterministic across machines.
The chosen direction is:

1. A fixed minimum baseline that strips everything unambiguously unrelated to
   skill behavior (telemetry, auto-updater, memory pollution, IDE install).
2. A per-skill contract where the skill declares which capabilities it needs
   to be evaluated honestly (web search, git instructions, connectors, …),
   and the runtime re-enables exactly those capabilities for that skill's
   test cases.

Point 1 is applied today. Point 2 is designed but unimplemented.

## Applied: tier-1 baseline (always stripped)

These toggles are orthogonal to skill behavior. They never affect what a skill
can do; they only strip operator-specific noise.

### Claude CLI env (`CLAUDE_CLI_ENV` in
`scripts/agent-runtime/skill-test-claude-backend.mjs`)

- `CLAUDE_CODE_DISABLE_NONESSENTIAL_TRAFFIC=1`
- `CLAUDE_CODE_DISABLE_AUTO_MEMORY=1` — prevents operator's local memory
  records from biasing an evaluation baseline
- `ENABLE_CLAUDEAI_MCP_SERVERS=false`
- `DISABLE_TELEMETRY=1`
- `DISABLE_AUTOUPDATER=1`
- `DISABLE_BUG_COMMAND=1`
- `DISABLE_ERROR_REPORTING=1`
- `CLAUDE_CODE_IDE_SKIP_AUTO_INSTALL=1`

### Claude CLI flags

- `-p` (print mode), `--output-format json`
- `--no-session-persistence` — disables transcript writes for `-p` runs so
  headless evaluation does not inherit resumable local session state
- `--exclude-dynamic-system-prompt-sections` — moves per-machine sections
  (cwd, env info, memory paths, git status) out of the system prompt. Safe
  because cautilus does not replace the system prompt, so this flag has its
  intended cache-reuse effect. Skill-visible environment is identical; only
  the serialized position moves.

### Codex CLI

Current args (`codexArgs` in `scripts/agent-runtime/run-local-skill-test.mjs`):

- `exec -C <workspace> --sandbox <mode>`
- default session mode: `ephemeral`
- optional override for behavior probes: `--codex-session-mode persistent` (legacy alias: `--codex-ephemeral false`)
- `--output-schema`, `-o <file>` for structured capture
- `-c model_reasoning_effort=<level>` when the caller sets effort

Sandbox mode is intentionally caller-controlled (`read-only` or
`workspace-write`) because different skills have different authority needs.

Codex `skill test` telemetry now reads the machine-readable `codex exec --json`
event stream.
For supported OpenAI Codex models, `Cautilus` also derives `cost_usd` from a
checked-in pricing catalog using token totals from that stream.
Those rows are labeled with `cost_truth=derived_pricing`,
`pricing_source=openai_api_pricing`, and a checked-in `pricing_version`.
`Cautilus` still does not promote human-oriented stderr counters into product truth.

### Self-dogfood adapter-only runtime knobs

The checked-in `self-dogfood-eval-skill` adapter now applies a narrower
runtime-specific tuning layer:

- Codex: `--model gpt-5.4-mini`, `-c model_reasoning_effort="low"`,
  `-c project_doc_max_bytes=0`,
  `-c include_apps_instructions=false`,
  `-c include_environment_context=false`
- Claude: `--permission-mode dontAsk`,
  `--allowedTools 'Bash(cautilus *)'`,
  `--timeout-ms 180000`

These are **not** generic product defaults.
They are repo-local adapter choices for `Cautilus` self-dogfood because that
surface has a known command contract and a known checked-in project doc size.

## Intentionally NOT applied (fidelity preservation)

These are commonly recommended token-saving knobs that **would break skill
evaluation** if applied as a blanket default.

### Claude CLI

- `--tools ""` / `--allowedTools ""` — skills routinely invoke Read, Grep,
  Bash. Stripping the tool context defeats the evaluation.
- `--disable-slash-commands` — skills are surfaced as slash commands. Turning
  this off would hide the very thing being evaluated.
- `--bare` / `CLAUDE_CODE_SIMPLE=true` — besides the tool restriction above,
  `--bare` breaks OAuth auth entirely.
- `CLAUDE_CODE_DISABLE_GIT_INSTRUCTIONS` — a git-related skill needs to see
  git context to be evaluated honestly. Strip-by-default breaks those cases.
- `CLAUDE_CODE_DISABLE_CLAUDE_MDS` — a skill may legitimately depend on the
  workspace `CLAUDE.md` conventions. Strip-by-default would silently change
  evaluation outcomes.
- `CLAUDE_AGENT_SDK_DISABLE_BUILTIN_AGENTS` — a skill may delegate to a
  built-in agent.

### Codex CLI

- `-c web_search=disabled` — a research/docs-lookup skill legitimately uses
  web search. Default-off would fail those skills.
- `-c include_environment_context=false` — skills that reason about
  cwd/shell/date need this block.
- `-c include_apps_instructions=false` — skills that interact with GitHub,
  Slack, Linear connectors need this.
- `-c project_doc_max_bytes=0` — skills that depend on workspace `AGENTS.md`
  need the project doc. Full suppression breaks those.
- `-c tool_output_token_limit=<low>` — evaluation sometimes needs the full
  tool output to judge outcome.

## Designed but unimplemented: per-skill `requires` contract

The fidelity-breaking knobs above should become opt-in, declared in the
skill's own test-case suite (or derived from the skill's frontmatter since a
cautilus-internal skill already reads skill manifests). Shape under
discussion:

```json
{
  "caseId": "...",
  "prompt": "...",
  "requires": {
    "web_search": true,
    "git_instructions": true,
    "apps_instructions": false,
    "claude_mds": false,
    "project_doc": false,
    "builtin_agents": false
  }
}
```

Runtime behavior:

- No `requires` → fully stripped baseline (safe for the vast majority of
  skills).
- Declared capabilities → the corresponding env var / `-c` override / flag is
  dropped from the subprocess invocation for that specific case.
- Cautilus operators get a second-layer escape hatch (e.g.
  `--enable-web-search` on the runner) for one-off experiments, but the
  per-skill contract is the source of truth.

### Why declare in the skill contract, not per-invocation config

- The skill author knows best what environment the skill needs.
- Declaring capabilities makes the skill's environmental dependency visible
  to reviewers and to downstream tooling (doc generation, compliance
  checks).
- Evaluation runs become reproducible across operator machines — the
  capability matrix is derived from the skill file itself, not from whoever
  happens to run `cautilus review`.

### Implementation sketch

1. Extend `SKILL_EVALUATION_INPUTS_SCHEMA` with an optional `requires` object
   per test case.
2. Teach `run-local-skill-test.mjs` to translate `requires` into the subset
   of env/flags to unset from the baseline.
3. Have the cautilus-internal skill that generates test cases read the
   skill's own frontmatter for default `requires` inference (e.g. a skill
   marked `needs_web: true` in frontmatter auto-propagates to every test
   case's `requires.web_search`).
4. Document the contract in `docs/contracts/` alongside other adapter
   schemas.

## Experiments to run

Before widening what is stripped by default, measure:

1. **`CLAUDE_AGENT_SDK_DISABLE_BUILTIN_AGENTS=1`** — sah-cli issue #4
   observes built-in agents still surfacing in non-interactive Claude. Add
   this env, diff stream-json init against a run without it, confirm the
   delta is exactly the builtin-agents manifest, then evaluate whether any
   cautilus test case legitimately uses a builtin agent. If none, promote to
   tier-1 baseline. If some do, it belongs in the `requires` contract.

2. **`--strict-mcp-config` in cautilus** — crill uses it; cautilus does not.
   Because cautilus already runs with `ENABLE_CLAUDEAI_MCP_SERVERS=false`,
   the additional effect should be small. Measure: does any skill in the
   current suite legitimately depend on an MCP server? If not, promote.

3. **Per-skill baseline token measurement** — capture input/output tokens
   from the Claude stream-json for each test case in the current suite.
   Establish a baseline so later optimizations can be attributed correctly.

4. **Codex `project_doc_max_bytes` sweep** — for each skill, measure whether
   setting `project_doc_max_bytes=0` vs the default `32768` changes the
   evaluation outcome. Skills with identical outcomes across the sweep are
   candidates for default-off (they do not rely on project docs, so
   stripping is safe without the `requires` contract).

5. **`CODEX_HOME` isolation** — follow sah-cli issue #4. Run a subset of
   codex test cases with an auth-only `CODEX_HOME` and measure input-token
   delta against the default.

## Experiments run on April 17, 2026

### Claude headless permissions

Official Claude Code headless docs confirm that `-p` runs accept
`--permission-mode`, `dontAsk` denies any non-preapproved tool use, and
`--allowedTools` can preapprove specific Bash command prefixes.
That matched the observed execution blocker exactly: once the adapter passed
`--permission-mode dontAsk --allowedTools 'Bash(cautilus *)'`, the execution
case stopped failing on Bash permission denial.

This did **not** make the Claude trigger case fully stable.
On the current machine and account, the trigger case still showed 1/2 success
for both Opus and Sonnet because one repeat hit the 90s runner timeout with no
stdout payload.
So the permission fix is real, but Claude trigger reproducibility remains an
open latency/runtime issue.

Follow-up on the same machine showed that this was primarily a timeout-budget
problem, not another permission bug.
With the same `dontAsk` + `Bash(cautilus *)` allowlist but a `180000ms`
runner timeout, both the default Claude model and Sonnet completed the
checked-in self-dogfood suite cleanly:

- default Claude model: trigger `2/2`, execution `passed`
- Sonnet: trigger `2/2`, execution `passed`

The tradeoff is latency.
On Sonnet, one trigger repeat took about `147448ms`, so a `90s` budget is not
honest for this repo's current self-dogfood surface.

### Codex prompt-input sweep

Using `codex debug prompt-input` in this repo with the same user prompt:

- baseline: `25671` visible input chars
- `project_doc_max_bytes=0`: `20794` chars (`-4877`)
- `include_environment_context=false`: `25488` chars (`-183`)
- `include_apps_instructions=false`: `25025` chars (`-646`)

The first pass applied only `project_doc_max_bytes=0`, because it was the
large win and it was already proven safe.

Follow-up self-dogfood runs showed that the two smaller reductions were still
worth keeping on this repo-local adapter surface.
With all three Codex overrides enabled, the checked-in self-dogfood suite
still passed and the observed Codex stderr token counters dropped further:

- trigger sample 1: `67709 -> 36683`
- trigger sample 2: `40714 -> 27725`
- execution: `29747 -> 12257`

These two extra flags remain adapter-local, not generic product defaults,
because other skills may legitimately depend on environment or app
instructions.

### Codex self-dogfood outcome

With `gpt-5.4-mini`, low reasoning effort, and the three repo-local Codex
prompt reductions above, the checked-in `self-dogfood-eval-skill` adapter
passed again on Codex:

- trigger: `2/2` matched `must_invoke`
- execution: `passed`

This makes those Codex settings applied repo-local adapter optimizations for
the current `Cautilus` self-dogfood surface, not yet generic product defaults.

### Skill-test telemetry surface

`run-local-skill-test.mjs` now preserves explicit runtime telemetry in the
normalized packet instead of dropping it on the floor.

- Claude backend:
  the structured `--output-format json` envelope now feeds
  `telemetry.provider`, `telemetry.model`, `telemetry.prompt_tokens`,
  `telemetry.completion_tokens`, `telemetry.total_tokens`, and
  `telemetry.cost_usd`, and mirrors the budget-relevant fields into
  `metrics.total_tokens` / `metrics.cost_usd`
- Codex backend:
  the normalized packet now preserves `telemetry.provider`,
  `telemetry.model`, `telemetry.prompt_tokens`,
  `telemetry.completion_tokens`, and `telemetry.total_tokens` from the
  machine-readable `codex exec --json` event stream
  while still refusing to scrape human-oriented stderr output into product
  truth
- Codex cost:
  `cost_usd` remains absent until the runtime exposes a stable machine field
  for it or cautilus grows a separately versioned derived-pricing seam

That means the product-owned self-dogfood summary can now answer:

- which evaluation case passed or failed
- which runtime model was used
- Claude time / token / cost per evaluation
- Codex time / token per evaluation

It still cannot honestly answer Codex cost questions without a more explicit
machine-readable surface from the Codex runtime.

## Where this document should be surfaced

This file is the canonical record of what cautilus strips by default, why,
and what is deliberately left in. It should be referenced from the repo's
top-level documentation so adopters and evaluation auditors can locate it
without grepping:

- Link from `README.md` in a "Reproducibility" or "Token economics" section.
- Link from `docs/master-plan.md` or `docs/guides/consumer-adoption.md` when
  discussing evaluation determinism.
- Cross-reference from `docs/specs/` if a spec introduces a new stripped
  toggle or changes the baseline.

If the repo gains a "what cautilus actually does to your agent CLI" FAQ,
point to this document from there.

## References

- `sah-cli` issue #4: <https://github.com/corca-ai/sah-cli/issues/4>
- Claude Code CLI reference: <https://code.claude.com/docs/en/cli-reference>
- Claude Code env vars: <https://code.claude.com/docs/en/env-vars>
- Codex config reference:
  <https://developers.openai.com/codex/config-reference>
