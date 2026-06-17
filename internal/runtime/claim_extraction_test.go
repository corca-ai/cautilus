package runtime

import (
	"fmt"
	"path/filepath"
	"strings"
	"testing"

	"github.com/corca-ai/cautilus/internal/contracts"
)

const extractionTestPromise = "Users can run deterministic checks before review."

func writeExtractionTestRepo(t *testing.T) string {
	t.Helper()
	repoRoot := t.TempDir()
	mustWriteFile(t, filepath.Join(repoRoot, "README.md"), strings.Join([]string{
		"# Demo",
		"",
		extractionTestPromise,
		"The workflow should show scan scope before spending review budget.",
		"",
	}, "\n"))
	mustWriteFile(t, filepath.Join(repoRoot, "AGENTS.md"), strings.Join([]string{
		"# AGENTS",
		"",
		"Agents must follow the repo operating contract before changing code.",
		"",
	}, "\n"))
	return repoRoot
}

func buildExtractionInput(t *testing.T, repoRoot string, options ClaimExtractionInputOptions) map[string]any {
	t.Helper()
	options.RepoRoot = repoRoot
	input, err := BuildClaimExtractionInput(options)
	if err != nil {
		t.Fatalf("BuildClaimExtractionInput returned error: %v", err)
	}
	return input
}

func extractionResultFor(input map[string]any, claims []any) map[string]any {
	return map[string]any{
		"schemaVersion": contracts.ClaimExtractionResultSchema,
		"extractionInputRef": map[string]any{
			"path":         "extraction-input.json",
			"templateHash": asMap(input["template"])["templateHash"],
		},
		"runtime": map[string]any{"agent": "cautilus-agent"},
		"claims":  claims,
	}
}

func extractionClaim(summary string, excerpts ...map[string]any) map[string]any {
	rendered := make([]any, 0, len(excerpts))
	for _, excerpt := range excerpts {
		rendered = append(rendered, excerpt)
	}
	return map[string]any{
		"summary":               summary,
		"excerpts":              rendered,
		"recommendedProof":      "deterministic",
		"verificationReadiness": "ready-for-proof",
		"claimAudience":         "user",
	}
}

func TestBuildClaimExtractionInputEmitsTemplateSourcesAndBounds(t *testing.T) {
	repoRoot := writeExtractionTestRepo(t)
	input := buildExtractionInput(t, repoRoot, ClaimExtractionInputOptions{})
	if input["schemaVersion"] != contracts.ClaimExtractionInputSchema {
		t.Fatalf("unexpected schemaVersion: %#v", input["schemaVersion"])
	}
	if input["extractionTarget"] != "first-extraction" {
		t.Fatalf("expected first-extraction target, got %#v", input["extractionTarget"])
	}
	if input["outputSchema"] != contracts.ClaimExtractionResultSchema {
		t.Fatalf("unexpected outputSchema: %#v", input["outputSchema"])
	}
	sources := arrayOrEmpty(input["sources"])
	if len(sources) != 2 {
		t.Fatalf("expected README.md and AGENTS.md sources, got %#v", sources)
	}
	for _, raw := range sources {
		entry := asMap(raw)
		if stringFromAny(entry["status"]) != "extract" {
			t.Fatalf("expected extract status, got %#v", entry)
		}
		if !strings.HasPrefix(stringFromAny(entry["contentHash"]), "sha256:") {
			t.Fatalf("source missing contentHash: %#v", entry)
		}
	}
	template := asMap(input["template"])
	for _, field := range []string{"claimDefinition", "excerptRules", "routingGuidance", "uncertaintyRule"} {
		if stringFromAny(template[field]) == "" {
			t.Fatalf("template missing %s: %#v", field, template)
		}
	}
	if len(asMap(template["nonClaimConventions"])) == 0 {
		t.Fatalf("template missing nonClaimConventions: %#v", template)
	}
	if template["templateVersion"] != claimExtractionTemplateVersion {
		t.Fatalf("unexpected templateVersion: %#v", template["templateVersion"])
	}
	if template["templateHash"] != claimExtractionTemplateHash(template) {
		t.Fatalf("templateHash does not match canonical recomputation: %#v", template["templateHash"])
	}
	bounds := asMap(input["bounds"])
	if intFromAny(bounds["maxClaimsPerSource"]) != defaultMaxClaimsPerSource || intFromAny(bounds["maxExcerptChars"]) != defaultMaxExcerptChars {
		t.Fatalf("unexpected default bounds: %#v", bounds)
	}
}

func TestBuildClaimExtractionInputMergesAdapterNonClaimHeadingsIntoTemplate(t *testing.T) {
	repoRoot := writeExtractionTestRepo(t)
	adapterPath := filepath.Join(repoRoot, "proposed-adapter.yaml")
	mustWriteFile(t, adapterPath, strings.Join([]string{
		"version: 1",
		"repo: demo",
		"claim_discovery:",
		"  classification_hints:",
		"    non_claim_section_headings:",
		"      - Rejected Alternatives",
		"",
	}, "\n"))
	input := buildExtractionInput(t, repoRoot, ClaimExtractionInputOptions{AdapterPath: adapterPath})
	headings := arrayOrEmpty(asMap(asMap(input["template"])["nonClaimConventions"])["nonClaimSectionHeadings"])
	joined := []string{}
	for _, raw := range headings {
		joined = append(joined, stringFromAny(raw))
	}
	if !claimStringListContains(joined, "Rejected Alternatives") || !claimStringListContains(joined, "Deferred Decisions") {
		t.Fatalf("expected adapter heading merged with portable defaults, got %#v", joined)
	}
	withoutAdapter := buildExtractionInput(t, repoRoot, ClaimExtractionInputOptions{})
	if asMap(withoutAdapter["template"])["templateHash"] == asMap(input["template"])["templateHash"] {
		t.Fatalf("templateHash must change when merged conventions change")
	}
}

func TestApplyClaimExtractionResultAppliesAnchoredClaims(t *testing.T) {
	repoRoot := writeExtractionTestRepo(t)
	input := buildExtractionInput(t, repoRoot, ClaimExtractionInputOptions{})
	result := extractionResultFor(input, []any{
		extractionClaim("Deterministic checks run before review.",
			map[string]any{"path": "README.md", "line": 3, "verbatim": extractionTestPromise, "primary": true},
		),
	})
	packet, err := ApplyClaimExtractionResult(input, result, ClaimExtractionApplyOptions{RepoRoot: repoRoot})
	if err != nil {
		t.Fatalf("ApplyClaimExtractionResult returned error: %v", err)
	}
	if packet["extractionMode"] != "agent" {
		t.Fatalf("expected extractionMode agent, got %#v", packet["extractionMode"])
	}
	candidates := arrayOrEmpty(packet["claimCandidates"])
	if len(candidates) != 1 {
		t.Fatalf("expected one applied claim, got %#v", candidates)
	}
	claim := asMap(candidates[0])
	if claim["reviewStatus"] != "agent-reviewed" || claim["evidenceStatus"] != "unknown" || claim["lifecycle"] != "new" {
		t.Fatalf("unexpected claim state: %#v", claim)
	}
	if claim["claimFingerprint"] != claimFingerprint(extractionTestPromise) {
		t.Fatalf("fingerprint must be sha256 of normalized primary verbatim excerpt, got %#v", claim["claimFingerprint"])
	}
	refs := arrayOrEmpty(claim["sourceRefs"])
	if len(refs) != 1 {
		t.Fatalf("expected one source ref, got %#v", refs)
	}
	ref := asMap(refs[0])
	if ref["path"] != "README.md" || intFromAny(ref["line"]) != 3 || ref["excerpt"] != extractionTestPromise || ref["primary"] != true {
		t.Fatalf("unexpected source ref persistence: %#v", ref)
	}
	audit := asMap(packet["extractionAudit"])
	if audit["templateHash"] != asMap(input["template"])["templateHash"] {
		t.Fatalf("template provenance must survive the round trip: %#v", audit)
	}
	if intFromAny(audit["rejectedClaimCount"]) != 0 || intFromAny(audit["appliedClaimCount"]) != 1 {
		t.Fatalf("unexpected audit counts: %#v", audit)
	}
	report := BuildClaimValidationReport(packet, ClaimValidationOptions{InputPath: "claims-agent.json", RepoRoot: repoRoot})
	if report["valid"] != true {
		t.Fatalf("first-extraction agent packet (extractionAudit present, no carryForward) must validate, got %#v", report["issues"])
	}
}

func TestBuildClaimExtractionInputTemplateV2EmitsEpicFacetsAndRecallPrompts(t *testing.T) {
	repoRoot := writeExtractionTestRepo(t)
	input := buildExtractionInput(t, repoRoot, ClaimExtractionInputOptions{})
	template := asMap(input["template"])
	if template["templateVersion"] != "v2" {
		t.Fatalf("expected template v2, got %#v", template["templateVersion"])
	}
	if stringFromAny(template["epicGuidance"]) == "" {
		t.Fatalf("template must carry epicGuidance: %#v", template)
	}
	if _, ok := template["epicCatalog"]; !ok {
		t.Fatalf("template must carry an epicCatalog field even when empty")
	}
	if len(arrayOrEmpty(template["epicCatalog"])) != 0 {
		t.Fatalf("epicCatalog must be empty when no adapter catalog is declared, got %#v", template["epicCatalog"])
	}
	// Recall blind-spot prompts: design-principle + negative/scope-boundary shapes.
	def := stringFromAny(template["claimDefinition"])
	for _, want := range []string{"first-class", "not for", "deliberately will not do"} {
		if !strings.Contains(def, want) {
			t.Fatalf("claimDefinition must prompt for the %q claim shape, got %q", want, def)
		}
	}
	// Enabler-based routing (R12) names both measured failure modes.
	routing := stringFromAny(template["routingGuidance"])
	if !strings.Contains(routing, "enabler") || !strings.Contains(routing, "schema check does not prove") {
		t.Fatalf("routingGuidance must carry the enabler rubric and the schema-check caveat, got %q", routing)
	}
}

func TestBuildClaimExtractionInputRendersAdapterEpicCatalog(t *testing.T) {
	repoRoot := writeExtractionTestRepo(t)
	adapterPath := filepath.Join(repoRoot, "proposed-adapter.yaml")
	mustWriteFile(t, adapterPath, strings.Join([]string{
		"version: 1",
		"repo: demo",
		"claim_discovery:",
		"  epic_catalog:",
		"    - epicId: D1-discovery",
		"      branch: Discover",
		"      title: Claim discovery turns docs into proof-plan candidates",
		"      userStory: As a maintainer, I want discovery to produce source-ref-backed candidates.",
		"    - epicId: E1-evaluate",
		"      branch: Eval",
		"      title: evaluate runs checked-in inputs through adapter-owned runners",
		"",
	}, "\n"))
	input := buildExtractionInput(t, repoRoot, ClaimExtractionInputOptions{AdapterPath: adapterPath})
	catalog := arrayOrEmpty(asMap(input["template"])["epicCatalog"])
	if len(catalog) != 2 {
		t.Fatalf("expected two catalog epics rendered into the template, got %#v", catalog)
	}
	first := asMap(catalog[0])
	if first["epicId"] != "D1-discovery" || first["branch"] != "Discover" || stringFromAny(first["title"]) == "" {
		t.Fatalf("unexpected first epic rendering: %#v", first)
	}
	if stringFromAny(first["userStory"]) == "" {
		t.Fatalf("epic userStory must render when declared: %#v", first)
	}
	if _, ok := asMap(catalog[1])["userStory"]; ok {
		t.Fatalf("epic without userStory must omit the field: %#v", catalog[1])
	}
	// A declared epic catalog changes the template hash, like merged conventions.
	withoutAdapter := buildExtractionInput(t, repoRoot, ClaimExtractionInputOptions{})
	if asMap(withoutAdapter["template"])["templateHash"] == asMap(input["template"])["templateHash"] {
		t.Fatalf("templateHash must change when the epic catalog changes")
	}
}

func TestBuildClaimExtractionInputRendersAdapterEpicCatalogWithExplicitSources(t *testing.T) {
	repoRoot := writeExtractionTestRepo(t)
	adapterPath := filepath.Join(repoRoot, "proposed-adapter.yaml")
	mustWriteFile(t, adapterPath, strings.Join([]string{
		"version: 1",
		"repo: demo",
		"claim_discovery:",
		"  epic_catalog:",
		"    - epicId: D1-discovery",
		"      branch: Discover",
		"      title: Claim discovery turns docs into proof-plan candidates",
		"",
	}, "\n"))
	// Explicit --source scoping must not discard adapter-owned classification
	// config: the epic catalog still reaches the packet and the adapter is
	// reported found, while the scanned source list is exactly the explicit
	// file. This is the read-only corpus-measurement path the command advertises.
	input := buildExtractionInput(t, repoRoot, ClaimExtractionInputOptions{
		AdapterPath: adapterPath,
		SourcePaths: []string{"README.md"},
	})
	catalog := arrayOrEmpty(asMap(input["template"])["epicCatalog"])
	if len(catalog) != 1 || asMap(catalog[0])["epicId"] != "D1-discovery" {
		t.Fatalf("explicit --source must still render the adapter epic catalog, got %#v", catalog)
	}
	scope := asMap(input["effectiveScanScope"])
	if scope["adapterFound"] != true {
		t.Fatalf("adapter must be reported found on the explicit-source path, got %#v", scope["adapterFound"])
	}
	sources := arrayOrEmpty(input["sources"])
	if len(sources) != 1 || asMap(sources[0])["path"] != "README.md" {
		t.Fatalf("explicit --source must scope the scanned sources to the explicit file, got %#v", sources)
	}
}

func TestApplyClaimExtractionResultRecordsUnknownEpicsWithoutRejecting(t *testing.T) {
	repoRoot := writeExtractionTestRepo(t)
	adapterPath := filepath.Join(repoRoot, "proposed-adapter.yaml")
	mustWriteFile(t, adapterPath, strings.Join([]string{
		"version: 1",
		"repo: demo",
		"claim_discovery:",
		"  epic_catalog:",
		"    - epicId: D1-discovery",
		"      branch: Discover",
		"      title: Claim discovery turns docs into proof-plan candidates",
		"",
	}, "\n"))
	input := buildExtractionInput(t, repoRoot, ClaimExtractionInputOptions{AdapterPath: adapterPath})
	claim := extractionClaim("unknown epic", map[string]any{"path": "README.md", "line": 3, "verbatim": extractionTestPromise, "primary": true})
	claim["primaryEpic"] = "Z9-bogus"
	claim["supportingEpics"] = []any{"Z9-bogus", "D1-discovery"}
	claim["edgeRationale"] = "Spans a real and a bogus epic."
	packet, err := ApplyClaimExtractionResult(input, extractionResultFor(input, []any{claim}), ClaimExtractionApplyOptions{RepoRoot: repoRoot})
	if err != nil {
		t.Fatalf("unknown epic must not fail the command: %v", err)
	}
	// Claim is kept, with its facets intact.
	candidates := arrayOrEmpty(packet["claimCandidates"])
	if len(candidates) != 1 {
		t.Fatalf("unknown epic must not drop the claim, got %#v", candidates)
	}
	// The mismatch is recorded for review, naming only the unmapped id.
	audit := asMap(packet["extractionAudit"])
	findings := arrayOrEmpty(audit["epicCatalogFindings"])
	if len(findings) != 1 {
		t.Fatalf("expected one epic-catalog finding, got %#v", audit["epicCatalogFindings"])
	}
	unknown := []string{}
	for _, raw := range arrayOrEmpty(asMap(findings[0])["unknownEpics"]) {
		unknown = append(unknown, stringFromAny(raw))
	}
	if len(unknown) != 1 || unknown[0] != "Z9-bogus" {
		t.Fatalf("finding must name only the unmapped epic id, got %#v", unknown)
	}
}

func TestApplyClaimExtractionResultRecordsNoFindingWhenEpicsInCatalog(t *testing.T) {
	repoRoot := writeExtractionTestRepo(t)
	adapterPath := filepath.Join(repoRoot, "proposed-adapter.yaml")
	mustWriteFile(t, adapterPath, strings.Join([]string{
		"version: 1",
		"repo: demo",
		"claim_discovery:",
		"  epic_catalog:",
		"    - epicId: D1-discovery",
		"      branch: Discover",
		"      title: Claim discovery turns docs into proof-plan candidates",
		"",
	}, "\n"))
	input := buildExtractionInput(t, repoRoot, ClaimExtractionInputOptions{AdapterPath: adapterPath})
	claim := extractionClaim("known epic", map[string]any{"path": "README.md", "line": 3, "verbatim": extractionTestPromise, "primary": true})
	claim["primaryEpic"] = "D1-discovery"
	claim["supportingEpics"] = []any{"D1-discovery"}
	packet, err := ApplyClaimExtractionResult(input, extractionResultFor(input, []any{claim}), ClaimExtractionApplyOptions{RepoRoot: repoRoot})
	if err != nil {
		t.Fatalf("ApplyClaimExtractionResult returned error: %v", err)
	}
	if _, ok := asMap(packet["extractionAudit"])["epicCatalogFindings"]; ok {
		t.Fatalf("in-catalog epics must record no finding")
	}
}

func TestApplyClaimExtractionResultCarriesEpicFacets(t *testing.T) {
	repoRoot := writeExtractionTestRepo(t)
	input := buildExtractionInput(t, repoRoot, ClaimExtractionInputOptions{})
	claim := extractionClaim("epic facets", map[string]any{"path": "README.md", "line": 3, "verbatim": extractionTestPromise, "primary": true})
	claim["primaryEpic"] = "D1-discovery"
	// primary missing from the front of supportingEpics, plus a duplicate.
	claim["supportingEpics"] = []any{"E1-evaluate", "D1-discovery", "E1-evaluate"}
	claim["edgeRationale"] = "Discovery output feeds the eval surface."
	result := extractionResultFor(input, []any{claim})
	packet, err := ApplyClaimExtractionResult(input, result, ClaimExtractionApplyOptions{RepoRoot: repoRoot})
	if err != nil {
		t.Fatalf("ApplyClaimExtractionResult returned error: %v", err)
	}
	applied := asMap(arrayOrEmpty(packet["claimCandidates"])[0])
	if applied["primaryEpic"] != "D1-discovery" {
		t.Fatalf("primaryEpic must persist, got %#v", applied["primaryEpic"])
	}
	supporting := []string{}
	for _, raw := range arrayOrEmpty(applied["supportingEpics"]) {
		supporting = append(supporting, stringFromAny(raw))
	}
	if len(supporting) != 2 || supporting[0] != "D1-discovery" || supporting[1] != "E1-evaluate" {
		t.Fatalf("supportingEpics must dedupe and lead with primaryEpic, got %#v", supporting)
	}
	if applied["multiEpic"] != true {
		t.Fatalf("multiEpic must be true for >1 supporting epic, got %#v", applied["multiEpic"])
	}
	if applied["edgeRationale"] != "Discovery output feeds the eval surface." {
		t.Fatalf("edgeRationale must persist for multi-epic claims, got %#v", applied["edgeRationale"])
	}
}

func TestApplyClaimExtractionResultOmitsEpicFacetsWhenAbsent(t *testing.T) {
	repoRoot := writeExtractionTestRepo(t)
	input := buildExtractionInput(t, repoRoot, ClaimExtractionInputOptions{})
	result := extractionResultFor(input, []any{
		extractionClaim("no epics", map[string]any{"path": "README.md", "line": 3, "verbatim": extractionTestPromise, "primary": true}),
	})
	packet, err := ApplyClaimExtractionResult(input, result, ClaimExtractionApplyOptions{RepoRoot: repoRoot})
	if err != nil {
		t.Fatalf("ApplyClaimExtractionResult returned error: %v", err)
	}
	applied := asMap(arrayOrEmpty(packet["claimCandidates"])[0])
	if _, ok := applied["primaryEpic"]; ok {
		t.Fatalf("primaryEpic must be omitted when the agent emits none, got %#v", applied["primaryEpic"])
	}
	if _, ok := applied["supportingEpics"]; ok {
		t.Fatalf("supportingEpics must be omitted when the agent emits none")
	}
	if _, ok := applied["multiEpic"]; ok {
		t.Fatalf("multiEpic must be omitted when the agent emits no epics")
	}
	// claimSemanticGroup stays the catalog-less fallback grouping.
	if stringFromAny(applied["claimSemanticGroup"]) == "" {
		t.Fatalf("claimSemanticGroup fallback must remain, got %#v", applied)
	}
}

func TestValidateClaimExtractionResultRejectsMalformedEpicFacets(t *testing.T) {
	repoRoot := writeExtractionTestRepo(t)
	input := buildExtractionInput(t, repoRoot, ClaimExtractionInputOptions{})
	base := func() map[string]any {
		return extractionClaim("epics", map[string]any{"path": "README.md", "line": 3, "verbatim": extractionTestPromise, "primary": true})
	}
	emptyPrimary := base()
	emptyPrimary["primaryEpic"] = "   "
	if _, err := ApplyClaimExtractionResult(input, extractionResultFor(input, []any{emptyPrimary}), ClaimExtractionApplyOptions{RepoRoot: repoRoot}); err == nil || !strings.Contains(err.Error(), "primaryEpic") {
		t.Fatalf("expected primaryEpic emptiness failure, got %v", err)
	}
	emptyEntry := base()
	emptyEntry["supportingEpics"] = []any{"D1-discovery", ""}
	if _, err := ApplyClaimExtractionResult(input, extractionResultFor(input, []any{emptyEntry}), ClaimExtractionApplyOptions{RepoRoot: repoRoot}); err == nil || !strings.Contains(err.Error(), "supportingEpics") {
		t.Fatalf("expected supportingEpics empty-entry failure, got %v", err)
	}
}

func TestApplyClaimExtractionResultRejectsByReason(t *testing.T) {
	repoRoot := writeExtractionTestRepo(t)
	input := buildExtractionInput(t, repoRoot, ClaimExtractionInputOptions{MaxExcerptChars: 60})
	anchored := func(primary bool) map[string]any {
		return map[string]any{"path": "README.md", "line": 3, "verbatim": extractionTestPromise, "primary": primary}
	}
	cases := []struct {
		name   string
		claim  map[string]any
		reason string
	}{
		{
			name:   "fabricated excerpt rejects as unanchored",
			claim:  extractionClaim("fabricated", map[string]any{"path": "README.md", "line": 3, "verbatim": "Users can run fabricated checks.", "primary": true}),
			reason: "unanchored",
		},
		{
			name:   "wrong-path excerpt rejects as unanchored",
			claim:  extractionClaim("wrong path", map[string]any{"path": "AGENTS.md", "line": 3, "verbatim": extractionTestPromise, "primary": true}),
			reason: "unanchored",
		},
		{
			name:   "out-of-scope path rejects",
			claim:  extractionClaim("out of scope", map[string]any{"path": "docs/unknown.md", "line": 3, "verbatim": extractionTestPromise, "primary": true}),
			reason: "source-not-in-scope",
		},
		{
			name:   "missing primary rejects",
			claim:  extractionClaim("no primary", anchored(false)),
			reason: "missing-primary",
		},
		{
			name: "multiple primaries reject",
			claim: extractionClaim("two primaries",
				anchored(true),
				map[string]any{"path": "README.md", "line": 4, "verbatim": "show scan scope before spending review budget.", "primary": true},
			),
			reason: "missing-primary",
		},
		{
			name:   "empty excerpt rejects",
			claim:  extractionClaim("empty", map[string]any{"path": "README.md", "line": 3, "verbatim": "   \n\t", "primary": true}),
			reason: "empty-excerpt",
		},
		{
			name:   "over-long excerpt rejects",
			claim:  extractionClaim("too long", map[string]any{"path": "README.md", "line": 3, "verbatim": extractionTestPromise + " " + strings.Repeat("x", 60), "primary": true}),
			reason: "excerpt-too-long",
		},
	}
	for _, tc := range cases {
		t.Run(tc.name, func(t *testing.T) {
			result := extractionResultFor(input, []any{tc.claim})
			packet, err := ApplyClaimExtractionResult(input, result, ClaimExtractionApplyOptions{RepoRoot: repoRoot})
			if err != nil {
				t.Fatalf("claim-level rejection must not fail the command: %v", err)
			}
			if count := len(arrayOrEmpty(packet["claimCandidates"])); count != 0 {
				t.Fatalf("rejected claim must not appear in claimCandidates, got %d", count)
			}
			audit := asMap(packet["extractionAudit"])
			rejected := arrayOrEmpty(audit["rejectedClaims"])
			if intFromAny(audit["rejectedClaimCount"]) != 1 || len(rejected) != 1 {
				t.Fatalf("expected one recorded rejection, got %#v", audit)
			}
			if reason := stringFromAny(asMap(rejected[0])["reason"]); reason != tc.reason {
				t.Fatalf("expected reason %s, got %s (%#v)", tc.reason, reason, rejected[0])
			}
		})
	}
}

func TestApplyClaimExtractionResultAnchorsAcrossWhitespaceSegmentationDrift(t *testing.T) {
	repoRoot := writeExtractionTestRepo(t)
	input := buildExtractionInput(t, repoRoot, ClaimExtractionInputOptions{})
	drifted := "Users can run deterministic checks\n   before review. The workflow should show scan scope"
	result := extractionResultFor(input, []any{
		extractionClaim("segmentation drift", map[string]any{"path": "README.md", "line": 3, "verbatim": drifted, "primary": true}),
	})
	packet, err := ApplyClaimExtractionResult(input, result, ClaimExtractionApplyOptions{RepoRoot: repoRoot})
	if err != nil {
		t.Fatalf("ApplyClaimExtractionResult returned error: %v", err)
	}
	if len(arrayOrEmpty(packet["claimCandidates"])) != 1 {
		t.Fatalf("whitespace-segmentation drift must still anchor, got %#v", asMap(packet["extractionAudit"])["rejectedClaims"])
	}
}

func TestApplyClaimExtractionResultRejectsDuplicatePrimaryFingerprints(t *testing.T) {
	repoRoot := writeExtractionTestRepo(t)
	input := buildExtractionInput(t, repoRoot, ClaimExtractionInputOptions{})
	excerpt := map[string]any{"path": "README.md", "line": 3, "verbatim": extractionTestPromise, "primary": true}
	result := extractionResultFor(input, []any{
		extractionClaim("first wording", excerpt),
		extractionClaim("second wording", excerpt),
	})
	packet, err := ApplyClaimExtractionResult(input, result, ClaimExtractionApplyOptions{RepoRoot: repoRoot})
	if err != nil {
		t.Fatalf("ApplyClaimExtractionResult returned error: %v", err)
	}
	if len(arrayOrEmpty(packet["claimCandidates"])) != 1 {
		t.Fatalf("expected first claim kept, got %#v", packet["claimCandidates"])
	}
	audit := asMap(packet["extractionAudit"])
	if stringFromAny(asMap(arrayOrEmpty(audit["rejectedClaims"])[0])["reason"]) != "duplicate-fingerprint" {
		t.Fatalf("expected duplicate-fingerprint rejection, got %#v", audit["rejectedClaims"])
	}
}

func TestApplyClaimExtractionResultFailsOnSourceDriftWithoutAllowStaleSources(t *testing.T) {
	repoRoot := writeExtractionTestRepo(t)
	input := buildExtractionInput(t, repoRoot, ClaimExtractionInputOptions{})
	mustWriteFile(t, filepath.Join(repoRoot, "README.md"), "# Demo\n\nA completely different promise now.\n")
	result := extractionResultFor(input, []any{
		extractionClaim("drifted", map[string]any{"path": "README.md", "line": 3, "verbatim": extractionTestPromise, "primary": true}),
	})
	if _, err := ApplyClaimExtractionResult(input, result, ClaimExtractionApplyOptions{RepoRoot: repoRoot}); err == nil || !strings.Contains(err.Error(), "--allow-stale-sources") {
		t.Fatalf("expected stale-source failure naming --allow-stale-sources, got %v", err)
	}
	packet, err := ApplyClaimExtractionResult(input, result, ClaimExtractionApplyOptions{RepoRoot: repoRoot, AllowStaleSources: true})
	if err != nil {
		t.Fatalf("--allow-stale-sources must apply with drift recorded: %v", err)
	}
	audit := asMap(packet["extractionAudit"])
	staleSources := arrayOrEmpty(audit["staleSources"])
	if len(staleSources) != 1 || stringFromAny(staleSources[0]) != "README.md" {
		t.Fatalf("expected README.md recorded as stale, got %#v", audit)
	}
	if len(arrayOrEmpty(audit["staleAnchors"])) != 1 {
		t.Fatalf("expected stale anchor recorded for drifted excerpt, got %#v", audit)
	}
	if len(arrayOrEmpty(packet["claimCandidates"])) != 1 {
		t.Fatalf("stale-allowed claim must still apply, got %#v", packet["claimCandidates"])
	}
	for _, raw := range arrayOrEmpty(packet["sourceInventory"]) {
		entry := asMap(raw)
		if stringFromAny(entry["path"]) == "README.md" {
			recorded := stringFromAny(asMap(arrayOrEmpty(input["sources"])[indexOfSource(input, "README.md")])["contentHash"])
			if stringFromAny(entry["contentHash"]) != recorded {
				t.Fatalf("inventory must keep the extraction-time hash so validate stays on the stale-anchor branch")
			}
		}
	}
	report := BuildClaimValidationReport(packet, ClaimValidationOptions{InputPath: "claims-agent.json", RepoRoot: repoRoot})
	if report["valid"] != true {
		t.Fatalf("stale anchors must be findings, not validation failures: %#v", report["issues"])
	}
	findings := arrayOrEmpty(report["findings"])
	if len(findings) == 0 || stringFromAny(asMap(findings[0])["kind"]) != "stale-anchor" {
		t.Fatalf("expected stale-anchor finding, got %#v", findings)
	}
}

func indexOfSource(input map[string]any, path string) int {
	for index, raw := range arrayOrEmpty(input["sources"]) {
		if stringFromAny(asMap(raw)["path"]) == path {
			return index
		}
	}
	return -1
}

func TestApplyClaimExtractionResultFailsOnTemplateHashMismatch(t *testing.T) {
	repoRoot := writeExtractionTestRepo(t)
	input := buildExtractionInput(t, repoRoot, ClaimExtractionInputOptions{})
	result := extractionResultFor(input, []any{})
	asMap(result["extractionInputRef"])["templateHash"] = "sha256:not-the-template"
	if _, err := ApplyClaimExtractionResult(input, result, ClaimExtractionApplyOptions{RepoRoot: repoRoot}); err == nil || !strings.Contains(err.Error(), "templateHash") {
		t.Fatalf("expected templateHash mismatch failure, got %v", err)
	}
}

func TestApplyClaimExtractionResultFailsOnInvalidResultSchema(t *testing.T) {
	repoRoot := writeExtractionTestRepo(t)
	input := buildExtractionInput(t, repoRoot, ClaimExtractionInputOptions{})
	claim := extractionClaim("bad enum", map[string]any{"path": "README.md", "line": 3, "verbatim": extractionTestPromise, "primary": true})
	claim["recommendedProof"] = "vibes"
	result := extractionResultFor(input, []any{claim})
	if _, err := ApplyClaimExtractionResult(input, result, ClaimExtractionApplyOptions{RepoRoot: repoRoot}); err == nil || !strings.Contains(err.Error(), "recommendedProof") {
		t.Fatalf("expected schema validation failure on bad enum, got %v", err)
	}
}

func TestClaimFingerprintGoldenUnchangedUnderUnifiedExcerptRule(t *testing.T) {
	golden := "sha256:ac0d20bb573309123a5dcabe4527abd6f23e4a6e9b5fdd5de7df8a7da623a322"
	if fingerprint := claimFingerprint(extractionTestPromise); fingerprint != golden {
		t.Fatalf("fingerprint normalization drifted from the golden value: %s", fingerprint)
	}
	plan, err := DiscoverClaimProofPlan(ClaimDiscoveryOptions{RepoRoot: filepath.Join("..", "..", "fixtures", "claim-discovery", "tiny-repo")})
	if err != nil {
		t.Fatalf("DiscoverClaimProofPlan returned error: %v", err)
	}
	candidates := arrayOrEmpty(plan["claimCandidates"])
	if len(candidates) == 0 {
		t.Fatalf("fixture repo produced no candidates")
	}
	for _, raw := range candidates {
		entry := asMap(raw)
		recorded := stringFromAny(entry["claimFingerprint"])
		fromSummary := claimFingerprint(stringFromAny(entry["summary"]))
		excerpt := stringFromAny(asMap(arrayOrEmpty(entry["sourceRefs"])[0])["excerpt"])
		fromExcerpt := claimFingerprint(excerpt)
		if recorded != fromSummary || recorded != fromExcerpt {
			t.Fatalf("heuristic excerpt fingerprint must equal summary fingerprint: recorded=%s summary=%s excerpt=%s", recorded, fromSummary, fromExcerpt)
		}
	}
}

func TestClaimPacketExtractionModeDefaultsToHeuristic(t *testing.T) {
	if mode := ClaimPacketExtractionMode(map[string]any{}); mode != "heuristic" {
		t.Fatalf("packet without extractionMode must read as heuristic, got %s", mode)
	}
	plan, err := DiscoverClaimProofPlan(ClaimDiscoveryOptions{RepoRoot: filepath.Join("..", "..", "fixtures", "claim-discovery", "tiny-repo")})
	if err != nil {
		t.Fatalf("DiscoverClaimProofPlan returned error: %v", err)
	}
	if plan["extractionMode"] != "heuristic" {
		t.Fatalf("heuristic discovery must write extractionMode heuristic, got %#v", plan["extractionMode"])
	}
	legacy := map[string]any{
		"schemaVersion": contracts.ClaimProofPlanSchema,
		"claimCandidates": []any{
			map[string]any{"reviewStatus": "agent-reviewed"},
		},
	}
	// A legacy packet without extractionMode keeps the heuristic-era audit rule:
	// agent-reviewed claims still require the carryForward audit block.
	if issue := reportCarryForwardPresence(legacy); issue == nil {
		t.Fatalf("legacy packet without extractionMode must keep requiring carryForward")
	}
}

func TestBuildClaimValidationReportFailsTamperedAgentExcerptWhenHashMatches(t *testing.T) {
	repoRoot := writeExtractionTestRepo(t)
	input := buildExtractionInput(t, repoRoot, ClaimExtractionInputOptions{})
	result := extractionResultFor(input, []any{
		extractionClaim("anchored", map[string]any{"path": "README.md", "line": 3, "verbatim": extractionTestPromise, "primary": true}),
	})
	packet, err := ApplyClaimExtractionResult(input, result, ClaimExtractionApplyOptions{RepoRoot: repoRoot})
	if err != nil {
		t.Fatalf("ApplyClaimExtractionResult returned error: %v", err)
	}
	claim := asMap(arrayOrEmpty(packet["claimCandidates"])[0])
	asMap(arrayOrEmpty(claim["sourceRefs"])[0])["excerpt"] = "A tampered excerpt the source never contained."
	report := BuildClaimValidationReport(packet, ClaimValidationOptions{InputPath: "claims-agent.json", RepoRoot: repoRoot})
	if report["valid"] != false {
		t.Fatalf("tampered excerpt with matching source hash must hard-fail validation")
	}
	found := false
	for _, raw := range arrayOrEmpty(report["issues"]) {
		if strings.Contains(stringFromAny(asMap(raw)["message"]), "does not anchor") {
			found = true
		}
	}
	if !found {
		t.Fatalf("expected anchoring issue, got %#v", report["issues"])
	}
}

func TestBuildClaimValidationReportRequiresExtractionAuditForAgentPackets(t *testing.T) {
	repoRoot := writeExtractionTestRepo(t)
	input := buildExtractionInput(t, repoRoot, ClaimExtractionInputOptions{})
	result := extractionResultFor(input, []any{
		extractionClaim("anchored", map[string]any{"path": "README.md", "line": 3, "verbatim": extractionTestPromise, "primary": true}),
	})
	packet, err := ApplyClaimExtractionResult(input, result, ClaimExtractionApplyOptions{RepoRoot: repoRoot})
	if err != nil {
		t.Fatalf("ApplyClaimExtractionResult returned error: %v", err)
	}
	delete(packet, "extractionAudit")
	report := BuildClaimValidationReport(packet, ClaimValidationOptions{InputPath: "claims-agent.json", RepoRoot: repoRoot})
	if report["valid"] != false {
		t.Fatalf("agent packet without extractionAudit must fail validation")
	}
}

func TestApplyClaimExtractionResultIsDeterministicForIdenticalInputs(t *testing.T) {
	repoRoot := writeExtractionTestRepo(t)
	input := buildExtractionInput(t, repoRoot, ClaimExtractionInputOptions{})
	result := extractionResultFor(input, []any{
		extractionClaim("anchored", map[string]any{"path": "README.md", "line": 3, "verbatim": extractionTestPromise, "primary": true}),
	})
	first, err := ApplyClaimExtractionResult(input, result, ClaimExtractionApplyOptions{RepoRoot: repoRoot})
	if err != nil {
		t.Fatalf("ApplyClaimExtractionResult returned error: %v", err)
	}
	second, err := ApplyClaimExtractionResult(input, result, ClaimExtractionApplyOptions{RepoRoot: repoRoot})
	if err != nil {
		t.Fatalf("ApplyClaimExtractionResult returned error: %v", err)
	}
	firstJSON := fmt.Sprintf("%#v", first)
	secondJSON := fmt.Sprintf("%#v", second)
	if firstJSON != secondJSON {
		t.Fatalf("apply-extraction must be deterministic for identical inputs")
	}
}
