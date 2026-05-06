# Gather: Domain Language And Cross-Cutting Concerns

Source:

- https://wiki.g15e.com/pages/Aspect-oriented%20programming
- https://wiki.g15e.com/pages/Tyranny%20of%20the%20dominant%20decomposition

Freshness: gathered on 2026-05-06 from public web pages.
Access Mode: public web fetch.

## Requested Facts

The user asked whether Cautilus user-facing specs, binary output, and bundled-skill surfaces can reflect two design instincts:

- align user-facing, business/domain, developer-documentation, and code vocabulary where possible
- treat user-facing stories as main concerns while preserving cross-cutting concerns that otherwise get scattered or ignored

## Captured Source Notes

The AOP page defines aspect-oriented programming as a paradigm that modularizes cross-cutting concerns through aspects.
It also includes the caution that AOP can be dangerous when the mechanism is applied too broadly or without clear boundaries.

The dominant-decomposition page names the problem caused by forcing information or software structure through one dominant decomposition.
It gives software examples where domain modules stay visible while concerns such as logging or security become scattered.
It points toward multidimensional separation of concerns as the counterpressure.

## Implications For Cautilus

Cautilus should keep a shared product vocabulary across user specs, binary JSON fields, skill instructions, maintainer specs, and code helpers.
For example, `readiness`, `adapter`, `claim discovery`, `evaluation surface`, `evidence gap`, `reviewable artifact`, `meaning`, and `detail` should mean the same thing in user prose, `doctor` packets, tests, and implementation helpers.

User-facing spec pages should represent the dominant workflow decomposition:
Readiness, Claim Discovery, Behavior Evaluation, Bounded Optimization, and Host Ownership.

Cross-cutting concerns should not become hidden side notes.
They should appear in the user index as cross-cutting stories or invariants and be projected into every relevant story through local proof:
reviewable artifacts, evidence gaps, host ownership boundaries, packet provenance, cost/budget, and agent/human readability.

Avoid overusing aspect language in public docs.
The product should expose concrete contracts and evidence routes, not abstract AOP terminology.

## Open Design Hooks

- Add a vocabulary alignment rule to the durable HITL/spec guidance.
- Keep cross-cutting user-facing pages linked from the index and also referenced locally where they constrain a main workflow story.
- Add maintainer-side mapping that shows which cross-cutting invariants apply to each main user story.
- Consider a lightweight check that flags renamed public terms when docs, JSON fields, and tests drift apart.
