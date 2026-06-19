// Adapter-owned post-step: attach a reasoning-soundness judge verdict to an already-observed
// real-surface packet.
//
// The generic runtime runner (run-local-eval-test.mjs) captures the agent's genuine
// routingDecision.reasonSummary but stays judge-logic-free. This repo-specific enricher reads the
// packet it emitted, grades each matching case's reasoning through the SOT harness (compareVerdicts,
// prove-then-project replay of the captured blind verdicts), and attaches the composite as a
// `reasoningSoundness` field the product engine then ANDs into the case status.
//
// This is the convergence: the judge now grades the dogfood runner's REAL AGENTS.md reasoning
// (provenance full-runner-capture-replay) instead of a separately-harvested paraphrase, and the same
// packet already carries the deterministic surface matchers — so a case passes only when both hold.

import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import process from "node:process";

import { buildReasoningSoundness, loadCompositeContext } from "./reasoning-soundness-attach.mjs";

const DEFAULT_PROVENANCE = "full-runner-capture-replay";
const VALUE_OPTIONS = new Set(["--observed-file", "--output-file", "--calibration", "--verdicts", "--provenance", "--claim-id"]);

function fail(message) {
	process.stderr.write(`${message}\n`);
	process.exit(1);
}

function parseArgs(argv) {
	const options = { provenance: DEFAULT_PROVENANCE };
	for (let index = 0; index < argv.length; index += 1) {
		const arg = argv[index];
		if (arg === "-h" || arg === "--help") {
			process.stdout.write(
				"Usage: enrich-eval-with-reasoning-judge.mjs --observed-file <f> --calibration <f> --verdicts <f> [--output-file <f>] [--provenance <label>] [--claim-id <id>]\n",
			);
			process.exit(0);
		}
		if (!VALUE_OPTIONS.has(arg)) {
			fail(`Unknown argument: ${arg}`);
		}
		const value = argv[index + 1];
		if (value === undefined) {
			fail(`Missing value for ${arg}`);
		}
		const key = arg.slice(2).replace(/-([a-z])/g, (_, c) => c.toUpperCase());
		options[key] = value;
		index += 1;
	}
	for (const required of ["observedFile", "calibration", "verdicts"]) {
		if (!options[required]) {
			fail(`--${required.replace(/[A-Z]/g, (c) => `-${c.toLowerCase()}`)} is required`);
		}
	}
	options.outputFile = options.outputFile || options.observedFile;
	return options;
}

function main() {
	const options = parseArgs(process.argv.slice(2));
	const context = loadCompositeContext({ calibrationPath: options.calibration, verdictsPath: options.verdicts });
	if (options.claimId && options.claimId !== context.claimId) {
		fail(`--claim-id ${options.claimId} does not match the calibration claimId ${context.claimId}`);
	}

	const packet = JSON.parse(readFileSync(resolve(options.observedFile), "utf-8"));
	const evaluations = Array.isArray(packet.evaluations) ? packet.evaluations : [];
	if (evaluations.length === 0) {
		fail("observed packet must carry a non-empty evaluations array");
	}

	let attached = 0;
	for (const evaluation of evaluations) {
		const composite = context.compositeById.get(evaluation.evaluationId);
		if (!composite) {
			continue;
		}
		evaluation.reasoningSoundness = buildReasoningSoundness(
			context.claimId,
			composite,
			context.evidenceById.get(evaluation.evaluationId),
			options.provenance,
		);
		attached += 1;
	}
	if (attached === 0) {
		fail(`no evaluation in the packet matched a ${context.claimId} calibration case`);
	}

	const outputPath = resolve(options.outputFile);
	mkdirSync(dirname(outputPath), { recursive: true });
	writeFileSync(outputPath, `${JSON.stringify(packet, null, 2)}\n`);
	process.stdout.write(`enrich-eval-with-reasoning-judge: attached ${attached} reasoningSoundness verdict(s) to ${outputPath}\n`);
}

main();
