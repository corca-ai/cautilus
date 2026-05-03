package runtime

import (
	"encoding/json"
	"os"
	"os/exec"
	"path/filepath"
	"strings"
	"testing"

	"github.com/corca-ai/cautilus/internal/contracts"
)

func TestDoctorRunnerReadinessKeepsAdapterReadyWithMissingAssessment(t *testing.T) {
	repoRoot := setupRunnerReadinessRepo(t)

	payload, exitCode, err := DoctorRepo(repoRoot, nil, nil)
	if err != nil {
		t.Fatalf("DoctorRepo returned error: %v", err)
	}
	if exitCode != 0 || payload["ready"] != true || payload["status"] != "ready" {
		t.Fatalf("expected top-level doctor readiness to remain ready, got exit=%d payload=%#v", exitCode, payload)
	}
	readiness := asMap(payload["runnerReadiness"])
	if readiness["state"] != "missing-assessment" || readiness["runnerDeclared"] != true {
		t.Fatalf("expected missing runner assessment without changing adapter readiness, got %#v", readiness)
	}
	if readiness["declaredRunnerKind"] != "declared-eval-runner" || readiness["proofClass"] != "unknown" {
		t.Fatalf("expected plain eval template to stay proof-neutral, got %#v", readiness)
	}
	nextBranch := asMap(readiness["nextBranch"])
	if nextBranch["id"] != "create_runner_assessment" || nextBranch["writesFiles"] != true {
		t.Fatalf("expected create assessment branch, got %#v", nextBranch)
	}
	assertRunnerReadinessBranchShape(t, nextBranch)
}

func TestRunnerReadinessReportsAssessedSmokeOnlyAndStaleStates(t *testing.T) {
	repoRoot := setupRunnerReadinessRepo(t)
	adapter, err := LoadAdapter(repoRoot, nil, nil)
	if err != nil {
		t.Fatalf("LoadAdapter returned error: %v", err)
	}
	writeRunnerAssessment(t, repoRoot, adapter, "smoke-only", "fixture-smoke")
	readiness := BuildRunnerReadiness(repoRoot, adapter)
	if readiness["state"] != "smoke-only" || readiness["recommendation"] != "smoke-only" {
		t.Fatalf("expected smoke-only readiness, got %#v", readiness)
	}
	if readiness["proofClass"] != "fixture-smoke" || readiness["proofClassSource"] != "assessment" {
		t.Fatalf("expected assessment proof class, got %#v", readiness)
	}
	runGitForRunnerReadiness(t, repoRoot, "add", ".cautilus/runners")
	runGitForRunnerReadiness(t, repoRoot, "commit", "-m", "commit runner assessment")
	readiness = BuildRunnerReadiness(repoRoot, adapter)
	if readiness["state"] != "smoke-only" || readiness["recommendation"] != "smoke-only" {
		t.Fatalf("expected committed assessment artifact to remain smoke-only, got %#v", readiness)
	}
	provenance := asMap(readiness["assessmentProvenance"])
	if provenance["headDrift"] != true || provenance["comparisonStatus"] != "fresh-with-head-drift" {
		t.Fatalf("expected assessment commit drift to stay provenance-only, got %#v", provenance)
	}

	writeRunnerAssessment(t, repoRoot, adapter, "ready-for-selected-surface", "in-process-product-runner")
	readiness = BuildRunnerReadiness(repoRoot, adapter)
	if readiness["state"] != "assessed" || readiness["recommendation"] != "ready-for-selected-surface" {
		t.Fatalf("expected assessed readiness, got %#v", readiness)
	}
	if asMap(readiness["runnerVerification"])["capabilityState"] != "ready" {
		t.Fatalf("expected ready runner verification capabilities, got %#v", readiness)
	}

	if err := os.WriteFile(filepath.Join(repoRoot, "scripts", "eval", "run-product-chat.mjs"), []byte("changed\n"), 0o755); err != nil {
		t.Fatalf("WriteFile runner change returned error: %v", err)
	}
	readiness = BuildRunnerReadiness(repoRoot, adapter)
	if readiness["state"] != "stale" {
		t.Fatalf("expected stale readiness after runner file changed, got %#v", readiness)
	}
	staleReasons := arrayOrEmpty(readiness["staleReasons"])
	if len(staleReasons) == 0 || asMap(staleReasons[0])["kind"] != "runnerFile" {
		t.Fatalf("expected runnerFile stale reason, got %#v", staleReasons)
	}
}

func TestRunnerReadinessBlocksProductProofWithoutVerificationCapabilities(t *testing.T) {
	repoRoot := setupRunnerReadinessRepo(t)
	adapter, err := LoadAdapter(repoRoot, nil, nil)
	if err != nil {
		t.Fatalf("LoadAdapter returned error: %v", err)
	}
	writeRunnerAssessmentWithVerification(t, repoRoot, adapter, "ready-for-selected-surface", "in-process-product-runner", nil)

	readiness := BuildRunnerReadiness(repoRoot, adapter)
	if readiness["state"] != "assessed" || readiness["reason"] != "runner-assessment-missing-verification-capabilities" {
		t.Fatalf("expected product proof to be blocked by missing verification capabilities, got %#v", readiness)
	}
	if readiness["effectiveRecommendation"] != "blocked" {
		t.Fatalf("expected effective blocked recommendation, got %#v", readiness)
	}
	nextBranch := asMap(readiness["nextBranch"])
	if nextBranch["id"] != "upgrade_runner_assessment" || nextBranch["writesFiles"] != true {
		t.Fatalf("expected upgrade runner assessment branch, got %#v", nextBranch)
	}
	assertRunnerReadinessBranchShape(t, nextBranch)
	verification := asMap(readiness["runnerVerification"])
	if verification["capabilityState"] != "missing" {
		t.Fatalf("expected missing capability state, got %#v", verification)
	}
	if len(arrayOrEmpty(readiness["verificationIssues"])) != len(requiredProductRunnerVerificationLegs) {
		t.Fatalf("expected one issue per required leg, got %#v", readiness["verificationIssues"])
	}
}

func TestRunnerReadinessRejectsInvalidVerificationCapabilityShape(t *testing.T) {
	repoRoot := setupRunnerReadinessRepo(t)
	adapter, err := LoadAdapter(repoRoot, nil, nil)
	if err != nil {
		t.Fatalf("LoadAdapter returned error: %v", err)
	}
	writeRunnerAssessmentWithVerification(t, repoRoot, adapter, "ready-for-selected-surface", "in-process-product-runner", map[string]any{
		"inputSimulation": map[string]any{"state": "hand-wavy"},
	})

	readiness := BuildRunnerReadiness(repoRoot, adapter)
	if readiness["state"] != "unknown" || readiness["reason"] != "runner-assessment-invalid" {
		t.Fatalf("expected invalid assessment state, got %#v", readiness)
	}
	issues := arrayOrEmpty(readiness["issues"])
	if len(issues) == 0 {
		t.Fatalf("expected validation issues, got %#v", readiness)
	}
}

func TestDoctorNextActionFallsBackAfterRunnerAssessmentReady(t *testing.T) {
	repoRoot := setupRunnerReadinessRepo(t)
	adapter, err := LoadAdapter(repoRoot, nil, nil)
	if err != nil {
		t.Fatalf("LoadAdapter returned error: %v", err)
	}
	writeRunnerAssessment(t, repoRoot, adapter, "ready-for-selected-surface", "in-process-product-runner")

	payload, exitCode, err := DoctorRepo(repoRoot, nil, nil)
	if err != nil {
		t.Fatalf("DoctorRepo returned error: %v", err)
	}
	if exitCode != 0 || payload["status"] != "ready" {
		t.Fatalf("expected ready doctor payload, got exit=%d payload=%#v", exitCode, payload)
	}
	nextAction := asMap(payload["next_action"])
	if nextAction["kind"] != "complete_first_bounded_run" {
		t.Fatalf("expected first bounded run next action after ready runner assessment, got %#v", nextAction)
	}
	readiness := asMap(payload["runnerReadiness"])
	if asMap(readiness["nextBranch"])["id"] != "run_eval_with_assessed_runner" {
		t.Fatalf("expected ready runner branch, got %#v", readiness)
	}
	assertRunnerReadinessBranchShape(t, asMap(readiness["nextBranch"]))
}

func TestAgentStatusIncludesRunnerReadinessBranchBeforeClaimBranches(t *testing.T) {
	repoRoot := setupRunnerReadinessRepo(t)
	payload, exitCode, err := BuildAgentStatus(repoRoot, AgentStatusOptions{})
	if err != nil {
		t.Fatalf("BuildAgentStatus returned error: %v", err)
	}
	if exitCode != 0 || payload["status"] != "ready" {
		t.Fatalf("expected ready agent status, got exit=%d payload=%#v", exitCode, payload)
	}
	readiness := asMap(payload["runnerReadiness"])
	if readiness["state"] != "missing-assessment" {
		t.Fatalf("expected missing assessment runner readiness, got %#v", readiness)
	}
	branches := arrayOrEmpty(payload["nextBranches"])
	if len(branches) < 2 {
		t.Fatalf("expected runner and claim branches, got %#v", branches)
	}
	if asMap(branches[0])["id"] != "create_runner_assessment" {
		t.Fatalf("expected runner readiness branch before claim branches, got %#v", branches)
	}
	assertRunnerReadinessBranchShape(t, asMap(branches[0]))
	if asMap(branches[1])["id"] != "run_first_claim_scan" {
		t.Fatalf("expected claim branch after runner readiness branch, got %#v", branches)
	}
}

func TestRunnerReadinessBranchesExposeStableActionShape(t *testing.T) {
	bindRepoRoot := setupRunnerReadinessRepo(t)
	if err := os.WriteFile(filepath.Join(bindRepoRoot, ".agents", "cautilus-adapter.yaml"), []byte(strings.Join([]string{
		"version: 1",
		"repo: runner-demo",
		"evaluation_surfaces:",
		"  - app / chat",
		"baseline_options:",
		"  - compare current checkout with a selected baseline ref",
		"",
	}, "\n")), 0o644); err != nil {
		t.Fatalf("WriteFile adapter returned error: %v", err)
	}
	adapter, err := LoadAdapter(bindRepoRoot, nil, nil)
	if err != nil {
		t.Fatalf("LoadAdapter without runner returned error: %v", err)
	}
	bindBranch := asMap(BuildRunnerReadiness(bindRepoRoot, adapter)["nextBranch"])
	if bindBranch["id"] != "bind_runner_metadata" || bindBranch["writesFiles"] != true {
		t.Fatalf("expected bind runner metadata branch, got %#v", bindBranch)
	}
	assertRunnerReadinessBranchShape(t, bindBranch)

	repoRoot := setupRunnerReadinessRepo(t)
	adapter = mustReloadRunnerReadinessAdapter(t, repoRoot)
	writeRunnerAssessment(t, repoRoot, adapter, "blocked", "fixture-smoke")
	notReadyBranch := asMap(BuildRunnerReadiness(repoRoot, adapter)["nextBranch"])
	if notReadyBranch["id"] != "address_runner_assessment_gaps" {
		t.Fatalf("expected address gaps branch, got %#v", notReadyBranch)
	}
	assertRunnerReadinessBranchShape(t, notReadyBranch)

	writeRunnerAssessment(t, repoRoot, adapter, "ready-for-selected-surface", "in-process-product-runner")
	readyBranch := asMap(BuildRunnerReadiness(repoRoot, adapter)["nextBranch"])
	if readyBranch["id"] != "run_eval_with_assessed_runner" || readyBranch["requiredCommand"] == "" {
		t.Fatalf("expected eval command branch, got %#v", readyBranch)
	}
	assertRunnerReadinessBranchShape(t, readyBranch)
}

func assertRunnerReadinessBranchShape(t *testing.T, branch map[string]any) {
	t.Helper()
	for _, field := range []string{"id", "label", "reason", "owningSurface", "runnerId"} {
		if strings.TrimSpace(stringFromAny(branch[field])) == "" {
			t.Fatalf("runner readiness branch missing %s: %#v", field, branch)
		}
	}
	if _, ok := branch["writesFiles"].(bool); !ok {
		t.Fatalf("runner readiness branch missing boolean writesFiles: %#v", branch)
	}
	if stringFromAny(branch["requiredArtifact"]) == "" && stringFromAny(branch["requiredCommand"]) == "" {
		t.Fatalf("runner readiness branch must expose requiredArtifact or requiredCommand: %#v", branch)
	}
}

func mustReloadRunnerReadinessAdapter(t *testing.T, repoRoot string) *AdapterPayload {
	t.Helper()
	adapter, err := LoadAdapter(repoRoot, nil, nil)
	if err != nil {
		t.Fatalf("LoadAdapter returned error: %v", err)
	}
	return adapter
}

func TestAgentStatusIncludesRelatedClaimStates(t *testing.T) {
	repoRoot := setupRunnerReadinessRepo(t)
	adapter := strings.Join([]string{
		"version: 1",
		"repo: runner-demo",
		"evaluation_surfaces:",
		"  - app / chat",
		"baseline_options:",
		"  - compare current checkout with a selected baseline ref",
		"eval_test_command_templates:",
		"  - node scripts/eval/run-product-chat.mjs --cases-file {eval_cases_file} --output-file {eval_observed_file}",
		"claim_discovery:",
		"  entries:",
		"    - README.md",
		"  state_path: .cautilus/claims/latest.json",
		"  related_state_paths:",
		"    - role: evidenced",
		"      path: .cautilus/claims/evidenced.json",
		"",
	}, "\n")
	if err := os.WriteFile(filepath.Join(repoRoot, ".agents", "cautilus-adapter.yaml"), []byte(adapter), 0o644); err != nil {
		t.Fatalf("WriteFile adapter returned error: %v", err)
	}
	claimsDir := filepath.Join(repoRoot, ".cautilus", "claims")
	if err := os.MkdirAll(claimsDir, 0o755); err != nil {
		t.Fatalf("MkdirAll claims returned error: %v", err)
	}
	latestPacket := map[string]any{
		"schemaVersion": contracts.ClaimProofPlanSchema,
		"sourceRoot":    ".",
		"gitCommit":     currentGitCommit(repoRoot),
		"claimState": map[string]any{
			"path": ".cautilus/claims/latest.json",
		},
		"effectiveScanScope": map[string]any{},
		"sourceInventory":    []any{},
		"claimCandidates": []any{
			map[string]any{
				"claimId":               "claim-readme-md-1",
				"claimFingerprint":      "abc123",
				"summary":               "Demo behavior is discovered.",
				"recommendedProof":      "deterministic",
				"verificationReadiness": "ready-to-verify",
				"evidenceStatus":        "unknown",
				"reviewStatus":          "heuristic",
				"lifecycle":             "new",
				"evidenceRefs":          []any{},
				"sourceRefs": []any{
					map[string]any{
						"path":    "README.md",
						"line":    1,
						"excerpt": "Demo behavior is discovered.",
					},
				},
			},
		},
	}
	latestPayload, err := json.MarshalIndent(latestPacket, "", "  ")
	if err != nil {
		t.Fatalf("MarshalIndent latest packet returned error: %v", err)
	}
	if err := os.WriteFile(filepath.Join(claimsDir, "latest.json"), latestPayload, 0o644); err != nil {
		t.Fatalf("WriteFile latest claims returned error: %v", err)
	}
	packet := map[string]any{
		"schemaVersion": contracts.ClaimProofPlanSchema,
		"sourceRoot":    ".",
		"gitCommit":     currentGitCommit(repoRoot),
		"claimState": map[string]any{
			"path": ".cautilus/claims/evidenced.json",
		},
		"effectiveScanScope": map[string]any{},
		"sourceInventory":    []any{},
		"claimCandidates": []any{
			map[string]any{
				"claimId":               "claim-readme-md-1",
				"claimFingerprint":      "abc123",
				"summary":               "Demo behavior is evidenced.",
				"recommendedProof":      "deterministic",
				"verificationReadiness": "ready-to-verify",
				"evidenceStatus":        "satisfied",
				"reviewStatus":          "agent-reviewed",
				"lifecycle":             "new",
				"evidenceRefs":          []any{},
				"sourceRefs": []any{
					map[string]any{
						"path":    "README.md",
						"line":    1,
						"excerpt": "Demo behavior is evidenced.",
					},
				},
			},
		},
	}
	payload, err := json.MarshalIndent(packet, "", "  ")
	if err != nil {
		t.Fatalf("MarshalIndent packet returned error: %v", err)
	}
	if err := os.WriteFile(filepath.Join(claimsDir, "evidenced.json"), payload, 0o644); err != nil {
		t.Fatalf("WriteFile evidenced claims returned error: %v", err)
	}

	status, exitCode, err := BuildAgentStatus(repoRoot, AgentStatusOptions{})
	if err != nil {
		t.Fatalf("BuildAgentStatus returned error: %v", err)
	}
	if exitCode != 0 {
		t.Fatalf("expected successful agent status, got exit=%d payload=%#v", exitCode, status)
	}
	claimState := asMap(status["claimState"])
	relatedStates := arrayOrEmpty(claimState["relatedStates"])
	if len(relatedStates) != 1 {
		t.Fatalf("expected one related claim state, got %#v", relatedStates)
	}
	if claimState["role"] != "evidenced" || claimState["path"] != ".cautilus/claims/evidenced.json" {
		t.Fatalf("expected orientation to prefer evidenced related state, got %#v", claimState)
	}
	selectedSummary := asMap(claimState["summary"])
	if selectedSummary["candidateCount"] != 1 {
		t.Fatalf("expected selected evidenced summary, got %#v", selectedSummary)
	}
	configured := asMap(claimState["configuredState"])
	if configured["role"] != "current" || configured["path"] != ".cautilus/claims/latest.json" {
		t.Fatalf("expected configured state to preserve writable latest path, got %#v", configured)
	}
	branches := arrayOrEmpty(status["nextBranches"])
	showBranch := map[string]any{}
	for _, raw := range branches {
		branch := asMap(raw)
		if branch["id"] == "show_existing_claims" {
			showBranch = branch
			break
		}
	}
	if !strings.Contains(stringFromAny(showBranch["command"]), ".cautilus/claims/evidenced.json") {
		t.Fatalf("expected first claim branch to inspect evidenced state, got %#v", branches)
	}
	evidenced := asMap(relatedStates[0])
	if evidenced["role"] != "evidenced" || evidenced["status"] != "present" {
		t.Fatalf("expected present evidenced related state, got %#v", evidenced)
	}
	summary := asMap(evidenced["summary"])
	if summary["candidateCount"] != 1 {
		t.Fatalf("expected evidenced summary candidate count, got %#v", summary)
	}
}

func TestRunnerReadinessSupportsTypedMultiRunnerAdapters(t *testing.T) {
	repoRoot := setupTypedRunnerReadinessRepo(t)
	adapter, err := LoadAdapter(repoRoot, nil, nil)
	if err != nil {
		t.Fatalf("LoadAdapter returned error: %v", err)
	}
	appRunner, err := ResolveEvalRunner(adapter, "app/chat")
	if err != nil {
		t.Fatalf("ResolveEvalRunner app/chat returned error: %v", err)
	}
	if appRunner["runnerId"] != "app-chat-live" || EvalRunnerDefaultRuntime(appRunner) != "fixture" {
		t.Fatalf("expected app/chat typed runner, got %#v", appRunner)
	}
	skillRunner, err := ResolveEvalRunner(adapter, "dev/skill")
	if err != nil {
		t.Fatalf("ResolveEvalRunner dev/skill returned error: %v", err)
	}
	if skillRunner["runnerId"] != "dev-skill-agent" {
		t.Fatalf("expected dev/skill typed runner, got %#v", skillRunner)
	}
	if _, err := ResolveEvalRunner(adapter, "app/prompt"); err == nil {
		t.Fatalf("expected missing app/prompt runner to fail")
	}

	readiness := BuildRunnerReadiness(repoRoot, adapter)
	if readiness["runnerCount"] != 2 {
		t.Fatalf("expected aggregate readiness for two runners, got %#v", readiness)
	}
	runners := arrayOrEmpty(readiness["runners"])
	if len(runners) != 2 {
		t.Fatalf("expected per-runner readiness entries, got %#v", readiness)
	}
	appReadiness := BuildRunnerReadinessForSurface(repoRoot, adapter, "app/chat")
	if appReadiness["runnerId"] != "app-chat-live" || appReadiness["assessmentPath"] != ".cautilus/runners/app-chat-live.assessment.json" {
		t.Fatalf("expected surface readiness to select app runner, got %#v", appReadiness)
	}
	if appReadiness["proofClass"] != "live-product-runner" || appReadiness["proofClassSource"] != "adapter-runner" {
		t.Fatalf("expected typed runner proof metadata before assessment, got %#v", appReadiness)
	}
}

func setupRunnerReadinessRepo(t *testing.T) string {
	t.Helper()
	repoRoot := t.TempDir()
	runGitForRunnerReadiness(t, repoRoot, "init")
	runGitForRunnerReadiness(t, repoRoot, "config", "user.email", "test@example.com")
	runGitForRunnerReadiness(t, repoRoot, "config", "user.name", "Cautilus Test")
	if err := os.MkdirAll(filepath.Join(repoRoot, ".agents"), 0o755); err != nil {
		t.Fatalf("MkdirAll .agents returned error: %v", err)
	}
	if err := os.MkdirAll(filepath.Join(repoRoot, ".agents", "skills", "cautilus"), 0o755); err != nil {
		t.Fatalf("MkdirAll cautilus skill returned error: %v", err)
	}
	if err := os.WriteFile(filepath.Join(repoRoot, ".agents", "skills", "cautilus", "SKILL.md"), []byte("# Cautilus\n"), 0o644); err != nil {
		t.Fatalf("WriteFile skill returned error: %v", err)
	}
	if err := os.MkdirAll(filepath.Join(repoRoot, ".claude", "skills"), 0o755); err != nil {
		t.Fatalf("MkdirAll claude skills returned error: %v", err)
	}
	if err := os.MkdirAll(filepath.Join(repoRoot, "scripts", "eval"), 0o755); err != nil {
		t.Fatalf("MkdirAll scripts returned error: %v", err)
	}
	adapter := strings.Join([]string{
		"version: 1",
		"repo: runner-demo",
		"evaluation_surfaces:",
		"  - app / chat",
		"baseline_options:",
		"  - compare current checkout with a selected baseline ref",
		"eval_test_command_templates:",
		"  - node scripts/eval/run-product-chat.mjs --cases-file {eval_cases_file} --output-file {eval_observed_file}",
		"",
	}, "\n")
	if err := os.WriteFile(filepath.Join(repoRoot, ".agents", "cautilus-adapter.yaml"), []byte(adapter), 0o644); err != nil {
		t.Fatalf("WriteFile adapter returned error: %v", err)
	}
	if err := os.WriteFile(filepath.Join(repoRoot, "scripts", "eval", "run-product-chat.mjs"), []byte("console.log('runner');\n"), 0o755); err != nil {
		t.Fatalf("WriteFile runner returned error: %v", err)
	}
	runGitForRunnerReadiness(t, repoRoot, "add", ".")
	runGitForRunnerReadiness(t, repoRoot, "commit", "-m", "initial")
	return repoRoot
}

func setupTypedRunnerReadinessRepo(t *testing.T) string {
	t.Helper()
	repoRoot := t.TempDir()
	runGitForRunnerReadiness(t, repoRoot, "init")
	runGitForRunnerReadiness(t, repoRoot, "config", "user.email", "test@example.com")
	runGitForRunnerReadiness(t, repoRoot, "config", "user.name", "Cautilus Test")
	if err := os.MkdirAll(filepath.Join(repoRoot, ".agents"), 0o755); err != nil {
		t.Fatalf("MkdirAll .agents returned error: %v", err)
	}
	if err := os.MkdirAll(filepath.Join(repoRoot, "scripts", "eval"), 0o755); err != nil {
		t.Fatalf("MkdirAll scripts returned error: %v", err)
	}
	adapter := strings.Join([]string{
		"version: 1",
		"repo: typed-runner-demo",
		"evaluation_surfaces:",
		"  - app / chat",
		"  - dev / skill",
		"baseline_options:",
		"  - compare current checkout with a selected baseline ref",
		"runner_readiness:",
		"  runners:",
		"    - id: app-chat-live",
		"      surfaces:",
		"        - app/chat",
		"      proof_class: live-product-runner",
		"      command_template: node scripts/eval/run-live-chat.mjs --cases-file {eval_cases_file} --output-file {eval_observed_file} --runner-id {runner_id}",
		"      assessment_path: .cautilus/runners/app-chat-live.assessment.json",
		"      default_runtime: fixture",
		"    - id: dev-skill-agent",
		"      surfaces:",
		"        - dev/skill",
		"      proof_class: coding-agent-messaging",
		"      command_template: node scripts/eval/run-skill.mjs --cases-file {eval_cases_file} --output-file {eval_observed_file}",
		"",
	}, "\n")
	if err := os.WriteFile(filepath.Join(repoRoot, ".agents", "cautilus-adapter.yaml"), []byte(adapter), 0o644); err != nil {
		t.Fatalf("WriteFile adapter returned error: %v", err)
	}
	for _, file := range []string{"run-live-chat.mjs", "run-skill.mjs"} {
		if err := os.WriteFile(filepath.Join(repoRoot, "scripts", "eval", file), []byte("console.log('runner');\n"), 0o755); err != nil {
			t.Fatalf("WriteFile runner returned error: %v", err)
		}
	}
	runGitForRunnerReadiness(t, repoRoot, "add", ".")
	runGitForRunnerReadiness(t, repoRoot, "commit", "-m", "initial")
	return repoRoot
}

func writeRunnerAssessment(t *testing.T, repoRoot string, adapter *AdapterPayload, recommendation string, proofClass string) {
	t.Helper()
	verificationCapabilities := any(nil)
	if requiresProductRunnerVerification(proofClass, recommendation) {
		verificationCapabilities = validRunnerVerificationCapabilities()
	}
	writeRunnerAssessmentWithVerification(t, repoRoot, adapter, recommendation, proofClass, verificationCapabilities)
}

func writeRunnerAssessmentWithVerification(t *testing.T, repoRoot string, adapter *AdapterPayload, recommendation string, proofClass string, verificationCapabilities any) {
	t.Helper()
	adapterPath := stringOrEmpty(adapter.Path)
	adapterHash, err := fileSHA256(adapterPath)
	if err != nil {
		t.Fatalf("fileSHA256 adapter returned error: %v", err)
	}
	runnerPath := filepath.Join(repoRoot, "scripts", "eval", "run-product-chat.mjs")
	runnerHash, err := fileSHA256(runnerPath)
	if err != nil {
		t.Fatalf("fileSHA256 runner returned error: %v", err)
	}
	assessment := map[string]any{
		"schemaVersion": contracts.RunnerAssessmentSchema,
		"runnerId":      defaultRunnerID,
		"surface":       "app/chat",
		"proofClass":    proofClass,
		"assessedBy":    "test",
		"assessedAt":    "2026-04-30T00:00:00Z",
		"repoCommit":    currentGitCommit(repoRoot),
		"adapterPath":   ".agents/cautilus-adapter.yaml",
		"adapterHash":   adapterHash,
		"runnerFiles":   []any{map[string]any{"path": "scripts/eval/run-product-chat.mjs", "sha256": runnerHash}},
		"claims":        []any{map[string]any{"claimId": "claim-readme-md-1"}},
		"assessedRequirement": map[string]any{
			"proofMechanism":           "cautilus-eval",
			"recommendedEvalSurface":   "app/chat",
			"requiredRunnerCapability": "headless-product-chat-runner",
			"requiredObservability":    []any{"transcript", "finalText"},
		},
		"productionPathReuse": map[string]any{"modules": []any{"src/app/chat/route.ts"}},
		"observability":       map[string]any{"emits": []any{"finalText"}},
		"knownGaps":           []any{},
		"recommendation":      recommendation,
	}
	if verificationCapabilities != nil {
		assessment["verificationCapabilities"] = verificationCapabilities
	}
	assessmentPath := filepath.Join(repoRoot, filepath.FromSlash(defaultRunnerAssessmentPath(defaultRunnerID)))
	if err := os.MkdirAll(filepath.Dir(assessmentPath), 0o755); err != nil {
		t.Fatalf("MkdirAll assessment returned error: %v", err)
	}
	payload, err := json.MarshalIndent(assessment, "", "  ")
	if err != nil {
		t.Fatalf("MarshalIndent assessment returned error: %v", err)
	}
	if err := os.WriteFile(assessmentPath, append(payload, '\n'), 0o644); err != nil {
		t.Fatalf("WriteFile assessment returned error: %v", err)
	}
}

func validRunnerVerificationCapabilities() map[string]any {
	return map[string]any{
		"inputSimulation": map[string]any{
			"state":        "present",
			"summary":      "The runner accepts normalized eval cases through the same product-readable request shape used by the app chat path.",
			"evidenceRefs": []any{"scripts/eval/run-product-chat.mjs"},
		},
		"externalSubstitution": map[string]any{
			"state":        "not-required",
			"reason":       "The selected fixture uses deterministic local product code and does not call an external model provider.",
			"evidenceRefs": []any{"scripts/eval/run-product-chat.mjs"},
		},
		"triggerControl": map[string]any{
			"state":        "present",
			"summary":      "The runner is invoked as a bounded CLI command and exits only after writing the observed packet.",
			"evidenceRefs": []any{"scripts/eval/run-product-chat.mjs"},
		},
		"externalObservation": map[string]any{
			"state":        "present",
			"summary":      "The observed packet is written by the wrapper outside the product response function.",
			"evidenceRefs": []any{"eval-observed.json"},
		},
	}
}

func runGitForRunnerReadiness(t *testing.T, repoRoot string, args ...string) {
	t.Helper()
	cmd := exec.Command("git", append([]string{"-C", repoRoot}, args...)...)
	output, err := cmd.CombinedOutput()
	if err != nil {
		t.Fatalf("git %v failed: %v\n%s", args, err, output)
	}
}
