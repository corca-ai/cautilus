package app

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
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

// Keep this file focused on multi-command integration flows that mutate repos,
// write artifacts, or exercise adapter-owned execution seams.
// Single-command public contract checks belong in docs/specs and app_test.go.

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
	t.Setenv("CAUTILUS_TOOL_ROOT", repoToolRoot(t))

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

func initGitRepo(t *testing.T, root string) {
	t.Helper()
	runGit(t, root, "init")
	runGit(t, root, "config", "user.email", "test@test.com")
	runGit(t, root, "config", "user.name", "test")
	if err := os.WriteFile(filepath.Join(root, ".gitignore"), []byte(""), 0o644); err != nil {
		t.Fatalf("WriteFile returned error: %v", err)
	}
	runGit(t, root, "add", ".gitignore")
	runGit(t, root, "commit", "-m", "bootstrap")
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

func TestCLIDoctorScopeAgentSurfaceTracksInstalledSkillSurface(t *testing.T) {
	root := t.TempDir()
	stdout, stderr, exitCode := runCLI(t, root, "doctor", "--repo-root", root, "--scope", "agent-surface")
	if exitCode != 1 {
		t.Fatalf("expected exit code 1 before install, got %d, stderr=%s", exitCode, stderr)
	}
	payload := parseJSONObject(t, stdout)
	if payload["status"] != "missing_agent_surface" || payload["ready"] != false {
		t.Fatalf("expected missing_agent_surface payload, got %#v", payload)
	}
	suggestions, ok := payload["suggestions"].([]any)
	if !ok || len(suggestions) == 0 || !strings.Contains(anyToString(suggestions[0]), "cautilus install") {
		t.Fatalf("expected install suggestion, got %#v", payload["suggestions"])
	}

	installStdout, installStderr, installExitCode := runCLI(t, root, "install", "--repo-root", root, "--json")
	if installExitCode != 0 {
		t.Fatalf("install failed: %s%s", installStdout, installStderr)
	}

	stdout, stderr, exitCode = runCLI(t, root, "doctor", "--repo-root", root, "--scope", "agent-surface")
	if exitCode != 0 {
		t.Fatalf("expected exit code 0 after install, got %d, stderr=%s", exitCode, stderr)
	}
	payload = parseJSONObject(t, stdout)
	if payload["status"] != "ready" || payload["ready"] != true {
		t.Fatalf("expected ready payload after install, got %#v", payload)
	}
	if _, ok := payload["next_action"]; ok {
		t.Fatalf("agent-surface ready should not prescribe repo-scope next_action, got %#v", payload["next_action"])
	}
	if _, ok := payload["next_prompt"]; ok {
		t.Fatalf("agent-surface ready should not prescribe repo-scope next_prompt, got %#v", payload["next_prompt"])
	}
}

func TestCLIVersionVerboseIncludesProductSurfaceSummary(t *testing.T) {
	root := repoToolRoot(t)
	stdout, stderr, exitCode := runCLI(t, root, "version", "--verbose")
	if exitCode != 0 {
		t.Fatalf("Run returned exit code %d, stderr=%s", exitCode, stderr)
	}
	payload := parseJSONObject(t, stdout)
	product, ok := payload["product"].(map[string]any)
	if !ok {
		t.Fatalf("expected product summary, got %#v", payload["product"])
	}
	if !strings.Contains(anyToString(product["summary"]), "intentful agent, skill, and workflow evaluation") {
		t.Fatalf("unexpected product summary: %#v", product["summary"])
	}
	reportSurface, ok := product["reportSurface"].([]any)
	if !ok || len(reportSurface) == 0 {
		t.Fatalf("expected reportSurface notes, got %#v", product["reportSurface"])
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
	initGitRepo(t, root)
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
		"eval_test_command_templates:",
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
	nextAction, ok := payload["next_action"].(map[string]any)
	if !ok || anyToString(nextAction["kind"]) != "runner_readiness" {
		t.Fatalf("expected runner readiness next_action, got %#v", payload["next_action"])
	}
	if anyToString(nextAction["branchId"]) != "create_runner_assessment" {
		t.Fatalf("expected create runner assessment branch, got %#v", payload["next_action"])
	}
	if !strings.Contains(anyToString(payload["next_prompt"]), "runner assessment") {
		t.Fatalf("expected next_prompt to mention runner assessment, got %#v", payload["next_prompt"])
	}
	if payload["adapter_path"] != filepath.Join(root, ".agents", "cautilus-adapter.yaml") {
		t.Fatalf("unexpected adapter path: %#v", payload["adapter_path"])
	}
	nextSteps, ok := payload["next_steps"].([]any)
	if !ok || len(nextSteps) == 0 {
		t.Fatalf("expected next_steps hint on ready payload, got %#v", payload["next_steps"])
	}
	if !strings.Contains(anyToString(nextSteps[0]), "scenario-normalization") {
		t.Fatalf("expected next_steps to mention scenario-normalization, got %#v", nextSteps)
	}
	firstBoundedRun, ok := payload["first_bounded_run"].(map[string]any)
	if !ok {
		t.Fatalf("expected first_bounded_run payload, got %#v", payload["first_bounded_run"])
	}
	if anyToString(firstBoundedRun["discoveryCommand"]) != "cautilus scenarios --json" {
		t.Fatalf("unexpected first_bounded_run discovery command: %#v", firstBoundedRun["discoveryCommand"])
	}
	decisionLoopCommands, ok := firstBoundedRun["decisionLoopCommands"].([]any)
	if !ok || len(decisionLoopCommands) != 2 {
		t.Fatalf("expected two decision loop commands, got %#v", firstBoundedRun["decisionLoopCommands"])
	}
	if !strings.Contains(anyToString(decisionLoopCommands[0]), "cautilus eval test --repo-root '"+root+"'") {
		t.Fatalf("expected eval test first bounded run command, got %#v", decisionLoopCommands[0])
	}
	if !strings.Contains(anyToString(decisionLoopCommands[1]), "cautilus eval evaluate --input '"+filepath.Join(root, ".cautilus", "runs", "first-bounded-run", "eval-observed.json")+"'") {
		t.Fatalf("expected eval evaluate packet recheck command, got %#v", decisionLoopCommands[1])
	}
	archetypes, ok := firstBoundedRun["archetypes"].([]any)
	if !ok || len(archetypes) != 3 {
		t.Fatalf("expected three archetype hints, got %#v", firstBoundedRun["archetypes"])
	}
	firstArchetype, ok := archetypes[0].(map[string]any)
	if !ok || anyToString(firstArchetype["exampleInputCli"]) == "" {
		t.Fatalf("expected exampleInputCli in archetype hint, got %#v", archetypes[0])
	}
}

func TestCLIDoctorDoesNotTreatExecutorVariantsAsFirstBoundedRun(t *testing.T) {
	root := t.TempDir()
	initGitRepo(t, root)
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
		"executor_variants:",
		"  - id: standalone",
		"    tool: command",
		"    command_template: sh {candidate_repo}/variant.sh {output_file}",
		"",
	}, "\n")
	if err := os.WriteFile(filepath.Join(adapterDir, "cautilus-adapter.yaml"), []byte(adapter), 0o644); err != nil {
		t.Fatalf("WriteFile returned error: %v", err)
	}

	stdout, stderr, exitCode := runCLI(t, root, "doctor", "--repo-root", root)
	if exitCode != 1 {
		t.Fatalf("expected incomplete adapter exit code, got %d, stdout=%s stderr=%s", exitCode, stdout, stderr)
	}
	payload := parseJSONObject(t, stdout)
	if payload["ready"] != false || payload["status"] != "incomplete_adapter" {
		t.Fatalf("expected incomplete doctor payload, got %#v", payload)
	}
	if _, ok := payload["first_bounded_run"]; ok {
		t.Fatalf("executor-variant-only adapter should not receive first_bounded_run: %#v", payload["first_bounded_run"])
	}
	nextAction, ok := payload["next_action"].(map[string]any)
	if !ok || anyToString(nextAction["kind"]) != "edit_adapter" {
		t.Fatalf("expected edit_adapter next_action, got %#v", payload["next_action"])
	}
	suggestions, ok := payload["suggestions"].([]any)
	foundSuggestion := false
	for _, suggestion := range suggestions {
		if strings.Contains(anyToString(suggestion), "executor_variants can run bounded review") {
			foundSuggestion = true
			break
		}
	}
	if !ok || !foundSuggestion {
		t.Fatalf("expected executor_variants explanation in suggestions, got %#v", payload["suggestions"])
	}
}

func TestCLIScenariosExposeExampleInputCLI(t *testing.T) {
	root := t.TempDir()
	stdout, stderr, exitCode := runCLI(t, root, "scenarios", "--json")
	if exitCode != 0 {
		t.Fatalf("scenarios --json failed: %s", stderr)
	}
	payload := parseJSONObject(t, stdout)
	if payload["schemaVersion"] != cautilusruntime.ScenarioCatalogSchema {
		t.Fatalf("unexpected scenarios schema: %#v", payload["schemaVersion"])
	}
	archetypes, ok := payload["archetypes"].([]any)
	if !ok || len(archetypes) != 3 {
		t.Fatalf("expected three archetypes, got %#v", payload["archetypes"])
	}
	firstArchetype, ok := archetypes[0].(map[string]any)
	if !ok || anyToString(firstArchetype["exampleInputCli"]) == "" {
		t.Fatalf("expected exampleInputCli on first archetype, got %#v", archetypes[0])
	}
}

func TestCLIDoctorFailsWithoutCheckedInAdapter(t *testing.T) {
	root := t.TempDir()
	initGitRepo(t, root)
	stdout, stderr, exitCode := runCLI(t, root, "doctor", "--repo-root", root)
	if exitCode != 1 {
		t.Fatalf("expected exit code 1, got %d, stderr=%s", exitCode, stderr)
	}
	payload := parseJSONObject(t, stdout)
	if payload["ready"] != false || payload["status"] != "missing_adapter" {
		t.Fatalf("expected missing_adapter payload, got %#v", payload)
	}
	nextAction, ok := payload["next_action"].(map[string]any)
	if !ok || anyToString(nextAction["command"]) != "cautilus adapter init --repo-root '"+root+"'" {
		t.Fatalf("expected adapter init next_action command, got %#v", payload["next_action"])
	}
	suggestions, ok := payload["suggestions"].([]any)
	if !ok || len(suggestions) == 0 || !strings.Contains(anyToString(suggestions[0]), "adapter init") {
		t.Fatalf("expected adapter init suggestion, got %#v", payload["suggestions"])
	}
}

func TestCLIDoctorAcknowledgesNamedAdaptersWhenDefaultAdapterIsMissing(t *testing.T) {
	root := t.TempDir()
	initGitRepo(t, root)
	namedAdapterDir := filepath.Join(root, ".agents", "cautilus-adapters")
	if err := os.MkdirAll(namedAdapterDir, 0o755); err != nil {
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
		"  - echo eval-test",
		"",
	}, "\n")
	if err := os.WriteFile(filepath.Join(namedAdapterDir, "data-final-prompt-ab.yaml"), []byte(adapter), 0o644); err != nil {
		t.Fatalf("WriteFile returned error: %v", err)
	}

	stdout, stderr, exitCode := runCLI(t, root, "doctor", "--repo-root", root)
	if exitCode != 1 {
		t.Fatalf("expected exit code 1, got %d, stderr=%s", exitCode, stderr)
	}
	payload := parseJSONObject(t, stdout)
	if payload["ready"] != false || payload["status"] != "missing_default_adapter" {
		t.Fatalf("expected missing_default_adapter payload, got %#v", payload)
	}
	namedAdapters, ok := payload["named_adapters"].([]any)
	if !ok || len(namedAdapters) != 1 {
		t.Fatalf("expected one named adapter hint, got %#v", payload["named_adapters"])
	}
	firstNamedAdapter := namedAdapters[0].(map[string]any)
	if firstNamedAdapter["name"] != "data-final-prompt-ab" {
		t.Fatalf("unexpected named adapter payload: %#v", firstNamedAdapter)
	}
	suggestions, ok := payload["suggestions"].([]any)
	if !ok || len(suggestions) < 3 {
		t.Fatalf("expected named-adapter suggestions, got %#v", payload["suggestions"])
	}
	if !strings.Contains(anyToString(suggestions[1]), "--adapter-name data-final-prompt-ab") {
		t.Fatalf("expected doctor suggestion to mention --adapter-name, got %#v", suggestions)
	}
	nextAction, ok := payload["next_action"].(map[string]any)
	if !ok || !strings.Contains(anyToString(nextAction["command"]), "--adapter-name 'data-final-prompt-ab' --next-action") {
		t.Fatalf("expected next_action to continue through named adapter, got %#v", payload["next_action"])
	}
}

func TestCLIDoctorNextActionPrintsLoopPrompt(t *testing.T) {
	root := t.TempDir()
	initGitRepo(t, root)
	stdout, stderr, exitCode := runCLI(t, root, "doctor", "--repo-root", root, "--next-action")
	if exitCode != 1 {
		t.Fatalf("expected exit code 1, got %d, stderr=%s", exitCode, stderr)
	}
	if !strings.Contains(stdout, "cautilus adapter init --repo-root") {
		t.Fatalf("expected next-action prompt to mention adapter init, got %q", stdout)
	}
	if !strings.Contains(stdout, "continue from the returned next action") {
		t.Fatalf("expected next-action loop hint, got %q", stdout)
	}
}

func TestCLIDoctorFailsWhenAdapterIsInvalid(t *testing.T) {
	root := t.TempDir()
	initGitRepo(t, root)
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

func TestCLIReviewVariantsRunsInsideFreshRepoWithoutHostSpecificPaths(t *testing.T) {
	root := t.TempDir()
	initGitRepo(t, root)
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

	outputDir := filepath.Join(root, "outputs")
	stdout, stderr, exitCode := runCLI(t, root, "review", "variants", "--repo-root", root, "--workspace", root, "--output-dir", outputDir)
	if exitCode != 0 {
		t.Fatalf("review variants failed: %s", stderr)
	}
	summary := readJSONObjectFile(t, strings.TrimSpace(stdout))
	if summary["schemaVersion"] != contracts.ReviewSummarySchema {
		t.Fatalf("unexpected review summary schema: %#v", summary["schemaVersion"])
	}
	if summary["status"] != "passed" {
		t.Fatalf("expected passed review summary, got %#v", summary["status"])
	}
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
	if output["schemaVersion"] != contracts.ReviewVariantResultSchema {
		t.Fatalf("unexpected variant result schema: %#v", output["schemaVersion"])
	}
	if output["summary"] != "standalone smoke" {
		t.Fatalf("expected standalone smoke summary, got %#v", output["summary"])
	}
	if strings.Contains(string(mustJSONMarshal(t, summary)), "/home/ubuntu/") {
		t.Fatalf("unexpected host-local path leak in %#v", summary)
	}
}

func TestCLIReviewVariantsReturnsBlockedSummaryWhenVariantEmitsBlockedPayload(t *testing.T) {
	root := t.TempDir()
	if err := os.MkdirAll(filepath.Join(root, ".agents"), 0o755); err != nil {
		t.Fatalf("MkdirAll returned error: %v", err)
	}
	writeExecutableFile(t, root, "variant.sh", `#!/bin/sh
output_file="$1"
cat > "$output_file" <<'EOF'
{
  "status": "blocked",
  "reasonCode": "insufficient_evidence",
  "reasonCodes": ["insufficient_evidence"],
  "reason": "Review packet omitted the artifact diff.",
  "summary": "The bounded review could not establish a verdict."
}
EOF
`)
	if err := os.MkdirAll(filepath.Join(root, "fixtures"), 0o755); err != nil {
		t.Fatalf("MkdirAll returned error: %v", err)
	}
	if err := os.WriteFile(filepath.Join(root, "fixtures", "review.prompt.md"), []byte("review\n"), 0o644); err != nil {
		t.Fatalf("WriteFile returned error: %v", err)
	}
	schemaBytes, err := os.ReadFile(filepath.Join(repoToolRoot(t), "fixtures", "review", "review-verdict.schema.json"))
	if err != nil {
		t.Fatalf("ReadFile returned error: %v", err)
	}
	if err := os.WriteFile(filepath.Join(root, "fixtures", "review.schema.json"), schemaBytes, 0o644); err != nil {
		t.Fatalf("WriteFile returned error: %v", err)
	}
	adapterText := strings.Join([]string{
		"version: 1",
		"repo: temp",
		"evaluation_surfaces:",
		"  - smoke",
		"baseline_options:",
		"  - baseline git ref via {baseline_ref}",
		"default_prompt_file: fixtures/review.prompt.md",
		"default_schema_file: fixtures/review.schema.json",
		"executor_variants:",
		"  - id: standalone",
		"    tool: command",
		"    purpose: standalone smoke variant",
		"    command_template: sh {candidate_repo}/variant.sh {output_file}",
		"",
	}, "\n")
	if err := os.WriteFile(filepath.Join(root, ".agents", "cautilus-adapter.yaml"), []byte(adapterText), 0o644); err != nil {
		t.Fatalf("WriteFile returned error: %v", err)
	}

	outputDir := filepath.Join(root, "outputs")
	stdout, stderr, exitCode := runCLI(t, root, "review", "variants", "--repo-root", root, "--workspace", root, "--output-dir", outputDir)
	if exitCode != 1 {
		t.Fatalf("expected blocked exit code, got %d, stderr=%s", exitCode, stderr)
	}
	summary := readJSONObjectFile(t, strings.TrimSpace(stdout))
	if summary["status"] != "blocked" {
		t.Fatalf("expected blocked review summary, got %#v", summary["status"])
	}
	reasonCodes, ok := summary["reasonCodes"].([]any)
	if !ok || len(reasonCodes) != 1 || anyToString(reasonCodes[0]) != "insufficient_evidence" {
		t.Fatalf("unexpected review reason codes: %#v", summary["reasonCodes"])
	}
	variant := summary["variants"].([]any)[0].(map[string]any)
	if variant["status"] != "blocked" {
		t.Fatalf("expected blocked variant, got %#v", variant["status"])
	}
	output := variant["output"].(map[string]any)
	if output["status"] != "blocked" {
		t.Fatalf("expected blocked output packet, got %#v", output)
	}
	findings := output["findings"].([]any)
	if len(findings) != 1 || findings[0].(map[string]any)["severity"] != "blocker" {
		t.Fatalf("expected synthesized blocker finding, got %#v", output["findings"])
	}
}

func TestCLIReviewVariantsClassifiesUnavailableExecutorAsBlockedPartialSuccess(t *testing.T) {
	root := t.TempDir()
	if err := os.MkdirAll(filepath.Join(root, ".agents"), 0o755); err != nil {
		t.Fatalf("MkdirAll returned error: %v", err)
	}
	writeExecutableFile(t, root, "pass.sh", `#!/bin/sh
output_file="$1"
cat > "$output_file" <<'EOF'
{
  "status": "completed",
  "verdict": "pass",
  "summary": "Codex review produced useful findings.",
  "findings": []
}
EOF
`)
	writeExecutableFile(t, root, "auth-fail.sh", `#!/bin/sh
echo "Claude API 401 authentication error" >&2
exit 1
`)
	if err := os.MkdirAll(filepath.Join(root, "fixtures"), 0o755); err != nil {
		t.Fatalf("MkdirAll returned error: %v", err)
	}
	if err := os.WriteFile(filepath.Join(root, "fixtures", "review.prompt.md"), []byte("review\n"), 0o644); err != nil {
		t.Fatalf("WriteFile returned error: %v", err)
	}
	if err := os.WriteFile(filepath.Join(root, "fixtures", "review.schema.json"), []byte("{\"type\":\"object\"}\n"), 0o644); err != nil {
		t.Fatalf("WriteFile returned error: %v", err)
	}
	adapterText := strings.Join([]string{
		"version: 1",
		"repo: temp",
		"evaluation_surfaces:",
		"  - smoke",
		"baseline_options:",
		"  - baseline git ref via {baseline_ref}",
		"default_prompt_file: fixtures/review.prompt.md",
		"default_schema_file: fixtures/review.schema.json",
		"executor_variants:",
		"  - id: codex-review",
		"    tool: command",
		"    command_template: sh {candidate_repo}/pass.sh {output_file}",
		"  - id: claude-review",
		"    tool: command",
		"    command_template: sh {candidate_repo}/auth-fail.sh {output_file}",
		"",
	}, "\n")
	if err := os.WriteFile(filepath.Join(root, ".agents", "cautilus-adapter.yaml"), []byte(adapterText), 0o644); err != nil {
		t.Fatalf("WriteFile returned error: %v", err)
	}

	outputDir := filepath.Join(root, "outputs")
	stdout, stderr, exitCode := runCLI(t, root, "review", "variants", "--repo-root", root, "--workspace", root, "--output-dir", outputDir)
	if exitCode != 1 {
		t.Fatalf("expected blocked exit code, got %d, stderr=%s", exitCode, stderr)
	}
	summary := readJSONObjectFile(t, strings.TrimSpace(stdout))
	if summary["status"] != "blocked" {
		t.Fatalf("expected blocked review summary, got %#v", summary["status"])
	}
	if summary["reviewVerdict"] != "pass" {
		t.Fatalf("expected review verdict to come from the passing variant, got %#v", summary["reviewVerdict"])
	}
	if summary["partialSuccess"] != true {
		t.Fatalf("expected partialSuccess to be true, got %#v", summary["partialSuccess"])
	}
	if summary["successfulVariantCount"] != float64(1) {
		t.Fatalf("expected one successful variant, got %#v", summary["successfulVariantCount"])
	}
	successes := summary["successfulVariantOutputs"].([]any)
	if len(successes) != 1 || successes[0].(map[string]any)["id"] != "codex-review" {
		t.Fatalf("unexpected successful variant outputs: %#v", summary["successfulVariantOutputs"])
	}
	reasonCodes := summary["reasonCodes"].([]any)
	if len(reasonCodes) != 1 || anyToString(reasonCodes[0]) != "unavailable_executor" {
		t.Fatalf("unexpected reason codes: %#v", reasonCodes)
	}
	variants := summary["variants"].([]any)
	blocked := variants[1].(map[string]any)
	if blocked["status"] != "blocked" {
		t.Fatalf("expected auth failure to be blocked, got %#v", blocked["status"])
	}
	output := blocked["output"].(map[string]any)
	if output["status"] != "blocked" {
		t.Fatalf("expected blocked output packet, got %#v", output)
	}
}

func TestCLIReviewVariantsSupportsOutputUnderTest(t *testing.T) {
	root := t.TempDir()
	if err := os.MkdirAll(filepath.Join(root, "fixtures"), 0o755); err != nil {
		t.Fatalf("MkdirAll returned error: %v", err)
	}
	if err := os.MkdirAll(filepath.Join(root, "artifacts"), 0o755); err != nil {
		t.Fatalf("MkdirAll returned error: %v", err)
	}
	if err := os.WriteFile(filepath.Join(root, "fixtures", "review.prompt.md"), []byte("unused fallback prompt\n"), 0o644); err != nil {
		t.Fatalf("WriteFile returned error: %v", err)
	}
	if err := os.WriteFile(filepath.Join(root, "fixtures", "review.schema.json"), []byte("{\"type\":\"object\"}\n"), 0o644); err != nil {
		t.Fatalf("WriteFile returned error: %v", err)
	}
	outputUnderTestPath := filepath.Join(root, "artifacts", "analysis-output.json")
	if err := os.WriteFile(outputUnderTestPath, []byte("{\"summary\":\"realized output\"}\n"), 0o644); err != nil {
		t.Fatalf("WriteFile returned error: %v", err)
	}
	writeExecutableFile(t, root, "variant.sh", "#!/bin/sh\noutput_file=\"$1\"\nprompt_file=\"$2\"\nprompt_text=\"$(cat \"$prompt_file\")\"\nnode - \"$output_file\" \"$prompt_text\" <<'EOF'\nconst [outputFile, promptText] = process.argv.slice(2);\nconst { writeFileSync } = await import(\"node:fs\");\nwriteFileSync(outputFile, JSON.stringify({\n  verdict: \"pass\",\n  summary: promptText,\n  findings: [{ severity: \"pass\", message: \"output-under-test\", path: \"variant/sh\" }],\n}) + \"\\n\", \"utf-8\");\nEOF\n")
	reportFile := filepath.Join(root, "report.json")
	writeJSONFile(t, reportFile, map[string]any{
		"schemaVersion": contracts.ReportPacketSchema,
		"generatedAt":   "2026-04-11T00:02:00.000Z",
		"candidate":     "feature/output-under-test",
		"baseline":      "origin/main",
		"intent":        "The output should explain missing adapter setup without operator guesswork.",
		"intentProfile": map[string]any{
			"schemaVersion":   contracts.BehaviorIntentSchema,
			"intentId":        "intent-output-under-test",
			"summary":         "The output should explain missing adapter setup without operator guesswork.",
			"behaviorSurface": cautilusruntime.BehaviorSurfaces["OPERATOR_BEHAVIOR"],
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
			},
		},
		"telemetry":           map[string]any{"modeCount": 1},
		"improved":            []any{},
		"regressed":           []any{},
		"unchanged":           []any{},
		"noisy":               []any{},
		"humanReviewFindings": []any{},
		"recommendation":      "defer",
	})

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
		"    purpose: output-under-test smoke variant",
		"    command_template: sh {candidate_repo}/variant.sh {output_file} {prompt_file}",
		"",
	}, "\n"))...)
	if err := os.WriteFile(adapterPath, adapterText, 0o644); err != nil {
		t.Fatalf("WriteFile returned error: %v", err)
	}

	outputDir := filepath.Join(root, "outputs")
	stdout, stderr, exitCode := runCLI(
		t,
		root,
		"review",
		"variants",
		"--repo-root",
		root,
		"--workspace",
		root,
		"--report-file",
		reportFile,
		"--output-under-test",
		outputUnderTestPath,
		"--output-text-key",
		"summary",
		"--output-dir",
		outputDir,
	)
	if exitCode != 0 {
		t.Fatalf("review variants failed: %s", stderr)
	}
	summary := readJSONObjectFile(t, strings.TrimSpace(stdout))
	outputUnderTest := summary["outputUnderTestFile"].(map[string]any)
	if outputUnderTest["absolutePath"] != outputUnderTestPath {
		t.Fatalf("unexpected output-under-test summary: %#v", outputUnderTest)
	}
	warnings := summary["warnings"].([]any)
	if len(warnings) != 1 || !strings.Contains(anyToString(warnings[0]), "{output_under_test}") {
		t.Fatalf("expected output-under-test warning, got %#v", warnings)
	}
	promptBytes, err := os.ReadFile(anyString(summary["promptFile"]))
	if err != nil {
		t.Fatalf("ReadFile returned error: %v", err)
	}
	prompt := string(promptBytes)
	if !strings.Contains(prompt, "## Output Under Test") || !strings.Contains(prompt, "analysis-output.json") || !strings.Contains(prompt, "## Output Under Test Text") || !strings.Contains(prompt, "realized output") {
		t.Fatalf("unexpected rendered output-under-test prompt: %s", prompt)
	}
}

func TestCLIReviewVariantsCanUseDirectScenarioOutputReview(t *testing.T) {
	root := t.TempDir()
	if err := os.MkdirAll(filepath.Join(root, "artifacts"), 0o755); err != nil {
		t.Fatalf("MkdirAll returned error: %v", err)
	}
	if err := os.WriteFile(filepath.Join(root, "review.schema.json"), []byte("{\"type\":\"object\"}\n"), 0o644); err != nil {
		t.Fatalf("WriteFile returned error: %v", err)
	}
	outputUnderTestPath := filepath.Join(root, "artifacts", "analysis-output.json")
	if err := os.WriteFile(outputUnderTestPath, []byte("{\"analysis_text\":\"The replay failed because the denylist blocked 삭제 and four target-resolution lookups cascaded.\"}\n"), 0o644); err != nil {
		t.Fatalf("WriteFile returned error: %v", err)
	}
	scenarioFile := filepath.Join(root, "scenario.json")
	writeJSONFile(t, scenarioFile, map[string]any{
		"schemaVersion": contracts.DraftScenarioSchema,
		"scenarioId":    "replay-negative-path",
		"name":          "Replay Negative Path",
		"description":   "Judge whether the replay analysis explains the realized failure path clearly.",
		"brief":         "The realized output should stay legible on a negative replay path.",
		"intentProfile": map[string]any{
			"schemaVersion":   contracts.BehaviorIntentSchema,
			"intentId":        "intent-replay-negative-path-output-review",
			"summary":         "Judge whether the replay analysis explains the realized failure path clearly.",
			"behaviorSurface": cautilusruntime.BehaviorSurfaces["REVIEW_VARIANT_WORKFLOW"],
			"successDimensions": []map[string]any{
				{
					"id":      cautilusruntime.BehaviorDimensions["REVIEW_EVIDENCE_LEGIBILITY"],
					"summary": "Keep review evidence and verdict framing legible to a human reviewer.",
				},
			},
			"guardrailDimensions": []any{},
		},
		"simulatorTurns": []string{"Replay the failure", "Explain whether the analysis output really matches the scenario."},
	})
	writeExecutableFile(t, root, "variant.sh", "#!/bin/sh\noutput_file=\"$1\"\nprompt_file=\"$2\"\nprompt_text=\"$(cat \"$prompt_file\")\"\nnode - \"$output_file\" \"$prompt_text\" <<'EOF'\nconst [outputFile, promptText] = process.argv.slice(2);\nconst { writeFileSync } = await import(\"node:fs\");\nwriteFileSync(outputFile, JSON.stringify({\n  verdict: \"pass\",\n  summary: promptText,\n  findings: [{ severity: \"pass\", message: \"scenario-output-review\", path: \"variant/sh\" }],\n}) + \"\\n\", \"utf-8\");\nEOF\n")

	if _, stderr, exitCode := runCLI(t, root, "adapter", "init", "--repo-root", root); exitCode != 0 {
		t.Fatalf("adapter init failed: %s", stderr)
	}
	adapterPath := filepath.Join(root, ".agents", "cautilus-adapter.yaml")
	adapterText, err := os.ReadFile(adapterPath)
	if err != nil {
		t.Fatalf("ReadFile returned error: %v", err)
	}
	adapterText = append(adapterText, []byte(strings.Join([]string{
		"default_schema_file: review.schema.json",
		"executor_variants:",
		"  - id: standalone",
		"    tool: command",
		"    purpose: direct scenario output review",
		"    command_template: sh {candidate_repo}/variant.sh {output_file} {prompt_file}",
		"",
	}, "\n"))...)
	if err := os.WriteFile(adapterPath, adapterText, 0o644); err != nil {
		t.Fatalf("WriteFile returned error: %v", err)
	}

	outputDir := filepath.Join(root, "scenario-review-outputs")
	stdout, stderr, exitCode := runCLI(
		t,
		root,
		"review",
		"variants",
		"--repo-root",
		root,
		"--workspace",
		root,
		"--scenario-file",
		scenarioFile,
		"--output-under-test",
		outputUnderTestPath,
		"--output-text-key",
		"analysis_text",
		"--output-dir",
		outputDir,
	)
	if exitCode != 0 {
		t.Fatalf("review variants failed: %s", stderr)
	}
	summary := readJSONObjectFile(t, strings.TrimSpace(stdout))
	promptInput := readJSONObjectFile(t, anyString(summary["reviewPromptInputFile"]))
	scenarioContext := promptInput["scenarioContext"].(map[string]any)
	if scenarioContext["scenarioId"] != "replay-negative-path" {
		t.Fatalf("unexpected scenario context: %#v", scenarioContext)
	}
	outputUnderTestText := promptInput["outputUnderTestText"].(map[string]any)
	if outputUnderTestText["key"] != "analysis_text" || !strings.Contains(anyToString(outputUnderTestText["text"]), "denylist blocked 삭제") {
		t.Fatalf("unexpected output-under-test text: %#v", outputUnderTestText)
	}
	promptBytes, err := os.ReadFile(anyString(summary["promptFile"]))
	if err != nil {
		t.Fatalf("ReadFile returned error: %v", err)
	}
	prompt := string(promptBytes)
	if !strings.Contains(prompt, "## Scenario Context") || !strings.Contains(prompt, "replay-negative-path") || !strings.Contains(prompt, "## Output Under Test Text") || !strings.Contains(prompt, "denylist blocked 삭제") {
		t.Fatalf("unexpected rendered scenario review prompt: %s", prompt)
	}
}

func TestCLIInstallCreatesRepoLocalCanonicalSkill(t *testing.T) {
	root := t.TempDir()

	stdout, stderr, exitCode := runCLI(t, root, "install", "--repo-root", ".")
	if exitCode != 0 {
		t.Fatalf("install failed: %s", stderr)
	}
	if !strings.Contains(stdout, ".agents/skills/cautilus") {
		t.Fatalf("expected install output, got %q", stdout)
	}

	skillPath := filepath.Join(root, ".agents", "skills", "cautilus", "SKILL.md")
	referencesPath := filepath.Join(root, ".agents", "skills", "cautilus", "references", "evaluation-process.md")
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
	if !strings.Contains(string(skill), "cautilus install --repo-root .") {
		t.Fatalf("expected install guidance in skill")
	}
	if !strings.Contains(string(skill), "cautilus doctor --repo-root .") {
		t.Fatalf("expected doctor guidance in skill")
	}
	if strings.Contains(string(skill), "node ./bin/cautilus") {
		t.Fatalf("unexpected repo-local node invocation in installed skill")
	}
	bootstrapInventoryPath := filepath.Join(root, ".agents", "skills", "cautilus", "references", "bootstrap-inventory.md")
	bootstrapInventory, err := os.ReadFile(bootstrapInventoryPath)
	if err != nil {
		t.Fatalf("expected bootstrap-inventory reference: %v", err)
	}
	if !strings.Contains(string(bootstrapInventory), "Inventory the LLM-behavior surfaces first") {
		t.Fatalf("expected LLM-behavior inventory guidance in bootstrap-inventory reference")
	}
	if !strings.Contains(string(bootstrapInventory), "Do not wrap `pytest`, lint, type, or spec checks under `Cautilus`") {
		t.Fatalf("expected deterministic-gate warning in bootstrap-inventory reference")
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

	_, stderr, exitCode = runCLI(t, root, "install", "--repo-root", ".")
	if exitCode != 1 || !strings.Contains(stderr, "already exists") {
		t.Fatalf("expected already exists failure, got exit=%d stderr=%q", exitCode, stderr)
	}
}

func TestCLIDoctorWarnsWhenAdapterOnlyWrapsDeterministicGates(t *testing.T) {
	root := t.TempDir()
	initGitRepo(t, root)
	if err := os.MkdirAll(filepath.Join(root, ".agents"), 0o755); err != nil {
		t.Fatalf("MkdirAll returned error: %v", err)
	}
	adapter := strings.Join([]string{
		"version: 1",
		"repo: temp",
		"evaluation_surfaces:",
		"  - cli smoke",
		"baseline_options:",
		"  - baseline git ref via {baseline_ref}",
		"eval_test_command_templates:",
		"  - uv run python -m pytest tests/test_cli.py -q",
		"  - ruff check .",
		"",
	}, "\n")
	if err := os.WriteFile(filepath.Join(root, ".agents", "cautilus-adapter.yaml"), []byte(adapter), 0o644); err != nil {
		t.Fatalf("WriteFile returned error: %v", err)
	}

	stdout, stderr, exitCode := runCLI(t, root, "doctor", "--repo-root", root)
	if exitCode != 0 {
		t.Fatalf("doctor failed: %s", stderr)
	}
	payload := parseJSONObject(t, stdout)
	warnings, ok := payload["warnings"].([]any)
	if !ok || len(warnings) == 0 {
		t.Fatalf("expected doctor warnings, got %#v", payload["warnings"])
	}
	if !strings.Contains(anyToString(warnings[0]), "deterministic gates only") {
		t.Fatalf("unexpected warning payload: %#v", warnings)
	}
	suggestions, ok := payload["suggestions"].([]any)
	if !ok || len(suggestions) == 0 {
		t.Fatalf("expected doctor suggestions, got %#v", payload["suggestions"])
	}
	joined := mustJSONMarshal(t, suggestions)
	if !strings.Contains(string(joined), "Inventory LLM-behavior surfaces first") {
		t.Fatalf("expected LLM-behavior suggestion, got %#v", suggestions)
	}
}

func TestCLIInstallCreatesRepoLocalCanonicalSkillAndReportsCurrentCLI(t *testing.T) {
	root := t.TempDir()
	t.Setenv("CAUTILUS_VERSION", "v1.2.3")

	stdout, stderr, exitCode := runCLI(t, root, "install", "--repo-root", ".", "--json")
	if exitCode != 0 {
		t.Fatalf("install failed: %s", stderr)
	}
	summary := parseJSONObject(t, stdout)
	if summary["status"] != "installed" {
		t.Fatalf("expected installed status, got %#v", summary["status"])
	}
	current := summary["current"].(map[string]any)
	if current["version"] != "1.2.3" {
		t.Fatalf("expected version 1.2.3, got %#v", current["version"])
	}
	skill := summary["skill"].(map[string]any)
	if skill["destinationDir"] != filepath.Join(root, ".agents", "skills", "cautilus") {
		t.Fatalf("unexpected destinationDir: %#v", skill["destinationDir"])
	}
	nextSteps, ok := summary["nextSteps"].([]any)
	if !ok || len(nextSteps) < 2 {
		t.Fatalf("expected install nextSteps, got %#v", summary["nextSteps"])
	}
	if anyToString(nextSteps[0]) != "cautilus doctor --repo-root "+root+" --next-action" {
		t.Fatalf("unexpected first next step: %#v", nextSteps[0])
	}
	if _, err := os.Stat(filepath.Join(root, ".agents", "skills", "cautilus", "SKILL.md")); err != nil {
		t.Fatalf("expected installed skill: %v", err)
	}
}

func TestCLIInstallMigratesLegacyClaudeSkills(t *testing.T) {
	root := t.TempDir()
	legacyDir := filepath.Join(root, ".claude", "skills", "legacy")
	if err := os.MkdirAll(legacyDir, 0o755); err != nil {
		t.Fatalf("MkdirAll returned error: %v", err)
	}
	if err := os.WriteFile(filepath.Join(legacyDir, "SKILL.md"), []byte("legacy\n"), 0o644); err != nil {
		t.Fatalf("WriteFile returned error: %v", err)
	}

	_, stderr, exitCode := runCLI(t, root, "install", "--repo-root", ".", "--overwrite")
	if exitCode != 0 {
		t.Fatalf("install --overwrite failed: %s", stderr)
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

func TestCLIUpdateRefreshesStandaloneInstallAndRepoSkill(t *testing.T) {
	root := t.TempDir()
	installRoot := filepath.Join(root, "managed install")
	binDir := filepath.Join(root, "custom bin")
	t.Setenv("CAUTILUS_VERSION", "v1.2.3")
	t.Setenv("CAUTILUS_INSTALL_ROOT", installRoot)
	t.Setenv("CAUTILUS_BIN_DIR", binDir)

	previousLatest := latestReleaseMetadataForLifecycle
	previousInstall := installManagedReleaseForLifecycle
	t.Cleanup(func() {
		latestReleaseMetadataForLifecycle = previousLatest
		installManagedReleaseForLifecycle = previousInstall
	})

	latestReleaseMetadataForLifecycle = func(ctx context.Context) (cli.ReleaseMetadata, error) {
		return cli.ReleaseMetadata{
			Version:    "1.2.4",
			ReleaseURL: "https://example.invalid/releases/v1.2.4",
		}, nil
	}
	installManagedReleaseForLifecycle = func(options cli.ReleaseInstallOptions) (cli.ReleaseInstallResult, error) {
		if options.Version != "v1.2.4" {
			t.Fatalf("expected install version v1.2.4, got %q", options.Version)
		}
		if options.InstallRoot != installRoot {
			t.Fatalf("expected update to preserve install root %q, got %q", installRoot, options.InstallRoot)
		}
		if options.BinDir != binDir {
			t.Fatalf("expected update to preserve bin dir %q, got %q", binDir, options.BinDir)
		}
		return cli.ReleaseInstallResult{
			Version:     "1.2.4",
			WrapperPath: filepath.Join(binDir, "cautilus"),
		}, nil
	}

	stdout, stderr, exitCode := runCLI(t, root, "update", "--repo-root", ".", "--json")
	if exitCode != 0 {
		t.Fatalf("update failed: %s", stderr)
	}
	summary := parseJSONObject(t, stdout)
	if summary["status"] != "updated" {
		t.Fatalf("expected updated status, got %#v", summary["status"])
	}
	if summary["updated"] != true {
		t.Fatalf("expected updated=true, got %#v", summary["updated"])
	}
	installResult := summary["installResult"].(map[string]any)
	if installResult["wrapperPath"] != filepath.Join(binDir, "cautilus") {
		t.Fatalf("unexpected wrapperPath: %#v", installResult["wrapperPath"])
	}
	if _, err := os.Stat(filepath.Join(root, ".agents", "skills", "cautilus", "SKILL.md")); err != nil {
		t.Fatalf("expected refreshed skill: %v", err)
	}
}

func TestManagedUpdateInstallOptionsInfersCurrentManagedInstall(t *testing.T) {
	root := t.TempDir()
	executablePath := filepath.Join(root, "share", "cautilus", "1.2.3", "bin", "cautilus-real")
	options := managedUpdateInstallOptions(cli.VersionInfo{
		Version:        "1.2.3",
		InstallKind:    cli.InstallKindInstallScript,
		ExecutablePath: executablePath,
	}, "v1.2.4")
	if options.InstallRoot != filepath.Join(root, "share", "cautilus") {
		t.Fatalf("expected install root inferred from executable, got %#v", options.InstallRoot)
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
	proposalTelemetry := payload["proposalTelemetry"].(map[string]any)
	if proposalTelemetry["mergedCandidateCount"] != float64(1) || proposalTelemetry["returnedProposalCount"] != float64(1) {
		t.Fatalf("unexpected proposal telemetry: %#v", proposalTelemetry)
	}
	attentionView := payload["attentionView"].(map[string]any)
	if attentionView["selectedCount"] != float64(1) || attentionView["fallbackUsed"] != false {
		t.Fatalf("unexpected attention view: %#v", attentionView)
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

func TestCLIScenarioProposePreservesFullRankedOutputAndDerivesAttentionView(t *testing.T) {
	root := t.TempDir()
	inputPath := filepath.Join(root, "scenario-proposal-input.json")
	outputPath := filepath.Join(root, "scenario-proposals.json")
	proposalCandidates := make([]map[string]any, 0, 6)
	for index := 0; index < 6; index++ {
		proposalCandidates = append(proposalCandidates, map[string]any{
			"proposalKey": fmt.Sprintf("fast-regression-%d", index+1),
			"title":       fmt.Sprintf("Refresh fast regression %d", index+1),
			"family":      "fast_regression",
			"name":        fmt.Sprintf("Fast Regression %d", index+1),
			"description": "Recent activity suggests a refresh candidate.",
			"brief":       "Recent activity suggests a refresh candidate.",
			"evidence": []map[string]any{
				{
					"sourceKind": "human_conversation",
					"title":      fmt.Sprintf("candidate-%d", index+1),
					"observedAt": fmt.Sprintf("2026-04-%02dT00:00:00.000Z", 10+index),
				},
			},
		})
	}
	writeJSONFile(t, inputPath, map[string]any{
		"schemaVersion":            contracts.ScenarioProposalInputsSchema,
		"windowDays":               14,
		"families":                 []any{"fast_regression"},
		"proposalCandidates":       proposalCandidates,
		"existingScenarioRegistry": []any{},
		"scenarioCoverage":         []any{},
		"now":                      "2026-04-19T00:00:00.000Z",
	})

	_, stderr, exitCode := runCLI(t, root, "scenario", "propose", "--input", inputPath, "--output", outputPath)
	if exitCode != 0 {
		t.Fatalf("scenario propose failed: %s", stderr)
	}
	payload := readJSONObjectFile(t, outputPath)
	proposalTelemetry := payload["proposalTelemetry"].(map[string]any)
	if proposalTelemetry["mergedCandidateCount"] != float64(6) || proposalTelemetry["returnedProposalCount"] != float64(6) {
		t.Fatalf("unexpected proposal telemetry counts: %#v", proposalTelemetry)
	}
	attentionView := payload["attentionView"].(map[string]any)
	if attentionView["selectedCount"] != float64(5) || attentionView["truncated"] != true || attentionView["fallbackUsed"] != false {
		t.Fatalf("unexpected attention view telemetry: %#v", attentionView)
	}
	proposals := payload["proposals"].([]any)
	if len(proposals) != 6 {
		t.Fatalf("expected full ranked proposal list, got %#v", proposals)
	}
}

func TestCLIScenarioReviewConversationsBuildsScenarioCentricThreadPacket(t *testing.T) {
	root := t.TempDir()
	inputPath := filepath.Join(root, "conversation-review-input.json")
	outputPath := filepath.Join(root, "conversation-review.json")
	writeJSONFile(t, inputPath, map[string]any{
		"schemaVersion": contracts.ScenarioConversationReviewInputsSchema,
		"windowDays":    14,
		"families":      []any{"fast_regression"},
		"conversationSummaries": []any{
			map[string]any{
				"threadKey":      "thread-1",
				"lastObservedAt": "2026-04-09T21:00:00.000Z",
				"records": []any{
					map[string]any{"actorKind": "user", "text": "retro 먼저 해주세요"},
					map[string]any{"actorKind": "assistant", "text": "retro를 먼저 정리하겠습니다."},
					map[string]any{"actorKind": "user", "text": "이제 review로 돌아가죠"},
				},
			},
			map[string]any{
				"threadKey":      "thread-2",
				"lastObservedAt": "2026-04-10T08:00:00.000Z",
				"records": []any{
					map[string]any{"actorKind": "user", "text": "배포 전에 체크리스트를 다시 보여주세요"},
				},
			},
		},
		"proposalCandidates": []any{
			map[string]any{
				"proposalKey":    "review-after-retro",
				"title":          "Refresh review-after-retro scenario from recent activity",
				"family":         "fast_regression",
				"name":           "Review After Retro",
				"description":    "The user pivots from retro back to review in one thread.",
				"brief":          "Recent activity shows a retro turn followed by a review turn.",
				"simulatorTurns": []any{"retro 먼저 해주세요", "이제 review로 돌아가죠"},
				"evidence": []any{
					map[string]any{
						"sourceKind": "human_conversation",
						"title":      "review after retro",
						"threadKey":  "thread-1",
						"observedAt": "2026-04-09T21:00:00.000Z",
						"messages":   []any{"retro 먼저 해주세요", "이제 review로 돌아가죠"},
					},
				},
			},
		},
		"existingScenarioRegistry": []any{
			map[string]any{"scenarioKey": "review-after-retro", "family": "fast_regression"},
		},
		"scenarioCoverage": []any{
			map[string]any{"scenarioKey": "review-after-retro", "recentResultCount": 2},
		},
		"now": "2026-04-11T00:00:00.000Z",
	})

	_, stderr, exitCode := runCLI(t, root, "scenario", "review-conversations", "--input", inputPath, "--output", outputPath)
	if exitCode != 0 {
		t.Fatalf("scenario review-conversations failed: %s", stderr)
	}
	payload := readJSONObjectFile(t, outputPath)
	if payload["schemaVersion"] != contracts.ScenarioConversationReviewSchema {
		t.Fatalf("expected scenario conversation review schema, got %#v", payload["schemaVersion"])
	}
	summary := payload["summary"].(map[string]any)
	if summary["threadCount"] != float64(2) || summary["linkedThreadCount"] != float64(1) || summary["unlinkedThreadCount"] != float64(1) {
		t.Fatalf("unexpected conversation review summary: %#v", summary)
	}
	attentionView := payload["attentionView"].(map[string]any)
	if attentionView["selectedCount"] != float64(1) || attentionView["fallbackUsed"] != false {
		t.Fatalf("unexpected attention view: %#v", attentionView)
	}
	threads := payload["threads"].([]any)
	first := threads[0].(map[string]any)
	if first["threadKey"] != "thread-1" || first["recommendation"] != "review_existing_scenario_refresh" {
		t.Fatalf("unexpected first thread: %#v", first)
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

func TestCLISelfDogfoodRenderExperimentsHTMLWritesIndexFromLatestBundle(t *testing.T) {
	root := t.TempDir()
	latestDir := filepath.Join(root, "artifacts", "self-dogfood", "experiments", "latest")
	if err := os.MkdirAll(latestDir, 0o755); err != nil {
		t.Fatalf("MkdirAll returned error: %v", err)
	}
	writeJSONFile(t, filepath.Join(latestDir, "summary.json"), map[string]any{
		"generatedAt":          "2026-04-11T02:00:00.000Z",
		"runId":                "exp-2026-04-11T02-00-00",
		"baselineRef":          "origin/main",
		"artifactRoot":         "artifacts/self-dogfood/experiments",
		"intent":               "Experiments should compare <b>baseline</b> and variants honestly.",
		"overallStatus":        "concern",
		"reportRecommendation": "defer",
		"gateRecommendation":   "accept-now",
		"modeTelemetry":        map[string]any{"durationMs": 2400},
		"experiments": []any{
			map[string]any{
				"adapterName":     "exp-a",
				"overallStatus":   "pass",
				"executionStatus": "passed",
				"findingsCount":   0,
				"telemetry":       map[string]any{"durationMs": 1800},
				"primarySummary":  "exp-a is better than exp-b & easier to trust.",
				"variants":        []any{map[string]any{"id": "codex-review", "executionStatus": "passed", "verdict": "pass", "summary": "exp-a is better than exp-b & easier to trust.", "findingsCount": 0}},
			},
		},
	})
	writeJSONFile(t, filepath.Join(latestDir, "report.json"), map[string]any{
		"schemaVersion":       contracts.ReportPacketSchema,
		"intent":              "Experiments should compare <b>baseline</b> and variants honestly.",
		"commandObservations": []any{},
	})

	stdout, stderr, exitCode := runCLI(t, root, "self-dogfood", "render-experiments-html")
	if exitCode != 0 {
		t.Fatalf("render-experiments-html failed: %s", stderr)
	}
	outputPath := strings.TrimSpace(stdout)
	if outputPath != filepath.Join(latestDir, "index.html") {
		t.Fatalf("unexpected output path: %s", outputPath)
	}
	htmlBytes, err := os.ReadFile(outputPath)
	if err != nil {
		t.Fatalf("ReadFile returned error: %v", err)
	}
	html := string(htmlBytes)
	if !strings.Contains(html, "Cautilus Self-Dogfood Experiments") {
		t.Fatalf("expected experiments title in html")
	}
	if !strings.Contains(html, `data-compare-row="exp-a"`) {
		t.Fatalf("expected experiment comparison row in html")
	}
}

func TestCLIReviewPrepareInputFallsBackToSoleNamedAdapterWhenReportLacksAdapterContext(t *testing.T) {
	root := t.TempDir()
	initGitRepo(t, root)
	namedAdapterDir := filepath.Join(root, ".agents", "cautilus-adapters")
	if err := os.MkdirAll(namedAdapterDir, 0o755); err != nil {
		t.Fatalf("MkdirAll returned error: %v", err)
	}
	if err := os.MkdirAll(filepath.Join(root, "prompts"), 0o755); err != nil {
		t.Fatalf("MkdirAll returned error: %v", err)
	}
	if err := os.MkdirAll(filepath.Join(root, "fixtures"), 0o755); err != nil {
		t.Fatalf("MkdirAll returned error: %v", err)
	}
	adapter := strings.Join([]string{
		"version: 1",
		"repo: temp",
		"evaluation_surfaces:",
		"  - operator workflow",
		"baseline_options:",
		"  - baseline git ref via {baseline_ref}",
		"eval_test_command_templates:",
		"  - echo eval-test",
		"default_prompt_file: prompts/review.md",
		"default_schema_file: fixtures/review.schema.json",
		"",
	}, "\n")
	if err := os.WriteFile(filepath.Join(namedAdapterDir, "data-final-prompt-ab.yaml"), []byte(adapter), 0o644); err != nil {
		t.Fatalf("WriteFile returned error: %v", err)
	}
	if err := os.WriteFile(filepath.Join(root, "prompts", "review.md"), []byte("review prompt\n"), 0o644); err != nil {
		t.Fatalf("WriteFile returned error: %v", err)
	}
	if err := os.WriteFile(filepath.Join(root, "fixtures", "review.schema.json"), []byte("{\"type\":\"object\"}\n"), 0o644); err != nil {
		t.Fatalf("WriteFile returned error: %v", err)
	}
	reportPath := filepath.Join(root, "report.json")
	writeJSONFile(t, reportPath, map[string]any{
		"schemaVersion": contracts.ReportPacketSchema,
		"generatedAt":   "2026-04-18T06:00:00Z",
		"candidate":     "feature/operator-guidance",
		"baseline":      "origin/main",
		"intent":        "The workflow should explain the next safe recovery step without guesswork.",
		"intentProfile": map[string]any{
			"schemaVersion":   contracts.BehaviorIntentSchema,
			"intentId":        "intent-recovery-guidance",
			"summary":         "The workflow should explain the next safe recovery step without guesswork.",
			"behaviorSurface": cautilusruntime.BehaviorSurfaces["OPERATOR_BEHAVIOR"],
			"successDimensions": []map[string]any{
				{
					"id":      cautilusruntime.BehaviorDimensions["FAILURE_CAUSE_CLARITY"],
					"summary": "Explain the concrete failure cause or missing prerequisite.",
				},
			},
			"guardrailDimensions": []any{},
		},
		"commands": []any{
			map[string]any{
				"mode":    "held_out",
				"command": "echo held-out",
			},
		},
		"commandObservations": []any{},
		"modeSummaries": []any{
			map[string]any{
				"mode":   "held_out",
				"status": "passed",
			},
		},
		"humanReviewFindings": []any{},
		"recommendation":      "defer",
	})
	reviewPacketPath := filepath.Join(root, "review-packet.json")
	if _, stderr, exitCode := runCLI(t, root, "review", "prepare-input", "--repo-root", root, "--report-file", reportPath, "--output", reviewPacketPath); exitCode != 0 {
		t.Fatalf("review prepare-input failed without adapter context: %s", stderr)
	}
	reviewPacket := readJSONObjectFile(t, reviewPacketPath)
	if !strings.HasSuffix(anyToString(reviewPacket["adapterPath"]), filepath.Join(".agents", "cautilus-adapters", "data-final-prompt-ab.yaml")) {
		t.Fatalf("unexpected adapter path: %#v", reviewPacket["adapterPath"])
	}
}

func TestCLIOptimizeSearchPrepareInputFallsBackToSoleNamedAdapterWhenReportLacksAdapterContext(t *testing.T) {
	root := t.TempDir()
	initGitRepo(t, root)
	namedAdapterDir := filepath.Join(root, ".agents", "cautilus-adapters")
	if err := os.MkdirAll(namedAdapterDir, 0o755); err != nil {
		t.Fatalf("MkdirAll returned error: %v", err)
	}
	adapter := strings.Join([]string{
		"version: 1",
		"repo: temp",
		"evaluation_surfaces:",
		"  - operator workflow",
		"baseline_options:",
		"  - baseline git ref via {baseline_ref}",
		"eval_test_command_templates:",
		"  - echo eval-test",
		"",
	}, "\n")
	if err := os.WriteFile(filepath.Join(namedAdapterDir, "data-final-prompt-ab.yaml"), []byte(adapter), 0o644); err != nil {
		t.Fatalf("WriteFile returned error: %v", err)
	}
	targetFile := filepath.Join(root, "prompt.md")
	if err := os.WriteFile(targetFile, []byte("Keep recovery guidance explicit.\n"), 0o644); err != nil {
		t.Fatalf("WriteFile returned error: %v", err)
	}
	reportPath := filepath.Join(root, "report.json")
	writeJSONFile(t, reportPath, map[string]any{
		"schemaVersion": contracts.ReportPacketSchema,
		"generatedAt":   "2026-04-18T06:00:00Z",
		"candidate":     "feature/operator-guidance",
		"baseline":      "origin/main",
		"intent":        "The workflow should explain the next safe recovery step without guesswork.",
		"intentProfile": map[string]any{
			"schemaVersion":   contracts.BehaviorIntentSchema,
			"intentId":        "intent-recovery-guidance",
			"summary":         "The workflow should explain the next safe recovery step without guesswork.",
			"behaviorSurface": cautilusruntime.BehaviorSurfaces["OPERATOR_BEHAVIOR"],
			"successDimensions": []map[string]any{
				{
					"id":      cautilusruntime.BehaviorDimensions["FAILURE_CAUSE_CLARITY"],
					"summary": "Explain the concrete failure cause or missing prerequisite.",
				},
			},
			"guardrailDimensions": []any{},
		},
		"commands": []any{
			map[string]any{
				"mode":    "held_out",
				"command": "echo held-out",
			},
		},
		"commandObservations": []any{},
		"modeSummaries": []any{
			map[string]any{
				"mode":   "held_out",
				"status": "passed",
			},
		},
		"humanReviewFindings": []any{},
		"recommendation":      "defer",
	})
	optimizeInputPath := filepath.Join(root, "optimize-input.json")
	if _, stderr, exitCode := runCLI(t, root, "optimize", "prepare-input", "--report-file", reportPath, "--repo-root", root, "--target", "prompt", "--target-file", targetFile, "--output", optimizeInputPath); exitCode != 0 {
		t.Fatalf("optimize prepare-input failed: %s", stderr)
	}
	heldOutResultsPath := filepath.Join(root, "held-out-results.json")
	writeJSONFile(t, heldOutResultsPath, map[string]any{
		"schemaVersion": contracts.ScenarioResultsSchema,
		"mode":          "held_out",
		"results": []map[string]any{
			{
				"scenarioId":   "operator-guidance-smoke",
				"status":       "passed",
				"overallScore": 100,
			},
		},
	})
	searchInputPath := filepath.Join(root, "optimize-search-input.json")
	if _, stderr, exitCode := runCLI(t, root, "optimize", "search", "prepare-input", "--optimize-input", optimizeInputPath, "--held-out-results-file", heldOutResultsPath, "--target-file", targetFile, "--output", searchInputPath); exitCode != 0 {
		t.Fatalf("optimize search prepare-input failed: %s", stderr)
	}
	searchInput := readJSONObjectFile(t, searchInputPath)
	evaluationContext := searchInput["evaluationContext"].(map[string]any)
	if evaluationContext["adapterName"] != "data-final-prompt-ab" {
		t.Fatalf("unexpected evaluation context: %#v", evaluationContext)
	}
}

func TestCLIOptimizeSearchPrepareInputAppliesAdapterSearchDefaults(t *testing.T) {
	root := t.TempDir()
	initGitRepo(t, root)
	adapterDir := filepath.Join(root, ".agents")
	if err := os.MkdirAll(adapterDir, 0o755); err != nil {
		t.Fatalf("MkdirAll returned error: %v", err)
	}
	adapter := strings.Join([]string{
		"version: 1",
		"repo: temp",
		"evaluation_surfaces:",
		"  - operator workflow",
		"baseline_options:",
		"  - baseline git ref via {baseline_ref}",
		"eval_test_command_templates:",
		"  - echo eval-test",
		"optimize_search:",
		"  default_budget: heavy",
		"  budgets:",
		"    heavy:",
		"      generation_limit: 4",
		"      population_limit: 9",
		"      mutation_batch_size: 6",
		"      review_checkpoint_policy: frontier_promotions",
		"      merge_enabled: true",
		"      three_parent_policy: disabled",
		"  selection_policy:",
		"    constraint_caps:",
		"      maxCostUsd: 0.08",
		"",
	}, "\n")
	if err := os.WriteFile(filepath.Join(adapterDir, "cautilus-adapter.yaml"), []byte(adapter), 0o644); err != nil {
		t.Fatalf("WriteFile returned error: %v", err)
	}
	targetFile := filepath.Join(root, "prompt.md")
	if err := os.WriteFile(targetFile, []byte("Keep recovery guidance explicit.\n"), 0o644); err != nil {
		t.Fatalf("WriteFile returned error: %v", err)
	}
	reportPath := filepath.Join(root, "report.json")
	writeJSONFile(t, reportPath, map[string]any{
		"schemaVersion": contracts.ReportPacketSchema,
		"generatedAt":   "2026-04-18T06:00:00Z",
		"candidate":     "feature/operator-guidance",
		"baseline":      "origin/main",
		"intent":        "The workflow should explain the next safe recovery step without guesswork.",
		"intentProfile": map[string]any{
			"schemaVersion":   contracts.BehaviorIntentSchema,
			"intentId":        "intent-recovery-guidance",
			"summary":         "The workflow should explain the next safe recovery step without guesswork.",
			"behaviorSurface": cautilusruntime.BehaviorSurfaces["OPERATOR_BEHAVIOR"],
			"successDimensions": []map[string]any{
				{
					"id":      cautilusruntime.BehaviorDimensions["FAILURE_CAUSE_CLARITY"],
					"summary": "Explain the concrete failure cause or missing prerequisite.",
				},
			},
			"guardrailDimensions": []any{},
		},
		"commands": []any{
			map[string]any{
				"mode":    "held_out",
				"command": "echo held-out",
			},
		},
		"commandObservations": []any{},
		"modeSummaries": []any{
			map[string]any{
				"mode":   "held_out",
				"status": "passed",
			},
		},
		"humanReviewFindings": []any{},
		"recommendation":      "defer",
	})
	optimizeInputPath := filepath.Join(root, "optimize-input.json")
	if _, stderr, exitCode := runCLI(t, root, "optimize", "prepare-input", "--report-file", reportPath, "--repo-root", root, "--target", "prompt", "--target-file", targetFile, "--output", optimizeInputPath); exitCode != 0 {
		t.Fatalf("optimize prepare-input failed: %s", stderr)
	}
	heldOutResultsPath := filepath.Join(root, "held-out-results.json")
	writeJSONFile(t, heldOutResultsPath, map[string]any{
		"schemaVersion": contracts.ScenarioResultsSchema,
		"mode":          "held_out",
		"results": []map[string]any{
			{
				"scenarioId":   "operator-guidance-smoke",
				"status":       "passed",
				"overallScore": 100,
			},
		},
	})
	searchInputPath := filepath.Join(root, "optimize-search-input.json")
	if _, stderr, exitCode := runCLI(t, root, "optimize", "search", "prepare-input", "--optimize-input", optimizeInputPath, "--held-out-results-file", heldOutResultsPath, "--target-file", targetFile, "--output", searchInputPath); exitCode != 0 {
		t.Fatalf("optimize search prepare-input failed: %s", stderr)
	}
	searchInput := readJSONObjectFile(t, searchInputPath)
	searchConfig := searchInput["searchConfig"].(map[string]any)
	if searchConfig["budget"] != "heavy" || searchConfig["generationLimit"] != float64(4) || searchConfig["populationLimit"] != float64(9) || searchConfig["mutationBatchSize"] != float64(6) {
		t.Fatalf("unexpected search config: %#v", searchConfig)
	}
	if searchConfig["mergeEnabled"] != true || searchConfig["threeParentPolicy"] != "disabled" {
		t.Fatalf("unexpected merge config: %#v", searchConfig)
	}
	selectionPolicy := searchConfig["selectionPolicy"].(map[string]any)
	constraintCaps := selectionPolicy["constraintCaps"].(map[string]any)
	if constraintCaps["maxCostUsd"] != 0.08 {
		t.Fatalf("unexpected selection caps: %#v", constraintCaps)
	}
	searchConfigSources := searchInput["searchConfigSources"].(map[string]any)
	if searchConfigSources["budget"] != "adapter_default" || searchConfigSources["preset"] != "adapter_preset" || searchConfigSources["mergeEnabled"] != "adapter_preset" {
		t.Fatalf("unexpected search config sources: %#v", searchConfigSources)
	}
}

func TestCLIReviewBuildPromptInputAndRenderPromptCloseMetaPromptSeam(t *testing.T) {
	root := t.TempDir()
	reviewPacketPath := filepath.Join(root, "review-packet.json")
	promptPath := filepath.Join(root, "artifacts", "prompts", "review.prompt.md")
	promptInputPath := filepath.Join(root, "review-prompt-input.json")
	outputUnderTestPath := filepath.Join(root, "artifacts", "analysis-output.json")
	if err := os.MkdirAll(filepath.Join(root, "fixtures"), 0o755); err != nil {
		t.Fatalf("MkdirAll returned error: %v", err)
	}
	if err := os.MkdirAll(filepath.Join(root, "artifacts"), 0o755); err != nil {
		t.Fatalf("MkdirAll returned error: %v", err)
	}
	if err := os.WriteFile(filepath.Join(root, "fixtures", "consumer.prompt.md"), []byte("Prefer operator-visible evidence.\n"), 0o644); err != nil {
		t.Fatalf("WriteFile returned error: %v", err)
	}
	if err := os.WriteFile(outputUnderTestPath, []byte("{\"summary\":\"realized output\"}\n"), 0o644); err != nil {
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
			"candidate":     "feature/operator-guidance",
			"baseline":      "origin/main",
			"intent":        "The workflow should explain missing adapter setup without operator guesswork.",
			"intentProfile": map[string]any{
				"schemaVersion":   contracts.BehaviorIntentSchema,
				"intentId":        "intent-missing-adapter-guidance",
				"summary":         "The workflow should explain missing adapter setup without operator guesswork.",
				"behaviorSurface": cautilusruntime.BehaviorSurfaces["OPERATOR_BEHAVIOR"],
				"successDimensions": []map[string]any{
					{
						"id":      cautilusruntime.BehaviorDimensions["FAILURE_CAUSE_CLARITY"],
						"summary": "Explain the concrete failure cause or missing prerequisite.",
					},
				},
				"guardrailDimensions": []any{},
			},
			"commands": []any{},
			"commandObservations": []any{
				map[string]any{
					"stage":      "full_gate",
					"command":    "npm run verify",
					"status":     "passed",
					"exitCode":   0,
					"durationMs": 1234,
				},
			},
			"modesRun": []string{"held_out"},
			"modeSummaries": []map[string]any{
				{
					"mode":    "held_out",
					"status":  "passed",
					"summary": "held_out completed across 1 command.",
					"compareArtifact": map[string]any{
						"schemaVersion": contracts.CompareArtifactSchema,
						"summary":       "Held-out operator guidance improved.",
						"verdict":       "improved",
						"improved":      []string{"operator-guidance-smoke"},
					},
				},
			},
			"telemetry":           map[string]any{"modeCount": 1},
			"improved":            []string{"operator-guidance-smoke"},
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

	_, stderr, exitCode := runCLI(t, root, "review", "build-prompt-input", "--review-packet", reviewPacketPath, "--output-under-test", outputUnderTestPath, "--output-text-key", "summary", "--output", promptInputPath)
	if exitCode != 0 {
		t.Fatalf("review build-prompt-input failed: %s", stderr)
	}
	promptInput := readJSONObjectFile(t, promptInputPath)
	if promptInput["schemaVersion"] != contracts.ReviewPromptInputsSchema {
		t.Fatalf("unexpected prompt input schema: %#v", promptInput["schemaVersion"])
	}
	currentReportEvidence := promptInput["currentReportEvidence"].(map[string]any)
	if currentReportEvidence["reportFile"] != filepath.Join(root, "report.json") {
		t.Fatalf("unexpected current report evidence: %#v", currentReportEvidence)
	}
	if promptInput["reviewMode"] != "output_under_test" {
		t.Fatalf("expected output_under_test review mode, got %#v", promptInput["reviewMode"])
	}
	outputUnderTest := promptInput["outputUnderTestFile"].(map[string]any)
	if outputUnderTest["absolutePath"] != outputUnderTestPath {
		t.Fatalf("unexpected output-under-test file: %#v", outputUnderTest)
	}
	outputUnderTestText := promptInput["outputUnderTestText"].(map[string]any)
	if outputUnderTestText["key"] != "summary" || outputUnderTestText["text"] != "realized output" {
		t.Fatalf("unexpected output-under-test text: %#v", outputUnderTestText)
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
	if !strings.Contains(prompt, "Held-out operator guidance improved.") || !strings.Contains(prompt, "## Intent Profile") || !strings.Contains(prompt, "Prefer operator-visible evidence.") || !strings.Contains(prompt, "## Current Report Evidence") || !strings.Contains(prompt, "npm run verify") || !strings.Contains(prompt, "## Output Under Test") || !strings.Contains(prompt, "analysis-output.json") || !strings.Contains(prompt, "## Output Under Test Text") || !strings.Contains(prompt, "realized output") {
		t.Fatalf("unexpected rendered prompt: %s", prompt)
	}
}

func TestCLIReviewVariantsUsesDefaultSchemaFromReviewPromptInput(t *testing.T) {
	root := t.TempDir()
	reviewPacketPath := filepath.Join(root, "review-packet.json")
	promptInputPath := filepath.Join(root, "review-prompt-input.json")
	reportPath := filepath.Join(root, "report.json")
	outputDir := filepath.Join(root, "review-outputs")
	schemaPath := filepath.Join(root, "fixtures", "review.schema.json")
	if err := os.MkdirAll(filepath.Join(root, ".agents"), 0o755); err != nil {
		t.Fatalf("MkdirAll returned error: %v", err)
	}
	if err := os.MkdirAll(filepath.Join(root, "fixtures"), 0o755); err != nil {
		t.Fatalf("MkdirAll returned error: %v", err)
	}
	schemaBytes, err := os.ReadFile(filepath.Join(repoToolRoot(t), "fixtures", "review", "review-verdict.schema.json"))
	if err != nil {
		t.Fatalf("ReadFile returned error: %v", err)
	}
	if err := os.WriteFile(schemaPath, schemaBytes, 0o644); err != nil {
		t.Fatalf("WriteFile returned error: %v", err)
	}
	writeExecutableFile(t, root, "variant.sh", "#!/bin/sh\noutput_file=\"$1\"\nprompt_file=\"$2\"\nschema_file=\"$3\"\nnode - \"$output_file\" \"$schema_file\" <<'EOF'\nconst [outputFile, schemaFile] = process.argv.slice(2);\nconst { writeFileSync } = await import(\"node:fs\");\nwriteFileSync(outputFile, JSON.stringify({\n  verdict: \"pass\",\n  summary: \"prompt-input-schema-fallback\",\n  findings: [{ severity: \"pass\", message: schemaFile, path: \"variant/sh\" }],\n}) + \"\\n\", \"utf-8\");\nEOF\n")
	if err := os.WriteFile(filepath.Join(root, ".agents", "cautilus-adapter.yaml"), []byte(strings.Join([]string{
		"version: 1",
		"repo: temp",
		"evaluation_surfaces:",
		"  - smoke",
		"baseline_options:",
		"  - baseline git ref via {baseline_ref}",
		"executor_variants:",
		"  - id: standalone",
		"    tool: command",
		"    purpose: prompt-input schema fallback",
		"    command_template: sh {candidate_repo}/variant.sh {output_file} {prompt_file} {schema_file}",
		"",
	}, "\n")), 0o644); err != nil {
		t.Fatalf("WriteFile returned error: %v", err)
	}
	writeJSONFile(t, reportPath, map[string]any{
		"schemaVersion": contracts.ReportPacketSchema,
		"generatedAt":   "2026-04-11T00:02:00.000Z",
		"candidate":     "feature/operator-guidance",
		"baseline":      "origin/main",
		"intent":        "The operator should understand a failed workflow step without operator guesswork.",
		"intentProfile": map[string]any{
			"schemaVersion":   contracts.BehaviorIntentSchema,
			"intentId":        "intent-operator-workflow-recovery",
			"summary":         "The operator should understand a failed workflow step without operator guesswork.",
			"behaviorSurface": cautilusruntime.BehaviorSurfaces["OPERATOR_BEHAVIOR"],
			"successDimensions": []any{
				map[string]any{"id": cautilusruntime.BehaviorDimensions["FAILURE_CAUSE_CLARITY"], "summary": "Explain the concrete failure cause or missing prerequisite."},
			},
			"guardrailDimensions": []any{},
		},
		"commands":            []any{},
		"commandObservations": []any{},
		"modesRun":            []string{"held_out"},
		"modeSummaries":       []map[string]any{{"mode": "held_out", "status": "passed", "summary": "held_out completed across 1 command."}},
		"telemetry":           map[string]any{"modeCount": 1},
		"improved":            []any{},
		"regressed":           []any{},
		"unchanged":           []any{},
		"noisy":               []any{},
		"humanReviewFindings": []any{},
		"recommendation":      "defer",
	})
	writeJSONFile(t, reviewPacketPath, map[string]any{
		"schemaVersion": contracts.ReviewPacketSchema,
		"repoRoot":      root,
		"adapterPath":   filepath.Join(root, ".agents", "cautilus-adapter.yaml"),
		"reportFile":    reportPath,
		"report":        readJSONObjectFile(t, reportPath),
		"defaultSchemaFile": map[string]any{
			"relativePath": "fixtures/review.schema.json",
			"absolutePath": schemaPath,
			"exists":       true,
		},
		"artifactFiles":       []any{},
		"reportArtifacts":     []any{},
		"comparisonQuestions": []any{},
		"humanReviewPrompts":  []any{},
	})

	if _, stderr, exitCode := runCLI(t, root, "review", "build-prompt-input", "--review-packet", reviewPacketPath, "--output", promptInputPath); exitCode != 0 {
		t.Fatalf("review build-prompt-input failed: %s", stderr)
	}
	stdout, stderr, exitCode := runCLI(t, root, "review", "variants", "--repo-root", root, "--workspace", root, "--review-prompt-input", promptInputPath, "--output-dir", outputDir)
	if exitCode != 0 {
		t.Fatalf("review variants failed: %s", stderr)
	}
	summary := readJSONObjectFile(t, strings.TrimSpace(stdout))
	if anyString(summary["schemaFile"]) != schemaPath {
		t.Fatalf("unexpected schema file: %#v", summary["schemaFile"])
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
		"candidate":     "feature/operator-guidance",
		"baseline":      "origin/main",
		"intent":        "Operator recovery guidance should stay legible.",
		"intentProfile": map[string]any{
			"schemaVersion":   contracts.BehaviorIntentSchema,
			"intentId":        "intent-operator-workflow-recovery",
			"summary":         "Operator recovery guidance should stay legible.",
			"behaviorSurface": cautilusruntime.BehaviorSurfaces["OPERATOR_BEHAVIOR"],
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
	if intentProfile["intentId"] != "intent-operator-workflow-recovery" {
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
	if proposal["intentProfile"].(map[string]any)["intentId"] != "intent-operator-workflow-recovery" {
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
	if reportContext["candidate"] != "feature/operator-guidance" {
		t.Fatalf("unexpected report context: %#v", reportContext)
	}
	if revisionArtifact["intentProfile"].(map[string]any)["intentId"] != "intent-operator-workflow-recovery" {
		t.Fatalf("unexpected revision artifact intent profile: %#v", revisionArtifact["intentProfile"])
	}
	targetSnapshot := revisionArtifact["targetSnapshot"].(map[string]any)
	if len(anyToString(targetSnapshot["sha256"])) != 64 {
		t.Fatalf("unexpected target snapshot hash: %#v", targetSnapshot)
	}
}

func TestCLIOptimizeProposePrioritizesResidualReportHotspotsBeforeImprovedFallback(t *testing.T) {
	root := t.TempDir()
	reportPath := filepath.Join(root, "report.json")
	targetPath := filepath.Join(root, "prompt.md")
	inputPath := filepath.Join(root, "optimize-input.json")
	proposalPath := filepath.Join(root, "optimize-proposal.json")
	if err := os.WriteFile(targetPath, []byte("Keep operator escalation wording explicit.\n"), 0o644); err != nil {
		t.Fatalf("WriteFile returned error: %v", err)
	}

	writeJSONFile(t, reportPath, map[string]any{
		"schemaVersion": contracts.ReportPacketSchema,
		"generatedAt":   "2026-04-19T00:02:00.000Z",
		"candidate":     "feature/operator-hotspots",
		"baseline":      "origin/main",
		"intent":        "Operator escalation guidance should stay explicit.",
		"intentProfile": map[string]any{
			"schemaVersion":   contracts.BehaviorIntentSchema,
			"intentId":        "intent-operator-escalation-hotspots",
			"summary":         "Operator escalation guidance should stay explicit.",
			"behaviorSurface": cautilusruntime.BehaviorSurfaces["OPERATOR_BEHAVIOR"],
		},
		"commands":            []any{},
		"commandObservations": []any{},
		"modesRun":            []string{"held_out"},
		"modeSummaries":       []any{},
		"modeRuns": []any{
			map[string]any{
				"mode": "held_out",
				"scenarioResults": map[string]any{
					"schemaVersion": contracts.ScenarioResultsSchema,
					"generatedAt":   "2026-04-19T00:01:00.000Z",
					"mode":          "held_out",
					"results": []any{
						map[string]any{
							"scenarioId": "operator-escalation-smoke",
							"status":     "passed",
						},
					},
					"compareArtifact": map[string]any{
						"schemaVersion": contracts.CompareArtifactSchema,
						"generatedAt":   "2026-04-19T00:01:00.000Z",
						"verdict":       "improved",
						"summary":       "The escalation wording improved overall.",
						"improved":      []any{"operator-escalation-smoke"},
						"reasons": []any{
							"operator-escalation-smoke: improved retry wording clarity 0.72->0.85.",
							"operator-escalation-smoke: remaining gaps: escalation wording still has 2 FP and 1 FN.",
						},
					},
				},
			},
		},
		"telemetry": []any{},
		"improved":  []any{"operator-escalation-smoke"},
		"regressed": []any{},
		"unchanged": []any{},
		"noisy":     []any{},
		"humanReviewFindings": []any{
			map[string]any{
				"severity": "concern",
				"message":  "Residual escalation wording still over-triggers on benign retries.",
				"path":     "prompt.md",
			},
		},
		"recommendation": "defer",
	})

	_, stderr, exitCode := runCLI(t, root, "optimize", "prepare-input", "--repo-root", root, "--report-file", reportPath, "--target", "prompt", "--target-file", targetPath, "--output", inputPath)
	if exitCode != 0 {
		t.Fatalf("optimize prepare-input failed: %s", stderr)
	}
	_, stderr, exitCode = runCLI(t, root, "optimize", "propose", "--input", inputPath, "--output", proposalPath)
	if exitCode != 0 {
		t.Fatalf("optimize propose failed: %s", stderr)
	}
	proposal := readJSONObjectFile(t, proposalPath)
	prioritizedEvidence := proposal["prioritizedEvidence"].([]any)
	if len(prioritizedEvidence) < 2 {
		t.Fatalf("expected residual evidence entries, got %#v", proposal)
	}
	firstEvidence := prioritizedEvidence[0].(map[string]any)
	secondEvidence := prioritizedEvidence[1].(map[string]any)
	if firstEvidence["source"] != "report.review_finding" {
		t.Fatalf("expected report review finding first, got %#v", prioritizedEvidence)
	}
	if secondEvidence["source"] != "report.compare_reason" {
		t.Fatalf("expected residual compare reason second, got %#v", prioritizedEvidence)
	}
	if strings.Contains(anyToString(firstEvidence["summary"]), "Improved scenario") {
		t.Fatalf("expected residual hotspot summary, got %#v", firstEvidence)
	}
	trialTelemetry := proposal["trialTelemetry"].(map[string]any)
	sourceCounts := trialTelemetry["sourceCounts"].(map[string]any)
	if sourceCounts["reportReviewFinding"] != float64(1) || sourceCounts["compareReasons"] != float64(1) || sourceCounts["improved"] != float64(0) {
		t.Fatalf("unexpected proposal telemetry source counts: %#v", trialTelemetry)
	}
}

func TestCLIOptimizeSearchPrepareRunAndProposeFromSearch(t *testing.T) {
	root := t.TempDir()
	reportPath := filepath.Join(root, "report.json")
	reviewSummaryPath := filepath.Join(root, "review-summary.json")
	historyPath := filepath.Join(root, "scenario-history.snapshot.json")
	targetPath := filepath.Join(root, "review.prompt.md")
	optimizeInputPath := filepath.Join(root, "optimize-input.json")
	heldOutResultsPath := filepath.Join(root, "held-out-results.json")
	searchInputPath := filepath.Join(root, "optimize-search-input.json")
	searchResultPath := filepath.Join(root, "optimize-search-result.json")
	proposalPath := filepath.Join(root, "optimize-proposal.json")
	if err := os.WriteFile(targetPath, []byte("Keep recovery instructions explicit.\n"), 0o644); err != nil {
		t.Fatalf("WriteFile returned error: %v", err)
	}
	writeJSONFile(t, reportPath, map[string]any{
		"schemaVersion": contracts.ReportPacketSchema,
		"generatedAt":   "2026-04-13T00:02:00.000Z",
		"candidate":     "feature/operator-guidance",
		"baseline":      "origin/main",
		"intent":        "Operator recovery guidance should stay legible.",
		"intentProfile": map[string]any{
			"schemaVersion":   contracts.BehaviorIntentSchema,
			"intentId":        "intent-operator-workflow-recovery",
			"summary":         "Operator recovery guidance should stay legible.",
			"behaviorSurface": cautilusruntime.BehaviorSurfaces["OPERATOR_BEHAVIOR"],
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
		"humanReviewFindings": []map[string]any{{"severity": "concern", "message": "Recovery next step is still terse."}},
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
							"message":  "Retry safety remains unclear.",
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
				"recentTrainResults": []map[string]any{
					{
						"status":       "failed",
						"overallScore": 80,
						"passRate":     0,
					},
				},
			},
		},
		"recentRuns": []any{},
	})
	writeJSONFile(t, heldOutResultsPath, map[string]any{
		"schemaVersion": contracts.ScenarioResultsSchema,
		"mode":          "held_out",
		"results": []map[string]any{
			{
				"scenarioId":   "operator-recovery",
				"status":       "passed",
				"overallScore": 95,
				"telemetry": map[string]any{
					"cost_usd":   0.02,
					"durationMs": 1200,
				},
			},
		},
	})

	_, stderr, exitCode := runCLI(t, root, "optimize", "prepare-input", "--repo-root", root, "--report-file", reportPath, "--review-summary", reviewSummaryPath, "--history-file", historyPath, "--target", "prompt", "--target-file", targetPath, "--output", optimizeInputPath)
	if exitCode != 0 {
		t.Fatalf("optimize prepare-input failed: %s", stderr)
	}
	_, stderr, exitCode = runCLI(t, root, "optimize", "search", "prepare-input", "--optimize-input", optimizeInputPath, "--held-out-results-file", heldOutResultsPath, "--target-file", targetPath, "--output", searchInputPath)
	if exitCode != 0 {
		t.Fatalf("optimize search prepare-input failed: %s", stderr)
	}
	searchInput := readJSONObjectFile(t, searchInputPath)
	if searchInput["schemaVersion"] != contracts.OptimizeSearchInputsSchema {
		t.Fatalf("unexpected search input schema: %#v", searchInput["schemaVersion"])
	}
	if len(searchInput["scenarioSets"].(map[string]any)["heldOutScenarioSet"].([]any)) != 1 {
		t.Fatalf("unexpected held-out scenario set: %#v", searchInput["scenarioSets"])
	}

	stdout, stderr, exitCode := runCLI(t, root, "optimize", "search", "run", "--input", searchInputPath, "--output", searchResultPath)
	if exitCode != 0 {
		resultPayload := ""
		if payload, err := os.ReadFile(searchResultPath); err == nil {
			resultPayload = string(payload)
		}
		t.Fatalf("optimize search run failed: stdout=%s stderr=%s result=%s", stdout, stderr, resultPayload)
	}
	searchResult := readJSONObjectFile(t, searchResultPath)
	if searchResult["schemaVersion"] != contracts.OptimizeSearchResultSchema || searchResult["status"] != "completed" {
		t.Fatalf("unexpected search result: %#v", searchResult)
	}
	if searchResult["selectedCandidateId"] != "seed" {
		t.Fatalf("unexpected selected candidate: %#v", searchResult["selectedCandidateId"])
	}
	searchConfigSources := searchResult["searchConfigSources"].(map[string]any)
	if searchConfigSources["budget"] != "product_default" || searchConfigSources["preset"] != "product_default" {
		t.Fatalf("unexpected search config sources: %#v", searchConfigSources)
	}
	experimentContext := searchResult["experimentContext"].(map[string]any)
	if experimentContext["baselineRef"] != "origin/main" || experimentContext["intent"] != "Operator recovery guidance should stay legible." {
		t.Fatalf("unexpected experiment context: %#v", experimentContext)
	}
	if experimentContext["searchBudget"] != "medium" {
		t.Fatalf("unexpected search budget in experiment context: %#v", experimentContext)
	}
	mutationBackends := experimentContext["mutationBackends"].([]any)
	if len(mutationBackends) != 2 {
		t.Fatalf("unexpected mutation backends: %#v", mutationBackends)
	}
	telemetryCompleteness := searchResult["telemetryCompleteness"].(map[string]any)
	if telemetryCompleteness["heldOutCostUsd"] != "complete" || telemetryCompleteness["candidateAggregateCostUsd"] != "complete" {
		t.Fatalf("unexpected telemetry completeness: %#v", telemetryCompleteness)
	}
	if telemetryCompleteness["heldOutTotalTokens"] != "absent" {
		t.Fatalf("unexpected token completeness: %#v", telemetryCompleteness)
	}

	_, stderr, exitCode = runCLI(t, root, "optimize", "propose", "--from-search", searchResultPath, "--output", proposalPath)
	if exitCode != 0 {
		t.Fatalf("optimize propose --from-search failed: %s", stderr)
	}
	proposal := readJSONObjectFile(t, proposalPath)
	if proposal["schemaVersion"] != contracts.OptimizeProposalSchema {
		t.Fatalf("unexpected proposal schema: %#v", proposal["schemaVersion"])
	}
	if proposal["searchResultFile"] != searchResultPath {
		t.Fatalf("unexpected searchResultFile: %#v", proposal["searchResultFile"])
	}
	if proposal["targetFile"].(map[string]any)["path"] != targetPath {
		t.Fatalf("unexpected target file: %#v", proposal["targetFile"])
	}
}

func TestCLIOptimizeSearchRunReportsWhyNoCandidatesWereGenerated(t *testing.T) {
	root := t.TempDir()
	reportPath := filepath.Join(root, "report.json")
	targetPath := filepath.Join(root, "review.prompt.md")
	optimizeInputPath := filepath.Join(root, "optimize-input.json")
	heldOutResultsPath := filepath.Join(root, "held-out-results.json")
	searchInputPath := filepath.Join(root, "optimize-search-input.json")
	searchResultPath := filepath.Join(root, "optimize-search-result.json")
	if err := os.WriteFile(targetPath, []byte("Keep escalation handling explicit.\n"), 0o644); err != nil {
		t.Fatalf("WriteFile returned error: %v", err)
	}
	writeJSONFile(t, reportPath, map[string]any{
		"schemaVersion": contracts.ReportPacketSchema,
		"generatedAt":   "2026-04-19T00:10:00.000Z",
		"candidate":     "feature/operator-escalation",
		"baseline":      "origin/main",
		"intent":        "Operator escalation guidance should stay explicit.",
		"intentProfile": map[string]any{
			"schemaVersion":   contracts.BehaviorIntentSchema,
			"intentId":        "intent-operator-escalation",
			"summary":         "Operator escalation guidance should stay explicit.",
			"behaviorSurface": cautilusruntime.BehaviorSurfaces["OPERATOR_BEHAVIOR"],
		},
		"commands":            []any{},
		"commandObservations": []any{},
		"modesRun":            []string{"held_out"},
		"modeSummaries":       []any{},
		"telemetry":           map[string]any{},
		"improved":            []any{},
		"regressed":           []any{"operator-escalation-smoke"},
		"unchanged":           []any{},
		"noisy":               []any{},
		"humanReviewFindings": []any{
			map[string]any{"severity": "concern", "message": "Residual escalation wording still over-triggers."},
		},
		"recommendation": "defer",
	})
	writeJSONFile(t, heldOutResultsPath, map[string]any{
		"schemaVersion": contracts.ScenarioResultsSchema,
		"generatedAt":   "2026-04-19T00:11:00.000Z",
		"mode":          "held_out",
		"results": []any{
			map[string]any{
				"scenarioId": "operator-escalation-smoke",
				"status":     "failed",
				"telemetry": map[string]any{
					"durationMs": 1200,
					"cost_usd":   0.02,
				},
			},
		},
		"compareArtifact": map[string]any{
			"schemaVersion": contracts.CompareArtifactSchema,
			"generatedAt":   "2026-04-19T00:11:00.000Z",
			"verdict":       "regressed",
			"summary":       "Escalation wording still regresses on held-out recovery prompts.",
			"reasons": []any{
				"operator-escalation-smoke: remaining gaps: escalation wording still has 2 FP.",
			},
		},
	})

	runGit(t, root, "init")
	runGit(t, root, "config", "user.email", "test@example.com")
	runGit(t, root, "config", "user.name", "Cautilus Test")
	runGit(t, root, "add", ".")
	runGit(t, root, "commit", "-m", "initial")
	writeExecutableFile(t, root, "codex", "#!/bin/sh\nexit 23\n")
	t.Setenv("PATH", root+string(os.PathListSeparator)+os.Getenv("PATH"))

	_, stderr, exitCode := runCLI(t, root, "optimize", "prepare-input", "--repo-root", root, "--report-file", reportPath, "--target", "prompt", "--target-file", targetPath, "--output", optimizeInputPath)
	if exitCode != 0 {
		t.Fatalf("optimize prepare-input failed: %s", stderr)
	}
	_, stderr, exitCode = runCLI(t, root, "optimize", "search", "prepare-input", "--optimize-input", optimizeInputPath, "--held-out-results-file", heldOutResultsPath, "--budget", "light", "--output", searchInputPath)
	if exitCode != 0 {
		t.Fatalf("optimize search prepare-input failed: %s", stderr)
	}
	_, stderr, exitCode = runCLI(t, root, "optimize", "search", "run", "--input", searchInputPath, "--output", searchResultPath)
	if exitCode != 0 {
		t.Fatalf("optimize search run failed: %s", stderr)
	}
	searchResult := readJSONObjectFile(t, searchResultPath)
	if searchResult["selectedCandidateId"] != "seed" {
		t.Fatalf("expected seed-only fallback, got %#v", searchResult["selectedCandidateId"])
	}
	searchTelemetry := searchResult["searchTelemetry"].(map[string]any)
	if searchTelemetry["stopReason"] != "mutation_backend_failed" || searchTelemetry["generatedCandidateCount"] != float64(0) {
		t.Fatalf("unexpected search telemetry: %#v", searchTelemetry)
	}
	candidateGenerationDiagnostics := searchResult["candidateGenerationDiagnostics"].(map[string]any)
	if candidateGenerationDiagnostics["stopReason"] != "mutation_backend_failed" || candidateGenerationDiagnostics["attemptCount"] != float64(1) {
		t.Fatalf("unexpected candidate generation diagnostics: %#v", candidateGenerationDiagnostics)
	}
	attempts := candidateGenerationDiagnostics["attempts"].([]any)
	firstAttempt := attempts[0].(map[string]any)
	if firstAttempt["status"] != "mutation_backend_failed" || firstAttempt["backendInvoked"] != true {
		t.Fatalf("expected backend invocation failure diagnostics, got %#v", firstAttempt)
	}
	prerequisites := firstAttempt["prerequisites"].(map[string]any)
	if prerequisites["intentPresent"] != true || prerequisites["baselineRefPresent"] != true || prerequisites["mutationBackendConfigured"] != true {
		t.Fatalf("unexpected mutation prerequisites: %#v", prerequisites)
	}
	whyNoCandidates := candidateGenerationDiagnostics["whyNoCandidates"].([]any)
	if len(whyNoCandidates) != 1 || whyNoCandidates[0].(map[string]any)["status"] != "mutation_backend_failed" {
		t.Fatalf("unexpected why-no-candidates diagnostics: %#v", candidateGenerationDiagnostics)
	}
}

func TestCLIOptimizeSearchUsesHeldOutCompareArtifactReasonsAsFeedback(t *testing.T) {
	root := t.TempDir()
	reportPath := filepath.Join(root, "report.json")
	targetPath := filepath.Join(root, "review.prompt.md")
	optimizeInputPath := filepath.Join(root, "optimize-input.json")
	heldOutResultsPath := filepath.Join(root, "held-out-results.json")
	searchInputPath := filepath.Join(root, "optimize-search-input.json")
	if err := os.WriteFile(targetPath, []byte("Keep recovery instructions explicit.\n"), 0o644); err != nil {
		t.Fatalf("WriteFile returned error: %v", err)
	}
	writeJSONFile(t, reportPath, map[string]any{
		"schemaVersion": contracts.ReportPacketSchema,
		"generatedAt":   "2026-04-13T00:02:00.000Z",
		"candidate":     "feature/operator-guidance",
		"baseline":      "origin/main",
		"intent":        "Operator recovery guidance should stay legible.",
		"intentProfile": map[string]any{
			"schemaVersion":   contracts.BehaviorIntentSchema,
			"intentId":        "intent-operator-workflow-recovery",
			"summary":         "Operator recovery guidance should stay legible.",
			"behaviorSurface": cautilusruntime.BehaviorSurfaces["OPERATOR_BEHAVIOR"],
		},
		"commands":            []any{},
		"commandObservations": []any{},
		"modesRun":            []any{},
		"modeSummaries":       []any{},
		"telemetry":           map[string]any{},
		"improved":            []any{},
		"regressed":           []string{"operator-recovery"},
		"unchanged":           []any{},
		"noisy":               []any{},
		"humanReviewFindings": []any{},
		"recommendation":      "defer",
	})
	if _, stderr, exitCode := runCLI(t, root, "optimize", "prepare-input", "--repo-root", root, "--report-file", reportPath, "--target", "prompt", "--target-file", targetPath, "--output", optimizeInputPath); exitCode != 0 {
		t.Fatalf("optimize prepare-input failed: %s", stderr)
	}
	writeJSONFile(t, heldOutResultsPath, map[string]any{
		"schemaVersion": contracts.ScenarioResultsSchema,
		"mode":          "held_out",
		"results": []map[string]any{
			{
				"scenarioId":   "operator-recovery",
				"status":       "failed",
				"overallScore": 40,
			},
		},
		"compareArtifact": map[string]any{
			"schemaVersion": contracts.CompareArtifactSchema,
			"summary":       "Held-out operator guidance improved enough to continue search.",
			"reasons": []string{
				"operator-recovery: improved recovery-next-step clarity without adding false positives.",
			},
		},
	})
	if _, stderr, exitCode := runCLI(t, root, "optimize", "search", "prepare-input", "--optimize-input", optimizeInputPath, "--held-out-results-file", heldOutResultsPath, "--target-file", targetPath, "--output", searchInputPath); exitCode != 0 {
		t.Fatalf("optimize search prepare-input failed: %s", stderr)
	}
	stdout, stderr, exitCode := runCLI(t, root, "optimize", "search", "run", "--input", searchInputPath, "--json")
	if exitCode != 0 {
		t.Fatalf("optimize search run unexpectedly blocked: stdout=%s stderr=%s", stdout, stderr)
	}
	result := parseJSONObject(t, stdout)
	if result["status"] != "completed" {
		t.Fatalf("unexpected optimize search result: %#v", result)
	}
}

func TestCLIOptimizeSearchPrepareInputJSONAndBlockedRunReturnMachineReadablePayload(t *testing.T) {
	root := t.TempDir()
	reportPath := filepath.Join(root, "report.json")
	targetPath := filepath.Join(root, "review.prompt.md")
	optimizeInputPath := filepath.Join(root, "optimize-input.json")
	searchInputPath := filepath.Join(root, "optimize-search-input.json")
	if err := os.WriteFile(targetPath, []byte("Keep recovery instructions explicit.\n"), 0o644); err != nil {
		t.Fatalf("WriteFile returned error: %v", err)
	}
	writeJSONFile(t, reportPath, map[string]any{
		"schemaVersion": contracts.ReportPacketSchema,
		"generatedAt":   "2026-04-13T00:02:00.000Z",
		"candidate":     "feature/operator-guidance",
		"baseline":      "origin/main",
		"intent":        "Operator recovery guidance should stay legible.",
		"intentProfile": map[string]any{
			"schemaVersion":   contracts.BehaviorIntentSchema,
			"intentId":        "intent-operator-workflow-recovery",
			"summary":         "Operator recovery guidance should stay legible.",
			"behaviorSurface": cautilusruntime.BehaviorSurfaces["OPERATOR_BEHAVIOR"],
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
	_, stderr, exitCode := runCLI(t, root, "optimize", "prepare-input", "--repo-root", root, "--report-file", reportPath, "--target", "prompt", "--target-file", targetPath, "--output", optimizeInputPath)
	if exitCode != 0 {
		t.Fatalf("optimize prepare-input failed: %s", stderr)
	}

	stdout, stderr, exitCode := runCLI(t, root, "optimize", "search", "prepare-input", "--input-json", fmt.Sprintf("{\"optimizeInputFile\":%q}", optimizeInputPath), "--output", searchInputPath, "--json")
	if exitCode != 0 {
		t.Fatalf("optimize search prepare-input --input-json failed: %s", stderr)
	}
	preparePayload := parseJSONObject(t, stdout)
	if preparePayload["status"] != "ready" {
		t.Fatalf("unexpected prepare payload: %#v", preparePayload)
	}
	if preparePayload["inputFile"] != searchInputPath {
		t.Fatalf("unexpected input file: %#v", preparePayload["inputFile"])
	}
	if _, err := os.Stat(filepath.Join(root, "optimize-search-input.raw.json")); err != nil {
		t.Fatalf("expected raw input file to exist: %v", err)
	}

	stdout, stderr, exitCode = runCLI(t, root, "optimize", "search", "run", "--input", searchInputPath, "--json")
	if exitCode != 1 {
		t.Fatalf("expected blocked exit code, got %d, stderr=%s", exitCode, stderr)
	}
	blocked := parseJSONObject(t, stdout)
	if blocked["status"] != "blocked" {
		t.Fatalf("unexpected blocked payload: %#v", blocked)
	}
	reasonCodes, ok := blocked["reasonCodes"].([]any)
	if !ok || len(reasonCodes) < 2 {
		t.Fatalf("unexpected reason codes: %#v", blocked["reasonCodes"])
	}
}

func TestCLIOptimizeSearchRunUsesEvalTestForHeldOutAndFullGate(t *testing.T) {
	root := t.TempDir()
	artifactRoot := t.TempDir()
	targetPath := filepath.Join(root, "prompt.md")
	heldOutResultsPath := filepath.Join(root, "held-out-results.json")
	optimizeInputPath := filepath.Join(root, "optimize-input.json")
	searchInputPath := filepath.Join(root, "optimize-search-input.json")
	searchResultPath := filepath.Join(artifactRoot, "optimize-search-result.json")

	if err := os.MkdirAll(filepath.Join(root, ".agents"), 0o755); err != nil {
		t.Fatalf("MkdirAll returned error: %v", err)
	}
	if err := os.MkdirAll(filepath.Join(root, "fixtures", "eval", "app", "prompt"), 0o755); err != nil {
		t.Fatalf("MkdirAll returned error: %v", err)
	}
	if err := os.WriteFile(targetPath, []byte("Keep recovery instructions explicit.\n"), 0o644); err != nil {
		t.Fatalf("WriteFile returned error: %v", err)
	}
	writeExecutableFile(t, root, "codex", strings.Join([]string{
		"#!/bin/sh",
		"out=\"\"",
		"while [ \"$#\" -gt 0 ]; do",
		"  if [ \"$1\" = \"-o\" ]; then",
		"    out=\"$2\"",
		"    shift 2",
		"    continue",
		"  fi",
		"  shift",
		"done",
		"cat >/dev/null",
		"cat >\"$out\" <<'EOF'",
		"{\"promptMarkdown\":\"Keep recovery instructions explicit with a detailed recovery checklist.\\n\",\"rationaleSummary\":\"Add a concrete recovery checklist.\",\"expectedImprovements\":[\"operator-recovery\"],\"preservedStrengths\":[\"keeps the original recovery framing\"],\"riskNotes\":[\"ensure the extra detail stays concise\"]}",
		"EOF",
		"",
	}, "\n"))
	writeExecutableFile(t, root, "run-eval.sh", strings.Join([]string{
		"#!/bin/sh",
		"cases_file=\"$1\"",
		"observed_file=\"$2\"",
		"candidate_repo=\"$3\"",
		"node - \"$cases_file\" \"$observed_file\" \"$candidate_repo/prompt.md\" <<'EOF'",
		"const fs = require('fs');",
		"const [casesFile, observedFile, promptFile] = process.argv.slice(2);",
		"const cases = JSON.parse(fs.readFileSync(casesFile, 'utf8'));",
		"const prompt = fs.readFileSync(promptFile, 'utf8').trim();",
		"const evaluations = cases.cases.map((testCase) => ({",
		"  caseId: testCase.caseId,",
		"  displayName: testCase.displayName,",
		"  provider: cases.provider,",
		"  model: cases.model,",
		"  harness: 'fixture-backend',",
		"  mode: 'messaging',",
		"  durationMs: 1,",
		"  expected: testCase.expected,",
		"  observed: {",
		"    input: testCase.input,",
		"    messages: [",
		"      { role: 'user', content: testCase.input },",
		"      { role: 'assistant', content: prompt },",
		"    ],",
		"    finalText: prompt,",
		"  },",
		"}));",
		"fs.writeFileSync(observedFile, JSON.stringify({",
		"  schemaVersion: 'cautilus.app_prompt_evaluation_inputs.v1',",
		"  suiteId: cases.suiteId,",
		"  suiteDisplayName: cases.suiteDisplayName,",
		"  evaluations,",
		"}, null, 2) + '\\n');",
		"EOF",
		"",
	}, "\n"))
	if err := os.WriteFile(filepath.Join(root, ".agents", "cautilus-adapter.yaml"), []byte(strings.Join([]string{
		"version: 1",
		"repo: temp-optimize-search",
		"evaluation_surfaces:",
		"  - app / prompt",
		"baseline_options:",
		"  - baseline git ref in the same repo via {baseline_ref}",
		"required_prerequisites: []",
		"evaluation_input_default: fixtures/eval/app/prompt/operator-recovery.fixture.json",
		"default_runtime: fixture",
		"eval_test_command_templates:",
		"  - ./run-eval.sh {eval_cases_file} {eval_observed_file} {candidate_repo}",
		"comparison_questions:",
		"  - Did the held-out score improve?",
		"human_review_prompts:",
		"  - id: operator",
		"    prompt: Where would the prompt still leave the operator stuck?",
		"",
	}, "\n")), 0o644); err != nil {
		t.Fatalf("WriteFile returned error: %v", err)
	}
	writeJSONFile(t, filepath.Join(root, "fixtures", "eval", "app", "prompt", "operator-recovery.fixture.json"), map[string]any{
		"schemaVersion":    contracts.EvaluationInputSchema,
		"surface":          "app",
		"preset":           "prompt",
		"suiteId":          "operator-recovery",
		"suiteDisplayName": "Operator Recovery",
		"provider":         "fixture",
		"model":            "fixture",
		"system":           "Use the checked-out candidate prompt.",
		"cases": []map[string]any{
			{
				"caseId":      "operator-recovery",
				"displayName": "Operator recovery guidance",
				"input":       "What should the operator do next?",
				"expected":    map[string]any{"finalText": "checklist"},
			},
		},
	})
	writeJSONFile(t, heldOutResultsPath, map[string]any{
		"schemaVersion": contracts.ScenarioResultsSchema,
		"mode":          "held_out",
		"results": []map[string]any{
			{
				"scenarioId":   "operator-recovery",
				"status":       "passed",
				"overallScore": 70,
				"telemetry":    map[string]any{"cost_usd": 0.02, "durationMs": 1200},
			},
		},
	})
	writeJSONFile(t, optimizeInputPath, map[string]any{
		"schemaVersion":      contracts.OptimizeInputsSchema,
		"generatedAt":        "2026-04-26T09:58:00.000Z",
		"repoRoot":           root,
		"optimizationTarget": "prompt",
		"intentProfile": map[string]any{
			"schemaVersion":   contracts.BehaviorIntentSchema,
			"intentId":        "intent-operator-recovery-guidance",
			"summary":         "Operator guidance should stay legible under recovery pressure.",
			"behaviorSurface": cautilusruntime.BehaviorSurfaces["OPERATOR_BEHAVIOR"],
		},
		"optimizer": map[string]any{
			"budget": "light",
			"plan": map[string]any{
				"evidenceLimit":        3,
				"suggestedChangeLimit": 2,
				"reviewVariantLimit":   1,
				"historySignalLimit":   1,
			},
		},
		"targetFile": map[string]any{"path": targetPath, "exists": true},
		"reportFile": filepath.Join(root, "report.json"),
		"report": map[string]any{
			"schemaVersion":       contracts.ReportPacketSchema,
			"generatedAt":         "2026-04-26T09:57:00.000Z",
			"candidate":           root,
			"baseline":            "HEAD",
			"intent":              "Operator guidance should stay legible under recovery pressure.",
			"commands":            []any{},
			"commandObservations": []any{},
			"modesRun":            []any{},
			"modeSummaries":       []any{},
			"telemetry":           map[string]any{"modeCount": 0},
			"improved":            []any{},
			"regressed":           []any{"operator-recovery"},
			"unchanged":           []any{},
			"noisy":               []any{},
			"humanReviewFindings": []any{
				map[string]any{"severity": "concern", "message": "operator-recovery still needs a detailed recovery checklist"},
			},
			"recommendation": "defer",
		},
	})

	runGit(t, root, "init")
	runGit(t, root, "config", "user.email", "test@example.com")
	runGit(t, root, "config", "user.name", "Cautilus Test")
	runGit(t, root, "add", ".")
	runGit(t, root, "commit", "-m", "initial")
	t.Setenv("PATH", root+string(os.PathListSeparator)+os.Getenv("PATH"))

	_, stderr, exitCode := runCLI(t, root, "optimize", "search", "prepare-input", "--optimize-input", optimizeInputPath, "--held-out-results-file", heldOutResultsPath, "--budget", "light", "--output", searchInputPath)
	if exitCode != 0 {
		t.Fatalf("optimize search prepare-input failed: %s", stderr)
	}
	stdout, stderr, exitCode := runCLI(t, root, "optimize", "search", "run", "--input", searchInputPath, "--output", searchResultPath)
	if exitCode != 0 {
		resultPayload, _ := os.ReadFile(searchResultPath)
		t.Fatalf("optimize search run failed: stdout=%s stderr=%s result=%s", stdout, stderr, string(resultPayload))
	}
	searchResult := readJSONObjectFile(t, searchResultPath)
	if searchResult["status"] != "completed" {
		t.Fatalf("unexpected search result status: %#v", searchResult)
	}
	if searchResult["selectedCandidateId"] == "seed" {
		t.Fatalf("expected eval-backed mutation candidate to beat seed, got %#v", searchResult["selectedCandidateId"])
	}
	registry := searchResult["candidateRegistry"].([]any)
	if len(registry) < 2 {
		t.Fatalf("expected at least seed + one mutation candidate, got %#v", registry)
	}
	mutationFound := false
	for _, raw := range registry {
		entry := raw.(map[string]any)
		if entry["origin"] == "seed" {
			continue
		}
		mutationFound = true
		artifacts, ok := entry["evaluationArtifacts"].(map[string]any)
		if !ok {
			t.Fatalf("mutation candidate %v missing evaluationArtifacts", entry["id"])
		}
		if artifacts["status"] != "passed" || artifacts["summaryFile"] == "" || artifacts["worktreeRoot"] == "" {
			t.Fatalf("expected eval-backed evaluationArtifacts, got %#v", artifacts)
		}
	}
	if !mutationFound {
		t.Fatalf("expected at least one mutation candidate in registry, got %#v", registry)
	}
	matrix := searchResult["heldOutEvaluationMatrix"].([]any)
	mutationMatrixEntryFound := false
	for _, raw := range matrix {
		entry := raw.(map[string]any)
		if entry["candidateId"] == searchResult["selectedCandidateId"] {
			mutationMatrixEntryFound = true
			if entry["score"] != float64(100) {
				t.Fatalf("unexpected held-out score for selected mutation candidate: %#v", entry)
			}
		}
	}
	if !mutationMatrixEntryFound {
		t.Fatalf("expected held-out matrix entry for selected mutation candidate, got %#v", matrix)
	}
	searchTelemetry := searchResult["searchTelemetry"].(map[string]any)
	if searchTelemetry["fullGateCheckpointCount"] != float64(1) {
		t.Fatalf("expected one full-gate eval checkpoint, got %#v", searchTelemetry)
	}
	checkpointOutcomes := searchResult["checkpointOutcomes"].(map[string]any)
	fullGate, ok := checkpointOutcomes["fullGate"].([]any)
	if !ok || len(fullGate) != 1 || fullGate[0].(map[string]any)["status"] != "passed" {
		t.Fatalf("expected one passing fullGate checkpoint, got %#v", checkpointOutcomes["fullGate"])
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

func TestCLIEvalTestRunsDevRepoFixture(t *testing.T) {
	root := t.TempDir()
	adapterDir := filepath.Join(root, ".agents")
	fixtureDir := filepath.Join(root, "fixtures", "eval", "dev", "repo")
	outputDir := filepath.Join(root, "outputs")
	if err := os.MkdirAll(adapterDir, 0o755); err != nil {
		t.Fatalf("MkdirAll returned error: %v", err)
	}
	if err := os.MkdirAll(fixtureDir, 0o755); err != nil {
		t.Fatalf("MkdirAll returned error: %v", err)
	}
	scriptPath := filepath.Join(root, "eval-test.sh")
	script := `#!/bin/sh
cat <<'JSON' > "$1"
{
  "schemaVersion": "cautilus.evaluation_observed.v1",
  "suiteId": "instruction-surface-demo",
  "evaluations": [
    {
      "evaluationId": "checked-in-agents-routing",
      "displayName": "checked-in-agents-routing",
      "prompt": "User request: continue from docs/internal/handoff.md and implement the next slice. Read the repo instructions first, then identify both the startup bootstrap helper and the durable work skill you would use for this implementation task.",
      "startedAt": "2026-04-25T00:00:00.000Z",
      "observationStatus": "observed",
      "summary": "Started from AGENTS.md, used find-skills as the bootstrap helper, and selected impl as the durable work skill.",
      "entryFile": "AGENTS.md",
      "loadedInstructionFiles": ["AGENTS.md"],
      "loadedSupportingFiles": [],
      "routingDecision": {
        "selectedSkill": "impl",
        "bootstrapHelper": "find-skills",
        "workSkill": "impl"
      },
      "instructionSurface": {
        "surfaceLabel": "compact_agents",
        "files": [
          {
            "path": "AGENTS.md",
            "kind": "file",
            "sourceKind": "workspace_default"
          }
        ]
      },
      "expectedEntryFile": "AGENTS.md",
      "requiredInstructionFiles": ["AGENTS.md"],
      "expectedRouting": { "bootstrapHelper": "find-skills", "workSkill": "impl" },
      "artifactRefs": []
    }
  ]
}
JSON
`
	if err := os.WriteFile(scriptPath, []byte(script), 0o755); err != nil {
		t.Fatalf("WriteFile returned error: %v", err)
	}
	writeJSONFile(t, filepath.Join(fixtureDir, "base.fixture.json"), map[string]any{
		"schemaVersion":    contracts.EvaluationInputSchema,
		"surface":          "dev",
		"preset":           "repo",
		"suiteId":          "instruction-surface-demo",
		"suiteDisplayName": "Instruction Surface Demo",
		"cases": []map[string]any{
			{
				"caseId":            "base-placeholder",
				"prompt":            "Base case should be replaced by the child fixture.",
				"expectedEntryFile": "AGENTS.md",
				"expectedRouting": map[string]any{
					"bootstrapHelper": "find-skills",
					"workSkill":       "impl",
				},
			},
		},
	})
	writeJSONFile(t, filepath.Join(fixtureDir, "checked-in-agents-routing.fixture.json"), map[string]any{
		"schemaVersion": contracts.EvaluationInputSchema,
		"extends":       "./base.fixture.json",
		"cases": []map[string]any{
			{
				"caseId":                   "checked-in-agents-routing",
				"prompt":                   "User request: continue from docs/internal/handoff.md and implement the next slice. Read the repo instructions first, then identify both the startup bootstrap helper and the durable work skill you would use for this implementation task.",
				"expectedEntryFile":        "AGENTS.md",
				"requiredInstructionFiles": []string{"AGENTS.md"},
				"expectedRouting": map[string]any{
					"bootstrapHelper": "find-skills",
					"workSkill":       "impl",
				},
			},
		},
	})
	if err := os.WriteFile(filepath.Join(adapterDir, "cautilus-adapter.yaml"), []byte(strings.Join([]string{
		"version: 1",
		"repo: temp",
		"evaluation_surfaces:",
		"  - instruction surface fidelity",
		"baseline_options:",
		"  - baseline git ref via {baseline_ref}",
		"evaluation_input_default: fixtures/eval/dev/repo/checked-in-agents-routing.fixture.json",
		"eval_test_command_templates:",
		"  - sh ./eval-test.sh {eval_observed_file}",
		"",
	}, "\n")), 0o644); err != nil {
		t.Fatalf("WriteFile returned error: %v", err)
	}

	stdout, stderr, exitCode := runCLI(t, root, "eval", "test", "--repo-root", root, "--output-dir", outputDir)
	if exitCode != 0 {
		t.Fatalf("eval test failed: %s", stderr)
	}
	if strings.Contains(stderr, "deprecation:") {
		t.Fatalf("eval test must not emit a deprecation pointer, got: %s", stderr)
	}
	summaryPath := strings.TrimSpace(stdout)
	summary := readJSONObjectFile(t, summaryPath)
	if summary["schemaVersion"] != contracts.EvaluationSummarySchema || summary["recommendation"] != "accept-now" {
		t.Fatalf("unexpected eval test summary: %#v", summary)
	}
	casesPath := filepath.Join(outputDir, "eval-cases.json")
	cases := readJSONObjectFile(t, casesPath)
	if cases["schemaVersion"] != contracts.EvaluationCasesSchema {
		t.Fatalf("eval-cases must use the evaluation_cases schema, got: %v", cases["schemaVersion"])
	}
	if cases["suiteDisplayName"] != "Instruction Surface Demo" {
		t.Fatalf("expected child fixture to inherit suiteDisplayName, got: %#v", cases)
	}
}

func TestCLIEvalTestRunsMultiStepFixtureWithStrictProjection(t *testing.T) {
	root := t.TempDir()
	adapterDir := filepath.Join(root, ".agents")
	fixtureDir := filepath.Join(root, "fixtures", "eval", "app", "prompt")
	outputDir := filepath.Join(root, "outputs")
	if err := os.MkdirAll(adapterDir, 0o755); err != nil {
		t.Fatalf("MkdirAll returned error: %v", err)
	}
	if err := os.MkdirAll(fixtureDir, 0o755); err != nil {
		t.Fatalf("MkdirAll returned error: %v", err)
	}
	scriptPath := filepath.Join(root, "eval-test.sh")
	script := `#!/bin/sh
node - "$1" "$2" <<'EOF'
const fs = require('fs');
const [casesFile, observedFile] = process.argv.slice(2);
const cases = JSON.parse(fs.readFileSync(casesFile, 'utf8'));
const evaluations = cases.cases.map((testCase) => {
  let finalText = testCase.input;
  if (testCase.input === "Start") {
    finalText = "seed text";
  } else if (testCase.input.startsWith("Second saw ")) {
    finalText = testCase.input.slice("Second saw ".length);
  }
  return {
    caseId: testCase.caseId,
    displayName: testCase.displayName,
    provider: cases.provider,
    model: cases.model,
    harness: "fixture-backend",
    mode: "messaging",
    durationMs: 1,
    expected: testCase.expected,
    observed: {
      input: testCase.input,
      messages: [
        { role: "user", content: testCase.input },
        { role: "assistant", content: finalText }
      ],
      finalText
    }
  };
});
fs.writeFileSync(observedFile, JSON.stringify({
  schemaVersion: "cautilus.app_prompt_evaluation_inputs.v1",
  suiteId: cases.suiteId,
  suiteDisplayName: cases.suiteDisplayName,
  evaluations
}, null, 2) + "\n");
EOF
`
	if err := os.WriteFile(scriptPath, []byte(script), 0o755); err != nil {
		t.Fatalf("WriteFile returned error: %v", err)
	}
	if err := os.WriteFile(filepath.Join(adapterDir, "cautilus-adapter.yaml"), []byte(strings.Join([]string{
		"version: 1",
		"repo: temp",
		"evaluation_surfaces:",
		"  - app / prompt",
		"baseline_options:",
		"  - baseline git ref via {baseline_ref}",
		"default_runtime: fixture",
		"eval_test_command_templates:",
		"  - sh ./eval-test.sh {eval_cases_file} {eval_observed_file}",
		"",
	}, "\n")), 0o644); err != nil {
		t.Fatalf("WriteFile returned error: %v", err)
	}
	writeJSONFile(t, filepath.Join(fixtureDir, "first.fixture.json"), map[string]any{
		"schemaVersion":    contracts.EvaluationInputSchema,
		"surface":          "app",
		"preset":           "prompt",
		"suiteId":          "first-step",
		"suiteDisplayName": "First Step",
		"provider":         "fixture",
		"model":            "fixture",
		"system":           "Return fixture text.",
		"cases": []map[string]any{
			{
				"caseId":      "first",
				"displayName": "First",
				"input":       "Start",
				"expected":    map[string]any{"finalText": "seed text"},
			},
		},
	})
	writeJSONFile(t, filepath.Join(fixtureDir, "second.fixture.json"), map[string]any{
		"schemaVersion":    contracts.EvaluationInputSchema,
		"surface":          "app",
		"preset":           "prompt",
		"suiteId":          "second-step",
		"suiteDisplayName": "Second Step",
		"provider":         "fixture",
		"model":            "fixture",
		"system":           "Return fixture text.",
		"cases": []map[string]any{
			{
				"caseId":      "second",
				"displayName": "Second",
				"input":       "Second saw ${steps[0].output.text}",
				"expected":    "${steps[0].output}",
			},
		},
	})
	writeJSONFile(t, filepath.Join(fixtureDir, "multi-step.fixture.json"), map[string]any{
		"schemaVersion":    contracts.EvaluationInputSchema,
		"suiteId":          "multi-step",
		"suiteDisplayName": "Multi Step",
		"steps": []map[string]any{
			{
				"$ref": "./first.fixture.json",
				"outputProjection": map[string]any{
					"finalText": "evaluations[0].observed.finalText",
					"text":      "evaluations[0].observed.finalText",
				},
			},
			{
				"$ref": "./second.fixture.json",
				"outputProjection": map[string]any{
					"text": "evaluations[0].observed.finalText",
				},
			},
		},
	})
	stdout, stderr, exitCode := runCLI(t, root, "eval", "test", "--repo-root", root, "--fixture", filepath.Join(fixtureDir, "multi-step.fixture.json"), "--output-dir", outputDir)
	if exitCode != 0 {
		t.Fatalf("multi-step eval test failed: %s", stderr)
	}
	summary := readJSONObjectFile(t, strings.TrimSpace(stdout))
	if summary["recommendation"] != "accept-now" {
		t.Fatalf("unexpected multi-step summary: %#v", summary)
	}
	steps := summary["steps"].([]any)
	if len(steps) != 2 {
		t.Fatalf("expected two step summaries, got %#v", steps)
	}
	secondCases := readJSONObjectFile(t, filepath.Join(outputDir, "steps", "step-1", "eval-cases.json"))
	secondCase := secondCases["cases"].([]any)[0].(map[string]any)
	if secondCase["input"] != "Second saw seed text" {
		t.Fatalf("expected dotted-path interpolation, got %#v", secondCase)
	}
	if secondCase["expected"].(map[string]any)["finalText"] != "seed text" {
		t.Fatalf("expected whole-output JSON substitution, got %#v", secondCase["expected"])
	}

	badFixturePath := filepath.Join(fixtureDir, "bad-step.fixture.json")
	writeJSONFile(t, badFixturePath, map[string]any{
		"schemaVersion": contracts.EvaluationInputSchema,
		"suiteId":       "bad-step",
		"steps": []map[string]any{
			{
				"$ref": "./first.fixture.json",
				"outputProjection": map[string]any{
					"text": "evaluations[0].observed.finalText",
				},
			},
			{
				"$ref": "./second.fixture.json",
				"cases": []map[string]any{
					{
						"caseId":      "bad",
						"displayName": "Bad",
						"input":       "${steps[0]}",
						"expected":    map[string]any{"finalText": "seed text"},
					},
				},
				"outputProjection": map[string]any{
					"text": "evaluations[0].observed.finalText",
				},
			},
		},
	})
	_, stderr, exitCode = runCLI(t, root, "eval", "test", "--repo-root", root, "--fixture", badFixturePath, "--output-dir", filepath.Join(root, "bad-output"))
	if exitCode == 0 || !strings.Contains(stderr, "invalid step placeholder") {
		t.Fatalf("expected invalid placeholder error, exit=%d stderr=%s", exitCode, stderr)
	}
}

func TestCLIEvalTestRunsDevSkillFixture(t *testing.T) {
	root := t.TempDir()
	adapterDir := filepath.Join(root, ".agents")
	fixtureDir := filepath.Join(root, "fixtures", "eval", "dev", "skill")
	outputDir := filepath.Join(root, "outputs")
	if err := os.MkdirAll(adapterDir, 0o755); err != nil {
		t.Fatalf("MkdirAll returned error: %v", err)
	}
	if err := os.MkdirAll(fixtureDir, 0o755); err != nil {
		t.Fatalf("MkdirAll returned error: %v", err)
	}
	scriptPath := filepath.Join(root, "eval-test.sh")
	script := `#!/bin/sh
cat <<'JSON' > "$1"
{
  "schemaVersion": "cautilus.skill_evaluation_inputs.v1",
  "skillId": "demo",
  "skillDisplayName": "demo",
  "evaluations": [
    {
      "evaluationId": "trigger-demo",
      "targetKind": "public_skill",
      "targetId": "demo",
      "displayName": "demo",
      "evaluationKind": "trigger",
      "prompt": "Use $demo here.",
      "startedAt": "2026-04-25T00:00:00.000Z",
      "expectedTrigger": "must_invoke",
      "invoked": true,
      "summary": "demo was invoked as expected."
    }
  ]
}
JSON
`
	if err := os.WriteFile(scriptPath, []byte(script), 0o755); err != nil {
		t.Fatalf("WriteFile returned error: %v", err)
	}
	writeJSONFile(t, filepath.Join(fixtureDir, "demo.fixture.json"), map[string]any{
		"schemaVersion": contracts.EvaluationInputSchema,
		"surface":       "dev",
		"preset":        "skill",
		"suiteId":       "demo",
		"skillId":       "demo",
		"cases": []map[string]any{
			{
				"caseId":          "trigger-demo",
				"evaluationKind":  "trigger",
				"prompt":          "Use $demo here.",
				"expectedTrigger": "must_invoke",
			},
		},
	})
	if err := os.WriteFile(filepath.Join(adapterDir, "cautilus-adapter.yaml"), []byte(strings.Join([]string{
		"version: 1",
		"repo: temp",
		"evaluation_surfaces:",
		"  - skill trigger fidelity",
		"baseline_options:",
		"  - baseline git ref via {baseline_ref}",
		"evaluation_input_default: fixtures/eval/dev/skill/demo.fixture.json",
		"eval_test_command_templates:",
		"  - sh ./eval-test.sh {eval_observed_file}",
		"",
	}, "\n")), 0o644); err != nil {
		t.Fatalf("WriteFile returned error: %v", err)
	}

	stdout, stderr, exitCode := runCLI(t, root, "eval", "test", "--repo-root", root, "--output-dir", outputDir)
	if exitCode != 0 {
		t.Fatalf("eval test failed: %s", stderr)
	}
	summaryPath := strings.TrimSpace(stdout)
	summary := readJSONObjectFile(t, summaryPath)
	if summary["schemaVersion"] != contracts.SkillEvaluationSummarySchema || summary["recommendation"] != "accept-now" {
		t.Fatalf("unexpected eval test summary: %#v", summary)
	}
	casesPath := filepath.Join(outputDir, "eval-cases.json")
	cases := readJSONObjectFile(t, casesPath)
	if cases["schemaVersion"] != contracts.SkillTestCasesSchema {
		t.Fatalf("eval-cases must use the skill_test_cases schema, got: %v", cases["schemaVersion"])
	}
}

func TestCLIEvalTestAcceptsFixtureRuntime(t *testing.T) {
	root := t.TempDir()
	adapterDir := filepath.Join(root, ".agents")
	fixtureDir := filepath.Join(root, "fixtures", "eval", "dev", "skill")
	outputDir := filepath.Join(root, "outputs")
	if err := os.MkdirAll(adapterDir, 0o755); err != nil {
		t.Fatalf("MkdirAll returned error: %v", err)
	}
	if err := os.MkdirAll(fixtureDir, 0o755); err != nil {
		t.Fatalf("MkdirAll returned error: %v", err)
	}
	scriptPath := filepath.Join(root, "eval-test.sh")
	script := `#!/bin/sh
if [ "$1" != "fixture" ]; then
  echo "expected fixture backend, got $1" >&2
  exit 1
fi
cat <<'JSON' > "$2"
{
  "schemaVersion": "cautilus.skill_evaluation_inputs.v1",
  "skillId": "demo",
  "evaluations": [
    {
      "evaluationId": "execution-demo",
      "targetKind": "public_skill",
      "targetId": "demo",
      "evaluationKind": "execution",
      "prompt": "Run the fixture runtime.",
      "startedAt": "2026-04-27T00:00:00.000Z",
      "invoked": true,
      "summary": "fixture runtime was selected.",
      "outcome": "passed"
    }
  ]
}
JSON
`
	if err := os.WriteFile(scriptPath, []byte(script), 0o755); err != nil {
		t.Fatalf("WriteFile returned error: %v", err)
	}
	writeJSONFile(t, filepath.Join(fixtureDir, "demo.fixture.json"), map[string]any{
		"schemaVersion": contracts.EvaluationInputSchema,
		"surface":       "dev",
		"preset":        "skill",
		"suiteId":       "demo",
		"skillId":       "demo",
		"cases": []map[string]any{
			{
				"caseId":         "execution-demo",
				"evaluationKind": "execution",
				"prompt":         "Run the fixture runtime.",
			},
		},
	})
	if err := os.WriteFile(filepath.Join(adapterDir, "cautilus-adapter.yaml"), []byte(strings.Join([]string{
		"version: 1",
		"repo: temp",
		"evaluation_surfaces:",
		"  - fixture runtime selection",
		"evaluation_input_default: fixtures/eval/dev/skill/demo.fixture.json",
		"default_runtime: fixture",
		"eval_test_command_templates:",
		"  - sh ./eval-test.sh {backend} {eval_observed_file}",
		"",
	}, "\n")), 0o644); err != nil {
		t.Fatalf("WriteFile returned error: %v", err)
	}

	stdout, stderr, exitCode := runCLI(t, root, "eval", "test", "--repo-root", root, "--output-dir", outputDir)
	if exitCode != 0 {
		t.Fatalf("eval test failed: %s", stderr)
	}
	summary := readJSONObjectFile(t, strings.TrimSpace(stdout))
	if summary["recommendation"] != "accept-now" {
		t.Fatalf("unexpected eval test summary: %#v", summary)
	}
}

func TestCLIEvalEvaluateAcceptsSkillObservedPacket(t *testing.T) {
	root := t.TempDir()
	inputPath := filepath.Join(root, "skill-observed.json")
	writeJSONFile(t, inputPath, map[string]any{
		"schemaVersion": contracts.SkillEvaluationInputsSchema,
		"skillId":       "demo",
		"evaluations": []map[string]any{
			{
				"evaluationId":    "trigger-demo",
				"targetKind":      "public_skill",
				"targetId":        "demo",
				"displayName":     "demo",
				"evaluationKind":  "trigger",
				"prompt":          "Use $demo here.",
				"startedAt":       "2026-04-25T00:00:00.000Z",
				"expectedTrigger": "must_invoke",
				"invoked":         true,
				"summary":         "demo was invoked as expected.",
			},
		},
	})
	stdout, stderr, exitCode := runCLI(t, root, "eval", "evaluate", "--input", inputPath)
	if exitCode != 0 {
		t.Fatalf("eval evaluate failed: %s", stderr)
	}
	summary := parseJSONObject(t, stdout)
	if summary["schemaVersion"] != contracts.SkillEvaluationSummarySchema {
		t.Fatalf("expected skill summary schema, got: %#v", summary["schemaVersion"])
	}
}

func TestCLIEvalTestRunsAppChatFixture(t *testing.T) {
	root := t.TempDir()
	adapterDir := filepath.Join(root, ".agents")
	fixtureDir := filepath.Join(root, "fixtures", "eval", "app", "chat")
	outputDir := filepath.Join(root, "outputs")
	if err := os.MkdirAll(adapterDir, 0o755); err != nil {
		t.Fatalf("MkdirAll returned error: %v", err)
	}
	if err := os.MkdirAll(fixtureDir, 0o755); err != nil {
		t.Fatalf("MkdirAll returned error: %v", err)
	}
	scriptPath := filepath.Join(root, "eval-test.sh")
	script := `#!/bin/sh
cat <<'JSON' > "$1"
{
  "schemaVersion": "cautilus.app_chat_evaluation_inputs.v1",
  "suiteId": "demo-chat",
  "suiteDisplayName": "Demo Chat",
  "evaluations": [
    {
      "caseId": "say-hello",
      "displayName": "Greeting",
      "provider": "anthropic",
      "model": "claude-sonnet-4-6",
      "harness": "fixture-backend",
      "mode": "messaging",
      "durationMs": 42,
      "observed": {
        "messages": [
          {"role": "user", "content": "Say hello in one short sentence."},
          {"role": "assistant", "content": "Hello there, friend."}
        ],
        "finalText": "Hello there, friend."
      },
      "expected": {"finalText": "Hello"}
    }
  ]
}
JSON
`
	if err := os.WriteFile(scriptPath, []byte(script), 0o755); err != nil {
		t.Fatalf("WriteFile returned error: %v", err)
	}
	writeJSONFile(t, filepath.Join(fixtureDir, "demo.fixture.json"), map[string]any{
		"schemaVersion": contracts.EvaluationInputSchema,
		"surface":       "app",
		"preset":        "chat",
		"suiteId":       "demo-chat",
		"provider":      "anthropic",
		"model":         "claude-sonnet-4-6",
		"system":        "You are a careful assistant.",
		"cases": []map[string]any{
			{
				"caseId": "say-hello",
				"messages": []map[string]any{
					{"role": "user", "content": "Say hello in one short sentence."},
				},
				"expected": map[string]any{"finalText": "Hello"},
			},
		},
	})
	if err := os.WriteFile(filepath.Join(adapterDir, "cautilus-adapter.yaml"), []byte(strings.Join([]string{
		"version: 1",
		"repo: temp",
		"evaluation_surfaces:",
		"  - app messaging behavior",
		"baseline_options:",
		"  - fixture-level model pin",
		"evaluation_input_default: fixtures/eval/app/chat/demo.fixture.json",
		"eval_test_command_templates:",
		"  - sh ./eval-test.sh {eval_observed_file}",
		"",
	}, "\n")), 0o644); err != nil {
		t.Fatalf("WriteFile returned error: %v", err)
	}

	stdout, stderr, exitCode := runCLI(t, root, "eval", "test", "--repo-root", root, "--output-dir", outputDir)
	if exitCode != 0 {
		t.Fatalf("eval test failed: %s", stderr)
	}
	summaryPath := strings.TrimSpace(stdout)
	summary := readJSONObjectFile(t, summaryPath)
	if summary["schemaVersion"] != contracts.AppChatEvaluationSummarySchema || summary["recommendation"] != "accept-now" {
		t.Fatalf("unexpected eval test summary: %#v", summary)
	}
	proof := mapOrEmpty(summary["proof"])
	if proof["targetSurface"] != "app/chat" || proof["proofClass"] != "declared-eval-runner" || proof["productProofReady"] != false {
		t.Fatalf("expected app/chat eval summary to preserve non-product proof metadata, got %#v", proof)
	}
	observed := readJSONObjectFile(t, filepath.Join(outputDir, "eval-observed.json"))
	if mapOrEmpty(observed["proof"])["targetSurface"] != "app/chat" {
		t.Fatalf("expected eval-observed proof metadata, got %#v", observed["proof"])
	}
	casesPath := filepath.Join(outputDir, "eval-cases.json")
	cases := readJSONObjectFile(t, casesPath)
	if cases["schemaVersion"] != contracts.AppChatTestCasesSchema {
		t.Fatalf("eval-cases must use the app_chat_test_cases schema, got: %v", cases["schemaVersion"])
	}
}

func TestCLIEvalTestSelectsTypedRunnerBySurface(t *testing.T) {
	root := t.TempDir()
	adapterDir := filepath.Join(root, ".agents")
	fixtureDir := filepath.Join(root, "fixtures", "eval", "app", "chat")
	outputDir := filepath.Join(root, "out")
	if err := os.MkdirAll(adapterDir, 0o755); err != nil {
		t.Fatalf("MkdirAll returned error: %v", err)
	}
	if err := os.MkdirAll(fixtureDir, 0o755); err != nil {
		t.Fatalf("MkdirAll returned error: %v", err)
	}
	scriptPath := filepath.Join(root, "typed-chat-runner.sh")
	script := `#!/bin/sh
set -eu
if [ "$1" != "app-chat-live" ]; then
  echo "unexpected runner id: $1" >&2
  exit 7
fi
cat > "$2" <<'JSON'
{
  "schemaVersion": "cautilus.app_chat_evaluation_inputs.v1",
  "suiteId": "typed-chat",
  "evaluations": [
    {
      "caseId": "say-hello",
      "provider": "fixture",
      "model": "fixture-model",
      "harness": "typed-runner",
      "mode": "messaging",
      "durationMs": 1,
      "observed": {
        "messages": [
          {"role": "assistant", "content": "Hello from typed runner."}
        ],
        "finalText": "Hello from typed runner."
      },
      "expected": {"finalText": "Hello"}
    }
  ]
}
JSON
`
	if err := os.WriteFile(scriptPath, []byte(script), 0o755); err != nil {
		t.Fatalf("WriteFile returned error: %v", err)
	}
	writeJSONFile(t, filepath.Join(fixtureDir, "typed.fixture.json"), map[string]any{
		"schemaVersion": contracts.EvaluationInputSchema,
		"surface":       "app",
		"preset":        "chat",
		"suiteId":       "typed-chat",
		"provider":      "fixture",
		"model":         "fixture-model",
		"cases": []map[string]any{
			{
				"caseId":   "say-hello",
				"messages": []map[string]any{{"role": "user", "content": "Say hello."}},
				"expected": map[string]any{"finalText": "Hello"},
			},
		},
	})
	if err := os.WriteFile(filepath.Join(adapterDir, "cautilus-adapter.yaml"), []byte(strings.Join([]string{
		"version: 1",
		"repo: temp",
		"evaluation_surfaces:",
		"  - app chat behavior",
		"baseline_options:",
		"  - fixture-level model pin",
		"evaluation_input_default: fixtures/eval/app/chat/typed.fixture.json",
		"runner_readiness:",
		"  runners:",
		"    - id: app-chat-live",
		"      surfaces:",
		"        - app/chat",
		"      proof_class: live-product-runner",
		"      command_template: sh ./typed-chat-runner.sh {runner_id} {eval_observed_file}",
		"      default_runtime: fixture",
		"    - id: app-prompt-live",
		"      surfaces:",
		"        - app/prompt",
		"      proof_class: live-product-runner",
		"      command_template: sh -c 'echo wrong typed runner >&2; exit 9'",
		"",
	}, "\n")), 0o644); err != nil {
		t.Fatalf("WriteFile returned error: %v", err)
	}

	stdout, stderr, exitCode := runCLI(t, root, "eval", "test", "--repo-root", root, "--output-dir", outputDir)
	if exitCode != 0 {
		t.Fatalf("eval test failed: %s", stderr)
	}
	summary := readJSONObjectFile(t, strings.TrimSpace(stdout))
	if summary["recommendation"] != "accept-now" {
		t.Fatalf("expected typed runner eval to pass, got %#v", summary)
	}
	proof := mapOrEmpty(summary["proof"])
	if proof["proofClass"] != "fixture-smoke" || proof["proofClassSource"] != "runtime" || proof["declaredProofClass"] != "live-product-runner" || proof["productProofReady"] != false {
		t.Fatalf("expected typed runner proof metadata without product readiness, got %#v", proof)
	}
}

func TestCLIEvalEvaluateAcceptsAppChatObservedPacket(t *testing.T) {
	root := t.TempDir()
	inputPath := filepath.Join(root, "app-chat-observed.json")
	writeJSONFile(t, inputPath, map[string]any{
		"schemaVersion": contracts.AppChatEvaluationInputsSchema,
		"suiteId":       "demo-chat",
		"evaluations": []map[string]any{
			{
				"caseId":      "say-hello",
				"displayName": "Greeting",
				"provider":    "anthropic",
				"model":       "claude-sonnet-4-6",
				"harness":     "fixture-backend",
				"mode":        "messaging",
				"durationMs":  42,
				"observed": map[string]any{
					"messages": []map[string]any{
						{"role": "user", "content": "Say hello in one short sentence."},
						{"role": "assistant", "content": "Hello there, friend."},
					},
					"finalText": "Hello there, friend.",
				},
				"expected": map[string]any{"finalText": "Hello"},
			},
		},
	})
	stdout, stderr, exitCode := runCLI(t, root, "eval", "evaluate", "--input", inputPath)
	if exitCode != 0 {
		t.Fatalf("eval evaluate failed: %s", stderr)
	}
	summary := parseJSONObject(t, stdout)
	if summary["schemaVersion"] != contracts.AppChatEvaluationSummarySchema {
		t.Fatalf("expected app/chat summary schema, got: %#v", summary["schemaVersion"])
	}
}

func TestCLIEvalTestRunsAppPromptFixture(t *testing.T) {
	root := t.TempDir()
	adapterDir := filepath.Join(root, ".agents")
	fixtureDir := filepath.Join(root, "fixtures", "eval", "app", "prompt")
	outputDir := filepath.Join(root, "outputs")
	if err := os.MkdirAll(adapterDir, 0o755); err != nil {
		t.Fatalf("MkdirAll returned error: %v", err)
	}
	if err := os.MkdirAll(fixtureDir, 0o755); err != nil {
		t.Fatalf("MkdirAll returned error: %v", err)
	}
	scriptPath := filepath.Join(root, "eval-test.sh")
	script := `#!/bin/sh
cat <<'JSON' > "$1"
{
  "schemaVersion": "cautilus.app_prompt_evaluation_inputs.v1",
  "suiteId": "demo-prompt",
  "suiteDisplayName": "Demo Prompt",
  "evaluations": [
    {
      "caseId": "summarize-one-line",
      "displayName": "One-line summary",
      "provider": "anthropic",
      "model": "claude-sonnet-4-6",
      "harness": "fixture-backend",
      "mode": "messaging",
      "durationMs": 42,
      "observed": {
        "input": "Summarize: Cautilus evaluates behavior.",
        "messages": [
          {"role": "user", "content": "Summarize: Cautilus evaluates behavior."},
          {"role": "assistant", "content": "Cautilus evaluates behavior."}
        ],
        "finalText": "Cautilus evaluates behavior."
      },
      "expected": {"finalText": "behavior"}
    }
  ]
}
JSON
`
	if err := os.WriteFile(scriptPath, []byte(script), 0o755); err != nil {
		t.Fatalf("WriteFile returned error: %v", err)
	}
	writeJSONFile(t, filepath.Join(fixtureDir, "demo.fixture.json"), map[string]any{
		"schemaVersion": contracts.EvaluationInputSchema,
		"surface":       "app",
		"preset":        "prompt",
		"suiteId":       "demo-prompt",
		"provider":      "anthropic",
		"model":         "claude-sonnet-4-6",
		"system":        "You are a careful assistant.",
		"cases": []map[string]any{
			{
				"caseId":   "summarize-one-line",
				"input":    "Summarize: Cautilus evaluates behavior.",
				"expected": map[string]any{"finalText": "behavior"},
			},
		},
	})
	if err := os.WriteFile(filepath.Join(adapterDir, "cautilus-adapter.yaml"), []byte(strings.Join([]string{
		"version: 1",
		"repo: temp",
		"evaluation_surfaces:",
		"  - app messaging behavior",
		"baseline_options:",
		"  - fixture-level model pin",
		"evaluation_input_default: fixtures/eval/app/prompt/demo.fixture.json",
		"eval_test_command_templates:",
		"  - sh ./eval-test.sh {eval_observed_file}",
		"",
	}, "\n")), 0o644); err != nil {
		t.Fatalf("WriteFile returned error: %v", err)
	}

	stdout, stderr, exitCode := runCLI(t, root, "eval", "test", "--repo-root", root, "--output-dir", outputDir)
	if exitCode != 0 {
		t.Fatalf("eval test failed: %s", stderr)
	}
	summaryPath := strings.TrimSpace(stdout)
	summary := readJSONObjectFile(t, summaryPath)
	if summary["schemaVersion"] != contracts.AppPromptEvaluationSummarySchema || summary["recommendation"] != "accept-now" {
		t.Fatalf("unexpected eval test summary: %#v", summary)
	}
	casesPath := filepath.Join(outputDir, "eval-cases.json")
	cases := readJSONObjectFile(t, casesPath)
	if cases["schemaVersion"] != contracts.AppPromptTestCasesSchema {
		t.Fatalf("eval-cases must use the app_prompt_test_cases schema, got: %v", cases["schemaVersion"])
	}
}

func TestCLIEvalEvaluateAcceptsAppPromptObservedPacket(t *testing.T) {
	root := t.TempDir()
	inputPath := filepath.Join(root, "app-prompt-observed.json")
	writeJSONFile(t, inputPath, map[string]any{
		"schemaVersion": contracts.AppPromptEvaluationInputsSchema,
		"suiteId":       "demo-prompt",
		"evaluations": []map[string]any{
			{
				"caseId":     "summarize-one-line",
				"provider":   "anthropic",
				"model":      "claude-sonnet-4-6",
				"harness":    "fixture-backend",
				"mode":       "messaging",
				"durationMs": 42,
				"observed": map[string]any{
					"input": "Summarize: Cautilus evaluates behavior.",
					"messages": []map[string]any{
						{"role": "user", "content": "Summarize: Cautilus evaluates behavior."},
						{"role": "assistant", "content": "Cautilus evaluates behavior."},
					},
					"finalText": "Cautilus evaluates behavior.",
				},
				"expected": map[string]any{"finalText": "behavior"},
			},
		},
	})
	stdout, stderr, exitCode := runCLI(t, root, "eval", "evaluate", "--input", inputPath)
	if exitCode != 0 {
		t.Fatalf("eval evaluate failed: %s", stderr)
	}
	summary := parseJSONObject(t, stdout)
	if summary["schemaVersion"] != contracts.AppPromptEvaluationSummarySchema {
		t.Fatalf("expected app/prompt summary schema, got: %#v", summary["schemaVersion"])
	}
}

func TestCLIEvalTestRejectsUnsupportedSurfacePresetCombo(t *testing.T) {
	root := t.TempDir()
	adapterDir := filepath.Join(root, ".agents")
	fixtureDir := filepath.Join(root, "fixtures", "eval", "dev", "repo")
	if err := os.MkdirAll(adapterDir, 0o755); err != nil {
		t.Fatalf("MkdirAll returned error: %v", err)
	}
	if err := os.MkdirAll(fixtureDir, 0o755); err != nil {
		t.Fatalf("MkdirAll returned error: %v", err)
	}
	writeJSONFile(t, filepath.Join(fixtureDir, "bad.fixture.json"), map[string]any{
		"schemaVersion": contracts.EvaluationInputSchema,
		"surface":       "app",
		"preset":        "skill",
		"suiteId":       "demo",
		"cases":         []map[string]any{{"caseId": "x", "prompt": "y"}},
	})
	if err := os.WriteFile(filepath.Join(adapterDir, "cautilus-adapter.yaml"), []byte(strings.Join([]string{
		"version: 1",
		"repo: temp",
		"evaluation_surfaces:",
		"  - app fidelity",
		"baseline_options:",
		"  - baseline git ref via {baseline_ref}",
		"eval_test_command_templates:",
		"  - 'true'",
		"",
	}, "\n")), 0o644); err != nil {
		t.Fatalf("WriteFile returned error: %v", err)
	}
	_, stderr, exitCode := runCLI(t, root, "eval", "test", "--repo-root", root, "--fixture", filepath.Join(fixtureDir, "bad.fixture.json"))
	if exitCode == 0 {
		t.Fatalf("expected non-zero exit, got success with stderr: %s", stderr)
	}
	if !strings.Contains(stderr, "preset") {
		t.Fatalf("expected cross-axis preset rejection message, got: %s", stderr)
	}
}

func TestCLIEvalLiveDiscoverNormalizesExplicitInstances(t *testing.T) {
	root := t.TempDir()
	adapterDir := filepath.Join(root, ".agents")
	if err := os.MkdirAll(adapterDir, 0o755); err != nil {
		t.Fatalf("MkdirAll returned error: %v", err)
	}
	adapter := strings.Join([]string{
		"version: 1",
		"repo: temp",
		"evaluation_surfaces:",
		"  - live eval smoke",
		"baseline_options:",
		"  - baseline git ref via {baseline_ref}",
		"instance_discovery:",
		"  kind: explicit",
		"  instances:",
		"    - id: default",
		"      display_label: Local Default",
		fmt.Sprintf("      data_root: %s", filepath.Join(root, ".runtime", "default")),
		"      paths:",
		fmt.Sprintf("        scenario_store: %s", filepath.Join(root, ".runtime", "default", "scenarios.json")),
		fmt.Sprintf("        scenario_results: %s", filepath.Join(root, ".runtime", "default", "results")),
		"",
	}, "\n")
	if err := os.WriteFile(filepath.Join(adapterDir, "cautilus-adapter.yaml"), []byte(adapter), 0o644); err != nil {
		t.Fatalf("WriteFile returned error: %v", err)
	}

	stdout, stderr, exitCode := runCLI(t, root, "eval", "live", "discover", "--repo-root", root)
	if exitCode != 0 {
		t.Fatalf("eval live discover failed: %s", stderr)
	}
	payload := parseJSONObject(t, stdout)
	if payload["schemaVersion"] != contracts.WorkbenchInstanceCatalogSchema {
		t.Fatalf("unexpected schemaVersion: %#v", payload["schemaVersion"])
	}
	instances, ok := payload["instances"].([]any)
	if !ok || len(instances) != 1 {
		t.Fatalf("expected one discovered instance, got %#v", payload["instances"])
	}
	instance, ok := instances[0].(map[string]any)
	if !ok {
		t.Fatalf("expected instance mapping, got %#v", instances[0])
	}
	if instance["instanceId"] != "default" || instance["displayLabel"] != "Local Default" {
		t.Fatalf("unexpected instance payload: %#v", instance)
	}
	paths, ok := instance["paths"].(map[string]any)
	if !ok {
		t.Fatalf("expected normalized paths, got %#v", instance["paths"])
	}
	if paths["scenarioStore"] != filepath.Join(root, ".runtime", "default", "scenarios.json") {
		t.Fatalf("unexpected scenarioStore path: %#v", paths["scenarioStore"])
	}
}

func TestCLILiveEvalDiscoverExecutesConsumerProbeCommand(t *testing.T) {
	root := t.TempDir()
	adapterDir := filepath.Join(root, ".agents")
	if err := os.MkdirAll(adapterDir, 0o755); err != nil {
		t.Fatalf("MkdirAll returned error: %v", err)
	}
	writeExecutableFile(t, root, "discover.sh", strings.Join([]string{
		"#!/bin/sh",
		"cat <<'EOF'",
		"{",
		`  "schemaVersion": "cautilus.workbench_instance_catalog.v1",`,
		`  "instances": [`,
		"    {",
		`      "instanceId": "ceal-dev",`,
		`      "displayLabel": "Ceal Dev",`,
		fmt.Sprintf(`      "dataRoot": %q`, filepath.Join(root, ".runtime", "ceal-dev")),
		"    }",
		"  ]",
		"}",
		"EOF",
		"",
	}, "\n"))
	adapter := strings.Join([]string{
		"version: 1",
		"repo: temp",
		"evaluation_surfaces:",
		"  - live eval smoke",
		"baseline_options:",
		"  - baseline git ref via {baseline_ref}",
		"instance_discovery:",
		"  kind: command",
		"  command_template: ./discover.sh",
		"",
	}, "\n")
	if err := os.WriteFile(filepath.Join(adapterDir, "cautilus-adapter.yaml"), []byte(adapter), 0o644); err != nil {
		t.Fatalf("WriteFile returned error: %v", err)
	}

	stdout, stderr, exitCode := runCLI(t, root, "eval", "live", "discover", "--repo-root", root)
	if exitCode != 0 {
		t.Fatalf("eval live discover failed: %s", stderr)
	}
	payload := parseJSONObject(t, stdout)
	instances := payload["instances"].([]any)
	instance := instances[0].(map[string]any)
	if instance["instanceId"] != "ceal-dev" || instance["displayLabel"] != "Ceal Dev" {
		t.Fatalf("unexpected command-backed catalog: %#v", payload)
	}
}

func TestCLILiveEvalDiscoverIgnoresProbeWarningsOnStderr(t *testing.T) {
	root := t.TempDir()
	adapterDir := filepath.Join(root, ".agents")
	if err := os.MkdirAll(adapterDir, 0o755); err != nil {
		t.Fatalf("MkdirAll returned error: %v", err)
	}
	writeExecutableFile(t, root, "discover.sh", strings.Join([]string{
		"#!/bin/sh",
		"printf '%s\\n' '[discover-instances] skipped ceal-prod: observability.port missing' >&2",
		"cat <<'EOF'",
		"{",
		`  "schemaVersion": "cautilus.workbench_instance_catalog.v1",`,
		`  "instances": [`,
		"    {",
		`      "instanceId": "ceal-dev",`,
		`      "displayLabel": "Ceal Dev",`,
		fmt.Sprintf(`      "dataRoot": %q`, filepath.Join(root, ".runtime", "ceal-dev")),
		"    }",
		"  ]",
		"}",
		"EOF",
		"",
	}, "\n"))
	adapter := strings.Join([]string{
		"version: 1",
		"repo: temp",
		"evaluation_surfaces:",
		"  - live eval smoke",
		"baseline_options:",
		"  - baseline git ref via {baseline_ref}",
		"instance_discovery:",
		"  kind: command",
		"  command_template: ./discover.sh",
		"",
	}, "\n")
	if err := os.WriteFile(filepath.Join(adapterDir, "cautilus-adapter.yaml"), []byte(adapter), 0o644); err != nil {
		t.Fatalf("WriteFile returned error: %v", err)
	}

	stdout, stderr, exitCode := runCLI(t, root, "eval", "live", "discover", "--repo-root", root)
	if exitCode != 0 {
		t.Fatalf("eval live discover failed: %s", stderr)
	}
	payload := parseJSONObject(t, stdout)
	instances := payload["instances"].([]any)
	instance := instances[0].(map[string]any)
	if instance["instanceId"] != "ceal-dev" || instance["displayLabel"] != "Ceal Dev" {
		t.Fatalf("unexpected command-backed catalog when probe warns on stderr: %#v", payload)
	}
}

func TestCLILiveEvalRunLiveDispatchesConsumerCommand(t *testing.T) {
	root := t.TempDir()
	adapterDir := filepath.Join(root, ".agents")
	if err := os.MkdirAll(adapterDir, 0o755); err != nil {
		t.Fatalf("MkdirAll returned error: %v", err)
	}
	writeExecutableFile(t, root, "run-live.sh", strings.Join([]string{
		"#!/bin/sh",
		"instance_id=\"$1\"",
		"request_file=\"$2\"",
		"output_file=\"$3\"",
		"node - \"$instance_id\" \"$request_file\" \"$output_file\" <<'EOF'",
		"const [instanceId, requestFile, outputFile] = process.argv.slice(2);",
		"const { readFileSync, writeFileSync } = await import(\"node:fs\");",
		"const request = JSON.parse(readFileSync(requestFile, \"utf8\"));",
		"writeFileSync(outputFile, JSON.stringify({",
		`  schemaVersion: "cautilus.live_run_invocation_result.v1",`,
		"  requestId: request.requestId,",
		"  instanceId,",
		`  executionStatus: "completed",`,
		`  summary: "consumer completed bounded run",`,
		"  scenarioResult: {",
		"    scenarioId: request.scenario.scenarioId,",
		`    status: "passed",`,
		`    summary: "scenario finished cleanly"`,
		"  }",
		"}) + \"\\n\", \"utf8\");",
		"EOF",
		"",
	}, "\n"))
	adapter := strings.Join([]string{
		"version: 1",
		"repo: temp",
		"evaluation_surfaces:",
		"  - live eval smoke",
		"baseline_options:",
		"  - baseline git ref via {baseline_ref}",
		"live_run_invocation:",
		"  command_template: cautilus eval live run --repo-root {repo_root} --adapter {adapter_path} --instance-id {instance_id} --request-file {request_file} --output-file {output_file}",
		"  consumer_command_template: ./run-live.sh {instance_id} {request_file} {output_file}",
		"",
	}, "\n")
	if err := os.WriteFile(filepath.Join(adapterDir, "cautilus-adapter.yaml"), []byte(adapter), 0o644); err != nil {
		t.Fatalf("WriteFile returned error: %v", err)
	}
	requestPath := filepath.Join(root, "request.json")
	outputPath := filepath.Join(root, "artifacts", "result.json")
	writeJSONFile(t, requestPath, map[string]any{
		"schemaVersion": contracts.LiveRunInvocationRequestSchema,
		"requestId":     "req-123",
		"instanceId":    "ceal",
		"timeoutMs":     30000,
		"scenario": map[string]any{
			"scenarioId":      "scenario-1",
			"name":            "Smoke live run",
			"description":     "Verify the promoted CLI surface can dispatch one bounded run.",
			"maxTurns":        2,
			"sideEffectsMode": "read_only",
			"simulatorTurns":  []string{"Open the runtime and verify the welcome state."},
		},
	})

	stdout, stderr, exitCode := runCLI(
		t,
		root,
		"eval", "live", "run",
		"--repo-root",
		root,
		"--instance-id",
		"ceal",
		"--request-file",
		requestPath,
		"--output-file",
		outputPath,
	)
	if exitCode != 0 {
		t.Fatalf("eval live run failed: %s", stderr)
	}
	if strings.TrimSpace(stdout) != outputPath {
		t.Fatalf("expected stdout to point at result file, got %q", stdout)
	}
	result := readJSONObjectFile(t, outputPath)
	if result["schemaVersion"] != contracts.LiveRunInvocationResultSchema || result["executionStatus"] != "completed" {
		t.Fatalf("unexpected live result payload: %#v", result)
	}
	if result["instanceId"] != "ceal" || result["requestId"] != "req-123" {
		t.Fatalf("unexpected identity fields in live result: %#v", result)
	}
}

func TestCLILiveEvalRunLiveAcceptsBlockedConsumerResult(t *testing.T) {
	root := t.TempDir()
	adapterDir := filepath.Join(root, ".agents")
	if err := os.MkdirAll(adapterDir, 0o755); err != nil {
		t.Fatalf("MkdirAll returned error: %v", err)
	}
	writeExecutableFile(t, root, "run-live.sh", strings.Join([]string{
		"#!/bin/sh",
		"instance_id=\"$1\"",
		"request_file=\"$2\"",
		"output_file=\"$3\"",
		"node - \"$instance_id\" \"$request_file\" \"$output_file\" <<'EOF'",
		"const [instanceId, requestFile, outputFile] = process.argv.slice(2);",
		"const { readFileSync, writeFileSync } = await import(\"node:fs\");",
		"const request = JSON.parse(readFileSync(requestFile, \"utf8\"));",
		"writeFileSync(outputFile, JSON.stringify({",
		`  schemaVersion: "cautilus.live_run_invocation_result.v1",`,
		"  requestId: request.requestId,",
		"  instanceId,",
		`  executionStatus: "blocked",`,
		`  summary: "runtime refused to start the bounded run",`,
		"  diagnostics: [",
		"    {",
		`      code: "runtime_not_ready",`,
		`      severity: "error",`,
		`      message: "Consumer runtime is not ready for live execution."`,
		"    }",
		"  ]",
		"}) + \"\\n\", \"utf8\");",
		"EOF",
		"",
	}, "\n"))
	adapter := strings.Join([]string{
		"version: 1",
		"repo: temp",
		"evaluation_surfaces:",
		"  - live eval smoke",
		"baseline_options:",
		"  - baseline git ref via {baseline_ref}",
		"live_run_invocation:",
		"  command_template: cautilus eval live run --repo-root {repo_root} --adapter {adapter_path} --instance-id {instance_id} --request-file {request_file} --output-file {output_file}",
		"  consumer_command_template: ./run-live.sh {instance_id} {request_file} {output_file}",
		"",
	}, "\n")
	if err := os.WriteFile(filepath.Join(adapterDir, "cautilus-adapter.yaml"), []byte(adapter), 0o644); err != nil {
		t.Fatalf("WriteFile returned error: %v", err)
	}
	requestPath := filepath.Join(root, "request.json")
	outputPath := filepath.Join(root, "artifacts", "blocked-result.json")
	writeJSONFile(t, requestPath, map[string]any{
		"schemaVersion": contracts.LiveRunInvocationRequestSchema,
		"requestId":     "req-456",
		"instanceId":    "ceal-dev",
		"timeoutMs":     30000,
		"scenario": map[string]any{
			"scenarioId":      "scenario-blocked",
			"name":            "Blocked live run",
			"description":     "Verify blocked results stay distinct from completed results.",
			"maxTurns":        1,
			"sideEffectsMode": "read_only",
			"simulatorTurns":  []string{"Attempt to start a bounded live run."},
		},
	})

	stdout, stderr, exitCode := runCLI(
		t,
		root,
		"eval", "live", "run",
		"--repo-root",
		root,
		"--instance-id",
		"ceal-dev",
		"--request-file",
		requestPath,
		"--output-file",
		outputPath,
	)
	if exitCode != 0 {
		t.Fatalf("eval live run failed: %s", stderr)
	}
	if strings.TrimSpace(stdout) != outputPath {
		t.Fatalf("expected stdout to point at blocked result file, got %q", stdout)
	}
	result := readJSONObjectFile(t, outputPath)
	if result["executionStatus"] != "blocked" {
		t.Fatalf("expected blocked execution status, got %#v", result["executionStatus"])
	}
	diagnostics, ok := result["diagnostics"].([]any)
	if !ok || len(diagnostics) != 1 {
		t.Fatalf("expected one diagnostic entry, got %#v", result["diagnostics"])
	}
}

func TestCLILiveEvalRunLiveCanExecuteProductOwnedScriptedLoop(t *testing.T) {
	root := t.TempDir()
	adapterDir := filepath.Join(root, ".agents")
	if err := os.MkdirAll(adapterDir, 0o755); err != nil {
		t.Fatalf("MkdirAll returned error: %v", err)
	}
	writeExecutableFile(t, root, "prepare-live-run.sh", strings.Join([]string{
		"#!/bin/sh",
		"workspace_dir=\"$1\"",
		"node - \"$workspace_dir\" <<'EOF'",
		"const [workspaceDir] = process.argv.slice(2);",
		"const { mkdirSync, readFileSync, writeFileSync } = await import(\"node:fs\");",
		"const { join } = await import(\"node:path\");",
		"mkdirSync(workspaceDir, { recursive: true });",
		"const countFile = join(workspaceDir, \"prepare-count.txt\");",
		"let count = 0;",
		"try { count = Number(readFileSync(countFile, \"utf8\").trim()) || 0; } catch {}",
		"writeFileSync(countFile, `${count + 1}\\n`, \"utf8\");",
		"writeFileSync(join(workspaceDir, \"prepared.txt\"), \"prepared\\n\", \"utf8\");",
		"EOF",
		"",
	}, "\n"))
	writeExecutableFile(t, root, "run-live-turn.sh", strings.Join([]string{
		"#!/bin/sh",
		"turn_request_file=\"$1\"",
		"turn_result_file=\"$2\"",
		"workspace_dir=\"$3\"",
		"node - \"$turn_request_file\" \"$turn_result_file\" \"$workspace_dir\" <<'EOF'",
		"const [turnRequestFile, turnResultFile, workspaceDir] = process.argv.slice(2);",
		"const { appendFileSync, existsSync, readFileSync, writeFileSync } = await import(\"node:fs\");",
		"const { join } = await import(\"node:path\");",
		"const turnRequest = JSON.parse(readFileSync(turnRequestFile, \"utf8\"));",
		"if (!existsSync(join(workspaceDir, \"prepared.txt\"))) {",
		"  throw new Error(\"workspace prepare marker missing\");",
		"}",
		"appendFileSync(join(workspaceDir, \"turn-log.txt\"), `${turnRequest.turnIndex}:${workspaceDir}\\n`, \"utf8\");",
		"writeFileSync(turnResultFile, JSON.stringify({",
		`  schemaVersion: "cautilus.live_run_turn_result.v1",`,
		"  requestId: turnRequest.requestId,",
		"  instanceId: turnRequest.instanceId,",
		"  turnIndex: turnRequest.turnIndex,",
		`  executionStatus: "completed",`,
		`  summary: "synthetic turn completed",`,
		"  assistantTurn: {",
		`    text: turnRequest.turnIndex === 1 ? "먼저 retro를 정리하겠습니다." : "좋습니다. 이제 review로 돌아가겠습니다."`,
		"  }",
		"}) + \"\\n\", \"utf8\");",
		"EOF",
		"",
	}, "\n"))
	writeExecutableFile(t, root, "evaluate-live-run.sh", strings.Join([]string{
		"#!/bin/sh",
		"evaluator_input_file=\"$1\"",
		"evaluation_output_file=\"$2\"",
		"node - \"$evaluator_input_file\" \"$evaluation_output_file\" <<'EOF'",
		"const [evaluatorInputFile, evaluationOutputFile] = process.argv.slice(2);",
		"const { readFileSync, writeFileSync } = await import(\"node:fs\");",
		"const evaluatorInput = JSON.parse(readFileSync(evaluatorInputFile, \"utf8\"));",
		"writeFileSync(evaluationOutputFile, JSON.stringify({",
		`  schemaVersion: "cautilus.live_run_evaluator_result.v1",`,
		`  status: "passed",`,
		"  overallScore: 100,",
		"  summary: `evaluated ${evaluatorInput.transcript.length} transcript turns`,",
		"  details: {",
		"    stopReason: evaluatorInput.stopReason",
		"  }",
		"}) + \"\\n\", \"utf8\");",
		"EOF",
		"",
	}, "\n"))
	adapter := strings.Join([]string{
		"version: 1",
		"repo: temp",
		"evaluation_surfaces:",
		"  - chatbot behavior",
		"baseline_options:",
		"  - baseline git ref via {baseline_ref}",
		"live_run_invocation:",
		"  command_template: cautilus eval live run --repo-root {repo_root} --adapter {adapter_path} --instance-id {instance_id} --request-file {request_file} --output-file {output_file}",
		"  consumer_single_turn_command_template: ./run-live-turn.sh {turn_request_file} {turn_result_file} {workspace_dir}",
		"  workspace_prepare_command_template: ./prepare-live-run.sh {workspace_dir}",
		"  consumer_evaluator_command_template: ./evaluate-live-run.sh {evaluator_input_file} {evaluation_output_file}",
		"",
	}, "\n")
	if err := os.WriteFile(filepath.Join(adapterDir, "cautilus-adapter.yaml"), []byte(adapter), 0o644); err != nil {
		t.Fatalf("WriteFile returned error: %v", err)
	}
	requestPath := filepath.Join(root, "request.json")
	outputPath := filepath.Join(root, "artifacts", "scripted-result.json")
	writeJSONFile(t, requestPath, map[string]any{
		"schemaVersion":     contracts.LiveRunInvocationRequestSchema,
		"requestId":         "req-scripted-123",
		"instanceId":        "ceal",
		"timeoutMs":         30000,
		"captureTranscript": true,
		"consumerMetadata": map[string]any{
			"channelId": "C_REVIEW",
		},
		"scenario": map[string]any{
			"scenarioId":      "scenario-scripted",
			"name":            "Scripted live run",
			"description":     "Verify the promoted CLI can own a scripted multi-turn loop.",
			"maxTurns":        2,
			"sideEffectsMode": "read_only",
			"simulator": map[string]any{
				"kind": "scripted",
				"turns": []any{
					map[string]any{"text": "retro 먼저 해주세요"},
					map[string]any{"text": "이제 review로 돌아가죠"},
				},
			},
		},
	})

	stdout, stderr, exitCode := runCLI(
		t,
		root,
		"eval", "live", "run",
		"--repo-root",
		root,
		"--instance-id",
		"ceal",
		"--request-file",
		requestPath,
		"--output-file",
		outputPath,
	)
	if exitCode != 0 {
		t.Fatalf("eval live run failed: %s", stderr)
	}
	if strings.TrimSpace(stdout) != outputPath {
		t.Fatalf("expected stdout to point at result file, got %q", stdout)
	}
	result := readJSONObjectFile(t, outputPath)
	if result["executionStatus"] != "completed" || result["stopReason"] != "scripted_turns_exhausted" {
		t.Fatalf("unexpected scripted live result payload: %#v", result)
	}
	scenarioResult := result["scenarioResult"].(map[string]any)
	evaluation := scenarioResult["evaluation"].(map[string]any)
	if evaluation["summary"] != "evaluated 2 transcript turns" {
		t.Fatalf("expected evaluator summary in scenarioResult.evaluation, got %#v", evaluation)
	}
	if evaluation["schemaVersion"] != contracts.LiveRunEvaluatorResultSchema {
		t.Fatalf("expected evaluator result schema, got %#v", evaluation["schemaVersion"])
	}
	evaluatorInput := readJSONObjectFile(t, filepath.Join(outputPath+".d", "evaluator-input.json"))
	if evaluatorInput["schemaVersion"] != contracts.LiveRunEvaluatorInputSchema {
		t.Fatalf("expected evaluator input schema, got %#v", evaluatorInput["schemaVersion"])
	}
	if evaluatorInput["stopReason"] != "scripted_turns_exhausted" {
		t.Fatalf("expected evaluator input stop reason, got %#v", evaluatorInput["stopReason"])
	}
	workspaceDir := filepath.Join(outputPath+".d", "workspace")
	countBytes, err := os.ReadFile(filepath.Join(workspaceDir, "prepare-count.txt"))
	if err != nil {
		t.Fatalf("ReadFile returned error: %v", err)
	}
	if strings.TrimSpace(string(countBytes)) != "1" {
		t.Fatalf("expected prepare command to run once, got %q", string(countBytes))
	}
	logBytes, err := os.ReadFile(filepath.Join(workspaceDir, "turn-log.txt"))
	if err != nil {
		t.Fatalf("ReadFile returned error: %v", err)
	}
	lines := strings.Split(strings.TrimSpace(string(logBytes)), "\n")
	expectedLines := []string{
		fmt.Sprintf("1:%s", workspaceDir),
		fmt.Sprintf("2:%s", workspaceDir),
	}
	if len(lines) != len(expectedLines) {
		t.Fatalf("expected %d workspace log lines, got %#v", len(expectedLines), lines)
	}
	for index, line := range lines {
		if line != expectedLines[index] {
			t.Fatalf("unexpected workspace log line %d: got %q want %q", index, line, expectedLines[index])
		}
	}
}

func TestCLILiveEvalRunScenariosExecutesExplicitRequestBatch(t *testing.T) {
	root := t.TempDir()
	adapterDir := filepath.Join(root, ".agents")
	if err := os.MkdirAll(adapterDir, 0o755); err != nil {
		t.Fatalf("MkdirAll returned error: %v", err)
	}
	writeExecutableFile(t, root, "prepare-live-run.sh", strings.Join([]string{
		"#!/bin/sh",
		"workspace_dir=\"$1\"",
		"mkdir -p \"$workspace_dir\"",
		"printf 'prepared\\n' > \"$workspace_dir/prepared.txt\"",
		"",
	}, "\n"))
	writeExecutableFile(t, root, "run-live-turn.sh", strings.Join([]string{
		"#!/bin/sh",
		"turn_request_file=\"$1\"",
		"turn_result_file=\"$2\"",
		"workspace_dir=\"$3\"",
		"node - \"$turn_request_file\" \"$turn_result_file\" \"$workspace_dir\" <<'EOF'",
		"const [turnRequestFile, turnResultFile, workspaceDir] = process.argv.slice(2);",
		"const { existsSync, readFileSync, writeFileSync } = await import(\"node:fs\");",
		"if (!existsSync(`${workspaceDir}/prepared.txt`)) {",
		"  throw new Error(\"missing prepare marker\");",
		"}",
		"const turnRequest = JSON.parse(readFileSync(turnRequestFile, \"utf8\"));",
		"writeFileSync(turnResultFile, JSON.stringify({",
		`  schemaVersion: "cautilus.live_run_turn_result.v1",`,
		"  requestId: turnRequest.requestId,",
		"  instanceId: turnRequest.instanceId,",
		"  turnIndex: turnRequest.turnIndex,",
		`  executionStatus: "completed",`,
		`  summary: "batched synthetic turn completed",`,
		"  assistantTurn: {",
		"    text: `ack ${turnRequest.simulatorTurn.text}`",
		"  }",
		"}) + \"\\n\", \"utf8\");",
		"EOF",
		"",
	}, "\n"))
	adapter := strings.Join([]string{
		"version: 1",
		"repo: temp",
		"evaluation_surfaces:",
		"  - chatbot behavior",
		"baseline_options:",
		"  - baseline git ref via {baseline_ref}",
		"live_run_invocation:",
		"  command_template: cautilus eval live run --repo-root {repo_root} --adapter {adapter_path} --instance-id {instance_id} --request-file {request_file} --output-file {output_file}",
		"  consumer_single_turn_command_template: ./run-live-turn.sh {turn_request_file} {turn_result_file} {workspace_dir}",
		"  workspace_prepare_command_template: ./prepare-live-run.sh {workspace_dir}",
		"",
	}, "\n")
	if err := os.WriteFile(filepath.Join(adapterDir, "cautilus-adapter.yaml"), []byte(adapter), 0o644); err != nil {
		t.Fatalf("WriteFile returned error: %v", err)
	}
	prepareInputPath := filepath.Join(root, "prepare-input.json")
	requestBatchPath := filepath.Join(root, "request-batch.json")
	writeJSONFile(t, prepareInputPath, map[string]any{
		"schemaVersion":      contracts.LiveRunInvocationBatchPrepareInputSchema,
		"instanceId":         "ceal",
		"timeoutMs":          30000,
		"samplesPerScenario": 1,
		"captureTranscript":  true,
		"requestIdPrefix":    "held-out",
		"scenarioIds":        []any{"scenario-batch-1", "scenario-batch-2"},
		"scenarios": []any{
			map[string]any{
				"schemaVersion":   contracts.DraftScenarioSchema,
				"scenarioId":      "scenario-batch-1",
				"name":            "Batched live run one",
				"description":     "First batched scenario.",
				"brief":           "First batched scenario.",
				"maxTurns":        1,
				"sideEffectsMode": "read_only",
				"simulator": map[string]any{
					"kind":  "scripted",
					"turns": []any{map[string]any{"text": "첫 번째 turn"}},
				},
			},
			map[string]any{
				"schemaVersion":   contracts.DraftScenarioSchema,
				"scenarioId":      "scenario-batch-2",
				"name":            "Batched live run two",
				"description":     "Second batched scenario.",
				"brief":           "Second batched scenario.",
				"maxTurns":        1,
				"sideEffectsMode": "read_only",
				"simulator": map[string]any{
					"kind":  "scripted",
					"turns": []any{map[string]any{"text": "두 번째 turn"}},
				},
			},
		},
	})
	prepareStdout, prepareStderr, prepareExitCode := runCLI(
		t,
		root,
		"eval", "live", "prepare-request-batch",
		"--input",
		prepareInputPath,
		"--output",
		requestBatchPath,
	)
	if prepareExitCode != 0 {
		t.Fatalf("eval live prepare-request-batch failed: %s", prepareStderr)
	}
	if strings.TrimSpace(prepareStdout) != requestBatchPath {
		t.Fatalf("expected batch prepare stdout to point at request batch file, got %q", prepareStdout)
	}
	requestBatch := readJSONObjectFile(t, requestBatchPath)
	requests, ok := requestBatch["requests"].([]any)
	if !ok || len(requests) != 2 {
		t.Fatalf("expected two prepared live-run requests, got %#v", requestBatch["requests"])
	}
	if anyToString(requests[0].(map[string]any)["requestId"]) != "held-out--scenario-batch-1" {
		t.Fatalf("unexpected prepared request id: %#v", requests[0])
	}
	outputPath := filepath.Join(root, "artifacts", "batch-result.json")

	stdout, stderr, exitCode := runCLI(
		t,
		root,
		"eval", "live", "run-scenarios",
		"--repo-root",
		root,
		"--instance-id",
		"ceal",
		"--requests-file",
		requestBatchPath,
		"--output-file",
		outputPath,
		"--concurrency",
		"2",
	)
	if exitCode != 0 {
		t.Fatalf("eval live run-scenarios failed: %s", stderr)
	}
	if strings.TrimSpace(stdout) != outputPath {
		t.Fatalf("expected stdout to point at batch result file, got %q", stdout)
	}
	batchResult := readJSONObjectFile(t, outputPath)
	if batchResult["schemaVersion"] != contracts.LiveRunInvocationBatchResultSchema {
		t.Fatalf("unexpected batch result schema: %#v", batchResult["schemaVersion"])
	}
	counts := batchResult["counts"].(map[string]any)
	if intFromAny(counts["total"], 0) != 2 || intFromAny(counts["completed"], 0) != 2 {
		t.Fatalf("unexpected batch counts: %#v", counts)
	}
	attemptCounts := batchResult["attemptCounts"].(map[string]any)
	if intFromAny(attemptCounts["total"], 0) != 2 || intFromAny(attemptCounts["retriedRequests"], 0) != 0 {
		t.Fatalf("unexpected batch attempt counts: %#v", attemptCounts)
	}
	transientCounts := batchResult["transientClassCounts"].(map[string]any)
	if intFromAny(transientCounts["rate_limit"], -1) != 0 || intFromAny(transientCounts["transient_provider_failure"], -1) != 0 {
		t.Fatalf("unexpected transient class counts: %#v", transientCounts)
	}
	results, ok := batchResult["results"].([]any)
	if !ok || len(results) != 2 {
		t.Fatalf("expected two batched result entries, got %#v", batchResult["results"])
	}
	for index, raw := range results {
		entry := raw.(map[string]any)
		if !strings.HasPrefix(anyToString(entry["outputFile"]), outputPath+".d/runs/") || !strings.Contains(anyToString(entry["outputFile"]), "/attempt-01/") {
			t.Fatalf("expected nested per-request result file, got %#v", entry["outputFile"])
		}
		if intFromAny(entry["attemptCount"], 0) != 1 {
			t.Fatalf("expected one attempt for result %d, got %#v", index, entry["attemptCount"])
		}
		attempts, ok := entry["attempts"].([]any)
		if !ok || len(attempts) != 1 {
			t.Fatalf("expected one attempt entry for result %d, got %#v", index, entry["attempts"])
		}
		result := entry["result"].(map[string]any)
		if result["executionStatus"] != "completed" || result["stopReason"] != "scripted_turns_exhausted" {
			t.Fatalf("unexpected embedded live-run result %d: %#v", index, result)
		}
		workspaceDir := filepath.Join(anyToString(entry["outputFile"])+".d", "workspace")
		if _, err := os.Stat(filepath.Join(workspaceDir, "prepared.txt")); err != nil {
			t.Fatalf("expected prepared workspace marker for result %d: %v", index, err)
		}
	}
}

func TestCLILiveEvalPrepareRequestBatchAcceptsCatalogCandidates(t *testing.T) {
	root := t.TempDir()
	inputPath := filepath.Join(root, "catalog-input.json")
	outputPath := filepath.Join(root, "request-batch.json")
	writeJSONFile(t, inputPath, map[string]any{
		"schemaVersion":      contracts.LiveRunInvocationBatchPrepareCatalogInputSchema,
		"instanceId":         "ceal",
		"timeoutMs":          45000,
		"samplesPerScenario": 2,
		"requestIdPrefix":    "held-out",
		"captureTranscript":  true,
		"retryPolicy": map[string]any{
			"maxAttempts":    3,
			"retryOnClasses": []any{"rate_limit", "transient_provider_failure"},
		},
		"scenarioIds":  []any{"review-after-retro", "review-followup"},
		"requiredTags": []any{"chatbot", "held-out"},
		"scenarioCandidates": []any{
			map[string]any{
				"scenarioId":      "review-after-retro",
				"name":            "Review After Retro",
				"description":     "The operator pivots from retro back to review in one thread.",
				"maxTurns":        2,
				"sideEffectsMode": "read_only",
				"tags":            []any{"chatbot", "held-out"},
				"simulator": map[string]any{
					"kind":  "scripted",
					"turns": []any{map[string]any{"text": "retro 먼저 해주세요"}, map[string]any{"text": "이제 review로 돌아가죠"}},
				},
			},
			map[string]any{
				"scenarioId":      "review-followup",
				"name":            "Review Follow-up",
				"description":     "The operator asks one quick follow-up after the initial review turn.",
				"maxTurns":        2,
				"sideEffectsMode": "read_only",
				"tags":            []any{"chatbot", "held-out", "followup"},
				"simulator": map[string]any{
					"kind":  "scripted",
					"turns": []any{map[string]any{"text": "먼저 요약해 주세요"}, map[string]any{"text": "그 다음 우선순위도 말해 주세요"}},
				},
			},
			map[string]any{
				"scenarioId":      "operator-only-example",
				"name":            "Operator Only Example",
				"description":     "This candidate should be filtered out by required tags.",
				"maxTurns":        1,
				"sideEffectsMode": "read_only",
				"tags":            []any{"workflow"},
				"simulator": map[string]any{
					"kind":  "scripted",
					"turns": []any{map[string]any{"text": "이 후보는 제외됩니다."}},
				},
			},
		},
	})

	stdout, stderr, exitCode := runCLI(
		t,
		root,
		"eval", "live", "prepare-request-batch",
		"--input",
		inputPath,
		"--output",
		outputPath,
	)
	if exitCode != 0 {
		t.Fatalf("eval live prepare-request-batch failed: %s", stderr)
	}
	if strings.TrimSpace(stdout) != outputPath {
		t.Fatalf("expected stdout to point at request batch file, got %q", stdout)
	}
	requestBatch := readJSONObjectFile(t, outputPath)
	retryPolicy := requestBatch["retryPolicy"].(map[string]any)
	if intFromAny(retryPolicy["maxAttempts"], 0) != 3 {
		t.Fatalf("expected retry policy to survive batch prep, got %#v", retryPolicy)
	}
	requests, ok := requestBatch["requests"].([]any)
	if !ok || len(requests) != 4 {
		t.Fatalf("expected four prepared requests from two selected scenarios x two samples, got %#v", requestBatch["requests"])
	}
	first := requests[0].(map[string]any)
	last := requests[3].(map[string]any)
	if anyToString(first["requestId"]) != "held-out--review-after-retro--sample-01" {
		t.Fatalf("unexpected first prepared request id: %#v", first["requestId"])
	}
	if anyToString(mapOrEmpty(last["scenario"])["scenarioId"]) != "review-followup" {
		t.Fatalf("expected second selected candidate to survive filtering, got %#v", last)
	}
}

func TestCLILiveEvalRunScenariosRetriesTransientFailures(t *testing.T) {
	root := t.TempDir()
	adapterDir := filepath.Join(root, ".agents")
	if err := os.MkdirAll(adapterDir, 0o755); err != nil {
		t.Fatalf("MkdirAll returned error: %v", err)
	}
	writeExecutableFile(t, root, "run-live-direct.sh", strings.Join([]string{
		"#!/bin/sh",
		"request_file=\"$1\"",
		"output_file=\"$2\"",
		"repo_root=\"$3\"",
		"node - \"$request_file\" \"$output_file\" \"$repo_root\" <<'EOF'",
		"const [requestFile, outputFile, repoRoot] = process.argv.slice(2);",
		"const { mkdirSync, readFileSync, writeFileSync } = await import(\"node:fs\");",
		"const request = JSON.parse(readFileSync(requestFile, \"utf8\"));",
		"const counterDir = `${repoRoot}/attempt-counters`;",
		"mkdirSync(counterDir, { recursive: true });",
		"const counterFile = `${counterDir}/${request.requestId}.txt`;",
		"let attempt = 0;",
		"try {",
		"  attempt = Number(readFileSync(counterFile, \"utf8\"));",
		"} catch {}",
		"attempt += 1;",
		"writeFileSync(counterFile, String(attempt), \"utf8\");",
		"if (attempt === 1) {",
		"  writeFileSync(outputFile, JSON.stringify({",
		"    schemaVersion: \"cautilus.live_run_invocation_result.v1\",",
		"    requestId: request.requestId,",
		"    instanceId: request.instanceId,",
		"    executionStatus: \"blocked\",",
		"    summary: \"Provider asked the caller to retry after a brief cooldown.\",",
		"    stopReason: \"blocked_by_consumer\",",
		"    transientFailure: {",
		"      class: \"rate_limit\",",
		"      details: { provider: \"fixture\", retryAfterSeconds: 5 }",
		"    },",
		"    diagnostics: [",
		"      { code: \"provider_rate_limit\", severity: \"error\", message: \"429 retry-after 5\" }",
		"    ]",
		"  }) + \"\\n\", \"utf8\");",
		"  process.exit(0);",
		"}",
		"writeFileSync(outputFile, JSON.stringify({",
		"  schemaVersion: \"cautilus.live_run_invocation_result.v1\",",
		"  requestId: request.requestId,",
		"  instanceId: request.instanceId,",
		"  executionStatus: \"completed\",",
		"  summary: \"Completed after one retry.\",",
		"  stopReason: \"scripted_turns_exhausted\",",
		"  scenarioResult: {",
		"    scenarioId: request.scenario.scenarioId,",
		"    status: \"completed\",",
		"    summary: \"Completed after one retry.\"",
		"  }",
		"}) + \"\\n\", \"utf8\");",
		"EOF",
		"",
	}, "\n"))
	adapter := strings.Join([]string{
		"version: 1",
		"repo: temp",
		"evaluation_surfaces:",
		"  - chatbot behavior",
		"baseline_options:",
		"  - baseline git ref via {baseline_ref}",
		"live_run_invocation:",
		"  command_template: ./run-live-direct.sh {request_file} {output_file} {repo_root}",
		"  consumer_command_template: ./run-live-direct.sh {request_file} {output_file} {repo_root}",
		"",
	}, "\n")
	if err := os.WriteFile(filepath.Join(adapterDir, "cautilus-adapter.yaml"), []byte(adapter), 0o644); err != nil {
		t.Fatalf("WriteFile returned error: %v", err)
	}
	requestBatchPath := filepath.Join(root, "request-batch.json")
	writeJSONFile(t, requestBatchPath, map[string]any{
		"schemaVersion": contracts.LiveRunInvocationBatchRequestSchema,
		"instanceId":    "ceal",
		"retryPolicy": map[string]any{
			"maxAttempts":    2,
			"retryOnClasses": []any{"rate_limit"},
		},
		"requests": []any{
			map[string]any{
				"schemaVersion": contracts.LiveRunInvocationRequestSchema,
				"requestId":     "retry-on-rate-limit",
				"instanceId":    "ceal",
				"timeoutMs":     30000,
				"scenario": map[string]any{
					"scenarioId":      "scenario-retry",
					"name":            "Retry on rate limit",
					"description":     "The product should retry when the consumer returns a transient rate limit classification.",
					"maxTurns":        1,
					"sideEffectsMode": "read_only",
					"simulator": map[string]any{
						"kind":  "scripted",
						"turns": []any{map[string]any{"text": "첫 시도 후 재시도해 주세요"}},
					},
				},
			},
		},
	})
	outputPath := filepath.Join(root, "artifacts", "batch-result.json")
	stdout, stderr, exitCode := runCLI(
		t,
		root,
		"eval", "live", "run-scenarios",
		"--repo-root",
		root,
		"--instance-id",
		"ceal",
		"--requests-file",
		requestBatchPath,
		"--output-file",
		outputPath,
	)
	if exitCode != 0 {
		t.Fatalf("eval live run-scenarios failed: %s", stderr)
	}
	if strings.TrimSpace(stdout) != outputPath {
		t.Fatalf("expected stdout to point at batch result file, got %q", stdout)
	}
	batchResult := readJSONObjectFile(t, outputPath)
	counts := batchResult["counts"].(map[string]any)
	if intFromAny(counts["completed"], 0) != 1 || intFromAny(counts["failed"], 0) != 0 {
		t.Fatalf("unexpected final outcome counts: %#v", counts)
	}
	attemptCounts := batchResult["attemptCounts"].(map[string]any)
	if intFromAny(attemptCounts["total"], 0) != 2 || intFromAny(attemptCounts["retriedRequests"], 0) != 1 {
		t.Fatalf("unexpected retry attempt counts: %#v", attemptCounts)
	}
	transientCounts := batchResult["transientClassCounts"].(map[string]any)
	if intFromAny(transientCounts["rate_limit"], 0) != 1 || intFromAny(transientCounts["transient_provider_failure"], 0) != 0 {
		t.Fatalf("unexpected transient class counts: %#v", transientCounts)
	}
	results := batchResult["results"].([]any)
	entry := results[0].(map[string]any)
	if intFromAny(entry["attemptCount"], 0) != 2 {
		t.Fatalf("expected two attempts, got %#v", entry["attemptCount"])
	}
	attempts := entry["attempts"].([]any)
	firstAttempt := attempts[0].(map[string]any)
	secondAttempt := attempts[1].(map[string]any)
	if !strings.Contains(anyToString(firstAttempt["outputFile"]), "/attempt-01/") || !strings.Contains(anyToString(secondAttempt["outputFile"]), "/attempt-02/") {
		t.Fatalf("expected attempt-scoped artifact paths, got %#v", entry["attempts"])
	}
	firstResult := firstAttempt["result"].(map[string]any)
	if anyToString(mapOrEmpty(firstResult["transientFailure"])["class"]) != "rate_limit" {
		t.Fatalf("expected first attempt to retain transient classification, got %#v", firstResult)
	}
	finalResult := entry["result"].(map[string]any)
	if finalResult["executionStatus"] != "completed" || anyToString(finalResult["summary"]) != "Completed after one retry." {
		t.Fatalf("unexpected final retried result: %#v", finalResult)
	}
}

func TestCLILiveEvalRunLiveCanExecutePersonaPromptLoop(t *testing.T) {
	root := t.TempDir()
	adapterDir := filepath.Join(root, ".agents")
	if err := os.MkdirAll(adapterDir, 0o755); err != nil {
		t.Fatalf("MkdirAll returned error: %v", err)
	}
	fixtureFile := filepath.Join(root, "persona-fixture.json")
	cautilusBin := filepath.Join(repoToolRoot(t), "bin", "cautilus")
	writeJSONFile(t, fixtureFile, map[string]any{
		"responses": []any{
			map[string]any{
				"action":       "continue",
				"summary":      "The synthetic user still needs the repo name.",
				"nextTurnText": "대상 repo는 cautilus입니다.",
			},
			map[string]any{
				"action":     "stop",
				"stopReason": "goal_satisfied",
				"summary":    "The synthetic user has enough context to stop.",
			},
		},
	})
	writeExecutableFile(t, root, "run-live-turn.sh", strings.Join([]string{
		"#!/bin/sh",
		"turn_request_file=\"$1\"",
		"turn_result_file=\"$2\"",
		"node - \"$turn_request_file\" \"$turn_result_file\" <<'EOF'",
		"const [turnRequestFile, turnResultFile] = process.argv.slice(2);",
		"const { readFileSync, writeFileSync } = await import(\"node:fs\");",
		"const turnRequest = JSON.parse(readFileSync(turnRequestFile, \"utf8\"));",
		"writeFileSync(turnResultFile, JSON.stringify({",
		`  schemaVersion: "cautilus.live_run_turn_result.v1",`,
		"  requestId: turnRequest.requestId,",
		"  instanceId: turnRequest.instanceId,",
		"  turnIndex: turnRequest.turnIndex,",
		`  executionStatus: "completed",`,
		`  summary: "synthetic persona turn completed",`,
		"  assistantTurn: {",
		`    text: turnRequest.turnIndex === 1 ? "대상 repo를 알려주시면 바로 보겠습니다." : "좋습니다. 바로 검토하겠습니다."`,
		"  }",
		"}) + \"\\n\", \"utf8\");",
		"EOF",
		"",
	}, "\n"))
	adapter := strings.Join([]string{
		"version: 1",
		"repo: temp",
		"evaluation_surfaces:",
		"  - chatbot behavior",
		"baseline_options:",
		"  - baseline git ref via {baseline_ref}",
		"live_run_invocation:",
		"  command_template: cautilus eval live run --repo-root {repo_root} --adapter {adapter_path} --instance-id {instance_id} --request-file {request_file} --output-file {output_file}",
		"  consumer_single_turn_command_template: ./run-live-turn.sh {turn_request_file} {turn_result_file}",
		fmt.Sprintf("  simulator_persona_command_template: %s eval live run-simulator-persona --workspace {repo_root} --simulator-request-file {simulator_request_file} --simulator-result-file {simulator_result_file} --backend fixture --fixture-results-file %s", cautilusBin, fixtureFile),
		"",
	}, "\n")
	if err := os.WriteFile(filepath.Join(adapterDir, "cautilus-adapter.yaml"), []byte(adapter), 0o644); err != nil {
		t.Fatalf("WriteFile returned error: %v", err)
	}
	requestPath := filepath.Join(root, "request.json")
	outputPath := filepath.Join(root, "artifacts", "persona-result.json")
	writeJSONFile(t, requestPath, map[string]any{
		"schemaVersion":     contracts.LiveRunInvocationRequestSchema,
		"requestId":         "req-persona-123",
		"instanceId":        "ceal",
		"timeoutMs":         30000,
		"captureTranscript": true,
		"scenario": map[string]any{
			"scenarioId":      "scenario-persona",
			"name":            "Persona live run",
			"description":     "Verify the promoted CLI can own a persona-driven multi-turn loop.",
			"maxTurns":        3,
			"sideEffectsMode": "read_only",
			"simulator": map[string]any{
				"kind":         "persona_prompt",
				"instructions": "Act like a pragmatic operator. Stop once you have enough context to let the assistant proceed.",
			},
		},
	})

	stdout, stderr, exitCode := runCLI(
		t,
		root,
		"eval", "live", "run",
		"--repo-root",
		root,
		"--instance-id",
		"ceal",
		"--request-file",
		requestPath,
		"--output-file",
		outputPath,
	)
	if exitCode != 0 {
		t.Fatalf("eval live run failed: %s", stderr)
	}
	if strings.TrimSpace(stdout) != outputPath {
		t.Fatalf("expected stdout to point at result file, got %q", stdout)
	}
	result := readJSONObjectFile(t, outputPath)
	if result["executionStatus"] != "completed" || result["stopReason"] != "goal_satisfied" {
		t.Fatalf("unexpected persona live result payload: %#v", result)
	}
	transcript, ok := result["transcript"].([]any)
	if !ok || len(transcript) != 1 {
		t.Fatalf("expected one transcript entry before persona stop, got %#v", result["transcript"])
	}
}

func TestCLILiveEvalRunSimulatorPersonaCanContinueFromFixture(t *testing.T) {
	root := t.TempDir()
	fixtureFile := filepath.Join(root, "persona-fixture.json")
	requestPath := filepath.Join(root, "simulator-request.json")
	outputPath := filepath.Join(root, "artifacts", "simulator-result.json")
	writeJSONFile(t, fixtureFile, map[string]any{
		"responses": []any{
			map[string]any{
				"action":       "continue",
				"summary":      "The synthetic user still needs the repo name.",
				"nextTurnText": "대상 repo는 cautilus입니다.",
			},
		},
	})
	writeJSONFile(t, requestPath, map[string]any{
		"schemaVersion": contracts.LiveRunSimulatorRequestSchema,
		"requestId":     "req-persona-continue",
		"instanceId":    "ceal",
		"scenarioId":    "scenario-persona",
		"turnIndex":     1,
		"maxTurns":      3,
		"instructions":  "Act like a pragmatic operator. Stop once enough context is collected.",
		"transcript":    []any{},
	})

	stdout, stderr, exitCode := runCLI(
		t,
		root,
		"eval", "live", "run-simulator-persona",
		"--workspace",
		root,
		"--simulator-request-file",
		requestPath,
		"--simulator-result-file",
		outputPath,
		"--backend",
		"fixture",
		"--fixture-results-file",
		fixtureFile,
	)
	if exitCode != 0 {
		t.Fatalf("eval live run-simulator-persona failed: %s", stderr)
	}
	if strings.TrimSpace(stdout) != outputPath {
		t.Fatalf("expected stdout to point at result file, got %q", stdout)
	}
	result := readJSONObjectFile(t, outputPath)
	if result["executionStatus"] != "completed" || result["action"] != "continue" {
		t.Fatalf("unexpected simulator result payload: %#v", result)
	}
	if mapOrEmpty(result["simulatorTurn"])["text"] != "대상 repo는 cautilus입니다." {
		t.Fatalf("unexpected simulator turn payload: %#v", result["simulatorTurn"])
	}
}

func TestCLILiveEvalRunSimulatorPersonaCanStopFromFixture(t *testing.T) {
	root := t.TempDir()
	fixtureFile := filepath.Join(root, "persona-fixture.json")
	requestPath := filepath.Join(root, "simulator-request.json")
	outputPath := filepath.Join(root, "artifacts", "simulator-result.json")
	writeJSONFile(t, fixtureFile, map[string]any{
		"responses": []any{
			map[string]any{
				"action":       "continue",
				"summary":      "The synthetic user still needs the repo name.",
				"nextTurnText": "대상 repo는 cautilus입니다.",
			},
			map[string]any{
				"action":     "stop",
				"stopReason": "goal_satisfied",
				"summary":    "The synthetic user has enough context to stop.",
			},
		},
	})
	writeJSONFile(t, requestPath, map[string]any{
		"schemaVersion": contracts.LiveRunSimulatorRequestSchema,
		"requestId":     "req-persona-stop",
		"instanceId":    "ceal",
		"scenarioId":    "scenario-persona",
		"turnIndex":     2,
		"maxTurns":      3,
		"instructions":  "Act like a pragmatic operator. Stop once enough context is collected.",
		"transcript": []any{
			map[string]any{
				"turnIndex":     1,
				"simulatorTurn": map[string]any{"text": "대상 repo는 cautilus입니다."},
				"assistantTurn": map[string]any{"text": "좋습니다. 바로 검토하겠습니다."},
			},
		},
	})

	stdout, stderr, exitCode := runCLI(
		t,
		root,
		"eval", "live", "run-simulator-persona",
		"--workspace",
		root,
		"--simulator-request-file",
		requestPath,
		"--simulator-result-file",
		outputPath,
		"--backend",
		"fixture",
		"--fixture-results-file",
		fixtureFile,
	)
	if exitCode != 0 {
		t.Fatalf("eval live run-simulator-persona failed: %s", stderr)
	}
	if strings.TrimSpace(stdout) != outputPath {
		t.Fatalf("expected stdout to point at result file, got %q", stdout)
	}
	result := readJSONObjectFile(t, outputPath)
	if result["executionStatus"] != "completed" || result["action"] != "stop" || result["stopReason"] != "goal_satisfied" {
		t.Fatalf("unexpected simulator stop payload: %#v", result)
	}
}

func TestCLIExampleInputEmitsPacketsThatRoundTripThroughTheSameCommand(t *testing.T) {
	cases := []struct {
		name           string
		args           []string
		expectedSchema string
	}{
		{"chatbot", []string{"scenario", "normalize", "chatbot"}, contracts.ChatbotNormalizationInputsSchema},
		{"skill", []string{"scenario", "normalize", "skill"}, contracts.SkillNormalizationInputsSchema},
		{"workflow", []string{"scenario", "normalize", "workflow"}, contracts.WorkflowNormalizationInputsSchema},
		{"scenario-review-conversations", []string{"scenario", "review-conversations"}, contracts.ScenarioConversationReviewInputsSchema},
		{"eval-evaluate", []string{"eval", "evaluate"}, contracts.EvaluationObservedSchema},
		{"report-build", []string{"report", "build"}, contracts.ReportInputsSchema},
	}

	for _, tc := range cases {
		t.Run(tc.name, func(t *testing.T) {
			root := t.TempDir()
			stdout, stderr, exitCode := runCLI(t, root, append(tc.args, "--example-input")...)
			if exitCode != 0 {
				t.Fatalf("--example-input failed: %s", stderr)
			}
			var emitted map[string]any
			if err := json.Unmarshal([]byte(stdout), &emitted); err != nil {
				t.Fatalf("--example-input produced non-JSON: %v\n%s", err, stdout)
			}
			if emitted["schemaVersion"] != tc.expectedSchema {
				t.Fatalf("unexpected schemaVersion: got %v, want %s", emitted["schemaVersion"], tc.expectedSchema)
			}

			inputPath := filepath.Join(root, "example.json")
			if err := os.WriteFile(inputPath, []byte(stdout), 0o644); err != nil {
				t.Fatalf("WriteFile returned error: %v", err)
			}
			_, stderr, exitCode = runCLI(t, root, append(tc.args, "--input", inputPath)...)
			if exitCode != 0 {
				t.Fatalf("--example-input output did not round-trip through --input: %s", stderr)
			}
		})
	}
}

func TestCLIReportBuildHumanReviewFindingErrorsIncludeMinimumShape(t *testing.T) {
	root := t.TempDir()
	inputPath := filepath.Join(root, "report-input.json")
	if err := os.WriteFile(inputPath, mustJSONMarshal(t, map[string]any{
		"schemaVersion": "cautilus.report_inputs.v1",
		"candidate":     "feature/recovery-guidance",
		"baseline":      "origin/main",
		"intent":        "The operator should understand the next safe recovery step without guesswork.",
		"commands": []any{
			map[string]any{
				"mode":    "held_out",
				"command": "cautilus doctor --repo-root /tmp/repo",
			},
		},
		"modeRuns": []any{
			map[string]any{
				"mode":   "held_out",
				"status": "passed",
			},
		},
		"humanReviewFindings": []any{
			map[string]any{
				"message": "Missing severity on purpose.",
			},
		},
		"recommendation": "defer",
	}), 0o644); err != nil {
		t.Fatalf("WriteFile returned error: %v", err)
	}

	_, stderr, exitCode := runCLI(t, root, "report", "build", "--input", inputPath)
	if exitCode == 0 {
		t.Fatalf("report build unexpectedly succeeded")
	}
	if !strings.Contains(stderr, "humanReviewFindings[0].severity") {
		t.Fatalf("stderr did not mention the missing severity: %s", stderr)
	}
	if !strings.Contains(stderr, "minimum shape:") {
		t.Fatalf("stderr did not include the minimum shape hint: %s", stderr)
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
