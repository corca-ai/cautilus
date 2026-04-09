from __future__ import annotations

import argparse
import importlib.util
import json
import sys
from pathlib import Path
from typing import Any

SCRIPT_DIR = Path(__file__).resolve().parent
_spec = importlib.util.spec_from_file_location("_stdlib_yaml", SCRIPT_DIR / "_stdlib_yaml.py")
assert _spec is not None and _spec.loader is not None
_stdlib_yaml = importlib.util.module_from_spec(_spec)
_spec.loader.exec_module(_stdlib_yaml)

ADAPTER_CANDIDATES = (
    Path(".agents/workbench-adapter.yaml"),
    Path(".codex/workbench-adapter.yaml"),
    Path(".claude/workbench-adapter.yaml"),
    Path("docs/workbench-adapter.yaml"),
    Path("workbench-adapter.yaml"),
)

NAMED_ADAPTER_DIRS = (
    Path(".agents/workbench-adapters"),
    Path(".codex/workbench-adapters"),
    Path(".claude/workbench-adapters"),
    Path("docs/workbench-adapters"),
    Path("workbench-adapters"),
)

STRING_LIST_FIELDS = (
    "evaluation_surfaces",
    "baseline_options",
    "required_prerequisites",
    "preflight_commands",
    "iterate_command_templates",
    "held_out_command_templates",
    "comparison_command_templates",
    "full_gate_command_templates",
    "artifact_paths",
    "report_paths",
    "comparison_questions",
)

INTEGER_FIELDS = (
    "version",
    "iterate_samples_default",
    "held_out_samples_default",
    "comparison_samples_default",
    "full_gate_samples_default",
)

STRING_FIELDS = (
    "repo",
    "history_file_hint",
    "profile_default",
    "default_prompt_file",
    "default_schema_file",
)

EXECUTOR_VARIANT_STRING_FIELDS = (
    "id",
    "tool",
    "command_template",
)

EXECUTOR_VARIANT_OPTIONAL_STRING_FIELDS = ("purpose",)

EXECUTOR_VARIANT_STRING_LIST_FIELDS = (
    "required_prerequisites",
    "safety_notes",
)


def _string_list(value: Any, field: str, errors: list[str]) -> list[str] | None:
    if value is None:
        return None
    if not isinstance(value, list) or not all(isinstance(item, str) for item in value):
        errors.append(f"{field} must be a list of strings")
        return None
    return list(value)


def _int_value(value: Any, field: str, errors: list[str]) -> int | None:
    if value is None:
        return None
    if not isinstance(value, int):
        errors.append(f"{field} must be an integer")
        return None
    return value


def _validate_review_prompts(value: Any, errors: list[str]) -> list[dict[str, str]] | None:
    if value is None:
        return None
    if not isinstance(value, list):
        errors.append("human_review_prompts must be a list")
        return None
    prompts: list[dict[str, str]] = []
    for index, item in enumerate(value):
        if not isinstance(item, dict):
            errors.append(f"human_review_prompts[{index}] must be a mapping")
            continue
        prompt_id = item.get("id")
        prompt = item.get("prompt")
        if not isinstance(prompt_id, str) or not isinstance(prompt, str):
            errors.append(f"human_review_prompts[{index}] must include string id and prompt")
            continue
        prompts.append({"id": prompt_id, "prompt": prompt})
    return prompts


def _validate_executor_variants(value: Any, errors: list[str]) -> list[dict[str, Any]] | None:
    if value is None:
        return None
    if not isinstance(value, list):
        errors.append("executor_variants must be a list")
        return None
    variants: list[dict[str, Any]] = []
    for index, item in enumerate(value):
        if not isinstance(item, dict):
            errors.append(f"executor_variants[{index}] must be a mapping")
            continue
        variant: dict[str, Any] = {}
        missing_required = False
        for field in EXECUTOR_VARIANT_STRING_FIELDS:
            field_value = item.get(field)
            if not isinstance(field_value, str) or not field_value.strip():
                errors.append(f"executor_variants[{index}].{field} must be a non-empty string")
                missing_required = True
                continue
            variant[field] = field_value
        for field in EXECUTOR_VARIANT_OPTIONAL_STRING_FIELDS:
            field_value = item.get(field)
            if field_value is None:
                continue
            if not isinstance(field_value, str):
                errors.append(f"executor_variants[{index}].{field} must be a string")
                continue
            variant[field] = field_value
        for field in EXECUTOR_VARIANT_STRING_LIST_FIELDS:
            field_value = _string_list(
                item.get(field), f"executor_variants[{index}].{field}", errors
            )
            if field_value is not None:
                variant[field] = field_value
        if not missing_required:
            variants.append(variant)
    return variants


def validate_adapter_data(data: dict[str, Any]) -> tuple[dict[str, Any], list[str]]:
    errors: list[str] = []
    validated: dict[str, Any] = {}

    for field in STRING_FIELDS:
        value = data.get(field)
        if value is None:
            continue
        if not isinstance(value, str):
            errors.append(f"{field} must be a string")
            continue
        validated[field] = value

    for field in INTEGER_FIELDS:
        value = _int_value(data.get(field), field, errors)
        if value is not None:
            validated[field] = value

    for field in STRING_LIST_FIELDS:
        items = _string_list(data.get(field), field, errors)
        if items is not None:
            validated[field] = items

    review_prompts = _validate_review_prompts(data.get("human_review_prompts"), errors)
    if review_prompts is not None:
        validated["human_review_prompts"] = review_prompts

    executor_variants = _validate_executor_variants(data.get("executor_variants"), errors)
    if executor_variants is not None:
        validated["executor_variants"] = executor_variants

    return validated, errors


def infer_repo_defaults(repo_root: Path) -> dict[str, Any]:
    inferred: dict[str, Any] = {}
    package_json = repo_root / "package.json"
    if not package_json.is_file():
        return inferred

    package_data = json.loads(package_json.read_text(encoding="utf-8"))
    scripts = package_data.get("scripts", {})
    if not isinstance(scripts, dict):
        return inferred

    if isinstance(scripts.get("check"), str):
        inferred["preflight_commands"] = ["npm run check"]

    if isinstance(scripts.get("prompt:bench:train"), str):
        inferred["iterate_command_templates"] = [
            "npm run prompt:bench:train -- --baseline-ref {baseline_ref} --history-file {history_file} --samples {iterate_samples}"
        ]
    if isinstance(scripts.get("prompt:bench:test"), str):
        inferred["held_out_command_templates"] = [
            "npm run prompt:bench:test -- --baseline-ref {baseline_ref} --samples {held_out_samples}"
        ]
    if isinstance(scripts.get("prompt:bench:full"), str):
        inferred["full_gate_command_templates"] = [
            "npm run prompt:bench:full -- --baseline-ref {baseline_ref} --history-file {history_file} --samples {full_gate_samples}"
        ]

    compare_script = repo_root / "scripts/agent-runtime/compare-prompt-worktrees.mjs"
    if compare_script.is_file():
        inferred["comparison_command_templates"] = [
            "node scripts/agent-runtime/compare-prompt-worktrees.mjs --baseline-ref {baseline_ref} --profile {profile} --split {split} --samples {comparison_samples}"
        ]

    report_path = repo_root / "specs/report/audit-workbench.html"
    if report_path.is_file():
        inferred["report_paths"] = [str(report_path.relative_to(repo_root))]

    inferred["repo"] = repo_root.name
    inferred["iterate_samples_default"] = 2
    inferred["held_out_samples_default"] = 2
    inferred["comparison_samples_default"] = 2
    inferred["full_gate_samples_default"] = 2
    inferred["history_file_hint"] = "/tmp/workbench-history.json"
    return inferred


def named_adapter_candidates(adapter_name: str) -> tuple[Path, ...]:
    return tuple(directory / f"{adapter_name}.yaml" for directory in NAMED_ADAPTER_DIRS)


def find_adapter(repo_root: Path, candidates: tuple[Path, ...] = ADAPTER_CANDIDATES) -> Path | None:
    for candidate in candidates:
        path = repo_root / candidate
        if path.is_file():
            return path
    return None


def load_adapter(
    repo_root: Path,
    adapter: Path | None = None,
    adapter_name: str | None = None,
) -> dict[str, Any]:
    if adapter is not None and adapter_name is not None:
        raise ValueError("Use either adapter or adapter_name, not both.")

    if adapter is not None:
        adapter_path = adapter if adapter.is_absolute() else (repo_root / adapter)
        searched_paths = [str(adapter_path.resolve())]
        candidates = None
    else:
        candidates = named_adapter_candidates(adapter_name) if adapter_name else ADAPTER_CANDIDATES
        searched_paths = [str((repo_root / candidate).resolve()) for candidate in candidates]
        adapter_path = find_adapter(repo_root, candidates)

    if adapter_path is None:
        inferred = infer_repo_defaults(repo_root)
        warnings = ["No workbench adapter found. Falling back to inferred defaults."]
        if adapter_name:
            warnings = [
                f"No named workbench adapter '{adapter_name}' found. Falling back to inferred defaults."
            ]
        return {
            "found": False,
            "valid": True,
            "path": None,
            "data": inferred,
            "errors": [],
            "warnings": warnings,
            "searched_paths": searched_paths,
        }

    raw = _stdlib_yaml.load_file(adapter_path)
    raw_data = raw if isinstance(raw, dict) else {}
    warnings: list[str] = []
    if not isinstance(raw, dict):
        warnings.append("Adapter file did not contain a mapping. Using empty data.")
    data, errors = validate_adapter_data(raw_data)
    return {
        "found": True,
        "valid": not errors,
        "path": str(adapter_path),
        "data": data,
        "errors": errors,
        "warnings": warnings,
        "searched_paths": searched_paths,
    }


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--repo-root", type=Path, required=True)
    parser.add_argument("--adapter", type=Path)
    parser.add_argument("--adapter-name")
    args = parser.parse_args()
    sys.stdout.write(
        json.dumps(
            load_adapter(args.repo_root.resolve(), adapter=args.adapter, adapter_name=args.adapter_name),
            ensure_ascii=False,
            indent=2,
            sort_keys=True,
        )
        + "\n"
    )


if __name__ == "__main__":
    main()
