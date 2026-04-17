import { existsSync, lstatSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import process from "node:process";

function assertObject(value, field) {
	if (!value || typeof value !== "object" || Array.isArray(value)) {
		throw new Error(`${field} must be an object`);
	}
	return value;
}

function assertString(value, field) {
	if (typeof value !== "string" || !value.trim()) {
		throw new Error(`${field} must be a non-empty string`);
	}
	return value;
}

function nullableString(value, field) {
	if (value === undefined) {
		return undefined;
	}
	if (value === null) {
		return null;
	}
	return assertString(value, field);
}

export function artifactRef(kind, path) {
	return { kind, path };
}

export function sampleDir(caseDir, sampleIndex, repeatCount) {
	if (repeatCount <= 1) {
		return caseDir;
	}
	return join(caseDir, `sample-${sampleIndex + 1}`);
}

export function normalizeRoutingDecision(value, field = "observed.routingDecision") {
	if (value === undefined || value === null) {
		return {
			selectedSkill: null,
			selectedSupport: null,
			firstToolCall: null,
			reasonSummary: null,
		};
	}
	const record = assertObject(value, field);
	return {
		selectedSkill: nullableString(record.selectedSkill, `${field}.selectedSkill`) ?? null,
		selectedSupport: nullableString(record.selectedSupport, `${field}.selectedSupport`) ?? null,
		firstToolCall: nullableString(record.firstToolCall, `${field}.firstToolCall`) ?? null,
		reasonSummary: nullableString(record.reasonSummary, `${field}.reasonSummary`) ?? null,
	};
}

export function backendFailureResult(testCase, message, durationMs, artifactRefs) {
	const result = {
		invoked: false,
		summary: message,
		routingDecision: {
			selectedSkill: null,
			selectedSupport: null,
			firstToolCall: null,
			reasonSummary: message,
		},
		metrics: {
			duration_ms: durationMs,
		},
		artifactRefs,
	};
	if (testCase.evaluationKind === "trigger") {
		result.expectedTrigger = testCase.expectedTrigger;
	}
	if (testCase.evaluationKind === "execution") {
		result.outcome = "blocked";
		result.blockerKind = "runner_execution_failed";
		if (testCase.thresholds) {
			result.thresholds = testCase.thresholds;
		}
	}
	return result;
}

function safeWorkspacePath(workspace, relativePath) {
	if (typeof relativePath !== "string" || !relativePath.trim()) {
		throw new Error("instruction surface file path must be a non-empty string");
	}
	const resolved = resolve(workspace, relativePath);
	const workspaceRoot = `${resolve(workspace)}${process.platform === "win32" ? "\\" : "/"}`;
	if (resolved !== resolve(workspace) && !resolved.startsWith(workspaceRoot)) {
		throw new Error(`instruction surface path escapes workspace: ${relativePath}`);
	}
	return resolved;
}

function copyInstructionArtifact(outputDir, relativePath, content) {
	const artifactPath = join(outputDir, "instruction-surface", relativePath);
	mkdirSync(dirname(artifactPath), { recursive: true });
	writeFileSync(artifactPath, content, "utf-8");
	return artifactPath;
}

function captureDefaultInstructionSurface(workspace, outputDir) {
	const defaultFilePath = join(workspace, "AGENTS.md");
	const files = [];
	const artifactRefs = [];
	if (existsSync(defaultFilePath) && !lstatSync(defaultFilePath).isDirectory()) {
		const content = readFileSync(defaultFilePath, "utf-8");
		const artifactPath = copyInstructionArtifact(outputDir, "AGENTS.md", content);
		files.push({
			path: "AGENTS.md",
			sourceKind: "workspace_default",
			artifactPath,
		});
		artifactRefs.push(artifactRef("instruction_surface", artifactPath));
	}
	return {
		instructionSurface: {
			surfaceLabel: "workspace_checked_in",
			files,
		},
		artifactRefs,
		restore() {},
	};
}

function snapshotWorkspaceFile(workspacePath, relativePath) {
	const currentExists = existsSync(workspacePath);
	if (!currentExists) {
		return { workspacePath, existed: false };
	}
	const stat = lstatSync(workspacePath);
	if (stat.isDirectory()) {
		throw new Error(`instruction surface file path points to a directory: ${relativePath}`);
	}
	return {
		workspacePath,
		existed: true,
		content: readFileSync(workspacePath),
	};
}

function resolveInstructionContent(casesFile, file) {
	if (file.content) {
		return {
			content: file.content,
			sourceKind: "inline",
			sourceFile: null,
		};
	}
	return {
		content: readFileSync(resolve(dirname(casesFile), file.sourceFile), "utf-8"),
		sourceKind: "source_file",
		sourceFile: resolve(dirname(casesFile), file.sourceFile),
	};
}

export function materializeInstructionSurface(options, testCase, outputDir) {
	if (!testCase.instructionSurface) {
		return captureDefaultInstructionSurface(options.workspace, outputDir);
	}
	const backups = [];
	const files = [];
	const artifactRefs = [];
	for (const file of testCase.instructionSurface.files) {
		const workspacePath = safeWorkspacePath(options.workspace, file.path);
		backups.push(snapshotWorkspaceFile(workspacePath, file.path));
		const resolved = resolveInstructionContent(options.casesFile, file);
		mkdirSync(dirname(workspacePath), { recursive: true });
		writeFileSync(workspacePath, resolved.content, "utf-8");
		const artifactPath = copyInstructionArtifact(outputDir, file.path, resolved.content);
		files.push({
			path: file.path,
			sourceKind: resolved.sourceKind,
			...(resolved.sourceFile ? { sourceFile: resolved.sourceFile } : {}),
			artifactPath,
		});
		artifactRefs.push(artifactRef("instruction_surface", artifactPath));
		if (resolved.sourceFile) {
			artifactRefs.push(artifactRef("instruction_surface_source", resolved.sourceFile));
		}
	}
	return {
		instructionSurface: {
			surfaceLabel: testCase.instructionSurface.surfaceLabel,
			files,
		},
		artifactRefs,
		restore() {
			for (const backup of backups.reverse()) {
				if (backup.existed) {
					writeFileSync(backup.workspacePath, backup.content);
					continue;
				}
				rmSync(backup.workspacePath, { force: true });
			}
		},
	};
}

function routingConsensusValue(values) {
	if (values.length === 0) {
		return null;
	}
	const counts = new Map();
	for (const value of values) {
		const key = value ?? "__none__";
		counts.set(key, (counts.get(key) ?? 0) + 1);
	}
	const ranked = [...counts.entries()].sort((left, right) => right[1] - left[1]);
	if (ranked.length > 1 && ranked[0][1] === ranked[1][1]) {
		return null;
	}
	return ranked[0][0] === "__none__" ? null : ranked[0][0];
}

export function aggregateRoutingDecision(sampleResults) {
	const decisions = sampleResults.map((result) => result.routingDecision ?? normalizeRoutingDecision(null));
	const canonical = (decision) => JSON.stringify({
		selectedSkill: decision.selectedSkill,
		selectedSupport: decision.selectedSupport,
		firstToolCall: decision.firstToolCall,
	});
	const stable = decisions.every((decision) => canonical(decision) === canonical(decisions[0]));
	return {
		selectedSkill: routingConsensusValue(decisions.map((decision) => decision.selectedSkill)),
		selectedSupport: routingConsensusValue(decisions.map((decision) => decision.selectedSupport)),
		firstToolCall: routingConsensusValue(decisions.map((decision) => decision.firstToolCall)),
		reasonSummary: stable
			? decisions[0]?.reasonSummary ?? null
			: `Routing was mixed across ${sampleResults.length} run(s).`,
	};
}

export function aggregateMetrics(results) {
	const aggregates = {};
	for (const metricKey of ["duration_ms", "total_tokens", "cost_usd"]) {
		const values = results
			.map((result) => Number(result?.metrics?.[metricKey]))
			.filter((value) => Number.isFinite(value));
		if (values.length === 0) {
			continue;
		}
		const sorted = [...values].sort((left, right) => left - right);
		const mid = Math.floor(sorted.length / 2);
		const value = sorted.length % 2 === 1 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
		aggregates[metricKey] = metricKey === "cost_usd" ? value : Math.round(value);
	}
	return Object.keys(aggregates).length > 0 ? aggregates : null;
}

export function summarizeStatusCounts(statusCounts) {
	return ["passed", "degraded", "blocked", "failed"]
		.filter((status) => Number(statusCounts[status] ?? 0) > 0)
		.map((status) => `${status}=${statusCounts[status]}`)
		.join(", ");
}

export function writeAggregateArtifact(caseDir, payload) {
	const aggregateFile = join(caseDir, "aggregate.json");
	writeFileSync(aggregateFile, `${JSON.stringify(payload, null, 2)}\n`);
	return aggregateFile;
}
