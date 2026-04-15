# Bootstrap Inventory

Run this inventory before hand-editing adapter YAML so `Cautilus` is only
pointed at surfaces where bounded behavior evaluation is the right tool.

Inventory the LLM-behavior surfaces first:

- system prompts and prompt assets
- agent or chatbot loops that depend on judgeable model behavior
- LLM-backed analysis or summarization passes
- operator-facing copy that should be reviewed by a bounded judge

Do not wrap `pytest`, lint, type, or spec checks under `Cautilus`. Keep cheap
deterministic gates in CI or pre-push hooks, and use `Cautilus` for bounded
behavior evaluation beyond those gates.

After the inventory:

- if the repo has no LLM-behavior surface, `Cautilus` is not the right tool
  yet — keep the deterministic gates and revisit once behavior evaluation is
  the actual question
- if the repo has one surface, start with the matching archetype (chatbot /
  skill / workflow) from `SKILL.md` § Scenarios before widening adapter YAML
- if the repo has several surfaces, prefer one adapter per surface over a
  single omnibus adapter; `cautilus adapter init --repo-root .` scaffolds
  per-adapter YAML
