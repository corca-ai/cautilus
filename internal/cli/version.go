package cli

import (
	"encoding/json"
	"errors"
	"os"
	"path/filepath"
	"runtime/debug"
	"strconv"
	"strings"
)

var buildVersion string

type VersionSource string

const (
	VersionSourceEnv       VersionSource = "env"
	VersionSourceLinked    VersionSource = "linked_build"
	VersionSourceBuildInfo VersionSource = "go_build_info"
	VersionSourcePackage   VersionSource = "package_json"
)

type InstallKind string

const (
	InstallKindSourceCheckout InstallKind = "source_checkout"
	InstallKindInstallScript  InstallKind = "install_sh_binary"
	InstallKindStandalone     InstallKind = "standalone_binary"
	InstallKindUnknown        InstallKind = "unknown"
)

type VersionInfo struct {
	Version        string        `json:"version"`
	Source         VersionSource `json:"source"`
	InstallKind    InstallKind   `json:"installKind"`
	ExecutablePath string        `json:"executablePath,omitempty"`
	ToolRoot       string        `json:"toolRoot,omitempty"`
}

func PackageVersion(toolRoot string) (string, error) {
	info, err := PackageVersionInfo(toolRoot)
	if err != nil {
		return "", err
	}
	return info.Version, nil
}

func PackageVersionInfo(toolRoot string) (VersionInfo, error) {
	buildInfoVersion := ""
	if info, ok := debug.ReadBuildInfo(); ok && info != nil {
		buildInfoVersion = info.Main.Version
	}
	executablePath := ""
	if path, err := os.Executable(); err == nil {
		executablePath = path
	}
	return resolveVersionInfo(toolRoot, buildVersion, buildInfoVersion, os.Getenv("CAUTILUS_VERSION"), executablePath)
}

func resolvePackageVersion(toolRoot string, linkedVersion string, buildInfoVersion string, envVersion string) (string, error) {
	info, err := resolveVersionInfo(toolRoot, linkedVersion, buildInfoVersion, envVersion, "")
	if err != nil {
		return "", err
	}
	return info.Version, nil
}

func resolveVersionInfo(toolRoot string, linkedVersion string, buildInfoVersion string, envVersion string, executablePath string) (VersionInfo, error) {
	normalizedToolRoot := normalizeOptionalPath(toolRoot)
	normalizedExecutablePath := normalizeOptionalPath(executablePath)

	var (
		version string
		source  VersionSource
	)
	switch {
	case normalizeVersionString(envVersion) != "":
		version = normalizeVersionString(envVersion)
		source = VersionSourceEnv
	case normalizeVersionString(linkedVersion) != "":
		version = normalizeVersionString(linkedVersion)
		source = VersionSourceLinked
	case normalizeVersionString(buildInfoVersion) != "":
		version = normalizeVersionString(buildInfoVersion)
		source = VersionSourceBuildInfo
	default:
		if normalizedToolRoot == "" {
			return VersionInfo{}, errors.New("could not determine cautilus version")
		}
		var err error
		version, err = readPackageVersion(normalizedToolRoot)
		if err != nil {
			return VersionInfo{}, err
		}
		source = VersionSourcePackage
	}

	info := VersionInfo{
		Version:        version,
		Source:         source,
		InstallKind:    detectInstallKind(normalizedToolRoot, source, normalizedExecutablePath),
		ExecutablePath: normalizedExecutablePath,
	}
	if normalizedToolRoot != "" {
		info.ToolRoot = normalizedToolRoot
	}
	return info, nil
}

func readPackageVersion(toolRoot string) (string, error) {
	type packageJSON struct {
		Version string `json:"version"`
	}
	var pkg packageJSON
	bytes, err := os.ReadFile(filepath.Join(toolRoot, "package.json"))
	if err != nil {
		return "", err
	}
	if err := json.Unmarshal(bytes, &pkg); err != nil {
		return "", err
	}
	if version := normalizeVersionString(pkg.Version); version != "" {
		return version, nil
	}
	return "", errors.New("package.json version is empty")
}

func normalizeVersionString(version string) string {
	version = strings.TrimSpace(version)
	if version == "" || version == "(devel)" {
		return ""
	}
	return strings.TrimPrefix(version, "v")
}

func normalizeOptionalPath(path string) string {
	path = strings.TrimSpace(path)
	if path == "" {
		return ""
	}
	return filepath.Clean(path)
}

func detectInstallKind(toolRoot string, source VersionSource, executablePath string) InstallKind {
	if source == VersionSourcePackage || isPathWithin(executablePath, toolRoot) {
		return InstallKindSourceCheckout
	}
	if executablePath == "" {
		return InstallKindUnknown
	}
	if filepath.Base(executablePath) == "cautilus-real" {
		return InstallKindInstallScript
	}
	return InstallKindStandalone
}

func isPathWithin(path string, root string) bool {
	if path == "" || root == "" {
		return false
	}
	relative, err := filepath.Rel(root, path)
	if err != nil {
		return false
	}
	if relative == "." {
		return true
	}
	return relative != ".." && !strings.HasPrefix(relative, ".."+string(filepath.Separator))
}

func CompareVersions(left string, right string) int {
	leftMain, leftPre := splitVersionParts(normalizeVersionString(left))
	rightMain, rightPre := splitVersionParts(normalizeVersionString(right))

	maxParts := len(leftMain)
	if len(rightMain) > maxParts {
		maxParts = len(rightMain)
	}
	for index := range maxParts {
		leftPart := versionPartAt(leftMain, index)
		rightPart := versionPartAt(rightMain, index)
		if comparison := compareVersionPart(leftPart, rightPart); comparison != 0 {
			return comparison
		}
	}

	switch {
	case leftPre == "" && rightPre != "":
		return 1
	case leftPre != "" && rightPre == "":
		return -1
	default:
		return strings.Compare(leftPre, rightPre)
	}
}

func splitVersionParts(version string) ([]string, string) {
	version, _, _ = strings.Cut(version, "+")
	main, prerelease, _ := strings.Cut(version, "-")
	return strings.Split(main, "."), prerelease
}

func versionPartAt(parts []string, index int) string {
	if index >= len(parts) {
		return "0"
	}
	return parts[index]
}

func compareVersionPart(left string, right string) int {
	leftInt, leftErr := strconv.Atoi(left)
	rightInt, rightErr := strconv.Atoi(right)
	if leftErr == nil && rightErr == nil {
		switch {
		case leftInt < rightInt:
			return -1
		case leftInt > rightInt:
			return 1
		default:
			return 0
		}
	}
	return strings.Compare(left, right)
}
