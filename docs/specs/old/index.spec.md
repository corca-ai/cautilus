# Cautilus Public Specs

> Archived — superseded by [the apex spec](../index.spec.md). Kept for historical context.

These documents were the public contract for a previously shipped `Cautilus` surface.
Each page explains one bounded claim and keeps a cheap executable proof next to the prose.
The proofs use the repo-local `./bin/cautilus` wrapper because this report is generated from a source checkout, not from an installed binary on `PATH`.

`npm run lint:specs` validates the spec index, checks relative links, and runs the full suite.
That standing gate is affordable because the public specs only exercise cheap fixture-backed commands and checked-in artifacts.

## See It Work

```run:shell
# Keep this archive index wired to the old public spec pages without repeating their product proofs.
node -e 'const fs = require("node:fs"); for (const path of ["docs/specs/old/current-product.spec.md", "docs/specs/old/standalone-surface.spec.md", "docs/specs/old/html-report.spec.md", "docs/specs/old/git-precondition.spec.md"]) { if (!fs.existsSync(path)) throw new Error("missing " + path); }'
```

The report should feel legible to a reviewer who is not reading Go or Node code.
The contract on each page is therefore written in user-facing terms first, then backed by one or two executable slices.
The archive index proof only keeps the old page graph reachable; the product proofs live on the linked pages.

## Documents

- [Evaluation Surfaces](evaluation-surfaces.spec.md)
  The current contract that defines the two top-level evaluation surfaces (`dev`, `app`) with bounded presets and a single fixture composition schema. Implementation rolls out preset by preset.
- [Command Surfaces](command-surfaces.spec.md)
  Defines the three first-class product command families: `claim` for declared-claim discovery and proof planning, `eval` for verification, and `improve` for bounded improvement.
- [Current Product](current-product.spec.md)
  Explains the packet-first evaluation workflow that ships today: normalize inputs, build reusable packets, and reopen the result through review and HTML surfaces.
- [Standalone Surface](standalone-surface.spec.md)
  Proves that the standalone binary and Cautilus Agent can be installed into a fresh repo and discovered through stable operator-facing commands.
- [Self-Dogfood Publication](self-dogfood.spec.md)
  Defines the narrow claim of the published latest self-dogfood bundle: record the result honestly and reopen it without replaying the expensive review.
- [Evaluation Surfaces](evaluation-surfaces.spec.md)
  The current implementation contract for `cautilus evaluate fixture`/`evaluate`: two surfaces (`dev`, `app`), four presets (`repo`, `skill`, `chat`, `prompt`), and the four fixture composition primitives that replace the older first-class archetype boundary.
- [HTML Report Surface](html-report.spec.md)
  Proves the currently shipped static HTML outputs that let a human review packet-based artifacts in a browser.
- [Git Preconditions And Runtime Choice](git-precondition.spec.md)
  Explains the repo preconditions enforced by `doctor` and the user-facing runtime validation on `skill test`.
