# arelay-skills

Agent skills for [Agent Relay](https://arelay.app) — deliver artifacts to humans via HTTP API, encrypted uploads, and Railway self-hosting.

Works with [skills.sh](https://skills.sh), Cursor, Claude Code, Codex, **Hermes Agent**, and 60+ other agents via the Agent Skills standard.

## Installation

### Hermes

```bash
hermes skills tap add mmmikael/arelay-skills
```

### Other agents

```bash
npx @skills-sh/install mmmikael/arelay-skills
```

## Skills

| Skill                  | Description                                      |
|------------------------|--------------------------------------------------|
| `agent-relay-api`      | Create sessions and upload artifacts             |
| `agent-relay-e2ee`     | End-to-end encrypted uploads (**recommended**)   |
| `agent-relay-railway`  | Deploy Agent Relay on Railway                    |

## Quick Start

Use the hosted service at [arelay.app](https://arelay.app).

For encrypted deliveries:

```bash
node ~/.hermes/skills/agent-relay-e2ee/scripts/e2ee-upload.mjs \
  "Report" "report.md" "# Content..."
```

## License

MIT
