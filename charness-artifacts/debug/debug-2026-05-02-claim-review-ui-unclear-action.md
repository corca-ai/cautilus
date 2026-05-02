# Debug Review: claim review UI unclear action
Date: 2026-05-02

## Problem

The browser review UI did not make clear what the maintainer should read or what comments they should leave.
It rendered the Markdown report as sections with repeated status/comment controls, which looked like mechanical comment blocks inserted between report sections.

## Correct Behavior

Given a maintainer opens the claim review UI on a phone, when the first screen loads, then it should show a small queue of concrete decisions and explain which linked detail is optional evidence for each decision.
The full report should be reference material, not the primary interaction surface.

## Observed Facts

- `agent-browser` mobile snapshot at `390x844` showed `Overview`, `Packet`, `Scoreboard`, and repeated section-level comment controls before any clear decision.
- The page did not say which choices were human decisions versus agent follow-up work.
- The user explicitly reported not knowing what to do after opening the HTML.
- The previous UI saved JSON correctly, so the failure was interaction framing rather than persistence.
- A fresh-eye subagent premortem found one persistence risk after the first repair: suggested/default decisions were being materialized as saved comments without explicit maintainer action.
- A second fresh-eye subagent premortem found remaining report-specific next-work prose that could go stale if the report changes.

## Reproduction

```bash
AGENT_BROWSER_SESSION=cautilus-review-mobile agent-browser set viewport 390 844
AGENT_BROWSER_SESSION=cautilus-review-mobile agent-browser open 'https://denver-closing-unix-nano.trycloudflare.com/?token=...'
AGENT_BROWSER_SESSION=cautilus-review-mobile agent-browser snapshot -c -d 3
```

The snapshot showed the report sections and comment boxes instead of a decision queue.

## Candidate Causes

- The UI reused Markdown report sections as review prompts instead of modeling maintainer decisions separately.
- Reference details were expanded by default, making optional evidence look mandatory.
- The save schema allowed comments but did not distinguish decision-card comments from reference-section comments.

## Hypothesis

If the root cause is interaction framing, then adding a first-class review queue with five explicit cards should make the mobile first screen understandable without reading the full report.

## Verification

After repair, `agent-browser` at `390x844` showed:

- a `What I need from you` intro
- five decision cards
- suggested decisions for agent-owned next steps, while actual controls remain `Unreviewed` until touched
- optional links to collapsed reference sections
- no repeated reference-section comment boxes on the first screen

Unit coverage now checks that suggested decisions are not stored as `defaultStatus`, report facts are derived from the current report, and blank `unreviewed` comments are dropped.
The decision card copy now derives stale-source and next-work summary text from the current report instead of embedding a fixed report story.
Browser save smoke should only write comments the maintainer explicitly changes.
The smoke JSON was deleted afterward so the maintainer can start with a clean review state.

## Root Cause

The first implementation confused a human-readable report with a human decision interface.
It needed a separate decision model over the report, not a direct Markdown-to-form projection.
The first repair also confused suggested action with recorded approval; a review UI may recommend next action, but it must not persist that recommendation as maintainer consent.
The second repair removed another weak coupling: decision cards should summarize the current report, not freeze this session's queue facts in UI code.

## Seam Risk

- Interrupt ID: claim-review-ui-unclear-action
- Risk Class: none
- Seam: mobile maintainer review over generated claim artifacts
- Disproving Observation: JSON save worked before repair; the user-facing task framing did not.
- What Local Reasoning Cannot Prove: whether the five selected decision cards are exactly the right maintainer review scope.
- Generalization Pressure: monitor

## Interrupt Decision

- Premortem Required: yes
- Next Step: impl
- Handoff Artifact: none

## Prevention

For HITL-style review surfaces, start from the human decision queue first and put raw reports behind expandable evidence links.
Do not expose one comment box per generated report section unless the user explicitly asks for line-by-line annotation.
Do not save recommendation defaults as review evidence; only explicit maintainer edits should enter `.cautilus/claims/claim-status-comments.json`.
When decision-card prose mentions current report facts, derive them from report sections or keep the copy generic.
