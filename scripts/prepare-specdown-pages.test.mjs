import test from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";

import { prepareSpecdownPages } from "./prepare-specdown-pages.mjs";

test("prepareSpecdownPages copies specdown assets and preserves specdown entry page", () => {
	const tempRoot = mkdtempSync(join(tmpdir(), "cautilus-spec-pages-"));
	const reportDir = join(tempRoot, "report");
	const siteDir = join(tempRoot, "site");
	const reportJson = join(tempRoot, "report.json");

	mkdirSync(reportDir, { recursive: true });
	writeFileSync(join(reportDir, "style.css"), "body{}");
	writeFileSync(join(reportDir, "index.html"), "<html><body>spec index</body></html>");
	writeFileSync(join(reportDir, "current-product.html"), "<html><body>current product</body></html>");
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

	prepareSpecdownPages({ reportDir, reportJson, siteDir });

	assert.equal(readFileSync(join(siteDir, "style.css"), "utf-8"), "body{}");
	assert.equal(readFileSync(join(siteDir, "report.json"), "utf-8"), readFileSync(reportJson, "utf-8"));
	assert.match(readFileSync(join(siteDir, "index.html"), "utf-8"), /spec index/);
});

test("prepareSpecdownPages fails when specdown did not emit an entry page", () => {
	const tempRoot = mkdtempSync(join(tmpdir(), "cautilus-spec-pages-missing-index-"));
	const reportDir = join(tempRoot, "report");
	const siteDir = join(tempRoot, "site");
	const reportJson = join(tempRoot, "report.json");

	mkdirSync(reportDir, { recursive: true });
	writeFileSync(join(reportDir, "current-product.html"), "<html><body>current product</body></html>");
	writeFileSync(reportJson, JSON.stringify({ title: "Cautilus Current Specs", results: [] }, null, 2));

	assert.throws(() => {
		prepareSpecdownPages({ reportDir, reportJson, siteDir });
	}, /Specdown entry page not found/);
});
