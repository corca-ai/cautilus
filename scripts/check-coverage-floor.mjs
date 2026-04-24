#!/usr/bin/env node
import { readFileSync, existsSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const REPO_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const COVERAGE_PATH = resolve(REPO_ROOT, "coverage/coverage.json");
const FLOOR_PATH = resolve(REPO_ROOT, "scripts/coverage-floor.json");
const EXEMPTIONS_PATH = resolve(REPO_ROOT, "scripts/coverage-floor-exemptions.txt");

const MIN_STATEMENTS = 30;
const FAIL_BELOW_PCT = 80.0;
const WARN_CEILING_PCT = 95.0;
const DRIFT_LOCK_PP = 1.0;

function loadExemptions() {
  if (!existsSync(EXEMPTIONS_PATH)) return new Set();
  const exempted = new Set();
  for (const raw of readFileSync(EXEMPTIONS_PATH, "utf8").split("\n")) {
    const line = raw.trim();
    if (!line || line.startsWith("#")) continue;
    const full = resolve(REPO_ROOT, line);
    if (!existsSync(full)) {
      process.stderr.write(`FAIL: exemption path does not exist: ${line}\n`);
      process.exit(1);
    }
    exempted.add(line);
  }
  return exempted;
}

function loadFloor() {
  if (!existsSync(FLOOR_PATH)) {
    process.stderr.write(
      `FAIL: missing ${FLOOR_PATH}. Run npm run coverage:floor:write first.\n`,
    );
    process.exit(1);
  }
  return JSON.parse(readFileSync(FLOOR_PATH, "utf8"));
}

function loadCoverage() {
  if (!existsSync(COVERAGE_PATH)) {
    process.stderr.write(
      `FAIL: missing ${COVERAGE_PATH}. Run npm run test:coverage first.\n`,
    );
    process.exit(1);
  }
  return JSON.parse(readFileSync(COVERAGE_PATH, "utf8"));
}

const exemptions = loadExemptions();
const floor = loadFloor();
const coverage = loadCoverage();

const contradictions = Object.keys(floor).filter((path) => exemptions.has(path));
if (contradictions.length > 0) {
  process.stderr.write("FAIL: paths are both floored and exempted:\n");
  for (const path of contradictions.sort()) process.stderr.write(`  - ${path}\n`);
  process.exit(1);
}

const offenders = [];
const promotionCandidates = [];
const unfloored = [];
const warnBand = [];

for (const [path, entry] of Object.entries(coverage.files)) {
  if (exemptions.has(path)) continue;
  const { num_statements: stmts, percent_covered: pct } = entry.summary;
  if (stmts < MIN_STATEMENTS) continue;
  const declared = floor[path];
  if (declared === undefined) {
    if (pct < FAIL_BELOW_PCT) {
      unfloored.push({ path, stmts, pct });
    } else if (pct < WARN_CEILING_PCT) {
      warnBand.push({ path, stmts, pct });
    }
    continue;
  }
  if (pct + 1e-6 < declared) {
    offenders.push({ path, stmts, pct, declared });
  } else if (pct >= declared + DRIFT_LOCK_PP) {
    promotionCandidates.push({ path, stmts, pct, declared });
  }
}

function fmtLine({ path, stmts, pct, declared }) {
  const base = `${path}  stmts=${stmts} cov=${pct.toFixed(2)}%`;
  return declared === undefined ? base : `${base} floor=${declared.toFixed(2)}%`;
}

if (warnBand.length > 0) {
  process.stderr.write("WARN: unfloored files in warn-band (promote when stable):\n");
  for (const item of warnBand.sort((a, b) => b.pct - a.pct))
    process.stderr.write(`  - ${fmtLine(item)}\n`);
}
if (promotionCandidates.length > 0) {
  process.stderr.write("WARN: floored files cleared drift-lock (consider raising floor):\n");
  for (const item of promotionCandidates.sort((a, b) => b.pct - b.declared - (a.pct - a.declared)))
    process.stderr.write(`  - ${fmtLine(item)}\n`);
}
if (unfloored.length > 0) {
  process.stderr.write("FAIL: unfloored files below fail_below_pct:\n");
  for (const item of unfloored.sort((a, b) => a.pct - b.pct))
    process.stderr.write(`  - ${fmtLine(item)}\n`);
}
if (offenders.length > 0) {
  process.stderr.write("FAIL: floored files regressed below declared floor:\n");
  for (const item of offenders.sort((a, b) => a.pct - a.declared - (b.pct - b.declared)))
    process.stderr.write(`  - ${fmtLine(item)}\n`);
}

if (offenders.length > 0 || unfloored.length > 0) process.exit(1);
process.stdout.write(
  `OK: ${Object.keys(floor).length} floored, ${exemptions.size} exempted, ` +
    `${warnBand.length} in warn-band, ${promotionCandidates.length} cleared drift-lock.\n`,
);
