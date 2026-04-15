# Self-Dogfood Runner

Use this reference when the target repo is `Cautilus` itself.
These are maintainer-local wrappers around the product CLI; host repos do not need to reach for them.

## Canonical operator-facing record

```bash
npm run dogfood:self
```

Use this when the job is to refresh the canonical operator-facing record of the current self-dogfood result.
Rebuilds the checked-in `latest/` bundle.

## Tuning experiments

```bash
npm run dogfood:self:experiments
```

Use this when the job is tuning the self-dogfood review budget or comparing review surfaces.
This is the place for stronger claims such as binary-surface, skill-surface, and gate-honesty probes.
Does not overwrite the canonical `latest/` bundle.

## Experiment HTML view

```bash
npm run dogfood:self:experiments:html
cautilus self-dogfood render-experiments-html
```

Refreshes the static HTML compare view of the current latest experiments bundle.
Treat the experiments `index.html` as a read-only compare view of the latest experiment summary/report bundle so A/B outcomes are visible side by side.

## Checked-in bundle HTML view

```bash
npm run dogfood:self:html
cautilus self-dogfood render-html
```

Refreshes the static HTML view of the current checked-in self-dogfood bundle (for example after hand-editing the markdown narrative or regenerating JSON offline).
Treat this as a read-only view of the checked-in JSON bundle, not as a separate source of truth.
The product-owned renderer is `cautilus self-dogfood render-html`; the `npm run` entry is a repo-local wrapper for maintainers.

## Claim boundaries

- `dogfood:self` is canonical — the operator-facing record of the current self-dogfood result.
- `dogfood:self:experiments` is for stronger claims (binary-surface, skill-surface, gate-honesty).
- Both HTML views are read-only; the JSON bundles remain the source of truth.
