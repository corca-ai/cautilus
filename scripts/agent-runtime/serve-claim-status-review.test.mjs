import assert from "node:assert/strict";
import fs from "node:fs";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import http from "node:http";
import { tmpdir } from "node:os";
import path from "node:path";
import test from "node:test";

import {
	buildCommentPacket,
	buildReviewQueue,
	createReviewServer,
	parseArgs,
	renderMarkdownFragment,
	splitMarkdownSections,
} from "./serve-claim-status-review.mjs";

test("parseArgs accepts report server options", () => {
	assert.deepEqual(parseArgs(["node", "script", "--report", "report.md", "--comments", "comments.json", "--host", "0.0.0.0", "--port", "18080", "--token", "abc"]), {
		report: "report.md",
		comments: "comments.json",
		host: "0.0.0.0",
		port: 18080,
		token: "abc",
	});
});

test("buildReviewQueue presents maintainer decision cards with reference anchors", () => {
	const sections = [
		{ id: "packet", title: "Packet", markdown: "- Git state: stale; stale=yes" },
		{ id: "refresh-plans", title: "Refresh Plans", markdown: "Latest changed claim sources: docs/example.md: 2" },
		{ id: "human-align-surfaces", title: "human-align-surfaces" },
		{ id: "human-confirm-or-decompose", title: "human-confirm-or-decompose" },
		{ id: "next-work", title: "Next Work", markdown: "- Agent next proof work: connect deterministic gates.\n- Scenario design work remains." },
		{ id: "discovery-boundary", title: "Discovery Boundary" },
	];
	const queue = buildReviewQueue(sections);
	assert.equal(queue.length, 5);
	assert.deepEqual(
		queue.map((item) => item.id),
		[
			"decision-refresh-stale-claims",
			"decision-human-align",
			"decision-human-confirm",
			"decision-agent-next-work",
			"decision-missing-claims",
		],
	);
	assert.equal(queue[0].suggestedStatus, "ok");
	assert.equal(Object.hasOwn(queue[0], "defaultStatus"), false);
	assert.match(queue[0].why, /docs\/example\.md: 2/);
	assert.equal(queue[1].anchorLinks.some((link) => link.label === "Inspect alignment examples"), true);
	assert.match(queue[3].question, /May I continue/);
	assert.match(queue[3].why, /Agent next proof work/);
	assert.doesNotMatch(queue[3].why, /Cautilus eval planning, and scenario design/);
});

test("buildReviewQueue avoids report-specific hardcoded source facts", () => {
	const queue = buildReviewQueue([
		{ id: "packet", title: "Packet", markdown: "- Git state: current; stale=no" },
		{ id: "refresh-plans", title: "Refresh Plans", markdown: "Latest changed claim sources: README.md: 1" },
	]);
	assert.match(queue[0].why, /README\.md: 1/);
	assert.doesNotMatch(queue[0].why, /skills\/cautilus\/SKILL\.md/);
	assert.equal(queue[0].anchorLinks[0].label, "Inspect refresh plan");
});

test("splitMarkdownSections groups h1-h3 sections with stable ids", () => {
	const sections = splitMarkdownSections("# Title\n\nIntro\n\n## Next Work\n\n- A\n\n## Next Work\n\n- B\n");
	assert.deepEqual(
		sections.map((section) => [section.id, section.title, section.level]),
		[
			["overview", "Overview", 1],
			["title", "Title", 1],
			["next-work", "Next Work", 2],
			["next-work-2", "Next Work", 2],
		],
	);
});

test("renderMarkdownFragment renders tables, lists, and inline code", () => {
	const html = renderMarkdownFragment(["- Use `claim show`", "", "| A | B |", "| --- | --- |", "| x | y |"].join("\n"));
	assert.match(html, /<ul>/);
	assert.match(html, /<code>claim show<\/code>/);
	assert.match(html, /<table>/);
	assert.match(html, /<td>x<\/td>/);
});

test("buildCommentPacket normalizes and fingerprints comments", () => {
	const packet = buildCommentPacket({
		reportPath: "report.md",
		commentsPath: "comments.json",
		markdown: "# Report\n",
		reviewer: "tester",
		comments: [
			{
				sectionId: "next-work",
				sectionTitle: "Next Work",
				status: "needs-agent",
				comment: "Please continue.",
			},
			{
				sectionId: "",
				sectionTitle: "Dropped",
				status: "not-valid",
				comment: "ignored",
			},
			{
				sectionId: "decision-refresh-stale-claims",
				sectionTitle: "Default untouched decision",
				status: "unreviewed",
				comment: "",
			},
		],
	});
	assert.equal(packet.schemaVersion, "cautilus.claim_status_comments.v1");
	assert.equal(packet.reportFingerprint.startsWith("sha256:"), true);
	assert.equal(packet.comments.length, 1);
	assert.equal(packet.comments[0].status, "needs-agent");
});

test("createReviewServer requires token and writes comment packet", async () => {
	const root = mkdtempSync(path.join(tmpdir(), "cautilus-claim-review-"));
	try {
		const reportPath = path.join(root, "report.md");
		const commentsPath = path.join(root, "comments.json");
		writeFileSync(reportPath, "# Report\n\n## Next Work\n\n- Continue\n");
		const server = createReviewServer({ reportPath, commentsPath, token: "secret" });
		await listen(server);
		try {
			const address = server.address();
			const base = `http://127.0.0.1:${address.port}`;
			const forbidden = await requestJSON(`${base}/api/state`);
			assert.equal(forbidden.status, 403);
			const state = await requestJSON(`${base}/api/state?token=secret`);
			assert.equal(state.status, 200);
			assert.equal(state.body.sections.some((section) => section.id === "next-work"), true);
			assert.equal(state.body.reviewQueue.length, 5);
			assert.equal(state.body.reviewQueue[0].id, "decision-refresh-stale-claims");
			const saved = await requestJSON(`${base}/api/comments?token=secret`, {
				method: "POST",
				body: JSON.stringify({
					comments: [{ sectionId: "next-work", sectionTitle: "Next Work", status: "ok", comment: "Looks good." }],
				}),
			});
			assert.equal(saved.status, 200);
			const packet = JSON.parse(fs.readFileSync(commentsPath, "utf8"));
			assert.equal(packet.comments[0].comment, "Looks good.");
		} finally {
			await close(server);
		}
	} finally {
		rmSync(root, { recursive: true, force: true });
	}
});

function listen(server) {
	return new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
}

function close(server) {
	return new Promise((resolve, reject) => server.close((error) => (error ? reject(error) : resolve())));
}

function requestJSON(url, options = {}) {
	return new Promise((resolve, reject) => {
		const request = http.request(url, { method: options.method ?? "GET", headers: { "content-type": "application/json" } }, (response) => {
			let body = "";
			response.setEncoding("utf8");
			response.on("data", (chunk) => {
				body += chunk;
			});
			response.on("end", () => {
				resolve({ status: response.statusCode, body: JSON.parse(body) });
			});
		});
		request.on("error", reject);
		if (options.body) {
			request.write(options.body);
		}
		request.end();
	});
}
