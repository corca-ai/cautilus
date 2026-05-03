# Claim Review Input Summary

This is a readable projection of a deterministic `cautilus.claim_review_input.v1` packet.
Use it to choose reviewer budget and launch order; use the JSON packet as the audit source.
It does not discover, refresh, or select claim packets; the caller must pass the intended review-input packet explicitly.

## Packet

- Input: .cautilus/claims/review-input-agent-plan-cautilus-eval-2026-05-04b.json
- Schema: cautilus.claim_review_input.v1
- Source claim packet: .cautilus/claims/evidenced-typed-runners.json
- Source claim packet schema: cautilus.claim_proof_plan.v1
- Source claim packet commit: 0949ab4da9f6e7fa025838274260645956230033
- Source claim count: 323
- Source root: .
- Packet notice: This packet prepares deterministic claim review input. It does not call an LLM or assert that any claim is satisfied.
- Action bucket: agent-plan-cautilus-eval
- Selected clusters: 8
- Selected claims: 23
- Selected eval surfaces: app/prompt: 4, dev/repo: 10, dev/skill: 9
- Selected semantic groups: Adapter and portability: 3, Agent and skill workflow: 9, Claim discovery and review: 7, Documentation and contracts: 4
- Evidence preflight: completed; matched refs=138; scanned files=55

## Reviewer Budget Boundary

This document is deterministic review input only.
Launching an LLM or subagent reviewer is a separate budgeted branch.

- maximum clusters: 8
- claims per cluster: 4
- parallel lanes: not selected by this packet
- excerpt chars: 800
- retry policy: not selected by this packet
- skipped-cluster policy: keep skipped clusters visible; do not review them unless a new budget includes them

Recommended next launch, if approved: one reviewer lane, one cluster, no retries, starting with the first cluster below.

## Launch Order

## 1. Agent and skill workflow / dev/skill

- Cluster id: cluster-developer-agent-and-skill-workflow-cautilus-eval-dev-skill-contr
- Candidate claims: 4
- Audience: developer
- Reason queued: Evaluator-dependent claims need review before scenario drafting.
- Review outcome needed: decide whether this cluster should become eval fixture work, deterministic proof work, alignment work, or no work.
- Suggested reviewer focus: duplicates/fragments first, then eval-surface correctness, then fixture authoring priority.

Claims:
- claim-docs-contracts-claim-discovery-workflow-md-187
  - Claim: Before running a first broad scan, the skill should say which entries and depth it will use.
  - Source: docs/contracts/claim-discovery-workflow.md:187
  - Current labels: audience=developer; proof=cautilus-eval; surface=dev/skill; readiness=ready-to-verify; evidence=unknown
  - Reviewer decision: keep as eval claim, merge/drop as duplicate or fragment, or relabel before any fixture work.
  - Next action if kept: Create or use a dev/skill fixture that proves the skill or agent follows the named workflow step.
- claim-docs-contracts-claim-discovery-workflow-md-188
  - Claim: It should also show the deterministic bounds that will be applied:
  - Source: docs/contracts/claim-discovery-workflow.md:188
  - Current labels: audience=developer; proof=cautilus-eval; surface=dev/skill; readiness=ready-to-verify; evidence=unknown
  - Reviewer decision: keep as eval claim, merge/drop as duplicate or fragment, or relabel before any fixture work.
  - Next action if kept: Create or use a dev/skill fixture that proves the skill presents the scan scope and deterministic bounds before running broad discovery.
- claim-docs-contracts-claim-discovery-workflow-md-196
  - Claim: The skill should ask the user to confirm or adjust that scope.
  - Source: docs/contracts/claim-discovery-workflow.md:196
  - Current labels: audience=developer; proof=cautilus-eval; surface=dev/skill; readiness=ready-to-verify; evidence=unknown
  - Reviewer decision: keep as eval claim, merge/drop as duplicate or fragment, or relabel before any fixture work.
  - Next action if kept: Create or use a dev/skill fixture that proves the skill or agent follows the named workflow step.
  - Possible evidence hints: 1; reviewer must verify before marking evidence satisfied.
- claim-docs-contracts-claim-discovery-workflow-md-202
  - Claim: After the deterministic pass, the skill should show a separate review plan:
  - Source: docs/contracts/claim-discovery-workflow.md:202
  - Current labels: audience=developer; proof=cautilus-eval; surface=dev/skill; readiness=ready-to-verify; evidence=unknown
  - Reviewer decision: keep as eval claim, merge/drop as duplicate or fragment, or relabel before any fixture work.
  - Next action if kept: Create or use a dev/skill fixture that proves the skill or agent follows the named workflow step.

## 2. Agent and skill workflow / dev/repo

- Cluster id: cluster-developer-agent-and-skill-workflow-cautilus-eval-dev-repo-contra
- Candidate claims: 4
- Audience: developer
- Reason queued: Evaluator-dependent claims need review before scenario drafting.
- Review outcome needed: decide whether this cluster should become eval fixture work, deterministic proof work, alignment work, or no work.
- Suggested reviewer focus: duplicates/fragments first, then eval-surface correctness, then fixture authoring priority.

Claims:
- claim-docs-contracts-claim-discovery-workflow-md-197
  - Claim: After confirmation, the binary should record the effective scope in the packet so a future agent can reproduce or refresh the run.
  - Source: docs/contracts/claim-discovery-workflow.md:197
  - Current labels: audience=developer; proof=cautilus-eval; surface=dev/repo; readiness=ready-to-verify; evidence=unknown
  - Reviewer decision: keep as eval claim, merge/drop as duplicate or fragment, or relabel before any fixture work.
  - Next action if kept: Create a host-owned dev/repo fixture and run it through cautilus eval test.
- claim-docs-contracts-claim-discovery-workflow-md-466
  - Claim: The refresh-plan packet should include a coordinator-facing summary rather than requiring every agent to reverse-engineer raw JSON fields:
  - Source: docs/contracts/claim-discovery-workflow.md:466
  - Current labels: audience=developer; proof=cautilus-eval; surface=dev/repo; readiness=ready-to-verify; evidence=unknown
  - Reviewer decision: keep as eval claim, merge/drop as duplicate or fragment, or relabel before any fixture work.
  - Next action if kept: Create a host-owned dev/repo fixture and run it through cautilus eval test.
- claim-docs-contracts-claim-discovery-workflow-md-525
  - Claim: Each action bucket should include `byReviewStatus` and `byEvidenceStatus` counts so a human can tell whether the queue is already reviewed enough to spend time on or still needs agent triage first.
  - Source: docs/contracts/claim-discovery-workflow.md:525
  - Current labels: audience=developer; proof=cautilus-eval; surface=dev/repo; readiness=ready-to-verify; evidence=unknown
  - Reviewer decision: keep as eval claim, merge/drop as duplicate or fragment, or relabel before any fixture work.
  - Next action if kept: Create a host-owned dev/repo fixture and run it through cautilus eval test.
- claim-docs-contracts-runner-readiness-md-398
  - Claim: Treating `agent status` branch labels as a fourth product workflow is over-worry once the branch ordering keeps ownership visible and status remains read-only.
  - Source: docs/contracts/runner-readiness.md:398
  - Current labels: audience=developer; proof=cautilus-eval; surface=dev/repo; readiness=ready-to-verify; evidence=unknown
  - Reviewer decision: keep as eval claim, merge/drop as duplicate or fragment, or relabel before any fixture work.
  - Next action if kept: Create a host-owned dev/repo fixture and run it through cautilus eval test.

## 3. Claim discovery and review / dev/skill

- Cluster id: cluster-developer-claim-discovery-and-review-cautilus-eval-dev-skill-con
- Candidate claims: 4
- Audience: developer
- Reason queued: Evaluator-dependent claims need review before scenario drafting.
- Review outcome needed: decide whether this cluster should become eval fixture work, deterministic proof work, alignment work, or no work.
- Suggested reviewer focus: duplicates/fragments first, then eval-surface correctness, then fixture authoring priority.

Claims:
- claim-docs-contracts-claim-discovery-workflow-md-177
  - Claim: The binary only understands the portable labels `user`, `developer`, and `unclear`; richer semantic grouping remains review work for the skill and reviewer loop.
  - Source: docs/contracts/claim-discovery-workflow.md:177
  - Current labels: audience=developer; proof=cautilus-eval; surface=dev/skill; readiness=ready-to-verify; evidence=unknown
  - Reviewer decision: keep as eval claim, merge/drop as duplicate or fragment, or relabel before any fixture work.
  - Next action if kept: Create a host-owned dev/skill fixture and run it through cautilus eval test.
- claim-docs-contracts-claim-discovery-workflow-md-461
  - Claim: When the skill runs `claim discover --previous <packet>` for the actual refreshed proof plan, unchanged claim fingerprints carry forward reviewed labels, evidence refs, unresolved questions, and next-action state.
  - Source: docs/contracts/claim-discovery-workflow.md:461
  - Current labels: audience=developer; proof=cautilus-eval; surface=dev/skill; readiness=ready-to-verify; evidence=unknown
  - Reviewer decision: keep as eval claim, merge/drop as duplicate or fragment, or relabel before any fixture work.
  - Next action if kept: Create a host-owned dev/skill fixture and run it through cautilus eval test.
  - Possible evidence hints: 1; reviewer must verify before marking evidence satisfied.
- claim-docs-contracts-claim-discovery-workflow-md-576
  - Claim: Helper flags under `claim discover` are enough if the skill keeps the user-facing action as discover.
  - Source: docs/contracts/claim-discovery-workflow.md:576
  - Current labels: audience=developer; proof=cautilus-eval; surface=dev/skill; readiness=ready-to-verify; evidence=unknown
  - Reviewer decision: keep as eval claim, merge/drop as duplicate or fragment, or relabel before any fixture work.
  - Next action if kept: Create a host-owned dev/skill fixture and run it through cautilus eval test.
- claim-docs-contracts-claim-discovery-workflow-md-595
  - Claim: Claim review that uses an LLM needs separate review-budget confirmation after deterministic scan.
  - Source: docs/contracts/claim-discovery-workflow.md:595
  - Current labels: audience=developer; proof=cautilus-eval; surface=dev/skill; readiness=ready-to-verify; evidence=unknown
  - Reviewer decision: keep as eval claim, merge/drop as duplicate or fragment, or relabel before any fixture work.
  - Next action if kept: Create or use a dev/skill fixture that proves the skill separates deterministic scan confirmation from LLM review budget confirmation.

## 4. Documentation and contracts / app/prompt

- Cluster id: cluster-developer-documentation-and-contracts-cautilus-eval-app-prompt-c
- Candidate claims: 4
- Audience: developer
- Reason queued: Evaluator-dependent claims need review before scenario drafting.
- Review outcome needed: decide whether this cluster should become eval fixture work, deterministic proof work, alignment work, or no work.
- Suggested reviewer focus: duplicates/fragments first, then eval-surface correctness, then fixture authoring priority.

Claims:
- claim-docs-contracts-optimization-md-38
  - Claim: Shorter and less specialized prompts should win only after behavior, held-out, comparison, and review guardrails remain satisfied.
  - Source: docs/contracts/optimization.md:38
  - Current labels: audience=developer; proof=cautilus-eval; surface=app/prompt; readiness=ready-to-verify; evidence=unknown
  - Reviewer decision: keep as eval claim, merge/drop as duplicate or fragment, or relabel before any fixture work.
  - Next action if kept: Create a host-owned app/prompt fixture and run it through cautilus eval test.
- claim-docs-contracts-runner-readiness-md-121
  - Claim: It should not silently downgrade app proof to prompt-only smoke when the selected claim requires a headless product runner.
  - Source: docs/contracts/runner-readiness.md:121
  - Current labels: audience=developer; proof=cautilus-eval; surface=app/prompt; readiness=ready-to-verify; evidence=unknown
  - Reviewer decision: keep as eval claim, merge/drop as duplicate or fragment, or relabel before any fixture work.
  - Next action if kept: Create a host-owned app/prompt fixture and run it through cautilus eval test.
- claim-docs-contracts-runner-readiness-md-208
  - Claim: `productionPathReuse` should name the reused modules, route handlers, services, prompt builders, tool registries, state stores, or policy modules.
  - Source: docs/contracts/runner-readiness.md:208
  - Current labels: audience=developer; proof=cautilus-eval; surface=app/prompt; readiness=ready-to-verify; evidence=unknown
  - Reviewer decision: keep as eval claim, merge/drop as duplicate or fragment, or relabel before any fixture work.
  - Next action if kept: Create a host-owned app/prompt fixture and run it through cautilus eval test.
- claim-docs-contracts-runner-readiness-md-61
  - Claim: A headless product runner is an app runner that can execute product behavior from a CLI or local command while reusing production-adjacent prompt composition, tool registry, state policy, and response logic.
  - Source: docs/contracts/runner-readiness.md:61
  - Current labels: audience=developer; proof=cautilus-eval; surface=app/prompt; readiness=ready-to-verify; evidence=unknown
  - Reviewer decision: keep as eval claim, merge/drop as duplicate or fragment, or relabel before any fixture work.
  - Next action if kept: Create a host-owned app/prompt fixture and run it through cautilus eval test.

## 5. Adapter and portability / dev/repo

- Cluster id: cluster-developer-adapter-and-portability-cautilus-eval-dev-repo-contrac
- Candidate claims: 3
- Audience: developer
- Reason queued: Evaluator-dependent claims need review before scenario drafting.
- Review outcome needed: decide whether this cluster should become eval fixture work, deterministic proof work, alignment work, or no work.
- Suggested reviewer focus: duplicates/fragments first, then eval-surface correctness, then fixture authoring priority.

Claims:
- claim-docs-contracts-adapter-contract-md-209
  - Claim: When an eval run uses `runtime=product`, the adapter-owned command is expected to exercise a headless product path; the runtime label does not make product proof ready without a current runner assessment.
  - Source: docs/contracts/adapter-contract.md:209
  - Current labels: audience=developer; proof=cautilus-eval; surface=dev/repo; readiness=ready-to-verify; evidence=unknown
  - Reviewer decision: keep as eval claim, merge/drop as duplicate or fragment, or relabel before any fixture work.
  - Next action if kept: Create a host-owned dev/repo fixture and run it through cautilus eval test.
- claim-docs-contracts-adapter-contract-md-222
  - Claim: If omitted, discovery uses the portable fallback group `General product behavior` instead of assuming a product-specific taxonomy.
  - Source: docs/contracts/adapter-contract.md:222
  - Current labels: audience=developer; proof=cautilus-eval; surface=dev/repo; readiness=ready-to-verify; evidence=unknown
  - Reviewer decision: keep as eval claim, merge/drop as duplicate or fragment, or relabel before any fixture work.
  - Next action if kept: Create a host-owned dev/repo fixture and run it through cautilus eval test.
- claim-docs-contracts-claim-discovery-workflow-md-179
  - Claim: When the adapter omits semantic groups, the binary emits `General product behavior` instead of using a Cautilus-specific taxonomy.
  - Source: docs/contracts/claim-discovery-workflow.md:179
  - Current labels: audience=developer; proof=cautilus-eval; surface=dev/repo; readiness=ready-to-verify; evidence=unknown
  - Reviewer decision: keep as eval claim, merge/drop as duplicate or fragment, or relabel before any fixture work.
  - Next action if kept: Create a host-owned dev/repo fixture and run it through cautilus eval test.

## 6. Claim discovery and review / dev/repo

- Cluster id: cluster-developer-claim-discovery-and-review-cautilus-eval-dev-repo-skil
- Candidate claims: 2
- Audience: developer
- Reason queued: Evaluator-dependent claims need review before scenario drafting.
- Review outcome needed: decide whether this cluster should become eval fixture work, deterministic proof work, alignment work, or no work.
- Suggested reviewer focus: duplicates/fragments first, then eval-surface correctness, then fixture authoring priority.

Claims:
- claim-skills-cautilus-skill-md-112
  - Claim: The coordinator should understand that choosing review means setting a review budget before any reviewer lanes, result application, eval planning, edits, or commits happen.
  - Source: skills/cautilus/SKILL.md:112
  - Current labels: audience=developer; proof=cautilus-eval; surface=dev/repo; readiness=ready-to-verify; evidence=unknown
  - Reviewer decision: keep as eval claim, merge/drop as duplicate or fragment, or relabel before any fixture work.
  - Next action if kept: Create a host-owned dev/repo fixture and run it through cautilus eval test.
- claim-skills-cautilus-skill-md-159
  - Claim: This branch proves reviewer launch, not review-result merge behavior.
  - Source: skills/cautilus/SKILL.md:159
  - Current labels: audience=developer; proof=cautilus-eval; surface=dev/repo; readiness=ready-to-verify; evidence=unknown
  - Reviewer decision: keep as eval claim, merge/drop as duplicate or fragment, or relabel before any fixture work.
  - Next action if kept: Create a host-owned dev/repo fixture and run it through cautilus eval test.

## 7. Agent and skill workflow / dev/skill

- Cluster id: cluster-developer-agent-and-skill-workflow-cautilus-eval-dev-skill-skill
- Candidate claims: 1
- Audience: developer
- Reason queued: Evaluator-dependent claims need review before scenario drafting.
- Review outcome needed: decide whether this cluster should become eval fixture work, deterministic proof work, alignment work, or no work.
- Suggested reviewer focus: duplicates/fragments first, then eval-surface correctness, then fixture authoring priority.

Claims:
- claim-skills-cautilus-skill-md-221
  - Claim: Agents should read the packet first, then cite HTML only when a browser view is the deliverable.
  - Source: skills/cautilus/SKILL.md:221
  - Current labels: audience=developer; proof=cautilus-eval; surface=dev/skill; readiness=ready-to-verify; evidence=unknown
  - Reviewer decision: keep as eval claim, merge/drop as duplicate or fragment, or relabel before any fixture work.
  - Next action if kept: Create or use a dev/skill fixture that proves the skill or agent follows the named workflow step.

## 8. Claim discovery and review / dev/repo

- Cluster id: cluster-developer-claim-discovery-and-review-cautilus-eval-dev-repo-spec
- Candidate claims: 1
- Audience: developer
- Reason queued: Evaluator-dependent claims need review before scenario drafting.
- Review outcome needed: decide whether this cluster should become eval fixture work, deterministic proof work, alignment work, or no work.
- Suggested reviewer focus: duplicates/fragments first, then eval-surface correctness, then fixture authoring priority.

Claims:
- claim-docs-specs-maintainer-binary-skill-boundary-spec-md-15
  - Claim: The binary should not call an LLM provider directly for claim discovery or claim review.
  - Source: docs/specs/maintainer/binary-skill-boundary.spec.md:15
  - Current labels: audience=developer; proof=cautilus-eval; surface=dev/repo; readiness=ready-to-verify; evidence=unknown
  - Reviewer decision: keep as eval claim, merge/drop as duplicate or fragment, or relabel before any fixture work.
  - Next action if kept: Create a host-owned dev/repo fixture and run it through cautilus eval test.

## Skipped Work

- Skipped claims: 243
- Skipped clusters: 12
- Skipped claim reasons: action-bucket-mismatch: 243
- Skipped cluster reasons: max-clusters-exceeded: 12
- First skipped clusters:
  - cluster-developer-documentation-and-contracts-cautilus-eval-dev-repo-con: 16 claim(s), reason=max-clusters-exceeded
  - cluster-developer-documentation-and-contracts-cautilus-eval-dev-repo-spe: 1 claim(s), reason=max-clusters-exceeded
  - cluster-developer-improvement-and-optimization-cautilus-eval-app-prompt: 2 claim(s), reason=max-clusters-exceeded
  - cluster-developer-improvement-and-optimization-cautilus-eval-dev-repo-co: 7 claim(s), reason=max-clusters-exceeded
  - cluster-developer-improvement-and-optimization-cautilus-eval-dev-repo-sp: 1 claim(s), reason=max-clusters-exceeded

