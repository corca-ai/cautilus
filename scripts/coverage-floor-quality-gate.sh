#!/usr/bin/env sh
set -eu

DIR="$(cd "$(dirname "$0")" && pwd)"
ROOT="$(cd "$DIR/.." && pwd)"

exec node "$ROOT/scripts/check-coverage-floor.mjs" "$@"
