# Standalone Surface

`Cautilus` should make sense as a standalone binary plus a bundled skill.
The product should not need a host-specific migration story before an operator can discover the command surface, install the skill, and run readiness checks in a fresh repo.

Three discovery surfaces matter here:

- `./bin/cautilus healthcheck --json` for binary health
- `./bin/cautilus commands --json` and `./bin/cautilus scenarios --json` for safe machine-readable discovery
- `./bin/cautilus doctor --repo-root <path>` for repo-local readiness

The bundled skill matters because the standalone binary is not the only entry point.
`cautilus install` materializes the same product surface under `.agents/skills/cautilus/` for an in-repo assistant, while the operator still uses the CLI directly.
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

The user-facing references for this surface are `install.md`, `README.md`, and the bundled `skills/cautilus/SKILL.md`.
