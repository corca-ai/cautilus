#!/usr/bin/env sh
set -eu

usage() {
	cat <<'EOF'
Usage:
  ./scripts/run-quality.sh [--read-only]

Runs the repo-owned quality evidence packet.

Options:
  --read-only  Run only non-durable gates and skip artifact-writing dogfood.
  -h, --help   Show this help.
EOF
}

READ_ONLY=0
while [ "$#" -gt 0 ]; do
	case "$1" in
		--read-only)
			READ_ONLY=1
			;;
		-h|--help)
			usage
			exit 0
			;;
		*)
			printf 'run-quality: unknown argument: %s\n' "$1" >&2
			usage >&2
			exit 1
			;;
	esac
	shift
done

DIR="$(cd "$(dirname "$0")" && pwd)"
ROOT="$(cd "$DIR/.." && pwd)"
NPM_CMD="${CAUTILUS_QUALITY_NPM:-npm}"

run_phase() {
	label="$1"
	shift
	start="$(date +%s)"
	printf 'quality: %s started\n' "$label"
	"$@"
	end="$(date +%s)"
	printf 'quality: %s passed in %ss\n' "$label" "$((end - start))"
}

cd "$ROOT"
VERIFY_TARGET="verify"
if [ "$READ_ONLY" -eq 0 ]; then
	VERIFY_TARGET="verify:runtime"
fi
run_phase "verify" "$NPM_CMD" run "$VERIFY_TARGET"

if [ "$READ_ONLY" -eq 0 ]; then
	run_phase "self dogfood" "$NPM_CMD" run dogfood:self
else
	printf 'quality: self dogfood skipped for --read-only\n'
fi
