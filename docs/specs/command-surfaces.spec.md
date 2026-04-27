# Command Surfaces

`Cautilus` should expose its three product jobs as three first-class command families:

1. `claim` — discover declared behavior claims and turn them into a proof plan
2. `eval` — verify selected claims through bounded evaluation fixtures and summary packets
3. `optimize` — improve behavior after the proof surface is honest

This spec defines the command-surface contract and the deterministic `claim` packet helpers around `claim discover`.
The goal is to keep `Cautilus` repo-agnostic while making the product understandable from the binary and bundled skill alone.

## Problem

The product has converged on three jobs, but the command surface still exposes them unevenly.
`eval` is now the verification front door.
`optimize` already owns most improvement surfaces, including GEPA-style search.
The first job, declared-claim discovery and proof planning, is still mostly expressed in bundled-skill prose plus scenario proposal helpers.

That creates two risks:

- operators may think `Cautilus` starts only after they already know which fixture to write
- bundled-skill guidance may drift into repo-specific wording such as README proof instead of naming the generic product job

## Current Slice

Define the stable command-family map and ship the first `claim` commands without disturbing the already-shipped `eval` and `optimize` families.
The implemented slice is intentionally deterministic: it inventories explicit truth surfaces and emits source-ref-backed proof-plan candidates.
Default output is not silently capped; agents are first-class readers of the packet and should filter or select claims explicitly instead of inheriting a hidden product limit.
Current discovery starts from adapter-owned entries or README.md/AGENTS.md/CLAUDE.md and follows repo-local Markdown links to depth 3.
Existing-packet helpers summarize a proof plan and prepare bounded review clusters without calling an LLM.
The reviewed-claim helper plans eval fixtures from reviewed `cautilus-eval` claims without writing host-owned fixtures, prompts, runners, or policy.
The validation helper gives automation a packet-shape and evidence-ref gate before a reviewed claim packet is reused.
The no-input agent entry point is `agent status`: it emits a read-only orientation packet so the bundled skill can summarize readiness, claim-state availability, scan scope, and branch choices before running discovery, evaluation, review, optimization, edits, or commits.

## See It Work

```run:shell
tmpdir=$(mktemp -d)
./bin/cautilus agent status --repo-root . --json >"$tmpdir/agent-status.json"
./bin/cautilus claim discover --repo-root ./fixtures/claim-discovery/tiny-repo --output "$tmpdir/claims.json"
./bin/cautilus claim show --input "$tmpdir/claims.json" --sample-claims 2 --output "$tmpdir/claim-status.json"
./bin/cautilus claim review prepare-input --claims "$tmpdir/claims.json" --max-clusters 2 --output "$tmpdir/claim-review-input.json"
cat >"$tmpdir/claim-review-result.json" <<'JSON'
{
  "schemaVersion": "cautilus.claim_review_result.v1",
  "reviewRun": {"reviewer": "spec-fixture"},
  "clusterResults": [
    {
      "clusterId": "cluster-spec",
      "claimUpdates": [
        {
          "claimId": "claim-agents-md-3",
          "reviewStatus": "agent-reviewed",
          "evidenceStatus": "satisfied",
          "evidenceRefs": [
            {
              "kind": "test",
              "path": "docs/specs/command-surfaces.spec.md",
              "matchKind": "direct",
              "contentHash": "sha256:spec",
              "supportsClaimIds": ["claim-agents-md-3"]
            }
          ]
        }
      ]
    }
  ]
}
JSON
./bin/cautilus claim review apply-result --claims "$tmpdir/claims.json" --review-result "$tmpdir/claim-review-result.json" --output "$tmpdir/reviewed-claims.json"
./bin/cautilus claim validate --claims "$tmpdir/reviewed-claims.json" --output "$tmpdir/claim-validation.json"
./bin/cautilus claim plan-evals --claims "$tmpdir/reviewed-claims.json" --output "$tmpdir/claim-eval-plan.json"
grep -q '"schemaVersion": "cautilus.agent_status.v1"' "$tmpdir/agent-status.json"
grep -q '"schemaVersion": "cautilus.claim_proof_plan.v1"' "$tmpdir/claims.json"
grep -q '"schemaVersion": "cautilus.claim_status_summary.v1"' "$tmpdir/claim-status.json"
grep -q '"schemaVersion": "cautilus.claim_review_input.v1"' "$tmpdir/claim-review-input.json"
grep -q '"schemaVersion": "cautilus.claim_validation_report.v1"' "$tmpdir/claim-validation.json"
grep -q '"schemaVersion": "cautilus.claim_eval_plan.v1"' "$tmpdir/claim-eval-plan.json"
grep -q '"valid": true' "$tmpdir/claim-validation.json"
grep -q '"reviewApplication": {' "$tmpdir/reviewed-claims.json"
grep -q '"nonWriterNotice":' "$tmpdir/claim-eval-plan.json"
grep -q '"proofLayer": "human-auditable"' "$tmpdir/claims.json"
grep -q '"proofLayer": "deterministic"' "$tmpdir/claims.json"
grep -q '"proofLayer": "cautilus-eval"' "$tmpdir/claims.json"
grep -q '"recommendedEvalSurface": "repo/whole-repo"' "$tmpdir/claims.json"
```

## Fixed Decisions

### Three Canonical Families

| Product job | Command family | Current status | Primary packet |
| --- | --- | --- | --- |
| discover declared behavior claims and proof layers | `cautilus claim ...` | deterministic discovery slice shipped | `cautilus.claim_proof_plan.v1` |
| verify a selected claim | `cautilus eval ...` | shipped | `eval-cases.json`, `eval-observed.json`, `eval-summary.json` |
| improve behavior against an honest proof surface | `cautilus optimize ...` | shipped | `cautilus.optimize_*` and `cautilus.revision_artifact.v1` |

The command family names are singular nouns on purpose.
They match existing CLI style (`scenario`, `eval`, `optimize`) and avoid a README-specific product concept.

### Claim Surface

The first `claim` front door is:

```bash
cautilus claim discover --repo-root . --output /tmp/cautilus-claims.json
```

The command discovers candidate claims from explicit repo-owned truth surfaces.
Default truth surfaces are entry-first rather than repo-wide:

- adapter-configured `claim_discovery.entries`, when present
- otherwise README.md, AGENTS.md, and CLAUDE.md when present
- repo-local Markdown files linked from those entries up to depth 3
- explicit `--source` paths when an agent or host repo wants to override the default inventory

The command MUST keep host-specific policy local.
It may point at source files and propose proof layers, but it must not import host-specific adapters, prompts, storage readers, or private workflow conventions into Cautilus.

### Claim Output

`cautilus claim discover` emits `cautilus.claim_proof_plan.v1`.
Each claim candidate records:

- `claimId`
- `summary`
- `sourceRefs[]`
- `proofLayer`: `human-auditable`, `deterministic`, `cautilus-eval`, `scenario-candidate`, or `alignment-work`
- `recommendedProof`
- `verificationReadiness`
- `evidenceStatus`
- `reviewStatus`
- `lifecycle`
- `claimFingerprint`
- optional `recommendedEvalSurface`: one of `repo/whole-repo`, `repo/skill`, `app/chat`, `app/prompt`
- `whyThisLayer`
- `nextAction`

The output is a plan, not a verdict.
It does not claim that the repo is correct.
It tells an operator or agent what should be proven where.
It should preserve the discovered backlog honestly; prioritization belongs in the next agent step or a future explicit selection command, not in a hidden cap.

`cautilus claim show --input <claims.json>` emits `cautilus.claim_status_summary.v1`.
It summarizes an existing proof-plan packet without rescanning.
When called with `--sample-claims <n>`, it includes a bounded `sampleClaims` list so agents can inspect stable candidate fields without guessing raw packet keys.
The summary includes `gitState`.
If `gitState.isStale=true`, review, review-application, and eval-planning commands must reject the packet unless the operator explicitly passes `--allow-stale-claims`.

`cautilus claim review prepare-input --claims <claims.json>` emits `cautilus.claim_review_input.v1`.
It groups candidates into deterministic review clusters and records the review budget.
It does not call an LLM, schedule subagents, merge duplicates, or mark evidence satisfied.
It rejects stale claim packets by default.

`cautilus claim review apply-result --claims <claims.json> --review-result <review-result.json>` consumes `cautilus.claim_review_result.v1` and emits an updated claim packet.
It applies reviewed labels, evidence refs, provenance, merge decisions, and unresolved questions.
It rejects `evidenceStatus=satisfied` unless a direct or verified evidence ref supports the claim.
It rejects stale claim packets by default before merging review results.

`cautilus claim validate --claims <claims.json>` emits `cautilus.claim_validation_report.v1`.
It checks packet shape and evidence refs without mutating claims or searching for new evidence.
It exits non-zero when the packet is invalid.

`cautilus claim plan-evals --claims <reviewed-claims.json>` emits `cautilus.claim_eval_plan.v1`.
It selects reviewed `cautilus-eval` claims whose `verificationReadiness` is `ready-to-verify`.
It rejects stale claim packets by default.
It records claim ids, target eval surfaces, draft intents, source refs, evidence status, review status, and unresolved questions.
It does not write host-owned fixtures, prompts, runners, wrappers, or acceptance policy.

### Eval Surface

`eval` remains the verification family.
The canonical happy path is still:

```bash
cautilus eval test --repo-root . --fixture <fixture.json> --output-dir <run-dir>
cautilus eval evaluate --input <run-dir>/eval-observed.json --output <run-dir>/eval-summary.recheck.json
```

`eval` consumes selected claims only after a host repo turns them into fixtures and adapter-owned runners.
Cautilus owns the fixture schema, observed packet, summary packet, and bounded execution loop.
The host repo owns the fixture contents, runner implementation, prompt files, wrappers, and acceptance policy.

### Optimize Surface

`optimize` remains the improvement family.
It should not be the first step for an unproven claim.
It consumes existing report, evidence, scenario, review, or eval-derived packets and produces bounded proposals or revision artifacts.

GEPA-style search belongs under `optimize`, not under `claim` or `eval`, because it changes behavior after the proof surface exists.

### Relationship To Scenario Commands

Existing `scenario normalize`, `scenario prepare-input`, and `scenario propose` commands are supporting surfaces for claim discovery.
They stay because they carry normalized proposal-input workflows.
They are not the canonical first product job once `claim discover` exists.

`claim discover` may recommend a `scenario-candidate` when the repo has evidence but not yet a protected eval fixture.
It should point to the relevant scenario command rather than duplicating scenario packet logic.

## Probe Questions

- **How semantic should claim extraction be?**
  Start with deterministic source inventory and lightweight claim candidates that can be audited from file references.
  Add model-backed extraction only when there is a checked packet contract and an explicit runner boundary.
- **Should `claim discover` auto-read every doc?**
  No for the first slice.
  Start with conservative default truth surfaces plus explicit `--source` overrides, and keep large private source mining out of the product boundary.
- **Should proof plans include confidence scores?**
  Defer.
  The first useful output is a reviewable plan with source refs and next actions, not a pseudo-objective score.

## Deferred Decisions

- Whether `claim` gets companion commands such as `claim render-html`.
- Whether `scenario` commands eventually move under `claim` or stay as their own long-lived family.
- Whether `optimize` should gain a user-facing `improve` alias.
  The current command remains `optimize`.

## Non-Goals

- Do not build a repo-specific README auditor.
- Do not make Cautilus ingest private host data without an explicit host-owned source packet or wrapper.
- Do not make `claim discover` verify behavior.
- Do not make `optimize` run before an eval or evidence surface exists.

## Deliberately Not Doing

- **Naming the command `readme`.**
  README is one truth surface, not the product concept.
- **Adding per-claim proof commands such as `claim test`.**
  Verification belongs to `eval` once a claim becomes a fixture.
- **Folding all scenario commands into `claim` immediately.**
  Scenario proposal flows are already shipped and should be reused, not renamed in the first slice.

## Constraints

- The three families must be discoverable from `cautilus commands --json`.
- The bundled skill must route claim discovery, evaluation, and optimization to the same family names as the binary.
- Generated claim plans must be repo-agnostic and source-ref based.
- `claim discover` must be useful before a repo has a runnable eval adapter.
- `claim discover` must not imply that deterministic unit-test claims belong in Cautilus eval fixtures.

## Success Criteria

1. A fresh consumer can ask Cautilus what declared behavior claims still need proof before writing eval fixtures.
2. A proof plan can distinguish human-auditable, deterministic, eval-backed, scenario-candidate, and alignment-work claims.
3. Claims that need Cautilus eval are mapped to one of the four current eval presets.
4. The command registry and bundled skill present `claim`, `eval`, and `optimize` as the three product front doors.
5. Existing `eval` and `optimize` behavior remains backward compatible while the first deterministic `claim` surface lands.

## Acceptance Checks

The first implementation slice includes:

- command registry entry for `cautilus claim discover`
- command registry entries for `cautilus claim show` and `cautilus claim review prepare-input`
- command registry entry for `cautilus claim review apply-result`
- command registry entry for `cautilus claim plan-evals`
- command registry entry for `cautilus claim validate`
- `cautilus claim discover --example-output`
- fixture-backed unit tests for `cautilus.claim_proof_plan.v1`
- fixture-backed unit tests for `cautilus.claim_status_summary.v1` and `cautilus.claim_review_input.v1`
- fixture-backed unit tests for `cautilus.claim_review_result.v1` application and satisfied-evidence rejection
- fixture-backed unit tests for `cautilus.claim_eval_plan.v1` selection over reviewed eval claims
- fixture-backed unit tests for `cautilus.claim_validation_report.v1` over valid and invalid evidence refs
- a CLI smoke test that discovers claims from a tiny temp repo with README, AGENTS.md, and one deterministic-test-like claim
- a bundled-skill disclosure check that requires the `claim`, `eval`, and `optimize` family names and forbids README-specific naming as the core concept
- public spec proof that the command can emit at least one `human-auditable`, one `deterministic`, and one `cautilus-eval` candidate from checked-in fixtures

## Premortem

Potential failure: `claim discover` becomes a vague AI reviewer.
Countermeasure: first slice emits source-ref-backed proof plans and keeps model-backed extraction out until a runner boundary exists.

Potential failure: users think every claim should become a Cautilus eval.
Countermeasure: `proofLayer` is required, and deterministic claims must point away from eval fixtures.

Potential failure: the command becomes README-specific because README is the easiest demo.
Countermeasure: examples must include at least one non-README truth surface, and command names must use `claim`, not `readme`.

Potential failure: `claim` duplicates scenario proposal logic.
Countermeasure: `claim` recommends scenario commands for proposal-candidate work and does not reimplement scenario packet assembly.

## Canonical Artifact

This file is the command-surface implementation contract.
`docs/master-plan.md` carries only the durable roadmap summary.
`skills/cautilus/SKILL.md` should stay short and route through the binary once the `claim` command exists.

## Implementation Slices

The first implementation slice shipped `cautilus claim discover` with a conservative deterministic source inventory and a fixture-backed proof-plan packet.
The next slice shipped `claim show` and `claim review prepare-input` as existing-packet deterministic helpers.
The next slice shipped `claim review apply-result` with guarded evidence satisfaction.
The next slice shipped `claim plan-evals` as an intermediate planning packet over reviewed eval claims.
The next slice shipped `claim validate` as a non-mutating packet and evidence-ref gate.
The next open claim slice is likely bounded evidence preflight, unless dogfood points back to eval fixture authoring first.
