#!/usr/bin/env node
import { createHash, randomBytes } from "node:crypto";
import fs from "node:fs";
import http from "node:http";
import path from "node:path";

const DEFAULT_REPORT = ".cautilus/claims/claim-status-report.md";
const DEFAULT_COMMENTS = ".cautilus/claims/claim-status-comments.json";
const DEFAULT_HOST = "127.0.0.1";
const DEFAULT_PORT = 17655;
const STATUS_VALUES = new Set(["unreviewed", "ok", "needs-agent", "needs-human", "question"]);

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
		.filter((comment) => comment.sectionId);
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
	return {
		reportPath: config.reportPath,
		commentsPath: config.commentsPath,
		reportFingerprint: sha256(markdown),
		sections: splitMarkdownSections(markdown).map((section) => ({
			...section,
			html: renderMarkdownFragment(section.markdown),
		})),
		comments: normalizeComments(saved),
	};
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

function renderPage(config) {
	return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Cautilus Claim Review</title>
<style>
:root{color-scheme:light dark;--bg:#f7f7f4;--panel:#ffffff;--ink:#1d1f22;--muted:#5f6670;--line:#d9ded8;--accent:#176c5f;--warn:#8a5b00}
@media (prefers-color-scheme: dark){:root{--bg:#111315;--panel:#1b1f22;--ink:#f1f3ef;--muted:#a5aca7;--line:#343b3b;--accent:#66c6b4;--warn:#e4b866}}
*{box-sizing:border-box}body{margin:0;background:var(--bg);color:var(--ink);font:16px/1.5 system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif}
header{position:sticky;top:0;z-index:2;background:var(--panel);border-bottom:1px solid var(--line);padding:12px 16px}
.bar{display:flex;gap:12px;align-items:center;justify-content:space-between;max-width:1180px;margin:0 auto}.title{font-weight:700}.meta{color:var(--muted);font-size:13px}
button{border:1px solid var(--accent);background:var(--accent);color:white;border-radius:6px;padding:9px 13px;font-weight:650}button.secondary{background:transparent;color:var(--accent)}
main{display:grid;grid-template-columns:minmax(0,1fr) 320px;gap:16px;max-width:1180px;margin:0 auto;padding:16px}
nav{position:sticky;top:70px;align-self:start;background:var(--panel);border:1px solid var(--line);border-radius:8px;padding:12px;max-height:calc(100vh - 92px);overflow:auto}
nav a{display:block;color:var(--ink);text-decoration:none;padding:7px 6px;border-radius:5px;font-size:14px}nav a:hover{background:color-mix(in srgb,var(--accent) 12%,transparent)}
section{background:var(--panel);border:1px solid var(--line);border-radius:8px;margin:0 0 14px;padding:14px}h1,h2,h3{line-height:1.2;margin:0 0 12px}h1{font-size:24px}h2{font-size:20px}h3{font-size:18px}
p,ul{margin:0 0 12px}.table-wrap{overflow:auto;margin:10px 0 14px}table{border-collapse:collapse;width:100%;font-size:14px}th,td{border:1px solid var(--line);padding:7px;vertical-align:top}th{background:color-mix(in srgb,var(--accent) 10%,transparent);text-align:left}code{font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-size:.92em}
.comment{border-top:1px solid var(--line);margin-top:14px;padding-top:12px;display:grid;gap:8px}select,textarea,input{width:100%;border:1px solid var(--line);border-radius:6px;background:var(--bg);color:var(--ink);padding:9px;font:inherit}textarea{min-height:90px;resize:vertical}.status{font-size:13px;color:var(--muted)}.dirty{color:var(--warn)}.saved{color:var(--accent)}
@media(max-width:860px){main{display:block;padding:10px}nav{position:static;max-height:none;margin-bottom:12px}.bar{align-items:flex-start;flex-direction:column}header{position:static}section{border-radius:6px;padding:12px}table{font-size:13px}button{width:100%}}
</style>
</head>
<body>
<header><div class="bar"><div><div class="title">Cautilus Claim Review</div><div class="meta">${escapeHTML(config.reportPath)} -> ${escapeHTML(config.commentsPath)}</div></div><div><button id="save">Save comments</button></div></div></header>
<main><div id="content"></div><nav id="toc"></nav></main>
<script>
const token = new URLSearchParams(location.search).get("token") || ${JSON.stringify(config.token)};
const api = (path) => path + (token ? "?token=" + encodeURIComponent(token) : "");
let comments = new Map();
let dirty = false;
function esc(value){return String(value ?? "").replace(/[&<>"']/g, ch => ({"&":"&amp;","<":"&lt;",">":"&gt;","\\"":"&quot;","'":"&#39;"}[ch]));}
function statusText(){document.querySelector(".title").textContent = dirty ? "Cautilus Claim Review *" : "Cautilus Claim Review";}
function setDirty(value){dirty = value; statusText();}
function commentFor(section){return comments.get(section.id) || {sectionId: section.id, sectionTitle: section.title, status:"unreviewed", comment:""};}
function render(data){
 comments = new Map((data.comments || []).map(item => [item.sectionId, item]));
 const toc = document.getElementById("toc");
 const content = document.getElementById("content");
 toc.innerHTML = "";
 content.innerHTML = "";
 for (const section of data.sections) {
  const c = commentFor(section);
  const link = document.createElement("a");
  link.href = "#" + section.id;
  link.textContent = section.title;
  toc.appendChild(link);
  const el = document.createElement("section");
  el.id = section.id;
  el.innerHTML = '<h' + Math.min(section.level + 1, 3) + '>' + esc(section.title) + '</h' + Math.min(section.level + 1, 3) + '>' + section.html +
   '<div class="comment"><label>Status<select data-field="status" data-section="' + esc(section.id) + '">' +
   '<option value="unreviewed">Unreviewed</option><option value="ok">OK</option><option value="needs-agent">Needs agent</option><option value="needs-human">Needs human</option><option value="question">Question</option>' +
   '</select></label><label>Comment<textarea data-field="comment" data-section="' + esc(section.id) + '" placeholder="Leave review notes for this section"></textarea></label><div class="status" data-status="' + esc(section.id) + '"></div></div>';
  content.appendChild(el);
  el.querySelector('select').value = c.status || "unreviewed";
  el.querySelector('textarea').value = c.comment || "";
 }
 document.querySelectorAll("[data-field]").forEach(input => input.addEventListener("input", updateComment));
 setDirty(false);
}
function updateComment(event){
 const sectionId = event.target.dataset.section;
 const existing = comments.get(sectionId) || {sectionId, sectionTitle: document.querySelector("#" + CSS.escape(sectionId) + " h2,#" + CSS.escape(sectionId) + " h3")?.textContent || sectionId};
 existing[event.target.dataset.field] = event.target.value;
 existing.updatedAt = new Date().toISOString();
 comments.set(sectionId, existing);
 setDirty(true);
}
async function save(){
 const response = await fetch(api("/api/comments"), {method:"POST", headers:{"content-type":"application/json"}, body: JSON.stringify({comments:[...comments.values()], reviewer:"mobile-browser-review"})});
 const result = await response.json();
 if (!response.ok) throw new Error(result.error || "save failed");
 setDirty(false);
 document.querySelectorAll(".status").forEach(node => node.textContent = "Saved " + result.savedAt);
}
document.getElementById("save").addEventListener("click", () => save().catch(error => alert(error.message)));
fetch(api("/api/state")).then(r => r.json()).then(render).catch(error => document.getElementById("content").textContent = error.message);
</script>
</body>
</html>`;
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
