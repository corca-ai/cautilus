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
	ActionBucket        string
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
	ClaimsPath        string
	DisplayClaimsPath string
	MaxClaims         int
	RepoRoot          string
	AllowStaleClaims  bool
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
	relatedStatePaths   []claimRelatedStatePath
	linkedMarkdownDepth int
	statePath           string
	statePathSource     string
	adapterPath         string
	adapterFound        bool
	explicitSources     bool
}

type claimRelatedStatePath struct {
	role string
	path string
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

const claimDiscoveryRulesetVersion = "claim-discovery-rules.v4"

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
			if contentPath := claimSourceContentPath(repoRoot, source.absPath, source.relPath); contentPath != "" {
				entry["contentPath"] = contentPath
			}
		}
		inventory = append(inventory, entry)
	}
	mergedCandidates := mergeIdenticalClaimCandidates(candidates)
	renderedCandidates := renderClaimCandidates(mergedCandidates)
	carryForward := map[string]any{}
	var previousPacket map[string]any
	if strings.TrimSpace(options.PreviousPath) != "" {
		previous, err := readClaimPacketFile(resolvedRoot, options.PreviousPath)
		if err != nil {
			return nil, err
		}
		previousPacket = previous
		carryForward = applyPreviousClaimState(resolvedRoot, renderedCandidates, previous)
	}

	packet := map[string]any{
		"schemaVersion":      contracts.ClaimProofPlanSchema,
		"discoveryMode":      "deterministic-source-inventory",
		"discoveryEngine":    renderClaimDiscoveryEngine(resolvedRoot),
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
	}
	if len(carryForward) > 0 {
		packet["carryForward"] = carryForward
		if reviewRuns := normalizeClaimReviewRuns(arrayOrEmpty(previousPacket["reviewRuns"])); len(reviewRuns) > 0 {
			packet["reviewRuns"] = reviewRuns
		}
		if reviewApplication := asMap(previousPacket["reviewApplication"]); len(reviewApplication) > 0 {
			packet["reviewApplication"] = reviewApplication
		}
	}
	return packet, nil
}

func renderClaimDiscoveryEngine(repoRoot string) map[string]any {
	engine := map[string]any{
		"name":    "cautilus.claim_discovery",
		"ruleset": claimDiscoveryRulesetVersion,
	}
	sourcePath := filepath.Join(repoRoot, "internal", "runtime", "claim_discovery.go")
	if hash, err := fileSHA256(sourcePath); err == nil {
		engine["implementationPath"] = filepath.ToSlash(filepath.Join("internal", "runtime", "claim_discovery.go"))
		engine["implementationHash"] = hash
	}
	return engine
}

func readClaimPacketFile(repoRoot string, path string) (map[string]any, error) {
	content, err := os.ReadFile(resolvePath(repoRoot, path))
	if err != nil {
		return nil, err
	}
	var packet map[string]any
	if err := json.Unmarshal(content, &packet); err != nil {
		return nil, err
	}
	return packet, nil
}

func applyPreviousClaimState(repoRoot string, candidates []any, previous map[string]any) map[string]any {
	previousByFingerprint := map[string]map[string]any{}
	for _, raw := range arrayOrEmpty(previous["claimCandidates"]) {
		entry := asMap(raw)
		fingerprint := stringFromAny(entry["claimFingerprint"])
		if fingerprint != "" {
			previousByFingerprint[fingerprint] = entry
		}
	}
	matched := 0
	idRewritten := 0
	staleEvidenceClaims := 0
	changedEvidenceRefs := 0
	missingEvidenceRefs := 0
	unsupportedEvidenceRefs := 0
	for _, raw := range candidates {
		candidate := asMap(raw)
		fingerprint := stringFromAny(candidate["claimFingerprint"])
		previousCandidate := previousByFingerprint[fingerprint]
		if previousCandidate == nil {
			continue
		}
		matched++
		previousClaimID := stringFromAny(previousCandidate["claimId"])
		currentClaimID := stringFromAny(candidate["claimId"])
		for _, key := range []string{"reviewStatus", "evidenceStatus", "lifecycle", "evidenceStatusReason"} {
			if value, exists := previousCandidate[key]; exists {
				candidate[key] = value
			}
		}
		if previousCandidate["reviewStatus"] != "heuristic" {
			if value, exists := previousCandidate["nextAction"]; exists {
				candidate["nextAction"] = value
			}
		}
		for _, key := range []string{"evidenceRefs", "reviewRefs", "unresolvedQuestions"} {
			if value := arrayOrEmpty(previousCandidate[key]); len(value) > 0 {
				cloned, err := cloneJSON(value)
				if err != nil {
					continue
				}
				candidate[key] = cloned
			}
		}
		if previousClaimID != "" && currentClaimID != "" && previousClaimID != currentClaimID {
			if rewriteEvidenceRefClaimIDs(candidate, previousClaimID, currentClaimID) {
				idRewritten++
			}
		}
		reconciliation := reconcileCarriedEvidenceRefs(repoRoot, candidate)
		if reconciliation.staleClaim {
			staleEvidenceClaims++
			changedEvidenceRefs += reconciliation.changedRefs
			missingEvidenceRefs += reconciliation.missingRefs
			unsupportedEvidenceRefs += reconciliation.unsupportedRefs
		}
	}
	return map[string]any{
		"strategy":                      "claimFingerprint",
		"matchedClaimCount":             matched,
		"evidenceSupportIdRewriteCount": idRewritten,
		"staleEvidenceClaimCount":       staleEvidenceClaims,
		"changedEvidenceRefCount":       changedEvidenceRefs,
		"missingEvidenceRefCount":       missingEvidenceRefs,
		"unsupportedEvidenceRefCount":   unsupportedEvidenceRefs,
		"notice":                        "Reviewed labels and evidence refs were carried forward only for unchanged claim fingerprints; direct and verified evidence refs with contentHash were rechecked against repo-local evidence files.",
	}
}

type evidenceReconciliationResult struct {
	staleClaim      bool
	changedRefs     int
	missingRefs     int
	unsupportedRefs int
	reasons         []string
}

func reconcileCarriedEvidenceRefs(repoRoot string, candidate map[string]any) evidenceReconciliationResult {
	result := evidenceReconciliationResult{}
	claimID := stringFromAny(candidate["claimId"])
	for _, rawRef := range arrayOrEmpty(candidate["evidenceRefs"]) {
		ref := asMap(rawRef)
		matchKind := stringFromAny(ref["matchKind"])
		if matchKind != "direct" && matchKind != "verified" {
			continue
		}
		path := strings.TrimSpace(stringFromAny(ref["path"]))
		contentHash := strings.TrimSpace(stringFromAny(ref["contentHash"]))
		if path == "" || contentHash == "" {
			continue
		}
		evidencePath, ok := repoRelativeEvidencePath(repoRoot, path)
		if !ok {
			result.unsupportedRefs++
			result.reasons = append(result.reasons, fmt.Sprintf("evidence ref path %s is outside the repo root", path))
			continue
		}
		currentHash, err := fileSHA256(evidencePath)
		if err != nil {
			result.missingRefs++
			result.reasons = append(result.reasons, fmt.Sprintf("evidence ref %s could not be read", path))
			continue
		}
		if currentHash != contentHash {
			result.changedRefs++
			result.reasons = append(result.reasons, fmt.Sprintf("evidence ref %s contentHash changed", path))
			continue
		}
		if reason := evidenceBundleClaimMismatch(evidencePath, claimID); reason != "" {
			result.unsupportedRefs++
			result.reasons = append(result.reasons, reason)
		}
	}
	if len(result.reasons) == 0 {
		return result
	}
	result.staleClaim = true
	if stringFromAny(candidate["evidenceStatus"]) == "satisfied" {
		candidate["evidenceStatus"] = "stale"
		candidate["evidenceStatusReason"] = "Carried evidence requires re-review: " + strings.Join(result.reasons, "; ") + "."
		candidate["nextAction"] = "Refresh or re-review the stale evidence refs before treating this claim as satisfied."
	}
	return result
}

func repoRelativeEvidencePath(repoRoot string, value string) (string, bool) {
	if filepath.IsAbs(value) {
		rel, err := filepath.Rel(repoRoot, filepath.Clean(value))
		if err != nil || rel == "." || strings.HasPrefix(rel, ".."+string(filepath.Separator)) || rel == ".." {
			return "", false
		}
		return filepath.Clean(value), true
	}
	cleaned := filepath.Clean(value)
	if cleaned == "." || strings.HasPrefix(cleaned, ".."+string(filepath.Separator)) || cleaned == ".." {
		return "", false
	}
	return filepath.Join(repoRoot, cleaned), true
}

func evidenceBundleClaimMismatch(path string, claimID string) string {
	if claimID == "" || !strings.HasSuffix(strings.ToLower(path), ".json") {
		return ""
	}
	content, err := os.ReadFile(path)
	if err != nil {
		return ""
	}
	var packet map[string]any
	if err := json.Unmarshal(content, &packet); err != nil {
		return ""
	}
	if stringFromAny(packet["schemaVersion"]) != contracts.ClaimEvidenceBundleSchema {
		return ""
	}
	createdFor := stringArrayOrEmpty(packet["createdForClaimIds"])
	if len(createdFor) == 0 || containsString(createdFor, claimID) {
		return ""
	}
	return fmt.Sprintf("evidence bundle %s does not list current claimId %s in createdForClaimIds", relativeClaimPath(filepath.Dir(path), path), claimID)
}

func rewriteEvidenceRefClaimIDs(candidate map[string]any, previousClaimID string, currentClaimID string) bool {
	rewritten := false
	for _, rawRef := range arrayOrEmpty(candidate["evidenceRefs"]) {
		ref := asMap(rawRef)
		supports := arrayOrEmpty(ref["supportsClaimIds"])
		if len(supports) == 0 {
			continue
		}
		nextSupports := make([]any, 0, len(supports))
		for _, rawID := range supports {
			claimID := stringFromAny(rawID)
			if claimID == previousClaimID {
				nextSupports = append(nextSupports, currentClaimID)
				rewritten = true
				continue
			}
			nextSupports = append(nextSupports, rawID)
		}
		ref["supportsClaimIds"] = nextSupports
	}
	return rewritten
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
		relatedStatePaths, err := resolveClaimRelatedStatePaths(claimConfig["related_state_paths"])
		if err != nil {
			return config, err
		}
		config.relatedStatePaths = relatedStatePaths
	}
	return config, nil
}

func resolveClaimRelatedStatePaths(value any) ([]claimRelatedStatePath, error) {
	result := []claimRelatedStatePath{}
	for index, raw := range arrayOrEmpty(value) {
		record := asMap(raw)
		role := strings.TrimSpace(stringFromAny(record["role"]))
		path := strings.TrimSpace(stringFromAny(record["path"]))
		if role == "" || path == "" {
			return nil, fmt.Errorf("claim_discovery.related_state_paths[%d] must include non-empty role and path", index)
		}
		normalizedPath, err := normalizeClaimStatePath(path)
		if err != nil {
			return nil, fmt.Errorf("claim_discovery.related_state_paths[%d].path: %w", index, err)
		}
		result = append(result, claimRelatedStatePath{
			role: role,
			path: normalizedPath,
		})
	}
	return result, nil
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
	ignoreChecker := newGitIgnoreChecker(repoRoot)
	addSource := func(relPath string, depth int, from string) {
		relPath = filepath.ToSlash(filepath.Clean(strings.TrimSpace(relPath)))
		if relPath == "." || relPath == "" || claimPathExcluded(relPath, config.exclude) || ignoreChecker.Ignored(relPath) {
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
		if err := walkIncludedClaimSources(repoRoot, config, ignoreChecker, addSource); err != nil {
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
			if ignoreChecker.Ignored(target) {
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

type gitIgnoreChecker struct {
	repoRoot string
	enabled  bool
	cache    map[string]bool
}

func newGitIgnoreChecker(repoRoot string) *gitIgnoreChecker {
	checker := &gitIgnoreChecker{
		repoRoot: repoRoot,
		cache:    map[string]bool{},
	}
	command := exec.Command("git", "-C", repoRoot, "rev-parse", "--is-inside-work-tree")
	if err := command.Run(); err == nil {
		checker.enabled = true
	}
	return checker
}

func (checker *gitIgnoreChecker) Ignored(relPath string) bool {
	if checker == nil || !checker.enabled {
		return false
	}
	relPath = filepath.ToSlash(filepath.Clean(strings.TrimSpace(relPath)))
	if relPath == "" || relPath == "." {
		return false
	}
	if ignored, exists := checker.cache[relPath]; exists {
		return ignored
	}
	command := exec.Command("git", "-C", checker.repoRoot, "check-ignore", "--no-index", "-q", "--", relPath)
	err := command.Run()
	ignored := err == nil
	checker.cache[relPath] = ignored
	return ignored
}

func walkIncludedClaimSources(repoRoot string, config claimDiscoveryConfig, ignoreChecker *gitIgnoreChecker, addPath func(string, int, string)) error {
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
			if relPath != "." && ignoreChecker.Ignored(relPath+"/") {
				return filepath.SkipDir
			}
			return nil
		}
		if !isMarkdownClaimSource(relPath) || !claimPathIncluded(relPath, config.include) || ignoreChecker.Ignored(relPath) {
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
	}
	if claimPathLooksUserFacing(lower) {
		return "user", "path-default"
	}
	if claimPathLooksDeveloperFacing(lower) {
		return "developer", "path-default"
	}
	return "unclear", "unknown"
}

func claimPathLooksUserFacing(lower string) bool {
	return strings.HasPrefix(lower, "docs/specs/user/") ||
		strings.HasPrefix(lower, "docs/user/") ||
		strings.HasPrefix(lower, "docs/users/") ||
		strings.HasPrefix(lower, "docs/guides/") ||
		strings.HasPrefix(lower, "docs/claims/user") ||
		strings.Contains(lower, "/user-facing")
}

func claimPathLooksDeveloperFacing(lower string) bool {
	return strings.HasPrefix(lower, "docs/") ||
		strings.HasPrefix(lower, "specs/") ||
		strings.HasPrefix(lower, "skills/") ||
		strings.HasPrefix(lower, "plugins/") ||
		strings.HasPrefix(lower, ".agents/")
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
			claimSemanticGroup:     claimSemanticGroup(summary, classification.recommendedEvalSurface, groupHints, config),
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
	inFrontmatter := false
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
		if index == 0 && trimmed == "---" {
			inFrontmatter = true
			continue
		}
		if inFrontmatter {
			if trimmed == "---" {
				inFrontmatter = false
			}
			continue
		}
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
	if claimLineLooksLikePromptExample(normalized) {
		return false
	}
	if claimLineLooksLikeOpenQuestion(normalized) {
		return false
	}
	if claimLineLooksLikeDefinitionLabel(normalized) {
		return false
	}
	if claimLineLooksLikeFutureProofPlaceholder(normalized) {
		return false
	}
	if len(normalized) < 20 || len(normalized) > 260 {
		return false
	}
	lower := strings.ToLower(normalized)
	return containsAny(lower, []string{
		" must ", " should ", " can ", " will ", " owns ", " keeps ", " uses ", " emits ", " writes ", " runs ",
		" routes ", " discovers ", " evaluates ", " improves ", " verifies ", " validates ", " proves ", " supports ",
		" requires ", " guarantees ", " provides ", " belongs ", " remains ", " stays ", " installs ", " produces ",
	})
}

func claimLineLooksLikePromptExample(summary string) bool {
	lower := strings.ToLower(strings.TrimSpace(summary))
	return strings.HasPrefix(lower, "input (for agent)") ||
		strings.HasPrefix(lower, "for agent:") ||
		strings.HasPrefix(lower, "for agent ") ||
		strings.Contains(lower, "input (for agent)**") ||
		strings.Contains(lower, "input (for agent):")
}

func claimLineLooksLikeDefinitionLabel(summary string) bool {
	trimmed := strings.TrimSpace(summary)
	trimmed = strings.TrimPrefix(trimmed, "- ")
	trimmed = strings.TrimPrefix(trimmed, "* ")
	return regexp.MustCompile("^`[^`]+`:\\s+").MatchString(trimmed)
}

func claimLineLooksLikeFutureProofPlaceholder(summary string) bool {
	lower := strings.ToLower(strings.TrimSpace(summary))
	lower = strings.TrimPrefix(lower, "- ")
	lower = strings.TrimPrefix(lower, "* ")
	lower = strings.TrimSpace(lower)
	return strings.HasPrefix(lower, "evidence is pending") ||
		strings.HasPrefix(lower, "future proof should ") ||
		strings.HasPrefix(lower, "deeper proof should ") ||
		strings.HasPrefix(lower, "per-claim evidence pages should later ") ||
		strings.HasPrefix(lower, "this page should later ")
}

func claimLineLooksLikeOpenQuestion(summary string) bool {
	trimmed := strings.TrimSpace(summary)
	trimmed = strings.TrimPrefix(trimmed, ">")
	trimmed = strings.TrimSpace(trimmed)
	if !strings.HasSuffix(trimmed, "?") {
		return false
	}
	lower := strings.ToLower(trimmed)
	return containsAnyPrefix(lower, []string{
		"should ",
		"is ",
		"are ",
		"do ",
		"does ",
		"did ",
		"can ",
		"could ",
		"would ",
		"will ",
		"what ",
		"when ",
		"where ",
		"why ",
		"how ",
		"which ",
	})
}

func classifyClaimLine(line string) (claimClassification, bool) {
	lower := " " + strings.ToLower(line) + " "
	switch {
	case providerCaveatClaim(lower):
		return claimClassification{
			recommendedProof:      "human-auditable",
			verificationReadiness: "blocked",
			why:                   "The claim records provider or host-runtime caveat context; it can guide future protection but is not itself a ready product proof target.",
			next:                  "Keep this as human-auditable context or promote a concrete regression scenario if the caveat should block releases.",
		}, true
	case deterministicReadinessOrPreflightContract(lower):
		return claimClassification{
			recommendedProof:      "deterministic",
			verificationReadiness: "ready-to-verify",
			why:                   "The claim names readiness, preflight, or command-contract behavior that should be protected by deterministic checks.",
			next:                  "Keep or add deterministic readiness, preflight, or command-contract proof for this claim.",
		}, true
	case providerFailoverBehaviorClaim(lower):
		return claimClassification{
			recommendedProof:       "cautilus-eval",
			verificationReadiness:  "ready-to-verify",
			recommendedEvalSurface: "app/prompt",
			why:                    "The claim describes provider failover behavior, which needs behavior evidence rather than being treated as a caveat.",
			next:                   "Create a host-owned app/prompt or equivalent provider-behavior fixture and run it through cautilus eval test.",
		}, true
	case historicalObservationClaim(lower):
		return claimClassification{
			recommendedProof:      "human-auditable",
			verificationReadiness: "blocked",
			why:                   "The claim records a historical observation; it can guide future scenarios but is not itself a ready eval target.",
			next:                  "Keep this as human-auditable context or promote a concrete regression scenario if the failure mode needs protection.",
		}, true
	case designRationaleClaim(lower):
		return claimClassification{
			recommendedProof:      "human-auditable",
			verificationReadiness: "needs-alignment",
			why:                   "The claim explains a design rationale; proof needs aligned examples or narrower subclaims rather than a single deterministic assertion.",
			next:                  "Keep this as rationale, or decompose it into concrete adapter, docs, and test surfaces before attaching proof.",
		}, true
	case containsAny(lower, []string{" unit test", " tests ", " tests.", " test:on-demand", " executable test", " executable check", " lint", " typecheck", " type-check", " build ", " ci ", " compile", " schema ", " deterministic", " eval test ", " eval live ", " --runtime fixture", " fixture runtime", " fixture-backed", " adapter-owned runner", " command template", " command_template", " run-simulator-persona", " --version", " on path ", " doctor --", " --adapter-name", " go-owned", " cli instead of", "cautilus.agent_status.v1"}):
		return claimClassification{
			recommendedProof:      "deterministic",
			verificationReadiness: "ready-to-verify",
			why:                   "The claim names a deterministic gate or static contract that should be protected outside Cautilus eval.",
			next:                  "Keep or add a repo-owned unit, lint, build, schema, or CI check for this claim.",
		}, true
	case deterministicCLIGatingClaim(lower):
		return claimClassification{
			recommendedProof:      "deterministic",
			verificationReadiness: "ready-to-verify",
			why:                   "The claim names command availability or gating behavior that should be protected by deterministic CLI tests.",
			next:                  "Keep or add deterministic command-contract proof showing the command remains available under the named setup condition.",
		}, true
	case operatorPolicyClaim(lower):
		return claimClassification{
			recommendedProof:      "human-auditable",
			verificationReadiness: "blocked",
			why:                   "The claim is an operator-policy rule; a single eval fixture cannot prove every future agent will follow it.",
			next:                  "Keep this as an operating rule or narrow it into an audited process claim with concrete incident evidence.",
		}, true
	case ownershipBoundaryClaim(lower):
		return claimClassification{
			recommendedProof:      "human-auditable",
			verificationReadiness: "needs-alignment",
			why:                   "The claim describes an ownership or adapter boundary that should be checked across docs, code, and adapter contracts before behavior proof.",
			next:                  "Reconcile or cite the matching adapter, CLI, docs, and test surfaces before treating this as satisfied.",
		}, true
	case containsAny(lower, []string{" align", " aligned", " alignment", " drift", " reconcile", " mismatch", " consistent with", " consistency"}):
		return claimClassification{
			recommendedProof:      "human-auditable",
			verificationReadiness: "needs-alignment",
			why:                   "The claim says surfaces should agree, so proof is not honest until the mismatched surfaces are reconciled.",
			next:                  "Reconcile the named docs, code, skill, adapter, or CLI surface before treating this as a verification target.",
		}, true
	case containsAny(lower, []string{" static html", " html ", " render-html", " renderer", " browser-readable", " exampleinputcli", " catalog entry", " command catalog"}):
		return claimClassification{
			recommendedProof:      "deterministic",
			verificationReadiness: "ready-to-verify",
			why:                   "The claim names packet, catalog, or renderer behavior that should be protected by deterministic command, schema, or render tests.",
			next:                  "Keep or add deterministic packet, catalog, schema, or renderer proof for this claim.",
		}, true
	case containsAny(lower, []string{" durable packet", " durable packets", " machine-readable ", " eval-cases.json", " eval-observed.json", " eval-summary.json"}):
		return claimClassification{
			recommendedProof:      "deterministic",
			verificationReadiness: "ready-to-verify",
			why:                   "The claim names packet shape, durability, or machine-readable output that should be protected by deterministic schema or golden-output checks.",
			next:                  "Keep or add deterministic packet schema, command-output, or golden-file proof for this claim.",
		}, true
	case deterministicCommandPacketClaim(lower):
		return claimClassification{
			recommendedProof:      "deterministic",
			verificationReadiness: "ready-to-verify",
			why:                   "The claim names CLI, packet, payload, schema, readiness, or non-launching evaluation behavior that should be protected by deterministic command and packet tests.",
			next:                  "Keep or add deterministic CLI, packet schema, golden-output, readiness, or no-runner-launch proof for this claim.",
		}, true
	case deterministicProvenanceOrViewClaim(lower):
		return claimClassification{
			recommendedProof:      "deterministic",
			verificationReadiness: "ready-to-verify",
			why:                   "The claim names provenance, ranked-output, or view projection behavior that should be protected by deterministic packet or renderer checks.",
			next:                  "Keep or add deterministic packet, provenance, ranked-output, or renderer proof for this claim.",
		}, true
	case futureOrMixedWorkflowBoundaryClaim(lower):
		return claimClassification{
			recommendedProof:      "human-auditable",
			verificationReadiness: "needs-alignment",
			why:                   "The claim is future-looking or mixes workflow ownership with packet obligations, so eval planning would overclaim before the current boundary is aligned.",
			next:                  "Reword or split this into current deterministic packet/CLI contracts and separate behavior claims before verification.",
		}, true
	case containsAny(lower, []string{" in-editor agent ", " drive the same contracts conversationally", " conversationally "}) && containsAny(lower, []string{" agent", " skill", " codex", " claude"}):
		return claimClassification{
			recommendedProof:       "cautilus-eval",
			verificationReadiness:  "ready-to-verify",
			recommendedEvalSurface: "dev/skill",
			why:                    "The claim says an agent or skill can drive the workflow conversationally, which needs skill-behavior evidence rather than only install proof.",
			next:                   "Create or use a dev/skill fixture that proves the installed skill can drive the named workflow.",
		}, true
	case claimDocumentsCompoundScenarioNextStep(lower):
		return claimClassification{
			recommendedProof:      "human-auditable",
			verificationReadiness: "blocked",
			why:                   "The claim combines a human promotion decision with several agent follow-up paths; deterministic packet tests can prove subclaims but would overclaim the whole next-step workflow.",
			next:                  "Split into concrete claims for saved proposal JSON, human review HTML, and each named downstream follow-up path before attaching proof.",
		}, true
	case containsAny(lower, []string{" install", " installs ", " installer", " standalone binary", " checked into each host repo", " bundled skill", " plugin manifest", " plugin manifests", ".agents/skills", ".agents/cautilus-adapter"}):
		return claimClassification{
			recommendedProof:      "deterministic",
			verificationReadiness: "ready-to-verify",
			why:                   "The claim names install, packaging, or repo-materialization behavior that should be protected by deterministic smoke or readiness checks.",
			next:                  "Keep or add deterministic install, adapter, bundled-skill, or doctor readiness proof for this claim.",
		}, true
	case claimNeedsScenario(lower):
		surface := ""
		if containsAny(lower, []string{" conversation", " chat", " context recovery", " context-recovery", " turn", " turns", " follow-up"}) {
			surface = "app/chat"
		}
		return claimClassification{
			recommendedProof:       "cautilus-eval",
			verificationReadiness:  "needs-scenario",
			recommendedEvalSurface: surface,
			why:                    "The claim points at behavior that needs scenario shaping before it is ready as a protected eval fixture.",
			next:                   "Use the scenario proposal flow to normalize candidate evidence before creating a checked-in eval fixture.",
		}, true
	case broadEvalSurfaceClaim(lower):
		return claimClassification{
			recommendedProof:      "cautilus-eval",
			verificationReadiness: "needs-scenario",
			why:                   "The claim names a broad behavior surface or reusable workflow; it needs a concrete scenario before an eval fixture can honestly prove it.",
			next:                  "Decompose this broad behavior promise into one or more concrete scenario candidates before planning a protected eval.",
		}, true
	case claimDocumentsScenarioCommand(lower):
		return claimClassification{
			recommendedProof:      "deterministic",
			verificationReadiness: "ready-to-verify",
			why:                   "The claim documents scenario command or proposal-packet behavior rather than asking for a new behavior scenario.",
			next:                  "Keep or add deterministic scenario command, packet, or render proof for this claim.",
		}, true
	case strings.HasPrefix(strings.TrimSpace(lower), "use when ") && containsAny(lower, []string{" stateful automation ", " keeps stalling ", " persists state "}):
		return claimClassification{
			recommendedProof:      "human-auditable",
			verificationReadiness: "blocked",
			why:                   "The claim is broad usage guidance until a concrete stalled-workflow scenario or evidence packet is promoted.",
			next:                  "Keep this as human-auditable positioning or promote a concrete stalled-workflow example before creating a protected eval fixture.",
		}, true
	case broadPositioningClaim(lower):
		return claimClassification{
			recommendedProof:      "human-auditable",
			verificationReadiness: "blocked",
			why:                   "The claim is a broad positioning or aggregate product promise; a single eval fixture would overclaim until concrete subclaims are named.",
			next:                  "Keep this as human-auditable positioning or decompose it into concrete deterministic or Cautilus eval claims before proof planning.",
		}, true
	case containsAny(lower, []string{" agent", " prompt", " skill", " workflow", " llm", " model", " conversation", " assistant", " behavior", " eval "}):
		surface := recommendedEvalSurface(lower)
		return claimClassification{
			recommendedProof:       "cautilus-eval",
			verificationReadiness:  "ready-to-verify",
			recommendedEvalSurface: surface,
			why:                    "The claim depends on model, agent, prompt, skill, workflow, or behavior execution evidence.",
			next:                   fmt.Sprintf("Create a host-owned %s fixture and run it through cautilus eval test.", surface),
		}, true
	case containsAny(lower, []string{" human", " auditable", " read ", " docs", " document", " visible", " inspect"}):
		return claimClassification{
			recommendedProof:      "human-auditable",
			verificationReadiness: "ready-to-verify",
			why:                   "The claim can be checked by reading current source, docs, or generated artifacts.",
			next:                  "Attach at least one supporting evidence item, or split/defer the claim if no concrete evidence would make the human judgment honest.",
		}, true
	default:
		return claimClassification{}, false
	}
}

func operatorPolicyClaim(lower string) bool {
	if containsAny(lower, []string{" before closing ", " before changing ", " before reviewing ", " before claiming ", " before stopping ", " before mutating ", " always call ", " always commit ", " do not leave ", " do not wait ", " route through quality", " route evaluator-backed validation", " commit targets by default"}) &&
		containsAny(lower, []string{" read ", " route ", " skill", " artifacts", " commit", " validation", " quality", " handoff", " premortem", " user explicitly says"}) {
		return true
	}
	return containsAny(lower, []string{" while implementing", " during implementation", " operating rule", " working rule", " before further fixes"}) &&
		containsAny(lower, []string{" bug", " error", " regression", " unexpected behavior", " incident"}) &&
		containsAny(lower, []string{" routes ", " route ", " through debug", " debug"})
}

func ownershipBoundaryClaim(lower string) bool {
	if containsAny(lower, []string{" belongs in adapters", " belongs in adapter", " belongs in installed skill metadata", " belongs in skill metadata", " host-specific behavior belongs"}) {
		return true
	}
	return containsAny(lower, []string{" product-owned", " adapter-owned", " host-owned", " repo-owned", " consumer-owned", " backend selection", " boundary", " skill owns", " binary owns", " cautilus owns", " host still owns", " seam owns"}) &&
		containsAny(lower, []string{" while ", " stays ", " keeps ", " owns ", " owned"})
}

func providerCaveatClaim(lower string) bool {
	if containsAny(lower, []string{" fail closed", " fails closed", " fail open", " fails open", " fail over", " failover", " fallback", " recover", " recovers", " preflight", " readiness probe", " readiness probes", " setup-readiness probe", " setup-readiness probes"}) {
		return false
	}
	if containsAny(lower, []string{" can still fail around ", " can still fail during ", " can still fail when ", " may still fail around ", " may still fail during ", " may still fail when ", " failures around "}) &&
		containsAny(lower, []string{" setup", " runtime", " provider", " xcode", " signing", " device trust", " runner launch", " credential", " credentials", " liveness", " real device", " real devices"}) {
		return true
	}
	return containsAny(lower, []string{" claude -p ", "`claude -p`", " codex exec ", "`codex exec`", " provider "}) &&
		containsAny(lower, []string{" can wrap ", " fatal ", " stderr ", " structured_output", " exit still looks successful"})
}

func deterministicCLIGatingClaim(lower string) bool {
	normalized := strings.ReplaceAll(lower, "*", "")
	normalized = strings.ReplaceAll(normalized, "_", "")
	if containsAny(normalized, []string{" not gated", " not blocked", " is not gated", " are not gated", " is not blocked", " are not blocked"}) &&
		containsAny(normalized, []string{" cli ", " command", " subcommand", " provider", " credential", " credentials", " configure", " configuration", " `"}) {
		return true
	}
	return containsAny(normalized, []string{" work without credentials", " works without credentials", " must not require credentials", " does not require credentials", " do not require credentials", " can run without credentials", " can run without login", " must not require login", " does not require login", " do not require login"}) &&
		containsAny(normalized, []string{" cli ", " command", " subcommand", " provider", " login", " configure", " configuration", " setup", " first-run"})
}

func deterministicReadinessOrPreflightContract(lower string) bool {
	return containsAny(lower, []string{" fail closed", " fails closed", " fail open", " fails open", " preflight", " readiness probe", " readiness probes", " setup-readiness probe", " setup-readiness probes", " recovery command", " command recovers"}) &&
		containsAny(lower, []string{" readiness", " setup", " runtime", " command", " preflight", " probe", " probes", " provider", " credential", " credentials"})
}

func providerFailoverBehaviorClaim(lower string) bool {
	return containsAny(lower, []string{" fail over", " failover", " fallback provider", " backup provider"}) &&
		containsAny(lower, []string{" provider", " runner", " model", " credentials", " runtime"})
}

func historicalObservationClaim(lower string) bool {
	return containsAny(lower, []string{" past sessions showed", " recent sessions showed", " earlier sessions showed", " previous sessions showed", " past runs showed", " recent runs showed", " earlier runs showed", " previous runs showed"})
}

func designRationaleClaim(lower string) bool {
	trimmed := strings.TrimSpace(lower)
	return strings.HasPrefix(trimmed, "this keeps ") &&
		strings.Contains(trimmed, " from ") &&
		containsAny(trimmed, []string{" collapsing ", " drifting ", " becoming ", " turning into ", " depending on "})
}

func broadPositioningClaim(lower string) bool {
	if containsAny(lower, []string{" long-term direction", " product direction", " direction is "}) {
		return true
	}
	if containsAny(lower, []string{" built from the patterns", " reflects the core philosophy", " core philosophy", " product-development loop"}) {
		return true
	}
	if containsAny(lower, []string{" prompt", " prompts"}) &&
		containsAny(lower, []string{" can change", " may change", " keep changing"}) &&
		containsAny(lower, []string{" evaluated behavior", " behavior gets better", " behavior improves", " intent-first"}) {
		return true
	}
	return containsAny(lower, []string{" keeps ", " remains ", " stays "}) &&
		containsAny(lower, []string{" honest", " reliable", " trustworthy", " correct", " safe "}) &&
		containsAny(lower, []string{" while ", " as "}) &&
		containsAny(lower, []string{" prompt", " agent", " workflow", " behavior", " model"})
}

func deterministicCommandPacketClaim(lower string) bool {
	if strings.Contains(lower, "claim review prepare-input") &&
		containsAny(lower, []string{" emit", " emits", " emitted", " records", " bounded clusters", " skipped clusters", " skipped claims", " does not call an llm", " no llm", " merge review results"}) {
		return true
	}
	if modelProducedStructuredOutputClaim(lower) {
		return false
	}
	if containsAny(lower, []string{" claim plan-evals", " doctor", " agent status", " ready payload", " first_bounded_run", " specdown_available", " specdown "}) &&
		containsAny(lower, []string{" emit", " emits", " emitted", " output", " outputs", " includes", " payload", " packet", " schema", " evaluates", " without launching", " readiness"}) {
		return true
	}
	if strings.Contains(lower, " eval evaluate") &&
		containsAny(lower, []string{" already-observed", " observed packet", " without launching", " no runner launch", " not launch", " does not launch"}) {
		return true
	}
	if strings.Contains(lower, " specdown") &&
		containsAny(lower, []string{" raw cautilus packets", " fully set up", " claim-document workflow", " ready", " readiness"}) {
		return true
	}
	if containsAny(lower, []string{" packet", " packets", " payload", " schema", " json", " non-writer", " not a writer", " without launching", " no runner launch"}) &&
		containsAny(lower, []string{" command ", " cli ", " cautilus ", " cautilus.", " emit", " emits", " emitted", " evaluate", " evaluates", " preserves", " includes", " writes", " output", " outputs"}) &&
		containsAny(lower, []string{" cautilus.", " command ", " cli ", " --", " non-writer", " not a writer", " without launching", " no runner launch", " golden", " checked-in wrapper"}) {
		return true
	}
	if strings.Contains(lower, " fixture provides ") &&
		containsAny(lower, []string{" audit packet", " audit packets", " fixture results", " fixture-runtime", " fixture runtime"}) &&
		!containsAny(lower, []string{" agent episode", " prompt", " chat", " skill behavior", " execution quality"}) {
		return true
	}
	if strings.Contains(lower, " fixture results") &&
		containsAny(lower, []string{" audit packet", " audit packets"}) &&
		!containsAny(lower, []string{" agent episode", " prompt", " chat", " skill behavior", " execution quality"}) {
		return true
	}
	if containsAny(lower, []string{" leaves evidence", " reopenable ", " reopen "}) &&
		containsAny(lower, []string{" packet", " artifact", " artifacts", " terminal scrollback", " memory"}) {
		return true
	}
	return false
}

func deterministicProvenanceOrViewClaim(lower string) bool {
	if containsAny(lower, []string{" skill behavior", " agent episode", " model behavior", " prompt behavior"}) {
		return false
	}
	if containsAny(lower, []string{" evidence should preserve", " preserve where the suggestion came from", " source provenance", " provenance "}) &&
		containsAny(lower, []string{" without forcing", " host repo", " storage model", " packet", " schema", " fixture example", " evidence "}) {
		return true
	}
	if containsAny(lower, []string{" full ranked result", " full ranked proposal list", " ranked proposal list", " full ranked list"}) &&
		containsAny(lower, []string{" agent", " machine-readable", " human-facing view", " view", " output", " result"}) {
		return true
	}
	return false
}

func futureOrMixedWorkflowBoundaryClaim(lower string) bool {
	if containsAny(lower, []string{" future ", " future-looking "}) &&
		containsAny(lower, []string{" eval flow", " live app eval", " flow can refer", " stable id", " instance "}) {
		return true
	}
	if containsAny(lower, []string{" may provide", " helper flags"}) &&
		containsAny(lower, []string{" claim discover", " refresh-plan", " public user-level workflow", " command-surface"}) {
		return true
	}
	if containsAny(lower, []string{" should not be folded into", " responsibility unless"}) {
		return true
	}
	if containsAny(lower, []string{" prefer recall", " preserve the scan boundary", " leave curation"}) &&
		containsAny(lower, []string{" packet-aware agent", " maintainer review", " curation"}) {
		return true
	}
	if containsAny(lower, []string{" already delegated autonomous continuation", " budget still must be written to the packet", " budget still must be written"}) {
		return true
	}
	return false
}

func modelProducedStructuredOutputClaim(lower string) bool {
	if containsAny(lower, []string{" not a writer", " non-writer", " host-owned eval fixtures"}) {
		return false
	}
	return containsAny(lower, []string{" assistant", " model", " llm", " prompt", " chat", " tool-call", " tool call", " agent response", " generated response"}) &&
		containsAny(lower, []string{" json", " schema", " structured output", " structured-output", " outputs", " emits", " returns", " tool-call"})
}

func broadEvalSurfaceClaim(lower string) bool {
	if containsAny(lower, []string{" supports ", " can evaluate ", " evaluates behavior ", " same product workflow can be reused", " workflow can be reused"}) &&
		containsAny(lower, []string{" such as ", " across repos", " dev/", " app/", " behavior", " agent workflows", " repo contracts", " prompt", " chat", " service-response"}) {
		return true
	}
	return containsAny(lower, []string{" supports development-facing behavior", " supports app-facing behavior"})
}

func claimNeedsScenario(lower string) bool {
	if !containsAny(lower, []string{" scenario", " proposal", " candidate", " coverage", " protected check", " protected scenario"}) {
		return false
	}
	if claimDocumentsScenarioCommand(lower) {
		return false
	}
	return containsAny(lower, []string{" needs ", " need ", " future ", " missing ", " create ", " author ", " promote ", " protect ", " protected ", " context recovery", " follow-up"})
}

func claimDocumentsCompoundScenarioNextStep(lower string) bool {
	return strings.Contains(lower, " human decides ") &&
		strings.Contains(lower, " promote ") &&
		strings.Contains(lower, " protected evaluation ") &&
		strings.Contains(lower, " agent can ") &&
		containsAny(lower, []string{" reopen the saved result", " compare variants", " next bounded step"})
}

func claimDocumentsScenarioCommand(lower string) bool {
	return containsAny(lower, []string{" cautilus scenario", " scenario normalize", " scenario propose", " proposal packet", " proposal candidates", " proposals.json", " render-proposals-html", " reopen the saved result"})
}

func recommendedEvalSurface(lower string) string {
	switch {
	case strings.Contains(lower, " review prompt"):
		return "dev/repo"
	case strings.Contains(lower, " skill"):
		return "dev/skill"
	case strings.Contains(lower, " plugin"):
		return "dev/skill"
	case strings.Contains(lower, " agent") && strings.Contains(lower, "workflow"):
		return "dev/skill"
	case strings.Contains(lower, " agent") && containsAny(lower, []string{" episode", " turns", " audit", " first-scan", " refresh-flow", " review-prepare", " reviewer-launch", "review-to-eval"}):
		return "dev/skill"
	case strings.Contains(lower, " prompt"):
		return "app/prompt"
	case strings.Contains(lower, " conversation") || strings.Contains(lower, " chat") || strings.Contains(lower, " assistant"):
		return "app/chat"
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

func claimSemanticGroup(summary string, surface string, hints []string, config claimDiscoveryConfig) string {
	haystack := strings.ToLower(strings.Join(append([]string{summary, surface}, hints...), " "))
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
		"evidenceRoots":       nonNilStringSlice(config.evidenceRoots),
		"audienceHints":       renderClaimAudienceHints(config.audienceHints),
		"semanticGroups":      renderClaimSemanticGroups(config.semanticGroups),
		"linkedMarkdownDepth": config.linkedMarkdownDepth,
		"explicitSources":     config.explicitSources,
		"adapterFound":        config.adapterFound,
		"adapterPath":         config.adapterPath,
		"traversal":           "entry-markdown-links",
		"gitignorePolicy":     "respect-repo-gitignore",
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
		"path":              config.statePath,
		"pathSource":        config.statePathSource,
		"relatedStatePaths": renderClaimRelatedStatePaths(config.relatedStatePaths),
	}
}

func renderClaimRelatedStatePaths(paths []claimRelatedStatePath) []any {
	result := make([]any, 0, len(paths))
	for _, entry := range paths {
		result = append(result, map[string]any{
			"role": entry.role,
			"path": entry.path,
		})
	}
	return result
}

func summarizeClaimCandidates(candidates []any) map[string]any {
	byProof := map[string]int{}
	byReadiness := map[string]int{}
	byEvidence := map[string]int{}
	byReview := map[string]int{}
	byLifecycle := map[string]int{}
	byAudience := map[string]int{}
	bySemanticGroup := map[string]int{}
	for _, raw := range candidates {
		entry := asMap(raw)
		incrementStringCount(byProof, entry["recommendedProof"])
		incrementStringCount(byReadiness, entry["verificationReadiness"])
		incrementStringCount(byEvidence, entry["evidenceStatus"])
		incrementStringCount(byReview, entry["reviewStatus"])
		incrementStringCount(byLifecycle, entry["lifecycle"])
		incrementStringCount(byAudience, claimAudienceOrUnclear(stringFromAny(entry["claimAudience"])))
		incrementStringCount(bySemanticGroup, claimSemanticGroupOrGeneral(stringFromAny(entry["claimSemanticGroup"])))
	}
	return map[string]any{
		"byRecommendedProof":      sortedCountMap(byProof),
		"byVerificationReadiness": sortedCountMap(byReadiness),
		"byEvidenceStatus":        sortedCountMap(byEvidence),
		"byReviewStatus":          sortedCountMap(byReview),
		"byLifecycle":             sortedCountMap(byLifecycle),
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
		"discoveryBoundary":         claimStatusDiscoveryBoundary(scanScope),
		"claimState":                asMap(packet["claimState"]),
		"nonVerdictNotice":          packet["nonVerdictNotice"],
		"reviewReadinessSummary":    claimReviewReadinessSummary(candidates),
		"evidenceSatisfaction":      claimEvidenceSatisfactionSummary(candidates),
		"actionSummary":             claimStatusActionSummary(candidates),
		"recommendedNextActions":    claimStatusNextActions(claimSummary),
		"linkedMarkdownSourceCount": linkedMarkdownSourceCount(sourceInventory),
	}
	if strings.TrimSpace(options.RepoRoot) != "" {
		status["gitState"] = ClaimPacketGitState(packet, options.RepoRoot)
		status["gitStateSnapshotNotice"] = "gitState is computed when this status packet is generated; rerun claim show for live checkout state."
	}
	if options.SampleClaims > 0 {
		status["sampleClaims"] = claimStatusSampleClaims(candidates, options.SampleClaims)
	}
	return status, nil
}

func claimEvidenceSatisfactionSummary(candidates []any) map[string]any {
	satisfiedClaims := []any{}
	for _, raw := range candidates {
		candidate := asMap(raw)
		if stringFromAny(candidate["evidenceStatus"]) != "satisfied" {
			continue
		}
		evidenceRefs := arrayOrEmpty(candidate["evidenceRefs"])
		satisfiedClaims = append(satisfiedClaims, map[string]any{
			"claimId":                candidate["claimId"],
			"summary":                candidate["summary"],
			"recommendedProof":       candidate["recommendedProof"],
			"recommendedEvalSurface": candidate["recommendedEvalSurface"],
			"reviewStatus":           candidate["reviewStatus"],
			"evidenceRefCount":       len(evidenceRefs),
			"evidenceRefs":           evidenceRefs,
		})
	}
	return map[string]any{
		"satisfiedClaimCount": len(satisfiedClaims),
		"satisfiedClaims":     satisfiedClaims,
	}
}

func ClaimPacketGitState(packet map[string]any, repoRoot string) map[string]any {
	packetCommit := strings.TrimSpace(stringFromAny(packet["gitCommit"]))
	currentCommit := ""
	if strings.TrimSpace(repoRoot) != "" {
		currentCommit = currentGitCommit(repoRoot)
	}
	headDrift := packetCommit != "" && currentCommit != "" && packetCommit != currentCommit
	changedFiles := []string{}
	changedFilesKnown := true
	changedSources := []string{}
	isStale := false
	if headDrift {
		changedFiles, changedFilesKnown = gitChangedFilesWithStatus(repoRoot, packetCommit, currentCommit)
		changedSources = filterClaimSourceChanges(repoRoot, packet, changedFiles)
		isStale = !changedFilesKnown || len(changedSources) > 0
	}
	state := map[string]any{
		"packetGitCommit":  packetCommit,
		"currentGitCommit": currentCommit,
		"headDrift":        headDrift,
		"isStale":          isStale,
		"changedFilesBasis": map[string]any{
			"scope":             "committed-diff-between-packet-and-current-head",
			"workingTreePolicy": "excluded",
			"meaning":           "changedFiles lists files committed between packetGitCommit and currentGitCommit; it does not include unstaged, staged, or untracked working-tree files.",
		},
		"workingTreePolicy": "excluded",
		"comparisonStatus":  "unchecked",
		"recommendedAction": "Continue only after checking whether the packet commit still matches the checkout being inspected.",
	}
	switch {
	case packetCommit == "":
		state["comparisonStatus"] = "missing-packet-commit"
		state["recommendedAction"] = "Regenerate the claim packet before review or eval planning."
	case currentCommit == "":
		state["comparisonStatus"] = "missing-current-commit"
		state["recommendedAction"] = "Use explicit operator judgment before consuming this claim packet."
	case isStale:
		state["comparisonStatus"] = "stale"
		state["changedFileCount"] = len(changedFiles)
		state["changedFiles"] = changedFiles
		state["changedSourceCount"] = len(changedSources)
		state["changedSources"] = changedSources
		if !changedFilesKnown {
			state["comparisonStatus"] = "stale-unknown-diff"
			state["recommendedAction"] = "Regenerate the claim packet because Cautilus could not compare the packet commit with the current checkout."
		} else {
			state["recommendedAction"] = "Run claim discover --previous <claims.json> --refresh-plan before review, review application, or eval planning."
		}
	case headDrift:
		state["comparisonStatus"] = "fresh-with-head-drift"
		state["changedFileCount"] = len(changedFiles)
		state["changedFiles"] = changedFiles
		state["changedSourceCount"] = 0
		state["changedSources"] = []string{}
		state["recommendedAction"] = "The current HEAD differs from the packet commit, but no recorded claim source changed; review and eval planning may continue."
	default:
		state["comparisonStatus"] = "fresh"
		state["changedFileCount"] = 0
		state["changedFiles"] = []string{}
		state["changedSourceCount"] = 0
		state["changedSources"] = []string{}
		state["recommendedAction"] = "The claim packet commit matches the inspected checkout."
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
	return fmt.Errorf("%s requires a fresh claim packet: recorded claim sources changed between packet gitCommit %s and current HEAD %s; run claim discover --previous <claims.json> --refresh-plan first or pass --allow-stale-claims",
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

func claimStatusDiscoveryBoundary(scanScope map[string]any) map[string]any {
	return map[string]any{
		"sourceBasis":      "entry-docs-and-linked-markdown",
		"traversal":        scanScope["traversal"],
		"entries":          arrayOrEmpty(scanScope["entries"]),
		"linkedDepth":      scanScope["linkedMarkdownDepth"],
		"gitignorePolicy":  scanScope["gitignorePolicy"],
		"omissionPolicy":   "Claims not declared in configured entry documents or linked Markdown are outside deterministic discovery scope.",
		"productSignal":    "A core user-facing feature missing from entry docs is a narrative or adoption-surface gap, not automatically a claim discover false negative.",
		"agentEscapeHatch": "Agent-led quality or narrative review may explore the codebase for missing public claims, then record alignment or documentation work before expecting deterministic discovery.",
	}
}

type claimStatusActionBucket struct {
	id               string
	recommendedActor string
	summary          string
	count            int
	sampleClaimIDs   []string
	byReviewStatus   map[string]int
	byEvidenceStatus map[string]int
}

func claimStatusActionSummary(candidates []any) map[string]any {
	primaryDefinitions := []*claimStatusActionBucket{
		{id: "already-satisfied", recommendedActor: "none", summary: "Proof is already attached and valid under packet semantics."},
		{id: "agent-add-deterministic-proof", recommendedActor: "agent", summary: "Add or connect unit, lint, build, schema, spec, or CI proof."},
		{id: "agent-plan-cautilus-eval", recommendedActor: "agent", summary: "Draft or select Cautilus eval scenarios for ready eval claims."},
		{id: "agent-design-scenario", recommendedActor: "agent", summary: "Decompose the behavior into a concrete scenario before protected eval planning."},
		{id: "human-align-surfaces", recommendedActor: "human", summary: "Reconcile conflicting docs, code, adapters, or ownership boundaries before proof would be honest."},
		{id: "human-confirm-or-decompose", recommendedActor: "human", summary: "Confirm, decompose, or accept a human-auditable claim before treating it as proven."},
		{id: "split-or-defer", recommendedActor: "human", summary: "Split broad, historical, provider-caveated, policy-like, or otherwise blocked claims before verification."},
		{id: "inspect-manually", recommendedActor: "agent", summary: "Inspect claims whose labels do not choose a stronger branch yet."},
	}
	primary := map[string]*claimStatusActionBucket{}
	for _, bucket := range primaryDefinitions {
		primary[bucket.id] = bucket
	}
	crossDefinitions := []*claimStatusActionBucket{
		{id: "heuristic-review-needed", recommendedActor: "agent", summary: "Review heuristic labels before spending proof or eval budget."},
		{id: "stale-evidence", recommendedActor: "agent", summary: "Refresh or recheck stale evidence before consuming it as proof."},
	}
	cross := map[string]*claimStatusActionBucket{}
	for _, bucket := range crossDefinitions {
		cross[bucket.id] = bucket
	}
	for _, raw := range candidates {
		candidate := asMap(raw)
		claimID := stringFromAny(candidate["claimId"])
		claimEvidence := stringFromAny(candidate["evidenceStatus"])
		claimReview := stringFromAny(candidate["reviewStatus"])
		incrementClaimStatusActionBucket(primary[claimStatusPrimaryActionID(candidate)], candidate, claimID)
		if claimReview == "heuristic" && claimEvidence != "satisfied" {
			incrementClaimStatusActionBucket(cross["heuristic-review-needed"], candidate, claimID)
		}
		if claimEvidence == "stale" {
			incrementClaimStatusActionBucket(cross["stale-evidence"], candidate, claimID)
		}
	}
	return map[string]any{
		"primaryBuckets":      renderClaimStatusActionBuckets(primaryDefinitions),
		"crossCuttingSignals": renderClaimStatusActionBuckets(crossDefinitions),
	}
}

func claimStatusPrimaryActionID(candidate map[string]any) string {
	if stringFromAny(candidate["evidenceStatus"]) == "satisfied" {
		return "already-satisfied"
	}
	switch stringFromAny(candidate["verificationReadiness"]) {
	case "blocked":
		return "split-or-defer"
	case "needs-alignment":
		return "human-align-surfaces"
	case "needs-scenario":
		return "agent-design-scenario"
	case "ready-to-verify":
		switch stringFromAny(candidate["recommendedProof"]) {
		case "deterministic":
			return "agent-add-deterministic-proof"
		case "cautilus-eval":
			return "agent-plan-cautilus-eval"
		case "human-auditable":
			return "human-confirm-or-decompose"
		}
	}
	return "inspect-manually"
}

func incrementClaimStatusActionBucket(bucket *claimStatusActionBucket, candidate map[string]any, claimID string) {
	if bucket == nil {
		return
	}
	bucket.count++
	if bucket.byReviewStatus == nil {
		bucket.byReviewStatus = map[string]int{}
	}
	if bucket.byEvidenceStatus == nil {
		bucket.byEvidenceStatus = map[string]int{}
	}
	incrementStringCount(bucket.byReviewStatus, candidate["reviewStatus"])
	incrementStringCount(bucket.byEvidenceStatus, candidate["evidenceStatus"])
	if claimID != "" && len(bucket.sampleClaimIDs) < 5 {
		bucket.sampleClaimIDs = append(bucket.sampleClaimIDs, claimID)
	}
}

func renderClaimStatusActionBuckets(buckets []*claimStatusActionBucket) []any {
	rendered := make([]any, 0, len(buckets))
	for _, bucket := range buckets {
		if bucket.count == 0 {
			continue
		}
		rendered = append(rendered, map[string]any{
			"id":               bucket.id,
			"recommendedActor": bucket.recommendedActor,
			"count":            bucket.count,
			"byReviewStatus":   sortedCountMap(bucket.byReviewStatus),
			"byEvidenceStatus": sortedCountMap(bucket.byEvidenceStatus),
			"sampleClaimIds":   nonNilStringSlice(bucket.sampleClaimIDs),
			"summary":          bucket.summary,
		})
	}
	return rendered
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
	if err := validateClaimReviewActionBucket(normalized.ActionBucket); err != nil {
		return nil, err
	}
	possibleEvidenceRefs, evidencePreflight := collectPossibleClaimEvidenceRefs(packet, normalized.RepoRoot)
	candidates := attachPossibleEvidenceRefs(arrayOrEmpty(packet["claimCandidates"]), possibleEvidenceRefs)
	reviewCandidates, skippedClaims := selectClaimReviewCandidates(candidates, normalized.ActionBucket)
	clusters := buildClaimReviewClusters(reviewCandidates, normalized)
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
		"evidencePreflight": evidencePreflight,
		"reviewBudget": map[string]any{
			"maxClusters":         normalized.MaxClusters,
			"maxClaimsPerCluster": normalized.MaxClaimsPerCluster,
			"excerptChars":        normalized.ExcerptChars,
			"clusterPolicy":       normalized.ClusterPolicy,
			"actionBucket":        normalized.ActionBucket,
			"budgetSource":        "cli-or-default",
		},
		"selectionPolicy": map[string]any{
			"excludesEvidenceStatus": []any{"satisfied"},
			"excludesReviewStatus":   []any{"agent-reviewed", "human-reviewed"},
			"actionBucket":           normalized.ActionBucket,
			"reason":                 "already-satisfied and already-reviewed non-stale claims do not need LLM review by default; inspect `skippedClaims` to audit carried evidence and prior decisions.",
		},
		"clusters":        renderedClusters,
		"skippedClusters": skipped,
		"skippedClaims":   skippedClaims,
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
	options.ActionBucket = strings.TrimSpace(options.ActionBucket)
	return options
}

func validateClaimReviewActionBucket(bucket string) error {
	if strings.TrimSpace(bucket) == "" {
		return nil
	}
	switch bucket {
	case "already-satisfied", "agent-add-deterministic-proof", "agent-plan-cautilus-eval", "agent-design-scenario", "human-align-surfaces", "human-confirm-or-decompose", "split-or-defer", "inspect-manually":
		return nil
	default:
		return fmt.Errorf("unsupported --action-bucket %q", bucket)
	}
}

func selectClaimReviewCandidates(candidates []any, actionBucket string) ([]any, []any) {
	selected := []any{}
	skipped := []any{}
	for _, raw := range candidates {
		candidate := asMap(raw)
		if actionBucket != "" && claimStatusPrimaryActionID(candidate) != actionBucket {
			skipped = append(skipped, skippedClaimReviewCandidate(candidate, "action-bucket-mismatch"))
			continue
		}
		if stringFromAny(candidate["evidenceStatus"]) == "satisfied" {
			skipped = append(skipped, skippedClaimReviewCandidate(candidate, "already-satisfied"))
			continue
		}
		if claimReviewAlreadyAccepted(stringFromAny(candidate["reviewStatus"])) && stringFromAny(candidate["evidenceStatus"]) != "stale" {
			skipped = append(skipped, skippedClaimReviewCandidate(candidate, "already-reviewed"))
			continue
		}
		selected = append(selected, raw)
	}
	return selected, skipped
}

func skippedClaimReviewCandidate(candidate map[string]any, reason string) map[string]any {
	entry := map[string]any{
		"claimId":                stringFromAny(candidate["claimId"]),
		"claimFingerprint":       candidate["claimFingerprint"],
		"reason":                 reason,
		"recommendedProof":       candidate["recommendedProof"],
		"verificationReadiness":  candidate["verificationReadiness"],
		"recommendedEvalSurface": stringFromAny(candidate["recommendedEvalSurface"]),
		"evidenceStatus":         candidate["evidenceStatus"],
		"reviewStatus":           candidate["reviewStatus"],
		"actionBucket":           claimStatusPrimaryActionID(candidate),
	}
	if reason == "already-satisfied" {
		entry["sourceRefs"] = arrayOrEmpty(candidate["sourceRefs"])
		entry["evidenceRefs"] = arrayOrEmpty(candidate["evidenceRefs"])
		entry["unresolvedQuestions"] = arrayOrEmpty(candidate["unresolvedQuestions"])
	}
	return entry
}

func claimReviewAlreadyAccepted(status string) bool {
	switch status {
	case "agent-reviewed", "human-reviewed":
		return true
	default:
		return false
	}
}

func attachPossibleEvidenceRefs(candidates []any, refsByClaimID map[string][]any) []any {
	if len(refsByClaimID) == 0 {
		return candidates
	}
	enriched := make([]any, 0, len(candidates))
	for _, raw := range candidates {
		candidate := asMap(raw)
		claimID := stringFromAny(candidate["claimId"])
		refs := refsByClaimID[claimID]
		if len(refs) == 0 {
			enriched = append(enriched, raw)
			continue
		}
		next := map[string]any{}
		for key, value := range candidate {
			next[key] = value
		}
		next["possibleEvidenceRefs"] = refs
		enriched = append(enriched, next)
	}
	return enriched
}

func collectPossibleClaimEvidenceRefs(packet map[string]any, repoRoot string) (map[string][]any, map[string]any) {
	refsByClaimID := map[string][]any{}
	scanScope := asMap(packet["effectiveScanScope"])
	evidenceRoots := stringArrayOrEmpty(scanScope["evidenceRoots"])
	summary := map[string]any{
		"status":           "not-configured",
		"policy":           "possible evidence refs are hints only and cannot satisfy claims without review.",
		"evidenceRoots":    evidenceRoots,
		"scannedFileCount": 0,
		"matchedRefCount":  0,
	}
	if len(evidenceRoots) == 0 {
		return refsByClaimID, summary
	}
	if strings.TrimSpace(repoRoot) == "" {
		summary["status"] = "skipped-no-repo-root"
		return refsByClaimID, summary
	}
	candidateIDs := claimCandidateIDSet(arrayOrEmpty(packet["claimCandidates"]))
	if len(candidateIDs) == 0 {
		summary["status"] = "skipped-no-claim-ids"
		return refsByClaimID, summary
	}
	seenRefs := map[string]struct{}{}
	scannedFiles := 0
	matchedRefs := 0
	walkErrorCount := 0
	ignoreChecker := newGitIgnoreChecker(repoRoot)
	for _, root := range evidenceRoots {
		root = strings.TrimSpace(root)
		if root == "" {
			continue
		}
		normalizedRoot, err := normalizeClaimStatePath(root)
		if err != nil {
			continue
		}
		resolvedRoot := filepath.Join(repoRoot, filepath.FromSlash(normalizedRoot))
		if !fileExists(resolvedRoot) {
			continue
		}
		if walkErr := filepath.WalkDir(resolvedRoot, func(path string, entry fs.DirEntry, walkErr error) error {
			if walkErr != nil {
				return walkErr
			}
			relPath := relativeClaimPath(repoRoot, path)
			if entry.IsDir() {
				if relPath != "." && ignoreChecker.Ignored(relPath) {
					return filepath.SkipDir
				}
				return nil
			}
			if filepath.Ext(path) != ".json" {
				return nil
			}
			if ignoreChecker.Ignored(relPath) {
				return nil
			}
			bundle, readErr := readJSONFile(path)
			if readErr == nil && bundle["schemaVersion"] == contracts.ClaimEvidenceBundleSchema {
				scannedFiles++
				contentHash, _ := fileSHA256(path)
				for _, claimID := range claimEvidenceBundleClaimIDs(bundle) {
					if !candidateIDs[claimID] {
						continue
					}
					refID := claimID + "\x00" + relPath
					if _, exists := seenRefs[refID]; exists {
						continue
					}
					seenRefs[refID] = struct{}{}
					ref := map[string]any{
						"kind":                "cautilus-claim-evidence-bundle",
						"path":                relPath,
						"schemaVersion":       bundle["schemaVersion"],
						"bundleId":            bundle["bundleId"],
						"summary":             bundle["summary"],
						"contentHash":         contentHash,
						"matchKind":           "possible",
						"supportsClaimIds":    []any{claimID},
						"reviewedBy":          "deterministic-preflight",
						"preflightRoot":       normalizedRoot,
						"nonSatisfactionNote": "Possible evidence refs are hints only; claim review must verify them before evidenceStatus can become satisfied.",
					}
					refsByClaimID[claimID] = append(refsByClaimID[claimID], ref)
					matchedRefs++
				}
			}
			return nil
		}); walkErr != nil {
			walkErrorCount++
		}
	}
	summary["status"] = "completed"
	summary["scannedFileCount"] = scannedFiles
	summary["matchedRefCount"] = matchedRefs
	summary["walkErrorCount"] = walkErrorCount
	return refsByClaimID, summary
}

func claimCandidateIDSet(candidates []any) map[string]bool {
	ids := map[string]bool{}
	for _, raw := range candidates {
		if claimID := stringFromAny(asMap(raw)["claimId"]); claimID != "" {
			ids[claimID] = true
		}
	}
	return ids
}

func claimEvidenceBundleClaimIDs(bundle map[string]any) []string {
	ids := []string{}
	seen := map[string]struct{}{}
	for _, raw := range stringArrayOrEmpty(bundle["createdForClaimIds"]) {
		claimID := strings.TrimSpace(raw)
		if claimID == "" {
			continue
		}
		if _, exists := seen[claimID]; exists {
			continue
		}
		seen[claimID] = struct{}{}
		ids = append(ids, claimID)
	}
	return ids
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
	entry := map[string]any{
		"claimId":          candidate["claimId"],
		"claimFingerprint": candidate["claimFingerprint"],
		"summary":          candidate["summary"],
		"sourceRefs":       truncateReviewSourceRefs(arrayOrEmpty(candidate["sourceRefs"]), excerptChars),
		"currentLabels":    currentClaimLabels(candidate),
		"actionBucket":     claimStatusPrimaryActionID(candidate),
		"groupHints":       arrayOrEmpty(candidate["groupHints"]),
		"evidenceRefs":     arrayOrEmpty(candidate["evidenceRefs"]),
		"nextAction":       candidate["nextAction"],
	}
	if refs := arrayOrEmpty(candidate["possibleEvidenceRefs"]); len(refs) > 0 {
		entry["possibleEvidenceRefs"] = refs
	}
	return entry
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
	reviewRuns := normalizeClaimReviewRuns(arrayOrEmpty(updated["reviewRuns"]))
	if reviewRun := renderClaimReviewRun(reviewResult); claimReviewRunHasProvenance(reviewRun) {
		reviewRuns = normalizeClaimReviewRuns(append(reviewRuns, reviewRun))
	}
	if len(reviewRuns) > 0 {
		updated["reviewRuns"] = reviewRuns
	} else {
		delete(updated, "reviewRuns")
	}
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
			skipped = append(skipped, skippedClaimEvalPlan(candidate, "not-cautilus-eval"))
			continue
		}
		if stringFromAny(candidate["verificationReadiness"]) != "ready-to-verify" {
			skipped = append(skipped, skippedClaimEvalPlan(candidate, "not-ready-to-verify"))
			continue
		}
		if !claimEvalPlanReviewAccepted(stringFromAny(candidate["reviewStatus"])) {
			skipped = append(skipped, skippedClaimEvalPlan(candidate, "not-reviewed"))
			continue
		}
		if stringFromAny(candidate["evidenceStatus"]) == "satisfied" {
			skipped = append(skipped, skippedClaimEvalPlan(candidate, "already-satisfied"))
			continue
		}
		if len(plans) >= maxClaims {
			skipped = append(skipped, skippedClaimEvalPlan(candidate, "max-claims-exceeded"))
			continue
		}
		plans = append(plans, map[string]any{
			"planId":                   "eval-plan-" + slugifyClaimID(claimID),
			"claimId":                  claimID,
			"claimFingerprint":         candidate["claimFingerprint"],
			"targetSurface":            claimEvalPlanSurface(candidate),
			"proofRequirement":         BuildClaimProofRequirement(claimEvalPlanSurface(candidate)),
			"fixtureAuthoringGuidance": BuildClaimEvalFixtureAuthoringGuidance(claimEvalPlanSurface(candidate)),
			"draftIntent":              claimEvalPlanIntent(candidate),
			"sourceRefs":               arrayOrEmpty(candidate["sourceRefs"]),
			"evidenceStatus":           candidate["evidenceStatus"],
			"reviewStatus":             candidate["reviewStatus"],
			"unresolvedQuestions":      arrayOrEmpty(candidate["unresolvedQuestions"]),
			"nextStep":                 "Create a host-owned cautilus.evaluation_input.v1 fixture and adapter-owned runner for this plan.",
		})
	}
	inputPath := strings.TrimSpace(options.DisplayClaimsPath)
	if inputPath == "" {
		inputPath = options.ClaimsPath
	}
	return map[string]any{
		"schemaVersion": contracts.ClaimEvalPlanSchema,
		"inputPath":     filepath.ToSlash(filepath.Clean(inputPath)),
		"sourceClaimPacket": map[string]any{
			"schemaVersion":  packet["schemaVersion"],
			"gitCommit":      packet["gitCommit"],
			"candidateCount": len(arrayOrEmpty(packet["claimCandidates"])),
		},
		"selectionPolicy": map[string]any{
			"requiresRecommendedProof":      "cautilus-eval",
			"requiresVerificationReadiness": "ready-to-verify",
			"requiresReviewStatus":          []any{"agent-reviewed", "human-reviewed"},
			"excludesEvidenceStatus":        []any{"satisfied"},
			"maxClaims":                     maxClaims,
		},
		"planSummary": map[string]any{
			"evalPlanCount":       len(plans),
			"skippedClaimCount":   len(skipped),
			"skippedByReason":     skippedClaimEvalPlanReasonCounts(skipped),
			"zeroPlanReason":      claimEvalPlanZeroReason(plans, skipped),
			"zeroPlanExpectation": "Zero eval plans can be expected when reviewed eval-ready claims are already satisfied or when remaining reviewed claims are not Cautilus eval targets.",
		},
		"evalPlans":       plans,
		"skippedClaims":   skipped,
		"nonWriterNotice": "This packet plans eval fixtures but does not write host-owned fixtures, prompts, runners, or policy.",
	}, nil
}

func skippedClaimEvalPlanReasonCounts(skipped []any) map[string]any {
	counts := map[string]any{}
	for _, raw := range skipped {
		reason := stringFromAny(asMap(raw)["reason"])
		if reason == "" {
			reason = "unknown"
		}
		current := 0
		if value, ok := counts[reason].(int); ok {
			current = value
		}
		counts[reason] = current + 1
	}
	return counts
}

func claimEvalPlanZeroReason(plans []any, skipped []any) string {
	if len(plans) > 0 {
		return ""
	}
	counts := skippedClaimEvalPlanReasonCounts(skipped)
	alreadySatisfied := intFromAny(counts["already-satisfied"])
	notEval := intFromAny(counts["not-cautilus-eval"])
	notReviewed := intFromAny(counts["not-reviewed"])
	notReady := intFromAny(counts["not-ready-to-verify"])
	switch {
	case alreadySatisfied > 0 && notEval > 0:
		return "all-reviewed-eval-targets-satisfied-and-remaining-reviewed-claims-not-eval-targets"
	case alreadySatisfied > 0:
		return "all-reviewed-eval-targets-already-satisfied"
	case notEval > 0 && notReviewed == 0 && notReady == 0:
		return "reviewed-claims-are-not-cautilus-eval-targets"
	default:
		return "no-reviewed-ready-cautilus-eval-claims"
	}
}

func skippedClaimEvalPlan(candidate map[string]any, reason string) map[string]any {
	entry := map[string]any{
		"claimId":               stringFromAny(candidate["claimId"]),
		"claimFingerprint":      candidate["claimFingerprint"],
		"reason":                reason,
		"recommendedProof":      candidate["recommendedProof"],
		"verificationReadiness": candidate["verificationReadiness"],
		"evidenceStatus":        candidate["evidenceStatus"],
		"reviewStatus":          candidate["reviewStatus"],
	}
	if stringFromAny(candidate["recommendedProof"]) == "cautilus-eval" {
		entry["recommendedEvalSurface"] = claimEvalPlanSurface(candidate)
	} else if surface := stringFromAny(candidate["recommendedEvalSurface"]); surface != "" {
		entry["recommendedEvalSurface"] = surface
	}
	if reason == "already-satisfied" || stringFromAny(candidate["evidenceStatus"]) == "satisfied" {
		entry["sourceRefs"] = arrayOrEmpty(candidate["sourceRefs"])
		entry["evidenceRefs"] = arrayOrEmpty(candidate["evidenceRefs"])
		entry["unresolvedQuestions"] = arrayOrEmpty(candidate["unresolvedQuestions"])
	}
	return entry
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

func BuildClaimEvalFixtureAuthoringGuidance(surface string) map[string]any {
	surface = strings.TrimSpace(surface)
	if surface == "" {
		surface = "dev/repo"
	}
	parts := strings.SplitN(surface, "/", 2)
	fixtureSurface := parts[0]
	fixturePreset := ""
	if len(parts) == 2 {
		fixturePreset = parts[1]
	}
	guidance := map[string]any{
		"schemaVersion":            "cautilus.claim_eval_fixture_authoring_guidance.v1",
		"evaluationInputSchema":    contracts.EvaluationInputSchema,
		"surface":                  fixtureSurface,
		"preset":                   fixturePreset,
		"fixtureOwner":             "host-repo",
		"runnerOwner":              "host-repo-adapter",
		"requiredRunnerCapability": requiredRunnerCapability(surface),
		"requiredObservability":    stringArrayToAny(requiredObservability(surface)),
		"nonWriterBoundary":        "Cautilus plans the fixture contract but does not write host-owned fixtures, prompts, runners, wrappers, or acceptance policy.",
	}
	switch surface {
	case "app/chat":
		guidance["minimumSuiteFields"] = []any{"schemaVersion", "surface", "preset", "suiteId", "provider", "model", "cases"}
		guidance["minimumCaseFields"] = []any{"caseId", "messages", "expected"}
		guidance["expectedShape"] = "expected.finalText for fragment checks or expected.snapshot for file-backed finalText snapshots"
		guidance["runnerOutputSchema"] = contracts.AppChatEvaluationInputsSchema
	case "app/prompt":
		guidance["minimumSuiteFields"] = []any{"schemaVersion", "surface", "preset", "suiteId", "provider", "model", "cases"}
		guidance["minimumCaseFields"] = []any{"caseId", "input", "expected"}
		guidance["expectedShape"] = "expected.finalText for fragment checks or expected.snapshot for file-backed finalText snapshots"
		guidance["runnerOutputSchema"] = contracts.AppPromptEvaluationInputsSchema
	case "dev/skill":
		guidance["minimumSuiteFields"] = []any{"schemaVersion", "surface", "preset", "suiteId", "cases"}
		guidance["minimumCaseFields"] = []any{"caseId", "evaluationKind", "prompt"}
		guidance["conditionalCaseFields"] = map[string]any{
			"trigger":   []any{"expectedTrigger"},
			"execution": []any{"thresholds or turns/auditKind when the evaluated behavior needs them"},
		}
		guidance["expectedShape"] = "trigger cases require expectedTrigger; execution cases use thresholds, turns, or auditKind depending on the skill contract"
		guidance["runnerOutputSchema"] = contracts.SkillEvaluationInputsSchema
	default:
		guidance["minimumSuiteFields"] = []any{"schemaVersion", "surface", "preset", "suiteId", "cases"}
		guidance["minimumCaseFields"] = []any{"caseId", "prompt"}
		guidance["expectedShape"] = "case-level expected files, commands, or routing evidence owned by the repo runner"
		guidance["runnerOutputSchema"] = contracts.EvaluationObservedSchema
	}
	return guidance
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
				} else if !validEvidenceRefKind(stringFromAny(ref["kind"])) {
					issues = append(issues, claimValidationIssue(refPath+".kind", fmt.Sprintf("evidence ref kind %q is unsupported", stringFromAny(ref["kind"]))))
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
		"evidenceValidationPolicy": "satisfied claims require agent/human review plus a direct or verified evidence ref with path, supported kind, commit or contentHash, and supportsClaimIds containing the claim.",
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
	if value := stringFromAny(update["claimAudience"]); value != "" && !validClaimAudience(value) {
		return fmt.Errorf("%s.claimAudience %q is unsupported", field, value)
	}
	if value := stringFromAny(update["recommendedEvalSurface"]); value != "" && !validEvalSurface(value) {
		return fmt.Errorf("%s.recommendedEvalSurface %q is unsupported", field, value)
	}
	if _, ok := update["unresolvedQuestions"]; ok {
		if _, err := assertArray(update["unresolvedQuestions"], field+".unresolvedQuestions"); err != nil {
			return err
		}
	}
	return nil
}

func applyClaimUpdate(candidate map[string]any, update map[string]any) ([]any, error) {
	applied := []any{}
	protectSatisfiedEvidence := shouldProtectSatisfiedEvidence(candidate, update)
	for _, field := range []string{"recommendedProof", "verificationReadiness", "evidenceStatus", "reviewStatus", "lifecycle", "whyThisLayer"} {
		if value := stringFromAny(update[field]); value != "" {
			if field == "evidenceStatus" && protectSatisfiedEvidence {
				continue
			}
			candidate[field] = value
			applied = append(applied, field)
		}
	}
	if value := stringFromAny(update["claimAudience"]); value != "" {
		candidate["claimAudience"] = value
		candidate["claimAudienceSource"] = "review-result"
		applied = append(applied, "claimAudience", "claimAudienceSource")
	}
	if _, exists := update["recommendedEvalSurface"]; exists {
		if value := stringFromAny(update["recommendedEvalSurface"]); value != "" {
			candidate["recommendedEvalSurface"] = value
		} else {
			delete(candidate, "recommendedEvalSurface")
		}
		applied = append(applied, "recommendedEvalSurface")
	}
	if stringFromAny(candidate["recommendedProof"]) != "cautilus-eval" {
		if _, hadSurface := candidate["recommendedEvalSurface"]; hadSurface {
			delete(candidate, "recommendedEvalSurface")
			if !appliedFieldContains(applied, "recommendedEvalSurface") {
				applied = append(applied, "recommendedEvalSurface")
			}
		}
	}
	if refs := arrayOrEmpty(update["evidenceRefs"]); len(refs) > 0 {
		if !protectSatisfiedEvidence {
			candidate["evidenceRefs"] = refs
			applied = append(applied, "evidenceRefs")
		}
	}
	if nextAction := stringFromAny(update["nextAction"]); nextAction != "" && !protectSatisfiedEvidence {
		candidate["nextAction"] = nextAction
		applied = append(applied, "nextAction")
	}
	if reason := stringFromAny(update["evidenceStatusReason"]); reason != "" && !protectSatisfiedEvidence {
		candidate["evidenceStatusReason"] = reason
		applied = append(applied, "evidenceStatusReason")
	}
	if syncClaimGroupHints(candidate) {
		applied = append(applied, "groupHints")
	}
	if _, exists := update["unresolvedQuestions"]; exists {
		if !protectSatisfiedEvidence {
			candidate["unresolvedQuestions"] = arrayOrEmpty(update["unresolvedQuestions"])
			applied = append(applied, "unresolvedQuestions")
		}
	}
	if err := validateClaimEvidenceSatisfaction(candidate); err != nil {
		return nil, err
	}
	return applied, nil
}

func shouldProtectSatisfiedEvidence(candidate map[string]any, update map[string]any) bool {
	if stringFromAny(candidate["evidenceStatus"]) != "satisfied" {
		return false
	}
	switch stringFromAny(update["evidenceStatus"]) {
	case "unknown", "missing", "partial":
		return true
	default:
		return false
	}
}

func syncClaimGroupHints(candidate map[string]any) bool {
	rawHints := arrayOrEmpty(candidate["groupHints"])
	if len(rawHints) == 0 {
		return false
	}
	next := []string{}
	seen := map[string]bool{}
	for _, raw := range rawHints {
		hint := stringFromAny(raw)
		if hint == "" || isDerivedClaimGroupHint(hint) || seen[hint] {
			continue
		}
		seen[hint] = true
		next = append(next, hint)
	}
	for _, hint := range []string{
		"audience:" + claimAudienceOrUnclear(stringFromAny(candidate["claimAudience"])),
		stringFromAny(candidate["recommendedProof"]),
		stringFromAny(candidate["recommendedEvalSurface"]),
	} {
		if hint != "" && !seen[hint] {
			seen[hint] = true
			next = append(next, hint)
		}
	}
	sort.Strings(next)
	candidate["groupHints"] = stringSliceToAny(next)
	return !sameStringSet(rawHints, next)
}

func isDerivedClaimGroupHint(hint string) bool {
	return strings.HasPrefix(hint, "audience:") || validRecommendedProof(hint) || validEvalSurface(hint)
}

func sameStringSet(raw []any, expected []string) bool {
	if len(raw) != len(expected) {
		return false
	}
	actual := stringArrayOrEmpty(raw)
	sort.Strings(actual)
	for index := range expected {
		if actual[index] != expected[index] {
			return false
		}
	}
	return true
}

func appliedFieldContains(fields []any, field string) bool {
	for _, raw := range fields {
		if stringFromAny(raw) == field {
			return true
		}
	}
	return false
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
		if stringFromAny(ref["path"]) == "" || !validEvidenceRefKind(stringFromAny(ref["kind"])) {
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
	return fmt.Errorf("evidenceStatus satisfied requires a direct or verified evidenceRef with path, supported kind, commit or contentHash, and supportsClaimIds containing the claim")
}

func evidenceRefSupportsClaim(ref map[string]any, claimID string) bool {
	for _, raw := range arrayOrEmpty(ref["supportsClaimIds"]) {
		if stringFromAny(raw) == claimID {
			return true
		}
	}
	return false
}

func validEvidenceRefKind(value string) bool {
	switch value {
	case "spec", "test", "fixture", "eval-summary", "eval-observed", "report", "human-note", "cautilus-claim-evidence-bundle":
		return true
	default:
		return false
	}
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

func normalizeClaimReviewRuns(rawRuns []any) []any {
	result := []any{}
	seen := map[string]struct{}{}
	for _, raw := range rawRuns {
		run := asMap(raw)
		if !claimReviewRunHasProvenance(run) {
			continue
		}
		normalized := normalizeClaimReviewRun(run)
		keyBytes, err := json.Marshal(normalized)
		if err != nil {
			continue
		}
		key := string(keyBytes)
		if _, exists := seen[key]; exists {
			continue
		}
		seen[key] = struct{}{}
		result = append(result, normalized)
	}
	return result
}

func claimReviewRunHasProvenance(run map[string]any) bool {
	return len(asMap(run["reviewRun"])) > 0 || len(asMap(run["sourceReviewInput"])) > 0
}

func normalizeClaimReviewRun(run map[string]any) map[string]any {
	normalized := map[string]any{
		"schemaVersion": contracts.ClaimReviewResultSchema,
	}
	if reviewRun := asMap(run["reviewRun"]); len(reviewRun) > 0 {
		normalized["reviewRun"] = reviewRun
	}
	if sourceReviewInput := asMap(run["sourceReviewInput"]); len(sourceReviewInput) > 0 {
		normalized["sourceReviewInput"] = sourceReviewInput
	}
	if clusterCount := intFromAny(run["clusterCount"]); clusterCount > 0 {
		normalized["clusterCount"] = clusterCount
	}
	return normalized
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
	changedFiles := []string{}
	changedFilesKnown := true
	changedSources := []string{}
	if baseCommit != "" && targetCommit != "" {
		changedFiles, changedFilesKnown = gitChangedFilesWithStatus(options.RepoRoot, baseCommit, targetCommit)
		if changedFilesKnown {
			changedSources = filterClaimSourceChanges(options.RepoRoot, previous, changedFiles)
		}
	}
	currentDiscoveryEngine := renderClaimDiscoveryEngine(options.RepoRoot)
	previousDiscoveryEngine := asMap(previous["discoveryEngine"])
	discoveryEngineChanged := claimDiscoveryEngineChanged(previousDiscoveryEngine, currentDiscoveryEngine)
	previousCandidates := arrayOrEmpty(previous["claimCandidates"])
	claims := []any{}
	changedClaimCount := 0
	carriedForwardClaimCount := 0
	changedClaimSourceCounts := map[string]int{}
	staleEvidence := []any{}
	changedEvidenceRefs := 0
	missingEvidenceRefs := 0
	unsupportedEvidenceRefs := 0
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
		reconciliation := reconcileCarriedEvidenceRefs(options.RepoRoot, cloneMap(entry))
		if reconciliation.staleClaim {
			changedEvidenceRefs += reconciliation.changedRefs
			missingEvidenceRefs += reconciliation.missingRefs
			unsupportedEvidenceRefs += reconciliation.unsupportedRefs
			staleEvidence = append(staleEvidence, map[string]any{
				"claimId": claimID,
				"reasons": stringSliceToAny(reconciliation.reasons),
			})
		}
	}
	refreshSummary := renderClaimRefreshSummary(baseCommit, targetCommit, changedSources, changedClaimCount, carriedForwardClaimCount, changedClaimSourceCounts, discoveryEngineChanged)
	refreshSummary["staleEvidenceClaimCount"] = len(staleEvidence)
	refreshSummary["changedEvidenceRefCount"] = changedEvidenceRefs
	refreshSummary["missingEvidenceRefCount"] = missingEvidenceRefs
	refreshSummary["unsupportedEvidenceRefCount"] = unsupportedEvidenceRefs
	refreshSummary["discoveryEngineChanged"] = discoveryEngineChanged
	refreshSummary["previousDiscoveryEngine"] = renderPreviousClaimDiscoveryEngine(previousDiscoveryEngine)
	refreshSummary["currentDiscoveryEngine"] = currentDiscoveryEngine
	if baseCommit != "" && targetCommit != "" && baseCommit != targetCommit && !changedFilesKnown {
		refreshSummary["status"] = "unknown"
		refreshSummary["summary"] = "Cautilus could not compare the saved claim map with the current checkout because git diff information is unavailable."
	}
	return map[string]any{
		"schemaVersion":      contracts.ClaimRefreshPlanSchema,
		"sourceRoot":         ".",
		"previousPath":       filepath.ToSlash(filepath.Clean(options.PreviousPath)),
		"baseCommit":         baseCommit,
		"targetCommit":       targetCommit,
		"targetPolicy":       "current-head",
		"workingTreePolicy":  "excluded",
		"discoveryEngine":    currentDiscoveryEngine,
		"changedFiles":       changedFiles,
		"changedSources":     changedSources,
		"claimPlan":          claims,
		"staleEvidence":      staleEvidence,
		"refreshSummary":     refreshSummary,
		"claimState":         renderClaimState(options.Config),
		"effectiveScanScope": renderClaimScanScope(options.Config),
	}, nil
}

func claimDiscoveryEngineChanged(previous map[string]any, current map[string]any) bool {
	if len(current) == 0 {
		return false
	}
	if len(previous) == 0 {
		return true
	}
	for _, key := range []string{"name", "ruleset"} {
		currentValue := strings.TrimSpace(stringOrEmpty(current[key]))
		previousValue := strings.TrimSpace(stringOrEmpty(previous[key]))
		if currentValue != "" && previousValue != "" && currentValue != previousValue {
			return true
		}
		if currentValue != "" && previousValue == "" {
			return true
		}
	}
	return false
}

func renderPreviousClaimDiscoveryEngine(previous map[string]any) map[string]any {
	if len(previous) == 0 {
		return map[string]any{"status": "missing"}
	}
	return previous
}

func renderClaimRefreshSummary(baseCommit string, targetCommit string, changedSources []string, changedClaimCount int, carriedForwardClaimCount int, changedClaimSourceCounts map[string]int, discoveryEngineChanged bool) map[string]any {
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
			status = "source-changes-detected"
			summary = "The saved claim map was made from an older checkout; recorded claim source files changed even though no existing claim source refs matched."
		} else {
			status = "up-to-date"
			summary = "The saved claim map points at an older commit, but no recorded claim source files changed; no refresh work is needed before review or eval planning."
		}
	}
	if status == "up-to-date" && discoveryEngineChanged {
		status = "discovery-engine-changed"
		summary = "The saved claim map was produced by a different or unknown claim-discovery engine; update the saved claim map before review or eval planning."
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

func gitChangedFilesWithStatus(repoRoot string, baseCommit string, targetCommit string) ([]string, bool) {
	command := exec.Command("git", "-C", repoRoot, "diff", "--name-only", baseCommit, targetCommit)
	output, err := command.Output()
	if err != nil {
		return []string{}, false
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
	return result, true
}

func filterClaimSourceChanges(repoRoot string, packet map[string]any, changedFiles []string) []string {
	sourcePaths := claimPacketSourcePathSet(packet)
	if len(sourcePaths) == 0 {
		return append([]string{}, changedFiles...)
	}
	sourceHashes := claimPacketSourceContentHashSet(packet)
	result := []string{}
	for _, changed := range changedFiles {
		if sourcePaths[changed] && !claimSourceContentStillMatches(repoRoot, changed, sourceHashes[changed]) {
			result = append(result, changed)
		}
	}
	sort.Strings(result)
	return result
}

func claimPacketSourcePathSet(packet map[string]any) map[string]bool {
	paths := map[string]bool{}
	for _, raw := range arrayOrEmpty(packet["sourceInventory"]) {
		entry := asMap(raw)
		for _, key := range []string{"path", "contentPath"} {
			path := filepath.ToSlash(filepath.Clean(stringOrEmpty(entry[key])))
			if path != "." && strings.TrimSpace(path) != "" {
				paths[path] = true
			}
		}
	}
	for _, raw := range arrayOrEmpty(packet["claimCandidates"]) {
		for _, ref := range arrayOrEmpty(asMap(raw)["sourceRefs"]) {
			path := filepath.ToSlash(filepath.Clean(stringOrEmpty(asMap(ref)["path"])))
			if path != "." && strings.TrimSpace(path) != "" {
				paths[path] = true
			}
		}
	}
	return paths
}

func claimPacketSourceContentHashSet(packet map[string]any) map[string]string {
	hashes := map[string]string{}
	for _, raw := range arrayOrEmpty(packet["sourceInventory"]) {
		entry := asMap(raw)
		contentHash := strings.TrimSpace(stringOrEmpty(entry["contentHash"]))
		if contentHash == "" {
			continue
		}
		for _, key := range []string{"path", "contentPath"} {
			path := filepath.ToSlash(filepath.Clean(stringOrEmpty(entry[key])))
			if path != "." && strings.TrimSpace(path) != "" {
				hashes[path] = contentHash
			}
		}
	}
	return hashes
}

func claimSourceContentStillMatches(repoRoot string, path string, recordedHash string) bool {
	if strings.TrimSpace(recordedHash) == "" {
		return false
	}
	currentHash, err := fileSHA256(resolvePath(repoRoot, path))
	if err != nil {
		return false
	}
	return currentHash == recordedHash
}

func claimSourceContentPath(repoRoot string, absPath string, relPath string) string {
	canonicalPath, err := filepath.EvalSymlinks(absPath)
	if err != nil {
		return ""
	}
	rel, err := filepath.Rel(repoRoot, canonicalPath)
	if err != nil {
		return ""
	}
	rel = filepath.ToSlash(filepath.Clean(rel))
	if rel == "." || rel == "" || strings.HasPrefix(rel, "../") || filepath.IsAbs(rel) || rel == relPath {
		return ""
	}
	return rel
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

func containsAnyPrefix(value string, prefixes []string) bool {
	for _, prefix := range prefixes {
		if strings.HasPrefix(value, prefix) {
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
