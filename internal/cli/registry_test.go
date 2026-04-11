package cli

import (
	"os"
	"path/filepath"
	"slices"
	"strings"
	"testing"
)

func TestMatchCommandPrefersLongestPath(t *testing.T) {
	match, err := MatchCommand([]string{"scenario", "normalize", "cli", "--input", "fixture.json"})
	if err != nil {
		t.Fatalf("MatchCommand returned error: %v", err)
	}
	if match == nil {
		t.Fatal("expected a command match")
	}
	if !slices.Equal(match.Command.Path, []string{"scenario", "normalize", "cli"}) {
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

func TestRenderUsageIncludesSkillsInstall(t *testing.T) {
	usage, err := RenderUsage()
	if err != nil {
		t.Fatalf("RenderUsage returned error: %v", err)
	}
	if !strings.Contains(usage, "cautilus skills install [--overwrite]") {
		t.Fatalf("usage missing skills install line:\n%s", usage)
	}
	if !strings.Contains(usage, "cautilus review variants --repo-root . --workspace . --output-dir /tmp/cautilus-review") {
		t.Fatalf("usage missing review variants example:\n%s", usage)
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

func TestScriptPathUsesRepoRoot(t *testing.T) {
	path := ScriptPath("/tmp/cautilus", CommandEntry{Script: "scripts/doctor.mjs"})
	if path != filepath.Join("/tmp/cautilus", "scripts", "doctor.mjs") {
		t.Fatalf("unexpected script path: %s", path)
	}
}
