---
name: agent-relay-api
description: Deliver end-to-end encrypted files and reports to a human via the Agent Relay HTTP API (arelay.app). Use when sending deliverables outside chat, creating inbox sessions, uploading Markdown/HTML/images/PDFs, or when the user mentions Agent Relay, arelay, or agent inbox delivery.
license: MIT
metadata:
  author: mmmikael
  version: "1.1.0"
---

# Agent Relay API

Deliver artifacts to the human's private inbox instead of email or chat attachments. Each delivery is a **session** (one thread); files are **artifacts**.

All agent content must be **end-to-end encrypted** before upload. Load **agent-relay-e2ee** for envelope format and the reference upload script.

## When to use

- HTML pages, Markdown reports, images, PDFs, or multiple related files from one task
- Human should preview/download in the web portal

Do **not** use for short chat replies or secrets the human did not ask you to store.

## Configuration

Set in the agent environment (never commit):

| Variable | Value |
| --- | --- |
| `AGENT_RELAY_URL` | `https://arelay.app` or self-hosted base URL (no trailing slash). For Railway, use exact `RAILWAY_PUBLIC_DOMAIN` — wrong host returns 404. |
| `AGENT_API_TOKEN` | Bearer token from the human's Agent Relay account → Agent tokens |

Every request:

```http
Authorization: Bearer <AGENT_API_TOKEN>
```

The human must complete **Set up encryption** in the portal before agent deliveries work.

## Workflow

1. `GET /api/agent/e2ee/config` — if **428**, human must finish encryption setup
2. Encrypt title/summary locally; `POST /api/agent/sessions` with `encrypted: true` and envelope fields
3. Encrypt each file; `POST /api/agent/sessions/<session_id>/artifacts` (JSON only, one file per request)
4. Optionally `PATCH /api/agent/sessions/<session_id>` with new encrypted title/summary
5. Tell the human: *"Sent to Agent Relay — check your inbox"* (session id is in the API response if needed)

One session per logical delivery. Re-use the same `session_id` for all files in that delivery.

**Fastest path:** use the bundled script from **agent-relay-e2ee**:

```bash
AGENT_RELAY_URL=https://arelay.app AGENT_API_TOKEN=ar_... \
  node scripts/e2ee-upload.mjs "Delivery title" "report.md" "# Report body"
```

## Session JSON shape

API responses include `encrypted_title` and `encrypted_summary` envelopes only — **no** plaintext `title` or `summary` fields. The human's browser decrypts for display.

## Storage limits

- **25 MB** per artifact → `413`
- **500 MB** per account → `507`

## Errors

| Status | Meaning |
| --- | --- |
| `401` | Invalid or revoked token |
| `404` | Unknown session |
| `428` | E2EE not configured (`e2ee_required`) — human must set up encryption |
| `400` | Plaintext payload rejected (`plaintext_not_allowed`) |
| `413` | File too large |
| `415` | Multipart / non-JSON artifact upload |
| `507` | Account quota full |
| `503` | S3 not configured on server |

Read `{ "error": "..." }` and report to the human.

## Checklist before finishing

- [ ] Human has completed encryption setup in the portal
- [ ] Title and summary encrypted as envelopes (not plaintext JSON fields)
- [ ] Sensible filenames encrypted in `encrypted_filename`
- [ ] Human notified (portal refreshes in ~5 seconds)

## Examples

See [references/examples.md](references/examples.md).

## Encryption details

Envelope format, Web Crypto compatibility, and the reference script: **agent-relay-e2ee** skill.

## Full reference

Endpoint details: [references/api-reference.md](references/api-reference.md)
