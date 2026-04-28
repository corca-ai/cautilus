# Claim Discovery Review Worksheet

This worksheet is the human-review layer for `.cautilus/claims/latest.json`.
Edit this Markdown file, not the JSON packet.
The goal is to improve Cautilus claim discovery precision, recall, grouping, and proof routing.

## Packet

- Claims packet: .cautilus/claims/latest.json
- Status summary: .cautilus/claims/status-summary.json
- Schema: cautilus.claim_proof_plan.v1
- Git commit: a9239c58a702ca55ed68336ceb5c1629400bf0cc
- Candidate count: 294
- Source count: 36
- Scan entries: README.md, AGENTS.md, CLAUDE.md
- Linked Markdown depth: 3
- Validation: fresh; stale=false

## Current Counts

By proof layer:
- cautilus-eval: 150
- scenario-candidate: 70
- deterministic: 50
- human-auditable: 18
- alignment-work: 6

By readiness:
- ready-to-verify: 218
- needs-scenario: 70
- needs-alignment: 6

By eval surface:
- none: 144
- dev/repo: 87
- dev/skill: 35
- app/prompt: 26
- app/chat: 2

By top source:
- docs/contracts/claim-discovery-workflow.md: 58
- docs/specs/command-surfaces.spec.md: 23
- README.md: 18
- docs/contracts/scenario-proposal-sources.md: 16
- docs/contracts/runtime-fingerprint-optimization.md: 15
- skills/cautilus/SKILL.md: 15
- docs/cli-reference.md: 14
- docs/contracts/adapter-contract.md: 12
- docs/guides/evaluation-process.md: 11
- docs/contracts/reporting.md: 10
- docs/specs/evaluation-surfaces.spec.md: 9
- AGENTS.md: 8
- CLAUDE.md: 8
- docs/contracts/optimization.md: 8
- docs/contracts/scenario-history.md: 8
- docs/maintainers/consumer-readiness.md: 7
- docs/maintainers/development.md: 7
- docs/contracts/active-run.md: 6
- docs/guides/consumer-adoption.md: 6
- docs/master-plan.md: 6
- docs/contracts/workbench-instance-discovery.md: 4
- docs/specs/current-product.spec.md: 4
- docs/specs/index.spec.md: 4
- docs/contracts/live-run-invocation.md: 3
- docs/specs/standalone-surface.spec.md: 3

## How To Fill This In

For each claim you review, replace `TODO` or `keep` on the human fields.
Use short controlled values first, then add free-form notes when needed.

Suggested values for `Human claim quality`:

- valid_claim
- not_a_claim
- too_vague
- duplicate
- too_small
- too_broad
- wrong_scope
- important_but_badly_worded

Suggested values for `Human corrected proof layer`:

- keep
- deterministic
- cautilus-eval
- scenario-candidate
- human-auditable
- alignment-work
- remove

Suggested values for `Human corrected eval surface`:

- keep
- dev/repo
- dev/skill
- app/chat
- app/prompt
- none

Suggested values for `Human readiness`:

- keep
- ready-to-verify
- needs-scenario
- needs-alignment
- remove

Suggested values for `Human priority`:

- P0: core product promise or severe misclassification
- P1: important proof routing or grouping issue
- P2: valid but lower-value cleanup
- P3: harmless noise

## Missing Claims

Use this section for false negatives: important claims that should have appeared but did not.

### M01
- Source:
- Expected claim summary:
- Suggested proof layer:
- Suggested eval surface:
- Priority:
- Notes:

### M02
- Source:
- Expected claim summary:
- Suggested proof layer:
- Suggested eval surface:
- Priority:
- Notes:

## Review Strategy

Start with high-value README claims and any claim whose current eval surface looks suspicious.
Then sample deterministic claims, scenario-candidate claims, and alignment-work claims.
For this first pass, 20 clear false positives, 10 missing claims, and 20 misclassified high-value claims are more useful than exhaustive review.

## Claims

### 001 claim-agents-md-12
<!-- claim-id: claim-agents-md-12 -->
- Source: AGENTS.md:12
- Summary: Deterministic behavior belongs in code, scripts, adapters, tests, and specs.
- Excerpt: Deterministic behavior belongs in code, scripts, adapters, tests, and specs.
- Current labels: proofLayer=deterministic; recommendedProof=deterministic; recommendedEvalSurface=n/a; readiness=ready-to-verify; reviewStatus=heuristic; evidenceStatus=unknown
- Group hints: deterministic, repo-instructions
- Current next action: Keep or add a repo-owned unit, lint, build, schema, or CI check for this claim.
- Why this layer: The claim names a deterministic gate or static contract that should be protected outside Cautilus eval.
- Human claim quality: TODO
- Human corrected proof layer: keep
- Human corrected eval surface: keep
- Human readiness: keep
- Human priority: TODO
- Duplicate of:
- Notes:

### 002 claim-agents-md-26
<!-- claim-id: claim-agents-md-26 -->
- Source: AGENTS.md:26
- Summary: `Cautilus` owns generic intentful behavior evaluation workflow contracts.
- Excerpt: `Cautilus` owns generic intentful behavior evaluation workflow contracts.
- Current labels: proofLayer=cautilus-eval; recommendedProof=cautilus-eval; recommendedEvalSurface=dev/repo; readiness=ready-to-verify; reviewStatus=heuristic; evidenceStatus=unknown
- Group hints: cautilus-eval, repo-instructions, dev/repo
- Current next action: Create a host-owned dev/repo fixture and run it through cautilus eval test.
- Why this layer: The claim depends on model, agent, prompt, skill, workflow, or behavior execution evidence.
- Human claim quality: TODO
- Human corrected proof layer: keep
- Human corrected eval surface: keep
- Human readiness: keep
- Human priority: TODO
- Duplicate of:
- Notes:

### 003 claim-agents-md-29
<!-- claim-id: claim-agents-md-29 -->
- Source: AGENTS.md:29
- Summary: The long-term direction is intent-first and intentful behavior evaluation: prompts can change if the evaluated behavior gets better.
- Excerpt: The long-term direction is intent-first and intentful behavior evaluation: prompts can change if the evaluated behavior gets better.
- Current labels: proofLayer=cautilus-eval; recommendedProof=cautilus-eval; recommendedEvalSurface=app/prompt; readiness=ready-to-verify; reviewStatus=heuristic; evidenceStatus=unknown
- Group hints: cautilus-eval, repo-instructions, app/prompt
- Current next action: Create a host-owned app/prompt fixture and run it through cautilus eval test.
- Why this layer: The claim depends on model, agent, prompt, skill, workflow, or behavior execution evidence.
- Human claim quality: TODO
- Human corrected proof layer: keep
- Human corrected eval surface: keep
- Human readiness: keep
- Human priority: TODO
- Duplicate of:
- Notes:

### 004 claim-agents-md-61
<!-- claim-id: claim-agents-md-61 -->
- Source: AGENTS.md:61
- Summary: Keep this block short. Detailed routing belongs in installed skill metadata and `find-skills` output, not in a long checked-in catalog.
- Excerpt: Keep this block short. Detailed routing belongs in installed skill metadata and `find-skills` output, not in a long checked-in catalog.
- Current labels: proofLayer=cautilus-eval; recommendedProof=cautilus-eval; recommendedEvalSurface=dev/skill; readiness=ready-to-verify; reviewStatus=heuristic; evidenceStatus=unknown
- Group hints: cautilus-eval, repo-instructions, dev/skill
- Current next action: Create a host-owned dev/skill fixture and run it through cautilus eval test.
- Why this layer: The claim depends on model, agent, prompt, skill, workflow, or behavior execution evidence.
- Human claim quality: TODO
- Human corrected proof layer: keep
- Human corrected eval surface: keep
- Human readiness: keep
- Human priority: TODO
- Duplicate of:
- Notes:

### 005 claim-agents-md-73
<!-- claim-id: claim-agents-md-73 -->
- Source: AGENTS.md:73
- Summary: While implementing, any bug, error, regression, or unexpected behavior routes to `charness:debug` before further fixes.
- Excerpt: While implementing, any bug, error, regression, or unexpected behavior routes to `charness:debug` before further fixes.
- Current labels: proofLayer=cautilus-eval; recommendedProof=cautilus-eval; recommendedEvalSurface=dev/repo; readiness=ready-to-verify; reviewStatus=heuristic; evidenceStatus=unknown
- Group hints: cautilus-eval, repo-instructions, dev/repo
- Current next action: Create a host-owned dev/repo fixture and run it through cautilus eval test.
- Why this layer: The claim depends on model, agent, prompt, skill, workflow, or behavior execution evidence.
- Human claim quality: TODO
- Human corrected proof layer: keep
- Human corrected eval surface: keep
- Human readiness: keep
- Human priority: TODO
- Duplicate of:
- Notes:

### 006 claim-agents-md-78
<!-- claim-id: claim-agents-md-78 -->
- Source: AGENTS.md:78
- Summary: The skill should own routing, sequencing, guardrails, and decision boundaries; the binary should own broad command discovery, help text, scenario catalogs, packet examples, install smoke, and doctor/readiness details.
- Excerpt: The skill should own routing, sequencing, guardrails, and decision boundaries; the binary should own broad command discovery, help text, scenario catalogs, packet examples, install smoke, and doctor/readiness details.
- Current labels: proofLayer=scenario-candidate; recommendedProof=cautilus-eval; recommendedEvalSurface=n/a; readiness=needs-scenario; reviewStatus=heuristic; evidenceStatus=unknown
- Group hints: cautilus-eval, repo-instructions, needs-scenario
- Current next action: Use the scenario proposal flow to normalize candidate evidence before creating a checked-in eval fixture.
- Why this layer: The claim points at scenario or proposal work before it is ready as a protected eval fixture.
- Human claim quality: TODO
- Human corrected proof layer: keep
- Human corrected eval surface: keep
- Human readiness: keep
- Human priority: TODO
- Duplicate of:
- Notes:

### 007 claim-agents-md-79
<!-- claim-id: claim-agents-md-79 -->
- Source: AGENTS.md:79
- Summary: When a quality or release review asks for evaluator, review, CLI-discovery, or agent-surface proof, verify that the selected adapter can actually run that surface before treating the gate as available.
- Excerpt: When a quality or release review asks for evaluator, review, CLI-discovery, or agent-surface proof, verify that the selected adapter can actually run that surface before treating the gate as available.
- Current labels: proofLayer=cautilus-eval; recommendedProof=cautilus-eval; recommendedEvalSurface=dev/repo; readiness=ready-to-verify; reviewStatus=heuristic; evidenceStatus=unknown
- Group hints: cautilus-eval, repo-instructions, dev/repo
- Current next action: Create a host-owned dev/repo fixture and run it through cautilus eval test.
- Why this layer: The claim depends on model, agent, prompt, skill, workflow, or behavior execution evidence.
- Human claim quality: TODO
- Human corrected proof layer: keep
- Human corrected eval surface: keep
- Human readiness: keep
- Human priority: TODO
- Duplicate of:
- Notes:

### 008 claim-agents-md-123
<!-- claim-id: claim-agents-md-123 -->
- Source: AGENTS.md:123
- Summary: `npm run test:on-demand` currently owns the heavier self-dogfood workflow script tests.
- Excerpt: `npm run test:on-demand` currently owns the heavier self-dogfood workflow script tests.
- Current labels: proofLayer=cautilus-eval; recommendedProof=cautilus-eval; recommendedEvalSurface=dev/repo; readiness=ready-to-verify; reviewStatus=heuristic; evidenceStatus=unknown
- Group hints: cautilus-eval, repo-instructions, dev/repo
- Current next action: Create a host-owned dev/repo fixture and run it through cautilus eval test.
- Why this layer: The claim depends on model, agent, prompt, skill, workflow, or behavior execution evidence.
- Human claim quality: TODO
- Human corrected proof layer: keep
- Human corrected eval surface: keep
- Human readiness: keep
- Human priority: TODO
- Duplicate of:
- Notes:

### 009 claim-claude-md-12
<!-- claim-id: claim-claude-md-12 -->
- Source: CLAUDE.md:12
- Summary: Deterministic behavior belongs in code, scripts, adapters, tests, and specs.
- Excerpt: Deterministic behavior belongs in code, scripts, adapters, tests, and specs.
- Current labels: proofLayer=deterministic; recommendedProof=deterministic; recommendedEvalSurface=n/a; readiness=ready-to-verify; reviewStatus=heuristic; evidenceStatus=unknown
- Group hints: deterministic, repo-instructions
- Current next action: Keep or add a repo-owned unit, lint, build, schema, or CI check for this claim.
- Why this layer: The claim names a deterministic gate or static contract that should be protected outside Cautilus eval.
- Human claim quality: TODO
- Human corrected proof layer: keep
- Human corrected eval surface: keep
- Human readiness: keep
- Human priority: TODO
- Duplicate of:
- Notes:

### 010 claim-claude-md-26
<!-- claim-id: claim-claude-md-26 -->
- Source: CLAUDE.md:26
- Summary: `Cautilus` owns generic intentful behavior evaluation workflow contracts.
- Excerpt: `Cautilus` owns generic intentful behavior evaluation workflow contracts.
- Current labels: proofLayer=cautilus-eval; recommendedProof=cautilus-eval; recommendedEvalSurface=dev/repo; readiness=ready-to-verify; reviewStatus=heuristic; evidenceStatus=unknown
- Group hints: cautilus-eval, repo-instructions, dev/repo
- Current next action: Create a host-owned dev/repo fixture and run it through cautilus eval test.
- Why this layer: The claim depends on model, agent, prompt, skill, workflow, or behavior execution evidence.
- Human claim quality: TODO
- Human corrected proof layer: keep
- Human corrected eval surface: keep
- Human readiness: keep
- Human priority: TODO
- Duplicate of:
- Notes:

### 011 claim-claude-md-29
<!-- claim-id: claim-claude-md-29 -->
- Source: CLAUDE.md:29
- Summary: The long-term direction is intent-first and intentful behavior evaluation: prompts can change if the evaluated behavior gets better.
- Excerpt: The long-term direction is intent-first and intentful behavior evaluation: prompts can change if the evaluated behavior gets better.
- Current labels: proofLayer=cautilus-eval; recommendedProof=cautilus-eval; recommendedEvalSurface=app/prompt; readiness=ready-to-verify; reviewStatus=heuristic; evidenceStatus=unknown
- Group hints: cautilus-eval, repo-instructions, app/prompt
- Current next action: Create a host-owned app/prompt fixture and run it through cautilus eval test.
- Why this layer: The claim depends on model, agent, prompt, skill, workflow, or behavior execution evidence.
- Human claim quality: TODO
- Human corrected proof layer: keep
- Human corrected eval surface: keep
- Human readiness: keep
- Human priority: TODO
- Duplicate of:
- Notes:

### 012 claim-claude-md-61
<!-- claim-id: claim-claude-md-61 -->
- Source: CLAUDE.md:61
- Summary: Keep this block short. Detailed routing belongs in installed skill metadata and `find-skills` output, not in a long checked-in catalog.
- Excerpt: Keep this block short. Detailed routing belongs in installed skill metadata and `find-skills` output, not in a long checked-in catalog.
- Current labels: proofLayer=cautilus-eval; recommendedProof=cautilus-eval; recommendedEvalSurface=dev/skill; readiness=ready-to-verify; reviewStatus=heuristic; evidenceStatus=unknown
- Group hints: cautilus-eval, repo-instructions, dev/skill
- Current next action: Create a host-owned dev/skill fixture and run it through cautilus eval test.
- Why this layer: The claim depends on model, agent, prompt, skill, workflow, or behavior execution evidence.
- Human claim quality: TODO
- Human corrected proof layer: keep
- Human corrected eval surface: keep
- Human readiness: keep
- Human priority: TODO
- Duplicate of:
- Notes:

### 013 claim-claude-md-73
<!-- claim-id: claim-claude-md-73 -->
- Source: CLAUDE.md:73
- Summary: While implementing, any bug, error, regression, or unexpected behavior routes to `charness:debug` before further fixes.
- Excerpt: While implementing, any bug, error, regression, or unexpected behavior routes to `charness:debug` before further fixes.
- Current labels: proofLayer=cautilus-eval; recommendedProof=cautilus-eval; recommendedEvalSurface=dev/repo; readiness=ready-to-verify; reviewStatus=heuristic; evidenceStatus=unknown
- Group hints: cautilus-eval, repo-instructions, dev/repo
- Current next action: Create a host-owned dev/repo fixture and run it through cautilus eval test.
- Why this layer: The claim depends on model, agent, prompt, skill, workflow, or behavior execution evidence.
- Human claim quality: TODO
- Human corrected proof layer: keep
- Human corrected eval surface: keep
- Human readiness: keep
- Human priority: TODO
- Duplicate of:
- Notes:

### 014 claim-claude-md-78
<!-- claim-id: claim-claude-md-78 -->
- Source: CLAUDE.md:78
- Summary: The skill should own routing, sequencing, guardrails, and decision boundaries; the binary should own broad command discovery, help text, scenario catalogs, packet examples, install smoke, and doctor/readiness details.
- Excerpt: The skill should own routing, sequencing, guardrails, and decision boundaries; the binary should own broad command discovery, help text, scenario catalogs, packet examples, install smoke, and doctor/readiness details.
- Current labels: proofLayer=scenario-candidate; recommendedProof=cautilus-eval; recommendedEvalSurface=n/a; readiness=needs-scenario; reviewStatus=heuristic; evidenceStatus=unknown
- Group hints: cautilus-eval, repo-instructions, needs-scenario
- Current next action: Use the scenario proposal flow to normalize candidate evidence before creating a checked-in eval fixture.
- Why this layer: The claim points at scenario or proposal work before it is ready as a protected eval fixture.
- Human claim quality: TODO
- Human corrected proof layer: keep
- Human corrected eval surface: keep
- Human readiness: keep
- Human priority: TODO
- Duplicate of:
- Notes:

### 015 claim-claude-md-79
<!-- claim-id: claim-claude-md-79 -->
- Source: CLAUDE.md:79
- Summary: When a quality or release review asks for evaluator, review, CLI-discovery, or agent-surface proof, verify that the selected adapter can actually run that surface before treating the gate as available.
- Excerpt: When a quality or release review asks for evaluator, review, CLI-discovery, or agent-surface proof, verify that the selected adapter can actually run that surface before treating the gate as available.
- Current labels: proofLayer=cautilus-eval; recommendedProof=cautilus-eval; recommendedEvalSurface=dev/repo; readiness=ready-to-verify; reviewStatus=heuristic; evidenceStatus=unknown
- Group hints: cautilus-eval, repo-instructions, dev/repo
- Current next action: Create a host-owned dev/repo fixture and run it through cautilus eval test.
- Why this layer: The claim depends on model, agent, prompt, skill, workflow, or behavior execution evidence.
- Human claim quality: TODO
- Human corrected proof layer: keep
- Human corrected eval surface: keep
- Human readiness: keep
- Human priority: TODO
- Duplicate of:
- Notes:

### 016 claim-claude-md-123
<!-- claim-id: claim-claude-md-123 -->
- Source: CLAUDE.md:123
- Summary: `npm run test:on-demand` currently owns the heavier self-dogfood workflow script tests.
- Excerpt: `npm run test:on-demand` currently owns the heavier self-dogfood workflow script tests.
- Current labels: proofLayer=cautilus-eval; recommendedProof=cautilus-eval; recommendedEvalSurface=dev/repo; readiness=ready-to-verify; reviewStatus=heuristic; evidenceStatus=unknown
- Group hints: cautilus-eval, repo-instructions, dev/repo
- Current next action: Create a host-owned dev/repo fixture and run it through cautilus eval test.
- Why this layer: The claim depends on model, agent, prompt, skill, workflow, or behavior execution evidence.
- Human claim quality: TODO
- Human corrected proof layer: keep
- Human corrected eval surface: keep
- Human readiness: keep
- Human priority: TODO
- Duplicate of:
- Notes:

### 017 claim-readme-md-3
<!-- claim-id: claim-readme-md-3 -->
- Source: README.md:3
- Summary: `Cautilus` keeps agent and workflow behavior honest while prompts keep changing.
- Excerpt: `Cautilus` keeps agent and workflow behavior honest while prompts keep changing.
- Current labels: proofLayer=cautilus-eval; recommendedProof=cautilus-eval; recommendedEvalSurface=app/prompt; readiness=ready-to-verify; reviewStatus=heuristic; evidenceStatus=unknown
- Group hints: cautilus-eval, readme, app/prompt
- Current next action: Create a host-owned app/prompt fixture and run it through cautilus eval test.
- Why this layer: The claim depends on model, agent, prompt, skill, workflow, or behavior execution evidence.
- Human claim quality: TODO
- Human corrected proof layer: keep
- Human corrected eval surface: keep
- Human readiness: keep
- Human priority: TODO
- Duplicate of:
- Notes:

### 018 claim-readme-md-7
<!-- claim-id: claim-readme-md-7 -->
- Source: README.md:7
- Summary: Ships as a standalone binary plus a bundled skill a host repo can install without copying another scaffold first.
- Excerpt: Ships as a standalone binary plus a bundled skill a host repo can install without copying another scaffold first.
- Current labels: proofLayer=cautilus-eval; recommendedProof=cautilus-eval; recommendedEvalSurface=dev/skill; readiness=ready-to-verify; reviewStatus=heuristic; evidenceStatus=unknown
- Group hints: cautilus-eval, readme, dev/skill
- Current next action: Create a host-owned dev/skill fixture and run it through cautilus eval test.
- Why this layer: The claim depends on model, agent, prompt, skill, workflow, or behavior execution evidence.
- Human claim quality: TODO
- Human corrected proof layer: keep
- Human corrected eval surface: keep
- Human readiness: keep
- Human priority: TODO
- Duplicate of:
- Notes:

### 019 claim-readme-md-9
<!-- claim-id: claim-readme-md-9 -->
- Source: README.md:9
- Summary: Commands should emit durable packets with enough state for the next agent to resume, not only terminal prose for a human operator.
- Excerpt: Commands should emit durable packets with enough state for the next agent to resume, not only terminal prose for a human operator.
- Current labels: proofLayer=cautilus-eval; recommendedProof=cautilus-eval; recommendedEvalSurface=dev/repo; readiness=ready-to-verify; reviewStatus=heuristic; evidenceStatus=unknown
- Group hints: cautilus-eval, readme, dev/repo
- Current next action: Create a host-owned dev/repo fixture and run it through cautilus eval test.
- Why this layer: The claim depends on model, agent, prompt, skill, workflow, or behavior execution evidence.
- Human claim quality: TODO
- Human corrected proof layer: keep
- Human corrected eval surface: keep
- Human readiness: keep
- Human priority: TODO
- Duplicate of:
- Notes:

### 020 claim-readme-md-13
<!-- claim-id: claim-readme-md-13 -->
- Source: README.md:13
- Summary: They stay checked into each host repo so evaluation behavior remains reproducible, reviewable, and owned by the repo that declares it.
- Excerpt: They stay checked into each host repo so evaluation behavior remains reproducible, reviewable, and owned by the repo that declares it.
- Current labels: proofLayer=cautilus-eval; recommendedProof=cautilus-eval; recommendedEvalSurface=dev/repo; readiness=ready-to-verify; reviewStatus=heuristic; evidenceStatus=unknown
- Group hints: cautilus-eval, readme, dev/repo
- Current next action: Create a host-owned dev/repo fixture and run it through cautilus eval test.
- Why this layer: The claim depends on model, agent, prompt, skill, workflow, or behavior execution evidence.
- Human claim quality: TODO
- Human corrected proof layer: keep
- Human corrected eval surface: keep
- Human readiness: keep
- Human priority: TODO
- Duplicate of:
- Notes:

### 021 claim-readme-md-91
<!-- claim-id: claim-readme-md-91 -->
- Source: README.md:91
- Summary: Input (For Agent)**: "Turn this behavior input into reusable scenarios and render an HTML page I can review."
- Excerpt: Input (For Agent)**: "Turn this behavior input into reusable scenarios and render an HTML page I can review."
- Current labels: proofLayer=scenario-candidate; recommendedProof=cautilus-eval; recommendedEvalSurface=n/a; readiness=needs-scenario; reviewStatus=heuristic; evidenceStatus=unknown
- Group hints: cautilus-eval, readme, needs-scenario
- Current next action: Use the scenario proposal flow to normalize candidate evidence before creating a checked-in eval fixture.
- Why this layer: The claim points at scenario or proposal work before it is ready as a protected eval fixture.
- Human claim quality: TODO
- Human corrected proof layer: keep
- Human corrected eval surface: keep
- Human readiness: keep
- Human priority: TODO
- Duplicate of:
- Notes:

### 022 claim-readme-md-95
<!-- claim-id: claim-readme-md-95 -->
- Source: README.md:95
- Summary: Next step: a human decides whether to promote the scenario into a protected evaluation path, while an agent can reopen the saved result, compare variants, or feed it into the next bounded step.
- Excerpt: Next step: a human decides whether to promote the scenario into a protected evaluation path, while an agent can reopen the saved result, compare variants, or feed it into the next bounded step.
- Current labels: proofLayer=scenario-candidate; recommendedProof=cautilus-eval; recommendedEvalSurface=n/a; readiness=needs-scenario; reviewStatus=heuristic; evidenceStatus=unknown
- Group hints: cautilus-eval, readme, needs-scenario
- Current next action: Use the scenario proposal flow to normalize candidate evidence before creating a checked-in eval fixture.
- Why this layer: The claim points at scenario or proposal work before it is ready as a protected eval fixture.
- Human claim quality: TODO
- Human corrected proof layer: keep
- Human corrected eval surface: keep
- Human readiness: keep
- Human priority: TODO
- Duplicate of:
- Notes:

### 023 claim-readme-md-123
<!-- claim-id: claim-readme-md-123 -->
- Source: README.md:123
- Summary: For reviewed `cautilus-eval` claims, `claim plan-evals` emits `cautilus.claim_eval_plan.v1`: an intermediate plan for host-owned eval fixtures, not a writer for prompts, runners, fixtures, or policy.
- Excerpt: For reviewed `cautilus-eval` claims, `claim plan-evals` emits `cautilus.claim_eval_plan.v1`: an intermediate plan for host-owned eval fixtures, not a writer for prompts, runners, fixtures, or policy.
- Current labels: proofLayer=cautilus-eval; recommendedProof=cautilus-eval; recommendedEvalSurface=app/prompt; readiness=ready-to-verify; reviewStatus=heuristic; evidenceStatus=unknown
- Group hints: cautilus-eval, readme, app/prompt
- Current next action: Create a host-owned app/prompt fixture and run it through cautilus eval test.
- Why this layer: The claim depends on model, agent, prompt, skill, workflow, or behavior execution evidence.
- Human claim quality: TODO
- Human corrected proof layer: keep
- Human corrected eval surface: keep
- Human readiness: keep
- Human priority: TODO
- Duplicate of:
- Notes:

### 024 claim-readme-md-137
<!-- claim-id: claim-readme-md-137 -->
- Source: README.md:137
- Summary: CLI: `cautilus scenario normalize chatbot --input logs.json` For agent: "Run a chatbot regression with these logs and my new system prompt." You get reopenable `proposals.json` candidates that can be kept out of tuning as protected checks.
- Excerpt: CLI: `cautilus scenario normalize chatbot --input logs.json` For agent: "Run a chatbot regression with these logs and my new system prompt." You get reopenable `proposals.json` candidates that can be kept out of tuning as protected checks.
- Current labels: proofLayer=scenario-candidate; recommendedProof=cautilus-eval; recommendedEvalSurface=n/a; readiness=needs-scenario; reviewStatus=heuristic; evidenceStatus=unknown
- Group hints: cautilus-eval, readme, needs-scenario
- Current next action: Use the scenario proposal flow to normalize candidate evidence before creating a checked-in eval fixture.
- Why this layer: The claim points at scenario or proposal work before it is ready as a protected eval fixture.
- Human claim quality: TODO
- Human corrected proof layer: keep
- Human corrected eval surface: keep
- Human readiness: keep
- Human priority: TODO
- Duplicate of:
- Notes:

### 025 claim-readme-md-144
<!-- claim-id: claim-readme-md-144 -->
- Source: README.md:144
- Summary: Use when you change a skill or agent and want to know whether it still triggers on the right prompts, executes cleanly, and keeps its static validation passing.
- Excerpt: Use when you change a skill or agent and want to know whether it still triggers on the right prompts, executes cleanly, and keeps its static validation passing.
- Current labels: proofLayer=cautilus-eval; recommendedProof=cautilus-eval; recommendedEvalSurface=app/prompt; readiness=ready-to-verify; reviewStatus=heuristic; evidenceStatus=unknown
- Group hints: cautilus-eval, readme, app/prompt
- Current next action: Create a host-owned app/prompt fixture and run it through cautilus eval test.
- Why this layer: The claim depends on model, agent, prompt, skill, workflow, or behavior execution evidence.
- Human claim quality: TODO
- Human corrected proof layer: keep
- Human corrected eval surface: keep
- Human readiness: keep
- Human priority: TODO
- Duplicate of:
- Notes:

### 026 claim-readme-md-148
<!-- claim-id: claim-readme-md-148 -->
- Source: README.md:148
- Summary: The same preset can evaluate a multi-turn agent episode when the fixture provides `turns`; Cautilus's own first-scan, refresh-flow, review-prepare, and reviewer-launch dogfood fixtures derive their results from audit packets.
- Excerpt: The same preset can evaluate a multi-turn agent episode when the fixture provides `turns`; Cautilus's own first-scan, refresh-flow, review-prepare, and reviewer-launch dogfood fixtures derive their results from audit packets.
- Current labels: proofLayer=cautilus-eval; recommendedProof=cautilus-eval; recommendedEvalSurface=dev/repo; readiness=ready-to-verify; reviewStatus=heuristic; evidenceStatus=unknown
- Group hints: cautilus-eval, readme, dev/repo
- Current next action: Create a host-owned dev/repo fixture and run it through cautilus eval test.
- Why this layer: The claim depends on model, agent, prompt, skill, workflow, or behavior execution evidence.
- Human claim quality: TODO
- Human corrected proof layer: keep
- Human corrected eval surface: keep
- Human readiness: keep
- Human priority: TODO
- Duplicate of:
- Notes:

### 027 claim-readme-md-149
<!-- claim-id: claim-readme-md-149 -->
- Source: README.md:149
- Summary: When the goal is only to prove command routing and packet evaluation, `cautilus eval test --runtime fixture` can run the same product path with adapter-owned fixture results instead of launching a nested model eval.
- Excerpt: When the goal is only to prove command routing and packet evaluation, `cautilus eval test --runtime fixture` can run the same product path with adapter-owned fixture results instead of launching a nested model eval.
- Current labels: proofLayer=cautilus-eval; recommendedProof=cautilus-eval; recommendedEvalSurface=dev/repo; readiness=ready-to-verify; reviewStatus=heuristic; evidenceStatus=unknown
- Group hints: cautilus-eval, readme, dev/repo
- Current next action: Create a host-owned dev/repo fixture and run it through cautilus eval test.
- Why this layer: The claim depends on model, agent, prompt, skill, workflow, or behavior execution evidence.
- Human claim quality: TODO
- Human corrected proof layer: keep
- Human corrected eval surface: keep
- Human readiness: keep
- Human priority: TODO
- Duplicate of:
- Notes:

### 028 claim-readme-md-153
<!-- claim-id: claim-readme-md-153 -->
- Source: README.md:153
- Summary: Use when a stateful automation — a CLI workflow, long-running agent session, or pipeline that persists state across invocations — keeps stalling on the same step.
- Excerpt: Use when a stateful automation — a CLI workflow, long-running agent session, or pipeline that persists state across invocations — keeps stalling on the same step.
- Current labels: proofLayer=cautilus-eval; recommendedProof=cautilus-eval; recommendedEvalSurface=dev/repo; readiness=ready-to-verify; reviewStatus=heuristic; evidenceStatus=unknown
- Group hints: cautilus-eval, readme, dev/repo
- Current next action: Create a host-owned dev/repo fixture and run it through cautilus eval test.
- Why this layer: The claim depends on model, agent, prompt, skill, workflow, or behavior execution evidence.
- Human claim quality: TODO
- Human corrected proof layer: keep
- Human corrected eval surface: keep
- Human readiness: keep
- Human priority: TODO
- Duplicate of:
- Notes:

### 029 claim-readme-md-159
<!-- claim-id: claim-readme-md-159 -->
- Source: README.md:159
- Summary: Each catalog entry now also includes `exampleInputCli`, so an operator or wrapper can inspect a minimal valid packet shape without opening a fixture path first.
- Excerpt: Each catalog entry now also includes `exampleInputCli`, so an operator or wrapper can inspect a minimal valid packet shape without opening a fixture path first.
- Current labels: proofLayer=human-auditable; recommendedProof=human-auditable; recommendedEvalSurface=n/a; readiness=ready-to-verify; reviewStatus=heuristic; evidenceStatus=unknown
- Group hints: human-auditable, readme
- Current next action: Record the source reference and keep it human-auditable; add deterministic or eval proof only if behavior depends on execution.
- Why this layer: The claim can be checked by reading current source, docs, or generated artifacts.
- Human claim quality: TODO
- Human corrected proof layer: keep
- Human corrected eval surface: keep
- Human readiness: keep
- Human priority: TODO
- Duplicate of:
- Notes:

### 030 claim-readme-md-171
<!-- claim-id: claim-readme-md-171 -->
- Source: README.md:171
- Summary: `Cautilus` treats the context-recovery case as a protected scenario kept out of tuning so the signal stays honest.
- Excerpt: `Cautilus` treats the context-recovery case as a protected scenario kept out of tuning so the signal stays honest.
- Current labels: proofLayer=scenario-candidate; recommendedProof=cautilus-eval; recommendedEvalSurface=n/a; readiness=needs-scenario; reviewStatus=heuristic; evidenceStatus=unknown
- Group hints: cautilus-eval, readme, needs-scenario
- Current next action: Use the scenario proposal flow to normalize candidate evidence before creating a checked-in eval fixture.
- Why this layer: The claim points at scenario or proposal work before it is ready as a protected eval fixture.
- Human claim quality: TODO
- Human corrected proof layer: keep
- Human corrected eval surface: keep
- Human readiness: keep
- Human priority: TODO
- Duplicate of:
- Notes:

### 031 claim-readme-md-192
<!-- claim-id: claim-readme-md-192 -->
- Source: README.md:192
- Summary: The longer-term direction is close to the workflow philosophy behind DSPy: prompts can change as long as the evaluated behavior survives.
- Excerpt: The longer-term direction is close to the workflow philosophy behind DSPy: prompts can change as long as the evaluated behavior survives.
- Current labels: proofLayer=cautilus-eval; recommendedProof=cautilus-eval; recommendedEvalSurface=app/prompt; readiness=ready-to-verify; reviewStatus=heuristic; evidenceStatus=unknown
- Group hints: cautilus-eval, readme, app/prompt
- Current next action: Create a host-owned app/prompt fixture and run it through cautilus eval test.
- Why this layer: The claim depends on model, agent, prompt, skill, workflow, or behavior execution evidence.
- Human claim quality: TODO
- Human corrected proof layer: keep
- Human corrected eval surface: keep
- Human readiness: keep
- Human priority: TODO
- Duplicate of:
- Notes:

### 032 claim-readme-md-211
<!-- claim-id: claim-readme-md-211 -->
- Source: README.md:211
- Summary: Agent track — Claude / Codex plugin.** The `cautilus install` step also lands a bundled skill at `.agents/skills/cautilus/` with Claude and Codex plugin manifests, so an in-editor agent can drive the same contracts conversationally.
- Excerpt: Agent track — Claude / Codex plugin.** The `cautilus install` step also lands a bundled skill at `.agents/skills/cautilus/` with Claude and Codex plugin manifests, so an in-editor agent can drive the same contracts conversationally.
- Current labels: proofLayer=cautilus-eval; recommendedProof=cautilus-eval; recommendedEvalSurface=app/chat; readiness=ready-to-verify; reviewStatus=heuristic; evidenceStatus=unknown
- Group hints: cautilus-eval, readme, app/chat
- Current next action: Create a host-owned app/chat fixture and run it through cautilus eval test.
- Why this layer: The claim depends on model, agent, prompt, skill, workflow, or behavior execution evidence.
- Human claim quality: TODO
- Human corrected proof layer: keep
- Human corrected eval surface: keep
- Human readiness: keep
- Human priority: TODO
- Duplicate of:
- Notes:

### 033 claim-readme-md-231
<!-- claim-id: claim-readme-md-231 -->
- Source: README.md:231
- Summary: machine-readable eval, report, review, evidence, and optimization packets that agents can consume directly
- Excerpt: machine-readable eval, report, review, evidence, and optimization packets that agents can consume directly
- Current labels: proofLayer=cautilus-eval; recommendedProof=cautilus-eval; recommendedEvalSurface=dev/repo; readiness=ready-to-verify; reviewStatus=heuristic; evidenceStatus=unknown
- Group hints: cautilus-eval, readme, dev/repo
- Current next action: Create a host-owned dev/repo fixture and run it through cautilus eval test.
- Why this layer: The claim depends on model, agent, prompt, skill, workflow, or behavior execution evidence.
- Human claim quality: TODO
- Human corrected proof layer: keep
- Human corrected eval surface: keep
- Human readiness: keep
- Human priority: TODO
- Duplicate of:
- Notes:

### 034 claim-readme-md-232
<!-- claim-id: claim-readme-md-232 -->
- Source: README.md:232
- Summary: static HTML views of the same artifacts so a human reviewer can judge them in a browser without an agent in the loop See `docs/specs/html-report.spec.md` for the rendered contract.
- Excerpt: static HTML views of the same artifacts so a human reviewer can judge them in a browser without an agent in the loop See `docs/specs/html-report.spec.md` for the rendered contract.
- Current labels: proofLayer=cautilus-eval; recommendedProof=cautilus-eval; recommendedEvalSurface=dev/repo; readiness=ready-to-verify; reviewStatus=heuristic; evidenceStatus=unknown
- Group hints: cautilus-eval, readme, dev/repo
- Current next action: Create a host-owned dev/repo fixture and run it through cautilus eval test.
- Why this layer: The claim depends on model, agent, prompt, skill, workflow, or behavior execution evidence.
- Human claim quality: TODO
- Human corrected proof layer: keep
- Human corrected eval surface: keep
- Human readiness: keep
- Human priority: TODO
- Duplicate of:
- Notes:

### 035 claim-docs-cli-reference-md-32
<!-- claim-id: claim-docs-cli-reference-md-32 -->
- Source: docs/cli-reference.md:32
- Summary: The lower-level compatibility command `cautilus skills install` remains available when a workflow needs to call the skill installer directly.
- Excerpt: The lower-level compatibility command `cautilus skills install` remains available when a workflow needs to call the skill installer directly.
- Current labels: proofLayer=cautilus-eval; recommendedProof=cautilus-eval; recommendedEvalSurface=dev/skill; readiness=ready-to-verify; reviewStatus=heuristic; evidenceStatus=unknown
- Group hints: cautilus-eval, docs, dev/skill, linked-from:README.md
- Current next action: Create a host-owned dev/skill fixture and run it through cautilus eval test.
- Why this layer: The claim depends on model, agent, prompt, skill, workflow, or behavior execution evidence.
- Human claim quality: TODO
- Human corrected proof layer: keep
- Human corrected eval surface: keep
- Human readiness: keep
- Human priority: TODO
- Duplicate of:
- Notes:

### 036 claim-docs-cli-reference-md-91
<!-- claim-id: claim-docs-cli-reference-md-91 -->
- Source: docs/cli-reference.md:91
- Summary: It emits `cautilus.agent_status.v1`: a read-only orientation packet over binary health, local agent-surface readiness, adapter state, claim-state availability, scan scope, and branch choices.
- Excerpt: It emits `cautilus.agent_status.v1`: a read-only orientation packet over binary health, local agent-surface readiness, adapter state, claim-state availability, scan scope, and branch choices.
- Current labels: proofLayer=cautilus-eval; recommendedProof=cautilus-eval; recommendedEvalSurface=dev/repo; readiness=ready-to-verify; reviewStatus=heuristic; evidenceStatus=unknown
- Group hints: cautilus-eval, docs, dev/repo, linked-from:README.md
- Current next action: Create a host-owned dev/repo fixture and run it through cautilus eval test.
- Why this layer: The claim depends on model, agent, prompt, skill, workflow, or behavior execution evidence.
- Human claim quality: TODO
- Human corrected proof layer: keep
- Human corrected eval surface: keep
- Human readiness: keep
- Human priority: TODO
- Duplicate of:
- Notes:

### 037 claim-docs-cli-reference-md-97
<!-- claim-id: claim-docs-cli-reference-md-97 -->
- Source: docs/cli-reference.md:97
- Summary: Use `cautilus claim discover` before writing eval fixtures when you need to inventory declared behavior claims and decide whether each belongs in human review, deterministic CI, Cautilus eval, scenario proposal work, or alignment work.
- Excerpt: Use `cautilus claim discover` before writing eval fixtures when you need to inventory declared behavior claims and decide whether each belongs in human review, deterministic CI, Cautilus eval, scenario proposal work, or alignment work.
- Current labels: proofLayer=deterministic; recommendedProof=deterministic; recommendedEvalSurface=n/a; readiness=ready-to-verify; reviewStatus=heuristic; evidenceStatus=unknown
- Group hints: deterministic, docs, linked-from:README.md
- Current next action: Keep or add a repo-owned unit, lint, build, schema, or CI check for this claim.
- Why this layer: The claim names a deterministic gate or static contract that should be protected outside Cautilus eval.
- Human claim quality: TODO
- Human corrected proof layer: keep
- Human corrected eval surface: keep
- Human readiness: keep
- Human priority: TODO
- Duplicate of:
- Notes:

### 038 claim-docs-cli-reference-md-105
<!-- claim-id: claim-docs-cli-reference-md-105 -->
- Source: docs/cli-reference.md:105
- Summary: It emits `cautilus.claim_review_input.v1` and does not call an LLM or mark claims satisfied.
- Excerpt: It emits `cautilus.claim_review_input.v1` and does not call an LLM or mark claims satisfied.
- Current labels: proofLayer=cautilus-eval; recommendedProof=cautilus-eval; recommendedEvalSurface=dev/repo; readiness=ready-to-verify; reviewStatus=heuristic; evidenceStatus=unknown
- Group hints: cautilus-eval, docs, dev/repo, linked-from:README.md
- Current next action: Create a host-owned dev/repo fixture and run it through cautilus eval test.
- Why this layer: The claim depends on model, agent, prompt, skill, workflow, or behavior execution evidence.
- Human claim quality: TODO
- Human corrected proof layer: keep
- Human corrected eval surface: keep
- Human readiness: keep
- Human priority: TODO
- Duplicate of:
- Notes:

### 039 claim-docs-cli-reference-md-159
<!-- claim-id: claim-docs-cli-reference-md-159 -->
- Source: docs/cli-reference.md:159
- Summary: When the public scenario uses `simulator.kind: persona_prompt`, the adapter additionally provides `simulator_persona_command_template`, which normally calls `cautilus workbench run-simulator-persona` with repo-specific backend flags.
- Excerpt: When the public scenario uses `simulator.kind: persona_prompt`, the adapter additionally provides `simulator_persona_command_template`, which normally calls `cautilus workbench run-simulator-persona` with repo-specific backend flags.
- Current labels: proofLayer=scenario-candidate; recommendedProof=cautilus-eval; recommendedEvalSurface=n/a; readiness=needs-scenario; reviewStatus=heuristic; evidenceStatus=unknown
- Group hints: cautilus-eval, docs, needs-scenario, linked-from:README.md
- Current next action: Use the scenario proposal flow to normalize candidate evidence before creating a checked-in eval fixture.
- Why this layer: The claim points at scenario or proposal work before it is ready as a protected eval fixture.
- Human claim quality: TODO
- Human corrected proof layer: keep
- Human corrected eval surface: keep
- Human readiness: keep
- Human priority: TODO
- Duplicate of:
- Notes:

### 040 claim-docs-cli-reference-md-160
<!-- claim-id: claim-docs-cli-reference-md-160 -->
- Source: docs/cli-reference.md:160
- Summary: That keeps persona prompt shaping and result semantics product-owned while backend selection stays adapter-owned.
- Excerpt: That keeps persona prompt shaping and result semantics product-owned while backend selection stays adapter-owned.
- Current labels: proofLayer=cautilus-eval; recommendedProof=cautilus-eval; recommendedEvalSurface=app/prompt; readiness=ready-to-verify; reviewStatus=heuristic; evidenceStatus=unknown
- Group hints: cautilus-eval, docs, app/prompt, linked-from:README.md
- Current next action: Create a host-owned app/prompt fixture and run it through cautilus eval test.
- Why this layer: The claim depends on model, agent, prompt, skill, workflow, or behavior execution evidence.
- Human claim quality: TODO
- Human corrected proof layer: keep
- Human corrected eval surface: keep
- Human readiness: keep
- Human priority: TODO
- Duplicate of:
- Notes:

### 041 claim-docs-cli-reference-md-230
<!-- claim-id: claim-docs-cli-reference-md-230 -->
- Source: docs/cli-reference.md:230
- Summary: The same packet also emits an `attentionView`, which is a bounded human-facing shortlist derived from the full ranked set.
- Excerpt: The same packet also emits an `attentionView`, which is a bounded human-facing shortlist derived from the full ranked set.
- Current labels: proofLayer=human-auditable; recommendedProof=human-auditable; recommendedEvalSurface=n/a; readiness=ready-to-verify; reviewStatus=heuristic; evidenceStatus=unknown
- Group hints: human-auditable, docs, linked-from:README.md
- Current next action: Record the source reference and keep it human-auditable; add deterministic or eval proof only if behavior depends on execution.
- Why this layer: The claim can be checked by reading current source, docs, or generated artifacts.
- Human claim quality: TODO
- Human corrected proof layer: keep
- Human corrected eval surface: keep
- Human readiness: keep
- Human priority: TODO
- Duplicate of:
- Notes:

### 042 claim-docs-cli-reference-md-231
<!-- claim-id: claim-docs-cli-reference-md-231 -->
- Source: docs/cli-reference.md:231
- Summary: `cautilus scenario review-conversations` stays intentionally narrower than a generic audit UI.
- Excerpt: `cautilus scenario review-conversations` stays intentionally narrower than a generic audit UI.
- Current labels: proofLayer=scenario-candidate; recommendedProof=cautilus-eval; recommendedEvalSurface=n/a; readiness=needs-scenario; reviewStatus=heuristic; evidenceStatus=unknown
- Group hints: cautilus-eval, docs, needs-scenario, linked-from:README.md
- Current next action: Use the scenario proposal flow to normalize candidate evidence before creating a checked-in eval fixture.
- Why this layer: The claim points at scenario or proposal work before it is ready as a protected eval fixture.
- Human claim quality: TODO
- Human corrected proof layer: keep
- Human corrected eval surface: keep
- Human readiness: keep
- Human priority: TODO
- Duplicate of:
- Notes:

### 043 claim-docs-cli-reference-md-232
<!-- claim-id: claim-docs-cli-reference-md-232 -->
- Source: docs/cli-reference.md:232
- Summary: It links normalized chatbot threads to scenario proposals and coverage hints so an operator can review behavior-eval evidence without browsing every live operator turn.
- Excerpt: It links normalized chatbot threads to scenario proposals and coverage hints so an operator can review behavior-eval evidence without browsing every live operator turn.
- Current labels: proofLayer=scenario-candidate; recommendedProof=cautilus-eval; recommendedEvalSurface=n/a; readiness=needs-scenario; reviewStatus=heuristic; evidenceStatus=unknown
- Group hints: cautilus-eval, docs, needs-scenario, linked-from:README.md
- Current next action: Use the scenario proposal flow to normalize candidate evidence before creating a checked-in eval fixture.
- Why this layer: The claim points at scenario or proposal work before it is ready as a protected eval fixture.
- Human claim quality: TODO
- Human corrected proof layer: keep
- Human corrected eval surface: keep
- Human readiness: keep
- Human priority: TODO
- Duplicate of:
- Notes:

### 044 claim-docs-cli-reference-md-240
<!-- claim-id: claim-docs-cli-reference-md-240 -->
- Source: docs/cli-reference.md:240
- Summary: `cautilus eval test` runs a checked-in fixture through an adapter-owned runner and then evaluates the observed packet.
- Excerpt: `cautilus eval test` runs a checked-in fixture through an adapter-owned runner and then evaluates the observed packet.
- Current labels: proofLayer=cautilus-eval; recommendedProof=cautilus-eval; recommendedEvalSurface=dev/repo; readiness=ready-to-verify; reviewStatus=heuristic; evidenceStatus=unknown
- Group hints: cautilus-eval, docs, dev/repo, linked-from:README.md
- Current next action: Create a host-owned dev/repo fixture and run it through cautilus eval test.
- Why this layer: The claim depends on model, agent, prompt, skill, workflow, or behavior execution evidence.
- Human claim quality: TODO
- Human corrected proof layer: keep
- Human corrected eval surface: keep
- Human readiness: keep
- Human priority: TODO
- Duplicate of:
- Notes:

### 045 claim-docs-cli-reference-md-241
<!-- claim-id: claim-docs-cli-reference-md-241 -->
- Source: docs/cli-reference.md:241
- Summary: `cautilus eval evaluate` evaluates an already-observed packet without launching the runner again.
- Excerpt: `cautilus eval evaluate` evaluates an already-observed packet without launching the runner again.
- Current labels: proofLayer=cautilus-eval; recommendedProof=cautilus-eval; recommendedEvalSurface=dev/repo; readiness=ready-to-verify; reviewStatus=heuristic; evidenceStatus=unknown
- Group hints: cautilus-eval, docs, dev/repo, linked-from:README.md
- Current next action: Create a host-owned dev/repo fixture and run it through cautilus eval test.
- Why this layer: The claim depends on model, agent, prompt, skill, workflow, or behavior execution evidence.
- Human claim quality: TODO
- Human corrected proof layer: keep
- Human corrected eval surface: keep
- Human readiness: keep
- Human priority: TODO
- Duplicate of:
- Notes:

### 046 claim-docs-cli-reference-md-401
<!-- claim-id: claim-docs-cli-reference-md-401 -->
- Source: docs/cli-reference.md:401
- Summary: When `--output-text-key` is present, Cautilus also extracts that JSON narrative span into the rendered prompt so the judge can read the realized output directly.
- Excerpt: When `--output-text-key` is present, Cautilus also extracts that JSON narrative span into the rendered prompt so the judge can read the realized output directly.
- Current labels: proofLayer=cautilus-eval; recommendedProof=cautilus-eval; recommendedEvalSurface=app/prompt; readiness=ready-to-verify; reviewStatus=heuristic; evidenceStatus=unknown
- Group hints: cautilus-eval, docs, app/prompt, linked-from:README.md
- Current next action: Create a host-owned app/prompt fixture and run it through cautilus eval test.
- Why this layer: The claim depends on model, agent, prompt, skill, workflow, or behavior execution evidence.
- Human claim quality: TODO
- Human corrected proof layer: keep
- Human corrected eval surface: keep
- Human readiness: keep
- Human priority: TODO
- Duplicate of:
- Notes:

### 047 claim-docs-cli-reference-md-421
<!-- claim-id: claim-docs-cli-reference-md-421 -->
- Source: docs/cli-reference.md:421
- Summary: This command answers: "what single packet should I hand to the next decision step when report, scenario, audit, and history evidence all matter together?"
- Excerpt: This command answers: "what single packet should I hand to the next decision step when report, scenario, audit, and history evidence all matter together?"
- Current labels: proofLayer=scenario-candidate; recommendedProof=cautilus-eval; recommendedEvalSurface=n/a; readiness=needs-scenario; reviewStatus=heuristic; evidenceStatus=unknown
- Group hints: cautilus-eval, docs, needs-scenario, linked-from:README.md
- Current next action: Use the scenario proposal flow to normalize candidate evidence before creating a checked-in eval fixture.
- Why this layer: The claim points at scenario or proposal work before it is ready as a protected eval fixture.
- Human claim quality: TODO
- Human corrected proof layer: keep
- Human corrected eval surface: keep
- Human readiness: keep
- Human priority: TODO
- Duplicate of:
- Notes:

### 048 claim-docs-cli-reference-md-456
<!-- claim-id: claim-docs-cli-reference-md-456 -->
- Source: docs/cli-reference.md:456
- Summary: These renderers answer: "what should a human reviewer open first if they should inspect the same decision surface without parsing raw JSON?"
- Excerpt: These renderers answer: "what should a human reviewer open first if they should inspect the same decision surface without parsing raw JSON?"
- Current labels: proofLayer=human-auditable; recommendedProof=human-auditable; recommendedEvalSurface=n/a; readiness=ready-to-verify; reviewStatus=heuristic; evidenceStatus=unknown
- Group hints: human-auditable, docs, linked-from:README.md
- Current next action: Record the source reference and keep it human-auditable; add deterministic or eval proof only if behavior depends on execution.
- Why this layer: The claim can be checked by reading current source, docs, or generated artifacts.
- Human claim quality: TODO
- Human corrected proof layer: keep
- Human corrected eval surface: keep
- Human readiness: keep
- Human priority: TODO
- Duplicate of:
- Notes:

### 049 claim-docs-contracts-adapter-contract-md-3
<!-- claim-id: claim-docs-contracts-adapter-contract-md-3 -->
- Source: docs/contracts/adapter-contract.md:3
- Summary: `Cautilus` stays portable by loading repo-specific evaluation commands from an adapter instead of hardcoding benchmark runners into the workflow.
- Excerpt: `Cautilus` stays portable by loading repo-specific evaluation commands from an adapter instead of hardcoding benchmark runners into the workflow.
- Current labels: proofLayer=cautilus-eval; recommendedProof=cautilus-eval; recommendedEvalSurface=dev/repo; readiness=ready-to-verify; reviewStatus=heuristic; evidenceStatus=unknown
- Group hints: cautilus-eval, contract, dev/repo, linked-from:README.md
- Current next action: Create a host-owned dev/repo fixture and run it through cautilus eval test.
- Why this layer: The claim depends on model, agent, prompt, skill, workflow, or behavior execution evidence.
- Human claim quality: TODO
- Human corrected proof layer: keep
- Human corrected eval surface: keep
- Human readiness: keep
- Human priority: TODO
- Duplicate of:
- Notes:

### 050 claim-docs-contracts-adapter-contract-md-159
<!-- claim-id: claim-docs-contracts-adapter-contract-md-159 -->
- Source: docs/contracts/adapter-contract.md:159
- Summary: `baseline_options`: allowed baseline choices and how the agent should think about them.
- Excerpt: `baseline_options`: allowed baseline choices and how the agent should think about them.
- Current labels: proofLayer=cautilus-eval; recommendedProof=cautilus-eval; recommendedEvalSurface=dev/repo; readiness=ready-to-verify; reviewStatus=heuristic; evidenceStatus=unknown
- Group hints: cautilus-eval, contract, dev/repo, linked-from:README.md
- Current next action: Create a host-owned dev/repo fixture and run it through cautilus eval test.
- Why this layer: The claim depends on model, agent, prompt, skill, workflow, or behavior execution evidence.
- Human claim quality: TODO
- Human corrected proof layer: keep
- Human corrected eval surface: keep
- Human readiness: keep
- Human priority: TODO
- Duplicate of:
- Notes:

### 051 claim-docs-contracts-adapter-contract-md-183
<!-- claim-id: claim-docs-contracts-adapter-contract-md-183 -->
- Source: docs/contracts/adapter-contract.md:183
- Summary: `artifact_paths`: code or docs the evaluator should inspect while interpreting results.
- Excerpt: `artifact_paths`: code or docs the evaluator should inspect while interpreting results.
- Current labels: proofLayer=human-auditable; recommendedProof=human-auditable; recommendedEvalSurface=n/a; readiness=ready-to-verify; reviewStatus=heuristic; evidenceStatus=unknown
- Group hints: human-auditable, contract, linked-from:README.md
- Current next action: Record the source reference and keep it human-auditable; add deterministic or eval proof only if behavior depends on execution.
- Why this layer: The claim can be checked by reading current source, docs, or generated artifacts.
- Human claim quality: TODO
- Human corrected proof layer: keep
- Human corrected eval surface: keep
- Human readiness: keep
- Human priority: TODO
- Duplicate of:
- Notes:

### 052 claim-docs-contracts-adapter-contract-md-188
<!-- claim-id: claim-docs-contracts-adapter-contract-md-188 -->
- Source: docs/contracts/adapter-contract.md:188
- Summary: `history_file_hint`: default history file path when the workflow uses graduation or cadence.
- Excerpt: `history_file_hint`: default history file path when the workflow uses graduation or cadence.
- Current labels: proofLayer=cautilus-eval; recommendedProof=cautilus-eval; recommendedEvalSurface=dev/repo; readiness=ready-to-verify; reviewStatus=heuristic; evidenceStatus=unknown
- Group hints: cautilus-eval, contract, dev/repo, linked-from:README.md
- Current next action: Create a host-owned dev/repo fixture and run it through cautilus eval test.
- Why this layer: The claim depends on model, agent, prompt, skill, workflow, or behavior execution evidence.
- Human claim quality: TODO
- Human corrected proof layer: keep
- Human corrected eval surface: keep
- Human readiness: keep
- Human priority: TODO
- Duplicate of:
- Notes:

### 053 claim-docs-contracts-adapter-contract-md-189
<!-- claim-id: claim-docs-contracts-adapter-contract-md-189 -->
- Source: docs/contracts/adapter-contract.md:189
- Summary: `profile_default`: default scenario profile reference when the backend supports profiles.
- Excerpt: `profile_default`: default scenario profile reference when the backend supports profiles.
- Current labels: proofLayer=scenario-candidate; recommendedProof=cautilus-eval; recommendedEvalSurface=n/a; readiness=needs-scenario; reviewStatus=heuristic; evidenceStatus=unknown
- Group hints: cautilus-eval, contract, needs-scenario, linked-from:README.md
- Current next action: Use the scenario proposal flow to normalize candidate evidence before creating a checked-in eval fixture.
- Why this layer: The claim points at scenario or proposal work before it is ready as a protected eval fixture.
- Human claim quality: TODO
- Human corrected proof layer: keep
- Human corrected eval surface: keep
- Human readiness: keep
- Human priority: TODO
- Duplicate of:
- Notes:

### 054 claim-docs-contracts-adapter-contract-md-270
<!-- claim-id: claim-docs-contracts-adapter-contract-md-270 -->
- Source: docs/contracts/adapter-contract.md:270
- Summary: The packet owns scenario execution intent.
- Excerpt: The packet owns scenario execution intent.
- Current labels: proofLayer=scenario-candidate; recommendedProof=cautilus-eval; recommendedEvalSurface=n/a; readiness=needs-scenario; reviewStatus=heuristic; evidenceStatus=unknown
- Group hints: cautilus-eval, contract, needs-scenario, linked-from:README.md
- Current next action: Use the scenario proposal flow to normalize candidate evidence before creating a checked-in eval fixture.
- Why this layer: The claim points at scenario or proposal work before it is ready as a protected eval fixture.
- Human claim quality: TODO
- Human corrected proof layer: keep
- Human corrected eval surface: keep
- Human readiness: keep
- Human priority: TODO
- Duplicate of:
- Notes:

### 055 claim-docs-contracts-adapter-contract-md-358
<!-- claim-id: claim-docs-contracts-adapter-contract-md-358 -->
- Source: docs/contracts/adapter-contract.md:358
- Summary: This keeps prompt benchmarking, code-quality benchmarking, and workflow smoke tests from collapsing into one overloaded adapter file.
- Excerpt: This keeps prompt benchmarking, code-quality benchmarking, and workflow smoke tests from collapsing into one overloaded adapter file.
- Current labels: proofLayer=deterministic; recommendedProof=deterministic; recommendedEvalSurface=n/a; readiness=ready-to-verify; reviewStatus=heuristic; evidenceStatus=unknown
- Group hints: deterministic, contract, linked-from:README.md
- Current next action: Keep or add a repo-owned unit, lint, build, schema, or CI check for this claim.
- Why this layer: The claim names a deterministic gate or static contract that should be protected outside Cautilus eval.
- Human claim quality: TODO
- Human corrected proof layer: keep
- Human corrected eval surface: keep
- Human readiness: keep
- Human priority: TODO
- Duplicate of:
- Notes:

### 056 claim-docs-contracts-adapter-contract-md-377
<!-- claim-id: claim-docs-contracts-adapter-contract-md-377 -->
- Source: docs/contracts/adapter-contract.md:377
- Summary: A named adapter whose eval-test commands produce rich scenario-by-scenario signals should also persist them as files so executor variants and human reviewers can ground their verdicts on the same numbers.
- Excerpt: A named adapter whose eval-test commands produce rich scenario-by-scenario signals should also persist them as files so executor variants and human reviewers can ground their verdicts on the same numbers.
- Current labels: proofLayer=scenario-candidate; recommendedProof=cautilus-eval; recommendedEvalSurface=n/a; readiness=needs-scenario; reviewStatus=heuristic; evidenceStatus=unknown
- Group hints: cautilus-eval, contract, needs-scenario, linked-from:README.md
- Current next action: Use the scenario proposal flow to normalize candidate evidence before creating a checked-in eval fixture.
- Why this layer: The claim points at scenario or proposal work before it is ready as a protected eval fixture.
- Human claim quality: TODO
- Human corrected proof layer: keep
- Human corrected eval surface: keep
- Human readiness: keep
- Human priority: TODO
- Duplicate of:
- Notes:

### 057 claim-docs-contracts-adapter-contract-md-383
<!-- claim-id: claim-docs-contracts-adapter-contract-md-383 -->
- Source: docs/contracts/adapter-contract.md:383
- Summary: point review prompts at the same path so human and machine review can refer to the same compare output
- Excerpt: point review prompts at the same path so human and machine review can refer to the same compare output
- Current labels: proofLayer=cautilus-eval; recommendedProof=cautilus-eval; recommendedEvalSurface=app/prompt; readiness=ready-to-verify; reviewStatus=heuristic; evidenceStatus=unknown
- Group hints: cautilus-eval, contract, app/prompt, linked-from:README.md
- Current next action: Create a host-owned app/prompt fixture and run it through cautilus eval test.
- Why this layer: The claim depends on model, agent, prompt, skill, workflow, or behavior execution evidence.
- Human claim quality: TODO
- Human corrected proof layer: keep
- Human corrected eval surface: keep
- Human readiness: keep
- Human priority: TODO
- Duplicate of:
- Notes:

### 058 claim-docs-contracts-adapter-contract-md-429
<!-- claim-id: claim-docs-contracts-adapter-contract-md-429 -->
- Source: docs/contracts/adapter-contract.md:429
- Summary: Each review prompt should point at human-visible failure:
- Excerpt: Each review prompt should point at human-visible failure:
- Current labels: proofLayer=cautilus-eval; recommendedProof=cautilus-eval; recommendedEvalSurface=app/prompt; readiness=ready-to-verify; reviewStatus=heuristic; evidenceStatus=unknown
- Group hints: cautilus-eval, contract, app/prompt, linked-from:README.md
- Current next action: Create a host-owned app/prompt fixture and run it through cautilus eval test.
- Why this layer: The claim depends on model, agent, prompt, skill, workflow, or behavior execution evidence.
- Human claim quality: TODO
- Human corrected proof layer: keep
- Human corrected eval surface: keep
- Human readiness: keep
- Human priority: TODO
- Duplicate of:
- Notes:

### 059 claim-docs-contracts-adapter-contract-md-486
<!-- claim-id: claim-docs-contracts-adapter-contract-md-486 -->
- Source: docs/contracts/adapter-contract.md:486
- Summary: Past runs showed some CLIs can reject schemas that declare object properties without also listing them in `required`, even when plain JSON Schema would allow them as optional.
- Excerpt: Past runs showed some CLIs can reject schemas that declare object properties without also listing them in `required`, even when plain JSON Schema would allow them as optional.
- Current labels: proofLayer=deterministic; recommendedProof=deterministic; recommendedEvalSurface=n/a; readiness=ready-to-verify; reviewStatus=heuristic; evidenceStatus=unknown
- Group hints: deterministic, contract, linked-from:README.md
- Current next action: Keep or add a repo-owned unit, lint, build, schema, or CI check for this claim.
- Why this layer: The claim names a deterministic gate or static contract that should be protected outside Cautilus eval.
- Human claim quality: TODO
- Human corrected proof layer: keep
- Human corrected eval surface: keep
- Human readiness: keep
- Human priority: TODO
- Duplicate of:
- Notes:

### 060 claim-docs-contracts-adapter-contract-md-488
<!-- claim-id: claim-docs-contracts-adapter-contract-md-488 -->
- Source: docs/contracts/adapter-contract.md:488
- Summary: Past sessions showed `codex exec` can emit skill-load errors on stderr while still returning a successful exit code.
- Excerpt: Past sessions showed `codex exec` can emit skill-load errors on stderr while still returning a successful exit code.
- Current labels: proofLayer=cautilus-eval; recommendedProof=cautilus-eval; recommendedEvalSurface=dev/skill; readiness=ready-to-verify; reviewStatus=heuristic; evidenceStatus=unknown
- Group hints: cautilus-eval, contract, dev/skill, linked-from:README.md
- Current next action: Create a host-owned dev/skill fixture and run it through cautilus eval test.
- Why this layer: The claim depends on model, agent, prompt, skill, workflow, or behavior execution evidence.
- Human claim quality: TODO
- Human corrected proof layer: keep
- Human corrected eval surface: keep
- Human readiness: keep
- Human priority: TODO
- Duplicate of:
- Notes:

### 061 claim-docs-contracts-review-packet-md-3
<!-- claim-id: claim-docs-contracts-review-packet-md-3 -->
- Source: docs/contracts/review-packet.md:3
- Summary: `Cautilus` should keep review prompts, schemas, compare questions, and report artifacts on one durable boundary before executor variants run.
- Excerpt: `Cautilus` should keep review prompts, schemas, compare questions, and report artifacts on one durable boundary before executor variants run.
- Current labels: proofLayer=cautilus-eval; recommendedProof=cautilus-eval; recommendedEvalSurface=app/prompt; readiness=ready-to-verify; reviewStatus=heuristic; evidenceStatus=unknown
- Group hints: cautilus-eval, contract, app/prompt, linked-from:README.md
- Current next action: Create a host-owned app/prompt fixture and run it through cautilus eval test.
- Why this layer: The claim depends on model, agent, prompt, skill, workflow, or behavior execution evidence.
- Human claim quality: TODO
- Human corrected proof layer: keep
- Human corrected eval surface: keep
- Human readiness: keep
- Human priority: TODO
- Duplicate of:
- Notes:

### 062 claim-docs-gepa-md-15
<!-- claim-id: claim-docs-gepa-md-15 -->
- Source: docs/gepa.md:15
- Summary: Sparse evidence blocks search early with machine-readable JSON so an agent or operator can discuss what is missing before generating candidates.
- Excerpt: Sparse evidence blocks search early with machine-readable JSON so an agent or operator can discuss what is missing before generating candidates.
- Current labels: proofLayer=scenario-candidate; recommendedProof=cautilus-eval; recommendedEvalSurface=n/a; readiness=needs-scenario; reviewStatus=heuristic; evidenceStatus=unknown
- Group hints: cautilus-eval, docs, needs-scenario, linked-from:README.md
- Current next action: Use the scenario proposal flow to normalize candidate evidence before creating a checked-in eval fixture.
- Why this layer: The claim points at scenario or proposal work before it is ready as a protected eval fixture.
- Human claim quality: TODO
- Human corrected proof layer: keep
- Human corrected eval surface: keep
- Human readiness: keep
- Human priority: TODO
- Duplicate of:
- Notes:

### 063 claim-docs-guides-consumer-adoption-md-25
<!-- claim-id: claim-docs-guides-consumer-adoption-md-25 -->
- Source: docs/guides/consumer-adoption.md:25
- Summary: `cautilus --version` must work on `PATH` before any consumer adapter or skill wiring is treated as valid.
- Excerpt: `cautilus --version` must work on `PATH` before any consumer adapter or skill wiring is treated as valid.
- Current labels: proofLayer=cautilus-eval; recommendedProof=cautilus-eval; recommendedEvalSurface=dev/skill; readiness=ready-to-verify; reviewStatus=heuristic; evidenceStatus=unknown
- Group hints: cautilus-eval, docs, dev/skill, linked-from:README.md
- Current next action: Create a host-owned dev/skill fixture and run it through cautilus eval test.
- Why this layer: The claim depends on model, agent, prompt, skill, workflow, or behavior execution evidence.
- Human claim quality: TODO
- Human corrected proof layer: keep
- Human corrected eval surface: keep
- Human readiness: keep
- Human priority: TODO
- Duplicate of:
- Notes:

### 064 claim-docs-guides-consumer-adoption-md-29
<!-- claim-id: claim-docs-guides-consumer-adoption-md-29 -->
- Source: docs/guides/consumer-adoption.md:29
- Summary: `Cautilus` only owns the generic workflow contract, CLI, and normalization helpers.
- Excerpt: `Cautilus` only owns the generic workflow contract, CLI, and normalization helpers.
- Current labels: proofLayer=cautilus-eval; recommendedProof=cautilus-eval; recommendedEvalSurface=dev/repo; readiness=ready-to-verify; reviewStatus=heuristic; evidenceStatus=unknown
- Group hints: cautilus-eval, docs, dev/repo, linked-from:README.md
- Current next action: Create a host-owned dev/repo fixture and run it through cautilus eval test.
- Why this layer: The claim depends on model, agent, prompt, skill, workflow, or behavior execution evidence.
- Human claim quality: TODO
- Human corrected proof layer: keep
- Human corrected eval surface: keep
- Human readiness: keep
- Human priority: TODO
- Duplicate of:
- Notes:

### 065 claim-docs-guides-consumer-adoption-md-48
<!-- claim-id: claim-docs-guides-consumer-adoption-md-48 -->
- Source: docs/guides/consumer-adoption.md:48
- Summary: The ready payload now includes `first_bounded_run`, which adds a starter `eval test -> eval evaluate` packet loop and keeps the `cautilus scenarios --json` catalog nearby only for proposal-input examples.
- Excerpt: The ready payload now includes `first_bounded_run`, which adds a starter `eval test -> eval evaluate` packet loop and keeps the `cautilus scenarios --json` catalog nearby only for proposal-input examples.
- Current labels: proofLayer=scenario-candidate; recommendedProof=cautilus-eval; recommendedEvalSurface=n/a; readiness=needs-scenario; reviewStatus=heuristic; evidenceStatus=unknown
- Group hints: cautilus-eval, docs, needs-scenario, linked-from:README.md
- Current next action: Use the scenario proposal flow to normalize candidate evidence before creating a checked-in eval fixture.
- Why this layer: The claim points at scenario or proposal work before it is ready as a protected eval fixture.
- Human claim quality: TODO
- Human corrected proof layer: keep
- Human corrected eval surface: keep
- Human readiness: keep
- Human priority: TODO
- Duplicate of:
- Notes:

### 066 claim-docs-guides-consumer-adoption-md-83
<!-- claim-id: claim-docs-guides-consumer-adoption-md-83 -->
- Source: docs/guides/consumer-adoption.md:83
- Summary: It should answer "what is the default `Cautilus` evaluation for this repo?" without forcing the operator to mentally sort multiple unrelated workflows.
- Excerpt: It should answer "what is the default `Cautilus` evaluation for this repo?" without forcing the operator to mentally sort multiple unrelated workflows.
- Current labels: proofLayer=cautilus-eval; recommendedProof=cautilus-eval; recommendedEvalSurface=dev/repo; readiness=ready-to-verify; reviewStatus=heuristic; evidenceStatus=unknown
- Group hints: cautilus-eval, docs, dev/repo, linked-from:README.md
- Current next action: Create a host-owned dev/repo fixture and run it through cautilus eval test.
- Why this layer: The claim depends on model, agent, prompt, skill, workflow, or behavior execution evidence.
- Human claim quality: TODO
- Human corrected proof layer: keep
- Human corrected eval surface: keep
- Human readiness: keep
- Human priority: TODO
- Duplicate of:
- Notes:

### 067 claim-docs-guides-consumer-adoption-md-106
<!-- claim-id: claim-docs-guides-consumer-adoption-md-106 -->
- Source: docs/guides/consumer-adoption.md:106
- Summary: The product owns the behavior-surface vocabulary in `cautilus.behavior_intent.v1`.
- Excerpt: The product owns the behavior-surface vocabulary in `cautilus.behavior_intent.v1`.
- Current labels: proofLayer=cautilus-eval; recommendedProof=cautilus-eval; recommendedEvalSurface=dev/repo; readiness=ready-to-verify; reviewStatus=heuristic; evidenceStatus=unknown
- Group hints: cautilus-eval, docs, dev/repo, linked-from:README.md
- Current next action: Create a host-owned dev/repo fixture and run it through cautilus eval test.
- Why this layer: The claim depends on model, agent, prompt, skill, workflow, or behavior execution evidence.
- Human claim quality: TODO
- Human corrected proof layer: keep
- Human corrected eval surface: keep
- Human readiness: keep
- Human priority: TODO
- Duplicate of:
- Notes:

### 068 claim-docs-guides-consumer-adoption-md-107
<!-- claim-id: claim-docs-guides-consumer-adoption-md-107 -->
- Source: docs/guides/consumer-adoption.md:107
- Summary: The schema version stays at `v1`, but some surface strings have been renamed for archetype-vocabulary hygiene.
- Excerpt: The schema version stays at `v1`, but some surface strings have been renamed for archetype-vocabulary hygiene.
- Current labels: proofLayer=deterministic; recommendedProof=deterministic; recommendedEvalSurface=n/a; readiness=ready-to-verify; reviewStatus=heuristic; evidenceStatus=unknown
- Group hints: deterministic, docs, linked-from:README.md
- Current next action: Keep or add a repo-owned unit, lint, build, schema, or CI check for this claim.
- Why this layer: The claim names a deterministic gate or static contract that should be protected outside Cautilus eval.
- Human claim quality: TODO
- Human corrected proof layer: keep
- Human corrected eval surface: keep
- Human readiness: keep
- Human priority: TODO
- Duplicate of:
- Notes:

### 069 claim-docs-guides-evaluation-process-md-10
<!-- claim-id: claim-docs-guides-evaluation-process-md-10 -->
- Source: docs/guides/evaluation-process.md:10
- Summary: That seam owns the checked-in case suite, adapter-runner invocation, and chained summary artifacts before the flow returns to packet-level `cautilus eval evaluate` and proposal normalization.
- Excerpt: That seam owns the checked-in case suite, adapter-runner invocation, and chained summary artifacts before the flow returns to packet-level `cautilus eval evaluate` and proposal normalization.
- Current labels: proofLayer=scenario-candidate; recommendedProof=cautilus-eval; recommendedEvalSurface=n/a; readiness=needs-scenario; reviewStatus=heuristic; evidenceStatus=unknown
- Group hints: cautilus-eval, docs, needs-scenario, linked-from:README.md
- Current next action: Use the scenario proposal flow to normalize candidate evidence before creating a checked-in eval fixture.
- Why this layer: The claim points at scenario or proposal work before it is ready as a protected eval fixture.
- Human claim quality: TODO
- Human corrected proof layer: keep
- Human corrected eval surface: keep
- Human readiness: keep
- Human priority: TODO
- Duplicate of:
- Notes:

### 070 claim-docs-guides-evaluation-process-md-52
<!-- claim-id: claim-docs-guides-evaluation-process-md-52 -->
- Source: docs/guides/evaluation-process.md:52
- Summary: The helper emits machine-readable baseline and candidate paths you can pass back into `eval test` or `review variants`.
- Excerpt: The helper emits machine-readable baseline and candidate paths you can pass back into `eval test` or `review variants`.
- Current labels: proofLayer=scenario-candidate; recommendedProof=cautilus-eval; recommendedEvalSurface=n/a; readiness=needs-scenario; reviewStatus=heuristic; evidenceStatus=unknown
- Group hints: cautilus-eval, docs, needs-scenario, linked-from:README.md
- Current next action: Use the scenario proposal flow to normalize candidate evidence before creating a checked-in eval fixture.
- Why this layer: The claim points at scenario or proposal work before it is ready as a protected eval fixture.
- Human claim quality: TODO
- Human corrected proof layer: keep
- Human corrected eval surface: keep
- Human readiness: keep
- Human priority: TODO
- Duplicate of:
- Notes:

### 071 claim-docs-guides-evaluation-process-md-186
<!-- claim-id: claim-docs-guides-evaluation-process-md-186 -->
- Source: docs/guides/evaluation-process.md:186
- Summary: For one-scenario output review, the same surface can start from a checked-in scenario file instead of a report packet:
- Excerpt: For one-scenario output review, the same surface can start from a checked-in scenario file instead of a report packet:
- Current labels: proofLayer=scenario-candidate; recommendedProof=cautilus-eval; recommendedEvalSurface=n/a; readiness=needs-scenario; reviewStatus=heuristic; evidenceStatus=unknown
- Group hints: cautilus-eval, docs, needs-scenario, linked-from:README.md
- Current next action: Use the scenario proposal flow to normalize candidate evidence before creating a checked-in eval fixture.
- Why this layer: The claim points at scenario or proposal work before it is ready as a protected eval fixture.
- Human claim quality: TODO
- Human corrected proof layer: keep
- Human corrected eval surface: keep
- Human readiness: keep
- Human priority: TODO
- Duplicate of:
- Notes:

### 072 claim-docs-guides-evaluation-process-md-253
<!-- claim-id: claim-docs-guides-evaluation-process-md-253 -->
- Source: docs/guides/evaluation-process.md:253
- Summary: When repeated workflow failures should become durable scenario coverage, prefer the checked-in `skill` normalization helper over repo-local one-off shapers:
- Excerpt: When repeated workflow failures should become durable scenario coverage, prefer the checked-in `skill` normalization helper over repo-local one-off shapers:
- Current labels: proofLayer=scenario-candidate; recommendedProof=cautilus-eval; recommendedEvalSurface=n/a; readiness=needs-scenario; reviewStatus=heuristic; evidenceStatus=unknown
- Group hints: cautilus-eval, docs, needs-scenario, linked-from:README.md
- Current next action: Use the scenario proposal flow to normalize candidate evidence before creating a checked-in eval fixture.
- Why this layer: The claim points at scenario or proposal work before it is ready as a protected eval fixture.
- Human claim quality: TODO
- Human corrected proof layer: keep
- Human corrected eval surface: keep
- Human readiness: keep
- Human priority: TODO
- Duplicate of:
- Notes:

### 073 claim-docs-guides-evaluation-process-md-269
<!-- claim-id: claim-docs-guides-evaluation-process-md-269 -->
- Source: docs/guides/evaluation-process.md:269
- Summary: `eval evaluate` remains the first-class packet boundary for skill trigger and execution quality.
- Excerpt: `eval evaluate` remains the first-class packet boundary for skill trigger and execution quality.
- Current labels: proofLayer=cautilus-eval; recommendedProof=cautilus-eval; recommendedEvalSurface=dev/skill; readiness=ready-to-verify; reviewStatus=heuristic; evidenceStatus=unknown
- Group hints: cautilus-eval, docs, dev/skill, linked-from:README.md
- Current next action: Create a host-owned dev/skill fixture and run it through cautilus eval test.
- Why this layer: The claim depends on model, agent, prompt, skill, workflow, or behavior execution evidence.
- Human claim quality: TODO
- Human corrected proof layer: keep
- Human corrected eval surface: keep
- Human readiness: keep
- Human priority: TODO
- Duplicate of:
- Notes:

### 074 claim-docs-guides-evaluation-process-md-270
<!-- claim-id: claim-docs-guides-evaluation-process-md-270 -->
- Source: docs/guides/evaluation-process.md:270
- Summary: The host still owns raw invocation and transcript capture; `Cautilus` owns the case-suite/runDir workflow, packet-level recommendation, behavior-intent framing, and the direct chain into `scenario normalize skill`.
- Excerpt: The host still owns raw invocation and transcript capture; `Cautilus` owns the case-suite/runDir workflow, packet-level recommendation, behavior-intent framing, and the direct chain into `scenario normalize skill`.
- Current labels: proofLayer=cautilus-eval; recommendedProof=cautilus-eval; recommendedEvalSurface=dev/skill; readiness=ready-to-verify; reviewStatus=heuristic; evidenceStatus=unknown
- Group hints: cautilus-eval, docs, dev/skill, linked-from:README.md
- Current next action: Create a host-owned dev/skill fixture and run it through cautilus eval test.
- Why this layer: The claim depends on model, agent, prompt, skill, workflow, or behavior execution evidence.
- Human claim quality: TODO
- Human corrected proof layer: keep
- Human corrected eval surface: keep
- Human readiness: keep
- Human priority: TODO
- Duplicate of:
- Notes:

### 075 claim-docs-guides-evaluation-process-md-289
<!-- claim-id: claim-docs-guides-evaluation-process-md-289 -->
- Source: docs/guides/evaluation-process.md:289
- Summary: Use a checked-in JSON schema file and a fixed output file path so the loop can detect `blocker`, `concern`, and `pass` without guessing.
- Excerpt: Use a checked-in JSON schema file and a fixed output file path so the loop can detect `blocker`, `concern`, and `pass` without guessing.
- Current labels: proofLayer=deterministic; recommendedProof=deterministic; recommendedEvalSurface=n/a; readiness=ready-to-verify; reviewStatus=heuristic; evidenceStatus=unknown
- Group hints: deterministic, docs, linked-from:README.md
- Current next action: Keep or add a repo-owned unit, lint, build, schema, or CI check for this claim.
- Why this layer: The claim names a deterministic gate or static contract that should be protected outside Cautilus eval.
- Human claim quality: TODO
- Human corrected proof layer: keep
- Human corrected eval surface: keep
- Human readiness: keep
- Human priority: TODO
- Duplicate of:
- Notes:

### 076 claim-docs-guides-evaluation-process-md-293
<!-- claim-id: claim-docs-guides-evaluation-process-md-293 -->
- Source: docs/guides/evaluation-process.md:293
- Summary: Review variants should inspect the candidate, not mutate the repo.
- Excerpt: Review variants should inspect the candidate, not mutate the repo.
- Current labels: proofLayer=scenario-candidate; recommendedProof=cautilus-eval; recommendedEvalSurface=n/a; readiness=needs-scenario; reviewStatus=heuristic; evidenceStatus=unknown
- Group hints: cautilus-eval, docs, needs-scenario, linked-from:README.md
- Current next action: Use the scenario proposal flow to normalize candidate evidence before creating a checked-in eval fixture.
- Why this layer: The claim points at scenario or proposal work before it is ready as a protected eval fixture.
- Human claim quality: TODO
- Human corrected proof layer: keep
- Human corrected eval surface: keep
- Human readiness: keep
- Human priority: TODO
- Duplicate of:
- Notes:

### 077 claim-docs-guides-evaluation-process-md-304
<!-- claim-id: claim-docs-guides-evaluation-process-md-304 -->
- Source: docs/guides/evaluation-process.md:304
- Summary: Past sessions showed `codex exec` can emit fatal skill-loading errors on stderr while the final process exit still looks successful.
- Excerpt: Past sessions showed `codex exec` can emit fatal skill-loading errors on stderr while the final process exit still looks successful.
- Current labels: proofLayer=cautilus-eval; recommendedProof=cautilus-eval; recommendedEvalSurface=dev/skill; readiness=ready-to-verify; reviewStatus=heuristic; evidenceStatus=unknown
- Group hints: cautilus-eval, docs, dev/skill, linked-from:README.md
- Current next action: Create a host-owned dev/skill fixture and run it through cautilus eval test.
- Why this layer: The claim depends on model, agent, prompt, skill, workflow, or behavior execution evidence.
- Human claim quality: TODO
- Human corrected proof layer: keep
- Human corrected eval surface: keep
- Human readiness: keep
- Human priority: TODO
- Duplicate of:
- Notes:

### 078 claim-docs-guides-evaluation-process-md-308
<!-- claim-id: claim-docs-guides-evaluation-process-md-308 -->
- Source: docs/guides/evaluation-process.md:308
- Summary: Past sessions showed that overly aggressive effort overrides can conflict with tool surfaces that the prompt or skill still needs.
- Excerpt: Past sessions showed that overly aggressive effort overrides can conflict with tool surfaces that the prompt or skill still needs.
- Current labels: proofLayer=cautilus-eval; recommendedProof=cautilus-eval; recommendedEvalSurface=app/prompt; readiness=ready-to-verify; reviewStatus=heuristic; evidenceStatus=unknown
- Group hints: cautilus-eval, docs, app/prompt, linked-from:README.md
- Current next action: Create a host-owned app/prompt fixture and run it through cautilus eval test.
- Why this layer: The claim depends on model, agent, prompt, skill, workflow, or behavior execution evidence.
- Human claim quality: TODO
- Human corrected proof layer: keep
- Human corrected eval surface: keep
- Human readiness: keep
- Human priority: TODO
- Duplicate of:
- Notes:

### 079 claim-docs-guides-evaluation-process-md-320
<!-- claim-id: claim-docs-guides-evaluation-process-md-320 -->
- Source: docs/guides/evaluation-process.md:320
- Summary: In JSON mode, `claude -p` can wrap the verdict under `structured_output` instead of printing the schema payload as the top-level object.
- Excerpt: In JSON mode, `claude -p` can wrap the verdict under `structured_output` instead of printing the schema payload as the top-level object.
- Current labels: proofLayer=deterministic; recommendedProof=deterministic; recommendedEvalSurface=n/a; readiness=ready-to-verify; reviewStatus=heuristic; evidenceStatus=unknown
- Group hints: deterministic, docs, linked-from:README.md
- Current next action: Keep or add a repo-owned unit, lint, build, schema, or CI check for this claim.
- Why this layer: The claim names a deterministic gate or static contract that should be protected outside Cautilus eval.
- Human claim quality: TODO
- Human corrected proof layer: keep
- Human corrected eval surface: keep
- Human readiness: keep
- Human priority: TODO
- Duplicate of:
- Notes:

### 080 claim-docs-maintainers-consumer-readiness-md-5
<!-- claim-id: claim-docs-maintainers-consumer-readiness-md-5 -->
- Source: docs/maintainers/consumer-readiness.md:5
- Summary: Product-facing docs should describe repo-agnostic surfaces such as `chatbot`, `skill`, `workflow`, and `agent runtime` first, then point here for checked-in evidence shapes and proof expectations.
- Excerpt: Product-facing docs should describe repo-agnostic surfaces such as `chatbot`, `skill`, `workflow`, and `agent runtime` first, then point here for checked-in evidence shapes and proof expectations.
- Current labels: proofLayer=human-auditable; recommendedProof=human-auditable; recommendedEvalSurface=n/a; readiness=ready-to-verify; reviewStatus=heuristic; evidenceStatus=unknown
- Group hints: human-auditable, docs, linked-from:README.md
- Current next action: Record the source reference and keep it human-auditable; add deterministic or eval proof only if behavior depends on execution.
- Why this layer: The claim can be checked by reading current source, docs, or generated artifacts.
- Human claim quality: TODO
- Human corrected proof layer: keep
- Human corrected eval surface: keep
- Human readiness: keep
- Human priority: TODO
- Duplicate of:
- Notes:

### 081 claim-docs-maintainers-consumer-readiness-md-29
<!-- claim-id: claim-docs-maintainers-consumer-readiness-md-29 -->
- Source: docs/maintainers/consumer-readiness.md:29
- Summary: The repo keeps cheap deterministic proof in the root adapter and explicit LLM-backed self-dogfood paths in named adapters.
- Excerpt: The repo keeps cheap deterministic proof in the root adapter and explicit LLM-backed self-dogfood paths in named adapters.
- Current labels: proofLayer=deterministic; recommendedProof=deterministic; recommendedEvalSurface=n/a; readiness=ready-to-verify; reviewStatus=heuristic; evidenceStatus=unknown
- Group hints: deterministic, docs, linked-from:README.md
- Current next action: Keep or add a repo-owned unit, lint, build, schema, or CI check for this claim.
- Why this layer: The claim names a deterministic gate or static contract that should be protected outside Cautilus eval.
- Human claim quality: TODO
- Human corrected proof layer: keep
- Human corrected eval surface: keep
- Human readiness: keep
- Human priority: TODO
- Duplicate of:
- Notes:

### 082 claim-docs-maintainers-consumer-readiness-md-30
<!-- claim-id: claim-docs-maintainers-consumer-readiness-md-30 -->
- Source: docs/maintainers/consumer-readiness.md:30
- Summary: Stronger binary or bundled-skill claims should come back as explicit eval presets, fixture series, or named adapters instead of being smuggled into the canonical latest eval summary.
- Excerpt: Stronger binary or bundled-skill claims should come back as explicit eval presets, fixture series, or named adapters instead of being smuggled into the canonical latest eval summary.
- Current labels: proofLayer=cautilus-eval; recommendedProof=cautilus-eval; recommendedEvalSurface=dev/repo; readiness=ready-to-verify; reviewStatus=heuristic; evidenceStatus=unknown
- Group hints: cautilus-eval, docs, dev/repo, linked-from:README.md
- Current next action: Create a host-owned dev/repo fixture and run it through cautilus eval test.
- Why this layer: The claim depends on model, agent, prompt, skill, workflow, or behavior execution evidence.
- Human claim quality: TODO
- Human corrected proof layer: keep
- Human corrected eval surface: keep
- Human readiness: keep
- Human priority: TODO
- Duplicate of:
- Notes:

### 083 claim-docs-maintainers-consumer-readiness-md-59
<!-- claim-id: claim-docs-maintainers-consumer-readiness-md-59 -->
- Source: docs/maintainers/consumer-readiness.md:59
- Summary: `Cautilus` can normalize public-skill, profile, and validation drift without binding the product to one named repo's layout.
- Excerpt: `Cautilus` can normalize public-skill, profile, and validation drift without binding the product to one named repo's layout.
- Current labels: proofLayer=alignment-work; recommendedProof=human-auditable; recommendedEvalSurface=n/a; readiness=needs-alignment; reviewStatus=heuristic; evidenceStatus=unknown
- Group hints: human-auditable, docs, needs-alignment, linked-from:README.md
- Current next action: Reconcile the named docs, code, skill, adapter, or CLI surface before treating this as a verification target.
- Why this layer: The claim says surfaces should agree, so proof is not honest until the mismatched surfaces are reconciled.
- Human claim quality: TODO
- Human corrected proof layer: keep
- Human corrected eval surface: keep
- Human readiness: keep
- Human priority: TODO
- Duplicate of:
- Notes:

### 084 claim-docs-maintainers-consumer-readiness-md-68
<!-- claim-id: claim-docs-maintainers-consumer-readiness-md-68 -->
- Source: docs/maintainers/consumer-readiness.md:68
- Summary: Routed through `cautilus scenario normalize workflow`; the proposal-input lineage stays in this surface even though the legacy archetype boundary was retired (see [evaluation-surfaces.spec.md](../specs/evaluation-surfaces.spec.md)).
- Excerpt: Routed through `cautilus scenario normalize workflow`; the proposal-input lineage stays in this surface even though the legacy archetype boundary was retired (see [evaluation-surfaces.spec.md](../specs/evaluation-surfaces.spec.md)).
- Current labels: proofLayer=scenario-candidate; recommendedProof=cautilus-eval; recommendedEvalSurface=n/a; readiness=needs-scenario; reviewStatus=heuristic; evidenceStatus=unknown
- Group hints: cautilus-eval, docs, needs-scenario, linked-from:README.md
- Current next action: Use the scenario proposal flow to normalize candidate evidence before creating a checked-in eval fixture.
- Why this layer: The claim points at scenario or proposal work before it is ready as a protected eval fixture.
- Human claim quality: TODO
- Human corrected proof layer: keep
- Human corrected eval surface: keep
- Human readiness: keep
- Human priority: TODO
- Duplicate of:
- Notes:

### 085 claim-docs-maintainers-consumer-readiness-md-91
<!-- claim-id: claim-docs-maintainers-consumer-readiness-md-91 -->
- Source: docs/maintainers/consumer-readiness.md:91
- Summary: the same consumer keeps its standing repo-owned evaluator path green on the released binary: `python3 scripts/run-evals.py --repo-root .` passed its maintained scenario set and `pytest tests/test_cautilus_scenarios.py` stayed green
- Excerpt: the same consumer keeps its standing repo-owned evaluator path green on the released binary: `python3 scripts/run-evals.py --repo-root .` passed its maintained scenario set and `pytest tests/test_cautilus_scenarios.py` stayed green
- Current labels: proofLayer=scenario-candidate; recommendedProof=cautilus-eval; recommendedEvalSurface=n/a; readiness=needs-scenario; reviewStatus=heuristic; evidenceStatus=unknown
- Group hints: cautilus-eval, docs, needs-scenario, linked-from:README.md
- Current next action: Use the scenario proposal flow to normalize candidate evidence before creating a checked-in eval fixture.
- Why this layer: The claim points at scenario or proposal work before it is ready as a protected eval fixture.
- Human claim quality: TODO
- Human corrected proof layer: keep
- Human corrected eval surface: keep
- Human readiness: keep
- Human priority: TODO
- Duplicate of:
- Notes:

### 086 claim-docs-maintainers-consumer-readiness-md-98
<!-- claim-id: claim-docs-maintainers-consumer-readiness-md-98 -->
- Source: docs/maintainers/consumer-readiness.md:98
- Summary: `Cautilus` now has one external proof that a bootstrap-heavy agent-runtime consumer can adopt the released `bootstrapHelper` / `workSkill` contract without false mismatches.
- Excerpt: `Cautilus` now has one external proof that a bootstrap-heavy agent-runtime consumer can adopt the released `bootstrapHelper` / `workSkill` contract without false mismatches.
- Current labels: proofLayer=alignment-work; recommendedProof=human-auditable; recommendedEvalSurface=n/a; readiness=needs-alignment; reviewStatus=heuristic; evidenceStatus=unknown
- Group hints: human-auditable, docs, needs-alignment, linked-from:README.md
- Current next action: Reconcile the named docs, code, skill, adapter, or CLI surface before treating this as a verification target.
- Why this layer: The claim says surfaces should agree, so proof is not honest until the mismatched surfaces are reconciled.
- Human claim quality: TODO
- Human corrected proof layer: keep
- Human corrected eval surface: keep
- Human readiness: keep
- Human priority: TODO
- Duplicate of:
- Notes:

### 087 claim-docs-maintainers-development-md-36
<!-- claim-id: claim-docs-maintainers-development-md-36 -->
- Source: docs/maintainers/development.md:36
- Summary: `npm run verify` runs the same standing lint phases, then adds `go test -race` before the standing Node test suite.
- Excerpt: `npm run verify` runs the same standing lint phases, then adds `go test -race` before the standing Node test suite.
- Current labels: proofLayer=deterministic; recommendedProof=deterministic; recommendedEvalSurface=n/a; readiness=ready-to-verify; reviewStatus=heuristic; evidenceStatus=unknown
- Group hints: deterministic, docs, linked-from:README.md
- Current next action: Keep or add a repo-owned unit, lint, build, schema, or CI check for this claim.
- Why this layer: The claim names a deterministic gate or static contract that should be protected outside Cautilus eval.
- Human claim quality: TODO
- Human corrected proof layer: keep
- Human corrected eval surface: keep
- Human readiness: keep
- Human priority: TODO
- Duplicate of:
- Notes:

### 088 claim-docs-maintainers-development-md-38
<!-- claim-id: claim-docs-maintainers-development-md-38 -->
- Source: docs/maintainers/development.md:38
- Summary: `npm run lint:specs` validates the spec index, checks relative spec links, and runs the full public spec suite with `specdown run -quiet`.
- Excerpt: `npm run lint:specs` validates the spec index, checks relative spec links, and runs the full public spec suite with `specdown run -quiet`.
- Current labels: proofLayer=deterministic; recommendedProof=deterministic; recommendedEvalSurface=n/a; readiness=ready-to-verify; reviewStatus=heuristic; evidenceStatus=unknown
- Group hints: deterministic, docs, linked-from:README.md
- Current next action: Keep or add a repo-owned unit, lint, build, schema, or CI check for this claim.
- Why this layer: The claim names a deterministic gate or static contract that should be protected outside Cautilus eval.
- Human claim quality: TODO
- Human corrected proof layer: keep
- Human corrected eval surface: keep
- Human readiness: keep
- Human priority: TODO
- Duplicate of:
- Notes:

### 089 claim-docs-maintainers-development-md-79
<!-- claim-id: claim-docs-maintainers-development-md-79 -->
- Source: docs/maintainers/development.md:79
- Summary: `internal/app/app_test.go` owns single-command native command behavior and JSON payload shape.
- Excerpt: `internal/app/app_test.go` owns single-command native command behavior and JSON payload shape.
- Current labels: proofLayer=cautilus-eval; recommendedProof=cautilus-eval; recommendedEvalSurface=dev/repo; readiness=ready-to-verify; reviewStatus=heuristic; evidenceStatus=unknown
- Group hints: cautilus-eval, docs, dev/repo, linked-from:README.md
- Current next action: Create a host-owned dev/repo fixture and run it through cautilus eval test.
- Why this layer: The claim depends on model, agent, prompt, skill, workflow, or behavior execution evidence.
- Human claim quality: TODO
- Human corrected proof layer: keep
- Human corrected eval surface: keep
- Human readiness: keep
- Human priority: TODO
- Duplicate of:
- Notes:

### 090 claim-docs-maintainers-development-md-83
<!-- claim-id: claim-docs-maintainers-development-md-83 -->
- Source: docs/maintainers/development.md:83
- Summary: When adding a new check, start from the narrowest layer that can prove the behavior.
- Excerpt: When adding a new check, start from the narrowest layer that can prove the behavior.
- Current labels: proofLayer=cautilus-eval; recommendedProof=cautilus-eval; recommendedEvalSurface=dev/repo; readiness=ready-to-verify; reviewStatus=heuristic; evidenceStatus=unknown
- Group hints: cautilus-eval, docs, dev/repo, linked-from:README.md
- Current next action: Create a host-owned dev/repo fixture and run it through cautilus eval test.
- Why this layer: The claim depends on model, agent, prompt, skill, workflow, or behavior execution evidence.
- Human claim quality: TODO
- Human corrected proof layer: keep
- Human corrected eval surface: keep
- Human readiness: keep
- Human priority: TODO
- Duplicate of:
- Notes:

### 091 claim-docs-maintainers-development-md-85
<!-- claim-id: claim-docs-maintainers-development-md-85 -->
- Source: docs/maintainers/development.md:85
- Summary: Do not push deterministic helper logic into an end-to-end smoke when a fixture-backed unit test can prove it more precisely.
- Excerpt: Do not push deterministic helper logic into an end-to-end smoke when a fixture-backed unit test can prove it more precisely.
- Current labels: proofLayer=deterministic; recommendedProof=deterministic; recommendedEvalSurface=n/a; readiness=ready-to-verify; reviewStatus=heuristic; evidenceStatus=unknown
- Group hints: deterministic, docs, linked-from:README.md
- Current next action: Keep or add a repo-owned unit, lint, build, schema, or CI check for this claim.
- Why this layer: The claim names a deterministic gate or static contract that should be protected outside Cautilus eval.
- Human claim quality: TODO
- Human corrected proof layer: keep
- Human corrected eval surface: keep
- Human readiness: keep
- Human priority: TODO
- Duplicate of:
- Notes:

### 092 claim-docs-maintainers-development-md-133
<!-- claim-id: claim-docs-maintainers-development-md-133 -->
- Source: docs/maintainers/development.md:133
- Summary: `internal/runtime/` owns shipped behavior semantics for native product surfaces.
- Excerpt: `internal/runtime/` owns shipped behavior semantics for native product surfaces.
- Current labels: proofLayer=cautilus-eval; recommendedProof=cautilus-eval; recommendedEvalSurface=dev/repo; readiness=ready-to-verify; reviewStatus=heuristic; evidenceStatus=unknown
- Group hints: cautilus-eval, docs, dev/repo, linked-from:README.md
- Current next action: Create a host-owned dev/repo fixture and run it through cautilus eval test.
- Why this layer: The claim depends on model, agent, prompt, skill, workflow, or behavior execution evidence.
- Human claim quality: TODO
- Human corrected proof layer: keep
- Human corrected eval surface: keep
- Human readiness: keep
- Human priority: TODO
- Duplicate of:
- Notes:

### 093 claim-docs-maintainers-development-md-136
<!-- claim-id: claim-docs-maintainers-development-md-136 -->
- Source: docs/maintainers/development.md:136
- Summary: If a change alters shipped `optimize search` behavior, the same slice must update the Go runtime and its Go acceptance tests.
- Excerpt: If a change alters shipped `optimize search` behavior, the same slice must update the Go runtime and its Go acceptance tests.
- Current labels: proofLayer=cautilus-eval; recommendedProof=cautilus-eval; recommendedEvalSurface=dev/repo; readiness=ready-to-verify; reviewStatus=heuristic; evidenceStatus=unknown
- Group hints: cautilus-eval, docs, dev/repo, linked-from:README.md
- Current next action: Create a host-owned dev/repo fixture and run it through cautilus eval test.
- Why this layer: The claim depends on model, agent, prompt, skill, workflow, or behavior execution evidence.
- Human claim quality: TODO
- Human corrected proof layer: keep
- Human corrected eval surface: keep
- Human readiness: keep
- Human priority: TODO
- Duplicate of:
- Notes:

### 094 claim-docs-maintainers-operator-acceptance-md-256
<!-- claim-id: claim-docs-maintainers-operator-acceptance-md-256 -->
- Source: docs/maintainers/operator-acceptance.md:256
- Summary: 리드미는 *"static HTML views of the same artifacts so a human reviewer can judge them in a browser without an agent in the loop"*을 약속한다.
- Excerpt: 리드미는 *"static HTML views of the same artifacts so a human reviewer can judge them in a browser without an agent in the loop"*을 약속한다.
- Current labels: proofLayer=cautilus-eval; recommendedProof=cautilus-eval; recommendedEvalSurface=dev/repo; readiness=ready-to-verify; reviewStatus=heuristic; evidenceStatus=unknown
- Group hints: cautilus-eval, docs, dev/repo, linked-from:README.md
- Current next action: Create a host-owned dev/repo fixture and run it through cautilus eval test.
- Why this layer: The claim depends on model, agent, prompt, skill, workflow, or behavior execution evidence.
- Human claim quality: TODO
- Human corrected proof layer: keep
- Human corrected eval surface: keep
- Human readiness: keep
- Human priority: TODO
- Duplicate of:
- Notes:

### 095 claim-docs-master-plan-md-27
<!-- claim-id: claim-docs-master-plan-md-27 -->
- Source: docs/master-plan.md:27
- Summary: Cautilus owns the generic claim-to-proof workflow; consumer repos own their local fixtures, runners, prompts, wrappers, and policy.
- Excerpt: Cautilus owns the generic claim-to-proof workflow; consumer repos own their local fixtures, runners, prompts, wrappers, and policy.
- Current labels: proofLayer=cautilus-eval; recommendedProof=cautilus-eval; recommendedEvalSurface=app/prompt; readiness=ready-to-verify; reviewStatus=heuristic; evidenceStatus=unknown
- Group hints: cautilus-eval, docs, app/prompt, linked-from:README.md
- Current next action: Create a host-owned app/prompt fixture and run it through cautilus eval test.
- Why this layer: The claim depends on model, agent, prompt, skill, workflow, or behavior execution evidence.
- Human claim quality: TODO
- Human corrected proof layer: keep
- Human corrected eval surface: keep
- Human readiness: keep
- Human priority: TODO
- Duplicate of:
- Notes:

### 096 claim-docs-master-plan-md-29
<!-- claim-id: claim-docs-master-plan-md-29 -->
- Source: docs/master-plan.md:29
- Summary: The product surface should keep following the same discipline as `charness`: expose the user's intent at the public command boundary, keep tool-specific mechanics underneath it, and preserve durable artifacts that another agent can resume.
- Excerpt: The product surface should keep following the same discipline as `charness`: expose the user's intent at the public command boundary, keep tool-specific mechanics underneath it, and preserve durable artifacts that another agent can resume.
- Current labels: proofLayer=cautilus-eval; recommendedProof=cautilus-eval; recommendedEvalSurface=dev/repo; readiness=ready-to-verify; reviewStatus=heuristic; evidenceStatus=unknown
- Group hints: cautilus-eval, docs, dev/repo, linked-from:README.md
- Current next action: Create a host-owned dev/repo fixture and run it through cautilus eval test.
- Why this layer: The claim depends on model, agent, prompt, skill, workflow, or behavior execution evidence.
- Human claim quality: TODO
- Human corrected proof layer: keep
- Human corrected eval surface: keep
- Human readiness: keep
- Human priority: TODO
- Duplicate of:
- Notes:

### 097 claim-docs-master-plan-md-54
<!-- claim-id: claim-docs-master-plan-md-54 -->
- Source: docs/master-plan.md:54
- Summary: checked-in local gates, GitHub workflows that run `verify`, and an external consumer onboarding smoke (`consumer:onboard:smoke`) that proves install → adapter init → minimal wiring → adapter resolve → doctor ready → one bounded `eval test`
- Excerpt: checked-in local gates, GitHub workflows that run `verify`, and an external consumer onboarding smoke (`consumer:onboard:smoke`) that proves install → adapter init → minimal wiring → adapter resolve → doctor ready → one bounded `eval test`
- Current labels: proofLayer=cautilus-eval; recommendedProof=cautilus-eval; recommendedEvalSurface=dev/repo; readiness=ready-to-verify; reviewStatus=heuristic; evidenceStatus=unknown
- Group hints: cautilus-eval, docs, dev/repo, linked-from:README.md
- Current next action: Create a host-owned dev/repo fixture and run it through cautilus eval test.
- Why this layer: The claim depends on model, agent, prompt, skill, workflow, or behavior execution evidence.
- Human claim quality: TODO
- Human corrected proof layer: keep
- Human corrected eval surface: keep
- Human readiness: keep
- Human priority: TODO
- Duplicate of:
- Notes:

### 098 claim-docs-master-plan-md-73
<!-- claim-id: claim-docs-master-plan-md-73 -->
- Source: docs/master-plan.md:73
- Summary: The first `claim` slice ships as deterministic `cautilus claim discover`, which emits a source-ref-backed proof plan rather than a verdict.
- Excerpt: The first `claim` slice ships as deterministic `cautilus claim discover`, which emits a source-ref-backed proof plan rather than a verdict.
- Current labels: proofLayer=deterministic; recommendedProof=deterministic; recommendedEvalSurface=n/a; readiness=ready-to-verify; reviewStatus=heuristic; evidenceStatus=unknown
- Group hints: deterministic, docs, linked-from:README.md
- Current next action: Keep or add a repo-owned unit, lint, build, schema, or CI check for this claim.
- Why this layer: The claim names a deterministic gate or static contract that should be protected outside Cautilus eval.
- Human claim quality: TODO
- Human corrected proof layer: keep
- Human corrected eval surface: keep
- Human readiness: keep
- Human priority: TODO
- Duplicate of:
- Notes:

### 099 claim-docs-master-plan-md-79
<!-- claim-id: claim-docs-master-plan-md-79 -->
- Source: docs/master-plan.md:79
- Summary: `npm run lint:specs` and `npm run lint:archetypes` still gate the runtime completeness of the surviving `scenario normalize` helpers; new user-facing copy must reconcile with the surface/preset contract before landing.
- Excerpt: `npm run lint:specs` and `npm run lint:archetypes` still gate the runtime completeness of the surviving `scenario normalize` helpers; new user-facing copy must reconcile with the surface/preset contract before landing.
- Current labels: proofLayer=deterministic; recommendedProof=deterministic; recommendedEvalSurface=n/a; readiness=ready-to-verify; reviewStatus=heuristic; evidenceStatus=unknown
- Group hints: deterministic, docs, linked-from:README.md
- Current next action: Keep or add a repo-owned unit, lint, build, schema, or CI check for this claim.
- Why this layer: The claim names a deterministic gate or static contract that should be protected outside Cautilus eval.
- Human claim quality: TODO
- Human corrected proof layer: keep
- Human corrected eval surface: keep
- Human readiness: keep
- Human priority: TODO
- Duplicate of:
- Notes:

### 100 claim-docs-master-plan-md-172
<!-- claim-id: claim-docs-master-plan-md-172 -->
- Source: docs/master-plan.md:172
- Summary: Keep widening HTML surfaces only when the packet boundary stays stable and the page meaningfully improves human review; agents should consume durable packets first.
- Excerpt: Keep widening HTML surfaces only when the packet boundary stays stable and the page meaningfully improves human review; agents should consume durable packets first.
- Current labels: proofLayer=cautilus-eval; recommendedProof=cautilus-eval; recommendedEvalSurface=dev/repo; readiness=ready-to-verify; reviewStatus=heuristic; evidenceStatus=unknown
- Group hints: cautilus-eval, docs, dev/repo, linked-from:README.md
- Current next action: Create a host-owned dev/repo fixture and run it through cautilus eval test.
- Why this layer: The claim depends on model, agent, prompt, skill, workflow, or behavior execution evidence.
- Human claim quality: TODO
- Human corrected proof layer: keep
- Human corrected eval surface: keep
- Human readiness: keep
- Human priority: TODO
- Duplicate of:
- Notes:

### 101 claim-docs-specs-evaluation-surfaces-spec-md-56
<!-- claim-id: claim-docs-specs-evaluation-surfaces-spec-md-56 -->
- Source: docs/specs/evaluation-surfaces.spec.md:56
- Summary: A one-turn fixture is the degenerate case of a multi-turn episode; `app / prompt` stays intentionally one-turn because prompt I/O is the operator-facing concept.
- Excerpt: A one-turn fixture is the degenerate case of a multi-turn episode; `app / prompt` stays intentionally one-turn because prompt I/O is the operator-facing concept.
- Current labels: proofLayer=cautilus-eval; recommendedProof=cautilus-eval; recommendedEvalSurface=app/prompt; readiness=ready-to-verify; reviewStatus=heuristic; evidenceStatus=unknown
- Group hints: cautilus-eval, spec, app/prompt, linked-from:README.md
- Current next action: Create a host-owned app/prompt fixture and run it through cautilus eval test.
- Why this layer: The claim depends on model, agent, prompt, skill, workflow, or behavior execution evidence.
- Human claim quality: TODO
- Human corrected proof layer: keep
- Human corrected eval surface: keep
- Human readiness: keep
- Human priority: TODO
- Duplicate of:
- Notes:

### 102 claim-docs-specs-evaluation-surfaces-spec-md-62
<!-- claim-id: claim-docs-specs-evaluation-surfaces-spec-md-62 -->
- Source: docs/specs/evaluation-surfaces.spec.md:62
- Summary: Dev-surface turns may also carry runtime-adapter hints such as `injectSkill: true` when the runner must materialize a portable skill body for a coding-agent CLI that does not perform host skill expansion itself.
- Excerpt: Dev-surface turns may also carry runtime-adapter hints such as `injectSkill: true` when the runner must materialize a portable skill body for a coding-agent CLI that does not perform host skill expansion itself.
- Current labels: proofLayer=cautilus-eval; recommendedProof=cautilus-eval; recommendedEvalSurface=dev/skill; readiness=ready-to-verify; reviewStatus=heuristic; evidenceStatus=unknown
- Group hints: cautilus-eval, spec, dev/skill, linked-from:README.md
- Current next action: Create a host-owned dev/skill fixture and run it through cautilus eval test.
- Why this layer: The claim depends on model, agent, prompt, skill, workflow, or behavior execution evidence.
- Human claim quality: TODO
- Human corrected proof layer: keep
- Human corrected eval surface: keep
- Human readiness: keep
- Human priority: TODO
- Duplicate of:
- Notes:

### 103 claim-docs-specs-evaluation-surfaces-spec-md-63
<!-- claim-id: claim-docs-specs-evaluation-surfaces-spec-md-63 -->
- Source: docs/specs/evaluation-surfaces.spec.md:63
- Summary: Those hints are adapter instructions, not product concepts; the portable fixture contract remains the ordered user inputs and the expected behavior evidence.
- Excerpt: Those hints are adapter instructions, not product concepts; the portable fixture contract remains the ordered user inputs and the expected behavior evidence.
- Current labels: proofLayer=cautilus-eval; recommendedProof=cautilus-eval; recommendedEvalSurface=dev/repo; readiness=ready-to-verify; reviewStatus=heuristic; evidenceStatus=unknown
- Group hints: cautilus-eval, spec, dev/repo, linked-from:README.md
- Current next action: Create a host-owned dev/repo fixture and run it through cautilus eval test.
- Why this layer: The claim depends on model, agent, prompt, skill, workflow, or behavior execution evidence.
- Human claim quality: TODO
- Human corrected proof layer: keep
- Human corrected eval surface: keep
- Human readiness: keep
- Human priority: TODO
- Duplicate of:
- Notes:

### 104 claim-docs-specs-evaluation-surfaces-spec-md-174
<!-- claim-id: claim-docs-specs-evaluation-surfaces-spec-md-174 -->
- Source: docs/specs/evaluation-surfaces.spec.md:174
- Summary: `dev` surface MUST work with the operator's installed Claude Code or Codex without re-pinning model versions.
- Excerpt: `dev` surface MUST work with the operator's installed Claude Code or Codex without re-pinning model versions.
- Current labels: proofLayer=cautilus-eval; recommendedProof=cautilus-eval; recommendedEvalSurface=dev/repo; readiness=ready-to-verify; reviewStatus=heuristic; evidenceStatus=unknown
- Group hints: cautilus-eval, spec, dev/repo, linked-from:README.md
- Current next action: Create a host-owned dev/repo fixture and run it through cautilus eval test.
- Why this layer: The claim depends on model, agent, prompt, skill, workflow, or behavior execution evidence.
- Human claim quality: TODO
- Human corrected proof layer: keep
- Human corrected eval surface: keep
- Human readiness: keep
- Human priority: TODO
- Duplicate of:
- Notes:

### 105 claim-docs-specs-evaluation-surfaces-spec-md-177
<!-- claim-id: claim-docs-specs-evaluation-surfaces-spec-md-177 -->
- Source: docs/specs/evaluation-surfaces.spec.md:177
- Summary: Result packet schema MUST stay stable across surfaces so downstream consumers (`optimize prepare-input`, `report.json`) treat all four presets uniformly.
- Excerpt: Result packet schema MUST stay stable across surfaces so downstream consumers (`optimize prepare-input`, `report.json`) treat all four presets uniformly.
- Current labels: proofLayer=deterministic; recommendedProof=deterministic; recommendedEvalSurface=n/a; readiness=ready-to-verify; reviewStatus=heuristic; evidenceStatus=unknown
- Group hints: deterministic, spec, linked-from:README.md
- Current next action: Keep or add a repo-owned unit, lint, build, schema, or CI check for this claim.
- Why this layer: The claim names a deterministic gate or static contract that should be protected outside Cautilus eval.
- Human claim quality: TODO
- Human corrected proof layer: keep
- Human corrected eval surface: keep
- Human readiness: keep
- Human priority: TODO
- Duplicate of:
- Notes:

### 106 claim-docs-specs-evaluation-surfaces-spec-md-182
<!-- claim-id: claim-docs-specs-evaluation-surfaces-spec-md-182 -->
- Source: docs/specs/evaluation-surfaces.spec.md:182
- Summary: A user with Claude Code installed and no other config can run `cautilus eval test --fixture <dev-repo.fixture.json>` against their own repo and get a usable result with provider, model, harness, durationMs, and costUsd recorded.
- Excerpt: A user with Claude Code installed and no other config can run `cautilus eval test --fixture <dev-repo.fixture.json>` against their own repo and get a usable result with provider, model, harness, durationMs, and costUsd recorded.
- Current labels: proofLayer=cautilus-eval; recommendedProof=cautilus-eval; recommendedEvalSurface=dev/repo; readiness=ready-to-verify; reviewStatus=heuristic; evidenceStatus=unknown
- Group hints: cautilus-eval, spec, dev/repo, linked-from:README.md
- Current next action: Create a host-owned dev/repo fixture and run it through cautilus eval test.
- Why this layer: The claim depends on model, agent, prompt, skill, workflow, or behavior execution evidence.
- Human claim quality: TODO
- Human corrected proof layer: keep
- Human corrected eval surface: keep
- Human readiness: keep
- Human priority: TODO
- Duplicate of:
- Notes:

### 107 claim-docs-specs-evaluation-surfaces-spec-md-183
<!-- claim-id: claim-docs-specs-evaluation-surfaces-spec-md-183 -->
- Source: docs/specs/evaluation-surfaces.spec.md:183
- Summary: A user with Claude CLI but no API key can run `cautilus eval test --fixture <chat.fixture.json>` and get a usable result.
- Excerpt: A user with Claude CLI but no API key can run `cautilus eval test --fixture <chat.fixture.json>` and get a usable result.
- Current labels: proofLayer=cautilus-eval; recommendedProof=cautilus-eval; recommendedEvalSurface=dev/repo; readiness=ready-to-verify; reviewStatus=heuristic; evidenceStatus=unknown
- Group hints: cautilus-eval, spec, dev/repo, linked-from:README.md
- Current next action: Create a host-owned dev/repo fixture and run it through cautilus eval test.
- Why this layer: The claim depends on model, agent, prompt, skill, workflow, or behavior execution evidence.
- Human claim quality: TODO
- Human corrected proof layer: keep
- Human corrected eval surface: keep
- Human readiness: keep
- Human priority: TODO
- Duplicate of:
- Notes:

### 108 claim-docs-specs-evaluation-surfaces-spec-md-185
<!-- claim-id: claim-docs-specs-evaluation-surfaces-spec-md-185 -->
- Source: docs/specs/evaluation-surfaces.spec.md:185
- Summary: A `steps: [...]` fixture executes each step in order, and step N can read step (N-1)'s output.
- Excerpt: A `steps: [...]` fixture executes each step in order, and step N can read step (N-1)'s output.
- Current labels: proofLayer=human-auditable; recommendedProof=human-auditable; recommendedEvalSurface=n/a; readiness=ready-to-verify; reviewStatus=heuristic; evidenceStatus=unknown
- Group hints: human-auditable, spec, linked-from:README.md
- Current next action: Record the source reference and keep it human-auditable; add deterministic or eval proof only if behavior depends on execution.
- Why this layer: The claim can be checked by reading current source, docs, or generated artifacts.
- Human claim quality: TODO
- Human corrected proof layer: keep
- Human corrected eval surface: keep
- Human readiness: keep
- Human priority: TODO
- Duplicate of:
- Notes:

### 109 claim-docs-specs-evaluation-surfaces-spec-md-249
<!-- claim-id: claim-docs-specs-evaluation-surfaces-spec-md-249 -->
- Source: docs/specs/evaluation-surfaces.spec.md:249
- Summary: Schema validates `surface=dev, preset=repo` only; C2/C3/C4 fields stub-error until their slices land.
- Excerpt: Schema validates `surface=dev, preset=repo` only; C2/C3/C4 fields stub-error until their slices land.
- Current labels: proofLayer=deterministic; recommendedProof=deterministic; recommendedEvalSurface=n/a; readiness=ready-to-verify; reviewStatus=heuristic; evidenceStatus=unknown
- Group hints: deterministic, spec, linked-from:README.md
- Current next action: Keep or add a repo-owned unit, lint, build, schema, or CI check for this claim.
- Why this layer: The claim names a deterministic gate or static contract that should be protected outside Cautilus eval.
- Human claim quality: TODO
- Human corrected proof layer: keep
- Human corrected eval surface: keep
- Human readiness: keep
- Human priority: TODO
- Duplicate of:
- Notes:

### 110 claim-docs-specs-index-spec-md-7
<!-- claim-id: claim-docs-specs-index-spec-md-7 -->
- Source: docs/specs/index.spec.md:7
- Summary: `npm run lint:specs` validates the spec index, checks relative links, and runs the full suite.
- Excerpt: `npm run lint:specs` validates the spec index, checks relative links, and runs the full suite.
- Current labels: proofLayer=deterministic; recommendedProof=deterministic; recommendedEvalSurface=n/a; readiness=ready-to-verify; reviewStatus=heuristic; evidenceStatus=unknown
- Group hints: deterministic, spec, linked-from:AGENTS.md
- Current next action: Keep or add a repo-owned unit, lint, build, schema, or CI check for this claim.
- Why this layer: The claim names a deterministic gate or static contract that should be protected outside Cautilus eval.
- Human claim quality: TODO
- Human corrected proof layer: keep
- Human corrected eval surface: keep
- Human readiness: keep
- Human priority: TODO
- Duplicate of:
- Notes:

### 111 claim-docs-specs-index-spec-md-24
<!-- claim-id: claim-docs-specs-index-spec-md-24 -->
- Source: docs/specs/index.spec.md:24
- Summary: The first proof deliberately shows a small end-to-end product move: `Cautilus` turns raw proposal inputs into a reusable scenario packet and then into a page a human can scan in a browser.
- Excerpt: The first proof deliberately shows a small end-to-end product move: `Cautilus` turns raw proposal inputs into a reusable scenario packet and then into a page a human can scan in a browser.
- Current labels: proofLayer=scenario-candidate; recommendedProof=cautilus-eval; recommendedEvalSurface=n/a; readiness=needs-scenario; reviewStatus=heuristic; evidenceStatus=unknown
- Group hints: cautilus-eval, spec, needs-scenario, linked-from:AGENTS.md
- Current next action: Use the scenario proposal flow to normalize candidate evidence before creating a checked-in eval fixture.
- Why this layer: The claim points at scenario or proposal work before it is ready as a protected eval fixture.
- Human claim quality: TODO
- Human corrected proof layer: keep
- Human corrected eval surface: keep
- Human readiness: keep
- Human priority: TODO
- Duplicate of:
- Notes:

### 112 claim-docs-specs-index-spec-md-34
<!-- claim-id: claim-docs-specs-index-spec-md-34 -->
- Source: docs/specs/index.spec.md:34
- Summary: [Standalone Surface](standalone-surface.spec.md) Proves that the standalone binary and bundled skill can be installed into a fresh repo and discovered through stable operator-facing commands.
- Excerpt: [Standalone Surface](standalone-surface.spec.md) Proves that the standalone binary and bundled skill can be installed into a fresh repo and discovered through stable operator-facing commands.
- Current labels: proofLayer=cautilus-eval; recommendedProof=cautilus-eval; recommendedEvalSurface=dev/skill; readiness=ready-to-verify; reviewStatus=heuristic; evidenceStatus=unknown
- Group hints: cautilus-eval, spec, dev/skill, linked-from:AGENTS.md
- Current next action: Create a host-owned dev/skill fixture and run it through cautilus eval test.
- Why this layer: The claim depends on model, agent, prompt, skill, workflow, or behavior execution evidence.
- Human claim quality: TODO
- Human corrected proof layer: keep
- Human corrected eval surface: keep
- Human readiness: keep
- Human priority: TODO
- Duplicate of:
- Notes:

### 113 claim-docs-specs-index-spec-md-40
<!-- claim-id: claim-docs-specs-index-spec-md-40 -->
- Source: docs/specs/index.spec.md:40
- Summary: [HTML Report Surface](html-report.spec.md) Proves the currently shipped static HTML outputs that let a human review packet-based artifacts in a browser.
- Excerpt: [HTML Report Surface](html-report.spec.md) Proves the currently shipped static HTML outputs that let a human review packet-based artifacts in a browser.
- Current labels: proofLayer=human-auditable; recommendedProof=human-auditable; recommendedEvalSurface=n/a; readiness=ready-to-verify; reviewStatus=heuristic; evidenceStatus=unknown
- Group hints: human-auditable, spec, linked-from:AGENTS.md
- Current next action: Record the source reference and keep it human-auditable; add deterministic or eval proof only if behavior depends on execution.
- Why this layer: The claim can be checked by reading current source, docs, or generated artifacts.
- Human claim quality: TODO
- Human corrected proof layer: keep
- Human corrected eval surface: keep
- Human readiness: keep
- Human priority: TODO
- Duplicate of:
- Notes:

### 114 claim-docs-contracts-active-run-md-3
<!-- claim-id: claim-docs-contracts-active-run-md-3 -->
- Source: docs/contracts/active-run.md:3
- Summary: `Cautilus` pins one product-owned per-run workspace root per workflow and keeps the reference sticky across consumer command invocations with a shell environment variable.
- Excerpt: `Cautilus` pins one product-owned per-run workspace root per workflow and keeps the reference sticky across consumer command invocations with a shell environment variable.
- Current labels: proofLayer=cautilus-eval; recommendedProof=cautilus-eval; recommendedEvalSurface=dev/repo; readiness=ready-to-verify; reviewStatus=heuristic; evidenceStatus=unknown
- Group hints: cautilus-eval, contract, dev/repo, linked-from:docs/master-plan.md
- Current next action: Create a host-owned dev/repo fixture and run it through cautilus eval test.
- Why this layer: The claim depends on model, agent, prompt, skill, workflow, or behavior execution evidence.
- Human claim quality: TODO
- Human corrected proof layer: keep
- Human corrected eval surface: keep
- Human readiness: keep
- Human priority: TODO
- Duplicate of:
- Notes:

### 115 claim-docs-contracts-active-run-md-59
<!-- claim-id: claim-docs-contracts-active-run-md-59 -->
- Source: docs/contracts/active-run.md:59
- Summary: The manifest is only a recognition marker for the pruner; workflow metadata belongs in per-command artifacts, not in the manifest.
- Excerpt: The manifest is only a recognition marker for the pruner; workflow metadata belongs in per-command artifacts, not in the manifest.
- Current labels: proofLayer=cautilus-eval; recommendedProof=cautilus-eval; recommendedEvalSurface=dev/repo; readiness=ready-to-verify; reviewStatus=heuristic; evidenceStatus=unknown
- Group hints: cautilus-eval, contract, dev/repo, linked-from:docs/master-plan.md
- Current next action: Create a host-owned dev/repo fixture and run it through cautilus eval test.
- Why this layer: The claim depends on model, agent, prompt, skill, workflow, or behavior execution evidence.
- Human claim quality: TODO
- Human corrected proof layer: keep
- Human corrected eval surface: keep
- Human readiness: keep
- Human priority: TODO
- Duplicate of:
- Notes:

### 116 claim-docs-contracts-active-run-md-186
<!-- claim-id: claim-docs-contracts-active-run-md-186 -->
- Source: docs/contracts/active-run.md:186
- Summary: Ambiguous across parallel workflows, silently grabs yesterday's workflow across session gaps, requires a magic freshness threshold.
- Excerpt: Ambiguous across parallel workflows, silently grabs yesterday's workflow across session gaps, requires a magic freshness threshold.
- Current labels: proofLayer=cautilus-eval; recommendedProof=cautilus-eval; recommendedEvalSurface=dev/repo; readiness=ready-to-verify; reviewStatus=heuristic; evidenceStatus=unknown
- Group hints: cautilus-eval, contract, dev/repo, linked-from:docs/master-plan.md
- Current next action: Create a host-owned dev/repo fixture and run it through cautilus eval test.
- Why this layer: The claim depends on model, agent, prompt, skill, workflow, or behavior execution evidence.
- Human claim quality: TODO
- Human corrected proof layer: keep
- Human corrected eval surface: keep
- Human readiness: keep
- Human priority: TODO
- Duplicate of:
- Notes:

### 117 claim-docs-contracts-active-run-md-212
<!-- claim-id: claim-docs-contracts-active-run-md-212 -->
- Source: docs/contracts/active-run.md:212
- Summary: Should `run.json` carry workflow metadata (mode, baseline ref, adapter name) so the pruner and HTML views can present richer summaries?
- Excerpt: Should `run.json` carry workflow metadata (mode, baseline ref, adapter name) so the pruner and HTML views can present richer summaries?
- Current labels: proofLayer=cautilus-eval; recommendedProof=cautilus-eval; recommendedEvalSurface=dev/repo; readiness=ready-to-verify; reviewStatus=heuristic; evidenceStatus=unknown
- Group hints: cautilus-eval, contract, dev/repo, linked-from:docs/master-plan.md
- Current next action: Create a host-owned dev/repo fixture and run it through cautilus eval test.
- Why this layer: The claim depends on model, agent, prompt, skill, workflow, or behavior execution evidence.
- Human claim quality: TODO
- Human corrected proof layer: keep
- Human corrected eval surface: keep
- Human readiness: keep
- Human priority: TODO
- Duplicate of:
- Notes:

### 118 claim-docs-contracts-active-run-md-218
<!-- claim-id: claim-docs-contracts-active-run-md-218 -->
- Source: docs/contracts/active-run.md:218
- Summary: Is `review variants` a workflow-creating command that mints runDirs (and therefore uses `resolveRunDir`), or is it a consume-only command that only reads an existing active run (and therefore uses `readActiveRunDir`)?
- Excerpt: Is `review variants` a workflow-creating command that mints runDirs (and therefore uses `resolveRunDir`), or is it a consume-only command that only reads an existing active run (and therefore uses `readActiveRunDir`)?
- Current labels: proofLayer=cautilus-eval; recommendedProof=cautilus-eval; recommendedEvalSurface=dev/repo; readiness=ready-to-verify; reviewStatus=heuristic; evidenceStatus=unknown
- Group hints: cautilus-eval, contract, dev/repo, linked-from:docs/master-plan.md
- Current next action: Create a host-owned dev/repo fixture and run it through cautilus eval test.
- Why this layer: The claim depends on model, agent, prompt, skill, workflow, or behavior execution evidence.
- Human claim quality: TODO
- Human corrected proof layer: keep
- Human corrected eval surface: keep
- Human readiness: keep
- Human priority: TODO
- Duplicate of:
- Notes:

### 119 claim-docs-contracts-active-run-md-221
<!-- claim-id: claim-docs-contracts-active-run-md-221 -->
- Source: docs/contracts/active-run.md:221
- Summary: The command therefore follows the same precedence chain as other workflow-creating helpers (explicit `--output-dir` > `CAUTILUS_RUN_DIR` > auto-materialize under `./.cautilus/runs/`) and emits `Active run: <abs path>` once only when it auto-materializes.
- Excerpt: The command therefore follows the same precedence chain as other workflow-creating helpers (explicit `--output-dir` > `CAUTILUS_RUN_DIR` > auto-materialize under `./.cautilus/runs/`) and emits `Active run: <abs path>` once only when it auto-materializes.
- Current labels: proofLayer=cautilus-eval; recommendedProof=cautilus-eval; recommendedEvalSurface=dev/repo; readiness=ready-to-verify; reviewStatus=heuristic; evidenceStatus=unknown
- Group hints: cautilus-eval, contract, dev/repo, linked-from:docs/master-plan.md
- Current next action: Create a host-owned dev/repo fixture and run it through cautilus eval test.
- Why this layer: The claim depends on model, agent, prompt, skill, workflow, or behavior execution evidence.
- Human claim quality: TODO
- Human corrected proof layer: keep
- Human corrected eval surface: keep
- Human readiness: keep
- Human priority: TODO
- Duplicate of:
- Notes:

### 120 claim-docs-contracts-claim-discovery-workflow-md-5
<!-- claim-id: claim-docs-contracts-claim-discovery-workflow-md-5 -->
- Source: docs/contracts/claim-discovery-workflow.md:5
- Summary: `cautilus claim discover` currently emits a deterministic, source-ref-backed proof-plan skeleton.
- Excerpt: `cautilus claim discover` currently emits a deterministic, source-ref-backed proof-plan skeleton.
- Current labels: proofLayer=deterministic; recommendedProof=deterministic; recommendedEvalSurface=n/a; readiness=ready-to-verify; reviewStatus=heuristic; evidenceStatus=unknown
- Group hints: deterministic, contract, linked-from:docs/master-plan.md
- Current next action: Keep or add a repo-owned unit, lint, build, schema, or CI check for this claim.
- Why this layer: The claim names a deterministic gate or static contract that should be protected outside Cautilus eval.
- Human claim quality: TODO
- Human corrected proof layer: keep
- Human corrected eval surface: keep
- Human readiness: keep
- Human priority: TODO
- Duplicate of:
- Notes:

### 121 claim-docs-contracts-claim-discovery-workflow-md-21
<!-- claim-id: claim-docs-contracts-claim-discovery-workflow-md-21 -->
- Source: docs/contracts/claim-discovery-workflow.md:21
- Summary: Existing claim state refresh is selected by the skill when it detects a prior JSON packet, but the refresh plan and state transition must be recorded in deterministic packets or helper output.
- Excerpt: Existing claim state refresh is selected by the skill when it detects a prior JSON packet, but the refresh plan and state transition must be recorded in deterministic packets or helper output.
- Current labels: proofLayer=deterministic; recommendedProof=deterministic; recommendedEvalSurface=n/a; readiness=ready-to-verify; reviewStatus=heuristic; evidenceStatus=unknown
- Group hints: deterministic, contract, linked-from:docs/master-plan.md
- Current next action: Keep or add a repo-owned unit, lint, build, schema, or CI check for this claim.
- Why this layer: The claim names a deterministic gate or static contract that should be protected outside Cautilus eval.
- Human claim quality: TODO
- Human corrected proof layer: keep
- Human corrected eval surface: keep
- Human readiness: keep
- Human priority: TODO
- Duplicate of:
- Notes:

### 122 claim-docs-contracts-claim-discovery-workflow-md-39
<!-- claim-id: claim-docs-contracts-claim-discovery-workflow-md-39 -->
- Source: docs/contracts/claim-discovery-workflow.md:39
- Summary: If prior claim state exists, step 5 becomes a diff-aware refresh selected by the skill: the skill uses the previous packet, the previous commit recorded in that packet, and a deterministic refresh plan to decide which sources need rescanning or re-review.
- Excerpt: If prior claim state exists, step 5 becomes a diff-aware refresh selected by the skill: the skill uses the previous packet, the previous commit recorded in that packet, and a deterministic refresh plan to decide which sources need rescanning or re-review.
- Current labels: proofLayer=deterministic; recommendedProof=deterministic; recommendedEvalSurface=n/a; readiness=ready-to-verify; reviewStatus=heuristic; evidenceStatus=unknown
- Group hints: deterministic, contract, linked-from:docs/master-plan.md
- Current next action: Keep or add a repo-owned unit, lint, build, schema, or CI check for this claim.
- Why this layer: The claim names a deterministic gate or static contract that should be protected outside Cautilus eval.
- Human claim quality: TODO
- Human corrected proof layer: keep
- Human corrected eval surface: keep
- Human readiness: keep
- Human priority: TODO
- Duplicate of:
- Notes:

### 123 claim-docs-contracts-claim-discovery-workflow-md-47
<!-- claim-id: claim-docs-contracts-claim-discovery-workflow-md-47 -->
- Source: docs/contracts/claim-discovery-workflow.md:47
- Summary: The binary should own deterministic behavior that can be rerun without model access:
- Excerpt: The binary should own deterministic behavior that can be rerun without model access:
- Current labels: proofLayer=deterministic; recommendedProof=deterministic; recommendedEvalSurface=n/a; readiness=ready-to-verify; reviewStatus=heuristic; evidenceStatus=unknown
- Group hints: deterministic, contract, linked-from:docs/master-plan.md
- Current next action: Keep or add a repo-owned unit, lint, build, schema, or CI check for this claim.
- Why this layer: The claim names a deterministic gate or static contract that should be protected outside Cautilus eval.
- Human claim quality: TODO
- Human corrected proof layer: keep
- Human corrected eval surface: keep
- Human readiness: keep
- Human priority: TODO
- Duplicate of:
- Notes:

### 124 claim-docs-contracts-claim-discovery-workflow-md-60
<!-- claim-id: claim-docs-contracts-claim-discovery-workflow-md-60 -->
- Source: docs/contracts/claim-discovery-workflow.md:60
- Summary: The binary must not own LLM provider selection, subagent scheduling, model prompts, review policy, or human conversation.
- Excerpt: The binary must not own LLM provider selection, subagent scheduling, model prompts, review policy, or human conversation.
- Current labels: proofLayer=cautilus-eval; recommendedProof=cautilus-eval; recommendedEvalSurface=app/prompt; readiness=ready-to-verify; reviewStatus=heuristic; evidenceStatus=unknown
- Group hints: cautilus-eval, contract, app/prompt, linked-from:docs/master-plan.md
- Current next action: Create a host-owned app/prompt fixture and run it through cautilus eval test.
- Why this layer: The claim depends on model, agent, prompt, skill, workflow, or behavior execution evidence.
- Human claim quality: TODO
- Human corrected proof layer: keep
- Human corrected eval surface: keep
- Human readiness: keep
- Human priority: TODO
- Duplicate of:
- Notes:

### 125 claim-docs-contracts-claim-discovery-workflow-md-65
<!-- claim-id: claim-docs-contracts-claim-discovery-workflow-md-65 -->
- Source: docs/contracts/claim-discovery-workflow.md:65
- Summary: The bundled skill should own orchestration that depends on an agent:
- Excerpt: The bundled skill should own orchestration that depends on an agent:
- Current labels: proofLayer=cautilus-eval; recommendedProof=cautilus-eval; recommendedEvalSurface=dev/skill; readiness=ready-to-verify; reviewStatus=heuristic; evidenceStatus=unknown
- Group hints: cautilus-eval, contract, dev/skill, linked-from:docs/master-plan.md
- Current next action: Create a host-owned dev/skill fixture and run it through cautilus eval test.
- Why this layer: The claim depends on model, agent, prompt, skill, workflow, or behavior execution evidence.
- Human claim quality: TODO
- Human corrected proof layer: keep
- Human corrected eval surface: keep
- Human readiness: keep
- Human priority: TODO
- Duplicate of:
- Notes:

### 126 claim-docs-contracts-claim-discovery-workflow-md-78
<!-- claim-id: claim-docs-contracts-claim-discovery-workflow-md-78 -->
- Source: docs/contracts/claim-discovery-workflow.md:78
- Summary: This keeps the product agent-first without making the binary a host-specific agent runtime.
- Excerpt: This keeps the product agent-first without making the binary a host-specific agent runtime.
- Current labels: proofLayer=cautilus-eval; recommendedProof=cautilus-eval; recommendedEvalSurface=dev/repo; readiness=ready-to-verify; reviewStatus=heuristic; evidenceStatus=unknown
- Group hints: cautilus-eval, contract, dev/repo, linked-from:docs/master-plan.md
- Current next action: Create a host-owned dev/repo fixture and run it through cautilus eval test.
- Why this layer: The claim depends on model, agent, prompt, skill, workflow, or behavior execution evidence.
- Human claim quality: TODO
- Human corrected proof layer: keep
- Human corrected eval surface: keep
- Human readiness: keep
- Human priority: TODO
- Duplicate of:
- Notes:

### 127 claim-docs-contracts-claim-discovery-workflow-md-111
<!-- claim-id: claim-docs-contracts-claim-discovery-workflow-md-111 -->
- Source: docs/contracts/claim-discovery-workflow.md:111
- Summary: Before running a first broad scan, the skill should say which entries and depth it will use.
- Excerpt: Before running a first broad scan, the skill should say which entries and depth it will use.
- Current labels: proofLayer=cautilus-eval; recommendedProof=cautilus-eval; recommendedEvalSurface=dev/skill; readiness=ready-to-verify; reviewStatus=heuristic; evidenceStatus=unknown
- Group hints: cautilus-eval, contract, dev/skill, linked-from:docs/master-plan.md
- Current next action: Create a host-owned dev/skill fixture and run it through cautilus eval test.
- Why this layer: The claim depends on model, agent, prompt, skill, workflow, or behavior execution evidence.
- Human claim quality: TODO
- Human corrected proof layer: keep
- Human corrected eval surface: keep
- Human readiness: keep
- Human priority: TODO
- Duplicate of:
- Notes:

### 128 claim-docs-contracts-claim-discovery-workflow-md-112
<!-- claim-id: claim-docs-contracts-claim-discovery-workflow-md-112 -->
- Source: docs/contracts/claim-discovery-workflow.md:112
- Summary: It should also show the deterministic bounds that will be applied:
- Excerpt: It should also show the deterministic bounds that will be applied:
- Current labels: proofLayer=deterministic; recommendedProof=deterministic; recommendedEvalSurface=n/a; readiness=ready-to-verify; reviewStatus=heuristic; evidenceStatus=unknown
- Group hints: deterministic, contract, linked-from:docs/master-plan.md
- Current next action: Keep or add a repo-owned unit, lint, build, schema, or CI check for this claim.
- Why this layer: The claim names a deterministic gate or static contract that should be protected outside Cautilus eval.
- Human claim quality: TODO
- Human corrected proof layer: keep
- Human corrected eval surface: keep
- Human readiness: keep
- Human priority: TODO
- Duplicate of:
- Notes:

### 129 claim-docs-contracts-claim-discovery-workflow-md-120
<!-- claim-id: claim-docs-contracts-claim-discovery-workflow-md-120 -->
- Source: docs/contracts/claim-discovery-workflow.md:120
- Summary: The skill should ask the user to confirm or adjust that scope.
- Excerpt: The skill should ask the user to confirm or adjust that scope.
- Current labels: proofLayer=cautilus-eval; recommendedProof=cautilus-eval; recommendedEvalSurface=dev/skill; readiness=ready-to-verify; reviewStatus=heuristic; evidenceStatus=unknown
- Group hints: cautilus-eval, contract, dev/skill, linked-from:docs/master-plan.md
- Current next action: Create a host-owned dev/skill fixture and run it through cautilus eval test.
- Why this layer: The claim depends on model, agent, prompt, skill, workflow, or behavior execution evidence.
- Human claim quality: TODO
- Human corrected proof layer: keep
- Human corrected eval surface: keep
- Human readiness: keep
- Human priority: TODO
- Duplicate of:
- Notes:

### 130 claim-docs-contracts-claim-discovery-workflow-md-121
<!-- claim-id: claim-docs-contracts-claim-discovery-workflow-md-121 -->
- Source: docs/contracts/claim-discovery-workflow.md:121
- Summary: After confirmation, the binary should record the effective scope in the packet so a future agent can reproduce or refresh the run.
- Excerpt: After confirmation, the binary should record the effective scope in the packet so a future agent can reproduce or refresh the run.
- Current labels: proofLayer=cautilus-eval; recommendedProof=cautilus-eval; recommendedEvalSurface=dev/repo; readiness=ready-to-verify; reviewStatus=heuristic; evidenceStatus=unknown
- Group hints: cautilus-eval, contract, dev/repo, linked-from:docs/master-plan.md
- Current next action: Create a host-owned dev/repo fixture and run it through cautilus eval test.
- Why this layer: The claim depends on model, agent, prompt, skill, workflow, or behavior execution evidence.
- Human claim quality: TODO
- Human corrected proof layer: keep
- Human corrected eval surface: keep
- Human readiness: keep
- Human priority: TODO
- Duplicate of:
- Notes:

### 131 claim-docs-contracts-claim-discovery-workflow-md-126
<!-- claim-id: claim-docs-contracts-claim-discovery-workflow-md-126 -->
- Source: docs/contracts/claim-discovery-workflow.md:126
- Summary: After the deterministic pass, the skill should show a separate review plan:
- Excerpt: After the deterministic pass, the skill should show a separate review plan:
- Current labels: proofLayer=deterministic; recommendedProof=deterministic; recommendedEvalSurface=n/a; readiness=ready-to-verify; reviewStatus=heuristic; evidenceStatus=unknown
- Group hints: deterministic, contract, linked-from:docs/master-plan.md
- Current next action: Keep or add a repo-owned unit, lint, build, schema, or CI check for this claim.
- Why this layer: The claim names a deterministic gate or static contract that should be protected outside Cautilus eval.
- Human claim quality: TODO
- Human corrected proof layer: keep
- Human corrected eval surface: keep
- Human readiness: keep
- Human priority: TODO
- Duplicate of:
- Notes:

### 132 claim-docs-contracts-claim-discovery-workflow-md-139
<!-- claim-id: claim-docs-contracts-claim-discovery-workflow-md-139 -->
- Source: docs/contracts/claim-discovery-workflow.md:139
- Summary: The user should confirm or adjust that review budget before the skill launches subagents or other LLM-backed review.
- Excerpt: The user should confirm or adjust that review budget before the skill launches subagents or other LLM-backed review.
- Current labels: proofLayer=cautilus-eval; recommendedProof=cautilus-eval; recommendedEvalSurface=dev/skill; readiness=ready-to-verify; reviewStatus=heuristic; evidenceStatus=unknown
- Group hints: cautilus-eval, contract, dev/skill, linked-from:docs/master-plan.md
- Current next action: Create a host-owned dev/skill fixture and run it through cautilus eval test.
- Why this layer: The claim depends on model, agent, prompt, skill, workflow, or behavior execution evidence.
- Human claim quality: TODO
- Human corrected proof layer: keep
- Human corrected eval surface: keep
- Human readiness: keep
- Human priority: TODO
- Duplicate of:
- Notes:

### 133 claim-docs-contracts-claim-discovery-workflow-md-140
<!-- claim-id: claim-docs-contracts-claim-discovery-workflow-md-140 -->
- Source: docs/contracts/claim-discovery-workflow.md:140
- Summary: If the user already delegated autonomous continuation, the skill may proceed within the recorded budget, but the budget still must be written to the packet.
- Excerpt: If the user already delegated autonomous continuation, the skill may proceed within the recorded budget, but the budget still must be written to the packet.
- Current labels: proofLayer=cautilus-eval; recommendedProof=cautilus-eval; recommendedEvalSurface=dev/skill; readiness=ready-to-verify; reviewStatus=heuristic; evidenceStatus=unknown
- Group hints: cautilus-eval, contract, dev/skill, linked-from:docs/master-plan.md
- Current next action: Create a host-owned dev/skill fixture and run it through cautilus eval test.
- Why this layer: The claim depends on model, agent, prompt, skill, workflow, or behavior execution evidence.
- Human claim quality: TODO
- Human corrected proof layer: keep
- Human corrected eval surface: keep
- Human readiness: keep
- Human priority: TODO
- Duplicate of:
- Notes:

### 134 claim-docs-contracts-claim-discovery-workflow-md-205
<!-- claim-id: claim-docs-contracts-claim-discovery-workflow-md-205 -->
- Source: docs/contracts/claim-discovery-workflow.md:205
- Summary: The old `proofLayer` field may remain for one compatibility window as a derived or deprecated field, but new workflow logic should use the split fields.
- Excerpt: The old `proofLayer` field may remain for one compatibility window as a derived or deprecated field, but new workflow logic should use the split fields.
- Current labels: proofLayer=cautilus-eval; recommendedProof=cautilus-eval; recommendedEvalSurface=dev/repo; readiness=ready-to-verify; reviewStatus=heuristic; evidenceStatus=unknown
- Group hints: cautilus-eval, contract, dev/repo, linked-from:docs/master-plan.md
- Current next action: Create a host-owned dev/repo fixture and run it through cautilus eval test.
- Why this layer: The claim depends on model, agent, prompt, skill, workflow, or behavior execution evidence.
- Human claim quality: TODO
- Human corrected proof layer: keep
- Human corrected eval surface: keep
- Human readiness: keep
- Human priority: TODO
- Duplicate of:
- Notes:

### 135 claim-docs-contracts-claim-discovery-workflow-md-206
<!-- claim-id: claim-docs-contracts-claim-discovery-workflow-md-206 -->
- Source: docs/contracts/claim-discovery-workflow.md:206
- Summary: During that window, derivation must be deterministic and tested:
- Excerpt: During that window, derivation must be deterministic and tested:
- Current labels: proofLayer=deterministic; recommendedProof=deterministic; recommendedEvalSurface=n/a; readiness=ready-to-verify; reviewStatus=heuristic; evidenceStatus=unknown
- Group hints: deterministic, contract, linked-from:docs/master-plan.md
- Current next action: Keep or add a repo-owned unit, lint, build, schema, or CI check for this claim.
- Why this layer: The claim names a deterministic gate or static contract that should be protected outside Cautilus eval.
- Human claim quality: TODO
- Human corrected proof layer: keep
- Human corrected eval surface: keep
- Human readiness: keep
- Human priority: TODO
- Duplicate of:
- Notes:

### 136 claim-docs-contracts-claim-discovery-workflow-md-222
<!-- claim-id: claim-docs-contracts-claim-discovery-workflow-md-222 -->
- Source: docs/contracts/claim-discovery-workflow.md:222
- Summary: `verificationReadiness=ready-to-verify` with `evidenceStatus=missing` means proof is absent but a test, fixture, or human-auditable check can now be created or run.
- Excerpt: `verificationReadiness=ready-to-verify` with `evidenceStatus=missing` means proof is absent but a test, fixture, or human-auditable check can now be created or run.
- Current labels: proofLayer=human-auditable; recommendedProof=human-auditable; recommendedEvalSurface=n/a; readiness=ready-to-verify; reviewStatus=heuristic; evidenceStatus=unknown
- Group hints: human-auditable, contract, linked-from:docs/master-plan.md
- Current next action: Record the source reference and keep it human-auditable; add deterministic or eval proof only if behavior depends on execution.
- Why this layer: The claim can be checked by reading current source, docs, or generated artifacts.
- Human claim quality: TODO
- Human corrected proof layer: keep
- Human corrected eval surface: keep
- Human readiness: keep
- Human priority: TODO
- Duplicate of:
- Notes:

### 137 claim-docs-contracts-claim-discovery-workflow-md-224
<!-- claim-id: claim-docs-contracts-claim-discovery-workflow-md-224 -->
- Source: docs/contracts/claim-discovery-workflow.md:224
- Summary: `verificationReadiness=needs-alignment` means at least two truth surfaces must be reconciled before proof would be honest.
- Excerpt: `verificationReadiness=needs-alignment` means at least two truth surfaces must be reconciled before proof would be honest.
- Current labels: proofLayer=alignment-work; recommendedProof=human-auditable; recommendedEvalSurface=n/a; readiness=needs-alignment; reviewStatus=heuristic; evidenceStatus=unknown
- Group hints: human-auditable, contract, needs-alignment, linked-from:docs/master-plan.md
- Current next action: Reconcile the named docs, code, skill, adapter, or CLI surface before treating this as a verification target.
- Why this layer: The claim says surfaces should agree, so proof is not honest until the mismatched surfaces are reconciled.
- Human claim quality: TODO
- Human corrected proof layer: keep
- Human corrected eval surface: keep
- Human readiness: keep
- Human priority: TODO
- Duplicate of:
- Notes:

### 138 claim-docs-contracts-claim-discovery-workflow-md-228
<!-- claim-id: claim-docs-contracts-claim-discovery-workflow-md-228 -->
- Source: docs/contracts/claim-discovery-workflow.md:228
- Summary: `evidenceRefs[]` should use a minimum inspectable shape:
- Excerpt: `evidenceRefs[]` should use a minimum inspectable shape:
- Current labels: proofLayer=human-auditable; recommendedProof=human-auditable; recommendedEvalSurface=n/a; readiness=ready-to-verify; reviewStatus=heuristic; evidenceStatus=unknown
- Group hints: human-auditable, contract, linked-from:docs/master-plan.md
- Current next action: Record the source reference and keep it human-auditable; add deterministic or eval proof only if behavior depends on execution.
- Why this layer: The claim can be checked by reading current source, docs, or generated artifacts.
- Human claim quality: TODO
- Human corrected proof layer: keep
- Human corrected eval surface: keep
- Human readiness: keep
- Human priority: TODO
- Duplicate of:
- Notes:

### 139 claim-docs-contracts-claim-discovery-workflow-md-256
<!-- claim-id: claim-docs-contracts-claim-discovery-workflow-md-256 -->
- Source: docs/contracts/claim-discovery-workflow.md:256
- Summary: `discover` should eventually produce status, not only candidates.
- Excerpt: `discover` should eventually produce status, not only candidates.
- Current labels: proofLayer=scenario-candidate; recommendedProof=cautilus-eval; recommendedEvalSurface=n/a; readiness=needs-scenario; reviewStatus=heuristic; evidenceStatus=unknown
- Group hints: cautilus-eval, contract, needs-scenario, linked-from:docs/master-plan.md
- Current next action: Use the scenario proposal flow to normalize candidate evidence before creating a checked-in eval fixture.
- Why this layer: The claim points at scenario or proposal work before it is ready as a protected eval fixture.
- Human claim quality: TODO
- Human corrected proof layer: keep
- Human corrected eval surface: keep
- Human readiness: keep
- Human priority: TODO
- Duplicate of:
- Notes:

### 140 claim-docs-contracts-claim-discovery-workflow-md-257
<!-- claim-id: claim-docs-contracts-claim-discovery-workflow-md-257 -->
- Source: docs/contracts/claim-discovery-workflow.md:257
- Summary: The binary can do cheap deterministic preflight, but the skill owns final interpretation.
- Excerpt: The binary can do cheap deterministic preflight, but the skill owns final interpretation.
- Current labels: proofLayer=deterministic; recommendedProof=deterministic; recommendedEvalSurface=n/a; readiness=ready-to-verify; reviewStatus=heuristic; evidenceStatus=unknown
- Group hints: deterministic, contract, linked-from:docs/master-plan.md
- Current next action: Keep or add a repo-owned unit, lint, build, schema, or CI check for this claim.
- Why this layer: The claim names a deterministic gate or static contract that should be protected outside Cautilus eval.
- Human claim quality: TODO
- Human corrected proof layer: keep
- Human corrected eval surface: keep
- Human readiness: keep
- Human priority: TODO
- Duplicate of:
- Notes:

### 141 claim-docs-contracts-claim-discovery-workflow-md-270
<!-- claim-id: claim-docs-contracts-claim-discovery-workflow-md-270 -->
- Source: docs/contracts/claim-discovery-workflow.md:270
- Summary: The skill review can upgrade them to `satisfied`, `partial`, `stale`, or `missing` only when the packet semantics above are met.
- Excerpt: The skill review can upgrade them to `satisfied`, `partial`, `stale`, or `missing` only when the packet semantics above are met.
- Current labels: proofLayer=cautilus-eval; recommendedProof=cautilus-eval; recommendedEvalSurface=dev/skill; readiness=ready-to-verify; reviewStatus=heuristic; evidenceStatus=unknown
- Group hints: cautilus-eval, contract, dev/skill, linked-from:docs/master-plan.md
- Current next action: Create a host-owned dev/skill fixture and run it through cautilus eval test.
- Why this layer: The claim depends on model, agent, prompt, skill, workflow, or behavior execution evidence.
- Human claim quality: TODO
- Human corrected proof layer: keep
- Human corrected eval surface: keep
- Human readiness: keep
- Human priority: TODO
- Duplicate of:
- Notes:

### 142 claim-docs-contracts-claim-discovery-workflow-md-273
<!-- claim-id: claim-docs-contracts-claim-discovery-workflow-md-273 -->
- Source: docs/contracts/claim-discovery-workflow.md:273
- Summary: `unknown` should be used when the workflow did not inspect enough evidence to make an honest statement.
- Excerpt: `unknown` should be used when the workflow did not inspect enough evidence to make an honest statement.
- Current labels: proofLayer=cautilus-eval; recommendedProof=cautilus-eval; recommendedEvalSurface=dev/repo; readiness=ready-to-verify; reviewStatus=heuristic; evidenceStatus=unknown
- Group hints: cautilus-eval, contract, dev/repo, linked-from:docs/master-plan.md
- Current next action: Create a host-owned dev/repo fixture and run it through cautilus eval test.
- Why this layer: The claim depends on model, agent, prompt, skill, workflow, or behavior execution evidence.
- Human claim quality: TODO
- Human corrected proof layer: keep
- Human corrected eval surface: keep
- Human readiness: keep
- Human priority: TODO
- Duplicate of:
- Notes:

### 143 claim-docs-contracts-claim-discovery-workflow-md-277
<!-- claim-id: claim-docs-contracts-claim-discovery-workflow-md-277 -->
- Source: docs/contracts/claim-discovery-workflow.md:277
- Summary: The workflow should not send every raw candidate to an LLM independently.
- Excerpt: The workflow should not send every raw candidate to an LLM independently.
- Current labels: proofLayer=scenario-candidate; recommendedProof=cautilus-eval; recommendedEvalSurface=n/a; readiness=needs-scenario; reviewStatus=heuristic; evidenceStatus=unknown
- Group hints: cautilus-eval, contract, needs-scenario, linked-from:docs/master-plan.md
- Current next action: Use the scenario proposal flow to normalize candidate evidence before creating a checked-in eval fixture.
- Why this layer: The claim points at scenario or proposal work before it is ready as a protected eval fixture.
- Human claim quality: TODO
- Human corrected proof layer: keep
- Human corrected eval surface: keep
- Human readiness: keep
- Human priority: TODO
- Duplicate of:
- Notes:

### 144 claim-docs-contracts-claim-discovery-workflow-md-278
<!-- claim-id: claim-docs-contracts-claim-discovery-workflow-md-278 -->
- Source: docs/contracts/claim-discovery-workflow.md:278
- Summary: The deterministic pass should emit grouping hints:
- Excerpt: The deterministic pass should emit grouping hints:
- Current labels: proofLayer=deterministic; recommendedProof=deterministic; recommendedEvalSurface=n/a; readiness=ready-to-verify; reviewStatus=heuristic; evidenceStatus=unknown
- Group hints: deterministic, contract, linked-from:docs/master-plan.md
- Current next action: Keep or add a repo-owned unit, lint, build, schema, or CI check for this claim.
- Why this layer: The claim names a deterministic gate or static contract that should be protected outside Cautilus eval.
- Human claim quality: TODO
- Human corrected proof layer: keep
- Human corrected eval surface: keep
- Human readiness: keep
- Human priority: TODO
- Duplicate of:
- Notes:

### 145 claim-docs-contracts-claim-discovery-workflow-md-287
<!-- claim-id: claim-docs-contracts-claim-discovery-workflow-md-287 -->
- Source: docs/contracts/claim-discovery-workflow.md:287
- Summary: The skill should review clusters in priority order:
- Excerpt: The skill should review clusters in priority order:
- Current labels: proofLayer=cautilus-eval; recommendedProof=cautilus-eval; recommendedEvalSurface=dev/skill; readiness=ready-to-verify; reviewStatus=heuristic; evidenceStatus=unknown
- Group hints: cautilus-eval, contract, dev/skill, linked-from:docs/master-plan.md
- Current next action: Create a host-owned dev/skill fixture and run it through cautilus eval test.
- Why this layer: The claim depends on model, agent, prompt, skill, workflow, or behavior execution evidence.
- Human claim quality: TODO
- Human corrected proof layer: keep
- Human corrected eval surface: keep
- Human readiness: keep
- Human priority: TODO
- Duplicate of:
- Notes:

### 146 claim-docs-contracts-claim-discovery-workflow-md-296
<!-- claim-id: claim-docs-contracts-claim-discovery-workflow-md-296 -->
- Source: docs/contracts/claim-discovery-workflow.md:296
- Summary: Subagents should receive clusters with source excerpts, source refs, candidate labels, possible evidence refs, and a bounded output schema.
- Excerpt: Subagents should receive clusters with source excerpts, source refs, candidate labels, possible evidence refs, and a bounded output schema.
- Current labels: proofLayer=scenario-candidate; recommendedProof=cautilus-eval; recommendedEvalSurface=n/a; readiness=needs-scenario; reviewStatus=heuristic; evidenceStatus=unknown
- Group hints: cautilus-eval, contract, needs-scenario, linked-from:docs/master-plan.md
- Current next action: Use the scenario proposal flow to normalize candidate evidence before creating a checked-in eval fixture.
- Why this layer: The claim points at scenario or proposal work before it is ready as a protected eval fixture.
- Human claim quality: TODO
- Human corrected proof layer: keep
- Human corrected eval surface: keep
- Human readiness: keep
- Human priority: TODO
- Duplicate of:
- Notes:

### 147 claim-docs-contracts-claim-discovery-workflow-md-298
<!-- claim-id: claim-docs-contracts-claim-discovery-workflow-md-298 -->
- Source: docs/contracts/claim-discovery-workflow.md:298
- Summary: The parent skill should merge results and keep review provenance in the packet.
- Excerpt: The parent skill should merge results and keep review provenance in the packet.
- Current labels: proofLayer=cautilus-eval; recommendedProof=cautilus-eval; recommendedEvalSurface=dev/skill; readiness=ready-to-verify; reviewStatus=heuristic; evidenceStatus=unknown
- Group hints: cautilus-eval, contract, dev/skill, linked-from:docs/master-plan.md
- Current next action: Create a host-owned dev/skill fixture and run it through cautilus eval test.
- Why this layer: The claim depends on model, agent, prompt, skill, workflow, or behavior execution evidence.
- Human claim quality: TODO
- Human corrected proof layer: keep
- Human corrected eval surface: keep
- Human readiness: keep
- Human priority: TODO
- Duplicate of:
- Notes:

### 148 claim-docs-contracts-claim-discovery-workflow-md-300
<!-- claim-id: claim-docs-contracts-claim-discovery-workflow-md-300 -->
- Source: docs/contracts/claim-discovery-workflow.md:300
- Summary: The LLM review seam should use versioned packets instead of hidden prompt-only behavior:
- Excerpt: The LLM review seam should use versioned packets instead of hidden prompt-only behavior:
- Current labels: proofLayer=cautilus-eval; recommendedProof=cautilus-eval; recommendedEvalSurface=app/prompt; readiness=ready-to-verify; reviewStatus=heuristic; evidenceStatus=unknown
- Group hints: cautilus-eval, contract, app/prompt, linked-from:docs/master-plan.md
- Current next action: Create a host-owned app/prompt fixture and run it through cautilus eval test.
- Why this layer: The claim depends on model, agent, prompt, skill, workflow, or behavior execution evidence.
- Human claim quality: TODO
- Human corrected proof layer: keep
- Human corrected eval surface: keep
- Human readiness: keep
- Human priority: TODO
- Duplicate of:
- Notes:

### 149 claim-docs-contracts-claim-discovery-workflow-md-305
<!-- claim-id: claim-docs-contracts-claim-discovery-workflow-md-305 -->
- Source: docs/contracts/claim-discovery-workflow.md:305
- Summary: Those packets should record cluster IDs, candidate IDs, source refs, prompt/reference hashes, runtime/model identity when available, merge decisions, label changes, evidence-status reasons, unresolved questions, and skipped clusters.
- Excerpt: Those packets should record cluster IDs, candidate IDs, source refs, prompt/reference hashes, runtime/model identity when available, merge decisions, label changes, evidence-status reasons, unresolved questions, and skipped clusters.
- Current labels: proofLayer=scenario-candidate; recommendedProof=cautilus-eval; recommendedEvalSurface=n/a; readiness=needs-scenario; reviewStatus=heuristic; evidenceStatus=unknown
- Group hints: cautilus-eval, contract, needs-scenario, linked-from:docs/master-plan.md
- Current next action: Use the scenario proposal flow to normalize candidate evidence before creating a checked-in eval fixture.
- Why this layer: The claim points at scenario or proposal work before it is ready as a protected eval fixture.
- Human claim quality: TODO
- Human corrected proof layer: keep
- Human corrected eval surface: keep
- Human readiness: keep
- Human priority: TODO
- Duplicate of:
- Notes:

### 150 claim-docs-contracts-claim-discovery-workflow-md-355
<!-- claim-id: claim-docs-contracts-claim-discovery-workflow-md-355 -->
- Source: docs/contracts/claim-discovery-workflow.md:355
- Summary: The binary may provide helper flags such as `claim discover --previous <packet> --refresh-plan`, but the public user-level workflow remains `discover`.
- Excerpt: The binary may provide helper flags such as `claim discover --previous <packet> --refresh-plan`, but the public user-level workflow remains `discover`.
- Current labels: proofLayer=cautilus-eval; recommendedProof=cautilus-eval; recommendedEvalSurface=dev/repo; readiness=ready-to-verify; reviewStatus=heuristic; evidenceStatus=unknown
- Group hints: cautilus-eval, contract, dev/repo, linked-from:docs/master-plan.md
- Current next action: Create a host-owned dev/repo fixture and run it through cautilus eval test.
- Why this layer: The claim depends on model, agent, prompt, skill, workflow, or behavior execution evidence.
- Human claim quality: TODO
- Human corrected proof layer: keep
- Human corrected eval surface: keep
- Human readiness: keep
- Human priority: TODO
- Duplicate of:
- Notes:

### 151 claim-docs-contracts-claim-discovery-workflow-md-358
<!-- claim-id: claim-docs-contracts-claim-discovery-workflow-md-358 -->
- Source: docs/contracts/claim-discovery-workflow.md:358
- Summary: The refresh-plan packet should include a coordinator-facing summary rather than requiring every agent to reverse-engineer raw JSON fields:
- Excerpt: The refresh-plan packet should include a coordinator-facing summary rather than requiring every agent to reverse-engineer raw JSON fields:
- Current labels: proofLayer=cautilus-eval; recommendedProof=cautilus-eval; recommendedEvalSurface=dev/repo; readiness=ready-to-verify; reviewStatus=heuristic; evidenceStatus=unknown
- Group hints: cautilus-eval, contract, dev/repo, linked-from:docs/master-plan.md
- Current next action: Create a host-owned dev/repo fixture and run it through cautilus eval test.
- Why this layer: The claim depends on model, agent, prompt, skill, workflow, or behavior execution evidence.
- Human claim quality: TODO
- Human corrected proof layer: keep
- Human corrected eval surface: keep
- Human readiness: keep
- Human priority: TODO
- Duplicate of:
- Notes:

### 152 claim-docs-contracts-claim-discovery-workflow-md-373
<!-- claim-id: claim-docs-contracts-claim-discovery-workflow-md-373 -->
- Source: docs/contracts/claim-discovery-workflow.md:373
- Summary: After discovery or refresh, the skill should report status in a compact decision-oriented shape:
- Excerpt: After discovery or refresh, the skill should report status in a compact decision-oriented shape:
- Current labels: proofLayer=cautilus-eval; recommendedProof=cautilus-eval; recommendedEvalSurface=dev/skill; readiness=ready-to-verify; reviewStatus=heuristic; evidenceStatus=unknown
- Group hints: cautilus-eval, contract, dev/skill, linked-from:docs/master-plan.md
- Current next action: Create a host-owned dev/skill fixture and run it through cautilus eval test.
- Why this layer: The claim depends on model, agent, prompt, skill, workflow, or behavior execution evidence.
- Human claim quality: TODO
- Human corrected proof layer: keep
- Human corrected eval surface: keep
- Human readiness: keep
- Human priority: TODO
- Duplicate of:
- Notes:

### 153 claim-docs-contracts-claim-discovery-workflow-md-397
<!-- claim-id: claim-docs-contracts-claim-discovery-workflow-md-397 -->
- Source: docs/contracts/claim-discovery-workflow.md:397
- Summary: The skill should then ask the user which branch to take.
- Excerpt: The skill should then ask the user which branch to take.
- Current labels: proofLayer=cautilus-eval; recommendedProof=cautilus-eval; recommendedEvalSurface=dev/skill; readiness=ready-to-verify; reviewStatus=heuristic; evidenceStatus=unknown
- Group hints: cautilus-eval, contract, dev/skill, linked-from:docs/master-plan.md
- Current next action: Create a host-owned dev/skill fixture and run it through cautilus eval test.
- Why this layer: The claim depends on model, agent, prompt, skill, workflow, or behavior execution evidence.
- Human claim quality: TODO
- Human corrected proof layer: keep
- Human corrected eval surface: keep
- Human readiness: keep
- Human priority: TODO
- Duplicate of:
- Notes:

### 154 claim-docs-contracts-claim-discovery-workflow-md-400
<!-- claim-id: claim-docs-contracts-claim-discovery-workflow-md-400 -->
- Source: docs/contracts/claim-discovery-workflow.md:400
- Summary: The skill should not automatically launch expensive evaluator runs or broad code edits after status unless the user has already delegated that continuation and the recorded budget covers it.
- Excerpt: The skill should not automatically launch expensive evaluator runs or broad code edits after status unless the user has already delegated that continuation and the recorded budget covers it.
- Current labels: proofLayer=cautilus-eval; recommendedProof=cautilus-eval; recommendedEvalSurface=dev/skill; readiness=ready-to-verify; reviewStatus=heuristic; evidenceStatus=unknown
- Group hints: cautilus-eval, contract, dev/skill, linked-from:docs/master-plan.md
- Current next action: Create a host-owned dev/skill fixture and run it through cautilus eval test.
- Why this layer: The claim depends on model, agent, prompt, skill, workflow, or behavior execution evidence.
- Human claim quality: TODO
- Human corrected proof layer: keep
- Human corrected eval surface: keep
- Human readiness: keep
- Human priority: TODO
- Duplicate of:
- Notes:

### 155 claim-docs-contracts-claim-discovery-workflow-md-404
<!-- claim-id: claim-docs-contracts-claim-discovery-workflow-md-404 -->
- Source: docs/contracts/claim-discovery-workflow.md:404
- Summary: The workflow should avoid a `claim group` command.
- Excerpt: The workflow should avoid a `claim group` command.
- Current labels: proofLayer=cautilus-eval; recommendedProof=cautilus-eval; recommendedEvalSurface=dev/repo; readiness=ready-to-verify; reviewStatus=heuristic; evidenceStatus=unknown
- Group hints: cautilus-eval, contract, dev/repo, linked-from:docs/master-plan.md
- Current next action: Create a host-owned dev/repo fixture and run it through cautilus eval test.
- Why this layer: The claim depends on model, agent, prompt, skill, workflow, or behavior execution evidence.
- Human claim quality: TODO
- Human corrected proof layer: keep
- Human corrected eval surface: keep
- Human readiness: keep
- Human priority: TODO
- Duplicate of:
- Notes:

### 156 claim-docs-contracts-claim-discovery-workflow-md-425
<!-- claim-id: claim-docs-contracts-claim-discovery-workflow-md-425 -->
- Source: docs/contracts/claim-discovery-workflow.md:425
- Summary: Scan confirmation and LLM review confirmation must be separate.
- Excerpt: Scan confirmation and LLM review confirmation must be separate.
- Current labels: proofLayer=cautilus-eval; recommendedProof=cautilus-eval; recommendedEvalSurface=dev/repo; readiness=ready-to-verify; reviewStatus=heuristic; evidenceStatus=unknown
- Group hints: cautilus-eval, contract, dev/repo, linked-from:docs/master-plan.md
- Current next action: Create a host-owned dev/repo fixture and run it through cautilus eval test.
- Why this layer: The claim depends on model, agent, prompt, skill, workflow, or behavior execution evidence.
- Human claim quality: TODO
- Human corrected proof layer: keep
- Human corrected eval surface: keep
- Human readiness: keep
- Human priority: TODO
- Duplicate of:
- Notes:

### 157 claim-docs-contracts-claim-discovery-workflow-md-427
<!-- claim-id: claim-docs-contracts-claim-discovery-workflow-md-427 -->
- Source: docs/contracts/claim-discovery-workflow.md:427
- Summary: Depth 3 must be paired with visible source, candidate, cluster, and review-budget bounds.
- Excerpt: Depth 3 must be paired with visible source, candidate, cluster, and review-budget bounds.
- Current labels: proofLayer=scenario-candidate; recommendedProof=cautilus-eval; recommendedEvalSurface=n/a; readiness=needs-scenario; reviewStatus=heuristic; evidenceStatus=unknown
- Group hints: cautilus-eval, contract, needs-scenario, linked-from:docs/master-plan.md
- Current next action: Use the scenario proposal flow to normalize candidate evidence before creating a checked-in eval fixture.
- Why this layer: The claim points at scenario or proposal work before it is ready as a protected eval fixture.
- Human claim quality: TODO
- Human corrected proof layer: keep
- Human corrected eval surface: keep
- Human readiness: keep
- Human priority: TODO
- Duplicate of:
- Notes:

### 158 claim-docs-contracts-claim-discovery-workflow-md-430
<!-- claim-id: claim-docs-contracts-claim-discovery-workflow-md-430 -->
- Source: docs/contracts/claim-discovery-workflow.md:430
- Summary: The skill may select refresh, but deterministic refresh-plan output must record baseline commit, target policy, changed sources, carried-forward claims, stale evidence reasons, and dirty-working-tree treatment.
- Excerpt: The skill may select refresh, but deterministic refresh-plan output must record baseline commit, target policy, changed sources, carried-forward claims, stale evidence reasons, and dirty-working-tree treatment.
- Current labels: proofLayer=deterministic; recommendedProof=deterministic; recommendedEvalSurface=n/a; readiness=ready-to-verify; reviewStatus=heuristic; evidenceStatus=unknown
- Group hints: deterministic, contract, linked-from:docs/master-plan.md
- Current next action: Keep or add a repo-owned unit, lint, build, schema, or CI check for this claim.
- Why this layer: The claim names a deterministic gate or static contract that should be protected outside Cautilus eval.
- Human claim quality: TODO
- Human corrected proof layer: keep
- Human corrected eval surface: keep
- Human readiness: keep
- Human priority: TODO
- Duplicate of:
- Notes:

### 159 claim-docs-contracts-claim-discovery-workflow-md-448
<!-- claim-id: claim-docs-contracts-claim-discovery-workflow-md-448 -->
- Source: docs/contracts/claim-discovery-workflow.md:448
- Summary: Helper flags under `claim discover` are enough if the skill keeps the user-facing action as discover.
- Excerpt: Helper flags under `claim discover` are enough if the skill keeps the user-facing action as discover.
- Current labels: proofLayer=cautilus-eval; recommendedProof=cautilus-eval; recommendedEvalSurface=dev/skill; readiness=ready-to-verify; reviewStatus=heuristic; evidenceStatus=unknown
- Group hints: cautilus-eval, contract, dev/skill, linked-from:docs/master-plan.md
- Current next action: Create a host-owned dev/skill fixture and run it through cautilus eval test.
- Why this layer: The claim depends on model, agent, prompt, skill, workflow, or behavior execution evidence.
- Human claim quality: TODO
- Human corrected proof layer: keep
- Human corrected eval surface: keep
- Human readiness: keep
- Human priority: TODO
- Duplicate of:
- Notes:

### 160 claim-docs-contracts-claim-discovery-workflow-md-449
<!-- claim-id: claim-docs-contracts-claim-discovery-workflow-md-449 -->
- Source: docs/contracts/claim-discovery-workflow.md:449
- Summary: LLM extraction should not move into the binary.
- Excerpt: LLM extraction should not move into the binary.
- Current labels: proofLayer=cautilus-eval; recommendedProof=cautilus-eval; recommendedEvalSurface=dev/repo; readiness=ready-to-verify; reviewStatus=heuristic; evidenceStatus=unknown
- Group hints: cautilus-eval, contract, dev/repo, linked-from:docs/master-plan.md
- Current next action: Create a host-owned dev/repo fixture and run it through cautilus eval test.
- Why this layer: The claim depends on model, agent, prompt, skill, workflow, or behavior execution evidence.
- Human claim quality: TODO
- Human corrected proof layer: keep
- Human corrected eval surface: keep
- Human readiness: keep
- Human priority: TODO
- Duplicate of:
- Notes:

### 161 claim-docs-contracts-claim-discovery-workflow-md-450
<!-- claim-id: claim-docs-contracts-claim-discovery-workflow-md-450 -->
- Source: docs/contracts/claim-discovery-workflow.md:450
- Summary: The binary stays deterministic and provider-neutral.
- Excerpt: The binary stays deterministic and provider-neutral.
- Current labels: proofLayer=deterministic; recommendedProof=deterministic; recommendedEvalSurface=n/a; readiness=ready-to-verify; reviewStatus=heuristic; evidenceStatus=unknown
- Group hints: deterministic, contract, linked-from:docs/master-plan.md
- Current next action: Keep or add a repo-owned unit, lint, build, schema, or CI check for this claim.
- Why this layer: The claim names a deterministic gate or static contract that should be protected outside Cautilus eval.
- Human claim quality: TODO
- Human corrected proof layer: keep
- Human corrected eval surface: keep
- Human readiness: keep
- Human priority: TODO
- Duplicate of:
- Notes:

### 162 claim-docs-contracts-claim-discovery-workflow-md-455
<!-- claim-id: claim-docs-contracts-claim-discovery-workflow-md-455 -->
- Source: docs/contracts/claim-discovery-workflow.md:455
- Summary: Perfect subagent batch sizing should wait until the deterministic packet and skill control flow are dogfooded.
- Excerpt: Perfect subagent batch sizing should wait until the deterministic packet and skill control flow are dogfooded.
- Current labels: proofLayer=deterministic; recommendedProof=deterministic; recommendedEvalSurface=n/a; readiness=ready-to-verify; reviewStatus=heuristic; evidenceStatus=unknown
- Group hints: deterministic, contract, linked-from:docs/master-plan.md
- Current next action: Keep or add a repo-owned unit, lint, build, schema, or CI check for this claim.
- Why this layer: The claim names a deterministic gate or static contract that should be protected outside Cautilus eval.
- Human claim quality: TODO
- Human corrected proof layer: keep
- Human corrected eval surface: keep
- Human readiness: keep
- Human priority: TODO
- Duplicate of:
- Notes:

### 163 claim-docs-contracts-claim-discovery-workflow-md-461
<!-- claim-id: claim-docs-contracts-claim-discovery-workflow-md-461 -->
- Source: docs/contracts/claim-discovery-workflow.md:461
- Summary: The binary remains deterministic and does not directly call an LLM.
- Excerpt: The binary remains deterministic and does not directly call an LLM.
- Current labels: proofLayer=deterministic; recommendedProof=deterministic; recommendedEvalSurface=n/a; readiness=ready-to-verify; reviewStatus=heuristic; evidenceStatus=unknown
- Group hints: deterministic, contract, linked-from:docs/master-plan.md
- Current next action: Keep or add a repo-owned unit, lint, build, schema, or CI check for this claim.
- Why this layer: The claim names a deterministic gate or static contract that should be protected outside Cautilus eval.
- Human claim quality: TODO
- Human corrected proof layer: keep
- Human corrected eval surface: keep
- Human readiness: keep
- Human priority: TODO
- Duplicate of:
- Notes:

### 164 claim-docs-contracts-claim-discovery-workflow-md-462
<!-- claim-id: claim-docs-contracts-claim-discovery-workflow-md-462 -->
- Source: docs/contracts/claim-discovery-workflow.md:462
- Summary: The bundled skill owns LLM review and subagent orchestration.
- Excerpt: The bundled skill owns LLM review and subagent orchestration.
- Current labels: proofLayer=cautilus-eval; recommendedProof=cautilus-eval; recommendedEvalSurface=dev/skill; readiness=ready-to-verify; reviewStatus=heuristic; evidenceStatus=unknown
- Group hints: cautilus-eval, contract, dev/skill, linked-from:docs/master-plan.md
- Current next action: Create a host-owned dev/skill fixture and run it through cautilus eval test.
- Why this layer: The claim depends on model, agent, prompt, skill, workflow, or behavior execution evidence.
- Human claim quality: TODO
- Human corrected proof layer: keep
- Human corrected eval surface: keep
- Human readiness: keep
- Human priority: TODO
- Duplicate of:
- Notes:

### 165 claim-docs-contracts-claim-discovery-workflow-md-467
<!-- claim-id: claim-docs-contracts-claim-discovery-workflow-md-467 -->
- Source: docs/contracts/claim-discovery-workflow.md:467
- Summary: Existing state refresh is selected by the skill when prior claim JSON exists, but deterministic refresh-plan output owns the state transition.
- Excerpt: Existing state refresh is selected by the skill when prior claim JSON exists, but deterministic refresh-plan output owns the state transition.
- Current labels: proofLayer=deterministic; recommendedProof=deterministic; recommendedEvalSurface=n/a; readiness=ready-to-verify; reviewStatus=heuristic; evidenceStatus=unknown
- Group hints: deterministic, contract, linked-from:docs/master-plan.md
- Current next action: Keep or add a repo-owned unit, lint, build, schema, or CI check for this claim.
- Why this layer: The claim names a deterministic gate or static contract that should be protected outside Cautilus eval.
- Human claim quality: TODO
- Human corrected proof layer: keep
- Human corrected eval surface: keep
- Human readiness: keep
- Human priority: TODO
- Duplicate of:
- Notes:

### 166 claim-docs-contracts-claim-discovery-workflow-md-475
<!-- claim-id: claim-docs-contracts-claim-discovery-workflow-md-475 -->
- Source: docs/contracts/claim-discovery-workflow.md:475
- Summary: How much deterministic evidence preflight should the binary do before it risks false satisfaction?
- Excerpt: How much deterministic evidence preflight should the binary do before it risks false satisfaction?
- Current labels: proofLayer=deterministic; recommendedProof=deterministic; recommendedEvalSurface=n/a; readiness=ready-to-verify; reviewStatus=heuristic; evidenceStatus=unknown
- Group hints: deterministic, contract, linked-from:docs/master-plan.md
- Current next action: Keep or add a repo-owned unit, lint, build, schema, or CI check for this claim.
- Why this layer: The claim names a deterministic gate or static contract that should be protected outside Cautilus eval.
- Human claim quality: TODO
- Human corrected proof layer: keep
- Human corrected eval surface: keep
- Human readiness: keep
- Human priority: TODO
- Duplicate of:
- Notes:

### 167 claim-docs-contracts-claim-discovery-workflow-md-476
<!-- claim-id: claim-docs-contracts-claim-discovery-workflow-md-476 -->
- Source: docs/contracts/claim-discovery-workflow.md:476
- Summary: What subagent batch size and cluster shape keeps review cost bounded on repos with hundreds of raw candidates?
- Excerpt: What subagent batch size and cluster shape keeps review cost bounded on repos with hundreds of raw candidates?
- Current labels: proofLayer=scenario-candidate; recommendedProof=cautilus-eval; recommendedEvalSurface=n/a; readiness=needs-scenario; reviewStatus=heuristic; evidenceStatus=unknown
- Group hints: cautilus-eval, contract, needs-scenario, linked-from:docs/master-plan.md
- Current next action: Use the scenario proposal flow to normalize candidate evidence before creating a checked-in eval fixture.
- Why this layer: The claim points at scenario or proposal work before it is ready as a protected eval fixture.
- Human claim quality: TODO
- Human corrected proof layer: keep
- Human corrected eval surface: keep
- Human readiness: keep
- Human priority: TODO
- Duplicate of:
- Notes:

### 168 claim-docs-contracts-claim-discovery-workflow-md-478
<!-- claim-id: claim-docs-contracts-claim-discovery-workflow-md-478 -->
- Source: docs/contracts/claim-discovery-workflow.md:478
- Summary: How much of the refresh-plan helper should ship in the first binary slice versus the first skill slice?
- Excerpt: How much of the refresh-plan helper should ship in the first binary slice versus the first skill slice?
- Current labels: proofLayer=cautilus-eval; recommendedProof=cautilus-eval; recommendedEvalSurface=dev/skill; readiness=ready-to-verify; reviewStatus=heuristic; evidenceStatus=unknown
- Group hints: cautilus-eval, contract, dev/skill, linked-from:docs/master-plan.md
- Current next action: Create a host-owned dev/skill fixture and run it through cautilus eval test.
- Why this layer: The claim depends on model, agent, prompt, skill, workflow, or behavior execution evidence.
- Human claim quality: TODO
- Human corrected proof layer: keep
- Human corrected eval surface: keep
- Human readiness: keep
- Human priority: TODO
- Duplicate of:
- Notes:

### 169 claim-docs-contracts-claim-discovery-workflow-md-484
<!-- claim-id: claim-docs-contracts-claim-discovery-workflow-md-484 -->
- Source: docs/contracts/claim-discovery-workflow.md:484
- Summary: Whether model-backed extraction should ever become a binary runner behind an explicit provider contract.
- Excerpt: Whether model-backed extraction should ever become a binary runner behind an explicit provider contract.
- Current labels: proofLayer=cautilus-eval; recommendedProof=cautilus-eval; recommendedEvalSurface=dev/repo; readiness=ready-to-verify; reviewStatus=heuristic; evidenceStatus=unknown
- Group hints: cautilus-eval, contract, dev/repo, linked-from:docs/master-plan.md
- Current next action: Create a host-owned dev/repo fixture and run it through cautilus eval test.
- Why this layer: The claim depends on model, agent, prompt, skill, workflow, or behavior execution evidence.
- Human claim quality: TODO
- Human corrected proof layer: keep
- Human corrected eval surface: keep
- Human readiness: keep
- Human priority: TODO
- Duplicate of:
- Notes:

### 170 claim-docs-contracts-claim-discovery-workflow-md-498
<!-- claim-id: claim-docs-contracts-claim-discovery-workflow-md-498 -->
- Source: docs/contracts/claim-discovery-workflow.md:498
- Summary: A user can invoke the Cautilus skill without detailed input and get a clear status summary rather than a raw 500-claim dump.
- Excerpt: A user can invoke the Cautilus skill without detailed input and get a clear status summary rather than a raw 500-claim dump.
- Current labels: proofLayer=cautilus-eval; recommendedProof=cautilus-eval; recommendedEvalSurface=dev/skill; readiness=ready-to-verify; reviewStatus=heuristic; evidenceStatus=unknown
- Group hints: cautilus-eval, contract, dev/skill, linked-from:docs/master-plan.md
- Current next action: Create a host-owned dev/skill fixture and run it through cautilus eval test.
- Why this layer: The claim depends on model, agent, prompt, skill, workflow, or behavior execution evidence.
- Human claim quality: TODO
- Human corrected proof layer: keep
- Human corrected eval surface: keep
- Human readiness: keep
- Human priority: TODO
- Duplicate of:
- Notes:

### 171 claim-docs-contracts-claim-discovery-workflow-md-503
<!-- claim-id: claim-docs-contracts-claim-discovery-workflow-md-503 -->
- Source: docs/contracts/claim-discovery-workflow.md:503
- Summary: The workflow can say which claims already have deterministic or Cautilus evidence, and which still need scenarios, tests, or alignment work.
- Excerpt: The workflow can say which claims already have deterministic or Cautilus evidence, and which still need scenarios, tests, or alignment work.
- Current labels: proofLayer=deterministic; recommendedProof=deterministic; recommendedEvalSurface=n/a; readiness=ready-to-verify; reviewStatus=heuristic; evidenceStatus=unknown
- Group hints: deterministic, contract, linked-from:docs/master-plan.md
- Current next action: Keep or add a repo-owned unit, lint, build, schema, or CI check for this claim.
- Why this layer: The claim names a deterministic gate or static contract that should be protected outside Cautilus eval.
- Human claim quality: TODO
- Human corrected proof layer: keep
- Human corrected eval surface: keep
- Human readiness: keep
- Human priority: TODO
- Duplicate of:
- Notes:

### 172 claim-docs-contracts-claim-discovery-workflow-md-504
<!-- claim-id: claim-docs-contracts-claim-discovery-workflow-md-504 -->
- Source: docs/contracts/claim-discovery-workflow.md:504
- Summary: The binary/skill boundary stays clean enough that consumer repos can use the binary plus bundled skill without Cautilus importing host-specific prompts or adapters.
- Excerpt: The binary/skill boundary stays clean enough that consumer repos can use the binary plus bundled skill without Cautilus importing host-specific prompts or adapters.
- Current labels: proofLayer=cautilus-eval; recommendedProof=cautilus-eval; recommendedEvalSurface=app/prompt; readiness=ready-to-verify; reviewStatus=heuristic; evidenceStatus=unknown
- Group hints: cautilus-eval, contract, app/prompt, linked-from:docs/master-plan.md
- Current next action: Create a host-owned app/prompt fixture and run it through cautilus eval test.
- Why this layer: The claim depends on model, agent, prompt, skill, workflow, or behavior execution evidence.
- Human claim quality: TODO
- Human corrected proof layer: keep
- Human corrected eval surface: keep
- Human readiness: keep
- Human priority: TODO
- Duplicate of:
- Notes:

### 173 claim-docs-contracts-claim-discovery-workflow-md-529
<!-- claim-id: claim-docs-contracts-claim-discovery-workflow-md-529 -->
- Source: docs/contracts/claim-discovery-workflow.md:529
- Summary: The binary should remain deterministic and provider-neutral.
- Excerpt: The binary should remain deterministic and provider-neutral.
- Current labels: proofLayer=deterministic; recommendedProof=deterministic; recommendedEvalSurface=n/a; readiness=ready-to-verify; reviewStatus=heuristic; evidenceStatus=unknown
- Group hints: deterministic, contract, linked-from:docs/master-plan.md
- Current next action: Keep or add a repo-owned unit, lint, build, schema, or CI check for this claim.
- Why this layer: The claim names a deterministic gate or static contract that should be protected outside Cautilus eval.
- Human claim quality: TODO
- Human corrected proof layer: keep
- Human corrected eval surface: keep
- Human readiness: keep
- Human priority: TODO
- Duplicate of:
- Notes:

### 174 claim-docs-contracts-claim-discovery-workflow-md-555
<!-- claim-id: claim-docs-contracts-claim-discovery-workflow-md-555 -->
- Source: docs/contracts/claim-discovery-workflow.md:555
- Summary: LLM-backed cluster review should come after the deterministic packet and skill control flow are stable enough to dogfood.
- Excerpt: LLM-backed cluster review should come after the deterministic packet and skill control flow are stable enough to dogfood.
- Current labels: proofLayer=deterministic; recommendedProof=deterministic; recommendedEvalSurface=n/a; readiness=ready-to-verify; reviewStatus=heuristic; evidenceStatus=unknown
- Group hints: deterministic, contract, linked-from:docs/master-plan.md
- Current next action: Keep or add a repo-owned unit, lint, build, schema, or CI check for this claim.
- Why this layer: The claim names a deterministic gate or static contract that should be protected outside Cautilus eval.
- Human claim quality: TODO
- Human corrected proof layer: keep
- Human corrected eval surface: keep
- Human readiness: keep
- Human priority: TODO
- Duplicate of:
- Notes:

### 175 claim-docs-contracts-claim-discovery-workflow-md-557
<!-- claim-id: claim-docs-contracts-claim-discovery-workflow-md-557 -->
- Source: docs/contracts/claim-discovery-workflow.md:557
- Summary: `claim show` emits `cautilus.claim_status_summary.v1` and can include bounded `sampleClaims` plus `gitState` for agents that need concrete candidates before choosing the next branch.
- Excerpt: `claim show` emits `cautilus.claim_status_summary.v1` and can include bounded `sampleClaims` plus `gitState` for agents that need concrete candidates before choosing the next branch.
- Current labels: proofLayer=scenario-candidate; recommendedProof=cautilus-eval; recommendedEvalSurface=n/a; readiness=needs-scenario; reviewStatus=heuristic; evidenceStatus=unknown
- Group hints: cautilus-eval, contract, needs-scenario, linked-from:docs/master-plan.md
- Current next action: Use the scenario proposal flow to normalize candidate evidence before creating a checked-in eval fixture.
- Why this layer: The claim points at scenario or proposal work before it is ready as a protected eval fixture.
- Human claim quality: TODO
- Human corrected proof layer: keep
- Human corrected eval surface: keep
- Human readiness: keep
- Human priority: TODO
- Duplicate of:
- Notes:

### 176 claim-docs-contracts-claim-discovery-workflow-md-558
<!-- claim-id: claim-docs-contracts-claim-discovery-workflow-md-558 -->
- Source: docs/contracts/claim-discovery-workflow.md:558
- Summary: `claim review prepare-input` emits `cautilus.claim_review_input.v1` and records bounded clusters and skipped clusters, but still does not call an LLM or merge review results.
- Excerpt: `claim review prepare-input` emits `cautilus.claim_review_input.v1` and records bounded clusters and skipped clusters, but still does not call an LLM or merge review results.
- Current labels: proofLayer=cautilus-eval; recommendedProof=cautilus-eval; recommendedEvalSurface=dev/repo; readiness=ready-to-verify; reviewStatus=heuristic; evidenceStatus=unknown
- Group hints: cautilus-eval, contract, dev/repo, linked-from:docs/master-plan.md
- Current next action: Create a host-owned dev/repo fixture and run it through cautilus eval test.
- Why this layer: The claim depends on model, agent, prompt, skill, workflow, or behavior execution evidence.
- Human claim quality: TODO
- Human corrected proof layer: keep
- Human corrected eval surface: keep
- Human readiness: keep
- Human priority: TODO
- Duplicate of:
- Notes:

### 177 claim-docs-contracts-claim-discovery-workflow-md-564
<!-- claim-id: claim-docs-contracts-claim-discovery-workflow-md-564 -->
- Source: docs/contracts/claim-discovery-workflow.md:564
- Summary: It emits `cautilus.claim_eval_plan.v1` from reviewed `cautilus-eval` claims that are ready to verify, while preserving the host boundary by not writing fixtures, prompts, runners, wrappers, or policy.
- Excerpt: It emits `cautilus.claim_eval_plan.v1` from reviewed `cautilus-eval` claims that are ready to verify, while preserving the host boundary by not writing fixtures, prompts, runners, wrappers, or policy.
- Current labels: proofLayer=cautilus-eval; recommendedProof=cautilus-eval; recommendedEvalSurface=app/prompt; readiness=ready-to-verify; reviewStatus=heuristic; evidenceStatus=unknown
- Group hints: cautilus-eval, contract, app/prompt, linked-from:docs/master-plan.md
- Current next action: Create a host-owned app/prompt fixture and run it through cautilus eval test.
- Why this layer: The claim depends on model, agent, prompt, skill, workflow, or behavior execution evidence.
- Human claim quality: TODO
- Human corrected proof layer: keep
- Human corrected eval surface: keep
- Human readiness: keep
- Human priority: TODO
- Duplicate of:
- Notes:

### 178 claim-docs-contracts-live-run-invocation-md-3
<!-- claim-id: claim-docs-contracts-live-run-invocation-md-3 -->
- Source: docs/contracts/live-run-invocation.md:3
- Summary: Issue `#18` closes only if `Cautilus` can ask a consumer to run one bounded scenario packet against one selected live instance without inheriting the consumer's route layout.
- Excerpt: Issue `#18` closes only if `Cautilus` can ask a consumer to run one bounded scenario packet against one selected live instance without inheriting the consumer's route layout.
- Current labels: proofLayer=scenario-candidate; recommendedProof=cautilus-eval; recommendedEvalSurface=n/a; readiness=needs-scenario; reviewStatus=heuristic; evidenceStatus=unknown
- Group hints: cautilus-eval, contract, needs-scenario, linked-from:docs/contracts/adapter-contract.md
- Current next action: Use the scenario proposal flow to normalize candidate evidence before creating a checked-in eval fixture.
- Why this layer: The claim points at scenario or proposal work before it is ready as a protected eval fixture.
- Human claim quality: TODO
- Human corrected proof layer: keep
- Human corrected eval surface: keep
- Human readiness: keep
- Human priority: TODO
- Duplicate of:
- Notes:

### 179 claim-docs-contracts-live-run-invocation-md-58
<!-- claim-id: claim-docs-contracts-live-run-invocation-md-58 -->
- Source: docs/contracts/live-run-invocation.md:58
- Summary: For `persona_prompt`, the product owns the loop boundary, the request packet, the persona prompt shaping, and the result normalization.
- Excerpt: For `persona_prompt`, the product owns the loop boundary, the request packet, the persona prompt shaping, and the result normalization.
- Current labels: proofLayer=cautilus-eval; recommendedProof=cautilus-eval; recommendedEvalSurface=app/prompt; readiness=ready-to-verify; reviewStatus=heuristic; evidenceStatus=unknown
- Group hints: cautilus-eval, contract, app/prompt, linked-from:docs/contracts/adapter-contract.md
- Current next action: Create a host-owned app/prompt fixture and run it through cautilus eval test.
- Why this layer: The claim depends on model, agent, prompt, skill, workflow, or behavior execution evidence.
- Human claim quality: TODO
- Human corrected proof layer: keep
- Human corrected eval surface: keep
- Human readiness: keep
- Human priority: TODO
- Duplicate of:
- Notes:

### 180 claim-docs-contracts-live-run-invocation-md-194
<!-- claim-id: claim-docs-contracts-live-run-invocation-md-194 -->
- Source: docs/contracts/live-run-invocation.md:194
- Summary: Operators can distinguish scenario failure, blocked execution, and invocation failure.
- Excerpt: Operators can distinguish scenario failure, blocked execution, and invocation failure.
- Current labels: proofLayer=scenario-candidate; recommendedProof=cautilus-eval; recommendedEvalSurface=n/a; readiness=needs-scenario; reviewStatus=heuristic; evidenceStatus=unknown
- Group hints: cautilus-eval, contract, needs-scenario, linked-from:docs/contracts/adapter-contract.md
- Current next action: Use the scenario proposal flow to normalize candidate evidence before creating a checked-in eval fixture.
- Why this layer: The claim points at scenario or proposal work before it is ready as a protected eval fixture.
- Human claim quality: TODO
- Human corrected proof layer: keep
- Human corrected eval surface: keep
- Human readiness: keep
- Human priority: TODO
- Duplicate of:
- Notes:

### 181 claim-docs-contracts-reporting-md-14
<!-- claim-id: claim-docs-contracts-reporting-md-14 -->
- Source: docs/contracts/reporting.md:14
- Summary: `intent_profile`: `cautilus.behavior_intent.v1` for the same behavior using the product-owned `behaviorSurface` and dimension catalogs `intent_profile.summary` must exactly match `intent`
- Excerpt: `intent_profile`: `cautilus.behavior_intent.v1` for the same behavior using the product-owned `behaviorSurface` and dimension catalogs `intent_profile.summary` must exactly match `intent`
- Current labels: proofLayer=cautilus-eval; recommendedProof=cautilus-eval; recommendedEvalSurface=dev/repo; readiness=ready-to-verify; reviewStatus=heuristic; evidenceStatus=unknown
- Group hints: cautilus-eval, contract, dev/repo, linked-from:docs/guides/evaluation-process.md
- Current next action: Create a host-owned dev/repo fixture and run it through cautilus eval test.
- Why this layer: The claim depends on model, agent, prompt, skill, workflow, or behavior execution evidence.
- Human claim quality: TODO
- Human corrected proof layer: keep
- Human corrected eval surface: keep
- Human readiness: keep
- Human priority: TODO
- Duplicate of:
- Notes:

### 182 claim-docs-contracts-reporting-md-39
<!-- claim-id: claim-docs-contracts-reporting-md-39 -->
- Source: docs/contracts/reporting.md:39
- Summary: optional `intentProfile` when present, it must use the product-owned behavior-intent catalog
- Excerpt: optional `intentProfile` when present, it must use the product-owned behavior-intent catalog
- Current labels: proofLayer=cautilus-eval; recommendedProof=cautilus-eval; recommendedEvalSurface=dev/repo; readiness=ready-to-verify; reviewStatus=heuristic; evidenceStatus=unknown
- Group hints: cautilus-eval, contract, dev/repo, linked-from:docs/guides/evaluation-process.md
- Current next action: Create a host-owned dev/repo fixture and run it through cautilus eval test.
- Why this layer: The claim depends on model, agent, prompt, skill, workflow, or behavior execution evidence.
- Human claim quality: TODO
- Human corrected proof layer: keep
- Human corrected eval surface: keep
- Human readiness: keep
- Human priority: TODO
- Duplicate of:
- Notes:

### 183 claim-docs-contracts-reporting-md-48
<!-- claim-id: claim-docs-contracts-reporting-md-48 -->
- Source: docs/contracts/reporting.md:48
- Summary: This keeps report assembly deterministic.
- Excerpt: This keeps report assembly deterministic.
- Current labels: proofLayer=deterministic; recommendedProof=deterministic; recommendedEvalSurface=n/a; readiness=ready-to-verify; reviewStatus=heuristic; evidenceStatus=unknown
- Group hints: deterministic, contract, linked-from:docs/guides/evaluation-process.md
- Current next action: Keep or add a repo-owned unit, lint, build, schema, or CI check for this claim.
- Why this layer: The claim names a deterministic gate or static contract that should be protected outside Cautilus eval.
- Human claim quality: TODO
- Human corrected proof layer: keep
- Human corrected eval surface: keep
- Human readiness: keep
- Human priority: TODO
- Duplicate of:
- Notes:

### 184 claim-docs-contracts-reporting-md-69
<!-- claim-id: claim-docs-contracts-reporting-md-69 -->
- Source: docs/contracts/reporting.md:69
- Summary: `message`: the concrete human-review feedback that should survive into review, evidence, and optimize flows
- Excerpt: `message`: the concrete human-review feedback that should survive into review, evidence, and optimize flows
- Current labels: proofLayer=human-auditable; recommendedProof=human-auditable; recommendedEvalSurface=n/a; readiness=ready-to-verify; reviewStatus=heuristic; evidenceStatus=unknown
- Group hints: human-auditable, contract, linked-from:docs/guides/evaluation-process.md
- Current next action: Record the source reference and keep it human-auditable; add deterministic or eval proof only if behavior depends on execution.
- Why this layer: The claim can be checked by reading current source, docs, or generated artifacts.
- Human claim quality: TODO
- Human corrected proof layer: keep
- Human corrected eval surface: keep
- Human readiness: keep
- Human priority: TODO
- Duplicate of:
- Notes:

### 185 claim-docs-contracts-reporting-md-111
<!-- claim-id: claim-docs-contracts-reporting-md-111 -->
- Source: docs/contracts/reporting.md:111
- Summary: Model and provider truth should come from explicit runner output, adapter metadata, or checked-in wrappers, not from retroactive log scraping.
- Excerpt: Model and provider truth should come from explicit runner output, adapter metadata, or checked-in wrappers, not from retroactive log scraping.
- Current labels: proofLayer=cautilus-eval; recommendedProof=cautilus-eval; recommendedEvalSurface=dev/repo; readiness=ready-to-verify; reviewStatus=heuristic; evidenceStatus=unknown
- Group hints: cautilus-eval, contract, dev/repo, linked-from:docs/guides/evaluation-process.md
- Current next action: Create a host-owned dev/repo fixture and run it through cautilus eval test.
- Why this layer: The claim depends on model, agent, prompt, skill, workflow, or behavior execution evidence.
- Human claim quality: TODO
- Human corrected proof layer: keep
- Human corrected eval surface: keep
- Human readiness: keep
- Human priority: TODO
- Duplicate of:
- Notes:

### 186 claim-docs-contracts-reporting-md-112
<!-- claim-id: claim-docs-contracts-reporting-md-112 -->
- Source: docs/contracts/reporting.md:112
- Summary: Runtime drift codes should be recorded as runtime context rather than primary behavior-outcome reason codes unless a pinned-runtime policy blocks the run.
- Excerpt: Runtime drift codes should be recorded as runtime context rather than primary behavior-outcome reason codes unless a pinned-runtime policy blocks the run.
- Current labels: proofLayer=alignment-work; recommendedProof=human-auditable; recommendedEvalSurface=n/a; readiness=needs-alignment; reviewStatus=heuristic; evidenceStatus=unknown
- Group hints: human-auditable, contract, needs-alignment, linked-from:docs/guides/evaluation-process.md
- Current next action: Reconcile the named docs, code, skill, adapter, or CLI surface before treating this as a verification target.
- Why this layer: The claim says surfaces should agree, so proof is not honest until the mismatched surfaces are reconciled.
- Human claim quality: TODO
- Human corrected proof layer: keep
- Human corrected eval surface: keep
- Human readiness: keep
- Human priority: TODO
- Duplicate of:
- Notes:

### 187 claim-docs-contracts-reporting-md-124
<!-- claim-id: claim-docs-contracts-reporting-md-124 -->
- Source: docs/contracts/reporting.md:124
- Summary: The summary packet should also aggregate any explicit numeric telemetry across variants so operators can inspect one top-level view without scraping each verdict file separately.
- Excerpt: The summary packet should also aggregate any explicit numeric telemetry across variants so operators can inspect one top-level view without scraping each verdict file separately.
- Current labels: proofLayer=human-auditable; recommendedProof=human-auditable; recommendedEvalSurface=n/a; readiness=ready-to-verify; reviewStatus=heuristic; evidenceStatus=unknown
- Group hints: human-auditable, contract, linked-from:docs/guides/evaluation-process.md
- Current next action: Record the source reference and keep it human-auditable; add deterministic or eval proof only if behavior depends on execution.
- Why this layer: The claim can be checked by reading current source, docs, or generated artifacts.
- Human claim quality: TODO
- Human corrected proof layer: keep
- Human corrected eval surface: keep
- Human readiness: keep
- Human priority: TODO
- Duplicate of:
- Notes:

### 188 claim-docs-contracts-reporting-md-127
<!-- claim-id: claim-docs-contracts-reporting-md-127 -->
- Source: docs/contracts/reporting.md:127
- Summary: For scenario-driven evaluation, the same rule applies one level lower: scenario result packets should preserve per-scenario telemetry so `Cautilus` can answer which scenarios are currently the slowest or most expensive.
- Excerpt: For scenario-driven evaluation, the same rule applies one level lower: scenario result packets should preserve per-scenario telemetry so `Cautilus` can answer which scenarios are currently the slowest or most expensive.
- Current labels: proofLayer=scenario-candidate; recommendedProof=cautilus-eval; recommendedEvalSurface=n/a; readiness=needs-scenario; reviewStatus=heuristic; evidenceStatus=unknown
- Group hints: cautilus-eval, contract, needs-scenario, linked-from:docs/guides/evaluation-process.md
- Current next action: Use the scenario proposal flow to normalize candidate evidence before creating a checked-in eval fixture.
- Why this layer: The claim points at scenario or proposal work before it is ready as a protected eval fixture.
- Human claim quality: TODO
- Human corrected proof layer: keep
- Human corrected eval surface: keep
- Human readiness: keep
- Human priority: TODO
- Duplicate of:
- Notes:

### 189 claim-docs-contracts-reporting-md-129
<!-- claim-id: claim-docs-contracts-reporting-md-129 -->
- Source: docs/contracts/reporting.md:129
- Summary: For held-out and full-gate reporting, mode runs should preserve that same scenario-level telemetry and lift it into a machine-readable report packet.
- Excerpt: For held-out and full-gate reporting, mode runs should preserve that same scenario-level telemetry and lift it into a machine-readable report packet.
- Current labels: proofLayer=scenario-candidate; recommendedProof=cautilus-eval; recommendedEvalSurface=n/a; readiness=needs-scenario; reviewStatus=heuristic; evidenceStatus=unknown
- Group hints: cautilus-eval, contract, needs-scenario, linked-from:docs/guides/evaluation-process.md
- Current next action: Use the scenario proposal flow to normalize candidate evidence before creating a checked-in eval fixture.
- Why this layer: The claim points at scenario or proposal work before it is ready as a protected eval fixture.
- Human claim quality: TODO
- Human corrected proof layer: keep
- Human corrected eval surface: keep
- Human readiness: keep
- Human priority: TODO
- Duplicate of:
- Notes:

### 190 claim-docs-contracts-reporting-md-150
<!-- claim-id: claim-docs-contracts-reporting-md-150 -->
- Source: docs/contracts/reporting.md:150
- Summary: Human-review failures must be reported even when the benchmark score improves.
- Excerpt: Human-review failures must be reported even when the benchmark score improves.
- Current labels: proofLayer=human-auditable; recommendedProof=human-auditable; recommendedEvalSurface=n/a; readiness=ready-to-verify; reviewStatus=heuristic; evidenceStatus=unknown
- Group hints: human-auditable, contract, linked-from:docs/guides/evaluation-process.md
- Current next action: Record the source reference and keep it human-auditable; add deterministic or eval proof only if behavior depends on execution.
- Why this layer: The claim can be checked by reading current source, docs, or generated artifacts.
- Human claim quality: TODO
- Human corrected proof layer: keep
- Human corrected eval surface: keep
- Human readiness: keep
- Human priority: TODO
- Duplicate of:
- Notes:

### 191 claim-docs-contracts-runtime-fingerprint-optimization-md-3
<!-- claim-id: claim-docs-contracts-runtime-fingerprint-optimization-md-3 -->
- Source: docs/contracts/runtime-fingerprint-optimization.md:3
- Summary: `Cautilus` should make model and provider changes visible without turning every evaluation into a pinned-model benchmark.
- Excerpt: `Cautilus` should make model and provider changes visible without turning every evaluation into a pinned-model benchmark.
- Current labels: proofLayer=cautilus-eval; recommendedProof=cautilus-eval; recommendedEvalSurface=dev/repo; readiness=ready-to-verify; reviewStatus=heuristic; evidenceStatus=unknown
- Group hints: cautilus-eval, contract, dev/repo, linked-from:docs/internal/handoff.md
- Current next action: Create a host-owned dev/repo fixture and run it through cautilus eval test.
- Why this layer: The claim depends on model, agent, prompt, skill, workflow, or behavior execution evidence.
- Human claim quality: TODO
- Human corrected proof layer: keep
- Human corrected eval surface: keep
- Human readiness: keep
- Human priority: TODO
- Duplicate of:
- Notes:

### 192 claim-docs-contracts-runtime-fingerprint-optimization-md-8
<!-- claim-id: claim-docs-contracts-runtime-fingerprint-optimization-md-8 -->
- Source: docs/contracts/runtime-fingerprint-optimization.md:8
- Summary: By default, those tests should not force a model choice just to make evaluation evidence easier to compare.
- Excerpt: By default, those tests should not force a model choice just to make evaluation evidence easier to compare.
- Current labels: proofLayer=deterministic; recommendedProof=deterministic; recommendedEvalSurface=n/a; readiness=ready-to-verify; reviewStatus=heuristic; evidenceStatus=unknown
- Group hints: deterministic, contract, linked-from:docs/internal/handoff.md
- Current next action: Keep or add a repo-owned unit, lint, build, schema, or CI check for this claim.
- Why this layer: The claim names a deterministic gate or static contract that should be protected outside Cautilus eval.
- Human claim quality: TODO
- Human corrected proof layer: keep
- Human corrected eval surface: keep
- Human readiness: keep
- Human priority: TODO
- Duplicate of:
- Notes:

### 193 claim-docs-contracts-runtime-fingerprint-optimization-md-34
<!-- claim-id: claim-docs-contracts-runtime-fingerprint-optimization-md-34 -->
- Source: docs/contracts/runtime-fingerprint-optimization.md:34
- Summary: Adapter command templates may still pin a model when the evaluated product explicitly requires one.
- Excerpt: Adapter command templates may still pin a model when the evaluated product explicitly requires one.
- Current labels: proofLayer=cautilus-eval; recommendedProof=cautilus-eval; recommendedEvalSurface=dev/repo; readiness=ready-to-verify; reviewStatus=heuristic; evidenceStatus=unknown
- Group hints: cautilus-eval, contract, dev/repo, linked-from:docs/internal/handoff.md
- Current next action: Create a host-owned dev/repo fixture and run it through cautilus eval test.
- Why this layer: The claim depends on model, agent, prompt, skill, workflow, or behavior execution evidence.
- Human claim quality: TODO
- Human corrected proof layer: keep
- Human corrected eval surface: keep
- Human readiness: keep
- Human priority: TODO
- Duplicate of:
- Notes:

### 194 claim-docs-contracts-runtime-fingerprint-optimization-md-36
<!-- claim-id: claim-docs-contracts-runtime-fingerprint-optimization-md-36 -->
- Source: docs/contracts/runtime-fingerprint-optimization.md:36
- Summary: Under the default policy, a model or provider change should produce a context warning, not a failing result.
- Excerpt: Under the default policy, a model or provider change should produce a context warning, not a failing result.
- Current labels: proofLayer=cautilus-eval; recommendedProof=cautilus-eval; recommendedEvalSurface=dev/repo; readiness=ready-to-verify; reviewStatus=heuristic; evidenceStatus=unknown
- Group hints: cautilus-eval, contract, dev/repo, linked-from:docs/internal/handoff.md
- Current next action: Create a host-owned dev/repo fixture and run it through cautilus eval test.
- Why this layer: The claim depends on model, agent, prompt, skill, workflow, or behavior execution evidence.
- Human claim quality: TODO
- Human corrected proof layer: keep
- Human corrected eval surface: keep
- Human readiness: keep
- Human priority: TODO
- Duplicate of:
- Notes:

### 195 claim-docs-contracts-runtime-fingerprint-optimization-md-41
<!-- claim-id: claim-docs-contracts-runtime-fingerprint-optimization-md-41 -->
- Source: docs/contracts/runtime-fingerprint-optimization.md:41
- Summary: `Cautilus` should not infer hidden model identity from human-oriented logs.
- Excerpt: `Cautilus` should not infer hidden model identity from human-oriented logs.
- Current labels: proofLayer=cautilus-eval; recommendedProof=cautilus-eval; recommendedEvalSurface=dev/repo; readiness=ready-to-verify; reviewStatus=heuristic; evidenceStatus=unknown
- Group hints: cautilus-eval, contract, dev/repo, linked-from:docs/internal/handoff.md
- Current next action: Create a host-owned dev/repo fixture and run it through cautilus eval test.
- Why this layer: The claim depends on model, agent, prompt, skill, workflow, or behavior execution evidence.
- Human claim quality: TODO
- Human corrected proof layer: keep
- Human corrected eval surface: keep
- Human readiness: keep
- Human priority: TODO
- Duplicate of:
- Notes:

### 196 claim-docs-contracts-runtime-fingerprint-optimization-md-47
<!-- claim-id: claim-docs-contracts-runtime-fingerprint-optimization-md-47 -->
- Source: docs/contracts/runtime-fingerprint-optimization.md:47
- Summary: Optimization should prefer the shortest, least specialized target that preserves or improves the evaluated behavior.
- Excerpt: Optimization should prefer the shortest, least specialized target that preserves or improves the evaluated behavior.
- Current labels: proofLayer=cautilus-eval; recommendedProof=cautilus-eval; recommendedEvalSurface=dev/repo; readiness=ready-to-verify; reviewStatus=heuristic; evidenceStatus=unknown
- Group hints: cautilus-eval, contract, dev/repo, linked-from:docs/internal/handoff.md
- Current next action: Create a host-owned dev/repo fixture and run it through cautilus eval test.
- Why this layer: The claim depends on model, agent, prompt, skill, workflow, or behavior execution evidence.
- Human claim quality: TODO
- Human corrected proof layer: keep
- Human corrected eval surface: keep
- Human readiness: keep
- Human priority: TODO
- Duplicate of:
- Notes:

### 197 claim-docs-contracts-runtime-fingerprint-optimization-md-50
<!-- claim-id: claim-docs-contracts-runtime-fingerprint-optimization-md-50 -->
- Source: docs/contracts/runtime-fingerprint-optimization.md:50
- Summary: It should not directly auto-edit consumer-owned prompts, skills, or instruction files.
- Excerpt: It should not directly auto-edit consumer-owned prompts, skills, or instruction files.
- Current labels: proofLayer=cautilus-eval; recommendedProof=cautilus-eval; recommendedEvalSurface=app/prompt; readiness=ready-to-verify; reviewStatus=heuristic; evidenceStatus=unknown
- Group hints: cautilus-eval, contract, app/prompt, linked-from:docs/internal/handoff.md
- Current next action: Create a host-owned app/prompt fixture and run it through cautilus eval test.
- Why this layer: The claim depends on model, agent, prompt, skill, workflow, or behavior execution evidence.
- Human claim quality: TODO
- Human corrected proof layer: keep
- Human corrected eval surface: keep
- Human readiness: keep
- Human priority: TODO
- Duplicate of:
- Notes:

### 198 claim-docs-contracts-runtime-fingerprint-optimization-md-100
<!-- claim-id: claim-docs-contracts-runtime-fingerprint-optimization-md-100 -->
- Source: docs/contracts/runtime-fingerprint-optimization.md:100
- Summary: Alias matching is intentionally not inferred in the first slice unless the runtime emits both requested and resolved model fields.
- Excerpt: Alias matching is intentionally not inferred in the first slice unless the runtime emits both requested and resolved model fields.
- Current labels: proofLayer=cautilus-eval; recommendedProof=cautilus-eval; recommendedEvalSurface=dev/repo; readiness=ready-to-verify; reviewStatus=heuristic; evidenceStatus=unknown
- Group hints: cautilus-eval, contract, dev/repo, linked-from:docs/internal/handoff.md
- Current next action: Create a host-owned dev/repo fixture and run it through cautilus eval test.
- Why this layer: The claim depends on model, agent, prompt, skill, workflow, or behavior execution evidence.
- Human claim quality: TODO
- Human corrected proof layer: keep
- Human corrected eval surface: keep
- Human readiness: keep
- Human priority: TODO
- Duplicate of:
- Notes:

### 199 claim-docs-contracts-runtime-fingerprint-optimization-md-154
<!-- claim-id: claim-docs-contracts-runtime-fingerprint-optimization-md-154 -->
- Source: docs/contracts/runtime-fingerprint-optimization.md:154
- Summary: It should generate a candidate or revision brief, then require the same tests and review gates before the candidate is trusted.
- Excerpt: It should generate a candidate or revision brief, then require the same tests and review gates before the candidate is trusted.
- Current labels: proofLayer=deterministic; recommendedProof=deterministic; recommendedEvalSurface=n/a; readiness=ready-to-verify; reviewStatus=heuristic; evidenceStatus=unknown
- Group hints: deterministic, contract, linked-from:docs/internal/handoff.md
- Current next action: Keep or add a repo-owned unit, lint, build, schema, or CI check for this claim.
- Why this layer: The claim names a deterministic gate or static contract that should be protected outside Cautilus eval.
- Human claim quality: TODO
- Human corrected proof layer: keep
- Human corrected eval surface: keep
- Human readiness: keep
- Human priority: TODO
- Duplicate of:
- Notes:

### 200 claim-docs-contracts-runtime-fingerprint-optimization-md-161
<!-- claim-id: claim-docs-contracts-runtime-fingerprint-optimization-md-161 -->
- Source: docs/contracts/runtime-fingerprint-optimization.md:161
- Summary: Model-change-driven optimize suggestions should preserve:
- Excerpt: Model-change-driven optimize suggestions should preserve:
- Current labels: proofLayer=cautilus-eval; recommendedProof=cautilus-eval; recommendedEvalSurface=dev/repo; readiness=ready-to-verify; reviewStatus=heuristic; evidenceStatus=unknown
- Group hints: cautilus-eval, contract, dev/repo, linked-from:docs/internal/handoff.md
- Current next action: Create a host-owned dev/repo fixture and run it through cautilus eval test.
- Why this layer: The claim depends on model, agent, prompt, skill, workflow, or behavior execution evidence.
- Human claim quality: TODO
- Human corrected proof layer: keep
- Human corrected eval surface: keep
- Human readiness: keep
- Human priority: TODO
- Duplicate of:
- Notes:

### 201 claim-docs-contracts-runtime-fingerprint-optimization-md-188
<!-- claim-id: claim-docs-contracts-runtime-fingerprint-optimization-md-188 -->
- Source: docs/contracts/runtime-fingerprint-optimization.md:188
- Summary: A skill or eval test can pass while still reporting that the observed runtime changed from the comparison evidence.
- Excerpt: A skill or eval test can pass while still reporting that the observed runtime changed from the comparison evidence.
- Current labels: proofLayer=cautilus-eval; recommendedProof=cautilus-eval; recommendedEvalSurface=dev/skill; readiness=ready-to-verify; reviewStatus=heuristic; evidenceStatus=unknown
- Group hints: cautilus-eval, contract, dev/skill, linked-from:docs/internal/handoff.md
- Current next action: Create a host-owned dev/skill fixture and run it through cautilus eval test.
- Why this layer: The claim depends on model, agent, prompt, skill, workflow, or behavior execution evidence.
- Human claim quality: TODO
- Human corrected proof layer: keep
- Human corrected eval surface: keep
- Human readiness: keep
- Human priority: TODO
- Duplicate of:
- Notes:

### 202 claim-docs-contracts-runtime-fingerprint-optimization-md-190
<!-- claim-id: claim-docs-contracts-runtime-fingerprint-optimization-md-190 -->
- Source: docs/contracts/runtime-fingerprint-optimization.md:190
- Summary: Report and evidence packets can carry runtime-context reason codes without treating them as behavior regressions.
- Excerpt: Report and evidence packets can carry runtime-context reason codes without treating them as behavior regressions.
- Current labels: proofLayer=cautilus-eval; recommendedProof=cautilus-eval; recommendedEvalSurface=dev/repo; readiness=ready-to-verify; reviewStatus=heuristic; evidenceStatus=unknown
- Group hints: cautilus-eval, contract, dev/repo, linked-from:docs/internal/handoff.md
- Current next action: Create a host-owned dev/repo fixture and run it through cautilus eval test.
- Why this layer: The claim depends on model, agent, prompt, skill, workflow, or behavior execution evidence.
- Human claim quality: TODO
- Human corrected proof layer: keep
- Human corrected eval surface: keep
- Human readiness: keep
- Human priority: TODO
- Duplicate of:
- Notes:

### 203 claim-docs-contracts-runtime-fingerprint-optimization-md-191
<!-- claim-id: claim-docs-contracts-runtime-fingerprint-optimization-md-191 -->
- Source: docs/contracts/runtime-fingerprint-optimization.md:191
- Summary: Optimize can propose a bounded simplification candidate after a runtime change without adding a new user-facing optimizer kind.
- Excerpt: Optimize can propose a bounded simplification candidate after a runtime change without adding a new user-facing optimizer kind.
- Current labels: proofLayer=scenario-candidate; recommendedProof=cautilus-eval; recommendedEvalSurface=n/a; readiness=needs-scenario; reviewStatus=heuristic; evidenceStatus=unknown
- Group hints: cautilus-eval, contract, needs-scenario, linked-from:docs/internal/handoff.md
- Current next action: Use the scenario proposal flow to normalize candidate evidence before creating a checked-in eval fixture.
- Why this layer: The claim points at scenario or proposal work before it is ready as a protected eval fixture.
- Human claim quality: TODO
- Human corrected proof layer: keep
- Human corrected eval surface: keep
- Human readiness: keep
- Human priority: TODO
- Duplicate of:
- Notes:

### 204 claim-docs-contracts-runtime-fingerprint-optimization-md-241
<!-- claim-id: claim-docs-contracts-runtime-fingerprint-optimization-md-241 -->
- Source: docs/contracts/runtime-fingerprint-optimization.md:241
- Summary: Proposals should show runtime comparison, passing evidence, target-size delta, and optionality.
- Excerpt: Proposals should show runtime comparison, passing evidence, target-size delta, and optionality.
- Current labels: proofLayer=scenario-candidate; recommendedProof=cautilus-eval; recommendedEvalSurface=n/a; readiness=needs-scenario; reviewStatus=heuristic; evidenceStatus=unknown
- Group hints: cautilus-eval, contract, needs-scenario, linked-from:docs/internal/handoff.md
- Current next action: Use the scenario proposal flow to normalize candidate evidence before creating a checked-in eval fixture.
- Why this layer: The claim points at scenario or proposal work before it is ready as a protected eval fixture.
- Human claim quality: TODO
- Human corrected proof layer: keep
- Human corrected eval surface: keep
- Human readiness: keep
- Human priority: TODO
- Duplicate of:
- Notes:

### 205 claim-docs-contracts-runtime-fingerprint-optimization-md-261
<!-- claim-id: claim-docs-contracts-runtime-fingerprint-optimization-md-261 -->
- Source: docs/contracts/runtime-fingerprint-optimization.md:261
- Summary: This sequence keeps the evidence honest before asking optimize search to mutate prompts more aggressively.
- Excerpt: This sequence keeps the evidence honest before asking optimize search to mutate prompts more aggressively.
- Current labels: proofLayer=cautilus-eval; recommendedProof=cautilus-eval; recommendedEvalSurface=app/prompt; readiness=ready-to-verify; reviewStatus=heuristic; evidenceStatus=unknown
- Group hints: cautilus-eval, contract, app/prompt, linked-from:docs/internal/handoff.md
- Current next action: Create a host-owned app/prompt fixture and run it through cautilus eval test.
- Why this layer: The claim depends on model, agent, prompt, skill, workflow, or behavior execution evidence.
- Human claim quality: TODO
- Human corrected proof layer: keep
- Human corrected eval surface: keep
- Human readiness: keep
- Human priority: TODO
- Duplicate of:
- Notes:

### 206 claim-docs-contracts-scenario-history-md-3
<!-- claim-id: claim-docs-contracts-scenario-history-md-3 -->
- Source: docs/contracts/scenario-history.md:3
- Summary: `Cautilus` needs a repo-agnostic way to decide which scenarios run during iterate, held-out, and full-gate evaluation, and how repeated train runs change scenario cadence over time.
- Excerpt: `Cautilus` needs a repo-agnostic way to decide which scenarios run during iterate, held-out, and full-gate evaluation, and how repeated train runs change scenario cadence over time.
- Current labels: proofLayer=scenario-candidate; recommendedProof=cautilus-eval; recommendedEvalSurface=n/a; readiness=needs-scenario; reviewStatus=heuristic; evidenceStatus=unknown
- Group hints: cautilus-eval, contract, needs-scenario, linked-from:docs/master-plan.md
- Current next action: Use the scenario proposal flow to normalize candidate evidence before creating a checked-in eval fixture.
- Why this layer: The claim points at scenario or proposal work before it is ready as a protected eval fixture.
- Human claim quality: TODO
- Human corrected proof layer: keep
- Human corrected eval surface: keep
- Human readiness: keep
- Human priority: TODO
- Duplicate of:
- Notes:

### 207 claim-docs-contracts-scenario-history-md-25
<!-- claim-id: claim-docs-contracts-scenario-history-md-25 -->
- Source: docs/contracts/scenario-history.md:25
- Summary: A scenario-history-aware profile should define:
- Excerpt: A scenario-history-aware profile should define:
- Current labels: proofLayer=scenario-candidate; recommendedProof=cautilus-eval; recommendedEvalSurface=n/a; readiness=needs-scenario; reviewStatus=heuristic; evidenceStatus=unknown
- Group hints: cautilus-eval, contract, needs-scenario, linked-from:docs/master-plan.md
- Current next action: Use the scenario proposal flow to normalize candidate evidence before creating a checked-in eval fixture.
- Why this layer: The claim points at scenario or proposal work before it is ready as a protected eval fixture.
- Human claim quality: TODO
- Human corrected proof layer: keep
- Human corrected eval surface: keep
- Human readiness: keep
- Human priority: TODO
- Duplicate of:
- Notes:

### 208 claim-docs-contracts-scenario-history-md-123
<!-- claim-id: claim-docs-contracts-scenario-history-md-123 -->
- Source: docs/contracts/scenario-history.md:123
- Summary: `Cautilus` should select scenarios with these rules:
- Excerpt: `Cautilus` should select scenarios with these rules:
- Current labels: proofLayer=scenario-candidate; recommendedProof=cautilus-eval; recommendedEvalSurface=n/a; readiness=needs-scenario; reviewStatus=heuristic; evidenceStatus=unknown
- Group hints: cautilus-eval, contract, needs-scenario, linked-from:docs/master-plan.md
- Current next action: Use the scenario proposal flow to normalize candidate evidence before creating a checked-in eval fixture.
- Why this layer: The claim points at scenario or proposal work before it is ready as a protected eval fixture.
- Human claim quality: TODO
- Human corrected proof layer: keep
- Human corrected eval surface: keep
- Human readiness: keep
- Human priority: TODO
- Duplicate of:
- Notes:

### 209 claim-docs-contracts-scenario-history-md-171
<!-- claim-id: claim-docs-contracts-scenario-history-md-171 -->
- Source: docs/contracts/scenario-history.md:171
- Summary: This data should come from explicit scenario-result payloads, not from retroactive log scraping.
- Excerpt: This data should come from explicit scenario-result payloads, not from retroactive log scraping.
- Current labels: proofLayer=scenario-candidate; recommendedProof=cautilus-eval; recommendedEvalSurface=n/a; readiness=needs-scenario; reviewStatus=heuristic; evidenceStatus=unknown
- Group hints: cautilus-eval, contract, needs-scenario, linked-from:docs/master-plan.md
- Current next action: Use the scenario proposal flow to normalize candidate evidence before creating a checked-in eval fixture.
- Why this layer: The claim points at scenario or proposal work before it is ready as a protected eval fixture.
- Human claim quality: TODO
- Human corrected proof layer: keep
- Human corrected eval surface: keep
- Human readiness: keep
- Human priority: TODO
- Duplicate of:
- Notes:

### 210 claim-docs-contracts-scenario-history-md-175
<!-- claim-id: claim-docs-contracts-scenario-history-md-175 -->
- Source: docs/contracts/scenario-history.md:175
- Summary: Compare runs often need a frozen baseline side so only the candidate reruns.
- Excerpt: Compare runs often need a frozen baseline side so only the candidate reruns.
- Current labels: proofLayer=scenario-candidate; recommendedProof=cautilus-eval; recommendedEvalSurface=n/a; readiness=needs-scenario; reviewStatus=heuristic; evidenceStatus=unknown
- Group hints: cautilus-eval, contract, needs-scenario, linked-from:docs/master-plan.md
- Current next action: Use the scenario proposal flow to normalize candidate evidence before creating a checked-in eval fixture.
- Why this layer: The claim points at scenario or proposal work before it is ready as a protected eval fixture.
- Human claim quality: TODO
- Human corrected proof layer: keep
- Human corrected eval surface: keep
- Human readiness: keep
- Human priority: TODO
- Duplicate of:
- Notes:

### 211 claim-docs-contracts-scenario-history-md-216
<!-- claim-id: claim-docs-contracts-scenario-history-md-216 -->
- Source: docs/contracts/scenario-history.md:216
- Summary: Baseline cache keys must include scenario-definition identity, not only repo identity.
- Excerpt: Baseline cache keys must include scenario-definition identity, not only repo identity.
- Current labels: proofLayer=scenario-candidate; recommendedProof=cautilus-eval; recommendedEvalSurface=n/a; readiness=needs-scenario; reviewStatus=heuristic; evidenceStatus=unknown
- Group hints: cautilus-eval, contract, needs-scenario, linked-from:docs/master-plan.md
- Current next action: Use the scenario proposal flow to normalize candidate evidence before creating a checked-in eval fixture.
- Why this layer: The claim points at scenario or proposal work before it is ready as a protected eval fixture.
- Human claim quality: TODO
- Human corrected proof layer: keep
- Human corrected eval surface: keep
- Human readiness: keep
- Human priority: TODO
- Duplicate of:
- Notes:

### 212 claim-docs-contracts-scenario-history-md-238
<!-- claim-id: claim-docs-contracts-scenario-history-md-238 -->
- Source: docs/contracts/scenario-history.md:238
- Summary: **Part 2 — broader compare ownership.** Extend history / compare hooks beyond the single profile-backed eval path so `review variants`, profile-less eval test runs, and skill evaluation can also update history and materialize compare artifacts.
- Excerpt: **Part 2 — broader compare ownership.** Extend history / compare hooks beyond the single profile-backed eval path so `review variants`, profile-less eval test runs, and skill evaluation can also update history and materialize compare artifacts.
- Current labels: proofLayer=cautilus-eval; recommendedProof=cautilus-eval; recommendedEvalSurface=dev/skill; readiness=ready-to-verify; reviewStatus=heuristic; evidenceStatus=unknown
- Group hints: cautilus-eval, contract, dev/skill, linked-from:docs/master-plan.md
- Current next action: Create a host-owned dev/skill fixture and run it through cautilus eval test.
- Why this layer: The claim depends on model, agent, prompt, skill, workflow, or behavior execution evidence.
- Human claim quality: TODO
- Human corrected proof layer: keep
- Human corrected eval surface: keep
- Human readiness: keep
- Human priority: TODO
- Duplicate of:
- Notes:

### 213 claim-docs-contracts-scenario-history-md-289
<!-- claim-id: claim-docs-contracts-scenario-history-md-289 -->
- Source: docs/contracts/scenario-history.md:289
- Summary: Scenario-history is archetype-neutral and stays that way unless a skill-specific graduation policy is introduced.
- Excerpt: Scenario-history is archetype-neutral and stays that way unless a skill-specific graduation policy is introduced.
- Current labels: proofLayer=scenario-candidate; recommendedProof=cautilus-eval; recommendedEvalSurface=n/a; readiness=needs-scenario; reviewStatus=heuristic; evidenceStatus=unknown
- Group hints: cautilus-eval, contract, needs-scenario, linked-from:docs/master-plan.md
- Current next action: Use the scenario proposal flow to normalize candidate evidence before creating a checked-in eval fixture.
- Why this layer: The claim points at scenario or proposal work before it is ready as a protected eval fixture.
- Human claim quality: TODO
- Human corrected proof layer: keep
- Human corrected eval surface: keep
- Human readiness: keep
- Human priority: TODO
- Duplicate of:
- Notes:

### 214 claim-docs-contracts-workbench-instance-discovery-md-5
<!-- claim-id: claim-docs-contracts-workbench-instance-discovery-md-5 -->
- Source: docs/contracts/workbench-instance-discovery.md:5
- Summary: It is the local-first routing contract that says which instances exist on this host and where each instance keeps its scenario-adjacent data.
- Excerpt: It is the local-first routing contract that says which instances exist on this host and where each instance keeps its scenario-adjacent data.
- Current labels: proofLayer=scenario-candidate; recommendedProof=cautilus-eval; recommendedEvalSurface=n/a; readiness=needs-scenario; reviewStatus=heuristic; evidenceStatus=unknown
- Group hints: cautilus-eval, contract, needs-scenario, linked-from:docs/contracts/adapter-contract.md
- Current next action: Use the scenario proposal flow to normalize candidate evidence before creating a checked-in eval fixture.
- Why this layer: The claim points at scenario or proposal work before it is ready as a protected eval fixture.
- Human claim quality: TODO
- Human corrected proof layer: keep
- Human corrected eval surface: keep
- Human readiness: keep
- Human priority: TODO
- Duplicate of:
- Notes:

### 215 claim-docs-contracts-workbench-instance-discovery-md-24
<!-- claim-id: claim-docs-contracts-workbench-instance-discovery-md-24 -->
- Source: docs/contracts/workbench-instance-discovery.md:24
- Summary: Every instance must expose a stable `instanceId` and a human-facing `displayLabel`.
- Excerpt: Every instance must expose a stable `instanceId` and a human-facing `displayLabel`.
- Current labels: proofLayer=human-auditable; recommendedProof=human-auditable; recommendedEvalSurface=n/a; readiness=ready-to-verify; reviewStatus=heuristic; evidenceStatus=unknown
- Group hints: human-auditable, contract, linked-from:docs/contracts/adapter-contract.md
- Current next action: Record the source reference and keep it human-auditable; add deterministic or eval proof only if behavior depends on execution.
- Why this layer: The claim can be checked by reading current source, docs, or generated artifacts.
- Human claim quality: TODO
- Human corrected proof layer: keep
- Human corrected eval surface: keep
- Human readiness: keep
- Human priority: TODO
- Duplicate of:
- Notes:

### 216 claim-docs-contracts-workbench-instance-discovery-md-97
<!-- claim-id: claim-docs-contracts-workbench-instance-discovery-md-97 -->
- Source: docs/contracts/workbench-instance-discovery.md:97
- Summary: The product can render a human-facing instance chooser without learning consumer-native labels itself.
- Excerpt: The product can render a human-facing instance chooser without learning consumer-native labels itself.
- Current labels: proofLayer=human-auditable; recommendedProof=human-auditable; recommendedEvalSurface=n/a; readiness=ready-to-verify; reviewStatus=heuristic; evidenceStatus=unknown
- Group hints: human-auditable, contract, linked-from:docs/contracts/adapter-contract.md
- Current next action: Record the source reference and keep it human-auditable; add deterministic or eval proof only if behavior depends on execution.
- Why this layer: The claim can be checked by reading current source, docs, or generated artifacts.
- Human claim quality: TODO
- Human corrected proof layer: keep
- Human corrected eval surface: keep
- Human readiness: keep
- Human priority: TODO
- Duplicate of:
- Notes:

### 217 claim-docs-contracts-workbench-instance-discovery-md-98
<!-- claim-id: claim-docs-contracts-workbench-instance-discovery-md-98 -->
- Source: docs/contracts/workbench-instance-discovery.md:98
- Summary: The product can read scenario-adjacent paths from typed packet fields instead of hardcoded route templates.
- Excerpt: The product can read scenario-adjacent paths from typed packet fields instead of hardcoded route templates.
- Current labels: proofLayer=scenario-candidate; recommendedProof=cautilus-eval; recommendedEvalSurface=n/a; readiness=needs-scenario; reviewStatus=heuristic; evidenceStatus=unknown
- Group hints: cautilus-eval, contract, needs-scenario, linked-from:docs/contracts/adapter-contract.md
- Current next action: Use the scenario proposal flow to normalize candidate evidence before creating a checked-in eval fixture.
- Why this layer: The claim points at scenario or proposal work before it is ready as a protected eval fixture.
- Human claim quality: TODO
- Human corrected proof layer: keep
- Human corrected eval surface: keep
- Human readiness: keep
- Human priority: TODO
- Duplicate of:
- Notes:

### 218 claim-docs-maintainers-release-boundary-md-61
<!-- claim-id: claim-docs-maintainers-release-boundary-md-61 -->
- Source: docs/maintainers/release-boundary.md:61
- Summary: breaking contract changes must update checked-in docs and fixtures in the same change
- Excerpt: breaking contract changes must update checked-in docs and fixtures in the same change
- Current labels: proofLayer=human-auditable; recommendedProof=human-auditable; recommendedEvalSurface=n/a; readiness=ready-to-verify; reviewStatus=heuristic; evidenceStatus=unknown
- Group hints: human-auditable, docs, linked-from:docs/master-plan.md
- Current next action: Record the source reference and keep it human-auditable; add deterministic or eval proof only if behavior depends on execution.
- Why this layer: The claim can be checked by reading current source, docs, or generated artifacts.
- Human claim quality: TODO
- Human corrected proof layer: keep
- Human corrected eval surface: keep
- Human readiness: keep
- Human priority: TODO
- Duplicate of:
- Notes:

### 219 claim-docs-maintainers-release-boundary-md-62
<!-- claim-id: claim-docs-maintainers-release-boundary-md-62 -->
- Source: docs/maintainers/release-boundary.md:62
- Summary: CLI help, bundled skill instructions, and executable specs should describe the same commands
- Excerpt: CLI help, bundled skill instructions, and executable specs should describe the same commands
- Current labels: proofLayer=cautilus-eval; recommendedProof=cautilus-eval; recommendedEvalSurface=dev/skill; readiness=ready-to-verify; reviewStatus=heuristic; evidenceStatus=unknown
- Group hints: cautilus-eval, docs, dev/skill, linked-from:docs/master-plan.md
- Current next action: Create a host-owned dev/skill fixture and run it through cautilus eval test.
- Why this layer: The claim depends on model, agent, prompt, skill, workflow, or behavior execution evidence.
- Human claim quality: TODO
- Human corrected proof layer: keep
- Human corrected eval surface: keep
- Human readiness: keep
- Human priority: TODO
- Duplicate of:
- Notes:

### 220 claim-docs-specs-command-surfaces-spec-md-27
<!-- claim-id: claim-docs-specs-command-surfaces-spec-md-27 -->
- Source: docs/specs/command-surfaces.spec.md:27
- Summary: The implemented slice is intentionally deterministic: it inventories explicit truth surfaces and emits source-ref-backed proof-plan candidates.
- Excerpt: The implemented slice is intentionally deterministic: it inventories explicit truth surfaces and emits source-ref-backed proof-plan candidates.
- Current labels: proofLayer=deterministic; recommendedProof=deterministic; recommendedEvalSurface=n/a; readiness=ready-to-verify; reviewStatus=heuristic; evidenceStatus=unknown
- Group hints: deterministic, spec, linked-from:docs/master-plan.md
- Current next action: Keep or add a repo-owned unit, lint, build, schema, or CI check for this claim.
- Why this layer: The claim names a deterministic gate or static contract that should be protected outside Cautilus eval.
- Human claim quality: TODO
- Human corrected proof layer: keep
- Human corrected eval surface: keep
- Human readiness: keep
- Human priority: TODO
- Duplicate of:
- Notes:

### 221 claim-docs-specs-command-surfaces-spec-md-28
<!-- claim-id: claim-docs-specs-command-surfaces-spec-md-28 -->
- Source: docs/specs/command-surfaces.spec.md:28
- Summary: Default output is not silently capped; agents are first-class readers of the packet and should filter or select claims explicitly instead of inheriting a hidden product limit.
- Excerpt: Default output is not silently capped; agents are first-class readers of the packet and should filter or select claims explicitly instead of inheriting a hidden product limit.
- Current labels: proofLayer=cautilus-eval; recommendedProof=cautilus-eval; recommendedEvalSurface=dev/repo; readiness=ready-to-verify; reviewStatus=heuristic; evidenceStatus=unknown
- Group hints: cautilus-eval, spec, dev/repo, linked-from:docs/master-plan.md
- Current next action: Create a host-owned dev/repo fixture and run it through cautilus eval test.
- Why this layer: The claim depends on model, agent, prompt, skill, workflow, or behavior execution evidence.
- Human claim quality: TODO
- Human corrected proof layer: keep
- Human corrected eval surface: keep
- Human readiness: keep
- Human priority: TODO
- Duplicate of:
- Notes:

### 222 claim-docs-specs-command-surfaces-spec-md-109
<!-- claim-id: claim-docs-specs-command-surfaces-spec-md-109 -->
- Source: docs/specs/command-surfaces.spec.md:109
- Summary: The command discovers candidate claims from explicit repo-owned truth surfaces.
- Excerpt: The command discovers candidate claims from explicit repo-owned truth surfaces.
- Current labels: proofLayer=scenario-candidate; recommendedProof=cautilus-eval; recommendedEvalSurface=n/a; readiness=needs-scenario; reviewStatus=heuristic; evidenceStatus=unknown
- Group hints: cautilus-eval, spec, needs-scenario, linked-from:docs/master-plan.md
- Current next action: Use the scenario proposal flow to normalize candidate evidence before creating a checked-in eval fixture.
- Why this layer: The claim points at scenario or proposal work before it is ready as a protected eval fixture.
- Human claim quality: TODO
- Human corrected proof layer: keep
- Human corrected eval surface: keep
- Human readiness: keep
- Human priority: TODO
- Duplicate of:
- Notes:

### 223 claim-docs-specs-command-surfaces-spec-md-118
<!-- claim-id: claim-docs-specs-command-surfaces-spec-md-118 -->
- Source: docs/specs/command-surfaces.spec.md:118
- Summary: It may point at source files and propose proof layers, but it must not import host-specific adapters, prompts, storage readers, or private workflow conventions into Cautilus.
- Excerpt: It may point at source files and propose proof layers, but it must not import host-specific adapters, prompts, storage readers, or private workflow conventions into Cautilus.
- Current labels: proofLayer=cautilus-eval; recommendedProof=cautilus-eval; recommendedEvalSurface=app/prompt; readiness=ready-to-verify; reviewStatus=heuristic; evidenceStatus=unknown
- Group hints: cautilus-eval, spec, app/prompt, linked-from:docs/master-plan.md
- Current next action: Create a host-owned app/prompt fixture and run it through cautilus eval test.
- Why this layer: The claim depends on model, agent, prompt, skill, workflow, or behavior execution evidence.
- Human claim quality: TODO
- Human corrected proof layer: keep
- Human corrected eval surface: keep
- Human readiness: keep
- Human priority: TODO
- Duplicate of:
- Notes:

### 224 claim-docs-specs-command-surfaces-spec-md-141
<!-- claim-id: claim-docs-specs-command-surfaces-spec-md-141 -->
- Source: docs/specs/command-surfaces.spec.md:141
- Summary: It tells an operator or agent what should be proven where.
- Excerpt: It tells an operator or agent what should be proven where.
- Current labels: proofLayer=cautilus-eval; recommendedProof=cautilus-eval; recommendedEvalSurface=dev/repo; readiness=ready-to-verify; reviewStatus=heuristic; evidenceStatus=unknown
- Group hints: cautilus-eval, spec, dev/repo, linked-from:docs/master-plan.md
- Current next action: Create a host-owned dev/repo fixture and run it through cautilus eval test.
- Why this layer: The claim depends on model, agent, prompt, skill, workflow, or behavior execution evidence.
- Human claim quality: TODO
- Human corrected proof layer: keep
- Human corrected eval surface: keep
- Human readiness: keep
- Human priority: TODO
- Duplicate of:
- Notes:

### 225 claim-docs-specs-command-surfaces-spec-md-142
<!-- claim-id: claim-docs-specs-command-surfaces-spec-md-142 -->
- Source: docs/specs/command-surfaces.spec.md:142
- Summary: It should preserve the discovered backlog honestly; prioritization belongs in the next agent step or a future explicit selection command, not in a hidden cap.
- Excerpt: It should preserve the discovered backlog honestly; prioritization belongs in the next agent step or a future explicit selection command, not in a hidden cap.
- Current labels: proofLayer=cautilus-eval; recommendedProof=cautilus-eval; recommendedEvalSurface=dev/repo; readiness=ready-to-verify; reviewStatus=heuristic; evidenceStatus=unknown
- Group hints: cautilus-eval, spec, dev/repo, linked-from:docs/master-plan.md
- Current next action: Create a host-owned dev/repo fixture and run it through cautilus eval test.
- Why this layer: The claim depends on model, agent, prompt, skill, workflow, or behavior execution evidence.
- Human claim quality: TODO
- Human corrected proof layer: keep
- Human corrected eval surface: keep
- Human readiness: keep
- Human priority: TODO
- Duplicate of:
- Notes:

### 226 claim-docs-specs-command-surfaces-spec-md-146
<!-- claim-id: claim-docs-specs-command-surfaces-spec-md-146 -->
- Source: docs/specs/command-surfaces.spec.md:146
- Summary: Agents should use that summary before hand-inspecting raw `changedSources` or `claimPlan`.
- Excerpt: Agents should use that summary before hand-inspecting raw `changedSources` or `claimPlan`.
- Current labels: proofLayer=cautilus-eval; recommendedProof=cautilus-eval; recommendedEvalSurface=dev/repo; readiness=ready-to-verify; reviewStatus=heuristic; evidenceStatus=unknown
- Group hints: cautilus-eval, spec, dev/repo, linked-from:docs/master-plan.md
- Current next action: Create a host-owned dev/repo fixture and run it through cautilus eval test.
- Why this layer: The claim depends on model, agent, prompt, skill, workflow, or behavior execution evidence.
- Human claim quality: TODO
- Human corrected proof layer: keep
- Human corrected eval surface: keep
- Human readiness: keep
- Human priority: TODO
- Duplicate of:
- Notes:

### 227 claim-docs-specs-command-surfaces-spec-md-150
<!-- claim-id: claim-docs-specs-command-surfaces-spec-md-150 -->
- Source: docs/specs/command-surfaces.spec.md:150
- Summary: When called with `--sample-claims <n>`, it includes a bounded `sampleClaims` list so agents can inspect stable candidate fields without guessing raw packet keys.
- Excerpt: When called with `--sample-claims <n>`, it includes a bounded `sampleClaims` list so agents can inspect stable candidate fields without guessing raw packet keys.
- Current labels: proofLayer=scenario-candidate; recommendedProof=cautilus-eval; recommendedEvalSurface=n/a; readiness=needs-scenario; reviewStatus=heuristic; evidenceStatus=unknown
- Group hints: cautilus-eval, spec, needs-scenario, linked-from:docs/master-plan.md
- Current next action: Use the scenario proposal flow to normalize candidate evidence before creating a checked-in eval fixture.
- Why this layer: The claim points at scenario or proposal work before it is ready as a protected eval fixture.
- Human claim quality: TODO
- Human corrected proof layer: keep
- Human corrected eval surface: keep
- Human readiness: keep
- Human priority: TODO
- Duplicate of:
- Notes:

### 228 claim-docs-specs-command-surfaces-spec-md-186
<!-- claim-id: claim-docs-specs-command-surfaces-spec-md-186 -->
- Source: docs/specs/command-surfaces.spec.md:186
- Summary: The host repo owns the fixture contents, runner implementation, prompt files, wrappers, and acceptance policy.
- Excerpt: The host repo owns the fixture contents, runner implementation, prompt files, wrappers, and acceptance policy.
- Current labels: proofLayer=cautilus-eval; recommendedProof=cautilus-eval; recommendedEvalSurface=app/prompt; readiness=ready-to-verify; reviewStatus=heuristic; evidenceStatus=unknown
- Group hints: cautilus-eval, spec, app/prompt, linked-from:docs/master-plan.md
- Current next action: Create a host-owned app/prompt fixture and run it through cautilus eval test.
- Why this layer: The claim depends on model, agent, prompt, skill, workflow, or behavior execution evidence.
- Human claim quality: TODO
- Human corrected proof layer: keep
- Human corrected eval surface: keep
- Human readiness: keep
- Human priority: TODO
- Duplicate of:
- Notes:

### 229 claim-docs-specs-command-surfaces-spec-md-194
<!-- claim-id: claim-docs-specs-command-surfaces-spec-md-194 -->
- Source: docs/specs/command-surfaces.spec.md:194
- Summary: GEPA-style search belongs under `optimize`, not under `claim` or `eval`, because it changes behavior after the proof surface exists.
- Excerpt: GEPA-style search belongs under `optimize`, not under `claim` or `eval`, because it changes behavior after the proof surface exists.
- Current labels: proofLayer=cautilus-eval; recommendedProof=cautilus-eval; recommendedEvalSurface=dev/repo; readiness=ready-to-verify; reviewStatus=heuristic; evidenceStatus=unknown
- Group hints: cautilus-eval, spec, dev/repo, linked-from:docs/master-plan.md
- Current next action: Create a host-owned dev/repo fixture and run it through cautilus eval test.
- Why this layer: The claim depends on model, agent, prompt, skill, workflow, or behavior execution evidence.
- Human claim quality: TODO
- Human corrected proof layer: keep
- Human corrected eval surface: keep
- Human readiness: keep
- Human priority: TODO
- Duplicate of:
- Notes:

### 230 claim-docs-specs-command-surfaces-spec-md-203
<!-- claim-id: claim-docs-specs-command-surfaces-spec-md-203 -->
- Source: docs/specs/command-surfaces.spec.md:203
- Summary: It should point to the relevant scenario command rather than duplicating scenario packet logic.
- Excerpt: It should point to the relevant scenario command rather than duplicating scenario packet logic.
- Current labels: proofLayer=scenario-candidate; recommendedProof=cautilus-eval; recommendedEvalSurface=n/a; readiness=needs-scenario; reviewStatus=heuristic; evidenceStatus=unknown
- Group hints: cautilus-eval, spec, needs-scenario, linked-from:docs/master-plan.md
- Current next action: Use the scenario proposal flow to normalize candidate evidence before creating a checked-in eval fixture.
- Why this layer: The claim points at scenario or proposal work before it is ready as a protected eval fixture.
- Human claim quality: TODO
- Human corrected proof layer: keep
- Human corrected eval surface: keep
- Human readiness: keep
- Human priority: TODO
- Duplicate of:
- Notes:

### 231 claim-docs-specs-command-surfaces-spec-md-207
<!-- claim-id: claim-docs-specs-command-surfaces-spec-md-207 -->
- Source: docs/specs/command-surfaces.spec.md:207
- Summary: **How semantic should claim extraction be?** Start with deterministic source inventory and lightweight claim candidates that can be audited from file references.
- Excerpt: **How semantic should claim extraction be?** Start with deterministic source inventory and lightweight claim candidates that can be audited from file references.
- Current labels: proofLayer=deterministic; recommendedProof=deterministic; recommendedEvalSurface=n/a; readiness=ready-to-verify; reviewStatus=heuristic; evidenceStatus=unknown
- Group hints: deterministic, spec, linked-from:docs/master-plan.md
- Current next action: Keep or add a repo-owned unit, lint, build, schema, or CI check for this claim.
- Why this layer: The claim names a deterministic gate or static contract that should be protected outside Cautilus eval.
- Human claim quality: TODO
- Human corrected proof layer: keep
- Human corrected eval surface: keep
- Human readiness: keep
- Human priority: TODO
- Duplicate of:
- Notes:

### 232 claim-docs-specs-command-surfaces-spec-md-237
<!-- claim-id: claim-docs-specs-command-surfaces-spec-md-237 -->
- Source: docs/specs/command-surfaces.spec.md:237
- Summary: **Folding all scenario commands into `claim` immediately.** Scenario proposal flows are already shipped and should be reused, not renamed in the first slice.
- Excerpt: **Folding all scenario commands into `claim` immediately.** Scenario proposal flows are already shipped and should be reused, not renamed in the first slice.
- Current labels: proofLayer=scenario-candidate; recommendedProof=cautilus-eval; recommendedEvalSurface=n/a; readiness=needs-scenario; reviewStatus=heuristic; evidenceStatus=unknown
- Group hints: cautilus-eval, spec, needs-scenario, linked-from:docs/master-plan.md
- Current next action: Use the scenario proposal flow to normalize candidate evidence before creating a checked-in eval fixture.
- Why this layer: The claim points at scenario or proposal work before it is ready as a protected eval fixture.
- Human claim quality: TODO
- Human corrected proof layer: keep
- Human corrected eval surface: keep
- Human readiness: keep
- Human priority: TODO
- Duplicate of:
- Notes:

### 233 claim-docs-specs-command-surfaces-spec-md-243
<!-- claim-id: claim-docs-specs-command-surfaces-spec-md-243 -->
- Source: docs/specs/command-surfaces.spec.md:243
- Summary: The bundled skill must route claim discovery, evaluation, and optimization to the same family names as the binary.
- Excerpt: The bundled skill must route claim discovery, evaluation, and optimization to the same family names as the binary.
- Current labels: proofLayer=cautilus-eval; recommendedProof=cautilus-eval; recommendedEvalSurface=dev/skill; readiness=ready-to-verify; reviewStatus=heuristic; evidenceStatus=unknown
- Group hints: cautilus-eval, spec, dev/skill, linked-from:docs/master-plan.md
- Current next action: Create a host-owned dev/skill fixture and run it through cautilus eval test.
- Why this layer: The claim depends on model, agent, prompt, skill, workflow, or behavior execution evidence.
- Human claim quality: TODO
- Human corrected proof layer: keep
- Human corrected eval surface: keep
- Human readiness: keep
- Human priority: TODO
- Duplicate of:
- Notes:

### 234 claim-docs-specs-command-surfaces-spec-md-245
<!-- claim-id: claim-docs-specs-command-surfaces-spec-md-245 -->
- Source: docs/specs/command-surfaces.spec.md:245
- Summary: `claim discover` must be useful before a repo has a runnable eval adapter.
- Excerpt: `claim discover` must be useful before a repo has a runnable eval adapter.
- Current labels: proofLayer=cautilus-eval; recommendedProof=cautilus-eval; recommendedEvalSurface=dev/repo; readiness=ready-to-verify; reviewStatus=heuristic; evidenceStatus=unknown
- Group hints: cautilus-eval, spec, dev/repo, linked-from:docs/master-plan.md
- Current next action: Create a host-owned dev/repo fixture and run it through cautilus eval test.
- Why this layer: The claim depends on model, agent, prompt, skill, workflow, or behavior execution evidence.
- Human claim quality: TODO
- Human corrected proof layer: keep
- Human corrected eval surface: keep
- Human readiness: keep
- Human priority: TODO
- Duplicate of:
- Notes:

### 235 claim-docs-specs-command-surfaces-spec-md-246
<!-- claim-id: claim-docs-specs-command-surfaces-spec-md-246 -->
- Source: docs/specs/command-surfaces.spec.md:246
- Summary: `claim discover` must not imply that deterministic unit-test claims belong in Cautilus eval fixtures.
- Excerpt: `claim discover` must not imply that deterministic unit-test claims belong in Cautilus eval fixtures.
- Current labels: proofLayer=deterministic; recommendedProof=deterministic; recommendedEvalSurface=n/a; readiness=ready-to-verify; reviewStatus=heuristic; evidenceStatus=unknown
- Group hints: deterministic, spec, linked-from:docs/master-plan.md
- Current next action: Keep or add a repo-owned unit, lint, build, schema, or CI check for this claim.
- Why this layer: The claim names a deterministic gate or static contract that should be protected outside Cautilus eval.
- Human claim quality: TODO
- Human corrected proof layer: keep
- Human corrected eval surface: keep
- Human readiness: keep
- Human priority: TODO
- Duplicate of:
- Notes:

### 236 claim-docs-specs-command-surfaces-spec-md-250
<!-- claim-id: claim-docs-specs-command-surfaces-spec-md-250 -->
- Source: docs/specs/command-surfaces.spec.md:250
- Summary: A fresh consumer can ask Cautilus what declared behavior claims still need proof before writing eval fixtures.
- Excerpt: A fresh consumer can ask Cautilus what declared behavior claims still need proof before writing eval fixtures.
- Current labels: proofLayer=cautilus-eval; recommendedProof=cautilus-eval; recommendedEvalSurface=dev/repo; readiness=ready-to-verify; reviewStatus=heuristic; evidenceStatus=unknown
- Group hints: cautilus-eval, spec, dev/repo, linked-from:docs/master-plan.md
- Current next action: Create a host-owned dev/repo fixture and run it through cautilus eval test.
- Why this layer: The claim depends on model, agent, prompt, skill, workflow, or behavior execution evidence.
- Human claim quality: TODO
- Human corrected proof layer: keep
- Human corrected eval surface: keep
- Human readiness: keep
- Human priority: TODO
- Duplicate of:
- Notes:

### 237 claim-docs-specs-command-surfaces-spec-md-251
<!-- claim-id: claim-docs-specs-command-surfaces-spec-md-251 -->
- Source: docs/specs/command-surfaces.spec.md:251
- Summary: A proof plan can distinguish human-auditable, deterministic, eval-backed, scenario-candidate, and alignment-work claims.
- Excerpt: A proof plan can distinguish human-auditable, deterministic, eval-backed, scenario-candidate, and alignment-work claims.
- Current labels: proofLayer=deterministic; recommendedProof=deterministic; recommendedEvalSurface=n/a; readiness=ready-to-verify; reviewStatus=heuristic; evidenceStatus=unknown
- Group hints: deterministic, spec, linked-from:docs/master-plan.md
- Current next action: Keep or add a repo-owned unit, lint, build, schema, or CI check for this claim.
- Why this layer: The claim names a deterministic gate or static contract that should be protected outside Cautilus eval.
- Human claim quality: TODO
- Human corrected proof layer: keep
- Human corrected eval surface: keep
- Human readiness: keep
- Human priority: TODO
- Duplicate of:
- Notes:

### 238 claim-docs-specs-command-surfaces-spec-md-254
<!-- claim-id: claim-docs-specs-command-surfaces-spec-md-254 -->
- Source: docs/specs/command-surfaces.spec.md:254
- Summary: Existing `eval` and `optimize` behavior remains backward compatible while the first deterministic `claim` surface lands.
- Excerpt: Existing `eval` and `optimize` behavior remains backward compatible while the first deterministic `claim` surface lands.
- Current labels: proofLayer=deterministic; recommendedProof=deterministic; recommendedEvalSurface=n/a; readiness=ready-to-verify; reviewStatus=heuristic; evidenceStatus=unknown
- Group hints: deterministic, spec, linked-from:docs/master-plan.md
- Current next action: Keep or add a repo-owned unit, lint, build, schema, or CI check for this claim.
- Why this layer: The claim names a deterministic gate or static contract that should be protected outside Cautilus eval.
- Human claim quality: TODO
- Human corrected proof layer: keep
- Human corrected eval surface: keep
- Human readiness: keep
- Human priority: TODO
- Duplicate of:
- Notes:

### 239 claim-docs-specs-command-surfaces-spec-md-271
<!-- claim-id: claim-docs-specs-command-surfaces-spec-md-271 -->
- Source: docs/specs/command-surfaces.spec.md:271
- Summary: a CLI smoke test that discovers claims from a tiny temp repo with README, AGENTS.md, and one deterministic-test-like claim
- Excerpt: a CLI smoke test that discovers claims from a tiny temp repo with README, AGENTS.md, and one deterministic-test-like claim
- Current labels: proofLayer=deterministic; recommendedProof=deterministic; recommendedEvalSurface=n/a; readiness=ready-to-verify; reviewStatus=heuristic; evidenceStatus=unknown
- Group hints: deterministic, spec, linked-from:docs/master-plan.md
- Current next action: Keep or add a repo-owned unit, lint, build, schema, or CI check for this claim.
- Why this layer: The claim names a deterministic gate or static contract that should be protected outside Cautilus eval.
- Human claim quality: TODO
- Human corrected proof layer: keep
- Human corrected eval surface: keep
- Human readiness: keep
- Human priority: TODO
- Duplicate of:
- Notes:

### 240 claim-docs-specs-command-surfaces-spec-md-273
<!-- claim-id: claim-docs-specs-command-surfaces-spec-md-273 -->
- Source: docs/specs/command-surfaces.spec.md:273
- Summary: public spec proof that the command can emit at least one `human-auditable`, one `deterministic`, and one `cautilus-eval` candidate from checked-in fixtures
- Excerpt: public spec proof that the command can emit at least one `human-auditable`, one `deterministic`, and one `cautilus-eval` candidate from checked-in fixtures
- Current labels: proofLayer=scenario-candidate; recommendedProof=cautilus-eval; recommendedEvalSurface=n/a; readiness=needs-scenario; reviewStatus=heuristic; evidenceStatus=unknown
- Group hints: cautilus-eval, spec, needs-scenario, linked-from:docs/master-plan.md
- Current next action: Use the scenario proposal flow to normalize candidate evidence before creating a checked-in eval fixture.
- Why this layer: The claim points at scenario or proposal work before it is ready as a protected eval fixture.
- Human claim quality: TODO
- Human corrected proof layer: keep
- Human corrected eval surface: keep
- Human readiness: keep
- Human priority: TODO
- Duplicate of:
- Notes:

### 241 claim-docs-specs-command-surfaces-spec-md-278
<!-- claim-id: claim-docs-specs-command-surfaces-spec-md-278 -->
- Source: docs/specs/command-surfaces.spec.md:278
- Summary: Countermeasure: first slice emits source-ref-backed proof plans and keeps model-backed extraction out until a runner boundary exists.
- Excerpt: Countermeasure: first slice emits source-ref-backed proof plans and keeps model-backed extraction out until a runner boundary exists.
- Current labels: proofLayer=cautilus-eval; recommendedProof=cautilus-eval; recommendedEvalSurface=dev/repo; readiness=ready-to-verify; reviewStatus=heuristic; evidenceStatus=unknown
- Group hints: cautilus-eval, spec, dev/repo, linked-from:docs/master-plan.md
- Current next action: Create a host-owned dev/repo fixture and run it through cautilus eval test.
- Why this layer: The claim depends on model, agent, prompt, skill, workflow, or behavior execution evidence.
- Human claim quality: TODO
- Human corrected proof layer: keep
- Human corrected eval surface: keep
- Human readiness: keep
- Human priority: TODO
- Duplicate of:
- Notes:

### 242 claim-docs-specs-command-surfaces-spec-md-281
<!-- claim-id: claim-docs-specs-command-surfaces-spec-md-281 -->
- Source: docs/specs/command-surfaces.spec.md:281
- Summary: Countermeasure: `proofLayer` is required, and deterministic claims must point away from eval fixtures.
- Excerpt: Countermeasure: `proofLayer` is required, and deterministic claims must point away from eval fixtures.
- Current labels: proofLayer=deterministic; recommendedProof=deterministic; recommendedEvalSurface=n/a; readiness=ready-to-verify; reviewStatus=heuristic; evidenceStatus=unknown
- Group hints: deterministic, spec, linked-from:docs/master-plan.md
- Current next action: Keep or add a repo-owned unit, lint, build, schema, or CI check for this claim.
- Why this layer: The claim names a deterministic gate or static contract that should be protected outside Cautilus eval.
- Human claim quality: TODO
- Human corrected proof layer: keep
- Human corrected eval surface: keep
- Human readiness: keep
- Human priority: TODO
- Duplicate of:
- Notes:

### 243 claim-docs-specs-current-product-spec-md-3
<!-- claim-id: claim-docs-specs-current-product-spec-md-3 -->
- Source: docs/specs/current-product.spec.md:3
- Summary: `Cautilus` currently helps an operator do one concrete job: turn recent behavior evidence into a bounded evaluation decision that can be reopened from files without redoing the whole analysis.
- Excerpt: `Cautilus` currently helps an operator do one concrete job: turn recent behavior evidence into a bounded evaluation decision that can be reopened from files without redoing the whole analysis.
- Current labels: proofLayer=cautilus-eval; recommendedProof=cautilus-eval; recommendedEvalSurface=dev/repo; readiness=ready-to-verify; reviewStatus=heuristic; evidenceStatus=unknown
- Group hints: cautilus-eval, spec, dev/repo, linked-from:docs/specs/index.spec.md
- Current next action: Create a host-owned dev/repo fixture and run it through cautilus eval test.
- Why this layer: The claim depends on model, agent, prompt, skill, workflow, or behavior execution evidence.
- Human claim quality: TODO
- Human corrected proof layer: keep
- Human corrected eval surface: keep
- Human readiness: keep
- Human priority: TODO
- Duplicate of:
- Notes:

### 244 claim-docs-specs-current-product-spec-md-9
<!-- claim-id: claim-docs-specs-current-product-spec-md-9 -->
- Source: docs/specs/current-product.spec.md:9
- Summary: reopen scenario-adjacent chatbot conversations in a review packet that stays tied to proposal work
- Excerpt: reopen scenario-adjacent chatbot conversations in a review packet that stays tied to proposal work
- Current labels: proofLayer=scenario-candidate; recommendedProof=cautilus-eval; recommendedEvalSurface=n/a; readiness=needs-scenario; reviewStatus=heuristic; evidenceStatus=unknown
- Group hints: cautilus-eval, spec, needs-scenario, linked-from:docs/specs/index.spec.md
- Current next action: Use the scenario proposal flow to normalize candidate evidence before creating a checked-in eval fixture.
- Why this layer: The claim points at scenario or proposal work before it is ready as a protected eval fixture.
- Human claim quality: TODO
- Human corrected proof layer: keep
- Human corrected eval surface: keep
- Human readiness: keep
- Human priority: TODO
- Duplicate of:
- Notes:

### 245 claim-docs-specs-current-product-spec-md-16
<!-- claim-id: claim-docs-specs-current-product-spec-md-16 -->
- Source: docs/specs/current-product.spec.md:16
- Summary: It is the mechanism that keeps the decision durable, inspectable, and reusable across CLI, review, and HTML surfaces.
- Excerpt: It is the mechanism that keeps the decision durable, inspectable, and reusable across CLI, review, and HTML surfaces.
- Current labels: proofLayer=human-auditable; recommendedProof=human-auditable; recommendedEvalSurface=n/a; readiness=ready-to-verify; reviewStatus=heuristic; evidenceStatus=unknown
- Group hints: human-auditable, spec, linked-from:docs/specs/index.spec.md
- Current next action: Record the source reference and keep it human-auditable; add deterministic or eval proof only if behavior depends on execution.
- Why this layer: The claim can be checked by reading current source, docs, or generated artifacts.
- Human claim quality: TODO
- Human corrected proof layer: keep
- Human corrected eval surface: keep
- Human readiness: keep
- Human priority: TODO
- Duplicate of:
- Notes:

### 246 claim-docs-specs-current-product-spec-md-50
<!-- claim-id: claim-docs-specs-current-product-spec-md-50 -->
- Source: docs/specs/current-product.spec.md:50
- Summary: The current product should be able to turn checked-in fixture data into one reusable evaluation decision without any LLM call.
- Excerpt: The current product should be able to turn checked-in fixture data into one reusable evaluation decision without any LLM call.
- Current labels: proofLayer=cautilus-eval; recommendedProof=cautilus-eval; recommendedEvalSurface=dev/repo; readiness=ready-to-verify; reviewStatus=heuristic; evidenceStatus=unknown
- Group hints: cautilus-eval, spec, dev/repo, linked-from:docs/specs/index.spec.md
- Current next action: Create a host-owned dev/repo fixture and run it through cautilus eval test.
- Why this layer: The claim depends on model, agent, prompt, skill, workflow, or behavior execution evidence.
- Human claim quality: TODO
- Human corrected proof layer: keep
- Human corrected eval surface: keep
- Human readiness: keep
- Human priority: TODO
- Duplicate of:
- Notes:

### 247 claim-docs-specs-git-precondition-spec-md-8
<!-- claim-id: claim-docs-specs-git-precondition-spec-md-8 -->
- Source: docs/specs/git-precondition.spec.md:8
- Summary: The deeper backend behavior is covered by lower-level tests, but the public command contract should still reject invalid runtime names before doing work.
- Excerpt: The deeper backend behavior is covered by lower-level tests, but the public command contract should still reject invalid runtime names before doing work.
- Current labels: proofLayer=cautilus-eval; recommendedProof=cautilus-eval; recommendedEvalSurface=dev/repo; readiness=ready-to-verify; reviewStatus=heuristic; evidenceStatus=unknown
- Group hints: cautilus-eval, spec, dev/repo, linked-from:docs/specs/index.spec.md
- Current next action: Create a host-owned dev/repo fixture and run it through cautilus eval test.
- Why this layer: The claim depends on model, agent, prompt, skill, workflow, or behavior execution evidence.
- Human claim quality: TODO
- Human corrected proof layer: keep
- Human corrected eval surface: keep
- Human readiness: keep
- Human priority: TODO
- Duplicate of:
- Notes:

### 248 claim-docs-specs-html-report-spec-md-3
<!-- claim-id: claim-docs-specs-html-report-spec-md-3 -->
- Source: docs/specs/html-report.spec.md:3
- Summary: `Cautilus` ships static HTML views so a human can answer one practical question in a browser: what happened in this evaluation, and what should I trust or revisit next?
- Excerpt: `Cautilus` ships static HTML views so a human can answer one practical question in a browser: what happened in this evaluation, and what should I trust or revisit next?
- Current labels: proofLayer=human-auditable; recommendedProof=human-auditable; recommendedEvalSurface=n/a; readiness=ready-to-verify; reviewStatus=heuristic; evidenceStatus=unknown
- Group hints: human-auditable, spec, linked-from:docs/maintainers/operator-acceptance.md
- Current next action: Record the source reference and keep it human-auditable; add deterministic or eval proof only if behavior depends on execution.
- Why this layer: The claim can be checked by reading current source, docs, or generated artifacts.
- Human claim quality: TODO
- Human corrected proof layer: keep
- Human corrected eval surface: keep
- Human readiness: keep
- Human priority: TODO
- Duplicate of:
- Notes:

### 249 claim-docs-specs-html-report-spec-md-31
<!-- claim-id: claim-docs-specs-html-report-spec-md-31 -->
- Source: docs/specs/html-report.spec.md:31
- Summary: Which proposal, finding, or evidence signal should I inspect first?
- Excerpt: Which proposal, finding, or evidence signal should I inspect first?
- Current labels: proofLayer=scenario-candidate; recommendedProof=cautilus-eval; recommendedEvalSurface=n/a; readiness=needs-scenario; reviewStatus=heuristic; evidenceStatus=unknown
- Group hints: cautilus-eval, spec, needs-scenario, linked-from:docs/maintainers/operator-acceptance.md
- Current next action: Use the scenario proposal flow to normalize candidate evidence before creating a checked-in eval fixture.
- Why this layer: The claim points at scenario or proposal work before it is ready as a protected eval fixture.
- Human claim quality: TODO
- Human corrected proof layer: keep
- Human corrected eval surface: keep
- Human readiness: keep
- Human priority: TODO
- Duplicate of:
- Notes:

### 250 claim-docs-specs-self-dogfood-spec-md-9
<!-- claim-id: claim-docs-specs-self-dogfood-spec-md-9 -->
- Source: docs/specs/self-dogfood.spec.md:9
- Summary: It should not pretend that every stronger binary, skill, or review claim is part of the standing gate.
- Excerpt: It should not pretend that every stronger binary, skill, or review claim is part of the standing gate.
- Current labels: proofLayer=cautilus-eval; recommendedProof=cautilus-eval; recommendedEvalSurface=dev/skill; readiness=ready-to-verify; reviewStatus=heuristic; evidenceStatus=unknown
- Group hints: cautilus-eval, spec, dev/skill, linked-from:docs/specs/index.spec.md
- Current next action: Create a host-owned dev/skill fixture and run it through cautilus eval test.
- Why this layer: The claim depends on model, agent, prompt, skill, workflow, or behavior execution evidence.
- Human claim quality: TODO
- Human corrected proof layer: keep
- Human corrected eval surface: keep
- Human readiness: keep
- Human priority: TODO
- Duplicate of:
- Notes:

### 251 claim-docs-specs-standalone-surface-spec-md-3
<!-- claim-id: claim-docs-specs-standalone-surface-spec-md-3 -->
- Source: docs/specs/standalone-surface.spec.md:3
- Summary: `Cautilus` should make sense as a standalone binary plus a bundled skill.
- Excerpt: `Cautilus` should make sense as a standalone binary plus a bundled skill.
- Current labels: proofLayer=cautilus-eval; recommendedProof=cautilus-eval; recommendedEvalSurface=dev/skill; readiness=ready-to-verify; reviewStatus=heuristic; evidenceStatus=unknown
- Group hints: cautilus-eval, spec, dev/skill, linked-from:docs/specs/index.spec.md
- Current next action: Create a host-owned dev/skill fixture and run it through cautilus eval test.
- Why this layer: The claim depends on model, agent, prompt, skill, workflow, or behavior execution evidence.
- Human claim quality: TODO
- Human corrected proof layer: keep
- Human corrected eval surface: keep
- Human readiness: keep
- Human priority: TODO
- Duplicate of:
- Notes:

### 252 claim-docs-specs-standalone-surface-spec-md-4
<!-- claim-id: claim-docs-specs-standalone-surface-spec-md-4 -->
- Source: docs/specs/standalone-surface.spec.md:4
- Summary: The product should not need a host-specific migration story before an operator can discover the command surface, install the skill, and run readiness checks in a fresh repo.
- Excerpt: The product should not need a host-specific migration story before an operator can discover the command surface, install the skill, and run readiness checks in a fresh repo.
- Current labels: proofLayer=cautilus-eval; recommendedProof=cautilus-eval; recommendedEvalSurface=dev/skill; readiness=ready-to-verify; reviewStatus=heuristic; evidenceStatus=unknown
- Group hints: cautilus-eval, spec, dev/skill, linked-from:docs/specs/index.spec.md
- Current next action: Create a host-owned dev/skill fixture and run it through cautilus eval test.
- Why this layer: The claim depends on model, agent, prompt, skill, workflow, or behavior execution evidence.
- Human claim quality: TODO
- Human corrected proof layer: keep
- Human corrected eval surface: keep
- Human readiness: keep
- Human priority: TODO
- Duplicate of:
- Notes:

### 253 claim-docs-specs-standalone-surface-spec-md-14
<!-- claim-id: claim-docs-specs-standalone-surface-spec-md-14 -->
- Source: docs/specs/standalone-surface.spec.md:14
- Summary: `cautilus install` materializes the same product surface for an in-repo assistant, while the operator still uses the CLI directly.
- Excerpt: `cautilus install` materializes the same product surface for an in-repo assistant, while the operator still uses the CLI directly.
- Current labels: proofLayer=cautilus-eval; recommendedProof=cautilus-eval; recommendedEvalSurface=app/chat; readiness=ready-to-verify; reviewStatus=heuristic; evidenceStatus=unknown
- Group hints: cautilus-eval, spec, app/chat, linked-from:docs/specs/index.spec.md
- Current next action: Create a host-owned app/chat fixture and run it through cautilus eval test.
- Why this layer: The claim depends on model, agent, prompt, skill, workflow, or behavior execution evidence.
- Human claim quality: TODO
- Human corrected proof layer: keep
- Human corrected eval surface: keep
- Human readiness: keep
- Human priority: TODO
- Duplicate of:
- Notes:

### 254 claim-docs-contracts-live-run-invocation-batch-md-77
<!-- claim-id: claim-docs-contracts-live-run-invocation-batch-md-77 -->
- Source: docs/contracts/live-run-invocation-batch.md:77
- Summary: For each kept scenario, the command expands `samplesPerScenario` into deterministic request ids and emits the canonical batch request packet.
- Excerpt: For each kept scenario, the command expands `samplesPerScenario` into deterministic request ids and emits the canonical batch request packet.
- Current labels: proofLayer=deterministic; recommendedProof=deterministic; recommendedEvalSurface=n/a; readiness=ready-to-verify; reviewStatus=heuristic; evidenceStatus=unknown
- Group hints: deterministic, contract, linked-from:docs/contracts/live-run-invocation.md
- Current next action: Keep or add a repo-owned unit, lint, build, schema, or CI check for this claim.
- Why this layer: The claim names a deterministic gate or static contract that should be protected outside Cautilus eval.
- Human claim quality: TODO
- Human corrected proof layer: keep
- Human corrected eval surface: keep
- Human readiness: keep
- Human priority: TODO
- Duplicate of:
- Notes:

### 255 claim-docs-contracts-live-run-invocation-batch-md-104
<!-- claim-id: claim-docs-contracts-live-run-invocation-batch-md-104 -->
- Source: docs/contracts/live-run-invocation-batch.md:104
- Summary: When `requiredTags` is present, the prep command keeps only candidates that include every required tag exactly.
- Excerpt: When `requiredTags` is present, the prep command keeps only candidates that include every required tag exactly.
- Current labels: proofLayer=scenario-candidate; recommendedProof=cautilus-eval; recommendedEvalSurface=n/a; readiness=needs-scenario; reviewStatus=heuristic; evidenceStatus=unknown
- Group hints: cautilus-eval, contract, needs-scenario, linked-from:docs/contracts/live-run-invocation.md
- Current next action: Use the scenario proposal flow to normalize candidate evidence before creating a checked-in eval fixture.
- Why this layer: The claim points at scenario or proposal work before it is ready as a protected eval fixture.
- Human claim quality: TODO
- Human corrected proof layer: keep
- Human corrected eval surface: keep
- Human readiness: keep
- Human priority: TODO
- Duplicate of:
- Notes:

### 256 claim-docs-contracts-optimization-md-27
<!-- claim-id: claim-docs-contracts-optimization-md-27 -->
- Source: docs/contracts/optimization.md:27
- Summary: evidence provenance so later review can trace each proposal back to an explicit packet and locator
- Excerpt: evidence provenance so later review can trace each proposal back to an explicit packet and locator
- Current labels: proofLayer=scenario-candidate; recommendedProof=cautilus-eval; recommendedEvalSurface=n/a; readiness=needs-scenario; reviewStatus=heuristic; evidenceStatus=unknown
- Group hints: cautilus-eval, contract, needs-scenario, linked-from:docs/contracts/active-run.md
- Current next action: Use the scenario proposal flow to normalize candidate evidence before creating a checked-in eval fixture.
- Why this layer: The claim points at scenario or proposal work before it is ready as a protected eval fixture.
- Human claim quality: TODO
- Human corrected proof layer: keep
- Human corrected eval surface: keep
- Human readiness: keep
- Human priority: TODO
- Duplicate of:
- Notes:

### 257 claim-docs-contracts-optimization-md-34
<!-- claim-id: claim-docs-contracts-optimization-md-34 -->
- Source: docs/contracts/optimization.md:34
- Summary: The optimizer still emits one bounded next-revision brief, not a compile loop.
- Excerpt: The optimizer still emits one bounded next-revision brief, not a compile loop.
- Current labels: proofLayer=deterministic; recommendedProof=deterministic; recommendedEvalSurface=n/a; readiness=ready-to-verify; reviewStatus=heuristic; evidenceStatus=unknown
- Group hints: deterministic, contract, linked-from:docs/contracts/active-run.md
- Current next action: Keep or add a repo-owned unit, lint, build, schema, or CI check for this claim.
- Why this layer: The claim names a deterministic gate or static contract that should be protected outside Cautilus eval.
- Human claim quality: TODO
- Human corrected proof layer: keep
- Human corrected eval surface: keep
- Human readiness: keep
- Human priority: TODO
- Duplicate of:
- Notes:

### 258 claim-docs-contracts-optimization-md-37
<!-- claim-id: claim-docs-contracts-optimization-md-37 -->
- Source: docs/contracts/optimization.md:37
- Summary: Runtime fingerprint changes can become optimization context without becoming a separate refresh workflow; see [runtime-fingerprint-optimization.md](./runtime-fingerprint-optimization.md).
- Excerpt: Runtime fingerprint changes can become optimization context without becoming a separate refresh workflow; see [runtime-fingerprint-optimization.md](./runtime-fingerprint-optimization.md).
- Current labels: proofLayer=cautilus-eval; recommendedProof=cautilus-eval; recommendedEvalSurface=dev/repo; readiness=ready-to-verify; reviewStatus=heuristic; evidenceStatus=unknown
- Group hints: cautilus-eval, contract, dev/repo, linked-from:docs/contracts/active-run.md
- Current next action: Create a host-owned dev/repo fixture and run it through cautilus eval test.
- Why this layer: The claim depends on model, agent, prompt, skill, workflow, or behavior execution evidence.
- Human claim quality: TODO
- Human corrected proof layer: keep
- Human corrected eval surface: keep
- Human readiness: keep
- Human priority: TODO
- Duplicate of:
- Notes:

### 259 claim-docs-contracts-optimization-md-38
<!-- claim-id: claim-docs-contracts-optimization-md-38 -->
- Source: docs/contracts/optimization.md:38
- Summary: Shorter and less specialized prompts should win only after behavior, held-out, comparison, and review guardrails remain satisfied.
- Excerpt: Shorter and less specialized prompts should win only after behavior, held-out, comparison, and review guardrails remain satisfied.
- Current labels: proofLayer=cautilus-eval; recommendedProof=cautilus-eval; recommendedEvalSurface=app/prompt; readiness=ready-to-verify; reviewStatus=heuristic; evidenceStatus=unknown
- Group hints: cautilus-eval, contract, app/prompt, linked-from:docs/contracts/active-run.md
- Current next action: Create a host-owned app/prompt fixture and run it through cautilus eval test.
- Why this layer: The claim depends on model, agent, prompt, skill, workflow, or behavior execution evidence.
- Human claim quality: TODO
- Human corrected proof layer: keep
- Human corrected eval surface: keep
- Human readiness: keep
- Human priority: TODO
- Duplicate of:
- Notes:

### 260 claim-docs-contracts-optimization-md-96
<!-- claim-id: claim-docs-contracts-optimization-md-96 -->
- Source: docs/contracts/optimization.md:96
- Summary: The proposal should include:
- Excerpt: The proposal should include:
- Current labels: proofLayer=scenario-candidate; recommendedProof=cautilus-eval; recommendedEvalSurface=n/a; readiness=needs-scenario; reviewStatus=heuristic; evidenceStatus=unknown
- Group hints: cautilus-eval, contract, needs-scenario, linked-from:docs/contracts/active-run.md
- Current next action: Use the scenario proposal flow to normalize candidate evidence before creating a checked-in eval fixture.
- Why this layer: The claim points at scenario or proposal work before it is ready as a protected eval fixture.
- Human claim quality: TODO
- Human corrected proof layer: keep
- Human corrected eval surface: keep
- Human readiness: keep
- Human priority: TODO
- Duplicate of:
- Notes:

### 261 claim-docs-contracts-optimization-md-122
<!-- claim-id: claim-docs-contracts-optimization-md-122 -->
- Source: docs/contracts/optimization.md:122
- Summary: The resulting proposal can be materialized into one durable revision artifact:
- Excerpt: The resulting proposal can be materialized into one durable revision artifact:
- Current labels: proofLayer=scenario-candidate; recommendedProof=cautilus-eval; recommendedEvalSurface=n/a; readiness=needs-scenario; reviewStatus=heuristic; evidenceStatus=unknown
- Group hints: cautilus-eval, contract, needs-scenario, linked-from:docs/contracts/active-run.md
- Current next action: Use the scenario proposal flow to normalize candidate evidence before creating a checked-in eval fixture.
- Why this layer: The claim points at scenario or proposal work before it is ready as a protected eval fixture.
- Human claim quality: TODO
- Human corrected proof layer: keep
- Human corrected eval surface: keep
- Human readiness: keep
- Human priority: TODO
- Duplicate of:
- Notes:

### 262 claim-docs-contracts-optimization-md-132
<!-- claim-id: claim-docs-contracts-optimization-md-132 -->
- Source: docs/contracts/optimization.md:132
- Summary: `optimize prepare-input` keeps a shared behavior-intent profile above raw prompt or adapter mechanics.
- Excerpt: `optimize prepare-input` keeps a shared behavior-intent profile above raw prompt or adapter mechanics.
- Current labels: proofLayer=cautilus-eval; recommendedProof=cautilus-eval; recommendedEvalSurface=app/prompt; readiness=ready-to-verify; reviewStatus=heuristic; evidenceStatus=unknown
- Group hints: cautilus-eval, contract, app/prompt, linked-from:docs/contracts/active-run.md
- Current next action: Create a host-owned app/prompt fixture and run it through cautilus eval test.
- Why this layer: The claim depends on model, agent, prompt, skill, workflow, or behavior execution evidence.
- Human claim quality: TODO
- Human corrected proof layer: keep
- Human corrected eval surface: keep
- Human readiness: keep
- Human priority: TODO
- Duplicate of:
- Notes:

### 263 claim-docs-contracts-optimization-md-151
<!-- claim-id: claim-docs-contracts-optimization-md-151 -->
- Source: docs/contracts/optimization.md:151
- Summary: Update the optimize input builder, optimize proposal generator, revision artifact builder, schemas, fixtures, and flow tests so the optimize seam keeps one durable packet for the next bounded revision.
- Excerpt: Update the optimize input builder, optimize proposal generator, revision artifact builder, schemas, fixtures, and flow tests so the optimize seam keeps one durable packet for the next bounded revision.
- Current labels: proofLayer=deterministic; recommendedProof=deterministic; recommendedEvalSurface=n/a; readiness=ready-to-verify; reviewStatus=heuristic; evidenceStatus=unknown
- Group hints: deterministic, contract, linked-from:docs/contracts/active-run.md
- Current next action: Keep or add a repo-owned unit, lint, build, schema, or CI check for this claim.
- Why this layer: The claim names a deterministic gate or static contract that should be protected outside Cautilus eval.
- Human claim quality: TODO
- Human corrected proof layer: keep
- Human corrected eval surface: keep
- Human readiness: keep
- Human priority: TODO
- Duplicate of:
- Notes:

### 264 claim-docs-contracts-scenario-proposal-sources-md-3
<!-- claim-id: claim-docs-contracts-scenario-proposal-sources-md-3 -->
- Source: docs/contracts/scenario-proposal-sources.md:3
- Summary: `Cautilus` should eventually propose new or refreshed evaluation scenarios from recent operator activity and recent runtime outcomes, but the product boundary must stay independent from any one host repo's storage layout.
- Excerpt: `Cautilus` should eventually propose new or refreshed evaluation scenarios from recent operator activity and recent runtime outcomes, but the product boundary must stay independent from any one host repo's storage layout.
- Current labels: proofLayer=scenario-candidate; recommendedProof=cautilus-eval; recommendedEvalSurface=n/a; readiness=needs-scenario; reviewStatus=heuristic; evidenceStatus=unknown
- Group hints: cautilus-eval, contract, needs-scenario, linked-from:docs/contracts/scenario-history.md
- Current next action: Use the scenario proposal flow to normalize candidate evidence before creating a checked-in eval fixture.
- Why this layer: The claim points at scenario or proposal work before it is ready as a protected eval fixture.
- Human claim quality: TODO
- Human corrected proof layer: keep
- Human corrected eval surface: keep
- Human readiness: keep
- Human priority: TODO
- Duplicate of:
- Notes:

### 265 claim-docs-contracts-scenario-proposal-sources-md-5
<!-- claim-id: claim-docs-contracts-scenario-proposal-sources-md-5 -->
- Source: docs/contracts/scenario-proposal-sources.md:5
- Summary: This contract defines the source ports and output payload that a scenario proposal engine can rely on before `Cautilus` imports any host-specific log mining code.
- Excerpt: This contract defines the source ports and output payload that a scenario proposal engine can rely on before `Cautilus` imports any host-specific log mining code.
- Current labels: proofLayer=scenario-candidate; recommendedProof=cautilus-eval; recommendedEvalSurface=n/a; readiness=needs-scenario; reviewStatus=heuristic; evidenceStatus=unknown
- Group hints: cautilus-eval, contract, needs-scenario, linked-from:docs/contracts/scenario-history.md
- Current next action: Use the scenario proposal flow to normalize candidate evidence before creating a checked-in eval fixture.
- Why this layer: The claim points at scenario or proposal work before it is ready as a protected eval fixture.
- Human claim quality: TODO
- Human corrected proof layer: keep
- Human corrected eval surface: keep
- Human readiness: keep
- Human priority: TODO
- Duplicate of:
- Notes:

### 266 claim-docs-contracts-scenario-proposal-sources-md-28
<!-- claim-id: claim-docs-contracts-scenario-proposal-sources-md-28 -->
- Source: docs/contracts/scenario-proposal-sources.md:28
- Summary: Those helpers should sit between source-port ingestion and proposal packet generation.
- Excerpt: Those helpers should sit between source-port ingestion and proposal packet generation.
- Current labels: proofLayer=scenario-candidate; recommendedProof=cautilus-eval; recommendedEvalSurface=n/a; readiness=needs-scenario; reviewStatus=heuristic; evidenceStatus=unknown
- Group hints: cautilus-eval, contract, needs-scenario, linked-from:docs/contracts/scenario-history.md
- Current next action: Use the scenario proposal flow to normalize candidate evidence before creating a checked-in eval fixture.
- Why this layer: The claim points at scenario or proposal work before it is ready as a protected eval fixture.
- Human claim quality: TODO
- Human corrected proof layer: keep
- Human corrected eval surface: keep
- Human readiness: keep
- Human priority: TODO
- Duplicate of:
- Notes:

### 267 claim-docs-contracts-scenario-proposal-sources-md-40
<!-- claim-id: claim-docs-contracts-scenario-proposal-sources-md-40 -->
- Source: docs/contracts/scenario-proposal-sources.md:40
- Summary: The proposal engine should read from four source ports.
- Excerpt: The proposal engine should read from four source ports.
- Current labels: proofLayer=scenario-candidate; recommendedProof=cautilus-eval; recommendedEvalSurface=n/a; readiness=needs-scenario; reviewStatus=heuristic; evidenceStatus=unknown
- Group hints: cautilus-eval, contract, needs-scenario, linked-from:docs/contracts/scenario-history.md
- Current next action: Use the scenario proposal flow to normalize candidate evidence before creating a checked-in eval fixture.
- Why this layer: The claim points at scenario or proposal work before it is ready as a protected eval fixture.
- Human claim quality: TODO
- Human corrected proof layer: keep
- Human corrected eval surface: keep
- Human readiness: keep
- Human priority: TODO
- Duplicate of:
- Notes:

### 268 claim-docs-contracts-scenario-proposal-sources-md-81
<!-- claim-id: claim-docs-contracts-scenario-proposal-sources-md-81 -->
- Source: docs/contracts/scenario-proposal-sources.md:81
- Summary: The current checked-in scenario set so the engine can decide between `add_new_scenario` and `refresh_existing_scenario`.
- Excerpt: The current checked-in scenario set so the engine can decide between `add_new_scenario` and `refresh_existing_scenario`.
- Current labels: proofLayer=scenario-candidate; recommendedProof=cautilus-eval; recommendedEvalSurface=n/a; readiness=needs-scenario; reviewStatus=heuristic; evidenceStatus=unknown
- Group hints: cautilus-eval, contract, needs-scenario, linked-from:docs/contracts/scenario-history.md
- Current next action: Use the scenario proposal flow to normalize candidate evidence before creating a checked-in eval fixture.
- Why this layer: The claim points at scenario or proposal work before it is ready as a protected eval fixture.
- Human claim quality: TODO
- Human corrected proof layer: keep
- Human corrected eval surface: keep
- Human readiness: keep
- Human priority: TODO
- Duplicate of:
- Notes:

### 269 claim-docs-contracts-scenario-proposal-sources-md-95
<!-- claim-id: claim-docs-contracts-scenario-proposal-sources-md-95 -->
- Source: docs/contracts/scenario-proposal-sources.md:95
- Summary: Recent execution counts for each scenario key so proposals can prioritize weakly covered patterns.
- Excerpt: Recent execution counts for each scenario key so proposals can prioritize weakly covered patterns.
- Current labels: proofLayer=scenario-candidate; recommendedProof=cautilus-eval; recommendedEvalSurface=n/a; readiness=needs-scenario; reviewStatus=heuristic; evidenceStatus=unknown
- Group hints: cautilus-eval, contract, needs-scenario, linked-from:docs/contracts/scenario-history.md
- Current next action: Use the scenario proposal flow to normalize candidate evidence before creating a checked-in eval fixture.
- Why this layer: The claim points at scenario or proposal work before it is ready as a protected eval fixture.
- Human claim quality: TODO
- Human corrected proof layer: keep
- Human corrected eval surface: keep
- Human readiness: keep
- Human priority: TODO
- Duplicate of:
- Notes:

### 270 claim-docs-contracts-scenario-proposal-sources-md-108
<!-- claim-id: claim-docs-contracts-scenario-proposal-sources-md-108 -->
- Source: docs/contracts/scenario-proposal-sources.md:108
- Summary: The proposal engine should emit an operator-reviewable payload like this:
- Excerpt: The proposal engine should emit an operator-reviewable payload like this:
- Current labels: proofLayer=scenario-candidate; recommendedProof=cautilus-eval; recommendedEvalSurface=n/a; readiness=needs-scenario; reviewStatus=heuristic; evidenceStatus=unknown
- Group hints: cautilus-eval, contract, needs-scenario, linked-from:docs/contracts/scenario-history.md
- Current next action: Use the scenario proposal flow to normalize candidate evidence before creating a checked-in eval fixture.
- Why this layer: The claim points at scenario or proposal work before it is ready as a protected eval fixture.
- Human claim quality: TODO
- Human corrected proof layer: keep
- Human corrected eval surface: keep
- Human readiness: keep
- Human priority: TODO
- Duplicate of:
- Notes:

### 271 claim-docs-contracts-scenario-proposal-sources-md-152
<!-- claim-id: claim-docs-contracts-scenario-proposal-sources-md-152 -->
- Source: docs/contracts/scenario-proposal-sources.md:152
- Summary: Evidence should preserve where the suggestion came from without forcing one host repo's storage model on the product.
- Excerpt: Evidence should preserve where the suggestion came from without forcing one host repo's storage model on the product.
- Current labels: proofLayer=cautilus-eval; recommendedProof=cautilus-eval; recommendedEvalSurface=dev/repo; readiness=ready-to-verify; reviewStatus=heuristic; evidenceStatus=unknown
- Group hints: cautilus-eval, contract, dev/repo, linked-from:docs/contracts/scenario-history.md
- Current next action: Create a host-owned dev/repo fixture and run it through cautilus eval test.
- Why this layer: The claim depends on model, agent, prompt, skill, workflow, or behavior execution evidence.
- Human claim quality: TODO
- Human corrected proof layer: keep
- Human corrected eval surface: keep
- Human readiness: keep
- Human priority: TODO
- Duplicate of:
- Notes:

### 272 claim-docs-contracts-scenario-proposal-sources-md-216
<!-- claim-id: claim-docs-contracts-scenario-proposal-sources-md-216 -->
- Source: docs/contracts/scenario-proposal-sources.md:216
- Summary: The draft scenario embedded in each proposal should be normalized enough for a human to accept, edit, or reject it without re-deriving the context.
- Excerpt: The draft scenario embedded in each proposal should be normalized enough for a human to accept, edit, or reject it without re-deriving the context.
- Current labels: proofLayer=scenario-candidate; recommendedProof=cautilus-eval; recommendedEvalSurface=n/a; readiness=needs-scenario; reviewStatus=heuristic; evidenceStatus=unknown
- Group hints: cautilus-eval, contract, needs-scenario, linked-from:docs/contracts/scenario-history.md
- Current next action: Use the scenario proposal flow to normalize candidate evidence before creating a checked-in eval fixture.
- Why this layer: The claim points at scenario or proposal work before it is ready as a protected eval fixture.
- Human claim quality: TODO
- Human corrected proof layer: keep
- Human corrected eval surface: keep
- Human readiness: keep
- Human priority: TODO
- Duplicate of:
- Notes:

### 273 claim-docs-contracts-scenario-proposal-sources-md-235
<!-- claim-id: claim-docs-contracts-scenario-proposal-sources-md-235 -->
- Source: docs/contracts/scenario-proposal-sources.md:235
- Summary: The canonical machine-readable output should preserve the full ranked proposal list.
- Excerpt: The canonical machine-readable output should preserve the full ranked proposal list.
- Current labels: proofLayer=scenario-candidate; recommendedProof=cautilus-eval; recommendedEvalSurface=n/a; readiness=needs-scenario; reviewStatus=heuristic; evidenceStatus=unknown
- Group hints: cautilus-eval, contract, needs-scenario, linked-from:docs/contracts/scenario-history.md
- Current next action: Use the scenario proposal flow to normalize candidate evidence before creating a checked-in eval fixture.
- Why this layer: The claim points at scenario or proposal work before it is ready as a protected eval fixture.
- Human claim quality: TODO
- Human corrected proof layer: keep
- Human corrected eval surface: keep
- Human readiness: keep
- Human priority: TODO
- Duplicate of:
- Notes:

### 274 claim-docs-contracts-scenario-proposal-sources-md-236
<!-- claim-id: claim-docs-contracts-scenario-proposal-sources-md-236 -->
- Source: docs/contracts/scenario-proposal-sources.md:236
- Summary: Human-facing views may derive a smaller attention set, but they should not hide the full ranked result from agents.
- Excerpt: Human-facing views may derive a smaller attention set, but they should not hide the full ranked result from agents.
- Current labels: proofLayer=cautilus-eval; recommendedProof=cautilus-eval; recommendedEvalSurface=dev/repo; readiness=ready-to-verify; reviewStatus=heuristic; evidenceStatus=unknown
- Group hints: cautilus-eval, contract, dev/repo, linked-from:docs/contracts/scenario-history.md
- Current next action: Create a host-owned dev/repo fixture and run it through cautilus eval test.
- Why this layer: The claim depends on model, agent, prompt, skill, workflow, or behavior execution evidence.
- Human claim quality: TODO
- Human corrected proof layer: keep
- Human corrected eval surface: keep
- Human readiness: keep
- Human priority: TODO
- Duplicate of:
- Notes:

### 275 claim-docs-contracts-scenario-proposal-sources-md-240
<!-- claim-id: claim-docs-contracts-scenario-proposal-sources-md-240 -->
- Source: docs/contracts/scenario-proposal-sources.md:240
- Summary: Proposal generation should depend on normalized source ports, not direct host repo file traversal baked into `Cautilus`.
- Excerpt: Proposal generation should depend on normalized source ports, not direct host repo file traversal baked into `Cautilus`.
- Current labels: proofLayer=scenario-candidate; recommendedProof=cautilus-eval; recommendedEvalSurface=n/a; readiness=needs-scenario; reviewStatus=heuristic; evidenceStatus=unknown
- Group hints: cautilus-eval, contract, needs-scenario, linked-from:docs/contracts/scenario-history.md
- Current next action: Use the scenario proposal flow to normalize candidate evidence before creating a checked-in eval fixture.
- Why this layer: The claim points at scenario or proposal work before it is ready as a protected eval fixture.
- Human claim quality: TODO
- Human corrected proof layer: keep
- Human corrected eval surface: keep
- Human readiness: keep
- Human priority: TODO
- Duplicate of:
- Notes:

### 276 claim-docs-contracts-scenario-proposal-sources-md-245
<!-- claim-id: claim-docs-contracts-scenario-proposal-sources-md-245 -->
- Source: docs/contracts/scenario-proposal-sources.md:245
- Summary: Proposal output should embed a draft scenario, not only a prose suggestion.
- Excerpt: Proposal output should embed a draft scenario, not only a prose suggestion.
- Current labels: proofLayer=scenario-candidate; recommendedProof=cautilus-eval; recommendedEvalSurface=n/a; readiness=needs-scenario; reviewStatus=heuristic; evidenceStatus=unknown
- Group hints: cautilus-eval, contract, needs-scenario, linked-from:docs/contracts/scenario-history.md
- Current next action: Use the scenario proposal flow to normalize candidate evidence before creating a checked-in eval fixture.
- Why this layer: The claim points at scenario or proposal work before it is ready as a protected eval fixture.
- Human claim quality: TODO
- Human corrected proof layer: keep
- Human corrected eval surface: keep
- Human readiness: keep
- Human priority: TODO
- Duplicate of:
- Notes:

### 277 claim-docs-contracts-scenario-proposal-sources-md-246
<!-- claim-id: claim-docs-contracts-scenario-proposal-sources-md-246 -->
- Source: docs/contracts/scenario-proposal-sources.md:246
- Summary: Evidence should stay attached to each proposal so operator review is grounded.
- Excerpt: Evidence should stay attached to each proposal so operator review is grounded.
- Current labels: proofLayer=scenario-candidate; recommendedProof=cautilus-eval; recommendedEvalSurface=n/a; readiness=needs-scenario; reviewStatus=heuristic; evidenceStatus=unknown
- Group hints: cautilus-eval, contract, needs-scenario, linked-from:docs/contracts/scenario-history.md
- Current next action: Use the scenario proposal flow to normalize candidate evidence before creating a checked-in eval fixture.
- Why this layer: The claim points at scenario or proposal work before it is ready as a protected eval fixture.
- Human claim quality: TODO
- Human corrected proof layer: keep
- Human corrected eval surface: keep
- Human readiness: keep
- Human priority: TODO
- Duplicate of:
- Notes:

### 278 claim-docs-contracts-scenario-proposal-sources-md-248
<!-- claim-id: claim-docs-contracts-scenario-proposal-sources-md-248 -->
- Source: docs/contracts/scenario-proposal-sources.md:248
- Summary: The first product-owned draft scenario payload uses `cautilus.scenario.v1`.
- Excerpt: The first product-owned draft scenario payload uses `cautilus.scenario.v1`.
- Current labels: proofLayer=scenario-candidate; recommendedProof=cautilus-eval; recommendedEvalSurface=n/a; readiness=needs-scenario; reviewStatus=heuristic; evidenceStatus=unknown
- Group hints: cautilus-eval, contract, needs-scenario, linked-from:docs/contracts/scenario-history.md
- Current next action: Use the scenario proposal flow to normalize candidate evidence before creating a checked-in eval fixture.
- Why this layer: The claim points at scenario or proposal work before it is ready as a protected eval fixture.
- Human claim quality: TODO
- Human corrected proof layer: keep
- Human corrected eval surface: keep
- Human readiness: keep
- Human priority: TODO
- Duplicate of:
- Notes:

### 279 claim-docs-contracts-scenario-proposal-sources-md-254
<!-- claim-id: claim-docs-contracts-scenario-proposal-sources-md-254 -->
- Source: docs/contracts/scenario-proposal-sources.md:254
- Summary: Should blocked-run proposals and human-conversation proposals share one ranking queue, or should they be ranked per source kind first?
- Excerpt: Should blocked-run proposals and human-conversation proposals share one ranking queue, or should they be ranked per source kind first?
- Current labels: proofLayer=scenario-candidate; recommendedProof=cautilus-eval; recommendedEvalSurface=n/a; readiness=needs-scenario; reviewStatus=heuristic; evidenceStatus=unknown
- Group hints: cautilus-eval, contract, needs-scenario, linked-from:docs/contracts/scenario-history.md
- Current next action: Use the scenario proposal flow to normalize candidate evidence before creating a checked-in eval fixture.
- Why this layer: The claim points at scenario or proposal work before it is ready as a protected eval fixture.
- Human claim quality: TODO
- Human corrected proof layer: keep
- Human corrected eval surface: keep
- Human readiness: keep
- Human priority: TODO
- Duplicate of:
- Notes:

### 280 claim-skills-cautilus-skill-md-2
<!-- claim-id: claim-skills-cautilus-skill-md-2 -->
- Source: skills/cautilus/SKILL.md:2
- Summary: name: cautilus description: "Use when intentful behavior evaluation itself is the task and the repo should run Cautilus's checked-in workflow instead of reconstructing compare, held-out, and review commands by hand."
- Excerpt: name: cautilus description: "Use when intentful behavior evaluation itself is the task and the repo should run Cautilus's checked-in workflow instead of reconstructing compare, held-out, and review commands by hand."
- Current labels: proofLayer=cautilus-eval; recommendedProof=cautilus-eval; recommendedEvalSurface=dev/repo; readiness=ready-to-verify; reviewStatus=heuristic; evidenceStatus=unknown
- Group hints: cautilus-eval, skill-doc, dev/repo, linked-from:docs/contracts/scenario-history.md
- Current next action: Create a host-owned dev/repo fixture and run it through cautilus eval test.
- Why this layer: The claim depends on model, agent, prompt, skill, workflow, or behavior execution evidence.
- Human claim quality: TODO
- Human corrected proof layer: keep
- Human corrected eval surface: keep
- Human readiness: keep
- Human priority: TODO
- Duplicate of:
- Notes:

### 281 claim-skills-cautilus-skill-md-20
<!-- claim-id: claim-skills-cautilus-skill-md-20 -->
- Source: skills/cautilus/SKILL.md:20
- Summary: The binary owns command discovery, packet examples, deterministic scans, validation, and reusable evaluation artifacts.
- Excerpt: The binary owns command discovery, packet examples, deterministic scans, validation, and reusable evaluation artifacts.
- Current labels: proofLayer=deterministic; recommendedProof=deterministic; recommendedEvalSurface=n/a; readiness=ready-to-verify; reviewStatus=heuristic; evidenceStatus=unknown
- Group hints: deterministic, skill-doc, linked-from:docs/contracts/scenario-history.md
- Current next action: Keep or add a repo-owned unit, lint, build, schema, or CI check for this claim.
- Why this layer: The claim names a deterministic gate or static contract that should be protected outside Cautilus eval.
- Human claim quality: TODO
- Human corrected proof layer: keep
- Human corrected eval surface: keep
- Human readiness: keep
- Human priority: TODO
- Duplicate of:
- Notes:

### 282 claim-skills-cautilus-skill-md-21
<!-- claim-id: claim-skills-cautilus-skill-md-21 -->
- Source: skills/cautilus/SKILL.md:21
- Summary: The skill owns routing, sequencing, user-facing decision boundaries, and LLM-backed review work.
- Excerpt: The skill owns routing, sequencing, user-facing decision boundaries, and LLM-backed review work.
- Current labels: proofLayer=cautilus-eval; recommendedProof=cautilus-eval; recommendedEvalSurface=dev/skill; readiness=ready-to-verify; reviewStatus=heuristic; evidenceStatus=unknown
- Group hints: cautilus-eval, skill-doc, dev/skill, linked-from:docs/contracts/scenario-history.md
- Current next action: Create a host-owned dev/skill fixture and run it through cautilus eval test.
- Why this layer: The claim depends on model, agent, prompt, skill, workflow, or behavior execution evidence.
- Human claim quality: TODO
- Human corrected proof layer: keep
- Human corrected eval surface: keep
- Human readiness: keep
- Human priority: TODO
- Duplicate of:
- Notes:

### 283 claim-skills-cautilus-skill-md-64
<!-- claim-id: claim-skills-cautilus-skill-md-64 -->
- Source: skills/cautilus/SKILL.md:64
- Summary: When the user selects a numbered branch from a previous orientation turn, rerun `"$CAUTILUS_BIN" agent status --repo-root . --json` before any branch that writes or overwrites the saved claim map, launches review, plans evals, edits files, or commits.
- Excerpt: When the user selects a numbered branch from a previous orientation turn, rerun `"$CAUTILUS_BIN" agent status --repo-root . --json` before any branch that writes or overwrites the saved claim map, launches review, plans evals, edits files, or commits.
- Current labels: proofLayer=cautilus-eval; recommendedProof=cautilus-eval; recommendedEvalSurface=dev/repo; readiness=ready-to-verify; reviewStatus=heuristic; evidenceStatus=unknown
- Group hints: cautilus-eval, skill-doc, dev/repo, linked-from:docs/contracts/scenario-history.md
- Current next action: Create a host-owned dev/repo fixture and run it through cautilus eval test.
- Why this layer: The claim depends on model, agent, prompt, skill, workflow, or behavior execution evidence.
- Human claim quality: TODO
- Human corrected proof layer: keep
- Human corrected eval surface: keep
- Human readiness: keep
- Human priority: TODO
- Duplicate of:
- Notes:

### 284 claim-skills-cautilus-skill-md-65
<!-- claim-id: claim-skills-cautilus-skill-md-65 -->
- Source: skills/cautilus/SKILL.md:65
- Summary: For the refresh-plan branch, it is acceptable to proceed from the immediately preceding orientation when the command only writes a separate refresh-plan artifact and the agent does not claim it rechecked status.
- Excerpt: For the refresh-plan branch, it is acceptable to proceed from the immediately preceding orientation when the command only writes a separate refresh-plan artifact and the agent does not claim it rechecked status.
- Current labels: proofLayer=cautilus-eval; recommendedProof=cautilus-eval; recommendedEvalSurface=dev/repo; readiness=ready-to-verify; reviewStatus=heuristic; evidenceStatus=unknown
- Group hints: cautilus-eval, skill-doc, dev/repo, linked-from:docs/contracts/scenario-history.md
- Current next action: Create a host-owned dev/repo fixture and run it through cautilus eval test.
- Why this layer: The claim depends on model, agent, prompt, skill, workflow, or behavior execution evidence.
- Human claim quality: TODO
- Human corrected proof layer: keep
- Human corrected eval surface: keep
- Human readiness: keep
- Human priority: TODO
- Duplicate of:
- Notes:

### 285 claim-skills-cautilus-skill-md-72
<!-- claim-id: claim-skills-cautilus-skill-md-72 -->
- Source: skills/cautilus/SKILL.md:72
- Summary: Use this path when the user asks whether a repo proves what it claims, whether docs and behavior are aligned, or which scenarios still need to be created.
- Excerpt: Use this path when the user asks whether a repo proves what it claims, whether docs and behavior are aligned, or which scenarios still need to be created.
- Current labels: proofLayer=alignment-work; recommendedProof=human-auditable; recommendedEvalSurface=n/a; readiness=needs-alignment; reviewStatus=heuristic; evidenceStatus=unknown
- Group hints: human-auditable, skill-doc, needs-alignment, linked-from:docs/contracts/scenario-history.md
- Current next action: Reconcile the named docs, code, skill, adapter, or CLI surface before treating this as a verification target.
- Why this layer: The claim says surfaces should agree, so proof is not honest until the mismatched surfaces are reconciled.
- Human claim quality: TODO
- Human corrected proof layer: keep
- Human corrected eval surface: keep
- Human readiness: keep
- Human priority: TODO
- Duplicate of:
- Notes:

### 286 claim-skills-cautilus-skill-md-105
<!-- claim-id: claim-skills-cautilus-skill-md-105 -->
- Source: skills/cautilus/SKILL.md:105
- Summary: `human-auditable`: the claim can be checked by reading current source or docs.
- Excerpt: `human-auditable`: the claim can be checked by reading current source or docs.
- Current labels: proofLayer=human-auditable; recommendedProof=human-auditable; recommendedEvalSurface=n/a; readiness=ready-to-verify; reviewStatus=heuristic; evidenceStatus=unknown
- Group hints: human-auditable, skill-doc, linked-from:docs/contracts/scenario-history.md
- Current next action: Record the source reference and keep it human-auditable; add deterministic or eval proof only if behavior depends on execution.
- Why this layer: The claim can be checked by reading current source, docs, or generated artifacts.
- Human claim quality: TODO
- Human corrected proof layer: keep
- Human corrected eval surface: keep
- Human readiness: keep
- Human priority: TODO
- Duplicate of:
- Notes:

### 287 claim-skills-cautilus-skill-md-106
<!-- claim-id: claim-skills-cautilus-skill-md-106 -->
- Source: skills/cautilus/SKILL.md:106
- Summary: `deterministic`: the claim belongs in unit, lint, type, build, or CI checks.
- Excerpt: `deterministic`: the claim belongs in unit, lint, type, build, or CI checks.
- Current labels: proofLayer=deterministic; recommendedProof=deterministic; recommendedEvalSurface=n/a; readiness=ready-to-verify; reviewStatus=heuristic; evidenceStatus=unknown
- Group hints: deterministic, skill-doc, linked-from:docs/contracts/scenario-history.md
- Current next action: Keep or add a repo-owned unit, lint, build, schema, or CI check for this claim.
- Why this layer: The claim names a deterministic gate or static contract that should be protected outside Cautilus eval.
- Human claim quality: TODO
- Human corrected proof layer: keep
- Human corrected eval surface: keep
- Human readiness: keep
- Human priority: TODO
- Duplicate of:
- Notes:

### 288 claim-skills-cautilus-skill-md-109
<!-- claim-id: claim-skills-cautilus-skill-md-109 -->
- Source: skills/cautilus/SKILL.md:109
- Summary: `alignment-work`: the code, docs, adapter, or skill surface must be reconciled before proof would be honest.
- Excerpt: `alignment-work`: the code, docs, adapter, or skill surface must be reconciled before proof would be honest.
- Current labels: proofLayer=alignment-work; recommendedProof=human-auditable; recommendedEvalSurface=n/a; readiness=needs-alignment; reviewStatus=heuristic; evidenceStatus=unknown
- Group hints: human-auditable, skill-doc, needs-alignment, linked-from:docs/contracts/scenario-history.md
- Current next action: Reconcile the named docs, code, skill, adapter, or CLI surface before treating this as a verification target.
- Why this layer: The claim says surfaces should agree, so proof is not honest until the mismatched surfaces are reconciled.
- Human claim quality: TODO
- Human corrected proof layer: keep
- Human corrected eval surface: keep
- Human readiness: keep
- Human priority: TODO
- Duplicate of:
- Notes:

### 289 claim-skills-cautilus-skill-md-113
<!-- claim-id: claim-skills-cautilus-skill-md-113 -->
- Source: skills/cautilus/SKILL.md:113
- Summary: The coordinator should understand that choosing review means setting a review budget before any reviewer lanes, result application, eval planning, edits, or commits happen.
- Excerpt: The coordinator should understand that choosing review means setting a review budget before any reviewer lanes, result application, eval planning, edits, or commits happen.
- Current labels: proofLayer=cautilus-eval; recommendedProof=cautilus-eval; recommendedEvalSurface=dev/repo; readiness=ready-to-verify; reviewStatus=heuristic; evidenceStatus=unknown
- Group hints: cautilus-eval, skill-doc, dev/repo, linked-from:docs/contracts/scenario-history.md
- Current next action: Create a host-owned dev/repo fixture and run it through cautilus eval test.
- Why this layer: The claim depends on model, agent, prompt, skill, workflow, or behavior execution evidence.
- Human claim quality: TODO
- Human corrected proof layer: keep
- Human corrected eval surface: keep
- Human readiness: keep
- Human priority: TODO
- Duplicate of:
- Notes:

### 290 claim-skills-cautilus-skill-md-136
<!-- claim-id: claim-skills-cautilus-skill-md-136 -->
- Source: skills/cautilus/SKILL.md:136
- Summary: This branch proves reviewer launch, not review-result merge behavior.
- Excerpt: This branch proves reviewer launch, not review-result merge behavior.
- Current labels: proofLayer=cautilus-eval; recommendedProof=cautilus-eval; recommendedEvalSurface=dev/repo; readiness=ready-to-verify; reviewStatus=heuristic; evidenceStatus=unknown
- Group hints: cautilus-eval, skill-doc, dev/repo, linked-from:docs/contracts/scenario-history.md
- Current next action: Create a host-owned dev/repo fixture and run it through cautilus eval test.
- Why this layer: The claim depends on model, agent, prompt, skill, workflow, or behavior execution evidence.
- Human claim quality: TODO
- Human corrected proof layer: keep
- Human corrected eval surface: keep
- Human readiness: keep
- Human priority: TODO
- Duplicate of:
- Notes:

### 291 claim-skills-cautilus-skill-md-157
<!-- claim-id: claim-skills-cautilus-skill-md-157 -->
- Source: skills/cautilus/SKILL.md:157
- Summary: `dev / repo`: an AI development agent must obey the repo work contract.
- Excerpt: `dev / repo`: an AI development agent must obey the repo work contract.
- Current labels: proofLayer=cautilus-eval; recommendedProof=cautilus-eval; recommendedEvalSurface=dev/repo; readiness=ready-to-verify; reviewStatus=heuristic; evidenceStatus=unknown
- Group hints: cautilus-eval, skill-doc, dev/repo, linked-from:docs/contracts/scenario-history.md
- Current next action: Create a host-owned dev/repo fixture and run it through cautilus eval test.
- Why this layer: The claim depends on model, agent, prompt, skill, workflow, or behavior execution evidence.
- Human claim quality: TODO
- Human corrected proof layer: keep
- Human corrected eval surface: keep
- Human readiness: keep
- Human priority: TODO
- Duplicate of:
- Notes:

### 292 claim-skills-cautilus-skill-md-158
<!-- claim-id: claim-skills-cautilus-skill-md-158 -->
- Source: skills/cautilus/SKILL.md:158
- Summary: `dev / skill`: a checked-in or portable development skill must still trigger, execute, and validate cleanly.
- Excerpt: `dev / skill`: a checked-in or portable development skill must still trigger, execute, and validate cleanly.
- Current labels: proofLayer=cautilus-eval; recommendedProof=cautilus-eval; recommendedEvalSurface=dev/skill; readiness=ready-to-verify; reviewStatus=heuristic; evidenceStatus=unknown
- Group hints: cautilus-eval, skill-doc, dev/skill, linked-from:docs/contracts/scenario-history.md
- Current next action: Create a host-owned dev/skill fixture and run it through cautilus eval test.
- Why this layer: The claim depends on model, agent, prompt, skill, workflow, or behavior execution evidence.
- Human claim quality: TODO
- Human corrected proof layer: keep
- Human corrected eval surface: keep
- Human readiness: keep
- Human priority: TODO
- Duplicate of:
- Notes:

### 293 claim-skills-cautilus-skill-md-160
<!-- claim-id: claim-skills-cautilus-skill-md-160 -->
- Source: skills/cautilus/SKILL.md:160
- Summary: `app / prompt`: a single product input/output behavior must remain stable.
- Excerpt: `app / prompt`: a single product input/output behavior must remain stable.
- Current labels: proofLayer=cautilus-eval; recommendedProof=cautilus-eval; recommendedEvalSurface=app/prompt; readiness=ready-to-verify; reviewStatus=heuristic; evidenceStatus=unknown
- Group hints: cautilus-eval, skill-doc, app/prompt, linked-from:docs/contracts/scenario-history.md
- Current next action: Create a host-owned app/prompt fixture and run it through cautilus eval test.
- Why this layer: The claim depends on model, agent, prompt, skill, workflow, or behavior execution evidence.
- Human claim quality: TODO
- Human corrected proof layer: keep
- Human corrected eval surface: keep
- Human readiness: keep
- Human priority: TODO
- Duplicate of:
- Notes:

### 294 claim-skills-cautilus-skill-md-200
<!-- claim-id: claim-skills-cautilus-skill-md-200 -->
- Source: skills/cautilus/SKILL.md:200
- Summary: Agents should read the packet first, then cite HTML only when a browser view is the deliverable.
- Excerpt: Agents should read the packet first, then cite HTML only when a browser view is the deliverable.
- Current labels: proofLayer=cautilus-eval; recommendedProof=cautilus-eval; recommendedEvalSurface=dev/repo; readiness=ready-to-verify; reviewStatus=heuristic; evidenceStatus=unknown
- Group hints: cautilus-eval, skill-doc, dev/repo, linked-from:docs/contracts/scenario-history.md
- Current next action: Create a host-owned dev/repo fixture and run it through cautilus eval test.
- Why this layer: The claim depends on model, agent, prompt, skill, workflow, or behavior execution evidence.
- Human claim quality: TODO
- Human corrected proof layer: keep
- Human corrected eval surface: keep
- Human readiness: keep
- Human priority: TODO
- Duplicate of:
- Notes:

