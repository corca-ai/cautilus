import assert from "node:assert/strict";
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { spawnSync } from "node:child_process";
import test from "node:test";

import { renderHtml, writeSelfDogfoodHtml } from "./render-self-dogfood-html.mjs";

const SCRIPT_PATH = join(process.cwd(), "scripts", "render-self-dogfood-html.mjs");

function writeJson(root, relativePath, value) {
	const filePath = join(root, relativePath);
	mkdirSync(join(filePath, ".."), { recursive: true });
	writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`, "utf-8");
	return filePath;
}

function stageLatestBundle({
	overallStatus = "concern",
	reportRecommendation = "defer",
	gateRecommendation = "accept-now",
	intent = "Cautilus should <strong>honestly</strong> record dogfood results.",
	summaryText = "Review said verdict is 'concern' & findings > 0.",
} = {}) {
	const root = mkdtempSync(join(tmpdir(), "cautilus-render-html-"));
	const latestDir = join(root, "latest");
	mkdirSync(latestDir, { recursive: true });
	writeJson(latestDir, "summary.json", {
		generatedAt: "2026-04-11T00:29:26.763Z",
		runId: "2026-04-11T00-29-08.947Z",
		baselineRef: "origin/main",
		artifactRoot: "artifacts/self-dogfood",
		intent,
		overallStatus,
		reportRecommendation,
		gateRecommendation,
		reviewTelemetry: {
			variantCount: 1,
			passedVariantCount: 1,
			failedVariantCount: 0,
			durationMs: 8694,
		},
		reviewVariants: [
			{ id: "codex-review", verdict: "concern", findingsCount: 3 },
		],
	});
	writeJson(latestDir, "report.json", {
		schemaVersion: "cautilus.report_packet.v1",
		intent,
		intentProfile: {
			schemaVersion: "cautilus.behavior_intent.v1",
			behaviorSurface: "operator_behavior",
			successDimensions: [{ id: "operator_guidance_clarity", summary: "Keep guidance clear." }],
			guardrailDimensions: [],
		},
		commandObservations: [
			{
				stage: "preflight",
				index: 1,
				status: "passed",
				command: "npm run hooks:check",
				startedAt: "2026-04-11T00:29:09.116Z",
				completedAt: "2026-04-11T00:29:09.300Z",
				durationMs: 184,
				exitCode: 0,
			},
			{
				stage: "full_gate",
				index: 1,
				status: "passed",
				command: "npm run verify",
				durationMs: 8349,
				exitCode: 0,
			},
		],
	});
	writeJson(latestDir, "review-summary.json", {
		telemetry: {
			variantCount: 1,
			passedVariantCount: 1,
			failedVariantCount: 0,
			durationMs: 8694,
		},
		variants: [
			{
				id: "codex-review",
				tool: "codex_exec",
				status: "passed",
				durationMs: 8694,
				output: {
					verdict: "concern",
					summary: summaryText,
					findings: [
						{ severity: "pass", message: "Scope is narrow.", path: "docs/specs/self-dogfood.spec.md" },
						{ severity: "pass", message: "recommendation derived honestly", path: "scripts/run-self-dogfood.mjs" },
						{ severity: "concern", message: "evidence does not include report body", path: "." },
					],
				},
			},
		],
	});
	return { root, latestDir };
}

function cleanup(root) {
	rmSync(root, { recursive: true, force: true });
}

test("renderHtml emits a self-contained document with headline fields", () => {
	const { root, latestDir } = stageLatestBundle();
	try {
		const summary = JSON.parse(readFileSync(join(latestDir, "summary.json"), "utf-8"));
		const report = JSON.parse(readFileSync(join(latestDir, "report.json"), "utf-8"));
		const reviewSummary = JSON.parse(readFileSync(join(latestDir, "review-summary.json"), "utf-8"));
		const html = renderHtml({ summary, report, reviewSummary });
		assert.match(html, /^<!DOCTYPE html>/);
		assert.match(html, /<html lang="en">/);
		assert.ok(html.includes("<style>"), "should inline CSS");
		assert.ok(!html.includes("<link "), "should not reference external stylesheets");
		assert.ok(!html.includes("<script"), "should not embed scripts");
		assert.ok(html.includes("data-status=\"overallStatus\""), "should tag overall status chip");
		assert.ok(html.includes(">concern<"), "should render concern status label");
		assert.ok(html.includes("data-field=\"reportRecommendation\""));
		assert.ok(html.includes(">defer<"), "should render reportRecommendation value");
		assert.ok(html.includes(">accept-now<"), "should render gateRecommendation value");
	} finally {
		cleanup(root);
	}
});

test("renderHtml escapes summary and intent text", () => {
	const { root, latestDir } = stageLatestBundle();
	try {
		const summary = JSON.parse(readFileSync(join(latestDir, "summary.json"), "utf-8"));
		const report = JSON.parse(readFileSync(join(latestDir, "report.json"), "utf-8"));
		const reviewSummary = JSON.parse(readFileSync(join(latestDir, "review-summary.json"), "utf-8"));
		const html = renderHtml({ summary, report, reviewSummary });
		assert.ok(!html.includes("<strong>honestly</strong>"), "intent HTML must be escaped");
		assert.ok(html.includes("&lt;strong&gt;honestly&lt;/strong&gt;"));
		assert.ok(!html.includes("verdict is 'concern'"), "summary quotes must be escaped");
		assert.ok(html.includes("verdict is &#39;concern&#39;"));
		assert.ok(html.includes("findings &gt; 0"), "summary angle brackets must be escaped");
	} finally {
		cleanup(root);
	}
});

test("renderHtml lists every command observation and review variant", () => {
	const { root, latestDir } = stageLatestBundle();
	try {
		const summary = JSON.parse(readFileSync(join(latestDir, "summary.json"), "utf-8"));
		const report = JSON.parse(readFileSync(join(latestDir, "report.json"), "utf-8"));
		const reviewSummary = JSON.parse(readFileSync(join(latestDir, "review-summary.json"), "utf-8"));
		const html = renderHtml({ summary, report, reviewSummary });
		const observationRows = html.match(/data-observation="/g) ?? [];
		assert.equal(observationRows.length, 2, "should emit one row per commandObservation");
		assert.ok(html.includes("npm run hooks:check"));
		assert.ok(html.includes("npm run verify"));
		const variantBlocks = html.match(/data-variant="/g) ?? [];
		assert.equal(variantBlocks.length, 1, "should emit one block per review variant");
		assert.ok(html.includes("data-variant=\"codex-review\""));
		const findingEntries = html.match(/class="finding"/g) ?? [];
		assert.equal(findingEntries.length, 3, "should emit one entry per finding");
	} finally {
		cleanup(root);
	}
});

test("writeSelfDogfoodHtml writes index.html next to the latest bundle", () => {
	const { root, latestDir } = stageLatestBundle();
	try {
		const outputPath = writeSelfDogfoodHtml(latestDir);
		assert.equal(outputPath, join(latestDir, "index.html"));
		const html = readFileSync(outputPath, "utf-8");
		assert.ok(html.startsWith("<!DOCTYPE html>"));
		assert.ok(html.includes("Cautilus Self-Dogfood"));
	} finally {
		cleanup(root);
	}
});

test("CLI entry renders a self-contained document against real fixture bundle", () => {
	const { root, latestDir } = stageLatestBundle();
	try {
		const result = spawnSync("node", [SCRIPT_PATH, "--latest-dir", latestDir], {
			encoding: "utf-8",
			cwd: process.cwd(),
		});
		assert.equal(result.status, 0, result.stderr);
		const outputPath = result.stdout.trim();
		assert.equal(outputPath, join(latestDir, "index.html"));
		const html = readFileSync(outputPath, "utf-8");
		assert.ok(html.includes("data-variant=\"codex-review\""));
		assert.ok(html.includes("Do not hand-edit this file"), "should warn against hand editing");
	} finally {
		cleanup(root);
	}
});

test("renderHtml handles missing optional fields without throwing", () => {
	const html = renderHtml({
		summary: { overallStatus: "pass", intent: "minimal" },
		report: { commandObservations: [] },
		reviewSummary: { variants: [] },
	});
	assert.ok(html.includes("No command observations recorded."));
	assert.ok(html.includes("No review variants recorded."));
	assert.ok(html.includes(">pass<"));
});
