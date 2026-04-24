#!/usr/bin/env node
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const REPO_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const GO_MODULE = "github.com/corca-ai/cautilus/";
const PROFILE_PATH = resolve(REPO_ROOT, "coverage/go.out");
const OUTPUT_PATH = resolve(REPO_ROOT, "coverage/go.json");

const raw = readFileSync(PROFILE_PATH, "utf8");
const files = new Map();

for (const line of raw.split("\n")) {
  if (!line || line.startsWith("mode:")) continue;
  const colon = line.indexOf(":");
  if (colon < 0) continue;
  const rawPath = line.slice(0, colon);
  const [, numStrRaw, countStrRaw] = line.slice(colon + 1).split(" ");
  const numStatements = Number.parseInt(numStrRaw, 10);
  const count = Number.parseInt(countStrRaw, 10);
  if (!Number.isFinite(numStatements) || !Number.isFinite(count)) continue;
  const relPath = rawPath.startsWith(GO_MODULE) ? rawPath.slice(GO_MODULE.length) : rawPath;
  const bucket = files.get(relPath) ?? { total: 0, covered: 0 };
  bucket.total += numStatements;
  if (count > 0) bucket.covered += numStatements;
  files.set(relPath, bucket);
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
writeFileSync(OUTPUT_PATH, JSON.stringify({ language: "go", files: entries }, null, 2) + "\n");
process.stdout.write(`wrote ${OUTPUT_PATH} (${Object.keys(entries).length} files)\n`);
