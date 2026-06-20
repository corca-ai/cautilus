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
	"cautilus-eval": {
		provenLevel: "proven",
		label: "cautilus-eval",
		meaning:
			"the default run replays an operator-witnessed live agent capture and a blind judge verdict from the Cautilus eval tier; the live agent re-run is opt-in and costs a real agent run.",
	},
	"human-auditable": {
		provenLevel: "proven",
		label: "human-auditable",
		meaning:
			"an operator witnessed the live run and vouches for it; the default run replays the checked-in capture and the live re-run is opt-in. No automated judge — accepted where a full deterministic or eval proof would be disproportionately costly.",
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

function parseTableRow(line) {
	return line
		.trim()
		.replace(/^\|/, "")
		.replace(/\|$/, "")
		.split("|")
		.map((cell) => cell.trim());
}

function isSeparatorRow(cells) {
	return cells.length > 0 && cells.every((cell) => /^:?-+:?$/.test(cell));
}

// Walk a spec body once, fence-aware, splitting it into one block per `> check:`
// directive: { kind, tableLines }. Lines before the first directive and any
// fenced content are ignored, so a check shown as an EXAMPLE inside a code fence
// never produces a block.
function collectCheckBlocks(specBody) {
	const blocks = [];
	let inFence = false;
	let current = null;
	for (const line of String(specBody).split("\n")) {
		if (isFenceDelimiter(line)) {
			inFence = !inFence;
			current = null;
			continue;
		}
		if (inFence) {
			continue;
		}
		const checkMatch = /^\s*>\s*check:([a-z0-9-]+)/i.exec(line);
		if (checkMatch) {
			current = { kind: checkMatch[1].toLowerCase(), tableLines: [] };
			blocks.push(current);
		} else if (current && /^\s*\|/.test(line)) {
			current.tableLines.push(line);
		} else {
			current = null;
		}
	}
	return blocks;
}

// Return the values in the `path` column of a markdown table, skipping the header
// and separator rows and empty cells.
function tablePathColumnValues(tableLines) {
	if (tableLines.length === 0) {
		return [];
	}
	const [header, ...rows] = tableLines;
	const pathColumn = parseTableRow(header).indexOf("path");
	if (pathColumn < 0) {
		return [];
	}
	return rows
		.map(parseTableRow)
		.filter((cells) => !isSeparatorRow(cells) && cells[pathColumn])
		.map((cells) => cells[pathColumn]);
}

// Extract the set of checked-in FILE paths a spec body actually asserts on: the
// `path` column of every `> check:cautilus-json-file` table. This is the semantic
// spine of the audit. A purely structural audit ("the leaf carries some checks")
// cannot tell whether the route points at the right spec or whether the evidence
// it declares is decorative; this can. Only `cautilus-json-file` checks read a
// file by path — other kinds (e.g. `cautilus-json-command`) put a JSON path, not
// a file path, in their `path` column, so they are never counted.
export function extractCheckedFilePaths(specBody) {
	const paths = new Set();
	for (const block of collectCheckBlocks(specBody)) {
		if (block.kind === "cautilus-json-file") {
			for (const value of tablePathColumnValues(block.tableLines)) {
				paths.add(value);
			}
		}
	}
	return paths;
}

// Split a check table into a named header and its data rows (separator rows
// dropped), so a row can be read by column name rather than by position.
function parseCheckTable(tableLines) {
	if (tableLines.length === 0) {
		return { header: [], rows: [] };
	}
	const [headerLine, ...rest] = tableLines;
	const header = parseTableRow(headerLine);
	const rows = rest.map(parseTableRow).filter((cells) => !isSeparatorRow(cells));
	return { header, rows };
}

function cellValue(header, cells, name) {
	const index = header.indexOf(name);
	return index >= 0 ? (cells[index] ?? "") : "";
}

const SCHEMA_VERSION_SEGMENT = "schemaversion";

function finalPathSegment(jsonPath) {
	const parts = String(jsonPath).split(".");
	return parts[parts.length - 1] || "";
}

// Assertion-value floor: a `cautilus-json-file` row is SUBSTANTIVE only when it
// carries a value-bearing comparator (a non-empty equals/includes/meaning, or a
// min_number ≥ 1) on a json path whose final segment is not `schemaVersion`. A
// row is otherwise TRIVIAL — a version-tag touch (`…schemaVersion`), an
// `exists`-only presence check, a `min_number 0` tautology, or an empty-cell
// comparator the adapter treats as a no-op (scripts/specdown/cautilus-adapter.mjs
// guards each comparator on a truthy cell). The effective json path mirrors the
// adapter: `json_path`, falling back to `path`. This is what closes the residual
// STRUCTURAL gap left by extractCheckedFilePaths: an evidence file that is merely
// READ by a hollow well-formedness check, but never substantively asserted on,
// no longer satisfies the binding. It deliberately does NOT judge whether a
// substantive value is behaviorally EARNED — that semantic call stays with the
// leaf-spec author, code review, and the deferred reasoning judge.
function rowSubstantiveFilePath(header, cells) {
	const path = cellValue(header, cells, "path");
	if (!path) {
		return null;
	}
	const jsonPath = cellValue(header, cells, "json_path") || path;
	if (finalPathSegment(jsonPath).toLowerCase() === SCHEMA_VERSION_SEGMENT) {
		return null;
	}
	const minNumber = cellValue(header, cells, "min_number");
	const hasMinNumber = minNumber !== "" && Number.isFinite(Number(minNumber)) && Number(minNumber) >= 1;
	const valueBearing =
		cellValue(header, cells, "equals") !== "" ||
		cellValue(header, cells, "includes") !== "" ||
		cellValue(header, cells, "meaning") !== "" ||
		hasMinNumber;
	return valueBearing ? path : null;
}

// Extract the set of checked-in FILE paths a spec body asserts on SUBSTANTIVELY
// (see rowSubstantiveFilePath). A subset of extractCheckedFilePaths: every path
// here is also referenced, but a path referenced only by trivial rows is omitted.
export function extractSubstantiveFilePaths(specBody) {
	const paths = new Set();
	for (const block of collectCheckBlocks(specBody)) {
		if (block.kind !== "cautilus-json-file") {
			continue;
		}
		const { header, rows } = parseCheckTable(block.tableLines);
		if (header.indexOf("path") < 0) {
			continue;
		}
		for (const cells of rows) {
			const path = rowSubstantiveFilePath(header, cells);
			if (path) {
				paths.add(path);
			}
		}
	}
	return paths;
}

// Semantic binding: each declared evidence file must actually be read by a
// `cautilus-json-file` check in the proof spec. This is what closes the
// redirect/hollow gap — a route that points its proofSpec at an unrelated spec,
// or pads its evidence list with files the spec never asserts on, no longer
// observes as proven. Skipped (treated as referenced) only when the caller
// supplies no reference reader — pure-unit callers that do not exercise this
// layer; the real build always supplies it.
function computeEvidenceReference(entry, proofSpecExists, readReferencedFilePaths, readSubstantiveFilePaths) {
	const evidence = entry.evidence || [];
	const baseCanCheck = Boolean(entry.proofSpec) && proofSpecExists && evidence.length > 0;
	const filterUnmatched = (reader) => {
		if (!baseCanCheck || typeof reader !== "function") {
			return null;
		}
		const matched = new Set(reader(entry.proofSpec));
		return evidence.filter((path) => !matched.has(path));
	};
	// Layer ②: evidence is READ by some cautilus-json-file check.
	const unreferencedEvidence = filterUnmatched(readReferencedFilePaths) ?? [];
	// Layer ③ (structural half): evidence is read by at least one SUBSTANTIVE check.
	const nonSubstantiveEvidence = filterUnmatched(readSubstantiveFilePaths) ?? [];
	return {
		unreferencedEvidence,
		evidenceReferenced: unreferencedEvidence.length === 0,
		nonSubstantiveEvidence,
		evidenceSubstantive: nonSubstantiveEvidence.length === 0,
	};
}

function observeStatus(proofClass, { proofSpecExists, checkCount, evidencePresent, evidenceReferenced, evidenceSubstantive }) {
	if (proofClass === "none") {
		return "promised";
	}
	const classMeta = PROOF_CLASSES[proofClass];
	const routeOk =
		Boolean(classMeta) &&
		proofSpecExists &&
		checkCount > 0 &&
		evidencePresent &&
		evidenceReferenced &&
		evidenceSubstantive;
	return routeOk ? classMeta.provenLevel : UNPROVEN;
}

export function computeObserved(entry, { fileExists, readCheckCount, readReferencedFilePaths, readSubstantiveFilePaths }) {
	const proofSpec = entry.proofSpec || null;
	const proofSpecExists = proofSpec ? Boolean(fileExists(proofSpec)) : false;
	const checkCount = proofSpec && proofSpecExists ? readCheckCount(proofSpec) : 0;
	const evidence = entry.evidence || [];
	const missingEvidence = evidence.filter((path) => !fileExists(path));
	const evidencePresent = missingEvidence.length === 0;
	const { unreferencedEvidence, evidenceReferenced, nonSubstantiveEvidence, evidenceSubstantive } =
		computeEvidenceReference(entry, proofSpecExists, readReferencedFilePaths, readSubstantiveFilePaths);
	const observedStatus = observeStatus(entry.proofClass, {
		proofSpecExists,
		checkCount,
		evidencePresent,
		evidenceReferenced,
		evidenceSubstantive,
	});
	return {
		proofSpecExists,
		checkCount,
		evidenceCount: evidence.length,
		missingEvidence,
		evidencePresent,
		unreferencedEvidence,
		evidenceReferenced,
		nonSubstantiveEvidence,
		evidenceSubstantive,
		observedStatus,
	};
}

// Evidence-binding inconsistency reasons (missing / unreferenced / non-substantive),
// split out so the per-class checks above stay under the complexity budget.
function evidenceReasons(entry, observed) {
	const reasons = [];
	if (observed.missingEvidence.length > 0) {
		reasons.push(`missing evidence files: ${observed.missingEvidence.join(", ")}`);
	}
	if (observed.unreferencedEvidence && observed.unreferencedEvidence.length > 0) {
		reasons.push(
			`evidence not referenced by any cautilus-json-file check in ${entry.proofSpec}: ${observed.unreferencedEvidence.join(", ")} (the proof route may point at the wrong spec, or the leaf spec does not assert on this evidence)`,
		);
	}
	if (observed.nonSubstantiveEvidence && observed.nonSubstantiveEvidence.length > 0) {
		reasons.push(
			`evidence referenced only by a trivial check (schemaVersion / exists / min_number 0) in ${entry.proofSpec}: ${observed.nonSubstantiveEvidence.join(", ")} (a check reads the file but asserts only well-formedness, not the claimed behavior — add a substantive equals/includes/min_number assertion on a behavioral field)`,
		);
	}
	return reasons;
}

function inconsistencyReasons(badge, entry, observed) {
	if (!entry) {
		return ["apex badge has no registry proof route"];
	}
	const reasons = [];
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
	reasons.push(...evidenceReasons(entry, observed));
	return reasons;
}

function emptyRoute(badge) {
	return { id: slugify(badge.title), proofClass: null, proofSpec: null, proofCommand: null, liveOptInCommand: null, evidence: [] };
}

function unprovenObserved() {
	return { proofSpecExists: false, checkCount: 0, evidenceCount: 0, missingEvidence: [], evidencePresent: false, unreferencedEvidence: [], evidenceReferenced: false, nonSubstantiveEvidence: [], evidenceSubstantive: false, observedStatus: UNPROVEN };
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

export function auditSurface({ apexMarkdown, registry, fileExists, readCheckCount, readReferencedFilePaths, readSubstantiveFilePaths }) {
	const apexBadges = parseApexBadges(apexMarkdown);
	const registryByTitle = new Map(registry.map((entry) => [entry.title, entry]));
	const apexTitles = new Set(apexBadges.map((badge) => badge.title));
	const orphanIssues = [];

	const badges = apexBadges.map((badge) =>
		auditBadge(badge, registryByTitle.get(badge.title) || null, {
			fileExists,
			readCheckCount,
			readReferencedFilePaths,
			readSubstantiveFilePaths,
		}),
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

export function buildManifest({ apexPath, registryPath, apexMarkdown, registry, fileExists, readCheckCount, readReferencedFilePaths, readSubstantiveFilePaths }) {
	const audited = auditSurface({ apexMarkdown, registry, fileExists, readCheckCount, readReferencedFilePaths, readSubstantiveFilePaths });
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
			evidenceReferenced:
				"every evidence file the route declares is actually read by a cautilus-json-file check in the leaf spec, so the proof route cannot point at an unrelated spec or pad its evidence count with files the spec never asserts on",
			evidenceSubstantive:
				"every evidence file the route declares is read by at least one SUBSTANTIVE cautilus-json-file check — a value-bearing equals/includes/min_number≥1/meaning assertion on a field other than schemaVersion, not merely an exists or version-tag touch — so a route cannot satisfy the reference with a hollow well-formedness check",
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
	const flags = [];
	const missing = badge.observed.missingEvidence.length;
	const unreferenced = badge.observed.unreferencedEvidence ? badge.observed.unreferencedEvidence.length : 0;
	const nonSubstantive = badge.observed.nonSubstantiveEvidence ? badge.observed.nonSubstantiveEvidence.length : 0;
	if (missing > 0) {
		flags.push(`⚠ ${missing} missing`);
	}
	if (unreferenced > 0) {
		flags.push(`⚠ ${unreferenced} unreferenced`);
	}
	if (nonSubstantive > 0) {
		flags.push(`⚠ ${nonSubstantive} non-substantive`);
	}
	const suffix = flags.length > 0 ? ` (${flags.join(", ")})` : "";
	return `${badge.evidence.length} file(s)${suffix}`;
}

function refreshCell(badge) {
	if (badge.proofClass === "cautilus-eval" && badge.liveOptInCommand) {
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
		"- Every evidence file a non-promised badge declares is actually read by a `cautilus-json-file` check in its leaf spec (`evidenceReferenced`), so the proof route cannot redirect to an unrelated spec or pad its evidence count with files the spec never asserts on.",
		"- Every evidence file is read by at least one SUBSTANTIVE `cautilus-json-file` check (`evidenceSubstantive`) — a value-bearing `equals`/`includes`/`min_number`≥1/`meaning` assertion on a field other than `schemaVersion`, not merely an `exists` or version-tag touch — so a route cannot satisfy the reference with a hollow well-formedness check that reads the file but asserts nothing about the claimed behavior.",
		"",
		"This audit is SEMANTICALLY BOUND for every badge that declares evidence: the reference check closes the redirect/hollow gap a purely structural \"the leaf has some checks\" test leaves open, and the substantive check (`evidenceSubstantive`) closes the schema-only/exists-only padding gap a bare reference check leaves open — a route can no longer observe as proven by touching its evidence file with only a `schemaVersion` or `exists` assertion. What it still does NOT verify is whether a substantive assertion's VALUE is behaviorally earned — `decision.evidenceStatus equals satisfied` is structurally substantive, but whether \"satisfied\" is deserved is a SEMANTIC judgment a deterministic check cannot make — so that correctness stays the leaf-spec author's and code review's responsibility; `npm run lint:specs` runs the leaf checks themselves and fails if any break. Evidence-less command-proof routes (Readiness) carry no evidence to cross-reference, so they stay bound to their leaf spec by title plus their own live `cautilus doctor` checks rather than by an evidence cross-reference.",
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
