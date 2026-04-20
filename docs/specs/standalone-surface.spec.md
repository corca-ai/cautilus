# Standalone Surface

`Cautilus` should make sense as a standalone binary plus a bundled skill.
The product should not need a host-specific migration story before an operator can discover the command surface, install the skill, and run readiness checks in a fresh repo.

Three discovery surfaces matter here:

- `./bin/cautilus healthcheck --json` for binary health
- `./bin/cautilus commands --json` and `./bin/cautilus scenarios --json` for safe machine-readable discovery
- `./bin/cautilus doctor --repo-root <path>` for repo-local readiness plus the first bounded-run handoff once a repo is ready
- `./bin/cautilus workbench discover` and `./bin/cautilus workbench run-live` when a repo exposes live local instances through the generic workbench contracts

The bundled skill matters because the standalone binary is not the only entry point.
`cautilus install` materializes the same product surface for an in-repo assistant, while the operator still uses the CLI directly.
That install step does not pretend the repo is fully configured.
The follow-up readiness check should report the next missing prerequisite honestly.

## Discovery Proof

```run:shell
$ ./bin/cautilus healthcheck --json | grep '"schemaVersion": "cautilus.healthcheck.v1"'
  "schemaVersion": "cautilus.healthcheck.v1",
$ ./bin/cautilus commands --json | grep '"path": \[' | head -n 1
      "path": [
$ ./bin/cautilus doctor --repo-root . | grep '"status": "ready"'
  "status": "ready",
$ ./bin/cautilus doctor --repo-root . | grep '"first_bounded_run": {'
  "first_bounded_run": {
```

## Workbench Proof

```run:shell
# A standalone checkout should also drive the generic workbench contracts in a tiny synthetic consumer repo.
tmpdir=$(mktemp -d)
mkdir -p "$tmpdir/.agents"
cat > "$tmpdir/.agents/cautilus-adapter.yaml" <<EOF
version: 1
repo: temp
evaluation_surfaces:
  - workbench smoke
baseline_options:
  - baseline git ref via {baseline_ref}
instance_discovery:
  kind: explicit
  instances:
    - id: default
      display_label: Local Default
      data_root: $tmpdir/runtime/default
      paths:
        scenario_store: $tmpdir/runtime/default/scenarios.json
live_run_invocation:
  command_template: cautilus workbench run-live --repo-root {repo_root} --adapter {adapter_path} --instance-id {instance_id} --request-file {request_file} --output-file {output_file}
  consumer_command_template: sh ./run-live.sh {instance_id} {request_file} {output_file}
EOF
cat > "$tmpdir/run-live.sh" <<'EOF'
#!/bin/sh
instance_id="$1"
request_file="$2"
output_file="$3"
node - "$instance_id" "$request_file" "$output_file" <<'JSON'
const [instanceId, requestFile, outputFile] = process.argv.slice(2);
const { readFileSync, writeFileSync } = await import("node:fs");
const request = JSON.parse(readFileSync(requestFile, "utf8"));
writeFileSync(outputFile, JSON.stringify({
  schemaVersion: "cautilus.live_run_invocation_result.v1",
  requestId: request.requestId,
  instanceId,
  executionStatus: "completed",
  summary: "Synthetic workbench smoke completed successfully.",
  scenarioResult: {
    scenarioId: request.scenario.scenarioId,
    status: "passed",
    summary: "The bounded run stayed inside the contract."
  }
}) + "\n", "utf8");
JSON
EOF
chmod +x "$tmpdir/run-live.sh"
cat > "$tmpdir/request.json" <<'EOF'
{
  "schemaVersion": "cautilus.live_run_invocation_request.v1",
  "requestId": "req-workbench-smoke",
  "instanceId": "default",
  "timeoutMs": 30000,
  "scenario": {
    "scenarioId": "scenario-smoke",
    "name": "Workbench smoke",
    "description": "Prove the standalone CLI can route one bounded live request.",
    "maxTurns": 1,
    "sideEffectsMode": "read_only",
    "simulatorTurns": ["Open the target and confirm the initial state."]
  }
}
EOF
./bin/cautilus workbench discover --repo-root "$tmpdir" --output "$tmpdir/catalog.json" >/dev/null
./bin/cautilus workbench run-live --repo-root "$tmpdir" --instance-id default --request-file "$tmpdir/request.json" --output-file "$tmpdir/result.json" >/dev/null
grep -q '"instanceId": "default"' "$tmpdir/catalog.json"
grep -q '"displayLabel": "Local Default"' "$tmpdir/catalog.json"
grep -q '"executionStatus":"completed"' "$tmpdir/result.json"
grep -q '"scenarioId":"scenario-smoke"' "$tmpdir/result.json"
```

## Install Proof

```run:shell
# Install the bundled skill into a fresh git repo and confirm `doctor` reports the next missing prerequisite honestly.
tmpdir=$(mktemp -d)
git -C "$tmpdir" init >/dev/null 2>&1
git -C "$tmpdir" config user.email test@example.com
git -C "$tmpdir" config user.name test
printf '# temp\n' > "$tmpdir/README.md"
git -C "$tmpdir" add README.md
git -C "$tmpdir" commit -m init >/dev/null 2>&1
./bin/cautilus install --repo-root "$tmpdir" --json | grep -q '"status": "installed"'
test -f "$tmpdir/.agents/skills/cautilus/SKILL.md"
./bin/cautilus doctor --repo-root "$tmpdir" >"$tmpdir/doctor.json" 2>&1 || true
grep -q '"status": "missing_adapter"' "$tmpdir/doctor.json"
```

The user-facing references for this surface are the install guide, the repo README, and the bundled skill docs.
