const asArray = (value) => (Array.isArray(value) ? value : []);

function compactText(value) {
	return String(value ?? "")
		.replace(/\s+/g, " ")
		.trim();
}

function countBy(items, keyFn) {
	const counts = {};
	for (const item of items) {
		const key = keyFn(item);
		counts[key] = (counts[key] || 0) + 1;
	}
	return counts;
}

function claimFingerprintMap(claimsPacket) {
	return new Map(
		asArray(claimsPacket?.claimCandidates)
			.filter((candidate) => compactText(candidate.claimFingerprint))
			.map((candidate) => [candidate.claimFingerprint, candidate]),
	);
}

function updateMatchesClaim(update, candidate) {
	if (!candidate) {
		return false;
	}
	const updateFingerprint = compactText(update.claimFingerprint);
	const candidateFingerprint = compactText(candidate.claimFingerprint);
	if (candidateFingerprint && !updateFingerprint) {
		return false;
	}
	return !updateFingerprint || !candidateFingerprint || updateFingerprint === candidateFingerprint;
}

function rewriteUpdateClaimId(update, currentClaimId) {
	const previousClaimId = update.claimId;
	const rewritten = { ...update, claimId: currentClaimId };
	if (Array.isArray(update.evidenceRefs)) {
		rewritten.evidenceRefs = update.evidenceRefs.map((ref) => {
			if (!Array.isArray(ref?.supportsClaimIds) || !ref.supportsClaimIds.includes(previousClaimId)) {
				return ref;
			}
			return {
				...ref,
				supportsClaimIds: ref.supportsClaimIds.map((id) => (id === previousClaimId ? currentClaimId : id)),
			};
		});
	}
	return rewritten;
}

function resolveReviewUpdate(update, claimsById, claimsByFingerprint) {
	const candidateById = claimsById.get(update.claimId);
	if (updateMatchesClaim(update, candidateById)) {
		return { active: true, update };
	}
	const fingerprint = compactText(update.claimFingerprint);
	const candidateByFingerprint = fingerprint ? claimsByFingerprint.get(fingerprint) : undefined;
	if (updateMatchesClaim(update, candidateByFingerprint)) {
		return { active: true, update: rewriteUpdateClaimId(update, candidateByFingerprint.claimId) };
	}
	return candidateById ? { active: false, update } : null;
}

export function reviewResultsForCurrentClaims(reviewResults, claimsPacket, claimsById) {
	const claimsByFingerprint = claimFingerprintMap(claimsPacket);
	const filtered = [];
	for (const digest of asArray(reviewResults)) {
		const currentResolutions = digest.updates.map((update) => resolveReviewUpdate(update, claimsById, claimsByFingerprint)).filter(Boolean);
		if (currentResolutions.length === 0) {
			continue;
		}
		const updates = currentResolutions.filter((resolution) => resolution.active).map((resolution) => resolution.update);
		filtered.push({
			...digest,
			clusterCount: new Set(updates.map((update) => update.clusterId)).size,
			updateCount: updates.length,
			supersededUpdateCount: currentResolutions.length - updates.length,
			byProof: countBy(updates, (update) => update.recommendedProof ?? "unchanged"),
			byReadiness: countBy(updates, (update) => update.verificationReadiness ?? "unchanged"),
			byEvidence: countBy(updates, (update) => update.evidenceStatus ?? "unchanged"),
			updates,
		});
	}
	return filtered;
}
