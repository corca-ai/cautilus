# Claim 211 Evidence Boundary Debug
Date: 2026-05-01

## Problem

Fresh-eye review found that `.cautilus/claims/evidence-dev-skill-routing-install.json` could be read as satisfying Claude conversational execution for `claim-readme-md-211`, even though the behavior proof in this bundle is Codex-only.

## Correct Behavior

Given a README claim that names Claude and Codex plugin manifests, when the checked-in evidence bundle only runs the conversational skill eval under Codex, then the satisfied claim boundary must distinguish manifest presence from runtime parity.
The packet may satisfy the install/plugin-surface claim only if it explicitly does not claim Claude conversational runtime parity.

## Observed Facts

- `claim-readme-md-211` says `cautilus install` lands a bundled skill with Claude and Codex plugin manifests so an in-editor agent can drive the same contracts conversationally.
- The routing/install evidence bundle records a Codex `self-dogfood-eval-skill` run with three passing cases.
- The same bundle records Claude marketplace and plugin manifest content hashes.
- It did not run a Claude conversational eval for this bundle.

## Reproduction

1. Read `.cautilus/claims/evidence-dev-skill-routing-install.json`.
2. Compare `evidenceScope.runtime=codex` with the previous `claimBoundary` wording that mentioned Codex/Claude agent plugin surfaces driving contracts conversationally.
3. Observe that a reader could infer Claude runtime parity from the boundary text even though only Codex behavior was executed.

## Candidate Causes

- The evidence bundle combined install-surface proof and runtime behavior proof in one sentence.
- The README claim itself combines manifest installation and conversational driving in adjacent prose.
- The first evidence application focused on whether the bundle satisfied the product claim and did not separately name the parity it was not proving.

## Hypothesis

If the evidence bundle states that Claude/Codex manifests are present while conversational behavior is proven under Codex, and adds a `notClaimed` carve-out for Claude conversational runtime parity, then the claim can remain satisfied without implying unrun Claude behavior.

## Verification

- Updated `.cautilus/claims/evidence-dev-skill-routing-install.json` to narrow `claimBoundary`.
- Added `Claude conversational runtime parity for this evidence bundle` to `notClaimed`.
- Updated `.cautilus/claims/review-result-evidence-dev-skill-routing-install.json` and regenerated `.cautilus/claims/evidenced-typed-runners.json`.
- Re-ran `claim validate` on the evidenced packet.
- Verified all bundle paths and hashes with `sha256sum -c`.

## Root Cause

The bundle had an honest `runtime=codex` field but the human-facing boundary sentence was too broad.
The structured evidence and prose boundary were not equally precise.

## Seam Risk

- Interrupt ID: claim-211-evidence-boundary
- Risk Class: claim-boundary
- Seam: checked-in evidence bundle to README claim satisfaction
- Disproving Observation: Claude plugin manifest hashes existed, but no Claude conversational runtime eval was attached to this evidence bundle
- What Local Reasoning Cannot Prove: whether future release acceptance should require Claude runtime parity in addition to Codex proof
- Generalization Pressure: medium; mixed install/runtime claims need explicit `notClaimed` boundaries

## Interrupt Decision

- Premortem Required: yes
- Next Step: impl
- Handoff Artifact: none

## Prevention

When one evidence bundle combines static install-surface proof with runtime behavior proof, make the runtime and parity boundaries explicit in `evidenceScope.claimBoundary`, `evidenceScope.notClaimed`, and the applied `evidenceStatusReason`.
