#!/usr/bin/env node
import { createHash, randomBytes } from "node:crypto";
import fs from "node:fs";
import http from "node:http";
import path from "node:path";
import { renderPage } from "./claim-status-review-page.mjs";

const DEFAULT_REPORT = ".cautilus/claims/claim-status-report.md";
const DEFAULT_COMMENTS = ".cautilus/claims/claim-status-comments.json";
const DEFAULT_HOST = "127.0.0.1";
const DEFAULT_PORT = 17655;
const STATUS_VALUES = new Set(["unreviewed", "ok", "needs-agent", "needs-human", "question", "skip"]);

export function parseArgs(argv) {
	const args = {
		report: DEFAULT_REPORT,
		comments: DEFAULT_COMMENTS,
		host: DEFAULT_HOST,
		port: DEFAULT_PORT,
		token: "",
	};
	for (let index = 2; index < argv.length; index += 1) {
		const arg = argv[index];
		if (arg === "--report") {
			args.report = argv[++index];
		} else if (arg === "--comments") {
			args.comments = argv[++index];
		} else if (arg === "--host") {
			args.host = argv[++index];
		} else if (arg === "--port") {
			args.port = parsePort(argv[++index]);
		} else if (arg === "--token") {
			args.token = argv[++index];
		} else if (arg === "--help" || arg === "-h") {
			args.help = true;
		} else {
			throw new Error(`Unsupported argument: ${arg}`);
		}
	}
	return args;
}

function parsePort(value) {
	const parsed = Number.parseInt(value, 10);
	if (!Number.isInteger(parsed) || parsed < 1 || parsed > 65535) {
		throw new Error(`invalid --port value: ${value}`);
	}
	return parsed;
}

function usage() {
	return [
		"Usage: node scripts/agent-runtime/serve-claim-status-review.mjs [options]",
		"",
		"Options:",
		"  --report <path>    Markdown report to review",
		"  --comments <path>  JSON comment packet to write",
		"  --host <host>      Bind host, defaults to 127.0.0.1",
		"  --port <port>      Bind port, defaults to 17655",
		"  --token <token>    Access token. Defaults to a random per-run token.",
	].join("\n");
}

function readText(filePath) {
	return fs.readFileSync(filePath, "utf8");
}

function readOptionalJSON(filePath, fallback) {
	if (!fs.existsSync(filePath)) {
		return fallback;
	}
	return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function sha256(value) {
	return `sha256:${createHash("sha256").update(value).digest("hex")}`;
}

function slugify(value) {
	const slug = String(value)
		.toLowerCase()
		.replace(/`/g, "")
		.replace(/[^a-z0-9]+/g, "-")
		.replace(/^-+|-+$/g, "");
	return slug || "section";
}

export function splitMarkdownSections(markdown) {
	const sections = [];
	let current = {
		id: "overview",
		title: "Overview",
		level: 1,
		lines: [],
	};
	const seen = new Map();
	for (const line of markdown.split(/\r?\n/)) {
		const match = line.match(/^(#{1,3})\s+(.+)$/);
		if (match) {
			pushSection(sections, current);
			current = newSection(match[2], match[1].length, seen);
			continue;
		}
		current.lines.push(line);
	}
	pushSection(sections, current);
	return sections;
}

function newSection(title, level, seen) {
	const base = slugify(title);
	const count = (seen.get(base) ?? 0) + 1;
	seen.set(base, count);
	return {
		id: count === 1 ? base : `${base}-${count}`,
		title,
		level,
		lines: [],
	};
}

function pushSection(sections, section) {
	const body = section.lines.join("\n").trim();
	if (!section.title && !body) {
		return;
	}
	sections.push({
		id: section.id,
		title: section.title,
		level: section.level,
		markdown: body,
	});
}

function escapeHTML(value) {
	return String(value)
		.replace(/&/g, "&amp;")
		.replace(/</g, "&lt;")
		.replace(/>/g, "&gt;")
		.replace(/"/g, "&quot;");
}

function inlineMarkdown(value) {
	const escaped = escapeHTML(value);
	return escaped
		.replace(/`([^`]+)`/g, "<code>$1</code>")
		.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noreferrer">$1</a>');
}

export function renderMarkdownFragment(markdown) {
	const lines = markdown.split(/\r?\n/);
	const html = [];
	let index = 0;
	while (index < lines.length) {
		const line = lines[index];
		if (!line.trim()) {
			index += 1;
			continue;
		}
		if (isTableStart(lines, index)) {
			const table = collectTable(lines, index);
			html.push(renderTable(table.rows));
			index = table.nextIndex;
			continue;
		}
		if (line.startsWith("- ")) {
			const list = collectList(lines, index);
			html.push(renderList(list.items));
			index = list.nextIndex;
			continue;
		}
		html.push(`<p>${inlineMarkdown(line)}</p>`);
		index += 1;
	}
	return html.join("\n");
}

function isTableStart(lines, index) {
	return lines[index]?.trim().startsWith("|") && lines[index + 1]?.includes("---");
}

function collectTable(lines, start) {
	const rows = [];
	let index = start;
	while (index < lines.length && lines[index].trim().startsWith("|")) {
		if (!/^\|\s*:?-{3,}:?\s*(\|\s*:?-{3,}:?\s*)+\|?$/.test(lines[index].trim())) {
			rows.push(splitTableRow(lines[index]));
		}
		index += 1;
	}
	return { rows, nextIndex: index };
}

function splitTableRow(line) {
	return line
		.trim()
		.replace(/^\|/, "")
		.replace(/\|$/, "")
		.split("|")
		.map((cell) => cell.trim().replace(/\\\|/g, "|"));
}

function renderTable(rows) {
	const [header = [], ...body] = rows;
	const head = `<thead><tr>${header.map((cell) => `<th>${inlineMarkdown(cell)}</th>`).join("")}</tr></thead>`;
	const renderedBody = body
		.map((row) => `<tr>${row.map((cell) => `<td>${inlineMarkdown(cell)}</td>`).join("")}</tr>`)
		.join("");
	return `<div class="table-wrap"><table>${head}<tbody>${renderedBody}</tbody></table></div>`;
}

function collectList(lines, start) {
	const items = [];
	let index = start;
	while (index < lines.length && lines[index].startsWith("- ")) {
		items.push(lines[index].slice(2));
		index += 1;
	}
	return { items, nextIndex: index };
}

function renderList(items) {
	return `<ul>${items.map((item) => `<li>${inlineMarkdown(item)}</li>`).join("")}</ul>`;
}

function normalizeComments(value) {
	return asArray(value?.comments)
		.map(normalizeComment)
		.filter((comment) => comment.sectionId)
		.filter((comment) => comment.status !== "unreviewed" || comment.comment.trim());
}

function normalizeComment(value) {
	const status = STATUS_VALUES.has(value?.status) ? value.status : "unreviewed";
	return {
		sectionId: String(value?.sectionId ?? "").slice(0, 120),
		sectionTitle: String(value?.sectionTitle ?? "").slice(0, 240),
		status,
		comment: String(value?.comment ?? "").slice(0, 20_000),
		updatedAt: String(value?.updatedAt ?? new Date().toISOString()),
	};
}

function asArray(value) {
	return Array.isArray(value) ? value : [];
}

export function buildCommentPacket({ reportPath, commentsPath, markdown, comments, reviewer = "browser-review" }) {
	return {
		schemaVersion: "cautilus.claim_status_comments.v1",
		reportPath,
		reportFingerprint: sha256(markdown),
		commentsPath,
		reviewer,
		savedAt: new Date().toISOString(),
		comments: normalizeComments({ comments }),
	};
}

function loadState(config) {
	const markdown = readText(config.reportPath);
	const saved = readOptionalJSON(config.commentsPath, { comments: [] });
	const reportFingerprint = sha256(markdown);
	const savedComments = savedCommentsForReport(saved, reportFingerprint);
	const sections = splitMarkdownSections(markdown).map((section) => ({
		...section,
		html: renderMarkdownFragment(section.markdown),
	}));
	return {
		reportPath: config.reportPath,
		commentsPath: config.commentsPath,
		reportFingerprint,
		commentPacketStatus: savedCommentPacketStatus(saved, reportFingerprint),
		reviewQueue: buildReviewQueue(sections),
		sections,
		comments: savedComments,
	};
}

function savedCommentsForReport(saved, reportFingerprint) {
	if (!saved || !Array.isArray(saved.comments)) {
		return [];
	}
	if (saved.reportFingerprint && saved.reportFingerprint !== reportFingerprint) {
		return [];
	}
	return normalizeComments(saved);
}

function savedCommentPacketStatus(saved, reportFingerprint) {
	if (!saved || !Array.isArray(saved.comments)) {
		return "absent";
	}
	if (saved.reportFingerprint && saved.reportFingerprint !== reportFingerprint) {
		return "stale";
	}
	return "current";
}

export function buildReviewQueue(sections) {
	const sectionIds = new Set(sections.map((section) => section.id));
	const has = (id) => sectionIds.has(id);
	const links = (...items) => items.filter((item) => has(item.id));
	const packetMarkdown = sectionMarkdown(sections, "packet");
	const refreshMarkdown = sectionMarkdown(sections, "refresh-plans");
	const nextWorkMarkdown = sectionMarkdown(sections, "next-work");
	const stalePacket = /Git state:\s*stale|stale=yes/.test(packetMarkdown);
	const changedSources = extractLatestChangedClaimSources(refreshMarkdown);
	const refreshWhy = buildRefreshWhy({ stalePacket, changedSources });
	const nextWorkWhy = buildNextWorkWhy(nextWorkMarkdown);
	return [
		{
			id: "decision-refresh-stale-claims",
			title: "1. Stale claim map handling",
			question: "Should I refresh the saved claim map before doing more review or proof work?",
			why: refreshWhy,
			whatToCheck: [
				"Open `Refresh Plans` only if you want to inspect why the packet is stale.",
				"Choose `OK` if I should refresh the claim map and continue from the fresh packet.",
				"Choose `Question` if the stale state itself looks suspicious.",
			],
			suggestedStatus: "ok",
			suggestedLabel: "OK if I should refresh and continue.",
			anchorLinks: links({ id: "refresh-plans", label: "Inspect refresh plan" }),
		},
		{
			id: "decision-human-align",
			title: "2. Human alignment bucket",
			question: "Do the `human-align-surfaces` examples look like real boundary questions, or should I relabel some as ordinary agent work?",
			why: "This bucket blocks proof until a product boundary is settled. If it is too broad, agent work stalls; if it is too narrow, Cautilus may prove the wrong thing.",
			whatToCheck: [
				"Skim the examples in `human-align-surfaces`.",
				"Comment with any boundary that is already decided or any claim that should not need human alignment.",
			],
			suggestedStatus: "question",
			suggestedLabel: "Question if the bucket boundary is too broad or too narrow.",
			anchorLinks: links(
				{ id: "human-align-surfaces", label: "Inspect alignment examples" },
				{ id: "cautilus-claims-review-result-human-align-action-bucket-json", label: "Open reviewed alignment actions" },
			),
		},
		{
			id: "decision-human-confirm",
			title: "3. Human confirm/decompose bucket",
			question: "Do any claims in `human-confirm-or-decompose` need your direct confirmation, or may I convert them into deterministic proof work?",
			why: "This bucket is where human-auditable claims either stay human-owned, get split, or become ordinary proof work. Your main job is to catch overclaims before I convert them into tests or eval scenarios.",
			whatToCheck: [
				"Skim `human-confirm-or-decompose` and the matching review-result section.",
				"Comment only if a claim should stay human-owned, be split, or be dropped.",
			],
			suggestedStatus: "needs-agent",
			suggestedLabel: "Needs agent if I may convert testable items into proof work.",
			anchorLinks: links(
				{ id: "human-confirm-or-decompose", label: "Inspect confirm/decompose examples" },
				{ id: "cautilus-claims-review-result-human-confirm-action-bucket-json", label: "Open reviewed confirm/decompose actions" },
			),
		},
		{
			id: "decision-agent-next-work",
			title: "4. Agent next work approval",
			question: "May I continue with agent-owned proof work after your comments are saved?",
			why: nextWorkWhy,
			whatToCheck: [
				"Read `Next Work` for the high-level queue.",
				"Comment with priority changes, blocked areas, or repos to dogfood first.",
			],
			suggestedStatus: "needs-agent",
			suggestedLabel: "Needs agent if the listed next-work queue is acceptable.",
			anchorLinks: links(
				{ id: "next-work", label: "Open next work queue" },
				{ id: "agent-add-deterministic-proof", label: "Deterministic proof bucket" },
				{ id: "agent-plan-cautilus-eval", label: "Eval planning bucket" },
				{ id: "agent-design-scenario", label: "Scenario design bucket" },
			),
		},
		{
			id: "decision-missing-claims",
			title: "5. Missing or wrong public claims",
			question: "Is there any important user-facing Cautilus claim missing from this report, or any claim that should not be user-facing?",
			why: "Discovery intentionally follows README/AGENTS/CLAUDE and linked Markdown. If an important public behavior is absent, that is probably a narrative/source-surface gap.",
			whatToCheck: [
				"You do not need to read every bucket for this.",
				"Write missing product promises, false positives, or wording concerns in the comment box.",
			],
			suggestedStatus: "unreviewed",
			suggestedLabel: "Leave unreviewed unless something is missing or wrong.",
			anchorLinks: links(
				{ id: "scoreboard", label: "Open summary counts" },
				{ id: "discovery-boundary", label: "Open discovery boundary" },
			),
		},
	];
}

function sectionMarkdown(sections, id) {
	return sections.find((section) => section.id === id)?.markdown ?? "";
}

function extractLatestChangedClaimSources(markdown) {
	return markdown.match(/^Latest changed claim sources:\s*(.+)$/m)?.[1]?.trim() ?? "";
}

function buildRefreshWhy({ stalePacket, changedSources }) {
	if (stalePacket && changedSources) {
		return `The report says the claim packet is stale. Latest changed claim sources: ${changedSources}.`;
	}
	if (stalePacket) {
		return "The report says the claim packet is stale. Inspect Refresh Plans before more review or proof work.";
	}
	if (changedSources) {
		return `The refresh plan lists changed claim sources: ${changedSources}.`;
	}
	return "The report does not show stale claim-source drift; inspect Refresh Plans only if you want to check recency.";
}

function buildNextWorkWhy(markdown) {
	const items = markdown
		.split(/\r?\n/)
		.map((line) => line.match(/^-\s+(.+)$/)?.[1]?.trim())
		.filter(Boolean)
		.slice(0, 3);
	if (items.length > 0) {
		return `The report's Next Work section currently lists: ${items.join(" ")}`;
	}
	return "Use the report's Next Work section to approve, redirect, or block the next agent-owned proof step.";
}

function saveComments(config, payload) {
	const markdown = readText(config.reportPath);
	const packet = buildCommentPacket({
		reportPath: config.reportPath,
		commentsPath: config.commentsPath,
		markdown,
		comments: payload.comments,
		reviewer: payload.reviewer,
	});
	fs.mkdirSync(path.dirname(config.commentsPath), { recursive: true });
	fs.writeFileSync(config.commentsPath, `${JSON.stringify(packet, null, 2)}\n`, "utf8");
	return packet;
}

function sendJSON(response, statusCode, payload) {
	const body = JSON.stringify(payload, null, 2);
	response.writeHead(statusCode, {
		"content-type": "application/json; charset=utf-8",
		"cache-control": "no-store",
	});
	response.end(body);
}

function sendHTML(response, html) {
	response.writeHead(200, {
		"content-type": "text/html; charset=utf-8",
		"cache-control": "no-store",
	});
	response.end(html);
}

function readRequestBody(request) {
	return new Promise((resolve, reject) => {
		let body = "";
		request.setEncoding("utf8");
		request.on("data", (chunk) => {
			body += chunk;
			if (body.length > 1_000_000) {
				request.destroy(new Error("request body too large"));
			}
		});
		request.on("end", () => resolve(body));
		request.on("error", reject);
	});
}

function hasAccess(requestUrl, token) {
	if (!token) {
		return true;
	}
	return requestUrl.searchParams.get("token") === token;
}

export function createReviewServer(config) {
	return http.createServer(async (request, response) => {
		try {
			const requestUrl = new URL(request.url ?? "/", `http://${request.headers.host ?? "localhost"}`);
			if (!hasAccess(requestUrl, config.token)) {
				sendJSON(response, 403, { error: "invalid token" });
				return;
			}
			await routeRequest({ request, response, requestUrl, config });
		} catch (error) {
			sendJSON(response, 500, { error: error.message });
		}
	});
}

async function routeRequest({ request, response, requestUrl, config }) {
	if (request.method === "GET" && requestUrl.pathname === "/") {
		sendHTML(response, renderPage(config));
		return;
	}
	if (request.method === "GET" && requestUrl.pathname === "/api/state") {
		sendJSON(response, 200, loadState(config));
		return;
	}
	if (request.method === "POST" && requestUrl.pathname === "/api/comments") {
		const body = await readRequestBody(request);
		sendJSON(response, 200, saveComments(config, JSON.parse(body || "{}")));
		return;
	}
	sendJSON(response, 404, { error: "not found" });
}

export function startServer(args) {
	const token = args.token || randomBytes(16).toString("hex");
	const config = {
		reportPath: args.report,
		commentsPath: args.comments,
		token,
	};
	const server = createReviewServer(config);
	server.listen(args.port, args.host, () => {
		const url = `http://${args.host}:${args.port}/?token=${encodeURIComponent(token)}`;
		console.log(`Cautilus claim review server listening at ${url}`);
		console.log(`Comments will be saved to ${args.comments}`);
		console.log(`Cloudflare tunnel: cloudflared tunnel --url http://${args.host}:${args.port}`);
		console.log(`After cloudflared prints a trycloudflare host, open https://<host>/?token=${encodeURIComponent(token)}; the bare tunnel URL returns 403.`);
	});
	return server;
}

function main() {
	const args = parseArgs(process.argv);
	if (args.help) {
		console.log(usage());
		return;
	}
	startServer(args);
}

if (import.meta.url === `file://${process.argv[1]}`) {
	main();
}
