function sampleReason(sample) {
	return sample.reason || "unknown";
}

function reasonCountsForSamples(samples) {
	const counts = new Map();
	for (const sample of samples) {
		const reason = sampleReason(sample);
		counts.set(reason, (counts.get(reason) || 0) + 1);
	}
	return counts;
}

export function selectDroppedUpdateSamples(samples, maxSamples = 20) {
	if (samples.length <= maxSamples) {
		return samples;
	}
	const selected = samples.slice(0, maxSamples);
	const selectedReasonCounts = reasonCountsForSamples(selected);
	for (const sample of samples.slice(maxSamples)) {
		const reason = sampleReason(sample);
		if (selectedReasonCounts.has(reason)) {
			continue;
		}
		const replaceIndex = selected.findLastIndex((candidate) => selectedReasonCounts.get(sampleReason(candidate)) > 1);
		if (replaceIndex === -1) {
			continue;
		}
		const replacedReason = sampleReason(selected[replaceIndex]);
		selected[replaceIndex] = sample;
		selectedReasonCounts.set(replacedReason, selectedReasonCounts.get(replacedReason) - 1);
		selectedReasonCounts.set(reason, 1);
	}
	return selected;
}
