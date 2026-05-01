package runtime

import (
	"encoding/json"
	"fmt"
	"os"
	"path/filepath"

	"github.com/corca-ai/cautilus/internal/contracts"
)

// EvaluationInput is the v1 fixture envelope defined in
// docs/specs/evaluation-surfaces.spec.md. The current slice supports only the
// dev/repo, dev/skill, app/chat, and app/prompt presets; C2 extends is
// supported through NormalizeEvaluationInputFromFile so relative base paths have
// an honest file anchor.
type EvaluationInput struct {
	Surface          string
	Preset           string
	SuiteID          string
	SuiteDisplayName string
	TranslatedCases  map[string]any
}

var supportedEvaluationCombos = map[string]map[string]bool{
	"dev": {"repo": true, "skill": true},
	"app": {"chat": true, "prompt": true},
}

func NormalizeEvaluationInput(input map[string]any) (*EvaluationInput, error) {
	if input["schemaVersion"] != contracts.EvaluationInputSchema {
		return nil, fmt.Errorf("schemaVersion must be %s", contracts.EvaluationInputSchema)
	}
	surface, err := normalizeNonEmptyString(input["surface"], "surface")
	if err != nil {
		return nil, err
	}
	preset, err := normalizeNonEmptyString(input["preset"], "preset")
	if err != nil {
		return nil, err
	}
	allowedPresets, ok := supportedEvaluationCombos[surface]
	if !ok {
		return nil, fmt.Errorf("surface %q is not supported in this slice", surface)
	}
	if !allowedPresets[preset] {
		return nil, fmt.Errorf("preset %q is not supported on surface %q in this slice", preset, surface)
	}
	if _, present := input["extends"]; present {
		return nil, fmt.Errorf("extends requires file-backed normalization")
	}
	if _, present := input["steps"]; present {
		return nil, fmt.Errorf("steps is reserved for a future composition slice (C3)")
	}
	suiteID, err := normalizeNonEmptyString(input["suiteId"], "suiteId")
	if err != nil {
		return nil, err
	}
	suiteDisplayName := suiteID
	if value, err := normalizeOptionalString(input["suiteDisplayName"], "suiteDisplayName"); err != nil {
		return nil, err
	} else if value != nil {
		suiteDisplayName = *value
	}
	switch preset {
	case "repo":
		translated, err := translateDevRepoFixture(input, suiteID, suiteDisplayName)
		if err != nil {
			return nil, err
		}
		return &EvaluationInput{
			Surface:          surface,
			Preset:           preset,
			SuiteID:          suiteID,
			SuiteDisplayName: suiteDisplayName,
			TranslatedCases:  translated,
		}, nil
	case "skill":
		translated, err := translateSkillFixture(input, suiteID, suiteDisplayName)
		if err != nil {
			return nil, err
		}
		return &EvaluationInput{
			Surface:          surface,
			Preset:           preset,
			SuiteID:          suiteID,
			SuiteDisplayName: suiteDisplayName,
			TranslatedCases:  translated,
		}, nil
	case "chat":
		translated, err := translateAppChatFixture(input, suiteID, suiteDisplayName)
		if err != nil {
			return nil, err
		}
		return &EvaluationInput{
			Surface:          surface,
			Preset:           preset,
			SuiteID:          suiteID,
			SuiteDisplayName: suiteDisplayName,
			TranslatedCases:  translated,
		}, nil
	case "prompt":
		translated, err := translateAppPromptFixture(input, suiteID, suiteDisplayName)
		if err != nil {
			return nil, err
		}
		return &EvaluationInput{
			Surface:          surface,
			Preset:           preset,
			SuiteID:          suiteID,
			SuiteDisplayName: suiteDisplayName,
			TranslatedCases:  translated,
		}, nil
	default:
		return nil, fmt.Errorf("preset %q has no translator", preset)
	}
}

func NormalizeEvaluationInputFromFile(path string) (*EvaluationInput, error) {
	input, err := loadEvaluationInputWithExtends(path, map[string]bool{})
	if err != nil {
		return nil, err
	}
	return NormalizeEvaluationInput(input)
}

func loadEvaluationInputWithExtends(path string, stack map[string]bool) (map[string]any, error) {
	resolved, err := filepath.Abs(path)
	if err != nil {
		return nil, err
	}
	if stack[resolved] {
		return nil, fmt.Errorf("evaluation fixture extends cycle includes %s", path)
	}
	payload, err := os.ReadFile(resolved)
	if err != nil {
		return nil, fmt.Errorf("read evaluation fixture %s: %w", path, err)
	}
	var input map[string]any
	if err := json.Unmarshal(payload, &input); err != nil {
		return nil, fmt.Errorf("parse evaluation fixture %s: %w", path, err)
	}
	extendsValue, hasExtends := input["extends"]
	if !hasExtends {
		return input, nil
	}
	extendsPath, err := normalizeNonEmptyString(extendsValue, "extends")
	if err != nil {
		return nil, err
	}
	if filepath.IsAbs(extendsPath) {
		return nil, fmt.Errorf("extends must be repo-local and relative: %s", extendsPath)
	}
	stack[resolved] = true
	basePath := filepath.Join(filepath.Dir(resolved), extendsPath)
	base, err := loadEvaluationInputWithExtends(basePath, stack)
	delete(stack, resolved)
	if err != nil {
		return nil, err
	}
	delete(input, "extends")
	return deepMergeEvaluationFixture(base, input), nil
}

func deepMergeEvaluationFixture(base map[string]any, override map[string]any) map[string]any {
	merged := map[string]any{}
	for key, value := range base {
		merged[key] = value
	}
	for key, value := range override {
		if baseMap, ok := merged[key].(map[string]any); ok {
			if overrideMap, ok := value.(map[string]any); ok {
				merged[key] = deepMergeEvaluationFixture(baseMap, overrideMap)
				continue
			}
		}
		merged[key] = value
	}
	return merged
}

func translateDevRepoFixture(input map[string]any, suiteID string, suiteDisplayName string) (map[string]any, error) {
	rawCases, err := assertArray(input["cases"], "cases")
	if err != nil {
		return nil, err
	}
	if len(rawCases) == 0 {
		return nil, fmt.Errorf("cases must be a non-empty array")
	}
	translatedEvaluations := make([]any, 0, len(rawCases))
	for index, rawCase := range rawCases {
		entry, ok := rawCase.(map[string]any)
		if !ok {
			return nil, fmt.Errorf("cases[%d] must be an object", index)
		}
		translated, err := translateDevRepoCase(entry, index)
		if err != nil {
			return nil, err
		}
		translatedEvaluations = append(translatedEvaluations, translated)
	}
	translatedSuite := map[string]any{
		"schemaVersion":    contracts.EvaluationCasesSchema,
		"suiteId":          suiteID,
		"suiteDisplayName": suiteDisplayName,
		"evaluations":      translatedEvaluations,
	}
	if _, err := NormalizeEvaluationCases(translatedSuite); err != nil {
		return nil, err
	}
	return translatedSuite, nil
}

func translateDevRepoCase(entry map[string]any, index int) (map[string]any, error) {
	caseID, err := normalizeNonEmptyString(entry["caseId"], fmt.Sprintf("cases[%d].caseId", index))
	if err != nil {
		return nil, err
	}
	if expected, present := entry["expected"]; present {
		expectedMap := asMap(expected)
		if _, snapshot := expectedMap["snapshot"]; snapshot {
			return nil, fmt.Errorf("cases[%d].expected.snapshot is reserved for a future composition slice (C4)", index)
		}
	}
	translated := map[string]any{}
	for key, value := range entry {
		if key == "caseId" {
			continue
		}
		translated[key] = value
	}
	translated["evaluationId"] = caseID
	return translated, nil
}

func translateSkillFixture(input map[string]any, suiteID string, suiteDisplayName string) (map[string]any, error) {
	skillID := suiteID
	if value, err := normalizeOptionalString(input["skillId"], "skillId"); err != nil {
		return nil, err
	} else if value != nil {
		skillID = *value
	}
	skillDisplayName := suiteDisplayName
	if value, err := normalizeOptionalString(input["skillDisplayName"], "skillDisplayName"); err != nil {
		return nil, err
	} else if value != nil {
		skillDisplayName = *value
	}
	rawCases, err := assertArray(input["cases"], "cases")
	if err != nil {
		return nil, err
	}
	if len(rawCases) == 0 {
		return nil, fmt.Errorf("cases must be a non-empty array")
	}
	translatedCases := make([]any, 0, len(rawCases))
	for index, rawCase := range rawCases {
		entry, ok := rawCase.(map[string]any)
		if !ok {
			return nil, fmt.Errorf("cases[%d] must be an object", index)
		}
		if expected, present := entry["expected"]; present {
			expectedMap := asMap(expected)
			if _, snapshot := expectedMap["snapshot"]; snapshot {
				return nil, fmt.Errorf("cases[%d].expected.snapshot is reserved for a future composition slice (C4)", index)
			}
			return nil, fmt.Errorf("cases[%d].expected is not supported on dev/skill; declare expectedTrigger or thresholds at the case level instead", index)
		}
		translated := map[string]any{}
		for key, value := range entry {
			translated[key] = value
		}
		if _, hasPrompt := translated["prompt"]; !hasPrompt {
			if turns := arrayOrEmpty(translated["turns"]); len(turns) > 0 {
				firstTurn := asMap(turns[0])
				translated["prompt"] = fmt.Sprintf("Multi-turn episode starting with: %s", stringFromAny(firstTurn["input"]))
			}
		}
		translatedCases = append(translatedCases, translated)
	}
	translatedSuite := map[string]any{
		"schemaVersion":    contracts.SkillTestCasesSchema,
		"skillId":          skillID,
		"skillDisplayName": skillDisplayName,
		"cases":            translatedCases,
	}
	if value, present := input["repeatCount"]; present {
		translatedSuite["repeatCount"] = value
	}
	if value, present := input["minConsensusCount"]; present {
		translatedSuite["minConsensusCount"] = value
	}
	if _, err := NormalizeSkillTestCaseSuite(translatedSuite); err != nil {
		return nil, err
	}
	return translatedSuite, nil
}
