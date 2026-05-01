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
						"path":             "internal/runtime/claim_discovery_test.go",
						"matchKind":        "verified",
						"contentHash":      "sha256:test",
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
		"When the goal is only to prove command routing, `cautilus eval test --runtime fixture` can run adapter-owned fixture results.",
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
	scenarioCommand := bySummary["The `cautilus scenario normalize chatbot` command emits reopenable proposal packets for review."]
	if scenarioCommand == nil || scenarioCommand["recommendedProof"] != "deterministic" {
		t.Fatalf("expected scenario command documentation to be deterministic, got %#v", scenarioCommand)
	}
	contextRecovery := bySummary["Context-recovery should become a protected scenario for follow-up behavior."]
	if contextRecovery == nil || contextRecovery["verificationReadiness"] != "needs-scenario" || contextRecovery["recommendedEvalSurface"] != "app/chat" {
		t.Fatalf("expected context recovery to stay an app/chat scenario candidate, got %#v", contextRecovery)
	}
	reopen := bySummary["Next step: a human decides whether to promote the scenario into a protected evaluation path, while an agent can reopen the saved result."]
	if reopen == nil || reopen["recommendedProof"] != "deterministic" {
		t.Fatalf("expected reopenable scenario-loop claim to be deterministic, got %#v", reopen)
	}
	skillEpisode := bySummary["The same preset can evaluate a multi-turn agent episode when the fixture provides turns."]
	if skillEpisode == nil || skillEpisode["recommendedEvalSurface"] != "dev/skill" {
		t.Fatalf("expected audit-backed agent episode to route to dev/skill, got %#v", skillEpisode)
	}
	fixtureRuntime := bySummary["When the goal is only to prove command routing, `cautilus eval test --runtime fixture` can run adapter-owned fixture results."]
	if fixtureRuntime == nil || fixtureRuntime["recommendedProof"] != "deterministic" {
		t.Fatalf("expected fixture runtime routing claim to be deterministic, got %#v", fixtureRuntime)
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

func TestDiscoverClaimProofPlanUsesAdapterClaimDiscoveryEntries(t *testing.T) {
	repoRoot := t.TempDir()
	mustWriteFile(t, filepath.Join(repoRoot, "README.md"), "README should not be scanned when adapter entries override defaults.\n")
	mustWriteFile(t, filepath.Join(repoRoot, ".agents", "cautilus-adapter.yaml"), strings.Join([]string{
		"version: 1",
		"repo: demo",
		"claim_discovery:",
		"  entries:",
		"    - docs/start.md",
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
	previous := filepath.Join(repoRoot, ".cautilus", "claims", "latest.json")
	mustWriteFile(t, previous, fmt.Sprintf(`{
  "schemaVersion": "cautilus.claim_proof_plan.v1",
  "gitCommit": %q,
  "sourceInventory": [{"path": "README.md", "kind": "readme", "status": "read", "depth": 0}],
  "claimCandidates": [
    {"claimId": "claim-readme-md-1", "sourceRefs": [{"path": "README.md"}]}
  ]
}
`, base))
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
