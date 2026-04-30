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
	Groups   []Group        `json:"groups"`
	Commands []CommandEntry `json:"commands"`
}

type Group struct {
	ID    string `json:"id"`
	Label string `json:"label"`
}

type CommandEntry struct {
	Path    []string `json:"path"`
	Group   string   `json:"group"`
	Usage   string   `json:"usage"`
	Example string   `json:"example"`
	Notes   []string `json:"notes,omitempty"`
	Hidden  bool     `json:"hidden,omitempty"`
}

type Match struct {
	Command       CommandEntry
	ForwardedArgs []string
}

type TopicHelp struct {
	Topic         []string
	Usage         []string
	Examples      []string
	Notes         []string
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
	if err := validateRegistry(registry); err != nil {
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

func validateRegistry(r Registry) error {
	known := map[string]struct{}{}
	for _, group := range r.Groups {
		if group.ID == "" {
			return fmt.Errorf("registry group missing id")
		}
		known[group.ID] = struct{}{}
	}
	for _, command := range r.Commands {
		if command.Group == "" {
			return fmt.Errorf("command %q missing group", strings.Join(command.Path, " "))
		}
		if _, ok := known[command.Group]; !ok {
			return fmt.Errorf("command %q references unknown group %q", strings.Join(command.Path, " "), command.Group)
		}
	}
	return nil
}

// UsageLines returns the flat list of usage strings in group order.
// Kept for the `cautilus commands --json` payload.
func (r Registry) UsageLines() []string {
	lines := make([]string, 0, len(r.Commands))
	for _, command := range r.orderedCommands(false) {
		lines = append(lines, command.Usage)
	}
	return lines
}

// ExampleLines returns the flat list of example strings in group order.
// Kept for the `cautilus commands --json` payload.
func (r Registry) ExampleLines() []string {
	lines := make([]string, 0, len(r.Commands))
	for _, command := range r.orderedCommands(false) {
		lines = append(lines, command.Example)
	}
	return lines
}

func (r Registry) PublicCommands() []CommandEntry {
	return r.orderedCommands(false)
}

func (r Registry) orderedCommands(includeHidden bool) []CommandEntry {
	ordered := make([]CommandEntry, 0, len(r.Commands))
	for _, group := range r.Groups {
		for _, command := range r.Commands {
			if command.Hidden && !includeHidden {
				continue
			}
			if command.Group == group.ID {
				ordered = append(ordered, command)
			}
		}
	}
	return ordered
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
	for _, group := range loaded.Groups {
		groupCommands := commandsInGroup(loaded, group.ID)
		if len(groupCommands) == 0 {
			continue
		}
		lines = append(lines, "", fmt.Sprintf("  %s:", group.Label))
		for _, command := range groupCommands {
			lines = append(lines, fmt.Sprintf("    %s", command.Usage))
		}
	}
	lines = append(lines, "", "Examples:")
	for _, command := range loaded.orderedCommands(false) {
		lines = append(lines, fmt.Sprintf("  %s", command.Example))
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
	if len(help.Notes) > 0 {
		lines = append(lines, "", "Notes:")
		for _, note := range help.Notes {
			lines = append(lines, fmt.Sprintf("  %s", note))
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

func commandsInGroup(loaded Registry, groupID string) []CommandEntry {
	commands := make([]CommandEntry, 0)
	for _, command := range loaded.Commands {
		if command.Hidden {
			continue
		}
		if command.Group == groupID {
			commands = append(commands, command)
		}
	}
	return commands
}

func findTopicHelp(loaded Registry, topic []string) (TopicHelp, bool) {
	usage := []string{}
	examples := []string{}
	notes := []string{}
	children := []CommandEntry{}
	seenChildren := map[string]struct{}{}
	seenNotes := map[string]struct{}{}

	for _, command := range loaded.orderedCommands(true) {
		if len(topic) == 0 {
			key := strings.Join(command.Path, "\x00")
			if _, ok := seenChildren[key]; ok {
				continue
			}
			seenChildren[key] = struct{}{}
			children = append(children, command)
			continue
		}
		if !hasPathPrefix(command.Path, topic) {
			continue
		}
		if len(command.Path) == len(topic) {
			usage = append(usage, command.Usage)
			examples = append(examples, command.Example)
			for _, note := range command.Notes {
				if _, ok := seenNotes[note]; ok {
					continue
				}
				seenNotes[note] = struct{}{}
				notes = append(notes, note)
			}
			continue
		}
		key := strings.Join(command.Path, "\x00")
		if _, ok := seenChildren[key]; ok {
			continue
		}
		seenChildren[key] = struct{}{}
		children = append(children, command)
		usage = append(usage, command.Usage)
		examples = append(examples, command.Example)
		for _, note := range command.Notes {
			if _, ok := seenNotes[note]; ok {
				continue
			}
			seenNotes[note] = struct{}{}
			notes = append(notes, note)
		}
	}

	if len(topic) > 0 && len(usage) == 0 && len(children) == 0 {
		return TopicHelp{}, false
	}
	return TopicHelp{
		Topic:         append([]string{}, topic...),
		Usage:         usage,
		Examples:      examples,
		Notes:         notes,
		ChildCommands: children,
	}, true
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
