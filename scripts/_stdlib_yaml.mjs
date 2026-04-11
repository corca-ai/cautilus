import { readFileSync } from "node:fs";

function coerceScalar(value) {
	if (value === "") {
		return "";
	}
	const lower = value.toLowerCase();
	if (lower === "true") {
		return true;
	}
	if (lower === "false") {
		return false;
	}
	if (lower === "null" || lower === "~") {
		return null;
	}
	if (/^-?\d+$/.test(value)) {
		return Number.parseInt(value, 10);
	}
	if (/^-?(?:\d+\.\d*|\d*\.\d+)$/.test(value)) {
		return Number.parseFloat(value);
	}
	if (
		(value.startsWith("\"") && value.endsWith("\"")) ||
		(value.startsWith("'") && value.endsWith("'"))
	) {
		return value.slice(1, -1);
	}
	return value;
}

function trimTrailingEmptyLines(lines) {
	const trimmed = [...lines];
	while (trimmed.length > 0 && trimmed.at(-1) === "") {
		trimmed.pop();
	}
	return trimmed;
}

function foldBlockScalarLines(contentLines) {
	const parts = [];
	let buffer = [];
	for (const content of contentLines) {
		if (content === "") {
			if (buffer.length > 0) {
				parts.push(buffer.join(" "));
				buffer = [];
			}
			continue;
		}
		buffer.push(content);
	}
	if (buffer.length > 0) {
		parts.push(buffer.join(" "));
	}
	return parts.join(" ");
}

function blockScalarContent(lines, startIndex, keyIndent) {
	const contentLines = [];
	let contentIndent = null;
	let index = startIndex;
	for (; index < lines.length; index += 1) {
		const current = lines[index];
		if (current.trim() === "") {
			contentLines.push("");
			continue;
		}
		const currentIndent = current.length - current.trimStart().length;
		if (currentIndent <= keyIndent) {
			break;
		}
		if (contentIndent === null) {
			contentIndent = currentIndent;
		}
		contentLines.push(current.slice(contentIndent));
	}
	return {
		contentLines: trimTrailingEmptyLines(contentLines),
		nextIndex: index,
	};
}

function blockScalarText(marker, contentLines) {
	return marker === ">" ? foldBlockScalarLines(contentLines) : contentLines.join("\n");
}

function escapeQuotedScalar(text) {
	return text
		.replaceAll("\\", "\\\\")
		.replaceAll("\"", "\\\"")
		.replaceAll("\n", "\\n");
}

function inlineBlockScalars(text) {
	const lines = text.split(/\r?\n/u);
	const out = [];
	const pattern =
		/^(?<indent>\s*)(?<prefix>(?:- )?)(?<key>[A-Za-z_][A-Za-z0-9_-]*):\s*(?<marker>[>|])\s*$/u;

	for (let index = 0; index < lines.length; index += 1) {
		const line = lines[index];
		const match = pattern.exec(line);
		if (!match?.groups) {
			out.push(line);
			continue;
		}
		const { contentLines, nextIndex } = blockScalarContent(lines, index + 1, match.groups.indent.length);
		const escaped = escapeQuotedScalar(blockScalarText(match.groups.marker, contentLines));
		out.push(`${match.groups.indent}${match.groups.prefix}${match.groups.key}: "${escaped}"`);
		index = nextIndex - 1;
	}

	return out.join("\n");
}

function isListLine(stripped) {
	return stripped.startsWith("- ") || stripped === "-";
}

function listItemBody(stripped) {
	return stripped.startsWith("- ") ? stripped.slice(2).trim() : "";
}

function resetPendingState(state) {
	state.pendingObject = null;
	state.pendingNestedListKey = null;
}

function consumeNestedListItem(state, stripped, indent) {
	if (
		state.pendingObject === null ||
		state.pendingNestedListKey === null ||
		indent < 6 ||
		!isListLine(stripped)
	) {
		return false;
	}
	const itemBody = listItemBody(stripped);
	if (itemBody) {
		state.pendingObject[state.pendingNestedListKey].push(coerceScalar(itemBody));
	}
	return true;
}

function ensureCurrentList(state) {
	if (state.currentList === null) {
		state.currentList = [];
		state.result[state.currentKey] = state.currentList;
	}
	return state.currentList;
}

function consumeListItem(state, stripped) {
	if (!isListLine(stripped) || state.currentKey === null) {
		return false;
	}
	const currentList = ensureCurrentList(state);
	const itemBody = listItemBody(stripped);
	const match = /^([A-Za-z_][A-Za-z0-9_-]*):\s+(.+)$/u.exec(itemBody);
	if (match && !itemBody.startsWith("\"") && !itemBody.startsWith("'")) {
		const obj = { [match[1]]: coerceScalar(match[2].trim()) };
		currentList.push(obj);
		state.pendingObject = obj;
		state.pendingNestedListKey = null;
		return true;
	}
	if (itemBody) {
		currentList.push(coerceScalar(itemBody));
		resetPendingState(state);
		return true;
	}
	state.pendingObject = {};
	currentList.push(state.pendingObject);
	state.pendingNestedListKey = null;
	return true;
}

function consumePendingObjectField(state, stripped, indent) {
	if (state.pendingObject === null || indent < 2 || !stripped.includes(":")) {
		return false;
	}
	const [rawKey, ...rest] = stripped.split(":");
	const key = rawKey.trim();
	const value = rest.join(":").trim();
	if (!value) {
		state.pendingObject[key] = [];
		state.pendingNestedListKey = key;
		return true;
	}
	state.pendingObject[key] = coerceScalar(value);
	state.pendingNestedListKey = null;
	return true;
}

function topLevelValue(stripped) {
	const [rawKey, ...rest] = stripped.split(":");
	let value = rest.join(":").trim();
	if (value.includes("  #")) {
		value = value.slice(0, value.indexOf("  #")).trim();
	}
	return {
		key: rawKey.trim(),
		value,
	};
}

function consumeTopLevelEntry(state, stripped, indent) {
	if (indent !== 0 || !stripped.includes(":")) {
		return false;
	}
	state.currentList = null;
	resetPendingState(state);
	const { key, value } = topLevelValue(stripped);
	state.currentKey = key;
	if (!value) {
		return true;
	}
	state.result[key] = value === "[]" ? [] : coerceScalar(value);
	return true;
}

export function load(text) {
	const normalized = inlineBlockScalars(text);
	const state = {
		result: {},
		currentKey: null,
		currentList: null,
		pendingObject: null,
		pendingNestedListKey: null,
	};

	for (const raw of normalized.split(/\r?\n/u)) {
		const stripped = raw.trim();
		if (!stripped || stripped.startsWith("#")) {
			continue;
		}
		const indent = raw.length - raw.trimStart().length;
		if (consumeNestedListItem(state, stripped, indent)) {
			continue;
		}
		if (consumeListItem(state, stripped)) {
			continue;
		}
		if (consumePendingObjectField(state, stripped, indent)) {
			continue;
		}
		consumeTopLevelEntry(state, stripped, indent);
	}

	return state.result;
}

export function loadFile(path) {
	return load(readFileSync(path, "utf-8"));
}
