# Cautilus

Use this bundled skill when evaluation itself is the task and the repo wants to
run the checked-in `Cautilus` workflow instead of rebuilding commands by hand.

`Cautilus` should stay usable as a standalone product:

- resolve or scaffold repo-local adapters
- run bounded review variants through the bundled CLI
- keep held-out evaluation and review prompts explicit
- keep host-repo fixtures, prompts, and policy outside the product boundary

## Bootstrap

1. Resolve the adapter from the target repo:

```bash
node ./bin/cautilus adapter resolve --repo-root .
```

For a named adapter:

```bash
node ./bin/cautilus adapter resolve --repo-root . --adapter-name code-quality
```

2. If the repo does not have an adapter yet, scaffold one:

```bash
node ./bin/cautilus adapter init --repo-root .
```

3. Check whether the repo is already ready for standalone `Cautilus` use:

```bash
node ./bin/cautilus doctor --repo-root .
```

4. Read the canonical workflow and contracts before widening the surface:

- [docs/workflow.md](/home/ubuntu/cautilus/docs/workflow.md)
- [docs/contracts/adapter-contract.md](/home/ubuntu/cautilus/docs/contracts/adapter-contract.md)
- [docs/contracts/reporting.md](/home/ubuntu/cautilus/docs/contracts/reporting.md)
- [docs/contracts/scenario-proposal-sources.md](/home/ubuntu/cautilus/docs/contracts/scenario-proposal-sources.md)

## Workflow

1. Resolve the adapter and restate the candidate, baseline, and intended
   decision.
2. Run adapter-defined preflight commands before long evaluations.
3. Use iterate mode for tuning, held-out mode for validation, and full gate for
   ship decisions.
4. When the adapter defines `executor_variants`, run the checked-in review
   runner instead of retyping ad-hoc shell commands:

```bash
node ./bin/cautilus review variants \
  --repo-root . \
  --workspace . \
  --output-dir /tmp/cautilus-review
```

5. Report exact commands, exact placeholder values, and the final recommendation.
6. When the repo already has normalized scenario proposal candidates, generate
   a checked-in proposal packet instead of hand-drafting scenario JSON:

```bash
node ./bin/cautilus scenario propose \
  --input ./fixtures/scenario-proposals/standalone-input.json
```

## Guardrails

- Do not treat Ceal-local prompts, adapters, or report paths as product-owned
  defaults.
- Do not turn review loops into open-ended retries.
- Keep held-out evaluation held out unless the benchmark itself is being
  changed deliberately.
- Prefer checked-in wrapper scripts and schemas over inline shell quoting.
