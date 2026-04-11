# CLI Evaluation

`Cautilus` can evaluate operator-facing CLI behavior without turning into a
generic test runner.
The product-owned boundary is a bounded intent packet:

- one checked-in command
- one explicit working directory
- one explicit intent statement
- one bounded expectation set
- one captured observation packet
- one report-backed recommendation

This is useful when the real product behavior is stdout, stderr, exit code, or
operator-visible side effects.

## Input Packet

Use `cautilus.cli_evaluation_inputs.v1`.

Required fields:

- `candidate`
- `baseline`
- `intent`
- `surfaceId`
- `mode`
- `command`: argv array, not an opaque shell string
- `expectations`

Optional fields:

- `workingDirectory`
- `environment`
- `stdinText`
- `timeoutMs`

Supported expectation kinds in the first slice:

- `exitCode`
- `stdoutContains`
- `stderrContains`
- `stdoutNotContains`
- `stderrNotContains`
- `filesExist`
- `filesContain`

## Output Packet

Use `cautilus.cli_evaluation_packet.v1`.

The packet should preserve:

- the normalized command and working directory
- the captured observation: stdout, stderr, exit code, timing
- one result per bounded expectation
- a summary recommendation
- an embedded `cautilus.report_packet.v1` report so CLI evaluation fits the
  same reporting surface as other `Cautilus` runtime modes

## Guardrails

- Keep commands explicit and bounded.
  Do not hide multiple workflows behind one shell string.
- Prefer fixture directories over live mutable environments.
- Treat this as behavior evaluation, not a replacement for every integration
  test in the repo.
- If the repo needs richer semantic judgment, feed the resulting report packet
  into human review or executor variants instead of adding unbounded logic
  here.
