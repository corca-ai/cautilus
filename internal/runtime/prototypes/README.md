# Experimental Prototypes

Code in this directory is intentionally **not** a first-class
evaluation archetype. It exists so a fourth or fifth shape can be
explored without inflating the
[archetype-boundary spec](../../../docs/specs/archetype-boundary.spec.md)
contract before its surface is understood.

See the **Experimental Prototypes** section of
`docs/specs/archetype-boundary.spec.md` for the relaxed rules and the
promotion checklist into first-class status.

Quick rules:

- Schemas use the `cautilus.<name>_prototype.v0` naming pattern.
- No source-guard rows required.
- Not advertised in `README.md`, `skills/cautilus/SKILL.md`, or
  `cautilus scenarios`.
- Not referenced from any first-class archetype helper or from
  `internal/runtime/scenarios.go`.
- Top-of-file lifetime comment required:
  `// Prototype lifetime: until promoted to first-class or removed by <YYYY-MM-DD>.`
- Promotion deletes the prototype copy and lands the full first-class
  surface in one slice.
