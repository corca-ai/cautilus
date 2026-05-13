export function findSourceTreeReleaseRecordPointers(content) {
	const patterns = [
		/charness-artifacts\/release\/latest\.md/g,
		/\brelease\/latest\.md\b/g,
		/\blatest\.md\b[^"\n]*(?:at this tag|release scope|verification notes|release notes)/gi,
		/\bcat\b[^"\n]*charness-artifacts\/release\/latest\.md/g,
	];
	const fragments = [];
	for (const pattern of patterns) {
		for (const match of String(content || "").matchAll(pattern)) {
			fragments.push(match[0]);
		}
	}
	return [...new Set(fragments)];
}
