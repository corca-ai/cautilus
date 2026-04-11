import assert from "node:assert/strict";
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { spawnSync } from "node:child_process";
import test from "node:test";

import {
	renderHtml,
	writeSelfDogfoodExperimentsHtml,
} from "./render-self-dogfood-experiments-html.mjs";

const SCRIPT_PATH = join(process.cwd(), "scripts", "render-self-dogfood-experiments-html.mjs");

function writeJson(root, relativePath, value) {
	const filePath = join(root, relativePath);
	mkdirSync(join(filePath, ".."), { recursive: true });
	writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`, "utf-8");
	return filePath;
}

function stageLatestBundle({
	intent = "Experiments should compare <b>baseline</b> and variants honestly.",
	primarySummary = "exp-a is better than exp-b & easier to trust.",
} = {}) {
	const root = mkdtempSync(join(tmpdir(), "cautilus-render-experiments-html-"));
	const latestDir = join(root, "latest");
	mkdirSync(latestDir, { recursive: true });
	writeJson(latestDir, "summary.json", {
		generatedAt: "2026-04-11T02:00:00.000Z",
		runId: "exp-2026-04-11T02-00-00",
		baselineRef: "origin/main",
		artifactRoot: "artifacts/self-dogfood/experiments",
		intent,
		overallStatus: "concern",
		reportRecommendation: "defer",
		gateRecommendation: "accept-now",
		modeTelemetry: {
			durationMs: 2400,
		},
		experiments: [
			{
				adapterName: "exp-a",
				overallStatus: "pass",
				executionStatus: "passed",
				findingsCount: 0,
				telemetry: {
					durationMs: 1800,
				},
				primarySummary,
				variants: [
					{
						id: "codex-review",
						executionStatus: "passed",
						verdict: "pass",
						summary: primarySummary,
						findingsCount: 0,
					},
				],
			},
			{
				adapterName: "exp-b",
				overallStatus: "concern",
				executionStatus: "passed",
				findingsCount: 2,
				telemetry: {
					durationMs: 2200,
				},
				primarySummary: "exp-b needs more evidence.",
				variants: [
					{
						id: "codex-review",
						executionStatus: "passed",
						verdict: "concern",
						summary: "exp-b needs more evidence.",
						findingsCount: 2,
					},
				],
			},
		],
	});
	writeJson(latestDir, "report.json", {
		schemaVersion: "cautilus.report_packet.v1",
		intent,
		commandObservations: [],
	});
	return { root, latestDir };
}

function cleanup(root) {
	rmSync(root, { recursive: true, force: true });
}

test("renderHtml emits a self-contained comparison document for experiments", () => {
	const { root, latestDir } = stageLatestBundle();
	try {
		const summary = JSON.parse(readFileSync(join(latestDir, "summary.json"), "utf-8"));
		const report = JSON.parse(readFileSync(join(latestDir, "report.json"), "utf-8"));
		const html = renderHtml({ summary, report });
		assert.match(html, /^<!DOCTYPE html>/);
		assert.match(html, /<html lang="en">/);
		assert.ok(html.includes("A/B Comparison"));
		assert.ok(html.includes("data-compare-row=\"deterministic-gate\""));
		assert.ok(html.includes("data-compare-row=\"exp-a\""));
		assert.ok(html.includes("data-compare-row=\"exp-b\""));
		assert.ok(!html.includes("<script"));
	} finally {
		cleanup(root);
	}
});

test("renderHtml escapes experiment summaries and intent text", () => {
	const { root, latestDir } = stageLatestBundle();
	try {
		const summary = JSON.parse(readFileSync(join(latestDir, "summary.json"), "utf-8"));
		const report = JSON.parse(readFileSync(join(latestDir, "report.json"), "utf-8"));
		const html = renderHtml({ summary, report });
		assert.ok(!html.includes("<b>baseline</b>"));
		assert.ok(html.includes("&lt;b&gt;baseline&lt;/b&gt;"));
		assert.ok(html.includes("exp-a is better than exp-b &amp; easier to trust."));
	} finally {
		cleanup(root);
	}
});

test("renderHtml lists experiment cards and variant details", () => {
	const { root, latestDir } = stageLatestBundle();
	try {
		const summary = JSON.parse(readFileSync(join(latestDir, "summary.json"), "utf-8"));
		const report = JSON.parse(readFileSync(join(latestDir, "report.json"), "utf-8"));
		const html = renderHtml({ summary, report });
		const experimentCards = html.match(/data-experiment="/g) ?? [];
		assert.equal(experimentCards.length, 2);
		const variantRows = html.match(/data-variant="/g) ?? [];
		assert.equal(variantRows.length, 2);
		assert.ok(html.includes("deterministic gate"));
		assert.ok(html.includes("exp-b needs more evidence."));
	} finally {
		cleanup(root);
	}
});

test("writeSelfDogfoodExperimentsHtml writes index.html next to the latest bundle", () => {
	const { root, latestDir } = stageLatestBundle();
	try {
		const outputPath = writeSelfDogfoodExperimentsHtml(latestDir);
		assert.equal(outputPath, join(latestDir, "index.html"));
		const html = readFileSync(outputPath, "utf-8");
		assert.ok(html.startsWith("<!DOCTYPE html>"));
		assert.ok(html.includes("Cautilus Self-Dogfood Experiments"));
	} finally {
		cleanup(root);
	}
});

test("CLI entry renders experiments HTML against a staged bundle", () => {
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
		assert.ok(html.includes("Do not hand-edit this file"));
		assert.ok(html.includes("A/B experiment outcomes"));
	} finally {
		cleanup(root);
	}
});

test("renderHtml handles missing experiment entries without throwing", () => {
	const html = renderHtml({
		summary: { overallStatus: "pass", intent: "minimal", experiments: [] },
		report: {},
	});
	assert.ok(html.includes("No experiments recorded."));
	assert.ok(html.includes("data-compare-row=\"deterministic-gate\""));
	assert.ok(html.includes(">pass<"));
});
