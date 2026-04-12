package cli

import (
	"context"
	"path/filepath"
	"strings"
	"testing"
	"time"
)

func TestInspectVersionStateRecordsCurrentVersionWithoutRemoteCheck(t *testing.T) {
	t.Setenv("CAUTILUS_VERSION", "v1.2.3")
	cachePath := filepath.Join(t.TempDir(), "version-state.json")
	now := time.Date(2026, time.April, 12, 7, 0, 0, 0, time.UTC)

	state, err := InspectVersionState("", VersionStateOptions{
		Now:       now,
		CachePath: cachePath,
	})
	if err != nil {
		t.Fatalf("InspectVersionState returned error: %v", err)
	}
	if state.Current.Version != "1.2.3" {
		t.Fatalf("expected version 1.2.3, got %q", state.Current.Version)
	}
	if state.UpdateCheck != nil {
		t.Fatalf("expected no update check, got %#v", state.UpdateCheck)
	}
	cached, ok := loadVersionState(cachePath)
	if !ok {
		t.Fatal("expected version state to be cached")
	}
	if cached.Current.Version != "1.2.3" {
		t.Fatalf("expected cached version 1.2.3, got %q", cached.Current.Version)
	}
}

func TestInspectVersionStateUsesFreshCacheWithinTTL(t *testing.T) {
	t.Setenv("CAUTILUS_VERSION", "v1.2.3")
	cachePath := filepath.Join(t.TempDir(), "version-state.json")
	now := time.Date(2026, time.April, 12, 7, 0, 0, 0, time.UTC)
	if err := saveVersionState(cachePath, VersionState{
		SchemaVersion: versionStateSchemaVersion,
		RecordedAt:    now.Add(-time.Hour).Format(time.RFC3339),
		Current:       VersionInfo{Version: "1.2.3", Source: VersionSourceEnv, InstallKind: InstallKindStandalone},
		UpdateCheck: &UpdateCheck{
			CheckedAt:     now.Add(-time.Hour).Format(time.RFC3339),
			LatestVersion: "1.2.4",
			ReleaseURL:    "https://example.invalid/releases/v1.2.4",
		},
	}); err != nil {
		t.Fatalf("saveVersionState returned error: %v", err)
	}

	fetchCalls := 0
	state, err := InspectVersionState("", VersionStateOptions{
		Now:              now,
		CachePath:        cachePath,
		AllowRemoteCheck: true,
		FetchLatest: func(ctx context.Context) (ReleaseMetadata, error) {
			fetchCalls += 1
			return ReleaseMetadata{Version: "1.2.5", ReleaseURL: "https://example.invalid/releases/v1.2.5"}, nil
		},
	})
	if err != nil {
		t.Fatalf("InspectVersionState returned error: %v", err)
	}
	if fetchCalls != 0 {
		t.Fatalf("expected cached state to avoid a remote fetch, got %d calls", fetchCalls)
	}
	if state.UpdateCheck == nil || state.UpdateCheck.LatestVersion != "1.2.4" {
		t.Fatalf("expected cached update check, got %#v", state.UpdateCheck)
	}
	if state.UpdateCheck.Status != UpdateStatusUpdateAvailable {
		t.Fatalf("expected update_available status, got %q", state.UpdateCheck.Status)
	}
}

func TestInspectVersionStateRefreshesStaleCache(t *testing.T) {
	t.Setenv("CAUTILUS_VERSION", "v1.2.3")
	cachePath := filepath.Join(t.TempDir(), "version-state.json")
	now := time.Date(2026, time.April, 12, 7, 0, 0, 0, time.UTC)
	if err := saveVersionState(cachePath, VersionState{
		SchemaVersion: versionStateSchemaVersion,
		RecordedAt:    now.Add(-48 * time.Hour).Format(time.RFC3339),
		Current:       VersionInfo{Version: "1.2.3", Source: VersionSourceEnv, InstallKind: InstallKindStandalone},
		UpdateCheck: &UpdateCheck{
			CheckedAt:     now.Add(-48 * time.Hour).Format(time.RFC3339),
			LatestVersion: "1.2.4",
			ReleaseURL:    "https://example.invalid/releases/v1.2.4",
		},
	}); err != nil {
		t.Fatalf("saveVersionState returned error: %v", err)
	}

	fetchCalls := 0
	state, err := InspectVersionState("", VersionStateOptions{
		Now:              now,
		CachePath:        cachePath,
		AllowRemoteCheck: true,
		FetchLatest: func(ctx context.Context) (ReleaseMetadata, error) {
			fetchCalls += 1
			return ReleaseMetadata{Version: "1.2.5", ReleaseURL: "https://example.invalid/releases/v1.2.5"}, nil
		},
	})
	if err != nil {
		t.Fatalf("InspectVersionState returned error: %v", err)
	}
	if fetchCalls != 1 {
		t.Fatalf("expected one remote fetch, got %d", fetchCalls)
	}
	if state.UpdateCheck == nil || state.UpdateCheck.LatestVersion != "1.2.5" {
		t.Fatalf("expected refreshed update check, got %#v", state.UpdateCheck)
	}
}

func TestMaybeCheckForUpdatesSkipsNonInteractiveSessions(t *testing.T) {
	t.Setenv("CAUTILUS_VERSION", "v1.2.3")
	fetchCalls := 0
	notice, err := MaybeCheckForUpdates("", AutoUpdateOptions{
		Now:         time.Date(2026, time.April, 12, 7, 0, 0, 0, time.UTC),
		Interactive: false,
		FetchLatest: func(ctx context.Context) (ReleaseMetadata, error) {
			fetchCalls += 1
			return ReleaseMetadata{Version: "1.2.4", ReleaseURL: "https://example.invalid/releases/v1.2.4"}, nil
		},
	})
	if err != nil {
		t.Fatalf("MaybeCheckForUpdates returned error: %v", err)
	}
	if notice != "" {
		t.Fatalf("expected no notice, got %q", notice)
	}
	if fetchCalls != 0 {
		t.Fatalf("expected no remote fetch, got %d calls", fetchCalls)
	}
}

func TestMaybeCheckForUpdatesReturnsInstallAwareNotice(t *testing.T) {
	t.Setenv("CAUTILUS_VERSION", "v1.2.3")
	notice, err := MaybeCheckForUpdates("", AutoUpdateOptions{
		Now:         time.Date(2026, time.April, 12, 7, 0, 0, 0, time.UTC),
		Interactive: true,
		CachePath:   filepath.Join(t.TempDir(), "version-state.json"),
		FetchLatest: func(ctx context.Context) (ReleaseMetadata, error) {
			return ReleaseMetadata{Version: "1.2.4", ReleaseURL: "https://example.invalid/releases/v1.2.4"}, nil
		},
	})
	if err != nil {
		t.Fatalf("MaybeCheckForUpdates returned error: %v", err)
	}
	if !strings.Contains(notice, "Update available: v1.2.3 -> v1.2.4") {
		t.Fatalf("expected update notice, got %q", notice)
	}
	if !strings.Contains(notice, "install.sh") {
		t.Fatalf("expected install-sh guidance, got %q", notice)
	}
}

func TestMaybeCheckForUpdatesHonorsOptOut(t *testing.T) {
	t.Setenv("CAUTILUS_VERSION", "v1.2.3")
	t.Setenv(updateCheckEnvOptOut, "1")
	fetchCalls := 0
	notice, err := MaybeCheckForUpdates("", AutoUpdateOptions{
		Now:         time.Date(2026, time.April, 12, 7, 0, 0, 0, time.UTC),
		Interactive: true,
		FetchLatest: func(ctx context.Context) (ReleaseMetadata, error) {
			fetchCalls += 1
			return ReleaseMetadata{Version: "1.2.4", ReleaseURL: "https://example.invalid/releases/v1.2.4"}, nil
		},
	})
	if err != nil {
		t.Fatalf("MaybeCheckForUpdates returned error: %v", err)
	}
	if notice != "" {
		t.Fatalf("expected no notice, got %q", notice)
	}
	if fetchCalls != 0 {
		t.Fatalf("expected no remote fetch, got %d calls", fetchCalls)
	}
}
