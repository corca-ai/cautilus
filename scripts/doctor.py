from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path
from typing import Any

from resolve_adapter import load_adapter

COMMAND_FIELDS = (
    "iterate_command_templates",
    "held_out_command_templates",
    "comparison_command_templates",
    "full_gate_command_templates",
)


def _has_items(value: Any) -> bool:
    return isinstance(value, list) and len(value) > 0


def _check(id: str, ok: bool, detail: str) -> dict[str, Any]:
    return {"id": id, "ok": ok, "detail": detail}


def _init_command(repo_root: Path, adapter_name: str | None) -> str:
    command = f"node ./bin/cautilus adapter init --repo-root {repo_root}"
    if adapter_name:
        command += f" --adapter-name {adapter_name}"
    return command


def doctor_repo(
    repo_root: Path,
    adapter: Path | None = None,
    adapter_name: str | None = None,
) -> dict[str, Any]:
    payload = load_adapter(repo_root, adapter=adapter, adapter_name=adapter_name)
    checks: list[dict[str, Any]] = []
    suggestions: list[str] = []
    data = payload.get("data", {})

    if not payload["found"]:
        checks.append(_check("adapter_found", False, "No checked-in adapter was found."))
        status = "missing_adapter"
        summary = "Adapter missing."
        suggestions.append(_init_command(repo_root, adapter_name))
        if payload.get("warnings"):
            suggestions.extend(payload["warnings"])
        return {
            "status": status,
            "ready": False,
            "summary": summary,
            "repo_root": str(repo_root),
            "adapter_path": payload.get("path"),
            "searched_paths": payload.get("searched_paths", []),
            "checks": checks,
            "suggestions": suggestions,
            "warnings": payload.get("warnings", []),
            "errors": payload.get("errors", []),
        }

    checks.append(_check("adapter_found", True, f"Using adapter at {payload['path']}"))

    if not payload["valid"]:
        checks.append(_check("adapter_valid", False, "Adapter failed schema validation."))
        suggestions.append("Repair the adapter fields reported in errors before running evaluation.")
        suggestions.append("See docs/contracts/adapter-contract.md for the canonical adapter shape.")
        return {
            "status": "invalid_adapter",
            "ready": False,
            "summary": "Adapter is present but invalid.",
            "repo_root": str(repo_root),
            "adapter_path": payload.get("path"),
            "searched_paths": payload.get("searched_paths", []),
            "checks": checks,
            "suggestions": suggestions,
            "warnings": payload.get("warnings", []),
            "errors": payload.get("errors", []),
        }

    checks.append(_check("adapter_valid", True, "Adapter passed schema validation."))

    has_repo = isinstance(data.get("repo"), str) and bool(data["repo"].strip())
    checks.append(
        _check(
            "repo_name",
            has_repo,
            "Adapter declares repo." if has_repo else "Adapter is missing a repo name.",
        )
    )
    if not has_repo:
        suggestions.append("Set adapter.repo to the host repo name.")

    has_surfaces = _has_items(data.get("evaluation_surfaces"))
    checks.append(
        _check(
            "evaluation_surfaces",
            has_surfaces,
            "Adapter declares evaluation surfaces."
            if has_surfaces
            else "Adapter is missing evaluation_surfaces.",
        )
    )
    if not has_surfaces:
        suggestions.append("Add at least one evaluation_surfaces entry that states what the adapter judges.")

    has_baselines = _has_items(data.get("baseline_options"))
    checks.append(
        _check(
            "baseline_options",
            has_baselines,
            "Adapter declares baseline options."
            if has_baselines
            else "Adapter is missing baseline_options.",
        )
    )
    if not has_baselines:
        suggestions.append("Add at least one baseline_options entry so comparisons stay explicit.")

    automated_commands = any(_has_items(data.get(field)) for field in COMMAND_FIELDS)
    has_variants = _has_items(data.get("executor_variants"))
    has_execution_surface = automated_commands or has_variants
    checks.append(
        _check(
            "execution_surface",
            has_execution_surface,
            "Adapter declares runnable command templates or executor variants."
            if has_execution_surface
            else "Adapter has no command templates or executor variants yet.",
        )
    )
    if not has_execution_surface:
        suggestions.append(
            "Add at least one iterate/held_out/comparison/full_gate command template or executor_variants entry."
        )

    ready = all(check["ok"] for check in checks)
    summary = "Adapter is ready for standalone Cautilus use." if ready else "Adapter exists but is not ready yet."
    return {
        "status": "ready" if ready else "incomplete_adapter",
        "ready": ready,
        "summary": summary,
        "repo_root": str(repo_root),
        "adapter_path": payload.get("path"),
        "searched_paths": payload.get("searched_paths", []),
        "checks": checks,
        "suggestions": suggestions,
        "warnings": payload.get("warnings", []),
        "errors": payload.get("errors", []),
    }


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--repo-root", type=Path, required=True)
    parser.add_argument("--adapter", type=Path)
    parser.add_argument("--adapter-name")
    args = parser.parse_args()
    result = doctor_repo(args.repo_root.resolve(), adapter=args.adapter, adapter_name=args.adapter_name)
    sys.stdout.write(json.dumps(result, ensure_ascii=False, indent=2, sort_keys=True) + "\n")
    raise SystemExit(0 if result["ready"] else 1)


if __name__ == "__main__":
    main()
