package runtime

import (
	"fmt"
	"strings"
)

func AttachDoctorGuidance(result map[string]any, repoRoot string, scope string, adapterName *string) map[string]any {
	var action map[string]any
	switch scope {
	case "agent-surface":
		action = buildAgentSurfaceNextAction(result, repoRoot)
	default:
		action = buildRepoNextAction(result, repoRoot, adapterName)
	}
	if len(action) == 0 {
		return result
	}
	result["next_action"] = action
	result["next_prompt"] = buildDoctorNextPrompt(action)
	return result
}

func buildRepoNextAction(result map[string]any, repoRoot string, adapterName *string) map[string]any {
	status := strings.TrimSpace(stringOrEmpty(result["status"]))
	currentDoctorCommand := doctorNextActionCommand(repoRoot, adapterName, "repo")
	adapterPath := strings.TrimSpace(stringOrEmpty(result["adapter_path"]))

	switch status {
	case "missing_git":
		return doctorAction(
			"run_command",
			"Initialize a git repository before Cautilus validates repo readiness.",
			fmt.Sprintf("git -C %s init", ShellSingleQuote(repoRoot)),
			currentDoctorCommand,
		)
	case "no_commits":
		return doctorAction(
			"manual",
			fmt.Sprintf("Create the first git commit in %s, then continue from doctor.", repoRoot),
			"",
			currentDoctorCommand,
		)
	case "missing_adapter":
		return doctorAction(
			"run_command",
			"Scaffold the default adapter so Cautilus can inspect a checked-in evaluation surface.",
			fmt.Sprintf("cautilus adapter init --repo-root %s", ShellSingleQuote(repoRoot)),
			currentDoctorCommand,
		)
	case "missing_default_adapter":
		namedAdapters := arrayOrEmpty(result["named_adapters"])
		if len(namedAdapters) > 0 {
			firstNamed := strings.TrimSpace(stringOrEmpty(asMap(namedAdapters[0])["name"]))
			if firstNamed != "" {
				nextCommand := doctorNextActionCommand(repoRoot, &firstNamed, "repo")
				return doctorAction(
					"switch_context",
					fmt.Sprintf("Default adapter is missing. Continue the onboarding loop through the named adapter %q.", firstNamed),
					nextCommand,
					nextCommand,
				)
			}
		}
		return doctorAction(
			"manual",
			"Default adapter is missing. Pick a named adapter or add .agents/cautilus-adapter.yaml before continuing.",
			"",
			currentDoctorCommand,
		)
	case "invalid_adapter":
		message := "Repair the checked-in adapter fields reported in errors, then continue from doctor."
		if adapterPath != "" {
			message = fmt.Sprintf("Repair the adapter at %s using the reported errors, then continue from doctor.", adapterPath)
		}
		return doctorAction("edit_adapter", message, "", currentDoctorCommand)
	case "incomplete_adapter":
		return doctorAction("edit_adapter", incompleteAdapterMessage(result, adapterPath), "", currentDoctorCommand)
	case "ready":
		discoveryCommand := strings.TrimSpace(stringOrEmpty(asMap(result["first_bounded_run"])["discoveryCommand"]))
		if discoveryCommand == "" {
			discoveryCommand = "cautilus scenarios --json"
		}
		return doctorAction(
			"complete_first_bounded_run",
			fmt.Sprintf("Repo is ready. Read first_bounded_run and complete one bounded run instead of rerunning doctor. Start with `%s` if you still need the archetype catalog.", discoveryCommand),
			"",
			"",
		)
	default:
		return doctorAction("manual", "Inspect the doctor payload and continue from the first incomplete requirement.", "", currentDoctorCommand)
	}
}

func buildAgentSurfaceNextAction(result map[string]any, repoRoot string) map[string]any {
	currentDoctorCommand := doctorNextActionCommand(repoRoot, nil, "agent-surface")
	switch strings.TrimSpace(stringOrEmpty(result["status"])) {
	case "missing_agent_surface":
		return doctorAction(
			"run_command",
			"Materialize the bundled skill surface in this repo before asking an in-repo assistant to use Cautilus.",
			fmt.Sprintf("cautilus install --repo-root %s", ShellSingleQuote(repoRoot)),
			currentDoctorCommand,
		)
	case "ready":
		return doctorAction(
			"switch_context",
			"Agent surface is ready. Continue the onboarding loop through repo-scope doctor.",
			doctorNextActionCommand(repoRoot, nil, "repo"),
			doctorNextActionCommand(repoRoot, nil, "repo"),
		)
	default:
		return doctorAction("manual", "Inspect the agent-surface doctor payload and continue from the first incomplete requirement.", "", currentDoctorCommand)
	}
}

func incompleteAdapterMessage(result map[string]any, adapterPath string) string {
	target := "the checked-in adapter"
	if adapterPath != "" {
		target = adapterPath
	}
	switch firstIncompleteCheckID(result) {
	case "repo_name":
		return fmt.Sprintf("Edit %s and set adapter.repo before continuing.", target)
	case "evaluation_surfaces":
		return fmt.Sprintf("Edit %s and add at least one evaluation_surfaces entry before continuing.", target)
	case "baseline_options":
		return fmt.Sprintf("Edit %s and add at least one baseline_options entry before continuing.", target)
	case "execution_surface":
		return fmt.Sprintf("Edit %s and add at least one runnable command template or executor_variants entry before continuing.", target)
	default:
		return fmt.Sprintf("Edit %s to satisfy the missing doctor checks, then continue from doctor.", target)
	}
}

func firstIncompleteCheckID(result map[string]any) string {
	for _, raw := range arrayOrEmpty(result["checks"]) {
		check := asMap(raw)
		if !truthy(check["ok"]) {
			return strings.TrimSpace(stringOrEmpty(check["id"]))
		}
	}
	return ""
}

func doctorAction(kind string, message string, command string, continueCommand string) map[string]any {
	action := map[string]any{
		"kind":    kind,
		"message": message,
	}
	if strings.TrimSpace(command) != "" {
		action["command"] = command
	}
	if strings.TrimSpace(continueCommand) != "" {
		action["continue_command"] = continueCommand
	}
	return action
}

func buildDoctorNextPrompt(action map[string]any) string {
	message := strings.TrimSpace(stringOrEmpty(action["message"]))
	command := strings.TrimSpace(stringOrEmpty(action["command"]))
	continueCommand := strings.TrimSpace(stringOrEmpty(action["continue_command"]))

	switch {
	case command != "" && continueCommand != "" && command == continueCommand:
		return fmt.Sprintf("Run `%s` and continue from the returned next action.", command)
	case command != "" && continueCommand != "":
		return fmt.Sprintf("Run `%s`. After it completes, run `%s` and continue from the returned next action.", command, continueCommand)
	case command != "":
		return fmt.Sprintf("Run `%s`.", command)
	case message != "" && continueCommand != "":
		return fmt.Sprintf("%s Then run `%s` again.", message, continueCommand)
	default:
		return message
	}
}

func doctorBaseCommand(repoRoot string, adapterName *string, scope string) string {
	command := fmt.Sprintf("cautilus doctor --repo-root %s", ShellSingleQuote(repoRoot))
	if adapterName != nil && strings.TrimSpace(*adapterName) != "" {
		command += " --adapter-name " + ShellSingleQuote(strings.TrimSpace(*adapterName))
	}
	if strings.TrimSpace(scope) != "" && scope != "repo" {
		command += " --scope " + ShellSingleQuote(scope)
	}
	return command
}

func doctorNextActionCommand(repoRoot string, adapterName *string, scope string) string {
	return doctorBaseCommand(repoRoot, adapterName, scope) + " --next-action"
}
