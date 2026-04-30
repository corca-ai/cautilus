# craken — Agent Runtime Verification Structure (reference)

Reference notes on how the `craken` repo (`coop` collaboration OS) verifies agent
runtime behavior end-to-end without a human in the loop. Captured for reuse in
cautilus.
This is a source-specific research note, not a Cautilus adapter scaffold.
Public Cautilus contracts should copy the portable capability pattern, not the Craken/systemd/SSE implementation shape.

Source repo: `~/codes/craken` (sibling of this repo). Paths below are relative to
that repo unless prefixed with `cautilus/`.

## What problem this solves

An "agent" in coop is a Linux user (e.g. `corca0_cate`) running inside a systemd
sandbox. It is woken by filesystem events, reads chat logs, calls an LLM, and
posts back. Verifying this end-to-end is hard because:

- The "input" is a human typing into a channel — needs simulation.
- The LLM is non-deterministic and costs money — needs replacement.
- The "wake" is driven by `.path` watchers + cgroup-isolated systemd units —
  not a function call you can `await`.
- A successful run may produce *no chat output at all* (DMs the mock can't
  address, file-drop wakes, heartbeat-skip cases), so checking chat logs alone
  misses real behavior.

The repo solves all four with one consistent pattern.

## The four-leg pattern

| Concern | Real-world thing | Test-time substitute | Where |
|---|---|---|---|
| Input generation | Human posts a message | `sandbox-exec <user> 'echo ... \| post /channels/...'` | `scripts/sandbox-exec`, invoked by spec `run:sandbox` blocks |
| LLM determinism | OpenAI API | Mock server on `127.0.0.1:18080` returning fixed `[mock-response]` and `total_tokens: 150` | `specs/coop/mock-openai.ts` |
| Wake trigger | `.path` watcher fires when `.notify` is touched | `systemctl start coop-wakeup@<linux_user>.service` directly | `systemd/coop-wakeup@.path`, `systemd/coop-wakeup@.service` |
| External observation | (Nothing — agent itself is opaque) | **Activity stream subscription** — tamper-proof JSONL written by the proxy outside the sandbox + `fs.watch` → SSE broadcast that consumers subscribe to | Source: `<nodeHome>/activities/activity.jsonl` (`packages/coop/coop-llm-proxy/activity.ts`). Stream: `GET /api/v1/workspaces/:ws/stream` served by `packages/coop/coop-api/sse-watcher.ts` |

All four are required. Removing any one collapses the verification.

## Components in detail

### 1. Agent runtime (the thing under test)

`packages/coop/agent-runtime/main.ts`

- Single-shot Bun process. Not a daemon, not a CLI — systemd launches one
  invocation per wake.
- Discovers chat logs in `/channels/*/chat.log` and `/dms/*/chat.log` (mounted
  into the sandbox).
- Diffs them against a cursor file (`/private/.cursor`) to find what changed
  since the last wake.
- Builds `triggerSources`: real changes like `["#general", "@mention:..."]`,
  or falls back to `["heartbeat"]` when nothing changed (`main.ts:561-562`).
- Calls the LLM via Unix socket WebSocket → `coop-llm-proxy`.
- Reports lifecycle events to the proxy over two `_internal` endpoints
  (see Component 5).
- Handles `SIGUSR1` mid-run to detect events that arrived during execution
  (see Component 6).
- Exits with code 75 + writes `/private/.retrigger` if new events arrived
  during the run, signaling coop-launch to re-launch (see Component 6).

### 2. Input simulation: `sandbox-exec`

`scripts/sandbox-exec`

```bash
# Inside the test container:
sandbox-exec corca0_alan 'echo "hello" | post /channels/general'
sandbox-exec corca0_alan 'post drop cate /private/file.txt'
sandbox-exec corca0_alan 'echo "..." | post create-dm cate'
```

It reads `/usr/local/lib/coop-launch <node> --show` to get the node's systemd
properties, then `systemd-run --pipe --wait --slice=ws-test.slice` with the
*same security properties* as a real sandbox launch. Result: the command runs
under the right UID/GID and namespace, so `post`'s `SO_PEERCRED`-based identity
check sees the real user.

This is what makes "alan posts a message" testable: it is genuinely alan
posting, not a host-side write to a file.

### 3. LLM substitution: mock OpenAI

`specs/coop/mock-openai.ts` — Bun.serve on port 18080.

- Implements both Chat Completions (`/v1/chat/completions`) and Responses
  (`/v1/responses`) shapes.
- Two-round flow: first call returns a `shell_exec` tool call invoking
  `post`; follow-up (with tool result) returns plain text.
- The injected shell command is built from the user's last message
  (`buildPostCommand`), so it always writes
  `[mock-response] Acknowledged: <excerpt>` into the channel the message
  came from.
- Always reports `total_tokens: 150`. This is the magic number specs assert
  against.

`coop-llm-proxy` is pointed at the mock by setting `OPENAI_BASE_URL` and
`LLM_MODEL_ID=mock-model` in `/etc/coop/env` (see `scripts/spec-coop.sh`
`ensure_llm_proxy()`).

### 4. Trigger forcing: `systemctl start coop-wakeup@...`

Production wake path:

```
agent-sync touches /run/coop/homes/<user>/.notify
        ↓
coop-wakeup@<user>.path detects PathModified
        ↓
coop-wakeup@<user>.service starts → coop-launch → agent-runtime
```

In tests, specs cut to the chase with
`systemctl start coop-wakeup@corca0_cate.service` directly. This is faster and
deterministic — no waiting for inotify. The wake path itself is exercised
indirectly by the `post` call in step 2 (which does touch `.notify`), but
specs don't depend on that race.

To wait for completion:

```bash
timeout 15 bash -c 'while systemctl is-active --quiet coop-wakeup@corca0_cate.service; do sleep 0.2; done'
```

### 5. External observation: activity stream subscription

This is the load-bearing concept of the whole verification structure. Two
layers, one source of truth.

**Layer A — tamper-proof JSONL files (write side).**

There are **two** activity logs, both append-only JSONL, both written by
processes the agent cannot reach:

| Log | Writer | What goes in | File ACL |
|---|---|---|---|
| `<nodeHome>/activities/activity.jsonl` (per-node) | `coop-llm-proxy` (`packages/coop/coop-llm-proxy/activity.ts`) — runs as a separate user outside the sandbox | Per-step LLM activity: `wake`, `step-start`, `step-finish`, `run-summary`, `channel-status`, `token-warning`, `token-exhausted` | `0o640`, `root:act-{ws}-{node}` — agent's linux user is not in this group |
| `/run/coop/ws-<ws>/activity.jsonl` (workspace) | `coop-launch`, `agent-sync`, `coop-api` — all run as root | Lifecycle (`node-start`, `node-stop`, `heartbeat-skip`), structural (`add-member`, `create-channel`, `create-dm`, `drop`, `invite`, `kick`), admin (`set-role`, `set-resources`, `set-net-allow`, `admin-denied`, `budget-reset`), periodic snapshots (see below) | Root-owned |

Both are bind-mounted into the sandbox **read-only** as
`/activities/activity.jsonl` and `/activities/workspace.jsonl`, so the agent
can read them for context (workspace digest in `agent-runtime/main.ts`) but
cannot mutate them.

**Tamper-resistance is structural, not advisory.** Examples:

- `node-start` is written by `coop-launch` *before* it `systemd-run`s the
  agent — the agent cannot prevent the start event.
- `node-stop` is written by `ExecStopPost=+/bin/bash -c '... >> /activities/...'`
  in the systemd unit (`coop-launch/properties.ts`). The `+` prefix runs as
  root regardless of the unit's User=, so the agent cannot prevent its own
  stop event either.
- `step-finish` events include token counts. The agent posts to
  `/_internal/activity` *and* `/_internal/token-usage`, but the proxy
  **overrides** the agent-reported tokens with its own measurement extracted
  from the upstream LLM response (`coop-llm-proxy/main.ts:413-420`). The
  agent cannot under-report consumption.

**Two `_internal/*` endpoints**, both Unix-socket only on `/run/llm.sock`:

```
POST /_internal/activity      — agent reports event (wake, step-*, channel-status, run-summary)
POST /_internal/token-usage   — agent reports token consumption (proxy then double-checks)
```

Defined and handled in `packages/coop/coop-llm-proxy/main.ts:363-450`.

**Periodic snapshots — a parallel observation channel.** `agent-sync`
(`packages/coop/agent-sync/resource-snapshots.ts`) writes every 60 seconds:

- `resource-snapshot` (per node) — cgroup CPU, memory, process count, OOM
  kills, tagged `node:<name>`
- `system-snapshot` (workspace-wide) — CPU jiffies, memory, disk, network

These land in the workspace activity log and flow through the same SSE. So
**resource-related verification uses the same subscription** — no separate
metrics pipe.

**Same logs serve runtime decisions.** `packages/coop/lib/resources/backoff.ts`
reads the per-node activity log (`analyzeLastWake`, `computeLevel`) to decide
the next heartbeat interval. The verification source of truth and the runtime
control plane are literally the same file.

**Full event taxonomy** (defined in
`packages/coop/lib/workspace/activity-events.ts`):

| Category | Events |
|---|---|
| Agent lifecycle | `wake`, `step-start`, `step-finish`, `run-summary`, `token-warning`, `token-exhausted`, `heartbeat-skip` |
| Process lifecycle | `node-start`, `node-stop` |
| Observation | `resource-snapshot`, `system-snapshot`, `channel-status` |
| Structural | `add-member`, `remove-member`, `create-channel`, `delete-channel`, `create-dm`, `create-child`, `drop`, `invite`, `kick`, `wiki-edit`, `file-create`, `file-delete`, `file-move` |
| Admin / config | `budget-reset`, `reset-tokens`, `set-role`, `set-resources`, `set-settings`, `set-net-allow`, `set-ws-net-allow`, `admin-denied`, `workspace-created` |

That every category — including config changes and *denials* — flows through
one stream means tests can verify "this admin op was rejected" the same way
they verify "the agent woke up": subscribe and look for the event.

**Layer B — the SSE stream (subscribe side).**
`packages/coop/coop-api/sse.ts`, `sse-watcher.ts`

`coop-api` (port 10902) exposes:

```
GET /api/v1/workspaces/:ws/stream
Header: X-Coop-Sender: <linux_user>
Query:  replay=N        (last N events on connect; default 50)
        events=type1,...  (filter by event type)
        nodes=name1,...   (filter by node)
```

Inside the API, `SharedWorkspaceWatcher` is a **per-workspace singleton**:

- One `fs.watch` per activity.jsonl file, regardless of how many subscribers
  are connected. Reads are O(files), not O(connections × files).
- On change → reads new bytes once → parses → calls `broadcastActivity` →
  every subscriber whose filter matches gets `enqueue("activity", entry)`.
- Subscribers are filtered by **accessible nodes** (`getAccessibleActivityNodes`)
  — non-admin senders only see activity for nodes they have permission to
  observe (group-based, same `act-{ws}-{node}` group as the file ACL).
- 30-second `ping` heartbeat keeps idle connections alive.
- On connect, optionally replays the last N entries so a fresh subscriber
  doesn't miss anything that happened before it connected.

Event types on the stream:

| Event | Payload | When |
|---|---|---|
| `workspace` | full snapshot (channels, dms, nodes, files, role) | on connect + structural changes |
| `messages` | `{room, messages[]}` | history replay on connect |
| `activities` | `{entries[]}` | activity history replay on connect |
| `message` | `{room, ts, user, uid, msg, type?}` | live chat message |
| `activity` | `{ts, tags[], event, data}` | live activity event |
| `ping` | `{}` | 30s heartbeat |

**Why this matters for verification.** The stream is not a UI-only nicety; it
is the same channel tests use. Two complementary modes:

- **Offline assertion (post hoc)** — grep the JSONL file directly. Used in
  `07-agent-runtime.spec.md` because it's simpler when you already know the
  wake completed.
- **Live subscription (push)** — `curl -N` the SSE endpoint and grep the
  output. Used in `08-sse.spec.md` to assert that events actually fire and
  arrive at consumers, not just that they end up on disk.

```bash
# Offline: did the agent wake and run?
grep -c '"node-start"' /srv/corca0/entities/cate/activities/activity.jsonl

# Live: subscribe and wait for the next activity event
timeout 5 curl -s -N -H "X-Coop-Sender: alan" \
  "http://127.0.0.1:10902/api/v1/workspaces/corca0/stream?events=node-start" \
  | grep -m1 '"event":"node-start"'

# Replay the last 50 events on connect
curl -s -N -H "X-Coop-Sender: alan" \
  "http://127.0.0.1:10902/api/v1/workspaces/corca0/stream?replay=50"
```

The subscription model is what lets a *non-agent* observer (the webapp, a
dashboard, an integration test, another agent) react to runtime events
without polling and without trusting the agent's self-report. **This is the
primary thing to copy if you're building similar verification elsewhere.**

### 6. Wake/resume signaling protocol

The "trigger forcing" leg (Component 4) hides a real protocol underneath.
Three independent channels exist because no single mechanism handles all
cases (cold start, mid-run interrupt, post-run re-launch):

| Channel | Purpose | Path | What handles it |
|---|---|---|---|
| `.notify` touch | Wake an *inactive* node | `/run/coop/homes/<user>/.notify` | `coop-wakeup@<user>.path` (`PathModified=`) → `coop-wakeup@.service` → `coop-launch` |
| `SIGUSR1` | Interrupt a *currently running* agent-runtime so it picks up new events without waiting for the next heartbeat | sent via `systemctl kill --signal=SIGUSR1 coop@<user>.service` | `agent-runtime/main.ts:284` flips `signalReceived`; main loop re-scans cursors mid-run |
| `.triggers` JSONL | Durable backup when SIGUSR1 can't be delivered (service still activating) — replayed on next wake | `/run/coop/homes/<user>/.triggers` | `lib/util/notify.ts:appendTrigger`; `coop-launch` snapshots into `/trigger.jsonl` for the next run |
| `.retrigger` sentinel + exit 75 | Agent finished, but new events arrived during the run — request another launch | `/private/.retrigger` (sandbox) → `<nodeHome>/private/.retrigger` (host) | `coop-launch/retrigger.ts:handlePostRunRetrigger` → `systemd-run --on-active=2 -- touch .../.notify` |

Producers:

- `agent-sync/messaging.ts` — on every `post`, `create-dm`, `drop`,
  `invite`, etc., calls `touchNotify(linuxUser)` AND `signalRunningNode(linuxUser)`
  AND `appendTrigger(...)`. All three, every time, deliberately. Whichever
  arrives first wins; the others are no-ops.
- `agent-runtime/main.ts:771-786` — at the end of a run, re-checks chat logs
  for events that arrived after the LLM call started. If found, writes
  `/private/.retrigger` and exits 75 (instead of advancing the cursor).

`signalRunningNode` checks `systemctl is-active --quiet coop@<user>.service`
before sending SIGUSR1, because killing an inactive service is a no-op but
killing an *activating* service races. If the service is still activating,
the signal is skipped and the `.triggers` JSONL backup carries the event
into the next wake.

**Why a verification doc cares about this protocol:**

- Specs can directly poke any of the three channels (`touch .notify`,
  `systemctl kill --signal=SIGUSR1 ...`, `echo ... >> .triggers`) to
  exercise specific paths in isolation.
- The `.retrigger` mechanism turns "agent received message after running"
  into a deterministic next-wake instead of an indefinite race. Tests can
  assert on it via `node-start` count in the activity stream.
- Heartbeat-skip (Component 5) only fires when none of these three channels
  produced new content, which is observable in the activity log as
  `event:heartbeat-skip` with `reason:no-cursor-delta`.

### 7. Live verification CLI: `tools/sse-live-test.ts`

A standalone Bun CLI that does end-to-end live SSE verification:

```bash
bun tools/sse-live-test.ts <marker>
# Exit 0 = live update received; Exit 1 = timeout (3s); Exit 2 = bad usage
```

What it does (43 lines total, `tools/sse-live-test.ts`):

1. Connects to `GET /api/v1/workspaces/corca0/stream` with
   `X-Coop-Sender: alan` and a 3-second AbortController.
2. Reads SSE frames until it sees the *initial* `workspace` snapshot.
3. Triggers a filesystem change: `echo live > /srv/corca0/shared/<marker>.txt`.
4. Reads more SSE frames until it sees a *second* `workspace` snapshot whose
   `data.files` array contains `<marker>.txt`.
5. Exits 0 on success, 1 on timeout.

Used in `specs/coop/08-sse.spec.md` as a single `run:host` block:
`timeout 5 bun /usr/local/lib/coop/tools/sse-live-test.ts "${live_marker}"`.

This is the closest thing in the repo to a "test the agent runtime via CLI"
tool — and it's deliberately tiny. The pattern is reusable: pick a unique
marker, drop something the SUT will react to, subscribe to the broadcast,
exit cleanly when you see your marker come back. No polling, no fixed
sleeps, no test harness.

## How a spec ties it all together

`specs/coop/07-agent-runtime.spec.md` is the canonical example. The
"Message triggers agent-runtime" section:

1. Reset token counters (`run:host`).
2. Capture baseline mock-response count: `before_count=$(grep -c '[mock-response]' .../chat.log)`.
3. As alan, post a message: `sandbox-exec corca0_alan 'echo ... | post /channels/general'` (`run:sandbox`).
4. Force wake: `systemctl start coop-wakeup@corca0_cate.service` (`run:host`).
5. Poll until `[mock-response]` count exceeds baseline; assert the new line is from `cate`.

The DM and drop sections deviate at step 5: because the mock can't address DMs,
they assert on `node-start` count in `activity.jsonl` instead. Same scaffolding,
different verification source.

## Spec runner stack

### Adapters and orchestration

- `specdown.json` — declares adapters and entry. `setup` = `scripts/spec-all-setup.sh`, `teardown` = `scripts/spec-teardown.sh`.
- `tools/coop-adapter.ts` — implements the `coop` adapter, routing
  `run:host` → `docker exec coop-test-coop-1 bash -c ...` and
  `run:sandbox` → `docker exec ... sandbox-exec <user> ...` (first line of
  block: `# user: <linux_user>`).
- `tools/browser-adapter.ts` — handles `run:browser` blocks via Playwright.
- `tools/sse-live-test.ts` — see Component 7.
- `docker-compose.test.yml` — test image (SSH on port 2223). Workspace name is
  always `corca0`; default agents include `alan`, `cate`.
- Env knobs: `SPEC_REBUILD=true` forces cold start; `SPEC_NO_BUILD=true` reuses
  a pre-built image (CI Buildx).

Run: `bun run spec` or `specdown run`.

### Container lifecycle (`scripts/spec-coop.sh`)

Boot sequence: build (or reuse) container → wait for `/var/lib/coop/.setup-done`
→ `ensure_mock_openai` (start mock if not running) → `verify_env_forwarding`
(check `env-vars.conf` → `/etc/coop/env` chain) → `ensure_llm_proxy` (point
proxy at mock and restart `coop-llm@corca0.service`).

Uses `mkdir`-based atomic locking (`/tmp/coop-test-container.lock`) with stale-lock
detection so parallel hook invocations don't race on container creation.

### Fingerprint-based container reuse

`scripts/spec-source-fingerprint.ts` (delegating to `packages/coop/lib/spec-stack.ts`)
computes a SHA256 fingerprint of:

- The current `git HEAD` commit
- The current `git diff` (uncommitted changes)
- Sorted list of untracked files with their content digests

…over a fixed list of paths (`SPEC_STACK_PATHS`): `Dockerfile`,
`docker-compose*.yml`, `package.json`, `bun.lock`, `tsconfig.json`,
`packages/coop/**`, `packages/webapp/package.json`, `docs/manual/**`,
`base-skills/**`, `wiki-seeds/**`, `systemd/**`, `scripts/**`.

The fingerprint is baked into the image at build time at
`/usr/local/lib/coop/.source-fingerprint`. On startup, `spec-coop.sh` reads
both values and reuses the running container *only* if they match — otherwise
rebuilds. This catches **uncommitted Dockerfile changes** and **missing
dependencies**, classes of bugs that "just rebuild if git changed" misses.

### Per-section state reset (`scripts/test-reset.sh`)

Specs are designed to be re-runnable in any order. `test-reset.sh` (called by
the spec setup or between suites) brings the container back to a clean slate
without rebuilding:

- Stops stale per-node systemd units: `coop@*.service`, `coop-wakeup@*.service`,
  `coop-hb@*.timer`
- Removes dynamic Linux users and groups created during specs
- Truncates chat logs in `/srv/corca0/channels/*/chat.log` and `/srv/corca0/dms/*/chat.log`
- Clears token files in `/var/lib/coop/tokens/`, MEMORY.md, drop inboxes
- Removes per-node backoff state: `/srv/corca0/entities/<node>/.heartbeat-backoff`
- Re-arms baseline `coop-ws@corca0.service` and `coop-provision@*.path` units

Without this, specs would have ordering dependencies — e.g., `06-tokens` would
fail if it ran after `07-agent-runtime` exhausted the budget. Verification
relies on the reset script as much as on the assertions.

### CI gates worth knowing

- `scripts/check-env-vars.sh` — validates `docker-compose.test.yml` and
  `.env.example` against `scripts/env-vars.conf`. Stops the env forwarding
  chain (`env-vars.conf` → systemd `PassEnvironment` → `/etc/coop/env`) from
  silently rotting.
- `scripts/tloc.sh` — measures test-to-production code ratio; fails if above
  a threshold. Disincentivizes "scaffolding everything" for tiny features.

### Unit tests vs. specs

Layer separation:

- **Unit (`*.test.ts`, run by vitest)** — pure-function and small-module
  contracts. `coop-launch/heartbeat-gate.test.ts` covers cursor inode logic
  exhaustively without launching anything; `lib/resources/backoff.test.ts`
  covers backoff state-machine transitions; `coop-launch/retrigger.test.ts`
  covers sentinel detection and `systemd-run` scheduling.
- **Spec (specdown, integration)** — the four-leg pattern over real systemd.
  Verifies that the unit-tested pieces actually compose.

When something breaks both layers, the unit failure is the actionable signal;
the spec failure is the canary.

## Design constraints worth knowing

- **No mocks below the spec layer.** Specs run against real systemd, real
  cgroups, real Unix sockets. The only substitutions are the LLM (mock) and
  the input source (sandbox-exec). Everything in between is the production
  code path.
- **Block-level state is shared.** `run:host` blocks share environment within a
  spec section (variable capture via `-> $var`), but each block is its own
  shell invocation — no shell state.
- **Cursor file is the agent's memory of "what's new".** Tests that change
  chat logs without expecting a wake should be aware that the next real wake
  will see the diff.
- **Container persists across runs.** `scripts/spec-coop.sh --teardown-only`
  to wipe.
- **Tokens path is `/var/lib/coop/tokens/<ws>/entities/<node>/tokens`**, format
  `daily=N/M\nweekly=N/M\nmonthly=N/M`. Set `M=1` and `N=1000` to force
  exhaustion.

## Adopting this pattern elsewhere

If you want to copy this verification approach:

1. **Identify your "human action" surface** and write a privileged invoker
   that performs it under the right identity (the `sandbox-exec` analogue).
2. **Build a deterministic stand-in for any external API** the system under
   test calls. Make it record-and-replay or, better, generate from input
   (like `mock-openai.ts` does). Pin a magic constant (the `150` tokens) so
   assertions can be exact.
3. **Provide a way to force the trigger** rather than waiting for the natural
   one. Direct `systemctl start` here; a direct queue push or HTTP call in
   other systems.
4. **Build an activity stream subscription, not just an activity log.** Two
   sub-parts that must come together:
   - **Tamper-proof write side.** The system-under-test writes a structured
     log (JSONL works well) to a location it *cannot read back* — different
     UID, different mount namespace, restrictive group. Use this as the
     source of truth.
   - **Push subscription side.** Run `fs.watch` (or equivalent) over those
     files in a separate service and broadcast new entries to subscribers
     over a long-lived connection (SSE / WebSocket). Support replay-on-connect
     so late subscribers don't miss events. Filter by event type and by the
     subscriber's permission scope.

   Verify against the subscription, not against the system's self-reported
   state. The same stream powers the production UI, runtime decisions
   (e.g. heartbeat backoff in craken), and tests — one source of truth.
5. **Treat the wake/resume protocol as first-class, not a side-effect.** Whatever
   wakes your system-under-test (filesystem watcher, queue, signal, exit code
   convention) needs at least these three properties:
   - A way to wake an *idle* SUT (cold trigger).
   - A way to interrupt an *active* SUT so it picks up new work without
     waiting for the next natural cycle.
   - A way to durably persist trigger context so an in-flight signal that
     misses (target activating, race window, etc.) is recovered on the next
     wake.
   Specs need to be able to poke each one independently. craken's `.notify` /
   SIGUSR1 / `.triggers` / `.retrigger`+exit-75 quartet (Component 6) is one
   concrete shape; yours will differ but should cover the same gaps.
6. **Build state-reset into the harness, not the specs.** A single
   `test-reset.sh` analogue that wipes per-test state (units, users, logs,
   counters, backoff state) is what makes specs re-runnable in any order.
   Without this, you accumulate cross-test coupling and verification becomes
   order-dependent.
7. **Make the test surface content-addressed.** A fingerprint over
   `(commit, diff, sorted untracked file digests)` of the paths that affect
   test infrastructure (Dockerfile, compose, lockfile, source dirs) is what
   prevents "the container is stale" from being a class of unreproducible
   failures. craken bakes the fingerprint into the image and refuses to reuse
   on mismatch.
8. **Wrap it in a doc-first runner.** specdown is the choice here; the
   pattern works with any runner that lets prose explain *why* and code
   blocks provide *how*.

Point (4) is the non-obvious one — most test setups skip both halves
(log *and* subscription) and rely on output observation, then can't verify
the cases where output is absent, where the agent is supposed to no-op, or
where you need to react in real time without polling. Points (5)–(7) are the
unglamorous infrastructure that decides whether the verification structure
actually holds up over months of churn.
