import { cpSync, existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import process from "node:process";

const DEFAULT_REPORT_DIR = ".artifacts/specdown/report";
const DEFAULT_REPORT_JSON = ".artifacts/specdown/report.json";
const DEFAULT_SITE_DIR = "_site";

function usage(exitCode = 0) {
	const text = [
		"Usage:",
		"  node ./scripts/prepare-specdown-pages.mjs [--report-dir <dir>] [--report-json <file>] [--site-dir <dir>]",
	].join("\n");
	const out = exitCode === 0 ? process.stdout : process.stderr;
	out.write(`${text}\n`);
	process.exit(exitCode);
}

function fail(message) {
	throw new Error(message);
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
		fail(`Unknown argument: ${arg}`);
	}

	return options;
}

function ensureEntryPageExists(siteDir) {
	const entryPagePath = join(siteDir, "index.html");
	if (!existsSync(entryPagePath)) {
		fail(`Specdown entry page not found: ${entryPagePath}`);
	}
}

export function prepareSpecdownPages({
	reportDir = DEFAULT_REPORT_DIR,
	reportJson = DEFAULT_REPORT_JSON,
	siteDir = DEFAULT_SITE_DIR,
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

	rmSync(resolvedSiteDir, { recursive: true, force: true });
	mkdirSync(resolvedSiteDir, { recursive: true });
	cpSync(resolvedReportDir, resolvedSiteDir, { recursive: true });
	ensureEntryPageExists(resolvedSiteDir);
	writeFileSync(join(resolvedSiteDir, "report.json"), readFileSync(resolvedReportJson, "utf-8"));
}

const invokedPath = process.argv[1] ? resolve(process.argv[1]) : null;
const modulePath = resolve(fileURLToPath(import.meta.url));

if (invokedPath === modulePath) {
	try {
		prepareSpecdownPages(parseArgs(process.argv.slice(2)));
	} catch (error) {
		process.stderr.write(`${error.message}\n`);
		process.exit(1);
	}
}
