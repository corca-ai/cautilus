     1	# Cautilus
     2	
     3	`Cautilus` keeps agent and workflow behavior honest while prompts keep changing.
     4	It is a repo-local contract layer for agent and workflow behavior evaluation: define the behavior you are trying to protect once, then verify it survives prompt, skill, and wrapper changes.
     5	The product has three connected jobs:
     6	discover declared behavior claims worth proving from selected source docs, verify curated claims through bounded evaluation packets, and improve behavior with budgeted improvement once the proof surface is honest.
     7	Ships as a standalone binary plus Cautilus Agent, which a host repo can install without copying another scaffold first.
     8	Agents are first-class users of the product surface.
     9	Commands should emit durable packets with enough state for the next agent to resume, not only terminal prose for a human operator.
    10	`Cautilus` installs as a machine-level binary, but its agent-facing surface is intentionally repo-local.
    11	The binary is shared across repos.
    12	The Cautilus Agent surface, adapter wiring, prompts, and instruction-routing surface are not.
    13	They stay checked into each host repo so evaluation behavior remains reproducible, reviewable, and owned by the repo that declares it.
    14	
    15	## Current Release Boundary
    16	
    17	The current external-adoption slice is eval-only while the broader claim, improve, live app-runner, and review-learning contracts are still being rewritten.
    18	Host repos can use `cautilus evaluate fixture`, `cautilus evaluate observation`, and post-run `cautilus evaluate skill-experiment` with checked-in fixtures, host-owned adapters, preserved task packets, and the current evaluation and skill-experiment report packets.
    19	`skill-experiment compare` compares host-preserved baseline and variant outputs; it does not clone, install, or execute skills.
    20	Treat claim discovery automation, improve automation, live `eval` app-runner workflows, and review-learning packet capture or selected-packet summaries as opt-in product slices until the rewrite closes.
    21	
    22	## Who It Is For
    23	
    24	- teams maintaining agent runtimes or chatbot loops whose prompts and wrappers change frequently
    25	- maintainers shipping repo-owned skills who want protected validation, not trigger-only smoke checks
    26	- operators who want review-ready outputs and explicit comparison evidence before accepting workflow changes
    27	
    28	Day-1 trigger: your repo already has behavior that matters, but prompt tweaks and ad hoc evals no longer explain whether a candidate actually got better.
    29	
    30	Not for: repos that only need deterministic lint, unit, or type checks and do not have an evaluator-dependent behavior surface.
    31	
    32	## Quick Start
    33	
    34	Prerequisites:
    35	
    36	- native macOS or native Linux
    37	- a target host repo you can edit locally
    38	- `git` available on `PATH`
    39	
    40	```bash
    41	curl -fsSL \
    42	  https://raw.githubusercontent.com/corca-ai/cautilus/main/install.sh \
    43	  | sh
    44	cd /path/to/host-repo
    45	cautilus init
    46	```
    47	
    48	If this machine still has a legacy Homebrew install, remove that copy first and then reinstall through `install.sh`:
    49	
    50	```bash
    51	brew uninstall cautilus
    52	curl -fsSL https://raw.githubusercontent.com/corca-ai/cautilus/main/install.sh | sh
    53	```
    54	
    55	If you want to hand setup to an agent, ask it to repeat `cautilus doctor --repo-root . --next-action`, do exactly what the packet says, and stop only after `cautilus doctor --repo-root .` reports readiness plus a `first_bounded_run`.
    56	
    57	Quick links:
    58	
    59	- What Cautilus promises: [docs/specs/user/index.spec.md](./docs/specs/user/index.spec.md)
    60	- Maintainer claim map: [docs/specs/contracts/index.spec.md](./docs/specs/contracts/index.spec.md)
    61	- Start here — Cautilus, proven on itself: [docs/specs/index.spec.md](./docs/specs/index.spec.md)
    62	- Full command catalog: [docs/guides/cli.md](./docs/guides/cli.md)
    63	- Fresh consumer bootstrap after the binary is on `PATH`: [docs/guides/consumer-adoption.md](./docs/guides/consumer-adoption.md)
    64	- Public executable spec report: <https://corca-ai.github.io/cautilus/>
    65	
    66	[docs/specs/index.spec.md](./docs/specs/index.spec.md) is the top-level "proven on itself" apex and the specdown entry; the user and maintainer spec indexes it links to remain the curated claim source of truth.
    67	Raw `discover claims` packets remain the high-recall, source-ref-backed proof-planning input, not the primary document a user should review.
    68	The Cautilus Agent curates that packet against the repo: reduce false positives, raise likely missing public promises, and separate in-scope discovery bugs from out-of-scope narrative gaps.
    69	The public website report is generated from the claim spec tree, but host repos do not need that renderer before Cautilus can inspect readiness, claims, evals, or improvement work.
    70	Each claim page pairs a bounded product promise with executable evidence or an explicit evidence gap.
    71	Read the user spec index to understand what Cautilus promises, then use the maintainer index to inspect proof routes, adapters, fixtures, and known gaps.
    72	
    73	## One Bounded Eval Loop
    74	
    75	Start here if you want the current stable cross-repo slice before reading the full surface.
    76	You need one checked-in `cautilus.evaluation_input.v1` fixture and a host-owned adapter runner.
    77	This loop verifies a bounded behavior fixture and produces reopenable observed and summary packets.
    78	
    79	**Input (CLI)**
    80	
    81	```bash
    82	cautilus evaluate fixture \
    83	  --fixture ./fixtures/eval/<behavior>.fixture.json \
    84	  --output-dir /tmp/cautilus-eval
    85	cautilus evaluate observation \
    86	  --input /tmp/cautilus-eval/eval-observed.json \
    87	  --output /tmp/cautilus-eval/eval-summary.json
    88	```
    89	
    90	**Input (For Agent)**: "Run this checked-in Cautilus eval fixture and summarize the observed packet and summary packet."
    91	
    92	`Cautilus` turns the fixture run into durable eval packets that another agent or maintainer can reopen.
    93	The summary is not a global product verdict; it is evidence for the behavior fixture and adapter path that the host repo chose.
    94	Next step: a human decides whether that evidence is enough for the host repo's current proof need.
    95	
    96	The same small loop anchors the public spec report in `docs/specs/user/index.spec.md`.
    97	It is the shortest currently stable external-adoption example of the product claim: `Cautilus` turns behavior evidence into a reviewable decision surface.
    98	
    99	## Dogfood Example
   100	
   101	`Cautilus` is useful when a repo instruction such as `AGENTS.md` is supposed to steer an agent's first move.
   102	In `charness`, an instruction-surface fixture proved that the agent first selected the startup bootstrap helper `find-skills`, then selected the durable work skill for the actual task.
   103	That turned "did the agent read and follow the repo instructions?" from transcript judgment into a reproducible packet with artifacts another maintainer can reopen.
   104	The same dogfood run also exposed a useful limit: routing proof is not backend subagent capability proof.
   105	Keeping that distinction in the packet prevented the result from over-claiming what had been verified.
   106	
   107	## Scenarios
   108	
   109	Cautilus has three connected product layers:
   110	claim discovery, bounded evaluation, and bounded improvement.
   111	External host repos should start with the eval-only slice above unless they are intentionally adopting claim discovery or improvement during the current contract rewrite.
   112	
   113	Claim discovery turns adapter-owned entry docs and linked Markdown into `cautilus.claim_proof_plan.v1` candidates.
   114	It is proof planning, not a verdict that the repo is correct.
   115	The Cautilus Agent curates false positives, likely missing promises, scan boundaries, and extraction and review budgets before any eval plan is trusted.
   116	
   117	Evaluation uses two top-level surfaces: `dev` for AI-assisted development work such as repo contracts, tools, and skills, and `app` for AI-powered product behavior such as chat, prompt, and service responses.
   118	For the live reader-facing contract, read [docs/specs/user/evaluation.spec.md](./docs/specs/user/evaluation.spec.md).
   119	For the full command catalog, including claim review, scenario normalization, live targets, and improvement commands, read [docs/guides/cli.md](./docs/guides/cli.md).
   120	Sample normalization inputs live in [examples/starters/](./examples/starters/) and the checked-in fixture directories under [fixtures/](./fixtures/).
   121	
   122	## Why Cautilus
   123	
   124	Prompt strings change, but behavior is the real contract.
   125	
   126	Concrete picture: you tweak a chatbot system prompt.
   127	One user's follow-up experience improves.
   128	Another user silently loses context recovery across turns.
   129	Anecdotes will not tell you which effect dominates.
   130	`Cautilus` treats the context-recovery case as a protected scenario kept out of tuning so the signal stays honest.
   131	It stores the evidence in a durable file the next maintainer can reopen from disk.
   132	Later docs use the shorthand `held-out` for that protected validation path and `packet` for those reopenable machine-readable files.
   133	
   134	The stance, in four contrasts:
   135	
   136	- Unlike a dashboard-first review tool, `Cautilus` treats packets, CLI commands, and repo instructions as agent-facing interfaces first; HTML is a human-readable mirror, not the source of truth.
   137	- Unlike a prompt manager, `Cautilus` does not freeze one prompt string as the contract — it treats the behavior under evaluation as the contract (`intent-first`).
   138	- Unlike a benchmark scrapbook, `Cautilus` separates iteration from protected validation and keeps evidence reopenable from files (`held-out honesty`, `packet-first`).
   139	- Unlike ad hoc eval scripts, `Cautilus` makes adapters, reports, review files, and compare artifacts first-class product boundaries (`structured review`).
   140	- Unlike open-ended improver loops, `Cautilus` keeps search and revision explicitly bounded by budgets, checkpoints, and blocked-readiness conditions (`bounded autonomy`).
   141	
   142	The proof layers are deliberately split because humans, code, and AI are good at different work.
   143	Human-auditable claims stay readable.
   144	Deterministic claims belong in ordinary tests and CI.
   145	Evaluator-dependent behavior goes through `cautilus evaluate`.
   146	Improvement work waits until the proof surface is explicit.
   147	
   148	`Cautilus` also ships a GEPA-style bounded prompt search seam above the one-shot improver: multi-generation reflective mutation, protected reevaluation, frontier-promotion review reuse, checkpoint feedback reinjection, bounded merge synthesis, and Pareto-style frontier selection.
   149	Deep dive: `docs/guides/improve.md`.
   150	
   151	The longer-term direction is close to the workflow philosophy behind DSPy: prompts can change as long as the evaluated behavior survives.
   152	
   153	## Core Flow
   154	
   155	Two entry points share one host-owned `cautilus-adapter.yaml` and return the same durable decision surface.
   156	Operators use the standalone CLI.
   157	Claude and Codex use the repo-local Cautilus Agent that `cautilus init` installs under `.agents/skills/cautilus-agent/`.
   158	
   159	The minimum host-repo shape is an adapter, an installed Cautilus Agent, and run artifacts such as `eval-cases.json`, `eval-observed.json`, and `eval-summary.json`.
   160	The result is not just a pass/fail bit: it is a set of machine-readable packets plus readable views that another maintainer or agent can reopen.
   161	See [docs/specs/user/reviewable-artifacts.spec.md](./docs/specs/user/reviewable-artifacts.spec.md) for the rendered-artifact claim.
   162	
   163	Use `cautilus doctor --next-action` for the next onboarding step, `cautilus doctor --scope agent-surface` for agent-surface discoverability, and `cautilus doctor` for repo wiring readiness.
   164	From this repo, `npm run consumer:onboard:smoke` is the shortest end-to-end adoption proof against a fresh consumer.
   165	
   166	## Read More
   167	
   168	Top picks:
   169	
   170	- <https://corca-ai.github.io/cautilus/> — standing executable spec report
   171	- [docs/guides/consumer-adoption.md](./docs/guides/consumer-adoption.md) — canonical fresh-consumer bootstrap path after the binary is on `PATH`
   172	- [docs/guides/evaluation-process.md](./docs/guides/evaluation-process.md) — canonical evaluation loop
   173	- [docs/specs/user/index.spec.md](./docs/specs/user/index.spec.md) — user-facing claim spec index
   174	- [docs/specs/contracts/index.spec.md](./docs/specs/contracts/index.spec.md) — maintainer-facing claim spec index
   175	- [docs/contracts/adapter-contract.md](./docs/contracts/adapter-contract.md) — adapter schema
   176	- [docs/contracts/review-packet.md](./docs/contracts/review-packet.md) — review packet boundary
   177	- [docs/guides/cli.md](./docs/guides/cli.md) — full CLI reference
   178	- [docs/maintainers/development.md](./docs/maintainers/development.md) — maintainer dev + self-dogfood
   179	- [docs/maintainers/operator-acceptance.md](./docs/maintainers/operator-acceptance.md) — human takeover and acceptance checklist
   180	- [docs/guides/improve.md](./docs/guides/improve.md) — GEPA-style prompt search
   181	- [docs/master-plan.md](./docs/master-plan.md) — roadmap
   182	- [examples/starters/](./examples/starters/) — normalization-family starter kits
   183	
   184	Dogfood and migration evidence lives in [consumer-readiness.md](./docs/maintainers/consumer-readiness.md), which is an evidence appendix rather than the canonical bootstrap guide.
