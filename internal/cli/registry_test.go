package cli

import (
	"os"
	"path/filepath"
	"slices"
	"strings"
	"testing"
)

func TestMatchCommandPrefersLongestPath(t *testing.T) {
	match, err := MatchCommand([]string{"scenario", "normalize", "skill", "--input", "fixture.json"})
	if err != nil {
		t.Fatalf("MatchCommand returned error: %v", err)
	}
	if match == nil {
		t.Fatal("expected a command match")
	}
	if !slices.Equal(match.Command.Path, []string{"scenario", "normalize", "skill"}) {
		t.Fatalf("unexpected path: %#v", match.Command.Path)
	}
	if !slices.Equal(match.ForwardedArgs, []string{"--input", "fixture.json"}) {
		t.Fatalf("unexpected forwarded args: %#v", match.ForwardedArgs)
	}
}

func TestMatchCommandReturnsNilForUnknownCommand(t *testing.T) {
	match, err := MatchCommand([]string{"workspace", "explode"})
	if err != nil {
		t.Fatalf("MatchCommand returned error: %v", err)
	}
	if match != nil {
		t.Fatalf("expected nil match, got %#v", match)
	}
}

func TestRenderUsageIncludesLifecycleCommands(t *testing.T) {
	usage, err := RenderUsage()
	if err != nil {
		t.Fatalf("RenderUsage returned error: %v", err)
	}
	if !strings.Contains(usage, "cautilus commands [--json]") {
		t.Fatalf("usage missing commands line:\n%s", usage)
	}
	if !strings.Contains(usage, "cautilus healthcheck [--json]") {
		t.Fatalf("usage missing healthcheck line:\n%s", usage)
	}
	if !strings.Contains(usage, "cautilus install [--repo-root <path>] [--overwrite] [--json]") {
		t.Fatalf("usage missing install line:\n%s", usage)
	}
	if !strings.Contains(usage, "cautilus skills install [--overwrite]") {
		t.Fatalf("usage missing skills install line:\n%s", usage)
	}
	if !strings.Contains(usage, "cautilus update [--repo-root <path>] [--json]") {
		t.Fatalf("usage missing update line:\n%s", usage)
	}
	if !strings.Contains(usage, "cautilus eval test --repo-root . --adapter-name self-dogfood-eval --fixture ./fixtures/eval/whole-repo/checked-in-agents-routing.fixture.json") {
		t.Fatalf("usage missing eval test example:\n%s", usage)
	}
	if !strings.Contains(usage, "cautilus eval evaluate --input ./eval-observed.json") {
		t.Fatalf("usage missing eval evaluate example:\n%s", usage)
	}
	if !strings.Contains(usage, "cautilus skill test --repo-root . --adapter-name self-dogfood-skill-test") {
		t.Fatalf("usage missing skill test example:\n%s", usage)
	}
	if !strings.Contains(usage, "cautilus skill evaluate --input ./fixtures/skill-evaluation/input.json") {
		t.Fatalf("usage missing skill evaluate example:\n%s", usage)
	}
	if !strings.Contains(usage, "cautilus review variants --repo-root . --workspace . --prompt-file ./review.md --schema-file ./schema.json --output-dir /tmp/cautilus-review") {
		t.Fatalf("usage missing review variants example:\n%s", usage)
	}
}

func TestRenderTopicUsageIncludesLeafCommandUsageAndExamples(t *testing.T) {
	usage, err := RenderTopicUsage([]string{"doctor"})
	if err != nil {
		t.Fatalf("RenderTopicUsage returned error: %v", err)
	}
	if !strings.Contains(usage, "cautilus doctor [args]") {
		t.Fatalf("topic usage missing doctor usage:\n%s", usage)
	}
	if !strings.Contains(usage, "cautilus doctor --repo-root .") {
		t.Fatalf("topic usage missing doctor example:\n%s", usage)
	}
	if !strings.Contains(usage, "named adapters under `.agents/cautilus-adapters/`") {
		t.Fatalf("topic usage missing doctor named-adapter note:\n%s", usage)
	}
}

func TestRenderTopicUsageIncludesGroupedSubcommandsForPrefixes(t *testing.T) {
	usage, err := RenderTopicUsage([]string{"optimize", "search"})
	if err != nil {
		t.Fatalf("RenderTopicUsage returned error: %v", err)
	}
	if !strings.Contains(usage, "cautilus optimize search prepare-input [args]") {
		t.Fatalf("topic usage missing optimize search prepare-input usage:\n%s", usage)
	}
	if !strings.Contains(usage, "Subcommands:") {
		t.Fatalf("topic usage missing subcommands section:\n%s", usage)
	}
	if !strings.Contains(usage, "cautilus optimize search run") {
		t.Fatalf("topic usage missing optimize search run subcommand:\n%s", usage)
	}
}

func TestRenderTopicUsageIncludesCommandNotes(t *testing.T) {
	usage, err := RenderTopicUsage([]string{"review", "prepare-input"})
	if err != nil {
		t.Fatalf("RenderTopicUsage returned error: %v", err)
	}
	if !strings.Contains(usage, "cautilus report build --example-input") {
		t.Fatalf("topic usage missing report example-input note:\n%s", usage)
	}
	if !strings.Contains(usage, "\"severity\": \"concern\"") {
		t.Fatalf("topic usage missing humanReviewFindings shape note:\n%s", usage)
	}
}

func TestRenderTopicUsageShowsAdHocReviewVariantsPath(t *testing.T) {
	usage, err := RenderTopicUsage([]string{"review", "variants"})
	if err != nil {
		t.Fatalf("RenderTopicUsage returned error: %v", err)
	}
	if !strings.Contains(usage, "--prompt-file <review.md> --schema-file <schema.json>") {
		t.Fatalf("topic usage missing ad-hoc prompt/schema path:\n%s", usage)
	}
	if !strings.Contains(usage, "ad-hoc bounded review") {
		t.Fatalf("topic usage missing ad-hoc review note:\n%s", usage)
	}
}

func TestDecodeRegistryRejectsUnknownCommandFields(t *testing.T) {
	var registry Registry
	err := decodeRegistry([]byte(`{
		"groups": [{"id": "setup", "label": "Set up and check a repo"}],
		"commands": [
			{
				"path": ["skills", "install"],
				"group": "setup",
				"usage": "cautilus skills install [--overwrite]",
				"example": "cautilus skills install",
				"script": "scripts/install-skills.mjs"
			}
		]
	}`), &registry)
	if err == nil {
		t.Fatal("expected decodeRegistry to reject unknown fields")
	}
	if !strings.Contains(err.Error(), "unknown field") {
		t.Fatalf("expected unknown field error, got %v", err)
	}
}

func TestRenderUsageGroupsCommandsByPurpose(t *testing.T) {
	usage, err := RenderUsage()
	if err != nil {
		t.Fatalf("RenderUsage returned error: %v", err)
	}
	expectedGroups := []string{
		"Run an evaluation scenario:",
		"Set up and check a repo:",
		"Turn results into next moves:",
		"Introspection:",
	}
	previousIndex := -1
	for _, label := range expectedGroups {
		index := strings.Index(usage, label)
		if index < 0 {
			t.Fatalf("usage missing group label %q:\n%s", label, usage)
		}
		if index <= previousIndex {
			t.Fatalf("group %q appears out of order:\n%s", label, usage)
		}
		previousIndex = index
	}
	runIndex := strings.Index(usage, "Run an evaluation scenario:")
	setupIndex := strings.Index(usage, "Set up and check a repo:")
	scenarioLine := strings.Index(usage, "cautilus scenario normalize chatbot [args]")
	installLine := strings.Index(usage, "cautilus install [--repo-root <path>] [--overwrite] [--json]")
	if scenarioLine < runIndex || scenarioLine > setupIndex {
		t.Fatalf("expected scenario normalize chatbot to sit inside the run group:\n%s", usage)
	}
	if installLine < setupIndex {
		t.Fatalf("expected install to sit inside the setup group:\n%s", usage)
	}
}

func TestLoadRegistryAssignsKnownGroupToEveryCommand(t *testing.T) {
	loaded, err := LoadRegistry()
	if err != nil {
		t.Fatalf("LoadRegistry returned error: %v", err)
	}
	if len(loaded.Groups) == 0 {
		t.Fatal("expected registry to declare groups")
	}
	knownGroups := map[string]struct{}{}
	for _, group := range loaded.Groups {
		knownGroups[group.ID] = struct{}{}
	}
	for _, command := range loaded.Commands {
		if _, ok := knownGroups[command.Group]; !ok {
			t.Fatalf("command %v references unknown group %q", command.Path, command.Group)
		}
		if command.Usage == "" || command.Example == "" {
			t.Fatalf("command %v missing usage or example", command.Path)
		}
	}
}

func TestFindRepoRootFromNestedPath(t *testing.T) {
	wd := t.TempDir()
	repoRoot := filepath.Join(wd, "repo")
	paths := []string{
		"package.json",
		"bin/cautilus",
		"scripts/.keep",
		"skills/cautilus/SKILL.md",
		"internal/cli/command-registry.json",
	}
	for _, relativePath := range paths {
		fullPath := filepath.Join(repoRoot, filepath.FromSlash(relativePath))
		if err := os.MkdirAll(filepath.Dir(fullPath), 0o755); err != nil {
			t.Fatalf("MkdirAll returned error: %v", err)
		}
		if err := os.WriteFile(fullPath, []byte("x\n"), 0o644); err != nil {
			t.Fatalf("WriteFile returned error: %v", err)
		}
	}
	nested := filepath.Join(repoRoot, "scripts", "agent-runtime")
	if err := os.MkdirAll(nested, 0o755); err != nil {
		t.Fatalf("MkdirAll returned error: %v", err)
	}
	resolved, err := FindRepoRoot(nested)
	if err != nil {
		t.Fatalf("FindRepoRoot returned error: %v", err)
	}
	if resolved != repoRoot {
		t.Fatalf("expected %s, got %s", repoRoot, resolved)
	}
}
