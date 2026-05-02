function asArray(value) {
	return Array.isArray(value) ? value : [];
}

function asObject(value) {
	return !value || Array.isArray(value) || typeof value !== "object" ? {} : value;
}

function canonicalUserRange(canonicalMap) {
	const userClaims = asArray(canonicalMap?.catalogs?.user?.claims);
	return userClaims.length > 0 ? `${userClaims[0].id}-${userClaims[userClaims.length - 1].id}` : "canonical user claims";
}

function renderCatalogReviewNeeded(lines, reviewNeededIds, label) {
	if (reviewNeededIds.length === 0) {
		return;
	}
	const sample = reviewNeededIds.slice(0, 8).join(", ");
	lines.push(`${label} for ${reviewNeededIds.length} raw claim(s): ${sample}${reviewNeededIds.length > 8 ? ", ..." : ""}`);
	lines.push("");
}

export function renderCanonicalMapSection({ canonicalMap, formatCounts, table }) {
	const lines = [];
	if (!canonicalMap) {
		return lines;
	}
	const summary = asObject(canonicalMap.coverageSummary);
	const userRange = canonicalUserRange(canonicalMap);
	lines.push("## Canonical Claim Map");
	lines.push("");
	lines.push(`- Map packet: ${canonicalMap.path ?? "provided canonical map"}`);
	if (canonicalMap.inputStatus) {
		lines.push(`- Input status: ${canonicalMap.inputStatus}`);
	}
	lines.push(`- User raw claims: ${summary.userRawClaimCount ?? 0}`);
	lines.push(`- User claims mapped to ${userRange}: ${summary.userMappedToCanonicalCount ?? 0}`);
	lines.push(`- User claims not mapped to ${userRange}: ${summary.userUnmappedCount ?? summary.userReviewNeededCount ?? 0}`);
	lines.push(`- User mappings recommended for semantic sampling: ${summary.userSemanticReviewRecommendedCount ?? 0}`);
	lines.push(`- All raw claims by disposition: ${formatCounts(summary.byDisposition)}`);
	lines.push(`- Mapping confidence: ${formatCounts(summary.byMappingConfidence)}`);
	lines.push("");
	const userCoverage = asArray(canonicalMap.userCoverage);
	if (userCoverage.length > 0) {
		lines.push(...table(["User claim", "Title", "Raw claims", "Evidence", "Review"], userCoverage.map((item) => [
			item.canonicalClaimId,
			item.title,
			item.absorbedRawClaimCount ?? 0,
			formatCounts(item.byEvidenceStatus),
			formatCounts(item.byReviewStatus),
		])));
		lines.push("");
	}
	renderCatalogReviewNeeded(lines, asArray(summary.reviewNeededClaimIds), "Catalog review needed");
	renderCatalogReviewNeeded(lines, asArray(summary.semanticReviewRecommendedClaimIds), "Semantic sampling recommended");
	return lines;
}
