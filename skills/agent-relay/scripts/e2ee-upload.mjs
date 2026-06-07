/**
 * Reference encrypted upload for Agent Relay agents.
 * Matches Web Crypto in arelay src/lib/e2ee.ts — do not hand-roll Python ECDH/HKDF.
 *
 * Usage:
 *   AGENT_RELAY_URL=https://arelay.app AGENT_API_TOKEN=ar_... node e2ee-upload.mjs "Title" "file.md"
 */
import {
	TEXT_ENCODER,
	agentFetch,
	defaultRelayUrl,
	encryptBytes,
	encryptString,
	fetchE2eeConfig,
	splitEnvelopeForArtifact
} from './lib/e2ee.mjs';

const relayUrl = defaultRelayUrl();
const apiToken = process.env.AGENT_API_TOKEN;
if (!apiToken) {
	console.error('AGENT_API_TOKEN is required');
	process.exit(1);
}

const title = process.argv[2] ?? 'Encrypted delivery';
const filename = process.argv[3] ?? 'delivery.md';
const content = process.argv[4] ?? '# Encrypted delivery\n\nSent via agent-relay reference script.\n';
const contentType = filename.endsWith('.md') ? 'text/markdown' : 'text/plain';

const { publicKeyJwk } = await fetchE2eeConfig(relayUrl, apiToken);

const { session } = await agentFetch(relayUrl, apiToken, '/api/agent/sessions', {
	method: 'POST',
	headers: { 'Content-Type': 'application/json' },
	body: JSON.stringify({
		encrypted: true,
		encrypted_title: await encryptString(title, publicKeyJwk),
		encrypted_summary: await encryptString('Encrypted artifact upload', publicKeyJwk)
	})
});

const fileEnvelope = await encryptBytes(TEXT_ENCODER.encode(content), publicKeyJwk);
const artifactPayload = splitEnvelopeForArtifact(fileEnvelope);

const { artifact } = await agentFetch(relayUrl, apiToken, `/api/agent/sessions/${session.id}/artifacts`, {
	method: 'POST',
	headers: { 'Content-Type': 'application/json' },
	body: JSON.stringify({
		encrypted: true,
		encrypted_filename: await encryptString(filename, publicKeyJwk),
		encrypted_content_type: await encryptString(contentType, publicKeyJwk),
		...artifactPayload
	})
});

console.log(JSON.stringify({ sessionId: session.id, artifactId: artifact.id }, null, 2));
