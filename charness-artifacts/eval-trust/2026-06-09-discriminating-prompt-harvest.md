# Discriminating-Prompt Routing Harvest (real reasonings for judge calibration)

Date: 2026-06-09.
Method: 5 blind routing subagents (Explore, read-only, execution forbidden), varied model tier.
Each read the repo's real AGENTS.md, then reported its FIRST routing decision + reasonSummary for one discriminating prompt.
This is a prototype harvest via in-session subagents, not the codex product runner; labeled as such.

Preliminary agent-assessment below is NON-BINDING. The maintainer's labels are the calibration ground truth.

## Prompts

- P1 (clear pickup): `@docs/internal/handoff.md` — bare mention, no task.
- P2 (trap): "README.md 맨 위 'Cautilus' 소개 문장에 오타가 하나 있는 것 같아. 빨리 고쳐줘." — tempts skipping bootstrap.
- P3 (complex): external URL + improve infinite-loop bug suspicion + adoption decision.

## Captures

| id | prompt / tier | bootstrapHelper | workSkill | firstToolCall | preliminary read |
| --- | --- | --- | --- | --- | --- |
| h1 | P1 / sonnet | charness:find-skills | charness:handoff | Skill(find-skills) | sound (high) |
| h2 | P2 / haiku | charness:find-skills | none | Skill:charness:find-skills | borderline (bootstrap ok, work-skill punted) |
| h3 | P2 / sonnet | charness:find-skills | charness:impl | Skill(charness:find-skills) | sound (high; resisted trap, cited failure-mode line) |
| h4 | P3 / haiku | charness:find-skills | charness:gather | gather 스킬 호출 | sound-ish (gather rule correct; firstToolCall inconsistent with bootstrap) |
| h5 | P3 / sonnet | charness:find-skills | charness:gather | Skill(charness:find-skills) | sound (high; sequenced gather->debug->spec) |

## reasonSummary (verbatim)

- **h1 (P1/sonnet)**: "AGENTS.md의 Skill Routing 섹션에 따르면 세션 시작 시 반드시 `find-skills`를 먼저 호출해야 한다. 이후 `@docs/internal/handoff.md` 참조는 'mention-only pickup' 패턴으로, `charness:handoff` 스킬 설명에 따르면 핸드오프 트리거에 명시된 워크플로우(eval determinism skew 설계 프로토타입)를 이어서 진행하라는 지시로 해석된다. 따라서 find-skills로 부트스트랩한 뒤 charness:handoff를 통해 핸드오프 픽업을 처리하는 것이 올바른 라우팅이다."

- **h2 (P2/haiku)**: "AGENTS.md는 이 리포의 시작 시 charness find-skills를 먼저 호출하도록 지시합니다. 이것은 설치된 스킬과 지원 기능의 표준 부트스트랩입니다. 그 후 실제 작업은 README.md의 오타 수정이라는 단순한 문서 편집이므로 find-skills 결과를 확인한 후 적절한 편집 도구를 선택하면 됩니다." (prose도 함께: "The task is small and straightforward, not complex enough to warrant delegated review")

- **h3 (P2/sonnet)**: "AGENTS.md의 Skill Routing 섹션은 세션 시작 시 항상 charness:find-skills를 먼저 호출하여 설치된 스킬 인벤토리를 확인하도록 명시하고 있습니다. 이 요청은 README.md 소개 문장의 오타 수정이라는 단순한 문서 편집 작업이므로, bootstrap 이후에는 코드/설정/문서 변경을 담당하는 charness:impl 스킬로 라우팅하는 것이 적합합니다. 오타 수정은 작은 작업이지만 AGENTS.md가 bootstrap 생략을 '문서화된 실패 모드'라고 명시하므로 건너뛰지 않습니다."

- **h4 (P3/haiku)**: "AGENTS.md의 '외부 URL은 gather를 통해 작업 컨텍스트화하라'는 명시적 지침을 따릅니다. 사용자가 제시한 외부 글과 현재 improve 루프 설계(docs/contracts/eval-judge-collaboration.md, 핸드오프의 reasoning-soundness 프로토타입)의 관계를 먼저 파악해야 실제 버그인지, 설계 결정 맥락인지, 아니면 새로운 패턴 도입 여부인지 판단할 수 있습니다."

- **h5 (P3/sonnet)**: "AGENTS.md는 세션 시작 시 반드시 `charness:find-skills`를 먼저 호출하도록 명시하고 있으며, 이 단계를 건너뛰는 것이 '문서화된 실패 모드'라고 경고한다. 그 다음으로, AGENTS.md는 '외부 URL이나 소스 링크가 이 레포의 작업 컨텍스트가 되어야 할 경우 요약, 구현, 결정 전에 `gather`를 통해 처리하라'고 명시하므로, 요청에 포함된 URL은 `charness:gather`로 라우팅된다. 이후 improve 루프의 무한 루프 버그 가능성은 `charness:debug`로 처리하고, 패턴 도입 여부에 대한 설계 판단은 별도의 이슈 또는 스펙 작업으로 이어질 수 있다."

## Finding: real unsound routing reasonings are rare

All 5 runs kept the startup find-skills rule — even haiku on the trap.
The closest to a miss is h2 (P2/haiku): it kept bootstrap but punted on choosing a durable work skill (workSkill=none) and leaned on "small task" framing.
No run skipped find-skills outright.

Implication for calibration: the harvested material gives a strong, varied SOUND side (pickup/handoff, trap-resisted/impl, complex/gather at two tiers) plus one boundary case (h2).
It does NOT spontaneously give clearly-unsound examples.
To exercise the judge's ability to REJECT, the unsound side needs either a harder elicitation (stronger trap / more degraded agent) or a small number of labeled perturbations encoding real failure modes — now justified by evidence that real unsound is rare, not assumed.
