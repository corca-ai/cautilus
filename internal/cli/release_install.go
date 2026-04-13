package cli

import (
	"archive/tar"
	"bytes"
	"compress/gzip"
	"context"
	"crypto/sha256"
	"encoding/hex"
	"fmt"
	"io"
	"net/http"
	"os"
	"path/filepath"
	"runtime"
	"strings"
	"time"
)

const defaultReleaseInstallTimeout = 20 * time.Second

type ReleaseInstallOptions struct {
	Version     string
	Repo        string
	InstallRoot string
	BinDir      string
	OS          string
	Arch        string
	FetchLatest func(ctx context.Context) (ReleaseMetadata, error)
	Download    func(ctx context.Context, url string) ([]byte, error)
}

type ReleaseInstallResult struct {
	Version        string `json:"version"`
	InstallRoot    string `json:"installRoot"`
	TargetDir      string `json:"targetDir"`
	BinaryPath     string `json:"binaryPath"`
	WrapperPath    string `json:"wrapperPath"`
	AssetName      string `json:"assetName"`
	ArchiveURL     string `json:"archiveUrl"`
	ChecksumsURL   string `json:"checksumsUrl"`
	InstallChannel string `json:"installChannel"`
}

func LatestReleaseMetadata(ctx context.Context) (ReleaseMetadata, error) {
	return fetchLatestRelease(ctx)
}

func InstallManagedRelease(options ReleaseInstallOptions) (ReleaseInstallResult, error) {
	repo := strings.TrimSpace(options.Repo)
	if repo == "" {
		repo = strings.TrimSpace(os.Getenv("CAUTILUS_REPO"))
	}
	if repo == "" {
		repo = defaultReleaseRepo
	}

	version := strings.TrimSpace(options.Version)
	if version == "" {
		fetchLatest := options.FetchLatest
		if fetchLatest == nil {
			fetchLatest = LatestReleaseMetadata
		}
		ctx, cancel := context.WithTimeout(context.Background(), defaultReleaseInstallTimeout)
		defer cancel()
		latest, err := fetchLatest(ctx)
		if err != nil {
			return ReleaseInstallResult{}, err
		}
		version = latest.Version
	}
	version = normalizeInstallVersion(version)
	if version == "" {
		return ReleaseInstallResult{}, fmt.Errorf("install version is required")
	}

	installRoot, err := resolveManagedInstallRoot(options.InstallRoot)
	if err != nil {
		return ReleaseInstallResult{}, err
	}
	binDir, err := resolveManagedBinDir(options.BinDir)
	if err != nil {
		return ReleaseInstallResult{}, err
	}

	assetOS, assetArch, err := resolveReleaseAssetTarget(options.OS, options.Arch)
	if err != nil {
		return ReleaseInstallResult{}, err
	}
	versionTrimmed := strings.TrimPrefix(version, "v")
	assetName := fmt.Sprintf("cautilus_%s_%s_%s.tar.gz", versionTrimmed, assetOS, assetArch)
	archiveURL := fmt.Sprintf("https://github.com/%s/releases/download/%s/%s", repo, version, assetName)
	checksumsURL := fmt.Sprintf("https://github.com/%s/releases/download/%s/cautilus-%s-checksums.txt", repo, version, version)

	download := options.Download
	if download == nil {
		download = downloadReleaseAsset
	}
	ctx, cancel := context.WithTimeout(context.Background(), defaultReleaseInstallTimeout)
	defer cancel()
	archiveBytes, err := download(ctx, archiveURL)
	if err != nil {
		return ReleaseInstallResult{}, err
	}
	checksumBytes, err := download(ctx, checksumsURL)
	if err != nil {
		return ReleaseInstallResult{}, err
	}
	expectedSHA256, err := findExpectedSHA256(string(checksumBytes), assetName)
	if err != nil {
		return ReleaseInstallResult{}, err
	}
	actualSHA256 := sha256.Sum256(archiveBytes)
	if hex.EncodeToString(actualSHA256[:]) != expectedSHA256 {
		return ReleaseInstallResult{}, fmt.Errorf("checksum mismatch for %s", assetName)
	}

	targetDir := filepath.Join(installRoot, version)
	binTargetDir := filepath.Join(targetDir, "bin")
	if err := os.RemoveAll(targetDir); err != nil {
		return ReleaseInstallResult{}, err
	}
	if err := os.MkdirAll(binTargetDir, 0o755); err != nil {
		return ReleaseInstallResult{}, err
	}
	binaryBytes, err := extractBinaryFromArchive(archiveBytes)
	if err != nil {
		return ReleaseInstallResult{}, err
	}
	binaryPath := filepath.Join(binTargetDir, "cautilus-real")
	if err := os.WriteFile(binaryPath, binaryBytes, 0o755); err != nil {
		return ReleaseInstallResult{}, err
	}
	if err := os.MkdirAll(binDir, 0o755); err != nil {
		return ReleaseInstallResult{}, err
	}
	wrapperPath := filepath.Join(binDir, "cautilus")
	if err := os.WriteFile(wrapperPath, []byte(renderInstalledWrapper(binaryPath)), 0o755); err != nil {
		return ReleaseInstallResult{}, err
	}

	return ReleaseInstallResult{
		Version:        versionTrimmed,
		InstallRoot:    installRoot,
		TargetDir:      targetDir,
		BinaryPath:     binaryPath,
		WrapperPath:    wrapperPath,
		AssetName:      assetName,
		ArchiveURL:     archiveURL,
		ChecksumsURL:   checksumsURL,
		InstallChannel: string(InstallKindInstallScript),
	}, nil
}

func normalizeInstallVersion(version string) string {
	normalized := normalizeVersionString(version)
	if normalized == "" {
		return ""
	}
	return "v" + normalized
}

func resolveManagedInstallRoot(value string) (string, error) {
	resolved := strings.TrimSpace(value)
	if resolved == "" {
		resolved = strings.TrimSpace(os.Getenv("CAUTILUS_INSTALL_ROOT"))
	}
	if resolved != "" {
		return filepath.Clean(resolved), nil
	}
	home, err := os.UserHomeDir()
	if err != nil {
		return "", err
	}
	return filepath.Join(home, ".local", "share", "cautilus"), nil
}

func resolveManagedBinDir(value string) (string, error) {
	resolved := strings.TrimSpace(value)
	if resolved == "" {
		resolved = strings.TrimSpace(os.Getenv("CAUTILUS_BIN_DIR"))
	}
	if resolved != "" {
		return filepath.Clean(resolved), nil
	}
	home, err := os.UserHomeDir()
	if err != nil {
		return "", err
	}
	return filepath.Join(home, ".local", "bin"), nil
}

func resolveReleaseAssetTarget(goos string, goarch string) (string, string, error) {
	if strings.TrimSpace(goos) == "" {
		goos = runtime.GOOS
	}
	if strings.TrimSpace(goarch) == "" {
		goarch = runtime.GOARCH
	}
	var assetOS string
	switch goos {
	case "linux":
		assetOS = "linux"
	case "darwin":
		assetOS = "darwin"
	default:
		return "", "", fmt.Errorf("unsupported operating system: %s", goos)
	}
	var assetArch string
	switch goarch {
	case "amd64":
		assetArch = "x64"
	case "arm64":
		assetArch = "arm64"
	default:
		return "", "", fmt.Errorf("unsupported architecture: %s", goarch)
	}
	return assetOS, assetArch, nil
}

func downloadReleaseAsset(ctx context.Context, url string) ([]byte, error) {
	request, err := http.NewRequestWithContext(ctx, http.MethodGet, url, nil)
	if err != nil {
		return nil, err
	}
	request.Header.Set("User-Agent", "cautilus-installer")
	response, err := http.DefaultClient.Do(request)
	if err != nil {
		return nil, err
	}
	defer func() {
		_ = response.Body.Close()
	}()
	if response.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("download failed for %s: %s", url, response.Status)
	}
	return io.ReadAll(response.Body)
}

func findExpectedSHA256(checksums string, assetName string) (string, error) {
	for _, line := range strings.Split(checksums, "\n") {
		fields := strings.Fields(strings.TrimSpace(line))
		if len(fields) != 2 {
			continue
		}
		if filepath.Base(fields[1]) == assetName {
			return fields[0], nil
		}
	}
	return "", fmt.Errorf("failed to find %s in checksum manifest", assetName)
}

func extractBinaryFromArchive(archiveBytes []byte) ([]byte, error) {
	gzipReader, err := gzip.NewReader(bytes.NewReader(archiveBytes))
	if err != nil {
		return nil, err
	}
	defer func() {
		_ = gzipReader.Close()
	}()
	tarReader := tar.NewReader(gzipReader)
	for {
		header, err := tarReader.Next()
		if err != nil {
			if err == io.EOF {
				break
			}
			return nil, err
		}
		if header.Typeflag != tar.TypeReg {
			continue
		}
		if filepath.Base(header.Name) != "cautilus" {
			continue
		}
		return io.ReadAll(tarReader)
	}
	return nil, fmt.Errorf("release archive did not include cautilus binary")
}

func renderInstalledWrapper(binaryPath string) string {
	return fmt.Sprintf(`#!/usr/bin/env sh
CAUTILUS_CALLER_CWD="$(pwd)" \
exec %q "$@"
`, binaryPath)
}
