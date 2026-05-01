# Scenario History Contract

`Cautilus` needs a repo-agnostic way to decide which scenarios run during iterate, held-out, and full-gate evaluation, and how repeated train runs change scenario cadence over time.

This document extracts the generic scenario-profile, history, and baseline-cache rules proven in earlier prompt benchmark workflows without importing one consumer's scenario packs, instance paths, or audit storage model.

## Scope

This contract owns:

- scenario profile shape for train, held-out, and full-gate selection
- persisted history shape for graduated train cadence
- baseline-cache key semantics for repeatable compare runs
- deterministic selection and update rules

This contract does not yet own:

- one consumer's built-in scenario ids or prompt profiles
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
          "fullCheck": false,
          "durationMs": 420,
          "telemetry": {
            "provider": "openai",
            "model": "gpt-5.4",
            "total_tokens": 380,
            "cost_usd": 0.031
          }
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

1. If the requested split is not `train`, run every scenario in the requested split.
2. If the run is a full check, run every scenario in the requested split even when train graduation history exists.
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
3. If the run is a full check, leave history unchanged even when train scenarios were selected.
4. Otherwise increment `trainRunCount` by one and append one `recentRuns` row.
5. For each selected train scenario:
   - record `lastTrainRunIndex`
   - append one recent train result row
   - if the result is perfect, widen cadence by one step up to `maxGraduationInterval`
   - if the result is imperfect, reset cadence back to `1`

Current proven perfect-result rule:

- `passRate === 1`
- `overallScore === 100`

Current proven imperfect-result rule:

- any other score or pass rate
- missing result
- non-passing status

Optional scenario-result telemetry fields:

- `durationMs`
- `startedAt`
- `completedAt`
- `telemetry.provider`
- `telemetry.model`
- `telemetry.prompt_tokens`
- `telemetry.completion_tokens`
- `telemetry.total_tokens`
- `telemetry.cost_usd`

This data should come from explicit scenario-result payloads, not from retroactive log scraping.

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

Current runtime note:

- profile-backed `comparison` runs now materialize a `baseline-cache.json` seed with this cache key shape
- the current seed records key identity and baseline label, but does not yet populate cached baseline results

## Fixed Decisions

- Train, held-out, and full-gate selection should come from checked-in profile data, not from ad-hoc shell lists.
- Graduation is a train-only cost control, not a held-out shortcut.
- Full checks bypass graduation for selection.
- Full checks do not advance `trainRunCount` or scenario graduation history.
- History must be profile-scoped.
- Baseline cache keys must include scenario-definition identity, not only repo identity.

## Probe Questions

- Should perfect-result thresholds stay fixed at `100` and `1.0`, or become adapter-configurable once multiple evaluation backends exist?
- Should `split: all` stay explicit in profile data, or remain a runtime union over `train` and `test`?

## Deferred Decisions

- canonical file extension and path conventions for profile/history/cache files
- whether scenario cohorts are only descriptive or later affect reporting
- whether low-confidence adjudication policy belongs in this contract or in a compare-run contract

## Deferred Expansion — Reusable Baseline Store + Broader Compare Ownership

Designed and premortemed on 2026-04-15, then deferred.
Recorded here so the next session does not re-run the same analysis.

### Planned scope (if unlocked)

- **Part 1 — reusable baseline result store.** Re-key the baseline-cache from `(profileId, scenarioIds, baselineFingerprint, scenarioFingerprint)` to a broader key that lets multiple profiles and entry points share one baseline result per evaluated commit (e.g.
  `(commitSha, scenarioId, adapterId, mode)`).
- **Part 2 — broader compare ownership.** Extend history / compare hooks beyond the single profile-backed eval path so `review variants`, profile-less eval test runs, and skill evaluation can also update history and materialize compare artifacts.

The two parts were planned as one coordinated slice, with README, [skills/cautilus/SKILL.md](../../skills/cautilus/SKILL.md), `cautilus --help` (registry), and this contract updated together.

### Why deferred

Premortem (4 angles: cache migration / external consumer / devil's advocate / doc cascade) surfaced a devil's-advocate finding strong enough to block execution and verified against repo state:

- The legacy `cautilus mode evaluate --mode comparison` path was the only one that materialized a baseline-cache file. That command was retired with the evaluation-surfaces redesign; rebuilding the cache materialization on the new `cautilus eval test` surface is itself a separate slice and has not been picked up.
- The legacy `run-self-dogfood.mjs` script that drove the cache-materialization branch was also retired; the new `dogfood:self:eval` flow does not yet exercise the comparison cache.
- Zero scenario profile files are checked in across `.agents/`, `fixtures/`, and the repo root.
- `cautilus review variants` and `cautilus eval evaluate` still contain zero `scenario-history` or `baseline-cache` persistence hooks today, so Part 2 still has no current call site.
- Live external consumers are not yet tracked in [consumer-readiness.md](../maintainers/consumer-readiness.md); the chatbot, skill-validation, and workflow entries are normalization-family reference fixtures, not live deployments.

Conclusion: the "shared baseline across multiple profiles" problem Part 1 solves has zero occurrences today, and the "other entry points also want history" problem Part 2 solves has zero requesters.
Master-plan Phase 5 guidance ("dogfood evidence should justify the next seam rather than adding heuristics speculatively") applies directly.

### Trigger to unlock

Any one of the following is enough to revisit:

1. A live external consumer (not a normalization-family fixture) runs an eval-test path across two or more adapter commands and measures baseline recomputation cost that the shared store would eliminate.
2. A live consumer or dogfood adapter begins materializing a baseline-cache file from the new `cautilus eval test` surface with a checked-in profile, so the cache path becomes hot enough to matter.
3. A concrete request to make `review variants` or `skill evaluate` history-aware lands with a named use case (e.g.
   "remember which skill test cases already passed last week").

### If/when unlocked — required fixes

These were identified by the premortem as blockers; keep the list so the next session does not re-derive them.

Must fix in the same slice:

- Bump `cautilus.scenario_baseline_cache.v1` to `v2` (or add a `cacheKeyVersion` field) when the key structure changes.
  Update both [contract-versions.mjs](../../scripts/agent-runtime/contract-versions.mjs) and [internal/contracts/constants.go](../../internal/contracts/constants.go) in the same commit.
- Rewrite the narrow-scope lines in [docs/specs/current-product.spec.md](../specs/current-product.spec.md) ("checked-in scenario profile를 쓰는 comparison run에서 baseline-cache seed와 cache key를 materialize" and "baseline cache는 reusable result store까지는 아직 아니다") to describe the new scope, or explicitly defer one more step.
- Document the three entry points in README, SKILL.md, `--help` text (registry usage strings), and this contract in one slice.
  The user-facing requirement is that usage lands in all four surfaces together.
- Keep `profile` optional for the non-profile entry points.
  `skill evaluate` and `review variants` must not be forced to declare a profile file just to participate in history.

Cheap to fold in:

- Graceful fallback in `loadScenarioHistory` / `loadBaselineCache` for the old key shape: either auto-migrate to the new key (if derivable) or move the old file under `.cautilus/legacy/` with a logged warning.
- `cautilus doctor` must still return `ready` against a repo that has only a v1 cache file on disk.
- Add a standing lint (`lint:history-compare-ownership` or folded into an existing check) that verifies `docs/contracts/scenario-history.md` and `docs/contracts/active-run.md` agree on cache-key structure, and that each entry point participating in history has a matching row in `current-product.spec.md`.
  Land before the slice if cascade drift is a real concern; otherwise fold in.
- Verify `sync-packaged-skill.mjs` handles any new upward links added to SKILL.md so the packaged copy still resolves.

Over-worry / skip:

- Archetype-boundary coupling.
  Scenario-history is archetype-neutral and stays that way unless a skill-specific graduation policy is introduced.
- Making `profile` mandatory.
  The existing fallback to `adapterData.profile_default || "default"` already covers the absence path and should remain.

## Source References

- [scenario-proposal-sources.md](./scenario-proposal-sources.md)
