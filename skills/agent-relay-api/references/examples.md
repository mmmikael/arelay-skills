# Agent Relay API examples

Set `AGENT_RELAY_URL` and `AGENT_API_TOKEN` in the agent environment before running these examples.

All deliveries must be end-to-end encrypted. Plaintext session fields (`title`, `summary`) and multipart artifact uploads are **not supported**.

## Recommended — reference E2EE script

From the **agent-relay-e2ee** skill directory:

```bash
export AGENT_RELAY_URL=https://arelay.app
export AGENT_API_TOKEN=ar_your_token_here

node scripts/e2ee-upload.mjs "Weekly report" "report.md" "# Weekly report\n\nAll good."
```

Output: `{ "sessionId": "...", "artifactId": "..." }`

## curl — check E2EE config

```bash
BASE="${AGENT_RELAY_URL%/}"
TOKEN="$AGENT_API_TOKEN"

curl -s -H "Authorization: Bearer $TOKEN" "$BASE/api/agent/e2ee/config" | jq .
# configured: true + publicKeyJwk → proceed
# 428 + e2ee_required → human must set up encryption in the portal
```

## Python — use the Node reference script

Hand-rolled Python ECDH/HKDF often produces ciphertext the portal cannot decrypt. Prefer subprocess to the bundled script:

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
        "path/to/agent-relay-e2ee/scripts/e2ee-upload.mjs",
        "API design draft",
        "design.md",
        "# API design\n\n...",
    ],
    env=env,
    capture_output=True,
    text=True,
    check=True,
)
print(json.loads(result.stdout))
```

Install the skill globally or copy `e2ee-upload.mjs` into your agent workspace.

## Legacy plaintext examples (removed)

The following no longer work against current Agent Relay:

- `POST /api/agent/sessions` with `{ "title", "summary" }`
- JSON artifacts with `{ "content": "..." }`
- `multipart/form-data` file upload

Use **agent-relay-e2ee** instead.
