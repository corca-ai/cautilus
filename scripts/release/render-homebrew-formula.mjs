import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import process from "node:process";
import { pathToFileURL } from "node:url";

import { resolveReleaseTargets } from "./resolve-release-targets.mjs";

const PACKAGE_JSON_PATH = resolve(process.cwd(), "package.json");

function usage(exitCode = 0) {
	const text = [
		"Usage:",
		"  node ./scripts/release/render-homebrew-formula.mjs --sha256 <value> [--version <v0.1.0>] [--repo <owner/name>] [--output <file>]",
	].join("\n");
	const out = exitCode === 0 ? process.stdout : process.stderr;
	out.write(`${text}\n`);
	process.exit(exitCode);
}

function readRequiredValue(argv, index, option) {
	const value = argv[index + 1] || "";
	if (!value) {
		throw new Error(`${option} requires a value`);
	}
	return value;
}

function parseArgs(argv) {
	const pkg = JSON.parse(readFileSync(PACKAGE_JSON_PATH, "utf-8"));
	const targets = resolveReleaseTargets();
	const options = {
		version: `v${pkg.version}`,
		repo: targets.sourceRepo,
		sha256: "",
		output: "",
	};
	for (let index = 0; index < argv.length; index += 1) {
		const arg = argv[index];
		if (arg === "-h" || arg === "--help") {
			usage(0);
		}
		if (arg === "--version") {
			options.version = readRequiredValue(argv, index, arg);
			index += 1;
			continue;
		}
		if (arg === "--repo") {
			options.repo = readRequiredValue(argv, index, arg);
			index += 1;
			continue;
		}
		if (arg === "--sha256") {
			options.sha256 = readRequiredValue(argv, index, arg);
			index += 1;
			continue;
		}
		if (arg === "--output") {
			options.output = readRequiredValue(argv, index, arg);
			index += 1;
			continue;
		}
		throw new Error(`Unknown argument: ${arg}`);
	}
	if (!options.sha256) {
		throw new Error("--sha256 is required");
	}
	return options;
}

export function renderHomebrewFormula({ version, repo, sha256 }) {
	return `class Cautilus < Formula
  desc "Intentful behavior evaluation toolkit"
  homepage "https://github.com/${repo}"
  url "https://github.com/${repo}/archive/refs/tags/${version}.tar.gz"
  sha256 "${sha256}"
  license "MIT"

  depends_on "node"

  def install
    libexec.install Dir["*"]
    cd libexec do
      system "npm", "install", "--omit=dev", "--ignore-scripts"
    end
    (bin/"cautilus").write_env_script libexec/"bin/cautilus", PATH: ENV["PATH"]
  end

  test do
    assert_match "${version.replace(/^v/, "")}", shell_output("#{bin}/cautilus --version").strip
  end
end
`;
}

export function main(argv = process.argv.slice(2)) {
	try {
		const options = parseArgs(argv);
		const formula = renderHomebrewFormula(options);
		if (options.output) {
			writeFileSync(resolve(options.output), formula, "utf-8");
			return;
		}
		process.stdout.write(formula);
	} catch (error) {
		process.stderr.write(`${error.message}\n`);
		process.exit(1);
	}
}

const entryHref = process.argv[1] ? pathToFileURL(resolve(process.argv[1])).href : "";
if (import.meta.url === entryHref) {
	main();
}
