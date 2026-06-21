# Cautilus Handoff

## Workflow Trigger

권장 호출(다음 세션): `@docs/internal/handoff.md 핸드오프대로 진행 — R6/R12 baseline 슬라이스는 landed/pushed. 다음 substantive 슬라이스를 사용자와 결정하세요: (a) Fork B 잔여 eval 과다배정(cautilus-eval→deterministic) per-facet 분해, 또는 (b) 260-rune 추출 bound 재검토(실제 제품 capability claim이 discovery에서 사라지는 recall 갭). 먼저 charness-artifacts/eval-trust/2026-06-21-heuristic-baseline-routing-vs-ratified.md 의 "After" 섹션을 읽고 분기를 제시하세요.`

첫 tool call = 측정 아티팩트의 "After" 섹션 read. mention-only 픽업이어도 재독에 그치지 말고 위 분기(다음 슬라이스 결정)를 사용자에게 제시하세요. (build 전 슬라이스 shape 확인.)

## Current State

- **R6/R12-into-baseline 슬라이스: 완료(push 예정/됨).** spec→impl→measure→review 풀 사이클.
  - 엔진 baseline `classifyClaimLine`에 R6(ownership/boundary *assignment* → deterministic, explicit-assignment 절만, reconcile 가드 포함) + R12(capability-existence → deterministic) 반영.
  - 세 번째 어댑터 hint family `classification_hints.proof_route_hints`(`{pattern, route}`, extends-never-replaces) 추가 — engine default + adapter extension 패턴.
  - bounded fresh-eye 비평 2회(spec REVISE→반영, impl PASS/no-must-fix). spec critique의 3 must-fix(통째 flip 금지·reconcile 그림자 가드·게이트 falsifiable화) 전부 반영.
  - 신규 테스트: `TestClaimClassificationR6R12RoutingBoundaryIsFrozen`(frozen golden: R6/R12/scope/shadow/negative 9케이스), `TestDiscoverClaimProofPlanAdapterProofRouteHintRoutesUnclassifiedLine`(no-hint control), `TestResolveClaimProofRouteHintsRejectsUnsupportedRoute`. 기존 4 ownership 단언은 R6 보정으로 업데이트(주석 근거).
  - `npm run verify` green(282s), 전체 Go 테스트 green, `claims:refresh:all` 반영.
- **직전 세션 컨텍스트(여전히 유효):** eval determinism skew는 사실상 닫힘(judge가 `cautilus evaluate`에 wiring, apex 7/7 proven). Residual A landed. Fork C(정리+측정) landed.

## 측정 핵심 (이 슬라이스 결과 + 다음 근거)

- 게이트(falsifiable, critique 합의): 49→48 overlap에서 route 일치 **22→26 (45%→54%)**, over-correction 시그니처(live=det/key=human) **0 신규**. 두 바인딩 게이트 충족.
- **live 개선은 전부 R6**(human-auditable→deterministic 8건, overlap 내 4건이 ratified deterministic과 일치). 분포: det 140→148, human 113→104, eval 144→145.
- **R12는 correct-but-dormant**: archetype claim `claim-readme-md-139`(GEPA seam, README.md:140)가 **278 runes > 260-rune 추출 bound**라 live 모집단에 추출조차 안 됨. R12 predicate는 unit-frozen이나 live 0건. live `ships` 후보는 install/deterministic-token 케이스가 이미 처리.
- **cautilus-eval 과다배정은 부분만 해소**: R6는 human→det만 이동. 측정이 dominant로 지목한 `cautilus-eval→deterministic` 불일치는 ownership/capability shape가 아니라 portable default가 안전하게 못 잡음 → Fork B(per-facet 분해)로 남김.

## Next Session

1. **Fork B(deeper, 측정 기반 권장):** true per-facet 분해를 discovered 모집단으로 일반화 — 잔여 `cautilus-eval→deterministic` 불일치를 claim→code∧judge facet AND로 해소. R6/R12 baseline 위에서 시작.
2. **260-rune 추출 bound 재검토(cheap, recall 갭):** 실제 제품 capability claim(GEPA seam 등)이 길이 때문에 discovery에서 사라짐 — `claimLineLooksUseful` 상한이 너무 타이트한가? 측정 가능한 recall 질문. (wrapped-markdown join과의 상호작용도 확인.)
3. **app-surface Proof Debt(부분 차단):** app/chat liveness, app/prompt product-runner proof. 이 repo엔 실제 app 없어 owner/runtime 필요.
4. **push 전 필수:** claim-source(docs/specs/**, docs/master-plan.md, docs/contracts/**, README, AGENTS, internal/runtime/claim_discovery.go 등 latest.json source) 편집 시 `npm run claims:refresh:all` 후 push. handoff.md/charness-artifacts/**는 adapter exclude라 refresh 무영향.

## Discuss

- 다음 슬라이스 분기: Fork B(잔여 eval 과다배정, deeper) vs rune-bound 재검토(recall 갭, cheaper). 측정상 둘 다 실재하는 갭. Fork B가 honesty-story에 더 직접적이나 더 큼.
- nice-to-have(미반영, 선택): R12 compound 라인("ships a seam that improves behavior")은 단일 라우팅상 deterministic로 감 — Fork B의 per-facet가 정공법. 현재 live 미추출이라 무영향.

## References

- 측정+게이트(SOT): `charness-artifacts/eval-trust/2026-06-21-heuristic-baseline-routing-vs-ratified.md`("After" 섹션 = before/after 표)
- build contract: `charness-artifacts/eval-trust/2026-06-21-r6r12-baseline-routing.spec.md`
- 계약: `docs/contracts/facet-decomposition.md`("Landed (2026-06-21)"), `docs/contracts/claim-discovery-workflow.md`(R6/R12 routing + proof_route_hints), `docs/contracts/adapter-contract.md`(proof_route_hints schema)
- 엔진: `internal/runtime/claim_discovery.go`(`ownershipAssignmentClaim`, `capabilityExistenceClaim`, `claimNeedsReconciliation`, `matchProofRouteHint`, `resolveClaimProofRouteHints`), `internal/runtime/adapter.go`(`normalizeClaimDiscoveryClassificationHints` proof_route_hints)
- ground truth: `charness-artifacts/eval-trust/goldset-v2-reextract-head/gold-set-proposal.json`(answer key, `.entries[].agentLabels.recommendedProof`), `charness-artifacts/eval-trust/2026-06-19-recommendedproof-facet-gold-set-v2head.{md,json}`(R6/R12 정의 + facet gold set), `docs/specs/audit/claim-proof-route-overrides.json`(per-claim override surface)
