import assert from "node:assert/strict";
import test from "node:test";

import { auditClaimDiscoveryCurationFlowLogText } from "./audit-cautilus-claim-discovery-curation-flow-log.mjs";

function jsonl(events) {
	return events.map((event) => JSON.stringify(event)).join("\n");
}

function toolCall(command) {
	return {
		type: "response_item",
		payload: {
			type: "function_call",
			name: "exec_command",
			arguments: JSON.stringify({ cmd: command }),
		},
	};
}

function assistant(text) {
	return {
		type: "response_item",
		payload: {
			type: "message",
			role: "assistant",
			content: [{ type: "output_text", text }],
		},
	};
}

test("passes when the skill discovers claims and curates extraction and bucket signals", () => {
	const audit = auditClaimDiscoveryCurationFlowLogText(jsonl([
		toolCall("./bin/cautilus doctor status --repo-root . --json"),
		assistant("Scan scope: entries are README.md, AGENTS.md, and CLAUDE.md with linked Markdown depth 3. Confirm this scope or adjust it before I run discovery."),
		toolCall("./bin/cautilus discover claims --repo-root . --output .cautilus/claims/latest.json"),
		toolCall("./bin/cautilus discover claims status --input .cautilus/claims/latest.json --sample-claims 10"),
		assistant("Extraction heuristics used entry-doc headings and imperative promise signals, kept sourceRefs, and merged duplicate summaries by claimFingerprint. Reduce false positives where candidates are over-broad, then scan for likely false negatives: an in-scope missed claim is a discovery bug, while an out-of-scope missing public promise is a narrative gap. Next-work buckets include agent-plan-cautilus-eval, human-confirm-or-decompose, and split-or-defer. Stop before review launch, eval execution, or edits."),
	]));
	assert.equal(audit.status, "passed");
	assert.deepEqual(audit.findings, []);
});

test("fails when the flow only runs first scan without curation language", () => {
	const audit = auditClaimDiscoveryCurationFlowLogText(jsonl([
		toolCall("./bin/cautilus doctor status --repo-root . --json"),
		assistant("Scan scope: entries are README.md, AGENTS.md, and CLAUDE.md with linked Markdown depth 3. Confirm this scope or adjust it before I run discovery."),
		toolCall("./bin/cautilus discover claims --repo-root . --output .cautilus/claims/latest.json"),
		toolCall("./bin/cautilus discover claims status --input .cautilus/claims/latest.json --sample-claims 10"),
		assistant("Discovery is done."),
	]));
	assert.equal(audit.status, "failed");
	assert(audit.findings.some((finding) => finding.id === "missing_extraction_heuristics"));
	assert(audit.findings.some((finding) => finding.id === "missing_dedupe_or_fingerprint"));
	assert(audit.findings.some((finding) => finding.id === "missing_false_positive_curation"));
	assert(audit.findings.some((finding) => finding.id === "missing_false_negative_scan"));
	assert(audit.findings.some((finding) => finding.id === "missing_next_work_curation"));
});

test("fails when the agent overruns into eval or review work", () => {
	const audit = auditClaimDiscoveryCurationFlowLogText(jsonl([
		toolCall("./bin/cautilus doctor status --repo-root . --json"),
		assistant("Scan scope: entries are README.md, AGENTS.md, and CLAUDE.md with linked Markdown depth 3. Confirm this scope or adjust it before I run discovery."),
		toolCall("./bin/cautilus discover claims --repo-root . --output .cautilus/claims/latest.json"),
		toolCall("./bin/cautilus discover claims status --input .cautilus/claims/latest.json --sample-claims 10"),
		assistant("Extraction signals, fingerprint dedup, false-positive curation, likely false-negative scan, and next-work buckets are ready."),
		toolCall("./bin/cautilus discover claims review-input --claims .cautilus/claims/latest.json"),
		toolCall("./bin/cautilus evaluate fixture --repo-root . --adapter-name demo"),
	]));
	assert.equal(audit.status, "failed");
	assert(audit.findings.some((finding) => finding.id === "forbidden_command:claim_review_prepare"));
	assert(audit.findings.some((finding) => finding.id === "forbidden_command:eval_test"));
});
