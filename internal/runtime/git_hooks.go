package runtime

import (
	"fmt"
	"os"
	"os/exec"
	"path/filepath"
	"strings"
)

const (
	HooksPath   = ".githooks"
	PrePushPath = ".githooks/pre-push"
)

func CheckGitHooks(repoRoot string) map[string]any {
	expectedHooksPath := filepath.Join(repoRoot, HooksPath)
	prePushHook := filepath.Join(repoRoot, PrePushPath)
	hooksPathOK, hooksPathStdout := runGit(repoRoot, []string{"config", "--get", "core.hooksPath"})
	prePushExists := fileExists(prePushHook)
	prePushExecutable := prePushExists && isExecutable(prePushHook)
	checks := []any{
		map[string]any{
			"id": "hooks_path_configured",
			"ok": hooksPathOK && hooksPathStdout == HooksPath,
			"detail": func() string {
				if hooksPathOK {
					value := hooksPathStdout
					if value == "" {
						value = "<empty>"
					}
					return "core.hooksPath=" + value
				}
				return "core.hooksPath is not configured."
			}(),
		},
		map[string]any{
			"id": "pre_push_exists",
			"ok": prePushExists,
			"detail": func() string {
				if prePushExists {
					return "Found .githooks/pre-push."
				}
				return "Missing checked-in hook: .githooks/pre-push"
			}(),
		},
		map[string]any{
			"id": "pre_push_executable",
			"ok": prePushExecutable,
			"detail": func() string {
				if prePushExecutable {
					return ".githooks/pre-push is executable."
				}
				return ".githooks/pre-push is not executable."
			}(),
		},
	}
	ready := allChecksReady(checks)
	suggestions := []any{}
	if !ready {
		suggestions = append(suggestions, "npm run hooks:install")
	}
	return map[string]any{
		"repoRoot":            repoRoot,
		"expectedHooksPath":   expectedHooksPath,
		"configuredHooksPath": nilIfEmpty(hooksPathStdout),
		"checks":              checks,
		"ready":               ready,
		"status": func() string {
			if ready {
				return "ready"
			}
			return "invalid_hooks"
		}(),
		"suggestions": suggestions,
	}
}

func InstallGitHooks(repoRoot string) (map[string]any, error) {
	prePushHook := filepath.Join(repoRoot, PrePushPath)
	if !fileExists(prePushHook) {
		return nil, fmt.Errorf("Missing checked-in hook: %s", PrePushPath)
	}
	if _, _, err := runGitStrict(repoRoot, []string{"rev-parse", "--show-toplevel"}); err != nil {
		return nil, err
	}
	if err := os.Chmod(prePushHook, 0o755); err != nil {
		return nil, err
	}
	if _, _, err := runGitStrict(repoRoot, []string{"config", "--local", "core.hooksPath", HooksPath}); err != nil {
		return nil, err
	}
	return map[string]any{
		"repoRoot":    repoRoot,
		"hooksPath":   HooksPath,
		"prePushHook": prePushHook,
		"status":      "installed",
	}, nil
}

func runGit(repoRoot string, args []string) (bool, string) {
	command := exec.Command("git", append([]string{"-C", repoRoot}, args...)...)
	payload, err := command.Output()
	if err != nil {
		return false, ""
	}
	return true, strings.TrimSpace(string(payload))
}

func runGitStrict(repoRoot string, args []string) (string, string, error) {
	command := exec.Command("git", append([]string{"-C", repoRoot}, args...)...)
	payload, err := command.CombinedOutput()
	if err != nil {
		return "", strings.TrimSpace(string(payload)), fmt.Errorf("%s", strings.TrimSpace(string(payload)))
	}
	return strings.TrimSpace(string(payload)), "", nil
}

func isExecutable(path string) bool {
	info, err := os.Stat(path)
	if err != nil {
		return false
	}
	return info.Mode()&0o111 != 0
}
