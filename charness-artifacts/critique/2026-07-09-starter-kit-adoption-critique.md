# Starter Kit Adoption Critique

Date: 2026-07-09

## Execution

Fresh-eye review was parent-delegated for the starter-kit adoption slice.
Prepared packet consumed: `charness-artifacts/critique/2026-07-09-050347-packet.md`.

## Act Before Ship

- Starter smoke failure output was not structured.
  Fixed by emitting `cautilus.starter_kit_smoke.v1` JSON with `ok:false`, failing phase, sanitized command, `spawnError`, and stdout/stderr excerpts.
- Starter READMEs blurred the adapter boundary by implying the command template itself is `cautilus evaluate fixture`.
  Fixed by naming host-owned command templates invoked by `cautilus evaluate fixture`.
- Master-plan starter wording overstated behavior proof.
  Fixed by describing bootstrap adapters and proposal-input examples.
- The starter index could be mistaken for a claim-source truth surface.
  Fixed by explicitly classifying it as an example catalog and pointing claim truth to the guide and master-plan.

## Bundle Anyway

- `docs/guides/cli.md` now describes starter selection by normalization family or behavior shape rather than evaluation surface.
- `docs/master-plan.md` now uses normalization-family proposal flow vocabulary in the product target list.

## Over-Worry

- Starter smoke should not prove real consumer behavior.
  Adapter resolution, `doctor ready`, and normalized candidate output are the right bounded proof for bootstrap examples.
- Generated claim churn is acceptable for this slice after `claims:refresh:all`; claim identity stability is a separate design seam.

## Valid But Defer

- If starter kits become a stronger user-facing adoption promise later, add a user spec or consumer-readiness entry.
- Claim packet line-id churn remains a valid follow-up outside this slice.

## Verification

- `node --test --test-reporter=spec --test-reporter-destination=stdout scripts/on-demand/smoke-starter-kits.test.mjs scripts/starter-kit-parity.test.mjs`
- `npm run consumer:starters:smoke`
- `npm run test:on-demand`
- `npm run verify`
