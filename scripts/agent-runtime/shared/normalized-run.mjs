export function normalizeText(text) {
	return String(text || "").trim().toLowerCase();
}

export function slugify(value) {
	return normalizeText(value)
		.replace(/[^a-z0-9]+/g, "-")
		.replace(/^-+|-+$/g, "");
}

export function parseIsoTime(value) {
	const millis = Date.parse(String(value || ""));
	return Number.isFinite(millis) ? millis : 0;
}

export function sortEvidenceNewestFirst(evidence) {
	return [...evidence].sort((left, right) => parseIsoTime(right.observedAt) - parseIsoTime(left.observedAt));
}

export function mergeByProposalKey(candidates) {
	const merged = new Map();
	for (const candidate of candidates) {
		if (!candidate) {
			continue;
		}
		const current = merged.get(candidate.proposalKey);
		merged.set(
			candidate.proposalKey,
			current
				? {
						...current,
						evidence: sortEvidenceNewestFirst([...(current.evidence || []), ...(candidate.evidence || [])]),
					}
				: {
						...candidate,
						evidence: sortEvidenceNewestFirst(candidate.evidence || []),
					},
		);
	}
	return [...merged.values()];
}

export function getDisplayName(run) {
	return String(run.displayName || run.targetId || "").trim();
}

export function humanizeSurface(surface) {
	return String(surface || "").replaceAll("_", " ");
}

export function titleCase(text) {
	return String(text || "")
		.split(/\s+/)
		.filter(Boolean)
		.map((part) => `${part[0]?.toUpperCase() || ""}${part.slice(1)}`)
		.join(" ");
}

export function validateEvaluationRun(run, index) {
	if (!run || typeof run !== "object") {
		throw new Error(`evaluationRuns[${index}] must be an object`);
	}
	for (const field of ["targetKind", "targetId", "surface", "startedAt", "status", "summary"]) {
		if (typeof run[field] !== "string" || !run[field].trim()) {
			throw new Error(`evaluationRuns[${index}].${field} must be a non-empty string`);
		}
	}
}
