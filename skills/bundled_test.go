package skills

import (
	"os"
	"path/filepath"
	"strings"
	"testing"
)

func TestInstallCautilusRewritesRepoRootLinksForAgentSkill(t *testing.T) {
	root := t.TempDir()
	destination := filepath.Join(root, ".agents", "skills", "cautilus")

	if err := InstallCautilus(destination); err != nil {
		t.Fatalf("InstallCautilus returned error: %v", err)
	}

	referencePath := filepath.Join(destination, "references", "active-run.md")
	payload, err := os.ReadFile(referencePath)
	if err != nil {
		t.Fatalf("ReadFile returned error: %v", err)
	}
	text := string(payload)
	if !strings.Contains(text, "../../../../scripts/agent-runtime/active-run.mjs") {
		t.Fatalf("expected installed references to reach repo root from .agents/skills/cautilus: %s", text)
	}
	if strings.Contains(text, "](../../../scripts/agent-runtime/active-run.mjs)") {
		t.Fatalf("expected source-root relative link to be rewritten for installed skill")
	}
}
