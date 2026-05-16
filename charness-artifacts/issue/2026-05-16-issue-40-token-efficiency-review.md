# Issue 40 Token Efficiency Review

Issue: https://github.com/corca-ai/cautilus/issues/40
Reviewed at: 2026-05-16

## Classification

Feature / deferred-work review.

The issue asks for a product-level cost and token-efficiency audit, not a bug fix.
The reporter's job-to-be-done is to understand whether Cautilus can attribute LLM token and cost spikes, especially where a cost-saving mechanism can backfire.

## Source Limits

The GitHub issue is the source of truth for the request.
The referenced Threads post was still not available through direct agent browsing during this review.
The local `ceal` command was not installed in this workspace, so the Slack source thread could not be refreshed from `slack://C08SF10EVMX/1778890590.261979`.

## Current Hotspots And Evidence

`Cautilus` already has a narrow, explicit telemetry stance.
The reporting contract says telemetry must come from checked-in wrappers or output payloads, not opaque CLI prose.
The deployment-evidence contract aggregates only explicit machine-readable telemetry from `skill_evaluation_summary` and `scenario_results`.

The strongest current coverage is `dev/skill` runtime telemetry.
Claude skill tests read `usage.input_tokens`, `usage.cache_creation_input_tokens`, `usage.cache_read_input_tokens`, `usage.output_tokens`, and `total_cost_usd` from the Claude JSON envelope.
Codex skill tests read machine-readable token events and derive OpenAI Codex cost for supported models through a checked-in pricing catalog.

The main cost-blind spot is cache attribution.
Claude cache creation and cache read tokens are collapsed into `prompt_tokens`.
That is useful for total-token visibility, but it hides whether a cache feature is saving money, only shifting cost into cache creation, or becoming counterproductive because invalidation prevents reuse.

The second blind spot is live app evaluation telemetry.
`scripts/agent-runtime/run-app-eval.mjs` records provider, model, harness, and duration for live Codex and Claude app/prompt or app/chat cases, but it does not preserve token or cost telemetry from those runs.
That means app behavior evaluations can be included in behavior proof while remaining unavailable for the deployment-evidence cost table unless a caller supplies scenario telemetry separately.

The third blind spot is attribution depth.
Current normalized telemetry can explain provider, model, prompt tokens, completion tokens, total tokens, cost, duration, runtime identity, and pricing provenance.
It cannot attribute spikes to request type, retry count, tool loop count, cache creation versus cache read, or static-context segment reuse.

## Unsafe Optimization Risk

The current `docs/internal/research/token-efficiency.md` correctly rejects blanket token-saving toggles that would change evaluation fidelity.
This is the right default.
The risk is that future cost optimizations could be judged only by aggregate `total_tokens` or `cost_usd`.
For Anthropic-style cache behavior, aggregate totals are insufficient because cache creation and cache reads have different break-even behavior.

## Recommended Follow-Ups

1. Preserve cache token breakdown in telemetry instead of collapsing it into prompt tokens only.
   This should extend the telemetry contracts and normalizers with explicit cache creation, cache read, and uncached input fields while keeping `total_tokens` for compatibility.
   Follow-up: https://github.com/corca-ai/cautilus/issues/41

2. Add token and cost telemetry extraction to live app evaluation backends.
   `run-app-eval.mjs` should reuse the same explicit Claude and Codex telemetry helpers used by skill tests, then write telemetry into app observed packets or scenario-result conversion paths.
   Follow-up: https://github.com/corca-ai/cautilus/issues/42

3. Add attribution fields for budget diagnosis.
   A small contract extension should let host wrappers report request kind, retry count, tool-call count, cache policy, and static-context or segment IDs when they are available.
   Cautilus should aggregate those fields only when explicit, and should not infer them from human-oriented logs.
   Follow-up: https://github.com/corca-ai/cautilus/issues/43

## Closeout State

The issue can now move to maintainer triage.
Follow-up implementation issues were filed for the confirmed improvements.
