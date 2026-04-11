package cli

import (
	"os"
	"path/filepath"
	"testing"
)

func TestResolvePackageVersionPrefersEnvOverride(t *testing.T) {
	version, err := resolvePackageVersion("", "v1.2.3", "v9.8.7")
	if err != nil {
		t.Fatalf("resolvePackageVersion returned error: %v", err)
	}
	if version != "9.8.7" {
		t.Fatalf("expected env override, got %q", version)
	}
}

func TestResolvePackageVersionUsesBuildInfoWithoutRepoRoot(t *testing.T) {
	version, err := resolvePackageVersion("", "v1.2.3", "")
	if err != nil {
		t.Fatalf("resolvePackageVersion returned error: %v", err)
	}
	if version != "1.2.3" {
		t.Fatalf("expected build info version, got %q", version)
	}
}

func TestResolvePackageVersionFallsBackToPackageJSON(t *testing.T) {
	repoRoot := t.TempDir()
	if err := os.WriteFile(filepath.Join(repoRoot, "package.json"), []byte("{\"version\":\"0.2.0\"}\n"), 0o644); err != nil {
		t.Fatalf("WriteFile returned error: %v", err)
	}
	version, err := resolvePackageVersion(repoRoot, "(devel)", "")
	if err != nil {
		t.Fatalf("resolvePackageVersion returned error: %v", err)
	}
	if version != "0.2.0" {
		t.Fatalf("expected package.json version, got %q", version)
	}
}

func TestResolvePackageVersionErrorsWithoutAnyVersionSource(t *testing.T) {
	if _, err := resolvePackageVersion("", "(devel)", ""); err == nil {
		t.Fatal("expected an error when no version source exists")
	}
}
