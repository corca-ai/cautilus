import { existsSync, mkdirSync, readdirSync, rmSync, statSync, writeFileSync } from "node:fs";
import { dirname, join, relative, resolve } from "node:path";
import { spawnSync } from "node:child_process";
import process from "node:process";

const DEFAULT_WIDTHS = [80, 100];
const DEFAULT_FILES = ["README.md", "README.ko.md", "install.md", "docs/specs"];
const ARTIFACT_ROOT = ".artifacts/markdown-preview";

function usage() {
	return [
		"Usage: node scripts/preview-markdown.mjs [--changed] [--specs] [--stdout] [--width <n>]",
		"",
		"Renders repo-owned markdown through glow and writes text snapshots under",
		".artifacts/markdown-preview by default.",
	].join("\n");
}

export function parseArgs(argv) {
	const options = {
		changed: false,
		specsOnly: false,
		stdout: false,
		widths: [],
	};
	for (let index = 0; index < argv.length; index += 1) {
		const arg = argv[index];
		switch (arg) {
			case "-h":
			case "--help":
				return { ...options, help: true };
			case "--changed":
				options.changed = true;
				break;
			case "--specs":
				options.specsOnly = true;
				break;
			case "--stdout":
				options.stdout = true;
				break;
			case "--width": {
				const value = argv[index + 1];
				if (!value) throw new Error("--width requires a value");
				const parsed = Number.parseInt(value, 10);
				if (!Number.isInteger(parsed) || parsed <= 0) {
					throw new Error(`invalid --width value ${value}`);
				}
				options.widths.push(parsed);
				index += 1;
				break;
			}
			default:
				throw new Error(`unknown argument: ${arg}`);
		}
	}
	return { ...options, help: false };
}

function commandExists(command, spawn = spawnSync) {
	const result = spawn("sh", ["-c", `command -v ${command}`], { encoding: "utf-8" });
	return result.status === 0;
}

function ensureGlow(spawn = spawnSync) {
	if (!commandExists("glow", spawn)) {
		throw new Error(
			[
				"glow was not found on PATH.",
				"Install it before running markdown preview.",
				"Upstream: https://github.com/charmbracelet/glow",
			].join(" "),
		);
	}
}

function walkMarkdownFiles(root) {
	const entries = [];
	for (const entry of readdirSync(root, { withFileTypes: true })) {
		const full = join(root, entry.name);
		if (entry.isDirectory()) {
			entries.push(...walkMarkdownFiles(full));
			continue;
		}
		if (entry.isFile() && entry.name.endsWith(".md")) {
			entries.push(full);
		}
	}
	return entries;
}

function listBaseMarkdown(repoRoot, { specsOnly }) {
	if (specsOnly) {
		return walkMarkdownFiles(resolve(repoRoot, "docs/specs"));
	}
	const files = [];
	for (const target of DEFAULT_FILES) {
		const full = resolve(repoRoot, target);
		if (!existsSync(full)) continue;
		const stat = statSync(full);
		if (stat.isDirectory()) {
			files.push(...walkMarkdownFiles(full));
			continue;
		}
		files.push(full);
	}
	return files;
}

function listChangedMarkdown(repoRoot, spawn = spawnSync) {
	const result = spawn("git", ["status", "--short", "--untracked-files=all", "--", "*.md", "docs/specs/*.md"], {
		cwd: repoRoot,
		encoding: "utf-8",
	});
	if (result.status !== 0) {
		throw new Error(`git status failed: ${(result.stderr || "").trim()}`);
	}
	const files = new Set();
	for (const line of result.stdout.split("\n")) {
		if (!line.trim()) continue;
		const path = line.slice(3).trim();
		if (!path.endsWith(".md")) continue;
		files.add(resolve(repoRoot, path));
	}
	return [...files];
}

export function selectMarkdownFiles(repoRoot, options, spawn = spawnSync) {
	const base = listBaseMarkdown(repoRoot, options);
	if (!options.changed) return base.sort();
	const changed = new Set(listChangedMarkdown(repoRoot, spawn));
	return base.filter((file) => changed.has(file)).sort();
}

function sanitizeRelative(relativePath) {
	return relativePath.replaceAll("/", "__");
}

function renderFile(repoRoot, absolutePath, width, spawn = spawnSync) {
	const result = spawn("glow", ["-w", String(width), absolutePath], {
		cwd: repoRoot,
		encoding: "utf-8",
		maxBuffer: 20 * 1024 * 1024,
	});
	if (result.status !== 0) {
		throw new Error(`glow failed for ${relative(repoRoot, absolutePath)}: ${(result.stderr || "").trim()}`);
	}
	return result.stdout;
}

function writeRenderedSnapshot(repoRoot, artifactDir, file, width, rendered) {
	const rel = relative(repoRoot, file);
	const outPath = resolve(artifactDir, `${sanitizeRelative(rel)}.w${width}.txt`);
	mkdirSync(dirname(outPath), { recursive: true });
	writeFileSync(outPath, rendered);
}

function emitRenderedSnapshot(stdout, repoRoot, file, width, rendered) {
	const rel = relative(repoRoot, file);
	stdout.write(`\n=== ${rel} (w${width}) ===\n`);
	stdout.write(rendered);
	if (!rendered.endsWith("\n")) stdout.write("\n");
}

function renderSelectedFile(
	repoRoot,
	file,
	widths,
	options,
	{ spawn = spawnSync, stdout = process.stdout, artifactDir } = {},
) {
	let renderCount = 0;
	for (const width of widths) {
		const rendered = renderFile(repoRoot, file, width, spawn);
		renderCount += 1;
		if (options.stdout) {
			emitRenderedSnapshot(stdout, repoRoot, file, width, rendered);
			continue;
		}
		writeRenderedSnapshot(repoRoot, artifactDir, file, width, rendered);
	}
	return renderCount;
}

export function previewMarkdown(
	repoRoot,
	options,
	{ spawn = spawnSync, stdout = process.stdout } = {},
) {
	ensureGlow(spawn);
	const widths = options.widths.length > 0 ? options.widths : DEFAULT_WIDTHS;
	const files = selectMarkdownFiles(repoRoot, options, spawn);
	if (files.length === 0) {
		stdout.write("markdown-preview: no matching markdown files\n");
		return { fileCount: 0, renderCount: 0, widths };
	}

	const artifactDir = resolve(repoRoot, ARTIFACT_ROOT);
	if (!options.stdout) {
		rmSync(artifactDir, { recursive: true, force: true });
		mkdirSync(artifactDir, { recursive: true });
	}

	let renderCount = 0;
	for (const file of files) {
		renderCount += renderSelectedFile(repoRoot, file, widths, options, {
			spawn,
			stdout,
			artifactDir,
		});
	}

	stdout.write(
		`markdown-preview: rendered ${renderCount} snapshot(s) across ${files.length} file(s) into ${relative(repoRoot, artifactDir)}\n`,
	);
	return { fileCount: files.length, renderCount, widths, artifactDir };
}

function main() {
	let options;
	try {
		options = parseArgs(process.argv.slice(2));
	} catch (error) {
		process.stderr.write(`${error.message}\n`);
		process.exit(2);
	}
	if (options.help) {
		process.stdout.write(`${usage()}\n`);
		process.exit(0);
	}
	try {
		previewMarkdown(process.cwd(), options);
	} catch (error) {
		process.stderr.write(`${error.message}\n`);
		process.exit(1);
	}
}

const invokedAsScript =
	import.meta.url === `file://${process.argv[1]}` ||
	process.argv[1]?.endsWith("/preview-markdown.mjs");
if (invokedAsScript) {
	main();
}
