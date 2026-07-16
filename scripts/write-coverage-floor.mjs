#!/usr/bin/env node
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const REPO_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");

const MIN_STATEMENTS = 30;
// Default headroom below current coverage. Aligned with the adapter's
// coverage_fragile_margin_pp (1.0) so a freshly written floor is not already
// "fragile" by the repo's own standard. (The prior hard-coded 0.25 left every
// written floor immediately inside the fragile band.)
const DEFAULT_BUFFER_PP = 1.0;
// In --only-stale mode a floor is worth raising only when current coverage sits
// at least this far above it; near-floor files are left untouched.
const DEFAULT_STALE_THRESHOLD_PP = 10.0;

export function parseArgs(argv) {
  const opts = {
    onlyStale: false,
    bufferPp: DEFAULT_BUFFER_PP,
    staleThresholdPp: DEFAULT_STALE_THRESHOLD_PP,
  };
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === "--only-stale") {
      opts.onlyStale = true;
    } else if (arg === "--buffer") {
      opts.bufferPp = Number(argv[(i += 1)]);
    } else if (arg === "--stale-threshold") {
      opts.staleThresholdPp = Number(argv[(i += 1)]);
    } else {
      throw new Error(`unknown argument: ${arg}`);
    }
  }
  if (!Number.isFinite(opts.bufferPp) || opts.bufferPp < 0) {
    throw new Error("--buffer must be a non-negative number");
  }
  if (!Number.isFinite(opts.staleThresholdPp) || opts.staleThresholdPp < 0) {
    throw new Error("--stale-threshold must be a non-negative number");
  }
  return opts;
}

// Decide the floor for a single file, or undefined to leave it unchanged.
// Never lowers an existing floor's value.
function floorForFile({ existing, stmts, pct, bufferPp, onlyStale, staleThresholdPp }) {
  if (stmts < MIN_STATEMENTS) return undefined;
  const candidate = Number(Math.max(0, pct - bufferPp).toFixed(2));
  if (!onlyStale) {
    return existing === undefined ? candidate : Math.max(existing, candidate);
  }
  if (existing === undefined) return undefined; // only touch already-floored files
  if (pct - existing < staleThresholdPp) return undefined; // not stale enough to raise
  return Math.max(existing, candidate);
}

// Pure floor computation. A retained floor's value is never lowered (monotonic).
// - full mode: rebuild from eligible files at max(existing, pct - buffer); a file
//   that became exempt, dropped below MIN_STATEMENTS, or left coverage is dropped
//   from the set (loss of protection, not a lowered value).
// - only-stale mode: keep the existing floor map, drop exempt entries, and raise
//   only the already floored files whose coverage sits >= staleThreshold above the
//   current floor.
export function computeFloors({
  coverageFiles,
  existingFloor = {},
  exemptions = new Set(),
  bufferPp = DEFAULT_BUFFER_PP,
  onlyStale = false,
  staleThresholdPp = DEFAULT_STALE_THRESHOLD_PP,
}) {
  const result = onlyStale
    ? Object.fromEntries(Object.entries(existingFloor).filter(([path]) => !exemptions.has(path)))
    : {};
  for (const path of Object.keys(coverageFiles).sort()) {
    if (exemptions.has(path)) continue;
    const { num_statements: stmts, percent_covered: pct } = coverageFiles[path].summary;
    const floor = floorForFile({
      existing: existingFloor[path],
      stmts,
      pct,
      bufferPp,
      onlyStale,
      staleThresholdPp,
    });
    if (floor !== undefined) result[path] = floor;
  }
  return result;
}

function sortByKey(floor) {
  const sorted = {};
  for (const key of Object.keys(floor).sort()) sorted[key] = floor[key];
  return sorted;
}

function loadExemptions(io, exemptionsPath) {
  if (!io.existsSync(exemptionsPath)) return new Set();
  const exempted = new Set();
  for (const raw of io.readFileSync(exemptionsPath, "utf8").split("\n")) {
    const line = raw.trim();
    if (line && !line.startsWith("#")) exempted.add(line);
  }
  return exempted;
}

function resolvePaths(env) {
  const coverageDir = resolve(REPO_ROOT, env.COVERAGE_DIR || "coverage");
  return {
    coveragePath: resolve(coverageDir, "coverage.json"),
    floorPath: resolve(REPO_ROOT, env.COVERAGE_FLOOR_PATH || "scripts/coverage-floor.json"),
    exemptionsPath: resolve(
      REPO_ROOT,
      env.COVERAGE_FLOOR_EXEMPTIONS_PATH || "scripts/coverage-floor-exemptions.txt",
    ),
  };
}

export function main(
  argv = process.argv.slice(2),
  { env = process.env, io = { readFileSync, writeFileSync, existsSync }, stdout = process.stdout, stderr = process.stderr } = {},
) {
  const opts = parseArgs(argv);
  const { coveragePath, floorPath, exemptionsPath } = resolvePaths(env);

  if (!io.existsSync(coveragePath)) {
    stderr.write(`FAIL: missing ${coveragePath}. Run npm run test:coverage first.\n`);
    return 1;
  }

  const coverage = JSON.parse(io.readFileSync(coveragePath, "utf8"));
  const existingFloor = io.existsSync(floorPath)
    ? JSON.parse(io.readFileSync(floorPath, "utf8"))
    : {};
  const exemptions = loadExemptions(io, exemptionsPath);

  const floor = sortByKey(
    computeFloors({ coverageFiles: coverage.files, existingFloor, exemptions, ...opts }),
  );

  io.writeFileSync(floorPath, `${JSON.stringify(floor, null, 2)}\n`);
  stdout.write(
    `wrote ${floorPath} (${Object.keys(floor).length} floored files${opts.onlyStale ? ", only-stale" : ""}, buffer ${opts.bufferPp}pp)\n`,
  );
  return 0;
}

const entryHref = process.argv[1] ? pathToFileURL(resolve(process.argv[1])).href : "";
if (import.meta.url === entryHref) {
  process.exitCode = main();
}
