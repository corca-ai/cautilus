# Claim Discovery Review Worksheet

This worksheet is for human review of the deterministic Cautilus claim-discovery packet.
It is grouped by intended audience, semantic area, and verification shape instead of by source file.
Source excerpts are included for local judgment; source refs are trace data, not the primary grouping axis.

## Packet Summary

- Claims packet: .cautilus/claims/latest.json
- Git commit in packet: 691d4f48fcf408d3834b40cf1f0d90f66c240cff
- Candidate count: 290
- Source count: 35
- User claims: 64
- Developer claims: 226

## How To Review

This is a batching worksheet, not a demand to finish all candidates in one pass.
For each reviewed item, decide whether it is a real product or developer claim, a duplicate, a fragment, or noise.
Use the correction fields to mark obvious relabeling without editing the JSON directly.
`ready-to-verify` means the claim is shaped enough to choose a proof path; it does not mean evidence already exists.
`evidence unknown` means this deterministic pass has not reconciled tests, eval packets, or human review evidence yet.
Semantic groups are batching hints, not final taxonomy.

Suggested values for `Human claim quality`: keep, merge, split, reword, drop, unsure.
Suggested values for `Human corrected audience`: keep, user, developer, unclear.
Suggested values for `Human corrected semantic group`: keep, or write a short replacement group.
Suggested values for `Human corrected proof`: keep, human-auditable, deterministic, cautilus-eval.
Suggested values for `Human corrected eval surface`: keep, none, dev/repo, dev/skill, app/chat, app/prompt.
Suggested values for `Human readiness`: keep, ready-to-verify, needs-scenario, needs-alignment, blocked.
Suggested values for `Human priority`: high, medium, low, later.

## Recommended First Pass

1. No `Unclear Claims` are present in this packet.
2. Review `User Claims` next (64 items) because these are closest to product promises.
3. Spot-check `Developer Claims` last (226 items) to catch internal conventions that leaked into product promises.
Do not try to clear every claim in the first pass; mark duplicates, fragments, and obvious audience mistakes first.

## User Claims (64)

### Adapter and portability (12)

#### Cautilus eval / app/prompt / ready-to-verify / evidence unknown (1)

##### claim-docs-cli-reference-md-160

- Summary: That keeps persona prompt shaping and result semantics product-owned while backend selection stays adapter-owned.
- Current labels: audience=user; proof=cautilus-eval; surface=app/prompt; readiness=ready-to-verify; evidence=unknown
- Source excerpt: That keeps persona prompt shaping and result semantics product-owned while backend selection stays adapter-owned.
- Suggested next action: Create a host-owned app/prompt fixture and run it through cautilus eval test.
- Human claim quality: TODO
- Human corrected audience: keep
- Human corrected semantic group: keep
- Human corrected proof: keep
- Human corrected eval surface: keep
- Human readiness: keep
- Human priority: TODO
- Human notes:
- Trace: 1 source ref; docs/cli-reference.md:160

#### Cautilus eval / dev/repo / ready-to-verify / evidence unknown (4)

##### claim-docs-cli-reference-md-240

- Summary: `cautilus eval test` runs a checked-in fixture through an adapter-owned runner and then evaluates the observed packet.
- Current labels: audience=user; proof=cautilus-eval; surface=dev/repo; readiness=ready-to-verify; evidence=unknown
- Source excerpt: `cautilus eval test` runs a checked-in fixture through an adapter-owned runner and then evaluates the observed packet.
- Suggested next action: Create a host-owned dev/repo fixture and run it through cautilus eval test.
- Human claim quality: TODO
- Human corrected audience: keep
- Human corrected semantic group: keep
- Human corrected proof: keep
- Human corrected eval surface: keep
- Human readiness: keep
- Human priority: TODO
- Human notes:
- Trace: 1 source ref; docs/cli-reference.md:240

##### claim-docs-cli-reference-md-91

- Summary: It emits `cautilus.agent_status.v1`: a read-only orientation packet over binary health, local agent-surface readiness, adapter state, claim-state availability, scan scope, and branch choices.
- Current labels: audience=user; proof=cautilus-eval; surface=dev/repo; readiness=ready-to-verify; evidence=unknown
- Source excerpt: It emits `cautilus.agent_status.v1`: a read-only orientation packet over binary health, local agent-surface readiness, adapter state, claim-state availability, scan scope, and branch choices.
- Suggested next action: Create a host-owned dev/repo fixture and run it through cautilus eval test.
- Human claim quality: TODO
- Human corrected audience: keep
- Human corrected semantic group: keep
- Human corrected proof: keep
- Human corrected eval surface: keep
- Human readiness: keep
- Human priority: TODO
- Human notes:
- Trace: 1 source ref; docs/cli-reference.md:91

##### claim-readme-md-13

- Summary: They stay checked into each host repo so evaluation behavior remains reproducible, reviewable, and owned by the repo that declares it.
- Current labels: audience=user; proof=cautilus-eval; surface=dev/repo; readiness=ready-to-verify; evidence=unknown
- Source excerpt: They stay checked into each host repo so evaluation behavior remains reproducible, reviewable, and owned by the repo that declares it.
- Suggested next action: Create a host-owned dev/repo fixture and run it through cautilus eval test.
- Human claim quality: TODO
- Human corrected audience: keep
- Human corrected semantic group: keep
- Human corrected proof: keep
- Human corrected eval surface: keep
- Human readiness: keep
- Human priority: TODO
- Human notes:
- Trace: 1 source ref; README.md:13

##### claim-readme-md-149

- Summary: When the goal is only to prove command routing and packet evaluation, `cautilus eval test --runtime fixture` can run the same product path with adapter-owned fixture results instead of launching a nested model eval.
- Current labels: audience=user; proof=cautilus-eval; surface=dev/repo; readiness=ready-to-verify; evidence=unknown
- Source excerpt: When the goal is only to prove command routing and packet evaluation, `cautilus eval test --runtime fixture` can run the same product path with adapter-owned fixture results instead of launching a nested model eval.
- Suggested next action: Create a host-owned dev/repo fixture and run it through cautilus eval test.
- Human claim quality: TODO
- Human corrected audience: keep
- Human corrected semantic group: keep
- Human corrected proof: keep
- Human corrected eval surface: keep
- Human readiness: keep
- Human priority: TODO
- Human notes:
- Trace: 1 source ref; README.md:149

#### Cautilus eval / dev/skill / ready-to-verify / evidence unknown (3)

##### claim-docs-guides-consumer-adoption-md-25

- Summary: `cautilus --version` must work on `PATH` before any consumer adapter or skill wiring is treated as valid.
- Current labels: audience=user; proof=cautilus-eval; surface=dev/skill; readiness=ready-to-verify; evidence=unknown
- Source excerpt: `cautilus --version` must work on `PATH` before any consumer adapter or skill wiring is treated as valid.
- Suggested next action: Create a host-owned dev/skill fixture and run it through cautilus eval test.
- Human claim quality: TODO
- Human corrected audience: keep
- Human corrected semantic group: keep
- Human corrected proof: keep
- Human corrected eval surface: keep
- Human readiness: keep
- Human priority: TODO
- Human notes:
- Trace: 1 source ref; docs/guides/consumer-adoption.md:25

##### claim-readme-md-7

- Summary: Ships as a standalone binary plus a bundled skill a host repo can install without copying another scaffold first.
- Current labels: audience=user; proof=cautilus-eval; surface=dev/skill; readiness=ready-to-verify; evidence=unknown
- Source excerpt: Ships as a standalone binary plus a bundled skill a host repo can install without copying another scaffold first.
- Suggested next action: Create a host-owned dev/skill fixture and run it through cautilus eval test.
- Human claim quality: TODO
- Human corrected audience: keep
- Human corrected semantic group: keep
- Human corrected proof: keep
- Human corrected eval surface: keep
- Human readiness: keep
- Human priority: TODO
- Human notes:
- Trace: 1 source ref; README.md:7

##### claim-skills-cautilus-skill-md-158

- Summary: `dev / skill`: a checked-in or portable development skill must still trigger, execute, and validate cleanly.
- Current labels: audience=user; proof=cautilus-eval; surface=dev/skill; readiness=ready-to-verify; evidence=unknown
- Source excerpt: `dev / skill`: a checked-in or portable development skill must still trigger, execute, and validate cleanly.
- Suggested next action: Create a host-owned dev/skill fixture and run it through cautilus eval test.
- Human claim quality: TODO
- Human corrected audience: keep
- Human corrected semantic group: keep
- Human corrected proof: keep
- Human corrected eval surface: keep
- Human readiness: keep
- Human priority: TODO
- Human notes:
- Trace: 1 source ref; skills/cautilus/SKILL.md:158

#### Cautilus eval / surface undecided / needs-scenario / evidence unknown (2)

##### claim-docs-cli-reference-md-159

- Summary: When the public scenario uses `simulator.kind: persona_prompt`, the adapter additionally provides `simulator_persona_command_template`, which normally calls `cautilus workbench run-simulator-persona` with repo-specific backend flags.
- Current labels: audience=user; proof=cautilus-eval; surface=none; readiness=needs-scenario; evidence=unknown
- Source excerpt: When the public scenario uses `simulator.kind: persona_prompt`, the adapter additionally provides `simulator_persona_command_template`, which normally calls `cautilus workbench run-simulator-persona` with repo-specific backend flags.
- Suggested next action: Use the scenario proposal flow to normalize candidate evidence before creating a checked-in eval fixture.
- Human claim quality: TODO
- Human corrected audience: keep
- Human corrected semantic group: keep
- Human corrected proof: keep
- Human corrected eval surface: keep
- Human readiness: keep
- Human priority: TODO
- Human notes:
- Trace: 1 source ref; docs/cli-reference.md:159

##### claim-docs-guides-evaluation-process-md-10

- Summary: That seam owns the checked-in case suite, adapter-runner invocation, and chained summary artifacts before the flow returns to packet-level `cautilus eval evaluate` and proposal normalization.
- Current labels: audience=user; proof=cautilus-eval; surface=none; readiness=needs-scenario; evidence=unknown
- Source excerpt: That seam owns the checked-in case suite, adapter-runner invocation, and chained summary artifacts before the flow returns to packet-level `cautilus eval evaluate` and proposal normalization.
- Suggested next action: Use the scenario proposal flow to normalize candidate evidence before creating a checked-in eval fixture.
- Human claim quality: TODO
- Human corrected audience: keep
- Human corrected semantic group: keep
- Human corrected proof: keep
- Human corrected eval surface: keep
- Human readiness: keep
- Human priority: TODO
- Human notes:
- Trace: 1 source ref; docs/guides/evaluation-process.md:10

#### Human-auditable / needs-alignment / evidence unknown (2)

##### claim-skills-cautilus-skill-md-109

- Summary: `alignment-work`: the code, docs, adapter, or skill surface must be reconciled before proof would be honest.
- Current labels: audience=user; proof=human-auditable; surface=none; readiness=needs-alignment; evidence=unknown
- Source excerpt: `alignment-work`: the code, docs, adapter, or skill surface must be reconciled before proof would be honest.
- Suggested next action: Reconcile the named docs, code, skill, adapter, or CLI surface before treating this as a verification target.
- Human claim quality: TODO
- Human corrected audience: keep
- Human corrected semantic group: keep
- Human corrected proof: keep
- Human corrected eval surface: keep
- Human readiness: keep
- Human priority: TODO
- Human notes:
- Trace: 1 source ref; skills/cautilus/SKILL.md:109

##### claim-skills-cautilus-skill-md-72

- Summary: Use this path when the user asks whether a repo proves what it claims, whether docs and behavior are aligned, or which scenarios still need to be created.
- Current labels: audience=user; proof=human-auditable; surface=none; readiness=needs-alignment; evidence=unknown
- Source excerpt: Use this path when the user asks whether a repo proves what it claims, whether docs and behavior are aligned, or which scenarios still need to be created.
- Suggested next action: Reconcile the named docs, code, skill, adapter, or CLI surface before treating this as a verification target.
- Human claim quality: TODO
- Human corrected audience: keep
- Human corrected semantic group: keep
- Human corrected proof: keep
- Human corrected eval surface: keep
- Human readiness: keep
- Human priority: TODO
- Human notes:
- Trace: 1 source ref; skills/cautilus/SKILL.md:72

### Agent and skill workflow (5)

#### Cautilus eval / surface undecided / needs-scenario / evidence unknown (4)

##### claim-docs-guides-evaluation-process-md-253

- Summary: When repeated workflow failures should become durable scenario coverage, prefer the checked-in `skill` normalization helper over repo-local one-off shapers:
- Current labels: audience=user; proof=cautilus-eval; surface=none; readiness=needs-scenario; evidence=unknown
- Source excerpt: When repeated workflow failures should become durable scenario coverage, prefer the checked-in `skill` normalization helper over repo-local one-off shapers:
- Suggested next action: Use the scenario proposal flow to normalize candidate evidence before creating a checked-in eval fixture.
- Human claim quality: TODO
- Human corrected audience: keep
- Human corrected semantic group: keep
- Human corrected proof: keep
- Human corrected eval surface: keep
- Human readiness: keep
- Human priority: TODO
- Human notes:
- Trace: 1 source ref; docs/guides/evaluation-process.md:253

##### claim-readme-md-137

- Summary: CLI: `cautilus scenario normalize chatbot --input logs.json` For agent: "Run a chatbot regression with these logs and my new system prompt." You get reopenable `proposals.json` candidates that can be kept out of tuning as protected checks.
- Current labels: audience=user; proof=cautilus-eval; surface=none; readiness=needs-scenario; evidence=unknown
- Source excerpt: CLI: `cautilus scenario normalize chatbot --input logs.json` For agent: "Run a chatbot regression with these logs and my new system prompt." You get reopenable `proposals.json` candidates that can be kept out of tuning as protected checks.
- Suggested next action: Use the scenario proposal flow to normalize candidate evidence before creating a checked-in eval fixture.
- Human claim quality: TODO
- Human corrected audience: keep
- Human corrected semantic group: keep
- Human corrected proof: keep
- Human corrected eval surface: keep
- Human readiness: keep
- Human priority: TODO
- Human notes:
- Trace: 1 source ref; README.md:137

##### claim-readme-md-91

- Summary: Input (For Agent)**: "Turn this behavior input into reusable scenarios and render an HTML page I can review."
- Current labels: audience=user; proof=cautilus-eval; surface=none; readiness=needs-scenario; evidence=unknown
- Source excerpt: Input (For Agent)**: "Turn this behavior input into reusable scenarios and render an HTML page I can review."
- Suggested next action: Use the scenario proposal flow to normalize candidate evidence before creating a checked-in eval fixture.
- Human claim quality: TODO
- Human corrected audience: keep
- Human corrected semantic group: keep
- Human corrected proof: keep
- Human corrected eval surface: keep
- Human readiness: keep
- Human priority: TODO
- Human notes:
- Trace: 1 source ref; README.md:91

##### claim-readme-md-95

- Summary: Next step: a human decides whether to promote the scenario into a protected evaluation path, while an agent can reopen the saved result, compare variants, or feed it into the next bounded step.
- Current labels: audience=user; proof=cautilus-eval; surface=none; readiness=needs-scenario; evidence=unknown
- Source excerpt: Next step: a human decides whether to promote the scenario into a protected evaluation path, while an agent can reopen the saved result, compare variants, or feed it into the next bounded step.
- Suggested next action: Use the scenario proposal flow to normalize candidate evidence before creating a checked-in eval fixture.
- Human claim quality: TODO
- Human corrected audience: keep
- Human corrected semantic group: keep
- Human corrected proof: keep
- Human corrected eval surface: keep
- Human readiness: keep
- Human priority: TODO
- Human notes:
- Trace: 1 source ref; README.md:95

#### Human-auditable / ready-to-verify / evidence unknown (1)

##### claim-skills-cautilus-skill-md-105

- Summary: `human-auditable`: the claim can be checked by reading current source or docs.
- Current labels: audience=user; proof=human-auditable; surface=none; readiness=ready-to-verify; evidence=unknown
- Source excerpt: `human-auditable`: the claim can be checked by reading current source or docs.
- Suggested next action: Record the source reference and keep it human-auditable; add deterministic or eval proof only if behavior depends on execution.
- Human claim quality: TODO
- Human corrected audience: keep
- Human corrected semantic group: keep
- Human corrected proof: keep
- Human corrected eval surface: keep
- Human readiness: keep
- Human priority: TODO
- Human notes:
- Trace: 1 source ref; skills/cautilus/SKILL.md:105

### Claim discovery and review (6)

#### Cautilus eval / dev/repo / ready-to-verify / evidence unknown (4)

##### claim-readme-md-148

- Summary: The same preset can evaluate a multi-turn agent episode when the fixture provides `turns`; Cautilus's own first-scan, refresh-flow, review-prepare, and reviewer-launch dogfood fixtures derive their results from audit packets.
- Current labels: audience=user; proof=cautilus-eval; surface=dev/repo; readiness=ready-to-verify; evidence=unknown
- Source excerpt: The same preset can evaluate a multi-turn agent episode when the fixture provides `turns`; Cautilus's own first-scan, refresh-flow, review-prepare, and reviewer-launch dogfood fixtures derive their results from audit packets.
- Suggested next action: Create a host-owned dev/repo fixture and run it through cautilus eval test.
- Human claim quality: TODO
- Human corrected audience: keep
- Human corrected semantic group: keep
- Human corrected proof: keep
- Human corrected eval surface: keep
- Human readiness: keep
- Human priority: TODO
- Human notes:
- Trace: 1 source ref; README.md:148

##### claim-readme-md-232

- Summary: static HTML views of the same artifacts so a human reviewer can judge them in a browser without an agent in the loop See `docs/specs/html-report.spec.md` for the rendered contract.
- Current labels: audience=user; proof=cautilus-eval; surface=dev/repo; readiness=ready-to-verify; evidence=unknown
- Source excerpt: static HTML views of the same artifacts so a human reviewer can judge them in a browser without an agent in the loop See `docs/specs/html-report.spec.md` for the rendered contract.
- Suggested next action: Create a host-owned dev/repo fixture and run it through cautilus eval test.
- Human claim quality: TODO
- Human corrected audience: keep
- Human corrected semantic group: keep
- Human corrected proof: keep
- Human corrected eval surface: keep
- Human readiness: keep
- Human priority: TODO
- Human notes:
- Trace: 1 source ref; README.md:232

##### claim-skills-cautilus-skill-md-113

- Summary: The coordinator should understand that choosing review means setting a review budget before any reviewer lanes, result application, eval planning, edits, or commits happen.
- Current labels: audience=user; proof=cautilus-eval; surface=dev/repo; readiness=ready-to-verify; evidence=unknown
- Source excerpt: The coordinator should understand that choosing review means setting a review budget before any reviewer lanes, result application, eval planning, edits, or commits happen.
- Suggested next action: Create a host-owned dev/repo fixture and run it through cautilus eval test.
- Human claim quality: TODO
- Human corrected audience: keep
- Human corrected semantic group: keep
- Human corrected proof: keep
- Human corrected eval surface: keep
- Human readiness: keep
- Human priority: TODO
- Human notes:
- Trace: 1 source ref; skills/cautilus/SKILL.md:113

##### claim-skills-cautilus-skill-md-136

- Summary: This branch proves reviewer launch, not review-result merge behavior.
- Current labels: audience=user; proof=cautilus-eval; surface=dev/repo; readiness=ready-to-verify; evidence=unknown
- Source excerpt: This branch proves reviewer launch, not review-result merge behavior.
- Suggested next action: Create a host-owned dev/repo fixture and run it through cautilus eval test.
- Human claim quality: TODO
- Human corrected audience: keep
- Human corrected semantic group: keep
- Human corrected proof: keep
- Human corrected eval surface: keep
- Human readiness: keep
- Human priority: TODO
- Human notes:
- Trace: 1 source ref; skills/cautilus/SKILL.md:136

#### Deterministic gate / ready-to-verify / evidence unknown (1)

##### claim-docs-cli-reference-md-97

- Summary: Use `cautilus claim discover` before writing eval fixtures when you need to inventory declared behavior claims and decide whether each belongs in human review, deterministic CI, Cautilus eval, scenario proposal work, or alignment work.
- Current labels: audience=user; proof=deterministic; surface=none; readiness=ready-to-verify; evidence=unknown
- Source excerpt: Use `cautilus claim discover` before writing eval fixtures when you need to inventory declared behavior claims and decide whether each belongs in human review, deterministic CI, Cautilus eval, scenario proposal work, or alignment work.
- Suggested next action: Keep or add a repo-owned unit, lint, build, schema, or CI check for this claim.
- Human claim quality: TODO
- Human corrected audience: keep
- Human corrected semantic group: keep
- Human corrected proof: keep
- Human corrected eval surface: keep
- Human readiness: keep
- Human priority: TODO
- Human notes:
- Trace: 1 source ref; docs/cli-reference.md:97

#### Human-auditable / ready-to-verify / evidence unknown (1)

##### claim-docs-cli-reference-md-456

- Summary: These renderers answer: "what should a human reviewer open first if they should inspect the same decision surface without parsing raw JSON?"
- Current labels: audience=user; proof=human-auditable; surface=none; readiness=ready-to-verify; evidence=unknown
- Source excerpt: These renderers answer: "what should a human reviewer open first if they should inspect the same decision surface without parsing raw JSON?"
- Suggested next action: Record the source reference and keep it human-auditable; add deterministic or eval proof only if behavior depends on execution.
- Human claim quality: TODO
- Human corrected audience: keep
- Human corrected semantic group: keep
- Human corrected proof: keep
- Human corrected eval surface: keep
- Human readiness: keep
- Human priority: TODO
- Human notes:
- Trace: 1 source ref; docs/cli-reference.md:456

### Documentation and contracts (4)

#### Cautilus eval / surface undecided / needs-scenario / evidence unknown (4)

##### claim-docs-cli-reference-md-231

- Summary: `cautilus scenario review-conversations` stays intentionally narrower than a generic audit UI.
- Current labels: audience=user; proof=cautilus-eval; surface=none; readiness=needs-scenario; evidence=unknown
- Source excerpt: `cautilus scenario review-conversations` stays intentionally narrower than a generic audit UI.
- Suggested next action: Use the scenario proposal flow to normalize candidate evidence before creating a checked-in eval fixture.
- Human claim quality: TODO
- Human corrected audience: keep
- Human corrected semantic group: keep
- Human corrected proof: keep
- Human corrected eval surface: keep
- Human readiness: keep
- Human priority: TODO
- Human notes:
- Trace: 1 source ref; docs/cli-reference.md:231

##### claim-docs-cli-reference-md-232

- Summary: It links normalized chatbot threads to scenario proposals and coverage hints so an operator can review behavior-eval evidence without browsing every live operator turn.
- Current labels: audience=user; proof=cautilus-eval; surface=none; readiness=needs-scenario; evidence=unknown
- Source excerpt: It links normalized chatbot threads to scenario proposals and coverage hints so an operator can review behavior-eval evidence without browsing every live operator turn.
- Suggested next action: Use the scenario proposal flow to normalize candidate evidence before creating a checked-in eval fixture.
- Human claim quality: TODO
- Human corrected audience: keep
- Human corrected semantic group: keep
- Human corrected proof: keep
- Human corrected eval surface: keep
- Human readiness: keep
- Human priority: TODO
- Human notes:
- Trace: 1 source ref; docs/cli-reference.md:232

##### claim-docs-guides-evaluation-process-md-293

- Summary: Review variants should inspect the candidate, not mutate the repo.
- Current labels: audience=user; proof=cautilus-eval; surface=none; readiness=needs-scenario; evidence=unknown
- Source excerpt: Review variants should inspect the candidate, not mutate the repo.
- Suggested next action: Use the scenario proposal flow to normalize candidate evidence before creating a checked-in eval fixture.
- Human claim quality: TODO
- Human corrected audience: keep
- Human corrected semantic group: keep
- Human corrected proof: keep
- Human corrected eval surface: keep
- Human readiness: keep
- Human priority: TODO
- Human notes:
- Trace: 1 source ref; docs/guides/evaluation-process.md:293

##### claim-readme-md-171

- Summary: `Cautilus` treats the context-recovery case as a protected scenario kept out of tuning so the signal stays honest.
- Current labels: audience=user; proof=cautilus-eval; surface=none; readiness=needs-scenario; evidence=unknown
- Source excerpt: `Cautilus` treats the context-recovery case as a protected scenario kept out of tuning so the signal stays honest.
- Suggested next action: Use the scenario proposal flow to normalize candidate evidence before creating a checked-in eval fixture.
- Human claim quality: TODO
- Human corrected audience: keep
- Human corrected semantic group: keep
- Human corrected proof: keep
- Human corrected eval surface: keep
- Human readiness: keep
- Human priority: TODO
- Human notes:
- Trace: 1 source ref; README.md:171

### Packets and reporting (4)

#### Cautilus eval / surface undecided / needs-scenario / evidence unknown (2)

##### claim-docs-cli-reference-md-421

- Summary: This command answers: "what single packet should I hand to the next decision step when report, scenario, audit, and history evidence all matter together?"
- Current labels: audience=user; proof=cautilus-eval; surface=none; readiness=needs-scenario; evidence=unknown
- Source excerpt: This command answers: "what single packet should I hand to the next decision step when report, scenario, audit, and history evidence all matter together?"
- Suggested next action: Use the scenario proposal flow to normalize candidate evidence before creating a checked-in eval fixture.
- Human claim quality: TODO
- Human corrected audience: keep
- Human corrected semantic group: keep
- Human corrected proof: keep
- Human corrected eval surface: keep
- Human readiness: keep
- Human priority: TODO
- Human notes:
- Trace: 1 source ref; docs/cli-reference.md:421

##### claim-docs-guides-evaluation-process-md-186

- Summary: For one-scenario output review, the same surface can start from a checked-in scenario file instead of a report packet:
- Current labels: audience=user; proof=cautilus-eval; surface=none; readiness=needs-scenario; evidence=unknown
- Source excerpt: For one-scenario output review, the same surface can start from a checked-in scenario file instead of a report packet:
- Suggested next action: Use the scenario proposal flow to normalize candidate evidence before creating a checked-in eval fixture.
- Human claim quality: TODO
- Human corrected audience: keep
- Human corrected semantic group: keep
- Human corrected proof: keep
- Human corrected eval surface: keep
- Human readiness: keep
- Human priority: TODO
- Human notes:
- Trace: 1 source ref; docs/guides/evaluation-process.md:186

#### Human-auditable / ready-to-verify / evidence unknown (2)

##### claim-docs-cli-reference-md-230

- Summary: The same packet also emits an `attentionView`, which is a bounded human-facing shortlist derived from the full ranked set.
- Current labels: audience=user; proof=human-auditable; surface=none; readiness=ready-to-verify; evidence=unknown
- Source excerpt: The same packet also emits an `attentionView`, which is a bounded human-facing shortlist derived from the full ranked set.
- Suggested next action: Record the source reference and keep it human-auditable; add deterministic or eval proof only if behavior depends on execution.
- Human claim quality: TODO
- Human corrected audience: keep
- Human corrected semantic group: keep
- Human corrected proof: keep
- Human corrected eval surface: keep
- Human readiness: keep
- Human priority: TODO
- Human notes:
- Trace: 1 source ref; docs/cli-reference.md:230

##### claim-readme-md-159

- Summary: Each catalog entry now also includes `exampleInputCli`, so an operator or wrapper can inspect a minimal valid packet shape without opening a fixture path first.
- Current labels: audience=user; proof=human-auditable; surface=none; readiness=ready-to-verify; evidence=unknown
- Source excerpt: Each catalog entry now also includes `exampleInputCli`, so an operator or wrapper can inspect a minimal valid packet shape without opening a fixture path first.
- Suggested next action: Record the source reference and keep it human-auditable; add deterministic or eval proof only if behavior depends on execution.
- Human claim quality: TODO
- Human corrected audience: keep
- Human corrected semantic group: keep
- Human corrected proof: keep
- Human corrected eval surface: keep
- Human readiness: keep
- Human priority: TODO
- Human notes:
- Trace: 1 source ref; README.md:159

### Quality gates (33)

#### Cautilus eval / app/chat / ready-to-verify / evidence unknown (1)

##### claim-readme-md-211

- Summary: Agent track — Claude / Codex plugin.** The `cautilus install` step also lands a bundled skill at `.agents/skills/cautilus/` with Claude and Codex plugin manifests, so an in-editor agent can drive the same contracts conversationally.
- Current labels: audience=user; proof=cautilus-eval; surface=app/chat; readiness=ready-to-verify; evidence=unknown
- Source excerpt: Agent track — Claude / Codex plugin.** The `cautilus install` step also lands a bundled skill at `.agents/skills/cautilus/` with Claude and Codex plugin manifests, so an in-editor agent can drive the same contracts conversationally.
- Suggested next action: Create a host-owned app/chat fixture and run it through cautilus eval test.
- Human claim quality: TODO
- Human corrected audience: keep
- Human corrected semantic group: keep
- Human corrected proof: keep
- Human corrected eval surface: keep
- Human readiness: keep
- Human priority: TODO
- Human notes:
- Trace: 1 source ref; README.md:211

#### Cautilus eval / app/prompt / ready-to-verify / evidence unknown (7)

##### claim-docs-cli-reference-md-401

- Summary: When `--output-text-key` is present, Cautilus also extracts that JSON narrative span into the rendered prompt so the judge can read the realized output directly.
- Current labels: audience=user; proof=cautilus-eval; surface=app/prompt; readiness=ready-to-verify; evidence=unknown
- Source excerpt: When `--output-text-key` is present, Cautilus also extracts that JSON narrative span into the rendered prompt so the judge can read the realized output directly.
- Suggested next action: Create a host-owned app/prompt fixture and run it through cautilus eval test.
- Human claim quality: TODO
- Human corrected audience: keep
- Human corrected semantic group: keep
- Human corrected proof: keep
- Human corrected eval surface: keep
- Human readiness: keep
- Human priority: TODO
- Human notes:
- Trace: 1 source ref; docs/cli-reference.md:401

##### claim-docs-guides-evaluation-process-md-308

- Summary: Past sessions showed that overly aggressive effort overrides can conflict with tool surfaces that the prompt or skill still needs.
- Current labels: audience=user; proof=cautilus-eval; surface=app/prompt; readiness=ready-to-verify; evidence=unknown
- Source excerpt: Past sessions showed that overly aggressive effort overrides can conflict with tool surfaces that the prompt or skill still needs.
- Suggested next action: Create a host-owned app/prompt fixture and run it through cautilus eval test.
- Human claim quality: TODO
- Human corrected audience: keep
- Human corrected semantic group: keep
- Human corrected proof: keep
- Human corrected eval surface: keep
- Human readiness: keep
- Human priority: TODO
- Human notes:
- Trace: 1 source ref; docs/guides/evaluation-process.md:308

##### claim-readme-md-123

- Summary: For reviewed `cautilus-eval` claims, `claim plan-evals` emits `cautilus.claim_eval_plan.v1`: an intermediate plan for host-owned eval fixtures, not a writer for prompts, runners, fixtures, or policy.
- Current labels: audience=user; proof=cautilus-eval; surface=app/prompt; readiness=ready-to-verify; evidence=unknown
- Source excerpt: For reviewed `cautilus-eval` claims, `claim plan-evals` emits `cautilus.claim_eval_plan.v1`: an intermediate plan for host-owned eval fixtures, not a writer for prompts, runners, fixtures, or policy.
- Suggested next action: Create a host-owned app/prompt fixture and run it through cautilus eval test.
- Human claim quality: TODO
- Human corrected audience: keep
- Human corrected semantic group: keep
- Human corrected proof: keep
- Human corrected eval surface: keep
- Human readiness: keep
- Human priority: TODO
- Human notes:
- Trace: 1 source ref; README.md:123

##### claim-readme-md-144

- Summary: Use when you change a skill or agent and want to know whether it still triggers on the right prompts, executes cleanly, and keeps its static validation passing.
- Current labels: audience=user; proof=cautilus-eval; surface=app/prompt; readiness=ready-to-verify; evidence=unknown
- Source excerpt: Use when you change a skill or agent and want to know whether it still triggers on the right prompts, executes cleanly, and keeps its static validation passing.
- Suggested next action: Create a host-owned app/prompt fixture and run it through cautilus eval test.
- Human claim quality: TODO
- Human corrected audience: keep
- Human corrected semantic group: keep
- Human corrected proof: keep
- Human corrected eval surface: keep
- Human readiness: keep
- Human priority: TODO
- Human notes:
- Trace: 1 source ref; README.md:144

##### claim-readme-md-192

- Summary: The longer-term direction is close to the workflow philosophy behind DSPy: prompts can change as long as the evaluated behavior survives.
- Current labels: audience=user; proof=cautilus-eval; surface=app/prompt; readiness=ready-to-verify; evidence=unknown
- Source excerpt: The longer-term direction is close to the workflow philosophy behind DSPy: prompts can change as long as the evaluated behavior survives.
- Suggested next action: Create a host-owned app/prompt fixture and run it through cautilus eval test.
- Human claim quality: TODO
- Human corrected audience: keep
- Human corrected semantic group: keep
- Human corrected proof: keep
- Human corrected eval surface: keep
- Human readiness: keep
- Human priority: TODO
- Human notes:
- Trace: 1 source ref; README.md:192

##### claim-readme-md-3

- Summary: `Cautilus` keeps agent and workflow behavior honest while prompts keep changing.
- Current labels: audience=user; proof=cautilus-eval; surface=app/prompt; readiness=ready-to-verify; evidence=unknown
- Source excerpt: `Cautilus` keeps agent and workflow behavior honest while prompts keep changing.
- Suggested next action: Create a host-owned app/prompt fixture and run it through cautilus eval test.
- Human claim quality: TODO
- Human corrected audience: keep
- Human corrected semantic group: keep
- Human corrected proof: keep
- Human corrected eval surface: keep
- Human readiness: keep
- Human priority: TODO
- Human notes:
- Trace: 1 source ref; README.md:3

##### claim-skills-cautilus-skill-md-160

- Summary: `app / prompt`: a single product input/output behavior must remain stable.
- Current labels: audience=user; proof=cautilus-eval; surface=app/prompt; readiness=ready-to-verify; evidence=unknown
- Source excerpt: `app / prompt`: a single product input/output behavior must remain stable.
- Suggested next action: Create a host-owned app/prompt fixture and run it through cautilus eval test.
- Human claim quality: TODO
- Human corrected audience: keep
- Human corrected semantic group: keep
- Human corrected proof: keep
- Human corrected eval surface: keep
- Human readiness: keep
- Human priority: TODO
- Human notes:
- Trace: 1 source ref; skills/cautilus/SKILL.md:160

#### Cautilus eval / dev/repo / ready-to-verify / evidence unknown (13)

##### claim-docs-cli-reference-md-105

- Summary: It emits `cautilus.claim_review_input.v1` and does not call an LLM or mark claims satisfied.
- Current labels: audience=user; proof=cautilus-eval; surface=dev/repo; readiness=ready-to-verify; evidence=unknown
- Source excerpt: It emits `cautilus.claim_review_input.v1` and does not call an LLM or mark claims satisfied.
- Suggested next action: Create a host-owned dev/repo fixture and run it through cautilus eval test.
- Human claim quality: TODO
- Human corrected audience: keep
- Human corrected semantic group: keep
- Human corrected proof: keep
- Human corrected eval surface: keep
- Human readiness: keep
- Human priority: TODO
- Human notes:
- Trace: 1 source ref; docs/cli-reference.md:105

##### claim-docs-cli-reference-md-241

- Summary: `cautilus eval evaluate` evaluates an already-observed packet without launching the runner again.
- Current labels: audience=user; proof=cautilus-eval; surface=dev/repo; readiness=ready-to-verify; evidence=unknown
- Source excerpt: `cautilus eval evaluate` evaluates an already-observed packet without launching the runner again.
- Suggested next action: Create a host-owned dev/repo fixture and run it through cautilus eval test.
- Human claim quality: TODO
- Human corrected audience: keep
- Human corrected semantic group: keep
- Human corrected proof: keep
- Human corrected eval surface: keep
- Human readiness: keep
- Human priority: TODO
- Human notes:
- Trace: 1 source ref; docs/cli-reference.md:241

##### claim-docs-guides-consumer-adoption-md-106

- Summary: The product owns the behavior-surface vocabulary in `cautilus.behavior_intent.v1`.
- Current labels: audience=user; proof=cautilus-eval; surface=dev/repo; readiness=ready-to-verify; evidence=unknown
- Source excerpt: The product owns the behavior-surface vocabulary in `cautilus.behavior_intent.v1`.
- Suggested next action: Create a host-owned dev/repo fixture and run it through cautilus eval test.
- Human claim quality: TODO
- Human corrected audience: keep
- Human corrected semantic group: keep
- Human corrected proof: keep
- Human corrected eval surface: keep
- Human readiness: keep
- Human priority: TODO
- Human notes:
- Trace: 1 source ref; docs/guides/consumer-adoption.md:106

##### claim-docs-guides-consumer-adoption-md-29

- Summary: `Cautilus` only owns the generic workflow contract, CLI, and normalization helpers.
- Current labels: audience=user; proof=cautilus-eval; surface=dev/repo; readiness=ready-to-verify; evidence=unknown
- Source excerpt: `Cautilus` only owns the generic workflow contract, CLI, and normalization helpers.
- Suggested next action: Create a host-owned dev/repo fixture and run it through cautilus eval test.
- Human claim quality: TODO
- Human corrected audience: keep
- Human corrected semantic group: keep
- Human corrected proof: keep
- Human corrected eval surface: keep
- Human readiness: keep
- Human priority: TODO
- Human notes:
- Trace: 1 source ref; docs/guides/consumer-adoption.md:29

##### claim-docs-guides-consumer-adoption-md-83

- Summary: It should answer "what is the default `Cautilus` evaluation for this repo?" without forcing the operator to mentally sort multiple unrelated workflows.
- Current labels: audience=user; proof=cautilus-eval; surface=dev/repo; readiness=ready-to-verify; evidence=unknown
- Source excerpt: It should answer "what is the default `Cautilus` evaluation for this repo?" without forcing the operator to mentally sort multiple unrelated workflows.
- Suggested next action: Create a host-owned dev/repo fixture and run it through cautilus eval test.
- Human claim quality: TODO
- Human corrected audience: keep
- Human corrected semantic group: keep
- Human corrected proof: keep
- Human corrected eval surface: keep
- Human readiness: keep
- Human priority: TODO
- Human notes:
- Trace: 1 source ref; docs/guides/consumer-adoption.md:83

##### claim-readme-md-153

- Summary: Use when a stateful automation — a CLI workflow, long-running agent session, or pipeline that persists state across invocations — keeps stalling on the same step.
- Current labels: audience=user; proof=cautilus-eval; surface=dev/repo; readiness=ready-to-verify; evidence=unknown
- Source excerpt: Use when a stateful automation — a CLI workflow, long-running agent session, or pipeline that persists state across invocations — keeps stalling on the same step.
- Suggested next action: Create a host-owned dev/repo fixture and run it through cautilus eval test.
- Human claim quality: TODO
- Human corrected audience: keep
- Human corrected semantic group: keep
- Human corrected proof: keep
- Human corrected eval surface: keep
- Human readiness: keep
- Human priority: TODO
- Human notes:
- Trace: 1 source ref; README.md:153

##### claim-readme-md-231

- Summary: machine-readable eval, report, review, evidence, and optimization packets that agents can consume directly
- Current labels: audience=user; proof=cautilus-eval; surface=dev/repo; readiness=ready-to-verify; evidence=unknown
- Source excerpt: machine-readable eval, report, review, evidence, and optimization packets that agents can consume directly
- Suggested next action: Create a host-owned dev/repo fixture and run it through cautilus eval test.
- Human claim quality: TODO
- Human corrected audience: keep
- Human corrected semantic group: keep
- Human corrected proof: keep
- Human corrected eval surface: keep
- Human readiness: keep
- Human priority: TODO
- Human notes:
- Trace: 1 source ref; README.md:231

##### claim-readme-md-9

- Summary: Commands should emit durable packets with enough state for the next agent to resume, not only terminal prose for a human operator.
- Current labels: audience=user; proof=cautilus-eval; surface=dev/repo; readiness=ready-to-verify; evidence=unknown
- Source excerpt: Commands should emit durable packets with enough state for the next agent to resume, not only terminal prose for a human operator.
- Suggested next action: Create a host-owned dev/repo fixture and run it through cautilus eval test.
- Human claim quality: TODO
- Human corrected audience: keep
- Human corrected semantic group: keep
- Human corrected proof: keep
- Human corrected eval surface: keep
- Human readiness: keep
- Human priority: TODO
- Human notes:
- Trace: 1 source ref; README.md:9

##### claim-skills-cautilus-skill-md-157

- Summary: `dev / repo`: an AI development agent must obey the repo work contract.
- Current labels: audience=user; proof=cautilus-eval; surface=dev/repo; readiness=ready-to-verify; evidence=unknown
- Source excerpt: `dev / repo`: an AI development agent must obey the repo work contract.
- Suggested next action: Create a host-owned dev/repo fixture and run it through cautilus eval test.
- Human claim quality: TODO
- Human corrected audience: keep
- Human corrected semantic group: keep
- Human corrected proof: keep
- Human corrected eval surface: keep
- Human readiness: keep
- Human priority: TODO
- Human notes:
- Trace: 1 source ref; skills/cautilus/SKILL.md:157

##### claim-skills-cautilus-skill-md-2

- Summary: name: cautilus description: "Use when intentful behavior evaluation itself is the task and the repo should run Cautilus's checked-in workflow instead of reconstructing compare, held-out, and review commands by hand."
- Current labels: audience=user; proof=cautilus-eval; surface=dev/repo; readiness=ready-to-verify; evidence=unknown
- Source excerpt: name: cautilus description: "Use when intentful behavior evaluation itself is the task and the repo should run Cautilus's checked-in workflow instead of reconstructing compare, held-out, and review commands by hand."
- Suggested next action: Create a host-owned dev/repo fixture and run it through cautilus eval test.
- Human claim quality: TODO
- Human corrected audience: keep
- Human corrected semantic group: keep
- Human corrected proof: keep
- Human corrected eval surface: keep
- Human readiness: keep
- Human priority: TODO
- Human notes:
- Trace: 1 source ref; skills/cautilus/SKILL.md:2

##### claim-skills-cautilus-skill-md-200

- Summary: Agents should read the packet first, then cite HTML only when a browser view is the deliverable.
- Current labels: audience=user; proof=cautilus-eval; surface=dev/repo; readiness=ready-to-verify; evidence=unknown
- Source excerpt: Agents should read the packet first, then cite HTML only when a browser view is the deliverable.
- Suggested next action: Create a host-owned dev/repo fixture and run it through cautilus eval test.
- Human claim quality: TODO
- Human corrected audience: keep
- Human corrected semantic group: keep
- Human corrected proof: keep
- Human corrected eval surface: keep
- Human readiness: keep
- Human priority: TODO
- Human notes:
- Trace: 1 source ref; skills/cautilus/SKILL.md:200

##### claim-skills-cautilus-skill-md-64

- Summary: When the user selects a numbered branch from a previous orientation turn, rerun `"$CAUTILUS_BIN" agent status --repo-root . --json` before any branch that writes or overwrites the saved claim map, launches review, plans evals, edits files, or commits.
- Current labels: audience=user; proof=cautilus-eval; surface=dev/repo; readiness=ready-to-verify; evidence=unknown
- Source excerpt: When the user selects a numbered branch from a previous orientation turn, rerun `"$CAUTILUS_BIN" agent status --repo-root . --json` before any branch that writes or overwrites the saved claim map, launches review, plans evals, edits files, or commits.
- Suggested next action: Create a host-owned dev/repo fixture and run it through cautilus eval test.
- Human claim quality: TODO
- Human corrected audience: keep
- Human corrected semantic group: keep
- Human corrected proof: keep
- Human corrected eval surface: keep
- Human readiness: keep
- Human priority: TODO
- Human notes:
- Trace: 1 source ref; skills/cautilus/SKILL.md:64

##### claim-skills-cautilus-skill-md-65

- Summary: For the refresh-plan branch, it is acceptable to proceed from the immediately preceding orientation when the command only writes a separate refresh-plan artifact and the agent does not claim it rechecked status.
- Current labels: audience=user; proof=cautilus-eval; surface=dev/repo; readiness=ready-to-verify; evidence=unknown
- Source excerpt: For the refresh-plan branch, it is acceptable to proceed from the immediately preceding orientation when the command only writes a separate refresh-plan artifact and the agent does not claim it rechecked status.
- Suggested next action: Create a host-owned dev/repo fixture and run it through cautilus eval test.
- Human claim quality: TODO
- Human corrected audience: keep
- Human corrected semantic group: keep
- Human corrected proof: keep
- Human corrected eval surface: keep
- Human readiness: keep
- Human priority: TODO
- Human notes:
- Trace: 1 source ref; skills/cautilus/SKILL.md:65

#### Cautilus eval / dev/skill / ready-to-verify / evidence unknown (5)

##### claim-docs-cli-reference-md-32

- Summary: The lower-level compatibility command `cautilus skills install` remains available when a workflow needs to call the skill installer directly.
- Current labels: audience=user; proof=cautilus-eval; surface=dev/skill; readiness=ready-to-verify; evidence=unknown
- Source excerpt: The lower-level compatibility command `cautilus skills install` remains available when a workflow needs to call the skill installer directly.
- Suggested next action: Create a host-owned dev/skill fixture and run it through cautilus eval test.
- Human claim quality: TODO
- Human corrected audience: keep
- Human corrected semantic group: keep
- Human corrected proof: keep
- Human corrected eval surface: keep
- Human readiness: keep
- Human priority: TODO
- Human notes:
- Trace: 1 source ref; docs/cli-reference.md:32

##### claim-docs-guides-evaluation-process-md-269

- Summary: `eval evaluate` remains the first-class packet boundary for skill trigger and execution quality.
- Current labels: audience=user; proof=cautilus-eval; surface=dev/skill; readiness=ready-to-verify; evidence=unknown
- Source excerpt: `eval evaluate` remains the first-class packet boundary for skill trigger and execution quality.
- Suggested next action: Create a host-owned dev/skill fixture and run it through cautilus eval test.
- Human claim quality: TODO
- Human corrected audience: keep
- Human corrected semantic group: keep
- Human corrected proof: keep
- Human corrected eval surface: keep
- Human readiness: keep
- Human priority: TODO
- Human notes:
- Trace: 1 source ref; docs/guides/evaluation-process.md:269

##### claim-docs-guides-evaluation-process-md-270

- Summary: The host still owns raw invocation and transcript capture; `Cautilus` owns the case-suite/runDir workflow, packet-level recommendation, behavior-intent framing, and the direct chain into `scenario normalize skill`.
- Current labels: audience=user; proof=cautilus-eval; surface=dev/skill; readiness=ready-to-verify; evidence=unknown
- Source excerpt: The host still owns raw invocation and transcript capture; `Cautilus` owns the case-suite/runDir workflow, packet-level recommendation, behavior-intent framing, and the direct chain into `scenario normalize skill`.
- Suggested next action: Create a host-owned dev/skill fixture and run it through cautilus eval test.
- Human claim quality: TODO
- Human corrected audience: keep
- Human corrected semantic group: keep
- Human corrected proof: keep
- Human corrected eval surface: keep
- Human readiness: keep
- Human priority: TODO
- Human notes:
- Trace: 1 source ref; docs/guides/evaluation-process.md:270

##### claim-docs-guides-evaluation-process-md-304

- Summary: Past sessions showed `codex exec` can emit fatal skill-loading errors on stderr while the final process exit still looks successful.
- Current labels: audience=user; proof=cautilus-eval; surface=dev/skill; readiness=ready-to-verify; evidence=unknown
- Source excerpt: Past sessions showed `codex exec` can emit fatal skill-loading errors on stderr while the final process exit still looks successful.
- Suggested next action: Create a host-owned dev/skill fixture and run it through cautilus eval test.
- Human claim quality: TODO
- Human corrected audience: keep
- Human corrected semantic group: keep
- Human corrected proof: keep
- Human corrected eval surface: keep
- Human readiness: keep
- Human priority: TODO
- Human notes:
- Trace: 1 source ref; docs/guides/evaluation-process.md:304

##### claim-skills-cautilus-skill-md-21

- Summary: The skill owns routing, sequencing, user-facing decision boundaries, and LLM-backed review work.
- Current labels: audience=user; proof=cautilus-eval; surface=dev/skill; readiness=ready-to-verify; evidence=unknown
- Source excerpt: The skill owns routing, sequencing, user-facing decision boundaries, and LLM-backed review work.
- Suggested next action: Create a host-owned dev/skill fixture and run it through cautilus eval test.
- Human claim quality: TODO
- Human corrected audience: keep
- Human corrected semantic group: keep
- Human corrected proof: keep
- Human corrected eval surface: keep
- Human readiness: keep
- Human priority: TODO
- Human notes:
- Trace: 1 source ref; skills/cautilus/SKILL.md:21

#### Cautilus eval / surface undecided / needs-scenario / evidence unknown (2)

##### claim-docs-guides-consumer-adoption-md-48

- Summary: The ready payload now includes `first_bounded_run`, which adds a starter `eval test -> eval evaluate` packet loop and keeps the `cautilus scenarios --json` catalog nearby only for proposal-input examples.
- Current labels: audience=user; proof=cautilus-eval; surface=none; readiness=needs-scenario; evidence=unknown
- Source excerpt: The ready payload now includes `first_bounded_run`, which adds a starter `eval test -> eval evaluate` packet loop and keeps the `cautilus scenarios --json` catalog nearby only for proposal-input examples.
- Suggested next action: Use the scenario proposal flow to normalize candidate evidence before creating a checked-in eval fixture.
- Human claim quality: TODO
- Human corrected audience: keep
- Human corrected semantic group: keep
- Human corrected proof: keep
- Human corrected eval surface: keep
- Human readiness: keep
- Human priority: TODO
- Human notes:
- Trace: 1 source ref; docs/guides/consumer-adoption.md:48

##### claim-docs-guides-evaluation-process-md-52

- Summary: The helper emits machine-readable baseline and candidate paths you can pass back into `eval test` or `review variants`.
- Current labels: audience=user; proof=cautilus-eval; surface=none; readiness=needs-scenario; evidence=unknown
- Source excerpt: The helper emits machine-readable baseline and candidate paths you can pass back into `eval test` or `review variants`.
- Suggested next action: Use the scenario proposal flow to normalize candidate evidence before creating a checked-in eval fixture.
- Human claim quality: TODO
- Human corrected audience: keep
- Human corrected semantic group: keep
- Human corrected proof: keep
- Human corrected eval surface: keep
- Human readiness: keep
- Human priority: TODO
- Human notes:
- Trace: 1 source ref; docs/guides/evaluation-process.md:52

#### Deterministic gate / ready-to-verify / evidence unknown (5)

##### claim-docs-guides-consumer-adoption-md-107

- Summary: The schema version stays at `v1`, but some surface strings have been renamed for archetype-vocabulary hygiene.
- Current labels: audience=user; proof=deterministic; surface=none; readiness=ready-to-verify; evidence=unknown
- Source excerpt: The schema version stays at `v1`, but some surface strings have been renamed for archetype-vocabulary hygiene.
- Suggested next action: Keep or add a repo-owned unit, lint, build, schema, or CI check for this claim.
- Human claim quality: TODO
- Human corrected audience: keep
- Human corrected semantic group: keep
- Human corrected proof: keep
- Human corrected eval surface: keep
- Human readiness: keep
- Human priority: TODO
- Human notes:
- Trace: 1 source ref; docs/guides/consumer-adoption.md:107

##### claim-docs-guides-evaluation-process-md-289

- Summary: Use a checked-in JSON schema file and a fixed output file path so the loop can detect `blocker`, `concern`, and `pass` without guessing.
- Current labels: audience=user; proof=deterministic; surface=none; readiness=ready-to-verify; evidence=unknown
- Source excerpt: Use a checked-in JSON schema file and a fixed output file path so the loop can detect `blocker`, `concern`, and `pass` without guessing.
- Suggested next action: Keep or add a repo-owned unit, lint, build, schema, or CI check for this claim.
- Human claim quality: TODO
- Human corrected audience: keep
- Human corrected semantic group: keep
- Human corrected proof: keep
- Human corrected eval surface: keep
- Human readiness: keep
- Human priority: TODO
- Human notes:
- Trace: 1 source ref; docs/guides/evaluation-process.md:289

##### claim-docs-guides-evaluation-process-md-320

- Summary: In JSON mode, `claude -p` can wrap the verdict under `structured_output` instead of printing the schema payload as the top-level object.
- Current labels: audience=user; proof=deterministic; surface=none; readiness=ready-to-verify; evidence=unknown
- Source excerpt: In JSON mode, `claude -p` can wrap the verdict under `structured_output` instead of printing the schema payload as the top-level object.
- Suggested next action: Keep or add a repo-owned unit, lint, build, schema, or CI check for this claim.
- Human claim quality: TODO
- Human corrected audience: keep
- Human corrected semantic group: keep
- Human corrected proof: keep
- Human corrected eval surface: keep
- Human readiness: keep
- Human priority: TODO
- Human notes:
- Trace: 1 source ref; docs/guides/evaluation-process.md:320

##### claim-skills-cautilus-skill-md-106

- Summary: `deterministic`: the claim belongs in unit, lint, type, build, or CI checks.
- Current labels: audience=user; proof=deterministic; surface=none; readiness=ready-to-verify; evidence=unknown
- Source excerpt: `deterministic`: the claim belongs in unit, lint, type, build, or CI checks.
- Suggested next action: Keep or add a repo-owned unit, lint, build, schema, or CI check for this claim.
- Human claim quality: TODO
- Human corrected audience: keep
- Human corrected semantic group: keep
- Human corrected proof: keep
- Human corrected eval surface: keep
- Human readiness: keep
- Human priority: TODO
- Human notes:
- Trace: 1 source ref; skills/cautilus/SKILL.md:106

##### claim-skills-cautilus-skill-md-20

- Summary: The binary owns command discovery, packet examples, deterministic scans, validation, and reusable evaluation artifacts.
- Current labels: audience=user; proof=deterministic; surface=none; readiness=ready-to-verify; evidence=unknown
- Source excerpt: The binary owns command discovery, packet examples, deterministic scans, validation, and reusable evaluation artifacts.
- Suggested next action: Keep or add a repo-owned unit, lint, build, schema, or CI check for this claim.
- Human claim quality: TODO
- Human corrected audience: keep
- Human corrected semantic group: keep
- Human corrected proof: keep
- Human corrected eval surface: keep
- Human readiness: keep
- Human priority: TODO
- Human notes:
- Trace: 1 source ref; skills/cautilus/SKILL.md:20

## Developer Claims (226)

### Adapter and portability (34)

#### Cautilus eval / app/prompt / ready-to-verify / evidence unknown (6)

##### claim-docs-contracts-claim-discovery-workflow-md-528

- Summary: The binary/skill boundary stays clean enough that consumer repos can use the binary plus bundled skill without Cautilus importing host-specific prompts or adapters.
- Current labels: audience=developer; proof=cautilus-eval; surface=app/prompt; readiness=ready-to-verify; evidence=unknown
- Source excerpt: The binary/skill boundary stays clean enough that consumer repos can use the binary plus bundled skill without Cautilus importing host-specific prompts or adapters.
- Suggested next action: Create a host-owned app/prompt fixture and run it through cautilus eval test.
- Human claim quality: TODO
- Human corrected audience: keep
- Human corrected semantic group: keep
- Human corrected proof: keep
- Human corrected eval surface: keep
- Human readiness: keep
- Human priority: TODO
- Human notes:
- Trace: 1 source ref; docs/contracts/claim-discovery-workflow.md:528

##### claim-docs-contracts-live-run-invocation-md-58

- Summary: For `persona_prompt`, the product owns the loop boundary, the request packet, the persona prompt shaping, and the result normalization.
- Current labels: audience=developer; proof=cautilus-eval; surface=app/prompt; readiness=ready-to-verify; evidence=unknown
- Source excerpt: For `persona_prompt`, the product owns the loop boundary, the request packet, the persona prompt shaping, and the result normalization.
- Suggested next action: Create a host-owned app/prompt fixture and run it through cautilus eval test.
- Human claim quality: TODO
- Human corrected audience: keep
- Human corrected semantic group: keep
- Human corrected proof: keep
- Human corrected eval surface: keep
- Human readiness: keep
- Human priority: TODO
- Human notes:
- Trace: 1 source ref; docs/contracts/live-run-invocation.md:58

##### claim-docs-contracts-runtime-fingerprint-optimization-md-50

- Summary: It should not directly auto-edit consumer-owned prompts, skills, or instruction files.
- Current labels: audience=developer; proof=cautilus-eval; surface=app/prompt; readiness=ready-to-verify; evidence=unknown
- Source excerpt: It should not directly auto-edit consumer-owned prompts, skills, or instruction files.
- Suggested next action: Create a host-owned app/prompt fixture and run it through cautilus eval test.
- Human claim quality: TODO
- Human corrected audience: keep
- Human corrected semantic group: keep
- Human corrected proof: keep
- Human corrected eval surface: keep
- Human readiness: keep
- Human priority: TODO
- Human notes:
- Trace: 1 source ref; docs/contracts/runtime-fingerprint-optimization.md:50

##### claim-docs-master-plan-md-27

- Summary: Cautilus owns the generic claim-to-proof workflow; consumer repos own their local fixtures, runners, prompts, wrappers, and policy.
- Current labels: audience=developer; proof=cautilus-eval; surface=app/prompt; readiness=ready-to-verify; evidence=unknown
- Source excerpt: Cautilus owns the generic claim-to-proof workflow; consumer repos own their local fixtures, runners, prompts, wrappers, and policy.
- Suggested next action: Create a host-owned app/prompt fixture and run it through cautilus eval test.
- Human claim quality: TODO
- Human corrected audience: keep
- Human corrected semantic group: keep
- Human corrected proof: keep
- Human corrected eval surface: keep
- Human readiness: keep
- Human priority: TODO
- Human notes:
- Trace: 1 source ref; docs/master-plan.md:27

##### claim-docs-specs-command-surfaces-spec-md-118

- Summary: It may point at source files and propose proof layers, but it must not import host-specific adapters, prompts, storage readers, or private workflow conventions into Cautilus.
- Current labels: audience=developer; proof=cautilus-eval; surface=app/prompt; readiness=ready-to-verify; evidence=unknown
- Source excerpt: It may point at source files and propose proof layers, but it must not import host-specific adapters, prompts, storage readers, or private workflow conventions into Cautilus.
- Suggested next action: Create a host-owned app/prompt fixture and run it through cautilus eval test.
- Human claim quality: TODO
- Human corrected audience: keep
- Human corrected semantic group: keep
- Human corrected proof: keep
- Human corrected eval surface: keep
- Human readiness: keep
- Human priority: TODO
- Human notes:
- Trace: 1 source ref; docs/specs/command-surfaces.spec.md:118

##### claim-docs-specs-command-surfaces-spec-md-189

- Summary: The host repo owns the fixture contents, runner implementation, prompt files, wrappers, and acceptance policy.
- Current labels: audience=developer; proof=cautilus-eval; surface=app/prompt; readiness=ready-to-verify; evidence=unknown
- Source excerpt: The host repo owns the fixture contents, runner implementation, prompt files, wrappers, and acceptance policy.
- Suggested next action: Create a host-owned app/prompt fixture and run it through cautilus eval test.
- Human claim quality: TODO
- Human corrected audience: keep
- Human corrected semantic group: keep
- Human corrected proof: keep
- Human corrected eval surface: keep
- Human readiness: keep
- Human priority: TODO
- Human notes:
- Trace: 1 source ref; docs/specs/command-surfaces.spec.md:189

#### Cautilus eval / dev/repo / ready-to-verify / evidence unknown (11)

##### claim-agents-md-79

- Summary: When a quality or release review asks for evaluator, review, CLI-discovery, or agent-surface proof, verify that the selected adapter can actually run that surface before treating the gate as available.
- Current labels: audience=developer; proof=cautilus-eval; surface=dev/repo; readiness=ready-to-verify; evidence=unknown
- Source excerpt: When a quality or release review asks for evaluator, review, CLI-discovery, or agent-surface proof, verify that the selected adapter can actually run that surface before treating the gate as available.
- Suggested next action: Create a host-owned dev/repo fixture and run it through cautilus eval test.
- Human claim quality: TODO
- Human corrected audience: keep
- Human corrected semantic group: keep
- Human corrected proof: keep
- Human corrected eval surface: keep
- Human readiness: keep
- Human priority: TODO
- Human notes:
- Trace: 1 source ref; AGENTS.md:79

##### claim-docs-contracts-active-run-md-212

- Summary: Should `run.json` carry workflow metadata (mode, baseline ref, adapter name) so the pruner and HTML views can present richer summaries?
- Current labels: audience=developer; proof=cautilus-eval; surface=dev/repo; readiness=ready-to-verify; evidence=unknown
- Source excerpt: Should `run.json` carry workflow metadata (mode, baseline ref, adapter name) so the pruner and HTML views can present richer summaries?
- Suggested next action: Create a host-owned dev/repo fixture and run it through cautilus eval test.
- Human claim quality: TODO
- Human corrected audience: keep
- Human corrected semantic group: keep
- Human corrected proof: keep
- Human corrected eval surface: keep
- Human readiness: keep
- Human priority: TODO
- Human notes:
- Trace: 1 source ref; docs/contracts/active-run.md:212

##### claim-docs-contracts-active-run-md-3

- Summary: `Cautilus` pins one product-owned per-run workspace root per workflow and keeps the reference sticky across consumer command invocations with a shell environment variable.
- Current labels: audience=developer; proof=cautilus-eval; surface=dev/repo; readiness=ready-to-verify; evidence=unknown
- Source excerpt: `Cautilus` pins one product-owned per-run workspace root per workflow and keeps the reference sticky across consumer command invocations with a shell environment variable.
- Suggested next action: Create a host-owned dev/repo fixture and run it through cautilus eval test.
- Human claim quality: TODO
- Human corrected audience: keep
- Human corrected semantic group: keep
- Human corrected proof: keep
- Human corrected eval surface: keep
- Human readiness: keep
- Human priority: TODO
- Human notes:
- Trace: 1 source ref; docs/contracts/active-run.md:3

##### claim-docs-contracts-adapter-contract-md-3

- Summary: `Cautilus` stays portable by loading repo-specific evaluation commands from an adapter instead of hardcoding benchmark runners into the workflow.
- Current labels: audience=developer; proof=cautilus-eval; surface=dev/repo; readiness=ready-to-verify; evidence=unknown
- Source excerpt: `Cautilus` stays portable by loading repo-specific evaluation commands from an adapter instead of hardcoding benchmark runners into the workflow.
- Suggested next action: Create a host-owned dev/repo fixture and run it through cautilus eval test.
- Human claim quality: TODO
- Human corrected audience: keep
- Human corrected semantic group: keep
- Human corrected proof: keep
- Human corrected eval surface: keep
- Human readiness: keep
- Human priority: TODO
- Human notes:
- Trace: 1 source ref; docs/contracts/adapter-contract.md:3

##### claim-docs-contracts-reporting-md-111

- Summary: Model and provider truth should come from explicit runner output, adapter metadata, or checked-in wrappers, not from retroactive log scraping.
- Current labels: audience=developer; proof=cautilus-eval; surface=dev/repo; readiness=ready-to-verify; evidence=unknown
- Source excerpt: Model and provider truth should come from explicit runner output, adapter metadata, or checked-in wrappers, not from retroactive log scraping.
- Suggested next action: Create a host-owned dev/repo fixture and run it through cautilus eval test.
- Human claim quality: TODO
- Human corrected audience: keep
- Human corrected semantic group: keep
- Human corrected proof: keep
- Human corrected eval surface: keep
- Human readiness: keep
- Human priority: TODO
- Human notes:
- Trace: 1 source ref; docs/contracts/reporting.md:111

##### claim-docs-contracts-runtime-fingerprint-optimization-md-34

- Summary: Adapter command templates may still pin a model when the evaluated product explicitly requires one.
- Current labels: audience=developer; proof=cautilus-eval; surface=dev/repo; readiness=ready-to-verify; evidence=unknown
- Source excerpt: Adapter command templates may still pin a model when the evaluated product explicitly requires one.
- Suggested next action: Create a host-owned dev/repo fixture and run it through cautilus eval test.
- Human claim quality: TODO
- Human corrected audience: keep
- Human corrected semantic group: keep
- Human corrected proof: keep
- Human corrected eval surface: keep
- Human readiness: keep
- Human priority: TODO
- Human notes:
- Trace: 1 source ref; docs/contracts/runtime-fingerprint-optimization.md:34

##### claim-docs-contracts-scenario-proposal-sources-md-152

- Summary: Evidence should preserve where the suggestion came from without forcing one host repo's storage model on the product.
- Current labels: audience=developer; proof=cautilus-eval; surface=dev/repo; readiness=ready-to-verify; evidence=unknown
- Source excerpt: Evidence should preserve where the suggestion came from without forcing one host repo's storage model on the product.
- Suggested next action: Create a host-owned dev/repo fixture and run it through cautilus eval test.
- Human claim quality: TODO
- Human corrected audience: keep
- Human corrected semantic group: keep
- Human corrected proof: keep
- Human corrected eval surface: keep
- Human readiness: keep
- Human priority: TODO
- Human notes:
- Trace: 1 source ref; docs/contracts/scenario-proposal-sources.md:152

##### claim-docs-maintainers-consumer-readiness-md-30

- Summary: Stronger binary or bundled-skill claims should come back as explicit eval presets, fixture series, or named adapters instead of being smuggled into the canonical latest eval summary.
- Current labels: audience=developer; proof=cautilus-eval; surface=dev/repo; readiness=ready-to-verify; evidence=unknown
- Source excerpt: Stronger binary or bundled-skill claims should come back as explicit eval presets, fixture series, or named adapters instead of being smuggled into the canonical latest eval summary.
- Suggested next action: Create a host-owned dev/repo fixture and run it through cautilus eval test.
- Human claim quality: TODO
- Human corrected audience: keep
- Human corrected semantic group: keep
- Human corrected proof: keep
- Human corrected eval surface: keep
- Human readiness: keep
- Human priority: TODO
- Human notes:
- Trace: 1 source ref; docs/maintainers/consumer-readiness.md:30

##### claim-docs-master-plan-md-54

- Summary: checked-in local gates, GitHub workflows that run `verify`, and an external consumer onboarding smoke (`consumer:onboard:smoke`) that proves install → adapter init → minimal wiring → adapter resolve → doctor ready → one bounded `eval test`
- Current labels: audience=developer; proof=cautilus-eval; surface=dev/repo; readiness=ready-to-verify; evidence=unknown
- Source excerpt: checked-in local gates, GitHub workflows that run `verify`, and an external consumer onboarding smoke (`consumer:onboard:smoke`) that proves install → adapter init → minimal wiring → adapter resolve → doctor ready → one bounded `eval test`
- Suggested next action: Create a host-owned dev/repo fixture and run it through cautilus eval test.
- Human claim quality: TODO
- Human corrected audience: keep
- Human corrected semantic group: keep
- Human corrected proof: keep
- Human corrected eval surface: keep
- Human readiness: keep
- Human priority: TODO
- Human notes:
- Trace: 1 source ref; docs/master-plan.md:54

##### claim-docs-specs-command-surfaces-spec-md-253

- Summary: A fresh consumer can ask Cautilus what declared behavior claims still need proof before writing eval fixtures.
- Current labels: audience=developer; proof=cautilus-eval; surface=dev/repo; readiness=ready-to-verify; evidence=unknown
- Source excerpt: A fresh consumer can ask Cautilus what declared behavior claims still need proof before writing eval fixtures.
- Suggested next action: Create a host-owned dev/repo fixture and run it through cautilus eval test.
- Human claim quality: TODO
- Human corrected audience: keep
- Human corrected semantic group: keep
- Human corrected proof: keep
- Human corrected eval surface: keep
- Human readiness: keep
- Human priority: TODO
- Human notes:
- Trace: 1 source ref; docs/specs/command-surfaces.spec.md:253

##### claim-docs-specs-evaluation-surfaces-spec-md-63

- Summary: Those hints are adapter instructions, not product concepts; the portable fixture contract remains the ordered user inputs and the expected behavior evidence.
- Current labels: audience=developer; proof=cautilus-eval; surface=dev/repo; readiness=ready-to-verify; evidence=unknown
- Source excerpt: Those hints are adapter instructions, not product concepts; the portable fixture contract remains the ordered user inputs and the expected behavior evidence.
- Suggested next action: Create a host-owned dev/repo fixture and run it through cautilus eval test.
- Human claim quality: TODO
- Human corrected audience: keep
- Human corrected semantic group: keep
- Human corrected proof: keep
- Human corrected eval surface: keep
- Human readiness: keep
- Human priority: TODO
- Human notes:
- Trace: 1 source ref; docs/specs/evaluation-surfaces.spec.md:63

#### Cautilus eval / dev/skill / ready-to-verify / evidence unknown (1)

##### claim-docs-specs-evaluation-surfaces-spec-md-62

- Summary: Dev-surface turns may also carry runtime-adapter hints such as `injectSkill: true` when the runner must materialize a portable skill body for a coding-agent CLI that does not perform host skill expansion itself.
- Current labels: audience=developer; proof=cautilus-eval; surface=dev/skill; readiness=ready-to-verify; evidence=unknown
- Source excerpt: Dev-surface turns may also carry runtime-adapter hints such as `injectSkill: true` when the runner must materialize a portable skill body for a coding-agent CLI that does not perform host skill expansion itself.
- Suggested next action: Create a host-owned dev/skill fixture and run it through cautilus eval test.
- Human claim quality: TODO
- Human corrected audience: keep
- Human corrected semantic group: keep
- Human corrected proof: keep
- Human corrected eval surface: keep
- Human readiness: keep
- Human priority: TODO
- Human notes:
- Trace: 1 source ref; docs/specs/evaluation-surfaces.spec.md:62

#### Cautilus eval / surface undecided / needs-scenario / evidence unknown (7)

##### claim-docs-contracts-live-run-invocation-md-194

- Summary: Operators can distinguish scenario failure, blocked execution, and invocation failure.
- Current labels: audience=developer; proof=cautilus-eval; surface=none; readiness=needs-scenario; evidence=unknown
- Source excerpt: Operators can distinguish scenario failure, blocked execution, and invocation failure.
- Suggested next action: Use the scenario proposal flow to normalize candidate evidence before creating a checked-in eval fixture.
- Human claim quality: TODO
- Human corrected audience: keep
- Human corrected semantic group: keep
- Human corrected proof: keep
- Human corrected eval surface: keep
- Human readiness: keep
- Human priority: TODO
- Human notes:
- Trace: 1 source ref; docs/contracts/live-run-invocation.md:194

##### claim-docs-contracts-live-run-invocation-md-3

- Summary: Issue `#18` closes only if `Cautilus` can ask a consumer to run one bounded scenario packet against one selected live instance without inheriting the consumer's route layout.
- Current labels: audience=developer; proof=cautilus-eval; surface=none; readiness=needs-scenario; evidence=unknown
- Source excerpt: Issue `#18` closes only if `Cautilus` can ask a consumer to run one bounded scenario packet against one selected live instance without inheriting the consumer's route layout.
- Suggested next action: Use the scenario proposal flow to normalize candidate evidence before creating a checked-in eval fixture.
- Human claim quality: TODO
- Human corrected audience: keep
- Human corrected semantic group: keep
- Human corrected proof: keep
- Human corrected eval surface: keep
- Human readiness: keep
- Human priority: TODO
- Human notes:
- Trace: 1 source ref; docs/contracts/live-run-invocation.md:3

##### claim-docs-contracts-scenario-proposal-sources-md-240

- Summary: Proposal generation should depend on normalized source ports, not direct host repo file traversal baked into `Cautilus`.
- Current labels: audience=developer; proof=cautilus-eval; surface=none; readiness=needs-scenario; evidence=unknown
- Source excerpt: Proposal generation should depend on normalized source ports, not direct host repo file traversal baked into `Cautilus`.
- Suggested next action: Use the scenario proposal flow to normalize candidate evidence before creating a checked-in eval fixture.
- Human claim quality: TODO
- Human corrected audience: keep
- Human corrected semantic group: keep
- Human corrected proof: keep
- Human corrected eval surface: keep
- Human readiness: keep
- Human priority: TODO
- Human notes:
- Trace: 1 source ref; docs/contracts/scenario-proposal-sources.md:240

##### claim-docs-contracts-scenario-proposal-sources-md-3

- Summary: `Cautilus` should eventually propose new or refreshed evaluation scenarios from recent operator activity and recent runtime outcomes, but the product boundary must stay independent from any one host repo's storage layout.
- Current labels: audience=developer; proof=cautilus-eval; surface=none; readiness=needs-scenario; evidence=unknown
- Source excerpt: `Cautilus` should eventually propose new or refreshed evaluation scenarios from recent operator activity and recent runtime outcomes, but the product boundary must stay independent from any one host repo's storage layout.
- Suggested next action: Use the scenario proposal flow to normalize candidate evidence before creating a checked-in eval fixture.
- Human claim quality: TODO
- Human corrected audience: keep
- Human corrected semantic group: keep
- Human corrected proof: keep
- Human corrected eval surface: keep
- Human readiness: keep
- Human priority: TODO
- Human notes:
- Trace: 1 source ref; docs/contracts/scenario-proposal-sources.md:3

##### claim-docs-contracts-workbench-instance-discovery-md-5

- Summary: It is the local-first routing contract that says which instances exist on this host and where each instance keeps its scenario-adjacent data.
- Current labels: audience=developer; proof=cautilus-eval; surface=none; readiness=needs-scenario; evidence=unknown
- Source excerpt: It is the local-first routing contract that says which instances exist on this host and where each instance keeps its scenario-adjacent data.
- Suggested next action: Use the scenario proposal flow to normalize candidate evidence before creating a checked-in eval fixture.
- Human claim quality: TODO
- Human corrected audience: keep
- Human corrected semantic group: keep
- Human corrected proof: keep
- Human corrected eval surface: keep
- Human readiness: keep
- Human priority: TODO
- Human notes:
- Trace: 1 source ref; docs/contracts/workbench-instance-discovery.md:5

##### claim-docs-contracts-workbench-instance-discovery-md-98

- Summary: The product can read scenario-adjacent paths from typed packet fields instead of hardcoded route templates.
- Current labels: audience=developer; proof=cautilus-eval; surface=none; readiness=needs-scenario; evidence=unknown
- Source excerpt: The product can read scenario-adjacent paths from typed packet fields instead of hardcoded route templates.
- Suggested next action: Use the scenario proposal flow to normalize candidate evidence before creating a checked-in eval fixture.
- Human claim quality: TODO
- Human corrected audience: keep
- Human corrected semantic group: keep
- Human corrected proof: keep
- Human corrected eval surface: keep
- Human readiness: keep
- Human priority: TODO
- Human notes:
- Trace: 1 source ref; docs/contracts/workbench-instance-discovery.md:98

##### claim-docs-maintainers-consumer-readiness-md-91

- Summary: the same consumer keeps its standing repo-owned evaluator path green on the released binary: `python3 scripts/run-evals.py --repo-root .` passed its maintained scenario set and `pytest tests/test_cautilus_scenarios.py` stayed green
- Current labels: audience=developer; proof=cautilus-eval; surface=none; readiness=needs-scenario; evidence=unknown
- Source excerpt: the same consumer keeps its standing repo-owned evaluator path green on the released binary: `python3 scripts/run-evals.py --repo-root .` passed its maintained scenario set and `pytest tests/test_cautilus_scenarios.py` stayed green
- Suggested next action: Use the scenario proposal flow to normalize candidate evidence before creating a checked-in eval fixture.
- Human claim quality: TODO
- Human corrected audience: keep
- Human corrected semantic group: keep
- Human corrected proof: keep
- Human corrected eval surface: keep
- Human readiness: keep
- Human priority: TODO
- Human notes:
- Trace: 1 source ref; docs/maintainers/consumer-readiness.md:91

#### Deterministic gate / ready-to-verify / evidence unknown (3)

##### claim-agents-md-12

- Summary: Deterministic behavior belongs in code, scripts, adapters, tests, and specs.
- Current labels: audience=developer; proof=deterministic; surface=none; readiness=ready-to-verify; evidence=unknown
- Source excerpt: Deterministic behavior belongs in code, scripts, adapters, tests, and specs.
- Suggested next action: Keep or add a repo-owned unit, lint, build, schema, or CI check for this claim.
- Human claim quality: TODO
- Human corrected audience: keep
- Human corrected semantic group: keep
- Human corrected proof: keep
- Human corrected eval surface: keep
- Human readiness: keep
- Human priority: TODO
- Human notes:
- Trace: 1 source ref; AGENTS.md:12

##### claim-docs-contracts-adapter-contract-md-367

- Summary: This keeps prompt benchmarking, code-quality benchmarking, and workflow smoke tests from collapsing into one overloaded adapter file.
- Current labels: audience=developer; proof=deterministic; surface=none; readiness=ready-to-verify; evidence=unknown
- Source excerpt: This keeps prompt benchmarking, code-quality benchmarking, and workflow smoke tests from collapsing into one overloaded adapter file.
- Suggested next action: Keep or add a repo-owned unit, lint, build, schema, or CI check for this claim.
- Human claim quality: TODO
- Human corrected audience: keep
- Human corrected semantic group: keep
- Human corrected proof: keep
- Human corrected eval surface: keep
- Human readiness: keep
- Human priority: TODO
- Human notes:
- Trace: 1 source ref; docs/contracts/adapter-contract.md:367

##### claim-docs-maintainers-consumer-readiness-md-29

- Summary: The repo keeps cheap deterministic proof in the root adapter and explicit LLM-backed self-dogfood paths in named adapters.
- Current labels: audience=developer; proof=deterministic; surface=none; readiness=ready-to-verify; evidence=unknown
- Source excerpt: The repo keeps cheap deterministic proof in the root adapter and explicit LLM-backed self-dogfood paths in named adapters.
- Suggested next action: Keep or add a repo-owned unit, lint, build, schema, or CI check for this claim.
- Human claim quality: TODO
- Human corrected audience: keep
- Human corrected semantic group: keep
- Human corrected proof: keep
- Human corrected eval surface: keep
- Human readiness: keep
- Human priority: TODO
- Human notes:
- Trace: 1 source ref; docs/maintainers/consumer-readiness.md:29

#### Human-auditable / needs-alignment / evidence unknown (4)

##### claim-docs-contracts-claim-discovery-workflow-md-248

- Summary: `verificationReadiness=needs-alignment` means at least two truth surfaces must be reconciled before proof would be honest.
- Current labels: audience=developer; proof=human-auditable; surface=none; readiness=needs-alignment; evidence=unknown
- Source excerpt: `verificationReadiness=needs-alignment` means at least two truth surfaces must be reconciled before proof would be honest.
- Suggested next action: Reconcile the named docs, code, skill, adapter, or CLI surface before treating this as a verification target.
- Human claim quality: TODO
- Human corrected audience: keep
- Human corrected semantic group: keep
- Human corrected proof: keep
- Human corrected eval surface: keep
- Human readiness: keep
- Human priority: TODO
- Human notes:
- Trace: 1 source ref; docs/contracts/claim-discovery-workflow.md:248

##### claim-docs-contracts-reporting-md-112

- Summary: Runtime drift codes should be recorded as runtime context rather than primary behavior-outcome reason codes unless a pinned-runtime policy blocks the run.
- Current labels: audience=developer; proof=human-auditable; surface=none; readiness=needs-alignment; evidence=unknown
- Source excerpt: Runtime drift codes should be recorded as runtime context rather than primary behavior-outcome reason codes unless a pinned-runtime policy blocks the run.
- Suggested next action: Reconcile the named docs, code, skill, adapter, or CLI surface before treating this as a verification target.
- Human claim quality: TODO
- Human corrected audience: keep
- Human corrected semantic group: keep
- Human corrected proof: keep
- Human corrected eval surface: keep
- Human readiness: keep
- Human priority: TODO
- Human notes:
- Trace: 1 source ref; docs/contracts/reporting.md:112

##### claim-docs-maintainers-consumer-readiness-md-59

- Summary: `Cautilus` can normalize public-skill, profile, and validation drift without binding the product to one named repo's layout.
- Current labels: audience=developer; proof=human-auditable; surface=none; readiness=needs-alignment; evidence=unknown
- Source excerpt: `Cautilus` can normalize public-skill, profile, and validation drift without binding the product to one named repo's layout.
- Suggested next action: Reconcile the named docs, code, skill, adapter, or CLI surface before treating this as a verification target.
- Human claim quality: TODO
- Human corrected audience: keep
- Human corrected semantic group: keep
- Human corrected proof: keep
- Human corrected eval surface: keep
- Human readiness: keep
- Human priority: TODO
- Human notes:
- Trace: 1 source ref; docs/maintainers/consumer-readiness.md:59

##### claim-docs-maintainers-consumer-readiness-md-98

- Summary: `Cautilus` now has one external proof that a bootstrap-heavy agent-runtime consumer can adopt the released `bootstrapHelper` / `workSkill` contract without false mismatches.
- Current labels: audience=developer; proof=human-auditable; surface=none; readiness=needs-alignment; evidence=unknown
- Source excerpt: `Cautilus` now has one external proof that a bootstrap-heavy agent-runtime consumer can adopt the released `bootstrapHelper` / `workSkill` contract without false mismatches.
- Suggested next action: Reconcile the named docs, code, skill, adapter, or CLI surface before treating this as a verification target.
- Human claim quality: TODO
- Human corrected audience: keep
- Human corrected semantic group: keep
- Human corrected proof: keep
- Human corrected eval surface: keep
- Human readiness: keep
- Human priority: TODO
- Human notes:
- Trace: 1 source ref; docs/maintainers/consumer-readiness.md:98

#### Human-auditable / ready-to-verify / evidence unknown (2)

##### claim-docs-contracts-workbench-instance-discovery-md-24

- Summary: Every instance must expose a stable `instanceId` and a human-facing `displayLabel`.
- Current labels: audience=developer; proof=human-auditable; surface=none; readiness=ready-to-verify; evidence=unknown
- Source excerpt: Every instance must expose a stable `instanceId` and a human-facing `displayLabel`.
- Suggested next action: Record the source reference and keep it human-auditable; add deterministic or eval proof only if behavior depends on execution.
- Human claim quality: TODO
- Human corrected audience: keep
- Human corrected semantic group: keep
- Human corrected proof: keep
- Human corrected eval surface: keep
- Human readiness: keep
- Human priority: TODO
- Human notes:
- Trace: 1 source ref; docs/contracts/workbench-instance-discovery.md:24

##### claim-docs-contracts-workbench-instance-discovery-md-97

- Summary: The product can render a human-facing instance chooser without learning consumer-native labels itself.
- Current labels: audience=developer; proof=human-auditable; surface=none; readiness=ready-to-verify; evidence=unknown
- Source excerpt: The product can render a human-facing instance chooser without learning consumer-native labels itself.
- Suggested next action: Record the source reference and keep it human-auditable; add deterministic or eval proof only if behavior depends on execution.
- Human claim quality: TODO
- Human corrected audience: keep
- Human corrected semantic group: keep
- Human corrected proof: keep
- Human corrected eval surface: keep
- Human readiness: keep
- Human priority: TODO
- Human notes:
- Trace: 1 source ref; docs/contracts/workbench-instance-discovery.md:97

### Agent and skill workflow (8)

#### Cautilus eval / surface undecided / needs-scenario / evidence unknown (6)

##### claim-docs-contracts-claim-discovery-workflow-md-320

- Summary: Subagents should receive clusters with source excerpts, source refs, candidate labels, possible evidence refs, and a bounded output schema.
- Current labels: audience=developer; proof=cautilus-eval; surface=none; readiness=needs-scenario; evidence=unknown
- Source excerpt: Subagents should receive clusters with source excerpts, source refs, candidate labels, possible evidence refs, and a bounded output schema.
- Suggested next action: Use the scenario proposal flow to normalize candidate evidence before creating a checked-in eval fixture.
- Human claim quality: TODO
- Human corrected audience: keep
- Human corrected semantic group: keep
- Human corrected proof: keep
- Human corrected eval surface: keep
- Human readiness: keep
- Human priority: TODO
- Human notes:
- Trace: 1 source ref; docs/contracts/claim-discovery-workflow.md:320

##### claim-docs-contracts-claim-discovery-workflow-md-500

- Summary: What subagent batch size and cluster shape keeps review cost bounded on repos with hundreds of raw candidates?
- Current labels: audience=developer; proof=cautilus-eval; surface=none; readiness=needs-scenario; evidence=unknown
- Source excerpt: What subagent batch size and cluster shape keeps review cost bounded on repos with hundreds of raw candidates?
- Suggested next action: Use the scenario proposal flow to normalize candidate evidence before creating a checked-in eval fixture.
- Human claim quality: TODO
- Human corrected audience: keep
- Human corrected semantic group: keep
- Human corrected proof: keep
- Human corrected eval surface: keep
- Human readiness: keep
- Human priority: TODO
- Human notes:
- Trace: 1 source ref; docs/contracts/claim-discovery-workflow.md:500

##### claim-docs-contracts-claim-discovery-workflow-md-581

- Summary: `claim show` emits `cautilus.claim_status_summary.v1` and can include bounded `sampleClaims` plus `gitState` for agents that need concrete candidates before choosing the next branch.
- Current labels: audience=developer; proof=cautilus-eval; surface=none; readiness=needs-scenario; evidence=unknown
- Source excerpt: `claim show` emits `cautilus.claim_status_summary.v1` and can include bounded `sampleClaims` plus `gitState` for agents that need concrete candidates before choosing the next branch.
- Suggested next action: Use the scenario proposal flow to normalize candidate evidence before creating a checked-in eval fixture.
- Human claim quality: TODO
- Human corrected audience: keep
- Human corrected semantic group: keep
- Human corrected proof: keep
- Human corrected eval surface: keep
- Human readiness: keep
- Human priority: TODO
- Human notes:
- Trace: 1 source ref; docs/contracts/claim-discovery-workflow.md:581

##### claim-docs-contracts-scenario-history-md-289

- Summary: Scenario-history is archetype-neutral and stays that way unless a skill-specific graduation policy is introduced.
- Current labels: audience=developer; proof=cautilus-eval; surface=none; readiness=needs-scenario; evidence=unknown
- Source excerpt: Scenario-history is archetype-neutral and stays that way unless a skill-specific graduation policy is introduced.
- Suggested next action: Use the scenario proposal flow to normalize candidate evidence before creating a checked-in eval fixture.
- Human claim quality: TODO
- Human corrected audience: keep
- Human corrected semantic group: keep
- Human corrected proof: keep
- Human corrected eval surface: keep
- Human readiness: keep
- Human priority: TODO
- Human notes:
- Trace: 1 source ref; docs/contracts/scenario-history.md:289

##### claim-docs-specs-command-surfaces-spec-md-152

- Summary: When called with `--sample-claims <n>`, it includes a bounded `sampleClaims` list so agents can inspect stable candidate fields without guessing raw packet keys.
- Current labels: audience=developer; proof=cautilus-eval; surface=none; readiness=needs-scenario; evidence=unknown
- Source excerpt: When called with `--sample-claims <n>`, it includes a bounded `sampleClaims` list so agents can inspect stable candidate fields without guessing raw packet keys.
- Suggested next action: Use the scenario proposal flow to normalize candidate evidence before creating a checked-in eval fixture.
- Human claim quality: TODO
- Human corrected audience: keep
- Human corrected semantic group: keep
- Human corrected proof: keep
- Human corrected eval surface: keep
- Human readiness: keep
- Human priority: TODO
- Human notes:
- Trace: 1 source ref; docs/specs/command-surfaces.spec.md:152

##### claim-docs-specs-index-spec-md-24

- Summary: The first proof deliberately shows a small end-to-end product move: `Cautilus` turns raw proposal inputs into a reusable scenario packet and then into a page a human can scan in a browser.
- Current labels: audience=developer; proof=cautilus-eval; surface=none; readiness=needs-scenario; evidence=unknown
- Source excerpt: The first proof deliberately shows a small end-to-end product move: `Cautilus` turns raw proposal inputs into a reusable scenario packet and then into a page a human can scan in a browser.
- Suggested next action: Use the scenario proposal flow to normalize candidate evidence before creating a checked-in eval fixture.
- Human claim quality: TODO
- Human corrected audience: keep
- Human corrected semantic group: keep
- Human corrected proof: keep
- Human corrected eval surface: keep
- Human readiness: keep
- Human priority: TODO
- Human notes:
- Trace: 1 source ref; docs/specs/index.spec.md:24

#### Human-auditable / ready-to-verify / evidence unknown (2)

##### claim-docs-maintainers-consumer-readiness-md-5

- Summary: Product-facing docs should describe repo-agnostic surfaces such as `chatbot`, `skill`, `workflow`, and `agent runtime` first, then point here for checked-in evidence shapes and proof expectations.
- Current labels: audience=developer; proof=human-auditable; surface=none; readiness=ready-to-verify; evidence=unknown
- Source excerpt: Product-facing docs should describe repo-agnostic surfaces such as `chatbot`, `skill`, `workflow`, and `agent runtime` first, then point here for checked-in evidence shapes and proof expectations.
- Suggested next action: Record the source reference and keep it human-auditable; add deterministic or eval proof only if behavior depends on execution.
- Human claim quality: TODO
- Human corrected audience: keep
- Human corrected semantic group: keep
- Human corrected proof: keep
- Human corrected eval surface: keep
- Human readiness: keep
- Human priority: TODO
- Human notes:
- Trace: 1 source ref; docs/maintainers/consumer-readiness.md:5

##### claim-docs-specs-index-spec-md-40

- Summary: HTML Report Surface (html-report.spec.md) Proves the currently shipped static HTML outputs that let a human review packet-based artifacts in a browser.
- Current labels: audience=developer; proof=human-auditable; surface=none; readiness=ready-to-verify; evidence=unknown
- Source excerpt: HTML Report Surface (html-report.spec.md) Proves the currently shipped static HTML outputs that let a human review packet-based artifacts in a browser.
- Suggested next action: Record the source reference and keep it human-auditable; add deterministic or eval proof only if behavior depends on execution.
- Human claim quality: TODO
- Human corrected audience: keep
- Human corrected semantic group: keep
- Human corrected proof: keep
- Human corrected eval surface: keep
- Human readiness: keep
- Human priority: TODO
- Human notes:
- Trace: 1 source ref; docs/specs/index.spec.md:40

### Claim discovery and review (12)

#### Cautilus eval / dev/repo / ready-to-verify / evidence unknown (4)

##### claim-docs-contracts-claim-discovery-workflow-md-379

- Summary: The binary may provide helper flags such as `claim discover --previous <packet> --refresh-plan`, but the public user-level workflow remains `discover`.
- Current labels: audience=developer; proof=cautilus-eval; surface=dev/repo; readiness=ready-to-verify; evidence=unknown
- Source excerpt: The binary may provide helper flags such as `claim discover --previous <packet> --refresh-plan`, but the public user-level workflow remains `discover`.
- Suggested next action: Create a host-owned dev/repo fixture and run it through cautilus eval test.
- Human claim quality: TODO
- Human corrected audience: keep
- Human corrected semantic group: keep
- Human corrected proof: keep
- Human corrected eval surface: keep
- Human readiness: keep
- Human priority: TODO
- Human notes:
- Trace: 1 source ref; docs/contracts/claim-discovery-workflow.md:379

##### claim-docs-contracts-claim-discovery-workflow-md-582

- Summary: `claim review prepare-input` emits `cautilus.claim_review_input.v1` and records bounded clusters and skipped clusters, but still does not call an LLM or merge review results.
- Current labels: audience=developer; proof=cautilus-eval; surface=dev/repo; readiness=ready-to-verify; evidence=unknown
- Source excerpt: `claim review prepare-input` emits `cautilus.claim_review_input.v1` and records bounded clusters and skipped clusters, but still does not call an LLM or merge review results.
- Suggested next action: Create a host-owned dev/repo fixture and run it through cautilus eval test.
- Human claim quality: TODO
- Human corrected audience: keep
- Human corrected semantic group: keep
- Human corrected proof: keep
- Human corrected eval surface: keep
- Human readiness: keep
- Human priority: TODO
- Human notes:
- Trace: 1 source ref; docs/contracts/claim-discovery-workflow.md:582

##### claim-docs-maintainers-operator-acceptance-md-256

- Summary: 리드미는 *"static HTML views of the same artifacts so a human reviewer can judge them in a browser without an agent in the loop"*을 약속한다.
- Current labels: audience=developer; proof=cautilus-eval; surface=dev/repo; readiness=ready-to-verify; evidence=unknown
- Source excerpt: 리드미는 *"static HTML views of the same artifacts so a human reviewer can judge them in a browser without an agent in the loop"*을 약속한다.
- Suggested next action: Create a host-owned dev/repo fixture and run it through cautilus eval test.
- Human claim quality: TODO
- Human corrected audience: keep
- Human corrected semantic group: keep
- Human corrected proof: keep
- Human corrected eval surface: keep
- Human readiness: keep
- Human priority: TODO
- Human notes:
- Trace: 1 source ref; docs/maintainers/operator-acceptance.md:256

##### claim-docs-specs-command-surfaces-spec-md-248

- Summary: `claim discover` must be useful before a repo has a runnable eval adapter.
- Current labels: audience=developer; proof=cautilus-eval; surface=dev/repo; readiness=ready-to-verify; evidence=unknown
- Source excerpt: `claim discover` must be useful before a repo has a runnable eval adapter.
- Suggested next action: Create a host-owned dev/repo fixture and run it through cautilus eval test.
- Human claim quality: TODO
- Human corrected audience: keep
- Human corrected semantic group: keep
- Human corrected proof: keep
- Human corrected eval surface: keep
- Human readiness: keep
- Human priority: TODO
- Human notes:
- Trace: 1 source ref; docs/specs/command-surfaces.spec.md:248

#### Cautilus eval / dev/skill / ready-to-verify / evidence unknown (4)

##### claim-docs-contracts-adapter-contract-md-182

- Summary: The binary uses these hints to label review queues, while the bundled skill or a human reviewer may still correct semantic edge cases.
- Current labels: audience=developer; proof=cautilus-eval; surface=dev/skill; readiness=ready-to-verify; evidence=unknown
- Source excerpt: The binary uses these hints to label review queues, while the bundled skill or a human reviewer may still correct semantic edge cases.
- Suggested next action: Create a host-owned dev/skill fixture and run it through cautilus eval test.
- Human claim quality: TODO
- Human corrected audience: keep
- Human corrected semantic group: keep
- Human corrected proof: keep
- Human corrected eval surface: keep
- Human readiness: keep
- Human priority: TODO
- Human notes:
- Trace: 1 source ref; docs/contracts/adapter-contract.md:182

##### claim-docs-contracts-claim-discovery-workflow-md-122

- Summary: The binary only understands the portable labels `user`, `developer`, and `unclear`; richer semantic grouping remains review work for the skill and reviewer loop.
- Current labels: audience=developer; proof=cautilus-eval; surface=dev/skill; readiness=ready-to-verify; evidence=unknown
- Source excerpt: The binary only understands the portable labels `user`, `developer`, and `unclear`; richer semantic grouping remains review work for the skill and reviewer loop.
- Suggested next action: Create a host-owned dev/skill fixture and run it through cautilus eval test.
- Human claim quality: TODO
- Human corrected audience: keep
- Human corrected semantic group: keep
- Human corrected proof: keep
- Human corrected eval surface: keep
- Human readiness: keep
- Human priority: TODO
- Human notes:
- Trace: 1 source ref; docs/contracts/claim-discovery-workflow.md:122

##### claim-docs-contracts-claim-discovery-workflow-md-472

- Summary: Helper flags under `claim discover` are enough if the skill keeps the user-facing action as discover.
- Current labels: audience=developer; proof=cautilus-eval; surface=dev/skill; readiness=ready-to-verify; evidence=unknown
- Source excerpt: Helper flags under `claim discover` are enough if the skill keeps the user-facing action as discover.
- Suggested next action: Create a host-owned dev/skill fixture and run it through cautilus eval test.
- Human claim quality: TODO
- Human corrected audience: keep
- Human corrected semantic group: keep
- Human corrected proof: keep
- Human corrected eval surface: keep
- Human readiness: keep
- Human priority: TODO
- Human notes:
- Trace: 1 source ref; docs/contracts/claim-discovery-workflow.md:472

##### claim-docs-specs-command-surfaces-spec-md-246

- Summary: The bundled skill must route claim discovery, evaluation, and optimization to the same family names as the binary.
- Current labels: audience=developer; proof=cautilus-eval; surface=dev/skill; readiness=ready-to-verify; evidence=unknown
- Source excerpt: The bundled skill must route claim discovery, evaluation, and optimization to the same family names as the binary.
- Suggested next action: Create a host-owned dev/skill fixture and run it through cautilus eval test.
- Human claim quality: TODO
- Human corrected audience: keep
- Human corrected semantic group: keep
- Human corrected proof: keep
- Human corrected eval surface: keep
- Human readiness: keep
- Human priority: TODO
- Human notes:
- Trace: 1 source ref; docs/specs/command-surfaces.spec.md:246

#### Cautilus eval / surface undecided / needs-scenario / evidence unknown (1)

##### claim-docs-contracts-adapter-contract-md-386

- Summary: A named adapter whose eval-test commands produce rich scenario-by-scenario signals should also persist them as files so executor variants and human reviewers can ground their verdicts on the same numbers.
- Current labels: audience=developer; proof=cautilus-eval; surface=none; readiness=needs-scenario; evidence=unknown
- Source excerpt: A named adapter whose eval-test commands produce rich scenario-by-scenario signals should also persist them as files so executor variants and human reviewers can ground their verdicts on the same numbers.
- Suggested next action: Use the scenario proposal flow to normalize candidate evidence before creating a checked-in eval fixture.
- Human claim quality: TODO
- Human corrected audience: keep
- Human corrected semantic group: keep
- Human corrected proof: keep
- Human corrected eval surface: keep
- Human readiness: keep
- Human priority: TODO
- Human notes:
- Trace: 1 source ref; docs/contracts/adapter-contract.md:386

#### Deterministic gate / ready-to-verify / evidence unknown (3)

##### claim-docs-contracts-claim-discovery-workflow-md-5

- Summary: `cautilus claim discover` currently emits a deterministic, source-ref-backed proof-plan skeleton.
- Current labels: audience=developer; proof=deterministic; surface=none; readiness=ready-to-verify; evidence=unknown
- Source excerpt: `cautilus claim discover` currently emits a deterministic, source-ref-backed proof-plan skeleton.
- Suggested next action: Keep or add a repo-owned unit, lint, build, schema, or CI check for this claim.
- Human claim quality: TODO
- Human corrected audience: keep
- Human corrected semantic group: keep
- Human corrected proof: keep
- Human corrected eval surface: keep
- Human readiness: keep
- Human priority: TODO
- Human notes:
- Trace: 1 source ref; docs/contracts/claim-discovery-workflow.md:5

##### claim-docs-master-plan-md-73

- Summary: The first `claim` slice ships as deterministic `cautilus claim discover`, which emits a source-ref-backed proof plan rather than a verdict.
- Current labels: audience=developer; proof=deterministic; surface=none; readiness=ready-to-verify; evidence=unknown
- Source excerpt: The first `claim` slice ships as deterministic `cautilus claim discover`, which emits a source-ref-backed proof plan rather than a verdict.
- Suggested next action: Keep or add a repo-owned unit, lint, build, schema, or CI check for this claim.
- Human claim quality: TODO
- Human corrected audience: keep
- Human corrected semantic group: keep
- Human corrected proof: keep
- Human corrected eval surface: keep
- Human readiness: keep
- Human priority: TODO
- Human notes:
- Trace: 1 source ref; docs/master-plan.md:73

##### claim-docs-specs-command-surfaces-spec-md-249

- Summary: `claim discover` must not imply that deterministic unit-test claims belong in Cautilus eval fixtures.
- Current labels: audience=developer; proof=deterministic; surface=none; readiness=ready-to-verify; evidence=unknown
- Source excerpt: `claim discover` must not imply that deterministic unit-test claims belong in Cautilus eval fixtures.
- Suggested next action: Keep or add a repo-owned unit, lint, build, schema, or CI check for this claim.
- Human claim quality: TODO
- Human corrected audience: keep
- Human corrected semantic group: keep
- Human corrected proof: keep
- Human corrected eval surface: keep
- Human readiness: keep
- Human priority: TODO
- Human notes:
- Trace: 1 source ref; docs/specs/command-surfaces.spec.md:249

### Documentation and contracts (30)

#### Cautilus eval / surface undecided / needs-scenario / evidence unknown (30)

##### claim-docs-contracts-adapter-contract-md-198

- Summary: `profile_default`: default scenario profile reference when the backend supports profiles.
- Current labels: audience=developer; proof=cautilus-eval; surface=none; readiness=needs-scenario; evidence=unknown
- Source excerpt: `profile_default`: default scenario profile reference when the backend supports profiles.
- Suggested next action: Use the scenario proposal flow to normalize candidate evidence before creating a checked-in eval fixture.
- Human claim quality: TODO
- Human corrected audience: keep
- Human corrected semantic group: keep
- Human corrected proof: keep
- Human corrected eval surface: keep
- Human readiness: keep
- Human priority: TODO
- Human notes:
- Trace: 1 source ref; docs/contracts/adapter-contract.md:198

##### claim-docs-contracts-claim-discovery-workflow-md-301

- Summary: The workflow should not send every raw candidate to an LLM independently.
- Current labels: audience=developer; proof=cautilus-eval; surface=none; readiness=needs-scenario; evidence=unknown
- Source excerpt: The workflow should not send every raw candidate to an LLM independently.
- Suggested next action: Use the scenario proposal flow to normalize candidate evidence before creating a checked-in eval fixture.
- Human claim quality: TODO
- Human corrected audience: keep
- Human corrected semantic group: keep
- Human corrected proof: keep
- Human corrected eval surface: keep
- Human readiness: keep
- Human priority: TODO
- Human notes:
- Trace: 1 source ref; docs/contracts/claim-discovery-workflow.md:301

##### claim-docs-contracts-claim-discovery-workflow-md-451

- Summary: Depth 3 must be paired with visible source, candidate, cluster, and review-budget bounds.
- Current labels: audience=developer; proof=cautilus-eval; surface=none; readiness=needs-scenario; evidence=unknown
- Source excerpt: Depth 3 must be paired with visible source, candidate, cluster, and review-budget bounds.
- Suggested next action: Use the scenario proposal flow to normalize candidate evidence before creating a checked-in eval fixture.
- Human claim quality: TODO
- Human corrected audience: keep
- Human corrected semantic group: keep
- Human corrected proof: keep
- Human corrected eval surface: keep
- Human readiness: keep
- Human priority: TODO
- Human notes:
- Trace: 1 source ref; docs/contracts/claim-discovery-workflow.md:451

##### claim-docs-contracts-claim-discovery-workflow-md-96

- Summary: When different real files declare the same normalized claim text, discovery should emit one claim candidate and preserve every declaration location in `sourceRefs`.
- Current labels: audience=developer; proof=cautilus-eval; surface=none; readiness=needs-scenario; evidence=unknown
- Source excerpt: When different real files declare the same normalized claim text, discovery should emit one claim candidate and preserve every declaration location in `sourceRefs`.
- Suggested next action: Use the scenario proposal flow to normalize candidate evidence before creating a checked-in eval fixture.
- Human claim quality: TODO
- Human corrected audience: keep
- Human corrected semantic group: keep
- Human corrected proof: keep
- Human corrected eval surface: keep
- Human readiness: keep
- Human priority: TODO
- Human notes:
- Trace: 1 source ref; docs/contracts/claim-discovery-workflow.md:96

##### claim-docs-contracts-live-run-invocation-batch-md-104

- Summary: When `requiredTags` is present, the prep command keeps only candidates that include every required tag exactly.
- Current labels: audience=developer; proof=cautilus-eval; surface=none; readiness=needs-scenario; evidence=unknown
- Source excerpt: When `requiredTags` is present, the prep command keeps only candidates that include every required tag exactly.
- Suggested next action: Use the scenario proposal flow to normalize candidate evidence before creating a checked-in eval fixture.
- Human claim quality: TODO
- Human corrected audience: keep
- Human corrected semantic group: keep
- Human corrected proof: keep
- Human corrected eval surface: keep
- Human readiness: keep
- Human priority: TODO
- Human notes:
- Trace: 1 source ref; docs/contracts/live-run-invocation-batch.md:104

##### claim-docs-contracts-optimization-md-96

- Summary: The proposal should include:
- Current labels: audience=developer; proof=cautilus-eval; surface=none; readiness=needs-scenario; evidence=unknown
- Source excerpt: The proposal should include:
- Suggested next action: Use the scenario proposal flow to normalize candidate evidence before creating a checked-in eval fixture.
- Human claim quality: TODO
- Human corrected audience: keep
- Human corrected semantic group: keep
- Human corrected proof: keep
- Human corrected eval surface: keep
- Human readiness: keep
- Human priority: TODO
- Human notes:
- Trace: 1 source ref; docs/contracts/optimization.md:96

##### claim-docs-contracts-runtime-fingerprint-optimization-md-241

- Summary: Proposals should show runtime comparison, passing evidence, target-size delta, and optionality.
- Current labels: audience=developer; proof=cautilus-eval; surface=none; readiness=needs-scenario; evidence=unknown
- Source excerpt: Proposals should show runtime comparison, passing evidence, target-size delta, and optionality.
- Suggested next action: Use the scenario proposal flow to normalize candidate evidence before creating a checked-in eval fixture.
- Human claim quality: TODO
- Human corrected audience: keep
- Human corrected semantic group: keep
- Human corrected proof: keep
- Human corrected eval surface: keep
- Human readiness: keep
- Human priority: TODO
- Human notes:
- Trace: 1 source ref; docs/contracts/runtime-fingerprint-optimization.md:241

##### claim-docs-contracts-scenario-history-md-123

- Summary: `Cautilus` should select scenarios with these rules:
- Current labels: audience=developer; proof=cautilus-eval; surface=none; readiness=needs-scenario; evidence=unknown
- Source excerpt: `Cautilus` should select scenarios with these rules:
- Suggested next action: Use the scenario proposal flow to normalize candidate evidence before creating a checked-in eval fixture.
- Human claim quality: TODO
- Human corrected audience: keep
- Human corrected semantic group: keep
- Human corrected proof: keep
- Human corrected eval surface: keep
- Human readiness: keep
- Human priority: TODO
- Human notes:
- Trace: 1 source ref; docs/contracts/scenario-history.md:123

##### claim-docs-contracts-scenario-history-md-171

- Summary: This data should come from explicit scenario-result payloads, not from retroactive log scraping.
- Current labels: audience=developer; proof=cautilus-eval; surface=none; readiness=needs-scenario; evidence=unknown
- Source excerpt: This data should come from explicit scenario-result payloads, not from retroactive log scraping.
- Suggested next action: Use the scenario proposal flow to normalize candidate evidence before creating a checked-in eval fixture.
- Human claim quality: TODO
- Human corrected audience: keep
- Human corrected semantic group: keep
- Human corrected proof: keep
- Human corrected eval surface: keep
- Human readiness: keep
- Human priority: TODO
- Human notes:
- Trace: 1 source ref; docs/contracts/scenario-history.md:171

##### claim-docs-contracts-scenario-history-md-175

- Summary: Compare runs often need a frozen baseline side so only the candidate reruns.
- Current labels: audience=developer; proof=cautilus-eval; surface=none; readiness=needs-scenario; evidence=unknown
- Source excerpt: Compare runs often need a frozen baseline side so only the candidate reruns.
- Suggested next action: Use the scenario proposal flow to normalize candidate evidence before creating a checked-in eval fixture.
- Human claim quality: TODO
- Human corrected audience: keep
- Human corrected semantic group: keep
- Human corrected proof: keep
- Human corrected eval surface: keep
- Human readiness: keep
- Human priority: TODO
- Human notes:
- Trace: 1 source ref; docs/contracts/scenario-history.md:175

##### claim-docs-contracts-scenario-history-md-216

- Summary: Baseline cache keys must include scenario-definition identity, not only repo identity.
- Current labels: audience=developer; proof=cautilus-eval; surface=none; readiness=needs-scenario; evidence=unknown
- Source excerpt: Baseline cache keys must include scenario-definition identity, not only repo identity.
- Suggested next action: Use the scenario proposal flow to normalize candidate evidence before creating a checked-in eval fixture.
- Human claim quality: TODO
- Human corrected audience: keep
- Human corrected semantic group: keep
- Human corrected proof: keep
- Human corrected eval surface: keep
- Human readiness: keep
- Human priority: TODO
- Human notes:
- Trace: 1 source ref; docs/contracts/scenario-history.md:216

##### claim-docs-contracts-scenario-history-md-25

- Summary: A scenario-history-aware profile should define:
- Current labels: audience=developer; proof=cautilus-eval; surface=none; readiness=needs-scenario; evidence=unknown
- Source excerpt: A scenario-history-aware profile should define:
- Suggested next action: Use the scenario proposal flow to normalize candidate evidence before creating a checked-in eval fixture.
- Human claim quality: TODO
- Human corrected audience: keep
- Human corrected semantic group: keep
- Human corrected proof: keep
- Human corrected eval surface: keep
- Human readiness: keep
- Human priority: TODO
- Human notes:
- Trace: 1 source ref; docs/contracts/scenario-history.md:25

##### claim-docs-contracts-scenario-history-md-3

- Summary: `Cautilus` needs a repo-agnostic way to decide which scenarios run during iterate, held-out, and full-gate evaluation, and how repeated train runs change scenario cadence over time.
- Current labels: audience=developer; proof=cautilus-eval; surface=none; readiness=needs-scenario; evidence=unknown
- Source excerpt: `Cautilus` needs a repo-agnostic way to decide which scenarios run during iterate, held-out, and full-gate evaluation, and how repeated train runs change scenario cadence over time.
- Suggested next action: Use the scenario proposal flow to normalize candidate evidence before creating a checked-in eval fixture.
- Human claim quality: TODO
- Human corrected audience: keep
- Human corrected semantic group: keep
- Human corrected proof: keep
- Human corrected eval surface: keep
- Human readiness: keep
- Human priority: TODO
- Human notes:
- Trace: 1 source ref; docs/contracts/scenario-history.md:3

##### claim-docs-contracts-scenario-proposal-sources-md-108

- Summary: The proposal engine should emit an operator-reviewable payload like this:
- Current labels: audience=developer; proof=cautilus-eval; surface=none; readiness=needs-scenario; evidence=unknown
- Source excerpt: The proposal engine should emit an operator-reviewable payload like this:
- Suggested next action: Use the scenario proposal flow to normalize candidate evidence before creating a checked-in eval fixture.
- Human claim quality: TODO
- Human corrected audience: keep
- Human corrected semantic group: keep
- Human corrected proof: keep
- Human corrected eval surface: keep
- Human readiness: keep
- Human priority: TODO
- Human notes:
- Trace: 1 source ref; docs/contracts/scenario-proposal-sources.md:108

##### claim-docs-contracts-scenario-proposal-sources-md-216

- Summary: The draft scenario embedded in each proposal should be normalized enough for a human to accept, edit, or reject it without re-deriving the context.
- Current labels: audience=developer; proof=cautilus-eval; surface=none; readiness=needs-scenario; evidence=unknown
- Source excerpt: The draft scenario embedded in each proposal should be normalized enough for a human to accept, edit, or reject it without re-deriving the context.
- Suggested next action: Use the scenario proposal flow to normalize candidate evidence before creating a checked-in eval fixture.
- Human claim quality: TODO
- Human corrected audience: keep
- Human corrected semantic group: keep
- Human corrected proof: keep
- Human corrected eval surface: keep
- Human readiness: keep
- Human priority: TODO
- Human notes:
- Trace: 1 source ref; docs/contracts/scenario-proposal-sources.md:216

##### claim-docs-contracts-scenario-proposal-sources-md-235

- Summary: The canonical machine-readable output should preserve the full ranked proposal list.
- Current labels: audience=developer; proof=cautilus-eval; surface=none; readiness=needs-scenario; evidence=unknown
- Source excerpt: The canonical machine-readable output should preserve the full ranked proposal list.
- Suggested next action: Use the scenario proposal flow to normalize candidate evidence before creating a checked-in eval fixture.
- Human claim quality: TODO
- Human corrected audience: keep
- Human corrected semantic group: keep
- Human corrected proof: keep
- Human corrected eval surface: keep
- Human readiness: keep
- Human priority: TODO
- Human notes:
- Trace: 1 source ref; docs/contracts/scenario-proposal-sources.md:235

##### claim-docs-contracts-scenario-proposal-sources-md-245

- Summary: Proposal output should embed a draft scenario, not only a prose suggestion.
- Current labels: audience=developer; proof=cautilus-eval; surface=none; readiness=needs-scenario; evidence=unknown
- Source excerpt: Proposal output should embed a draft scenario, not only a prose suggestion.
- Suggested next action: Use the scenario proposal flow to normalize candidate evidence before creating a checked-in eval fixture.
- Human claim quality: TODO
- Human corrected audience: keep
- Human corrected semantic group: keep
- Human corrected proof: keep
- Human corrected eval surface: keep
- Human readiness: keep
- Human priority: TODO
- Human notes:
- Trace: 1 source ref; docs/contracts/scenario-proposal-sources.md:245

##### claim-docs-contracts-scenario-proposal-sources-md-246

- Summary: Evidence should stay attached to each proposal so operator review is grounded.
- Current labels: audience=developer; proof=cautilus-eval; surface=none; readiness=needs-scenario; evidence=unknown
- Source excerpt: Evidence should stay attached to each proposal so operator review is grounded.
- Suggested next action: Use the scenario proposal flow to normalize candidate evidence before creating a checked-in eval fixture.
- Human claim quality: TODO
- Human corrected audience: keep
- Human corrected semantic group: keep
- Human corrected proof: keep
- Human corrected eval surface: keep
- Human readiness: keep
- Human priority: TODO
- Human notes:
- Trace: 1 source ref; docs/contracts/scenario-proposal-sources.md:246

##### claim-docs-contracts-scenario-proposal-sources-md-248

- Summary: The first product-owned draft scenario payload uses `cautilus.scenario.v1`.
- Current labels: audience=developer; proof=cautilus-eval; surface=none; readiness=needs-scenario; evidence=unknown
- Source excerpt: The first product-owned draft scenario payload uses `cautilus.scenario.v1`.
- Suggested next action: Use the scenario proposal flow to normalize candidate evidence before creating a checked-in eval fixture.
- Human claim quality: TODO
- Human corrected audience: keep
- Human corrected semantic group: keep
- Human corrected proof: keep
- Human corrected eval surface: keep
- Human readiness: keep
- Human priority: TODO
- Human notes:
- Trace: 1 source ref; docs/contracts/scenario-proposal-sources.md:248

##### claim-docs-contracts-scenario-proposal-sources-md-254

- Summary: Should blocked-run proposals and human-conversation proposals share one ranking queue, or should they be ranked per source kind first?
- Current labels: audience=developer; proof=cautilus-eval; surface=none; readiness=needs-scenario; evidence=unknown
- Source excerpt: Should blocked-run proposals and human-conversation proposals share one ranking queue, or should they be ranked per source kind first?
- Suggested next action: Use the scenario proposal flow to normalize candidate evidence before creating a checked-in eval fixture.
- Human claim quality: TODO
- Human corrected audience: keep
- Human corrected semantic group: keep
- Human corrected proof: keep
- Human corrected eval surface: keep
- Human readiness: keep
- Human priority: TODO
- Human notes:
- Trace: 1 source ref; docs/contracts/scenario-proposal-sources.md:254

##### claim-docs-contracts-scenario-proposal-sources-md-40

- Summary: The proposal engine should read from four source ports.
- Current labels: audience=developer; proof=cautilus-eval; surface=none; readiness=needs-scenario; evidence=unknown
- Source excerpt: The proposal engine should read from four source ports.
- Suggested next action: Use the scenario proposal flow to normalize candidate evidence before creating a checked-in eval fixture.
- Human claim quality: TODO
- Human corrected audience: keep
- Human corrected semantic group: keep
- Human corrected proof: keep
- Human corrected eval surface: keep
- Human readiness: keep
- Human priority: TODO
- Human notes:
- Trace: 1 source ref; docs/contracts/scenario-proposal-sources.md:40

##### claim-docs-contracts-scenario-proposal-sources-md-5

- Summary: This contract defines the source ports and output payload that a scenario proposal engine can rely on before `Cautilus` imports any host-specific log mining code.
- Current labels: audience=developer; proof=cautilus-eval; surface=none; readiness=needs-scenario; evidence=unknown
- Source excerpt: This contract defines the source ports and output payload that a scenario proposal engine can rely on before `Cautilus` imports any host-specific log mining code.
- Suggested next action: Use the scenario proposal flow to normalize candidate evidence before creating a checked-in eval fixture.
- Human claim quality: TODO
- Human corrected audience: keep
- Human corrected semantic group: keep
- Human corrected proof: keep
- Human corrected eval surface: keep
- Human readiness: keep
- Human priority: TODO
- Human notes:
- Trace: 1 source ref; docs/contracts/scenario-proposal-sources.md:5

##### claim-docs-contracts-scenario-proposal-sources-md-81

- Summary: The current checked-in scenario set so the engine can decide between `add_new_scenario` and `refresh_existing_scenario`.
- Current labels: audience=developer; proof=cautilus-eval; surface=none; readiness=needs-scenario; evidence=unknown
- Source excerpt: The current checked-in scenario set so the engine can decide between `add_new_scenario` and `refresh_existing_scenario`.
- Suggested next action: Use the scenario proposal flow to normalize candidate evidence before creating a checked-in eval fixture.
- Human claim quality: TODO
- Human corrected audience: keep
- Human corrected semantic group: keep
- Human corrected proof: keep
- Human corrected eval surface: keep
- Human readiness: keep
- Human priority: TODO
- Human notes:
- Trace: 1 source ref; docs/contracts/scenario-proposal-sources.md:81

##### claim-docs-contracts-scenario-proposal-sources-md-95

- Summary: Recent execution counts for each scenario key so proposals can prioritize weakly covered patterns.
- Current labels: audience=developer; proof=cautilus-eval; surface=none; readiness=needs-scenario; evidence=unknown
- Source excerpt: Recent execution counts for each scenario key so proposals can prioritize weakly covered patterns.
- Suggested next action: Use the scenario proposal flow to normalize candidate evidence before creating a checked-in eval fixture.
- Human claim quality: TODO
- Human corrected audience: keep
- Human corrected semantic group: keep
- Human corrected proof: keep
- Human corrected eval surface: keep
- Human readiness: keep
- Human priority: TODO
- Human notes:
- Trace: 1 source ref; docs/contracts/scenario-proposal-sources.md:95

##### claim-docs-maintainers-consumer-readiness-md-68

- Summary: Routed through `cautilus scenario normalize workflow`; the proposal-input lineage stays in this surface even though the legacy archetype boundary was retired (see evaluation-surfaces.spec.md (../specs/evaluation-surfaces.spec.md)).
- Current labels: audience=developer; proof=cautilus-eval; surface=none; readiness=needs-scenario; evidence=unknown
- Source excerpt: Routed through `cautilus scenario normalize workflow`; the proposal-input lineage stays in this surface even though the legacy archetype boundary was retired (see evaluation-surfaces.spec.md (../specs/evaluation-surfaces.spec.md)).
- Suggested next action: Use the scenario proposal flow to normalize candidate evidence before creating a checked-in eval fixture.
- Human claim quality: TODO
- Human corrected audience: keep
- Human corrected semantic group: keep
- Human corrected proof: keep
- Human corrected eval surface: keep
- Human readiness: keep
- Human priority: TODO
- Human notes:
- Trace: 1 source ref; docs/maintainers/consumer-readiness.md:68

##### claim-docs-specs-command-surfaces-spec-md-109

- Summary: The command discovers candidate claims from explicit repo-owned truth surfaces.
- Current labels: audience=developer; proof=cautilus-eval; surface=none; readiness=needs-scenario; evidence=unknown
- Source excerpt: The command discovers candidate claims from explicit repo-owned truth surfaces.
- Suggested next action: Use the scenario proposal flow to normalize candidate evidence before creating a checked-in eval fixture.
- Human claim quality: TODO
- Human corrected audience: keep
- Human corrected semantic group: keep
- Human corrected proof: keep
- Human corrected eval surface: keep
- Human readiness: keep
- Human priority: TODO
- Human notes:
- Trace: 1 source ref; docs/specs/command-surfaces.spec.md:109

##### claim-docs-specs-command-surfaces-spec-md-120

- Summary: When the same normalized claim text appears in multiple distinct files, it should emit one claim candidate with multiple `sourceRefs` rather than duplicate candidates.
- Current labels: audience=developer; proof=cautilus-eval; surface=none; readiness=needs-scenario; evidence=unknown
- Source excerpt: When the same normalized claim text appears in multiple distinct files, it should emit one claim candidate with multiple `sourceRefs` rather than duplicate candidates.
- Suggested next action: Use the scenario proposal flow to normalize candidate evidence before creating a checked-in eval fixture.
- Human claim quality: TODO
- Human corrected audience: keep
- Human corrected semantic group: keep
- Human corrected proof: keep
- Human corrected eval surface: keep
- Human readiness: keep
- Human priority: TODO
- Human notes:
- Trace: 1 source ref; docs/specs/command-surfaces.spec.md:120

##### claim-docs-specs-command-surfaces-spec-md-240

- Summary: **Folding all scenario commands into `claim` immediately.** Scenario proposal flows are already shipped and should be reused, not renamed in the first slice.
- Current labels: audience=developer; proof=cautilus-eval; surface=none; readiness=needs-scenario; evidence=unknown
- Source excerpt: **Folding all scenario commands into `claim` immediately.** Scenario proposal flows are already shipped and should be reused, not renamed in the first slice.
- Suggested next action: Use the scenario proposal flow to normalize candidate evidence before creating a checked-in eval fixture.
- Human claim quality: TODO
- Human corrected audience: keep
- Human corrected semantic group: keep
- Human corrected proof: keep
- Human corrected eval surface: keep
- Human readiness: keep
- Human priority: TODO
- Human notes:
- Trace: 1 source ref; docs/specs/command-surfaces.spec.md:240

##### claim-docs-specs-command-surfaces-spec-md-276

- Summary: public spec proof that the command can emit at least one `human-auditable`, one `deterministic`, and one `cautilus-eval` candidate from checked-in fixtures
- Current labels: audience=developer; proof=cautilus-eval; surface=none; readiness=needs-scenario; evidence=unknown
- Source excerpt: public spec proof that the command can emit at least one `human-auditable`, one `deterministic`, and one `cautilus-eval` candidate from checked-in fixtures
- Suggested next action: Use the scenario proposal flow to normalize candidate evidence before creating a checked-in eval fixture.
- Human claim quality: TODO
- Human corrected audience: keep
- Human corrected semantic group: keep
- Human corrected proof: keep
- Human corrected eval surface: keep
- Human readiness: keep
- Human priority: TODO
- Human notes:
- Trace: 1 source ref; docs/specs/command-surfaces.spec.md:276

##### claim-docs-specs-html-report-spec-md-31

- Summary: Which proposal, finding, or evidence signal should I inspect first?
- Current labels: audience=developer; proof=cautilus-eval; surface=none; readiness=needs-scenario; evidence=unknown
- Source excerpt: Which proposal, finding, or evidence signal should I inspect first?
- Suggested next action: Use the scenario proposal flow to normalize candidate evidence before creating a checked-in eval fixture.
- Human claim quality: TODO
- Human corrected audience: keep
- Human corrected semantic group: keep
- Human corrected proof: keep
- Human corrected eval surface: keep
- Human readiness: keep
- Human priority: TODO
- Human notes:
- Trace: 1 source ref; docs/specs/html-report.spec.md:31

### Improvement and optimization (15)

#### Cautilus eval / app/prompt / ready-to-verify / evidence unknown (2)

##### claim-docs-contracts-optimization-md-132

- Summary: `optimize prepare-input` keeps a shared behavior-intent profile above raw prompt or adapter mechanics.
- Current labels: audience=developer; proof=cautilus-eval; surface=app/prompt; readiness=ready-to-verify; evidence=unknown
- Source excerpt: `optimize prepare-input` keeps a shared behavior-intent profile above raw prompt or adapter mechanics.
- Suggested next action: Create a host-owned app/prompt fixture and run it through cautilus eval test.
- Human claim quality: TODO
- Human corrected audience: keep
- Human corrected semantic group: keep
- Human corrected proof: keep
- Human corrected eval surface: keep
- Human readiness: keep
- Human priority: TODO
- Human notes:
- Trace: 1 source ref; docs/contracts/optimization.md:132

##### claim-docs-contracts-runtime-fingerprint-optimization-md-261

- Summary: This sequence keeps the evidence honest before asking optimize search to mutate prompts more aggressively.
- Current labels: audience=developer; proof=cautilus-eval; surface=app/prompt; readiness=ready-to-verify; evidence=unknown
- Source excerpt: This sequence keeps the evidence honest before asking optimize search to mutate prompts more aggressively.
- Suggested next action: Create a host-owned app/prompt fixture and run it through cautilus eval test.
- Human claim quality: TODO
- Human corrected audience: keep
- Human corrected semantic group: keep
- Human corrected proof: keep
- Human corrected eval surface: keep
- Human readiness: keep
- Human priority: TODO
- Human notes:
- Trace: 1 source ref; docs/contracts/runtime-fingerprint-optimization.md:261

#### Cautilus eval / dev/repo / ready-to-verify / evidence unknown (5)

##### claim-docs-contracts-runtime-fingerprint-optimization-md-161

- Summary: Model-change-driven optimize suggestions should preserve:
- Current labels: audience=developer; proof=cautilus-eval; surface=dev/repo; readiness=ready-to-verify; evidence=unknown
- Source excerpt: Model-change-driven optimize suggestions should preserve:
- Suggested next action: Create a host-owned dev/repo fixture and run it through cautilus eval test.
- Human claim quality: TODO
- Human corrected audience: keep
- Human corrected semantic group: keep
- Human corrected proof: keep
- Human corrected eval surface: keep
- Human readiness: keep
- Human priority: TODO
- Human notes:
- Trace: 1 source ref; docs/contracts/runtime-fingerprint-optimization.md:161

##### claim-docs-contracts-runtime-fingerprint-optimization-md-47

- Summary: Optimization should prefer the shortest, least specialized target that preserves or improves the evaluated behavior.
- Current labels: audience=developer; proof=cautilus-eval; surface=dev/repo; readiness=ready-to-verify; evidence=unknown
- Source excerpt: Optimization should prefer the shortest, least specialized target that preserves or improves the evaluated behavior.
- Suggested next action: Create a host-owned dev/repo fixture and run it through cautilus eval test.
- Human claim quality: TODO
- Human corrected audience: keep
- Human corrected semantic group: keep
- Human corrected proof: keep
- Human corrected eval surface: keep
- Human readiness: keep
- Human priority: TODO
- Human notes:
- Trace: 1 source ref; docs/contracts/runtime-fingerprint-optimization.md:47

##### claim-docs-maintainers-development-md-136

- Summary: If a change alters shipped `optimize search` behavior, the same slice must update the Go runtime and its Go acceptance tests.
- Current labels: audience=developer; proof=cautilus-eval; surface=dev/repo; readiness=ready-to-verify; evidence=unknown
- Source excerpt: If a change alters shipped `optimize search` behavior, the same slice must update the Go runtime and its Go acceptance tests.
- Suggested next action: Create a host-owned dev/repo fixture and run it through cautilus eval test.
- Human claim quality: TODO
- Human corrected audience: keep
- Human corrected semantic group: keep
- Human corrected proof: keep
- Human corrected eval surface: keep
- Human readiness: keep
- Human priority: TODO
- Human notes:
- Trace: 1 source ref; docs/maintainers/development.md:136

##### claim-docs-master-plan-md-172

- Summary: Keep widening HTML surfaces only when the packet boundary stays stable and the page meaningfully improves human review; agents should consume durable packets first.
- Current labels: audience=developer; proof=cautilus-eval; surface=dev/repo; readiness=ready-to-verify; evidence=unknown
- Source excerpt: Keep widening HTML surfaces only when the packet boundary stays stable and the page meaningfully improves human review; agents should consume durable packets first.
- Suggested next action: Create a host-owned dev/repo fixture and run it through cautilus eval test.
- Human claim quality: TODO
- Human corrected audience: keep
- Human corrected semantic group: keep
- Human corrected proof: keep
- Human corrected eval surface: keep
- Human readiness: keep
- Human priority: TODO
- Human notes:
- Trace: 1 source ref; docs/master-plan.md:172

##### claim-docs-specs-command-surfaces-spec-md-197

- Summary: GEPA-style search belongs under `optimize`, not under `claim` or `eval`, because it changes behavior after the proof surface exists.
- Current labels: audience=developer; proof=cautilus-eval; surface=dev/repo; readiness=ready-to-verify; evidence=unknown
- Source excerpt: GEPA-style search belongs under `optimize`, not under `claim` or `eval`, because it changes behavior after the proof surface exists.
- Suggested next action: Create a host-owned dev/repo fixture and run it through cautilus eval test.
- Human claim quality: TODO
- Human corrected audience: keep
- Human corrected semantic group: keep
- Human corrected proof: keep
- Human corrected eval surface: keep
- Human readiness: keep
- Human priority: TODO
- Human notes:
- Trace: 1 source ref; docs/specs/command-surfaces.spec.md:197

#### Cautilus eval / surface undecided / needs-scenario / evidence unknown (2)

##### claim-docs-contracts-runtime-fingerprint-optimization-md-191

- Summary: Optimize can propose a bounded simplification candidate after a runtime change without adding a new user-facing optimizer kind.
- Current labels: audience=developer; proof=cautilus-eval; surface=none; readiness=needs-scenario; evidence=unknown
- Source excerpt: Optimize can propose a bounded simplification candidate after a runtime change without adding a new user-facing optimizer kind.
- Suggested next action: Use the scenario proposal flow to normalize candidate evidence before creating a checked-in eval fixture.
- Human claim quality: TODO
- Human corrected audience: keep
- Human corrected semantic group: keep
- Human corrected proof: keep
- Human corrected eval surface: keep
- Human readiness: keep
- Human priority: TODO
- Human notes:
- Trace: 1 source ref; docs/contracts/runtime-fingerprint-optimization.md:191

##### claim-docs-gepa-md-15

- Summary: Sparse evidence blocks search early with machine-readable JSON so an agent or operator can discuss what is missing before generating candidates.
- Current labels: audience=developer; proof=cautilus-eval; surface=none; readiness=needs-scenario; evidence=unknown
- Source excerpt: Sparse evidence blocks search early with machine-readable JSON so an agent or operator can discuss what is missing before generating candidates.
- Suggested next action: Use the scenario proposal flow to normalize candidate evidence before creating a checked-in eval fixture.
- Human claim quality: TODO
- Human corrected audience: keep
- Human corrected semantic group: keep
- Human corrected proof: keep
- Human corrected eval surface: keep
- Human readiness: keep
- Human priority: TODO
- Human notes:
- Trace: 1 source ref; docs/gepa.md:15

#### Deterministic gate / ready-to-verify / evidence unknown (4)

##### claim-docs-contracts-optimization-md-151

- Summary: Update the optimize input builder, optimize proposal generator, revision artifact builder, schemas, fixtures, and flow tests so the optimize seam keeps one durable packet for the next bounded revision.
- Current labels: audience=developer; proof=deterministic; surface=none; readiness=ready-to-verify; evidence=unknown
- Source excerpt: Update the optimize input builder, optimize proposal generator, revision artifact builder, schemas, fixtures, and flow tests so the optimize seam keeps one durable packet for the next bounded revision.
- Suggested next action: Keep or add a repo-owned unit, lint, build, schema, or CI check for this claim.
- Human claim quality: TODO
- Human corrected audience: keep
- Human corrected semantic group: keep
- Human corrected proof: keep
- Human corrected eval surface: keep
- Human readiness: keep
- Human priority: TODO
- Human notes:
- Trace: 1 source ref; docs/contracts/optimization.md:151

##### claim-docs-contracts-optimization-md-34

- Summary: The optimizer still emits one bounded next-revision brief, not a compile loop.
- Current labels: audience=developer; proof=deterministic; surface=none; readiness=ready-to-verify; evidence=unknown
- Source excerpt: The optimizer still emits one bounded next-revision brief, not a compile loop.
- Suggested next action: Keep or add a repo-owned unit, lint, build, schema, or CI check for this claim.
- Human claim quality: TODO
- Human corrected audience: keep
- Human corrected semantic group: keep
- Human corrected proof: keep
- Human corrected eval surface: keep
- Human readiness: keep
- Human priority: TODO
- Human notes:
- Trace: 1 source ref; docs/contracts/optimization.md:34

##### claim-docs-specs-command-surfaces-spec-md-257

- Summary: Existing `eval` and `optimize` behavior remains backward compatible while the first deterministic `claim` surface lands.
- Current labels: audience=developer; proof=deterministic; surface=none; readiness=ready-to-verify; evidence=unknown
- Source excerpt: Existing `eval` and `optimize` behavior remains backward compatible while the first deterministic `claim` surface lands.
- Suggested next action: Keep or add a repo-owned unit, lint, build, schema, or CI check for this claim.
- Human claim quality: TODO
- Human corrected audience: keep
- Human corrected semantic group: keep
- Human corrected proof: keep
- Human corrected eval surface: keep
- Human readiness: keep
- Human priority: TODO
- Human notes:
- Trace: 1 source ref; docs/specs/command-surfaces.spec.md:257

##### claim-docs-specs-evaluation-surfaces-spec-md-177

- Summary: Result packet schema MUST stay stable across surfaces so downstream consumers (`optimize prepare-input`, `report.json`) treat all four presets uniformly.
- Current labels: audience=developer; proof=deterministic; surface=none; readiness=ready-to-verify; evidence=unknown
- Source excerpt: Result packet schema MUST stay stable across surfaces so downstream consumers (`optimize prepare-input`, `report.json`) treat all four presets uniformly.
- Suggested next action: Keep or add a repo-owned unit, lint, build, schema, or CI check for this claim.
- Human claim quality: TODO
- Human corrected audience: keep
- Human corrected semantic group: keep
- Human corrected proof: keep
- Human corrected eval surface: keep
- Human readiness: keep
- Human priority: TODO
- Human notes:
- Trace: 1 source ref; docs/specs/evaluation-surfaces.spec.md:177

#### Human-auditable / ready-to-verify / evidence unknown (2)

##### claim-docs-contracts-reporting-md-150

- Summary: Human-review failures must be reported even when the benchmark score improves.
- Current labels: audience=developer; proof=human-auditable; surface=none; readiness=ready-to-verify; evidence=unknown
- Source excerpt: Human-review failures must be reported even when the benchmark score improves.
- Suggested next action: Record the source reference and keep it human-auditable; add deterministic or eval proof only if behavior depends on execution.
- Human claim quality: TODO
- Human corrected audience: keep
- Human corrected semantic group: keep
- Human corrected proof: keep
- Human corrected eval surface: keep
- Human readiness: keep
- Human priority: TODO
- Human notes:
- Trace: 1 source ref; docs/contracts/reporting.md:150

##### claim-docs-contracts-reporting-md-69

- Summary: `message`: the concrete human-review feedback that should survive into review, evidence, and optimize flows
- Current labels: audience=developer; proof=human-auditable; surface=none; readiness=ready-to-verify; evidence=unknown
- Source excerpt: `message`: the concrete human-review feedback that should survive into review, evidence, and optimize flows
- Suggested next action: Record the source reference and keep it human-auditable; add deterministic or eval proof only if behavior depends on execution.
- Human claim quality: TODO
- Human corrected audience: keep
- Human corrected semantic group: keep
- Human corrected proof: keep
- Human corrected eval surface: keep
- Human readiness: keep
- Human priority: TODO
- Human notes:
- Trace: 1 source ref; docs/contracts/reporting.md:69

### Packets and reporting (17)

#### Cautilus eval / surface undecided / needs-scenario / evidence unknown (10)

##### claim-docs-contracts-adapter-contract-md-279

- Summary: The packet owns scenario execution intent.
- Current labels: audience=developer; proof=cautilus-eval; surface=none; readiness=needs-scenario; evidence=unknown
- Source excerpt: The packet owns scenario execution intent.
- Suggested next action: Use the scenario proposal flow to normalize candidate evidence before creating a checked-in eval fixture.
- Human claim quality: TODO
- Human corrected audience: keep
- Human corrected semantic group: keep
- Human corrected proof: keep
- Human corrected eval surface: keep
- Human readiness: keep
- Human priority: TODO
- Human notes:
- Trace: 1 source ref; docs/contracts/adapter-contract.md:279

##### claim-docs-contracts-claim-discovery-workflow-md-280

- Summary: `discover` should eventually produce status, not only candidates.
- Current labels: audience=developer; proof=cautilus-eval; surface=none; readiness=needs-scenario; evidence=unknown
- Source excerpt: `discover` should eventually produce status, not only candidates.
- Suggested next action: Use the scenario proposal flow to normalize candidate evidence before creating a checked-in eval fixture.
- Human claim quality: TODO
- Human corrected audience: keep
- Human corrected semantic group: keep
- Human corrected proof: keep
- Human corrected eval surface: keep
- Human readiness: keep
- Human priority: TODO
- Human notes:
- Trace: 1 source ref; docs/contracts/claim-discovery-workflow.md:280

##### claim-docs-contracts-claim-discovery-workflow-md-329

- Summary: Those packets should record cluster IDs, candidate IDs, source refs, prompt/reference hashes, runtime/model identity when available, merge decisions, label changes, evidence-status reasons, unresolved questions, and skipped clusters.
- Current labels: audience=developer; proof=cautilus-eval; surface=none; readiness=needs-scenario; evidence=unknown
- Source excerpt: Those packets should record cluster IDs, candidate IDs, source refs, prompt/reference hashes, runtime/model identity when available, merge decisions, label changes, evidence-status reasons, unresolved questions, and skipped clusters.
- Suggested next action: Use the scenario proposal flow to normalize candidate evidence before creating a checked-in eval fixture.
- Human claim quality: TODO
- Human corrected audience: keep
- Human corrected semantic group: keep
- Human corrected proof: keep
- Human corrected eval surface: keep
- Human readiness: keep
- Human priority: TODO
- Human notes:
- Trace: 1 source ref; docs/contracts/claim-discovery-workflow.md:329

##### claim-docs-contracts-optimization-md-122

- Summary: The resulting proposal can be materialized into one durable revision artifact:
- Current labels: audience=developer; proof=cautilus-eval; surface=none; readiness=needs-scenario; evidence=unknown
- Source excerpt: The resulting proposal can be materialized into one durable revision artifact:
- Suggested next action: Use the scenario proposal flow to normalize candidate evidence before creating a checked-in eval fixture.
- Human claim quality: TODO
- Human corrected audience: keep
- Human corrected semantic group: keep
- Human corrected proof: keep
- Human corrected eval surface: keep
- Human readiness: keep
- Human priority: TODO
- Human notes:
- Trace: 1 source ref; docs/contracts/optimization.md:122

##### claim-docs-contracts-optimization-md-27

- Summary: evidence provenance so later review can trace each proposal back to an explicit packet and locator
- Current labels: audience=developer; proof=cautilus-eval; surface=none; readiness=needs-scenario; evidence=unknown
- Source excerpt: evidence provenance so later review can trace each proposal back to an explicit packet and locator
- Suggested next action: Use the scenario proposal flow to normalize candidate evidence before creating a checked-in eval fixture.
- Human claim quality: TODO
- Human corrected audience: keep
- Human corrected semantic group: keep
- Human corrected proof: keep
- Human corrected eval surface: keep
- Human readiness: keep
- Human priority: TODO
- Human notes:
- Trace: 1 source ref; docs/contracts/optimization.md:27

##### claim-docs-contracts-reporting-md-127

- Summary: For scenario-driven evaluation, the same rule applies one level lower: scenario result packets should preserve per-scenario telemetry so `Cautilus` can answer which scenarios are currently the slowest or most expensive.
- Current labels: audience=developer; proof=cautilus-eval; surface=none; readiness=needs-scenario; evidence=unknown
- Source excerpt: For scenario-driven evaluation, the same rule applies one level lower: scenario result packets should preserve per-scenario telemetry so `Cautilus` can answer which scenarios are currently the slowest or most expensive.
- Suggested next action: Use the scenario proposal flow to normalize candidate evidence before creating a checked-in eval fixture.
- Human claim quality: TODO
- Human corrected audience: keep
- Human corrected semantic group: keep
- Human corrected proof: keep
- Human corrected eval surface: keep
- Human readiness: keep
- Human priority: TODO
- Human notes:
- Trace: 1 source ref; docs/contracts/reporting.md:127

##### claim-docs-contracts-reporting-md-129

- Summary: For held-out and full-gate reporting, mode runs should preserve that same scenario-level telemetry and lift it into a machine-readable report packet.
- Current labels: audience=developer; proof=cautilus-eval; surface=none; readiness=needs-scenario; evidence=unknown
- Source excerpt: For held-out and full-gate reporting, mode runs should preserve that same scenario-level telemetry and lift it into a machine-readable report packet.
- Suggested next action: Use the scenario proposal flow to normalize candidate evidence before creating a checked-in eval fixture.
- Human claim quality: TODO
- Human corrected audience: keep
- Human corrected semantic group: keep
- Human corrected proof: keep
- Human corrected eval surface: keep
- Human readiness: keep
- Human priority: TODO
- Human notes:
- Trace: 1 source ref; docs/contracts/reporting.md:129

##### claim-docs-contracts-scenario-proposal-sources-md-28

- Summary: Those helpers should sit between source-port ingestion and proposal packet generation.
- Current labels: audience=developer; proof=cautilus-eval; surface=none; readiness=needs-scenario; evidence=unknown
- Source excerpt: Those helpers should sit between source-port ingestion and proposal packet generation.
- Suggested next action: Use the scenario proposal flow to normalize candidate evidence before creating a checked-in eval fixture.
- Human claim quality: TODO
- Human corrected audience: keep
- Human corrected semantic group: keep
- Human corrected proof: keep
- Human corrected eval surface: keep
- Human readiness: keep
- Human priority: TODO
- Human notes:
- Trace: 1 source ref; docs/contracts/scenario-proposal-sources.md:28

##### claim-docs-specs-command-surfaces-spec-md-206

- Summary: It should point to the relevant scenario command rather than duplicating scenario packet logic.
- Current labels: audience=developer; proof=cautilus-eval; surface=none; readiness=needs-scenario; evidence=unknown
- Source excerpt: It should point to the relevant scenario command rather than duplicating scenario packet logic.
- Suggested next action: Use the scenario proposal flow to normalize candidate evidence before creating a checked-in eval fixture.
- Human claim quality: TODO
- Human corrected audience: keep
- Human corrected semantic group: keep
- Human corrected proof: keep
- Human corrected eval surface: keep
- Human readiness: keep
- Human priority: TODO
- Human notes:
- Trace: 1 source ref; docs/specs/command-surfaces.spec.md:206

##### claim-docs-specs-current-product-spec-md-9

- Summary: reopen scenario-adjacent chatbot conversations in a review packet that stays tied to proposal work
- Current labels: audience=developer; proof=cautilus-eval; surface=none; readiness=needs-scenario; evidence=unknown
- Source excerpt: reopen scenario-adjacent chatbot conversations in a review packet that stays tied to proposal work
- Suggested next action: Use the scenario proposal flow to normalize candidate evidence before creating a checked-in eval fixture.
- Human claim quality: TODO
- Human corrected audience: keep
- Human corrected semantic group: keep
- Human corrected proof: keep
- Human corrected eval surface: keep
- Human readiness: keep
- Human priority: TODO
- Human notes:
- Trace: 1 source ref; docs/specs/current-product.spec.md:9

#### Human-auditable / ready-to-verify / evidence unknown (7)

##### claim-docs-contracts-adapter-contract-md-192

- Summary: `artifact_paths`: code or docs the evaluator should inspect while interpreting results.
- Current labels: audience=developer; proof=human-auditable; surface=none; readiness=ready-to-verify; evidence=unknown
- Source excerpt: `artifact_paths`: code or docs the evaluator should inspect while interpreting results.
- Suggested next action: Record the source reference and keep it human-auditable; add deterministic or eval proof only if behavior depends on execution.
- Human claim quality: TODO
- Human corrected audience: keep
- Human corrected semantic group: keep
- Human corrected proof: keep
- Human corrected eval surface: keep
- Human readiness: keep
- Human priority: TODO
- Human notes:
- Trace: 1 source ref; docs/contracts/adapter-contract.md:192

##### claim-docs-contracts-claim-discovery-workflow-md-252

- Summary: `evidenceRefs[]` should use a minimum inspectable shape:
- Current labels: audience=developer; proof=human-auditable; surface=none; readiness=ready-to-verify; evidence=unknown
- Source excerpt: `evidenceRefs[]` should use a minimum inspectable shape:
- Suggested next action: Record the source reference and keep it human-auditable; add deterministic or eval proof only if behavior depends on execution.
- Human claim quality: TODO
- Human corrected audience: keep
- Human corrected semantic group: keep
- Human corrected proof: keep
- Human corrected eval surface: keep
- Human readiness: keep
- Human priority: TODO
- Human notes:
- Trace: 1 source ref; docs/contracts/claim-discovery-workflow.md:252

##### claim-docs-contracts-reporting-md-124

- Summary: The summary packet should also aggregate any explicit numeric telemetry across variants so operators can inspect one top-level view without scraping each verdict file separately.
- Current labels: audience=developer; proof=human-auditable; surface=none; readiness=ready-to-verify; evidence=unknown
- Source excerpt: The summary packet should also aggregate any explicit numeric telemetry across variants so operators can inspect one top-level view without scraping each verdict file separately.
- Suggested next action: Record the source reference and keep it human-auditable; add deterministic or eval proof only if behavior depends on execution.
- Human claim quality: TODO
- Human corrected audience: keep
- Human corrected semantic group: keep
- Human corrected proof: keep
- Human corrected eval surface: keep
- Human readiness: keep
- Human priority: TODO
- Human notes:
- Trace: 1 source ref; docs/contracts/reporting.md:124

##### claim-docs-maintainers-release-boundary-md-61

- Summary: breaking contract changes must update checked-in docs and fixtures in the same change
- Current labels: audience=developer; proof=human-auditable; surface=none; readiness=ready-to-verify; evidence=unknown
- Source excerpt: breaking contract changes must update checked-in docs and fixtures in the same change
- Suggested next action: Record the source reference and keep it human-auditable; add deterministic or eval proof only if behavior depends on execution.
- Human claim quality: TODO
- Human corrected audience: keep
- Human corrected semantic group: keep
- Human corrected proof: keep
- Human corrected eval surface: keep
- Human readiness: keep
- Human priority: TODO
- Human notes:
- Trace: 1 source ref; docs/maintainers/release-boundary.md:61

##### claim-docs-specs-current-product-spec-md-16

- Summary: It is the mechanism that keeps the decision durable, inspectable, and reusable across CLI, review, and HTML surfaces.
- Current labels: audience=developer; proof=human-auditable; surface=none; readiness=ready-to-verify; evidence=unknown
- Source excerpt: It is the mechanism that keeps the decision durable, inspectable, and reusable across CLI, review, and HTML surfaces.
- Suggested next action: Record the source reference and keep it human-auditable; add deterministic or eval proof only if behavior depends on execution.
- Human claim quality: TODO
- Human corrected audience: keep
- Human corrected semantic group: keep
- Human corrected proof: keep
- Human corrected eval surface: keep
- Human readiness: keep
- Human priority: TODO
- Human notes:
- Trace: 1 source ref; docs/specs/current-product.spec.md:16

##### claim-docs-specs-evaluation-surfaces-spec-md-185

- Summary: A `steps: [...]` fixture executes each step in order, and step N can read step (N-1)'s output.
- Current labels: audience=developer; proof=human-auditable; surface=none; readiness=ready-to-verify; evidence=unknown
- Source excerpt: A `steps: [...]` fixture executes each step in order, and step N can read step (N-1)'s output.
- Suggested next action: Record the source reference and keep it human-auditable; add deterministic or eval proof only if behavior depends on execution.
- Human claim quality: TODO
- Human corrected audience: keep
- Human corrected semantic group: keep
- Human corrected proof: keep
- Human corrected eval surface: keep
- Human readiness: keep
- Human priority: TODO
- Human notes:
- Trace: 1 source ref; docs/specs/evaluation-surfaces.spec.md:185

##### claim-docs-specs-html-report-spec-md-3

- Summary: `Cautilus` ships static HTML views so a human can answer one practical question in a browser: what happened in this evaluation, and what should I trust or revisit next?
- Current labels: audience=developer; proof=human-auditable; surface=none; readiness=ready-to-verify; evidence=unknown
- Source excerpt: `Cautilus` ships static HTML views so a human can answer one practical question in a browser: what happened in this evaluation, and what should I trust or revisit next?
- Suggested next action: Record the source reference and keep it human-auditable; add deterministic or eval proof only if behavior depends on execution.
- Human claim quality: TODO
- Human corrected audience: keep
- Human corrected semantic group: keep
- Human corrected proof: keep
- Human corrected eval surface: keep
- Human readiness: keep
- Human priority: TODO
- Human notes:
- Trace: 1 source ref; docs/specs/html-report.spec.md:3

### Quality gates (110)

#### Cautilus eval / app/chat / ready-to-verify / evidence unknown (1)

##### claim-docs-specs-standalone-surface-spec-md-14

- Summary: `cautilus install` materializes the same product surface for an in-repo assistant, while the operator still uses the CLI directly.
- Current labels: audience=developer; proof=cautilus-eval; surface=app/chat; readiness=ready-to-verify; evidence=unknown
- Source excerpt: `cautilus install` materializes the same product surface for an in-repo assistant, while the operator still uses the CLI directly.
- Suggested next action: Create a host-owned app/chat fixture and run it through cautilus eval test.
- Human claim quality: TODO
- Human corrected audience: keep
- Human corrected semantic group: keep
- Human corrected proof: keep
- Human corrected eval surface: keep
- Human readiness: keep
- Human priority: TODO
- Human notes:
- Trace: 1 source ref; docs/specs/standalone-surface.spec.md:14

#### Cautilus eval / app/prompt / ready-to-verify / evidence unknown (6)

##### claim-agents-md-29

- Summary: The long-term direction is intent-first and intentful behavior evaluation: prompts can change if the evaluated behavior gets better.
- Current labels: audience=developer; proof=cautilus-eval; surface=app/prompt; readiness=ready-to-verify; evidence=unknown
- Source excerpt: The long-term direction is intent-first and intentful behavior evaluation: prompts can change if the evaluated behavior gets better.
- Suggested next action: Create a host-owned app/prompt fixture and run it through cautilus eval test.
- Human claim quality: TODO
- Human corrected audience: keep
- Human corrected semantic group: keep
- Human corrected proof: keep
- Human corrected eval surface: keep
- Human readiness: keep
- Human priority: TODO
- Human notes:
- Trace: 1 source ref; AGENTS.md:29

##### claim-docs-contracts-claim-discovery-workflow-md-324

- Summary: The LLM review seam should use versioned packets instead of hidden prompt-only behavior:
- Current labels: audience=developer; proof=cautilus-eval; surface=app/prompt; readiness=ready-to-verify; evidence=unknown
- Source excerpt: The LLM review seam should use versioned packets instead of hidden prompt-only behavior:
- Suggested next action: Create a host-owned app/prompt fixture and run it through cautilus eval test.
- Human claim quality: TODO
- Human corrected audience: keep
- Human corrected semantic group: keep
- Human corrected proof: keep
- Human corrected eval surface: keep
- Human readiness: keep
- Human priority: TODO
- Human notes:
- Trace: 1 source ref; docs/contracts/claim-discovery-workflow.md:324

##### claim-docs-contracts-claim-discovery-workflow-md-588

- Summary: It emits `cautilus.claim_eval_plan.v1` from reviewed `cautilus-eval` claims that are ready to verify, while preserving the host boundary by not writing fixtures, prompts, runners, wrappers, or policy.
- Current labels: audience=developer; proof=cautilus-eval; surface=app/prompt; readiness=ready-to-verify; evidence=unknown
- Source excerpt: It emits `cautilus.claim_eval_plan.v1` from reviewed `cautilus-eval` claims that are ready to verify, while preserving the host boundary by not writing fixtures, prompts, runners, wrappers, or policy.
- Suggested next action: Create a host-owned app/prompt fixture and run it through cautilus eval test.
- Human claim quality: TODO
- Human corrected audience: keep
- Human corrected semantic group: keep
- Human corrected proof: keep
- Human corrected eval surface: keep
- Human readiness: keep
- Human priority: TODO
- Human notes:
- Trace: 1 source ref; docs/contracts/claim-discovery-workflow.md:588

##### claim-docs-contracts-claim-discovery-workflow-md-60

- Summary: The binary must not own LLM provider selection, subagent scheduling, model prompts, review policy, or human conversation.
- Current labels: audience=developer; proof=cautilus-eval; surface=app/prompt; readiness=ready-to-verify; evidence=unknown
- Source excerpt: The binary must not own LLM provider selection, subagent scheduling, model prompts, review policy, or human conversation.
- Suggested next action: Create a host-owned app/prompt fixture and run it through cautilus eval test.
- Human claim quality: TODO
- Human corrected audience: keep
- Human corrected semantic group: keep
- Human corrected proof: keep
- Human corrected eval surface: keep
- Human readiness: keep
- Human priority: TODO
- Human notes:
- Trace: 1 source ref; docs/contracts/claim-discovery-workflow.md:60

##### claim-docs-contracts-optimization-md-38

- Summary: Shorter and less specialized prompts should win only after behavior, held-out, comparison, and review guardrails remain satisfied.
- Current labels: audience=developer; proof=cautilus-eval; surface=app/prompt; readiness=ready-to-verify; evidence=unknown
- Source excerpt: Shorter and less specialized prompts should win only after behavior, held-out, comparison, and review guardrails remain satisfied.
- Suggested next action: Create a host-owned app/prompt fixture and run it through cautilus eval test.
- Human claim quality: TODO
- Human corrected audience: keep
- Human corrected semantic group: keep
- Human corrected proof: keep
- Human corrected eval surface: keep
- Human readiness: keep
- Human priority: TODO
- Human notes:
- Trace: 1 source ref; docs/contracts/optimization.md:38

##### claim-docs-specs-evaluation-surfaces-spec-md-56

- Summary: A one-turn fixture is the degenerate case of a multi-turn episode; `app / prompt` stays intentionally one-turn because prompt I/O is the operator-facing concept.
- Current labels: audience=developer; proof=cautilus-eval; surface=app/prompt; readiness=ready-to-verify; evidence=unknown
- Source excerpt: A one-turn fixture is the degenerate case of a multi-turn episode; `app / prompt` stays intentionally one-turn because prompt I/O is the operator-facing concept.
- Suggested next action: Create a host-owned app/prompt fixture and run it through cautilus eval test.
- Human claim quality: TODO
- Human corrected audience: keep
- Human corrected semantic group: keep
- Human corrected proof: keep
- Human corrected eval surface: keep
- Human readiness: keep
- Human priority: TODO
- Human notes:
- Trace: 1 source ref; docs/specs/evaluation-surfaces.spec.md:56

#### Cautilus eval / dev/repo / ready-to-verify / evidence unknown (45)

##### claim-agents-md-123

- Summary: `npm run test:on-demand` currently owns the heavier self-dogfood workflow script tests.
- Current labels: audience=developer; proof=cautilus-eval; surface=dev/repo; readiness=ready-to-verify; evidence=unknown
- Source excerpt: `npm run test:on-demand` currently owns the heavier self-dogfood workflow script tests.
- Suggested next action: Create a host-owned dev/repo fixture and run it through cautilus eval test.
- Human claim quality: TODO
- Human corrected audience: keep
- Human corrected semantic group: keep
- Human corrected proof: keep
- Human corrected eval surface: keep
- Human readiness: keep
- Human priority: TODO
- Human notes:
- Trace: 1 source ref; AGENTS.md:123

##### claim-agents-md-26

- Summary: `Cautilus` owns generic intentful behavior evaluation workflow contracts.
- Current labels: audience=developer; proof=cautilus-eval; surface=dev/repo; readiness=ready-to-verify; evidence=unknown
- Source excerpt: `Cautilus` owns generic intentful behavior evaluation workflow contracts.
- Suggested next action: Create a host-owned dev/repo fixture and run it through cautilus eval test.
- Human claim quality: TODO
- Human corrected audience: keep
- Human corrected semantic group: keep
- Human corrected proof: keep
- Human corrected eval surface: keep
- Human readiness: keep
- Human priority: TODO
- Human notes:
- Trace: 1 source ref; AGENTS.md:26

##### claim-agents-md-73

- Summary: While implementing, any bug, error, regression, or unexpected behavior routes to `charness:debug` before further fixes.
- Current labels: audience=developer; proof=cautilus-eval; surface=dev/repo; readiness=ready-to-verify; evidence=unknown
- Source excerpt: While implementing, any bug, error, regression, or unexpected behavior routes to `charness:debug` before further fixes.
- Suggested next action: Create a host-owned dev/repo fixture and run it through cautilus eval test.
- Human claim quality: TODO
- Human corrected audience: keep
- Human corrected semantic group: keep
- Human corrected proof: keep
- Human corrected eval surface: keep
- Human readiness: keep
- Human priority: TODO
- Human notes:
- Trace: 1 source ref; AGENTS.md:73

##### claim-docs-contracts-active-run-md-186

- Summary: Ambiguous across parallel workflows, silently grabs yesterday's workflow across session gaps, requires a magic freshness threshold.
- Current labels: audience=developer; proof=cautilus-eval; surface=dev/repo; readiness=ready-to-verify; evidence=unknown
- Source excerpt: Ambiguous across parallel workflows, silently grabs yesterday's workflow across session gaps, requires a magic freshness threshold.
- Suggested next action: Create a host-owned dev/repo fixture and run it through cautilus eval test.
- Human claim quality: TODO
- Human corrected audience: keep
- Human corrected semantic group: keep
- Human corrected proof: keep
- Human corrected eval surface: keep
- Human readiness: keep
- Human priority: TODO
- Human notes:
- Trace: 1 source ref; docs/contracts/active-run.md:186

##### claim-docs-contracts-active-run-md-218

- Summary: Is `review variants` a workflow-creating command that mints runDirs (and therefore uses `resolveRunDir`), or is it a consume-only command that only reads an existing active run (and therefore uses `readActiveRunDir`)?
- Current labels: audience=developer; proof=cautilus-eval; surface=dev/repo; readiness=ready-to-verify; evidence=unknown
- Source excerpt: Is `review variants` a workflow-creating command that mints runDirs (and therefore uses `resolveRunDir`), or is it a consume-only command that only reads an existing active run (and therefore uses `readActiveRunDir`)?
- Suggested next action: Create a host-owned dev/repo fixture and run it through cautilus eval test.
- Human claim quality: TODO
- Human corrected audience: keep
- Human corrected semantic group: keep
- Human corrected proof: keep
- Human corrected eval surface: keep
- Human readiness: keep
- Human priority: TODO
- Human notes:
- Trace: 1 source ref; docs/contracts/active-run.md:218

##### claim-docs-contracts-active-run-md-221

- Summary: The command therefore follows the same precedence chain as other workflow-creating helpers (explicit `--output-dir` > `CAUTILUS_RUN_DIR` > auto-materialize under `./.cautilus/runs/`) and emits `Active run: <abs path>` once only when it auto-materializes.
- Current labels: audience=developer; proof=cautilus-eval; surface=dev/repo; readiness=ready-to-verify; evidence=unknown
- Source excerpt: The command therefore follows the same precedence chain as other workflow-creating helpers (explicit `--output-dir` > `CAUTILUS_RUN_DIR` > auto-materialize under `./.cautilus/runs/`) and emits `Active run: <abs path>` once only when it auto-materializes.
- Suggested next action: Create a host-owned dev/repo fixture and run it through cautilus eval test.
- Human claim quality: TODO
- Human corrected audience: keep
- Human corrected semantic group: keep
- Human corrected proof: keep
- Human corrected eval surface: keep
- Human readiness: keep
- Human priority: TODO
- Human notes:
- Trace: 1 source ref; docs/contracts/active-run.md:221

##### claim-docs-contracts-active-run-md-59

- Summary: The manifest is only a recognition marker for the pruner; workflow metadata belongs in per-command artifacts, not in the manifest.
- Current labels: audience=developer; proof=cautilus-eval; surface=dev/repo; readiness=ready-to-verify; evidence=unknown
- Source excerpt: The manifest is only a recognition marker for the pruner; workflow metadata belongs in per-command artifacts, not in the manifest.
- Suggested next action: Create a host-owned dev/repo fixture and run it through cautilus eval test.
- Human claim quality: TODO
- Human corrected audience: keep
- Human corrected semantic group: keep
- Human corrected proof: keep
- Human corrected eval surface: keep
- Human readiness: keep
- Human priority: TODO
- Human notes:
- Trace: 1 source ref; docs/contracts/active-run.md:59

##### claim-docs-contracts-adapter-contract-md-166

- Summary: `baseline_options`: allowed baseline choices and how the agent should think about them.
- Current labels: audience=developer; proof=cautilus-eval; surface=dev/repo; readiness=ready-to-verify; evidence=unknown
- Source excerpt: `baseline_options`: allowed baseline choices and how the agent should think about them.
- Suggested next action: Create a host-owned dev/repo fixture and run it through cautilus eval test.
- Human claim quality: TODO
- Human corrected audience: keep
- Human corrected semantic group: keep
- Human corrected proof: keep
- Human corrected eval surface: keep
- Human readiness: keep
- Human priority: TODO
- Human notes:
- Trace: 1 source ref; docs/contracts/adapter-contract.md:166

##### claim-docs-contracts-adapter-contract-md-197

- Summary: `history_file_hint`: default history file path when the workflow uses graduation or cadence.
- Current labels: audience=developer; proof=cautilus-eval; surface=dev/repo; readiness=ready-to-verify; evidence=unknown
- Source excerpt: `history_file_hint`: default history file path when the workflow uses graduation or cadence.
- Suggested next action: Create a host-owned dev/repo fixture and run it through cautilus eval test.
- Human claim quality: TODO
- Human corrected audience: keep
- Human corrected semantic group: keep
- Human corrected proof: keep
- Human corrected eval surface: keep
- Human readiness: keep
- Human priority: TODO
- Human notes:
- Trace: 1 source ref; docs/contracts/adapter-contract.md:197

##### claim-docs-contracts-adapter-contract-md-392

- Summary: point review prompts at the same path so human and machine review can refer to the same compare output
- Current labels: audience=developer; proof=cautilus-eval; surface=dev/repo; readiness=ready-to-verify; evidence=unknown
- Source excerpt: point review prompts at the same path so human and machine review can refer to the same compare output
- Suggested next action: Create a host-owned dev/repo fixture and run it through cautilus eval test.
- Human claim quality: TODO
- Human corrected audience: keep
- Human corrected semantic group: keep
- Human corrected proof: keep
- Human corrected eval surface: keep
- Human readiness: keep
- Human priority: TODO
- Human notes:
- Trace: 1 source ref; docs/contracts/adapter-contract.md:392

##### claim-docs-contracts-adapter-contract-md-438

- Summary: Each review prompt should point at human-visible failure:
- Current labels: audience=developer; proof=cautilus-eval; surface=dev/repo; readiness=ready-to-verify; evidence=unknown
- Source excerpt: Each review prompt should point at human-visible failure:
- Suggested next action: Create a host-owned dev/repo fixture and run it through cautilus eval test.
- Human claim quality: TODO
- Human corrected audience: keep
- Human corrected semantic group: keep
- Human corrected proof: keep
- Human corrected eval surface: keep
- Human readiness: keep
- Human priority: TODO
- Human notes:
- Trace: 1 source ref; docs/contracts/adapter-contract.md:438

##### claim-docs-contracts-claim-discovery-workflow-md-134

- Summary: After confirmation, the binary should record the effective scope in the packet so a future agent can reproduce or refresh the run.
- Current labels: audience=developer; proof=cautilus-eval; surface=dev/repo; readiness=ready-to-verify; evidence=unknown
- Source excerpt: After confirmation, the binary should record the effective scope in the packet so a future agent can reproduce or refresh the run.
- Suggested next action: Create a host-owned dev/repo fixture and run it through cautilus eval test.
- Human claim quality: TODO
- Human corrected audience: keep
- Human corrected semantic group: keep
- Human corrected proof: keep
- Human corrected eval surface: keep
- Human readiness: keep
- Human priority: TODO
- Human notes:
- Trace: 1 source ref; docs/contracts/claim-discovery-workflow.md:134

##### claim-docs-contracts-claim-discovery-workflow-md-229

- Summary: The old `proofLayer` field may remain for one compatibility window as a derived or deprecated field, but new workflow logic should use the split fields.
- Current labels: audience=developer; proof=cautilus-eval; surface=dev/repo; readiness=ready-to-verify; evidence=unknown
- Source excerpt: The old `proofLayer` field may remain for one compatibility window as a derived or deprecated field, but new workflow logic should use the split fields.
- Suggested next action: Create a host-owned dev/repo fixture and run it through cautilus eval test.
- Human claim quality: TODO
- Human corrected audience: keep
- Human corrected semantic group: keep
- Human corrected proof: keep
- Human corrected eval surface: keep
- Human readiness: keep
- Human priority: TODO
- Human notes:
- Trace: 1 source ref; docs/contracts/claim-discovery-workflow.md:229

##### claim-docs-contracts-claim-discovery-workflow-md-297

- Summary: `unknown` should be used when the workflow did not inspect enough evidence to make an honest statement.
- Current labels: audience=developer; proof=cautilus-eval; surface=dev/repo; readiness=ready-to-verify; evidence=unknown
- Source excerpt: `unknown` should be used when the workflow did not inspect enough evidence to make an honest statement.
- Suggested next action: Create a host-owned dev/repo fixture and run it through cautilus eval test.
- Human claim quality: TODO
- Human corrected audience: keep
- Human corrected semantic group: keep
- Human corrected proof: keep
- Human corrected eval surface: keep
- Human readiness: keep
- Human priority: TODO
- Human notes:
- Trace: 1 source ref; docs/contracts/claim-discovery-workflow.md:297

##### claim-docs-contracts-claim-discovery-workflow-md-382

- Summary: The refresh-plan packet should include a coordinator-facing summary rather than requiring every agent to reverse-engineer raw JSON fields:
- Current labels: audience=developer; proof=cautilus-eval; surface=dev/repo; readiness=ready-to-verify; evidence=unknown
- Source excerpt: The refresh-plan packet should include a coordinator-facing summary rather than requiring every agent to reverse-engineer raw JSON fields:
- Suggested next action: Create a host-owned dev/repo fixture and run it through cautilus eval test.
- Human claim quality: TODO
- Human corrected audience: keep
- Human corrected semantic group: keep
- Human corrected proof: keep
- Human corrected eval surface: keep
- Human readiness: keep
- Human priority: TODO
- Human notes:
- Trace: 1 source ref; docs/contracts/claim-discovery-workflow.md:382

##### claim-docs-contracts-claim-discovery-workflow-md-428

- Summary: The workflow should avoid a `claim group` command.
- Current labels: audience=developer; proof=cautilus-eval; surface=dev/repo; readiness=ready-to-verify; evidence=unknown
- Source excerpt: The workflow should avoid a `claim group` command.
- Suggested next action: Create a host-owned dev/repo fixture and run it through cautilus eval test.
- Human claim quality: TODO
- Human corrected audience: keep
- Human corrected semantic group: keep
- Human corrected proof: keep
- Human corrected eval surface: keep
- Human readiness: keep
- Human priority: TODO
- Human notes:
- Trace: 1 source ref; docs/contracts/claim-discovery-workflow.md:428

##### claim-docs-contracts-claim-discovery-workflow-md-449

- Summary: Scan confirmation and LLM review confirmation must be separate.
- Current labels: audience=developer; proof=cautilus-eval; surface=dev/repo; readiness=ready-to-verify; evidence=unknown
- Source excerpt: Scan confirmation and LLM review confirmation must be separate.
- Suggested next action: Create a host-owned dev/repo fixture and run it through cautilus eval test.
- Human claim quality: TODO
- Human corrected audience: keep
- Human corrected semantic group: keep
- Human corrected proof: keep
- Human corrected eval surface: keep
- Human readiness: keep
- Human priority: TODO
- Human notes:
- Trace: 1 source ref; docs/contracts/claim-discovery-workflow.md:449

##### claim-docs-contracts-claim-discovery-workflow-md-473

- Summary: LLM extraction should not move into the binary.
- Current labels: audience=developer; proof=cautilus-eval; surface=dev/repo; readiness=ready-to-verify; evidence=unknown
- Source excerpt: LLM extraction should not move into the binary.
- Suggested next action: Create a host-owned dev/repo fixture and run it through cautilus eval test.
- Human claim quality: TODO
- Human corrected audience: keep
- Human corrected semantic group: keep
- Human corrected proof: keep
- Human corrected eval surface: keep
- Human readiness: keep
- Human priority: TODO
- Human notes:
- Trace: 1 source ref; docs/contracts/claim-discovery-workflow.md:473

##### claim-docs-contracts-claim-discovery-workflow-md-508

- Summary: Whether model-backed extraction should ever become a binary runner behind an explicit provider contract.
- Current labels: audience=developer; proof=cautilus-eval; surface=dev/repo; readiness=ready-to-verify; evidence=unknown
- Source excerpt: Whether model-backed extraction should ever become a binary runner behind an explicit provider contract.
- Suggested next action: Create a host-owned dev/repo fixture and run it through cautilus eval test.
- Human claim quality: TODO
- Human corrected audience: keep
- Human corrected semantic group: keep
- Human corrected proof: keep
- Human corrected eval surface: keep
- Human readiness: keep
- Human priority: TODO
- Human notes:
- Trace: 1 source ref; docs/contracts/claim-discovery-workflow.md:508

##### claim-docs-contracts-claim-discovery-workflow-md-78

- Summary: This keeps the product agent-first without making the binary a host-specific agent runtime.
- Current labels: audience=developer; proof=cautilus-eval; surface=dev/repo; readiness=ready-to-verify; evidence=unknown
- Source excerpt: This keeps the product agent-first without making the binary a host-specific agent runtime.
- Suggested next action: Create a host-owned dev/repo fixture and run it through cautilus eval test.
- Human claim quality: TODO
- Human corrected audience: keep
- Human corrected semantic group: keep
- Human corrected proof: keep
- Human corrected eval surface: keep
- Human readiness: keep
- Human priority: TODO
- Human notes:
- Trace: 1 source ref; docs/contracts/claim-discovery-workflow.md:78

##### claim-docs-contracts-optimization-md-37

- Summary: Runtime fingerprint changes can become optimization context without becoming a separate refresh workflow; see runtime-fingerprint-optimization.md (./runtime-fingerprint-optimization.md).
- Current labels: audience=developer; proof=cautilus-eval; surface=dev/repo; readiness=ready-to-verify; evidence=unknown
- Source excerpt: Runtime fingerprint changes can become optimization context without becoming a separate refresh workflow; see runtime-fingerprint-optimization.md (./runtime-fingerprint-optimization.md).
- Suggested next action: Create a host-owned dev/repo fixture and run it through cautilus eval test.
- Human claim quality: TODO
- Human corrected audience: keep
- Human corrected semantic group: keep
- Human corrected proof: keep
- Human corrected eval surface: keep
- Human readiness: keep
- Human priority: TODO
- Human notes:
- Trace: 1 source ref; docs/contracts/optimization.md:37

##### claim-docs-contracts-reporting-md-14

- Summary: `intent_profile`: `cautilus.behavior_intent.v1` for the same behavior using the product-owned `behaviorSurface` and dimension catalogs `intent_profile.summary` must exactly match `intent`
- Current labels: audience=developer; proof=cautilus-eval; surface=dev/repo; readiness=ready-to-verify; evidence=unknown
- Source excerpt: `intent_profile`: `cautilus.behavior_intent.v1` for the same behavior using the product-owned `behaviorSurface` and dimension catalogs `intent_profile.summary` must exactly match `intent`
- Suggested next action: Create a host-owned dev/repo fixture and run it through cautilus eval test.
- Human claim quality: TODO
- Human corrected audience: keep
- Human corrected semantic group: keep
- Human corrected proof: keep
- Human corrected eval surface: keep
- Human readiness: keep
- Human priority: TODO
- Human notes:
- Trace: 1 source ref; docs/contracts/reporting.md:14

##### claim-docs-contracts-reporting-md-39

- Summary: optional `intentProfile` when present, it must use the product-owned behavior-intent catalog
- Current labels: audience=developer; proof=cautilus-eval; surface=dev/repo; readiness=ready-to-verify; evidence=unknown
- Source excerpt: optional `intentProfile` when present, it must use the product-owned behavior-intent catalog
- Suggested next action: Create a host-owned dev/repo fixture and run it through cautilus eval test.
- Human claim quality: TODO
- Human corrected audience: keep
- Human corrected semantic group: keep
- Human corrected proof: keep
- Human corrected eval surface: keep
- Human readiness: keep
- Human priority: TODO
- Human notes:
- Trace: 1 source ref; docs/contracts/reporting.md:39

##### claim-docs-contracts-review-packet-md-3

- Summary: `Cautilus` should keep review prompts, schemas, compare questions, and report artifacts on one durable boundary before executor variants run.
- Current labels: audience=developer; proof=cautilus-eval; surface=dev/repo; readiness=ready-to-verify; evidence=unknown
- Source excerpt: `Cautilus` should keep review prompts, schemas, compare questions, and report artifacts on one durable boundary before executor variants run.
- Suggested next action: Create a host-owned dev/repo fixture and run it through cautilus eval test.
- Human claim quality: TODO
- Human corrected audience: keep
- Human corrected semantic group: keep
- Human corrected proof: keep
- Human corrected eval surface: keep
- Human readiness: keep
- Human priority: TODO
- Human notes:
- Trace: 1 source ref; docs/contracts/review-packet.md:3

##### claim-docs-contracts-runtime-fingerprint-optimization-md-100

- Summary: Alias matching is intentionally not inferred in the first slice unless the runtime emits both requested and resolved model fields.
- Current labels: audience=developer; proof=cautilus-eval; surface=dev/repo; readiness=ready-to-verify; evidence=unknown
- Source excerpt: Alias matching is intentionally not inferred in the first slice unless the runtime emits both requested and resolved model fields.
- Suggested next action: Create a host-owned dev/repo fixture and run it through cautilus eval test.
- Human claim quality: TODO
- Human corrected audience: keep
- Human corrected semantic group: keep
- Human corrected proof: keep
- Human corrected eval surface: keep
- Human readiness: keep
- Human priority: TODO
- Human notes:
- Trace: 1 source ref; docs/contracts/runtime-fingerprint-optimization.md:100

##### claim-docs-contracts-runtime-fingerprint-optimization-md-190

- Summary: Report and evidence packets can carry runtime-context reason codes without treating them as behavior regressions.
- Current labels: audience=developer; proof=cautilus-eval; surface=dev/repo; readiness=ready-to-verify; evidence=unknown
- Source excerpt: Report and evidence packets can carry runtime-context reason codes without treating them as behavior regressions.
- Suggested next action: Create a host-owned dev/repo fixture and run it through cautilus eval test.
- Human claim quality: TODO
- Human corrected audience: keep
- Human corrected semantic group: keep
- Human corrected proof: keep
- Human corrected eval surface: keep
- Human readiness: keep
- Human priority: TODO
- Human notes:
- Trace: 1 source ref; docs/contracts/runtime-fingerprint-optimization.md:190

##### claim-docs-contracts-runtime-fingerprint-optimization-md-3

- Summary: `Cautilus` should make model and provider changes visible without turning every evaluation into a pinned-model benchmark.
- Current labels: audience=developer; proof=cautilus-eval; surface=dev/repo; readiness=ready-to-verify; evidence=unknown
- Source excerpt: `Cautilus` should make model and provider changes visible without turning every evaluation into a pinned-model benchmark.
- Suggested next action: Create a host-owned dev/repo fixture and run it through cautilus eval test.
- Human claim quality: TODO
- Human corrected audience: keep
- Human corrected semantic group: keep
- Human corrected proof: keep
- Human corrected eval surface: keep
- Human readiness: keep
- Human priority: TODO
- Human notes:
- Trace: 1 source ref; docs/contracts/runtime-fingerprint-optimization.md:3

##### claim-docs-contracts-runtime-fingerprint-optimization-md-36

- Summary: Under the default policy, a model or provider change should produce a context warning, not a failing result.
- Current labels: audience=developer; proof=cautilus-eval; surface=dev/repo; readiness=ready-to-verify; evidence=unknown
- Source excerpt: Under the default policy, a model or provider change should produce a context warning, not a failing result.
- Suggested next action: Create a host-owned dev/repo fixture and run it through cautilus eval test.
- Human claim quality: TODO
- Human corrected audience: keep
- Human corrected semantic group: keep
- Human corrected proof: keep
- Human corrected eval surface: keep
- Human readiness: keep
- Human priority: TODO
- Human notes:
- Trace: 1 source ref; docs/contracts/runtime-fingerprint-optimization.md:36

##### claim-docs-contracts-runtime-fingerprint-optimization-md-41

- Summary: `Cautilus` should not infer hidden model identity from human-oriented logs.
- Current labels: audience=developer; proof=cautilus-eval; surface=dev/repo; readiness=ready-to-verify; evidence=unknown
- Source excerpt: `Cautilus` should not infer hidden model identity from human-oriented logs.
- Suggested next action: Create a host-owned dev/repo fixture and run it through cautilus eval test.
- Human claim quality: TODO
- Human corrected audience: keep
- Human corrected semantic group: keep
- Human corrected proof: keep
- Human corrected eval surface: keep
- Human readiness: keep
- Human priority: TODO
- Human notes:
- Trace: 1 source ref; docs/contracts/runtime-fingerprint-optimization.md:41

##### claim-docs-contracts-scenario-proposal-sources-md-236

- Summary: Human-facing views may derive a smaller attention set, but they should not hide the full ranked result from agents.
- Current labels: audience=developer; proof=cautilus-eval; surface=dev/repo; readiness=ready-to-verify; evidence=unknown
- Source excerpt: Human-facing views may derive a smaller attention set, but they should not hide the full ranked result from agents.
- Suggested next action: Create a host-owned dev/repo fixture and run it through cautilus eval test.
- Human claim quality: TODO
- Human corrected audience: keep
- Human corrected semantic group: keep
- Human corrected proof: keep
- Human corrected eval surface: keep
- Human readiness: keep
- Human priority: TODO
- Human notes:
- Trace: 1 source ref; docs/contracts/scenario-proposal-sources.md:236

##### claim-docs-maintainers-development-md-133

- Summary: `internal/runtime/` owns shipped behavior semantics for native product surfaces.
- Current labels: audience=developer; proof=cautilus-eval; surface=dev/repo; readiness=ready-to-verify; evidence=unknown
- Source excerpt: `internal/runtime/` owns shipped behavior semantics for native product surfaces.
- Suggested next action: Create a host-owned dev/repo fixture and run it through cautilus eval test.
- Human claim quality: TODO
- Human corrected audience: keep
- Human corrected semantic group: keep
- Human corrected proof: keep
- Human corrected eval surface: keep
- Human readiness: keep
- Human priority: TODO
- Human notes:
- Trace: 1 source ref; docs/maintainers/development.md:133

##### claim-docs-maintainers-development-md-79

- Summary: `internal/app/app_test.go` owns single-command native command behavior and JSON payload shape.
- Current labels: audience=developer; proof=cautilus-eval; surface=dev/repo; readiness=ready-to-verify; evidence=unknown
- Source excerpt: `internal/app/app_test.go` owns single-command native command behavior and JSON payload shape.
- Suggested next action: Create a host-owned dev/repo fixture and run it through cautilus eval test.
- Human claim quality: TODO
- Human corrected audience: keep
- Human corrected semantic group: keep
- Human corrected proof: keep
- Human corrected eval surface: keep
- Human readiness: keep
- Human priority: TODO
- Human notes:
- Trace: 1 source ref; docs/maintainers/development.md:79

##### claim-docs-maintainers-development-md-83

- Summary: When adding a new check, start from the narrowest layer that can prove the behavior.
- Current labels: audience=developer; proof=cautilus-eval; surface=dev/repo; readiness=ready-to-verify; evidence=unknown
- Source excerpt: When adding a new check, start from the narrowest layer that can prove the behavior.
- Suggested next action: Create a host-owned dev/repo fixture and run it through cautilus eval test.
- Human claim quality: TODO
- Human corrected audience: keep
- Human corrected semantic group: keep
- Human corrected proof: keep
- Human corrected eval surface: keep
- Human readiness: keep
- Human priority: TODO
- Human notes:
- Trace: 1 source ref; docs/maintainers/development.md:83

##### claim-docs-master-plan-md-29

- Summary: The product surface should keep following the same discipline as `charness`: expose the user's intent at the public command boundary, keep tool-specific mechanics underneath it, and preserve durable artifacts that another agent can resume.
- Current labels: audience=developer; proof=cautilus-eval; surface=dev/repo; readiness=ready-to-verify; evidence=unknown
- Source excerpt: The product surface should keep following the same discipline as `charness`: expose the user's intent at the public command boundary, keep tool-specific mechanics underneath it, and preserve durable artifacts that another agent can resume.
- Suggested next action: Create a host-owned dev/repo fixture and run it through cautilus eval test.
- Human claim quality: TODO
- Human corrected audience: keep
- Human corrected semantic group: keep
- Human corrected proof: keep
- Human corrected eval surface: keep
- Human readiness: keep
- Human priority: TODO
- Human notes:
- Trace: 1 source ref; docs/master-plan.md:29

##### claim-docs-specs-command-surfaces-spec-md-143

- Summary: It tells an operator or agent what should be proven where.
- Current labels: audience=developer; proof=cautilus-eval; surface=dev/repo; readiness=ready-to-verify; evidence=unknown
- Source excerpt: It tells an operator or agent what should be proven where.
- Suggested next action: Create a host-owned dev/repo fixture and run it through cautilus eval test.
- Human claim quality: TODO
- Human corrected audience: keep
- Human corrected semantic group: keep
- Human corrected proof: keep
- Human corrected eval surface: keep
- Human readiness: keep
- Human priority: TODO
- Human notes:
- Trace: 1 source ref; docs/specs/command-surfaces.spec.md:143

##### claim-docs-specs-command-surfaces-spec-md-144

- Summary: It should preserve the discovered backlog honestly; prioritization belongs in the next agent step or a future explicit selection command, not in a hidden cap.
- Current labels: audience=developer; proof=cautilus-eval; surface=dev/repo; readiness=ready-to-verify; evidence=unknown
- Source excerpt: It should preserve the discovered backlog honestly; prioritization belongs in the next agent step or a future explicit selection command, not in a hidden cap.
- Suggested next action: Create a host-owned dev/repo fixture and run it through cautilus eval test.
- Human claim quality: TODO
- Human corrected audience: keep
- Human corrected semantic group: keep
- Human corrected proof: keep
- Human corrected eval surface: keep
- Human readiness: keep
- Human priority: TODO
- Human notes:
- Trace: 1 source ref; docs/specs/command-surfaces.spec.md:144

##### claim-docs-specs-command-surfaces-spec-md-148

- Summary: Agents should use that summary before hand-inspecting raw `changedSources` or `claimPlan`.
- Current labels: audience=developer; proof=cautilus-eval; surface=dev/repo; readiness=ready-to-verify; evidence=unknown
- Source excerpt: Agents should use that summary before hand-inspecting raw `changedSources` or `claimPlan`.
- Suggested next action: Create a host-owned dev/repo fixture and run it through cautilus eval test.
- Human claim quality: TODO
- Human corrected audience: keep
- Human corrected semantic group: keep
- Human corrected proof: keep
- Human corrected eval surface: keep
- Human readiness: keep
- Human priority: TODO
- Human notes:
- Trace: 1 source ref; docs/specs/command-surfaces.spec.md:148

##### claim-docs-specs-command-surfaces-spec-md-28

- Summary: Default output is not silently capped; agents are first-class readers of the packet and should filter or select claims explicitly instead of inheriting a hidden product limit.
- Current labels: audience=developer; proof=cautilus-eval; surface=dev/repo; readiness=ready-to-verify; evidence=unknown
- Source excerpt: Default output is not silently capped; agents are first-class readers of the packet and should filter or select claims explicitly instead of inheriting a hidden product limit.
- Suggested next action: Create a host-owned dev/repo fixture and run it through cautilus eval test.
- Human claim quality: TODO
- Human corrected audience: keep
- Human corrected semantic group: keep
- Human corrected proof: keep
- Human corrected eval surface: keep
- Human readiness: keep
- Human priority: TODO
- Human notes:
- Trace: 1 source ref; docs/specs/command-surfaces.spec.md:28

##### claim-docs-specs-command-surfaces-spec-md-281

- Summary: Countermeasure: first slice emits source-ref-backed proof plans and keeps model-backed extraction out until a runner boundary exists.
- Current labels: audience=developer; proof=cautilus-eval; surface=dev/repo; readiness=ready-to-verify; evidence=unknown
- Source excerpt: Countermeasure: first slice emits source-ref-backed proof plans and keeps model-backed extraction out until a runner boundary exists.
- Suggested next action: Create a host-owned dev/repo fixture and run it through cautilus eval test.
- Human claim quality: TODO
- Human corrected audience: keep
- Human corrected semantic group: keep
- Human corrected proof: keep
- Human corrected eval surface: keep
- Human readiness: keep
- Human priority: TODO
- Human notes:
- Trace: 1 source ref; docs/specs/command-surfaces.spec.md:281

##### claim-docs-specs-current-product-spec-md-3

- Summary: `Cautilus` currently helps an operator do one concrete job: turn recent behavior evidence into a bounded evaluation decision that can be reopened from files without redoing the whole analysis.
- Current labels: audience=developer; proof=cautilus-eval; surface=dev/repo; readiness=ready-to-verify; evidence=unknown
- Source excerpt: `Cautilus` currently helps an operator do one concrete job: turn recent behavior evidence into a bounded evaluation decision that can be reopened from files without redoing the whole analysis.
- Suggested next action: Create a host-owned dev/repo fixture and run it through cautilus eval test.
- Human claim quality: TODO
- Human corrected audience: keep
- Human corrected semantic group: keep
- Human corrected proof: keep
- Human corrected eval surface: keep
- Human readiness: keep
- Human priority: TODO
- Human notes:
- Trace: 1 source ref; docs/specs/current-product.spec.md:3

##### claim-docs-specs-current-product-spec-md-50

- Summary: The current product should be able to turn checked-in fixture data into one reusable evaluation decision without any LLM call.
- Current labels: audience=developer; proof=cautilus-eval; surface=dev/repo; readiness=ready-to-verify; evidence=unknown
- Source excerpt: The current product should be able to turn checked-in fixture data into one reusable evaluation decision without any LLM call.
- Suggested next action: Create a host-owned dev/repo fixture and run it through cautilus eval test.
- Human claim quality: TODO
- Human corrected audience: keep
- Human corrected semantic group: keep
- Human corrected proof: keep
- Human corrected eval surface: keep
- Human readiness: keep
- Human priority: TODO
- Human notes:
- Trace: 1 source ref; docs/specs/current-product.spec.md:50

##### claim-docs-specs-evaluation-surfaces-spec-md-174

- Summary: `dev` surface MUST work with the operator's installed Claude Code or Codex without re-pinning model versions.
- Current labels: audience=developer; proof=cautilus-eval; surface=dev/repo; readiness=ready-to-verify; evidence=unknown
- Source excerpt: `dev` surface MUST work with the operator's installed Claude Code or Codex without re-pinning model versions.
- Suggested next action: Create a host-owned dev/repo fixture and run it through cautilus eval test.
- Human claim quality: TODO
- Human corrected audience: keep
- Human corrected semantic group: keep
- Human corrected proof: keep
- Human corrected eval surface: keep
- Human readiness: keep
- Human priority: TODO
- Human notes:
- Trace: 1 source ref; docs/specs/evaluation-surfaces.spec.md:174

##### claim-docs-specs-evaluation-surfaces-spec-md-182

- Summary: A user with Claude Code installed and no other config can run `cautilus eval test --fixture <dev-repo.fixture.json>` against their own repo and get a usable result with provider, model, harness, durationMs, and costUsd recorded.
- Current labels: audience=developer; proof=cautilus-eval; surface=dev/repo; readiness=ready-to-verify; evidence=unknown
- Source excerpt: A user with Claude Code installed and no other config can run `cautilus eval test --fixture <dev-repo.fixture.json>` against their own repo and get a usable result with provider, model, harness, durationMs, and costUsd recorded.
- Suggested next action: Create a host-owned dev/repo fixture and run it through cautilus eval test.
- Human claim quality: TODO
- Human corrected audience: keep
- Human corrected semantic group: keep
- Human corrected proof: keep
- Human corrected eval surface: keep
- Human readiness: keep
- Human priority: TODO
- Human notes:
- Trace: 1 source ref; docs/specs/evaluation-surfaces.spec.md:182

##### claim-docs-specs-evaluation-surfaces-spec-md-183

- Summary: A user with Claude CLI but no API key can run `cautilus eval test --fixture <chat.fixture.json>` and get a usable result.
- Current labels: audience=developer; proof=cautilus-eval; surface=dev/repo; readiness=ready-to-verify; evidence=unknown
- Source excerpt: A user with Claude CLI but no API key can run `cautilus eval test --fixture <chat.fixture.json>` and get a usable result.
- Suggested next action: Create a host-owned dev/repo fixture and run it through cautilus eval test.
- Human claim quality: TODO
- Human corrected audience: keep
- Human corrected semantic group: keep
- Human corrected proof: keep
- Human corrected eval surface: keep
- Human readiness: keep
- Human priority: TODO
- Human notes:
- Trace: 1 source ref; docs/specs/evaluation-surfaces.spec.md:183

##### claim-docs-specs-git-precondition-spec-md-8

- Summary: The deeper backend behavior is covered by lower-level tests, but the public command contract should still reject invalid runtime names before doing work.
- Current labels: audience=developer; proof=cautilus-eval; surface=dev/repo; readiness=ready-to-verify; evidence=unknown
- Source excerpt: The deeper backend behavior is covered by lower-level tests, but the public command contract should still reject invalid runtime names before doing work.
- Suggested next action: Create a host-owned dev/repo fixture and run it through cautilus eval test.
- Human claim quality: TODO
- Human corrected audience: keep
- Human corrected semantic group: keep
- Human corrected proof: keep
- Human corrected eval surface: keep
- Human readiness: keep
- Human priority: TODO
- Human notes:
- Trace: 1 source ref; docs/specs/git-precondition.spec.md:8

#### Cautilus eval / dev/skill / ready-to-verify / evidence unknown (23)

##### claim-agents-md-61

- Summary: Keep this block short. Detailed routing belongs in installed skill metadata and `find-skills` output, not in a long checked-in catalog.
- Current labels: audience=developer; proof=cautilus-eval; surface=dev/skill; readiness=ready-to-verify; evidence=unknown
- Source excerpt: Keep this block short. Detailed routing belongs in installed skill metadata and `find-skills` output, not in a long checked-in catalog.
- Suggested next action: Create a host-owned dev/skill fixture and run it through cautilus eval test.
- Human claim quality: TODO
- Human corrected audience: keep
- Human corrected semantic group: keep
- Human corrected proof: keep
- Human corrected eval surface: keep
- Human readiness: keep
- Human priority: TODO
- Human notes:
- Trace: 1 source ref; AGENTS.md:61

##### claim-docs-contracts-adapter-contract-md-497

- Summary: Past sessions showed `codex exec` can emit skill-load errors on stderr while still returning a successful exit code.
- Current labels: audience=developer; proof=cautilus-eval; surface=dev/skill; readiness=ready-to-verify; evidence=unknown
- Source excerpt: Past sessions showed `codex exec` can emit skill-load errors on stderr while still returning a successful exit code.
- Suggested next action: Create a host-owned dev/skill fixture and run it through cautilus eval test.
- Human claim quality: TODO
- Human corrected audience: keep
- Human corrected semantic group: keep
- Human corrected proof: keep
- Human corrected eval surface: keep
- Human readiness: keep
- Human priority: TODO
- Human notes:
- Trace: 1 source ref; docs/contracts/adapter-contract.md:497

##### claim-docs-contracts-claim-discovery-workflow-md-124

- Summary: Before running a first broad scan, the skill should say which entries and depth it will use.
- Current labels: audience=developer; proof=cautilus-eval; surface=dev/skill; readiness=ready-to-verify; evidence=unknown
- Source excerpt: Before running a first broad scan, the skill should say which entries and depth it will use.
- Suggested next action: Create a host-owned dev/skill fixture and run it through cautilus eval test.
- Human claim quality: TODO
- Human corrected audience: keep
- Human corrected semantic group: keep
- Human corrected proof: keep
- Human corrected eval surface: keep
- Human readiness: keep
- Human priority: TODO
- Human notes:
- Trace: 1 source ref; docs/contracts/claim-discovery-workflow.md:124

##### claim-docs-contracts-claim-discovery-workflow-md-133

- Summary: The skill should ask the user to confirm or adjust that scope.
- Current labels: audience=developer; proof=cautilus-eval; surface=dev/skill; readiness=ready-to-verify; evidence=unknown
- Source excerpt: The skill should ask the user to confirm or adjust that scope.
- Suggested next action: Create a host-owned dev/skill fixture and run it through cautilus eval test.
- Human claim quality: TODO
- Human corrected audience: keep
- Human corrected semantic group: keep
- Human corrected proof: keep
- Human corrected eval surface: keep
- Human readiness: keep
- Human priority: TODO
- Human notes:
- Trace: 1 source ref; docs/contracts/claim-discovery-workflow.md:133

##### claim-docs-contracts-claim-discovery-workflow-md-152

- Summary: The user should confirm or adjust that review budget before the skill launches subagents or other LLM-backed review.
- Current labels: audience=developer; proof=cautilus-eval; surface=dev/skill; readiness=ready-to-verify; evidence=unknown
- Source excerpt: The user should confirm or adjust that review budget before the skill launches subagents or other LLM-backed review.
- Suggested next action: Create a host-owned dev/skill fixture and run it through cautilus eval test.
- Human claim quality: TODO
- Human corrected audience: keep
- Human corrected semantic group: keep
- Human corrected proof: keep
- Human corrected eval surface: keep
- Human readiness: keep
- Human priority: TODO
- Human notes:
- Trace: 1 source ref; docs/contracts/claim-discovery-workflow.md:152

##### claim-docs-contracts-claim-discovery-workflow-md-153

- Summary: If the user already delegated autonomous continuation, the skill may proceed within the recorded budget, but the budget still must be written to the packet.
- Current labels: audience=developer; proof=cautilus-eval; surface=dev/skill; readiness=ready-to-verify; evidence=unknown
- Source excerpt: If the user already delegated autonomous continuation, the skill may proceed within the recorded budget, but the budget still must be written to the packet.
- Suggested next action: Create a host-owned dev/skill fixture and run it through cautilus eval test.
- Human claim quality: TODO
- Human corrected audience: keep
- Human corrected semantic group: keep
- Human corrected proof: keep
- Human corrected eval surface: keep
- Human readiness: keep
- Human priority: TODO
- Human notes:
- Trace: 1 source ref; docs/contracts/claim-discovery-workflow.md:153

##### claim-docs-contracts-claim-discovery-workflow-md-294

- Summary: The skill review can upgrade them to `satisfied`, `partial`, `stale`, or `missing` only when the packet semantics above are met.
- Current labels: audience=developer; proof=cautilus-eval; surface=dev/skill; readiness=ready-to-verify; evidence=unknown
- Source excerpt: The skill review can upgrade them to `satisfied`, `partial`, `stale`, or `missing` only when the packet semantics above are met.
- Suggested next action: Create a host-owned dev/skill fixture and run it through cautilus eval test.
- Human claim quality: TODO
- Human corrected audience: keep
- Human corrected semantic group: keep
- Human corrected proof: keep
- Human corrected eval surface: keep
- Human readiness: keep
- Human priority: TODO
- Human notes:
- Trace: 1 source ref; docs/contracts/claim-discovery-workflow.md:294

##### claim-docs-contracts-claim-discovery-workflow-md-311

- Summary: The skill should review clusters in priority order:
- Current labels: audience=developer; proof=cautilus-eval; surface=dev/skill; readiness=ready-to-verify; evidence=unknown
- Source excerpt: The skill should review clusters in priority order:
- Suggested next action: Create a host-owned dev/skill fixture and run it through cautilus eval test.
- Human claim quality: TODO
- Human corrected audience: keep
- Human corrected semantic group: keep
- Human corrected proof: keep
- Human corrected eval surface: keep
- Human readiness: keep
- Human priority: TODO
- Human notes:
- Trace: 1 source ref; docs/contracts/claim-discovery-workflow.md:311

##### claim-docs-contracts-claim-discovery-workflow-md-322

- Summary: The parent skill should merge results and keep review provenance in the packet.
- Current labels: audience=developer; proof=cautilus-eval; surface=dev/skill; readiness=ready-to-verify; evidence=unknown
- Source excerpt: The parent skill should merge results and keep review provenance in the packet.
- Suggested next action: Create a host-owned dev/skill fixture and run it through cautilus eval test.
- Human claim quality: TODO
- Human corrected audience: keep
- Human corrected semantic group: keep
- Human corrected proof: keep
- Human corrected eval surface: keep
- Human readiness: keep
- Human priority: TODO
- Human notes:
- Trace: 1 source ref; docs/contracts/claim-discovery-workflow.md:322

##### claim-docs-contracts-claim-discovery-workflow-md-397

- Summary: After discovery or refresh, the skill should report status in a compact decision-oriented shape:
- Current labels: audience=developer; proof=cautilus-eval; surface=dev/skill; readiness=ready-to-verify; evidence=unknown
- Source excerpt: After discovery or refresh, the skill should report status in a compact decision-oriented shape:
- Suggested next action: Create a host-owned dev/skill fixture and run it through cautilus eval test.
- Human claim quality: TODO
- Human corrected audience: keep
- Human corrected semantic group: keep
- Human corrected proof: keep
- Human corrected eval surface: keep
- Human readiness: keep
- Human priority: TODO
- Human notes:
- Trace: 1 source ref; docs/contracts/claim-discovery-workflow.md:397

##### claim-docs-contracts-claim-discovery-workflow-md-421

- Summary: The skill should then ask the user which branch to take.
- Current labels: audience=developer; proof=cautilus-eval; surface=dev/skill; readiness=ready-to-verify; evidence=unknown
- Source excerpt: The skill should then ask the user which branch to take.
- Suggested next action: Create a host-owned dev/skill fixture and run it through cautilus eval test.
- Human claim quality: TODO
- Human corrected audience: keep
- Human corrected semantic group: keep
- Human corrected proof: keep
- Human corrected eval surface: keep
- Human readiness: keep
- Human priority: TODO
- Human notes:
- Trace: 1 source ref; docs/contracts/claim-discovery-workflow.md:421

##### claim-docs-contracts-claim-discovery-workflow-md-424

- Summary: The skill should not automatically launch expensive evaluator runs or broad code edits after status unless the user has already delegated that continuation and the recorded budget covers it.
- Current labels: audience=developer; proof=cautilus-eval; surface=dev/skill; readiness=ready-to-verify; evidence=unknown
- Source excerpt: The skill should not automatically launch expensive evaluator runs or broad code edits after status unless the user has already delegated that continuation and the recorded budget covers it.
- Suggested next action: Create a host-owned dev/skill fixture and run it through cautilus eval test.
- Human claim quality: TODO
- Human corrected audience: keep
- Human corrected semantic group: keep
- Human corrected proof: keep
- Human corrected eval surface: keep
- Human readiness: keep
- Human priority: TODO
- Human notes:
- Trace: 1 source ref; docs/contracts/claim-discovery-workflow.md:424

##### claim-docs-contracts-claim-discovery-workflow-md-486

- Summary: The bundled skill owns LLM review and subagent orchestration.
- Current labels: audience=developer; proof=cautilus-eval; surface=dev/skill; readiness=ready-to-verify; evidence=unknown
- Source excerpt: The bundled skill owns LLM review and subagent orchestration.
- Suggested next action: Create a host-owned dev/skill fixture and run it through cautilus eval test.
- Human claim quality: TODO
- Human corrected audience: keep
- Human corrected semantic group: keep
- Human corrected proof: keep
- Human corrected eval surface: keep
- Human readiness: keep
- Human priority: TODO
- Human notes:
- Trace: 1 source ref; docs/contracts/claim-discovery-workflow.md:486

##### claim-docs-contracts-claim-discovery-workflow-md-502

- Summary: How much of the refresh-plan helper should ship in the first binary slice versus the first skill slice?
- Current labels: audience=developer; proof=cautilus-eval; surface=dev/skill; readiness=ready-to-verify; evidence=unknown
- Source excerpt: How much of the refresh-plan helper should ship in the first binary slice versus the first skill slice?
- Suggested next action: Create a host-owned dev/skill fixture and run it through cautilus eval test.
- Human claim quality: TODO
- Human corrected audience: keep
- Human corrected semantic group: keep
- Human corrected proof: keep
- Human corrected eval surface: keep
- Human readiness: keep
- Human priority: TODO
- Human notes:
- Trace: 1 source ref; docs/contracts/claim-discovery-workflow.md:502

##### claim-docs-contracts-claim-discovery-workflow-md-522

- Summary: A user can invoke the Cautilus skill without detailed input and get a clear status summary rather than a raw 500-claim dump.
- Current labels: audience=developer; proof=cautilus-eval; surface=dev/skill; readiness=ready-to-verify; evidence=unknown
- Source excerpt: A user can invoke the Cautilus skill without detailed input and get a clear status summary rather than a raw 500-claim dump.
- Suggested next action: Create a host-owned dev/skill fixture and run it through cautilus eval test.
- Human claim quality: TODO
- Human corrected audience: keep
- Human corrected semantic group: keep
- Human corrected proof: keep
- Human corrected eval surface: keep
- Human readiness: keep
- Human priority: TODO
- Human notes:
- Trace: 1 source ref; docs/contracts/claim-discovery-workflow.md:522

##### claim-docs-contracts-claim-discovery-workflow-md-65

- Summary: The bundled skill should own orchestration that depends on an agent:
- Current labels: audience=developer; proof=cautilus-eval; surface=dev/skill; readiness=ready-to-verify; evidence=unknown
- Source excerpt: The bundled skill should own orchestration that depends on an agent:
- Suggested next action: Create a host-owned dev/skill fixture and run it through cautilus eval test.
- Human claim quality: TODO
- Human corrected audience: keep
- Human corrected semantic group: keep
- Human corrected proof: keep
- Human corrected eval surface: keep
- Human readiness: keep
- Human priority: TODO
- Human notes:
- Trace: 1 source ref; docs/contracts/claim-discovery-workflow.md:65

##### claim-docs-contracts-runtime-fingerprint-optimization-md-188

- Summary: A skill or eval test can pass while still reporting that the observed runtime changed from the comparison evidence.
- Current labels: audience=developer; proof=cautilus-eval; surface=dev/skill; readiness=ready-to-verify; evidence=unknown
- Source excerpt: A skill or eval test can pass while still reporting that the observed runtime changed from the comparison evidence.
- Suggested next action: Create a host-owned dev/skill fixture and run it through cautilus eval test.
- Human claim quality: TODO
- Human corrected audience: keep
- Human corrected semantic group: keep
- Human corrected proof: keep
- Human corrected eval surface: keep
- Human readiness: keep
- Human priority: TODO
- Human notes:
- Trace: 1 source ref; docs/contracts/runtime-fingerprint-optimization.md:188

##### claim-docs-contracts-scenario-history-md-238

- Summary: **Part 2 — broader compare ownership.** Extend history / compare hooks beyond the single profile-backed eval path so `review variants`, profile-less eval test runs, and skill evaluation can also update history and materialize compare artifacts.
- Current labels: audience=developer; proof=cautilus-eval; surface=dev/skill; readiness=ready-to-verify; evidence=unknown
- Source excerpt: **Part 2 — broader compare ownership.** Extend history / compare hooks beyond the single profile-backed eval path so `review variants`, profile-less eval test runs, and skill evaluation can also update history and materialize compare artifacts.
- Suggested next action: Create a host-owned dev/skill fixture and run it through cautilus eval test.
- Human claim quality: TODO
- Human corrected audience: keep
- Human corrected semantic group: keep
- Human corrected proof: keep
- Human corrected eval surface: keep
- Human readiness: keep
- Human priority: TODO
- Human notes:
- Trace: 1 source ref; docs/contracts/scenario-history.md:238

##### claim-docs-maintainers-release-boundary-md-62

- Summary: CLI help, bundled skill instructions, and executable specs should describe the same commands
- Current labels: audience=developer; proof=cautilus-eval; surface=dev/skill; readiness=ready-to-verify; evidence=unknown
- Source excerpt: CLI help, bundled skill instructions, and executable specs should describe the same commands
- Suggested next action: Create a host-owned dev/skill fixture and run it through cautilus eval test.
- Human claim quality: TODO
- Human corrected audience: keep
- Human corrected semantic group: keep
- Human corrected proof: keep
- Human corrected eval surface: keep
- Human readiness: keep
- Human priority: TODO
- Human notes:
- Trace: 1 source ref; docs/maintainers/release-boundary.md:62

##### claim-docs-specs-index-spec-md-34

- Summary: Standalone Surface (standalone-surface.spec.md) Proves that the standalone binary and bundled skill can be installed into a fresh repo and discovered through stable operator-facing commands.
- Current labels: audience=developer; proof=cautilus-eval; surface=dev/skill; readiness=ready-to-verify; evidence=unknown
- Source excerpt: Standalone Surface (standalone-surface.spec.md) Proves that the standalone binary and bundled skill can be installed into a fresh repo and discovered through stable operator-facing commands.
- Suggested next action: Create a host-owned dev/skill fixture and run it through cautilus eval test.
- Human claim quality: TODO
- Human corrected audience: keep
- Human corrected semantic group: keep
- Human corrected proof: keep
- Human corrected eval surface: keep
- Human readiness: keep
- Human priority: TODO
- Human notes:
- Trace: 1 source ref; docs/specs/index.spec.md:34

##### claim-docs-specs-self-dogfood-spec-md-9

- Summary: It should not pretend that every stronger binary, skill, or review claim is part of the standing gate.
- Current labels: audience=developer; proof=cautilus-eval; surface=dev/skill; readiness=ready-to-verify; evidence=unknown
- Source excerpt: It should not pretend that every stronger binary, skill, or review claim is part of the standing gate.
- Suggested next action: Create a host-owned dev/skill fixture and run it through cautilus eval test.
- Human claim quality: TODO
- Human corrected audience: keep
- Human corrected semantic group: keep
- Human corrected proof: keep
- Human corrected eval surface: keep
- Human readiness: keep
- Human priority: TODO
- Human notes:
- Trace: 1 source ref; docs/specs/self-dogfood.spec.md:9

##### claim-docs-specs-standalone-surface-spec-md-3

- Summary: `Cautilus` should make sense as a standalone binary plus a bundled skill.
- Current labels: audience=developer; proof=cautilus-eval; surface=dev/skill; readiness=ready-to-verify; evidence=unknown
- Source excerpt: `Cautilus` should make sense as a standalone binary plus a bundled skill.
- Suggested next action: Create a host-owned dev/skill fixture and run it through cautilus eval test.
- Human claim quality: TODO
- Human corrected audience: keep
- Human corrected semantic group: keep
- Human corrected proof: keep
- Human corrected eval surface: keep
- Human readiness: keep
- Human priority: TODO
- Human notes:
- Trace: 1 source ref; docs/specs/standalone-surface.spec.md:3

##### claim-docs-specs-standalone-surface-spec-md-4

- Summary: The product should not need a host-specific migration story before an operator can discover the command surface, install the skill, and run readiness checks in a fresh repo.
- Current labels: audience=developer; proof=cautilus-eval; surface=dev/skill; readiness=ready-to-verify; evidence=unknown
- Source excerpt: The product should not need a host-specific migration story before an operator can discover the command surface, install the skill, and run readiness checks in a fresh repo.
- Suggested next action: Create a host-owned dev/skill fixture and run it through cautilus eval test.
- Human claim quality: TODO
- Human corrected audience: keep
- Human corrected semantic group: keep
- Human corrected proof: keep
- Human corrected eval surface: keep
- Human readiness: keep
- Human priority: TODO
- Human notes:
- Trace: 1 source ref; docs/specs/standalone-surface.spec.md:4

#### Cautilus eval / surface undecided / needs-scenario / evidence unknown (1)

##### claim-agents-md-78

- Summary: The skill should own routing, sequencing, guardrails, and decision boundaries; the binary should own broad command discovery, help text, scenario catalogs, packet examples, install smoke, and doctor/readiness details.
- Current labels: audience=developer; proof=cautilus-eval; surface=none; readiness=needs-scenario; evidence=unknown
- Source excerpt: The skill should own routing, sequencing, guardrails, and decision boundaries; the binary should own broad command discovery, help text, scenario catalogs, packet examples, install smoke, and doctor/readiness details.
- Suggested next action: Use the scenario proposal flow to normalize candidate evidence before creating a checked-in eval fixture.
- Human claim quality: TODO
- Human corrected audience: keep
- Human corrected semantic group: keep
- Human corrected proof: keep
- Human corrected eval surface: keep
- Human readiness: keep
- Human priority: TODO
- Human notes:
- Trace: 1 source ref; AGENTS.md:78

#### Deterministic gate / ready-to-verify / evidence unknown (33)

##### claim-docs-contracts-adapter-contract-md-495

- Summary: Past runs showed some CLIs can reject schemas that declare object properties without also listing them in `required`, even when plain JSON Schema would allow them as optional.
- Current labels: audience=developer; proof=deterministic; surface=none; readiness=ready-to-verify; evidence=unknown
- Source excerpt: Past runs showed some CLIs can reject schemas that declare object properties without also listing them in `required`, even when plain JSON Schema would allow them as optional.
- Suggested next action: Keep or add a repo-owned unit, lint, build, schema, or CI check for this claim.
- Human claim quality: TODO
- Human corrected audience: keep
- Human corrected semantic group: keep
- Human corrected proof: keep
- Human corrected eval surface: keep
- Human readiness: keep
- Human priority: TODO
- Human notes:
- Trace: 1 source ref; docs/contracts/adapter-contract.md:495

##### claim-docs-contracts-claim-discovery-workflow-md-125

- Summary: It should also show the deterministic bounds that will be applied:
- Current labels: audience=developer; proof=deterministic; surface=none; readiness=ready-to-verify; evidence=unknown
- Source excerpt: It should also show the deterministic bounds that will be applied:
- Suggested next action: Keep or add a repo-owned unit, lint, build, schema, or CI check for this claim.
- Human claim quality: TODO
- Human corrected audience: keep
- Human corrected semantic group: keep
- Human corrected proof: keep
- Human corrected eval surface: keep
- Human readiness: keep
- Human priority: TODO
- Human notes:
- Trace: 1 source ref; docs/contracts/claim-discovery-workflow.md:125

##### claim-docs-contracts-claim-discovery-workflow-md-139

- Summary: After the deterministic pass, the skill should show a separate review plan:
- Current labels: audience=developer; proof=deterministic; surface=none; readiness=ready-to-verify; evidence=unknown
- Source excerpt: After the deterministic pass, the skill should show a separate review plan:
- Suggested next action: Keep or add a repo-owned unit, lint, build, schema, or CI check for this claim.
- Human claim quality: TODO
- Human corrected audience: keep
- Human corrected semantic group: keep
- Human corrected proof: keep
- Human corrected eval surface: keep
- Human readiness: keep
- Human priority: TODO
- Human notes:
- Trace: 1 source ref; docs/contracts/claim-discovery-workflow.md:139

##### claim-docs-contracts-claim-discovery-workflow-md-21

- Summary: Existing claim state refresh is selected by the skill when it detects a prior JSON packet, but the refresh plan and state transition must be recorded in deterministic packets or helper output.
- Current labels: audience=developer; proof=deterministic; surface=none; readiness=ready-to-verify; evidence=unknown
- Source excerpt: Existing claim state refresh is selected by the skill when it detects a prior JSON packet, but the refresh plan and state transition must be recorded in deterministic packets or helper output.
- Suggested next action: Keep or add a repo-owned unit, lint, build, schema, or CI check for this claim.
- Human claim quality: TODO
- Human corrected audience: keep
- Human corrected semantic group: keep
- Human corrected proof: keep
- Human corrected eval surface: keep
- Human readiness: keep
- Human priority: TODO
- Human notes:
- Trace: 1 source ref; docs/contracts/claim-discovery-workflow.md:21

##### claim-docs-contracts-claim-discovery-workflow-md-230

- Summary: During that window, derivation must be deterministic and tested:
- Current labels: audience=developer; proof=deterministic; surface=none; readiness=ready-to-verify; evidence=unknown
- Source excerpt: During that window, derivation must be deterministic and tested:
- Suggested next action: Keep or add a repo-owned unit, lint, build, schema, or CI check for this claim.
- Human claim quality: TODO
- Human corrected audience: keep
- Human corrected semantic group: keep
- Human corrected proof: keep
- Human corrected eval surface: keep
- Human readiness: keep
- Human priority: TODO
- Human notes:
- Trace: 1 source ref; docs/contracts/claim-discovery-workflow.md:230

##### claim-docs-contracts-claim-discovery-workflow-md-281

- Summary: The binary can do cheap deterministic preflight, but the skill owns final interpretation.
- Current labels: audience=developer; proof=deterministic; surface=none; readiness=ready-to-verify; evidence=unknown
- Source excerpt: The binary can do cheap deterministic preflight, but the skill owns final interpretation.
- Suggested next action: Keep or add a repo-owned unit, lint, build, schema, or CI check for this claim.
- Human claim quality: TODO
- Human corrected audience: keep
- Human corrected semantic group: keep
- Human corrected proof: keep
- Human corrected eval surface: keep
- Human readiness: keep
- Human priority: TODO
- Human notes:
- Trace: 1 source ref; docs/contracts/claim-discovery-workflow.md:281

##### claim-docs-contracts-claim-discovery-workflow-md-302

- Summary: The deterministic pass should emit grouping hints:
- Current labels: audience=developer; proof=deterministic; surface=none; readiness=ready-to-verify; evidence=unknown
- Source excerpt: The deterministic pass should emit grouping hints:
- Suggested next action: Keep or add a repo-owned unit, lint, build, schema, or CI check for this claim.
- Human claim quality: TODO
- Human corrected audience: keep
- Human corrected semantic group: keep
- Human corrected proof: keep
- Human corrected eval surface: keep
- Human readiness: keep
- Human priority: TODO
- Human notes:
- Trace: 1 source ref; docs/contracts/claim-discovery-workflow.md:302

##### claim-docs-contracts-claim-discovery-workflow-md-39

- Summary: If prior claim state exists, step 5 becomes a diff-aware refresh selected by the skill: the skill uses the previous packet, the previous commit recorded in that packet, and a deterministic refresh plan to decide which sources need rescanning or re-review.
- Current labels: audience=developer; proof=deterministic; surface=none; readiness=ready-to-verify; evidence=unknown
- Source excerpt: If prior claim state exists, step 5 becomes a diff-aware refresh selected by the skill: the skill uses the previous packet, the previous commit recorded in that packet, and a deterministic refresh plan to decide which sources need rescanning or re-review.
- Suggested next action: Keep or add a repo-owned unit, lint, build, schema, or CI check for this claim.
- Human claim quality: TODO
- Human corrected audience: keep
- Human corrected semantic group: keep
- Human corrected proof: keep
- Human corrected eval surface: keep
- Human readiness: keep
- Human priority: TODO
- Human notes:
- Trace: 1 source ref; docs/contracts/claim-discovery-workflow.md:39

##### claim-docs-contracts-claim-discovery-workflow-md-454

- Summary: The skill may select refresh, but deterministic refresh-plan output must record baseline commit, target policy, changed sources, carried-forward claims, stale evidence reasons, and dirty-working-tree treatment.
- Current labels: audience=developer; proof=deterministic; surface=none; readiness=ready-to-verify; evidence=unknown
- Source excerpt: The skill may select refresh, but deterministic refresh-plan output must record baseline commit, target policy, changed sources, carried-forward claims, stale evidence reasons, and dirty-working-tree treatment.
- Suggested next action: Keep or add a repo-owned unit, lint, build, schema, or CI check for this claim.
- Human claim quality: TODO
- Human corrected audience: keep
- Human corrected semantic group: keep
- Human corrected proof: keep
- Human corrected eval surface: keep
- Human readiness: keep
- Human priority: TODO
- Human notes:
- Trace: 1 source ref; docs/contracts/claim-discovery-workflow.md:454

##### claim-docs-contracts-claim-discovery-workflow-md-47

- Summary: The binary should own deterministic behavior that can be rerun without model access:
- Current labels: audience=developer; proof=deterministic; surface=none; readiness=ready-to-verify; evidence=unknown
- Source excerpt: The binary should own deterministic behavior that can be rerun without model access:
- Suggested next action: Keep or add a repo-owned unit, lint, build, schema, or CI check for this claim.
- Human claim quality: TODO
- Human corrected audience: keep
- Human corrected semantic group: keep
- Human corrected proof: keep
- Human corrected eval surface: keep
- Human readiness: keep
- Human priority: TODO
- Human notes:
- Trace: 1 source ref; docs/contracts/claim-discovery-workflow.md:47

##### claim-docs-contracts-claim-discovery-workflow-md-474

- Summary: The binary stays deterministic and provider-neutral.
- Current labels: audience=developer; proof=deterministic; surface=none; readiness=ready-to-verify; evidence=unknown
- Source excerpt: The binary stays deterministic and provider-neutral.
- Suggested next action: Keep or add a repo-owned unit, lint, build, schema, or CI check for this claim.
- Human claim quality: TODO
- Human corrected audience: keep
- Human corrected semantic group: keep
- Human corrected proof: keep
- Human corrected eval surface: keep
- Human readiness: keep
- Human priority: TODO
- Human notes:
- Trace: 1 source ref; docs/contracts/claim-discovery-workflow.md:474

##### claim-docs-contracts-claim-discovery-workflow-md-479

- Summary: Perfect subagent batch sizing should wait until the deterministic packet and skill control flow are dogfooded.
- Current labels: audience=developer; proof=deterministic; surface=none; readiness=ready-to-verify; evidence=unknown
- Source excerpt: Perfect subagent batch sizing should wait until the deterministic packet and skill control flow are dogfooded.
- Suggested next action: Keep or add a repo-owned unit, lint, build, schema, or CI check for this claim.
- Human claim quality: TODO
- Human corrected audience: keep
- Human corrected semantic group: keep
- Human corrected proof: keep
- Human corrected eval surface: keep
- Human readiness: keep
- Human priority: TODO
- Human notes:
- Trace: 1 source ref; docs/contracts/claim-discovery-workflow.md:479

##### claim-docs-contracts-claim-discovery-workflow-md-485

- Summary: The binary remains deterministic and does not directly call an LLM.
- Current labels: audience=developer; proof=deterministic; surface=none; readiness=ready-to-verify; evidence=unknown
- Source excerpt: The binary remains deterministic and does not directly call an LLM.
- Suggested next action: Keep or add a repo-owned unit, lint, build, schema, or CI check for this claim.
- Human claim quality: TODO
- Human corrected audience: keep
- Human corrected semantic group: keep
- Human corrected proof: keep
- Human corrected eval surface: keep
- Human readiness: keep
- Human priority: TODO
- Human notes:
- Trace: 1 source ref; docs/contracts/claim-discovery-workflow.md:485

##### claim-docs-contracts-claim-discovery-workflow-md-491

- Summary: Existing state refresh is selected by the skill when prior claim JSON exists, but deterministic refresh-plan output owns the state transition.
- Current labels: audience=developer; proof=deterministic; surface=none; readiness=ready-to-verify; evidence=unknown
- Source excerpt: Existing state refresh is selected by the skill when prior claim JSON exists, but deterministic refresh-plan output owns the state transition.
- Suggested next action: Keep or add a repo-owned unit, lint, build, schema, or CI check for this claim.
- Human claim quality: TODO
- Human corrected audience: keep
- Human corrected semantic group: keep
- Human corrected proof: keep
- Human corrected eval surface: keep
- Human readiness: keep
- Human priority: TODO
- Human notes:
- Trace: 1 source ref; docs/contracts/claim-discovery-workflow.md:491

##### claim-docs-contracts-claim-discovery-workflow-md-499

- Summary: How much deterministic evidence preflight should the binary do before it risks false satisfaction?
- Current labels: audience=developer; proof=deterministic; surface=none; readiness=ready-to-verify; evidence=unknown
- Source excerpt: How much deterministic evidence preflight should the binary do before it risks false satisfaction?
- Suggested next action: Keep or add a repo-owned unit, lint, build, schema, or CI check for this claim.
- Human claim quality: TODO
- Human corrected audience: keep
- Human corrected semantic group: keep
- Human corrected proof: keep
- Human corrected eval surface: keep
- Human readiness: keep
- Human priority: TODO
- Human notes:
- Trace: 1 source ref; docs/contracts/claim-discovery-workflow.md:499

##### claim-docs-contracts-claim-discovery-workflow-md-527

- Summary: The workflow can say which claims already have deterministic or Cautilus evidence, and which still need scenarios, tests, or alignment work.
- Current labels: audience=developer; proof=deterministic; surface=none; readiness=ready-to-verify; evidence=unknown
- Source excerpt: The workflow can say which claims already have deterministic or Cautilus evidence, and which still need scenarios, tests, or alignment work.
- Suggested next action: Keep or add a repo-owned unit, lint, build, schema, or CI check for this claim.
- Human claim quality: TODO
- Human corrected audience: keep
- Human corrected semantic group: keep
- Human corrected proof: keep
- Human corrected eval surface: keep
- Human readiness: keep
- Human priority: TODO
- Human notes:
- Trace: 1 source ref; docs/contracts/claim-discovery-workflow.md:527

##### claim-docs-contracts-claim-discovery-workflow-md-553

- Summary: The binary should remain deterministic and provider-neutral.
- Current labels: audience=developer; proof=deterministic; surface=none; readiness=ready-to-verify; evidence=unknown
- Source excerpt: The binary should remain deterministic and provider-neutral.
- Suggested next action: Keep or add a repo-owned unit, lint, build, schema, or CI check for this claim.
- Human claim quality: TODO
- Human corrected audience: keep
- Human corrected semantic group: keep
- Human corrected proof: keep
- Human corrected eval surface: keep
- Human readiness: keep
- Human priority: TODO
- Human notes:
- Trace: 1 source ref; docs/contracts/claim-discovery-workflow.md:553

##### claim-docs-contracts-claim-discovery-workflow-md-579

- Summary: LLM-backed cluster review should come after the deterministic packet and skill control flow are stable enough to dogfood.
- Current labels: audience=developer; proof=deterministic; surface=none; readiness=ready-to-verify; evidence=unknown
- Source excerpt: LLM-backed cluster review should come after the deterministic packet and skill control flow are stable enough to dogfood.
- Suggested next action: Keep or add a repo-owned unit, lint, build, schema, or CI check for this claim.
- Human claim quality: TODO
- Human corrected audience: keep
- Human corrected semantic group: keep
- Human corrected proof: keep
- Human corrected eval surface: keep
- Human readiness: keep
- Human priority: TODO
- Human notes:
- Trace: 1 source ref; docs/contracts/claim-discovery-workflow.md:579

##### claim-docs-contracts-live-run-invocation-batch-md-77

- Summary: For each kept scenario, the command expands `samplesPerScenario` into deterministic request ids and emits the canonical batch request packet.
- Current labels: audience=developer; proof=deterministic; surface=none; readiness=ready-to-verify; evidence=unknown
- Source excerpt: For each kept scenario, the command expands `samplesPerScenario` into deterministic request ids and emits the canonical batch request packet.
- Suggested next action: Keep or add a repo-owned unit, lint, build, schema, or CI check for this claim.
- Human claim quality: TODO
- Human corrected audience: keep
- Human corrected semantic group: keep
- Human corrected proof: keep
- Human corrected eval surface: keep
- Human readiness: keep
- Human priority: TODO
- Human notes:
- Trace: 1 source ref; docs/contracts/live-run-invocation-batch.md:77

##### claim-docs-contracts-reporting-md-48

- Summary: This keeps report assembly deterministic.
- Current labels: audience=developer; proof=deterministic; surface=none; readiness=ready-to-verify; evidence=unknown
- Source excerpt: This keeps report assembly deterministic.
- Suggested next action: Keep or add a repo-owned unit, lint, build, schema, or CI check for this claim.
- Human claim quality: TODO
- Human corrected audience: keep
- Human corrected semantic group: keep
- Human corrected proof: keep
- Human corrected eval surface: keep
- Human readiness: keep
- Human priority: TODO
- Human notes:
- Trace: 1 source ref; docs/contracts/reporting.md:48

##### claim-docs-contracts-runtime-fingerprint-optimization-md-154

- Summary: It should generate a candidate or revision brief, then require the same tests and review gates before the candidate is trusted.
- Current labels: audience=developer; proof=deterministic; surface=none; readiness=ready-to-verify; evidence=unknown
- Source excerpt: It should generate a candidate or revision brief, then require the same tests and review gates before the candidate is trusted.
- Suggested next action: Keep or add a repo-owned unit, lint, build, schema, or CI check for this claim.
- Human claim quality: TODO
- Human corrected audience: keep
- Human corrected semantic group: keep
- Human corrected proof: keep
- Human corrected eval surface: keep
- Human readiness: keep
- Human priority: TODO
- Human notes:
- Trace: 1 source ref; docs/contracts/runtime-fingerprint-optimization.md:154

##### claim-docs-contracts-runtime-fingerprint-optimization-md-8

- Summary: By default, those tests should not force a model choice just to make evaluation evidence easier to compare.
- Current labels: audience=developer; proof=deterministic; surface=none; readiness=ready-to-verify; evidence=unknown
- Source excerpt: By default, those tests should not force a model choice just to make evaluation evidence easier to compare.
- Suggested next action: Keep or add a repo-owned unit, lint, build, schema, or CI check for this claim.
- Human claim quality: TODO
- Human corrected audience: keep
- Human corrected semantic group: keep
- Human corrected proof: keep
- Human corrected eval surface: keep
- Human readiness: keep
- Human priority: TODO
- Human notes:
- Trace: 1 source ref; docs/contracts/runtime-fingerprint-optimization.md:8

##### claim-docs-maintainers-development-md-36

- Summary: `npm run verify` runs the same standing lint phases, then adds `go test -race` before the standing Node test suite.
- Current labels: audience=developer; proof=deterministic; surface=none; readiness=ready-to-verify; evidence=unknown
- Source excerpt: `npm run verify` runs the same standing lint phases, then adds `go test -race` before the standing Node test suite.
- Suggested next action: Keep or add a repo-owned unit, lint, build, schema, or CI check for this claim.
- Human claim quality: TODO
- Human corrected audience: keep
- Human corrected semantic group: keep
- Human corrected proof: keep
- Human corrected eval surface: keep
- Human readiness: keep
- Human priority: TODO
- Human notes:
- Trace: 1 source ref; docs/maintainers/development.md:36

##### claim-docs-maintainers-development-md-38

- Summary: `npm run lint:specs` validates the spec index, checks relative spec links, and runs the full public spec suite with `specdown run -quiet`.
- Current labels: audience=developer; proof=deterministic; surface=none; readiness=ready-to-verify; evidence=unknown
- Source excerpt: `npm run lint:specs` validates the spec index, checks relative spec links, and runs the full public spec suite with `specdown run -quiet`.
- Suggested next action: Keep or add a repo-owned unit, lint, build, schema, or CI check for this claim.
- Human claim quality: TODO
- Human corrected audience: keep
- Human corrected semantic group: keep
- Human corrected proof: keep
- Human corrected eval surface: keep
- Human readiness: keep
- Human priority: TODO
- Human notes:
- Trace: 1 source ref; docs/maintainers/development.md:38

##### claim-docs-maintainers-development-md-85

- Summary: Do not push deterministic helper logic into an end-to-end smoke when a fixture-backed unit test can prove it more precisely.
- Current labels: audience=developer; proof=deterministic; surface=none; readiness=ready-to-verify; evidence=unknown
- Source excerpt: Do not push deterministic helper logic into an end-to-end smoke when a fixture-backed unit test can prove it more precisely.
- Suggested next action: Keep or add a repo-owned unit, lint, build, schema, or CI check for this claim.
- Human claim quality: TODO
- Human corrected audience: keep
- Human corrected semantic group: keep
- Human corrected proof: keep
- Human corrected eval surface: keep
- Human readiness: keep
- Human priority: TODO
- Human notes:
- Trace: 1 source ref; docs/maintainers/development.md:85

##### claim-docs-master-plan-md-79

- Summary: `npm run lint:specs` and `npm run lint:archetypes` still gate the runtime completeness of the surviving `scenario normalize` helpers; new user-facing copy must reconcile with the surface/preset contract before landing.
- Current labels: audience=developer; proof=deterministic; surface=none; readiness=ready-to-verify; evidence=unknown
- Source excerpt: `npm run lint:specs` and `npm run lint:archetypes` still gate the runtime completeness of the surviving `scenario normalize` helpers; new user-facing copy must reconcile with the surface/preset contract before landing.
- Suggested next action: Keep or add a repo-owned unit, lint, build, schema, or CI check for this claim.
- Human claim quality: TODO
- Human corrected audience: keep
- Human corrected semantic group: keep
- Human corrected proof: keep
- Human corrected eval surface: keep
- Human readiness: keep
- Human priority: TODO
- Human notes:
- Trace: 1 source ref; docs/master-plan.md:79

##### claim-docs-specs-command-surfaces-spec-md-210

- Summary: **How semantic should claim extraction be?** Start with deterministic source inventory and lightweight claim candidates that can be audited from file references.
- Current labels: audience=developer; proof=deterministic; surface=none; readiness=ready-to-verify; evidence=unknown
- Source excerpt: **How semantic should claim extraction be?** Start with deterministic source inventory and lightweight claim candidates that can be audited from file references.
- Suggested next action: Keep or add a repo-owned unit, lint, build, schema, or CI check for this claim.
- Human claim quality: TODO
- Human corrected audience: keep
- Human corrected semantic group: keep
- Human corrected proof: keep
- Human corrected eval surface: keep
- Human readiness: keep
- Human priority: TODO
- Human notes:
- Trace: 1 source ref; docs/specs/command-surfaces.spec.md:210

##### claim-docs-specs-command-surfaces-spec-md-254

- Summary: A proof plan can distinguish human-auditable, deterministic, eval-backed, scenario-candidate, and alignment-work claims.
- Current labels: audience=developer; proof=deterministic; surface=none; readiness=ready-to-verify; evidence=unknown
- Source excerpt: A proof plan can distinguish human-auditable, deterministic, eval-backed, scenario-candidate, and alignment-work claims.
- Suggested next action: Keep or add a repo-owned unit, lint, build, schema, or CI check for this claim.
- Human claim quality: TODO
- Human corrected audience: keep
- Human corrected semantic group: keep
- Human corrected proof: keep
- Human corrected eval surface: keep
- Human readiness: keep
- Human priority: TODO
- Human notes:
- Trace: 1 source ref; docs/specs/command-surfaces.spec.md:254

##### claim-docs-specs-command-surfaces-spec-md-27

- Summary: The implemented slice is intentionally deterministic: it inventories explicit truth surfaces and emits source-ref-backed proof-plan candidates.
- Current labels: audience=developer; proof=deterministic; surface=none; readiness=ready-to-verify; evidence=unknown
- Source excerpt: The implemented slice is intentionally deterministic: it inventories explicit truth surfaces and emits source-ref-backed proof-plan candidates.
- Suggested next action: Keep or add a repo-owned unit, lint, build, schema, or CI check for this claim.
- Human claim quality: TODO
- Human corrected audience: keep
- Human corrected semantic group: keep
- Human corrected proof: keep
- Human corrected eval surface: keep
- Human readiness: keep
- Human priority: TODO
- Human notes:
- Trace: 1 source ref; docs/specs/command-surfaces.spec.md:27

##### claim-docs-specs-command-surfaces-spec-md-274

- Summary: a CLI smoke test that discovers claims from a tiny temp repo with README, AGENTS.md, and one deterministic-test-like claim
- Current labels: audience=developer; proof=deterministic; surface=none; readiness=ready-to-verify; evidence=unknown
- Source excerpt: a CLI smoke test that discovers claims from a tiny temp repo with README, AGENTS.md, and one deterministic-test-like claim
- Suggested next action: Keep or add a repo-owned unit, lint, build, schema, or CI check for this claim.
- Human claim quality: TODO
- Human corrected audience: keep
- Human corrected semantic group: keep
- Human corrected proof: keep
- Human corrected eval surface: keep
- Human readiness: keep
- Human priority: TODO
- Human notes:
- Trace: 1 source ref; docs/specs/command-surfaces.spec.md:274

##### claim-docs-specs-command-surfaces-spec-md-284

- Summary: Countermeasure: `proofLayer` is required, and deterministic claims must point away from eval fixtures.
- Current labels: audience=developer; proof=deterministic; surface=none; readiness=ready-to-verify; evidence=unknown
- Source excerpt: Countermeasure: `proofLayer` is required, and deterministic claims must point away from eval fixtures.
- Suggested next action: Keep or add a repo-owned unit, lint, build, schema, or CI check for this claim.
- Human claim quality: TODO
- Human corrected audience: keep
- Human corrected semantic group: keep
- Human corrected proof: keep
- Human corrected eval surface: keep
- Human readiness: keep
- Human priority: TODO
- Human notes:
- Trace: 1 source ref; docs/specs/command-surfaces.spec.md:284

##### claim-docs-specs-evaluation-surfaces-spec-md-249

- Summary: Schema validates `surface=dev, preset=repo` only; C2/C3/C4 fields stub-error until their slices land.
- Current labels: audience=developer; proof=deterministic; surface=none; readiness=ready-to-verify; evidence=unknown
- Source excerpt: Schema validates `surface=dev, preset=repo` only; C2/C3/C4 fields stub-error until their slices land.
- Suggested next action: Keep or add a repo-owned unit, lint, build, schema, or CI check for this claim.
- Human claim quality: TODO
- Human corrected audience: keep
- Human corrected semantic group: keep
- Human corrected proof: keep
- Human corrected eval surface: keep
- Human readiness: keep
- Human priority: TODO
- Human notes:
- Trace: 1 source ref; docs/specs/evaluation-surfaces.spec.md:249

##### claim-docs-specs-index-spec-md-7

- Summary: `npm run lint:specs` validates the spec index, checks relative links, and runs the full suite.
- Current labels: audience=developer; proof=deterministic; surface=none; readiness=ready-to-verify; evidence=unknown
- Source excerpt: `npm run lint:specs` validates the spec index, checks relative links, and runs the full suite.
- Suggested next action: Keep or add a repo-owned unit, lint, build, schema, or CI check for this claim.
- Human claim quality: TODO
- Human corrected audience: keep
- Human corrected semantic group: keep
- Human corrected proof: keep
- Human corrected eval surface: keep
- Human readiness: keep
- Human priority: TODO
- Human notes:
- Trace: 1 source ref; docs/specs/index.spec.md:7

#### Human-auditable / ready-to-verify / evidence unknown (1)

##### claim-docs-contracts-claim-discovery-workflow-md-246

- Summary: `verificationReadiness=ready-to-verify` with `evidenceStatus=missing` means proof is absent but a test, fixture, or human-auditable check can now be created or run.
- Current labels: audience=developer; proof=human-auditable; surface=none; readiness=ready-to-verify; evidence=unknown
- Source excerpt: `verificationReadiness=ready-to-verify` with `evidenceStatus=missing` means proof is absent but a test, fixture, or human-auditable check can now be created or run.
- Suggested next action: Record the source reference and keep it human-auditable; add deterministic or eval proof only if behavior depends on execution.
- Human claim quality: TODO
- Human corrected audience: keep
- Human corrected semantic group: keep
- Human corrected proof: keep
- Human corrected eval surface: keep
- Human readiness: keep
- Human priority: TODO
- Human notes:
- Trace: 1 source ref; docs/contracts/claim-discovery-workflow.md:246

