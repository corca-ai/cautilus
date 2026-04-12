#!/usr/bin/env node

import { execFileSync, spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import path from "node:path";

const args = process.argv.slice(2);
const candidates = [];

if (process.platform === "win32") {
  candidates.push("golangci-lint.exe");
} else {
  candidates.push("golangci-lint");
}

try {
  const goPath = execFileSync("go", ["env", "GOPATH"], {
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  }).trim();
  if (goPath) {
    candidates.push(
      path.join(
        goPath,
        "bin",
        process.platform === "win32" ? "golangci-lint.exe" : "golangci-lint",
      ),
    );
  }
} catch {
  // Let the candidate search fail naturally below if Go is unavailable.
}

for (const candidate of candidates) {
  if (candidate.includes(path.sep) && !existsSync(candidate)) {
    continue;
  }
  const result = spawnSync(candidate, args, { stdio: "inherit" });
  if (result.error && result.error.code === "ENOENT") {
    continue;
  }
  if (typeof result.status === "number") {
    process.exit(result.status);
  }
  process.exit(1);
}

console.error(
  [
    "golangci-lint was not found.",
    "Install it and ensure either PATH or $(go env GOPATH)/bin exposes the binary.",
    "Official docs: https://golangci-lint.run/welcome/install/",
  ].join("\n"),
);
process.exit(1);
