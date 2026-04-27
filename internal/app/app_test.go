package app

import (
	"bytes"
	"encoding/json"
	"fmt"
	"os"
	"path/filepath"
	"strings"
	"testing"
	"time"

	"github.com/corca-ai/cautilus/internal/cli"
	"github.com/corca-ai/cautilus/internal/contracts"
)

func TestRunVersionUsesEnvVersionWithoutToolRoot(t *testing.T) {
	t.Setenv("CAUTILUS_CALLER_CWD", t.TempDir())
	t.Setenv("CAUTILUS_TOOL_ROOT", "")
	t.Setenv("CAUTILUS_VERSION", "v9.8.7")

	var stdout bytes.Buffer
	var stderr bytes.Buffer
	exitCode := Run([]string{"--version"}, &stdout, &stderr)
	if exitCode != 0 {
		t.Fatalf("Run returned exit code %d, stderr=%s", exitCode, stderr.String())
	}
	if stdout.String() != "9.8.7\n" {
		t.Fatalf("unexpected stdout: %q", stdout.String())
	}
	if stderr.Len() != 0 {
		t.Fatalf("unexpected stderr: %q", stderr.String())
	}
}

func TestRunVersionVerboseEmitsVersionStateJSON(t *testing.T) {
	t.Setenv("CAUTILUS_CALLER_CWD", t.TempDir())
	t.Setenv("CAUTILUS_TOOL_ROOT", "")
	t.Setenv("CAUTILUS_VERSION", "v9.8.7")
	t.Setenv("XDG_CACHE_HOME", t.TempDir())

	var stdout bytes.Buffer
	var stderr bytes.Buffer
	exitCode := Run([]string{"version", "--verbose"}, &stdout, &stderr)
	if exitCode != 0 {
		t.Fatalf("Run returned exit code %d, stderr=%s", exitCode, stderr.String())
	}
	var payload map[string]any
	if err := json.Unmarshal(stdout.Bytes(), &payload); err != nil {
		t.Fatalf("Unmarshal returned error: %v", err)
	}
	current, ok := payload["current"].(map[string]any)
	if !ok {
		t.Fatalf("expected current object, got %#v", payload)
	}
	if current["version"] != "9.8.7" {
		t.Fatalf("expected version 9.8.7, got %#v", current["version"])
	}
	if current["source"] != string(cli.VersionSourceEnv) {
		t.Fatalf("expected env source, got %#v", current["source"])
	}
}

func TestRunDoctorDoesNotRequireToolRootForNativeCommands(t *testing.T) {
	repoRoot := t.TempDir()
	initGitRepo(t, repoRoot)
	agentsDir := filepath.Join(repoRoot, ".agents")
	if err := os.MkdirAll(agentsDir, 0o755); err != nil {
		t.Fatalf("MkdirAll returned error: %v", err)
	}
	adapter := strings.Join([]string{
		"version: 1",
		"repo: temp",
		"evaluation_surfaces:",
		"  - smoke",
		"baseline_options:",
		"  - baseline git ref via {baseline_ref}",
		"eval_test_command_templates:",
		"  - npm run check",
		"",
	}, "\n")
	if err := os.WriteFile(filepath.Join(agentsDir, "cautilus-adapter.yaml"), []byte(adapter), 0o644); err != nil {
		t.Fatalf("WriteFile returned error: %v", err)
	}

	t.Setenv("CAUTILUS_CALLER_CWD", repoRoot)
	t.Setenv("CAUTILUS_TOOL_ROOT", "")
	t.Setenv("CAUTILUS_VERSION", "")

	var stdout bytes.Buffer
	var stderr bytes.Buffer
	exitCode := Run([]string{"doctor", "--repo-root", "."}, &stdout, &stderr)
	if exitCode != 0 {
		t.Fatalf("Run returned exit code %d, stderr=%s", exitCode, stderr.String())
	}
	var payload map[string]any
	if err := json.Unmarshal(stdout.Bytes(), &payload); err != nil {
		t.Fatalf("Unmarshal returned error: %v", err)
	}
	if ready, ok := payload["ready"].(bool); !ok || !ready {
		t.Fatalf("expected ready doctor payload, got %#v", payload)
	}
}

func TestRunDoctorHelpReturnsZeroAndUsage(t *testing.T) {
	t.Setenv("CAUTILUS_CALLER_CWD", t.TempDir())
	t.Setenv("CAUTILUS_TOOL_ROOT", "")

	var stdout bytes.Buffer
	var stderr bytes.Buffer
	exitCode := Run([]string{"doctor", "--help"}, &stdout, &stderr)
	if exitCode != 0 {
		t.Fatalf("expected exit code 0, got %d, stderr=%s", exitCode, stderr.String())
	}
	if !strings.Contains(stdout.String(), "cautilus doctor [args]") {
		t.Fatalf("expected doctor usage, got %q", stdout.String())
	}
	if stderr.Len() != 0 {
		t.Fatalf("unexpected stderr: %q", stderr.String())
	}
}

func TestRunCommandsJSONReturnsRegistry(t *testing.T) {
	t.Setenv("CAUTILUS_CALLER_CWD", t.TempDir())
	t.Setenv("CAUTILUS_TOOL_ROOT", "")

	var stdout bytes.Buffer
	var stderr bytes.Buffer
	exitCode := Run([]string{"commands", "--json"}, &stdout, &stderr)
	if exitCode != 0 {
		t.Fatalf("expected exit code 0, got %d, stderr=%s", exitCode, stderr.String())
	}
	var payload map[string]any
	if err := json.Unmarshal(stdout.Bytes(), &payload); err != nil {
		t.Fatalf("Unmarshal returned error: %v", err)
	}
	if payload["schemaVersion"] != "cautilus.commands.v1" {
		t.Fatalf("unexpected schemaVersion: %#v", payload["schemaVersion"])
	}
	commands, ok := payload["commands"].([]any)
	if !ok || len(commands) == 0 {
		t.Fatalf("expected commands payload, got %#v", payload)
	}
	foundClaimDiscover := false
	foundClaimShow := false
	foundClaimReviewPrepare := false
	foundClaimReviewApply := false
	foundClaimPlanEvals := false
	foundClaimValidate := false
	foundAgentStatus := false
	for _, raw := range commands {
		command := raw.(map[string]any)
		path := command["path"].([]any)
		if len(path) == 2 && path[0] == "claim" && path[1] == "discover" {
			foundClaimDiscover = true
		}
		if len(path) == 2 && path[0] == "claim" && path[1] == "show" {
			foundClaimShow = true
		}
		if len(path) == 3 && path[0] == "claim" && path[1] == "review" && path[2] == "prepare-input" {
			foundClaimReviewPrepare = true
		}
		if len(path) == 3 && path[0] == "claim" && path[1] == "review" && path[2] == "apply-result" {
			foundClaimReviewApply = true
		}
		if len(path) == 2 && path[0] == "claim" && path[1] == "plan-evals" {
			foundClaimPlanEvals = true
		}
		if len(path) == 2 && path[0] == "claim" && path[1] == "validate" {
			foundClaimValidate = true
		}
		if len(path) == 2 && path[0] == "agent" && path[1] == "status" {
			foundAgentStatus = true
		}
	}
	if !foundClaimDiscover || !foundClaimShow || !foundClaimReviewPrepare || !foundClaimReviewApply || !foundClaimPlanEvals || !foundClaimValidate || !foundAgentStatus {
		t.Fatalf("expected commands payload to include claim commands, got %#v", commands)
	}
}

func TestRunAgentStatusJSONReturnsNoInputOrientation(t *testing.T) {
	baseDir := t.TempDir()
	repoRoot := filepath.Join(baseDir, "repo with spaces")
	if err := os.MkdirAll(repoRoot, 0o755); err != nil {
		t.Fatalf("MkdirAll returned error: %v", err)
	}
	initGitRepo(t, repoRoot)
	if err := os.MkdirAll(filepath.Join(repoRoot, ".agents", "skills", "cautilus"), 0o755); err != nil {
		t.Fatalf("MkdirAll returned error: %v", err)
	}
	if err := os.WriteFile(filepath.Join(repoRoot, ".agents", "skills", "cautilus", "SKILL.md"), []byte("# Cautilus\n"), 0o644); err != nil {
		t.Fatalf("WriteFile returned error: %v", err)
	}
	if err := os.MkdirAll(filepath.Join(repoRoot, ".claude", "skills"), 0o755); err != nil {
		t.Fatalf("MkdirAll returned error: %v", err)
	}
	adapter := strings.Join([]string{
		"version: 1",
		"repo: temp",
		"evaluation_surfaces:",
		"  - skill",
		"claim_discovery:",
		"  entries:",
		"    - README.md",
		"  linked_markdown_depth: 3",
		"  state_path: state dir/latest claims.json",
		"",
	}, "\n")
	if err := os.WriteFile(filepath.Join(repoRoot, ".agents", "cautilus-adapter.yaml"), []byte(adapter), 0o644); err != nil {
		t.Fatalf("WriteFile returned error: %v", err)
	}
	if err := os.WriteFile(filepath.Join(repoRoot, "README.md"), []byte("# Temp\n"), 0o644); err != nil {
		t.Fatalf("WriteFile returned error: %v", err)
	}

	callerCWD := filepath.Join(baseDir, "caller")
	if err := os.MkdirAll(callerCWD, 0o755); err != nil {
		t.Fatalf("MkdirAll caller cwd returned error: %v", err)
	}
	t.Setenv("CAUTILUS_CALLER_CWD", callerCWD)
	t.Setenv("CAUTILUS_TOOL_ROOT", "")
	t.Setenv("CAUTILUS_VERSION", "v1.2.3")
	t.Setenv("XDG_CACHE_HOME", t.TempDir())

	var stdout bytes.Buffer
	var stderr bytes.Buffer
	exitCode := Run([]string{"agent", "status", "--repo-root", repoRoot, "--json"}, &stdout, &stderr)
	if exitCode != 0 {
		t.Fatalf("Run returned exit code %d, stderr=%s", exitCode, stderr.String())
	}
	var payload map[string]any
	if err := json.Unmarshal(stdout.Bytes(), &payload); err != nil {
		t.Fatalf("Unmarshal returned error: %v", err)
	}
	if payload["schemaVersion"] != contracts.AgentStatusSchema {
		t.Fatalf("unexpected schemaVersion: %#v", payload["schemaVersion"])
	}
	if payload["mode"] != "orientation" {
		t.Fatalf("expected orientation mode, got %#v", payload["mode"])
	}
	claimState := payload["claimState"].(map[string]any)
	if claimState["status"] != "missing" {
		t.Fatalf("expected missing claim state, got %#v", claimState)
	}
	scanScope := payload["scanScope"].(map[string]any)
	if scanScope["linkedMarkdownDepth"] != float64(3) {
		t.Fatalf("expected depth 3 scan scope, got %#v", scanScope["linkedMarkdownDepth"])
	}
	body := stdout.String()
	if !strings.Contains(body, "run_first_claim_scan") {
		t.Fatalf("expected first claim scan branch, got %s", body)
	}
	if !strings.Contains(body, "cautilus claim discover --repo-root '"+repoRoot+"' --output '"+filepath.Join(repoRoot, "state dir", "latest claims.json")+"'") {
		t.Fatalf("expected claim branch to keep the requested repo root and quote paths, got %s", body)
	}
	for _, forbidden := range []string{"eval test", "review variants", "optimize", "git commit"} {
		if strings.Contains(body, forbidden) {
			t.Fatalf("agent status should not offer %q, got %s", forbidden, body)
		}
	}
}

func TestRunClaimDiscoverWritesProofPlanFromTinyRepo(t *testing.T) {
	repoRoot := t.TempDir()
	if err := os.WriteFile(filepath.Join(repoRoot, "README.md"), []byte(strings.Join([]string{
		"# Tiny Product",
		"",
		"This tool emits a human-auditable setup checklist.",
		"The deterministic unit test suite proves the parser accepts valid packets.",
		"",
	}, "\n")), 0o644); err != nil {
		t.Fatalf("WriteFile returned error: %v", err)
	}
	if err := os.WriteFile(filepath.Join(repoRoot, "AGENTS.md"), []byte(strings.Join([]string{
		"# Agent Contract",
		"",
		"Agents must follow the repo operating contract before changing code.",
		"",
	}, "\n")), 0o644); err != nil {
		t.Fatalf("WriteFile returned error: %v", err)
	}
	outputPath := filepath.Join(repoRoot, ".cautilus", "claims", "latest.json")

	t.Setenv("CAUTILUS_CALLER_CWD", repoRoot)
	t.Setenv("CAUTILUS_TOOL_ROOT", "")

	var stdout bytes.Buffer
	var stderr bytes.Buffer
	exitCode := Run([]string{"claim", "discover", "--repo-root", ".", "--output", outputPath}, &stdout, &stderr)
	if exitCode != 0 {
		t.Fatalf("expected exit code 0, got %d, stderr=%s", exitCode, stderr.String())
	}
	if stdout.Len() != 0 {
		t.Fatalf("expected empty stdout when writing output, got %q", stdout.String())
	}
	payload := readJSONObjectFile(t, outputPath)
	if payload["schemaVersion"] != "cautilus.claim_proof_plan.v1" {
		t.Fatalf("unexpected schemaVersion: %#v", payload["schemaVersion"])
	}
	candidates := payload["claimCandidates"].([]any)
	seenLayers := map[string]bool{}
	for _, raw := range candidates {
		entry := raw.(map[string]any)
		seenLayers[entry["proofLayer"].(string)] = true
	}
	for _, layer := range []string{"human-auditable", "deterministic", "cautilus-eval"} {
		if !seenLayers[layer] {
			t.Fatalf("expected %s candidate in %#v", layer, candidates)
		}
	}
}

func TestRunClaimShowSummarizesExistingProofPlan(t *testing.T) {
	repoRoot := t.TempDir()
	claimsPath := filepath.Join(repoRoot, "claims.json")
	if err := os.WriteFile(claimsPath, []byte(strings.Join([]string{
		`{`,
		`  "schemaVersion": "cautilus.claim_proof_plan.v1",`,
		`  "sourceRoot": ".",`,
		`  "sourceInventory": [{"path": "README.md", "kind": "readme", "status": "read", "depth": 0}],`,
		`  "claimCandidates": [`,
		`    {`,
		`      "claimId": "claim-readme-md-3",`,
		`      "claimFingerprint": "sha256:demo",`,
		`      "summary": "Agents must keep behavior review bounded.",`,
		`      "recommendedProof": "cautilus-eval",`,
		`      "recommendedEvalSurface": "dev/repo",`,
		`      "verificationReadiness": "ready-to-verify",`,
		`      "evidenceStatus": "unknown",`,
		`      "reviewStatus": "heuristic",`,
		`      "lifecycle": "new",`,
		`      "groupHints": ["cautilus-eval"],`,
		`      "evidenceRefs": [],`,
		`      "sourceRefs": [{"path": "README.md", "line": 3, "excerpt": "Agents must keep behavior review bounded."}],`,
		`      "proofLayer": "cautilus-eval"`,
		`    }`,
		`  ]`,
		`}`,
	}, "\n")), 0o644); err != nil {
		t.Fatalf("WriteFile returned error: %v", err)
	}
	t.Setenv("CAUTILUS_CALLER_CWD", repoRoot)
	t.Setenv("CAUTILUS_TOOL_ROOT", "")

	var stdout bytes.Buffer
	var stderr bytes.Buffer
	exitCode := Run([]string{"claim", "show", "--input", claimsPath, "--sample-claims", "1"}, &stdout, &stderr)
	if exitCode != 0 {
		t.Fatalf("expected exit code 0, got %d, stderr=%s", exitCode, stderr.String())
	}
	var payload map[string]any
	if err := json.Unmarshal(stdout.Bytes(), &payload); err != nil {
		t.Fatalf("Unmarshal returned error: %v", err)
	}
	if payload["schemaVersion"] != "cautilus.claim_status_summary.v1" || payload["candidateCount"] != float64(1) {
		t.Fatalf("unexpected claim show payload: %#v", payload)
	}
	if payload["inputPath"] != "claims.json" {
		t.Fatalf("expected repo-relative display input path, got %#v", payload["inputPath"])
	}
	samples := payload["sampleClaims"].([]any)
	if len(samples) != 1 {
		t.Fatalf("expected one sample claim, got %#v", payload)
	}
	sample := samples[0].(map[string]any)
	if sample["claimId"] != "claim-readme-md-3" || sample["summary"] == "" {
		t.Fatalf("expected sample claim identity and summary, got %#v", sample)
	}
}

func TestRunClaimShowReportsStaleGitState(t *testing.T) {
	repoRoot := t.TempDir()
	initGitRepo(t, repoRoot)
	claimsPath := filepath.Join(repoRoot, "claims.json")
	if err := os.WriteFile(claimsPath, []byte(minimalClaimPacketJSON("0000000000000000000000000000000000000000")), 0o644); err != nil {
		t.Fatalf("WriteFile returned error: %v", err)
	}
	t.Setenv("CAUTILUS_CALLER_CWD", repoRoot)
	t.Setenv("CAUTILUS_TOOL_ROOT", "")

	var stdout bytes.Buffer
	var stderr bytes.Buffer
	exitCode := Run([]string{"claim", "show", "--input", claimsPath}, &stdout, &stderr)
	if exitCode != 0 {
		t.Fatalf("expected exit code 0, got %d, stderr=%s", exitCode, stderr.String())
	}
	var payload map[string]any
	if err := json.Unmarshal(stdout.Bytes(), &payload); err != nil {
		t.Fatalf("Unmarshal returned error: %v", err)
	}
	gitState := payload["gitState"].(map[string]any)
	if gitState["isStale"] != true || gitState["comparisonStatus"] != "stale" {
		t.Fatalf("expected stale git state, got %#v", gitState)
	}
	if gitState["currentGitCommit"] == "" {
		t.Fatalf("expected current git commit in %#v", gitState)
	}
}

func TestRunClaimReviewPrepareInputWritesClusters(t *testing.T) {
	repoRoot := t.TempDir()
	claimsPath := filepath.Join(repoRoot, "claims.json")
	outputPath := filepath.Join(repoRoot, "review-input.json")
	if err := os.WriteFile(claimsPath, []byte(strings.Join([]string{
		`{`,
		`  "schemaVersion": "cautilus.claim_proof_plan.v1",`,
		`  "sourceRoot": ".",`,
		`  "sourceInventory": [{"path": "README.md", "kind": "readme", "status": "read", "depth": 0}],`,
		`  "claimCandidates": [`,
		`    {`,
		`      "claimId": "claim-readme-md-3",`,
		`      "claimFingerprint": "sha256:demo",`,
		`      "summary": "Agents must keep behavior review bounded.",`,
		`      "recommendedProof": "cautilus-eval",`,
		`      "recommendedEvalSurface": "dev/repo",`,
		`      "verificationReadiness": "ready-to-verify",`,
		`      "evidenceStatus": "unknown",`,
		`      "reviewStatus": "heuristic",`,
		`      "lifecycle": "new",`,
		`      "groupHints": ["cautilus-eval"],`,
		`      "evidenceRefs": [],`,
		`      "sourceRefs": [{"path": "README.md", "line": 3, "excerpt": "Agents must keep behavior review bounded."}],`,
		`      "proofLayer": "cautilus-eval"`,
		`    }`,
		`  ]`,
		`}`,
	}, "\n")), 0o644); err != nil {
		t.Fatalf("WriteFile returned error: %v", err)
	}
	t.Setenv("CAUTILUS_CALLER_CWD", repoRoot)
	t.Setenv("CAUTILUS_TOOL_ROOT", "")

	var stdout bytes.Buffer
	var stderr bytes.Buffer
	exitCode := Run([]string{
		"claim", "review", "prepare-input",
		"--claims", claimsPath,
		"--max-clusters", "1",
		"--output", outputPath,
	}, &stdout, &stderr)
	if exitCode != 0 {
		t.Fatalf("expected exit code 0, got %d, stderr=%s", exitCode, stderr.String())
	}
	payload := readJSONObjectFile(t, outputPath)
	if payload["schemaVersion"] != "cautilus.claim_review_input.v1" {
		t.Fatalf("unexpected schemaVersion: %#v", payload["schemaVersion"])
	}
	if clusters := payload["clusters"].([]any); len(clusters) != 1 {
		t.Fatalf("expected one review cluster, got %#v", payload)
	}
}

func TestRunClaimReviewPrepareInputRejectsStaleClaimPacket(t *testing.T) {
	repoRoot := t.TempDir()
	initGitRepo(t, repoRoot)
	claimsPath := filepath.Join(repoRoot, "claims.json")
	outputPath := filepath.Join(repoRoot, "review-input.json")
	if err := os.WriteFile(claimsPath, []byte(minimalClaimPacketJSON("0000000000000000000000000000000000000000")), 0o644); err != nil {
		t.Fatalf("WriteFile returned error: %v", err)
	}
	t.Setenv("CAUTILUS_CALLER_CWD", repoRoot)
	t.Setenv("CAUTILUS_TOOL_ROOT", "")

	var stdout bytes.Buffer
	var stderr bytes.Buffer
	exitCode := Run([]string{"claim", "review", "prepare-input", "--claims", claimsPath, "--output", outputPath}, &stdout, &stderr)
	if exitCode != 1 {
		t.Fatalf("expected stale claim packet rejection, got exit %d stdout=%s stderr=%s", exitCode, stdout.String(), stderr.String())
	}
	if !strings.Contains(stderr.String(), "requires a fresh claim packet") {
		t.Fatalf("expected freshness error, got %q", stderr.String())
	}

	stdout.Reset()
	stderr.Reset()
	exitCode = Run([]string{"claim", "review", "prepare-input", "--claims", claimsPath, "--allow-stale-claims", "--output", outputPath}, &stdout, &stderr)
	if exitCode != 0 {
		t.Fatalf("expected override to succeed, got exit %d stderr=%s", exitCode, stderr.String())
	}
}

func TestRunClaimReviewApplyResultWritesReviewedClaims(t *testing.T) {
	repoRoot := t.TempDir()
	claimsPath := filepath.Join(repoRoot, "claims.json")
	reviewResultPath := filepath.Join(repoRoot, "review-result.json")
	outputPath := filepath.Join(repoRoot, "reviewed-claims.json")
	if err := os.WriteFile(claimsPath, []byte(strings.Join([]string{
		`{`,
		`  "schemaVersion": "cautilus.claim_proof_plan.v1",`,
		`  "sourceRoot": ".",`,
		`  "sourceInventory": [{"path": "README.md", "kind": "readme", "status": "read", "depth": 0}],`,
		`  "claimCandidates": [`,
		`    {`,
		`      "claimId": "claim-readme-md-3",`,
		`      "claimFingerprint": "sha256:demo",`,
		`      "summary": "Agents must keep behavior review bounded.",`,
		`      "recommendedProof": "cautilus-eval",`,
		`      "recommendedEvalSurface": "dev/repo",`,
		`      "verificationReadiness": "ready-to-verify",`,
		`      "evidenceStatus": "unknown",`,
		`      "reviewStatus": "heuristic",`,
		`      "lifecycle": "new",`,
		`      "groupHints": ["cautilus-eval"],`,
		`      "evidenceRefs": [],`,
		`      "sourceRefs": [{"path": "README.md", "line": 3, "excerpt": "Agents must keep behavior review bounded."}],`,
		`      "proofLayer": "cautilus-eval"`,
		`    }`,
		`  ]`,
		`}`,
	}, "\n")), 0o644); err != nil {
		t.Fatalf("WriteFile returned error: %v", err)
	}
	if err := os.WriteFile(reviewResultPath, []byte(strings.Join([]string{
		`{`,
		`  "schemaVersion": "cautilus.claim_review_result.v1",`,
		`  "reviewRun": {"reviewer": "fixture-reviewer"},`,
		`  "clusterResults": [`,
		`    {`,
		`      "clusterId": "cluster-readme",`,
		`      "claimUpdates": [`,
		`        {`,
		`          "claimId": "claim-readme-md-3",`,
		`          "reviewStatus": "agent-reviewed",`,
		`          "evidenceStatus": "satisfied",`,
		`          "evidenceRefs": [`,
		`            {`,
		`              "kind": "test",`,
		`              "path": "internal/app/app_test.go",`,
		`              "matchKind": "direct",`,
		`              "contentHash": "sha256:test",`,
		`              "supportsClaimIds": ["claim-readme-md-3"]`,
		`            }`,
		`          ]`,
		`        }`,
		`      ]`,
		`    }`,
		`  ]`,
		`}`,
	}, "\n")), 0o644); err != nil {
		t.Fatalf("WriteFile returned error: %v", err)
	}
	t.Setenv("CAUTILUS_CALLER_CWD", repoRoot)
	t.Setenv("CAUTILUS_TOOL_ROOT", "")

	var stdout bytes.Buffer
	var stderr bytes.Buffer
	exitCode := Run([]string{
		"claim", "review", "apply-result",
		"--claims", claimsPath,
		"--review-result", reviewResultPath,
		"--output", outputPath,
	}, &stdout, &stderr)
	if exitCode != 0 {
		t.Fatalf("expected exit code 0, got %d, stderr=%s", exitCode, stderr.String())
	}
	payload := readJSONObjectFile(t, outputPath)
	candidate := payload["claimCandidates"].([]any)[0].(map[string]any)
	if candidate["reviewStatus"] != "agent-reviewed" || candidate["evidenceStatus"] != "satisfied" {
		t.Fatalf("expected reviewed satisfied candidate, got %#v", candidate)
	}
}

func minimalClaimPacketJSON(gitCommit string) string {
	return strings.Join([]string{
		`{`,
		`  "schemaVersion": "cautilus.claim_proof_plan.v1",`,
		`  "sourceRoot": ".",`,
		fmt.Sprintf(`  "gitCommit": %q,`, gitCommit),
		`  "sourceInventory": [{"path": "README.md", "kind": "readme", "status": "read", "depth": 0}],`,
		`  "claimCandidates": [`,
		`    {`,
		`      "claimId": "claim-readme-md-3",`,
		`      "claimFingerprint": "sha256:demo",`,
		`      "summary": "Agents must keep behavior review bounded.",`,
		`      "recommendedProof": "cautilus-eval",`,
		`      "recommendedEvalSurface": "dev/repo",`,
		`      "verificationReadiness": "ready-to-verify",`,
		`      "evidenceStatus": "unknown",`,
		`      "reviewStatus": "heuristic",`,
		`      "lifecycle": "new",`,
		`      "groupHints": ["cautilus-eval"],`,
		`      "evidenceRefs": [],`,
		`      "sourceRefs": [{"path": "README.md", "line": 3, "excerpt": "Agents must keep behavior review bounded."}],`,
		`      "proofLayer": "cautilus-eval"`,
		`    }`,
		`  ]`,
		`}`,
	}, "\n")
}

func TestRunClaimPlanEvalsWritesIntermediatePlan(t *testing.T) {
	repoRoot := t.TempDir()
	claimsPath := filepath.Join(repoRoot, "reviewed-claims.json")
	outputPath := filepath.Join(repoRoot, "eval-plan.json")
	if err := os.WriteFile(claimsPath, []byte(strings.Join([]string{
		`{`,
		`  "schemaVersion": "cautilus.claim_proof_plan.v1",`,
		`  "sourceRoot": ".",`,
		`  "sourceInventory": [{"path": "AGENTS.md", "kind": "repo-instructions", "status": "read", "depth": 0}],`,
		`  "claimCandidates": [`,
		`    {`,
		`      "claimId": "claim-agents-md-3",`,
		`      "claimFingerprint": "sha256:demo",`,
		`      "summary": "Agents must follow the repo operating contract before changing code.",`,
		`      "recommendedProof": "cautilus-eval",`,
		`      "recommendedEvalSurface": "dev/repo",`,
		`      "verificationReadiness": "ready-to-verify",`,
		`      "evidenceStatus": "missing",`,
		`      "reviewStatus": "agent-reviewed",`,
		`      "lifecycle": "new",`,
		`      "groupHints": ["cautilus-eval"],`,
		`      "evidenceRefs": [],`,
		`      "sourceRefs": [{"path": "AGENTS.md", "line": 3, "excerpt": "Agents must follow the repo operating contract before changing code."}],`,
		`      "proofLayer": "cautilus-eval"`,
		`    }`,
		`  ]`,
		`}`,
	}, "\n")), 0o644); err != nil {
		t.Fatalf("WriteFile returned error: %v", err)
	}
	t.Setenv("CAUTILUS_CALLER_CWD", repoRoot)
	t.Setenv("CAUTILUS_TOOL_ROOT", "")

	var stdout bytes.Buffer
	var stderr bytes.Buffer
	exitCode := Run([]string{
		"claim", "plan-evals",
		"--claims", claimsPath,
		"--output", outputPath,
	}, &stdout, &stderr)
	if exitCode != 0 {
		t.Fatalf("expected exit code 0, got %d, stderr=%s", exitCode, stderr.String())
	}
	payload := readJSONObjectFile(t, outputPath)
	if payload["schemaVersion"] != "cautilus.claim_eval_plan.v1" {
		t.Fatalf("unexpected schemaVersion: %#v", payload["schemaVersion"])
	}
	plans := payload["evalPlans"].([]any)
	if len(plans) != 1 {
		t.Fatalf("expected one eval plan, got %#v", payload)
	}
	first := plans[0].(map[string]any)
	if first["claimId"] != "claim-agents-md-3" || first["targetSurface"] != "dev/repo" {
		t.Fatalf("unexpected eval plan: %#v", first)
	}
}

func TestRunClaimValidateWritesReportAndFailsInvalidEvidence(t *testing.T) {
	repoRoot := t.TempDir()
	claimsPath := filepath.Join(repoRoot, "claims.json")
	outputPath := filepath.Join(repoRoot, "validation.json")
	if err := os.WriteFile(claimsPath, []byte(strings.Join([]string{
		`{`,
		`  "schemaVersion": "cautilus.claim_proof_plan.v1",`,
		`  "sourceRoot": ".",`,
		`  "sourceInventory": [{"path": "AGENTS.md", "kind": "repo-instructions", "status": "read", "depth": 0}],`,
		`  "claimCandidates": [`,
		`    {`,
		`      "claimId": "claim-agents-md-3",`,
		`      "claimFingerprint": "sha256:demo",`,
		`      "summary": "Agents must follow the repo operating contract before changing code.",`,
		`      "recommendedProof": "cautilus-eval",`,
		`      "recommendedEvalSurface": "dev/repo",`,
		`      "verificationReadiness": "ready-to-verify",`,
		`      "evidenceStatus": "satisfied",`,
		`      "reviewStatus": "agent-reviewed",`,
		`      "lifecycle": "new",`,
		`      "groupHints": ["cautilus-eval"],`,
		`      "evidenceRefs": [`,
		`        {`,
		`          "kind": "test",`,
		`          "path": "internal/app/app_test.go",`,
		`          "matchKind": "possible",`,
		`          "contentHash": "sha256:test",`,
		`          "supportsClaimIds": ["claim-agents-md-3"]`,
		`        }`,
		`      ],`,
		`      "sourceRefs": [{"path": "AGENTS.md", "line": 3, "excerpt": "Agents must follow the repo operating contract before changing code."}],`,
		`      "proofLayer": "cautilus-eval"`,
		`    }`,
		`  ]`,
		`}`,
	}, "\n")), 0o644); err != nil {
		t.Fatalf("WriteFile returned error: %v", err)
	}
	t.Setenv("CAUTILUS_CALLER_CWD", repoRoot)
	t.Setenv("CAUTILUS_TOOL_ROOT", "")

	var stdout bytes.Buffer
	var stderr bytes.Buffer
	exitCode := Run([]string{
		"claim", "validate",
		"--claims", claimsPath,
		"--output", outputPath,
	}, &stdout, &stderr)
	if exitCode == 0 {
		t.Fatalf("expected non-zero exit code for invalid evidence")
	}
	payload := readJSONObjectFile(t, outputPath)
	if payload["schemaVersion"] != "cautilus.claim_validation_report.v1" || payload["valid"] != false {
		t.Fatalf("unexpected validation payload: %#v", payload)
	}
	if payload["inputPath"] != "claims.json" {
		t.Fatalf("expected repo-relative validation input path, got %#v", payload["inputPath"])
	}
	if issues := payload["issues"].([]any); len(issues) == 0 {
		t.Fatalf("expected validation issues, got %#v", payload)
	}
}

func TestRunClaimDiscoverExampleOutputMatchesFixture(t *testing.T) {
	t.Setenv("CAUTILUS_CALLER_CWD", t.TempDir())
	t.Setenv("CAUTILUS_TOOL_ROOT", "")

	var stdout bytes.Buffer
	var stderr bytes.Buffer
	exitCode := Run([]string{"claim", "discover", "--example-output"}, &stdout, &stderr)
	if exitCode != 0 {
		t.Fatalf("expected exit code 0, got %d, stderr=%s", exitCode, stderr.String())
	}
	fixture, err := os.ReadFile(filepath.Join("..", "..", "fixtures", "claim-discovery", "example-proof-plan.json"))
	if err != nil {
		t.Fatalf("ReadFile returned error: %v", err)
	}
	if stdout.String() != string(fixture) {
		t.Fatalf("example output drifted from fixture\nstdout:\n%s\nfixture:\n%s", stdout.String(), string(fixture))
	}
}

func TestRunScenariosReturnsCatalog(t *testing.T) {
	t.Setenv("CAUTILUS_CALLER_CWD", t.TempDir())
	t.Setenv("CAUTILUS_TOOL_ROOT", "")

	var stdout bytes.Buffer
	var stderr bytes.Buffer
	exitCode := Run([]string{"scenarios"}, &stdout, &stderr)
	if exitCode != 0 {
		t.Fatalf("expected exit code 0, got %d, stderr=%s", exitCode, stderr.String())
	}
	for _, want := range []string{"chatbot", "skill", "workflow", "cautilus.scenarios.v1"} {
		if !strings.Contains(stdout.String(), want) {
			t.Fatalf("expected stdout to mention %q, got %q", want, stdout.String())
		}
	}
}

func TestRunScenariosJSONReturnsThreeArchetypes(t *testing.T) {
	t.Setenv("CAUTILUS_CALLER_CWD", t.TempDir())
	t.Setenv("CAUTILUS_TOOL_ROOT", "")

	var stdout bytes.Buffer
	var stderr bytes.Buffer
	exitCode := Run([]string{"scenarios", "--json"}, &stdout, &stderr)
	if exitCode != 0 {
		t.Fatalf("expected exit code 0, got %d, stderr=%s", exitCode, stderr.String())
	}
	var payload map[string]any
	if err := json.Unmarshal(stdout.Bytes(), &payload); err != nil {
		t.Fatalf("Unmarshal returned error: %v", err)
	}
	if payload["schemaVersion"] != "cautilus.scenarios.v1" {
		t.Fatalf("unexpected schemaVersion: %#v", payload["schemaVersion"])
	}
	archetypes, ok := payload["archetypes"].([]any)
	if !ok || len(archetypes) != 3 {
		t.Fatalf("expected 3 archetypes, got %#v", payload["archetypes"])
	}
	seen := map[string]bool{}
	for _, entry := range archetypes {
		obj, ok := entry.(map[string]any)
		if !ok {
			t.Fatalf("archetype entry is not an object: %#v", entry)
		}
		name, _ := obj["archetype"].(string)
		seen[name] = true
		for _, field := range []string{"summary", "exampleInput", "nextStepCli", "contractDoc", "inputSchema", "behaviorFocus"} {
			if value, _ := obj[field].(string); strings.TrimSpace(value) == "" {
				t.Fatalf("archetype %q missing %s: %#v", name, field, obj)
			}
		}
	}
	for _, want := range []string{"chatbot", "skill", "workflow"} {
		if !seen[want] {
			t.Fatalf("expected archetype %q in payload, got %#v", want, seen)
		}
	}
}

func TestRunHealthcheckJSONReturnsHealthyPayload(t *testing.T) {
	t.Setenv("CAUTILUS_CALLER_CWD", t.TempDir())
	t.Setenv("CAUTILUS_TOOL_ROOT", "")
	t.Setenv("CAUTILUS_VERSION", "v9.8.7")
	t.Setenv("XDG_CACHE_HOME", t.TempDir())

	var stdout bytes.Buffer
	var stderr bytes.Buffer
	exitCode := Run([]string{"healthcheck", "--json"}, &stdout, &stderr)
	if exitCode != 0 {
		t.Fatalf("expected exit code 0, got %d, stderr=%s", exitCode, stderr.String())
	}
	var payload map[string]any
	if err := json.Unmarshal(stdout.Bytes(), &payload); err != nil {
		t.Fatalf("Unmarshal returned error: %v", err)
	}
	if payload["status"] != "healthy" || payload["healthy"] != true {
		t.Fatalf("expected healthy payload, got %#v", payload)
	}
}

func TestRunPrefixHelpWorksForCommandGroups(t *testing.T) {
	t.Setenv("CAUTILUS_CALLER_CWD", t.TempDir())
	t.Setenv("CAUTILUS_TOOL_ROOT", "")

	var stdout bytes.Buffer
	var stderr bytes.Buffer
	exitCode := Run([]string{"optimize", "search", "--help"}, &stdout, &stderr)
	if exitCode != 0 {
		t.Fatalf("expected exit code 0, got %d, stderr=%s", exitCode, stderr.String())
	}
	if !strings.Contains(stdout.String(), "cautilus optimize search prepare-input [args]") {
		t.Fatalf("expected grouped optimize search help, got %q", stdout.String())
	}
}

func TestRunSkillsInstallDoesNotRequireToolRoot(t *testing.T) {
	repoRoot := t.TempDir()
	t.Setenv("CAUTILUS_CALLER_CWD", repoRoot)
	t.Setenv("CAUTILUS_TOOL_ROOT", "")
	t.Setenv("CAUTILUS_VERSION", "v9.8.7")
	cacheRoot := t.TempDir()
	t.Setenv("XDG_CACHE_HOME", cacheRoot)

	var stdout bytes.Buffer
	var stderr bytes.Buffer
	exitCode := Run([]string{"skills", "install"}, &stdout, &stderr)
	if exitCode != 0 {
		t.Fatalf("expected exit code 0, got %d, stderr=%s", exitCode, stderr.String())
	}
	if !strings.Contains(stdout.String(), ".agents/skills/cautilus") {
		t.Fatalf("unexpected stdout: %q", stdout.String())
	}
	if _, err := os.Stat(filepath.Join(repoRoot, ".agents", "skills", "cautilus", "SKILL.md")); err != nil {
		t.Fatalf("expected installed bundled skill: %v", err)
	}
	if _, err := os.Stat(filepath.Join(cacheRoot, "cautilus", "version-state.json")); err != nil {
		t.Fatalf("expected version state cache to be recorded: %v", err)
	}
}

func TestRunAdapterInitSkillScenarioPrefillsEvalTestSlot(t *testing.T) {
	repoRoot := t.TempDir()
	t.Setenv("CAUTILUS_CALLER_CWD", repoRoot)
	t.Setenv("CAUTILUS_TOOL_ROOT", "")

	var stdout bytes.Buffer
	var stderr bytes.Buffer
	exitCode := Run([]string{"adapter", "init", "--repo-root", repoRoot, "--scenario", "skill"}, &stdout, &stderr)
	if exitCode != 0 {
		t.Fatalf("expected exit code 0, got %d, stderr=%s", exitCode, stderr.String())
	}
	adapterPath := filepath.Join(repoRoot, ".agents", "cautilus-adapter.yaml")
	contents, err := os.ReadFile(adapterPath)
	if err != nil {
		t.Fatalf("ReadFile returned error: %v", err)
	}
	yaml := string(contents)
	if !strings.Contains(yaml, "eval_test_command_templates:") || !strings.Contains(yaml, "- cautilus eval test") {
		t.Fatalf("expected eval_test_command_templates to be pre-filled, got:\n%s", yaml)
	}
	if !strings.Contains(yaml, "--fixture fixtures/eval/dev/skill/") {
		t.Fatalf("expected eval_test_command_templates to reference fixtures/eval/dev/skill/, got:\n%s", yaml)
	}
}

func TestRunScenarioNormalizeSkillRejectsWorkflowSchema(t *testing.T) {
	repoRoot := t.TempDir()
	inputPath := filepath.Join(repoRoot, "workflow-input.json")
	if err := os.WriteFile(inputPath, []byte(strings.Join([]string{
		"{",
		`  "schemaVersion": "cautilus.workflow_normalization_inputs.v1",`,
		`  "evaluationRuns": [`,
		`    {`,
		`      "targetKind": "cli_workflow",`,
		`      "targetId": "scan-settings-seed",`,
		`      "surface": "replay_seed",`,
		`      "startedAt": "2026-04-15T00:00:00.000Z",`,
		`      "status": "blocked",`,
		`      "summary": "Replay seed stalled."`,
		`    }`,
		`  ]`,
		"}",
		"",
	}, "\n")), 0o644); err != nil {
		t.Fatalf("WriteFile returned error: %v", err)
	}

	t.Setenv("CAUTILUS_CALLER_CWD", repoRoot)
	t.Setenv("CAUTILUS_TOOL_ROOT", "")

	var stdout bytes.Buffer
	var stderr bytes.Buffer
	exitCode := Run([]string{"scenario", "normalize", "skill", "--input", inputPath}, &stdout, &stderr)
	if exitCode == 0 {
		t.Fatalf("expected non-zero exit code, stdout=%s", stdout.String())
	}
	if !strings.Contains(stderr.String(), "scenario normalize workflow") {
		t.Fatalf("expected stderr to mention workflow command, got %q", stderr.String())
	}
	if stdout.Len() != 0 {
		t.Fatalf("expected empty stdout on schema routing failure, got %q", stdout.String())
	}
}

func TestRunAdapterInitRejectsUnknownScenario(t *testing.T) {
	repoRoot := t.TempDir()
	t.Setenv("CAUTILUS_CALLER_CWD", repoRoot)
	t.Setenv("CAUTILUS_TOOL_ROOT", "")

	var stdout bytes.Buffer
	var stderr bytes.Buffer
	exitCode := Run([]string{"adapter", "init", "--repo-root", repoRoot, "--scenario", "bogus"}, &stdout, &stderr)
	if exitCode == 0 {
		t.Fatalf("expected non-zero exit code for unknown scenario, stdout=%s", stdout.String())
	}
	if !strings.Contains(stderr.String(), "chatbot, skill, or workflow") {
		t.Fatalf("expected actionable scenario error, got stderr=%q", stderr.String())
	}
	if _, err := os.Stat(filepath.Join(repoRoot, ".agents", "cautilus-adapter.yaml")); !os.IsNotExist(err) {
		t.Fatalf("expected no adapter file on scenario validation failure, got err=%v", err)
	}
}

func TestRunShellCommandDoesNotLeakShimContextEnv(t *testing.T) {
	t.Setenv("CAUTILUS_CALLER_CWD", "/tmp/caller")
	t.Setenv("CAUTILUS_TOOL_ROOT", "/tmp/tool")

	result := runShellCommand(
		t.TempDir(),
		"printf '%s|%s' \"${CAUTILUS_CALLER_CWD-}\" \"${CAUTILUS_TOOL_ROOT-}\"",
		filepath.Join(t.TempDir(), "stdout.txt"),
		filepath.Join(t.TempDir(), "stderr.txt"),
		func(string) {},
		"env scrub",
		time.Second,
	)

	if status := result["status"]; status != "passed" {
		t.Fatalf("expected passed status, got %#v", result)
	}
	if stdout := result["stdout"]; stdout != "|" {
		t.Fatalf("expected shim env to be scrubbed, got %#v", stdout)
	}
}

func TestRunShellCommandTimesOutLongRunningProcess(t *testing.T) {
	stdoutFile := filepath.Join(t.TempDir(), "stdout.txt")
	stderrFile := filepath.Join(t.TempDir(), "stderr.txt")
	result := runShellCommand(
		t.TempDir(),
		"node -e 'setTimeout(() => {}, 1000)'",
		stdoutFile,
		stderrFile,
		func(string) {},
		"timeout probe",
		50*time.Millisecond,
	)

	if status := result["status"]; status != "failed" {
		t.Fatalf("expected failed status, got %#v", result)
	}
	if timedOut := result["timedOut"]; timedOut != true {
		t.Fatalf("expected timedOut flag, got %#v", result)
	}
	if exitCode := result["exitCode"]; exitCode != -1 {
		t.Fatalf("expected timeout exitCode -1, got %#v", result)
	}
	if errorText := anyString(result["error"]); !strings.Contains(errorText, "timed out after") {
		t.Fatalf("expected timeout error text, got %#v", result["error"])
	}
}

func TestRunCommandProcessDoesNotLeakShimContextEnv(t *testing.T) {
	t.Setenv("CAUTILUS_CALLER_CWD", "/tmp/caller")
	t.Setenv("CAUTILUS_TOOL_ROOT", "/tmp/tool")

	observation, err := runCommandProcess(
		[]string{"bash", "-lc", "printf '%s|%s|%s' \"${CAUTILUS_CALLER_CWD-}\" \"${CAUTILUS_TOOL_ROOT-}\" \"${EXTRA_FLAG-}\""},
		t.TempDir(),
		map[string]string{"EXTRA_FLAG": "present"},
		"",
		1000,
	)
	if err != nil {
		t.Fatalf("runCommandProcess returned error: %v", err)
	}
	if stdout := observation["stdout"]; stdout != "||present" {
		t.Fatalf("expected shim env to be scrubbed while preserving extra env, got %#v", stdout)
	}
}

func TestEveryRegisteredCommandHasAGoHandler(t *testing.T) {
	registry, err := cli.LoadRegistry()
	if err != nil {
		t.Fatalf("LoadRegistry returned error: %v", err)
	}
	for _, command := range registry.Commands {
		if nativeHandler(command.Path) == nil {
			t.Fatalf("missing Go handler for registry command %q", strings.Join(command.Path, " "))
		}
	}
}
