package runtime

import (
	"fmt"
	"sort"
	"strings"
	"time"

	"github.com/corca-ai/cautilus/internal/contracts"
)

type skillCloneExperimentRun struct {
	id         string
	role       string
	skillID    string
	skillPath  string
	status     string
	text       string
	summary    string
	sourceRefs []string
	errors     []string
}

type skillCloneCoverageObligation struct {
	id       string
	ref      string
	required bool
}

func BuildSkillCloneExperimentReport(input map[string]any, now time.Time) (map[string]any, error) {
	if input["schemaVersion"] != contracts.SkillCloneExperimentInputSchema {
		return nil, fmt.Errorf("schemaVersion must be %s", contracts.SkillCloneExperimentInputSchema)
	}
	experimentID, err := normalizeNonEmptyString(input["experimentId"], "experimentId")
	if err != nil {
		return nil, err
	}
	taskPacket := asMap(input["taskPacket"])
	if len(taskPacket) == 0 {
		return nil, fmt.Errorf("taskPacket must be an object")
	}
	taskPacketView := skillCloneTaskPacketView(taskPacket)
	if len(taskPacketView) == 0 {
		return nil, fmt.Errorf("taskPacket must include at least one of: path, sourceRef, schemaVersion, summary")
	}
	baseline, err := normalizeSkillCloneExperimentRun(asMap(input["baseline"]), "baseline", "baseline")
	if err != nil {
		return nil, err
	}
	variant, err := normalizeSkillCloneExperimentRun(asMap(input["variant"]), "variant", "variant")
	if err != nil {
		return nil, err
	}
	var exemplar *skillCloneExperimentRun
	if rawExemplar := asMap(input["exemplar"]); len(rawExemplar) > 0 {
		exemplar, err = normalizeSkillCloneExperimentRun(rawExemplar, "exemplar", "exemplar")
		if err != nil {
			return nil, err
		}
	}
	obligations, err := normalizeSkillCloneCoverageObligations(input["sourceCoverageObligations"])
	if err != nil {
		return nil, err
	}
	rubricPhrases, err := normalizeSkillCloneStringList(input["rubricPhrases"], "rubricPhrases")
	if err != nil {
		return nil, err
	}
	isolationNotes, isolationSafe, err := normalizeSkillCloneIsolationNotes(input["isolation"])
	if err != nil {
		return nil, err
	}

	sourceCoverage := buildSkillCloneSourceCoverageDelta(baseline, variant, exemplar, obligations)
	baselineComparable := baseline.status == "passed" && len(baseline.errors) == 0 && strings.TrimSpace(baseline.text) != ""
	variantRan := variant.status == "passed" && len(variant.errors) == 0 && strings.TrimSpace(variant.text) != ""
	rubricMatch := buildSkillCloneRubricMatch(baseline, variant, rubricPhrases)
	delta := buildSkillCloneBaselineVariantDelta(baseline, variant, sourceCoverage)
	findings := buildSkillCloneFindings(baselineComparable, variantRan, isolationSafe, sourceCoverage, rubricMatch, delta)
	recommendation := skillClonePromotionRecommendation(baselineComparable, variantRan, isolationSafe, sourceCoverage, rubricMatch, delta)

	report := map[string]any{
		"schemaVersion":             contracts.SkillCloneExperimentReportSchema,
		"experimentId":              experimentID,
		"generatedAt":               now.UTC().Format(time.RFC3339Nano),
		"taskPacket":                taskPacketView,
		"baseline":                  skillCloneRunView(baseline),
		"variant":                   skillCloneRunView(variant),
		"baseline_comparable":       baselineComparable,
		"variant_ran":               variantRan,
		"baseline_vs_variant_delta": delta,
		"rubric_match":              rubricMatch,
		"source_coverage_delta":     sourceCoverage,
		"promotion_recommendation":  recommendation,
		"isolation_notes":           isolationNotes,
		"findings":                  findings,
	}
	if exemplar != nil {
		report["exemplar"] = skillCloneRunView(exemplar)
	}
	return report, nil
}

func normalizeSkillCloneExperimentRun(input map[string]any, field string, defaultID string) (*skillCloneExperimentRun, error) {
	if len(input) == 0 {
		return nil, fmt.Errorf("%s must be an object", field)
	}
	id := skillCloneFirstNonEmpty(stringOrEmpty(input["id"]), defaultID)
	status := skillCloneFirstNonEmpty(stringOrEmpty(input["status"]), "passed")
	if !containsString([]string{"passed", "failed", "blocked", "degraded"}, status) {
		return nil, fmt.Errorf("%s.status must be one of: passed, failed, blocked, degraded", field)
	}
	sourceRefs, err := normalizeSkillCloneStringList(input["sourceRefs"], field+".sourceRefs")
	if err != nil {
		return nil, err
	}
	errors, err := normalizeSkillCloneStringList(input["errors"], field+".errors")
	if err != nil {
		return nil, err
	}
	output := asMap(input["output"])
	text := skillCloneFirstNonEmpty(stringOrEmpty(input["text"]), stringOrEmpty(output["text"]), stringOrEmpty(input["summary"]), stringOrEmpty(output["summary"]))
	summary := skillCloneFirstNonEmpty(stringOrEmpty(input["summary"]), stringOrEmpty(output["summary"]), skillCloneSummarizeText(text))
	outputRefs, err := normalizeSkillCloneStringList(output["sourceRefs"], field+".output.sourceRefs")
	if err != nil {
		return nil, err
	}
	sourceRefs = skillCloneUniqueSortedStrings(append(sourceRefs, outputRefs...))
	return &skillCloneExperimentRun{
		id:         id,
		role:       field,
		skillID:    stringOrEmpty(input["skillId"]),
		skillPath:  stringOrEmpty(input["skillPath"]),
		status:     status,
		text:       text,
		summary:    summary,
		sourceRefs: sourceRefs,
		errors:     errors,
	}, nil
}

func normalizeSkillCloneCoverageObligations(value any) ([]skillCloneCoverageObligation, error) {
	if value == nil {
		return []skillCloneCoverageObligation{}, nil
	}
	raw, err := assertArray(value, "sourceCoverageObligations")
	if err != nil {
		return nil, err
	}
	result := make([]skillCloneCoverageObligation, 0, len(raw))
	for index, entry := range raw {
		record, ok := entry.(map[string]any)
		if !ok {
			return nil, fmt.Errorf("sourceCoverageObligations[%d] must be an object", index)
		}
		id, err := normalizeNonEmptyString(record["id"], fmt.Sprintf("sourceCoverageObligations[%d].id", index))
		if err != nil {
			return nil, err
		}
		ref, err := normalizeNonEmptyString(record["ref"], fmt.Sprintf("sourceCoverageObligations[%d].ref", index))
		if err != nil {
			return nil, err
		}
		required := true
		if _, ok := record["required"]; ok {
			required = truthy(record["required"])
		}
		result = append(result, skillCloneCoverageObligation{id: id, ref: ref, required: required})
	}
	return result, nil
}

func normalizeSkillCloneStringList(value any, field string) ([]string, error) {
	if value == nil {
		return []string{}, nil
	}
	raw, err := assertArray(value, field)
	if err != nil {
		return nil, err
	}
	result := make([]string, 0, len(raw))
	for index, entry := range raw {
		text, ok := entry.(string)
		if !ok || strings.TrimSpace(text) == "" {
			return nil, fmt.Errorf("%s[%d] must be a non-empty string", field, index)
		}
		result = append(result, strings.TrimSpace(text))
	}
	return skillCloneUniqueSortedStrings(result), nil
}

func normalizeSkillCloneIsolationNotes(value any) ([]any, bool, error) {
	if value == nil {
		return []any{"isolation not declared"}, false, nil
	}
	isolation, ok := value.(map[string]any)
	if !ok {
		return nil, false, fmt.Errorf("isolation must be an object")
	}
	notes, err := normalizeSkillCloneStringList(isolation["notes"], "isolation.notes")
	if err != nil {
		return nil, false, err
	}
	if sandbox := strings.TrimSpace(stringOrEmpty(isolation["sandbox"])); sandbox != "" {
		notes = append(notes, "sandbox: "+sandbox)
	}
	if variantPath := strings.TrimSpace(stringOrEmpty(isolation["variantPath"])); variantPath != "" {
		notes = append(notes, "variant path: "+variantPath)
	}
	productionTouched := truthy(isolation["productionSkillTouched"])
	productionTouchDeclared := false
	if _, ok := isolation["productionSkillTouched"]; ok {
		productionTouchDeclared = true
	}
	if productionTouched {
		notes = append(notes, "production skill was touched")
	}
	if !productionTouchDeclared {
		notes = append(notes, "productionSkillTouched not declared")
	}
	if len(notes) == 0 {
		notes = append(notes, "isolated temporary variant declared")
	}
	return skillCloneStringListAsAny(skillCloneUniqueSortedStrings(notes)), productionTouchDeclared && !productionTouched, nil
}

func buildSkillCloneSourceCoverageDelta(baseline *skillCloneExperimentRun, variant *skillCloneExperimentRun, exemplar *skillCloneExperimentRun, obligations []skillCloneCoverageObligation) map[string]any {
	expected := make([]string, 0, len(obligations))
	required := make([]string, 0, len(obligations))
	for _, obligation := range obligations {
		expected = append(expected, obligation.ref)
		if obligation.required {
			required = append(required, obligation.ref)
		}
	}
	baselineCovered := skillCloneCoveredRefs(baseline, obligations)
	variantCovered := skillCloneCoveredRefs(variant, obligations)
	exemplarCovered := []string{}
	if exemplar != nil {
		exemplarCovered = skillCloneCoveredRefs(exemplar, obligations)
	}
	return map[string]any{
		"expected":        skillCloneUniqueSortedStrings(expected),
		"required":        skillCloneUniqueSortedStrings(required),
		"baselineCovered": baselineCovered,
		"variantCovered":  variantCovered,
		"exemplarCovered": exemplarCovered,
		"gained":          skillCloneSortedDifference(variantCovered, baselineCovered),
		"lost":            skillCloneSortedDifference(baselineCovered, variantCovered),
		"stillMissing":    skillCloneSortedDifference(required, variantCovered),
	}
}

func skillCloneCoveredRefs(run *skillCloneExperimentRun, obligations []skillCloneCoverageObligation) []string {
	if run == nil {
		return []string{}
	}
	covered := []string{}
	for _, obligation := range obligations {
		if containsString(run.sourceRefs, obligation.ref) {
			covered = append(covered, obligation.ref)
		}
	}
	return skillCloneUniqueSortedStrings(covered)
}

func buildSkillCloneRubricMatch(baseline *skillCloneExperimentRun, variant *skillCloneExperimentRun, phrases []string) map[string]any {
	baselineMatched := []string{}
	matched := []string{}
	missing := []string{}
	baselineHaystack := strings.ToLower(baseline.text)
	haystack := strings.ToLower(variant.text)
	for _, phrase := range phrases {
		if strings.Contains(baselineHaystack, strings.ToLower(phrase)) {
			baselineMatched = append(baselineMatched, phrase)
		}
		if strings.Contains(haystack, strings.ToLower(phrase)) {
			matched = append(matched, phrase)
		} else {
			missing = append(missing, phrase)
		}
	}
	status := "not_declared"
	if len(phrases) > 0 && len(missing) == 0 {
		status = "pass"
	} else if len(phrases) > 0 {
		status = "degraded"
	}
	return map[string]any{
		"status":          status,
		"baselineMatched": skillCloneUniqueSortedStrings(baselineMatched),
		"matched":         skillCloneUniqueSortedStrings(matched),
		"missing":         skillCloneUniqueSortedStrings(missing),
		"gained":          skillCloneSortedDifference(matched, baselineMatched),
	}
}

func buildSkillCloneBaselineVariantDelta(baseline *skillCloneExperimentRun, variant *skillCloneExperimentRun, sourceCoverage map[string]any) map[string]any {
	gained := stringArrayOrEmpty(sourceCoverage["gained"])
	lost := stringArrayOrEmpty(sourceCoverage["lost"])
	summary := "variant output is equivalent to baseline on declared source coverage"
	switch {
	case len(gained) > 0 && len(lost) == 0:
		summary = "variant adds declared source coverage without losing baseline coverage"
	case len(lost) > 0:
		summary = "variant loses declared source coverage"
	case strings.TrimSpace(variant.text) == "":
		summary = "variant produced no comparable output"
	case strings.TrimSpace(baseline.text) == "":
		summary = "baseline produced no comparable output"
	case skillCloneNormalizeWhitespace(variant.text) != skillCloneNormalizeWhitespace(baseline.text):
		summary = "variant changes output text without changing declared source coverage"
	}
	return map[string]any{
		"summary":              summary,
		"baselineLength":       len([]rune(baseline.text)),
		"variantLength":        len([]rune(variant.text)),
		"lengthDelta":          len([]rune(variant.text)) - len([]rune(baseline.text)),
		"addedSourceCoverage":  gained,
		"lostSourceCoverage":   lost,
		"sharedSourceCoverage": skillCloneSortedIntersection(stringArrayOrEmpty(sourceCoverage["baselineCovered"]), stringArrayOrEmpty(sourceCoverage["variantCovered"])),
	}
}

func buildSkillCloneFindings(baselineComparable bool, variantRan bool, isolationSafe bool, sourceCoverage map[string]any, rubricMatch map[string]any, delta map[string]any) []any {
	findings := []any{}
	if !baselineComparable {
		findings = append(findings, map[string]any{"severity": "blocker", "message": "baseline did not produce a passed comparable run"})
	}
	if !variantRan {
		findings = append(findings, map[string]any{"severity": "blocker", "message": "variant did not produce a passed comparable run"})
	}
	if !isolationSafe {
		findings = append(findings, map[string]any{"severity": "blocker", "message": "experiment touched production skill state"})
	}
	for _, ref := range stringArrayOrEmpty(sourceCoverage["stillMissing"]) {
		findings = append(findings, map[string]any{"severity": "concern", "message": "variant still misses required source coverage", "ref": ref})
	}
	for _, phrase := range stringArrayOrEmpty(rubricMatch["missing"]) {
		findings = append(findings, map[string]any{"severity": "concern", "message": "variant misses rubric phrase", "phrase": phrase})
	}
	if len(findings) == 0 && len(stringArrayOrEmpty(delta["addedSourceCoverage"])) > 0 {
		return []any{map[string]any{"severity": "pass", "message": "variant adds declared coverage without deterministic blockers"}}
	}
	if len(findings) == 0 && len(stringArrayOrEmpty(rubricMatch["gained"])) > 0 {
		return []any{map[string]any{"severity": "pass", "message": "variant adds declared rubric matches without deterministic blockers"}}
	}
	if len(findings) == 0 {
		return []any{map[string]any{"severity": "note", "message": "no declared coverage or rubric delta requires promotion"}}
	}
	return findings
}

func skillClonePromotionRecommendation(baselineComparable bool, variantRan bool, isolationSafe bool, sourceCoverage map[string]any, rubricMatch map[string]any, delta map[string]any) string {
	if !variantRan {
		return "discard"
	}
	if !baselineComparable || !isolationSafe || len(stringArrayOrEmpty(sourceCoverage["lost"])) > 0 {
		return "revise"
	}
	if len(stringArrayOrEmpty(sourceCoverage["stillMissing"])) > 0 || len(stringArrayOrEmpty(rubricMatch["missing"])) > 0 {
		return "revise"
	}
	if len(stringArrayOrEmpty(delta["addedSourceCoverage"])) > 0 || len(stringArrayOrEmpty(rubricMatch["gained"])) > 0 {
		return "promote"
	}
	return "discard"
}

func skillCloneTaskPacketView(taskPacket map[string]any) map[string]any {
	result := map[string]any{}
	for _, key := range []string{"path", "schemaVersion", "summary", "sourceRef"} {
		if value := strings.TrimSpace(stringOrEmpty(taskPacket[key])); value != "" {
			result[key] = value
		}
	}
	return result
}

func skillCloneRunView(run *skillCloneExperimentRun) map[string]any {
	result := map[string]any{
		"id":         run.id,
		"role":       run.role,
		"status":     run.status,
		"summary":    run.summary,
		"sourceRefs": run.sourceRefs,
	}
	if run.skillID != "" {
		result["skillId"] = run.skillID
	}
	if run.skillPath != "" {
		result["skillPath"] = run.skillPath
	}
	if len(run.errors) > 0 {
		result["errors"] = run.errors
	}
	return result
}

func skillCloneSummarizeText(value string) string {
	text := skillCloneNormalizeWhitespace(value)
	if len([]rune(text)) <= 160 {
		return text
	}
	return string([]rune(text)[:157]) + "..."
}

func skillCloneNormalizeWhitespace(value string) string {
	return strings.Join(strings.Fields(value), " ")
}

func skillCloneSortedDifference(left []string, right []string) []string {
	rightSet := map[string]struct{}{}
	for _, value := range right {
		rightSet[value] = struct{}{}
	}
	result := []string{}
	for _, value := range left {
		if _, ok := rightSet[value]; !ok {
			result = append(result, value)
		}
	}
	return skillCloneUniqueSortedStrings(result)
}

func skillCloneSortedIntersection(left []string, right []string) []string {
	rightSet := map[string]struct{}{}
	for _, value := range right {
		rightSet[value] = struct{}{}
	}
	result := []string{}
	for _, value := range left {
		if _, ok := rightSet[value]; ok {
			result = append(result, value)
		}
	}
	return skillCloneUniqueSortedStrings(result)
}

func skillCloneUniqueSortedStrings(values []string) []string {
	seen := map[string]struct{}{}
	result := []string{}
	for _, value := range values {
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
	sort.Strings(result)
	return result
}

func skillCloneStringListAsAny(values []string) []any {
	result := make([]any, 0, len(values))
	for _, value := range values {
		result = append(result, value)
	}
	return result
}

func skillCloneFirstNonEmpty(values ...string) string {
	for _, value := range values {
		if strings.TrimSpace(value) != "" {
			return strings.TrimSpace(value)
		}
	}
	return ""
}
