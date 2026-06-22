#!/usr/bin/env python3
from __future__ import annotations

import runpy
import sys
from pathlib import Path


def _candidate_scripts(repo_root: Path) -> list[Path]:
    codex_home = Path.home() / ".codex"
    return sorted(
        (codex_home / "plugins" / "cache" / "local" / "charness").glob(
            "*/scripts/check_cli_skill_surface.py"
        ),
        reverse=True,
    )


def main() -> int:
    repo_root = Path(__file__).resolve().parents[1]
    candidates = _candidate_scripts(repo_root)
    target = next((path for path in candidates if path.is_file()), None)
    if target is None:
        sys.stderr.write(
            "check_cli_skill_surface.py requires the installed Charness support script "
            "under ~/.codex/plugins/cache/local/charness/*/scripts/.\n"
        )
        return 2
    sys.path.insert(0, str(target.parent))
    runpy.run_path(str(target), run_name="__main__")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
