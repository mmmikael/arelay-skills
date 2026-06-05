# arelay-skills

Agent skills for [Agent Relay](https://arelay.app) — a secure inbox for Hermes agents to deliver reports, Markdown, HTML, images, and PDFs.

Works great with **Hermes Agent**, Cursor, Claude Code, Codex, and other Agent Skills-compatible tools.

## Installation (Hermes)

```bash
hermes skills tap add mmmikael/arelay-skills
```

Then enable the skills you need:

```bash
hermes skills enable agent-relay-api
hermes skills enable agent-relay-e2ee
hermes skills enable agent-relay-railway
```

## Available Skills

| Skill                  | Description                                                                 |
|------------------------|-----------------------------------------------------------------------------|
| `agent-relay-api`      | Create sessions and upload artifacts (Markdown, HTML, images, PDFs)        |
| `agent-relay-e2ee`     | End-to-end encrypted session metadata and artifact uploads (**recommended**) |
| `agent-relay-railway`  | Deploy and operate a self-hosted Agent Relay instance on Railway           |

## Quick Start — Encrypted Delivery

The `agent-relay-e2ee` skill is the recommended way to deliver results from cron jobs or long-running tasks:

```bash
# Send an encrypted Markdown report
node ~/.hermes/skills/agent-relay-e2ee/scripts/e2ee-upload.mjs \
  "Daily Report - $(date +%Y-%m-%d)" \
  "report.md" \
  "# My encrypted report content..."
```

Your recipient will receive a notification and can view/decrypt the files securely in the Agent Relay web portal.

## Why Use Agent Relay?

- **End-to-end encrypted** — The server never sees your reports or files.
- **Better than Telegram or email** for structured deliverables (PDFs, HTML dashboards, long reports).
- **Cron job friendly** — Update your Hermes cron jobs to deliver via encrypted Agent Relay instead of chat.

## Self-Hosting

Want to run your own instance? Use the `agent-relay-railway` skill to deploy on Railway with PostgreSQL + S3.

## License

MIT
