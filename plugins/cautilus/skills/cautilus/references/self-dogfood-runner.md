# Self-Dogfood Runner

Use this reference when the target repo is `Cautilus` itself.
These are maintainer-local wrappers around the product CLI; host repos do not need to reach for them.

## Canonical eval-test record

```bash
npm run dogfood:self
npm run dogfood:self:eval
```

Use this when the job is to refresh the canonical operator-facing record of the current self-dogfood eval-test result.
Rebuilds the checked-in `artifacts/self-dogfood/eval/latest/` bundle by invoking `cautilus eval test --adapter-name self-dogfood-eval` against the repo.
`dogfood:self` is the canonical maintainer entry point and currently delegates to `dogfood:self:eval`.

## Checked-in bundle HTML view

```bash
npm run dogfood:self:html
cautilus self-dogfood render-html
```

Refreshes the static HTML view of the current checked-in self-dogfood bundle (for example after hand-editing the markdown narrative or regenerating JSON offline).
Treat this as a read-only view of the checked-in JSON bundle, not as a separate source of truth.
The product-owned renderer is `cautilus self-dogfood render-html`; the `npm run` entry is a repo-local wrapper for maintainers.

## Claim boundaries

- `dogfood:self` is canonical and `dogfood:self:eval` is the explicit eval-test wrapper it delegates to.
- The HTML view is read-only; the JSON bundle remains the source of truth.
- The legacy tuning-experiment runner was retired alongside `cautilus mode evaluate`; rebuilding tuning-experiment evidence on top of the eval-test surface is a follow-up slice.
