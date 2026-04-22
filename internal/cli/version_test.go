package cli

import (
	"os"
	"path/filepath"
	"testing"
)

func TestResolvePackageVersionPrefersEnvOverride(t *testing.T) {
	version, err := resolvePackageVersion("", "v1.2.3", "v2.3.4", "v9.8.7")
	if err != nil {
		t.Fatalf("resolvePackageVersion returned error: %v", err)
	}
	if version != "9.8.7" {
		t.Fatalf("expected env override, got %q", version)
	}
}

func TestResolvePackageVersionPrefersLinkedBuildVersion(t *testing.T) {
	version, err := resolvePackageVersion("", "v1.2.3", "v2.3.4", "")
	if err != nil {
		t.Fatalf("resolvePackageVersion returned error: %v", err)
	}
	if version != "1.2.3" {
		t.Fatalf("expected linked build version, got %q", version)
	}
}

func TestResolvePackageVersionUsesBuildInfoWithoutRepoRoot(t *testing.T) {
	version, err := resolvePackageVersion("", "", "v1.2.3", "")
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
	version, err := resolvePackageVersion(repoRoot, "", "(devel)", "")
	if err != nil {
		t.Fatalf("resolvePackageVersion returned error: %v", err)
	}
	if version != "0.2.0" {
		t.Fatalf("expected package.json version, got %q", version)
	}
}

func TestResolvePackageVersionErrorsWithoutAnyVersionSource(t *testing.T) {
	if _, err := resolvePackageVersion("", "", "(devel)", ""); err == nil {
		t.Fatal("expected an error when no version source exists")
	}
}

func TestResolveVersionInfoLabelsEnvSource(t *testing.T) {
	info, err := resolveVersionInfo("", "v1.2.3", "v2.3.4", "v9.8.7", "/tmp/cautilus")
	if err != nil {
		t.Fatalf("resolveVersionInfo returned error: %v", err)
	}
	if info.Version != "9.8.7" {
		t.Fatalf("expected env override, got %q", info.Version)
	}
	if info.Source != VersionSourceEnv {
		t.Fatalf("expected env source, got %q", info.Source)
	}
}

func TestResolveVersionInfoDetectsSourceCheckoutFromPackageJSON(t *testing.T) {
	repoRoot := t.TempDir()
	if err := os.WriteFile(filepath.Join(repoRoot, "package.json"), []byte("{\"version\":\"0.2.0\"}\n"), 0o644); err != nil {
		t.Fatalf("WriteFile returned error: %v", err)
	}
	info, err := resolveVersionInfo(repoRoot, "", "(devel)", "", filepath.Join(repoRoot, "bin", "cautilus"))
	if err != nil {
		t.Fatalf("resolveVersionInfo returned error: %v", err)
	}
	if info.Source != VersionSourcePackage {
		t.Fatalf("expected package source, got %q", info.Source)
	}
	if info.InstallKind != InstallKindSourceCheckout {
		t.Fatalf("expected source checkout install kind, got %q", info.InstallKind)
	}
}

func TestResolveVersionInfoTreatsCellarBinaryAsStandaloneInstall(t *testing.T) {
	info, err := resolveVersionInfo("", "v1.2.3", "(devel)", "", "/opt/homebrew/Cellar/cautilus/0.2.0/bin/cautilus")
	if err != nil {
		t.Fatalf("resolveVersionInfo returned error: %v", err)
	}
	if info.InstallKind != InstallKindStandalone {
		t.Fatalf("expected standalone install kind, got %q", info.InstallKind)
	}
}

func TestCompareVersionsOrdersStableSemver(t *testing.T) {
	if CompareVersions("1.2.3", "1.2.4") >= 0 {
		t.Fatal("expected 1.2.3 to be older than 1.2.4")
	}
	if CompareVersions("1.2.4", "1.2.3") <= 0 {
		t.Fatal("expected 1.2.4 to be newer than 1.2.3")
	}
	if CompareVersions("1.2.3", "1.2.3") != 0 {
		t.Fatal("expected equal versions to compare the same")
	}
}
