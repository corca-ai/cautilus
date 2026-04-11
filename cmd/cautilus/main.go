package main

import (
	"errors"
	"fmt"
	"io"
	"os"
	"os/exec"

	"github.com/corca-ai/cautilus/internal/cli"
)

func main() {
	os.Exit(run(os.Args[1:], os.Stdout, os.Stderr))
}

func run(args []string, stdout io.Writer, stderr io.Writer) int {
	if len(args) == 0 || args[0] == "-h" || args[0] == "--help" {
		usage, err := cli.RenderUsage()
		if err != nil {
			fmt.Fprintf(stderr, "%s\n", err)
			return 1
		}
		fmt.Fprintf(stdout, "%s\n", usage)
		return 0
	}

	cwd, err := os.Getwd()
	if err != nil {
		fmt.Fprintf(stderr, "%s\n", err)
		return 1
	}

	repoRoot, err := cli.FindRepoRoot(cwd)
	if err != nil {
		fmt.Fprintf(stderr, "%s\n", err)
		return 1
	}

	if args[0] == "--version" || args[0] == "-v" || args[0] == "version" {
		version, err := cli.PackageVersion(repoRoot)
		if err != nil {
			fmt.Fprintf(stderr, "%s\n", err)
			return 1
		}
		fmt.Fprintf(stdout, "%s\n", version)
		return 0
	}

	match, err := cli.MatchCommand(args)
	if err != nil {
		fmt.Fprintf(stderr, "%s\n", err)
		return 1
	}
	if match == nil {
		usage, usageErr := cli.RenderUsage()
		if usageErr != nil {
			fmt.Fprintf(stderr, "%s\n", usageErr)
			return 1
		}
		fmt.Fprintf(stderr, "%s\n", usage)
		return 1
	}

	nodeArgs := append([]string{cli.ScriptPath(repoRoot, match.Command)}, match.ForwardedArgs...)
	command := exec.Command("node", nodeArgs...)
	command.Dir = cwd
	command.Stdin = os.Stdin
	command.Stdout = stdout
	command.Stderr = stderr
	command.Env = os.Environ()
	if err := command.Run(); err != nil {
		var exitErr *exec.ExitError
		if errors.As(err, &exitErr) {
			return exitErr.ExitCode()
		}
		fmt.Fprintf(stderr, "%s\n", err)
		return 1
	}
	return 0
}
