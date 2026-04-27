import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { homedir } from "node:os";
import { basename, join, resolve } from "node:path";

export const CODEX_SESSION_SUMMARY_SCHEMA = "cautilus.codex_session_summary.v1";

export function summarizeCodexSessionLogText(text, { inputPath = null, sessionId = null } = {}) {
	const events = [];
	const messages = [];
	const toolCalls = [];
	const commandOutputs = [];
	const looseCommands = [];
	const parseErrors = [];
	const pendingCalls = new Map();
	for (const [index, line] of text.split(/\r?\n/).entries()) {
		const parsed = parseSessionLine(line, index);
		if (parsed.skip) {
			continue;
		}
		if (parsed.error) {
			parseErrors.push(parsed.error);
			continue;
		}
		const event = parsed.event;
		const record = collectCodexEvent(event, index);
		events.push(record);
		collectRecordSignals(record, { messages, toolCalls, commandOutputs, pendingCalls });
		collectLooseTopLevelSignals(event, index, record.timestamp, { looseCommands, messages, toolCalls });
	}
	const assistantMessages = messages.filter((message) => message.role === "assistant");
	const userMessages = messages.filter((message) => message.role === "user");
	const commands = unique([
		...toolCalls.map((call) => call.command).filter(Boolean),
		...collectFallbackCommands(events),
		...looseCommands,
	]);
	return {
		schemaVersion: CODEX_SESSION_SUMMARY_SCHEMA,
		sessionId: sessionId ?? inferSessionID(inputPath),
		inputPath,
		eventCount: events.length,
		messageCount: messages.length,
		toolCallCount: toolCalls.length,
		commandOutputCount: commandOutputs.length,
		commandCount: commands.length,
		parseErrors,
		userMessages,
		assistantMessages,
		messages,
		toolCalls,
		commandOutputs,
		commands,
		commits: extractCommitSignals(commandOutputs),
		warnings: buildSummaryWarnings({ parseErrors, toolCalls, commandOutputs }),
	};
}

function parseSessionLine(line, index) {
	const trimmed = line.trim();
	if (!trimmed) {
		return { skip: true };
	}
	try {
		return { event: JSON.parse(trimmed) };
	} catch (error) {
		return { error: { line: index + 1, error: error.message } };
	}
}

function collectRecordSignals(record, { messages, toolCalls, commandOutputs, pendingCalls }) {
	if (record.message) {
		messages.push(record.message);
	}
	if (record.toolCall) {
		toolCalls.push(record.toolCall);
		if (record.toolCall.callId) {
			pendingCalls.set(record.toolCall.callId, record.toolCall);
		}
	}
	if (record.commandOutput) {
		commandOutputs.push({
			...record.commandOutput,
			toolCall: record.commandOutput.callId ? pendingCalls.get(record.commandOutput.callId) ?? null : null,
		});
	}
}

function collectLooseTopLevelSignals(event, index, timestamp, { looseCommands, messages, toolCalls }) {
	if (event.type === "response_item" || event.type === "turn_context") {
		return;
	}
	const claude = collectClaudeSignals(event, index, timestamp);
	messages.push(...claude.messages);
	toolCalls.push(...claude.toolCalls);
	const loose = collectLooseSignals(event, index, timestamp);
	looseCommands.push(...loose.commands);
	messages.push(...loose.messages);
	toolCalls.push(...loose.toolCalls);
}

export function summarizeCodexSessionLogFile(inputPath, options = {}) {
	const resolved = resolve(inputPath);
	return summarizeCodexSessionLogText(readFileSync(resolved, "utf-8"), {
		...options,
		inputPath: resolved,
	});
}

export function findCodexSessionLog(sessionId, { root = join(homedir(), ".codex", "sessions") } = {}) {
	if (!sessionId || !sessionId.trim()) {
		throw new Error("--session-id requires a non-empty value");
	}
	const matches = [];
	for (const path of walkFiles(root)) {
		if (basename(path).includes(sessionId) && path.endsWith(".jsonl")) {
			matches.push(path);
		}
	}
	if (matches.length === 0) {
		throw new Error(`Codex session log not found for session id: ${sessionId}`);
	}
	matches.sort();
	return matches[matches.length - 1];
}

function collectCodexEvent(event, index) {
	const payload = responsePayload(event);
	const responseType = responsePayloadType(payload);
	const timestamp = eventTimestamp(event);
	const record = {
		index,
		timestamp,
		type: eventType(event),
		responseType: stringOrNull(responseType),
		rawType: stringOrNull(responseType) ?? eventType(event),
	};
	return attachResponseRecord(record, payload, responseType, index, timestamp);
}

function attachResponseRecord(record, payload, responseType, index, timestamp) {
	switch (responseType) {
		case "message":
			record.message = collectResponseMessage(payload, index, timestamp);
			break;
		case "function_call":
			record.toolCall = collectResponseToolCall(payload, index, timestamp);
			break;
		case "function_call_output":
			record.commandOutput = collectResponseToolOutput(payload, index, timestamp);
			break;
	}
	return record;
}

function responsePayload(event) {
	if (!event || typeof event !== "object") {
		return null;
	}
	return event.payload ?? null;
}

function responsePayloadType(payload) {
	if (!payload || typeof payload !== "object") {
		return null;
	}
	return payload.type;
}

function eventTimestamp(event) {
	return stringOrNull(event?.timestamp) ?? stringOrNull(event?.ts);
}

function eventType(event) {
	return stringOrNull(event?.type);
}

function collectResponseMessage(payload, index, timestamp) {
	return {
		index,
		timestamp,
		role: stringOrNull(payload.role) ?? "unknown",
		text: contentText(payload.content),
	};
}

function collectResponseToolCall(payload, index, timestamp) {
	const parsedArguments = parseArguments(payload.arguments);
	return {
		index,
		timestamp,
		callId: stringOrNull(payload.call_id) ?? stringOrNull(payload.id),
		name: stringOrNull(payload.name) ?? "unknown",
		arguments: payload.arguments ?? null,
		parsedArguments,
		command: commandFromArguments(parsedArguments),
		workdir: stringOrNull(parsedArguments?.workdir),
	};
}

function collectResponseToolOutput(payload, index, timestamp) {
	const output = typeof payload.output === "string" ? payload.output : "";
	return {
		index,
		timestamp,
		callId: stringOrNull(payload.call_id),
		exitCode: extractExitCode(output),
		outputPreview: preview(output),
		output,
	};
}

function contentText(content) {
	if (typeof content === "string") {
		return content;
	}
	if (!Array.isArray(content)) {
		return "";
	}
	return content
		.map((item) => {
			if (typeof item === "string") {
				return item;
			}
			if (!item || typeof item !== "object") {
				return "";
			}
			return item.text ?? item.content ?? "";
		})
		.filter(Boolean)
		.join("\n");
}

function parseArguments(raw) {
	if (!raw || typeof raw !== "string") {
		return raw && typeof raw === "object" ? raw : null;
	}
	try {
		return JSON.parse(raw);
	} catch {
		return null;
	}
}

function commandFromArguments(args) {
	if (!args || typeof args !== "object") {
		return "";
	}
	return stringOrNull(args.cmd) ?? stringOrNull(args.command) ?? "";
}

function collectFallbackCommands(events) {
	const commands = [];
	for (const event of events) {
		if (event.toolCall?.command) {
			commands.push(event.toolCall.command);
		}
	}
	return commands;
}

function collectLooseSignals(value, index, timestamp) {
	const result = { commands: [], messages: [], toolCalls: [] };
	collectLooseSignalsFromValue(value, result, index, timestamp);
	return result;
}

function collectLooseSignalsFromValue(value, result, index, timestamp) {
	if (value == null) {
		return;
	}
	if (Array.isArray(value)) {
		for (const item of value) {
			collectLooseSignalsFromValue(item, result, index, timestamp);
		}
		return;
	}
	if (typeof value !== "object") {
		return;
	}
	const type = stringOrNull(value.type) ?? "";
	collectLooseCommand(value, type, result);
	collectLooseMessage(value, type, result, index, timestamp);
	collectLooseToolCall(value, type, result, index, timestamp);
	for (const [key, child] of Object.entries(value)) {
		if (key === "payload") {
			continue;
		}
		collectLooseSignalsFromValue(child, result, index, timestamp);
	}
}

function collectLooseCommand(value, type, result) {
	const command = commandText(value.command);
	if (command && /command|exec|shell/.test(type)) {
		result.commands.push(command);
	}
	if (typeof value.cmd === "string") {
		result.commands.push(value.cmd);
	}
}

function collectLooseMessage(value, type, result, index, timestamp) {
	const messageText = stringOrNull(value.text) ?? stringOrNull(value.message);
	if (!messageText || !/agent_message|assistant|message|response/.test(type) || type === "response_item") {
		return;
	}
	result.messages.push({ index, timestamp, role: type === "agent_message" ? "assistant" : "unknown", text: messageText });
}

function collectLooseToolCall(value, type, result, index, timestamp) {
	const name = stringOrNull(value.name) ?? stringOrNull(value.tool_name);
	if (!name || !/function_call|tool_call|tool/.test(type) || type === "response_item") {
		return;
	}
	const parsedArguments = value.input ?? value.arguments ?? value.args ?? null;
	result.toolCalls.push({
		index,
		timestamp,
		callId: stringOrNull(value.call_id) ?? stringOrNull(value.id),
		name,
		arguments: value.arguments ?? value.args ?? value.input ?? null,
		parsedArguments,
		command: commandFromArguments(parsedArguments),
		workdir: null,
	});
}

function collectClaudeSignals(event, index, timestamp) {
	const result = { messages: [], toolCalls: [] };
	const message = claudeMessage(event);
	if (!message) {
		return result;
	}
	const role = stringOrNull(message.role);
	const text = contentText(message.content);
	if ((role === "assistant" || role === "user") && text) {
		result.messages.push({ index, timestamp, role, text });
	}
	result.toolCalls.push(...claudeToolCalls(message.content, index, timestamp));
	return result;
}

function claudeMessage(event) {
	if (!event || typeof event !== "object") {
		return null;
	}
	if (event.message && typeof event.message === "object") {
		return event.message;
	}
	if (event.type === "result" && typeof event.result === "string" && event.result.trim()) {
		return { role: "assistant", content: event.result };
	}
	return null;
}

function claudeToolCalls(content, index, timestamp) {
	if (!Array.isArray(content)) {
		return [];
	}
	return content
		.filter((item) => item && typeof item === "object" && item.type === "tool_use")
		.map((item) => {
			const parsedArguments = item.input ?? null;
			return {
				index,
				timestamp,
				callId: stringOrNull(item.id),
				name: stringOrNull(item.name) ?? "unknown",
				arguments: parsedArguments,
				parsedArguments,
				command: commandFromArguments(parsedArguments),
				workdir: null,
			};
		});
}

function extractExitCode(output) {
	const match = output.match(/Process exited with code (-?\d+)/);
	return match ? Number.parseInt(match[1], 10) : null;
}

function commandText(value) {
	if (typeof value === "string") {
		return value;
	}
	if (Array.isArray(value)) {
		return value.map((part) => String(part)).join(" ");
	}
	return "";
}

function extractCommitSignals(commandOutputs) {
	return commandOutputs.flatMap((output) => {
		const matches = [...output.output.matchAll(/\[([^\s\]]+)\s+([0-9a-f]{7,40})\]\s+(.+)/g)];
		return matches.map((match) => ({
			index: output.index,
			ref: match[1],
			commit: match[2],
			subject: match[3].trim(),
		}));
	});
}

function buildSummaryWarnings({ parseErrors, toolCalls, commandOutputs }) {
	const warnings = [];
	if (parseErrors.length > 0) {
		warnings.push({ id: "parse_errors", message: `${parseErrors.length} JSONL line(s) could not be parsed.` });
	}
	const missingOutputs = toolCalls.filter((call) => call.callId && !commandOutputs.some((output) => output.callId === call.callId));
	if (missingOutputs.length > 0) {
		warnings.push({ id: "missing_tool_outputs", message: `${missingOutputs.length} tool call(s) did not have a matching output in the log.` });
	}
	return warnings;
}

function walkFiles(root) {
	if (!existsSync(root)) {
		return [];
	}
	const out = [];
	const stack = [root];
	while (stack.length > 0) {
		const dir = stack.pop();
		for (const entry of readdirSync(dir, { withFileTypes: true })) {
			const path = join(dir, entry.name);
			if (entry.isDirectory()) {
				stack.push(path);
			} else if (entry.isFile()) {
				out.push(path);
			}
		}
	}
	return out.sort((left, right) => statSync(left).mtimeMs - statSync(right).mtimeMs);
}

function inferSessionID(inputPath) {
	if (!inputPath) {
		return null;
	}
	const match = basename(inputPath).match(/(019[0-9a-z-]+)\.jsonl$/);
	return match ? match[1] : null;
}

function preview(text, max = 1200) {
	if (text.length <= max) {
		return text;
	}
	return `${text.slice(0, max)}...`;
}

function stringOrNull(value) {
	return typeof value === "string" && value !== "" ? value : null;
}

function unique(values) {
	return [...new Set(values.map((value) => value.trim()).filter(Boolean))];
}
