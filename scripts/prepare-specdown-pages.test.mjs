import test from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";

import { buildReportEntries, prepareSpecdownPages, renderLandingPage } from "./prepare-specdown-pages.mjs";

test("buildReportEntries maps spec documents to html pages and counts statuses", () => {
	const report = {
		results: [
			{
				document: {
					title: "Current Product",
					relativeTo: "docs/specs/current-product.spec.md",
				},
				status: "passed",
				cases: [
					{ status: "passed" },
					{ status: "failed" },
					{ status: "skipped" },
					{ status: "error" },
				],
			},
		],
	};

	const [entry] = buildReportEntries(report);
	assert.equal(entry.file, "current-product.html");
	assert.equal(entry.counts.passed, 1);
	assert.equal(entry.counts.failed, 1);
	assert.equal(entry.counts.skipped, 1);
	assert.equal(entry.counts.error, 1);
});

test("renderLandingPage includes report links and generation note", () => {
	const html = renderLandingPage({
		title: "Cautilus Current Specs",
		generatedAt: "2026-04-16T00:00:00.000Z",
		reportUrl: "https://corca-ai.github.io/cautilus",
		entries: [
			{
				title: "Current Product",
				file: "current-product.html",
				relativeTo: "docs/specs/current-product.spec.md",
				status: "passed",
				counts: { passed: 3, failed: 0, skipped: 0, error: 0, total: 3 },
			},
		],
	});

	assert.match(html, /specdown run -filter check:source_guard/);
	assert.match(html, /href="\.\/current-product\.html"/);
	assert.match(html, /href="\.\/report\.json"/);
	assert.match(html, /Generated at 2026-04-16T00:00:00.000Z/);
});

test("prepareSpecdownPages copies specdown assets and writes a landing page", () => {
	const tempRoot = mkdtempSync(join(tmpdir(), "cautilus-spec-pages-"));
	const reportDir = join(tempRoot, "report");
	const siteDir = join(tempRoot, "site");
	const reportJson = join(tempRoot, "report.json");

	mkdirSync(reportDir, { recursive: true });
	writeFileSync(join(reportDir, "style.css"), "body{}");
	writeFileSync(join(reportDir, "current-product.html"), "<html><body>ok</body></html>");
	writeFileSync(reportJson, JSON.stringify({
		title: "Cautilus Current Specs",
		generatedAt: "2026-04-16T00:00:00.000Z",
		results: [
			{
				document: {
					title: "Current Product",
					relativeTo: "docs/specs/current-product.spec.md",
				},
				status: "passed",
				cases: [
					{ status: "passed" },
				],
			},
		],
	}, null, 2));

	prepareSpecdownPages({
		reportDir,
		reportJson,
		siteDir,
		reportUrl: "https://corca-ai.github.io/cautilus/",
	});

	assert.equal(readFileSync(join(siteDir, "style.css"), "utf-8"), "body{}");
	assert.equal(readFileSync(join(siteDir, "report.json"), "utf-8"), readFileSync(reportJson, "utf-8"));
	assert.match(readFileSync(join(siteDir, "index.html"), "utf-8"), /Current Product/);
});
