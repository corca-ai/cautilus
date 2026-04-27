function expectationFindings(label, text, requiredFragments, forbiddenFragments) {
	if (text === null) {
		return [];
	}
	const normalized = text.toLowerCase();
	return [
		...missingFragments(label, normalized, requiredFragments),
		...includedFragments(label, normalized, forbiddenFragments),
	];
}

function missingFragments(label, normalizedText, fragments) {
	return (fragments ?? [])
		.filter((fragment) => !normalizedText.includes(fragment.toLowerCase()))
		.map((fragment) => `${label} missing required fragment: ${fragment}`);
}

function includedFragments(label, normalizedText, fragments) {
	return (fragments ?? [])
		.filter((fragment) => normalizedText.includes(fragment.toLowerCase()))
		.map((fragment) => `${label} included forbidden fragment: ${fragment}`);
}

function collectCommandString(key, entry, output) {
	if (key === "cmd" && typeof entry === "string") {
		output.push(entry);
		return true;
	}
	if (key === "command" && Array.isArray(entry)) {
		output.push(entry.join(" "));
		return true;
	}
	if (key === "command" && typeof entry === "string") {
		output.push(entry);
		return true;
	}
	if (key === "arguments" && typeof entry === "string") {
		collectFunctionArguments(entry, output);
		return true;
	}
	return false;
}

function collectFunctionArguments(entry, output) {
	try {
		collectCommandStrings(JSON.parse(entry), output);
	} catch {
		// Function-call arguments that are not JSON are still useful command evidence.
		output.push(entry);
	}
}

function collectCommandStrings(value, output) {
	if (Array.isArray(value)) {
		value.forEach((entry) => collectCommandStrings(entry, output));
		return;
	}
	if (!value || typeof value !== "object") {
		return;
	}
	for (const [key, entry] of Object.entries(value)) {
		if (!collectCommandString(key, entry, output)) {
			collectCommandStrings(entry, output);
		}
	}
}

export function extractCodexCommandText(stdout) {
	const commands = [];
	for (const line of String(stdout ?? "").split("\n")) {
		if (!line.trim()) {
			continue;
		}
		try {
			collectCommandStrings(JSON.parse(line), commands);
		} catch {
			// Ignore non-JSON progress lines from older Codex builds.
		}
	}
	return commands.join("\n");
}

export function applyObservationExpectations(testCase, result, commandText) {
	const findings = [
		...expectationFindings("summary", result.summary, testCase.requiredSummaryFragments, testCase.forbiddenSummaryFragments),
		...expectationFindings("command log", commandText, testCase.requiredCommandFragments, testCase.forbiddenCommandFragments),
	];
	if (findings.length === 0) {
		return result;
	}
	const summary = `${result.summary} Expectation failure: ${findings.join("; ")}.`;
	if (testCase.evaluationKind === "trigger") {
		return { ...result, invoked: false, summary };
	}
	return { ...result, outcome: "failed", summary };
}
