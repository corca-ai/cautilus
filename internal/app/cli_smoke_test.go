package app

import (
	"bytes"
	"encoding/json"
	"os"
	"os/exec"
	"path/filepath"
	"strings"
	"testing"
	"time"

	"github.com/corca-ai/cautilus/internal/cli"
	"github.com/corca-ai/cautilus/internal/contracts"
	cautilusruntime "github.com/corca-ai/cautilus/internal/runtime"
)

func repoToolRoot(t *testing.T) string {
	t.Helper()
	wd, err := os.Getwd()
	if err != nil {
		t.Fatalf("Getwd returned error: %v", err)
	}
	root, err := cli.FindRepoRoot(wd)
	if err != nil {
		t.Fatalf("FindRepoRoot returned error: %v", err)
	}
	return root
}

func runCLI(t *testing.T, cwd string, args ...string) (string, string, int) {
	t.Helper()
	t.Setenv("CAUTILUS_CALLER_CWD", cwd)
	t.Setenv("CAUTILUS_TOOL_ROOT", "")

	var stdout bytes.Buffer
	var stderr bytes.Buffer
	exitCode := Run(args, &stdout, &stderr)
	return stdout.String(), stderr.String(), exitCode
}

func runGit(t *testing.T, repoRoot string, args ...string) string {
	t.Helper()
	command := exec.Command("git", append([]string{"-C", repoRoot}, args...)...)
	output, err := command.CombinedOutput()
	if err != nil {
		t.Fatalf("git %v failed: %v\n%s", args, err, string(output))
	}
	return strings.TrimSpace(string(output))
}

func writeExecutableFile(t *testing.T, root string, name string, body string) {
	t.Helper()
	path := filepath.Join(root, name)
	if err := os.WriteFile(path, []byte(body), 0o755); err != nil {
		t.Fatalf("WriteFile returned error: %v", err)
	}
}

func readJSONObjectFile(t *testing.T, path string) map[string]any {
	t.Helper()
	payload, err := os.ReadFile(path)
	if err != nil {
		t.Fatalf("ReadFile returned error: %v", err)
	}
	var value map[string]any
	if err := json.Unmarshal(payload, &value); err != nil {
		t.Fatalf("Unmarshal returned error: %v", err)
	}
	return value
}

func readJSONArrayFile(t *testing.T, path string) []any {
	t.Helper()
	payload, err := os.ReadFile(path)
	if err != nil {
		t.Fatalf("ReadFile returned error: %v", err)
	}
	var value []any
	if err := json.Unmarshal(payload, &value); err != nil {
		t.Fatalf("Unmarshal returned error: %v", err)
	}
	return value
}

func parseJSONObject(t *testing.T, payload string) map[string]any {
	t.Helper()
	var value map[string]any
	if err := json.Unmarshal([]byte(payload), &value); err != nil {
		t.Fatalf("Unmarshal returned error: %v", err)
	}
	return value
}

func writeJSONFile(t *testing.T, path string, value any) {
	t.Helper()
	payload, err := json.MarshalIndent(value, "", "  ")
	if err != nil {
		t.Fatalf("MarshalIndent returned error: %v", err)
	}
	if err := os.WriteFile(path, append(payload, '\n'), 0o644); err != nil {
		t.Fatalf("WriteFile returned error: %v", err)
	}
}

func TestCLIRootSelfConsumerRepoStaysDoctorReady(t *testing.T) {
	root := repoToolRoot(t)
	stdout, stderr, exitCode := runCLI(t, root, "doctor", "--repo-root", root)
	if exitCode != 0 {
		t.Fatalf("Run returned exit code %d, stderr=%s", exitCode, stderr)
	}
	payload := parseJSONObject(t, stdout)
	if ready, ok := payload["ready"].(bool); !ok || !ready {
		t.Fatalf("expected ready doctor payload, got %#v", payload)
	}
	if payload["status"] != "ready" {
		t.Fatalf("expected ready status, got %#v", payload["status"])
	}
	if _, err := os.Stat(filepath.Join(root, ".agents", "cautilus-adapters", "self-dogfood.yaml")); err != nil {
		t.Fatalf("expected self-dogfood adapter to exist: %v", err)
	}
}

func TestCLIAdapterResolveDelegatesToBundledResolver(t *testing.T) {
	root := t.TempDir()
	adapterDir := filepath.Join(root, ".agents")
	if err := os.MkdirAll(adapterDir, 0o755); err != nil {
		t.Fatalf("MkdirAll returned error: %v", err)
	}
	adapter := strings.Join([]string{
		"version: 1",
		"repo: temp",
		"evaluation_surfaces:",
		"  - smoke",
		"baseline_options:",
		"  - baseline git ref via {baseline_ref}",
		"",
	}, "\n")
	if err := os.WriteFile(filepath.Join(adapterDir, "cautilus-adapter.yaml"), []byte(adapter), 0o644); err != nil {
		t.Fatalf("WriteFile returned error: %v", err)
	}

	stdout, stderr, exitCode := runCLI(t, root, "adapter", "resolve", "--repo-root", root)
	if exitCode != 0 {
		t.Fatalf("Run returned exit code %d, stderr=%s", exitCode, stderr)
	}
	payload := parseJSONObject(t, stdout)
	if payload["valid"] != true {
		t.Fatalf("expected valid adapter payload, got %#v", payload)
	}
	data := payload["data"].(map[string]any)
	if data["repo"] != "temp" {
		t.Fatalf("expected repo=temp, got %#v", data["repo"])
	}
}

func TestCLIDoctorReportsReadyWithExecutionSurface(t *testing.T) {
	root := t.TempDir()
	adapterDir := filepath.Join(root, ".agents")
	if err := os.MkdirAll(adapterDir, 0o755); err != nil {
		t.Fatalf("MkdirAll returned error: %v", err)
	}
	adapter := strings.Join([]string{
		"version: 1",
		"repo: temp",
		"evaluation_surfaces:",
		"  - smoke",
		"baseline_options:",
		"  - baseline git ref via {baseline_ref}",
		"iterate_command_templates:",
		"  - npm run check",
		"",
	}, "\n")
	if err := os.WriteFile(filepath.Join(adapterDir, "cautilus-adapter.yaml"), []byte(adapter), 0o644); err != nil {
		t.Fatalf("WriteFile returned error: %v", err)
	}

	stdout, stderr, exitCode := runCLI(t, root, "doctor", "--repo-root", root)
	if exitCode != 0 {
		t.Fatalf("Run returned exit code %d, stderr=%s", exitCode, stderr)
	}
	payload := parseJSONObject(t, stdout)
	if payload["ready"] != true || payload["status"] != "ready" {
		t.Fatalf("expected ready doctor payload, got %#v", payload)
	}
	if payload["adapter_path"] != filepath.Join(root, ".agents", "cautilus-adapter.yaml") {
		t.Fatalf("unexpected adapter path: %#v", payload["adapter_path"])
	}
}

func TestCLIDoctorFailsWithoutCheckedInAdapter(t *testing.T) {
	root := t.TempDir()
	stdout, stderr, exitCode := runCLI(t, root, "doctor", "--repo-root", root)
	if exitCode != 1 {
		t.Fatalf("expected exit code 1, got %d, stderr=%s", exitCode, stderr)
	}
	payload := parseJSONObject(t, stdout)
	if payload["ready"] != false || payload["status"] != "missing_adapter" {
		t.Fatalf("expected missing_adapter payload, got %#v", payload)
	}
	suggestions, ok := payload["suggestions"].([]any)
	if !ok || len(suggestions) == 0 || !strings.Contains(anyToString(suggestions[0]), "adapter init") {
		t.Fatalf("expected adapter init suggestion, got %#v", payload["suggestions"])
	}
}

func TestCLIDoctorFailsWhenAdapterIsInvalid(t *testing.T) {
	root := t.TempDir()
	adapterDir := filepath.Join(root, ".agents")
	if err := os.MkdirAll(adapterDir, 0o755); err != nil {
		t.Fatalf("MkdirAll returned error: %v", err)
	}
	adapter := strings.Join([]string{
		"version: one",
		"repo: temp",
		"evaluation_surfaces: smoke",
		"",
	}, "\n")
	if err := os.WriteFile(filepath.Join(adapterDir, "cautilus-adapter.yaml"), []byte(adapter), 0o644); err != nil {
		t.Fatalf("WriteFile returned error: %v", err)
	}

	stdout, stderr, exitCode := runCLI(t, root, "doctor", "--repo-root", root)
	if exitCode != 1 {
		t.Fatalf("expected exit code 1, got %d, stderr=%s", exitCode, stderr)
	}
	payload := parseJSONObject(t, stdout)
	if payload["ready"] != false || payload["status"] != "invalid_adapter" {
		t.Fatalf("expected invalid_adapter payload, got %#v", payload)
	}
	errors, ok := payload["errors"].([]any)
	if !ok || len(errors) == 0 {
		t.Fatalf("expected validation errors, got %#v", payload["errors"])
	}
}

func TestCLIStandaloneTempRepoCanAdoptCautilusWithoutCealPaths(t *testing.T) {
	root := t.TempDir()
	packageJSON, err := json.MarshalIndent(map[string]any{
		"name":    "standalone-smoke",
		"private": true,
		"scripts": map[string]string{"check": "echo ok"},
	}, "", "  ")
	if err != nil {
		t.Fatalf("MarshalIndent returned error: %v", err)
	}
	if err := os.WriteFile(filepath.Join(root, "package.json"), append(packageJSON, '\n'), 0o644); err != nil {
		t.Fatalf("WriteFile returned error: %v", err)
	}
	if err := os.MkdirAll(filepath.Join(root, "fixtures"), 0o755); err != nil {
		t.Fatalf("MkdirAll returned error: %v", err)
	}
	if err := os.WriteFile(filepath.Join(root, "fixtures", "review.prompt.md"), []byte("standalone smoke prompt\n"), 0o644); err != nil {
		t.Fatalf("WriteFile returned error: %v", err)
	}
	if err := os.WriteFile(filepath.Join(root, "fixtures", "review.schema.json"), []byte("{\"type\":\"object\"}\n"), 0o644); err != nil {
		t.Fatalf("WriteFile returned error: %v", err)
	}
	writeExecutableFile(t, root, "variant.sh", `#!/bin/sh
output_file="$1"
printf '{"verdict":"pass","summary":"standalone smoke","findings":[{"severity":"pass","message":"standalone","path":"variant/sh"}]}\n' > "$output_file"
`)

	if _, stderr, exitCode := runCLI(t, root, "adapter", "init", "--repo-root", root); exitCode != 0 {
		t.Fatalf("adapter init failed: %s", stderr)
	}
	adapterPath := filepath.Join(root, ".agents", "cautilus-adapter.yaml")
	adapterText, err := os.ReadFile(adapterPath)
	if err != nil {
		t.Fatalf("ReadFile returned error: %v", err)
	}
	adapterText = append(adapterText, []byte(strings.Join([]string{
		"default_prompt_file: fixtures/review.prompt.md",
		"default_schema_file: fixtures/review.schema.json",
		"executor_variants:",
		"  - id: standalone",
		"    tool: command",
		"    purpose: standalone smoke variant",
		"    command_template: sh {candidate_repo}/variant.sh {output_file}",
		"",
	}, "\n"))...)
	if err := os.WriteFile(adapterPath, adapterText, 0o644); err != nil {
		t.Fatalf("WriteFile returned error: %v", err)
	}

	stdout, stderr, exitCode := runCLI(t, root, "doctor", "--repo-root", root)
	if exitCode != 0 {
		t.Fatalf("doctor failed: %s", stderr)
	}
	doctorPayload := parseJSONObject(t, stdout)
	if doctorPayload["ready"] != true || doctorPayload["status"] != "ready" {
		t.Fatalf("expected ready doctor payload, got %#v", doctorPayload)
	}

	outputDir := filepath.Join(root, "outputs")
	stdout, stderr, exitCode = runCLI(t, root, "review", "variants", "--repo-root", root, "--workspace", root, "--output-dir", outputDir)
	if exitCode != 0 {
		t.Fatalf("review variants failed: %s", stderr)
	}
	summary := readJSONObjectFile(t, strings.TrimSpace(stdout))
	if summary["repoRoot"] != root {
		t.Fatalf("expected repoRoot=%s, got %#v", root, summary["repoRoot"])
	}
	variants, ok := summary["variants"].([]any)
	if !ok || len(variants) != 1 {
		t.Fatalf("expected one variant summary, got %#v", summary["variants"])
	}
	variant := variants[0].(map[string]any)
	if variant["status"] != "passed" {
		t.Fatalf("expected passed variant, got %#v", variant)
	}
	output := variant["output"].(map[string]any)
	if output["summary"] != "standalone smoke" {
		t.Fatalf("expected standalone smoke summary, got %#v", output["summary"])
	}
	if strings.Contains(string(mustJSONMarshal(t, summary)), "/home/ubuntu/ceal/") {
		t.Fatalf("unexpected Ceal-local path leak in %#v", summary)
	}
}

func TestCLISkillsInstallCreatesRepoLocalCanonicalSkill(t *testing.T) {
	root := t.TempDir()

	stdout, stderr, exitCode := runCLI(t, root, "skills", "install")
	if exitCode != 0 {
		t.Fatalf("skills install failed: %s", stderr)
	}
	if !strings.Contains(stdout, ".agents/skills/cautilus") {
		t.Fatalf("expected install output, got %q", stdout)
	}

	skillPath := filepath.Join(root, ".agents", "skills", "cautilus", "SKILL.md")
	referencesPath := filepath.Join(root, ".agents", "skills", "cautilus", "references", "workflow.md")
	if _, err := os.Stat(skillPath); err != nil {
		t.Fatalf("expected installed skill: %v", err)
	}
	if _, err := os.Stat(referencesPath); err != nil {
		t.Fatalf("expected installed references: %v", err)
	}
	skill, err := os.ReadFile(skillPath)
	if err != nil {
		t.Fatalf("ReadFile returned error: %v", err)
	}
	if !strings.Contains(string(skill), "cautilus skills install") {
		t.Fatalf("expected skills install guidance in skill")
	}
	if !strings.Contains(string(skill), "cautilus doctor --repo-root .") {
		t.Fatalf("expected doctor guidance in skill")
	}
	if strings.Contains(string(skill), "node ./bin/cautilus") {
		t.Fatalf("unexpected repo-local node invocation in installed skill")
	}
	claudeSkills := filepath.Join(root, ".claude", "skills")
	info, err := os.Lstat(claudeSkills)
	if err != nil {
		t.Fatalf("Lstat returned error: %v", err)
	}
	if info.Mode()&os.ModeSymlink == 0 {
		t.Fatalf("expected %s to be a symlink", claudeSkills)
	}
	target, err := os.Readlink(claudeSkills)
	if err != nil {
		t.Fatalf("Readlink returned error: %v", err)
	}
	if target != "../.agents/skills" {
		t.Fatalf("unexpected symlink target: %s", target)
	}

	_, stderr, exitCode = runCLI(t, root, "skills", "install")
	if exitCode != 1 || !strings.Contains(stderr, "already exists") {
		t.Fatalf("expected already exists failure, got exit=%d stderr=%q", exitCode, stderr)
	}
}

func TestCLISkillsInstallMigratesLegacyClaudeSkills(t *testing.T) {
	root := t.TempDir()
	legacyDir := filepath.Join(root, ".claude", "skills", "legacy")
	if err := os.MkdirAll(legacyDir, 0o755); err != nil {
		t.Fatalf("MkdirAll returned error: %v", err)
	}
	if err := os.WriteFile(filepath.Join(legacyDir, "SKILL.md"), []byte("legacy\n"), 0o644); err != nil {
		t.Fatalf("WriteFile returned error: %v", err)
	}

	_, stderr, exitCode := runCLI(t, root, "skills", "install", "--overwrite")
	if exitCode != 0 {
		t.Fatalf("skills install --overwrite failed: %s", stderr)
	}
	if _, err := os.Stat(filepath.Join(root, ".agents", "skills", "legacy", "SKILL.md")); err != nil {
		t.Fatalf("expected migrated legacy skill: %v", err)
	}
	info, err := os.Lstat(filepath.Join(root, ".claude", "skills"))
	if err != nil {
		t.Fatalf("Lstat returned error: %v", err)
	}
	if info.Mode()&os.ModeSymlink == 0 {
		t.Fatalf("expected .claude/skills to be a symlink after migration")
	}
}

func TestCLIWorkspacePrepareCompareCreatesBaselineAndCandidateWorktrees(t *testing.T) {
	root := t.TempDir()
	runGit(t, root, "init")
	runGit(t, root, "config", "user.name", "Cautilus Test")
	runGit(t, root, "config", "user.email", "test@example.com")
	if err := os.WriteFile(filepath.Join(root, "sample.txt"), []byte("baseline\n"), 0o644); err != nil {
		t.Fatalf("WriteFile returned error: %v", err)
	}
	runGit(t, root, "add", "sample.txt")
	runGit(t, root, "commit", "-m", "baseline")
	baselineCommit := runGit(t, root, "rev-parse", "HEAD")
	if err := os.WriteFile(filepath.Join(root, "sample.txt"), []byte("candidate\n"), 0o644); err != nil {
		t.Fatalf("WriteFile returned error: %v", err)
	}
	runGit(t, root, "commit", "-am", "candidate")
	outputDir := filepath.Join(root, "compare")

	stdout, stderr, exitCode := runCLI(t, root, "workspace", "prepare-compare", "--repo-root", root, "--baseline-ref", baselineCommit, "--output-dir", outputDir)
	if exitCode != 0 {
		t.Fatalf("prepare-compare failed: %s", stderr)
	}
	payload := parseJSONObject(t, stdout)
	baseline := payload["baseline"].(map[string]any)
	candidate := payload["candidate"].(map[string]any)
	baselineText, err := os.ReadFile(filepath.Join(anyToString(baseline["path"]), "sample.txt"))
	if err != nil {
		t.Fatalf("ReadFile returned error: %v", err)
	}
	candidateText, err := os.ReadFile(filepath.Join(anyToString(candidate["path"]), "sample.txt"))
	if err != nil {
		t.Fatalf("ReadFile returned error: %v", err)
	}
	if string(baselineText) != "baseline\n" || string(candidateText) != "candidate\n" {
		t.Fatalf("unexpected worktree contents: baseline=%q candidate=%q", baselineText, candidateText)
	}
}

func TestCLIWorkspacePruneArtifactsPrunesOlderRecognizedDirectories(t *testing.T) {
	root := t.TempDir()
	artifactRoot := filepath.Join(root, "artifacts")
	oldRun := filepath.Join(artifactRoot, "run-old")
	newRun := filepath.Join(artifactRoot, "run-new")
	if err := os.MkdirAll(oldRun, 0o755); err != nil {
		t.Fatalf("MkdirAll returned error: %v", err)
	}
	if err := os.MkdirAll(newRun, 0o755); err != nil {
		t.Fatalf("MkdirAll returned error: %v", err)
	}
	if err := os.WriteFile(filepath.Join(oldRun, "report.json"), []byte("{}\n"), 0o644); err != nil {
		t.Fatalf("WriteFile returned error: %v", err)
	}
	if err := os.WriteFile(filepath.Join(newRun, "report.json"), []byte("{}\n"), 0o644); err != nil {
		t.Fatalf("WriteFile returned error: %v", err)
	}
	older, err := time.Parse(time.RFC3339Nano, "2026-04-01T00:00:00.000Z")
	if err != nil {
		t.Fatalf("time.Parse returned error: %v", err)
	}
	newer, err := time.Parse(time.RFC3339Nano, "2026-04-09T00:00:00.000Z")
	if err != nil {
		t.Fatalf("time.Parse returned error: %v", err)
	}
	if err := os.Chtimes(oldRun, older, older); err != nil {
		t.Fatalf("Chtimes returned error: %v", err)
	}
	if err := os.Chtimes(newRun, newer, newer); err != nil {
		t.Fatalf("Chtimes returned error: %v", err)
	}

	stdout, stderr, exitCode := runCLI(t, root, "workspace", "prune-artifacts", "--root", artifactRoot, "--keep-last", "1")
	if exitCode != 0 {
		t.Fatalf("prune-artifacts failed: %s", stderr)
	}
	payload := parseJSONObject(t, stdout)
	pruned := payload["pruned"].([]any)
	kept := payload["kept"].([]any)
	if len(pruned) != 1 || len(kept) != 1 {
		t.Fatalf("unexpected prune payload: %#v", payload)
	}
	if pruned[0].(map[string]any)["path"] != oldRun {
		t.Fatalf("expected old run to be pruned, got %#v", pruned)
	}
	if _, err := os.Stat(filepath.Join(newRun, "report.json")); err != nil {
		t.Fatalf("expected newer run to remain: %v", err)
	}
}

func TestCLIScenarioProposeGeneratesStandaloneProposalPacket(t *testing.T) {
	root := t.TempDir()
	inputPath := filepath.Join(root, "scenario-proposal-input.json")
	outputPath := filepath.Join(root, "scenario-proposals.json")
	input, err := json.MarshalIndent(map[string]any{
		"schemaVersion": contracts.ScenarioProposalInputsSchema,
		"windowDays":    14,
		"families":      []string{"fast_regression"},
		"proposalCandidates": []map[string]any{
			{
				"proposalKey":    "review-after-retro",
				"title":          "Refresh review-after-retro scenario from recent activity",
				"family":         "fast_regression",
				"name":           "Review After Retro",
				"description":    "The user pivots from retro back to review in one thread.",
				"brief":          "Recent activity shows a retro turn followed by a review turn.",
				"simulatorTurns": []string{"retro 먼저 해주세요", "이제 review로 돌아가죠"},
				"evidence": []map[string]any{
					{
						"sourceKind": "human_conversation",
						"title":      "review after retro",
						"threadKey":  "thread-1",
						"observedAt": "2026-04-09T21:00:00.000Z",
						"messages":   []string{"retro 먼저 해주세요", "이제 review로 돌아가죠"},
					},
				},
			},
		},
		"existingScenarioRegistry": []map[string]any{
			{
				"scenarioId":  "review-after-retro",
				"scenarioKey": "review-after-retro",
				"family":      "fast_regression",
			},
		},
		"scenarioCoverage": []map[string]any{
			{
				"scenarioKey":       "review-after-retro",
				"recentResultCount": 2,
			},
		},
		"now": "2026-04-11T00:00:00.000Z",
	}, "", "  ")
	if err != nil {
		t.Fatalf("MarshalIndent returned error: %v", err)
	}
	if err := os.WriteFile(inputPath, append(input, '\n'), 0o644); err != nil {
		t.Fatalf("WriteFile returned error: %v", err)
	}

	_, stderr, exitCode := runCLI(t, root, "scenario", "propose", "--input", inputPath, "--output", outputPath)
	if exitCode != 0 {
		t.Fatalf("scenario propose failed: %s", stderr)
	}
	payload := readJSONObjectFile(t, outputPath)
	if payload["schemaVersion"] != contracts.ScenarioProposalsSchema {
		t.Fatalf("expected scenario proposals schema, got %#v", payload["schemaVersion"])
	}
	proposals := payload["proposals"].([]any)
	if len(proposals) != 1 {
		t.Fatalf("expected one proposal, got %#v", payload["proposals"])
	}
	proposal := proposals[0].(map[string]any)
	if proposal["action"] != "refresh_existing_scenario" {
		t.Fatalf("expected refresh_existing_scenario, got %#v", proposal["action"])
	}
	draftScenario := proposal["draftScenario"].(map[string]any)
	if draftScenario["schemaVersion"] != contracts.DraftScenarioSchema {
		t.Fatalf("unexpected draft scenario schema: %#v", draftScenario["schemaVersion"])
	}
}

func TestCLIScenarioSummarizeTelemetryAggregatesScenarioCosts(t *testing.T) {
	root := t.TempDir()
	inputPath := filepath.Join(root, "results.json")
	input, err := json.Marshal(map[string]any{
		"schemaVersion": contracts.ScenarioResultsSchema,
		"mode":          "held_out",
		"results": []map[string]any{
			{
				"scenarioId": "alpha",
				"durationMs": 100,
				"telemetry":  map[string]any{"total_tokens": 120, "cost_usd": 0.01},
			},
			{
				"scenarioId": "beta",
				"durationMs": 200,
				"telemetry":  map[string]any{"total_tokens": 220, "cost_usd": 0.02},
			},
		},
	})
	if err != nil {
		t.Fatalf("Marshal returned error: %v", err)
	}
	if err := os.WriteFile(inputPath, append(input, '\n'), 0o644); err != nil {
		t.Fatalf("WriteFile returned error: %v", err)
	}

	stdout, stderr, exitCode := runCLI(t, root, "scenario", "summarize-telemetry", "--results", inputPath)
	if exitCode != 0 {
		t.Fatalf("summarize-telemetry failed: %s", stderr)
	}
	payload := parseJSONObject(t, stdout)
	overall := payload["overall"].(map[string]any)
	if overall["runCount"] != float64(2) && overall["runCount"] != 2 {
		t.Fatalf("unexpected runCount: %#v", overall["runCount"])
	}
	if overall["total_tokens"] != float64(340) && overall["total_tokens"] != 340 {
		t.Fatalf("unexpected token total: %#v", overall["total_tokens"])
	}
	scenarios := payload["scenarios"].([]any)
	if scenarios[0].(map[string]any)["scenarioId"] != "beta" {
		t.Fatalf("expected beta to sort first, got %#v", scenarios)
	}
}

func TestCLIReportBuildEmitsMachineReadableReportPacket(t *testing.T) {
	root := t.TempDir()
	inputPath := filepath.Join(root, "report-input.json")
	writeJSONFile(t, inputPath, map[string]any{
		"schemaVersion": contracts.ReportInputsSchema,
		"candidate":     "feature/intentful-cli",
		"baseline":      "origin/main",
		"intent":        "The CLI should explain missing adapter setup without operator guesswork.",
		"intentProfile": map[string]any{
			"schemaVersion":   contracts.BehaviorIntentSchema,
			"intentId":        "intent-missing-adapter-guidance",
			"summary":         "The CLI should explain missing adapter setup without operator guesswork.",
			"behaviorSurface": cautilusruntime.BehaviorSurfaces["OPERATOR_CLI"],
			"successDimensions": []map[string]any{
				{
					"id":      cautilusruntime.BehaviorDimensions["FAILURE_CAUSE_CLARITY"],
					"summary": "Explain the concrete failure cause or missing prerequisite.",
				},
			},
			"guardrailDimensions": []any{},
		},
		"commands": []map[string]any{
			{
				"mode":    "held_out",
				"command": "cautilus doctor --repo-root /tmp/repo",
			},
		},
		"modeRuns": []map[string]any{
			{
				"mode":       "held_out",
				"status":     "passed",
				"durationMs": 10000,
				"scenarioResults": map[string]any{
					"schemaVersion": contracts.ScenarioResultsSchema,
					"mode":          "held_out",
					"results": []map[string]any{
						{
							"scenarioId": "doctor-missing-adapter",
							"durationMs": 1200,
							"telemetry": map[string]any{
								"total_tokens": 200,
								"cost_usd":     0.02,
							},
						},
					},
					"compareArtifact": map[string]any{
						"schemaVersion": contracts.CompareArtifactSchema,
						"summary":       "Missing-adapter messaging improved.",
						"verdict":       "improved",
						"improved":      []string{"doctor-missing-adapter"},
					},
				},
			},
			{
				"mode":       "full_gate",
				"status":     "failed",
				"durationMs": 15000,
				"telemetry": map[string]any{
					"total_tokens": 300,
					"cost_usd":     0.03,
				},
			},
		},
		"humanReviewFindings": []map[string]any{
			{
				"severity": "concern",
				"message":  "CLI wording is still terse",
			},
		},
		"recommendation": "defer",
	})

	stdout, stderr, exitCode := runCLI(t, root, "report", "build", "--input", inputPath)
	if exitCode != 0 {
		t.Fatalf("report build failed: %s", stderr)
	}
	payload := parseJSONObject(t, stdout)
	if payload["schemaVersion"] != contracts.ReportPacketSchema {
		t.Fatalf("unexpected report schema: %#v", payload["schemaVersion"])
	}
	intentProfile := payload["intentProfile"].(map[string]any)
	if intentProfile["intentId"] != "intent-missing-adapter-guidance" {
		t.Fatalf("unexpected intent profile: %#v", intentProfile)
	}
	modeSummaries := payload["modeSummaries"].([]any)
	if len(modeSummaries) != 2 {
		t.Fatalf("unexpected mode summaries: %#v", modeSummaries)
	}
	firstSummary := modeSummaries[0].(map[string]any)
	scenarioTelemetrySummary := firstSummary["scenarioTelemetrySummary"].(map[string]any)
	overall := scenarioTelemetrySummary["overall"].(map[string]any)
	if overall["total_tokens"] != float64(200) {
		t.Fatalf("unexpected scenario telemetry total: %#v", overall["total_tokens"])
	}
	compareArtifact := firstSummary["compareArtifact"].(map[string]any)
	if compareArtifact["verdict"] != "improved" {
		t.Fatalf("unexpected compare artifact: %#v", compareArtifact)
	}
}

func TestCLICliEvaluateExecutesIntentPacketAndEmitsReportBackedSummary(t *testing.T) {
	root := t.TempDir()
	repoRoot := repoToolRoot(t)
	workspace := filepath.Join(root, "workspace")
	if err := os.MkdirAll(workspace, 0o755); err != nil {
		t.Fatalf("MkdirAll returned error: %v", err)
	}
	inputPath := filepath.Join(root, "cli-input.json")
	writeJSONFile(t, inputPath, map[string]any{
		"schemaVersion":    contracts.CliEvaluationInputsSchema,
		"candidate":        "current-cautilus-cli",
		"baseline":         "current-doctor-contract",
		"intent":           "The doctor command should explain missing adapter setup.",
		"surfaceId":        "doctor-missing-adapter",
		"mode":             "held_out",
		"workingDirectory": repoRoot,
		"command":          []string{"go", "run", "./cmd/cautilus", "doctor", "--repo-root", workspace},
		"expectations": map[string]any{
			"exitCode":          1,
			"stdoutContains":    []string{"missing_adapter", "adapter init"},
			"stderrNotContains": []string{"Traceback"},
		},
	})

	stdout, stderr, exitCode := runCLI(t, root, "cli", "evaluate", "--input", inputPath)
	if exitCode != 0 {
		t.Fatalf("cli evaluate failed: %s", stderr)
	}
	payload := parseJSONObject(t, stdout)
	if payload["schemaVersion"] != contracts.CliEvaluationPacketSchema {
		t.Fatalf("unexpected cli evaluation schema: %#v", payload["schemaVersion"])
	}
	summary := payload["summary"].(map[string]any)
	if summary["recommendation"] != "accept-now" {
		t.Fatalf("unexpected summary: %#v", summary)
	}
	report := payload["report"].(map[string]any)
	if report["schemaVersion"] != contracts.ReportPacketSchema {
		t.Fatalf("unexpected report schema: %#v", report["schemaVersion"])
	}
	reportIntentProfile := report["intentProfile"].(map[string]any)
	if reportIntentProfile["intentId"] != "intent-the-doctor-command-should-explain-missing-adapter-setup" {
		t.Fatalf("unexpected report intent profile: %#v", reportIntentProfile)
	}
}

func TestCLIModeEvaluateExecutesAdapterCommandTemplatesAndWritesReportPacket(t *testing.T) {
	root := t.TempDir()
	adapterDir := filepath.Join(root, ".agents")
	workspace := filepath.Join(root, "workspace")
	if err := os.MkdirAll(adapterDir, 0o755); err != nil {
		t.Fatalf("MkdirAll returned error: %v", err)
	}
	if err := os.MkdirAll(workspace, 0o755); err != nil {
		t.Fatalf("MkdirAll returned error: %v", err)
	}
	writeExecutableFile(t, workspace, "bench.sh", `#!/bin/sh
scenario_results_file="$1"
cat > "$scenario_results_file" <<'JSON'
{
  "schemaVersion": "cautilus.scenario_results.v1",
  "mode": "held_out",
  "results": [
    {
      "scenarioId": "doctor-missing-adapter",
      "status": "passed",
      "durationMs": 90,
      "telemetry": {
        "total_tokens": 21,
        "cost_usd": 0.005
      }
    }
  ],
  "compareArtifact": {
    "schemaVersion": "cautilus.compare_artifact.v1",
    "summary": "CLI doctor recovery stayed explicit.",
    "verdict": "improved",
    "improved": [
      "doctor-missing-adapter"
    ]
  }
}
JSON
echo ok
`)
	if err := os.WriteFile(filepath.Join(adapterDir, "cautilus-adapter.yaml"), []byte(strings.Join([]string{
		"version: 1",
		"repo: temp",
		"evaluation_surfaces:",
		"  - cli behavior",
		"baseline_options:",
		"  - baseline git ref via {baseline_ref}",
		"held_out_command_templates:",
		"  - sh {candidate_repo}/bench.sh {scenario_results_file}",
		"",
	}, "\n")), 0o644); err != nil {
		t.Fatalf("WriteFile returned error: %v", err)
	}
	outputDir := filepath.Join(root, "outputs")
	stdout, stderr, exitCode := runCLI(t, root, "mode", "evaluate", "--repo-root", root, "--candidate-repo", workspace, "--mode", "held_out", "--intent", "CLI behavior should remain legible.", "--baseline-ref", "origin/main", "--output-dir", outputDir)
	if exitCode != 0 {
		t.Fatalf("mode evaluate failed: %s", stderr)
	}
	report := readJSONObjectFile(t, strings.TrimSpace(stdout))
	if report["schemaVersion"] != contracts.ReportPacketSchema {
		t.Fatalf("unexpected report schema: %#v", report["schemaVersion"])
	}
	if report["recommendation"] != "defer" {
		t.Fatalf("unexpected recommendation: %#v", report["recommendation"])
	}
	commandObservations := report["commandObservations"].([]any)
	if len(commandObservations) != 1 {
		t.Fatalf("unexpected command observations: %#v", commandObservations)
	}
	modeSummaries := report["modeSummaries"].([]any)
	firstSummary := modeSummaries[0].(map[string]any)
	scenarioTelemetrySummary := firstSummary["scenarioTelemetrySummary"].(map[string]any)
	overall := scenarioTelemetrySummary["overall"].(map[string]any)
	if overall["total_tokens"] != float64(21) {
		t.Fatalf("unexpected scenario telemetry: %#v", overall)
	}
	compareArtifact := firstSummary["compareArtifact"].(map[string]any)
	if compareArtifact["verdict"] != "improved" {
		t.Fatalf("unexpected compare artifact: %#v", compareArtifact)
	}
}

func TestCLIReviewPrepareInputBuildsReviewPacketFromAdapterSurfacesAndReport(t *testing.T) {
	root := t.TempDir()
	adapterDir := filepath.Join(root, ".agents")
	if err := os.MkdirAll(adapterDir, 0o755); err != nil {
		t.Fatalf("MkdirAll returned error: %v", err)
	}
	if err := os.MkdirAll(filepath.Join(root, "fixtures"), 0o755); err != nil {
		t.Fatalf("MkdirAll returned error: %v", err)
	}
	if err := os.MkdirAll(filepath.Join(root, "reports"), 0o755); err != nil {
		t.Fatalf("MkdirAll returned error: %v", err)
	}
	if err := os.WriteFile(filepath.Join(root, "fixtures", "review.prompt.md"), []byte("prompt\n"), 0o644); err != nil {
		t.Fatalf("WriteFile returned error: %v", err)
	}
	if err := os.WriteFile(filepath.Join(root, "fixtures", "review.schema.json"), []byte("{\"type\":\"object\"}\n"), 0o644); err != nil {
		t.Fatalf("WriteFile returned error: %v", err)
	}
	if err := os.WriteFile(filepath.Join(adapterDir, "cautilus-adapter.yaml"), []byte(strings.Join([]string{
		"version: 1",
		"repo: temp",
		"evaluation_surfaces:",
		"  - cli behavior",
		"baseline_options:",
		"  - baseline git ref via {baseline_ref}",
		"held_out_command_templates:",
		"  - npm run held-out",
		"artifact_paths:",
		"  - fixtures/review.prompt.md",
		"report_paths:",
		"  - reports/latest.json",
		"comparison_questions:",
		"  - Which scenarios improved?",
		"human_review_prompts:",
		"  - id: operator",
		"    prompt: Where is the workflow still brittle?",
		"default_prompt_file: fixtures/review.prompt.md",
		"default_schema_file: fixtures/review.schema.json",
		"",
	}, "\n")), 0o644); err != nil {
		t.Fatalf("WriteFile returned error: %v", err)
	}
	reportFile := filepath.Join(root, "reports", "latest.json")
	writeJSONFile(t, reportFile, map[string]any{
		"schemaVersion": contracts.ReportPacketSchema,
		"generatedAt":   "2026-04-11T00:00:00.000Z",
		"candidate":     "feature/cli",
		"baseline":      "origin/main",
		"intent":        "CLI behavior should stay legible.",
		"intentProfile": map[string]any{
			"schemaVersion":   contracts.BehaviorIntentSchema,
			"intentId":        "intent-cli-behavior-legibility",
			"summary":         "CLI behavior should stay legible.",
			"behaviorSurface": cautilusruntime.BehaviorSurfaces["OPERATOR_CLI"],
			"successDimensions": []map[string]any{
				{
					"id":      cautilusruntime.BehaviorDimensions["OPERATOR_GUIDANCE_CLARITY"],
					"summary": "Keep the operator-facing guidance explicit and easy to follow.",
				},
			},
			"guardrailDimensions": []any{},
		},
		"commands":            []any{},
		"modesRun":            []any{},
		"modeSummaries":       []any{},
		"telemetry":           map[string]any{},
		"improved":            []any{},
		"regressed":           []any{},
		"unchanged":           []any{},
		"noisy":               []any{},
		"humanReviewFindings": []any{},
		"recommendation":      "defer",
	})

	stdout, stderr, exitCode := runCLI(t, root, "review", "prepare-input", "--repo-root", root, "--report-file", reportFile)
	if exitCode != 0 {
		t.Fatalf("review prepare-input failed: %s", stderr)
	}
	packet := parseJSONObject(t, stdout)
	if packet["schemaVersion"] != contracts.ReviewPacketSchema {
		t.Fatalf("unexpected review packet schema: %#v", packet["schemaVersion"])
	}
	artifactFiles := packet["artifactFiles"].([]any)
	if artifactFiles[0].(map[string]any)["exists"] != true {
		t.Fatalf("expected existing artifact file, got %#v", artifactFiles)
	}
	humanReviewPrompts := packet["humanReviewPrompts"].([]any)
	if humanReviewPrompts[0].(map[string]any)["id"] != "operator" {
		t.Fatalf("unexpected human review prompts: %#v", humanReviewPrompts)
	}
	report := packet["report"].(map[string]any)
	intentProfile := report["intentProfile"].(map[string]any)
	if intentProfile["intentId"] != "intent-cli-behavior-legibility" {
		t.Fatalf("unexpected report intent profile: %#v", intentProfile)
	}
}

func TestCLIReviewBuildPromptInputAndRenderPromptCloseMetaPromptSeam(t *testing.T) {
	root := t.TempDir()
	reviewPacketPath := filepath.Join(root, "review-packet.json")
	promptPath := filepath.Join(root, "review.prompt.md")
	promptInputPath := filepath.Join(root, "review-prompt-input.json")
	if err := os.MkdirAll(filepath.Join(root, "fixtures"), 0o755); err != nil {
		t.Fatalf("MkdirAll returned error: %v", err)
	}
	if err := os.WriteFile(filepath.Join(root, "fixtures", "consumer.prompt.md"), []byte("Prefer operator-visible evidence.\n"), 0o644); err != nil {
		t.Fatalf("WriteFile returned error: %v", err)
	}
	writeJSONFile(t, reviewPacketPath, map[string]any{
		"schemaVersion": contracts.ReviewPacketSchema,
		"generatedAt":   "2026-04-11T00:03:00.000Z",
		"repoRoot":      root,
		"adapterPath":   filepath.Join(root, ".agents", "cautilus-adapter.yaml"),
		"reportFile":    filepath.Join(root, "report.json"),
		"report": map[string]any{
			"schemaVersion": contracts.ReportPacketSchema,
			"generatedAt":   "2026-04-11T00:02:00.000Z",
			"candidate":     "feature/cli",
			"baseline":      "origin/main",
			"intent":        "The CLI should explain missing adapter setup without operator guesswork.",
			"intentProfile": map[string]any{
				"schemaVersion":   contracts.BehaviorIntentSchema,
				"intentId":        "intent-missing-adapter-guidance",
				"summary":         "The CLI should explain missing adapter setup without operator guesswork.",
				"behaviorSurface": cautilusruntime.BehaviorSurfaces["OPERATOR_CLI"],
				"successDimensions": []map[string]any{
					{
						"id":      cautilusruntime.BehaviorDimensions["FAILURE_CAUSE_CLARITY"],
						"summary": "Explain the concrete failure cause or missing prerequisite.",
					},
				},
				"guardrailDimensions": []any{},
			},
			"commands":            []any{},
			"commandObservations": []any{},
			"modesRun":            []string{"held_out"},
			"modeSummaries": []map[string]any{
				{
					"mode":    "held_out",
					"status":  "passed",
					"summary": "held_out completed across 1 command.",
					"compareArtifact": map[string]any{
						"schemaVersion": contracts.CompareArtifactSchema,
						"summary":       "Held-out doctor messaging improved.",
						"verdict":       "improved",
						"improved":      []string{"doctor-missing-adapter"},
					},
				},
			},
			"telemetry":           map[string]any{"modeCount": 1},
			"improved":            []string{"doctor-missing-adapter"},
			"regressed":           []any{},
			"unchanged":           []any{},
			"noisy":               []any{},
			"humanReviewFindings": []any{},
			"recommendation":      "defer",
		},
		"defaultPromptFile": map[string]any{
			"relativePath": "fixtures/consumer.prompt.md",
			"absolutePath": filepath.Join(root, "fixtures", "consumer.prompt.md"),
			"exists":       true,
		},
		"defaultSchemaFile":   nil,
		"artifactFiles":       []any{},
		"reportArtifacts":     []any{},
		"comparisonQuestions": []string{"Which scenario-level deltas actually matter to a real operator?"},
		"humanReviewPrompts": []map[string]any{
			{
				"id":     "real-user",
				"prompt": "Where would a real user still judge the candidate worse despite benchmark wins?",
			},
		},
	})

	_, stderr, exitCode := runCLI(t, root, "review", "build-prompt-input", "--review-packet", reviewPacketPath, "--output", promptInputPath)
	if exitCode != 0 {
		t.Fatalf("review build-prompt-input failed: %s", stderr)
	}
	promptInput := readJSONObjectFile(t, promptInputPath)
	if promptInput["schemaVersion"] != contracts.ReviewPromptInputsSchema {
		t.Fatalf("unexpected prompt input schema: %#v", promptInput["schemaVersion"])
	}
	_, stderr, exitCode = runCLI(t, root, "review", "render-prompt", "--input", promptInputPath, "--output", promptPath)
	if exitCode != 0 {
		t.Fatalf("review render-prompt failed: %s", stderr)
	}
	promptBytes, err := os.ReadFile(promptPath)
	if err != nil {
		t.Fatalf("ReadFile returned error: %v", err)
	}
	prompt := string(promptBytes)
	if !strings.Contains(prompt, "Held-out doctor messaging improved.") || !strings.Contains(prompt, "## Intent Profile") || !strings.Contains(prompt, "Prefer operator-visible evidence.") {
		t.Fatalf("unexpected rendered prompt: %s", prompt)
	}
}

func TestCLIOptimizePrepareInputProposeAndBuildArtifact(t *testing.T) {
	root := t.TempDir()
	reportPath := filepath.Join(root, "report.json")
	reviewSummaryPath := filepath.Join(root, "review-summary.json")
	historyPath := filepath.Join(root, "scenario-history.snapshot.json")
	targetPath := filepath.Join(root, "prompt.md")
	inputPath := filepath.Join(root, "optimize-input.json")
	proposalPath := filepath.Join(root, "optimize-proposal.json")
	artifactPath := filepath.Join(root, "revision-artifact.json")
	if err := os.WriteFile(targetPath, []byte("Keep operator guidance explicit.\n"), 0o644); err != nil {
		t.Fatalf("WriteFile returned error: %v", err)
	}
	writeJSONFile(t, reportPath, map[string]any{
		"schemaVersion": contracts.ReportPacketSchema,
		"generatedAt":   "2026-04-11T00:02:00.000Z",
		"candidate":     "feature/cli",
		"baseline":      "origin/main",
		"intent":        "CLI recovery guidance should stay legible.",
		"intentProfile": map[string]any{
			"schemaVersion":   contracts.BehaviorIntentSchema,
			"intentId":        "intent-cli-recovery-guidance",
			"summary":         "CLI recovery guidance should stay legible.",
			"behaviorSurface": cautilusruntime.BehaviorSurfaces["OPERATOR_CLI"],
			"successDimensions": []map[string]any{
				{
					"id":      cautilusruntime.BehaviorDimensions["RECOVERY_NEXT_STEP"],
					"summary": "Make the next safe recovery step explicit without operator guesswork.",
				},
			},
			"guardrailDimensions": []any{},
		},
		"commands":            []any{},
		"commandObservations": []any{},
		"modesRun":            []string{"held_out"},
		"modeSummaries":       []any{},
		"telemetry":           map[string]any{},
		"improved":            []any{},
		"regressed":           []string{"operator-recovery"},
		"unchanged":           []any{},
		"noisy":               []any{},
		"humanReviewFindings": []any{},
		"recommendation":      "defer",
	})
	writeJSONFile(t, reviewSummaryPath, map[string]any{
		"variants": []map[string]any{
			{
				"id":     "codex-review",
				"status": "failed",
				"output": map[string]any{
					"findings": []map[string]any{
						{
							"severity": "blocker",
							"message":  "Retry guidance is still ambiguous.",
							"path":     "variant/codex-review",
						},
					},
				},
			},
		},
	})
	writeJSONFile(t, historyPath, map[string]any{
		"schemaVersion": contracts.ScenarioHistorySchema,
		"profileId":     "default-train",
		"trainRunCount": 1,
		"scenarioStats": map[string]any{
			"operator-recovery": map[string]any{
				"lastTrainRunIndex":  1,
				"graduationInterval": 1,
				"recentTrainResults": []map[string]any{
					{
						"runIndex":     1,
						"timestamp":    "2026-04-10T23:58:00.000Z",
						"overallScore": 80,
						"passRate":     0,
						"status":       "failed",
						"fullCheck":    false,
					},
				},
			},
		},
		"recentRuns": []any{},
	})

	_, stderr, exitCode := runCLI(t, root, "optimize", "prepare-input", "--repo-root", root, "--report-file", reportPath, "--review-summary", reviewSummaryPath, "--history-file", historyPath, "--target", "prompt", "--target-file", targetPath, "--output", inputPath)
	if exitCode != 0 {
		t.Fatalf("optimize prepare-input failed: %s", stderr)
	}
	prepared := readJSONObjectFile(t, inputPath)
	if prepared["schemaVersion"] != contracts.OptimizeInputsSchema {
		t.Fatalf("unexpected optimize input schema: %#v", prepared["schemaVersion"])
	}
	if prepared["optimizationTarget"] != "prompt" {
		t.Fatalf("unexpected optimization target: %#v", prepared["optimizationTarget"])
	}
	intentProfile := prepared["intentProfile"].(map[string]any)
	if intentProfile["intentId"] != "intent-cli-recovery-guidance" {
		t.Fatalf("unexpected optimize input intent profile: %#v", intentProfile)
	}

	_, stderr, exitCode = runCLI(t, root, "optimize", "propose", "--input", inputPath, "--output", proposalPath)
	if exitCode != 0 {
		t.Fatalf("optimize propose failed: %s", stderr)
	}
	proposal := readJSONObjectFile(t, proposalPath)
	if proposal["schemaVersion"] != contracts.OptimizeProposalSchema || proposal["decision"] != "revise" {
		t.Fatalf("unexpected proposal: %#v", proposal)
	}
	if proposal["intentProfile"].(map[string]any)["intentId"] != "intent-cli-recovery-guidance" {
		t.Fatalf("unexpected proposal intent profile: %#v", proposal["intentProfile"])
	}
	if !strings.Contains(anyToString(proposal["revisionBrief"]), "Do not weaken held-out, comparison, or review gates.") {
		t.Fatalf("unexpected revision brief: %#v", proposal["revisionBrief"])
	}

	_, stderr, exitCode = runCLI(t, root, "optimize", "build-artifact", "--proposal-file", proposalPath, "--output", artifactPath)
	if exitCode != 0 {
		t.Fatalf("optimize build-artifact failed: %s", stderr)
	}
	revisionArtifact := readJSONObjectFile(t, artifactPath)
	if revisionArtifact["schemaVersion"] != contracts.RevisionArtifactSchema {
		t.Fatalf("unexpected revision artifact schema: %#v", revisionArtifact["schemaVersion"])
	}
	reportContext := revisionArtifact["reportContext"].(map[string]any)
	if reportContext["candidate"] != "feature/cli" {
		t.Fatalf("unexpected report context: %#v", reportContext)
	}
	if revisionArtifact["intentProfile"].(map[string]any)["intentId"] != "intent-cli-recovery-guidance" {
		t.Fatalf("unexpected revision artifact intent profile: %#v", revisionArtifact["intentProfile"])
	}
	targetSnapshot := revisionArtifact["targetSnapshot"].(map[string]any)
	if len(anyToString(targetSnapshot["sha256"])) != 64 {
		t.Fatalf("unexpected target snapshot hash: %#v", targetSnapshot)
	}
}

func TestCLIEvidencePrepareInputAndBundleProduceNormalizedEvidencePacket(t *testing.T) {
	root := t.TempDir()
	reportPath := filepath.Join(root, "report.json")
	scenarioResultsPath := filepath.Join(root, "scenario-results.json")
	runAuditPath := filepath.Join(root, "run-audit-summary.json")
	inputPath := filepath.Join(root, "evidence-input.json")
	bundlePath := filepath.Join(root, "evidence-bundle.json")
	writeJSONFile(t, reportPath, map[string]any{
		"schemaVersion": contracts.ReportPacketSchema,
		"generatedAt":   "2026-04-11T00:02:00.000Z",
		"candidate":     "feature/cli",
		"baseline":      "origin/main",
		"intent":        "CLI recovery guidance should stay legible.",
		"intentProfile": map[string]any{
			"schemaVersion":   contracts.BehaviorIntentSchema,
			"intentId":        "intent-cli-recovery-guidance",
			"summary":         "CLI recovery guidance should stay legible.",
			"behaviorSurface": cautilusruntime.BehaviorSurfaces["OPERATOR_CLI"],
			"successDimensions": []map[string]any{
				{
					"id":      cautilusruntime.BehaviorDimensions["RECOVERY_NEXT_STEP"],
					"summary": "Make the next safe recovery step explicit without operator guesswork.",
				},
			},
			"guardrailDimensions": []any{},
		},
		"commands":            []any{},
		"commandObservations": []any{},
		"modesRun":            []string{"held_out"},
		"modeSummaries":       []any{},
		"telemetry":           map[string]any{},
		"improved":            []any{},
		"regressed":           []string{"operator-recovery"},
		"unchanged":           []any{},
		"noisy":               []any{},
		"humanReviewFindings": []any{},
		"recommendation":      "defer",
	})
	writeJSONFile(t, scenarioResultsPath, map[string]any{
		"schemaVersion": contracts.ScenarioResultsSchema,
		"generatedAt":   "2026-04-11T00:00:10.000Z",
		"source":        "fixture",
		"mode":          "held_out",
		"results": []map[string]any{
			{
				"scenarioId": "operator-recovery",
				"status":     "failed",
				"durationMs": 1200,
			},
		},
	})
	writeJSONFile(t, runAuditPath, map[string]any{
		"summary": map[string]any{
			"totals": map[string]any{
				"runs":             2,
				"launch_only_runs": 1,
			},
			"warnings": map[string]any{
				"slow_llm_runs":        1,
				"slow_transition_runs": 0,
				"high_token_runs":      0,
			},
		},
	})

	_, stderr, exitCode := runCLI(t, root, "evidence", "prepare-input", "--repo-root", root, "--report-file", reportPath, "--scenario-results-file", scenarioResultsPath, "--run-audit-file", runAuditPath, "--output", inputPath)
	if exitCode != 0 {
		t.Fatalf("evidence prepare-input failed: %s", stderr)
	}
	prepared := readJSONObjectFile(t, inputPath)
	if prepared["schemaVersion"] != contracts.EvidenceBundleInputsSchema {
		t.Fatalf("unexpected evidence input schema: %#v", prepared["schemaVersion"])
	}
	sources := prepared["sources"].([]any)
	if len(sources) != 3 {
		t.Fatalf("unexpected evidence sources: %#v", sources)
	}

	_, stderr, exitCode = runCLI(t, root, "evidence", "bundle", "--input", inputPath, "--output", bundlePath)
	if exitCode != 0 {
		t.Fatalf("evidence bundle failed: %s", stderr)
	}
	payload := readJSONObjectFile(t, bundlePath)
	if payload["schemaVersion"] != contracts.EvidenceBundleSchema {
		t.Fatalf("unexpected evidence bundle schema: %#v", payload["schemaVersion"])
	}
	summary := payload["summary"].(map[string]any)
	if summary["highSignalCount"] == float64(0) || summary["highSignalCount"] == 0 {
		t.Fatalf("expected at least one high signal: %#v", summary)
	}
	signals := payload["signals"].([]any)
	if signals[0].(map[string]any)["severity"] != "high" {
		t.Fatalf("unexpected signals: %#v", signals)
	}
}

func TestCLIScenarioPrepareInputBuildsProposalPacketFromSplitNormalizedSources(t *testing.T) {
	root := t.TempDir()
	candidatesPath := filepath.Join(root, "candidates.json")
	registryPath := filepath.Join(root, "registry.json")
	coveragePath := filepath.Join(root, "coverage.json")
	inputPath := filepath.Join(root, "scenario-proposal-input.json")
	outputPath := filepath.Join(root, "scenario-proposals.json")
	writeJSONFile(t, candidatesPath, []map[string]any{
		{
			"proposalKey":    "review-after-retro",
			"title":          "Refresh review-after-retro scenario from recent activity",
			"family":         "fast_regression",
			"name":           "Review After Retro",
			"description":    "The user pivots from retro back to review in one thread.",
			"brief":          "Recent activity shows a retro turn followed by a review turn.",
			"simulatorTurns": []string{"retro 먼저 해주세요", "이제 review로 돌아가죠"},
			"evidence": []map[string]any{
				{
					"sourceKind": "human_conversation",
					"title":      "review after retro",
					"threadKey":  "thread-1",
					"observedAt": "2026-04-09T21:00:00.000Z",
					"messages":   []string{"retro 먼저 해주세요", "이제 review로 돌아가죠"},
				},
			},
		},
	})
	writeJSONFile(t, registryPath, []map[string]any{
		{
			"scenarioId":  "review-after-retro",
			"scenarioKey": "review-after-retro",
			"family":      "fast_regression",
		},
	})
	writeJSONFile(t, coveragePath, []map[string]any{
		{
			"scenarioKey":       "review-after-retro",
			"recentResultCount": 2,
		},
	})

	_, stderr, exitCode := runCLI(t, root, "scenario", "prepare-input", "--candidates", candidatesPath, "--registry", registryPath, "--coverage", coveragePath, "--family", "fast_regression", "--window-days", "14", "--now", "2026-04-11T00:00:00.000Z", "--output", inputPath)
	if exitCode != 0 {
		t.Fatalf("scenario prepare-input failed: %s", stderr)
	}
	prepared := readJSONObjectFile(t, inputPath)
	if prepared["schemaVersion"] != contracts.ScenarioProposalInputsSchema {
		t.Fatalf("unexpected proposal input schema: %#v", prepared["schemaVersion"])
	}
	if len(prepared["proposalCandidates"].([]any)) != 1 {
		t.Fatalf("unexpected proposal candidates: %#v", prepared["proposalCandidates"])
	}

	_, stderr, exitCode = runCLI(t, root, "scenario", "propose", "--input", inputPath, "--output", outputPath)
	if exitCode != 0 {
		t.Fatalf("scenario propose failed: %s", stderr)
	}
	payload := readJSONObjectFile(t, outputPath)
	proposals := payload["proposals"].([]any)
	if len(proposals) != 1 {
		t.Fatalf("unexpected proposals: %#v", proposals)
	}
	if proposals[0].(map[string]any)["proposalKey"] != "review-after-retro" {
		t.Fatalf("unexpected proposal key: %#v", proposals[0])
	}
}

func TestCLIScenarioNormalizeChatbotProducesCandidatesThatChainIntoPrepareAndPropose(t *testing.T) {
	root := t.TempDir()
	chatbotInputPath := filepath.Join(root, "chatbot-input.json")
	candidatesPath := filepath.Join(root, "chatbot-candidates.json")
	proposalInputPath := filepath.Join(root, "scenario-proposal-input.json")
	proposalOutputPath := filepath.Join(root, "scenario-proposals.json")
	registryPath := filepath.Join(root, "registry.json")
	coveragePath := filepath.Join(root, "coverage.json")
	writeJSONFile(t, chatbotInputPath, map[string]any{
		"schemaVersion": contracts.ChatbotNormalizationInputsSchema,
		"conversationSummaries": []map[string]any{
			{
				"threadKey":      "thread-chatbot-1",
				"lastObservedAt": "2026-04-11T00:00:00.000Z",
				"records": []map[string]any{
					{"actorKind": "user", "text": "repo review 해주세요"},
					{"actorKind": "user", "text": "지금 이 저장소 기준으로 봐주세요"},
				},
			},
		},
		"runSummaries": []map[string]any{
			{
				"runId":         "run-chatbot-1",
				"threadKey":     "thread-chatbot-2",
				"startedAt":     "2026-04-11T00:00:00.000Z",
				"textPreview":   "네, 그대로 진행해주세요.",
				"blockedReason": "ambiguous_confirmation_without_thread_context",
			},
		},
	})
	writeJSONFile(t, registryPath, []map[string]any{
		{
			"scenarioId":  "repo-review-needs-target-clarification",
			"scenarioKey": "repo-review-needs-target-clarification",
			"family":      "fast_regression",
		},
	})
	writeJSONFile(t, coveragePath, []map[string]any{
		{
			"scenarioKey":       "repo-review-needs-target-clarification",
			"recentResultCount": 2,
		},
	})

	_, stderr, exitCode := runCLI(t, root, "scenario", "normalize", "chatbot", "--input", chatbotInputPath, "--output", candidatesPath)
	if exitCode != 0 {
		t.Fatalf("scenario normalize chatbot failed: %s", stderr)
	}
	candidates := readJSONArrayFile(t, candidatesPath)
	if len(candidates) != 2 {
		t.Fatalf("unexpected candidates: %#v", candidates)
	}
	if candidates[0].(map[string]any)["intentProfile"].(map[string]any)["schemaVersion"] != contracts.BehaviorIntentSchema {
		t.Fatalf("unexpected intent profile: %#v", candidates[0])
	}

	_, stderr, exitCode = runCLI(t, root, "scenario", "prepare-input", "--candidates", candidatesPath, "--registry", registryPath, "--coverage", coveragePath, "--family", "fast_regression", "--window-days", "14", "--now", "2026-04-11T00:00:00.000Z", "--output", proposalInputPath)
	if exitCode != 0 {
		t.Fatalf("scenario prepare-input failed: %s", stderr)
	}
	_, stderr, exitCode = runCLI(t, root, "scenario", "propose", "--input", proposalInputPath, "--output", proposalOutputPath)
	if exitCode != 0 {
		t.Fatalf("scenario propose failed: %s", stderr)
	}
	proposals := readJSONObjectFile(t, proposalOutputPath)
	proposalList := proposals["proposals"].([]any)
	if len(proposalList) != 2 {
		t.Fatalf("unexpected proposals: %#v", proposalList)
	}
	firstProposal := proposalList[0].(map[string]any)
	if firstProposal["draftScenario"].(map[string]any)["intentProfile"].(map[string]any)["schemaVersion"] != contracts.BehaviorIntentSchema {
		t.Fatalf("unexpected proposal intent profile: %#v", firstProposal)
	}
	if firstProposal["family"] != "fast_regression" {
		t.Fatalf("unexpected proposal family: %#v", firstProposal)
	}
}

func TestCLIScenarioNormalizeSkillProducesCandidatesThatChainIntoPrepareAndPropose(t *testing.T) {
	root := t.TempDir()
	skillInputPath := filepath.Join(root, "skill-input.json")
	candidatesPath := filepath.Join(root, "skill-candidates.json")
	proposalInputPath := filepath.Join(root, "scenario-proposal-input.json")
	proposalOutputPath := filepath.Join(root, "scenario-proposals.json")
	registryPath := filepath.Join(root, "registry.json")
	coveragePath := filepath.Join(root, "coverage.json")
	writeJSONFile(t, skillInputPath, map[string]any{
		"schemaVersion": contracts.SkillNormalizationInputsSchema,
		"evaluationRuns": []map[string]any{
			{
				"targetKind":  "public_skill",
				"targetId":    "impl",
				"displayName": "impl",
				"surface":     "smoke_scenario",
				"startedAt":   "2026-04-11T00:00:00.000Z",
				"status":      "failed",
				"summary":     "The impl smoke scenario stopped producing a bounded execution plan.",
			},
			{
				"targetKind":   "cli_workflow",
				"targetId":     "scan-settings-seed",
				"displayName":  "Scan Settings Seed",
				"surface":      "replay_seed",
				"startedAt":    "2026-04-11T01:00:00.000Z",
				"status":       "blocked",
				"summary":      "Replay seed stalled on the same settings screen after two retries.",
				"blockerKind":  "repeated_screen_no_progress",
				"blockedSteps": []string{"open_settings", "open_settings"},
			},
		},
	})
	writeJSONFile(t, registryPath, []map[string]any{
		{
			"scenarioId":  "public-skill-impl-smoke-scenario-regression",
			"scenarioKey": "public-skill-impl-smoke-scenario-regression",
			"family":      "fast_regression",
		},
	})
	writeJSONFile(t, coveragePath, []map[string]any{
		{
			"scenarioKey":       "public-skill-impl-smoke-scenario-regression",
			"recentResultCount": 1,
		},
	})

	_, stderr, exitCode := runCLI(t, root, "scenario", "normalize", "skill", "--input", skillInputPath, "--output", candidatesPath)
	if exitCode != 0 {
		t.Fatalf("scenario normalize skill failed: %s", stderr)
	}
	candidates := readJSONArrayFile(t, candidatesPath)
	if len(candidates) != 2 {
		t.Fatalf("unexpected candidates: %#v", candidates)
	}
	firstCandidate := candidates[0].(map[string]any)
	if firstCandidate["intentProfile"].(map[string]any)["schemaVersion"] != contracts.BehaviorIntentSchema || firstCandidate["family"] != "fast_regression" {
		t.Fatalf("unexpected first candidate: %#v", firstCandidate)
	}

	_, stderr, exitCode = runCLI(t, root, "scenario", "prepare-input", "--candidates", candidatesPath, "--registry", registryPath, "--coverage", coveragePath, "--family", "fast_regression", "--window-days", "14", "--now", "2026-04-11T00:00:00.000Z", "--output", proposalInputPath)
	if exitCode != 0 {
		t.Fatalf("scenario prepare-input failed: %s", stderr)
	}
	_, stderr, exitCode = runCLI(t, root, "scenario", "propose", "--input", proposalInputPath, "--output", proposalOutputPath)
	if exitCode != 0 {
		t.Fatalf("scenario propose failed: %s", stderr)
	}
	proposals := readJSONObjectFile(t, proposalOutputPath)
	proposalList := proposals["proposals"].([]any)
	if len(proposalList) != 2 {
		t.Fatalf("unexpected proposals: %#v", proposalList)
	}
	firstProposal := proposalList[0].(map[string]any)
	if firstProposal["draftScenario"].(map[string]any)["intentProfile"].(map[string]any)["schemaVersion"] != contracts.BehaviorIntentSchema || firstProposal["family"] != "fast_regression" {
		t.Fatalf("unexpected first proposal: %#v", firstProposal)
	}
}

func TestCLIScenarioNormalizeCLIProducesCandidatesThatChainIntoPrepareAndPropose(t *testing.T) {
	root := t.TempDir()
	cliInputPath := filepath.Join(root, "cli-input.json")
	candidatesPath := filepath.Join(root, "cli-candidates.json")
	proposalInputPath := filepath.Join(root, "scenario-proposal-input.json")
	proposalOutputPath := filepath.Join(root, "scenario-proposals.json")
	registryPath := filepath.Join(root, "registry.json")
	coveragePath := filepath.Join(root, "coverage.json")
	writeJSONFile(t, cliInputPath, map[string]any{
		"schemaVersion": contracts.CliNormalizationInputsSchema,
		"cliRuns": []map[string]any{
			{
				"surfaceId":    "doctor_missing_adapter",
				"commandId":    "doctor-no-adapter",
				"displayName":  "cautilus doctor",
				"startedAt":    "2026-04-11T00:00:00.000Z",
				"status":       "failed",
				"intent":       "Explain how to add the official adapter when none is present.",
				"summary":      "The command no longer mentioned adapter init or the official adapter path.",
				"failureKinds": []string{"stdout_missing_expected_guidance", "ambiguous_next_step"},
			},
			{
				"surfaceId":    "adapter_init_scaffold",
				"commandId":    "adapter-init-default",
				"displayName":  "cautilus adapter init",
				"startedAt":    "2026-04-11T01:00:00.000Z",
				"status":       "failed",
				"intent":       "Scaffold the official adapter in the default .agents location.",
				"summary":      "The command exited 0 but did not create .agents/cautilus-adapter.yaml.",
				"failureKinds": []string{"missing_side_effect"},
			},
		},
	})
	writeJSONFile(t, registryPath, []map[string]any{
		{
			"scenarioId":  "cli-doctor-missing-adapter-doctor-no-adapter-operator-guidance",
			"scenarioKey": "cli-doctor-missing-adapter-doctor-no-adapter-operator-guidance",
			"family":      "fast_regression",
		},
	})
	writeJSONFile(t, coveragePath, []map[string]any{
		{
			"scenarioKey":       "cli-doctor-missing-adapter-doctor-no-adapter-operator-guidance",
			"recentResultCount": 1,
		},
	})

	_, stderr, exitCode := runCLI(t, root, "scenario", "normalize", "cli", "--input", cliInputPath, "--output", candidatesPath)
	if exitCode != 0 {
		t.Fatalf("scenario normalize cli failed: %s", stderr)
	}
	candidates := readJSONArrayFile(t, candidatesPath)
	if len(candidates) != 2 {
		t.Fatalf("unexpected candidates: %#v", candidates)
	}
	firstCandidate := candidates[0].(map[string]any)
	intentProfile := firstCandidate["intentProfile"].(map[string]any)
	if intentProfile["behaviorSurface"] != cautilusruntime.BehaviorSurfaces["OPERATOR_CLI"] || firstCandidate["family"] != "fast_regression" {
		t.Fatalf("unexpected first candidate: %#v", firstCandidate)
	}

	_, stderr, exitCode = runCLI(t, root, "scenario", "prepare-input", "--candidates", candidatesPath, "--registry", registryPath, "--coverage", coveragePath, "--family", "fast_regression", "--window-days", "14", "--now", "2026-04-11T00:00:00.000Z", "--output", proposalInputPath)
	if exitCode != 0 {
		t.Fatalf("scenario prepare-input failed: %s", stderr)
	}
	_, stderr, exitCode = runCLI(t, root, "scenario", "propose", "--input", proposalInputPath, "--output", proposalOutputPath)
	if exitCode != 0 {
		t.Fatalf("scenario propose failed: %s", stderr)
	}
	proposals := readJSONObjectFile(t, proposalOutputPath)
	proposalList := proposals["proposals"].([]any)
	if len(proposalList) != 2 {
		t.Fatalf("unexpected proposals: %#v", proposalList)
	}
	firstProposal := proposalList[0].(map[string]any)
	draftScenario := firstProposal["draftScenario"].(map[string]any)
	if draftScenario["intentProfile"].(map[string]any)["behaviorSurface"] != cautilusruntime.BehaviorSurfaces["OPERATOR_CLI"] || firstProposal["family"] != "fast_regression" {
		t.Fatalf("unexpected first proposal: %#v", firstProposal)
	}
}

func anyToString(value any) string {
	if text, ok := value.(string); ok {
		return text
	}
	return ""
}

func mustJSONMarshal(t *testing.T, value any) []byte {
	t.Helper()
	payload, err := json.Marshal(value)
	if err != nil {
		t.Fatalf("Marshal returned error: %v", err)
	}
	return payload
}
