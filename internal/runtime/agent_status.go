package runtime

import (
	"path/filepath"
	"strings"

	"github.com/corca-ai/cautilus/internal/contracts"
)

type AgentStatusOptions struct {
	Current      any
	CommandCount int
}

func BuildAgentStatus(repoRoot string, options AgentStatusOptions) (map[string]any, int, error) {
	agentSurface, agentSurfaceExitCode, err := DoctorAgentSurface(repoRoot)
	if err != nil {
		return nil, 1, err
	}
	adapter, err := LoadAdapter(repoRoot, nil, nil)
	if err != nil {
		return nil, 1, err
	}
	claimOrientation, err := BuildClaimOrientation(repoRoot)
	if err != nil {
		return nil, 1, err
	}

	status := "ready"
	if agentSurfaceExitCode != 0 || adapter == nil || !adapter.Valid {
		status = "needs-setup"
	}
	runnerReadiness := BuildRunnerReadiness(repoRoot, adapter)

	payload := map[string]any{
		"schemaVersion": contracts.AgentStatusSchema,
		"mode":          "orientation",
		"status":        status,
		"repoRoot":      repoRoot,
		"binary": map[string]any{
			"status":       "healthy",
			"current":      options.Current,
			"commandCount": options.CommandCount,
		},
		"agentSurface":    agentSurface,
		"adapter":         renderAgentStatusAdapter(adapter),
		"runnerReadiness": runnerReadiness,
		"claimState":      claimOrientation["claimState"],
		"scanScope":       claimOrientation["scanScope"],
		"nextBranches":    mergeAgentStatusBranches(adapter, runnerReadiness, claimOrientation["nextBranches"], repoRoot),
		"notice":          "Orientation packet only: it reads product readiness and claim-state availability so the agent can offer a branch before running discovery, evaluation, review, optimization, edits, or commits.",
	}
	return payload, 0, nil
}

func BuildClaimOrientation(repoRoot string) (map[string]any, error) {
	config, err := resolveClaimDiscoveryConfig(repoRoot, nil)
	if err != nil {
		return nil, err
	}
	claimState := renderClaimState(config)
	claimState["status"] = "missing"
	claimState["orientationPolicy"] = "Prefer the most advanced non-stale related claim packet for status and next-branch commands while preserving claim_discovery.state_path as the writable discovery baseline."
	relatedStates := buildRelatedClaimStates(repoRoot, config)
	claimState["relatedStates"] = relatedStates
	stateCandidates := []map[string]any{}

	statePath := strings.TrimSpace(config.statePath)
	if statePath != "" && !filepath.IsAbs(statePath) {
		resolvedStatePath := filepath.Join(repoRoot, filepath.FromSlash(statePath))
		state := buildClaimStateFileSummary(repoRoot, "current", statePath, resolvedStatePath)
		claimState["configuredState"] = state
		stateCandidates = append(stateCandidates, state)
	} else if statePath != "" {
		claimState["status"] = "unsupported_state_path"
		claimState["validation"] = map[string]any{
			"valid": false,
			"error": "claim_discovery.state_path must be repo-relative for agent status orientation",
		}
	}
	for _, raw := range relatedStates {
		stateCandidates = append(stateCandidates, asMap(raw))
	}
	if selected := selectClaimOrientationState(stateCandidates); len(selected) > 0 {
		claimState["status"] = selected["status"]
		claimState["role"] = selected["role"]
		claimState["path"] = selected["path"]
		claimState["orientationState"] = selected
		if validation := asMap(selected["validation"]); len(validation) > 0 {
			claimState["validation"] = validation
		} else {
			delete(claimState, "validation")
		}
		if summary := asMap(selected["summary"]); len(summary) > 0 {
			claimState["summary"] = summary
		} else {
			delete(claimState, "summary")
		}
	}

	return map[string]any{
		"claimState":   claimState,
		"scanScope":    renderClaimScanScope(config),
		"nextBranches": claimOrientationBranches(claimState, config, repoRoot),
	}, nil
}

func buildRelatedClaimStates(repoRoot string, config claimDiscoveryConfig) []any {
	result := []any{}
	for _, related := range config.relatedStatePaths {
		resolvedPath := filepath.Join(repoRoot, filepath.FromSlash(related.path))
		state := buildClaimStateFileSummary(repoRoot, related.role, related.path, resolvedPath)
		result = append(result, state)
	}
	return result
}

func buildClaimStateFileSummary(repoRoot string, role string, statePath string, resolvedStatePath string) map[string]any {
	state := map[string]any{
		"role":   role,
		"path":   statePath,
		"status": "missing",
	}
	if !fileExists(resolvedStatePath) {
		return state
	}
	packet, readErr := readJSONFile(resolvedStatePath)
	if readErr != nil {
		state["status"] = "invalid"
		state["validation"] = map[string]any{
			"valid": false,
			"error": readErr.Error(),
		}
		return state
	}
	if packet["schemaVersion"] != contracts.ClaimProofPlanSchema {
		state["status"] = "unsupported"
		state["validation"] = map[string]any{
			"valid":         false,
			"schemaVersion": packet["schemaVersion"],
			"expected":      contracts.ClaimProofPlanSchema,
		}
		return state
	}
	summary, summaryErr := BuildClaimStatusSummaryWithOptions(packet, ClaimStatusSummaryOptions{
		InputPath: statePath,
		RepoRoot:  repoRoot,
	})
	if summaryErr != nil {
		state["status"] = "invalid"
		state["validation"] = map[string]any{
			"valid": false,
			"error": summaryErr.Error(),
		}
		return state
	}
	state["status"] = "present"
	state["summary"] = summary
	return state
}

func selectClaimOrientationState(states []map[string]any) map[string]any {
	var best map[string]any
	bestScore := -1
	for _, state := range states {
		if len(state) == 0 || stringOrEmpty(state["status"]) != "present" {
			continue
		}
		summary := asMap(state["summary"])
		if asMap(summary["gitState"])["isStale"] == true {
			continue
		}
		score := claimOrientationStateScore(state)
		if best == nil || score > bestScore {
			best = state
			bestScore = score
		}
	}
	if best != nil {
		return best
	}
	for _, state := range states {
		if len(state) > 0 && stringOrEmpty(state["status"]) == "present" {
			return state
		}
	}
	return map[string]any{}
}

func claimOrientationStateScore(state map[string]any) int {
	score := 0
	switch stringOrEmpty(state["role"]) {
	case "evidenced":
		score += 3000
	case "reviewed":
		score += 2000
	case "current":
		score += 1000
	default:
		score += 500
	}
	summary := asMap(state["summary"])
	claimSummary := asMap(summary["claimSummary"])
	byEvidence := asMap(claimSummary["byEvidenceStatus"])
	byReview := asMap(claimSummary["byReviewStatus"])
	score += 10 * intFromAny(byEvidence["satisfied"])
	score += 3 * intFromAny(byReview["human-reviewed"])
	score += 2 * intFromAny(byReview["agent-reviewed"])
	return score
}

func renderAgentStatusAdapter(adapter *AdapterPayload) map[string]any {
	if adapter == nil {
		return map[string]any{
			"found":    false,
			"valid":    false,
			"errors":   []string{"adapter payload was unavailable"},
			"warnings": []string{},
		}
	}
	return map[string]any{
		"found":         adapter.Found,
		"valid":         adapter.Valid,
		"path":          adapter.Path,
		"errors":        adapter.Errors,
		"warnings":      adapter.Warnings,
		"searchedPaths": adapter.SearchedPaths,
	}
}

func mergeAgentStatusBranches(adapter *AdapterPayload, runnerReadiness map[string]any, branches any, repoRoot string) []any {
	result := []any{}
	if adapter == nil || !adapter.Found || !adapter.Valid {
		result = append(result, map[string]any{
			"id":      "initialize_adapter",
			"label":   "Initialize or repair the repo adapter",
			"command": "cautilus adapter init --repo-root " + ShellSingleQuote(repoRoot),
			"reason":  "Adapter readiness is separate from claim discovery and should be resolved before deeper Cautilus workflows.",
		})
	}
	if adapter != nil && adapter.Found && adapter.Valid {
		nextBranch := asMap(runnerReadiness["nextBranch"])
		if branchID := strings.TrimSpace(stringOrEmpty(nextBranch["id"])); branchID != "" && branchID != "run_eval_with_assessed_runner" {
			result = append(result, nextBranch)
		}
		smokeBranch := asMap(runnerReadiness["smokeBranch"])
		if branchID := strings.TrimSpace(stringOrEmpty(smokeBranch["id"])); branchID != "" {
			result = append(result, smokeBranch)
		}
	}
	result = append(result, arrayOrEmpty(branches)...)
	result = append(result, map[string]any{
		"id":     "stop",
		"label":  "Stop after orientation",
		"reason": "The status packet is enough when the user only wanted a first-touch read.",
	})
	return result
}

func claimOrientationBranches(claimState map[string]any, config claimDiscoveryConfig, repoRoot string) []any {
	orientationPath := strings.TrimSpace(stringOrEmpty(claimState["path"]))
	if orientationPath == "" {
		orientationPath = config.statePath
	}
	statePath := filepath.Join(repoRoot, filepath.FromSlash(orientationPath))
	quotedRepoRoot := ShellSingleQuote(repoRoot)
	quotedStatePath := ShellSingleQuote(statePath)
	switch stringOrEmpty(claimState["status"]) {
	case "present":
		stateLabel := "saved claim map"
		if role := stringOrEmpty(claimState["role"]); role != "" && role != "current" {
			stateLabel = role + " claim map"
		}
		showBranch := map[string]any{
			"id":      "show_existing_claims",
			"label":   "Inspect the " + stateLabel,
			"command": "cautilus claim show --input " + quotedStatePath + " --sample-claims 10",
			"reason":  "Use this when the selected claim map is current enough to decide whether to review claims, add deterministic tests, or plan Cautilus eval scenarios.",
		}
		refreshBranch := map[string]any{
			"id":      "refresh_claims_from_diff",
			"label":   "Compare the " + stateLabel + " with recent repo changes",
			"command": "cautilus claim discover --repo-root " + quotedRepoRoot + " --previous " + quotedStatePath + " --refresh-plan --output <refresh-plan.json>",
			"reason":  "This records what changed since the selected claim map was saved, without launching review or eval work.",
		}
		if asMap(asMap(claimState["summary"])["gitState"])["isStale"] == true {
			refreshBranch["reason"] = "The selected claim map was made from an older checkout; compare it with the current repo before review or eval planning."
			showBranch["reason"] = "Use this only to inspect the older selected map; it should not drive review or eval planning until the map is refreshed."
			return []any{refreshBranch, showBranch}
		}
		return []any{showBranch, refreshBranch}
	case "missing":
		return []any{
			map[string]any{
				"id":      "run_first_claim_scan",
				"label":   "Run the first bounded claim scan",
				"command": "cautilus claim discover --repo-root " + quotedRepoRoot + " --output " + quotedStatePath,
				"reason":  "No repo-local claim packet exists yet; discovery starts from the reported entry files and link depth.",
			},
		}
	default:
		return []any{
			map[string]any{
				"id":     "repair_claim_state",
				"label":  "Repair or replace the configured claim packet",
				"reason": "The configured claim-state path exists or is configured but cannot be used as a valid Cautilus claim proof plan.",
			},
		}
	}
}
