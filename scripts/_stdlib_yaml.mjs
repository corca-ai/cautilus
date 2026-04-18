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

function stripInlineComment(stripped) {
	if (!stripped.includes("  #")) {
		return stripped;
	}
	return stripped.slice(0, stripped.indexOf("  #")).trimEnd();
}

function prepareLines(text) {
	return inlineBlockScalars(text)
		.split(/\r?\n/u)
		.map((raw) => {
			const stripped = stripInlineComment(raw.trim());
			return {
				raw,
				stripped,
				indent: raw.length - raw.trimStart().length,
			};
		});
}

function skipIgnorable(lines, index) {
	let current = index;
	while (current < lines.length) {
		const stripped = lines[current].stripped;
		if (!stripped || stripped.startsWith("#")) {
			current += 1;
			continue;
		}
		break;
	}
	return current;
}

function parseScalar(value) {
	if (value === "[]") {
		return [];
	}
	if (value === "{}") {
		return {};
	}
	return coerceScalar(value);
}

function splitKeyValue(stripped) {
	const separator = stripped.indexOf(":");
	if (separator === -1) {
		return null;
	}
	return {
		key: stripped.slice(0, separator).trim(),
		value: stripped.slice(separator + 1).trim(),
	};
}

function parseNode(lines, index, indent) {
	const current = skipIgnorable(lines, index);
	if (current >= lines.length || lines[current].indent < indent) {
		return { value: null, index: current };
	}
	if (isListLine(lines[current].stripped)) {
		return parseArray(lines, current, indent);
	}
	return parseObject(lines, current, indent);
}

function shouldStopObjectParse(line, indent) {
	return line.indent < indent || line.indent !== indent || isListLine(line.stripped);
}

function parseObjectEntry(result, lines, current, indent) {
	const line = lines[current];
	if (shouldStopObjectParse(line, indent)) {
		return { stop: true, current };
	}
	const pair = splitKeyValue(line.stripped);
	if (!pair) {
		return { stop: true, current };
	}
	current += 1;
	if (pair.value) {
		result[pair.key] = parseScalar(pair.value);
		return { stop: false, current };
	}
	const next = skipIgnorable(lines, current);
	if (next >= lines.length || lines[next].indent <= indent) {
		result[pair.key] = null;
		return { stop: false, current: next };
	}
	const parsed = parseNode(lines, next, lines[next].indent);
	result[pair.key] = parsed.value;
	return { stop: false, current: parsed.index };
}

function parseObject(lines, index, indent) {
	const result = {};
	let current = index;
	while (current < lines.length) {
		current = skipIgnorable(lines, current);
		if (current >= lines.length) {
			break;
		}
		const parsedEntry = parseObjectEntry(result, lines, current, indent);
		if (parsedEntry.stop) {
			break;
		}
		current = parsedEntry.current;
	}
	return { value: result, index: current };
}

function shouldStopArrayParse(line, indent) {
	return line.indent < indent || line.indent !== indent || !isListLine(line.stripped);
}

function parseNestedArrayItem(lines, current, indent) {
	const next = skipIgnorable(lines, current);
	if (next >= lines.length || lines[next].indent <= indent) {
		return { value: null, current: next };
	}
	const parsed = parseNode(lines, next, lines[next].indent);
	return { value: parsed.value, current: parsed.index };
}

function parseArrayMapValue(lines, current, indent) {
	const next = skipIgnorable(lines, current);
	if (next >= lines.length || lines[next].indent <= indent) {
		return { value: null, current: next };
	}
	const parsed = parseNode(lines, next, lines[next].indent);
	return { value: parsed.value, current: parsed.index };
}

function mergeFollowingObject(item, lines, current, indent) {
	const next = skipIgnorable(lines, current);
	if (next >= lines.length || lines[next].indent <= indent || isListLine(lines[next].stripped)) {
		return { value: item, current };
	}
	const parsed = parseObject(lines, next, lines[next].indent);
	return {
		value: { ...item, ...parsed.value },
		current: parsed.index,
	};
}

function parseArrayKeyValueItem(pair, lines, current, indent) {
	const item = {};
	if (pair.value) {
		item[pair.key] = parseScalar(pair.value);
		return mergeFollowingObject(item, lines, current, indent);
	}
	const parsedValue = parseArrayMapValue(lines, current, indent);
	item[pair.key] = parsedValue.value;
	return mergeFollowingObject(item, lines, parsedValue.current, indent);
}

function parseArrayItem(body, lines, current, indent) {
	if (!body) {
		return parseNestedArrayItem(lines, current, indent);
	}
	const pair = splitKeyValue(body);
	if (pair && !body.startsWith("\"") && !body.startsWith("'")) {
		return parseArrayKeyValueItem(pair, lines, current, indent);
	}
	return { value: parseScalar(body), current };
}

function parseArray(lines, index, indent) {
	const result = [];
	let current = index;
	while (current < lines.length) {
		current = skipIgnorable(lines, current);
		if (current >= lines.length) {
			break;
		}
		const line = lines[current];
		if (shouldStopArrayParse(line, indent)) {
			break;
		}
		const body = listItemBody(line.stripped);
		current += 1;
		const parsedItem = parseArrayItem(body, lines, current, indent);
		result.push(parsedItem.value);
		current = parsedItem.current;
	}
	return { value: result, index: current };
}

export function load(text) {
	const lines = prepareLines(text);
	const start = skipIgnorable(lines, 0);
	if (start >= lines.length) {
		return {};
	}
	return parseNode(lines, start, lines[start].indent).value ?? {};
}

export function loadFile(path) {
	return load(readFileSync(path, "utf-8"));
}
