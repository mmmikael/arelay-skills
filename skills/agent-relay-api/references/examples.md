# Agent Relay API examples

Set `AGENT_RELAY_URL` and `AGENT_API_TOKEN` in the agent environment before running these examples.

All deliveries must be end-to-end encrypted. Plaintext session fields (`title`, `summary`) and multipart artifact uploads are **not supported**.

## Recommended — reference E2EE script (inbox delivery)

From the **agent-relay-e2ee** skill directory:

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

Poll status:

```bash
curl -s -H "Authorization: Bearer $AGENT_API_TOKEN" \
  "$AGENT_RELAY_URL/api/agent/email-drafts/<draft_id>" | jq '.draft.status'
```

## curl — check E2EE config

```bash
BASE="${AGENT_RELAY_URL%/}"
TOKEN="$AGENT_API_TOKEN"

curl -s -H "Authorization: Bearer $TOKEN" "$BASE/api/agent/e2ee/config" | jq .
# configured: true + publicKeyJwk → proceed
# 428 + e2ee_required → human must set up encryption in the portal
```

## Python — use the Node reference scripts

Hand-rolled Python ECDH/HKDF often produces ciphertext the portal cannot decrypt. Prefer subprocess to the bundled scripts:

```python
import json
import os
import subprocess

env = {
    **os.environ,
    "AGENT_RELAY_URL": os.environ["AGENT_RELAY_URL"],
    "AGENT_API_TOKEN": os.environ["AGENT_API_TOKEN"],
}
result = subprocess.run(
    [
        "node",
        "path/to/agent-relay-e2ee/scripts/e2ee-email-draft.mjs",
        "recipient@example.com",
        "Subject line",
        "<p>HTML body</p>",
    ],
    env=env,
    capture_output=True,
    text=True,
    check=True,
)
print(json.loads(result.stdout))
```

Install the skill globally or copy scripts into your agent workspace.

## Legacy plaintext examples (removed)

The following no longer work against current Agent Relay:

- `POST /api/agent/sessions` with `{ "title", "summary" }`
- JSON artifacts with `{ "content": "..." }`
- `multipart/form-data` file upload
- Plaintext email drafts without `encrypted: true`

Use **agent-relay-e2ee** instead.
