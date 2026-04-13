---
name: cautilus
description: "Use when intentful behavior evaluation itself is the task and the repo should run Cautilus's checked-in workflow instead of reconstructing compare, held-out, and review commands by hand."
---

# Cautilus

Use this bundled skill when intentful behavior evaluation itself is the task
and the repo wants to run the checked-in `Cautilus` workflow instead of
rebuilding commands by hand.

The installed skill assumes `cautilus` is already available on `PATH`.
If it is not, install the CLI first and verify with `cautilus --version`.
To materialize this skill in a host repo, run `cautilus skills install`.

`Cautilus` should stay usable as a standalone product:

- resolve or scaffold repo-local adapters
- run bounded review variants through the bundled CLI
- evaluate operator-facing behavior, including CLI surfaces, with explicit
  intent packets
- keep held-out evaluation and review prompts explicit
- keep host-repo fixtures, prompts, and policy outside the product boundary

## Bootstrap

1. Resolve the adapter from the target repo:

```bash
cautilus adapter resolve --repo-root .
```

For a named adapter:

```bash
cautilus adapter resolve --repo-root . --adapter-name code-quality
```

2. If the repo does not have an adapter yet, scaffold one:

```bash
cautilus adapter init --repo-root .
```

3. Check whether the repo is already ready for standalone `Cautilus` use:

```bash
cautilus doctor --repo-root .
```

4. Read the canonical workflow and contracts before widening the surface:

- [workflow.md](references/workflow.md)
- [active-run.md](references/active-run.md)
- [adapter-contract.md](references/adapter-contract.md)
- [reporting.md](references/reporting.md)
- [scenario-proposal-sources.md](references/scenario-proposal-sources.md)
- [scenario-proposal-inputs.md](references/scenario-proposal-inputs.md)
- [scenario-proposal-normalization.md](references/scenario-proposal-normalization.md)
- [chatbot-normalization.md](references/chatbot-normalization.md)
- [skill-normalization.md](references/skill-normalization.md)
- [review-packet.md](references/review-packet.md)
- [review-prompt-inputs.md](references/review-prompt-inputs.md)
- [evidence-bundle.md](references/evidence-bundle.md)
- [optimization.md](references/optimization.md)
- [revision-artifact.md](references/revision-artifact.md)

## Workflow

1. Resolve the adapter and restate the candidate, baseline, and intended
   decision.
2. When the run needs clean git-ref A/B workspaces, prepare them with the
   product-owned helper. `--output-dir` is optional when `workspace start`
   has already pinned `CAUTILUS_RUN_DIR`; the helper will drop `baseline/`
   and `candidate/` inside that active `runDir`:

```bash
cautilus workspace prepare-compare \
  --repo-root . \
  --baseline-ref origin/main \
  --output-dir /tmp/cautilus-compare
```

3. Pin one active run for the workflow with `workspace start` instead of
   inventing `--output-dir` paths by hand, and prune older recognized bundles
   with `workspace prune-artifacts` instead of letting logs and compare
   workspaces grow forever. The default stdout of `workspace start` is a
   single shell-evalable line, so `eval` is the happy path:

```bash
eval "$(cautilus workspace start --label mode-held-out)"
```

   `workspace start` defaults `--root` to `./.cautilus/runs/` (auto-created
   on first use) and writes a `run.json` manifest inside the new directory so
   the pruner recognizes it even before any other bundle file is written.
   After the `eval`, `CAUTILUS_RUN_DIR` is set in the current shell and
   consumer commands like `mode evaluate`, `review variants`, `review
   prepare-input`, and `workspace prepare-compare` resolve their runDir from
   that env var. Operators do not need to pipe a JSON payload or thread paths
   between commands. Pass `--json` instead of `eval` if a script needs the
   machine-readable payload.

```bash
cautilus workspace prune-artifacts \
  --root ./.cautilus/runs \
  --keep-last 20
```

4. Run adapter-defined preflight commands before long evaluations.
5. Use iterate mode for tuning, held-out mode for validation, and full gate for
   ship decisions.
6. When the adapter defines `executor_variants`, run the checked-in review
   runner instead of retyping ad-hoc shell commands:

```bash
cautilus review variants \
  --repo-root . \
  --workspace . \
  --output-dir /tmp/cautilus-review
```

When the target repo is `Cautilus` itself, prefer the checked-in explicit
self-dogfood command over rebuilding the same mode/report/review chain by hand:

```bash
npm run dogfood:self
```

When the job is tuning the self-dogfood review budget or comparing review
surfaces, use the checked-in experiment runner instead of inventing ad hoc
A/B loops:

```bash
npm run dogfood:self:experiments
```

When the job only needs to refresh the static HTML comparison view of the
current latest experiments bundle, use:

```bash
npm run dogfood:self:experiments:html
```

When the job only needs to refresh the static HTML view of the current
checked-in self-dogfood bundle (for example after hand-editing the markdown
narrative or regenerating JSON offline), use:

```bash
npm run dogfood:self:html
```

Treat `dogfood:self` as the canonical operator-facing record of the current
self-dogfood result. Treat `dogfood:self:experiments` as the place for stronger
claims such as binary-surface, skill-surface, and gate-honesty probes.
Treat the experiments `index.html` as a read-only compare view of the latest
experiment summary/report bundle so A/B outcomes are visible side by side.
Treat `dogfood:self:html` as a read-only view of the checked-in JSON bundle,
not as a separate source of truth.

7. Report exact commands, exact placeholder values, and the final recommendation.
8. When the repo already has normalized scenario proposal candidates, generate
   a checked-in proposal packet instead of hand-drafting scenario JSON:

```bash
cautilus scenario normalize chatbot \
  --input ./fixtures/scenario-proposals/chatbot-input.json

cautilus scenario normalize skill \
  --input ./fixtures/scenario-proposals/skill-input.json

cautilus scenario prepare-input \
  --candidates ./fixtures/scenario-proposals/candidates.json \
  --registry ./fixtures/scenario-proposals/registry.json \
  --coverage ./fixtures/scenario-proposals/coverage.json \
  --family fast_regression

cautilus scenario propose \
  --input ./fixtures/scenario-proposals/standalone-input.json

cautilus scenario summarize-telemetry \
  --results ./fixtures/scenario-proposals/results.json

cautilus report build \
  --input ./fixtures/reports/report-input.json

# --output-dir is optional when cautilus workspace start has already pinned
# CAUTILUS_RUN_DIR. Pass it explicitly only when you need to override the
# active run (for example, inside a self-dogfood script that mints its own
# curated bundle path).
cautilus mode evaluate \
  --repo-root . \
  --mode held_out \
  --intent "Operator-facing behavior should remain legible." \
  --baseline-ref origin/main \
  --output-dir /tmp/cautilus-mode

cautilus review prepare-input \
  --repo-root . \
  --report-file /tmp/cautilus-mode/report.json

cautilus review build-prompt-input \
  --review-packet /tmp/cautilus-mode/review.json

cautilus review render-prompt \
  --input /tmp/cautilus-mode/review-prompt-input.json

cautilus evidence prepare-input \
  --report-file /tmp/cautilus-mode/report.json \
  --scenario-results-file /tmp/cautilus-mode/held_out-scenario-results.json \
  --run-audit-file /tmp/cautilus-run-audit/run-audit-summary.json \
  --history-file /tmp/cautilus-history/scenario-history.snapshot.json

cautilus evidence bundle \
  --input /tmp/cautilus-evidence/input.json

cautilus optimize prepare-input \
  --report-file /tmp/cautilus-mode/report.json \
  --review-summary /tmp/cautilus-review/review-summary.json \
  --history-file /tmp/cautilus-history/scenario-history.snapshot.json \
  --target prompt \
  --optimizer reflection \
  --budget medium

cautilus optimize propose \
  --input /tmp/cautilus-optimize/input.json

cautilus optimize build-artifact \
  --proposal-file /tmp/cautilus-optimize/proposal.json

cautilus review variants \
  --repo-root . \
  --workspace . \
  --report-file /tmp/cautilus-mode/report.json \
  --output-dir /tmp/cautilus-review

```

## Guardrails

- Do not treat one host repo's prompts, adapters, or report paths as product-owned
  defaults.
- Do not turn review loops into open-ended retries.
- Do not turn optimizer output into an open-ended retry loop.
- Keep held-out evaluation held out unless the benchmark itself is being
  changed deliberately.
- Prefer checked-in wrapper scripts and schemas over inline shell quoting.
