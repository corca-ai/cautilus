package runtime

import (
	"fmt"

	"github.com/corca-ai/cautilus/internal/contracts"
)

// EvaluationInput is the v1 fixture envelope defined in
// docs/specs/evaluation-surfaces.spec.md. The first slice supports only the
// repo / whole-repo preset; other surface/preset combinations and the C2/C3/C4
// composition primitives error out until their slices ship.
type EvaluationInput struct {
	Surface         string
	Preset          string
	CaseSuite       *InstructionSurfaceCaseSuite
	TranslatedCases map[string]any
}

var supportedEvaluationCombos = map[string]map[string]bool{
	"repo": {"whole-repo": true},
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
		return nil, fmt.Errorf("extends is reserved for a future composition slice (C2)")
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
		translated, err := translateEvaluationCase(entry, index)
		if err != nil {
			return nil, err
		}
		translatedEvaluations = append(translatedEvaluations, translated)
	}
	translatedSuite := map[string]any{
		"schemaVersion":    contracts.InstructionSurfaceCasesSchema,
		"suiteId":          suiteID,
		"suiteDisplayName": suiteDisplayName,
		"evaluations":      translatedEvaluations,
	}
	caseSuite, err := NormalizeInstructionSurfaceCaseSuite(translatedSuite)
	if err != nil {
		return nil, err
	}
	return &EvaluationInput{
		Surface:         surface,
		Preset:          preset,
		CaseSuite:       caseSuite,
		TranslatedCases: translatedSuite,
	}, nil
}

func translateEvaluationCase(entry map[string]any, index int) (map[string]any, error) {
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
