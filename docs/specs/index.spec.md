# Cautilus Current Specs

이 index는 현재 `Cautilus`가 실제로 주장하는 제품 경계와, 그 주장을 지키기 위해 유지해야 하는
source-level guard를 담는다.

아직 구현하지 않은 방향은 [master-plan.md](../master-plan.md)에 둔다.
현재 검증 대상은 이 index에 링크된 문서들이다.
`npm run lint:specs`는 이 index에 링크된 `.spec.md` 문서만 standing spec으로 읽고,
각 문서의 `check:source_guard` 표를 직접 검증한다.
비싼 CLI 흐름이나 broad test suite는 각 스펙의 `Functional Check`에 남기되,
standing spec gate에서는 다시 실행하지 않는다.

## Current Documents

- [Current Product](current-product.spec.md)
  현재 repo가 실제로 제공하는 contract, CLI, runtime runner, 문서 경계를 정의한다.
- [Standalone Surface](standalone-surface.spec.md)
  standalone binary와 bundled skill이 같은 제품 표면을 가리키는지 정의한다.
- [Self Dogfood](self-dogfood.spec.md)
  explicit quality 시점에만 돌리는 self-dogfood contract와 latest artifact
  path를 정의한다.
- [Archetype Boundary](archetype-boundary.spec.md)
  chatbot / skill / workflow 세 first-class archetype의 1:1 mapping과
  source guard를 고정한다.
- [HTML Report Surface](html-report.spec.md)
  리드미의 human-review 약속 — JSON artifact 옆에 HTML view —
  을 executable하게 검증한다. claim 1–9 (self-dogfood / mode report / review packet / review summary / compare / proposals / evidence / run index) 가 모두 승격되어 있다.
- [Git Precondition and Runtime Selection](git-precondition.spec.md)
  doctor의 git precondition gate와 skill test의 런타임 선택(codex/claude)을
  정의한다.
