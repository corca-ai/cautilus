import { existsSync, mkdirSync, readFileSync, readdirSync, rmSync, statSync, writeFileSync } from "node:fs";
import { dirname, join, relative, resolve } from "node:path";
import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import process from "node:process";

const DEFAULT_WIDTHS = [80, 100];
const DEFAULT_FILES = ["README.md", "docs/specs"];
const ARTIFACT_ROOT = ".artifacts/markdown-preview";
const CONFIG_CANDIDATES = [
	".agents/markdown-preview.yaml",
	".codex/markdown-preview.yaml",
	".claude/markdown-preview.yaml",
	"docs/markdown-preview.yaml",
	"markdown-preview.yaml",
];

function usage() {
	return [
		"Usage: node scripts/preview-markdown.mjs [--changed] [--specs] [--stdout] [--width <n>] [path ...]",
		"",
		"Renders repo-owned markdown through glow and writes text snapshots under",
		".artifacts/markdown-preview by default.",
		"When .agents/markdown-preview.yaml exists, repo-owned scope and widths",
		"come from that config unless CLI flags override them.",
	].join("\n");
}

export function parseArgs(argv) {
	const options = {
		changed: false,
		specsOnly: false,
		stdout: false,
		widths: [],
		paths: [],
	};
	for (let index = 0; index < argv.length; index += 1) {
		const result = applyArgument(options, argv, index);
		if (result.help) return { ...options, help: true };
		index = result.nextIndex;
	}
	if (options.specsOnly && options.paths.length > 0) {
		throw new Error("--specs cannot be combined with explicit paths");
	}
	return { ...options, help: false };
}

function applyArgument(options, argv, index) {
	const arg = argv[index];
	if (arg === "-h" || arg === "--help") {
		return { help: true, nextIndex: index };
	}
	if (arg === "--changed") {
		options.changed = true;
		return { help: false, nextIndex: index };
	}
	if (arg === "--specs") {
		options.specsOnly = true;
		return { help: false, nextIndex: index };
	}
	if (arg === "--stdout") {
		options.stdout = true;
		return { help: false, nextIndex: index };
	}
	if (arg === "--width") {
		const value = argv[index + 1];
		if (!value) throw new Error("--width requires a value");
		const parsed = Number.parseInt(value, 10);
		if (!Number.isInteger(parsed) || parsed <= 0) {
			throw new Error(`invalid --width value ${value}`);
		}
		options.widths.push(parsed);
		return { help: false, nextIndex: index + 1 };
	}
	if (arg.startsWith("-")) {
		throw new Error(`unknown argument: ${arg}`);
	}
	options.paths.push(arg);
	return { help: false, nextIndex: index };
}

function commandExists(command, spawn = spawnSync) {
	const result = spawn("sh", ["-c", `command -v ${command}`], { encoding: "utf-8" });
	return result.status === 0;
}

function ensureBackend(backend, spawn = spawnSync) {
	if (backend !== "glow") {
		throw new Error(`unsupported markdown preview backend: ${backend}`);
	}
	if (!commandExists(backend, spawn)) {
		throw new Error(
			[
				`${backend} was not found on PATH.`,
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

function detectConfigPath(repoRoot) {
	for (const candidate of CONFIG_CANDIDATES) {
		const full = resolve(repoRoot, candidate);
		if (existsSync(full)) return full;
	}
	return null;
}

function parseYamlScalar(rawValue) {
	const value = rawValue.trim();
	if (value === "true") return true;
	if (value === "false") return false;
	if (/^-?\d+$/.test(value)) return Number.parseInt(value, 10);
	if (
		(value.startsWith('"') && value.endsWith('"')) ||
		(value.startsWith("'") && value.endsWith("'"))
	) {
		return value.slice(1, -1);
	}
	return value;
}

function appendConfigListValue(parsed, activeList, rawValue) {
	const value = parseYamlScalar(rawValue);
	if (activeList === "widths") {
		parsed.widths.push(value);
		return;
	}
	if (activeList === "include") {
		parsed.paths.push(value);
		return;
	}
	throw new Error(`unexpected markdown preview config list: ${activeList}`);
}

function applyConfigScalar(parsed, key, rawValue) {
	const value = parseYamlScalar(rawValue);
	switch (key) {
		case "enabled":
			parsed.enabled = value;
			return null;
		case "backend":
			parsed.backend = value;
			return null;
		case "on_change_only":
			parsed.changed = value;
			return null;
		case "artifact_dir":
			parsed.artifactDir = value;
			return null;
		case "widths":
			parsed.widths.push(value);
			return null;
		case "include":
			parsed.paths.push(value);
			return null;
		default:
			throw new Error(`unsupported markdown preview config key: ${key}`);
	}
}

function parseConfigLine(parsed, line, configPath) {
	const trimmed = line.trim();
	if (!trimmed || trimmed.startsWith("#")) {
		return { nextList: null, skip: true };
	}
	const listMatch = line.match(/^\s*-\s+(.*)$/);
	if (listMatch) {
		return { listValue: listMatch[1], nextList: null, skip: false };
	}
	const keyMatch = line.match(/^([A-Za-z_]+):\s*(.*)$/);
	if (!keyMatch) {
		throw new Error(`unsupported markdown preview config line: ${trimmed}`);
	}
	const [, key, rawValue] = keyMatch;
	if (rawValue === "") {
		if (key === "widths" || key === "include") {
			return { nextList: key, skip: false };
		}
		throw new Error(`missing value for ${key} in ${relative(process.cwd(), configPath)}`);
	}
	applyConfigScalar(parsed, key, rawValue);
	return { nextList: null, skip: false };
}

function parsePreviewConfigFile(configPath) {
	const parsed = {
		enabled: true,
		backend: "glow",
		widths: [],
		paths: [],
		changed: false,
		artifactDir: ARTIFACT_ROOT,
		configPath,
	};
	const source = readFileSync(configPath, "utf-8");
	let activeList = null;
	for (const rawLine of source.split("\n")) {
		const line = rawLine.replace(/\r$/, "");
		const parsedLine = parseConfigLine(parsed, line, configPath);
		if (parsedLine.skip) continue;
		if (parsedLine.listValue !== undefined) {
			if (!activeList) throw new Error(`unexpected list item in ${relative(process.cwd(), configPath)}`);
			appendConfigListValue(parsed, activeList, parsedLine.listValue);
			continue;
		}
		activeList = parsedLine.nextList;
	}
	return parsed;
}

function loadPreviewConfig(repoRoot) {
	const configPath = detectConfigPath(repoRoot);
	if (!configPath) return null;
	return parsePreviewConfigFile(configPath);
}

function escapeRegExp(text) {
	return text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function globToRegExp(pattern) {
	let regex = "^";
	for (let index = 0; index < pattern.length; index += 1) {
		const char = pattern[index];
		const next = pattern[index + 1];
		if (char === "*" && next === "*") {
			regex += ".*";
			index += 1;
			continue;
		}
		if (char === "*") {
			regex += "[^/]*";
			continue;
		}
		regex += escapeRegExp(char);
	}
	regex += "$";
	return new RegExp(regex);
}

function resolveConfigTargets(repoRoot, targets) {
	const allMarkdown = walkMarkdownFiles(repoRoot).map((file) => ({
		absolute: file,
		relative: relative(repoRoot, file).replaceAll("\\", "/"),
	}));
	const files = new Set();
	for (const target of targets) {
		if (!target.includes("*")) {
			for (const file of resolveExplicitTargets(repoRoot, [target])) {
				files.add(file);
			}
			continue;
		}
		const matcher = globToRegExp(target);
		for (const file of allMarkdown) {
			if (matcher.test(file.relative)) {
				files.add(file.absolute);
			}
		}
	}
	return [...files];
}

function resolveExplicitTargets(repoRoot, targets) {
	const files = [];
	for (const target of targets) {
		const full = resolve(repoRoot, target);
		if (!existsSync(full)) {
			throw new Error(`markdown preview path not found: ${target}`);
		}
		const stat = statSync(full);
		if (stat.isDirectory()) {
			files.push(...walkMarkdownFiles(full));
			continue;
		}
		if (!target.endsWith(".md")) {
			throw new Error(`markdown preview path is not a markdown file: ${target}`);
		}
		files.push(full);
	}
	return files;
}

function listBaseMarkdown(repoRoot, { specsOnly, configuredPaths = [] }) {
	if (specsOnly) {
		return walkMarkdownFiles(resolve(repoRoot, "docs/specs"));
	}
	if (configuredPaths.length > 0) {
		return resolveConfigTargets(repoRoot, configuredPaths);
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

function mergeOptionsWithConfig(options, config) {
	if (!config) {
		return {
			...options,
			backend: "glow",
			artifactDir: ARTIFACT_ROOT,
			configPath: null,
			enabled: true,
			configuredPaths: [],
		};
	}
	return {
		...options,
		changed: options.changed || config.changed,
		widths: options.widths.length > 0 ? options.widths : config.widths,
		backend: config.backend,
		artifactDir: config.artifactDir,
		configPath: config.configPath,
		enabled: config.enabled,
		configuredPaths: options.paths.length > 0 || options.specsOnly ? [] : config.paths,
	};
}

export function selectMarkdownFiles(repoRoot, options, spawn = spawnSync) {
	const explicitPaths = options.paths ?? [];
	const base = explicitPaths.length > 0
		? resolveExplicitTargets(repoRoot, explicitPaths)
		: listBaseMarkdown(repoRoot, options);
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

function backendVersion(backend, spawn = spawnSync) {
	const result = spawn(backend, ["--version"], { encoding: "utf-8" });
	if (result.status !== 0) return null;
	return (result.stdout || result.stderr || "").trim() || null;
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
	const previews = [];
	const sourceSha256 = createHash("sha256").update(readFileSync(file)).digest("hex");
	for (const width of widths) {
		const rendered = renderFile(repoRoot, file, width, spawn);
		renderCount += 1;
		const rel = relative(repoRoot, file);
		if (options.stdout) {
			emitRenderedSnapshot(stdout, repoRoot, file, width, rendered);
		} else {
			writeRenderedSnapshot(repoRoot, artifactDir, file, width, rendered);
		}
		previews.push({
			source_path: rel.replaceAll("\\", "/"),
			width,
			artifact_path: `${relative(repoRoot, artifactDir)}/${sanitizeRelative(rel)}.w${width}.txt`,
			backend: options.backend,
			source_sha256: sourceSha256,
			status: "rendered",
		});
	}
	return { renderCount, previews };
}

function writeManifest(repoRoot, artifactDir, manifest) {
	writeFileSync(resolve(artifactDir, "manifest.json"), `${JSON.stringify(manifest, null, 2)}\n`);
}

export function previewMarkdown(
	repoRoot,
	options,
	{ spawn = spawnSync, stdout = process.stdout } = {},
) {
	const effectiveOptions = mergeOptionsWithConfig(options, loadPreviewConfig(repoRoot));
	if (!effectiveOptions.enabled) {
		stdout.write("markdown-preview: disabled by config\n");
		return { fileCount: 0, renderCount: 0, widths: effectiveOptions.widths };
	}
	ensureBackend(effectiveOptions.backend, spawn);
	const widths = effectiveOptions.widths.length > 0 ? effectiveOptions.widths : DEFAULT_WIDTHS;
	const files = selectMarkdownFiles(repoRoot, effectiveOptions, spawn);
	if (files.length === 0) {
		stdout.write("markdown-preview: no matching markdown files\n");
		return { fileCount: 0, renderCount: 0, widths };
	}

	const artifactDir = resolve(repoRoot, effectiveOptions.artifactDir);
	if (!effectiveOptions.stdout) {
		rmSync(artifactDir, { recursive: true, force: true });
		mkdirSync(artifactDir, { recursive: true });
	}

	let renderCount = 0;
	const previews = [];
	for (const file of files) {
		const rendered = renderSelectedFile(repoRoot, file, widths, effectiveOptions, {
			spawn,
			stdout,
			artifactDir,
		});
		renderCount += rendered.renderCount;
		previews.push(...rendered.previews);
	}

	const manifest = {
		status: "success",
		repo_root: repoRoot,
		backend: effectiveOptions.backend,
		backend_available: true,
		backend_version: backendVersion(effectiveOptions.backend, spawn),
		config_path: effectiveOptions.configPath ? relative(repoRoot, effectiveOptions.configPath) : null,
		artifact_dir: relative(repoRoot, artifactDir),
		widths,
		target_count: files.length,
		generated_at: new Date().toISOString(),
		previews,
		warnings: [],
	};
	if (!effectiveOptions.stdout) {
		writeManifest(repoRoot, artifactDir, manifest);
	}

	stdout.write(
		`markdown-preview: rendered ${renderCount} snapshot(s) across ${files.length} file(s) into ${relative(repoRoot, artifactDir)}\n`,
	);
	return {
		fileCount: files.length,
		renderCount,
		widths,
		artifactDir,
		configPath: effectiveOptions.configPath,
		manifest,
	};
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
