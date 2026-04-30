package runtime

import (
	"path/filepath"
	"strings"

	"github.com/corca-ai/cautilus/internal/contracts"
)

const defaultRunnerID = "default-eval-runner"

var runnerAssessmentProofClasses = map[string]bool{
	"fixture-smoke":             true,
	"coding-agent-messaging":    true,
	"in-process-product-runner": true,
	"live-product-runner":       true,
}

var runnerAssessmentRecommendations = map[string]bool{
	"ready-for-selected-surface":  true,
	"smoke-only":                  true,
	"needs-instrumentation":       true,
	"needs-production-path-reuse": true,
	"blocked":                     true,
}

var runnerAssessmentSurfaces = map[string]bool{
	"dev/repo":   true,
	"dev/skill":  true,
	"app/chat":   true,
	"app/prompt": true,
}

var requiredProductRunnerVerificationLegs = []string{
	"inputSimulation",
	"externalSubstitution",
	"triggerControl",
	"externalObservation",
}

var optionalRunnerVerificationLegs = map[string]bool{
	"inputSimulation":      true,
	"externalSubstitution": true,
	"triggerControl":       true,
	"externalObservation":  true,
	"reset":                true,
	"fingerprint":          true,
	"stateReusePolicy":     true,
}

var runnerVerificationLegStates = map[string]bool{
	"present":      true,
	"missing":      true,
	"not-required": true,
	"unknown":      true,
}

func BuildRunnerReadiness(repoRoot string, adapter *AdapterPayload) map[string]any {
	result := map[string]any{
		"state":              "unknown",
		"runnerDeclared":     false,
		"runnerId":           defaultRunnerID,
		"assessmentPath":     defaultRunnerAssessmentPath(defaultRunnerID),
		"assessmentRequired": true,
		"proofClass":         "unknown",
		"proofClassSource":   "none",
		"nextBranch":         runnerReadinessBranch("bind_runner_metadata", "Bind runner metadata", "No valid adapter eval runner is declared yet.", "", false),
		"notice":             "Plain eval_test_command_templates imply only declared-eval-runner, not a product proof class.",
		"scaffoldSource":     "fixtures/runner-readiness/example-assessment.json",
	}
	if adapter == nil || !adapter.Found || !adapter.Valid {
		result["state"] = "unknown"
		result["reason"] = "adapter-not-ready"
		return result
	}
	templates := stringArrayOrEmpty(adapter.Data["eval_test_command_templates"])
	if len(templates) == 0 {
		result["state"] = "unknown"
		result["reason"] = "runner-template-missing"
		return result
	}
	result["runnerDeclared"] = true
	result["declaredRunnerKind"] = "declared-eval-runner"
	assessmentPath := defaultRunnerAssessmentPath(defaultRunnerID)
	result["assessmentPath"] = assessmentPath
	resolvedAssessmentPath := filepath.Join(repoRoot, filepath.FromSlash(assessmentPath))
	if !fileExists(resolvedAssessmentPath) {
		result["state"] = "missing-assessment"
		result["reason"] = "runner-assessment-missing"
		result["nextBranch"] = runnerReadinessBranch(
			"create_runner_assessment",
			"Create the runner assessment",
			"The adapter declares an eval runner, but no runner assessment exists yet.",
			assessmentPath,
			true,
		)
		return result
	}
	assessment, err := readJSONFile(resolvedAssessmentPath)
	if err != nil {
		result["state"] = "unknown"
		result["reason"] = "runner-assessment-invalid-json"
		result["error"] = err.Error()
		result["nextBranch"] = runnerReadinessBranch(
			"repair_runner_assessment",
			"Repair the runner assessment",
			"The runner assessment exists but cannot be parsed as JSON.",
			assessmentPath,
			true,
		)
		return result
	}
	result["assessment"] = summarizeRunnerAssessment(assessment)
	validationIssues := validateRunnerAssessmentShape(assessment)
	validationIssues = append(validationIssues, validateRunnerAssessmentBinding(repoRoot, adapter, assessment)...)
	if len(validationIssues) > 0 {
		result["state"] = "unknown"
		result["reason"] = "runner-assessment-invalid"
		result["issues"] = validationIssues
		result["nextBranch"] = runnerReadinessBranch(
			"repair_runner_assessment",
			"Repair the runner assessment",
			"The runner assessment is present but does not match the minimal schema.",
			assessmentPath,
			true,
		)
		return result
	}
	staleReasons := runnerAssessmentStaleReasons(repoRoot, adapter, assessment)
	if len(staleReasons) > 0 {
		result["state"] = "stale"
		result["reason"] = "runner-assessment-stale"
		result["staleReasons"] = staleReasons
		result["proofClass"] = firstNonEmptyString(assessment["proofClass"], "unknown")
		result["proofClassSource"] = "assessment"
		result["nextBranch"] = runnerReadinessBranch(
			"refresh_runner_assessment",
			"Refresh the runner assessment",
			"The runner assessment was made against older repo, adapter, or runner file state.",
			assessmentPath,
			true,
		)
		return result
	}
	proofClass := firstNonEmptyString(assessment["proofClass"], "unknown")
	recommendation := firstNonEmptyString(assessment["recommendation"], "blocked")
	result["proofClass"] = proofClass
	result["proofClassSource"] = "assessment"
	result["recommendation"] = recommendation
	result["knownGaps"] = firstNonNil(assessment["knownGaps"], []any{})
	result["runnerVerification"] = summarizeRunnerVerification(assessment, proofClass, recommendation)
	verificationIssues := runnerVerificationReadinessIssues(assessment, proofClass, recommendation)
	if len(verificationIssues) > 0 {
		result["state"] = "assessed"
		result["reason"] = "runner-assessment-missing-verification-capabilities"
		result["effectiveRecommendation"] = "blocked"
		result["verificationIssues"] = verificationIssues
		result["nextBranch"] = runnerReadinessBranch(
			"upgrade_runner_assessment",
			"Upgrade runner assessment before product-behavior proof",
			"The assessment claims product-proof readiness, but required runner verification capability evidence is missing.",
			assessmentPath,
			true,
		)
		return result
	}
	switch recommendation {
	case "ready-for-selected-surface":
		result["state"] = "assessed"
		result["reason"] = "runner-assessment-ready"
		result["nextBranch"] = runnerReadinessBranch(
			"run_eval_with_assessed_runner",
			"Run eval with the assessed runner",
			"The runner assessment is current and scoped to the selected requirement.",
			"",
			false,
		)
	case "smoke-only":
		result["state"] = "smoke-only"
		result["reason"] = "runner-assessment-smoke-only"
		result["nextBranch"] = runnerReadinessBranch(
			"upgrade_runner_assessment",
			"Upgrade runner assessment before product-behavior proof",
			"The current assessment says this runner is only suitable for smoke validation.",
			assessmentPath,
			true,
		)
	default:
		result["state"] = "assessed"
		result["reason"] = "runner-assessment-not-ready"
		result["nextBranch"] = runnerReadinessBranch(
			"address_runner_assessment_gaps",
			"Address runner assessment gaps",
			"The runner assessment is current but not ready for selected product-behavior proof.",
			assessmentPath,
			true,
		)
	}
	return result
}

func defaultRunnerAssessmentPath(runnerID string) string {
	return filepath.ToSlash(filepath.Join(".cautilus", "runners", runnerID+".assessment.json"))
}

func runnerReadinessBranch(id string, label string, reason string, artifactPath string, writesFiles bool) map[string]any {
	branch := map[string]any{
		"id":            id,
		"label":         label,
		"reason":        reason,
		"writesFiles":   writesFiles,
		"owningSurface": "setup/readiness",
		"runnerId":      defaultRunnerID,
	}
	if strings.TrimSpace(artifactPath) != "" {
		branch["artifactPath"] = artifactPath
	}
	if id == "create_runner_assessment" || id == "upgrade_runner_assessment" || id == "repair_runner_assessment" {
		branch["scaffoldSource"] = "fixtures/runner-readiness/example-assessment.json"
		branch["scopeNote"] = "Fill or refresh the assessment after a selected proof requirement is known; plain eval templates remain only declared-eval-runner evidence."
	}
	return branch
}

func summarizeRunnerAssessment(assessment map[string]any) map[string]any {
	summary := map[string]any{
		"schemaVersion":   assessment["schemaVersion"],
		"runnerId":        assessment["runnerId"],
		"surface":         assessment["surface"],
		"proofClass":      assessment["proofClass"],
		"recommendation":  assessment["recommendation"],
		"repoCommit":      assessment["repoCommit"],
		"adapterPath":     assessment["adapterPath"],
		"adapterHash":     assessment["adapterHash"],
		"assessedAt":      assessment["assessedAt"],
		"assessedBy":      assessment["assessedBy"],
		"knownGaps":       firstNonNil(assessment["knownGaps"], []any{}),
		"runnerFileCount": len(arrayOrEmpty(assessment["runnerFiles"])),
	}
	if caps := summarizeRunnerVerification(assessment, firstNonEmptyString(assessment["proofClass"], "unknown"), firstNonEmptyString(assessment["recommendation"], "blocked")); len(caps) > 0 {
		summary["runnerVerification"] = caps
	}
	return summary
}

func validateRunnerAssessmentShape(assessment map[string]any) []any {
	issues := []any{}
	requiredStrings := []string{
		"schemaVersion",
		"runnerId",
		"surface",
		"proofClass",
		"assessedBy",
		"assessedAt",
		"repoCommit",
		"adapterPath",
		"adapterHash",
		"recommendation",
	}
	for _, field := range requiredStrings {
		if strings.TrimSpace(stringOrEmpty(assessment[field])) == "" {
			issues = append(issues, map[string]any{"field": field, "message": field + " must be a non-empty string"})
		}
	}
	if assessment["schemaVersion"] != contracts.RunnerAssessmentSchema {
		issues = append(issues, map[string]any{"field": "schemaVersion", "message": "schemaVersion must be " + contracts.RunnerAssessmentSchema})
	}
	if surface := strings.TrimSpace(stringOrEmpty(assessment["surface"])); surface != "" && !runnerAssessmentSurfaces[surface] {
		issues = append(issues, map[string]any{"field": "surface", "message": "surface must be one of: dev/repo, dev/skill, app/chat, app/prompt"})
	}
	if proofClass := strings.TrimSpace(stringOrEmpty(assessment["proofClass"])); proofClass != "" && !runnerAssessmentProofClasses[proofClass] {
		issues = append(issues, map[string]any{"field": "proofClass", "message": "proofClass must be a known runner proof class"})
	}
	if recommendation := strings.TrimSpace(stringOrEmpty(assessment["recommendation"])); recommendation != "" && !runnerAssessmentRecommendations[recommendation] {
		issues = append(issues, map[string]any{"field": "recommendation", "message": "recommendation must be a known runner assessment recommendation"})
	}
	if len(arrayOrEmpty(assessment["runnerFiles"])) == 0 {
		issues = append(issues, map[string]any{"field": "runnerFiles", "message": "runnerFiles must contain at least one file hash"})
	}
	for index, raw := range arrayOrEmpty(assessment["runnerFiles"]) {
		record := asMap(raw)
		if strings.TrimSpace(stringOrEmpty(record["path"])) == "" {
			issues = append(issues, map[string]any{"field": "runnerFiles", "index": index, "message": "runnerFiles[].path must be non-empty"})
		}
		if strings.TrimSpace(stringOrEmpty(record["sha256"])) == "" {
			issues = append(issues, map[string]any{"field": "runnerFiles", "index": index, "message": "runnerFiles[].sha256 must be non-empty"})
		}
	}
	if len(arrayOrEmpty(assessment["claims"])) == 0 {
		issues = append(issues, map[string]any{"field": "claims", "message": "claims must contain at least one scoped claim record"})
	}
	requirement := asMap(assessment["assessedRequirement"])
	if len(requirement) == 0 {
		issues = append(issues, map[string]any{"field": "assessedRequirement", "message": "assessedRequirement must be an object"})
	} else {
		for _, field := range []string{"proofMechanism", "recommendedEvalSurface", "requiredRunnerCapability"} {
			if strings.TrimSpace(stringOrEmpty(requirement[field])) == "" {
				issues = append(issues, map[string]any{"field": "assessedRequirement." + field, "message": "assessedRequirement." + field + " must be a non-empty string"})
			}
		}
		if len(arrayOrEmpty(requirement["requiredObservability"])) == 0 {
			issues = append(issues, map[string]any{"field": "assessedRequirement.requiredObservability", "message": "assessedRequirement.requiredObservability must contain at least one item"})
		}
	}
	if len(asMap(assessment["productionPathReuse"])) == 0 {
		issues = append(issues, map[string]any{"field": "productionPathReuse", "message": "productionPathReuse must be an object"})
	}
	if len(asMap(assessment["observability"])) == 0 {
		issues = append(issues, map[string]any{"field": "observability", "message": "observability must be an object"})
	}
	if _, ok := assessment["knownGaps"].([]any); !ok {
		issues = append(issues, map[string]any{"field": "knownGaps", "message": "knownGaps must be an array"})
	}
	issues = append(issues, validateRunnerVerificationCapabilitiesShape(assessment)...)
	return issues
}

func validateRunnerAssessmentBinding(repoRoot string, adapter *AdapterPayload, assessment map[string]any) []any {
	issues := []any{}
	if runnerID := strings.TrimSpace(stringOrEmpty(assessment["runnerId"])); runnerID != "" && runnerID != defaultRunnerID {
		issues = append(issues, map[string]any{"field": "runnerId", "message": "plain eval_test_command_templates currently bind only " + defaultRunnerID})
	}
	if adapter != nil {
		expectedPath := repoRelativePath(repoRoot, stringOrEmpty(adapter.Path))
		if expectedPath != "" && strings.TrimSpace(stringOrEmpty(assessment["adapterPath"])) != expectedPath {
			issues = append(issues, map[string]any{"field": "adapterPath", "message": "adapterPath must match the loaded adapter path", "expected": expectedPath, "actual": assessment["adapterPath"]})
		}
	}
	return issues
}

func validateRunnerVerificationCapabilitiesShape(assessment map[string]any) []any {
	issues := []any{}
	raw, present := assessment["verificationCapabilities"]
	if !present {
		return issues
	}
	caps := asMap(raw)
	if len(caps) == 0 {
		issues = append(issues, map[string]any{"field": "verificationCapabilities", "message": "verificationCapabilities must be an object when present"})
		return issues
	}
	for legName, rawLeg := range caps {
		leg := asMap(rawLeg)
		if len(leg) == 0 {
			issues = append(issues, map[string]any{"field": "verificationCapabilities." + legName, "message": "capability leg must be an object"})
			continue
		}
		if !optionalRunnerVerificationLegs[legName] {
			issues = append(issues, map[string]any{"field": "verificationCapabilities." + legName, "message": "capability leg is not part of the runner verification vocabulary"})
		}
		state := strings.TrimSpace(stringOrEmpty(leg["state"]))
		if state == "" {
			issues = append(issues, map[string]any{"field": "verificationCapabilities." + legName + ".state", "message": "capability leg state must be a non-empty string"})
		} else if !runnerVerificationLegStates[state] {
			issues = append(issues, map[string]any{"field": "verificationCapabilities." + legName + ".state", "message": "capability leg state must be one of: present, missing, not-required, unknown"})
		}
		if state == "present" && strings.TrimSpace(stringOrEmpty(leg["summary"])) == "" {
			issues = append(issues, map[string]any{"field": "verificationCapabilities." + legName + ".summary", "message": "present capability legs must include a summary"})
		}
		if state == "not-required" && strings.TrimSpace(stringOrEmpty(leg["reason"])) == "" {
			issues = append(issues, map[string]any{"field": "verificationCapabilities." + legName + ".reason", "message": "not-required capability legs must include a reason"})
		}
		if rawRefs, exists := leg["evidenceRefs"]; exists {
			if _, ok := rawRefs.([]any); !ok {
				issues = append(issues, map[string]any{"field": "verificationCapabilities." + legName + ".evidenceRefs", "message": "evidenceRefs must be an array when present"})
			}
		}
		if rawGaps, exists := leg["knownGaps"]; exists {
			if _, ok := rawGaps.([]any); !ok {
				issues = append(issues, map[string]any{"field": "verificationCapabilities." + legName + ".knownGaps", "message": "knownGaps must be an array when present"})
			}
		}
	}
	return issues
}

func summarizeRunnerVerification(assessment map[string]any, proofClass string, recommendation string) map[string]any {
	required := requiresProductRunnerVerification(proofClass, recommendation)
	summary := map[string]any{
		"requiredForProductProof": required,
		"requiredLegs":            stringArrayToAny(requiredProductRunnerVerificationLegs),
		"capabilityState":         "not-required",
		"legs":                    map[string]any{},
	}
	caps := asMap(assessment["verificationCapabilities"])
	if len(caps) == 0 {
		if required {
			summary["capabilityState"] = "missing"
		} else {
			summary["capabilityState"] = "not-provided"
		}
		return summary
	}
	legs := map[string]any{}
	presentCount := 0
	notRequiredCount := 0
	missingCount := 0
	unknownCount := 0
	for legName, rawLeg := range caps {
		leg := asMap(rawLeg)
		state := strings.TrimSpace(stringOrEmpty(leg["state"]))
		legs[legName] = state
		switch state {
		case "present":
			presentCount++
		case "not-required":
			notRequiredCount++
		case "missing":
			missingCount++
		default:
			unknownCount++
		}
	}
	summary["legs"] = legs
	summary["counts"] = map[string]any{
		"present":     presentCount,
		"notRequired": notRequiredCount,
		"missing":     missingCount,
		"unknown":     unknownCount,
	}
	issues := runnerVerificationReadinessIssues(assessment, proofClass, recommendation)
	if len(issues) > 0 {
		summary["capabilityState"] = "missing-capabilities"
		summary["missingRequiredLegs"] = issues
	} else if required {
		summary["capabilityState"] = "ready"
	} else {
		summary["capabilityState"] = "provided"
	}
	return summary
}

func runnerVerificationReadinessIssues(assessment map[string]any, proofClass string, recommendation string) []any {
	if !requiresProductRunnerVerification(proofClass, recommendation) {
		return []any{}
	}
	issues := []any{}
	caps := asMap(assessment["verificationCapabilities"])
	for _, legName := range requiredProductRunnerVerificationLegs {
		leg := asMap(caps[legName])
		state := strings.TrimSpace(stringOrEmpty(leg["state"]))
		switch state {
		case "present":
			continue
		case "not-required":
			if strings.TrimSpace(stringOrEmpty(leg["reason"])) != "" {
				continue
			}
			issues = append(issues, map[string]any{"leg": legName, "reason": "not-required leg is missing a reason"})
		case "":
			issues = append(issues, map[string]any{"leg": legName, "reason": "required capability leg is missing"})
		default:
			issues = append(issues, map[string]any{"leg": legName, "state": state, "reason": "required capability leg must be present or explicitly not-required"})
		}
	}
	return issues
}

func requiresProductRunnerVerification(proofClass string, recommendation string) bool {
	if recommendation != "ready-for-selected-surface" {
		return false
	}
	return proofClass == "in-process-product-runner" || proofClass == "live-product-runner"
}

func repoRelativePath(repoRoot string, path string) string {
	if strings.TrimSpace(path) == "" {
		return ""
	}
	relPath, err := filepath.Rel(repoRoot, path)
	if err != nil {
		return filepath.ToSlash(path)
	}
	return filepath.ToSlash(relPath)
}

func runnerAssessmentStaleReasons(repoRoot string, adapter *AdapterPayload, assessment map[string]any) []any {
	reasons := []any{}
	if commit := currentGitCommit(repoRoot); commit != "" && commit != stringOrEmpty(assessment["repoCommit"]) {
		reasons = append(reasons, map[string]any{"kind": "repoCommit", "expected": assessment["repoCommit"], "current": commit})
	}
	if adapterPath := stringOrEmpty(adapter.Path); adapterPath != "" {
		if hash, err := fileSHA256(adapterPath); err != nil {
			reasons = append(reasons, map[string]any{"kind": "adapterHash", "path": adapterPath, "error": err.Error()})
		} else if hash != stringOrEmpty(assessment["adapterHash"]) {
			reasons = append(reasons, map[string]any{"kind": "adapterHash", "path": adapterPath, "expected": assessment["adapterHash"], "current": hash})
		}
	}
	for _, raw := range arrayOrEmpty(assessment["runnerFiles"]) {
		record := asMap(raw)
		relPath := strings.TrimSpace(stringOrEmpty(record["path"]))
		if relPath == "" {
			continue
		}
		absPath := filepath.Join(repoRoot, filepath.FromSlash(relPath))
		hash, err := fileSHA256(absPath)
		if err != nil {
			reasons = append(reasons, map[string]any{"kind": "runnerFile", "path": relPath, "error": err.Error()})
			continue
		}
		if hash != stringOrEmpty(record["sha256"]) {
			reasons = append(reasons, map[string]any{"kind": "runnerFile", "path": relPath, "expected": record["sha256"], "current": hash})
		}
	}
	return reasons
}
