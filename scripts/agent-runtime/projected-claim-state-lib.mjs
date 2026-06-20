// Projected claim state — pure rendering (no fs/git/process).
//
// Phase 2 of the specdown rewrite (SC4): the ledger/evidence surface restates the
// same tier/verdict/route claim state by hand across three framings (apex badges,
// promise ledger, evidence state) — the documented "2-axis (really 3-axis)"
// divergence. This module renders the ONE generated source — the fingerprint-keyed
// claim inventory (.cautilus/specdown/claim-inventory.json, itself projected from
// the HITL gold set) — into a single human-readable state page the evidence index
// links to. This is the generated foundation that makes that state derivable once;
// retiring the remaining hand-authored restatement in the ledger/evidence prose is
// the SC4 later-phase work this page enables, not something this module completes.
//
// It stays pure (fixture-tested) so the rendering is load-bearing, not
// decorative; render-projected-claim-state.mjs supplies the filesystem I/O and
// the drift check. The inventory is consumed read-only — this module never
// recomputes the projection, it only presents it.

export const PAGE_PATH = "docs/specs/evidence/projected-claim-state.md";

// Tier display order: headline first, then backing mechanisms, then cli detail.
export const TIER_ORDER = ["T1", "T2", "T3"];

// The gold-set ratified proof-route vocabulary, in a fixed display order so the
// distribution table is stable regardless of inventory iteration order.
export const ROUTE_ORDER = ["deterministic", "cautilus-eval", "human-auditable"];

const TIER_RANK = new Map(TIER_ORDER.map((tier, index) => [tier, index]));

function compactText(value) {
	return String(value ?? "")
		.replace(/\s+/g, " ")
		.trim();
}

// Markdown table cell escaping: collapse whitespace and neutralize the pipe so a
// summary that contains `|` cannot break the column structure. Brackets and
// backticks render fine inside a table cell and this page is a plain `.md` (never
// crawled for spec links), so they are left intact for readability.
function cell(value) {
	const text = compactText(value).replaceAll("|", "\\|");
	return text === "" ? "-" : text;
}

function table(headers, rows) {
	const lines = [
		`| ${headers.join(" | ")} |`,
		`| ${headers.map(() => "---").join(" | ")} |`,
	];
	for (const row of rows) {
		lines.push(`| ${row.map(cell).join(" | ")} |`);
	}
	return lines;
}

// Parse a `path:line` sourceRef into a comparable [path, lineNumber] pair so the
// full inventory reads in document order (README.md:4, :5, :6, :8 …) instead of
// lexical order (which would sort :102 before :18).
function sourceRefSortKey(record) {
	const ref = String(record.sourceRef ?? "");
	const lastColon = ref.lastIndexOf(":");
	if (lastColon === -1) {
		return { path: ref, line: Number.POSITIVE_INFINITY };
	}
	const path = ref.slice(0, lastColon);
	const line = Number.parseInt(ref.slice(lastColon + 1), 10);
	return { path, line: Number.isNaN(line) ? Number.POSITIVE_INFINITY : line };
}

function compareEntries(left, right) {
	const tierDelta =
		(TIER_RANK.get(left.significanceTier) ?? TIER_ORDER.length) -
		(TIER_RANK.get(right.significanceTier) ?? TIER_ORDER.length);
	if (tierDelta !== 0) return tierDelta;
	const leftKey = sourceRefSortKey(left);
	const rightKey = sourceRefSortKey(right);
	if (leftKey.path !== rightKey.path) return leftKey.path < rightKey.path ? -1 : 1;
	if (leftKey.line !== rightKey.line) return leftKey.line - rightKey.line;
	return String(left.claimId ?? "").localeCompare(String(right.claimId ?? ""));
}

// The graded inventory records as a flat, deterministically-ordered array.
export function orderedRecords(inventory) {
	return Object.entries(inventory.entriesByFingerprint ?? {})
		.map(([claimFingerprint, record]) => ({ claimFingerprint, ...record }))
		.sort(compareEntries);
}

// Proof-route distribution over the graded set, in fixed ROUTE_ORDER. An
// unexpected route still surfaces (appended after the known ones) rather than
// being silently dropped.
export function routeDistribution(inventory) {
	const counts = new Map(ROUTE_ORDER.map((route) => [route, 0]));
	for (const record of Object.values(inventory.entriesByFingerprint ?? {})) {
		const route = record.ratifiedProofRoute ?? "(none)";
		counts.set(route, (counts.get(route) ?? 0) + 1);
	}
	return [...counts.entries()].map(([route, count]) => ({ route, count }));
}

export function t1Records(inventory) {
	return orderedRecords(inventory).filter((record) => record.significanceTier === "T1");
}

function countLabel(value) {
	return String(value ?? 0);
}

function verdictBreakdown(counts) {
	const text = Object.entries(counts ?? {})
		.map(([verdict, count]) => `${verdict}: ${count}`)
		.join(", ");
	return text || "-";
}

function summaryRows(summary) {
	const byTier = summary.byTier ?? {};
	const tierLine = `T1: ${countLabel(byTier.T1)}, T2: ${countLabel(byTier.T2)}, T3: ${countLabel(byTier.T3)}`;
	return [
		["Total gold-set entries", countLabel(summary.totalEntries)],
		["Durable-graded (projected as claims)", countLabel(summary.durableGraded)],
		["Non-graded (prose to retire)", countLabel(summary.nonGraded)],
		["By tier", tierLine],
		["By maintainer verdict", verdictBreakdown(summary.byVerdict)],
		["Non-graded by verdict", verdictBreakdown(summary.nonGradedByVerdict)],
		["T1 claims bound to an apex badge", `${countLabel(summary.t1BadgeBindings)}/${countLabel(byTier.T1)}`],
		["Proof routes overridden", countLabel(summary.overridesApplied)],
	];
}

function reconciliationRows(reconciliation) {
	return (reconciliation.badges ?? []).map((badge) => [
		badge.badge,
		badge.registryProofClass ?? "(none)",
		badge.divergence,
		(badge.mismatchedClaims ?? []).join(", "),
	]);
}

// The provenance block names every input the inventory was projected from so a
// reader can trace this page back to the ratified gold set without trusting the
// page's own assertions.
function sourceOfTruthLines(inventory) {
	const from = inventory.generatedFrom ?? {};
	return [
		`- Schema: ${inventory.schemaVersion ?? "-"}`,
		`- Inventory: \`.cautilus/specdown/claim-inventory.json\``,
		`- Gold set: ${from.goldSet ?? "-"}`,
		`- Track: ${from.track ?? "-"}`,
		`- Source packet commit: ${from.packetGitCommit ?? "-"}`,
		`- Badge map: ${from.badgeMap ?? "-"}`,
		`- Proof-route overrides: ${from.proofRouteOverrides ?? "-"}`,
		`- Apex registry: ${from.registry ?? "-"}`,
	];
}

export function renderClaimState(inventory) {
	const summary = inventory.summary ?? {};
	const reconciliation = inventory.reconciliation ?? {};
	const records = orderedRecords(inventory);
	const lines = [
		"# Projected Claim State",
		"",
		"This page is generated from the fingerprint-keyed claim inventory.",
		"Do not edit it by hand.",
		"The inventory is projected from the HITL-ratified gold set; regenerate with `npm run specdown:claim-state` and check drift with `npm run specdown:claim-state:check`.",
		"It is the single generated tier/verdict/route view the ledger and evidence pages read instead of restating claim state by hand.",
		"",
		"## Source Of Truth",
		"",
		...sourceOfTruthLines(inventory),
		"",
		"## Claim State Summary",
		"",
		...table(["Dimension", "State"], summaryRows(summary)),
		"",
		"## Proof Route Distribution",
		"",
		"Ratified proof route over the durable-graded claims (after maintainer overrides).",
		"",
		...table(
			["Proof route", "Claims"],
			routeDistribution(inventory).map((entry) => [entry.route, String(entry.count)]),
		),
		"",
		"## Headline Claims And Apex Badges",
		"",
		"The seven T1 headline claims and the apex badge each binds to.",
		"The badge taxonomy and the gold-set claim taxonomy are related but distinct, so some badges carry no T1 headline claim; that is surfaced in the reconciliation below, not hidden.",
		"",
		...table(
			["Claim", "Badge", "Route", "Source", "Summary"],
			t1Records(inventory).map((record) => [
				record.claimId,
				record.badge ?? "(unbound)",
				record.ratifiedProofRoute,
				record.sourceRef,
				record.summary,
			]),
		),
		"",
		"## Apex Badge Reconciliation",
		"",
		"How each apex badge's ratified proof route relates to the registry proof class the audit gate consumes.",
		"`route-class-mismatch` and `no-t1-claim` are honest divergences the projection reports read-only; they are inputs to later proof work, not gate failures.",
		"",
		...table(
			["Badge", "Registry proof class", "Divergence", "Mismatched claims"],
			reconciliationRows(reconciliation),
		),
		"",
		`Divergent badges: ${reconciliation.divergenceCount ?? 0}/${(reconciliation.badges ?? []).length}.`,
		"",
		"## Full Claim Inventory",
		"",
		"Every durable-graded claim, in document order within tier.",
		"",
		...table(
			["Tier", "Claim", "Verdict", "Route", "Epic", "Badge", "Source"],
			records.map((record) => [
				record.significanceTier,
				record.claimId,
				record.maintainerVerdict,
				record.ratifiedProofRoute,
				record.primaryEpic,
				record.badge ?? "-",
				record.sourceRef,
			]),
		),
		"",
	];
	return `${lines.join("\n")}\n`;
}
