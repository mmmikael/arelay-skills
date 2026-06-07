---
name: agent-relay
description: Deliver end-to-end encrypted files, reports, and email drafts to a human via the Agent Relay HTTP API (arelay.app). Use when sending deliverables outside chat, creating inbox sessions, uploading Markdown/HTML/images/PDFs, submitting outbound email for human review, encrypting with Web Crypto–compatible envelopes, or when the user mentions Agent Relay, arelay, or agent inbox delivery.
license: MIT
metadata:
  author: mmmikael
  version: "2.0.0"
---

# Agent Relay

Deliver artifacts to the human's private inbox instead of chat attachments. Each delivery is a **session** (one thread); files are **artifacts**.

The **Email Review Relay** plugin lets agents submit **outbound email drafts** for human approve/reject before send. On [arelay.app](https://arelay.app) it is enabled by default; self-hosters set `EMAIL_REVIEW_RELAY_ENABLED=true`.

All agent content must be **end-to-end encrypted** before upload. Plaintext fields and multipart uploads return **400**.

## When to use

**Inbox deliveries (sessions + artifacts):**

- HTML pages, Markdown reports, images, PDFs, or multiple related files from one task
- Human should preview/download in the web portal

**Email Review Relay (encrypted email drafts):**

- Agent needs to send real email to an external recipient but human must review first
- Outbound mail should appear in the same inbox as other agent deliveries
- Human approves send via their Cloudflare Email Sending credentials in the portal

Do **not** use for short chat replies or secrets the human did not ask you to store.

## Configuration

Set in the agent environment (never commit):

| Variable | Value |
| --- | --- |
| `AGENT_RELAY_URL` | `https://arelay.app` or self-hosted base URL (no trailing slash). Use the exact public domain your human deployed — wrong host returns 404. Self-hosting setup: [github.com/mmmikael/arelay](https://github.com/mmmikael/arelay). |
| `AGENT_API_TOKEN` | Bearer token from the human's Agent Relay account → Agent tokens |

Every request:

```http
Authorization: Bearer <AGENT_API_TOKEN>
```

The human must complete **Set up encryption** in the portal before agent deliveries work.

## E2EE prerequisites

```http
GET /api/agent/e2ee/config
Authorization: Bearer <AGENT_API_TOKEN>
```

| Status | Response |
| --- | --- |
| **200** | `{ "configured": true, "publicKeyJwk": { ... } }` → encrypt locally before upload |
| **428** | `{ "configured": false, "error": "e2ee_required", ... }` → human must finish portal encryption setup |

## Envelope format

Each encrypted string or file uses:

```json
{
  "v": 1,
  "alg": "P-256-ECDH-A256GCM",
  "epk": { "kty": "EC", "crv": "P-256", "x": "...", "y": "..." },
  "iv": "base64url-no-padding",
  "ciphertext": "base64url-no-padding"
}
```

Use P-256 ECDH with the relay `publicKeyJwk`, derive AES-256-GCM key, fresh ephemeral key + IV per field/file.

**Important:** The browser uses Web Crypto `deriveKey(ECDH → AES-GCM)`. Hand-rolled Python `cryptography` ECDH/HKDF often produces incompatible ciphertext. Prefer the bundled Node reference scripts under `scripts/` (requires Node.js 18+).

Artifact uploads split the file envelope: `encrypted_payload` omits `ciphertext`; file bytes go in `ciphertext_base64`.

## Workflow — inbox deliveries

1. `GET /api/agent/e2ee/config` — if **428**, human must finish encryption setup
2. Encrypt title/summary locally; `POST /api/agent/sessions` with `encrypted: true` and envelope fields
3. Encrypt each file; `POST /api/agent/sessions/<session_id>/artifacts` (JSON only, one file per request)
4. Optionally `PATCH /api/agent/sessions/<session_id>` with new encrypted title/summary
5. Tell the human: *"Sent to Agent Relay — check your inbox"* (session id is in the API response if needed)

One session per logical delivery. Re-use the same `session_id` for all files in that delivery.

**Fastest path:**

```bash
AGENT_RELAY_URL=https://arelay.app AGENT_API_TOKEN=ar_... \
  node scripts/e2ee-upload.mjs "Delivery title" "report.md" "# Report body"
```

## Workflow — email drafts (Email Review Relay)

**Human setup (portal):** **Account → Email sending (Cloudflare API)** — save Cloudflare Account ID and API token (encrypted server-side; used only on **Approve**). System `CLOUDFLARE_*` env vars on the server are for signup verification only.

**Agent workflow:**

1. `GET /api/agent/e2ee/config` — same E2EE prerequisite as inbox deliveries
2. Encrypt draft fields; `POST /api/agent/email-drafts` with `encrypted: true`
3. Tell the human to open the inbox session, preview HTML, and **Approve** or **Reject**
4. Poll `GET /api/agent/email-drafts/{id}` or `GET /api/agent/sessions/{id}` for `status` (`pending` → `approved` / `rejected` / `sent` / `failed`)

**Fastest path:**

```bash
AGENT_RELAY_URL=https://arelay.app AGENT_API_TOKEN=ar_... \
  node scripts/e2ee-email-draft.mjs recipient@example.com "Subject" "<p>HTML</p>"
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
| `404` | Unknown session/draft, or Email Review Relay plugin disabled on server |
| `428` | E2EE not configured (`e2ee_required`) — human must set up encryption |
| `400` | Plaintext payload rejected (`plaintext_not_allowed`) or invalid draft body |
| `413` | File too large |
| `415` | Multipart / non-JSON artifact upload |
| `507` | Account quota full |
| `503` | S3 not configured on server |

Read `{ "error": "..." }` and report to the human.

## Checklist before finishing

- [ ] Human has completed encryption setup in the portal
- [ ] Title and summary encrypted as envelopes (not plaintext JSON fields)
- [ ] Sensible filenames encrypted in `encrypted_filename`
- [ ] For email drafts: human has configured Cloudflare Email Sending in Account (if they will approve sends)
- [ ] Human notified (portal refreshes in ~5 seconds)

## Examples

See [references/examples.md](references/examples.md).

## Full reference

Endpoint details: [references/api-reference.md](references/api-reference.md)
