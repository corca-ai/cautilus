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
		"agentSurface": agentSurface,
		"adapter":      renderAgentStatusAdapter(adapter),
		"claimState":   claimOrientation["claimState"],
		"scanScope":    claimOrientation["scanScope"],
		"nextBranches": mergeAgentStatusBranches(adapter, claimOrientation["nextBranches"], repoRoot),
		"notice":       "Orientation packet only: it reads product readiness and claim-state availability so the agent can offer a branch before running discovery, evaluation, review, optimization, edits, or commits.",
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

	statePath := strings.TrimSpace(config.statePath)
	if statePath != "" && !filepath.IsAbs(statePath) {
		resolvedStatePath := filepath.Join(repoRoot, filepath.FromSlash(statePath))
		if fileExists(resolvedStatePath) {
			packet, readErr := readJSONFile(resolvedStatePath)
			if readErr != nil {
				claimState["status"] = "invalid"
				claimState["validation"] = map[string]any{
					"valid": false,
					"error": readErr.Error(),
				}
			} else if packet["schemaVersion"] != contracts.ClaimProofPlanSchema {
				claimState["status"] = "unsupported"
				claimState["validation"] = map[string]any{
					"valid":         false,
					"schemaVersion": packet["schemaVersion"],
					"expected":      contracts.ClaimProofPlanSchema,
				}
			} else if summary, summaryErr := BuildClaimStatusSummaryWithOptions(packet, ClaimStatusSummaryOptions{
				InputPath: statePath,
				RepoRoot:  repoRoot,
			}); summaryErr != nil {
				claimState["status"] = "invalid"
				claimState["validation"] = map[string]any{
					"valid": false,
					"error": summaryErr.Error(),
				}
			} else {
				claimState["status"] = "present"
				claimState["summary"] = summary
			}
		}
	} else if statePath != "" {
		claimState["status"] = "unsupported_state_path"
		claimState["validation"] = map[string]any{
			"valid": false,
			"error": "claim_discovery.state_path must be repo-relative for agent status orientation",
		}
	}

	return map[string]any{
		"claimState":   claimState,
		"scanScope":    renderClaimScanScope(config),
		"nextBranches": claimOrientationBranches(claimState, config, repoRoot),
	}, nil
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

func mergeAgentStatusBranches(adapter *AdapterPayload, branches any, repoRoot string) []any {
	result := []any{}
	if adapter == nil || !adapter.Found || !adapter.Valid {
		result = append(result, map[string]any{
			"id":      "initialize_adapter",
			"label":   "Initialize or repair the repo adapter",
			"command": "cautilus adapter init --repo-root " + ShellSingleQuote(repoRoot),
			"reason":  "Adapter readiness is separate from claim discovery and should be resolved before deeper Cautilus workflows.",
		})
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
	statePath := filepath.Join(repoRoot, filepath.FromSlash(config.statePath))
	quotedRepoRoot := ShellSingleQuote(repoRoot)
	quotedStatePath := ShellSingleQuote(statePath)
	switch stringOrEmpty(claimState["status"]) {
	case "present":
		showBranch := map[string]any{
			"id":      "show_existing_claims",
			"label":   "Inspect the saved claim map",
			"command": "cautilus claim show --input " + quotedStatePath + " --sample-claims 10",
			"reason":  "Use this when the saved claim map is current enough to decide whether to review claims, add deterministic tests, or plan Cautilus eval scenarios.",
		}
		refreshBranch := map[string]any{
			"id":      "refresh_claims_from_diff",
			"label":   "Compare the saved claim map with recent repo changes",
			"command": "cautilus claim discover --repo-root " + quotedRepoRoot + " --previous " + quotedStatePath + " --refresh-plan --output <refresh-plan.json>",
			"reason":  "This records what changed since the claim map was saved, without launching review or eval work.",
		}
		if asMap(asMap(claimState["summary"])["gitState"])["isStale"] == true {
			refreshBranch["reason"] = "The saved claim map was made from an older checkout; compare it with the current repo before review or eval planning."
			showBranch["reason"] = "Use this only to inspect the older saved map; it should not drive review or eval planning until the map is refreshed."
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
