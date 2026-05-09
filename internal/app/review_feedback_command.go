package app

import (
	"fmt"
	"io"
	"strings"
	"time"

	"github.com/corca-ai/cautilus/internal/contracts"
)

type reviewFeedbackBuildArgs struct {
	sourceKind         string
	sourceRef          string
	methodFamily       string
	methodID           *string
	sourceScope        *string
	disposition        string
	reviewNote         string
	proposalID         *string
	proposalSourceRefs []string
	followUpRefs       []string
	output             *string
}

type reviewFeedbackSummarizeArgs struct {
	inputs []string
	output *string
}

var reviewFeedbackSourceKinds = map[string]struct{}{
	"hitl":                {},
	"issue":               {},
	"pull_request_review": {},
	"review_packet":       {},
	"review_summary":      {},
}

var reviewFeedbackMethodFamilies = map[string]struct{}{
	"claim_discovery": {},
	"evaluation":      {},
	"manual_seed":     {},
}

var reviewFeedbackDispositions = map[string]struct{}{
	"accepted":         {},
	"narrowed":         {},
	"reframed":         {},
	"rejected":         {},
	"missing_critical": {},
}

func handleReviewFeedbackBuild(repoRoot string, cwd string, args []string, stdout io.Writer, stderr io.Writer) int {
	options, err := parseReviewFeedbackBuildArgs(args, cwd)
	if err != nil {
		_, _ = fmt.Fprintf(stderr, "%s\n", err)
		return 1
	}
	packet := buildReviewFeedbackPacket(options, time.Now().UTC())
	if err := writeOutputResolved(stdout, options.output, packet); err != nil {
		_, _ = fmt.Fprintf(stderr, "%s\n", err)
		return 1
	}
	if options.output != nil {
		_, _ = fmt.Fprintf(stdout, "%s\n", *options.output)
	}
	_ = repoRoot
	return 0
}

func handleReviewFeedbackSummarize(repoRoot string, cwd string, args []string, stdout io.Writer, stderr io.Writer) int {
	options, err := parseReviewFeedbackSummarizeArgs(args, cwd)
	if err != nil {
		_, _ = fmt.Fprintf(stderr, "%s\n", err)
		return 1
	}
	summary, err := buildReviewFeedbackSummary(options, time.Now().UTC())
	if err != nil {
		_, _ = fmt.Fprintf(stderr, "%s\n", err)
		return 1
	}
	if err := writeOutputResolved(stdout, options.output, summary); err != nil {
		_, _ = fmt.Fprintf(stderr, "%s\n", err)
		return 1
	}
	if options.output != nil {
		_, _ = fmt.Fprintf(stdout, "%s\n", *options.output)
	}
	_ = repoRoot
	return 0
}

func parseReviewFeedbackBuildArgs(args []string, cwd string) (*reviewFeedbackBuildArgs, error) {
	options := &reviewFeedbackBuildArgs{}
	for index := 0; index < len(args); index++ {
		arg := args[index]
		switch arg {
		case "--source-kind":
			value, next, err := requiredValue(args, index, arg)
			if err != nil {
				return nil, err
			}
			index = next
			options.sourceKind = value
		case "--source-ref":
			value, next, err := requiredValue(args, index, arg)
			if err != nil {
				return nil, err
			}
			index = next
			options.sourceRef = value
		case "--method-family":
			value, next, err := requiredValue(args, index, arg)
			if err != nil {
				return nil, err
			}
			index = next
			options.methodFamily = value
		case "--method-id":
			value, next, err := requiredValue(args, index, arg)
			if err != nil {
				return nil, err
			}
			index = next
			options.methodID = &value
		case "--source-scope":
			value, next, err := requiredValue(args, index, arg)
			if err != nil {
				return nil, err
			}
			index = next
			options.sourceScope = &value
		case "--disposition":
			value, next, err := requiredValue(args, index, arg)
			if err != nil {
				return nil, err
			}
			index = next
			options.disposition = value
		case "--review-note":
			value, next, err := requiredValue(args, index, arg)
			if err != nil {
				return nil, err
			}
			index = next
			options.reviewNote = value
		case "--proposal-id":
			value, next, err := requiredValue(args, index, arg)
			if err != nil {
				return nil, err
			}
			index = next
			options.proposalID = &value
		case "--proposal-source-ref":
			value, next, err := requiredValue(args, index, arg)
			if err != nil {
				return nil, err
			}
			index = next
			options.proposalSourceRefs = append(options.proposalSourceRefs, value)
		case "--follow-up-ref":
			value, next, err := requiredValue(args, index, arg)
			if err != nil {
				return nil, err
			}
			index = next
			options.followUpRefs = append(options.followUpRefs, value)
		case "--output":
			value, next, err := requiredValue(args, index, arg)
			if err != nil {
				return nil, err
			}
			index = next
			resolved := resolvePath(cwd, value)
			options.output = &resolved
		default:
			return nil, fmt.Errorf("unknown argument: %s", arg)
		}
	}
	if err := validateReviewFeedbackBuildArgs(options); err != nil {
		return nil, err
	}
	return options, nil
}

func parseReviewFeedbackSummarizeArgs(args []string, cwd string) (*reviewFeedbackSummarizeArgs, error) {
	options := &reviewFeedbackSummarizeArgs{}
	for index := 0; index < len(args); index++ {
		arg := args[index]
		switch arg {
		case "--input":
			value, next, err := requiredValue(args, index, arg)
			if err != nil {
				return nil, err
			}
			index = next
			options.inputs = append(options.inputs, resolvePath(cwd, value))
		case "--output":
			value, next, err := requiredValue(args, index, arg)
			if err != nil {
				return nil, err
			}
			index = next
			resolved := resolvePath(cwd, value)
			options.output = &resolved
		default:
			return nil, fmt.Errorf("unknown argument: %s", arg)
		}
	}
	if len(options.inputs) == 0 {
		return nil, fmt.Errorf("--input is required at least once")
	}
	return options, nil
}

func validateReviewFeedbackBuildArgs(options *reviewFeedbackBuildArgs) error {
	if _, ok := reviewFeedbackSourceKinds[options.sourceKind]; !ok {
		return fmt.Errorf("--source-kind must be one of: %s", strings.Join(sortedMapKeys(reviewFeedbackSourceKinds), ", "))
	}
	if strings.TrimSpace(options.sourceRef) == "" {
		return fmt.Errorf("--source-ref is required")
	}
	if _, ok := reviewFeedbackMethodFamilies[options.methodFamily]; !ok {
		return fmt.Errorf("--method-family must be one of: %s", strings.Join(sortedMapKeys(reviewFeedbackMethodFamilies), ", "))
	}
	if _, ok := reviewFeedbackDispositions[options.disposition]; !ok {
		return fmt.Errorf("--disposition must be one of: %s", strings.Join(sortedMapKeys(reviewFeedbackDispositions), ", "))
	}
	if strings.TrimSpace(options.reviewNote) == "" {
		return fmt.Errorf("--review-note is required")
	}
	if options.disposition != "missing_critical" && options.proposalID == nil && len(options.proposalSourceRefs) == 0 {
		return fmt.Errorf("--proposal-id or --proposal-source-ref is required unless --disposition is missing_critical")
	}
	return nil
}

func buildReviewFeedbackSummary(options *reviewFeedbackSummarizeArgs, now time.Time) (map[string]any, error) {
	dispositionTotals := map[string]int{}
	methodDispositionTotals := map[string]map[string]int{}
	methodPacketTotals := map[string]int{}
	inputRecords := []any{}

	for _, input := range options.inputs {
		packet, err := readJSONObject(input)
		if err != nil {
			return nil, fmt.Errorf("failed to read review feedback packet from %s: %w", input, err)
		}
		if packet["schemaVersion"] != contracts.ReviewFeedbackSchema {
			return nil, fmt.Errorf("%s must use schemaVersion %s", input, contracts.ReviewFeedbackSchema)
		}
		method := objectField(packet, "method")
		family := anyString(method["family"])
		if _, ok := reviewFeedbackMethodFamilies[family]; !ok {
			return nil, fmt.Errorf("%s method.family must be one of: %s", input, strings.Join(sortedMapKeys(reviewFeedbackMethodFamilies), ", "))
		}
		disposition := anyString(packet["disposition"])
		if _, ok := reviewFeedbackDispositions[disposition]; !ok {
			return nil, fmt.Errorf("%s disposition must be one of: %s", input, strings.Join(sortedMapKeys(reviewFeedbackDispositions), ", "))
		}
		sourceReview := objectField(packet, "sourceReview")
		inputRecords = append(inputRecords, map[string]any{
			"path":               input,
			"methodFamily":       family,
			"methodID":           anyString(method["id"]),
			"disposition":        disposition,
			"sourceReviewKind":   anyString(sourceReview["kind"]),
			"sourceReviewRef":    anyString(sourceReview["ref"]),
			"proposalID":         anyString(objectField(packet, "proposal")["id"]),
			"proposalSourceRefs": stringArrayField(objectField(packet, "proposal"), "sourceRefs"),
		})
		dispositionTotals[disposition]++
		if methodDispositionTotals[family] == nil {
			methodDispositionTotals[family] = map[string]int{}
		}
		methodDispositionTotals[family][disposition]++
		methodPacketTotals[family]++
	}

	methodFamilies := []any{}
	for _, family := range sortedStringKeys(methodDispositionTotals) {
		methodFamilies = append(methodFamilies, map[string]any{
			"family":       family,
			"packetCount":  methodPacketTotals[family],
			"dispositions": orderedCountEntries(methodDispositionTotals[family], sortedMapKeys(reviewFeedbackDispositions)),
		})
	}

	return map[string]any{
		"schemaVersion":           contracts.ReviewFeedbackSummarySchema,
		"generatedAt":             now.Format(time.RFC3339Nano),
		"packetCount":             len(options.inputs),
		"inputFiles":              stringSliceToAny(options.inputs),
		"dispositions":            orderedCountEntries(dispositionTotals, sortedMapKeys(reviewFeedbackDispositions)),
		"methodFamilies":          methodFamilies,
		"inputs":                  inputRecords,
		"aggregation":             map[string]any{"basis": "selected_review_feedback_packets"},
		"reviewFeedbackSchemaRef": contracts.ReviewFeedbackSchema,
	}, nil
}

func buildReviewFeedbackPacket(options *reviewFeedbackBuildArgs, now time.Time) map[string]any {
	packet := map[string]any{
		"schemaVersion": contracts.ReviewFeedbackSchema,
		"generatedAt":   now.Format(time.RFC3339Nano),
		"sourceReview": map[string]any{
			"kind": options.sourceKind,
			"ref":  options.sourceRef,
		},
		"proposal": map[string]any{
			"sourceRefs": stringSliceToAny(options.proposalSourceRefs),
		},
		"method": map[string]any{
			"family": options.methodFamily,
		},
		"normalization": map[string]any{
			"producer": "cautilus.review.feedback.build",
			"basis":    "source_review",
		},
		"disposition": options.disposition,
		"reviewNote":  options.reviewNote,
	}
	proposal := packet["proposal"].(map[string]any)
	if options.proposalID != nil {
		proposal["id"] = *options.proposalID
	}
	method := packet["method"].(map[string]any)
	if options.methodID != nil {
		method["id"] = *options.methodID
	}
	if options.sourceScope != nil {
		method["sourceScope"] = *options.sourceScope
	}
	if len(options.followUpRefs) > 0 {
		packet["followUpRefs"] = stringSliceToAny(options.followUpRefs)
	}
	return packet
}

func objectField(parent map[string]any, key string) map[string]any {
	if value, ok := parent[key].(map[string]any); ok {
		return value
	}
	return map[string]any{}
}

func stringArrayField(parent map[string]any, key string) []any {
	values := []any{}
	for _, value := range arrayOrEmpty(parent[key]) {
		text, ok := value.(string)
		if ok {
			values = append(values, text)
		}
	}
	return values
}

func orderedCountEntries(counts map[string]int, keys []string) []any {
	entries := []any{}
	for _, key := range keys {
		count := counts[key]
		if count == 0 {
			continue
		}
		entries = append(entries, map[string]any{
			"value": key,
			"count": count,
		})
	}
	return entries
}

func sortedMapKeys(values map[string]struct{}) []string {
	keys := make([]string, 0, len(values))
	for key := range values {
		keys = append(keys, key)
	}
	for index := 1; index < len(keys); index++ {
		for cursor := index; cursor > 0 && keys[cursor] < keys[cursor-1]; cursor-- {
			keys[cursor], keys[cursor-1] = keys[cursor-1], keys[cursor]
		}
	}
	return keys
}

func sortedStringKeys[T any](values map[string]T) []string {
	keys := make([]string, 0, len(values))
	for key := range values {
		keys = append(keys, key)
	}
	for index := 1; index < len(keys); index++ {
		for cursor := index; cursor > 0 && keys[cursor] < keys[cursor-1]; cursor-- {
			keys[cursor], keys[cursor-1] = keys[cursor-1], keys[cursor]
		}
	}
	return keys
}
