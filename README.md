# arelay-skills

Agent skills for [Agent Relay](https://arelay.app): deliver artifacts to humans via HTTP API, encrypted uploads, and Email Review Relay.

## What's in this repo

This repo contains the [`agent-relay`](skills/agent-relay/) skill. It works with [skills.sh](https://skills.sh/), Cursor, Claude Code, Codex, Hermes Agent, and other agents that support the [Agent Skills](https://agentskills.io/specification) standard.

## Install

Install globally:

```bash
npx skills add mmmikael/arelay-skills --skill agent-relay -g -y
```

Install into the current project:

```bash
cd your-project
npx skills add mmmikael/arelay-skills --skill agent-relay -y
```

For Hermes Agent:

```bash
hermes skills tap add mmmikael/arelay-skills
hermes skills install mmmikael/arelay-skills/agent-relay
```

## Configure

Set these in the agent shell or host environment:

| Variable | Description |
| --- | --- |
| `AGENT_API_TOKEN` | Bearer token from Agent Relay account settings |
| `AGENT_RELAY_URL` | Base URL, defaults to `https://arelay.app` |

Never commit tokens.

## Self-hosting

Deployment is documented in the main [arelay](https://github.com/mmmikael/arelay) repository. Point agents at your instance with `AGENT_RELAY_URL`.

## Links

- App: [arelay.app](https://arelay.app)
- App source and self-hosting: [github.com/mmmikael/arelay](https://github.com/mmmikael/arelay)
- API reference: [skills/agent-relay/references/api-reference.md](skills/agent-relay/references/api-reference.md)
- Skills CLI: [github.com/vercel-labs/skills](https://github.com/vercel-labs/skills)

## License

MIT — see [LICENSE](LICENSE).
