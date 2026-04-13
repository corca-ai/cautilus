package runtime

import (
	"fmt"
	"sort"
	"strings"
	"time"

	"github.com/corca-ai/cautilus/internal/contracts"
)

func BuildScenarioProposalInput(proposalCandidates []any, existingScenarioRegistry []any, scenarioCoverage []any, families []string, windowDays int, now *time.Time) (map[string]any, error) {
	packet := map[string]any{
		"schemaVersion":            contracts.ScenarioProposalInputsSchema,
		"windowDays":               windowDays,
		"families":                 families,
		"proposalCandidates":       proposalCandidates,
		"existingScenarioRegistry": existingScenarioRegistry,
		"scenarioCoverage":         scenarioCoverage,
	}
	if now != nil {
		packet["now"] = optionalTime(now)
	}
	return packet, nil
}

func BuildScenarioProposalPacket(input map[string]any) (map[string]any, error) {
	if input["schemaVersion"] != contracts.ScenarioProposalInputsSchema {
		return nil, fmt.Errorf("schemaVersion must be %s", contracts.ScenarioProposalInputsSchema)
	}
	families := stringSliceValue(input["families"])
	return GenerateScenarioProposals(
		arrayOrEmpty(input["proposalCandidates"]),
		readScenarioKeys(arrayOrEmpty(input["existingScenarioRegistry"])),
		readScenarioCoverage(arrayOrEmpty(input["scenarioCoverage"])),
		families,
		intValueOrDefault(input["limit"], 5),
		intValueOrDefault(input["windowDays"], 14),
		parseOptionalNow(input["now"]),
	)
}

func GenerateScenarioProposals(proposalCandidates []any, existingScenarioKeys []string, recentCoverage map[string]float64, families []string, limit int, windowDays int, now time.Time) (map[string]any, error) {
	familyFilter := map[string]struct{}{}
	for _, family := range families {
		familyFilter[family] = struct{}{}
	}
	scenarioKeys := map[string]struct{}{}
	for _, key := range existingScenarioKeys {
		scenarioKeys[key] = struct{}{}
	}
	merged := map[string]map[string]any{}
	for index, rawCandidate := range proposalCandidates {
		candidate, ok := rawCandidate.(map[string]any)
		if !ok {
			return nil, fmt.Errorf("proposalCandidates[%d] must be an object", index)
		}
		if err := validateProposalCandidate(candidate, index); err != nil {
			return nil, err
		}
		family := stringOrEmpty(candidate["family"])
		if len(familyFilter) > 0 {
			if _, ok := familyFilter[family]; !ok {
				continue
			}
		}
		key := stringOrEmpty(candidate["proposalKey"])
		merged[key] = mergeProposalRecord(merged[key], candidate)
	}
	candidates := make([]map[string]any, 0, len(merged))
	for _, candidate := range merged {
		candidates = append(candidates, candidate)
	}
	sort.Slice(candidates, func(left, right int) bool {
		leftEvidence := arrayOrEmpty(candidates[left]["evidence"])
		rightEvidence := arrayOrEmpty(candidates[right]["evidence"])
		if len(leftEvidence) != len(rightEvidence) {
			return len(rightEvidence) < len(leftEvidence)
		}
		return parseISOTime(asMap(rightEvidence[0])["observedAt"]) < parseISOTime(asMap(leftEvidence[0])["observedAt"])
	})
	if limit > 0 && len(candidates) > limit {
		candidates = candidates[:limit]
	}
	proposals := make([]any, 0, len(candidates))
	for _, candidate := range candidates {
		proposals = append(proposals, buildScenarioProposal(candidate, scenarioKeys, recentCoverage))
	}
	return map[string]any{
		"schemaVersion": contracts.ScenarioProposalsSchema,
		"generatedAt":   now.UTC().Format(time.RFC3339Nano),
		"windowDays":    windowDays,
		"families":      families,
		"proposals":     proposals,
	}, nil
}

func NormalizeChatbotProposalCandidates(conversationSummaries []any, runSummaries []any) ([]any, error) {
	candidates := make([]map[string]any, 0)
	for index, rawConversation := range conversationSummaries {
		conversation, ok := rawConversation.(map[string]any)
		if !ok {
			return nil, fmt.Errorf("conversationSummaries[%d] must be an object", index)
		}
		if err := validateConversation(conversation, index); err != nil {
			return nil, err
		}
		userMessages := getUserMessageTexts(conversation)
		candidates = appendCandidate(candidates, buildReviewClarificationCandidate(conversation, userMessages))
		candidates = appendCandidate(candidates, buildEventTriggeredFollowupCandidate(conversation, userMessages))
	}
	for index, rawSummary := range runSummaries {
		summary, ok := rawSummary.(map[string]any)
		if !ok {
			return nil, fmt.Errorf("runSummaries[%d] must be an object", index)
		}
		if err := validateRunSummary(summary, index); err != nil {
			return nil, err
		}
		candidates = appendCandidate(candidates, buildAmbiguousConfirmationCandidate(summary))
	}
	return mergeCandidatesByProposalKey(candidates), nil
}

func NormalizeSkillProposalCandidates(evaluationRuns []any) ([]any, error) {
	candidates := make([]map[string]any, 0)
	for index, rawRun := range evaluationRuns {
		run, ok := rawRun.(map[string]any)
		if !ok {
			return nil, fmt.Errorf("evaluationRuns[%d] must be an object", index)
		}
		if err := validateSkillEvaluationRun(run, index); err != nil {
			return nil, err
		}
		candidates = appendCandidate(candidates, buildSkillValidationCandidate(run))
		candidates = appendCandidate(candidates, buildWorkflowRecoveryCandidate(run))
	}
	return mergeCandidatesByProposalKey(candidates), nil
}

func validateProposalCandidate(candidate map[string]any, index int) error {
	for _, field := range []string{"proposalKey", "title", "family", "name", "description", "brief"} {
		if _, err := normalizeNonEmptyString(candidate[field], fmt.Sprintf("proposalCandidates[%d].%s", index, field)); err != nil {
			return err
		}
	}
	if _, err := assertArray(candidate["evidence"], fmt.Sprintf("proposalCandidates[%d].evidence", index)); err != nil {
		return err
	}
	return nil
}

func mergeProposalRecord(current map[string]any, candidate map[string]any) map[string]any {
	if current == nil {
		cloned, _ := cloneJSON(candidate)
		cloned["evidence"] = sortEvidenceNewestFirst(arrayOrEmpty(candidate["evidence"]))
		return cloned
	}
	merged := map[string]any{}
	for key, value := range current {
		merged[key] = value
	}
	for key, value := range candidate {
		merged[key] = value
	}
	merged["evidence"] = sortEvidenceNewestFirst(append(arrayOrEmpty(current["evidence"]), arrayOrEmpty(candidate["evidence"])...))
	return merged
}

func buildScenarioProposal(candidate map[string]any, existingScenarioKeys map[string]struct{}, recentCoverage map[string]float64) map[string]any {
	proposalKey := stringOrEmpty(candidate["proposalKey"])
	_, exists := existingScenarioKeys[proposalKey]
	action := "add_new_scenario"
	if exists {
		action = "refresh_existing_scenario"
	}
	evidence := sortEvidenceNewestFirst(arrayOrEmpty(candidate["evidence"]))
	return map[string]any{
		"proposalKey":         proposalKey,
		"title":               candidate["title"],
		"action":              action,
		"family":              candidate["family"],
		"intentProfile":       candidate["intentProfile"],
		"recommendedBackends": recommendedBackends(stringOrEmpty(candidate["family"])),
		"existingCoverage": map[string]any{
			"scenarioKeyExists": exists,
			"recentResultCount": recentCoverage[proposalKey],
		},
		"rationale":     fmt.Sprintf("%d recent log match(es) suggested this pattern.", len(evidence)),
		"evidence":      takeAny(evidence, 3),
		"draftScenario": buildDraftScenario(candidate, existingScenarioKeys),
	}
}

func buildDraftScenario(candidate map[string]any, existingScenarioKeys map[string]struct{}) map[string]any {
	proposalKey := stringOrEmpty(candidate["proposalKey"])
	scenarioID := proposalKey
	if _, exists := existingScenarioKeys[proposalKey]; exists {
		scenarioID = proposalKey + "--ops-log-refresh"
	}
	scenario := map[string]any{
		"schemaVersion": contracts.DraftScenarioSchema,
		"scenarioId":    scenarioID,
		"name":          candidate["name"],
		"description":   candidate["description"],
		"brief":         candidate["brief"],
		"benchmark": map[string]any{
			"family":      candidate["family"],
			"scenarioKey": proposalKey,
			"backend":     draftScenarioBackend(stringOrEmpty(candidate["family"])),
			"tags":        arrayOrEmpty(candidate["tags"]),
		},
		"maxTurns":        chooseFloat(candidate["maxTurns"], 3),
		"runner":          map[string]any{"mode": "live"},
		"sideEffectsMode": "shadow",
		"simulator":       buildSimulator(candidate),
	}
	if candidate["intentProfile"] != nil {
		scenario["intentProfile"] = candidate["intentProfile"]
	}
	if candidate["conversationAuditScenario"] != nil {
		scenario["conversationAuditScenario"] = candidate["conversationAuditScenario"]
	}
	if eventType := stringOrEmpty(candidate["eventType"]); eventType != "" {
		scenario["conversation"] = map[string]any{
			"userId":    "U_AUDIT_WORKBENCH",
			"channelId": "D_AUDIT_WORKBENCH",
			"eventType": eventType,
		}
	}
	return scenario
}

func buildSimulator(candidate map[string]any) map[string]any {
	if stringOrEmpty(candidate["family"]) == "terminal_realism" {
		return map[string]any{
			"kind":         "codex_exec",
			"instructions": "You are acting like a real user talking to the candidate runtime. Be concise, goal-oriented, and stop when a real user would wait.",
		}
	}
	turns := make([]any, 0)
	for _, rawTurn := range arrayOrEmpty(candidate["simulatorTurns"]) {
		turns = append(turns, normalizeTurn(rawTurn, stringOrEmpty(candidate["eventType"])))
	}
	return map[string]any{
		"kind":  "scripted",
		"turns": turns,
	}
}

func normalizeTurn(turn any, fallbackEventType string) map[string]any {
	if text, ok := turn.(string); ok {
		record := map[string]any{"text": text}
		if strings.TrimSpace(fallbackEventType) != "" {
			record["eventType"] = fallbackEventType
		}
		return record
	}
	record := asMap(turn)
	result := map[string]any{"text": strings.TrimSpace(stringOrEmpty(record["text"]))}
	if eventType := stringOrEmpty(record["eventType"]); eventType != "" {
		result["eventType"] = eventType
	}
	return result
}

func recommendedBackends(family string) []string {
	if family == "terminal_realism" {
		return []string{"codex_exec", "claude_p"}
	}
	return []string{"scripted"}
}

func draftScenarioBackend(family string) string {
	if family == "terminal_realism" {
		return "codex_exec"
	}
	return "scripted"
}

func sortEvidenceNewestFirst(evidence []any) []any {
	cloned := append([]any{}, evidence...)
	sort.Slice(cloned, func(left, right int) bool {
		return parseISOTime(asMap(cloned[right])["observedAt"]) < parseISOTime(asMap(cloned[left])["observedAt"])
	})
	return cloned
}

func appendCandidate(candidates []map[string]any, candidate map[string]any) []map[string]any {
	if candidate == nil {
		return candidates
	}
	return append(candidates, candidate)
}

func mergeCandidatesByProposalKey(candidates []map[string]any) []any {
	merged := map[string]map[string]any{}
	for _, candidate := range candidates {
		key := stringOrEmpty(candidate["proposalKey"])
		merged[key] = mergeProposalRecord(merged[key], candidate)
	}
	result := make([]any, 0, len(merged))
	for _, candidate := range merged {
		result = append(result, candidate)
	}
	return result
}

func validateConversation(conversation map[string]any, index int) error {
	if _, err := normalizeNonEmptyString(conversation["threadKey"], fmt.Sprintf("conversationSummaries[%d].threadKey", index)); err != nil {
		return err
	}
	if _, err := assertArray(conversation["records"], fmt.Sprintf("conversationSummaries[%d].records", index)); err != nil {
		return err
	}
	return nil
}

func validateRunSummary(summary map[string]any, index int) error {
	for _, field := range []string{"runId", "threadKey"} {
		if _, err := normalizeNonEmptyString(summary[field], fmt.Sprintf("runSummaries[%d].%s", index, field)); err != nil {
			return err
		}
	}
	return nil
}

func getUserMessageTexts(conversation map[string]any) []string {
	messages := make([]string, 0)
	for _, rawRecord := range arrayOrEmpty(conversation["records"]) {
		record := asMap(rawRecord)
		if stringOrEmpty(record["actorKind"]) != "user" {
			continue
		}
		text := strings.TrimSpace(stringOrEmpty(record["text"]))
		if text != "" {
			messages = append(messages, text)
		}
	}
	return messages
}

func isEventTriggered(conversation map[string]any) bool {
	for _, rawRecord := range arrayOrEmpty(conversation["records"]) {
		if stringOrEmpty(asMap(rawRecord)["eventType"]) == "app_mention" {
			return true
		}
	}
	return false
}

func buildHumanEvidence(conversation map[string]any, title string, matchedTurns []string) map[string]any {
	return map[string]any{
		"sourceKind": "human_conversation",
		"title":      title,
		"threadKey":  conversation["threadKey"],
		"observedAt": conversation["lastObservedAt"],
		"messages":   matchedTurns,
	}
}

func buildRunEvidence(summary map[string]any, title string) map[string]any {
	return map[string]any{
		"sourceKind":    "agent_run",
		"title":         title,
		"runId":         summary["runId"],
		"threadKey":     summary["threadKey"],
		"observedAt":    summary["startedAt"],
		"textPreview":   stringOrEmpty(summary["textPreview"]),
		"blockedReason": summary["blockedReason"],
	}
}

func buildChatbotIntentProfile(intent string, intentProfile map[string]any, fallbackBehaviorSurface string, defaultSuccessDimensions []string) map[string]any {
	profile, _ := BuildBehaviorIntentProfile(intent, intentProfile, fallbackBehaviorSurface, defaultSuccessDimensions, nil)
	return anyFromProfile(profile)
}

func buildReviewClarificationCandidate(conversation map[string]any, userMessages []string) map[string]any {
	if len(userMessages) < 2 || !includesAny(userMessages[0], []string{"review", "리뷰", "저장소", "repo"}) || !includesAny(userMessages[1], []string{"checkout", "현재", "기준", "저장소", "repo"}) {
		return nil
	}
	return map[string]any{
		"proposalKey":    "repo-review-needs-target-clarification",
		"title":          "Refresh repo review clarification scenario from recent operator logs",
		"family":         "fast_regression",
		"intentProfile":  buildChatbotIntentProfile("Clarify the concrete repo target before starting a broad repo review workflow.", asMap(conversation["intentProfile"]), BehaviorSurfaces["WORKFLOW_CONVERSATION"], []string{BehaviorDimensions["TARGET_CLARIFICATION"]}),
		"name":           "Repo Review Needs Target Clarification",
		"description":    "A broad review request is followed by one concrete repo-target clarification.",
		"brief":          fmt.Sprintf("Recent operator logs show a broad review ask followed by a repo-target clarification: first %q, then %q.", userMessages[0], userMessages[1]),
		"tags":           []any{"operational-log", "clarification", "review"},
		"maxTurns":       float64(3),
		"simulatorTurns": []any{userMessages[0], userMessages[1]},
		"evidence":       []any{buildHumanEvidence(conversation, "review clarification", userMessages[:2])},
	}
}

func buildEventTriggeredFollowupCandidate(conversation map[string]any, userMessages []string) map[string]any {
	if !isEventTriggered(conversation) || len(userMessages) < 2 || !includesAny(userMessages[1], []string{"계속", "follow", "이어", "진행", "다음", "go ahead", "continue"}) {
		return nil
	}
	return map[string]any{
		"proposalKey":   "event-triggered-followup",
		"title":         "Refresh event-triggered follow-up scenario from recent operator logs",
		"family":        "fast_regression",
		"intentProfile": buildChatbotIntentProfile("Continue the active thread cleanly after an event-triggered wake-up.", asMap(conversation["intentProfile"]), BehaviorSurfaces["THREAD_FOLLOWUP"], []string{BehaviorDimensions["WORKFLOW_CONTINUITY"]}),
		"name":          "Event Triggered Follow-Up",
		"description":   "An app mention wakes the assistant and the user continues with a plain follow-up in the same active thread.",
		"brief":         fmt.Sprintf("Recent operator logs show an app-mention wake-up followed by a plain thread follow-up: %q then %q.", userMessages[0], userMessages[1]),
		"tags":          []any{"operational-log", "event-triggered", "followup"},
		"maxTurns":      float64(3),
		"simulatorTurns": []any{
			map[string]any{"text": userMessages[0], "eventType": "app_mention"},
			map[string]any{"text": userMessages[1]},
		},
		"evidence": []any{buildHumanEvidence(conversation, "event-triggered follow-up", userMessages[:2])},
	}
}

func buildAmbiguousConfirmationCandidate(summary map[string]any) map[string]any {
	if stringOrEmpty(summary["blockedReason"]) != "ambiguous_confirmation_without_thread_context" {
		return nil
	}
	preview := stringOrEmpty(summary["textPreview"])
	if preview == "" {
		preview = "좋아요, 진행해주세요."
	}
	return map[string]any{
		"proposalKey":    "ambiguous-confirmation-needs-context",
		"title":          "Add ambiguous confirmation without thread context scenario",
		"family":         "fast_regression",
		"intentProfile":  buildChatbotIntentProfile("Ask one clarification when a bare confirmation lacks thread context.", asMap(summary["intentProfile"]), BehaviorSurfaces["THREAD_CONTEXT_RECOVERY"], []string{BehaviorDimensions["TARGET_CLARIFICATION"]}),
		"name":           "Ambiguous Confirmation Needs Context",
		"description":    "A bare confirmation without thread context should trigger one clarification instead of blind execution.",
		"brief":          fmt.Sprintf("Recent agent runs were blocked by ambiguous confirmations without thread context. One example message was %q.", preview),
		"tags":           []any{"operational-log", "blocked", "clarification"},
		"maxTurns":       float64(2),
		"simulatorTurns": []any{preview},
		"evidence":       []any{buildRunEvidence(summary, "ambiguous confirmation blocked run")},
	}
}

func validateSkillEvaluationRun(run map[string]any, index int) error {
	for _, field := range []string{"targetKind", "targetId", "surface", "startedAt", "status", "summary"} {
		if _, err := normalizeNonEmptyString(run[field], fmt.Sprintf("evaluationRuns[%d].%s", index, field)); err != nil {
			return err
		}
	}
	return nil
}

func buildSkillValidationCandidate(run map[string]any) map[string]any {
	if !isSkillValidationRun(run) {
		return nil
	}
	displayName := skillDisplayName(run)
	targetLabel := humanizeTargetKind(stringOrEmpty(run["targetKind"]))
	surfaceLabel := humanizeSurface(stringOrEmpty(run["surface"]))
	return map[string]any{
		"proposalKey":    fmt.Sprintf("%s-%s-%s-regression", localSlugify(stringOrEmpty(run["targetKind"])), localSlugify(stringOrEmpty(run["targetId"])), localSlugify(stringOrEmpty(run["surface"]))),
		"title":          fmt.Sprintf("Refresh %s %s validation coverage", displayName, surfaceLabel),
		"family":         "fast_regression",
		"intentProfile":  anyFromProfileMust(BuildBehaviorIntentProfile(fmt.Sprintf("%s should keep the %s validation surface passing.", displayName, surfaceLabel), asMap(run["intentProfile"]), BehaviorSurfaces["SKILL_VALIDATION"], []string{BehaviorDimensions["VALIDATION_INTEGRITY"]}, nil)),
		"name":           fmt.Sprintf("%s %s Regression", displayName, titleCase(surfaceLabel)),
		"description":    fmt.Sprintf("%s %s regressed on the %s evaluation surface and should keep a durable passing scenario.", targetLabel, displayName, surfaceLabel),
		"brief":          fmt.Sprintf("Recent %s runs for %s are %s. Latest summary: %q.", surfaceLabel, displayName, stringOrEmpty(run["status"]), stringOrEmpty(run["summary"])),
		"tags":           []any{"skill", "validation", localSlugify(stringOrEmpty(run["targetKind"])), localSlugify(stringOrEmpty(run["surface"]))},
		"maxTurns":       float64(1),
		"simulatorTurns": []any{fmt.Sprintf("Run %s on the %s surface and keep the expected validation bar green.", displayName, surfaceLabel)},
		"evidence":       []any{buildSkillEvaluationEvidence(run, surfaceLabel+" regression")},
	}
}

func buildWorkflowRecoveryCandidate(run map[string]any) map[string]any {
	if !isBlockedWorkflowRun(run) {
		return nil
	}
	displayName := skillDisplayName(run)
	surfaceLabel := humanizeSurface(stringOrEmpty(run["surface"]))
	blockerSlug := localSlugify(stringOrEmpty(run["blockerKind"]))
	if blockerSlug == "" {
		blockerSlug = "blocked-workflow"
	}
	blockedCount := blockedStepCount(run)
	blockedCountText := "a repeated blocked workflow"
	if blockedCount > 0 {
		blockedCountText = fmt.Sprintf("%d blocked step(s)", blockedCount)
	}
	return map[string]any{
		"proposalKey":    fmt.Sprintf("%s-%s-%s-%s", localSlugify(stringOrEmpty(run["targetKind"])), localSlugify(stringOrEmpty(run["targetId"])), localSlugify(stringOrEmpty(run["surface"])), blockerSlug),
		"title":          fmt.Sprintf("Refresh %s %s recovery scenario", displayName, surfaceLabel),
		"family":         "fast_regression",
		"intentProfile":  anyFromProfileMust(BuildBehaviorIntentProfile(fmt.Sprintf("%s should recover cleanly when the %s workflow hits the same blocker.", displayName, surfaceLabel), asMap(run["intentProfile"]), BehaviorSurfaces["OPERATOR_WORKFLOW_RECOVERY"], []string{BehaviorDimensions["WORKFLOW_RECOVERY"], BehaviorDimensions["RECOVERY_NEXT_STEP"]}, nil)),
		"name":           fmt.Sprintf("%s %s Recovery", displayName, titleCase(surfaceLabel)),
		"description":    fmt.Sprintf("%s should recover cleanly when the %s workflow hits the same operator-facing blocker.", displayName, surfaceLabel),
		"brief":          fmt.Sprintf("Recent %s runs for %s were %s with %s. Latest summary: %q.", surfaceLabel, displayName, stringOrEmpty(run["status"]), blockedCountText, stringOrEmpty(run["summary"])),
		"tags":           []any{"skill", "workflow", "operator-recovery", localSlugify(stringOrEmpty(run["surface"])), blockerSlug},
		"maxTurns":       float64(1),
		"simulatorTurns": []any{fmt.Sprintf("Re-run %s on the %s surface and verify the workflow can recover from %s.", displayName, surfaceLabel, humanizeBlocker(stringOrEmpty(run["blockerKind"])))},
		"evidence":       []any{buildWorkflowEvidence(run, surfaceLabel+" recovery regression")},
	}
}

func buildSkillEvaluationEvidence(run map[string]any, title string) map[string]any {
	evidence := map[string]any{
		"sourceKind": "skill_evaluation",
		"title":      title,
		"targetKind": run["targetKind"],
		"targetId":   run["targetId"],
		"surface":    run["surface"],
		"status":     run["status"],
		"observedAt": run["startedAt"],
		"summary":    run["summary"],
	}
	copyIfPresent(run, evidence, "blockerKind", "metrics")
	if artifactRefs := arrayOrEmpty(run["artifactRefs"]); len(artifactRefs) > 0 {
		evidence["artifactRefs"] = artifactRefs
	}
	return evidence
}

func buildWorkflowEvidence(run map[string]any, title string) map[string]any {
	evidence := buildSkillEvaluationEvidence(run, title)
	evidence["sourceKind"] = "workflow_run"
	if blockedSteps := arrayOrEmpty(run["blockedSteps"]); len(blockedSteps) > 0 {
		evidence["blockedSteps"] = blockedSteps
	}
	return evidence
}

func isSkillValidationRun(run map[string]any) bool {
	return containsString([]string{"public_skill", "profile", "integration"}, stringOrEmpty(run["targetKind"])) &&
		containsString([]string{"failed", "degraded"}, stringOrEmpty(run["status"]))
}

func isBlockedWorkflowRun(run map[string]any) bool {
	return stringOrEmpty(run["targetKind"]) == "cli_workflow" &&
		containsString([]string{"blocked", "degraded"}, stringOrEmpty(run["status"]))
}

func blockedStepCount(run map[string]any) int {
	if blockedSteps := arrayOrEmpty(run["blockedSteps"]); len(blockedSteps) > 0 {
		return len(blockedSteps)
	}
	if metrics := asMap(run["metrics"]); len(metrics) > 0 {
		if value, ok := toFloat(metrics["blockedSteps"]); ok {
			return int(value)
		}
		if value, ok := toFloat(metrics["blocked_steps"]); ok {
			return int(value)
		}
	}
	return 0
}

func skillDisplayName(run map[string]any) string {
	if text := strings.TrimSpace(stringOrEmpty(run["displayName"])); text != "" {
		return text
	}
	return strings.TrimSpace(stringOrEmpty(run["targetId"]))
}

func humanizeTargetKind(targetKind string) string {
	labels := map[string]string{
		"public_skill": "Public Skill",
		"profile":      "Profile",
		"integration":  "Integration",
		"cli_workflow": "CLI Workflow",
	}
	if label, ok := labels[targetKind]; ok {
		return label
	}
	return strings.ReplaceAll(targetKind, "_", " ")
}

func humanizeSurface(surface string) string {
	return strings.ReplaceAll(surface, "_", " ")
}

func titleCase(text string) string {
	parts := strings.Fields(text)
	out := make([]string, 0, len(parts))
	for _, part := range parts {
		if part == "" {
			continue
		}
		out = append(out, strings.ToUpper(part[:1])+part[1:])
	}
	return strings.Join(out, " ")
}

func humanizeBlocker(blockerKind string) string {
	if blockerKind == "" {
		return "the repeated blocker"
	}
	return humanizeSurface(blockerKind)
}

func anyFromProfileMust(profile *BehaviorIntentProfile, err error) map[string]any {
	if err != nil || profile == nil {
		return map[string]any{}
	}
	return anyFromProfile(profile)
}

func anyFromProfile(profile *BehaviorIntentProfile) map[string]any {
	if profile == nil {
		return map[string]any{}
	}
	payload := map[string]any{
		"schemaVersion":       profile.SchemaVersion,
		"intentId":            profile.IntentID,
		"summary":             profile.Summary,
		"behaviorSurface":     profile.BehaviorSurface,
		"successDimensions":   profile.SuccessDimensions,
		"guardrailDimensions": profile.GuardrailDimensions,
	}
	return payload
}

func localSlugify(value string) string {
	return slugify(value)
}

func includesAny(text string, snippets []string) bool {
	normalized := strings.ToLower(strings.TrimSpace(text))
	for _, snippet := range snippets {
		if strings.Contains(normalized, strings.ToLower(snippet)) {
			return true
		}
	}
	return false
}

func takeAny(values []any, limit int) []any {
	if len(values) <= limit {
		return values
	}
	return values[:limit]
}

func chooseFloat(value any, fallback float64) float64 {
	if number, ok := toFloat(value); ok {
		return number
	}
	return fallback
}

func optionalTime(now *time.Time) any {
	if now == nil {
		return nil
	}
	return now.UTC().Format(time.RFC3339Nano)
}

func parseOptionalNow(value any) time.Time {
	if text, ok := value.(string); ok && strings.TrimSpace(text) != "" {
		if parsed, err := time.Parse(time.RFC3339Nano, text); err == nil {
			return parsed
		}
	}
	return time.Now()
}

func intValueOrDefault(value any, fallback int) int {
	number, ok := toFloat(value)
	if !ok || int(number) <= 0 {
		return fallback
	}
	return int(number)
}

func readScenarioKeys(registry []any) []string {
	keys := make([]string, 0, len(registry))
	for index, rawEntry := range registry {
		entry, ok := rawEntry.(map[string]any)
		if !ok {
			continue
		}
		key := strings.TrimSpace(stringOrEmpty(entry["scenarioKey"]))
		if key == "" {
			panic(fmt.Sprintf("existingScenarioRegistry[%d].scenarioKey must be a non-empty string", index))
		}
		keys = append(keys, key)
	}
	return keys
}

func readScenarioCoverage(coverage []any) map[string]float64 {
	result := map[string]float64{}
	for _, rawEntry := range coverage {
		entry, ok := rawEntry.(map[string]any)
		if !ok {
			continue
		}
		key := strings.TrimSpace(stringOrEmpty(entry["scenarioKey"]))
		if key == "" {
			continue
		}
		value, _ := toFloat(entry["recentResultCount"])
		result[key] = value
	}
	return result
}
