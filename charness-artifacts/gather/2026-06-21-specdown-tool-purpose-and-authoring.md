# Specdown — Reason For Existence, Tool Surface, And Authoring Discipline

- **Source:** https://corca-ai.github.io/specdown/ (the docs site is itself a specdown-rendered spec; pages: index, overview, syntax, config, cli, adapter-protocol, alloy, validation, traceability, report, internals, best-practices)
- **Repo:** github.com/corca-ai/specdown
- **Access mode:** public direct fetch (curl 200; the repo `gather` public-URL helper false-flagged it as login-wall — overridden by direct fetch)
- **Freshness:** captured 2026-06-21
- **Why gathered:** Cautilus's `docs/specs/**` corpus is authored in specdown; this asset grounds an "ideal spec structure" redesign in specdown's actual purpose, capabilities, and authoring best practices instead of guessing.

## Reason For Existence (the core thesis)

specdown is a **Markdown-first executable specification system**: one document is the spec, the test, and the report.

> "Separate docs and tests always drift apart: properties stated in documents go unverified, and tests confirm behavior but never explain design intent."

specdown weaves three things into one Markdown file:
- **prose** — explains intent / design rationale
- **executable blocks (and check tables)** — confirm implementation
- **optional Alloy models** — guarantee structural/design properties exhaustively within a bounded scope

Inspired by Ward Cunningham's FIT and Donald Knuth's Literate Programming.
The landing page is itself executed by `specdown run` to produce the report you read. Green left border = pass, red = fail.

## What Actually Makes A File A Spec (load-bearing for any restructure)

A file is a spec because of **two things, not its extension**:
1. **Reachability** — `specdown run` starts at the configured `entry` and follows Markdown links to `.md` files; `specdown trace` scans every `.md` under the project. Only `.md` targets are followed (`.markdown` / extension-less are skipped).
2. **It contains executable blocks** — `run:<target>` blocks, check tables, or inline `expect:`/`check:`. A reachable file with none simply contributes **zero cases** (still valid, just no tests).

**KEY: the recommended extension is `.md`. `.spec.md` is a LEGACY convention that behaves identically — the extension carries no meaning.** (Directly relevant: Cautilus uses `.spec.md` everywhere and mixes in plain `.md` projections; the split is not semantically meaningful to specdown.)

## Authoring Surface (syntax)

- **Headings → suite hierarchy.** `#`/`##`/`###` become a test-suite tree. Prose is preserved in the report but not executed.
- **`run:shell` blocks** — executed, checked for zero exit. Unrecognized prefixes (`verify:`, `test:`) are NOT executable and warn on stderr (typo guard). `!fail` marks expected-failure (renders red, exit stays 0 unless it unexpectedly passes).
- **Doctest blocks** (`$ cmd` then expected output) — command/output pairs shown together; great for CLI specs. `...` wildcard matches variable lines (timestamps/PIDs/paths).
- **Summary lines** — first comment line of a `run:` block becomes a collapsible summary; failed blocks auto-expand. "Makes specs readable for non-technical stakeholders without removing detail for developers."
- **Variable capture** `-> $name` (comma-sep multiple), referenced as `${name}`; structured output via dot-path `${result.field}`. Scoping: parent→child readable, siblings share in document order, **variables never leak upward** (enforced; proved with an Alloy model on the page). `!raw` skips interpolation for shell-heavy blocks.
- **Check tables** `> check:name` — input/output rows read as data (best paired with an adapter).
- **Hooks** `> setup`/`> teardown` (+ `:each`) — teardown always runs even on failure, unlike inline cleanup.
- **Frontmatter** — `type:` declares the node's traceability type.

## Traceability (typed edges — directly relevant to Cautilus's index/view sprawl)

Documents are **nodes (atoms: one document = one node, no heading-level refs; fragment anchors stripped)**; named **typed links** between them are **edges**, configured in `specdown.json` under `trace`.

- Declare `trace.types` (e.g. `theme, epic, story, at`) and `trace.edges` with `from`/`to`/`count` (UML multiplicity like `"1 → 1..*"`), optional `acyclic`/`transitive`.
- Edge direction = UML dependency: `from` is the dependent, `to` is the dependency; the `from` doc contains the link.
- Author edges as standard Markdown links with an `<edge_name>::` prefix in the link text: `[covers::Login Story](../stories/login.md)`. Plain links without `name::` are pure **navigation** links (no trace semantics).
- `specdown trace --strict` fails if any node violates declared cardinality (e.g. a story with no acceptance-test link, an orphan, a cardinality breach). "Everything else is derived."
- Cross-type edges are inherently acyclic by the type system.
- A document with a `type` not in config is an error; untyped docs can be navigation targets but not trace sources/targets.

This is the formal mechanism that can replace hand-maintained "view"/index navigation pages with derived, checkable structure.

## Alloy Models (structural proof — Cautilus currently uses none)

Embed `alloy:model(name)` blocks with `check`/`assert`; when a `check` exists, the HTML report links the result automatically.

- **Alloy = design level, exhaustive within scope; executable blocks = implementation level, selected examples.** Neither replaces the other; the power is combining them in the same section.
- Always include `pred sanityCheck {} run sanityCheck {} for 5` to rule out **vacuous satisfaction** (contradictory facts make every assertion trivially pass).
- Patterns: property+impl side-by-side, counterexample harvesting, **exhaustive classification** (prove a partition complete + mutually exclusive → test one representative per case), **invariant leverage** (strong invariant implies weaker ones → skip weaker tests), transition safety net, composition safety, failure-driven modeling, equivalence shield (prove old≡new on refactor, reuse tests).
- Pitfalls: vacuous satisfaction, missing `always` in temporal models, missing `var` with prime, scope too small (use 5–7).

## Best Practices (the authoring discipline a restructure should honor)

- **Serves two audiences at once:** a user manual humans read AND an executable spec a machine runs. "Neither role is secondary — if it cannot be read as documentation, it is a poor spec; if it cannot be executed, it is just prose."
- **Lead with prose and design rationale; introduce Alloy where structural properties matter; follow with executable blocks/check tables that confirm implementation.**
- **Right level of detail:** executable blocks verify **acceptance criteria, not exhaustive edge cases.** "specdown is not a replacement for unit tests" — leave fine-grained coverage to the project's test framework.
- **Keep documents focused:** one spec file = **one feature / one bounded concern. Split by feature boundary, not by test type.** Anti-pattern: "all Alloy in one file, all executable blocks in another" — model and impl verification should live together in the same section.
- **When to build an adapter:** stay with `run:shell` for one-off varying commands; build an adapter when ≥3 blocks repeat a pattern, you need domain checks (DB/UI/API state), or shell blocks grow into `awk`/`grep` parsing chains. "A check table with an adapter reads as data; a shell block reads as a script."
- **Block-style choice:** exact output → doctest; exit-only → plain `run:shell`; many input/output pairs → check table; inline assertion in narrative → `` `expect: ${n} == 3` ``; property over all combinations → Alloy.
- **Anti-patterns:** model without impl checks; impl checks without rationale; Alloy in a separate file; over-modeling simple CRUD; **over-testing (a spec crammed with exhaustive cases becomes unreadable as documentation)**; hardcoded config paths; monolithic adapters.

## CLI / Config (surface summary)

- `specdown init` (scaffolds `specdown.json` + `specs/index.md` + `specs/example.md`), `specdown run` (`-dry-run` validates syntax without executing), `specdown trace`, `specdown install skills` (installs the `/specdown` Claude Code skill with syntax+adapter+best-practices reference).
- Install: `install.sh` curl one-liner, `go install`, or Homebrew tap.
- `specdown.json`: `entry`, `adapters`, `trace`, `ignorePrefixes`. Use **relative paths** (anti-pattern: hardcoded paths).
- Adapter protocol: NDJSON process protocol, any language.

## Implications For Cautilus's `docs/specs/**` (raw, for the structure discussion — not yet decided)

1. `.spec.md` everywhere is legacy/no-op; specdown treats it identically to `.md`. The extension is not what makes the structure real — reachability + executable blocks are.
2. Cautilus's many hand-maintained index/"view" pages (apex, user, contracts, ledger, rules, evidence, old, archive) are doing informally what **typed traceability edges + cardinality checks** could do formally and checkably. Cautilus already tracks this as `gap.traceability-config`.
3. Cautilus uses **no Alloy** despite having genuine structural properties (one model → many views, claim-state partitions like proven/declared/promised, badge↔proof-route bijection/no-orphans). Several are textbook exhaustive-classification / invariant-leverage candidates.
4. "One spec = one bounded concern, lead with prose, executable blocks at acceptance level" is the standard against which the current corpus (lots of tiny navigation files, generated projections, history zones) should be judged.

## Open Gaps

- Captured page bodies are the human-facing docs; the exact `specdown.json` schema fields beyond those named (`entry`, `adapters`, `trace`, `ignorePrefixes`) were not exhaustively enumerated — read `config.html`/`cli.html` in full if a precise config redesign is needed.
- Adapter-protocol NDJSON message shapes were not captured in detail (only that it exists, any-language). Pull `adapter-protocol.html` if Cautilus's adapters need to align.
