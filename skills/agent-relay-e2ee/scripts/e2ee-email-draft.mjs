/**
 * Submit an E2EE email draft for human review (Email Review Relay).
 * Matches Web Crypto in arelay src/lib/e2ee.ts — do not hand-roll Python ECDH/HKDF.
 *
 * Usage:
 *   AGENT_RELAY_URL=https://arelay.app AGENT_API_TOKEN=ar_... \
 *     node e2ee-email-draft.mjs recipient@example.com "Subject" "<p>HTML body</p>" "Plain text"
 */
import { webcrypto } from 'node:crypto';

const relayUrl = (process.env.AGENT_RELAY_URL ?? 'https://arelay.app').replace(/\/$/, '');
const apiToken = process.env.AGENT_API_TOKEN;
if (!apiToken) {
	console.error('AGENT_API_TOKEN is required');
	process.exit(1);
}

const toAddress = process.argv[2] ?? process.env.TEST_EMAIL_TO;
const fromEmail = process.env.TEST_EMAIL_FROM ?? 'no-reply@arelay.app';
const fromName = process.env.TEST_EMAIL_FROM_NAME ?? 'Agent Relay';
const subject = process.argv[3] ?? 'Encrypted email draft';
const html =
	process.argv[4] ??
	'<p>This is an <strong>encrypted</strong> email draft submitted by <code>e2ee-email-draft.mjs</code>.</p>';
const text =
	process.argv[5] ??
	'Encrypted email draft. Open the portal to preview the HTML body and approve or reject.';

if (!toAddress) {
	console.error('Recipient required: pass as first arg or set TEST_EMAIL_TO');
	process.exit(1);
}

const TEXT_ENCODER = new TextEncoder();

function bytesToBase64Url(bytes) {
	let binary = '';
	for (const byte of bytes) binary += String.fromCharCode(byte);
	return btoa(binary).replaceAll('+', '-').replaceAll('/', '_').replaceAll('=', '');
}

function toArrayBuffer(bytes) {
	return bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength);
}

async function importPublicKey(publicKeyJwk) {
	return webcrypto.subtle.importKey(
		'jwk',
		{ kty: publicKeyJwk.kty, crv: publicKeyJwk.crv, x: publicKeyJwk.x, y: publicKeyJwk.y },
		{ name: 'ECDH', namedCurve: 'P-256' },
		true,
		[]
	);
}

async function deriveContentKey(privateKey, publicKey, usages) {
	return webcrypto.subtle.deriveKey(
		{ name: 'ECDH', public: publicKey },
		privateKey,
		{ name: 'AES-GCM', length: 256 },
		false,
		usages
	);
}

async function encryptBytes(plaintext, recipientPublicKeyJwk) {
	const recipientPublicKey = await importPublicKey(recipientPublicKeyJwk);
	const ephemeralKeyPair = await webcrypto.subtle.generateKey(
		{ name: 'ECDH', namedCurve: 'P-256' },
		true,
		['deriveKey']
	);
	const contentKey = await deriveContentKey(ephemeralKeyPair.privateKey, recipientPublicKey, [
		'encrypt'
	]);
	const iv = webcrypto.getRandomValues(new Uint8Array(12));
	const ciphertext = await webcrypto.subtle.encrypt(
		{ name: 'AES-GCM', iv: toArrayBuffer(iv) },
		contentKey,
		toArrayBuffer(plaintext)
	);
	const epk = await webcrypto.subtle.exportKey('jwk', ephemeralKeyPair.publicKey);
	return {
		v: 1,
		alg: 'P-256-ECDH-A256GCM',
		epk: { kty: epk.kty, crv: epk.crv, x: epk.x, y: epk.y },
		iv: bytesToBase64Url(iv),
		ciphertext: bytesToBase64Url(new Uint8Array(ciphertext))
	};
}

async function encryptString(plaintext, recipientPublicKeyJwk) {
	return encryptBytes(TEXT_ENCODER.encode(plaintext), recipientPublicKeyJwk);
}

async function agentFetch(path, init = {}) {
	const res = await fetch(`${relayUrl}${path}`, {
		...init,
		headers: {
			Authorization: `Bearer ${apiToken}`,
			...(init.headers ?? {})
		}
	});
	const text = await res.text();
	let body;
	try {
		body = text ? JSON.parse(text) : null;
	} catch {
		body = text;
	}
	if (!res.ok) {
		throw new Error(`${init.method ?? 'GET'} ${path} failed (${res.status}): ${JSON.stringify(body)}`);
	}
	return body;
}

let config;
try {
	config = await agentFetch('/api/agent/e2ee/config');
} catch (err) {
	if (String(err).includes('428')) {
		throw new Error(
			'E2EE is not configured for this account (428 e2ee_required). Human must complete Set up encryption in the portal.'
		);
	}
	throw err;
}
if (!config?.configured) {
	throw new Error('E2EE is not configured for this account');
}

const publicKeyJwk = config.publicKeyJwk;

const result = await agentFetch('/api/agent/email-drafts', {
	method: 'POST',
	headers: { 'Content-Type': 'application/json' },
	body: JSON.stringify({
		encrypted: true,
		encrypted_to: await encryptString(toAddress, publicKeyJwk),
		encrypted_from_email: await encryptString(fromEmail, publicKeyJwk),
		encrypted_from_name: await encryptString(fromName, publicKeyJwk),
		encrypted_subject: await encryptString(subject, publicKeyJwk),
		encrypted_html: await encryptString(html, publicKeyJwk),
		encrypted_text: await encryptString(text, publicKeyJwk),
		encrypted_session_summary: await encryptString(`To: ${toAddress}`, publicKeyJwk)
	})
});

const portalUrl = `${relayUrl}/portal/${result.session.id}`;
console.log(
	JSON.stringify(
		{
			sessionId: result.session.id,
			draftId: result.draft.id,
			status: result.draft.status,
			portalUrl,
			nextStep:
				'Human opens portalUrl, unlocks E2EE, previews HTML, then Approve (send) or Reject.'
		},
		null,
		2
	)
);
