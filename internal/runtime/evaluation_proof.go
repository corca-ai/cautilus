package runtime

import "strings"

func EvalSurfaceKey(surface string, preset string) string {
	surface = strings.TrimSpace(surface)
	preset = strings.TrimSpace(preset)
	if surface == "" {
		return ""
	}
	if preset == "" {
		return surface
	}
	return surface + "/" + preset
}

func RequiresProductRunnerProof(surface string) bool {
	switch strings.TrimSpace(surface) {
	case "app/chat", "app/prompt":
		return true
	default:
		return false
	}
}

func BuildClaimProofRequirement(surface string) map[string]any {
	surface = strings.TrimSpace(surface)
	if surface == "" {
		surface = "dev/repo"
	}
	requirement := map[string]any{
		"proofMechanism":             "cautilus-eval",
		"recommendedEvalSurface":     surface,
		"requiredRunnerCapability":   requiredRunnerCapability(surface),
		"requiredObservability":      stringArrayToAny(requiredObservability(surface)),
		"requiresProductRunnerProof": RequiresProductRunnerProof(surface),
	}
	if RequiresProductRunnerProof(surface) {
		requirement["minimumProofClasses"] = []any{"in-process-product-runner", "live-product-runner"}
	} else {
		requirement["minimumProofClasses"] = []any{"fixture-smoke", "coding-agent-messaging", "declared-eval-runner"}
	}
	return requirement
}

func BuildEvaluationProofFromRunnerReadiness(readiness map[string]any, targetSurface string, runtimeName string) map[string]any {
	return BuildEvaluationProofFromRunnerReadinessWithObserved(readiness, targetSurface, runtimeName, nil)
}

func BuildEvaluationProofFromRunnerReadinessWithObserved(readiness map[string]any, targetSurface string, runtimeName string, observed map[string]any) map[string]any {
	proofClass := strings.TrimSpace(stringOrEmpty(readiness["proofClass"]))
	proofClassSource := strings.TrimSpace(stringOrEmpty(readiness["proofClassSource"]))
	if proofClass == "" || proofClass == "unknown" {
		proofClass = "declared-eval-runner"
		proofClassSource = "adapter-template"
	}
	declaredProofClass := strings.TrimSpace(stringOrEmpty(readiness["declaredProofClass"]))
	declaredProofClassSource := strings.TrimSpace(stringOrEmpty(readiness["declaredProofClassSource"]))
	proof := map[string]any{
		"proofClass":                 proofClass,
		"proofClassSource":           proofClassSource,
		"runnerId":                   firstNonEmptyString(readiness["runnerId"], defaultRunnerID),
		"runnerAssessmentState":      firstNonEmptyString(readiness["state"], "unknown"),
		"assessmentPath":             readiness["assessmentPath"],
		"targetSurface":              targetSurface,
		"requiresProductRunnerProof": RequiresProductRunnerProof(targetSurface),
	}
	if runtimeName = strings.TrimSpace(runtimeName); runtimeName != "" {
		proof["runtime"] = runtimeName
	}
	if declaredProofClass != "" && declaredProofClass != "unknown" {
		proof["declaredProofClass"] = declaredProofClass
		proof["declaredProofClassSource"] = firstNonEmptyString(declaredProofClassSource, "adapter-runner")
	}
	if runtimeName == "fixture" && proofClass != "fixture-smoke" {
		proof["declaredProofClass"] = firstNonEmptyString(declaredProofClass, proofClass)
		proof["declaredProofClassSource"] = firstNonEmptyString(declaredProofClassSource, proofClassSource)
		proof["proofClass"] = "fixture-smoke"
		proof["proofClassSource"] = "runtime"
	} else if runtimeName != "" && runtimeName != "fixture" && canRuntimePromoteDevProof(targetSurface, proofClass, declaredProofClass, runtimeName, observed) {
		proof["assessmentProofClass"] = proofClass
		proof["assessmentProofClassSource"] = proofClassSource
		proof["proofClass"] = declaredProofClass
		proof["proofClassSource"] = "runtime"
	}
	if recommendation := strings.TrimSpace(stringOrEmpty(readiness["recommendation"])); recommendation != "" {
		proof["runnerAssessmentRecommendation"] = recommendation
	}
	if effective := strings.TrimSpace(stringOrEmpty(readiness["effectiveRecommendation"])); effective != "" {
		proof["effectiveRecommendation"] = effective
	}
	if runnerVerification := asMap(readiness["runnerVerification"]); len(runnerVerification) > 0 {
		proof["runnerVerification"] = runnerVerification
	}
	if blockers := evaluationProofSurfaceBlockers(readiness, targetSurface); len(blockers) > 0 {
		proof["proofBlockers"] = blockers
	}
	proof["productProofReady"] = evaluationProofProductReady(proof)
	return proof
}

func MergeEvaluationProof(existing any, fromReadiness map[string]any) map[string]any {
	result := map[string]any{}
	for key, value := range asMap(existing) {
		result[key] = value
	}
	for key, value := range fromReadiness {
		result[key] = value
	}
	result["productProofReady"] = evaluationProofProductReady(result)
	return result
}

func EvaluationProofFromInput(input map[string]any) map[string]any {
	proof := asMap(input["proof"])
	if len(proof) == 0 {
		return nil
	}
	normalized := map[string]any{}
	for _, key := range []string{
		"proofClass",
		"proofClassSource",
		"runnerId",
		"runnerAssessmentState",
		"runnerAssessmentRecommendation",
		"effectiveRecommendation",
		"assessmentPath",
		"targetSurface",
		"runtime",
		"requiresProductRunnerProof",
		"productProofReady",
		"declaredProofClass",
		"declaredProofClassSource",
		"assessmentProofClass",
		"assessmentProofClassSource",
		"runnerVerification",
		"proofRequirement",
		"proofBlockers",
	} {
		if key == "productProofReady" {
			continue
		}
		if value, exists := proof[key]; exists {
			normalized[key] = value
		}
	}
	if targetSurface := strings.TrimSpace(stringOrEmpty(normalized["targetSurface"])); targetSurface != "" {
		normalized["requiresProductRunnerProof"] = RequiresProductRunnerProof(targetSurface)
	}
	normalized["productProofReady"] = evaluationProofProductReady(normalized)
	return normalized
}

func SummarizeReportProof(modeSummaries []any) map[string]any {
	proofs := []any{}
	blocking := []any{}
	counts := map[string]int{}
	requiresProductProof := false
	for _, raw := range modeSummaries {
		modeSummary := asMap(raw)
		proof := asMap(modeSummary["proof"])
		if len(proof) == 0 {
			continue
		}
		proofs = append(proofs, proof)
		proofClass := firstNonEmptyString(proof["proofClass"], "unknown")
		counts[proofClass]++
		if truthy(proof["requiresProductRunnerProof"]) {
			requiresProductProof = true
			if !truthy(proof["productProofReady"]) {
				blocking = append(blocking, map[string]any{
					"mode":                  modeSummary["mode"],
					"targetSurface":         proof["targetSurface"],
					"proofClass":            proofClass,
					"runnerAssessmentState": proof["runnerAssessmentState"],
					"reason":                "product-runner-proof-not-ready",
				})
			}
		}
	}
	if len(proofs) == 0 {
		return nil
	}
	classCounts := map[string]any{}
	for class, count := range counts {
		classCounts[class] = count
	}
	readiness := "not-required"
	if requiresProductProof {
		readiness = "ready"
		if len(blocking) > 0 {
			readiness = "blocked"
		}
	}
	return map[string]any{
		"proofCount":                  len(proofs),
		"proofClassCounts":            classCounts,
		"requiresProductRunnerProof":  requiresProductProof,
		"productRunnerProofReadiness": readiness,
		"blockingReasons":             blocking,
	}
}

func canRuntimePromoteDevProof(targetSurface string, proofClass string, declaredProofClass string, runtimeName string, observed map[string]any) bool {
	if targetSurface != "dev/repo" && targetSurface != "dev/skill" {
		return false
	}
	if proofClass != "fixture-smoke" || declaredProofClass != "coding-agent-messaging" {
		return false
	}
	expectedRuntime := map[string]string{
		"codex":  "codex_exec",
		"claude": "claude_code",
	}[runtimeName]
	if expectedRuntime == "" {
		return false
	}
	return observedIncludesTelemetryRuntime(observed, expectedRuntime)
}

func observedIncludesTelemetryRuntime(observed map[string]any, expectedRuntime string) bool {
	for _, raw := range arrayOrEmpty(observed["evaluations"]) {
		telemetry := asMap(asMap(raw)["telemetry"])
		if strings.TrimSpace(stringOrEmpty(telemetry["runtime"])) == expectedRuntime {
			return true
		}
	}
	return false
}

func requiredRunnerCapability(surface string) string {
	switch surface {
	case "app/chat":
		return "headless-product-chat-runner"
	case "app/prompt":
		return "headless-product-prompt-runner"
	case "dev/skill":
		return "development-skill-eval-runner"
	default:
		return "development-repo-eval-runner"
	}
}

func requiredObservability(surface string) []string {
	switch surface {
	case "app/chat":
		return []string{"normalizedMessages", "transcript", "finalText", "runtimeFingerprint"}
	case "app/prompt":
		return []string{"input", "finalText", "runtimeFingerprint"}
	case "dev/skill":
		return []string{"trigger", "execution", "loadedInstructionFiles", "runtimeFingerprint"}
	default:
		return []string{"loadedInstructionFiles", "routingDecision", "runtimeFingerprint"}
	}
}

func evaluationProofProductReady(proof map[string]any) bool {
	if !truthy(proof["requiresProductRunnerProof"]) {
		return true
	}
	if len(arrayOrEmpty(proof["proofBlockers"])) > 0 {
		return false
	}
	proofClass := strings.TrimSpace(stringOrEmpty(proof["proofClass"]))
	if proofClass != "in-process-product-runner" && proofClass != "live-product-runner" {
		return false
	}
	if effective := strings.TrimSpace(stringOrEmpty(proof["effectiveRecommendation"])); effective == "blocked" {
		return false
	}
	if strings.TrimSpace(stringOrEmpty(proof["runnerAssessmentState"])) != "assessed" {
		return false
	}
	if strings.TrimSpace(stringOrEmpty(proof["runnerAssessmentRecommendation"])) != "ready-for-selected-surface" {
		return false
	}
	return strings.TrimSpace(stringOrEmpty(asMap(proof["runnerVerification"])["capabilityState"])) == "ready"
}

func evaluationProofSurfaceBlockers(readiness map[string]any, targetSurface string) []any {
	targetSurface = strings.TrimSpace(targetSurface)
	if targetSurface == "" {
		return []any{}
	}
	assessment := asMap(readiness["assessment"])
	if len(assessment) == 0 {
		return []any{}
	}
	blockers := []any{}
	if surface := strings.TrimSpace(stringOrEmpty(assessment["surface"])); surface != "" && surface != targetSurface {
		blockers = append(blockers, map[string]any{
			"reason":   "assessment-surface-mismatch",
			"expected": targetSurface,
			"actual":   surface,
		})
	}
	requirement := asMap(assessment["assessedRequirement"])
	if surface := strings.TrimSpace(stringOrEmpty(requirement["recommendedEvalSurface"])); surface != "" && surface != targetSurface {
		blockers = append(blockers, map[string]any{
			"reason":   "assessment-requirement-surface-mismatch",
			"expected": targetSurface,
			"actual":   surface,
		})
	}
	return blockers
}
