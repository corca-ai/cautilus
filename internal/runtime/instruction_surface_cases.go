package runtime

import (
	"fmt"

	"github.com/corca-ai/cautilus/internal/contracts"
)

type InstructionSurfaceFileSpec struct {
	Path       string
	Kind       string
	Content    *string
	SourceFile *string
	TargetPath *string
}

type InstructionSurfaceVariant struct {
	SurfaceLabel string
	Files        []InstructionSurfaceFileSpec
}

type InstructionSurfaceCase struct {
	EvaluationID              string
	DisplayName               string
	Prompt                    string
	TaskPath                  *string
	InstructionSurface        *InstructionSurfaceVariant
	ExpectedEntryFile         *string
	RequiredInstructionFiles  []string
	ForbiddenInstructionFiles []string
	RequiredSupportingFiles   []string
	ForbiddenSupportingFiles  []string
	ExpectedRouting           map[string]any
}

type InstructionSurfaceCaseSuite struct {
	SuiteID          string
	SuiteDisplayName string
	Evaluations      []InstructionSurfaceCase
}

func NormalizeInstructionSurfaceCaseSuite(input map[string]any) (*InstructionSurfaceCaseSuite, error) {
	if input["schemaVersion"] != contracts.InstructionSurfaceCasesSchema {
		return nil, fmt.Errorf("schemaVersion must be %s", contracts.InstructionSurfaceCasesSchema)
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
	rawEvaluations, err := assertArray(input["evaluations"], "evaluations")
	if err != nil {
		return nil, err
	}
	if len(rawEvaluations) == 0 {
		return nil, fmt.Errorf("evaluations must be a non-empty array")
	}
	evaluations := make([]InstructionSurfaceCase, 0, len(rawEvaluations))
	for index, rawEvaluation := range rawEvaluations {
		record, ok := rawEvaluation.(map[string]any)
		if !ok {
			return nil, fmt.Errorf("evaluations[%d] must be an object", index)
		}
		evaluation, err := normalizeInstructionSurfaceCase(record, index)
		if err != nil {
			return nil, err
		}
		evaluations = append(evaluations, *evaluation)
	}
	return &InstructionSurfaceCaseSuite{
		SuiteID:          suiteID,
		SuiteDisplayName: suiteDisplayName,
		Evaluations:      evaluations,
	}, nil
}

func normalizeInstructionSurfaceCase(input map[string]any, index int) (*InstructionSurfaceCase, error) {
	evaluationID, err := normalizeNonEmptyString(input["evaluationId"], fmt.Sprintf("evaluations[%d].evaluationId", index))
	if err != nil {
		return nil, err
	}
	displayName := evaluationID
	if value, err := normalizeOptionalString(input["displayName"], fmt.Sprintf("evaluations[%d].displayName", index)); err != nil {
		return nil, err
	} else if value != nil {
		displayName = *value
	}
	prompt, err := normalizeNonEmptyString(input["prompt"], fmt.Sprintf("evaluations[%d].prompt", index))
	if err != nil {
		return nil, err
	}
	taskPath, err := normalizeOptionalString(input["taskPath"], fmt.Sprintf("evaluations[%d].taskPath", index))
	if err != nil {
		return nil, err
	}
	instructionSurface, err := normalizeInstructionSurfaceVariant(input["instructionSurface"], fmt.Sprintf("evaluations[%d].instructionSurface", index))
	if err != nil {
		return nil, err
	}
	expectedEntryFile, err := normalizeOptionalString(input["expectedEntryFile"], fmt.Sprintf("evaluations[%d].expectedEntryFile", index))
	if err != nil {
		return nil, err
	}
	requiredInstructionFiles, err := normalizeInstructionSurfacePathList(input["requiredInstructionFiles"], fmt.Sprintf("evaluations[%d].requiredInstructionFiles", index))
	if err != nil {
		return nil, err
	}
	forbiddenInstructionFiles, err := normalizeInstructionSurfacePathList(input["forbiddenInstructionFiles"], fmt.Sprintf("evaluations[%d].forbiddenInstructionFiles", index))
	if err != nil {
		return nil, err
	}
	requiredSupportingFiles, err := normalizeInstructionSurfacePathList(input["requiredSupportingFiles"], fmt.Sprintf("evaluations[%d].requiredSupportingFiles", index))
	if err != nil {
		return nil, err
	}
	forbiddenSupportingFiles, err := normalizeInstructionSurfacePathList(input["forbiddenSupportingFiles"], fmt.Sprintf("evaluations[%d].forbiddenSupportingFiles", index))
	if err != nil {
		return nil, err
	}
	expectedRouting, err := normalizeInstructionSurfaceExpectedRouting(input["expectedRouting"], fmt.Sprintf("evaluations[%d].expectedRouting", index))
	if err != nil {
		return nil, err
	}
	return &InstructionSurfaceCase{
		EvaluationID:              evaluationID,
		DisplayName:               displayName,
		Prompt:                    prompt,
		TaskPath:                  taskPath,
		InstructionSurface:        instructionSurface,
		ExpectedEntryFile:         expectedEntryFile,
		RequiredInstructionFiles:  requiredInstructionFiles,
		ForbiddenInstructionFiles: forbiddenInstructionFiles,
		RequiredSupportingFiles:   requiredSupportingFiles,
		ForbiddenSupportingFiles:  forbiddenSupportingFiles,
		ExpectedRouting:           expectedRouting,
	}, nil
}

func normalizeInstructionSurfaceVariant(value any, field string) (*InstructionSurfaceVariant, error) {
	if value == nil {
		return nil, nil
	}
	record := asMap(value)
	if len(record) == 0 {
		return nil, fmt.Errorf("%s must be an object", field)
	}
	surfaceLabel := "custom_instruction_surface"
	if value, err := normalizeOptionalString(record["surfaceLabel"], field+".surfaceLabel"); err != nil {
		return nil, err
	} else if value != nil {
		surfaceLabel = *value
	}
	rawFiles, err := assertArray(record["files"], field+".files")
	if err != nil {
		return nil, err
	}
	if len(rawFiles) == 0 {
		return nil, fmt.Errorf("%s.files must be a non-empty array", field)
	}
	files := make([]InstructionSurfaceFileSpec, 0, len(rawFiles))
	for index, rawFile := range rawFiles {
		entry, ok := rawFile.(map[string]any)
		if !ok {
			return nil, fmt.Errorf("%s.files[%d] must be an object", field, index)
		}
		file, err := normalizeInstructionSurfaceFileSpec(entry, fmt.Sprintf("%s.files[%d]", field, index))
		if err != nil {
			return nil, err
		}
		files = append(files, *file)
	}
	return &InstructionSurfaceVariant{
		SurfaceLabel: surfaceLabel,
		Files:        files,
	}, nil
}

func normalizeInstructionSurfaceFileSpec(input map[string]any, field string) (*InstructionSurfaceFileSpec, error) {
	path, err := normalizeNonEmptyString(input["path"], field+".path")
	if err != nil {
		return nil, err
	}
	kind := "file"
	if value, err := normalizeOptionalString(input["kind"], field+".kind"); err != nil {
		return nil, err
	} else if value != nil {
		kind = *value
	}
	if !containsString([]string{"file", "symlink"}, kind) {
		return nil, fmt.Errorf("%s.kind must be one of: file, symlink", field)
	}
	content, err := normalizeOptionalString(input["content"], field+".content")
	if err != nil {
		return nil, err
	}
	sourceFile, err := normalizeOptionalString(input["sourceFile"], field+".sourceFile")
	if err != nil {
		return nil, err
	}
	targetPath, err := normalizeOptionalString(input["targetPath"], field+".targetPath")
	if err != nil {
		return nil, err
	}
	if kind == "file" {
		if (content == nil && sourceFile == nil) || (content != nil && sourceFile != nil) {
			return nil, fmt.Errorf("%s must set exactly one of content or sourceFile for kind=file", field)
		}
		if targetPath != nil {
			return nil, fmt.Errorf("%s.targetPath is only valid for kind=symlink", field)
		}
	} else {
		if targetPath == nil {
			return nil, fmt.Errorf("%s.targetPath must be set for kind=symlink", field)
		}
		if content != nil || sourceFile != nil {
			return nil, fmt.Errorf("%s must not set content or sourceFile for kind=symlink", field)
		}
	}
	return &InstructionSurfaceFileSpec{
		Path:       path,
		Kind:       kind,
		Content:    content,
		SourceFile: sourceFile,
		TargetPath: targetPath,
	}, nil
}

func normalizeInstructionSurfacePathList(value any, field string) ([]string, error) {
	items, err := assertArray(value, field)
	if err != nil {
		return nil, err
	}
	result := make([]string, 0, len(items))
	for index, item := range items {
		text, err := normalizeNonEmptyString(item, fmt.Sprintf("%s[%d]", field, index))
		if err != nil {
			return nil, err
		}
		result = append(result, text)
	}
	return result, nil
}

func normalizeInstructionSurfaceExpectedRouting(value any, field string) (map[string]any, error) {
	if value == nil {
		return nil, nil
	}
	record := asMap(value)
	if len(record) == 0 {
		return nil, fmt.Errorf("%s must be an object", field)
	}
	normalized := map[string]any{}
	for _, key := range []string{"selectedSkill", "selectedSupport", "firstToolCallPattern"} {
		if rawValue, ok := record[key]; ok {
			text, err := normalizeNonEmptyString(rawValue, field+"."+key)
			if err != nil {
				return nil, err
			}
			normalized[key] = text
		}
	}
	if len(normalized) == 0 {
		return nil, fmt.Errorf("%s must declare at least one expectation field", field)
	}
	return normalized, nil
}
