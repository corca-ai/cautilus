"""Minimal stdlib YAML loader for workbench adapters.

Supports:
  - top-level scalars (string, int, bool, null)
  - lists of strings at any indent
  - lists of flat dicts with inline `- key: value` or indented key: value
  - one-level nested string lists inside list items
  - empty lists ([])
  - folded and literal block scalars
"""

from __future__ import annotations

import re
from pathlib import Path
from typing import Any


def _coerce_scalar(value: str) -> Any:
    if value == "":
        return ""
    lower = value.lower()
    if lower == "true":
        return True
    if lower == "false":
        return False
    if lower in ("null", "~"):
        return None
    try:
        return int(value)
    except ValueError:
        pass
    try:
        return float(value)
    except ValueError:
        pass
    if (value.startswith('"') and value.endswith('"')) or (
        value.startswith("'") and value.endswith("'")
    ):
        return value[1:-1]
    return value


def _inline_block_scalars(text: str) -> str:
    lines = text.splitlines()
    out: list[str] = []
    i = 0
    pattern = re.compile(
        r"^(?P<indent>\s*)(?P<prefix>(?:- )?)(?P<key>[A-Za-z_][A-Za-z0-9_-]*):\s*(?P<marker>[>|])\s*$"
    )
    while i < len(lines):
        line = lines[i]
        match = pattern.match(line)
        if not match:
            out.append(line)
            i += 1
            continue
        key_indent = len(match.group("indent"))
        marker = match.group("marker")
        prefix = match.group("prefix")
        key = match.group("key")
        j = i + 1
        content_lines: list[str] = []
        content_indent: int | None = None
        while j < len(lines):
            current = lines[j]
            if current.strip() == "":
                content_lines.append("")
                j += 1
                continue
            current_indent = len(current) - len(current.lstrip(" "))
            if current_indent <= key_indent:
                break
            if content_indent is None:
                content_indent = current_indent
            content_lines.append(current[content_indent:])
            j += 1
        while content_lines and content_lines[-1] == "":
            content_lines.pop()
        if marker == ">":
            parts: list[str] = []
            buffer: list[str] = []
            for content in content_lines:
                if content == "":
                    if buffer:
                        parts.append(" ".join(buffer))
                        buffer = []
                    parts.append("")
                else:
                    buffer.append(content)
            if buffer:
                parts.append(" ".join(buffer))
            inline = " ".join(part for part in parts if part)
        else:
            inline = "\n".join(content_lines)
        escaped = inline.replace("\\", "\\\\").replace('"', '\\"').replace("\n", "\\n")
        out.append(f'{match.group("indent")}{prefix}{key}: "{escaped}"')
        i = j
    return "\n".join(out)


def load(text: str) -> dict[str, Any]:
    text = _inline_block_scalars(text)
    result: dict[str, Any] = {}
    current_key: str | None = None
    current_list: list[Any] | None = None
    pending_obj: dict[str, Any] | None = None
    pending_nested_list_key: str | None = None

    for raw in text.splitlines():
        stripped = raw.strip()
        if not stripped or stripped.startswith("#"):
            continue
        indent = len(raw) - len(raw.lstrip(" "))
        if pending_obj is not None and pending_nested_list_key is not None and indent >= 6 and (
            stripped.startswith("- ") or stripped == "-"
        ):
            item_body = stripped[2:].strip() if stripped.startswith("- ") else ""
            if item_body:
                pending_obj[pending_nested_list_key].append(_coerce_scalar(item_body))
            continue
        if stripped.startswith("- ") or stripped == "-":
            if current_key is None:
                continue
            if current_list is None:
                current_list = []
                result[current_key] = current_list
            item_body = stripped[2:].strip() if stripped.startswith("- ") else ""
            match = re.match(r"^([A-Za-z_][A-Za-z0-9_-]*):\s+(.+)$", item_body)
            if match and not item_body.startswith(('"', "'")):
                obj = {match.group(1): _coerce_scalar(match.group(2).strip())}
                current_list.append(obj)
                pending_obj = obj
                pending_nested_list_key = None
            elif item_body:
                current_list.append(_coerce_scalar(item_body))
                pending_obj = None
                pending_nested_list_key = None
            else:
                pending_obj = {}
                current_list.append(pending_obj)
                pending_nested_list_key = None
            continue
        if pending_obj is not None and indent >= 2 and ":" in stripped:
            key, _, value = stripped.partition(":")
            if not value.strip():
                pending_obj[key.strip()] = []
                pending_nested_list_key = key.strip()
                continue
            pending_obj[key.strip()] = _coerce_scalar(value.strip())
            pending_nested_list_key = None
            continue
        if ":" in stripped and indent == 0:
            current_list = None
            pending_obj = None
            pending_nested_list_key = None
            key, _, value = stripped.partition(":")
            key = key.strip()
            value = value.strip()
            if "  #" in value:
                value = value[: value.index("  #")].strip()
            if not value:
                current_key = key
                continue
            if value == "[]":
                result[key] = []
                current_key = key
                continue
            result[key] = _coerce_scalar(value)
            current_key = key
    return result


def load_file(path: Path) -> dict[str, Any]:
    return load(path.read_text(encoding="utf-8"))
