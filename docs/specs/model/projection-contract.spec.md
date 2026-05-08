# Projection Contract

The Cautilus design docs use one canonical ledger and several projections.
This follows the current structure decision from the Engelbart/OHS, aspect-oriented, user-story, and executable-spec review lenses:
keep one model of the work, then expose different reader and concern projections without letting any projection become a second source of truth.

Canonical ledger: [Promise Ledger](promise-ledger.spec.md).
ID policy: [ID Policy](id-policy.spec.md).

## Projection Rules

- The ledger owns promise identity, concern identity, evidence posture, and first-order mapping.
- The user view orders primary workflow stories by user work sequence.
- The maintainer view orders proof routes by contract ownership.
- The concern lens answers where non-primary acceptance concerns attach across workflow and maintainer routes.
- The proof view records current evidence, stale proof, and expected proof gaps.
- Archived specs can inform migration, but they do not define current promises.

## Non-Goals

- Do not make cross-cutting concerns a third audience equivalent to user or maintainer.
- Do not force every concern into a user story.
- Do not treat readiness or discovery wording as immutable if the ledger needs a clearer structure.
- Do not treat expected-failing proof gaps as satisfied acceptance.

## Traceability Gap

Specdown supports typed document traceability, but this repo does not yet configure the trace graph.
Until that work lands, the ledger and link checker provide explicit reachability and identity discipline.
The concrete expected-failing check is tracked as `gap.traceability-config` in [Proof Gaps](../proof/gaps.spec.md).
