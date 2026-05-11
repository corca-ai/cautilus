package app

import (
	"fmt"
	"io"
	"time"

	"github.com/corca-ai/cautilus/internal/runtime"
)

//nolint:errcheck // CLI stderr reporting is best-effort.
func handleEvalSkillExperimentCompare(repoRoot string, cwd string, args []string, stdout io.Writer, stderr io.Writer) int {
	_ = repoRoot
	options, err := parseInputOutputArgs(args)
	if err != nil {
		fmt.Fprintf(stderr, "%s\n", err)
		return 1
	}
	input, err := readJSONObject(resolvePath(cwd, options.input))
	if err != nil {
		fmt.Fprintf(stderr, "Failed to read JSON from %s: %s\n", options.input, err)
		return 1
	}
	report, err := runtime.BuildSkillCloneExperimentReport(input, time.Now())
	if err != nil {
		fmt.Fprintf(stderr, "%s\n", err)
		return 1
	}
	if err := writeOutput(stdout, cwd, options.output, report); err != nil {
		fmt.Fprintf(stderr, "%s\n", err)
		return 1
	}
	return 0
}
