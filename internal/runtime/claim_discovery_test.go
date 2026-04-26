package runtime

import (
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
	for _, raw := range candidates {
		entry := asMap(raw)
		for _, field := range []string{"claimFingerprint", "recommendedProof", "verificationReadiness", "evidenceStatus", "reviewStatus", "lifecycle"} {
			if stringFromAny(entry[field]) == "" {
				t.Fatalf("candidate missing %s: %#v", field, entry)
			}
		}
		if entry["proofLayer"] != derivedProofLayer(stringFromAny(entry["recommendedProof"]), stringFromAny(entry["verificationReadiness"])) {
			t.Fatalf("legacy proofLayer does not match split fields: %#v", entry)
		}
	}
	if byLayer["cautilus-eval"]["recommendedEvalSurface"] != "repo/whole-repo" {
		t.Fatalf("expected repo/whole-repo eval surface, got %#v", byLayer["cautilus-eval"])
	}
	summary := asMap(plan["claimSummary"])
	if asMap(summary["byEvidenceStatus"])["unknown"] != 3 {
		t.Fatalf("expected unknown evidence summary, got %#v", summary)
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
	if entry["proofLayer"] != "cautilus-eval" {
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
}
