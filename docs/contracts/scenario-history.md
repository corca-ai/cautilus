# Scenario History Contract

`Cautilus` needs a repo-agnostic way to decide which scenarios run during
iterate, held-out, and full-gate evaluation, and how repeated train runs
change scenario cadence over time.

This document extracts the generic scenario-profile, history, and baseline-cache
rules proven in Ceal's prompt benchmark workflow without importing Ceal's
scenario packs, instance paths, or audit storage model.

## Scope

This contract owns:

- scenario profile shape for train, held-out, and full-gate selection
- persisted history shape for graduated train cadence
- baseline-cache key semantics for repeatable compare runs
- deterministic selection and update rules

This contract does not yet own:

- Ceal's built-in scenario ids or prompt profiles
- scenario authoring UX
- scenario proposal or mining from runtime logs
- admin web storage or visualization

## Profile Shape

A scenario-history-aware profile should define:

```json
{
  "schemaVersion": "cautilus.scenario_profile.v1",
  "profileId": "default-train",
  "description": "Iterate on train scenarios while keeping control rows in every run.",
  "historyPolicy": {
    "maxGraduationInterval": 5,
    "recentResultsLimit": 12
  },
  "scenarios": [
    {
      "scenarioId": "same-thread-topic-shift",
      "split": "train",
      "cohort": "probe",
      "cadence": "graduated"
    },
    {
      "scenarioId": "control-review-then-approve",
      "split": "train",
      "cohort": "control",
      "cadence": "always"
    },
    {
      "scenarioId": "held-out-follow-up",
      "split": "test",
      "cohort": "held-out",
      "cadence": "always"
    }
  ]
}
```

Required fields:

- `profileId`
- `scenarios[*].scenarioId`
- `scenarios[*].split`
- `scenarios[*].cadence`

Optional but useful fields:

- `description`
- `historyPolicy`
- `scenarios[*].cohort`

Allowed values:

- `split`: `train`, `test`, or `all`
- `cadence`: `always` or `graduated`

## History Shape

Persisted history should be profile-scoped and append-only at the run level.

```json
{
  "schemaVersion": "cautilus.scenario_history.v1",
  "profileId": "default-train",
  "trainRunCount": 7,
  "scenarioStats": {
    "same-thread-topic-shift": {
      "lastTrainRunIndex": 7,
      "graduationInterval": 3,
      "recentTrainResults": [
        {
          "runIndex": 5,
          "timestamp": "2026-04-09T21:00:00.000Z",
          "overallScore": 100,
          "passRate": 1,
          "status": "passed",
          "fullCheck": false
        }
      ]
    }
  },
  "recentRuns": [
    {
      "runIndex": 7,
      "timestamp": "2026-04-09T21:00:00.000Z",
      "split": "train",
      "fullCheck": false,
      "selectedScenarioIds": ["same-thread-topic-shift", "control-review-then-approve"]
    }
  ]
}
```

## Selection Rules

`Cautilus` should select scenarios with these rules:

1. If the requested split is not `train`, run every scenario in the requested
   split.
2. If the run is a full check, run every scenario in the requested split even
   when train graduation history exists.
3. For ordinary train runs:
   - always include scenarios whose cadence is `always`
   - include `graduated` scenarios only when they are due
4. A scenario is due when:
   - it has never run in train mode, or
   - `nextTrainRunIndex - lastTrainRunIndex >= graduationInterval`

## Update Rules

After a run finishes, update history with these rules:

1. Only scenarios that belong to the profile's `train` split affect graduation.
2. If no train scenarios were selected, leave history unchanged.
3. If the run is a full check, leave history unchanged even when train
   scenarios were selected.
4. Otherwise increment `trainRunCount` by one and append one `recentRuns` row.
5. For each selected train scenario:
   - record `lastTrainRunIndex`
   - append one recent train result row
   - if the result is perfect, widen cadence by one step up to
     `maxGraduationInterval`
   - if the result is imperfect, reset cadence back to `1`

Current proven perfect-result rule:

- `passRate === 1`
- `overallScore === 100`

Current proven imperfect-result rule:

- any other score or pass rate
- missing result
- non-passing status

## Baseline Cache Shape

Compare runs often need a frozen baseline side so only the candidate reruns.
The baseline cache key should be derived from:

- baseline repo fingerprint
- profile id
- selected scenario ids
- scenario-definition fingerprint
- cached baseline sample count

Recommended cache payload:

```json
{
  "schemaVersion": "cautilus.scenario_baseline_cache.v1",
  "cacheKey": {
    "baselineFingerprint": "abc123",
    "profileId": "default-train",
    "scenarioIds": ["same-thread-topic-shift"],
    "scenarioFingerprint": "def456",
    "cacheSampleCount": 5
  },
  "createdAt": "2026-04-09T21:00:00.000Z",
  "baselineRepoLabel": "main@abc123",
  "results": []
}
```

Cache invalidation should happen when any key field changes.

## Fixed Decisions

- Train, held-out, and full-gate selection should come from checked-in profile
  data, not from ad-hoc shell lists.
- Graduation is a train-only cost control, not a held-out shortcut.
- Full checks bypass graduation for selection.
- Full checks do not advance `trainRunCount` or scenario graduation history.
- History must be profile-scoped.
- Baseline cache keys must include scenario-definition identity, not only repo
  identity.

## Probe Questions

- Should perfect-result thresholds stay fixed at `100` and `1.0`, or become
  adapter-configurable once multiple evaluation backends exist?
- Should `split: all` stay explicit in profile data, or remain a runtime union
  over `train` and `test`?

## Deferred Decisions

- canonical file extension and path conventions for profile/history/cache files
- whether scenario cohorts are only descriptive or later affect reporting
- whether low-confidence adjudication policy belongs in this contract or in a
  compare-run contract

## Source References

- `/home/ubuntu/ceal/scripts/agent-runtime/prompt-benchmark-profile.mjs`
- `/home/ubuntu/ceal/scripts/agent-runtime/compare-prompt-worktrees.mjs`
- `/home/ubuntu/ceal/docs/prompt-benchmarking.md`
