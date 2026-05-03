# Evaluation

`Cautilus eval` checks selected behavior through explicit fixtures and repo-owned runners.

## User Promise

Cautilus evaluates behavior that ordinary deterministic tests cannot fully explain, while keeping the repo in control of the runtime that produces behavior.

## Subclaims

- Cautilus supports development-facing behavior, such as agent workflows, repo contracts, tools, and skills.
- Cautilus supports app-facing behavior, such as prompt, chat, and service-response behavior.
- A fixture declares the evaluated surface and preset so the reader can tell what kind of behavior is under test.
- The host repo owns prompts, models, credentials, runners, and acceptance policy.
- Each eval leaves enough input, observed output, and summary evidence for another person or agent to reopen the result.

## Evidence

The current executable proof checks that the shipped `eval test` surface advertises both development and app presets.
Per-claim evidence pages should later link concrete fixtures and result packets.

> check:cautilus-command
| args_json | stdout_includes |
| --- | --- |
| ["eval","test","--help"] | dev/repo |
| ["eval","test","--help"] | app/chat |
| ["eval","test","--help"] | app/prompt |
