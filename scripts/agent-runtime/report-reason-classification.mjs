import { existsSync, readFileSync } from "node:fs";

const EXPLICIT_PROVIDER_RATE_LIMIT_PATTERNS = [
	/rate limit/i,
	/rate_limit/i,
	/too many requests/i,
	/tokens per min/i,
	/requests per min/i,
];
const HTTP_429_CONTEXT_PATTERN = /\b(http|status|statuscode|error|errorcode|code|response|retry[-_]after)\b/i;
const STANDALONE_429_PATTERN = /\b429\b/;

function isProviderRateLimitLine(line) {
	if (EXPLICIT_PROVIDER_RATE_LIMIT_PATTERNS.some((pattern) => pattern.test(line))) {
		return true;
	}
	if (!STANDALONE_429_PATTERN.test(line)) {
		return false;
	}
	return HTTP_429_CONTEXT_PATTERN.test(line);
}

function uniqueStrings(values) {
	return Array.from(new Set(values.filter((value) => typeof value === "string" && value.length > 0)));
}

function firstMatchingLine(text) {
	const lines = String(text).split(/\r?\n/);
	for (const rawLine of lines) {
		const line = rawLine.trim();
		if (!line) {
			continue;
		}
		if (isProviderRateLimitLine(line)) {
			return line;
		}
	}
	return null;
}

function readArtifactSignal(path) {
	if (typeof path !== "string" || path.length === 0 || !existsSync(path)) {
		return null;
	}
	try {
		const text = readFileSync(path, "utf-8");
		const line = firstMatchingLine(text);
		if (!line) {
			return null;
		}
		return {
			path,
			excerpt: line,
		};
	} catch {
		return null;
	}
}

function collectObservationArtifactPaths(mode, commandObservations) {
	return commandObservations
		.filter((observation) => observation.stage === mode)
		.flatMap((observation) => ["stdoutFile", "stderrFile"]
			.map((field) => observation[field])
			.filter((path) => typeof path === "string" && path.length > 0));
}

function collectCompareArtifactPaths(modeRun) {
	return (modeRun.scenarioResults?.compareArtifact?.artifactPaths || [])
		.filter((path) => typeof path === "string" && path.length > 0);
}

function collectModeArtifactPaths(mode, modeRun, commandObservations) {
	return uniqueStrings([
		...collectObservationArtifactPaths(mode, commandObservations),
		...collectCompareArtifactPaths(modeRun),
	]);
}

function buildRateLimitWarning(mode, modeRun, commandObservations) {
	const artifactPaths = collectModeArtifactPaths(mode, modeRun, commandObservations);
	const signals = artifactPaths
		.map((path) => readArtifactSignal(path))
		.filter(Boolean);
	if (signals.length === 0) {
		return null;
	}
	return {
		code: "provider_rate_limit_contamination",
		category: "runtime_provider_contamination",
		mode,
		summary: `${mode} evidence may be contaminated by provider rate limits (${signals.length} matching artifact${signals.length === 1 ? "" : "s"}).`,
		signalCount: signals.length,
		artifactPaths: signals.map((signal) => signal.path),
		excerpts: signals.slice(0, 3).map((signal) => signal.excerpt),
	};
}

function baseReasonCodes(status) {
	switch (status) {
		case "rejected":
			return ["behavior_regression"];
		case "failed":
			return ["infrastructure_failure"];
		default:
			return [];
	}
}

export function classifyModeSummary(modeSummary, modeRun, commandObservations) {
	const warnings = [];
	const reasonCodes = [...baseReasonCodes(modeSummary.status)];
	const rateLimitWarning = buildRateLimitWarning(modeSummary.mode, modeRun, commandObservations);
	if (rateLimitWarning) {
		warnings.push(rateLimitWarning);
		reasonCodes.push(rateLimitWarning.code);
	}
	return {
		reasonCodes: uniqueStrings(reasonCodes),
		warnings,
	};
}

export function summarizeReportReasons(modeSummaries) {
	const reasonCodes = uniqueStrings(modeSummaries.flatMap((entry) => entry.reasonCodes || []));
	const warnings = modeSummaries.flatMap((entry) => entry.warnings || []);
	return {
		reasonCodes,
		warnings,
	};
}
