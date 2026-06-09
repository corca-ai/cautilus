# Finding: Cautilus's eval is skewed all-deterministic; the "evaluator" tier collapsed into code

Status: open product-direction finding. Surfaced during the maintainer's HITL review of the dev/repo routing fixture (the trust anchor).
Date: 2026-06-09.

## Symptom (maintainer's words)

"모든 게 결정론적이라는 게 오히려 마음에 걸린다. 에이전트가 로그를 보고 판단해야 하는 게 있지 않나? 휴리스틱을 높은 완성도로 만드는 게 오히려 어려울 것 같은데. 지능을 쓰는 부분과 코드를 쓰는 부분이 조화롭게 협업해야 하는데 왠지 치우친 느낌."

## Observation

Every current dogfood judge is deterministic code, with no intelligence-in-the-loop judge anywhere:

- dev/repo: deterministic Go field-match of the agent's structured self-report (`evaluateInstructionRouting`).
- dev/skill episodes: coded per-flow audits over the real conversation log + thresholds (`audit-cautilus-*-flow-log.mjs`).
- dev/skill trigger/fragment: `requiredSummaryFragments` / `requiredCommandFragments` substring checks.
- app/chat, app/prompt: `finalText` substring match of an LLM response.

## The contradiction

Cautilus's own claim taxonomy already separates `recommendedProof = deterministic | cautilus-eval | human-auditable` — i.e. it conceptually distinguishes "needs an evaluator/intelligence" from "code is enough." But in the actual dogfood the `cautilus-eval` (evaluator-dependent) tier has collapsed into more deterministic heuristics. The concept and the implementation diverge.

Concrete tell (in the anchor fixture itself): the dev/repo fixture CAPTURES the agent's `reasonSummary` (why it routed the way it did) but the scorer IGNORES it. "Did it emit the find-skills token" is checked by code; "was the routing reasoning sound" is checked by nobody. The seat for intelligence is empty.

## Why the skew exists (honest)

Half principled, half gap:

- Principled: deterministic checks are reproducible, cheap, auditable. The maintainer's originating distrust was of un-reproducible proof; an LLM judge is itself unproven ("who judges the judge?"), so leaning all-code protected trust.
- Gap: no discipline for a trustworthy intelligence-judge has been built, so only the cheap token/fragment checks got implemented — giving thin proxies a green badge.

## The harmonious design (target)

A deliberate split where each tool does what it is strong at, and the judge is held to Cautilus's own proof discipline:

- Code: objective, checkable facts — called X? ran command? touched a forbidden file? exit code? files loaded? These stay deterministic.
- Bounded intelligence (LLM judge): semantic/intent questions — was the reasoning sound? did the multi-turn conversation achieve the user's goal? is the output actually good? These are where deterministic heuristics are brittle and incomplete.
- Discipline on the judge so it stays trustworthy/reproducible: structured rubric, held-out scenarios kept out of tuning, recorded verdicts, possibly multiple judges or judge+human, and the judge's own behavior treated as an evaluable claim. Intelligence used inside a code-disciplined frame, not as an unbounded oracle.

## Where this lands

This should shape the discover-driven eval design directly: each discovered claim is routed by `recommendedProof` to a deterministic check, a bounded-intelligence evaluator, or human review — and the intelligence tier must carry judge-discipline rather than collapsing back into token matching. The current all-deterministic dogfood is the legacy skew to correct, not the template to copy.

## Related

- The dev/repo anchor HITL: `charness-artifacts/hitl/latest.md` (this session).
- DF-1 (coverage): the dev/repo fixture verifies one AGENTS.md behavior (find-skills routing); AGENTS.md declares many more, which discover should surface as claims.
- Canonicalization-precision finding: `charness-artifacts/findings/2026-06-08-canonicalization-precision-root-finding.md` (the upstream "discover output felt untrustworthy" root).
