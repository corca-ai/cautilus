#!/usr/bin/env bash
set -euo pipefail

usage() {
	cat <<'EOF'
Usage: run-workbench-review-variant.sh --backend codex_exec|claude_p --workspace DIR --prompt-file FILE --schema-file FILE --output-file FILE

Runs a bounded, structured workbench review variant with the repo's preferred
CLI guardrails.
The script intentionally keeps the argument surface small so operators do not
re-introduce fragile approval, stdin, or permission flags ad hoc.
Default timeout: 900 seconds. Override with WORKBENCH_REVIEW_TIMEOUT_SECONDS.
EOF
}

backend=""
workspace=""
prompt_file=""
schema_file=""
output_file=""
stderr_file=""
timeout_seconds="${WORKBENCH_REVIEW_TIMEOUT_SECONDS:-900}"

while [[ $# -gt 0 ]]; do
	case "$1" in
		--backend)
			backend="${2:-}"
			shift 2
			;;
		--workspace)
			workspace="${2:-}"
			shift 2
			;;
		--prompt-file)
			prompt_file="${2:-}"
			shift 2
			;;
		--schema-file)
			schema_file="${2:-}"
			shift 2
			;;
		--output-file)
			output_file="${2:-}"
			shift 2
			;;
		-h|--help)
			usage
			exit 0
			;;
		*)
			echo "Unknown argument: $1" >&2
			usage >&2
			exit 1
			;;
	esac
done

if [[ -z "$backend" || -z "$workspace" || -z "$prompt_file" || -z "$schema_file" || -z "$output_file" ]]; then
	echo "Missing required arguments." >&2
	usage >&2
	exit 1
fi

if [[ ! -d "$workspace" ]]; then
	echo "Workspace not found: $workspace" >&2
	exit 1
fi
if [[ ! -f "$prompt_file" ]]; then
	echo "Prompt file not found: $prompt_file" >&2
	exit 1
fi
if [[ ! -f "$schema_file" ]]; then
	echo "Schema file not found: $schema_file" >&2
	exit 1
fi

mkdir -p "$(dirname "$output_file")"
stderr_file="${output_file}.stderr"

run_with_timeout() {
	if command -v timeout >/dev/null 2>&1; then
		timeout --foreground "${timeout_seconds}s" "$@"
	else
		"$@"
	fi
}

case "$backend" in
	codex_exec)
		(
			cd "$workspace"
			run_with_timeout codex exec \
				-C "$workspace" \
				--sandbox read-only \
				--ephemeral \
				--output-schema "$schema_file" \
				-o "$output_file" \
				- < "$prompt_file"
		) 2> "$stderr_file"
		if grep -Eq '^(failed to load skill|ERROR: .*invalid_request_error)' "$stderr_file"; then
			echo "codex_exec emitted a fatal stderr pattern; see $stderr_file" >&2
			exit 1
		fi
		;;
	claude_p)
		schema_json="$(python3 -c 'import json,sys; print(json.dumps(json.load(open(sys.argv[1], encoding="utf-8")), separators=(",", ":")))' "$schema_file")"
		raw_output_file="${output_file}.raw"
		rm -f "$raw_output_file"
		(
			cd "$workspace"
			run_with_timeout claude -p \
				--no-session-persistence \
				--tools "" \
				--output-format json \
				--json-schema "$schema_json" \
				< "$prompt_file" > "$raw_output_file"
		) 2> "$stderr_file"
		python3 - "$raw_output_file" "$output_file" <<'PY'
import json
import sys
from pathlib import Path

raw_path = Path(sys.argv[1])
output_path = Path(sys.argv[2])
payload = json.loads(raw_path.read_text(encoding="utf-8"))
if payload.get("is_error"):
    raise SystemExit(payload.get("result") or "claude -p returned is_error=true")
structured = payload.get("structured_output")
normalized = structured if isinstance(structured, dict) else payload
output_path.write_text(json.dumps(normalized, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
raw_path.unlink(missing_ok=True)
PY
		;;
	*)
		echo "Unsupported backend: $backend" >&2
		exit 1
		;;
esac

if [[ ! -s "$output_file" ]]; then
	echo "Review output missing or empty: $output_file" >&2
	exit 1
fi
