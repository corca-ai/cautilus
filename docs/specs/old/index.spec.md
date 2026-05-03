# Cautilus Public Specs

These documents are the public contract for the currently shipped `Cautilus` surface.
Each page explains one bounded claim and keeps a cheap executable proof next to the prose.
The proofs use the repo-local `./bin/cautilus` wrapper because this report is generated from a source checkout, not from an installed binary on `PATH`.

`npm run lint:specs` validates the spec index, checks relative links, and runs the full suite.
That standing gate is affordable because the public specs only exercise cheap fixture-backed commands and checked-in artifacts.

## See It Work

```run:shell
# Turn a checked-in proposal input into a browser-readable scenario page.
tmpdir=$(mktemp -d)
./bin/cautilus scenario propose --input ./fixtures/scenario-proposals/standalone-input.json --output "$tmpdir/proposals.json" >/dev/null
./bin/cautilus scenario render-proposals-html --input "$tmpdir/proposals.json" --output "$tmpdir/proposals.html" >/dev/null
grep -q '"title": "Refresh review-after-retro scenario from recent activity"' "$tmpdir/proposals.json"
grep -q '<title>Cautilus Scenario Proposals — 1</title>' "$tmpdir/proposals.html"
grep -q 'Refresh review-after-retro scenario from recent activity' "$tmpdir/proposals.html"
```

The report should feel legible to a reviewer who is not reading Go or Node code.
The contract on each page is therefore written in user-facing terms first, then backed by one or two executable slices.
The first proof deliberately shows a small end-to-end product move: `Cautilus` turns raw proposal inputs into a reusable scenario packet and then into a page a human can scan in a browser.

## Documents

- [Evaluation Surfaces](evaluation-surfaces.spec.md)
  The current contract that defines the two top-level evaluation surfaces (`dev`, `app`) with bounded presets and a single fixture composition schema. Implementation rolls out preset by preset.
- [Command Surfaces](command-surfaces.spec.md)
  Defines the three first-class product command families: `claim` for declared-claim discovery and proof planning, `eval` for verification, and `optimize` for bounded improvement.
- [Current Product](current-product.spec.md)
  Explains the packet-first evaluation workflow that ships today: normalize inputs, build reusable packets, and reopen the result through review and HTML surfaces.
- [Standalone Surface](standalone-surface.spec.md)
  Proves that the standalone binary and bundled skill can be installed into a fresh repo and discovered through stable operator-facing commands.
- [Self-Dogfood Publication](self-dogfood.spec.md)
  Defines the narrow claim of the published latest self-dogfood bundle: record the result honestly and reopen it without replaying the expensive review.
- [Evaluation Surfaces](evaluation-surfaces.spec.md)
  The current implementation contract for `cautilus eval test`/`evaluate`: two surfaces (`dev`, `app`), four presets (`repo`, `skill`, `chat`, `prompt`), and the four fixture composition primitives that replace the older first-class archetype boundary.
- [HTML Report Surface](html-report.spec.md)
  Proves the currently shipped static HTML outputs that let a human review packet-based artifacts in a browser.
- [Git Preconditions And Runtime Choice](git-precondition.spec.md)
  Explains the repo preconditions enforced by `doctor` and the user-facing runtime validation on `skill test`.
