# Evaluation Surfaces And Runners Proof
Date: 2026-05-09

## Purpose

This checked-in artifact preserves selected evidence for the maintainer evaluation surfaces spec.
The source self-dogfood packets live under `artifacts/self-dogfood/`, which is intentionally ignored and therefore must not be the direct reopenable evidence target of a checked-in spec.

## Evidence Boundary

The paths below are reproduction source paths, not durable spec links.
They name the local commands and generated packets that produced this selected evidence snapshot.
The reopenable evidence for the spec is this checked-in artifact.

## Selected Summary Packets

| Preset | Reproduction command | Generated source path | Source SHA-256 | Schema | Recommendation | Counts | Proof signal |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `dev/repo` | `npm run dogfood:self:eval` | `artifacts/self-dogfood/eval/latest/eval-summary.json` | `5bb47afc30c0e1d2b216ee0575fd6210c86948c497c7bcca5c426bb402ec24c9` | `cautilus.evaluation_summary.v1` | `accept-now` | `passed=1 failed=0 blocked=0 total=1` | `targetSurface=dev/repo`, `proofClass=declared-eval-runner`, `productProofReady=true` |
| `dev/skill` multi-turn | `npm run dogfood:cautilus-refresh-flow:eval` | `artifacts/self-dogfood/cautilus-refresh-flow-eval/latest/eval-summary.json` | `b6ba4c3619a9e99c0f8fce3aa60e4a77220e53d449f775e6a9a1d647bd769076` | `cautilus.skill_evaluation_summary.v1` | `accept-now` | `passed=1 failed=0 blocked=0 total=1` | execution-quality audit passed with one finding |
| `app/chat` | `npm run dogfood:app-chat:fixture` | `artifacts/self-dogfood/app-chat-fixture/latest/eval-summary.json` | `db0a322deee6edd242de733717d5b75d941909254eb6f685eee5a03c37e8b12c` | `cautilus.app_chat_evaluation_summary.v1` | `accept-now` | `passed=1 failed=0 total=1` | `targetSurface=app/chat`, `proofClass=fixture-smoke`, `productProofReady=false` |
| `app/prompt` | `npm run dogfood:app-prompt:fixture` | `artifacts/self-dogfood/app-prompt-fixture/latest/eval-summary.json` | `f2233e2caf0805e82d2540040e73b2bc07f0afad517c080c81baae42f0931ffe` | `cautilus.app_prompt_evaluation_summary.v1` | `accept-now` | `passed=1 failed=0 total=1` | fixture-backed prompt evaluation summary |

## Maintainer Reading

This evidence supports the claim that all shipped evaluation preset families have fixture-backed summary packets.
It does not make ignored `artifacts/self-dogfood/` outputs part of the checked-in documentation graph.
When these self-dogfood packets are refreshed, update this artifact with the new selected fields and source hashes in the same commit as any spec claim that depends on them.
