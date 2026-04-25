package cli

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"os"
	"path/filepath"
	"strings"
	"time"
)

const (
	versionStateSchemaVersion = "cautilus.version_state.v1"
	versionStateFilename      = "version-state.json"
	updateCheckEnvOptOut      = "CAUTILUS_NO_UPDATE_CHECK"
	defaultReleaseRepo        = "corca-ai/cautilus"
	defaultUpdateCheckTTL     = 24 * time.Hour
	defaultUpdateCheckTimeout = 1500 * time.Millisecond
)

type UpdateStatus string

const (
	UpdateStatusCurrent         UpdateStatus = "current"
	UpdateStatusUpdateAvailable UpdateStatus = "update_available"
	UpdateStatusUnknown         UpdateStatus = "unknown"
)

type ReleaseMetadata struct {
	Version    string
	ReleaseURL string
}

type UpdateCheck struct {
	CheckedAt     string       `json:"checkedAt,omitempty"`
	LatestVersion string       `json:"latestVersion,omitempty"`
	ReleaseURL    string       `json:"releaseUrl,omitempty"`
	Status        UpdateStatus `json:"status,omitempty"`
	UpgradeHint   string       `json:"upgradeHint,omitempty"`
}

type ProductArchetypeSummary struct {
	Archetype  string `json:"archetype"`
	UseWhen    string `json:"useWhen"`
	EntryPoint string `json:"entryPoint"`
}

type ProductSurfaceSummary struct {
	Summary            string                    `json:"summary"`
	BestFor            []string                  `json:"bestFor,omitempty"`
	Archetypes         []ProductArchetypeSummary `json:"archetypes,omitempty"`
	DecisionLoop       []string                  `json:"decisionLoop,omitempty"`
	ReportSurface      []string                  `json:"reportSurface,omitempty"`
	CurrentSurfaceNote []string                  `json:"currentSurfaceNote,omitempty"`
}

type VersionState struct {
	SchemaVersion string                `json:"schemaVersion"`
	RecordedAt    string                `json:"recordedAt"`
	Current       VersionInfo           `json:"current"`
	UpdateCheck   *UpdateCheck          `json:"updateCheck,omitempty"`
	Product       ProductSurfaceSummary `json:"product"`
}

type VersionStateOptions struct {
	Now              time.Time
	CachePath        string
	AllowRemoteCheck bool
	ForceRemoteCheck bool
	FetchLatest      func(ctx context.Context) (ReleaseMetadata, error)
	Timeout          time.Duration
}

type AutoUpdateOptions struct {
	Now         time.Time
	CachePath   string
	Interactive bool
	FetchLatest func(ctx context.Context) (ReleaseMetadata, error)
	Timeout     time.Duration
}

func InspectVersionState(toolRoot string, options VersionStateOptions) (VersionState, error) {
	current, err := PackageVersionInfo(toolRoot)
	if err != nil {
		return VersionState{}, err
	}

	now := options.Now.UTC()
	if now.IsZero() {
		now = time.Now().UTC()
	}
	state := VersionState{
		SchemaVersion: versionStateSchemaVersion,
		RecordedAt:    now.Format(time.RFC3339),
		Current:       current,
		Product:       currentProductSurfaceSummary(),
	}

	cachePath := options.CachePath
	if cachePath == "" {
		cachePath, _ = versionStatePath()
	}
	if cachePath != "" {
		if cached, ok := loadVersionState(cachePath); ok {
			state.UpdateCheck = assessUpdateCheck(cached.UpdateCheck, current)
		}
	}

	if options.AllowRemoteCheck || options.ForceRemoteCheck {
		shouldRefresh := options.ForceRemoteCheck || updateCheckExpired(state.UpdateCheck, now)
		if shouldRefresh {
			latest, fetchErr := fetchReleaseMetadata(options)
			if fetchErr == nil {
				state.UpdateCheck = assessUpdateCheck(&UpdateCheck{
					CheckedAt:     now.Format(time.RFC3339),
					LatestVersion: latest.Version,
					ReleaseURL:    latest.ReleaseURL,
				}, current)
			}
		}
	}

	if cachePath != "" {
		_ = saveVersionState(cachePath, state)
	}
	return state, nil
}

func currentProductSurfaceSummary() ProductSurfaceSummary {
	return ProductSurfaceSummary{
		Summary: "Repo-local contract layer for intentful agent, skill, and workflow evaluation.",
		BestFor: []string{
			"agent runtimes or chatbot loops whose prompts and wrappers change frequently",
			"repo-owned skills that need protected validation instead of trigger-only smoke checks",
			"operators who want review-ready compare evidence before accepting workflow changes",
		},
		Archetypes: []ProductArchetypeSummary{
			{
				Archetype:  "chatbot",
				UseWhen:    "a multi-turn assistant gets worse after a prompt or wrapper change",
				EntryPoint: "cautilus scenario normalize chatbot --input <conversation-logs.json>",
			},
			{
				Archetype:  "skill",
				UseWhen:    "a checked-in skill or agent should still trigger, execute, and validate cleanly",
				EntryPoint: "cautilus eval test --repo-root . --adapter-name <name>",
			},
			{
				Archetype:  "workflow",
				UseWhen:    "a stateful automation keeps stalling on the same recovery step",
				EntryPoint: "cautilus scenario normalize workflow --input <workflow-runs.json>",
			},
		},
		DecisionLoop: []string{
			"normalize or evaluate one bounded behavior surface",
			"run held-out or full-gate evaluation against an explicit baseline",
			"turn the result into report, review, evidence, or bounded optimization input",
		},
		ReportSurface: []string{
			"report.json stays the first machine-readable decision surface",
			"mode summaries can distinguish comparison-backed rejection from pure execution failure",
			"report reasonCodes and warnings can surface provider-rate-limit contamination from persisted artifacts",
			"review build-prompt-input and review variants carry those warnings forward for human or agent review",
		},
		CurrentSurfaceNote: []string{
			"inspect report.json reasonCodes and warnings before treating reject as a clean regression",
			"use cautilus scenarios or the bundled skill when the right archetype is unclear",
		},
	}
}

func MaybeCheckForUpdates(toolRoot string, options AutoUpdateOptions) (string, error) {
	current, err := PackageVersionInfo(toolRoot)
	if err != nil {
		return "", err
	}
	if !shouldAutoCheckForUpdates(current, options.Interactive, os.Getenv("CI") != "", os.Getenv(updateCheckEnvOptOut) == "1") {
		return "", nil
	}
	state, err := InspectVersionState(toolRoot, VersionStateOptions{
		Now:              options.Now,
		CachePath:        options.CachePath,
		AllowRemoteCheck: true,
		FetchLatest:      options.FetchLatest,
		Timeout:          options.Timeout,
	})
	if err != nil {
		return "", err
	}
	if state.UpdateCheck == nil || state.UpdateCheck.Status != UpdateStatusUpdateAvailable {
		return "", nil
	}
	return fmt.Sprintf(
		"Update available: v%s -> v%s (%s)",
		state.Current.Version,
		state.UpdateCheck.LatestVersion,
		state.UpdateCheck.UpgradeHint,
	), nil
}

func shouldAutoCheckForUpdates(current VersionInfo, interactive bool, isCI bool, optedOut bool) bool {
	if !interactive || isCI || optedOut {
		return false
	}
	switch current.InstallKind {
	case InstallKindInstallScript, InstallKindStandalone:
		return true
	default:
		return false
	}
}

func assessUpdateCheck(check *UpdateCheck, current VersionInfo) *UpdateCheck {
	if check == nil {
		return nil
	}
	assessed := *check
	if normalizeVersionString(assessed.LatestVersion) == "" {
		assessed.Status = UpdateStatusUnknown
		assessed.UpgradeHint = ""
		return &assessed
	}
	if CompareVersions(assessed.LatestVersion, current.Version) > 0 {
		assessed.Status = UpdateStatusUpdateAvailable
		assessed.UpgradeHint = upgradeHint(current.InstallKind)
		return &assessed
	}
	assessed.Status = UpdateStatusCurrent
	assessed.UpgradeHint = ""
	return &assessed
}

func upgradeHint(kind InstallKind) string {
	switch kind {
	case InstallKindInstallScript, InstallKindStandalone:
		return "rerun install.sh from the latest tagged release"
	default:
		return "download the latest tagged release"
	}
}

func updateCheckExpired(check *UpdateCheck, now time.Time) bool {
	if check == nil || strings.TrimSpace(check.CheckedAt) == "" {
		return true
	}
	checkedAt, err := time.Parse(time.RFC3339, check.CheckedAt)
	if err != nil {
		return true
	}
	return now.Sub(checkedAt) >= defaultUpdateCheckTTL
}

func fetchReleaseMetadata(options VersionStateOptions) (ReleaseMetadata, error) {
	timeout := options.Timeout
	if timeout <= 0 {
		timeout = defaultUpdateCheckTimeout
	}
	fetchLatest := options.FetchLatest
	if fetchLatest == nil {
		fetchLatest = fetchLatestRelease
	}
	ctx, cancel := context.WithTimeout(context.Background(), timeout)
	defer cancel()
	return fetchLatest(ctx)
}

func versionStatePath() (string, error) {
	cacheRoot, err := os.UserCacheDir()
	if err != nil {
		return "", err
	}
	return filepath.Join(cacheRoot, "cautilus", versionStateFilename), nil
}

func loadVersionState(path string) (VersionState, bool) {
	content, err := os.ReadFile(path)
	if err != nil {
		return VersionState{}, false
	}
	var state VersionState
	decoder := json.NewDecoder(bytes.NewReader(content))
	decoder.DisallowUnknownFields()
	if err := decoder.Decode(&state); err != nil {
		return VersionState{}, false
	}
	if state.SchemaVersion != versionStateSchemaVersion {
		return VersionState{}, false
	}
	return state, true
}

func saveVersionState(path string, state VersionState) error {
	if err := os.MkdirAll(filepath.Dir(path), 0o755); err != nil {
		return err
	}
	content, err := json.MarshalIndent(state, "", "  ")
	if err != nil {
		return err
	}
	tempFile, err := os.CreateTemp(filepath.Dir(path), "version-state-*.json")
	if err != nil {
		return err
	}
	tempPath := tempFile.Name()
	defer func() {
		_ = os.Remove(tempPath)
	}()
	if _, err := tempFile.Write(append(content, '\n')); err != nil {
		_ = tempFile.Close()
		return err
	}
	if err := tempFile.Close(); err != nil {
		return err
	}
	return os.Rename(tempPath, path)
}

func fetchLatestRelease(ctx context.Context) (ReleaseMetadata, error) {
	request, err := http.NewRequestWithContext(
		ctx,
		http.MethodGet,
		"https://api.github.com/repos/"+defaultReleaseRepo+"/releases/latest",
		nil,
	)
	if err != nil {
		return ReleaseMetadata{}, err
	}
	request.Header.Set("Accept", "application/vnd.github+json")
	request.Header.Set("User-Agent", "cautilus-version-check")

	response, err := http.DefaultClient.Do(request)
	if err != nil {
		return ReleaseMetadata{}, err
	}
	defer func() {
		_ = response.Body.Close()
	}()
	if response.StatusCode != http.StatusOK {
		return ReleaseMetadata{}, fmt.Errorf("latest release lookup returned %s", response.Status)
	}

	return decodeLatestReleaseMetadata(response.Body)
}

func decodeLatestReleaseMetadata(reader io.Reader) (ReleaseMetadata, error) {
	var payload struct {
		TagName string `json:"tag_name"`
		HTMLURL string `json:"html_url"`
	}
	decoder := json.NewDecoder(reader)
	if err := decoder.Decode(&payload); err != nil {
		return ReleaseMetadata{}, err
	}
	version := normalizeVersionString(payload.TagName)
	if version == "" {
		return ReleaseMetadata{}, fmt.Errorf("latest release did not include a usable tag")
	}
	return ReleaseMetadata{
		Version:    version,
		ReleaseURL: strings.TrimSpace(payload.HTMLURL),
	}, nil
}
