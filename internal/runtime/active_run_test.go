package runtime

import (
	"os"
	"path/filepath"
	"strings"
	"testing"
	"time"
)

func TestResolveRunDirPrecedence(t *testing.T) {
	now := time.Date(2026, 7, 11, 10, 32, 15, 0, time.UTC)
	t.Run("explicit output wins", func(t *testing.T) {
		cwd := t.TempDir()
		outputDir := "explicit"
		result, err := ResolveRunDir(&outputDir, nil, nil, map[string]string{ActiveRunEnvVar: filepath.Join(cwd, "ignored")}, now, cwd)
		if err != nil {
			t.Fatalf("ResolveRunDir returned error: %v", err)
		}
		want := filepath.Join(cwd, outputDir)
		if result.Source != "explicit" || result.RunDir != want || result.Created {
			t.Fatalf("unexpected explicit result: %#v", result)
		}
		assertRuntimeTestDir(t, want)
	})

	t.Run("active env wins without explicit output", func(t *testing.T) {
		cwd := t.TempDir()
		active := filepath.Join(cwd, "active")
		if err := os.Mkdir(active, 0o755); err != nil {
			t.Fatalf("Mkdir returned error: %v", err)
		}
		result, err := ResolveRunDir(nil, nil, nil, map[string]string{ActiveRunEnvVar: active}, now, cwd)
		if err != nil {
			t.Fatalf("ResolveRunDir returned error: %v", err)
		}
		if result.Source != "active" || result.RunDir != active || result.Created {
			t.Fatalf("unexpected active result: %#v", result)
		}
	})

	t.Run("whitespace explicit output falls through to active env", func(t *testing.T) {
		cwd := t.TempDir()
		active := filepath.Join(cwd, "active")
		if err := os.Mkdir(active, 0o755); err != nil {
			t.Fatalf("Mkdir returned error: %v", err)
		}
		outputDir := " \t\n"
		result, err := ResolveRunDir(&outputDir, nil, nil, map[string]string{ActiveRunEnvVar: active}, now, cwd)
		if err != nil {
			t.Fatalf("ResolveRunDir returned error: %v", err)
		}
		if result.Source != "active" || result.RunDir != active || result.Created {
			t.Fatalf("unexpected active fallback result: %#v", result)
		}
	})

	for _, test := range []struct {
		name      string
		outputDir *string
		env       map[string]string
	}{
		{name: "whitespace explicit output is absent", outputDir: stringPointer(" \t\n"), env: map[string]string{}},
		{name: "whitespace active env is absent", env: map[string]string{ActiveRunEnvVar: " \t\n"}},
	} {
		t.Run(test.name, func(t *testing.T) {
			cwd := t.TempDir()
			label := "fallback"
			result, err := ResolveRunDir(test.outputDir, nil, &label, test.env, now, cwd)
			if err != nil {
				t.Fatalf("ResolveRunDir returned error: %v", err)
			}
			if result.Source != "auto" || !result.Created || result.Label == nil || *result.Label != label {
				t.Fatalf("unexpected auto result: %#v", result)
			}
			assertRuntimeTestDir(t, result.RunDir)
			if _, err := os.Stat(filepath.Join(result.RunDir, RunManifestName)); err != nil {
				t.Fatalf("expected run manifest: %v", err)
			}
		})
	}
}

func TestReadActiveRunDirRejectsInvalidTargets(t *testing.T) {
	if result, err := ReadActiveRunDir(map[string]string{ActiveRunEnvVar: " \t\n"}); err != nil || result != nil {
		t.Fatalf("whitespace active run = %v, %v; want nil, nil", result, err)
	}

	missing := filepath.Join(t.TempDir(), "missing")
	_, err := ReadActiveRunDir(map[string]string{ActiveRunEnvVar: missing})
	if err == nil || !strings.Contains(err.Error(), ActiveRunEnvVar+" does not exist") {
		t.Fatalf("expected missing active-run error, got %v", err)
	}

	filePath := filepath.Join(t.TempDir(), "file")
	if err := os.WriteFile(filePath, []byte("not a directory"), 0o644); err != nil {
		t.Fatalf("WriteFile returned error: %v", err)
	}
	_, err = ReadActiveRunDir(map[string]string{ActiveRunEnvVar: filePath})
	if err == nil || !strings.Contains(err.Error(), ActiveRunEnvVar+" must be a directory") {
		t.Fatalf("expected non-directory active-run error, got %v", err)
	}
}

func stringPointer(value string) *string {
	return &value
}

func assertRuntimeTestDir(t *testing.T, path string) {
	t.Helper()
	info, err := os.Stat(path)
	if err != nil {
		t.Fatalf("expected directory %s: %v", path, err)
	}
	if !info.IsDir() {
		t.Fatalf("expected directory %s", path)
	}
}
