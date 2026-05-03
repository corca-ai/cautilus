package runtime

import (
	"fmt"
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
	return buildRunnerReadiness(repoRoot, adapter, "")
}

func BuildRunnerReadinessForSurface(repoRoot string, adapter *AdapterPayload, targetSurface string) map[string]any {
	return buildRunnerReadiness(repoRoot, adapter, targetSurface)
}

func ResolveEvalRunner(adapter *AdapterPayload, targetSurface string) (map[string]any, error) {
	targetSurface = strings.TrimSpace(targetSurface)
	runners := adapterRunnerBindings(adapter)
	typedRunnerCount := 0
	for _, runner := range runners {
		if truthy(runner["typed"]) {
			typedRunnerCount++
		}
	}
	if typedRunnerCount > 0 {
		for _, runner := range runners {
			if runnerSupportsSurface(runner, targetSurface) {
				return runner, nil
			}
		}
		if targetSurface == "" && len(runners) > 0 {
			return runners[0], nil
		}
		return nil, fmt.Errorf("adapter runner_readiness.runners has no runner for target surface %q", targetSurface)
	}
	if len(runners) > 0 {
		return runners[0], nil
	}
	return nil, fmt.Errorf("adapter does not define an eval runner")
}

func EvalRunnerCommandTemplates(runner map[string]any) []string {
	return stringArrayOrEmpty(runner["commandTemplates"])
}

func EvalRunnerDefaultRuntime(runner map[string]any) string {
	return strings.TrimSpace(stringOrEmpty(runner["defaultRuntime"]))
}

func buildRunnerReadiness(repoRoot string, adapter *AdapterPayload, targetSurface string) map[string]any {
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
	runners := adapterRunnerBindings(adapter)
	if len(runners) == 0 {
		result["state"] = "unknown"
		result["reason"] = "runner-template-missing"
		result["nextBranch"] = runnerReadinessBranchForRunner(defaultRunnerID, "bind_runner_metadata", "Bind runner metadata", "No valid adapter eval runner is declared yet.", stringFromAny(adapter.Path), true)
		return result
	}
	if strings.TrimSpace(targetSurface) != "" {
		runner, err := ResolveEvalRunner(adapter, targetSurface)
		if err != nil {
			result["state"] = "unknown"
			result["reason"] = "runner-surface-missing"
			result["targetSurface"] = targetSurface
			result["availableRunners"] = runnerSummaries(runners)
			result["nextBranch"] = runnerReadinessBranchForRunner(defaultRunnerID, "bind_runner_metadata", "Bind runner metadata", "No adapter runner supports the selected evaluation surface.", stringFromAny(adapter.Path), true)
			return result
		}
		return buildRunnerReadinessForRunner(repoRoot, adapter, runner, targetSurface)
	}
	readinesses := []any{}
	for _, runner := range runners {
		readinesses = append(readinesses, buildRunnerReadinessForRunner(repoRoot, adapter, runner, ""))
	}
	primary := cloneMap(selectPrimaryRunnerReadiness(readinesses))
	primary["runners"] = readinesses
	primary["runnerCount"] = len(readinesses)
	return primary
}

func buildRunnerReadinessForRunner(repoRoot string, adapter *AdapterPayload, runner map[string]any, targetSurface string) map[string]any {
	runnerID := firstNonEmptyString(runner["runnerId"], defaultRunnerID)
	assessmentPath := firstNonEmptyString(runner["assessmentPath"], defaultRunnerAssessmentPath(runnerID))
	proofClass := firstNonEmptyString(runner["proofClass"], "unknown")
	proofClassSource := firstNonEmptyString(runner["proofClassSource"], "none")
	result := map[string]any{
		"state":              "unknown",
		"runnerDeclared":     false,
		"runnerId":           runnerID,
		"surfaces":           firstNonNil(runner["surfaces"], []any{}),
		"assessmentPath":     assessmentPath,
		"assessmentRequired": true,
		"proofClass":         proofClass,
		"proofClassSource":   proofClassSource,
		"nextBranch":         runnerReadinessBranchForRunner(runnerID, "bind_runner_metadata", "Bind runner metadata", "No valid adapter eval runner is declared yet.", "", false),
		"notice":             "Plain eval_test_command_templates imply only declared-eval-runner, not a product proof class.",
		"scaffoldSource":     "fixtures/runner-readiness/example-assessment.json",
	}
	if proofClass != "" && proofClass != "unknown" {
		result["declaredProofClass"] = proofClass
		result["declaredProofClassSource"] = proofClassSource
	}
	if strings.TrimSpace(targetSurface) != "" {
		result["targetSurface"] = targetSurface
	}
	result["runnerDeclared"] = true
	result["declaredRunnerKind"] = firstNonEmptyString(runner["declaredRunnerKind"], "declared-eval-runner")
	if smokeTemplate := strings.TrimSpace(stringOrEmpty(runner["smokeCommandTemplate"])); smokeTemplate != "" {
		result["smokeCommandTemplate"] = smokeTemplate
		result["smokeBranch"] = runnerSmokeBranchForRunner(runnerID, smokeTemplate)
	}
	if truthy(runner["typed"]) {
		result["notice"] = "Typed adapter runners bind surfaces to command templates; product-proof readiness still requires a current runner assessment."
	}
	resolvedAssessmentPath := filepath.Join(repoRoot, filepath.FromSlash(assessmentPath))
	if !fileExists(resolvedAssessmentPath) {
		result["state"] = "missing-assessment"
		result["reason"] = "runner-assessment-missing"
		result["nextBranch"] = runnerReadinessBranchForRunner(
			runnerID,
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
		result["nextBranch"] = runnerReadinessBranchForRunner(
			runnerID,
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
	validationIssues = append(validationIssues, validateRunnerAssessmentBinding(repoRoot, adapter, assessment, runner)...)
	if len(validationIssues) > 0 {
		result["state"] = "unknown"
		result["reason"] = "runner-assessment-invalid"
		result["issues"] = validationIssues
		result["nextBranch"] = runnerReadinessBranchForRunner(
			runnerID,
			"repair_runner_assessment",
			"Repair the runner assessment",
			"The runner assessment is present but does not match the minimal schema.",
			assessmentPath,
			true,
		)
		return result
	}
	staleReasons := runnerAssessmentStaleReasons(repoRoot, adapter, assessment)
	result["assessmentProvenance"] = runnerAssessmentProvenance(repoRoot, assessment)
	if len(staleReasons) > 0 {
		result["state"] = "stale"
		result["reason"] = "runner-assessment-stale"
		result["staleReasons"] = staleReasons
		result["proofClass"] = firstNonEmptyString(assessment["proofClass"], "unknown")
		result["proofClassSource"] = "assessment"
		result["nextBranch"] = runnerReadinessBranchForRunner(
			runnerID,
			"refresh_runner_assessment",
			"Refresh the runner assessment",
			"The runner assessment was made against older repo, adapter, or runner file state.",
			assessmentPath,
			true,
		)
		return result
	}
	proofClass = firstNonEmptyString(assessment["proofClass"], "unknown")
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
		result["nextBranch"] = runnerReadinessBranchForRunner(
			runnerID,
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
		result["nextBranch"] = runnerReadinessBranchForRunner(
			runnerID,
			"run_eval_with_assessed_runner",
			"Run eval with the assessed runner",
			"The runner assessment is current and scoped to the selected requirement.",
			"",
			false,
		)
	case "smoke-only":
		result["state"] = "smoke-only"
		result["reason"] = "runner-assessment-smoke-only"
		result["nextBranch"] = runnerReadinessBranchForRunner(
			runnerID,
			"upgrade_runner_assessment",
			"Upgrade runner assessment before product-behavior proof",
			"The current assessment says this runner is only suitable for smoke validation.",
			assessmentPath,
			true,
		)
	default:
		result["state"] = "assessed"
		result["reason"] = "runner-assessment-not-ready"
		result["nextBranch"] = runnerReadinessBranchForRunner(
			runnerID,
			"address_runner_assessment_gaps",
			"Address runner assessment gaps",
			"The runner assessment is current but not ready for selected product-behavior proof.",
			assessmentPath,
			true,
		)
	}
	return result
}

func adapterRunnerBindings(adapter *AdapterPayload) []map[string]any {
	if adapter == nil || adapter.Data == nil {
		return nil
	}
	typed := []map[string]any{}
	for _, raw := range arrayOrEmpty(asMap(adapter.Data["runner_readiness"])["runners"]) {
		record := asMap(raw)
		runnerID := strings.TrimSpace(stringOrEmpty(record["id"]))
		if runnerID == "" {
			continue
		}
		proofClass := strings.TrimSpace(stringOrEmpty(record["proof_class"]))
		proofClassSource := "none"
		if proofClass != "" {
			proofClassSource = "adapter-runner"
		}
		assessmentPath := strings.TrimSpace(stringOrEmpty(record["assessment_path"]))
		if assessmentPath == "" {
			assessmentPath = defaultRunnerAssessmentPath(runnerID)
		}
		typed = append(typed, map[string]any{
			"runnerId":             runnerID,
			"surfaces":             stringArrayToAny(stringArrayOrEmpty(record["surfaces"])),
			"commandTemplates":     []string{strings.TrimSpace(stringOrEmpty(record["command_template"]))},
			"smokeCommandTemplate": strings.TrimSpace(stringOrEmpty(record["smoke_command_template"])),
			"assessmentPath":       assessmentPath,
			"proofClass":           firstNonEmptyString(proofClass, "unknown"),
			"proofClassSource":     proofClassSource,
			"declaredRunnerKind":   "typed-eval-runner",
			"defaultRuntime":       strings.TrimSpace(stringOrEmpty(record["default_runtime"])),
			"typed":                true,
		})
	}
	if len(typed) > 0 {
		return typed
	}
	templates := stringArrayOrEmpty(adapter.Data["eval_test_command_templates"])
	if len(templates) == 0 {
		return nil
	}
	return []map[string]any{
		{
			"runnerId":           defaultRunnerID,
			"surfaces":           []any{},
			"commandTemplates":   templates,
			"assessmentPath":     defaultRunnerAssessmentPath(defaultRunnerID),
			"proofClass":         "unknown",
			"proofClassSource":   "none",
			"declaredRunnerKind": "declared-eval-runner",
			"typed":              false,
		},
	}
}

func runnerSupportsSurface(runner map[string]any, targetSurface string) bool {
	targetSurface = strings.TrimSpace(targetSurface)
	surfaces := stringArrayOrEmpty(runner["surfaces"])
	if len(surfaces) == 0 {
		return true
	}
	for _, surface := range surfaces {
		if surface == targetSurface {
			return true
		}
	}
	return false
}

func runnerSummaries(runners []map[string]any) []any {
	summaries := []any{}
	for _, runner := range runners {
		summary := map[string]any{
			"runnerId":           runner["runnerId"],
			"surfaces":           firstNonNil(runner["surfaces"], []any{}),
			"declaredRunnerKind": runner["declaredRunnerKind"],
			"proofClass":         runner["proofClass"],
			"assessmentPath":     runner["assessmentPath"],
		}
		if smokeTemplate := strings.TrimSpace(stringOrEmpty(runner["smokeCommandTemplate"])); smokeTemplate != "" {
			summary["smokeCommandTemplate"] = smokeTemplate
		}
		summaries = append(summaries, summary)
	}
	return summaries
}

func selectPrimaryRunnerReadiness(readinesses []any) map[string]any {
	if len(readinesses) == 0 {
		return map[string]any{}
	}
	rank := map[string]int{
		"unknown":            0,
		"missing-assessment": 1,
		"stale":              2,
		"smoke-only":         3,
		"assessed":           4,
	}
	best := asMap(readinesses[0])
	bestRank := 99
	for _, raw := range readinesses {
		readiness := asMap(raw)
		state := strings.TrimSpace(stringOrEmpty(readiness["state"]))
		currentRank, ok := rank[state]
		if !ok {
			currentRank = 50
		}
		if state == "assessed" && asMap(readiness["nextBranch"])["id"] == "run_eval_with_assessed_runner" {
			currentRank = 90
		}
		if currentRank < bestRank {
			best = readiness
			bestRank = currentRank
		}
	}
	return best
}

func cloneMap(value map[string]any) map[string]any {
	cloned := map[string]any{}
	for key, raw := range value {
		cloned[key] = raw
	}
	return cloned
}

func defaultRunnerAssessmentPath(runnerID string) string {
	return filepath.ToSlash(filepath.Join(".cautilus", "runners", runnerID+".assessment.json"))
}

func runnerReadinessBranch(id string, label string, reason string, artifactPath string, writesFiles bool) map[string]any {
	return runnerReadinessBranchForRunner(defaultRunnerID, id, label, reason, artifactPath, writesFiles)
}

func runnerReadinessBranchForRunner(runnerID string, id string, label string, reason string, artifactPath string, writesFiles bool) map[string]any {
	branch := map[string]any{
		"id":            id,
		"label":         label,
		"reason":        reason,
		"writesFiles":   writesFiles,
		"owningSurface": "setup/readiness",
		"runnerId":      firstNonEmptyString(runnerID, defaultRunnerID),
	}
	if strings.TrimSpace(artifactPath) != "" {
		branch["artifactPath"] = artifactPath
		branch["requiredArtifact"] = artifactPath
	}
	if strings.TrimSpace(stringFromAny(branch["requiredArtifact"])) == "" && id == "run_eval_with_assessed_runner" {
		branch["requiredCommand"] = "cautilus eval test --fixture <fixture.json>"
	}
	if id == "create_runner_assessment" || id == "upgrade_runner_assessment" || id == "repair_runner_assessment" {
		branch["scaffoldSource"] = "fixtures/runner-readiness/example-assessment.json"
		branch["scopeNote"] = "Fill or refresh the assessment after a selected proof requirement is known; plain eval templates remain only declared-eval-runner evidence."
	}
	return branch
}

func runnerSmokeBranchForRunner(runnerID string, commandTemplate string) map[string]any {
	branch := runnerReadinessBranchForRunner(
		runnerID,
		"run_runner_smoke",
		"Run the runner smoke command",
		"The adapter declares a cheap smoke command for checking runner wiring without treating it as product-behavior proof.",
		"",
		false,
	)
	branch["requiredCommand"] = commandTemplate
	branch["proofBoundary"] = "Smoke output can validate wiring and setup only; it is not product-behavior proof."
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

func validateRunnerAssessmentBinding(repoRoot string, adapter *AdapterPayload, assessment map[string]any, runner map[string]any) []any {
	issues := []any{}
	expectedRunnerID := firstNonEmptyString(runner["runnerId"], defaultRunnerID)
	if runnerID := strings.TrimSpace(stringOrEmpty(assessment["runnerId"])); runnerID != "" && runnerID != expectedRunnerID {
		issues = append(issues, map[string]any{"field": "runnerId", "message": "runnerId must match the selected adapter runner", "expected": expectedRunnerID, "actual": runnerID})
	}
	if assessmentSurface := strings.TrimSpace(stringOrEmpty(assessment["surface"])); assessmentSurface != "" && !runnerSupportsSurface(runner, assessmentSurface) {
		issues = append(issues, map[string]any{"field": "surface", "message": "assessment surface must be declared by the selected adapter runner", "expected": runner["surfaces"], "actual": assessmentSurface})
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

func runnerAssessmentProvenance(repoRoot string, assessment map[string]any) map[string]any {
	packetCommit := strings.TrimSpace(stringOrEmpty(assessment["repoCommit"]))
	currentCommit := currentGitCommit(repoRoot)
	headDrift := packetCommit != "" && currentCommit != "" && packetCommit != currentCommit
	status := "fresh"
	if packetCommit == "" {
		status = "missing-assessment-commit"
	} else if currentCommit == "" {
		status = "missing-current-commit"
	} else if headDrift {
		status = "fresh-with-head-drift"
	}
	return map[string]any{
		"assessmentRepoCommit": packetCommit,
		"currentGitCommit":     currentCommit,
		"headDrift":            headDrift,
		"comparisonStatus":     status,
		"freshnessPolicy":      "adapter-and-runner-file-hashes",
	}
}
