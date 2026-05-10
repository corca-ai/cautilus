export function claimStatusPrimaryActionID(candidate) {
	if (candidate?.evidenceStatus === "satisfied") {
		return "already-satisfied";
	}
	switch (candidate?.verificationReadiness) {
		case "blocked":
			return "split-or-defer";
		case "needs-alignment":
			return "human-align-surfaces";
		case "needs-scenario":
			return "agent-design-scenario";
		case "ready-for-proof":
			switch (candidate?.recommendedProof) {
				case "deterministic":
					return "agent-add-deterministic-proof";
				case "cautilus-eval":
					return "agent-plan-cautilus-eval";
				case "human-auditable":
					return "human-confirm-or-decompose";
			}
			break;
	}
	return "inspect-manually";
}

export function shouldRenderFullBucket(bucket) {
	return ["agent-design-scenario", "human-align-surfaces", "split-or-defer"].includes(bucket.id);
}

const asArray = (value) => (Array.isArray(value) ? value : []);

function compactText(value) {
	return String(value ?? "")
		.replace(/\s+/g, " ")
		.trim();
}

function sourceLabel(candidate) {
	const ref = asArray(candidate?.sourceRefs)[0];
	return ref ? `${ref.path}:${ref.line ?? "?"}` : "-";
}

function claimSummary(candidate) {
	return candidate ? compactText(candidate.summary) : "claim not found in selected packet";
}

function bucketSampleRows(bucket, claimsById, limit) {
	return asArray(bucket.sampleClaimIds)
		.slice(0, limit)
		.map((claimId) => {
			const candidate = claimsById.get(claimId);
			return [
				claimId,
				sourceLabel(candidate),
				candidate?.recommendedProof ?? "-",
				candidate?.verificationReadiness ?? "-",
				candidate?.reviewStatus ?? "-",
				candidate?.evidenceStatus ?? "-",
				claimSummary(candidate),
			];
		});
}

function fullBucketRows(bucket, claimsById) {
	return [...claimsById.values()]
		.filter((candidate) => claimStatusPrimaryActionID(candidate) === bucket.id)
		.map((candidate) => [
			candidate.claimId,
			sourceLabel(candidate),
			candidate?.recommendedProof ?? "-",
			candidate?.verificationReadiness ?? "-",
			candidate?.reviewStatus ?? "-",
			candidate?.evidenceStatus ?? "-",
			claimSummary(candidate),
		]);
}

function bucketDetailRows(bucket, claimsById, limit) {
	return shouldRenderFullBucket(bucket) ? fullBucketRows(bucket, claimsById) : bucketSampleRows(bucket, claimsById, limit);
}

export function primaryBuckets(statusPacket) {
	return asArray(statusPacket?.actionSummary?.primaryBuckets);
}

function crossCuttingSignals(statusPacket) {
	return asArray(statusPacket?.actionSummary?.crossCuttingSignals);
}

export function renderActionBuckets(lines, statusPacket, claimsById, sampleLimit, { formatCounts, table }) {
	lines.push("## Action Buckets");
	lines.push("");
	const bucketRows = primaryBuckets(statusPacket).map((bucket) => [
		bucket.id,
		bucket.recommendedActor ?? "-",
		bucket.count ?? 0,
		formatCounts(bucket.byReviewStatus),
		formatCounts(bucket.byEvidenceStatus),
		bucket.summary ?? "-",
	]);
	lines.push(...table(["Bucket", "Actor", "Count", "Review", "Evidence", "Meaning"], bucketRows));
	lines.push("");
	for (const signal of crossCuttingSignals(statusPacket)) {
		lines.push(`Cross-cutting signal: ${signal.id} (${signal.count ?? 0}) - ${compactText(signal.summary)}`);
		lines.push("");
	}
	const focusBucketIds = ["human-align-surfaces", "human-confirm-or-decompose", "split-or-defer", "agent-add-deterministic-proof", "agent-plan-cautilus-eval", "agent-design-scenario"];
	for (const bucket of primaryBuckets(statusPacket).filter((item) => focusBucketIds.includes(item.id))) {
		const detailRows = bucketDetailRows(bucket, claimsById, sampleLimit);
		if (detailRows.length === 0) {
			continue;
		}
		lines.push(`### ${bucket.id}`);
		lines.push("");
		lines.push(compactText(bucket.summary));
		if (shouldRenderFullBucket(bucket)) {
			lines.push("");
			lines.push("Full bucket detail is shown because this bucket is not ready for proof.");
		}
		lines.push("");
		lines.push(...table(["Claim", "Source", "Proof", "Readiness", "Review", "Evidence", "Summary"], detailRows));
		lines.push("");
	}
}
