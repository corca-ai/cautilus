import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { spawnSync } from "node:child_process";
import process from "node:process";

import { auditRefreshFlowLogText } from "./audit-cautilus-refresh-flow-log.mjs";
import { auditFirstScanFlowLogText } from "./audit-cautilus-first-scan-flow-log.mjs";
import { auditReviewPrepareFlowLogText } from "./audit-cautilus-review-prepare-flow-log.mjs";
import { auditReviewerLaunchFlowLogText } from "./audit-cautilus-reviewer-launch-flow-log.mjs";
import { auditReviewToEvalFlowLogText } from "./audit-cautilus-review-to-eval-flow-log.mjs";
import { auditPacketFirstFlowLogText } from "./audit-cautilus-packet-first-flow-log.mjs";
import { applyObservationExpectations } from "./skill-test-expectations.mjs";
import { CLAUDE_CLI_ENV } from "./skill-test-claude-backend.mjs";

function renderTurnInput(options, testCase, turn) {
	if (!turn.injectSkill) {
		return turn.input;
	}
	const skillPath = join(options.workspace, ".agents", "skills", testCase.targetId, "SKILL.md");
	if (!existsSync(skillPath)) {
		return turn.input;
	}
	const skillBody = readFileSync(skillPath, "utf-8");
	return [
		turn.input,
		"",
		"<skill>",
		`<name>${testCase.targetId}</name>`,
		`<path>${skillPath}</path>`,
		skillBody,
		"</skill>",
	].join("\n");
}

function claudeEpisodeArgs(options, sessionId = null) {
	const args = [
		"-p",
		"--verbose",
		"--output-format", "stream-json",
		"--exclude-dynamic-system-prompt-sections",
	];
	if (sessionId) {
		args.push("--resume", sessionId);
	}
	if (options.claudeModel ?? options.model) {
		args.push("--model", options.claudeModel ?? options.model);
	}
	if (options.claudePermissionMode) {
		args.push("--permission-mode", options.claudePermissionMode);
	}
	if (options.claudeAllowedTools) {
		args.push("--allowedTools", options.claudeAllowedTools);
	}
	return args;
}

function extractSessionId(jsonlText) {
	for (const line of String(jsonlText ?? "").split(/\r?\n/)) {
		if (!line.trim()) {
			continue;
		}
		try {
			const event = JSON.parse(line);
			if (typeof event.session_id === "string" && event.session_id.trim()) {
				return event.session_id;
			}
		} catch {
			// Ignore non-JSON progress lines from older Claude builds.
		}
	}
	throw new Error("claude stream-json did not include session_id");
}

function turnPaths(outputDir, turnIndex) {
	return {
		inputFile: join(outputDir, `turn-${turnIndex + 1}.input.md`),
		stdoutFile: join(outputDir, `turn-${turnIndex + 1}.jsonl`),
		stderrFile: join(outputDir, `turn-${turnIndex + 1}.stderr`),
	};
}

function runEpisodeTurn(options, prompt, sessionId) {
	return spawnSync("claude", claudeEpisodeArgs(options, sessionId), {
		cwd: options.workspace,
		encoding: "utf-8",
		env: {
			...process.env,
			...CLAUDE_CLI_ENV,
			CAUTILUS_SKILL_TEST_BACKEND: "claude_code",
			PATH: `${join(options.repoRoot, "bin")}:${process.env.PATH ?? ""}`,
		},
		input: prompt,
		timeout: options.timeoutMs,
		maxBuffer: 20 * 1024 * 1024,
	});
}

function turnFailureMessage(result, turnIndex, options) {
	if (result.error?.code === "ETIMEDOUT") {
		return `The claude_code episode runner timed out after ${options.timeoutMs}ms.`;
	}
	if (result.status !== 0) {
		return `The claude_code episode runner exited with status ${result.status} on turn ${turnIndex + 1}.`;
	}
	return null;
}

function auditEpisode(testCase, combined, artifactRefs, outputDir, started, artifactRef) {
	let audit = null;
	if (testCase.auditKind === "cautilus_refresh_flow") {
		audit = auditRefreshFlowLogText(combined);
	}
	if (testCase.auditKind === "cautilus_first_scan_flow") {
		audit = auditFirstScanFlowLogText(combined);
	}
	if (testCase.auditKind === "cautilus_review_prepare_flow") {
		audit = auditReviewPrepareFlowLogText(combined);
	}
	if (testCase.auditKind === "cautilus_reviewer_launch_flow") {
		audit = auditReviewerLaunchFlowLogText(combined);
	}
	if (testCase.auditKind === "cautilus_review_to_eval_flow") {
		audit = auditReviewToEvalFlowLogText(combined);
	}
	if (testCase.auditKind === "cautilus_packet_first_flow") {
		audit = auditPacketFirstFlowLogText(combined);
	}
	if (!audit) {
		return null;
	}
	const auditFile = join(outputDir, "audit.json");
	writeFileSync(auditFile, `${JSON.stringify(audit, null, 2)}\n`);
	artifactRefs.push(artifactRef("audit", auditFile));
	const commandText = audit.commands.join("\n");
	return applyObservationExpectations(testCase, {
		invoked: audit.commandCount > 0,
		outcome: audit.status === "passed" ? "passed" : "failed",
		summary: `Audit ${audit.status}: ${audit.findings.length} finding(s).`,
		metrics: {
			duration_ms: Date.now() - started,
		},
		artifactRefs,
	}, commandText);
}

export function runClaudeEpisodeSample({ options, testCase, artifactDir, sampleIndex, artifactRef, sampleDir, backendFailureResult }) {
	const caseDir = join(artifactDir, testCase.caseId);
	const outputDir = sampleDir(caseDir, sampleIndex, testCase.repeatCount);
	mkdirSync(outputDir, { recursive: true });
	const started = Date.now();
	const artifactRefs = [];
	const logs = [];
	let sessionId = null;
	for (const [turnIndex, turn] of testCase.turns.entries()) {
		const input = renderTurnInput(options, testCase, turn);
		const paths = turnPaths(outputDir, turnIndex);
		writeFileSync(paths.inputFile, input);
		const result = runEpisodeTurn(options, input, sessionId);
		writeFileSync(paths.stdoutFile, result.stdout ?? "");
		writeFileSync(paths.stderrFile, result.stderr ?? "");
		artifactRefs.push(
			artifactRef("turn_input", paths.inputFile),
			artifactRef("turn_stdout", paths.stdoutFile),
			artifactRef("turn_stderr", paths.stderrFile),
		);
		const failure = turnFailureMessage(result, turnIndex, options);
		if (failure) {
			return backendFailureResult(testCase, failure, Date.now() - started, artifactRefs);
		}
		logs.push((result.stdout ?? "").trim());
		if (!sessionId) {
			try {
				sessionId = extractSessionId(result.stdout);
			} catch (error) {
				return backendFailureResult(testCase, error.message, Date.now() - started, artifactRefs);
			}
		}
	}
	const combined = `${logs.filter(Boolean).join("\n")}\n`;
	const combinedFile = join(outputDir, "combined.jsonl");
	writeFileSync(combinedFile, combined);
	artifactRefs.push(artifactRef("transcript", combinedFile));
	const audited = auditEpisode(testCase, combined, artifactRefs, outputDir, started, artifactRef);
	return audited ?? backendFailureResult(
		testCase,
		`Unsupported auditKind for multi-turn episode: ${testCase.auditKind ?? "none"}.`,
		Date.now() - started,
		artifactRefs,
	);
}
