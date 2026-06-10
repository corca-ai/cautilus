package runtime

import (
	"crypto/sha256"
	"encoding/hex"
	"encoding/json"
	"fmt"
	"os"
	"path/filepath"
	"sort"
	"strings"
	"unicode/utf8"

	"github.com/corca-ai/cautilus/internal/contracts"
)

type ClaimExtractionInputOptions struct {
	RepoRoot           string
	SourcePaths        []string
	AdapterPath        string
	MaxClaimsPerSource int
	MaxExcerptChars    int
}

type ClaimExtractionApplyOptions struct {
	RepoRoot          string
	InputPath         string
	ResultPath        string
	AllowStaleSources bool
}

const (
	claimExtractionTemplateVersion = "v1"
	claimExtractionAnchoringPolicy = "whitespace-normalized-substring-of-raw-source"
	claimExtractionMaxRejectedClaimEntries = 50
	defaultMaxClaimsPerSource = 80
	defaultMaxExcerptChars    = 600
)

// BuildClaimExtractionInput emits the deterministic agent-extraction input packet:
// sources with content hashes, the embedded product-owned extraction template with
// version and hash, merged classification hints, and extraction bounds.
// It makes no model calls; the Cautilus Agent consumes this packet to extract claims.
func BuildClaimExtractionInput(options ClaimExtractionInputOptions) (map[string]any, error) {
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
	config, err := resolveClaimDiscoveryConfig(resolvedRoot, options.SourcePaths, options.AdapterPath)
	if err != nil {
		return nil, err
	}
	sources, sourceGraph, err := discoverClaimSources(resolvedRoot, config)
	if err != nil {
		return nil, err
	}
	renderedSources := make([]any, 0, len(sources))
	for _, source := range sources {
		entry := map[string]any{
			"path":               source.relPath,
			"kind":               source.kind,
			"depth":              source.depth,
			"audienceHint":       claimAudienceOrUnclear(source.audience),
			"audienceHintSource": claimAudienceSourceOrUnknown(source.audienceSource),
			"status":             "extract",
		}
		if source.discoveredFrom != "" {
			entry["discoveredFrom"] = source.discoveredFrom
		}
		if hash, hashErr := fileSHA256(source.absPath); hashErr == nil {
			entry["contentHash"] = hash
		} else {
			entry["status"] = "missing"
		}
		renderedSources = append(renderedSources, entry)
	}
	template := claimExtractionTemplateV1(config)
	bounds := claimExtractionBounds(options)
	return map[string]any{
		"schemaVersion":      contracts.ClaimExtractionInputSchema,
		"sourceRoot":         ".",
		"gitCommit":          currentGitCommit(resolvedRoot),
		"extractionTarget":   "first-extraction",
		"effectiveScanScope": renderClaimScanScope(config),
		"sources":            renderedSources,
		"sourceCount":        len(renderedSources),
		"sourceGraph":        sourceGraph,
		"template":           template,
		"bounds":             bounds,
		"outputSchema":       contracts.ClaimExtractionResultSchema,
		"confirmationNotice": "Scan-scope confirmation does not authorize agent extraction; running the extraction is an LLM activity behind a separate extraction-budget confirmation.",
	}, nil
}

func claimExtractionBounds(options ClaimExtractionInputOptions) map[string]any {
	maxClaims := options.MaxClaimsPerSource
	if maxClaims <= 0 {
		maxClaims = defaultMaxClaimsPerSource
	}
	maxExcerpt := options.MaxExcerptChars
	if maxExcerpt <= 0 {
		maxExcerpt = defaultMaxExcerptChars
	}
	return map[string]any{
		"maxClaimsPerSource": maxClaims,
		"maxExcerptChars":    maxExcerpt,
	}
}

// claimExtractionTemplateV1 renders the product-owned extraction template.
// The adapter-supplied classification hints arrive pre-merged through the scan
// config; the template carries the merged result, never new repo-specific rules.
func claimExtractionTemplateV1(config claimDiscoveryConfig) map[string]any {
	template := map[string]any{
		"templateVersion": claimExtractionTemplateVersion,
		"claimDefinition": "A behavior claim is a declared promise about how the product, repo, or workflow behaves, addressed to a user, operator, or agent, that could in principle be proven or falsified. Roadmap intent, design philosophy, open questions, glossary definitions, and document metadata are not claims.",
		"nonClaimConventions": map[string]any{
			"nonClaimSectionHeadings": stringArrayToAny(nonNilStringSlice(config.nonClaimSectionHeadings)),
			"portableRules": []any{
				"Frontmatter is metadata, not a claim.",
				"Code-styled glossary labels and definition lists are not claims.",
				"Prompt examples, sample inputs, and open questions are not claims.",
				"Text under a non-claim section heading is not a claim.",
			},
		},
		"excerptRules":    "Every claim must carry at least one excerpt copied exactly from the source text, with its source path and a line locator. Mark exactly one excerpt per claim as primary: true; it is the claim's identity anchor across re-extractions. Keep paraphrase in the summary only. An excerpt that does not appear verbatim in the source after whitespace normalization causes the whole claim to be rejected, so copy text exactly instead of fixing typos or grammar. When the same promise is declared in multiple places, emit one claim with multiple excerpts instead of duplicate claims. Keep each excerpt within the maxExcerptChars bound (counted in characters, not bytes).",
		"routingGuidance": "Route every claim toward the evidence it needs next. recommendedProof: deterministic when a repo-owned unit, lint, build, schema, or CI check can prove it; human-auditable when reading current source, docs, or generated artifacts can prove it; cautilus-eval when proof depends on model, agent, prompt, skill, workflow, or behavior execution. recommendedEvalSurface (cautilus-eval only): dev/repo for repo-instruction behavior, dev/skill for skill behavior, app/chat for conversational app behavior, app/prompt for single-prompt app behavior. verificationReadiness: ready-for-proof when the claim is provable as stated; needs-scenario when a concrete scenario must be written first; needs-alignment when the promise itself needs a maintainer decision; blocked when extraction could not settle what the claim means. claimAudience: user, developer, or unclear. claimSemanticGroup: a short label grouping related claims.",
		"uncertaintyRule": "When unsure whether text is a claim, emit the claim with verificationReadiness: blocked and add an entry to unresolvedQuestions instead of silently dropping it.",
	}
	template["templateHash"] = claimExtractionTemplateHash(template)
	return template
}

// claimExtractionTemplateHash hashes the canonical JSON of the template block
// (excluding the hash field itself), so every extraction run records exactly
// which template prose plus merged conventions produced it.
func claimExtractionTemplateHash(template map[string]any) string {
	hashable := map[string]any{}
	for key, value := range template {
		if key == "templateHash" {
			continue
		}
		hashable[key] = value
	}
	canonical, err := json.Marshal(hashable)
	if err != nil {
		return ""
	}
	hash := sha256.Sum256(canonical)
	return "sha256:" + hex.EncodeToString(hash[:])
}

// normalizeExcerptForAnchoring is whitespace-only normalization (collapse runs,
// trim). It is deliberately weaker than the fingerprint normalization in
// normalizeClaimSummary and the two must stay separate: anchoring proves the
// agent quoted the source, fingerprinting defines stable claim identity.
func normalizeExcerptForAnchoring(text string) string {
	return strings.Join(strings.Fields(text), " ")
}

func excerptAnchorsInContent(excerpt string, content string) bool {
	normalizedExcerpt := normalizeExcerptForAnchoring(excerpt)
	if normalizedExcerpt == "" {
		return false
	}
	return strings.Contains(normalizeExcerptForAnchoring(content), normalizedExcerpt)
}

type claimExtractionRejection struct {
	reason  string
	detail  string
	summary string
	path    string
	line    int
}

// ApplyClaimExtractionResult validates an agent extraction result against its
// input packet and composes the binary-owned cautilus.claim_proof_plan.v1 packet
// with extractionMode: agent. Anchoring failures reject individual claims into
// extractionAudit.rejectedClaims; schema, template-hash, and stale-source
// problems fail the whole command.
func ApplyClaimExtractionResult(inputPacket map[string]any, resultPacket map[string]any, options ClaimExtractionApplyOptions) (map[string]any, error) {
	repoRoot := strings.TrimSpace(options.RepoRoot)
	if repoRoot == "" {
		repoRoot = "."
	}
	resolvedRoot, err := filepath.Abs(repoRoot)
	if err != nil {
		return nil, err
	}
	if inputPacket["schemaVersion"] != contracts.ClaimExtractionInputSchema {
		return nil, fmt.Errorf("input schemaVersion must be %s", contracts.ClaimExtractionInputSchema)
	}
	template := asMap(inputPacket["template"])
	templateHash := strings.TrimSpace(stringFromAny(template["templateHash"]))
	if templateHash == "" {
		return nil, fmt.Errorf("input template.templateHash is missing")
	}
	if err := validateClaimExtractionResult(resultPacket); err != nil {
		return nil, err
	}
	resultTemplateHash := strings.TrimSpace(stringFromAny(asMap(resultPacket["extractionInputRef"])["templateHash"]))
	if resultTemplateHash != templateHash {
		return nil, fmt.Errorf("extraction result templateHash %s does not match input templateHash %s; regenerate extraction-input and re-extract instead of mixing template versions", resultTemplateHash, templateHash)
	}

	sourcesByPath := map[string]map[string]any{}
	sourceOrder := []string{}
	for _, raw := range arrayOrEmpty(inputPacket["sources"]) {
		entry := asMap(raw)
		path := filepath.ToSlash(filepath.Clean(stringFromAny(entry["path"])))
		if path == "" || path == "." {
			continue
		}
		sourcesByPath[path] = entry
		sourceOrder = append(sourceOrder, path)
	}

	currentContent := map[string]string{}
	staleSources := []string{}
	for _, path := range sourceOrder {
		entry := sourcesByPath[path]
		recordedHash := strings.TrimSpace(stringFromAny(entry["contentHash"]))
		content, readErr := os.ReadFile(filepath.Join(resolvedRoot, filepath.FromSlash(path)))
		if readErr != nil {
			staleSources = append(staleSources, path)
			continue
		}
		currentContent[path] = string(content)
		hash := sha256.Sum256(content)
		if recordedHash != "" && recordedHash != "sha256:"+hex.EncodeToString(hash[:]) {
			staleSources = append(staleSources, path)
		}
	}
	sort.Strings(staleSources)
	if len(staleSources) > 0 && !options.AllowStaleSources {
		return nil, fmt.Errorf("apply-extraction requires unchanged sources: %s drifted since extraction-input was generated; regenerate extraction-input and re-extract, or pass --allow-stale-sources to apply anyway with the drift recorded", strings.Join(staleSources, ", "))
	}
	staleSourceSet := map[string]bool{}
	for _, path := range staleSources {
		staleSourceSet[path] = true
	}

	bounds := asMap(inputPacket["bounds"])
	maxExcerptChars := intFromAny(bounds["maxExcerptChars"])
	if maxExcerptChars <= 0 {
		maxExcerptChars = defaultMaxExcerptChars
	}

	candidates := []any{}
	rejections := []claimExtractionRejection{}
	staleAnchors := []any{}
	seenFingerprints := map[string]bool{}
	seenIDs := map[string]int{}
	for _, rawClaim := range arrayOrEmpty(resultPacket["claims"]) {
		claim := asMap(rawClaim)
		summary := normalizeClaimSummary(stringFromAny(claim["summary"]))
		excerpts := arrayOrEmpty(claim["excerpts"])
		rejection := func(reason string, detail string, path string, line int) {
			rejections = append(rejections, claimExtractionRejection{
				reason:  reason,
				detail:  detail,
				summary: summary,
				path:    path,
				line:    line,
			})
		}

		var primary map[string]any
		primaryCount := 0
		rejected := false
		for _, rawExcerpt := range excerpts {
			excerpt := asMap(rawExcerpt)
			path := filepath.ToSlash(filepath.Clean(stringFromAny(excerpt["path"])))
			line := intFromAny(excerpt["line"])
			verbatim := stringFromAny(excerpt["verbatim"])
			if truthy(excerpt["primary"]) {
				primaryCount++
				primary = excerpt
			}
			if _, inScope := sourcesByPath[path]; !inScope {
				rejection("source-not-in-scope", fmt.Sprintf("excerpt path %s is not in the extraction-input source list", path), path, line)
				rejected = true
				break
			}
			if normalizeExcerptForAnchoring(verbatim) == "" {
				rejection("empty-excerpt", "excerpt is empty or whitespace-only after normalization", path, line)
				rejected = true
				break
			}
			if utf8.RuneCountInString(verbatim) > maxExcerptChars {
				rejection("excerpt-too-long", fmt.Sprintf("excerpt is %d runes; bounds.maxExcerptChars is %d", utf8.RuneCountInString(verbatim), maxExcerptChars), path, line)
				rejected = true
				break
			}
			content, haveContent := currentContent[path]
			if haveContent && !excerptAnchorsInContent(verbatim, content) {
				if staleSourceSet[path] {
					staleAnchors = append(staleAnchors, map[string]any{
						"path":    path,
						"line":    line,
						"excerpt": verbatim,
						"detail":  "excerpt no longer anchors against drifted current content; applied under --allow-stale-sources",
					})
					continue
				}
				rejection("unanchored", "excerpt is not a whitespace-normalized substring of the source content", path, line)
				rejected = true
				break
			}
			if !haveContent && !staleSourceSet[path] {
				rejection("unanchored", "source content is unreadable so the excerpt cannot anchor", path, line)
				rejected = true
				break
			}
		}
		if rejected {
			continue
		}
		if len(excerpts) == 0 || primaryCount != 1 {
			detail := "claim must mark exactly one excerpt primary: true"
			if len(excerpts) == 0 {
				detail = "claim carries no excerpts"
			} else if primaryCount > 1 {
				detail = fmt.Sprintf("claim marks %d excerpts primary; exactly one is required", primaryCount)
			}
			rejection("missing-primary", detail, "", 0)
			continue
		}
		primaryPath := filepath.ToSlash(filepath.Clean(stringFromAny(primary["path"])))
		primaryLine := intFromAny(primary["line"])
		fingerprint := claimFingerprint(stringFromAny(primary["verbatim"]))
		if seenFingerprints[fingerprint] {
			rejection("duplicate-fingerprint", "another claim already uses the same normalized primary excerpt; merge declaration sites into one claim with multiple excerpts", primaryPath, primaryLine)
			continue
		}
		seenFingerprints[fingerprint] = true
		candidates = append(candidates, renderExtractedClaimCandidate(claim, excerpts, primary, fingerprint, summary, seenIDs))
	}

	inventory := renderExtractionSourceInventory(sourceOrder, sourcesByPath)
	audit := map[string]any{
		"templateVersion":     stringFromAny(template["templateVersion"]),
		"templateHash":        templateHash,
		"anchoringPolicy":     claimExtractionAnchoringPolicy,
		"extractionTarget":    stringFromAny(inputPacket["extractionTarget"]),
		"bounds":              claimExtractionAppliedBounds(bounds, maxExcerptChars),
		"sourceCount":         len(sourceOrder),
		"submittedClaimCount": len(arrayOrEmpty(resultPacket["claims"])),
		"appliedClaimCount":   len(candidates),
		"rejectedClaimCount":  len(rejections),
		"rejectedClaims":      renderClaimExtractionRejections(rejections),
	}
	if len(staleSources) > 0 {
		audit["staleSources"] = stringArrayToAny(staleSources)
		audit["staleAnchors"] = staleAnchors
	}
	if runtimeInfo := asMap(resultPacket["runtime"]); len(runtimeInfo) > 0 {
		audit["runtime"] = runtimeInfo
	}
	if skipped := arrayOrEmpty(resultPacket["skippedSources"]); len(skipped) > 0 {
		audit["skippedSources"] = skipped
	}

	packet := map[string]any{
		"schemaVersion":      contracts.ClaimProofPlanSchema,
		"extractionMode":     "agent",
		"discoveryMode":      "agent-extraction",
		"sourceRoot":         ".",
		"gitCommit":          stringFromAny(inputPacket["gitCommit"]),
		"effectiveScanScope": asMap(inputPacket["effectiveScanScope"]),
		"sourceInventory":    inventory,
		"sourceGraph":        arrayOrEmpty(inputPacket["sourceGraph"]),
		"extractionAudit":    audit,
		"claimSummary":       summarizeClaimCandidates(candidates),
		"claimCandidates":    candidates,
		"candidateCount":     len(candidates),
		"sourceCount":        len(sourceOrder),
		"nextRecommended":    "Turn cautilus-eval candidates into host-owned eval fixtures; keep deterministic candidates in the repo's normal test or CI gates.",
		"nonVerdictNotice":   "Extraction creates candidates. An extracted claim is not verified until matching evidence is attached.",
	}
	if err := ValidateClaimProofPlan(packet); err != nil {
		return nil, err
	}
	return packet, nil
}

func claimExtractionAppliedBounds(bounds map[string]any, maxExcerptChars int) map[string]any {
	maxClaims := intFromAny(bounds["maxClaimsPerSource"])
	if maxClaims <= 0 {
		maxClaims = defaultMaxClaimsPerSource
	}
	return map[string]any{
		"maxClaimsPerSource": maxClaims,
		"maxExcerptChars":    maxExcerptChars,
	}
}

func renderExtractionSourceInventory(sourceOrder []string, sourcesByPath map[string]map[string]any) []any {
	inventory := make([]any, 0, len(sourceOrder))
	for _, path := range sourceOrder {
		source := sourcesByPath[path]
		entry := map[string]any{
			"path":                path,
			"kind":                stringFromAny(source["kind"]),
			"status":              "read",
			"depth":               intFromAny(source["depth"]),
			"claimAudience":       claimAudienceOrUnclear(stringFromAny(source["audienceHint"])),
			"claimAudienceSource": claimAudienceSourceOrUnknown(stringFromAny(source["audienceHintSource"])),
		}
		if discoveredFrom := stringFromAny(source["discoveredFrom"]); discoveredFrom != "" {
			entry["discoveredFrom"] = discoveredFrom
		}
		// The recorded hash is the content the agent extracted against; under
		// --allow-stale-sources this keeps validate on the stale-anchor branch
		// instead of hard-failing against drifted current content.
		if hash := stringFromAny(source["contentHash"]); hash != "" {
			entry["contentHash"] = hash
		} else {
			entry["status"] = "missing"
		}
		inventory = append(inventory, entry)
	}
	return inventory
}

func renderExtractedClaimCandidate(claim map[string]any, excerpts []any, primary map[string]any, fingerprint string, summary string, seenIDs map[string]int) map[string]any {
	primaryPath := filepath.ToSlash(filepath.Clean(stringFromAny(primary["path"])))
	primaryLine := intFromAny(primary["line"])
	recommendedProof := stringFromAny(claim["recommendedProof"])
	audience := claimAudienceOrUnclear(stringFromAny(claim["claimAudience"]))
	sourceRefs := make([]any, 0, len(excerpts))
	for _, rawExcerpt := range excerpts {
		excerpt := asMap(rawExcerpt)
		sourceRefs = append(sourceRefs, map[string]any{
			"path":    filepath.ToSlash(filepath.Clean(stringFromAny(excerpt["path"]))),
			"line":    intFromAny(excerpt["line"]),
			"excerpt": stringFromAny(excerpt["verbatim"]),
			"primary": truthy(excerpt["primary"]),
		})
	}
	groupHints := []string{"audience:" + audience, recommendedProof}
	entry := map[string]any{
		"claimId":               uniqueClaimID(primaryPath, primaryLine, seenIDs),
		"claimFingerprint":      fingerprint,
		"summary":               summary,
		"recommendedProof":      recommendedProof,
		"verificationReadiness": stringFromAny(claim["verificationReadiness"]),
		"evidenceStatus":        "unknown",
		"reviewStatus":          "agent-reviewed",
		"lifecycle":             "new",
		"claimAudience":         audience,
		"claimAudienceSource":   "extraction-result",
		"claimSemanticGroup":    claimSemanticGroupOrGeneral(stringFromAny(claim["claimSemanticGroup"])),
		"evidenceRefs":          []any{},
		"sourceRefs":            sourceRefs,
		"unresolvedQuestions":   arrayOrEmpty(claim["unresolvedQuestions"]),
		"whyThisLayer":          extractedClaimWhyThisLayer(recommendedProof),
		"nextAction":            extractedClaimNextAction(recommendedProof, stringFromAny(claim["recommendedEvalSurface"])),
	}
	if surface := stringFromAny(claim["recommendedEvalSurface"]); surface != "" && recommendedProof == "cautilus-eval" {
		entry["recommendedEvalSurface"] = surface
		groupHints = append(groupHints, surface)
	}
	sort.Strings(groupHints)
	entry["groupHints"] = stringArrayToAny(groupHints)
	return entry
}

func extractedClaimWhyThisLayer(recommendedProof string) string {
	switch recommendedProof {
	case "deterministic":
		return "The claim names a deterministic gate or static contract that should be protected outside Cautilus eval."
	case "cautilus-eval":
		return "The claim depends on model, agent, prompt, skill, workflow, or behavior execution evidence."
	default:
		return "The claim can be checked by reading current source, docs, or generated artifacts."
	}
}

func extractedClaimNextAction(recommendedProof string, surface string) string {
	switch recommendedProof {
	case "deterministic":
		return "Keep or add a repo-owned unit, lint, build, schema, or CI check for this claim."
	case "cautilus-eval":
		if strings.TrimSpace(surface) == "" {
			surface = "dev/repo"
		}
		return fmt.Sprintf("Create a host-owned %s fixture and run it through cautilus evaluate fixture.", surface)
	default:
		return "Record the source reference and keep it human-auditable; add deterministic or eval proof only if behavior depends on execution."
	}
}

func renderClaimExtractionRejections(rejections []claimExtractionRejection) []any {
	rendered := make([]any, 0, len(rejections))
	for index, rejection := range rejections {
		if index >= claimExtractionMaxRejectedClaimEntries {
			break
		}
		entry := map[string]any{
			"reason": rejection.reason,
			"detail": rejection.detail,
		}
		if rejection.summary != "" {
			entry["summary"] = rejection.summary
		}
		if rejection.path != "" {
			entry["path"] = rejection.path
		}
		if rejection.line > 0 {
			entry["line"] = rejection.line
		}
		rendered = append(rendered, entry)
	}
	return rendered
}

func validateClaimExtractionResult(result map[string]any) error {
	if result["schemaVersion"] != contracts.ClaimExtractionResultSchema {
		return fmt.Errorf("result schemaVersion must be %s", contracts.ClaimExtractionResultSchema)
	}
	inputRef := asMap(result["extractionInputRef"])
	if _, err := normalizeNonEmptyString(inputRef["templateHash"], "extractionInputRef.templateHash"); err != nil {
		return err
	}
	claims, err := assertArray(result["claims"], "claims")
	if err != nil {
		return err
	}
	for index, rawClaim := range claims {
		claim, ok := rawClaim.(map[string]any)
		if !ok {
			return fmt.Errorf("claims[%d] must be an object", index)
		}
		field := fmt.Sprintf("claims[%d]", index)
		if _, err := normalizeNonEmptyString(claim["summary"], field+".summary"); err != nil {
			return err
		}
		recommendedProof, err := normalizeNonEmptyString(claim["recommendedProof"], field+".recommendedProof")
		if err != nil {
			return err
		}
		if !validRecommendedProof(recommendedProof) {
			return fmt.Errorf("%s.recommendedProof %q is unsupported", field, recommendedProof)
		}
		readiness, err := normalizeNonEmptyString(claim["verificationReadiness"], field+".verificationReadiness")
		if err != nil {
			return err
		}
		if !validVerificationReadiness(readiness) {
			return fmt.Errorf("%s.verificationReadiness %q is unsupported", field, readiness)
		}
		if surface := strings.TrimSpace(stringFromAny(claim["recommendedEvalSurface"])); surface != "" && !validEvalSurface(surface) {
			return fmt.Errorf("%s.recommendedEvalSurface %q is unsupported", field, surface)
		}
		if audience := strings.TrimSpace(stringFromAny(claim["claimAudience"])); audience != "" && !validClaimAudience(audience) {
			return fmt.Errorf("%s.claimAudience %q is unsupported", field, audience)
		}
		if _, ok := claim["unresolvedQuestions"]; ok {
			if _, err := assertArray(claim["unresolvedQuestions"], field+".unresolvedQuestions"); err != nil {
				return err
			}
		}
		excerpts, err := assertArray(claim["excerpts"], field+".excerpts")
		if err != nil {
			return err
		}
		for excerptIndex, rawExcerpt := range excerpts {
			excerpt, ok := rawExcerpt.(map[string]any)
			if !ok {
				return fmt.Errorf("%s.excerpts[%d] must be an object", field, excerptIndex)
			}
			excerptField := fmt.Sprintf("%s.excerpts[%d]", field, excerptIndex)
			if _, err := normalizeNonEmptyString(excerpt["path"], excerptField+".path"); err != nil {
				return err
			}
			if intFromAny(excerpt["line"]) <= 0 {
				return fmt.Errorf("%s.line must be a positive line locator", excerptField)
			}
			if _, ok := excerpt["verbatim"]; !ok {
				return fmt.Errorf("%s.verbatim must exist", excerptField)
			}
		}
	}
	return nil
}

// claimExtractionAnchorReport re-audits anchoring for applied agent packets.
// When a referenced source is readable and its content hash matches the recorded
// hash, every excerpt must anchor: a failure is a hard validation issue because
// a correctly applied packet can never contain one. When the content hash
// differs, anchoring mismatches are stale-anchor findings that do not fail
// validation; resolving them is refresh work, not a packet-shape defect.
func claimExtractionAnchorReport(packet map[string]any, repoRoot string) ([]any, []any) {
	issues := []any{}
	findings := []any{}
	if ClaimPacketExtractionMode(packet) != "agent" || strings.TrimSpace(repoRoot) == "" {
		return issues, findings
	}
	recordedHashes := map[string]string{}
	for _, raw := range arrayOrEmpty(packet["sourceInventory"]) {
		entry := asMap(raw)
		path := filepath.ToSlash(filepath.Clean(stringFromAny(entry["path"])))
		if path != "" && path != "." {
			recordedHashes[path] = strings.TrimSpace(stringFromAny(entry["contentHash"]))
		}
	}
	type sourceState struct {
		content   string
		readable  bool
		hashMatch bool
	}
	states := map[string]sourceState{}
	stateFor := func(path string) sourceState {
		if state, ok := states[path]; ok {
			return state
		}
		state := sourceState{}
		content, err := os.ReadFile(filepath.Join(repoRoot, filepath.FromSlash(path)))
		if err == nil {
			state.readable = true
			state.content = string(content)
			hash := sha256.Sum256(content)
			state.hashMatch = recordedHashes[path] == "sha256:"+hex.EncodeToString(hash[:])
		}
		states[path] = state
		return state
	}
	for index, rawCandidate := range arrayOrEmpty(packet["claimCandidates"]) {
		candidate := asMap(rawCandidate)
		for refIndex, rawRef := range arrayOrEmpty(candidate["sourceRefs"]) {
			ref := asMap(rawRef)
			path := filepath.ToSlash(filepath.Clean(stringFromAny(ref["path"])))
			excerpt := stringFromAny(ref["excerpt"])
			refPath := fmt.Sprintf("$.claimCandidates[%d].sourceRefs[%d]", index, refIndex)
			if path == "" || path == "." {
				continue
			}
			state := stateFor(path)
			if !state.readable {
				findings = append(findings, map[string]any{
					"severity":   "warning",
					"kind":       "unreadable-source",
					"path":       refPath,
					"sourcePath": path,
					"message":    "source file is unreadable from the validation repo root, so anchoring cannot be re-audited",
				})
				continue
			}
			if excerptAnchorsInContent(excerpt, state.content) {
				continue
			}
			if state.hashMatch {
				issues = append(issues, claimValidationIssue(refPath+".excerpt", "excerpt does not anchor although the source content matches the recorded hash; a correctly applied agent packet can never contain an unanchored excerpt"))
				continue
			}
			findings = append(findings, map[string]any{
				"severity":   "warning",
				"kind":       "stale-anchor",
				"path":       refPath,
				"sourcePath": path,
				"message":    "source content drifted from the recorded hash and the excerpt no longer anchors; resolve through refresh, not packet repair",
			})
		}
	}
	return issues, findings
}

// ClaimPacketExtractionMode reads the packet's extraction mode; a packet without
// the field reads as heuristic for backward compatibility.
func ClaimPacketExtractionMode(packet map[string]any) string {
	mode := strings.TrimSpace(stringFromAny(packet["extractionMode"]))
	if mode == "" {
		return "heuristic"
	}
	return mode
}
