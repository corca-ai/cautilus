# Experimental Prototypes

Code in this directory is intentionally **not** a shipped surface. It
exists so a candidate evaluation shape can be explored without inflating
the live
[evaluation-surfaces spec](../../../docs/specs/evaluation-surfaces.spec.md)
contract before its surface is understood.

Quick rules:

- Schemas use the `cautilus.<name>_prototype.v0` naming pattern.
- No source-guard rows required.
- Not advertised in `README.md`, `skills/cautilus/SKILL.md`, or
  `cautilus scenarios`.
- Not referenced from any shipped surface helper or from
  `internal/runtime/scenarios.go`.
- Top-of-file lifetime comment required:
  `// Prototype lifetime: until promoted to a shipped surface or removed by <YYYY-MM-DD>.`
- Promotion deletes the prototype copy and lands the full surface in one
  slice (a new preset added to `evaluation-surfaces.spec.md` or a separate
  spec).
