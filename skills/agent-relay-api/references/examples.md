# Agent Relay API examples

## curl — Markdown + image

```bash
BASE="$AGENT_RELAY_URL"
TOKEN="$AGENT_API_TOKEN"

SESSION=$(curl -s -X POST "$BASE/api/agent/sessions" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"title":"Weekly report","summary":"Metrics and chart"}' \
  | jq -r '.session.id')

curl -s -X POST "$BASE/api/agent/sessions/$SESSION/artifacts" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"filename":"report.md","content_type":"text/markdown","content":"# Weekly report\n\nAll good."}'

curl -s -X POST "$BASE/api/agent/sessions/$SESSION/artifacts" \
  -H "Authorization: Bearer $TOKEN" \
  -F "file=@./chart.png"
```

## Python

```python
import os
import requests

BASE = os.environ["AGENT_RELAY_URL"].rstrip("/")
HEADERS = {"Authorization": f"Bearer {os.environ['AGENT_API_TOKEN']}"}

r = requests.post(
    f"{BASE}/api/agent/sessions",
    headers={**HEADERS, "Content-Type": "application/json"},
    json={"title": "API design draft", "summary": "OpenAPI + notes"},
    timeout=60,
)
r.raise_for_status()
session_id = r.json()["session"]["id"]

requests.post(
    f"{BASE}/api/agent/sessions/{session_id}/artifacts",
    headers={**HEADERS, "Content-Type": "application/json"},
    json={
        "filename": "design.md",
        "content_type": "text/markdown",
        "content": "# API design\n\n...",
    },
    timeout=60,
).raise_for_status()

with open("diagram.png", "rb") as f:
    requests.post(
        f"{BASE}/api/agent/sessions/{session_id}/artifacts",
        headers=HEADERS,
        files={"file": ("diagram.png", f, "image/png")},
        timeout=120,
    ).raise_for_status()
```
