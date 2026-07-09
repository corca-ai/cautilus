# CLI Output Format

Status: Implemented

## Problem

Cautilus is agent-first.
Agents need predictable structured stdout, while parsers still benefit from JSON and existing packet files remain JSON source-of-truth artifacts.

## Contract

Structured command stdout defaults to YAML.
Use `--format json` when a caller needs JSON on stdout.
Use `--format yaml` to request YAML explicitly.
The existing `--json` flag remains a compatibility alias for JSON stdout where it was already accepted.

This format switch applies to stdout presentation only.
`--output`, `--output-file`, active-run artifacts, and generated packet files keep their existing JSON schemas and filenames unless a command explicitly documents a different file format.

## Exceptions

`cautilus --help`, command help, and non-verbose `cautilus version` stay human text.
`cautilus init run` keeps its default shell-export stdout so operators can keep using:

```bash
eval "$(cautilus init run --label <label>)"
```

For `init run`, `--json` and explicit `--format yaml|json` emit the structured `cautilus.workspace_run_manifest.v1` payload instead of the shell export.

Interactive or lifecycle commands may keep human-facing stderr progress, but stdout must either be the documented structured payload, documented shell text, or a documented file path.

## Rationale

YAML is more compact and readable for agent stdout inspection.
JSON remains the parser path and the durable packet-file format.
Keeping those boundaries separate avoids breaking existing packet consumers while making default CLI output easier for agents to scan.
