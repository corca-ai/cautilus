# AI Product Analytics Gather

## Source

- Slack thread:
  `https://corcaai.slack.com/archives/C07583F76Q3/p1775777426971449?thread_ts=1775777407.575299&cid=C07583F76Q3`
- Channel:
  `#moonlight`
- Upstream article mentioned in the thread:
  `https://amplitude.com/blog/ai-first-product`

## Canonical Asset

- [ai-product-analytics.md](./ai-product-analytics.md)

## Freshness

- gathered on 2026-04-10 UTC
- Slack access required a bot join to the public channel before the thread
  could be read

## Requested Facts

- The thread argues that AI product analytics should extend classic event
  analytics with:
  - evals-as-events
  - qualitative review and session replay
  - experimentation
  - tool usage analytics
  - cost analytics
  - latency monitoring
- The cost point is explicit:
  monitor prompt token usage and analyze average run cost by use case or model
  rollout.
- The latency point is explicit:
  monitor prompt-to-response latency, segment by prompt or user cohort, and
  alert on SLA violations.
- The thread also connects latency spikes to runtime mitigation such as feature
  flags or provider fallback.

## Implications For Cautilus

- `Cautilus` can own explicit evaluation telemetry without turning into a full
  product analytics backend.
- Product-owned minimum:
  wall-clock runtime timing for adapter commands and executor variants.
- Adapter- or wrapper-owned optional telemetry:
  provider, model, prompt tokens, completion tokens, total tokens, cost in
  USD.
- `Cautilus` should prefer explicit telemetry fields in checked-in outputs over
  scraping provider-specific stderr or transient logs.

## Open Gaps

- The thread is strategic, not a detailed `Cautilus` implementation spec.
- It does not decide whether telemetry should live only in review-variant
  outputs or also in iterate/held-out/full-gate result packets.
