# Agent Extraction Sample: README.md Dry Run (2026-06-10)

Status: informal calibration sample, not the slice 4 comparison measurement.
Purpose: first real agent-extraction output through the shipped slice-1 seam, judged before S0 gold-set HITL so maintainer verdicts are calibrated against what agent extraction actually produces.
Runtime: claude-fable-5 acting as the extraction agent through the bounded harness path (template consumed from the `extraction-input` packet, no skill surface involved — slice 2 not yet built).

## Setup

- Single source: `README.md` at commit `384e6d7` (`extraction-input --source README.md`, template v1, hash `sha256:fe453ab5...`).
- Packets checked in under [agent-extraction-readme-sample/](./agent-extraction-readme-sample/): `input.json`, `result.json` (agent-authored), `claims-agent.json` (applied), `claims-heuristic.json` (heuristic baseline on the same single source).

## Mechanical Result

- 34 claims submitted, 34 anchored, 0 rejections; `discover claims validate` green (0 issues, 0 findings).
- Cross-section dedupe worked as the template intends: the agent-curation promise declared at README L68 and L115 became one claim with two excerpts and one primary.
- Verbatim discipline held: every excerpt copied exactly (including backticks and markdown links) survived whitespace-normalized anchoring.

## Agent vs Heuristic on the Same File

- Counts: agent 34, heuristic 15; 13 lines shared, heuristic-only 2, agent-only 21.
- Agent-only catches that look like genuine heuristic misses, not noise: the core product promise (L4 define-once-verify-survives), the entire Current Release Boundary section (L18–L20 — what host repos can use today), the agent-driven doctor setup loop (L55), the agent curation promise (L68/L115), non-verdict summary semantics (L93), claim-discovery semantics (L113–114), the four stance contrasts (L136–140), and the doctor command surface (L163).
- Heuristic-only lines are both template non-claims by my reading: L103 is a past-tense dogfood narrative (historical observation, not a promise) and L151 is roadmap intent (DSPy direction).
- Routing diffs on shared lines are mostly in the agent's favor per the template: L3 headline routed cautilus-eval/needs-scenario instead of human-auditable/blocked.
  Two genuinely arguable calls worth gold-set attention: L9 (durable packets for agent resume — heuristic says deterministic, agent says cautilus-eval because resumability is agent behavior) and L92/L130 (the agent routed packet-emission and held-out mechanics deterministic where the heuristic said cautilus-eval).

## Judgment

The seam behaves as designed: the template was followable without engine keywords, anchoring caught nothing because nothing was fabricated, and the output is a routable claim set rather than a sentence-length sample.
The remaining disagreement class is exactly the one the gold set exists to settle: the needs-scenario vs ready-for-proof boundary and the deterministic vs cautilus-eval boundary on claims that mix packet mechanics with agent behavior.
Known template iterate-later area surfaced by this sample: granularity guidance for stance/positioning bullet lists (L136–140 became five claims; a stricter template might ask for one merged stance claim).

## Caveats

- Single file, single run, extractor = the same agent judging the output; this calibrates HITL intuition and smoke-tests the seam, it does not measure anything.
- The slice 4 measurement stays as contracted: gold-set-scored agent-vs-heuristic over the three corpora through the same harness.
