package cli

import (
	"bytes"
	"embed"
	"encoding/json"
	"errors"
	"fmt"
	"os"
	"path/filepath"
	"strings"
)

type Registry struct {
	Usage    []string       `json:"usage"`
	Examples []string       `json:"examples"`
	Commands []CommandEntry `json:"commands"`
}

type CommandEntry struct {
	Path []string `json:"path"`
}

type Match struct {
	Command       CommandEntry
	ForwardedArgs []string
}

type TopicHelp struct {
	Topic         []string
	Usage         []string
	Examples      []string
	ChildCommands []CommandEntry
}

//go:embed command-registry.json
var embeddedFiles embed.FS

var (
	registry           Registry
	registryLoadErr    error
	repoRootSentinels  = []string{"package.json", "bin/cautilus", "scripts", "skills/cautilus/SKILL.md", "internal/cli/command-registry.json"}
	errRepoRootMissing = errors.New("could not locate cautilus source root from the current working directory")
)

func ErrRepoRootMissing() error {
	return errRepoRootMissing
}

func LoadRegistry() (Registry, error) {
	if registryLoadErr != nil {
		return Registry{}, registryLoadErr
	}
	if len(registry.Commands) > 0 {
		return registry, nil
	}
	bytes, err := embeddedFiles.ReadFile("command-registry.json")
	if err != nil {
		registryLoadErr = err
		return Registry{}, err
	}
	if err := decodeRegistry(bytes, &registry); err != nil {
		registryLoadErr = err
		return Registry{}, err
	}
	return registry, nil
}

func decodeRegistry(content []byte, target *Registry) error {
	decoder := json.NewDecoder(bytes.NewReader(content))
	decoder.DisallowUnknownFields()
	return decoder.Decode(target)
}

func MatchCommand(args []string) (*Match, error) {
	loaded, err := LoadRegistry()
	if err != nil {
		return nil, err
	}
	var best *CommandEntry
	for _, command := range loaded.Commands {
		if len(args) < len(command.Path) {
			continue
		}
		matches := true
		for index, segment := range command.Path {
			if args[index] != segment {
				matches = false
				break
			}
		}
		if !matches {
			continue
		}
		if best == nil || len(command.Path) > len(best.Path) {
			commandCopy := command
			best = &commandCopy
		}
	}
	if best == nil {
		return nil, nil
	}
	return &Match{
		Command:       *best,
		ForwardedArgs: args[len(best.Path):],
	}, nil
}

func RenderUsage() (string, error) {
	loaded, err := LoadRegistry()
	if err != nil {
		return "", err
	}
	lines := []string{"Usage:"}
	for _, usageLine := range loaded.Usage {
		lines = append(lines, fmt.Sprintf("  %s", usageLine))
	}
	lines = append(lines, "", "Examples:")
	for _, exampleLine := range loaded.Examples {
		lines = append(lines, fmt.Sprintf("  %s", exampleLine))
	}
	return strings.Join(lines, "\n"), nil
}

func RenderTopicUsage(topic []string) (string, error) {
	loaded, err := LoadRegistry()
	if err != nil {
		return "", err
	}
	help, ok := findTopicHelp(loaded, topic)
	if !ok {
		return "", fmt.Errorf("unknown command topic: %s", strings.Join(topic, " "))
	}
	lines := []string{"Usage:"}
	for _, usageLine := range help.Usage {
		lines = append(lines, fmt.Sprintf("  %s", usageLine))
	}
	if len(help.ChildCommands) > 0 {
		lines = append(lines, "", "Subcommands:")
		for _, child := range help.ChildCommands {
			lines = append(lines, fmt.Sprintf("  cautilus %s", strings.Join(child.Path, " ")))
		}
	}
	if len(help.Examples) > 0 {
		lines = append(lines, "", "Examples:")
		for _, exampleLine := range help.Examples {
			lines = append(lines, fmt.Sprintf("  %s", exampleLine))
		}
	}
	return strings.Join(lines, "\n"), nil
}

func FindTopicHelp(topic []string) (*TopicHelp, bool, error) {
	loaded, err := LoadRegistry()
	if err != nil {
		return nil, false, err
	}
	help, ok := findTopicHelp(loaded, topic)
	if !ok {
		return nil, false, nil
	}
	return &help, true, nil
}

func findTopicHelp(loaded Registry, topic []string) (TopicHelp, bool) {
	prefix := strings.TrimSpace(strings.Join(topic, " "))
	usage := []string{}
	examples := []string{}
	children := []CommandEntry{}
	seenUsage := map[string]struct{}{}
	seenExamples := map[string]struct{}{}
	seenChildren := map[string]struct{}{}

	for _, usageLine := range loaded.Usage {
		if !matchesRegistryLine(usageLine, prefix) {
			continue
		}
		if _, ok := seenUsage[usageLine]; ok {
			continue
		}
		seenUsage[usageLine] = struct{}{}
		usage = append(usage, usageLine)
	}
	for _, exampleLine := range loaded.Examples {
		if !matchesRegistryLine(exampleLine, prefix) {
			continue
		}
		if _, ok := seenExamples[exampleLine]; ok {
			continue
		}
		seenExamples[exampleLine] = struct{}{}
		examples = append(examples, exampleLine)
	}
	for _, command := range loaded.Commands {
		if len(topic) == 0 {
			key := strings.Join(command.Path, "\x00")
			if _, ok := seenChildren[key]; ok {
				continue
			}
			seenChildren[key] = struct{}{}
			children = append(children, command)
			continue
		}
		if hasPathPrefix(command.Path, topic) && len(command.Path) > len(topic) {
			key := strings.Join(command.Path, "\x00")
			if _, ok := seenChildren[key]; ok {
				continue
			}
			seenChildren[key] = struct{}{}
			children = append(children, command)
		}
	}

	if len(topic) > 0 && len(usage) == 0 && len(children) == 0 {
		return TopicHelp{}, false
	}
	return TopicHelp{
		Topic:         append([]string{}, topic...),
		Usage:         usage,
		Examples:      examples,
		ChildCommands: children,
	}, true
}

func matchesRegistryLine(line string, prefix string) bool {
	if prefix == "" {
		return true
	}
	expectedPrefix := "cautilus " + prefix
	if !strings.HasPrefix(line, expectedPrefix) {
		return false
	}
	if len(line) == len(expectedPrefix) {
		return true
	}
	next := line[len(expectedPrefix)]
	return next == ' ' || next == '['
}

func hasPathPrefix(path []string, prefix []string) bool {
	if len(prefix) > len(path) {
		return false
	}
	for index, segment := range prefix {
		if path[index] != segment {
			return false
		}
	}
	return true
}

func FindRepoRoot(start string) (string, error) {
	current := filepath.Clean(start)
	for {
		matchesAll := true
		for _, sentinel := range repoRootSentinels {
			if _, err := os.Stat(filepath.Join(current, filepath.FromSlash(sentinel))); err != nil {
				matchesAll = false
				break
			}
		}
		if matchesAll {
			return current, nil
		}
		parent := filepath.Dir(current)
		if parent == current {
			return "", errRepoRootMissing
		}
		current = parent
	}
}
