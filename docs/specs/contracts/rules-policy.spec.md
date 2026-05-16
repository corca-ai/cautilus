# Contract Cross-Cutting Rule Policy

Maintainer evidence stays organized by evidence route.
Shared concerns such as Evidence Gaps, Packet Freshness, and Host-Owned Execution are mapped to those routes instead of getting a second maintainer page tree.

This keeps maintainer reading task-oriented:
open the route that owns the contract, then use [Cross-Cutting Rules](../rules/index.spec.md) to see which workflow-wide rules attach to it.

## Policy Checks

```run:shell
# Verify the policy has both sides of the map available.
node -e 'const fs = require("node:fs"); for (const path of ["docs/specs/contracts/index.spec.md", "docs/specs/rules/index.spec.md"]) { if (!fs.existsSync(path)) throw new Error("missing " + path); }'
```
