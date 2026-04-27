import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { spawnSync } from "node:child_process";
import process from "node:process";

import { auditRefreshFlowLogText } from "./audit-cautilus-refresh-flow-log.mjs";
import { applyObservationExpectations } from "./skill-test-expectations.mjs";

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

function codexEpisodeArgs(options, prompt) {
	const args = [
		"exec",
		"-C",
		options.workspace,
		"--sandbox",
		options.sandbox,
		"--json",
	];
	if (options.codexModel ?? options.model) {
		args.push("--model", options.codexModel ?? options.model);
	}
	if (options.codexReasoningEffort ?? options.reasoningEffort) {
		args.push("-c", `model_reasoning_effort="${options.codexReasoningEffort ?? options.reasoningEffort}"`);
	}
	for (const override of options.codexConfigOverrides ?? []) {
		args.push("-c", override);
	}
	args.push(prompt);
	return args;
}

function codexEpisodeResumeArgs(options, threadId, prompt) {
	const args = [
		"exec",
		"resume",
		threadId,
		"--json",
	];
	if (options.codexModel ?? options.model) {
		args.push("--model", options.codexModel ?? options.model);
	}
	if (options.codexReasoningEffort ?? options.reasoningEffort) {
		args.push("-c", `model_reasoning_effort="${options.codexReasoningEffort ?? options.reasoningEffort}"`);
	}
	for (const override of options.codexConfigOverrides ?? []) {
		args.push("-c", override);
	}
	args.push(prompt);
	return args;
}

function extractThreadId(jsonlText) {
	for (const line of String(jsonlText ?? "").split(/\r?\n/)) {
		if (!line.trim()) {
			continue;
		}
		try {
			const event = JSON.parse(line);
			if (event.type === "thread.started" && typeof event.thread_id === "string") {
				return event.thread_id;
			}
		} catch {
			// Ignore non-JSON progress lines from older Codex builds.
		}
	}
	throw new Error("codex exec JSONL did not include thread.started");
}

function turnPaths(outputDir, turnIndex) {
	return {
		inputFile: join(outputDir, `turn-${turnIndex + 1}.input.md`),
		stdoutFile: join(outputDir, `turn-${turnIndex + 1}.jsonl`),
		stderrFile: join(outputDir, `turn-${turnIndex + 1}.stderr`),
	};
}

function runEpisodeTurn(options, prompt, threadId) {
	return spawnSync("codex", threadId
		? codexEpisodeResumeArgs(options, threadId, prompt)
		: codexEpisodeArgs(options, prompt), {
		cwd: options.workspace,
		encoding: "utf-8",
		env: {
			...process.env,
			PATH: `${join(options.repoRoot, "bin")}:${process.env.PATH ?? ""}`,
		},
		timeout: options.timeoutMs,
		maxBuffer: 20 * 1024 * 1024,
	});
}

function turnFailureMessage(result, turnIndex, options) {
	if (result.error?.code === "ETIMEDOUT") {
		return `The codex_exec episode runner timed out after ${options.timeoutMs}ms.`;
	}
	if (result.status !== 0) {
		return `The codex_exec episode runner exited with status ${result.status} on turn ${turnIndex + 1}.`;
	}
	return null;
}

function auditEpisode(testCase, combined, artifactRefs, outputDir, started, artifactRef) {
	if (testCase.auditKind !== "cautilus_refresh_flow") {
		return null;
	}
	const audit = auditRefreshFlowLogText(combined);
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

export function runCodexEpisodeSample({ options, testCase, artifactDir, sampleIndex, artifactRef, sampleDir, backendFailureResult }) {
	const caseDir = join(artifactDir, testCase.caseId);
	const outputDir = sampleDir(caseDir, sampleIndex, testCase.repeatCount);
	mkdirSync(outputDir, { recursive: true });
	const started = Date.now();
	const artifactRefs = [];
	const logs = [];
	let threadId = null;
	for (const [turnIndex, turn] of testCase.turns.entries()) {
		const input = renderTurnInput(options, testCase, turn);
		const paths = turnPaths(outputDir, turnIndex);
		writeFileSync(paths.inputFile, input);
		const result = runEpisodeTurn(options, input, threadId);
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
		if (!threadId) {
			try {
				threadId = extractThreadId(result.stdout);
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
