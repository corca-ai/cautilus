package runtime

import (
	"fmt"
	"os"
	"path/filepath"
	"strings"
	"time"
)

type ResolvedRunDir struct {
	RunDir  string
	Source  string
	Created bool
	Label   *string
	Root    *string
}

func ReadActiveRunDir(env map[string]string) (*string, error) {
	fromEnv := env[ActiveRunEnvVar]
	if stringsTrim(fromEnv) == "" {
		return nil, nil
	}
	resolved, err := filepathAbs(fromEnv)
	if err != nil {
		return nil, err
	}
	if err := mustDir(resolved, ActiveRunEnvVar); err != nil {
		return nil, err
	}
	return &resolved, nil
}

func ResolveRunDir(outputDir *string, root *string, label *string, env map[string]string, now time.Time, cwd string) (*ResolvedRunDir, error) {
	if outputDir != nil && stringsTrim(*outputDir) != "" {
		resolved := resolvePath(cwd, *outputDir)
		if err := os.MkdirAll(resolved, 0o755); err != nil {
			return nil, err
		}
		return &ResolvedRunDir{
			RunDir:  resolved,
			Source:  "explicit",
			Created: false,
		}, nil
	}
	if envValue := stringsTrim(env[ActiveRunEnvVar]); envValue != "" {
		active, err := ReadActiveRunDir(map[string]string{
			ActiveRunEnvVar: resolvePath(cwd, envValue),
		})
		if err != nil {
			return nil, err
		}
		if active == nil {
			return nil, fmt.Errorf("%s does not exist", ActiveRunEnvVar)
		}
		return &ResolvedRunDir{
			RunDir:  *active,
			Source:  "active",
			Created: false,
		}, nil
	}
	run, err := StartWorkspaceRun(root, label, now, cwd)
	if err != nil {
		return nil, err
	}
	rootValue := run.Root
	labelValue := run.Label
	return &ResolvedRunDir{
		RunDir:  run.RunDir,
		Source:  "auto",
		Created: true,
		Label:   &labelValue,
		Root:    &rootValue,
	}, nil
}

func stringsTrim(value string) string {
	return strings.TrimSpace(value)
}

func filepathAbs(path string) (string, error) {
	return filepath.Abs(path)
}
