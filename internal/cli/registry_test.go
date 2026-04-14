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
	if !strings.Contains(usage, "cautilus skill test --repo-root . --adapter-name self-dogfood-skill-test") {
		t.Fatalf("usage missing skill test example:\n%s", usage)
	}
	if !strings.Contains(usage, "cautilus skill evaluate --input ./fixtures/skill-evaluation/input.json") {
		t.Fatalf("usage missing skill evaluate example:\n%s", usage)
	}
	if !strings.Contains(usage, "cautilus review variants --repo-root . --workspace . --output-dir /tmp/cautilus-review") {
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

func TestDecodeRegistryRejectsUnknownCommandFields(t *testing.T) {
	var registry Registry
	err := decodeRegistry([]byte(`{
		"usage": ["cautilus doctor [args]"],
		"examples": ["cautilus doctor --repo-root ."],
		"commands": [
			{
				"path": ["skills", "install"],
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
