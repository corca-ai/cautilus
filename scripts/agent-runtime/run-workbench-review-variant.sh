#!/usr/bin/env bash
set -euo pipefail

script_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
json_helper="$script_dir/review-variant-json.mjs"

usage() {
	cat <<'EOF'
Usage: run-workbench-review-variant.sh --backend codex_exec|claude_p --workspace DIR --prompt-file FILE --schema-file FILE --output-file FILE

Runs a bounded, structured workbench review variant with the repo's preferred
CLI guardrails.
The script intentionally keeps the argument surface small so operators do not
re-introduce fragile approval, stdin, or permission flags ad hoc.
Default timeout: 900 seconds. Override with WORKBENCH_REVIEW_TIMEOUT_SECONDS.
Set WORKBENCH_CODEX_MODEL or WORKBENCH_CODEX_REASONING_EFFORT to override the
Codex review model configuration for bounded review surfaces.
EOF
}

backend=""
workspace=""
prompt_file=""
schema_file=""
output_file=""
stderr_file=""
timeout_seconds="${WORKBENCH_REVIEW_TIMEOUT_SECONDS:-900}"
codex_model="${WORKBENCH_CODEX_MODEL:-}"
codex_reasoning_effort="${WORKBENCH_CODEX_REASONING_EFFORT:-}"

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
		codex_args=(
			exec
			-C "$workspace"
			--sandbox read-only
			--ephemeral
			--output-schema "$schema_file"
			-o "$output_file"
		)
		if [[ -n "$codex_model" ]]; then
			codex_args+=(--model "$codex_model")
		fi
		if [[ -n "$codex_reasoning_effort" ]]; then
			codex_args+=(-c "model_reasoning_effort=\"$codex_reasoning_effort\"")
		fi
		codex_args+=(-)
		(
			cd "$workspace"
			run_with_timeout codex "${codex_args[@]}" < "$prompt_file"
		) 2> "$stderr_file"
		if grep -Eq '^(failed to load skill|ERROR: .*invalid_request_error)' "$stderr_file"; then
			echo "codex_exec emitted a fatal stderr pattern; see $stderr_file" >&2
			exit 1
		fi
		;;
	claude_p)
		schema_json="$(node "$json_helper" schema-json "$schema_file")"
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
		node "$json_helper" normalize-claude-output "$raw_output_file" "$output_file"
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
