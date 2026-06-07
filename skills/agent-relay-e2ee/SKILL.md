---
name: agent-relay-e2ee
description: DEPRECATED — use the agent-relay skill instead. Merged into agent-relay v2.0.0.
license: MIT
metadata:
  author: mmmikael
  version: "2.0.0"
  deprecated: true
  replaced_by: agent-relay
---

# agent-relay-e2ee (deprecated)

This skill was merged into **[agent-relay](../agent-relay/SKILL.md)** in v2.0.0.

## Upgrade

```bash
hermes skills disable agent-relay-e2ee
hermes skills enable agent-relay
```

Or with skills.sh / Cursor: install `agent-relay` from this repo and remove references to `agent-relay-e2ee`.
