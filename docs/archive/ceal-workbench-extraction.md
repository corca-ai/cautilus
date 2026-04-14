# Cautilus Bootstrap From Ceal Workbench

This document is the import guide for turning Ceal's current `workbench` skill
into the first real `Cautilus` product boundary.

The goal is not to redesign the evaluation engine from scratch inside
`Cautilus`. The goal is to copy the current proven contract out of Ceal with as
little semantic drift as possible, then let Ceal become one consumer of that
engine.

## Source Of Truth In Ceal

Current source files:

- `/home/ubuntu/ceal/.agents/skills/workbench/SKILL.md`
- `/home/ubuntu/ceal/.agents/skills/workbench/references/adapter-contract.md`
- `/home/ubuntu/ceal/.agents/skills/workbench/references/reporting.md`
- `/home/ubuntu/ceal/.agents/skills/workbench/scripts/resolve_adapter.py`
- `/home/ubuntu/ceal/.agents/skills/workbench/scripts/init_adapter.py`
- `/home/ubuntu/ceal/.agents/skills/workbench/scripts/_stdlib_yaml.py`
- `/home/ubuntu/ceal/.agents/skills/workbench/adapter.example.yaml`
- `/home/ubuntu/ceal/.agents/skills/workbench/agents/openai.yaml`
- `/home/ubuntu/ceal/WORKBENCH_PRODUCT_EXTRACTION_PLAN.md`

Ceal-owned adapters and repo-local usage surfaces that should stay in Ceal:

- `/home/ubuntu/ceal/.agents/cautilus-adapter.yaml`
- `/home/ubuntu/ceal/.agents/cautilus-adapters/code-quality.yaml`
- `/home/ubuntu/ceal/.agents/cautilus-adapters/skill-smoke.yaml`

## Product Boundary

`Cautilus` should own:

- the generic evaluation workflow contract
- adapter search and validation rules
- iterate / held-out / comparison / full-gate mode semantics
- executor-variant contract
- report packet contract
- repo-agnostic examples and bootstrap scripts

`Cautilus` should not initially own:

- Ceal-specific adapter instances
- Ceal-specific fixture paths
- Ceal-specific report destinations
- Ceal-specific prompts or review presets

## Import Now

Copy these artifacts first, with semantics preserved:

1. Workflow contract
   - port `SKILL.md` into product docs that describe the evaluation workflow
   - keep the current sequence: resolve adapter, preflight, iterate, compare,
     held-out, full gate, human review, recommendation
2. Adapter contract
   - port `references/adapter-contract.md` as the canonical v1 adapter schema
   - preserve placeholder names and search order for now
3. Reporting contract
   - port `references/reporting.md` as the canonical report packet shape
4. Bootstrap scripts
   - port `resolve_adapter.py`, `init_adapter.py`, `_stdlib_yaml.py`
   - keep behavior compatible with current Ceal adapters
5. Example material
   - port `adapter.example.yaml`
   - optionally port `agents/openai.yaml` only as a transition example, not as
     a permanent product assumption

## Leave In Ceal

Do not move these in the first extraction wave:

- `.agents/cautilus-adapter.yaml`
- `.agents/cautilus-adapters/*.yaml`
- Ceal report output paths
- Ceal prompt fixtures and review prompts
- Ceal docs that tell operators when to trust or distrust a run

Ceal should keep running its current evaluation surfaces while `Cautilus` is
becoming real.

## Suggested Initial Layout

Start with a documentation-first and script-first layout:

```text
docs/
  contracts/
    adapter-contract.md
    reporting.md
  migration/
    ceal-workbench-extraction.md
  workflow.md
examples/
  adapter.example.yaml
scripts/
  resolve_adapter.py
  init_adapter.py
  _stdlib_yaml.py
```

If `Cautilus` later grows a CLI or package layer, add it after the contract is
stable instead of inventing the runtime surface first.

## Import Sequence

### Phase 1: Freeze The Contract

- copy the three contract documents into `Cautilus`
- keep wording close to Ceal until the first passing import works
- avoid renaming placeholders, modes, or report fields yet

### Phase 2: Re-home The Scripts

- copy the Python helper scripts into `Cautilus/scripts/`
- make the scripts read local `Cautilus` contract files, not Ceal paths
- keep adapter search order compatible with existing Ceal adapter locations so
  Ceal can consume `Cautilus` without rewriting adapters immediately

### Phase 3: Publish A Repo-Agnostic Runtime Entry

- add a minimal CLI or documented command entrypoint that resolves an adapter
  and prints or runs the rendered workflow steps
- keep the runtime bounded and explicit
- do not hardcode Ceal defaults into the CLI

### Phase 4: Repoint Ceal

- update Ceal's `workbench` skill to consume `Cautilus` contracts and scripts
  instead of owning generic copies
- keep Ceal adapters local
- prove Ceal can still run `code-quality` and `skill-smoke` after the repoint

### Phase 5: Hand Off To charness

- let `charness` consume `Cautilus` as an external integration, not as a
  public skill
- add install/update/doctor logic only after `Cautilus` has a stable release
  boundary

## File Mapping

| Ceal source | First Cautilus destination | Ownership |
| --- | --- | --- |
| `.agents/skills/workbench/SKILL.md` | `docs/workflow.md` | Cautilus |
| `.agents/skills/workbench/references/adapter-contract.md` | `docs/contracts/adapter-contract.md` | Cautilus |
| `.agents/skills/workbench/references/reporting.md` | `docs/contracts/reporting.md` | Cautilus |
| `.agents/skills/workbench/scripts/resolve_adapter.py` | `scripts/resolve_adapter.mjs` | Cautilus |
| `.agents/skills/workbench/scripts/init_adapter.py` | `scripts/init_adapter.mjs` | Cautilus |
| `.agents/skills/workbench/scripts/_stdlib_yaml.py` | `scripts/_stdlib_yaml.mjs` | Cautilus |
| `.agents/skills/workbench/adapter.example.yaml` | `examples/adapter.example.yaml` | Cautilus |
| `.agents/cautilus-adapter.yaml` | keep in place | Ceal |
| `.agents/cautilus-adapters/code-quality.yaml` | keep in place | Ceal |
| `.agents/cautilus-adapters/skill-smoke.yaml` | keep in place | Ceal |

## Acceptance Criteria For The First Real Extraction

The first extraction is good enough when all of these are true:

- `Cautilus` owns the generic workflow, adapter, and reporting docs
- `Cautilus` owns the adapter bootstrap scripts
- Ceal can call the `Cautilus` scripts without changing Ceal adapter files
- Ceal still runs its named adapters successfully after the repoint
- `charness` still treats the evaluator as a future external integration rather
  than a public skill

## Guardrails

- Do not improve the contract and extract it in the same pass unless the change
  is obviously generic and already proven in Ceal
- Do not move Ceal adapters upstream before the engine boundary is stable
- Do not let `charness` depend on an unreleased moving target
- Prefer one stable import over a theoretically cleaner redesign

## Immediate Next Moves

1. Copy the contract docs and helper scripts into `Cautilus`.
2. Preserve current placeholder names, report fields, and adapter search order.
3. Add one minimal runtime entrypoint in `Cautilus` after the copied contracts
   are in place.
4. Repoint Ceal's `workbench` skill to the `Cautilus` copies only after the
   copied scripts run against existing Ceal adapters.
