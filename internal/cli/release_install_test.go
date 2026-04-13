package cli

import (
	"archive/tar"
	"bytes"
	"compress/gzip"
	"context"
	"crypto/sha256"
	"encoding/hex"
	"fmt"
	"os"
	"path/filepath"
	"strings"
	"testing"
)

func TestInstallManagedReleaseWritesManagedWrapperAndBinary(t *testing.T) {
	archiveBytes := buildReleaseArchive(t, "binary\n")
	archiveSHA256 := sha256.Sum256(archiveBytes)
	checksums := fmt.Sprintf("%s  dist/cautilus_1.2.4_linux_x64.tar.gz\n", hex.EncodeToString(archiveSHA256[:]))

	installRoot := filepath.Join(t.TempDir(), "install-root")
	binDir := filepath.Join(t.TempDir(), "bin")
	result, err := InstallManagedRelease(ReleaseInstallOptions{
		Version:     "v1.2.4",
		Repo:        "corca-ai/cautilus",
		InstallRoot: installRoot,
		BinDir:      binDir,
		OS:          "linux",
		Arch:        "amd64",
		Download: func(ctx context.Context, url string) ([]byte, error) {
			switch {
			case strings.HasSuffix(url, ".tar.gz"):
				return archiveBytes, nil
			case strings.HasSuffix(url, "checksums.txt"):
				return []byte(checksums), nil
			default:
				return nil, fmt.Errorf("unexpected URL: %s", url)
			}
		},
	})
	if err != nil {
		t.Fatalf("InstallManagedRelease returned error: %v", err)
	}
	if result.Version != "1.2.4" {
		t.Fatalf("expected version 1.2.4, got %q", result.Version)
	}
	binaryBytes, err := os.ReadFile(result.BinaryPath)
	if err != nil {
		t.Fatalf("ReadFile returned error: %v", err)
	}
	if string(binaryBytes) != "binary\n" {
		t.Fatalf("unexpected binary payload: %q", string(binaryBytes))
	}
	wrapperBytes, err := os.ReadFile(result.WrapperPath)
	if err != nil {
		t.Fatalf("ReadFile returned error: %v", err)
	}
	wrapper := string(wrapperBytes)
	if !strings.Contains(wrapper, `CAUTILUS_CALLER_CWD="$(pwd)"`) {
		t.Fatalf("expected caller cwd wrapper, got %q", wrapper)
	}
	if !strings.Contains(wrapper, result.BinaryPath) {
		t.Fatalf("expected wrapper to point at %s, got %q", result.BinaryPath, wrapper)
	}
}

func TestInstallManagedReleaseRejectsChecksumMismatch(t *testing.T) {
	archiveBytes := buildReleaseArchive(t, "binary\n")
	_, err := InstallManagedRelease(ReleaseInstallOptions{
		Version:     "v1.2.4",
		Repo:        "corca-ai/cautilus",
		InstallRoot: filepath.Join(t.TempDir(), "install-root"),
		BinDir:      filepath.Join(t.TempDir(), "bin"),
		OS:          "linux",
		Arch:        "amd64",
		Download: func(ctx context.Context, url string) ([]byte, error) {
			switch {
			case strings.HasSuffix(url, ".tar.gz"):
				return archiveBytes, nil
			case strings.HasSuffix(url, "checksums.txt"):
				return []byte("deadbeef  cautilus_1.2.4_linux_x64.tar.gz\n"), nil
			default:
				return nil, fmt.Errorf("unexpected URL: %s", url)
			}
		},
	})
	if err == nil {
		t.Fatal("expected checksum mismatch")
	}
	if !strings.Contains(err.Error(), "checksum mismatch") {
		t.Fatalf("expected checksum mismatch, got %v", err)
	}
}

func TestInstallManagedReleaseAcceptsChecksumManifestWithoutPathPrefix(t *testing.T) {
	archiveBytes := buildReleaseArchive(t, "binary\n")
	archiveSHA256 := sha256.Sum256(archiveBytes)
	checksums := fmt.Sprintf("%s  cautilus_1.2.4_linux_x64.tar.gz\n", hex.EncodeToString(archiveSHA256[:]))

	_, err := InstallManagedRelease(ReleaseInstallOptions{
		Version:     "v1.2.4",
		Repo:        "corca-ai/cautilus",
		InstallRoot: filepath.Join(t.TempDir(), "install-root"),
		BinDir:      filepath.Join(t.TempDir(), "bin"),
		OS:          "linux",
		Arch:        "amd64",
		Download: func(ctx context.Context, url string) ([]byte, error) {
			switch {
			case strings.HasSuffix(url, ".tar.gz"):
				return archiveBytes, nil
			case strings.HasSuffix(url, "checksums.txt"):
				return []byte(checksums), nil
			default:
				return nil, fmt.Errorf("unexpected URL: %s", url)
			}
		},
	})
	if err != nil {
		t.Fatalf("InstallManagedRelease returned error: %v", err)
	}
}

func buildReleaseArchive(t *testing.T, binary string) []byte {
	t.Helper()
	var gzipBuffer bytes.Buffer
	gzipWriter := gzip.NewWriter(&gzipBuffer)
	tarWriter := tar.NewWriter(gzipWriter)
	payload := []byte(binary)
	header := &tar.Header{
		Name: "cautilus",
		Mode: 0o755,
		Size: int64(len(payload)),
	}
	if err := tarWriter.WriteHeader(header); err != nil {
		t.Fatalf("WriteHeader returned error: %v", err)
	}
	if _, err := tarWriter.Write(payload); err != nil {
		t.Fatalf("Write returned error: %v", err)
	}
	if err := tarWriter.Close(); err != nil {
		t.Fatalf("Close returned error: %v", err)
	}
	if err := gzipWriter.Close(); err != nil {
		t.Fatalf("Close returned error: %v", err)
	}
	return gzipBuffer.Bytes()
}
