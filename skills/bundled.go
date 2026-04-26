package skills

import (
	"embed"
	"io/fs"
	"os"
	"path/filepath"
	"regexp"
)

//go:embed cautilus
var bundled embed.FS

var upwardMarkdownLinkPattern = regexp.MustCompile(`(\]\()(\.\.(?:/\.\.)*/)([^)\s]+)(\))`)

func InstallCautilus(destinationDir string) error {
	skillFS, err := fs.Sub(bundled, "cautilus")
	if err != nil {
		return err
	}
	if err := os.MkdirAll(destinationDir, 0o755); err != nil {
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
		payload = rewriteInstalledAgentLinks(destinationDir, path, payload)
		return os.WriteFile(destinationPath, payload, 0o644)
	})
}

func rewriteInstalledAgentLinks(destinationDir string, path string, payload []byte) []byte {
	if filepath.Ext(path) != ".md" {
		return payload
	}
	if isAgentSkillDestination(destinationDir) {
		return upwardMarkdownLinkPattern.ReplaceAll(payload, []byte(`${1}../${2}${3}${4}`))
	}
	return payload
}

func isAgentSkillDestination(destinationDir string) bool {
	clean := filepath.Clean(destinationDir)
	return filepath.Base(clean) == "cautilus" &&
		filepath.Base(filepath.Dir(clean)) == "skills" &&
		filepath.Base(filepath.Dir(filepath.Dir(clean))) == ".agents"
}
