import { cpSync, existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { basename, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import process from "node:process";

const DEFAULT_REPORT_DIR = ".artifacts/specdown/report";
const DEFAULT_REPORT_JSON = ".artifacts/specdown/report.json";
const DEFAULT_SITE_DIR = "_site";
const DEFAULT_REPORT_URL = "https://corca-ai.github.io/cautilus/";
const STATUS_LABELS = new Map([
	["passed", "Passed"],
	["failed", "Failed"],
	["skipped", "Skipped"],
	["error", "Error"],
]);
const LANDING_PAGE_STYLE = `
    :root {
      color-scheme: light;
      --bg: #f7f4ed;
      --panel: #fffdf8;
      --text: #1e1b16;
      --muted: #6d6558;
      --border: #d9d1c4;
      --accent: #9d5c0d;
      --pass: #1f6f43;
      --fail: #9f2d2d;
      --skip: #8a6b19;
      --error: #6d2eb5;
      --shadow: rgba(30, 27, 22, 0.08);
    }

    * { box-sizing: border-box; }
    body {
      margin: 0;
      font-family: "Iowan Old Style", "Palatino Linotype", "Book Antiqua", Georgia, serif;
      background: linear-gradient(180deg, #f1ece0 0%, var(--bg) 22%, #fcfaf5 100%);
      color: var(--text);
    }
    main {
      max-width: 960px;
      margin: 0 auto;
      padding: 40px 20px 64px;
    }
    .hero {
      background: var(--panel);
      border: 1px solid var(--border);
      border-radius: 24px;
      padding: 28px;
      box-shadow: 0 18px 40px var(--shadow);
    }
    .eyebrow {
      margin: 0 0 10px;
      font: 600 0.78rem/1.2 ui-monospace, "SFMono-Regular", "SF Mono", Consolas, monospace;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      color: var(--accent);
    }
    h1 {
      margin: 0 0 12px;
      font-size: clamp(2rem, 4vw, 3.3rem);
      line-height: 1.05;
    }
    .lede,
    .note,
    .report-meta,
    .footer {
      color: var(--muted);
    }
    .lede {
      margin: 0;
      font-size: 1.06rem;
      line-height: 1.6;
    }
    .links {
      display: flex;
      flex-wrap: wrap;
      gap: 12px;
      margin-top: 20px;
    }
    .links a {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      min-height: 42px;
      padding: 0 16px;
      border-radius: 999px;
      border: 1px solid var(--border);
      color: var(--text);
      text-decoration: none;
      background: #fff;
    }
    .links a.primary {
      border-color: transparent;
      background: var(--accent);
      color: #fff;
    }
    .note {
      margin: 16px 0 0;
      line-height: 1.6;
    }
    .reports {
      list-style: none;
      padding: 0;
      margin: 28px 0 0;
      display: grid;
      gap: 14px;
    }
    .report-card {
      margin: 0;
    }
    .report-link {
      display: grid;
      gap: 6px;
      padding: 20px 22px;
      border-radius: 18px;
      border: 1px solid var(--border);
      background: rgba(255, 253, 248, 0.92);
      color: inherit;
      text-decoration: none;
      box-shadow: 0 10px 24px rgba(30, 27, 22, 0.05);
    }
    .report-title {
      font-size: 1.18rem;
      font-weight: 700;
      line-height: 1.35;
    }
    .report-status {
      width: fit-content;
      border-radius: 999px;
      padding: 0.18rem 0.6rem;
      font: 600 0.78rem/1.2 ui-monospace, "SFMono-Regular", "SF Mono", Consolas, monospace;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      background: #f2eee6;
    }
    .status-passed {
      color: var(--pass);
      background: #e9f6ee;
    }
    .status-failed {
      color: var(--fail);
      background: #fbecec;
    }
    .status-skipped {
      color: var(--skip);
      background: #f7f0d9;
    }
    .status-error {
      color: var(--error);
      background: #f1e8ff;
    }
    .footer {
      margin-top: 24px;
      font-size: 0.95rem;
      line-height: 1.6;
    }
    @media (max-width: 640px) {
      main { padding: 24px 14px 44px; }
      .hero { padding: 22px; border-radius: 20px; }
      .report-link { padding: 16px 18px; }
    }
`;

function usage(exitCode = 0) {
	const text = [
		"Usage:",
		"  node ./scripts/prepare-specdown-pages.mjs [--report-dir <dir>] [--report-json <file>] [--site-dir <dir>] [--report-url <url>]",
	].join("\n");
	const out = exitCode === 0 ? process.stdout : process.stderr;
	out.write(`${text}\n`);
	process.exit(exitCode);
}

function fail(message) {
	process.stderr.write(`${message}\n`);
	process.exit(1);
}

function readRequiredValue(argv, index, option) {
	const value = argv[index];
	if (!value) {
		fail(`Missing value for ${option}`);
	}
	return value;
}

export function parseArgs(argv) {
	const options = {
		reportDir: DEFAULT_REPORT_DIR,
		reportJson: DEFAULT_REPORT_JSON,
		siteDir: DEFAULT_SITE_DIR,
		reportUrl: DEFAULT_REPORT_URL,
	};

	for (let index = 0; index < argv.length; index += 1) {
		const arg = argv[index];
		if (arg === "-h" || arg === "--help") {
			usage(0);
		}
		if (arg === "--report-dir") {
			options.reportDir = readRequiredValue(argv, index + 1, arg);
			index += 1;
			continue;
		}
		if (arg === "--report-json") {
			options.reportJson = readRequiredValue(argv, index + 1, arg);
			index += 1;
			continue;
		}
		if (arg === "--site-dir") {
			options.siteDir = readRequiredValue(argv, index + 1, arg);
			index += 1;
			continue;
		}
		if (arg === "--report-url") {
			options.reportUrl = readRequiredValue(argv, index + 1, arg);
			index += 1;
			continue;
		}
		fail(`Unknown argument: ${arg}`);
	}

	return options;
}

function escapeHtml(value) {
	return String(value)
		.replaceAll("&", "&amp;")
		.replaceAll("<", "&lt;")
		.replaceAll(">", "&gt;")
		.replaceAll('"', "&quot;");
}

function normalizeReportURL(reportUrl) {
	return reportUrl.endsWith("/") ? reportUrl : `${reportUrl}/`;
}

function reportPageName(relativeTo) {
	const filename = basename(relativeTo);
	if (!filename.endsWith(".spec.md")) {
		return `${filename}.html`;
	}
	return `${filename.slice(0, -".spec.md".length)}.html`;
}

function countStatuses(cases) {
	const counts = {
		passed: 0,
		failed: 0,
		skipped: 0,
		error: 0,
		total: 0,
	};
	for (const specCase of cases) {
		counts.total += 1;
		if (specCase.status === "passed") {
			counts.passed += 1;
			continue;
		}
		if (specCase.status === "failed") {
			counts.failed += 1;
			continue;
		}
		if (specCase.status === "skipped") {
			counts.skipped += 1;
			continue;
		}
		counts.error += 1;
	}
	return counts;
}

export function buildReportEntries(report) {
	return report.results.map((result) => ({
		title: result.document.title,
		file: reportPageName(result.document.relativeTo),
		relativeTo: result.document.relativeTo,
		status: result.status,
		counts: countStatuses(result.cases ?? []),
	}));
}

function renderCounts(counts) {
	return ["passed", "failed", "skipped", "error"]
		.filter((status) => counts[status] > 0)
		.map((status) => `${counts[status]} ${STATUS_LABELS.get(status).toLowerCase()}`)
		.join(" / ");
}

function renderEntryCard(entry) {
	const counts = renderCounts(entry.counts);
	return [
		'<li class="report-card">',
		`  <a class="report-link" href="./${escapeHtml(entry.file)}">`,
		`    <span class="report-title">${escapeHtml(entry.title)}</span>`,
		`    <span class="report-status status-${escapeHtml(entry.status)}">${escapeHtml(entry.status)}</span>`,
		`    <span class="report-meta">${escapeHtml(entry.relativeTo)}</span>`,
		`    <span class="report-meta">${escapeHtml(counts || `${entry.counts.total} cases`)}</span>`,
		"  </a>",
		"</li>",
	].join("\n");
}

export function renderLandingPage({ title, generatedAt, reportUrl, entries }) {
	const normalizedReportURL = normalizeReportURL(reportUrl);
	const cards = entries.map(renderEntryCard).join("\n");
	const firstEntryHref = entries[0] ? `./${escapeHtml(entries[0].file)}` : "./report.json";

	return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
  <title>${escapeHtml(title)} Spec Report</title>
  <style>${LANDING_PAGE_STYLE}
  </style>
</head>
<body>
  <main>
    <section class="hero">
      <p class="eyebrow">Cautilus / Specdown</p>
      <h1>${escapeHtml(title)} Spec Report</h1>
      <p class="lede">Detailed executable specs live here. This public site publishes the standing <code>specdown run -filter check:source_guard</code> slice so readers can inspect the current guarded surface without replaying expensive functional checks.</p>
      <div class="links">
        <a class="primary" href="${firstEntryHref}">Open first spec</a>
        <a href="./report.json">Open JSON report</a>
        <a href="${escapeHtml(normalizedReportURL)}">Canonical URL</a>
      </div>
      <p class="note">Generated at ${escapeHtml(generatedAt)}. Expensive runtime and self-dogfood checks remain documented under each spec page's functional sections.</p>
    </section>
    <ul class="reports">
${cards}
    </ul>
    <p class="footer">Source repo docs continue to live in <code>docs/specs/</code>. GitHub Pages serves this landing page plus the generated specdown HTML pages side by side.</p>
  </main>
</body>
</html>
`;
}

export function prepareSpecdownPages({
	reportDir = DEFAULT_REPORT_DIR,
	reportJson = DEFAULT_REPORT_JSON,
	siteDir = DEFAULT_SITE_DIR,
	reportUrl = DEFAULT_REPORT_URL,
} = {}) {
	const resolvedReportDir = resolve(reportDir);
	const resolvedReportJson = resolve(reportJson);
	const resolvedSiteDir = resolve(siteDir);

	if (!existsSync(resolvedReportDir)) {
		fail(`Specdown HTML report directory not found: ${resolvedReportDir}`);
	}
	if (!existsSync(resolvedReportJson)) {
		fail(`Specdown JSON report not found: ${resolvedReportJson}`);
	}

	mkdirSync(resolvedSiteDir, { recursive: true });
	cpSync(resolvedReportDir, resolvedSiteDir, { recursive: true });

	const report = JSON.parse(readFileSync(resolvedReportJson, "utf-8"));
	const landingPage = renderLandingPage({
		title: report.title ?? "Cautilus",
		generatedAt: report.generatedAt ?? new Date().toISOString(),
		reportUrl,
		entries: buildReportEntries(report),
	});

	writeFileSync(join(resolvedSiteDir, "report.json"), JSON.stringify(report, null, 2));
	writeFileSync(join(resolvedSiteDir, "index.html"), landingPage);
}

const invokedPath = process.argv[1] ? resolve(process.argv[1]) : null;
const modulePath = resolve(fileURLToPath(import.meta.url));

if (invokedPath === modulePath) {
	prepareSpecdownPages(parseArgs(process.argv.slice(2)));
}
