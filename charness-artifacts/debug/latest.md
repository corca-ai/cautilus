# Debug Review: scenario input parity fails open
Date: 2026-07-11

## Problem

The Go scenario proposal path silently drops malformed registry and coverage entries that the maintained JavaScript producer rejects.
Malformed host-owned scenario state can therefore produce a proposal packet instead of a path-bearing validation error, and the two official producer surfaces disagree.

## Correct Behavior

Given the same `existingScenarioRegistry` and `scenarioCoverage` payload, both maintained producers must either accept it with the same normalized keys and counts or reject the same malformed entry before packet generation.

## Observed Facts

- `readScenarioKeys` continues past non-object entries while the JavaScript producer rejects `existingScenarioRegistry[i] must be an object`.
- `readScenarioCoverage` silently skips non-object or empty-key entries and accepts failed numeric conversion as zero.
- The JavaScript producer rejects non-object coverage entries, empty keys, non-finite counts, and negative counts.
- Both Go proposal and conversation-review builders consume these shared readers.

## Reproduction

- Table-driven calls against both Go builders returned packets for scalar registry/coverage entries, empty coverage keys, non-numeric counts, and negative counts.
- The JavaScript producer rejected those cases but accepted a numeric string despite the documented number-only contract.
- A delegated parity review additionally reproduced explicit JSON `null`: both Go builders accepted it as an empty array while JavaScript rejected it.

## Candidate Causes

- The Go readers were intentionally permissive for partially populated historical packets.
- `arrayOrEmpty` and `toFloat` were reused as convenience normalizers even though this boundary requires validation.
- JavaScript validation tightened independently and no cross-producer parity test covered malformed inputs.
- The new registry-key error return fixed only the panic path and retained prior skip semantics for other shapes.

## Hypothesis

- Falsifiable claim: shared permissive readers are the sole parity gap; direct malformed-input tests will succeed on old Go code, and strict indexed validation shared by both Go consumers will make every case fail without changing valid fixtures | disconfirmer: an existing upstream schema validator already rejects the malformed payload before either builder.

## Verification

- confirmed — every malformed Go case returned no error before repair, the JavaScript numeric-string assertion failed before repair, and the delegated review independently reproduced the explicit-null mismatch.
- after repair, focused Go tests pass both final consumers, JavaScript schema tests pass eight cases, and eslint passes the changed scripts.

## Root Cause

The maintained producers drifted because shared Go convenience coercions were used at a typed packet boundary while JavaScript validation evolved independently.
The earlier empty-key repair changed error propagation but preserved permissive non-object, non-array, and coverage-domain semantics, and neither suite carried a malformed-input parity table.

## Invariant Proof

- Invariant: when host-owned scenario registry or coverage input is malformed, both Go final packet builders and the maintained JavaScript producer must refuse the indexed entry before claiming a valid proposal or conversation-review packet.
- Producer Proof: the table proves indexed array, object, key, numeric-type, finite-domain, and non-negative validation, including explicit null while retaining missing-field compatibility.
- Final-Consumer Proof: the same Go table invokes proposal and conversation-review builders; the JavaScript table pins the maintained sibling producer.
- Interface-Shape Sibling Scan: registry and coverage readers, both Go builder consumers, and the JavaScript producer share the same payload fields.
- Non-Claims: no schema expansion, historical packet migration, or provider/live behavior proof.

## Detection Gap

- `internal/runtime/proposals_test.go` | only empty registry keys exercised error propagation | add malformed shape and numeric-domain cases across both typed consumers.

## Sibling Search

- Mental model: optional array fields may use permissive coercion inside a final packet builder even when another maintained producer treats their entries as typed.
- same layer axis: `readScenarioKeys` and `readScenarioCoverage` | decision: same bug, fix now | proof: static producer-parity comparison.
- abstraction up axis: proposal and conversation-review builders | decision: same bug, fix now | proof: both call the shared readers.
- specialization down axis: non-array/null fields, non-object entries, empty keys, non-numeric/non-finite counts, and negative counts | decision: same bug, fix now | proof: direct parity tables pass after repair.
- mental-model axis: absent optional arrays versus present malformed arrays | decision: intentional plain-text or non-rendering boundary | proof: both runtimes keep missing fields compatible as empty arrays while explicit null remains malformed.
- cross-file: `scripts/agent-runtime/generate-scenario-proposals.mjs` is the maintained parity sibling outside the Go subject file.

## Seam Risk

- Interrupt ID: scenario-input-parity-fails-open
- Risk Class: none
- Seam: host-owned JSON payload to maintained Go and JavaScript scenario packet producers
- Disproving Observation: both Go consumers and the JavaScript producer now reject the malformed table while valid schema fixtures remain green.
- What Local Reasoning Cannot Prove: compatibility of unknown external callers that intentionally send malformed present fields.
- Generalization Pressure: monitor

## Interrupt Decision

- Resolution: resolved
- Critique Required: yes
- Next Step: impl
- Handoff Artifact: none

## Prevention

Pin malformed-input parity at the shared reader boundary and both Go final consumers before releasing the accumulated bundle.
Keep generic `assertArray` optional semantics unchanged and distinguish missing from explicit null only at the scenario input call sites.
