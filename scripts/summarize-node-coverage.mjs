#!/usr/bin/env node
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { resolve, dirname, relative, isAbsolute } from "node:path";
import { fileURLToPath } from "node:url";

const REPO_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const LCOV_PATH = resolve(REPO_ROOT, "coverage/lcov.info");
const OUTPUT_PATH = resolve(REPO_ROOT, "coverage/node.json");

const raw = readFileSync(LCOV_PATH, "utf8");
const files = new Map();
let current = null;

for (const line of raw.split("\n")) {
  if (line.startsWith("SF:")) {
    const rawPath = line.slice(3).trim();
    const relPath = isAbsolute(rawPath) ? relative(REPO_ROOT, rawPath) : rawPath;
    current = { total: 0, covered: 0, path: relPath };
  } else if (line.startsWith("DA:") && current) {
    const [, hitsStr] = line.slice(3).split(",");
    current.total += 1;
    if (Number.parseInt(hitsStr, 10) > 0) current.covered += 1;
  } else if (line.startsWith("end_of_record") && current) {
    const prev = files.get(current.path) ?? { total: 0, covered: 0 };
    files.set(current.path, {
      total: prev.total + current.total,
      covered: prev.covered + current.covered,
    });
    current = null;
  }
}

const entries = {};
for (const [path, { total, covered }] of [...files.entries()].sort()) {
  const percent = total === 0 ? 100 : (covered / total) * 100;
  entries[path] = {
    summary: {
      num_statements: total,
      covered_statements: covered,
      percent_covered: Number(percent.toFixed(2)),
    },
  };
}

mkdirSync(dirname(OUTPUT_PATH), { recursive: true });
writeFileSync(OUTPUT_PATH, JSON.stringify({ language: "node", files: entries }, null, 2) + "\n");
process.stdout.write(`wrote ${OUTPUT_PATH} (${Object.keys(entries).length} files)\n`);
