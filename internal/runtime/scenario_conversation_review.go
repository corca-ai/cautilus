package runtime

import (
	"fmt"
	"sort"
	"strings"
	"time"

	"github.com/corca-ai/cautilus/internal/contracts"
)

const (
	scenarioConversationAttentionCap           = 5
	scenarioConversationAttentionFallbackCount = 3
)

func BuildScenarioConversationReview(input map[string]any, now time.Time) (map[string]any, error) {
	if input["schemaVersion"] != contracts.ScenarioConversationReviewInputsSchema {
		return nil, fmt.Errorf("schemaVersion must be %s", contracts.ScenarioConversationReviewInputsSchema)
	}
	if _, err := assertArray(input["conversationSummaries"], "conversationSummaries"); err != nil {
		return nil, err
	}
	if _, err := assertArray(input["proposalCandidates"], "proposalCandidates"); err != nil {
		return nil, err
	}

	conversations := arrayOrEmpty(input["conversationSummaries"])
	for index, rawConversation := range conversations {
		conversation, ok := rawConversation.(map[string]any)
		if !ok {
			return nil, fmt.Errorf("conversationSummaries[%d] must be an object", index)
		}
		if err := validateConversation(conversation, index); err != nil {
			return nil, err
		}
	}

	families := stringSliceValue(input["families"])
	windowDays := intValueOrDefault(input["windowDays"], 14)
	effectiveNow := now
	if rawNow := stringOrEmpty(input["now"]); rawNow != "" {
		effectiveNow = parseOptionalNow(rawNow)
	}

	proposalPacket, err := GenerateScenarioProposals(
		arrayOrEmpty(input["proposalCandidates"]),
		readScenarioKeys(arrayOrEmpty(input["existingScenarioRegistry"])),
		readScenarioCoverage(arrayOrEmpty(input["scenarioCoverage"])),
		families,
		windowDays,
		effectiveNow,
	)
	if err != nil {
		return nil, err
	}

	proposalsByThread := scenarioConversationProposalsByThread(arrayOrEmpty(proposalPacket["proposals"]))
	threads := buildScenarioConversationReviewThreads(conversations, proposalsByThread)
	attentionView := buildScenarioConversationAttentionView(threads)

	linkedThreadCount := 0
	unlinkedThreadCount := 0
	linkedProposalCount := 0
	newScenarioThreadCount := 0
	refreshThreadCount := 0
	for _, rawThread := range threads {
		thread := asMap(rawThread)
		linkedProposalCount += len(arrayOrEmpty(thread["linkedProposals"]))
		switch stringOrEmpty(thread["recommendation"]) {
		case "inspect_unlinked_thread":
			unlinkedThreadCount++
		case "review_new_scenario":
			linkedThreadCount++
			newScenarioThreadCount++
		case "review_existing_scenario_refresh":
			linkedThreadCount++
			refreshThreadCount++
		default:
			if len(arrayOrEmpty(thread["linkedProposals"])) == 0 {
				unlinkedThreadCount++
			} else {
				linkedThreadCount++
			}
		}
	}

	return map[string]any{
		"schemaVersion": contracts.ScenarioConversationReviewSchema,
		"generatedAt":   effectiveNow.UTC().Format(time.RFC3339Nano),
		"windowDays":    windowDays,
		"families":      families,
		"summary": map[string]any{
			"threadCount":            len(threads),
			"linkedThreadCount":      linkedThreadCount,
			"unlinkedThreadCount":    unlinkedThreadCount,
			"linkedProposalCount":    linkedProposalCount,
			"newScenarioThreadCount": newScenarioThreadCount,
			"refreshThreadCount":     refreshThreadCount,
		},
		"proposalTelemetry": proposalPacket["proposalTelemetry"],
		"attentionView":     attentionView,
		"threads":           threads,
	}, nil
}

func scenarioConversationProposalsByThread(proposals []any) map[string][]map[string]any {
	byThread := map[string][]map[string]any{}
	for _, rawProposal := range proposals {
		proposal := asMap(rawProposal)
		summary := map[string]any{
			"proposalKey":      proposal["proposalKey"],
			"title":            proposal["title"],
			"action":           proposal["action"],
			"family":           proposal["family"],
			"rationale":        proposal["rationale"],
			"existingCoverage": proposal["existingCoverage"],
		}
		threadKeys := []string{}
		for _, rawEvidence := range arrayOrEmpty(proposal["evidence"]) {
			evidence := asMap(rawEvidence)
			if stringOrEmpty(evidence["sourceKind"]) != "human_conversation" {
				continue
			}
			threadKey := stringOrEmpty(evidence["threadKey"])
			if threadKey == "" {
				continue
			}
			threadKeys = append(threadKeys, threadKey)
		}
		for _, threadKey := range uniqueStrings(threadKeys) {
			byThread[threadKey] = append(byThread[threadKey], cloneConversationProposalSummary(summary))
		}
	}
	for threadKey, proposalsForThread := range byThread {
		sort.Slice(proposalsForThread, func(left, right int) bool {
			leftProposal := proposalsForThread[left]
			rightProposal := proposalsForThread[right]
			if stringOrEmpty(leftProposal["action"]) != stringOrEmpty(rightProposal["action"]) {
				return stringOrEmpty(leftProposal["action"]) < stringOrEmpty(rightProposal["action"])
			}
			return stringOrEmpty(leftProposal["proposalKey"]) < stringOrEmpty(rightProposal["proposalKey"])
		})
		normalized := make([]map[string]any, 0, len(proposalsForThread))
		seen := map[string]struct{}{}
		for _, proposal := range proposalsForThread {
			key := stringOrEmpty(proposal["proposalKey"])
			if _, ok := seen[key]; ok {
				continue
			}
			seen[key] = struct{}{}
			normalized = append(normalized, proposal)
		}
		byThread[threadKey] = normalized
	}
	return byThread
}

func buildScenarioConversationReviewThreads(conversations []any, proposalsByThread map[string][]map[string]any) []any {
	records := make([]map[string]any, 0, len(conversations))
	for _, rawConversation := range conversations {
		conversation := asMap(rawConversation)
		threadKey := stringOrEmpty(conversation["threadKey"])
		linkedProposals := proposalsByThread[threadKey]
		recommendation := scenarioConversationRecommendation(linkedProposals)
		attentionReasons := scenarioConversationAttentionReasons(linkedProposals)
		records = append(records, map[string]any{
			"threadKey":          threadKey,
			"title":              scenarioConversationTitle(conversation, linkedProposals),
			"lastObservedAt":     conversation["lastObservedAt"],
			"recordCount":        len(arrayOrEmpty(conversation["records"])),
			"userMessageCount":   len(getUserMessageTexts(conversation)),
			"recommendation":     recommendation,
			"rationale":          scenarioConversationRationale(linkedProposals),
			"attentionReasons":   stringSliceToAny(attentionReasons),
			"linkedScenarioKeys": stringSliceToAny(scenarioConversationLinkedScenarioKeys(linkedProposals)),
			"linkedProposals":    conversationProposalSummariesToAny(linkedProposals),
			"records":            conversation["records"],
		})
	}
	sort.Slice(records, func(left, right int) bool {
		leftLinked := len(arrayOrEmpty(records[left]["linkedProposals"]))
		rightLinked := len(arrayOrEmpty(records[right]["linkedProposals"]))
		if leftLinked != rightLinked {
			return rightLinked < leftLinked
		}
		return parseISOTime(records[right]["lastObservedAt"]) < parseISOTime(records[left]["lastObservedAt"])
	})
	result := make([]any, 0, len(records))
	for _, record := range records {
		result = append(result, record)
	}
	return result
}

func cloneConversationProposalSummary(proposal map[string]any) map[string]any {
	cloned := map[string]any{}
	for key, value := range proposal {
		cloned[key] = value
	}
	return cloned
}

func conversationProposalSummariesToAny(proposals []map[string]any) []any {
	result := make([]any, 0, len(proposals))
	for _, proposal := range proposals {
		result = append(result, proposal)
	}
	return result
}

func scenarioConversationLinkedScenarioKeys(proposals []map[string]any) []string {
	keys := make([]string, 0, len(proposals))
	for _, proposal := range proposals {
		keys = append(keys, stringOrEmpty(proposal["proposalKey"]))
	}
	return uniqueStrings(keys)
}

func scenarioConversationRecommendation(proposals []map[string]any) string {
	if len(proposals) == 0 {
		return "inspect_unlinked_thread"
	}
	for _, proposal := range proposals {
		if stringOrEmpty(proposal["action"]) == "add_new_scenario" {
			return "review_new_scenario"
		}
	}
	return "review_existing_scenario_refresh"
}

func scenarioConversationRationale(proposals []map[string]any) string {
	if len(proposals) == 0 {
		return "No linked scenario proposal currently references this conversation."
	}
	actions := []string{}
	lowCoverage := false
	for _, proposal := range proposals {
		actions = append(actions, stringOrEmpty(proposal["action"]))
		coverage := asMap(proposal["existingCoverage"])
		if intValueOrDefault(coverage["recentResultCount"], 0) <= 2 {
			lowCoverage = true
		}
	}
	actionKinds := uniqueStrings(actions)
	message := fmt.Sprintf("%d linked proposal(s) reference this conversation.", len(proposals))
	if len(actionKinds) > 0 {
		message += " Actions: " + strings.Join(actionKinds, ", ") + "."
	}
	if lowCoverage {
		message += " At least one linked scenario has low recent coverage."
	}
	return message
}

func scenarioConversationAttentionReasons(proposals []map[string]any) []string {
	reasons := []string{}
	if len(proposals) > 0 {
		reasons = append(reasons, "linked_proposal")
	}
	if len(proposals) > 1 {
		reasons = append(reasons, "multiple_linked_proposals")
	}
	for _, proposal := range proposals {
		if stringOrEmpty(proposal["action"]) == "add_new_scenario" {
			reasons = append(reasons, "new_scenario")
			continue
		}
		coverage := asMap(proposal["existingCoverage"])
		if intValueOrDefault(coverage["recentResultCount"], 0) <= 2 {
			reasons = append(reasons, "low_recent_coverage")
		}
	}
	return uniqueStrings(reasons)
}

func buildScenarioConversationAttentionView(threads []any) map[string]any {
	reasonCodesByThreadKey := map[string]any{}
	matchedRuleCount := 0
	selectedKeys := []any{}
	fallbackUsed := false
	for _, rawThread := range threads {
		thread := asMap(rawThread)
		threadKey := stringOrEmpty(thread["threadKey"])
		reasons := stringSliceOrEmptyRuntime(thread["attentionReasons"])
		if len(reasons) == 0 {
			continue
		}
		matchedRuleCount++
		reasonCodesByThreadKey[threadKey] = stringSliceToAny(reasons)
		selectedKeys = append(selectedKeys, threadKey)
	}
	if len(selectedKeys) == 0 {
		fallbackUsed = true
		for index, rawThread := range threads {
			if index >= scenarioConversationAttentionFallbackCount {
				break
			}
			threadKey := stringOrEmpty(asMap(rawThread)["threadKey"])
			reasonCodesByThreadKey[threadKey] = []any{"recent_thread_fallback"}
			selectedKeys = append(selectedKeys, threadKey)
		}
	}
	truncated := false
	if len(selectedKeys) > scenarioConversationAttentionCap {
		selectedKeys = selectedKeys[:scenarioConversationAttentionCap]
		truncated = true
	}
	reasonCodesByThreadKey = selectReasonCodesForKeys(reasonCodesByThreadKey, selectedKeys)
	return map[string]any{
		"ruleVersion":            "v1",
		"threadKeys":             selectedKeys,
		"reasonCodesByThreadKey": reasonCodesByThreadKey,
		"matchedRuleCount":       matchedRuleCount,
		"selectedCount":          len(selectedKeys),
		"fallbackUsed":           fallbackUsed,
		"truncated":              truncated,
	}
}

func scenarioConversationTitle(conversation map[string]any, proposals []map[string]any) string {
	if len(proposals) > 0 {
		return stringOrEmpty(proposals[0]["title"])
	}
	for _, message := range getUserMessageTexts(conversation) {
		if trimmed := strings.TrimSpace(message); trimmed != "" {
			return truncateRunes(trimmed, 72)
		}
	}
	return stringOrEmpty(conversation["threadKey"])
}

func truncateRunes(value string, limit int) string {
	runes := []rune(strings.TrimSpace(value))
	if len(runes) <= limit || limit <= 0 {
		return string(runes)
	}
	return string(runes[:limit-1]) + "…"
}
