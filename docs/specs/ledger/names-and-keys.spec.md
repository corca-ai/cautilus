# Names And Keys

Cautilus spec titles are the names readers use.
A title should be clear enough to work in conversation, links, tables, and review notes.

This follows the same design pressure as a good wiki page or domain model:
the name carries meaning, and a rename is a concept change unless the surrounding contract moves with it.

## Names

| kind | examples | naming rule |
| --- | --- | --- |
| workflow promise | [Readiness](../promises/doctor-readiness.spec.md), [Claim Discovery](../promises/claim-discovery.spec.md), [Behavior Evaluation](../promises/evaluation.spec.md), [Bounded Improvement](../promises/improvement.spec.md) | name the user-visible job Cautilus supports |
| cross-cutting rule | [Evidence Gaps](../rules/evidence-gaps.spec.md), [Host-Owned Execution](../rules/host-owned-execution.spec.md), [Packet Freshness](../rules/packet-freshness.spec.md) | name the rule or risk that applies across workflows |
| proof state | [Evidence Map](../evidence/evidence-map.spec.md), [Proof Gaps](../evidence/gaps.spec.md), [Latest Selected Evidence](../evidence/latest-selected-evidence.spec.md) | name what the reader can inspect |

## Current Aliases

| stable name | user-facing name | rule |
| --- | --- | --- |
| [Host-Owned Execution](../rules/host-owned-execution.spec.md) | [Host Ownership](../promises/ownership.spec.md) | use the stable name in model and concern pages; use the user-facing name where the reader is choosing Cautilus boundaries |

## Compact Keys

Tables and packets may use compact keys such as `promise.readiness`, `rule.evidence-gaps`, or `gap.live-batch-fixture`.
Those keys mirror the human names and should not become the primary product language.

## Rename Rule

A rename moves the title, slug, machine key, prose, packets, tests, and view mappings together.
When only reader wording changes, keep the stable name and add an alias in this file.
