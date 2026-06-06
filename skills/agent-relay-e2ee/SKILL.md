---
name: agent-relay-e2ee
description: Upload end-to-end encrypted sessions and artifacts to Agent Relay using P-256 ECDH and AES-256-GCM. Required for all agent deliveries — plaintext uploads return 400. Use when connecting agents to arelay.app or any Agent Relay instance.
license: MIT
metadata:
  author: mmmikael
  version: "1.1.0"
---

# Agent Relay E2EE uploads

The server stores only ciphertext. Decryption happens in the human's browser after they unlock their encryption key.

## Prerequisites

1. Human has set up encryption in the Agent Relay portal (passkey + recovery key).
2. Agent has `AGENT_RELAY_URL` and `AGENT_API_TOKEN`.

## Check encryption status

```http
GET /api/agent/e2ee/config
Authorization: Bearer <AGENT_API_TOKEN>
```

| Status | Response |
| --- | --- |
| **200** | `{ "configured": true, "publicKeyJwk": { ... } }` → encrypt locally before upload |
| **428** | `{ "configured": false, "publicKeyJwk": null, "error": "e2ee_required", "message": "..." }` → human must complete portal encryption setup; agent writes also return **428** |

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

**Important:** The browser uses Web Crypto `deriveKey(ECDH → AES-GCM)`. Hand-rolled Python `cryptography` ECDH/HKDF often produces incompatible ciphertext. Prefer the bundled reference script:

```bash
AGENT_RELAY_URL=https://arelay.app AGENT_API_TOKEN=ar_... \
  node scripts/e2ee-upload.mjs "Delivery title" "report.md" "# Report body"
```

(`scripts/e2ee-upload.mjs` ships with this skill.)

## Create encrypted session

```http
POST /api/agent/sessions
Content-Type: application/json

{
  "encrypted": true,
  "encrypted_title": { "...": "title envelope" },
  "encrypted_summary": { "...": "optional summary envelope" }
}
```

**201** — session object includes `id`, `encryption_version`, `encrypted_title`, `encrypted_summary`, timestamps. **No** plaintext `title` or `summary` fields in JSON.

## Upload encrypted artifact

```http
POST /api/agent/sessions/<session_id>/artifacts
Content-Type: application/json

{
  "encrypted": true,
  "encrypted_filename": { "...": "filename envelope" },
  "encrypted_content_type": { "...": "content-type envelope" },
  "encrypted_payload": {
    "v": 1,
    "alg": "P-256-ECDH-A256GCM",
    "epk": { "...": "ephemeral public JWK" },
    "iv": "base64url-no-padding"
  },
  "ciphertext_base64": "base64url-no-padding",
  "size_bytes": 12345
}
```

`encrypted_payload` is the file envelope **without** `ciphertext`; file bytes go in `ciphertext_base64`.

## Storage limits

**25 MB** per artifact, **500 MB** per account.

## Error codes

| Status | Code | Meaning |
| --- | --- | --- |
| 428 | `e2ee_required` | Human has not set up encryption in the portal |
| 400 | `plaintext_not_allowed` | Request omitted `encrypted: true` or envelope fields |
| 415 | — | Multipart / non-JSON artifact body |

## Email drafts (Email Review Relay plugin)

When `EMAIL_REVIEW_RELAY_ENABLED=true`, POST `/api/agent/email-drafts` with `encrypted: true`
and encrypted envelope fields (`encrypted_to`, `encrypted_from_email`, `encrypted_subject`,
`encrypted_html`, etc.). Plaintext drafts are rejected.

## Reference

API endpoints: [agent-relay-api/references/api-reference.md](../agent-relay-api/references/api-reference.md)
