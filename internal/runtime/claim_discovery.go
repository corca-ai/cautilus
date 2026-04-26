package runtime

import (
	"fmt"
	"io/fs"
	"os"
	"path/filepath"
	"regexp"
	"strings"
	"unicode/utf8"

	"github.com/corca-ai/cautilus/internal/contracts"
)

const maxClaimSourceBytes = 512 * 1024
const maxClaimCandidates = 120
const maxClaimCandidatesPerSource = 8

type ClaimDiscoveryOptions struct {
	RepoRoot    string
	SourcePaths []string
}

type claimSource struct {
	absPath string
	relPath string
	kind    string
}

type claimCandidate struct {
	claimID                string
	summary                string
	sourcePath             string
	line                   int
	excerpt                string
	proofLayer             string
	recommendedEvalSurface string
	whyThisLayer           string
	nextAction             string
}

type claimExtraction struct {
	candidates []claimCandidate
	truncated  bool
}

func DiscoverClaimProofPlan(options ClaimDiscoveryOptions) (map[string]any, error) {
	repoRoot := strings.TrimSpace(options.RepoRoot)
	if repoRoot == "" {
		repoRoot = "."
	}
	resolvedRoot, err := filepath.Abs(repoRoot)
	if err != nil {
		return nil, err
	}
	info, err := os.Stat(resolvedRoot)
	if err != nil {
		return nil, fmt.Errorf("repo root does not exist: %s", repoRoot)
	}
	if !info.IsDir() {
		return nil, fmt.Errorf("repo root must be a directory: %s", repoRoot)
	}

	sources, err := discoverClaimSources(resolvedRoot, options.SourcePaths)
	if err != nil {
		return nil, err
	}
	inventory := make([]any, 0, len(sources))
	candidates := make([]claimCandidate, 0)
	seenIDs := map[string]int{}
	for _, source := range sources {
		status := "read"
		if info, err := os.Stat(source.absPath); err != nil {
			status = "missing"
		} else if info.Size() > maxClaimSourceBytes {
			status = "skipped-too-large"
		} else if len(candidates) >= maxClaimCandidates {
			status = "skipped-candidate-limit"
		} else {
			extraction, readErr := extractClaimCandidates(source, seenIDs)
			if readErr != nil {
				status = "unreadable"
			} else {
				sourceCandidates := extraction.candidates
				if remaining := maxClaimCandidates - len(candidates); len(sourceCandidates) > remaining {
					sourceCandidates = sourceCandidates[:remaining]
					extraction.truncated = true
				}
				candidates = append(candidates, sourceCandidates...)
				if extraction.truncated {
					status = "read-truncated"
				}
			}
		}
		inventory = append(inventory, map[string]any{
			"path":   source.relPath,
			"kind":   source.kind,
			"status": status,
		})
	}

	return map[string]any{
		"schemaVersion":    contracts.ClaimProofPlanSchema,
		"discoveryMode":    "deterministic-source-inventory",
		"sourceRoot":       ".",
		"sourceInventory":  inventory,
		"claimCandidates":  renderClaimCandidates(candidates),
		"candidateCount":   len(candidates),
		"candidateLimit":   maxClaimCandidates,
		"sourceCount":      len(sources),
		"nextRecommended":  "Turn cautilus-eval candidates into host-owned eval fixtures; keep deterministic candidates in the repo's normal test or CI gates.",
		"nonVerdictNotice": "This packet is a proof plan, not proof that the claims are true.",
	}, nil
}

func discoverClaimSources(repoRoot string, explicit []string) ([]claimSource, error) {
	if len(explicit) > 0 {
		sources := make([]claimSource, 0, len(explicit))
		seen := map[string]struct{}{}
		for _, raw := range explicit {
			path := strings.TrimSpace(raw)
			if path == "" {
				continue
			}
			if !filepath.IsAbs(path) {
				path = filepath.Join(repoRoot, path)
			}
			absPath, err := filepath.Abs(path)
			if err != nil {
				return nil, err
			}
			relPath := relativeClaimPath(repoRoot, absPath)
			if _, exists := seen[relPath]; exists {
				continue
			}
			seen[relPath] = struct{}{}
			sources = append(sources, claimSource{absPath: absPath, relPath: relPath, kind: claimSourceKind(relPath)})
		}
		return sources, nil
	}

	seen := map[string]struct{}{}
	sources := []claimSource{}
	addPath := func(path string) {
		absPath := filepath.Join(repoRoot, path)
		info, err := os.Stat(absPath)
		if err != nil || info.IsDir() {
			return
		}
		relPath := filepath.ToSlash(filepath.Clean(path))
		if _, exists := seen[relPath]; exists {
			return
		}
		seen[relPath] = struct{}{}
		sources = append(sources, claimSource{absPath: absPath, relPath: relPath, kind: claimSourceKind(relPath)})
	}

	for _, path := range []string{"README.md", "README", "AGENTS.md", "CLAUDE.md", "internal/cli/command-registry.json"} {
		addPath(path)
	}
	for _, root := range []string{"docs", "skills", "plugins", ".agents"} {
		if err := walkClaimSourceTree(repoRoot, root, addPath); err != nil {
			return nil, err
		}
	}
	return sources, nil
}

func walkClaimSourceTree(repoRoot string, root string, addPath func(string)) error {
	base := filepath.Join(repoRoot, root)
	info, err := os.Stat(base)
	if err != nil {
		if os.IsNotExist(err) {
			return nil
		}
		return err
	}
	if !info.IsDir() {
		return nil
	}
	return filepath.WalkDir(base, func(path string, entry fs.DirEntry, err error) error {
		if err != nil {
			return err
		}
		name := entry.Name()
		if entry.IsDir() {
			switch name {
			case ".git", "node_modules", "dist", "coverage", "artifacts", "charness-artifacts":
				return filepath.SkipDir
			default:
				return nil
			}
		}
		if !isClaimSourceFile(path) {
			return nil
		}
		rel, relErr := filepath.Rel(repoRoot, path)
		if relErr != nil {
			return relErr
		}
		addPath(rel)
		return nil
	})
}

func isClaimSourceFile(path string) bool {
	switch strings.ToLower(filepath.Ext(path)) {
	case ".md", ".json", ".yaml", ".yml":
		return true
	default:
		return false
	}
}

func claimSourceKind(relPath string) string {
	slash := filepath.ToSlash(relPath)
	lower := strings.ToLower(slash)
	switch {
	case strings.HasPrefix(lower, "readme"):
		return "readme"
	case lower == "agents.md" || lower == "claude.md":
		return "repo-instructions"
	case strings.Contains(lower, "/skill.md") || strings.HasPrefix(lower, "skills/"):
		return "skill-doc"
	case strings.Contains(lower, "plugin.json"):
		return "plugin-manifest"
	case strings.Contains(lower, "command-registry.json"):
		return "cli-registry"
	case strings.HasPrefix(lower, "docs/specs/"):
		return "spec"
	case strings.HasPrefix(lower, "docs/contracts/"):
		return "contract"
	case strings.HasPrefix(lower, "docs/"):
		return "docs"
	case strings.HasPrefix(lower, ".agents/"):
		return "adapter"
	default:
		return "repo-truth-surface"
	}
}

func extractClaimCandidates(source claimSource, seenIDs map[string]int) (claimExtraction, error) {
	content, err := os.ReadFile(source.absPath)
	if err != nil {
		return claimExtraction{}, err
	}
	if !utf8.Valid(content) {
		return claimExtraction{}, fmt.Errorf("claim source is not utf-8: %s", source.relPath)
	}
	lines := strings.Split(string(content), "\n")
	candidates := make([]claimCandidate, 0)
	inFence := false
	for index, raw := range lines {
		lineNo := index + 1
		trimmed := strings.TrimSpace(raw)
		if strings.HasPrefix(trimmed, "```") {
			inFence = !inFence
			continue
		}
		if inFence || !claimLineLooksUseful(trimmed) {
			continue
		}
		layer, surface, why, next, ok := classifyClaimLine(trimmed)
		if !ok {
			continue
		}
		if len(candidates) >= maxClaimCandidatesPerSource {
			return claimExtraction{candidates: candidates, truncated: true}, nil
		}
		summary := normalizeClaimSummary(trimmed)
		if summary == "" {
			continue
		}
		id := uniqueClaimID(source.relPath, lineNo, seenIDs)
		candidates = append(candidates, claimCandidate{
			claimID:                id,
			summary:                summary,
			sourcePath:             source.relPath,
			line:                   lineNo,
			excerpt:                summary,
			proofLayer:             layer,
			recommendedEvalSurface: surface,
			whyThisLayer:           why,
			nextAction:             next,
		})
	}
	return claimExtraction{candidates: candidates}, nil
}

func claimLineLooksUseful(line string) bool {
	if line == "" || strings.HasPrefix(line, "|") || strings.HasPrefix(line, "---") {
		return false
	}
	normalized := normalizeClaimSummary(line)
	if len(normalized) < 20 || len(normalized) > 260 {
		return false
	}
	lower := strings.ToLower(normalized)
	return containsAny(lower, []string{
		" must ", " should ", " can ", " will ", " owns ", " keeps ", " uses ", " emits ", " writes ", " runs ",
		" routes ", " discovers ", " evaluates ", " improves ", " verifies ", " validates ", " proves ", " supports ",
		" requires ", " guarantees ", " provides ", " belongs ", " remains ", " stays ",
	})
}

func classifyClaimLine(line string) (string, string, string, string, bool) {
	lower := " " + strings.ToLower(line) + " "
	switch {
	case containsAny(lower, []string{" unit test", " tests ", " lint", " typecheck", " type-check", " build ", " ci ", " compile", " schema ", " deterministic"}):
		return "deterministic", "", "The claim names a deterministic gate or static contract that should be protected outside Cautilus eval.", "Keep or add a repo-owned unit, lint, build, schema, or CI check for this claim.", true
	case containsAny(lower, []string{" align", " aligned", " alignment", " drift", " reconcile", " mismatch", " consistent with", " consistency"}):
		return "alignment-work", "", "The claim says surfaces should agree, so proof is not honest until the mismatched surfaces are reconciled.", "Reconcile the named docs, code, skill, adapter, or CLI surface before treating this as a verification target.", true
	case containsAny(lower, []string{" scenario", " proposal", " candidate", " coverage"}):
		return "scenario-candidate", "", "The claim points at scenario or proposal work before it is ready as a protected eval fixture.", "Use the scenario proposal flow to normalize candidate evidence before creating a checked-in eval fixture.", true
	case containsAny(lower, []string{" agent", " prompt", " skill", " workflow", " llm", " model", " conversation", " assistant", " behavior", " eval "}):
		surface := recommendedEvalSurface(lower)
		return "cautilus-eval", surface, "The claim depends on model, agent, prompt, skill, workflow, or behavior execution evidence.", fmt.Sprintf("Create a host-owned %s fixture and run it through cautilus eval test.", surface), true
	case containsAny(lower, []string{" human", " auditable", " read ", " docs", " document", " visible", " inspect"}):
		return "human-auditable", "", "The claim can be checked by reading current source, docs, or generated artifacts.", "Record the source reference and keep it human-auditable; add deterministic or eval proof only if behavior depends on execution.", true
	default:
		return "", "", "", "", false
	}
}

func recommendedEvalSurface(lower string) string {
	switch {
	case strings.Contains(lower, " prompt"):
		return "app/prompt"
	case strings.Contains(lower, " conversation") || strings.Contains(lower, " chat") || strings.Contains(lower, " assistant"):
		return "app/chat"
	case strings.Contains(lower, " skill"):
		return "repo/skill"
	default:
		return "repo/whole-repo"
	}
}

func normalizeClaimSummary(line string) string {
	text := strings.TrimSpace(line)
	text = strings.TrimLeft(text, "#")
	text = strings.TrimSpace(text)
	text = strings.TrimLeft(text, "-*")
	text = strings.TrimSpace(text)
	numberedPrefix := regexp.MustCompile(`^\d+\.\s+`)
	text = numberedPrefix.ReplaceAllString(text, "")
	text = strings.Join(strings.Fields(text), " ")
	return strings.TrimSpace(text)
}

func uniqueClaimID(path string, line int, seen map[string]int) string {
	base := fmt.Sprintf("claim-%s-%d", slugifyClaimID(path), line)
	if seen[base] == 0 {
		seen[base] = 1
		return base
	}
	seen[base]++
	return fmt.Sprintf("%s-%d", base, seen[base])
}

func slugifyClaimID(value string) string {
	lower := strings.ToLower(value)
	var builder strings.Builder
	lastDash := false
	for _, r := range lower {
		if (r >= 'a' && r <= 'z') || (r >= '0' && r <= '9') {
			builder.WriteRune(r)
			lastDash = false
			continue
		}
		if !lastDash {
			builder.WriteRune('-')
			lastDash = true
		}
	}
	result := strings.Trim(builder.String(), "-")
	if result == "" {
		return "source"
	}
	if len(result) > 64 {
		return strings.Trim(result[:64], "-")
	}
	return result
}

func renderClaimCandidates(candidates []claimCandidate) []any {
	result := make([]any, 0, len(candidates))
	for _, candidate := range candidates {
		entry := map[string]any{
			"claimId": candidate.claimID,
			"summary": candidate.summary,
			"sourceRefs": []any{
				map[string]any{
					"path":    candidate.sourcePath,
					"line":    candidate.line,
					"excerpt": candidate.excerpt,
				},
			},
			"proofLayer":   candidate.proofLayer,
			"whyThisLayer": candidate.whyThisLayer,
			"nextAction":   candidate.nextAction,
		}
		if candidate.recommendedEvalSurface != "" {
			entry["recommendedEvalSurface"] = candidate.recommendedEvalSurface
		}
		result = append(result, entry)
	}
	return result
}

func containsAny(value string, needles []string) bool {
	for _, needle := range needles {
		if strings.Contains(value, needle) {
			return true
		}
	}
	return false
}

func relativeClaimPath(root string, path string) string {
	rel, err := filepath.Rel(root, path)
	if err != nil {
		return filepath.ToSlash(filepath.Clean(path))
	}
	return filepath.ToSlash(filepath.Clean(rel))
}

func ValidateClaimProofPlan(plan map[string]any) error {
	if plan["schemaVersion"] != contracts.ClaimProofPlanSchema {
		return fmt.Errorf("schemaVersion must be %s", contracts.ClaimProofPlanSchema)
	}
	rawCandidates, err := assertArray(plan["claimCandidates"], "claimCandidates")
	if err != nil {
		return err
	}
	for index, raw := range rawCandidates {
		entry, ok := raw.(map[string]any)
		if !ok {
			return fmt.Errorf("claimCandidates[%d] must be an object", index)
		}
		if _, err := normalizeNonEmptyString(entry["claimId"], fmt.Sprintf("claimCandidates[%d].claimId", index)); err != nil {
			return err
		}
		if _, err := normalizeNonEmptyString(entry["summary"], fmt.Sprintf("claimCandidates[%d].summary", index)); err != nil {
			return err
		}
		layer, err := normalizeNonEmptyString(entry["proofLayer"], fmt.Sprintf("claimCandidates[%d].proofLayer", index))
		if err != nil {
			return err
		}
		if !validProofLayer(layer) {
			return fmt.Errorf("claimCandidates[%d].proofLayer %q is unsupported", index, layer)
		}
		if surface := strings.TrimSpace(stringFromAny(entry["recommendedEvalSurface"])); surface != "" && !validEvalSurface(surface) {
			return fmt.Errorf("claimCandidates[%d].recommendedEvalSurface %q is unsupported", index, surface)
		}
		refs, err := assertArray(entry["sourceRefs"], fmt.Sprintf("claimCandidates[%d].sourceRefs", index))
		if err != nil {
			return err
		}
		if len(refs) == 0 {
			return fmt.Errorf("claimCandidates[%d].sourceRefs must contain at least one source ref", index)
		}
	}
	return nil
}

func validProofLayer(value string) bool {
	switch value {
	case "human-auditable", "deterministic", "cautilus-eval", "scenario-candidate", "alignment-work":
		return true
	default:
		return false
	}
}

func validEvalSurface(value string) bool {
	switch value {
	case "repo/whole-repo", "repo/skill", "app/chat", "app/prompt":
		return true
	default:
		return false
	}
}
