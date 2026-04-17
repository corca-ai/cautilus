# Current Product

`Cautilus` is currently a packet-first evaluation toolkit.
It is not an admin UI, a benchmark scrapbook, or an open-ended autonomous optimizer.
The shipped boundary is narrower and more reusable:

- normalize raw host evidence into archetype-shaped proposal inputs
- turn those inputs into reusable scenario proposals
- build machine-readable report, evidence, and review packets
- reopen the same packets in later review and HTML flows instead of re-mining evidence ad hoc

The detailed packet contracts live under `docs/contracts/`.
The main seams referenced by this page are `docs/contracts/scenario-proposal-inputs.md`, `docs/contracts/reporting.md`, `docs/contracts/evidence-bundle.md`, and `docs/contracts/review-packet.md`.

## What This Spec Does Not Claim

- a web admin surface
- host-owned raw log readers or storage adapters
- automatic prompt application back into a consumer repo
- every optimizer or self-dogfood path as part of the standing public proof

Those seams may exist elsewhere in the product or roadmap, but they are not the core public proof on this page.

## Executable Proof

The current product should be able to turn checked-in fixture data into reusable packets without any LLM call.

```run:shell
# Build reusable proposal, report, evidence, and review packets from checked-in fixtures.
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
grep -q '"objective": {' "$tmpdir/evidence-input.json"
grep -q '"schemaVersion": "cautilus.review_packet.v1"' "$tmpdir/review.json"
```
