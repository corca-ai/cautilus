// Gold-set projection — pure computation (no fs/git/process).
//
// The spec surface under docs/specs/ used to be hand-authored across three
// framings (apex badges, promise ledger, evidence state) of the same claim set.
// This module projects the ONE ratified source — the HITL gold set
// (gold-set-proposal.user-product.json) — into a single fingerprint-keyed claim
// inventory, so the inventory layer is generated from one answer key instead of
// maintained three ways.
//
// It stays pure (fixture-tested) so the projection rules are load-bearing, not
// decorative; build-goldset-projection.mjs supplies the filesystem I/O. Anchor
// by claimFingerprint only — the gold set's line anchors are stale at HEAD and
// the ratified verdicts deliberately carry by fingerprint.

export const SCHEMA_VERSION = "cautilus.claim_inventory.v1";

// maintainerVerdict ∈ durable-graded → projects as a tiered claim.
export const DURABLE_GRADED_VERDICTS = ["accept", "relabel", "rewrite-source"];
// maintainerVerdict ∈ non-graded → marks prose to retire, never a claim.
export const NON_GRADED_VERDICTS = ["not-a-claim", "retire-source", "badly-bounded"];

export const TIERS = ["T1", "T2", "T3"];

// The apex promise badges (docs/specs/index.spec.md), in page order.
export const APEX_BADGE_IDS = [
	"readiness",
	"claim-discovery",
	"behavior-evaluation",
	"bounded-improvement",
	"reviewable-artifacts",
	"host-ownership",
	"a-testable-agent",
];

// The gold-set proof route vocabulary (agentLabels.recommendedProof / overrides).
export const VALID_PROOF_ROUTES = ["deterministic", "cautilus-eval", "human-auditable"];

// Gold-set proof route → apex registry proof class. As of 2026-06-21 the apex
// proof-class vocabulary was realigned to the gold-set route vocabulary, so the
// three proven verdict modes share one name and this bridge is the IDENTITY map:
// `deterministic`, `cautilus-eval`, and `human-auditable` each map to themselves.
// (`projected-bundle`/`none` are realization tiers with no route counterpart, so
// a badge still at those tiers reconciles as a route-class-mismatch by design.)
export const ROUTE_TO_PROOF_CLASS = {
	deterministic: "deterministic",
	"cautilus-eval": "cautilus-eval",
	"human-auditable": "human-auditable",
};

export function isDurableGraded(entry) {
	return DURABLE_GRADED_VERDICTS.includes(entry.maintainerVerdict);
}

export function isNonGraded(entry) {
	return NON_GRADED_VERDICTS.includes(entry.maintainerVerdict);
}

export function badgeByFingerprint(badgeMapDoc) {
	const map = new Map();
	for (const binding of badgeMapDoc.bindings || []) {
		map.set(binding.claimFingerprint, binding.badge);
	}
	return map;
}

export function overrideRouteByFingerprint(overrideDoc) {
	const map = new Map();
	for (const override of overrideDoc.overrides || []) {
		map.set(override.claimFingerprint, override.ratifiedProofRoute);
	}
	return map;
}

// The ratified proof route honors the maintainer override surface first (FD5),
// then falls back to the structured agentLabels.recommendedProof. The prose
// `note` is never parsed.
export function resolveProofRoute(entry, overrideMap) {
	if (overrideMap.has(entry.claimFingerprint)) {
		return { route: overrideMap.get(entry.claimFingerprint), overridden: true };
	}
	const recommended = entry.agentLabels?.recommendedProof ?? null;
	return { route: recommended, overridden: false };
}

export function projectEntry(entry, { badgeMap, overrideMap }) {
	const labels = entry.agentLabels || {};
	const tier = entry.significanceTier ?? null;
	const { route, overridden } = resolveProofRoute(entry, overrideMap);
	return {
		claimId: entry.claimId ?? null,
		significanceTier: tier,
		ratifiedProofRoute: route,
		recommendedProof: labels.recommendedProof ?? null,
		routeOverridden: overridden,
		primaryEpic: labels.primaryEpic ?? null,
		summary: entry.summary ?? null,
		sourceRef: entry.sourceRef ?? null,
		audience: labels.claimAudience ?? null,
		maintainerVerdict: entry.maintainerVerdict ?? null,
		badge: tier === "T1" ? badgeMap.get(entry.claimFingerprint) ?? null : null,
	};
}

export function summarize(allEntries, gradedEntries) {
	const byTier = { T1: 0, T2: 0, T3: 0 };
	const byVerdict = {};
	for (const entry of gradedEntries) {
		if (entry.significanceTier) byTier[entry.significanceTier] += 1;
		byVerdict[entry.maintainerVerdict] = (byVerdict[entry.maintainerVerdict] || 0) + 1;
	}
	const nonGraded = allEntries.filter(isNonGraded);
	const nonGradedByVerdict = {};
	for (const entry of nonGraded) {
		nonGradedByVerdict[entry.maintainerVerdict] =
			(nonGradedByVerdict[entry.maintainerVerdict] || 0) + 1;
	}
	return {
		totalEntries: allEntries.length,
		durableGraded: gradedEntries.length,
		nonGraded: nonGraded.length,
		byTier,
		byVerdict,
		nonGradedByVerdict,
	};
}

function classifyBadge(badgeId, registryProofClass, bound) {
	const detailed = bound.map((claim) => {
		const impliedProofClass = ROUTE_TO_PROOF_CLASS[claim.ratifiedProofRoute] ?? null;
		return {
			...claim,
			impliedProofClass,
			matchesRegistry: impliedProofClass === registryProofClass,
		};
	});
	if (detailed.length === 0) {
		return { badge: badgeId, registryProofClass, boundT1: [], divergence: "no-t1-claim" };
	}
	const mismatched = detailed.filter((claim) => !claim.matchesRegistry);
	return {
		badge: badgeId,
		registryProofClass,
		boundT1: detailed,
		divergence: mismatched.length === 0 ? "aligned" : "route-class-mismatch",
		mismatchedClaims: mismatched.map((claim) => claim.claimId),
	};
}

// Reconcile the projected ratified proof routes against the apex proof-route
// registry (surface-registry.json). Read-only: it reports divergence, it never
// rewrites the registry (SC3/AC4).
export function reconcileBadges(entriesByFingerprint, registryDoc) {
	const routes = registryDoc.routes || [];
	const proofClassByBadge = new Map(routes.map((route) => [route.id, route.proofClass]));
	const boundByBadge = new Map(APEX_BADGE_IDS.map((id) => [id, []]));
	for (const [fingerprint, record] of Object.entries(entriesByFingerprint)) {
		if (record.significanceTier !== "T1" || !record.badge) continue;
		if (!boundByBadge.has(record.badge)) boundByBadge.set(record.badge, []);
		boundByBadge.get(record.badge).push({
			claimFingerprint: fingerprint,
			claimId: record.claimId,
			ratifiedProofRoute: record.ratifiedProofRoute,
		});
	}
	const badges = APEX_BADGE_IDS.map((id) =>
		classifyBadge(id, proofClassByBadge.get(id) ?? null, boundByBadge.get(id) ?? []),
	);
	const divergent = badges.filter((badge) => badge.divergence !== "aligned");
	return {
		registryBadgeCount: routes.length,
		badges,
		divergenceCount: divergent.length,
		divergentBadges: divergent.map((badge) => badge.badge),
	};
}

function provenance(goldSet, paths) {
	return {
		goldSet: paths.goldSet ?? null,
		track: goldSet.track ?? null,
		sourcePacket: goldSet.sourcePacket ?? null,
		packetGitCommit: goldSet.packetGitCommit ?? null,
		templateHash: goldSet.templateHash ?? null,
		badgeMap: paths.badgeMap ?? null,
		proofRouteOverrides: paths.overrides ?? null,
		registry: paths.registry ?? null,
	};
}

export function buildInventory({ goldSet, badgeMapDoc, overrideDoc, registryDoc, paths = {} }) {
	const allEntries = goldSet.entries || [];
	const graded = allEntries.filter(isDurableGraded);
	const badgeMap = badgeByFingerprint(badgeMapDoc);
	const overrideMap = overrideRouteByFingerprint(overrideDoc);
	const entriesByFingerprint = {};
	for (const entry of graded) {
		entriesByFingerprint[entry.claimFingerprint] = projectEntry(entry, { badgeMap, overrideMap });
	}
	const summary = summarize(allEntries, graded);
	summary.t1BadgeBindings = graded.filter(
		(entry) => entry.significanceTier === "T1" && badgeMap.has(entry.claimFingerprint),
	).length;
	summary.overridesApplied = graded.filter((entry) =>
		overrideMap.has(entry.claimFingerprint),
	).length;
	return {
		schemaVersion: SCHEMA_VERSION,
		generatedFrom: provenance(goldSet, paths),
		summary,
		entriesByFingerprint,
		reconciliation: reconcileBadges(entriesByFingerprint, registryDoc),
	};
}

export function t1Records(inventory) {
	return Object.entries(inventory.entriesByFingerprint)
		.filter(([, record]) => record.significanceTier === "T1")
		.map(([claimFingerprint, record]) => ({ claimFingerprint, ...record }));
}

function validateT1Badges(t1, validBadges) {
	const errors = [];
	for (const record of t1) {
		if (!record.badge) errors.push(`T1 ${record.claimId} has no badge binding`);
		else if (!validBadges.has(record.badge)) {
			errors.push(`T1 ${record.claimId} bound to unknown badge ${record.badge}`);
		}
	}
	return errors;
}

// A badge-map binding must point at a durable-graded T1 fingerprint. Name the two
// failure modes distinctly: a dropped binding (gone from the graded set entirely)
// vs a re-tiered one (still graded, no longer T1).
function validateBinding(binding, t1Fingerprints, gradedByFingerprint) {
	if (t1Fingerprints.has(binding.claimFingerprint)) return null;
	const graded = gradedByFingerprint[binding.claimFingerprint];
	if (!graded) return `badge-map binding ${binding.claimId} is not a durable-graded entry`;
	return `badge-map binding ${binding.claimId} is durable-graded but not T1 (tier ${graded.significanceTier})`;
}

function validateSplit(summary) {
	const errors = [];
	const { byTier, durableGraded, nonGraded, totalEntries } = summary;
	if (byTier.T1 + byTier.T2 + byTier.T3 !== durableGraded) {
		errors.push("tier counts do not sum to durableGraded");
	}
	if (durableGraded + nonGraded !== totalEntries) {
		errors.push("durableGraded + nonGraded does not equal totalEntries");
	}
	return errors;
}

// Structural validation used by `--check` so a malformed projection fails loud:
// exactly the 7 T1 claims project, each binds to a known badge, every badge-map
// binding references a real durable-graded T1 fingerprint, and the graded/
// non-graded split is internally consistent.
export function validateInventory(inventory, badgeMapDoc) {
	const t1 = t1Records(inventory);
	const validBadges = new Set(badgeMapDoc.validBadgeIds || APEX_BADGE_IDS);
	const t1Fingerprints = new Set(t1.map((record) => record.claimFingerprint));
	const errors = [];
	if (t1.length !== 7) errors.push(`expected 7 T1 entries, got ${t1.length}`);
	errors.push(...validateT1Badges(t1, validBadges));
	for (const binding of badgeMapDoc.bindings || []) {
		const error = validateBinding(binding, t1Fingerprints, inventory.entriesByFingerprint);
		if (error) errors.push(error);
	}
	errors.push(...validateSplit(inventory.summary));
	return errors;
}
