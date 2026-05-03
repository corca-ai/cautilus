# Optimization

`Cautilus optimize` improves selected behavior without losing the proof surface that makes the improvement believable.

## User Promise

Cautilus supports bounded improvement loops where the target claim, budget, and protected checks are explicit before work begins.

## Subclaims

- Optimization starts from an explicit behavior target, not an open-ended retry request.
- The improvement budget and protected checks are recorded before the loop runs.
- The result records what changed, what was reused, and which held-out checks still protect against regressions.
- Blocked readiness should be visible instead of being hidden behind repeated attempts.

## Evidence

The current executable proof checks that optimization is a first-class command family and advertises bounded preparation, search, proposal, and artifact steps.
Future proof should connect concrete optimize packets and held-out eval results.

> check:cautilus-command
| args_json | stdout_includes |
| --- | --- |
| ["optimize","--help"] | optimize prepare-input |
| ["optimize","--help"] | optimize search run |
| ["optimize","--help"] | improve |
