package runtime

import (
	"path/filepath"
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
	byLayer := map[string]map[string]any{}
	for _, raw := range candidates {
		entry := asMap(raw)
		byLayer[stringFromAny(entry["proofLayer"])] = entry
	}
	for _, layer := range []string{"human-auditable", "deterministic", "cautilus-eval"} {
		if byLayer[layer] == nil {
			t.Fatalf("missing %s candidate in %#v", layer, candidates)
		}
	}
	if byLayer["cautilus-eval"]["recommendedEvalSurface"] != "repo/whole-repo" {
		t.Fatalf("expected repo/whole-repo eval surface, got %#v", byLayer["cautilus-eval"])
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
	if entry["proofLayer"] != "cautilus-eval" {
		t.Fatalf("expected cautilus-eval candidate, got %#v", entry)
	}
}
