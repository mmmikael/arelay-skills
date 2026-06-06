# Agent Relay API reference

Base: `{AGENT_RELAY_URL}`  
Auth: `Authorization: Bearer <AGENT_API_TOKEN>`

All agent deliveries are **end-to-end encrypted**. Plaintext `title`, `summary`, `content`, and multipart uploads are rejected. Encrypt locally using the human's public key from `GET /api/agent/e2ee/config` (see **agent-relay-e2ee** skill).

## E2EE config

```http
GET /api/agent/e2ee/config
```

| Status | Body |
| --- | --- |
| **200** | `{ "configured": true, "publicKeyJwk": { ... } }` |
| **428** | `{ "configured": false, "publicKeyJwk": null, "error": "e2ee_required", "message": "..." }` |

## Create session

```http
POST /api/agent/sessions
Content-Type: application/json

{
  "encrypted": true,
  "encrypted_title": { "v": 1, "alg": "P-256-ECDH-A256GCM", "epk": { ... }, "iv": "...", "ciphertext": "..." },
  "encrypted_summary": { "...": "optional summary envelope" }
}
```

**201:**

```json
{
  "session": {
    "id": "uuid",
    "owner_user_id": "uuid",
    "encryption_version": "e2ee-v1",
    "encrypted_title": { "...": "envelope" },
    "encrypted_summary": null,
    "read_at": null,
    "created_at": "...",
    "updated_at": "...",
    "is_read": false
  }
}
```

Session JSON does **not** include plaintext `title` or `summary`. Decrypt `encrypted_title` / `encrypted_summary` locally if needed.

## Upload artifact

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

`encrypted_payload` is the file envelope **without** `ciphertext`; raw bytes go in `ciphertext_base64`.

**201:** `{ "artifact": { "id", "session_id", "filename", "content_type", "encryption_version", "encrypted_filename", "encrypted_content_type", "encrypted_payload", "size_bytes", "created_at" } }`

`artifact.filename` is a server placeholder (`encrypted-artifact.bin`); decrypt `encrypted_filename` for the real name.

## Update session

```http
PATCH /api/agent/sessions/<session_id>
Content-Type: application/json

{
  "encrypted": true,
  "encrypted_title": { "...": "envelope" },
  "encrypted_summary": { "...": "optional envelope" }
}
```

**200:** `{ "session": { ... } }` — same shape as create (no plaintext fields).

## Get session

```http
GET /api/agent/sessions/<session_id>
```

**200:** `{ "session": { ... } }`  
When Email Review Relay is enabled and the session is an email draft: `{ "session": { ... }, "email_draft": { "id", "session_id", "encryption_version", "status", ... } }`

## List sessions

```http
GET /api/agent/sessions
```

**200:** `{ "sessions": [ { "id", "encryption_version", "encrypted_title", "encrypted_summary", "artifact_count", ... } ] }` ordered by `updated_at` descending.

## Errors

| Status | Code | Meaning |
| --- | --- | --- |
| **401** | — | Invalid or revoked token |
| **404** | — | Unknown session |
| **413** | — | Artifact over 25 MB |
| **415** | — | Non-JSON artifact body |
| **428** | `e2ee_required` | Human has not set up encryption in the portal |
| **400** | `plaintext_not_allowed` | Missing `encrypted: true` or envelope fields |
| **507** | — | Account storage quota full |
| **503** | — | S3 not configured on server |
