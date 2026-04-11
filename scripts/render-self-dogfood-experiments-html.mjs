import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import process from "node:process";

const SCRIPT_DIR = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(SCRIPT_DIR, "..");
const DEFAULT_LATEST_DIR = join(REPO_ROOT, "artifacts", "self-dogfood", "experiments", "latest");

const STATUS_LABELS = {
	pass: "pass",
	concern: "concern",
	blocker: "blocker",
	passed: "passed",
	failed: "failed",
};

const STATUS_COLORS = {
	pass: "#1b7f3a",
	passed: "#1b7f3a",
	accept: "#1b7f3a",
	concern: "#a65d00",
	defer: "#a65d00",
	blocker: "#a4161a",
	failed: "#a4161a",
	reject: "#a4161a",
	unknown: "#444c56",
};

function usage(exitCode = 0) {
	const text = [
		"Usage:",
		"  node ./scripts/render-self-dogfood-experiments-html.mjs [--latest-dir <dir>] [--output <path>]",
		"",
		"Reads summary.json and report.json from --latest-dir",
		"(default artifacts/self-dogfood/experiments/latest) and writes a self-contained index.html",
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

function gateStatusFromRecommendation(recommendation) {
	if (recommendation === "accept-now") {
		return "pass";
	}
	if (recommendation === "defer") {
		return "concern";
	}
	return "blocker";
}

function renderHeader(summary) {
	const status = escapeHtml(statusLabel(summary.overallStatus));
	const color = statusColor(summary.overallStatus);
	return `
<header class="banner" style="border-left:8px solid ${color}">
	<div class="banner-title">Cautilus Self-Dogfood Experiments</div>
	<div class="banner-status">
		<span class="chip" data-status="overallStatus" style="background:${color}">${status}</span>
		<span class="banner-meta">runId ${escapeHtml(summary.runId ?? "n/a")}</span>
		<span class="banner-meta">generatedAt ${escapeHtml(summary.generatedAt ?? "n/a")}</span>
	</div>
</header>`;
}

function renderIntentPanel(summary, report) {
	return `
<section class="panel" aria-labelledby="intent-heading">
	<h2 id="intent-heading">Intent</h2>
	<p class="intent-text" data-field="intent">${escapeHtml(summary.intent ?? report.intent ?? "n/a")}</p>
	<dl class="meta-grid">
		<dt>baselineRef</dt>
		<dd>${escapeHtml(summary.baselineRef ?? "n/a")}</dd>
		<dt>gateRecommendation</dt>
		<dd data-field="gateRecommendation">${escapeHtml(summary.gateRecommendation ?? "n/a")}</dd>
		<dt>reportRecommendation</dt>
		<dd data-field="reportRecommendation">${escapeHtml(summary.reportRecommendation ?? "n/a")}</dd>
		<dt>experimentCount</dt>
		<dd>${escapeHtml(Array.isArray(summary.experiments) ? summary.experiments.length : 0)}</dd>
	</dl>
</section>`;
}

function comparisonRows(summary) {
	const rows = [];
	rows.push({
		key: "deterministic-gate",
		label: "deterministic gate",
		role: "baseline",
		executionStatus: "passed",
		verdict: gateStatusFromRecommendation(summary.gateRecommendation),
		findingsCount: "n/a",
		duration: formatDuration(summary.modeTelemetry?.durationMs),
		summary: `full_gate recommendation: ${summary.gateRecommendation ?? "n/a"}`,
	});
	for (const experiment of Array.isArray(summary.experiments) ? summary.experiments : []) {
		rows.push({
			key: experiment.adapterName ?? "experiment",
			label: experiment.adapterName ?? "experiment",
			role: "candidate",
			executionStatus: experiment.executionStatus ?? "n/a",
			verdict: experiment.overallStatus ?? "n/a",
			findingsCount: experiment.findingsCount ?? "n/a",
			duration: formatDuration(experiment.telemetry?.durationMs),
			summary: experiment.primarySummary ?? "n/a",
		});
	}
	return rows;
}

function renderComparison(summary) {
	const rows = comparisonRows(summary)
		.map((row) => `
		<tr data-compare-row="${escapeHtml(row.key)}">
			<td>${escapeHtml(row.label)}</td>
			<td>${escapeHtml(row.role)}</td>
			<td><span class="chip" style="background:${statusColor(row.executionStatus)}">${escapeHtml(statusLabel(row.executionStatus))}</span></td>
			<td><span class="chip" style="background:${statusColor(row.verdict)}">${escapeHtml(statusLabel(row.verdict))}</span></td>
			<td>${escapeHtml(row.findingsCount)}</td>
			<td>${escapeHtml(row.duration)}</td>
			<td>${escapeHtml(row.summary)}</td>
		</tr>`)
		.join("");
	return `
<section class="panel" aria-labelledby="compare-heading">
	<h2 id="compare-heading">A/B Comparison</h2>
	<p class="panel-copy">When experiments are present, operators should be able to compare the deterministic gate baseline against each experiment adapter without reconstructing the difference by hand.</p>
	<table class="data-table">
		<thead>
			<tr>
				<th>surface</th>
				<th>role</th>
				<th>execution</th>
				<th>verdict</th>
				<th>findings</th>
				<th>duration</th>
				<th>summary</th>
			</tr>
		</thead>
		<tbody>${rows}
		</tbody>
	</table>
</section>`;
}

function renderVariant(variant, adapterName) {
	return `
	<li class="variant" data-variant="${escapeHtml(`${adapterName}:${variant.id ?? "n/a"}`)}">
		<div class="variant-head">
			<strong>${escapeHtml(variant.id ?? "n/a")}</strong>
			<span class="chip" style="background:${statusColor(variant.executionStatus)}">${escapeHtml(statusLabel(variant.executionStatus))}</span>
			<span class="chip" style="background:${statusColor(variant.verdict)}">${escapeHtml(statusLabel(variant.verdict))}</span>
			<span class="chip neutral">findings: ${escapeHtml(variant.findingsCount ?? "n/a")}</span>
		</div>
		<p class="variant-summary">${escapeHtml(variant.summary ?? "")}</p>
	</li>`;
}

function renderExperimentCards(summary) {
	const experiments = Array.isArray(summary.experiments) ? summary.experiments : [];
	if (experiments.length === 0) {
		return `
<section class="panel" aria-labelledby="experiments-heading">
	<h2 id="experiments-heading">Experiment Details</h2>
	<p class="empty">No experiments recorded.</p>
</section>`;
	}
	const cards = experiments.map((experiment) => `
	<article class="experiment-card" data-experiment="${escapeHtml(experiment.adapterName ?? "n/a")}">
		<header class="experiment-header">
			<h3>${escapeHtml(experiment.adapterName ?? "n/a")}</h3>
			<div class="variant-chips">
				<span class="chip" style="background:${statusColor(experiment.executionStatus)}">execution: ${escapeHtml(statusLabel(experiment.executionStatus))}</span>
				<span class="chip" style="background:${statusColor(experiment.overallStatus)}">verdict: ${escapeHtml(statusLabel(experiment.overallStatus))}</span>
				<span class="chip neutral">findings: ${escapeHtml(experiment.findingsCount ?? "n/a")}</span>
				<span class="chip neutral">duration: ${escapeHtml(formatDuration(experiment.telemetry?.durationMs))}</span>
			</div>
		</header>
		<p class="variant-summary">${escapeHtml(experiment.primarySummary ?? "")}</p>
		<ul class="variants">${(Array.isArray(experiment.variants) ? experiment.variants : []).map((variant) => renderVariant(variant, experiment.adapterName ?? "experiment")).join("")}</ul>
	</article>`)
		.join("");
	return `
<section class="panel" aria-labelledby="experiments-heading">
	<h2 id="experiments-heading">Experiment Details</h2>
	${cards}
</section>`;
}

function renderFooter(summary) {
	return `
<footer class="footer">
	<p>Generated from <code>summary.json</code> and <code>report.json</code>. The comparison view exists so A/B experiment outcomes can be inspected side by side instead of as isolated summaries.</p>
	<p>Do not hand-edit this file — rerun <code>npm run dogfood:self:experiments:html</code> to refresh.</p>
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
main { max-width: 1120px; margin: 0 auto; padding: 24px 16px 48px; }
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
.panel-copy { color: #5a6472; margin-top: 0; }
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
.experiment-card {
	border: 1px solid #e4e8ed;
	border-radius: 6px;
	padding: 14px 18px;
	margin-top: 12px;
}
.experiment-header h3 { margin: 0 0 8px; font-size: 15px; }
.variant-chips { display: flex; flex-wrap: wrap; gap: 6px; margin-bottom: 8px; }
.variant-summary { margin: 8px 0; white-space: pre-wrap; }
.variants { list-style: none; padding: 0; margin: 0; display: flex; flex-direction: column; gap: 8px; }
.variant { background: #f6f8fa; border-radius: 6px; padding: 8px 10px; }
.variant-head { display: flex; flex-wrap: wrap; gap: 6px; align-items: center; margin-bottom: 6px; }
.empty { color: #6e7781; font-style: italic; }
.footer { margin-top: 24px; font-size: 12px; color: #6e7781; }
.footer code { background: rgba(175, 184, 193, 0.2); padding: 0 4px; border-radius: 3px; }
code { font-family: ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, monospace; }
@media (prefers-color-scheme: dark) {
	body { background: #0d1117; color: #e6edf3; }
	.banner, .panel, .experiment-card { background: #161b22; box-shadow: 0 1px 3px rgba(0,0,0,0.4); }
	.banner-meta, .panel h2, .panel-copy, .meta-grid dt, .data-table th, .footer, .empty { color: #9198a1; }
	.data-table th, .data-table td { border-bottom-color: #30363d; }
	.experiment-card { border-color: #30363d; }
	.variant { background: #0d1117; }
	.footer code { background: rgba(110, 118, 129, 0.4); }
}
`;

export function renderHtml({ summary, report }) {
	const title = `Cautilus Self-Dogfood Experiments — ${statusLabel(summary.overallStatus)}`;
	return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="generator" content="scripts/render-self-dogfood-experiments-html.mjs">
<title>${escapeHtml(title)}</title>
<style>${STYLES}</style>
</head>
<body>
<main>
${renderHeader(summary)}
${renderIntentPanel(summary, report)}
${renderComparison(summary)}
${renderExperimentCards(summary)}
${renderFooter(summary)}
</main>
</body>
</html>
`;
}

export function renderSelfDogfoodExperimentsHtmlFromDir(latestDir) {
	const summary = readJson(join(latestDir, "summary.json"), "summary.json");
	const report = readJson(join(latestDir, "report.json"), "report.json");
	return renderHtml({ summary, report });
}

export function writeSelfDogfoodExperimentsHtml(latestDir, outputPath = null) {
	const html = renderSelfDogfoodExperimentsHtmlFromDir(latestDir);
	const resolvedOutput = outputPath ?? join(latestDir, "index.html");
	writeFileSync(resolvedOutput, html, "utf-8");
	return resolvedOutput;
}

function main(argv = process.argv.slice(2)) {
	const options = parseArgs(argv);
	const outputPath = writeSelfDogfoodExperimentsHtml(options.latestDir, options.output);
	process.stdout.write(`${outputPath}\n`);
}

const entryHref = process.argv[1] ? new URL(`file://${process.argv[1]}`).href : "";
if (import.meta.url === entryHref) {
	main();
}
