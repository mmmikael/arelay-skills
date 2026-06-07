# Agent Relay examples

Set `AGENT_RELAY_URL` and `AGENT_API_TOKEN` in the agent environment before running these examples.

All deliveries must be end-to-end encrypted. Plaintext session fields (`title`, `summary`) and multipart artifact uploads are **not supported**.

## Recommended — reference E2EE script (inbox delivery)

From the **agent-relay** skill directory:

```bash
export AGENT_RELAY_URL=https://arelay.app
export AGENT_API_TOKEN=ar_your_token_here

node scripts/e2ee-upload.mjs "Weekly report" "report.md" "# Weekly report\n\nAll good."
```

Output: `{ "sessionId": "...", "artifactId": "..." }`

## Email Review Relay — reference email draft script

Requires Email Review Relay (enabled on [arelay.app](https://arelay.app); self-hosters need `EMAIL_REVIEW_RELAY_ENABLED=true`). Human must configure **Account → Email sending (Cloudflare API)** before approving sends.

```bash
export AGENT_RELAY_URL=https://arelay.app
export AGENT_API_TOKEN=ar_your_token_here

node scripts/e2ee-email-draft.mjs recipient@example.com "Weekly update" \
  "<p>Hello — please review this draft in your inbox.</p>" \
  "Hello — please review this draft in your inbox."
```

Output includes `sessionId`, `draftId`, `status: "pending"`, and `portalUrl`. Human opens the portal session, previews HTML, then **Approve** or **Reject**.

## Poll email draft status

After exporting `AGENT_RELAY_URL` and `AGENT_API_TOKEN`, call **`GET /api/agent/email-drafts/<draft_id>`** with Agent Relay bearer auth (see [api-reference.md](api-reference.md)). Read `draft.status` (`pending`, `approved`, `rejected`, or `sent`).

## Check E2EE config

Call **`GET /api/agent/e2ee/config`** with the same auth. When `configured` is true and `publicKeyJwk` is present, proceed with the E2EE scripts. HTTP **428** with `e2ee_required` means the human must finish encryption setup in the portal.

## Python agents

Hand-rolled Python ECDH/HKDF often produces ciphertext the portal cannot decrypt. Run the bundled Node reference scripts from a shell (Hermes exec/bash) so they inherit `AGENT_RELAY_URL` and `AGENT_API_TOKEN`, then parse the JSON printed to stdout:

- `node …/agent-relay/scripts/e2ee-upload.mjs …`
- `node …/agent-relay/scripts/e2ee-email-draft.mjs …`

Install the skill globally or copy scripts into your agent workspace.

## Legacy plaintext examples (removed)

The following no longer work against current Agent Relay:

- `POST /api/agent/sessions` with `{ "title", "summary" }`
- JSON artifacts with `{ "content": "..." }`
- `multipart/form-data` file upload
- Plaintext email drafts without `encrypted: true`

Use the **agent-relay** skill and bundled scripts instead.
