# AGENTS

This repo is the standalone product boundary for `Cautilus`.

## Operating Stance

- Use the actual available skills for this turn before improvising a local workflow.
- Keep manually maintained docs in English.
  Exceptions: [docs/internal/handoff.md](./docs/internal/handoff.md), [docs/maintainers/operator-acceptance.md](./docs/maintainers/operator-acceptance.md), executable specs under [docs/specs/](./docs/specs), and temporary product-planning notes while they are being rewritten.
- Speak to this user in Korean unless they ask otherwise.
- Prefer the source of truth over copied checklists.
  Deterministic behavior belongs in code, scripts, adapters, tests, and specs.
- Keep product surfaces agent-first, but human-auditable by design.
  Prefer explicit artifacts, normalized packets, and inspectable intermediate files over hidden discovery or product-owned ingestion of raw host-specific shapes.
- Optimize for `Cautilus` as an independent binary plus bundled skill before optimizing any host repo as a consumer.
- Prose markdown uses semantic line breaks: one sentence per line, no hard-wrap at a column width.
  This is so fixed-pattern assertions in specs cannot be broken by incidental wrap positions and so prose edits produce clean sentence-level diffs.
  Applies to all `.md` files except `docs/specs/*.md` (tables plus executable patterns), `docs/internal/handoff.md`, and `docs/maintainers/operator-acceptance.md`.
  Code fences, tables, and YAML blocks are never reflowed.
- Treat `charness-artifacts/` changes as repo state.
  Commit meaningful review, debug, and release artifacts so other sessions inherit the evidence.
  When canonical content has not changed, current-pointer helpers such as `latest.md` should no-op instead of emitting timestamp-only diffs.

## Product Intent

- `Cautilus` owns generic intentful behavior evaluation workflow contracts.
- Host repos own adapter instances, fixtures, prompts, and policy.
- The product should prefer explicit baselines, held-out validation, bounded loops, and structured review over ad-hoc benchmark narratives.
- The long-term direction is intent-first and intentful behavior evaluation: prompts can change if the evaluated behavior gets better.

## Current Boundaries

- Generic contracts live under [docs/](./docs).
- Bootstrap adapter helpers live under [scripts/](./scripts).
- Minimal runtime runners live under [scripts/agent-runtime/](./scripts/agent-runtime).
- The CLI entrypoint lives at [bin/cautilus](./bin/cautilus).
- The bundled standalone skill lives under [skills/cautilus/](./skills/cautilus).
- Product roadmap lives at [docs/master-plan.md](./docs/master-plan.md).

## Repo Memory

- [docs/internal/handoff.md](./docs/internal/handoff.md): next-session pickup and volatile state
- [docs/internal/working-patterns.md](./docs/internal/working-patterns.md): durable operating patterns and review-trigger policy
- [docs/master-plan.md](./docs/master-plan.md): durable product direction and priority order
- [docs/specs/index.spec.md](./docs/specs/index.spec.md): currently claimed product surface
- [docs/specs/archetype-boundary.spec.md](./docs/specs/archetype-boundary.spec.md): first-class archetype 1:1 contract (chatbot / skill / workflow)
- [docs/maintainers/operator-acceptance.md](./docs/maintainers/operator-acceptance.md): tiered human acceptance checklist
- [docs/guides/consumer-adoption.md](./docs/guides/consumer-adoption.md): generic consumer adoption path

## Skill Routing

For task-oriented sessions in this repo, call the shared/public charness skill `find-skills` once at startup before broader exploration.

Use its capability inventory as the default map of installed public skills, support skills, synced support surfaces, and integrations.

After that bootstrap pass, choose the durable work skill that best matches the request from the installed charness surface.

Validation-shaped closeout or operator reading test requests go through `quality` validation recommendations before HITL or same-agent manual review.

Keep this block short. Detailed routing belongs in installed skill metadata and `find-skills` output, not in a long checked-in catalog.

## Working Rules

- Keep the adapter schema repo-agnostic.
- Do not import host-specific adapters, prompts, output paths, or audit UI unless they are being explicitly generalized.
- Prefer adding small bounded runtimes over large operator surfaces.
- If a consumer repo has gained generic evaluation knowledge, bring it here rather than letting the contracts drift.
- When opening issues in other repos, emphasize `why` and `what` more than `how`.
  Lead with the user, operator, or agent-facing problem and the desired contract or decision boundary.
  Treat implementation sketches as candidate direction, not as the core payload of the issue.
- When adding a new runtime surface, add at least one executable test.
- While implementing, any bug, error, regression, or unexpected behavior routes to `charness:debug` before further fixes.
- When changing the bundled `skills/cautilus/` surface or behavior-steering references, freeze the current consumer intent before broad edits by deciding whether reviewed dogfood, maintained evaluator scenarios, or checked-in scenario review proof will carry the change.
- Treat `Cautilus` as a CLI plus bundled-skill product surface when reviewing skill, plugin, install, or release changes.
  The repo-local quality adapter owns the concrete probe list; do not make this a generic release ritual for repos that do not declare the same product shape.
- For `skills/cautilus/`, `plugins/cautilus/skills/cautilus/`, plugin metadata, install, or command-discovery changes, run a quality pass that checks progressive disclosure between the bundled skill and the binary.
  The skill should own routing, sequencing, guardrails, and decision boundaries; the binary should own broad command discovery, help text, scenario catalogs, packet examples, install smoke, and doctor/readiness details.
- When a quality or release review asks for evaluator, review, CLI-discovery, or agent-surface proof, verify that the selected adapter can actually run that surface before treating the gate as available.
  If the adapter cannot run it, fix the adapter or record an explicit waiver before release.
- Premortem, counterweight, and bounded fresh-eye review are on-demand gates, not standing requirements.
  Task-completing `init-repo` and `quality` review runs count as explicitly in scope.
  When one is explicitly in scope or required by a repo artifact, treat the review as already delegated by the repo contract.
  Do not wait for a second user message asking for delegation.
  If the host blocks subagent spawning, stop and report that restriction explicitly instead of substituting a same-agent pass.

## Before Stopping on a Spec-Driven Slice

- New pure function in a new file: add fixture tests in the same slice, not after the fact.
- New placeholder or adapter field: update the matching contract doc under [docs/contracts/](./docs/contracts).
- Re-read the spec's decision section and confirm every bullet is either in the code or explicitly deferred in the spec.

## Commit Discipline

- After each meaningful unit of work, create a git commit before moving on.
- Write commit messages so later announcements can recover intent without guessing.
- Prefer commit subjects that state user-facing or operator-facing purpose, not mechanism.
- Add a short body when it clarifies the trigger, boundary, or behavior change.

## Local Checks

Once per clone, install the checked-in Git hooks:

```bash
npm run hooks:install
```

Use these before stopping:

```bash
npm run verify
npm run hooks:check
```

Use `npm run lint` and `npm run test` directly when iterating on one seam, but do not require all three in sequence before stopping.

On-demand checks:

```bash
npm run test:on-demand
```

`npm run test:on-demand` currently owns the heavier self-dogfood workflow script tests.
Run it when changing release-prep flow, self-dogfood workflow scripts, or operator-facing quality record behavior.

Key direct commands:

```bash
cautilus adapter resolve --repo-root .
cautilus adapter init --repo-root .
cautilus doctor --repo-root .
cautilus review variants --repo-root . --workspace . --output-dir /tmp/cautilus-review
```
