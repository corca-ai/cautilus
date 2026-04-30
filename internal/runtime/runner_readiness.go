package runtime

import (
	"path/filepath"
	"strings"

	"github.com/corca-ai/cautilus/internal/contracts"
)

const defaultRunnerID = "default-eval-runner"

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
	}
	if strings.TrimSpace(artifactPath) != "" {
		branch["artifactPath"] = artifactPath
	}
	return branch
}

func summarizeRunnerAssessment(assessment map[string]any) map[string]any {
	return map[string]any{
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
	return issues
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
