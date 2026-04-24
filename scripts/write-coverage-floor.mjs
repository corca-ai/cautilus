#!/usr/bin/env node
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const REPO_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const COVERAGE_PATH = resolve(REPO_ROOT, "coverage/coverage.json");
const FLOOR_PATH = resolve(REPO_ROOT, "scripts/coverage-floor.json");
const EXEMPTIONS_PATH = resolve(REPO_ROOT, "scripts/coverage-floor-exemptions.txt");

const MIN_STATEMENTS = 30;

function loadExemptions() {
  if (!existsSync(EXEMPTIONS_PATH)) return new Set();
  const exempted = new Set();
  for (const raw of readFileSync(EXEMPTIONS_PATH, "utf8").split("\n")) {
    const line = raw.trim();
    if (line && !line.startsWith("#")) exempted.add(line);
  }
  return exempted;
}

if (!existsSync(COVERAGE_PATH)) {
  process.stderr.write(
    `FAIL: missing ${COVERAGE_PATH}. Run npm run test:coverage first.\n`,
  );
  process.exit(1);
}

const exemptions = loadExemptions();
const coverage = JSON.parse(readFileSync(COVERAGE_PATH, "utf8"));
const floor = {};

for (const path of Object.keys(coverage.files).sort()) {
  if (exemptions.has(path)) continue;
  const { num_statements: stmts, percent_covered: pct } = coverage.files[path].summary;
  if (stmts < MIN_STATEMENTS) continue;
  floor[path] = Number(pct.toFixed(2));
}

writeFileSync(FLOOR_PATH, JSON.stringify(floor, null, 2) + "\n");
process.stdout.write(`wrote ${FLOOR_PATH} (${Object.keys(floor).length} floored files)\n`);
