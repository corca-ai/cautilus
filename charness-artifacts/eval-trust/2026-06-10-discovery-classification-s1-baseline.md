# Discovery classification S1 baseline: three-corpus measurement with today's engine

Status: measured, 2026-06-10.
Goal: [2026-06-10-adapter-owned-discovery-classification.md](../goals/2026-06-10-adapter-owned-discovery-classification.md), slice S1.
Engine commit: `1e322a8` (clean working tree).
Reproduce: `./bin/cautilus discover claims --repo-root ../<corpus> --output /tmp/cautilus-s1-baseline/<corpus>.json` (read-only on each corpus; output stays outside the corpus).

## Corpus states at measurement

| corpus | language | commit | working tree | cautilus adapter |
| --- | --- | --- | --- | --- |
| `../yt-digest` | Korean | `99d10cf` | clean | none (portable defaults) |
| `../charness` | English | `2bbd8a40` | clean | `.agents/cautilus-adapter.yaml`, no `classification_hints` |
| `../ceal` | English | `8368964b` | clean | `.agents/cautilus-adapter.yaml`, no `classification_hints` |

## Results

| corpus | sources scanned | claim candidates | deterministic | cautilus-eval | human-auditable |
| --- | --- | --- | --- | --- | --- |
| yt-digest | 3 | **0** | 0 | 0 | 0 |
| charness | 56 | 227 | 68 | 100 | 59 |
| ceal | 85 | 308 | 92 | 158 | 58 |

All three runs recorded `nonClaimSectionHeadings: []` in `effectiveScanScope` (no corpus configures classification hints today).

## yt-digest: the language gap, decomposed

The near-zero extraction is the verb-lexicon gap, not a traversal failure.
Traversal worked: entries resolved to `README.md`, `AGENTS.md`, `INSTALL.md` (via README link); `CLAUDE.md` is an AGENTS.md symlink and correctly deduplicated.
Claim-shaped Korean sentences exist in the scanned sources and were all dropped by `claimLineLooksUseful`'s space-padded English verb list.
Minimal evidence samples (claim-shaped lines the engine dropped):

- `README.md:3` — "개인 YouTube 시청 기록을 수집하고 분석해 인사이트와 대시보드로 정리하는 로컬 리포지토리입니다."
- `AGENTS.md:22` — "스킬 원본은 `.agents/skills/yt/SKILL.md`에 있고, `.claude/skills/yt`는 그 파일을 가리키는 심링크다."
- `INSTALL.md:5` — "이 문서를 읽은 에이전트는 설명만 하지 말고 실제로 실행해야 합니다."
- `INSTALL.md:15` — "`data/index.json`이 최신 산출물을 가리킵니다."

Two structural observations that bound what a lexicon hint can fix:

- Korean predicates agglutinate at sentence end (`…입니다`, `…한다`, `…해야 합니다`, `…가리킵니다`) with no surrounding spaces, so the current `" term "` space-padded containment can never match them; the hint family needs substring (or suffix-aware) matching semantics, not just a different word list.
- `docs/spec.md` ("상세 스펙") is not Markdown-linked from any entry document, so it is outside the entry graph by contract; that is an entry-surface gap for the corpus repo (adapter `entries` material), not a lexicon gap, and stays out of S2 scope.

## English corpora: shaping assumption check

The S1 stop condition ("English corpora also extract near nothing") did **not** trigger: charness and ceal extract richly through the same lexicon.
S2 therefore stays scoped as the non-English lexicon hint family rather than a general extraction redesign.
Shape notes for the S3 routing measurement later:

- Both English corpora skew toward `cautilus-eval` (100/227 and 158/308), consistent with this repo's gold-set pattern 1 (cautilus-eval over-assignment) being worth measuring on consumer corpora, exactly as the gold set's external-validity caveat asked.
- Top candidate sources are deep doc trees (`docs/public-skill-validation.md`, `docs/specs/ceal-harness-and-skill-ecosystem.spec.md`), so depth-3 traversal is doing real work on English consumer repos.

## Measurement caveats

- Counts are raw heuristic candidates, not reviewed claims; precision on the English corpora is unmeasured here (S3 routing measurement will sample it).
- charness and ceal adapters differ from yt-digest (entries/excludes), so cross-corpus count comparisons are shape evidence, not a controlled experiment; the controlled comparison is per-corpus before/after once hints exist.
- `discover claims` has no adapter-path override flag today, so applying proposed hints to a read-only corpus requires either a new explicit `--adapter <path>` flag or a temp-copy harness; this is recorded as an S2 design input.

## Next

S2: propose the claim-lexicon hint family (matching semantics + initial Korean term proposal from this scan) for maintainer ratification before engine wiring.
