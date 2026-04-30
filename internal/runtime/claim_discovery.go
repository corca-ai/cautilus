package runtime

import (
	"crypto/sha256"
	"encoding/hex"
	"encoding/json"
	"fmt"
	"io/fs"
	"os"
	"os/exec"
	pathpkg "path"
	"path/filepath"
	"regexp"
	"sort"
	"strings"
	"unicode/utf8"

	"github.com/corca-ai/cautilus/internal/contracts"
)

type ClaimDiscoveryOptions struct {
	RepoRoot        string
	SourcePaths     []string
	PreviousPath    string
	RefreshPlanOnly bool
}

type ClaimReviewInputOptions struct {
	InputPath           string
	MaxClusters         int
	MaxClaimsPerCluster int
	ExcerptChars        int
	ClusterPolicy       string
	RepoRoot            string
	AllowStaleClaims    bool
}

type ClaimReviewApplyOptions struct {
	ClaimsPath       string
	ReviewResultPath string
	RepoRoot         string
	AllowStaleClaims bool
}

type ClaimEvalPlanOptions struct {
	ClaimsPath       string
	MaxClaims        int
	RepoRoot         string
	AllowStaleClaims bool
}

type ClaimValidationOptions struct {
	InputPath string
}

type ClaimStatusSummaryOptions struct {
	InputPath    string
	SampleClaims int
	RepoRoot     string
}

type claimSource struct {
	absPath        string
	relPath        string
	kind           string
	audience       string
	audienceSource string
	depth          int
	discoveredFrom string
}

type claimCandidate struct {
	claimID                string
	claimFingerprint       string
	summary                string
	sourceRefs             []claimSourceRef
	proofLayer             string
	recommendedProof       string
	verificationReadiness  string
	evidenceStatus         string
	reviewStatus           string
	lifecycle              string
	recommendedEvalSurface string
	whyThisLayer           string
	nextAction             string
	groupHints             []string
	claimAudience          string
	claimAudienceSource    string
	claimSemanticGroup     string
}

type claimSourceRef struct {
	path    string
	line    int
	excerpt string
}

type claimExtraction struct {
	candidates []claimCandidate
}

type claimTextBlock struct {
	line int
	text string
}

type claimClassification struct {
	proofLayer             string
	recommendedProof       string
	verificationReadiness  string
	recommendedEvalSurface string
	why                    string
	next                   string
}

type claimDiscoveryConfig struct {
	entries             []string
	include             []string
	exclude             []string
	evidenceRoots       []string
	audienceHints       map[string][]string
	semanticGroups      []claimSemanticGroupRule
	linkedMarkdownDepth int
	statePath           string
	statePathSource     string
	adapterPath         string
	adapterFound        bool
	explicitSources     bool
}

type claimSemanticGroupRule struct {
	label string
	terms []string
}

type claimReviewCluster struct {
	clusterID              string
	groupKey               string
	priority               int
	reason                 string
	recommendedProof       string
	verificationReadiness  string
	recommendedEvalSurface string
	claimAudience          string
	claimSemanticGroup     string
	candidates             []map[string]any
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

	config, err := resolveClaimDiscoveryConfig(resolvedRoot, options.SourcePaths)
	if err != nil {
		return nil, err
	}
	if options.RefreshPlanOnly {
		return BuildClaimRefreshPlan(ClaimRefreshPlanOptions{
			RepoRoot:     resolvedRoot,
			PreviousPath: options.PreviousPath,
			Config:       config,
		})
	}
	sources, sourceGraph, err := discoverClaimSources(resolvedRoot, config)
	if err != nil {
		return nil, err
	}
	inventory := make([]any, 0, len(sources))
	candidates := make([]claimCandidate, 0)
	seenIDs := map[string]int{}
	for _, source := range sources {
		status := "read"
		if _, err := os.Stat(source.absPath); err != nil {
			status = "missing"
		} else {
			extraction, readErr := extractClaimCandidates(source, seenIDs, config)
			if readErr != nil {
				status = "unreadable"
			} else {
				candidates = append(candidates, extraction.candidates...)
			}
		}
		entry := map[string]any{
			"path":                source.relPath,
			"kind":                source.kind,
			"status":              status,
			"depth":               source.depth,
			"claimAudience":       source.audience,
			"claimAudienceSource": source.audienceSource,
		}
		if source.discoveredFrom != "" {
			entry["discoveredFrom"] = source.discoveredFrom
		}
		if status == "read" {
			if hash, hashErr := fileSHA256(source.absPath); hashErr == nil {
				entry["contentHash"] = hash
			}
		}
		inventory = append(inventory, entry)
	}
	mergedCandidates := mergeIdenticalClaimCandidates(candidates)
	renderedCandidates := renderClaimCandidates(mergedCandidates)

	return map[string]any{
		"schemaVersion":      contracts.ClaimProofPlanSchema,
		"discoveryMode":      "deterministic-source-inventory",
		"sourceRoot":         ".",
		"gitCommit":          currentGitCommit(resolvedRoot),
		"effectiveScanScope": renderClaimScanScope(config),
		"sourceInventory":    inventory,
		"sourceGraph":        sourceGraph,
		"claimState":         renderClaimState(config),
		"claimSummary":       summarizeClaimCandidates(renderedCandidates),
		"claimCandidates":    renderedCandidates,
		"candidateCount":     len(mergedCandidates),
		"sourceCount":        len(sources),
		"nextRecommended":    "Turn cautilus-eval candidates into host-owned eval fixtures; keep deterministic candidates in the repo's normal test or CI gates.",
		"nonVerdictNotice":   "This packet is a proof plan, not proof that the claims are true.",
	}, nil
}

func resolveClaimDiscoveryConfig(repoRoot string, explicit []string) (claimDiscoveryConfig, error) {
	config := claimDiscoveryConfig{
		entries:             []string{"README.md", "AGENTS.md", "CLAUDE.md"},
		exclude:             []string{".git/**", "node_modules/**", "dist/**", "coverage/**", "artifacts/**", "charness-artifacts/**"},
		linkedMarkdownDepth: 3,
		statePath:           ".cautilus/claims/latest.json",
		statePathSource:     "default",
		explicitSources:     len(explicit) > 0,
	}
	if len(explicit) > 0 {
		config.entries = normalizeClaimPathList(explicit)
		config.linkedMarkdownDepth = 0
		return config, nil
	}
	adapter, err := LoadAdapter(repoRoot, nil, nil)
	if err != nil {
		return config, err
	}
	if adapter != nil {
		config.adapterFound = adapter.Found
		if adapter.Path != nil {
			config.adapterPath = relativeClaimPath(repoRoot, stringOrEmpty(adapter.Path))
		}
		claimConfig := asMap(adapter.Data["claim_discovery"])
		if entries := stringArrayOrEmpty(claimConfig["entries"]); len(entries) > 0 {
			config.entries = normalizeClaimPathList(entries)
		}
		if include := stringArrayOrEmpty(claimConfig["include"]); len(include) > 0 {
			config.include = normalizeClaimPathList(include)
		}
		if exclude := stringArrayOrEmpty(claimConfig["exclude"]); len(exclude) > 0 {
			config.exclude = append(config.exclude, normalizeClaimPathList(exclude)...)
		}
		if evidenceRoots := stringArrayOrEmpty(claimConfig["evidence_roots"]); len(evidenceRoots) > 0 {
			config.evidenceRoots = normalizeClaimPathList(evidenceRoots)
		}
		if audienceHints := resolveClaimAudienceHints(claimConfig["audience_hints"]); len(audienceHints) > 0 {
			config.audienceHints = audienceHints
		}
		if semanticGroups := resolveClaimSemanticGroups(claimConfig["semantic_groups"]); len(semanticGroups) > 0 {
			config.semanticGroups = semanticGroups
		}
		if depth, ok := claimConfig["linked_markdown_depth"].(int); ok {
			config.linkedMarkdownDepth = depth
		}
		if statePath := strings.TrimSpace(stringOrEmpty(claimConfig["state_path"])); statePath != "" {
			normalized, err := normalizeClaimStatePath(statePath)
			if err != nil {
				return config, err
			}
			config.statePath = normalized
			config.statePathSource = "adapter"
		}
	}
	return config, nil
}

func resolveClaimAudienceHints(value any) map[string][]string {
	record := asMap(value)
	result := map[string][]string{}
	for _, audience := range []string{"user", "developer"} {
		if patterns := normalizeClaimPathList(stringArrayOrEmpty(record[audience])); len(patterns) > 0 {
			result[audience] = patterns
		}
	}
	return result
}

func resolveClaimSemanticGroups(value any) []claimSemanticGroupRule {
	result := []claimSemanticGroupRule{}
	for _, raw := range arrayOrEmpty(value) {
		record := asMap(raw)
		label := strings.TrimSpace(stringFromAny(record["label"]))
		terms := normalizeClaimSemanticTerms(stringArrayOrEmpty(record["terms"]))
		if label == "" || len(terms) == 0 {
			continue
		}
		result = append(result, claimSemanticGroupRule{label: label, terms: terms})
	}
	return result
}

func normalizeClaimSemanticTerms(values []string) []string {
	result := []string{}
	seen := map[string]struct{}{}
	for _, raw := range values {
		value := strings.ToLower(strings.TrimSpace(raw))
		if value == "" {
			continue
		}
		if _, exists := seen[value]; exists {
			continue
		}
		seen[value] = struct{}{}
		result = append(result, value)
	}
	return result
}

func normalizeClaimStatePath(value string) (string, error) {
	trimmed := strings.TrimSpace(value)
	if trimmed == "" {
		return "", fmt.Errorf("claim_discovery.state_path must be a non-empty repo-relative path")
	}
	slashValue := strings.ReplaceAll(trimmed, "\\", "/")
	if filepath.IsAbs(trimmed) || strings.HasPrefix(slashValue, "/") || looksLikeWindowsAbsolutePath(slashValue) {
		return "", fmt.Errorf("claim_discovery.state_path must be repo-relative, got %q", value)
	}
	cleaned := pathpkg.Clean(slashValue)
	if cleaned == "." || cleaned == ".." || strings.HasPrefix(cleaned, "../") || strings.Contains(cleaned, "/../") {
		return "", fmt.Errorf("claim_discovery.state_path must stay inside the repo, got %q", value)
	}
	return cleaned, nil
}

func looksLikeWindowsAbsolutePath(value string) bool {
	if len(value) < 3 {
		return false
	}
	first := value[0]
	return ((first >= 'A' && first <= 'Z') || (first >= 'a' && first <= 'z')) && value[1] == ':' && value[2] == '/'
}

func discoverClaimSources(repoRoot string, config claimDiscoveryConfig) ([]claimSource, []any, error) {
	seen := map[string]struct{}{}
	seenCanonicalFiles := map[string]string{}
	sources := []claimSource{}
	graph := []any{}
	queue := []claimSource{}
	addSource := func(relPath string, depth int, from string) {
		relPath = filepath.ToSlash(filepath.Clean(strings.TrimSpace(relPath)))
		if relPath == "." || relPath == "" || claimPathExcluded(relPath, config.exclude) {
			return
		}
		absPath := filepath.Join(repoRoot, filepath.FromSlash(relPath))
		info, err := os.Stat(absPath)
		if err != nil || info.IsDir() {
			return
		}
		if _, exists := seen[relPath]; exists {
			return
		}
		canonicalPath, canonicalErr := filepath.EvalSymlinks(absPath)
		if canonicalErr != nil {
			canonicalPath = absPath
		}
		if _, exists := seenCanonicalFiles[filepath.Clean(canonicalPath)]; exists {
			seen[relPath] = struct{}{}
			return
		}
		seen[relPath] = struct{}{}
		seenCanonicalFiles[filepath.Clean(canonicalPath)] = relPath
		audience, audienceSource := claimAudienceForSource(relPath, config)
		source := claimSource{
			absPath:        absPath,
			relPath:        relPath,
			kind:           claimSourceKind(relPath),
			audience:       audience,
			audienceSource: audienceSource,
			depth:          depth,
			discoveredFrom: from,
		}
		sources = append(sources, source)
		if isMarkdownClaimSource(relPath) && depth < config.linkedMarkdownDepth {
			queue = append(queue, source)
		}
	}
	for _, entry := range config.entries {
		addSource(entry, 0, "")
	}
	if len(config.include) > 0 {
		if err := walkIncludedClaimSources(repoRoot, config, addSource); err != nil {
			return nil, nil, err
		}
	}
	for len(queue) > 0 {
		source := queue[0]
		queue = queue[1:]
		links, err := linkedMarkdownSources(source)
		if err != nil {
			continue
		}
		for _, target := range links {
			if claimPathExcluded(target, config.exclude) {
				continue
			}
			graph = append(graph, map[string]any{
				"from":  source.relPath,
				"to":    target,
				"depth": source.depth + 1,
				"kind":  "markdown-link",
			})
			addSource(target, source.depth+1, source.relPath)
		}
	}
	sort.Slice(sources, func(i, j int) bool {
		if sources[i].depth != sources[j].depth {
			return sources[i].depth < sources[j].depth
		}
		return sources[i].relPath < sources[j].relPath
	})
	return sources, graph, nil
}

func walkIncludedClaimSources(repoRoot string, config claimDiscoveryConfig, addPath func(string, int, string)) error {
	return filepath.WalkDir(repoRoot, func(path string, entry fs.DirEntry, err error) error {
		if err != nil {
			return err
		}
		rel, relErr := filepath.Rel(repoRoot, path)
		if relErr != nil {
			return relErr
		}
		relPath := filepath.ToSlash(filepath.Clean(rel))
		if entry.IsDir() {
			if relPath != "." && claimPathExcluded(relPath+"/", config.exclude) {
				return filepath.SkipDir
			}
			return nil
		}
		if !isMarkdownClaimSource(relPath) || !claimPathIncluded(relPath, config.include) {
			return nil
		}
		addPath(relPath, 0, "")
		return nil
	})
}

func isMarkdownClaimSource(path string) bool {
	return strings.EqualFold(filepath.Ext(path), ".md")
}

func linkedMarkdownSources(source claimSource) ([]string, error) {
	content, err := os.ReadFile(source.absPath)
	if err != nil {
		return nil, err
	}
	if !utf8.Valid(content) {
		return nil, nil
	}
	linkPattern := regexp.MustCompile(`\[[^\]]+\]\(([^)]+)\)`)
	matches := linkPattern.FindAllStringSubmatch(string(content), -1)
	result := []string{}
	seen := map[string]struct{}{}
	for _, match := range matches {
		if len(match) < 2 {
			continue
		}
		target := strings.TrimSpace(match[1])
		target = strings.Trim(target, `"'`)
		if target == "" || strings.Contains(target, "://") || strings.HasPrefix(target, "#") || strings.HasPrefix(target, "/") {
			continue
		}
		if hash := strings.Index(target, "#"); hash >= 0 {
			target = target[:hash]
		}
		if query := strings.Index(target, "?"); query >= 0 {
			target = target[:query]
		}
		if !strings.EqualFold(filepath.Ext(target), ".md") {
			continue
		}
		joined := filepath.ToSlash(filepath.Clean(filepath.Join(filepath.Dir(source.relPath), filepath.FromSlash(target))))
		if strings.HasPrefix(joined, "../") || joined == ".." {
			continue
		}
		if _, exists := seen[joined]; exists {
			continue
		}
		seen[joined] = struct{}{}
		result = append(result, joined)
	}
	sort.Strings(result)
	return result, nil
}

func normalizeClaimPathList(values []string) []string {
	result := []string{}
	seen := map[string]struct{}{}
	for _, raw := range values {
		value := strings.TrimSpace(raw)
		if value == "" {
			continue
		}
		value = filepath.ToSlash(filepath.Clean(value))
		if value == "." {
			continue
		}
		if _, exists := seen[value]; exists {
			continue
		}
		seen[value] = struct{}{}
		result = append(result, value)
	}
	return result
}

func claimPathIncluded(relPath string, patterns []string) bool {
	if len(patterns) == 0 {
		return false
	}
	for _, pattern := range patterns {
		if claimGlobMatch(pattern, relPath) {
			return true
		}
	}
	return false
}

func claimPathExcluded(relPath string, patterns []string) bool {
	for _, pattern := range patterns {
		if claimGlobMatch(pattern, relPath) {
			return true
		}
	}
	return false
}

func claimGlobMatch(pattern string, relPath string) bool {
	pattern = filepath.ToSlash(filepath.Clean(strings.TrimSpace(pattern)))
	relPath = filepath.ToSlash(filepath.Clean(strings.TrimSpace(relPath)))
	if strings.HasSuffix(pattern, "/**") {
		prefix := strings.TrimSuffix(pattern, "/**")
		return relPath == prefix || strings.HasPrefix(relPath, prefix+"/")
	}
	if strings.HasSuffix(pattern, "/") {
		return strings.HasPrefix(relPath, pattern)
	}
	if strings.Contains(pattern, "**") {
		parts := strings.SplitN(pattern, "**", 2)
		return strings.HasPrefix(relPath, strings.TrimSuffix(parts[0], "/")) && strings.HasSuffix(relPath, strings.TrimPrefix(parts[1], "/"))
	}
	matched, err := pathpkg.Match(pattern, relPath)
	return err == nil && matched
}

func claimAudienceForSource(relPath string, config claimDiscoveryConfig) (string, string) {
	matches := []string{}
	for _, audience := range []string{"user", "developer"} {
		for _, pattern := range config.audienceHints[audience] {
			if claimGlobMatch(pattern, relPath) {
				matches = append(matches, audience)
				break
			}
		}
	}
	if len(matches) == 1 {
		return matches[0], "adapter-hint"
	}
	if len(matches) > 1 {
		return "unclear", "conflicting-adapter-hints"
	}
	lower := strings.ToLower(filepath.ToSlash(relPath))
	switch lower {
	case "readme.md":
		return "user", "entry-default"
	case "agents.md", "claude.md":
		return "developer", "entry-default"
	default:
		return "unclear", "unknown"
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

func extractClaimCandidates(source claimSource, seenIDs map[string]int, config claimDiscoveryConfig) (claimExtraction, error) {
	content, err := os.ReadFile(source.absPath)
	if err != nil {
		return claimExtraction{}, err
	}
	if !utf8.Valid(content) {
		return claimExtraction{}, fmt.Errorf("claim source is not utf-8: %s", source.relPath)
	}
	candidates := make([]claimCandidate, 0)
	for _, block := range claimTextBlocks(string(content)) {
		if !claimLineLooksUseful(block.text) {
			continue
		}
		classification, ok := classifyClaimLine(block.text)
		if !ok {
			continue
		}
		summary := normalizeClaimSummary(block.text)
		if summary == "" {
			continue
		}
		id := uniqueClaimID(source.relPath, block.line, seenIDs)
		groupHints := claimGroupHints(source, classification)
		candidates = append(candidates, claimCandidate{
			claimID:          id,
			claimFingerprint: claimFingerprint(summary),
			summary:          summary,
			sourceRefs: []claimSourceRef{{
				path:    source.relPath,
				line:    block.line,
				excerpt: summary,
			}},
			proofLayer:             classification.proofLayer,
			recommendedProof:       classification.recommendedProof,
			verificationReadiness:  classification.verificationReadiness,
			evidenceStatus:         "unknown",
			reviewStatus:           "heuristic",
			lifecycle:              "new",
			recommendedEvalSurface: classification.recommendedEvalSurface,
			whyThisLayer:           classification.why,
			nextAction:             classification.next,
			groupHints:             groupHints,
			claimAudience:          source.audience,
			claimAudienceSource:    source.audienceSource,
			claimSemanticGroup:     claimSemanticGroup(summary, classification.next, classification.why, classification.recommendedEvalSurface, groupHints, config),
		})
	}
	return claimExtraction{candidates: candidates}, nil
}

func claimTextBlocks(content string) []claimTextBlock {
	lines := strings.Split(content, "\n")
	blocks := []claimTextBlock{}
	buffer := []string{}
	startLine := 0
	inFence := false
	flush := func() {
		if len(buffer) == 0 {
			return
		}
		blocks = append(blocks, claimTextBlock{
			line: startLine,
			text: strings.Join(buffer, " "),
		})
		buffer = []string{}
		startLine = 0
	}
	for index, raw := range lines {
		lineNo := index + 1
		trimmed := strings.TrimSpace(raw)
		if strings.HasPrefix(trimmed, "```") {
			flush()
			inFence = !inFence
			continue
		}
		if inFence {
			continue
		}
		if trimmed == "" || strings.HasPrefix(trimmed, "|") || strings.HasPrefix(trimmed, "---") {
			flush()
			continue
		}
		if startsNewClaimBlock(trimmed) || previousLineEndsClaimBlock(buffer) {
			flush()
		}
		if len(buffer) == 0 {
			startLine = lineNo
		}
		buffer = append(buffer, trimmed)
	}
	flush()
	return blocks
}

func startsNewClaimBlock(line string) bool {
	if strings.HasPrefix(line, "#") || strings.HasPrefix(line, "- ") || strings.HasPrefix(line, "* ") {
		return true
	}
	return regexp.MustCompile(`^\d+\.\s+`).MatchString(line)
}

func previousLineEndsClaimBlock(buffer []string) bool {
	if len(buffer) == 0 {
		return false
	}
	previous := strings.TrimSpace(buffer[len(buffer)-1])
	return strings.HasSuffix(previous, ".") || strings.HasSuffix(previous, "?") || strings.HasSuffix(previous, "!")
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

func classifyClaimLine(line string) (claimClassification, bool) {
	lower := " " + strings.ToLower(line) + " "
	switch {
	case containsAny(lower, []string{" unit test", " tests ", " lint", " typecheck", " type-check", " build ", " ci ", " compile", " schema ", " deterministic"}):
		return claimClassification{
			proofLayer:            "deterministic",
			recommendedProof:      "deterministic",
			verificationReadiness: "ready-to-verify",
			why:                   "The claim names a deterministic gate or static contract that should be protected outside Cautilus eval.",
			next:                  "Keep or add a repo-owned unit, lint, build, schema, or CI check for this claim.",
		}, true
	case containsAny(lower, []string{" align", " aligned", " alignment", " drift", " reconcile", " mismatch", " consistent with", " consistency"}):
		return claimClassification{
			proofLayer:            "alignment-work",
			recommendedProof:      "human-auditable",
			verificationReadiness: "needs-alignment",
			why:                   "The claim says surfaces should agree, so proof is not honest until the mismatched surfaces are reconciled.",
			next:                  "Reconcile the named docs, code, skill, adapter, or CLI surface before treating this as a verification target.",
		}, true
	case containsAny(lower, []string{" scenario", " proposal", " candidate", " coverage"}):
		return claimClassification{
			proofLayer:            "scenario-candidate",
			recommendedProof:      "cautilus-eval",
			verificationReadiness: "needs-scenario",
			why:                   "The claim points at scenario or proposal work before it is ready as a protected eval fixture.",
			next:                  "Use the scenario proposal flow to normalize candidate evidence before creating a checked-in eval fixture.",
		}, true
	case containsAny(lower, []string{" agent", " prompt", " skill", " workflow", " llm", " model", " conversation", " assistant", " behavior", " eval "}):
		surface := recommendedEvalSurface(lower)
		return claimClassification{
			proofLayer:             "cautilus-eval",
			recommendedProof:       "cautilus-eval",
			verificationReadiness:  "ready-to-verify",
			recommendedEvalSurface: surface,
			why:                    "The claim depends on model, agent, prompt, skill, workflow, or behavior execution evidence.",
			next:                   fmt.Sprintf("Create a host-owned %s fixture and run it through cautilus eval test.", surface),
		}, true
	case containsAny(lower, []string{" human", " auditable", " read ", " docs", " document", " visible", " inspect"}):
		return claimClassification{
			proofLayer:            "human-auditable",
			recommendedProof:      "human-auditable",
			verificationReadiness: "ready-to-verify",
			why:                   "The claim can be checked by reading current source, docs, or generated artifacts.",
			next:                  "Record the source reference and keep it human-auditable; add deterministic or eval proof only if behavior depends on execution.",
		}, true
	default:
		return claimClassification{}, false
	}
}

func recommendedEvalSurface(lower string) string {
	switch {
	case strings.Contains(lower, " review prompt"):
		return "dev/repo"
	case strings.Contains(lower, " prompt"):
		return "app/prompt"
	case strings.Contains(lower, " conversation") || strings.Contains(lower, " chat") || strings.Contains(lower, " assistant"):
		return "app/chat"
	case strings.Contains(lower, " skill"):
		return "dev/skill"
	default:
		return "dev/repo"
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

func claimFingerprint(summary string) string {
	hash := sha256.Sum256([]byte(normalizeClaimSummary(summary)))
	return "sha256:" + hex.EncodeToString(hash[:])
}

func fileSHA256(path string) (string, error) {
	content, err := os.ReadFile(path)
	if err != nil {
		return "", err
	}
	hash := sha256.Sum256(content)
	return "sha256:" + hex.EncodeToString(hash[:]), nil
}

func claimGroupHints(source claimSource, classification claimClassification) []string {
	hints := []string{classification.recommendedProof, source.kind}
	if source.audience != "" {
		hints = append(hints, "audience:"+source.audience)
	}
	if classification.verificationReadiness != "" && classification.verificationReadiness != "ready-to-verify" {
		hints = append(hints, classification.verificationReadiness)
	}
	if classification.recommendedEvalSurface != "" {
		hints = append(hints, classification.recommendedEvalSurface)
	}
	if source.discoveredFrom != "" {
		hints = append(hints, "linked-from:"+source.discoveredFrom)
	}
	return hints
}

func claimSemanticGroup(summary string, nextAction string, why string, surface string, hints []string, config claimDiscoveryConfig) string {
	haystack := strings.ToLower(strings.Join(append([]string{summary, nextAction, why, surface}, hints...), " "))
	for _, rule := range config.semanticGroups {
		if containsAny(haystack, rule.terms) {
			return rule.label
		}
	}
	return "General product behavior"
}

func mergeIdenticalClaimCandidates(candidates []claimCandidate) []claimCandidate {
	merged := make([]claimCandidate, 0, len(candidates))
	byFingerprint := map[string]int{}
	for _, candidate := range candidates {
		index, exists := byFingerprint[candidate.claimFingerprint]
		if !exists {
			byFingerprint[candidate.claimFingerprint] = len(merged)
			merged = append(merged, candidate)
			continue
		}
		existing := &merged[index]
		existing.sourceRefs = appendClaimSourceRefs(existing.sourceRefs, candidate.sourceRefs)
		existing.groupHints = mergeStringSet(existing.groupHints, candidate.groupHints)
		existing.claimAudience = mergeClaimAudience(existing.claimAudience, candidate.claimAudience)
		existing.claimAudienceSource = mergeClaimAudienceSource(existing.claimAudienceSource, candidate.claimAudienceSource)
		existing.claimSemanticGroup = mergeClaimSemanticGroup(existing.claimSemanticGroup, candidate.claimSemanticGroup)
	}
	for index := range merged {
		sortClaimSourceRefs(merged[index].sourceRefs)
		sort.Strings(merged[index].groupHints)
	}
	return merged
}

func mergeClaimSemanticGroup(existing string, incoming string) string {
	existing = strings.TrimSpace(existing)
	incoming = strings.TrimSpace(incoming)
	if existing == "" {
		return incoming
	}
	if incoming == "" || existing == incoming {
		return existing
	}
	return "General product behavior"
}

func mergeClaimAudience(existing string, incoming string) string {
	existing = strings.TrimSpace(existing)
	incoming = strings.TrimSpace(incoming)
	if existing == "" {
		return incoming
	}
	if incoming == "" || existing == incoming {
		return existing
	}
	return "unclear"
}

func mergeClaimAudienceSource(existing string, incoming string) string {
	existing = strings.TrimSpace(existing)
	incoming = strings.TrimSpace(incoming)
	if existing == "" {
		return incoming
	}
	if incoming == "" || existing == incoming {
		return existing
	}
	return "mixed"
}

func appendClaimSourceRefs(existing []claimSourceRef, incoming []claimSourceRef) []claimSourceRef {
	seen := map[string]struct{}{}
	for _, ref := range existing {
		seen[claimSourceRefKey(ref)] = struct{}{}
	}
	result := append([]claimSourceRef{}, existing...)
	for _, ref := range incoming {
		key := claimSourceRefKey(ref)
		if _, ok := seen[key]; ok {
			continue
		}
		seen[key] = struct{}{}
		result = append(result, ref)
	}
	return result
}

func claimSourceRefKey(ref claimSourceRef) string {
	return fmt.Sprintf("%s:%d:%s", filepath.ToSlash(ref.path), ref.line, ref.excerpt)
}

func sortClaimSourceRefs(refs []claimSourceRef) {
	sort.Slice(refs, func(i, j int) bool {
		if refs[i].path != refs[j].path {
			return refs[i].path < refs[j].path
		}
		if refs[i].line != refs[j].line {
			return refs[i].line < refs[j].line
		}
		return refs[i].excerpt < refs[j].excerpt
	})
}

func mergeStringSet(existing []string, incoming []string) []string {
	seen := map[string]struct{}{}
	result := []string{}
	for _, value := range append(existing, incoming...) {
		trimmed := strings.TrimSpace(value)
		if trimmed == "" {
			continue
		}
		if _, ok := seen[trimmed]; ok {
			continue
		}
		seen[trimmed] = struct{}{}
		result = append(result, trimmed)
	}
	return result
}

func renderClaimCandidates(candidates []claimCandidate) []any {
	result := make([]any, 0, len(candidates))
	for _, candidate := range candidates {
		entry := map[string]any{
			"claimId":               candidate.claimID,
			"claimFingerprint":      candidate.claimFingerprint,
			"summary":               candidate.summary,
			"recommendedProof":      candidate.recommendedProof,
			"verificationReadiness": candidate.verificationReadiness,
			"evidenceStatus":        candidate.evidenceStatus,
			"reviewStatus":          candidate.reviewStatus,
			"lifecycle":             candidate.lifecycle,
			"claimAudience":         claimAudienceOrUnclear(candidate.claimAudience),
			"claimAudienceSource":   claimAudienceSourceOrUnknown(candidate.claimAudienceSource),
			"claimSemanticGroup":    claimSemanticGroupOrGeneral(candidate.claimSemanticGroup),
			"groupHints":            candidate.groupHints,
			"evidenceRefs":          []any{},
			"sourceRefs":            renderClaimSourceRefs(candidate.sourceRefs),
			"proofLayer":            candidate.proofLayer,
			"whyThisLayer":          candidate.whyThisLayer,
			"nextAction":            candidate.nextAction,
		}
		if candidate.recommendedEvalSurface != "" {
			entry["recommendedEvalSurface"] = candidate.recommendedEvalSurface
		}
		result = append(result, entry)
	}
	return result
}

func renderClaimSourceRefs(refs []claimSourceRef) []any {
	result := make([]any, 0, len(refs))
	for _, ref := range refs {
		result = append(result, map[string]any{
			"path":    ref.path,
			"line":    ref.line,
			"excerpt": ref.excerpt,
		})
	}
	return result
}

func claimAudienceOrUnclear(value string) string {
	switch strings.TrimSpace(value) {
	case "user", "developer":
		return strings.TrimSpace(value)
	default:
		return "unclear"
	}
}

func claimAudienceSourceOrUnknown(value string) string {
	trimmed := strings.TrimSpace(value)
	if trimmed == "" {
		return "unknown"
	}
	return trimmed
}

func claimSemanticGroupOrGeneral(value string) string {
	trimmed := strings.TrimSpace(value)
	if trimmed == "" {
		return "General product behavior"
	}
	return trimmed
}

func renderClaimScanScope(config claimDiscoveryConfig) map[string]any {
	return map[string]any{
		"entries":             config.entries,
		"include":             nonNilStringSlice(config.include),
		"exclude":             nonNilStringSlice(config.exclude),
		"audienceHints":       renderClaimAudienceHints(config.audienceHints),
		"semanticGroups":      renderClaimSemanticGroups(config.semanticGroups),
		"linkedMarkdownDepth": config.linkedMarkdownDepth,
		"explicitSources":     config.explicitSources,
		"adapterFound":        config.adapterFound,
		"adapterPath":         config.adapterPath,
		"traversal":           "entry-markdown-links",
	}
}

func renderClaimAudienceHints(hints map[string][]string) map[string]any {
	rendered := map[string]any{}
	for _, audience := range []string{"user", "developer"} {
		rendered[audience] = nonNilStringSlice(hints[audience])
	}
	return rendered
}

func renderClaimSemanticGroups(groups []claimSemanticGroupRule) []any {
	rendered := make([]any, 0, len(groups))
	for _, group := range groups {
		rendered = append(rendered, map[string]any{
			"label": group.label,
			"terms": nonNilStringSlice(group.terms),
		})
	}
	return rendered
}

func nonNilStringSlice(values []string) []string {
	if values == nil {
		return []string{}
	}
	return values
}

func renderClaimState(config claimDiscoveryConfig) map[string]any {
	return map[string]any{
		"path":       config.statePath,
		"pathSource": config.statePathSource,
	}
}

func summarizeClaimCandidates(candidates []any) map[string]any {
	byProof := map[string]int{}
	byReadiness := map[string]int{}
	byEvidence := map[string]int{}
	byReview := map[string]int{}
	byLifecycle := map[string]int{}
	byProofLayer := map[string]int{}
	byAudience := map[string]int{}
	bySemanticGroup := map[string]int{}
	for _, raw := range candidates {
		entry := asMap(raw)
		incrementStringCount(byProof, entry["recommendedProof"])
		incrementStringCount(byReadiness, entry["verificationReadiness"])
		incrementStringCount(byEvidence, entry["evidenceStatus"])
		incrementStringCount(byReview, entry["reviewStatus"])
		incrementStringCount(byLifecycle, entry["lifecycle"])
		incrementStringCount(byProofLayer, entry["proofLayer"])
		incrementStringCount(byAudience, claimAudienceOrUnclear(stringFromAny(entry["claimAudience"])))
		incrementStringCount(bySemanticGroup, claimSemanticGroupOrGeneral(stringFromAny(entry["claimSemanticGroup"])))
	}
	return map[string]any{
		"byRecommendedProof":      sortedCountMap(byProof),
		"byVerificationReadiness": sortedCountMap(byReadiness),
		"byEvidenceStatus":        sortedCountMap(byEvidence),
		"byReviewStatus":          sortedCountMap(byReview),
		"byLifecycle":             sortedCountMap(byLifecycle),
		"byProofLayer":            sortedCountMap(byProofLayer),
		"byClaimAudience":         sortedCountMap(byAudience),
		"byClaimSemanticGroup":    sortedCountMap(bySemanticGroup),
	}
}

func BuildClaimStatusSummary(packet map[string]any, inputPath string) (map[string]any, error) {
	return BuildClaimStatusSummaryWithOptions(packet, ClaimStatusSummaryOptions{InputPath: inputPath})
}

func BuildClaimStatusSummaryWithOptions(packet map[string]any, options ClaimStatusSummaryOptions) (map[string]any, error) {
	if err := ValidateClaimProofPlan(packet); err != nil {
		return nil, err
	}
	candidates := arrayOrEmpty(packet["claimCandidates"])
	sourceInventory := arrayOrEmpty(packet["sourceInventory"])
	scanScope := asMap(packet["effectiveScanScope"])
	claimSummary := asMap(packet["claimSummary"])
	if len(claimSummary) == 0 {
		claimSummary = summarizeClaimCandidates(candidates)
	}
	status := map[string]any{
		"schemaVersion":             contracts.ClaimStatusSummarySchema,
		"inputPath":                 filepath.ToSlash(filepath.Clean(options.InputPath)),
		"inputSchemaVersion":        packet["schemaVersion"],
		"sourceRoot":                packet["sourceRoot"],
		"gitCommit":                 packet["gitCommit"],
		"candidateCount":            len(candidates),
		"sourceCount":               len(sourceInventory),
		"claimSummary":              claimSummary,
		"effectiveScanScope":        scanScope,
		"claimState":                asMap(packet["claimState"]),
		"nonVerdictNotice":          packet["nonVerdictNotice"],
		"reviewReadinessSummary":    claimReviewReadinessSummary(candidates),
		"recommendedNextActions":    claimStatusNextActions(claimSummary),
		"linkedMarkdownSourceCount": linkedMarkdownSourceCount(sourceInventory),
	}
	if strings.TrimSpace(options.RepoRoot) != "" {
		status["gitState"] = ClaimPacketGitState(packet, options.RepoRoot)
	}
	if options.SampleClaims > 0 {
		status["sampleClaims"] = claimStatusSampleClaims(candidates, options.SampleClaims)
	}
	return status, nil
}

func ClaimPacketGitState(packet map[string]any, repoRoot string) map[string]any {
	packetCommit := strings.TrimSpace(stringFromAny(packet["gitCommit"]))
	currentCommit := ""
	if strings.TrimSpace(repoRoot) != "" {
		currentCommit = currentGitCommit(repoRoot)
	}
	isStale := packetCommit != "" && currentCommit != "" && packetCommit != currentCommit
	state := map[string]any{
		"packetGitCommit":   packetCommit,
		"currentGitCommit":  currentCommit,
		"isStale":           isStale,
		"workingTreePolicy": "excluded",
		"comparisonStatus":  "unchecked",
		"recommendedAction": "Continue only after checking whether the packet commit still matches the current checkout.",
	}
	switch {
	case packetCommit == "":
		state["comparisonStatus"] = "missing-packet-commit"
		state["recommendedAction"] = "Regenerate the claim packet before review or eval planning."
	case currentCommit == "":
		state["comparisonStatus"] = "missing-current-commit"
		state["recommendedAction"] = "Use explicit operator judgment before consuming this claim packet."
	case isStale:
		changedSources := gitChangedFiles(repoRoot, packetCommit, currentCommit)
		state["comparisonStatus"] = "stale"
		state["changedSourceCount"] = len(changedSources)
		state["changedSources"] = changedSources
		state["recommendedAction"] = "Run claim discover --previous <claims.json> --refresh-plan before review, review application, or eval planning."
	default:
		state["comparisonStatus"] = "fresh"
		state["changedSourceCount"] = 0
		state["changedSources"] = []string{}
		state["recommendedAction"] = "The claim packet commit matches the current checkout."
	}
	return state
}

func RequireFreshClaimPacket(packet map[string]any, repoRoot string, commandName string, allowStale bool) error {
	if allowStale {
		return nil
	}
	gitState := ClaimPacketGitState(packet, repoRoot)
	if gitState["isStale"] != true {
		return nil
	}
	return fmt.Errorf("%s requires a fresh claim packet: packet gitCommit %s differs from current HEAD %s; run claim discover --previous <claims.json> --refresh-plan first or pass --allow-stale-claims",
		commandName,
		stringFromAny(gitState["packetGitCommit"]),
		stringFromAny(gitState["currentGitCommit"]),
	)
}

func claimStatusSampleClaims(candidates []any, limit int) []any {
	if limit <= 0 {
		return []any{}
	}
	result := make([]any, 0, minInt(limit, len(candidates)))
	for _, raw := range candidates {
		if len(result) >= limit {
			break
		}
		candidate := asMap(raw)
		entry := map[string]any{
			"claimId":               candidate["claimId"],
			"summary":               candidate["summary"],
			"proofLayer":            candidate["proofLayer"],
			"recommendedProof":      candidate["recommendedProof"],
			"verificationReadiness": candidate["verificationReadiness"],
			"evidenceStatus":        candidate["evidenceStatus"],
			"reviewStatus":          candidate["reviewStatus"],
			"lifecycle":             candidate["lifecycle"],
			"claimAudience":         candidate["claimAudience"],
			"claimSemanticGroup":    claimSemanticGroupOrGeneral(stringFromAny(candidate["claimSemanticGroup"])),
			"groupHints":            arrayOrEmpty(candidate["groupHints"]),
			"sourceRefs":            claimStatusSampleSourceRefs(arrayOrEmpty(candidate["sourceRefs"])),
			"nextAction":            candidate["nextAction"],
		}
		if surface := strings.TrimSpace(stringFromAny(candidate["recommendedEvalSurface"])); surface != "" {
			entry["recommendedEvalSurface"] = surface
		}
		result = append(result, entry)
	}
	return result
}

func claimStatusSampleSourceRefs(refs []any) []any {
	if len(refs) == 0 {
		return []any{}
	}
	ref := asMap(refs[0])
	return []any{
		map[string]any{
			"path": ref["path"],
			"line": ref["line"],
		},
	}
}

func linkedMarkdownSourceCount(sourceInventory []any) int {
	count := 0
	for _, raw := range sourceInventory {
		entry := asMap(raw)
		if intFromAny(entry["depth"]) > 0 {
			count++
		}
	}
	return count
}

func claimReviewReadinessSummary(candidates []any) map[string]any {
	readyForReview := 0
	needsScenario := 0
	needsAlignment := 0
	for _, raw := range candidates {
		entry := asMap(raw)
		switch stringFromAny(entry["verificationReadiness"]) {
		case "needs-scenario":
			needsScenario++
		case "needs-alignment":
			needsAlignment++
		default:
			if stringFromAny(entry["reviewStatus"]) == "heuristic" {
				readyForReview++
			}
		}
	}
	return map[string]any{
		"heuristicClaimsReadyForReview": readyForReview,
		"needsScenario":                 needsScenario,
		"needsAlignment":                needsAlignment,
	}
}

func claimStatusNextActions(summary map[string]any) []any {
	byProof := asMap(summary["byRecommendedProof"])
	byReadiness := asMap(summary["byVerificationReadiness"])
	actions := []any{}
	if intFromAny(byProof["cautilus-eval"]) > 0 {
		actions = append(actions, map[string]any{
			"id":      "prepare-claim-review",
			"summary": "Prepare bounded LLM claim review clusters after setting a review budget, before drafting eval scenarios.",
		})
	}
	if intFromAny(byProof["deterministic"]) > 0 {
		actions = append(actions, map[string]any{
			"id":      "add-deterministic-proof",
			"summary": "Add or connect unit, lint, build, schema, or CI proof for deterministic claims.",
		})
	}
	if intFromAny(byReadiness["needs-alignment"]) > 0 {
		actions = append(actions, map[string]any{
			"id":      "resolve-alignment",
			"summary": "Reconcile alignment-work claims before treating them as verification targets.",
		})
	}
	if len(actions) == 0 {
		actions = append(actions, map[string]any{
			"id":      "inspect-full-packet",
			"summary": "Inspect the full claim packet and select claims manually.",
		})
	}
	return actions
}

func BuildClaimReviewInput(packet map[string]any, options ClaimReviewInputOptions) (map[string]any, error) {
	if err := ValidateClaimProofPlan(packet); err != nil {
		return nil, err
	}
	if err := RequireFreshClaimPacket(packet, options.RepoRoot, "claim review prepare-input", options.AllowStaleClaims); err != nil {
		return nil, err
	}
	normalized := normalizeClaimReviewInputOptions(options)
	clusters := buildClaimReviewClusters(arrayOrEmpty(packet["claimCandidates"]), normalized)
	renderedClusters, skipped := renderClaimReviewClusters(clusters, normalized)
	return map[string]any{
		"schemaVersion": contracts.ClaimReviewInputSchema,
		"inputPath":     filepath.ToSlash(filepath.Clean(normalized.InputPath)),
		"sourceRoot":    packet["sourceRoot"],
		"sourceClaimPacket": map[string]any{
			"schemaVersion":  packet["schemaVersion"],
			"gitCommit":      packet["gitCommit"],
			"candidateCount": len(arrayOrEmpty(packet["claimCandidates"])),
		},
		"reviewBudget": map[string]any{
			"maxClusters":         normalized.MaxClusters,
			"maxClaimsPerCluster": normalized.MaxClaimsPerCluster,
			"excerptChars":        normalized.ExcerptChars,
			"clusterPolicy":       normalized.ClusterPolicy,
			"budgetSource":        "cli-or-default",
		},
		"clusters":        renderedClusters,
		"skippedClusters": skipped,
		"packetNotice":    "This packet prepares deterministic claim review input. It does not call an LLM or assert that any claim is satisfied.",
	}, nil
}

func normalizeClaimReviewInputOptions(options ClaimReviewInputOptions) ClaimReviewInputOptions {
	if options.MaxClusters <= 0 {
		options.MaxClusters = 20
	}
	if options.MaxClaimsPerCluster <= 0 {
		options.MaxClaimsPerCluster = 8
	}
	if options.ExcerptChars <= 0 {
		options.ExcerptChars = 1200
	}
	if strings.TrimSpace(options.ClusterPolicy) == "" {
		options.ClusterPolicy = "default"
	}
	return options
}

func buildClaimReviewClusters(candidates []any, options ClaimReviewInputOptions) []claimReviewCluster {
	clustersByKey := map[string]*claimReviewCluster{}
	keys := []string{}
	for _, raw := range candidates {
		entry := asMap(raw)
		key := claimReviewClusterKey(entry)
		cluster := clustersByKey[key]
		if cluster == nil {
			cluster = &claimReviewCluster{
				groupKey:               key,
				clusterID:              "cluster-" + slugifyClaimID(key),
				priority:               claimReviewPriority(entry),
				reason:                 claimReviewReason(entry),
				recommendedProof:       stringFromAny(entry["recommendedProof"]),
				verificationReadiness:  stringFromAny(entry["verificationReadiness"]),
				recommendedEvalSurface: stringFromAny(entry["recommendedEvalSurface"]),
				claimAudience:          claimAudienceOrUnclear(stringFromAny(entry["claimAudience"])),
				claimSemanticGroup:     claimSemanticGroupOrGeneral(stringFromAny(entry["claimSemanticGroup"])),
			}
			clustersByKey[key] = cluster
			keys = append(keys, key)
		}
		cluster.candidates = append(cluster.candidates, renderClaimReviewCandidate(entry, options.ExcerptChars))
		if priority := claimReviewPriority(entry); priority < cluster.priority {
			cluster.priority = priority
			cluster.reason = claimReviewReason(entry)
		}
	}
	clusters := make([]claimReviewCluster, 0, len(keys))
	for _, key := range keys {
		cluster := clustersByKey[key]
		sort.SliceStable(cluster.candidates, func(i, j int) bool {
			return stringFromAny(cluster.candidates[i]["claimId"]) < stringFromAny(cluster.candidates[j]["claimId"])
		})
		clusters = append(clusters, *cluster)
	}
	sort.SliceStable(clusters, func(i, j int) bool {
		if clusters[i].priority != clusters[j].priority {
			return clusters[i].priority < clusters[j].priority
		}
		return clusters[i].groupKey < clusters[j].groupKey
	})
	return clusters
}

func claimReviewClusterKey(candidate map[string]any) string {
	readiness := stringFromAny(candidate["verificationReadiness"])
	proof := stringFromAny(candidate["recommendedProof"])
	surface := stringFromAny(candidate["recommendedEvalSurface"])
	audience := claimAudienceOrUnclear(stringFromAny(candidate["claimAudience"]))
	semanticGroup := claimSemanticGroupOrGeneral(stringFromAny(candidate["claimSemanticGroup"]))
	sourceKind := primaryClaimSourceKind(candidate)
	prefix := audience + ":" + semanticGroup + ":"
	switch {
	case readiness == "needs-alignment":
		return prefix + "alignment:" + sourceKind
	case proof == "cautilus-eval" && surface != "":
		return prefix + "cautilus-eval:" + surface + ":" + sourceKind
	case proof != "":
		return prefix + proof + ":" + sourceKind
	default:
		return prefix + "unclassified:" + sourceKind
	}
}

func primaryClaimSourceKind(candidate map[string]any) string {
	refs := arrayOrEmpty(candidate["sourceRefs"])
	if len(refs) == 0 {
		return "unknown-source"
	}
	path := stringFromAny(asMap(refs[0])["path"])
	return claimSourceKind(path)
}

func claimReviewPriority(candidate map[string]any) int {
	audience := claimAudienceOrUnclear(stringFromAny(candidate["claimAudience"]))
	if audience == "unclear" {
		return 5
	}
	if claimHasEntrySource(candidate) && audience == "user" {
		return 10
	}
	if claimHasEntrySource(candidate) {
		return 15
	}
	if audience == "user" {
		return 20
	}
	if stringFromAny(candidate["recommendedProof"]) == "cautilus-eval" {
		return 30
	}
	if stringFromAny(candidate["verificationReadiness"]) == "needs-alignment" {
		return 40
	}
	if claimTouchesProductSurface(candidate) {
		return 50
	}
	if stringFromAny(candidate["evidenceStatus"]) != "satisfied" {
		return 60
	}
	return 90
}

func claimReviewReason(candidate map[string]any) string {
	audience := claimAudienceOrUnclear(stringFromAny(candidate["claimAudience"]))
	switch {
	case audience == "unclear":
		return "Unclear-audience claims are reviewed first because they need routing before proof planning."
	case claimHasEntrySource(candidate) && audience == "user":
		return "User-facing entry-surface claims are reviewed first because they define product promises."
	case claimHasEntrySource(candidate):
		return "Developer-facing entry-surface claims are reviewed after user promises because they define repo-worker behavior."
	case audience == "user":
		return "User-facing claims are reviewed before developer conventions because they are closest to product promises."
	case stringFromAny(candidate["recommendedProof"]) == "cautilus-eval":
		return "Evaluator-dependent claims need review before scenario drafting."
	case stringFromAny(candidate["verificationReadiness"]) == "needs-alignment":
		return "Alignment work needs review before proof would be honest."
	case claimTouchesProductSurface(candidate):
		return "Claims touching commands, skills, adapters, or release surfaces are high-impact."
	default:
		return "Claims with weak or missing evidence refs should be reviewed before next action selection."
	}
}

func claimHasEntrySource(candidate map[string]any) bool {
	for _, raw := range arrayOrEmpty(candidate["sourceRefs"]) {
		path := strings.ToLower(stringFromAny(asMap(raw)["path"]))
		if path == "readme.md" || path == "agents.md" || path == "claude.md" {
			return true
		}
	}
	return false
}

func claimTouchesProductSurface(candidate map[string]any) bool {
	text := strings.ToLower(stringFromAny(candidate["summary"]))
	return containsAny(text, []string{" command", " cli", " skill", " adapter", " release", " install", " plugin"})
}

func renderClaimReviewCandidate(candidate map[string]any, excerptChars int) map[string]any {
	return map[string]any{
		"claimId":          candidate["claimId"],
		"claimFingerprint": candidate["claimFingerprint"],
		"summary":          candidate["summary"],
		"sourceRefs":       truncateReviewSourceRefs(arrayOrEmpty(candidate["sourceRefs"]), excerptChars),
		"currentLabels":    currentClaimLabels(candidate),
		"groupHints":       arrayOrEmpty(candidate["groupHints"]),
		"evidenceRefs":     arrayOrEmpty(candidate["evidenceRefs"]),
		"nextAction":       candidate["nextAction"],
	}
}

func truncateReviewSourceRefs(refs []any, excerptChars int) []any {
	result := make([]any, 0, len(refs))
	for _, raw := range refs {
		ref := asMap(raw)
		rendered := map[string]any{
			"path": ref["path"],
			"line": ref["line"],
		}
		excerpt := stringFromAny(ref["excerpt"])
		if excerptChars > 0 && len(excerpt) > excerptChars {
			excerpt = excerpt[:excerptChars]
		}
		rendered["excerpt"] = excerpt
		result = append(result, rendered)
	}
	return result
}

func currentClaimLabels(candidate map[string]any) map[string]any {
	labels := map[string]any{
		"recommendedProof":      candidate["recommendedProof"],
		"verificationReadiness": candidate["verificationReadiness"],
		"evidenceStatus":        candidate["evidenceStatus"],
		"reviewStatus":          candidate["reviewStatus"],
		"lifecycle":             candidate["lifecycle"],
		"proofLayer":            candidate["proofLayer"],
		"claimAudience":         candidate["claimAudience"],
		"claimSemanticGroup":    claimSemanticGroupOrGeneral(stringFromAny(candidate["claimSemanticGroup"])),
	}
	if surface := stringFromAny(candidate["recommendedEvalSurface"]); surface != "" {
		labels["recommendedEvalSurface"] = surface
	}
	return labels
}

func renderClaimReviewClusters(clusters []claimReviewCluster, options ClaimReviewInputOptions) ([]any, []any) {
	rendered := []any{}
	skipped := []any{}
	for index, cluster := range clusters {
		if index >= options.MaxClusters {
			skipped = append(skipped, map[string]any{
				"clusterId":  cluster.clusterID,
				"groupKey":   cluster.groupKey,
				"reason":     "max-clusters-exceeded",
				"claimCount": len(cluster.candidates),
			})
			continue
		}
		candidates := cluster.candidates
		truncatedCount := 0
		if len(candidates) > options.MaxClaimsPerCluster {
			truncatedCount = len(candidates) - options.MaxClaimsPerCluster
			candidates = candidates[:options.MaxClaimsPerCluster]
		}
		entry := map[string]any{
			"clusterId":             cluster.clusterID,
			"groupKey":              cluster.groupKey,
			"priority":              cluster.priority,
			"reason":                cluster.reason,
			"recommendedProof":      cluster.recommendedProof,
			"verificationReadiness": cluster.verificationReadiness,
			"claimAudience":         cluster.claimAudience,
			"claimSemanticGroup":    cluster.claimSemanticGroup,
			"claimCount":            len(cluster.candidates),
		}
		if cluster.recommendedEvalSurface != "" {
			entry["recommendedEvalSurface"] = cluster.recommendedEvalSurface
		}
		if truncatedCount > 0 {
			entry["truncatedClaimCount"] = truncatedCount
		}
		renderedCandidates := make([]any, 0, len(candidates))
		for _, candidate := range candidates {
			renderedCandidates = append(renderedCandidates, candidate)
		}
		entry["candidates"] = renderedCandidates
		rendered = append(rendered, entry)
	}
	return rendered, skipped
}

func ApplyClaimReviewResult(claimPacket map[string]any, reviewResult map[string]any, options ClaimReviewApplyOptions) (map[string]any, error) {
	if err := ValidateClaimProofPlan(claimPacket); err != nil {
		return nil, err
	}
	if err := RequireFreshClaimPacket(claimPacket, options.RepoRoot, "claim review apply-result", options.AllowStaleClaims); err != nil {
		return nil, err
	}
	if err := validateClaimReviewResult(reviewResult); err != nil {
		return nil, err
	}
	updated, err := cloneJSON(claimPacket)
	if err != nil {
		return nil, err
	}
	candidates := arrayOrEmpty(updated["claimCandidates"])
	candidatesByID := map[string]map[string]any{}
	for _, raw := range candidates {
		entry := asMap(raw)
		claimID := stringFromAny(entry["claimId"])
		if claimID != "" {
			candidatesByID[claimID] = entry
		}
	}
	appliedUpdates := []any{}
	for _, rawCluster := range arrayOrEmpty(reviewResult["clusterResults"]) {
		cluster := asMap(rawCluster)
		clusterID := stringFromAny(cluster["clusterId"])
		for _, rawUpdate := range arrayOrEmpty(cluster["claimUpdates"]) {
			update := asMap(rawUpdate)
			claimID := stringFromAny(update["claimId"])
			candidate := candidatesByID[claimID]
			if candidate == nil {
				return nil, fmt.Errorf("review result references unknown claimId %q", claimID)
			}
			appliedFields, err := applyClaimUpdate(candidate, update)
			if err != nil {
				return nil, fmt.Errorf("claim %s: %w", claimID, err)
			}
			appliedUpdates = append(appliedUpdates, map[string]any{
				"clusterId":     clusterID,
				"claimId":       claimID,
				"appliedFields": appliedFields,
			})
		}
	}
	updated["claimSummary"] = summarizeClaimCandidates(candidates)
	updated["candidateCount"] = len(candidates)
	updated["reviewApplication"] = map[string]any{
		"schemaVersion":       contracts.ClaimReviewResultSchema,
		"claimsPath":          filepath.ToSlash(filepath.Clean(options.ClaimsPath)),
		"reviewResultPath":    filepath.ToSlash(filepath.Clean(options.ReviewResultPath)),
		"appliedUpdateCount":  len(appliedUpdates),
		"appliedUpdates":      appliedUpdates,
		"mergeDecisions":      collectClaimMergeDecisions(reviewResult),
		"unresolvedQuestions": collectClaimUnresolvedQuestions(reviewResult),
	}
	reviewRuns := append(arrayOrEmpty(updated["reviewRuns"]), renderClaimReviewRun(reviewResult))
	updated["reviewRuns"] = reviewRuns
	if err := ValidateClaimProofPlan(updated); err != nil {
		return nil, err
	}
	return updated, nil
}

func BuildClaimEvalPlan(packet map[string]any, options ClaimEvalPlanOptions) (map[string]any, error) {
	if err := ValidateClaimProofPlan(packet); err != nil {
		return nil, err
	}
	if err := RequireFreshClaimPacket(packet, options.RepoRoot, "claim plan-evals", options.AllowStaleClaims); err != nil {
		return nil, err
	}
	maxClaims := options.MaxClaims
	if maxClaims <= 0 {
		maxClaims = 20
	}
	plans := []any{}
	skipped := []any{}
	for _, raw := range arrayOrEmpty(packet["claimCandidates"]) {
		candidate := asMap(raw)
		claimID := stringFromAny(candidate["claimId"])
		if stringFromAny(candidate["recommendedProof"]) != "cautilus-eval" {
			skipped = append(skipped, skippedClaimEvalPlan(claimID, "not-cautilus-eval"))
			continue
		}
		if stringFromAny(candidate["verificationReadiness"]) != "ready-to-verify" {
			skipped = append(skipped, skippedClaimEvalPlan(claimID, "not-ready-to-verify"))
			continue
		}
		if !claimEvalPlanReviewAccepted(stringFromAny(candidate["reviewStatus"])) {
			skipped = append(skipped, skippedClaimEvalPlan(claimID, "not-reviewed"))
			continue
		}
		if len(plans) >= maxClaims {
			skipped = append(skipped, skippedClaimEvalPlan(claimID, "max-claims-exceeded"))
			continue
		}
		plans = append(plans, map[string]any{
			"planId":              "eval-plan-" + slugifyClaimID(claimID),
			"claimId":             claimID,
			"claimFingerprint":    candidate["claimFingerprint"],
			"targetSurface":       claimEvalPlanSurface(candidate),
			"draftIntent":         claimEvalPlanIntent(candidate),
			"sourceRefs":          arrayOrEmpty(candidate["sourceRefs"]),
			"evidenceStatus":      candidate["evidenceStatus"],
			"reviewStatus":        candidate["reviewStatus"],
			"unresolvedQuestions": arrayOrEmpty(candidate["unresolvedQuestions"]),
			"nextStep":            "Create a host-owned cautilus.evaluation_input.v1 fixture and adapter-owned runner for this plan.",
		})
	}
	return map[string]any{
		"schemaVersion": contracts.ClaimEvalPlanSchema,
		"inputPath":     filepath.ToSlash(filepath.Clean(options.ClaimsPath)),
		"sourceClaimPacket": map[string]any{
			"schemaVersion":  packet["schemaVersion"],
			"gitCommit":      packet["gitCommit"],
			"candidateCount": len(arrayOrEmpty(packet["claimCandidates"])),
		},
		"selectionPolicy": map[string]any{
			"requiresRecommendedProof":      "cautilus-eval",
			"requiresVerificationReadiness": "ready-to-verify",
			"requiresReviewStatus":          []any{"agent-reviewed", "human-reviewed"},
			"maxClaims":                     maxClaims,
		},
		"evalPlans":       plans,
		"skippedClaims":   skipped,
		"nonWriterNotice": "This packet plans eval fixtures but does not write host-owned fixtures, prompts, runners, or policy.",
	}, nil
}

func skippedClaimEvalPlan(claimID string, reason string) map[string]any {
	return map[string]any{
		"claimId": claimID,
		"reason":  reason,
	}
}

func claimEvalPlanReviewAccepted(status string) bool {
	switch status {
	case "agent-reviewed", "human-reviewed":
		return true
	default:
		return false
	}
}

func claimEvalPlanSurface(candidate map[string]any) string {
	if surface := stringFromAny(candidate["recommendedEvalSurface"]); surface != "" {
		return surface
	}
	return "dev/repo"
}

func claimEvalPlanIntent(candidate map[string]any) string {
	summary := stringFromAny(candidate["summary"])
	if summary == "" {
		return "Verify the selected claim through a bounded Cautilus eval fixture."
	}
	return "Verify that " + strings.TrimSuffix(summary, ".") + "."
}

func BuildClaimValidationReport(packet map[string]any, options ClaimValidationOptions) map[string]any {
	issues := []any{}
	if err := ValidateClaimProofPlan(packet); err != nil {
		issues = append(issues, claimValidationIssue("$", err.Error()))
	}
	for index, raw := range arrayOrEmpty(packet["claimCandidates"]) {
		candidate := asMap(raw)
		path := fmt.Sprintf("$.claimCandidates[%d]", index)
		claimID := stringFromAny(candidate["claimId"])
		if err := validateClaimEvidenceSatisfaction(candidate); err != nil {
			issues = append(issues, claimValidationIssue(path+".evidenceRefs", err.Error()))
		}
		for refIndex, rawRef := range arrayOrEmpty(candidate["sourceRefs"]) {
			ref, ok := rawRef.(map[string]any)
			refPath := fmt.Sprintf("%s.sourceRefs[%d]", path, refIndex)
			if !ok {
				issues = append(issues, claimValidationIssue(refPath, "source ref must be an object"))
				continue
			}
			if stringFromAny(ref["path"]) == "" {
				issues = append(issues, claimValidationIssue(refPath+".path", "source ref requires path"))
			}
			if intFromAny(ref["line"]) <= 0 {
				issues = append(issues, claimValidationIssue(refPath+".line", "source ref requires a positive line"))
			}
		}
		for refIndex, rawRef := range arrayOrEmpty(candidate["evidenceRefs"]) {
			refPath := fmt.Sprintf("%s.evidenceRefs[%d]", path, refIndex)
			ref, ok := rawRef.(map[string]any)
			if !ok {
				issues = append(issues, claimValidationIssue(refPath, "evidence ref must be an object"))
				continue
			}
			matchKind := stringFromAny(ref["matchKind"])
			if matchKind != "" && matchKind != "possible" && matchKind != "direct" && matchKind != "verified" {
				issues = append(issues, claimValidationIssue(refPath+".matchKind", fmt.Sprintf("matchKind %q is unsupported", matchKind)))
			}
			if matchKind == "direct" || matchKind == "verified" {
				if stringFromAny(ref["path"]) == "" {
					issues = append(issues, claimValidationIssue(refPath+".path", "direct or verified evidence refs require path"))
				}
				if stringFromAny(ref["kind"]) == "" {
					issues = append(issues, claimValidationIssue(refPath+".kind", "direct or verified evidence refs require kind"))
				}
				if stringFromAny(ref["commit"]) == "" && stringFromAny(ref["contentHash"]) == "" {
					issues = append(issues, claimValidationIssue(refPath, "direct or verified evidence refs require commit or contentHash"))
				}
				if claimID != "" && !evidenceRefSupportsClaim(ref, claimID) {
					issues = append(issues, claimValidationIssue(refPath+".supportsClaimIds", "evidence ref must include this claimId in supportsClaimIds"))
				}
			}
			if _, ok := ref["supportsClaimIds"]; ok {
				if _, err := assertArray(ref["supportsClaimIds"], refPath+".supportsClaimIds"); err != nil {
					issues = append(issues, claimValidationIssue(refPath+".supportsClaimIds", err.Error()))
				}
			}
		}
	}
	return map[string]any{
		"schemaVersion":            contracts.ClaimValidationReportSchema,
		"inputPath":                filepath.ToSlash(filepath.Clean(options.InputPath)),
		"inputSchemaVersion":       packet["schemaVersion"],
		"candidateCount":           len(arrayOrEmpty(packet["claimCandidates"])),
		"issueCount":               len(issues),
		"valid":                    len(issues) == 0,
		"issues":                   issues,
		"evidenceValidationPolicy": "satisfied claims require agent/human review plus a direct or verified evidence ref with path, kind, commit or contentHash, and supportsClaimIds containing the claim.",
		"nonMutationNotice":        "This command validates the packet and evidence refs but does not change claims or search for evidence.",
	}
}

func claimValidationIssue(path string, message string) map[string]any {
	return map[string]any{
		"severity": "error",
		"path":     path,
		"message":  message,
	}
}

func validateClaimReviewResult(result map[string]any) error {
	if result["schemaVersion"] != contracts.ClaimReviewResultSchema {
		return fmt.Errorf("schemaVersion must be %s", contracts.ClaimReviewResultSchema)
	}
	if _, err := assertArray(result["clusterResults"], "clusterResults"); err != nil {
		return err
	}
	for clusterIndex, rawCluster := range arrayOrEmpty(result["clusterResults"]) {
		cluster := asMap(rawCluster)
		if _, err := normalizeNonEmptyString(cluster["clusterId"], fmt.Sprintf("clusterResults[%d].clusterId", clusterIndex)); err != nil {
			return err
		}
		for updateIndex, rawUpdate := range arrayOrEmpty(cluster["claimUpdates"]) {
			update := asMap(rawUpdate)
			field := fmt.Sprintf("clusterResults[%d].claimUpdates[%d]", clusterIndex, updateIndex)
			if _, err := normalizeNonEmptyString(update["claimId"], field+".claimId"); err != nil {
				return err
			}
			if err := validateClaimUpdateFields(update, field); err != nil {
				return err
			}
		}
	}
	return nil
}

func validateClaimUpdateFields(update map[string]any, field string) error {
	if value := stringFromAny(update["recommendedProof"]); value != "" && !validRecommendedProof(value) {
		return fmt.Errorf("%s.recommendedProof %q is unsupported", field, value)
	}
	if value := stringFromAny(update["verificationReadiness"]); value != "" && !validVerificationReadiness(value) {
		return fmt.Errorf("%s.verificationReadiness %q is unsupported", field, value)
	}
	if value := stringFromAny(update["evidenceStatus"]); value != "" && !validEvidenceStatus(value) {
		return fmt.Errorf("%s.evidenceStatus %q is unsupported", field, value)
	}
	if value := stringFromAny(update["reviewStatus"]); value != "" && !validReviewStatus(value) {
		return fmt.Errorf("%s.reviewStatus %q is unsupported", field, value)
	}
	if value := stringFromAny(update["lifecycle"]); value != "" && !validClaimLifecycle(value) {
		return fmt.Errorf("%s.lifecycle %q is unsupported", field, value)
	}
	if value := stringFromAny(update["recommendedEvalSurface"]); value != "" && !validEvalSurface(value) {
		return fmt.Errorf("%s.recommendedEvalSurface %q is unsupported", field, value)
	}
	return nil
}

func applyClaimUpdate(candidate map[string]any, update map[string]any) ([]any, error) {
	applied := []any{}
	for _, field := range []string{"recommendedProof", "verificationReadiness", "evidenceStatus", "reviewStatus", "lifecycle", "recommendedEvalSurface"} {
		if value := stringFromAny(update[field]); value != "" {
			candidate[field] = value
			applied = append(applied, field)
		}
	}
	if refs := arrayOrEmpty(update["evidenceRefs"]); len(refs) > 0 {
		candidate["evidenceRefs"] = refs
		applied = append(applied, "evidenceRefs")
	}
	if nextAction := stringFromAny(update["nextAction"]); nextAction != "" {
		candidate["nextAction"] = nextAction
		applied = append(applied, "nextAction")
	}
	if reason := stringFromAny(update["evidenceStatusReason"]); reason != "" {
		candidate["evidenceStatusReason"] = reason
		applied = append(applied, "evidenceStatusReason")
	}
	if questions := arrayOrEmpty(update["unresolvedQuestions"]); len(questions) > 0 {
		candidate["unresolvedQuestions"] = questions
		applied = append(applied, "unresolvedQuestions")
	}
	recommendedProof := stringFromAny(candidate["recommendedProof"])
	readiness := stringFromAny(candidate["verificationReadiness"])
	candidate["proofLayer"] = derivedProofLayer(recommendedProof, readiness)
	if err := validateClaimEvidenceSatisfaction(candidate); err != nil {
		return nil, err
	}
	return applied, nil
}

func validateClaimEvidenceSatisfaction(candidate map[string]any) error {
	if stringFromAny(candidate["evidenceStatus"]) != "satisfied" {
		return nil
	}
	if stringFromAny(candidate["reviewStatus"]) == "heuristic" {
		return fmt.Errorf("evidenceStatus satisfied requires agent-reviewed or human-reviewed reviewStatus")
	}
	claimID := stringFromAny(candidate["claimId"])
	for _, rawRef := range arrayOrEmpty(candidate["evidenceRefs"]) {
		ref := asMap(rawRef)
		matchKind := stringFromAny(ref["matchKind"])
		if matchKind != "verified" && matchKind != "direct" {
			continue
		}
		if stringFromAny(ref["path"]) == "" || stringFromAny(ref["kind"]) == "" {
			continue
		}
		if stringFromAny(ref["commit"]) == "" && stringFromAny(ref["contentHash"]) == "" {
			continue
		}
		if !evidenceRefSupportsClaim(ref, claimID) {
			continue
		}
		return nil
	}
	return fmt.Errorf("evidenceStatus satisfied requires a direct or verified evidenceRef with path, kind, commit or contentHash, and supportsClaimIds containing the claim")
}

func evidenceRefSupportsClaim(ref map[string]any, claimID string) bool {
	for _, raw := range arrayOrEmpty(ref["supportsClaimIds"]) {
		if stringFromAny(raw) == claimID {
			return true
		}
	}
	return false
}

func collectClaimMergeDecisions(result map[string]any) []any {
	decisions := []any{}
	for _, rawCluster := range arrayOrEmpty(result["clusterResults"]) {
		cluster := asMap(rawCluster)
		clusterID := stringFromAny(cluster["clusterId"])
		for _, rawDecision := range arrayOrEmpty(cluster["mergeDecisions"]) {
			decision := asMap(rawDecision)
			decision["clusterId"] = clusterID
			decisions = append(decisions, decision)
		}
	}
	return decisions
}

func collectClaimUnresolvedQuestions(result map[string]any) []any {
	questions := []any{}
	for _, rawCluster := range arrayOrEmpty(result["clusterResults"]) {
		cluster := asMap(rawCluster)
		clusterID := stringFromAny(cluster["clusterId"])
		for _, rawQuestion := range arrayOrEmpty(cluster["unresolvedQuestions"]) {
			questions = append(questions, map[string]any{
				"clusterId": clusterID,
				"question":  rawQuestion,
			})
		}
	}
	return questions
}

func renderClaimReviewRun(result map[string]any) map[string]any {
	reviewRun := asMap(result["reviewRun"])
	return map[string]any{
		"schemaVersion":     contracts.ClaimReviewResultSchema,
		"reviewRun":         reviewRun,
		"sourceReviewInput": asMap(result["sourceReviewInput"]),
		"clusterCount":      len(arrayOrEmpty(result["clusterResults"])),
	}
}

func incrementStringCount(counts map[string]int, value any) {
	text := strings.TrimSpace(stringOrEmpty(value))
	if text == "" {
		return
	}
	counts[text]++
}

func sortedCountMap(counts map[string]int) map[string]any {
	keys := make([]string, 0, len(counts))
	for key := range counts {
		keys = append(keys, key)
	}
	sort.Strings(keys)
	result := map[string]any{}
	for _, key := range keys {
		result[key] = counts[key]
	}
	return result
}

func currentGitCommit(repoRoot string) string {
	command := exec.Command("git", "-C", repoRoot, "rev-parse", "HEAD")
	output, err := command.Output()
	if err != nil {
		return ""
	}
	return strings.TrimSpace(string(output))
}

type ClaimRefreshPlanOptions struct {
	RepoRoot     string
	PreviousPath string
	Config       claimDiscoveryConfig
}

func BuildClaimRefreshPlan(options ClaimRefreshPlanOptions) (map[string]any, error) {
	if strings.TrimSpace(options.PreviousPath) == "" {
		return nil, fmt.Errorf("--previous is required with --refresh-plan")
	}
	content, err := os.ReadFile(resolvePath(options.RepoRoot, options.PreviousPath))
	if err != nil {
		return nil, err
	}
	var previous map[string]any
	if err := json.Unmarshal(content, &previous); err != nil {
		return nil, err
	}
	baseCommit := strings.TrimSpace(stringOrEmpty(previous["gitCommit"]))
	targetCommit := currentGitCommit(options.RepoRoot)
	changedSources := []string{}
	if baseCommit != "" && targetCommit != "" {
		changedSources = gitChangedFiles(options.RepoRoot, baseCommit, targetCommit)
	}
	previousCandidates := arrayOrEmpty(previous["claimCandidates"])
	claims := []any{}
	changedClaimCount := 0
	carriedForwardClaimCount := 0
	changedClaimSourceCounts := map[string]int{}
	for _, raw := range previousCandidates {
		entry := asMap(raw)
		claimID := stringOrEmpty(entry["claimId"])
		sourceChanged := false
		changedClaimSources := []string{}
		for _, sourceRef := range arrayOrEmpty(entry["sourceRefs"]) {
			path := stringOrEmpty(asMap(sourceRef)["path"])
			if claimStringListContains(changedSources, path) {
				sourceChanged = true
				if !claimStringListContains(changedClaimSources, path) {
					changedClaimSources = append(changedClaimSources, path)
				}
			}
		}
		lifecycle := "carried-forward"
		if sourceChanged {
			lifecycle = "changed"
			changedClaimCount++
			for _, path := range changedClaimSources {
				changedClaimSourceCounts[path]++
			}
		} else {
			carriedForwardClaimCount++
		}
		claims = append(claims, map[string]any{
			"claimId":   claimID,
			"lifecycle": lifecycle,
		})
	}
	refreshSummary := renderClaimRefreshSummary(baseCommit, targetCommit, changedSources, changedClaimCount, carriedForwardClaimCount, changedClaimSourceCounts)
	return map[string]any{
		"schemaVersion":      contracts.ClaimRefreshPlanSchema,
		"sourceRoot":         ".",
		"previousPath":       filepath.ToSlash(filepath.Clean(options.PreviousPath)),
		"baseCommit":         baseCommit,
		"targetCommit":       targetCommit,
		"workingTreePolicy":  "excluded",
		"changedSources":     changedSources,
		"claimPlan":          claims,
		"refreshSummary":     refreshSummary,
		"claimState":         renderClaimState(options.Config),
		"effectiveScanScope": renderClaimScanScope(options.Config),
	}, nil
}

func renderClaimRefreshSummary(baseCommit string, targetCommit string, changedSources []string, changedClaimCount int, carriedForwardClaimCount int, changedClaimSourceCounts map[string]int) map[string]any {
	status := "up-to-date"
	summary := "The saved claim map already matches the current checkout; no refresh work is needed before review or eval planning."
	if baseCommit == "" || targetCommit == "" {
		status = "unknown"
		summary = "Cautilus could not compare the saved claim map with the current checkout because git commit information is missing."
	} else if baseCommit != targetCommit {
		if changedClaimCount > 0 {
			status = "changes-detected"
			summary = "The saved claim map was made from an older checkout; this plan identifies claims whose source files changed and does not update the saved claim map yet."
		} else if len(changedSources) > 0 {
			status = "repo-changed-no-claim-source-hit"
			summary = "The repo changed since the saved claim map, but none of the changed files are referenced by existing claims in this packet."
		} else {
			status = "commit-changed-no-file-diff"
			summary = "The saved claim map points at an older commit, but Cautilus did not find changed files between the two commits."
		}
	}
	nextActions := []any{
		map[string]any{
			"id":     "update_saved_claim_map",
			"label":  "Update the saved claim map before review or eval planning",
			"detail": "Run claim discovery to write a fresh claim packet, then use claim show to inspect the updated status.",
		},
		map[string]any{
			"id":     "inspect_refresh_plan",
			"label":  "Inspect which files and claims changed",
			"detail": "Use this refresh plan to focus review on changed sources before launching any reviewer or eval workflow.",
		},
		map[string]any{
			"id":     "stop",
			"label":  "Stop after recording the refresh plan",
			"detail": "Choose this if the coordinator only wanted to make the stale state explicit for a later session.",
		},
	}
	if status == "up-to-date" {
		nextActions = []any{
			map[string]any{
				"id":     "show_saved_claim_map",
				"label":  "Inspect the saved claim map",
				"detail": "Use claim show to decide whether to review claims, add deterministic tests, or plan Cautilus eval scenarios.",
			},
			map[string]any{
				"id":     "stop",
				"label":  "Stop after confirming the claim map is current",
				"detail": "Choose this if no review or eval planning is needed now.",
			},
		}
	}
	return map[string]any{
		"status":                   status,
		"summary":                  summary,
		"baseCommit":               baseCommit,
		"targetCommit":             targetCommit,
		"workingTreePolicy":        "excluded",
		"changedSourceCount":       len(changedSources),
		"changedClaimCount":        changedClaimCount,
		"carriedForwardClaimCount": carriedForwardClaimCount,
		"changedClaimSources":      renderCountEntries(changedClaimSourceCounts),
		"nextActions":              nextActions,
	}
}

func renderCountEntries(counts map[string]int) []any {
	keys := make([]string, 0, len(counts))
	for key := range counts {
		keys = append(keys, key)
	}
	sort.Slice(keys, func(i int, j int) bool {
		left := counts[keys[i]]
		right := counts[keys[j]]
		if left != right {
			return left > right
		}
		return keys[i] < keys[j]
	})
	result := []any{}
	for _, key := range keys {
		result = append(result, map[string]any{
			"path":       key,
			"claimCount": counts[key],
		})
	}
	return result
}

func gitChangedFiles(repoRoot string, baseCommit string, targetCommit string) []string {
	command := exec.Command("git", "-C", repoRoot, "diff", "--name-only", baseCommit, targetCommit)
	output, err := command.Output()
	if err != nil {
		return []string{}
	}
	lines := strings.Split(strings.TrimSpace(string(output)), "\n")
	result := []string{}
	for _, line := range lines {
		text := strings.TrimSpace(line)
		if text != "" {
			result = append(result, filepath.ToSlash(filepath.Clean(text)))
		}
	}
	sort.Strings(result)
	return result
}

func claimStringListContains(values []string, value string) bool {
	for _, item := range values {
		if item == value {
			return true
		}
	}
	return false
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
		if _, err := normalizeNonEmptyString(entry["claimFingerprint"], fmt.Sprintf("claimCandidates[%d].claimFingerprint", index)); err != nil {
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
		recommendedProof, err := normalizeNonEmptyString(entry["recommendedProof"], fmt.Sprintf("claimCandidates[%d].recommendedProof", index))
		if err != nil {
			return err
		}
		if !validRecommendedProof(recommendedProof) {
			return fmt.Errorf("claimCandidates[%d].recommendedProof %q is unsupported", index, recommendedProof)
		}
		readiness, err := normalizeNonEmptyString(entry["verificationReadiness"], fmt.Sprintf("claimCandidates[%d].verificationReadiness", index))
		if err != nil {
			return err
		}
		if !validVerificationReadiness(readiness) {
			return fmt.Errorf("claimCandidates[%d].verificationReadiness %q is unsupported", index, readiness)
		}
		if !claimProofLayerMatchesSplitFields(layer, recommendedProof, readiness) {
			return fmt.Errorf("claimCandidates[%d].proofLayer %q does not match recommendedProof=%q verificationReadiness=%q", index, layer, recommendedProof, readiness)
		}
		evidenceStatus, err := normalizeNonEmptyString(entry["evidenceStatus"], fmt.Sprintf("claimCandidates[%d].evidenceStatus", index))
		if err != nil {
			return err
		}
		if !validEvidenceStatus(evidenceStatus) {
			return fmt.Errorf("claimCandidates[%d].evidenceStatus %q is unsupported", index, evidenceStatus)
		}
		reviewStatus, err := normalizeNonEmptyString(entry["reviewStatus"], fmt.Sprintf("claimCandidates[%d].reviewStatus", index))
		if err != nil {
			return err
		}
		if !validReviewStatus(reviewStatus) {
			return fmt.Errorf("claimCandidates[%d].reviewStatus %q is unsupported", index, reviewStatus)
		}
		lifecycle, err := normalizeNonEmptyString(entry["lifecycle"], fmt.Sprintf("claimCandidates[%d].lifecycle", index))
		if err != nil {
			return err
		}
		if !validClaimLifecycle(lifecycle) {
			return fmt.Errorf("claimCandidates[%d].lifecycle %q is unsupported", index, lifecycle)
		}
		if evidenceStatus == "satisfied" && reviewStatus == "heuristic" {
			return fmt.Errorf("claimCandidates[%d].evidenceStatus satisfied requires agent-reviewed or human-reviewed reviewStatus", index)
		}
		if surface := strings.TrimSpace(stringFromAny(entry["recommendedEvalSurface"])); surface != "" && !validEvalSurface(surface) {
			return fmt.Errorf("claimCandidates[%d].recommendedEvalSurface %q is unsupported", index, surface)
		}
		if audience := strings.TrimSpace(stringFromAny(entry["claimAudience"])); audience != "" && !validClaimAudience(audience) {
			return fmt.Errorf("claimCandidates[%d].claimAudience %q is unsupported", index, audience)
		}
		if _, exists := entry["claimSemanticGroup"]; exists {
			if _, err := normalizeNonEmptyString(entry["claimSemanticGroup"], fmt.Sprintf("claimCandidates[%d].claimSemanticGroup", index)); err != nil {
				return err
			}
		}
		if _, err := assertArray(entry["evidenceRefs"], fmt.Sprintf("claimCandidates[%d].evidenceRefs", index)); err != nil {
			return err
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

func validClaimAudience(value string) bool {
	switch value {
	case "user", "developer", "unclear":
		return true
	default:
		return false
	}
}

func validProofLayer(value string) bool {
	switch value {
	case "human-auditable", "deterministic", "cautilus-eval", "scenario-candidate", "alignment-work":
		return true
	default:
		return false
	}
}

func claimProofLayerMatchesSplitFields(proofLayer string, recommendedProof string, readiness string) bool {
	return proofLayer == derivedProofLayer(recommendedProof, readiness)
}

func derivedProofLayer(recommendedProof string, readiness string) string {
	switch {
	case readiness == "needs-alignment":
		return "alignment-work"
	case recommendedProof == "cautilus-eval" && readiness == "needs-scenario":
		return "scenario-candidate"
	default:
		return recommendedProof
	}
}

func validRecommendedProof(value string) bool {
	switch value {
	case "human-auditable", "deterministic", "cautilus-eval":
		return true
	default:
		return false
	}
}

func validVerificationReadiness(value string) bool {
	switch value {
	case "ready-to-verify", "needs-scenario", "needs-alignment", "blocked":
		return true
	default:
		return false
	}
}

func validEvidenceStatus(value string) bool {
	switch value {
	case "satisfied", "missing", "partial", "stale", "unknown":
		return true
	default:
		return false
	}
}

func validReviewStatus(value string) bool {
	switch value {
	case "heuristic", "agent-reviewed", "human-reviewed":
		return true
	default:
		return false
	}
}

func validClaimLifecycle(value string) bool {
	switch value {
	case "new", "carried-forward", "changed", "retired":
		return true
	default:
		return false
	}
}

func validEvalSurface(value string) bool {
	switch value {
	case "dev/repo", "dev/skill", "app/chat", "app/prompt":
		return true
	default:
		return false
	}
}
