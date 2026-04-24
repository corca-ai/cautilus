# Source Map

- `README.md`
- `README.ko.md`
- `docs/specs/index.spec.md`
- `docs/specs/current-product.spec.md`
- `docs/specs/archetype-boundary.spec.md`
- `docs/maintainers/consumer-readiness.md`
- `docs/guides/consumer-adoption.md`

# Narrative Drift

- The public specs already led with a small product move: checked-in evidence becomes a reusable packet and then a browser-readable page.
- `README.md` still led more with philosophy, contrast language, and surface inventory than with a first-run operator picture.
- The scenario section named the three archetypes, but it did not answer the practical first-touch questions quickly enough: what do I bring, what do I run, what comes back, and what do I do next?

# Updated Truth

- `README.md` and `README.ko.md` now lead with one reviewable decision loop before the wider surface tour.
- `README.md` and `README.ko.md` now use rendered paragraphs and bold labels in the scenario blocks instead of relying on source-only line breaks.
- The README quick start now switches into the host repo first, uses the cwd-default repo behavior, and includes an agent-ready install prompt directly under the command block.
- The scenario section now uses short scenario-block structure so each archetype is scannable in the same reader-facing shape.
- The Korean landing surface now uses friendlier labels such as `준비물` instead of more literal checklist wording.
- The README landing sections now introduce easier phrases first and delay formal terms such as `held-out`, `packet`, and `review packet` until the reader has the product picture.
- `install.md` now stays focused on the operator-facing guide while using cwd-default repo-local commands after `cd`.
- The durable story is now closer to the public spec report: `Cautilus` turns behavior evidence into a reviewable decision surface, not just a packet vocabulary.

# Brief

`Cautilus` is a repo-local evaluation contract layer for agent and workflow behavior that matters even when prompts change.
The shortest honest picture is simple: bring behavior evidence, turn it into a reusable packet, render a page a human can review, and use that durable result to decide whether a change should ship.
The three first-class archetypes remain chatbot regression, skill execution regression, and durable workflow recovery, but the README now shows each one in the same practical shape instead of only naming the taxonomy.

# Claim Audit

- Claim: the public landing surface should show one product-like end-to-end move before deeper philosophy.
  Status: reflected in `README.md` and `README.ko.md`.
- Claim: scenario paths should answer what to bring, what to run, what comes back, and what happens next.
  Status: reflected in all three README scenario blocks.
- Claim: README and public spec tone should stay aligned.
  Status: the new opening loop explicitly points back to `docs/specs/index.spec.md`.

# Compression

- Before: README first-touch experience leaned on positioning and architecture.
- After: README first-touch experience starts with one reusable decision loop and then broadens into archetypes and deeper product stance.

# Open Questions

- `docs/specs/index.spec.md` now aligns well with README, but `README` may still be denser than ideal for readers who only want install plus one path.
- If that remains a problem, the next cut is probably a shorter top-of-file "Try this first" block rather than more narrative restructuring.

# Next Step

- Watch whether the remaining discomfort is about information density or about specific product terminology such as `packet`, `held-out`, and `review packet`.
