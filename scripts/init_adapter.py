from __future__ import annotations

import argparse
import importlib.util
import sys
from pathlib import Path
from typing import Any

import yaml

SCRIPT_DIR = Path(__file__).resolve().parent


def _load_resolver() -> Any:
    module_path = SCRIPT_DIR / "resolve_adapter.py"
    spec = importlib.util.spec_from_file_location("cautilus_resolver", module_path)
    if spec is None or spec.loader is None:
        raise RuntimeError(f"Could not load resolver from {module_path}")
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


resolve_adapter = _load_resolver()


def scaffold_adapter(repo_root: Path, repo_name: str) -> dict[str, Any]:
    inferred = resolve_adapter.infer_repo_defaults(repo_root)
    return {
        "version": 1,
        "repo": repo_name,
        "evaluation_surfaces": [
            "prompt behavior",
            "workflow behavior",
        ],
        "baseline_options": [
            "baseline git ref in the same repo via {baseline_ref}",
        ],
        "required_prerequisites": [
            "choose a real baseline before comparing results",
        ],
        "preflight_commands": inferred.get("preflight_commands", []),
        "iterate_command_templates": inferred.get("iterate_command_templates", []),
        "held_out_command_templates": inferred.get("held_out_command_templates", []),
        "comparison_command_templates": inferred.get("comparison_command_templates", []),
        "full_gate_command_templates": inferred.get("full_gate_command_templates", []),
        "executor_variants": [],
        "artifact_paths": [],
        "report_paths": inferred.get("report_paths", []),
        "comparison_questions": [
            "Which scenarios improved, regressed, or stayed noisy after repeated samples?",
        ],
        "human_review_prompts": [
            {
                "id": "real-user",
                "prompt": "Where would a real user still judge the candidate worse despite benchmark wins?",
            }
        ],
        "iterate_samples_default": inferred.get("iterate_samples_default", 2),
        "held_out_samples_default": inferred.get("held_out_samples_default", 2),
        "comparison_samples_default": inferred.get("comparison_samples_default", 2),
        "full_gate_samples_default": inferred.get("full_gate_samples_default", 2),
        "history_file_hint": inferred.get("history_file_hint", "/tmp/workbench-history.json"),
        "profile_default": inferred.get("profile_default", "default"),
    }


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--repo-root", type=Path, required=True)
    parser.add_argument("--repo-name")
    parser.add_argument("--adapter-name")
    parser.add_argument("--output", type=Path)
    parser.add_argument("--force", action="store_true")
    args = parser.parse_args()

    repo_root = args.repo_root.resolve()
    default_output = (
        Path(".agents/workbench-adapters") / f"{args.adapter_name}.yaml"
        if args.adapter_name
        else Path(".agents/workbench-adapter.yaml")
    )
    chosen_output = args.output or default_output
    output = chosen_output if chosen_output.is_absolute() else repo_root / chosen_output
    if output.exists() and not args.force:
        raise SystemExit(f"Adapter already exists at {output}. Use --force to overwrite.")

    output.parent.mkdir(parents=True, exist_ok=True)
    adapter = scaffold_adapter(repo_root, args.repo_name or repo_root.name)
    output.write_text(yaml.safe_dump(adapter, allow_unicode=True, sort_keys=False), encoding="utf-8")
    sys.stdout.write(f"{output}\n")


if __name__ == "__main__":
    main()
