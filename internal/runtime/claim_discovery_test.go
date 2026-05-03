package runtime

import (
	"encoding/json"
	"fmt"
	"os"
	"os/exec"
	"path/filepath"
	"strings"
	"testing"

	"github.com/corca-ai/cautilus/internal/contracts"
)

func TestDiscoverClaimProofPlanClassifiesFixtureClaims(t *testing.T) {
	repoRoot := filepath.Join("..", "..", "fixtures", "claim-discovery", "tiny-repo")
	plan, err := DiscoverClaimProofPlan(ClaimDiscoveryOptions{RepoRoot: repoRoot})
	if err != nil {
		t.Fatalf("DiscoverClaimProofPlan returned error: %v", err)
	}
	if err := ValidateClaimProofPlan(plan); err != nil {
		t.Fatalf("ValidateClaimProofPlan returned error: %v", err)
	}
	if plan["schemaVersion"] != contracts.ClaimProofPlanSchema {
		t.Fatalf("unexpected schemaVersion: %#v", plan["schemaVersion"])
	}
	candidates := arrayOrEmpty(plan["claimCandidates"])
	if len(candidates) != 3 {
		t.Fatalf("expected 3 fixture candidates, got %#v", candidates)
	}
	byProof := map[string]map[string]any{}
	for _, raw := range candidates {
		entry := asMap(raw)
		byProof[stringFromAny(entry["recommendedProof"])] = entry
	}
	for _, proof := range []string{"human-auditable", "deterministic", "cautilus-eval"} {
		if byProof[proof] == nil {
			t.Fatalf("missing %s candidate in %#v", proof, candidates)
		}
	}
	for _, raw := range candidates {
		entry := asMap(raw)
		for _, field := range []string{"claimFingerprint", "recommendedProof", "verificationReadiness", "evidenceStatus", "reviewStatus", "lifecycle", "claimSemanticGroup"} {
			if stringFromAny(entry[field]) == "" {
				t.Fatalf("candidate missing %s: %#v", field, entry)
			}
		}
		if audience := stringFromAny(entry["claimAudience"]); audience == "" {
			t.Fatalf("candidate missing claimAudience: %#v", entry)
		}
	}
	if byProof["cautilus-eval"]["recommendedEvalSurface"] != "dev/repo" {
		t.Fatalf("expected dev/repo eval surface, got %#v", byProof["cautilus-eval"])
	}
	summary := asMap(plan["claimSummary"])
	if asMap(summary["byEvidenceStatus"])["unknown"] != 3 {
		t.Fatalf("expected unknown evidence summary, got %#v", summary)
	}
	byAudience := asMap(summary["byClaimAudience"])
	if byAudience["user"] != 2 || byAudience["developer"] != 1 {
		t.Fatalf("expected README claims as user and AGENTS claim as developer, got %#v", summary)
	}
	if len(asMap(summary["byClaimSemanticGroup"])) == 0 {
		t.Fatalf("expected semantic group summary, got %#v", summary)
	}
}

func TestDiscoverClaimProofPlanDedupesSymlinkedEntrySources(t *testing.T) {
	repoRoot := t.TempDir()
	mustWriteFile(t, filepath.Join(repoRoot, "AGENTS.md"), strings.Join([]string{
		"# AGENTS",
		"",
		"Agents must follow one canonical instruction surface.",
		"",
	}, "\n"))
	if err := os.Symlink("AGENTS.md", filepath.Join(repoRoot, "CLAUDE.md")); err != nil {
		t.Fatalf("symlink failed: %v", err)
	}

	plan, err := DiscoverClaimProofPlan(ClaimDiscoveryOptions{RepoRoot: repoRoot})
	if err != nil {
		t.Fatalf("DiscoverClaimProofPlan returned error: %v", err)
	}
	candidates := arrayOrEmpty(plan["claimCandidates"])
	if len(candidates) != 1 {
		t.Fatalf("expected symlinked AGENTS/CLAUDE entries to produce one candidate, got %#v", candidates)
	}
	first := asMap(candidates[0])
	refs := arrayOrEmpty(first["sourceRefs"])
	if len(refs) != 1 || stringFromAny(asMap(refs[0])["path"]) != "AGENTS.md" {
		t.Fatalf("expected canonical AGENTS.md source ref only, got %#v", first)
	}
	inventory := arrayOrEmpty(plan["sourceInventory"])
	paths := map[string]bool{}
	for _, raw := range inventory {
		paths[stringFromAny(asMap(raw)["path"])] = true
	}
	if !paths["AGENTS.md"] || paths["CLAUDE.md"] {
		t.Fatalf("expected source inventory to omit duplicate symlink alias, got %#v", inventory)
	}
}

func TestDiscoverClaimProofPlanMergesIdenticalClaimsAcrossDistinctSources(t *testing.T) {
	repoRoot := t.TempDir()
	claim := "Agents must preserve durable packets for later review."
	mustWriteFile(t, filepath.Join(repoRoot, "README.md"), strings.Join([]string{
		"# Demo",
		"",
		claim,
		"",
	}, "\n"))
	mustWriteFile(t, filepath.Join(repoRoot, "AGENTS.md"), strings.Join([]string{
		"# AGENTS",
		"",
		claim,
		"",
	}, "\n"))

	plan, err := DiscoverClaimProofPlan(ClaimDiscoveryOptions{RepoRoot: repoRoot})
	if err != nil {
		t.Fatalf("DiscoverClaimProofPlan returned error: %v", err)
	}
	candidates := arrayOrEmpty(plan["claimCandidates"])
	if len(candidates) != 1 {
		t.Fatalf("expected identical claims to merge into one candidate, got %#v", candidates)
	}
	first := asMap(candidates[0])
	refs := arrayOrEmpty(first["sourceRefs"])
	if len(refs) != 2 {
		t.Fatalf("expected merged claim to keep both source refs, got %#v", first)
	}
	paths := map[string]bool{}
	for _, raw := range refs {
		paths[stringFromAny(asMap(raw)["path"])] = true
	}
	if !paths["README.md"] || !paths["AGENTS.md"] {
		t.Fatalf("expected README and AGENTS refs, got %#v", refs)
	}
	if plan["candidateCount"] != 1 {
		t.Fatalf("expected candidateCount to reflect merged claims, got %#v", plan["candidateCount"])
	}
	if stringFromAny(first["claimAudience"]) != "unclear" || stringFromAny(first["claimAudienceSource"]) != "entry-default" {
		t.Fatalf("expected merged README/AGENTS claim audience to be unclear, got %#v", first)
	}
}

func TestDiscoverClaimProofPlanClassifiesLinkedDocAudienceAndOperatingRules(t *testing.T) {
	repoRoot := t.TempDir()
	mustWriteFile(t, filepath.Join(repoRoot, "README.md"), strings.Join([]string{
		"# Demo",
		"",
		"See the [consumer guide](docs/guides/consumer-adoption.md) and [operator convention](docs/conventions/operating-contract.md).",
		"",
	}, "\n"))
	mustWriteFile(t, filepath.Join(repoRoot, "docs", "guides", "consumer-adoption.md"), strings.Join([]string{
		"# Consumer Adoption",
		"",
		"The guide provides browser-readable setup steps for users.",
		"",
	}, "\n"))
	mustWriteFile(t, filepath.Join(repoRoot, "docs", "conventions", "operating-contract.md"), strings.Join([]string{
		"# Operating Contract",
		"",
		"Before changing repo operating contracts, prompt or skill surfaces, exports, or artifact policy, read recent lessons; it owns repeat traps that should change the next move.",
		"",
	}, "\n"))

	plan, err := DiscoverClaimProofPlan(ClaimDiscoveryOptions{RepoRoot: repoRoot})
	if err != nil {
		t.Fatalf("DiscoverClaimProofPlan returned error: %v", err)
	}
	bySummary := map[string]map[string]any{}
	for _, raw := range arrayOrEmpty(plan["claimCandidates"]) {
		entry := asMap(raw)
		bySummary[stringFromAny(entry["summary"])] = entry
	}
	guide := bySummary["The guide provides browser-readable setup steps for users."]
	if guide == nil || guide["claimAudience"] != "user" || guide["claimAudienceSource"] != "path-default" {
		t.Fatalf("expected docs/guides claim to default to user-facing, got %#v", guide)
	}
	convention := bySummary["Before changing repo operating contracts, prompt or skill surfaces, exports, or artifact policy, read recent lessons; it owns repeat traps that should change the next move."]
	if convention == nil || convention["claimAudience"] != "developer" || convention["claimAudienceSource"] != "path-default" {
		t.Fatalf("expected docs/conventions claim to default to developer-facing, got %#v", convention)
	}
	if convention["recommendedProof"] != "human-auditable" || convention["verificationReadiness"] != "blocked" {
		t.Fatalf("expected operating-rule convention to stay out of eval planning, got %#v", convention)
	}
}

func TestDiscoverClaimProofPlanCarriesPreviousEvidenceByFingerprint(t *testing.T) {
	repoRoot := t.TempDir()
	mustWriteFile(t, filepath.Join(repoRoot, "README.md"), strings.Join([]string{
		"# Product",
		"",
		"Cautilus should keep reviewed evidence attached when line-number claim ids drift.",
		"",
	}, "\n"))
	plan, err := DiscoverClaimProofPlan(ClaimDiscoveryOptions{RepoRoot: repoRoot})
	if err != nil {
		t.Fatalf("DiscoverClaimProofPlan returned error: %v", err)
	}
	candidate := asMap(arrayOrEmpty(plan["claimCandidates"])[0])
	currentClaimID := stringFromAny(candidate["claimId"])
	previousClaimID := "claim-readme-md-999"
	evidencePath := filepath.Join(repoRoot, ".cautilus", "claims", "evidence.txt")
	mustWriteFile(t, evidencePath, "evidence stays unchanged\n")
	evidenceHash, err := fileSHA256(evidencePath)
	if err != nil {
		t.Fatalf("fileSHA256 returned error: %v", err)
	}
	previous := map[string]any{
		"schemaVersion":   contracts.ClaimProofPlanSchema,
		"sourceRoot":      ".",
		"sourceInventory": plan["sourceInventory"],
		"claimCandidates": []any{
			map[string]any{
				"claimId":                previousClaimID,
				"claimFingerprint":       candidate["claimFingerprint"],
				"summary":                candidate["summary"],
				"recommendedProof":       candidate["recommendedProof"],
				"recommendedEvalSurface": candidate["recommendedEvalSurface"],
				"verificationReadiness":  candidate["verificationReadiness"],
				"evidenceStatus":         "satisfied",
				"reviewStatus":           "agent-reviewed",
				"lifecycle":              "carried-forward",
				"groupHints":             []any{"cautilus-eval"},
				"evidenceRefs": []any{
					map[string]any{
						"kind":             "test",
						"path":             ".cautilus/claims/evidence.txt",
						"matchKind":        "verified",
						"contentHash":      evidenceHash,
						"supportsClaimIds": []any{previousClaimID},
					},
				},
				"sourceRefs": candidate["sourceRefs"],
			},
		},
	}
	previousPath := filepath.Join(repoRoot, "previous-claims.json")
	writeClaimDiscoveryJSONFixture(t, previousPath, previous)

	refreshed, err := DiscoverClaimProofPlan(ClaimDiscoveryOptions{RepoRoot: repoRoot, PreviousPath: previousPath})
	if err != nil {
		t.Fatalf("DiscoverClaimProofPlan with previous returned error: %v", err)
	}
	refreshedCandidate := asMap(arrayOrEmpty(refreshed["claimCandidates"])[0])
	if refreshedCandidate["reviewStatus"] != "agent-reviewed" || refreshedCandidate["evidenceStatus"] != "satisfied" {
		t.Fatalf("expected reviewed evidence to carry forward, got %#v", refreshedCandidate)
	}
	ref := asMap(arrayOrEmpty(refreshedCandidate["evidenceRefs"])[0])
	if supports := stringArrayOrEmpty(ref["supportsClaimIds"]); !containsString(supports, currentClaimID) || containsString(supports, previousClaimID) {
		t.Fatalf("expected evidence supportsClaimIds to be rewritten to current claim id, got %#v", ref)
	}
	carryForward := asMap(refreshed["carryForward"])
	if carryForward["matchedClaimCount"] != 1 || carryForward["evidenceSupportIdRewriteCount"] != 1 {
		t.Fatalf("expected carry-forward summary to record match and rewrite, got %#v", carryForward)
	}
}

func TestDiscoverClaimProofPlanMarksChangedCarriedEvidenceStale(t *testing.T) {
	repoRoot := t.TempDir()
	mustWriteFile(t, filepath.Join(repoRoot, "README.md"), strings.Join([]string{
		"# Product",
		"",
		"Cautilus should keep reviewed evidence attached when line-number claim ids drift.",
		"",
	}, "\n"))
	evidencePath := filepath.Join(repoRoot, ".cautilus", "claims", "evidence.json")
	mustWriteFile(t, evidencePath, `{"schemaVersion":"cautilus.claim_evidence_bundle.v1","createdForClaimIds":["claim-readme-md-3"],"decision":{"evidenceStatus":"satisfied"}}`)
	oldHash, err := fileSHA256(evidencePath)
	if err != nil {
		t.Fatalf("fileSHA256 returned error: %v", err)
	}
	plan, err := DiscoverClaimProofPlan(ClaimDiscoveryOptions{RepoRoot: repoRoot})
	if err != nil {
		t.Fatalf("DiscoverClaimProofPlan returned error: %v", err)
	}
	candidate := asMap(arrayOrEmpty(plan["claimCandidates"])[0])
	currentClaimID := stringFromAny(candidate["claimId"])
	mustWriteFile(t, evidencePath, `{"schemaVersion":"cautilus.claim_evidence_bundle.v1","createdForClaimIds":["`+currentClaimID+`"],"decision":{"evidenceStatus":"satisfied"},"changed":true}`)
	previous := map[string]any{
		"schemaVersion":   contracts.ClaimProofPlanSchema,
		"sourceRoot":      ".",
		"sourceInventory": plan["sourceInventory"],
		"claimCandidates": []any{
			map[string]any{
				"claimId":               currentClaimID,
				"claimFingerprint":      candidate["claimFingerprint"],
				"summary":               candidate["summary"],
				"recommendedProof":      candidate["recommendedProof"],
				"verificationReadiness": candidate["verificationReadiness"],
				"evidenceStatus":        "satisfied",
				"reviewStatus":          "agent-reviewed",
				"lifecycle":             "carried-forward",
				"evidenceRefs": []any{
					map[string]any{
						"kind":             "test",
						"path":             ".cautilus/claims/evidence.json",
						"matchKind":        "verified",
						"contentHash":      oldHash,
						"supportsClaimIds": []any{currentClaimID},
					},
				},
				"sourceRefs": candidate["sourceRefs"],
			},
		},
	}
	previousPath := filepath.Join(repoRoot, "previous-claims.json")
	writeClaimDiscoveryJSONFixture(t, previousPath, previous)

	refreshed, err := DiscoverClaimProofPlan(ClaimDiscoveryOptions{RepoRoot: repoRoot, PreviousPath: previousPath})
	if err != nil {
		t.Fatalf("DiscoverClaimProofPlan with previous returned error: %v", err)
	}
	refreshedCandidate := asMap(arrayOrEmpty(refreshed["claimCandidates"])[0])
	if refreshedCandidate["evidenceStatus"] != "stale" {
		t.Fatalf("expected changed evidence to downgrade satisfied claim to stale, got %#v", refreshedCandidate)
	}
	if !strings.Contains(stringFromAny(refreshedCandidate["evidenceStatusReason"]), "contentHash changed") {
		t.Fatalf("expected stale evidence reason to mention contentHash, got %#v", refreshedCandidate)
	}
	carryForward := asMap(refreshed["carryForward"])
	if carryForward["staleEvidenceClaimCount"] != 1 || carryForward["changedEvidenceRefCount"] != 1 {
		t.Fatalf("expected carry-forward summary to record stale changed evidence, got %#v", carryForward)
	}
}

func TestDiscoverClaimProofPlanMarksEvidenceBundleClaimMismatchStale(t *testing.T) {
	repoRoot := t.TempDir()
	mustWriteFile(t, filepath.Join(repoRoot, "README.md"), strings.Join([]string{
		"# Product",
		"",
		"Cautilus should keep reviewed evidence attached when line-number claim ids drift.",
		"",
	}, "\n"))
	plan, err := DiscoverClaimProofPlan(ClaimDiscoveryOptions{RepoRoot: repoRoot})
	if err != nil {
		t.Fatalf("DiscoverClaimProofPlan returned error: %v", err)
	}
	candidate := asMap(arrayOrEmpty(plan["claimCandidates"])[0])
	currentClaimID := stringFromAny(candidate["claimId"])
	evidencePath := filepath.Join(repoRoot, ".cautilus", "claims", "evidence.json")
	mustWriteFile(t, evidencePath, `{"schemaVersion":"cautilus.claim_evidence_bundle.v1","createdForClaimIds":["claim-old-id"],"decision":{"evidenceStatus":"satisfied"}}`)
	hash, err := fileSHA256(evidencePath)
	if err != nil {
		t.Fatalf("fileSHA256 returned error: %v", err)
	}
	previous := map[string]any{
		"schemaVersion":   contracts.ClaimProofPlanSchema,
		"sourceRoot":      ".",
		"sourceInventory": plan["sourceInventory"],
		"claimCandidates": []any{
			map[string]any{
				"claimId":               currentClaimID,
				"claimFingerprint":      candidate["claimFingerprint"],
				"summary":               candidate["summary"],
				"recommendedProof":      candidate["recommendedProof"],
				"verificationReadiness": candidate["verificationReadiness"],
				"evidenceStatus":        "satisfied",
				"reviewStatus":          "agent-reviewed",
				"lifecycle":             "carried-forward",
				"evidenceRefs": []any{
					map[string]any{
						"kind":             "test",
						"path":             ".cautilus/claims/evidence.json",
						"matchKind":        "verified",
						"contentHash":      hash,
						"supportsClaimIds": []any{currentClaimID},
					},
				},
				"sourceRefs": candidate["sourceRefs"],
			},
		},
	}
	previousPath := filepath.Join(repoRoot, "previous-claims.json")
	writeClaimDiscoveryJSONFixture(t, previousPath, previous)

	refreshed, err := DiscoverClaimProofPlan(ClaimDiscoveryOptions{RepoRoot: repoRoot, PreviousPath: previousPath})
	if err != nil {
		t.Fatalf("DiscoverClaimProofPlan with previous returned error: %v", err)
	}
	refreshedCandidate := asMap(arrayOrEmpty(refreshed["claimCandidates"])[0])
	if refreshedCandidate["evidenceStatus"] != "stale" {
		t.Fatalf("expected mismatched evidence bundle to downgrade claim to stale, got %#v", refreshedCandidate)
	}
	if !strings.Contains(stringFromAny(refreshedCandidate["evidenceStatusReason"]), "createdForClaimIds") {
		t.Fatalf("expected stale evidence reason to mention createdForClaimIds, got %#v", refreshedCandidate)
	}
	carryForward := asMap(refreshed["carryForward"])
	if carryForward["staleEvidenceClaimCount"] != 1 || carryForward["unsupportedEvidenceRefCount"] != 1 {
		t.Fatalf("expected carry-forward summary to record unsupported evidence ref, got %#v", carryForward)
	}
}

func TestDiscoverClaimProofPlanDoesNotCarryHeuristicNextAction(t *testing.T) {
	repoRoot := t.TempDir()
	claim := "Past runs showed some CLIs can reject schemas that declare object properties without also listing them in `required`, even when plain JSON Schema would allow them as optional."
	mustWriteFile(t, filepath.Join(repoRoot, "README.md"), strings.Join([]string{
		"# Demo",
		"",
		claim,
		"",
	}, "\n"))
	plan, err := DiscoverClaimProofPlan(ClaimDiscoveryOptions{RepoRoot: repoRoot})
	if err != nil {
		t.Fatalf("DiscoverClaimProofPlan returned error: %v", err)
	}
	candidate := asMap(arrayOrEmpty(plan["claimCandidates"])[0])
	currentNextAction := stringFromAny(candidate["nextAction"])
	if !strings.Contains(currentNextAction, "human-auditable context") {
		t.Fatalf("expected historical next action, got %#v", candidate)
	}
	previous := map[string]any{
		"schemaVersion": contracts.ClaimProofPlanSchema,
		"claimCandidates": []any{
			map[string]any{
				"claimId":               candidate["claimId"],
				"claimFingerprint":      candidate["claimFingerprint"],
				"summary":               candidate["summary"],
				"recommendedProof":      "deterministic",
				"verificationReadiness": "ready-to-verify",
				"reviewStatus":          "heuristic",
				"evidenceStatus":        "unknown",
				"lifecycle":             "new",
				"nextAction":            "Keep or add a repo-owned unit, lint, build, schema, or CI check for this claim.",
				"evidenceRefs":          []any{},
				"sourceRefs":            candidate["sourceRefs"],
			},
		},
	}
	previousPath := filepath.Join(repoRoot, "previous-claims.json")
	writeClaimDiscoveryJSONFixture(t, previousPath, previous)

	refreshed, err := DiscoverClaimProofPlan(ClaimDiscoveryOptions{RepoRoot: repoRoot, PreviousPath: previousPath})
	if err != nil {
		t.Fatalf("DiscoverClaimProofPlan with previous returned error: %v", err)
	}
	refreshedCandidate := asMap(arrayOrEmpty(refreshed["claimCandidates"])[0])
	if refreshedCandidate["nextAction"] != currentNextAction {
		t.Fatalf("expected heuristic nextAction to refresh from current classification, got %#v", refreshedCandidate)
	}
}

func TestDiscoverClaimProofPlanAvoidsExampleAndBroadRouting(t *testing.T) {
	repoRoot := t.TempDir()
	mustWriteFile(t, filepath.Join(repoRoot, "README.md"), strings.Join([]string{
		"# Demo",
		"",
		"## Scenarios",
		"",
		"**Input (For Agent)**: \"Turn this behavior input into reusable scenarios and render an HTML page I can review.\"",
		"",
		"The `cautilus scenario normalize chatbot` command emits reopenable proposal packets for review.",
		"",
		"Context-recovery should become a protected scenario for follow-up behavior.",
		"",
		"Next step: a human decides whether to promote the scenario into a protected evaluation path, while an agent can reopen the saved result.",
		"",
		"## Skill / agent execution regression",
		"",
		"The same preset can evaluate a multi-turn agent episode when the fixture provides turns.",
		"",
		"The same preset can evaluate a multi-turn agent episode when the fixture provides turns; dogfood fixtures derive results from audit packets.",
		"",
		"Dogfood fixture results should derive from audit packets.",
		"",
		"When the goal is only to prove command routing, `cautilus eval test --runtime fixture` can run adapter-owned fixture results.",
		"",
		"For reviewed `cautilus-eval` claims, `claim plan-evals` emits `cautilus.claim_eval_plan.v1`: an intermediate plan for host-owned eval fixtures, not a writer for prompts, runners, fixtures, or policy.",
		"",
		"`cautilus eval evaluate` evaluates an already-observed packet without launching the runner again.",
		"",
		"Without specdown, a repo can still contain raw Cautilus packets, but it is not fully set up for the Cautilus claim-document workflow.",
		"",
		"The ready payload now includes `first_bounded_run`, which adds a starter `eval test -> eval evaluate` packet loop and keeps the `cautilus scenarios --json` catalog nearby only for proposal-input examples.",
		"",
		"Cautilus leaves evidence that another person or agent can reopen instead of relying on terminal scrollback or memory.",
		"",
		"Agent status should share the same readiness facts when an agent is driving the workflow.",
		"",
		"The assistant should output JSON matching the schema.",
		"",
		"Tool-call JSON returned by the model should match the schema.",
		"",
		"`eval evaluate` remains the first-class packet boundary for skill trigger and execution quality.",
		"",
		"Cautilus supports development-facing behavior, such as agent workflows, repo contracts, tools, and skills.",
		"",
		"Cautilus supports app-facing behavior, such as prompt, chat, and service-response behavior.",
		"",
		"The same product workflow can be reused across repos because repo-specific behavior lives in adapters and fixtures.",
		"",
		"The Agent track provides bundled skill and plugin manifests through cautilus install.",
		"",
		"The static HTML renderer emits browser-readable views for human review.",
		"",
		"`Cautilus` keeps agent and workflow behavior honest while prompts keep changing.",
		"",
		"Commands should emit durable packets with enough state for the next agent to resume.",
		"",
		"machine-readable eval, report, review, evidence, and optimization packets that agents can consume directly",
		"",
		"Use when a stateful automation keeps stalling on the same step.",
		"",
		"The `cautilus install` step also lands a bundled skill with Claude and Codex plugin manifests, so an in-editor agent can drive the same contracts conversationally.",
		"",
		"The long-term direction is intent-first and intentful behavior evaluation: prompts can change if the evaluated behavior gets better.",
		"",
		"While implementing, any bug, error, regression, or unexpected behavior routes to `charness:debug` before further fixes.",
		"",
		"`alignment-work`: the code, docs, adapter, or skill surface must be reconciled before proof would be honest.",
		"",
		"That keeps persona prompt shaping and result semantics product-owned while backend selection stays adapter-owned.",
		"",
		"`npm run test:on-demand` currently owns the heavier self-dogfood workflow script tests.",
		"",
		"It emits `cautilus.agent_status.v1`: a read-only orientation packet over binary health and branch choices.",
		"",
		"`cautilus --version` must work on `PATH` before any consumer adapter or skill wiring is treated as valid.",
		"",
		"The skill owns routing, sequencing, user-facing decision boundaries, and LLM-backed review work.",
		"",
		"Keep the harness portable: host-specific behavior belongs in adapters, presets, and integration manifests.",
		"",
		"If a fallback or recovery path matters to user-visible behavior, add an executable test that proves the path is reachable.",
		"",
		"Past sessions showed `codex exec` can emit fatal skill-loading errors on stderr while the final process exit still looks successful.",
		"",
		"The host still owns raw invocation and transcript capture; `Cautilus` owns the case-suite/runDir workflow and packet-level recommendation.",
		"",
		"In JSON mode, `claude -p` can wrap the verdict under `structured_output` instead of printing the schema payload as the top-level object.",
		"",
		"This keeps prompt benchmarking, code-quality benchmarking, and workflow smoke tests from collapsing into one overloaded adapter file.",
		"",
		"Past runs showed some CLIs can reject schemas that declare object properties without also listing them in `required`, even when plain JSON Schema would allow them as optional.",
		"",
		"Evidence should preserve where the suggestion came from without forcing one host repo's storage model on the product.",
		"",
		"A future live app eval flow can refer to one selected instance by stable id.",
		"",
		"Human-facing views may derive a smaller attention set, but they should not hide the full ranked result from agents.",
		"",
		"It should not be folded into binary/skill responsibility unless the claim is specifically about agent routing.",
		"",
		"It should prefer recall, preserve the scan boundary, and leave curation to packet-aware agent or maintainer review.",
		"",
		"If the user already delegated autonomous continuation, the skill may proceed within the recorded budget, but the budget still must be written to the packet.",
		"",
		"The binary may provide helper flags such as `claim discover --previous <packet> --refresh-plan`, but the public user-level workflow remains `discover`.",
		"",
		"`claim review prepare-input` emits `cautilus.claim_review_input.v1` and records bounded clusters, skipped clusters, and skipped claims, but still does not call an LLM or merge review results.",
		"",
		"The remaining proof gap is behavior-level: a maintained dev/skill fixture should show the skill choosing the claim-review branch without treating raw discovery as a finished answer.",
		"",
		"Before running a first broad scan, the skill should say which entries and depth it will use.",
		"",
		"The skill should ask the user to confirm or adjust that scope.",
		"",
		"The user should confirm or adjust that review budget before the skill launches subagents or other LLM-backed review.",
		"",
		"## Probe Questions",
		"",
		"- Should `run.json` carry workflow metadata so HTML views can present richer summaries?",
		"- Is `review variants` a workflow-creating command that mints runDirs?",
		"> Does this repo have a headless runner for selected behavior?",
		"",
	}, "\n"))

	plan, err := DiscoverClaimProofPlan(ClaimDiscoveryOptions{RepoRoot: repoRoot})
	if err != nil {
		t.Fatalf("DiscoverClaimProofPlan returned error: %v", err)
	}
	bySummary := map[string]map[string]any{}
	for _, raw := range arrayOrEmpty(plan["claimCandidates"]) {
		entry := asMap(raw)
		bySummary[stringFromAny(entry["summary"])] = entry
	}
	for summary := range bySummary {
		if strings.Contains(summary, "Input (For Agent)") {
			t.Fatalf("expected prompt examples to be excluded from claims, got %#v", bySummary[summary])
		}
	}
	for _, question := range []string{
		"Should `run.json` carry workflow metadata so HTML views can present richer summaries?",
		"Is `review variants` a workflow-creating command that mints runDirs?",
		"Does this repo have a headless runner for selected behavior?",
	} {
		if bySummary[question] != nil {
			t.Fatalf("expected open question to be excluded from claims, got %#v", bySummary[question])
		}
	}
	scenarioCommand := bySummary["The `cautilus scenario normalize chatbot` command emits reopenable proposal packets for review."]
	if scenarioCommand == nil || scenarioCommand["recommendedProof"] != "deterministic" {
		t.Fatalf("expected scenario command documentation to be deterministic, got %#v", scenarioCommand)
	}
	contextRecovery := bySummary["Context-recovery should become a protected scenario for follow-up behavior."]
	if contextRecovery == nil || contextRecovery["verificationReadiness"] != "needs-scenario" || contextRecovery["recommendedEvalSurface"] != "app/chat" {
		t.Fatalf("expected context recovery to stay an app/chat scenario candidate, got %#v", contextRecovery)
	}
	reopen := bySummary["Next step: a human decides whether to promote the scenario into a protected evaluation path, while an agent can reopen the saved result."]
	if reopen == nil || reopen["recommendedProof"] != "human-auditable" || reopen["verificationReadiness"] != "blocked" {
		t.Fatalf("expected compound scenario-loop claim to require splitting, got %#v", reopen)
	}
	skillEpisode := bySummary["The same preset can evaluate a multi-turn agent episode when the fixture provides turns."]
	if skillEpisode == nil || skillEpisode["recommendedEvalSurface"] != "dev/skill" {
		t.Fatalf("expected audit-backed agent episode to route to dev/skill, got %#v", skillEpisode)
	}
	auditPacketEpisode := bySummary["The same preset can evaluate a multi-turn agent episode when the fixture provides turns; dogfood fixtures derive results from audit packets."]
	if auditPacketEpisode == nil || auditPacketEpisode["recommendedProof"] != "cautilus-eval" || auditPacketEpisode["recommendedEvalSurface"] != "dev/skill" {
		t.Fatalf("expected mixed agent episode and audit provenance claim to remain dev/skill eval, got %#v", auditPacketEpisode)
	}
	auditPacketProvenance := bySummary["Dogfood fixture results should derive from audit packets."]
	if auditPacketProvenance == nil || auditPacketProvenance["recommendedProof"] != "deterministic" {
		t.Fatalf("expected narrow audit-packet provenance claim to be deterministic, got %#v", auditPacketProvenance)
	}
	fixtureRuntime := bySummary["When the goal is only to prove command routing, `cautilus eval test --runtime fixture` can run adapter-owned fixture results."]
	if fixtureRuntime == nil || fixtureRuntime["recommendedProof"] != "deterministic" {
		t.Fatalf("expected fixture runtime routing claim to be deterministic, got %#v", fixtureRuntime)
	}
	planEvalsPacket := bySummary["For reviewed `cautilus-eval` claims, `claim plan-evals` emits `cautilus.claim_eval_plan.v1`: an intermediate plan for host-owned eval fixtures, not a writer for prompts, runners, fixtures, or policy."]
	if planEvalsPacket == nil || planEvalsPacket["recommendedProof"] != "deterministic" {
		t.Fatalf("expected claim plan-evals packet boundary to be deterministic, got %#v", planEvalsPacket)
	}
	evaluateObserved := bySummary["`cautilus eval evaluate` evaluates an already-observed packet without launching the runner again."]
	if evaluateObserved == nil || evaluateObserved["recommendedProof"] != "deterministic" {
		t.Fatalf("expected no-launch eval evaluate packet claim to be deterministic, got %#v", evaluateObserved)
	}
	specdownReadiness := bySummary["Without specdown, a repo can still contain raw Cautilus packets, but it is not fully set up for the Cautilus claim-document workflow."]
	if specdownReadiness == nil || specdownReadiness["recommendedProof"] != "deterministic" {
		t.Fatalf("expected specdown readiness claim to be deterministic, got %#v", specdownReadiness)
	}
	readyPayload := bySummary["The ready payload now includes `first_bounded_run`, which adds a starter `eval test -> eval evaluate` packet loop and keeps the `cautilus scenarios --json` catalog nearby only for proposal-input examples."]
	if readyPayload == nil || readyPayload["recommendedProof"] != "deterministic" {
		t.Fatalf("expected ready payload claim to be deterministic, got %#v", readyPayload)
	}
	reopenableEvidence := bySummary["Cautilus leaves evidence that another person or agent can reopen instead of relying on terminal scrollback or memory."]
	if reopenableEvidence == nil || reopenableEvidence["recommendedProof"] != "deterministic" {
		t.Fatalf("expected reopenable evidence artifact claim to be deterministic, got %#v", reopenableEvidence)
	}
	agentStatusReadiness := bySummary["Agent status should share the same readiness facts when an agent is driving the workflow."]
	if agentStatusReadiness == nil || agentStatusReadiness["recommendedProof"] != "deterministic" {
		t.Fatalf("expected agent status readiness fact claim to be deterministic, got %#v", agentStatusReadiness)
	}
	assistantJSON := bySummary["The assistant should output JSON matching the schema."]
	if assistantJSON == nil || assistantJSON["recommendedProof"] != "cautilus-eval" || assistantJSON["recommendedEvalSurface"] != "app/chat" {
		t.Fatalf("expected model-produced JSON output to remain app/chat eval, got %#v", assistantJSON)
	}
	toolCallJSON := bySummary["Tool-call JSON returned by the model should match the schema."]
	if toolCallJSON == nil || toolCallJSON["recommendedProof"] != "cautilus-eval" {
		t.Fatalf("expected model tool-call JSON to remain eval proof, got %#v", toolCallJSON)
	}
	evalEvaluateQuality := bySummary["`eval evaluate` remains the first-class packet boundary for skill trigger and execution quality."]
	if evalEvaluateQuality == nil || evalEvaluateQuality["recommendedProof"] != "cautilus-eval" || evalEvaluateQuality["recommendedEvalSurface"] != "dev/skill" {
		t.Fatalf("expected eval evaluate skill-quality claim to remain dev/skill eval, got %#v", evalEvaluateQuality)
	}
	devBehaviorSupport := bySummary["Cautilus supports development-facing behavior, such as agent workflows, repo contracts, tools, and skills."]
	if devBehaviorSupport == nil || devBehaviorSupport["recommendedProof"] != "cautilus-eval" || devBehaviorSupport["verificationReadiness"] != "needs-scenario" {
		t.Fatalf("expected broad development behavior support to need scenario shaping, got %#v", devBehaviorSupport)
	}
	if _, exists := devBehaviorSupport["recommendedEvalSurface"]; exists {
		t.Fatalf("expected broad development behavior support not to pick one surface before scenario selection, got %#v", devBehaviorSupport)
	}
	appBehaviorSupport := bySummary["Cautilus supports app-facing behavior, such as prompt, chat, and service-response behavior."]
	if appBehaviorSupport == nil || appBehaviorSupport["recommendedProof"] != "cautilus-eval" || appBehaviorSupport["verificationReadiness"] != "needs-scenario" {
		t.Fatalf("expected broad app behavior support to need scenario shaping, got %#v", appBehaviorSupport)
	}
	if _, exists := appBehaviorSupport["recommendedEvalSurface"]; exists {
		t.Fatalf("expected broad app behavior support not to pick one surface before scenario selection, got %#v", appBehaviorSupport)
	}
	reusedWorkflow := bySummary["The same product workflow can be reused across repos because repo-specific behavior lives in adapters and fixtures."]
	if reusedWorkflow == nil || reusedWorkflow["recommendedProof"] != "cautilus-eval" || reusedWorkflow["verificationReadiness"] != "needs-scenario" {
		t.Fatalf("expected broad reused workflow claim to need scenario shaping, got %#v", reusedWorkflow)
	}
	if _, exists := reusedWorkflow["recommendedEvalSurface"]; exists {
		t.Fatalf("expected broad reused workflow claim not to pick one surface before scenario selection, got %#v", reusedWorkflow)
	}
	install := bySummary["The Agent track provides bundled skill and plugin manifests through cautilus install."]
	if install == nil || install["recommendedProof"] != "deterministic" {
		t.Fatalf("expected install and plugin materialization to be deterministic, got %#v", install)
	}
	renderer := bySummary["The static HTML renderer emits browser-readable views for human review."]
	if renderer == nil || renderer["recommendedProof"] != "deterministic" {
		t.Fatalf("expected static HTML renderer claim to be deterministic, got %#v", renderer)
	}
	honesty := bySummary["`Cautilus` keeps agent and workflow behavior honest while prompts keep changing."]
	if honesty == nil || honesty["recommendedProof"] != "human-auditable" || honesty["verificationReadiness"] != "blocked" {
		t.Fatalf("expected broad honesty claim to stay human-auditable until decomposed, got %#v", honesty)
	}
	durablePackets := bySummary["Commands should emit durable packets with enough state for the next agent to resume."]
	if durablePackets == nil || durablePackets["recommendedProof"] != "deterministic" {
		t.Fatalf("expected durable packet claim to be deterministic, got %#v", durablePackets)
	}
	machineReadable := bySummary["machine-readable eval, report, review, evidence, and optimization packets that agents can consume directly"]
	if machineReadable == nil || machineReadable["recommendedProof"] != "deterministic" {
		t.Fatalf("expected machine-readable packet claim to be deterministic, got %#v", machineReadable)
	}
	stalledGuidance := bySummary["Use when a stateful automation keeps stalling on the same step."]
	if stalledGuidance == nil || stalledGuidance["recommendedProof"] != "human-auditable" || stalledGuidance["verificationReadiness"] != "blocked" {
		t.Fatalf("expected broad stalled-workflow guidance to be blocked human-auditable, got %#v", stalledGuidance)
	}
	conversationalAgent := bySummary["The `cautilus install` step also lands a bundled skill with Claude and Codex plugin manifests, so an in-editor agent can drive the same contracts conversationally."]
	if conversationalAgent == nil || conversationalAgent["recommendedProof"] != "cautilus-eval" || conversationalAgent["recommendedEvalSurface"] != "dev/skill" {
		t.Fatalf("expected conversational installed-agent claim to route to dev/skill eval, got %#v", conversationalAgent)
	}
	direction := bySummary["The long-term direction is intent-first and intentful behavior evaluation: prompts can change if the evaluated behavior gets better."]
	if direction == nil || direction["recommendedProof"] != "human-auditable" || direction["verificationReadiness"] != "blocked" {
		t.Fatalf("expected product direction to stay blocked human-auditable, got %#v", direction)
	}
	policy := bySummary["While implementing, any bug, error, regression, or unexpected behavior routes to `charness:debug` before further fixes."]
	if policy == nil || policy["recommendedProof"] != "human-auditable" || policy["verificationReadiness"] != "blocked" {
		t.Fatalf("expected operator policy to stay blocked human-auditable, got %#v", policy)
	}
	if glossary := bySummary["`alignment-work`: the code, docs, adapter, or skill surface must be reconciled before proof would be honest."]; glossary != nil {
		t.Fatalf("expected label definition to be excluded from claims, got %#v", glossary)
	}
	boundary := bySummary["That keeps persona prompt shaping and result semantics product-owned while backend selection stays adapter-owned."]
	if boundary == nil || boundary["recommendedProof"] != "human-auditable" || boundary["verificationReadiness"] != "needs-alignment" {
		t.Fatalf("expected ownership boundary explanation to require human-auditable alignment, got %#v", boundary)
	}
	onDemand := bySummary["`npm run test:on-demand` currently owns the heavier self-dogfood workflow script tests."]
	if onDemand == nil || onDemand["recommendedProof"] != "deterministic" {
		t.Fatalf("expected on-demand test ownership to be deterministic, got %#v", onDemand)
	}
	agentStatusPacket := bySummary["It emits `cautilus.agent_status.v1`: a read-only orientation packet over binary health and branch choices."]
	if agentStatusPacket == nil || agentStatusPacket["recommendedProof"] != "deterministic" {
		t.Fatalf("expected agent status packet claim to be deterministic, got %#v", agentStatusPacket)
	}
	pathCheck := bySummary["`cautilus --version` must work on `PATH` before any consumer adapter or skill wiring is treated as valid."]
	if pathCheck == nil || pathCheck["recommendedProof"] != "deterministic" {
		t.Fatalf("expected PATH/version readiness claim to be deterministic, got %#v", pathCheck)
	}
	skillBoundary := bySummary["The skill owns routing, sequencing, user-facing decision boundaries, and LLM-backed review work."]
	if skillBoundary == nil || skillBoundary["recommendedProof"] != "human-auditable" || skillBoundary["verificationReadiness"] != "needs-alignment" {
		t.Fatalf("expected skill ownership boundary to require human-auditable alignment, got %#v", skillBoundary)
	}
	portableBoundary := bySummary["Keep the harness portable: host-specific behavior belongs in adapters, presets, and integration manifests."]
	if portableBoundary == nil || portableBoundary["recommendedProof"] != "human-auditable" || portableBoundary["verificationReadiness"] != "needs-alignment" {
		t.Fatalf("expected portability ownership boundary to require human-auditable alignment, got %#v", portableBoundary)
	}
	executableRecovery := bySummary["If a fallback or recovery path matters to user-visible behavior, add an executable test that proves the path is reachable."]
	if executableRecovery == nil || executableRecovery["recommendedProof"] != "deterministic" || executableRecovery["verificationReadiness"] != "ready-to-verify" {
		t.Fatalf("expected executable recovery-path claim to be deterministic, got %#v", executableRecovery)
	}
	history := bySummary["Past sessions showed `codex exec` can emit fatal skill-loading errors on stderr while the final process exit still looks successful."]
	if history == nil || history["recommendedProof"] != "human-auditable" || history["verificationReadiness"] != "blocked" {
		t.Fatalf("expected historical observation to stay blocked human-auditable, got %#v", history)
	}
	hostBoundary := bySummary["The host still owns raw invocation and transcript capture; `Cautilus` owns the case-suite/runDir workflow and packet-level recommendation."]
	if hostBoundary == nil || hostBoundary["recommendedProof"] != "human-auditable" || hostBoundary["verificationReadiness"] != "needs-alignment" {
		t.Fatalf("expected host/Cautilus ownership boundary to require human-auditable alignment, got %#v", hostBoundary)
	}
	providerCaveat := bySummary["In JSON mode, `claude -p` can wrap the verdict under `structured_output` instead of printing the schema payload as the top-level object."]
	if providerCaveat == nil || providerCaveat["recommendedProof"] != "human-auditable" || providerCaveat["verificationReadiness"] != "blocked" {
		t.Fatalf("expected provider caveat to stay blocked human-auditable, got %#v", providerCaveat)
	}
	rationale := bySummary["This keeps prompt benchmarking, code-quality benchmarking, and workflow smoke tests from collapsing into one overloaded adapter file."]
	if rationale == nil || rationale["recommendedProof"] != "human-auditable" || rationale["verificationReadiness"] != "needs-alignment" {
		t.Fatalf("expected design rationale to require alignment before proof, got %#v", rationale)
	}
	pastRun := bySummary["Past runs showed some CLIs can reject schemas that declare object properties without also listing them in `required`, even when plain JSON Schema would allow them as optional."]
	if pastRun == nil || pastRun["recommendedProof"] != "human-auditable" || pastRun["verificationReadiness"] != "blocked" {
		t.Fatalf("expected past-run historical observation to stay blocked human-auditable, got %#v", pastRun)
	}
	provenance := bySummary["Evidence should preserve where the suggestion came from without forcing one host repo's storage model on the product."]
	if provenance == nil || provenance["recommendedProof"] != "deterministic" {
		t.Fatalf("expected evidence provenance/storage boundary to be deterministic, got %#v", provenance)
	}
	futureLive := bySummary["A future live app eval flow can refer to one selected instance by stable id."]
	if futureLive == nil || futureLive["recommendedProof"] != "human-auditable" || futureLive["verificationReadiness"] != "needs-alignment" {
		t.Fatalf("expected future live app eval flow claim to need alignment, got %#v", futureLive)
	}
	rankedView := bySummary["Human-facing views may derive a smaller attention set, but they should not hide the full ranked result from agents."]
	if rankedView == nil || rankedView["recommendedProof"] != "deterministic" {
		t.Fatalf("expected ranked result view projection to be deterministic, got %#v", rankedView)
	}
	notFolded := bySummary["It should not be folded into binary/skill responsibility unless the claim is specifically about agent routing."]
	if notFolded == nil || notFolded["recommendedProof"] != "human-auditable" || notFolded["verificationReadiness"] != "needs-alignment" {
		t.Fatalf("expected responsibility boundary note to need alignment, got %#v", notFolded)
	}
	recallBoundary := bySummary["It should prefer recall, preserve the scan boundary, and leave curation to packet-aware agent or maintainer review."]
	if recallBoundary == nil || recallBoundary["recommendedProof"] != "human-auditable" || recallBoundary["verificationReadiness"] != "needs-alignment" {
		t.Fatalf("expected mixed recall and curation claim to need alignment, got %#v", recallBoundary)
	}
	delegatedBudget := bySummary["If the user already delegated autonomous continuation, the skill may proceed within the recorded budget, but the budget still must be written to the packet."]
	if delegatedBudget == nil || delegatedBudget["recommendedProof"] != "human-auditable" || delegatedBudget["verificationReadiness"] != "needs-alignment" {
		t.Fatalf("expected mixed delegated continuation and packet budget claim to need alignment, got %#v", delegatedBudget)
	}
	helperFlags := bySummary["The binary may provide helper flags such as `claim discover --previous <packet> --refresh-plan`, but the public user-level workflow remains `discover`."]
	if helperFlags == nil || helperFlags["recommendedProof"] != "human-auditable" || helperFlags["verificationReadiness"] != "needs-alignment" {
		t.Fatalf("expected optional helper flag workflow claim to need alignment, got %#v", helperFlags)
	}
	reviewPrepare := bySummary["`claim review prepare-input` emits `cautilus.claim_review_input.v1` and records bounded clusters, skipped clusters, and skipped claims, but still does not call an LLM or merge review results."]
	if reviewPrepare == nil || reviewPrepare["recommendedProof"] != "deterministic" || reviewPrepare["verificationReadiness"] != "ready-to-verify" {
		t.Fatalf("expected claim review prepare-input packet contract to be deterministic, got %#v", reviewPrepare)
	}
	skillBranch := bySummary["The remaining proof gap is behavior-level: a maintained dev/skill fixture should show the skill choosing the claim-review branch without treating raw discovery as a finished answer."]
	if skillBranch == nil || skillBranch["recommendedProof"] != "cautilus-eval" || skillBranch["recommendedEvalSurface"] != "dev/skill" {
		t.Fatalf("expected skill branch behavior proof gap to remain dev/skill eval, got %#v", skillBranch)
	}
	scanAnnouncement := bySummary["Before running a first broad scan, the skill should say which entries and depth it will use."]
	if scanAnnouncement == nil || scanAnnouncement["recommendedProof"] != "cautilus-eval" || scanAnnouncement["recommendedEvalSurface"] != "dev/skill" {
		t.Fatalf("expected scan announcement behavior to remain dev/skill eval, got %#v", scanAnnouncement)
	}
	scopeConfirm := bySummary["The skill should ask the user to confirm or adjust that scope."]
	if scopeConfirm == nil || scopeConfirm["recommendedProof"] != "cautilus-eval" || scopeConfirm["recommendedEvalSurface"] != "dev/skill" {
		t.Fatalf("expected scope confirmation behavior to remain dev/skill eval, got %#v", scopeConfirm)
	}
	budgetConfirm := bySummary["The user should confirm or adjust that review budget before the skill launches subagents or other LLM-backed review."]
	if budgetConfirm == nil || budgetConfirm["recommendedProof"] != "cautilus-eval" || budgetConfirm["recommendedEvalSurface"] != "dev/skill" {
		t.Fatalf("expected review budget confirmation behavior to remain dev/skill eval, got %#v", budgetConfirm)
	}
}

func TestDiscoverClaimProofPlanSkipsFutureProofPlaceholders(t *testing.T) {
	repoRoot := t.TempDir()
	mustWriteFile(t, filepath.Join(repoRoot, "README.md"), strings.Join([]string{
		"# Product",
		"",
		"Cautilus writes machine-readable packets first and readable views over those packets.",
		"",
		"## Evidence",
		"",
		"Evidence is pending.",
		"This page should later link report-rendering specs, status-server proof, and packet freshness checks.",
		"Future proof should connect concrete optimize packets and held-out eval results.",
		"Deeper proof should be added by linking a fresh claim packet, a reviewed status summary, and at least one skill-driven review result.",
		"Per-claim evidence pages should later link concrete fixtures and result packets.",
		"",
	}, "\n"))

	plan, err := DiscoverClaimProofPlan(ClaimDiscoveryOptions{RepoRoot: repoRoot})
	if err != nil {
		t.Fatalf("DiscoverClaimProofPlan returned error: %v", err)
	}
	candidates := arrayOrEmpty(plan["claimCandidates"])
	if len(candidates) != 1 {
		t.Fatalf("expected only the product promise candidate, got %#v", candidates)
	}
	summary := stringFromAny(asMap(candidates[0])["summary"])
	if !strings.Contains(summary, "machine-readable packets") {
		t.Fatalf("expected packet-first promise to remain, got %#v", candidates[0])
	}
}

func TestClaimTextBlocksSkipsYamlFrontmatter(t *testing.T) {
	blocks := claimTextBlocks(strings.Join([]string{
		"---",
		"name: cautilus",
		"description: Use when intentful behavior evaluation itself is the task.",
		"---",
		"",
		"The skill owns routing, sequencing, and decision boundaries.",
		"",
	}, "\n"))
	if len(blocks) != 1 {
		t.Fatalf("expected one body block, got %#v", blocks)
	}
	if strings.Contains(blocks[0].text, "description:") || !strings.Contains(blocks[0].text, "The skill owns routing") {
		t.Fatalf("expected frontmatter to be skipped, got %#v", blocks)
	}
}

func TestBuildClaimStatusSummarySummarizesExistingPacket(t *testing.T) {
	repoRoot := filepath.Join("..", "..", "fixtures", "claim-discovery", "tiny-repo")
	plan, err := DiscoverClaimProofPlan(ClaimDiscoveryOptions{RepoRoot: repoRoot})
	if err != nil {
		t.Fatalf("DiscoverClaimProofPlan returned error: %v", err)
	}
	summary, err := BuildClaimStatusSummary(plan, "claims.json")
	if err != nil {
		t.Fatalf("BuildClaimStatusSummary returned error: %v", err)
	}
	if summary["schemaVersion"] != contracts.ClaimStatusSummarySchema {
		t.Fatalf("unexpected schemaVersion: %#v", summary["schemaVersion"])
	}
	if summary["candidateCount"] != 3 {
		t.Fatalf("expected three candidates, got %#v", summary)
	}
	readiness := asMap(summary["reviewReadinessSummary"])
	if readiness["heuristicClaimsReadyForReview"] != 3 {
		t.Fatalf("expected heuristic review readiness, got %#v", readiness)
	}
	boundary := asMap(summary["discoveryBoundary"])
	if boundary["sourceBasis"] != "entry-docs-and-linked-markdown" || !strings.Contains(stringFromAny(boundary["omissionPolicy"]), "outside deterministic discovery scope") {
		t.Fatalf("expected explicit discovery boundary, got %#v", boundary)
	}
	actions := asMap(summary["actionSummary"])
	primaryBuckets := arrayOrEmpty(actions["primaryBuckets"])
	if len(primaryBuckets) == 0 {
		t.Fatalf("expected action summary buckets, got %#v", summary)
	}
	for _, rawBucket := range primaryBuckets {
		bucket := asMap(rawBucket)
		if len(asMap(bucket["byReviewStatus"])) == 0 || len(asMap(bucket["byEvidenceStatus"])) == 0 {
			t.Fatalf("expected every action bucket to include status breakdowns, got %#v", bucket)
		}
	}
	if len(arrayOrEmpty(summary["recommendedNextActions"])) == 0 {
		t.Fatalf("expected recommended next actions, got %#v", summary)
	}
}

func TestBuildClaimStatusSummaryCanIncludeBoundedSampleClaims(t *testing.T) {
	repoRoot := filepath.Join("..", "..", "fixtures", "claim-discovery", "tiny-repo")
	plan, err := DiscoverClaimProofPlan(ClaimDiscoveryOptions{RepoRoot: repoRoot})
	if err != nil {
		t.Fatalf("DiscoverClaimProofPlan returned error: %v", err)
	}
	summary, err := BuildClaimStatusSummaryWithOptions(plan, ClaimStatusSummaryOptions{
		InputPath:    "claims.json",
		SampleClaims: 2,
	})
	if err != nil {
		t.Fatalf("BuildClaimStatusSummaryWithOptions returned error: %v", err)
	}
	samples := arrayOrEmpty(summary["sampleClaims"])
	if len(samples) != 2 {
		t.Fatalf("expected two sample claims, got %#v", samples)
	}
	first := asMap(samples[0])
	if stringFromAny(first["claimId"]) == "" || stringFromAny(first["summary"]) == "" {
		t.Fatalf("expected sample claim identity and summary, got %#v", first)
	}
	if stringFromAny(first["recommendedProof"]) == "" || stringFromAny(first["verificationReadiness"]) == "" {
		t.Fatalf("expected sample claim proof labels, got %#v", first)
	}
	if stringFromAny(first["claimAudience"]) == "" || stringFromAny(first["claimSemanticGroup"]) == "" {
		t.Fatalf("expected sample claim audience and semantic group labels, got %#v", first)
	}
	refs := arrayOrEmpty(first["sourceRefs"])
	if len(refs) != 1 {
		t.Fatalf("expected one bounded source ref, got %#v", first)
	}
	ref := asMap(refs[0])
	if stringFromAny(ref["path"]) == "" || ref["excerpt"] != nil {
		t.Fatalf("expected source path without excerpt bloat, got %#v", ref)
	}
}

func TestBuildClaimStatusSummaryIncludesSatisfiedEvidence(t *testing.T) {
	packet := map[string]any{
		"schemaVersion": contracts.ClaimProofPlanSchema,
		"sourceRoot":    ".",
		"sourceInventory": []any{
			map[string]any{"path": "README.md", "kind": "markdown", "status": "read", "depth": 0},
		},
		"claimCandidates": []any{
			map[string]any{
				"claimId":                "claim-readme-md-1",
				"claimFingerprint":       "sha256:satisfied",
				"summary":                "The skill flow is already covered.",
				"recommendedProof":       "cautilus-eval",
				"recommendedEvalSurface": "dev/skill",
				"verificationReadiness":  "ready-to-verify",
				"evidenceStatus":         "satisfied",
				"reviewStatus":           "agent-reviewed",
				"lifecycle":              "new",
				"groupHints":             []any{"cautilus-eval"},
				"evidenceRefs": []any{map[string]any{
					"path":             ".cautilus/claims/evidence.json",
					"kind":             "cautilus-claim-evidence-bundle",
					"matchKind":        "verified",
					"contentHash":      "sha256:test",
					"supportsClaimIds": []any{"claim-readme-md-1"},
				}},
				"sourceRefs": []any{map[string]any{"path": "README.md", "line": 1, "excerpt": "The skill flow is already covered."}},
			},
		},
	}
	summary, err := BuildClaimStatusSummary(packet, "claims.json")
	if err != nil {
		t.Fatalf("BuildClaimStatusSummary returned error: %v", err)
	}
	evidence := asMap(summary["evidenceSatisfaction"])
	if evidence["satisfiedClaimCount"] != 1 {
		t.Fatalf("expected one satisfied claim, got %#v", evidence)
	}
	claims := arrayOrEmpty(evidence["satisfiedClaims"])
	if len(claims) != 1 {
		t.Fatalf("expected one satisfied claim entry, got %#v", claims)
	}
	first := asMap(claims[0])
	if first["claimId"] != "claim-readme-md-1" || first["evidenceRefCount"] != 1 {
		t.Fatalf("expected satisfied evidence context, got %#v", first)
	}
	actions := asMap(summary["actionSummary"])
	buckets := arrayOrEmpty(actions["primaryBuckets"])
	if len(buckets) != 1 {
		t.Fatalf("expected one primary action bucket, got %#v", actions)
	}
	bucket := asMap(buckets[0])
	if bucket["id"] != "already-satisfied" || bucket["count"] != 1 {
		t.Fatalf("expected satisfied claim action bucket, got %#v", bucket)
	}
	if asMap(bucket["byReviewStatus"])["agent-reviewed"] != 1 || asMap(bucket["byEvidenceStatus"])["satisfied"] != 1 {
		t.Fatalf("expected action bucket status breakdowns, got %#v", bucket)
	}
}

func TestBuildClaimReviewInputClustersAndSkipsDeterministically(t *testing.T) {
	repoRoot := filepath.Join("..", "..", "fixtures", "claim-discovery", "tiny-repo")
	plan, err := DiscoverClaimProofPlan(ClaimDiscoveryOptions{RepoRoot: repoRoot})
	if err != nil {
		t.Fatalf("DiscoverClaimProofPlan returned error: %v", err)
	}
	reviewInput, err := BuildClaimReviewInput(plan, ClaimReviewInputOptions{
		InputPath:           "claims.json",
		MaxClusters:         2,
		MaxClaimsPerCluster: 1,
		ExcerptChars:        20,
	})
	if err != nil {
		t.Fatalf("BuildClaimReviewInput returned error: %v", err)
	}
	if reviewInput["schemaVersion"] != contracts.ClaimReviewInputSchema {
		t.Fatalf("unexpected schemaVersion: %#v", reviewInput["schemaVersion"])
	}
	clusters := arrayOrEmpty(reviewInput["clusters"])
	if len(clusters) != 2 {
		t.Fatalf("expected two rendered clusters, got %#v", clusters)
	}
	skipped := arrayOrEmpty(reviewInput["skippedClusters"])
	if len(skipped) == 0 {
		t.Fatalf("expected at least one skipped cluster from max-clusters, got %#v", reviewInput)
	}
	first := asMap(clusters[0])
	candidates := arrayOrEmpty(first["candidates"])
	if len(candidates) != 1 {
		t.Fatalf("expected max one candidate in first cluster, got %#v", first)
	}
	candidate := asMap(candidates[0])
	labels := asMap(candidate["currentLabels"])
	if labels["reviewStatus"] != "heuristic" {
		t.Fatalf("expected current labels to preserve review status, got %#v", candidate)
	}
	if stringFromAny(labels["claimSemanticGroup"]) == "" {
		t.Fatalf("expected current labels to preserve semantic group, got %#v", candidate)
	}
}

func TestBuildClaimReviewInputSkipsSatisfiedClaims(t *testing.T) {
	packet := map[string]any{
		"schemaVersion": contracts.ClaimProofPlanSchema,
		"sourceRoot":    ".",
		"sourceInventory": []any{
			map[string]any{"path": "README.md", "kind": "markdown", "status": "read", "depth": 0},
		},
		"claimCandidates": []any{
			map[string]any{
				"claimId":                "claim-readme-md-1",
				"claimFingerprint":       "sha256:satisfied",
				"summary":                "The skill flow is already covered.",
				"recommendedProof":       "cautilus-eval",
				"recommendedEvalSurface": "dev/skill",
				"verificationReadiness":  "ready-to-verify",
				"evidenceStatus":         "satisfied",
				"reviewStatus":           "agent-reviewed",
				"lifecycle":              "new",
				"groupHints":             []any{"cautilus-eval"},
				"evidenceRefs": []any{map[string]any{
					"path":             ".cautilus/claims/evidence.json",
					"kind":             "cautilus-claim-evidence-bundle",
					"matchKind":        "verified",
					"contentHash":      "sha256:test",
					"supportsClaimIds": []any{"claim-readme-md-1"},
				}},
				"sourceRefs": []any{map[string]any{"path": "README.md", "line": 1, "excerpt": "The skill flow is already covered."}},
			},
			map[string]any{
				"claimId":                "claim-readme-md-2",
				"claimFingerprint":       "sha256:unknown",
				"summary":                "The skill flow still needs review.",
				"recommendedProof":       "cautilus-eval",
				"recommendedEvalSurface": "dev/skill",
				"verificationReadiness":  "ready-to-verify",
				"evidenceStatus":         "unknown",
				"reviewStatus":           "heuristic",
				"lifecycle":              "new",
				"groupHints":             []any{"cautilus-eval"},
				"evidenceRefs":           []any{},
				"sourceRefs":             []any{map[string]any{"path": "README.md", "line": 2, "excerpt": "The skill flow still needs review."}},
			},
			map[string]any{
				"claimId":                "claim-readme-md-3",
				"claimFingerprint":       "sha256:reviewed",
				"summary":                "The skill flow was already reviewed and needs proof.",
				"recommendedProof":       "cautilus-eval",
				"recommendedEvalSurface": "dev/skill",
				"verificationReadiness":  "ready-to-verify",
				"evidenceStatus":         "unknown",
				"reviewStatus":           "agent-reviewed",
				"lifecycle":              "new",
				"groupHints":             []any{"cautilus-eval"},
				"evidenceRefs":           []any{},
				"sourceRefs":             []any{map[string]any{"path": "README.md", "line": 3, "excerpt": "The skill flow was already reviewed and needs proof."}},
			},
		},
	}
	reviewInput, err := BuildClaimReviewInput(packet, ClaimReviewInputOptions{
		InputPath:           "claims.json",
		MaxClusters:         10,
		MaxClaimsPerCluster: 10,
	})
	if err != nil {
		t.Fatalf("BuildClaimReviewInput returned error: %v", err)
	}
	clusters := arrayOrEmpty(reviewInput["clusters"])
	if len(clusters) != 1 {
		t.Fatalf("expected one review cluster for unsatisfied claim only, got %#v", clusters)
	}
	candidates := arrayOrEmpty(asMap(clusters[0])["candidates"])
	if len(candidates) != 1 || asMap(candidates[0])["claimId"] != "claim-readme-md-2" {
		t.Fatalf("expected only unknown claim in review cluster, got %#v", candidates)
	}
	skippedClaims := arrayOrEmpty(reviewInput["skippedClaims"])
	if len(skippedClaims) != 2 {
		t.Fatalf("expected two skipped claims, got %#v", reviewInput)
	}
	skippedByID := map[string]map[string]any{}
	for _, raw := range skippedClaims {
		entry := asMap(raw)
		skippedByID[stringFromAny(entry["claimId"])] = entry
	}
	skipped := skippedByID["claim-readme-md-1"]
	if skipped["reason"] != "already-satisfied" {
		t.Fatalf("expected already-satisfied skip entry, got %#v", skipped)
	}
	if len(arrayOrEmpty(skipped["evidenceRefs"])) != 1 {
		t.Fatalf("expected skipped satisfied claim to retain evidence refs, got %#v", skipped)
	}
	reviewed := skippedByID["claim-readme-md-3"]
	if reviewed["reason"] != "already-reviewed" {
		t.Fatalf("expected already-reviewed skip entry, got %#v", reviewed)
	}
	policy := asMap(reviewInput["selectionPolicy"])
	if statuses := stringArrayOrEmpty(policy["excludesEvidenceStatus"]); !containsString(statuses, "satisfied") {
		t.Fatalf("expected selection policy to document satisfied exclusion, got %#v", policy)
	}
}

func TestBuildClaimReviewInputCanFocusActionBucket(t *testing.T) {
	packet := map[string]any{
		"schemaVersion": contracts.ClaimProofPlanSchema,
		"sourceRoot":    ".",
		"sourceInventory": []any{
			map[string]any{"path": "README.md", "kind": "markdown", "status": "read", "depth": 0},
		},
		"claimCandidates": []any{
			map[string]any{
				"claimId":               "claim-readme-md-1",
				"claimFingerprint":      "sha256:deterministic",
				"summary":               "The CLI emits JSON.",
				"recommendedProof":      "deterministic",
				"verificationReadiness": "ready-to-verify",
				"evidenceStatus":        "unknown",
				"reviewStatus":          "heuristic",
				"lifecycle":             "new",
				"groupHints":            []any{"deterministic"},
				"evidenceRefs":          []any{},
				"sourceRefs":            []any{map[string]any{"path": "README.md", "line": 1, "excerpt": "The CLI emits JSON."}},
			},
			map[string]any{
				"claimId":               "claim-readme-md-2",
				"claimFingerprint":      "sha256:alignment",
				"summary":               "Docs and adapters need alignment before proof.",
				"recommendedProof":      "human-auditable",
				"verificationReadiness": "needs-alignment",
				"evidenceStatus":        "unknown",
				"reviewStatus":          "heuristic",
				"lifecycle":             "new",
				"groupHints":            []any{"alignment-work"},
				"evidenceRefs":          []any{},
				"sourceRefs":            []any{map[string]any{"path": "README.md", "line": 2, "excerpt": "Docs and adapters need alignment before proof."}},
			},
		},
	}
	reviewInput, err := BuildClaimReviewInput(packet, ClaimReviewInputOptions{
		InputPath:           "claims.json",
		ActionBucket:        "human-align-surfaces",
		MaxClusters:         10,
		MaxClaimsPerCluster: 10,
	})
	if err != nil {
		t.Fatalf("BuildClaimReviewInput returned error: %v", err)
	}
	budget := asMap(reviewInput["reviewBudget"])
	if budget["actionBucket"] != "human-align-surfaces" {
		t.Fatalf("expected action bucket in review budget, got %#v", budget)
	}
	clusters := arrayOrEmpty(reviewInput["clusters"])
	if len(clusters) != 1 {
		t.Fatalf("expected one focused cluster, got %#v", clusters)
	}
	candidates := arrayOrEmpty(asMap(clusters[0])["candidates"])
	if len(candidates) != 1 {
		t.Fatalf("expected one focused candidate, got %#v", candidates)
	}
	candidate := asMap(candidates[0])
	if candidate["claimId"] != "claim-readme-md-2" || candidate["actionBucket"] != "human-align-surfaces" {
		t.Fatalf("expected human alignment candidate with action bucket, got %#v", candidate)
	}
	skipped := arrayOrEmpty(reviewInput["skippedClaims"])
	if len(skipped) != 1 || asMap(skipped[0])["reason"] != "action-bucket-mismatch" {
		t.Fatalf("expected action-bucket mismatch skip, got %#v", skipped)
	}
}

func TestBuildClaimReviewInputIncludesPossibleEvidenceRefs(t *testing.T) {
	repoRoot := t.TempDir()
	evidenceDir := filepath.Join(repoRoot, ".cautilus", "claims")
	if err := os.MkdirAll(evidenceDir, 0o755); err != nil {
		t.Fatalf("MkdirAll evidence dir returned error: %v", err)
	}
	evidenceBundle := map[string]any{
		"schemaVersion":      contracts.ClaimEvidenceBundleSchema,
		"bundleId":           "evidence-demo",
		"createdForClaimIds": []any{"claim-readme-md-1"},
		"summary":            "A checked-in bundle may support the claim after review.",
	}
	payload, err := json.MarshalIndent(evidenceBundle, "", "  ")
	if err != nil {
		t.Fatalf("MarshalIndent evidence bundle returned error: %v", err)
	}
	if err := os.WriteFile(filepath.Join(evidenceDir, "evidence-demo.json"), payload, 0o644); err != nil {
		t.Fatalf("WriteFile evidence bundle returned error: %v", err)
	}
	packet := map[string]any{
		"schemaVersion": contracts.ClaimProofPlanSchema,
		"sourceRoot":    ".",
		"effectiveScanScope": map[string]any{
			"evidenceRoots": []any{".cautilus/claims"},
		},
		"sourceInventory": []any{
			map[string]any{"path": "README.md", "kind": "markdown", "status": "read", "depth": 0},
		},
		"claimCandidates": []any{
			map[string]any{
				"claimId":                "claim-readme-md-1",
				"claimFingerprint":       "sha256:possible",
				"summary":                "The skill flow might already have evidence.",
				"recommendedProof":       "cautilus-eval",
				"recommendedEvalSurface": "dev/skill",
				"verificationReadiness":  "ready-to-verify",
				"evidenceStatus":         "unknown",
				"reviewStatus":           "heuristic",
				"lifecycle":              "new",
				"groupHints":             []any{"cautilus-eval"},
				"evidenceRefs":           []any{},
				"sourceRefs":             []any{map[string]any{"path": "README.md", "line": 1, "excerpt": "The skill flow might already have evidence."}},
			},
		},
	}
	reviewInput, err := BuildClaimReviewInput(packet, ClaimReviewInputOptions{
		InputPath:           "claims.json",
		RepoRoot:            repoRoot,
		MaxClusters:         1,
		MaxClaimsPerCluster: 1,
	})
	if err != nil {
		t.Fatalf("BuildClaimReviewInput returned error: %v", err)
	}
	preflight := asMap(reviewInput["evidencePreflight"])
	if preflight["status"] != "completed" || preflight["matchedRefCount"] != 1 {
		t.Fatalf("expected completed evidence preflight with one match, got %#v", preflight)
	}
	cluster := asMap(arrayOrEmpty(reviewInput["clusters"])[0])
	candidate := asMap(arrayOrEmpty(cluster["candidates"])[0])
	refs := arrayOrEmpty(candidate["possibleEvidenceRefs"])
	if len(refs) != 1 {
		t.Fatalf("expected one possible evidence ref, got %#v", candidate)
	}
	ref := asMap(refs[0])
	if ref["matchKind"] != "possible" || len(arrayOrEmpty(ref["supportsClaimIds"])) != 1 {
		t.Fatalf("expected possible evidence ref shape, got %#v", ref)
	}
	labels := asMap(candidate["currentLabels"])
	if labels["evidenceStatus"] != "unknown" {
		t.Fatalf("possible evidence must not satisfy the claim, got %#v", labels)
	}
}

func TestBuildClaimReviewInputSeparatesAudienceAndSemanticGroup(t *testing.T) {
	repoRoot := t.TempDir()
	mustWriteFile(t, filepath.Join(repoRoot, ".agents", "cautilus-adapter.yaml"), strings.Join([]string{
		"version: 1",
		"repo: demo",
		"claim_discovery:",
		"  semantic_groups:",
		"    - label: Claim discovery and review",
		"      terms:",
		"        - claim discovery",
		"    - label: Quality gates",
		"      terms:",
		"        - verify",
		"",
	}, "\n"))
	mustWriteFile(t, filepath.Join(repoRoot, "README.md"), strings.Join([]string{
		"# Product",
		"",
		"Cautilus claim discovery workflow must prepare review input for users.",
		"",
	}, "\n"))
	mustWriteFile(t, filepath.Join(repoRoot, "AGENTS.md"), strings.Join([]string{
		"# Agents",
		"",
		"The verify workflow must run before stopping.",
		"",
	}, "\n"))

	plan, err := DiscoverClaimProofPlan(ClaimDiscoveryOptions{RepoRoot: repoRoot})
	if err != nil {
		t.Fatalf("DiscoverClaimProofPlan returned error: %v", err)
	}
	reviewInput, err := BuildClaimReviewInput(plan, ClaimReviewInputOptions{
		InputPath:           "claims.json",
		MaxClusters:         10,
		MaxClaimsPerCluster: 10,
	})
	if err != nil {
		t.Fatalf("BuildClaimReviewInput returned error: %v", err)
	}
	clusters := arrayOrEmpty(reviewInput["clusters"])
	if len(clusters) < 2 {
		t.Fatalf("expected separate audience or semantic clusters, got %#v", clusters)
	}
	seenAudiences := map[string]bool{}
	seenSemanticGroups := map[string]bool{}
	for _, raw := range clusters {
		cluster := asMap(raw)
		seenAudiences[stringFromAny(cluster["claimAudience"])] = true
		seenSemanticGroups[stringFromAny(cluster["claimSemanticGroup"])] = true
	}
	if !seenAudiences["user"] || !seenAudiences["developer"] {
		t.Fatalf("expected review clusters to preserve claim audiences, got %#v", clusters)
	}
	if !seenSemanticGroups["Claim discovery and review"] || !seenSemanticGroups["Quality gates"] {
		t.Fatalf("expected review clusters to preserve semantic groups, got %#v", clusters)
	}
}

func TestApplyClaimReviewResultUpdatesLabelsWithVerifiedEvidence(t *testing.T) {
	repoRoot := filepath.Join("..", "..", "fixtures", "claim-discovery", "tiny-repo")
	plan, err := DiscoverClaimProofPlan(ClaimDiscoveryOptions{RepoRoot: repoRoot})
	if err != nil {
		t.Fatalf("DiscoverClaimProofPlan returned error: %v", err)
	}
	firstClaim := asMap(arrayOrEmpty(plan["claimCandidates"])[0])
	claimID := stringFromAny(firstClaim["claimId"])
	reviewResult := map[string]any{
		"schemaVersion": contracts.ClaimReviewResultSchema,
		"reviewRun": map[string]any{
			"reviewer": "fixture-reviewer",
		},
		"clusterResults": []any{
			map[string]any{
				"clusterId": "cluster-fixture",
				"claimUpdates": []any{
					map[string]any{
						"claimId":              claimID,
						"reviewStatus":         "agent-reviewed",
						"evidenceStatus":       "satisfied",
						"evidenceStatusReason": "Fixture review found direct evidence.",
						"evidenceRefs": []any{
							map[string]any{
								"refId":            "evidence-fixture-1",
								"kind":             "test",
								"path":             "internal/runtime/claim_discovery_test.go",
								"matchKind":        "direct",
								"contentHash":      "sha256:test",
								"supportsClaimIds": []any{claimID},
							},
						},
					},
				},
			},
		},
	}
	updated, err := ApplyClaimReviewResult(plan, reviewResult, ClaimReviewApplyOptions{
		ClaimsPath:       "claims.json",
		ReviewResultPath: "review-result.json",
	})
	if err != nil {
		t.Fatalf("ApplyClaimReviewResult returned error: %v", err)
	}
	candidate := asMap(arrayOrEmpty(updated["claimCandidates"])[0])
	if candidate["reviewStatus"] != "agent-reviewed" || candidate["evidenceStatus"] != "satisfied" {
		t.Fatalf("expected reviewed satisfied candidate, got %#v", candidate)
	}
	application := asMap(updated["reviewApplication"])
	if application["appliedUpdateCount"] != 1 {
		t.Fatalf("expected one applied update, got %#v", application)
	}
	if len(arrayOrEmpty(updated["reviewRuns"])) != 1 {
		t.Fatalf("expected review run provenance, got %#v", updated["reviewRuns"])
	}
}

func TestApplyClaimReviewResultSkipsEmptyReviewRunProvenance(t *testing.T) {
	repoRoot := filepath.Join("..", "..", "fixtures", "claim-discovery", "tiny-repo")
	plan, err := DiscoverClaimProofPlan(ClaimDiscoveryOptions{RepoRoot: repoRoot})
	if err != nil {
		t.Fatalf("DiscoverClaimProofPlan returned error: %v", err)
	}
	firstClaim := asMap(arrayOrEmpty(plan["claimCandidates"])[0])
	claimID := stringFromAny(firstClaim["claimId"])
	reviewResult := map[string]any{
		"schemaVersion": contracts.ClaimReviewResultSchema,
		"clusterResults": []any{
			map[string]any{
				"clusterId": "cluster-fixture",
				"claimUpdates": []any{
					map[string]any{
						"claimId":          claimID,
						"reviewStatus":     "agent-reviewed",
						"evidenceStatus":   "unknown",
						"recommendedProof": "deterministic",
					},
				},
			},
		},
	}
	updated, err := ApplyClaimReviewResult(plan, reviewResult, ClaimReviewApplyOptions{
		ClaimsPath:       "claims.json",
		ReviewResultPath: "review-result.json",
	})
	if err != nil {
		t.Fatalf("ApplyClaimReviewResult returned error: %v", err)
	}
	if runs := arrayOrEmpty(updated["reviewRuns"]); len(runs) != 0 {
		t.Fatalf("expected empty review-run provenance to be omitted, got %#v", runs)
	}
}

func TestApplyClaimReviewResultDedupesReviewRunProvenance(t *testing.T) {
	repoRoot := filepath.Join("..", "..", "fixtures", "claim-discovery", "tiny-repo")
	plan, err := DiscoverClaimProofPlan(ClaimDiscoveryOptions{RepoRoot: repoRoot})
	if err != nil {
		t.Fatalf("DiscoverClaimProofPlan returned error: %v", err)
	}
	claimID := stringFromAny(asMap(arrayOrEmpty(plan["claimCandidates"])[0])["claimId"])
	plan["reviewRuns"] = []any{
		map[string]any{
			"schemaVersion": contracts.ClaimReviewResultSchema,
			"reviewRun":     map[string]any{"reviewer": "fixture-reviewer"},
			"clusterCount":  1,
		},
		map[string]any{
			"schemaVersion": contracts.ClaimReviewResultSchema,
			"reviewRun":     map[string]any{},
			"clusterCount":  1,
		},
	}
	reviewResult := map[string]any{
		"schemaVersion": contracts.ClaimReviewResultSchema,
		"reviewRun":     map[string]any{"reviewer": "fixture-reviewer"},
		"clusterResults": []any{
			map[string]any{
				"clusterId": "cluster-fixture",
				"claimUpdates": []any{
					map[string]any{
						"claimId":        claimID,
						"reviewStatus":   "agent-reviewed",
						"evidenceStatus": "unknown",
					},
				},
			},
		},
	}
	updated, err := ApplyClaimReviewResult(plan, reviewResult, ClaimReviewApplyOptions{
		ClaimsPath:       "claims.json",
		ReviewResultPath: "review-result.json",
	})
	if err != nil {
		t.Fatalf("ApplyClaimReviewResult returned error: %v", err)
	}
	runs := arrayOrEmpty(updated["reviewRuns"])
	if len(runs) != 1 {
		t.Fatalf("expected duplicate and empty review runs to normalize to one, got %#v", runs)
	}
}

func TestApplyClaimReviewResultDoesNotDowngradeSatisfiedEvidenceWithOlderUnknownReview(t *testing.T) {
	repoRoot := filepath.Join("..", "..", "fixtures", "claim-discovery", "tiny-repo")
	plan, err := DiscoverClaimProofPlan(ClaimDiscoveryOptions{RepoRoot: repoRoot})
	if err != nil {
		t.Fatalf("DiscoverClaimProofPlan returned error: %v", err)
	}
	claimID := stringFromAny(asMap(arrayOrEmpty(plan["claimCandidates"])[0])["claimId"])
	satisfiedResult := map[string]any{
		"schemaVersion": contracts.ClaimReviewResultSchema,
		"clusterResults": []any{
			map[string]any{
				"clusterId": "cluster-evidence",
				"claimUpdates": []any{
					map[string]any{
						"claimId":              claimID,
						"reviewStatus":         "agent-reviewed",
						"evidenceStatus":       "satisfied",
						"evidenceStatusReason": "Verified by checked-in evidence.",
						"nextAction":           "Keep evidence current.",
						"unresolvedQuestions":  []any{},
						"evidenceRefs": []any{
							map[string]any{
								"kind":             "test",
								"path":             "internal/runtime/claim_discovery_test.go",
								"matchKind":        "verified",
								"contentHash":      "sha256:test",
								"supportsClaimIds": []any{claimID},
							},
						},
					},
				},
			},
		},
	}
	reviewed, err := ApplyClaimReviewResult(plan, satisfiedResult, ClaimReviewApplyOptions{
		ClaimsPath:       "claims.json",
		ReviewResultPath: "review-result-satisfied.json",
	})
	if err != nil {
		t.Fatalf("ApplyClaimReviewResult satisfied returned error: %v", err)
	}
	unknownResult := map[string]any{
		"schemaVersion": contracts.ClaimReviewResultSchema,
		"clusterResults": []any{
			map[string]any{
				"clusterId": "cluster-older-review",
				"claimUpdates": []any{
					map[string]any{
						"claimId":              claimID,
						"reviewStatus":         "agent-reviewed",
						"evidenceStatus":       "unknown",
						"evidenceStatusReason": "This earlier review did not inspect evidence.",
						"nextAction":           "Attach evidence later.",
						"unresolvedQuestions":  []any{"Which command families are enough?"},
					},
				},
			},
		},
	}
	updated, err := ApplyClaimReviewResult(reviewed, unknownResult, ClaimReviewApplyOptions{
		ClaimsPath:       "reviewed-claims.json",
		ReviewResultPath: "review-result-unknown.json",
	})
	if err != nil {
		t.Fatalf("ApplyClaimReviewResult unknown returned error: %v", err)
	}
	candidate := asMap(arrayOrEmpty(updated["claimCandidates"])[0])
	if candidate["evidenceStatus"] != "satisfied" {
		t.Fatalf("expected satisfied evidence to survive older unknown review, got %#v", candidate)
	}
	if candidate["evidenceStatusReason"] != "Verified by checked-in evidence." {
		t.Fatalf("expected satisfied evidence reason to survive, got %#v", candidate)
	}
	if candidate["nextAction"] != "Keep evidence current." {
		t.Fatalf("expected satisfied next action to survive, got %#v", candidate)
	}
	if questions := arrayOrEmpty(candidate["unresolvedQuestions"]); len(questions) != 0 {
		t.Fatalf("expected satisfied unresolved questions to survive, got %#v", candidate)
	}
}

func TestApplyClaimReviewResultAllowsStaleToRevokeSatisfiedEvidence(t *testing.T) {
	repoRoot := filepath.Join("..", "..", "fixtures", "claim-discovery", "tiny-repo")
	plan, err := DiscoverClaimProofPlan(ClaimDiscoveryOptions{RepoRoot: repoRoot})
	if err != nil {
		t.Fatalf("DiscoverClaimProofPlan returned error: %v", err)
	}
	claimID := stringFromAny(asMap(arrayOrEmpty(plan["claimCandidates"])[0])["claimId"])
	satisfiedResult := map[string]any{
		"schemaVersion": contracts.ClaimReviewResultSchema,
		"clusterResults": []any{
			map[string]any{
				"clusterId": "cluster-evidence",
				"claimUpdates": []any{
					map[string]any{
						"claimId":              claimID,
						"reviewStatus":         "agent-reviewed",
						"evidenceStatus":       "satisfied",
						"evidenceStatusReason": "Verified by checked-in evidence.",
						"nextAction":           "Keep evidence current.",
						"evidenceRefs": []any{
							map[string]any{
								"kind":             "test",
								"path":             "internal/runtime/claim_discovery_test.go",
								"matchKind":        "verified",
								"contentHash":      "sha256:test",
								"supportsClaimIds": []any{claimID},
							},
						},
					},
				},
			},
		},
	}
	reviewed, err := ApplyClaimReviewResult(plan, satisfiedResult, ClaimReviewApplyOptions{
		ClaimsPath:       "claims.json",
		ReviewResultPath: "review-result-satisfied.json",
	})
	if err != nil {
		t.Fatalf("ApplyClaimReviewResult satisfied returned error: %v", err)
	}
	staleResult := map[string]any{
		"schemaVersion": contracts.ClaimReviewResultSchema,
		"clusterResults": []any{
			map[string]any{
				"clusterId": "cluster-stale-review",
				"claimUpdates": []any{
					map[string]any{
						"claimId":              claimID,
						"reviewStatus":         "agent-reviewed",
						"evidenceStatus":       "stale",
						"evidenceStatusReason": "Evidence file hash changed.",
						"nextAction":           "Refresh evidence.",
					},
				},
			},
		},
	}
	updated, err := ApplyClaimReviewResult(reviewed, staleResult, ClaimReviewApplyOptions{
		ClaimsPath:       "reviewed-claims.json",
		ReviewResultPath: "review-result-stale.json",
	})
	if err != nil {
		t.Fatalf("ApplyClaimReviewResult stale returned error: %v", err)
	}
	candidate := asMap(arrayOrEmpty(updated["claimCandidates"])[0])
	if candidate["evidenceStatus"] != "stale" {
		t.Fatalf("expected stale evidence update to revoke satisfied state, got %#v", candidate)
	}
	if candidate["evidenceStatusReason"] != "Evidence file hash changed." {
		t.Fatalf("expected stale evidence reason to apply, got %#v", candidate)
	}
	if candidate["nextAction"] != "Refresh evidence." {
		t.Fatalf("expected stale next action to apply, got %#v", candidate)
	}
}

func TestApplyClaimReviewResultRejectsSatisfiedWithoutVerifiedEvidence(t *testing.T) {
	repoRoot := filepath.Join("..", "..", "fixtures", "claim-discovery", "tiny-repo")
	plan, err := DiscoverClaimProofPlan(ClaimDiscoveryOptions{RepoRoot: repoRoot})
	if err != nil {
		t.Fatalf("DiscoverClaimProofPlan returned error: %v", err)
	}
	claimID := stringFromAny(asMap(arrayOrEmpty(plan["claimCandidates"])[0])["claimId"])
	reviewResult := map[string]any{
		"schemaVersion": contracts.ClaimReviewResultSchema,
		"clusterResults": []any{
			map[string]any{
				"clusterId": "cluster-fixture",
				"claimUpdates": []any{
					map[string]any{
						"claimId":        claimID,
						"reviewStatus":   "agent-reviewed",
						"evidenceStatus": "satisfied",
						"evidenceRefs": []any{
							map[string]any{
								"kind":             "test",
								"path":             "internal/runtime/claim_discovery_test.go",
								"matchKind":        "possible",
								"contentHash":      "sha256:test",
								"supportsClaimIds": []any{claimID},
							},
						},
					},
				},
			},
		},
	}
	_, err = ApplyClaimReviewResult(plan, reviewResult, ClaimReviewApplyOptions{})
	if err == nil || !strings.Contains(err.Error(), "evidenceStatus satisfied requires") {
		t.Fatalf("expected satisfied evidence validation error, got %v", err)
	}
}

func TestApplyClaimReviewResultCanClearRecommendedEvalSurface(t *testing.T) {
	repoRoot := filepath.Join("..", "..", "fixtures", "claim-discovery", "tiny-repo")
	plan, err := DiscoverClaimProofPlan(ClaimDiscoveryOptions{RepoRoot: repoRoot})
	if err != nil {
		t.Fatalf("DiscoverClaimProofPlan returned error: %v", err)
	}
	claimID := "claim-agents-md-3"
	reviewResult := map[string]any{
		"schemaVersion": contracts.ClaimReviewResultSchema,
		"clusterResults": []any{
			map[string]any{
				"clusterId": "cluster-fixture",
				"claimUpdates": []any{
					map[string]any{
						"claimId":                claimID,
						"reviewStatus":           "agent-reviewed",
						"evidenceStatus":         "unknown",
						"recommendedProof":       "deterministic",
						"verificationReadiness":  "ready-to-verify",
						"recommendedEvalSurface": nil,
					},
				},
			},
		},
	}
	updated, err := ApplyClaimReviewResult(plan, reviewResult, ClaimReviewApplyOptions{
		ClaimsPath:       "claims.json",
		ReviewResultPath: "review-result.json",
	})
	if err != nil {
		t.Fatalf("ApplyClaimReviewResult returned error: %v", err)
	}
	var updatedClaim map[string]any
	for _, raw := range arrayOrEmpty(updated["claimCandidates"]) {
		candidate := asMap(raw)
		if stringFromAny(candidate["claimId"]) == claimID {
			updatedClaim = candidate
			break
		}
	}
	if updatedClaim == nil {
		t.Fatalf("missing updated claim in %#v", updated)
	}
	if _, exists := updatedClaim["recommendedEvalSurface"]; exists {
		t.Fatalf("expected recommendedEvalSurface to be cleared, got %#v", updatedClaim)
	}
	if updatedClaim["recommendedProof"] != "deterministic" {
		t.Fatalf("expected recommendedProof to follow deterministic review update, got %#v", updatedClaim)
	}
}

func TestApplyClaimReviewResultCanUpdateClaimAudience(t *testing.T) {
	repoRoot := filepath.Join("..", "..", "fixtures", "claim-discovery", "tiny-repo")
	plan, err := DiscoverClaimProofPlan(ClaimDiscoveryOptions{RepoRoot: repoRoot})
	if err != nil {
		t.Fatalf("DiscoverClaimProofPlan returned error: %v", err)
	}
	claimID := "claim-agents-md-3"
	reviewResult := map[string]any{
		"schemaVersion": contracts.ClaimReviewResultSchema,
		"clusterResults": []any{
			map[string]any{
				"clusterId": "cluster-fixture",
				"claimUpdates": []any{
					map[string]any{
						"claimId":          claimID,
						"reviewStatus":     "human-reviewed",
						"claimAudience":    "user",
						"recommendedProof": "deterministic",
						"nextAction":       "Keep as an operator-facing public contract.",
					},
				},
			},
		},
	}
	updated, err := ApplyClaimReviewResult(plan, reviewResult, ClaimReviewApplyOptions{
		ClaimsPath:       "claims.json",
		ReviewResultPath: "review-result.json",
	})
	if err != nil {
		t.Fatalf("ApplyClaimReviewResult returned error: %v", err)
	}
	var updatedClaim map[string]any
	for _, raw := range arrayOrEmpty(updated["claimCandidates"]) {
		candidate := asMap(raw)
		if stringFromAny(candidate["claimId"]) == claimID {
			updatedClaim = candidate
			break
		}
	}
	if updatedClaim == nil {
		t.Fatalf("missing updated claim in %#v", updated)
	}
	if updatedClaim["claimAudience"] != "user" || updatedClaim["claimAudienceSource"] != "review-result" {
		t.Fatalf("expected review result to update audience, got %#v", updatedClaim)
	}
	hints := stringArrayOrEmpty(updatedClaim["groupHints"])
	if !containsString(hints, "audience:user") || !containsString(hints, "deterministic") {
		t.Fatalf("expected group hints to follow reviewed audience and proof, got %#v", hints)
	}
	if containsString(hints, "audience:developer") || containsString(hints, "human-auditable") || containsString(hints, "cautilus-eval") {
		t.Fatalf("expected stale derived group hints to be removed, got %#v", hints)
	}
	application := asMap(updated["reviewApplication"])
	applied := stringArrayOrEmpty(asMap(arrayOrEmpty(application["appliedUpdates"])[0])["appliedFields"])
	if !containsString(applied, "claimAudience") || !containsString(applied, "claimAudienceSource") || !containsString(applied, "groupHints") {
		t.Fatalf("expected applied audience fields, got %#v", applied)
	}
}

func TestApplyClaimReviewResultCanUpdateWhyThisLayer(t *testing.T) {
	repoRoot := filepath.Join("..", "..", "fixtures", "claim-discovery", "tiny-repo")
	plan, err := DiscoverClaimProofPlan(ClaimDiscoveryOptions{RepoRoot: repoRoot})
	if err != nil {
		t.Fatalf("DiscoverClaimProofPlan returned error: %v", err)
	}
	claimID := stringFromAny(asMap(arrayOrEmpty(plan["claimCandidates"])[0])["claimId"])
	reviewResult := map[string]any{
		"schemaVersion": contracts.ClaimReviewResultSchema,
		"clusterResults": []any{
			map[string]any{
				"clusterId": "cluster-reclassified",
				"claimUpdates": []any{
					map[string]any{
						"claimId":               claimID,
						"recommendedProof":      "human-auditable",
						"verificationReadiness": "blocked",
						"whyThisLayer":          "The claim is a broad operating principle and must be split before proof.",
						"evidenceStatus":        "unknown",
						"evidenceStatusReason":  "No direct evidence should be attached before decomposition.",
						"nextAction":            "Split into concrete checkable subclaims.",
						"unresolvedQuestions":   []any{"Which subclaims are concrete enough?"},
					},
				},
			},
		},
	}
	updated, err := ApplyClaimReviewResult(plan, reviewResult, ClaimReviewApplyOptions{
		ClaimsPath:       "claims.json",
		ReviewResultPath: "review-result-reclassified.json",
	})
	if err != nil {
		t.Fatalf("ApplyClaimReviewResult returned error: %v", err)
	}
	candidate := asMap(arrayOrEmpty(updated["claimCandidates"])[0])
	if candidate["recommendedProof"] != "human-auditable" || candidate["verificationReadiness"] != "blocked" {
		t.Fatalf("expected reclassified candidate, got %#v", candidate)
	}
	if candidate["whyThisLayer"] != "The claim is a broad operating principle and must be split before proof." {
		t.Fatalf("expected whyThisLayer to update with review result, got %#v", candidate)
	}
}

func TestApplyClaimReviewResultCanClearUnresolvedQuestions(t *testing.T) {
	repoRoot := filepath.Join("..", "..", "fixtures", "claim-discovery", "tiny-repo")
	plan, err := DiscoverClaimProofPlan(ClaimDiscoveryOptions{RepoRoot: repoRoot})
	if err != nil {
		t.Fatalf("DiscoverClaimProofPlan returned error: %v", err)
	}
	claimID := "claim-agents-md-3"
	firstResult := map[string]any{
		"schemaVersion": contracts.ClaimReviewResultSchema,
		"clusterResults": []any{
			map[string]any{
				"clusterId": "cluster-fixture",
				"claimUpdates": []any{
					map[string]any{
						"claimId":               claimID,
						"reviewStatus":          "agent-reviewed",
						"evidenceStatus":        "unknown",
						"verificationReadiness": "ready-to-verify",
						"unresolvedQuestions":   []any{"Does this need Claude parity?"},
					},
				},
			},
		},
	}
	withQuestion, err := ApplyClaimReviewResult(plan, firstResult, ClaimReviewApplyOptions{
		ClaimsPath:       "claims.json",
		ReviewResultPath: "review-result.json",
	})
	if err != nil {
		t.Fatalf("first ApplyClaimReviewResult returned error: %v", err)
	}
	clearResult := map[string]any{
		"schemaVersion": contracts.ClaimReviewResultSchema,
		"clusterResults": []any{
			map[string]any{
				"clusterId": "cluster-fixture",
				"claimUpdates": []any{
					map[string]any{
						"claimId":             claimID,
						"unresolvedQuestions": []any{},
					},
				},
			},
		},
	}
	cleared, err := ApplyClaimReviewResult(withQuestion, clearResult, ClaimReviewApplyOptions{
		ClaimsPath:       "claims.json",
		ReviewResultPath: "review-result.json",
	})
	if err != nil {
		t.Fatalf("clear ApplyClaimReviewResult returned error: %v", err)
	}
	for _, raw := range arrayOrEmpty(cleared["claimCandidates"]) {
		candidate := asMap(raw)
		if stringFromAny(candidate["claimId"]) != claimID {
			continue
		}
		if questions := arrayOrEmpty(candidate["unresolvedQuestions"]); len(questions) != 0 {
			t.Fatalf("expected unresolvedQuestions to be cleared, got %#v", questions)
		}
		return
	}
	t.Fatalf("missing updated claim in %#v", cleared)
}

func TestApplyClaimReviewResultClearsSurfaceForNonEvalProof(t *testing.T) {
	repoRoot := filepath.Join("..", "..", "fixtures", "claim-discovery", "tiny-repo")
	plan, err := DiscoverClaimProofPlan(ClaimDiscoveryOptions{RepoRoot: repoRoot})
	if err != nil {
		t.Fatalf("DiscoverClaimProofPlan returned error: %v", err)
	}
	claimID := "claim-agents-md-3"
	reviewResult := map[string]any{
		"schemaVersion": contracts.ClaimReviewResultSchema,
		"clusterResults": []any{
			map[string]any{
				"clusterId": "cluster-fixture",
				"claimUpdates": []any{
					map[string]any{
						"claimId":               claimID,
						"reviewStatus":          "agent-reviewed",
						"evidenceStatus":        "unknown",
						"recommendedProof":      "deterministic",
						"verificationReadiness": "ready-to-verify",
					},
				},
			},
		},
	}
	updated, err := ApplyClaimReviewResult(plan, reviewResult, ClaimReviewApplyOptions{
		ClaimsPath:       "claims.json",
		ReviewResultPath: "review-result.json",
	})
	if err != nil {
		t.Fatalf("ApplyClaimReviewResult returned error: %v", err)
	}
	for _, raw := range arrayOrEmpty(updated["claimCandidates"]) {
		candidate := asMap(raw)
		if stringFromAny(candidate["claimId"]) != claimID {
			continue
		}
		if _, exists := candidate["recommendedEvalSurface"]; exists {
			t.Fatalf("expected non-eval proof update to clear recommendedEvalSurface, got %#v", candidate)
		}
		return
	}
	t.Fatalf("missing updated claim in %#v", updated)
}

func TestBuildClaimEvalPlanSelectsReviewedEvalClaims(t *testing.T) {
	repoRoot := filepath.Join("..", "..", "fixtures", "claim-discovery", "tiny-repo")
	plan, err := DiscoverClaimProofPlan(ClaimDiscoveryOptions{RepoRoot: repoRoot})
	if err != nil {
		t.Fatalf("DiscoverClaimProofPlan returned error: %v", err)
	}
	reviewResult := map[string]any{
		"schemaVersion": contracts.ClaimReviewResultSchema,
		"reviewRun": map[string]any{
			"reviewer": "fixture-reviewer",
		},
		"clusterResults": []any{
			map[string]any{
				"clusterId": "cluster-fixture",
				"claimUpdates": []any{
					map[string]any{
						"claimId":              "claim-agents-md-3",
						"reviewStatus":         "agent-reviewed",
						"evidenceStatus":       "missing",
						"evidenceStatusReason": "Needs a checked-in eval fixture.",
						"unresolvedQuestions":  []any{"Which host-owned fixture should protect this contract?"},
					},
				},
			},
		},
	}
	reviewed, err := ApplyClaimReviewResult(plan, reviewResult, ClaimReviewApplyOptions{
		ClaimsPath:       "claims.json",
		ReviewResultPath: "review-result.json",
	})
	if err != nil {
		t.Fatalf("ApplyClaimReviewResult returned error: %v", err)
	}
	evalPlan, err := BuildClaimEvalPlan(reviewed, ClaimEvalPlanOptions{
		ClaimsPath: "reviewed-claims.json",
		MaxClaims:  1,
	})
	if err != nil {
		t.Fatalf("BuildClaimEvalPlan returned error: %v", err)
	}
	if evalPlan["schemaVersion"] != contracts.ClaimEvalPlanSchema {
		t.Fatalf("unexpected schemaVersion: %#v", evalPlan["schemaVersion"])
	}
	plans := arrayOrEmpty(evalPlan["evalPlans"])
	if len(plans) != 1 {
		t.Fatalf("expected one eval plan, got %#v", evalPlan)
	}
	first := asMap(plans[0])
	if first["claimId"] != "claim-agents-md-3" || first["targetSurface"] != "dev/repo" {
		t.Fatalf("unexpected eval plan: %#v", first)
	}
	requirement := asMap(first["proofRequirement"])
	if requirement["requiredRunnerCapability"] != "development-repo-eval-runner" || requirement["requiresProductRunnerProof"] != false {
		t.Fatalf("expected dev/repo proof requirement, got %#v", requirement)
	}
	guidance := asMap(first["fixtureAuthoringGuidance"])
	if guidance["evaluationInputSchema"] != contracts.EvaluationInputSchema || guidance["surface"] != "dev" || guidance["preset"] != "repo" {
		t.Fatalf("expected dev/repo fixture guidance, got %#v", guidance)
	}
	if guidance["fixtureOwner"] != "host-repo" || guidance["runnerOwner"] != "host-repo-adapter" {
		t.Fatalf("expected host-owned fixture and runner guidance, got %#v", guidance)
	}
	if first["draftIntent"] == "" || evalPlan["nonWriterNotice"] == "" {
		t.Fatalf("expected draft intent and non-writer notice, got %#v", evalPlan)
	}
}

func TestBuildClaimEvalFixtureAuthoringGuidanceIncludesSkillTriggerFields(t *testing.T) {
	guidance := BuildClaimEvalFixtureAuthoringGuidance("dev/skill")
	if guidance["surface"] != "dev" || guidance["preset"] != "skill" || guidance["runnerOutputSchema"] != contracts.SkillEvaluationInputsSchema {
		t.Fatalf("expected dev/skill fixture guidance, got %#v", guidance)
	}
	if fields := stringArrayOrEmpty(guidance["minimumCaseFields"]); !containsString(fields, "evaluationKind") || !containsString(fields, "prompt") {
		t.Fatalf("expected dev/skill required case fields, got %#v", fields)
	}
	triggerFields := stringArrayOrEmpty(asMap(guidance["conditionalCaseFields"])["trigger"])
	if !containsString(triggerFields, "expectedTrigger") {
		t.Fatalf("expected dev/skill trigger conditional fields, got %#v", guidance)
	}
}

func TestBuildClaimEvalPlanMarksAppClaimsAsProductRunnerProof(t *testing.T) {
	reviewed := map[string]any{
		"schemaVersion": contracts.ClaimProofPlanSchema,
		"sourceRoot":    ".",
		"sourceInventory": []any{
			map[string]any{"path": "README.md", "kind": "markdown", "status": "read", "depth": 0},
		},
		"claimCandidates": []any{
			map[string]any{
				"claimId":                "claim-readme-md-1",
				"claimFingerprint":       "sha256:app",
				"summary":                "The chat remembers prior preferences.",
				"recommendedProof":       "cautilus-eval",
				"recommendedEvalSurface": "app/chat",
				"verificationReadiness":  "ready-to-verify",
				"evidenceStatus":         "missing",
				"reviewStatus":           "agent-reviewed",
				"lifecycle":              "new",
				"groupHints":             []any{"cautilus-eval"},
				"evidenceRefs":           []any{},
				"sourceRefs":             []any{map[string]any{"path": "README.md", "line": 1, "excerpt": "The chat remembers prior preferences."}},
			},
		},
	}
	evalPlan, err := BuildClaimEvalPlan(reviewed, ClaimEvalPlanOptions{ClaimsPath: "reviewed-claims.json"})
	if err != nil {
		t.Fatalf("BuildClaimEvalPlan returned error: %v", err)
	}
	plans := arrayOrEmpty(evalPlan["evalPlans"])
	if len(plans) != 1 {
		t.Fatalf("expected one eval plan, got %#v", evalPlan)
	}
	requirement := asMap(asMap(plans[0])["proofRequirement"])
	if requirement["requiredRunnerCapability"] != "headless-product-chat-runner" || requirement["requiresProductRunnerProof"] != true {
		t.Fatalf("expected app/chat product runner proof requirement, got %#v", requirement)
	}
	if observability := stringArrayOrEmpty(requirement["requiredObservability"]); !containsString(observability, "transcript") || !containsString(observability, "finalText") {
		t.Fatalf("expected chat observability requirements, got %#v", observability)
	}
	guidance := asMap(asMap(plans[0])["fixtureAuthoringGuidance"])
	if guidance["surface"] != "app" || guidance["preset"] != "chat" || guidance["runnerOutputSchema"] != contracts.AppChatEvaluationInputsSchema {
		t.Fatalf("expected app/chat fixture guidance, got %#v", guidance)
	}
	if fields := stringArrayOrEmpty(guidance["minimumCaseFields"]); !containsString(fields, "messages") || !containsString(fields, "expected") {
		t.Fatalf("expected app/chat minimum case fields, got %#v", fields)
	}
	if fields := stringArrayOrEmpty(guidance["minimumSuiteFields"]); !containsString(fields, "provider") || !containsString(fields, "model") {
		t.Fatalf("expected app/chat provider/model suite fields, got %#v", fields)
	}
	if !strings.Contains(stringFromAny(guidance["expectedShape"]), "expected.snapshot") {
		t.Fatalf("expected snapshot guidance for app/chat, got %#v", guidance)
	}
}

func TestBuildClaimEvalPlanSkipsHeuristicEvalClaims(t *testing.T) {
	repoRoot := filepath.Join("..", "..", "fixtures", "claim-discovery", "tiny-repo")
	plan, err := DiscoverClaimProofPlan(ClaimDiscoveryOptions{RepoRoot: repoRoot})
	if err != nil {
		t.Fatalf("DiscoverClaimProofPlan returned error: %v", err)
	}
	evalPlan, err := BuildClaimEvalPlan(plan, ClaimEvalPlanOptions{ClaimsPath: "claims.json"})
	if err != nil {
		t.Fatalf("BuildClaimEvalPlan returned error: %v", err)
	}
	if plans := arrayOrEmpty(evalPlan["evalPlans"]); len(plans) != 0 {
		t.Fatalf("expected no eval plans before review, got %#v", plans)
	}
	seenNotReviewed := false
	for _, raw := range arrayOrEmpty(evalPlan["skippedClaims"]) {
		skipped := asMap(raw)
		if skipped["claimId"] == "claim-agents-md-3" && skipped["reason"] == "not-reviewed" {
			seenNotReviewed = true
		}
	}
	if !seenNotReviewed {
		t.Fatalf("expected not-reviewed skip for heuristic eval claim, got %#v", evalPlan["skippedClaims"])
	}
}

func TestBuildClaimEvalPlanSkipsSatisfiedEvalClaims(t *testing.T) {
	reviewed := map[string]any{
		"schemaVersion": contracts.ClaimProofPlanSchema,
		"sourceRoot":    ".",
		"sourceInventory": []any{
			map[string]any{"path": "README.md", "kind": "markdown", "status": "read", "depth": 0},
		},
		"claimCandidates": []any{
			map[string]any{
				"claimId":                "claim-readme-md-1",
				"claimFingerprint":       "sha256:satisfied",
				"summary":                "The skill flow is already covered.",
				"recommendedProof":       "cautilus-eval",
				"recommendedEvalSurface": "dev/skill",
				"verificationReadiness":  "ready-to-verify",
				"evidenceStatus":         "satisfied",
				"reviewStatus":           "agent-reviewed",
				"lifecycle":              "new",
				"groupHints":             []any{"cautilus-eval"},
				"evidenceRefs": []any{map[string]any{
					"path":             ".cautilus/claims/evidence.json",
					"kind":             "cautilus-claim-evidence-bundle",
					"matchKind":        "verified",
					"contentHash":      "sha256:test",
					"supportsClaimIds": []any{"claim-readme-md-1"},
				}},
				"sourceRefs": []any{map[string]any{"path": "README.md", "line": 1, "excerpt": "The skill flow is already covered."}},
			},
		},
	}
	evalPlan, err := BuildClaimEvalPlan(reviewed, ClaimEvalPlanOptions{ClaimsPath: "reviewed-claims.json"})
	if err != nil {
		t.Fatalf("BuildClaimEvalPlan returned error: %v", err)
	}
	if plans := arrayOrEmpty(evalPlan["evalPlans"]); len(plans) != 0 {
		t.Fatalf("expected satisfied claim to be skipped, got %#v", plans)
	}
	summary := asMap(evalPlan["planSummary"])
	if summary["evalPlanCount"] != 0 || stringFromAny(summary["zeroPlanReason"]) == "" {
		t.Fatalf("expected zero-plan summary, got %#v", summary)
	}
	policy := asMap(evalPlan["selectionPolicy"])
	if statuses := stringArrayOrEmpty(policy["excludesEvidenceStatus"]); !containsString(statuses, "satisfied") {
		t.Fatalf("expected selection policy to document satisfied exclusion, got %#v", policy)
	}
	skipped := arrayOrEmpty(evalPlan["skippedClaims"])
	if len(skipped) != 1 || asMap(skipped[0])["reason"] != "already-satisfied" {
		t.Fatalf("expected already-satisfied skip, got %#v", skipped)
	}
	firstSkipped := asMap(skipped[0])
	if firstSkipped["evidenceStatus"] != "satisfied" || len(arrayOrEmpty(firstSkipped["evidenceRefs"])) != 1 {
		t.Fatalf("expected skipped satisfied claim to retain evidence context, got %#v", firstSkipped)
	}
	if firstSkipped["recommendedEvalSurface"] != "dev/skill" || len(arrayOrEmpty(firstSkipped["sourceRefs"])) != 1 {
		t.Fatalf("expected skipped claim to retain plan context, got %#v", firstSkipped)
	}
}

func TestBuildClaimEvalPlanSkipsSatisfiedNonEvalClaimsWithEvidenceContext(t *testing.T) {
	reviewed := map[string]any{
		"schemaVersion": contracts.ClaimProofPlanSchema,
		"sourceRoot":    ".",
		"sourceInventory": []any{
			map[string]any{"path": "README.md", "kind": "markdown", "status": "read", "depth": 0},
		},
		"claimCandidates": []any{
			map[string]any{
				"claimId":               "claim-readme-md-2",
				"claimFingerprint":      "sha256:satisfied-deterministic",
				"summary":               "The packet boundary is already covered.",
				"recommendedProof":      "deterministic",
				"verificationReadiness": "ready-to-verify",
				"evidenceStatus":        "satisfied",
				"reviewStatus":          "agent-reviewed",
				"lifecycle":             "new",
				"groupHints":            []any{"deterministic"},
				"evidenceRefs": []any{map[string]any{
					"path":             ".cautilus/claims/evidence-deterministic.json",
					"kind":             "cautilus-claim-evidence-bundle",
					"matchKind":        "verified",
					"contentHash":      "sha256:test",
					"supportsClaimIds": []any{"claim-readme-md-2"},
				}},
				"sourceRefs": []any{map[string]any{"path": "README.md", "line": 2, "excerpt": "The packet boundary is already covered."}},
			},
		},
	}
	evalPlan, err := BuildClaimEvalPlan(reviewed, ClaimEvalPlanOptions{ClaimsPath: "reviewed-claims.json"})
	if err != nil {
		t.Fatalf("BuildClaimEvalPlan returned error: %v", err)
	}
	skipped := arrayOrEmpty(evalPlan["skippedClaims"])
	if len(skipped) != 1 {
		t.Fatalf("expected one skipped claim, got %#v", skipped)
	}
	firstSkipped := asMap(skipped[0])
	if firstSkipped["reason"] != "not-cautilus-eval" || firstSkipped["evidenceStatus"] != "satisfied" {
		t.Fatalf("expected satisfied non-eval skip, got %#v", firstSkipped)
	}
	if len(arrayOrEmpty(firstSkipped["evidenceRefs"])) != 1 || len(arrayOrEmpty(firstSkipped["sourceRefs"])) != 1 {
		t.Fatalf("expected skipped satisfied non-eval claim to retain evidence context, got %#v", firstSkipped)
	}
	if _, exists := firstSkipped["recommendedEvalSurface"]; exists {
		t.Fatalf("expected non-eval skipped claim not to synthesize an eval surface, got %#v", firstSkipped)
	}
}

func TestBuildClaimValidationReportValidatesEvidenceRefs(t *testing.T) {
	packet := map[string]any{
		"schemaVersion": contracts.ClaimProofPlanSchema,
		"claimCandidates": []any{
			map[string]any{
				"claimId":               "claim-fixture-1",
				"claimFingerprint":      "sha256:fixture",
				"summary":               "Agents must follow the repo operating contract.",
				"recommendedProof":      "cautilus-eval",
				"verificationReadiness": "ready-to-verify",
				"evidenceStatus":        "satisfied",
				"reviewStatus":          "agent-reviewed",
				"lifecycle":             "new",
				"claimSemanticGroup":    "Agent and skill workflow",
				"groupHints":            []any{"cautilus-eval"},
				"sourceRefs": []any{
					map[string]any{"path": "AGENTS.md", "line": 3, "excerpt": "Agents must follow the repo operating contract."},
				},
				"evidenceRefs": []any{
					map[string]any{
						"kind":             "test",
						"path":             "internal/runtime/claim_discovery_test.go",
						"matchKind":        "possible",
						"contentHash":      "sha256:test",
						"supportsClaimIds": []any{"claim-fixture-1"},
					},
				},
			},
		},
	}
	report := BuildClaimValidationReport(packet, ClaimValidationOptions{InputPath: "claims.json"})
	if report["schemaVersion"] != contracts.ClaimValidationReportSchema {
		t.Fatalf("unexpected schemaVersion: %#v", report["schemaVersion"])
	}
	if report["valid"] != false {
		t.Fatalf("expected invalid report, got %#v", report)
	}
	issues := arrayOrEmpty(report["issues"])
	if len(issues) == 0 {
		t.Fatalf("expected validation issues, got %#v", report)
	}
	if !strings.Contains(stringFromAny(asMap(issues[0])["message"]), "evidenceStatus satisfied requires") {
		t.Fatalf("expected satisfied evidence issue, got %#v", issues)
	}
}

func TestBuildClaimValidationReportAcceptsValidPacket(t *testing.T) {
	repoRoot := filepath.Join("..", "..", "fixtures", "claim-discovery", "tiny-repo")
	plan, err := DiscoverClaimProofPlan(ClaimDiscoveryOptions{RepoRoot: repoRoot})
	if err != nil {
		t.Fatalf("DiscoverClaimProofPlan returned error: %v", err)
	}
	report := BuildClaimValidationReport(plan, ClaimValidationOptions{InputPath: "claims.json"})
	if report["valid"] != true || report["issueCount"] != 0 {
		t.Fatalf("expected valid report, got %#v", report)
	}
}

func mustWriteFile(t *testing.T, path string, content string) {
	t.Helper()
	if err := os.MkdirAll(filepath.Dir(path), 0o755); err != nil {
		t.Fatalf("MkdirAll returned error: %v", err)
	}
	if err := os.WriteFile(path, []byte(content), 0o644); err != nil {
		t.Fatalf("WriteFile returned error: %v", err)
	}
}

func writeClaimDiscoveryJSONFixture(t *testing.T, path string, value map[string]any) {
	t.Helper()
	payload, err := json.MarshalIndent(value, "", "  ")
	if err != nil {
		t.Fatalf("MarshalIndent returned error: %v", err)
	}
	if err := os.WriteFile(path, append(payload, '\n'), 0o644); err != nil {
		t.Fatalf("WriteFile returned error: %v", err)
	}
}

func execGit(workdir string, args ...string) error {
	command := exec.Command("git", args...)
	command.Dir = workdir
	return command.Run()
}

func execGitOutput(workdir string, args ...string) (string, error) {
	command := exec.Command("git", args...)
	command.Dir = workdir
	output, err := command.Output()
	return strings.TrimSpace(string(output)), err
}

func TestDiscoverClaimProofPlanJoinsWrappedMarkdownClaims(t *testing.T) {
	repoRoot := t.TempDir()
	if err := os.WriteFile(filepath.Join(repoRoot, "README.md"), []byte(strings.Join([]string{
		"# Wrapped Claims",
		"",
		"Agents must keep the repository handoff context loaded before",
		"they choose the durable implementation skill for the next task.",
		"",
	}, "\n")), 0o644); err != nil {
		t.Fatalf("WriteFile returned error: %v", err)
	}
	plan, err := DiscoverClaimProofPlan(ClaimDiscoveryOptions{RepoRoot: repoRoot})
	if err != nil {
		t.Fatalf("DiscoverClaimProofPlan returned error: %v", err)
	}
	candidates := arrayOrEmpty(plan["claimCandidates"])
	if len(candidates) != 1 {
		t.Fatalf("expected one wrapped candidate, got %#v", candidates)
	}
	entry := asMap(candidates[0])
	summary := stringFromAny(entry["summary"])
	if !strings.Contains(summary, "before they choose") {
		t.Fatalf("expected wrapped line continuation in summary, got %q", summary)
	}
	refs := arrayOrEmpty(entry["sourceRefs"])
	ref := asMap(refs[0])
	if ref["line"] != 3 {
		t.Fatalf("expected source ref to keep starting line 3, got %#v", ref)
	}
}

func TestDiscoverClaimProofPlanHonorsExplicitSources(t *testing.T) {
	repoRoot := filepath.Join("..", "..", "fixtures", "claim-discovery", "tiny-repo")
	plan, err := DiscoverClaimProofPlan(ClaimDiscoveryOptions{
		RepoRoot:    repoRoot,
		SourcePaths: []string{"AGENTS.md"},
	})
	if err != nil {
		t.Fatalf("DiscoverClaimProofPlan returned error: %v", err)
	}
	candidates := arrayOrEmpty(plan["claimCandidates"])
	if len(candidates) != 1 {
		t.Fatalf("expected only the AGENTS.md candidate, got %#v", candidates)
	}
	entry := asMap(candidates[0])
	if entry["recommendedProof"] != "cautilus-eval" {
		t.Fatalf("expected cautilus-eval candidate, got %#v", entry)
	}
}

func TestDiscoverClaimProofPlanFollowsMarkdownLinksToDepthThree(t *testing.T) {
	repoRoot := t.TempDir()
	mustWriteFile(t, filepath.Join(repoRoot, "README.md"), strings.Join([]string{
		"# Root",
		"",
		"[Guide](docs/guide.md)",
		"",
		"This root document should remain human visible and inspectable.",
		"",
	}, "\n"))
	mustWriteFile(t, filepath.Join(repoRoot, "docs", "guide.md"), strings.Join([]string{
		"# Guide",
		"",
		"[Deep](deep.md)",
		"",
		"Agents must follow the guide before changing workflow behavior.",
		"",
	}, "\n"))
	mustWriteFile(t, filepath.Join(repoRoot, "docs", "deep.md"), strings.Join([]string{
		"# Deep",
		"",
		"[Final](final.md)",
		"",
		"Prompt behavior should remain stable for the final reviewer.",
		"",
	}, "\n"))
	mustWriteFile(t, filepath.Join(repoRoot, "docs", "final.md"), strings.Join([]string{
		"# Final",
		"",
		"[Too Far](too-far.md)",
		"",
		"The deterministic unit test suite proves final packets compile.",
		"",
	}, "\n"))
	mustWriteFile(t, filepath.Join(repoRoot, "docs", "too-far.md"), strings.Join([]string{
		"# Too Far",
		"",
		"Agents must not be discovered beyond depth three.",
		"",
	}, "\n"))

	plan, err := DiscoverClaimProofPlan(ClaimDiscoveryOptions{RepoRoot: repoRoot})
	if err != nil {
		t.Fatalf("DiscoverClaimProofPlan returned error: %v", err)
	}
	inventory := arrayOrEmpty(plan["sourceInventory"])
	paths := map[string]bool{}
	for _, raw := range inventory {
		paths[stringFromAny(asMap(raw)["path"])] = true
	}
	for _, path := range []string{"README.md", "docs/guide.md", "docs/deep.md", "docs/final.md"} {
		if !paths[path] {
			t.Fatalf("expected %s in inventory: %#v", path, inventory)
		}
	}
	if paths["docs/too-far.md"] {
		t.Fatalf("did not expect depth-four markdown source in inventory: %#v", inventory)
	}
	graph := arrayOrEmpty(plan["sourceGraph"])
	if len(graph) != 3 {
		t.Fatalf("expected three markdown graph edges, got %#v", graph)
	}
	scope := asMap(plan["effectiveScanScope"])
	if scope["linkedMarkdownDepth"] != 3 {
		t.Fatalf("expected depth 3 scan scope, got %#v", scope)
	}
}

func TestDiscoverClaimProofPlanRespectsGitignore(t *testing.T) {
	repoRoot := t.TempDir()
	if err := execGit(repoRoot, "init"); err != nil {
		t.Fatalf("git init failed: %v", err)
	}
	mustWriteFile(t, filepath.Join(repoRoot, ".gitignore"), strings.Join([]string{
		"generated/",
		"ignored-entry.md",
		"",
	}, "\n"))
	mustWriteFile(t, filepath.Join(repoRoot, "README.md"), strings.Join([]string{
		"# Root",
		"",
		"[Generated](generated/report.md)",
		"",
		"Agents must keep public claim discovery focused on source docs.",
		"",
	}, "\n"))
	mustWriteFile(t, filepath.Join(repoRoot, "generated", "report.md"), strings.Join([]string{
		"# Generated",
		"",
		"Agents must not discover generated report claims.",
		"",
	}, "\n"))
	mustWriteFile(t, filepath.Join(repoRoot, "ignored-entry.md"), strings.Join([]string{
		"# Ignored",
		"",
		"Agents must not discover explicit ignored entries.",
		"",
	}, "\n"))

	plan, err := DiscoverClaimProofPlan(ClaimDiscoveryOptions{RepoRoot: repoRoot})
	if err != nil {
		t.Fatalf("DiscoverClaimProofPlan returned error: %v", err)
	}
	inventory := arrayOrEmpty(plan["sourceInventory"])
	paths := map[string]bool{}
	for _, raw := range inventory {
		paths[stringFromAny(asMap(raw)["path"])] = true
	}
	if !paths["README.md"] {
		t.Fatalf("expected README.md in inventory, got %#v", inventory)
	}
	if paths["ignored-entry.md"] || paths["generated/report.md"] {
		t.Fatalf("gitignored sources must be omitted from inventory, got %#v", inventory)
	}
	for _, raw := range arrayOrEmpty(plan["claimCandidates"]) {
		summary := stringFromAny(asMap(raw)["summary"])
		if strings.Contains(summary, "generated report") || strings.Contains(summary, "explicit ignored") {
			t.Fatalf("gitignored claim leaked into candidates: %#v", raw)
		}
	}
	scope := asMap(plan["effectiveScanScope"])
	if scope["gitignorePolicy"] != "respect-repo-gitignore" {
		t.Fatalf("expected gitignore policy in scan scope, got %#v", scope)
	}

	explicitPlan, err := DiscoverClaimProofPlan(ClaimDiscoveryOptions{
		RepoRoot:    repoRoot,
		SourcePaths: []string{"ignored-entry.md"},
	})
	if err != nil {
		t.Fatalf("DiscoverClaimProofPlan with explicit ignored source returned error: %v", err)
	}
	if inventory := arrayOrEmpty(explicitPlan["sourceInventory"]); len(inventory) != 0 {
		t.Fatalf("explicit gitignored source must be omitted, got %#v", inventory)
	}
}

func TestDiscoverClaimProofPlanHonorsAdapterExcludesForLinkedMarkdown(t *testing.T) {
	repoRoot := t.TempDir()
	mustWriteFile(t, filepath.Join(repoRoot, ".agents", "cautilus-adapter.yaml"), strings.Join([]string{
		"version: 1",
		"repo: demo",
		"claim_discovery:",
		"  entries:",
		"    - README.md",
		"  linked_markdown_depth: 3",
		"  exclude:",
		"    - docs/specs/**",
		"    - docs/claims/**",
		"    - docs/maintainers/**",
		"  evidence_roots:",
		"    - docs/specs",
		"",
	}, "\n"))
	mustWriteFile(t, filepath.Join(repoRoot, "README.md"), strings.Join([]string{
		"# Root",
		"",
		"[Spec](docs/specs/product.spec.md)",
		"[Superseded Claims](docs/claims/user-facing.md)",
		"[Maintainer](docs/maintainers/evidence.md)",
		"[Guide](docs/guide.md)",
		"",
		"Users can inspect the public guide before running claim discovery.",
		"",
	}, "\n"))
	mustWriteFile(t, filepath.Join(repoRoot, "docs", "specs", "product.spec.md"), strings.Join([]string{
		"# Product Spec",
		"",
		"The executable spec proves step fixtures compose in order.",
		"",
	}, "\n"))
	mustWriteFile(t, filepath.Join(repoRoot, "docs", "claims", "user-facing.md"), strings.Join([]string{
		"# Superseded Claims",
		"",
		"Users should not discover superseded claim catalog promises.",
		"",
	}, "\n"))
	mustWriteFile(t, filepath.Join(repoRoot, "docs", "maintainers", "evidence.md"), strings.Join([]string{
		"# Evidence",
		"",
		"Maintainers can verify private consumer proof in this appendix.",
		"",
	}, "\n"))
	mustWriteFile(t, filepath.Join(repoRoot, "docs", "guide.md"), strings.Join([]string{
		"# Guide",
		"",
		"Users can inspect the linked public guide claim.",
		"",
	}, "\n"))

	plan, err := DiscoverClaimProofPlan(ClaimDiscoveryOptions{RepoRoot: repoRoot})
	if err != nil {
		t.Fatalf("DiscoverClaimProofPlan returned error: %v", err)
	}
	paths := map[string]bool{}
	for _, raw := range arrayOrEmpty(plan["sourceInventory"]) {
		paths[stringFromAny(asMap(raw)["path"])] = true
	}
	if !paths["README.md"] || !paths["docs/guide.md"] {
		t.Fatalf("expected public entry and guide sources, got %#v", plan["sourceInventory"])
	}
	if paths["docs/specs/product.spec.md"] || paths["docs/claims/user-facing.md"] || paths["docs/maintainers/evidence.md"] {
		t.Fatalf("adapter-excluded proof/internal docs must not enter source inventory: %#v", plan["sourceInventory"])
	}
	for _, raw := range arrayOrEmpty(plan["claimCandidates"]) {
		summary := stringFromAny(asMap(raw)["summary"])
		if strings.Contains(summary, "executable spec proves") || strings.Contains(summary, "superseded claim catalog") || strings.Contains(summary, "private consumer proof") {
			t.Fatalf("excluded proof/internal doc leaked into candidates: %#v", raw)
		}
	}
	scope := asMap(plan["effectiveScanScope"])
	excludes := stringArrayOrEmpty(scope["exclude"])
	if !containsString(excludes, "docs/specs/**") || !containsString(excludes, "docs/claims/**") || !containsString(excludes, "docs/maintainers/**") {
		t.Fatalf("expected adapter excludes in effective scan scope, got %#v", scope)
	}
}

func TestDiscoverClaimProofPlanUsesAdapterClaimDiscoveryEntries(t *testing.T) {
	repoRoot := t.TempDir()
	mustWriteFile(t, filepath.Join(repoRoot, "README.md"), "README should not be scanned when adapter entries override defaults.\n")
	mustWriteFile(t, filepath.Join(repoRoot, ".agents", "cautilus-adapter.yaml"), strings.Join([]string{
		"version: 1",
		"repo: demo",
		"claim_discovery:",
		"  entries:",
		"    - docs/start.md",
		"  include:",
		"    - docs/**/*.md",
		"  exclude:",
		"    - docs/private/**",
		"  evidence_roots:",
		"    - docs/specs",
		"  linked_markdown_depth: 1",
		"  state_path: .cautilus/claims/custom.json",
		"  audience_hints:",
		"    user:",
		"      - docs/start.md",
		"    developer:",
		"      - docs/next.md",
		"  semantic_groups:",
		"    - label: Adapter setup",
		"      terms:",
		"        - adapter-owned",
		"",
	}, "\n"))
	mustWriteFile(t, filepath.Join(repoRoot, "docs", "start.md"), strings.Join([]string{
		"# Start",
		"",
		"[Next](next.md)",
		"",
		"Agents must follow adapter-owned claim discovery entries.",
		"",
	}, "\n"))
	mustWriteFile(t, filepath.Join(repoRoot, "docs", "next.md"), strings.Join([]string{
		"# Next",
		"",
		"The deterministic unit test suite proves linked packets compile.",
		"",
	}, "\n"))

	plan, err := DiscoverClaimProofPlan(ClaimDiscoveryOptions{RepoRoot: repoRoot})
	if err != nil {
		t.Fatalf("DiscoverClaimProofPlan returned error: %v", err)
	}
	scope := asMap(plan["effectiveScanScope"])
	if scope["adapterFound"] != true || scope["linkedMarkdownDepth"] != 1 {
		t.Fatalf("expected adapter-backed scan scope, got %#v", scope)
	}
	if scope["adapterPath"] != ".agents/cautilus-adapter.yaml" ||
		scope["traversal"] != "entry-markdown-links" ||
		scope["gitignorePolicy"] != "respect-repo-gitignore" ||
		scope["explicitSources"] != false {
		t.Fatalf("expected reproducible adapter scan scope metadata, got %#v", scope)
	}
	if entries := stringArrayOrEmpty(scope["entries"]); len(entries) != 1 || entries[0] != "docs/start.md" {
		t.Fatalf("expected adapter entry in effective scan scope, got %#v", scope)
	}
	if include := stringArrayOrEmpty(scope["include"]); len(include) != 1 || include[0] != "docs/**/*.md" {
		t.Fatalf("expected adapter include in effective scan scope, got %#v", scope)
	}
	if exclude := stringArrayOrEmpty(scope["exclude"]); !containsString(exclude, "docs/private/**") {
		t.Fatalf("expected adapter exclude in effective scan scope, got %#v", scope)
	}
	if evidenceRoots := stringArrayOrEmpty(scope["evidenceRoots"]); len(evidenceRoots) != 1 || evidenceRoots[0] != "docs/specs" {
		t.Fatalf("expected adapter evidence roots in effective scan scope, got %#v", scope)
	}
	state := asMap(plan["claimState"])
	if state["path"] != ".cautilus/claims/custom.json" || state["pathSource"] != "adapter" {
		t.Fatalf("expected adapter claim state path, got %#v", state)
	}
	inventory := arrayOrEmpty(plan["sourceInventory"])
	if len(inventory) != 2 {
		t.Fatalf("expected adapter entry plus depth-one link, got %#v", inventory)
	}
	for _, raw := range inventory {
		if stringFromAny(asMap(raw)["path"]) == "README.md" {
			t.Fatalf("adapter entries should override README default: %#v", inventory)
		}
	}
	bySummary := map[string]map[string]any{}
	for _, raw := range arrayOrEmpty(plan["claimCandidates"]) {
		entry := asMap(raw)
		bySummary[stringFromAny(entry["summary"])] = entry
	}
	if stringFromAny(bySummary["Agents must follow adapter-owned claim discovery entries."]["claimAudience"]) != "user" {
		t.Fatalf("expected adapter user audience hint on docs/start.md claim, got %#v", bySummary)
	}
	if stringFromAny(bySummary["The deterministic unit test suite proves linked packets compile."]["claimAudience"]) != "developer" {
		t.Fatalf("expected adapter developer audience hint on docs/next.md claim, got %#v", bySummary)
	}
	if stringFromAny(bySummary["Agents must follow adapter-owned claim discovery entries."]["claimSemanticGroup"]) != "Adapter setup" {
		t.Fatalf("expected adapter semantic group on docs/start.md claim, got %#v", bySummary)
	}
}

func TestDiscoverClaimProofPlanUsesPortableSemanticFallbackWhenAdapterOmitsGroups(t *testing.T) {
	repoRoot := t.TempDir()
	mustWriteFile(t, filepath.Join(repoRoot, ".agents", "cautilus-adapter.yaml"), strings.Join([]string{
		"version: 1",
		"repo: demo",
		"claim_discovery:",
		"  entries:",
		"    - README.md",
		"",
	}, "\n"))
	mustWriteFile(t, filepath.Join(repoRoot, "README.md"), strings.Join([]string{
		"# Demo",
		"",
		"Agents must keep the public surface understandable.",
		"",
	}, "\n"))

	plan, err := DiscoverClaimProofPlan(ClaimDiscoveryOptions{RepoRoot: repoRoot})
	if err != nil {
		t.Fatalf("DiscoverClaimProofPlan returned error: %v", err)
	}
	scope := asMap(plan["effectiveScanScope"])
	if groups := arrayOrEmpty(scope["semanticGroups"]); len(groups) != 0 {
		t.Fatalf("expected no adapter semantic groups in scan scope, got %#v", groups)
	}
	candidates := arrayOrEmpty(plan["claimCandidates"])
	if len(candidates) != 1 {
		t.Fatalf("expected one candidate, got %#v", candidates)
	}
	candidate := asMap(candidates[0])
	if candidate["claimSemanticGroup"] != "General product behavior" {
		t.Fatalf("expected portable fallback semantic group, got %#v", candidate)
	}
}

func TestDiscoverClaimProofPlanRejectsEscapingAdapterStatePath(t *testing.T) {
	repoRoot := t.TempDir()
	mustWriteFile(t, filepath.Join(repoRoot, "README.md"), "Agents must keep claim state inside the repo.\n")
	mustWriteFile(t, filepath.Join(repoRoot, ".agents", "cautilus-adapter.yaml"), strings.Join([]string{
		"version: 1",
		"repo: demo",
		"claim_discovery:",
		"  state_path: ../claims.json",
		"",
	}, "\n"))

	_, err := DiscoverClaimProofPlan(ClaimDiscoveryOptions{RepoRoot: repoRoot})
	if err == nil {
		t.Fatalf("expected escaping claim_discovery.state_path to fail")
	}
	if !strings.Contains(err.Error(), "claim_discovery.state_path must stay inside the repo") {
		t.Fatalf("unexpected error: %v", err)
	}
}

func TestBuildClaimRefreshPlanMarksChangedSources(t *testing.T) {
	repoRoot := t.TempDir()
	if err := execGit(repoRoot, "init"); err != nil {
		t.Fatalf("git init failed: %v", err)
	}
	if err := execGit(repoRoot, "config", "user.email", "cautilus@example.com"); err != nil {
		t.Fatalf("git config failed: %v", err)
	}
	if err := execGit(repoRoot, "config", "user.name", "Cautilus Test"); err != nil {
		t.Fatalf("git config failed: %v", err)
	}
	mustWriteFile(t, filepath.Join(repoRoot, "README.md"), "Agents must follow the first workflow behavior.\n")
	if err := execGit(repoRoot, "add", "README.md"); err != nil {
		t.Fatalf("git add failed: %v", err)
	}
	if err := execGit(repoRoot, "commit", "-m", "initial"); err != nil {
		t.Fatalf("git commit failed: %v", err)
	}
	base, err := execGitOutput(repoRoot, "rev-parse", "HEAD")
	if err != nil {
		t.Fatalf("git rev-parse base failed: %v", err)
	}
	previous := filepath.Join(repoRoot, "claims.json")
	mustWriteFile(t, previous, fmt.Sprintf(`{
  "schemaVersion": "cautilus.claim_proof_plan.v1",
  "gitCommit": %q,
  "claimCandidates": [
    {"claimId": "claim-readme-md-1", "sourceRefs": [{"path": "README.md"}]}
  ]
}
`, base))
	mustWriteFile(t, filepath.Join(repoRoot, "README.md"), "Agents must follow the changed workflow behavior.\n")
	if err := execGit(repoRoot, "add", "README.md"); err != nil {
		t.Fatalf("git add changed failed: %v", err)
	}
	if err := execGit(repoRoot, "commit", "-m", "change readme"); err != nil {
		t.Fatalf("git commit changed failed: %v", err)
	}

	plan, err := DiscoverClaimProofPlan(ClaimDiscoveryOptions{
		RepoRoot:        repoRoot,
		PreviousPath:    previous,
		RefreshPlanOnly: true,
	})
	if err != nil {
		t.Fatalf("DiscoverClaimProofPlan refresh returned error: %v", err)
	}
	if plan["schemaVersion"] != contracts.ClaimRefreshPlanSchema {
		t.Fatalf("unexpected refresh schema: %#v", plan)
	}
	changed := stringArrayOrEmpty(plan["changedSources"])
	if len(changed) != 1 || changed[0] != "README.md" {
		t.Fatalf("expected README.md changed source, got %#v", changed)
	}
	claimPlan := arrayOrEmpty(plan["claimPlan"])
	if asMap(claimPlan[0])["lifecycle"] != "changed" {
		t.Fatalf("expected changed lifecycle, got %#v", claimPlan)
	}
	refreshSummary := asMap(plan["refreshSummary"])
	if refreshSummary["status"] != "changes-detected" {
		t.Fatalf("expected changes-detected refresh summary, got %#v", refreshSummary)
	}
	if summaryText := stringFromAny(refreshSummary["summary"]); !strings.Contains(summaryText, "does not update the saved claim map yet") {
		t.Fatalf("expected coordinator-facing refresh summary to preserve the non-mutation boundary, got %#v", refreshSummary)
	}
	if refreshSummary["changedSourceCount"] != 1 || refreshSummary["changedClaimCount"] != 1 || refreshSummary["carriedForwardClaimCount"] != 0 {
		t.Fatalf("unexpected refresh counts: %#v", refreshSummary)
	}
	changedClaimSources := arrayOrEmpty(refreshSummary["changedClaimSources"])
	if len(changedClaimSources) != 1 || asMap(changedClaimSources[0])["path"] != "README.md" || asMap(changedClaimSources[0])["claimCount"] != 1 {
		t.Fatalf("expected README.md changed claim source, got %#v", changedClaimSources)
	}
	nextActions := arrayOrEmpty(refreshSummary["nextActions"])
	if len(nextActions) == 0 || asMap(nextActions[0])["id"] != "update_saved_claim_map" {
		t.Fatalf("expected update_saved_claim_map first next action, got %#v", nextActions)
	}
}

func TestBuildClaimRefreshPlanRecordsStaleEvidenceReasons(t *testing.T) {
	repoRoot := t.TempDir()
	mustWriteFile(t, filepath.Join(repoRoot, "README.md"), "Agents must preserve claim evidence state.\n")
	evidencePath := filepath.Join(repoRoot, ".cautilus", "claims", "evidence.json")
	mustWriteFile(t, evidencePath, `{"schemaVersion":"cautilus.claim_evidence_bundle.v1","createdForClaimIds":["claim-readme-md-1"],"decision":{"evidenceStatus":"satisfied"}}`)
	oldHash, err := fileSHA256(evidencePath)
	if err != nil {
		t.Fatalf("fileSHA256 returned error: %v", err)
	}
	mustWriteFile(t, evidencePath, `{"schemaVersion":"cautilus.claim_evidence_bundle.v1","createdForClaimIds":["claim-readme-md-1"],"decision":{"evidenceStatus":"satisfied"},"changed":true}`)
	previous := filepath.Join(repoRoot, "claims.json")
	mustWriteFile(t, previous, fmt.Sprintf(`{
  "schemaVersion": "cautilus.claim_proof_plan.v1",
  "gitCommit": "abc123",
  "claimCandidates": [
    {
      "claimId": "claim-readme-md-1",
      "evidenceStatus": "satisfied",
      "evidenceRefs": [
        {
          "kind": "cautilus-claim-evidence-bundle",
          "path": ".cautilus/claims/evidence.json",
          "matchKind": "verified",
          "contentHash": %q,
          "supportsClaimIds": ["claim-readme-md-1"]
        }
      ],
      "sourceRefs": [{"path": "README.md"}]
    }
  ]
}
`, oldHash))

	plan, err := DiscoverClaimProofPlan(ClaimDiscoveryOptions{
		RepoRoot:        repoRoot,
		PreviousPath:    previous,
		RefreshPlanOnly: true,
	})
	if err != nil {
		t.Fatalf("DiscoverClaimProofPlan refresh returned error: %v", err)
	}
	staleEvidence := arrayOrEmpty(plan["staleEvidence"])
	if len(staleEvidence) != 1 {
		t.Fatalf("expected one stale evidence record, got %#v", staleEvidence)
	}
	staleRecord := asMap(staleEvidence[0])
	reasons := stringArrayOrEmpty(staleRecord["reasons"])
	if staleRecord["claimId"] != "claim-readme-md-1" || len(reasons) != 1 || !strings.Contains(reasons[0], "contentHash changed") {
		t.Fatalf("expected stale evidence reason to record changed contentHash, got %#v", staleRecord)
	}
	refreshSummary := asMap(plan["refreshSummary"])
	if refreshSummary["staleEvidenceClaimCount"] != 1 || refreshSummary["changedEvidenceRefCount"] != 1 {
		t.Fatalf("expected refresh summary to count stale evidence refs, got %#v", refreshSummary)
	}
	if plan["targetPolicy"] != "current-head" {
		t.Fatalf("expected refresh plan to record target policy, got %#v", plan["targetPolicy"])
	}
	if plan["workingTreePolicy"] != "excluded" || refreshSummary["workingTreePolicy"] != "excluded" {
		t.Fatalf("expected refresh plan to record dirty working tree treatment, got plan=%#v summary=%#v", plan["workingTreePolicy"], refreshSummary["workingTreePolicy"])
	}
}

func TestBuildClaimRefreshPlanDetectsDiscoveryEngineDrift(t *testing.T) {
	repoRoot := t.TempDir()
	if err := execGit(repoRoot, "init"); err != nil {
		t.Fatalf("git init failed: %v", err)
	}
	if err := execGit(repoRoot, "config", "user.email", "cautilus@example.com"); err != nil {
		t.Fatalf("git config failed: %v", err)
	}
	if err := execGit(repoRoot, "config", "user.name", "Cautilus Test"); err != nil {
		t.Fatalf("git config failed: %v", err)
	}
	mustWriteFile(t, filepath.Join(repoRoot, "README.md"), "Agents must preserve claim discovery freshness.\n")
	if err := execGit(repoRoot, "add", "README.md"); err != nil {
		t.Fatalf("git add failed: %v", err)
	}
	if err := execGit(repoRoot, "commit", "-m", "initial"); err != nil {
		t.Fatalf("git commit failed: %v", err)
	}
	base, err := execGitOutput(repoRoot, "rev-parse", "HEAD")
	if err != nil {
		t.Fatalf("git rev-parse base failed: %v", err)
	}
	previous := filepath.Join(repoRoot, "claims.json")
	mustWriteFile(t, previous, fmt.Sprintf(`{
  "schemaVersion": "cautilus.claim_proof_plan.v1",
  "gitCommit": %q,
  "sourceInventory": [{"path": "README.md", "kind": "readme", "status": "read", "depth": 0}],
  "claimCandidates": [
    {"claimId": "claim-readme-md-1", "sourceRefs": [{"path": "README.md"}]}
  ]
}
`, base))

	plan, err := DiscoverClaimProofPlan(ClaimDiscoveryOptions{
		RepoRoot:        repoRoot,
		PreviousPath:    previous,
		RefreshPlanOnly: true,
	})
	if err != nil {
		t.Fatalf("DiscoverClaimProofPlan refresh returned error: %v", err)
	}
	refreshSummary := asMap(plan["refreshSummary"])
	if refreshSummary["status"] != "discovery-engine-changed" || refreshSummary["discoveryEngineChanged"] != true {
		t.Fatalf("expected discovery-engine-changed refresh summary, got %#v", refreshSummary)
	}
	previousEngine := asMap(refreshSummary["previousDiscoveryEngine"])
	if previousEngine["status"] != "missing" {
		t.Fatalf("expected missing previous discovery engine metadata, got %#v", previousEngine)
	}
	currentEngine := asMap(refreshSummary["currentDiscoveryEngine"])
	if currentEngine["ruleset"] != claimDiscoveryRulesetVersion {
		t.Fatalf("expected current discovery engine ruleset, got %#v", currentEngine)
	}
	nextActions := arrayOrEmpty(refreshSummary["nextActions"])
	if len(nextActions) == 0 || asMap(nextActions[0])["id"] != "update_saved_claim_map" {
		t.Fatalf("expected update_saved_claim_map first next action, got %#v", nextActions)
	}
}

func TestClaimDiscoveryEngineChangedUsesSemanticRuleset(t *testing.T) {
	current := map[string]any{
		"name":               "cautilus.claim_discovery",
		"ruleset":            claimDiscoveryRulesetVersion,
		"implementationHash": "sha256:new",
	}
	if !claimDiscoveryEngineChanged(map[string]any{}, current) {
		t.Fatal("expected missing previous discovery engine to require refresh")
	}
	if !claimDiscoveryEngineChanged(map[string]any{
		"name":               "cautilus.claim_discovery",
		"ruleset":            "claim-discovery-rules.v1",
		"implementationHash": "sha256:new",
	}, current) {
		t.Fatal("expected changed ruleset to require refresh")
	}
	if claimDiscoveryEngineChanged(map[string]any{
		"name":               "cautilus.claim_discovery",
		"ruleset":            claimDiscoveryRulesetVersion,
		"implementationHash": "sha256:old",
	}, current) {
		t.Fatal("expected implementationHash-only drift to stay informational")
	}
}

func TestBuildClaimRefreshPlanIgnoresCommittedClaimPacketDrift(t *testing.T) {
	repoRoot := t.TempDir()
	if err := execGit(repoRoot, "init"); err != nil {
		t.Fatalf("git init failed: %v", err)
	}
	if err := execGit(repoRoot, "config", "user.email", "cautilus@example.com"); err != nil {
		t.Fatalf("git config failed: %v", err)
	}
	if err := execGit(repoRoot, "config", "user.name", "Cautilus Test"); err != nil {
		t.Fatalf("git config failed: %v", err)
	}
	mustWriteFile(t, filepath.Join(repoRoot, "README.md"), "Agents must follow the first workflow behavior.\n")
	if err := execGit(repoRoot, "add", "README.md"); err != nil {
		t.Fatalf("git add failed: %v", err)
	}
	if err := execGit(repoRoot, "commit", "-m", "initial"); err != nil {
		t.Fatalf("git commit failed: %v", err)
	}
	base, err := execGitOutput(repoRoot, "rev-parse", "HEAD")
	if err != nil {
		t.Fatalf("git rev-parse base failed: %v", err)
	}
	engineJSON, err := json.Marshal(renderClaimDiscoveryEngine(repoRoot))
	if err != nil {
		t.Fatalf("marshal discovery engine failed: %v", err)
	}
	previous := filepath.Join(repoRoot, ".cautilus", "claims", "latest.json")
	mustWriteFile(t, previous, fmt.Sprintf(`{
  "schemaVersion": "cautilus.claim_proof_plan.v1",
  "gitCommit": %q,
  "discoveryEngine": %s,
  "sourceInventory": [{"path": "README.md", "kind": "readme", "status": "read", "depth": 0}],
  "claimCandidates": [
    {"claimId": "claim-readme-md-1", "sourceRefs": [{"path": "README.md"}]}
  ]
}
`, base, string(engineJSON)))
	if err := execGit(repoRoot, "add", previous); err != nil {
		t.Fatalf("git add claims failed: %v", err)
	}
	if err := execGit(repoRoot, "commit", "-m", "commit claim packet"); err != nil {
		t.Fatalf("git commit claims failed: %v", err)
	}

	plan, err := DiscoverClaimProofPlan(ClaimDiscoveryOptions{
		RepoRoot:        repoRoot,
		PreviousPath:    previous,
		RefreshPlanOnly: true,
	})
	if err != nil {
		t.Fatalf("DiscoverClaimProofPlan refresh returned error: %v", err)
	}
	if changed := stringArrayOrEmpty(plan["changedSources"]); len(changed) != 0 {
		t.Fatalf("expected no changed claim sources, got %#v", changed)
	}
	refreshSummary := asMap(plan["refreshSummary"])
	if refreshSummary["status"] != "up-to-date" || refreshSummary["changedSourceCount"] != 0 || refreshSummary["changedClaimCount"] != 0 {
		t.Fatalf("expected committed packet drift to stay up-to-date, got %#v", refreshSummary)
	}
	changedFiles := stringArrayOrEmpty(plan["changedFiles"])
	if len(changedFiles) != 1 || changedFiles[0] != ".cautilus/claims/latest.json" {
		t.Fatalf("expected changedFiles to record packet-only drift, got %#v", changedFiles)
	}
}

func TestClaimGitStateIgnoresCommittedSourceDriftWhenContentHashMatches(t *testing.T) {
	repoRoot := t.TempDir()
	if err := execGit(repoRoot, "init"); err != nil {
		t.Fatalf("git init failed: %v", err)
	}
	if err := execGit(repoRoot, "config", "user.email", "cautilus@example.com"); err != nil {
		t.Fatalf("git config failed: %v", err)
	}
	if err := execGit(repoRoot, "config", "user.name", "Cautilus Test"); err != nil {
		t.Fatalf("git config failed: %v", err)
	}
	readmePath := filepath.Join(repoRoot, "README.md")
	mustWriteFile(t, readmePath, "Agents must follow the first workflow behavior.\n")
	if err := execGit(repoRoot, "add", "README.md"); err != nil {
		t.Fatalf("git add failed: %v", err)
	}
	if err := execGit(repoRoot, "commit", "-m", "initial"); err != nil {
		t.Fatalf("git commit failed: %v", err)
	}
	base, err := execGitOutput(repoRoot, "rev-parse", "HEAD")
	if err != nil {
		t.Fatalf("git rev-parse base failed: %v", err)
	}
	mustWriteFile(t, readmePath, "Agents must follow the changed workflow behavior.\n")
	contentHash, err := fileSHA256(readmePath)
	if err != nil {
		t.Fatalf("hash changed readme failed: %v", err)
	}
	claimsPath := filepath.Join(repoRoot, ".cautilus", "claims", "latest.json")
	mustWriteFile(t, claimsPath, fmt.Sprintf(`{
  "schemaVersion": "cautilus.claim_proof_plan.v1",
  "gitCommit": %q,
  "sourceInventory": [{"path": "README.md", "kind": "readme", "status": "read", "depth": 0, "contentHash": %q}],
  "claimCandidates": [
    {"claimId": "claim-readme-md-1", "sourceRefs": [{"path": "README.md"}]}
  ]
}
`, base, contentHash))
	if err := execGit(repoRoot, "add", "README.md", ".cautilus/claims/latest.json"); err != nil {
		t.Fatalf("git add changed source and claims failed: %v", err)
	}
	if err := execGit(repoRoot, "commit", "-m", "commit source and claim packet"); err != nil {
		t.Fatalf("git commit source and claims failed: %v", err)
	}
	var packet map[string]any
	packetBytes, err := os.ReadFile(claimsPath)
	if err != nil {
		t.Fatalf("read claim packet failed: %v", err)
	}
	if err := json.Unmarshal(packetBytes, &packet); err != nil {
		t.Fatalf("parse claim packet failed: %v", err)
	}

	gitState := ClaimPacketGitState(packet, repoRoot)
	if gitState["isStale"] == true || gitState["comparisonStatus"] != "fresh-with-head-drift" {
		t.Fatalf("expected matching content hash to avoid stale state, got %#v", gitState)
	}
	changedFilesBasis := gitState["changedFilesBasis"].(map[string]any)
	if changedFilesBasis["scope"] != "committed-diff-between-packet-and-current-head" || gitState["workingTreePolicy"] != "excluded" {
		t.Fatalf("expected git state to describe committed-diff basis, got %#v", gitState)
	}
	if err := RequireFreshClaimPacket(packet, repoRoot, "claim review prepare-input", false); err != nil {
		t.Fatalf("expected matching content hash to satisfy freshness: %v", err)
	}
}

func TestClaimGitStateMarksSymlinkTargetChangeStale(t *testing.T) {
	repoRoot := t.TempDir()
	if err := execGit(repoRoot, "init"); err != nil {
		t.Fatalf("git init failed: %v", err)
	}
	if err := execGit(repoRoot, "config", "user.email", "cautilus@example.com"); err != nil {
		t.Fatalf("git config failed: %v", err)
	}
	if err := execGit(repoRoot, "config", "user.name", "Cautilus Test"); err != nil {
		t.Fatalf("git config failed: %v", err)
	}
	mustWriteFile(t, filepath.Join(repoRoot, "docs", "source.md"), "Agents must follow the symlinked workflow behavior.\n")
	if err := os.Symlink(filepath.Join("docs", "source.md"), filepath.Join(repoRoot, "LINK.md")); err != nil {
		t.Fatalf("Symlink returned error: %v", err)
	}
	if err := execGit(repoRoot, "add", "docs/source.md", "LINK.md"); err != nil {
		t.Fatalf("git add failed: %v", err)
	}
	if err := execGit(repoRoot, "commit", "-m", "initial"); err != nil {
		t.Fatalf("git commit failed: %v", err)
	}
	plan, err := DiscoverClaimProofPlan(ClaimDiscoveryOptions{RepoRoot: repoRoot, SourcePaths: []string{"LINK.md"}})
	if err != nil {
		t.Fatalf("DiscoverClaimProofPlan returned error: %v", err)
	}
	inventory := arrayOrEmpty(plan["sourceInventory"])
	if asMap(inventory[0])["contentPath"] != "docs/source.md" {
		t.Fatalf("expected symlink contentPath, got %#v", inventory)
	}
	mustWriteFile(t, filepath.Join(repoRoot, "docs", "source.md"), "Agents must follow the changed symlinked workflow behavior.\n")
	if err := execGit(repoRoot, "add", "docs/source.md"); err != nil {
		t.Fatalf("git add changed failed: %v", err)
	}
	if err := execGit(repoRoot, "commit", "-m", "change symlink target"); err != nil {
		t.Fatalf("git commit changed failed: %v", err)
	}

	gitState := ClaimPacketGitState(plan, repoRoot)
	if gitState["isStale"] != true {
		t.Fatalf("expected symlink target change to make claim packet stale, got %#v", gitState)
	}
	changedSources := stringArrayOrEmpty(gitState["changedSources"])
	if len(changedSources) != 1 || changedSources[0] != "docs/source.md" {
		t.Fatalf("expected changed symlink target as changed source, got %#v", changedSources)
	}
}
