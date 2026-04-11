package runtime

import (
	"encoding/json"
	"errors"
	"fmt"
	"math"
	"os"
	"path/filepath"
	"strconv"
	"strings"
	"time"
)

func normalizeNonEmptyString(value any, field string) (string, error) {
	text, ok := value.(string)
	if !ok || strings.TrimSpace(text) == "" {
		return "", fmt.Errorf("%s must be a non-empty string", field)
	}
	return strings.TrimSpace(text), nil
}

func normalizeOptionalString(value any, field string) (*string, error) {
	if value == nil {
		return nil, nil
	}
	text, err := normalizeNonEmptyString(value, field)
	if err != nil {
		return nil, err
	}
	return &text, nil
}

func normalizeISOTimestamp(value any, field string) (*string, error) {
	if value == nil {
		return nil, nil
	}
	text, ok := value.(string)
	if !ok {
		return nil, fmt.Errorf("%s must be a valid ISO timestamp", field)
	}
	if _, err := time.Parse(time.RFC3339Nano, text); err != nil {
		return nil, fmt.Errorf("%s must be a valid ISO timestamp", field)
	}
	return &text, nil
}

func normalizeNonNegativeNumber(value any, field string) (*float64, error) {
	if value == nil {
		return nil, nil
	}
	number, ok := toFloat(value)
	if !ok || math.IsNaN(number) || math.IsInf(number, 0) || number < 0 {
		return nil, fmt.Errorf("%s must be a non-negative number", field)
	}
	return &number, nil
}

func normalizeInteger(value any, field string) (*int, error) {
	number, ok := toFloat(value)
	if !ok || math.IsNaN(number) || math.IsInf(number, 0) || math.Trunc(number) != number {
		return nil, fmt.Errorf("%s must be an integer", field)
	}
	result := int(number)
	return &result, nil
}

func toFloat(value any) (float64, bool) {
	switch typed := value.(type) {
	case float64:
		return typed, true
	case float32:
		return float64(typed), true
	case int:
		return float64(typed), true
	case int64:
		return float64(typed), true
	case int32:
		return float64(typed), true
	case json.Number:
		number, err := typed.Float64()
		return number, err == nil
	default:
		return 0, false
	}
}

func assertArray(value any, field string) ([]any, error) {
	if value == nil {
		return []any{}, nil
	}
	items, ok := value.([]any)
	if !ok {
		return nil, fmt.Errorf("%s must be an array", field)
	}
	return items, nil
}

func asMap(value any) map[string]any {
	record, ok := value.(map[string]any)
	if !ok || record == nil {
		return map[string]any{}
	}
	return record
}

func cloneJSON[T any](value T) (T, error) {
	var cloned T
	payload, err := json.Marshal(value)
	if err != nil {
		return cloned, err
	}
	if err := json.Unmarshal(payload, &cloned); err != nil {
		return cloned, err
	}
	return cloned, nil
}

func readJSONFile(path string) (map[string]any, error) {
	payload, err := os.ReadFile(path)
	if err != nil {
		return nil, err
	}
	decoder := json.NewDecoder(strings.NewReader(string(payload)))
	decoder.UseNumber()
	var parsed map[string]any
	if err := decoder.Decode(&parsed); err != nil {
		return nil, err
	}
	if parsed == nil {
		return nil, errors.New("JSON root must be an object")
	}
	return parsed, nil
}

func writeJSONFile(path string, value any) error {
	payload, err := json.MarshalIndent(value, "", "  ")
	if err != nil {
		return err
	}
	return os.WriteFile(path, append(payload, '\n'), 0o644)
}

func fileExists(path string) bool {
	_, err := os.Stat(path)
	return err == nil
}

func mustDir(path string, label string) error {
	info, err := os.Stat(path)
	if err != nil {
		return fmt.Errorf("%s does not exist: %s", label, path)
	}
	if !info.IsDir() {
		return fmt.Errorf("%s must be a directory: %s", label, path)
	}
	return nil
}

func resolvePath(cwd string, value string) string {
	if filepath.IsAbs(value) {
		return filepath.Clean(value)
	}
	return filepath.Clean(filepath.Join(cwd, value))
}

func parseISOTime(value any) int64 {
	text, ok := value.(string)
	if !ok || strings.TrimSpace(text) == "" {
		return 0
	}
	parsed, err := time.Parse(time.RFC3339Nano, text)
	if err != nil {
		return 0
	}
	return parsed.UnixMilli()
}

func round12(value float64) float64 {
	rounded, _ := strconv.ParseFloat(strconv.FormatFloat(value, 'f', 12, 64), 64)
	return rounded
}

func uniqueStrings(values []string) []string {
	seen := map[string]struct{}{}
	result := make([]string, 0, len(values))
	for _, value := range values {
		if strings.TrimSpace(value) == "" {
			continue
		}
		if _, ok := seen[value]; ok {
			continue
		}
		seen[value] = struct{}{}
		result = append(result, value)
	}
	return result
}

func stringSliceFromAny(values []any, field string) ([]string, error) {
	result := make([]string, 0, len(values))
	for index, value := range values {
		text, err := normalizeNonEmptyString(value, fmt.Sprintf("%s[%d]", field, index))
		if err != nil {
			return nil, err
		}
		result = append(result, text)
	}
	return result, nil
}
