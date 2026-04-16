package app

import (
	"bytes"
	"encoding/json"
	"os"
	"path/filepath"
	"strings"
	"testing"

	"github.com/corca-ai/cautilus/internal/cli"
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
		"iterate_command_templates:",
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

func TestRunAdapterInitSkillScenarioPrefillsSkillTestSlot(t *testing.T) {
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
	if !strings.Contains(yaml, "skill_test_command_templates:") || !strings.Contains(yaml, "- cautilus skill test") {
		t.Fatalf("expected skill_test_command_templates to be pre-filled, got:\n%s", yaml)
	}
	if !strings.Contains(yaml, "skill_cases_default: fixtures/skill-test/cases.json") {
		t.Fatalf("expected skill_cases_default to be set, got:\n%s", yaml)
	}
}

func TestRunAdapterInitChatbotScenarioPrefillsIterateSlot(t *testing.T) {
	repoRoot := t.TempDir()
	t.Setenv("CAUTILUS_CALLER_CWD", repoRoot)
	t.Setenv("CAUTILUS_TOOL_ROOT", "")

	var stdout bytes.Buffer
	var stderr bytes.Buffer
	exitCode := Run([]string{"adapter", "init", "--repo-root", repoRoot, "--scenario", "chatbot"}, &stdout, &stderr)
	if exitCode != 0 {
		t.Fatalf("expected exit code 0, got %d, stderr=%s", exitCode, stderr.String())
	}
	contents, err := os.ReadFile(filepath.Join(repoRoot, ".agents", "cautilus-adapter.yaml"))
	if err != nil {
		t.Fatalf("ReadFile returned error: %v", err)
	}
	yaml := string(contents)
	if !strings.Contains(yaml, "iterate_command_templates:") || !strings.Contains(yaml, "- cautilus scenario normalize chatbot") {
		t.Fatalf("expected iterate_command_templates to carry a chatbot-archetype command, got:\n%s", yaml)
	}
}

func TestRunAdapterInitWorkflowScenarioPrefillsIterateSlot(t *testing.T) {
	repoRoot := t.TempDir()
	t.Setenv("CAUTILUS_CALLER_CWD", repoRoot)
	t.Setenv("CAUTILUS_TOOL_ROOT", "")

	var stdout bytes.Buffer
	var stderr bytes.Buffer
	exitCode := Run([]string{"adapter", "init", "--repo-root", repoRoot, "--scenario", "workflow"}, &stdout, &stderr)
	if exitCode != 0 {
		t.Fatalf("expected exit code 0, got %d, stderr=%s", exitCode, stderr.String())
	}
	contents, err := os.ReadFile(filepath.Join(repoRoot, ".agents", "cautilus-adapter.yaml"))
	if err != nil {
		t.Fatalf("ReadFile returned error: %v", err)
	}
	yaml := string(contents)
	if !strings.Contains(yaml, "iterate_command_templates:") || !strings.Contains(yaml, "- cautilus scenario normalize workflow") {
		t.Fatalf("expected iterate_command_templates to carry a workflow-archetype command, got:\n%s", yaml)
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
	)

	if status := result["status"]; status != "passed" {
		t.Fatalf("expected passed status, got %#v", result)
	}
	if stdout := result["stdout"]; stdout != "|" {
		t.Fatalf("expected shim env to be scrubbed, got %#v", stdout)
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
