package runtime

import (
	"strings"
	"testing"
)

func TestScaffoldAdapterLeavesSlotsEmptyWithoutScenario(t *testing.T) {
	scaffold := ScaffoldAdapter(t.TempDir(), "repo-x", "")
	skillSlot, ok := scaffold["skill_test_command_templates"].([]string)
	if !ok || len(skillSlot) != 0 {
		t.Fatalf("expected empty skill_test_command_templates without scenario, got %#v", scaffold["skill_test_command_templates"])
	}
	if surfaces, ok := scaffold["evaluation_surfaces"].([]string); !ok || len(surfaces) != 2 {
		t.Fatalf("expected generic evaluation_surfaces without scenario, got %#v", scaffold["evaluation_surfaces"])
	}
}

func TestScaffoldAdapterSkillPrefillsSkillTestSlot(t *testing.T) {
	scaffold := ScaffoldAdapter(t.TempDir(), "repo-x", "skill")
	slot, ok := scaffold["skill_test_command_templates"].([]string)
	if !ok || len(slot) == 0 {
		t.Fatalf("expected skill_test_command_templates to be pre-filled for skill scenario, got %#v", scaffold["skill_test_command_templates"])
	}
	if cases, ok := scaffold["skill_cases_default"].(string); !ok || cases == "" {
		t.Fatalf("expected skill_cases_default to be set for skill scenario, got %#v", scaffold["skill_cases_default"])
	}
	surfaces, ok := scaffold["evaluation_surfaces"].([]string)
	if !ok || len(surfaces) == 0 {
		t.Fatalf("expected evaluation_surfaces to be set, got %#v", scaffold["evaluation_surfaces"])
	}
	found := false
	for _, surface := range surfaces {
		if strings.Contains(surface, "skill") {
			found = true
			break
		}
	}
	if !found {
		t.Fatalf("expected evaluation_surfaces to mention skill, got %#v", surfaces)
	}
}

func TestScaffoldAdapterChatbotPrefillsIterateSlot(t *testing.T) {
	scaffold := ScaffoldAdapter(t.TempDir(), "repo-x", "chatbot")
	slot, ok := scaffold["iterate_command_templates"].([]string)
	if !ok || len(slot) == 0 {
		t.Fatalf("expected iterate_command_templates to be pre-filled for chatbot scenario, got %#v", scaffold["iterate_command_templates"])
	}
	if !strings.Contains(slot[0], "chatbot") {
		t.Fatalf("expected chatbot-archetype command template, got %q", slot[0])
	}
}

func TestScaffoldAdapterWorkflowPrefillsIterateSlot(t *testing.T) {
	scaffold := ScaffoldAdapter(t.TempDir(), "repo-x", "workflow")
	slot, ok := scaffold["iterate_command_templates"].([]string)
	if !ok || len(slot) == 0 {
		t.Fatalf("expected iterate_command_templates to be pre-filled for workflow scenario, got %#v", scaffold["iterate_command_templates"])
	}
	if !strings.Contains(slot[0], "workflow") {
		t.Fatalf("expected workflow-archetype command template, got %q", slot[0])
	}
}
