# arelay-skills

Agent skills for [Agent Relay](https://arelay.app) — deliver artifacts to humans via HTTP API, encrypted uploads, and Railway self-hosting.

Works with [skills.sh](https://skills.sh/), [Cursor](https://cursor.com), [Claude Code](https://claude.com/product/claude-code), [Codex](https://openai.com/codex), [Hermes Agent](https://github.com/NousResearch/hermes-agent), and [60+ other agents](https://github.com/vercel-labs/skills#supported-agents) via the [Agent Skills](https://agentskills.io/specification) standard.

## Skills

| Skill | Description |
| --- | --- |
| [agent-relay-api](skills/agent-relay-api/) | Create sessions and upload artifacts (Markdown, HTML, images, PDFs) |
| [agent-relay-e2ee](skills/agent-relay-e2ee/) | End-to-end encrypted session metadata and artifact uploads |
| [agent-relay-railway](skills/agent-relay-railway/) | Deploy and operate a self-hosted Agent Relay instance on Railway |

---

## Install from anywhere

You only need **Node.js** (for `npx`). No clone required — the CLI fetches skills from GitHub.

### 1. See what’s in this repo

```bash
npx skills add mmmikael/arelay-skills --list
```

Equivalent sources (same repo):

```bash
npx skills add https://github.com/mmmikael/arelay-skills --list
npx skills add git@github.com:mmmikael/arelay-skills.git --list
```

### 2. Install everything (recommended first time)

**Global** — available in all projects on your machine:

```bash
npx skills add mmmikael/arelay-skills --all -g -y
```

**Project** — only the current repo (omit `-g`):

```bash
cd your-project
npx skills add mmmikael/arelay-skills --all -y
```

### 3. Install one skill

```bash
npx skills add mmmikael/arelay-skills --skill agent-relay-api -g -y
```

Other skills: `agent-relay-e2ee`, `agent-relay-railway`.

### 4. Target a specific agent

The CLI auto-detects installed agents. To pick explicitly:

```bash
# Cursor only
npx skills add mmmikael/arelay-skills --skill agent-relay-api -a cursor -g -y

# Claude Code only
npx skills add mmmikael/arelay-skills --skill agent-relay-api -a claude-code -g -y

# Codex only
npx skills add mmmikael/arelay-skills --skill agent-relay-api -a codex -g -y

# Hermes Agent (also supports skills CLI)
npx skills add mmmikael/arelay-skills --skill agent-relay-api -a hermes-agent -g -y
```

Install to **all** detected agents:

```bash
npx skills add mmmikael/arelay-skills --skill agent-relay-api --agent '*' -g -y
```

### 5. Where files land

| Scope | Flag | Typical path (Cursor) |
| --- | --- | --- |
| Global | `-g` | `~/.cursor/skills/agent-relay-api/` |
| Project | (default) | `.agents/skills/agent-relay-api/` in your repo |

Paths differ per agent; the CLI symlinks or copies into the right folder.

### 6. Verify installation

```bash
npx skills list
npx skills list -g
```

### 7. Update or remove

```bash
npx skills update agent-relay-api -y
npx skills remove agent-relay-api -g -y
```

### 8. Search on skills.sh

After installs, skills may appear on the [skills.sh leaderboard](https://skills.sh/):

```bash
npx skills find agent relay
```

---

## Hermes Agent (alternative install)

Hermes has its own hub CLI; either approach works.

**One skill:**

```bash
hermes skills install mmmikael/arelay-skills/skills/agent-relay-api
```

**Subscribe to the whole repo** (browse/install more later):

```bash
hermes skills tap add mmmikael/arelay-skills
hermes skills search relay
hermes skills install mmmikael/arelay-skills/agent-relay-api
```

---

## Manual install (no CLI)

Copy a skill folder into your agent’s skills directory:

```bash
# Cursor (global)
git clone https://github.com/mmmikael/arelay-skills.git /tmp/arelay-skills
cp -r /tmp/arelay-skills/skills/agent-relay-api ~/.cursor/skills/

# Claude Code (global)
cp -r /tmp/arelay-skills/skills/agent-relay-api ~/.claude/skills/

# Hermes
cp -r /tmp/arelay-skills/skills/agent-relay-api ~/.hermes/skills/
```

---

## Agent environment

Skills assume these variables when delivering to Agent Relay (set in the agent shell or host env — **never commit tokens**):

| Variable | Description |
| --- | --- |
| `AGENT_RELAY_URL` | Base URL, e.g. `https://arelay.app` (no trailing slash) |
| `AGENT_API_TOKEN` | Bearer token from the human’s Agent Relay account → Agent tokens |

---

## Links

- App: [arelay.app](https://arelay.app)
- Source code: [github.com/mmmikael/arelay](https://github.com/mmmikael/arelay)
- API reference: [skills/agent-relay-api/references/api-reference.md](skills/agent-relay-api/references/api-reference.md)
- Skills CLI: [github.com/vercel-labs/skills](https://github.com/vercel-labs/skills)

## License

MIT — see [LICENSE](LICENSE).
