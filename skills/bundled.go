package skills

import (
	"embed"
	"io/fs"
	"os"
	"path/filepath"
)

//go:embed cautilus
var bundled embed.FS

func InstallCautilus(destinationDir string) error {
	skillFS, err := fs.Sub(bundled, "cautilus")
	if err != nil {
		return err
	}
	return fs.WalkDir(skillFS, ".", func(path string, entry fs.DirEntry, walkErr error) error {
		if walkErr != nil {
			return walkErr
		}
		if path == "." {
			return nil
		}
		destinationPath := filepath.Join(destinationDir, filepath.FromSlash(path))
		if entry.IsDir() {
			return os.MkdirAll(destinationPath, 0o755)
		}
		payload, err := fs.ReadFile(skillFS, path)
		if err != nil {
			return err
		}
		return os.WriteFile(destinationPath, payload, 0o644)
	})
}
