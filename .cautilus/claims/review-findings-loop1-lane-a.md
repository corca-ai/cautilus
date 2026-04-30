# Claim Review Lane A Findings

Input: `.cautilus/claims/review-input-loop1.json`.
Scope: clusters 0-3 only.
Result packet: `.cautilus/claims/review-result-loop1-lane-a.json`.

No candidate in this lane was marked `evidenceStatus=satisfied`.
The reviewed source text declares claims, but this lane did not verify direct evidence refs with content hashes or commits.

## Cluster 0

- `claim-readme-md-13` is a real product claim, but the heuristic routed a packaging and host-repo ownership contract to `cautilus-eval/dev/repo`.
  A deterministic install or adoption fixture is the stronger proof layer.
- `claim-readme-md-149` is a real product claim about the fixture runtime path.
  It should be proved by deterministic CLI/runtime tests, not a new LLM eval fixture.

## Cluster 1

- `claim-readme-md-7` is a real product claim about distribution and install shape.
  The current `cautilus-eval/dev/skill` route is too broad because the claim is not about model-mediated skill behavior.
  A deterministic install smoke plus `doctor` readiness proof would be clearer.

## Cluster 2

- `claim-readme-md-137` is not itself a scenario needing a new scenario.
  It describes the `scenario normalize chatbot` product path, so `needs-scenario` is the wrong readiness label.
- `claim-readme-md-91` is a false positive.
  It is a quoted `Input (For Agent)` example and should be context for the surrounding scenario-proposal claim, not an independent claim candidate.
- `claim-readme-md-95` is a real workflow contract, but `scenario-candidate` is misleading.
  The claim is about the scenario-proposal loop staying reopenable and human-promotable; deterministic proposal/render proof is the better layer.

## Cluster 3

- `claim-readme-md-148` is a real claim, but the recommended surface should be `dev/skill`.
  The source sentence is in the skill/agent execution regression section and names audit-backed multi-turn skill dogfood fixtures.
- `claim-readme-md-232` is a real claim about static HTML rendering for human review.
  It should route to deterministic renderer/spec proof or human-auditable artifact review, not `cautilus-eval/dev/repo`.

## Binary Heuristic Changes Suggested

- Add a quote/example filter for Markdown lines headed by `Input (For Agent)` or lines dominated by quoted user prompts.
  These should become context refs or retired candidates instead of standalone claims.
- Narrow the `scenario`, `proposal`, `candidate`, and `coverage` trigger.
  Use `needs-scenario` only when the claim says a future behavior scenario must be authored; when the text documents `cautilus scenario` commands or proposal packet behavior, prefer deterministic command/schema proof.
- Give install and packaging terms precedence over `skill`.
  Phrases like `standalone binary`, `install`, `checked into each host repo`, `.agents/cautilus-adapter.yaml`, and `.agents/skills/cautilus/` should route to deterministic install/adoption proof.
- Give static renderer terms precedence over broad eval terms.
  Phrases like `static HTML`, `browser`, `rendered contract`, and `human reviewer` should route to deterministic renderer specs or human-auditable proof.
- Improve surface inference with section context.
  Claims under `Skill / agent execution regression`, or claims mentioning audit-backed `turns`, reviewer-launch, review-prepare, first-scan, or refresh-flow fixtures, should prefer `dev/skill` unless they are explicitly about open-ended repo work.
- Consider allowing review-result updates to clear stale `recommendedEvalSurface`.
  Several claims should move from `cautilus-eval` to deterministic proof, but the current update model only applies non-empty surface values and cannot remove an inherited surface label.
