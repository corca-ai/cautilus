# Names And Keys

Cautilus spec titles are the names readers use.
A title should be clear enough to work in conversation, links, tables, and review notes.

This follows the same design pressure as a good wiki page or domain model:
the name carries meaning, and a rename is a concept change unless the surrounding contract moves with it.

## Names

| kind | examples | naming rule |
| --- | --- | --- |
| workflow promise | [Readiness](readiness.spec.md), [Claim Discovery](claim-discovery.spec.md), [Behavior Evaluation](evaluation.spec.md), [Bounded Optimization](optimization.spec.md) | name the user-visible job Cautilus supports |
| shared concern | [Evidence Gaps](../concerns/evidence-gaps.spec.md), [Host-Owned Execution](../concerns/host-owned-execution.spec.md), [Packet Freshness](../concerns/packet-freshness.spec.md) | name the rule or risk that applies across workflows |
| proof state | [Evidence Map](../proof/evidence-map.spec.md), [Proof Gaps](../proof/gaps.spec.md), [Latest Selected Evidence](../proof/latest-selected-evidence.spec.md) | name what the reader can inspect |

## Current Aliases

| stable name | user-facing name | rule |
| --- | --- | --- |
| [Host-Owned Execution](../concerns/host-owned-execution.spec.md) | [Host Ownership](../user/ownership.spec.md) | use the stable name in model and concern pages; use the user-facing name where the reader is choosing Cautilus boundaries |

## Compact Keys

Tables and packets may use compact keys such as `promise.readiness`, `concern.evidence-gaps`, or `gap.traceability-config`.
Those keys mirror the human names and should not become the primary product language.

## Rename Rule

A rename moves the title, slug, machine key, prose, packets, tests, and view mappings together.
When only reader wording changes, keep the stable name and add an alias in this file.

```run:shell
# Verify the named model and reading roots exist.
test -f docs/specs/model/promise-ledger.spec.md
test -f docs/specs/user/index.spec.md
test -f docs/specs/maintainer/index.spec.md
test -f docs/specs/concerns/index.spec.md
test -f docs/specs/proof/index.spec.md
```
