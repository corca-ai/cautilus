function escapeHTML(value) {
	return String(value)
		.replace(/&/g, "&amp;")
		.replace(/</g, "&lt;")
		.replace(/>/g, "&gt;")
		.replace(/"/g, "&quot;");
}

export function renderPage(config) {
	return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Cautilus Review Decisions</title>
<style>
:root{color-scheme:light dark;--bg:#f6f7f4;--panel:#ffffff;--soft:#eef3ef;--ink:#1d1f22;--muted:#5f6670;--line:#d9ded8;--accent:#176c5f;--warn:#8a5b00}
@media (prefers-color-scheme: dark){:root{--bg:#111315;--panel:#1b1f22;--soft:#202825;--ink:#f1f3ef;--muted:#a5aca7;--line:#343b3b;--accent:#66c6b4;--warn:#e4b866}}
*{box-sizing:border-box}body{margin:0;background:var(--bg);color:var(--ink);font:16px/1.5 system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif}
header{position:sticky;top:0;z-index:2;background:var(--panel);border-bottom:1px solid var(--line);padding:12px 16px}
.bar{display:flex;gap:12px;align-items:center;justify-content:space-between;max-width:1180px;margin:0 auto}.title{font-weight:700}.meta{color:var(--muted);font-size:13px}
button{border:1px solid var(--accent);background:var(--accent);color:white;border-radius:6px;padding:9px 13px;font-weight:650}button.secondary{background:transparent;color:var(--accent)}
main{display:grid;grid-template-columns:minmax(0,1fr) 280px;gap:16px;max-width:1180px;margin:0 auto;padding:16px 16px 86px}
nav{position:sticky;top:70px;align-self:start;background:var(--panel);border:1px solid var(--line);border-radius:8px;padding:12px;max-height:calc(100vh - 92px);overflow:auto}
nav a{display:block;color:var(--ink);text-decoration:none;padding:7px 6px;border-radius:5px;font-size:14px}nav a:hover{background:color-mix(in srgb,var(--accent) 12%,transparent)}
section{background:var(--panel);border:1px solid var(--line);border-radius:8px;margin:0 0 14px;padding:14px}h1,h2,h3{line-height:1.2;margin:0 0 12px}h1{font-size:24px}h2{font-size:20px}h3{font-size:18px}
p,ul{margin:0 0 12px}.table-wrap{overflow:auto;margin:10px 0 14px}table{border-collapse:collapse;width:100%;font-size:14px}th,td{border:1px solid var(--line);padding:7px;vertical-align:top}th{background:color-mix(in srgb,var(--accent) 10%,transparent);text-align:left}code{font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-size:.92em}
.comment{border-top:1px solid var(--line);margin-top:14px;padding-top:12px;display:grid;gap:8px}select,textarea,input{width:100%;border:1px solid var(--line);border-radius:6px;background:var(--bg);color:var(--ink);padding:9px;font:inherit}textarea{min-height:90px;resize:vertical}.status{font-size:13px;color:var(--muted)}.dirty{color:var(--warn)}.saved{color:var(--accent)}
.intro{background:var(--soft);border:1px solid var(--line);border-radius:8px;padding:14px;margin-bottom:14px}.intro strong{display:block;font-size:18px;margin-bottom:6px}
.queue-card{border-left:5px solid var(--accent)}.question{font-size:18px;font-weight:720;margin-bottom:8px}.why{color:var(--muted);margin-bottom:10px}.suggested{display:inline-block;border:1px solid var(--line);border-radius:999px;background:var(--soft);padding:4px 9px;margin:0 0 10px;color:var(--muted);font-size:13px}.checklist{padding-left:20px}.jump-row{display:flex;gap:8px;flex-wrap:wrap;margin:8px 0 12px}.jump{border:1px solid var(--line);border-radius:999px;padding:5px 9px;color:var(--accent);text-decoration:none;font-size:13px;background:var(--soft)}
.detail-shell{margin-top:18px}.detail-shell>summary{cursor:pointer;font-weight:720;background:var(--panel);border:1px solid var(--line);border-radius:8px;padding:12px;margin-bottom:12px}.reference-section .comment{display:none}.reference-section{opacity:.96}
.savebar{position:fixed;left:0;right:0;bottom:0;z-index:3;background:var(--panel);border-top:1px solid var(--line);padding:10px 16px}.savebar-inner{max-width:1180px;margin:0 auto;display:flex;gap:12px;align-items:center;justify-content:space-between}
@media(max-width:860px){main{display:block;padding:10px 10px 92px}nav{position:static;max-height:none;margin-bottom:12px}.bar{align-items:flex-start;flex-direction:column}header{position:static}section{border-radius:6px;padding:12px}table{font-size:13px}button{width:100%}.question{font-size:17px}.meta{overflow-wrap:anywhere}.jump-row{display:block}.jump{display:block;margin:6px 0}.savebar-inner{display:block}.savebar button{margin-top:8px}}
</style>
</head>
<body>
<header><div class="bar"><div><div class="title">Cautilus Review Decisions</div><div class="meta">${escapeHTML(config.reportPath)} -> ${escapeHTML(config.commentsPath)}</div></div><div><button id="save">Save decisions</button></div></div></header>
<main><div id="content"></div><nav id="toc"></nav></main>
<div id="savebar" class="savebar"><div class="savebar-inner"><div id="save-state" class="status">No changes saved yet</div><button id="save-bottom">Save decisions</button></div></div>
<script>
const token = new URLSearchParams(location.search).get("token") || ${JSON.stringify(config.token)};
const api = (path) => path + (token ? "?token=" + encodeURIComponent(token) : "");
let comments = new Map();
let dirty = false;
function esc(value){return String(value ?? "").replace(/[&<>"']/g, ch => ({"&":"&amp;","<":"&lt;",">":"&gt;","\\"":"&quot;","'":"&#39;"}[ch]));}
function statusText(){document.querySelector(".title").textContent = dirty ? "Cautilus Review Decisions *" : "Cautilus Review Decisions";}
function setDirty(value){dirty = value; statusText(); const state = document.getElementById("save-state"); if (state) { state.textContent = dirty ? "Unsaved changes" : "No unsaved changes"; state.className = dirty ? "status dirty" : "status"; }}
function commentFor(section){return comments.get(section.id) || {sectionId: section.id, sectionTitle: section.title, status:"unreviewed", comment:""};}
function render(data){
 comments = new Map((data.comments || []).map(item => [item.sectionId, item]));
 const toc = document.getElementById("toc");
 const content = document.getElementById("content");
 toc.innerHTML = "";
 content.innerHTML = "";
 renderDecisionQueue(content, data);
 const detail = document.createElement("details");
 detail.className = "detail-shell";
 detail.innerHTML = '<summary>Reference report details</summary>';
 for (const section of data.sections) {
  const c = commentFor(section);
  const link = document.createElement("a");
  link.href = "#" + section.id;
  link.textContent = section.title;
  link.addEventListener("click", () => { detail.open = true; });
  toc.appendChild(link);
  const el = document.createElement("section");
  el.className = "reference-section";
  el.id = section.id;
  el.innerHTML = '<h' + Math.min(section.level + 1, 3) + '>' + esc(section.title) + '</h' + Math.min(section.level + 1, 3) + '>' + section.html +
   '<div class="comment"><label>Status<select data-field="status" data-section="' + esc(section.id) + '">' +
   '<option value="unreviewed">Unreviewed</option><option value="ok">OK</option><option value="needs-agent">Needs agent</option><option value="needs-human">Needs human</option><option value="question">Question</option>' +
   '</select></label><label>Comment<textarea data-field="comment" data-section="' + esc(section.id) + '" placeholder="Leave review notes for this section"></textarea></label><div class="status" data-status="' + esc(section.id) + '"></div></div>';
  detail.appendChild(el);
  el.querySelector('select').value = c.status || "unreviewed";
  el.querySelector('textarea').value = c.comment || "";
 }
 content.appendChild(detail);
 document.querySelectorAll("[data-field]").forEach(input => input.addEventListener("input", updateComment));
 document.querySelectorAll("[data-anchor]").forEach(link => link.addEventListener("click", () => { detail.open = true; }));
 setDirty(false);
}
function renderDecisionQueue(content, data){
 const queue = data.reviewQueue || [];
 const intro = document.createElement("div");
 intro.className = "intro";
 const staleWarning = data.commentPacketStatus === "stale" ? '<p><b>Saved comments were from an older report and were not loaded.</b></p>' : "";
 intro.innerHTML = '<strong>What I need from you</strong><p>Answer only the cards below. You do not need to read the full report unless a card asks you to inspect a linked detail.</p><p>Use <b>OK</b> to approve, <b>Needs agent</b> when I should handle it, <b>Needs human</b> when you want to keep it as your decision, and <b>Question</b> when the framing is wrong or unclear.</p>' + staleWarning + '<p>This page requires the token in the URL. A bare tunnel URL will return 403.</p>';
 content.appendChild(intro);
 for (const item of queue) {
  const c = comments.get(item.id) || {sectionId:item.id, sectionTitle:item.title, status:"unreviewed", comment:""};
  const el = document.createElement("section");
  el.className = "queue-card";
  el.id = item.id;
  const anchors = (item.anchorLinks || []).map(link => '<a class="jump" data-anchor="true" href="#' + esc(link.id) + '">' + esc(link.label) + '</a>').join("");
  const checklist = (item.whatToCheck || []).map(text => '<li>' + esc(text) + '</li>').join("");
  const suggested = item.suggestedLabel ? '<div class="suggested">Suggested: ' + esc(item.suggestedLabel) + '</div>' : "";
  el.innerHTML = '<h2>' + esc(item.title) + '</h2><div class="question">' + esc(item.question) + '</div><p class="why">' + esc(item.why) + '</p>' + suggested + '<ul class="checklist">' + checklist + '</ul><div class="jump-row">' + anchors + '</div>' + decisionControl(item.id, c);
  content.appendChild(el);
  el.querySelector('select').value = c.status || "unreviewed";
  el.querySelector('textarea').value = c.comment || "";
 }
}
function decisionControl(id, c){
 return '<div class="comment"><label>Decision<select data-field="status" data-section="' + esc(id) + '">' +
 '<option value="unreviewed">Unreviewed</option><option value="ok">OK / approved</option><option value="needs-agent">Needs agent</option><option value="needs-human">Needs human</option><option value="question">Question / wrong framing</option><option value="skip">Skip for now</option>' +
 '</select></label><label>Your comment<textarea data-field="comment" data-section="' + esc(id) + '" placeholder="What should I do differently, continue, or stop?"></textarea></label><div class="status" data-status="' + esc(id) + '"></div></div>';
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
 const commentsToSave = [...comments.values()].filter(comment => (comment.comment || "").trim() || (comment.status && comment.status !== "unreviewed"));
 const response = await fetch(api("/api/comments"), {method:"POST", headers:{"content-type":"application/json"}, body: JSON.stringify({comments:commentsToSave, reviewer:"mobile-browser-review"})});
 const result = await response.json();
 if (!response.ok) throw new Error(result.error || "save failed");
 setDirty(false);
 document.querySelectorAll(".status").forEach(node => { node.textContent = "Saved " + result.savedAt; node.className = "status saved"; });
}
document.getElementById("save").addEventListener("click", () => save().catch(error => alert(error.message)));
document.getElementById("save-bottom").addEventListener("click", () => save().catch(error => alert(error.message)));
fetch(api("/api/state")).then(r => r.json()).then(render).catch(error => document.getElementById("content").textContent = error.message);
</script>
</body>
</html>`;
}
