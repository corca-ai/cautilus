// Surface Honesty Audit — pure computation.
//
// The apex spec (docs/specs/index.spec.md) is the only place a promise's badge
// LEVEL is declared (`### Title — proven|declared|promised`). The audit registry
// declares only each badge's proof ROUTE (which leaf spec, proof class, command,
// and evidence files) — never the level. This module recomputes the OBSERVED
// level by inspecting reality (does the leaf spec carry executable checks? do the
// evidence files exist?) and reports a badge as consistent only when the apex's
// claimed level matches what the proof route actually delivers.
//
// Keeping the claimed level in the apex and the observed level in inspection is
// what makes a badge load-bearing instead of decorative prose: bumping a badge to
// "proven" without the backing proof makes claimed !== observed, so the audit
// fails. This file stays pure (no fs/git/process) so the rules are fixture-tested;
// build-surface-audit.mjs supplies the filesystem predicates.

export const SCHEMA_VERSION = "cautilus.surface_audit.v1";

export const STATUS_LEVELS = ["proven", "declared", "promised"];

// Each proof class maps to the highest honest level it can deliver, plus the
// one-line meaning the audit surface shows so "proven" is never overstated.
export const PROOF_CLASSES = {
	deterministic: {
		provenLevel: "proven",
		label: "deterministic",
		meaning:
			"`npm run lint:specs` runs the command/file checks live on every run.",
	},
	"live-replayed": {
		provenLevel: "proven",
		label: "live-replayed",
		meaning:
			"the default run replays an operator-witnessed live capture and blind verdict; the live agent re-run is opt-in and costs a real agent run.",
	},
	"projected-bundle": {
		provenLevel: "declared",
		label: "projected-bundle",
		meaning:
			"the proof projects a saved evidence bundle; the behavior has not been re-run live yet.",
	},
	none: {
		provenLevel: "promised",
		label: "none",
		meaning: "stated, with no executable proof attached yet.",
	},
};

const UNPROVEN = "unproven";

export function slugify(title) {
	return String(title)
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, "-")
		.replace(/^-+|-+$/g, "");
}

// A fenced code block toggles on/off at a ``` or ~~~ delimiter line. We skip
// fenced content so a `> check:` or `### Title — proven` shown as an EXAMPLE inside
// a code fence is never mistaken for a real check or badge.
function isFenceDelimiter(line) {
	return /^\s*(```|~~~)/.test(line);
}

// Parse `### Title — <status phrase>` badge headings out of the apex markdown.
// Only headings whose first status word is a known level count as badges, so
// ordinary `###` subheadings are ignored, and fenced examples never count.
export function parseApexBadges(markdown) {
	const badges = [];
	let inFence = false;
	for (const rawLine of String(markdown).split("\n")) {
		if (isFenceDelimiter(rawLine)) {
			inFence = !inFence;
			continue;
		}
		if (inFence) {
			continue;
		}
		const match = /^###\s+(.+?)\s+—\s+(.+)$/.exec(rawLine.trim());
		if (!match) {
			continue;
		}
		const title = match[1].trim();
		const statusPhrase = match[2].trim();
		const word = statusPhrase.split(/[\s,;.]+/)[0].toLowerCase();
		if (!STATUS_LEVELS.includes(word)) {
			continue;
		}
		badges.push({ title, claimedStatus: word, statusPhrase });
	}
	return badges;
}

// Count executable `> check:` directives in a spec body so "proven" requires the
// leaf to actually carry checks, not just exist. Fenced examples do not count.
export function countSpecChecks(specBody) {
	if (!specBody) {
		return 0;
	}
	let count = 0;
	let inFence = false;
	for (const line of String(specBody).split("\n")) {
		if (isFenceDelimiter(line)) {
			inFence = !inFence;
			continue;
		}
		if (inFence) {
			continue;
		}
		if (/^\s*>\s*check:/.test(line)) {
			count += 1;
		}
	}
	return count;
}

export function computeObserved(entry, { fileExists, readCheckCount }) {
	const proofSpec = entry.proofSpec || null;
	const proofSpecExists = proofSpec ? Boolean(fileExists(proofSpec)) : false;
	const checkCount = proofSpec && proofSpecExists ? readCheckCount(proofSpec) : 0;
	const evidence = entry.evidence || [];
	const missingEvidence = evidence.filter((path) => !fileExists(path));
	const evidencePresent = missingEvidence.length === 0;
	const proofClass = entry.proofClass;
	let observedStatus;
	if (proofClass === "none") {
		observedStatus = "promised";
	} else {
		const classMeta = PROOF_CLASSES[proofClass];
		const routeOk = Boolean(classMeta) && proofSpecExists && checkCount > 0 && evidencePresent;
		observedStatus = routeOk ? classMeta.provenLevel : UNPROVEN;
	}
	return {
		proofSpecExists,
		checkCount,
		evidenceCount: evidence.length,
		missingEvidence,
		evidencePresent,
		observedStatus,
	};
}

function inconsistencyReasons(badge, entry, observed) {
	const reasons = [];
	if (!entry) {
		reasons.push("apex badge has no registry proof route");
		return reasons;
	}
	if (!PROOF_CLASSES[entry.proofClass]) {
		reasons.push(`unknown proof class: ${entry.proofClass}`);
	}
	if (observed.observedStatus !== badge.claimedStatus) {
		reasons.push(
			`apex claims "${badge.claimedStatus}" but proof route observes "${observed.observedStatus}"`,
		);
	}
	if (entry.proofClass !== "none" && !observed.proofSpecExists) {
		reasons.push(`proof spec missing: ${entry.proofSpec}`);
	}
	if (entry.proofClass !== "none" && observed.proofSpecExists && observed.checkCount === 0) {
		reasons.push(`proof spec carries no executable checks: ${entry.proofSpec}`);
	}
	if (observed.missingEvidence.length > 0) {
		reasons.push(`missing evidence files: ${observed.missingEvidence.join(", ")}`);
	}
	return reasons;
}

function emptyRoute(badge) {
	return { id: slugify(badge.title), proofClass: null, proofSpec: null, proofCommand: null, liveOptInCommand: null, evidence: [] };
}

function unprovenObserved() {
	return { proofSpecExists: false, checkCount: 0, evidenceCount: 0, missingEvidence: [], evidencePresent: false, observedStatus: UNPROVEN };
}

function auditBadge(badge, entry, predicates) {
	const route = entry || emptyRoute(badge);
	const observed = entry ? computeObserved(entry, predicates) : unprovenObserved();
	const reasons = inconsistencyReasons(badge, entry, observed);
	const classMeta = PROOF_CLASSES[route.proofClass];
	return {
		id: route.id,
		title: badge.title,
		claimedStatus: badge.claimedStatus,
		claimedStatusPhrase: badge.statusPhrase,
		proofClass: route.proofClass,
		proofClassMeaning: classMeta ? classMeta.meaning : null,
		proofSpec: route.proofSpec,
		proofCommand: route.proofCommand,
		liveOptInCommand: route.liveOptInCommand,
		evidence: route.evidence || [],
		observed,
		consistent: reasons.length === 0,
		inconsistencyReasons: reasons,
	};
}

export function auditSurface({ apexMarkdown, registry, fileExists, readCheckCount }) {
	const apexBadges = parseApexBadges(apexMarkdown);
	const registryByTitle = new Map(registry.map((entry) => [entry.title, entry]));
	const apexTitles = new Set(apexBadges.map((badge) => badge.title));
	const orphanIssues = [];

	const badges = apexBadges.map((badge) =>
		auditBadge(badge, registryByTitle.get(badge.title) || null, { fileExists, readCheckCount }),
	);

	for (const badge of apexBadges) {
		if (!registryByTitle.has(badge.title)) {
			orphanIssues.push(`apex badge "${badge.title}" has no registry proof route`);
		}
	}
	for (const entry of registry) {
		if (!apexTitles.has(entry.title)) {
			orphanIssues.push(`registry route "${entry.title}" has no apex badge`);
		}
	}

	return { badges, orphanIssues, summary: summarize(badges, orphanIssues) };
}

function summarize(badges, orphanIssues) {
	const byClaimedStatus = Object.fromEntries(STATUS_LEVELS.map((level) => [level, 0]));
	let consistent = 0;
	for (const badge of badges) {
		if (STATUS_LEVELS.includes(badge.claimedStatus)) {
			byClaimedStatus[badge.claimedStatus] += 1;
		}
		if (badge.consistent) {
			consistent += 1;
		}
	}
	const inconsistent = badges.length - consistent;
	return {
		total: badges.length,
		byClaimedStatus,
		consistent,
		inconsistent,
		orphanIssueCount: orphanIssues.length,
		honest: inconsistent === 0 && orphanIssues.length === 0,
	};
}

export function buildManifest({ apexPath, registryPath, apexMarkdown, registry, fileExists, readCheckCount }) {
	const audited = auditSurface({ apexMarkdown, registry, fileExists, readCheckCount });
	return {
		schemaVersion: SCHEMA_VERSION,
		generatedFrom: {
			apex: apexPath,
			registry: registryPath,
			note: "Generated by scripts/agent-runtime/build-surface-audit.mjs. Do not edit by hand; run `npm run audit:surface`.",
		},
		legend: {
			claimedStatus: "the badge level declared in the apex spec",
			observedStatus: "the level the proof route actually delivers, recomputed by inspecting the leaf spec checks and evidence files",
			consistent: "claimedStatus === observedStatus and the proof route is intact",
			proofClasses: Object.fromEntries(
				Object.entries(PROOF_CLASSES).map(([key, value]) => [key, value.meaning]),
			),
		},
		summary: audited.summary,
		orphanIssues: audited.orphanIssues,
		badges: audited.badges,
	};
}

function statusEmoji(consistent) {
	return consistent ? "✅" : "❌";
}

function evidenceCell(badge) {
	if (badge.proofClass === "none") {
		return "—";
	}
	if (badge.evidence.length === 0) {
		return "live command checks";
	}
	const missing = badge.observed.missingEvidence.length;
	const suffix = missing > 0 ? ` (⚠ ${missing} missing)` : "";
	return `${badge.evidence.length} file(s)${suffix}`;
}

function refreshCell(badge) {
	if (badge.proofClass === "live-replayed" && badge.liveOptInCommand) {
		return `replayed; live re-run \`${badge.liveOptInCommand}\``;
	}
	if (badge.proofClass === "projected-bundle" && badge.liveOptInCommand) {
		return `projected; live \`${badge.liveOptInCommand}\``;
	}
	if (badge.proofClass === "deterministic") {
		return "runs every gate";
	}
	if (badge.proofClass === "none") {
		return "no executable proof yet";
	}
	return "replayed";
}

function renderAuditHeader(manifest, manifestPath) {
	return [
		"# Surface Honesty Audit",
		"",
		"This page is generated by `npm run audit:surface`. Do not edit it by hand.",
		"It is the navigable, runnable audit of every promise badge on the [apex spec](index.spec.md):",
		"for each badge it shows the level the apex CLAIMS, the level the proof route is OBSERVED to deliver, the proof class, the command that runs it, and whether the two agree.",
		"A badge is honest only when `consistent` is true; the apex's own check block fails specdown if any badge over-claims.",
		"",
		"## Audit Source Of Truth",
		"",
		`- Apex (declares each badge level): [${manifest.generatedFrom.apex}](index.spec.md)`,
		`- Registry (declares each proof route, never the level): ${manifest.generatedFrom.registry}`,
		`- Manifest (recomputed observed state): ${manifestPath}`,
		"",
	];
}

function renderScoreboard(summary) {
	return [
		"## Scoreboard",
		"",
		"| Dimension | Value |",
		"| --- | --- |",
		`| Badges | ${summary.total} |`,
		`| Claimed | proven: ${summary.byClaimedStatus.proven}, declared: ${summary.byClaimedStatus.declared}, promised: ${summary.byClaimedStatus.promised} |`,
		`| Consistent | ${summary.consistent} / ${summary.total} |`,
		`| Honest | ${summary.honest ? "yes" : "NO — see inconsistencies below"} |`,
		"",
	];
}

function renderBadgeRow(badge) {
	const specLink = badge.proofSpec ? `[${badge.title}](${leafLink(badge.proofSpec)})` : badge.title;
	const command = badge.proofCommand ? `\`${badge.proofCommand}\`` : "—";
	return `| ${statusEmoji(badge.consistent)} | ${specLink} | ${badge.claimedStatus} | ${badge.observed.observedStatus} | ${badge.proofClass ?? "—"} | ${command} | ${evidenceCell(badge)} | ${refreshCell(badge)} |`;
}

function renderBadgeTable(badges) {
	return [
		"## Per-Badge Audit",
		"",
		"| | Badge | Claimed | Observed | Class | Proof command | Evidence | Freshness |",
		"| --- | --- | --- | --- | --- | --- | --- | --- |",
		...badges.map(renderBadgeRow),
		"",
		"## Proof Class Meanings",
		"",
		"| Class | What `proven`/`declared` means for this class |",
		"| --- | --- |",
		...Object.entries(PROOF_CLASSES).map(([key, value]) => `| ${key} | ${value.meaning} |`),
		"",
	];
}

function renderInconsistencies(manifest) {
	if (manifest.summary.honest) {
		return ["## Inconsistencies", "", "None. Every apex badge matches the level its proof route delivers.", ""];
	}
	const issues = manifest.badges.flatMap((badge) =>
		badge.inconsistencyReasons.map((reason) => `- ${badge.title}: ${reason}`),
	);
	return ["## Inconsistencies", "", ...manifest.orphanIssues.map((issue) => `- ${issue}`), ...issues, ""];
}

function renderAssertions(manifestPath) {
	return [
		"## What This Audit Asserts",
		"",
		"- Each badge's claimed level matches the level its proof route is observed to deliver (`consistent`).",
		"- Every apex badge has a registry proof route and every registry route has an apex badge (no orphans).",
		"- The leaf spec for each non-promised badge carries executable `> check:` blocks and its evidence files exist.",
		"",
		"This audit is STRUCTURAL, not semantic: it confirms each badge has a real, intact proof route, but it does NOT verify that the leaf spec's check blocks actually test the claimed behavior end-to-end, nor that the registry points its proof route at the right spec. That correctness is the leaf-spec author's and code review's responsibility; `npm run lint:specs` runs the leaf checks themselves and fails if any break.",
		"It also does NOT re-run the live agent proofs; live evidence is replayed from operator-witnessed captures and re-run on demand via the per-badge `Freshness` command.",
		"",
		"> check:cautilus-json-file",
		"| path | json_path | equals |",
		"| --- | --- | --- |",
		`| ${manifestPath} | schemaVersion | ${SCHEMA_VERSION} |`,
		`| ${manifestPath} | summary.honest | true |`,
		`| ${manifestPath} | summary.inconsistent | 0 |`,
		`| ${manifestPath} | summary.orphanIssueCount | 0 |`,
	];
}

// Render the navigable, human-readable audit index (docs/specs/audit.spec.md).
// manifestPath is repo-root-relative for the specdown check block. Leaf links are
// resolved relative to docs/specs/ since audit.spec.md lives there.
export function renderAuditMarkdown(manifest, { manifestPath } = {}) {
	return [
		...renderAuditHeader(manifest, manifestPath),
		...renderScoreboard(manifest.summary),
		...renderBadgeTable(manifest.badges),
		...renderInconsistencies(manifest),
		...renderAssertions(manifestPath),
	].join("\n");
}

function leafLink(proofSpec) {
	// proofSpec is repo-root-relative (docs/specs/user/...). audit.spec.md lives at
	// docs/specs/audit.spec.md, so strip the docs/specs/ prefix for the relative link.
	const prefix = "docs/specs/";
	return proofSpec.startsWith(prefix) ? proofSpec.slice(prefix.length) : proofSpec;
}
