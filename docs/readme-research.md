# README Rewrite Research

Working notes for the 2026-04-15 README rewrite. Four parallel research
passes over OSS comparables feed the decisions captured in the project
memory entry `project_readme_structure.md` (Claude Code auto-memory, not
checked in). This file is a decision log; it can be removed once the
rewrite stabilizes.

## Synthesis

All four passes converged on the same five signals:

1. **Hook is one sentence, no inline parenthetical definitions.**
2. **Abstract terms are taught through scenarios or examples, not a glossary
   dump at the top.**
3. **Docs links are curated — ~10, narrative inline, not a flat 60-item
   manifest.**
4. **"Unlike X" contrast framing is already a Cautilus strength but currently
   lives at line 266; it belongs near the top of the pitch.**
5. **Dual-surface products (CLI + plugin/skill) only work when the README
   signals both surfaces explicitly and shows how they share one contract.**

## Decisions Taken from Tensions

- **Install position**: stays after "Who it's for", not directly under the
  hook. The rewritten one-line hook is still jargon-adjacent ("contract
  layer"), so the "is this for me?" filter buys more than install-first
  bravado.
- **Top nav bar (Vitest-style `Install | Scenarios | Adapters`)**: rejected.
  A 3-line Quick Start plays the same role without importing badge/banner
  aesthetics that read as marketing for an internal audience.
- **Core Flow structure**: shifted from one track to two (operator CLI track
  + agent plugin track), meeting at a shared `cautilus-adapter.yaml`.

## Pass 1 — CLI-first landing craft

Products: BurntSushi/ripgrep, oven-sh/bun, astral-sh/uv, sharkdp/fd.

### Steal

- **Functional hook, single clause** — uv: "An extremely fast Python package
  and project manager, written in Rust." Thirteen words, no parentheticals;
  implementation detail adds credibility without blocking comprehension.
- **Install command lands under 30 lines** — bun reaches its install
  instruction in ~13 lines (hook + badges + one example). Signals maturity
  and low friction before "who's this for" even comes up.
- **"What it is" and "Who it's for" are separate sections with different
  prose** — fd separates the hook from the longer "why it's better than
  `find`" explanation; ripgrep uses "Why should I use ripgrep?" as its own
  callout. Hook answers *existence*; later section answers *relevance*.

### Avoid

Parenthetical jargon definitions in the hook. Every parenthetical is a speed
bump. ripgrep doesn't inline-define "gitignore"; fd doesn't explain
"filesystem". Inlining trains writers to solve comprehension via definition
instead of via clearer word choice.

### Applied to Cautilus

- Rewrite the hook to a single sentence that drops held-out, bounded, and
  packet entirely; reintroduce those terms under Scenarios and Why where
  context exists.
- Keep Quick Start to three lines: `install.sh`, `cautilus install`,
  `cautilus doctor`, with everything else linked out to `install.md`.

## Pass 2 — Philosophy-heavy products

Products: stanfordnlp/dspy, langchain-ai/langchain, Mirascope/mirascope,
pydantic/pydantic-ai.

### Steal

- **Philosophy → implementation sequence** — DSPy leads with the paradigm
  flip ("programming rather than prompting") before naming formal concepts.
  Formal definitions live in docs, not the README.
- **Contrast framing without jargon** — Pydantic AI anchors via "bring that
  FastAPI feeling to GenAI app development"; readers map to a familiar
  sensation rather than a new term. Cautilus's existing "unlike a prompt
  manager / unlike a benchmark scrapbook" block does this well — it's just
  buried.
- **Defer abstract concepts; teach via example** — Mirascope teaches
  `@llm.call` through a working example, not a glossary. Pydantic AI
  introduces "agent" by showing `Agent(model=..., instructions=...)` rather
  than defining what an agent is.

### Avoid

Glossary-heavy inline definitions in the pitch. The current Cautilus opening
dumps held-out, bounded, and packet simultaneously before readers have the
motivation to care about any of them.

### Applied to Cautilus

- Hoist the "unlike X" contrast block from line 266 to sit inside Why,
  immediately after the hook/Scenarios pair. Fold the five principles in as
  justification clauses for each contrast, not a standalone bullet list.
- Add a 2–3 line vignette before the contrast block that teaches held-out
  and packet through a concrete regression (chatbot prompt tweak helps one
  user, breaks context recovery for another). Readers learn the terms in
  situ.

## Pass 3 — CLI + plugin/skill dual surface

Products: cli/cli, ohmyzsh/ohmyzsh, denoland/deno, tauri-apps/tauri.

### Steal

- **Redirect-out + wiki links** — Oh My Zsh: "You can take a look in the
  plugins directory and/or the wiki". Keeps the README lean while letting
  a searchable, user-editable surface be the registry.
- **Lead with one surface; signal the second early** — Oh My Zsh names the
  themes surface explicitly ("We have over one hundred and fifty themes now
  bundled...") and redirects contribution energy. Prevents readers from
  conflating "install the tool" with "install one plugin".
- **Separate install paths by use case, not by surface** — Tauri routes via
  intent ("Build a desktop app"), which implicitly chooses the correct
  surface. Lower cognitive load than "CLI vs. plugin" binary.

### Avoid

Burying or omitting the extension surface. GitHub CLI, Deno, and VS Code
all underplay their extension systems in the main README, and the ambiguity
costs onboarding. If Cautilus hides the bundled skill + plugin manifests,
readers who wanted the agent-side surface will assume Cautilus is
operator-only and abandon it.

### Applied to Cautilus

- Rewrite Core Flow as two tracks: operator CLI and Claude/Codex plugin.
  Both terminate at a shared `cautilus-adapter.yaml` so the shared-contract
  story is visible, not implied.
- Group the plugin-specific files (Claude/Codex marketplace entries,
  bundled SKILL.md) behind one "agent surface" link in Read more, rather
  than scattering them through Repo Layout.

## Pass 4 — Reference-heavy products that stay compact

Products: hashicorp/terraform, vitest-dev/vitest, microsoft/playwright,
denoland/deno.

### Steal

- **Contextual link surfacing** — Terraform: "Documentation is available on
  the Terraform website" followed by a progressive 2-link structure
  (Introduction → Tutorials → Advanced). Names the hub once, lets readers
  self-navigate.
- **Horizontal nav bar at top** — Vitest exposes four links
  (`Documentation | Getting Started | Examples | Why Vitest?`) next to the
  logo, not a 64-file list. Four links answer "where next?" at a glance.
- **Inline contextual links + organic discovery** — Deno embeds
  "in the documentation" mid-narrative, then a separate short "Additional
  resources" section with 3–5 curated links.

### Avoid

Playwright's 318-line README that tries to document five distribution
channels (Test, CLI, MCP, Library, VS Code Extension) plus 19 scattered
external links in one file. The kitchen-sink approach is the trap Cautilus
is currently in, with 450 lines of command examples and 64 file links.

### Applied to Cautilus

- Replace the 64-link Repo Layout with a directory tree visual plus ~10
  curated gateway links. Reference files are reachable from each gateway's
  prose, not from the README.
- Move the current Quick Start's 450-line command catalog into
  `docs/cli-reference.md`. README keeps three install/doctor lines and a
  single link.

## Cross-pass advice not adopted, and why

- **Vitest-style horizontal nav band** (Pass 4): skipped. The 3-line Quick
  Start plus 10-link Read more cover the same surface without importing
  marketing-banner aesthetics that clash with the internal audience.
- **Bun's install-under-30-lines pattern** (Pass 1): partially adopted.
  Install lands at line ~25 after "Who it's for", not immediately under the
  hook. The hook isn't tight enough to stand alone the way "An extremely
  fast Python package and project manager" can.
- **Tauri's intent-based install routing** (Pass 3): not adopted as the
  top-level structure. Cautilus still opens with Who/Scenarios before Core
  Flow; the 2-track structure captures the intent split inside Core Flow
  rather than as a navigation hub.
