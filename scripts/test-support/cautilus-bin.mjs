import { chmodSync, mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";

export function createFakeCautilusBin(root) {
	const binDir = join(root, "fake-bin");
	const binPath = join(binDir, "cautilus");
	mkdirSync(binDir, { recursive: true });
	writeFileSync(
		binPath,
		[
			"#!/bin/sh",
			"set -eu",
			"command=${1:-}",
			"shift || true",
			"repo_root=",
			"scope=",
			"overwrite=0",
			"while [ $# -gt 0 ]; do",
			'  case "$1" in',
			"    --repo-root)",
			"      repo_root=$2",
			"      shift 2",
			"      ;;",
			"    --scope)",
			"      scope=$2",
			"      shift 2",
			"      ;;",
			"    --overwrite)",
			"      overwrite=1",
			"      shift",
			"      ;;",
			"    *)",
			"      shift",
			"      ;;",
			"  esac",
			"done",
			'if [ -z "$repo_root" ]; then',
			'  echo "missing --repo-root" >&2',
			"  exit 2",
			"fi",
			'case "$command" in',
			"  init)",
			'    if [ "$overwrite" != "1" ]; then',
			'      echo "init must pass --overwrite" >&2',
			"      exit 2",
			"    fi",
			'    mkdir -p "$repo_root/.agents/skills/cautilus-agent"',
			'    printf "%s\\n" "---" "name: cautilus-agent" "---" "# Cautilus Agent" > "$repo_root/.agents/skills/cautilus-agent/SKILL.md"',
			'    echo "Installed .agents/skills/cautilus-agent"',
			"    ;;",
			"  doctor)",
			'    if [ "$scope" != "agent-surface" ]; then',
			'      echo "doctor must pass --scope agent-surface" >&2',
			"      exit 2",
			"    fi",
			'    printf "%s\\n" "{\\"ready\\":true}"',
			"    ;;",
			"  *)",
			'    echo "unexpected command: $command" >&2',
			"    exit 2",
			"    ;;",
			"esac",
			"",
		].join("\n"),
		"utf-8",
	);
	chmodSync(binPath, 0o755);
	return binPath;
}
