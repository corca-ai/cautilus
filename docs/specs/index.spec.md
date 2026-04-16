# Cautilus Public Specs

These documents are the public contract for the currently shipped `Cautilus` surface.
Each page explains one bounded claim and keeps a cheap executable proof next to the prose.
The proofs use the repo-local `./bin/cautilus` wrapper because this report is generated from a source checkout, not from an installed binary on `PATH`.

`npm run lint:specs` validates the spec index, checks relative links, and runs the full suite.
That standing gate is affordable because the public specs only exercise cheap fixture-backed commands and checked-in artifacts.

## See It Work

```run:shell
$ ./bin/cautilus healthcheck --json | grep '"status": "healthy"'
  "status": "healthy"
$ ./bin/cautilus scenarios --json | grep '"archetype": "workflow"'
      "archetype": "workflow",
```

The report should feel legible to a reviewer who is not reading Go or Node code.
The contract on each page is therefore written in user-facing terms first, then backed by one or two executable slices.

## Documents

- [Current Product](current-product.spec.md)
  Explains the packet-first evaluation workflow that ships today: normalize inputs, build reusable packets, and reopen the result through review and HTML surfaces.
- [Standalone Surface](standalone-surface.spec.md)
  Proves that the standalone binary and bundled skill can be installed into a fresh repo and discovered through stable operator-facing commands.
- [Self-Dogfood Publication](self-dogfood.spec.md)
  Defines the narrow claim of the published latest self-dogfood bundle: record the result honestly and reopen it without replaying the expensive review.
- [Archetype Boundary](archetype-boundary.spec.md)
  Defines the three first-class evaluation archetypes and proves that each normalization command stays distinct at the user-facing boundary.
- [HTML Report Surface](html-report.spec.md)
  Proves the currently shipped static HTML outputs that let a human review packet-based artifacts in a browser.
- [Git Preconditions And Runtime Choice](git-precondition.spec.md)
  Explains the repo preconditions enforced by `doctor` and the user-facing runtime validation on `skill test`.
