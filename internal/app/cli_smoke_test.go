package app

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"os"
	"os/exec"
	"path/filepath"
	"slices"
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
	nextSteps, ok := payload["next_steps"].([]any)
	if !ok || len(nextSteps) == 0 {
		t.Fatalf("expected next_steps hint on ready payload, got %#v", payload["next_steps"])
	}
	if !strings.Contains(anyToString(nextSteps[0]), "cautilus scenarios") {
		t.Fatalf("expected next_steps to mention `cautilus scenarios`, got %#v", nextSteps)
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
	suggestions, ok := payload["suggestions"].([]any)
	if !ok || len(suggestions) == 0 || !strings.Contains(anyToString(suggestions[0]), "adapter init") {
		t.Fatalf("expected adapter init suggestion, got %#v", payload["suggestions"])
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

func TestCLIStandaloneTempRepoCanAdoptCautilusWithoutHostSpecificPaths(t *testing.T) {
	root := t.TempDir()
	initGitRepo(t, root)
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

	_, stderr, exitCode = runCLI(t, root, "skills", "install")
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
		"full_gate_command_templates:",
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
	if _, err := os.Stat(filepath.Join(root, ".agents", "skills", "cautilus", "SKILL.md")); err != nil {
		t.Fatalf("expected installed skill: %v", err)
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

func TestCLIUpdateRefreshesStandaloneInstallAndRepoSkill(t *testing.T) {
	root := t.TempDir()
	t.Setenv("CAUTILUS_VERSION", "v1.2.3")

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
		return cli.ReleaseInstallResult{
			Version:     "1.2.4",
			WrapperPath: filepath.Join(root, ".local", "bin", "cautilus"),
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
	if installResult["wrapperPath"] != filepath.Join(root, ".local", "bin", "cautilus") {
		t.Fatalf("unexpected wrapperPath: %#v", installResult["wrapperPath"])
	}
	if _, err := os.Stat(filepath.Join(root, ".agents", "skills", "cautilus", "SKILL.md")); err != nil {
		t.Fatalf("expected refreshed skill: %v", err)
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
      "scenarioId": "operator-guidance-smoke",
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
    "summary": "Operator guidance stayed explicit.",
    "verdict": "improved",
    "improved": [
      "operator-guidance-smoke"
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
		"  - operator workflow",
		"baseline_options:",
		"  - baseline git ref via {baseline_ref}",
		"held_out_command_templates:",
		"  - sh {candidate_repo}/bench.sh {scenario_results_file}",
		"",
	}, "\n")), 0o644); err != nil {
		t.Fatalf("WriteFile returned error: %v", err)
	}
	outputDir := filepath.Join(root, "outputs")
	stdout, stderr, exitCode := runCLI(t, root, "mode", "evaluate", "--repo-root", root, "--candidate-repo", workspace, "--mode", "held_out", "--intent", "Operator-facing behavior should remain legible.", "--baseline-ref", "origin/main", "--output-dir", outputDir)
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

func TestCLIReviewBuildPromptInputAndRenderPromptCloseMetaPromptSeam(t *testing.T) {
	root := t.TempDir()
	reviewPacketPath := filepath.Join(root, "review-packet.json")
	promptPath := filepath.Join(root, "review.prompt.md")
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
				"status":       "failed",
				"overallScore": 40,
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

	_, stderr, exitCode = runCLI(t, root, "optimize", "search", "run", "--input", searchInputPath, "--output", searchResultPath)
	if exitCode != 0 {
		t.Fatalf("optimize search run failed: %s", stderr)
	}
	searchResult := readJSONObjectFile(t, searchResultPath)
	if searchResult["schemaVersion"] != contracts.OptimizeSearchResultSchema || searchResult["status"] != "completed" {
		t.Fatalf("unexpected search result: %#v", searchResult)
	}
	if searchResult["selectedCandidateId"] != "seed" {
		t.Fatalf("unexpected selected candidate: %#v", searchResult["selectedCandidateId"])
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

func TestCLIOptimizeSearchRunGeneratesAndSelectsReflectiveMutationCandidate(t *testing.T) {
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
	if err := os.WriteFile(targetPath, []byte("Keep recovery instructions explicit.\n"), 0o644); err != nil {
		t.Fatalf("WriteFile returned error: %v", err)
	}
	writeExecutableFile(t, root, "evaluate.sh", `#!/bin/sh
output="$1"
score=40
status="failed"
if grep -q "detailed recovery checklist" prompt.md; then
  score=95
  status="passed"
fi
cat >"$output" <<EOF
{
  "schemaVersion": "cautilus.scenario_results.v1",
  "mode": "held_out",
  "results": [
    {
      "scenarioId": "operator-recovery",
      "status": "$status",
      "overallScore": $score,
      "telemetry": {
        "cost_usd": 0.05,
        "durationMs": 1300
      }
    }
  ]
}
EOF
`)
	writeExecutableFile(t, root, "codex", fmt.Sprintf(`#!/bin/sh
out=""
while [ "$#" -gt 0 ]; do
  if [ "$1" = "-o" ]; then
    out="$2"
    shift 2
    continue
  fi
  shift
done
cat >/dev/null
printf '%%s\n' '%s' > "$out"
`, toJSONString(map[string]any{
		"promptMarkdown":       "Keep recovery instructions explicit with a detailed recovery checklist.\n",
		"rationaleSummary":     "Expand the recovery instructions with a concrete next-step checklist.",
		"expectedImprovements": []string{"operator-recovery"},
		"preservedStrengths":   []string{"keeps the original recovery framing"},
		"riskNotes":            []string{"held-out still needs to confirm the extra detail is not too verbose"},
	})))
	if err := os.WriteFile(filepath.Join(root, ".agents", "cautilus-adapter.yaml"), []byte(strings.Join([]string{
		"version: 1",
		"repo: temp-optimize-search",
		"evaluation_surfaces:",
		"  - prompt behavior",
		"baseline_options:",
		"  - baseline git ref in the same repo via {baseline_ref}",
		"required_prerequisites: []",
		"held_out_command_templates:",
		"  - sh evaluate.sh {scenario_results_file}",
		"comparison_questions:",
		"  - Did the held-out score improve?",
		"human_review_prompts:",
		"  - id: operator",
		"    prompt: Where would the prompt still leave the operator stuck?",
		"",
	}, "\n")), 0o644); err != nil {
		t.Fatalf("WriteFile returned error: %v", err)
	}
	writeJSONFile(t, heldOutResultsPath, map[string]any{
		"schemaVersion": contracts.ScenarioResultsSchema,
		"mode":          "held_out",
		"results": []map[string]any{
			{
				"scenarioId":   "operator-recovery",
				"status":       "failed",
				"overallScore": 40,
				"telemetry": map[string]any{
					"cost_usd":   0.02,
					"durationMs": 1200,
				},
			},
		},
	})
	writeJSONFile(t, optimizeInputPath, map[string]any{
		"schemaVersion":      contracts.OptimizeInputsSchema,
		"generatedAt":        "2026-04-13T09:58:00.000Z",
		"repoRoot":           root,
		"optimizationTarget": "prompt",
		"intentProfile": map[string]any{
			"schemaVersion":   contracts.BehaviorIntentSchema,
			"intentId":        "intent-operator-recovery-guidance",
			"summary":         "Operator guidance should stay legible under recovery pressure.",
			"behaviorSurface": cautilusruntime.BehaviorSurfaces["OPERATOR_BEHAVIOR"],
		},
		"optimizer": map[string]any{
			"kind":   "reflection",
			"budget": "light",
			"plan": map[string]any{
				"evidenceLimit":        3,
				"suggestedChangeLimit": 2,
				"reviewVariantLimit":   1,
				"historySignalLimit":   1,
			},
		},
		"targetFile": map[string]any{
			"path":   targetPath,
			"exists": true,
		},
		"reportFile": filepath.Join(root, "report.json"),
		"report": map[string]any{
			"schemaVersion": contracts.ReportPacketSchema,
			"generatedAt":   "2026-04-13T09:57:00.000Z",
			"candidate":     root,
			"baseline":      "HEAD",
			"intent":        "Operator guidance should stay legible under recovery pressure.",
			"intentProfile": map[string]any{
				"schemaVersion":   contracts.BehaviorIntentSchema,
				"intentId":        "intent-operator-recovery-guidance",
				"summary":         "Operator guidance should stay legible under recovery pressure.",
				"behaviorSurface": cautilusruntime.BehaviorSurfaces["OPERATOR_BEHAVIOR"],
			},
			"commands":            []any{},
			"commandObservations": []any{},
			"modesRun":            []any{},
			"modeSummaries":       []any{},
			"telemetry": map[string]any{
				"modeCount": 0,
			},
			"improved": []any{},
			"regressed": []any{
				"operator-recovery",
			},
			"unchanged": []any{},
			"noisy":     []any{},
			"humanReviewFindings": []any{
				map[string]any{
					"severity": "concern",
					"message":  "operator-recovery still needs a detailed recovery checklist",
				},
			},
			"recommendation": "defer",
		},
		"reviewSummaryFile": filepath.Join(root, "review-summary.json"),
		"reviewSummary": map[string]any{
			"variants": []any{},
		},
		"scenarioHistoryFile": filepath.Join(root, "history.json"),
		"scenarioHistory": map[string]any{
			"schemaVersion": contracts.ScenarioHistorySchema,
			"scenarioStats": map[string]any{
				"operator-recovery": map[string]any{
					"recentTrainResults": []any{
						map[string]any{
							"status":       "failed",
							"overallScore": 80,
							"passRate":     0,
						},
					},
				},
			},
		},
		"objective": map[string]any{
			"summary":     "Propose one bounded next revision without weakening held-out, comparison, or review discipline.",
			"constraints": []any{"Prefer repairing explicit regressions over widening scope."},
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
	_, stderr, exitCode = runCLI(t, root, "optimize", "search", "run", "--input", searchInputPath, "--output", searchResultPath)
	if exitCode != 0 {
		t.Fatalf("optimize search run failed: %s", stderr)
	}
	searchResult := readJSONObjectFile(t, searchResultPath)
	if searchResult["status"] != "completed" {
		t.Fatalf("unexpected search result status: %#v", searchResult)
	}
	if searchResult["selectedCandidateId"] == "seed" {
		t.Fatalf("expected reflective mutation candidate, got %#v", searchResult["selectedCandidateId"])
	}
	searchTelemetry := searchResult["searchTelemetry"].(map[string]any)
	if searchTelemetry["generationCount"] != float64(1) {
		t.Fatalf("unexpected generation count: %#v", searchTelemetry)
	}
	proposalBridge := searchResult["proposalBridge"].(map[string]any)
	selectedTargetFile := proposalBridge["selectedTargetFile"].(map[string]any)["path"].(string)
	payload, err := os.ReadFile(selectedTargetFile)
	if err != nil {
		t.Fatalf("ReadFile returned error: %v", err)
	}
	if !strings.Contains(string(payload), "detailed recovery checklist") {
		t.Fatalf("expected selected candidate prompt to include checklist, got %q", string(payload))
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
				"targetKind":  "profile",
				"targetId":    "engineering-quality",
				"displayName": "Engineering Quality",
				"surface":     "bootstrap",
				"startedAt":   "2026-04-11T00:05:00.000Z",
				"status":      "degraded",
				"summary":     "Profile bootstrap passed structurally but no longer keeps the expected quality gate command surface.",
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

func TestCLIScenarioNormalizeSkillRejectsWorkflowInputs(t *testing.T) {
	root := t.TempDir()
	inputPath := filepath.Join(root, "workflow-input.json")
	writeJSONFile(t, inputPath, map[string]any{
		"schemaVersion": contracts.WorkflowNormalizationInputsSchema,
		"evaluationRuns": []map[string]any{
			{
				"targetKind": "cli_workflow",
				"targetId":   "scan-settings-seed",
				"surface":    "replay_seed",
				"startedAt":  "2026-04-11T01:00:00.000Z",
				"status":     "blocked",
				"summary":    "Replay seed stalled.",
			},
		},
	})

	_, stderr, exitCode := runCLI(t, root, "scenario", "normalize", "skill", "--input", inputPath)
	if exitCode == 0 {
		t.Fatalf("expected non-zero exit for workflow input, got 0")
	}
	if !strings.Contains(stderr, "scenario normalize workflow") {
		t.Fatalf("expected stderr to mention workflow command, got: %s", stderr)
	}
}

func TestCLIScenarioNormalizeWorkflowProducesOperatorRecoveryCandidate(t *testing.T) {
	root := t.TempDir()
	inputPath := filepath.Join(root, "workflow-input.json")
	candidatesPath := filepath.Join(root, "workflow-candidates.json")
	writeJSONFile(t, inputPath, map[string]any{
		"schemaVersion": contracts.WorkflowNormalizationInputsSchema,
		"evaluationRuns": []map[string]any{
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

	_, stderr, exitCode := runCLI(t, root, "scenario", "normalize", "workflow", "--input", inputPath, "--output", candidatesPath)
	if exitCode != 0 {
		t.Fatalf("scenario normalize workflow failed: %s", stderr)
	}
	candidates := readJSONArrayFile(t, candidatesPath)
	if len(candidates) != 1 {
		t.Fatalf("unexpected workflow candidates: %#v", candidates)
	}
	candidate := candidates[0].(map[string]any)
	if candidate["intentProfile"].(map[string]any)["behaviorSurface"] != "operator_workflow_recovery" {
		t.Fatalf("expected operator_workflow_recovery surface, got: %#v", candidate["intentProfile"])
	}
	tags, ok := candidate["tags"].([]any)
	if !ok {
		t.Fatalf("expected tags array, got: %#v", candidate["tags"])
	}
	foundRecovery := false
	for _, rawTag := range tags {
		if rawTag == "operator-recovery" {
			foundRecovery = true
		}
	}
	if !foundRecovery {
		t.Fatalf("expected operator-recovery tag, got: %#v", tags)
	}
}

func TestCLISkillEvaluateProducesSummaryThatChainsIntoScenarioNormalizeSkill(t *testing.T) {
	root := t.TempDir()
	inputPath := filepath.Join(root, "skill-evaluation-input.json")
	summaryPath := filepath.Join(root, "skill-evaluation-summary.json")
	candidatesPath := filepath.Join(root, "skill-candidates.json")

	writeJSONFile(t, inputPath, map[string]any{
		"schemaVersion": contracts.SkillEvaluationInputsSchema,
		"skillId":       "impl",
		"evaluations": []map[string]any{
			{
				"evaluationId":    "trigger-impl",
				"targetKind":      "public_skill",
				"targetId":        "impl",
				"displayName":     "impl",
				"evaluationKind":  "trigger",
				"prompt":          "Please implement a bounded repo-local quality slice.",
				"startedAt":       "2026-04-14T00:00:00.000Z",
				"expectedTrigger": "must_invoke",
				"invoked":         false,
				"summary":         "The prompt clearly matched the impl skill surface.",
			},
			{
				"evaluationId":   "execution-impl",
				"targetKind":     "public_skill",
				"targetId":       "impl",
				"displayName":    "impl",
				"evaluationKind": "execution",
				"prompt":         "Apply the bounded change and verify it.",
				"startedAt":      "2026-04-14T00:05:00.000Z",
				"invoked":        true,
				"outcome":        "passed",
				"summary":        "The skill completed the task but ran over the intended budget.",
				"metrics": map[string]any{
					"total_tokens": 1400,
					"duration_ms":  4200,
				},
				"thresholds": map[string]any{
					"max_total_tokens": 1000,
					"max_duration_ms":  3000,
				},
			},
		},
	})

	_, stderr, exitCode := runCLI(t, root, "skill", "evaluate", "--input", inputPath, "--output", summaryPath)
	if exitCode != 0 {
		t.Fatalf("skill evaluate failed: %s", stderr)
	}
	summary := readJSONObjectFile(t, summaryPath)
	if summary["schemaVersion"] != contracts.SkillEvaluationSummarySchema || summary["recommendation"] != "reject" {
		t.Fatalf("unexpected skill evaluation summary: %#v", summary)
	}
	runs := summary["evaluationRuns"].([]any)
	if len(runs) != 2 {
		t.Fatalf("unexpected evaluation runs: %#v", runs)
	}

	_, stderr, exitCode = runCLI(t, root, "scenario", "normalize", "skill", "--input", summaryPath, "--output", candidatesPath)
	if exitCode != 0 {
		t.Fatalf("scenario normalize skill from summary failed: %s", stderr)
	}
	candidates := readJSONArrayFile(t, candidatesPath)
	if len(candidates) != 2 {
		t.Fatalf("unexpected candidates: %#v", candidates)
	}
	keys := []string{
		candidates[0].(map[string]any)["proposalKey"].(string),
		candidates[1].(map[string]any)["proposalKey"].(string),
	}
	slices.Sort(keys)
	if !slices.Equal(keys, []string{
		"public-skill-impl-execution-quality-regression",
		"public-skill-impl-trigger-selection-regression",
	}) {
		t.Fatalf("unexpected proposal keys: %#v", keys)
	}
}

func TestCLISkillTestRunsAdapterCommandsAndWritesSummaryAndCandidates(t *testing.T) {
	root := t.TempDir()
	adapterDir := filepath.Join(root, ".agents")
	fixtureDir := filepath.Join(root, "fixtures", "skill-test")
	outputDir := filepath.Join(root, "outputs")
	if err := os.MkdirAll(adapterDir, 0o755); err != nil {
		t.Fatalf("MkdirAll returned error: %v", err)
	}
	if err := os.MkdirAll(fixtureDir, 0o755); err != nil {
		t.Fatalf("MkdirAll returned error: %v", err)
	}
	scriptPath := filepath.Join(root, "skill-test.sh")
	script := `#!/bin/sh
cat <<'JSON' > "$1"
{
  "schemaVersion": "cautilus.skill_evaluation_inputs.v1",
  "skillId": "cautilus",
  "skillDisplayName": "cautilus",
  "evaluations": [
    {
      "evaluationId": "trigger-cautilus-test-request",
      "targetKind": "public_skill",
      "targetId": "cautilus",
      "displayName": "cautilus",
      "evaluationKind": "trigger",
      "prompt": "Use $cautilus to test the local impl skill.",
      "startedAt": "2026-04-14T00:00:00.000Z",
      "expectedTrigger": "must_invoke",
      "invoked": true,
      "summary": "The prompt explicitly called for the cautilus skill and the agent used it."
    },
    {
      "evaluationId": "execution-cautilus-test-request",
      "targetKind": "public_skill",
      "targetId": "cautilus",
      "displayName": "cautilus",
      "evaluationKind": "execution",
      "prompt": "Use $cautilus to test the local impl skill with the checked-in fixture.",
      "startedAt": "2026-04-14T00:05:00.000Z",
      "invoked": true,
      "outcome": "passed",
      "summary": "The agent used the cautilus skill to run the checked-in impl fixture and summarized the recommendation."
    }
  ]
}
JSON
`
	if err := os.WriteFile(scriptPath, []byte(script), 0o755); err != nil {
		t.Fatalf("WriteFile returned error: %v", err)
	}
	writeJSONFile(t, filepath.Join(fixtureDir, "cases.json"), map[string]any{
		"schemaVersion": contracts.SkillTestCasesSchema,
		"skillId":       "cautilus",
		"cases": []map[string]any{
			{
				"caseId":          "trigger-cautilus-test-request",
				"evaluationKind":  "trigger",
				"prompt":          "Use $cautilus to test the local impl skill.",
				"expectedTrigger": "must_invoke",
			},
			{
				"caseId":         "execution-cautilus-test-request",
				"evaluationKind": "execution",
				"prompt":         "Use $cautilus to test the local impl skill with the checked-in fixture.",
			},
		},
	})
	if err := os.WriteFile(filepath.Join(adapterDir, "cautilus-adapter.yaml"), []byte(strings.Join([]string{
		"version: 1",
		"repo: temp",
		"evaluation_surfaces:",
		"  - local skill testing",
		"baseline_options:",
		"  - baseline git ref via {baseline_ref}",
		"skill_cases_default: fixtures/skill-test/cases.json",
		"skill_test_command_templates:",
		"  - sh ./skill-test.sh {skill_eval_input_file}",
		"",
	}, "\n")), 0o644); err != nil {
		t.Fatalf("WriteFile returned error: %v", err)
	}

	stdout, stderr, exitCode := runCLI(t, root, "skill", "test", "--repo-root", root, "--output-dir", outputDir)
	if exitCode != 0 {
		t.Fatalf("skill test failed: %s", stderr)
	}
	summaryPath := strings.TrimSpace(stdout)
	summary := readJSONObjectFile(t, summaryPath)
	if summary["schemaVersion"] != contracts.SkillEvaluationSummarySchema || summary["recommendation"] != "accept-now" {
		t.Fatalf("unexpected skill test summary: %#v", summary)
	}
	candidates := readJSONArrayFile(t, filepath.Join(outputDir, "skill-candidates.json"))
	if len(candidates) != 0 {
		t.Fatalf("unexpected candidates: %#v", candidates)
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
		{"skill-evaluate", []string{"skill", "evaluate"}, contracts.SkillEvaluationInputsSchema},
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
