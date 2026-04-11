import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import process from "node:process";

const SCRIPT_DIR = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(SCRIPT_DIR, "..");
const DEFAULT_LATEST_DIR = join(REPO_ROOT, "artifacts", "self-dogfood", "latest");

const STATUS_LABELS = {
	pass: "pass",
	concern: "concern",
	blocker: "blocker",
};

const STATUS_COLORS = {
	pass: "#1b7f3a",
	concern: "#a65d00",
	blocker: "#a4161a",
	unknown: "#444c56",
};

function usage(exitCode = 0) {
	const text = [
		"Usage:",
		"  node ./scripts/render-self-dogfood-html.mjs [--latest-dir <dir>] [--output <path>]",
		"",
		"Reads summary.json, report.json, and review-summary.json from --latest-dir",
		"(default artifacts/self-dogfood/latest) and writes a self-contained index.html",
		"into the same directory unless --output is given.",
	].join("\n");
	const out = exitCode === 0 ? process.stdout : process.stderr;
	out.write(`${text}\n`);
	process.exit(exitCode);
}

function fail(message) {
	process.stderr.write(`${message}\n`);
	process.exit(1);
}

function parseArgs(argv) {
	const options = {
		latestDir: DEFAULT_LATEST_DIR,
		output: null,
	};
	for (let index = 0; index < argv.length; index += 1) {
		const arg = argv[index];
		if (arg === "-h" || arg === "--help") {
			usage(0);
		} else if (arg === "--latest-dir") {
			const value = argv[index + 1];
			if (!value) {
				fail(`Missing value for ${arg}`);
			}
			options.latestDir = resolve(value);
			index += 1;
		} else if (arg === "--output") {
			const value = argv[index + 1];
			if (!value) {
				fail(`Missing value for ${arg}`);
			}
			options.output = resolve(value);
			index += 1;
		} else {
			fail(`Unknown argument: ${arg}`);
		}
	}
	return options;
}

function readJson(path, label) {
	if (!existsSync(path)) {
		fail(`${label} not found: ${path}`);
	}
	try {
		return JSON.parse(readFileSync(path, "utf-8"));
	} catch (error) {
		fail(`${label} is not valid JSON: ${path}\n${error.message}`);
		return null;
	}
}

function escapeHtml(value) {
	if (value === null || value === undefined) {
		return "";
	}
	return String(value)
		.replace(/&/g, "&amp;")
		.replace(/</g, "&lt;")
		.replace(/>/g, "&gt;")
		.replace(/"/g, "&quot;")
		.replace(/'/g, "&#39;");
}

function statusColor(status) {
	if (typeof status !== "string") {
		return STATUS_COLORS.unknown;
	}
	return STATUS_COLORS[status] ?? STATUS_COLORS.unknown;
}

function statusLabel(status) {
	if (typeof status !== "string" || status.length === 0) {
		return "n/a";
	}
	return STATUS_LABELS[status] ?? status;
}

function formatDuration(ms) {
	if (typeof ms !== "number" || Number.isNaN(ms)) {
		return "n/a";
	}
	if (ms < 1000) {
		return `${ms}ms`;
	}
	const seconds = ms / 1000;
	if (seconds < 60) {
		return `${seconds.toFixed(2)}s`;
	}
	const minutes = Math.floor(seconds / 60);
	const remaining = (seconds - minutes * 60).toFixed(1);
	return `${minutes}m ${remaining}s`;
}

function renderHeader(summary) {
	const status = escapeHtml(statusLabel(summary.overallStatus));
	const color = statusColor(summary.overallStatus);
	return `
<header class="banner" style="border-left:8px solid ${color}">
	<div class="banner-title">Cautilus Self-Dogfood</div>
	<div class="banner-status">
		<span class="chip" data-status="overallStatus" style="background:${color}">${status}</span>
		<span class="banner-meta">runId ${escapeHtml(summary.runId ?? "n/a")}</span>
		<span class="banner-meta">generatedAt ${escapeHtml(summary.generatedAt ?? "n/a")}</span>
	</div>
</header>`;
}

function renderDimensionList(label, dimensions) {
	if (!Array.isArray(dimensions) || dimensions.length === 0) {
		return "";
	}
	const items = dimensions
		.map((dim) => `<code>${escapeHtml(dim?.id ?? "")}</code>`)
		.join(", ");
	return `<dd><strong>${escapeHtml(label)}:</strong> ${items}</dd>`;
}

function renderIntentProfileRows(profile) {
	if (!profile || typeof profile !== "object") {
		return "";
	}
	const surfaceRow = profile.behaviorSurface
		? `<dd><strong>behaviorSurface:</strong> ${escapeHtml(profile.behaviorSurface)}</dd>`
		: "";
	const successRow = renderDimensionList("successDimensions", profile.successDimensions);
	const guardrailRow = renderDimensionList("guardrailDimensions", profile.guardrailDimensions);
	return `${surfaceRow}${successRow}${guardrailRow}`;
}

function renderIntentPanel(summary, report) {
	const intent = summary.intent ?? report.intent ?? "n/a";
	const profileRows = renderIntentProfileRows(report.intentProfile ?? null);
	const overallColor = statusColor(summary.overallStatus);
	const overallText = escapeHtml(statusLabel(summary.overallStatus));
	return `
<section class="panel" aria-labelledby="intent-heading">
	<h2 id="intent-heading">Intent</h2>
	<p class="intent-text" data-field="intent">${escapeHtml(intent)}</p>
	<dl class="meta-grid">
		<dt>overallStatus</dt>
		<dd><span class="chip" data-status="overallStatusChip" style="background:${overallColor}">${overallText}</span></dd>
		<dt>gateRecommendation</dt>
		<dd data-field="gateRecommendation">${escapeHtml(summary.gateRecommendation ?? "n/a")}</dd>
		<dt>reportRecommendation</dt>
		<dd data-field="reportRecommendation">${escapeHtml(summary.reportRecommendation ?? "n/a")}</dd>
		<dt>baselineRef</dt>
		<dd>${escapeHtml(summary.baselineRef ?? "n/a")}</dd>
		${profileRows}
	</dl>
</section>`;
}

function renderObservations(report) {
	const observations = Array.isArray(report.commandObservations) ? report.commandObservations : [];
	if (observations.length === 0) {
		return `
<section class="panel" aria-labelledby="observations-heading">
	<h2 id="observations-heading">Command Observations</h2>
	<p class="empty">No command observations recorded.</p>
</section>`;
	}
	const rows = observations
		.map((obs) => `
		<tr data-observation="${escapeHtml(obs.stage ?? "")}-${escapeHtml(obs.index ?? "")}">
			<td>${escapeHtml(obs.stage ?? "n/a")}</td>
			<td>${escapeHtml(obs.index ?? "")}</td>
			<td><span class="chip" style="background:${statusColor(obs.status === "passed" ? "pass" : obs.status)}">${escapeHtml(obs.status ?? "n/a")}</span></td>
			<td><code>${escapeHtml(obs.command ?? "n/a")}</code></td>
			<td>${escapeHtml(formatDuration(obs.durationMs))}</td>
			<td>${escapeHtml(obs.exitCode ?? "n/a")}</td>
		</tr>`)
		.join("");
	return `
<section class="panel" aria-labelledby="observations-heading">
	<h2 id="observations-heading">Command Observations</h2>
	<table class="data-table">
		<thead>
			<tr>
				<th>stage</th>
				<th>#</th>
				<th>status</th>
				<th>command</th>
				<th>duration</th>
				<th>exit</th>
			</tr>
		</thead>
		<tbody>${rows}
		</tbody>
	</table>
</section>`;
}

function renderFindings(findings) {
	if (!Array.isArray(findings) || findings.length === 0) {
		return `<p class="empty">No findings recorded.</p>`;
	}
	const items = findings
		.map((finding) => {
			const severity = finding?.severity ?? "unknown";
			const color = statusColor(severity === "pass" ? "pass" : severity);
			return `
		<li class="finding" data-severity="${escapeHtml(severity)}">
			<span class="chip" style="background:${color}">${escapeHtml(severity)}</span>
			<div class="finding-body">
				<div class="finding-message">${escapeHtml(finding?.message ?? "")}</div>
				${finding?.path ? `<div class="finding-path"><code>${escapeHtml(finding.path)}</code></div>` : ""}
			</div>
		</li>`;
		})
		.join("");
	return `<ul class="findings">${items}
	</ul>`;
}

function normalizeVariant(variant) {
	const output = variant.output ?? {};
	const findings = Array.isArray(output.findings) ? output.findings : [];
	const execStatus = variant.status === "passed" ? "pass" : variant.status;
	return {
		id: variant.id ?? "",
		displayId: variant.id ?? "n/a",
		tool: variant.tool ?? "n/a",
		status: variant.status ?? "n/a",
		execColor: statusColor(execStatus),
		verdictLabel: output.verdict ?? "n/a",
		verdictColor: statusColor(output.verdict ?? null),
		findings,
		findingsCount: findings.length,
		summaryText: output.summary ?? "",
		duration: formatDuration(variant.durationMs),
	};
}

function renderVariantBlock(variant) {
	const info = normalizeVariant(variant);
	return `
	<article class="variant" data-variant="${escapeHtml(info.id)}">
		<header class="variant-header">
			<h3>${escapeHtml(info.displayId)} <small>(${escapeHtml(info.tool)})</small></h3>
			<div class="variant-chips">
				<span class="chip" data-status="executionStatus" style="background:${info.execColor}">execution: ${escapeHtml(info.status)}</span>
				<span class="chip" data-status="verdict" style="background:${info.verdictColor}">verdict: ${escapeHtml(info.verdictLabel)}</span>
				<span class="chip neutral">findings: ${info.findingsCount}</span>
				<span class="chip neutral">duration: ${escapeHtml(info.duration)}</span>
			</div>
		</header>
		<p class="variant-summary">${escapeHtml(info.summaryText)}</p>
		${renderFindings(info.findings)}
	</article>`;
}

function renderTelemetryLine(telemetry, fallbackCount) {
	if (!telemetry || typeof telemetry !== "object") {
		return "";
	}
	const variantCount = escapeHtml(telemetry.variantCount ?? fallbackCount);
	const passedCount = escapeHtml(telemetry.passedVariantCount ?? "n/a");
	const failedCount = escapeHtml(telemetry.failedVariantCount ?? "n/a");
	const total = escapeHtml(formatDuration(telemetry.durationMs));
	return `<p class="telemetry">variants ${variantCount} · passed ${passedCount} · failed ${failedCount} · total ${total}</p>`;
}

function renderReviewVariants(summary, reviewSummary) {
	const variants = Array.isArray(reviewSummary.variants) ? reviewSummary.variants : [];
	if (variants.length === 0) {
		return `
<section class="panel" aria-labelledby="review-heading">
	<h2 id="review-heading">Review Variants</h2>
	<p class="empty">No review variants recorded.</p>
</section>`;
	}
	const blocks = variants.map((variant) => renderVariantBlock(variant)).join("");
	const telemetry = reviewSummary.telemetry ?? summary.reviewTelemetry ?? null;
	const telemetryLine = renderTelemetryLine(telemetry, variants.length);
	return `
<section class="panel" aria-labelledby="review-heading">
	<h2 id="review-heading">Review Variants</h2>
	${telemetryLine}
	${blocks}
</section>`;
}

function renderFooter(summary) {
	return `
<footer class="footer">
	<p>Generated from <code>summary.json</code>, <code>report.json</code>, and <code>review-summary.json</code>.
	Do not hand-edit this file — rerun <code>npm run dogfood:self:html</code> to refresh.</p>
	<p class="footer-paths">
		<span>artifactRoot: <code>${escapeHtml(summary.artifactRoot ?? "n/a")}</code></span>
	</p>
</footer>`;
}

const STYLES = `
:root { color-scheme: light dark; }
body {
	font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
	margin: 0;
	background: #f6f8fa;
	color: #1f2328;
	line-height: 1.5;
}
main { max-width: 960px; margin: 0 auto; padding: 24px 16px 48px; }
.banner {
	background: #ffffff;
	padding: 20px 24px;
	border-radius: 8px;
	box-shadow: 0 1px 3px rgba(0,0,0,0.08);
	margin-bottom: 20px;
}
.banner-title { font-size: 22px; font-weight: 600; margin-bottom: 8px; }
.banner-status { display: flex; flex-wrap: wrap; gap: 12px; align-items: center; }
.banner-meta { color: #5a6472; font-size: 13px; font-variant-numeric: tabular-nums; }
.chip {
	display: inline-block;
	color: #ffffff;
	padding: 2px 10px;
	border-radius: 999px;
	font-size: 12px;
	font-weight: 600;
	letter-spacing: 0.02em;
	text-transform: lowercase;
}
.chip.neutral { background: #444c56; }
.panel {
	background: #ffffff;
	padding: 20px 24px;
	border-radius: 8px;
	box-shadow: 0 1px 3px rgba(0,0,0,0.08);
	margin-bottom: 20px;
}
.panel h2 { margin-top: 0; font-size: 16px; text-transform: uppercase; letter-spacing: 0.06em; color: #5a6472; }
.intent-text { font-size: 16px; margin: 0 0 16px; }
.meta-grid {
	display: grid;
	grid-template-columns: max-content 1fr;
	gap: 4px 16px;
	margin: 0;
	font-size: 14px;
}
.meta-grid dt { color: #5a6472; }
.meta-grid dd { margin: 0; }
.data-table { width: 100%; border-collapse: collapse; font-size: 13px; }
.data-table th, .data-table td { text-align: left; padding: 8px 10px; border-bottom: 1px solid #e4e8ed; vertical-align: top; }
.data-table th { font-weight: 600; color: #5a6472; }
.data-table code { font-size: 12px; }
.empty { color: #6e7781; font-style: italic; }
.variant {
	border: 1px solid #e4e8ed;
	border-radius: 6px;
	padding: 14px 18px;
	margin-top: 12px;
}
.variant-header h3 { margin: 0 0 8px; font-size: 15px; }
.variant-chips { display: flex; flex-wrap: wrap; gap: 6px; margin-bottom: 8px; }
.variant-summary { margin: 8px 0; white-space: pre-wrap; }
.findings { list-style: none; padding: 0; margin: 0; display: flex; flex-direction: column; gap: 8px; }
.finding { display: flex; gap: 10px; align-items: flex-start; padding: 8px 10px; background: #f6f8fa; border-radius: 6px; }
.finding-body { flex: 1; }
.finding-message { font-size: 13px; }
.finding-path { font-size: 12px; color: #6e7781; margin-top: 2px; }
.telemetry { font-size: 12px; color: #6e7781; margin: 0 0 12px; }
.footer { margin-top: 24px; font-size: 12px; color: #6e7781; }
.footer code { background: rgba(175, 184, 193, 0.2); padding: 0 4px; border-radius: 3px; }
code { font-family: ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, monospace; }
@media (prefers-color-scheme: dark) {
	body { background: #0d1117; color: #e6edf3; }
	.banner, .panel, .variant { background: #161b22; box-shadow: 0 1px 3px rgba(0,0,0,0.4); }
	.banner-meta, .panel h2, .meta-grid dt, .data-table th, .footer, .finding-path, .telemetry, .empty { color: #9198a1; }
	.data-table th, .data-table td { border-bottom-color: #30363d; }
	.variant { border-color: #30363d; }
	.finding { background: #0d1117; }
	.footer code { background: rgba(110, 118, 129, 0.4); }
}
`;

export function renderHtml({ summary, report, reviewSummary }) {
	const title = `Cautilus Self-Dogfood — ${statusLabel(summary.overallStatus)}`;
	return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="generator" content="scripts/render-self-dogfood-html.mjs">
<title>${escapeHtml(title)}</title>
<style>${STYLES}</style>
</head>
<body>
<main>
${renderHeader(summary)}
${renderIntentPanel(summary, report)}
${renderObservations(report)}
${renderReviewVariants(summary, reviewSummary)}
${renderFooter(summary)}
</main>
</body>
</html>
`;
}

export function renderSelfDogfoodHtmlFromDir(latestDir) {
	const summary = readJson(join(latestDir, "summary.json"), "summary.json");
	const report = readJson(join(latestDir, "report.json"), "report.json");
	const reviewSummary = readJson(join(latestDir, "review-summary.json"), "review-summary.json");
	return renderHtml({ summary, report, reviewSummary });
}

export function writeSelfDogfoodHtml(latestDir, outputPath = null) {
	const html = renderSelfDogfoodHtmlFromDir(latestDir);
	const resolvedOutput = outputPath ?? join(latestDir, "index.html");
	writeFileSync(resolvedOutput, html, "utf-8");
	return resolvedOutput;
}

function main(argv = process.argv.slice(2)) {
	const options = parseArgs(argv);
	const outputPath = writeSelfDogfoodHtml(options.latestDir, options.output);
	process.stdout.write(`${outputPath}\n`);
}

const entryHref = process.argv[1] ? new URL(`file://${process.argv[1]}`).href : "";
if (import.meta.url === entryHref) {
	main();
}
