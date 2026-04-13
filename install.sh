#!/usr/bin/env sh
set -eu

REPO="${CAUTILUS_REPO:-corca-ai/cautilus}"
INSTALL_ROOT="${CAUTILUS_INSTALL_ROOT:-$HOME/.local/share/cautilus}"
BIN_DIR="${CAUTILUS_BIN_DIR:-$HOME/.local/bin}"
VERSION="${CAUTILUS_VERSION:-}"

usage() {
	cat <<'EOF'
Usage:
  curl -fsSL https://raw.githubusercontent.com/corca-ai/cautilus/main/install.sh | sh

Environment:
  CAUTILUS_VERSION      install a specific tag such as v0.2.0
  CAUTILUS_REPO         GitHub repo, default corca-ai/cautilus
  CAUTILUS_INSTALL_ROOT install root, default ~/.local/share/cautilus
  CAUTILUS_BIN_DIR      wrapper bin dir, default ~/.local/bin
EOF
}

need_cmd() {
	command -v "$1" >/dev/null 2>&1 || {
		printf 'Missing required command: %s\n' "$1" >&2
		exit 1
	}
}

resolve_version() {
	if [ -n "$VERSION" ]; then
		printf '%s\n' "$VERSION"
		return
	fi
	curl -fsSLI -o /dev/null -w '%{url_effective}' "https://github.com/$REPO/releases/latest" | sed 's#.*/##'
}

sha256_file() {
	if command -v sha256sum >/dev/null 2>&1; then
		sha256sum "$1" | awk '{print $1}'
		return
	fi
	if command -v shasum >/dev/null 2>&1; then
		shasum -a 256 "$1" | awk '{print $1}'
		return
	fi
	printf 'Missing required command: sha256sum or shasum\n' >&2
	exit 1
}

need_cmd curl
need_cmd tar
need_cmd uname
need_cmd sed

if [ "${1:-}" = "--help" ]; then
	usage
	exit 0
fi

VERSION="$(resolve_version)"
VERSION_TRIMMED="$(printf '%s' "$VERSION" | sed 's/^v//')"
TMPDIR="$(mktemp -d)"
ARCHIVE_PATH="$TMPDIR/cautilus.tar.gz"
TARGET_DIR="$INSTALL_ROOT/$VERSION"

case "$(uname -s)" in
	Linux) ASSET_OS="linux" ;;
	Darwin) ASSET_OS="darwin" ;;
	*)
		printf 'Unsupported operating system: %s\n' "$(uname -s)" >&2
		exit 1
		;;
esac

case "$(uname -m)" in
	x86_64|amd64) ASSET_ARCH="x64" ;;
	arm64|aarch64) ASSET_ARCH="arm64" ;;
	*)
		printf 'Unsupported architecture: %s\n' "$(uname -m)" >&2
		exit 1
		;;
esac

ASSET_NAME="cautilus_${VERSION_TRIMMED}_${ASSET_OS}_${ASSET_ARCH}.tar.gz"
ARCHIVE_URL="https://github.com/$REPO/releases/download/$VERSION/$ASSET_NAME"
CHECKSUMS_URL="https://github.com/$REPO/releases/download/$VERSION/cautilus-$VERSION-checksums.txt"
CHECKSUMS_PATH="$TMPDIR/checksums.txt"

mkdir -p "$INSTALL_ROOT" "$BIN_DIR"

printf 'Installing Cautilus %s from %s\n' "$VERSION" "$ARCHIVE_URL"
curl -fsSL "$ARCHIVE_URL" -o "$ARCHIVE_PATH"
curl -fsSL "$CHECKSUMS_URL" -o "$CHECKSUMS_PATH"
EXPECTED_SHA256="$(
	awk -v asset="$ASSET_NAME" '
		{
			path = $2
			sub(/^.*\//, "", path)
			if (path == asset) {
				print $1
				exit
			}
		}
	' "$CHECKSUMS_PATH"
)"
if [ -z "$EXPECTED_SHA256" ]; then
	printf 'Failed to find %s in %s\n' "$ASSET_NAME" "$CHECKSUMS_URL" >&2
	exit 1
fi
ACTUAL_SHA256="$(sha256_file "$ARCHIVE_PATH")"
if [ "$ACTUAL_SHA256" != "$EXPECTED_SHA256" ]; then
	printf 'Checksum mismatch for %s\nexpected %s\ngot %s\n' "$ASSET_NAME" "$EXPECTED_SHA256" "$ACTUAL_SHA256" >&2
	exit 1
fi

rm -rf "$TARGET_DIR"
mkdir -p "$TARGET_DIR/bin"
tar -xzf "$ARCHIVE_PATH" -C "$TARGET_DIR/bin"
mv "$TARGET_DIR/bin/cautilus" "$TARGET_DIR/bin/cautilus-real"

cat > "$BIN_DIR/cautilus" <<EOF
#!/usr/bin/env sh
CAUTILUS_CALLER_CWD="\$(pwd)" \
exec "$TARGET_DIR/bin/cautilus-real" "\$@"
EOF
chmod +x "$BIN_DIR/cautilus"

printf 'Installed to %s\n' "$TARGET_DIR"
printf 'Binary written to %s/bin/cautilus-real\n' "$TARGET_DIR"
printf 'Wrapper written to %s/cautilus\n' "$BIN_DIR"
printf 'Ensure %s is on PATH\n' "$BIN_DIR"
