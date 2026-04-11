package runtime

import (
	"fmt"
	"os"
	"path/filepath"
	"regexp"
	"strings"
	"time"

	"github.com/corca-ai/cautilus/internal/contracts"
)

const (
	RunManifestName = "run.json"
	DefaultRunLabel = "run"
	DefaultRunsRoot = ".cautilus/runs"
	ActiveRunEnvVar = "CAUTILUS_RUN_DIR"
	labelMaxLength  = 64
)

var nonLabelChars = regexp.MustCompile(`[^a-z0-9-]+`)
var repeatedDashes = regexp.MustCompile(`-+`)

type WorkspaceRun struct {
	SchemaVersion string         `json:"schemaVersion"`
	Root          string         `json:"root"`
	RunDir        string         `json:"runDir"`
	Label         string         `json:"label"`
	StartedAt     string         `json:"startedAt"`
	Manifest      string         `json:"manifest"`
	ManifestData  map[string]any `json:"-"`
}

func SlugifyLabel(label *string) string {
	if label == nil {
		return DefaultRunLabel
	}
	lowered := strings.ToLower(*label)
	replaced := nonLabelChars.ReplaceAllString(lowered, "-")
	collapsed := repeatedDashes.ReplaceAllString(replaced, "-")
	trimmed := strings.Trim(collapsed, "-")
	if len(trimmed) > labelMaxLength {
		trimmed = trimmed[:labelMaxLength]
	}
	if trimmed == "" {
		return DefaultRunLabel
	}
	return trimmed
}

func FormatRunTimestamp(now time.Time) string {
	iso := now.UTC().Format("2006-01-02T15:04:05.000Z")
	return fmt.Sprintf("%s%s%sT%s%s%s%sZ",
		iso[0:4],
		iso[5:7],
		iso[8:10],
		iso[11:13],
		iso[14:16],
		iso[17:19],
		iso[20:23],
	)
}

func ShellSingleQuote(value string) string {
	return "'" + strings.ReplaceAll(value, "'", "'\\''") + "'"
}

func RenderShellExport(runDir string) string {
	return fmt.Sprintf("export %s=%s\n", ActiveRunEnvVar, ShellSingleQuote(runDir))
}

func CreateRun(root string, label *string, now time.Time) (*WorkspaceRun, error) {
	if strings.TrimSpace(root) == "" {
		return nil, fmt.Errorf("root is required")
	}
	resolvedRoot, err := filepath.Abs(root)
	if err != nil {
		return nil, err
	}
	if err := mustDir(resolvedRoot, "Root"); err != nil {
		return nil, err
	}
	slug := SlugifyLabel(label)
	startedAt := now.UTC().Format(time.RFC3339Nano)
	runDir := filepath.Join(resolvedRoot, fmt.Sprintf("%s-%s", FormatRunTimestamp(now), slug))
	if fileExists(runDir) {
		return nil, fmt.Errorf("run directory already exists: %s", runDir)
	}
	if err := os.Mkdir(runDir, 0o755); err != nil {
		return nil, err
	}
	manifest := map[string]any{
		"schemaVersion": contracts.WorkspaceRunManifestSchema,
		"label":         slug,
		"startedAt":     startedAt,
	}
	if err := writeJSONFile(filepath.Join(runDir, RunManifestName), manifest); err != nil {
		return nil, err
	}
	return &WorkspaceRun{
		SchemaVersion: contracts.WorkspaceRunManifestSchema,
		Root:          resolvedRoot,
		RunDir:        runDir,
		Label:         slug,
		StartedAt:     startedAt,
		Manifest:      RunManifestName,
		ManifestData:  manifest,
	}, nil
}

func StartWorkspaceRun(root *string, label *string, now time.Time, cwd string) (*WorkspaceRun, error) {
	rootValue := DefaultRunsRoot
	if root != nil && strings.TrimSpace(*root) != "" {
		rootValue = *root
	}
	rootPath := resolvePath(cwd, rootValue)
	if err := os.MkdirAll(rootPath, 0o755); err != nil {
		return nil, err
	}
	return CreateRun(rootPath, label, now)
}
