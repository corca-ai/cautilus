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
