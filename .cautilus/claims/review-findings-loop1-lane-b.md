# Lane B Claim Review Findings

Scope: clusters 4-7 from `.cautilus/claims/review-input-loop1.json`.
All JSON updates use `reviewStatus=agent-reviewed` and keep `evidenceStatus=unknown` because this lane did not attach direct verified evidence refs with hashes or commits.
I did inspect repo evidence for routing confidence, but did not promote any claim to `satisfied`.

## Cluster 4: Claim Discovery And Review

- `claim-readme-md-148` is not a `dev/repo` claim.
  The README line sits in the "Skill / agent execution regression" section and describes `surface=dev, preset=skill` multi-turn agent episodes.
  The checked-in fixtures under `fixtures/eval/dev/skill/` use `turns` plus `auditKind`, and `internal/runtime/skill_test_cases.go` accepts `turns` only for execution cases.
  Recommended correction: `recommendedEvalSurface=dev/skill`.
- `claim-readme-md-232` is a false positive for `cautilus-eval`.
  The claim is about static HTML views for human browser review, and `docs/specs/html-report.spec.md` carries executable renderer proof.
  Recommended correction: `recommendedProof=deterministic`.
  The current review-result packet shape cannot clear an already-set `recommendedEvalSurface=dev/repo`, so this remains an application concern if the result is merged as-is.

## Cluster 5: Documentation And Contracts

- `claim-readme-md-171` is correctly a scenario candidate, but its target surface is missing.
  The claim is specifically about context recovery across turns in chatbot behavior, so the eventual fixture surface should be `app/chat`.
  Recommended correction: keep `recommendedProof=cautilus-eval`, keep `verificationReadiness=needs-scenario`, and set `recommendedEvalSurface=app/chat`.

## Cluster 6: Packets And Reporting

- `claim-readme-md-159` is under-routed as merely human-auditable.
  `exampleInputCli` is a deterministic catalog-field promise, and `internal/runtime/scenarios.go` defines that field on each catalog entry.
  Recommended correction: `recommendedProof=deterministic`.

## Cluster 7: Quality Gates

- `claim-readme-md-211` is a false positive for `app/chat`.
  The claim is about `cautilus install`, bundled skill materialization, and Claude/Codex plugin manifests, not chatbot product behavior.
  Recommended correction: `recommendedEvalSurface=dev/skill`.
  The claim may need splitting because install file materialization is deterministic while conversational agent driving is eval-shaped.

## Suggested Binary Heuristic Changes

- Use the nearest Markdown heading as a strong routing feature.
  In this batch, the "Skill / agent execution regression" heading would have routed `claim-readme-md-148` to `dev/skill`.
- Avoid paragraph or neighboring-sentence bleed for `app/chat`.
  `claim-readme-md-211` appears near chatbot wording, but its own sentence is about install and plugin surfaces.
- Treat `static HTML`, `render-html`, `catalog entry`, and `exampleInputCli` as deterministic or human-auditable packet/renderer signals before considering `cautilus-eval`.
- When `verificationReadiness=needs-scenario` and the claim mentions conversation, follow-up, context recovery, or turns, set the likely `recommendedEvalSurface=app/chat` even before the scenario is normalized.
- Add a review-result merge affordance for clearing `recommendedEvalSurface` on non-eval claims.
  Without that, reviewers can correct `recommendedProof` but cannot remove a stale eval surface from heuristic discovery.
