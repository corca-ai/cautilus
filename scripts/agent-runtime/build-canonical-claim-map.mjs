#!/usr/bin/env node
import fs from "node:fs";
import crypto from "node:crypto";
import path from "node:path";

const DEFAULT_CLAIMS = ".cautilus/claims/evidenced-typed-runners.json";
const DEFAULT_USER_CATALOG = "docs/claims/user-facing.md";
const DEFAULT_MAINTAINER_CATALOG = "docs/claims/maintainer-facing.md";
const DEFAULT_OUTPUT = ".cautilus/claims/canonical-claim-map.json";

const STOPWORDS = new Set([
	"a",
	"about",
	"after",
	"all",
	"an",
	"and",
	"are",
	"as",
	"be",
	"before",
	"both",
	"by",
	"can",
	"claim",
	"claims",
	"cautilus",
	"current",
	"each",
	"for",
	"from",
	"has",
	"have",
	"how",
	"in",
	"into",
	"is",
	"it",
	"its",
	"must",
	"not",
	"of",
	"on",
	"or",
	"own",
	"should",
	"that",
	"the",
	"their",
	"this",
	"through",
	"to",
	"use",
	"when",
	"with",
]);

const asArray = (value) => (Array.isArray(value) ? value : []);

export function parseArgs(argv) {
	const args = {
		claims: DEFAULT_CLAIMS,
		userCatalog: DEFAULT_USER_CATALOG,
		maintainerCatalog: DEFAULT_MAINTAINER_CATALOG,
		output: DEFAULT_OUTPUT,
	};
	for (let index = 2; index < argv.length; index += 1) {
		const arg = argv[index];
		if (arg === "--claims") {
			args.claims = argv[++index];
		} else if (arg === "--user-catalog") {
			args.userCatalog = argv[++index];
		} else if (arg === "--maintainer-catalog") {
			args.maintainerCatalog = argv[++index];
		} else if (arg === "--output") {
			args.output = argv[++index];
		} else {
			throw new Error(`Unsupported argument: ${arg}`);
		}
	}
	return args;
}

function readText(filePath) {
	return fs.readFileSync(filePath, "utf8");
}

function sha256Text(value) {
	return `sha256:${crypto.createHash("sha256").update(value).digest("hex")}`;
}

function fileInput(pathValue, content) {
	return {
		path: pathValue,
		contentHash: sha256Text(content),
	};
}

function compactText(value) {
	return String(value ?? "")
		.replace(/\s+/g, " ")
		.trim();
}

function normalizeToken(token) {
	return token
		.toLowerCase()
		.replace(/^[^a-z0-9]+|[^a-z0-9]+$/g, "")
		.replace(/ies$/, "y")
		.replace(/s$/, "");
}

function tokens(value) {
	const result = new Set();
	for (const raw of String(value ?? "").split(/[^A-Za-z0-9/.-]+/)) {
		const token = normalizeToken(raw);
		if (token.length < 3 || STOPWORDS.has(token)) {
			continue;
		}
		result.add(token);
	}
	return result;
}

function sectionBlocks(markdown, prefixPattern) {
	const headingPattern = new RegExp(`^## (${prefixPattern})\\.\\s+(.+)$`, "gm");
	const headings = [...markdown.matchAll(headingPattern)].map((match) => ({
		id: match[1],
		title: compactText(match[2]),
		index: match.index,
		endOfHeading: match.index + match[0].length,
	}));
	return headings.map((heading, index) => {
		const next = headings[index + 1];
		return {
			...heading,
			body: markdown.slice(heading.endOfHeading, next ? next.index : markdown.length).trim(),
		};
	});
}

function extractLineField(body, label) {
	const escaped = label.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
	const pattern = new RegExp(`^${escaped}:\\s*(.+)$`, "m");
	const match = body.match(pattern);
	return match ? compactText(match[1]) : "";
}

function extractParagraphAfterHeading(body, heading) {
	const escaped = heading.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
	const pattern = new RegExp(`^\\*\\*${escaped}\\.\\*\\*\\s*$\\n([^#*][\\s\\S]*?)(?=\\n\\*\\*|\\n##|$)`, "m");
	const match = body.match(pattern);
	return match ? compactText(match[1]) : "";
}

function splitList(value) {
	return compactText(value)
		.replace(/\.$/, "")
		.split(/\s*,\s*/)
		.map((item) => item.trim())
		.filter(Boolean);
}

export function parseUserCatalog(markdown, filePath = DEFAULT_USER_CATALOG) {
	return sectionBlocks(markdown, "U\\d+").map((section) => {
		const sourceAnchors = splitList(extractParagraphAfterHeading(section.body, "Source anchors"));
		return {
			id: section.id,
			title: section.title,
			audience: "user",
			filePath,
			sourceAnchors,
			keywords: [...tokens(`${section.title} ${section.body}`)].sort(),
		};
	});
}

function alignedUserIds(body) {
	const line = extractLineField(body, "Aligned user claims");
	return [...line.matchAll(/\bU\d+\b/g)].map((match) => match[0]);
}

export function parseMaintainerCatalog(markdown, filePath = DEFAULT_MAINTAINER_CATALOG) {
	return sectionBlocks(markdown, "M\\d+").map((section) => {
		const absorbs = extractLineField(section.body, "Absorbs");
		const sourceAnchors = splitList(extractLineField(section.body, "Source anchors"));
		return {
			id: section.id,
			title: section.title,
			audience: "developer",
			alignedUserClaimIds: alignedUserIds(section.body),
			proofRoute: extractLineField(section.body, "Proof route"),
			currentEvidenceStatus: extractLineField(section.body, "Current evidence status"),
			nextAction: extractLineField(section.body, "Next action"),
			absorbs,
			filePath,
			sourceAnchors,
			keywords: [...tokens(`${section.title} ${section.body}`)].sort(),
		};
	});
}

function candidateText(candidate) {
	const refs = asArray(candidate.sourceRefs)
		.map((ref) => `${ref.path} ${ref.excerpt ?? ""}`)
		.join(" ");
	return [
		candidate.summary,
		candidate.nextAction,
		candidate.claimSemanticGroup,
		candidate.recommendedProof,
		candidate.recommendedEvalSurface,
		refs,
	]
		.filter(Boolean)
		.join(" ");
}

function sourcePaths(candidate) {
	return new Set(asArray(candidate.sourceRefs).map((ref) => ref.path).filter(Boolean));
}

function anchorScore(sourcePathSet, sourceAnchors) {
	let score = 0;
	const matched = [];
	for (const anchor of sourceAnchors) {
		for (const sourcePath of sourcePathSet) {
			if (sourcePath === anchor || sourcePath.startsWith(anchor.replace(/\*\*$/, "")) || anchor.startsWith(sourcePath)) {
				score += 6;
				matched.push(anchor);
				break;
			}
		}
	}
	return { score, matchedAnchors: [...new Set(matched)] };
}

function overlapScore(candidateTokens, canonicalKeywords) {
	let score = 0;
	const matched = [];
	for (const keyword of canonicalKeywords) {
		if (candidateTokens.has(keyword)) {
			score += 1;
			matched.push(keyword);
		}
	}
	return { score, matchedKeywords: matched.slice(0, 12) };
}

function bestCanonical(candidate, canonicals) {
	return rankedCanonicals(candidate, canonicals)[0] ?? null;
}

function rankedCanonicals(candidate, canonicals) {
	const candidateTokens = tokens(candidateText(candidate));
	const paths = sourcePaths(candidate);
	return canonicals
		.map((canonical) => {
			const anchor = anchorScore(paths, canonical.sourceAnchors);
			const overlap = overlapScore(candidateTokens, canonical.keywords);
			const score = anchor.score + overlap.score;
			return {
				canonical,
				score,
				matchedAnchors: anchor.matchedAnchors,
				matchedKeywords: overlap.matchedKeywords,
			};
		})
		.sort((left, right) => {
			if (right.score !== left.score) {
				return right.score - left.score;
			}
			return left.canonical.id.localeCompare(right.canonical.id, undefined, { numeric: true });
		});
}

function bestCanonicalWithRunnerUp(candidate, canonicals) {
	const ranked = rankedCanonicals(candidate, canonicals);
	return { best: ranked[0] ?? null, runnerUp: ranked[1] ?? null };
}

function mapCandidate(candidate, userCatalog, maintainerCatalog) {
	const audience = candidate.claimAudience ?? "unclear";
	if (audience === "user") {
		return mapUserCandidate(candidate, userCatalog);
	}
	if (audience === "developer") {
		return mapMaintainerCandidate(candidate, maintainerCatalog);
	}
	return mapUnclearAudienceCandidate(candidate, userCatalog, maintainerCatalog);
}

function mapUserCandidate(candidate, userCatalog) {
	const { best, runnerUp } = bestCanonicalWithRunnerUp(candidate, userCatalog);
	return mappingFromBest(candidate, best, "mapped-to-user-canonical", "user-review-needed", runnerUp);
}

function mapMaintainerCandidate(candidate, maintainerCatalog) {
	const { best, runnerUp } = bestCanonicalWithRunnerUp(candidate, maintainerCatalog);
	const mapping = mappingFromBest(candidate, best, "mapped-to-maintainer-canonical", "maintainer-review-needed", runnerUp);
	addAlignedUserClaims(mapping, best);
	return mapping;
}

function mapUnclearAudienceCandidate(candidate, userCatalog, maintainerCatalog) {
	const best = bestByScore(bestCanonical(candidate, userCatalog), bestCanonical(candidate, maintainerCatalog));
	const disposition = canonicalDisposition(best);
	return mappingFromBest(candidate, best, disposition, "audience-review-needed");
}

function bestByScore(left, right) {
	return Number(left?.score ?? 0) >= Number(right?.score ?? 0) ? left : right;
}

function canonicalDisposition(best) {
	return best?.canonical?.id?.startsWith("U") ? "mapped-to-user-canonical" : "mapped-to-maintainer-canonical";
}

function addAlignedUserClaims(mapping, best) {
	if (best?.canonical?.alignedUserClaimIds?.length) {
		mapping.alignedUserClaimIds = best.canonical.alignedUserClaimIds;
	}
}

function mappingFromBest(candidate, best, mappedDisposition, fallbackDisposition, runnerUp = null) {
	const score = Number(best?.score ?? 0);
	const mapped = isConfidentCanonicalMatch(best, score);
	const labels = candidateLabels(candidate);
	const match = mappingMatchFields({ best, runnerUp, mapped, score });
	return {
		claimId: candidate.claimId,
		summary: compactText(candidate.summary),
		sourceRefs: compactSourceRefs(candidate),
		disposition: mapped ? mappedDisposition : fallbackDisposition,
		mappingStatus: mapped ? "heuristic-auto-map" : "needs-catalog-review",
		...labels,
		...mappingClaimIdentity(candidate),
		...match,
	};
}

function mappingClaimIdentity(candidate) {
	return {
		claimFingerprint: candidate.claimFingerprint ?? null,
	};
}

function mappingMatchFields({ best, runnerUp, mapped, score }) {
	const runnerUpScore = Number(runnerUp?.score ?? 0);
	const scoreMargin = score - runnerUpScore;
	const confidence = mappingConfidence(best, score, scoreMargin);
	return {
		canonicalClaimId: mapped ? best.canonical.id : null,
		score,
		runnerUpCanonicalClaimId: runnerUp?.canonical?.id ?? null,
		runnerUpScore,
		scoreMargin,
		mappingConfidence: confidence,
		requiresSemanticReview: mapped ? confidence !== "high" : true,
		matchedAnchors: best?.matchedAnchors ?? [],
		matchedKeywords: best?.matchedKeywords ?? [],
	};
}

function candidateLabels(candidate) {
	return {
		claimAudience: candidate.claimAudience ?? "unclear",
		recommendedProof: candidate.recommendedProof ?? "unknown",
		verificationReadiness: candidate.verificationReadiness ?? "unknown",
		evidenceStatus: candidate.evidenceStatus ?? "unknown",
		reviewStatus: candidate.reviewStatus ?? "heuristic",
	};
}

function isConfidentCanonicalMatch(best, score) {
	return Boolean(best?.canonical) && score >= 3 && Number(best?.matchedKeywords?.length ?? 0) >= 2;
}

function mappingConfidence(best, score, margin) {
	const matchedKeywordCount = Number(best?.matchedKeywords?.length ?? 0);
	if (score >= 12 && margin >= 3 && matchedKeywordCount >= 4) {
		return "high";
	}
	if (score >= 7 && matchedKeywordCount >= 2) {
		return "medium";
	}
	return "low";
}

function compactSourceRefs(candidate) {
	return asArray(candidate.sourceRefs).map((ref) => ({
		path: ref.path,
		line: ref.line,
		excerpt: ref.excerpt,
	}));
}

function countBy(values, keyFn) {
	const counts = new Map();
	for (const value of values) {
		const key = keyFn(value);
		counts.set(key, (counts.get(key) ?? 0) + 1);
	}
	return Object.fromEntries([...counts.entries()].sort((left, right) => String(left[0]).localeCompare(String(right[0]))));
}

function canonicalCoverage(catalog, mappings) {
	return catalog.map((canonical) => {
		const absorbed = mappings.filter((mapping) => mapping.canonicalClaimId === canonical.id);
		return {
			canonicalClaimId: canonical.id,
			title: canonical.title,
			absorbedRawClaimCount: absorbed.length,
			absorbedRawClaimIds: absorbed.map((mapping) => mapping.claimId),
			absorbedRawClaims: absorbed.map((mapping) => ({
				claimId: mapping.claimId,
				claimFingerprint: mapping.claimFingerprint,
				mappingConfidence: mapping.mappingConfidence,
				requiresSemanticReview: mapping.requiresSemanticReview,
			})),
			byEvidenceStatus: countBy(absorbed, (mapping) => mapping.evidenceStatus),
			byReviewStatus: countBy(absorbed, (mapping) => mapping.reviewStatus),
			byRecommendedProof: countBy(absorbed, (mapping) => mapping.recommendedProof),
			byMappingConfidence: countBy(absorbed, (mapping) => mapping.mappingConfidence),
		};
	});
}

export function buildCanonicalClaimMap({ claimsPacket, userCatalogMarkdown, maintainerCatalogMarkdown, args, inputMetadata = null }) {
	const userCatalog = parseUserCatalog(userCatalogMarkdown, args.userCatalog);
	const maintainerCatalog = parseMaintainerCatalog(maintainerCatalogMarkdown, args.maintainerCatalog);
	const candidates = asArray(claimsPacket.claimCandidates);
	const mappings = candidates.map((candidate) => mapCandidate(candidate, userCatalog, maintainerCatalog));
	const mappedUserClaims = mappings.filter((mapping) => mapping.claimAudience === "user" && mapping.disposition === "mapped-to-user-canonical");
	const userClaims = mappings.filter((mapping) => mapping.claimAudience === "user");
	const reviewNeeded = mappings.filter((mapping) => mapping.disposition.endsWith("review-needed"));
	const semanticReview = mappings.filter((mapping) => mapping.requiresSemanticReview);
	return {
		schemaVersion: "cautilus.canonical_claim_map.v1",
		generatorVersion: 1,
		inputs: inputMetadata,
		claimsPacketGitCommit: claimsPacket.gitCommit ?? null,
		claimsPacketSchemaVersion: claimsPacket.schemaVersion ?? null,
		claimsPacketCandidateCount: candidates.length,
		catalogs: {
			user: {
				path: args.userCatalog,
				claimCount: userCatalog.length,
				claims: userCatalog.map(stripKeywords),
			},
			maintainer: {
				path: args.maintainerCatalog,
				claimCount: maintainerCatalog.length,
				claims: maintainerCatalog.map(stripKeywords),
			},
		},
		coverageSummary: {
			totalRawClaimCount: mappings.length,
			userRawClaimCount: userClaims.length,
			userMappedToCanonicalCount: mappedUserClaims.length,
			userUnmappedCount: userClaims.length - mappedUserClaims.length,
			semanticReviewRecommendedCount: semanticReview.length,
			userSemanticReviewRecommendedCount: userClaims.filter((mapping) => mapping.requiresSemanticReview).length,
			byDisposition: countBy(mappings, (mapping) => mapping.disposition),
			byAudience: countBy(mappings, (mapping) => mapping.claimAudience),
			byMappingConfidence: countBy(mappings, (mapping) => mapping.mappingConfidence),
			byUserCanonicalClaimId: countBy(
				mappings.filter((mapping) => mapping.canonicalClaimId?.startsWith("U")),
				(mapping) => mapping.canonicalClaimId,
			),
			byMaintainerCanonicalClaimId: countBy(
				mappings.filter((mapping) => mapping.canonicalClaimId?.startsWith("M")),
				(mapping) => mapping.canonicalClaimId,
			),
			reviewNeededClaimIds: reviewNeeded.map((mapping) => mapping.claimId),
			semanticReviewRecommendedClaimIds: semanticReview.map((mapping) => mapping.claimId),
		},
		userCoverage: canonicalCoverage(userCatalog, mappings),
		maintainerCoverage: canonicalCoverage(maintainerCatalog, mappings),
		mappings,
	};
}

function stripKeywords(item) {
	const copy = { ...item };
	delete copy.keywords;
	return copy;
}

export function buildCanonicalClaimMapFromFiles(args) {
	const claimsText = readText(args.claims);
	const userCatalogMarkdown = readText(args.userCatalog);
	const maintainerCatalogMarkdown = readText(args.maintainerCatalog);
	return buildCanonicalClaimMap({
		claimsPacket: JSON.parse(claimsText),
		userCatalogMarkdown,
		maintainerCatalogMarkdown,
		args,
		inputMetadata: {
			claims: fileInput(args.claims, claimsText),
			userCatalog: fileInput(args.userCatalog, userCatalogMarkdown),
			maintainerCatalog: fileInput(args.maintainerCatalog, maintainerCatalogMarkdown),
		},
	});
}

function main() {
	const args = parseArgs(process.argv);
	const packet = buildCanonicalClaimMapFromFiles(args);
	fs.mkdirSync(path.dirname(args.output), { recursive: true });
	fs.writeFileSync(args.output, `${JSON.stringify(packet, null, 2)}\n`, "utf8");
	console.log(`wrote ${args.output}`);
}

if (import.meta.url === `file://${process.argv[1]}`) {
	main();
}
