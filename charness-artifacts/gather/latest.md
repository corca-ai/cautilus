# Gather: Specdown Report Proof Patterns

Source: https://corca-ai.github.io/specdown/ and https://craken.corca.ai/spec/editor/monaco.html
Freshness: gathered on 2026-05-05 from public rendered HTML reports.
Access Mode: public web pages opened through browser/web fetch.

## Requested Facts

The user asked for rendered-report examples that should guide Cautilus user-facing spec proof design, especially whether proof must be check tables and how readiness should show command behavior.

## Captured Patterns

Specdown's rendered report treats headings as the reader-facing contract hierarchy.
The page-level promise is the H1; H2 sections are the main contract units; executable blocks and check tables sit directly inside the section whose claim they prove.

The best examples do not split acceptance criteria from evidence.
They put prose intent, condition/action/result evidence, and executable status in the same local reading flow.

`run:shell` examples are strongest when the visible rendered report shows a command and its observed output.
This works well for CLI contracts where a reader wants to see "when I run this command, this is what I get."

Check tables are strongest when each row is a meaningful scenario, not an implementation assertion.
The Craken Monaco "Line moves -- Alt+Up / Alt+Down" section is a good example: the table reads as initial state, operation, expected state, and note, while `check:editor-op` stays as the execution mechanism.

Summary-line executable blocks are useful when the command is too detailed for the default reading path.
The rendered report can show a short proof sentence while keeping the full script expandable.

## Implications For Cautilus User Specs

Cautilus user-facing pages should not require a generic `## Acceptance Criteria` wrapper.
Each `##` should be an acceptance criterion written as a user-facing contract.

Proof does not need to be a table.
For CLI readiness, doctest-style command/output blocks or a small domain adapter block may be more legible than JSON-path tables.

Readiness proof should express condition, command, and result together.
For example: "In a repo with a resolved adapter, `cautilus doctor --repo-root .` reports ready and points to the first bounded eval run."

JSON-path checks remain useful as lower-level validation, but the public report should avoid exposing `args_json`, `json_path`, and `equals` as the primary reading surface when a command/output example communicates the same acceptance claim more directly.

## Open Gaps

The current Cautilus specdown adapter can verify JSON command/file values, but its table shape is still adapter-centric.
A better public proof shape may require either doctest-style CLI blocks with stable output or a Cautilus-specific check/exec adapter that accepts scenario language such as `condition`, `command`, and `expected`.

The readiness page should probably be revised before the rest of the user-facing pages are propagated, because it will establish the house style for condition/action/result proof.
