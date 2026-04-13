# Install Cautilus

This guide is the operator-facing install path for using `Cautilus` on another
machine.

It covers:

- installing the standalone `cautilus` binary
- verifying the local install
- installing the bundled `cautilus` skill into a host repo
- updating the CLI and bundled skill later

## Supported Platforms

This guide currently targets:

- macOS
- Linux

This guide does not currently target:

- Windows
- Windows Subsystem for Linux

If you are on WSL, treat the current install surface as unsupported for now.
The tagged-release installer and Homebrew guidance below are written for native
macOS and native Linux hosts.

## Choose An Install Path

Use one of these two public install paths:

1. `install.sh`
2. Homebrew

If you want the fewest moving parts, use `install.sh`.

## OS Notes

`install.sh` already chooses the correct tagged binary asset for the current
host:

- macOS: `darwin`
- Linux: `linux`
- Intel/AMD 64-bit: `x64`
- Apple Silicon or ARM64: `arm64`

Today that means the public tagged-release install surface supports:

- macOS `amd64`
- macOS `arm64`
- Linux `amd64`
- Linux `arm64`

Any other OS or CPU should fail loudly instead of guessing.

## Option 1: Install From A Tagged Release

This path does not require a local Go toolchain.

```bash
curl -fsSL https://raw.githubusercontent.com/corca-ai/cautilus/main/install.sh | sh
cautilus --version
cautilus version --verbose
```

What this does:

- resolves the latest tagged GitHub release unless `CAUTILUS_VERSION` is set
- downloads the matching binary archive for the current OS and CPU
- verifies the archive against the tagged checksum manifest
- installs the managed binary under `~/.local/share/cautilus/<version>/`
- writes a wrapper to `~/.local/bin/cautilus`

Optional environment variables:

```bash
CAUTILUS_VERSION=v0.2.1
CAUTILUS_INSTALL_ROOT="$HOME/.local/share/cautilus"
CAUTILUS_BIN_DIR="$HOME/.local/bin"
CAUTILUS_REPO=corca-ai/cautilus
```

If `~/.local/bin` is not already on `PATH`, add it in your shell profile.

Typical shell-profile snippets:

`zsh`:

```bash
echo 'export PATH="$HOME/.local/bin:$PATH"' >> ~/.zshrc
```

`bash`:

```bash
echo 'export PATH="$HOME/.local/bin:$PATH"' >> ~/.bashrc
```

## Option 2: Install With Homebrew

```bash
brew install corca-ai/tap/cautilus
cautilus --version
cautilus version --verbose
```

On Linux, Homebrew is officially supported when Homebrew itself is installed in
its default prefix. If your machine cannot support that prefix cleanly, prefer
the tagged-release path above instead of forcing an unsupported Homebrew setup.

Default Homebrew prefixes:

- macOS Apple Silicon: `/opt/homebrew`
- macOS Intel: `/usr/local`
- Linux: `/home/linuxbrew/.linuxbrew`

On Linux, if you cannot use Homebrew's default prefix cleanly, prefer
`install.sh`. Do not treat an arbitrary untar-anywhere Homebrew install as the
recommended operator path for `Cautilus`.

## Install The Bundled Skill Into A Host Repo

After the binary is available on `PATH`, install the bundled skill into the
target repo:

```bash
cd /path/to/host-repo
cautilus install --repo-root .
cautilus doctor --repo-root .
```

This creates:

- `.agents/skills/cautilus/` as the canonical checked-in skill path
- `.claude/skills -> ../.agents/skills` for Claude compatibility

The low-level `cautilus skills install` command still exists for compatibility,
but `cautilus install` is the canonical lifecycle entrypoint.

## Verify The Install

Minimum verification:

```bash
cautilus --version
cautilus version --verbose
cautilus doctor --repo-root /path/to/host-repo
```

Recommended repo-local verification:

```bash
cautilus adapter resolve --repo-root /path/to/host-repo
```

## Update Later

Update the CLI:

```bash
cautilus update
```

Update the CLI and refresh the bundled skill in a repo:

```bash
cautilus update --repo-root /path/to/host-repo
```

For Homebrew installs, `cautilus update` delegates to `brew upgrade cautilus`.
For managed tagged-release installs, it refreshes the installed wrapper from
the latest tagged release.

## Current Boundaries

What the current install surface does:

- installs the standalone CLI
- installs the bundled `cautilus` skill into a repo
- refreshes the CLI and bundled skill through `cautilus update`

What it does not yet do:

- install Homebrew itself
- install system package-manager dependencies
- install arbitrary third-party libraries on the host machine
