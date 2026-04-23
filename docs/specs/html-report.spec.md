# HTML Report Surface

`Cautilus` ships static HTML views so a human can answer one practical question in a browser:
what happened in this evaluation, and what should I trust or revisit next?

The public contract on this page is the currently shipped renderer surface, not a design backlog.

Today that surface includes:

- report packets
- review packets
- review summary packets
- scenario proposal packets
- scenario conversation review packets
- evidence bundles
- self-dogfood latest bundles
- run index pages

These pages are generated from JSON packets or checked-in artifact bundles.
They are read-only representations of the source packet, not a second editable source of truth.
The visual language does not have to match `specdown` exactly.
The contract is simpler: a reviewer should be able to open the generated page, understand what artifact it represents, and find the key verdict or summary.

## What A Reviewer Can Learn

The current HTML surface should let a reviewer answer questions like:

- What was the intent behind this run?
- Did the candidate improve, regress, or still need human judgment?
- Which layer is currently carrying the decision, and which layers are supporting context?
- Which proposal, finding, or evidence signal should I inspect first?
- Is this a current run artifact, a published self-dogfood snapshot, or a summary across review variants?

## Packet Renderer Proof

```run:shell
# Render report, review, scenario review, proposals, and evidence packets into standalone HTML pages.
tmpdir=$(mktemp -d)
./bin/cautilus report build --input ./fixtures/reports/report-input.json --output "$tmpdir/report.json" >/dev/null
./bin/cautilus review prepare-input --repo-root . --report-file "$tmpdir/report.json" --output "$tmpdir/review.json" >/dev/null
./bin/cautilus scenario review-conversations --input ./fixtures/scenario-conversation-review/input.json --output "$tmpdir/conversation-review.json" >/dev/null
./bin/cautilus scenario propose --input ./fixtures/scenario-proposals/standalone-input.json --output "$tmpdir/proposals.json" >/dev/null
./bin/cautilus report render-html --input "$tmpdir/report.json" --output "$tmpdir/report.html" >/dev/null
./bin/cautilus review render-html --input "$tmpdir/review.json" --output "$tmpdir/review.html" >/dev/null
./bin/cautilus scenario render-conversation-review-html --input "$tmpdir/conversation-review.json" --output "$tmpdir/conversation-review.html" >/dev/null
./bin/cautilus scenario render-proposals-html --input "$tmpdir/proposals.json" --output "$tmpdir/proposals.html" >/dev/null
./bin/cautilus evidence render-html --input ./fixtures/evidence/example-bundle.json --output "$tmpdir/evidence.html" >/dev/null
grep -q '<title>Cautilus Report — defer</title>' "$tmpdir/report.html"
grep -q '<title>Cautilus Review Packet — defer</title>' "$tmpdir/review.html"
grep -q '<title>Cautilus Scenario Conversation Review — 2</title>' "$tmpdir/conversation-review.html"
grep -q '<title>Cautilus Scenario Proposals — 1</title>' "$tmpdir/proposals.html"
grep -q '<title>Cautilus Evidence Bundle — 5 signals</title>' "$tmpdir/evidence.html"
grep -q 'The operator should understand why a workflow step failed and how to recover.' "$tmpdir/report.html"
grep -q 'Decision Signals' "$tmpdir/report.html"
grep -q 'Does the current deterministic self-consumer gate stay honest about what it actually proves for the product repo?' "$tmpdir/review.html"
grep -q 'Review Path' "$tmpdir/review.html"
grep -q 'review_existing_scenario_refresh' "$tmpdir/conversation-review.html"
grep -q 'Selection Signals' "$tmpdir/conversation-review.html"
grep -q 'Refresh review-after-retro scenario from recent activity' "$tmpdir/proposals.html"
grep -q 'Selection Signals' "$tmpdir/proposals.html"
grep -q 'Regressed evidence: operator-recovery' "$tmpdir/evidence.html"
grep -q 'Signals By Source' "$tmpdir/evidence.html"
```

## Bundle And Index Proof

```run:shell
# Regenerate the published self-dogfood page and a run index page from an existing artifact directory.
tmpdir=$(mktemp -d)
./bin/cautilus self-dogfood render-html --latest-dir ./artifacts/self-dogfood/latest --output "$tmpdir/self-dogfood.html" >/dev/null
./bin/cautilus artifacts render-index-html --run-dir ./artifacts/self-dogfood/latest --output "$tmpdir/index.html" >/dev/null
grep -q '<title>Cautilus Self-Dogfood — pass</title>' "$tmpdir/self-dogfood.html"
grep -q '<title>Cautilus Run Index — latest</title>' "$tmpdir/index.html"
grep -q 'Decision Summary' "$tmpdir/self-dogfood.html"
grep -q 'What happened' "$tmpdir/self-dogfood.html"
grep -q 'Cautilus should record and surface its own self-dogfood result honestly before operators trust broader consumer runs.' "$tmpdir/self-dogfood.html"
grep -q 'Artifacts are ordered by the intended review flow' "$tmpdir/index.html"
```

## Review Summary Proof

The review summary renderer expects a `cautilus.review_summary.v1` packet.
This page keeps a minimal inline sample so the public proof stays current without depending on a historical artifact snapshot.

```run:shell
# Render a minimal review summary packet into standalone HTML.
tmpdir=$(mktemp -d)
printf '%s\n' '{"schemaVersion":"cautilus.review_summary.v1","generatedAt":"2026-04-16T00:00:00Z","status":"passed","reviewVerdict":"concern","reasonCodes":["RC_NO_BENCHMARK_EVIDENCE"],"findingsCount":1,"telemetry":{"variantCount":2,"passedVariantCount":2,"failedVariantCount":0,"durationMs":12000},"variants":[{"id":"codex-review-a","status":"passed","durationMs":6000,"output":{"verdict":"concern","summary":"Evidence is promising but shallow.","findings":[{"severity":"concern","message":"needs more held_out evidence","path":"docs/specs/review.spec.md"}]}},{"id":"codex-review-b","status":"passed","durationMs":6000,"output":{"verdict":"pass","summary":"Second reviewer is satisfied.","findings":[]}}],"humanReviewFindings":[{"severity":"concern","message":"needs more held_out evidence","path":"docs/specs/review.spec.md"}]}' > "$tmpdir/review-summary.json"
./bin/cautilus review render-variants-summary-html --input "$tmpdir/review-summary.json" --output "$tmpdir/review-summary.html" >/dev/null
grep -q '<title>Cautilus Review Summary — concern</title>' "$tmpdir/review-summary.html"
grep -q 'Execution aligned, but verdicts diverged across variants.' "$tmpdir/review-summary.html"
```
