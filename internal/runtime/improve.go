package runtime

import (
	"crypto/sha256"
	"encoding/hex"
	"fmt"
	"os"
	"path/filepath"
	"sort"
	"strings"
	"time"

	"github.com/corca-ai/cautilus/internal/contracts"
)

var improveGuardrailDimensions = []string{
	BehaviorDimensions["REPAIR_EXPLICIT_REGRESSIONS_FIRST"],
	BehaviorDimensions["REVIEW_FINDINGS_BINDING"],
	BehaviorDimensions["HISTORY_FOCUSES_NEXT_PROBE"],
	BehaviorDimensions["RERUN_RELEVANT_GATES"],
}

var improverBudgets = map[string]map[string]any{
	"light":  {"evidenceLimit": 3, "suggestedChangeLimit": 2, "reviewVariantLimit": 1, "historySignalLimit": 1},
	"medium": {"evidenceLimit": 5, "suggestedChangeLimit": 3, "reviewVariantLimit": 2, "historySignalLimit": 2},
	"heavy":  {"evidenceLimit": 8, "suggestedChangeLimit": 4, "reviewVariantLimit": 3, "historySignalLimit": 4},
}

var improveEvidenceSourcePriority = []string{
	"report.regressed",
	"report.noisy",
	"report.review_finding",
	"review.finding",
	"report.compare_reason",
	"scenario_history",
	"report.improved",
}

var improveSeverityPriority = map[string]int{"blocker": 0, "high": 1, "medium": 2, "concern": 2, "low": 3}

func BuildImproveInput(repoRoot string, reportFile string, reviewSummaryFile *string, historyFile *string, target string, targetFile *string, budget string, activeRunDir *string, now time.Time) (map[string]any, error) {
	resolvedReportFile := reportFile
	if activeRunDir != nil {
		if strings.TrimSpace(resolvedReportFile) == "" {
			resolvedReportFile = filepath.Join(*activeRunDir, "report.json")
		}
		if reviewSummaryFile == nil {
			value := filepath.Join(*activeRunDir, "review-summary.json")
			if fileExists(value) {
				reviewSummaryFile = &value
			}
		}
		if historyFile == nil {
			value := filepath.Join(*activeRunDir, "scenario-history.snapshot.json")
			if fileExists(value) {
				historyFile = &value
			}
		}
	}
	report, err := readJSONFile(resolvedReportFile)
	if err != nil {
		return nil, err
	}
	if err := ValidateReportPacket(report, resolvedReportFile); err != nil {
		return nil, fmt.Errorf("%s: %w", resolvedReportFile, err)
	}
	if err := requireImproveRunnerProof(report); err != nil {
		return nil, err
	}
	intentProfile, err := BuildBehaviorIntentProfile(report["intent"], asMap(report["intentProfile"]), BehaviorSurfaces["OPERATOR_BEHAVIOR"], nil, improveGuardrailDimensions)
	if err != nil {
		return nil, err
	}
	packet := map[string]any{
		"schemaVersion":     contracts.ImproveInputsSchema,
		"generatedAt":       now.UTC().Format(time.RFC3339Nano),
		"repoRoot":          repoRoot,
		"improvementTarget": target,
		"intentProfile":     anyFromProfile(intentProfile),
		"improver":          buildImproverPlan(budget),
		"reportFile":        resolvedReportFile,
		"report":            report,
		"objective": map[string]any{
			"summary": "Propose one bounded next revision without weakening held-out, comparison, or review discipline.",
			"constraints": []string{
				"Prefer repairing explicit regressions over widening scope.",
				"Treat review findings as first-class evidence, not optional commentary.",
				"Use scenario history only to focus the next bounded probe, not to justify overfitting.",
				"Stop after one bounded revision and rerun the relevant gates.",
			},
		},
	}
	if runtimeContext := asMap(report["runtimeContext"]); len(runtimeContext) > 0 {
		packet["runtimeContext"] = runtimeContext
	}
	if targetFile != nil && strings.TrimSpace(*targetFile) != "" {
		packet["targetFile"] = map[string]any{
			"path":   resolvePath(repoRoot, *targetFile),
			"exists": fileExists(resolvePath(repoRoot, *targetFile)),
		}
	}
	if reviewSummaryFile != nil {
		reviewSummary, err := readJSONFile(*reviewSummaryFile)
		if err != nil {
			return nil, err
		}
		packet["reviewSummaryFile"] = *reviewSummaryFile
		packet["reviewSummary"] = reviewSummary
	}
	if historyFile != nil {
		history, err := readJSONFile(*historyFile)
		if err != nil {
			return nil, err
		}
		if history["schemaVersion"] != contracts.ScenarioHistorySchema {
			return nil, fmt.Errorf("scenario history must use schemaVersion %s", contracts.ScenarioHistorySchema)
		}
		packet["scenarioHistoryFile"] = *historyFile
		packet["scenarioHistory"] = history
	}
	return packet, nil
}

func requireImproveRunnerProof(report map[string]any) error {
	proofSummary := asMap(report["proofSummary"])
	if len(proofSummary) == 0 {
		return nil
	}
	if !truthy(proofSummary["requiresProductRunnerProof"]) {
		return nil
	}
	if stringOrEmpty(proofSummary["productRunnerProofReadiness"]) == "ready" {
		return nil
	}
	return fmt.Errorf("improve requires runner-backed product proof before behavior improvement; productRunnerProofReadiness=%s", firstNonEmptyString(proofSummary["productRunnerProofReadiness"], "unknown"))
}

func buildImproverPlan(budget string) map[string]any {
	if _, ok := improverBudgets[budget]; !ok {
		budget = "medium"
	}
	return map[string]any{
		"budget": budget,
		"plan":   improverBudgets[budget],
	}
}

func GenerateImproveProposal(packet map[string]any, inputFile *string, now time.Time) (map[string]any, error) {
	improver := normalizeImprover(packet["improver"])
	intentProfile, err := BuildBehaviorIntentProfile(asMap(packet["report"])["intent"], asMap(packet["intentProfile"]), BehaviorSurfaces["OPERATOR_BEHAVIOR"], nil, stringArrayOrEmpty(asMap(packet["objective"])["constraints"]))
	if err != nil {
		return nil, err
	}
	evidenceUniverse := buildEvidenceUniverse(packet, improver)
	rankedEvidence := rankImproveEvidence(evidenceUniverse)
	prioritizedEvidence := buildPrioritizedEvidence(rankedEvidence, improver)
	evidence := prioritizedEvidence
	deprioritizedEvidence := []map[string]any{}
	if len(rankedEvidence) > len(prioritizedEvidence) {
		deprioritizedEvidence = rankedEvidence[len(prioritizedEvidence):]
	}
	if len(evidence) == 0 {
		evidence = buildFallbackImproveEvidence(packet)
	}
	suggestedChanges := buildSuggestedChanges(packet, evidence)
	if len(suggestedChanges) > int(numberOrDefault(asMap(improver["plan"])["suggestedChangeLimit"], 3)) {
		suggestedChanges = suggestedChanges[:int(numberOrDefault(asMap(improver["plan"])["suggestedChangeLimit"], 3))]
	}
	decision := buildImproveDecision(packet, evidence)
	proposal := map[string]any{
		"schemaVersion":        contracts.ImproveProposalSchema,
		"generatedAt":          now.UTC().Format(time.RFC3339Nano),
		"improvementTarget":    packet["improvementTarget"],
		"intentProfile":        anyFromProfile(intentProfile),
		"improver":             improver,
		"reportRecommendation": stringOrEmpty(asMap(packet["report"])["recommendation"]),
		"decision":             decision,
		"revisionReasons":      buildRevisionReasons(packet, evidence),
		"evidenceFocus":        buildEvidenceFocus(evidence),
		"rationale":            buildProposalRationale(decision, improver, evidence),
		"prioritizedEvidence":  evidence,
		"suggestedChanges":     suggestedChanges,
		"revisionBrief":        buildRevisionBrief(packet, decision, evidence, suggestedChanges),
		"trialTelemetry":       buildTrialTelemetry(improver, evidenceUniverse, evidence, deprioritizedEvidence, suggestedChanges),
		"stopConditions": []string{
			"Stop after one bounded revision.",
			"Do not weaken held-out, comparison, or structured review gates to make the candidate pass.",
			"If the cited evidence still regresses after the next bounded revision, defer instead of retrying indefinitely.",
		},
		"followUpChecks": buildFollowUpChecks(decision, suggestedChanges),
	}
	if inputFile != nil {
		proposal["inputFile"] = *inputFile
	}
	if targetFile := asMap(packet["targetFile"]); len(targetFile) > 0 {
		proposal["targetFile"] = targetFile
	}
	if runtimeContext := asMap(packet["runtimeContext"]); len(runtimeContext) > 0 {
		proposal["runtimeContext"] = runtimeContext
	}
	return proposal, nil
}

func BuildRevisionArtifact(proposal map[string]any, proposalFile string, improveInput map[string]any, improveInputFile string, now time.Time) (map[string]any, error) {
	intentProfile, err := BuildBehaviorIntentProfile(asMap(improveInput["report"])["intent"], asMap(proposal["intentProfile"]), BehaviorSurfaces["OPERATOR_BEHAVIOR"], nil, stringArrayOrEmpty(asMap(improveInput["objective"])["constraints"]))
	if err != nil {
		return nil, err
	}
	artifact := map[string]any{
		"schemaVersion":     contracts.RevisionArtifactSchema,
		"generatedAt":       now.UTC().Format(time.RFC3339Nano),
		"proposalFile":      proposalFile,
		"proposal":          proposal,
		"improveInputFile":  improveInputFile,
		"repoRoot":          improveInput["repoRoot"],
		"improvementTarget": proposal["improvementTarget"],
		"intentProfile":     anyFromProfile(intentProfile),
		"improver":          firstNonNil(proposal["improver"], improveInput["improver"]),
		"objective":         improveInput["objective"],
		"sourceFiles": map[string]any{
			"reportFile":          summarizeOptionalPath(improveInput["reportFile"]),
			"reviewSummaryFile":   summarizeOptionalPath(improveInput["reviewSummaryFile"]),
			"scenarioHistoryFile": summarizeOptionalPath(improveInput["scenarioHistoryFile"]),
		},
		"reportContext": map[string]any{
			"candidate":      asMap(improveInput["report"])["candidate"],
			"baseline":       asMap(improveInput["report"])["baseline"],
			"intent":         asMap(improveInput["report"])["intent"],
			"intentProfile":  anyFromProfile(intentProfile),
			"recommendation": asMap(improveInput["report"])["recommendation"],
			"regressed":      arrayOrEmpty(asMap(improveInput["report"])["regressed"]),
			"noisy":          arrayOrEmpty(asMap(improveInput["report"])["noisy"]),
			"improved":       arrayOrEmpty(asMap(improveInput["report"])["improved"]),
		},
		"decision":             proposal["decision"],
		"reportRecommendation": proposal["reportRecommendation"],
		"revisionBrief":        proposal["revisionBrief"],
		"prioritizedEvidence":  proposal["prioritizedEvidence"],
		"suggestedChanges":     proposal["suggestedChanges"],
		"stopConditions":       proposal["stopConditions"],
		"followUpChecks":       proposal["followUpChecks"],
		"trialTelemetry":       proposal["trialTelemetry"],
	}
	targetFile := asMap(firstNonNil(proposal["targetFile"], improveInput["targetFile"]))
	if len(targetFile) > 0 {
		artifact["targetFile"] = targetFile
		artifact["targetSnapshot"] = collectTargetSnapshot(targetFile)
	}
	return artifact, nil
}

func normalizeImprover(value any) map[string]any {
	record := asMap(value)
	budget := stringOrEmpty(record["budget"])
	if _, ok := improverBudgets[budget]; !ok {
		budget = "medium"
	}
	plan := improverBudgets[budget]
	if customPlan := asMap(record["plan"]); len(customPlan) > 0 {
		merged := map[string]any{}
		for key, value := range plan {
			merged[key] = value
		}
		for key, value := range customPlan {
			merged[key] = value
		}
		plan = merged
	}
	return map[string]any{"budget": budget, "plan": plan}
}

func buildEvidenceUniverse(packet map[string]any, improver map[string]any) []map[string]any {
	report := asMap(packet["report"])
	evidence := []map[string]any{}
	for _, rawScenario := range arrayOrEmpty(report["regressed"]) {
		scenario := normalizeScenarioKey(rawScenario, 0, "regressed")
		evidence = append(evidence, map[string]any{
			"source":     "report.regressed",
			"key":        scenario,
			"severity":   "high",
			"summary":    "Regressed scenario: " + scenario,
			"message":    scenario + " regressed in the current report.",
			"provenance": map[string]any{"packet": "report", "locator": "regressed." + scenario},
		})
	}
	evidence = append(evidence, gatherImproveReportReviewFindings(report)...)
	evidence = append(evidence, gatherImproveReviewFindings(packet, int(numberOrDefault(asMap(improver["plan"])["reviewVariantLimit"], 2)))...)
	for _, rawScenario := range arrayOrEmpty(report["noisy"]) {
		scenario := normalizeScenarioKey(rawScenario, 0, "noisy")
		evidence = append(evidence, map[string]any{
			"source":     "report.noisy",
			"key":        scenario,
			"severity":   "medium",
			"summary":    "Noisy scenario: " + scenario,
			"message":    scenario + " needs more signal before calling the change better.",
			"provenance": map[string]any{"packet": "report", "locator": "noisy." + scenario},
		})
	}
	evidence = append(evidence, gatherImproveResidualCompareReasons(report)...)
	evidence = append(evidence, gatherImproveHistorySignals(asMap(packet["scenarioHistory"]), int(numberOrDefault(asMap(improver["plan"])["historySignalLimit"], 2)))...)
	return evidence
}

func buildRevisionReasons(packet map[string]any, evidence []any) []any {
	reasons := []string{}
	for _, rawEvidence := range evidence {
		switch stringOrEmpty(asMap(rawEvidence)["source"]) {
		case "report.regressed", "report.compare_reason":
			reasons = append(reasons, "known_regression")
		case "report.review_finding", "review.finding":
			reasons = append(reasons, "review_concern")
		case "scenario_history":
			reasons = append(reasons, "unstable_history")
		case "report.noisy":
			reasons = append(reasons, "noisy_evidence")
		}
	}
	runtimeContext := asMap(firstNonNil(packet["runtimeContext"], asMap(asMap(packet["report"])["runtimeContext"])))
	if containsString(stringSliceValue(runtimeContext["reasonCodes"]), "model_runtime_changed") {
		reasons = append(reasons, "model_runtime_changed")
		if reportLooksPassing(asMap(packet["report"])) {
			reasons = append(reasons, "passing_simplification")
		}
	}
	reasons = uniqueStrings(reasons)
	result := make([]any, 0, len(reasons))
	for _, reason := range reasons {
		result = append(result, reason)
	}
	return result
}

func buildEvidenceFocus(evidence []any) string {
	sources := map[string]bool{}
	for _, rawEvidence := range evidence {
		sources[stringOrEmpty(asMap(rawEvidence)["source"])] = true
	}
	if sources["report.review_finding"] || sources["review.finding"] {
		return "review"
	}
	if sources["scenario_history"] {
		return "history"
	}
	if len(sources) > 0 {
		return "current_report"
	}
	return "balanced"
}

func gatherImproveReportReviewFindings(report map[string]any) []map[string]any {
	evidence := []map[string]any{}
	for index, rawFinding := range arrayOrEmpty(report["humanReviewFindings"]) {
		finding := asMap(rawFinding)
		message := strings.TrimSpace(stringOrEmpty(finding["message"]))
		if message == "" {
			continue
		}
		severity := strings.ToLower(stringOrEmpty(finding["severity"]))
		if severity == "" {
			severity = "concern"
		}
		path := strings.TrimSpace(stringOrEmpty(finding["path"]))
		key := fmt.Sprintf("report:%d", index)
		if path != "" {
			key = "report:" + path
		}
		evidence = append(evidence, map[string]any{
			"source":     "report.review_finding",
			"key":        key,
			"severity":   severity,
			"summary":    fmt.Sprintf("Report review %s: %s", severity, message),
			"message":    message,
			"path":       nilIfEmpty(path),
			"provenance": map[string]any{"packet": "report", "locator": fmt.Sprintf("humanReviewFindings.%d", index)},
		})
	}
	return evidence
}

func gatherImproveReviewFindings(packet map[string]any, reviewVariantLimit int) []map[string]any {
	reviewSummary := asMap(packet["reviewSummary"])
	variants := arrayOrEmpty(reviewSummary["variants"])
	if reviewVariantLimit < len(variants) {
		variants = variants[:reviewVariantLimit]
	}
	evidence := []map[string]any{}
	for _, rawVariant := range variants {
		variant := asMap(rawVariant)
		findings := arrayOrEmpty(asMap(variant["output"])["findings"])
		for index, rawFinding := range findings {
			finding := asMap(rawFinding)
			message := stringOrEmpty(finding["message"])
			if message == "" {
				continue
			}
			severity := strings.ToLower(stringOrEmpty(finding["severity"]))
			if severity == "" {
				severity = "concern"
			}
			path := stringOrEmpty(finding["path"])
			key := stringOrEmpty(variant["id"]) + ":" + path
			if path == "" {
				key = fmt.Sprintf("%s:%d", stringOrEmpty(variant["id"]), index)
			}
			evidence = append(evidence, map[string]any{
				"source":     "review.finding",
				"key":        key,
				"severity":   severity,
				"summary":    fmt.Sprintf("%s %s: %s", stringOrEmpty(variant["id"]), severity, message),
				"message":    message,
				"path":       nilIfEmpty(path),
				"variantId":  nilIfEmpty(variant["id"]),
				"provenance": map[string]any{"packet": "reviewSummary", "locator": fmt.Sprintf("variants.%s.findings.%s", stringOrEmpty(variant["id"]), key)},
			})
		}
	}
	return evidence
}

func gatherImproveResidualCompareReasons(report map[string]any) []map[string]any {
	evidence := []map[string]any{}
	for modeIndex, rawModeRun := range arrayOrEmpty(report["modeRuns"]) {
		modeRun := asMap(rawModeRun)
		mode := firstNonEmpty(stringOrEmpty(modeRun["mode"]), fmt.Sprintf("mode-%d", modeIndex+1))
		compareArtifact := asMap(asMap(modeRun["scenarioResults"])["compareArtifact"])
		for reasonIndex, rawReason := range arrayOrEmpty(compareArtifact["reasons"]) {
			reason := strings.TrimSpace(stringOrEmpty(rawReason))
			if reason == "" || !improveCompareReasonLooksResidual(reason) {
				continue
			}
			key := fmt.Sprintf("%s:%d", mode, reasonIndex)
			evidence = append(evidence, map[string]any{
				"source":     "report.compare_reason",
				"key":        key,
				"severity":   improveCompareReasonSeverity(reason),
				"summary":    "Residual compare gap: " + reason,
				"message":    reason,
				"provenance": map[string]any{"packet": "report", "locator": fmt.Sprintf("modeRuns.%d.scenarioResults.compareArtifact.reasons.%d", modeIndex, reasonIndex)},
			})
		}
	}
	return evidence
}

func improveCompareReasonLooksResidual(reason string) bool {
	lower := strings.ToLower(strings.TrimSpace(reason))
	if lower == "" {
		return false
	}
	for _, marker := range []string{
		"remaining gap",
		"remaining gaps",
		"remaining issue",
		"remaining hotspot",
		"residual",
		"still has",
		"false positive",
		"false negative",
		" fp",
		"fn ",
		" miss",
		"gap:",
		"hotspot",
	} {
		if strings.Contains(lower, marker) {
			return true
		}
	}
	return false
}

func improveCompareReasonSeverity(reason string) string {
	lower := strings.ToLower(reason)
	for _, marker := range []string{"blocker", "regress", "false positive", "false negative", "still has"} {
		if strings.Contains(lower, marker) {
			return "high"
		}
	}
	return "medium"
}

func gatherImproveHistorySignals(history map[string]any, limit int) []map[string]any {
	evidence := []map[string]any{}
	for scenarioID, rawStats := range asMap(history["scenarioStats"]) {
		recentTrainResults := arrayOrEmpty(asMap(rawStats)["recentTrainResults"])
		if len(recentTrainResults) == 0 {
			continue
		}
		latest := asMap(recentTrainResults[0])
		overallScore, _ := toFloat(latest["overallScore"])
		passRate, _ := toFloat(latest["passRate"])
		if stringOrEmpty(latest["status"]) == "passed" && overallScore == 100 && passRate == 1 {
			continue
		}
		evidence = append(evidence, map[string]any{
			"source":     "scenario_history",
			"key":        scenarioID,
			"severity":   "medium",
			"summary":    scenarioID + " remains unstable in recent train history",
			"message":    fmt.Sprintf("%s last train result was %s with score %.0f.", scenarioID, stringOrEmpty(latest["status"]), overallScore),
			"provenance": map[string]any{"packet": "scenarioHistory", "locator": "scenarioStats." + scenarioID},
		})
	}
	if limit < len(evidence) {
		evidence = evidence[:limit]
	}
	return evidence
}

func rankImproveEvidence(evidence []map[string]any) []map[string]any {
	ranked := append([]map[string]any{}, evidence...)
	sort.Slice(ranked, func(left, right int) bool {
		leftSourceRank := indexOf(improveEvidenceSourcePriority, stringOrEmpty(ranked[left]["source"]))
		rightSourceRank := indexOf(improveEvidenceSourcePriority, stringOrEmpty(ranked[right]["source"]))
		if leftSourceRank != rightSourceRank {
			return leftSourceRank < rightSourceRank
		}
		leftSeverity := improveSeverityPriority[stringOrEmpty(ranked[left]["severity"])]
		rightSeverity := improveSeverityPriority[stringOrEmpty(ranked[right]["severity"])]
		if leftSeverity != rightSeverity {
			return leftSeverity < rightSeverity
		}
		return stringOrEmpty(ranked[left]["summary"]) < stringOrEmpty(ranked[right]["summary"])
	})
	return ranked
}

func buildPrioritizedEvidence(evidence []map[string]any, improver map[string]any) []any {
	limit := int(numberOrDefault(asMap(improver["plan"])["evidenceLimit"], 5))
	if limit < len(evidence) {
		evidence = evidence[:limit]
	}
	result := make([]any, 0, len(evidence))
	for _, entry := range evidence {
		result = append(result, entry)
	}
	return result
}

func buildFallbackImproveEvidence(packet map[string]any) []any {
	improved := arrayOrEmpty(asMap(packet["report"])["improved"])
	if len(improved) == 0 {
		return []any{}
	}
	scenario := normalizeScenarioKey(improved[0], 0, "improved")
	return []any{map[string]any{
		"source":     "report.improved",
		"key":        scenario,
		"severity":   "low",
		"summary":    "Improved scenario: " + scenario,
		"message":    scenario + " improved, and no blocking evidence was surfaced.",
		"provenance": map[string]any{"packet": "report", "locator": "improved." + scenario},
	}}
}

func buildSuggestedChanges(packet map[string]any, evidence []any) []any {
	result := []any{}
	if simplification := buildPassingSimplificationChange(packet); simplification != nil {
		result = append(result, simplification)
	}
	if primary := buildPrimaryChange(packet, evidence); primary != nil {
		result = append(result, primary)
	}
	if sampling := buildSamplingChange(evidence); sampling != nil {
		result = append(result, sampling)
	}
	if history := buildHistoryChange(evidence); history != nil {
		result = append(result, history)
	}
	return result
}

func buildPassingSimplificationChange(packet map[string]any) any {
	report := asMap(packet["report"])
	runtimeContext := asMap(firstNonNil(packet["runtimeContext"], report["runtimeContext"]))
	if !containsString(stringSliceValue(runtimeContext["reasonCodes"]), "model_runtime_changed") || !reportLooksPassing(report) {
		return nil
	}
	return map[string]any{
		"id":                "passing-simplification",
		"changeKind":        "prompt_simplification",
		"target":            stringOrEmpty(packet["improvementTarget"]),
		"summary":           "Consider a shorter target only if the same behavior and review gates continue to pass.",
		"rationale":         "The current evidence passes under a changed model runtime, so a bounded simplification candidate may be worth evaluating.",
		"runtimeComparison": firstNonNil(firstArrayItem(runtimeContext["comparisons"]), map[string]any{}),
		"passingEvidence":   passingEvidenceSummary(report),
		"targetSizeDelta":   "unknown",
		"optional":          true,
	}
}

func reportLooksPassing(report map[string]any) bool {
	if stringOrEmpty(report["recommendation"]) != "accept-now" {
		return false
	}
	return len(arrayOrEmpty(report["regressed"])) == 0 && len(arrayOrEmpty(report["noisy"])) == 0
}

func passingEvidenceSummary(report map[string]any) []any {
	evidence := []any{}
	for _, mode := range arrayOrEmpty(report["modeSummaries"]) {
		record := asMap(mode)
		status := stringOrEmpty(record["status"])
		if status == "" || status == "completed" || status == "passed" {
			evidence = append(evidence, map[string]any{
				"mode":   record["mode"],
				"status": firstNonEmpty(status, "completed"),
			})
		}
	}
	if len(evidence) == 0 {
		evidence = append(evidence, map[string]any{
			"recommendation": report["recommendation"],
		})
	}
	return evidence
}

func buildPrimaryChange(packet map[string]any, evidence []any) any {
	regressed := filterEvidenceBySource(evidence, "report.regressed")
	noisySignals := filterEvidenceBySource(evidence, "report.noisy")
	reviewSignals := append([]any{}, filterEvidenceBySource(evidence, "report.review_finding")...)
	reviewSignals = append(reviewSignals, filterEvidenceBySource(evidence, "review.finding")...)
	reviewSignals = append(reviewSignals, filterEvidenceBySource(evidence, "report.compare_reason")...)
	target := stringOrEmpty(packet["improvementTarget"])
	changeKind := "prompt_revision"
	summary := "Revise the prompt to repair the cited failures before widening scope."
	if target == "adapter" {
		changeKind = "adapter_revision"
		summary = "Tighten the adapter surface around the failing evidence before widening the workflow."
	}
	evidenceItems := append([]any{}, regressed...)
	evidenceItems = append(evidenceItems, noisySignals...)
	evidenceItems = append(evidenceItems, reviewSignals...)
	if len(evidenceItems) > 3 {
		evidenceItems = evidenceItems[:3]
	}
	if len(evidenceItems) == 0 && stringOrEmpty(asMap(packet["report"])["recommendation"]) == "accept-now" {
		return nil
	}
	return map[string]any{
		"id":         "repair-known-failures",
		"changeKind": changeKind,
		"target":     target,
		"summary":    summary,
		"rationale":  fmt.Sprintf("%d regressed scenario(s), %d noisy scenario(s), and %d residual hotspot(s) currently bound the next revision.", len(regressed), len(noisySignals), len(reviewSignals)),
		"evidence":   summarizeChangeEvidence(evidenceItems),
	}
}

func buildSamplingChange(evidence []any) any {
	noisySignals := filterEvidenceBySource(evidence, "report.noisy")
	if len(noisySignals) == 0 {
		return nil
	}
	return map[string]any{
		"id":         "increase-signal",
		"changeKind": "sampling_increase",
		"target":     "adapter",
		"summary":    "Increase signal on noisy scenarios before calling the candidate better.",
		"rationale":  fmt.Sprintf("%d scenario(s) are still noisy.", len(noisySignals)),
		"evidence":   summarizeChangeEvidence(noisySignals),
	}
}

func buildHistoryChange(evidence []any) any {
	historySignals := filterEvidenceBySource(evidence, "scenario_history")
	if len(historySignals) == 0 {
		return nil
	}
	if len(historySignals) > 3 {
		historySignals = historySignals[:3]
	}
	return map[string]any{
		"id":         "focus-unstable-history",
		"changeKind": "history_followup",
		"target":     "workflow",
		"summary":    "Use recent scenario-history misses to choose the next bounded probe.",
		"rationale":  fmt.Sprintf("%d scenario(s) still look unstable in recent train history.", len(historySignals)),
		"evidence":   summarizeChangeEvidence(historySignals),
	}
}

func summarizeChangeEvidence(evidence []any) []any {
	result := []any{}
	for _, rawEvidence := range evidence {
		entry := asMap(rawEvidence)
		result = append(result, map[string]any{
			"source":  entry["source"],
			"key":     entry["key"],
			"summary": entry["summary"],
		})
	}
	return result
}

func buildImproveDecision(packet map[string]any, evidence []any) string {
	if stringOrEmpty(asMap(packet["report"])["recommendation"]) == "accept-now" {
		onlyLow := true
		for _, rawEvidence := range evidence {
			severity := stringOrEmpty(asMap(rawEvidence)["severity"])
			if severity != "low" {
				onlyLow = false
				break
			}
		}
		if onlyLow {
			return "hold"
		}
	}
	if len(evidence) == 0 {
		return "investigate"
	}
	return "revise"
}

func buildRevisionBrief(packet map[string]any, decision string, evidence []any, suggestedChanges []any) string {
	if decision == "hold" {
		return "No bounded revision is recommended. Keep the current candidate as the shipping baseline."
	}
	if decision == "investigate" {
		return "Evidence is too thin for a revision proposal. Gather one explicit report, review summary, or history signal before changing the target."
	}
	target := "prompt"
	if stringOrEmpty(packet["improvementTarget"]) == "adapter" {
		target = "adapter"
	}
	evidenceText := []string{}
	for _, rawEvidence := range evidence {
		evidenceText = append(evidenceText, stringOrEmpty(asMap(rawEvidence)["summary"]))
		if len(evidenceText) == 3 {
			break
		}
	}
	primaryChange := fmt.Sprintf("Revise the %s conservatively.", target)
	if len(suggestedChanges) > 0 {
		primaryChange = stringOrEmpty(asMap(suggestedChanges[0])["summary"])
	}
	intentSummary := stringOrEmpty(asMap(packet["intentProfile"])["summary"])
	if intentSummary == "" {
		intentSummary = stringOrEmpty(asMap(packet["report"])["intent"])
	}
	return fmt.Sprintf("Revise the %s in one bounded pass for %q. %s Evidence: %s. Do not weaken held-out, comparison, or review gates.", target, intentSummary, primaryChange, strings.Join(evidenceText, "; "))
}

func buildProposalRationale(decision string, improver map[string]any, evidence []any) string {
	if decision == "hold" {
		return "Current evidence does not justify another bounded revision."
	}
	return fmt.Sprintf("The next revision is bounded by %d high-signal issue(s) selected under the %s budget plan.", countHighSignalEvidence(evidence), stringOrEmpty(improver["budget"]))
}

func buildFollowUpChecks(decision string, suggestedChanges []any) []string {
	if decision == "hold" && len(suggestedChanges) == 0 {
		return []string{"Preserve the current candidate as the next baseline."}
	}
	return []string{
		"Rerun the bounded iterate probe on the cited surfaces first.",
		"Rerun held-out before accepting the revision.",
		"Rerun comparison and review variants when those surfaces exist for the target repo.",
	}
}

func buildTrialTelemetry(improver map[string]any, evidenceUniverse []map[string]any, prioritizedEvidence []any, deprioritizedEvidence []map[string]any, suggestedChanges []any) map[string]any {
	sourceCounts := map[string]int{
		"regressed":           0,
		"reportReviewFinding": 0,
		"reviewFindings":      0,
		"noisy":               0,
		"compareReasons":      0,
		"historySignals":      0,
		"improved":            0,
	}
	for _, entry := range evidenceUniverse {
		switch stringOrEmpty(entry["source"]) {
		case "report.regressed":
			sourceCounts["regressed"]++
		case "report.review_finding":
			sourceCounts["reportReviewFinding"]++
		case "review.finding":
			sourceCounts["reviewFindings"]++
		case "report.noisy":
			sourceCounts["noisy"]++
		case "report.compare_reason":
			sourceCounts["compareReasons"]++
		case "scenario_history":
			sourceCounts["historySignals"]++
		case "report.improved":
			sourceCounts["improved"]++
		}
	}
	return map[string]any{
		"evidenceItemsSeen":        len(evidenceUniverse),
		"prioritizedEvidenceCount": len(prioritizedEvidence),
		"highSignalEvidenceCount":  countHighSignalEvidence(prioritizedEvidence),
		"suggestedChangeCount":     len(suggestedChanges),
		"sourceCounts":             sourceCounts,
		"deprioritizedEvidence":    summarizeImproveEvidence(deprioritizedEvidence, 3),
		"plan":                     improver["plan"],
	}
}

func summarizeImproveEvidence(evidence []map[string]any, limit int) []any {
	if limit > 0 && len(evidence) > limit {
		evidence = evidence[:limit]
	}
	result := make([]any, 0, len(evidence))
	for _, entry := range evidence {
		result = append(result, map[string]any{
			"source":   entry["source"],
			"key":      entry["key"],
			"severity": entry["severity"],
			"summary":  entry["summary"],
		})
	}
	return result
}

func collectTargetSnapshot(targetFile map[string]any) any {
	path := stringOrEmpty(targetFile["path"])
	if path == "" || !truthy(targetFile["exists"]) {
		return nil
	}
	content, err := os.ReadFile(path)
	if err != nil {
		return nil
	}
	info, err := os.Stat(path)
	if err != nil {
		return nil
	}
	sum := sha256.Sum256(content)
	return map[string]any{
		"path":      path,
		"exists":    true,
		"sha256":    hex.EncodeToString(sum[:]),
		"sizeBytes": info.Size(),
		"lineCount": len(strings.Split(string(content), "\n")) - 1,
	}
}

func summarizeOptionalPath(value any) any {
	path := stringOrEmpty(value)
	if path == "" {
		return nil
	}
	return map[string]any{"path": path, "exists": fileExists(path)}
}

func numberOrDefault(value any, fallback float64) float64 {
	if number, ok := toFloat(value); ok {
		return number
	}
	return fallback
}

func indexOf(values []string, target string) int {
	for index, value := range values {
		if value == target {
			return index
		}
	}
	return len(values)
}

func countHighSignalEvidence(evidence []any) int {
	count := 0
	for _, rawEvidence := range evidence {
		severity := stringOrEmpty(asMap(rawEvidence)["severity"])
		if severity == "high" || severity == "blocker" {
			count++
		}
	}
	return count
}

func filterEvidenceBySource(evidence []any, source string) []any {
	result := []any{}
	for _, rawEvidence := range evidence {
		if stringOrEmpty(asMap(rawEvidence)["source"]) == source {
			result = append(result, rawEvidence)
		}
	}
	return result
}

func firstNonNil(values ...any) any {
	for _, value := range values {
		if value != nil {
			return value
		}
	}
	return nil
}
