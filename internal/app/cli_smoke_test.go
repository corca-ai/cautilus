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
	firstBoundedRun, ok := payload["first_bounded_run"].(map[string]any)
	if !ok {
		t.Fatalf("expected first_bounded_run payload, got %#v", payload["first_bounded_run"])
	}
	if anyToString(firstBoundedRun["discoveryCommand"]) != "cautilus scenarios --json" {
		t.Fatalf("unexpected first_bounded_run discovery command: %#v", firstBoundedRun["discoveryCommand"])
	}
	decisionLoopCommands, ok := firstBoundedRun["decisionLoopCommands"].([]any)
	if !ok || len(decisionLoopCommands) != 3 {
		t.Fatalf("expected three decision loop commands, got %#v", firstBoundedRun["decisionLoopCommands"])
	}
	if !strings.Contains(anyToString(decisionLoopCommands[0]), "cautilus mode evaluate --repo-root "+root) {
		t.Fatalf("expected mode evaluate first bounded run command, got %#v", decisionLoopCommands[0])
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
		"held_out_command_templates:",
		"  - echo held-out",
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
	nextSteps, ok := summary["nextSteps"].([]any)
	if !ok || len(nextSteps) < 4 {
		t.Fatalf("expected install nextSteps, got %#v", summary["nextSteps"])
	}
	if anyToString(nextSteps[0]) != "cautilus doctor --repo-root "+root+" --scope agent-surface" {
		t.Fatalf("unexpected first next step: %#v", nextSteps[0])
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
    ],
    "artifactPaths": [
      ".cautilus/runs/gepa-speech-heldout1/김이나/seg_0003/scenario_artifact.json"
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
	artifactPaths := compareArtifact["artifactPaths"].([]any)
	if len(artifactPaths) != 1 || anyToString(artifactPaths[0]) != ".cautilus/runs/gepa-speech-heldout1/김이나/seg_0003/scenario_artifact.json" {
		t.Fatalf("unexpected compare artifact paths: %#v", compareArtifact["artifactPaths"])
	}
}

func TestCLIModeEvaluatePreservesNamedAdapterContextForReviewAndSearch(t *testing.T) {
	root := t.TempDir()
	adapterDir := filepath.Join(root, ".agents")
	namedAdapterDir := filepath.Join(adapterDir, "cautilus-adapters")
	workspace := filepath.Join(root, "workspace")
	if err := os.MkdirAll(namedAdapterDir, 0o755); err != nil {
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
      "durationMs": 90
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
	adapterText := strings.Join([]string{
		"version: 1",
		"repo: temp",
		"evaluation_surfaces:",
		"  - operator workflow",
		"baseline_options:",
		"  - baseline git ref via {baseline_ref}",
		"held_out_command_templates:",
		"  - sh {candidate_repo}/bench.sh {scenario_results_file}",
		"default_prompt_file: prompts/review.md",
		"default_schema_file: fixtures/review.schema.json",
		"artifact_paths:",
		"  - prompts/review.md",
		"",
	}, "\n")
	if err := os.MkdirAll(filepath.Join(root, "prompts"), 0o755); err != nil {
		t.Fatalf("MkdirAll returned error: %v", err)
	}
	if err := os.MkdirAll(filepath.Join(root, "fixtures"), 0o755); err != nil {
		t.Fatalf("MkdirAll returned error: %v", err)
	}
	if err := os.WriteFile(filepath.Join(root, "prompts", "review.md"), []byte("review prompt\n"), 0o644); err != nil {
		t.Fatalf("WriteFile returned error: %v", err)
	}
	if err := os.WriteFile(filepath.Join(root, "fixtures", "review.schema.json"), []byte("{\"type\":\"object\"}\n"), 0o644); err != nil {
		t.Fatalf("WriteFile returned error: %v", err)
	}
	if err := os.WriteFile(filepath.Join(namedAdapterDir, "data-final-prompt-ab.yaml"), []byte(adapterText), 0o644); err != nil {
		t.Fatalf("WriteFile returned error: %v", err)
	}
	targetPath := filepath.Join(root, "prompt.md")
	if err := os.WriteFile(targetPath, []byte("Keep operator guidance explicit.\n"), 0o644); err != nil {
		t.Fatalf("WriteFile returned error: %v", err)
	}
	outputDir := filepath.Join(root, "outputs")
	reportStdout, stderr, exitCode := runCLI(t, root, "mode", "evaluate", "--repo-root", root, "--candidate-repo", workspace, "--adapter-name", "data-final-prompt-ab", "--mode", "held_out", "--intent", "Operator-facing behavior should remain legible.", "--baseline-ref", "origin/main", "--output-dir", outputDir)
	if exitCode != 0 {
		t.Fatalf("mode evaluate failed: %s", stderr)
	}
	reportPath := strings.TrimSpace(reportStdout)
	report := readJSONObjectFile(t, reportPath)
	adapterContext := report["adapterContext"].(map[string]any)
	if adapterContext["adapterName"] != "data-final-prompt-ab" {
		t.Fatalf("unexpected adapter context: %#v", adapterContext)
	}
	reviewPacketPath := filepath.Join(root, "review-packet.json")
	if _, stderr, exitCode := runCLI(t, root, "review", "prepare-input", "--repo-root", root, "--report-file", reportPath, "--output", reviewPacketPath); exitCode != 0 {
		t.Fatalf("review prepare-input failed without adapter override: %s", stderr)
	}
	reviewPacket := readJSONObjectFile(t, reviewPacketPath)
	if !strings.HasSuffix(anyToString(reviewPacket["adapterPath"]), filepath.Join(".agents", "cautilus-adapters", "data-final-prompt-ab.yaml")) {
		t.Fatalf("unexpected adapter path: %#v", reviewPacket["adapterPath"])
	}
	optimizeInputPath := filepath.Join(root, "optimize-input.json")
	if _, stderr, exitCode := runCLI(t, root, "optimize", "prepare-input", "--repo-root", root, "--report-file", reportPath, "--target", "prompt", "--target-file", targetPath, "--output", optimizeInputPath); exitCode != 0 {
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
	if _, stderr, exitCode := runCLI(t, root, "optimize", "search", "prepare-input", "--optimize-input", optimizeInputPath, "--held-out-results-file", heldOutResultsPath, "--target-file", targetPath, "--output", searchInputPath); exitCode != 0 {
		t.Fatalf("optimize search prepare-input failed: %s", stderr)
	}
	searchInput := readJSONObjectFile(t, searchInputPath)
	evaluationContext := searchInput["evaluationContext"].(map[string]any)
	if evaluationContext["adapterName"] != "data-final-prompt-ab" {
		t.Fatalf("unexpected evaluation context: %#v", evaluationContext)
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
		"held_out_command_templates:",
		"  - echo held-out",
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
		"held_out_command_templates:",
		"  - echo held-out",
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
		"held_out_command_templates:",
		"  - echo held-out",
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

func TestCLIModeEvaluateMarksComparisonBackedRejectionSeparately(t *testing.T) {
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
      "status": "failed",
      "durationMs": 90,
      "telemetry": {
        "total_tokens": 21,
        "cost_usd": 0.005
      }
    }
  ],
  "compareArtifact": {
    "schemaVersion": "cautilus.compare_artifact.v1",
    "summary": "Operator guidance regressed.",
    "verdict": "regressed",
    "regressed": [
      "operator-guidance-smoke"
    ]
  }
}
JSON
echo comparison rejected >&2
exit 1
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
	stdout, stderr, exitCode := runCLI(t, root, "mode", "evaluate", "--repo-root", root, "--candidate-repo", workspace, "--mode", "held_out", "--intent", "Comparison-backed regressions should stay legible.", "--baseline-ref", "origin/main", "--output-dir", outputDir)
	if exitCode != 0 {
		t.Fatalf("mode evaluate failed: %s", stderr)
	}
	report := readJSONObjectFile(t, strings.TrimSpace(stdout))
	if report["recommendation"] != "reject" {
		t.Fatalf("unexpected recommendation: %#v", report["recommendation"])
	}
	firstSummary := report["modeSummaries"].([]any)[0].(map[string]any)
	if firstSummary["status"] != "rejected" {
		t.Fatalf("unexpected mode status: %#v", firstSummary["status"])
	}
	if !strings.Contains(anyToString(firstSummary["summary"]), "completed comparison and reported 1 regression") {
		t.Fatalf("unexpected mode summary: %#v", firstSummary["summary"])
	}
}

func TestCLIModeEvaluateSurfacesProviderRateLimitContamination(t *testing.T) {
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
      "status": "failed",
      "durationMs": 90
    }
  ],
  "compareArtifact": {
    "schemaVersion": "cautilus.compare_artifact.v1",
    "summary": "Operator guidance regressed.",
    "verdict": "regressed",
    "regressed": [
      "operator-guidance-smoke"
    ]
  }
}
JSON
echo "Error: Rate limit reached for gpt-4.1 after repeated retries." >&2
exit 1
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
	stdout, stderr, exitCode := runCLI(t, root, "mode", "evaluate", "--repo-root", root, "--candidate-repo", workspace, "--mode", "held_out", "--intent", "Rate-limit contamination should surface in the report.", "--baseline-ref", "origin/main", "--output-dir", outputDir)
	if exitCode != 0 {
		t.Fatalf("mode evaluate failed: %s", stderr)
	}
	report := readJSONObjectFile(t, strings.TrimSpace(stdout))
	reasonCodes, ok := report["reasonCodes"].([]any)
	if !ok || len(reasonCodes) != 2 {
		t.Fatalf("unexpected report reasonCodes: %#v", report["reasonCodes"])
	}
	if anyToString(reasonCodes[0]) != "behavior_regression" || anyToString(reasonCodes[1]) != "provider_rate_limit_contamination" {
		t.Fatalf("unexpected report reasonCodes: %#v", reasonCodes)
	}
	warnings, ok := report["warnings"].([]any)
	if !ok || len(warnings) != 1 {
		t.Fatalf("unexpected report warnings: %#v", report["warnings"])
	}
	firstSummary := report["modeSummaries"].([]any)[0].(map[string]any)
	if !strings.Contains(anyToString(firstSummary["summary"]), "provider rate limits") {
		t.Fatalf("unexpected mode summary: %#v", firstSummary["summary"])
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

func TestCLIOptimizeSearchRunConsumesMultipleGenerations(t *testing.T) {
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
	writeExecutableFile(t, root, "evaluate.sh", strings.Join([]string{
		"#!/bin/sh",
		"output=\"$1\"",
		"score=40",
		"status=\"failed\"",
		"if grep -q \"detailed recovery checklist\" prompt.md; then",
		"  score=95",
		"  status=\"passed\"",
		"fi",
		"if grep -q \"escalation ladder\" prompt.md; then",
		"  score=99",
		"  status=\"passed\"",
		"fi",
		"cat >\"$output\" <<EOF",
		"{",
		"  \"schemaVersion\": \"cautilus.scenario_results.v1\",",
		"  \"mode\": \"held_out\",",
		"  \"results\": [",
		"    {",
		"      \"scenarioId\": \"operator-recovery\",",
		"      \"status\": \"$status\",",
		"      \"overallScore\": $score,",
		"      \"telemetry\": {",
		"        \"cost_usd\": 0.05,",
		"        \"durationMs\": 1300",
		"      }",
		"    }",
		"  ]",
		"}",
		"EOF",
		"",
	}, "\n"))
	writeExecutableFile(t, root, "codex", strings.Join([]string{
		"#!/bin/sh",
		"script_dir=$(CDPATH= cd -- \"$(dirname \"$0\")\" && pwd)",
		"count_file=\"$script_dir/codex-count.txt\"",
		"count=0",
		"if [ -f \"$count_file\" ]; then",
		"  count=$(cat \"$count_file\")",
		"fi",
		"count=$((count + 1))",
		"printf '%s' \"$count\" >\"$count_file\"",
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
		"if [ \"$count\" -eq 1 ]; then",
		"  cat >\"$out\" <<'EOF'",
		"{\"promptMarkdown\":\"Keep recovery instructions explicit with a detailed recovery checklist.\\n\",\"rationaleSummary\":\"Add a concrete recovery checklist.\",\"expectedImprovements\":[\"operator-recovery\"],\"preservedStrengths\":[\"keeps the original recovery framing\"],\"riskNotes\":[\"ensure the extra detail stays concise\"]}",
		"EOF",
		"else",
		"  cat >\"$out\" <<'EOF'",
		"{\"promptMarkdown\":\"Keep recovery instructions explicit with a detailed recovery checklist and escalation ladder.\\n\",\"rationaleSummary\":\"Keep the checklist and add an escalation ladder for harder recoveries.\",\"expectedImprovements\":[\"operator-recovery\"],\"preservedStrengths\":[\"keeps the recovery checklist\"],\"riskNotes\":[\"held-out still needs to confirm the escalation path is not too heavy\"]}",
		"EOF",
		"fi",
		"",
	}, "\n"))
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
				"status":       "passed",
				"overallScore": 95,
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
			"budget": "medium",
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
			"telemetry":           map[string]any{"modeCount": 0},
			"improved":            []any{},
			"regressed":           []any{"operator-recovery"},
			"unchanged":           []any{},
			"noisy":               []any{},
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

	_, stderr, exitCode := runCLI(t, root, "optimize", "search", "prepare-input", "--optimize-input", optimizeInputPath, "--held-out-results-file", heldOutResultsPath, "--budget", "medium", "--output", searchInputPath)
	if exitCode != 0 {
		t.Fatalf("optimize search prepare-input failed: %s", stderr)
	}
	stdout, stderr, exitCode := runCLI(t, root, "optimize", "search", "run", "--input", searchInputPath, "--output", searchResultPath)
	if exitCode != 0 {
		t.Fatalf("optimize search run failed: stdout=%s stderr=%s", stdout, stderr)
	}
	searchResult := readJSONObjectFile(t, searchResultPath)
	if searchResult["status"] != "completed" {
		t.Fatalf("unexpected search result status: %#v", searchResult)
	}
	if searchResult["selectedCandidateId"] != "g2-1-codex-exec" {
		t.Fatalf("expected second-generation candidate, got %#v", searchResult["selectedCandidateId"])
	}
	searchTelemetry := searchResult["searchTelemetry"].(map[string]any)
	if searchTelemetry["generationCount"] != float64(2) || searchTelemetry["mutationInvocationCount"] != float64(2) {
		t.Fatalf("unexpected search telemetry: %#v", searchTelemetry)
	}
	if len(searchResult["candidateRegistry"].([]any)) != 3 {
		t.Fatalf("unexpected candidate registry: %#v", searchResult["candidateRegistry"])
	}
	proposalBridge := searchResult["proposalBridge"].(map[string]any)
	selectedTargetFile := proposalBridge["selectedTargetFile"].(map[string]any)["path"].(string)
	payload, err := os.ReadFile(selectedTargetFile)
	if err != nil {
		t.Fatalf("ReadFile returned error: %v", err)
	}
	if !strings.Contains(string(payload), "escalation ladder") {
		t.Fatalf("expected selected candidate prompt to include escalation ladder, got %q", string(payload))
	}
}

func TestCLIOptimizeSearchRunFallsBackWhenFinalFullGateRejectsLeader(t *testing.T) {
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
	writeExecutableFile(t, root, "evaluate.sh", strings.Join([]string{
		"#!/bin/sh",
		"output=\"$1\"",
		"recovery_score=70",
		"followup_score=85",
		"if grep -q \"detailed recovery checklist\" prompt.md; then",
		"  recovery_score=95",
		"  followup_score=60",
		"fi",
		"cat >\"$output\" <<EOF",
		"{",
		"  \"schemaVersion\": \"cautilus.scenario_results.v1\",",
		"  \"mode\": \"held_out\",",
		"  \"results\": [",
		"    {",
		"      \"scenarioId\": \"operator-recovery\",",
		"      \"status\": \"passed\",",
		"      \"overallScore\": $recovery_score,",
		"      \"telemetry\": {",
		"        \"cost_usd\": 0.05,",
		"        \"durationMs\": 1300",
		"      }",
		"    },",
		"    {",
		"      \"scenarioId\": \"operator-follow-up\",",
		"      \"status\": \"passed\",",
		"      \"overallScore\": $followup_score,",
		"      \"telemetry\": {",
		"        \"cost_usd\": 0.04,",
		"        \"durationMs\": 1250",
		"      }",
		"    }",
		"  ]",
		"}",
		"EOF",
		"",
	}, "\n"))
	writeExecutableFile(t, root, "full-gate.sh", strings.Join([]string{
		"#!/bin/sh",
		"output=\"$1\"",
		"status=\"passed\"",
		"score=92",
		"if grep -q \"detailed recovery checklist\" prompt.md; then",
		"  status=\"failed\"",
		"  score=55",
		"fi",
		"cat >\"$output\" <<EOF",
		"{",
		"  \"schemaVersion\": \"cautilus.scenario_results.v1\",",
		"  \"mode\": \"full_gate\",",
		"  \"results\": [",
		"    {",
		"      \"scenarioId\": \"operator-release-gate\",",
		"      \"status\": \"$status\",",
		"      \"overallScore\": $score",
		"    }",
		"  ]",
		"}",
		"EOF",
		"",
	}, "\n"))
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
		fmt.Sprintf("printf '%%s\\n' '%s' > \"$out\"", toJSONString(map[string]any{
			"promptMarkdown":       "Keep recovery instructions explicit with a detailed recovery checklist.\n",
			"rationaleSummary":     "Improve the recovery checklist even if the release-gate surface may stay strict.",
			"expectedImprovements": []string{"operator-recovery"},
			"preservedStrengths":   []string{"keeps the original concise framing"},
			"riskNotes":            []string{"final full gate still needs to confirm the checklist stays admissible"},
		})),
		"",
	}, "\n"))
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
		"full_gate_command_templates:",
		"  - sh full-gate.sh {scenario_results_file}",
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
				"status":       "passed",
				"overallScore": 70,
				"telemetry": map[string]any{
					"cost_usd":   0.02,
					"durationMs": 1200,
				},
			},
			{
				"scenarioId":   "operator-follow-up",
				"status":       "passed",
				"overallScore": 85,
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
			"telemetry":           map[string]any{"modeCount": 0},
			"improved":            []any{},
			"regressed":           []any{"operator-recovery"},
			"unchanged":           []any{},
			"noisy":               []any{},
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
	if searchResult["selectedCandidateId"] != "seed" {
		t.Fatalf("expected fallback to seed candidate, got %#v", searchResult["selectedCandidateId"])
	}
	searchTelemetry := searchResult["searchTelemetry"].(map[string]any)
	if searchTelemetry["fullGateCheckpointCount"] != float64(2) {
		t.Fatalf("expected two full-gate checkpoints, got %#v", searchTelemetry)
	}
	selectionTelemetry := searchResult["selectionTelemetry"].(map[string]any)
	rejected := selectionTelemetry["rejectedFinalistCandidateIds"].([]any)
	if len(rejected) == 0 || rejected[0] != "g1-1-codex-exec" {
		t.Fatalf("expected generated candidate rejection, got %#v", rejected)
	}
	rejectionReasons := selectionTelemetry["rejectionReasons"].(map[string]any)
	generatedReasons := rejectionReasons["g1-1-codex-exec"].([]any)
	if len(generatedReasons) == 0 || !strings.HasPrefix(anyToString(generatedReasons[0]), "full_gate:") {
		t.Fatalf("expected full-gate rejection reason, got %#v", generatedReasons)
	}
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

func TestCLIOptimizeSearchRunReusesFrontierPromotionReviewBeforeFinalSelection(t *testing.T) {
	root := t.TempDir()
	targetPath := filepath.Join(root, "prompt.md")
	schemaPath := filepath.Join(root, "fixtures", "review.schema.json")
	heldOutResultsPath := filepath.Join(root, "held-out-results.json")
	optimizeInputPath := filepath.Join(root, "optimize-input.json")
	searchInputPath := filepath.Join(root, "optimize-search-input.json")
	reviewCountPath := filepath.Join(root, "review-count.txt")

	if err := os.MkdirAll(filepath.Join(root, ".agents"), 0o755); err != nil {
		t.Fatalf("MkdirAll returned error: %v", err)
	}
	if err := os.MkdirAll(filepath.Join(root, "fixtures"), 0o755); err != nil {
		t.Fatalf("MkdirAll returned error: %v", err)
	}
	if err := os.WriteFile(targetPath, []byte("Keep recovery instructions explicit.\n"), 0o644); err != nil {
		t.Fatalf("WriteFile returned error: %v", err)
	}
	if err := os.WriteFile(schemaPath, []byte("{\"type\":\"object\"}\n"), 0o644); err != nil {
		t.Fatalf("WriteFile returned error: %v", err)
	}
	writeExecutableFile(t, root, "evaluate.sh", strings.Join([]string{
		"#!/bin/sh",
		"output=\"$1\"",
		"recovery_score=60",
		"if grep -q \"detailed recovery checklist\" prompt.md; then",
		"  recovery_score=95",
		"fi",
		"cat >\"$output\" <<EOF",
		"{",
		"  \"schemaVersion\": \"cautilus.scenario_results.v1\",",
		"  \"mode\": \"held_out\",",
		"  \"results\": [",
		"    {",
		"      \"scenarioId\": \"operator-recovery\",",
		"      \"status\": \"passed\",",
		"      \"overallScore\": $recovery_score,",
		"      \"telemetry\": {",
		"        \"cost_usd\": 0.02,",
		"        \"durationMs\": 1200",
		"      }",
		"    }",
		"  ]",
		"}",
		"EOF",
		"",
	}, "\n"))
	writeExecutableFile(t, root, "variant.sh", strings.Join([]string{
		"#!/bin/sh",
		"output_file=\"$1\"",
		fmt.Sprintf("count_file=%q", reviewCountPath),
		"count=0",
		"if [ -f \"$count_file\" ]; then",
		"  count=$(cat \"$count_file\")",
		"fi",
		"count=$((count + 1))",
		"printf '%s\\n' \"$count\" > \"$count_file\"",
		"printf '{\"verdict\":\"pass\",\"summary\":\"frontier promotion review passed\",\"findings\":[{\"severity\":\"pass\",\"message\":\"promotion review reused\",\"path\":\"variant/sh\"}] }\\n' > \"$output_file\"",
		"",
	}, "\n"))
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
		fmt.Sprintf("printf '%%s\\n' '%s' > \"$out\"", toJSONString(map[string]any{
			"promptMarkdown":       "Keep recovery instructions explicit with a detailed recovery checklist.\n",
			"rationaleSummary":     "Strengthen the recovery path with a concrete checklist.",
			"expectedImprovements": []string{"operator-recovery"},
			"preservedStrengths":   []string{"keeps the original recovery framing"},
			"riskNotes":            []string{"held-out should confirm the extra detail stays concise"},
		})),
		"",
	}, "\n"))
	if err := os.WriteFile(filepath.Join(root, ".agents", "cautilus-adapter.yaml"), []byte(strings.Join([]string{
		"version: 1",
		"repo: temp-optimize-search",
		"evaluation_surfaces:",
		"  - prompt behavior",
		"baseline_options:",
		"  - baseline git ref in the same repo via {baseline_ref}",
		"required_prerequisites: []",
		"default_schema_file: fixtures/review.schema.json",
		"held_out_command_templates:",
		"  - sh evaluate.sh {scenario_results_file}",
		"comparison_questions:",
		"  - Did the held-out score improve?",
		"executor_variants:",
		"  - id: operator-review",
		"    tool: command",
		"    purpose: frontier promotion review",
		"    command_template: sh {candidate_repo}/variant.sh {output_file}",
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
			"budget": "medium",
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
			"telemetry":           map[string]any{"modeCount": 0},
			"improved":            []any{},
			"regressed":           []any{"operator-recovery"},
			"unchanged":           []any{},
			"noisy":               []any{},
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

	_, stderr, exitCode := runCLI(t, root, "optimize", "search", "prepare-input", "--optimize-input", optimizeInputPath, "--held-out-results-file", heldOutResultsPath, "--budget", "medium", "--output", searchInputPath)
	if exitCode != 0 {
		t.Fatalf("optimize search prepare-input failed: %s", stderr)
	}
	searchInput := readJSONObjectFile(t, searchInputPath)
	searchConfig := searchInput["searchConfig"].(map[string]any)
	searchConfig["generationLimit"] = float64(1)
	searchConfig["reviewCheckpointPolicy"] = "frontier_promotions"
	mutationConfig := searchInput["mutationConfig"].(map[string]any)
	mutationConfig["backends"] = []any{
		map[string]any{
			"id":      "codex-mutate",
			"backend": "codex_exec",
		},
	}
	writeJSONFile(t, searchInputPath, searchInput)

	stdout, stderr, exitCode := runCLI(t, root, "optimize", "search", "run", "--input", searchInputPath, "--json")
	if exitCode != 0 {
		t.Fatalf("optimize search run failed: stdout=%s stderr=%s", stdout, stderr)
	}
	searchResult := map[string]any{}
	if err := json.Unmarshal([]byte(stdout), &searchResult); err != nil {
		t.Fatalf("json.Unmarshal returned error: %v", err)
	}
	if searchResult["status"] != "completed" {
		t.Fatalf("unexpected search result status: %#v", searchResult)
	}
	if searchResult["selectedCandidateId"] == "seed" {
		t.Fatalf("expected promoted candidate selection, got %#v", searchResult["selectedCandidateId"])
	}
	searchTelemetry := searchResult["searchTelemetry"].(map[string]any)
	if searchTelemetry["reviewCheckpointCount"] != float64(1) {
		t.Fatalf("expected one reused review checkpoint, got %#v", searchTelemetry)
	}
	if searchTelemetry["fullGateCheckpointCount"] != float64(0) {
		t.Fatalf("expected no full-gate checkpoint executions, got %#v", searchTelemetry)
	}
	reviewOutcomes := searchResult["checkpointOutcomes"].(map[string]any)["review"].([]any)
	if len(reviewOutcomes) != 1 {
		t.Fatalf("expected one recorded review outcome, got %#v", reviewOutcomes)
	}
	if reviewOutcomes[0].(map[string]any)["reviewedAtGeneration"] != float64(1) {
		t.Fatalf("expected promotion review metadata, got %#v", reviewOutcomes[0])
	}
	countBytes, err := os.ReadFile(reviewCountPath)
	if err != nil {
		t.Fatalf("ReadFile returned error: %v", err)
	}
	if strings.TrimSpace(string(countBytes)) != "1" {
		t.Fatalf("expected review runner to execute once, got %q", string(countBytes))
	}
}

func TestCLIOptimizeSearchRunReinjectsFrontierPromotionReviewFeedbackIntoNextMutationPrompt(t *testing.T) {
	root := t.TempDir()
	targetPath := filepath.Join(root, "prompt.md")
	schemaPath := filepath.Join(root, "fixtures", "review.schema.json")
	heldOutResultsPath := filepath.Join(root, "held-out-results.json")
	optimizeInputPath := filepath.Join(root, "optimize-input.json")
	searchInputPath := filepath.Join(root, "optimize-search-input.json")

	if err := os.MkdirAll(filepath.Join(root, ".agents"), 0o755); err != nil {
		t.Fatalf("MkdirAll returned error: %v", err)
	}
	if err := os.MkdirAll(filepath.Join(root, "fixtures"), 0o755); err != nil {
		t.Fatalf("MkdirAll returned error: %v", err)
	}
	if err := os.WriteFile(targetPath, []byte("Keep recovery instructions explicit.\n"), 0o644); err != nil {
		t.Fatalf("WriteFile returned error: %v", err)
	}
	if err := os.WriteFile(schemaPath, []byte("{\"type\":\"object\"}\n"), 0o644); err != nil {
		t.Fatalf("WriteFile returned error: %v", err)
	}
	writeExecutableFile(t, root, "evaluate.sh", strings.Join([]string{
		"#!/bin/sh",
		"output=\"$1\"",
		"score=40",
		"if grep -q \"detailed recovery checklist and a follow-up handoff map\" prompt.md; then",
		"  score=99",
		"elif grep -q \"detailed recovery checklist\" prompt.md; then",
		"  score=92",
		"fi",
		"cat >\"$output\" <<EOF",
		"{",
		"  \"schemaVersion\": \"cautilus.scenario_results.v1\",",
		"  \"mode\": \"held_out\",",
		"  \"results\": [",
		"    {",
		"      \"scenarioId\": \"operator-follow-up\",",
		"      \"status\": \"passed\",",
		"      \"overallScore\": $score,",
		"      \"telemetry\": {",
		"        \"cost_usd\": 0.02,",
		"        \"durationMs\": 1200",
		"      }",
		"    }",
		"  ]",
		"}",
		"EOF",
		"",
	}, "\n"))
	writeExecutableFile(t, root, "variant.sh", strings.Join([]string{
		"#!/bin/sh",
		"output_file=\"$1\"",
		"prompt_file=\"$(dirname \"$0\")/prompt.md\"",
		"verdict=\"pass\"",
		"severity=\"pass\"",
		"summary=\"candidate stays operator-safe\"",
		"if grep -q \"detailed recovery checklist\" \"$prompt_file\" && ! grep -q \"follow-up handoff map\" \"$prompt_file\"; then",
		"  verdict=\"concern\"",
		"  severity=\"concern\"",
		"  summary=\"Checklist candidate still leaves operator-follow-up under-specified.\"",
		"fi",
		"cat >\"$output_file\" <<EOF",
		"{",
		"  \"verdict\": \"$verdict\",",
		"  \"summary\": \"$summary\",",
		"  \"findings\": [",
		"    {",
		"      \"severity\": \"$severity\",",
		"      \"message\": \"Checklist candidate still leaves operator-follow-up under-specified.\",",
		"      \"path\": \"variant/operator-review\"",
		"    }",
		"  ]",
		"}",
		"EOF",
		"",
	}, "\n"))
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
		"prompt=$(cat)",
		"if printf '%s' \"$prompt\" | grep -q \"review:operator-review:concern\" && printf '%s' \"$prompt\" | grep -q \"operator-follow-up under-specified\"; then",
		fmt.Sprintf("  printf '%%s\\n' '%s' > \"$out\"", toJSONString(map[string]any{
			"promptMarkdown":       "Keep recovery instructions explicit with a detailed recovery checklist and a follow-up handoff map.\n",
			"rationaleSummary":     "Repair the checkpointed follow-up gap.",
			"expectedImprovements": []string{"operator-follow-up"},
			"preservedStrengths":   []string{"keeps the detailed recovery checklist"},
			"riskNotes":            []string{"held-out should confirm the repaired handoff stays concise"},
		})),
		"  exit 0",
		"fi",
		fmt.Sprintf("printf '%%s\\n' '%s' > \"$out\"", toJSONString(map[string]any{
			"promptMarkdown":       "Keep recovery instructions explicit with a detailed recovery checklist.\n",
			"rationaleSummary":     "Strengthen the recovery path first.",
			"expectedImprovements": []string{"operator-follow-up"},
			"preservedStrengths":   []string{"keeps the original recovery framing"},
			"riskNotes":            []string{"operator follow-up may still remain weak"},
		})),
		"",
	}, "\n"))
	if err := os.WriteFile(filepath.Join(root, ".agents", "cautilus-adapter.yaml"), []byte(strings.Join([]string{
		"version: 1",
		"repo: temp-optimize-search",
		"evaluation_surfaces:",
		"  - prompt behavior",
		"baseline_options:",
		"  - baseline git ref in the same repo via {baseline_ref}",
		"required_prerequisites: []",
		"default_schema_file: fixtures/review.schema.json",
		"held_out_command_templates:",
		"  - sh evaluate.sh {scenario_results_file}",
		"comparison_questions:",
		"  - Did the held-out score improve?",
		"executor_variants:",
		"  - id: operator-review",
		"    tool: command",
		"    purpose: frontier promotion review",
		"    command_template: sh {candidate_repo}/variant.sh {output_file}",
		"",
	}, "\n")), 0o644); err != nil {
		t.Fatalf("WriteFile returned error: %v", err)
	}
	writeJSONFile(t, heldOutResultsPath, map[string]any{
		"schemaVersion": contracts.ScenarioResultsSchema,
		"mode":          "held_out",
		"results": []map[string]any{
			{
				"scenarioId":   "operator-follow-up",
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
			"budget": "medium",
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
			"telemetry":           map[string]any{"modeCount": 0},
			"improved":            []any{},
			"regressed":           []any{"operator-follow-up"},
			"unchanged":           []any{},
			"noisy":               []any{},
			"humanReviewFindings": []any{
				map[string]any{
					"severity": "concern",
					"message":  "operator-follow-up still needs a clearer handoff map",
				},
			},
			"recommendation": "defer",
		},
		"reviewSummaryFile":   filepath.Join(root, "review-summary.json"),
		"reviewSummary":       map[string]any{"variants": []any{}},
		"scenarioHistoryFile": filepath.Join(root, "history.json"),
		"scenarioHistory": map[string]any{
			"schemaVersion": contracts.ScenarioHistorySchema,
			"scenarioStats": map[string]any{
				"operator-follow-up": map[string]any{
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

	_, stderr, exitCode := runCLI(t, root, "optimize", "search", "prepare-input", "--optimize-input", optimizeInputPath, "--held-out-results-file", heldOutResultsPath, "--budget", "medium", "--output", searchInputPath)
	if exitCode != 0 {
		t.Fatalf("optimize search prepare-input failed: %s", stderr)
	}
	searchInput := readJSONObjectFile(t, searchInputPath)
	searchConfig := searchInput["searchConfig"].(map[string]any)
	searchConfig["generationLimit"] = float64(2)
	searchConfig["reviewCheckpointPolicy"] = "frontier_promotions"
	mutationConfig := searchInput["mutationConfig"].(map[string]any)
	mutationConfig["backends"] = []any{
		map[string]any{
			"id":      "codex-mutate",
			"backend": "codex_exec",
		},
	}
	mutationConfig["trainScenarioLimit"] = float64(1)
	writeJSONFile(t, searchInputPath, searchInput)

	stdout, stderr := "", ""
	stdout, stderr, exitCode = runCLI(t, root, "optimize", "search", "run", "--input", searchInputPath, "--json")
	if exitCode != 0 {
		t.Fatalf("optimize search run failed: stdout=%s stderr=%s", stdout, stderr)
	}
	searchResult := map[string]any{}
	if err := json.Unmarshal([]byte(stdout), &searchResult); err != nil {
		t.Fatalf("json.Unmarshal returned error: %v", err)
	}
	if searchResult["status"] != "completed" {
		t.Fatalf("unexpected search result status: %#v", searchResult)
	}
	if searchResult["selectedCandidateId"] != "g2-1-codex-exec" {
		t.Fatalf("expected second-generation repaired candidate, got %#v from %#v", searchResult["selectedCandidateId"], searchResult)
	}
	registry := searchResult["candidateRegistry"].([]any)
	var rejectedCandidate map[string]any
	var repairedCandidate map[string]any
	for _, raw := range registry {
		candidate := raw.(map[string]any)
		switch candidate["id"] {
		case "g1-1-codex-exec":
			rejectedCandidate = candidate
		case "g2-1-codex-exec":
			repairedCandidate = candidate
		}
	}
	checkpointFeedback, _ := rejectedCandidate["checkpointFeedback"].([]any)
	if len(rejectedCandidate) == 0 || len(checkpointFeedback) == 0 {
		t.Fatalf("expected rejected candidate checkpoint feedback, got %#v", rejectedCandidate)
	}
	mutationPromptPath := repairedCandidate["artifacts"].(map[string]any)["promptFile"].(string)
	mutationPrompt, err := os.ReadFile(mutationPromptPath)
	if err != nil {
		t.Fatalf("ReadFile returned error: %v", err)
	}
	if !strings.Contains(string(mutationPrompt), "review:operator-review:concern") || !strings.Contains(string(mutationPrompt), "operator-follow-up under-specified") {
		t.Fatalf("expected repaired mutation prompt to include reinjected checkpoint feedback, got %q", string(mutationPrompt))
	}
	selectedTargetPath := searchResult["proposalBridge"].(map[string]any)["selectedTargetFile"].(map[string]any)["path"].(string)
	selectedPrompt, err := os.ReadFile(selectedTargetPath)
	if err != nil {
		t.Fatalf("ReadFile returned error: %v", err)
	}
	if !strings.Contains(string(selectedPrompt), "follow-up handoff map") {
		t.Fatalf("expected repaired selected prompt, got %q", string(selectedPrompt))
	}
}

func TestCLIOptimizeSearchRunSynthesizesComplementaryMergeCandidate(t *testing.T) {
	root := t.TempDir()
	targetPath := filepath.Join(root, "prompt.md")
	schemaPath := filepath.Join(root, "fixtures", "review.schema.json")
	heldOutResultsPath := filepath.Join(root, "held-out-results.json")
	optimizeInputPath := filepath.Join(root, "optimize-input.json")
	searchInputPath := filepath.Join(root, "optimize-search-input.json")

	if err := os.MkdirAll(filepath.Join(root, ".agents"), 0o755); err != nil {
		t.Fatalf("MkdirAll returned error: %v", err)
	}
	if err := os.MkdirAll(filepath.Join(root, "fixtures"), 0o755); err != nil {
		t.Fatalf("MkdirAll returned error: %v", err)
	}
	if err := os.WriteFile(targetPath, []byte("Keep recovery instructions explicit with a detailed recovery checklist.\n"), 0o644); err != nil {
		t.Fatalf("WriteFile returned error: %v", err)
	}
	if err := os.WriteFile(schemaPath, []byte("{\"type\":\"object\"}\n"), 0o644); err != nil {
		t.Fatalf("WriteFile returned error: %v", err)
	}
	writeExecutableFile(t, root, "evaluate.sh", strings.Join([]string{
		"#!/bin/sh",
		"output=\"$1\"",
		"recovery_score=40",
		"followup_score=40",
		"if grep -q \"detailed recovery checklist\" prompt.md; then",
		"  recovery_score=95",
		"fi",
		"if grep -q \"follow-up handoff map\" prompt.md; then",
		"  followup_score=95",
		"fi",
		"cat >\"$output\" <<EOF",
		"{",
		"  \"schemaVersion\": \"cautilus.scenario_results.v1\",",
		"  \"mode\": \"held_out\",",
		"  \"results\": [",
		"    {",
		"      \"scenarioId\": \"operator-recovery\",",
		"      \"status\": \"passed\",",
		"      \"overallScore\": $recovery_score,",
		"      \"telemetry\": {",
		"        \"cost_usd\": 0.02,",
		"        \"durationMs\": 1200",
		"      }",
		"    },",
		"    {",
		"      \"scenarioId\": \"operator-follow-up\",",
		"      \"status\": \"passed\",",
		"      \"overallScore\": $followup_score,",
		"      \"telemetry\": {",
		"        \"cost_usd\": 0.03,",
		"        \"durationMs\": 1400",
		"      }",
		"    }",
		"  ]",
		"}",
		"EOF",
		"",
	}, "\n"))
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
		"prompt=$(cat)",
		"if printf '%s' \"$prompt\" | grep -q \"# Parent seed\" && printf '%s' \"$prompt\" | grep -q \"sourceCandidateId\" && printf '%s' \"$prompt\" | grep -q \"operator-follow-up under-specified\"; then",
		fmt.Sprintf("  printf '%%s\\n' '%s' > \"$out\"", toJSONString(map[string]any{
			"promptMarkdown":       "Keep recovery instructions explicit with a detailed recovery checklist and a follow-up handoff map.\n",
			"rationaleSummary":     "Combine the seed recovery checklist with the frontier follow-up handoff map.",
			"expectedImprovements": []string{"operator-recovery", "operator-follow-up"},
			"preservedStrengths":   []string{"keeps the detailed recovery checklist", "adds the follow-up handoff map"},
			"riskNotes":            []string{"held-out should confirm the merged prompt stays concise"},
		})),
		"  exit 0",
		"fi",
		fmt.Sprintf("printf '%%s\\n' '%s' > \"$out\"", toJSONString(map[string]any{
			"promptMarkdown":       "Keep recovery instructions explicit with a follow-up handoff map.\n",
			"rationaleSummary":     "Strengthen the follow-up path first.",
			"expectedImprovements": []string{"operator-follow-up"},
			"preservedStrengths":   []string{"keeps the original recovery framing"},
			"riskNotes":            []string{"recovery checklist detail may still remain weak"},
		})),
		"",
	}, "\n"))
	writeExecutableFile(t, root, "variant.sh", strings.Join([]string{
		"#!/bin/sh",
		"output_file=\"$1\"",
		"prompt_file=\"$(dirname \"$0\")/prompt.md\"",
		"verdict=\"pass\"",
		"severity=\"pass\"",
		"summary=\"candidate stays operator-safe\"",
		"message=\"candidate stays operator-safe\"",
		"if grep -q \"follow-up handoff map\" \"$prompt_file\" && ! grep -q \"detailed recovery checklist\" \"$prompt_file\"; then",
		"  verdict=\"concern\"",
		"  severity=\"concern\"",
		"  summary=\"Checklist candidate still leaves operator-follow-up under-specified.\"",
		"  message=\"Checklist candidate still leaves operator-follow-up under-specified.\"",
		"fi",
		"cat >\"$output_file\" <<EOF",
		"{",
		"  \"verdict\": \"$verdict\",",
		"  \"summary\": \"$summary\",",
		"  \"findings\": [",
		"    {",
		"      \"severity\": \"$severity\",",
		"      \"message\": \"$message\",",
		"      \"path\": \"variant/operator-review\"",
		"    }",
		"  ]",
		"}",
		"EOF",
		"",
	}, "\n"))
	if err := os.WriteFile(filepath.Join(root, ".agents", "cautilus-adapter.yaml"), []byte(strings.Join([]string{
		"version: 1",
		"repo: temp-optimize-search",
		"evaluation_surfaces:",
		"  - prompt behavior",
		"baseline_options:",
		"  - baseline git ref in the same repo via {baseline_ref}",
		"required_prerequisites: []",
		"default_schema_file: fixtures/review.schema.json",
		"held_out_command_templates:",
		"  - sh evaluate.sh {scenario_results_file}",
		"comparison_questions:",
		"  - Did the held-out score improve?",
		"executor_variants:",
		"  - id: operator-review",
		"    tool: command",
		"    purpose: frontier promotion review",
		"    command_template: sh {candidate_repo}/variant.sh {output_file}",
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
				"status":       "passed",
				"overallScore": 95,
				"telemetry": map[string]any{
					"cost_usd":   0.02,
					"durationMs": 1200,
				},
			},
			{
				"scenarioId":   "operator-follow-up",
				"status":       "failed",
				"overallScore": 40,
				"telemetry": map[string]any{
					"cost_usd":   0.03,
					"durationMs": 1400,
				},
			},
		},
	})
	writeJSONFile(t, optimizeInputPath, map[string]any{
		"schemaVersion":      contracts.OptimizeInputsSchema,
		"generatedAt":        "2026-04-19T03:00:00.000Z",
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
			"budget": "medium",
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
			"generatedAt":   "2026-04-19T02:59:00.000Z",
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
			"telemetry":           map[string]any{"modeCount": 0},
			"improved":            []any{},
			"regressed":           []any{"operator-recovery", "operator-follow-up"},
			"unchanged":           []any{},
			"noisy":               []any{},
			"humanReviewFindings": []any{
				map[string]any{
					"severity": "concern",
					"message":  "operator guidance still needs a clearer follow-up handoff map without losing the checklist",
				},
			},
			"recommendation": "defer",
		},
		"reviewSummaryFile":   filepath.Join(root, "review-summary.json"),
		"reviewSummary":       map[string]any{"variants": []any{}},
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
				"operator-follow-up": map[string]any{
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
			"constraints": []any{"Preserve working recovery detail while repairing follow-up guidance."},
		},
	})

	runGit(t, root, "init")
	runGit(t, root, "config", "user.email", "test@example.com")
	runGit(t, root, "config", "user.name", "Cautilus Test")
	runGit(t, root, "add", ".")
	runGit(t, root, "commit", "-m", "initial")
	t.Setenv("PATH", root+string(os.PathListSeparator)+os.Getenv("PATH"))

	_, stderr, exitCode := runCLI(t, root, "optimize", "search", "prepare-input", "--optimize-input", optimizeInputPath, "--held-out-results-file", heldOutResultsPath, "--budget", "medium", "--output", searchInputPath)
	if exitCode != 0 {
		t.Fatalf("optimize search prepare-input failed: %s", stderr)
	}
	searchInput := readJSONObjectFile(t, searchInputPath)
	searchConfig := searchInput["searchConfig"].(map[string]any)
	searchConfig["generationLimit"] = float64(1)
	searchConfig["mergeEnabled"] = true
	searchConfig["reviewCheckpointPolicy"] = "frontier_promotions"
	searchConfig["threeParentPolicy"] = "disabled"
	mutationConfig := searchInput["mutationConfig"].(map[string]any)
	mutationConfig["backends"] = []any{
		map[string]any{
			"id":      "codex-mutate",
			"backend": "codex_exec",
		},
	}
	writeJSONFile(t, searchInputPath, searchInput)

	stdout, stderr, exitCode := runCLI(t, root, "optimize", "search", "run", "--input", searchInputPath, "--json")
	if exitCode != 0 {
		t.Fatalf("optimize search run failed: stdout=%s stderr=%s", stdout, stderr)
	}
	searchResult := map[string]any{}
	if err := json.Unmarshal([]byte(stdout), &searchResult); err != nil {
		t.Fatalf("json.Unmarshal returned error: %v", err)
	}
	if searchResult["status"] != "completed" {
		t.Fatalf("unexpected search result status: %#v", searchResult)
	}
	if searchResult["selectedCandidateId"] != "g1-merge-1-codex-exec" {
		t.Fatalf("expected merge finalist, got %#v from %#v", searchResult["selectedCandidateId"], searchResult)
	}
	searchTelemetry := searchResult["searchTelemetry"].(map[string]any)
	if searchTelemetry["mergeInvocationCount"] != float64(1) {
		t.Fatalf("expected one merge invocation, got %#v", searchTelemetry)
	}
	registry := searchResult["candidateRegistry"].([]any)
	var mergeCandidate map[string]any
	for _, raw := range registry {
		candidate := raw.(map[string]any)
		if candidate["id"] == "g1-merge-1-codex-exec" {
			mergeCandidate = candidate
			break
		}
	}
	if len(mergeCandidate) == 0 || mergeCandidate["origin"] != "merge" {
		t.Fatalf("expected merge candidate in registry, got %#v", registry)
	}
	mergePromptPath := mergeCandidate["artifacts"].(map[string]any)["promptFile"].(string)
	mergePrompt, err := os.ReadFile(mergePromptPath)
	if err != nil {
		t.Fatalf("ReadFile returned error: %v", err)
	}
	if !strings.Contains(string(mergePrompt), "sourceCandidateId") || !strings.Contains(string(mergePrompt), "operator-follow-up under-specified") {
		t.Fatalf("expected merge prompt to include frontier checkpoint feedback provenance, got %q", string(mergePrompt))
	}
	selectedTargetPath := searchResult["proposalBridge"].(map[string]any)["selectedTargetFile"].(map[string]any)["path"].(string)
	selectedPrompt, err := os.ReadFile(selectedTargetPath)
	if err != nil {
		t.Fatalf("ReadFile returned error: %v", err)
	}
	if !strings.Contains(string(selectedPrompt), "detailed recovery checklist") || !strings.Contains(string(selectedPrompt), "follow-up handoff map") {
		t.Fatalf("expected merged prompt to preserve both strengths, got %q", string(selectedPrompt))
	}
}

func TestCLIOptimizeSearchRunSynthesizesMultiGenerationMergeCandidate(t *testing.T) {
	root := t.TempDir()
	targetPath := filepath.Join(root, "prompt.md")
	schemaPath := filepath.Join(root, "fixtures", "review.schema.json")
	heldOutResultsPath := filepath.Join(root, "held-out-results.json")
	optimizeInputPath := filepath.Join(root, "optimize-input.json")
	searchInputPath := filepath.Join(root, "optimize-search-input.json")

	if err := os.MkdirAll(filepath.Join(root, ".agents"), 0o755); err != nil {
		t.Fatalf("MkdirAll returned error: %v", err)
	}
	if err := os.MkdirAll(filepath.Join(root, "fixtures"), 0o755); err != nil {
		t.Fatalf("MkdirAll returned error: %v", err)
	}
	if err := os.WriteFile(targetPath, []byte("Keep recovery instructions explicit with a detailed recovery checklist.\n"), 0o644); err != nil {
		t.Fatalf("WriteFile returned error: %v", err)
	}
	if err := os.WriteFile(schemaPath, []byte("{\"type\":\"object\"}\n"), 0o644); err != nil {
		t.Fatalf("WriteFile returned error: %v", err)
	}
	writeExecutableFile(t, root, "evaluate.sh", strings.Join([]string{
		"#!/bin/sh",
		"output=\"$1\"",
		"recovery_score=40",
		"followup_score=40",
		"escalation_score=40",
		"if grep -q \"detailed recovery checklist\" prompt.md; then",
		"  recovery_score=96",
		"fi",
		"if grep -q \"follow-up handoff map\" prompt.md; then",
		"  followup_score=96",
		"fi",
		"if grep -q \"escalation ladder\" prompt.md; then",
		"  escalation_score=96",
		"fi",
		"cat >\"$output\" <<EOF",
		"{",
		"  \"schemaVersion\": \"cautilus.scenario_results.v1\",",
		"  \"mode\": \"held_out\",",
		"  \"results\": [",
		"    {",
		"      \"scenarioId\": \"operator-recovery\",",
		"      \"status\": \"passed\",",
		"      \"overallScore\": $recovery_score,",
		"      \"telemetry\": {",
		"        \"cost_usd\": 0.05,",
		"        \"durationMs\": 1300",
		"      }",
		"    },",
		"    {",
		"      \"scenarioId\": \"operator-follow-up\",",
		"      \"status\": \"passed\",",
		"      \"overallScore\": $followup_score,",
		"      \"telemetry\": {",
		"        \"cost_usd\": 0.03,",
		"        \"durationMs\": 900",
		"      }",
		"    },",
		"    {",
		"      \"scenarioId\": \"operator-escalation\",",
		"      \"status\": \"passed\",",
		"      \"overallScore\": $escalation_score,",
		"      \"telemetry\": {",
		"        \"cost_usd\": 0.02,",
		"        \"durationMs\": 700",
		"      }",
		"    }",
		"  ]",
		"}",
		"EOF",
		"",
	}, "\n"))
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
		"prompt=$(cat)",
		"if printf '%s' \"$prompt\" | grep -q \"# Parent g1-merge-1-codex-exec\"; then",
		fmt.Sprintf("  printf '%%s\\n' '%s' > \"$out\"", toJSONString(map[string]any{
			"promptMarkdown":       "Keep recovery instructions explicit with a detailed recovery checklist, a follow-up handoff map, and an escalation ladder.\n",
			"rationaleSummary":     "Merge the complementary recovery, follow-up, and escalation strengths into one coherent prompt.",
			"expectedImprovements": []string{"operator-recovery", "operator-follow-up", "operator-escalation"},
			"preservedStrengths":   []string{"keeps the recovery checklist", "keeps the follow-up handoff map", "keeps the escalation ladder"},
			"riskNotes":            []string{"held-out should confirm the merged prompt stays concise"},
		})),
		"  exit 0",
		"fi",
		"if printf '%s' \"$prompt\" | grep -q \"# Parent seed\" && printf '%s' \"$prompt\" | grep -q \"# Parent g1-1-codex-exec\"; then",
		fmt.Sprintf("  printf '%%s\\n' '%s' > \"$out\"", toJSONString(map[string]any{
			"promptMarkdown":       "Keep recovery instructions explicit with an escalation ladder.\n",
			"rationaleSummary":     "Preserve the complementary escalation guidance as a bounded merge candidate.",
			"expectedImprovements": []string{"operator-escalation"},
			"preservedStrengths":   []string{"keeps the escalation ladder explicit"},
			"riskNotes":            []string{"operator-follow-up may still remain weak"},
		})),
		"  exit 0",
		"fi",
		fmt.Sprintf("printf '%%s\\n' '%s' > \"$out\"", toJSONString(map[string]any{
			"promptMarkdown":       "Keep recovery instructions explicit with a follow-up handoff map.\n",
			"rationaleSummary":     "Strengthen the follow-up path first.",
			"expectedImprovements": []string{"operator-follow-up"},
			"preservedStrengths":   []string{"keeps the original recovery framing"},
			"riskNotes":            []string{"recovery checklist detail may still remain weak"},
		})),
		"",
	}, "\n"))
	if err := os.WriteFile(filepath.Join(root, ".agents", "cautilus-adapter.yaml"), []byte(strings.Join([]string{
		"version: 1",
		"repo: temp-optimize-search",
		"evaluation_surfaces:",
		"  - prompt behavior",
		"baseline_options:",
		"  - baseline git ref in the same repo via {baseline_ref}",
		"required_prerequisites: []",
		"default_schema_file: fixtures/review.schema.json",
		"held_out_command_templates:",
		"  - sh evaluate.sh {scenario_results_file}",
		"comparison_questions:",
		"  - Did the held-out score improve?",
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
				"status":       "passed",
				"overallScore": 96,
				"telemetry": map[string]any{
					"cost_usd":   0.05,
					"durationMs": 1300,
				},
			},
			{
				"scenarioId":   "operator-follow-up",
				"status":       "failed",
				"overallScore": 40,
				"telemetry": map[string]any{
					"cost_usd":   0.03,
					"durationMs": 900,
				},
			},
			{
				"scenarioId":   "operator-escalation",
				"status":       "failed",
				"overallScore": 40,
				"telemetry": map[string]any{
					"cost_usd":   0.02,
					"durationMs": 700,
				},
			},
		},
	})
	writeJSONFile(t, optimizeInputPath, map[string]any{
		"schemaVersion":      contracts.OptimizeInputsSchema,
		"generatedAt":        "2026-04-19T04:10:00.000Z",
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
			"budget": "medium",
			"plan": map[string]any{
				"evidenceLimit":        4,
				"suggestedChangeLimit": 3,
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
			"generatedAt":   "2026-04-19T04:09:00.000Z",
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
			"telemetry":           map[string]any{"modeCount": 0},
			"improved":            []any{},
			"regressed":           []any{"operator-follow-up", "operator-escalation"},
			"unchanged":           []any{},
			"noisy":               []any{},
			"humanReviewFindings": []any{
				map[string]any{
					"severity": "concern",
					"message":  "The prompt still needs a follow-up handoff map and an escalation ladder without losing the checklist.",
				},
			},
			"recommendation": "defer",
		},
		"reviewSummaryFile":   filepath.Join(root, "review-summary.json"),
		"reviewSummary":       map[string]any{"variants": []any{}},
		"scenarioHistoryFile": filepath.Join(root, "history.json"),
		"scenarioHistory": map[string]any{
			"schemaVersion": contracts.ScenarioHistorySchema,
			"scenarioStats": map[string]any{
				"operator-recovery": map[string]any{
					"recentTrainResults": []any{
						map[string]any{"status": "failed", "overallScore": 80, "passRate": 0},
					},
				},
				"operator-follow-up": map[string]any{
					"recentTrainResults": []any{
						map[string]any{"status": "failed", "overallScore": 70, "passRate": 0},
					},
				},
				"operator-escalation": map[string]any{
					"recentTrainResults": []any{
						map[string]any{"status": "failed", "overallScore": 70, "passRate": 0},
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

	_, stderr, exitCode := runCLI(t, root, "optimize", "search", "prepare-input", "--optimize-input", optimizeInputPath, "--held-out-results-file", heldOutResultsPath, "--budget", "medium", "--output", searchInputPath)
	if exitCode != 0 {
		t.Fatalf("optimize search prepare-input failed: %s", stderr)
	}
	searchInput := readJSONObjectFile(t, searchInputPath)
	searchConfig := searchInput["searchConfig"].(map[string]any)
	searchConfig["generationLimit"] = float64(2)
	searchConfig["mergeEnabled"] = true
	searchConfig["threeParentPolicy"] = "coverage_expansion"
	mutationConfig := searchInput["mutationConfig"].(map[string]any)
	mutationConfig["backends"] = []any{
		map[string]any{
			"id":      "codex-mutate",
			"backend": "codex_exec",
		},
	}
	writeJSONFile(t, searchInputPath, searchInput)

	stdout, stderr, exitCode := runCLI(t, root, "optimize", "search", "run", "--input", searchInputPath, "--json")
	if exitCode != 0 {
		t.Fatalf("optimize search run failed: stdout=%s stderr=%s", stdout, stderr)
	}
	searchResult := map[string]any{}
	if err := json.Unmarshal([]byte(stdout), &searchResult); err != nil {
		t.Fatalf("json.Unmarshal returned error: %v", err)
	}
	if searchResult["status"] != "completed" {
		t.Fatalf("unexpected search result status: %#v", searchResult)
	}
	searchTelemetry := searchResult["searchTelemetry"].(map[string]any)
	if searchTelemetry["generationCount"] != float64(2) || searchTelemetry["mergeInvocationCount"] != float64(2) {
		t.Fatalf("expected two generations with two merge invocations, got %#v", searchTelemetry)
	}
	selectedCandidateID := searchResult["selectedCandidateId"].(string)
	if selectedCandidateID != "g2-merge-1-codex-exec" {
		t.Fatalf("expected second-generation merge finalist, got %#v from %#v", selectedCandidateID, searchResult)
	}
	registry := searchResult["candidateRegistry"].([]any)
	var selectedCandidate map[string]any
	for _, raw := range registry {
		candidate := raw.(map[string]any)
		if candidate["id"] == selectedCandidateID {
			selectedCandidate = candidate
			break
		}
	}
	if len(selectedCandidate) == 0 || selectedCandidate["origin"] != "merge" {
		t.Fatalf("expected selected merge candidate in registry, got %#v", registry)
	}
	parentIDs := selectedCandidate["parentCandidateIds"].([]any)
	if len(parentIDs) < 2 {
		t.Fatalf("expected bounded multi-parent merge candidate, got %#v", selectedCandidate)
	}
	mergePromptPath := selectedCandidate["artifacts"].(map[string]any)["promptFile"].(string)
	mergePrompt, err := os.ReadFile(mergePromptPath)
	if err != nil {
		t.Fatalf("ReadFile returned error: %v", err)
	}
	if !strings.Contains(string(mergePrompt), "# Parent g1-1-codex-exec") || !strings.Contains(string(mergePrompt), "# Parent g1-merge-1-codex-exec") {
		t.Fatalf("expected second-generation merge prompt to carry forward prior frontier strengths, got %q", string(mergePrompt))
	}
	selectedTargetPath := searchResult["proposalBridge"].(map[string]any)["selectedTargetFile"].(map[string]any)["path"].(string)
	selectedPrompt, err := os.ReadFile(selectedTargetPath)
	if err != nil {
		t.Fatalf("ReadFile returned error: %v", err)
	}
	if !strings.Contains(string(selectedPrompt), "detailed recovery checklist") || !strings.Contains(string(selectedPrompt), "follow-up handoff map") || !strings.Contains(string(selectedPrompt), "escalation ladder") {
		t.Fatalf("expected merged prompt to preserve all three strengths, got %q", string(selectedPrompt))
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
				"telemetry": map[string]any{
					"provider":          "anthropic",
					"model":             "claude-sonnet-4-6",
					"prompt_tokens":     1000,
					"completion_tokens": 400,
					"total_tokens":      1400,
					"cost_usd":          0.02,
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
	evaluations := summary["evaluations"].([]any)
	executionTelemetry := evaluations[1].(map[string]any)["telemetry"].(map[string]any)
	if executionTelemetry["model"] != "claude-sonnet-4-6" || executionTelemetry["cost_usd"] != 0.02 {
		t.Fatalf("unexpected skill evaluation telemetry: %#v", executionTelemetry)
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

func TestCLIInstructionSurfaceTestRunsAdapterCommandsAndWritesSummary(t *testing.T) {
	root := t.TempDir()
	adapterDir := filepath.Join(root, ".agents")
	fixtureDir := filepath.Join(root, "fixtures", "instruction-surface")
	outputDir := filepath.Join(root, "outputs")
	if err := os.MkdirAll(adapterDir, 0o755); err != nil {
		t.Fatalf("MkdirAll returned error: %v", err)
	}
	if err := os.MkdirAll(fixtureDir, 0o755); err != nil {
		t.Fatalf("MkdirAll returned error: %v", err)
	}
	scriptPath := filepath.Join(root, "instruction-surface-test.sh")
	script := `#!/bin/sh
cat <<'JSON' > "$1"
{
  "schemaVersion": "cautilus.instruction_surface_inputs.v1",
  "suiteId": "instruction-surface-demo",
  "evaluations": [
    {
      "evaluationId": "agents-routing",
      "displayName": "agents-routing",
      "prompt": "Read the repo instructions first and decide how to route this task.",
      "startedAt": "2026-04-18T00:00:00.000Z",
      "observationStatus": "observed",
      "summary": "Started from AGENTS.md, used discovery first as a bootstrap helper, and then selected the durable work skill.",
      "entryFile": "AGENTS.md",
      "loadedInstructionFiles": ["AGENTS.md"],
      "loadedSupportingFiles": ["docs/internal/handoff.md"],
      "routingDecision": {
        "selectedSkill": "impl",
        "bootstrapHelper": "find-skills",
        "workSkill": "impl",
        "firstToolCall": "find-skills --repo-root ."
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
      "requiredSupportingFiles": ["docs/internal/handoff.md"],
      "expectedRouting": {
        "bootstrapHelper": "find-skills",
        "workSkill": "impl",
        "firstToolCallPattern": "find-skills"
      },
      "artifactRefs": []
    }
  ]
}
JSON
`
	if err := os.WriteFile(scriptPath, []byte(script), 0o755); err != nil {
		t.Fatalf("WriteFile returned error: %v", err)
	}
	writeJSONFile(t, filepath.Join(fixtureDir, "cases.json"), map[string]any{
		"schemaVersion": contracts.InstructionSurfaceCasesSchema,
		"suiteId":       "instruction-surface-demo",
		"evaluations": []map[string]any{
			{
				"evaluationId":             "agents-routing",
				"prompt":                   "Read the repo instructions first and decide how to route this task.",
				"expectedEntryFile":        "AGENTS.md",
				"requiredInstructionFiles": []string{"AGENTS.md"},
				"requiredSupportingFiles":  []string{"docs/internal/handoff.md"},
				"expectedRouting": map[string]any{
					"bootstrapHelper":      "find-skills",
					"workSkill":            "impl",
					"firstToolCallPattern": "find-skills",
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
		"instruction_surface_cases_default: fixtures/instruction-surface/cases.json",
		"instruction_surface_test_command_templates:",
		"  - sh ./instruction-surface-test.sh {instruction_surface_input_file}",
		"",
	}, "\n")), 0o644); err != nil {
		t.Fatalf("WriteFile returned error: %v", err)
	}

	stdout, stderr, exitCode := runCLI(t, root, "instruction-surface", "test", "--repo-root", root, "--output-dir", outputDir)
	if exitCode != 0 {
		t.Fatalf("instruction-surface test failed: %s", stderr)
	}
	summaryPath := strings.TrimSpace(stdout)
	summary := readJSONObjectFile(t, summaryPath)
	if summary["schemaVersion"] != contracts.InstructionSurfaceSummarySchema || summary["recommendation"] != "accept-now" {
		t.Fatalf("unexpected instruction-surface summary: %#v", summary)
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
		{"instruction-surface-evaluate", []string{"instruction-surface", "evaluate"}, contracts.InstructionSurfaceInputsSchema},
		{"skill-evaluate", []string{"skill", "evaluate"}, contracts.SkillEvaluationInputsSchema},
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
