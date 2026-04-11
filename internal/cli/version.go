package cli

import (
	"encoding/json"
	"errors"
	"os"
	"path/filepath"
	"runtime/debug"
	"strings"
)

var buildVersion string

func PackageVersion(toolRoot string) (string, error) {
	buildInfoVersion := ""
	if info, ok := debug.ReadBuildInfo(); ok && info != nil {
		buildInfoVersion = info.Main.Version
	}
	return resolvePackageVersion(toolRoot, buildVersion, buildInfoVersion, os.Getenv("CAUTILUS_VERSION"))
}

func resolvePackageVersion(toolRoot string, linkedVersion string, buildInfoVersion string, envVersion string) (string, error) {
	if version := normalizeVersionString(envVersion); version != "" {
		return version, nil
	}
	if version := normalizeVersionString(linkedVersion); version != "" {
		return version, nil
	}
	if version := normalizeVersionString(buildInfoVersion); version != "" {
		return version, nil
	}
	if strings.TrimSpace(toolRoot) == "" {
		return "", errors.New("could not determine cautilus version")
	}
	return readPackageVersion(toolRoot)
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
