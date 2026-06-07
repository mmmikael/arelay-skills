---
name: agent-relay-api
description: DEPRECATED — use the agent-relay skill instead. Merged into agent-relay v2.0.0.
license: MIT
metadata:
  author: mmmikael
  version: "2.0.0"
  deprecated: true
  replaced_by: agent-relay
---

# agent-relay-api (deprecated)

This skill was merged into **[agent-relay](../agent-relay/SKILL.md)** in v2.0.0.

## Upgrade

```bash
hermes skills disable agent-relay-api
hermes skills enable agent-relay
```

Or with skills.sh / Cursor: install `agent-relay` from this repo and remove references to `agent-relay-api`.
