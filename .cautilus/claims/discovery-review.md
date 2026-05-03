# Claim Discovery Review Worksheet

This worksheet is for human review of the deterministic Cautilus claim-discovery packet.
It is grouped by intended audience, semantic area, and verification shape instead of by source file.
Source excerpts are included for local judgment; source refs are trace data, not the primary grouping axis.

## Packet Summary

- Claims packet: .cautilus/claims/evidenced-typed-runners.json
- Git commit in packet: 00f3889efd94da3ecdfd9bd4698fdb491797306f
- Candidate count: 322
- Source count: 44
- User claims: 82
- Developer claims: 240

## How To Review

This is a batching worksheet, not a demand to finish all candidates in one pass.
For each reviewed item, decide whether it is a real product or developer claim, a duplicate, a fragment, or noise.
Use the correction fields to mark obvious relabeling without editing the JSON directly.
`ready-to-verify` means the claim is shaped enough to choose a proof path; it does not mean evidence already exists.
`evidence unknown` means this deterministic pass has not reconciled tests, eval packets, or human review evidence yet.
Semantic groups are batching hints, not final taxonomy.
Each correction line lists its allowed values as checkboxes; mark the selected box with `[x]`.

Only set an eval surface when the corrected proof is `cautilus-eval`; otherwise this field is not applicable.

## Recommended First Pass

1. No `Unclear Claims` are present in this packet.
2. Review `User Claims` next (82 items) because these are closest to product promises.
3. Spot-check `Developer Claims` last (240 items) to catch internal conventions that leaked into product promises.
Do not try to clear every claim in the first pass; mark duplicates, fragments, and obvious audience mistakes first.

## User Claims (82)

### Adapter and portability (16)

#### Cautilus eval / app/prompt / ready-to-verify / evidence unknown (1)

##### claim-docs-specs-user-evaluation-spec-md-14

- Summary: The host repo owns prompts, models, credentials, runners, and acceptance policy.
- Current labels: audience=user; proof=cautilus-eval; eval surface=app/prompt; readiness=ready-to-verify; evidence=unknown
- Suggested next action: Create a host-owned app/prompt fixture and run it through cautilus eval test.
- Human claim quality: [ ] keep [ ] merge [ ] split [ ] reword [ ] drop [ ] unsure
- Human corrected audience: [ ] keep [ ] user [ ] developer [ ] unclear
- Human corrected semantic group: [ ] keep [ ] Adapter and portability [ ] Agent and skill workflow [ ] Claim discovery and review [ ] Documentation and contracts [ ] Evaluation surfaces [ ] General product behavior [ ] Improvement and optimization [ ] Packets and reporting [ ] Quality gates [ ] Release and packaging [ ] other:
- Human corrected proof: [ ] keep [ ] human-auditable [ ] deterministic [ ] cautilus-eval
- Human corrected eval surface: [ ] keep [ ] dev/repo [ ] dev/skill [ ] app/chat [ ] app/prompt [ ] surface undecided
- Human readiness: [ ] keep [ ] ready-to-verify [ ] needs-scenario [ ] needs-alignment [ ] blocked
- Human priority: [ ] high [ ] medium [ ] low [ ] later [ ] unsure
- Human notes:
- Trace: 1 source ref; docs/specs/user/evaluation.spec.md:14

#### Cautilus eval / dev/repo / ready-to-verify / evidence unknown (1)

##### claim-docs-specs-user-ownership-spec-md-14

- Summary: The same product workflow can be reused across repos because repo-specific behavior lives in adapters and fixtures.
- Current labels: audience=user; proof=cautilus-eval; eval surface=dev/repo; readiness=ready-to-verify; evidence=unknown
- Suggested next action: Create a host-owned dev/repo fixture and run it through cautilus eval test.
- Human claim quality: [ ] keep [ ] merge [ ] split [ ] reword [ ] drop [ ] unsure
- Human corrected audience: [ ] keep [ ] user [ ] developer [ ] unclear
- Human corrected semantic group: [ ] keep [ ] Adapter and portability [ ] Agent and skill workflow [ ] Claim discovery and review [ ] Documentation and contracts [ ] Evaluation surfaces [ ] General product behavior [ ] Improvement and optimization [ ] Packets and reporting [ ] Quality gates [ ] Release and packaging [ ] other:
- Human corrected proof: [ ] keep [ ] human-auditable [ ] deterministic [ ] cautilus-eval
- Human corrected eval surface: [ ] keep [ ] dev/repo [ ] dev/skill [ ] app/chat [ ] app/prompt [ ] surface undecided
- Human readiness: [ ] keep [ ] ready-to-verify [ ] needs-scenario [ ] needs-alignment [ ] blocked
- Human priority: [ ] high [ ] medium [ ] low [ ] later [ ] unsure
- Human notes:
- Trace: 1 source ref; docs/specs/user/ownership.spec.md:14

#### Deterministic gate / ready-to-verify / evidence satisfied (9)

##### claim-docs-cli-reference-md-108

- Summary: It emits `cautilus.agent_status.v1`: a read-only orientation packet over binary health, local agent-surface readiness, adapter state, claim-state availability, scan scope, and branch choices.
- Current labels: audience=user; proof=deterministic; readiness=ready-to-verify; evidence=satisfied
- Suggested next action: Keep covered by agent-status command and packet-shape tests when orientation output changes.
- Human claim quality: [ ] keep [ ] merge [ ] split [ ] reword [ ] drop [ ] unsure
- Human corrected audience: [ ] keep [ ] user [ ] developer [ ] unclear
- Human corrected semantic group: [ ] keep [ ] Adapter and portability [ ] Agent and skill workflow [ ] Claim discovery and review [ ] Documentation and contracts [ ] Evaluation surfaces [ ] General product behavior [ ] Improvement and optimization [ ] Packets and reporting [ ] Quality gates [ ] Release and packaging [ ] other:
- Human corrected proof: [ ] keep [ ] human-auditable [ ] deterministic [ ] cautilus-eval
- Human readiness: [ ] keep [ ] ready-to-verify [ ] needs-scenario [ ] needs-alignment [ ] blocked
- Human priority: [ ] high [ ] medium [ ] low [ ] later [ ] unsure
- Human notes:
- Trace: 1 source ref; docs/cli-reference.md:108

##### claim-docs-cli-reference-md-114

- Summary: When a repo intentionally keeps only named adapters under `.agents/cautilus-adapters/`, run `cautilus doctor --repo-root /path/to/repo --adapter-name <name>` for repo-scope validation instead of expecting plain `doctor` to guess which named adapter you mean.
- Current labels: audience=user; proof=deterministic; readiness=ready-to-verify; evidence=satisfied
- Suggested next action: Keep covered by named-adapter doctor smoke when adapter resolution changes.
- Human claim quality: [ ] keep [ ] merge [ ] split [ ] reword [ ] drop [ ] unsure
- Human corrected audience: [ ] keep [ ] user [ ] developer [ ] unclear
- Human corrected semantic group: [ ] keep [ ] Adapter and portability [ ] Agent and skill workflow [ ] Claim discovery and review [ ] Documentation and contracts [ ] Evaluation surfaces [ ] General product behavior [ ] Improvement and optimization [ ] Packets and reporting [ ] Quality gates [ ] Release and packaging [ ] other:
- Human corrected proof: [ ] keep [ ] human-auditable [ ] deterministic [ ] cautilus-eval
- Human readiness: [ ] keep [ ] ready-to-verify [ ] needs-scenario [ ] needs-alignment [ ] blocked
- Human priority: [ ] high [ ] medium [ ] low [ ] later [ ] unsure
- Human notes:
- Trace: 1 source ref; docs/cli-reference.md:114

##### claim-docs-cli-reference-md-173

- Summary: An eval live instance is one live consumer target on this host that `Cautilus` can select by stable id.
- Current labels: audience=user; proof=deterministic; readiness=ready-to-verify; evidence=satisfied
- Suggested next action: Keep covered by eval-live command and CLI smoke tests when live instance discovery changes.
- Human claim quality: [ ] keep [ ] merge [ ] split [ ] reword [ ] drop [ ] unsure
- Human corrected audience: [ ] keep [ ] user [ ] developer [ ] unclear
- Human corrected semantic group: [ ] keep [ ] Adapter and portability [ ] Agent and skill workflow [ ] Claim discovery and review [ ] Documentation and contracts [ ] Evaluation surfaces [ ] General product behavior [ ] Improvement and optimization [ ] Packets and reporting [ ] Quality gates [ ] Release and packaging [ ] other:
- Human corrected proof: [ ] keep [ ] human-auditable [ ] deterministic [ ] cautilus-eval
- Human readiness: [ ] keep [ ] ready-to-verify [ ] needs-scenario [ ] needs-alignment [ ] blocked
- Human priority: [ ] high [ ] medium [ ] low [ ] later [ ] unsure
- Human notes:
- Trace: 1 source ref; docs/cli-reference.md:173

##### claim-docs-cli-reference-md-185

- Summary: When the public scenario uses `simulator.kind: persona_prompt`, the adapter additionally provides `simulator_persona_command_template`, which normally calls `cautilus eval live run-simulator-persona` with repo-specific backend flags.
- Current labels: audience=user; proof=deterministic; readiness=ready-to-verify; evidence=satisfied
- Suggested next action: Keep covered by eval-live persona command tests when simulator persona dispatch changes.
- Human claim quality: [ ] keep [ ] merge [ ] split [ ] reword [ ] drop [ ] unsure
- Human corrected audience: [ ] keep [ ] user [ ] developer [ ] unclear
- Human corrected semantic group: [ ] keep [ ] Adapter and portability [ ] Agent and skill workflow [ ] Claim discovery and review [ ] Documentation and contracts [ ] Evaluation surfaces [ ] General product behavior [ ] Improvement and optimization [ ] Packets and reporting [ ] Quality gates [ ] Release and packaging [ ] other:
- Human corrected proof: [ ] keep [ ] human-auditable [ ] deterministic [ ] cautilus-eval
- Human readiness: [ ] keep [ ] ready-to-verify [ ] needs-scenario [ ] needs-alignment [ ] blocked
- Human priority: [ ] high [ ] medium [ ] low [ ] later [ ] unsure
- Human notes:
- Trace: 1 source ref; docs/cli-reference.md:185

##### claim-docs-cli-reference-md-266

- Summary: `cautilus eval test` runs a checked-in fixture through an adapter-owned runner and then evaluates the observed packet.
- Current labels: audience=user; proof=deterministic; readiness=ready-to-verify; evidence=satisfied
- Suggested next action: Keep covered by eval-test dogfood when adapter-owned runner behavior changes.
- Human claim quality: [ ] keep [ ] merge [ ] split [ ] reword [ ] drop [ ] unsure
- Human corrected audience: [ ] keep [ ] user [ ] developer [ ] unclear
- Human corrected semantic group: [ ] keep [ ] Adapter and portability [ ] Agent and skill workflow [ ] Claim discovery and review [ ] Documentation and contracts [ ] Evaluation surfaces [ ] General product behavior [ ] Improvement and optimization [ ] Packets and reporting [ ] Quality gates [ ] Release and packaging [ ] other:
- Human corrected proof: [ ] keep [ ] human-auditable [ ] deterministic [ ] cautilus-eval
- Human readiness: [ ] keep [ ] ready-to-verify [ ] needs-scenario [ ] needs-alignment [ ] blocked
- Human priority: [ ] high [ ] medium [ ] low [ ] later [ ] unsure
- Human notes:
- Trace: 1 source ref; docs/cli-reference.md:266

##### claim-docs-guides-consumer-adoption-md-25

- Summary: `cautilus --version` must work on `PATH` before any consumer adapter or skill wiring is treated as valid.
- Current labels: audience=user; proof=deterministic; readiness=ready-to-verify; evidence=satisfied
- Suggested next action: Keep covered by install/version smoke when binary discovery changes.
- Human claim quality: [ ] keep [ ] merge [ ] split [ ] reword [ ] drop [ ] unsure
- Human corrected audience: [ ] keep [ ] user [ ] developer [ ] unclear
- Human corrected semantic group: [ ] keep [ ] Adapter and portability [ ] Agent and skill workflow [ ] Claim discovery and review [ ] Documentation and contracts [ ] Evaluation surfaces [ ] General product behavior [ ] Improvement and optimization [ ] Packets and reporting [ ] Quality gates [ ] Release and packaging [ ] other:
- Human corrected proof: [ ] keep [ ] human-auditable [ ] deterministic [ ] cautilus-eval
- Human readiness: [ ] keep [ ] ready-to-verify [ ] needs-scenario [ ] needs-alignment [ ] blocked
- Human priority: [ ] high [ ] medium [ ] low [ ] later [ ] unsure
- Human notes:
- Trace: 1 source ref; docs/guides/consumer-adoption.md:25

##### claim-docs-guides-consumer-adoption-md-49

- Summary: If the repo intentionally keeps only named adapters under `.agents/cautilus-adapters/`, use `cautilus doctor --adapter-name <name>` for repo-scope validation.
- Current labels: audience=user; proof=deterministic; readiness=ready-to-verify; evidence=satisfied
- Suggested next action: Keep covered by named-adapter doctor smoke when consumer adapter layouts change.
- Human claim quality: [ ] keep [ ] merge [ ] split [ ] reword [ ] drop [ ] unsure
- Human corrected audience: [ ] keep [ ] user [ ] developer [ ] unclear
- Human corrected semantic group: [ ] keep [ ] Adapter and portability [ ] Agent and skill workflow [ ] Claim discovery and review [ ] Documentation and contracts [ ] Evaluation surfaces [ ] General product behavior [ ] Improvement and optimization [ ] Packets and reporting [ ] Quality gates [ ] Release and packaging [ ] other:
- Human corrected proof: [ ] keep [ ] human-auditable [ ] deterministic [ ] cautilus-eval
- Human readiness: [ ] keep [ ] ready-to-verify [ ] needs-scenario [ ] needs-alignment [ ] blocked
- Human priority: [ ] high [ ] medium [ ] low [ ] later [ ] unsure
- Human notes:
- Trace: 1 source ref; docs/guides/consumer-adoption.md:49

##### claim-readme-md-13

- Summary: They stay checked into each host repo so evaluation behavior remains reproducible, reviewable, and owned by the repo that declares it.
- Current labels: audience=user; proof=deterministic; readiness=ready-to-verify; evidence=satisfied
- Suggested next action: Keep host-owned checked-in skill materialization covered by install smoke and packaged skill sync tests.
- Human claim quality: [ ] keep [ ] merge [ ] split [ ] reword [ ] drop [ ] unsure
- Human corrected audience: [ ] keep [ ] user [ ] developer [ ] unclear
- Human corrected semantic group: [ ] keep [ ] Adapter and portability [ ] Agent and skill workflow [ ] Claim discovery and review [ ] Documentation and contracts [ ] Evaluation surfaces [ ] General product behavior [ ] Improvement and optimization [ ] Packets and reporting [ ] Quality gates [ ] Release and packaging [ ] other:
- Human corrected proof: [ ] keep [ ] human-auditable [ ] deterministic [ ] cautilus-eval
- Human readiness: [ ] keep [ ] ready-to-verify [ ] needs-scenario [ ] needs-alignment [ ] blocked
- Human priority: [ ] high [ ] medium [ ] low [ ] later [ ] unsure
- Human notes:
- Trace: 1 source ref; README.md:13

##### claim-readme-md-7

- Summary: Ships as a standalone binary plus a bundled skill a host repo can install without copying another scaffold first.
- Current labels: audience=user; proof=deterministic; readiness=ready-to-verify; evidence=satisfied
- Suggested next action: Keep this claim covered by distribution-surface tests plus install command smoke whenever install.sh, packaged plugins, or bundled skill materialization changes.
- Human claim quality: [ ] keep [ ] merge [ ] split [ ] reword [ ] drop [ ] unsure
- Human corrected audience: [ ] keep [ ] user [ ] developer [ ] unclear
- Human corrected semantic group: [ ] keep [ ] Adapter and portability [ ] Agent and skill workflow [ ] Claim discovery and review [ ] Documentation and contracts [ ] Evaluation surfaces [ ] General product behavior [ ] Improvement and optimization [ ] Packets and reporting [ ] Quality gates [ ] Release and packaging [ ] other:
- Human corrected proof: [ ] keep [ ] human-auditable [ ] deterministic [ ] cautilus-eval
- Human readiness: [ ] keep [ ] ready-to-verify [ ] needs-scenario [ ] needs-alignment [ ] blocked
- Human priority: [ ] high [ ] medium [ ] low [ ] later [ ] unsure
- Human notes:
- Trace: 1 source ref; README.md:7

#### Deterministic gate / ready-to-verify / evidence unknown (2)

##### claim-docs-specs-user-claim-discovery-spec-md-14

- Summary: The bundled skill can use the claim packet to group next work: review wording, add deterministic proof, plan Cautilus evals, align docs and adapters, or defer broad claims.
- Current labels: audience=user; proof=deterministic; readiness=ready-to-verify; evidence=unknown
- Suggested next action: Keep or add a repo-owned unit, lint, build, schema, or CI check for this claim.
- Human claim quality: [ ] keep [ ] merge [ ] split [ ] reword [ ] drop [ ] unsure
- Human corrected audience: [ ] keep [ ] user [ ] developer [ ] unclear
- Human corrected semantic group: [ ] keep [ ] Adapter and portability [ ] Agent and skill workflow [ ] Claim discovery and review [ ] Documentation and contracts [ ] Evaluation surfaces [ ] General product behavior [ ] Improvement and optimization [ ] Packets and reporting [ ] Quality gates [ ] Release and packaging [ ] other:
- Human corrected proof: [ ] keep [ ] human-auditable [ ] deterministic [ ] cautilus-eval
- Human readiness: [ ] keep [ ] ready-to-verify [ ] needs-scenario [ ] needs-alignment [ ] blocked
- Human priority: [ ] high [ ] medium [ ] low [ ] later [ ] unsure
- Human notes:
- Trace: 1 source ref; docs/specs/user/claim-discovery.spec.md:14

##### claim-readme-md-156

- Summary: When the goal is only to prove command routing and packet evaluation, `cautilus eval test --runtime fixture` can run the same product path with adapter-owned fixture results instead of launching a nested model eval.
- Current labels: audience=user; proof=deterministic; readiness=ready-to-verify; evidence=unknown
- Suggested next action: Keep or add a repo-owned unit, lint, build, schema, or CI check for this claim.
- Human claim quality: [ ] keep [ ] merge [ ] split [ ] reword [ ] drop [ ] unsure
- Human corrected audience: [ ] keep [ ] user [ ] developer [ ] unclear
- Human corrected semantic group: [ ] keep [ ] Adapter and portability [ ] Agent and skill workflow [ ] Claim discovery and review [ ] Documentation and contracts [ ] Evaluation surfaces [ ] General product behavior [ ] Improvement and optimization [ ] Packets and reporting [ ] Quality gates [ ] Release and packaging [ ] other:
- Human corrected proof: [ ] keep [ ] human-auditable [ ] deterministic [ ] cautilus-eval
- Human readiness: [ ] keep [ ] ready-to-verify [ ] needs-scenario [ ] needs-alignment [ ] blocked
- Human priority: [ ] high [ ] medium [ ] low [ ] later [ ] unsure
- Human notes:
- Trace: 1 source ref; README.md:156

#### Human-auditable / needs-alignment / evidence unknown (3)

##### claim-docs-cli-reference-md-186

- Summary: That keeps persona prompt shaping and result semantics product-owned while backend selection stays adapter-owned.
- Current labels: audience=user; proof=human-auditable; readiness=needs-alignment; evidence=unknown
- Suggested next action: Link this to adapter-contract tests or split it into concrete claims about adapter-owned backend selection and product-owned prompt/result semantics.
- Human claim quality: [ ] keep [ ] merge [ ] split [ ] reword [ ] drop [ ] unsure
- Human corrected audience: [ ] keep [ ] user [ ] developer [ ] unclear
- Human corrected semantic group: [ ] keep [ ] Adapter and portability [ ] Agent and skill workflow [ ] Claim discovery and review [ ] Documentation and contracts [ ] Evaluation surfaces [ ] General product behavior [ ] Improvement and optimization [ ] Packets and reporting [ ] Quality gates [ ] Release and packaging [ ] other:
- Human corrected proof: [ ] keep [ ] human-auditable [ ] deterministic [ ] cautilus-eval
- Human readiness: [ ] keep [ ] ready-to-verify [ ] needs-scenario [ ] needs-alignment [ ] blocked
- Human priority: [ ] high [ ] medium [ ] low [ ] later [ ] unsure
- Human notes:
- Trace: 1 source ref; docs/cli-reference.md:186

##### claim-docs-guides-evaluation-process-md-10

- Summary: That seam owns the checked-in case suite, adapter-runner invocation, and chained summary artifacts before the flow returns to packet-level `cautilus eval evaluate` and proposal normalization.
- Current labels: audience=user; proof=human-auditable; readiness=needs-alignment; evidence=unknown
- Suggested next action: Link this claim to the matching adapter contract, eval test implementation, and packet-level evaluate/proposal-normalization tests before marking it satisfied.
- Human claim quality: [ ] keep [ ] merge [ ] split [ ] reword [ ] drop [ ] unsure
- Human corrected audience: [ ] keep [ ] user [ ] developer [ ] unclear
- Human corrected semantic group: [ ] keep [ ] Adapter and portability [ ] Agent and skill workflow [ ] Claim discovery and review [ ] Documentation and contracts [ ] Evaluation surfaces [ ] General product behavior [ ] Improvement and optimization [ ] Packets and reporting [ ] Quality gates [ ] Release and packaging [ ] other:
- Human corrected proof: [ ] keep [ ] human-auditable [ ] deterministic [ ] cautilus-eval
- Human readiness: [ ] keep [ ] ready-to-verify [ ] needs-scenario [ ] needs-alignment [ ] blocked
- Human priority: [ ] high [ ] medium [ ] low [ ] later [ ] unsure
- Human notes:
- Trace: 1 source ref; docs/guides/evaluation-process.md:10

##### claim-docs-specs-user-ownership-spec-md-3

- Summary: Cautilus owns the common evaluation workflow; the host repo owns the behavior being evaluated.
- Current labels: audience=user; proof=human-auditable; readiness=needs-alignment; evidence=unknown
- Suggested next action: Reconcile or cite the matching adapter, CLI, docs, and test surfaces before treating this as satisfied.
- Human claim quality: [ ] keep [ ] merge [ ] split [ ] reword [ ] drop [ ] unsure
- Human corrected audience: [ ] keep [ ] user [ ] developer [ ] unclear
- Human corrected semantic group: [ ] keep [ ] Adapter and portability [ ] Agent and skill workflow [ ] Claim discovery and review [ ] Documentation and contracts [ ] Evaluation surfaces [ ] General product behavior [ ] Improvement and optimization [ ] Packets and reporting [ ] Quality gates [ ] Release and packaging [ ] other:
- Human corrected proof: [ ] keep [ ] human-auditable [ ] deterministic [ ] cautilus-eval
- Human readiness: [ ] keep [ ] ready-to-verify [ ] needs-scenario [ ] needs-alignment [ ] blocked
- Human priority: [ ] high [ ] medium [ ] low [ ] later [ ] unsure
- Human notes:
- Trace: 1 source ref; docs/specs/user/ownership.spec.md:3

### Agent and skill workflow (20)

#### Cautilus eval / dev/repo / ready-to-verify / evidence unknown (1)

##### claim-docs-specs-user-reviewable-artifacts-spec-md-7

- Summary: Cautilus leaves evidence that another person or agent can reopen instead of relying on terminal scrollback or memory.
- Current labels: audience=user; proof=cautilus-eval; eval surface=dev/repo; readiness=ready-to-verify; evidence=unknown
- Suggested next action: Create a host-owned dev/repo fixture and run it through cautilus eval test.
- Human claim quality: [ ] keep [ ] merge [ ] split [ ] reword [ ] drop [ ] unsure
- Human corrected audience: [ ] keep [ ] user [ ] developer [ ] unclear
- Human corrected semantic group: [ ] keep [ ] Adapter and portability [ ] Agent and skill workflow [ ] Claim discovery and review [ ] Documentation and contracts [ ] Evaluation surfaces [ ] General product behavior [ ] Improvement and optimization [ ] Packets and reporting [ ] Quality gates [ ] Release and packaging [ ] other:
- Human corrected proof: [ ] keep [ ] human-auditable [ ] deterministic [ ] cautilus-eval
- Human corrected eval surface: [ ] keep [ ] dev/repo [ ] dev/skill [ ] app/chat [ ] app/prompt [ ] surface undecided
- Human readiness: [ ] keep [ ] ready-to-verify [ ] needs-scenario [ ] needs-alignment [ ] blocked
- Human priority: [ ] high [ ] medium [ ] low [ ] later [ ] unsure
- Human notes:
- Trace: 1 source ref; docs/specs/user/reviewable-artifacts.spec.md:7

#### Cautilus eval / dev/skill / ready-to-verify / evidence satisfied (1)

##### claim-readme-md-144

- Summary: CLI: `cautilus scenario normalize chatbot --input logs.json` For agent: "Run a chatbot regression with these logs and my new system prompt." You get reopenable `proposals.json` candidates that can be kept out of tuning as protected checks.
- Current labels: audience=user; proof=cautilus-eval; eval surface=dev/skill; readiness=ready-to-verify; evidence=satisfied
- Suggested next action: Keep this claim covered by rerunning self-dogfood-eval-skill when bundled skill routing, eval skill fixtures, install behavior, or static skill validation changes.
- Human claim quality: [ ] keep [ ] merge [ ] split [ ] reword [ ] drop [ ] unsure
- Human corrected audience: [ ] keep [ ] user [ ] developer [ ] unclear
- Human corrected semantic group: [ ] keep [ ] Adapter and portability [ ] Agent and skill workflow [ ] Claim discovery and review [ ] Documentation and contracts [ ] Evaluation surfaces [ ] General product behavior [ ] Improvement and optimization [ ] Packets and reporting [ ] Quality gates [ ] Release and packaging [ ] other:
- Human corrected proof: [ ] keep [ ] human-auditable [ ] deterministic [ ] cautilus-eval
- Human corrected eval surface: [ ] keep [ ] dev/repo [ ] dev/skill [ ] app/chat [ ] app/prompt [ ] surface undecided
- Human readiness: [ ] keep [ ] ready-to-verify [ ] needs-scenario [ ] needs-alignment [ ] blocked
- Human priority: [ ] high [ ] medium [ ] low [ ] later [ ] unsure
- Human notes:
- Trace: 1 source ref; README.md:144

#### Cautilus eval / dev/skill / ready-to-verify / evidence unknown (5)

##### claim-docs-specs-user-claim-discovery-spec-md-21

- Summary: Deeper proof should be added by linking a fresh claim packet, a reviewed status summary, and at least one skill-driven review result.
- Current labels: audience=user; proof=cautilus-eval; eval surface=dev/skill; readiness=ready-to-verify; evidence=unknown
- Suggested next action: Create a host-owned dev/skill fixture and run it through cautilus eval test.
- Human claim quality: [ ] keep [ ] merge [ ] split [ ] reword [ ] drop [ ] unsure
- Human corrected audience: [ ] keep [ ] user [ ] developer [ ] unclear
- Human corrected semantic group: [ ] keep [ ] Adapter and portability [ ] Agent and skill workflow [ ] Claim discovery and review [ ] Documentation and contracts [ ] Evaluation surfaces [ ] General product behavior [ ] Improvement and optimization [ ] Packets and reporting [ ] Quality gates [ ] Release and packaging [ ] other:
- Human corrected proof: [ ] keep [ ] human-auditable [ ] deterministic [ ] cautilus-eval
- Human corrected eval surface: [ ] keep [ ] dev/repo [ ] dev/skill [ ] app/chat [ ] app/prompt [ ] surface undecided
- Human readiness: [ ] keep [ ] ready-to-verify [ ] needs-scenario [ ] needs-alignment [ ] blocked
- Human priority: [ ] high [ ] medium [ ] low [ ] later [ ] unsure
- Human notes:
- Trace: 1 source ref; docs/specs/user/claim-discovery.spec.md:21

##### claim-docs-specs-user-doctor-readiness-spec-md-12

- Summary: Agent status should share the same readiness facts when an agent is driving the workflow.
- Current labels: audience=user; proof=cautilus-eval; eval surface=dev/skill; readiness=ready-to-verify; evidence=unknown
- Suggested next action: Create a host-owned dev/skill fixture and run it through cautilus eval test.
- Human claim quality: [ ] keep [ ] merge [ ] split [ ] reword [ ] drop [ ] unsure
- Human corrected audience: [ ] keep [ ] user [ ] developer [ ] unclear
- Human corrected semantic group: [ ] keep [ ] Adapter and portability [ ] Agent and skill workflow [ ] Claim discovery and review [ ] Documentation and contracts [ ] Evaluation surfaces [ ] General product behavior [ ] Improvement and optimization [ ] Packets and reporting [ ] Quality gates [ ] Release and packaging [ ] other:
- Human corrected proof: [ ] keep [ ] human-auditable [ ] deterministic [ ] cautilus-eval
- Human corrected eval surface: [ ] keep [ ] dev/repo [ ] dev/skill [ ] app/chat [ ] app/prompt [ ] surface undecided
- Human readiness: [ ] keep [ ] ready-to-verify [ ] needs-scenario [ ] needs-alignment [ ] blocked
- Human priority: [ ] high [ ] medium [ ] low [ ] later [ ] unsure
- Human notes:
- Trace: 1 source ref; docs/specs/user/doctor-readiness.spec.md:12

##### claim-docs-specs-user-evaluation-spec-md-11

- Summary: Cautilus supports development-facing behavior, such as agent workflows, repo contracts, tools, and skills.
- Current labels: audience=user; proof=cautilus-eval; eval surface=dev/skill; readiness=ready-to-verify; evidence=unknown
- Suggested next action: Create a host-owned dev/skill fixture and run it through cautilus eval test.
- Human claim quality: [ ] keep [ ] merge [ ] split [ ] reword [ ] drop [ ] unsure
- Human corrected audience: [ ] keep [ ] user [ ] developer [ ] unclear
- Human corrected semantic group: [ ] keep [ ] Adapter and portability [ ] Agent and skill workflow [ ] Claim discovery and review [ ] Documentation and contracts [ ] Evaluation surfaces [ ] General product behavior [ ] Improvement and optimization [ ] Packets and reporting [ ] Quality gates [ ] Release and packaging [ ] other:
- Human corrected proof: [ ] keep [ ] human-auditable [ ] deterministic [ ] cautilus-eval
- Human corrected eval surface: [ ] keep [ ] dev/repo [ ] dev/skill [ ] app/chat [ ] app/prompt [ ] surface undecided
- Human readiness: [ ] keep [ ] ready-to-verify [ ] needs-scenario [ ] needs-alignment [ ] blocked
- Human priority: [ ] high [ ] medium [ ] low [ ] later [ ] unsure
- Human notes:
- Trace: 1 source ref; docs/specs/user/evaluation.spec.md:11

##### claim-readme-md-151

- Summary: Use when you change a skill or agent and want to know whether it still triggers on the right prompts, executes cleanly, and keeps its static validation passing.
- Current labels: audience=user; proof=cautilus-eval; eval surface=dev/skill; readiness=ready-to-verify; evidence=unknown
- Suggested next action: Create a host-owned dev/skill fixture and run it through cautilus eval test.
- Human claim quality: [ ] keep [ ] merge [ ] split [ ] reword [ ] drop [ ] unsure
- Human corrected audience: [ ] keep [ ] user [ ] developer [ ] unclear
- Human corrected semantic group: [ ] keep [ ] Adapter and portability [ ] Agent and skill workflow [ ] Claim discovery and review [ ] Documentation and contracts [ ] Evaluation surfaces [ ] General product behavior [ ] Improvement and optimization [ ] Packets and reporting [ ] Quality gates [ ] Release and packaging [ ] other:
- Human corrected proof: [ ] keep [ ] human-auditable [ ] deterministic [ ] cautilus-eval
- Human corrected eval surface: [ ] keep [ ] dev/repo [ ] dev/skill [ ] app/chat [ ] app/prompt [ ] surface undecided
- Human readiness: [ ] keep [ ] ready-to-verify [ ] needs-scenario [ ] needs-alignment [ ] blocked
- Human priority: [ ] high [ ] medium [ ] low [ ] later [ ] unsure
- Human notes:
- Trace: 1 source ref; README.md:151

##### claim-readme-md-218

- Summary: Agent track — Claude / Codex plugin.** The `cautilus install` step also lands a bundled skill at `.agents/skills/cautilus/` with Claude and Codex plugin manifests, so an in-editor agent can drive the same contracts conversationally.
- Current labels: audience=user; proof=cautilus-eval; eval surface=dev/skill; readiness=ready-to-verify; evidence=unknown
- Suggested next action: Create or use a dev/skill fixture that proves the installed skill can drive the named workflow.
- Human claim quality: [ ] keep [ ] merge [ ] split [ ] reword [ ] drop [ ] unsure
- Human corrected audience: [ ] keep [ ] user [ ] developer [ ] unclear
- Human corrected semantic group: [ ] keep [ ] Adapter and portability [ ] Agent and skill workflow [ ] Claim discovery and review [ ] Documentation and contracts [ ] Evaluation surfaces [ ] General product behavior [ ] Improvement and optimization [ ] Packets and reporting [ ] Quality gates [ ] Release and packaging [ ] other:
- Human corrected proof: [ ] keep [ ] human-auditable [ ] deterministic [ ] cautilus-eval
- Human corrected eval surface: [ ] keep [ ] dev/repo [ ] dev/skill [ ] app/chat [ ] app/prompt [ ] surface undecided
- Human readiness: [ ] keep [ ] ready-to-verify [ ] needs-scenario [ ] needs-alignment [ ] blocked
- Human priority: [ ] high [ ] medium [ ] low [ ] later [ ] unsure
- Human notes:
- Trace: 1 source ref; README.md:218

#### Deterministic gate / ready-to-verify / evidence satisfied (4)

##### claim-docs-cli-reference-md-505

- Summary: Shipped runtime entrypoints such as `cautilus eval live discover` and `cautilus eval live run` are Go-owned now and should be called through the CLI instead of direct `node scripts/agent-runtime/...` paths.
- Current labels: audience=user; proof=deterministic; readiness=ready-to-verify; evidence=satisfied
- Suggested next action: Keep covered by command discovery/help and CLI smoke when eval-live entrypoints move.
- Human claim quality: [ ] keep [ ] merge [ ] split [ ] reword [ ] drop [ ] unsure
- Human corrected audience: [ ] keep [ ] user [ ] developer [ ] unclear
- Human corrected semantic group: [ ] keep [ ] Adapter and portability [ ] Agent and skill workflow [ ] Claim discovery and review [ ] Documentation and contracts [ ] Evaluation surfaces [ ] General product behavior [ ] Improvement and optimization [ ] Packets and reporting [ ] Quality gates [ ] Release and packaging [ ] other:
- Human corrected proof: [ ] keep [ ] human-auditable [ ] deterministic [ ] cautilus-eval
- Human readiness: [ ] keep [ ] ready-to-verify [ ] needs-scenario [ ] needs-alignment [ ] blocked
- Human priority: [ ] high [ ] medium [ ] low [ ] later [ ] unsure
- Human notes:
- Trace: 1 source ref; docs/cli-reference.md:505

##### claim-docs-guides-evaluation-process-md-253

- Summary: When repeated workflow failures should become durable scenario coverage, prefer the checked-in `skill` normalization helper over repo-local one-off shapers:
- Current labels: audience=user; proof=deterministic; readiness=ready-to-verify; evidence=satisfied
- Suggested next action: Keep covered by scenario-normalize skill examples and schema tests when normalization helper behavior changes.
- Human claim quality: [ ] keep [ ] merge [ ] split [ ] reword [ ] drop [ ] unsure
- Human corrected audience: [ ] keep [ ] user [ ] developer [ ] unclear
- Human corrected semantic group: [ ] keep [ ] Adapter and portability [ ] Agent and skill workflow [ ] Claim discovery and review [ ] Documentation and contracts [ ] Evaluation surfaces [ ] General product behavior [ ] Improvement and optimization [ ] Packets and reporting [ ] Quality gates [ ] Release and packaging [ ] other:
- Human corrected proof: [ ] keep [ ] human-auditable [ ] deterministic [ ] cautilus-eval
- Human readiness: [ ] keep [ ] ready-to-verify [ ] needs-scenario [ ] needs-alignment [ ] blocked
- Human priority: [ ] high [ ] medium [ ] low [ ] later [ ] unsure
- Human notes:
- Trace: 1 source ref; docs/guides/evaluation-process.md:253

##### claim-readme-md-10

- Summary: `Cautilus` installs as a machine-level binary, but its agent-facing surface is intentionally repo-local.
- Current labels: audience=user; proof=deterministic; readiness=ready-to-verify; evidence=satisfied
- Suggested next action: Keep binary-install and repo-local skill-install proof together when changing install.sh, update, or `cautilus install`.
- Human claim quality: [ ] keep [ ] merge [ ] split [ ] reword [ ] drop [ ] unsure
- Human corrected audience: [ ] keep [ ] user [ ] developer [ ] unclear
- Human corrected semantic group: [ ] keep [ ] Adapter and portability [ ] Agent and skill workflow [ ] Claim discovery and review [ ] Documentation and contracts [ ] Evaluation surfaces [ ] General product behavior [ ] Improvement and optimization [ ] Packets and reporting [ ] Quality gates [ ] Release and packaging [ ] other:
- Human corrected proof: [ ] keep [ ] human-auditable [ ] deterministic [ ] cautilus-eval
- Human readiness: [ ] keep [ ] ready-to-verify [ ] needs-scenario [ ] needs-alignment [ ] blocked
- Human priority: [ ] high [ ] medium [ ] low [ ] later [ ] unsure
- Human notes:
- Trace: 1 source ref; README.md:10

##### claim-readme-md-9

- Summary: Commands should emit durable packets with enough state for the next agent to resume, not only terminal prose for a human operator.
- Current labels: audience=user; proof=deterministic; readiness=ready-to-verify; evidence=satisfied
- Suggested next action: Keep this claim covered by command packet tests and representative packet smoke when adding or changing agent-resume command surfaces.
- Human claim quality: [ ] keep [ ] merge [ ] split [ ] reword [ ] drop [ ] unsure
- Human corrected audience: [ ] keep [ ] user [ ] developer [ ] unclear
- Human corrected semantic group: [ ] keep [ ] Adapter and portability [ ] Agent and skill workflow [ ] Claim discovery and review [ ] Documentation and contracts [ ] Evaluation surfaces [ ] General product behavior [ ] Improvement and optimization [ ] Packets and reporting [ ] Quality gates [ ] Release and packaging [ ] other:
- Human corrected proof: [ ] keep [ ] human-auditable [ ] deterministic [ ] cautilus-eval
- Human readiness: [ ] keep [ ] ready-to-verify [ ] needs-scenario [ ] needs-alignment [ ] blocked
- Human priority: [ ] high [ ] medium [ ] low [ ] later [ ] unsure
- Human notes:
- Trace: 1 source ref; README.md:9

#### Deterministic gate / ready-to-verify / evidence unknown (2)

##### claim-readme-md-101

- Summary: Next step: a human decides whether to promote the scenario into a protected evaluation path, while an agent can reopen the saved result, compare variants, or feed it into the next bounded step.
- Current labels: audience=user; proof=deterministic; readiness=ready-to-verify; evidence=unknown
- Suggested next action: Keep or add deterministic scenario command, packet, or render proof for this claim.
- Human claim quality: [ ] keep [ ] merge [ ] split [ ] reword [ ] drop [ ] unsure
- Human corrected audience: [ ] keep [ ] user [ ] developer [ ] unclear
- Human corrected semantic group: [ ] keep [ ] Adapter and portability [ ] Agent and skill workflow [ ] Claim discovery and review [ ] Documentation and contracts [ ] Evaluation surfaces [ ] General product behavior [ ] Improvement and optimization [ ] Packets and reporting [ ] Quality gates [ ] Release and packaging [ ] other:
- Human corrected proof: [ ] keep [ ] human-auditable [ ] deterministic [ ] cautilus-eval
- Human readiness: [ ] keep [ ] ready-to-verify [ ] needs-scenario [ ] needs-alignment [ ] blocked
- Human priority: [ ] high [ ] medium [ ] low [ ] later [ ] unsure
- Human notes:
- Trace: 1 source ref; README.md:101

##### claim-readme-md-238

- Summary: machine-readable eval, report, review, evidence, and optimization packets that agents can consume directly
- Current labels: audience=user; proof=deterministic; readiness=ready-to-verify; evidence=unknown
- Suggested next action: Keep or add deterministic packet schema, command-output, or golden-file proof for this claim.
- Human claim quality: [ ] keep [ ] merge [ ] split [ ] reword [ ] drop [ ] unsure
- Human corrected audience: [ ] keep [ ] user [ ] developer [ ] unclear
- Human corrected semantic group: [ ] keep [ ] Adapter and portability [ ] Agent and skill workflow [ ] Claim discovery and review [ ] Documentation and contracts [ ] Evaluation surfaces [ ] General product behavior [ ] Improvement and optimization [ ] Packets and reporting [ ] Quality gates [ ] Release and packaging [ ] other:
- Human corrected proof: [ ] keep [ ] human-auditable [ ] deterministic [ ] cautilus-eval
- Human readiness: [ ] keep [ ] ready-to-verify [ ] needs-scenario [ ] needs-alignment [ ] blocked
- Human priority: [ ] high [ ] medium [ ] low [ ] later [ ] unsure
- Human notes:
- Trace: 1 source ref; README.md:238

#### Human-auditable / blocked / evidence unknown (6)

##### claim-docs-guides-evaluation-process-md-304

- Summary: Past sessions showed `codex exec` can emit fatal skill-loading errors on stderr while the final process exit still looks successful.
- Current labels: audience=user; proof=human-auditable; readiness=blocked; evidence=unknown
- Suggested next action: Promote to a concrete dev/skill regression scenario only if fatal skill-loading stderr with successful final exit must be release-protected.
- Human claim quality: [ ] keep [ ] merge [ ] split [ ] reword [ ] drop [ ] unsure
- Human corrected audience: [ ] keep [ ] user [ ] developer [ ] unclear
- Human corrected semantic group: [ ] keep [ ] Adapter and portability [ ] Agent and skill workflow [ ] Claim discovery and review [ ] Documentation and contracts [ ] Evaluation surfaces [ ] General product behavior [ ] Improvement and optimization [ ] Packets and reporting [ ] Quality gates [ ] Release and packaging [ ] other:
- Human corrected proof: [ ] keep [ ] human-auditable [ ] deterministic [ ] cautilus-eval
- Human readiness: [ ] keep [ ] ready-to-verify [ ] needs-scenario [ ] needs-alignment [ ] blocked
- Human priority: [ ] high [ ] medium [ ] low [ ] later [ ] unsure
- Human notes:
- Trace: 1 source ref; docs/guides/evaluation-process.md:304

##### claim-docs-guides-evaluation-process-md-308

- Summary: Past sessions showed that overly aggressive effort overrides can conflict with tool surfaces that the prompt or skill still needs.
- Current labels: audience=user; proof=human-auditable; readiness=blocked; evidence=unknown
- Suggested next action: Promote to a concrete dev/skill regression scenario if effort override/tool-surface conflict should be release-protected.
- Human claim quality: [ ] keep [ ] merge [ ] split [ ] reword [ ] drop [ ] unsure
- Human corrected audience: [ ] keep [ ] user [ ] developer [ ] unclear
- Human corrected semantic group: [ ] keep [ ] Adapter and portability [ ] Agent and skill workflow [ ] Claim discovery and review [ ] Documentation and contracts [ ] Evaluation surfaces [ ] General product behavior [ ] Improvement and optimization [ ] Packets and reporting [ ] Quality gates [ ] Release and packaging [ ] other:
- Human corrected proof: [ ] keep [ ] human-auditable [ ] deterministic [ ] cautilus-eval
- Human readiness: [ ] keep [ ] ready-to-verify [ ] needs-scenario [ ] needs-alignment [ ] blocked
- Human priority: [ ] high [ ] medium [ ] low [ ] later [ ] unsure
- Human notes:
- Trace: 1 source ref; docs/guides/evaluation-process.md:308

##### claim-docs-guides-evaluation-process-md-320

- Summary: In JSON mode, `claude -p` can wrap the verdict under `structured_output` instead of printing the schema payload as the top-level object.
- Current labels: audience=user; proof=human-auditable; readiness=blocked; evidence=unknown
- Suggested next action: Add a deterministic parser fixture or dev/skill runtime scenario if `structured_output` wrapping needs product protection.
- Human claim quality: [ ] keep [ ] merge [ ] split [ ] reword [ ] drop [ ] unsure
- Human corrected audience: [ ] keep [ ] user [ ] developer [ ] unclear
- Human corrected semantic group: [ ] keep [ ] Adapter and portability [ ] Agent and skill workflow [ ] Claim discovery and review [ ] Documentation and contracts [ ] Evaluation surfaces [ ] General product behavior [ ] Improvement and optimization [ ] Packets and reporting [ ] Quality gates [ ] Release and packaging [ ] other:
- Human corrected proof: [ ] keep [ ] human-auditable [ ] deterministic [ ] cautilus-eval
- Human readiness: [ ] keep [ ] ready-to-verify [ ] needs-scenario [ ] needs-alignment [ ] blocked
- Human priority: [ ] high [ ] medium [ ] low [ ] later [ ] unsure
- Human notes:
- Trace: 1 source ref; docs/guides/evaluation-process.md:320

##### claim-docs-guides-evaluation-process-md-322

- Summary: Past sessions showed `claude -p` can look silent for a while and tempt operators into manual polling or abort loops.
- Current labels: audience=user; proof=human-auditable; readiness=blocked; evidence=unknown
- Suggested next action: Promote to a timeout/progress-reporting scenario only if this should become a protected runtime behavior.
- Human claim quality: [ ] keep [ ] merge [ ] split [ ] reword [ ] drop [ ] unsure
- Human corrected audience: [ ] keep [ ] user [ ] developer [ ] unclear
- Human corrected semantic group: [ ] keep [ ] Adapter and portability [ ] Agent and skill workflow [ ] Claim discovery and review [ ] Documentation and contracts [ ] Evaluation surfaces [ ] General product behavior [ ] Improvement and optimization [ ] Packets and reporting [ ] Quality gates [ ] Release and packaging [ ] other:
- Human corrected proof: [ ] keep [ ] human-auditable [ ] deterministic [ ] cautilus-eval
- Human readiness: [ ] keep [ ] ready-to-verify [ ] needs-scenario [ ] needs-alignment [ ] blocked
- Human priority: [ ] high [ ] medium [ ] low [ ] later [ ] unsure
- Human notes:
- Trace: 1 source ref; docs/guides/evaluation-process.md:322

##### claim-readme-md-160

- Summary: Use when a stateful automation — a CLI workflow, long-running agent session, or pipeline that persists state across invocations — keeps stalling on the same step.
- Current labels: audience=user; proof=human-auditable; readiness=blocked; evidence=unknown
- Suggested next action: Keep this as human-auditable positioning or promote a concrete stalled-workflow example before creating a protected eval fixture.
- Human claim quality: [ ] keep [ ] merge [ ] split [ ] reword [ ] drop [ ] unsure
- Human corrected audience: [ ] keep [ ] user [ ] developer [ ] unclear
- Human corrected semantic group: [ ] keep [ ] Adapter and portability [ ] Agent and skill workflow [ ] Claim discovery and review [ ] Documentation and contracts [ ] Evaluation surfaces [ ] General product behavior [ ] Improvement and optimization [ ] Packets and reporting [ ] Quality gates [ ] Release and packaging [ ] other:
- Human corrected proof: [ ] keep [ ] human-auditable [ ] deterministic [ ] cautilus-eval
- Human readiness: [ ] keep [ ] ready-to-verify [ ] needs-scenario [ ] needs-alignment [ ] blocked
- Human priority: [ ] high [ ] medium [ ] low [ ] later [ ] unsure
- Human notes:
- Trace: 1 source ref; README.md:160

##### claim-readme-md-3

- Summary: `Cautilus` keeps agent and workflow behavior honest while prompts keep changing.
- Current labels: audience=user; proof=human-auditable; readiness=blocked; evidence=unknown
- Suggested next action: Keep the claim visible as positioning, or decompose it into concrete deterministic, dev/skill, and packet-surface claims before proof planning.
- Human claim quality: [ ] keep [ ] merge [ ] split [ ] reword [ ] drop [ ] unsure
- Human corrected audience: [ ] keep [ ] user [ ] developer [ ] unclear
- Human corrected semantic group: [ ] keep [ ] Adapter and portability [ ] Agent and skill workflow [ ] Claim discovery and review [ ] Documentation and contracts [ ] Evaluation surfaces [ ] General product behavior [ ] Improvement and optimization [ ] Packets and reporting [ ] Quality gates [ ] Release and packaging [ ] other:
- Human corrected proof: [ ] keep [ ] human-auditable [ ] deterministic [ ] cautilus-eval
- Human readiness: [ ] keep [ ] ready-to-verify [ ] needs-scenario [ ] needs-alignment [ ] blocked
- Human priority: [ ] high [ ] medium [ ] low [ ] later [ ] unsure
- Human notes:
- Trace: 1 source ref; README.md:3

#### Human-auditable / needs-alignment / evidence unknown (1)

##### claim-docs-guides-evaluation-process-md-270

- Summary: The host still owns raw invocation and transcript capture; `Cautilus` owns the case-suite/runDir workflow, packet-level recommendation, behavior-intent framing, and the direct chain into `scenario normalize skill`.
- Current labels: audience=user; proof=human-auditable; readiness=needs-alignment; evidence=unknown
- Suggested next action: Connect this claim to adapter contract tests plus skill-normalization and packet recommendation tests before marking it satisfied.
- Human claim quality: [ ] keep [ ] merge [ ] split [ ] reword [ ] drop [ ] unsure
- Human corrected audience: [ ] keep [ ] user [ ] developer [ ] unclear
- Human corrected semantic group: [ ] keep [ ] Adapter and portability [ ] Agent and skill workflow [ ] Claim discovery and review [ ] Documentation and contracts [ ] Evaluation surfaces [ ] General product behavior [ ] Improvement and optimization [ ] Packets and reporting [ ] Quality gates [ ] Release and packaging [ ] other:
- Human corrected proof: [ ] keep [ ] human-auditable [ ] deterministic [ ] cautilus-eval
- Human readiness: [ ] keep [ ] ready-to-verify [ ] needs-scenario [ ] needs-alignment [ ] blocked
- Human priority: [ ] high [ ] medium [ ] low [ ] later [ ] unsure
- Human notes:
- Trace: 1 source ref; docs/guides/evaluation-process.md:270

### Claim discovery and review (5)

#### Cautilus eval / dev/skill / ready-to-verify / evidence unknown (1)

##### claim-readme-md-155

- Summary: The same preset can evaluate a multi-turn agent episode when the fixture provides `turns`; Cautilus's own first-scan, refresh-flow, review-prepare, reviewer-launch, and review-to-eval dogfood fixtures derive their results from audit packets.
- Current labels: audience=user; proof=cautilus-eval; eval surface=dev/skill; readiness=ready-to-verify; evidence=unknown
- Suggested next action: Create a host-owned dev/skill fixture and run it through cautilus eval test.
- Human claim quality: [ ] keep [ ] merge [ ] split [ ] reword [ ] drop [ ] unsure
- Human corrected audience: [ ] keep [ ] user [ ] developer [ ] unclear
- Human corrected semantic group: [ ] keep [ ] Adapter and portability [ ] Agent and skill workflow [ ] Claim discovery and review [ ] Documentation and contracts [ ] Evaluation surfaces [ ] General product behavior [ ] Improvement and optimization [ ] Packets and reporting [ ] Quality gates [ ] Release and packaging [ ] other:
- Human corrected proof: [ ] keep [ ] human-auditable [ ] deterministic [ ] cautilus-eval
- Human corrected eval surface: [ ] keep [ ] dev/repo [ ] dev/skill [ ] app/chat [ ] app/prompt [ ] surface undecided
- Human readiness: [ ] keep [ ] ready-to-verify [ ] needs-scenario [ ] needs-alignment [ ] blocked
- Human priority: [ ] high [ ] medium [ ] low [ ] later [ ] unsure
- Human notes:
- Trace: 1 source ref; README.md:155

#### Deterministic gate / ready-to-verify / evidence unknown (3)

##### claim-docs-cli-reference-md-115

- Summary: Use `cautilus claim discover` before writing eval fixtures when you need to inventory declared behavior claims and decide whether each belongs in human review, deterministic CI, Cautilus eval, scenario proposal work, or alignment work.
- Current labels: audience=user; proof=deterministic; readiness=ready-to-verify; evidence=unknown
- Suggested next action: Add or link a claim-discovery workflow proof showing `claim discover` inventories declared behavior before eval fixtures are written.
- Human claim quality: [ ] keep [ ] merge [ ] split [ ] reword [ ] drop [ ] unsure
- Human corrected audience: [ ] keep [ ] user [ ] developer [ ] unclear
- Human corrected semantic group: [ ] keep [ ] Adapter and portability [ ] Agent and skill workflow [ ] Claim discovery and review [ ] Documentation and contracts [ ] Evaluation surfaces [ ] General product behavior [ ] Improvement and optimization [ ] Packets and reporting [ ] Quality gates [ ] Release and packaging [ ] other:
- Human corrected proof: [ ] keep [ ] human-auditable [ ] deterministic [ ] cautilus-eval
- Human readiness: [ ] keep [ ] ready-to-verify [ ] needs-scenario [ ] needs-alignment [ ] blocked
- Human priority: [ ] high [ ] medium [ ] low [ ] later [ ] unsure
- Human notes:
- Trace: 1 source ref; docs/cli-reference.md:115

##### claim-docs-cli-reference-md-487

- Summary: These renderers answer: "what should a human reviewer open first if they should inspect the same decision surface without parsing raw JSON?"
- Current labels: audience=user; proof=deterministic; readiness=ready-to-verify; evidence=unknown
- Suggested next action: Attach static HTML renderer evidence or a render-index/self-dogfood HTML test bundle.
- Human claim quality: [ ] keep [ ] merge [ ] split [ ] reword [ ] drop [ ] unsure
- Human corrected audience: [ ] keep [ ] user [ ] developer [ ] unclear
- Human corrected semantic group: [ ] keep [ ] Adapter and portability [ ] Agent and skill workflow [ ] Claim discovery and review [ ] Documentation and contracts [ ] Evaluation surfaces [ ] General product behavior [ ] Improvement and optimization [ ] Packets and reporting [ ] Quality gates [ ] Release and packaging [ ] other:
- Human corrected proof: [ ] keep [ ] human-auditable [ ] deterministic [ ] cautilus-eval
- Human readiness: [ ] keep [ ] ready-to-verify [ ] needs-scenario [ ] needs-alignment [ ] blocked
- Human priority: [ ] high [ ] medium [ ] low [ ] later [ ] unsure
- Human notes:
- Trace: 1 source ref; docs/cli-reference.md:487

##### claim-docs-contracts-adapter-contract-md-424

- Summary: A named adapter whose eval-test commands produce rich scenario-by-scenario signals should also persist them as files so executor variants and human reviewers can ground their verdicts on the same numbers.
- Current labels: audience=user; proof=deterministic; readiness=ready-to-verify; evidence=unknown
- Suggested next action: Add or connect deterministic adapter checks that rich scenario-by-scenario signals are persisted as files for executor variants and human reviewers.
- Human claim quality: [ ] keep [ ] merge [ ] split [ ] reword [ ] drop [ ] unsure
- Human corrected audience: [ ] keep [ ] user [ ] developer [ ] unclear
- Human corrected semantic group: [ ] keep [ ] Adapter and portability [ ] Agent and skill workflow [ ] Claim discovery and review [ ] Documentation and contracts [ ] Evaluation surfaces [ ] General product behavior [ ] Improvement and optimization [ ] Packets and reporting [ ] Quality gates [ ] Release and packaging [ ] other:
- Human corrected proof: [ ] keep [ ] human-auditable [ ] deterministic [ ] cautilus-eval
- Human readiness: [ ] keep [ ] ready-to-verify [ ] needs-scenario [ ] needs-alignment [ ] blocked
- Human priority: [ ] high [ ] medium [ ] low [ ] later [ ] unsure
- Human notes:
- Trace: 1 source ref; docs/contracts/adapter-contract.md:424

#### Human-auditable / ready-to-verify / evidence unknown (1)

##### claim-readme-md-75

- Summary: Raw `claim discover` packets remain the source-ref-backed proof-planning input, not the primary document a user should review.
- Current labels: audience=user; proof=human-auditable; readiness=ready-to-verify; evidence=unknown
- Suggested next action: Attach at least one supporting evidence item, or split/defer the claim if no concrete evidence would make the human judgment honest.
- Human claim quality: [ ] keep [ ] merge [ ] split [ ] reword [ ] drop [ ] unsure
- Human corrected audience: [ ] keep [ ] user [ ] developer [ ] unclear
- Human corrected semantic group: [ ] keep [ ] Adapter and portability [ ] Agent and skill workflow [ ] Claim discovery and review [ ] Documentation and contracts [ ] Evaluation surfaces [ ] General product behavior [ ] Improvement and optimization [ ] Packets and reporting [ ] Quality gates [ ] Release and packaging [ ] other:
- Human corrected proof: [ ] keep [ ] human-auditable [ ] deterministic [ ] cautilus-eval
- Human readiness: [ ] keep [ ] ready-to-verify [ ] needs-scenario [ ] needs-alignment [ ] blocked
- Human priority: [ ] high [ ] medium [ ] low [ ] later [ ] unsure
- Human notes:
- Trace: 1 source ref; README.md:75

### Documentation and contracts (19)

#### Cautilus eval / app/chat / needs-scenario / evidence unknown (1)

##### claim-readme-md-178

- Summary: `Cautilus` treats the context-recovery case as a protected scenario kept out of tuning so the signal stays honest.
- Current labels: audience=user; proof=cautilus-eval; eval surface=app/chat; readiness=needs-scenario; evidence=unknown
- Suggested next action: Use the scenario proposal flow to normalize candidate evidence before creating a checked-in eval fixture.
- Human claim quality: [ ] keep [ ] merge [ ] split [ ] reword [ ] drop [ ] unsure
- Human corrected audience: [ ] keep [ ] user [ ] developer [ ] unclear
- Human corrected semantic group: [ ] keep [ ] Adapter and portability [ ] Agent and skill workflow [ ] Claim discovery and review [ ] Documentation and contracts [ ] Evaluation surfaces [ ] General product behavior [ ] Improvement and optimization [ ] Packets and reporting [ ] Quality gates [ ] Release and packaging [ ] other:
- Human corrected proof: [ ] keep [ ] human-auditable [ ] deterministic [ ] cautilus-eval
- Human corrected eval surface: [ ] keep [ ] dev/repo [ ] dev/skill [ ] app/chat [ ] app/prompt [ ] surface undecided
- Human readiness: [ ] keep [ ] ready-to-verify [ ] needs-scenario [ ] needs-alignment [ ] blocked
- Human priority: [ ] high [ ] medium [ ] low [ ] later [ ] unsure
- Human notes:
- Trace: 1 source ref; README.md:178

#### Cautilus eval / app/prompt / ready-to-verify / evidence unknown (2)

##### claim-docs-specs-user-evaluation-spec-md-12

- Summary: Cautilus supports app-facing behavior, such as prompt, chat, and service-response behavior.
- Current labels: audience=user; proof=cautilus-eval; eval surface=app/prompt; readiness=ready-to-verify; evidence=unknown
- Suggested next action: Create a host-owned app/prompt fixture and run it through cautilus eval test.
- Human claim quality: [ ] keep [ ] merge [ ] split [ ] reword [ ] drop [ ] unsure
- Human corrected audience: [ ] keep [ ] user [ ] developer [ ] unclear
- Human corrected semantic group: [ ] keep [ ] Adapter and portability [ ] Agent and skill workflow [ ] Claim discovery and review [ ] Documentation and contracts [ ] Evaluation surfaces [ ] General product behavior [ ] Improvement and optimization [ ] Packets and reporting [ ] Quality gates [ ] Release and packaging [ ] other:
- Human corrected proof: [ ] keep [ ] human-auditable [ ] deterministic [ ] cautilus-eval
- Human corrected eval surface: [ ] keep [ ] dev/repo [ ] dev/skill [ ] app/chat [ ] app/prompt [ ] surface undecided
- Human readiness: [ ] keep [ ] ready-to-verify [ ] needs-scenario [ ] needs-alignment [ ] blocked
- Human priority: [ ] high [ ] medium [ ] low [ ] later [ ] unsure
- Human notes:
- Trace: 1 source ref; docs/specs/user/evaluation.spec.md:12

##### claim-readme-md-129

- Summary: For reviewed `cautilus-eval` claims, `claim plan-evals` emits `cautilus.claim_eval_plan.v1`: an intermediate plan for host-owned eval fixtures, not a writer for prompts, runners, fixtures, or policy.
- Current labels: audience=user; proof=cautilus-eval; eval surface=app/prompt; readiness=ready-to-verify; evidence=unknown
- Suggested next action: Create a host-owned app/prompt fixture and run it through cautilus eval test.
- Human claim quality: [ ] keep [ ] merge [ ] split [ ] reword [ ] drop [ ] unsure
- Human corrected audience: [ ] keep [ ] user [ ] developer [ ] unclear
- Human corrected semantic group: [ ] keep [ ] Adapter and portability [ ] Agent and skill workflow [ ] Claim discovery and review [ ] Documentation and contracts [ ] Evaluation surfaces [ ] General product behavior [ ] Improvement and optimization [ ] Packets and reporting [ ] Quality gates [ ] Release and packaging [ ] other:
- Human corrected proof: [ ] keep [ ] human-auditable [ ] deterministic [ ] cautilus-eval
- Human corrected eval surface: [ ] keep [ ] dev/repo [ ] dev/skill [ ] app/chat [ ] app/prompt [ ] surface undecided
- Human readiness: [ ] keep [ ] ready-to-verify [ ] needs-scenario [ ] needs-alignment [ ] blocked
- Human priority: [ ] high [ ] medium [ ] low [ ] later [ ] unsure
- Human notes:
- Trace: 1 source ref; README.md:129

#### Cautilus eval / dev/repo / ready-to-verify / evidence unknown (1)

##### claim-docs-specs-user-proof-debt-spec-md-14

- Summary: Unknown or missing evidence should stay visible in the public claim workflow.
- Current labels: audience=user; proof=cautilus-eval; eval surface=dev/repo; readiness=ready-to-verify; evidence=unknown
- Suggested next action: Create a host-owned dev/repo fixture and run it through cautilus eval test.
- Human claim quality: [ ] keep [ ] merge [ ] split [ ] reword [ ] drop [ ] unsure
- Human corrected audience: [ ] keep [ ] user [ ] developer [ ] unclear
- Human corrected semantic group: [ ] keep [ ] Adapter and portability [ ] Agent and skill workflow [ ] Claim discovery and review [ ] Documentation and contracts [ ] Evaluation surfaces [ ] General product behavior [ ] Improvement and optimization [ ] Packets and reporting [ ] Quality gates [ ] Release and packaging [ ] other:
- Human corrected proof: [ ] keep [ ] human-auditable [ ] deterministic [ ] cautilus-eval
- Human corrected eval surface: [ ] keep [ ] dev/repo [ ] dev/skill [ ] app/chat [ ] app/prompt [ ] surface undecided
- Human readiness: [ ] keep [ ] ready-to-verify [ ] needs-scenario [ ] needs-alignment [ ] blocked
- Human priority: [ ] high [ ] medium [ ] low [ ] later [ ] unsure
- Human notes:
- Trace: 1 source ref; docs/specs/user/proof-debt.spec.md:14

#### Deterministic gate / ready-to-verify / evidence satisfied (1)

##### claim-docs-specs-user-index-spec-md-24

- Summary: Cautilus requires specdown for public executable claim documentation.
- Current labels: audience=user; proof=deterministic; readiness=ready-to-verify; evidence=satisfied
- Suggested next action: Keep this claim covered by rerunning doctor and spec lint when the public spec tree, specdown adapter, specdown config, or doctor readiness contract changes.
- Human claim quality: [ ] keep [ ] merge [ ] split [ ] reword [ ] drop [ ] unsure
- Human corrected audience: [ ] keep [ ] user [ ] developer [ ] unclear
- Human corrected semantic group: [ ] keep [ ] Adapter and portability [ ] Agent and skill workflow [ ] Claim discovery and review [ ] Documentation and contracts [ ] Evaluation surfaces [ ] General product behavior [ ] Improvement and optimization [ ] Packets and reporting [ ] Quality gates [ ] Release and packaging [ ] other:
- Human corrected proof: [ ] keep [ ] human-auditable [ ] deterministic [ ] cautilus-eval
- Human readiness: [ ] keep [ ] ready-to-verify [ ] needs-scenario [ ] needs-alignment [ ] blocked
- Human priority: [ ] high [ ] medium [ ] low [ ] later [ ] unsure
- Human notes:
- Trace: 1 source ref; docs/specs/user/index.spec.md:24

#### Deterministic gate / ready-to-verify / evidence unknown (7)

##### claim-docs-cli-reference-md-110

- Summary: If repo setup is ready but runner proof is not, that next action can point at runner assessment setup before the first bounded eval loop.
- Current labels: audience=user; proof=deterministic; readiness=ready-to-verify; evidence=unknown
- Suggested next action: Attach agent-status runner-readiness evidence for setup-before-eval next action behavior.
- Human claim quality: [ ] keep [ ] merge [ ] split [ ] reword [ ] drop [ ] unsure
- Human corrected audience: [ ] keep [ ] user [ ] developer [ ] unclear
- Human corrected semantic group: [ ] keep [ ] Adapter and portability [ ] Agent and skill workflow [ ] Claim discovery and review [ ] Documentation and contracts [ ] Evaluation surfaces [ ] General product behavior [ ] Improvement and optimization [ ] Packets and reporting [ ] Quality gates [ ] Release and packaging [ ] other:
- Human corrected proof: [ ] keep [ ] human-auditable [ ] deterministic [ ] cautilus-eval
- Human readiness: [ ] keep [ ] ready-to-verify [ ] needs-scenario [ ] needs-alignment [ ] blocked
- Human priority: [ ] high [ ] medium [ ] low [ ] later [ ] unsure
- Human notes:
- Trace: 1 source ref; docs/cli-reference.md:110

##### claim-docs-cli-reference-md-128

- Summary: It emits `cautilus.claim_review_input.v1` and does not call an LLM or mark claims satisfied.
- Current labels: audience=user; proof=deterministic; readiness=ready-to-verify; evidence=unknown
- Suggested next action: Attach a `claim review prepare-input` command evidence bundle showing the schema and non-satisfaction boundary.
- Human claim quality: [ ] keep [ ] merge [ ] split [ ] reword [ ] drop [ ] unsure
- Human corrected audience: [ ] keep [ ] user [ ] developer [ ] unclear
- Human corrected semantic group: [ ] keep [ ] Adapter and portability [ ] Agent and skill workflow [ ] Claim discovery and review [ ] Documentation and contracts [ ] Evaluation surfaces [ ] General product behavior [ ] Improvement and optimization [ ] Packets and reporting [ ] Quality gates [ ] Release and packaging [ ] other:
- Human corrected proof: [ ] keep [ ] human-auditable [ ] deterministic [ ] cautilus-eval
- Human readiness: [ ] keep [ ] ready-to-verify [ ] needs-scenario [ ] needs-alignment [ ] blocked
- Human priority: [ ] high [ ] medium [ ] low [ ] later [ ] unsure
- Human notes:
- Trace: 1 source ref; docs/cli-reference.md:128

##### claim-docs-cli-reference-md-258

- Summary: It links normalized chatbot threads to scenario proposals and coverage hints so an operator can review behavior-eval evidence without browsing every live operator turn.
- Current labels: audience=user; proof=deterministic; readiness=ready-to-verify; evidence=unknown
- Suggested next action: Attach scenario normalize/prepare/propose evidence or CLI smoke tests covering chatbot thread linkage to proposals and coverage hints.
- Human claim quality: [ ] keep [ ] merge [ ] split [ ] reword [ ] drop [ ] unsure
- Human corrected audience: [ ] keep [ ] user [ ] developer [ ] unclear
- Human corrected semantic group: [ ] keep [ ] Adapter and portability [ ] Agent and skill workflow [ ] Claim discovery and review [ ] Documentation and contracts [ ] Evaluation surfaces [ ] General product behavior [ ] Improvement and optimization [ ] Packets and reporting [ ] Quality gates [ ] Release and packaging [ ] other:
- Human corrected proof: [ ] keep [ ] human-auditable [ ] deterministic [ ] cautilus-eval
- Human readiness: [ ] keep [ ] ready-to-verify [ ] needs-scenario [ ] needs-alignment [ ] blocked
- Human priority: [ ] high [ ] medium [ ] low [ ] later [ ] unsure
- Human notes:
- Trace: 1 source ref; docs/cli-reference.md:258

##### claim-docs-cli-reference-md-427

- Summary: A variant can finish as `passed`, `blocked`, or `failed`; blocked runs carry machine-readable reason codes instead of prose-only abort text.
- Current labels: audience=user; proof=deterministic; readiness=ready-to-verify; evidence=unknown
- Suggested next action: Attach review-variant command or schema test evidence for passed/blocked/failed status and machine-readable reason codes.
- Human claim quality: [ ] keep [ ] merge [ ] split [ ] reword [ ] drop [ ] unsure
- Human corrected audience: [ ] keep [ ] user [ ] developer [ ] unclear
- Human corrected semantic group: [ ] keep [ ] Adapter and portability [ ] Agent and skill workflow [ ] Claim discovery and review [ ] Documentation and contracts [ ] Evaluation surfaces [ ] General product behavior [ ] Improvement and optimization [ ] Packets and reporting [ ] Quality gates [ ] Release and packaging [ ] other:
- Human corrected proof: [ ] keep [ ] human-auditable [ ] deterministic [ ] cautilus-eval
- Human readiness: [ ] keep [ ] ready-to-verify [ ] needs-scenario [ ] needs-alignment [ ] blocked
- Human priority: [ ] high [ ] medium [ ] low [ ] later [ ] unsure
- Human notes:
- Trace: 1 source ref; docs/cli-reference.md:427

##### claim-docs-cli-reference-md-431

- Summary: When `--output-text-key` is present, Cautilus also extracts that JSON narrative span into the rendered prompt so the judge can read the realized output directly.
- Current labels: audience=user; proof=deterministic; readiness=ready-to-verify; evidence=unknown
- Suggested next action: Attach review-prompt rendering test evidence for `--output-text-key` extraction.
- Human claim quality: [ ] keep [ ] merge [ ] split [ ] reword [ ] drop [ ] unsure
- Human corrected audience: [ ] keep [ ] user [ ] developer [ ] unclear
- Human corrected semantic group: [ ] keep [ ] Adapter and portability [ ] Agent and skill workflow [ ] Claim discovery and review [ ] Documentation and contracts [ ] Evaluation surfaces [ ] General product behavior [ ] Improvement and optimization [ ] Packets and reporting [ ] Quality gates [ ] Release and packaging [ ] other:
- Human corrected proof: [ ] keep [ ] human-auditable [ ] deterministic [ ] cautilus-eval
- Human readiness: [ ] keep [ ] ready-to-verify [ ] needs-scenario [ ] needs-alignment [ ] blocked
- Human priority: [ ] high [ ] medium [ ] low [ ] later [ ] unsure
- Human notes:
- Trace: 1 source ref; docs/cli-reference.md:431

##### claim-docs-guides-evaluation-process-md-289

- Summary: Use a checked-in JSON schema file and a fixed output file path so the loop can detect `blocker`, `concern`, and `pass` without guessing.
- Current labels: audience=user; proof=deterministic; readiness=ready-to-verify; evidence=unknown
- Suggested next action: Attach review variant JSON schema or parser evidence.
- Human claim quality: [ ] keep [ ] merge [ ] split [ ] reword [ ] drop [ ] unsure
- Human corrected audience: [ ] keep [ ] user [ ] developer [ ] unclear
- Human corrected semantic group: [ ] keep [ ] Adapter and portability [ ] Agent and skill workflow [ ] Claim discovery and review [ ] Documentation and contracts [ ] Evaluation surfaces [ ] General product behavior [ ] Improvement and optimization [ ] Packets and reporting [ ] Quality gates [ ] Release and packaging [ ] other:
- Human corrected proof: [ ] keep [ ] human-auditable [ ] deterministic [ ] cautilus-eval
- Human readiness: [ ] keep [ ] ready-to-verify [ ] needs-scenario [ ] needs-alignment [ ] blocked
- Human priority: [ ] high [ ] medium [ ] low [ ] later [ ] unsure
- Human notes:
- Trace: 1 source ref; docs/guides/evaluation-process.md:289

##### claim-docs-specs-user-proof-debt-spec-md-7

- Summary: Cautilus makes proof debt visible so maintainers can decide whether to add deterministic proof, plan evals, align docs, split broad claims, or defer work.
- Current labels: audience=user; proof=deterministic; readiness=ready-to-verify; evidence=unknown
- Suggested next action: Keep or add a repo-owned unit, lint, build, schema, or CI check for this claim.
- Human claim quality: [ ] keep [ ] merge [ ] split [ ] reword [ ] drop [ ] unsure
- Human corrected audience: [ ] keep [ ] user [ ] developer [ ] unclear
- Human corrected semantic group: [ ] keep [ ] Adapter and portability [ ] Agent and skill workflow [ ] Claim discovery and review [ ] Documentation and contracts [ ] Evaluation surfaces [ ] General product behavior [ ] Improvement and optimization [ ] Packets and reporting [ ] Quality gates [ ] Release and packaging [ ] other:
- Human corrected proof: [ ] keep [ ] human-auditable [ ] deterministic [ ] cautilus-eval
- Human readiness: [ ] keep [ ] ready-to-verify [ ] needs-scenario [ ] needs-alignment [ ] blocked
- Human priority: [ ] high [ ] medium [ ] low [ ] later [ ] unsure
- Human notes:
- Trace: 1 source ref; docs/specs/user/proof-debt.spec.md:7

#### Human-auditable / blocked / evidence unknown (2)

##### claim-docs-guides-evaluation-process-md-317

- Summary: Past sessions showed `--bare` can disable the local OAuth or keychain path and fail with `Not logged in`.
- Current labels: audience=user; proof=human-auditable; readiness=blocked; evidence=unknown
- Suggested next action: Promote to a runtime authentication scenario only if `--bare` behavior should become release-protected.
- Human claim quality: [ ] keep [ ] merge [ ] split [ ] reword [ ] drop [ ] unsure
- Human corrected audience: [ ] keep [ ] user [ ] developer [ ] unclear
- Human corrected semantic group: [ ] keep [ ] Adapter and portability [ ] Agent and skill workflow [ ] Claim discovery and review [ ] Documentation and contracts [ ] Evaluation surfaces [ ] General product behavior [ ] Improvement and optimization [ ] Packets and reporting [ ] Quality gates [ ] Release and packaging [ ] other:
- Human corrected proof: [ ] keep [ ] human-auditable [ ] deterministic [ ] cautilus-eval
- Human readiness: [ ] keep [ ] ready-to-verify [ ] needs-scenario [ ] needs-alignment [ ] blocked
- Human priority: [ ] high [ ] medium [ ] low [ ] later [ ] unsure
- Human notes:
- Trace: 1 source ref; docs/guides/evaluation-process.md:317

##### claim-readme-md-199

- Summary: The longer-term direction is close to the workflow philosophy behind DSPy: prompts can change as long as the evaluated behavior survives.
- Current labels: audience=user; proof=human-auditable; readiness=blocked; evidence=unknown
- Suggested next action: Keep this as human-auditable positioning or decompose it into concrete deterministic or Cautilus eval claims before proof planning.
- Human claim quality: [ ] keep [ ] merge [ ] split [ ] reword [ ] drop [ ] unsure
- Human corrected audience: [ ] keep [ ] user [ ] developer [ ] unclear
- Human corrected semantic group: [ ] keep [ ] Adapter and portability [ ] Agent and skill workflow [ ] Claim discovery and review [ ] Documentation and contracts [ ] Evaluation surfaces [ ] General product behavior [ ] Improvement and optimization [ ] Packets and reporting [ ] Quality gates [ ] Release and packaging [ ] other:
- Human corrected proof: [ ] keep [ ] human-auditable [ ] deterministic [ ] cautilus-eval
- Human readiness: [ ] keep [ ] ready-to-verify [ ] needs-scenario [ ] needs-alignment [ ] blocked
- Human priority: [ ] high [ ] medium [ ] low [ ] later [ ] unsure
- Human notes:
- Trace: 1 source ref; README.md:199

#### Human-auditable / needs-alignment / evidence unknown (4)

##### claim-docs-guides-consumer-adoption-md-106

- Summary: The product owns the behavior-surface vocabulary in `cautilus.behavior_intent.v1`.
- Current labels: audience=user; proof=human-auditable; readiness=needs-alignment; evidence=unknown
- Suggested next action: Link behavior-intent schema and docs evidence before marking this ownership claim satisfied.
- Human claim quality: [ ] keep [ ] merge [ ] split [ ] reword [ ] drop [ ] unsure
- Human corrected audience: [ ] keep [ ] user [ ] developer [ ] unclear
- Human corrected semantic group: [ ] keep [ ] Adapter and portability [ ] Agent and skill workflow [ ] Claim discovery and review [ ] Documentation and contracts [ ] Evaluation surfaces [ ] General product behavior [ ] Improvement and optimization [ ] Packets and reporting [ ] Quality gates [ ] Release and packaging [ ] other:
- Human corrected proof: [ ] keep [ ] human-auditable [ ] deterministic [ ] cautilus-eval
- Human readiness: [ ] keep [ ] ready-to-verify [ ] needs-scenario [ ] needs-alignment [ ] blocked
- Human priority: [ ] high [ ] medium [ ] low [ ] later [ ] unsure
- Human notes:
- Trace: 1 source ref; docs/guides/consumer-adoption.md:106

##### claim-docs-guides-consumer-adoption-md-29

- Summary: `Cautilus` only owns the generic workflow contract, CLI, and normalization helpers.
- Current labels: audience=user; proof=human-auditable; readiness=needs-alignment; evidence=unknown
- Suggested next action: Split or link deterministic proof for generic workflow contract, CLI, and normalization helper ownership.
- Human claim quality: [ ] keep [ ] merge [ ] split [ ] reword [ ] drop [ ] unsure
- Human corrected audience: [ ] keep [ ] user [ ] developer [ ] unclear
- Human corrected semantic group: [ ] keep [ ] Adapter and portability [ ] Agent and skill workflow [ ] Claim discovery and review [ ] Documentation and contracts [ ] Evaluation surfaces [ ] General product behavior [ ] Improvement and optimization [ ] Packets and reporting [ ] Quality gates [ ] Release and packaging [ ] other:
- Human corrected proof: [ ] keep [ ] human-auditable [ ] deterministic [ ] cautilus-eval
- Human readiness: [ ] keep [ ] ready-to-verify [ ] needs-scenario [ ] needs-alignment [ ] blocked
- Human priority: [ ] high [ ] medium [ ] low [ ] later [ ] unsure
- Human notes:
- Trace: 1 source ref; docs/guides/consumer-adoption.md:29

##### claim-docs-guides-consumer-adoption-md-83

- Summary: It should answer "what is the default `Cautilus` evaluation for this repo?" without forcing the operator to mentally sort multiple unrelated workflows.
- Current labels: audience=user; proof=human-auditable; readiness=needs-alignment; evidence=unknown
- Suggested next action: Attach doctor/agent-status adapter evidence for the default evaluation path in a consumer repo.
- Human claim quality: [ ] keep [ ] merge [ ] split [ ] reword [ ] drop [ ] unsure
- Human corrected audience: [ ] keep [ ] user [ ] developer [ ] unclear
- Human corrected semantic group: [ ] keep [ ] Adapter and portability [ ] Agent and skill workflow [ ] Claim discovery and review [ ] Documentation and contracts [ ] Evaluation surfaces [ ] General product behavior [ ] Improvement and optimization [ ] Packets and reporting [ ] Quality gates [ ] Release and packaging [ ] other:
- Human corrected proof: [ ] keep [ ] human-auditable [ ] deterministic [ ] cautilus-eval
- Human readiness: [ ] keep [ ] ready-to-verify [ ] needs-scenario [ ] needs-alignment [ ] blocked
- Human priority: [ ] high [ ] medium [ ] low [ ] later [ ] unsure
- Human notes:
- Trace: 1 source ref; docs/guides/consumer-adoption.md:83

##### claim-docs-guides-evaluation-process-md-293

- Summary: Review variants should inspect the candidate, not mutate the repo.
- Current labels: audience=user; proof=human-auditable; readiness=needs-alignment; evidence=unknown
- Suggested next action: Attach review variant non-mutation evidence or runner policy checks.
- Human claim quality: [ ] keep [ ] merge [ ] split [ ] reword [ ] drop [ ] unsure
- Human corrected audience: [ ] keep [ ] user [ ] developer [ ] unclear
- Human corrected semantic group: [ ] keep [ ] Adapter and portability [ ] Agent and skill workflow [ ] Claim discovery and review [ ] Documentation and contracts [ ] Evaluation surfaces [ ] General product behavior [ ] Improvement and optimization [ ] Packets and reporting [ ] Quality gates [ ] Release and packaging [ ] other:
- Human corrected proof: [ ] keep [ ] human-auditable [ ] deterministic [ ] cautilus-eval
- Human readiness: [ ] keep [ ] ready-to-verify [ ] needs-scenario [ ] needs-alignment [ ] blocked
- Human priority: [ ] high [ ] medium [ ] low [ ] later [ ] unsure
- Human notes:
- Trace: 1 source ref; docs/guides/evaluation-process.md:293

#### Human-auditable / ready-to-verify / evidence unknown (1)

##### claim-docs-specs-user-optimization-spec-md-14

- Summary: Blocked readiness should be visible instead of being hidden behind repeated attempts.
- Current labels: audience=user; proof=human-auditable; readiness=ready-to-verify; evidence=unknown
- Suggested next action: Attach at least one supporting evidence item, or split/defer the claim if no concrete evidence would make the human judgment honest.
- Human claim quality: [ ] keep [ ] merge [ ] split [ ] reword [ ] drop [ ] unsure
- Human corrected audience: [ ] keep [ ] user [ ] developer [ ] unclear
- Human corrected semantic group: [ ] keep [ ] Adapter and portability [ ] Agent and skill workflow [ ] Claim discovery and review [ ] Documentation and contracts [ ] Evaluation surfaces [ ] General product behavior [ ] Improvement and optimization [ ] Packets and reporting [ ] Quality gates [ ] Release and packaging [ ] other:
- Human corrected proof: [ ] keep [ ] human-auditable [ ] deterministic [ ] cautilus-eval
- Human readiness: [ ] keep [ ] ready-to-verify [ ] needs-scenario [ ] needs-alignment [ ] blocked
- Human priority: [ ] high [ ] medium [ ] low [ ] later [ ] unsure
- Human notes:
- Trace: 1 source ref; docs/specs/user/optimization.spec.md:14

### Improvement and optimization (3)

#### Cautilus eval / dev/repo / ready-to-verify / evidence unknown (2)

##### claim-docs-specs-user-optimization-spec-md-19

- Summary: Future proof should connect concrete optimize packets and held-out eval results.
- Current labels: audience=user; proof=cautilus-eval; eval surface=dev/repo; readiness=ready-to-verify; evidence=unknown
- Suggested next action: Create a host-owned dev/repo fixture and run it through cautilus eval test.
- Human claim quality: [ ] keep [ ] merge [ ] split [ ] reword [ ] drop [ ] unsure
- Human corrected audience: [ ] keep [ ] user [ ] developer [ ] unclear
- Human corrected semantic group: [ ] keep [ ] Adapter and portability [ ] Agent and skill workflow [ ] Claim discovery and review [ ] Documentation and contracts [ ] Evaluation surfaces [ ] General product behavior [ ] Improvement and optimization [ ] Packets and reporting [ ] Quality gates [ ] Release and packaging [ ] other:
- Human corrected proof: [ ] keep [ ] human-auditable [ ] deterministic [ ] cautilus-eval
- Human corrected eval surface: [ ] keep [ ] dev/repo [ ] dev/skill [ ] app/chat [ ] app/prompt [ ] surface undecided
- Human readiness: [ ] keep [ ] ready-to-verify [ ] needs-scenario [ ] needs-alignment [ ] blocked
- Human priority: [ ] high [ ] medium [ ] low [ ] later [ ] unsure
- Human notes:
- Trace: 1 source ref; docs/specs/user/optimization.spec.md:19

##### claim-docs-specs-user-optimization-spec-md-3

- Summary: `Cautilus optimize` improves selected behavior without losing the proof surface that makes the improvement believable.
- Current labels: audience=user; proof=cautilus-eval; eval surface=dev/repo; readiness=ready-to-verify; evidence=unknown
- Suggested next action: Create a host-owned dev/repo fixture and run it through cautilus eval test.
- Human claim quality: [ ] keep [ ] merge [ ] split [ ] reword [ ] drop [ ] unsure
- Human corrected audience: [ ] keep [ ] user [ ] developer [ ] unclear
- Human corrected semantic group: [ ] keep [ ] Adapter and portability [ ] Agent and skill workflow [ ] Claim discovery and review [ ] Documentation and contracts [ ] Evaluation surfaces [ ] General product behavior [ ] Improvement and optimization [ ] Packets and reporting [ ] Quality gates [ ] Release and packaging [ ] other:
- Human corrected proof: [ ] keep [ ] human-auditable [ ] deterministic [ ] cautilus-eval
- Human corrected eval surface: [ ] keep [ ] dev/repo [ ] dev/skill [ ] app/chat [ ] app/prompt [ ] surface undecided
- Human readiness: [ ] keep [ ] ready-to-verify [ ] needs-scenario [ ] needs-alignment [ ] blocked
- Human priority: [ ] high [ ] medium [ ] low [ ] later [ ] unsure
- Human notes:
- Trace: 1 source ref; docs/specs/user/optimization.spec.md:3

#### Cautilus eval / surface undecided / needs-scenario / evidence unknown (1)

##### claim-docs-specs-user-optimization-spec-md-7

- Summary: Cautilus supports bounded improvement loops where the target claim, budget, and protected checks are explicit before work begins.
- Current labels: audience=user; proof=cautilus-eval; eval surface=surface undecided; readiness=needs-scenario; evidence=unknown
- Suggested next action: Use the scenario proposal flow to normalize candidate evidence before creating a checked-in eval fixture.
- Human claim quality: [ ] keep [ ] merge [ ] split [ ] reword [ ] drop [ ] unsure
- Human corrected audience: [ ] keep [ ] user [ ] developer [ ] unclear
- Human corrected semantic group: [ ] keep [ ] Adapter and portability [ ] Agent and skill workflow [ ] Claim discovery and review [ ] Documentation and contracts [ ] Evaluation surfaces [ ] General product behavior [ ] Improvement and optimization [ ] Packets and reporting [ ] Quality gates [ ] Release and packaging [ ] other:
- Human corrected proof: [ ] keep [ ] human-auditable [ ] deterministic [ ] cautilus-eval
- Human corrected eval surface: [ ] keep [ ] dev/repo [ ] dev/skill [ ] app/chat [ ] app/prompt [ ] surface undecided
- Human readiness: [ ] keep [ ] ready-to-verify [ ] needs-scenario [ ] needs-alignment [ ] blocked
- Human priority: [ ] high [ ] medium [ ] low [ ] later [ ] unsure
- Human notes:
- Trace: 1 source ref; docs/specs/user/optimization.spec.md:7

### Packets and reporting (9)

#### Cautilus eval / dev/repo / ready-to-verify / evidence unknown (2)

##### claim-docs-cli-reference-md-270

- Summary: `cautilus eval evaluate` evaluates an already-observed packet without launching the runner again.
- Current labels: audience=user; proof=cautilus-eval; eval surface=dev/repo; readiness=ready-to-verify; evidence=unknown
- Suggested next action: Create a host-owned dev/repo fixture and run it through cautilus eval test.
- Human claim quality: [ ] keep [ ] merge [ ] split [ ] reword [ ] drop [ ] unsure
- Human corrected audience: [ ] keep [ ] user [ ] developer [ ] unclear
- Human corrected semantic group: [ ] keep [ ] Adapter and portability [ ] Agent and skill workflow [ ] Claim discovery and review [ ] Documentation and contracts [ ] Evaluation surfaces [ ] General product behavior [ ] Improvement and optimization [ ] Packets and reporting [ ] Quality gates [ ] Release and packaging [ ] other:
- Human corrected proof: [ ] keep [ ] human-auditable [ ] deterministic [ ] cautilus-eval
- Human corrected eval surface: [ ] keep [ ] dev/repo [ ] dev/skill [ ] app/chat [ ] app/prompt [ ] surface undecided
- Human readiness: [ ] keep [ ] ready-to-verify [ ] needs-scenario [ ] needs-alignment [ ] blocked
- Human priority: [ ] high [ ] medium [ ] low [ ] later [ ] unsure
- Human notes:
- Trace: 1 source ref; docs/cli-reference.md:270

##### claim-docs-specs-user-index-spec-md-25

- Summary: Without specdown, a repo can still contain raw Cautilus packets, but it is not fully set up for the Cautilus claim-document workflow.
- Current labels: audience=user; proof=cautilus-eval; eval surface=dev/repo; readiness=ready-to-verify; evidence=unknown
- Suggested next action: Create a host-owned dev/repo fixture and run it through cautilus eval test.
- Human claim quality: [ ] keep [ ] merge [ ] split [ ] reword [ ] drop [ ] unsure
- Human corrected audience: [ ] keep [ ] user [ ] developer [ ] unclear
- Human corrected semantic group: [ ] keep [ ] Adapter and portability [ ] Agent and skill workflow [ ] Claim discovery and review [ ] Documentation and contracts [ ] Evaluation surfaces [ ] General product behavior [ ] Improvement and optimization [ ] Packets and reporting [ ] Quality gates [ ] Release and packaging [ ] other:
- Human corrected proof: [ ] keep [ ] human-auditable [ ] deterministic [ ] cautilus-eval
- Human corrected eval surface: [ ] keep [ ] dev/repo [ ] dev/skill [ ] app/chat [ ] app/prompt [ ] surface undecided
- Human readiness: [ ] keep [ ] ready-to-verify [ ] needs-scenario [ ] needs-alignment [ ] blocked
- Human priority: [ ] high [ ] medium [ ] low [ ] later [ ] unsure
- Human notes:
- Trace: 1 source ref; docs/specs/user/index.spec.md:25

#### Deterministic gate / ready-to-verify / evidence unknown (4)

##### claim-docs-cli-reference-md-256

- Summary: The same packet also emits an `attentionView`, which is a bounded human-facing shortlist derived from the full ranked set.
- Current labels: audience=user; proof=deterministic; readiness=ready-to-verify; evidence=unknown
- Suggested next action: Add or connect a deterministic packet test proving `attentionView` is emitted as a bounded human-facing shortlist derived from the ranked set.
- Human claim quality: [ ] keep [ ] merge [ ] split [ ] reword [ ] drop [ ] unsure
- Human corrected audience: [ ] keep [ ] user [ ] developer [ ] unclear
- Human corrected semantic group: [ ] keep [ ] Adapter and portability [ ] Agent and skill workflow [ ] Claim discovery and review [ ] Documentation and contracts [ ] Evaluation surfaces [ ] General product behavior [ ] Improvement and optimization [ ] Packets and reporting [ ] Quality gates [ ] Release and packaging [ ] other:
- Human corrected proof: [ ] keep [ ] human-auditable [ ] deterministic [ ] cautilus-eval
- Human readiness: [ ] keep [ ] ready-to-verify [ ] needs-scenario [ ] needs-alignment [ ] blocked
- Human priority: [ ] high [ ] medium [ ] low [ ] later [ ] unsure
- Human notes:
- Trace: 1 source ref; docs/cli-reference.md:256

##### claim-docs-specs-user-reviewable-artifacts-spec-md-12

- Summary: Markdown and HTML views should explain the same state without becoming a separate truth source.
- Current labels: audience=user; proof=deterministic; readiness=ready-to-verify; evidence=unknown
- Suggested next action: Keep or add deterministic packet, catalog, schema, or renderer proof for this claim.
- Human claim quality: [ ] keep [ ] merge [ ] split [ ] reword [ ] drop [ ] unsure
- Human corrected audience: [ ] keep [ ] user [ ] developer [ ] unclear
- Human corrected semantic group: [ ] keep [ ] Adapter and portability [ ] Agent and skill workflow [ ] Claim discovery and review [ ] Documentation and contracts [ ] Evaluation surfaces [ ] General product behavior [ ] Improvement and optimization [ ] Packets and reporting [ ] Quality gates [ ] Release and packaging [ ] other:
- Human corrected proof: [ ] keep [ ] human-auditable [ ] deterministic [ ] cautilus-eval
- Human readiness: [ ] keep [ ] ready-to-verify [ ] needs-scenario [ ] needs-alignment [ ] blocked
- Human priority: [ ] high [ ] medium [ ] low [ ] later [ ] unsure
- Human notes:
- Trace: 1 source ref; docs/specs/user/reviewable-artifacts.spec.md:12

##### claim-docs-specs-user-reviewable-artifacts-spec-md-3

- Summary: Cautilus writes machine-readable packets first and readable views over those packets.
- Current labels: audience=user; proof=deterministic; readiness=ready-to-verify; evidence=unknown
- Suggested next action: Keep or add deterministic packet schema, command-output, or golden-file proof for this claim.
- Human claim quality: [ ] keep [ ] merge [ ] split [ ] reword [ ] drop [ ] unsure
- Human corrected audience: [ ] keep [ ] user [ ] developer [ ] unclear
- Human corrected semantic group: [ ] keep [ ] Adapter and portability [ ] Agent and skill workflow [ ] Claim discovery and review [ ] Documentation and contracts [ ] Evaluation surfaces [ ] General product behavior [ ] Improvement and optimization [ ] Packets and reporting [ ] Quality gates [ ] Release and packaging [ ] other:
- Human corrected proof: [ ] keep [ ] human-auditable [ ] deterministic [ ] cautilus-eval
- Human readiness: [ ] keep [ ] ready-to-verify [ ] needs-scenario [ ] needs-alignment [ ] blocked
- Human priority: [ ] high [ ] medium [ ] low [ ] later [ ] unsure
- Human notes:
- Trace: 1 source ref; docs/specs/user/reviewable-artifacts.spec.md:3

##### claim-readme-md-166

- Summary: Each catalog entry now also includes `exampleInputCli`, so an operator or wrapper can inspect a minimal valid packet shape without opening a fixture path first.
- Current labels: audience=user; proof=deterministic; readiness=ready-to-verify; evidence=unknown
- Suggested next action: Keep or add deterministic packet, catalog, schema, or renderer proof for this claim.
- Human claim quality: [ ] keep [ ] merge [ ] split [ ] reword [ ] drop [ ] unsure
- Human corrected audience: [ ] keep [ ] user [ ] developer [ ] unclear
- Human corrected semantic group: [ ] keep [ ] Adapter and portability [ ] Agent and skill workflow [ ] Claim discovery and review [ ] Documentation and contracts [ ] Evaluation surfaces [ ] General product behavior [ ] Improvement and optimization [ ] Packets and reporting [ ] Quality gates [ ] Release and packaging [ ] other:
- Human corrected proof: [ ] keep [ ] human-auditable [ ] deterministic [ ] cautilus-eval
- Human readiness: [ ] keep [ ] ready-to-verify [ ] needs-scenario [ ] needs-alignment [ ] blocked
- Human priority: [ ] high [ ] medium [ ] low [ ] later [ ] unsure
- Human notes:
- Trace: 1 source ref; README.md:166

#### Human-auditable / needs-alignment / evidence unknown (1)

##### claim-docs-cli-reference-md-180

- Summary: The product owns the packet boundary and status semantics.
- Current labels: audience=user; proof=human-auditable; readiness=needs-alignment; evidence=unknown
- Suggested next action: Human-confirm the packet/status ownership boundary against CLI reference, packet schemas, and implementation before promoting narrower deterministic checks.
- Human claim quality: [ ] keep [ ] merge [ ] split [ ] reword [ ] drop [ ] unsure
- Human corrected audience: [ ] keep [ ] user [ ] developer [ ] unclear
- Human corrected semantic group: [ ] keep [ ] Adapter and portability [ ] Agent and skill workflow [ ] Claim discovery and review [ ] Documentation and contracts [ ] Evaluation surfaces [ ] General product behavior [ ] Improvement and optimization [ ] Packets and reporting [ ] Quality gates [ ] Release and packaging [ ] other:
- Human corrected proof: [ ] keep [ ] human-auditable [ ] deterministic [ ] cautilus-eval
- Human readiness: [ ] keep [ ] ready-to-verify [ ] needs-scenario [ ] needs-alignment [ ] blocked
- Human priority: [ ] high [ ] medium [ ] low [ ] later [ ] unsure
- Human notes:
- Trace: 1 source ref; docs/cli-reference.md:180

#### Human-auditable / ready-to-verify / evidence unknown (2)

##### claim-docs-specs-user-claim-discovery-spec-md-16

- Summary: If an important user-facing feature is not declared in the entry docs or linked Markdown, Cautilus treats that as a product-story gap unless another reviewed artifact proves an in-scope miss.
- Current labels: audience=user; proof=human-auditable; readiness=ready-to-verify; evidence=unknown
- Suggested next action: Attach at least one supporting evidence item, or split/defer the claim if no concrete evidence would make the human judgment honest.
- Human claim quality: [ ] keep [ ] merge [ ] split [ ] reword [ ] drop [ ] unsure
- Human corrected audience: [ ] keep [ ] user [ ] developer [ ] unclear
- Human corrected semantic group: [ ] keep [ ] Adapter and portability [ ] Agent and skill workflow [ ] Claim discovery and review [ ] Documentation and contracts [ ] Evaluation surfaces [ ] General product behavior [ ] Improvement and optimization [ ] Packets and reporting [ ] Quality gates [ ] Release and packaging [ ] other:
- Human corrected proof: [ ] keep [ ] human-auditable [ ] deterministic [ ] cautilus-eval
- Human readiness: [ ] keep [ ] ready-to-verify [ ] needs-scenario [ ] needs-alignment [ ] blocked
- Human priority: [ ] high [ ] medium [ ] low [ ] later [ ] unsure
- Human notes:
- Trace: 1 source ref; docs/specs/user/claim-discovery.spec.md:16

##### claim-docs-specs-user-reviewable-artifacts-spec-md-13

- Summary: Report views should make stale, blocked, or missing evidence visible.
- Current labels: audience=user; proof=human-auditable; readiness=ready-to-verify; evidence=unknown
- Suggested next action: Attach at least one supporting evidence item, or split/defer the claim if no concrete evidence would make the human judgment honest.
- Human claim quality: [ ] keep [ ] merge [ ] split [ ] reword [ ] drop [ ] unsure
- Human corrected audience: [ ] keep [ ] user [ ] developer [ ] unclear
- Human corrected semantic group: [ ] keep [ ] Adapter and portability [ ] Agent and skill workflow [ ] Claim discovery and review [ ] Documentation and contracts [ ] Evaluation surfaces [ ] General product behavior [ ] Improvement and optimization [ ] Packets and reporting [ ] Quality gates [ ] Release and packaging [ ] other:
- Human corrected proof: [ ] keep [ ] human-auditable [ ] deterministic [ ] cautilus-eval
- Human readiness: [ ] keep [ ] ready-to-verify [ ] needs-scenario [ ] needs-alignment [ ] blocked
- Human priority: [ ] high [ ] medium [ ] low [ ] later [ ] unsure
- Human notes:
- Trace: 1 source ref; docs/specs/user/reviewable-artifacts.spec.md:13

### Quality gates (8)

#### Cautilus eval / dev/repo / ready-to-verify / evidence unknown (2)

##### claim-docs-guides-consumer-adoption-md-48

- Summary: The ready payload now includes `first_bounded_run`, which adds a starter `eval test -> eval evaluate` packet loop and keeps the `cautilus scenarios --json` catalog nearby only for proposal-input examples.
- Current labels: audience=user; proof=cautilus-eval; eval surface=dev/repo; readiness=ready-to-verify; evidence=unknown
- Suggested next action: Create a host-owned dev/repo fixture and run it through cautilus eval test.
- Human claim quality: [ ] keep [ ] merge [ ] split [ ] reword [ ] drop [ ] unsure
- Human corrected audience: [ ] keep [ ] user [ ] developer [ ] unclear
- Human corrected semantic group: [ ] keep [ ] Adapter and portability [ ] Agent and skill workflow [ ] Claim discovery and review [ ] Documentation and contracts [ ] Evaluation surfaces [ ] General product behavior [ ] Improvement and optimization [ ] Packets and reporting [ ] Quality gates [ ] Release and packaging [ ] other:
- Human corrected proof: [ ] keep [ ] human-auditable [ ] deterministic [ ] cautilus-eval
- Human corrected eval surface: [ ] keep [ ] dev/repo [ ] dev/skill [ ] app/chat [ ] app/prompt [ ] surface undecided
- Human readiness: [ ] keep [ ] ready-to-verify [ ] needs-scenario [ ] needs-alignment [ ] blocked
- Human priority: [ ] high [ ] medium [ ] low [ ] later [ ] unsure
- Human notes:
- Trace: 1 source ref; docs/guides/consumer-adoption.md:48

##### claim-docs-specs-user-evaluation-spec-md-13

- Summary: A fixture declares the evaluated surface and preset so the reader can tell what kind of behavior is under test.
- Current labels: audience=user; proof=cautilus-eval; eval surface=dev/repo; readiness=ready-to-verify; evidence=unknown
- Suggested next action: Create a host-owned dev/repo fixture and run it through cautilus eval test.
- Human claim quality: [ ] keep [ ] merge [ ] split [ ] reword [ ] drop [ ] unsure
- Human corrected audience: [ ] keep [ ] user [ ] developer [ ] unclear
- Human corrected semantic group: [ ] keep [ ] Adapter and portability [ ] Agent and skill workflow [ ] Claim discovery and review [ ] Documentation and contracts [ ] Evaluation surfaces [ ] General product behavior [ ] Improvement and optimization [ ] Packets and reporting [ ] Quality gates [ ] Release and packaging [ ] other:
- Human corrected proof: [ ] keep [ ] human-auditable [ ] deterministic [ ] cautilus-eval
- Human corrected eval surface: [ ] keep [ ] dev/repo [ ] dev/skill [ ] app/chat [ ] app/prompt [ ] surface undecided
- Human readiness: [ ] keep [ ] ready-to-verify [ ] needs-scenario [ ] needs-alignment [ ] blocked
- Human priority: [ ] high [ ] medium [ ] low [ ] later [ ] unsure
- Human notes:
- Trace: 1 source ref; docs/specs/user/evaluation.spec.md:13

#### Cautilus eval / dev/skill / ready-to-verify / evidence unknown (1)

##### claim-docs-guides-evaluation-process-md-269

- Summary: `eval evaluate` remains the first-class packet boundary for skill trigger and execution quality.
- Current labels: audience=user; proof=cautilus-eval; eval surface=dev/skill; readiness=ready-to-verify; evidence=unknown
- Suggested next action: Create a host-owned dev/skill fixture and run it through cautilus eval test.
- Human claim quality: [ ] keep [ ] merge [ ] split [ ] reword [ ] drop [ ] unsure
- Human corrected audience: [ ] keep [ ] user [ ] developer [ ] unclear
- Human corrected semantic group: [ ] keep [ ] Adapter and portability [ ] Agent and skill workflow [ ] Claim discovery and review [ ] Documentation and contracts [ ] Evaluation surfaces [ ] General product behavior [ ] Improvement and optimization [ ] Packets and reporting [ ] Quality gates [ ] Release and packaging [ ] other:
- Human corrected proof: [ ] keep [ ] human-auditable [ ] deterministic [ ] cautilus-eval
- Human corrected eval surface: [ ] keep [ ] dev/repo [ ] dev/skill [ ] app/chat [ ] app/prompt [ ] surface undecided
- Human readiness: [ ] keep [ ] ready-to-verify [ ] needs-scenario [ ] needs-alignment [ ] blocked
- Human priority: [ ] high [ ] medium [ ] low [ ] later [ ] unsure
- Human notes:
- Trace: 1 source ref; docs/guides/evaluation-process.md:269

#### Deterministic gate / ready-to-verify / evidence unknown (5)

##### claim-docs-guides-consumer-adoption-md-20

- Summary: `cautilus doctor --next-action` returning the smallest honest next step while wiring remains incomplete
- Current labels: audience=user; proof=deterministic; readiness=ready-to-verify; evidence=unknown
- Suggested next action: Keep or add a repo-owned unit, lint, build, schema, or CI check for this claim.
- Human claim quality: [ ] keep [ ] merge [ ] split [ ] reword [ ] drop [ ] unsure
- Human corrected audience: [ ] keep [ ] user [ ] developer [ ] unclear
- Human corrected semantic group: [ ] keep [ ] Adapter and portability [ ] Agent and skill workflow [ ] Claim discovery and review [ ] Documentation and contracts [ ] Evaluation surfaces [ ] General product behavior [ ] Improvement and optimization [ ] Packets and reporting [ ] Quality gates [ ] Release and packaging [ ] other:
- Human corrected proof: [ ] keep [ ] human-auditable [ ] deterministic [ ] cautilus-eval
- Human readiness: [ ] keep [ ] ready-to-verify [ ] needs-scenario [ ] needs-alignment [ ] blocked
- Human priority: [ ] high [ ] medium [ ] low [ ] later [ ] unsure
- Human notes:
- Trace: 1 source ref; docs/guides/consumer-adoption.md:20

##### claim-docs-guides-consumer-adoption-md-67

- Summary: `cautilus doctor --scope repo` requires the target directory to be a git repository with at least one commit.
- Current labels: audience=user; proof=deterministic; readiness=ready-to-verify; evidence=unknown
- Suggested next action: Keep or add a repo-owned unit, lint, build, schema, or CI check for this claim.
- Human claim quality: [ ] keep [ ] merge [ ] split [ ] reword [ ] drop [ ] unsure
- Human corrected audience: [ ] keep [ ] user [ ] developer [ ] unclear
- Human corrected semantic group: [ ] keep [ ] Adapter and portability [ ] Agent and skill workflow [ ] Claim discovery and review [ ] Documentation and contracts [ ] Evaluation surfaces [ ] General product behavior [ ] Improvement and optimization [ ] Packets and reporting [ ] Quality gates [ ] Release and packaging [ ] other:
- Human corrected proof: [ ] keep [ ] human-auditable [ ] deterministic [ ] cautilus-eval
- Human readiness: [ ] keep [ ] ready-to-verify [ ] needs-scenario [ ] needs-alignment [ ] blocked
- Human priority: [ ] high [ ] medium [ ] low [ ] later [ ] unsure
- Human notes:
- Trace: 1 source ref; docs/guides/consumer-adoption.md:67

##### claim-docs-guides-evaluation-process-md-52

- Summary: The helper emits machine-readable baseline and candidate paths you can pass back into `eval test` or `review variants`.
- Current labels: audience=user; proof=deterministic; readiness=ready-to-verify; evidence=unknown
- Suggested next action: Keep or add deterministic packet schema, command-output, or golden-file proof for this claim.
- Human claim quality: [ ] keep [ ] merge [ ] split [ ] reword [ ] drop [ ] unsure
- Human corrected audience: [ ] keep [ ] user [ ] developer [ ] unclear
- Human corrected semantic group: [ ] keep [ ] Adapter and portability [ ] Agent and skill workflow [ ] Claim discovery and review [ ] Documentation and contracts [ ] Evaluation surfaces [ ] General product behavior [ ] Improvement and optimization [ ] Packets and reporting [ ] Quality gates [ ] Release and packaging [ ] other:
- Human corrected proof: [ ] keep [ ] human-auditable [ ] deterministic [ ] cautilus-eval
- Human readiness: [ ] keep [ ] ready-to-verify [ ] needs-scenario [ ] needs-alignment [ ] blocked
- Human priority: [ ] high [ ] medium [ ] low [ ] later [ ] unsure
- Human notes:
- Trace: 1 source ref; docs/guides/evaluation-process.md:52

##### claim-docs-specs-user-evaluation-spec-md-7

- Summary: Cautilus evaluates behavior that ordinary deterministic tests cannot fully explain, while keeping the repo in control of the runtime that produces behavior.
- Current labels: audience=user; proof=deterministic; readiness=ready-to-verify; evidence=unknown
- Suggested next action: Keep or add a repo-owned unit, lint, build, schema, or CI check for this claim.
- Human claim quality: [ ] keep [ ] merge [ ] split [ ] reword [ ] drop [ ] unsure
- Human corrected audience: [ ] keep [ ] user [ ] developer [ ] unclear
- Human corrected semantic group: [ ] keep [ ] Adapter and portability [ ] Agent and skill workflow [ ] Claim discovery and review [ ] Documentation and contracts [ ] Evaluation surfaces [ ] General product behavior [ ] Improvement and optimization [ ] Packets and reporting [ ] Quality gates [ ] Release and packaging [ ] other:
- Human corrected proof: [ ] keep [ ] human-auditable [ ] deterministic [ ] cautilus-eval
- Human readiness: [ ] keep [ ] ready-to-verify [ ] needs-scenario [ ] needs-alignment [ ] blocked
- Human priority: [ ] high [ ] medium [ ] low [ ] later [ ] unsure
- Human notes:
- Trace: 1 source ref; docs/specs/user/evaluation.spec.md:7

##### claim-docs-specs-user-proof-debt-spec-md-19

- Summary: This page should later link claim validation checks and evidence-bundle tests that prove review comments cannot satisfy claims by themselves.
- Current labels: audience=user; proof=deterministic; readiness=ready-to-verify; evidence=unknown
- Suggested next action: Keep or add a repo-owned unit, lint, build, schema, or CI check for this claim.
- Human claim quality: [ ] keep [ ] merge [ ] split [ ] reword [ ] drop [ ] unsure
- Human corrected audience: [ ] keep [ ] user [ ] developer [ ] unclear
- Human corrected semantic group: [ ] keep [ ] Adapter and portability [ ] Agent and skill workflow [ ] Claim discovery and review [ ] Documentation and contracts [ ] Evaluation surfaces [ ] General product behavior [ ] Improvement and optimization [ ] Packets and reporting [ ] Quality gates [ ] Release and packaging [ ] other:
- Human corrected proof: [ ] keep [ ] human-auditable [ ] deterministic [ ] cautilus-eval
- Human readiness: [ ] keep [ ] ready-to-verify [ ] needs-scenario [ ] needs-alignment [ ] blocked
- Human priority: [ ] high [ ] medium [ ] low [ ] later [ ] unsure
- Human notes:
- Trace: 1 source ref; docs/specs/user/proof-debt.spec.md:19

### Release and packaging (2)

#### Deterministic gate / ready-to-verify / evidence unknown (2)

##### claim-docs-cli-reference-md-32

- Summary: Legacy Homebrew installs are not a supported update channel anymore; remove them and reinstall through `install.sh` instead of mixing channels.
- Current labels: audience=user; proof=deterministic; readiness=ready-to-verify; evidence=unknown
- Suggested next action: Keep or add deterministic install, adapter, bundled-skill, or doctor readiness proof for this claim.
- Human claim quality: [ ] keep [ ] merge [ ] split [ ] reword [ ] drop [ ] unsure
- Human corrected audience: [ ] keep [ ] user [ ] developer [ ] unclear
- Human corrected semantic group: [ ] keep [ ] Adapter and portability [ ] Agent and skill workflow [ ] Claim discovery and review [ ] Documentation and contracts [ ] Evaluation surfaces [ ] General product behavior [ ] Improvement and optimization [ ] Packets and reporting [ ] Quality gates [ ] Release and packaging [ ] other:
- Human corrected proof: [ ] keep [ ] human-auditable [ ] deterministic [ ] cautilus-eval
- Human readiness: [ ] keep [ ] ready-to-verify [ ] needs-scenario [ ] needs-alignment [ ] blocked
- Human priority: [ ] high [ ] medium [ ] low [ ] later [ ] unsure
- Human notes:
- Trace: 1 source ref; docs/cli-reference.md:32

##### claim-docs-guides-consumer-adoption-md-107

- Summary: The schema version stays at `v1`, but some surface strings have been renamed for legacy vocabulary hygiene.
- Current labels: audience=user; proof=deterministic; readiness=ready-to-verify; evidence=unknown
- Suggested next action: Keep or add a repo-owned unit, lint, build, schema, or CI check for this claim.
- Human claim quality: [ ] keep [ ] merge [ ] split [ ] reword [ ] drop [ ] unsure
- Human corrected audience: [ ] keep [ ] user [ ] developer [ ] unclear
- Human corrected semantic group: [ ] keep [ ] Adapter and portability [ ] Agent and skill workflow [ ] Claim discovery and review [ ] Documentation and contracts [ ] Evaluation surfaces [ ] General product behavior [ ] Improvement and optimization [ ] Packets and reporting [ ] Quality gates [ ] Release and packaging [ ] other:
- Human corrected proof: [ ] keep [ ] human-auditable [ ] deterministic [ ] cautilus-eval
- Human readiness: [ ] keep [ ] ready-to-verify [ ] needs-scenario [ ] needs-alignment [ ] blocked
- Human priority: [ ] high [ ] medium [ ] low [ ] later [ ] unsure
- Human notes:
- Trace: 1 source ref; docs/guides/consumer-adoption.md:107

## Developer Claims (240)

### Adapter and portability (40)

#### Cautilus eval / dev/repo / ready-to-verify / evidence unknown (10)

##### claim-agents-md-79

- Summary: When a quality or release review asks for evaluator, review, CLI-discovery, or agent-surface proof, verify that the selected adapter can actually run that surface before treating the gate as available.
- Current labels: audience=developer; proof=cautilus-eval; eval surface=dev/repo; readiness=ready-to-verify; evidence=unknown
- Suggested next action: Attach adapter capability proof from doctor, agent-surface doctor, review variants, or the concrete evaluator command required by the selected gate.
- Human claim quality: [ ] keep [ ] merge [ ] split [ ] reword [ ] drop [ ] unsure
- Human corrected audience: [ ] keep [ ] user [ ] developer [ ] unclear
- Human corrected semantic group: [ ] keep [ ] Adapter and portability [ ] Agent and skill workflow [ ] Claim discovery and review [ ] Documentation and contracts [ ] Evaluation surfaces [ ] General product behavior [ ] Improvement and optimization [ ] Packets and reporting [ ] Quality gates [ ] Release and packaging [ ] other:
- Human corrected proof: [ ] keep [ ] human-auditable [ ] deterministic [ ] cautilus-eval
- Human corrected eval surface: [ ] keep [ ] dev/repo [ ] dev/skill [ ] app/chat [ ] app/prompt [ ] surface undecided
- Human readiness: [ ] keep [ ] ready-to-verify [ ] needs-scenario [ ] needs-alignment [ ] blocked
- Human priority: [ ] high [ ] medium [ ] low [ ] later [ ] unsure
- Human notes:
- Trace: 1 source ref; AGENTS.md:79

##### claim-docs-contracts-adapter-contract-md-208

- Summary: When an eval run uses `runtime=fixture`, observed proof is downgraded to `fixture-smoke` and the adapter-declared class is preserved only as declared metadata.
- Current labels: audience=developer; proof=cautilus-eval; eval surface=dev/repo; readiness=ready-to-verify; evidence=unknown
- Suggested next action: Create a host-owned dev/repo fixture and run it through cautilus eval test.
- Human claim quality: [ ] keep [ ] merge [ ] split [ ] reword [ ] drop [ ] unsure
- Human corrected audience: [ ] keep [ ] user [ ] developer [ ] unclear
- Human corrected semantic group: [ ] keep [ ] Adapter and portability [ ] Agent and skill workflow [ ] Claim discovery and review [ ] Documentation and contracts [ ] Evaluation surfaces [ ] General product behavior [ ] Improvement and optimization [ ] Packets and reporting [ ] Quality gates [ ] Release and packaging [ ] other:
- Human corrected proof: [ ] keep [ ] human-auditable [ ] deterministic [ ] cautilus-eval
- Human corrected eval surface: [ ] keep [ ] dev/repo [ ] dev/skill [ ] app/chat [ ] app/prompt [ ] surface undecided
- Human readiness: [ ] keep [ ] ready-to-verify [ ] needs-scenario [ ] needs-alignment [ ] blocked
- Human priority: [ ] high [ ] medium [ ] low [ ] later [ ] unsure
- Human notes:
- Trace: 1 source ref; docs/contracts/adapter-contract.md:208

##### claim-docs-contracts-adapter-contract-md-220

- Summary: If omitted, discovery uses the portable fallback group `General product behavior` instead of assuming a product-specific taxonomy.
- Current labels: audience=developer; proof=cautilus-eval; eval surface=dev/repo; readiness=ready-to-verify; evidence=unknown
- Suggested next action: Create a host-owned dev/repo fixture and run it through cautilus eval test.
- Human claim quality: [ ] keep [ ] merge [ ] split [ ] reword [ ] drop [ ] unsure
- Human corrected audience: [ ] keep [ ] user [ ] developer [ ] unclear
- Human corrected semantic group: [ ] keep [ ] Adapter and portability [ ] Agent and skill workflow [ ] Claim discovery and review [ ] Documentation and contracts [ ] Evaluation surfaces [ ] General product behavior [ ] Improvement and optimization [ ] Packets and reporting [ ] Quality gates [ ] Release and packaging [ ] other:
- Human corrected proof: [ ] keep [ ] human-auditable [ ] deterministic [ ] cautilus-eval
- Human corrected eval surface: [ ] keep [ ] dev/repo [ ] dev/skill [ ] app/chat [ ] app/prompt [ ] surface undecided
- Human readiness: [ ] keep [ ] ready-to-verify [ ] needs-scenario [ ] needs-alignment [ ] blocked
- Human priority: [ ] high [ ] medium [ ] low [ ] later [ ] unsure
- Human notes:
- Trace: 1 source ref; docs/contracts/adapter-contract.md:220

##### claim-docs-contracts-adapter-contract-md-3

- Summary: `Cautilus` stays portable by loading repo-specific evaluation commands from an adapter instead of hardcoding benchmark runners into the workflow.
- Current labels: audience=developer; proof=cautilus-eval; eval surface=dev/repo; readiness=ready-to-verify; evidence=unknown
- Suggested next action: Create a host-owned dev/repo fixture and run it through cautilus eval test.
- Human claim quality: [ ] keep [ ] merge [ ] split [ ] reword [ ] drop [ ] unsure
- Human corrected audience: [ ] keep [ ] user [ ] developer [ ] unclear
- Human corrected semantic group: [ ] keep [ ] Adapter and portability [ ] Agent and skill workflow [ ] Claim discovery and review [ ] Documentation and contracts [ ] Evaluation surfaces [ ] General product behavior [ ] Improvement and optimization [ ] Packets and reporting [ ] Quality gates [ ] Release and packaging [ ] other:
- Human corrected proof: [ ] keep [ ] human-auditable [ ] deterministic [ ] cautilus-eval
- Human corrected eval surface: [ ] keep [ ] dev/repo [ ] dev/skill [ ] app/chat [ ] app/prompt [ ] surface undecided
- Human readiness: [ ] keep [ ] ready-to-verify [ ] needs-scenario [ ] needs-alignment [ ] blocked
- Human priority: [ ] high [ ] medium [ ] low [ ] later [ ] unsure
- Human notes:
- Trace: 1 source ref; docs/contracts/adapter-contract.md:3

##### claim-docs-contracts-claim-discovery-workflow-md-178

- Summary: When the adapter omits semantic groups, the binary emits `General product behavior` instead of using a Cautilus-specific taxonomy.
- Current labels: audience=developer; proof=cautilus-eval; eval surface=dev/repo; readiness=ready-to-verify; evidence=unknown
- Suggested next action: Create a host-owned dev/repo fixture and run it through cautilus eval test.
- Human claim quality: [ ] keep [ ] merge [ ] split [ ] reword [ ] drop [ ] unsure
- Human corrected audience: [ ] keep [ ] user [ ] developer [ ] unclear
- Human corrected semantic group: [ ] keep [ ] Adapter and portability [ ] Agent and skill workflow [ ] Claim discovery and review [ ] Documentation and contracts [ ] Evaluation surfaces [ ] General product behavior [ ] Improvement and optimization [ ] Packets and reporting [ ] Quality gates [ ] Release and packaging [ ] other:
- Human corrected proof: [ ] keep [ ] human-auditable [ ] deterministic [ ] cautilus-eval
- Human corrected eval surface: [ ] keep [ ] dev/repo [ ] dev/skill [ ] app/chat [ ] app/prompt [ ] surface undecided
- Human readiness: [ ] keep [ ] ready-to-verify [ ] needs-scenario [ ] needs-alignment [ ] blocked
- Human priority: [ ] high [ ] medium [ ] low [ ] later [ ] unsure
- Human notes:
- Trace: 1 source ref; docs/contracts/claim-discovery-workflow.md:178

##### claim-docs-contracts-reporting-md-111

- Summary: Model and provider truth should come from explicit runner output, adapter metadata, or checked-in wrappers, not from retroactive log scraping.
- Current labels: audience=developer; proof=cautilus-eval; eval surface=dev/repo; readiness=ready-to-verify; evidence=unknown
- Suggested next action: Create a host-owned dev/repo fixture and run it through cautilus eval test.
- Human claim quality: [ ] keep [ ] merge [ ] split [ ] reword [ ] drop [ ] unsure
- Human corrected audience: [ ] keep [ ] user [ ] developer [ ] unclear
- Human corrected semantic group: [ ] keep [ ] Adapter and portability [ ] Agent and skill workflow [ ] Claim discovery and review [ ] Documentation and contracts [ ] Evaluation surfaces [ ] General product behavior [ ] Improvement and optimization [ ] Packets and reporting [ ] Quality gates [ ] Release and packaging [ ] other:
- Human corrected proof: [ ] keep [ ] human-auditable [ ] deterministic [ ] cautilus-eval
- Human corrected eval surface: [ ] keep [ ] dev/repo [ ] dev/skill [ ] app/chat [ ] app/prompt [ ] surface undecided
- Human readiness: [ ] keep [ ] ready-to-verify [ ] needs-scenario [ ] needs-alignment [ ] blocked
- Human priority: [ ] high [ ] medium [ ] low [ ] later [ ] unsure
- Human notes:
- Trace: 1 source ref; docs/contracts/reporting.md:111

##### claim-docs-contracts-runner-readiness-md-44

- Summary: `eval` runs bounded behavior evaluations through adapter-declared runners.
- Current labels: audience=developer; proof=cautilus-eval; eval surface=dev/repo; readiness=ready-to-verify; evidence=unknown
- Suggested next action: Create a host-owned dev/repo fixture and run it through cautilus eval test.
- Human claim quality: [ ] keep [ ] merge [ ] split [ ] reword [ ] drop [ ] unsure
- Human corrected audience: [ ] keep [ ] user [ ] developer [ ] unclear
- Human corrected semantic group: [ ] keep [ ] Adapter and portability [ ] Agent and skill workflow [ ] Claim discovery and review [ ] Documentation and contracts [ ] Evaluation surfaces [ ] General product behavior [ ] Improvement and optimization [ ] Packets and reporting [ ] Quality gates [ ] Release and packaging [ ] other:
- Human corrected proof: [ ] keep [ ] human-auditable [ ] deterministic [ ] cautilus-eval
- Human corrected eval surface: [ ] keep [ ] dev/repo [ ] dev/skill [ ] app/chat [ ] app/prompt [ ] surface undecided
- Human readiness: [ ] keep [ ] ready-to-verify [ ] needs-scenario [ ] needs-alignment [ ] blocked
- Human priority: [ ] high [ ] medium [ ] low [ ] later [ ] unsure
- Human notes:
- Trace: 1 source ref; docs/contracts/runner-readiness.md:44

##### claim-docs-contracts-scenario-proposal-sources-md-152

- Summary: Evidence should preserve where the suggestion came from without forcing one host repo's storage model on the product.
- Current labels: audience=developer; proof=cautilus-eval; eval surface=dev/repo; readiness=ready-to-verify; evidence=unknown
- Suggested next action: Create a host-owned dev/repo fixture and run it through cautilus eval test.
- Human claim quality: [ ] keep [ ] merge [ ] split [ ] reword [ ] drop [ ] unsure
- Human corrected audience: [ ] keep [ ] user [ ] developer [ ] unclear
- Human corrected semantic group: [ ] keep [ ] Adapter and portability [ ] Agent and skill workflow [ ] Claim discovery and review [ ] Documentation and contracts [ ] Evaluation surfaces [ ] General product behavior [ ] Improvement and optimization [ ] Packets and reporting [ ] Quality gates [ ] Release and packaging [ ] other:
- Human corrected proof: [ ] keep [ ] human-auditable [ ] deterministic [ ] cautilus-eval
- Human corrected eval surface: [ ] keep [ ] dev/repo [ ] dev/skill [ ] app/chat [ ] app/prompt [ ] surface undecided
- Human readiness: [ ] keep [ ] ready-to-verify [ ] needs-scenario [ ] needs-alignment [ ] blocked
- Human priority: [ ] high [ ] medium [ ] low [ ] later [ ] unsure
- Human notes:
- Trace: 1 source ref; docs/contracts/scenario-proposal-sources.md:152

##### claim-docs-contracts-workbench-instance-discovery-md-99

- Summary: A future live app eval flow can refer to one selected instance by stable id.
- Current labels: audience=developer; proof=cautilus-eval; eval surface=dev/repo; readiness=ready-to-verify; evidence=unknown
- Suggested next action: Create a host-owned dev/repo fixture and run it through cautilus eval test.
- Human claim quality: [ ] keep [ ] merge [ ] split [ ] reword [ ] drop [ ] unsure
- Human corrected audience: [ ] keep [ ] user [ ] developer [ ] unclear
- Human corrected semantic group: [ ] keep [ ] Adapter and portability [ ] Agent and skill workflow [ ] Claim discovery and review [ ] Documentation and contracts [ ] Evaluation surfaces [ ] General product behavior [ ] Improvement and optimization [ ] Packets and reporting [ ] Quality gates [ ] Release and packaging [ ] other:
- Human corrected proof: [ ] keep [ ] human-auditable [ ] deterministic [ ] cautilus-eval
- Human corrected eval surface: [ ] keep [ ] dev/repo [ ] dev/skill [ ] app/chat [ ] app/prompt [ ] surface undecided
- Human readiness: [ ] keep [ ] ready-to-verify [ ] needs-scenario [ ] needs-alignment [ ] blocked
- Human priority: [ ] high [ ] medium [ ] low [ ] later [ ] unsure
- Human notes:
- Trace: 1 source ref; docs/contracts/workbench-instance-discovery.md:99

##### claim-docs-specs-maintainer-adapter-host-ownership-spec-md-19

- Summary: Repo-specific behavior should stay in adapters and fixtures, not in product logic.
- Current labels: audience=developer; proof=cautilus-eval; eval surface=dev/repo; readiness=ready-to-verify; evidence=unknown
- Suggested next action: Create a host-owned dev/repo fixture and run it through cautilus eval test.
- Human claim quality: [ ] keep [ ] merge [ ] split [ ] reword [ ] drop [ ] unsure
- Human corrected audience: [ ] keep [ ] user [ ] developer [ ] unclear
- Human corrected semantic group: [ ] keep [ ] Adapter and portability [ ] Agent and skill workflow [ ] Claim discovery and review [ ] Documentation and contracts [ ] Evaluation surfaces [ ] General product behavior [ ] Improvement and optimization [ ] Packets and reporting [ ] Quality gates [ ] Release and packaging [ ] other:
- Human corrected proof: [ ] keep [ ] human-auditable [ ] deterministic [ ] cautilus-eval
- Human corrected eval surface: [ ] keep [ ] dev/repo [ ] dev/skill [ ] app/chat [ ] app/prompt [ ] surface undecided
- Human readiness: [ ] keep [ ] ready-to-verify [ ] needs-scenario [ ] needs-alignment [ ] blocked
- Human priority: [ ] high [ ] medium [ ] low [ ] later [ ] unsure
- Human notes:
- Trace: 1 source ref; docs/specs/maintainer/adapter-host-ownership.spec.md:19

#### Cautilus eval / dev/skill / ready-to-verify / evidence unknown (2)

##### claim-docs-contracts-runner-readiness-md-117

- Summary: It should combine binary health, skill surface readiness, adapter state, claim state, and runner readiness status.
- Current labels: audience=developer; proof=cautilus-eval; eval surface=dev/skill; readiness=ready-to-verify; evidence=unknown
- Suggested next action: Create a host-owned dev/skill fixture and run it through cautilus eval test.
- Human claim quality: [ ] keep [ ] merge [ ] split [ ] reword [ ] drop [ ] unsure
- Human corrected audience: [ ] keep [ ] user [ ] developer [ ] unclear
- Human corrected semantic group: [ ] keep [ ] Adapter and portability [ ] Agent and skill workflow [ ] Claim discovery and review [ ] Documentation and contracts [ ] Evaluation surfaces [ ] General product behavior [ ] Improvement and optimization [ ] Packets and reporting [ ] Quality gates [ ] Release and packaging [ ] other:
- Human corrected proof: [ ] keep [ ] human-auditable [ ] deterministic [ ] cautilus-eval
- Human corrected eval surface: [ ] keep [ ] dev/repo [ ] dev/skill [ ] app/chat [ ] app/prompt [ ] surface undecided
- Human readiness: [ ] keep [ ] ready-to-verify [ ] needs-scenario [ ] needs-alignment [ ] blocked
- Human priority: [ ] high [ ] medium [ ] low [ ] later [ ] unsure
- Human notes:
- Trace: 1 source ref; docs/contracts/runner-readiness.md:117

##### claim-docs-contracts-runtime-fingerprint-optimization-md-50

- Summary: It should not directly auto-edit consumer-owned prompts, skills, or instruction files.
- Current labels: audience=developer; proof=cautilus-eval; eval surface=dev/skill; readiness=ready-to-verify; evidence=unknown
- Suggested next action: Create a host-owned dev/skill fixture and run it through cautilus eval test.
- Human claim quality: [ ] keep [ ] merge [ ] split [ ] reword [ ] drop [ ] unsure
- Human corrected audience: [ ] keep [ ] user [ ] developer [ ] unclear
- Human corrected semantic group: [ ] keep [ ] Adapter and portability [ ] Agent and skill workflow [ ] Claim discovery and review [ ] Documentation and contracts [ ] Evaluation surfaces [ ] General product behavior [ ] Improvement and optimization [ ] Packets and reporting [ ] Quality gates [ ] Release and packaging [ ] other:
- Human corrected proof: [ ] keep [ ] human-auditable [ ] deterministic [ ] cautilus-eval
- Human corrected eval surface: [ ] keep [ ] dev/repo [ ] dev/skill [ ] app/chat [ ] app/prompt [ ] surface undecided
- Human readiness: [ ] keep [ ] ready-to-verify [ ] needs-scenario [ ] needs-alignment [ ] blocked
- Human priority: [ ] high [ ] medium [ ] low [ ] later [ ] unsure
- Human notes:
- Trace: 1 source ref; docs/contracts/runtime-fingerprint-optimization.md:50

#### Cautilus eval / surface undecided / needs-scenario / evidence unknown (1)

##### claim-docs-contracts-workbench-instance-discovery-md-87

- Summary: future GUI workbench behavior for browsing and editing claims, scenarios, evidence, and related review state That future workbench should be specified as an interactive product surface, not as the current live app runner seam.
- Current labels: audience=developer; proof=cautilus-eval; eval surface=surface undecided; readiness=needs-scenario; evidence=unknown
- Suggested next action: Use the scenario proposal flow to normalize candidate evidence before creating a checked-in eval fixture.
- Human claim quality: [ ] keep [ ] merge [ ] split [ ] reword [ ] drop [ ] unsure
- Human corrected audience: [ ] keep [ ] user [ ] developer [ ] unclear
- Human corrected semantic group: [ ] keep [ ] Adapter and portability [ ] Agent and skill workflow [ ] Claim discovery and review [ ] Documentation and contracts [ ] Evaluation surfaces [ ] General product behavior [ ] Improvement and optimization [ ] Packets and reporting [ ] Quality gates [ ] Release and packaging [ ] other:
- Human corrected proof: [ ] keep [ ] human-auditable [ ] deterministic [ ] cautilus-eval
- Human corrected eval surface: [ ] keep [ ] dev/repo [ ] dev/skill [ ] app/chat [ ] app/prompt [ ] surface undecided
- Human readiness: [ ] keep [ ] ready-to-verify [ ] needs-scenario [ ] needs-alignment [ ] blocked
- Human priority: [ ] high [ ] medium [ ] low [ ] later [ ] unsure
- Human notes:
- Trace: 1 source ref; docs/contracts/workbench-instance-discovery.md:87

#### Deterministic gate / ready-to-verify / evidence satisfied (1)

##### claim-docs-master-plan-md-56

- Summary: checked-in local gates, GitHub workflows that run `verify`, and an external consumer onboarding smoke (`consumer:onboard:smoke`) that proves install → adapter init → minimal wiring → adapter resolve → doctor ready → one bounded `eval test`
- Current labels: audience=developer; proof=deterministic; readiness=ready-to-verify; evidence=satisfied
- Suggested next action: Keep covered by verify, workflow-file review, consumer:onboard:smoke, and release install smoke.
- Human claim quality: [ ] keep [ ] merge [ ] split [ ] reword [ ] drop [ ] unsure
- Human corrected audience: [ ] keep [ ] user [ ] developer [ ] unclear
- Human corrected semantic group: [ ] keep [ ] Adapter and portability [ ] Agent and skill workflow [ ] Claim discovery and review [ ] Documentation and contracts [ ] Evaluation surfaces [ ] General product behavior [ ] Improvement and optimization [ ] Packets and reporting [ ] Quality gates [ ] Release and packaging [ ] other:
- Human corrected proof: [ ] keep [ ] human-auditable [ ] deterministic [ ] cautilus-eval
- Human readiness: [ ] keep [ ] ready-to-verify [ ] needs-scenario [ ] needs-alignment [ ] blocked
- Human priority: [ ] high [ ] medium [ ] low [ ] later [ ] unsure
- Human notes:
- Trace: 1 source ref; docs/master-plan.md:56

#### Deterministic gate / ready-to-verify / evidence unknown (19)

##### claim-agents-md-12

- Summary: Deterministic behavior belongs in code, scripts, adapters, tests, and specs.
- Current labels: audience=developer; proof=deterministic; readiness=ready-to-verify; evidence=unknown
- Suggested next action: Decompose into concrete deterministic surfaces or create a policy inventory that maps deterministic behavior claims to code, scripts, adapters, tests, and specs.
- Human claim quality: [ ] keep [ ] merge [ ] split [ ] reword [ ] drop [ ] unsure
- Human corrected audience: [ ] keep [ ] user [ ] developer [ ] unclear
- Human corrected semantic group: [ ] keep [ ] Adapter and portability [ ] Agent and skill workflow [ ] Claim discovery and review [ ] Documentation and contracts [ ] Evaluation surfaces [ ] General product behavior [ ] Improvement and optimization [ ] Packets and reporting [ ] Quality gates [ ] Release and packaging [ ] other:
- Human corrected proof: [ ] keep [ ] human-auditable [ ] deterministic [ ] cautilus-eval
- Human readiness: [ ] keep [ ] ready-to-verify [ ] needs-scenario [ ] needs-alignment [ ] blocked
- Human priority: [ ] high [ ] medium [ ] low [ ] later [ ] unsure
- Human notes:
- Trace: 1 source ref; AGENTS.md:12

##### claim-docs-contracts-active-run-md-212

- Summary: Should `run.json` carry workflow metadata (mode, baseline ref, adapter name) so the pruner and HTML views can present richer summaries?
- Current labels: audience=developer; proof=deterministic; readiness=ready-to-verify; evidence=unknown
- Suggested next action: Keep or add deterministic packet, catalog, schema, or renderer proof for this claim.
- Human claim quality: [ ] keep [ ] merge [ ] split [ ] reword [ ] drop [ ] unsure
- Human corrected audience: [ ] keep [ ] user [ ] developer [ ] unclear
- Human corrected semantic group: [ ] keep [ ] Adapter and portability [ ] Agent and skill workflow [ ] Claim discovery and review [ ] Documentation and contracts [ ] Evaluation surfaces [ ] General product behavior [ ] Improvement and optimization [ ] Packets and reporting [ ] Quality gates [ ] Release and packaging [ ] other:
- Human corrected proof: [ ] keep [ ] human-auditable [ ] deterministic [ ] cautilus-eval
- Human readiness: [ ] keep [ ] ready-to-verify [ ] needs-scenario [ ] needs-alignment [ ] blocked
- Human priority: [ ] high [ ] medium [ ] low [ ] later [ ] unsure
- Human notes:
- Trace: 1 source ref; docs/contracts/active-run.md:212

##### claim-docs-contracts-active-run-md-3

- Summary: `Cautilus` pins one product-owned per-run workspace root per workflow and keeps the reference sticky across consumer command invocations with a shell environment variable.
- Current labels: audience=developer; proof=deterministic; readiness=ready-to-verify; evidence=unknown
- Suggested next action: Add or connect a deterministic active-run test that proves the workspace root is pinned per workflow and reused through the shell environment variable.
- Human claim quality: [ ] keep [ ] merge [ ] split [ ] reword [ ] drop [ ] unsure
- Human corrected audience: [ ] keep [ ] user [ ] developer [ ] unclear
- Human corrected semantic group: [ ] keep [ ] Adapter and portability [ ] Agent and skill workflow [ ] Claim discovery and review [ ] Documentation and contracts [ ] Evaluation surfaces [ ] General product behavior [ ] Improvement and optimization [ ] Packets and reporting [ ] Quality gates [ ] Release and packaging [ ] other:
- Human corrected proof: [ ] keep [ ] human-auditable [ ] deterministic [ ] cautilus-eval
- Human readiness: [ ] keep [ ] ready-to-verify [ ] needs-scenario [ ] needs-alignment [ ] blocked
- Human priority: [ ] high [ ] medium [ ] low [ ] later [ ] unsure
- Human notes:
- Trace: 1 source ref; docs/contracts/active-run.md:3

##### claim-docs-contracts-adapter-contract-md-405

- Summary: This keeps prompt benchmarking, code-quality benchmarking, and workflow smoke tests from collapsing into one overloaded adapter file.
- Current labels: audience=developer; proof=deterministic; readiness=ready-to-verify; evidence=unknown
- Suggested next action: Keep or add a repo-owned unit, lint, build, schema, or CI check for this claim.
- Human claim quality: [ ] keep [ ] merge [ ] split [ ] reword [ ] drop [ ] unsure
- Human corrected audience: [ ] keep [ ] user [ ] developer [ ] unclear
- Human corrected semantic group: [ ] keep [ ] Adapter and portability [ ] Agent and skill workflow [ ] Claim discovery and review [ ] Documentation and contracts [ ] Evaluation surfaces [ ] General product behavior [ ] Improvement and optimization [ ] Packets and reporting [ ] Quality gates [ ] Release and packaging [ ] other:
- Human corrected proof: [ ] keep [ ] human-auditable [ ] deterministic [ ] cautilus-eval
- Human readiness: [ ] keep [ ] ready-to-verify [ ] needs-scenario [ ] needs-alignment [ ] blocked
- Human priority: [ ] high [ ] medium [ ] low [ ] later [ ] unsure
- Human notes:
- Trace: 1 source ref; docs/contracts/adapter-contract.md:405

##### claim-docs-contracts-claim-discovery-workflow-md-258

- Summary: Ownership-boundary explanations, such as product-owned versus adapter-owned responsibilities, should stay `human-auditable` and `needs-alignment` until the matching docs, code, adapters, and tests are reconciled.
- Current labels: audience=developer; proof=deterministic; readiness=ready-to-verify; evidence=unknown
- Suggested next action: Keep or add a repo-owned unit, lint, build, schema, or CI check for this claim.
- Human claim quality: [ ] keep [ ] merge [ ] split [ ] reword [ ] drop [ ] unsure
- Human corrected audience: [ ] keep [ ] user [ ] developer [ ] unclear
- Human corrected semantic group: [ ] keep [ ] Adapter and portability [ ] Agent and skill workflow [ ] Claim discovery and review [ ] Documentation and contracts [ ] Evaluation surfaces [ ] General product behavior [ ] Improvement and optimization [ ] Packets and reporting [ ] Quality gates [ ] Release and packaging [ ] other:
- Human corrected proof: [ ] keep [ ] human-auditable [ ] deterministic [ ] cautilus-eval
- Human readiness: [ ] keep [ ] ready-to-verify [ ] needs-scenario [ ] needs-alignment [ ] blocked
- Human priority: [ ] high [ ] medium [ ] low [ ] later [ ] unsure
- Human notes:
- Trace: 1 source ref; docs/contracts/claim-discovery-workflow.md:258

##### claim-docs-contracts-live-run-invocation-md-12

- Summary: When the product-owned loop is active, `Cautilus` also owns one stable per-request workspace directory under `<output_file>.d/workspace/` and may run one optional prepare hook before the first turn.
- Current labels: audience=developer; proof=deterministic; readiness=ready-to-verify; evidence=unknown
- Suggested next action: Add or connect deterministic live-run invocation tests for workspace directory allocation and one-time prepare hook timing.
- Human claim quality: [ ] keep [ ] merge [ ] split [ ] reword [ ] drop [ ] unsure
- Human corrected audience: [ ] keep [ ] user [ ] developer [ ] unclear
- Human corrected semantic group: [ ] keep [ ] Adapter and portability [ ] Agent and skill workflow [ ] Claim discovery and review [ ] Documentation and contracts [ ] Evaluation surfaces [ ] General product behavior [ ] Improvement and optimization [ ] Packets and reporting [ ] Quality gates [ ] Release and packaging [ ] other:
- Human corrected proof: [ ] keep [ ] human-auditable [ ] deterministic [ ] cautilus-eval
- Human readiness: [ ] keep [ ] ready-to-verify [ ] needs-scenario [ ] needs-alignment [ ] blocked
- Human priority: [ ] high [ ] medium [ ] low [ ] later [ ] unsure
- Human notes:
- Trace: 1 source ref; docs/contracts/live-run-invocation.md:12

##### claim-docs-contracts-live-run-invocation-md-193

- Summary: The consumer can return a machine-readable result without exposing its route layout.
- Current labels: audience=developer; proof=deterministic; readiness=ready-to-verify; evidence=unknown
- Suggested next action: Keep or add deterministic packet schema, command-output, or golden-file proof for this claim.
- Human claim quality: [ ] keep [ ] merge [ ] split [ ] reword [ ] drop [ ] unsure
- Human corrected audience: [ ] keep [ ] user [ ] developer [ ] unclear
- Human corrected semantic group: [ ] keep [ ] Adapter and portability [ ] Agent and skill workflow [ ] Claim discovery and review [ ] Documentation and contracts [ ] Evaluation surfaces [ ] General product behavior [ ] Improvement and optimization [ ] Packets and reporting [ ] Quality gates [ ] Release and packaging [ ] other:
- Human corrected proof: [ ] keep [ ] human-auditable [ ] deterministic [ ] cautilus-eval
- Human readiness: [ ] keep [ ] ready-to-verify [ ] needs-scenario [ ] needs-alignment [ ] blocked
- Human priority: [ ] high [ ] medium [ ] low [ ] later [ ] unsure
- Human notes:
- Trace: 1 source ref; docs/contracts/live-run-invocation.md:193

##### claim-docs-contracts-live-run-invocation-md-24

- Summary: Product-owned workspace lifecycle stays off the public packet shape and instead flows through adapter template placeholders.
- Current labels: audience=developer; proof=deterministic; readiness=ready-to-verify; evidence=unknown
- Suggested next action: Add or connect deterministic schema/template checks proving workspace lifecycle is not exposed through the public packet shape and flows through adapter placeholders.
- Human claim quality: [ ] keep [ ] merge [ ] split [ ] reword [ ] drop [ ] unsure
- Human corrected audience: [ ] keep [ ] user [ ] developer [ ] unclear
- Human corrected semantic group: [ ] keep [ ] Adapter and portability [ ] Agent and skill workflow [ ] Claim discovery and review [ ] Documentation and contracts [ ] Evaluation surfaces [ ] General product behavior [ ] Improvement and optimization [ ] Packets and reporting [ ] Quality gates [ ] Release and packaging [ ] other:
- Human corrected proof: [ ] keep [ ] human-auditable [ ] deterministic [ ] cautilus-eval
- Human readiness: [ ] keep [ ] ready-to-verify [ ] needs-scenario [ ] needs-alignment [ ] blocked
- Human priority: [ ] high [ ] medium [ ] low [ ] later [ ] unsure
- Human notes:
- Trace: 1 source ref; docs/contracts/live-run-invocation.md:24

##### claim-docs-contracts-live-run-invocation-md-58

- Summary: For `persona_prompt`, the product owns the loop boundary, the request packet, the persona prompt shaping, and the result normalization.
- Current labels: audience=developer; proof=deterministic; readiness=ready-to-verify; evidence=unknown
- Suggested next action: Add or connect deterministic live-run invocation tests proving the persona_prompt packet, loop boundary, persona shaping, result normalization, and adapter-owned backend command handoff.
- Human claim quality: [ ] keep [ ] merge [ ] split [ ] reword [ ] drop [ ] unsure
- Human corrected audience: [ ] keep [ ] user [ ] developer [ ] unclear
- Human corrected semantic group: [ ] keep [ ] Adapter and portability [ ] Agent and skill workflow [ ] Claim discovery and review [ ] Documentation and contracts [ ] Evaluation surfaces [ ] General product behavior [ ] Improvement and optimization [ ] Packets and reporting [ ] Quality gates [ ] Release and packaging [ ] other:
- Human corrected proof: [ ] keep [ ] human-auditable [ ] deterministic [ ] cautilus-eval
- Human readiness: [ ] keep [ ] ready-to-verify [ ] needs-scenario [ ] needs-alignment [ ] blocked
- Human priority: [ ] high [ ] medium [ ] low [ ] later [ ] unsure
- Human notes:
- Trace: 1 source ref; docs/contracts/live-run-invocation.md:58

##### claim-docs-contracts-live-run-invocation-md-59

- Summary: The adapter still owns backend selection and provider-specific flags through the simulator command template.
- Current labels: audience=developer; proof=deterministic; readiness=ready-to-verify; evidence=unknown
- Suggested next action: Keep or add a repo-owned unit, lint, build, schema, or CI check for this claim.
- Human claim quality: [ ] keep [ ] merge [ ] split [ ] reword [ ] drop [ ] unsure
- Human corrected audience: [ ] keep [ ] user [ ] developer [ ] unclear
- Human corrected semantic group: [ ] keep [ ] Adapter and portability [ ] Agent and skill workflow [ ] Claim discovery and review [ ] Documentation and contracts [ ] Evaluation surfaces [ ] General product behavior [ ] Improvement and optimization [ ] Packets and reporting [ ] Quality gates [ ] Release and packaging [ ] other:
- Human corrected proof: [ ] keep [ ] human-auditable [ ] deterministic [ ] cautilus-eval
- Human readiness: [ ] keep [ ] ready-to-verify [ ] needs-scenario [ ] needs-alignment [ ] blocked
- Human priority: [ ] high [ ] medium [ ] low [ ] later [ ] unsure
- Human notes:
- Trace: 1 source ref; docs/contracts/live-run-invocation.md:59

##### claim-docs-contracts-runner-readiness-md-118

- Summary: It should present next branches such as initialize adapter, refresh claim state, create runner assessment, run runner smoke, inspect existing claim map, or run eval.
- Current labels: audience=developer; proof=deterministic; readiness=ready-to-verify; evidence=unknown
- Suggested next action: Add or connect deterministic agent-status tests for initialize-adapter, refresh-claim-state, runner-assessment, runner-smoke, inspect-claims, and run-eval branch exposure.
- Human claim quality: [ ] keep [ ] merge [ ] split [ ] reword [ ] drop [ ] unsure
- Human corrected audience: [ ] keep [ ] user [ ] developer [ ] unclear
- Human corrected semantic group: [ ] keep [ ] Adapter and portability [ ] Agent and skill workflow [ ] Claim discovery and review [ ] Documentation and contracts [ ] Evaluation surfaces [ ] General product behavior [ ] Improvement and optimization [ ] Packets and reporting [ ] Quality gates [ ] Release and packaging [ ] other:
- Human corrected proof: [ ] keep [ ] human-auditable [ ] deterministic [ ] cautilus-eval
- Human readiness: [ ] keep [ ] ready-to-verify [ ] needs-scenario [ ] needs-alignment [ ] blocked
- Human priority: [ ] high [ ] medium [ ] low [ ] later [ ] unsure
- Human notes:
- Trace: 1 source ref; docs/contracts/runner-readiness.md:118

##### claim-docs-contracts-runner-readiness-md-198

- Summary: If the current git commit differs from `repoCommit` but the adapter and listed runner file hashes still match, `doctor` and `agent status` should expose the drift as assessment provenance without marking the assessment stale.
- Current labels: audience=developer; proof=deterministic; readiness=ready-to-verify; evidence=unknown
- Suggested next action: Add or connect deterministic runner-readiness tests proving commit drift is shown as provenance and does not make the assessment stale when adapter and runner file hashes still match.
- Human claim quality: [ ] keep [ ] merge [ ] split [ ] reword [ ] drop [ ] unsure
- Human corrected audience: [ ] keep [ ] user [ ] developer [ ] unclear
- Human corrected semantic group: [ ] keep [ ] Adapter and portability [ ] Agent and skill workflow [ ] Claim discovery and review [ ] Documentation and contracts [ ] Evaluation surfaces [ ] General product behavior [ ] Improvement and optimization [ ] Packets and reporting [ ] Quality gates [ ] Release and packaging [ ] other:
- Human corrected proof: [ ] keep [ ] human-auditable [ ] deterministic [ ] cautilus-eval
- Human readiness: [ ] keep [ ] ready-to-verify [ ] needs-scenario [ ] needs-alignment [ ] blocked
- Human priority: [ ] high [ ] medium [ ] low [ ] later [ ] unsure
- Human notes:
- Trace: 1 source ref; docs/contracts/runner-readiness.md:198

##### claim-docs-contracts-runner-readiness-md-347

- Summary: The skill may guide runner creation, but reusable deterministic behavior belongs in code, adapters, packets, and tests.
- Current labels: audience=developer; proof=deterministic; readiness=ready-to-verify; evidence=unknown
- Suggested next action: Keep or add a repo-owned unit, lint, build, schema, or CI check for this claim.
- Human claim quality: [ ] keep [ ] merge [ ] split [ ] reword [ ] drop [ ] unsure
- Human corrected audience: [ ] keep [ ] user [ ] developer [ ] unclear
- Human corrected semantic group: [ ] keep [ ] Adapter and portability [ ] Agent and skill workflow [ ] Claim discovery and review [ ] Documentation and contracts [ ] Evaluation surfaces [ ] General product behavior [ ] Improvement and optimization [ ] Packets and reporting [ ] Quality gates [ ] Release and packaging [ ] other:
- Human corrected proof: [ ] keep [ ] human-auditable [ ] deterministic [ ] cautilus-eval
- Human readiness: [ ] keep [ ] ready-to-verify [ ] needs-scenario [ ] needs-alignment [ ] blocked
- Human priority: [ ] high [ ] medium [ ] low [ ] later [ ] unsure
- Human notes:
- Trace: 1 source ref; docs/contracts/runner-readiness.md:347

##### claim-docs-contracts-runtime-fingerprint-optimization-md-34

- Summary: Adapter command templates may still pin a model when the evaluated product explicitly requires one.
- Current labels: audience=developer; proof=deterministic; readiness=ready-to-verify; evidence=unknown
- Suggested next action: Keep or add a repo-owned unit, lint, build, schema, or CI check for this claim.
- Human claim quality: [ ] keep [ ] merge [ ] split [ ] reword [ ] drop [ ] unsure
- Human corrected audience: [ ] keep [ ] user [ ] developer [ ] unclear
- Human corrected semantic group: [ ] keep [ ] Adapter and portability [ ] Agent and skill workflow [ ] Claim discovery and review [ ] Documentation and contracts [ ] Evaluation surfaces [ ] General product behavior [ ] Improvement and optimization [ ] Packets and reporting [ ] Quality gates [ ] Release and packaging [ ] other:
- Human corrected proof: [ ] keep [ ] human-auditable [ ] deterministic [ ] cautilus-eval
- Human readiness: [ ] keep [ ] ready-to-verify [ ] needs-scenario [ ] needs-alignment [ ] blocked
- Human priority: [ ] high [ ] medium [ ] low [ ] later [ ] unsure
- Human notes:
- Trace: 1 source ref; docs/contracts/runtime-fingerprint-optimization.md:34

##### claim-docs-contracts-runtime-fingerprint-optimization-md-42

- Summary: Runtime identity must come from explicit machine-readable runner output, adapter-provided metadata, or a checked-in wrapper.
- Current labels: audience=developer; proof=deterministic; readiness=ready-to-verify; evidence=unknown
- Suggested next action: Keep or add deterministic packet schema, command-output, or golden-file proof for this claim.
- Human claim quality: [ ] keep [ ] merge [ ] split [ ] reword [ ] drop [ ] unsure
- Human corrected audience: [ ] keep [ ] user [ ] developer [ ] unclear
- Human corrected semantic group: [ ] keep [ ] Adapter and portability [ ] Agent and skill workflow [ ] Claim discovery and review [ ] Documentation and contracts [ ] Evaluation surfaces [ ] General product behavior [ ] Improvement and optimization [ ] Packets and reporting [ ] Quality gates [ ] Release and packaging [ ] other:
- Human corrected proof: [ ] keep [ ] human-auditable [ ] deterministic [ ] cautilus-eval
- Human readiness: [ ] keep [ ] ready-to-verify [ ] needs-scenario [ ] needs-alignment [ ] blocked
- Human priority: [ ] high [ ] medium [ ] low [ ] later [ ] unsure
- Human notes:
- Trace: 1 source ref; docs/contracts/runtime-fingerprint-optimization.md:42

##### claim-docs-contracts-workbench-instance-discovery-md-100

- Summary: The product can render a human-facing instance chooser without learning consumer-native labels itself.
- Current labels: audience=developer; proof=deterministic; readiness=ready-to-verify; evidence=unknown
- Suggested next action: Add or connect deterministic instance-chooser rendering proof, or defer the claim if the workbench UI remains future work.
- Human claim quality: [ ] keep [ ] merge [ ] split [ ] reword [ ] drop [ ] unsure
- Human corrected audience: [ ] keep [ ] user [ ] developer [ ] unclear
- Human corrected semantic group: [ ] keep [ ] Adapter and portability [ ] Agent and skill workflow [ ] Claim discovery and review [ ] Documentation and contracts [ ] Evaluation surfaces [ ] General product behavior [ ] Improvement and optimization [ ] Packets and reporting [ ] Quality gates [ ] Release and packaging [ ] other:
- Human corrected proof: [ ] keep [ ] human-auditable [ ] deterministic [ ] cautilus-eval
- Human readiness: [ ] keep [ ] ready-to-verify [ ] needs-scenario [ ] needs-alignment [ ] blocked
- Human priority: [ ] high [ ] medium [ ] low [ ] later [ ] unsure
- Human notes:
- Trace: 1 source ref; docs/contracts/workbench-instance-discovery.md:100

##### claim-docs-contracts-workbench-instance-discovery-md-101

- Summary: The product can read scenario-adjacent paths from typed packet fields instead of hardcoded route templates.
- Current labels: audience=developer; proof=deterministic; readiness=ready-to-verify; evidence=unknown
- Suggested next action: Add or connect deterministic tests proving scenario-adjacent paths come from typed packet fields rather than hardcoded route templates.
- Human claim quality: [ ] keep [ ] merge [ ] split [ ] reword [ ] drop [ ] unsure
- Human corrected audience: [ ] keep [ ] user [ ] developer [ ] unclear
- Human corrected semantic group: [ ] keep [ ] Adapter and portability [ ] Agent and skill workflow [ ] Claim discovery and review [ ] Documentation and contracts [ ] Evaluation surfaces [ ] General product behavior [ ] Improvement and optimization [ ] Packets and reporting [ ] Quality gates [ ] Release and packaging [ ] other:
- Human corrected proof: [ ] keep [ ] human-auditable [ ] deterministic [ ] cautilus-eval
- Human readiness: [ ] keep [ ] ready-to-verify [ ] needs-scenario [ ] needs-alignment [ ] blocked
- Human priority: [ ] high [ ] medium [ ] low [ ] later [ ] unsure
- Human notes:
- Trace: 1 source ref; docs/contracts/workbench-instance-discovery.md:101

##### claim-docs-contracts-workbench-instance-discovery-md-25

- Summary: Every instance must expose a stable `instanceId` and a human-facing `displayLabel`.
- Current labels: audience=developer; proof=deterministic; readiness=ready-to-verify; evidence=unknown
- Suggested next action: Add or connect adapter/packet validation for stable `instanceId` and human-facing `displayLabel` fields.
- Human claim quality: [ ] keep [ ] merge [ ] split [ ] reword [ ] drop [ ] unsure
- Human corrected audience: [ ] keep [ ] user [ ] developer [ ] unclear
- Human corrected semantic group: [ ] keep [ ] Adapter and portability [ ] Agent and skill workflow [ ] Claim discovery and review [ ] Documentation and contracts [ ] Evaluation surfaces [ ] General product behavior [ ] Improvement and optimization [ ] Packets and reporting [ ] Quality gates [ ] Release and packaging [ ] other:
- Human corrected proof: [ ] keep [ ] human-auditable [ ] deterministic [ ] cautilus-eval
- Human readiness: [ ] keep [ ] ready-to-verify [ ] needs-scenario [ ] needs-alignment [ ] blocked
- Human priority: [ ] high [ ] medium [ ] low [ ] later [ ] unsure
- Human notes:
- Trace: 1 source ref; docs/contracts/workbench-instance-discovery.md:25

##### claim-docs-specs-maintainer-adapter-host-ownership-spec-md-18

- Summary: This boundary should be proven with adapter contract tests and consumer dogfood rather than by prose alone.
- Current labels: audience=developer; proof=deterministic; readiness=ready-to-verify; evidence=unknown
- Suggested next action: Keep or add a repo-owned unit, lint, build, schema, or CI check for this claim.
- Human claim quality: [ ] keep [ ] merge [ ] split [ ] reword [ ] drop [ ] unsure
- Human corrected audience: [ ] keep [ ] user [ ] developer [ ] unclear
- Human corrected semantic group: [ ] keep [ ] Adapter and portability [ ] Agent and skill workflow [ ] Claim discovery and review [ ] Documentation and contracts [ ] Evaluation surfaces [ ] General product behavior [ ] Improvement and optimization [ ] Packets and reporting [ ] Quality gates [ ] Release and packaging [ ] other:
- Human corrected proof: [ ] keep [ ] human-auditable [ ] deterministic [ ] cautilus-eval
- Human readiness: [ ] keep [ ] ready-to-verify [ ] needs-scenario [ ] needs-alignment [ ] blocked
- Human priority: [ ] high [ ] medium [ ] low [ ] later [ ] unsure
- Human notes:
- Trace: 1 source ref; docs/specs/maintainer/adapter-host-ownership.spec.md:18

#### Human-auditable / needs-alignment / evidence unknown (6)

##### claim-docs-contracts-claim-discovery-workflow-md-628

- Summary: The binary/skill boundary stays clean enough that consumer repos can use the binary plus bundled skill without Cautilus importing host-specific prompts or adapters.
- Current labels: audience=developer; proof=human-auditable; readiness=needs-alignment; evidence=unknown
- Suggested next action: Reconcile or cite the matching adapter, CLI, docs, and test surfaces before treating this as satisfied.
- Human claim quality: [ ] keep [ ] merge [ ] split [ ] reword [ ] drop [ ] unsure
- Human corrected audience: [ ] keep [ ] user [ ] developer [ ] unclear
- Human corrected semantic group: [ ] keep [ ] Adapter and portability [ ] Agent and skill workflow [ ] Claim discovery and review [ ] Documentation and contracts [ ] Evaluation surfaces [ ] General product behavior [ ] Improvement and optimization [ ] Packets and reporting [ ] Quality gates [ ] Release and packaging [ ] other:
- Human corrected proof: [ ] keep [ ] human-auditable [ ] deterministic [ ] cautilus-eval
- Human readiness: [ ] keep [ ] ready-to-verify [ ] needs-scenario [ ] needs-alignment [ ] blocked
- Human priority: [ ] high [ ] medium [ ] low [ ] later [ ] unsure
- Human notes:
- Trace: 1 source ref; docs/contracts/claim-discovery-workflow.md:628

##### claim-docs-contracts-live-run-invocation-batch-md-28

- Summary: Raw provider-error interpretation stays consumer-owned.
- Current labels: audience=developer; proof=human-auditable; readiness=needs-alignment; evidence=unknown
- Suggested next action: Confirm the provider-error ownership boundary against live-run packets and adapter docs; split concrete schema checks if needed.
- Human claim quality: [ ] keep [ ] merge [ ] split [ ] reword [ ] drop [ ] unsure
- Human corrected audience: [ ] keep [ ] user [ ] developer [ ] unclear
- Human corrected semantic group: [ ] keep [ ] Adapter and portability [ ] Agent and skill workflow [ ] Claim discovery and review [ ] Documentation and contracts [ ] Evaluation surfaces [ ] General product behavior [ ] Improvement and optimization [ ] Packets and reporting [ ] Quality gates [ ] Release and packaging [ ] other:
- Human corrected proof: [ ] keep [ ] human-auditable [ ] deterministic [ ] cautilus-eval
- Human readiness: [ ] keep [ ] ready-to-verify [ ] needs-scenario [ ] needs-alignment [ ] blocked
- Human priority: [ ] high [ ] medium [ ] low [ ] later [ ] unsure
- Human notes:
- Trace: 1 source ref; docs/contracts/live-run-invocation-batch.md:28

##### claim-docs-contracts-live-run-invocation-md-160

- Summary: The workspace directory contents stay consumer-owned even when `Cautilus` owns the directory allocation and one-time prepare timing.
- Current labels: audience=developer; proof=human-auditable; readiness=needs-alignment; evidence=unknown
- Suggested next action: Human-confirm which workspace contents are product-owned versus consumer-owned, then split any observable no-write guarantees into deterministic tests.
- Human claim quality: [ ] keep [ ] merge [ ] split [ ] reword [ ] drop [ ] unsure
- Human corrected audience: [ ] keep [ ] user [ ] developer [ ] unclear
- Human corrected semantic group: [ ] keep [ ] Adapter and portability [ ] Agent and skill workflow [ ] Claim discovery and review [ ] Documentation and contracts [ ] Evaluation surfaces [ ] General product behavior [ ] Improvement and optimization [ ] Packets and reporting [ ] Quality gates [ ] Release and packaging [ ] other:
- Human corrected proof: [ ] keep [ ] human-auditable [ ] deterministic [ ] cautilus-eval
- Human readiness: [ ] keep [ ] ready-to-verify [ ] needs-scenario [ ] needs-alignment [ ] blocked
- Human priority: [ ] high [ ] medium [ ] low [ ] later [ ] unsure
- Human notes:
- Trace: 1 source ref; docs/contracts/live-run-invocation.md:160

##### claim-docs-master-plan-md-29

- Summary: Cautilus owns the generic claim-to-proof workflow; consumer repos own their local fixtures, runners, prompts, wrappers, and policy.
- Current labels: audience=developer; proof=human-auditable; readiness=needs-alignment; evidence=unknown
- Suggested next action: Human-review the Cautilus-versus-consumer ownership boundary and split executable subclaims into deterministic or eval proof.
- Human claim quality: [ ] keep [ ] merge [ ] split [ ] reword [ ] drop [ ] unsure
- Human corrected audience: [ ] keep [ ] user [ ] developer [ ] unclear
- Human corrected semantic group: [ ] keep [ ] Adapter and portability [ ] Agent and skill workflow [ ] Claim discovery and review [ ] Documentation and contracts [ ] Evaluation surfaces [ ] General product behavior [ ] Improvement and optimization [ ] Packets and reporting [ ] Quality gates [ ] Release and packaging [ ] other:
- Human corrected proof: [ ] keep [ ] human-auditable [ ] deterministic [ ] cautilus-eval
- Human readiness: [ ] keep [ ] ready-to-verify [ ] needs-scenario [ ] needs-alignment [ ] blocked
- Human priority: [ ] high [ ] medium [ ] low [ ] later [ ] unsure
- Human notes:
- Trace: 1 source ref; docs/master-plan.md:29

##### claim-docs-specs-maintainer-adapter-host-ownership-spec-md-14

- Summary: The host repo owns prompts, runners, credentials, model or backend selection, fixtures, and policy.
- Current labels: audience=developer; proof=human-auditable; readiness=needs-alignment; evidence=unknown
- Suggested next action: Reconcile or cite the matching adapter, CLI, docs, and test surfaces before treating this as satisfied.
- Human claim quality: [ ] keep [ ] merge [ ] split [ ] reword [ ] drop [ ] unsure
- Human corrected audience: [ ] keep [ ] user [ ] developer [ ] unclear
- Human corrected semantic group: [ ] keep [ ] Adapter and portability [ ] Agent and skill workflow [ ] Claim discovery and review [ ] Documentation and contracts [ ] Evaluation surfaces [ ] General product behavior [ ] Improvement and optimization [ ] Packets and reporting [ ] Quality gates [ ] Release and packaging [ ] other:
- Human corrected proof: [ ] keep [ ] human-auditable [ ] deterministic [ ] cautilus-eval
- Human readiness: [ ] keep [ ] ready-to-verify [ ] needs-scenario [ ] needs-alignment [ ] blocked
- Human priority: [ ] high [ ] medium [ ] low [ ] later [ ] unsure
- Human notes:
- Trace: 1 source ref; docs/specs/maintainer/adapter-host-ownership.spec.md:14

##### claim-docs-specs-maintainer-live-invocation-runtime-spec-md-14

- Summary: The host-owned adapter still owns provider calls, backend flags, route layout, model choice, credentials, and product-specific response semantics.
- Current labels: audience=developer; proof=human-auditable; readiness=needs-alignment; evidence=unknown
- Suggested next action: Reconcile or cite the matching adapter, CLI, docs, and test surfaces before treating this as satisfied.
- Human claim quality: [ ] keep [ ] merge [ ] split [ ] reword [ ] drop [ ] unsure
- Human corrected audience: [ ] keep [ ] user [ ] developer [ ] unclear
- Human corrected semantic group: [ ] keep [ ] Adapter and portability [ ] Agent and skill workflow [ ] Claim discovery and review [ ] Documentation and contracts [ ] Evaluation surfaces [ ] General product behavior [ ] Improvement and optimization [ ] Packets and reporting [ ] Quality gates [ ] Release and packaging [ ] other:
- Human corrected proof: [ ] keep [ ] human-auditable [ ] deterministic [ ] cautilus-eval
- Human readiness: [ ] keep [ ] ready-to-verify [ ] needs-scenario [ ] needs-alignment [ ] blocked
- Human priority: [ ] high [ ] medium [ ] low [ ] later [ ] unsure
- Human notes:
- Trace: 1 source ref; docs/specs/maintainer/live-invocation-runtime.spec.md:14

#### Human-auditable / ready-to-verify / evidence unknown (1)

##### claim-docs-contracts-claim-discovery-workflow-md-92

- Summary: In other repos, the same rule should be driven by the repo's adapter, README, and source docs rather than by Cautilus-specific command names.
- Current labels: audience=developer; proof=human-auditable; readiness=ready-to-verify; evidence=unknown
- Suggested next action: Attach at least one supporting evidence item, or split/defer the claim if no concrete evidence would make the human judgment honest.
- Human claim quality: [ ] keep [ ] merge [ ] split [ ] reword [ ] drop [ ] unsure
- Human corrected audience: [ ] keep [ ] user [ ] developer [ ] unclear
- Human corrected semantic group: [ ] keep [ ] Adapter and portability [ ] Agent and skill workflow [ ] Claim discovery and review [ ] Documentation and contracts [ ] Evaluation surfaces [ ] General product behavior [ ] Improvement and optimization [ ] Packets and reporting [ ] Quality gates [ ] Release and packaging [ ] other:
- Human corrected proof: [ ] keep [ ] human-auditable [ ] deterministic [ ] cautilus-eval
- Human readiness: [ ] keep [ ] ready-to-verify [ ] needs-scenario [ ] needs-alignment [ ] blocked
- Human priority: [ ] high [ ] medium [ ] low [ ] later [ ] unsure
- Human notes:
- Trace: 1 source ref; docs/contracts/claim-discovery-workflow.md:92

### Agent and skill workflow (55)

#### Cautilus eval / app/prompt / ready-to-verify / evidence unknown (1)

##### claim-docs-contracts-claim-discovery-workflow-md-60

- Summary: The binary must not own LLM provider selection, subagent scheduling, model prompts, review policy, or human conversation.
- Current labels: audience=developer; proof=cautilus-eval; eval surface=app/prompt; readiness=ready-to-verify; evidence=unknown
- Suggested next action: Create a host-owned app/prompt fixture and run it through cautilus eval test.
- Human claim quality: [ ] keep [ ] merge [ ] split [ ] reword [ ] drop [ ] unsure
- Human corrected audience: [ ] keep [ ] user [ ] developer [ ] unclear
- Human corrected semantic group: [ ] keep [ ] Adapter and portability [ ] Agent and skill workflow [ ] Claim discovery and review [ ] Documentation and contracts [ ] Evaluation surfaces [ ] General product behavior [ ] Improvement and optimization [ ] Packets and reporting [ ] Quality gates [ ] Release and packaging [ ] other:
- Human corrected proof: [ ] keep [ ] human-auditable [ ] deterministic [ ] cautilus-eval
- Human corrected eval surface: [ ] keep [ ] dev/repo [ ] dev/skill [ ] app/chat [ ] app/prompt [ ] surface undecided
- Human readiness: [ ] keep [ ] ready-to-verify [ ] needs-scenario [ ] needs-alignment [ ] blocked
- Human priority: [ ] high [ ] medium [ ] low [ ] later [ ] unsure
- Human notes:
- Trace: 1 source ref; docs/contracts/claim-discovery-workflow.md:60

#### Cautilus eval / dev/repo / ready-to-verify / evidence unknown (10)

##### claim-docs-contracts-claim-discovery-workflow-md-196

- Summary: After confirmation, the binary should record the effective scope in the packet so a future agent can reproduce or refresh the run.
- Current labels: audience=developer; proof=cautilus-eval; eval surface=dev/repo; readiness=ready-to-verify; evidence=unknown
- Suggested next action: Create a host-owned dev/repo fixture and run it through cautilus eval test.
- Human claim quality: [ ] keep [ ] merge [ ] split [ ] reword [ ] drop [ ] unsure
- Human corrected audience: [ ] keep [ ] user [ ] developer [ ] unclear
- Human corrected semantic group: [ ] keep [ ] Adapter and portability [ ] Agent and skill workflow [ ] Claim discovery and review [ ] Documentation and contracts [ ] Evaluation surfaces [ ] General product behavior [ ] Improvement and optimization [ ] Packets and reporting [ ] Quality gates [ ] Release and packaging [ ] other:
- Human corrected proof: [ ] keep [ ] human-auditable [ ] deterministic [ ] cautilus-eval
- Human corrected eval surface: [ ] keep [ ] dev/repo [ ] dev/skill [ ] app/chat [ ] app/prompt [ ] surface undecided
- Human readiness: [ ] keep [ ] ready-to-verify [ ] needs-scenario [ ] needs-alignment [ ] blocked
- Human priority: [ ] high [ ] medium [ ] low [ ] later [ ] unsure
- Human notes:
- Trace: 1 source ref; docs/contracts/claim-discovery-workflow.md:196

##### claim-docs-contracts-claim-discovery-workflow-md-310

- Summary: Agents and validators must read the split fields directly instead of deriving a compatibility label.
- Current labels: audience=developer; proof=cautilus-eval; eval surface=dev/repo; readiness=ready-to-verify; evidence=unknown
- Suggested next action: Create a host-owned dev/repo fixture and run it through cautilus eval test.
- Human claim quality: [ ] keep [ ] merge [ ] split [ ] reword [ ] drop [ ] unsure
- Human corrected audience: [ ] keep [ ] user [ ] developer [ ] unclear
- Human corrected semantic group: [ ] keep [ ] Adapter and portability [ ] Agent and skill workflow [ ] Claim discovery and review [ ] Documentation and contracts [ ] Evaluation surfaces [ ] General product behavior [ ] Improvement and optimization [ ] Packets and reporting [ ] Quality gates [ ] Release and packaging [ ] other:
- Human corrected proof: [ ] keep [ ] human-auditable [ ] deterministic [ ] cautilus-eval
- Human corrected eval surface: [ ] keep [ ] dev/repo [ ] dev/skill [ ] app/chat [ ] app/prompt [ ] surface undecided
- Human readiness: [ ] keep [ ] ready-to-verify [ ] needs-scenario [ ] needs-alignment [ ] blocked
- Human priority: [ ] high [ ] medium [ ] low [ ] later [ ] unsure
- Human notes:
- Trace: 1 source ref; docs/contracts/claim-discovery-workflow.md:310

##### claim-docs-contracts-claim-discovery-workflow-md-461

- Summary: The refresh-plan packet should include a coordinator-facing summary rather than requiring every agent to reverse-engineer raw JSON fields:
- Current labels: audience=developer; proof=cautilus-eval; eval surface=dev/repo; readiness=ready-to-verify; evidence=unknown
- Suggested next action: Create a host-owned dev/repo fixture and run it through cautilus eval test.
- Human claim quality: [ ] keep [ ] merge [ ] split [ ] reword [ ] drop [ ] unsure
- Human corrected audience: [ ] keep [ ] user [ ] developer [ ] unclear
- Human corrected semantic group: [ ] keep [ ] Adapter and portability [ ] Agent and skill workflow [ ] Claim discovery and review [ ] Documentation and contracts [ ] Evaluation surfaces [ ] General product behavior [ ] Improvement and optimization [ ] Packets and reporting [ ] Quality gates [ ] Release and packaging [ ] other:
- Human corrected proof: [ ] keep [ ] human-auditable [ ] deterministic [ ] cautilus-eval
- Human corrected eval surface: [ ] keep [ ] dev/repo [ ] dev/skill [ ] app/chat [ ] app/prompt [ ] surface undecided
- Human readiness: [ ] keep [ ] ready-to-verify [ ] needs-scenario [ ] needs-alignment [ ] blocked
- Human priority: [ ] high [ ] medium [ ] low [ ] later [ ] unsure
- Human notes:
- Trace: 1 source ref; docs/contracts/claim-discovery-workflow.md:461

##### claim-docs-contracts-claim-discovery-workflow-md-520

- Summary: Each action bucket should include `byReviewStatus` and `byEvidenceStatus` counts so a human can tell whether the queue is already reviewed enough to spend time on or still needs agent triage first.
- Current labels: audience=developer; proof=cautilus-eval; eval surface=dev/repo; readiness=ready-to-verify; evidence=unknown
- Suggested next action: Create a host-owned dev/repo fixture and run it through cautilus eval test.
- Human claim quality: [ ] keep [ ] merge [ ] split [ ] reword [ ] drop [ ] unsure
- Human corrected audience: [ ] keep [ ] user [ ] developer [ ] unclear
- Human corrected semantic group: [ ] keep [ ] Adapter and portability [ ] Agent and skill workflow [ ] Claim discovery and review [ ] Documentation and contracts [ ] Evaluation surfaces [ ] General product behavior [ ] Improvement and optimization [ ] Packets and reporting [ ] Quality gates [ ] Release and packaging [ ] other:
- Human corrected proof: [ ] keep [ ] human-auditable [ ] deterministic [ ] cautilus-eval
- Human corrected eval surface: [ ] keep [ ] dev/repo [ ] dev/skill [ ] app/chat [ ] app/prompt [ ] surface undecided
- Human readiness: [ ] keep [ ] ready-to-verify [ ] needs-scenario [ ] needs-alignment [ ] blocked
- Human priority: [ ] high [ ] medium [ ] low [ ] later [ ] unsure
- Human notes:
- Trace: 1 source ref; docs/contracts/claim-discovery-workflow.md:520

##### claim-docs-contracts-claim-discovery-workflow-md-78

- Summary: This keeps the product agent-first without making the binary a host-specific agent runtime.
- Current labels: audience=developer; proof=cautilus-eval; eval surface=dev/repo; readiness=ready-to-verify; evidence=unknown
- Suggested next action: Create a host-owned dev/repo fixture and run it through cautilus eval test.
- Human claim quality: [ ] keep [ ] merge [ ] split [ ] reword [ ] drop [ ] unsure
- Human corrected audience: [ ] keep [ ] user [ ] developer [ ] unclear
- Human corrected semantic group: [ ] keep [ ] Adapter and portability [ ] Agent and skill workflow [ ] Claim discovery and review [ ] Documentation and contracts [ ] Evaluation surfaces [ ] General product behavior [ ] Improvement and optimization [ ] Packets and reporting [ ] Quality gates [ ] Release and packaging [ ] other:
- Human corrected proof: [ ] keep [ ] human-auditable [ ] deterministic [ ] cautilus-eval
- Human corrected eval surface: [ ] keep [ ] dev/repo [ ] dev/skill [ ] app/chat [ ] app/prompt [ ] surface undecided
- Human readiness: [ ] keep [ ] ready-to-verify [ ] needs-scenario [ ] needs-alignment [ ] blocked
- Human priority: [ ] high [ ] medium [ ] low [ ] later [ ] unsure
- Human notes:
- Trace: 1 source ref; docs/contracts/claim-discovery-workflow.md:78

##### claim-docs-contracts-runner-readiness-md-397

- Summary: Treating `agent status` branch labels as a fourth product workflow is over-worry once the branch ordering keeps ownership visible and status remains read-only.
- Current labels: audience=developer; proof=cautilus-eval; eval surface=dev/repo; readiness=ready-to-verify; evidence=unknown
- Suggested next action: Create a host-owned dev/repo fixture and run it through cautilus eval test.
- Human claim quality: [ ] keep [ ] merge [ ] split [ ] reword [ ] drop [ ] unsure
- Human corrected audience: [ ] keep [ ] user [ ] developer [ ] unclear
- Human corrected semantic group: [ ] keep [ ] Adapter and portability [ ] Agent and skill workflow [ ] Claim discovery and review [ ] Documentation and contracts [ ] Evaluation surfaces [ ] General product behavior [ ] Improvement and optimization [ ] Packets and reporting [ ] Quality gates [ ] Release and packaging [ ] other:
- Human corrected proof: [ ] keep [ ] human-auditable [ ] deterministic [ ] cautilus-eval
- Human corrected eval surface: [ ] keep [ ] dev/repo [ ] dev/skill [ ] app/chat [ ] app/prompt [ ] surface undecided
- Human readiness: [ ] keep [ ] ready-to-verify [ ] needs-scenario [ ] needs-alignment [ ] blocked
- Human priority: [ ] high [ ] medium [ ] low [ ] later [ ] unsure
- Human notes:
- Trace: 1 source ref; docs/contracts/runner-readiness.md:397

##### claim-docs-contracts-scenario-proposal-sources-md-236

- Summary: Human-facing views may derive a smaller attention set, but they should not hide the full ranked result from agents.
- Current labels: audience=developer; proof=cautilus-eval; eval surface=dev/repo; readiness=ready-to-verify; evidence=unknown
- Suggested next action: Create a host-owned dev/repo fixture and run it through cautilus eval test.
- Human claim quality: [ ] keep [ ] merge [ ] split [ ] reword [ ] drop [ ] unsure
- Human corrected audience: [ ] keep [ ] user [ ] developer [ ] unclear
- Human corrected semantic group: [ ] keep [ ] Adapter and portability [ ] Agent and skill workflow [ ] Claim discovery and review [ ] Documentation and contracts [ ] Evaluation surfaces [ ] General product behavior [ ] Improvement and optimization [ ] Packets and reporting [ ] Quality gates [ ] Release and packaging [ ] other:
- Human corrected proof: [ ] keep [ ] human-auditable [ ] deterministic [ ] cautilus-eval
- Human corrected eval surface: [ ] keep [ ] dev/repo [ ] dev/skill [ ] app/chat [ ] app/prompt [ ] surface undecided
- Human readiness: [ ] keep [ ] ready-to-verify [ ] needs-scenario [ ] needs-alignment [ ] blocked
- Human priority: [ ] high [ ] medium [ ] low [ ] later [ ] unsure
- Human notes:
- Trace: 1 source ref; docs/contracts/scenario-proposal-sources.md:236

##### claim-docs-master-plan-md-31

- Summary: The product surface should keep following the same discipline as `charness`: expose the user's intent at the public command boundary, keep tool-specific mechanics underneath it, and preserve durable artifacts that another agent can resume.
- Current labels: audience=developer; proof=cautilus-eval; eval surface=dev/repo; readiness=ready-to-verify; evidence=unknown
- Suggested next action: Create a host-owned dev/repo fixture and run it through cautilus eval test.
- Human claim quality: [ ] keep [ ] merge [ ] split [ ] reword [ ] drop [ ] unsure
- Human corrected audience: [ ] keep [ ] user [ ] developer [ ] unclear
- Human corrected semantic group: [ ] keep [ ] Adapter and portability [ ] Agent and skill workflow [ ] Claim discovery and review [ ] Documentation and contracts [ ] Evaluation surfaces [ ] General product behavior [ ] Improvement and optimization [ ] Packets and reporting [ ] Quality gates [ ] Release and packaging [ ] other:
- Human corrected proof: [ ] keep [ ] human-auditable [ ] deterministic [ ] cautilus-eval
- Human corrected eval surface: [ ] keep [ ] dev/repo [ ] dev/skill [ ] app/chat [ ] app/prompt [ ] surface undecided
- Human readiness: [ ] keep [ ] ready-to-verify [ ] needs-scenario [ ] needs-alignment [ ] blocked
- Human priority: [ ] high [ ] medium [ ] low [ ] later [ ] unsure
- Human notes:
- Trace: 1 source ref; docs/master-plan.md:31

##### claim-docs-specs-maintainer-active-run-workspace-spec-md-19

- Summary: It should not be folded into binary/skill responsibility unless the claim is specifically about agent routing.
- Current labels: audience=developer; proof=cautilus-eval; eval surface=dev/repo; readiness=ready-to-verify; evidence=unknown
- Suggested next action: Create a host-owned dev/repo fixture and run it through cautilus eval test.
- Human claim quality: [ ] keep [ ] merge [ ] split [ ] reword [ ] drop [ ] unsure
- Human corrected audience: [ ] keep [ ] user [ ] developer [ ] unclear
- Human corrected semantic group: [ ] keep [ ] Adapter and portability [ ] Agent and skill workflow [ ] Claim discovery and review [ ] Documentation and contracts [ ] Evaluation surfaces [ ] General product behavior [ ] Improvement and optimization [ ] Packets and reporting [ ] Quality gates [ ] Release and packaging [ ] other:
- Human corrected proof: [ ] keep [ ] human-auditable [ ] deterministic [ ] cautilus-eval
- Human corrected eval surface: [ ] keep [ ] dev/repo [ ] dev/skill [ ] app/chat [ ] app/prompt [ ] surface undecided
- Human readiness: [ ] keep [ ] ready-to-verify [ ] needs-scenario [ ] needs-alignment [ ] blocked
- Human priority: [ ] high [ ] medium [ ] low [ ] later [ ] unsure
- Human notes:
- Trace: 1 source ref; docs/specs/maintainer/active-run-workspace.spec.md:19

##### claim-docs-specs-maintainer-claim-discovery-workflow-spec-md-14

- Summary: It should prefer recall, preserve the scan boundary, and leave curation to packet-aware agent or maintainer review.
- Current labels: audience=developer; proof=cautilus-eval; eval surface=dev/repo; readiness=ready-to-verify; evidence=unknown
- Suggested next action: Create a host-owned dev/repo fixture and run it through cautilus eval test.
- Human claim quality: [ ] keep [ ] merge [ ] split [ ] reword [ ] drop [ ] unsure
- Human corrected audience: [ ] keep [ ] user [ ] developer [ ] unclear
- Human corrected semantic group: [ ] keep [ ] Adapter and portability [ ] Agent and skill workflow [ ] Claim discovery and review [ ] Documentation and contracts [ ] Evaluation surfaces [ ] General product behavior [ ] Improvement and optimization [ ] Packets and reporting [ ] Quality gates [ ] Release and packaging [ ] other:
- Human corrected proof: [ ] keep [ ] human-auditable [ ] deterministic [ ] cautilus-eval
- Human corrected eval surface: [ ] keep [ ] dev/repo [ ] dev/skill [ ] app/chat [ ] app/prompt [ ] surface undecided
- Human readiness: [ ] keep [ ] ready-to-verify [ ] needs-scenario [ ] needs-alignment [ ] blocked
- Human priority: [ ] high [ ] medium [ ] low [ ] later [ ] unsure
- Human notes:
- Trace: 1 source ref; docs/specs/maintainer/claim-discovery-workflow.spec.md:14

#### Cautilus eval / dev/skill / ready-to-verify / evidence unknown (17)

##### claim-docs-contracts-claim-discovery-workflow-md-186

- Summary: Before running a first broad scan, the skill should say which entries and depth it will use.
- Current labels: audience=developer; proof=cautilus-eval; eval surface=dev/skill; readiness=ready-to-verify; evidence=unknown
- Suggested next action: Create a host-owned dev/skill fixture and run it through cautilus eval test.
- Human claim quality: [ ] keep [ ] merge [ ] split [ ] reword [ ] drop [ ] unsure
- Human corrected audience: [ ] keep [ ] user [ ] developer [ ] unclear
- Human corrected semantic group: [ ] keep [ ] Adapter and portability [ ] Agent and skill workflow [ ] Claim discovery and review [ ] Documentation and contracts [ ] Evaluation surfaces [ ] General product behavior [ ] Improvement and optimization [ ] Packets and reporting [ ] Quality gates [ ] Release and packaging [ ] other:
- Human corrected proof: [ ] keep [ ] human-auditable [ ] deterministic [ ] cautilus-eval
- Human corrected eval surface: [ ] keep [ ] dev/repo [ ] dev/skill [ ] app/chat [ ] app/prompt [ ] surface undecided
- Human readiness: [ ] keep [ ] ready-to-verify [ ] needs-scenario [ ] needs-alignment [ ] blocked
- Human priority: [ ] high [ ] medium [ ] low [ ] later [ ] unsure
- Human notes:
- Trace: 1 source ref; docs/contracts/claim-discovery-workflow.md:186

##### claim-docs-contracts-claim-discovery-workflow-md-195

- Summary: The skill should ask the user to confirm or adjust that scope.
- Current labels: audience=developer; proof=cautilus-eval; eval surface=dev/skill; readiness=ready-to-verify; evidence=unknown
- Suggested next action: Create a host-owned dev/skill fixture and run it through cautilus eval test.
- Human claim quality: [ ] keep [ ] merge [ ] split [ ] reword [ ] drop [ ] unsure
- Human corrected audience: [ ] keep [ ] user [ ] developer [ ] unclear
- Human corrected semantic group: [ ] keep [ ] Adapter and portability [ ] Agent and skill workflow [ ] Claim discovery and review [ ] Documentation and contracts [ ] Evaluation surfaces [ ] General product behavior [ ] Improvement and optimization [ ] Packets and reporting [ ] Quality gates [ ] Release and packaging [ ] other:
- Human corrected proof: [ ] keep [ ] human-auditable [ ] deterministic [ ] cautilus-eval
- Human corrected eval surface: [ ] keep [ ] dev/repo [ ] dev/skill [ ] app/chat [ ] app/prompt [ ] surface undecided
- Human readiness: [ ] keep [ ] ready-to-verify [ ] needs-scenario [ ] needs-alignment [ ] blocked
- Human priority: [ ] high [ ] medium [ ] low [ ] later [ ] unsure
- Human notes:
- Trace: 1 source ref; docs/contracts/claim-discovery-workflow.md:195

##### claim-docs-contracts-claim-discovery-workflow-md-214

- Summary: The user should confirm or adjust that review budget before the skill launches subagents or other LLM-backed review.
- Current labels: audience=developer; proof=cautilus-eval; eval surface=dev/skill; readiness=ready-to-verify; evidence=unknown
- Suggested next action: Create a host-owned dev/skill fixture and run it through cautilus eval test.
- Human claim quality: [ ] keep [ ] merge [ ] split [ ] reword [ ] drop [ ] unsure
- Human corrected audience: [ ] keep [ ] user [ ] developer [ ] unclear
- Human corrected semantic group: [ ] keep [ ] Adapter and portability [ ] Agent and skill workflow [ ] Claim discovery and review [ ] Documentation and contracts [ ] Evaluation surfaces [ ] General product behavior [ ] Improvement and optimization [ ] Packets and reporting [ ] Quality gates [ ] Release and packaging [ ] other:
- Human corrected proof: [ ] keep [ ] human-auditable [ ] deterministic [ ] cautilus-eval
- Human corrected eval surface: [ ] keep [ ] dev/repo [ ] dev/skill [ ] app/chat [ ] app/prompt [ ] surface undecided
- Human readiness: [ ] keep [ ] ready-to-verify [ ] needs-scenario [ ] needs-alignment [ ] blocked
- Human priority: [ ] high [ ] medium [ ] low [ ] later [ ] unsure
- Human notes:
- Trace: 1 source ref; docs/contracts/claim-discovery-workflow.md:214

##### claim-docs-contracts-claim-discovery-workflow-md-215

- Summary: If the user already delegated autonomous continuation, the skill may proceed within the recorded budget, but the budget still must be written to the packet.
- Current labels: audience=developer; proof=cautilus-eval; eval surface=dev/skill; readiness=ready-to-verify; evidence=unknown
- Suggested next action: Create a host-owned dev/skill fixture and run it through cautilus eval test.
- Human claim quality: [ ] keep [ ] merge [ ] split [ ] reword [ ] drop [ ] unsure
- Human corrected audience: [ ] keep [ ] user [ ] developer [ ] unclear
- Human corrected semantic group: [ ] keep [ ] Adapter and portability [ ] Agent and skill workflow [ ] Claim discovery and review [ ] Documentation and contracts [ ] Evaluation surfaces [ ] General product behavior [ ] Improvement and optimization [ ] Packets and reporting [ ] Quality gates [ ] Release and packaging [ ] other:
- Human corrected proof: [ ] keep [ ] human-auditable [ ] deterministic [ ] cautilus-eval
- Human corrected eval surface: [ ] keep [ ] dev/repo [ ] dev/skill [ ] app/chat [ ] app/prompt [ ] surface undecided
- Human readiness: [ ] keep [ ] ready-to-verify [ ] needs-scenario [ ] needs-alignment [ ] blocked
- Human priority: [ ] high [ ] medium [ ] low [ ] later [ ] unsure
- Human notes:
- Trace: 1 source ref; docs/contracts/claim-discovery-workflow.md:215

##### claim-docs-contracts-claim-discovery-workflow-md-369

- Summary: The skill review can upgrade them to `satisfied`, `partial`, `stale`, or `missing` only when the packet semantics above are met.
- Current labels: audience=developer; proof=cautilus-eval; eval surface=dev/skill; readiness=ready-to-verify; evidence=unknown
- Suggested next action: Create a host-owned dev/skill fixture and run it through cautilus eval test.
- Human claim quality: [ ] keep [ ] merge [ ] split [ ] reword [ ] drop [ ] unsure
- Human corrected audience: [ ] keep [ ] user [ ] developer [ ] unclear
- Human corrected semantic group: [ ] keep [ ] Adapter and portability [ ] Agent and skill workflow [ ] Claim discovery and review [ ] Documentation and contracts [ ] Evaluation surfaces [ ] General product behavior [ ] Improvement and optimization [ ] Packets and reporting [ ] Quality gates [ ] Release and packaging [ ] other:
- Human corrected proof: [ ] keep [ ] human-auditable [ ] deterministic [ ] cautilus-eval
- Human corrected eval surface: [ ] keep [ ] dev/repo [ ] dev/skill [ ] app/chat [ ] app/prompt [ ] surface undecided
- Human readiness: [ ] keep [ ] ready-to-verify [ ] needs-scenario [ ] needs-alignment [ ] blocked
- Human priority: [ ] high [ ] medium [ ] low [ ] later [ ] unsure
- Human notes:
- Trace: 1 source ref; docs/contracts/claim-discovery-workflow.md:369

##### claim-docs-contracts-claim-discovery-workflow-md-386

- Summary: The skill should review clusters in priority order:
- Current labels: audience=developer; proof=cautilus-eval; eval surface=dev/skill; readiness=ready-to-verify; evidence=unknown
- Suggested next action: Create a host-owned dev/skill fixture and run it through cautilus eval test.
- Human claim quality: [ ] keep [ ] merge [ ] split [ ] reword [ ] drop [ ] unsure
- Human corrected audience: [ ] keep [ ] user [ ] developer [ ] unclear
- Human corrected semantic group: [ ] keep [ ] Adapter and portability [ ] Agent and skill workflow [ ] Claim discovery and review [ ] Documentation and contracts [ ] Evaluation surfaces [ ] General product behavior [ ] Improvement and optimization [ ] Packets and reporting [ ] Quality gates [ ] Release and packaging [ ] other:
- Human corrected proof: [ ] keep [ ] human-auditable [ ] deterministic [ ] cautilus-eval
- Human corrected eval surface: [ ] keep [ ] dev/repo [ ] dev/skill [ ] app/chat [ ] app/prompt [ ] surface undecided
- Human readiness: [ ] keep [ ] ready-to-verify [ ] needs-scenario [ ] needs-alignment [ ] blocked
- Human priority: [ ] high [ ] medium [ ] low [ ] later [ ] unsure
- Human notes:
- Trace: 1 source ref; docs/contracts/claim-discovery-workflow.md:386

##### claim-docs-contracts-claim-discovery-workflow-md-397

- Summary: The parent skill should merge results and keep review provenance in the packet.
- Current labels: audience=developer; proof=cautilus-eval; eval surface=dev/skill; readiness=ready-to-verify; evidence=unknown
- Suggested next action: Create a host-owned dev/skill fixture and run it through cautilus eval test.
- Human claim quality: [ ] keep [ ] merge [ ] split [ ] reword [ ] drop [ ] unsure
- Human corrected audience: [ ] keep [ ] user [ ] developer [ ] unclear
- Human corrected semantic group: [ ] keep [ ] Adapter and portability [ ] Agent and skill workflow [ ] Claim discovery and review [ ] Documentation and contracts [ ] Evaluation surfaces [ ] General product behavior [ ] Improvement and optimization [ ] Packets and reporting [ ] Quality gates [ ] Release and packaging [ ] other:
- Human corrected proof: [ ] keep [ ] human-auditable [ ] deterministic [ ] cautilus-eval
- Human corrected eval surface: [ ] keep [ ] dev/repo [ ] dev/skill [ ] app/chat [ ] app/prompt [ ] surface undecided
- Human readiness: [ ] keep [ ] ready-to-verify [ ] needs-scenario [ ] needs-alignment [ ] blocked
- Human priority: [ ] high [ ] medium [ ] low [ ] later [ ] unsure
- Human notes:
- Trace: 1 source ref; docs/contracts/claim-discovery-workflow.md:397

##### claim-docs-contracts-claim-discovery-workflow-md-476

- Summary: After discovery or refresh, the skill should report status in a compact decision-oriented shape:
- Current labels: audience=developer; proof=cautilus-eval; eval surface=dev/skill; readiness=ready-to-verify; evidence=unknown
- Suggested next action: Create a host-owned dev/skill fixture and run it through cautilus eval test.
- Human claim quality: [ ] keep [ ] merge [ ] split [ ] reword [ ] drop [ ] unsure
- Human corrected audience: [ ] keep [ ] user [ ] developer [ ] unclear
- Human corrected semantic group: [ ] keep [ ] Adapter and portability [ ] Agent and skill workflow [ ] Claim discovery and review [ ] Documentation and contracts [ ] Evaluation surfaces [ ] General product behavior [ ] Improvement and optimization [ ] Packets and reporting [ ] Quality gates [ ] Release and packaging [ ] other:
- Human corrected proof: [ ] keep [ ] human-auditable [ ] deterministic [ ] cautilus-eval
- Human corrected eval surface: [ ] keep [ ] dev/repo [ ] dev/skill [ ] app/chat [ ] app/prompt [ ] surface undecided
- Human readiness: [ ] keep [ ] ready-to-verify [ ] needs-scenario [ ] needs-alignment [ ] blocked
- Human priority: [ ] high [ ] medium [ ] low [ ] later [ ] unsure
- Human notes:
- Trace: 1 source ref; docs/contracts/claim-discovery-workflow.md:476

##### claim-docs-contracts-claim-discovery-workflow-md-500

- Summary: The skill should then ask the user which branch to take.
- Current labels: audience=developer; proof=cautilus-eval; eval surface=dev/skill; readiness=ready-to-verify; evidence=unknown
- Suggested next action: Create a host-owned dev/skill fixture and run it through cautilus eval test.
- Human claim quality: [ ] keep [ ] merge [ ] split [ ] reword [ ] drop [ ] unsure
- Human corrected audience: [ ] keep [ ] user [ ] developer [ ] unclear
- Human corrected semantic group: [ ] keep [ ] Adapter and portability [ ] Agent and skill workflow [ ] Claim discovery and review [ ] Documentation and contracts [ ] Evaluation surfaces [ ] General product behavior [ ] Improvement and optimization [ ] Packets and reporting [ ] Quality gates [ ] Release and packaging [ ] other:
- Human corrected proof: [ ] keep [ ] human-auditable [ ] deterministic [ ] cautilus-eval
- Human corrected eval surface: [ ] keep [ ] dev/repo [ ] dev/skill [ ] app/chat [ ] app/prompt [ ] surface undecided
- Human readiness: [ ] keep [ ] ready-to-verify [ ] needs-scenario [ ] needs-alignment [ ] blocked
- Human priority: [ ] high [ ] medium [ ] low [ ] later [ ] unsure
- Human notes:
- Trace: 1 source ref; docs/contracts/claim-discovery-workflow.md:500

##### claim-docs-contracts-claim-discovery-workflow-md-503

- Summary: The skill should not automatically launch expensive evaluator runs or broad code edits after status unless the user has already delegated that continuation and the recorded budget covers it.
- Current labels: audience=developer; proof=cautilus-eval; eval surface=dev/skill; readiness=ready-to-verify; evidence=unknown
- Suggested next action: Create a host-owned dev/skill fixture and run it through cautilus eval test.
- Human claim quality: [ ] keep [ ] merge [ ] split [ ] reword [ ] drop [ ] unsure
- Human corrected audience: [ ] keep [ ] user [ ] developer [ ] unclear
- Human corrected semantic group: [ ] keep [ ] Adapter and portability [ ] Agent and skill workflow [ ] Claim discovery and review [ ] Documentation and contracts [ ] Evaluation surfaces [ ] General product behavior [ ] Improvement and optimization [ ] Packets and reporting [ ] Quality gates [ ] Release and packaging [ ] other:
- Human corrected proof: [ ] keep [ ] human-auditable [ ] deterministic [ ] cautilus-eval
- Human corrected eval surface: [ ] keep [ ] dev/repo [ ] dev/skill [ ] app/chat [ ] app/prompt [ ] surface undecided
- Human readiness: [ ] keep [ ] ready-to-verify [ ] needs-scenario [ ] needs-alignment [ ] blocked
- Human priority: [ ] high [ ] medium [ ] low [ ] later [ ] unsure
- Human notes:
- Trace: 1 source ref; docs/contracts/claim-discovery-workflow.md:503

##### claim-docs-contracts-claim-discovery-workflow-md-602

- Summary: How much of the refresh-plan helper should ship in the first binary slice versus the first skill slice?
- Current labels: audience=developer; proof=cautilus-eval; eval surface=dev/skill; readiness=ready-to-verify; evidence=unknown
- Suggested next action: Create a host-owned dev/skill fixture and run it through cautilus eval test.
- Human claim quality: [ ] keep [ ] merge [ ] split [ ] reword [ ] drop [ ] unsure
- Human corrected audience: [ ] keep [ ] user [ ] developer [ ] unclear
- Human corrected semantic group: [ ] keep [ ] Adapter and portability [ ] Agent and skill workflow [ ] Claim discovery and review [ ] Documentation and contracts [ ] Evaluation surfaces [ ] General product behavior [ ] Improvement and optimization [ ] Packets and reporting [ ] Quality gates [ ] Release and packaging [ ] other:
- Human corrected proof: [ ] keep [ ] human-auditable [ ] deterministic [ ] cautilus-eval
- Human corrected eval surface: [ ] keep [ ] dev/repo [ ] dev/skill [ ] app/chat [ ] app/prompt [ ] surface undecided
- Human readiness: [ ] keep [ ] ready-to-verify [ ] needs-scenario [ ] needs-alignment [ ] blocked
- Human priority: [ ] high [ ] medium [ ] low [ ] later [ ] unsure
- Human notes:
- Trace: 1 source ref; docs/contracts/claim-discovery-workflow.md:602

##### claim-docs-contracts-claim-discovery-workflow-md-622

- Summary: A user can invoke the Cautilus skill without detailed input and get a clear status summary rather than a raw 500-claim dump.
- Current labels: audience=developer; proof=cautilus-eval; eval surface=dev/skill; readiness=ready-to-verify; evidence=unknown
- Suggested next action: Create a host-owned dev/skill fixture and run it through cautilus eval test.
- Human claim quality: [ ] keep [ ] merge [ ] split [ ] reword [ ] drop [ ] unsure
- Human corrected audience: [ ] keep [ ] user [ ] developer [ ] unclear
- Human corrected semantic group: [ ] keep [ ] Adapter and portability [ ] Agent and skill workflow [ ] Claim discovery and review [ ] Documentation and contracts [ ] Evaluation surfaces [ ] General product behavior [ ] Improvement and optimization [ ] Packets and reporting [ ] Quality gates [ ] Release and packaging [ ] other:
- Human corrected proof: [ ] keep [ ] human-auditable [ ] deterministic [ ] cautilus-eval
- Human corrected eval surface: [ ] keep [ ] dev/repo [ ] dev/skill [ ] app/chat [ ] app/prompt [ ] surface undecided
- Human readiness: [ ] keep [ ] ready-to-verify [ ] needs-scenario [ ] needs-alignment [ ] blocked
- Human priority: [ ] high [ ] medium [ ] low [ ] later [ ] unsure
- Human notes:
- Trace: 1 source ref; docs/contracts/claim-discovery-workflow.md:622

##### claim-docs-contracts-runner-readiness-md-278

- Summary: The bundled `cautilus` skill should keep one progressive surface.
- Current labels: audience=developer; proof=cautilus-eval; eval surface=dev/skill; readiness=ready-to-verify; evidence=unknown
- Suggested next action: Create a host-owned dev/skill fixture and run it through cautilus eval test.
- Human claim quality: [ ] keep [ ] merge [ ] split [ ] reword [ ] drop [ ] unsure
- Human corrected audience: [ ] keep [ ] user [ ] developer [ ] unclear
- Human corrected semantic group: [ ] keep [ ] Adapter and portability [ ] Agent and skill workflow [ ] Claim discovery and review [ ] Documentation and contracts [ ] Evaluation surfaces [ ] General product behavior [ ] Improvement and optimization [ ] Packets and reporting [ ] Quality gates [ ] Release and packaging [ ] other:
- Human corrected proof: [ ] keep [ ] human-auditable [ ] deterministic [ ] cautilus-eval
- Human corrected eval surface: [ ] keep [ ] dev/repo [ ] dev/skill [ ] app/chat [ ] app/prompt [ ] surface undecided
- Human readiness: [ ] keep [ ] ready-to-verify [ ] needs-scenario [ ] needs-alignment [ ] blocked
- Human priority: [ ] high [ ] medium [ ] low [ ] later [ ] unsure
- Human notes:
- Trace: 1 source ref; docs/contracts/runner-readiness.md:278

##### claim-docs-contracts-runner-readiness-md-281

- Summary: The skill should use the binary for command discovery and examples.
- Current labels: audience=developer; proof=cautilus-eval; eval surface=dev/skill; readiness=ready-to-verify; evidence=unknown
- Suggested next action: Create a host-owned dev/skill fixture and run it through cautilus eval test.
- Human claim quality: [ ] keep [ ] merge [ ] split [ ] reword [ ] drop [ ] unsure
- Human corrected audience: [ ] keep [ ] user [ ] developer [ ] unclear
- Human corrected semantic group: [ ] keep [ ] Adapter and portability [ ] Agent and skill workflow [ ] Claim discovery and review [ ] Documentation and contracts [ ] Evaluation surfaces [ ] General product behavior [ ] Improvement and optimization [ ] Packets and reporting [ ] Quality gates [ ] Release and packaging [ ] other:
- Human corrected proof: [ ] keep [ ] human-auditable [ ] deterministic [ ] cautilus-eval
- Human corrected eval surface: [ ] keep [ ] dev/repo [ ] dev/skill [ ] app/chat [ ] app/prompt [ ] surface undecided
- Human readiness: [ ] keep [ ] ready-to-verify [ ] needs-scenario [ ] needs-alignment [ ] blocked
- Human priority: [ ] high [ ] medium [ ] low [ ] later [ ] unsure
- Human notes:
- Trace: 1 source ref; docs/contracts/runner-readiness.md:281

##### claim-docs-contracts-runner-readiness-md-294

- Summary: For app repos, the skill should prefer creating a headless product runner over extracting prompts into a standalone mock.
- Current labels: audience=developer; proof=cautilus-eval; eval surface=dev/skill; readiness=ready-to-verify; evidence=unknown
- Suggested next action: Create a host-owned dev/skill fixture and run it through cautilus eval test.
- Human claim quality: [ ] keep [ ] merge [ ] split [ ] reword [ ] drop [ ] unsure
- Human corrected audience: [ ] keep [ ] user [ ] developer [ ] unclear
- Human corrected semantic group: [ ] keep [ ] Adapter and portability [ ] Agent and skill workflow [ ] Claim discovery and review [ ] Documentation and contracts [ ] Evaluation surfaces [ ] General product behavior [ ] Improvement and optimization [ ] Packets and reporting [ ] Quality gates [ ] Release and packaging [ ] other:
- Human corrected proof: [ ] keep [ ] human-auditable [ ] deterministic [ ] cautilus-eval
- Human corrected eval surface: [ ] keep [ ] dev/repo [ ] dev/skill [ ] app/chat [ ] app/prompt [ ] surface undecided
- Human readiness: [ ] keep [ ] ready-to-verify [ ] needs-scenario [ ] needs-alignment [ ] blocked
- Human priority: [ ] high [ ] medium [ ] low [ ] later [ ] unsure
- Human notes:
- Trace: 1 source ref; docs/contracts/runner-readiness.md:294

##### claim-docs-contracts-scenario-history-md-289

- Summary: Scenario-history is archetype-neutral and stays that way unless a skill-specific graduation policy is introduced.
- Current labels: audience=developer; proof=cautilus-eval; eval surface=dev/skill; readiness=ready-to-verify; evidence=unknown
- Suggested next action: Create a host-owned dev/skill fixture and run it through cautilus eval test.
- Human claim quality: [ ] keep [ ] merge [ ] split [ ] reword [ ] drop [ ] unsure
- Human corrected audience: [ ] keep [ ] user [ ] developer [ ] unclear
- Human corrected semantic group: [ ] keep [ ] Adapter and portability [ ] Agent and skill workflow [ ] Claim discovery and review [ ] Documentation and contracts [ ] Evaluation surfaces [ ] General product behavior [ ] Improvement and optimization [ ] Packets and reporting [ ] Quality gates [ ] Release and packaging [ ] other:
- Human corrected proof: [ ] keep [ ] human-auditable [ ] deterministic [ ] cautilus-eval
- Human corrected eval surface: [ ] keep [ ] dev/repo [ ] dev/skill [ ] app/chat [ ] app/prompt [ ] surface undecided
- Human readiness: [ ] keep [ ] ready-to-verify [ ] needs-scenario [ ] needs-alignment [ ] blocked
- Human priority: [ ] high [ ] medium [ ] low [ ] later [ ] unsure
- Human notes:
- Trace: 1 source ref; docs/contracts/scenario-history.md:289

##### claim-docs-specs-maintainer-binary-skill-boundary-spec-md-20

- Summary: The remaining proof gap is behavior-level: a maintained dev/skill fixture should show the skill choosing the claim-review branch without treating raw discovery as a finished answer.
- Current labels: audience=developer; proof=cautilus-eval; eval surface=dev/skill; readiness=ready-to-verify; evidence=unknown
- Suggested next action: Create a host-owned dev/skill fixture and run it through cautilus eval test.
- Human claim quality: [ ] keep [ ] merge [ ] split [ ] reword [ ] drop [ ] unsure
- Human corrected audience: [ ] keep [ ] user [ ] developer [ ] unclear
- Human corrected semantic group: [ ] keep [ ] Adapter and portability [ ] Agent and skill workflow [ ] Claim discovery and review [ ] Documentation and contracts [ ] Evaluation surfaces [ ] General product behavior [ ] Improvement and optimization [ ] Packets and reporting [ ] Quality gates [ ] Release and packaging [ ] other:
- Human corrected proof: [ ] keep [ ] human-auditable [ ] deterministic [ ] cautilus-eval
- Human corrected eval surface: [ ] keep [ ] dev/repo [ ] dev/skill [ ] app/chat [ ] app/prompt [ ] surface undecided
- Human readiness: [ ] keep [ ] ready-to-verify [ ] needs-scenario [ ] needs-alignment [ ] blocked
- Human priority: [ ] high [ ] medium [ ] low [ ] later [ ] unsure
- Human notes:
- Trace: 1 source ref; docs/specs/maintainer/binary-skill-boundary.spec.md:20

#### Cautilus eval / surface undecided / needs-scenario / evidence unknown (1)

##### claim-docs-contracts-claim-discovery-workflow-md-683

- Summary: `claim show` emits `cautilus.claim_status_summary.v1` and can include bounded `sampleClaims` plus `gitState` for agents that need concrete candidates before choosing the next branch.
- Current labels: audience=developer; proof=cautilus-eval; eval surface=surface undecided; readiness=needs-scenario; evidence=unknown
- Suggested next action: Use the scenario proposal flow to normalize candidate evidence before creating a checked-in eval fixture.
- Human claim quality: [ ] keep [ ] merge [ ] split [ ] reword [ ] drop [ ] unsure
- Human corrected audience: [ ] keep [ ] user [ ] developer [ ] unclear
- Human corrected semantic group: [ ] keep [ ] Adapter and portability [ ] Agent and skill workflow [ ] Claim discovery and review [ ] Documentation and contracts [ ] Evaluation surfaces [ ] General product behavior [ ] Improvement and optimization [ ] Packets and reporting [ ] Quality gates [ ] Release and packaging [ ] other:
- Human corrected proof: [ ] keep [ ] human-auditable [ ] deterministic [ ] cautilus-eval
- Human corrected eval surface: [ ] keep [ ] dev/repo [ ] dev/skill [ ] app/chat [ ] app/prompt [ ] surface undecided
- Human readiness: [ ] keep [ ] ready-to-verify [ ] needs-scenario [ ] needs-alignment [ ] blocked
- Human priority: [ ] high [ ] medium [ ] low [ ] later [ ] unsure
- Human notes:
- Trace: 1 source ref; docs/contracts/claim-discovery-workflow.md:683

#### Deterministic gate / ready-to-verify / evidence satisfied (1)

##### claim-skills-cautilus-skill-md-11

- Summary: In the Cautilus product repo itself, prefer the checked-in source launcher `./bin/cautilus` over `cautilus` on `PATH`, because the installed machine binary can lag the current checkout.
- Current labels: audience=developer; proof=deterministic; readiness=ready-to-verify; evidence=satisfied
- Suggested next action: Keep covered by source-launcher version smoke.
- Human claim quality: [ ] keep [ ] merge [ ] split [ ] reword [ ] drop [ ] unsure
- Human corrected audience: [ ] keep [ ] user [ ] developer [ ] unclear
- Human corrected semantic group: [ ] keep [ ] Adapter and portability [ ] Agent and skill workflow [ ] Claim discovery and review [ ] Documentation and contracts [ ] Evaluation surfaces [ ] General product behavior [ ] Improvement and optimization [ ] Packets and reporting [ ] Quality gates [ ] Release and packaging [ ] other:
- Human corrected proof: [ ] keep [ ] human-auditable [ ] deterministic [ ] cautilus-eval
- Human readiness: [ ] keep [ ] ready-to-verify [ ] needs-scenario [ ] needs-alignment [ ] blocked
- Human priority: [ ] high [ ] medium [ ] low [ ] later [ ] unsure
- Human notes:
- Trace: 1 source ref; skills/cautilus/SKILL.md:11

#### Deterministic gate / ready-to-verify / evidence unknown (18)

##### claim-agents-md-61

- Summary: Keep this block short. Detailed routing belongs in installed skill metadata and `find-skills` output, not in a long checked-in catalog.
- Current labels: audience=developer; proof=deterministic; readiness=ready-to-verify; evidence=unknown
- Suggested next action: Add a small instruction-surface lint or evidence bundle that checks AGENTS length and verifies detailed routing is discoverable through skill metadata and find-skills artifacts.
- Human claim quality: [ ] keep [ ] merge [ ] split [ ] reword [ ] drop [ ] unsure
- Human corrected audience: [ ] keep [ ] user [ ] developer [ ] unclear
- Human corrected semantic group: [ ] keep [ ] Adapter and portability [ ] Agent and skill workflow [ ] Claim discovery and review [ ] Documentation and contracts [ ] Evaluation surfaces [ ] General product behavior [ ] Improvement and optimization [ ] Packets and reporting [ ] Quality gates [ ] Release and packaging [ ] other:
- Human corrected proof: [ ] keep [ ] human-auditable [ ] deterministic [ ] cautilus-eval
- Human readiness: [ ] keep [ ] ready-to-verify [ ] needs-scenario [ ] needs-alignment [ ] blocked
- Human priority: [ ] high [ ] medium [ ] low [ ] later [ ] unsure
- Human notes:
- Trace: 1 source ref; AGENTS.md:61

##### claim-docs-contracts-claim-discovery-workflow-md-201

- Summary: After the deterministic pass, the skill should show a separate review plan:
- Current labels: audience=developer; proof=deterministic; readiness=ready-to-verify; evidence=unknown
- Suggested next action: Keep or add a repo-owned unit, lint, build, schema, or CI check for this claim.
- Human claim quality: [ ] keep [ ] merge [ ] split [ ] reword [ ] drop [ ] unsure
- Human corrected audience: [ ] keep [ ] user [ ] developer [ ] unclear
- Human corrected semantic group: [ ] keep [ ] Adapter and portability [ ] Agent and skill workflow [ ] Claim discovery and review [ ] Documentation and contracts [ ] Evaluation surfaces [ ] General product behavior [ ] Improvement and optimization [ ] Packets and reporting [ ] Quality gates [ ] Release and packaging [ ] other:
- Human corrected proof: [ ] keep [ ] human-auditable [ ] deterministic [ ] cautilus-eval
- Human readiness: [ ] keep [ ] ready-to-verify [ ] needs-scenario [ ] needs-alignment [ ] blocked
- Human priority: [ ] high [ ] medium [ ] low [ ] later [ ] unsure
- Human notes:
- Trace: 1 source ref; docs/contracts/claim-discovery-workflow.md:201

##### claim-docs-contracts-claim-discovery-workflow-md-21

- Summary: Existing claim state refresh is selected by the skill when it detects a prior JSON packet, but the refresh plan and state transition must be recorded in deterministic packets or helper output.
- Current labels: audience=developer; proof=deterministic; readiness=ready-to-verify; evidence=unknown
- Suggested next action: Keep or add a repo-owned unit, lint, build, schema, or CI check for this claim.
- Human claim quality: [ ] keep [ ] merge [ ] split [ ] reword [ ] drop [ ] unsure
- Human corrected audience: [ ] keep [ ] user [ ] developer [ ] unclear
- Human corrected semantic group: [ ] keep [ ] Adapter and portability [ ] Agent and skill workflow [ ] Claim discovery and review [ ] Documentation and contracts [ ] Evaluation surfaces [ ] General product behavior [ ] Improvement and optimization [ ] Packets and reporting [ ] Quality gates [ ] Release and packaging [ ] other:
- Human corrected proof: [ ] keep [ ] human-auditable [ ] deterministic [ ] cautilus-eval
- Human readiness: [ ] keep [ ] ready-to-verify [ ] needs-scenario [ ] needs-alignment [ ] blocked
- Human priority: [ ] high [ ] medium [ ] low [ ] later [ ] unsure
- Human notes:
- Trace: 1 source ref; docs/contracts/claim-discovery-workflow.md:21

##### claim-docs-contracts-claim-discovery-workflow-md-260

- Summary: Command, packet, runner, and readiness statements should prefer deterministic proof unless they explicitly depend on model or agent behavior.
- Current labels: audience=developer; proof=deterministic; readiness=ready-to-verify; evidence=unknown
- Suggested next action: Keep or add a repo-owned unit, lint, build, schema, or CI check for this claim.
- Human claim quality: [ ] keep [ ] merge [ ] split [ ] reword [ ] drop [ ] unsure
- Human corrected audience: [ ] keep [ ] user [ ] developer [ ] unclear
- Human corrected semantic group: [ ] keep [ ] Adapter and portability [ ] Agent and skill workflow [ ] Claim discovery and review [ ] Documentation and contracts [ ] Evaluation surfaces [ ] General product behavior [ ] Improvement and optimization [ ] Packets and reporting [ ] Quality gates [ ] Release and packaging [ ] other:
- Human corrected proof: [ ] keep [ ] human-auditable [ ] deterministic [ ] cautilus-eval
- Human readiness: [ ] keep [ ] ready-to-verify [ ] needs-scenario [ ] needs-alignment [ ] blocked
- Human priority: [ ] high [ ] medium [ ] low [ ] later [ ] unsure
- Human notes:
- Trace: 1 source ref; docs/contracts/claim-discovery-workflow.md:260

##### claim-docs-contracts-claim-discovery-workflow-md-356

- Summary: The binary can do cheap deterministic preflight, but the skill owns final interpretation.
- Current labels: audience=developer; proof=deterministic; readiness=ready-to-verify; evidence=unknown
- Suggested next action: Keep or add a repo-owned unit, lint, build, schema, or CI check for this claim.
- Human claim quality: [ ] keep [ ] merge [ ] split [ ] reword [ ] drop [ ] unsure
- Human corrected audience: [ ] keep [ ] user [ ] developer [ ] unclear
- Human corrected semantic group: [ ] keep [ ] Adapter and portability [ ] Agent and skill workflow [ ] Claim discovery and review [ ] Documentation and contracts [ ] Evaluation surfaces [ ] General product behavior [ ] Improvement and optimization [ ] Packets and reporting [ ] Quality gates [ ] Release and packaging [ ] other:
- Human corrected proof: [ ] keep [ ] human-auditable [ ] deterministic [ ] cautilus-eval
- Human readiness: [ ] keep [ ] ready-to-verify [ ] needs-scenario [ ] needs-alignment [ ] blocked
- Human priority: [ ] high [ ] medium [ ] low [ ] later [ ] unsure
- Human notes:
- Trace: 1 source ref; docs/contracts/claim-discovery-workflow.md:356

##### claim-docs-contracts-claim-discovery-workflow-md-39

- Summary: If prior claim state exists, step 5 becomes a diff-aware refresh selected by the skill: the skill uses the previous packet, the previous commit recorded in that packet, and a deterministic refresh plan to decide which sources need rescanning or re-review.
- Current labels: audience=developer; proof=deterministic; readiness=ready-to-verify; evidence=unknown
- Suggested next action: Keep or add a repo-owned unit, lint, build, schema, or CI check for this claim.
- Human claim quality: [ ] keep [ ] merge [ ] split [ ] reword [ ] drop [ ] unsure
- Human corrected audience: [ ] keep [ ] user [ ] developer [ ] unclear
- Human corrected semantic group: [ ] keep [ ] Adapter and portability [ ] Agent and skill workflow [ ] Claim discovery and review [ ] Documentation and contracts [ ] Evaluation surfaces [ ] General product behavior [ ] Improvement and optimization [ ] Packets and reporting [ ] Quality gates [ ] Release and packaging [ ] other:
- Human corrected proof: [ ] keep [ ] human-auditable [ ] deterministic [ ] cautilus-eval
- Human readiness: [ ] keep [ ] ready-to-verify [ ] needs-scenario [ ] needs-alignment [ ] blocked
- Human priority: [ ] high [ ] medium [ ] low [ ] later [ ] unsure
- Human notes:
- Trace: 1 source ref; docs/contracts/claim-discovery-workflow.md:39

##### claim-docs-contracts-claim-discovery-workflow-md-553

- Summary: The skill may select refresh, but deterministic refresh-plan output must record baseline commit, target policy, changed sources, carried-forward claims, stale evidence reasons, and dirty-working-tree treatment.
- Current labels: audience=developer; proof=deterministic; readiness=ready-to-verify; evidence=unknown
- Suggested next action: Keep or add a repo-owned unit, lint, build, schema, or CI check for this claim.
- Human claim quality: [ ] keep [ ] merge [ ] split [ ] reword [ ] drop [ ] unsure
- Human corrected audience: [ ] keep [ ] user [ ] developer [ ] unclear
- Human corrected semantic group: [ ] keep [ ] Adapter and portability [ ] Agent and skill workflow [ ] Claim discovery and review [ ] Documentation and contracts [ ] Evaluation surfaces [ ] General product behavior [ ] Improvement and optimization [ ] Packets and reporting [ ] Quality gates [ ] Release and packaging [ ] other:
- Human corrected proof: [ ] keep [ ] human-auditable [ ] deterministic [ ] cautilus-eval
- Human readiness: [ ] keep [ ] ready-to-verify [ ] needs-scenario [ ] needs-alignment [ ] blocked
- Human priority: [ ] high [ ] medium [ ] low [ ] later [ ] unsure
- Human notes:
- Trace: 1 source ref; docs/contracts/claim-discovery-workflow.md:553

##### claim-docs-contracts-claim-discovery-workflow-md-578

- Summary: Perfect subagent batch sizing should wait until the deterministic packet and skill control flow are dogfooded.
- Current labels: audience=developer; proof=deterministic; readiness=ready-to-verify; evidence=unknown
- Suggested next action: Keep or add a repo-owned unit, lint, build, schema, or CI check for this claim.
- Human claim quality: [ ] keep [ ] merge [ ] split [ ] reword [ ] drop [ ] unsure
- Human corrected audience: [ ] keep [ ] user [ ] developer [ ] unclear
- Human corrected semantic group: [ ] keep [ ] Adapter and portability [ ] Agent and skill workflow [ ] Claim discovery and review [ ] Documentation and contracts [ ] Evaluation surfaces [ ] General product behavior [ ] Improvement and optimization [ ] Packets and reporting [ ] Quality gates [ ] Release and packaging [ ] other:
- Human corrected proof: [ ] keep [ ] human-auditable [ ] deterministic [ ] cautilus-eval
- Human readiness: [ ] keep [ ] ready-to-verify [ ] needs-scenario [ ] needs-alignment [ ] blocked
- Human priority: [ ] high [ ] medium [ ] low [ ] later [ ] unsure
- Human notes:
- Trace: 1 source ref; docs/contracts/claim-discovery-workflow.md:578

##### claim-docs-contracts-claim-discovery-workflow-md-591

- Summary: Existing state refresh is selected by the skill when prior claim JSON exists, but deterministic refresh-plan output owns the state transition.
- Current labels: audience=developer; proof=deterministic; readiness=ready-to-verify; evidence=unknown
- Suggested next action: Keep or add a repo-owned unit, lint, build, schema, or CI check for this claim.
- Human claim quality: [ ] keep [ ] merge [ ] split [ ] reword [ ] drop [ ] unsure
- Human corrected audience: [ ] keep [ ] user [ ] developer [ ] unclear
- Human corrected semantic group: [ ] keep [ ] Adapter and portability [ ] Agent and skill workflow [ ] Claim discovery and review [ ] Documentation and contracts [ ] Evaluation surfaces [ ] General product behavior [ ] Improvement and optimization [ ] Packets and reporting [ ] Quality gates [ ] Release and packaging [ ] other:
- Human corrected proof: [ ] keep [ ] human-auditable [ ] deterministic [ ] cautilus-eval
- Human readiness: [ ] keep [ ] ready-to-verify [ ] needs-scenario [ ] needs-alignment [ ] blocked
- Human priority: [ ] high [ ] medium [ ] low [ ] later [ ] unsure
- Human notes:
- Trace: 1 source ref; docs/contracts/claim-discovery-workflow.md:591

##### claim-docs-contracts-claim-discovery-workflow-md-65

- Summary: The bundled skill should own orchestration that depends on an agent:
- Current labels: audience=developer; proof=deterministic; readiness=ready-to-verify; evidence=unknown
- Suggested next action: Keep or add deterministic install, adapter, bundled-skill, or doctor readiness proof for this claim.
- Human claim quality: [ ] keep [ ] merge [ ] split [ ] reword [ ] drop [ ] unsure
- Human corrected audience: [ ] keep [ ] user [ ] developer [ ] unclear
- Human corrected semantic group: [ ] keep [ ] Adapter and portability [ ] Agent and skill workflow [ ] Claim discovery and review [ ] Documentation and contracts [ ] Evaluation surfaces [ ] General product behavior [ ] Improvement and optimization [ ] Packets and reporting [ ] Quality gates [ ] Release and packaging [ ] other:
- Human corrected proof: [ ] keep [ ] human-auditable [ ] deterministic [ ] cautilus-eval
- Human readiness: [ ] keep [ ] ready-to-verify [ ] needs-scenario [ ] needs-alignment [ ] blocked
- Human priority: [ ] high [ ] medium [ ] low [ ] later [ ] unsure
- Human notes:
- Trace: 1 source ref; docs/contracts/claim-discovery-workflow.md:65

##### claim-docs-contracts-claim-discovery-workflow-md-681

- Summary: LLM-backed cluster review should come after the deterministic packet and skill control flow are stable enough to dogfood.
- Current labels: audience=developer; proof=deterministic; readiness=ready-to-verify; evidence=unknown
- Suggested next action: Keep or add a repo-owned unit, lint, build, schema, or CI check for this claim.
- Human claim quality: [ ] keep [ ] merge [ ] split [ ] reword [ ] drop [ ] unsure
- Human corrected audience: [ ] keep [ ] user [ ] developer [ ] unclear
- Human corrected semantic group: [ ] keep [ ] Adapter and portability [ ] Agent and skill workflow [ ] Claim discovery and review [ ] Documentation and contracts [ ] Evaluation surfaces [ ] General product behavior [ ] Improvement and optimization [ ] Packets and reporting [ ] Quality gates [ ] Release and packaging [ ] other:
- Human corrected proof: [ ] keep [ ] human-auditable [ ] deterministic [ ] cautilus-eval
- Human readiness: [ ] keep [ ] ready-to-verify [ ] needs-scenario [ ] needs-alignment [ ] blocked
- Human priority: [ ] high [ ] medium [ ] low [ ] later [ ] unsure
- Human notes:
- Trace: 1 source ref; docs/contracts/claim-discovery-workflow.md:681

##### claim-docs-contracts-claim-discovery-workflow-md-85

- Summary: When raw candidates are too granular to review directly, the bundled skill should curate two canonical specdown indexes before continuing HITL:
- Current labels: audience=developer; proof=deterministic; readiness=ready-to-verify; evidence=unknown
- Suggested next action: Keep or add deterministic install, adapter, bundled-skill, or doctor readiness proof for this claim.
- Human claim quality: [ ] keep [ ] merge [ ] split [ ] reword [ ] drop [ ] unsure
- Human corrected audience: [ ] keep [ ] user [ ] developer [ ] unclear
- Human corrected semantic group: [ ] keep [ ] Adapter and portability [ ] Agent and skill workflow [ ] Claim discovery and review [ ] Documentation and contracts [ ] Evaluation surfaces [ ] General product behavior [ ] Improvement and optimization [ ] Packets and reporting [ ] Quality gates [ ] Release and packaging [ ] other:
- Human corrected proof: [ ] keep [ ] human-auditable [ ] deterministic [ ] cautilus-eval
- Human readiness: [ ] keep [ ] ready-to-verify [ ] needs-scenario [ ] needs-alignment [ ] blocked
- Human priority: [ ] high [ ] medium [ ] low [ ] later [ ] unsure
- Human notes:
- Trace: 1 source ref; docs/contracts/claim-discovery-workflow.md:85

##### claim-docs-contracts-runner-readiness-md-140

- Summary: The observed packet should distinguish fixture-backed smoke, coding-agent messaging, in-process product runner, and live/server product runner.
- Current labels: audience=developer; proof=deterministic; readiness=ready-to-verify; evidence=unknown
- Suggested next action: Keep or add a repo-owned unit, lint, build, schema, or CI check for this claim.
- Human claim quality: [ ] keep [ ] merge [ ] split [ ] reword [ ] drop [ ] unsure
- Human corrected audience: [ ] keep [ ] user [ ] developer [ ] unclear
- Human corrected semantic group: [ ] keep [ ] Adapter and portability [ ] Agent and skill workflow [ ] Claim discovery and review [ ] Documentation and contracts [ ] Evaluation surfaces [ ] General product behavior [ ] Improvement and optimization [ ] Packets and reporting [ ] Quality gates [ ] Release and packaging [ ] other:
- Human corrected proof: [ ] keep [ ] human-auditable [ ] deterministic [ ] cautilus-eval
- Human readiness: [ ] keep [ ] ready-to-verify [ ] needs-scenario [ ] needs-alignment [ ] blocked
- Human priority: [ ] high [ ] medium [ ] low [ ] later [ ] unsure
- Human notes:
- Trace: 1 source ref; docs/contracts/runner-readiness.md:140

##### claim-docs-contracts-runner-readiness-md-218

- Summary: The bundled skill may help fill judgment fields, but operators should not have to author `cautilus.runner_assessment.v1` from prose alone.
- Current labels: audience=developer; proof=deterministic; readiness=ready-to-verify; evidence=unknown
- Suggested next action: Keep or add deterministic install, adapter, bundled-skill, or doctor readiness proof for this claim.
- Human claim quality: [ ] keep [ ] merge [ ] split [ ] reword [ ] drop [ ] unsure
- Human corrected audience: [ ] keep [ ] user [ ] developer [ ] unclear
- Human corrected semantic group: [ ] keep [ ] Adapter and portability [ ] Agent and skill workflow [ ] Claim discovery and review [ ] Documentation and contracts [ ] Evaluation surfaces [ ] General product behavior [ ] Improvement and optimization [ ] Packets and reporting [ ] Quality gates [ ] Release and packaging [ ] other:
- Human corrected proof: [ ] keep [ ] human-auditable [ ] deterministic [ ] cautilus-eval
- Human readiness: [ ] keep [ ] ready-to-verify [ ] needs-scenario [ ] needs-alignment [ ] blocked
- Human priority: [ ] high [ ] medium [ ] low [ ] later [ ] unsure
- Human notes:
- Trace: 1 source ref; docs/contracts/runner-readiness.md:218

##### claim-docs-contracts-runner-readiness-md-310

- Summary: How much of `cautilus.runner_assessment.v1` should be written by a binary helper versus by the bundled skill?
- Current labels: audience=developer; proof=deterministic; readiness=ready-to-verify; evidence=unknown
- Suggested next action: Keep or add deterministic install, adapter, bundled-skill, or doctor readiness proof for this claim.
- Human claim quality: [ ] keep [ ] merge [ ] split [ ] reword [ ] drop [ ] unsure
- Human corrected audience: [ ] keep [ ] user [ ] developer [ ] unclear
- Human corrected semantic group: [ ] keep [ ] Adapter and portability [ ] Agent and skill workflow [ ] Claim discovery and review [ ] Documentation and contracts [ ] Evaluation surfaces [ ] General product behavior [ ] Improvement and optimization [ ] Packets and reporting [ ] Quality gates [ ] Release and packaging [ ] other:
- Human corrected proof: [ ] keep [ ] human-auditable [ ] deterministic [ ] cautilus-eval
- Human readiness: [ ] keep [ ] ready-to-verify [ ] needs-scenario [ ] needs-alignment [ ] blocked
- Human priority: [ ] high [ ] medium [ ] low [ ] later [ ] unsure
- Human notes:
- Trace: 1 source ref; docs/contracts/runner-readiness.md:310

##### claim-docs-contracts-runner-verification-md-12

- Summary: The bundled skill may help create or review the assessment, but durable truth must land in a `cautilus.runner_assessment.v1` packet.
- Current labels: audience=developer; proof=deterministic; readiness=ready-to-verify; evidence=unknown
- Suggested next action: Keep or add deterministic install, adapter, bundled-skill, or doctor readiness proof for this claim.
- Human claim quality: [ ] keep [ ] merge [ ] split [ ] reword [ ] drop [ ] unsure
- Human corrected audience: [ ] keep [ ] user [ ] developer [ ] unclear
- Human corrected semantic group: [ ] keep [ ] Adapter and portability [ ] Agent and skill workflow [ ] Claim discovery and review [ ] Documentation and contracts [ ] Evaluation surfaces [ ] General product behavior [ ] Improvement and optimization [ ] Packets and reporting [ ] Quality gates [ ] Release and packaging [ ] other:
- Human corrected proof: [ ] keep [ ] human-auditable [ ] deterministic [ ] cautilus-eval
- Human readiness: [ ] keep [ ] ready-to-verify [ ] needs-scenario [ ] needs-alignment [ ] blocked
- Human priority: [ ] high [ ] medium [ ] low [ ] later [ ] unsure
- Human notes:
- Trace: 1 source ref; docs/contracts/runner-verification.md:12

##### claim-skills-cautilus-skill-md-22

- Summary: The binary owns command discovery, packet examples, deterministic scans, validation, and reusable evaluation artifacts.
- Current labels: audience=developer; proof=deterministic; readiness=ready-to-verify; evidence=unknown
- Suggested next action: Keep or add a repo-owned unit, lint, build, schema, or CI check for this claim.
- Human claim quality: [ ] keep [ ] merge [ ] split [ ] reword [ ] drop [ ] unsure
- Human corrected audience: [ ] keep [ ] user [ ] developer [ ] unclear
- Human corrected semantic group: [ ] keep [ ] Adapter and portability [ ] Agent and skill workflow [ ] Claim discovery and review [ ] Documentation and contracts [ ] Evaluation surfaces [ ] General product behavior [ ] Improvement and optimization [ ] Packets and reporting [ ] Quality gates [ ] Release and packaging [ ] other:
- Human corrected proof: [ ] keep [ ] human-auditable [ ] deterministic [ ] cautilus-eval
- Human readiness: [ ] keep [ ] ready-to-verify [ ] needs-scenario [ ] needs-alignment [ ] blocked
- Human priority: [ ] high [ ] medium [ ] low [ ] later [ ] unsure
- Human notes:
- Trace: 1 source ref; skills/cautilus/SKILL.md:22

##### claim-skills-cautilus-skill-md-223

- Summary: Agents should read the packet first, then cite HTML only when a browser view is the deliverable.
- Current labels: audience=developer; proof=deterministic; readiness=ready-to-verify; evidence=unknown
- Suggested next action: Keep or add deterministic packet, catalog, schema, or renderer proof for this claim.
- Human claim quality: [ ] keep [ ] merge [ ] split [ ] reword [ ] drop [ ] unsure
- Human corrected audience: [ ] keep [ ] user [ ] developer [ ] unclear
- Human corrected semantic group: [ ] keep [ ] Adapter and portability [ ] Agent and skill workflow [ ] Claim discovery and review [ ] Documentation and contracts [ ] Evaluation surfaces [ ] General product behavior [ ] Improvement and optimization [ ] Packets and reporting [ ] Quality gates [ ] Release and packaging [ ] other:
- Human corrected proof: [ ] keep [ ] human-auditable [ ] deterministic [ ] cautilus-eval
- Human readiness: [ ] keep [ ] ready-to-verify [ ] needs-scenario [ ] needs-alignment [ ] blocked
- Human priority: [ ] high [ ] medium [ ] low [ ] later [ ] unsure
- Human notes:
- Trace: 1 source ref; skills/cautilus/SKILL.md:223

#### Human-auditable / blocked / evidence unknown (1)

##### claim-docs-contracts-adapter-contract-md-535

- Summary: Past sessions showed `codex exec` can emit skill-load errors on stderr while still returning a successful exit code.
- Current labels: audience=developer; proof=human-auditable; readiness=blocked; evidence=unknown
- Suggested next action: Keep this as human-auditable context or promote a concrete regression scenario if the caveat should block releases.
- Human claim quality: [ ] keep [ ] merge [ ] split [ ] reword [ ] drop [ ] unsure
- Human corrected audience: [ ] keep [ ] user [ ] developer [ ] unclear
- Human corrected semantic group: [ ] keep [ ] Adapter and portability [ ] Agent and skill workflow [ ] Claim discovery and review [ ] Documentation and contracts [ ] Evaluation surfaces [ ] General product behavior [ ] Improvement and optimization [ ] Packets and reporting [ ] Quality gates [ ] Release and packaging [ ] other:
- Human corrected proof: [ ] keep [ ] human-auditable [ ] deterministic [ ] cautilus-eval
- Human readiness: [ ] keep [ ] ready-to-verify [ ] needs-scenario [ ] needs-alignment [ ] blocked
- Human priority: [ ] high [ ] medium [ ] low [ ] later [ ] unsure
- Human notes:
- Trace: 1 source ref; docs/contracts/adapter-contract.md:535

#### Human-auditable / needs-alignment / evidence unknown (3)

##### claim-docs-specs-maintainer-binary-skill-boundary-spec-md-14

- Summary: The bundled skill owns sequencing, decision boundaries, review-budget explanation, and agent-driven claim curation.
- Current labels: audience=developer; proof=human-auditable; readiness=needs-alignment; evidence=unknown
- Suggested next action: Reconcile or cite the matching adapter, CLI, docs, and test surfaces before treating this as satisfied.
- Human claim quality: [ ] keep [ ] merge [ ] split [ ] reword [ ] drop [ ] unsure
- Human corrected audience: [ ] keep [ ] user [ ] developer [ ] unclear
- Human corrected semantic group: [ ] keep [ ] Adapter and portability [ ] Agent and skill workflow [ ] Claim discovery and review [ ] Documentation and contracts [ ] Evaluation surfaces [ ] General product behavior [ ] Improvement and optimization [ ] Packets and reporting [ ] Quality gates [ ] Release and packaging [ ] other:
- Human corrected proof: [ ] keep [ ] human-auditable [ ] deterministic [ ] cautilus-eval
- Human readiness: [ ] keep [ ] ready-to-verify [ ] needs-scenario [ ] needs-alignment [ ] blocked
- Human priority: [ ] high [ ] medium [ ] low [ ] later [ ] unsure
- Human notes:
- Trace: 1 source ref; docs/specs/maintainer/binary-skill-boundary.spec.md:14

##### claim-skills-cautilus-skill-md-132

- Summary: Maintainer-facing claims may use internal terms, but they must stay aligned with the user-facing claim specs and preserve source refs, proof route, evidence status, and next action.
- Current labels: audience=developer; proof=human-auditable; readiness=needs-alignment; evidence=unknown
- Suggested next action: Reconcile the named docs, code, skill, adapter, or CLI surface before treating this as a verification target.
- Human claim quality: [ ] keep [ ] merge [ ] split [ ] reword [ ] drop [ ] unsure
- Human corrected audience: [ ] keep [ ] user [ ] developer [ ] unclear
- Human corrected semantic group: [ ] keep [ ] Adapter and portability [ ] Agent and skill workflow [ ] Claim discovery and review [ ] Documentation and contracts [ ] Evaluation surfaces [ ] General product behavior [ ] Improvement and optimization [ ] Packets and reporting [ ] Quality gates [ ] Release and packaging [ ] other:
- Human corrected proof: [ ] keep [ ] human-auditable [ ] deterministic [ ] cautilus-eval
- Human readiness: [ ] keep [ ] ready-to-verify [ ] needs-scenario [ ] needs-alignment [ ] blocked
- Human priority: [ ] high [ ] medium [ ] low [ ] later [ ] unsure
- Human notes:
- Trace: 1 source ref; skills/cautilus/SKILL.md:132

##### claim-skills-cautilus-skill-md-70

- Summary: Use this path when the user asks whether a repo proves what it claims, whether docs and behavior are aligned, or which scenarios still need to be created.
- Current labels: audience=developer; proof=human-auditable; readiness=needs-alignment; evidence=unknown
- Suggested next action: Reconcile the named docs, code, skill, adapter, or CLI surface before treating this as a verification target.
- Human claim quality: [ ] keep [ ] merge [ ] split [ ] reword [ ] drop [ ] unsure
- Human corrected audience: [ ] keep [ ] user [ ] developer [ ] unclear
- Human corrected semantic group: [ ] keep [ ] Adapter and portability [ ] Agent and skill workflow [ ] Claim discovery and review [ ] Documentation and contracts [ ] Evaluation surfaces [ ] General product behavior [ ] Improvement and optimization [ ] Packets and reporting [ ] Quality gates [ ] Release and packaging [ ] other:
- Human corrected proof: [ ] keep [ ] human-auditable [ ] deterministic [ ] cautilus-eval
- Human readiness: [ ] keep [ ] ready-to-verify [ ] needs-scenario [ ] needs-alignment [ ] blocked
- Human priority: [ ] high [ ] medium [ ] low [ ] later [ ] unsure
- Human notes:
- Trace: 1 source ref; skills/cautilus/SKILL.md:70

#### Human-auditable / ready-to-verify / evidence unknown (3)

##### claim-skills-cautilus-skill-md-114

- Summary: If a user-facing feature is missing from the configured entry docs or linked Markdown graph, report it as an entry-surface or narrative gap unless another reviewed artifact proves the binary skipped an in-scope declaration.
- Current labels: audience=developer; proof=human-auditable; readiness=ready-to-verify; evidence=unknown
- Suggested next action: Attach at least one supporting evidence item, or split/defer the claim if no concrete evidence would make the human judgment honest.
- Human claim quality: [ ] keep [ ] merge [ ] split [ ] reword [ ] drop [ ] unsure
- Human corrected audience: [ ] keep [ ] user [ ] developer [ ] unclear
- Human corrected semantic group: [ ] keep [ ] Adapter and portability [ ] Agent and skill workflow [ ] Claim discovery and review [ ] Documentation and contracts [ ] Evaluation surfaces [ ] General product behavior [ ] Improvement and optimization [ ] Packets and reporting [ ] Quality gates [ ] Release and packaging [ ] other:
- Human corrected proof: [ ] keep [ ] human-auditable [ ] deterministic [ ] cautilus-eval
- Human readiness: [ ] keep [ ] ready-to-verify [ ] needs-scenario [ ] needs-alignment [ ] blocked
- Human priority: [ ] high [ ] medium [ ] low [ ] later [ ] unsure
- Human notes:
- Trace: 1 source ref; skills/cautilus/SKILL.md:114

##### claim-skills-cautilus-skill-md-120

- Summary: If the maintainer is reviewing from a constrained terminal or phone, run `npm run claims:status-server` so they can read the report in a browser and save section comments as `.cautilus/claims/claim-status-comments.json`.
- Current labels: audience=developer; proof=human-auditable; readiness=ready-to-verify; evidence=unknown
- Suggested next action: Attach at least one supporting evidence item, or split/defer the claim if no concrete evidence would make the human judgment honest.
- Human claim quality: [ ] keep [ ] merge [ ] split [ ] reword [ ] drop [ ] unsure
- Human corrected audience: [ ] keep [ ] user [ ] developer [ ] unclear
- Human corrected semantic group: [ ] keep [ ] Adapter and portability [ ] Agent and skill workflow [ ] Claim discovery and review [ ] Documentation and contracts [ ] Evaluation surfaces [ ] General product behavior [ ] Improvement and optimization [ ] Packets and reporting [ ] Quality gates [ ] Release and packaging [ ] other:
- Human corrected proof: [ ] keep [ ] human-auditable [ ] deterministic [ ] cautilus-eval
- Human readiness: [ ] keep [ ] ready-to-verify [ ] needs-scenario [ ] needs-alignment [ ] blocked
- Human priority: [ ] high [ ] medium [ ] low [ ] later [ ] unsure
- Human notes:
- Trace: 1 source ref; skills/cautilus/SKILL.md:120

##### claim-skills-cautilus-skill-md-125

- Summary: In the Cautilus product repo, product-meaning review should start from those spec docs; use the status report for packet audit, debugging, or deciding which remaining raw candidates are not yet absorbed.
- Current labels: audience=developer; proof=human-auditable; readiness=ready-to-verify; evidence=unknown
- Suggested next action: Attach at least one supporting evidence item, or split/defer the claim if no concrete evidence would make the human judgment honest.
- Human claim quality: [ ] keep [ ] merge [ ] split [ ] reword [ ] drop [ ] unsure
- Human corrected audience: [ ] keep [ ] user [ ] developer [ ] unclear
- Human corrected semantic group: [ ] keep [ ] Adapter and portability [ ] Agent and skill workflow [ ] Claim discovery and review [ ] Documentation and contracts [ ] Evaluation surfaces [ ] General product behavior [ ] Improvement and optimization [ ] Packets and reporting [ ] Quality gates [ ] Release and packaging [ ] other:
- Human corrected proof: [ ] keep [ ] human-auditable [ ] deterministic [ ] cautilus-eval
- Human readiness: [ ] keep [ ] ready-to-verify [ ] needs-scenario [ ] needs-alignment [ ] blocked
- Human priority: [ ] high [ ] medium [ ] low [ ] later [ ] unsure
- Human notes:
- Trace: 1 source ref; skills/cautilus/SKILL.md:125

### Claim discovery and review (18)

#### Cautilus eval / dev/repo / ready-to-verify / evidence unknown (5)

##### claim-docs-contracts-claim-discovery-workflow-md-454

- Summary: The binary may provide helper flags such as `claim discover --previous <packet> --refresh-plan`, but the public user-level workflow remains `discover`.
- Current labels: audience=developer; proof=cautilus-eval; eval surface=dev/repo; readiness=ready-to-verify; evidence=unknown
- Suggested next action: Create a host-owned dev/repo fixture and run it through cautilus eval test.
- Human claim quality: [ ] keep [ ] merge [ ] split [ ] reword [ ] drop [ ] unsure
- Human corrected audience: [ ] keep [ ] user [ ] developer [ ] unclear
- Human corrected semantic group: [ ] keep [ ] Adapter and portability [ ] Agent and skill workflow [ ] Claim discovery and review [ ] Documentation and contracts [ ] Evaluation surfaces [ ] General product behavior [ ] Improvement and optimization [ ] Packets and reporting [ ] Quality gates [ ] Release and packaging [ ] other:
- Human corrected proof: [ ] keep [ ] human-auditable [ ] deterministic [ ] cautilus-eval
- Human corrected eval surface: [ ] keep [ ] dev/repo [ ] dev/skill [ ] app/chat [ ] app/prompt [ ] surface undecided
- Human readiness: [ ] keep [ ] ready-to-verify [ ] needs-scenario [ ] needs-alignment [ ] blocked
- Human priority: [ ] high [ ] medium [ ] low [ ] later [ ] unsure
- Human notes:
- Trace: 1 source ref; docs/contracts/claim-discovery-workflow.md:454

##### claim-docs-contracts-claim-discovery-workflow-md-687

- Summary: `claim review prepare-input` emits `cautilus.claim_review_input.v1` and records bounded clusters, skipped clusters, and skipped claims, but still does not call an LLM or merge review results.
- Current labels: audience=developer; proof=cautilus-eval; eval surface=dev/repo; readiness=ready-to-verify; evidence=unknown
- Suggested next action: Create a host-owned dev/repo fixture and run it through cautilus eval test.
- Human claim quality: [ ] keep [ ] merge [ ] split [ ] reword [ ] drop [ ] unsure
- Human corrected audience: [ ] keep [ ] user [ ] developer [ ] unclear
- Human corrected semantic group: [ ] keep [ ] Adapter and portability [ ] Agent and skill workflow [ ] Claim discovery and review [ ] Documentation and contracts [ ] Evaluation surfaces [ ] General product behavior [ ] Improvement and optimization [ ] Packets and reporting [ ] Quality gates [ ] Release and packaging [ ] other:
- Human corrected proof: [ ] keep [ ] human-auditable [ ] deterministic [ ] cautilus-eval
- Human corrected eval surface: [ ] keep [ ] dev/repo [ ] dev/skill [ ] app/chat [ ] app/prompt [ ] surface undecided
- Human readiness: [ ] keep [ ] ready-to-verify [ ] needs-scenario [ ] needs-alignment [ ] blocked
- Human priority: [ ] high [ ] medium [ ] low [ ] later [ ] unsure
- Human notes:
- Trace: 1 source ref; docs/contracts/claim-discovery-workflow.md:687

##### claim-docs-specs-maintainer-binary-skill-boundary-spec-md-15

- Summary: The binary should not call an LLM provider directly for claim discovery or claim review.
- Current labels: audience=developer; proof=cautilus-eval; eval surface=dev/repo; readiness=ready-to-verify; evidence=unknown
- Suggested next action: Create a host-owned dev/repo fixture and run it through cautilus eval test.
- Human claim quality: [ ] keep [ ] merge [ ] split [ ] reword [ ] drop [ ] unsure
- Human corrected audience: [ ] keep [ ] user [ ] developer [ ] unclear
- Human corrected semantic group: [ ] keep [ ] Adapter and portability [ ] Agent and skill workflow [ ] Claim discovery and review [ ] Documentation and contracts [ ] Evaluation surfaces [ ] General product behavior [ ] Improvement and optimization [ ] Packets and reporting [ ] Quality gates [ ] Release and packaging [ ] other:
- Human corrected proof: [ ] keep [ ] human-auditable [ ] deterministic [ ] cautilus-eval
- Human corrected eval surface: [ ] keep [ ] dev/repo [ ] dev/skill [ ] app/chat [ ] app/prompt [ ] surface undecided
- Human readiness: [ ] keep [ ] ready-to-verify [ ] needs-scenario [ ] needs-alignment [ ] blocked
- Human priority: [ ] high [ ] medium [ ] low [ ] later [ ] unsure
- Human notes:
- Trace: 1 source ref; docs/specs/maintainer/binary-skill-boundary.spec.md:15

##### claim-skills-cautilus-skill-md-111

- Summary: The coordinator should understand that choosing review means setting a review budget before any reviewer lanes, result application, eval planning, edits, or commits happen.
- Current labels: audience=developer; proof=cautilus-eval; eval surface=dev/repo; readiness=ready-to-verify; evidence=unknown
- Suggested next action: Create a host-owned dev/repo fixture and run it through cautilus eval test.
- Human claim quality: [ ] keep [ ] merge [ ] split [ ] reword [ ] drop [ ] unsure
- Human corrected audience: [ ] keep [ ] user [ ] developer [ ] unclear
- Human corrected semantic group: [ ] keep [ ] Adapter and portability [ ] Agent and skill workflow [ ] Claim discovery and review [ ] Documentation and contracts [ ] Evaluation surfaces [ ] General product behavior [ ] Improvement and optimization [ ] Packets and reporting [ ] Quality gates [ ] Release and packaging [ ] other:
- Human corrected proof: [ ] keep [ ] human-auditable [ ] deterministic [ ] cautilus-eval
- Human corrected eval surface: [ ] keep [ ] dev/repo [ ] dev/skill [ ] app/chat [ ] app/prompt [ ] surface undecided
- Human readiness: [ ] keep [ ] ready-to-verify [ ] needs-scenario [ ] needs-alignment [ ] blocked
- Human priority: [ ] high [ ] medium [ ] low [ ] later [ ] unsure
- Human notes:
- Trace: 1 source ref; skills/cautilus/SKILL.md:111

##### claim-skills-cautilus-skill-md-158

- Summary: This branch proves reviewer launch, not review-result merge behavior.
- Current labels: audience=developer; proof=cautilus-eval; eval surface=dev/repo; readiness=ready-to-verify; evidence=unknown
- Suggested next action: Create a host-owned dev/repo fixture and run it through cautilus eval test.
- Human claim quality: [ ] keep [ ] merge [ ] split [ ] reword [ ] drop [ ] unsure
- Human corrected audience: [ ] keep [ ] user [ ] developer [ ] unclear
- Human corrected semantic group: [ ] keep [ ] Adapter and portability [ ] Agent and skill workflow [ ] Claim discovery and review [ ] Documentation and contracts [ ] Evaluation surfaces [ ] General product behavior [ ] Improvement and optimization [ ] Packets and reporting [ ] Quality gates [ ] Release and packaging [ ] other:
- Human corrected proof: [ ] keep [ ] human-auditable [ ] deterministic [ ] cautilus-eval
- Human corrected eval surface: [ ] keep [ ] dev/repo [ ] dev/skill [ ] app/chat [ ] app/prompt [ ] surface undecided
- Human readiness: [ ] keep [ ] ready-to-verify [ ] needs-scenario [ ] needs-alignment [ ] blocked
- Human priority: [ ] high [ ] medium [ ] low [ ] later [ ] unsure
- Human notes:
- Trace: 1 source ref; skills/cautilus/SKILL.md:158

#### Cautilus eval / dev/skill / ready-to-verify / evidence unknown (3)

##### claim-docs-contracts-claim-discovery-workflow-md-176

- Summary: The binary only understands the portable labels `user`, `developer`, and `unclear`; richer semantic grouping remains review work for the skill and reviewer loop.
- Current labels: audience=developer; proof=cautilus-eval; eval surface=dev/skill; readiness=ready-to-verify; evidence=unknown
- Suggested next action: Create a host-owned dev/skill fixture and run it through cautilus eval test.
- Human claim quality: [ ] keep [ ] merge [ ] split [ ] reword [ ] drop [ ] unsure
- Human corrected audience: [ ] keep [ ] user [ ] developer [ ] unclear
- Human corrected semantic group: [ ] keep [ ] Adapter and portability [ ] Agent and skill workflow [ ] Claim discovery and review [ ] Documentation and contracts [ ] Evaluation surfaces [ ] General product behavior [ ] Improvement and optimization [ ] Packets and reporting [ ] Quality gates [ ] Release and packaging [ ] other:
- Human corrected proof: [ ] keep [ ] human-auditable [ ] deterministic [ ] cautilus-eval
- Human corrected eval surface: [ ] keep [ ] dev/repo [ ] dev/skill [ ] app/chat [ ] app/prompt [ ] surface undecided
- Human readiness: [ ] keep [ ] ready-to-verify [ ] needs-scenario [ ] needs-alignment [ ] blocked
- Human priority: [ ] high [ ] medium [ ] low [ ] later [ ] unsure
- Human notes:
- Trace: 1 source ref; docs/contracts/claim-discovery-workflow.md:176

##### claim-docs-contracts-claim-discovery-workflow-md-456

- Summary: When the skill runs `claim discover --previous <packet>` for the actual refreshed proof plan, unchanged claim fingerprints carry forward reviewed labels, evidence refs, unresolved questions, and next-action state.
- Current labels: audience=developer; proof=cautilus-eval; eval surface=dev/skill; readiness=ready-to-verify; evidence=unknown
- Suggested next action: Create a host-owned dev/skill fixture and run it through cautilus eval test.
- Human claim quality: [ ] keep [ ] merge [ ] split [ ] reword [ ] drop [ ] unsure
- Human corrected audience: [ ] keep [ ] user [ ] developer [ ] unclear
- Human corrected semantic group: [ ] keep [ ] Adapter and portability [ ] Agent and skill workflow [ ] Claim discovery and review [ ] Documentation and contracts [ ] Evaluation surfaces [ ] General product behavior [ ] Improvement and optimization [ ] Packets and reporting [ ] Quality gates [ ] Release and packaging [ ] other:
- Human corrected proof: [ ] keep [ ] human-auditable [ ] deterministic [ ] cautilus-eval
- Human corrected eval surface: [ ] keep [ ] dev/repo [ ] dev/skill [ ] app/chat [ ] app/prompt [ ] surface undecided
- Human readiness: [ ] keep [ ] ready-to-verify [ ] needs-scenario [ ] needs-alignment [ ] blocked
- Human priority: [ ] high [ ] medium [ ] low [ ] later [ ] unsure
- Human notes:
- Trace: 1 source ref; docs/contracts/claim-discovery-workflow.md:456

##### claim-docs-contracts-claim-discovery-workflow-md-571

- Summary: Helper flags under `claim discover` are enough if the skill keeps the user-facing action as discover.
- Current labels: audience=developer; proof=cautilus-eval; eval surface=dev/skill; readiness=ready-to-verify; evidence=unknown
- Suggested next action: Create a host-owned dev/skill fixture and run it through cautilus eval test.
- Human claim quality: [ ] keep [ ] merge [ ] split [ ] reword [ ] drop [ ] unsure
- Human corrected audience: [ ] keep [ ] user [ ] developer [ ] unclear
- Human corrected semantic group: [ ] keep [ ] Adapter and portability [ ] Agent and skill workflow [ ] Claim discovery and review [ ] Documentation and contracts [ ] Evaluation surfaces [ ] General product behavior [ ] Improvement and optimization [ ] Packets and reporting [ ] Quality gates [ ] Release and packaging [ ] other:
- Human corrected proof: [ ] keep [ ] human-auditable [ ] deterministic [ ] cautilus-eval
- Human corrected eval surface: [ ] keep [ ] dev/repo [ ] dev/skill [ ] app/chat [ ] app/prompt [ ] surface undecided
- Human readiness: [ ] keep [ ] ready-to-verify [ ] needs-scenario [ ] needs-alignment [ ] blocked
- Human priority: [ ] high [ ] medium [ ] low [ ] later [ ] unsure
- Human notes:
- Trace: 1 source ref; docs/contracts/claim-discovery-workflow.md:571

#### Deterministic gate / ready-to-verify / evidence unknown (4)

##### claim-docs-contracts-adapter-contract-md-218

- Summary: The binary uses these hints to label review queues, while the bundled skill or a human reviewer may still correct semantic edge cases.
- Current labels: audience=developer; proof=deterministic; readiness=ready-to-verify; evidence=unknown
- Suggested next action: Keep or add deterministic install, adapter, bundled-skill, or doctor readiness proof for this claim.
- Human claim quality: [ ] keep [ ] merge [ ] split [ ] reword [ ] drop [ ] unsure
- Human corrected audience: [ ] keep [ ] user [ ] developer [ ] unclear
- Human corrected semantic group: [ ] keep [ ] Adapter and portability [ ] Agent and skill workflow [ ] Claim discovery and review [ ] Documentation and contracts [ ] Evaluation surfaces [ ] General product behavior [ ] Improvement and optimization [ ] Packets and reporting [ ] Quality gates [ ] Release and packaging [ ] other:
- Human corrected proof: [ ] keep [ ] human-auditable [ ] deterministic [ ] cautilus-eval
- Human readiness: [ ] keep [ ] ready-to-verify [ ] needs-scenario [ ] needs-alignment [ ] blocked
- Human priority: [ ] high [ ] medium [ ] low [ ] later [ ] unsure
- Human notes:
- Trace: 1 source ref; docs/contracts/adapter-contract.md:218

##### claim-docs-contracts-claim-discovery-workflow-md-5

- Summary: `cautilus claim discover` currently emits a deterministic, source-ref-backed proof-plan skeleton.
- Current labels: audience=developer; proof=deterministic; readiness=ready-to-verify; evidence=unknown
- Suggested next action: Keep or add a repo-owned unit, lint, build, schema, or CI check for this claim.
- Human claim quality: [ ] keep [ ] merge [ ] split [ ] reword [ ] drop [ ] unsure
- Human corrected audience: [ ] keep [ ] user [ ] developer [ ] unclear
- Human corrected semantic group: [ ] keep [ ] Adapter and portability [ ] Agent and skill workflow [ ] Claim discovery and review [ ] Documentation and contracts [ ] Evaluation surfaces [ ] General product behavior [ ] Improvement and optimization [ ] Packets and reporting [ ] Quality gates [ ] Release and packaging [ ] other:
- Human corrected proof: [ ] keep [ ] human-auditable [ ] deterministic [ ] cautilus-eval
- Human readiness: [ ] keep [ ] ready-to-verify [ ] needs-scenario [ ] needs-alignment [ ] blocked
- Human priority: [ ] high [ ] medium [ ] low [ ] later [ ] unsure
- Human notes:
- Trace: 1 source ref; docs/contracts/claim-discovery-workflow.md:5

##### claim-docs-contracts-claim-discovery-workflow-md-590

- Summary: Claim review that uses an LLM needs separate review-budget confirmation after deterministic scan.
- Current labels: audience=developer; proof=deterministic; readiness=ready-to-verify; evidence=unknown
- Suggested next action: Keep or add a repo-owned unit, lint, build, schema, or CI check for this claim.
- Human claim quality: [ ] keep [ ] merge [ ] split [ ] reword [ ] drop [ ] unsure
- Human corrected audience: [ ] keep [ ] user [ ] developer [ ] unclear
- Human corrected semantic group: [ ] keep [ ] Adapter and portability [ ] Agent and skill workflow [ ] Claim discovery and review [ ] Documentation and contracts [ ] Evaluation surfaces [ ] General product behavior [ ] Improvement and optimization [ ] Packets and reporting [ ] Quality gates [ ] Release and packaging [ ] other:
- Human corrected proof: [ ] keep [ ] human-auditable [ ] deterministic [ ] cautilus-eval
- Human readiness: [ ] keep [ ] ready-to-verify [ ] needs-scenario [ ] needs-alignment [ ] blocked
- Human priority: [ ] high [ ] medium [ ] low [ ] later [ ] unsure
- Human notes:
- Trace: 1 source ref; docs/contracts/claim-discovery-workflow.md:590

##### claim-docs-master-plan-md-76

- Summary: The first `claim` slice ships as deterministic `cautilus claim discover`, which emits a source-ref-backed proof plan rather than a verdict.
- Current labels: audience=developer; proof=deterministic; readiness=ready-to-verify; evidence=unknown
- Suggested next action: Keep or add a repo-owned unit, lint, build, schema, or CI check for this claim.
- Human claim quality: [ ] keep [ ] merge [ ] split [ ] reword [ ] drop [ ] unsure
- Human corrected audience: [ ] keep [ ] user [ ] developer [ ] unclear
- Human corrected semantic group: [ ] keep [ ] Adapter and portability [ ] Agent and skill workflow [ ] Claim discovery and review [ ] Documentation and contracts [ ] Evaluation surfaces [ ] General product behavior [ ] Improvement and optimization [ ] Packets and reporting [ ] Quality gates [ ] Release and packaging [ ] other:
- Human corrected proof: [ ] keep [ ] human-auditable [ ] deterministic [ ] cautilus-eval
- Human readiness: [ ] keep [ ] ready-to-verify [ ] needs-scenario [ ] needs-alignment [ ] blocked
- Human priority: [ ] high [ ] medium [ ] low [ ] later [ ] unsure
- Human notes:
- Trace: 1 source ref; docs/master-plan.md:76

#### Human-auditable / needs-alignment / evidence unknown (3)

##### claim-docs-contracts-claim-discovery-workflow-md-132

- Summary: Those findings should be recorded as narrative, alignment, or documentation work before expecting `claim discover` to emit them by default.
- Current labels: audience=developer; proof=human-auditable; readiness=needs-alignment; evidence=unknown
- Suggested next action: Reconcile the named docs, code, skill, adapter, or CLI surface before treating this as a verification target.
- Human claim quality: [ ] keep [ ] merge [ ] split [ ] reword [ ] drop [ ] unsure
- Human corrected audience: [ ] keep [ ] user [ ] developer [ ] unclear
- Human corrected semantic group: [ ] keep [ ] Adapter and portability [ ] Agent and skill workflow [ ] Claim discovery and review [ ] Documentation and contracts [ ] Evaluation surfaces [ ] General product behavior [ ] Improvement and optimization [ ] Packets and reporting [ ] Quality gates [ ] Release and packaging [ ] other:
- Human corrected proof: [ ] keep [ ] human-auditable [ ] deterministic [ ] cautilus-eval
- Human readiness: [ ] keep [ ] ready-to-verify [ ] needs-scenario [ ] needs-alignment [ ] blocked
- Human priority: [ ] high [ ] medium [ ] low [ ] later [ ] unsure
- Human notes:
- Trace: 1 source ref; docs/contracts/claim-discovery-workflow.md:132

##### claim-docs-contracts-claim-discovery-workflow-md-586

- Summary: In the claim discovery workflow, the bundled skill owns LLM-backed claim review, review-budget explanation, and subagent orchestration.
- Current labels: audience=developer; proof=human-auditable; readiness=needs-alignment; evidence=unknown
- Suggested next action: Reconcile or cite the matching adapter, CLI, docs, and test surfaces before treating this as satisfied.
- Human claim quality: [ ] keep [ ] merge [ ] split [ ] reword [ ] drop [ ] unsure
- Human corrected audience: [ ] keep [ ] user [ ] developer [ ] unclear
- Human corrected semantic group: [ ] keep [ ] Adapter and portability [ ] Agent and skill workflow [ ] Claim discovery and review [ ] Documentation and contracts [ ] Evaluation surfaces [ ] General product behavior [ ] Improvement and optimization [ ] Packets and reporting [ ] Quality gates [ ] Release and packaging [ ] other:
- Human corrected proof: [ ] keep [ ] human-auditable [ ] deterministic [ ] cautilus-eval
- Human readiness: [ ] keep [ ] ready-to-verify [ ] needs-scenario [ ] needs-alignment [ ] blocked
- Human priority: [ ] high [ ] medium [ ] low [ ] later [ ] unsure
- Human notes:
- Trace: 1 source ref; docs/contracts/claim-discovery-workflow.md:586

##### claim-skills-cautilus-skill-md-23

- Summary: The skill owns routing, sequencing, user-facing decision boundaries, and LLM-backed claim review work.
- Current labels: audience=developer; proof=human-auditable; readiness=needs-alignment; evidence=unknown
- Suggested next action: Reconcile or cite the matching adapter, CLI, docs, and test surfaces before treating this as satisfied.
- Human claim quality: [ ] keep [ ] merge [ ] split [ ] reword [ ] drop [ ] unsure
- Human corrected audience: [ ] keep [ ] user [ ] developer [ ] unclear
- Human corrected semantic group: [ ] keep [ ] Adapter and portability [ ] Agent and skill workflow [ ] Claim discovery and review [ ] Documentation and contracts [ ] Evaluation surfaces [ ] General product behavior [ ] Improvement and optimization [ ] Packets and reporting [ ] Quality gates [ ] Release and packaging [ ] other:
- Human corrected proof: [ ] keep [ ] human-auditable [ ] deterministic [ ] cautilus-eval
- Human readiness: [ ] keep [ ] ready-to-verify [ ] needs-scenario [ ] needs-alignment [ ] blocked
- Human priority: [ ] high [ ] medium [ ] low [ ] later [ ] unsure
- Human notes:
- Trace: 1 source ref; skills/cautilus/SKILL.md:23

#### Human-auditable / ready-to-verify / evidence unknown (3)

##### claim-docs-contracts-claim-discovery-workflow-md-688

- Summary: Already satisfied and already reviewed non-stale claims are excluded from review clusters by default so reviewer budget stays focused on unresolved heuristic claims while carried evidence and prior decisions remain auditable under `skippedClaims`.
- Current labels: audience=developer; proof=human-auditable; readiness=ready-to-verify; evidence=unknown
- Suggested next action: Attach at least one supporting evidence item, or split/defer the claim if no concrete evidence would make the human judgment honest.
- Human claim quality: [ ] keep [ ] merge [ ] split [ ] reword [ ] drop [ ] unsure
- Human corrected audience: [ ] keep [ ] user [ ] developer [ ] unclear
- Human corrected semantic group: [ ] keep [ ] Adapter and portability [ ] Agent and skill workflow [ ] Claim discovery and review [ ] Documentation and contracts [ ] Evaluation surfaces [ ] General product behavior [ ] Improvement and optimization [ ] Packets and reporting [ ] Quality gates [ ] Release and packaging [ ] other:
- Human corrected proof: [ ] keep [ ] human-auditable [ ] deterministic [ ] cautilus-eval
- Human readiness: [ ] keep [ ] ready-to-verify [ ] needs-scenario [ ] needs-alignment [ ] blocked
- Human priority: [ ] high [ ] medium [ ] low [ ] later [ ] unsure
- Human notes:
- Trace: 1 source ref; docs/contracts/claim-discovery-workflow.md:688

##### claim-docs-specs-maintainer-claim-discovery-workflow-spec-md-13

- Summary: `claim discover` should emit source-ref-backed candidates from configured entry documents and linked Markdown.
- Current labels: audience=developer; proof=human-auditable; readiness=ready-to-verify; evidence=unknown
- Suggested next action: Attach at least one supporting evidence item, or split/defer the claim if no concrete evidence would make the human judgment honest.
- Human claim quality: [ ] keep [ ] merge [ ] split [ ] reword [ ] drop [ ] unsure
- Human corrected audience: [ ] keep [ ] user [ ] developer [ ] unclear
- Human corrected semantic group: [ ] keep [ ] Adapter and portability [ ] Agent and skill workflow [ ] Claim discovery and review [ ] Documentation and contracts [ ] Evaluation surfaces [ ] General product behavior [ ] Improvement and optimization [ ] Packets and reporting [ ] Quality gates [ ] Release and packaging [ ] other:
- Human corrected proof: [ ] keep [ ] human-auditable [ ] deterministic [ ] cautilus-eval
- Human readiness: [ ] keep [ ] ready-to-verify [ ] needs-scenario [ ] needs-alignment [ ] blocked
- Human priority: [ ] high [ ] medium [ ] low [ ] later [ ] unsure
- Human notes:
- Trace: 1 source ref; docs/specs/maintainer/claim-discovery-workflow.spec.md:13

##### claim-docs-specs-maintainer-reporting-review-variants-spec-md-14

- Summary: Variant review should point both human and machine reviewers at the same durable artifacts.
- Current labels: audience=developer; proof=human-auditable; readiness=ready-to-verify; evidence=unknown
- Suggested next action: Attach at least one supporting evidence item, or split/defer the claim if no concrete evidence would make the human judgment honest.
- Human claim quality: [ ] keep [ ] merge [ ] split [ ] reword [ ] drop [ ] unsure
- Human corrected audience: [ ] keep [ ] user [ ] developer [ ] unclear
- Human corrected semantic group: [ ] keep [ ] Adapter and portability [ ] Agent and skill workflow [ ] Claim discovery and review [ ] Documentation and contracts [ ] Evaluation surfaces [ ] General product behavior [ ] Improvement and optimization [ ] Packets and reporting [ ] Quality gates [ ] Release and packaging [ ] other:
- Human corrected proof: [ ] keep [ ] human-auditable [ ] deterministic [ ] cautilus-eval
- Human readiness: [ ] keep [ ] ready-to-verify [ ] needs-scenario [ ] needs-alignment [ ] blocked
- Human priority: [ ] high [ ] medium [ ] low [ ] later [ ] unsure
- Human notes:
- Trace: 1 source ref; docs/specs/maintainer/reporting-review-variants.spec.md:14

### Documentation and contracts (56)

#### Cautilus eval / app/prompt / ready-to-verify / evidence unknown (4)

##### claim-docs-contracts-optimization-md-38

- Summary: Shorter and less specialized prompts should win only after behavior, held-out, comparison, and review guardrails remain satisfied.
- Current labels: audience=developer; proof=cautilus-eval; eval surface=app/prompt; readiness=ready-to-verify; evidence=unknown
- Suggested next action: Create a host-owned app/prompt fixture and run it through cautilus eval test.
- Human claim quality: [ ] keep [ ] merge [ ] split [ ] reword [ ] drop [ ] unsure
- Human corrected audience: [ ] keep [ ] user [ ] developer [ ] unclear
- Human corrected semantic group: [ ] keep [ ] Adapter and portability [ ] Agent and skill workflow [ ] Claim discovery and review [ ] Documentation and contracts [ ] Evaluation surfaces [ ] General product behavior [ ] Improvement and optimization [ ] Packets and reporting [ ] Quality gates [ ] Release and packaging [ ] other:
- Human corrected proof: [ ] keep [ ] human-auditable [ ] deterministic [ ] cautilus-eval
- Human corrected eval surface: [ ] keep [ ] dev/repo [ ] dev/skill [ ] app/chat [ ] app/prompt [ ] surface undecided
- Human readiness: [ ] keep [ ] ready-to-verify [ ] needs-scenario [ ] needs-alignment [ ] blocked
- Human priority: [ ] high [ ] medium [ ] low [ ] later [ ] unsure
- Human notes:
- Trace: 1 source ref; docs/contracts/optimization.md:38

##### claim-docs-contracts-runner-readiness-md-121

- Summary: It should not silently downgrade app proof to prompt-only smoke when the selected claim requires a headless product runner.
- Current labels: audience=developer; proof=cautilus-eval; eval surface=app/prompt; readiness=ready-to-verify; evidence=unknown
- Suggested next action: Create a host-owned app/prompt fixture and run it through cautilus eval test.
- Human claim quality: [ ] keep [ ] merge [ ] split [ ] reword [ ] drop [ ] unsure
- Human corrected audience: [ ] keep [ ] user [ ] developer [ ] unclear
- Human corrected semantic group: [ ] keep [ ] Adapter and portability [ ] Agent and skill workflow [ ] Claim discovery and review [ ] Documentation and contracts [ ] Evaluation surfaces [ ] General product behavior [ ] Improvement and optimization [ ] Packets and reporting [ ] Quality gates [ ] Release and packaging [ ] other:
- Human corrected proof: [ ] keep [ ] human-auditable [ ] deterministic [ ] cautilus-eval
- Human corrected eval surface: [ ] keep [ ] dev/repo [ ] dev/skill [ ] app/chat [ ] app/prompt [ ] surface undecided
- Human readiness: [ ] keep [ ] ready-to-verify [ ] needs-scenario [ ] needs-alignment [ ] blocked
- Human priority: [ ] high [ ] medium [ ] low [ ] later [ ] unsure
- Human notes:
- Trace: 1 source ref; docs/contracts/runner-readiness.md:121

##### claim-docs-contracts-runner-readiness-md-208

- Summary: `productionPathReuse` should name the reused modules, route handlers, services, prompt builders, tool registries, state stores, or policy modules.
- Current labels: audience=developer; proof=cautilus-eval; eval surface=app/prompt; readiness=ready-to-verify; evidence=unknown
- Suggested next action: Create a host-owned app/prompt fixture and run it through cautilus eval test.
- Human claim quality: [ ] keep [ ] merge [ ] split [ ] reword [ ] drop [ ] unsure
- Human corrected audience: [ ] keep [ ] user [ ] developer [ ] unclear
- Human corrected semantic group: [ ] keep [ ] Adapter and portability [ ] Agent and skill workflow [ ] Claim discovery and review [ ] Documentation and contracts [ ] Evaluation surfaces [ ] General product behavior [ ] Improvement and optimization [ ] Packets and reporting [ ] Quality gates [ ] Release and packaging [ ] other:
- Human corrected proof: [ ] keep [ ] human-auditable [ ] deterministic [ ] cautilus-eval
- Human corrected eval surface: [ ] keep [ ] dev/repo [ ] dev/skill [ ] app/chat [ ] app/prompt [ ] surface undecided
- Human readiness: [ ] keep [ ] ready-to-verify [ ] needs-scenario [ ] needs-alignment [ ] blocked
- Human priority: [ ] high [ ] medium [ ] low [ ] later [ ] unsure
- Human notes:
- Trace: 1 source ref; docs/contracts/runner-readiness.md:208

##### claim-docs-contracts-runner-readiness-md-61

- Summary: A headless product runner is an app runner that can execute product behavior from a CLI or local command while reusing production-adjacent prompt composition, tool registry, state policy, and response logic.
- Current labels: audience=developer; proof=cautilus-eval; eval surface=app/prompt; readiness=ready-to-verify; evidence=unknown
- Suggested next action: Create a host-owned app/prompt fixture and run it through cautilus eval test.
- Human claim quality: [ ] keep [ ] merge [ ] split [ ] reword [ ] drop [ ] unsure
- Human corrected audience: [ ] keep [ ] user [ ] developer [ ] unclear
- Human corrected semantic group: [ ] keep [ ] Adapter and portability [ ] Agent and skill workflow [ ] Claim discovery and review [ ] Documentation and contracts [ ] Evaluation surfaces [ ] General product behavior [ ] Improvement and optimization [ ] Packets and reporting [ ] Quality gates [ ] Release and packaging [ ] other:
- Human corrected proof: [ ] keep [ ] human-auditable [ ] deterministic [ ] cautilus-eval
- Human corrected eval surface: [ ] keep [ ] dev/repo [ ] dev/skill [ ] app/chat [ ] app/prompt [ ] surface undecided
- Human readiness: [ ] keep [ ] ready-to-verify [ ] needs-scenario [ ] needs-alignment [ ] blocked
- Human priority: [ ] high [ ] medium [ ] low [ ] later [ ] unsure
- Human notes:
- Trace: 1 source ref; docs/contracts/runner-readiness.md:61

#### Cautilus eval / dev/repo / ready-to-verify / evidence unknown (20)

##### claim-docs-contracts-active-run-md-186

- Summary: Ambiguous across parallel workflows, silently grabs yesterday's workflow across session gaps, requires a magic freshness threshold.
- Current labels: audience=developer; proof=cautilus-eval; eval surface=dev/repo; readiness=ready-to-verify; evidence=unknown
- Suggested next action: Create a host-owned dev/repo fixture and run it through cautilus eval test.
- Human claim quality: [ ] keep [ ] merge [ ] split [ ] reword [ ] drop [ ] unsure
- Human corrected audience: [ ] keep [ ] user [ ] developer [ ] unclear
- Human corrected semantic group: [ ] keep [ ] Adapter and portability [ ] Agent and skill workflow [ ] Claim discovery and review [ ] Documentation and contracts [ ] Evaluation surfaces [ ] General product behavior [ ] Improvement and optimization [ ] Packets and reporting [ ] Quality gates [ ] Release and packaging [ ] other:
- Human corrected proof: [ ] keep [ ] human-auditable [ ] deterministic [ ] cautilus-eval
- Human corrected eval surface: [ ] keep [ ] dev/repo [ ] dev/skill [ ] app/chat [ ] app/prompt [ ] surface undecided
- Human readiness: [ ] keep [ ] ready-to-verify [ ] needs-scenario [ ] needs-alignment [ ] blocked
- Human priority: [ ] high [ ] medium [ ] low [ ] later [ ] unsure
- Human notes:
- Trace: 1 source ref; docs/contracts/active-run.md:186

##### claim-docs-contracts-active-run-md-218

- Summary: Is `review variants` a workflow-creating command that mints runDirs (and therefore uses `resolveRunDir`), or is it a consume-only command that only reads an existing active run (and therefore uses `readActiveRunDir`)?
- Current labels: audience=developer; proof=cautilus-eval; eval surface=dev/repo; readiness=ready-to-verify; evidence=unknown
- Suggested next action: Create a host-owned dev/repo fixture and run it through cautilus eval test.
- Human claim quality: [ ] keep [ ] merge [ ] split [ ] reword [ ] drop [ ] unsure
- Human corrected audience: [ ] keep [ ] user [ ] developer [ ] unclear
- Human corrected semantic group: [ ] keep [ ] Adapter and portability [ ] Agent and skill workflow [ ] Claim discovery and review [ ] Documentation and contracts [ ] Evaluation surfaces [ ] General product behavior [ ] Improvement and optimization [ ] Packets and reporting [ ] Quality gates [ ] Release and packaging [ ] other:
- Human corrected proof: [ ] keep [ ] human-auditable [ ] deterministic [ ] cautilus-eval
- Human corrected eval surface: [ ] keep [ ] dev/repo [ ] dev/skill [ ] app/chat [ ] app/prompt [ ] surface undecided
- Human readiness: [ ] keep [ ] ready-to-verify [ ] needs-scenario [ ] needs-alignment [ ] blocked
- Human priority: [ ] high [ ] medium [ ] low [ ] later [ ] unsure
- Human notes:
- Trace: 1 source ref; docs/contracts/active-run.md:218

##### claim-docs-contracts-active-run-md-221

- Summary: The command therefore follows the same precedence chain as other workflow-creating helpers (explicit `--output-dir` > `CAUTILUS_RUN_DIR` > auto-materialize under `./.cautilus/runs/`) and emits `Active run: <abs path>` once only when it auto-materializes.
- Current labels: audience=developer; proof=cautilus-eval; eval surface=dev/repo; readiness=ready-to-verify; evidence=unknown
- Suggested next action: Create a host-owned dev/repo fixture and run it through cautilus eval test.
- Human claim quality: [ ] keep [ ] merge [ ] split [ ] reword [ ] drop [ ] unsure
- Human corrected audience: [ ] keep [ ] user [ ] developer [ ] unclear
- Human corrected semantic group: [ ] keep [ ] Adapter and portability [ ] Agent and skill workflow [ ] Claim discovery and review [ ] Documentation and contracts [ ] Evaluation surfaces [ ] General product behavior [ ] Improvement and optimization [ ] Packets and reporting [ ] Quality gates [ ] Release and packaging [ ] other:
- Human corrected proof: [ ] keep [ ] human-auditable [ ] deterministic [ ] cautilus-eval
- Human corrected eval surface: [ ] keep [ ] dev/repo [ ] dev/skill [ ] app/chat [ ] app/prompt [ ] surface undecided
- Human readiness: [ ] keep [ ] ready-to-verify [ ] needs-scenario [ ] needs-alignment [ ] blocked
- Human priority: [ ] high [ ] medium [ ] low [ ] later [ ] unsure
- Human notes:
- Trace: 1 source ref; docs/contracts/active-run.md:221

##### claim-docs-contracts-adapter-contract-md-430

- Summary: point review prompts at the same path so human and machine review can refer to the same compare output
- Current labels: audience=developer; proof=cautilus-eval; eval surface=dev/repo; readiness=ready-to-verify; evidence=unknown
- Suggested next action: Create a host-owned dev/repo fixture and run it through cautilus eval test.
- Human claim quality: [ ] keep [ ] merge [ ] split [ ] reword [ ] drop [ ] unsure
- Human corrected audience: [ ] keep [ ] user [ ] developer [ ] unclear
- Human corrected semantic group: [ ] keep [ ] Adapter and portability [ ] Agent and skill workflow [ ] Claim discovery and review [ ] Documentation and contracts [ ] Evaluation surfaces [ ] General product behavior [ ] Improvement and optimization [ ] Packets and reporting [ ] Quality gates [ ] Release and packaging [ ] other:
- Human corrected proof: [ ] keep [ ] human-auditable [ ] deterministic [ ] cautilus-eval
- Human corrected eval surface: [ ] keep [ ] dev/repo [ ] dev/skill [ ] app/chat [ ] app/prompt [ ] surface undecided
- Human readiness: [ ] keep [ ] ready-to-verify [ ] needs-scenario [ ] needs-alignment [ ] blocked
- Human priority: [ ] high [ ] medium [ ] low [ ] later [ ] unsure
- Human notes:
- Trace: 1 source ref; docs/contracts/adapter-contract.md:430

##### claim-docs-contracts-adapter-contract-md-476

- Summary: Each review prompt should point at human-visible failure:
- Current labels: audience=developer; proof=cautilus-eval; eval surface=dev/repo; readiness=ready-to-verify; evidence=unknown
- Suggested next action: Create a host-owned dev/repo fixture and run it through cautilus eval test.
- Human claim quality: [ ] keep [ ] merge [ ] split [ ] reword [ ] drop [ ] unsure
- Human corrected audience: [ ] keep [ ] user [ ] developer [ ] unclear
- Human corrected semantic group: [ ] keep [ ] Adapter and portability [ ] Agent and skill workflow [ ] Claim discovery and review [ ] Documentation and contracts [ ] Evaluation surfaces [ ] General product behavior [ ] Improvement and optimization [ ] Packets and reporting [ ] Quality gates [ ] Release and packaging [ ] other:
- Human corrected proof: [ ] keep [ ] human-auditable [ ] deterministic [ ] cautilus-eval
- Human corrected eval surface: [ ] keep [ ] dev/repo [ ] dev/skill [ ] app/chat [ ] app/prompt [ ] surface undecided
- Human readiness: [ ] keep [ ] ready-to-verify [ ] needs-scenario [ ] needs-alignment [ ] blocked
- Human priority: [ ] high [ ] medium [ ] low [ ] later [ ] unsure
- Human notes:
- Trace: 1 source ref; docs/contracts/adapter-contract.md:476

##### claim-docs-contracts-claim-discovery-workflow-md-372

- Summary: `unknown` should be used when the workflow did not inspect enough evidence to make an honest statement.
- Current labels: audience=developer; proof=cautilus-eval; eval surface=dev/repo; readiness=ready-to-verify; evidence=unknown
- Suggested next action: Create a host-owned dev/repo fixture and run it through cautilus eval test.
- Human claim quality: [ ] keep [ ] merge [ ] split [ ] reword [ ] drop [ ] unsure
- Human corrected audience: [ ] keep [ ] user [ ] developer [ ] unclear
- Human corrected semantic group: [ ] keep [ ] Adapter and portability [ ] Agent and skill workflow [ ] Claim discovery and review [ ] Documentation and contracts [ ] Evaluation surfaces [ ] General product behavior [ ] Improvement and optimization [ ] Packets and reporting [ ] Quality gates [ ] Release and packaging [ ] other:
- Human corrected proof: [ ] keep [ ] human-auditable [ ] deterministic [ ] cautilus-eval
- Human corrected eval surface: [ ] keep [ ] dev/repo [ ] dev/skill [ ] app/chat [ ] app/prompt [ ] surface undecided
- Human readiness: [ ] keep [ ] ready-to-verify [ ] needs-scenario [ ] needs-alignment [ ] blocked
- Human priority: [ ] high [ ] medium [ ] low [ ] later [ ] unsure
- Human notes:
- Trace: 1 source ref; docs/contracts/claim-discovery-workflow.md:372

##### claim-docs-contracts-claim-discovery-workflow-md-376

- Summary: The workflow should not send every raw candidate to an LLM independently.
- Current labels: audience=developer; proof=cautilus-eval; eval surface=dev/repo; readiness=ready-to-verify; evidence=unknown
- Suggested next action: Create a host-owned dev/repo fixture and run it through cautilus eval test.
- Human claim quality: [ ] keep [ ] merge [ ] split [ ] reword [ ] drop [ ] unsure
- Human corrected audience: [ ] keep [ ] user [ ] developer [ ] unclear
- Human corrected semantic group: [ ] keep [ ] Adapter and portability [ ] Agent and skill workflow [ ] Claim discovery and review [ ] Documentation and contracts [ ] Evaluation surfaces [ ] General product behavior [ ] Improvement and optimization [ ] Packets and reporting [ ] Quality gates [ ] Release and packaging [ ] other:
- Human corrected proof: [ ] keep [ ] human-auditable [ ] deterministic [ ] cautilus-eval
- Human corrected eval surface: [ ] keep [ ] dev/repo [ ] dev/skill [ ] app/chat [ ] app/prompt [ ] surface undecided
- Human readiness: [ ] keep [ ] ready-to-verify [ ] needs-scenario [ ] needs-alignment [ ] blocked
- Human priority: [ ] high [ ] medium [ ] low [ ] later [ ] unsure
- Human notes:
- Trace: 1 source ref; docs/contracts/claim-discovery-workflow.md:376

##### claim-docs-contracts-claim-discovery-workflow-md-524

- Summary: The workflow should avoid a `claim group` command.
- Current labels: audience=developer; proof=cautilus-eval; eval surface=dev/repo; readiness=ready-to-verify; evidence=unknown
- Suggested next action: Create a host-owned dev/repo fixture and run it through cautilus eval test.
- Human claim quality: [ ] keep [ ] merge [ ] split [ ] reword [ ] drop [ ] unsure
- Human corrected audience: [ ] keep [ ] user [ ] developer [ ] unclear
- Human corrected semantic group: [ ] keep [ ] Adapter and portability [ ] Agent and skill workflow [ ] Claim discovery and review [ ] Documentation and contracts [ ] Evaluation surfaces [ ] General product behavior [ ] Improvement and optimization [ ] Packets and reporting [ ] Quality gates [ ] Release and packaging [ ] other:
- Human corrected proof: [ ] keep [ ] human-auditable [ ] deterministic [ ] cautilus-eval
- Human corrected eval surface: [ ] keep [ ] dev/repo [ ] dev/skill [ ] app/chat [ ] app/prompt [ ] surface undecided
- Human readiness: [ ] keep [ ] ready-to-verify [ ] needs-scenario [ ] needs-alignment [ ] blocked
- Human priority: [ ] high [ ] medium [ ] low [ ] later [ ] unsure
- Human notes:
- Trace: 1 source ref; docs/contracts/claim-discovery-workflow.md:524

##### claim-docs-contracts-claim-discovery-workflow-md-548

- Summary: Scan confirmation and LLM review confirmation must be separate.
- Current labels: audience=developer; proof=cautilus-eval; eval surface=dev/repo; readiness=ready-to-verify; evidence=unknown
- Suggested next action: Create a host-owned dev/repo fixture and run it through cautilus eval test.
- Human claim quality: [ ] keep [ ] merge [ ] split [ ] reword [ ] drop [ ] unsure
- Human corrected audience: [ ] keep [ ] user [ ] developer [ ] unclear
- Human corrected semantic group: [ ] keep [ ] Adapter and portability [ ] Agent and skill workflow [ ] Claim discovery and review [ ] Documentation and contracts [ ] Evaluation surfaces [ ] General product behavior [ ] Improvement and optimization [ ] Packets and reporting [ ] Quality gates [ ] Release and packaging [ ] other:
- Human corrected proof: [ ] keep [ ] human-auditable [ ] deterministic [ ] cautilus-eval
- Human corrected eval surface: [ ] keep [ ] dev/repo [ ] dev/skill [ ] app/chat [ ] app/prompt [ ] surface undecided
- Human readiness: [ ] keep [ ] ready-to-verify [ ] needs-scenario [ ] needs-alignment [ ] blocked
- Human priority: [ ] high [ ] medium [ ] low [ ] later [ ] unsure
- Human notes:
- Trace: 1 source ref; docs/contracts/claim-discovery-workflow.md:548

##### claim-docs-contracts-claim-discovery-workflow-md-572

- Summary: LLM-backed claim extraction or review should not move into the binary.
- Current labels: audience=developer; proof=cautilus-eval; eval surface=dev/repo; readiness=ready-to-verify; evidence=unknown
- Suggested next action: Create a host-owned dev/repo fixture and run it through cautilus eval test.
- Human claim quality: [ ] keep [ ] merge [ ] split [ ] reword [ ] drop [ ] unsure
- Human corrected audience: [ ] keep [ ] user [ ] developer [ ] unclear
- Human corrected semantic group: [ ] keep [ ] Adapter and portability [ ] Agent and skill workflow [ ] Claim discovery and review [ ] Documentation and contracts [ ] Evaluation surfaces [ ] General product behavior [ ] Improvement and optimization [ ] Packets and reporting [ ] Quality gates [ ] Release and packaging [ ] other:
- Human corrected proof: [ ] keep [ ] human-auditable [ ] deterministic [ ] cautilus-eval
- Human corrected eval surface: [ ] keep [ ] dev/repo [ ] dev/skill [ ] app/chat [ ] app/prompt [ ] surface undecided
- Human readiness: [ ] keep [ ] ready-to-verify [ ] needs-scenario [ ] needs-alignment [ ] blocked
- Human priority: [ ] high [ ] medium [ ] low [ ] later [ ] unsure
- Human notes:
- Trace: 1 source ref; docs/contracts/claim-discovery-workflow.md:572

##### claim-docs-contracts-claim-discovery-workflow-md-608

- Summary: Whether model-backed extraction should ever become a binary runner behind an explicit provider contract.
- Current labels: audience=developer; proof=cautilus-eval; eval surface=dev/repo; readiness=ready-to-verify; evidence=unknown
- Suggested next action: Create a host-owned dev/repo fixture and run it through cautilus eval test.
- Human claim quality: [ ] keep [ ] merge [ ] split [ ] reword [ ] drop [ ] unsure
- Human corrected audience: [ ] keep [ ] user [ ] developer [ ] unclear
- Human corrected semantic group: [ ] keep [ ] Adapter and portability [ ] Agent and skill workflow [ ] Claim discovery and review [ ] Documentation and contracts [ ] Evaluation surfaces [ ] General product behavior [ ] Improvement and optimization [ ] Packets and reporting [ ] Quality gates [ ] Release and packaging [ ] other:
- Human corrected proof: [ ] keep [ ] human-auditable [ ] deterministic [ ] cautilus-eval
- Human corrected eval surface: [ ] keep [ ] dev/repo [ ] dev/skill [ ] app/chat [ ] app/prompt [ ] surface undecided
- Human readiness: [ ] keep [ ] ready-to-verify [ ] needs-scenario [ ] needs-alignment [ ] blocked
- Human priority: [ ] high [ ] medium [ ] low [ ] later [ ] unsure
- Human notes:
- Trace: 1 source ref; docs/contracts/claim-discovery-workflow.md:608

##### claim-docs-contracts-claim-discovery-workflow-md-90

- Summary: For a product with clear top-level jobs, the user-facing spec index should order claims by the user's feature mental model before cross-cutting implementation promises.
- Current labels: audience=developer; proof=cautilus-eval; eval surface=dev/repo; readiness=ready-to-verify; evidence=unknown
- Suggested next action: Create a host-owned dev/repo fixture and run it through cautilus eval test.
- Human claim quality: [ ] keep [ ] merge [ ] split [ ] reword [ ] drop [ ] unsure
- Human corrected audience: [ ] keep [ ] user [ ] developer [ ] unclear
- Human corrected semantic group: [ ] keep [ ] Adapter and portability [ ] Agent and skill workflow [ ] Claim discovery and review [ ] Documentation and contracts [ ] Evaluation surfaces [ ] General product behavior [ ] Improvement and optimization [ ] Packets and reporting [ ] Quality gates [ ] Release and packaging [ ] other:
- Human corrected proof: [ ] keep [ ] human-auditable [ ] deterministic [ ] cautilus-eval
- Human corrected eval surface: [ ] keep [ ] dev/repo [ ] dev/skill [ ] app/chat [ ] app/prompt [ ] surface undecided
- Human readiness: [ ] keep [ ] ready-to-verify [ ] needs-scenario [ ] needs-alignment [ ] blocked
- Human priority: [ ] high [ ] medium [ ] low [ ] later [ ] unsure
- Human notes:
- Trace: 1 source ref; docs/contracts/claim-discovery-workflow.md:90

##### claim-docs-contracts-optimization-md-37

- Summary: Runtime fingerprint changes can become optimization context without becoming a separate refresh workflow; see runtime-fingerprint-optimization.md (./runtime-fingerprint-optimization.md).
- Current labels: audience=developer; proof=cautilus-eval; eval surface=dev/repo; readiness=ready-to-verify; evidence=unknown
- Suggested next action: Create a host-owned dev/repo fixture and run it through cautilus eval test.
- Human claim quality: [ ] keep [ ] merge [ ] split [ ] reword [ ] drop [ ] unsure
- Human corrected audience: [ ] keep [ ] user [ ] developer [ ] unclear
- Human corrected semantic group: [ ] keep [ ] Adapter and portability [ ] Agent and skill workflow [ ] Claim discovery and review [ ] Documentation and contracts [ ] Evaluation surfaces [ ] General product behavior [ ] Improvement and optimization [ ] Packets and reporting [ ] Quality gates [ ] Release and packaging [ ] other:
- Human corrected proof: [ ] keep [ ] human-auditable [ ] deterministic [ ] cautilus-eval
- Human corrected eval surface: [ ] keep [ ] dev/repo [ ] dev/skill [ ] app/chat [ ] app/prompt [ ] surface undecided
- Human readiness: [ ] keep [ ] ready-to-verify [ ] needs-scenario [ ] needs-alignment [ ] blocked
- Human priority: [ ] high [ ] medium [ ] low [ ] later [ ] unsure
- Human notes:
- Trace: 1 source ref; docs/contracts/optimization.md:37

##### claim-docs-contracts-reporting-md-39

- Summary: optional `intentProfile` when present, it must use the product-owned behavior-intent catalog
- Current labels: audience=developer; proof=cautilus-eval; eval surface=dev/repo; readiness=ready-to-verify; evidence=unknown
- Suggested next action: Create a host-owned dev/repo fixture and run it through cautilus eval test.
- Human claim quality: [ ] keep [ ] merge [ ] split [ ] reword [ ] drop [ ] unsure
- Human corrected audience: [ ] keep [ ] user [ ] developer [ ] unclear
- Human corrected semantic group: [ ] keep [ ] Adapter and portability [ ] Agent and skill workflow [ ] Claim discovery and review [ ] Documentation and contracts [ ] Evaluation surfaces [ ] General product behavior [ ] Improvement and optimization [ ] Packets and reporting [ ] Quality gates [ ] Release and packaging [ ] other:
- Human corrected proof: [ ] keep [ ] human-auditable [ ] deterministic [ ] cautilus-eval
- Human corrected eval surface: [ ] keep [ ] dev/repo [ ] dev/skill [ ] app/chat [ ] app/prompt [ ] surface undecided
- Human readiness: [ ] keep [ ] ready-to-verify [ ] needs-scenario [ ] needs-alignment [ ] blocked
- Human priority: [ ] high [ ] medium [ ] low [ ] later [ ] unsure
- Human notes:
- Trace: 1 source ref; docs/contracts/reporting.md:39

##### claim-docs-contracts-runner-readiness-md-156

- Summary: `fixture-smoke` means the product path and command routing can be exercised cheaply, but the result does not prove model or app behavior.
- Current labels: audience=developer; proof=cautilus-eval; eval surface=dev/repo; readiness=ready-to-verify; evidence=unknown
- Suggested next action: Create a host-owned dev/repo fixture and run it through cautilus eval test.
- Human claim quality: [ ] keep [ ] merge [ ] split [ ] reword [ ] drop [ ] unsure
- Human corrected audience: [ ] keep [ ] user [ ] developer [ ] unclear
- Human corrected semantic group: [ ] keep [ ] Adapter and portability [ ] Agent and skill workflow [ ] Claim discovery and review [ ] Documentation and contracts [ ] Evaluation surfaces [ ] General product behavior [ ] Improvement and optimization [ ] Packets and reporting [ ] Quality gates [ ] Release and packaging [ ] other:
- Human corrected proof: [ ] keep [ ] human-auditable [ ] deterministic [ ] cautilus-eval
- Human corrected eval surface: [ ] keep [ ] dev/repo [ ] dev/skill [ ] app/chat [ ] app/prompt [ ] surface undecided
- Human readiness: [ ] keep [ ] ready-to-verify [ ] needs-scenario [ ] needs-alignment [ ] blocked
- Human priority: [ ] high [ ] medium [ ] low [ ] later [ ] unsure
- Human notes:
- Trace: 1 source ref; docs/contracts/runner-readiness.md:156

##### claim-docs-contracts-runner-readiness-md-19

- Summary: Does this repo have a headless runner that can execute the selected behavior surface without a GUI while staying close enough to the real product path to support the intended proof?
- Current labels: audience=developer; proof=cautilus-eval; eval surface=dev/repo; readiness=ready-to-verify; evidence=unknown
- Suggested next action: Create a host-owned dev/repo fixture and run it through cautilus eval test.
- Human claim quality: [ ] keep [ ] merge [ ] split [ ] reword [ ] drop [ ] unsure
- Human corrected audience: [ ] keep [ ] user [ ] developer [ ] unclear
- Human corrected semantic group: [ ] keep [ ] Adapter and portability [ ] Agent and skill workflow [ ] Claim discovery and review [ ] Documentation and contracts [ ] Evaluation surfaces [ ] General product behavior [ ] Improvement and optimization [ ] Packets and reporting [ ] Quality gates [ ] Release and packaging [ ] other:
- Human corrected proof: [ ] keep [ ] human-auditable [ ] deterministic [ ] cautilus-eval
- Human corrected eval surface: [ ] keep [ ] dev/repo [ ] dev/skill [ ] app/chat [ ] app/prompt [ ] surface undecided
- Human readiness: [ ] keep [ ] ready-to-verify [ ] needs-scenario [ ] needs-alignment [ ] blocked
- Human priority: [ ] high [ ] medium [ ] low [ ] later [ ] unsure
- Human notes:
- Trace: 1 source ref; docs/contracts/runner-readiness.md:19

##### claim-docs-contracts-runner-readiness-md-301

- Summary: They should not become the only runner model.
- Current labels: audience=developer; proof=cautilus-eval; eval surface=dev/repo; readiness=ready-to-verify; evidence=unknown
- Suggested next action: Create a host-owned dev/repo fixture and run it through cautilus eval test.
- Human claim quality: [ ] keep [ ] merge [ ] split [ ] reword [ ] drop [ ] unsure
- Human corrected audience: [ ] keep [ ] user [ ] developer [ ] unclear
- Human corrected semantic group: [ ] keep [ ] Adapter and portability [ ] Agent and skill workflow [ ] Claim discovery and review [ ] Documentation and contracts [ ] Evaluation surfaces [ ] General product behavior [ ] Improvement and optimization [ ] Packets and reporting [ ] Quality gates [ ] Release and packaging [ ] other:
- Human corrected proof: [ ] keep [ ] human-auditable [ ] deterministic [ ] cautilus-eval
- Human corrected eval surface: [ ] keep [ ] dev/repo [ ] dev/skill [ ] app/chat [ ] app/prompt [ ] surface undecided
- Human readiness: [ ] keep [ ] ready-to-verify [ ] needs-scenario [ ] needs-alignment [ ] blocked
- Human priority: [ ] high [ ] medium [ ] low [ ] later [ ] unsure
- Human notes:
- Trace: 1 source ref; docs/contracts/runner-readiness.md:301

##### claim-docs-contracts-runner-readiness-md-358

- Summary: A simple app repo can adopt Cautilus with one headless product runner without adopting the full eval-live instance model.
- Current labels: audience=developer; proof=cautilus-eval; eval surface=dev/repo; readiness=ready-to-verify; evidence=unknown
- Suggested next action: Create a host-owned dev/repo fixture and run it through cautilus eval test.
- Human claim quality: [ ] keep [ ] merge [ ] split [ ] reword [ ] drop [ ] unsure
- Human corrected audience: [ ] keep [ ] user [ ] developer [ ] unclear
- Human corrected semantic group: [ ] keep [ ] Adapter and portability [ ] Agent and skill workflow [ ] Claim discovery and review [ ] Documentation and contracts [ ] Evaluation surfaces [ ] General product behavior [ ] Improvement and optimization [ ] Packets and reporting [ ] Quality gates [ ] Release and packaging [ ] other:
- Human corrected proof: [ ] keep [ ] human-auditable [ ] deterministic [ ] cautilus-eval
- Human corrected eval surface: [ ] keep [ ] dev/repo [ ] dev/skill [ ] app/chat [ ] app/prompt [ ] surface undecided
- Human readiness: [ ] keep [ ] ready-to-verify [ ] needs-scenario [ ] needs-alignment [ ] blocked
- Human priority: [ ] high [ ] medium [ ] low [ ] later [ ] unsure
- Human notes:
- Trace: 1 source ref; docs/contracts/runner-readiness.md:358

##### claim-docs-contracts-runner-readiness-md-43

- Summary: `claim` discovers and organizes declared behavior claims into proof requirements.
- Current labels: audience=developer; proof=cautilus-eval; eval surface=dev/repo; readiness=ready-to-verify; evidence=unknown
- Suggested next action: Create a host-owned dev/repo fixture and run it through cautilus eval test.
- Human claim quality: [ ] keep [ ] merge [ ] split [ ] reword [ ] drop [ ] unsure
- Human corrected audience: [ ] keep [ ] user [ ] developer [ ] unclear
- Human corrected semantic group: [ ] keep [ ] Adapter and portability [ ] Agent and skill workflow [ ] Claim discovery and review [ ] Documentation and contracts [ ] Evaluation surfaces [ ] General product behavior [ ] Improvement and optimization [ ] Packets and reporting [ ] Quality gates [ ] Release and packaging [ ] other:
- Human corrected proof: [ ] keep [ ] human-auditable [ ] deterministic [ ] cautilus-eval
- Human corrected eval surface: [ ] keep [ ] dev/repo [ ] dev/skill [ ] app/chat [ ] app/prompt [ ] surface undecided
- Human readiness: [ ] keep [ ] ready-to-verify [ ] needs-scenario [ ] needs-alignment [ ] blocked
- Human priority: [ ] high [ ] medium [ ] low [ ] later [ ] unsure
- Human notes:
- Trace: 1 source ref; docs/contracts/runner-readiness.md:43

##### claim-docs-specs-maintainer-active-run-workspace-spec-md-3

- Summary: Active runs keep multi-command workflows resumable without hiding workspace ownership.
- Current labels: audience=developer; proof=cautilus-eval; eval surface=dev/repo; readiness=ready-to-verify; evidence=unknown
- Suggested next action: Create a host-owned dev/repo fixture and run it through cautilus eval test.
- Human claim quality: [ ] keep [ ] merge [ ] split [ ] reword [ ] drop [ ] unsure
- Human corrected audience: [ ] keep [ ] user [ ] developer [ ] unclear
- Human corrected semantic group: [ ] keep [ ] Adapter and portability [ ] Agent and skill workflow [ ] Claim discovery and review [ ] Documentation and contracts [ ] Evaluation surfaces [ ] General product behavior [ ] Improvement and optimization [ ] Packets and reporting [ ] Quality gates [ ] Release and packaging [ ] other:
- Human corrected proof: [ ] keep [ ] human-auditable [ ] deterministic [ ] cautilus-eval
- Human corrected eval surface: [ ] keep [ ] dev/repo [ ] dev/skill [ ] app/chat [ ] app/prompt [ ] surface undecided
- Human readiness: [ ] keep [ ] ready-to-verify [ ] needs-scenario [ ] needs-alignment [ ] blocked
- Human priority: [ ] high [ ] medium [ ] low [ ] later [ ] unsure
- Human notes:
- Trace: 1 source ref; docs/specs/maintainer/active-run-workspace.spec.md:3

#### Cautilus eval / surface undecided / needs-scenario / evidence unknown (4)

##### claim-docs-contracts-claim-discovery-workflow-md-261

- Summary: Historical observation and provider-caveat statements can inform future scenarios, but they should stay `human-auditable` and `blocked` until promoted into a concrete regression claim.
- Current labels: audience=developer; proof=cautilus-eval; eval surface=surface undecided; readiness=needs-scenario; evidence=unknown
- Suggested next action: Use the scenario proposal flow to normalize candidate evidence before creating a checked-in eval fixture.
- Human claim quality: [ ] keep [ ] merge [ ] split [ ] reword [ ] drop [ ] unsure
- Human corrected audience: [ ] keep [ ] user [ ] developer [ ] unclear
- Human corrected semantic group: [ ] keep [ ] Adapter and portability [ ] Agent and skill workflow [ ] Claim discovery and review [ ] Documentation and contracts [ ] Evaluation surfaces [ ] General product behavior [ ] Improvement and optimization [ ] Packets and reporting [ ] Quality gates [ ] Release and packaging [ ] other:
- Human corrected proof: [ ] keep [ ] human-auditable [ ] deterministic [ ] cautilus-eval
- Human corrected eval surface: [ ] keep [ ] dev/repo [ ] dev/skill [ ] app/chat [ ] app/prompt [ ] surface undecided
- Human readiness: [ ] keep [ ] ready-to-verify [ ] needs-scenario [ ] needs-alignment [ ] blocked
- Human priority: [ ] high [ ] medium [ ] low [ ] later [ ] unsure
- Human notes:
- Trace: 1 source ref; docs/contracts/claim-discovery-workflow.md:261

##### claim-docs-contracts-scenario-history-md-175

- Summary: Compare runs often need a frozen baseline side so only the candidate reruns.
- Current labels: audience=developer; proof=cautilus-eval; eval surface=surface undecided; readiness=needs-scenario; evidence=unknown
- Suggested next action: Use the scenario proposal flow to normalize candidate evidence before creating a checked-in eval fixture.
- Human claim quality: [ ] keep [ ] merge [ ] split [ ] reword [ ] drop [ ] unsure
- Human corrected audience: [ ] keep [ ] user [ ] developer [ ] unclear
- Human corrected semantic group: [ ] keep [ ] Adapter and portability [ ] Agent and skill workflow [ ] Claim discovery and review [ ] Documentation and contracts [ ] Evaluation surfaces [ ] General product behavior [ ] Improvement and optimization [ ] Packets and reporting [ ] Quality gates [ ] Release and packaging [ ] other:
- Human corrected proof: [ ] keep [ ] human-auditable [ ] deterministic [ ] cautilus-eval
- Human corrected eval surface: [ ] keep [ ] dev/repo [ ] dev/skill [ ] app/chat [ ] app/prompt [ ] surface undecided
- Human readiness: [ ] keep [ ] ready-to-verify [ ] needs-scenario [ ] needs-alignment [ ] blocked
- Human priority: [ ] high [ ] medium [ ] low [ ] later [ ] unsure
- Human notes:
- Trace: 1 source ref; docs/contracts/scenario-history.md:175

##### claim-docs-contracts-scenario-history-md-3

- Summary: `Cautilus` needs a repo-agnostic way to decide which scenarios run during iterate, held-out, and full-gate evaluation, and how repeated train runs change scenario cadence over time.
- Current labels: audience=developer; proof=cautilus-eval; eval surface=surface undecided; readiness=needs-scenario; evidence=unknown
- Suggested next action: Use the scenario proposal flow to normalize candidate evidence before creating a checked-in eval fixture.
- Human claim quality: [ ] keep [ ] merge [ ] split [ ] reword [ ] drop [ ] unsure
- Human corrected audience: [ ] keep [ ] user [ ] developer [ ] unclear
- Human corrected semantic group: [ ] keep [ ] Adapter and portability [ ] Agent and skill workflow [ ] Claim discovery and review [ ] Documentation and contracts [ ] Evaluation surfaces [ ] General product behavior [ ] Improvement and optimization [ ] Packets and reporting [ ] Quality gates [ ] Release and packaging [ ] other:
- Human corrected proof: [ ] keep [ ] human-auditable [ ] deterministic [ ] cautilus-eval
- Human corrected eval surface: [ ] keep [ ] dev/repo [ ] dev/skill [ ] app/chat [ ] app/prompt [ ] surface undecided
- Human readiness: [ ] keep [ ] ready-to-verify [ ] needs-scenario [ ] needs-alignment [ ] blocked
- Human priority: [ ] high [ ] medium [ ] low [ ] later [ ] unsure
- Human notes:
- Trace: 1 source ref; docs/contracts/scenario-history.md:3

##### claim-docs-master-plan-md-88

- Summary: Their public command namespace is `eval live`; the `workbench` name is reserved for a possible future GUI where operators can browse and edit claims, scenarios, and evidence.
- Current labels: audience=developer; proof=cautilus-eval; eval surface=surface undecided; readiness=needs-scenario; evidence=unknown
- Suggested next action: Use the scenario proposal flow to normalize candidate evidence before creating a checked-in eval fixture.
- Human claim quality: [ ] keep [ ] merge [ ] split [ ] reword [ ] drop [ ] unsure
- Human corrected audience: [ ] keep [ ] user [ ] developer [ ] unclear
- Human corrected semantic group: [ ] keep [ ] Adapter and portability [ ] Agent and skill workflow [ ] Claim discovery and review [ ] Documentation and contracts [ ] Evaluation surfaces [ ] General product behavior [ ] Improvement and optimization [ ] Packets and reporting [ ] Quality gates [ ] Release and packaging [ ] other:
- Human corrected proof: [ ] keep [ ] human-auditable [ ] deterministic [ ] cautilus-eval
- Human corrected eval surface: [ ] keep [ ] dev/repo [ ] dev/skill [ ] app/chat [ ] app/prompt [ ] surface undecided
- Human readiness: [ ] keep [ ] ready-to-verify [ ] needs-scenario [ ] needs-alignment [ ] blocked
- Human priority: [ ] high [ ] medium [ ] low [ ] later [ ] unsure
- Human notes:
- Trace: 1 source ref; docs/master-plan.md:88

#### Deterministic gate / ready-to-verify / evidence unknown (17)

##### claim-docs-contracts-adapter-contract-md-276

- Summary: `kind: explicit` keeps fixture-backed repos and simple single-instance adopters cheap without forcing a probe script.
- Current labels: audience=developer; proof=deterministic; readiness=ready-to-verify; evidence=unknown
- Suggested next action: Keep or add a repo-owned unit, lint, build, schema, or CI check for this claim.
- Human claim quality: [ ] keep [ ] merge [ ] split [ ] reword [ ] drop [ ] unsure
- Human corrected audience: [ ] keep [ ] user [ ] developer [ ] unclear
- Human corrected semantic group: [ ] keep [ ] Adapter and portability [ ] Agent and skill workflow [ ] Claim discovery and review [ ] Documentation and contracts [ ] Evaluation surfaces [ ] General product behavior [ ] Improvement and optimization [ ] Packets and reporting [ ] Quality gates [ ] Release and packaging [ ] other:
- Human corrected proof: [ ] keep [ ] human-auditable [ ] deterministic [ ] cautilus-eval
- Human readiness: [ ] keep [ ] ready-to-verify [ ] needs-scenario [ ] needs-alignment [ ] blocked
- Human priority: [ ] high [ ] medium [ ] low [ ] later [ ] unsure
- Human notes:
- Trace: 1 source ref; docs/contracts/adapter-contract.md:276

##### claim-docs-contracts-adapter-contract-md-533

- Summary: Past runs showed some CLIs can reject schemas that declare object properties without also listing them in `required`, even when plain JSON Schema would allow them as optional.
- Current labels: audience=developer; proof=deterministic; readiness=ready-to-verify; evidence=unknown
- Suggested next action: Keep or add a repo-owned unit, lint, build, schema, or CI check for this claim.
- Human claim quality: [ ] keep [ ] merge [ ] split [ ] reword [ ] drop [ ] unsure
- Human corrected audience: [ ] keep [ ] user [ ] developer [ ] unclear
- Human corrected semantic group: [ ] keep [ ] Adapter and portability [ ] Agent and skill workflow [ ] Claim discovery and review [ ] Documentation and contracts [ ] Evaluation surfaces [ ] General product behavior [ ] Improvement and optimization [ ] Packets and reporting [ ] Quality gates [ ] Release and packaging [ ] other:
- Human corrected proof: [ ] keep [ ] human-auditable [ ] deterministic [ ] cautilus-eval
- Human readiness: [ ] keep [ ] ready-to-verify [ ] needs-scenario [ ] needs-alignment [ ] blocked
- Human priority: [ ] high [ ] medium [ ] low [ ] later [ ] unsure
- Human notes:
- Trace: 1 source ref; docs/contracts/adapter-contract.md:533

##### claim-docs-contracts-claim-discovery-workflow-md-187

- Summary: It should also show the deterministic bounds that will be applied:
- Current labels: audience=developer; proof=deterministic; readiness=ready-to-verify; evidence=unknown
- Suggested next action: Keep or add a repo-owned unit, lint, build, schema, or CI check for this claim.
- Human claim quality: [ ] keep [ ] merge [ ] split [ ] reword [ ] drop [ ] unsure
- Human corrected audience: [ ] keep [ ] user [ ] developer [ ] unclear
- Human corrected semantic group: [ ] keep [ ] Adapter and portability [ ] Agent and skill workflow [ ] Claim discovery and review [ ] Documentation and contracts [ ] Evaluation surfaces [ ] General product behavior [ ] Improvement and optimization [ ] Packets and reporting [ ] Quality gates [ ] Release and packaging [ ] other:
- Human corrected proof: [ ] keep [ ] human-auditable [ ] deterministic [ ] cautilus-eval
- Human readiness: [ ] keep [ ] ready-to-verify [ ] needs-scenario [ ] needs-alignment [ ] blocked
- Human priority: [ ] high [ ] medium [ ] low [ ] later [ ] unsure
- Human notes:
- Trace: 1 source ref; docs/contracts/claim-discovery-workflow.md:187

##### claim-docs-contracts-claim-discovery-workflow-md-253

- Summary: Broad positioning or aggregate product promises should stay `human-auditable` and `verificationReadiness=blocked` until they are decomposed into concrete deterministic checks, scenario candidates, or Cautilus eval claims.
- Current labels: audience=developer; proof=deterministic; readiness=ready-to-verify; evidence=unknown
- Suggested next action: Keep or add a repo-owned unit, lint, build, schema, or CI check for this claim.
- Human claim quality: [ ] keep [ ] merge [ ] split [ ] reword [ ] drop [ ] unsure
- Human corrected audience: [ ] keep [ ] user [ ] developer [ ] unclear
- Human corrected semantic group: [ ] keep [ ] Adapter and portability [ ] Agent and skill workflow [ ] Claim discovery and review [ ] Documentation and contracts [ ] Evaluation surfaces [ ] General product behavior [ ] Improvement and optimization [ ] Packets and reporting [ ] Quality gates [ ] Release and packaging [ ] other:
- Human corrected proof: [ ] keep [ ] human-auditable [ ] deterministic [ ] cautilus-eval
- Human readiness: [ ] keep [ ] ready-to-verify [ ] needs-scenario [ ] needs-alignment [ ] blocked
- Human priority: [ ] high [ ] medium [ ] low [ ] later [ ] unsure
- Human notes:
- Trace: 1 source ref; docs/contracts/claim-discovery-workflow.md:253

##### claim-docs-contracts-claim-discovery-workflow-md-377

- Summary: The deterministic pass should emit grouping hints:
- Current labels: audience=developer; proof=deterministic; readiness=ready-to-verify; evidence=unknown
- Suggested next action: Keep or add a repo-owned unit, lint, build, schema, or CI check for this claim.
- Human claim quality: [ ] keep [ ] merge [ ] split [ ] reword [ ] drop [ ] unsure
- Human corrected audience: [ ] keep [ ] user [ ] developer [ ] unclear
- Human corrected semantic group: [ ] keep [ ] Adapter and portability [ ] Agent and skill workflow [ ] Claim discovery and review [ ] Documentation and contracts [ ] Evaluation surfaces [ ] General product behavior [ ] Improvement and optimization [ ] Packets and reporting [ ] Quality gates [ ] Release and packaging [ ] other:
- Human corrected proof: [ ] keep [ ] human-auditable [ ] deterministic [ ] cautilus-eval
- Human readiness: [ ] keep [ ] ready-to-verify [ ] needs-scenario [ ] needs-alignment [ ] blocked
- Human priority: [ ] high [ ] medium [ ] low [ ] later [ ] unsure
- Human notes:
- Trace: 1 source ref; docs/contracts/claim-discovery-workflow.md:377

##### claim-docs-contracts-claim-discovery-workflow-md-47

- Summary: The binary should own deterministic behavior that can be rerun without model access:
- Current labels: audience=developer; proof=deterministic; readiness=ready-to-verify; evidence=unknown
- Suggested next action: Keep or add a repo-owned unit, lint, build, schema, or CI check for this claim.
- Human claim quality: [ ] keep [ ] merge [ ] split [ ] reword [ ] drop [ ] unsure
- Human corrected audience: [ ] keep [ ] user [ ] developer [ ] unclear
- Human corrected semantic group: [ ] keep [ ] Adapter and portability [ ] Agent and skill workflow [ ] Claim discovery and review [ ] Documentation and contracts [ ] Evaluation surfaces [ ] General product behavior [ ] Improvement and optimization [ ] Packets and reporting [ ] Quality gates [ ] Release and packaging [ ] other:
- Human corrected proof: [ ] keep [ ] human-auditable [ ] deterministic [ ] cautilus-eval
- Human readiness: [ ] keep [ ] ready-to-verify [ ] needs-scenario [ ] needs-alignment [ ] blocked
- Human priority: [ ] high [ ] medium [ ] low [ ] later [ ] unsure
- Human notes:
- Trace: 1 source ref; docs/contracts/claim-discovery-workflow.md:47

##### claim-docs-contracts-claim-discovery-workflow-md-573

- Summary: In this workflow, the binary stays deterministic and provider-neutral.
- Current labels: audience=developer; proof=deterministic; readiness=ready-to-verify; evidence=unknown
- Suggested next action: Keep or add a repo-owned unit, lint, build, schema, or CI check for this claim.
- Human claim quality: [ ] keep [ ] merge [ ] split [ ] reword [ ] drop [ ] unsure
- Human corrected audience: [ ] keep [ ] user [ ] developer [ ] unclear
- Human corrected semantic group: [ ] keep [ ] Adapter and portability [ ] Agent and skill workflow [ ] Claim discovery and review [ ] Documentation and contracts [ ] Evaluation surfaces [ ] General product behavior [ ] Improvement and optimization [ ] Packets and reporting [ ] Quality gates [ ] Release and packaging [ ] other:
- Human corrected proof: [ ] keep [ ] human-auditable [ ] deterministic [ ] cautilus-eval
- Human readiness: [ ] keep [ ] ready-to-verify [ ] needs-scenario [ ] needs-alignment [ ] blocked
- Human priority: [ ] high [ ] medium [ ] low [ ] later [ ] unsure
- Human notes:
- Trace: 1 source ref; docs/contracts/claim-discovery-workflow.md:573

##### claim-docs-contracts-claim-discovery-workflow-md-599

- Summary: How much deterministic evidence preflight should the binary do before it risks false satisfaction?
- Current labels: audience=developer; proof=deterministic; readiness=ready-to-verify; evidence=unknown
- Suggested next action: Keep or add a repo-owned unit, lint, build, schema, or CI check for this claim.
- Human claim quality: [ ] keep [ ] merge [ ] split [ ] reword [ ] drop [ ] unsure
- Human corrected audience: [ ] keep [ ] user [ ] developer [ ] unclear
- Human corrected semantic group: [ ] keep [ ] Adapter and portability [ ] Agent and skill workflow [ ] Claim discovery and review [ ] Documentation and contracts [ ] Evaluation surfaces [ ] General product behavior [ ] Improvement and optimization [ ] Packets and reporting [ ] Quality gates [ ] Release and packaging [ ] other:
- Human corrected proof: [ ] keep [ ] human-auditable [ ] deterministic [ ] cautilus-eval
- Human readiness: [ ] keep [ ] ready-to-verify [ ] needs-scenario [ ] needs-alignment [ ] blocked
- Human priority: [ ] high [ ] medium [ ] low [ ] later [ ] unsure
- Human notes:
- Trace: 1 source ref; docs/contracts/claim-discovery-workflow.md:599

##### claim-docs-contracts-claim-discovery-workflow-md-653

- Summary: The binary should remain deterministic and provider-neutral.
- Current labels: audience=developer; proof=deterministic; readiness=ready-to-verify; evidence=unknown
- Suggested next action: Keep or add a repo-owned unit, lint, build, schema, or CI check for this claim.
- Human claim quality: [ ] keep [ ] merge [ ] split [ ] reword [ ] drop [ ] unsure
- Human corrected audience: [ ] keep [ ] user [ ] developer [ ] unclear
- Human corrected semantic group: [ ] keep [ ] Adapter and portability [ ] Agent and skill workflow [ ] Claim discovery and review [ ] Documentation and contracts [ ] Evaluation surfaces [ ] General product behavior [ ] Improvement and optimization [ ] Packets and reporting [ ] Quality gates [ ] Release and packaging [ ] other:
- Human corrected proof: [ ] keep [ ] human-auditable [ ] deterministic [ ] cautilus-eval
- Human readiness: [ ] keep [ ] ready-to-verify [ ] needs-scenario [ ] needs-alignment [ ] blocked
- Human priority: [ ] high [ ] medium [ ] low [ ] later [ ] unsure
- Human notes:
- Trace: 1 source ref; docs/contracts/claim-discovery-workflow.md:653

##### claim-docs-contracts-live-run-invocation-batch-md-5

- Summary: This slice exists to stop adopters from re-implementing the per-scenario scheduler once `cautilus eval live run` already owns the single-request runtime semantics.
- Current labels: audience=developer; proof=deterministic; readiness=ready-to-verify; evidence=unknown
- Suggested next action: Keep or add a repo-owned unit, lint, build, schema, or CI check for this claim.
- Human claim quality: [ ] keep [ ] merge [ ] split [ ] reword [ ] drop [ ] unsure
- Human corrected audience: [ ] keep [ ] user [ ] developer [ ] unclear
- Human corrected semantic group: [ ] keep [ ] Adapter and portability [ ] Agent and skill workflow [ ] Claim discovery and review [ ] Documentation and contracts [ ] Evaluation surfaces [ ] General product behavior [ ] Improvement and optimization [ ] Packets and reporting [ ] Quality gates [ ] Release and packaging [ ] other:
- Human corrected proof: [ ] keep [ ] human-auditable [ ] deterministic [ ] cautilus-eval
- Human readiness: [ ] keep [ ] ready-to-verify [ ] needs-scenario [ ] needs-alignment [ ] blocked
- Human priority: [ ] high [ ] medium [ ] low [ ] later [ ] unsure
- Human notes:
- Trace: 1 source ref; docs/contracts/live-run-invocation-batch.md:5

##### claim-docs-contracts-reporting-md-120

- Summary: `blocked` should carry machine-readable reason codes and a concrete reason instead of free-form prose-only failure
- Current labels: audience=developer; proof=deterministic; readiness=ready-to-verify; evidence=unknown
- Suggested next action: Keep or add deterministic packet schema, command-output, or golden-file proof for this claim.
- Human claim quality: [ ] keep [ ] merge [ ] split [ ] reword [ ] drop [ ] unsure
- Human corrected audience: [ ] keep [ ] user [ ] developer [ ] unclear
- Human corrected semantic group: [ ] keep [ ] Adapter and portability [ ] Agent and skill workflow [ ] Claim discovery and review [ ] Documentation and contracts [ ] Evaluation surfaces [ ] General product behavior [ ] Improvement and optimization [ ] Packets and reporting [ ] Quality gates [ ] Release and packaging [ ] other:
- Human corrected proof: [ ] keep [ ] human-auditable [ ] deterministic [ ] cautilus-eval
- Human readiness: [ ] keep [ ] ready-to-verify [ ] needs-scenario [ ] needs-alignment [ ] blocked
- Human priority: [ ] high [ ] medium [ ] low [ ] later [ ] unsure
- Human notes:
- Trace: 1 source ref; docs/contracts/reporting.md:120

##### claim-docs-contracts-runner-readiness-md-273

- Summary: The shipped schema uses `id`, `surfaces`, `proof_class`, `command_template`, optional `smoke_command_template`, optional `assessment_path`, and optional `default_runtime`.
- Current labels: audience=developer; proof=deterministic; readiness=ready-to-verify; evidence=unknown
- Suggested next action: Keep or add a repo-owned unit, lint, build, schema, or CI check for this claim.
- Human claim quality: [ ] keep [ ] merge [ ] split [ ] reword [ ] drop [ ] unsure
- Human corrected audience: [ ] keep [ ] user [ ] developer [ ] unclear
- Human corrected semantic group: [ ] keep [ ] Adapter and portability [ ] Agent and skill workflow [ ] Claim discovery and review [ ] Documentation and contracts [ ] Evaluation surfaces [ ] General product behavior [ ] Improvement and optimization [ ] Packets and reporting [ ] Quality gates [ ] Release and packaging [ ] other:
- Human corrected proof: [ ] keep [ ] human-auditable [ ] deterministic [ ] cautilus-eval
- Human readiness: [ ] keep [ ] ready-to-verify [ ] needs-scenario [ ] needs-alignment [ ] blocked
- Human priority: [ ] high [ ] medium [ ] low [ ] later [ ] unsure
- Human notes:
- Trace: 1 source ref; docs/contracts/runner-readiness.md:273

##### claim-docs-contracts-runner-readiness-md-282

- Summary: It should not duplicate the command catalog.
- Current labels: audience=developer; proof=deterministic; readiness=ready-to-verify; evidence=unknown
- Suggested next action: Keep or add deterministic packet, catalog, schema, or renderer proof for this claim.
- Human claim quality: [ ] keep [ ] merge [ ] split [ ] reword [ ] drop [ ] unsure
- Human corrected audience: [ ] keep [ ] user [ ] developer [ ] unclear
- Human corrected semantic group: [ ] keep [ ] Adapter and portability [ ] Agent and skill workflow [ ] Claim discovery and review [ ] Documentation and contracts [ ] Evaluation surfaces [ ] General product behavior [ ] Improvement and optimization [ ] Packets and reporting [ ] Quality gates [ ] Release and packaging [ ] other:
- Human corrected proof: [ ] keep [ ] human-auditable [ ] deterministic [ ] cautilus-eval
- Human readiness: [ ] keep [ ] ready-to-verify [ ] needs-scenario [ ] needs-alignment [ ] blocked
- Human priority: [ ] high [ ] medium [ ] low [ ] later [ ] unsure
- Human notes:
- Trace: 1 source ref; docs/contracts/runner-readiness.md:282

##### claim-docs-contracts-runner-verification-md-24

- Summary: external substitution: nondeterministic or costly external dependencies can be replaced with deterministic substitutes at the same boundary the product uses
- Current labels: audience=developer; proof=deterministic; readiness=ready-to-verify; evidence=unknown
- Suggested next action: Keep or add a repo-owned unit, lint, build, schema, or CI check for this claim.
- Human claim quality: [ ] keep [ ] merge [ ] split [ ] reword [ ] drop [ ] unsure
- Human corrected audience: [ ] keep [ ] user [ ] developer [ ] unclear
- Human corrected semantic group: [ ] keep [ ] Adapter and portability [ ] Agent and skill workflow [ ] Claim discovery and review [ ] Documentation and contracts [ ] Evaluation surfaces [ ] General product behavior [ ] Improvement and optimization [ ] Packets and reporting [ ] Quality gates [ ] Release and packaging [ ] other:
- Human corrected proof: [ ] keep [ ] human-auditable [ ] deterministic [ ] cautilus-eval
- Human readiness: [ ] keep [ ] ready-to-verify [ ] needs-scenario [ ] needs-alignment [ ] blocked
- Human priority: [ ] high [ ] medium [ ] low [ ] later [ ] unsure
- Human notes:
- Trace: 1 source ref; docs/contracts/runner-verification.md:24

##### claim-docs-contracts-runner-verification-md-68

- Summary: Those proof classes can support setup checks, fixture shaping, and deterministic smoke confidence without claiming app product-path proof.
- Current labels: audience=developer; proof=deterministic; readiness=ready-to-verify; evidence=unknown
- Suggested next action: Keep or add a repo-owned unit, lint, build, schema, or CI check for this claim.
- Human claim quality: [ ] keep [ ] merge [ ] split [ ] reword [ ] drop [ ] unsure
- Human corrected audience: [ ] keep [ ] user [ ] developer [ ] unclear
- Human corrected semantic group: [ ] keep [ ] Adapter and portability [ ] Agent and skill workflow [ ] Claim discovery and review [ ] Documentation and contracts [ ] Evaluation surfaces [ ] General product behavior [ ] Improvement and optimization [ ] Packets and reporting [ ] Quality gates [ ] Release and packaging [ ] other:
- Human corrected proof: [ ] keep [ ] human-auditable [ ] deterministic [ ] cautilus-eval
- Human readiness: [ ] keep [ ] ready-to-verify [ ] needs-scenario [ ] needs-alignment [ ] blocked
- Human priority: [ ] high [ ] medium [ ] low [ ] later [ ] unsure
- Human notes:
- Trace: 1 source ref; docs/contracts/runner-verification.md:68

##### claim-docs-contracts-scenario-proposal-sources-md-235

- Summary: The canonical machine-readable output should preserve the full ranked proposal list.
- Current labels: audience=developer; proof=deterministic; readiness=ready-to-verify; evidence=unknown
- Suggested next action: Keep or add deterministic packet schema, command-output, or golden-file proof for this claim.
- Human claim quality: [ ] keep [ ] merge [ ] split [ ] reword [ ] drop [ ] unsure
- Human corrected audience: [ ] keep [ ] user [ ] developer [ ] unclear
- Human corrected semantic group: [ ] keep [ ] Adapter and portability [ ] Agent and skill workflow [ ] Claim discovery and review [ ] Documentation and contracts [ ] Evaluation surfaces [ ] General product behavior [ ] Improvement and optimization [ ] Packets and reporting [ ] Quality gates [ ] Release and packaging [ ] other:
- Human corrected proof: [ ] keep [ ] human-auditable [ ] deterministic [ ] cautilus-eval
- Human readiness: [ ] keep [ ] ready-to-verify [ ] needs-scenario [ ] needs-alignment [ ] blocked
- Human priority: [ ] high [ ] medium [ ] low [ ] later [ ] unsure
- Human notes:
- Trace: 1 source ref; docs/contracts/scenario-proposal-sources.md:235

##### claim-docs-specs-maintainer-scenario-history-normalization-spec-md-18

- Summary: This area should absorb `docs/contracts/scenario-history.md`, `docs/contracts/scenario-proposal-sources.md`, and scenario normalizer claims.
- Current labels: audience=developer; proof=deterministic; readiness=ready-to-verify; evidence=unknown
- Suggested next action: Keep or add deterministic scenario command, packet, or render proof for this claim.
- Human claim quality: [ ] keep [ ] merge [ ] split [ ] reword [ ] drop [ ] unsure
- Human corrected audience: [ ] keep [ ] user [ ] developer [ ] unclear
- Human corrected semantic group: [ ] keep [ ] Adapter and portability [ ] Agent and skill workflow [ ] Claim discovery and review [ ] Documentation and contracts [ ] Evaluation surfaces [ ] General product behavior [ ] Improvement and optimization [ ] Packets and reporting [ ] Quality gates [ ] Release and packaging [ ] other:
- Human corrected proof: [ ] keep [ ] human-auditable [ ] deterministic [ ] cautilus-eval
- Human readiness: [ ] keep [ ] ready-to-verify [ ] needs-scenario [ ] needs-alignment [ ] blocked
- Human priority: [ ] high [ ] medium [ ] low [ ] later [ ] unsure
- Human notes:
- Trace: 1 source ref; docs/specs/maintainer/scenario-history-normalization.spec.md:18

#### Human-auditable / blocked / evidence unknown (2)

##### claim-agents-md-26

- Summary: `Cautilus` owns generic intentful behavior evaluation workflow contracts.
- Current labels: audience=developer; proof=human-auditable; readiness=blocked; evidence=unknown
- Suggested next action: Do not satisfy directly; either leave as positioning or decompose into narrower contract ownership claims.
- Human claim quality: [ ] keep [ ] merge [ ] split [ ] reword [ ] drop [ ] unsure
- Human corrected audience: [ ] keep [ ] user [ ] developer [ ] unclear
- Human corrected semantic group: [ ] keep [ ] Adapter and portability [ ] Agent and skill workflow [ ] Claim discovery and review [ ] Documentation and contracts [ ] Evaluation surfaces [ ] General product behavior [ ] Improvement and optimization [ ] Packets and reporting [ ] Quality gates [ ] Release and packaging [ ] other:
- Human corrected proof: [ ] keep [ ] human-auditable [ ] deterministic [ ] cautilus-eval
- Human readiness: [ ] keep [ ] ready-to-verify [ ] needs-scenario [ ] needs-alignment [ ] blocked
- Human priority: [ ] high [ ] medium [ ] low [ ] later [ ] unsure
- Human notes:
- Trace: 1 source ref; AGENTS.md:26

##### claim-docs-contracts-adapter-contract-md-472

- Summary: If a checked-in wrapper can observe provider cost or token usage, let it emit an optional `telemetry` object in the structured verdict payload instead of hiding that data in stderr text.
- Current labels: audience=developer; proof=human-auditable; readiness=blocked; evidence=unknown
- Suggested next action: Keep this as human-auditable context or promote a concrete regression scenario if the caveat should block releases.
- Human claim quality: [ ] keep [ ] merge [ ] split [ ] reword [ ] drop [ ] unsure
- Human corrected audience: [ ] keep [ ] user [ ] developer [ ] unclear
- Human corrected semantic group: [ ] keep [ ] Adapter and portability [ ] Agent and skill workflow [ ] Claim discovery and review [ ] Documentation and contracts [ ] Evaluation surfaces [ ] General product behavior [ ] Improvement and optimization [ ] Packets and reporting [ ] Quality gates [ ] Release and packaging [ ] other:
- Human corrected proof: [ ] keep [ ] human-auditable [ ] deterministic [ ] cautilus-eval
- Human readiness: [ ] keep [ ] ready-to-verify [ ] needs-scenario [ ] needs-alignment [ ] blocked
- Human priority: [ ] high [ ] medium [ ] low [ ] later [ ] unsure
- Human notes:
- Trace: 1 source ref; docs/contracts/adapter-contract.md:472

#### Human-auditable / needs-alignment / evidence unknown (2)

##### claim-docs-contracts-claim-discovery-workflow-md-322

- Summary: `verificationReadiness=needs-alignment` means at least two truth surfaces must be reconciled before proof would be honest.
- Current labels: audience=developer; proof=human-auditable; readiness=needs-alignment; evidence=unknown
- Suggested next action: Reconcile the named docs, code, skill, adapter, or CLI surface before treating this as a verification target.
- Human claim quality: [ ] keep [ ] merge [ ] split [ ] reword [ ] drop [ ] unsure
- Human corrected audience: [ ] keep [ ] user [ ] developer [ ] unclear
- Human corrected semantic group: [ ] keep [ ] Adapter and portability [ ] Agent and skill workflow [ ] Claim discovery and review [ ] Documentation and contracts [ ] Evaluation surfaces [ ] General product behavior [ ] Improvement and optimization [ ] Packets and reporting [ ] Quality gates [ ] Release and packaging [ ] other:
- Human corrected proof: [ ] keep [ ] human-auditable [ ] deterministic [ ] cautilus-eval
- Human readiness: [ ] keep [ ] ready-to-verify [ ] needs-scenario [ ] needs-alignment [ ] blocked
- Human priority: [ ] high [ ] medium [ ] low [ ] later [ ] unsure
- Human notes:
- Trace: 1 source ref; docs/contracts/claim-discovery-workflow.md:322

##### claim-docs-contracts-reporting-md-112

- Summary: Runtime drift codes should be recorded as runtime context rather than primary behavior-outcome reason codes unless a pinned-runtime policy blocks the run.
- Current labels: audience=developer; proof=human-auditable; readiness=needs-alignment; evidence=unknown
- Suggested next action: Reconcile the named docs, code, skill, adapter, or CLI surface before treating this as a verification target.
- Human claim quality: [ ] keep [ ] merge [ ] split [ ] reword [ ] drop [ ] unsure
- Human corrected audience: [ ] keep [ ] user [ ] developer [ ] unclear
- Human corrected semantic group: [ ] keep [ ] Adapter and portability [ ] Agent and skill workflow [ ] Claim discovery and review [ ] Documentation and contracts [ ] Evaluation surfaces [ ] General product behavior [ ] Improvement and optimization [ ] Packets and reporting [ ] Quality gates [ ] Release and packaging [ ] other:
- Human corrected proof: [ ] keep [ ] human-auditable [ ] deterministic [ ] cautilus-eval
- Human readiness: [ ] keep [ ] ready-to-verify [ ] needs-scenario [ ] needs-alignment [ ] blocked
- Human priority: [ ] high [ ] medium [ ] low [ ] later [ ] unsure
- Human notes:
- Trace: 1 source ref; docs/contracts/reporting.md:112

#### Human-auditable / ready-to-verify / evidence unknown (7)

##### claim-docs-contracts-claim-discovery-workflow-md-325

- Summary: Human review can accept a claim's framing or proof route, but it does not by itself satisfy the claim unless a direct or verified evidence ref also supports that claim.
- Current labels: audience=developer; proof=human-auditable; readiness=ready-to-verify; evidence=unknown
- Suggested next action: Attach at least one supporting evidence item, or split/defer the claim if no concrete evidence would make the human judgment honest.
- Human claim quality: [ ] keep [ ] merge [ ] split [ ] reword [ ] drop [ ] unsure
- Human corrected audience: [ ] keep [ ] user [ ] developer [ ] unclear
- Human corrected semantic group: [ ] keep [ ] Adapter and portability [ ] Agent and skill workflow [ ] Claim discovery and review [ ] Documentation and contracts [ ] Evaluation surfaces [ ] General product behavior [ ] Improvement and optimization [ ] Packets and reporting [ ] Quality gates [ ] Release and packaging [ ] other:
- Human corrected proof: [ ] keep [ ] human-auditable [ ] deterministic [ ] cautilus-eval
- Human readiness: [ ] keep [ ] ready-to-verify [ ] needs-scenario [ ] needs-alignment [ ] blocked
- Human priority: [ ] high [ ] medium [ ] low [ ] later [ ] unsure
- Human notes:
- Trace: 1 source ref; docs/contracts/claim-discovery-workflow.md:325

##### claim-docs-contracts-claim-discovery-workflow-md-327

- Summary: `evidenceRefs[]` should use a minimum inspectable shape:
- Current labels: audience=developer; proof=human-auditable; readiness=ready-to-verify; evidence=unknown
- Suggested next action: Attach at least one supporting evidence item, or split/defer the claim if no concrete evidence would make the human judgment honest.
- Human claim quality: [ ] keep [ ] merge [ ] split [ ] reword [ ] drop [ ] unsure
- Human corrected audience: [ ] keep [ ] user [ ] developer [ ] unclear
- Human corrected semantic group: [ ] keep [ ] Adapter and portability [ ] Agent and skill workflow [ ] Claim discovery and review [ ] Documentation and contracts [ ] Evaluation surfaces [ ] General product behavior [ ] Improvement and optimization [ ] Packets and reporting [ ] Quality gates [ ] Release and packaging [ ] other:
- Human corrected proof: [ ] keep [ ] human-auditable [ ] deterministic [ ] cautilus-eval
- Human readiness: [ ] keep [ ] ready-to-verify [ ] needs-scenario [ ] needs-alignment [ ] blocked
- Human priority: [ ] high [ ] medium [ ] low [ ] later [ ] unsure
- Human notes:
- Trace: 1 source ref; docs/contracts/claim-discovery-workflow.md:327

##### claim-docs-contracts-claim-discovery-workflow-md-550

- Summary: Depth 3 must be paired with visible source, candidate, cluster, and review-budget bounds.
- Current labels: audience=developer; proof=human-auditable; readiness=ready-to-verify; evidence=unknown
- Suggested next action: Attach at least one supporting evidence item, or split/defer the claim if no concrete evidence would make the human judgment honest.
- Human claim quality: [ ] keep [ ] merge [ ] split [ ] reword [ ] drop [ ] unsure
- Human corrected audience: [ ] keep [ ] user [ ] developer [ ] unclear
- Human corrected semantic group: [ ] keep [ ] Adapter and portability [ ] Agent and skill workflow [ ] Claim discovery and review [ ] Documentation and contracts [ ] Evaluation surfaces [ ] General product behavior [ ] Improvement and optimization [ ] Packets and reporting [ ] Quality gates [ ] Release and packaging [ ] other:
- Human corrected proof: [ ] keep [ ] human-auditable [ ] deterministic [ ] cautilus-eval
- Human readiness: [ ] keep [ ] ready-to-verify [ ] needs-scenario [ ] needs-alignment [ ] blocked
- Human priority: [ ] high [ ] medium [ ] low [ ] later [ ] unsure
- Human notes:
- Trace: 1 source ref; docs/contracts/claim-discovery-workflow.md:550

##### claim-docs-contracts-runner-readiness-md-172

- Summary: This document owns assessment existence, scope, freshness, proof class, and recommendation.
- Current labels: audience=developer; proof=human-auditable; readiness=ready-to-verify; evidence=unknown
- Suggested next action: Attach at least one supporting evidence item, or split/defer the claim if no concrete evidence would make the human judgment honest.
- Human claim quality: [ ] keep [ ] merge [ ] split [ ] reword [ ] drop [ ] unsure
- Human corrected audience: [ ] keep [ ] user [ ] developer [ ] unclear
- Human corrected semantic group: [ ] keep [ ] Adapter and portability [ ] Agent and skill workflow [ ] Claim discovery and review [ ] Documentation and contracts [ ] Evaluation surfaces [ ] General product behavior [ ] Improvement and optimization [ ] Packets and reporting [ ] Quality gates [ ] Release and packaging [ ] other:
- Human corrected proof: [ ] keep [ ] human-auditable [ ] deterministic [ ] cautilus-eval
- Human readiness: [ ] keep [ ] ready-to-verify [ ] needs-scenario [ ] needs-alignment [ ] blocked
- Human priority: [ ] high [ ] medium [ ] low [ ] later [ ] unsure
- Human notes:
- Trace: 1 source ref; docs/contracts/runner-readiness.md:172

##### claim-docs-contracts-scenario-proposal-sources-md-216

- Summary: The draft scenario embedded in each proposal should be normalized enough for a human to accept, edit, or reject it without re-deriving the context.
- Current labels: audience=developer; proof=human-auditable; readiness=ready-to-verify; evidence=unknown
- Suggested next action: Attach at least one supporting evidence item, or split/defer the claim if no concrete evidence would make the human judgment honest.
- Human claim quality: [ ] keep [ ] merge [ ] split [ ] reword [ ] drop [ ] unsure
- Human corrected audience: [ ] keep [ ] user [ ] developer [ ] unclear
- Human corrected semantic group: [ ] keep [ ] Adapter and portability [ ] Agent and skill workflow [ ] Claim discovery and review [ ] Documentation and contracts [ ] Evaluation surfaces [ ] General product behavior [ ] Improvement and optimization [ ] Packets and reporting [ ] Quality gates [ ] Release and packaging [ ] other:
- Human corrected proof: [ ] keep [ ] human-auditable [ ] deterministic [ ] cautilus-eval
- Human readiness: [ ] keep [ ] ready-to-verify [ ] needs-scenario [ ] needs-alignment [ ] blocked
- Human priority: [ ] high [ ] medium [ ] low [ ] later [ ] unsure
- Human notes:
- Trace: 1 source ref; docs/contracts/scenario-proposal-sources.md:216

##### claim-docs-contracts-scenario-proposal-sources-md-254

- Summary: Should blocked-run proposals and human-conversation proposals share one ranking queue, or should they be ranked per source kind first?
- Current labels: audience=developer; proof=human-auditable; readiness=ready-to-verify; evidence=unknown
- Suggested next action: Attach at least one supporting evidence item, or split/defer the claim if no concrete evidence would make the human judgment honest.
- Human claim quality: [ ] keep [ ] merge [ ] split [ ] reword [ ] drop [ ] unsure
- Human corrected audience: [ ] keep [ ] user [ ] developer [ ] unclear
- Human corrected semantic group: [ ] keep [ ] Adapter and portability [ ] Agent and skill workflow [ ] Claim discovery and review [ ] Documentation and contracts [ ] Evaluation surfaces [ ] General product behavior [ ] Improvement and optimization [ ] Packets and reporting [ ] Quality gates [ ] Release and packaging [ ] other:
- Human corrected proof: [ ] keep [ ] human-auditable [ ] deterministic [ ] cautilus-eval
- Human readiness: [ ] keep [ ] ready-to-verify [ ] needs-scenario [ ] needs-alignment [ ] blocked
- Human priority: [ ] high [ ] medium [ ] low [ ] later [ ] unsure
- Human notes:
- Trace: 1 source ref; docs/contracts/scenario-proposal-sources.md:254

##### claim-docs-contracts-scenario-proposal-sources-md-40

- Summary: The proposal engine should read from four source ports.
- Current labels: audience=developer; proof=human-auditable; readiness=ready-to-verify; evidence=unknown
- Suggested next action: Attach at least one supporting evidence item, or split/defer the claim if no concrete evidence would make the human judgment honest.
- Human claim quality: [ ] keep [ ] merge [ ] split [ ] reword [ ] drop [ ] unsure
- Human corrected audience: [ ] keep [ ] user [ ] developer [ ] unclear
- Human corrected semantic group: [ ] keep [ ] Adapter and portability [ ] Agent and skill workflow [ ] Claim discovery and review [ ] Documentation and contracts [ ] Evaluation surfaces [ ] General product behavior [ ] Improvement and optimization [ ] Packets and reporting [ ] Quality gates [ ] Release and packaging [ ] other:
- Human corrected proof: [ ] keep [ ] human-auditable [ ] deterministic [ ] cautilus-eval
- Human readiness: [ ] keep [ ] ready-to-verify [ ] needs-scenario [ ] needs-alignment [ ] blocked
- Human priority: [ ] high [ ] medium [ ] low [ ] later [ ] unsure
- Human notes:
- Trace: 1 source ref; docs/contracts/scenario-proposal-sources.md:40

### Evaluation surfaces (1)

#### Human-auditable / blocked / evidence unknown (1)

##### claim-agents-md-29

- Summary: The long-term direction is intent-first and intentful behavior evaluation: prompts can change if the evaluated behavior gets better.
- Current labels: audience=developer; proof=human-auditable; readiness=blocked; evidence=unknown
- Suggested next action: If this should remain a proof target, split it into concrete product claims under the roadmap/spec surface, such as claim/eval/optimize allowing prompt changes only when held-out behavior evidence improves.
- Human claim quality: [ ] keep [ ] merge [ ] split [ ] reword [ ] drop [ ] unsure
- Human corrected audience: [ ] keep [ ] user [ ] developer [ ] unclear
- Human corrected semantic group: [ ] keep [ ] Adapter and portability [ ] Agent and skill workflow [ ] Claim discovery and review [ ] Documentation and contracts [ ] Evaluation surfaces [ ] General product behavior [ ] Improvement and optimization [ ] Packets and reporting [ ] Quality gates [ ] Release and packaging [ ] other:
- Human corrected proof: [ ] keep [ ] human-auditable [ ] deterministic [ ] cautilus-eval
- Human readiness: [ ] keep [ ] ready-to-verify [ ] needs-scenario [ ] needs-alignment [ ] blocked
- Human priority: [ ] high [ ] medium [ ] low [ ] later [ ] unsure
- Human notes:
- Trace: 1 source ref; AGENTS.md:29

### General product behavior (1)

#### Human-auditable / blocked / evidence unknown (1)

##### claim-agents-md-73

- Summary: While implementing, any bug, error, regression, or unexpected behavior routes to `charness:debug` before further fixes.
- Current labels: audience=developer; proof=human-auditable; readiness=blocked; evidence=unknown
- Suggested next action: Keep as an operating rule rather than a satisfied product claim, or add a narrower audited-process claim that points to recent debug artifacts and commit discipline.
- Human claim quality: [ ] keep [ ] merge [ ] split [ ] reword [ ] drop [ ] unsure
- Human corrected audience: [ ] keep [ ] user [ ] developer [ ] unclear
- Human corrected semantic group: [ ] keep [ ] Adapter and portability [ ] Agent and skill workflow [ ] Claim discovery and review [ ] Documentation and contracts [ ] Evaluation surfaces [ ] General product behavior [ ] Improvement and optimization [ ] Packets and reporting [ ] Quality gates [ ] Release and packaging [ ] other:
- Human corrected proof: [ ] keep [ ] human-auditable [ ] deterministic [ ] cautilus-eval
- Human readiness: [ ] keep [ ] ready-to-verify [ ] needs-scenario [ ] needs-alignment [ ] blocked
- Human priority: [ ] high [ ] medium [ ] low [ ] later [ ] unsure
- Human notes:
- Trace: 1 source ref; AGENTS.md:73

### Improvement and optimization (17)

#### Cautilus eval / app/prompt / ready-to-verify / evidence unknown (2)

##### claim-docs-contracts-optimization-md-132

- Summary: `optimize prepare-input` keeps a shared behavior-intent profile above raw prompt or adapter mechanics.
- Current labels: audience=developer; proof=cautilus-eval; eval surface=app/prompt; readiness=ready-to-verify; evidence=unknown
- Suggested next action: Create a host-owned app/prompt fixture and run it through cautilus eval test.
- Human claim quality: [ ] keep [ ] merge [ ] split [ ] reword [ ] drop [ ] unsure
- Human corrected audience: [ ] keep [ ] user [ ] developer [ ] unclear
- Human corrected semantic group: [ ] keep [ ] Adapter and portability [ ] Agent and skill workflow [ ] Claim discovery and review [ ] Documentation and contracts [ ] Evaluation surfaces [ ] General product behavior [ ] Improvement and optimization [ ] Packets and reporting [ ] Quality gates [ ] Release and packaging [ ] other:
- Human corrected proof: [ ] keep [ ] human-auditable [ ] deterministic [ ] cautilus-eval
- Human corrected eval surface: [ ] keep [ ] dev/repo [ ] dev/skill [ ] app/chat [ ] app/prompt [ ] surface undecided
- Human readiness: [ ] keep [ ] ready-to-verify [ ] needs-scenario [ ] needs-alignment [ ] blocked
- Human priority: [ ] high [ ] medium [ ] low [ ] later [ ] unsure
- Human notes:
- Trace: 1 source ref; docs/contracts/optimization.md:132

##### claim-docs-contracts-runtime-fingerprint-optimization-md-261

- Summary: This sequence keeps the evidence honest before asking optimize search to mutate prompts more aggressively.
- Current labels: audience=developer; proof=cautilus-eval; eval surface=app/prompt; readiness=ready-to-verify; evidence=unknown
- Suggested next action: Create a host-owned app/prompt fixture and run it through cautilus eval test.
- Human claim quality: [ ] keep [ ] merge [ ] split [ ] reword [ ] drop [ ] unsure
- Human corrected audience: [ ] keep [ ] user [ ] developer [ ] unclear
- Human corrected semantic group: [ ] keep [ ] Adapter and portability [ ] Agent and skill workflow [ ] Claim discovery and review [ ] Documentation and contracts [ ] Evaluation surfaces [ ] General product behavior [ ] Improvement and optimization [ ] Packets and reporting [ ] Quality gates [ ] Release and packaging [ ] other:
- Human corrected proof: [ ] keep [ ] human-auditable [ ] deterministic [ ] cautilus-eval
- Human corrected eval surface: [ ] keep [ ] dev/repo [ ] dev/skill [ ] app/chat [ ] app/prompt [ ] surface undecided
- Human readiness: [ ] keep [ ] ready-to-verify [ ] needs-scenario [ ] needs-alignment [ ] blocked
- Human priority: [ ] high [ ] medium [ ] low [ ] later [ ] unsure
- Human notes:
- Trace: 1 source ref; docs/contracts/runtime-fingerprint-optimization.md:261

#### Cautilus eval / dev/repo / ready-to-verify / evidence unknown (8)

##### claim-docs-contracts-runner-readiness-md-147

- Summary: When only fixture smoke exists, optimize may prepare or explain missing proof, but it should not claim behavior improvement.
- Current labels: audience=developer; proof=cautilus-eval; eval surface=dev/repo; readiness=ready-to-verify; evidence=unknown
- Suggested next action: Create a host-owned dev/repo fixture and run it through cautilus eval test.
- Human claim quality: [ ] keep [ ] merge [ ] split [ ] reword [ ] drop [ ] unsure
- Human corrected audience: [ ] keep [ ] user [ ] developer [ ] unclear
- Human corrected semantic group: [ ] keep [ ] Adapter and portability [ ] Agent and skill workflow [ ] Claim discovery and review [ ] Documentation and contracts [ ] Evaluation surfaces [ ] General product behavior [ ] Improvement and optimization [ ] Packets and reporting [ ] Quality gates [ ] Release and packaging [ ] other:
- Human corrected proof: [ ] keep [ ] human-auditable [ ] deterministic [ ] cautilus-eval
- Human corrected eval surface: [ ] keep [ ] dev/repo [ ] dev/skill [ ] app/chat [ ] app/prompt [ ] surface undecided
- Human readiness: [ ] keep [ ] ready-to-verify [ ] needs-scenario [ ] needs-alignment [ ] blocked
- Human priority: [ ] high [ ] medium [ ] low [ ] later [ ] unsure
- Human notes:
- Trace: 1 source ref; docs/contracts/runner-readiness.md:147

##### claim-docs-contracts-runner-readiness-md-150

- Summary: They must be marked non-actionable for app behavior improvement unless the claim explicitly targets that proof class.
- Current labels: audience=developer; proof=cautilus-eval; eval surface=dev/repo; readiness=ready-to-verify; evidence=unknown
- Suggested next action: Create a host-owned dev/repo fixture and run it through cautilus eval test.
- Human claim quality: [ ] keep [ ] merge [ ] split [ ] reword [ ] drop [ ] unsure
- Human corrected audience: [ ] keep [ ] user [ ] developer [ ] unclear
- Human corrected semantic group: [ ] keep [ ] Adapter and portability [ ] Agent and skill workflow [ ] Claim discovery and review [ ] Documentation and contracts [ ] Evaluation surfaces [ ] General product behavior [ ] Improvement and optimization [ ] Packets and reporting [ ] Quality gates [ ] Release and packaging [ ] other:
- Human corrected proof: [ ] keep [ ] human-auditable [ ] deterministic [ ] cautilus-eval
- Human corrected eval surface: [ ] keep [ ] dev/repo [ ] dev/skill [ ] app/chat [ ] app/prompt [ ] surface undecided
- Human readiness: [ ] keep [ ] ready-to-verify [ ] needs-scenario [ ] needs-alignment [ ] blocked
- Human priority: [ ] high [ ] medium [ ] low [ ] later [ ] unsure
- Human notes:
- Trace: 1 source ref; docs/contracts/runner-readiness.md:150

##### claim-docs-contracts-runner-readiness-md-37

- Summary: `optimize` requires runner-backed proof before changing behavior.
- Current labels: audience=developer; proof=cautilus-eval; eval surface=dev/repo; readiness=ready-to-verify; evidence=unknown
- Suggested next action: Create a host-owned dev/repo fixture and run it through cautilus eval test.
- Human claim quality: [ ] keep [ ] merge [ ] split [ ] reword [ ] drop [ ] unsure
- Human corrected audience: [ ] keep [ ] user [ ] developer [ ] unclear
- Human corrected semantic group: [ ] keep [ ] Adapter and portability [ ] Agent and skill workflow [ ] Claim discovery and review [ ] Documentation and contracts [ ] Evaluation surfaces [ ] General product behavior [ ] Improvement and optimization [ ] Packets and reporting [ ] Quality gates [ ] Release and packaging [ ] other:
- Human corrected proof: [ ] keep [ ] human-auditable [ ] deterministic [ ] cautilus-eval
- Human corrected eval surface: [ ] keep [ ] dev/repo [ ] dev/skill [ ] app/chat [ ] app/prompt [ ] surface undecided
- Human readiness: [ ] keep [ ] ready-to-verify [ ] needs-scenario [ ] needs-alignment [ ] blocked
- Human priority: [ ] high [ ] medium [ ] low [ ] later [ ] unsure
- Human notes:
- Trace: 1 source ref; docs/contracts/runner-readiness.md:37

##### claim-docs-contracts-runner-readiness-md-409

- Summary: Implementation notes should update this document before changing adapter, doctor, status, claim, eval, or optimize behavior in ways that affect the runner substrate.
- Current labels: audience=developer; proof=cautilus-eval; eval surface=dev/repo; readiness=ready-to-verify; evidence=unknown
- Suggested next action: Create a host-owned dev/repo fixture and run it through cautilus eval test.
- Human claim quality: [ ] keep [ ] merge [ ] split [ ] reword [ ] drop [ ] unsure
- Human corrected audience: [ ] keep [ ] user [ ] developer [ ] unclear
- Human corrected semantic group: [ ] keep [ ] Adapter and portability [ ] Agent and skill workflow [ ] Claim discovery and review [ ] Documentation and contracts [ ] Evaluation surfaces [ ] General product behavior [ ] Improvement and optimization [ ] Packets and reporting [ ] Quality gates [ ] Release and packaging [ ] other:
- Human corrected proof: [ ] keep [ ] human-auditable [ ] deterministic [ ] cautilus-eval
- Human corrected eval surface: [ ] keep [ ] dev/repo [ ] dev/skill [ ] app/chat [ ] app/prompt [ ] surface undecided
- Human readiness: [ ] keep [ ] ready-to-verify [ ] needs-scenario [ ] needs-alignment [ ] blocked
- Human priority: [ ] high [ ] medium [ ] low [ ] later [ ] unsure
- Human notes:
- Trace: 1 source ref; docs/contracts/runner-readiness.md:409

##### claim-docs-contracts-runner-readiness-md-45

- Summary: `optimize` improves behavior only after the proof surface is honest.
- Current labels: audience=developer; proof=cautilus-eval; eval surface=dev/repo; readiness=ready-to-verify; evidence=unknown
- Suggested next action: Create a host-owned dev/repo fixture and run it through cautilus eval test.
- Human claim quality: [ ] keep [ ] merge [ ] split [ ] reword [ ] drop [ ] unsure
- Human corrected audience: [ ] keep [ ] user [ ] developer [ ] unclear
- Human corrected semantic group: [ ] keep [ ] Adapter and portability [ ] Agent and skill workflow [ ] Claim discovery and review [ ] Documentation and contracts [ ] Evaluation surfaces [ ] General product behavior [ ] Improvement and optimization [ ] Packets and reporting [ ] Quality gates [ ] Release and packaging [ ] other:
- Human corrected proof: [ ] keep [ ] human-auditable [ ] deterministic [ ] cautilus-eval
- Human corrected eval surface: [ ] keep [ ] dev/repo [ ] dev/skill [ ] app/chat [ ] app/prompt [ ] surface undecided
- Human readiness: [ ] keep [ ] ready-to-verify [ ] needs-scenario [ ] needs-alignment [ ] blocked
- Human priority: [ ] high [ ] medium [ ] low [ ] later [ ] unsure
- Human notes:
- Trace: 1 source ref; docs/contracts/runner-readiness.md:45

##### claim-docs-contracts-runtime-fingerprint-optimization-md-161

- Summary: Model-change-driven optimize suggestions should preserve:
- Current labels: audience=developer; proof=cautilus-eval; eval surface=dev/repo; readiness=ready-to-verify; evidence=unknown
- Suggested next action: Create a host-owned dev/repo fixture and run it through cautilus eval test.
- Human claim quality: [ ] keep [ ] merge [ ] split [ ] reword [ ] drop [ ] unsure
- Human corrected audience: [ ] keep [ ] user [ ] developer [ ] unclear
- Human corrected semantic group: [ ] keep [ ] Adapter and portability [ ] Agent and skill workflow [ ] Claim discovery and review [ ] Documentation and contracts [ ] Evaluation surfaces [ ] General product behavior [ ] Improvement and optimization [ ] Packets and reporting [ ] Quality gates [ ] Release and packaging [ ] other:
- Human corrected proof: [ ] keep [ ] human-auditable [ ] deterministic [ ] cautilus-eval
- Human corrected eval surface: [ ] keep [ ] dev/repo [ ] dev/skill [ ] app/chat [ ] app/prompt [ ] surface undecided
- Human readiness: [ ] keep [ ] ready-to-verify [ ] needs-scenario [ ] needs-alignment [ ] blocked
- Human priority: [ ] high [ ] medium [ ] low [ ] later [ ] unsure
- Human notes:
- Trace: 1 source ref; docs/contracts/runtime-fingerprint-optimization.md:161

##### claim-docs-contracts-runtime-fingerprint-optimization-md-47

- Summary: Optimization should prefer the shortest, least specialized target that preserves or improves the evaluated behavior.
- Current labels: audience=developer; proof=cautilus-eval; eval surface=dev/repo; readiness=ready-to-verify; evidence=unknown
- Suggested next action: Create a host-owned dev/repo fixture and run it through cautilus eval test.
- Human claim quality: [ ] keep [ ] merge [ ] split [ ] reword [ ] drop [ ] unsure
- Human corrected audience: [ ] keep [ ] user [ ] developer [ ] unclear
- Human corrected semantic group: [ ] keep [ ] Adapter and portability [ ] Agent and skill workflow [ ] Claim discovery and review [ ] Documentation and contracts [ ] Evaluation surfaces [ ] General product behavior [ ] Improvement and optimization [ ] Packets and reporting [ ] Quality gates [ ] Release and packaging [ ] other:
- Human corrected proof: [ ] keep [ ] human-auditable [ ] deterministic [ ] cautilus-eval
- Human corrected eval surface: [ ] keep [ ] dev/repo [ ] dev/skill [ ] app/chat [ ] app/prompt [ ] surface undecided
- Human readiness: [ ] keep [ ] ready-to-verify [ ] needs-scenario [ ] needs-alignment [ ] blocked
- Human priority: [ ] high [ ] medium [ ] low [ ] later [ ] unsure
- Human notes:
- Trace: 1 source ref; docs/contracts/runtime-fingerprint-optimization.md:47

##### claim-docs-specs-maintainer-scenario-history-normalization-spec-md-19

- Summary: It should stay separate from optimization unless the claim is specifically about budgeted behavior improvement.
- Current labels: audience=developer; proof=cautilus-eval; eval surface=dev/repo; readiness=ready-to-verify; evidence=unknown
- Suggested next action: Create a host-owned dev/repo fixture and run it through cautilus eval test.
- Human claim quality: [ ] keep [ ] merge [ ] split [ ] reword [ ] drop [ ] unsure
- Human corrected audience: [ ] keep [ ] user [ ] developer [ ] unclear
- Human corrected semantic group: [ ] keep [ ] Adapter and portability [ ] Agent and skill workflow [ ] Claim discovery and review [ ] Documentation and contracts [ ] Evaluation surfaces [ ] General product behavior [ ] Improvement and optimization [ ] Packets and reporting [ ] Quality gates [ ] Release and packaging [ ] other:
- Human corrected proof: [ ] keep [ ] human-auditable [ ] deterministic [ ] cautilus-eval
- Human corrected eval surface: [ ] keep [ ] dev/repo [ ] dev/skill [ ] app/chat [ ] app/prompt [ ] surface undecided
- Human readiness: [ ] keep [ ] ready-to-verify [ ] needs-scenario [ ] needs-alignment [ ] blocked
- Human priority: [ ] high [ ] medium [ ] low [ ] later [ ] unsure
- Human notes:
- Trace: 1 source ref; docs/specs/maintainer/scenario-history-normalization.spec.md:19

#### Cautilus eval / dev/skill / ready-to-verify / evidence unknown (1)

##### claim-docs-contracts-runner-readiness-md-279

- Summary: It should not split into separate discover, eval, optimize, and runner skills.
- Current labels: audience=developer; proof=cautilus-eval; eval surface=dev/skill; readiness=ready-to-verify; evidence=unknown
- Suggested next action: Create a host-owned dev/skill fixture and run it through cautilus eval test.
- Human claim quality: [ ] keep [ ] merge [ ] split [ ] reword [ ] drop [ ] unsure
- Human corrected audience: [ ] keep [ ] user [ ] developer [ ] unclear
- Human corrected semantic group: [ ] keep [ ] Adapter and portability [ ] Agent and skill workflow [ ] Claim discovery and review [ ] Documentation and contracts [ ] Evaluation surfaces [ ] General product behavior [ ] Improvement and optimization [ ] Packets and reporting [ ] Quality gates [ ] Release and packaging [ ] other:
- Human corrected proof: [ ] keep [ ] human-auditable [ ] deterministic [ ] cautilus-eval
- Human corrected eval surface: [ ] keep [ ] dev/repo [ ] dev/skill [ ] app/chat [ ] app/prompt [ ] surface undecided
- Human readiness: [ ] keep [ ] ready-to-verify [ ] needs-scenario [ ] needs-alignment [ ] blocked
- Human priority: [ ] high [ ] medium [ ] low [ ] later [ ] unsure
- Human notes:
- Trace: 1 source ref; docs/contracts/runner-readiness.md:279

#### Deterministic gate / ready-to-verify / evidence unknown (4)

##### claim-docs-contracts-optimization-md-136

- Summary: `optimize build-artifact` emits one durable packet that can be reopened without rediscovering optimize inputs by hand.
- Current labels: audience=developer; proof=deterministic; readiness=ready-to-verify; evidence=unknown
- Suggested next action: Keep or add deterministic packet schema, command-output, or golden-file proof for this claim.
- Human claim quality: [ ] keep [ ] merge [ ] split [ ] reword [ ] drop [ ] unsure
- Human corrected audience: [ ] keep [ ] user [ ] developer [ ] unclear
- Human corrected semantic group: [ ] keep [ ] Adapter and portability [ ] Agent and skill workflow [ ] Claim discovery and review [ ] Documentation and contracts [ ] Evaluation surfaces [ ] General product behavior [ ] Improvement and optimization [ ] Packets and reporting [ ] Quality gates [ ] Release and packaging [ ] other:
- Human corrected proof: [ ] keep [ ] human-auditable [ ] deterministic [ ] cautilus-eval
- Human readiness: [ ] keep [ ] ready-to-verify [ ] needs-scenario [ ] needs-alignment [ ] blocked
- Human priority: [ ] high [ ] medium [ ] low [ ] later [ ] unsure
- Human notes:
- Trace: 1 source ref; docs/contracts/optimization.md:136

##### claim-docs-contracts-optimization-md-151

- Summary: Update the optimize input builder, optimize proposal generator, revision artifact builder, schemas, fixtures, and flow tests so the optimize seam keeps one durable packet for the next bounded revision.
- Current labels: audience=developer; proof=deterministic; readiness=ready-to-verify; evidence=unknown
- Suggested next action: Keep or add a repo-owned unit, lint, build, schema, or CI check for this claim.
- Human claim quality: [ ] keep [ ] merge [ ] split [ ] reword [ ] drop [ ] unsure
- Human corrected audience: [ ] keep [ ] user [ ] developer [ ] unclear
- Human corrected semantic group: [ ] keep [ ] Adapter and portability [ ] Agent and skill workflow [ ] Claim discovery and review [ ] Documentation and contracts [ ] Evaluation surfaces [ ] General product behavior [ ] Improvement and optimization [ ] Packets and reporting [ ] Quality gates [ ] Release and packaging [ ] other:
- Human corrected proof: [ ] keep [ ] human-auditable [ ] deterministic [ ] cautilus-eval
- Human readiness: [ ] keep [ ] ready-to-verify [ ] needs-scenario [ ] needs-alignment [ ] blocked
- Human priority: [ ] high [ ] medium [ ] low [ ] later [ ] unsure
- Human notes:
- Trace: 1 source ref; docs/contracts/optimization.md:151

##### claim-docs-contracts-optimization-md-34

- Summary: The optimizer still emits one bounded next-revision brief, not a compile loop.
- Current labels: audience=developer; proof=deterministic; readiness=ready-to-verify; evidence=unknown
- Suggested next action: Keep or add a repo-owned unit, lint, build, schema, or CI check for this claim.
- Human claim quality: [ ] keep [ ] merge [ ] split [ ] reword [ ] drop [ ] unsure
- Human corrected audience: [ ] keep [ ] user [ ] developer [ ] unclear
- Human corrected semantic group: [ ] keep [ ] Adapter and portability [ ] Agent and skill workflow [ ] Claim discovery and review [ ] Documentation and contracts [ ] Evaluation surfaces [ ] General product behavior [ ] Improvement and optimization [ ] Packets and reporting [ ] Quality gates [ ] Release and packaging [ ] other:
- Human corrected proof: [ ] keep [ ] human-auditable [ ] deterministic [ ] cautilus-eval
- Human readiness: [ ] keep [ ] ready-to-verify [ ] needs-scenario [ ] needs-alignment [ ] blocked
- Human priority: [ ] high [ ] medium [ ] low [ ] later [ ] unsure
- Human notes:
- Trace: 1 source ref; docs/contracts/optimization.md:34

##### claim-docs-gepa-md-15

- Summary: Sparse evidence blocks search early with machine-readable JSON so an agent or operator can discuss what is missing before generating candidates.
- Current labels: audience=developer; proof=deterministic; readiness=ready-to-verify; evidence=unknown
- Suggested next action: Keep or add deterministic packet schema, command-output, or golden-file proof for this claim.
- Human claim quality: [ ] keep [ ] merge [ ] split [ ] reword [ ] drop [ ] unsure
- Human corrected audience: [ ] keep [ ] user [ ] developer [ ] unclear
- Human corrected semantic group: [ ] keep [ ] Adapter and portability [ ] Agent and skill workflow [ ] Claim discovery and review [ ] Documentation and contracts [ ] Evaluation surfaces [ ] General product behavior [ ] Improvement and optimization [ ] Packets and reporting [ ] Quality gates [ ] Release and packaging [ ] other:
- Human corrected proof: [ ] keep [ ] human-auditable [ ] deterministic [ ] cautilus-eval
- Human readiness: [ ] keep [ ] ready-to-verify [ ] needs-scenario [ ] needs-alignment [ ] blocked
- Human priority: [ ] high [ ] medium [ ] low [ ] later [ ] unsure
- Human notes:
- Trace: 1 source ref; docs/gepa.md:15

#### Human-auditable / needs-alignment / evidence unknown (1)

##### claim-docs-master-plan-md-179

- Summary: Keep widening HTML surfaces only when the packet boundary stays stable and the page meaningfully improves human review; agents should consume durable packets first.
- Current labels: audience=developer; proof=human-auditable; readiness=needs-alignment; evidence=unknown
- Suggested next action: Reconcile or cite the matching adapter, CLI, docs, and test surfaces before treating this as satisfied.
- Human claim quality: [ ] keep [ ] merge [ ] split [ ] reword [ ] drop [ ] unsure
- Human corrected audience: [ ] keep [ ] user [ ] developer [ ] unclear
- Human corrected semantic group: [ ] keep [ ] Adapter and portability [ ] Agent and skill workflow [ ] Claim discovery and review [ ] Documentation and contracts [ ] Evaluation surfaces [ ] General product behavior [ ] Improvement and optimization [ ] Packets and reporting [ ] Quality gates [ ] Release and packaging [ ] other:
- Human corrected proof: [ ] keep [ ] human-auditable [ ] deterministic [ ] cautilus-eval
- Human readiness: [ ] keep [ ] ready-to-verify [ ] needs-scenario [ ] needs-alignment [ ] blocked
- Human priority: [ ] high [ ] medium [ ] low [ ] later [ ] unsure
- Human notes:
- Trace: 1 source ref; docs/master-plan.md:179

#### Human-auditable / ready-to-verify / evidence unknown (1)

##### claim-docs-contracts-reporting-md-150

- Summary: Human-review failures must be reported even when the benchmark score improves.
- Current labels: audience=developer; proof=human-auditable; readiness=ready-to-verify; evidence=unknown
- Suggested next action: Attach at least one supporting evidence item, or split/defer the claim if no concrete evidence would make the human judgment honest.
- Human claim quality: [ ] keep [ ] merge [ ] split [ ] reword [ ] drop [ ] unsure
- Human corrected audience: [ ] keep [ ] user [ ] developer [ ] unclear
- Human corrected semantic group: [ ] keep [ ] Adapter and portability [ ] Agent and skill workflow [ ] Claim discovery and review [ ] Documentation and contracts [ ] Evaluation surfaces [ ] General product behavior [ ] Improvement and optimization [ ] Packets and reporting [ ] Quality gates [ ] Release and packaging [ ] other:
- Human corrected proof: [ ] keep [ ] human-auditable [ ] deterministic [ ] cautilus-eval
- Human readiness: [ ] keep [ ] ready-to-verify [ ] needs-scenario [ ] needs-alignment [ ] blocked
- Human priority: [ ] high [ ] medium [ ] low [ ] later [ ] unsure
- Human notes:
- Trace: 1 source ref; docs/contracts/reporting.md:150

### Packets and reporting (32)

#### Cautilus eval / app/prompt / ready-to-verify / evidence unknown (2)

##### claim-docs-contracts-claim-discovery-workflow-md-399

- Summary: The LLM review seam should use versioned packets instead of hidden prompt-only behavior:
- Current labels: audience=developer; proof=cautilus-eval; eval surface=app/prompt; readiness=ready-to-verify; evidence=unknown
- Suggested next action: Create a host-owned app/prompt fixture and run it through cautilus eval test.
- Human claim quality: [ ] keep [ ] merge [ ] split [ ] reword [ ] drop [ ] unsure
- Human corrected audience: [ ] keep [ ] user [ ] developer [ ] unclear
- Human corrected semantic group: [ ] keep [ ] Adapter and portability [ ] Agent and skill workflow [ ] Claim discovery and review [ ] Documentation and contracts [ ] Evaluation surfaces [ ] General product behavior [ ] Improvement and optimization [ ] Packets and reporting [ ] Quality gates [ ] Release and packaging [ ] other:
- Human corrected proof: [ ] keep [ ] human-auditable [ ] deterministic [ ] cautilus-eval
- Human corrected eval surface: [ ] keep [ ] dev/repo [ ] dev/skill [ ] app/chat [ ] app/prompt [ ] surface undecided
- Human readiness: [ ] keep [ ] ready-to-verify [ ] needs-scenario [ ] needs-alignment [ ] blocked
- Human priority: [ ] high [ ] medium [ ] low [ ] later [ ] unsure
- Human notes:
- Trace: 1 source ref; docs/contracts/claim-discovery-workflow.md:399

##### claim-docs-contracts-claim-discovery-workflow-md-404

- Summary: Those packets should record cluster IDs, candidate IDs, source refs, prompt/reference hashes, runtime/model identity when available, merge decisions, label changes, evidence-status reasons, unresolved questions, and skipped clusters.
- Current labels: audience=developer; proof=cautilus-eval; eval surface=app/prompt; readiness=ready-to-verify; evidence=unknown
- Suggested next action: Create a host-owned app/prompt fixture and run it through cautilus eval test.
- Human claim quality: [ ] keep [ ] merge [ ] split [ ] reword [ ] drop [ ] unsure
- Human corrected audience: [ ] keep [ ] user [ ] developer [ ] unclear
- Human corrected semantic group: [ ] keep [ ] Adapter and portability [ ] Agent and skill workflow [ ] Claim discovery and review [ ] Documentation and contracts [ ] Evaluation surfaces [ ] General product behavior [ ] Improvement and optimization [ ] Packets and reporting [ ] Quality gates [ ] Release and packaging [ ] other:
- Human corrected proof: [ ] keep [ ] human-auditable [ ] deterministic [ ] cautilus-eval
- Human corrected eval surface: [ ] keep [ ] dev/repo [ ] dev/skill [ ] app/chat [ ] app/prompt [ ] surface undecided
- Human readiness: [ ] keep [ ] ready-to-verify [ ] needs-scenario [ ] needs-alignment [ ] blocked
- Human priority: [ ] high [ ] medium [ ] low [ ] later [ ] unsure
- Human notes:
- Trace: 1 source ref; docs/contracts/claim-discovery-workflow.md:404

#### Cautilus eval / dev/repo / ready-to-verify / evidence unknown (10)

##### claim-docs-contracts-active-run-md-59

- Summary: The manifest is only a recognition marker for the pruner; workflow metadata belongs in per-command artifacts, not in the manifest.
- Current labels: audience=developer; proof=cautilus-eval; eval surface=dev/repo; readiness=ready-to-verify; evidence=unknown
- Suggested next action: Create a host-owned dev/repo fixture and run it through cautilus eval test.
- Human claim quality: [ ] keep [ ] merge [ ] split [ ] reword [ ] drop [ ] unsure
- Human corrected audience: [ ] keep [ ] user [ ] developer [ ] unclear
- Human corrected semantic group: [ ] keep [ ] Adapter and portability [ ] Agent and skill workflow [ ] Claim discovery and review [ ] Documentation and contracts [ ] Evaluation surfaces [ ] General product behavior [ ] Improvement and optimization [ ] Packets and reporting [ ] Quality gates [ ] Release and packaging [ ] other:
- Human corrected proof: [ ] keep [ ] human-auditable [ ] deterministic [ ] cautilus-eval
- Human corrected eval surface: [ ] keep [ ] dev/repo [ ] dev/skill [ ] app/chat [ ] app/prompt [ ] surface undecided
- Human readiness: [ ] keep [ ] ready-to-verify [ ] needs-scenario [ ] needs-alignment [ ] blocked
- Human priority: [ ] high [ ] medium [ ] low [ ] later [ ] unsure
- Human notes:
- Trace: 1 source ref; docs/contracts/active-run.md:59

##### claim-docs-contracts-claim-discovery-workflow-md-506

- Summary: The status packet should include a `discoveryBoundary` block that says the packet is based on entry documents and linked Markdown, and that undeclared user-facing behavior is an entry-surface gap rather than a discoverable claim.
- Current labels: audience=developer; proof=cautilus-eval; eval surface=dev/repo; readiness=ready-to-verify; evidence=unknown
- Suggested next action: Create a host-owned dev/repo fixture and run it through cautilus eval test.
- Human claim quality: [ ] keep [ ] merge [ ] split [ ] reword [ ] drop [ ] unsure
- Human corrected audience: [ ] keep [ ] user [ ] developer [ ] unclear
- Human corrected semantic group: [ ] keep [ ] Adapter and portability [ ] Agent and skill workflow [ ] Claim discovery and review [ ] Documentation and contracts [ ] Evaluation surfaces [ ] General product behavior [ ] Improvement and optimization [ ] Packets and reporting [ ] Quality gates [ ] Release and packaging [ ] other:
- Human corrected proof: [ ] keep [ ] human-auditable [ ] deterministic [ ] cautilus-eval
- Human corrected eval surface: [ ] keep [ ] dev/repo [ ] dev/skill [ ] app/chat [ ] app/prompt [ ] surface undecided
- Human readiness: [ ] keep [ ] ready-to-verify [ ] needs-scenario [ ] needs-alignment [ ] blocked
- Human priority: [ ] high [ ] medium [ ] low [ ] later [ ] unsure
- Human notes:
- Trace: 1 source ref; docs/contracts/claim-discovery-workflow.md:506

##### claim-docs-contracts-review-packet-md-3

- Summary: `Cautilus` should keep review prompts, schemas, compare questions, and report artifacts on one durable boundary before executor variants run.
- Current labels: audience=developer; proof=cautilus-eval; eval surface=dev/repo; readiness=ready-to-verify; evidence=unknown
- Suggested next action: Create a host-owned dev/repo fixture and run it through cautilus eval test.
- Human claim quality: [ ] keep [ ] merge [ ] split [ ] reword [ ] drop [ ] unsure
- Human corrected audience: [ ] keep [ ] user [ ] developer [ ] unclear
- Human corrected semantic group: [ ] keep [ ] Adapter and portability [ ] Agent and skill workflow [ ] Claim discovery and review [ ] Documentation and contracts [ ] Evaluation surfaces [ ] General product behavior [ ] Improvement and optimization [ ] Packets and reporting [ ] Quality gates [ ] Release and packaging [ ] other:
- Human corrected proof: [ ] keep [ ] human-auditable [ ] deterministic [ ] cautilus-eval
- Human corrected eval surface: [ ] keep [ ] dev/repo [ ] dev/skill [ ] app/chat [ ] app/prompt [ ] surface undecided
- Human readiness: [ ] keep [ ] ready-to-verify [ ] needs-scenario [ ] needs-alignment [ ] blocked
- Human priority: [ ] high [ ] medium [ ] low [ ] later [ ] unsure
- Human notes:
- Trace: 1 source ref; docs/contracts/review-packet.md:3

##### claim-docs-contracts-runtime-fingerprint-optimization-md-100

- Summary: Alias matching is intentionally not inferred in the first slice unless the runtime emits both requested and resolved model fields.
- Current labels: audience=developer; proof=cautilus-eval; eval surface=dev/repo; readiness=ready-to-verify; evidence=unknown
- Suggested next action: Create a host-owned dev/repo fixture and run it through cautilus eval test.
- Human claim quality: [ ] keep [ ] merge [ ] split [ ] reword [ ] drop [ ] unsure
- Human corrected audience: [ ] keep [ ] user [ ] developer [ ] unclear
- Human corrected semantic group: [ ] keep [ ] Adapter and portability [ ] Agent and skill workflow [ ] Claim discovery and review [ ] Documentation and contracts [ ] Evaluation surfaces [ ] General product behavior [ ] Improvement and optimization [ ] Packets and reporting [ ] Quality gates [ ] Release and packaging [ ] other:
- Human corrected proof: [ ] keep [ ] human-auditable [ ] deterministic [ ] cautilus-eval
- Human corrected eval surface: [ ] keep [ ] dev/repo [ ] dev/skill [ ] app/chat [ ] app/prompt [ ] surface undecided
- Human readiness: [ ] keep [ ] ready-to-verify [ ] needs-scenario [ ] needs-alignment [ ] blocked
- Human priority: [ ] high [ ] medium [ ] low [ ] later [ ] unsure
- Human notes:
- Trace: 1 source ref; docs/contracts/runtime-fingerprint-optimization.md:100

##### claim-docs-contracts-runtime-fingerprint-optimization-md-190

- Summary: Report and evidence packets can carry runtime-context reason codes without treating them as behavior regressions.
- Current labels: audience=developer; proof=cautilus-eval; eval surface=dev/repo; readiness=ready-to-verify; evidence=unknown
- Suggested next action: Create a host-owned dev/repo fixture and run it through cautilus eval test.
- Human claim quality: [ ] keep [ ] merge [ ] split [ ] reword [ ] drop [ ] unsure
- Human corrected audience: [ ] keep [ ] user [ ] developer [ ] unclear
- Human corrected semantic group: [ ] keep [ ] Adapter and portability [ ] Agent and skill workflow [ ] Claim discovery and review [ ] Documentation and contracts [ ] Evaluation surfaces [ ] General product behavior [ ] Improvement and optimization [ ] Packets and reporting [ ] Quality gates [ ] Release and packaging [ ] other:
- Human corrected proof: [ ] keep [ ] human-auditable [ ] deterministic [ ] cautilus-eval
- Human corrected eval surface: [ ] keep [ ] dev/repo [ ] dev/skill [ ] app/chat [ ] app/prompt [ ] surface undecided
- Human readiness: [ ] keep [ ] ready-to-verify [ ] needs-scenario [ ] needs-alignment [ ] blocked
- Human priority: [ ] high [ ] medium [ ] low [ ] later [ ] unsure
- Human notes:
- Trace: 1 source ref; docs/contracts/runtime-fingerprint-optimization.md:190

##### claim-docs-contracts-runtime-fingerprint-optimization-md-3

- Summary: `Cautilus` should make model and provider changes visible without turning every evaluation into a pinned-model benchmark.
- Current labels: audience=developer; proof=cautilus-eval; eval surface=dev/repo; readiness=ready-to-verify; evidence=unknown
- Suggested next action: Create a host-owned dev/repo fixture and run it through cautilus eval test.
- Human claim quality: [ ] keep [ ] merge [ ] split [ ] reword [ ] drop [ ] unsure
- Human corrected audience: [ ] keep [ ] user [ ] developer [ ] unclear
- Human corrected semantic group: [ ] keep [ ] Adapter and portability [ ] Agent and skill workflow [ ] Claim discovery and review [ ] Documentation and contracts [ ] Evaluation surfaces [ ] General product behavior [ ] Improvement and optimization [ ] Packets and reporting [ ] Quality gates [ ] Release and packaging [ ] other:
- Human corrected proof: [ ] keep [ ] human-auditable [ ] deterministic [ ] cautilus-eval
- Human corrected eval surface: [ ] keep [ ] dev/repo [ ] dev/skill [ ] app/chat [ ] app/prompt [ ] surface undecided
- Human readiness: [ ] keep [ ] ready-to-verify [ ] needs-scenario [ ] needs-alignment [ ] blocked
- Human priority: [ ] high [ ] medium [ ] low [ ] later [ ] unsure
- Human notes:
- Trace: 1 source ref; docs/contracts/runtime-fingerprint-optimization.md:3

##### claim-docs-contracts-runtime-fingerprint-optimization-md-36

- Summary: Under the default policy, a model or provider change should produce a context warning, not a failing result.
- Current labels: audience=developer; proof=cautilus-eval; eval surface=dev/repo; readiness=ready-to-verify; evidence=unknown
- Suggested next action: Create a host-owned dev/repo fixture and run it through cautilus eval test.
- Human claim quality: [ ] keep [ ] merge [ ] split [ ] reword [ ] drop [ ] unsure
- Human corrected audience: [ ] keep [ ] user [ ] developer [ ] unclear
- Human corrected semantic group: [ ] keep [ ] Adapter and portability [ ] Agent and skill workflow [ ] Claim discovery and review [ ] Documentation and contracts [ ] Evaluation surfaces [ ] General product behavior [ ] Improvement and optimization [ ] Packets and reporting [ ] Quality gates [ ] Release and packaging [ ] other:
- Human corrected proof: [ ] keep [ ] human-auditable [ ] deterministic [ ] cautilus-eval
- Human corrected eval surface: [ ] keep [ ] dev/repo [ ] dev/skill [ ] app/chat [ ] app/prompt [ ] surface undecided
- Human readiness: [ ] keep [ ] ready-to-verify [ ] needs-scenario [ ] needs-alignment [ ] blocked
- Human priority: [ ] high [ ] medium [ ] low [ ] later [ ] unsure
- Human notes:
- Trace: 1 source ref; docs/contracts/runtime-fingerprint-optimization.md:36

##### claim-docs-contracts-runtime-fingerprint-optimization-md-41

- Summary: `Cautilus` should not infer hidden model identity from human-oriented logs.
- Current labels: audience=developer; proof=cautilus-eval; eval surface=dev/repo; readiness=ready-to-verify; evidence=unknown
- Suggested next action: Create a host-owned dev/repo fixture and run it through cautilus eval test.
- Human claim quality: [ ] keep [ ] merge [ ] split [ ] reword [ ] drop [ ] unsure
- Human corrected audience: [ ] keep [ ] user [ ] developer [ ] unclear
- Human corrected semantic group: [ ] keep [ ] Adapter and portability [ ] Agent and skill workflow [ ] Claim discovery and review [ ] Documentation and contracts [ ] Evaluation surfaces [ ] General product behavior [ ] Improvement and optimization [ ] Packets and reporting [ ] Quality gates [ ] Release and packaging [ ] other:
- Human corrected proof: [ ] keep [ ] human-auditable [ ] deterministic [ ] cautilus-eval
- Human corrected eval surface: [ ] keep [ ] dev/repo [ ] dev/skill [ ] app/chat [ ] app/prompt [ ] surface undecided
- Human readiness: [ ] keep [ ] ready-to-verify [ ] needs-scenario [ ] needs-alignment [ ] blocked
- Human priority: [ ] high [ ] medium [ ] low [ ] later [ ] unsure
- Human notes:
- Trace: 1 source ref; docs/contracts/runtime-fingerprint-optimization.md:41

##### claim-docs-specs-maintainer-active-run-workspace-spec-md-13

- Summary: Cautilus can allocate and remember a per-run workspace for a workflow, but command artifacts own workflow metadata.
- Current labels: audience=developer; proof=cautilus-eval; eval surface=dev/repo; readiness=ready-to-verify; evidence=unknown
- Suggested next action: Create a host-owned dev/repo fixture and run it through cautilus eval test.
- Human claim quality: [ ] keep [ ] merge [ ] split [ ] reword [ ] drop [ ] unsure
- Human corrected audience: [ ] keep [ ] user [ ] developer [ ] unclear
- Human corrected semantic group: [ ] keep [ ] Adapter and portability [ ] Agent and skill workflow [ ] Claim discovery and review [ ] Documentation and contracts [ ] Evaluation surfaces [ ] General product behavior [ ] Improvement and optimization [ ] Packets and reporting [ ] Quality gates [ ] Release and packaging [ ] other:
- Human corrected proof: [ ] keep [ ] human-auditable [ ] deterministic [ ] cautilus-eval
- Human corrected eval surface: [ ] keep [ ] dev/repo [ ] dev/skill [ ] app/chat [ ] app/prompt [ ] surface undecided
- Human readiness: [ ] keep [ ] ready-to-verify [ ] needs-scenario [ ] needs-alignment [ ] blocked
- Human priority: [ ] high [ ] medium [ ] low [ ] later [ ] unsure
- Human notes:
- Trace: 1 source ref; docs/specs/maintainer/active-run-workspace.spec.md:13

##### claim-docs-specs-maintainer-reporting-review-variants-spec-md-19

- Summary: It should not claim behavior proof by itself; reports are views over evidence.
- Current labels: audience=developer; proof=cautilus-eval; eval surface=dev/repo; readiness=ready-to-verify; evidence=unknown
- Suggested next action: Create a host-owned dev/repo fixture and run it through cautilus eval test.
- Human claim quality: [ ] keep [ ] merge [ ] split [ ] reword [ ] drop [ ] unsure
- Human corrected audience: [ ] keep [ ] user [ ] developer [ ] unclear
- Human corrected semantic group: [ ] keep [ ] Adapter and portability [ ] Agent and skill workflow [ ] Claim discovery and review [ ] Documentation and contracts [ ] Evaluation surfaces [ ] General product behavior [ ] Improvement and optimization [ ] Packets and reporting [ ] Quality gates [ ] Release and packaging [ ] other:
- Human corrected proof: [ ] keep [ ] human-auditable [ ] deterministic [ ] cautilus-eval
- Human corrected eval surface: [ ] keep [ ] dev/repo [ ] dev/skill [ ] app/chat [ ] app/prompt [ ] surface undecided
- Human readiness: [ ] keep [ ] ready-to-verify [ ] needs-scenario [ ] needs-alignment [ ] blocked
- Human priority: [ ] high [ ] medium [ ] low [ ] later [ ] unsure
- Human notes:
- Trace: 1 source ref; docs/specs/maintainer/reporting-review-variants.spec.md:19

#### Deterministic gate / ready-to-verify / evidence unknown (13)

##### claim-docs-contracts-claim-discovery-workflow-md-100

- Summary: When a repo maintains canonical catalogs, it should also keep a machine-readable mapping artifact that projects raw claim ids onto canonical user-facing or maintainer-facing claim ids.
- Current labels: audience=developer; proof=deterministic; readiness=ready-to-verify; evidence=unknown
- Suggested next action: Keep or add deterministic packet schema, command-output, or golden-file proof for this claim.
- Human claim quality: [ ] keep [ ] merge [ ] split [ ] reword [ ] drop [ ] unsure
- Human corrected audience: [ ] keep [ ] user [ ] developer [ ] unclear
- Human corrected semantic group: [ ] keep [ ] Adapter and portability [ ] Agent and skill workflow [ ] Claim discovery and review [ ] Documentation and contracts [ ] Evaluation surfaces [ ] General product behavior [ ] Improvement and optimization [ ] Packets and reporting [ ] Quality gates [ ] Release and packaging [ ] other:
- Human corrected proof: [ ] keep [ ] human-auditable [ ] deterministic [ ] cautilus-eval
- Human readiness: [ ] keep [ ] ready-to-verify [ ] needs-scenario [ ] needs-alignment [ ] blocked
- Human priority: [ ] high [ ] medium [ ] low [ ] later [ ] unsure
- Human notes:
- Trace: 1 source ref; docs/contracts/claim-discovery-workflow.md:100

##### claim-docs-contracts-claim-discovery-workflow-md-607

- Summary: Whether `claim show` should grow Markdown or HTML rendering beyond its JSON summary packet.
- Current labels: audience=developer; proof=deterministic; readiness=ready-to-verify; evidence=unknown
- Suggested next action: Keep or add deterministic packet, catalog, schema, or renderer proof for this claim.
- Human claim quality: [ ] keep [ ] merge [ ] split [ ] reword [ ] drop [ ] unsure
- Human corrected audience: [ ] keep [ ] user [ ] developer [ ] unclear
- Human corrected semantic group: [ ] keep [ ] Adapter and portability [ ] Agent and skill workflow [ ] Claim discovery and review [ ] Documentation and contracts [ ] Evaluation surfaces [ ] General product behavior [ ] Improvement and optimization [ ] Packets and reporting [ ] Quality gates [ ] Release and packaging [ ] other:
- Human corrected proof: [ ] keep [ ] human-auditable [ ] deterministic [ ] cautilus-eval
- Human readiness: [ ] keep [ ] ready-to-verify [ ] needs-scenario [ ] needs-alignment [ ] blocked
- Human priority: [ ] high [ ] medium [ ] low [ ] later [ ] unsure
- Human notes:
- Trace: 1 source ref; docs/contracts/claim-discovery-workflow.md:607

##### claim-docs-contracts-claim-discovery-workflow-md-97

- Summary: Review packets and machine-readable curation artifacts should preserve absorbed raw claim ids and fingerprints when available.
- Current labels: audience=developer; proof=deterministic; readiness=ready-to-verify; evidence=unknown
- Suggested next action: Keep or add deterministic packet schema, command-output, or golden-file proof for this claim.
- Human claim quality: [ ] keep [ ] merge [ ] split [ ] reword [ ] drop [ ] unsure
- Human corrected audience: [ ] keep [ ] user [ ] developer [ ] unclear
- Human corrected semantic group: [ ] keep [ ] Adapter and portability [ ] Agent and skill workflow [ ] Claim discovery and review [ ] Documentation and contracts [ ] Evaluation surfaces [ ] General product behavior [ ] Improvement and optimization [ ] Packets and reporting [ ] Quality gates [ ] Release and packaging [ ] other:
- Human corrected proof: [ ] keep [ ] human-auditable [ ] deterministic [ ] cautilus-eval
- Human readiness: [ ] keep [ ] ready-to-verify [ ] needs-scenario [ ] needs-alignment [ ] blocked
- Human priority: [ ] high [ ] medium [ ] low [ ] later [ ] unsure
- Human notes:
- Trace: 1 source ref; docs/contracts/claim-discovery-workflow.md:97

##### claim-docs-contracts-live-run-invocation-batch-md-77

- Summary: For each kept scenario, the command expands `samplesPerScenario` into deterministic request ids and emits the canonical batch request packet.
- Current labels: audience=developer; proof=deterministic; readiness=ready-to-verify; evidence=unknown
- Suggested next action: Keep or add a repo-owned unit, lint, build, schema, or CI check for this claim.
- Human claim quality: [ ] keep [ ] merge [ ] split [ ] reword [ ] drop [ ] unsure
- Human corrected audience: [ ] keep [ ] user [ ] developer [ ] unclear
- Human corrected semantic group: [ ] keep [ ] Adapter and portability [ ] Agent and skill workflow [ ] Claim discovery and review [ ] Documentation and contracts [ ] Evaluation surfaces [ ] General product behavior [ ] Improvement and optimization [ ] Packets and reporting [ ] Quality gates [ ] Release and packaging [ ] other:
- Human corrected proof: [ ] keep [ ] human-auditable [ ] deterministic [ ] cautilus-eval
- Human readiness: [ ] keep [ ] ready-to-verify [ ] needs-scenario [ ] needs-alignment [ ] blocked
- Human priority: [ ] high [ ] medium [ ] low [ ] later [ ] unsure
- Human notes:
- Trace: 1 source ref; docs/contracts/live-run-invocation-batch.md:77

##### claim-docs-contracts-reporting-md-124

- Summary: The summary packet should also aggregate any explicit numeric telemetry across variants so operators can inspect one top-level view without scraping each verdict file separately.
- Current labels: audience=developer; proof=deterministic; readiness=ready-to-verify; evidence=unknown
- Suggested next action: Add or connect deterministic report-summary tests for aggregating numeric telemetry across variants.
- Human claim quality: [ ] keep [ ] merge [ ] split [ ] reword [ ] drop [ ] unsure
- Human corrected audience: [ ] keep [ ] user [ ] developer [ ] unclear
- Human corrected semantic group: [ ] keep [ ] Adapter and portability [ ] Agent and skill workflow [ ] Claim discovery and review [ ] Documentation and contracts [ ] Evaluation surfaces [ ] General product behavior [ ] Improvement and optimization [ ] Packets and reporting [ ] Quality gates [ ] Release and packaging [ ] other:
- Human corrected proof: [ ] keep [ ] human-auditable [ ] deterministic [ ] cautilus-eval
- Human readiness: [ ] keep [ ] ready-to-verify [ ] needs-scenario [ ] needs-alignment [ ] blocked
- Human priority: [ ] high [ ] medium [ ] low [ ] later [ ] unsure
- Human notes:
- Trace: 1 source ref; docs/contracts/reporting.md:124

##### claim-docs-contracts-reporting-md-129

- Summary: For held-out and full-gate reporting, mode runs should preserve that same scenario-level telemetry and lift it into a machine-readable report packet.
- Current labels: audience=developer; proof=deterministic; readiness=ready-to-verify; evidence=unknown
- Suggested next action: Keep or add deterministic packet schema, command-output, or golden-file proof for this claim.
- Human claim quality: [ ] keep [ ] merge [ ] split [ ] reword [ ] drop [ ] unsure
- Human corrected audience: [ ] keep [ ] user [ ] developer [ ] unclear
- Human corrected semantic group: [ ] keep [ ] Adapter and portability [ ] Agent and skill workflow [ ] Claim discovery and review [ ] Documentation and contracts [ ] Evaluation surfaces [ ] General product behavior [ ] Improvement and optimization [ ] Packets and reporting [ ] Quality gates [ ] Release and packaging [ ] other:
- Human corrected proof: [ ] keep [ ] human-auditable [ ] deterministic [ ] cautilus-eval
- Human readiness: [ ] keep [ ] ready-to-verify [ ] needs-scenario [ ] needs-alignment [ ] blocked
- Human priority: [ ] high [ ] medium [ ] low [ ] later [ ] unsure
- Human notes:
- Trace: 1 source ref; docs/contracts/reporting.md:129

##### claim-docs-contracts-reporting-md-48

- Summary: This keeps report assembly deterministic.
- Current labels: audience=developer; proof=deterministic; readiness=ready-to-verify; evidence=unknown
- Suggested next action: Keep or add a repo-owned unit, lint, build, schema, or CI check for this claim.
- Human claim quality: [ ] keep [ ] merge [ ] split [ ] reword [ ] drop [ ] unsure
- Human corrected audience: [ ] keep [ ] user [ ] developer [ ] unclear
- Human corrected semantic group: [ ] keep [ ] Adapter and portability [ ] Agent and skill workflow [ ] Claim discovery and review [ ] Documentation and contracts [ ] Evaluation surfaces [ ] General product behavior [ ] Improvement and optimization [ ] Packets and reporting [ ] Quality gates [ ] Release and packaging [ ] other:
- Human corrected proof: [ ] keep [ ] human-auditable [ ] deterministic [ ] cautilus-eval
- Human readiness: [ ] keep [ ] ready-to-verify [ ] needs-scenario [ ] needs-alignment [ ] blocked
- Human priority: [ ] high [ ] medium [ ] low [ ] later [ ] unsure
- Human notes:
- Trace: 1 source ref; docs/contracts/reporting.md:48

##### claim-docs-contracts-runner-readiness-md-134

- Summary: Each branch should expose a stable id, human label, blocking reason, required command or artifact, owning product family or setup helper, and whether the branch writes files.
- Current labels: audience=developer; proof=deterministic; readiness=ready-to-verify; evidence=unknown
- Suggested next action: Add or connect deterministic runner-readiness branch-shape tests for stable id, human label, blocking reason, command/artifact, owning surface, and write flag.
- Human claim quality: [ ] keep [ ] merge [ ] split [ ] reword [ ] drop [ ] unsure
- Human corrected audience: [ ] keep [ ] user [ ] developer [ ] unclear
- Human corrected semantic group: [ ] keep [ ] Adapter and portability [ ] Agent and skill workflow [ ] Claim discovery and review [ ] Documentation and contracts [ ] Evaluation surfaces [ ] General product behavior [ ] Improvement and optimization [ ] Packets and reporting [ ] Quality gates [ ] Release and packaging [ ] other:
- Human corrected proof: [ ] keep [ ] human-auditable [ ] deterministic [ ] cautilus-eval
- Human readiness: [ ] keep [ ] ready-to-verify [ ] needs-scenario [ ] needs-alignment [ ] blocked
- Human priority: [ ] high [ ] medium [ ] low [ ] later [ ] unsure
- Human notes:
- Trace: 1 source ref; docs/contracts/runner-readiness.md:134

##### claim-docs-contracts-runner-readiness-md-349

- Summary: Proof class must remain visible in downstream summaries and reports.
- Current labels: audience=developer; proof=deterministic; readiness=ready-to-verify; evidence=unknown
- Suggested next action: Add or connect deterministic summary/report tests proving proof class stays visible downstream.
- Human claim quality: [ ] keep [ ] merge [ ] split [ ] reword [ ] drop [ ] unsure
- Human corrected audience: [ ] keep [ ] user [ ] developer [ ] unclear
- Human corrected semantic group: [ ] keep [ ] Adapter and portability [ ] Agent and skill workflow [ ] Claim discovery and review [ ] Documentation and contracts [ ] Evaluation surfaces [ ] General product behavior [ ] Improvement and optimization [ ] Packets and reporting [ ] Quality gates [ ] Release and packaging [ ] other:
- Human corrected proof: [ ] keep [ ] human-auditable [ ] deterministic [ ] cautilus-eval
- Human readiness: [ ] keep [ ] ready-to-verify [ ] needs-scenario [ ] needs-alignment [ ] blocked
- Human priority: [ ] high [ ] medium [ ] low [ ] later [ ] unsure
- Human notes:
- Trace: 1 source ref; docs/contracts/runner-readiness.md:349

##### claim-docs-contracts-scenario-proposal-sources-md-28

- Summary: Those helpers should sit between source-port ingestion and proposal packet generation.
- Current labels: audience=developer; proof=deterministic; readiness=ready-to-verify; evidence=unknown
- Suggested next action: Keep or add deterministic scenario command, packet, or render proof for this claim.
- Human claim quality: [ ] keep [ ] merge [ ] split [ ] reword [ ] drop [ ] unsure
- Human corrected audience: [ ] keep [ ] user [ ] developer [ ] unclear
- Human corrected semantic group: [ ] keep [ ] Adapter and portability [ ] Agent and skill workflow [ ] Claim discovery and review [ ] Documentation and contracts [ ] Evaluation surfaces [ ] General product behavior [ ] Improvement and optimization [ ] Packets and reporting [ ] Quality gates [ ] Release and packaging [ ] other:
- Human corrected proof: [ ] keep [ ] human-auditable [ ] deterministic [ ] cautilus-eval
- Human readiness: [ ] keep [ ] ready-to-verify [ ] needs-scenario [ ] needs-alignment [ ] blocked
- Human priority: [ ] high [ ] medium [ ] low [ ] later [ ] unsure
- Human notes:
- Trace: 1 source ref; docs/contracts/scenario-proposal-sources.md:28

##### claim-docs-specs-maintainer-binary-skill-boundary-spec-md-13

- Summary: The binary owns deterministic command execution, packet schemas, help text, and reusable artifacts.
- Current labels: audience=developer; proof=deterministic; readiness=ready-to-verify; evidence=unknown
- Suggested next action: Keep or add a repo-owned unit, lint, build, schema, or CI check for this claim.
- Human claim quality: [ ] keep [ ] merge [ ] split [ ] reword [ ] drop [ ] unsure
- Human corrected audience: [ ] keep [ ] user [ ] developer [ ] unclear
- Human corrected semantic group: [ ] keep [ ] Adapter and portability [ ] Agent and skill workflow [ ] Claim discovery and review [ ] Documentation and contracts [ ] Evaluation surfaces [ ] General product behavior [ ] Improvement and optimization [ ] Packets and reporting [ ] Quality gates [ ] Release and packaging [ ] other:
- Human corrected proof: [ ] keep [ ] human-auditable [ ] deterministic [ ] cautilus-eval
- Human readiness: [ ] keep [ ] ready-to-verify [ ] needs-scenario [ ] needs-alignment [ ] blocked
- Human priority: [ ] high [ ] medium [ ] low [ ] later [ ] unsure
- Human notes:
- Trace: 1 source ref; docs/specs/maintainer/binary-skill-boundary.spec.md:13

##### claim-docs-specs-maintainer-reporting-review-variants-spec-md-13

- Summary: Cautilus should write machine-readable review packets first and render readable projections over the same data.
- Current labels: audience=developer; proof=deterministic; readiness=ready-to-verify; evidence=unknown
- Suggested next action: Keep or add deterministic packet schema, command-output, or golden-file proof for this claim.
- Human claim quality: [ ] keep [ ] merge [ ] split [ ] reword [ ] drop [ ] unsure
- Human corrected audience: [ ] keep [ ] user [ ] developer [ ] unclear
- Human corrected semantic group: [ ] keep [ ] Adapter and portability [ ] Agent and skill workflow [ ] Claim discovery and review [ ] Documentation and contracts [ ] Evaluation surfaces [ ] General product behavior [ ] Improvement and optimization [ ] Packets and reporting [ ] Quality gates [ ] Release and packaging [ ] other:
- Human corrected proof: [ ] keep [ ] human-auditable [ ] deterministic [ ] cautilus-eval
- Human readiness: [ ] keep [ ] ready-to-verify [ ] needs-scenario [ ] needs-alignment [ ] blocked
- Human priority: [ ] high [ ] medium [ ] low [ ] later [ ] unsure
- Human notes:
- Trace: 1 source ref; docs/specs/maintainer/reporting-review-variants.spec.md:13

##### claim-docs-specs-maintainer-scenario-history-normalization-spec-md-14

- Summary: Normalizers should produce inspectable proposal packets rather than hidden one-off shapers.
- Current labels: audience=developer; proof=deterministic; readiness=ready-to-verify; evidence=unknown
- Suggested next action: Keep or add deterministic scenario command, packet, or render proof for this claim.
- Human claim quality: [ ] keep [ ] merge [ ] split [ ] reword [ ] drop [ ] unsure
- Human corrected audience: [ ] keep [ ] user [ ] developer [ ] unclear
- Human corrected semantic group: [ ] keep [ ] Adapter and portability [ ] Agent and skill workflow [ ] Claim discovery and review [ ] Documentation and contracts [ ] Evaluation surfaces [ ] General product behavior [ ] Improvement and optimization [ ] Packets and reporting [ ] Quality gates [ ] Release and packaging [ ] other:
- Human corrected proof: [ ] keep [ ] human-auditable [ ] deterministic [ ] cautilus-eval
- Human readiness: [ ] keep [ ] ready-to-verify [ ] needs-scenario [ ] needs-alignment [ ] blocked
- Human priority: [ ] high [ ] medium [ ] low [ ] later [ ] unsure
- Human notes:
- Trace: 1 source ref; docs/specs/maintainer/scenario-history-normalization.spec.md:14

#### Human-auditable / needs-alignment / evidence unknown (4)

##### claim-docs-contracts-claim-discovery-workflow-md-686

- Summary: Commit drift caused only by generated claim artifacts remains visible as head drift without blocking review or eval planning.
- Current labels: audience=developer; proof=human-auditable; readiness=needs-alignment; evidence=unknown
- Suggested next action: Reconcile the named docs, code, skill, adapter, or CLI surface before treating this as a verification target.
- Human claim quality: [ ] keep [ ] merge [ ] split [ ] reword [ ] drop [ ] unsure
- Human corrected audience: [ ] keep [ ] user [ ] developer [ ] unclear
- Human corrected semantic group: [ ] keep [ ] Adapter and portability [ ] Agent and skill workflow [ ] Claim discovery and review [ ] Documentation and contracts [ ] Evaluation surfaces [ ] General product behavior [ ] Improvement and optimization [ ] Packets and reporting [ ] Quality gates [ ] Release and packaging [ ] other:
- Human corrected proof: [ ] keep [ ] human-auditable [ ] deterministic [ ] cautilus-eval
- Human readiness: [ ] keep [ ] ready-to-verify [ ] needs-scenario [ ] needs-alignment [ ] blocked
- Human priority: [ ] high [ ] medium [ ] low [ ] later [ ] unsure
- Human notes:
- Trace: 1 source ref; docs/contracts/claim-discovery-workflow.md:686

##### claim-docs-contracts-runner-verification-md-5

- Summary: This contract keeps that judgment packet-shaped and repo-owned instead of teaching the binary to reverse-engineer arbitrary app code.
- Current labels: audience=developer; proof=human-auditable; readiness=needs-alignment; evidence=unknown
- Suggested next action: Reconcile or cite the matching adapter, CLI, docs, and test surfaces before treating this as satisfied.
- Human claim quality: [ ] keep [ ] merge [ ] split [ ] reword [ ] drop [ ] unsure
- Human corrected audience: [ ] keep [ ] user [ ] developer [ ] unclear
- Human corrected semantic group: [ ] keep [ ] Adapter and portability [ ] Agent and skill workflow [ ] Claim discovery and review [ ] Documentation and contracts [ ] Evaluation surfaces [ ] General product behavior [ ] Improvement and optimization [ ] Packets and reporting [ ] Quality gates [ ] Release and packaging [ ] other:
- Human corrected proof: [ ] keep [ ] human-auditable [ ] deterministic [ ] cautilus-eval
- Human readiness: [ ] keep [ ] ready-to-verify [ ] needs-scenario [ ] needs-alignment [ ] blocked
- Human priority: [ ] high [ ] medium [ ] low [ ] later [ ] unsure
- Human notes:
- Trace: 1 source ref; docs/contracts/runner-verification.md:5

##### claim-docs-specs-maintainer-adapter-host-ownership-spec-md-13

- Summary: Cautilus owns generic workflow contracts, packet shapes, readiness semantics, behavior-surface vocabulary, and normalization helpers.
- Current labels: audience=developer; proof=human-auditable; readiness=needs-alignment; evidence=unknown
- Suggested next action: Reconcile or cite the matching adapter, CLI, docs, and test surfaces before treating this as satisfied.
- Human claim quality: [ ] keep [ ] merge [ ] split [ ] reword [ ] drop [ ] unsure
- Human corrected audience: [ ] keep [ ] user [ ] developer [ ] unclear
- Human corrected semantic group: [ ] keep [ ] Adapter and portability [ ] Agent and skill workflow [ ] Claim discovery and review [ ] Documentation and contracts [ ] Evaluation surfaces [ ] General product behavior [ ] Improvement and optimization [ ] Packets and reporting [ ] Quality gates [ ] Release and packaging [ ] other:
- Human corrected proof: [ ] keep [ ] human-auditable [ ] deterministic [ ] cautilus-eval
- Human readiness: [ ] keep [ ] ready-to-verify [ ] needs-scenario [ ] needs-alignment [ ] blocked
- Human priority: [ ] high [ ] medium [ ] low [ ] later [ ] unsure
- Human notes:
- Trace: 1 source ref; docs/specs/maintainer/adapter-host-ownership.spec.md:13

##### claim-docs-specs-maintainer-live-invocation-runtime-spec-md-13

- Summary: Cautilus owns the generic request/result packet and loop boundary.
- Current labels: audience=developer; proof=human-auditable; readiness=needs-alignment; evidence=unknown
- Suggested next action: Reconcile or cite the matching adapter, CLI, docs, and test surfaces before treating this as satisfied.
- Human claim quality: [ ] keep [ ] merge [ ] split [ ] reword [ ] drop [ ] unsure
- Human corrected audience: [ ] keep [ ] user [ ] developer [ ] unclear
- Human corrected semantic group: [ ] keep [ ] Adapter and portability [ ] Agent and skill workflow [ ] Claim discovery and review [ ] Documentation and contracts [ ] Evaluation surfaces [ ] General product behavior [ ] Improvement and optimization [ ] Packets and reporting [ ] Quality gates [ ] Release and packaging [ ] other:
- Human corrected proof: [ ] keep [ ] human-auditable [ ] deterministic [ ] cautilus-eval
- Human readiness: [ ] keep [ ] ready-to-verify [ ] needs-scenario [ ] needs-alignment [ ] blocked
- Human priority: [ ] high [ ] medium [ ] low [ ] later [ ] unsure
- Human notes:
- Trace: 1 source ref; docs/specs/maintainer/live-invocation-runtime.spec.md:13

#### Human-auditable / ready-to-verify / evidence unknown (3)

##### claim-docs-contracts-claim-discovery-workflow-md-181

- Summary: That selected map should drive status summaries and inspect/refresh branch commands, while `state_path` remains the default output path for first discovery.
- Current labels: audience=developer; proof=human-auditable; readiness=ready-to-verify; evidence=unknown
- Suggested next action: Attach at least one supporting evidence item, or split/defer the claim if no concrete evidence would make the human judgment honest.
- Human claim quality: [ ] keep [ ] merge [ ] split [ ] reword [ ] drop [ ] unsure
- Human corrected audience: [ ] keep [ ] user [ ] developer [ ] unclear
- Human corrected semantic group: [ ] keep [ ] Adapter and portability [ ] Agent and skill workflow [ ] Claim discovery and review [ ] Documentation and contracts [ ] Evaluation surfaces [ ] General product behavior [ ] Improvement and optimization [ ] Packets and reporting [ ] Quality gates [ ] Release and packaging [ ] other:
- Human corrected proof: [ ] keep [ ] human-auditable [ ] deterministic [ ] cautilus-eval
- Human readiness: [ ] keep [ ] ready-to-verify [ ] needs-scenario [ ] needs-alignment [ ] blocked
- Human priority: [ ] high [ ] medium [ ] low [ ] later [ ] unsure
- Human notes:
- Trace: 1 source ref; docs/contracts/claim-discovery-workflow.md:181

##### claim-docs-contracts-claim-discovery-workflow-md-254

- Summary: The claim should remain visible in the packet, but it should not become a fixture plan by default because one passing fixture would overclaim the umbrella promise.
- Current labels: audience=developer; proof=human-auditable; readiness=ready-to-verify; evidence=unknown
- Suggested next action: Attach at least one supporting evidence item, or split/defer the claim if no concrete evidence would make the human judgment honest.
- Human claim quality: [ ] keep [ ] merge [ ] split [ ] reword [ ] drop [ ] unsure
- Human corrected audience: [ ] keep [ ] user [ ] developer [ ] unclear
- Human corrected semantic group: [ ] keep [ ] Adapter and portability [ ] Agent and skill workflow [ ] Claim discovery and review [ ] Documentation and contracts [ ] Evaluation surfaces [ ] General product behavior [ ] Improvement and optimization [ ] Packets and reporting [ ] Quality gates [ ] Release and packaging [ ] other:
- Human corrected proof: [ ] keep [ ] human-auditable [ ] deterministic [ ] cautilus-eval
- Human readiness: [ ] keep [ ] ready-to-verify [ ] needs-scenario [ ] needs-alignment [ ] blocked
- Human priority: [ ] high [ ] medium [ ] low [ ] later [ ] unsure
- Human notes:
- Trace: 1 source ref; docs/contracts/claim-discovery-workflow.md:254

##### claim-docs-specs-maintainer-evidence-state-artifacts-spec-md-20

- Summary: Freshness must be visible whenever packets point at an older commit.
- Current labels: audience=developer; proof=human-auditable; readiness=ready-to-verify; evidence=unknown
- Suggested next action: Attach at least one supporting evidence item, or split/defer the claim if no concrete evidence would make the human judgment honest.
- Human claim quality: [ ] keep [ ] merge [ ] split [ ] reword [ ] drop [ ] unsure
- Human corrected audience: [ ] keep [ ] user [ ] developer [ ] unclear
- Human corrected semantic group: [ ] keep [ ] Adapter and portability [ ] Agent and skill workflow [ ] Claim discovery and review [ ] Documentation and contracts [ ] Evaluation surfaces [ ] General product behavior [ ] Improvement and optimization [ ] Packets and reporting [ ] Quality gates [ ] Release and packaging [ ] other:
- Human corrected proof: [ ] keep [ ] human-auditable [ ] deterministic [ ] cautilus-eval
- Human readiness: [ ] keep [ ] ready-to-verify [ ] needs-scenario [ ] needs-alignment [ ] blocked
- Human priority: [ ] high [ ] medium [ ] low [ ] later [ ] unsure
- Human notes:
- Trace: 1 source ref; docs/specs/maintainer/evidence-state-artifacts.spec.md:20

### Quality gates (20)

#### Cautilus eval / app/prompt / ready-to-verify / evidence unknown (1)

##### claim-docs-contracts-runner-readiness-md-13

- Summary: For app repos, a prompt-only fixture can accidentally test a copied prompt instead of the product.
- Current labels: audience=developer; proof=cautilus-eval; eval surface=app/prompt; readiness=ready-to-verify; evidence=unknown
- Suggested next action: Create a host-owned app/prompt fixture and run it through cautilus eval test.
- Human claim quality: [ ] keep [ ] merge [ ] split [ ] reword [ ] drop [ ] unsure
- Human corrected audience: [ ] keep [ ] user [ ] developer [ ] unclear
- Human corrected semantic group: [ ] keep [ ] Adapter and portability [ ] Agent and skill workflow [ ] Claim discovery and review [ ] Documentation and contracts [ ] Evaluation surfaces [ ] General product behavior [ ] Improvement and optimization [ ] Packets and reporting [ ] Quality gates [ ] Release and packaging [ ] other:
- Human corrected proof: [ ] keep [ ] human-auditable [ ] deterministic [ ] cautilus-eval
- Human corrected eval surface: [ ] keep [ ] dev/repo [ ] dev/skill [ ] app/chat [ ] app/prompt [ ] surface undecided
- Human readiness: [ ] keep [ ] ready-to-verify [ ] needs-scenario [ ] needs-alignment [ ] blocked
- Human priority: [ ] high [ ] medium [ ] low [ ] later [ ] unsure
- Human notes:
- Trace: 1 source ref; docs/contracts/runner-readiness.md:13

#### Cautilus eval / dev/repo / ready-to-verify / evidence unknown (4)

##### claim-docs-contracts-claim-discovery-workflow-md-96

- Summary: If specdown is missing, `doctor` should report the repo as not ready for the Cautilus claim-doc workflow.
- Current labels: audience=developer; proof=cautilus-eval; eval surface=dev/repo; readiness=ready-to-verify; evidence=unknown
- Suggested next action: Create a host-owned dev/repo fixture and run it through cautilus eval test.
- Human claim quality: [ ] keep [ ] merge [ ] split [ ] reword [ ] drop [ ] unsure
- Human corrected audience: [ ] keep [ ] user [ ] developer [ ] unclear
- Human corrected semantic group: [ ] keep [ ] Adapter and portability [ ] Agent and skill workflow [ ] Claim discovery and review [ ] Documentation and contracts [ ] Evaluation surfaces [ ] General product behavior [ ] Improvement and optimization [ ] Packets and reporting [ ] Quality gates [ ] Release and packaging [ ] other:
- Human corrected proof: [ ] keep [ ] human-auditable [ ] deterministic [ ] cautilus-eval
- Human corrected eval surface: [ ] keep [ ] dev/repo [ ] dev/skill [ ] app/chat [ ] app/prompt [ ] surface undecided
- Human readiness: [ ] keep [ ] ready-to-verify [ ] needs-scenario [ ] needs-alignment [ ] blocked
- Human priority: [ ] high [ ] medium [ ] low [ ] later [ ] unsure
- Human notes:
- Trace: 1 source ref; docs/contracts/claim-discovery-workflow.md:96

##### claim-docs-contracts-runner-readiness-md-111

- Summary: `doctor` should not infer that a runner shares production behavior by reading arbitrary app code.
- Current labels: audience=developer; proof=cautilus-eval; eval surface=dev/repo; readiness=ready-to-verify; evidence=unknown
- Suggested next action: Create a host-owned dev/repo fixture and run it through cautilus eval test.
- Human claim quality: [ ] keep [ ] merge [ ] split [ ] reword [ ] drop [ ] unsure
- Human corrected audience: [ ] keep [ ] user [ ] developer [ ] unclear
- Human corrected semantic group: [ ] keep [ ] Adapter and portability [ ] Agent and skill workflow [ ] Claim discovery and review [ ] Documentation and contracts [ ] Evaluation surfaces [ ] General product behavior [ ] Improvement and optimization [ ] Packets and reporting [ ] Quality gates [ ] Release and packaging [ ] other:
- Human corrected proof: [ ] keep [ ] human-auditable [ ] deterministic [ ] cautilus-eval
- Human corrected eval surface: [ ] keep [ ] dev/repo [ ] dev/skill [ ] app/chat [ ] app/prompt [ ] surface undecided
- Human readiness: [ ] keep [ ] ready-to-verify [ ] needs-scenario [ ] needs-alignment [ ] blocked
- Human priority: [ ] high [ ] medium [ ] low [ ] later [ ] unsure
- Human notes:
- Trace: 1 source ref; docs/contracts/runner-readiness.md:111

##### claim-docs-contracts-runner-verification-md-26

- Summary: external observation: behavior can be observed from outside the unit under test through artifacts the runner or agent cannot forge or silently erase
- Current labels: audience=developer; proof=cautilus-eval; eval surface=dev/repo; readiness=ready-to-verify; evidence=unknown
- Suggested next action: Create a host-owned dev/repo fixture and run it through cautilus eval test.
- Human claim quality: [ ] keep [ ] merge [ ] split [ ] reword [ ] drop [ ] unsure
- Human corrected audience: [ ] keep [ ] user [ ] developer [ ] unclear
- Human corrected semantic group: [ ] keep [ ] Adapter and portability [ ] Agent and skill workflow [ ] Claim discovery and review [ ] Documentation and contracts [ ] Evaluation surfaces [ ] General product behavior [ ] Improvement and optimization [ ] Packets and reporting [ ] Quality gates [ ] Release and packaging [ ] other:
- Human corrected proof: [ ] keep [ ] human-auditable [ ] deterministic [ ] cautilus-eval
- Human corrected eval surface: [ ] keep [ ] dev/repo [ ] dev/skill [ ] app/chat [ ] app/prompt [ ] surface undecided
- Human readiness: [ ] keep [ ] ready-to-verify [ ] needs-scenario [ ] needs-alignment [ ] blocked
- Human priority: [ ] high [ ] medium [ ] low [ ] later [ ] unsure
- Human notes:
- Trace: 1 source ref; docs/contracts/runner-verification.md:26

##### claim-docs-specs-maintainer-evaluation-surfaces-runners-spec-md-15

- Summary: Fixtures declare their surface and preset so the reader can tell what kind of behavior is under test.
- Current labels: audience=developer; proof=cautilus-eval; eval surface=dev/repo; readiness=ready-to-verify; evidence=unknown
- Suggested next action: Create a host-owned dev/repo fixture and run it through cautilus eval test.
- Human claim quality: [ ] keep [ ] merge [ ] split [ ] reword [ ] drop [ ] unsure
- Human corrected audience: [ ] keep [ ] user [ ] developer [ ] unclear
- Human corrected semantic group: [ ] keep [ ] Adapter and portability [ ] Agent and skill workflow [ ] Claim discovery and review [ ] Documentation and contracts [ ] Evaluation surfaces [ ] General product behavior [ ] Improvement and optimization [ ] Packets and reporting [ ] Quality gates [ ] Release and packaging [ ] other:
- Human corrected proof: [ ] keep [ ] human-auditable [ ] deterministic [ ] cautilus-eval
- Human corrected eval surface: [ ] keep [ ] dev/repo [ ] dev/skill [ ] app/chat [ ] app/prompt [ ] surface undecided
- Human readiness: [ ] keep [ ] ready-to-verify [ ] needs-scenario [ ] needs-alignment [ ] blocked
- Human priority: [ ] high [ ] medium [ ] low [ ] later [ ] unsure
- Human notes:
- Trace: 1 source ref; docs/specs/maintainer/evaluation-surfaces-runners.spec.md:15

#### Deterministic gate / ready-to-verify / evidence satisfied (3)

##### claim-agents-md-123

- Summary: `npm run test:on-demand` currently owns the heavier self-dogfood workflow script tests.
- Current labels: audience=developer; proof=deterministic; readiness=ready-to-verify; evidence=satisfied
- Suggested next action: Keep covered by `npm run test:on-demand` and maintainer check-layering docs when on-demand workflow ownership changes.
- Human claim quality: [ ] keep [ ] merge [ ] split [ ] reword [ ] drop [ ] unsure
- Human corrected audience: [ ] keep [ ] user [ ] developer [ ] unclear
- Human corrected semantic group: [ ] keep [ ] Adapter and portability [ ] Agent and skill workflow [ ] Claim discovery and review [ ] Documentation and contracts [ ] Evaluation surfaces [ ] General product behavior [ ] Improvement and optimization [ ] Packets and reporting [ ] Quality gates [ ] Release and packaging [ ] other:
- Human corrected proof: [ ] keep [ ] human-auditable [ ] deterministic [ ] cautilus-eval
- Human readiness: [ ] keep [ ] ready-to-verify [ ] needs-scenario [ ] needs-alignment [ ] blocked
- Human priority: [ ] high [ ] medium [ ] low [ ] later [ ] unsure
- Human notes:
- Trace: 1 source ref; AGENTS.md:123

##### claim-agents-md-78

- Summary: The skill should own routing, sequencing, guardrails, and decision boundaries; the binary should own broad command discovery, help text, scenario catalogs, packet examples, install smoke, and doctor/readiness details.
- Current labels: audience=developer; proof=deterministic; readiness=ready-to-verify; evidence=satisfied
- Suggested next action: Keep covered by `npm run lint:skill-disclosure` whenever the bundled skill, packaged skill, CLI registry, examples, or command docs change.
- Human claim quality: [ ] keep [ ] merge [ ] split [ ] reword [ ] drop [ ] unsure
- Human corrected audience: [ ] keep [ ] user [ ] developer [ ] unclear
- Human corrected semantic group: [ ] keep [ ] Adapter and portability [ ] Agent and skill workflow [ ] Claim discovery and review [ ] Documentation and contracts [ ] Evaluation surfaces [ ] General product behavior [ ] Improvement and optimization [ ] Packets and reporting [ ] Quality gates [ ] Release and packaging [ ] other:
- Human corrected proof: [ ] keep [ ] human-auditable [ ] deterministic [ ] cautilus-eval
- Human readiness: [ ] keep [ ] ready-to-verify [ ] needs-scenario [ ] needs-alignment [ ] blocked
- Human priority: [ ] high [ ] medium [ ] low [ ] later [ ] unsure
- Human notes:
- Trace: 1 source ref; AGENTS.md:78

##### claim-docs-master-plan-md-82

- Summary: `npm run lint:specs` and `npm run lint:scenario-normalizers` still gate the runtime completeness of the surviving `scenario normalize` helpers; new user-facing copy must reconcile with the surface/preset contract before landing.
- Current labels: audience=developer; proof=deterministic; readiness=ready-to-verify; evidence=satisfied
- Suggested next action: Keep covered by lint:specs and lint:scenario-normalizers whenever scenario-normalization vocabulary changes.
- Human claim quality: [ ] keep [ ] merge [ ] split [ ] reword [ ] drop [ ] unsure
- Human corrected audience: [ ] keep [ ] user [ ] developer [ ] unclear
- Human corrected semantic group: [ ] keep [ ] Adapter and portability [ ] Agent and skill workflow [ ] Claim discovery and review [ ] Documentation and contracts [ ] Evaluation surfaces [ ] General product behavior [ ] Improvement and optimization [ ] Packets and reporting [ ] Quality gates [ ] Release and packaging [ ] other:
- Human corrected proof: [ ] keep [ ] human-auditable [ ] deterministic [ ] cautilus-eval
- Human readiness: [ ] keep [ ] ready-to-verify [ ] needs-scenario [ ] needs-alignment [ ] blocked
- Human priority: [ ] high [ ] medium [ ] low [ ] later [ ] unsure
- Human notes:
- Trace: 1 source ref; docs/master-plan.md:82

#### Deterministic gate / ready-to-verify / evidence unknown (9)

##### claim-docs-contracts-claim-discovery-workflow-md-627

- Summary: The workflow can say which claims already have deterministic or Cautilus evidence, and which still need scenarios, tests, or alignment work.
- Current labels: audience=developer; proof=deterministic; readiness=ready-to-verify; evidence=unknown
- Suggested next action: Keep or add a repo-owned unit, lint, build, schema, or CI check for this claim.
- Human claim quality: [ ] keep [ ] merge [ ] split [ ] reword [ ] drop [ ] unsure
- Human corrected audience: [ ] keep [ ] user [ ] developer [ ] unclear
- Human corrected semantic group: [ ] keep [ ] Adapter and portability [ ] Agent and skill workflow [ ] Claim discovery and review [ ] Documentation and contracts [ ] Evaluation surfaces [ ] General product behavior [ ] Improvement and optimization [ ] Packets and reporting [ ] Quality gates [ ] Release and packaging [ ] other:
- Human corrected proof: [ ] keep [ ] human-auditable [ ] deterministic [ ] cautilus-eval
- Human readiness: [ ] keep [ ] ready-to-verify [ ] needs-scenario [ ] needs-alignment [ ] blocked
- Human priority: [ ] high [ ] medium [ ] low [ ] later [ ] unsure
- Human notes:
- Trace: 1 source ref; docs/contracts/claim-discovery-workflow.md:627

##### claim-docs-contracts-runner-readiness-md-29

- Summary: The first implementation slice should be read-only readiness visibility through `doctor` and `agent status`, plus a minimal runner assessment schema and example.
- Current labels: audience=developer; proof=deterministic; readiness=ready-to-verify; evidence=unknown
- Suggested next action: Keep or add a repo-owned unit, lint, build, schema, or CI check for this claim.
- Human claim quality: [ ] keep [ ] merge [ ] split [ ] reword [ ] drop [ ] unsure
- Human corrected audience: [ ] keep [ ] user [ ] developer [ ] unclear
- Human corrected semantic group: [ ] keep [ ] Adapter and portability [ ] Agent and skill workflow [ ] Claim discovery and review [ ] Documentation and contracts [ ] Evaluation surfaces [ ] General product behavior [ ] Improvement and optimization [ ] Packets and reporting [ ] Quality gates [ ] Release and packaging [ ] other:
- Human corrected proof: [ ] keep [ ] human-auditable [ ] deterministic [ ] cautilus-eval
- Human readiness: [ ] keep [ ] ready-to-verify [ ] needs-scenario [ ] needs-alignment [ ] blocked
- Human priority: [ ] high [ ] medium [ ] low [ ] later [ ] unsure
- Human notes:
- Trace: 1 source ref; docs/contracts/runner-readiness.md:29

##### claim-docs-contracts-runtime-fingerprint-optimization-md-154

- Summary: It should generate a candidate or revision brief, then require the same tests and review gates before the candidate is trusted.
- Current labels: audience=developer; proof=deterministic; readiness=ready-to-verify; evidence=unknown
- Suggested next action: Keep or add a repo-owned unit, lint, build, schema, or CI check for this claim.
- Human claim quality: [ ] keep [ ] merge [ ] split [ ] reword [ ] drop [ ] unsure
- Human corrected audience: [ ] keep [ ] user [ ] developer [ ] unclear
- Human corrected semantic group: [ ] keep [ ] Adapter and portability [ ] Agent and skill workflow [ ] Claim discovery and review [ ] Documentation and contracts [ ] Evaluation surfaces [ ] General product behavior [ ] Improvement and optimization [ ] Packets and reporting [ ] Quality gates [ ] Release and packaging [ ] other:
- Human corrected proof: [ ] keep [ ] human-auditable [ ] deterministic [ ] cautilus-eval
- Human readiness: [ ] keep [ ] ready-to-verify [ ] needs-scenario [ ] needs-alignment [ ] blocked
- Human priority: [ ] high [ ] medium [ ] low [ ] later [ ] unsure
- Human notes:
- Trace: 1 source ref; docs/contracts/runtime-fingerprint-optimization.md:154

##### claim-docs-contracts-runtime-fingerprint-optimization-md-188

- Summary: A skill or eval test can pass while still reporting that the observed runtime changed from the comparison evidence.
- Current labels: audience=developer; proof=deterministic; readiness=ready-to-verify; evidence=unknown
- Suggested next action: Keep or add a repo-owned unit, lint, build, schema, or CI check for this claim.
- Human claim quality: [ ] keep [ ] merge [ ] split [ ] reword [ ] drop [ ] unsure
- Human corrected audience: [ ] keep [ ] user [ ] developer [ ] unclear
- Human corrected semantic group: [ ] keep [ ] Adapter and portability [ ] Agent and skill workflow [ ] Claim discovery and review [ ] Documentation and contracts [ ] Evaluation surfaces [ ] General product behavior [ ] Improvement and optimization [ ] Packets and reporting [ ] Quality gates [ ] Release and packaging [ ] other:
- Human corrected proof: [ ] keep [ ] human-auditable [ ] deterministic [ ] cautilus-eval
- Human readiness: [ ] keep [ ] ready-to-verify [ ] needs-scenario [ ] needs-alignment [ ] blocked
- Human priority: [ ] high [ ] medium [ ] low [ ] later [ ] unsure
- Human notes:
- Trace: 1 source ref; docs/contracts/runtime-fingerprint-optimization.md:188

##### claim-docs-contracts-runtime-fingerprint-optimization-md-8

- Summary: By default, those tests should not force a model choice just to make evaluation evidence easier to compare.
- Current labels: audience=developer; proof=deterministic; readiness=ready-to-verify; evidence=unknown
- Suggested next action: Keep or add a repo-owned unit, lint, build, schema, or CI check for this claim.
- Human claim quality: [ ] keep [ ] merge [ ] split [ ] reword [ ] drop [ ] unsure
- Human corrected audience: [ ] keep [ ] user [ ] developer [ ] unclear
- Human corrected semantic group: [ ] keep [ ] Adapter and portability [ ] Agent and skill workflow [ ] Claim discovery and review [ ] Documentation and contracts [ ] Evaluation surfaces [ ] General product behavior [ ] Improvement and optimization [ ] Packets and reporting [ ] Quality gates [ ] Release and packaging [ ] other:
- Human corrected proof: [ ] keep [ ] human-auditable [ ] deterministic [ ] cautilus-eval
- Human readiness: [ ] keep [ ] ready-to-verify [ ] needs-scenario [ ] needs-alignment [ ] blocked
- Human priority: [ ] high [ ] medium [ ] low [ ] later [ ] unsure
- Human notes:
- Trace: 1 source ref; docs/contracts/runtime-fingerprint-optimization.md:8

##### claim-docs-contracts-scenario-history-md-238

- Summary: **Part 2 — broader compare ownership.** Extend history / compare hooks beyond the single profile-backed eval path so `review variants`, profile-less eval test runs, and skill evaluation can also update history and materialize compare artifacts.
- Current labels: audience=developer; proof=deterministic; readiness=ready-to-verify; evidence=unknown
- Suggested next action: Keep or add a repo-owned unit, lint, build, schema, or CI check for this claim.
- Human claim quality: [ ] keep [ ] merge [ ] split [ ] reword [ ] drop [ ] unsure
- Human corrected audience: [ ] keep [ ] user [ ] developer [ ] unclear
- Human corrected semantic group: [ ] keep [ ] Adapter and portability [ ] Agent and skill workflow [ ] Claim discovery and review [ ] Documentation and contracts [ ] Evaluation surfaces [ ] General product behavior [ ] Improvement and optimization [ ] Packets and reporting [ ] Quality gates [ ] Release and packaging [ ] other:
- Human corrected proof: [ ] keep [ ] human-auditable [ ] deterministic [ ] cautilus-eval
- Human readiness: [ ] keep [ ] ready-to-verify [ ] needs-scenario [ ] needs-alignment [ ] blocked
- Human priority: [ ] high [ ] medium [ ] low [ ] later [ ] unsure
- Human notes:
- Trace: 1 source ref; docs/contracts/scenario-history.md:238

##### claim-docs-specs-maintainer-binary-skill-boundary-spec-md-19

- Summary: `npm run lint:skill-disclosure` proves the bundled and packaged skill stay within the progressive-disclosure contract.
- Current labels: audience=developer; proof=deterministic; readiness=ready-to-verify; evidence=unknown
- Suggested next action: Keep or add a repo-owned unit, lint, build, schema, or CI check for this claim.
- Human claim quality: [ ] keep [ ] merge [ ] split [ ] reword [ ] drop [ ] unsure
- Human corrected audience: [ ] keep [ ] user [ ] developer [ ] unclear
- Human corrected semantic group: [ ] keep [ ] Adapter and portability [ ] Agent and skill workflow [ ] Claim discovery and review [ ] Documentation and contracts [ ] Evaluation surfaces [ ] General product behavior [ ] Improvement and optimization [ ] Packets and reporting [ ] Quality gates [ ] Release and packaging [ ] other:
- Human corrected proof: [ ] keep [ ] human-auditable [ ] deterministic [ ] cautilus-eval
- Human readiness: [ ] keep [ ] ready-to-verify [ ] needs-scenario [ ] needs-alignment [ ] blocked
- Human priority: [ ] high [ ] medium [ ] low [ ] later [ ] unsure
- Human notes:
- Trace: 1 source ref; docs/specs/maintainer/binary-skill-boundary.spec.md:19

##### claim-docs-specs-maintainer-claim-discovery-workflow-spec-md-19

- Summary: The next proof should attach this behavior to deterministic tests or an evidence bundle instead of leaving it as a one-session observation.
- Current labels: audience=developer; proof=deterministic; readiness=ready-to-verify; evidence=unknown
- Suggested next action: Keep or add a repo-owned unit, lint, build, schema, or CI check for this claim.
- Human claim quality: [ ] keep [ ] merge [ ] split [ ] reword [ ] drop [ ] unsure
- Human corrected audience: [ ] keep [ ] user [ ] developer [ ] unclear
- Human corrected semantic group: [ ] keep [ ] Adapter and portability [ ] Agent and skill workflow [ ] Claim discovery and review [ ] Documentation and contracts [ ] Evaluation surfaces [ ] General product behavior [ ] Improvement and optimization [ ] Packets and reporting [ ] Quality gates [ ] Release and packaging [ ] other:
- Human corrected proof: [ ] keep [ ] human-auditable [ ] deterministic [ ] cautilus-eval
- Human readiness: [ ] keep [ ] ready-to-verify [ ] needs-scenario [ ] needs-alignment [ ] blocked
- Human priority: [ ] high [ ] medium [ ] low [ ] later [ ] unsure
- Human notes:
- Trace: 1 source ref; docs/specs/maintainer/claim-discovery-workflow.spec.md:19

##### claim-docs-specs-maintainer-optimization-loop-spec-md-19

- Summary: The product needs packet-level tests and at least one held-out eval route that can reopen the before and after evidence.
- Current labels: audience=developer; proof=deterministic; readiness=ready-to-verify; evidence=unknown
- Suggested next action: Keep or add a repo-owned unit, lint, build, schema, or CI check for this claim.
- Human claim quality: [ ] keep [ ] merge [ ] split [ ] reword [ ] drop [ ] unsure
- Human corrected audience: [ ] keep [ ] user [ ] developer [ ] unclear
- Human corrected semantic group: [ ] keep [ ] Adapter and portability [ ] Agent and skill workflow [ ] Claim discovery and review [ ] Documentation and contracts [ ] Evaluation surfaces [ ] General product behavior [ ] Improvement and optimization [ ] Packets and reporting [ ] Quality gates [ ] Release and packaging [ ] other:
- Human corrected proof: [ ] keep [ ] human-auditable [ ] deterministic [ ] cautilus-eval
- Human readiness: [ ] keep [ ] ready-to-verify [ ] needs-scenario [ ] needs-alignment [ ] blocked
- Human priority: [ ] high [ ] medium [ ] low [ ] later [ ] unsure
- Human notes:
- Trace: 1 source ref; docs/specs/maintainer/optimization-loop.spec.md:19

#### Human-auditable / needs-alignment / evidence unknown (2)

##### claim-docs-contracts-claim-discovery-workflow-md-696

- Summary: It emits `cautilus.claim_eval_plan.v1` from reviewed `cautilus-eval` claims that are ready to verify, while preserving the host boundary by not writing fixtures, prompts, runners, wrappers, or policy.
- Current labels: audience=developer; proof=human-auditable; readiness=needs-alignment; evidence=unknown
- Suggested next action: Reconcile or cite the matching adapter, CLI, docs, and test surfaces before treating this as satisfied.
- Human claim quality: [ ] keep [ ] merge [ ] split [ ] reword [ ] drop [ ] unsure
- Human corrected audience: [ ] keep [ ] user [ ] developer [ ] unclear
- Human corrected semantic group: [ ] keep [ ] Adapter and portability [ ] Agent and skill workflow [ ] Claim discovery and review [ ] Documentation and contracts [ ] Evaluation surfaces [ ] General product behavior [ ] Improvement and optimization [ ] Packets and reporting [ ] Quality gates [ ] Release and packaging [ ] other:
- Human corrected proof: [ ] keep [ ] human-auditable [ ] deterministic [ ] cautilus-eval
- Human readiness: [ ] keep [ ] ready-to-verify [ ] needs-scenario [ ] needs-alignment [ ] blocked
- Human priority: [ ] high [ ] medium [ ] low [ ] later [ ] unsure
- Human notes:
- Trace: 1 source ref; docs/contracts/claim-discovery-workflow.md:696

##### claim-docs-specs-maintainer-readiness-runtime-status-spec-md-20

- Summary: The next proof should make sure `doctor` and `agent status` share runner-readiness drift logic rather than duplicating decisions.
- Current labels: audience=developer; proof=human-auditable; readiness=needs-alignment; evidence=unknown
- Suggested next action: Reconcile the named docs, code, skill, adapter, or CLI surface before treating this as a verification target.
- Human claim quality: [ ] keep [ ] merge [ ] split [ ] reword [ ] drop [ ] unsure
- Human corrected audience: [ ] keep [ ] user [ ] developer [ ] unclear
- Human corrected semantic group: [ ] keep [ ] Adapter and portability [ ] Agent and skill workflow [ ] Claim discovery and review [ ] Documentation and contracts [ ] Evaluation surfaces [ ] General product behavior [ ] Improvement and optimization [ ] Packets and reporting [ ] Quality gates [ ] Release and packaging [ ] other:
- Human corrected proof: [ ] keep [ ] human-auditable [ ] deterministic [ ] cautilus-eval
- Human readiness: [ ] keep [ ] ready-to-verify [ ] needs-scenario [ ] needs-alignment [ ] blocked
- Human priority: [ ] high [ ] medium [ ] low [ ] later [ ] unsure
- Human notes:
- Trace: 1 source ref; docs/specs/maintainer/readiness-runtime-status.spec.md:20

#### Human-auditable / ready-to-verify / evidence unknown (1)

##### claim-docs-contracts-claim-discovery-workflow-md-320

- Summary: `verificationReadiness=ready-to-verify` with `evidenceStatus=missing` means proof is absent but a test, fixture, or human-auditable check can now be created or run.
- Current labels: audience=developer; proof=human-auditable; readiness=ready-to-verify; evidence=unknown
- Suggested next action: Attach at least one supporting evidence item, or split/defer the claim if no concrete evidence would make the human judgment honest.
- Human claim quality: [ ] keep [ ] merge [ ] split [ ] reword [ ] drop [ ] unsure
- Human corrected audience: [ ] keep [ ] user [ ] developer [ ] unclear
- Human corrected semantic group: [ ] keep [ ] Adapter and portability [ ] Agent and skill workflow [ ] Claim discovery and review [ ] Documentation and contracts [ ] Evaluation surfaces [ ] General product behavior [ ] Improvement and optimization [ ] Packets and reporting [ ] Quality gates [ ] Release and packaging [ ] other:
- Human corrected proof: [ ] keep [ ] human-auditable [ ] deterministic [ ] cautilus-eval
- Human readiness: [ ] keep [ ] ready-to-verify [ ] needs-scenario [ ] needs-alignment [ ] blocked
- Human priority: [ ] high [ ] medium [ ] low [ ] later [ ] unsure
- Human notes:
- Trace: 1 source ref; docs/contracts/claim-discovery-workflow.md:320

