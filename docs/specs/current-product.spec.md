# Current Product

`Cautilus` currently helps an operator do one concrete job:
turn recent behavior evidence into a bounded evaluation decision that can be reopened from files without redoing the whole analysis.

Today that job looks like this:

- gather recent behavior signals and turn them into reusable scenario proposals
- run a candidate through held-out and review-oriented checks
- package the result into report, evidence, and review artifacts
- reopen the same result from JSON or HTML without re-mining raw logs

That is why the product is packet-first.
The packet layer is not the story the operator buys.
It is the mechanism that keeps the decision durable, inspectable, and reusable across CLI, review, and HTML surfaces.

It is not:

- an admin UI
- a benchmark scrapbook
- an open-ended autonomous optimizer

The detailed packet contracts live under `docs/contracts/`.
The main seams referenced by this page are `docs/contracts/scenario-proposal-inputs.md`, `docs/contracts/reporting.md`, `docs/contracts/evidence-bundle.md`, and `docs/contracts/review-packet.md`.

## What An Operator Gets

One operator-friendly way to read the current product is as a four-step loop:

1. Capture a scenario worth protecting.
2. Evaluate a candidate against that scenario and related checks.
3. Record what improved, regressed, or still needs human judgment.
4. Reopen the same decision from files instead of memory.

The important promise is not merely "there is JSON on disk."
The promise is that another maintainer can reopen the same evaluation decision, see what changed, and understand why the product reached its recommendation.

## What This Spec Does Not Claim

- a web admin surface
- host-owned raw log readers or storage adapters
- automatic prompt application back into a consumer repo
- every optimizer or self-dogfood path as part of the standing public proof

Those seams may exist elsewhere in the product, but they are not the core public proof on this page.

## Executable Proof

The current product should be able to turn checked-in fixture data into one reusable evaluation decision without any LLM call.
The proof below checks both the machine-readable packet boundaries and the reader-facing statements inside those artifacts.

```run:shell
# Build one proposal-to-review evaluation bundle from checked-in fixtures.
tmpdir=$(mktemp -d)
./bin/cautilus scenario prepare-input --candidates ./fixtures/scenario-proposals/candidates.json --registry ./fixtures/scenario-proposals/registry.json --coverage ./fixtures/scenario-proposals/coverage.json --family fast_regression --window-days 14 --now 2026-04-11T00:00:00.000Z --output "$tmpdir/proposal-input.json" >/dev/null
./bin/cautilus scenario propose --input "$tmpdir/proposal-input.json" --output "$tmpdir/proposals.json" >/dev/null
./bin/cautilus report build --input ./fixtures/reports/report-input.json --output "$tmpdir/report.json" >/dev/null
./bin/cautilus evidence prepare-input --report-file "$tmpdir/report.json" --scenario-results-file ./fixtures/scenario-results/example-results.json --output "$tmpdir/evidence-input.json" >/dev/null
./bin/cautilus review prepare-input --repo-root . --report-file "$tmpdir/report.json" --output "$tmpdir/review.json" >/dev/null
grep -q '"schemaVersion": "cautilus.scenario_proposal_inputs.v1"' "$tmpdir/proposal-input.json"
grep -q '"schemaVersion": "cautilus.scenario_proposals.v1"' "$tmpdir/proposals.json"
grep -q '"schemaVersion": "cautilus.report_packet.v2"' "$tmpdir/report.json"
grep -q '"title": "Refresh review-after-retro scenario from recent activity"' "$tmpdir/proposals.json"
grep -q '"intent": "The operator should understand why a workflow step failed and how to recover."' "$tmpdir/report.json"
grep -q '"summary": "The candidate keeps the operator recovery path explicit."' "$tmpdir/report.json"
grep -q '"objective": {' "$tmpdir/evidence-input.json"
grep -q '"schemaVersion": "cautilus.review_packet.v1"' "$tmpdir/review.json"
grep -q 'Does the current deterministic self-consumer gate stay honest about what it actually proves for the product repo?' "$tmpdir/review.json"
```
