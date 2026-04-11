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

need_cmd curl
need_cmd tar
need_cmd go
need_cmd sed

if [ "${1:-}" = "--help" ]; then
	usage
	exit 0
fi

VERSION="$(resolve_version)"
ARCHIVE_URL="https://github.com/$REPO/archive/refs/tags/$VERSION.tar.gz"
TMPDIR="$(mktemp -d)"
ARCHIVE_PATH="$TMPDIR/cautilus.tar.gz"
EXTRACT_ROOT="$TMPDIR/extract"
TARGET_DIR="$INSTALL_ROOT/$VERSION"

mkdir -p "$EXTRACT_ROOT" "$INSTALL_ROOT" "$BIN_DIR"

printf 'Installing Cautilus %s from %s\n' "$VERSION" "$ARCHIVE_URL"
curl -fsSL "$ARCHIVE_URL" -o "$ARCHIVE_PATH"
tar -xzf "$ARCHIVE_PATH" -C "$EXTRACT_ROOT"

EXTRACTED_DIR="$(find "$EXTRACT_ROOT" -mindepth 1 -maxdepth 1 -type d | head -n 1)"
if [ -z "$EXTRACTED_DIR" ]; then
	printf 'Failed to extract release archive.\n' >&2
	exit 1
fi

rm -rf "$TARGET_DIR"
mv "$EXTRACTED_DIR" "$TARGET_DIR"

(
	cd "$TARGET_DIR"
	mkdir -p "$TARGET_DIR/bin"
	go build -o "$TARGET_DIR/bin/cautilus-real" ./cmd/cautilus
)

cat > "$BIN_DIR/cautilus" <<EOF
#!/usr/bin/env sh
CAUTILUS_TOOL_ROOT="$TARGET_DIR" \
CAUTILUS_CALLER_CWD="\$(pwd)" \
exec "$TARGET_DIR/bin/cautilus-real" "\$@"
EOF
chmod +x "$BIN_DIR/cautilus"

printf 'Installed to %s\n' "$TARGET_DIR"
printf 'Binary written to %s/bin/cautilus-real\n' "$TARGET_DIR"
printf 'Wrapper written to %s/cautilus\n' "$BIN_DIR"
printf 'Ensure %s is on PATH\n' "$BIN_DIR"
