#!/usr/bin/env node
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const REPO_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const COVERAGE_DIR = resolve(REPO_ROOT, process.env.COVERAGE_DIR || "coverage");
const INPUT_PATHS = [
  resolve(COVERAGE_DIR, "go.json"),
  resolve(COVERAGE_DIR, "node.json"),
];
const OUTPUT_PATH = resolve(COVERAGE_DIR, "coverage.json");

const files = {};
const languages = [];

for (const inputPath of INPUT_PATHS) {
  if (!existsSync(inputPath)) {
    process.stderr.write(
      `FAIL: missing ${inputPath}. Run npm run test:go:coverage and npm run test:node:coverage first.\n`,
    );
    process.exit(1);
  }
  const report = JSON.parse(readFileSync(inputPath, "utf8"));
  languages.push(report.language);
  for (const [path, entry] of Object.entries(report.files)) {
    if (files[path]) {
      process.stderr.write(`FAIL: duplicate file across languages: ${path}\n`);
      process.exit(1);
    }
    files[path] = { language: report.language, ...entry };
  }
}

const ordered = {};
for (const path of Object.keys(files).sort()) ordered[path] = files[path];

writeFileSync(
  OUTPUT_PATH,
  JSON.stringify({ languages, files: ordered }, null, 2) + "\n",
);
process.stdout.write(
  `wrote ${OUTPUT_PATH} (${Object.keys(ordered).length} files across ${languages.join(", ")})\n`,
);
