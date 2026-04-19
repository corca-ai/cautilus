# Scenario Conversation Review Contract

## Problem

Consumer repos already have real chatbot conversation logs that can explain why a new scenario should exist or why an existing scenario needs refresh.
Before this slice, `Cautilus` could turn those signals into `scenario propose` packets, but it did not own a dedicated review surface that let an operator inspect the linked conversations without reopening consumer-specific audit UIs.
That gap kept `#16` open even after proposal generation and static proposal HTML already existed.

## Current Slice

`Cautilus` now ships a read-only scenario-centric conversation review boundary.
`cautilus scenario review-conversations` reads normalized chatbot conversation summaries plus proposal candidates and emits `cautilus.scenario_conversation_review.v1`.
`cautilus scenario render-conversation-review-html` renders the same packet into a browser-readable page.

## Fixed Decisions

- The shipped surface is local-first and read-only.
- The input starts from normalized chatbot conversation summaries, not raw consumer logs.
- The input also carries proposal candidates so the surface stays explicitly scenario-centric instead of becoming a generic traffic browser.
- Linked proposal summaries reuse the same `scenario propose` logic for `action`, `family`, `rationale`, and coverage hints.
- The HTML page is a projection over the packet, not a writable second source of truth.
- This slice does not force one consumer storage root such as `.cautilus/`.

## Probe Questions

- Should a later packet support explicit per-instance metadata once the instance-discovery contract lands?
- Should a later packet include scenario-result excerpts alongside proposal links for regression review, or stay proposal-focused?
- Should a later version accept `scenario_proposals.v1` directly in addition to proposal candidates?

## Deferred Decisions

- adapter-defined multi-instance discovery and routing
- generic live-run invocation against a live instance
- any interactive HTTP or read-write workbench surface
- consumer-specific operational audit and compliance views

## Non-Goals

- browsing all operator traffic
- cost accounting or operator attribution
- security or compliance review
- mutating scenarios from the HTML page

## Deliberately Not Doing

- binding the product to Ceal's route layout
- forcing a shared run-data home before the adapter contract exists
- mixing organizational audit concerns into the behavior-evaluation surface

## Constraints

- The packet must remain cheap and deterministic over checked-in fixtures.
- The surface must stay honest about scope by requiring proposal candidates instead of pretending every conversation thread is automatically a benchmark candidate.
- The packet must preserve enough transcript detail for operator review without introducing consumer-specific storage assumptions.

## Success Criteria

- An operator can inspect which normalized conversation threads currently link to scenario work.
- The packet distinguishes linked scenario work from unlinked threads.
- Linked proposals carry consistent action and coverage semantics with `scenario propose`.
- The rendered HTML makes thread transcript plus linked proposal context readable in one page.
- The surface stays clearly separate from generic admin or audit browsing.

## Acceptance Checks

- `cautilus scenario review-conversations --input ./fixtures/scenario-conversation-review/input.json`
- `cautilus scenario render-conversation-review-html --input <conversation-review.json>`
- `go test ./internal/runtime ./internal/app ./internal/cli`
- `npm run verify`
- `npm run hooks:check`

## Premortem

The most likely misread is treating this as the full workbench absorption.
The contract counters that by making proposal candidates mandatory and by deferring instance discovery, live-run invocation, and write paths explicitly.
The second likely misread is assuming this replaces consumer audit UI.
The contract counters that by limiting scope to scenario-adjacent behavior evaluation and excluding operational audit concerns in the non-goals.

## Canonical Artifact

The canonical artifact for this slice is `cautilus.scenario_conversation_review.v1`.
The checked-in contract example lives at [fixtures/scenario-conversation-review/input.json](../../fixtures/scenario-conversation-review/input.json).

## First Implementation Slice

Ship the packet builder and HTML renderer first.
Keep instance discovery and live-run invocation as separate follow-up seams once the adapter contract exists.

## Source References

- [docs/contracts/chatbot-normalization.md](./chatbot-normalization.md)
- [docs/contracts/scenario-proposal-inputs.md](./scenario-proposal-inputs.md)
- [internal/runtime/scenario_conversation_review.go](../../internal/runtime/scenario_conversation_review.go)
- [internal/runtime/artifact_html.go](../../internal/runtime/artifact_html.go)
- [fixtures/scenario-conversation-review/input.json](../../fixtures/scenario-conversation-review/input.json)
